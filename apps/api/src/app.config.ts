import compress from "@fastify/compress";
import helmet from "@fastify/helmet";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";

/** Cabeceras de seguridad y compresión comunes a todas las respuestas de la API. */
export async function configureApp(app: NestFastifyApplication) {
  // La API solo sirve JSON y binarios: sin CSP de documentos ni recursos cruzados.
  await app.register(helmet, {
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } },
    crossOriginResourcePolicy: { policy: "same-site" },
  });
  await app.register(compress, { threshold: 1024 });
}
