-- US209 Exchange Adapter Layer: connection state and exchange events (no trading core mutations).

CREATE TABLE "exchange_connections" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "exchange_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latency_ms" INTEGER,
    "last_heartbeat_at" TIMESTAMP(3),
    "last_synchronized_at" TIMESTAMP(3),
    "api_permissions" JSONB NOT NULL,
    "supported_markets" JSONB NOT NULL,
    "capabilities" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exchange_events" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "exchange_connections_workspace_id_exchange_id_key" ON "exchange_connections"("workspace_id", "exchange_id");
CREATE INDEX "exchange_connections_workspace_id_status_idx" ON "exchange_connections"("workspace_id", "status");
CREATE INDEX "exchange_connections_exchange_id_status_idx" ON "exchange_connections"("exchange_id", "status");

CREATE INDEX "exchange_events_connection_id_occurred_at_idx" ON "exchange_events"("connection_id", "occurred_at");
CREATE INDEX "exchange_events_event_type_occurred_at_idx" ON "exchange_events"("event_type", "occurred_at");

ALTER TABLE "exchange_events" ADD CONSTRAINT "exchange_events_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "exchange_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
