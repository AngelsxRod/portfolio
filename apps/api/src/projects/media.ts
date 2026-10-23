import {
  BadRequestException,
  ConflictException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Injectable,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
} from "@nestjs/common";
import { and, asc, eq, inArray } from "drizzle-orm";
import { requireWebOrigin, Public } from "../auth/auth.js";
import { DatabaseService } from "../database.js";
import { projectMedia, projects } from "../db/schema.js";
import { projectId } from "./drafts.js";

const maxBytes = 5 * 1024 * 1024;
const metadata = {
  id: projectMedia.id,
  projectId: projectMedia.projectId,
  mimeType: projectMedia.mimeType,
  altText: projectMedia.altText,
  isFeatured: projectMedia.isFeatured,
  createdAt: projectMedia.createdAt,
  updatedAt: projectMedia.updatedAt,
};

function imageInput(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new BadRequestException({ fields: { form: "Solicitud inválida." } });
  const data = body as Record<string, unknown>;
  const fields: Record<string, string> = {};
  if (
    Object.keys(data).some(
      (key) => !["altText", "mimeType", "data"].includes(key),
    )
  )
    fields.form = "La solicitud contiene campos no permitidos.";
  const altText = typeof data.altText === "string" ? data.altText.trim() : "";
  if (!altText || altText.length > 300)
    fields.altText = "Describe la imagen en 1 a 300 caracteres.";
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(String(data.mimeType))
  )
    fields.file = "Usa una imagen PNG, JPEG o WebP.";
  const encoded = data.data;
  if (
    typeof encoded !== "string" ||
    !encoded ||
    encoded.length > Math.ceil(maxBytes / 3) * 4 ||
    encoded.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)
  )
    fields.file = "Selecciona una imagen de hasta 5 MiB.";
  if (Object.keys(fields).length)
    throw new BadRequestException({ message: "Revisa la imagen.", fields });
  const bytes = Buffer.from(encoded as string, "base64");
  if (
    !bytes.length ||
    bytes.length > maxBytes ||
    bytes.toString("base64") !== encoded
  )
    fields.file = "Selecciona una imagen de hasta 5 MiB.";
  const mimeType = data.mimeType as string;
  const valid =
    (mimeType === "image/png" &&
      bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) &&
      bytes
        .subarray(-12)
        .equals(Buffer.from("0000000049454e44ae426082", "hex"))) ||
    (mimeType === "image/jpeg" &&
      bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")) &&
      bytes.subarray(-2).equals(Buffer.from("ffd9", "hex"))) ||
    (mimeType === "image/webp" &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP" &&
      bytes.readUInt32LE(4) === bytes.length - 8);
  if (!valid) fields.file = "El contenido no corresponde al tipo de imagen.";
  if (Object.keys(fields).length)
    throw new BadRequestException({ message: "Revisa la imagen.", fields });
  return { altText, mimeType, bytes };
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  constructor(private readonly database: DatabaseService) {}

  async metadataForProjects(ids: string[]) {
    if (!ids.length) return [];
    return this.database
      .getDatabase()
      .select(metadata)
      .from(projectMedia)
      .where(inArray(projectMedia.projectId, ids))
      .orderBy(asc(projectMedia.createdAt), asc(projectMedia.id));
  }

  async list(project: string) {
    await this.requireProject(project);
    return this.metadataForProjects([project]);
  }

  private async requireProject(id: string) {
    const [project] = await this.database
      .getDatabase()
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    if (!project) throw new NotFoundException("Proyecto no encontrado.");
  }

  async upload(projectIdValue: string, body: unknown, retryId?: string) {
    const input = imageInput(body);
    await this.requireProject(projectIdValue);
    const [saved] = await this.database
      .getDatabase()
      .insert(projectMedia)
      .values({
        ...input,
        projectId: projectIdValue,
        ...(retryId ? { id: retryId } : {}),
      })
      .onConflictDoNothing({ target: projectMedia.id })
      .returning(metadata);
    if (!saved && retryId) {
      const [existing] = await this.database
        .getDatabase()
        .select()
        .from(projectMedia)
        .where(
          and(
            eq(projectMedia.id, retryId),
            eq(projectMedia.projectId, projectIdValue),
          ),
        )
        .limit(1);
      if (
        !existing ||
        existing.mimeType !== input.mimeType ||
        !existing.bytes.equals(input.bytes)
      )
        throw new ConflictException(
          "El identificador de carga ya está en uso.",
        );
      return this.updateAlt(projectIdValue, retryId, {
        altText: input.altText,
      });
    }
    this.logger.log({
      action: "project.media.created",
      projectId: projectIdValue,
      mediaId: saved?.id,
    });
    return saved;
  }

  async updateAlt(project: string, mediaId: string, body: unknown) {
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some((key) => key !== "altText")
    )
      throw new BadRequestException("Solicitud inválida.");
    const altText =
      "altText" in body && typeof body.altText === "string"
        ? body.altText.trim()
        : "";
    if (!altText || altText.length > 300)
      throw new BadRequestException({
        fields: { altText: "Describe la imagen en 1 a 300 caracteres." },
      });
    const [saved] = await this.database
      .getDatabase()
      .update(projectMedia)
      .set({ altText, updatedAt: new Date() })
      .where(
        and(eq(projectMedia.id, mediaId), eq(projectMedia.projectId, project)),
      )
      .returning(metadata);
    if (!saved) throw new NotFoundException("Imagen no encontrada.");
    this.logger.log({
      action: "project.media.updated",
      projectId: project,
      mediaId,
    });
    return saved;
  }

  async feature(project: string, body: unknown) {
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some((key) => key !== "mediaId") ||
      !("mediaId" in body) ||
      typeof body.mediaId !== "string"
    )
      throw new BadRequestException("Selecciona una imagen.");
    const mediaId = projectId(body.mediaId);
    return this.database.getDatabase().transaction(async (tx) => {
      const [owner] = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, project))
        .for("update");
      if (!owner) throw new NotFoundException("Proyecto no encontrado.");
      const [image] = await tx
        .select({ id: projectMedia.id })
        .from(projectMedia)
        .where(
          and(
            eq(projectMedia.id, mediaId),
            eq(projectMedia.projectId, project),
          ),
        );
      if (!image) throw new NotFoundException("Imagen no encontrada.");
      await tx
        .update(projectMedia)
        .set({ isFeatured: false })
        .where(
          and(
            eq(projectMedia.projectId, project),
            eq(projectMedia.isFeatured, true),
          ),
        );
      const [saved] = await tx
        .update(projectMedia)
        .set({ isFeatured: true, updatedAt: new Date() })
        .where(eq(projectMedia.id, mediaId))
        .returning(metadata);
      this.logger.log({
        action: "project.media.featured",
        projectId: project,
        mediaId,
      });
      return saved;
    });
  }

  async remove(project: string, mediaId: string) {
    await this.database.getDatabase().transaction(async (tx) => {
      await tx
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, project))
        .for("update");
      const [removed] = await tx
        .delete(projectMedia)
        .where(
          and(
            eq(projectMedia.id, mediaId),
            eq(projectMedia.projectId, project),
          ),
        )
        .returning({ id: projectMedia.id });
      if (!removed) throw new NotFoundException("Imagen no encontrada.");
    });
    this.logger.log({
      action: "project.media.deleted",
      projectId: project,
      mediaId,
    });
    return { ok: true };
  }

  async image(mediaId: string, publishedOnly: boolean) {
    const [image] = await this.database
      .getDatabase()
      .select({ bytes: projectMedia.bytes, mimeType: projectMedia.mimeType })
      .from(projectMedia)
      .innerJoin(projects, eq(projectMedia.projectId, projects.id))
      .where(
        and(
          eq(projectMedia.id, mediaId),
          ...(publishedOnly ? [eq(projects.status, "published")] : []),
        ),
      )
      .limit(1);
    if (!image) throw new NotFoundException("Imagen no encontrada.");
    return image;
  }
}

