-- US210 Live Trading Workspace: sessions, events, synchronization logs, execution dedupe.

CREATE TABLE "live_trading_sessions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "portfolio_workspace_key" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "stopped_at" TIMESTAMP(3),
    "last_heartbeat" TIMESTAMP(3),
    "reconnect_count" INTEGER NOT NULL DEFAULT 0,
    "synchronization_state" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_trading_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "live_trading_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_trading_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "live_trading_synchronization_logs" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_trading_synchronization_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "live_trading_processed_executions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_trading_processed_executions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "live_trading_sessions_portfolio_id_key" ON "live_trading_sessions"("portfolio_id");
CREATE UNIQUE INDEX "live_trading_sessions_portfolio_workspace_key_key" ON "live_trading_sessions"("portfolio_workspace_key");
CREATE INDEX "live_trading_sessions_workspace_id_status_idx" ON "live_trading_sessions"("workspace_id", "status");
CREATE INDEX "live_trading_sessions_workspace_id_account_id_status_idx" ON "live_trading_sessions"("workspace_id", "account_id", "status");
CREATE INDEX "live_trading_sessions_owner_id_status_idx" ON "live_trading_sessions"("owner_id", "status");
CREATE INDEX "live_trading_sessions_exchange_status_idx" ON "live_trading_sessions"("exchange", "status");

CREATE INDEX "live_trading_events_session_id_timestamp_idx" ON "live_trading_events"("session_id", "timestamp");
CREATE INDEX "live_trading_events_type_timestamp_idx" ON "live_trading_events"("type", "timestamp");

CREATE INDEX "live_trading_synchronization_logs_session_id_started_at_idx" ON "live_trading_synchronization_logs"("session_id", "started_at");
CREATE INDEX "live_trading_synchronization_logs_kind_status_idx" ON "live_trading_synchronization_logs"("kind", "status");

CREATE UNIQUE INDEX "live_trading_processed_executions_session_id_execution_id_key" ON "live_trading_processed_executions"("session_id", "execution_id");
CREATE INDEX "live_trading_processed_executions_session_id_idx" ON "live_trading_processed_executions"("session_id");

ALTER TABLE "live_trading_sessions" ADD CONSTRAINT "live_trading_sessions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_trading_events" ADD CONSTRAINT "live_trading_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "live_trading_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_trading_synchronization_logs" ADD CONSTRAINT "live_trading_synchronization_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "live_trading_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_trading_processed_executions" ADD CONSTRAINT "live_trading_processed_executions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "live_trading_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
