CREATE TABLE "position_valuations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "paper_account_id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "position_version" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "market_stream_id" TEXT NOT NULL,
    "market_event_id" TEXT NOT NULL,
    "market_sequence" INTEGER NOT NULL,
    "mark_price" DECIMAL(38,18) NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "cost_basis" DECIMAL(38,18) NOT NULL,
    "realized_pnl" DECIMAL(38,18) NOT NULL,
    "market_value" DECIMAL(38,18) NOT NULL,
    "unrealized_pnl" DECIMAL(38,18) NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "position_valuations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "position_valuations_positive_mark" CHECK ("mark_price" > 0),
    CONSTRAINT "position_valuations_nonnegative_values" CHECK (
      "quantity" >= 0 AND "cost_basis" >= 0 AND "market_value" >= 0
    )
);

CREATE UNIQUE INDEX "position_valuations_workspace_id_position_id_key"
  ON "position_valuations"("workspace_id", "position_id");
CREATE UNIQUE INDEX "position_valuations_workspace_id_position_id_market_event_id_key"
  ON "position_valuations"("workspace_id", "position_id", "market_event_id");
CREATE INDEX "position_valuations_workspace_id_paper_account_id_idx"
  ON "position_valuations"("workspace_id", "paper_account_id");

CREATE TABLE "paper_portfolio_projections" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "paper_account_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "available_cash" DECIMAL(38,18) NOT NULL,
    "reserved_cash" DECIMAL(38,18) NOT NULL,
    "cash" DECIMAL(38,18) NOT NULL,
    "market_value" DECIMAL(38,18) NOT NULL,
    "equity" DECIMAL(38,18) NOT NULL,
    "realized_pnl" DECIMAL(38,18) NOT NULL,
    "unrealized_pnl" DECIMAL(38,18) NOT NULL,
    "total_pnl" DECIMAL(38,18) NOT NULL,
    "fees" DECIMAL(38,18) NOT NULL,
    "exposure" DECIMAL(38,18) NOT NULL,
    "ledger_version" INTEGER NOT NULL,
    "valuation_checkpoint" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "complete" BOOLEAN NOT NULL,
    "stale_position_ids" JSONB NOT NULL,
    "valued_at" TIMESTAMP(3),
    "recorded_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "paper_portfolio_projections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "paper_portfolio_projections_workspace_id_paper_account_id_key"
  ON "paper_portfolio_projections"("workspace_id", "paper_account_id");
CREATE INDEX "paper_portfolio_projections_workspace_id_complete_idx"
  ON "paper_portfolio_projections"("workspace_id", "complete");

CREATE TABLE "accounting_reconciliations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "paper_account_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "rebuilt_hash" TEXT NOT NULL,
    "reason" TEXT,
    "version" INTEGER NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL,
    "last_consistent_at" TIMESTAMP(3),
    CONSTRAINT "accounting_reconciliations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "accounting_reconciliations_status_check"
      CHECK ("status" IN ('consistent', 'mismatch'))
);

CREATE UNIQUE INDEX "accounting_reconciliations_workspace_id_paper_account_id_key"
  ON "accounting_reconciliations"("workspace_id", "paper_account_id");
CREATE INDEX "accounting_reconciliations_workspace_id_status_idx"
  ON "accounting_reconciliations"("workspace_id", "status");
