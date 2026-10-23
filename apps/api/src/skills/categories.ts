import {
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
import { asc, eq, sql } from "drizzle-orm";
import { requireWebOrigin } from "../auth/auth.js";
import { DatabaseService } from "../database.js";
import { skillCategories } from "../db/schema.js";
import { invalid, projectId as uuid } from "../projects/drafts.js";

type CategoryInput = { name: string; position: number };

function categoryInput(body: unknown): CategoryInput {
  if (!body || typeof body !== "object" || Array.isArray(body))
    invalid({ form: "Se esperaba un objeto." });
  const data = body as Record<string, unknown>;
  const fields: Record<string, string> = {};
  if (Object.keys(data).some((key) => !["name", "position"].includes(key)))
    fields.form = "La solicitud contiene campos no permitidos.";
  let name = "";
  if (typeof data.name !== "string") fields.name = "Introduce texto válido.";
  else {
    name = data.name.trim();
    if (!name || name.length > 80) fields.name = "Usa entre 1 y 80 caracteres.";
  }
  const position = data.position ?? 0;
  if (
    typeof position !== "number" ||
    !Number.isInteger(position) ||
    position < 0 ||
    position > 2147483647
  )
    fields.position = "Introduce un entero entre 0 y 2147483647.";
  if (Object.keys(fields).length) invalid(fields);
  return { name, position: position as number };
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
    cause.constraint === "skill_categories_name_lower_idx"
  ) {
    throw new ConflictException({
      message: "La categoría ya existe.",
      fields: { name: "Elige otro nombre; no distingue mayúsculas." },
    });
  }
  throw error;
}

const columns = {
  id: skillCategories.id,
  name: skillCategories.name,
  position: skillCategories.position,
  skillCount:
    sql<number>`(select count(*)::int from skills where skills.category_id = "skill_categories"."id")`.as(
      "skill_count",
    ),
  createdAt: skillCategories.createdAt,
  updatedAt: skillCategories.updatedAt,
};

@Injectable()
export class SkillCategoriesService {
  private readonly logger = new Logger(SkillCategoriesService.name);

  constructor(private readonly database: DatabaseService) {}

  list() {
    return this.database
      .getDatabase()
      .select(columns)
      .from(skillCategories)
      .orderBy(
        asc(skillCategories.position),
        asc(skillCategories.name),
        asc(skillCategories.id),
      );
  }

  async get(id: string) {
    const [category] = await this.database
      .getDatabase()
      .select(columns)
      .from(skillCategories)
      .where(eq(skillCategories.id, id))
      .limit(1);
    if (!category) throw new NotFoundException("Categoría no encontrada.");
    return category;
  }

  async create(input: CategoryInput) {
    try {
      const [created] = await this.database
        .getDatabase()
        .insert(skillCategories)
        .values(input)
        .returning({ id: skillCategories.id });
      this.logger.log({ action: "skillCategory.created", id: created?.id });
      return this.get(created!.id);
    } catch (error) {
      handleWriteError(error);
    }
  }

  async update(id: string, input: CategoryInput) {
    try {
      const [updated] = await this.database
        .getDatabase()
        .update(skillCategories)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(skillCategories.id, id))
        .returning({ id: skillCategories.id });
      if (!updated) throw new NotFoundException("Categoría no encontrada.");
      this.logger.log({ action: "skillCategory.updated", id });
      return this.get(id);
    } catch (error) {
      handleWriteError(error);
    }
  }
}

type OriginRequest = { headers: { origin?: string } };

@Controller("admin/skill-categories")
export class SkillCategoriesController {
  constructor(private readonly categories: SkillCategoriesService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  list() {
    return this.categories.list();
  }

  @Get(":id")
  @Header("Cache-Control", "no-store")
  get(@Param("id") id: string) {
    return this.categories.get(uuid(id));
  }

  @Post()
  @Header("Cache-Control", "no-store")
  create(@Body() body: unknown, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.categories.create(categoryInput(body));
  }

  @Put(":id")
  @Header("Cache-Control", "no-store")
  update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() request: OriginRequest,
  ) {
    requireWebOrigin(request.headers.origin);
    return this.categories.update(uuid(id), categoryInput(body));
  }
}
