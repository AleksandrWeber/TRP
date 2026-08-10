-- RC-19 Epic 3 — Tactical Envelope schema stub on Trading Session.
-- Additive only: nullable JSON; no enforcement, versioning, or history.

ALTER TABLE "trading_sessions"
    ADD COLUMN "tactical_envelope" JSONB;
