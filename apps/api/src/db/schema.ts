import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const adminSessions = pgTable("admin_sessions", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const adminLoginAttempts = pgTable("admin_login_attempts", {
  sourceHash: varchar("source_hash", { length: 64 }).primaryKey(),
  failedCount: integer("failed_count").notNull().default(0),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectStatus = pgEnum("project_status", ["draft", "published"]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    summary: text("summary"),
    description: text("description"),
    demoUrl: text("demo_url"),
    codeUrl: text("code_url"),
    technologies: text("technologies")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    position: integer("position").notNull().default(0),
    status: projectStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("projects_title_not_blank", sql`btrim(${table.title}) <> ''`),
    check("projects_slug_not_blank", sql`btrim(${table.slug}) <> ''`),
    check(
      "projects_published_content_required",
      sql`${table.status} <> 'published' or (nullif(btrim(${table.summary}), '') is not null and nullif(btrim(${table.description}), '') is not null)`,
    ),
  ],
);
