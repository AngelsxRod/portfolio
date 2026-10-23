import {
  Body,
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
import { and, asc, desc, eq } from "drizzle-orm";
import { Public, requireWebOrigin } from "../auth/auth.js";
import { DatabaseService } from "../database.js";
import { experiences } from "../db/schema.js";
import { invalid, projectId as uuid } from "../projects/drafts.js";

type ExperienceInput = {
  organization: string;
  title: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  achievements: string[];
  position: number;
};

const order = [
  asc(experiences.position),
  desc(experiences.startDate),
  asc(experiences.id),
];

const month = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;
const fields = ["organization", "title", "startDate", "endDate"] as const;
const allowed = [
  ...fields,
  "description",
  "achievements",
  "position",
] as string[];

// Dates are stored as the first day of the month and exposed as YYYY-MM.
const toMonth = (date: string) => date.slice(0, 7);

function present<T extends { startDate: string; endDate: string | null }>(
  row: T,
) {
  return {
    ...row,
    startDate: toMonth(row.startDate),
    endDate: row.endDate ? toMonth(row.endDate) : null,
  };
}

function text(
  data: Record<string, unknown>,
  key: string,
  max: number,
  errors: Record<string, string>,
) {
  const value = data[key];
  if (typeof value !== "string") {
    errors[key] = "Introduce texto válido.";
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max)
    errors[key] = `Usa entre 1 y ${max} caracteres.`;
  return trimmed;
}

function experienceInput(body: unknown): ExperienceInput {
  if (!body || typeof body !== "object" || Array.isArray(body))
    invalid({ form: "Se esperaba un objeto." });
  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (Object.keys(data).some((key) => !allowed.includes(key)))
    errors.form = "La solicitud contiene campos no permitidos.";

  const organization = text(data, "organization", 120, errors);
  const title = text(data, "title", 120, errors);

  let startDate = "";
  if (typeof data.startDate !== "string" || !month.test(data.startDate))
    errors.startDate = "Indica un mes y año válidos (AAAA-MM).";
  else startDate = data.startDate;

  let endDate: string | null = null;
  if (data.endDate !== undefined && data.endDate !== null) {
    if (typeof data.endDate !== "string" || !month.test(data.endDate))
      errors.endDate = "Indica un mes y año válidos (AAAA-MM) o déjalo vacío.";
    else if (startDate && data.endDate < startDate)
      errors.endDate = "El fin no puede ser anterior al inicio.";
    else endDate = data.endDate;
  }

  let description: string | null = null;
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== "string")
      errors.description = "Introduce texto válido.";
    else {
      description = data.description.trim() || null;
      if (description && description.length > 2000)
        errors.description = "Usa hasta 2.000 caracteres.";
    }
  }

  let achievements: string[] = [];
  if (data.achievements !== undefined) {
    const list = data.achievements;
    if (!Array.isArray(list))
      errors.achievements = "Envía una lista de textos.";
    else if (list.length > 10) errors.achievements = "Usa hasta 10 logros.";
    else if (list.some((item) => typeof item !== "string"))
      errors.achievements = "Cada logro debe ser texto.";
    else {
      achievements = (list as string[]).map((item) => item.trim());
      if (achievements.some((item) => !item || item.length > 300))
        errors.achievements = "Cada logro debe tener entre 1 y 300 caracteres.";
      else if (new Set(achievements).size !== achievements.length)
        errors.achievements = "No repitas logros.";
    }
  }

  const position = data.position ?? 0;
  if (
    typeof position !== "number" ||
    !Number.isInteger(position) ||
    position < 0 ||
    position > 2147483647
  )
    errors.position = "Introduce un entero entre 0 y 2147483647.";

  if (Object.keys(errors).length) invalid(errors);
  return {
    organization,
    title,
    startDate,
    endDate,
    description,
    achievements,
    position: position as number,
  };
}

const stored = (input: ExperienceInput) => ({
  ...input,
  startDate: `${input.startDate}-01`,
  endDate: input.endDate ? `${input.endDate}-01` : null,
});

