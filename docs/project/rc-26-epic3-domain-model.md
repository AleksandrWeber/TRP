# RC-26 Epic 3 — Market State Domain Model & Lifecycle

**Status:** Epic 3 implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** Immutable Market State domain entities only — no classification algorithms, no orchestration, no Runtime / Session / persistence / REST  
**Parent:** [RC-26 Implementation Plan](./rc-26-implementation-plan.md) · [Epic Breakdown](./rc-26-epic-breakdown.md)  
**Contracts:** [Domain Model Contract](./rc-26-domain-model-contract.md) · [API Contract](./rc-26-api-contract.md)  
**Predecessor:** [Epic 2 Market State Input Integration](./rc-26-epic2-market-state-input-integration.md) (**approved**)

## Implementation Report

### What shipped

Immutable create / transition factories:

| Contract / task entity | Code                                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| MarketState            | `createMarketState` / `withMarketStateLifecycle` / `publishNextMarketState` |
| MarketStateVersion     | `createMarketStateVersion` + overwrite / monotonic guards                   |
| MarketStateLifecycle   | `createMarketStateLifecycle` / `transitionMarketStateLifecycle`             |
| MarketStateSnapshot    | `createMarketStateSnapshot` (`decidesTrade: false`)                         |
| MarketStateMetadata    | `createMarketStateMetadata` (opaque Qual/Profile refs)                      |

Lifecycle edges (manual immutable records only):

```text
created → active | archived
active → superseded | archived
superseded → archived
```

Versioning:

- Append-only; first version must be `1`
- Next version must be `max+1`
- Duplicate version numbers rejected
- Publishing a new active version supersedes the prior active copy (new immutable object)

Also:

- Shared catalogs (`MARKET_STATE_LIFECYCLE_STATUSES`, regime labels, transition map)
- Boundary owned-concerns expanded (`market-state-version`, snapshot, metadata)
- Domain Model Contract §§3–4 updated to Created/Active/Superseded/Archived + versioning
- Classify/query Nest ports remain **inactive** (no classification algorithms in this epic)
- Epic 2 observational reads unchanged

### Modules touched

| Path                                          | Change                                       |
| --------------------------------------------- | -------------------------------------------- |
| `apps/api/src/modules/market-state/domain/*`  | **New** domain shared + entities + specs     |
| Boundary / barrel / README                    | Owned concerns + exports updated             |
| `docs/project/rc-26-domain-model-contract.md` | Market State sections aligned to Epic 3 task |

### Ports / APIs affected

| Port / surface                      | Status                          |
| ----------------------------------- | ------------------------------- |
| Domain create / lifecycle factories | **Active** (structure only)     |
| Epic 2 observational read consumers | Unchanged                       |
| `MARKET_STATE_SERVICE_PORT`         | **Inactive** (no classify algo) |
| `MARKET_STATE_QUERY_PORT`           | **Inactive**                    |
| REST / persistence / queues         | **None**                        |

### Explicit out of scope (confirmed absent)

- Classification / scoring / regime-computation algorithms
- Automatic lifecycle generation
- Orchestration / strategy selection
- Runtime / Session / Orders / Risk integration
- Persistence product / REST / UI
- Trading Orchestrator domain (Epic 4)

### Product alias mapping

| Task example           | Canonical code entity  |
| ---------------------- | ---------------------- |
| Market State           | `MarketState`          |
| Market State Version   | `MarketStateVersion`   |
| Market State Lifecycle | `MarketStateLifecycle` |
| Market State Snapshot  | `MarketStateSnapshot`  |
| State metadata         | `MarketStateMetadata`  |

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Entities already locked under Spec §5.4 / Domain Model Contract;
this epic materializes immutable domain factories only.
Lifecycle vocabulary refined to Created/Active/Superseded/Archived
per Epic 3 task — still descriptive Market State, not a new Spec module.)

