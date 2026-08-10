-- RC-19 Epic 1 — Exchange Scope identity on Paper Account and Trading Session.
-- Additive only: default Binance scope; no policy/routing/multi-exchange behavior.

ALTER TABLE "paper_accounts"
    ADD COLUMN "exchange_scope_id" TEXT NOT NULL DEFAULT 'exchange-scope:binance';

ALTER TABLE "trading_sessions"
    ADD COLUMN "exchange_scope_id" TEXT NOT NULL DEFAULT 'exchange-scope:binance';
