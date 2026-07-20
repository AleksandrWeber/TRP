-- US204 Portfolio Engine: trading account financial state (no exchange / execution).

CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "cash" DECIMAL(38,18) NOT NULL,
    "initial_cash" DECIMAL(38,18) NOT NULL,
    "realized_pnl" DECIMAL(38,18) NOT NULL,
    "unrealized_pnl" DECIMAL(38,18) NOT NULL,
    "used_margin" DECIMAL(38,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portfolio_snapshots" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "cash" DECIMAL(38,18) NOT NULL,
    "equity" DECIMAL(38,18) NOT NULL,
    "used_margin" DECIMAL(38,18) NOT NULL,
    "available_margin" DECIMAL(38,18) NOT NULL,
    "realized_pnl" DECIMAL(38,18) NOT NULL,
    "unrealized_pnl" DECIMAL(38,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portfolio_events" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "portfolios_workspace_id_key" ON "portfolios"("workspace_id");
CREATE INDEX "portfolios_owner_id_status_idx" ON "portfolios"("owner_id", "status");
CREATE INDEX "portfolios_workspace_id_status_idx" ON "portfolios"("workspace_id", "status");
CREATE INDEX "portfolio_snapshots_portfolio_id_timestamp_idx" ON "portfolio_snapshots"("portfolio_id", "timestamp");
CREATE INDEX "portfolio_events_portfolio_id_occurred_at_idx" ON "portfolio_events"("portfolio_id", "occurred_at");
CREATE INDEX "portfolio_events_event_type_occurred_at_idx" ON "portfolio_events"("event_type", "occurred_at");

ALTER TABLE "portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portfolio_events" ADD CONSTRAINT "portfolio_events_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
