# RC-16 M2 Mini Validation Results (Epic E11)

Date: 2026-07-18

Status: Complete

Overall verdict: **PASS WITH MINOR RECOMMENDATIONS**

Stories: US179–US183

---

## Validation Results

| Story | Focus                                                              | Result                          |
| ----- | ------------------------------------------------------------------ | ------------------------------- |
| US179 | Contract, state-machine, paper-only, RBAC/workspace authorization  | PASS                            |
| US180 | PostgreSQL atomicity, concurrency, Outbox/Inbox, idempotency       | PASS                            |
| US181 | Deterministic Order/Fill/accounting replay and ADR-015 identities  | PASS                            |
| US182 | Failure injection, restart recovery, reconciliation fencing        | PASS                            |
| US183 | Performance baseline, architecture conformance, quality gates exit | PASS WITH MINOR RECOMMENDATIONS |

Suite path: `apps/api/src/validation/m2/`

Evidence files:

- `us179-contract-state-authorization.spec.ts`
- `us180-postgres-atomicity.integration.spec.ts`
- `us181-deterministic-accounting-replay.spec.ts`
- `us182-failure-reconciliation.integration.spec.ts`
- `us183-m2-baseline-release.spec.ts`
- `m2-architecture-conformance.ts`
- `m2-performance-baseline.ts`

---

## Performance Baseline

Deterministic paper Fill matching plus synthetic consumer lag and PostgreSQL
`SELECT 1` transaction samples. Measured locally against PostgreSQL at
`localhost` on 2026-07-18.

| Size            | Events | Duration   | Events/sec | Heap Δ   | Max consumer lag | Tx samples | Avg tx | p95 tx |
| --------------- | ------ | ---------- | ---------- | -------- | ---------------- | ---------- | ------ | ------ |
| small           | 100    | 10.864 ms  | 9,204      | 2.431 MB | 10.660 ms        | 5          | 6.830  | 15.883 |
| medium          | 1,000  | 42.956 ms  | 23,279     | ≤0 MB    | 7.871 ms         | 15         | 3.637  | 6.101  |
| practical_limit | 5,000  | 150.879 ms | 33,139     | 3.436 MB | 5.449 ms         | 30         | 2.567  | 3.839  |

Limits checked (US183):

- medium duration < 10s
- medium throughput > 500 events/sec
- practical heap Δ < 128 MB
- practical max consumer lag < 1,000 ms
- transaction p95 < 250 ms
- no abnormal memory or lag growth across sizes

---

## Architecture Conformance

- ADR-012…ADR-018 present
- Execution Adapter binding is structurally paper-only
- No production module outside Execution Engine calls the adapter boundary
- Runtime Outbox/Inbox/checkpoints use PostgreSQL repositories
- Portfolio consumes Ledger and Position valuation only
- M2 financial persistence uses Decimal, not Float
- Ledger persistence port is append/read-only
- Execution Engine checks durable reconciliation before submission
- Accounting API is membership-gated and GET-only

Minor recommendations (tracked in Technical Debt):

- TD-039 — exact-decimal mark source (M1 mark events still originate as numbers;
  M2 quantizes immediately at the valuation boundary)
- TD-040 — explicit per-Position Fill application order before concurrent M3
  strategy execution
- TD-041 — cursor-paginated Ledger history before operational history grows

---

## Quality Gates

- Lint: PASS
- Typecheck: PASS
- Build: PASS
- Format: PASS
- Epic E11 validation tests: PASS (14)
- Complete M2 validation suite (`src/validation/m2`): PASS (44)
- Full repository regression: PASS (855)

---

## M2 Exit

M2 — Durable Paper Order and Accounting Core is complete (US153–US183).

- Ledger remains the only financial source of truth
- Portfolio remains projection-only
- Deterministic rebuild and replay invariants pass
- No unresolved M2 blocker remains

Next milestone: M3 — Strategy Trading Sessions.
