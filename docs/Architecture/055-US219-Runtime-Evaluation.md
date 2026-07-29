# US219 — Runtime Evaluation Pipeline

Status: Implemented  
Milestone: RC-16 M3 / Epic E15  
Scope: Evaluate admitted semantic closed-candle ticks into exactly one
deterministic outcome — Signal Intent **or** NO_ACTION — and commit Intent
(when actionable) + Strategy Checkpoint + Outbox in one transaction.
No Orders, Risk, Execution, Fill, Portfolio, Position, or Session lifecycle.

## Architecture

```text
StrategyRuntimePort.evaluate
  ├─ load approved Deployment
  ├─ admitClosedCandleTick (US218) — must ADMITTED
  ├─ decideRuntimeEvaluation (pure) → SIGNAL_INTENT | NO_ACTION
  └─ single Prisma transaction
       ├─ SignalIntent append + SignalIntentCreated Outbox (if actionable)
       └─ StrategyCheckpoint create/advance + StrategyCheckpointAdvanced Outbox
```

Module: `apps/api/src/modules/strategy-runtime/`.

## Ownership (ADR-014 / ADR-017 / ADR-018)

| Owner            | Owns                                                         | Does not own                         |
| ---------------- | ------------------------------------------------------------ | ------------------------------------ |
| Strategy Runtime | Evaluation decision, Intent emit, checkpoint advance, Outbox | Orders, Risk, Execution, Session FSM |
| Trading Session  | Lease proof / RUNNING eligibility                            | Evaluation scoring                   |

## Evaluation

- Only **admitted** ticks are evaluated.
- Pure `decideRuntimeEvaluation(deployment, candle)` — no wall-clock authority.
- Deployment parameters (optional):
  - `action`: `buy` \| `sell` \| `hold`
  - `compareCloseToOpen`: `true` → bullish buy / bearish sell / flat hold
  - default → `NO_ACTION`
- Research Signal Engine / Evaluation Scheduler are not used.

## Outcomes

| Outcome         | Persist Intent | Advance Checkpoint | Outbox                                               |
| --------------- | -------------- | ------------------ | ---------------------------------------------------- |
| `SIGNAL_INTENT` | Yes (dedupe)   | Yes                | `SignalIntentCreated` + `StrategyCheckpointAdvanced` |
| `NO_ACTION`     | No             | Yes                | `StrategyCheckpointAdvanced`                         |

## Duplicate / replay

- Checkpoint already at tick → `ALREADY_PROCESSED` (no side effects).
- Non-admitted tick → `REJECTED_NOT_ADMITTED`.
- Intent unique identity + optimistic checkpoint version prevent double commit.
- Same Deployment + candle ⇒ same Intent hash (replay-stable).

## RuntimePort

`StrategyRuntimePort.evaluate(command)` via `RuntimeEvaluationService`.

Diagnostics: `evaluationEnabled: true`.

## Preserved boundaries

Forbidden: Orders, Risk, Execution Engine/Adapter, Fill / Positions / Ledger /
Portfolio, Trading Session imports, Signal Engine, Evaluation Scheduler.
Enforced by `strategy-runtime.boundaries.spec.ts`.

Orders consumption is implemented in US221.
