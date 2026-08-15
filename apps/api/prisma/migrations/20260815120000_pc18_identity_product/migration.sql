-- PC-18 Identity Product: persist existing Identity profile fields on the
-- existing User table. passwordHash remains the Auth credential column and
-- may be unset until Authentication stores a hash. Not a new Source of Truth.

ALTER TABLE "User" ADD COLUMN "displayName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Active';
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
