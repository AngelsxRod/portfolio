import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  uniqueIndex,
  check,
  customType,
  integer,
  jsonb,
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
    pending: jsonb("pending").$type<Record<string, unknown>>(),
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
    pending: jsonb("pending").$type<Record<string, unknown>>(),
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

export const experienceStatus = pgEnum("experience_status", [
  "draft",
  "published",
]);

export const experiences = pgTable(
  "experiences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organization: varchar("organization", { length: 120 }).notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    description: text("description"),
    achievements: text("achievements")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    position: integer("position").notNull().default(0),
    status: experienceStatus("status").notNull().default("draft"),
    pending: jsonb("pending").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "experiences_organization_not_blank",
      sql`btrim(${table.organization}) <> ''`,
    ),
    check("experiences_title_not_blank", sql`btrim(${table.title}) <> ''`),
    check(
      "experiences_description_not_blank",
      sql`${table.description} IS NULL OR btrim(${table.description}) <> ''`,
    ),
    check(
      "experiences_dates_ordered",
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`,
    ),
    check(
      "experiences_achievements_max",
      sql`cardinality(${table.achievements}) <= 10`,
    ),
    index("experiences_status_position_idx").on(table.status, table.position),
  ],
);

export const educationStatus = pgEnum("education_status", [
  "draft",
  "published",
]);

export const educationLevel = pgEnum("education_level", [
  "secondary",
  "university",
  "other",
]);

export const education = pgTable(
  "education",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    institution: varchar("institution", { length: 120 }).notNull(),
    level: educationLevel("level").notNull(),
    program: varchar("program", { length: 120 }).notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    description: text("description"),
    position: integer("position").notNull().default(0),
    status: educationStatus("status").notNull().default("draft"),
    pending: jsonb("pending").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "education_institution_not_blank",
      sql`btrim(${table.institution}) <> ''`,
    ),
    check("education_program_not_blank", sql`btrim(${table.program}) <> ''`),
    check(
      "education_description_not_blank",
      sql`${table.description} IS NULL OR btrim(${table.description}) <> ''`,
    ),
    check(
      "education_dates_ordered",
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`,
    ),
    index("education_status_position_idx").on(table.status, table.position),
  ],
);

export const certificateStatus = pgEnum("certificate_status", [
  "draft",
  "published",
]);

export const certificates = pgTable(
  "certificates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    issuer: varchar("issuer", { length: 120 }).notNull(),
    issueDate: date("issue_date", { mode: "string" }).notNull(),
    verificationUrl: varchar("verification_url", { length: 2048 }),
    description: text("description"),
    position: integer("position").notNull().default(0),
    status: certificateStatus("status").notNull().default("draft"),
    pending: jsonb("pending").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("certificates_name_not_blank", sql`btrim(${table.name}) <> ''`),
    check("certificates_issuer_not_blank", sql`btrim(${table.issuer}) <> ''`),
    check(
      "certificates_url_not_blank",
      sql`${table.verificationUrl} IS NULL OR btrim(${table.verificationUrl}) <> ''`,
    ),
    check(
      "certificates_description_not_blank",
      sql`${table.description} IS NULL OR btrim(${table.description}) <> ''`,
    ),
    index("certificates_status_position_idx").on(table.status, table.position),
  ],
);

export const profileVersion = pgEnum("profile_version", ["draft", "published"]);

export type ProfileLink = { label: string; url: string };

// A single profile with two versions: the draft being edited and the published copy.
export const profile = pgTable(
  "profile",
  {
    version: profileVersion("version").primaryKey(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    presentation: text("presentation").notNull(),
    location: varchar("location", { length: 120 }),
    email: varchar("email", { length: 254 }),
    links: jsonb("links")
      .$type<ProfileLink[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "profile_display_name_not_blank",
      sql`btrim(${table.displayName}) <> ''`,
    ),
    check(
      "profile_presentation_not_blank",
      sql`btrim(${table.presentation}) <> ''`,
    ),
    check(
      "profile_location_not_blank",
      sql`${table.location} IS NULL OR btrim(${table.location}) <> ''`,
    ),
    check(
      "profile_email_not_blank",
      sql`${table.email} IS NULL OR btrim(${table.email}) <> ''`,
    ),
    check(
      "profile_links_array",
      sql`jsonb_typeof(${table.links}) = 'array' AND jsonb_array_length(${table.links}) <= 10`,
    ),
  ],
);
