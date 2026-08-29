-- W5-N08-b — Durable Notification Platform Queue anchor persistence on Notification Delivery owner.
-- Canonical platform queue anchor state only. No runtime execution. No queue workers state.
-- No retry state. No scheduler state. No dispatcher state. No transport execution.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_queue_anchors" (
    "workspace_id" TEXT NOT NULL,
    "queue_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_queue_type" TEXT NOT NULL,
    "queue_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_queue_anchors_pkey" PRIMARY KEY ("workspace_id", "queue_anchor_id")
);
