# US218 — Semantic Closed-Candle Tick Admission

Status: Implemented  
Milestone: RC-16 M3 / Epic E15  
Scope: Runtime admission of semantic closed-candle ticks under a valid Session
lease. No evaluation, Signal Intent generation, Orders, Risk, Execution, or
checkpoint advancement.

## Architecture

```text
ClosedCandle Market Event (semantic tick)
  ↓
Caller supplies RuntimeLeaseProof (RUNNING + fencing + expiry)
  ↓
StrategyRuntimePort.admitTick
  ├─ load StrategyCheckpoint (read-only ordering pointer)
  └─ admitClosedCandleTick (pure domain gate)
       → ADMITTED | REJECTED_*
```

Module: `apps/api/src/modules/strategy-runtime/`.

## Ownership (ADR-014 / ADR-017 / ADR-018)

| Owner            | Owns                                                      | Does not own                                |
| ---------------- | --------------------------------------------------------- | ------------------------------------------- |
| Strategy Runtime | Tick admission, ordering vs checkpoint, lease proof check | Session lifecycle, evaluation, Orders, Risk |
| Trading Session  | Lease issuance / fencing / RUNNING eligibility            | Tick admission logic                        |
| Live Market Data | Normalized closed-candle Market Events                    | Runtime admission                           |

A semantic tick is a **confirmed closed market candle**. It is not a timer
event and not a scheduler event (ADR-014 / ADR-018 #53).

## Tick contract

`ClosedCandleTickEvent` (`MarketClosedCandle`):

- `eventId`, `workspaceId`, `streamId`, `sequence`
- `openTime`, `closeTime`, `instrument`, `timeframe`

OHLC prices are intentionally excluded from the admission contract.

## Lease proof

`RuntimeLeaseProof` is an opaque Session authorization value:

- `sessionId`, `fencingToken`, `ownerId`, `expiresAt`
- `sessionStatus` must be `RUNNING`
- wall-clock expiry is operational only

Runtime validates the proof without importing Trading Session persistence.

## Admission statuses

| Status                       | Meaning                                      |
| ---------------------------- | -------------------------------------------- |
| `ADMITTED`                   | Next closed candle accepted under lease      |
| `REJECTED_NOT_CLOSED_CANDLE` | Non-closed / invalid candle contract         |
| `REJECTED_LEASE_INVALID`     | Missing/expired/non-RUNNING lease or scope   |
| `REJECTED_DUPLICATE`         | Same event id or candle progress identity    |
| `REJECTED_STALE`             | Sequence/openTime behind checkpoint          |
| `REJECTED_OUT_OF_ORDER`      | Gap / non-next sequence or openTime ordering |
| `REJECTED_STREAM_MISMATCH`   | Stream id differs from checkpoint            |

With a checkpoint, the next admitted tick must be `sequence = last + 1` and
`openTime > last.openTime` on the same stream. Without a checkpoint, the first
closed candle is admitted.

## RuntimePort

`StrategyRuntimePort.admitTick(command)`:

- loads checkpoint for ordering comparison only
- returns deterministic `TickAdmissionResult`
- does **not** call evaluate, emit Intent, save checkpoint, or touch Orders

## Preserved boundaries

Forbidden: Orders, Risk, Execution Engine, Execution Adapter, Fill / Positions /
Ledger / Portfolio, Trading Session imports, Signal Engine, Evaluation Scheduler.
Enforced by `strategy-runtime.boundaries.spec.ts`.

Evaluation is implemented in US219 (`StrategyRuntimePort.evaluate`).
