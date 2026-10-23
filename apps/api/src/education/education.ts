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
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { Public, requireWebOrigin } from "../auth/auth.js";
import { DatabaseService } from "../database.js";
import { education } from "../db/schema.js";
import { invalid, projectId as uuid } from "../projects/drafts.js";

const levels = ["secondary", "university", "other"] as const;

type EducationInput = {
  institution: string;
  level: (typeof levels)[number];
  program: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  position: number;
};

const order = [
  asc(education.position),
  desc(education.startDate),
  asc(education.id),
];

const month = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;
const allowed = [
  "institution",
  "level",
  "program",
  "startDate",
  "endDate",
  "description",
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

function educationInput(body: unknown): EducationInput {
  if (!body || typeof body !== "object" || Array.isArray(body))
    invalid({ form: "Se esperaba un objeto." });
  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (Object.keys(data).some((key) => !allowed.includes(key)))
    errors.form = "La solicitud contiene campos no permitidos.";

  const institution = text(data, "institution", 120, errors);
  const program = text(data, "program", 120, errors);

  let level: EducationInput["level"] = "other";
  if (!levels.includes(data.level as EducationInput["level"]))
    errors.level = "Elige un nivel válido.";
  else level = data.level as EducationInput["level"];

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
    institution,
    level,
    program,
    startDate,
    endDate,
    description,
    position: position as number,
  };
}

