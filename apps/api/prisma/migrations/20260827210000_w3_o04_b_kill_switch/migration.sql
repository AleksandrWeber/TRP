-- W3-O04-b — Durable paper Kill Switch persistence on Trading Session owner.
-- Workspace-scoped armed/cleared substrate. Persistence only; no recovery wiring.

CREATE TABLE "workspace_kill_switch_states" (
    "workspace_id" TEXT NOT NULL,
    "armed" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "armed_at" TIMESTAMP(3),
    "armed_by_actor_id" TEXT,
    "cleared_at" TIMESTAMP(3),
    "cleared_by_actor_id" TEXT,
    "correlation_id" TEXT,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_kill_switch_states_pkey" PRIMARY KEY ("workspace_id")
);
