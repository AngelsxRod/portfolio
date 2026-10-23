CREATE TYPE "public"."certificate_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"issuer" varchar(120) NOT NULL,
	"issue_date" date NOT NULL,
	"verification_url" varchar(2048),
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"status" "certificate_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_name_not_blank" CHECK (btrim("certificates"."name") <> ''),
	CONSTRAINT "certificates_issuer_not_blank" CHECK (btrim("certificates"."issuer") <> ''),
	CONSTRAINT "certificates_url_not_blank" CHECK ("certificates"."verification_url" IS NULL OR btrim("certificates"."verification_url") <> ''),
	CONSTRAINT "certificates_description_not_blank" CHECK ("certificates"."description" IS NULL OR btrim("certificates"."description") <> '')
);
--> statement-breakpoint
CREATE INDEX "certificates_status_position_idx" ON "certificates" USING btree ("status","position");