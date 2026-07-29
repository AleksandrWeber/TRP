# US217 — Trading Session ↔ Strategy Deployment Binding

Status: Implemented  
Milestone: RC-16 M3 / Epic E15  
Scope: Bind approved Strategy Deployment to Trading Session by identity.
Initialize RuntimeContext through StrategyRuntimePort on strategy-origin
start. No worker, evaluation, semantic ticks, Signal Intent emission,
checkpoint advancement, Orders, Risk, or Execution.

## Architecture

```text
Create TradingSession (origin: strategy, deploymentId)
  ↓
TradingSessionService
  └─ StrategyDeploymentService.get — APPROVED required
       ↓
Session stores deploymentId only (immutable identity)

Start TradingSession (strategy origin)
  ↓ CREATED → STARTING
TradingSessionService
  └─ STRATEGY_RUNTIME_PORT.loadContext({ workspaceId, sessionId, deploymentId })
       ↓ RuntimeContext (approved Deployment + optional Checkpoint)
  ↓ acquire lease → RUNNING
```

Module: `apps/api/src/modules/trading-session/`.

## Ownership (ADR-014 / ADR-017)

| Owner               | Owns                                      | Does not own                          |
| ------------------- | ----------------------------------------- | ------------------------------------- |
| Trading Session     | Lifecycle, lease, Deployment identity ref | Evaluation, Intent, Checkpoint schema |
| Strategy Deployment | Immutable approved configuration          | Session lifecycle                     |
| Strategy Runtime    | RuntimeContext / evaluation shell         | Session state machine                 |

## Origin

`TradingSessionOrigin = 'manual' | 'strategy'`.

- `strategy` — requires workspace APPROVED Deployment on create; start calls
  `StrategyRuntimePort.loadContext`.
- `manual` — M2 opaque deployment id preserved; no Deployment/RuntimePort calls.

## Preserved boundaries

Session imports `StrategyDeploymentModule` + `StrategyRuntimeModule` (port).
Forbidden: Orders, Risk, Execution, Positions, Ledger, Portfolio, Signal Engine.
Enforced by `trading-session.boundaries.spec.ts`.
