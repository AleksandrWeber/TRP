-- W5-N13-b — Durable Notification Platform Retry anchor persistence on Notification Delivery owner.
-- Canonical platform retry anchor state only. No retry runtime. No retry execution.
-- No retry scheduling. No retry queue processing. No dead-letter state. No orchestration state.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_retry_anchors" (
    "workspace_id" TEXT NOT NULL,
    "retry_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_retry_type" TEXT NOT NULL,
    "retry_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_retry_anchors_pkey" PRIMARY KEY ("workspace_id", "retry_anchor_id")
);
