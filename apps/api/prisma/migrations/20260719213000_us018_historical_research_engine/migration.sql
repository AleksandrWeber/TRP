-- US018 Historical Research Engine.
-- Extend reusable datasets with descriptive/regime metadata while retaining
-- the legacy single-symbol column for existing experiment consumers.
ALTER TABLE "Dataset"
    ADD COLUMN "displayName" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "marketRegime" TEXT NOT NULL DEFAULT 'UNCLASSIFIED',
    ADD COLUMN "symbols" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Dataset"
SET
    "displayName" = CONCAT("symbol", ' ', "timeframe", ' historical dataset'),
    "symbols" = ARRAY["symbol"]
WHERE "displayName" = '' OR cardinality("symbols") = 0;

CREATE INDEX "Dataset_enabled_marketRegime_idx"
ON "Dataset"("enabled", "marketRegime");

-- A run is an immutable execution envelope. A new run row is inserted for
-- every request so previous research is never overwritten.
CREATE TABLE "historical_research_runs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dataset_ids" JSONB NOT NULL,
    "strategy_ids" JSONB NOT NULL,
    "report" JSONB,
    "failure" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "historical_research_runs_pkey" PRIMARY KEY ("id")
);

-- One result per Strategy × Dataset × Symbol within a run. Metrics are
-- first-class columns to support the future Strategy × Market Regime matrix.
CREATE TABLE "historical_research_results" (
    "id" TEXT NOT NULL,
    "research_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "dataset_name" TEXT NOT NULL,
    "dataset_content_hash" TEXT NOT NULL,
    "market_regime" TEXT NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "strategy_name" TEXT NOT NULL,
    "strategy_snapshot" JSONB NOT NULL,
    "exchange" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "failure" TEXT,
    "trades" JSONB NOT NULL,
    "trade_count" INTEGER NOT NULL,
    "win_rate" DOUBLE PRECISION NOT NULL,
    "net_profit" DOUBLE PRECISION NOT NULL,
    "profit_factor" DOUBLE PRECISION NOT NULL,
    "max_drawdown" DOUBLE PRECISION NOT NULL,
    "execution_time_ms" INTEGER NOT NULL,
    "validation" JSONB NOT NULL,
    "result_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historical_research_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "historical_research_results_research_id_dataset_id_strategy_id_symbol_key"
ON "historical_research_results"("research_id", "dataset_id", "strategy_id", "symbol");

CREATE INDEX "historical_research_runs_workspace_id_started_at_idx"
ON "historical_research_runs"("workspace_id", "started_at");

CREATE INDEX "historical_research_runs_workspace_id_status_idx"
ON "historical_research_runs"("workspace_id", "status");

CREATE INDEX "historical_research_results_workspace_id_strategy_id_market_regime_idx"
ON "historical_research_results"("workspace_id", "strategy_id", "market_regime");

CREATE INDEX "historical_research_results_workspace_id_dataset_id_idx"
ON "historical_research_results"("workspace_id", "dataset_id");

CREATE INDEX "historical_research_results_workspace_id_created_at_idx"
ON "historical_research_results"("workspace_id", "created_at");

ALTER TABLE "historical_research_results"
ADD CONSTRAINT "historical_research_results_research_id_fkey"
FOREIGN KEY ("research_id") REFERENCES "historical_research_runs"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "historical_research_results"
ADD CONSTRAINT "historical_research_results_dataset_id_fkey"
FOREIGN KEY ("dataset_id") REFERENCES "Dataset"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
