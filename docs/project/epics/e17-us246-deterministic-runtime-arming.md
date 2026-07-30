# US246 — Deterministic Runtime Arming

**Release:** RC-17 · **Epic:** E17 · **Date:** 2026-07-30  
**Status:** Implemented (arming-only slice)

Related:

- [E17 Spec](./e17-runtime-recovery-specification.md)
- [US245 Deterministic Event Admission](./e17-us245-deterministic-event-admission.md)
- [Architecture Health](./e17-us246-architecture-health.md)
- [ADR-014](../../adr/ADR-014-runtime-lifecycle.md)

---

## Purpose

After US245 enables external semantic event admission, this slice authorizes
Runtime execution readiness by transitioning to `ARMED`.

This is **arming only**:

- no strategy evaluation
- no SignalIntent emission
- no Order creation
- no checkpoint persistence
- no market-event business processing

---

## Arming algorithm

```text
EVENT_ADMISSION_ENABLED
  ↓
load Session lease + Runtime lifecycle + Runtime diagnostics
  ↓
read Kill Switch policy
  ↓
decideRecoveryRuntimeArming
  ├─ admission missing / lease expired / Kill Switch active /
  │  invalid lifecycle / acceptsTicks false / worker unhealthy /
  │  identity mismatch / already armed / recovery FAILED → ARMING_BLOCKED
  └─ gates pass → arm(fencingToken)
      ↓
verify Runtime worker = ARMED
verify acceptsTicks = true
      ↓
structured log: recovery_runtime_arming
```

---

## Operational gates

Arming requires:

- prior recovery admission result = `EVENT_ADMISSION_ENABLED`
- current fenced lease still valid
- Kill Switch inactive
- Runtime worker state = `EVENT_ADMISSION_ENABLED`
- Runtime diagnostics / lifecycle `acceptsTicks = true`
- worker not draining
- Runtime identity unchanged vs admitted state
- Session not `FAILED`
- duplicate arming not previously recorded in-process

---

## Runtime state transition

```text
Recovery / Runtime operational path:

EVENT_ADMISSION_ENABLED
  ↓ arming
ARMED
```

Worker semantics after arming:

- worker state = `ARMED`
- `acceptsTicks = true`
- evaluation becomes **allowed** by lifecycle gates
- this story does not invoke evaluation

---

## Boundary outcome

US246 deliberately separates executability from execution:

- `StrategyRuntimePort.evaluate(...)` is no longer rejected for lifecycle reasons
  after arming
- no evaluate / SignalIntent / Order calls are made by the arming service
- Canonical Order / Risk / Execution path is unchanged
- Recovery pipeline stages US240–US245 remain unchanged

---

## Residual

- Durable Kill Switch integration still belongs to later operations work; this
  slice reuses the US245 read-only policy port with a safe inactive stub.
- Session exit from recovery and actual evaluation enablement consumers remain
  separate E17 stories. US247 landed the first evaluation-only consumer.