Canonical ownership changed:
None (Market State owns versions/lifecycle/snapshots;
Qualification / Profile / execution SoT untouched)

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                           | Result                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| Spec v2.0 §5.4                    | **Compatible** — Market State describes conditions; does not execute / approve risk |
| Authority Matrix                  | **Compatible** — `market_state_artifact`; never money/fills SoT                     |
| Alias Dictionary                  | **Compatible** — State ≠ Qualification; Profile remains confidence input            |
| RC-25 Qualification               | **Compatible** — opaque `confidenceRef` only; `isQualification: false`              |
| RC-25 Profile                     | **Compatible** — opaque `profileRef` only; `isProfile: false`                       |
| Epic 2 input reads                | **Untouched**                                                                       |
| Trading Orchestrator              | **Untouched**                                                                       |
| Runtime / Session / Orders / Risk | **Untouched** — `authorizesRuntime: false`                                          |
| Frozen paper path                 | **Compatible**                                                                      |
| Duplicate Qualification / Profile | **None**                                                                            |

### Architecture validation checklist

| Check                                       | Result   |
| ------------------------------------------- | -------- |
| Spec v2.0 compatibility                     | **PASS** |
| Authority Matrix compatibility              | **PASS** |
| Alias Dictionary compatibility              | **PASS** |
| Immutable entities + no overwrite           | **PASS** |
| Lifecycle edges enforced                    | **PASS** |
| Version history monotonic                   | **PASS** |
| No classification / orchestration behaviour | **PASS** |
| Market State ≠ Qualification / Profile      | **PASS** |
| No Runtime authorization                    | **PASS** |
| Dependency direction unchanged              | **PASS** |

---

## Tests Summary

| Suite                  | File                                           | Result       |
| ---------------------- | ---------------------------------------------- | ------------ |
| Domain model           | `domain/market-state-domain-model.spec.ts`     | **PASS** (8) |
| Boundary ownership     | `domain/market-state-boundary.spec.ts`         | **PASS** (6) |
| Input read models (E2) | `domain/market-state-input-read-model.spec.ts` | **PASS** (3) |
| Ports posture          | `ports/market-state.port.spec.ts`              | **PASS** (2) |
| Nest wiring (E2)       | `market-state.module.spec.ts`                  | **PASS** (3) |
| Dependency direction   | `market-state.boundaries.spec.ts`              | **PASS** (3) |

**Gate:** `pnpm --filter api exec vitest run src/modules/market-state` → **25/25 PASS**

Coverage intent:

- Frozen aggregates; `mutable: false`
- Lifecycle Created/Active/Superseded/Archived only
- `publishNextMarketState` supersedes prior active; rejects overwrite / non-monotonic versions
- Snapshot never `decidesTrade`; lifecycle never `authorizesRuntime`
- State ≠ Qualification / Profile flags
- Classify Nest ports still throw when unresolved

---

## Documentation Update Summary

| Document                                                          | Update                      |
| ----------------------------------------------------------------- | --------------------------- |
| This Epic Report                                                  | **New**                     |
| [Domain Model Contract](./rc-26-domain-model-contract.md)         | Market State §§3–4 refined  |
| [RC-26 Epic Breakdown](./rc-26-epic-breakdown.md)                 | Epic 3 DoD checked          |
| [RC-26 Implementation Plan](./rc-26-implementation-plan.md)       | Status → Epic 3 implemented |
| `docs/README.md` / status / roadmap / CHANGELOG / release-history | Epic 3 pointers             |
| Module README                                                     | Epic 3 posture              |

---

## Epic 3 Definition of Done

- [x] Domain entities match Domain Model contract (MarketState, Version, Lifecycle, Snapshot, Metadata).
- [x] Lifecycle transitions documented and tested (Created/Active/Superseded/Archived edges only).
- [x] Version history append-only with overwrite protection.
- [x] State is current-condition SoT for descriptive artifacts — never Qualification / Profile ownership.
- [x] No Orchestrator selection / Session / Orders / Risk Decision APIs introduced.
- [x] Unit tests prove State ≠ Qualification and State ≠ Profile.
- [x] No classification algorithms / automatic transitions.
- [x] Compiles and passes tests independently of live exchange network.
- [x] Classify/query application ports remain inactive (deferred until classification behaviour is approved).

**STOP:** Epic 3 complete for review. Do not start Epic 4 until approved.
