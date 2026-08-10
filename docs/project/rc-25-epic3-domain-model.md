# RC-25 Epic 3 — Market Qualification & Profile Domain Model

**Status:** Epic 3 approved — Epic 4 implemented (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Immutable domain entities only — no evaluation / scoring / profile generation  
**Parent:** [RC-25 Implementation Plan](./rc-25-implementation-plan.md) · [Epic Breakdown](./rc-25-epic-breakdown.md)  
**Contracts:** [Domain Model Contract](./rc-25-domain-model-contract.md) · [API Contract](./rc-25-api-contract.md)  
**Predecessor:** [Epic 2 LMD + Research Reads](./rc-25-epic2-live-market-data-research-read-integration.md) (**approved**)

---

## Implementation Report

### What shipped

**Market Qualification** (immutable create factories):

| Contract entity                  | Code                                                        |
| -------------------------------- | ----------------------------------------------------------- |
| QualificationTarget              | `createQualificationTarget`                                 |
| QualificationRun                 | `createQualificationRun`                                    |
| QualificationState (+ lifecycle) | `createQualificationState` / `transitionQualificationState` |
| MarketConfidence                 | `createMarketConfidence` (`forcesTrade: false`)             |
| MarketHealth                     | `createMarketHealth`                                        |

**Market Profile** (immutable create factories):

| Contract / task alias                                | Code                                         |
| ---------------------------------------------------- | -------------------------------------------- |
| MarketProfile / Profile Version                      | `createMarketProfile` (`forcesTrade: false`) |
| VolatilityProfile                                    | `createVolatilityProfile`                    |
| LiquidityProfile                                     | `createLiquidityProfile`                     |
| TrendProfile                                         | `createTrendProfile`                         |
| StructuralCharacteristics (Market Structure Profile) | `createStructuralCharacteristics`            |

Also:

- Shared catalogs + invariant helpers (statuses, regime labels, metric allowlists, forbidden shadow-finance keys)
- QualificationState allowed-transition map (Contract §6.1)
- Boundary owned-concerns expanded to include entity names
- No Nest providers for evaluation/publish ports; no persistence / REST / UI

### Modules touched

| Path                                                 | Change                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| `apps/api/src/modules/market-qualification/domain/*` | **New** domain shared + entities + specs                   |
| `apps/api/src/modules/market-profile/domain/*`       | **New** domain shared + dimensions + MarketProfile + specs |
| Boundary / barrel / README                           | Owned concerns + exports updated                           |

### Ports / APIs affected

| Port / surface                      | Status                      |
| ----------------------------------- | --------------------------- |
| Domain create factories             | **Active** (structure only) |
| Epic 2 observational read consumers | Unchanged                   |
| Qualification service / query ports | **Inactive**                |
| Profile service / query ports       | **Inactive**                |
| REST / persistence / queues         | **None**                    |

### Explicit out of scope (confirmed absent)

- Qualification algorithms / scoring / confidence calculation
- Profile generation / regime computation behaviour
- Persistence product / REST / UI
- Runtime Enforcement / Trading Session / Strategy Selection
- Reporting / AI changes

### Product alias mapping (Contract ↔ task examples)

| Task example                     | Canonical contract entity                 |
| -------------------------------- | ----------------------------------------- |
| Qualification State / Lifecycle  | `QualificationState` + transition helpers |
| Qualification Confidence         | `MarketConfidence`                        |
| Qualification Health             | `MarketHealth`                            |
| Market Profile / Profile Version | `MarketProfile` (`version` field)         |
| Market Structure Profile         | `StructuralCharacteristics`               |

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Entities already locked in RC-25 Domain Model Contract;
this epic materializes immutable domain factories only)

Canonical ownership changed:
None (Qualification owns state/confidence/health/lifecycle;
Profile owns versioned dimensions; execution SoT untouched)

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                          | Result                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| Spec v2.0 §5.3                   | **Compatible** — Qualification evaluates later; Profile describes later; models only now |
| Authority Matrix                 | **Compatible** — research SoT for profile/qualification artifacts; never force trades    |
| Alias Dictionary                 | **Compatible** — confidence input; no auto-spend / force choice                          |
| Domain Model Contract            | **Compatible** — fields, authority labels, lifecycle edges, dimensions                   |
| Live Market Data / Research      | **Untouched** (Epic 2 consumers unchanged)                                               |
| RC-24 Reporting / AI             | **Untouched**                                                                            |
| RC-23 Runtime Enforcement        | **Untouched**                                                                            |
| RC-22 Strategy Library           | **Untouched**                                                                            |
| No behavioural calculation logic | **PASS**                                                                                 |

### Architecture validation checklist

| Check                             | Result   |
| --------------------------------- | -------- |
| Spec v2.0 compatibility           | **PASS** |
| Authority Matrix compatibility    | **PASS** |
| Alias Dictionary compatibility    | **PASS** |
| Domain Model Contract fidelity    | **PASS** |
| Immutable entities                | **PASS** |
| Version immutability              | **PASS** |
| Lifecycle consistency             | **PASS** |
| Ownership boundaries preserved    | **PASS** |
| No evaluation / scoring behaviour | **PASS** |

---

## Tests Summary

| Suite                      | File                                                                    | Result        |
| -------------------------- | ----------------------------------------------------------------------- | ------------- |
| Qualification domain model | `market-qualification/domain/market-qualification-domain-model.spec.ts` | **PASS** (6)  |
| Profile domain model       | `market-profile/domain/market-profile-domain-model.spec.ts`             | **PASS** (5)  |
| Prior Epic 1–2 suites      | boundary / ports / Nest / direction                                     | **PASS** (29) |

**Gate:** `pnpm --filter api exec vitest run src/modules/market-qualification src/modules/market-profile` → **40/40 PASS**

Coverage intent:

- Immutable entities (Object.isFrozen; mutation throws)
- Ownership / authorityClass / forcesTrade invariants
- Version immutability (corrections = new MarketProfile version)
- Lifecycle transition allow/deny consistency
- No behavioural calculation / selection helpers on domain modules

---

## Documentation Update Summary

| Document                                                           | Update                                        |
| ------------------------------------------------------------------ | --------------------------------------------- |
| This Epic Report                                                   | **New**                                       |
| [Domain Model Contract](./rc-25-domain-model-contract.md)          | Status → Epic 3 entities implemented          |
| [RC-25 Epic Breakdown](./rc-25-epic-breakdown.md)                  | Epic 3 DoD checked                            |
| [RC-25 Implementation Plan](./rc-25-implementation-plan.md)        | Status → Epic 3 implemented (awaiting review) |
| `docs/README.md` / status / roadmap / release history / v2 roadmap | Epic 3 pointer                                |
| Module READMEs                                                     | Epic 3 surfaces                               |

---

## Epic 3 Definition of Done

- [x] Domain entities match Domain Model contract (fields, immutability, authority class).
- [x] QualificationState lifecycle transitions documented and tested (allowed edges only).
- [x] MarketProfile versions are immutable after publish; corrections = new version.
- [x] Profile dimensions include volatility, liquidity, trend, structural characteristics.
- [x] Venue/market keying required (`exchangeScopeId` + market identity).
- [x] No Orders / Risk / Session / Library / Enforcement mutation APIs introduced.
- [x] Unit tests for forbidden force-trade / envelope-expansion helpers absent.
- [x] Compiles and passes tests independently of live exchange network.

**STOP:** Epic 3 complete for review. Do not start Epic 4 until approved.
