-- RC-23 Epic 5 — persist prior Runtime Enforcement PASS on Strategy Deployment.
-- Operational stamp only; not part of configurationHash / semantic config.

ALTER TABLE "paper_strategy_deployments"
ADD COLUMN "enforcement_authorization" JSONB;
