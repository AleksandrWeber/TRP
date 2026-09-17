-- FIV-CONN-02: Strategy B partial unique for credentialed EXCHANGE Connections.
-- Logical identity: workspace_id + provider + environment
-- Eligibility: credentialed + non-revoked + EXCHANGE + environment IS NOT NULL
-- Does NOT backfill environment. Does NOT mutate Vault. Does NOT delete/merge rows.
-- Metadata-only, NULL-environment, non-EXCHANGE, and REVOKED rows remain unconstrained by this index.

CREATE UNIQUE INDEX "connection_records_ws_provider_env_credentialed_uidx"
ON "connection_records" ("workspace_id", "provider", "environment")
WHERE "vault_secret_id" IS NOT NULL
  AND "status" <> 'REVOKED'
  AND "environment" IS NOT NULL
  AND "connection_type" = 'EXCHANGE';
