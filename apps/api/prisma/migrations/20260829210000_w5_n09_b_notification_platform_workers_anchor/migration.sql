-- W5-N09-b — Durable Notification Platform Workers anchor persistence on Notification Delivery owner.
-- Canonical platform workers anchor state only. No runtime execution. No worker execution state.
-- No retry state. No scheduler state. No dead-letter state. No orchestration state. No transport execution.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_workers_anchors" (
    "workspace_id" TEXT NOT NULL,
    "workers_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_worker_type" TEXT NOT NULL,
    "workers_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_workers_anchors_pkey" PRIMARY KEY ("workspace_id", "workers_anchor_id")
);
