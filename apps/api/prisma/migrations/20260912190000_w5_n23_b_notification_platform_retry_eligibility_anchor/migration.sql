-- W5-N23-b — Durable Notification Platform Retry Eligibility anchor persistence on Notification Delivery owner.
-- Storage only. Canonical platform retry eligibility anchor state only. No eligibility evaluation.
-- No backoff calculation. No scheduling. No execution. No timers/workers/orchestration.
-- Persistence only; restart recovery and operational continuity are later slices.
-- Persisted eligibility data is informational until consumed by future approved packages.

CREATE TABLE "workspace_notification_platform_retry_eligibility_anchors" (
    "workspace_id" TEXT NOT NULL,
    "eligibility_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_retry_eligibility_type" TEXT NOT NULL,
    "eligibility_anchor_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_retry_eligibility_anchors_pkey" PRIMARY KEY ("workspace_id", "eligibility_anchor_id")
);
