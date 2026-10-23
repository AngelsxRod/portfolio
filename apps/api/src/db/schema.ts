import { sql } from "drizzle-orm";
import {
  boolean,
  uniqueIndex,
  check,
  customType,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

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

export const projectMedia = pgTable(
  "project_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    mimeType: varchar("mime_type", { length: 16 }).notNull(),
    altText: varchar("alt_text", { length: 300 }).notNull(),
    isFeatured: boolean("is_featured").notNull().default(false),
    bytes: bytea("bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("project_media_project_id_idx").on(table.projectId),
    uniqueIndex("project_media_one_featured_idx")
      .on(table.projectId)
      .where(sql`${table.isFeatured} = true`),
    check("project_media_alt_not_blank", sql`btrim(${table.altText}) <> ''`),
    check(
      "project_media_bytes_limit",
      sql`octet_length(${table.bytes}) between 1 and 5242880`,
    ),
    check(
      "project_media_mime_type",
      sql`${table.mimeType} in ('image/png', 'image/jpeg', 'image/webp')`,
    ),
  ],
);

export const skillStatus = pgEnum("skill_status", ["draft", "published"]);

export const skillCategories = pgTable(
  "skill_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("skill_categories_name_not_blank", sql`btrim(${table.name}) <> ''`),
    uniqueIndex("skill_categories_name_lower_idx").on(
      sql`lower(${table.name})`,
    ),
  ],
);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => skillCategories.id, { onDelete: "restrict" }),
    position: integer("position").notNull().default(0),
    status: skillStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("skills_name_not_blank", sql`btrim(${table.name}) <> ''`),
    uniqueIndex("skills_name_lower_idx").on(sql`lower(${table.name})`),
    index("skills_status_position_idx").on(table.status, table.position),
    index("skills_category_id_idx").on(table.categoryId),
  ],
);
