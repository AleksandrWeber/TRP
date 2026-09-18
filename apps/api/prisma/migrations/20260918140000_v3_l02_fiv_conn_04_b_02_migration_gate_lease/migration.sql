-- FIV-CONN-04-B-02: durable singleton migration-gate lease (global FIV-CONN-04).
-- Seed is idempotent: ON CONFLICT DO NOTHING must not reset ACTIVE authority.
CREATE TABLE "connection_migration_gate_leases" (
    "gate_key" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "holder_id" TEXT,
    "fence_generation" INTEGER NOT NULL DEFAULT 0,
    "acquired_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "authorized_window_ms" INTEGER,
    "authorized_until" TIMESTAMP(3),
    "heartbeat_at" TIMESTAMP(3),
    "actor_kind" TEXT,
    "correlation_id" TEXT,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connection_migration_gate_leases_pkey" PRIMARY KEY ("gate_key")
);

INSERT INTO "connection_migration_gate_leases" (
  "gate_key",
  "purpose",
  "state",
  "fence_generation",
  "schema_version",
  "created_at",
  "updated_at"
) VALUES (
  'FIV-CONN-04',
  'FIV_CONN_04_MIGRATION_BACKFILL',
  'INACTIVE',
  0,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("gate_key") DO NOTHING;
