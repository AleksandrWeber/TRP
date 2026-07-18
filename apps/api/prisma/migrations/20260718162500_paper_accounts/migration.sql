-- RC-16 M2 US154 durable paper-account foundation.
-- Financial values use PostgreSQL DECIMAL; no floating-point financial columns.

CREATE TABLE "paper_accounts" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'paper',
    "status" TEXT NOT NULL,
    "opening_capital" DECIMAL(38,18) NOT NULL,
    "opening_ledger_transaction_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "opened_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paper_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "paper_accounts_paper_mode_check" CHECK ("mode" = 'paper'),
    CONSTRAINT "paper_accounts_opening_capital_check" CHECK ("opening_capital" > 0)
);

CREATE UNIQUE INDEX "paper_accounts_workspace_id_idempotency_key_key"
    ON "paper_accounts"("workspace_id", "idempotency_key");

CREATE INDEX "paper_accounts_workspace_id_status_idx"
    ON "paper_accounts"("workspace_id", "status");
