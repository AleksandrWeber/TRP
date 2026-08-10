# RC-25 Epic 2 — Live Market Data & Research Read Integration

**Status:** Epic 2 implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** Additive read-only Live Market Data + approved Research consumption — no evaluation, no profile calculation  
**Parent:** [RC-25 Implementation Plan](./rc-25-implementation-plan.md) · [Epic Breakdown](./rc-25-epic-breakdown.md)  
**Contracts:** [API Contract](./rc-25-api-contract.md) §8 · [Domain Model Contract](./rc-25-domain-model-contract.md)  
**Predecessor:** [Epic 1 Boundary](./rc-25-epic1-market-qualification-profile-boundary.md) (**approved**)

---

## Implementation Report

### What shipped

- Immutable observational read models (Qualification):
  - `ConnectivityHealthView`, `MarketObservationSlice`, `ExchangeMetadataSlice`, `HistoricalCharacteristicSlice` (`authorityClass: observation`)
  - `ResearchOutputRef` (`authorityClass: research_artifact`)
- `LiveMarketDataReadAdapter` → `MarketDataQueryService` (snapshots / status / metadata)
- `ResearchOutputReadAdapter` → Knowledge Lake `Research` category (empty-safe approved refs)
- `MarketQualificationObservationalReadService` — thin read facade
- Nest wiring:
  - `MarketQualificationModule` imports `LiveMarketDataModule` + `KnowledgeLakeModule`
  - `LIVE_MARKET_DATA_READ_CONSUMER` / `RESEARCH_OUTPUT_READ_CONSUMER` active and exported
- Market Profile observational inputs (via Qualification only):
  - `MarketProfileObservationalReadService` — history / volatility / liquidity / trend / structure **inputs** (`scored: false`)
  - `MarketProfileModule` imports `MarketQualificationModule` (no direct LMD)
- Boundary / ports posture:
  - Qualification: `liveMarketDataConsumer` / `researchOutputConsumer` = `true`; evaluation ports remain `false`
  - Profile: `observationalInputReads` = `true`; publish/query remain `false`
- Dependency direction: `Live Market Data → Qualification → Profile` (no reverse imports)

### Modules touched

| Path                                           | Change                                                        |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `apps/api/src/modules/market-qualification/**` | Read models, adapters, observational facade, Nest wiring      |
| `apps/api/src/modules/market-profile/**`       | Input read models, observational facade, Nest wiring via Qual |
| `apps/api/src/app.module.ts`                   | Unchanged (modules already registered in Epic 1)              |

### Ports / APIs affected

| Port / surface                                              | Status                   |
| ----------------------------------------------------------- | ------------------------ |
| `LiveMarketDataReadPort` / `LIVE_MARKET_DATA_READ_CONSUMER` | **Active** (read)        |
| `ResearchOutputReadPort` / `RESEARCH_OUTPUT_READ_CONSUMER`  | **Active** (read)        |
| `MarketQualificationObservationalReadService`               | **Active** (read facade) |
| `MarketProfileObservationalReadService`                     | **Active** (input reads) |
| `MarketQualificationServicePort` / Query                    | **Inactive**             |
| `MarketProfileServicePort` / Query                          | **Inactive**             |
| REST / persistence / queues                                 | **None**                 |

### Explicit out of scope (confirmed absent)

- Qualification algorithms / scoring / confidence calculation
- Profile generation / dimension regime calculation
- Runtime Enforcement / Trading Session / Strategy Selection
- Reporting / AI changes
- REST / persistence product

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Live Market Data §5.17 and Research Lake projections already exist;
RC-25 API Contract §8 consumer ports activated as Nest read wiring)

Canonical ownership changed:
None (LMD remains observation authority; Research bodies remain Lab/Lake;
Qualification/Profile remain consumers for reads)

