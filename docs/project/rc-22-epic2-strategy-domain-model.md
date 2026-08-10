# RC-22 Epic 2 — Strategy Domain Model

**Status:** Implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** Domain entities + value objects only  
**Parent:** [RC-22 Implementation Plan](./rc-22-implementation-plan.md) · [Epic Breakdown](./rc-22-epic-breakdown.md)  
**Contract:** [Domain Model Contract](./rc-22-domain-model-contract.md) §§4–5  
**Prior:** [Epic 1 Boundary](./rc-22-epic1-strategy-library-boundary.md) (**approved**)  
**Ownership table:** [rc-22-epic2-ownership-decision-table.md](./rc-22-epic2-ownership-decision-table.md)

---

## Implementation Report

### What shipped

- Domain entity `Strategy` (family) — `createStrategy`
- Domain entity `StrategyVersion` (immutable implementation) — `createStrategyVersion`
- Value objects: family/entry/version ids, `ContentHash`, `MarketDomain`, exchange scopes, timeframes, `InstrumentUniverse`
- Uniqueness helpers: `assertUniqueStrategyVersion`, `appendStrategyVersion` (`strategyFamilyId + version`)
- Explicit absence of certification state: `strategyHasCertificationState` / `strategyVersionHasCertificationState` → `false`
- Boundary `activePorts.strategyModel = true` (all business ports still `false`)
- Module exports updated; Nest wiring unchanged beyond boundary flag

### Modules touched

| Path                                                                        | Change                     |
| --------------------------------------------------------------------------- | -------------------------- |
| `apps/api/src/modules/strategy-library/domain/strategy.ts`                  | **New**                    |
| `apps/api/src/modules/strategy-library/domain/strategy-version.ts`          | **New**                    |
| `apps/api/src/modules/strategy-library/domain/value-objects.ts`             | **New**                    |
| `apps/api/src/modules/strategy-library/domain/strategy-version.spec.ts`     | **New**                    |
| `apps/api/src/modules/strategy-library/domain/strategy-library-boundary.ts` | `strategyModel: true`      |
| `apps/api/src/modules/strategy-library/index.ts`                            | Export domain model        |
| Boundary / module specs                                                     | Expect Epic 2 port posture |

### Ports / APIs affected

**None.** No registration, certification, lookup, eligibility, lifecycle, REST, or persistence.

### Explicit out of scope (confirmed absent)

- Certification entity / status
- Eligibility
- Registration workflow
- Lifecycle transitions (deprecate / archive)
- Envelope binding
- Query API
- Research / Knowledge Lake modifications

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Strategy / StrategyVersion already defined in Domain Model Contract; Epic 2 materializes domain types only)

Canonical ownership changed:
None
(Library remains declared SoT for future certified membership; no fact migration from registry)

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                             | Result                                           |
| ----------------------------------- | ------------------------------------------------ |
| Experimental `StrategiesModule`     | **Unchanged** — separate editable registry model |
| Knowledge Lake                      | **Unchanged**                                    |
| Trading Session / Paper / Execution | **Unchanged**                                    |
| Existing APIs                       | **Unchanged**                                    |
| Duplicate Research model            | **None** — Library Strategy ≠ registry Strategy  |
| Bot / second runtime                | **None**                                         |

### Architecture validation checklist

| Check                                                    | Result   |
| -------------------------------------------------------- | -------- |
| Ownership unchanged                                      | **PASS** |
| No duplicate model with Research registry                | **PASS** |
| No runtime introduced                                    | **PASS** |
| Library remains SoT for future certified strategies only | **PASS** |

---

## Domain Ownership Report

See [Ownership Decision Table](./rc-22-epic2-ownership-decision-table.md).

Summary:

| Entity                                            | Owner                 | Notes                                     |
| ------------------------------------------------- | --------------------- | ----------------------------------------- |
| Library `Strategy` (family)                       | **Strategy Library**  | Not certified by itself                   |
| Library `StrategyVersion`                         | **Strategy Library**  | Immutable content; certification deferred |
| Registry `Strategy` (`strategies`)                | Experimental registry | `active` ≠ certified                      |
| Certification / Evidence / Envelope / Eligibility | Library (later Epics) | **Not implemented** in Epic 2             |

---

## Tests Summary

| Suite                            | File                                       | Result        |
| -------------------------------- | ------------------------------------------ | ------------- |
| Strategy + StrategyVersion model | `domain/strategy-version.spec.ts`          | **PASS** (9)  |
| Boundary posture                 | `domain/strategy-library-boundary.spec.ts` | **PASS** (10) |
| Nest module                      | `strategy-library.module.spec.ts`          | **PASS** (1)  |

**Gate:** `pnpm --filter api exec vitest run src/modules/strategy-library` → **20/20 PASS**

Coverage intent:

- Strategy creation
- StrategyVersion creation
- Version immutability (frozen; no mutators; no certification fields)
- Multiple versions under one Strategy
- Uniqueness `strategyFamilyId + version`
- No certification state yet

---

## Documentation Update Summary

| Document                 | Update                                 |
| ------------------------ | -------------------------------------- |
| This Epic Report         | **New**                                |
| Ownership Decision Table | **New**                                |
| Domain Model Contract    | Epic 2 implementation status for §§4–5 |
| Epic Breakdown           | Epic 2 DoD checked                     |
| Implementation Plan      | Status → Epic 2                        |
| Module README            | Epic 2 model section                   |
| `docs/README.md`         | Index Epic 2                           |

---

## Epic 2 Definition of Done

- [x] Domain entities cover family identity, version, content hash, market/universe, exchange scopes, timeframes.
- [x] Uniqueness: `strategyFamilyId + version`; immutable `contentHash` (frozen at create; no mutators).
- [x] Persistence/port boundary owned by Library (no overload onto Session or Lake) — still no persistence product.
- [x] Unit tests for immutability invariants (no mutate-content APIs).
- [x] No change to Orders / Risk / Execution / Ledger / Recovery.

**STOP:** Epic 2 complete for review. Do not start Epic 3 until approved.
