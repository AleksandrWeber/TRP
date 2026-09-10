-- W5-N19-b — Durable Notification Platform Retry Scheduling anchor persistence on Notification Delivery owner.
-- Canonical platform retry scheduling eligibility-timing anchor state only. No retry scheduling runtime.
-- No restart recovery hydrate. No operational continuity. No transport I/O. No timing calculation.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_retry_scheduling_anchors" (
    "workspace_id" TEXT NOT NULL,
    "retry_scheduling_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_retry_scheduling_type" TEXT NOT NULL,
    "retry_scheduling_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_retry_scheduling_anchors_pkey" PRIMARY KEY ("workspace_id", "retry_scheduling_anchor_id")
);
