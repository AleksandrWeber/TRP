-- US210 Kill Switch: persist trading freeze independent of exchange connectivity.

ALTER TABLE "live_trading_sessions" ADD COLUMN "trading_frozen" BOOLEAN NOT NULL DEFAULT false;
