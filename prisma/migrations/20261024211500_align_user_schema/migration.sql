-- Replace the old status enum with the statuses used by the current User model.
-- The database was checked before this migration: no row uses INACTIVE.
BEGIN;
CREATE TYPE "user_status_new" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'DEACTIVATED');
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "user_status_new" USING ("status"::text::"user_status_new");
ALTER TYPE "user_status" RENAME TO "user_status_old";
ALTER TYPE "user_status_new" RENAME TO "user_status";
DROP TYPE "user_status_old";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';
COMMIT;

-- Align nullable fields, URL capacity, defaults, and timestamp precision.
ALTER TABLE "users" ALTER COLUMN "display_name" DROP NOT NULL,
ALTER COLUMN "avatar_url" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION',
ALTER COLUMN "email_verified_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3);
