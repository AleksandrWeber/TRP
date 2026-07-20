# US004 — Strategy Domain Foundation

Status: Implemented  
Scope: New workspace-owned Strategy domain — CRUD metadata only. No trading
logic, market integration, or signal generation.

## Strategy architecture

```text
StrategiesPage (frontend)
  ↓ Shared API Client (Authorization + X-Workspace-Id)
StrategiesController (/v1/strategies)
  ↓ requireWorkspaceId → WorkspaceDomainService
StrategyDomainService (workspace-scoped CRUD rules)
  ↓ StrategyRepository port
PrismaStrategyRepository → strategy_records (PostgreSQL)
```

Module: `apps/api/src/modules/strategies/` (`StrategiesModule`).

- **Entity** (`strategy.ts`): `Strategy` with `id`, `workspaceId`, `name`,
  `description`, `status` (`draft | active | archived`), `createdAt`,
  `updatedAt` (ISO-8601 strings in the domain).
- **Repository port** (`repositories/strategy.repository.ts`): storage
  operations only. Implementations: `PrismaStrategyRepository` (runtime) and
  `InMemoryStrategyRepository` (tests).
- **Domain service** (`strategy-domain.service.ts`): create / getById /
  listByWorkspace / update / delete. Owns defaulting (`draft`), trimming,
  status validation, and workspace scoping.
- **Controller** (`strategies.controller.ts`): HTTP adapter with
  class-validator DTOs (`CreateStrategyBodyDto`, `UpdateStrategyBodyDto`).

## Workspace ownership

Every Strategy belongs to exactly one workspace. Isolation is enforced in the
domain service: reads and mutations resolve the strategy first and treat a
`workspaceId` mismatch as non-existent. The controller maps that to `404`, so
cross-workspace access is indistinguishable from a missing strategy.

The workspace scope comes exclusively from the validated `X-Workspace-Id`
header via the shared `requireWorkspaceId` helper (missing header → `400`,
unknown workspace → `404`). Strategies never accept a workspace ID in the
request body.

## API

All endpoints are JWT-authenticated (global guard) and require
`X-Workspace-Id`.

| Method | Path                 | Behavior                                        |
| ------ | -------------------- | ----------------------------------------------- |
| GET    | `/v1/strategies`     | List workspace strategies, oldest first         |
| GET    | `/v1/strategies/:id` | Read one strategy; `404` outside the workspace  |
| POST   | `/v1/strategies`     | Create (`name` required; `status` → `draft`)    |
| PATCH  | `/v1/strategies/:id` | Partial update of `name`/`description`/`status` |
| DELETE | `/v1/strategies/:id` | Hard delete; returns `{ id, deleted: true }`    |

Validation: `name` 1–200 chars, `description` ≤ 2000 chars, `status` one of
`draft | active | archived`. Unknown body fields are rejected by the global
whitelist pipe.

Two cross-cutting integration notes surfaced by US004 (first browser consumer
of PATCH/DELETE):

- API CORS now explicitly allows `PATCH`/`DELETE` (`apps/api/src/main.ts`);
  the Fastify CORS default only reflected `GET,HEAD,POST`.
- `api.deleteStrategy` sends an empty JSON object body because the Shared API
  Client always sets `Content-Type: application/json` and Fastify rejects an
  empty body with that content type. The Shared API Client itself is
  unchanged.

## Persistence

Prisma model `StrategyRecord` → table `strategy_records`
(migration `20260718224500_us004_strategy_domain`), indexed by
`(workspace_id, status)` and `(workspace_id, created_at)`. Timestamps are
domain-managed; `updatedAt` is set by the domain service on every update.

## Data flow (frontend)

```text
RequireAuth → WorkspaceProvider
  → StrategiesPage reads useWorkspace().activeWorkspace
  → effects keyed by activeWorkspace.id load /v1/strategies
  → create / edit / delete call the Shared API Client
  → Shared API Client injects Authorization + X-Workspace-Id
  → list refreshes after every mutation
```

`StrategiesPage` (`apps/web/src/pages/StrategiesPage.tsx`) holds no local
workspace state and never constructs workspace headers. Route `/strategies`
sits under `RequireAuth`, inside the Workspace Context boundary
([`023-US003-Workspace-Context.md`](./023-US003-Workspace-Context.md)).

## Future extension points

- **Signals:** a future Signal domain references `Strategy.id` and must reuse
  the same workspace scoping; the Strategy entity stays free of signal state.
- **Paper Trading:** deployments/sessions can bind to an `active` Strategy;
  the `status` field is the intended lifecycle gate (`draft → active →
archived`) without schema changes.
- **Parameters/versioning:** strategy parameters and version history belong in
  future dedicated tables referencing `strategy_records`, not in this entity.
- Additional consumers use the exported `StrategyDomainService` /
  `STRATEGY_REPOSITORY` port; no HTTP-layer coupling.

## Preserved boundaries

US004 does not modify Authentication, JWT, Workspace Bootstrap, Workspace
Context, or the Shared API Client. The research-side strategy registry
(`ema-crossover`, `donchian-breakout`) and `StrategyDeployment` remain separate
concepts; this domain introduces the user-managed Strategy definition.
