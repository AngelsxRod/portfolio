import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Header,
  Injectable,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { DatabaseService } from "../database.js";
import { projects } from "../db/schema.js";
import { requireWebOrigin } from "../auth/auth.js";

type DraftInput = {
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  demoUrl: string | null;
  codeUrl: string | null;
  technologies: string[];
  position: number;
};

export function invalid(fields: Record<string, string>): never {
  throw new BadRequestException({
    message: "Revisa los campos indicados.",
    fields,
  });
}

function draftInput(body: unknown): DraftInput {
  if (!body || typeof body !== "object" || Array.isArray(body))
    invalid({ form: "Se esperaba un objeto." });
  const data = body as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const allowed = [
    "title",
    "slug",
    "summary",
    "description",
    "demoUrl",
    "codeUrl",
    "technologies",
    "position",
  ];
  if (Object.keys(data).some((key) => !allowed.includes(key)))
    fields.form = "La solicitud contiene campos no permitidos.";
  function text(key: string, max: number, required = false): string | null {
    const value = data[key];
    if (!required && (value === undefined || value === null)) return null;
    if (typeof value !== "string") {
      fields[key] = "Introduce texto válido.";
      return null;
    }
    const trimmed = value.trim();
    if ((required && !trimmed) || trimmed.length > max)
      fields[key] =
        `Usa ${required ? "entre 1 y" : "hasta"} ${max} caracteres.`;
    return trimmed || null;
  }
  const title = text("title", 200, true) ?? "";
  const slug = text("slug", 160, true) ?? "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    fields.slug = "Usa letras minúsculas, números y guiones entre palabras.";
  const summary = text("summary", 1000);
  const description = text("description", 50000);
  function url(key: string) {
    const value = text(key, 2048);
    if (value) {
      try {
        const parsed = new URL(value);
        if (
          !["http:", "https:"].includes(parsed.protocol) ||
          parsed.username ||
          parsed.password
        )
          throw new Error();
      } catch {
        fields[key] = "Introduce una URL HTTP o HTTPS sin credenciales.";
      }
    }
    return value;
  }
  const demoUrl = url("demoUrl");
  const codeUrl = url("codeUrl");
  const rawTechnologies = data.technologies ?? [];
  let technologies: string[] = [];
  if (
    !Array.isArray(rawTechnologies) ||
    rawTechnologies.length > 30 ||
    rawTechnologies.some(
      (item) =>
        typeof item !== "string" || !item.trim() || item.trim().length > 80,
    )
  ) {
    fields.technologies = "Usa hasta 30 tecnologías de 1 a 80 caracteres.";
  } else
    technologies = [
      ...new Set(rawTechnologies.map((item: string) => item.trim())),
    ];
  const position = data.position ?? 0;
  if (
    typeof position !== "number" ||
    !Number.isInteger(position) ||
    position < 0 ||
    position > 2147483647
  )
    fields.position = "Introduce un entero entre 0 y 2147483647.";
  if (Object.keys(fields).length) invalid(fields);
  return {
    title,
    slug,
    summary,
    description,
    demoUrl,
    codeUrl,
    technologies,
    position: position as number,
  };
}

export function projectId(id: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    throw new BadRequestException("Identificador inválido.");
  return id;
}

function handleWriteError(error: unknown): never {
  // Drizzle wraps the PostgreSQL error; expose only the known domain conflict.
  const cause =
    error instanceof Error && "cause" in error ? error.cause : error;
  if (
    cause &&
    typeof cause === "object" &&
    "code" in cause &&
    cause.code === "23505" &&
    "constraint" in cause &&
    cause.constraint === "projects_slug_unique"
  ) {
    throw new ConflictException({
      message: "El slug ya está en uso.",
      fields: { slug: "Elige otro slug." },
    });
  }
  throw error;
}

@Injectable()
export class DraftsService {
  private readonly logger = new Logger(DraftsService.name);

  constructor(private readonly database: DatabaseService) {}

  list() {
    return this.database
      .getDatabase()
      .select()
      .from(projects)
      .where(eq(projects.status, "draft"))
      .orderBy(
        asc(projects.position),
        asc(projects.createdAt),
        asc(projects.id),
      );
  }

  async get(id: string) {
    const [draft] = await this.database
      .getDatabase()
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.status, "draft")))
      .limit(1);
    if (!draft) throw new NotFoundException("Borrador no encontrado.");
    return draft;
  }

  async create(input: DraftInput, retryId?: string) {
    try {
      const [draft] = await this.database
        .getDatabase()
        .insert(projects)
        .values({
          ...input,
          status: "draft",
          ...(retryId ? { id: retryId } : {}),
        })
        .onConflictDoNothing({ target: projects.id })
        .returning();
      if (!draft && retryId) return this.update(retryId, input);
      this.logger.log({ action: "draft.created", projectId: draft?.id });
      return draft;
    } catch (error) {
      handleWriteError(error);
    }
  }

  async update(id: string, input: DraftInput) {
    try {
      const [draft] = await this.database
        .getDatabase()
        .update(projects)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(projects.id, id), eq(projects.status, "draft")))
        .returning();
      if (!draft) throw new NotFoundException("Borrador no encontrado.");
      this.logger.log({ action: "draft.updated", projectId: draft.id });
      return draft;
    } catch (error) {
      handleWriteError(error);
    }
  }
}

@Controller("admin/projects/drafts")
export class DraftsController {
  constructor(private readonly drafts: DraftsService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  list() {
    return this.drafts.list();
  }

  @Get(":id")
  @Header("Cache-Control", "no-store")
  get(@Param("id") id: string) {
    return this.drafts.get(projectId(id));
  }

  @Post()
  @Header("Cache-Control", "no-store")
  create(
    @Body() body: unknown,
    @Req()
    request: { headers: { origin?: string; "idempotency-key"?: string } },
  ) {
    requireWebOrigin(request.headers.origin);
    const key = request.headers["idempotency-key"];
    return this.drafts.create(
      draftInput(body),
      key ? projectId(key) : undefined,
    );
  }

  @Put(":id")
  @Header("Cache-Control", "no-store")
  update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req()
    request: { headers: { origin?: string; "idempotency-key"?: string } },
  ) {
    requireWebOrigin(request.headers.origin);
    return this.drafts.update(projectId(id), draftInput(body));
  }
}
