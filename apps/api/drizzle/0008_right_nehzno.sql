CREATE TYPE "public"."education_level" AS ENUM('secondary', 'university', 'other');--> statement-breakpoint
CREATE TYPE "public"."education_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution" varchar(120) NOT NULL,
	"level" "education_level" NOT NULL,
	"program" varchar(120) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"status" "education_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "education_institution_not_blank" CHECK (btrim("education"."institution") <> ''),
	CONSTRAINT "education_program_not_blank" CHECK (btrim("education"."program") <> ''),
	CONSTRAINT "education_description_not_blank" CHECK ("education"."description" IS NULL OR btrim("education"."description") <> ''),
	CONSTRAINT "education_dates_ordered" CHECK ("education"."end_date" IS NULL OR "education"."end_date" >= "education"."start_date")
);
--> statement-breakpoint
CREATE INDEX "education_status_position_idx" ON "education" USING btree ("status","position");