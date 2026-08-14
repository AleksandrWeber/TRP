# RC-27 Epic 4 — Trading Path Scope Integration

**Status:** Epic 4 **approved**  
**Date:** 2026-08-14  
**Nature:** Exchange Scope identity propagation through the trading path only — no business-rule changes, no Runtime redesign, no routing / adapters / REST product  
**Parent:** [RC-27 Implementation Plan](./rc-27-implementation-plan.md) · [Epic Breakdown](./rc-27-epic-breakdown.md)  
**Contracts:** [API Contract](./rc-27-api-contract.md) · [Domain Model Contract](./rc-27-domain-model-contract.md)  
**Predecessor:** [Epic 3 Application Ports](./rc-27-epic3-application-ports.md) (**approved**)

## Implementation Report

### What shipped

- Shared helpers: `assertSameExchangeScope` / `sameExchangeScope` (`exchange-scope/domain/trading-path-scope.ts`)
- Required `exchangeScopeId` (optional create input → `resolveExchangeScopeId`, default Binance) on:
  - Order Intent (operational; **excluded** from `intentHash`)
  - Paper Fill
  - Position / Position Valuation / Portfolio Projection
  - Ledger Transaction / Ledger Account Summary
  - Strategy Deployment (**excluded** from `configurationHash`)
  - Runtime Context / Signal Intent (**excluded** from Signal `intentHash`)
  - Knowledge Lake `AnalyticalFact` / Reporting `ReportRun` (default when omitted)
- Propagation wiring:
  - Orders: Session/Account scope alignment before propose; intent inherits Session scope
  - Execution: Fill inherits Order scope
  - Positions: Position inherits Fill; cross-scope apply rejected
  - Ledger: Account / Fill scope on create paths
  - Runtime: Session passes scope into `loadContext`; Deployment alignment asserted
  - Signal Intent: inherits Deployment scope on evaluation emit
- Additive Prisma columns + migration `20260814120000_rc27_epic4_trading_path_scope_identity` (default `exchange-scope:binance`)

### Modules touched (identity / mapping only)

| Domain / path                  | Change                                            |
| ------------------------------ | ------------------------------------------------- |
| `orders`                       | Intent field + service alignment + Prisma column  |
| `execution-engine`             | Fill field + envelope + Prisma column             |
| `positions`                    | Position / valuation / portfolio + Prisma columns |
| `ledger`                       | Transaction / summary + Prisma column             |
| `strategy-deployment`          | Deployment field + Prisma column                  |
| `strategy-runtime`             | RuntimeContext / SignalIntent + Prisma column     |
| `trading-session`              | Pass Session scope into Runtime `loadContext`     |
| `knowledge-lake` / `reporting` | Default Binance on admit / ReportRun              |
| `exchange-scope`               | Trading-path alignment helpers + Epic 4 tests     |

### Explicit out of scope (confirmed absent)

- Multi-runtime / exchange selection / routing engine
- Exchange adapters / Execution algorithm changes
- REST redesign / persistence architecture redesign (additive columns only)
- Cloned Orders / Execution / Accounting / Risk / Library / Gate
- Epic 5 consumer-read expansion beyond existing port

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Exchange Scope remains contextual isolation metadata — Spec §5.10)

Canonical ownership changed:
None
(Session / Orders / Execution / Accounting / Runtime / Library / Gate SoT unchanged)

New runtime:
None

Backward compatibility:
Single-scope Binance default — intentHash / configurationHash / signal intentHash unchanged
(scope excluded from semantic hashes)

