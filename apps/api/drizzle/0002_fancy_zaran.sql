CREATE TABLE "project_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"mime_type" varchar(16) NOT NULL,
	"alt_text" varchar(300) NOT NULL,
	"bytes" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_media_alt_not_blank" CHECK (btrim("project_media"."alt_text") <> ''),
	CONSTRAINT "project_media_bytes_limit" CHECK (octet_length("project_media"."bytes") between 1 and 5242880),
	CONSTRAINT "project_media_mime_type" CHECK ("project_media"."mime_type" in ('image/png', 'image/jpeg', 'image/webp'))
);
--> statement-breakpoint
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_media_project_id_idx" ON "project_media" USING btree ("project_id");