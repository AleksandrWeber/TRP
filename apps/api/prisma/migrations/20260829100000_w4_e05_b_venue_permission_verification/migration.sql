-- W4-E05-b — Durable venue permission verification persistence on Exchange Adapter owner.
-- Workspace + exchange scoped permission verification anchors. No runtime permission cache.
-- Persistence only; restart recovery and operational continuity are later slices.

CREATE TABLE "workspace_venue_permission_verification_states" (
    "workspace_id" TEXT NOT NULL,
    "exchange_identifier" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "connection_id" TEXT,
    "adapter_exchange_connection_id" TEXT,
    "permission_verification_id" TEXT,
    "vendor_permission_hash" TEXT,
    "integrity_metadata_hash" TEXT,
    "correlation_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_venue_permission_verification_states_pkey" PRIMARY KEY ("workspace_id", "exchange_identifier")
);
