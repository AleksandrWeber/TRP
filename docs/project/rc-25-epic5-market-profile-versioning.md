# RC-25 Epic 5 — Market Profile Versioning

**Status:** Epic 5 approved — Epic 6 implemented (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Immutable Market Profile version registry + publish/query ports — no calculation / scoring / REST / persistence product  
**Parent:** [RC-25 Implementation Plan](./rc-25-implementation-plan.md) · [Epic Breakdown](./rc-25-epic-breakdown.md)  
**Contracts:** [API Contract](./rc-25-api-contract.md) §§6–7 · [Domain Model Contract](./rc-25-domain-model-contract.md)  
**Predecessor:** [Epic 4 Qualification Lifecycle Ports](./rc-25-epic4-qualification-lifecycle-ports.md) (**approved**)  
**Successor:** Epic 6 — Consumer reads + authority close (do not start until Epic 5 approved)

---

## Implementation Report

### What shipped

- `MarketProfileVersion` — product alias for one immutable `MarketProfile` row
- `MarketProfileVersioningService` (`MarketProfileServicePort`):
  - `publishProfileVersion` — append-only; allocates next monotonic version
  - Requires **completed** Qualification run via `MARKET_QUALIFICATION_QUERY_PORT`
  - Caller-supplied dimension + confidence payloads only (domain factory validation — never calculated)
- `MarketProfileQueryService` (`MarketProfileQueryPort`):
  - `getLatestProfile` / `getProfileByVersion` / `listProfileVersions`
  - Views carry `forcesTrade: false` and `authorizesSession: false`
- Process-local `InMemoryMarketProfileStore` version registry (not a persistence product)
  - Rejects overwrite of `marketProfileId` or `(targetId, version)`
- Deterministic `deriveMarketProfileId`
- Nest wiring: `MARKET_PROFILE_SERVICE_PORT` / `MARKET_PROFILE_QUERY_PORT` active
- Boundary posture: `marketProfileService` + `marketProfileQuery` = `true`

### Modules touched

| Path                                                        | Change                                   |
| ----------------------------------------------------------- | ---------------------------------------- |
| `market-profile/ports/market-profile.port.ts`               | Full Epic 5 port contracts; ports active |
| `market-profile/domain/market-profile-version.ts`           | **New** version alias + ref helper       |
| `market-profile/versioning/derive-market-profile-ids.ts`    | **New** stable ids                       |
| `market-profile/adapters/in-memory-market-profile-store.ts` | **New** append-only version registry     |
| `market-profile/market-profile-versioning.service.ts`       | **New** publish service                  |
| `market-profile/market-profile-query.service.ts`            | **New** query service                    |
| `market-profile/market-profile.module.ts`                   | Wire service + query ports               |
| `market-profile/domain/market-profile-boundary.ts`          | Activate publish/query ports             |

### Ports / APIs affected

| Port / surface                                | Status                           |
| --------------------------------------------- | -------------------------------- |
| `MarketProfileServicePort`                    | **Active**                       |
| `MarketProfileQueryPort`                      | **Active**                       |
| Qualification Query Port (consume)            | Active — completed-run gate only |
| Observational input reads                     | Active (unchanged)               |
| REST / UI / persistence product / calculation | **None**                         |

### Explicit out of scope (confirmed absent)

- Volatility / liquidity / trend / structural calculation algorithms
- Qualification scoring / confidence calculation
- Runtime Enforcement / Trading Session / Strategy Library integration
- Reporting / AI changes
- Durable persistence schema / REST controllers
- Consumer Orchestrator read façade (Epic 6)

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Profile versioning already locked in Spec §5.3 + RC-25 API Contract;
this epic activates Nest application ports over approved domain + Qual query)

Canonical ownership changed:
None (Profile owns versions; Qualification owns lifecycle/confidence)

New runtime:
None (no schedulers / transport / calculation engines)

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                              | Result                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| Spec v2.0 §5.3 / §6                  | **Compatible** — Profiles describe; never execute / select / authorize       |
| Authority Matrix                     | **Compatible** — artifacts remain `research_artifact`; never financial SoT   |
| Alias Dictionary                     | **Compatible** — Profile Version ≡ MarketProfile row; Qualification distinct |
| Market Qualification                 | **Preserved** — Query Port consume only; no Qual ownership transfer          |
| Reporting                            | **Untouched** — no Reporting imports or API changes                          |
| Runtime / Library / Session / Orders | **Untouched** — not imported                                                 |
| Live Market Data                     | **Preserved** — Profile still reaches LMD only via Qualification             |

### Architecture validation checklist

- [x] Profiles never authorize trading / Sessions
- [x] Profiles never select strategies
- [x] Versions immutable; history queryable; no in-place updates
- [x] Publish gated on completed Qualification run
- [x] No calculation algorithms
- [x] Dependency direction: Qualification → Profile; no reverse / Runtime edges

---

## Tests Summary

| Suite                                    | Focus                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `market-profile-versioning.spec.ts`      | Publish history; latest/by-version; overwrite protection; completed-run gate |
| `market-profile.port.spec.ts`            | Ports active posture; forbidden helpers absent                               |
| `market-profile.boundaries.spec.ts`      | Dependency direction; Nest wires versioning ports                            |
| `market-profile.module.spec.ts`          | Nest DI for service + query                                                  |
| `domain/market-profile-boundary.spec.ts` | Boundary activePorts                                                         |

**Result:** market-profile + market-qualification **49/49 PASS**.

---

## Documentation Update Summary

| Document                                                           | Update                          |
| ------------------------------------------------------------------ | ------------------------------- |
| This report                                                        | **New**                         |
| [Epic Breakdown](./rc-25-epic-breakdown.md)                        | Epic 5 DoD checked              |
| [Implementation Plan](./rc-25-implementation-plan.md)              | Status → Epic 5 awaiting review |
| Module README                                                      | Epic 5 surfaces                 |
| `docs/README.md` / status / roadmap / release history / v2 roadmap | Epic 5 pointer                  |

---

## Epic 5 Definition of Done

- [x] Successful qualification may publish a new MarketProfile version (immutable)
- [x] Profile carries volatility / liquidity / trend / structural dimension payloads
- [x] `MarketProfileQueryPort` supports get-latest and get-by-version (+ list history)
- [x] Refreshing profile does not mutate prior versions; does not expand Tactical Envelope
- [x] Profile never exposes force-trade / select-strategy / authorize-session operations
- [x] Tests: immutability; venue keying; dimension presence; overwrite protection; dependency direction
- [x] No Multi-Exchange adapter work; no calculation / REST / persistence product

**STOP:** Epic 5 complete for review. Do not start Epic 6 until approved.
