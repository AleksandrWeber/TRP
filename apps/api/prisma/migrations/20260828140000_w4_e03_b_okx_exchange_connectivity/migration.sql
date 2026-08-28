-- W4-E03-b — Durable Okx exchange connectivity persistence on Exchange Adapter owner.
-- Workspace-scoped OKX connection/adapter anchors. No synthetic connected flag.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_okx_exchange_connectivity_states" (
    "workspace_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "exchange_identifier" TEXT NOT NULL DEFAULT 'OKX',
    "connection_anchor_connection_id" TEXT,
    "connection_anchor_recorded_at" TIMESTAMP(3),
    "connection_anchor_recorded_by_actor_id" TEXT,
    "adapter_anchor_exchange_connection_id" TEXT,
    "adapter_anchor_recorded_at" TIMESTAMP(3),
    "adapter_anchor_recorded_by_actor_id" TEXT,
    "correlation_id" TEXT,
    "integrity_metadata_hash" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_okx_exchange_connectivity_states_pkey" PRIMARY KEY ("workspace_id")
);
