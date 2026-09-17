-- V3-L02-S-HS1 — Durable human-start authorization proofs (PO-L02-05A…D).
-- Token plaintext is never persisted (token_hash only). Claim ≠ venue submission.

CREATE TABLE "human_start_proofs" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "action_command" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "claimed_at" TIMESTAMP(3),
    "claimed_logical_action_id" TEXT,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "human_start_proofs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "human_start_proofs_token_hash_key" ON "human_start_proofs"("token_hash");
CREATE INDEX "human_start_proofs_workspace_id_actor_id_session_id_idx" ON "human_start_proofs"("workspace_id", "actor_id", "session_id");
CREATE INDEX "human_start_proofs_workspace_id_expires_at_idx" ON "human_start_proofs"("workspace_id", "expires_at");
