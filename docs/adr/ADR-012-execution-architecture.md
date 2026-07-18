# ADR-012 — Execution Architecture

Status: Accepted

Date: 2026-07-18

Scope: RC-16 Paper Trading Platform

---

## Context

TRP has two execution foundations:

- the RC-15 simulation stack (`Backtesting → Trade → Portfolio`); and
- the Stage-1 production prototype (`ProductionService → RiskService → PaperBinanceAdapter`).

The prototype evaluates deployments through a manual tick, constructs an
ephemeral order request, simulates an immediate fill, and updates a persisted
position. It has no durable Order aggregate, idempotent execution command,
restart reconciliation, or single protected execution boundary.

RC-16 requires one canonical paper-execution path. Strategy evaluation,
risk approval, order lifecycle, execution, accounting, and reporting must
remain separate responsibilities.

---

## Decision

### Canonical execution flow

RC-16 freezes this direction:

```text
Market Event
    ↓
Strategy Runtime
    ↓
Signal Intent
    ↓
Order Service
    ↓
Risk Engine
    ↓ approved Risk Decision
Order Aggregate
    ↓
Execution Engine
    ↓
Paper Execution Adapter
    ↓
Fill / Rejection
    ↓
Accounting pipeline
```

The existing Stage-1 `ProductionService` is a prototype/facade to migrate. It
must not remain as a parallel execution path.

### Single execution entry point

The Execution Engine is the only component allowed to submit or cancel an
order through an execution adapter.

Its command input references a persisted Order that:

- belongs to a workspace and Trading Session;
- is in an executable state;
- has a stable client order ID and idempotency key;
- carries an unexpired, approved Risk Decision;
- references the market-data checkpoint used for approval.

All automated strategy execution, operator-created paper orders, retries, and
recovery operations use the same entry point.

### Execution Engine

The Execution Engine:

- verifies Order state and Risk Decision;
- enforces idempotent submission;
- calls the selected execution adapter;
- records adapter acknowledgement, rejection, cancellation, and Fill facts;
- transitions the Order state;
- publishes durable execution events through ADR-013;
- exposes reconciliation commands for adapter/order state.

The Execution Engine contains no strategy logic, position sizing policy,
portfolio accounting, risk-policy evaluation, or dashboard logic.

### Paper Execution Adapter

RC-16 binds the Execution Engine to an internal Paper Execution Adapter.

The adapter:

- accepts normalized execution commands;
- simulates market and limit order behavior against normalized market state;
- applies versioned fee, slippage, rounding, and fill rules;
- returns adapter acknowledgement, rejection, cancellation, and Fill facts;
- uses stable external-equivalent order identifiers;
- is deterministic for the same ordered market stream and configuration.

The Paper Execution Adapter does not update Orders, Positions, Ledger, or
Portfolio directly.

### Future Broker Adapter interface

The execution-adapter port supports:

- submit order;
- cancel order;
- query/reconcile order state;
- query adapter health and capabilities.

Provider-specific payloads, credentials, rate limits, and status mappings stay
inside an adapter.

No real broker adapter is implemented or enabled in RC-16. A future live
adapter requires a new ADR, separate credentials, additional safety review,
and an explicit release.

### Strategy Runtime separation

Strategy Runtime produces immutable Signal Intents only.

It must not:

- construct adapter requests;
- call the Execution Engine or adapter directly;
- mutate an Order;
- update Position, Ledger, or Portfolio;
- bypass Risk approval.

The Order application boundary converts a Signal Intent into a proposed Order
Intent and coordinates mandatory Risk evaluation.

### Delivery and idempotency

Execution is at-least-once at the command-delivery boundary and effectively
once at the business boundary through:

- stable client order IDs;
- unique database constraints;
- persisted Order state transitions;
- adapter idempotency where available;
- reconciliation before an uncertain retry.

The architecture does not claim distributed exactly-once delivery.

### Paper-only rule

RC-16 configuration binds only the Paper Execution Adapter. `live` mode is
rejected structurally, not merely hidden in the UI or disabled by a feature
flag.

---

## Consequences

### Advantages

- One protected execution boundary prevents bypass paths.
- Strategy code remains reusable between research and paper runtime.
- Durable Orders and Fill facts support audit and recovery.
- A future broker can reuse the port without changing accounting ownership.
- Idempotency rules are explicit.

### Constraints

- Existing Stage-1 production orchestration must be migrated, not expanded.
- Manual paper orders must use the same Order/Risk/Execution path.
- Adapter results cannot mutate financial projections directly.
- Real-capital support is outside RC-16.

### Follow-up

- User Stories must define the Order state machine and adapter contracts.
- ADR-013 governs execution events.
- ADR-015 governs Fill accounting.
- ADR-016 governs mandatory Risk approval and paper-only safety.
