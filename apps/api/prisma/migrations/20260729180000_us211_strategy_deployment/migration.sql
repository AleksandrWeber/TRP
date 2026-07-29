-- RC-16 M3 US211 Strategy Deployment bounded context.
-- Table paper_strategy_deployments avoids Stage-1 StrategyDeployment collision.
-- Immutable approved configuration; no Trading Session runtime ownership.

CREATE TABLE "paper_strategy_deployments" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "strategy_version" TEXT NOT NULL,
    "experiment_id" TEXT,
    "parameters" JSONB NOT NULL,
    "instrument" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "market_data_source_id" TEXT NOT NULL,
    "paper_execution_configuration_id" TEXT NOT NULL,
    "risk_policy_id" TEXT NOT NULL,
    "risk_policy_version" INTEGER NOT NULL,
    "configuration_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "approved_at" TIMESTAMP(3),
    "approved_by_actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "actor_id" TEXT NOT NULL,
    "correlation_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "paper_strategy_deployments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "paper_strategy_deployments_status_check" CHECK ("status" IN ('draft', 'approved')),
    CONSTRAINT "paper_strategy_deployments_risk_policy_version_check" CHECK ("risk_policy_version" >= 1)
);

CREATE UNIQUE INDEX "paper_strategy_deployments_workspace_id_idempotency_key_key"
    ON "paper_strategy_deployments"("workspace_id", "idempotency_key");

CREATE INDEX "paper_strategy_deployments_workspace_id_status_idx"
    ON "paper_strategy_deployments"("workspace_id", "status");

CREATE INDEX "paper_strategy_deployments_workspace_id_strategy_id_idx"
    ON "paper_strategy_deployments"("workspace_id", "strategy_id");

CREATE INDEX "paper_strategy_deployments_workspace_id_configuration_hash_idx"
    ON "paper_strategy_deployments"("workspace_id", "configuration_hash");
