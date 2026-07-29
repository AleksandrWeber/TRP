# US220 — Session ↔ Runtime Lifecycle Drain

Status: Implemented  
Milestone: RC-16 M3 / Epic E15  
Scope: Integrate Strategy Runtime worker lifecycle with Trading Session
pause / resume / stop. Drain in-flight evaluation safely. No Orders, Risk,
Execution, Fill, Portfolio, Position, or Session ownership changes.

## Architecture

```text
TradingSessionService (lifecycle owner)
  ├─ start  → RuntimePort.loadContext + RuntimePort.arm
  ├─ pause  → RuntimePort.pause (drain) → Session PAUSED
  ├─ resume → Session RUNNING → RuntimePort.resume (arm)
  ├─ stop   → RuntimePort.stop (drain) → Session STOPPED
  └─ recover/fail → RuntimePort.stop (drain)

StrategyRuntimePort
  └─ RuntimeLifecycleCoordinator (in-memory worker state)
       IDLE ⇄ ARMED ⇄ EVALUATING
                 ↓ pause/stop
              DRAINING → IDLE
```

Modules: `strategy-runtime/` (worker lifecycle) + `trading-session/` (notifies port).

## Ownership (ADR-014 / ADR-017)

| Owner            | Owns                                    | Does not own                          |
| ---------------- | --------------------------------------- | ------------------------------------- |
| Trading Session  | Session FSM, lease, lifecycle commands  | Evaluation, Intent, Checkpoint writes |
| Strategy Runtime | Worker arm/drain, admit/evaluate gating | Session persistence / status machine  |

Session never accesses Runtime repositories. Runtime never imports Session.

## Worker states

| State        | Accepts ticks | Notes                                 |
| ------------ | ------------- | ------------------------------------- |
| `IDLE`       | No            | Default; after pause/stop drain       |
| `ARMED`      | Yes           | Session RUNNING + lease fence         |
| `EVALUATING` | No (busy)     | Single in-flight evaluation           |
| `DRAINING`   | No            | Awaiting in-flight commit before IDLE |

## Guarantees

- Pause/stop reject new admit/evaluate immediately (`REJECTED_RUNTIME_NOT_ARMED` /
  `REJECTED_LIFECYCLE`).
- In-flight evaluation is awaited; US219 atomic TX still commits fully or not at all.
- No partial Intent/checkpoint from lifecycle transitions.
- Checkpoint + Intent identity unchanged — replay/`ALREADY_PROCESSED` semantics preserved.
- Stale fencing token rejected on pause/stop.

## Preserved boundaries

Forbidden: Orders, Risk, Execution, Session→Runtime persistence, Signal Engine.
Enforced by `strategy-runtime.boundaries.spec.ts` and
`trading-session.boundaries.spec.ts`.
