# RC-25 Epic 1 — Market Qualification & Market Profile Boundary

**Status:** Epic 1 implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** Additive Market Qualification + Market Profile bounded contexts only — no evaluation behaviour, no profile calculation, no Runtime integration  
**Parent:** [RC-25 Implementation Plan](./rc-25-implementation-plan.md) · [Epic Breakdown](./rc-25-epic-breakdown.md)  
**Contracts:** [API Contract](./rc-25-api-contract.md) · [Domain Model Contract](./rc-25-domain-model-contract.md)  
**Boundary diagram:** [rc-25-epic1-boundary-diagram.md](./rc-25-epic1-boundary-diagram.md)

## Implementation Report

### What shipped

- Nest module skeleton: `apps/api/src/modules/market-qualification/`
- Nest module skeleton: `apps/api/src/modules/market-profile/`
- Immutable boundary descriptors:
  - `MARKET_QUALIFICATION_BOUNDARY` — authority `research_artifact`; owns state / confidence / health / lifecycle; all ports inactive
  - `MARKET_PROFILE_BOUNDARY` — authority `research_artifact`; owns volatility / liquidity / trend / structure / versioning; all ports inactive
- Inactive application port declarations (Symbols + interfaces) — **no implementations, no Nest providers**
- Injectable `MarketQualificationBoundaryService` / `MarketProfileBoundaryService`
- Both modules registered in `AppModule` beside — not replacing — Reporting / Enforcement / Library / Live Market Data
- Dependency-direction tests (no Runtime / Library / Session / Orders / Execution imports; no reverse deps)
- Module READMEs documenting ownership and non-goals
- Unit + Nest skeleton tests
- Boundary diagram document

### Modules touched

| Path                                           | Change                                                     |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `apps/api/src/modules/market-qualification/**` | **New** Market Qualification boundary module               |
| `apps/api/src/modules/market-profile/**`       | **New** Market Profile boundary module                     |
| `apps/api/src/app.module.ts`                   | Import `MarketQualificationModule` + `MarketProfileModule` |

### Ports / APIs affected

**Declared inactive only.** No qualification runs, no profile publish, no Live Market Data consumption, no Research reads, no REST, no persistence, no queues.

| Token                               | Module               | Active? |
| ----------------------------------- | -------------------- | ------- |
| `MARKET_QUALIFICATION_SERVICE_PORT` | market-qualification | **No**  |
| `MARKET_QUALIFICATION_QUERY_PORT`   | market-qualification | **No**  |
| `LIVE_MARKET_DATA_READ_CONSUMER`    | market-qualification | **No**  |
| `RESEARCH_OUTPUT_READ_CONSUMER`     | market-qualification | **No**  |
| `MARKET_PROFILE_SERVICE_PORT`       | market-profile       | **No**  |
| `MARKET_PROFILE_QUERY_PORT`         | market-profile       | **No**  |

### Explicit out of scope (confirmed absent)

- Market evaluation / qualification run behaviour
- Profile calculation / dimension materialization
- Live Market Data integration (Epic 2)
- Domain entity factories (Epic 3)
- Active Qualification / Profile ports (Epics 4–5)
- Trading Orchestrator / Market State / Strategy Selection
- Runtime Enforcement / Strategy Library / Session / Orders / Execution wiring
- Reporting / AI redesign
- UI / REST / persistence

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Market Qualification + Market Profile materialize Spec v2.0 §5.3
as boundary skeletons — modules already on Spec / Integration Diagram;
Spec modules unchanged)

Canonical ownership changed:
None (ownership declared in code invariants; no fact families moved)

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                            | Result                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Spec v2.0 §5.3 / §5.17             | **Compatible** — Qualification evaluates; Profile describes; Live Market Data consume later |
| Authority Matrix                   | **Compatible** — research SoT for profile/qualification artifacts; never force trades       |
| Alias Dictionary                   | **Compatible** — user-triggered pipeline; confidence input; no auto-spend without confirm   |
| Existing APIs / ports              | **Unchanged** — no HTTP or active application command ports                                 |
| RC-24 Reporting / AI               | **Untouched** — future consumers only; no reverse dependency                                |
| RC-23 Runtime Enforcement          | **Untouched** — remains Gate; Qualification must not replace                                |
| RC-22 Strategy Library             | **Untouched** — remains certification/eligibility SoT                                       |
| Trading Session lifecycle          | **Untouched** — no Session interaction                                                      |
| Orders / Risk / Execution / Ledger | **Untouched** — listed as non-owned                                                         |
| Live Market Data                   | **Untouched** — consume later (Epic 2); no reverse dependency                               |
| Frozen paper path                  | **Compatible** — no path changes                                                            |
| Duplicate execution SoT            | **None**                                                                                    |
| Migration / backfill               | **N/A** — no persistence                                                                    |

