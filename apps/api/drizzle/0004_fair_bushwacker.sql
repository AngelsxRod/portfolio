CREATE TYPE "public"."skill_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"category" varchar(80) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"status" "skill_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_name_not_blank" CHECK (btrim("skills"."name") <> ''),
	CONSTRAINT "skills_category_not_blank" CHECK (btrim("skills"."category") <> '')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "skills_name_lower_idx" ON "skills" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "skills_status_position_idx" ON "skills" USING btree ("status","position");