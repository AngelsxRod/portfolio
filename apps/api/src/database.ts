import "dotenv/config";
import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./db/schema.js";

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

      this.pool = new Pool({ connectionString: databaseUrl });
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
