-- RC-16 M2 US165 immutable baseline Risk Decisions.

ALTER TABLE "paper_orders"
ADD COLUMN "risk_decision" JSONB;

CREATE TABLE "risk_decisions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "intent_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "policy_version" INTEGER NOT NULL,
    "policy_hash" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "rule_results" JSONB NOT NULL,
    "reasons" JSONB NOT NULL,
    "evaluated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "actor_id" TEXT NOT NULL,
    "correlation_id" TEXT,

    CONSTRAINT "risk_decisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "risk_decisions_workspace_id_order_id_policy_hash_input_hash_key"
    ON "risk_decisions"("workspace_id", "order_id", "policy_hash", "input_hash");
CREATE INDEX "risk_decisions_workspace_id_order_id_status_idx"
    ON "risk_decisions"("workspace_id", "order_id", "status");
CREATE INDEX "risk_decisions_workspace_id_expires_at_idx"
    ON "risk_decisions"("workspace_id", "expires_at");
