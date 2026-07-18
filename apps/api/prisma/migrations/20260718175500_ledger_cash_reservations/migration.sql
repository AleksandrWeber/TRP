-- RC-16 M2 US162 Ledger-owned durable cash reservation.

CREATE TABLE "ledger_cash_balances" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "paper_account_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "posted_cash" DECIMAL(38,18) NOT NULL,
    "reserved_cash" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_cash_balances_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ledger_cash_balances_posted_cash_check" CHECK ("posted_cash" >= 0),
    CONSTRAINT "ledger_cash_balances_reserved_cash_check"
        CHECK ("reserved_cash" >= 0 AND "reserved_cash" <= "posted_cash")
);

CREATE TABLE "ledger_cash_reservations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "paper_account_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "release_idempotency_key" TEXT,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "released_at" TIMESTAMP(3),

    CONSTRAINT "ledger_cash_reservations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ledger_cash_reservations_amount_check" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX "ledger_cash_balances_workspace_id_paper_account_id_currency_key"
    ON "ledger_cash_balances"("workspace_id", "paper_account_id", "currency");
CREATE INDEX "ledger_cash_balances_workspace_id_paper_account_id_idx"
    ON "ledger_cash_balances"("workspace_id", "paper_account_id");
CREATE UNIQUE INDEX "ledger_cash_reservations_workspace_id_order_id_key"
    ON "ledger_cash_reservations"("workspace_id", "order_id");
CREATE UNIQUE INDEX "ledger_cash_reservations_workspace_id_idempotency_key_key"
    ON "ledger_cash_reservations"("workspace_id", "idempotency_key");
CREATE INDEX "ledger_cash_reservations_workspace_id_paper_account_id_status_idx"
    ON "ledger_cash_reservations"("workspace_id", "paper_account_id", "status");
