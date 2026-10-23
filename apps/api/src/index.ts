import "reflect-metadata";
import "dotenv/config";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./server.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 7 * 1024 * 1024 }),
  );
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
  Logger.log(`api running on ${port}`, "Bootstrap");
}

void bootstrap().catch((error: unknown) => {
  Logger.error(error, "Bootstrap");
  process.exitCode = 1;
});
