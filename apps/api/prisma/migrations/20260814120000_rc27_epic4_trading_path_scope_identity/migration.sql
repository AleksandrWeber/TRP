-- RC-27 Epic 4 — Exchange Scope identity on trading-path artifacts.
-- Additive only: default Binance scope; no routing / multi-runtime / engine clones.

ALTER TABLE "signal_intents"
    ADD COLUMN "exchange_scope_id" TEXT NOT NULL DEFAULT 'exchange-scope:binance';

ALTER TABLE "paper_strategy_deployments"
    ADD COLUMN "exchange_scope_id" TEXT NOT NULL DEFAULT 'exchange-scope:binance';

ALTER TABLE "paper_orders"
    ADD COLUMN "exchange_scope_id" TEXT NOT NULL DEFAULT 'exchange-scope:binance';

ALTER TABLE "paper_fills"
    ADD COLUMN "exchange_scope_id" TEXT NOT NULL DEFAULT 'exchange-scope:binance';

ALTER TABLE "paper_positions"
    ADD COLUMN "exchange_scope_id" TEXT NOT NULL DEFAULT 'exchange-scope:binance';

ALTER TABLE "ledger_transactions"
    ADD COLUMN "exchange_scope_id" TEXT NOT NULL DEFAULT 'exchange-scope:binance';

ALTER TABLE "position_valuations"
    ADD COLUMN "exchange_scope_id" TEXT NOT NULL DEFAULT 'exchange-scope:binance';

ALTER TABLE "paper_portfolio_projections"
    ADD COLUMN "exchange_scope_id" TEXT NOT NULL DEFAULT 'exchange-scope:binance';
