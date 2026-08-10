# RC-22 Epic 1 — Strategy Library Boundary

**Status:** Implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** Additive certified-strategy SoT boundary only  
**Parent:** [RC-22 Implementation Plan](./rc-22-implementation-plan.md) · [Epic Breakdown](./rc-22-epic-breakdown.md)  
**Contracts:** [Domain Model](./rc-22-domain-model-contract.md) · [API Contract](./rc-22-api-contract.md)  
**Boundary diagram:** [rc-22-epic1-boundary-diagram.md](./rc-22-epic1-boundary-diagram.md)

---

## Implementation Report

### What shipped

- Nest module skeleton: `apps/api/src/modules/strategy-library/`
- Immutable boundary descriptor (`STRATEGY_LIBRARY_BOUNDARY`) declaring:
  - Authority class = `source_of_truth` (certified membership / envelopes / eligibility status)
  - Owned concerns: certified lifecycle, strategy versions, certification refs, eligibility refs, envelope binding refs
  - Classification vocabulary (research / experimental / certified / deprecated / archived)
  - Non-owned list (Research, registry, Paper, Session, Lake, Execution, Orchestrator, Market State, …)
  - Distinct-from list (`strategies`, `knowledge-lake`, `tactical-envelope`, `bot-facade`, Session, Deployment)
  - Forbidden capabilities (no execute / no Lake-as-eligibility / no auto-certify / no Orchestrator)
  - Epic 1 inactive ports: registration / certification / lookup / eligibility / lifecycle / persistence / strategyModel = `false`
  - Knowledge Lake role = `projection-consumer-only`
- Injectable `StrategyLibraryBoundaryService` (read-only boundary access)
- `StrategyLibraryModule` registered in `AppModule` beside — not replacing — `StrategiesModule` or `KnowledgeLakeModule`
- Module README documenting ownership and non-goals
- Unit + Nest skeleton tests
- Boundary diagram document

### Modules touched

| Path                                       | Change                         |
| ------------------------------------------ | ------------------------------ |
| `apps/api/src/modules/strategy-library/**` | **New** boundary module        |
| `apps/api/src/app.module.ts`               | Import `StrategyLibraryModule` |

### Ports / APIs affected

**None.** No registration, certification, lookup, eligibility, lifecycle, REST, or persistence.

### Explicit out of scope (confirmed absent)

- Strategy / Version entities
- Certification implementation
- Eligibility implementation
- Envelope implementation
- Research module modifications
- Knowledge Lake modifications
- Trading Orchestrator / Market State
- UI / REST / persistence
- Paper Trading / Session / Execution changes

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Strategy Library already existed in Spec v2.0 §5.2; this epic only materializes the SoT boundary skeleton)

Canonical ownership changed:
None (ownership declared in code invariants; no fact families moved yet)

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                            | Result                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------ |
| Existing APIs / ports              | **Unchanged** — no HTTP or application command ports added               |
| Experimental `StrategiesModule`    | **Preserved** — registry remains experimental/config SoT                 |
| Knowledge Lake                     | **Untouched** — remains Projection; consumer-only toward Library         |
| Trading Session lifecycle          | **Untouched**                                                            |
| Paper Trading                      | **Untouched**                                                            |
| Orders / Risk / Execution / Ledger | **Untouched** — listed as non-owned                                      |
| RC-19 Tactical Envelope stub       | **Untouched** — remains inactive; Library envelope binding is later Epic |
| Bot Facade                         | **Untouched** — not a Library                                            |
| Frozen paper path                  | **Compatible** — no path changes                                         |
| Duplicate runtime / Bot aggregate  | **None** — Alias Dictionary honored                                      |
| Migration / backfill               | **N/A** — no persistence                                                 |

### Architecture validation checklist

| Check                                      | Result   |
| ------------------------------------------ | -------- |
| No ownership conflicts introduced          | **PASS** |
| No duplicate runtime                       | **PASS** |
| No Source of Truth changes (fact movement) | **PASS** |
| Knowledge Lake remains consumer only       | **PASS** |

---

## Tests Summary

| Suite                | File                                                        | Result        |
| -------------------- | ----------------------------------------------------------- | ------------- |
| Boundary invariants  | `strategy-library/domain/strategy-library-boundary.spec.ts` | **PASS** (10) |
| Nest module skeleton | `strategy-library/strategy-library.module.spec.ts`          | **PASS** (1)  |

**Gate:** `pnpm --filter api exec vitest run src/modules/strategy-library` → **11/11 PASS**

Coverage intent:

- SoT authority for certified membership
- Owned concerns declared without entity implementation
- Classification + registry `active` ≠ certified
- Non-ownership of Research / Paper / Session / Lake / Execution / Orchestrator
- Distinct from registry, Lake, Bot facade, envelope stub
- Forbidden capabilities
- Epic 1 ports remain inactive
- Library wins membership conflicts; foreign owners win their domains
- Lake = projection-consumer-only

---

## Documentation Update Summary

| Document                                                    | Update                                            |
| ----------------------------------------------------------- | ------------------------------------------------- |
| This Epic Report                                            | **New**                                           |
| [Boundary Diagram](./rc-22-epic1-boundary-diagram.md)       | **New**                                           |
| [RC-22 Epic Breakdown](./rc-22-epic-breakdown.md)           | Epic 1 status + DoD checked                       |
| [RC-22 Implementation Plan](./rc-22-implementation-plan.md) | Status → Epic 1 in progress                       |
| `docs/README.md`                                            | Index Epic 1                                      |
| Module README                                               | `apps/api/src/modules/strategy-library/README.md` |

---

## Epic 1 Definition of Done

- [x] Module/boundary named and documented (canonical: Strategy Library — not “Bot library”).
- [x] Ownership table accepted: registry ≠ Library SoT; Lake ≠ Library SoT; Session ≠ certification authority.
- [x] Classification matrix published (research / experimental / certified / deprecated / archived).
- [x] Explicit: registry `active` ≠ certified.
- [x] Forbidden dependencies listed (no Orchestrator build, no Paper redesign, no Lake as eligibility SoT).
- [x] Architecture Impact: no new Spec concepts beyond §5.2 already approved.

**STOP:** Epic 1 complete for review. Do not start Epic 2 until approved.
