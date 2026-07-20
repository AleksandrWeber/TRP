-- US205 Position Engine: trading positions lifecycle (no exchange / execution).

CREATE TABLE "trading_positions" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "entry_price" DECIMAL(38,18) NOT NULL,
    "mark_price" DECIMAL(38,18) NOT NULL,
    "average_entry_price" DECIMAL(38,18) NOT NULL,
    "realized_pnl" DECIMAL(38,18) NOT NULL,
    "unrealized_pnl" DECIMAL(38,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "trading_positions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "position_history" (
    "id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "action" TEXT NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "price" DECIMAL(38,18) NOT NULL,
    "realized_pnl" DECIMAL(38,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "position_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "position_events" (
    "id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "position_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trading_positions_portfolio_id_status_idx" ON "trading_positions"("portfolio_id", "status");
CREATE INDEX "trading_positions_portfolio_id_symbol_idx" ON "trading_positions"("portfolio_id", "symbol");
CREATE INDEX "trading_positions_portfolio_id_created_at_idx" ON "trading_positions"("portfolio_id", "created_at");
CREATE INDEX "position_history_position_id_timestamp_idx" ON "position_history"("position_id", "timestamp");
CREATE INDEX "position_events_position_id_occurred_at_idx" ON "position_events"("position_id", "occurred_at");
CREATE INDEX "position_events_event_type_occurred_at_idx" ON "position_events"("event_type", "occurred_at");

ALTER TABLE "trading_positions" ADD CONSTRAINT "trading_positions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "trading_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "position_events" ADD CONSTRAINT "position_events_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "trading_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
