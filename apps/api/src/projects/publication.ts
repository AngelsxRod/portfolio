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
  Req,
} from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { requireWebOrigin, Public } from "../auth/auth.js";
import { DatabaseService } from "../database.js";
import { projects } from "../db/schema.js";
import { projectId } from "./drafts.js";

const order = [
  asc(projects.position),
  asc(projects.createdAt),
  asc(projects.id),
];

@Injectable()
export class PublicationService {
  private readonly logger = new Logger(PublicationService.name);

  constructor(private readonly database: DatabaseService) {}

  listPublished() {
    return this.database
      .getDatabase()
      .select()
      .from(projects)
      .where(eq(projects.status, "published"))
      .orderBy(...order);
  }

  async publicProject(slug: string) {
    const [project] = await this.database
      .getDatabase()
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.status, "published")))
      .limit(1);
    if (!project) throw new NotFoundException("Proyecto no encontrado.");
    return project;
  }

  async publish(id: string) {
    const [draft] = await this.database
      .getDatabase()
      .select({ summary: projects.summary, description: projects.description })
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.status, "draft")))
      .limit(1);
    if (!draft) throw new NotFoundException("Borrador no encontrado.");
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
    const [project] = await this.database
      .getDatabase()
      .update(projects)
      .set({ status: "draft", updatedAt: new Date() })
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

  @Get("published")
  @Header("Cache-Control", "no-store")
  published() {
    return this.publication.listPublished();
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
  list() {
    return this.publication.listPublished();
  }

  @Public()
  @Get(":slug")
  @Header("Cache-Control", "no-store")
  get(@Param("slug") slug: string) {
    return this.publication.publicProject(slug);
  }
}
