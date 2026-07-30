# US249 — Recovery Completion & Session Exit

**Release:** RC-17 · **Epic:** E17 · **Date:** 2026-07-30  
**Status:** Implemented (completion / Session-exit slice)

Related:

- [E17 Spec](./e17-runtime-recovery-specification.md)
- [US248 Deterministic SignalIntent Generation](./e17-us248-deterministic-signal-intent-generation.md)
- [Architecture Health](./e17-us249-architecture-health.md)
- [ADR-014](../../adr/ADR-014-runtime-lifecycle.md)

---

## Purpose

After a terminal Stage 3 recovery outcome, this slice **completes Recovery** and
returns the Trading Session to its normal operational lifecycle.

Terminal outcomes accepted:

- `SIGNAL_INTENT_GENERATED` (US248)
- `EVALUATED` with non-actionable (`NO_ACTION`) decision (US247)
- controlled Recovery termination

This is **completion only**:

- no Order creation
- no Execution Engine interaction
- no Accounting mutations
- no market processing
- no Runtime lifecycle transitions (Runtime remains ARMED/operational)

---

## Completion algorithm

```text
terminal Stage 3 outcome
  ↓
load US240–US248 stage results + Session + Runtime lifecycle
  ↓
decideRecoveryCompletion
  ├─ already completed / not RECOVERING / unfinished stage /
  │  lease missing|mismatch / no terminal cause / Runtime not ARMED
  │     → RECOVERY_COMPLETION_BLOCKED
  └─ gates pass
      ↓
      Session RECOVERING → RUNNING|PAUSED
      clear recovery lease (ownership released)
      CAS save + Outbox TradingSessionRecoveryCompleted
      ↓
      RECOVERY_COMPLETED
      ↓
structured log: recovery_completion
```

---

## Recovery terminal state model

| Terminal cause             | Meaning                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `SIGNAL_INTENT_GENERATED`  | US248 published exactly one SignalIntent                       |
| `EVALUATED_NON_ACTIONABLE` | US247 evaluated with `NO_ACTION` (no Intent required)          |
| `CONTROLLED_TERMINATION`   | Explicit operator/system stop of recovery after armed pipeline |

Required pipeline consistency before any terminal exit:

```text
discovery = recovery_candidate
lease = LEASE_ACQUIRED
checkpoint = VALID_CHECKPOINT
reconcile = RECONCILED
resume = READY
admission = EVENT_ADMISSION_ENABLED
arming = ARMED
```

Session exit target (`resumeIntent`) defaults to `RUNNING` (ADR-014 legal
`RECOVERING → RUNNING|PAUSED`).

---

## Lease release strategy

1. Verify durable Session lease owner + fencing token match US241 acquisition.
2. On success: `transitionSession(RECOVERING → resumeIntent)` then `clearLease`.
3. Persist via optimistic `saveIfVersion` CAS.
4. Preserve `lastFencingToken` (clearLease does not rewind fence history).
5. Do **not** call Runtime stop/pause — Runtime remains operational.

---

## Boundary outcome

- Canonical Order Path unchanged
- No Orders / Execution / Accounting side effects
- Recovery ownership released exactly once (in-process + CAS)
- Durable `TradingSessionRecoveryCompleted` Outbox event + structured log

---

## Residual

- Original E17 US249 RecoveryState persistence / durable Incident / operator
  status ACs remain residual under local Stage 3 scoping.
- Force-`RECOVERING` on discovery (US240 residual) still required for production
  path; tests force `RECOVERING` at completion boundary when needed.
- Order proposal from recovery SignalIntents remains later work.