const stored = (input: EducationInput) => ({
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
    invalid({ form: "Los datos no cumplen las reglas de la educación." });
  throw error;
}

@Injectable()
export class EducationService {
  private readonly logger = new Logger(EducationService.name);

  constructor(private readonly database: DatabaseService) {}

  async list() {
    const rows = await this.database
      .getDatabase()
      .select()
      .from(education)
      .orderBy(...order);
    return rows.map(present);
  }

  async listPublished() {
    const rows = await this.database
      .getDatabase()
      .select({
        id: education.id,
        institution: education.institution,
        level: education.level,
        program: education.program,
        startDate: education.startDate,
        endDate: education.endDate,
        description: education.description,
        position: education.position,
      })
      .from(education)
      .where(eq(education.status, "published"))
      .orderBy(...order);
    return rows.map(present);
  }

  async get(id: string) {
    const [row] = await this.database
      .getDatabase()
      .select()
      .from(education)
      .where(eq(education.id, id))
      .limit(1);
    if (!row) throw new NotFoundException("Educación no encontrada.");
    return present(row);
  }

  async create(input: EducationInput) {
    try {
      const [row] = await this.database
        .getDatabase()
        .insert(education)
        .values({ ...stored(input), status: "draft" })
        .returning();
      this.logger.log({ action: "education.created", educationId: row?.id });
      return present(row!);
    } catch (error) {
      handleWriteError(error);
    }
  }

  async update(id: string, input: EducationInput) {
    try {
      const [current] = await this.database
        .getDatabase()
        .select({ status: education.status })
        .from(education)
        .where(eq(education.id, id))
        .limit(1);
      if (current?.status === "published") {
        // Lo publicado no cambia: las ediciones quedan como cambios pendientes.
        const [pending] = await this.database
          .getDatabase()
          .update(education)
          .set({ pending: input, updatedAt: new Date() })
          .where(and(eq(education.id, id), eq(education.status, "published")))
          .returning();
        if (!pending) throw new NotFoundException("Registro no encontrado.");
        this.logger.log({ action: "education.pending.saved", id: pending.id });
        return present(pending);
      }
      const [row] = await this.database
        .getDatabase()
        .update(education)
        .set({ ...stored(input), updatedAt: new Date() })
        .where(and(eq(education.id, id), eq(education.status, "draft")))
        .returning();
      if (!row) throw new NotFoundException("Borrador no encontrado.");
      this.logger.log({ action: "education.updated", educationId: row.id });
      return present(row);
    } catch (error) {
      handleWriteError(error);
    }
  }

  async publish(id: string) {
    const [current] = await this.database
      .getDatabase()
      .select({ status: education.status, pending: education.pending })
      .from(education)
      .where(eq(education.id, id))
      .limit(1);
    if (current?.status === "published") {
      if (!current.pending)
        throw new NotFoundException("No hay cambios pendientes.");
      try {
        const [row] = await this.database
          .getDatabase()
          .update(education)
          .set({
            ...stored(current.pending as unknown as EducationInput),
            pending: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(education.id, id),
              eq(education.status, "published"),
              isNotNull(education.pending),
            ),
          )
          .returning();
        if (!row) throw new NotFoundException("No hay cambios pendientes.");
        this.logger.log({ action: "education.pending.applied", id: row.id });
        return present(row);
      } catch (error) {
        handleWriteError(error);
      }
    }
    return this.publishDraft(id);
  }

  async discard(id: string) {
    const [row] = await this.database
      .getDatabase()
      .update(education)
      .set({ pending: null, updatedAt: new Date() })
      .where(
        and(
          eq(education.id, id),
          eq(education.status, "published"),
          isNotNull(education.pending),
        ),
      )
      .returning();
    if (!row) throw new NotFoundException("No hay cambios pendientes.");
    this.logger.log({ action: "education.pending.discarded", id: row.id });
    return present(row);
  }

  private async publishDraft(id: string) {
    const [row] = await this.database
      .getDatabase()
      .update(education)
      .set({ status: "published", updatedAt: new Date() })
      .where(and(eq(education.id, id), eq(education.status, "draft")))
      .returning();
    if (!row) throw new NotFoundException("Borrador no encontrado.");
    this.logger.log({ action: "education.published", educationId: row.id });
    return present(row);
  }

  async unpublish(id: string) {
    const [current] = await this.database
      .getDatabase()
      .select({ pending: education.pending })
      .from(education)
      .where(and(eq(education.id, id), eq(education.status, "published")))
      .limit(1);
    // Al retirar, el borrador es la última versión en la que se trabajó.
    const applied = current?.pending
      ? stored(current.pending as unknown as EducationInput)
      : {};
    try {
      return await this.retire(id, applied);
    } catch (error) {
      handleWriteError(error);
    }
  }

  private async retire(id: string, applied: object) {
    const [row] = await this.database
      .getDatabase()
      .update(education)
      .set({
        ...applied,
        pending: null,
        status: "draft",
        updatedAt: new Date(),
      })
      .where(and(eq(education.id, id), eq(education.status, "published")))
      .returning();
    if (!row) throw new NotFoundException("Educación publicada no encontrada.");
    this.logger.log({ action: "education.unpublished", educationId: row.id });
    return present(row);
  }
}

type OriginRequest = { headers: { origin?: string } };

@Controller("admin/education")
export class AdminEducationController {
  constructor(private readonly education: EducationService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  list() {
    return this.education.list();
  }

  @Get(":id")
  @Header("Cache-Control", "no-store")
  get(@Param("id") id: string) {
    return this.education.get(uuid(id));
  }

  @Post()
  @Header("Cache-Control", "no-store")
  create(@Body() body: unknown, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.education.create(educationInput(body));
  }

  @Put(":id")
  @Header("Cache-Control", "no-store")
  update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() request: OriginRequest,
  ) {
    requireWebOrigin(request.headers.origin);
    return this.education.update(uuid(id), educationInput(body));
  }

  @Post(":id/publish")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  publish(@Param("id") id: string, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.education.publish(uuid(id));
  }

  @Post(":id/discard")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  discard(@Param("id") id: string, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.education.discard(uuid(id));
  }

  @Post(":id/unpublish")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  unpublish(@Param("id") id: string, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.education.unpublish(uuid(id));
  }
}

@Controller("education")
export class PublicEducationController {
  constructor(private readonly education: EducationService) {}

  @Public()
  @Get()
  @Header("Cache-Control", "no-store")
  list() {
    return this.education.listPublished();
  }
}
