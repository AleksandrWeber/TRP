# US244 — Deterministic Runtime Resume

**Release:** RC-17 · **Epic:** E17 · **Date:** 2026-07-30  
**Status:** Implemented (READY hydration slice)

Related:

- [E17 Spec](./e17-runtime-recovery-specification.md)
- [US243 Reconciliation](./e17-us243-reconciliation.md)
- [Architecture Health](./e17-us244-architecture-health.md)
- [ADR-014](../../adr/ADR-014-runtime-lifecycle.md)

---

## Purpose

After successful discovery, lease acquisition, checkpoint validation, and
reconciliation, hydrate Runtime into a deterministic **READY** state.

This slice restores internal Runtime context only. The worker remains **IDLE**
and must not accept external events.

Outcomes:

- `READY`
- `RESUME_BLOCKED`

---

## Resume algorithm

```text
LEASE_ACQUIRED + VALID_CHECKPOINT + RECONCILED
    ↓
loadContext(workspaceId, sessionId, deploymentId)
getLifecycle(workspaceId, sessionId)
getDiagnostics(workspaceId, sessionId)
    ↓
decideRecoveryRuntimeResume
    ├─ any failed precondition / mismatch → RESUME_BLOCKED
    └─ hydrated context + idle lifecycle  → READY
    ↓
record duplicate-prevention marker for session
    ↓
structured log: recovery_runtime_resume
```

### READY semantics

`READY` is a **recovery operational state**, not a Runtime worker state.

Runtime worker invariants in READY:

- worker state = `IDLE`
- `acceptsTicks = false`
- no call to `arm`, `resume`, `admitTick`, `evaluate`, `emitSignalIntent`, or `saveCheckpoint`

---

## Runtime state model

`ReadyRuntimeState` contains:

- `operationalState = READY`
- `workerState = IDLE`
- `acceptsTicks = false`
- session / workspace / deployment identity
- current `fencingToken`
- validated checkpoint event id / sequence / version
- runtime version

This provides deterministic hydrated state without enabling business execution.

---

## Blocking conditions

- lease not acquired
- checkpoint not valid
- reconciliation failed
- runtime lifecycle not idle
- runtime diagnostics still accept ticks
- hydrated context/diagnostics do not match validated checkpoint
- duplicate resume for same session in the current process

---

## Residual

- Transition from recovery READY to market/event admission remains later E17 work.
- Session status transition to `RUNNING` / `PAUSED` remains outside this slice.
