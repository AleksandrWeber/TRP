-- Vault-owned customer vendor secret ciphertext (V3-S03-b).
-- Not ExchangeConnection. Not host wrapping key. No plaintext columns.

CREATE TABLE "vault_secrets" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "wrapping_salt" TEXT,
    "wrapped_data_key" TEXT,
    "data_key_nonce" TEXT,
    "data_key_tag" TEXT,
    "payload" TEXT,
    "payload_nonce" TEXT,
    "payload_tag" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_secrets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vault_secrets_workspace_id_type_purpose_key" ON "vault_secrets"("workspace_id", "type", "purpose");
CREATE INDEX "vault_secrets_workspace_id_idx" ON "vault_secrets"("workspace_id");
