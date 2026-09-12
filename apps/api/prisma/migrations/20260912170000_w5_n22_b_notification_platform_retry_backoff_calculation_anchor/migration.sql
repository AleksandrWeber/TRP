-- W5-N22-b — Durable Notification Platform Retry Backoff Calculation anchor persistence on Notification Delivery owner.
-- Canonical platform retry backoff calculation anchor state only. No calculation runtime.
-- No scheduling. No execution. No timers/workers/orchestration.
-- Persistence only; restart recovery and operational continuity are later slices.
-- Persisted calculation data is informational until consumed by future approved packages.
--
-- Table map shortened so table + "_pkey" stay within PostgreSQL's 63-char identifier limit.
-- Drop truncated leftover from a prior failed apply (CREATE TABLE succeeded; pkey collided).

DROP TABLE IF EXISTS "workspace_notification_platform_retry_backoff_calculation_ancho";
DROP TABLE IF EXISTS "workspace_notification_platform_retry_backoff_calc_anchors";

CREATE TABLE "workspace_notification_platform_retry_backoff_calc_anchors" (
    "workspace_id" TEXT NOT NULL,
    "calculation_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_backoff_calculation_type" TEXT NOT NULL,
    "calculation_anchor_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_retry_backoff_calc_anchors_pkey" PRIMARY KEY ("workspace_id", "calculation_anchor_id")
);