type ImageReply = {
  header: (name: string, value: string) => ImageReply;
  send: (body: Buffer) => void;
};
function sendImage(
  reply: ImageReply,
  image: { bytes: Buffer; mimeType: string },
) {
  reply
    .header("Content-Type", image.mimeType)
    .header("Content-Length", String(image.bytes.length))
    .header("Content-Disposition", "inline")
    .header("X-Content-Type-Options", "nosniff")
    .header("Cache-Control", "no-store")
    .send(image.bytes);
}

@Controller("admin/projects/:id/media")
export class AdminMediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  list(@Param("id") id: string) {
    return this.media.list(projectId(id));
  }

  @Post()
  @Header("Cache-Control", "no-store")
  upload(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req()
    request: { headers: { origin?: string; "idempotency-key"?: string } },
  ) {
    requireWebOrigin(request.headers.origin);
    const key = request.headers["idempotency-key"];
    return this.media.upload(
      projectId(id),
      body,
      key ? projectId(key) : undefined,
    );
  }

  @Put(":mediaId")
  @Header("Cache-Control", "no-store")
  updateAlt(
    @Param("id") id: string,
    @Param("mediaId") mediaId: string,
    @Body() body: unknown,
    @Req()
    request: { headers: { origin?: string; "idempotency-key"?: string } },
  ) {
    requireWebOrigin(request.headers.origin);
    return this.media.updateAlt(projectId(id), projectId(mediaId), body);
  }

  @Delete(":mediaId")
  @Header("Cache-Control", "no-store")
  remove(
    @Param("id") id: string,
    @Param("mediaId") mediaId: string,
    @Req()
    request: { headers: { origin?: string; "idempotency-key"?: string } },
  ) {
    requireWebOrigin(request.headers.origin);
    return this.media.remove(projectId(id), projectId(mediaId));
  }

  @Get(":mediaId/file")
  async file(
    @Param("id") id: string,
    @Param("mediaId") mediaId: string,
    @Res() reply: ImageReply,
  ) {
    const image = await this.media.image(projectId(mediaId), false);
    // A valid session alone does not authorize reading an image through another project's URL.
    const listed = await this.media.list(projectId(id));
    if (!listed.some((item) => item.id === mediaId))
      throw new NotFoundException("Imagen no encontrada.");
    sendImage(reply, image);
  }
}

@Controller("projects/media")
export class PublicMediaController {
  constructor(private readonly media: MediaService) {}

  @Public()
  @Get(":mediaId")
  async file(@Param("mediaId") mediaId: string, @Res() reply: ImageReply) {
    sendImage(reply, await this.media.image(projectId(mediaId), true));
  }
}

@Controller("admin/projects/:id/featured-media")
export class FeaturedMediaController {
  constructor(private readonly media: MediaService) {}

  @Put()
  @Header("Cache-Control", "no-store")
  feature(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req()
    request: { headers: { origin?: string; "idempotency-key"?: string } },
  ) {
    requireWebOrigin(request.headers.origin);
    return this.media.feature(projectId(id), body);
  }
}