### Architecture validation checklist

| Check                                                      | Result   |
| ---------------------------------------------------------- | -------- |
| Spec v2.0 compatibility                                    | **PASS** |
| Authority Matrix compatibility                             | **PASS** |
| Alias Dictionary compatibility                             | **PASS** |
| Qualification ownership preserved (evaluate only)          | **PASS** |
| Profile ownership preserved (describe only)                | **PASS** |
| No ownership conflicts introduced                          | **PASS** |
| No duplicate execution Source of Truth                     | **PASS** |
| No Runtime / Library / Session / Orders / Execution deps   | **PASS** |
| Qualification never selects / executes / commands Session  | **PASS** |
| Profile never forces trades / expands envelopes            | **PASS** |
| RC-24 Reporting / RC-23 Enforcement / RC-22 Library intact | **PASS** |

---

## Tests Summary

| Suite                        | File                                                                | Result       |
| ---------------------------- | ------------------------------------------------------------------- | ------------ |
| Qualification boundary       | `market-qualification/domain/market-qualification-boundary.spec.ts` | **PASS** (6) |
| Qualification inactive ports | `market-qualification/ports/market-qualification.port.spec.ts`      | **PASS** (2) |
| Qualification Nest skeleton  | `market-qualification/market-qualification.module.spec.ts`          | **PASS** (1) |
| Qualification dep direction  | `market-qualification/market-qualification.boundaries.spec.ts`      | **PASS** (3) |
| Profile boundary             | `market-profile/domain/market-profile-boundary.spec.ts`             | **PASS** (6) |
| Profile inactive ports       | `market-profile/ports/market-profile.port.spec.ts`                  | **PASS** (2) |
| Profile Nest skeleton        | `market-profile/market-profile.module.spec.ts`                      | **PASS** (1) |
| Profile dep direction        | `market-profile/market-profile.boundaries.spec.ts`                  | **PASS** (3) |

**Gate:** `pnpm --filter api exec vitest run src/modules/market-qualification src/modules/market-profile` → **24/24 PASS**

Coverage intent:

- `research_artifact` authority for both modules
- Owned concerns declared without evaluation / profile calculation
- Non-ownership of Runtime / Library / Session / Reporting / AI / Selection
- Forbidden capabilities including force-trade and envelope expansion
- Epic 1 ports remain inactive; port tokens not Nest-provided
- Dependency direction: no forbidden imports; no reverse deps from Enforcement / Library / Session / Reporting / Live Market Data

---

## Documentation Update Summary

| Document                                                            | Update                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------- |
| This Epic Report                                                    | **New**                                                       |
| [Boundary Diagram](./rc-25-epic1-boundary-diagram.md)               | **New**                                                       |
| [RC-25 Epic Breakdown](./rc-25-epic-breakdown.md)                   | Epic 1 status + DoD checked                                   |
| [RC-25 Implementation Plan](./rc-25-implementation-plan.md)         | Status → Epic 1 implemented (awaiting review)                 |
| Planning companions (API / Domain / Integration / …)                | Status note: package approved → Epic 1 done                   |
| `docs/README.md`                                                    | Index Epic 1                                                  |
| `project-status.md` / `roadmap.md` / `v2-implementation-roadmap.md` | Epic 1 pointer                                                |
| Module READMEs                                                      | `market-qualification/README.md` · `market-profile/README.md` |

---

## Epic 1 Definition of Done

- [x] Modules named and documented (canonical: **Market Qualification**, **Market Profile** — not Orchestrator, not Market State, not Enforcement, not Library).
- [x] Ownership table accepted: Qualification owns state/confidence/health/lifecycle; Profile owns versioned dimensions; execution SoT owners unchanged.
- [x] Explicit: Qualification evaluates; Profile describes; neither executes / selects / authorizes trading.
- [x] Explicit: no direct Session interaction; no Runtime Gate substitution; no Strategy Selection.
- [x] Forbidden dependencies listed (no Profile → force trade; no Qualification → Orders/Risk; no Profile → expand Envelope).
- [x] Boundary tests / invariants compile and pass.
- [x] Architecture Impact: no new Spec concepts beyond already approved §5.3 modules.

**STOP:** Epic 1 complete for review. Do not start Epic 2 until approved.
