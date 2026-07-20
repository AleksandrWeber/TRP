-- US208 Paper Trading Engine: session orchestration, executions, and events (no exchange).

CREATE TABLE "paper_trading_sessions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "portfolio_workspace_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "initial_balance" DECIMAL(38,18) NOT NULL,
    "current_balance" DECIMAL(38,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paper_trading_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "paper_trading_executions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "execution_time" TIMESTAMP(3) NOT NULL,
    "execution_price" DECIMAL(38,18) NOT NULL,
    "slippage" DECIMAL(38,18) NOT NULL,
    "commission" DECIMAL(38,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_trading_executions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "paper_trading_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_trading_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "paper_trading_sessions_portfolio_id_key" ON "paper_trading_sessions"("portfolio_id");
CREATE UNIQUE INDEX "paper_trading_sessions_portfolio_workspace_key_key" ON "paper_trading_sessions"("portfolio_workspace_key");
CREATE INDEX "paper_trading_sessions_workspace_id_status_idx" ON "paper_trading_sessions"("workspace_id", "status");
CREATE INDEX "paper_trading_sessions_workspace_id_created_at_idx" ON "paper_trading_sessions"("workspace_id", "created_at");
CREATE INDEX "paper_trading_sessions_owner_id_status_idx" ON "paper_trading_sessions"("owner_id", "status");

CREATE INDEX "paper_trading_executions_session_id_execution_time_idx" ON "paper_trading_executions"("session_id", "execution_time");
CREATE INDEX "paper_trading_executions_order_id_idx" ON "paper_trading_executions"("order_id");

CREATE INDEX "paper_trading_events_session_id_timestamp_idx" ON "paper_trading_events"("session_id", "timestamp");
CREATE INDEX "paper_trading_events_type_timestamp_idx" ON "paper_trading_events"("type", "timestamp");

ALTER TABLE "paper_trading_sessions" ADD CONSTRAINT "paper_trading_sessions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "paper_trading_executions" ADD CONSTRAINT "paper_trading_executions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "paper_trading_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "paper_trading_events" ADD CONSTRAINT "paper_trading_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "paper_trading_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
