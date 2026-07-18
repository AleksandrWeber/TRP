-- RC-16 US128–US129 / US149 durable Outbox, Inbox, and consumer checkpoints

CREATE TYPE "OutboxDeliveryStatus" AS ENUM ('pending', 'publishing', 'published', 'dead_letter');

CREATE TYPE "ConsumerCheckpointDeliveryStatus" AS ENUM ('ready', 'blocked_gap', 'error');

CREATE TABLE "outbox_events" (
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "aggregate_version" INTEGER NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "correlation_id" TEXT,
    "causation_id" TEXT,
    "actor_id" TEXT,
    "payload" JSONB NOT NULL,
    "status" "OutboxDeliveryStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_attempt_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("event_id")
);

CREATE UNIQUE INDEX "outbox_events_aggregate_type_aggregate_id_aggregate_version_key"
    ON "outbox_events"("aggregate_type", "aggregate_id", "aggregate_version");

CREATE INDEX "outbox_events_workspace_id_status_created_at_idx"
    ON "outbox_events"("workspace_id", "status", "created_at");

CREATE INDEX "outbox_events_status_next_attempt_at_created_at_idx"
    ON "outbox_events"("status", "next_attempt_at", "created_at");

CREATE TABLE "inbox_records" (
    "consumer_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "consumer_version" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_records_pkey" PRIMARY KEY ("consumer_id","event_id")
);

CREATE INDEX "inbox_records_event_id_idx" ON "inbox_records"("event_id");

CREATE TABLE "consumer_checkpoints" (
    "consumer_id" TEXT NOT NULL,
    "stream_id" TEXT NOT NULL,
    "consumer_version" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "last_applied_sequence" INTEGER NOT NULL,
    "last_applied_event_id" TEXT,
    "status" "ConsumerCheckpointDeliveryStatus" NOT NULL DEFAULT 'ready',
    "blocked_sequence" INTEGER,
    "last_error" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumer_checkpoints_pkey" PRIMARY KEY ("consumer_id","stream_id")
);

CREATE INDEX "consumer_checkpoints_workspace_id_consumer_id_idx"
    ON "consumer_checkpoints"("workspace_id", "consumer_id");
