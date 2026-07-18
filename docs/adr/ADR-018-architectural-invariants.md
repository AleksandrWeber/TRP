# ADR-018 — Architectural Invariants

Status: Accepted

Date: 2026-07-18

Scope: RC-16 Paper Trading Platform

---

## Context

RC-15 validation showed that local unit behavior is insufficient to prove
cross-module correctness. RC-16 adds continuous execution, durable events,
runtime recovery, and financial state. The rules below are immutable
architecture constraints, not implementation suggestions.

Changing any invariant requires a new superseding ADR.

---

## Decision

### Execution invariants

1. Strategy Runtime **MUST NOT** submit or cancel Orders directly.
2. Strategy Runtime **MUST** produce immutable, deduplicated Signal Intents.
3. Orders **MUST** be the only owner of the Order aggregate/state machine.
4. Execution Engine **MUST** be the single entry point to execution adapters.
5. Execution Engine **MUST NOT** create strategy decisions or Risk approvals.
6. Execution Engine **MUST NOT** update Positions, Ledger, or Portfolio.
7. Paper Execution Adapter **MUST NOT** mutate domain state.
8. Every executable Order **MUST** reference valid mandatory Risk approval.
9. Duplicate commands/events **MUST NOT** create duplicate Orders or Fills.
10. RC-16 **MUST NOT** submit real-capital orders.

### Event invariants

11. Every durable domain state change that publishes an event **MUST** write
    the Outbox event in the same transaction.
12. Every durable consumer **MUST** use Inbox idempotency.
13. Event delivery **MUST** be treated as at-least-once.
14. The architecture **MUST NOT** claim distributed exactly-once delivery.
15. Ordering **MUST** be defined per aggregate/stream, never assumed globally.
16. Durable events **MUST** be immutable and schema-versioned.
17. Consumer progress **MUST** survive restart through durable checkpoints.
18. Failed delivery **MUST NOT** be silently acknowledged.

### Runtime invariants

19. Strategy Deployment configuration **MUST** be distinct from Trading
    Session runtime state.
20. At most one fenced runtime owner **MUST** control a Session.
21. A stale lease owner **MUST NOT** commit runtime work.
22. In-memory timers/queues **MUST NOT** be authoritative runtime state.
23. Recovery and reconciliation **MUST** complete before execution resumes.
24. A Session in `PAUSED`, `RECOVERING`, `STOPPING`, `STOPPED`, or `FAILED`
    **MUST NOT** create new execution.
25. Checkpoints **MUST** identify the last processed semantic market event.

### Accounting invariants

26. Fill processing **MUST** flow through Position accounting, Ledger, then
    Portfolio projection.
27. Ledger **MUST** be the only financial source of truth.
28. Fill and Ledger history **MUST** be append-only; corrections use
    compensating entries.
29. Position and Portfolio **MUST** be rebuildable projections.
30. Execution Engine **MUST NOT** update Positions.
31. Portfolio **MUST NOT** consume raw Market Data.
32. Portfolio **MUST** consume versioned Position valuation outputs.
33. Dashboard and reports **MUST NOT** recalculate authoritative accounting.
34. Financial values **MUST** use decimal-safe arithmetic and explicit
    instrument rounding.
35. A Fill **MUST** affect accounting at most once.
36. `cash + market value of open positions` **MUST** equal equity at a
    consistent checkpoint.
37. `realizedPnL + unrealizedPnL` **MUST** equal total PnL.
38. Position quantity **MUST** equal net applied Fill quantity.
39. Every Fill **MUST** reference one persisted Order.
40. Every Ledger entry **MUST** reference a durable cause.

### Risk and safety invariants

41. Risk **MUST** approve every executable Order.
42. Risk **MUST NOT** modify Portfolio, Ledger, Position, Fill, or Order
    history.
43. Risk **MUST** reject stale, incomplete, or unreconciled state.
44. Kill Switch state **MUST** be durable and survive restart.
45. An active Kill Switch **MUST** block new execution.
46. Risk Policy changes **MUST** be versioned and audited.
47. Deactivating a critical Kill Switch **MUST** require authorization and
    successful reconciliation.
48. Safety **MUST** override strategy output and profitability.

### Time and determinism invariants

49. Business calculations **MUST NEVER** depend on wall-clock execution time.
50. Operational metadata **MUST NEVER** change business semantics.
51. Exchange/domain timestamps **MUST** be distinct from received, processed,
    and recorded timestamps.
52. Replaying the same ordered semantic event stream with the same
    configuration **MUST** produce the same Orders, Fills, Positions, Ledger,
    Portfolio, and Risk outcomes.
53. Wall-clock time **MAY** control operational leases, retries, alerts, and
    telemetry only.

### Ownership and isolation invariants

54. Every trading aggregate **MUST** belong to a workspace.
55. No object from Workspace A **MAY** appear in Workspace B.
56. Modules **MUST NOT** access another module's persistence internals.
57. External provider payloads/credentials **MUST** remain inside adapters.
58. Dashboard **MUST** use public APIs/read models only.
59. Audit Records **MUST** include actor/workspace/correlation where applicable
    and **MUST NOT** expose secrets.
60. New execution paths, changed module ownership, or reversed dependencies
    **MUST** require a new ADR.

---

## Enforcement

These invariants require:

- architecture/dependency tests;
- state-machine tests;
- property/invariant tests;
- duplicate/reordered event tests;
- recorded-stream deterministic replay;
- transaction and failure-injection tests;
- restart/reconciliation tests;
- workspace/authorization tests;
- decimal accounting tests;
- release-validation evidence.

An implementation that passes local unit tests but violates an invariant is
not RC-16 compliant.

---

## Consequences

### Advantages

- The most important cross-module rules are reviewable and testable.
- Recovery and duplicate processing cannot be treated as optional polish.
- RC-15 determinism/accounting lessons become permanent constraints.

### Constraints

- User Stories must cite affected invariants.
- Architecture review must reject undocumented exceptions.
- Any change to these rules requires a superseding ADR and documentation sync.
