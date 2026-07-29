# US211 — Strategy Deployment Domain

Status: Implemented  
Milestone: RC-16 M3 / Epic E13  
Scope: Immutable Strategy Deployment bounded context. Create draft, approve
(freeze), get, and list. No Strategy Runtime, Trading Session changes, Orders,
Risk evaluation, Execution Engine, Fills, scheduler, or checkpoints.

## Architecture

```text
POST /v1/strategy-deployments
POST /v1/strategy-deployments/:id/approve
GET  /v1/strategy-deployments
GET  /v1/strategy-deployments/:id
  ↓ JWT + X-Workspace-Id (+ Idempotency-Key on create)
StrategyDeploymentController
  ↓ CommandAuthorizationService (Trader/Admin) / WorkspaceAccessService
StrategyDeploymentService
  ├─ StrategyDomainService.getById   — active strategy required on create
  ├─ StrategyDeploymentRepository
  └─ TransactionalOutboxAppender     — Created / Approved events
       ↓
PostgreSQL paper_strategy_deployments
```

Module: `apps/api/src/modules/strategy-deployment/`.

Prisma model `PaperStrategyDeployment` maps to `paper_strategy_deployments` so it
does not collide with the Stage-1 read-only `StrategyDeployment` table used by
Production list/get APIs.

## Ownership (ADR-014 / ADR-017 / ADR-018 #19)

| Owner                   | Owns                                                          | Does not own                                            |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| `strategy-deployment/`  | Immutable Deployment configuration, approval, provenance hash | Session lifecycle, leases, checkpoints, signals, Orders |
| Trading Session (later) | Runtime state referencing `deploymentId`                      | Deployment configuration mutation                       |

Runtime will reference Deployment. Deployment must not reference Runtime.

## Aggregate

`StrategyDeployment` fields:

- strategy identity (`strategyId`, `strategyVersion`, optional `experimentId`)
- immutable configuration (`parameters`, `instrument`, `timeframe`,
  `marketDataSourceId`, `paperExecutionConfigurationId`, Risk Policy id/version)
- `configurationHash` (SHA-256 over semantic fields only)
- approval status (`draft` → `approved`)
- metadata, actor/correlation/idempotency, aggregate `version`

After approval the configuration is immutable. Re-approve is a successful no-op.

## API

| Method | Path                                   | Role             | Behavior                  |
| ------ | -------------------------------------- | ---------------- | ------------------------- |
| POST   | `/v1/strategy-deployments`             | Trader/Admin     | Create draft (idempotent) |
| POST   | `/v1/strategy-deployments/:id/approve` | Trader/Admin     | Freeze approved           |
| GET    | `/v1/strategy-deployments`             | workspace member | List                      |
| GET    | `/v1/strategy-deployments/:id`         | workspace member | Read                      |

## Events

- `StrategyDeploymentCreated`
- `StrategyDeploymentApproved`

Committed atomically with aggregate writes via ADR-013 Outbox.

## Preserved boundaries

US211 does not modify Trading Session, Orders, Risk, Execution Engine,
Positions, Ledger, Portfolio, Signal Engine, or Evaluation Scheduler.
