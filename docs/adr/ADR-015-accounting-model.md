# ADR-015 — Accounting Model

Status: Accepted

Date: 2026-07-18

Scope: RC-16 Paper Trading Platform

---

## Context

RC-15 Validation Sprint V1 found that position market value had been stored
under the name `unrealizedPnL`, causing a broken PnL identity. The corrected
simulation model now distinguishes market value from classic unrealized PnL.

Paper trading adds durable Orders, Fills, cash reservations, fees, Positions,
and restart recovery. Financial state must be reconstructable and must not
depend on mutable snapshots or floating-point coincidence.

---

## Decision

### Frozen accounting direction

```text
Fill
  ↓
Position accounting transition
  ↓
Ledger entries
  ↓
Portfolio projection
```

Each Fill is applied exactly once through ADR-013 Inbox idempotency.

### Source facts and source of truth

- **Fill** is the immutable execution fact: what quantity executed, at what
  price, side, fee, instrument, Order, Session, workspace, and domain time.
- **Ledger** is the only financial source of truth for cash, reservations,
  fees, and realized financial movements.
- **Position** is a durable projection derived from applied Fills and its
  accounting transition.
- **Portfolio** is a durable projection derived from Ledger balances and
  Position valuation outputs.
- Snapshots, dashboard values, reports, and metrics are projections; they are
  never financial sources of truth.

### Atomic Fill application

Applying a Fill commits one accounting transaction containing:

- Inbox deduplication for the Fill event;
- Position transition/version;
- balanced Ledger entries;
- resulting Outbox events;
- projection checkpoint.

If the transaction fails, none of those changes are committed.

### Decimal arithmetic

Financial amounts and quantities use decimal-safe arithmetic and database
decimal types.

The architecture forbids binary floating-point as the persisted or canonical
representation of:

- price;
- quantity;
- notional;
- fee;
- cash;
- PnL;
- equity;
- exposure.

Instrument metadata defines quantity scale, price scale, minimum quantity,
minimum notional, and rounding mode. Rounding occurs at explicit boundaries
and is recorded in the Fill/accounting context.

### Ledger model

The Ledger is append-only. Corrections use compensating entries, never mutation
or deletion of historical financial entries.

Minimum account categories:

- available paper cash;
- reserved paper cash;
- position cost;
- fees;
- realized PnL;
- adjustment/compensation with mandatory reason.

Every Ledger transaction:

- belongs to one workspace and paper account;
- references its cause (Fill, reservation, cancellation, or compensation);
- has a stable idempotency key;
- balances according to the configured ledger model;
- records domain and operational timestamps separately.

### Position model

Position state includes:

- instrument;
- side (RC-16: flat or long);
- quantity;
- average entry price;
- cost basis;
- realized PnL;
- last applied Fill sequence/version.

Position quantity equals net applied Fill quantity. Closing quantity cannot
exceed the open quantity.

### Valuation

Positions may consume normalized mark-price events through a dedicated
Position Valuation boundary.

Position Valuation emits a versioned valuation projection containing:

- mark price and market event identity;
- market value;
- unrealized PnL;
- valuation domain timestamp.

Portfolio consumes Position valuation outputs, not raw Market Data.

Market valuation does not rewrite historical Ledger entries.

### Portfolio model

Portfolio aggregates:

- Ledger cash balances;
- open Position market values;
- realized PnL;
- unrealized PnL;
- fees;
- reservations;
- exposure.

Portfolio is versioned and rebuildable. Dashboard and Risk consume a
checkpointed Portfolio projection and must know its freshness/version.

### Accounting invariants

For every consistent accounting checkpoint:

1. `cash + market value of open positions = equity`
2. `realizedPnL + unrealizedPnL = totalPnL`
3. `initialCapital + totalPnL - externalAdjustments = equity`
4. Position quantity equals net applied Fill quantity.
5. Applied Fill quantity never exceeds Order quantity.
6. Available and reserved cash cannot become negative unless an explicit
   future margin ADR permits it.
7. Every Fill references one Order.
8. Every Ledger entry references a durable cause.
9. A Fill affects accounting at most once.
10. Portfolio values are reproducible from Ledger, Positions, and valuation
    checkpoints.

### Operational metadata

Execution duration, processing time, correlation IDs, and runtime owner do not
change accounting results.

Business calculations use Fill price/quantity/fee and domain market
timestamps—not wall-clock processing duration.

### Rebuild and reconciliation

Position and Portfolio projections can be rebuilt from immutable Fills, Ledger,
and valuation checkpoints.

A mismatch:

- blocks new execution for the affected account/session;
- creates an Incident;
- requires reconciliation or compensating entries;
- is never repaired by silently overwriting Ledger history.

---

## Consequences

### Advantages

- Financial state is auditable and reproducible.
- Projection corruption can be repaired without inventing new facts.
- Decimal arithmetic prevents floating-point drift.
- RC-15 invariants carry into the live paper runtime.

### Constraints

- Existing `Float`-based production persistence is not the frozen RC-16
  accounting model.
- Positions and Portfolio cannot be updated directly by the Execution Engine.
- Reports and Dashboard cannot recalculate or mutate financial state.
- All accounting changes require invariant and replay tests.

### Follow-up

A new ADR is required before adding short positions, leverage, margin,
multi-currency accounting, external deposits/withdrawals, or real capital.
