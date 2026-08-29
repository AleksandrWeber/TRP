-- W5-N10-b — Durable Notification Platform Worker Execution anchor persistence on Notification Delivery owner.
-- Canonical platform worker execution anchor state only. No runtime execution. No worker runtime state.
-- No retry state. No scheduler state. No dead-letter state. No orchestration state. No transport execution.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_worker_execution_anchors" (
    "workspace_id" TEXT NOT NULL,
    "worker_execution_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_worker_execution_type" TEXT NOT NULL,
    "worker_execution_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_worker_execution_anchors_pkey" PRIMARY KEY ("workspace_id", "worker_execution_anchor_id")
);
