import {
  Body,
  ConflictException,
  Controller,
  Get,
  Header,
  HttpCode,
  Injectable,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { Public, requireWebOrigin } from "../auth/auth.js";
import { DatabaseService } from "../database.js";
import { skills } from "../db/schema.js";
import { invalid, projectId as uuid } from "../projects/drafts.js";

type SkillInput = { name: string; category: string; position: number };

const order = [
  asc(skills.position),
  asc(skills.category),
  asc(skills.name),
  asc(skills.id),
];

function skillInput(body: unknown): SkillInput {
  if (!body || typeof body !== "object" || Array.isArray(body))
    invalid({ form: "Se esperaba un objeto." });
  const data = body as Record<string, unknown>;
  const fields: Record<string, string> = {};
  if (
    Object.keys(data).some(
      (key) => !["name", "category", "position"].includes(key),
    )
  )
    fields.form = "La solicitud contiene campos no permitidos.";
  function text(key: "name" | "category") {
    const value = data[key];
    if (typeof value !== "string") {
      fields[key] = "Introduce texto válido.";
      return "";
    }
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 80)
      fields[key] = "Usa entre 1 y 80 caracteres.";
    return trimmed;
  }
  const name = text("name");
  const category = text("category");
  const position = data.position ?? 0;
  if (
    typeof position !== "number" ||
    !Number.isInteger(position) ||
    position < 0 ||
    position > 2147483647
  )
    fields.position = "Introduce un entero entre 0 y 2147483647.";
  if (Object.keys(fields).length) invalid(fields);
  return { name, category, position: position as number };
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
    cause.constraint === "skills_name_lower_idx"
  ) {
    throw new ConflictException({
      message: "La habilidad ya existe.",
      fields: { name: "Elige otro nombre; no distingue mayúsculas." },
    });
  }
  throw error;
}

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(private readonly database: DatabaseService) {}

  list() {
    return this.database
      .getDatabase()
      .select()
      .from(skills)
      .orderBy(...order);
  }

  listPublished() {
    return this.database
      .getDatabase()
      .select({
        id: skills.id,
        name: skills.name,
        category: skills.category,
        position: skills.position,
      })
      .from(skills)
      .where(eq(skills.status, "published"))
      .orderBy(...order);
  }

  async get(id: string) {
    const [skill] = await this.database
      .getDatabase()
      .select()
      .from(skills)
      .where(eq(skills.id, id))
      .limit(1);
    if (!skill) throw new NotFoundException("Habilidad no encontrada.");
    return skill;
  }

  async create(input: SkillInput) {
    try {
      const [skill] = await this.database
        .getDatabase()
        .insert(skills)
        .values({ ...input, status: "draft" })
        .returning();
      this.logger.log({ action: "skill.created", skillId: skill?.id });
      return skill;
    } catch (error) {
      handleWriteError(error);
    }
  }

  async update(id: string, input: SkillInput) {
    try {
      const [skill] = await this.database
        .getDatabase()
        .update(skills)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(skills.id, id), eq(skills.status, "draft")))
        .returning();
      if (!skill) throw new NotFoundException("Borrador no encontrado.");
      this.logger.log({ action: "skill.updated", skillId: skill.id });
      return skill;
    } catch (error) {
      handleWriteError(error);
    }
  }

  async publish(id: string) {
    const [skill] = await this.database
      .getDatabase()
      .update(skills)
      .set({ status: "published", updatedAt: new Date() })
      .where(and(eq(skills.id, id), eq(skills.status, "draft")))
      .returning();
    if (!skill) throw new NotFoundException("Borrador no encontrado.");
    this.logger.log({ action: "skill.published", skillId: skill.id });
    return skill;
  }

  async unpublish(id: string) {
    const [skill] = await this.database
      .getDatabase()
      .update(skills)
      .set({ status: "draft", updatedAt: new Date() })
      .where(and(eq(skills.id, id), eq(skills.status, "published")))
      .returning();
    if (!skill)
      throw new NotFoundException("Habilidad publicada no encontrada.");
    this.logger.log({ action: "skill.unpublished", skillId: skill.id });
    return skill;
  }
}

type OriginRequest = { headers: { origin?: string } };

@Controller("admin/skills")
export class AdminSkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  list() {
    return this.skills.list();
  }

  @Get(":id")
  @Header("Cache-Control", "no-store")
  get(@Param("id") id: string) {
    return this.skills.get(uuid(id));
  }

  @Post()
  @Header("Cache-Control", "no-store")
  create(@Body() body: unknown, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.skills.create(skillInput(body));
  }

  @Put(":id")
  @Header("Cache-Control", "no-store")
  update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() request: OriginRequest,
  ) {
    requireWebOrigin(request.headers.origin);
    return this.skills.update(uuid(id), skillInput(body));
  }

  @Post(":id/publish")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  publish(@Param("id") id: string, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.skills.publish(uuid(id));
  }

  @Post(":id/unpublish")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  unpublish(@Param("id") id: string, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.skills.unpublish(uuid(id));
  }
}

@Controller("skills")
export class PublicSkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Public()
  @Get()
  @Header("Cache-Control", "no-store")
  list() {
    return this.skills.listPublished();
  }
}
