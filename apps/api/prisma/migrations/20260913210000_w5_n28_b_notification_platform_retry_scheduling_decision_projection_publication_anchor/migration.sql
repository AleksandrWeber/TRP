-- W5-N28-b — Durable Notification Platform Retry Scheduling Decision Projection Publication anchor
-- persistence on Notification Delivery owner.
-- Storage only. Canonical platform decision projection publication anchor state only.
-- No runtime publication. No runtime decision projection. No Retry Backoff Calculation. No Retry Eligibility.
-- No runtime scheduling. No execution. No timers/workers/orchestration.
-- Persistence only; restart recovery and operational continuity are later slices.
-- Persisted publication data is informational until consumed by future approved packages.
--
-- Table map shortened to stay within PostgreSQL's 63-char identifier limit.

CREATE TABLE "workspace_notification_platform_retry_decision_proj_pub_anchors" (
    "workspace_id" TEXT NOT NULL,
    "publication_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_retry_scheduling_decision_projection_publication_type" TEXT NOT NULL,
    "publication_anchor_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ws_np_retry_decision_proj_pub_anchors_pkey" PRIMARY KEY ("workspace_id", "publication_anchor_id")
);
