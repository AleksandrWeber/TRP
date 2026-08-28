-- W3-O05-b — Durable monitoring health persistence on Security Platform owner.
-- Workspace-scoped operational monitoring substrate. Persistence only; no recovery wiring.

CREATE TABLE "workspace_monitoring_health_states" (
    "workspace_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "security_health_anchor_incident_id" TEXT,
    "security_health_anchor_recorded_at" TIMESTAMP(3),
    "security_health_anchor_recorded_by_actor_id" TEXT,
    "connection_health_anchor_session_id" TEXT,
    "connection_health_anchor_recorded_at" TIMESTAMP(3),
    "connection_health_anchor_recorded_by_actor_id" TEXT,
    "correlation_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_monitoring_health_states_pkey" PRIMARY KEY ("workspace_id")
);
