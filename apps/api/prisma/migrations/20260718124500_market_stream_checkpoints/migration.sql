-- RC-16 US141 durable market stream checkpoints
CREATE TABLE "market_stream_checkpoints" (
    "workspace_id" TEXT NOT NULL,
    "stream_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "timeframe" TEXT,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "last_sequence" INTEGER NOT NULL,
    "last_event_id" TEXT,
    "last_occurred_at" TIMESTAMP(3),
    "health" TEXT NOT NULL,
    "heartbeat_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_stream_checkpoints_pkey" PRIMARY KEY ("workspace_id","stream_id")
);

CREATE INDEX "market_stream_checkpoints_workspace_id_source_id_idx"
    ON "market_stream_checkpoints"("workspace_id", "source_id");
