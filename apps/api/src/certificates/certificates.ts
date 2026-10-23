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
import { certificates } from "../db/schema.js";
import { invalid, projectId as uuid } from "../projects/drafts.js";

type CertificateInput = {
  name: string;
  issuer: string;
  issueDate: string;
  verificationUrl: string | null;
  description: string | null;
  position: number;
};

const order = [
  asc(certificates.position),
  desc(certificates.issueDate),
  asc(certificates.id),
];

const month = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;
const allowed = [
  "name",
  "issuer",
  "issueDate",
  "verificationUrl",
  "description",
  "position",
] as string[];

// Dates are stored as the first day of the month and exposed as YYYY-MM.
const toMonth = (date: string) => date.slice(0, 7);

function present<T extends { issueDate: string }>(row: T) {
  return { ...row, issueDate: toMonth(row.issueDate) };
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

function certificateInput(body: unknown): CertificateInput {
  if (!body || typeof body !== "object" || Array.isArray(body))
    invalid({ form: "Se esperaba un objeto." });
  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (Object.keys(data).some((key) => !allowed.includes(key)))
    errors.form = "La solicitud contiene campos no permitidos.";

  const name = text(data, "name", 160, errors);
  const issuer = text(data, "issuer", 120, errors);

  let issueDate = "";
  if (typeof data.issueDate !== "string" || !month.test(data.issueDate))
    errors.issueDate = "Indica un mes y año válidos (AAAA-MM).";
  else issueDate = data.issueDate;

  let verificationUrl: string | null = null;
  if (data.verificationUrl !== undefined && data.verificationUrl !== null) {
    if (typeof data.verificationUrl !== "string")
      errors.verificationUrl = "Introduce texto válido.";
    else {
      const value = data.verificationUrl.trim();
      if (value) {
        try {
          const parsed = new URL(value);
          if (
            !["http:", "https:"].includes(parsed.protocol) ||
            parsed.username ||
            parsed.password ||
            value.length > 2048
          )
            throw new Error();
          verificationUrl = value;
        } catch {
          errors.verificationUrl =
            "Introduce una URL HTTP o HTTPS sin credenciales (hasta 2.048 caracteres).";
        }
      }
    }
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
    name,
    issuer,
    issueDate,
    verificationUrl,
    description,
    position: position as number,
  };
}

const stored = (input: CertificateInput) => ({
  ...input,
  issueDate: `${input.issueDate}-01`,
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
    invalid({ form: "Los datos no cumplen las reglas del certificado." });
  throw error;
}

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(private readonly database: DatabaseService) {}

  async list() {
    const rows = await this.database
      .getDatabase()
      .select()
      .from(certificates)
      .orderBy(...order);
    return rows.map(present);
  }

  async listPublished() {
    const rows = await this.database
      .getDatabase()
      .select({
        id: certificates.id,
        name: certificates.name,
        issuer: certificates.issuer,
        issueDate: certificates.issueDate,
        verificationUrl: certificates.verificationUrl,
        description: certificates.description,
        position: certificates.position,
      })
      .from(certificates)
      .where(eq(certificates.status, "published"))
      .orderBy(...order);
    return rows.map(present);
  }

  async get(id: string) {
    const [row] = await this.database
      .getDatabase()
      .select()
      .from(certificates)
      .where(eq(certificates.id, id))
      .limit(1);
    if (!row) throw new NotFoundException("Certificado no encontrado.");
    return present(row);
  }

  async create(input: CertificateInput) {
    try {
      const [row] = await this.database
        .getDatabase()
        .insert(certificates)
        .values({ ...stored(input), status: "draft" })
        .returning();
      this.logger.log({
        action: "certificates.created",
        certificateId: row?.id,
      });
      return present(row!);
    } catch (error) {
      handleWriteError(error);
    }
  }

  async update(id: string, input: CertificateInput) {
    try {
      const [row] = await this.database
        .getDatabase()
        .update(certificates)
        .set({ ...stored(input), updatedAt: new Date() })
        .where(and(eq(certificates.id, id), eq(certificates.status, "draft")))
        .returning();
      if (!row) throw new NotFoundException("Borrador no encontrado.");
      this.logger.log({
        action: "certificates.updated",
        certificateId: row.id,
      });
      return present(row);
    } catch (error) {
      handleWriteError(error);
    }
  }

  async publish(id: string) {
    const [row] = await this.database
      .getDatabase()
      .update(certificates)
      .set({ status: "published", updatedAt: new Date() })
      .where(and(eq(certificates.id, id), eq(certificates.status, "draft")))
      .returning();
    if (!row) throw new NotFoundException("Borrador no encontrado.");
    this.logger.log({
      action: "certificates.published",
      certificateId: row.id,
    });
    return present(row);
  }

  async unpublish(id: string) {
    const [row] = await this.database
      .getDatabase()
      .update(certificates)
      .set({ status: "draft", updatedAt: new Date() })
      .where(and(eq(certificates.id, id), eq(certificates.status, "published")))
      .returning();
    if (!row)
      throw new NotFoundException("Certificado publicado no encontrado.");
    this.logger.log({
      action: "certificates.unpublished",
      certificateId: row.id,
    });
    return present(row);
  }
}

type OriginRequest = { headers: { origin?: string } };

@Controller("admin/certificates")
export class AdminCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  list() {
    return this.certificates.list();
  }

  @Get(":id")
  @Header("Cache-Control", "no-store")
  get(@Param("id") id: string) {
    return this.certificates.get(uuid(id));
  }

  @Post()
  @Header("Cache-Control", "no-store")
  create(@Body() body: unknown, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.certificates.create(certificateInput(body));
  }

  @Put(":id")
  @Header("Cache-Control", "no-store")
  update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() request: OriginRequest,
  ) {
    requireWebOrigin(request.headers.origin);
    return this.certificates.update(uuid(id), certificateInput(body));
  }

  @Post(":id/publish")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  publish(@Param("id") id: string, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.certificates.publish(uuid(id));
  }

  @Post(":id/unpublish")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  unpublish(@Param("id") id: string, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.certificates.unpublish(uuid(id));
  }
}

@Controller("certificates")
export class PublicCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Public()
  @Get()
  @Header("Cache-Control", "no-store")
  list() {
    return this.certificates.listPublished();
  }
}
