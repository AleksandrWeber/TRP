-- V3-L02-S-UNK1 — Durable UNKNOWN / pre-send / reconciliation metadata on canonical PaperOrder.
-- Technical submission_phase is distinct from business status. Claim ≠ submit. UNKNOWN ≠ REJECTED.

ALTER TABLE "paper_orders" ADD COLUMN "submission_phase" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "paper_orders" ADD COLUMN "ready_to_transmit_at" TIMESTAMP(3);
ALTER TABLE "paper_orders" ADD COLUMN "transmitted_at" TIMESTAMP(3);
ALTER TABLE "paper_orders" ADD COLUMN "completed_at" TIMESTAMP(3);
ALTER TABLE "paper_orders" ADD COLUMN "reconciliation_required" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "paper_orders" ADD COLUMN "unknown_entered_at" TIMESTAMP(3);
ALTER TABLE "paper_orders" ADD COLUMN "last_reconcile_at" TIMESTAMP(3);
ALTER TABLE "paper_orders" ADD COLUMN "reconcile_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "paper_orders" ADD COLUMN "venue_client_order_id" TEXT;
ALTER TABLE "paper_orders" ADD COLUMN "venue_order_id" TEXT;
ALTER TABLE "paper_orders" ADD COLUMN "human_start_proof_id" TEXT;
ALTER TABLE "paper_orders" ADD COLUMN "last_reconcile_result" TEXT;
ALTER TABLE "paper_orders" ADD COLUMN "ambiguity_reason" TEXT;

CREATE INDEX "paper_orders_workspace_id_reconciliation_required_idx" ON "paper_orders"("workspace_id", "reconciliation_required");
