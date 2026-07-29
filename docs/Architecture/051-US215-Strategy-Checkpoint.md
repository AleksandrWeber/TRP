# US215 — Strategy Checkpoint Domain

Status: Implemented  
Milestone: RC-16 M3 / Epic E14  
Scope: Versioned Strategy Runtime checkpoint contracts. Internal save/load.
No Runtime worker, candle evaluation, Orders, Risk, Execution, Fills,
Positions, or Trading Session lifecycle ownership.

## Architecture

```text
StrategyCheckpointService.save / load (internal Runtime port)
  ├─ createStrategyCheckpoint / advanceStrategyCheckpoint
  │    (monotonic candle sequence + openTime)
  ├─ StrategyCheckpointRepository.save (optimistic version)
  └─ TransactionalOutboxAppender — StrategyCheckpointAdvanced
       ↓
PostgreSQL strategy_checkpoints
  unique (workspace_id, session_id)
```

Module: `apps/api/src/modules/strategy-runtime/`.

## Ownership (ADR-014 / ADR-017 / ADR-018 #17)

| Owner               | Owns                                                       | Does not own                                     |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `strategy-runtime/` | Strategy evaluation progress checkpoint, monotonic advance | Session lease/lifecycle, Orders, Risk, Execution |

Trading Session remains lifecycle/lease owner and must not persist Strategy
Runtime progress fields. Session may later _reference_ Runtime checkpoint
reads without owning the schema (US217+).

ADR-014’s broader “Session checkpoint” list (Intent identity, fencing,
accounting correlation) is split: this story owns **strategy evaluation
progress only**. Remaining Session-side recovery fields stay with later
Session/Runtime integration stories.

## Aggregate

`StrategyCheckpoint` fields:

- `deploymentId`, `sessionId`
- `lastProcessedCandle` — `{ streamId, sequence, openTime, instrument, timeframe }`
- `lastProcessedEventId`
- `runtimeVersion`
- `version` (optimistic concurrency)
- `updatedAt`

Design: **versioned current row** per `(workspaceId, sessionId)` (not
append-only history). Outbox `StrategyCheckpointAdvanced` events provide the
durable advance audit trail. Identical progress is a successful no-op.

Monotonicity: same `streamId`; `sequence` and candle `openTime` must strictly
increase. `deploymentId` is immutable for the session checkpoint.

OHLC prices are excluded from the candle pointer — resume needs identity, not
valuation.

## API

| Method | Path                                        | Role         | Behavior                              |
| ------ | ------------------------------------------- | ------------ | ------------------------------------- |
| —      | `StrategyCheckpointService.save` (internal) | Runtime only | Create/advance + Outbox; dedupe no-op |
| —      | `StrategyCheckpointService.load` (internal) | Runtime only | Load current by session               |
| —      | `StrategyCheckpointService.get` (internal)  | Runtime only | Load by checkpoint id                 |

No public HTTP mutate/query endpoint in US215.

## Events

- `StrategyCheckpointAdvanced` (schema v1) — required by ADR-014 transactional
  checkpoint + domain event semantics

Committed atomically with the checkpoint write via ADR-013 Outbox.

## Preserved boundaries

US215 does not modify Trading Session, Orders, Risk, Execution Engine,
Positions, Ledger, Portfolio, Signal Engine, or Evaluation Scheduler.
