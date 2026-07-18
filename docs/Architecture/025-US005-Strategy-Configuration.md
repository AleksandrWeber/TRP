# US005 — Strategy Configuration

Status: Implemented  
Scope: Persist and manage complete Strategy trading configuration. No market
data, calculations, signal generation, or paper trading.

## Configuration model

US005 extends the existing workspace-owned `Strategy` aggregate with:

- `tradingPair`: uppercase alphanumeric market symbol, for example `BTCUSDT`;
- `timeframe`: `1m | 5m | 15m | 1h | 4h | 1d`;
- `direction`: `LONG | SHORT | BOTH`;
- `positionSize`: finite number greater than zero;
- `stopLossPercent`: finite number from 0 through 100;
- `takeProfitPercent`: finite number from 0 through 100;
- `parameters`: flexible JSON object such as
  `{ "emaFast": 20, "emaSlow": 50, "rsi": 14 }`.

The existing identity, workspace ownership, metadata, status, and timestamps
remain part of the same aggregate. Configuration has no execution semantics in
US005.

`positionSize`, percentages, and parameters have create defaults (`1`, `0`,
`0`, and `{}`) at the domain boundary. The API requires `name`, `tradingPair`,
`timeframe`, and `direction`. The frontend supplies explicit risk values and a
JSON object.

## Persistence

`StrategyRecord` stores configuration in `strategy_records`:

```text
trading_pair          TEXT
timeframe             TEXT
direction             TEXT
position_size         DOUBLE PRECISION
stop_loss_percent     DOUBLE PRECISION
take_profit_percent   DOUBLE PRECISION
parameters            JSONB
```

Migration `20260718231000_us005_strategy_configuration` backfills pre-US005
rows with `BTCUSDT / 1h / BOTH / 1 / 0 / 0 / {}` before removing temporary
database defaults. Domain creation remains authoritative. An index on
`(workspace_id, trading_pair, timeframe)` supports future workspace-scoped
configuration lookup.

## Data flow

```text
StrategiesPage
  ├─ validates browser number constraints
  ├─ parses parameters text as a JSON object
  └─ calls typed Strategy methods on the Shared API Client
       ↓ Authorization + X-Workspace-Id (unchanged)
StrategiesController
  ├─ validates CreateStrategyBodyDto / UpdateStrategyBodyDto
  └─ resolves the existing workspace ownership boundary
       ↓
StrategyDomainService
  ├─ enforces configuration invariants
  ├─ preserves workspace isolation
  └─ persists through StrategyRepository
       ↓
PrismaStrategyRepository → strategy_records
```

Create, read, list, update, and delete return the complete configuration.
PATCH remains partial: omitted configuration values preserve their persisted
values.

## Validation

Validation is duplicated intentionally at appropriate trust boundaries:

- **Frontend:** required inputs, allowed select options, positive/ranged
  numeric inputs, and explicit JSON parsing with object-shape rejection.
- **DTO:** class-validator rejects missing required fields, unsupported enum
  values, malformed pairs, non-positive size, out-of-range percentages, and
  non-object parameters.
- **Domain:** repeats all business invariants so non-HTTP callers cannot bypass
  the Strategy contract.
- **Repository mapping:** rejects unsupported persisted timeframe/direction or
  non-object JSON rather than hydrating an invalid aggregate.

Unknown HTTP fields remain rejected by the global validation pipe.

## Workspace ownership

US005 does not change Strategy ownership. `workspaceId` is still sourced only
from `X-Workspace-Id`, validated through `requireWorkspaceId`, and checked by
`StrategyDomainService` on every item read or mutation. It is never accepted
from a create or update body.

## Future Signal Engine integration

A future Signal Engine can read an `active` Strategy configuration by
`workspaceId + strategyId` and compile:

- market subscription intent from `tradingPair` and `timeframe`;
- permitted order side from `direction`;
- risk instructions from position size, stop loss, and take profit;
- strategy-specific calculation input from `parameters`.

That engine must consume this configuration through a Strategy-domain port or
application service. It must not add signal state, market snapshots, orders,
or positions to `StrategyRecord`. Configuration versioning and immutable
execution snapshots should be introduced before live or paper execution so
historical signals remain reproducible after a Strategy edit.

## Preserved boundaries

Authentication, JWT, Workspace Bootstrap, Workspace Context, Shared API Client
request/header behavior, and Strategy workspace ownership are unchanged.
US005 only extends the existing Strategy contract, persistence mapping, DTOs,
CRUD payloads, and Strategy management UI.
