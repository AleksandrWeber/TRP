-- W5-N11-b — Durable Notification Platform Worker Runtime anchor persistence on Notification Delivery owner.
-- Canonical platform worker runtime anchor state only. No runtime execution. No scheduler state.
-- No retry state. No dead-letter state. No orchestration state. No transport execution.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_worker_runtime_anchors" (
    "workspace_id" TEXT NOT NULL,
    "worker_runtime_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_worker_runtime_type" TEXT NOT NULL,
    "worker_runtime_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_worker_runtime_anchors_pkey" PRIMARY KEY ("workspace_id", "worker_runtime_anchor_id")
);
