-- W5-N12-b — Durable Notification Platform Scheduler anchor persistence on Notification Delivery owner.
-- Canonical platform scheduler anchor state only. No scheduler runtime. No scheduling engine.
-- No execution loop. No retry state. No dead-letter state. No orchestration state. No transport execution.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_scheduler_anchors" (
    "workspace_id" TEXT NOT NULL,
    "scheduler_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_scheduler_type" TEXT NOT NULL,
    "scheduler_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_scheduler_anchors_pkey" PRIMARY KEY ("workspace_id", "scheduler_anchor_id")
);
