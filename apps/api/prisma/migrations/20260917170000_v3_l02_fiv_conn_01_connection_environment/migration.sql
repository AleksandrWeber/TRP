-- FIV-CONN-01: additive nullable Connection.environment (ENV1 live|testnet vocabulary).
-- No LIVE/TESTNET backfill. No uniqueness. No Vault changes. Null remains distinguishable.
ALTER TABLE "connection_records" ADD COLUMN "environment" TEXT;
