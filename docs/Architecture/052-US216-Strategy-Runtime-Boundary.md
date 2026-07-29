# US216 — Strategy Runtime Module Boundary

Status: Implemented  
Milestone: RC-16 M3 / Epic E14  
Scope: Strategy Runtime Nest module shell, `StrategyRuntimePort`,
`RuntimeContext`, and DI contracts. No worker, candle evaluation, semantic
ticks, Session lifecycle binding, Orders bridge, Risk, or Execution.

## Architecture

```text
STRATEGY_RUNTIME_PORT (StrategyRuntimeService)
  ├─ StrategyDeploymentService.get   — approved Deployment only
  ├─ SignalIntentService             — emit / list (US214)
  └─ StrategyCheckpointService       — save / load (US215)

RuntimeContext = approved Deployment + optional Checkpoint + sessionId ref
RuntimeDiagnostics = checkpoint progress shell (evaluationEnabled: false)
```

Module: `apps/api/src/modules/strategy-runtime/`.

## Ownership (ADR-012 / ADR-017 / ADR-018 #1–2)

| Owner               | Owns                                                           | Does not own                                      |
| ------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| `strategy-runtime/` | Evaluation shell, Intent + Checkpoint composition, RuntimePort | Session lifecycle, Orders, Risk, Execution, Fills |

Signal Intent and Strategy Checkpoint remain subordinate Runtime domains.
Trading Session will consume `STRATEGY_RUNTIME_PORT` in US217+ without
importing Runtime persistence.

## RuntimePort

`StrategyRuntimePort`:

- `loadContext({ workspaceId, sessionId, deploymentId })`
- `getDiagnostics(workspaceId, sessionId)`
- `admitTick` (US218)
- `evaluate` (US219)
- `emitSignalIntent` / `listSignalIntents`
- `saveCheckpoint` / `loadCheckpoint`

## Allowed dependencies

- `strategy-deployment/` (approved configuration)
- Signal Intent + Strategy Checkpoint (same module)
- Event Processing (Outbox via Intent/Checkpoint services)
- Auth / Workspace (read query controller only)

## Forbidden dependencies

- Orders, Risk, Execution Engine, Execution Adapter
- Fill / Positions / Ledger / Portfolio
- Trading Session
- Research Signal Engine / Evaluation Scheduler

Enforced by `strategy-runtime.boundaries.spec.ts`.

## Preserved boundaries

US216 does not implement evaluation, scheduler, Session binding, or Orders
consumption.
