import "reflect-metadata";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray } from "drizzle-orm";
import { AppModule } from "../server.js";
import { DatabaseService } from "../database.js";
import * as schema from "../db/schema.js";
import { hashPassword } from "../auth/password.js";

// Run against a migrated disposable database, never the portfolio database.
describe.runIf(Boolean(process.env.TEST_DATABASE_URL))(
  "draft HTTP routes",
  () => {
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    const origin = "http://localhost:3000";
    const secret = "draft-test-proxy-secret-at-least-32-characters";
    const ids: string[] = [];
    const previous = { ...process.env };
    let app: NestFastifyApplication;
    let cookie: string;

    beforeAll(async () => {
      process.env.WEB_ORIGIN = origin;
      process.env.ADMIN_PROXY_SECRET = secret;
      process.env.ADMIN_USERNAME = "draft-test-admin";
      process.env.ADMIN_PASSWORD_HASH = await hashPassword(
        "draft-test-password",
        randomBytes(32),
      );
      const module = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(DatabaseService)
        .useValue({ getDatabase: () => db })
        .compile();
      app = module.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter({ bodyLimit: 7 * 1024 * 1024 }),
      );
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
      const login = await app.inject({
        method: "POST",
        url: "/auth/login",
        headers: { origin, "x-admin-proxy-secret": secret },
        payload: {
          username: "draft-test-admin",
          password: "draft-test-password",
        },
      });
      expect(login.statusCode).toBe(200);
      cookie = String(login.headers["set-cookie"]).split(";")[0]!;
    });

    afterAll(async () => {
      if (ids.length)
        await db
          .delete(schema.projects)
          .where(inArray(schema.projects.id, ids));
      if (cookie) {
        const token = cookie.slice(cookie.indexOf("=") + 1);
        await db
          .delete(schema.adminSessions)
          .where(
            eq(
              schema.adminSessions.tokenHash,
              createHash("sha256").update(token).digest("hex"),
            ),
          );
      }
      await app?.close();
      await pool.end();
      for (const key of [
        "WEB_ORIGIN",
        "ADMIN_PROXY_SECRET",
        "ADMIN_USERNAME",
        "ADMIN_PASSWORD_HASH",
      ]) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    });

    function payload() {
      return {
        title: "Proyecto de prueba",
        slug: `prueba-${randomUUID()}`,
        summary: "",
        description: "",
        demoUrl: "",
        codeUrl: "",
        technologies: ["TypeScript"],
        position: 0,
      };
    }

    async function create(body = payload()) {
      const result = await app.inject({
        method: "POST",
        url: "/admin/projects/drafts",
        headers: { cookie, origin },
        payload: body,
      });
      if (result.statusCode === 201) ids.push(result.json().id);
      return result;
    }

    it("lets the admin save, list and recover an incomplete draft", async () => {
      const body = payload();
      const saved = await create(body);
      expect(saved.statusCode).toBe(201);
      expect(saved.json()).toMatchObject({
        title: body.title,
        slug: body.slug,
        status: "draft",
        summary: null,
        description: null,
      });
      const recovered = await app.inject({
        method: "GET",
        url: `/admin/projects/drafts/${saved.json().id}`,
        headers: { cookie },
      });
      expect(recovered.statusCode).toBe(200);
      expect(recovered.json()).toEqual(saved.json());
      expect(recovered.headers["cache-control"]).toBe("no-store");
      const listed = await app.inject({
        method: "GET",
        url: "/admin/projects/drafts",
        headers: { cookie },
      });
      expect(listed.statusCode).toBe(200);
      expect(listed.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: saved.json().id }),
        ]),
      );
    });

    it("lets the admin edit and recover a draft with a new modification date", async () => {
      const saved = (await create()).json();
      const updated = await app.inject({
        method: "PUT",
        url: `/admin/projects/drafts/${saved.id}`,
        headers: { cookie, origin },
        payload: {
          ...payload(),
          title: "Proyecto actualizado",
          summary: "Resumen",
          description: "## Descripción",
          demoUrl: "https://example.com/demo",
          codeUrl: null,
          technologies: ["React", "NestJS"],
          position: 2,
        },
      });
      expect(updated.statusCode).toBe(200);
      expect(updated.json()).toMatchObject({
        id: saved.id,
        title: "Proyecto actualizado",
        position: 2,
        technologies: ["React", "NestJS"],
        status: "draft",
        createdAt: saved.createdAt,
      });
      expect(Date.parse(updated.json().updatedAt)).toBeGreaterThan(
        Date.parse(saved.updatedAt),
      );
      const recovered = await app.inject({
        method: "GET",
        url: `/admin/projects/drafts/${saved.id}`,
        headers: { cookie },
      });
      expect(recovered.json()).toEqual(updated.json());
    });

    it("rejects invalid data before writing", async () => {
      const invalidBodies = [
        null,
        [],
        { ...payload(), title: " " },
        { ...payload(), title: "x".repeat(201) },
        { ...payload(), slug: "Slug Inválido" },
        { ...payload(), slug: "x".repeat(161) },
        { ...payload(), position: 1.5 },
        { ...payload(), position: -1 },
        { ...payload(), demoUrl: "javascript:alert(1)" },
        { ...payload(), codeUrl: "https://user:secret@example.com" },
        { ...payload(), technologies: [123] },
        { ...payload(), technologies: [""] },
        { ...payload(), summary: "x".repeat(1001) },
        { ...payload(), description: 123 },
        { ...payload(), status: "published" },
        { ...payload(), id: randomUUID() },
      ];
      for (const body of invalidBodies) {
        const result = await app.inject({
          method: "POST",
          url: "/admin/projects/drafts",
          headers: { cookie, origin, "content-type": "application/json" },
          payload: JSON.stringify(body),
        });
        expect(result.statusCode).toBe(400);
      }
      const saved = (await create()).json();
      const invalidEdit = await app.inject({
        method: "PUT",
        url: `/admin/projects/drafts/${saved.id}`,
        headers: { cookie, origin },
        payload: { ...payload(), title: "" },
      });
      expect(invalidEdit.statusCode).toBe(400);
      const recovered = await app.inject({
        method: "GET",
        url: `/admin/projects/drafts/${saved.id}`,
        headers: { cookie },
      });
      expect(recovered.json()).toEqual(saved);
    });

    it("reports slug conflicts on create and update without replacing a draft", async () => {
      const body = payload();
      const saved = (await create(body)).json();
      const duplicate = await create(body);
      expect(duplicate.statusCode).toBe(409);
      expect(duplicate.json()).toMatchObject({
        fields: { slug: "Elige otro slug." },
      });
      const other = (await create()).json();
      const conflict = await app.inject({
        method: "PUT",
        url: `/admin/projects/drafts/${other.id}`,
        headers: { cookie, origin },
        payload: body,
      });
      expect(conflict.statusCode).toBe(409);
      const recovered = await app.inject({
        method: "GET",
        url: `/admin/projects/drafts/${saved.id}`,
        headers: { cookie },
      });
      expect(recovered.json()).toEqual(saved);
    });

    it("rejects missing and foreign origins for writes even with a session", async () => {
      const saved = (await create()).json();
      for (const requestOrigin of [undefined, "https://other.example"]) {
        for (const method of ["POST", "PUT"] as const) {
          const result = await app.inject({
            method,
            url: `/admin/projects/drafts${method === "PUT" ? `/${saved.id}` : ""}`,
            headers: {
              cookie,
              ...(requestOrigin ? { origin: requestOrigin } : {}),
            },
            payload: payload(),
          });
          expect(result.statusCode).toBe(403);
        }
      }
    });

    it("does not list, read or edit published projects through draft routes", async () => {
      const [published] = await db
        .insert(schema.projects)
        .values({
          ...payload(),
          title: "Publicado",
          summary: "Resumen",
          description: "Contenido",
          status: "published",
        })
        .returning();
      ids.push(published!.id);
      const listed = await app.inject({
        method: "GET",
        url: "/admin/projects/drafts",
        headers: { cookie },
      });
      expect(listed.json()).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: published!.id }),
        ]),
      );
      for (const id of [published!.id, randomUUID()]) {
        const read = await app.inject({
          method: "GET",
          url: `/admin/projects/drafts/${id}`,
          headers: { cookie },
        });
        expect(read.statusCode).toBe(404);
        const edit = await app.inject({
          method: "PUT",
          url: `/admin/projects/drafts/${id}`,
          headers: { cookie, origin },
          payload: payload(),
        });
        // Un publicado acepta la edición como cambios pendientes; un id ajeno no.
        expect(edit.statusCode).toBe(id === published!.id ? 200 : 404);
      }
      const malformed = await app.inject({
        method: "GET",
        url: "/admin/projects/drafts/not-a-uuid",
        headers: { cookie },
      });
      expect(malformed.statusCode).toBe(400);
    });

    it("keeps drafts private, publishes complete projects, and removes them when withdrawn", async () => {
      const saved = (await create()).json();
      const publicList = () => app.inject({ method: "GET", url: "/projects" });
      const publicDetail = () =>
        app.inject({ method: "GET", url: `/projects/${saved.slug}` });
      expect((await publicList()).json()).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: saved.id })]),
      );
      expect((await publicDetail()).statusCode).toBe(404);

      const publish = () =>
        app.inject({
          method: "POST",
          url: `/admin/projects/${saved.id}/publish`,
          headers: { cookie, origin },
        });
      const incomplete = await publish();
      expect(incomplete.statusCode).toBe(400);
      expect(incomplete.json().fields).toMatchObject({
        summary: expect.any(String),
        description: expect.any(String),
      });

      const edited = await app.inject({
        method: "PUT",
        url: `/admin/projects/drafts/${saved.id}`,
        headers: { cookie, origin },
        payload: {
          ...payload(),
          slug: saved.slug,
          summary: "Resumen público",
          description: "## Detalle público",
        },
      });
      expect(edited.statusCode).toBe(200);
      const published = await publish();
      expect(published.statusCode).toBe(200);
      expect(published.json().status).toBe("published");
      expect(Date.parse(published.json().updatedAt)).toBeGreaterThanOrEqual(
        Date.parse(edited.json().updatedAt),
      );
      const listed = await publicList();
      expect(listed.statusCode).toBe(200);
      expect(listed.headers["cache-control"]).toBe("no-store");
      expect(listed.json()).toEqual(
        expect.arrayContaining([expect.objectContaining({ slug: saved.slug })]),
      );
      const detail = await publicDetail();
      expect(detail.statusCode).toBe(200);
      expect(detail.json()).toMatchObject({
        id: saved.id,
        description: "## Detalle público",
      });
      const adminPublished = await app.inject({
        method: "GET",
        url: "/admin/projects/published",
        headers: { cookie },
      });
      expect(adminPublished.json()).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: saved.id })]),
      );

      const withdrawn = await app.inject({
        method: "POST",
        url: `/admin/projects/${saved.id}/unpublish`,
        headers: { cookie, origin },
      });
      expect(withdrawn.statusCode).toBe(200);
      expect(withdrawn.json().status).toBe("draft");
      expect(Date.parse(withdrawn.json().updatedAt)).toBeGreaterThanOrEqual(
        Date.parse(published.json().updatedAt),
      );
      expect((await publicList()).json()).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: saved.id })]),
      );
      expect((await publicDetail()).statusCode).toBe(404);
    });

    it("requires the admin origin and valid project state for publication", async () => {
      const saved = (await create()).json();
      const path = `/admin/projects/${saved.id}/publish`;
      expect(
        (await app.inject({ method: "POST", url: path, headers: { cookie } }))
          .statusCode,
      ).toBe(403);
      expect(
        (
          await app.inject({
            method: "POST",
            url: path,
            headers: { cookie, origin: "https://other.example" },
          })
        ).statusCode,
      ).toBe(403);
      expect(
        (
          await app.inject({
            method: "POST",
            url: "/admin/projects/not-a-uuid/publish",
            headers: { cookie, origin },
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app.inject({
            method: "POST",
            url: `/admin/projects/${randomUUID()}/unpublish`,
            headers: { cookie, origin },
          })
        ).statusCode,
      ).toBe(404);
    });

    it("retries creation and uploads after an unconfirmed response without duplicating records", async () => {
      const key = randomUUID();
      const body = payload();
      const send = (title: string) =>
        app.inject({
          method: "POST",
          url: "/admin/projects/drafts",
          headers: { cookie, origin, "idempotency-key": key },
          payload: { ...body, title },
        });
      const first = await send("Primer intento");
      ids.push(first.json().id);
      const retry = await send("Texto conservado");
      expect(retry.statusCode).toBe(201);
      expect(retry.json()).toMatchObject({
        id: first.json().id,
        title: "Texto conservado",
      });
      const uploadKey = randomUUID();
      const upload = () =>
        app.inject({
          method: "POST",
          url: `/admin/projects/${first.json().id}/media`,
          headers: { cookie, origin, "idempotency-key": uploadKey },
          payload: {
            mimeType: "image/png",
            altText: "Carga repetida",
            data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=",
          },
        });
      const original = await upload();
      const repeated = await upload();
      expect(repeated.statusCode).toBe(201);
      expect(repeated.json().id).toBe(original.json().id);
      const listed = await app.inject({
        method: "GET",
        url: `/admin/projects/${first.json().id}/media`,
        headers: { cookie },
      });
      expect(listed.json()).toHaveLength(1);
    });

    it("returns no preview without images and falls back to the first existing image", async () => {
      const saved = (
        await create({
          ...payload(),
          summary: "Resumen",
          description: "Detalle",
        })
      ).json();
      await app.inject({
        method: "POST",
        url: `/admin/projects/${saved.id}/publish`,
        headers: { cookie, origin },
      });
      const detail = () =>
        app.inject({ method: "GET", url: `/projects/${saved.slug}` });
      expect((await detail()).json()).toMatchObject({
        media: [],
        featuredMediaId: null,
      });
      const uploaded = await app.inject({
        method: "POST",
        url: `/admin/projects/${saved.id}/media`,
        headers: { cookie, origin },
        payload: {
          mimeType: "image/png",
          altText: "Primera imagen",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=",
        },
      });
      expect((await detail()).json().featuredMediaId).toBe(uploaded.json().id);
      expect(
        (await app.inject({ method: "GET", url: "/projects" })).json(),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: saved.id,
            featuredMediaId: uploaded.json().id,
          }),
        ]),
      );
    });

    it("selects only an associated featured image and keeps alternatives public only while published", async () => {
      const saved = (
        await create({
          ...payload(),
          summary: "Resumen",
          description: "Detalle",
        })
      ).json();
      const other = (await create()).json();
      const base = `/admin/projects/${saved.id}`;
      const imageBody = {
        altText: "Portada original",
        mimeType: "image/png",
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=",
      };
      const upload = async () =>
        (
          await app.inject({
            method: "POST",
            url: `${base}/media`,
            headers: { cookie, origin },
            payload: imageBody,
          })
        ).json();
      expect(
        (
          await app.inject({ method: "GET", url: base, headers: { cookie } })
        ).json().media,
      ).toEqual([]);
      const first = await upload();
      const second = await upload();
      const feature = (mediaId: string, headers = { cookie, origin }) =>
        app.inject({
          method: "PUT",
          url: `${base}/featured-media`,
          headers,
          payload: { mediaId },
        });
      expect(
        (
          await feature(second.id, {
            cookie,
            origin: "https://foreign.example",
          })
        ).statusCode,
      ).toBe(403);
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/admin/projects/${other.id}/featured-media`,
            headers: { cookie, origin },
            payload: { mediaId: second.id },
          })
        ).statusCode,
      ).toBe(404);
      expect((await feature(second.id)).statusCode).toBe(200);
      const editAlt = (altText: string) =>
        app.inject({
          method: "PUT",
          url: `${base}/media/${second.id}`,
          headers: { cookie, origin },
          payload: { altText },
        });
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `${base}/media/${second.id}`,
            headers: { cookie },
            payload: { altText: "Sin origen" },
          })
        ).statusCode,
      ).toBe(403);
      expect((await editAlt(" ")).statusCode).toBe(400);
      expect((await editAlt("Detalle actualizado")).statusCode).toBe(200);
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/admin/projects/${other.id}/media/${second.id}`,
            headers: { cookie, origin },
            payload: { altText: "Otro" },
          })
        ).statusCode,
      ).toBe(404);
      await Promise.all([feature(first.id), feature(second.id)]);
      const listed = (
        await app.inject({
          method: "GET",
          url: `${base}/media`,
          headers: { cookie },
        })
      ).json();
      expect(
        listed.filter((image: { isFeatured: boolean }) => image.isFeatured),
      ).toHaveLength(1);
      await feature(second.id);
      await app.inject({
        method: "POST",
        url: `${base}/publish`,
        headers: { cookie, origin },
      });
      const detail = () =>
        app.inject({ method: "GET", url: `/projects/${saved.slug}` });
      expect((await detail()).json()).toMatchObject({
        featuredMediaId: second.id,
        media: expect.arrayContaining([
          expect.objectContaining({
            id: second.id,
            altText: "Detalle actualizado",
          }),
        ]),
      });
      await app.inject({
        method: "DELETE",
        url: `${base}/media/${second.id}`,
        headers: { cookie, origin },
      });
      expect((await detail()).json().featuredMediaId).toBe(first.id);
      await app.inject({
        method: "POST",
        url: `${base}/unpublish`,
        headers: { cookie, origin },
      });
      expect((await detail()).statusCode).toBe(404);
      expect(
        (
          await app.inject({
            method: "GET",
            url: `/projects/media/${first.id}`,
          })
        ).statusCode,
      ).toBe(404);
      expect(
        (
          await app.inject({
            method: "GET",
            url: `${base}/media`,
            headers: { cookie },
          })
        ).json(),
      ).toHaveLength(1);
    });

    it("validates images, protects drafts, and serves only published project media", async () => {
      const saved = (
        await create({
          ...payload(),
          summary: "Resumen",
          description: "Detalle",
        })
      ).json();
      const file =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=";
      const url = `/admin/projects/${saved.id}/media`;
      const body = {
        altText: "Vista de la portada",
        mimeType: "image/png",
        data: file,
      };
      expect(
        (
          await app.inject({
            method: "POST",
            url,
            headers: { origin },
            payload: body,
          })
        ).statusCode,
      ).toBe(401);
      expect(
        (
          await app.inject({
            method: "POST",
            url,
            headers: { cookie },
            payload: body,
          })
        ).statusCode,
      ).toBe(403);
      expect((await app.inject({ method: "GET", url })).statusCode).toBe(401);
      for (const invalid of [
        { ...body, altText: " " },
        { ...body, altText: "a".repeat(301) },
        { ...body, mimeType: "image/jpeg" },
        { ...body, mimeType: "image/svg+xml" },
        { ...body, data: Buffer.from("not an image").toString("base64") },
        { ...body, extra: true },
        { ...body, data: Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64") },
      ]) {
        const result = await app.inject({
          method: "POST",
          url,
          headers: { cookie, origin },
          payload: invalid,
        });
        expect(result.statusCode).toBe(400);
      }
      const upload = await app.inject({
        method: "POST",
        url,
        headers: { cookie, origin },
        payload: body,
      });
      expect(upload.statusCode).toBe(201);
      const image = upload.json();
      expect(image).toMatchObject({
        projectId: saved.id,
        altText: body.altText,
        mimeType: body.mimeType,
      });
      expect(image).not.toHaveProperty("bytes");
      const publicFile = `/projects/media/${image.id}`;
      const privateFile = `${url}/${image.id}/file`;
      expect(
        (await app.inject({ method: "GET", url: publicFile })).statusCode,
      ).toBe(404);
      expect(
        (await app.inject({ method: "GET", url: privateFile })).statusCode,
      ).toBe(401);
      expect(
        (
          await app.inject({
            method: "GET",
            url: privateFile,
            headers: { cookie },
          })
        ).statusCode,
      ).toBe(200);
      expect(
        (
          await app.inject({
            method: "GET",
            url: `/admin/projects/${randomUUID()}/media/${image.id}/file`,
            headers: { cookie },
          })
        ).statusCode,
      ).toBe(404);
      expect(
        (
          await app.inject({
            method: "POST",
            url: `/admin/projects/${saved.id}/publish`,
            headers: { cookie, origin },
          })
        ).statusCode,
      ).toBe(200);
      expect(
        (
          await app.inject({ method: "GET", url: `/projects/${saved.slug}` })
        ).json().media,
      ).toEqual([
        expect.objectContaining({ id: image.id, altText: body.altText }),
      ]);
      const visible = await app.inject({ method: "GET", url: publicFile });
      expect(visible.statusCode).toBe(200);
      expect(visible.headers["content-type"]).toBe("image/png");
      expect(visible.headers["x-content-type-options"]).toBe("nosniff");
      expect(
        (
          await app.inject({
            method: "POST",
            url: `/admin/projects/${saved.id}/unpublish`,
            headers: { cookie, origin },
          })
        ).statusCode,
      ).toBe(200);
      expect(
        (await app.inject({ method: "GET", url: publicFile })).statusCode,
      ).toBe(404);
      expect(
        (
          await app.inject({
            method: "DELETE",
            url: `${url}/${image.id}`,
            headers: { cookie, origin },
          })
        ).statusCode,
      ).toBe(200);
      expect(
        (await app.inject({ method: "GET", url, headers: { cookie } })).json(),
      ).toEqual([]);
    });

    it("keeps the published project while changes stay pending", async () => {
      const [published] = await db
        .insert(schema.projects)
        .values({
          ...payload(),
          title: "Versión pública",
          summary: "Resumen",
          description: "Contenido",
          status: "published",
        })
        .returning();
      ids.push(published!.id);
      const send = (method: "PUT" | "POST", url: string, body?: object) =>
        app.inject({
          method,
          url,
          headers: { cookie, origin },
          ...(body ? { payload: body } : {}),
        });
      const publicDetail = () =>
        app.inject({ method: "GET", url: `/projects/${published!.slug}` });

      expect(
        (await send("POST", `/admin/projects/${published!.id}/publish`))
          .statusCode,
      ).toBe(404);
      const edited = await send(
        "PUT",
        `/admin/projects/drafts/${published!.id}`,
        {
          ...payload(),
          slug: published!.slug,
          title: "Versión en borrador",
          summary: "Resumen nuevo",
          description: "Contenido nuevo",
        },
      );
      expect(edited.statusCode).toBe(200);
      expect(edited.json()).toMatchObject({
        status: "published",
        title: "Versión pública",
        pending: { title: "Versión en borrador" },
      });
      const live = (await publicDetail()).json();
      expect(live.title).toBe("Versión pública");
      expect("pending" in live).toBe(false);
      const publicList = (
        await app.inject({ method: "GET", url: "/projects" })
      ).json() as { id: string }[];
      expect(
        "pending" in publicList.find((item) => item.id === published!.id)!,
      ).toBe(false);

      // Publicar con un resumen vacío en los cambios pendientes se rechaza.
      await send("PUT", `/admin/projects/drafts/${published!.id}`, {
        ...payload(),
        slug: published!.slug,
        summary: "",
        description: "",
      });
      const incomplete = await send(
        "POST",
        `/admin/projects/${published!.id}/publish`,
      );
      expect(incomplete.statusCode).toBe(400);
      expect(incomplete.json().fields).toHaveProperty("summary");

      const discarded = await send(
        "POST",
        `/admin/projects/${published!.id}/discard`,
      );
      expect(discarded.statusCode).toBe(200);
      expect(discarded.json().pending).toBeNull();
      expect(
        (await send("POST", `/admin/projects/${published!.id}/discard`))
          .statusCode,
      ).toBe(404);

      await send("PUT", `/admin/projects/drafts/${published!.id}`, {
        ...payload(),
        slug: published!.slug,
        title: "Versión aplicada",
        summary: "Resumen aplicado",
        description: "Contenido aplicado",
      });
      const applied = await send(
        "POST",
        `/admin/projects/${published!.id}/publish`,
      );
      expect(applied.statusCode).toBe(200);
      expect(applied.json()).toMatchObject({
        title: "Versión aplicada",
        pending: null,
      });
      expect((await publicDetail()).json().title).toBe("Versión aplicada");

      // Retirar conserva la última versión editada como borrador.
      await send("PUT", `/admin/projects/drafts/${published!.id}`, {
        ...payload(),
        slug: published!.slug,
        title: "Último borrador",
        summary: "Resumen",
        description: "Contenido",
      });
      const withdrawn = await send(
        "POST",
        `/admin/projects/${published!.id}/unpublish`,
      );
      expect(withdrawn.json()).toMatchObject({
        status: "draft",
        title: "Último borrador",
        pending: null,
      });
      expect((await publicDetail()).statusCode).toBe(404);
    });
  },
);
