-- RC-16 M2 US171 immutable, append-only paper Fills recorded by the Execution Engine.

CREATE TABLE "paper_fills" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "paper_account_id" TEXT NOT NULL,
    "trading_session_id" TEXT NOT NULL,
    "adapter_order_id" TEXT NOT NULL,
    "adapter_fill_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "instrument" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "price" DECIMAL(38,18) NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "gross_notional" DECIMAL(38,18) NOT NULL,
    "fee" DECIMAL(38,18) NOT NULL,
    "execution_context_hash" TEXT NOT NULL,
    "configuration_id" TEXT NOT NULL,
    "configuration_version" INTEGER NOT NULL,
    "configuration_hash" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paper_fills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "paper_fills_workspace_id_order_id_sequence_key"
    ON "paper_fills"("workspace_id", "order_id", "sequence");
CREATE UNIQUE INDEX "paper_fills_workspace_id_adapter_fill_id_key"
    ON "paper_fills"("workspace_id", "adapter_fill_id");
CREATE INDEX "paper_fills_workspace_id_order_id_idx"
    ON "paper_fills"("workspace_id", "order_id");
CREATE INDEX "paper_fills_workspace_id_trading_session_id_idx"
    ON "paper_fills"("workspace_id", "trading_session_id");
