-- W5-N15-b — Durable Notification Platform Telemetry anchor persistence on Notification Delivery owner.
-- Canonical platform telemetry anchor state only. No metrics collection. No exporters.
-- No dashboards. No runtime aggregation. No recovery store.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_telemetry_anchors" (
    "workspace_id" TEXT NOT NULL,
    "telemetry_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_telemetry_type" TEXT NOT NULL,
    "telemetry_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_telemetry_anchors_pkey" PRIMARY KEY ("workspace_id", "telemetry_anchor_id")
);
