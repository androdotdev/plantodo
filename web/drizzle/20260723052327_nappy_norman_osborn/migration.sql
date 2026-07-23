ALTER TABLE "plans" RENAME TO "posts";--> statement-breakpoint
DROP INDEX "plans_userId_idx";--> statement-breakpoint
CREATE INDEX "posts_userId_idx" ON "posts" ("user_id");