import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { Environment } from './config/environment';

export async function configureApp(app: INestApplication) {
  const config = app.get(ConfigService<Environment, true>);
  const origins = config
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());
  app.enableCors({ credentials: true, origin: origins });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const swagger = new DocumentBuilder()
    .setTitle('Portfolio API')
    .setDescription('API del portafolio profesional de Angel Rodriguez')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  return { app, port: config.get('PORT', { infer: true }) };
}

export { AppModule };
