-- W5-N18-b — Durable Notification Platform Retry Execution anchor persistence on Notification Delivery owner.
-- Canonical platform retry execution anchor state only. No retry execution runtime. No restart recovery hydrate.
-- No operational continuity. No transport I/O.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_retry_execution_anchors" (
    "workspace_id" TEXT NOT NULL,
    "retry_execution_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_retry_execution_type" TEXT NOT NULL,
    "retry_execution_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_retry_execution_anchors_pkey" PRIMARY KEY ("workspace_id", "retry_execution_anchor_id")
);
