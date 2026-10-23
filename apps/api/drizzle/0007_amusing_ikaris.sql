CREATE TYPE "public"."experience_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization" varchar(120) NOT NULL,
	"title" varchar(120) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"description" text,
	"achievements" text[] DEFAULT '{}'::text[] NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"status" "experience_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "experiences_organization_not_blank" CHECK (btrim("experiences"."organization") <> ''),
	CONSTRAINT "experiences_title_not_blank" CHECK (btrim("experiences"."title") <> ''),
	CONSTRAINT "experiences_description_not_blank" CHECK ("experiences"."description" IS NULL OR btrim("experiences"."description") <> ''),
	CONSTRAINT "experiences_dates_ordered" CHECK ("experiences"."end_date" IS NULL OR "experiences"."end_date" >= "experiences"."start_date"),
	CONSTRAINT "experiences_achievements_max" CHECK (cardinality("experiences"."achievements") <= 10)
);
--> statement-breakpoint
CREATE INDEX "experiences_status_position_idx" ON "experiences" USING btree ("status","position");