New runtime:
None (no evaluation jobs; no Session hooks)

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                                                     | Result                                                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Spec v2.0 §5.3 / §5.17                                      | **Compatible** — Qualification/Profile consume LMD; never force trades           |
| Authority Matrix                                            | **Compatible** — Profile/Qualification research artifacts; LMD owns observations |
| Alias Dictionary                                            | **Compatible** — confidence input later; no auto-spend / force choice            |
| Live Market Data                                            | **Preserved** — Query facade consumed; no ownership transfer; no reverse dep     |
| Research (Lake `Research`)                                  | **Preserved** — approved-read policy = Research category projections; empty-safe |
| RC-24 Reporting / AI                                        | **Untouched**                                                                    |
| RC-23 Runtime Enforcement                                   | **Untouched**                                                                    |
| RC-22 Strategy Library                                      | **Untouched**                                                                    |
| Trading Session / Orders / Execution                        | **Untouched**                                                                    |
| Reverse deps (LMD ← Qual, Qual ← Profile forbidden reverse) | **Absent**                                                                       |
| No business behaviour (evaluate / score / publish)          | **PASS**                                                                         |

### Architecture validation checklist

| Check                                 | Result   |
| ------------------------------------- | -------- |
| Spec v2.0 compatibility               | **PASS** |
| Authority Matrix compatibility        | **PASS** |
| Alias Dictionary compatibility        | **PASS** |
| LMD remains observation authority     | **PASS** |
| One-way LMD → Qualification → Profile | **PASS** |
| Immutable read models                 | **PASS** |
| Empty-source handling                 | **PASS** |
| No evaluation / profile calculation   | **PASS** |
| RC-24 Reporting untouched             | **PASS** |

---

## Tests Summary

| Suite                                 | File                                                                | Result       |
| ------------------------------------- | ------------------------------------------------------------------- | ------------ |
| Qualification boundary                | `market-qualification/domain/market-qualification-boundary.spec.ts` | **PASS** (6) |
| Qualification ports                   | `market-qualification/ports/market-qualification.port.spec.ts`      | **PASS** (2) |
| Qualification Nest + read integration | `market-qualification/market-qualification.module.spec.ts`          | **PASS** (4) |
| Qualification dep direction           | `market-qualification/market-qualification.boundaries.spec.ts`      | **PASS** (3) |
| Profile boundary                      | `market-profile/domain/market-profile-boundary.spec.ts`             | **PASS** (6) |
| Profile ports                         | `market-profile/ports/market-profile.port.spec.ts`                  | **PASS** (2) |
| Profile Nest + input reads            | `market-profile/market-profile.module.spec.ts`                      | **PASS** (3) |
| Profile dep direction                 | `market-profile/market-profile.boundaries.spec.ts`                  | **PASS** (3) |

**Gate:** `pnpm --filter api exec vitest run src/modules/market-qualification src/modules/market-profile` → **29/29 PASS**

Coverage intent:

- Successful LMD + Research read integration
- Immutable observational / input read models
- Empty-source handling (no invented observations)
- Dependency direction (no reverse; Profile has no direct LMD)
- No evaluation / scoring / profile publish behaviour

---

## Documentation Update Summary

| Document                                                                                   | Update                                        |
| ------------------------------------------------------------------------------------------ | --------------------------------------------- |
| This Epic Report                                                                           | **New**                                       |
| [RC-25 Epic Breakdown](./rc-25-epic-breakdown.md)                                          | Epic 2 DoD checked                            |
| [RC-25 Implementation Plan](./rc-25-implementation-plan.md)                                | Status → Epic 2 implemented (awaiting review) |
| Planning companions                                                                        | Status notes                                  |
| `docs/README.md`                                                                           | Index Epic 2                                  |
| `project-status.md` / `roadmap.md` / `v2-implementation-roadmap.md` / `release-history.md` | Epic 2 pointer                                |
| Module READMEs                                                                             | Qualification + Profile Epic 2 surfaces       |

---

## Epic 2 Definition of Done

- [x] Qualification reads market observations via `LiveMarketDataReadPort`.
- [x] Approved Research outputs readable via `ResearchOutputReadPort` (optional path; empty-safe).
- [x] Immutable observational read models (`authorityClass` preserved — provider payloads do not become domain truth).
- [x] Dependency injection wires consumer tokens → approved read adapters.
- [x] Empty / missing results handled; tenancy (`workspaceId`) and venue (`exchangeScopeId`) isolation respected.
- [x] No qualification run completion / profile publish / Session mutation in this epic.
- [x] Live Market Data never imports Qualification (dependency direction tests).
- [x] No Orchestrator / Market State / Enforcement / Library / Reporting changes.
- [x] Profile consumes via Qualification only (LMD → Qual → Profile).

**STOP:** Epic 2 complete for review. Do not start Epic 3 until approved.
