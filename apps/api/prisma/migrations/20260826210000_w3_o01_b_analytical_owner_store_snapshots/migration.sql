-- W3-O01-b — Owner-scoped durable snapshots for certified V2 analytical stores.
-- Extends existing owners only. Not a new SoT / Lake / Outbox / recovery engine.

CREATE TABLE "analytical_owner_store_snapshots" (
    "owner" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytical_owner_store_snapshots_pkey" PRIMARY KEY ("owner")
);
