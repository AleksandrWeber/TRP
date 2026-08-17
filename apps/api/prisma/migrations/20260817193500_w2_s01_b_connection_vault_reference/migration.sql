ALTER TABLE "connection_records"
ADD COLUMN "vault_secret_id" TEXT;

CREATE UNIQUE INDEX "connection_records_workspace_id_provider_vault_secret_id_key"
ON "connection_records"("workspace_id", "provider", "vault_secret_id");
