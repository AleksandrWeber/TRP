-- W5-N03-b — Durable Slack / Discord / Teams notification anchor persistence on Notification Delivery owner.
-- Canonical notification anchors only. No webhook I/O. No outbound delivery execution.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_slack_discord_teams_notification_anchors" (
    "workspace_id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "notification_channel" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "recipient_identifier" TEXT,
    "template_identifier" TEXT,
    "delivery_state" TEXT NOT NULL,
    "integrity_metadata" TEXT,
    "correlation_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_actor_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_slack_discord_teams_notification_anchors_pkey" PRIMARY KEY ("workspace_id", "notification_id")
);
