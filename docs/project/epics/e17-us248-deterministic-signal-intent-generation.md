# US248 — Deterministic SignalIntent Generation

**Release:** RC-17 · **Epic:** E17 · **Date:** 2026-07-30  
**Status:** Implemented (SignalIntent-only slice)

Related:

- [E17 Spec](./e17-runtime-recovery-specification.md)
- [US247 First Deterministic Strategy Evaluation](./e17-us247-first-deterministic-strategy-evaluation.md)
- [Architecture Health](./e17-us248-architecture-health.md)
- [ADR-014](../../adr/ADR-014-runtime-lifecycle.md)

---

## Purpose

After US247 produces an Evaluation Decision, this slice transforms an eligible
`SIGNAL_INTENT` decision into exactly one durable SignalIntent.

This is **SignalIntent generation only**:

- no Order creation
- no Execution Engine interaction
- no Accounting mutations
- no checkpoint persistence
- no Runtime lifecycle transitions

---

## Generation algorithm

```text
EVALUATED (US247)
  ↓
load evaluation + arming + Session Runtime lifecycle/diagnostics/context
  ↓
decideRecoverySignalIntentGeneration
  ├─ evaluation incomplete / NO_ACTION / not ARMED /
  │  session or identity mismatch / duplicate event /
  │  already converted / already generated → SIGNAL_GENERATION_BLOCKED
  └─ gates pass → SignalIntentGenerationPlan
      ↓
      StrategyRuntimePort.emitSignalIntent(plan)
      ↓
      SIGNAL_INTENT_GENERATED { exactly one Intent, orderCreated=false }
      ↓
structured log: recovery_signal_intent_generation
```

---

## Operational gates

Generation requires:

- prior US247 evaluation result = `EVALUATED`
- evaluation decision kind = `SIGNAL_INTENT`
- prior recovery arming result = `ARMED`
- Runtime worker state = `ARMED`
- Runtime diagnostics / lifecycle `acceptsTicks = true`
- Decision Session matches current armed Session
- Decision restored context matches validated Runtime identity
- candle `eventId` matches evaluation `eventId`
- decision not already converted in-process
- event not already used for SignalIntent generation in-process

---

## Decision → SignalIntent mapping

| Decision / context field             | SignalIntent field |
| ------------------------------------ | ------------------ |
| evaluation.workspaceId               | workspaceId        |
| armed.deploymentId                   | deploymentId       |
| evaluation.sessionId                 | sessionId          |
| context.deployment.strategyVersion   | strategyVersion    |
| candle.instrument                    | instrument         |
| candle.timeframe                     | timeframe          |
| decision.direction                   | direction          |
| decision.confidence                  | confidence         |
| candle.streamId / sequence / eventId | marketCheckpoint   |
| candle.closeTime                     | generatedAt        |
| decision.reason + OHLCV              | metadata           |

Identity remains the existing US214 semantic `intentHash` / `si_*` id.

---

## Duplicate protection

1. In-process `convertedDecisions` keyed by `workspace::session::eventId`
2. In-process `generatedEvents` keyed by the same event identity
3. Durable `emitSignalIntent` idempotency via `intentHash` (ADR-018 #2)

Illegal / ineligible inputs produce `SIGNAL_GENERATION_BLOCKED`.

---

## Boundary outcome

US248 deliberately separates Intent publication from Order path activity:

- persists via `StrategyRuntimePort.emitSignalIntent` only
- never calls Order proposal / Canonical Order Path execute APIs
- never calls `evaluate` (commit path) or `saveCheckpoint`
- Runtime worker state remains `ARMED` (unchanged)
- Canonical Order Path remains the owner of downstream Order execution

---

## Residual

- Order proposal from recovery SignalIntents remains a later story.
- Recovery completion / Session exit is implemented in US249.
- Original E17 US248 chaos/restart evidence ACs remain residual under local
  Stage 3 scoping (same pattern as US247 evaluation vs fail-safe suite).
