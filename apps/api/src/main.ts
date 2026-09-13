import 'reflect-metadata';
import { createApp } from './bootstrap';

async function bootstrap() {
  const { app, port } = await createApp();
  await app.listen(port);
}

void bootstrap();
