-- RC-16 US142 durable desired market subscriptions
CREATE TABLE "market_subscriptions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "stream_id" TEXT NOT NULL,
    "timeframe" TEXT,
    "state" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "market_subscriptions_workspace_id_stream_id_key"
    ON "market_subscriptions"("workspace_id", "stream_id");

CREATE INDEX "market_subscriptions_workspace_id_source_id_state_idx"
    ON "market_subscriptions"("workspace_id", "source_id", "state");
