import {
  BadRequestException,
  Controller,
  Get,
  Header,
  HttpCode,
  Injectable,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { and, asc, count, eq, isNotNull, ne } from "drizzle-orm";
import { requireWebOrigin, Public } from "../auth/auth.js";
import { DatabaseService } from "../database.js";
import { projects } from "../db/schema.js";
import { handleWriteError, projectId } from "./drafts.js";
import { MediaService } from "./media.js";
import { type PageParams, paginate, pageParams } from "../common/pagination.js";

/** Los cambios pendientes son privados: nunca salen en las rutas públicas. */
function withoutPending<T extends { pending?: unknown }>(row: T) {
  const { pending: _pending, ...rest } = row;
  return rest;
}

const order = [
  asc(projects.position),
  asc(projects.createdAt),
  asc(projects.id),
];

@Injectable()
export class PublicationService {
  private readonly logger = new Logger(PublicationService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly media: MediaService,
  ) {}

  async adminProject(id: string) {
    const [project] = await this.database
      .getDatabase()
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    if (!project) throw new NotFoundException("Proyecto no encontrado.");
    return { ...project, media: await this.media.metadataForProjects([id]) };
  }

  async listPublished(params: PageParams, includePending = false) {
    const db = this.database.getDatabase();
    const published = eq(projects.status, "published");
    const [rows, [totals]] = await Promise.all([
      db
        .select()
        .from(projects)
        .where(published)
        .orderBy(...order)
        .limit(params.pageSize)
        .offset(params.offset),
      db.select({ total: count() }).from(projects).where(published),
    ]);
    const items = await this.withMedia(rows, includePending);
    return paginate(items, totals?.total ?? 0, params);
  }

  private async withMedia<T extends { id: string; pending?: unknown }>(
    rows: T[],
    includePending = false,
  ) {
    const media = await this.media.metadataForProjects(
      rows.map((row) => row.id),
    );
    return rows.map((row) => ({
      ...(includePending ? row : withoutPending(row)),
      featuredMediaId:
        media.find((image) => image.projectId === row.id && image.isFeatured)
          ?.id ??
        media.find((image) => image.projectId === row.id)?.id ??
        null,
      media: media.filter((image) => image.projectId === row.id),
    }));
  }

  /** Recomienda por tecnologías compartidas; sin coincidencias, completa por orden. */
  async relatedProjects(slug: string, limit = 3) {
    const db = this.database.getDatabase();
    const [current] = await db
      .select({
        id: projects.id,
        technologies: projects.technologies,
        projectType: projects.projectType,
      })
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.status, "published")))
      .limit(1);
    if (!current) throw new NotFoundException("Proyecto no encontrado.");
    const others = await db
      .select()
      .from(projects)
      .where(and(eq(projects.status, "published"), ne(projects.id, current.id)))
      .orderBy(...order);
    const wanted = new Set(
      current.technologies.map((name) => name.toLowerCase()),
    );
    const ranked = others
      .map((project) => ({
        project,
        shared: new Set(
          project.technologies
            .map((name) => name.toLowerCase())
            .filter((name) => wanted.has(name)),
        ).size,
        sameType:
          Boolean(current.projectType) &&
          project.projectType === current.projectType,
      }))
      // sort es estable: el empate final conserva el orden de `order`.
      .sort(
        (a, b) =>
          b.shared - a.shared || Number(b.sameType) - Number(a.sameType),
      );
    const withShared = ranked.filter((entry) => entry.shared > 0);
    const picked = (withShared.length ? withShared : ranked).slice(0, limit);
    return this.withMedia(picked.map((entry) => entry.project));
  }

  async publicProject(slug: string) {
    const [project] = await this.database
      .getDatabase()
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.status, "published")))
      .limit(1);
    if (!project) throw new NotFoundException("Proyecto no encontrado.");
    const media = await this.media.metadataForProjects([project.id]);
    return {
      ...withoutPending(project),
      featuredMediaId:
        media.find((image) => image.isFeatured)?.id ?? media[0]?.id ?? null,
      media,
    };
  }

  async publish(id: string) {
    const [current] = await this.database
      .getDatabase()
      .select({ status: projects.status, pending: projects.pending })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    if (current?.status === "published") {
      const pending = current.pending as {
        summary: string | null;
        description: string | null;
      } | null;
      if (!pending) throw new NotFoundException("No hay cambios pendientes.");
      this.requireContent(pending);
      try {
        const [project] = await this.database
          .getDatabase()
          .update(projects)
          .set({
            ...(pending as Record<string, unknown>),
            pending: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projects.id, id),
              eq(projects.status, "published"),
              isNotNull(projects.pending),
            ),
          )
          .returning();
        if (!project) throw new NotFoundException("No hay cambios pendientes.");
        this.logger.log({ action: "project.applied", projectId: project.id });
        return project;
      } catch (error) {
        handleWriteError(error);
      }
    }
    return this.publishDraft(id);
  }

  async discard(id: string) {
    const [project] = await this.database
      .getDatabase()
      .update(projects)
      .set({ pending: null, updatedAt: new Date() })
      .where(
        and(
          eq(projects.id, id),
          eq(projects.status, "published"),
          isNotNull(projects.pending),
        ),
      )
      .returning();
    if (!project) throw new NotFoundException("No hay cambios pendientes.");
    this.logger.log({ action: "project.discarded", projectId: project.id });
    return project;
  }

  private requireContent(draft: {
    summary: string | null;
    description: string | null;
  }) {
    const fields: Record<string, string> = {};
    if (!draft.summary?.trim())
      fields.summary = "Añade un resumen para publicar.";
    if (!draft.description?.trim())
      fields.description = "Añade una descripción para publicar.";
    if (Object.keys(fields).length) {
      throw new BadRequestException({
        message: "Completa el proyecto antes de publicarlo.",
        fields,
      });
    }
  }

  private async publishDraft(id: string) {
    const [draft] = await this.database
      .getDatabase()
      .select({ summary: projects.summary, description: projects.description })
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.status, "draft")))
      .limit(1);
    if (!draft) throw new NotFoundException("Borrador no encontrado.");
    this.requireContent(draft);
    const [project] = await this.database
      .getDatabase()
      .update(projects)
      .set({ status: "published", updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.status, "draft")))
      .returning();
    if (!project) throw new NotFoundException("Borrador no encontrado.");
    this.logger.log({ action: "project.published", projectId: project.id });
    return project;
  }

  async unpublish(id: string) {
    const [current] = await this.database
      .getDatabase()
      .select({ pending: projects.pending })
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.status, "published")))
      .limit(1);
    // Al retirar, el borrador es la última versión en la que se trabajó.
    const applied = current?.pending
      ? (current.pending as Record<string, unknown>)
      : {};
    try {
      return await this.retire(id, applied);
    } catch (error) {
      handleWriteError(error);
    }
  }

  private async retire(id: string, applied: object) {
    const [project] = await this.database
      .getDatabase()
      .update(projects)
      .set({
        ...applied,
        pending: null,
        status: "draft",
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.status, "published")))
      .returning();
    if (!project)
      throw new NotFoundException("Proyecto publicado no encontrado.");
    this.logger.log({ action: "project.unpublished", projectId: project.id });
    return project;
  }
}

