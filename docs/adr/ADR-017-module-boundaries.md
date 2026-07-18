# ADR-017 — Module Boundaries

Status: Accepted

Date: 2026-07-18

Scope: RC-16 Paper Trading Platform

---

## Context

RC-16 crosses live market data, strategy execution, session runtime, risk,
orders, paper execution, accounting, audit, and operator UI. The repository
already contains overlapping simulation and Stage-1 production abstractions.

Without frozen ownership, RC-16 could create parallel trading paths, direct
database access, duplicated calculations, or cycles between execution and
accounting.

---

## Decision

TRP remains a NestJS modular monolith. Boundaries are module boundaries, not
separately deployed microservices.

The frozen dependency direction is:

```text
Live Market Data → Strategy Runtime → Orders → Risk
                                      ↓ approved
                              Execution Engine → Paper Adapter
                                      ↓
                                    Fills
                                      ↓
                         Positions → Ledger → Portfolio

Trading Session coordinates runtime lifecycle around these boundaries.
Audit/Event Processing observes durable facts.
Dashboard consumes APIs/read models only.
```

### Live Market Data

**Responsibilities**

- External public market connectivity.
- Subscription, normalization, validation, sequence/gap handling.
- Closed candles, normalized mark prices, and market-health state.
- Durable market checkpoints required by Sessions.

**Inputs**

- Exchange REST/WebSocket payloads.
- Subscription commands.
- Instrument metadata/configuration.

**Outputs**

- Versioned normalized Market Events.
- Market Status/health.
- Recovery/backfill results and checkpoints.

**Dependencies**

- Connector adapters, configuration, Event Processing, logging/metrics.

**This module MUST NOT**

- evaluate strategies;
- create Orders or Fills;
- make Risk decisions;
- mutate Positions, Ledger, or Portfolio;
- expose provider-specific payloads outside connector boundaries.

### Strategy Runtime

**Responsibilities**

- Load an approved strategy/version and immutable parameters.
- Evaluate ordered Market Events.
- Persist strategy checkpoints.
- Produce immutable, deduplicated Signal Intents.

**Inputs**

- Trading Session/deployment configuration.
- Closed-candle/strategy-relevant Market Events.
- Strategy checkpoint.

**Outputs**

- Signal Intent or no-action decision.
- Evaluation checkpoint and diagnostics.

**Dependencies**

- Strategy registry, Trading Session contract, Event Processing,
  logging/metrics.

**This module MUST NOT**

- submit/cancel Orders;
- call an execution adapter;
- approve Risk;
- update Position, Ledger, or Portfolio;
- use wall-clock duration as strategy/business input.

### Trading Session

**Responsibilities**

- Session state machine from ADR-014.
- Runtime ownership, fenced lease, heartbeat, and checkpoints.
- Start/pause/resume/stop/recovery coordination.
- Subscription and runner lifecycle.

**Inputs**

- Authorized operator commands.
- Immutable Strategy Deployment.
- health/recovery outcomes.

**Outputs**

- Session lifecycle events.
- runtime work authorization and checkpoints.
- Incidents on failed recovery/ownership.

**Dependencies**

- Live Market Data health, Strategy Runtime port, Risk/Kill Switch status,
  Event Processing, persistence.

**This module MUST NOT**

- implement strategy logic;
- modify Order state directly;
- perform fills or accounting;
- own Risk Policy;
- treat an in-memory timer as authoritative state.

### Risk

**Responsibilities**

- Versioned Risk Policies.
- Mandatory pre-trade Risk Decisions.
- Continuous safety monitoring.
- Kill Switch and safety incidents.

**Inputs**

- Order Intent.
- Session, market, Position, Portfolio, and reconciliation checkpoints.
- operator policy/kill-switch commands.

**Outputs**

- immutable Risk Decision.
- pause/stop/cancel/kill-switch commands through public ports.
- Risk events, Incidents, and alerts.

**Dependencies**

- Read-only Session, market-health, Position, and Portfolio contracts;
  persistence, Audit/Event Processing.

**This module MUST NOT**

- modify Portfolio, Ledger, Position, Fill, or Order history;
- submit an Order;
- call an execution adapter;
- approve stale or unknown state;
- alter historical decisions after policy changes.

### Orders

**Responsibilities**

- Order Intent conversion.
- Order aggregate/state machine.
- idempotency, reservation request, cancellation, and lifecycle history.
- attach/verify Risk Decision references.

**Inputs**

- Signal Intent or authorized manual paper-order command.
- Risk Decision.
- execution acknowledgement/rejection/Fill/cancellation results.

**Outputs**

- persisted Order and transitions.
- executable/cancel commands for Execution Engine.
- Order events/read models.

**Dependencies**

- Risk port, Execution Engine port, Portfolio reservation port,
  Event Processing, persistence.

**This module MUST NOT**

- evaluate strategies;
- simulate or place fills;
- update Position/Ledger/Portfolio directly;
- bypass Risk;
- infer Order status from Dashboard state.

### Execution Engine

**Responsibilities**

- Single adapter execution entry point from ADR-012.
- idempotent submit/cancel/reconcile.
- adapter capability/status mapping.
- record acknowledgements, rejections, and immutable Fill facts.

**Inputs**

- persisted executable Order/cancel command.
- valid Risk Decision.
- adapter health and normalized market execution context.

**Outputs**

