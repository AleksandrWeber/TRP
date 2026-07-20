-- US005 Strategy Configuration: complete persisted trading configuration.
-- Temporary defaults backfill existing US004 rows, then domain creation remains authoritative.
ALTER TABLE "strategy_records"
    ADD COLUMN "trading_pair" TEXT NOT NULL DEFAULT 'BTCUSDT',
    ADD COLUMN "timeframe" TEXT NOT NULL DEFAULT '1h',
    ADD COLUMN "direction" TEXT NOT NULL DEFAULT 'BOTH',
    ADD COLUMN "position_size" DOUBLE PRECISION NOT NULL DEFAULT 1,
    ADD COLUMN "stop_loss_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "take_profit_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "parameters" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "strategy_records"
    ALTER COLUMN "trading_pair" DROP DEFAULT,
    ALTER COLUMN "timeframe" DROP DEFAULT,
    ALTER COLUMN "direction" DROP DEFAULT,
    ALTER COLUMN "position_size" DROP DEFAULT,
    ALTER COLUMN "stop_loss_percent" DROP DEFAULT,
    ALTER COLUMN "take_profit_percent" DROP DEFAULT,
    ALTER COLUMN "parameters" DROP DEFAULT;

CREATE INDEX "strategy_records_workspace_id_trading_pair_timeframe_idx"
ON "strategy_records"("workspace_id", "trading_pair", "timeframe");
