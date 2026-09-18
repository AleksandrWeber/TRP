/**
 * FIV-CONN-04-B-02 — operational defaults for durable migration-gate lease.
 * ≤4h max window remains governance-frozen in migration-gate.ts.
 */

/** Default lease TTL (liveness tip). Technical/ops — not a new OD-B policy. */
export const MIGRATION_GATE_DEFAULT_TTL_MS = 15 * 60 * 1000;

/** Recommended heartbeat cadence upper bound (guidance). */
export const MIGRATION_GATE_DEFAULT_HEARTBEAT_MS = 5 * 60 * 1000;
