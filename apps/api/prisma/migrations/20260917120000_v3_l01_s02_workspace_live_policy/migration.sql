-- PROPOSED-V3-L01-S02 — Durable workspace live-policy persistence on Workspace owner.
-- Satellite table. Explicit Paper backfill for existing workspaces.
-- Persistence only — no Admin API, Gate, KS, Session, credentials, or live activation.

CREATE TABLE "workspace_live_policy_states" (
    "workspace_id" TEXT NOT NULL,
    "policy" TEXT NOT NULL DEFAULT 'PAPER',
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_live_policy_states_pkey" PRIMARY KEY ("workspace_id")
);

-- Explicit Paper backfill for every existing workspace (PO-S02-03).
-- Never writes LIVE_POLICY_OPTED_IN. Never infers from connectivity / Session / V2.
INSERT INTO "workspace_live_policy_states" ("workspace_id", "policy", "schema_version", "updated_at")
SELECT "id", 'PAPER', 1, CURRENT_TIMESTAMP
FROM "workspace_records";
