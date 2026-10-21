import { neon } from "@neondatabase/serverless";

export async function checkDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const sql = neon(databaseUrl);
  await sql`SELECT 1`;
}
