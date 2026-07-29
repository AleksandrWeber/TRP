# US214 — Signal Intent Domain

Status: Implemented  
Milestone: RC-16 M3 / Epic E14  
Scope: Immutable Signal Intent bounded context owned by Strategy Runtime.
Append-only create (internal emit) + query. No Runtime worker, candle
evaluation, Session lifecycle, Orders, Risk, Execution, Fills, or checkpoints.

## Architecture

```text
SignalIntentService.emit (internal Runtime port)
  ├─ createSignalIntent (stable identity / intentHash)
  ├─ SignalIntentRepository.append (unique workspace+intentHash)
  └─ TransactionalOutboxAppender — SignalIntentCreated
       ↓
PostgreSQL signal_intents

GET /v1/signal-intents?sessionId=
GET /v1/signal-intents/:id
  ↓ JWT + X-Workspace-Id
SignalIntentController (read-only query)
```

Module: `apps/api/src/modules/strategy-runtime/`.

## Ownership (ADR-012 / ADR-017 / ADR-018 #1–2)

| Owner               | Owns                                                         | Does not own                                      |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| `strategy-runtime/` | Immutable Signal Intent facts, identity, dedupe, Outbox emit | Orders, Risk Decision, Execution, Fills, Sessions |

Orders consume Signal Intent in US221 (`ORDER_PROPOSAL_PORT`). No reverse
dependency from Intent → Orders (Runtime never imports Orders).

## Aggregate

`SignalIntent` fields:

- `deploymentId`, `sessionId`, `strategyVersion`
- `instrument`, `timeframe`, `direction` (`buy` \| `sell`)
- optional `confidence` in `[0, 1]`
- `marketCheckpoint` (streamId / sequence / eventId) for semantic tick identity
- `generatedAt` (semantic evaluation time)
- idempotency identity: `intentHash` + deterministic `id` (`si_<hash-prefix>`)

The aggregate is immutable and append-only. Duplicate identity is a successful
no-op (unique constraint). Operational `recordedAt` / `correlationId` /
`metadata` are excluded from the identity hash.

HOLD / no-action outcomes are not Signal Intents (Runtime pipeline later).

## API

| Method | Path                                  | Role             | Behavior                      |
| ------ | ------------------------------------- | ---------------- | ----------------------------- |
| —      | `SignalIntentService.emit` (internal) | Runtime only     | Append + Outbox; dedupe no-op |
| GET    | `/v1/signal-intents?sessionId=`       | workspace member | List intents for a session    |
| GET    | `/v1/signal-intents/:id`              | workspace member | Read one intent               |

No public create/mutate HTTP endpoint. No Order / Risk / Execution routes.

## Events

- `SignalIntentCreated` (schema v1) — RC-16 plan alias: Signal Intent emitted

Committed atomically with the Intent row via ADR-013 Outbox.

## Preserved boundaries

US214 does not modify Trading Session, Orders, Risk, Execution Engine,
Positions, Ledger, Portfolio, Signal Engine, Evaluation Scheduler, or
Strategy Deployment configuration.
