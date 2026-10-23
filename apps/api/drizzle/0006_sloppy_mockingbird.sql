ALTER TABLE "skills" DROP CONSTRAINT "skills_category_not_blank";--> statement-breakpoint
ALTER TABLE "skills" ALTER COLUMN "category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" DROP COLUMN "category";