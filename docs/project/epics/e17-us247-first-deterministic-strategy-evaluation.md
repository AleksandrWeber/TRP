# US247 — First Deterministic Strategy Evaluation

**Release:** RC-17 · **Epic:** E17 · **Date:** 2026-07-30  
**Status:** Implemented (evaluation-only slice)

Related:

- [E17 Spec](./e17-runtime-recovery-specification.md)
- [US246 Deterministic Runtime Arming](./e17-us246-deterministic-runtime-arming.md)
- [Architecture Health](./e17-us247-architecture-health.md)
- [ADR-014](../../adr/ADR-014-runtime-lifecycle.md)

---

## Purpose

After US246 arms the Runtime (`ARMED`), this slice performs the **first
controlled strategy evaluation**.

This is **evaluation only**:

- no SignalIntent emission
- no Order creation
- no checkpoint persistence
- no Accounting / Execution Engine activity

---

## Evaluation algorithm

```text
ARMED
  ↓
load arming result + Session lease + Runtime lifecycle/diagnostics/context
  ↓
admitTick(admitted market event)
  ↓
decideRecoveryStrategyEvaluation
  ├─ not ARMED / invalid lifecycle / context≠checkpoint /
  │  event not admitted → EVALUATION_BLOCKED
  ├─ duplicate event (checkpoint or in-process) → DUPLICATE_EVENT
  └─ gates pass → decideRuntimeEvaluation(deployment, candle)
      ↓
      EVALUATED { decision only, signalIntentEmitted=false, orderCreated=false }
      ↓
structured log: recovery_strategy_evaluation
```

---

## Operational gates

Evaluation requires:

- prior recovery arming result = `ARMED`
- Runtime worker state = `ARMED`
- Runtime diagnostics / lifecycle `acceptsTicks = true`
- Runtime context matches restored checkpoint identity from arming
  (`deploymentId`, `checkpointEventId`, `checkpointSequence`,
  `checkpointVersion`, `runtimeVersion`)
- market event admitted (`TickAdmissionStatus.ADMITTED`)
- event not already evaluated in-process for this Session

---

## Boundary outcome

US247 deliberately separates evaluation from downstream artifacts:

- uses pure `decideRuntimeEvaluation` — never calls
  `StrategyRuntimePort.evaluate(...)` (which would commit Intent + Checkpoint)
- never calls `emitSignalIntent` / `saveCheckpoint`
- Canonical Order / Risk / Execution path unchanged
- Recovery pipeline stages US240–US246 remain unchanged
- decision may report `SIGNAL_INTENT` **kind** as evaluation output only;
  no Intent aggregate is created

---

## Residual

- Emitting SignalIntent from an evaluated decision is implemented in US248.
- Original E17 US247 fail-safe suite ACs remain residual / later story under
  local Stage 3 scoping (same pattern as US246 arming vs graceful-shutdown).
- Session exit from recovery remains separate E17 work.
