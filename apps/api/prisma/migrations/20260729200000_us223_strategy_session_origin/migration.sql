-- US217/US223: allow strategy-origin Trading Sessions (ADR-014).
-- M2 constrained origin to manual only; M3 strategy sessions require 'strategy'.

ALTER TABLE "trading_sessions"
  DROP CONSTRAINT "trading_sessions_manual_origin_check";

ALTER TABLE "trading_sessions"
  ADD CONSTRAINT "trading_sessions_origin_check"
  CHECK ("origin" IN ('manual', 'strategy'));
