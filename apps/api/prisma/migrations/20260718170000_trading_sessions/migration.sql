-- RC-16 M2 US156/US157 durable Trading Session foundation.
-- Lease timestamps are operational only and never enter financial calculations.

CREATE TABLE "trading_sessions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "paper_account_id" TEXT NOT NULL,
    "deployment_id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lease_owner_id" TEXT,
    "fencing_token" INTEGER,
    "lease_acquired_at" TIMESTAMP(3),
    "lease_expires_at" TIMESTAMP(3),
    "lease_heartbeat_at" TIMESTAMP(3),
    "last_fencing_token" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "actor_id" TEXT NOT NULL,
    "correlation_id" TEXT,
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "trading_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "trading_sessions_manual_origin_check" CHECK ("origin" = 'manual')
);

CREATE UNIQUE INDEX "trading_sessions_workspace_id_idempotency_key_key"
    ON "trading_sessions"("workspace_id", "idempotency_key");

CREATE INDEX "trading_sessions_workspace_id_status_idx"
    ON "trading_sessions"("workspace_id", "status");

CREATE INDEX "trading_sessions_workspace_id_paper_account_id_idx"
    ON "trading_sessions"("workspace_id", "paper_account_id");
