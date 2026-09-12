-- W5-N25-b — Durable Notification Platform Retry Scheduling Decision anchor persistence
-- on Notification Delivery owner.
-- Storage only. Canonical platform decision anchor state only. No runtime decision logic.
-- No Retry Backoff Calculation. No Retry Eligibility. No runtime scheduling. No execution.
-- No timers/workers/orchestration. Persistence only; restart recovery and operational
-- continuity are later slices. Persisted decision data is informational until consumed
-- by future approved packages.

CREATE TABLE "workspace_notification_platform_retry_decision_anchors" (
    "workspace_id" TEXT NOT NULL,
    "decision_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_retry_scheduling_decision_type" TEXT NOT NULL,
    "decision_anchor_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_retry_decision_anchors_pkey" PRIMARY KEY ("workspace_id", "decision_anchor_id")
);
