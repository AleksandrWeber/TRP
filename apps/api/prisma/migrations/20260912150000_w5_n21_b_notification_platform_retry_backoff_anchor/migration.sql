-- W5-N21-b — Durable Notification Platform Retry Backoff anchor persistence on Notification Delivery owner.
-- Canonical platform retry backoff anchor state only. No backoff calculation.
-- No restart recovery hydrate. No operational continuity. No transport I/O. No policy evaluation.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_retry_backoff_anchors" (
    "workspace_id" TEXT NOT NULL,
    "retry_backoff_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_retry_backoff_type" TEXT NOT NULL,
    "retry_backoff_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_retry_backoff_anchors_pkey" PRIMARY KEY ("workspace_id", "retry_backoff_anchor_id")
);
