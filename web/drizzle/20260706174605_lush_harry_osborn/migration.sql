-- Step 0: pre-flight — abort if count > 0
-- SELECT COUNT(*) FROM "plans" p
-- JOIN "apikey" a ON p.key_id = a.id
-- WHERE a.reference_id IS NULL;

ALTER TABLE "plans" ADD COLUMN "user_id" text REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint

UPDATE "plans" SET "user_id" = (
  SELECT "reference_id" FROM "apikey"
  WHERE "apikey"."id" = "plans"."key_id"
);--> statement-breakpoint

ALTER TABLE "plans" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint

CREATE INDEX "plans_userId_idx" ON "plans" ("user_id");--> statement-breakpoint

ALTER TABLE "plans" DROP CONSTRAINT "plans_key_id_apikey_id_fkey";--> statement-breakpoint

ALTER TABLE "plans" DROP COLUMN "key_id";