@Controller("admin/projects")
export class PublicationController {
  constructor(private readonly publication: PublicationService) {}

  @Get(":id")
  @Header("Cache-Control", "no-store")
  get(@Param("id") id: string) {
    return this.publication.adminProject(projectId(id));
  }

  @Get("published")
  @Header("Cache-Control", "no-store")
  published(@Query() query: Record<string, unknown>) {
    return this.publication.listPublished(pageParams(query), true);
  }

  @Post(":id/publish")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  publish(
    @Param("id") id: string,
    @Req() request: { headers: { origin?: string } },
  ) {
    requireWebOrigin(request.headers.origin);
    return this.publication.publish(projectId(id));
  }

  @Post(":id/discard")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  discard(
    @Param("id") id: string,
    @Req() request: { headers: { origin?: string } },
  ) {
    requireWebOrigin(request.headers.origin);
    return this.publication.discard(projectId(id));
  }

  @Post(":id/unpublish")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  unpublish(
    @Param("id") id: string,
    @Req() request: { headers: { origin?: string } },
  ) {
    requireWebOrigin(request.headers.origin);
    return this.publication.unpublish(projectId(id));
  }
}

@Controller("projects")
export class PublicProjectsController {
  constructor(private readonly publication: PublicationService) {}

  @Public()
  @Get()
  @Header("Cache-Control", "no-store")
  list(@Query() query: Record<string, unknown>) {
    return this.publication.listPublished(pageParams(query));
  }

  @Public()
  @Get(":slug")
  @Header("Cache-Control", "no-store")
  get(@Param("slug") slug: string) {
    return this.publication.publicProject(slug);
  }

  @Public()
  @Get(":slug/related")
  @Header("Cache-Control", "no-store")
  related(@Param("slug") slug: string) {
    return this.publication.relatedProjects(slug);
  }
}
