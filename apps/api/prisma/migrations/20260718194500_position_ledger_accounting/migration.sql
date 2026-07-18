-- RC-16 M2 US172-US174 long-only Position, balanced Ledger, atomic Fill accounting.

CREATE TABLE "paper_positions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "paper_account_id" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "average_entry_price" DECIMAL(38,18) NOT NULL,
    "cost_basis" DECIMAL(38,18) NOT NULL,
    "realized_pnl" DECIMAL(38,18) NOT NULL,
    "version" INTEGER NOT NULL,
    "last_applied_fill_id" TEXT NOT NULL,
    "last_applied_fill_sequence" INTEGER NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paper_positions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "paper_positions_side_check" CHECK ("side" IN ('flat', 'long')),
    CONSTRAINT "paper_positions_quantity_check" CHECK ("quantity" >= 0),
    CONSTRAINT "paper_positions_cost_basis_check" CHECK ("cost_basis" >= 0),
    CONSTRAINT "paper_positions_version_check" CHECK ("version" > 0),
    CONSTRAINT "paper_positions_last_fill_sequence_check" CHECK ("last_applied_fill_sequence" > 0)
);

CREATE UNIQUE INDEX "paper_positions_workspace_id_paper_account_id_instrument_key"
    ON "paper_positions"("workspace_id", "paper_account_id", "instrument");
CREATE INDEX "paper_positions_workspace_id_paper_account_id_idx"
    ON "paper_positions"("workspace_id", "paper_account_id");

CREATE TABLE "ledger_transactions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "paper_account_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "cause_type" TEXT NOT NULL,
    "cause_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "actor_id" TEXT NOT NULL,
    "correlation_id" TEXT,
    "compensation_reason" TEXT,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ledger_transactions_workspace_id_idempotency_key_key"
    ON "ledger_transactions"("workspace_id", "idempotency_key");
CREATE UNIQUE INDEX "ledger_transactions_workspace_id_cause_type_cause_id_key"
    ON "ledger_transactions"("workspace_id", "cause_type", "cause_id");
CREATE INDEX "ledger_transactions_workspace_id_paper_account_id_occurred_at_idx"
    ON "ledger_transactions"("workspace_id", "paper_account_id", "occurred_at");

CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "line" INTEGER NOT NULL,
    "account" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ledger_entries_line_check" CHECK ("line" > 0),
    CONSTRAINT "ledger_entries_direction_check" CHECK ("direction" IN ('debit', 'credit')),
    CONSTRAINT "ledger_entries_amount_check" CHECK ("amount" > 0),
    CONSTRAINT "ledger_entries_transaction_id_fkey"
        FOREIGN KEY ("transaction_id") REFERENCES "ledger_transactions"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ledger_entries_transaction_id_line_key"
    ON "ledger_entries"("transaction_id", "line");
CREATE INDEX "ledger_entries_workspace_id_account_idx"
    ON "ledger_entries"("workspace_id", "account");
