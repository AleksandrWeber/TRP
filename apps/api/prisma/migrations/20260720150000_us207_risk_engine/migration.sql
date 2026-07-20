-- US207 Risk Engine: trading risk decisions, policies, and events (no exchange / execution).

CREATE TABLE "trading_risk_decisions" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "score" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trading_risk_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trading_risk_policies" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL,
    "configuration" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trading_risk_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trading_risk_events" (
    "id" TEXT NOT NULL,
    "decision_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trading_risk_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trading_risk_decisions_portfolio_id_timestamp_idx" ON "trading_risk_decisions"("portfolio_id", "timestamp");
CREATE INDEX "trading_risk_decisions_order_id_idx" ON "trading_risk_decisions"("order_id");
CREATE INDEX "trading_risk_decisions_portfolio_id_decision_idx" ON "trading_risk_decisions"("portfolio_id", "decision");
CREATE UNIQUE INDEX "trading_risk_policies_portfolio_id_name_key" ON "trading_risk_policies"("portfolio_id", "name");
CREATE INDEX "trading_risk_policies_enabled_priority_idx" ON "trading_risk_policies"("enabled", "priority");
CREATE INDEX "trading_risk_events_decision_id_occurred_at_idx" ON "trading_risk_events"("decision_id", "occurred_at");
CREATE INDEX "trading_risk_events_event_type_occurred_at_idx" ON "trading_risk_events"("event_type", "occurred_at");

ALTER TABLE "trading_risk_decisions" ADD CONSTRAINT "trading_risk_decisions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trading_risk_policies" ADD CONSTRAINT "trading_risk_policies_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trading_risk_events" ADD CONSTRAINT "trading_risk_events_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "trading_risk_decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
