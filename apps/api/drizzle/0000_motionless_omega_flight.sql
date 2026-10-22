CREATE TYPE "public"."project_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(160) NOT NULL,
	"summary" text,
	"description" text,
	"demo_url" text,
	"code_url" text,
	"technologies" text[] DEFAULT '{}'::text[] NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug"),
	CONSTRAINT "projects_title_not_blank" CHECK (btrim("projects"."title") <> ''),
	CONSTRAINT "projects_slug_not_blank" CHECK (btrim("projects"."slug") <> ''),
	CONSTRAINT "projects_published_content_required" CHECK ("projects"."status" <> 'published' or (nullif(btrim("projects"."summary"), '') is not null and nullif(btrim("projects"."description"), '') is not null))
);
