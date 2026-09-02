-- W5-N17-b — Durable Notification Platform Delivery Reliability anchor persistence on Notification Delivery owner.
-- Canonical platform reliability anchor state only. No delivery execution runtime. No restart recovery hydrate.
-- No operational continuity. No retry execution. No transport I/O.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_reliability_anchors" (
    "workspace_id" TEXT NOT NULL,
    "reliability_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_reliability_type" TEXT NOT NULL,
    "reliability_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_reliability_anchors_pkey" PRIMARY KEY ("workspace_id", "reliability_anchor_id")
);
