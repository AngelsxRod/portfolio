CREATE TABLE "skill_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_categories_name_not_blank" CHECK (btrim("skill_categories"."name") <> '')
);
--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "category_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "skill_categories_name_lower_idx" ON "skill_categories" USING btree (lower("name"));--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."skill_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skills_category_id_idx" ON "skills" USING btree ("category_id");--> statement-breakpoint
INSERT INTO "skill_categories" ("name", "position")
SELECT "name", (row_number() OVER (ORDER BY "first_seen", lower("name")) - 1)::integer
FROM (
	SELECT DISTINCT ON (lower(btrim("category"))) btrim("category") AS "name", "created_at" AS "first_seen"
	FROM "skills"
	ORDER BY lower(btrim("category")), "created_at"
) AS "distinct_categories";--> statement-breakpoint
UPDATE "skills" SET "category_id" = "skill_categories"."id" FROM "skill_categories" WHERE lower("skill_categories"."name") = lower(btrim("skills"."category"));