Architecture debt introduced:
None intentional (multi-scope semantic keying of order identity deferred; account/session linkage remains primary)
```

---

## Compatibility Report

| Surface                                             | Result                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| Spec v2.0 §5.10 / §11                               | **Compatible** — Scope is metadata; engines not cloned                 |
| Authority Matrix                                    | **Compatible** — Scope does not approve risk / submit orders / execute |
| Alias Dictionary                                    | **Compatible** — Cluster → Exchange Scope                              |
| Cluster Isolation Invariants                        | **Compatible** — cross-scope Position / Runtime alignment fail-closed  |
| RC-19 Binance default                               | **Preserved** — `resolveExchangeScopeId`                               |
| RC-19…RC-26 closed modules                          | **Compatible** — Library / Gate already accept scope keys              |
| Frozen paper path                                   | **Compatible** — single-scope behaviour identical                      |
| Duplicate Runtime / Orders / Execution / Accounting | **None**                                                               |

### Architecture validation checklist

| Check                                         | Result   |
| --------------------------------------------- | -------- |
| Spec v2.0 compatibility                       | **PASS** |
| Authority Matrix compatibility                | **PASS** |
| Alias Dictionary compatibility                | **PASS** |
| Scope propagation only (no ownership change)  | **PASS** |
| No multi-runtime / routing / adapters         | **PASS** |
| No duplicated Orders / Execution / Accounting | **PASS** |
| RC-19 default Binance                         | **PASS** |
| Semantic hashes unchanged for default Binance | **PASS** |

---

## Tests Summary

| Suite                         | File                                                    | Result       |
| ----------------------------- | ------------------------------------------------------- | ------------ |
| Scope propagation + isolation | `exchange-scope/trading-path-scope-propagation.spec.ts` | **PASS** (4) |
| Order Intent                  | `orders/domain/order-intent.spec.ts`                    | **PASS**     |
| Fill / Position / Portfolio   | `execution-engine` / `positions` domain specs           | **PASS**     |
| Deployment / Runtime / Signal | `strategy-deployment` / `strategy-runtime` domain specs | **PASS**     |
| Session Runtime wiring        | `trading-session/trading-session.service.spec.ts`       | **PASS**     |
| Exchange Scope module suite   | `exchange-scope/**` (incl. Epic 1–3)                    | **PASS**     |

**Gate (Epic 4 focus):**

```bash
pnpm --filter api exec vitest run \
  src/modules/exchange-scope/trading-path-scope-propagation.spec.ts \
  src/modules/orders/domain \
  src/modules/execution-engine/domain \
  src/modules/positions/domain \
  src/modules/ledger/domain \
  src/modules/strategy-deployment/domain \
  src/modules/strategy-runtime/domain \
  src/modules/trading-session/trading-session.service.spec.ts
```

→ **75/75 PASS**

Coverage intent:

- Default Binance on Order → Fill → Ledger → Deployment → Runtime → Signal
- Cross-scope Position apply rejected
- RuntimeContext rejects Session/Deployment scope mismatch
- No engine ownership / routing behaviour introduced

---

## Documentation Update Summary

| Document                                                            | Update                                        |
| ------------------------------------------------------------------- | --------------------------------------------- |
| This Epic Report                                                    | **New**                                       |
| [RC-27 Epic Breakdown](./rc-27-epic-breakdown.md)                   | Epic 4 DoD checked; status → Epic 4 review    |
| [RC-27 Implementation Plan](./rc-27-implementation-plan.md)         | Status → Epic 4 implemented (awaiting review) |
| `docs/README.md`                                                    | Index Epic 4                                  |
| `project-status.md` / `roadmap.md` / `v2-implementation-roadmap.md` | Epic 4 pointer                                |
| `release-history.md` / `CHANGELOG.md`                               | Epic 4 entry                                  |

---

## Epic 4 Definition of Done

- [x] Trading-path artifacts carry Exchange Scope identity where appropriate
- [x] Scope is contextual metadata only (no routing / ownership)
- [x] RC-19 Binance remains default; single-scope behaviour identical
- [x] Isolation tests for cross-scope Position / Runtime alignment
- [x] No duplicated Runtime / Orders / Execution / Accounting
- [x] No REST / multi-runtime / exchange adapters
- [x] Deliverables: Implementation / Architecture Impact / Compatibility / Tests / Docs summaries

**STOP:** Epic 4 complete for review. Do not start Epic 5 until approved.