- execution acknowledgement/rejection.
- Fill and cancellation facts.
- reconciliation result and execution events.

**Dependencies**

- execution-adapter port, Orders port, Event Processing, persistence,
  logging/metrics.

**This module MUST NOT**

- evaluate strategies or Risk Policy;
- update Positions;
- write Ledger/Portfolio;
- invent an Order outside Orders;
- enable live-capital adapters in RC-16.

### Paper Execution Adapter

**Responsibilities**

- Deterministic paper matching/fill rules.
- fee, slippage, precision, market/limit, cancellation behavior.
- adapter order identity and query/reconciliation.

**Inputs**

- normalized execution/cancellation commands.
- normalized market execution state.
- versioned paper-fill configuration.

**Outputs**

- adapter acknowledgement, rejection, cancellation, status, and Fill response.

**Dependencies**

- Live Market Data read contract and instrument metadata only.

**This module MUST NOT**

- access strategy logic or Risk Policy;
- update domain Orders, Positions, Ledger, or Portfolio;
- publish private provider payloads;
- accept real-capital credentials or live mode.

### Positions

**Responsibilities**

- Apply each Fill exactly once.
- Maintain quantity, cost basis, average entry, and realized PnL.
- Produce versioned mark-to-market valuation projections.
- rebuild/reconcile Position state.

**Inputs**

- immutable Fill events.
- normalized mark-price events for valuation.

**Outputs**

- Position transition.
- Ledger-entry request/facts within the accounting transaction.
- Position valuation and mismatch events.

**Dependencies**

- Event Processing Inbox, Ledger contract, instrument metadata, persistence.

**This module MUST NOT**

- submit/cancel Orders;
- call an execution adapter;
- make Risk decisions;
- mutate Fill history;
- use operational timestamps for PnL.

### Ledger

**Responsibilities**

- Append-only financial entries.
- paper cash, reservations, fees, cost, realized PnL, compensation.
- balanced transaction validation and financial rebuild.

**Inputs**

- Fill accounting transition.
- Order reserve/release facts.
- authorized compensation command.

**Outputs**

- Ledger transaction/entries.
- account balances and accounting events.

**Dependencies**

- decimal/money primitives, Event Processing, persistence.

**This module MUST NOT**

- consume raw Market Data;
- evaluate strategies or Risk;
- mutate/delete historical entries;
- use floating-point as canonical financial representation;
- present itself as an execution adapter.

### Portfolio

**Responsibilities**

- Project Ledger balances and Position valuations.
- expose cash, reservations, equity, PnL, exposure, and freshness/version.
- rebuild and reconcile the Portfolio projection.

**Inputs**

- Ledger events/balances.
- Position/valuation events.

**Outputs**

- versioned Portfolio projection/snapshot.
- accounting invariant/mismatch events.

**Dependencies**

- Ledger and Position read/event contracts, persistence, Event Processing.

**This module MUST NOT**

- consume raw Market Data;
- submit Orders or call adapters;
- make or enforce Risk decisions;
- mutate Ledger/Fills/Positions;
- duplicate financial calculations in Dashboard/report code.

### Audit

**Responsibilities**

- Immutable operator/security/business audit records.
- actor, workspace, correlation/causation, command, outcome, and provenance.
- searchable audit timeline and retention.

**Inputs**

- authorized commands and durable domain/security events.

**Outputs**

- immutable Audit Records and query models.

**Dependencies**

- Event Processing, identity/workspace, persistence.

**This module MUST NOT**

- orchestrate trading;
- modify source aggregates;
- expose secrets;
- treat logs as a substitute for Audit Records.

### Dashboard

**Responsibilities**

- Operator command UI and read-only live/historical views.
- display explicit paper mode, health, freshness, and risk/incidents.
- consume REST queries and WebSocket/SSE projections.

**Inputs**

- API read models/live projections.
- authorized user commands.

**Outputs**

- idempotent API commands.
- operator presentation only.

**Dependencies**

- public API contracts, authentication/authorization.

**This module MUST NOT**

- contain trading, risk, fill, or accounting logic;
- access persistence directly;
- infer authoritative state from local UI cache;
- hide stale, recovering, failed, or paper-mode status.

### Event Processing

**Responsibilities**

- Transactional Outbox, Inbox, durable delivery, ordering, versioning,
  checkpoints, retry/dead-letter, and replay from ADR-013.

**Inputs**

- domain events committed with aggregate changes.

**Outputs**

- idempotent consumer delivery and operational metrics.

**Dependencies**

- PostgreSQL and observability.

**This module MUST NOT**

- contain trading business rules;
- claim global/exactly-once ordering;
- treat failed handlers as acknowledged;
- mutate event history.

---

## Shared dependencies

Shared technical services are limited to:

- identity/workspace/RBAC;
- decimal/money and instrument precision;
- domain Clock and operational Clock;
- IDs/idempotency/correlation;
- configuration/secrets;
- logging, metrics, and health;
- persistence transactions.

Shared services cannot become a generic business-logic module.

---

## Consequences

### Advantages

- Every write has one owner.
- Execution, Risk, and accounting cannot bypass each other.
- Dashboard/reporting remain read-only consumers.
- Existing duplicate abstractions have a canonical consolidation target.

### Constraints

- Direct cross-module database access is prohibited.
- New dependencies must preserve the frozen direction.
- A new ADR is required for a changed owner, reversed dependency, new
  execution path, or new deployable service boundary.