function handleWriteError(error: unknown): never {
  // Drizzle wraps the PostgreSQL error; a CHECK violation here means the
  // runtime validation missed a rule, so surface it as invalid input.
  const cause =
    error instanceof Error && "cause" in error ? error.cause : error;
  if (
    cause &&
    typeof cause === "object" &&
    "code" in cause &&
    cause.code === "23514"
  )
    invalid({ form: "Los datos no cumplen las reglas de la experiencia." });
  throw error;
}

@Injectable()
export class ExperienceService {
  private readonly logger = new Logger(ExperienceService.name);

  constructor(private readonly database: DatabaseService) {}

  async list() {
    const rows = await this.database
      .getDatabase()
      .select()
      .from(experiences)
      .orderBy(...order);
    return rows.map(present);
  }

  async listPublished() {
    const rows = await this.database
      .getDatabase()
      .select({
        id: experiences.id,
        organization: experiences.organization,
        title: experiences.title,
        startDate: experiences.startDate,
        endDate: experiences.endDate,
        description: experiences.description,
        achievements: experiences.achievements,
        position: experiences.position,
      })
      .from(experiences)
      .where(eq(experiences.status, "published"))
      .orderBy(...order);
    return rows.map(present);
  }

  async get(id: string) {
    const [row] = await this.database
      .getDatabase()
      .select()
      .from(experiences)
      .where(eq(experiences.id, id))
      .limit(1);
    if (!row) throw new NotFoundException("Experiencia no encontrada.");
    return present(row);
  }

  async create(input: ExperienceInput) {
    try {
      const [row] = await this.database
        .getDatabase()
        .insert(experiences)
        .values({ ...stored(input), status: "draft" })
        .returning();
      this.logger.log({ action: "experience.created", experienceId: row?.id });
      return present(row!);
    } catch (error) {
      handleWriteError(error);
    }
  }

  async update(id: string, input: ExperienceInput) {
    try {
      const [row] = await this.database
        .getDatabase()
        .update(experiences)
        .set({ ...stored(input), updatedAt: new Date() })
        .where(and(eq(experiences.id, id), eq(experiences.status, "draft")))
        .returning();
      if (!row) throw new NotFoundException("Borrador no encontrado.");
      this.logger.log({ action: "experience.updated", experienceId: row.id });
      return present(row);
    } catch (error) {
      handleWriteError(error);
    }
  }

  async publish(id: string) {
    const [row] = await this.database
      .getDatabase()
      .update(experiences)
      .set({ status: "published", updatedAt: new Date() })
      .where(and(eq(experiences.id, id), eq(experiences.status, "draft")))
      .returning();
    if (!row) throw new NotFoundException("Borrador no encontrado.");
    this.logger.log({ action: "experience.published", experienceId: row.id });
    return present(row);
  }

  async unpublish(id: string) {
    const [row] = await this.database
      .getDatabase()
      .update(experiences)
      .set({ status: "draft", updatedAt: new Date() })
      .where(and(eq(experiences.id, id), eq(experiences.status, "published")))
      .returning();
    if (!row)
      throw new NotFoundException("Experiencia publicada no encontrada.");
    this.logger.log({ action: "experience.unpublished", experienceId: row.id });
    return present(row);
  }
}

type OriginRequest = { headers: { origin?: string } };

@Controller("admin/experience")
export class AdminExperienceController {
  constructor(private readonly experience: ExperienceService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  list() {
    return this.experience.list();
  }

  @Get(":id")
  @Header("Cache-Control", "no-store")
  get(@Param("id") id: string) {
    return this.experience.get(uuid(id));
  }

  @Post()
  @Header("Cache-Control", "no-store")
  create(@Body() body: unknown, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.experience.create(experienceInput(body));
  }

  @Put(":id")
  @Header("Cache-Control", "no-store")
  update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() request: OriginRequest,
  ) {
    requireWebOrigin(request.headers.origin);
    return this.experience.update(uuid(id), experienceInput(body));
  }

  @Post(":id/publish")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  publish(@Param("id") id: string, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.experience.publish(uuid(id));
  }

  @Post(":id/unpublish")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  unpublish(@Param("id") id: string, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.experience.unpublish(uuid(id));
  }
}

@Controller("experience")
export class PublicExperienceController {
  constructor(private readonly experience: ExperienceService) {}

  @Public()
  @Get()
  @Header("Cache-Control", "no-store")
  list() {
    return this.experience.listPublished();
  }
}
