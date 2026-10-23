CREATE TYPE "public"."profile_version" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "profile" (
	"version" "profile_version" PRIMARY KEY NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"presentation" text NOT NULL,
	"location" varchar(120),
	"email" varchar(254),
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_display_name_not_blank" CHECK (btrim("profile"."display_name") <> ''),
	CONSTRAINT "profile_presentation_not_blank" CHECK (btrim("profile"."presentation") <> ''),
	CONSTRAINT "profile_location_not_blank" CHECK ("profile"."location" IS NULL OR btrim("profile"."location") <> ''),
	CONSTRAINT "profile_email_not_blank" CHECK ("profile"."email" IS NULL OR btrim("profile"."email") <> ''),
	CONSTRAINT "profile_links_array" CHECK (jsonb_typeof("profile"."links") = 'array' AND jsonb_array_length("profile"."links") <= 10)
);
