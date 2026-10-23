import "dotenv/config";
import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./db/schema.js";

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool?: Pool;
  private database?: NodePgDatabase<typeof schema>;

  getDatabase() {
    if (!this.database) {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error("DATABASE_URL is not configured");
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        // Pocas conexiones por instancia: en funciones serverless se multiplican.
        max: positiveInt(process.env.DATABASE_POOL_MAX, 5),
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 5_000,
        // Una consulta atascada no debe retener una conexión ni la petición.
        statement_timeout: positiveInt(
          process.env.DATABASE_STATEMENT_TIMEOUT_MS,
          10_000,
        ),
        allowExitOnIdle: true,
      });
      this.database = drizzle({ client: this.pool, schema });
    }

    return this.database;
  }

  async check(): Promise<void> {
    await this.getDatabase().execute(sql`SELECT 1`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}
