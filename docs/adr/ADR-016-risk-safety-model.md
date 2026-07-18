# ADR-016 — Risk & Safety Model

Status: Accepted

Date: 2026-07-18

Scope: RC-16 Paper Trading Platform

---

## Context

The current `RiskService` checks deployment status, long/flat state, positive
close quantity, and maximum notional. RC-16 introduces continuous sessions,
durable Orders, portfolio accounting, live-data health, and recovery.

Risk must be mandatory, durable, explainable, and impossible for Strategy
Runtime or operator commands to bypass.

---

## Decision

### Risk Engine

The Risk Engine is the only component allowed to approve an Order Intent for
execution.

It evaluates a versioned Risk Policy against immutable input references:

- workspace and paper account;
- Trading Session and deployment;
- Order Intent;
- Position checkpoint;
- Portfolio checkpoint;
- market-data checkpoint and freshness;
- Kill Switch state;
- current risk counters.

It returns and persists a Risk Decision:

- `APPROVED` or `REJECTED`;
- decision ID;
- policy ID/version;
- normalized inputs/checkpoint versions;
- rule results and reasons;
- domain timestamp;
- expiry/validity conditions.

Risk evaluation is deterministic for the same policy and semantic inputs.

### Mandatory approval

No Order may enter an executable state without an approved, unexpired Risk
Decision.

The Execution Engine verifies:

- decision references the exact Order Intent hash/version;
- policy/checkpoint assumptions remain valid;
- Kill Switch is inactive;
- decision has not expired or been revoked.

If assumptions changed, the Order returns for Risk re-evaluation.

### Frozen minimum safety rules

RC-16 supports, at minimum:

- paper-only mode;
- allowed workspace, instrument, side, and order type;
- active and owned Trading Session;
- healthy/fresh market-data stream;
- maximum order notional;
- maximum Position size;
- maximum Portfolio exposure;
- available paper cash and reservation check;
- maximum open Orders/Positions;
- maximum daily loss;
- maximum drawdown;
- duplicate/replay guard;
- execution-rate guard;
- unresolved reconciliation/incident guard.

Risk Policy changes are versioned, authorized, and audited. They do not mutate
historical decisions.

### Continuous risk monitoring

Risk also consumes versioned Position, Portfolio, market-health, session-health,
and execution events.

Continuous monitoring may:

- reject future Orders;
- pause a Trading Session;
- activate the Kill Switch;
- create an Incident and alert.

Risk does not alter Portfolio, Ledger, Position, Fill, or historical Order
state directly.

### Kill Switch

Kill Switch state is durable and scoped to:

- platform/workspace;
- paper account;
- deployment;
- Trading Session.

Activation has higher priority than strategy/execution work.

When active:

- new Order creation/approval/execution is blocked;
- pending Orders receive cancellation commands;
- active Sessions pause or stop according to policy;
- operator alert and Incident are created;
- activation reason, actor, scope, and time are audited.

Automatic triggers include:

- daily loss/drawdown threshold;
- stale or unavailable market data;
- accounting/reconciliation mismatch;
- runtime ownership conflict;
- repeated execution failure;
- critical health failure.

Manual activation is available only to authorized roles.

Deactivation requires explicit authorized acknowledgement and successful
reconciliation. It is never automatic after a critical trigger.

### Paper-only execution

RC-16 has no real-capital execution binding.

Safety requirements:

- only Paper Execution Adapter is registered;
- `live` mode is rejected by domain validation and configuration startup checks;
- no withdrawal or private trading credentials are required;
- Dashboard labels all accounts, Orders, Fills, and Positions as paper;
- a future live adapter requires a new ADR and release.

### Fail-safe behavior

On uncertainty, the system stops creating new exposure.

Examples:

- stale portfolio checkpoint → reject;
- stale market data → reject/pause;
- unknown Order state → recover/reconcile;
- unavailable Risk Engine → reject;
- expired approval → re-evaluate;
- accounting mismatch → activate scoped Kill Switch.

---

## Consequences

### Advantages

- Risk cannot be bypassed by Strategy Runtime, Dashboard, or retries.
- Decisions are explainable and reproducible.
- Kill Switch survives restart.
- Uncertain state fails safe.

### Constraints

- Risk checks add latency and require fresh projections.
- Policy/version changes need audit and compatibility handling.
- Execution and recovery tests must include Risk unavailability and stale-state
  scenarios.
- Profitability never overrides a safety rejection.

### Follow-up

A new ADR is required before live capital, leverage, shorting, portfolio-level
capital allocation across currencies, or automatic strategy rotation.
