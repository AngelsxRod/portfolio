import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Injectable,
  Logger,
  NotFoundException,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { Public, requireWebOrigin } from "../auth/auth.js";
import { DatabaseService } from "../database.js";
import { profile, type ProfileLink } from "../db/schema.js";
import { invalid } from "../projects/drafts.js";

type ProfileInput = {
  displayName: string;
  presentation: string;
  location: string | null;
  email: string | null;
  links: ProfileLink[];
};

const allowed = [
  "displayName",
  "presentation",
  "location",
  "email",
  "links",
] as string[];

const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function optionalText(
  data: Record<string, unknown>,
  key: string,
  max: number,
  errors: Record<string, string>,
) {
  const value = data[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    errors[key] = "Introduce texto válido.";
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length > max) errors[key] = `Usa hasta ${max} caracteres.`;
  return trimmed || null;
}

function validUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password &&
      value.length <= 2048
    );
  } catch {
    return false;
  }
}

function profileInput(body: unknown): ProfileInput {
  if (!body || typeof body !== "object" || Array.isArray(body))
    invalid({ form: "Se esperaba un objeto." });
  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (Object.keys(data).some((key) => !allowed.includes(key)))
    errors.form = "La solicitud contiene campos no permitidos.";

  const displayName = text(data, "displayName", 120, errors);
  const presentation = text(data, "presentation", 2000, errors);
  const location = optionalText(data, "location", 120, errors);

  const emailValue = optionalText(data, "email", 254, errors);
  if (emailValue && !errors.email && !email.test(emailValue))
    errors.email = "Introduce un correo válido.";

  const links: ProfileLink[] = [];
  if (data.links !== undefined) {
    if (!Array.isArray(data.links))
      errors.links = "Envía una lista de enlaces.";
    else if (data.links.length > 10) errors.links = "Usa hasta 10 enlaces.";
    else {
      for (const [index, item] of data.links.entries()) {
        const record =
          item && typeof item === "object" && !Array.isArray(item)
            ? (item as Record<string, unknown>)
            : null;
        const label =
          typeof record?.label === "string" ? record.label.trim() : "";
        const url = typeof record?.url === "string" ? record.url.trim() : "";
        if (
          !record ||
          Object.keys(record).some((key) => key !== "label" && key !== "url") ||
          !label ||
          label.length > 40
        ) {
          errors.links = `Enlace ${index + 1}: usa una etiqueta de 1 a 40 caracteres.`;
          break;
        }
        if (!validUrl(url)) {
          errors.links = `Enlace ${index + 1}: introduce una URL HTTP o HTTPS sin credenciales.`;
          break;
        }
        links.push({ label, url });
      }
      if (
        !errors.links &&
        new Set(links.map((link) => link.url)).size !== links.length
      )
        errors.links = "No repitas la misma URL.";
    }
  }

  if (Object.keys(errors).length) invalid(errors);
  return { displayName, presentation, location, email: emailValue, links };
}

function sameContent(a: ProfileInput, b: ProfileInput) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const content = (row: ProfileInput): ProfileInput => ({
  displayName: row.displayName,
  presentation: row.presentation,
  location: row.location,
  email: row.email,
  links: row.links,
});

function handleWriteError(error: unknown): never {
  const cause =
    error instanceof Error && "cause" in error ? error.cause : error;
  if (
    cause &&
    typeof cause === "object" &&
    "code" in cause &&
    cause.code === "23514"
  )
    invalid({ form: "Los datos no cumplen las reglas del perfil." });
  throw error;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly database: DatabaseService) {}

  async get() {
    const rows = await this.database.getDatabase().select().from(profile);
    const draft = rows.find((row) => row.version === "draft") ?? null;
    const published = rows.find((row) => row.version === "published") ?? null;
    return {
      draft,
      published,
      hasUnpublishedChanges: Boolean(
        draft &&
        (!published || !sameContent(content(draft), content(published))),
      ),
    };
  }

  async getPublished() {
    const [row] = await this.database
      .getDatabase()
      .select({
        displayName: profile.displayName,
        presentation: profile.presentation,
        location: profile.location,
        email: profile.email,
        links: profile.links,
      })
      .from(profile)
      .where(eq(profile.version, "published"))
      .limit(1);
    if (!row) throw new NotFoundException("Perfil no publicado.");
    return row;
  }

  async saveDraft(input: ProfileInput) {
    try {
      await this.database
        .getDatabase()
        .insert(profile)
        .values({ ...input, version: "draft" })
        .onConflictDoUpdate({
          target: profile.version,
          set: { ...input, updatedAt: new Date() },
        });
      this.logger.log({ action: "profile.draft_saved" });
    } catch (error) {
      handleWriteError(error);
    }
    return this.get();
  }

  async publish() {
    await this.database.getDatabase().transaction(async (tx) => {
      const [draft] = await tx
        .select()
        .from(profile)
        .where(eq(profile.version, "draft"))
        .limit(1);
      if (!draft) invalid({ form: "Guarda un borrador antes de publicar." });
      const values = content(draft!);
      await tx
        .insert(profile)
        .values({ ...values, version: "published" })
        .onConflictDoUpdate({
          target: profile.version,
          set: { ...values, updatedAt: new Date() },
        });
    });
    this.logger.log({ action: "profile.published" });
    return this.get();
  }

  async unpublish() {
    const removed = await this.database
      .getDatabase()
      .delete(profile)
      .where(eq(profile.version, "published"))
      .returning({ version: profile.version });
    if (!removed.length) throw new NotFoundException("Perfil no publicado.");
    this.logger.log({ action: "profile.unpublished" });
    return this.get();
  }
}

type OriginRequest = { headers: { origin?: string } };

@Controller("admin/profile")
export class AdminProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  get() {
    return this.profile.get();
  }

  @Put()
  @Header("Cache-Control", "no-store")
  save(@Body() body: unknown, @Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.profile.saveDraft(profileInput(body));
  }

  @Post("publish")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  publish(@Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.profile.publish();
  }

  @Post("unpublish")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  unpublish(@Req() request: OriginRequest) {
    requireWebOrigin(request.headers.origin);
    return this.profile.unpublish();
  }
}

@Controller("profile")
export class PublicProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Public()
  @Get()
  @Header("Cache-Control", "no-store")
  get() {
    return this.profile.getPublished();
  }
}
