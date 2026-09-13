-- W5-N26-b — Durable Notification Platform Retry Scheduling Decision Evaluation anchor
-- persistence on Notification Delivery owner.
-- Storage only. Canonical platform decision evaluation anchor state only.
-- No runtime decision evaluation. No Retry Backoff Calculation. No Retry Eligibility.
-- No runtime scheduling. No execution. No timers/workers/orchestration.
-- Persistence only; restart recovery and operational continuity are later slices.
-- Persisted evaluation data is informational until consumed by future approved packages.
--
-- Table map shortened to stay within PostgreSQL's 63-char identifier limit.
-- The longer name `…_decision_evaluation_anchors` truncated to the same identifier
-- as its `_pkey` constraint, causing 42P07 "relation already exists".

CREATE TABLE "workspace_notification_platform_retry_decision_eval_anchors" (
    "workspace_id" TEXT NOT NULL,
    "evaluation_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_retry_scheduling_decision_evaluation_type" TEXT NOT NULL,
    "evaluation_anchor_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ws_np_retry_decision_eval_anchors_pkey" PRIMARY KEY ("workspace_id", "evaluation_anchor_id")
);
