-- W5-N05-b — Durable Notification Platform Integration anchor persistence on Notification Delivery owner.
-- Canonical platform integration state only. No delivery state. No runtime state. No transport I/O.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_integration_anchors" (
    "workspace_id" TEXT NOT NULL,
    "integration_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_integration_type" TEXT NOT NULL,
    "integration_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_integration_anchors_pkey" PRIMARY KEY ("workspace_id", "integration_anchor_id")
);
