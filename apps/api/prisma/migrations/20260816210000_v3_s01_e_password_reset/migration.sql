-- Auth-owned password reset tokens (V3-S01-e). Not Identity. Not Notification Delivery.

CREATE TABLE "auth_password_resets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_password_resets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_password_resets_token_hash_key" ON "auth_password_resets"("token_hash");
CREATE INDEX "auth_password_resets_user_id_idx" ON "auth_password_resets"("user_id");
