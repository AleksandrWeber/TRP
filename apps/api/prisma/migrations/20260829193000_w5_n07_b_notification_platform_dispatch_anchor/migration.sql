-- W5-N07-b — Durable Notification Platform Dispatch anchor persistence on Notification Delivery owner.
-- Canonical platform dispatch anchor state only. No runtime execution. No dispatcher state.
-- No retry state. No scheduler state. No queue workers. No transport execution.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_dispatch_anchors" (
    "workspace_id" TEXT NOT NULL,
    "dispatch_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_dispatch_type" TEXT NOT NULL,
    "dispatch_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_dispatch_anchors_pkey" PRIMARY KEY ("workspace_id", "dispatch_anchor_id")
);
