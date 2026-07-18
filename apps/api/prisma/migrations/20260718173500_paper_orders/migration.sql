-- RC-16 M2 US159-US161 durable paper Orders and append-only lifecycle.
-- Financial columns use DECIMAL; Order state and Outbox commit transactionally.

CREATE TABLE "paper_orders" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "paper_account_id" TEXT NOT NULL,
    "trading_session_id" TEXT NOT NULL,
    "client_order_id" TEXT NOT NULL,
    "intent_hash" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "limit_price" DECIMAL(38,18),
    "filled_quantity" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "intent" JSONB NOT NULL,
    "risk_decision_id" TEXT,
    "reservation_id" TEXT,
    "adapter_order_id" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paper_orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "paper_orders_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "paper_orders_filled_quantity_check"
        CHECK ("filled_quantity" >= 0 AND "filled_quantity" <= "quantity")
);

CREATE TABLE "order_lifecycle_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "reason" TEXT,
    "actor_id" TEXT NOT NULL,
    "correlation_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_lifecycle_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_lifecycle_history_order_id_fkey"
        FOREIGN KEY ("order_id") REFERENCES "paper_orders"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "paper_orders_workspace_id_client_order_id_key"
    ON "paper_orders"("workspace_id", "client_order_id");
CREATE UNIQUE INDEX "paper_orders_workspace_id_idempotency_key_key"
    ON "paper_orders"("workspace_id", "idempotency_key");
CREATE UNIQUE INDEX "paper_orders_workspace_id_intent_hash_key"
    ON "paper_orders"("workspace_id", "intent_hash");
CREATE INDEX "paper_orders_workspace_id_trading_session_id_status_idx"
    ON "paper_orders"("workspace_id", "trading_session_id", "status");
CREATE INDEX "paper_orders_workspace_id_paper_account_id_idx"
    ON "paper_orders"("workspace_id", "paper_account_id");
CREATE UNIQUE INDEX "order_lifecycle_history_order_id_sequence_key"
    ON "order_lifecycle_history"("order_id", "sequence");
CREATE INDEX "order_lifecycle_history_workspace_id_order_id_idx"
    ON "order_lifecycle_history"("workspace_id", "order_id");
