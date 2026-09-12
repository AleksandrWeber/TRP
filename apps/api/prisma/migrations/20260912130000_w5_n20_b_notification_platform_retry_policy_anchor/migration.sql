-- W5-N20-b — Durable Notification Platform Retry Policy anchor persistence on Notification Delivery owner.
-- Canonical platform retry policy anchor state only. No retry policy evaluation runtime.
-- No restart recovery hydrate. No operational continuity. No transport I/O. No backoff calculation.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_retry_policy_anchors" (
    "workspace_id" TEXT NOT NULL,
    "retry_policy_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_retry_policy_type" TEXT NOT NULL,
    "retry_policy_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_retry_policy_anchors_pkey" PRIMARY KEY ("workspace_id", "retry_policy_anchor_id")
);
