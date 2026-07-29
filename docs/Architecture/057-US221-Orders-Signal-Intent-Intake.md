# US221 — Orders Intake from Signal Intent

Status: Implemented  
Milestone: RC-16 M3 / Epic E16  
Scope: Orders consume immutable Signal Intent as the canonical strategy
input, propose strategy-origin Orders, and reject duplicate Signal Intent
processing. No Risk evaluation, Execution Engine, Fill, Portfolio, Position,
or Session lifecycle changes.

## Architecture

```text
Strategy Runtime
        ↓
SignalIntent (immutable fact)
        ↓
ORDER_PROPOSAL_PORT.proposeOrderFromSignalIntent
  ├─ NO_ACTION → null (no Order)
  └─ SIGNAL_INTENT
       ├─ mapProposeOrderFromSignalIntent (origin: strategy)
       ├─ immutable signalIntentId + signalIntentHash
       └─ OrderService.create → PROPOSED + Outbox
```

Module: `apps/api/src/modules/orders/`.

## Ownership (ADR-012 / ADR-017 / ADR-018 #1–3)

| Owner            | Owns                                                         | Does not own                                      |
| ---------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| Strategy Runtime | Signal Intent production / evaluation                        | Orders, Risk, Execution                           |
| Orders           | Intent → Order proposal, origin, idempotency, PROPOSED state | Runtime evaluation, Risk Decision, Execution path |

Strict one-way dependency: Runtime → SignalIntent → Orders. Orders never
imports Strategy Runtime services or evaluation.

## Intake contract

`ProposeOrderFromSignalIntentCommand`:

- `kind: 'NO_ACTION'` — returns `null`; no persistence
- `kind: 'SIGNAL_INTENT'` — requires `SignalIntentIntake` + paper account,
  fencing token, quantity, operational timestamps

Idempotency:

- `clientOrderId` = Signal Intent `id`
- `idempotencyKey` = `signal-intent:<intentHash>`
- Duplicate identical intake replays the existing Order
- Conflicting payload for the same Signal Intent identity is rejected

## Order Intent extensions

- `origin: 'manual' | 'strategy'`
- `signalIntentId` / `signalIntentHash` — required for strategy; forbidden for
  manual. Strategy semantic identity includes the Signal Intent reference;
  manual identity remains M2-compatible.

## API

| Method | Path / Port                                        | Role               | Behavior                    |
| ------ | -------------------------------------------------- | ------------------ | --------------------------- |
| —      | `ORDER_PROPOSAL_PORT.proposeOrderFromSignalIntent` | internal only      | Propose or NO_ACTION no-op  |
| POST   | `/v1/orders`                                       | manual (unchanged) | Still `origin: manual` only |

No public HTTP endpoint creates strategy-origin Orders in US221.
Risk + Execution for strategy-origin Orders is US222
(`canonical-order-path/`).

## Preserved boundaries

Forbidden: Orders → Strategy Runtime evaluation, Risk evaluation **in the
intake mapper**, Execution Engine submit from intake, Fill, Portfolio/Position
updates, Session lifecycle mutation.

Enforced by `orders.boundaries.spec.ts`. Runtime boundaries continue to forbid
Orders imports.
