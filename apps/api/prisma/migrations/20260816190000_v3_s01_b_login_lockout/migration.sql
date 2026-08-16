-- V3-S01-b: Auth-owned login lockout persistence.
-- Not Identity profile. Not an auth session store (S01-c).

CREATE TABLE "auth_login_lockouts" (
    "user_id" TEXT NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_login_lockouts_pkey" PRIMARY KEY ("user_id")
);
