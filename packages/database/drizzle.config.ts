import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '../../apps/api/.env.local', quiet: true });

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL_UNPOOLED o DATABASE_URL es requerida');
}

export default defineConfig({
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/schema.ts',
  dbCredentials: { url },
});
