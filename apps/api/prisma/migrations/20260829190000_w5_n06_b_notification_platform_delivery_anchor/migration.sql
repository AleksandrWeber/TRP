-- W5-N06-b — Durable Notification Platform Delivery anchor persistence on Notification Delivery owner.
-- Canonical platform delivery anchor state only. No runtime execution. No dispatcher state.
-- No retry state. No scheduler state. No queue workers. No transport execution.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_delivery_anchors" (
    "workspace_id" TEXT NOT NULL,
    "delivery_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_delivery_type" TEXT NOT NULL,
    "delivery_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_delivery_anchors_pkey" PRIMARY KEY ("workspace_id", "delivery_anchor_id")
);
