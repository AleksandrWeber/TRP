-- W5-N14-b — Durable Notification Platform Dead Letter anchor persistence on Notification Delivery owner.
-- Canonical platform dead-letter anchor state only. No dead-letter runtime. No dead-letter replay.
-- No dead-letter processing. No retry integration. No scheduler integration. No workers.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_notification_platform_dead_letter_anchors" (
    "workspace_id" TEXT NOT NULL,
    "dead_letter_anchor_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "platform_dead_letter_type" TEXT NOT NULL,
    "dead_letter_state" TEXT NOT NULL,
    "channel_scope" TEXT,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_notification_platform_dead_letter_anchors_pkey" PRIMARY KEY ("workspace_id", "dead_letter_anchor_id")
);
