-- W5-N27-b — Durable Notification Platform Retry Scheduling Decision Projection anchor
-- persistence on Notification Delivery owner.
-- Storage only. Canonical platform decision projection anchor state only.
-- No runtime decision projection. No Retry Backoff Calculation. No Retry Eligibility.
-- No runtime scheduling. No execution. No timers/workers/orchestration.
-- Persistence only; restart recovery and operational continuity are later slices.
-- Persisted projection data is informational until consumed by future approved packages.
--
-- Table map shortened to stay within PostgreSQL's 63-char identifier limit.
-- The longer name `…_decision_projection_anchors` truncated to the same identifier
-- as its `_pkey` constraint, causing 42P07 "relation already exists".

CREATE TABLE "workspace_notification_platform_retry_decision_proj_anchors" (
    "workspace_id" TEXT NOT NULL,
    "projection_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_retry_scheduling_decision_projection_type" TEXT NOT NULL,
    "projection_anchor_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ws_np_retry_decision_proj_anchors_pkey" PRIMARY KEY ("workspace_id", "projection_anchor_id")
);
