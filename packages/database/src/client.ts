import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 1,
    prepare: false,
  });

  return { client, database: drizzle({ client }) };
}

export async function checkDatabase(databaseUrl: string): Promise<void> {
  const { client, database } = createDatabase(databaseUrl);
  try {
    await database.execute(sql`select 1`);
  } finally {
    await client.end({ timeout: 1 });
  }
}
