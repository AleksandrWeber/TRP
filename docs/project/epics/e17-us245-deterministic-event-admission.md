# US245 — Deterministic Event Admission

**Release:** RC-17 · **Epic:** E17 · **Date:** 2026-07-30  
**Status:** Implemented (admission-only slice)

Related:

- [E17 Spec](./e17-runtime-recovery-specification.md)
- [US244 Runtime Resume](./e17-us244-runtime-resume.md)
- [Architecture Health](./e17-us245-architecture-health.md)
- [ADR-014](../../adr/ADR-014-runtime-lifecycle.md)

---

## Purpose

After US244 hydrates Runtime into local recovery `READY`, this slice enables
deterministic external semantic event admission.

This is **admission only**:

- no strategy evaluation
- no SignalIntent emission
- no Order creation
- no checkpoint persistence

---

## Admission algorithm

```text
READY
  ↓
load Session lease + Runtime lifecycle + Runtime diagnostics
  ↓
read Kill Switch policy
  ↓
decideRecoveryEventAdmission
  ├─ READY missing / lease expired / Kill Switch active / worker not IDLE
  │  / already admitted / recovery FAILED → ADMISSION_BLOCKED
  └─ gates pass → enableEventAdmission(fencingToken)
      ↓
verify Runtime worker = EVENT_ADMISSION_ENABLED
verify acceptsTicks = true
      ↓
structured log: recovery_event_admission
```

---

## Operational gates

Admission requires:

- prior recovery pipeline result = `READY`
- current fenced lease still valid
- Kill Switch inactive
- Runtime worker state = `IDLE`
- Runtime diagnostics `acceptsTicks = false`
- Session not `FAILED`
- duplicate admission not previously recorded in-process

---

## Runtime state transition

```text
Recovery operational state:

READY
  ↓ admission
EVENT_ADMISSION_ENABLED
```

Worker semantics after admission:

- worker state = `EVENT_ADMISSION_ENABLED`
- `acceptsTicks = true`
- evaluation remains blocked until later lifecycle arming

---

## Boundary outcome

US245 deliberately splits external event intake from business execution:

- `StrategyRuntimePort.admitTick(...)` may proceed after admission
- `StrategyRuntimePort.evaluate(...)` remains rejected until `ARMED`
- canonical Order/Risk/Execution path is unchanged

---

## Residual

- Durable Kill Switch integration still belongs to later operations work; this
  slice uses a narrow read-only policy port with a safe inactive stub.
- Session exit from recovery remains separate E17 work. Evaluation enablement
  after admission is handled by US246 arming (lifecycle only; no evaluation
  invocation).
