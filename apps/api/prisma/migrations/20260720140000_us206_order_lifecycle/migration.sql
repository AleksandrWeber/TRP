-- US206 Order Lifecycle Engine: trading orders (no exchange / live execution).

CREATE TABLE "trading_orders" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "position_id" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "requested_price" DECIMAL(38,18),
    "executed_price" DECIMAL(38,18),
    "filled_quantity" DECIMAL(38,18) NOT NULL,
    "remaining_quantity" DECIMAL(38,18) NOT NULL,
    "status" TEXT NOT NULL,
    "time_in_force" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "executed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "trading_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_fills" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "price" DECIMAL(38,18) NOT NULL,
    "fee" DECIMAL(38,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_fills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "previous_status" TEXT NOT NULL,
    "current_status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_events" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trading_orders_portfolio_id_status_idx" ON "trading_orders"("portfolio_id", "status");
CREATE INDEX "trading_orders_portfolio_id_symbol_idx" ON "trading_orders"("portfolio_id", "symbol");
CREATE INDEX "trading_orders_portfolio_id_created_at_idx" ON "trading_orders"("portfolio_id", "created_at");
CREATE INDEX "order_fills_order_id_timestamp_idx" ON "order_fills"("order_id", "timestamp");
CREATE INDEX "order_history_order_id_timestamp_idx" ON "order_history"("order_id", "timestamp");
CREATE INDEX "order_events_order_id_occurred_at_idx" ON "order_events"("order_id", "occurred_at");
CREATE INDEX "order_events_event_type_occurred_at_idx" ON "order_events"("event_type", "occurred_at");

ALTER TABLE "trading_orders" ADD CONSTRAINT "trading_orders_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_fills" ADD CONSTRAINT "order_fills_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "trading_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "trading_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "trading_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
