# RC-25 Epic 4 — Market Qualification Lifecycle & Application Ports

**Status:** Epic 4 approved — Epic 5 implemented (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Qualification workflow lifecycle + application ports only — no scoring / confidence algorithms / profile generation / REST / persistence product  
**Parent:** [RC-25 Implementation Plan](./rc-25-implementation-plan.md) · [Epic Breakdown](./rc-25-epic-breakdown.md)  
**Contracts:** [API Contract](./rc-25-api-contract.md) §§4–5 · [Domain Model Contract](./rc-25-domain-model-contract.md)  
**Predecessor:** [Epic 3 Domain Model](./rc-25-epic3-domain-model.md) (**approved**)  
**Successor:** Epic 5 — Market Profile versioning (do not start until Epic 4 approved)

---

## Implementation Report

### What shipped

- `MarketQualificationLifecycleService` (`MarketQualificationServicePort`):
  - `requestQualificationRun` — creates immutable `QualificationRun` (`requested`); moves eligible states to `pending_confirm` (from `qualified`, state stays until confirm)
  - `confirmQualificationRun` — heavy-work gate; run → `running`; state → `qualifying`
  - `cancelQualificationRun` / `failQualificationRun` / `completeQualificationRun`
  - Optional **caller-supplied** confidence/health on complete (domain factory validation only — never calculated)
- `MarketQualificationQueryService` (`MarketQualificationQueryPort`):
  - target / state / confidence / health / list runs / get run
  - All views carry `forcesTrade: false` and `authorizesSession: false`
- Process-local `InMemoryQualificationStore` (not a persistence product)
- Deterministic id helpers (`deriveQualificationTargetId`, `deriveQualificationRunId`)
- Nest wiring: `MARKET_QUALIFICATION_SERVICE_PORT` / `MARKET_QUALIFICATION_QUERY_PORT` active
- Boundary posture: `marketQualificationService` + `marketQualificationQuery` = `true`

### Modules touched

| Path                                                             | Change                                   |
| ---------------------------------------------------------------- | ---------------------------------------- |
| `market-qualification/ports/market-qualification.port.ts`        | Full Epic 4 port contracts; ports active |
| `market-qualification/adapters/in-memory-qualification-store.ts` | **New** process-local artifact store     |
| `market-qualification/lifecycle/derive-qualification-ids.ts`     | **New** stable ids                       |
| `market-qualification/market-qualification-lifecycle.service.ts` | **New** lifecycle service                |
| `market-qualification/market-qualification-query.service.ts`     | **New** query service                    |
| `market-qualification/market-qualification.module.ts`            | Wire service + query ports               |
| `market-qualification/domain/market-qualification-boundary.ts`   | Activate lifecycle ports                 |

### Ports / APIs affected

| Port / surface                            | Status                                     |
| ----------------------------------------- | ------------------------------------------ |
| `MarketQualificationServicePort`          | **Active**                                 |
| `MarketQualificationQueryPort`            | **Active**                                 |
| Live Market Data / Research consumers     | Active (unchanged; input counts/refs only) |
| Market Profile service / query            | Deferred to Epic 5                         |
| REST / UI / persistence product / scoring | **None**                                   |

### Explicit out of scope (confirmed absent)

- Market scoring / confidence calculation algorithms
- Profile generation / publish
- Runtime Enforcement / Trading Session / Strategy Library integration
- Reporting / AI changes
- Durable persistence schema / REST controllers

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Lifecycle + ports already locked in Spec §5.3 + RC-25 API Contract;
this epic activates Nest application ports over approved domain + observational reads)

Canonical ownership changed:
None (Qualification owns lifecycle state; Profile versions remain Profile-owned)

New runtime:
None (no schedulers / transport / evaluation engines)

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                              | Result                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Spec v2.0 §5.3 / §6                  | **Compatible** — Qualification manages research lifecycle; never executes  |
| Authority Matrix                     | **Compatible** — artifacts remain `research_artifact`; never financial SoT |
| Alias Dictionary                     | **Compatible** — Market Qualification = pipeline; Profile distinct         |
| RC-25 Domain Model                   | **Compatible** — immutable factories + allowed transitions preserved       |
| Live Market Data / Lake              | **Preserved** — read-only consumers; input refs only                       |
| Runtime / Library / Session / Orders | **Untouched** — not imported                                               |
| Market Profile                       | Deferred — Epic 5                                                          |
| Reporting / AI                       | **Untouched**                                                              |

### Architecture validation checklist

- [x] Qualification never authorizes trading / Sessions
- [x] Qualification never selects strategies
- [x] Heavy work requires explicit confirm
- [x] Lifecycle records immutable (status change = new frozen run snapshot)
- [x] Invalid transitions rejected
- [x] Dependency direction: LMD/Lake → Qualification; no reverse / Runtime edges

---

## Tests Summary

| Suite                                          | Focus                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `market-qualification-lifecycle.spec.ts`       | Happy path; confirm gate; cancel; fail; requalify; empty inputs; immutability; query flags |
| `market-qualification.port.spec.ts`            | Ports active posture; forbidden helpers absent                                             |
| `market-qualification.boundaries.spec.ts`      | Dependency direction; Nest wires lifecycle ports                                           |
| `market-qualification.module.spec.ts`          | Nest DI for service + query                                                                |
| `domain/market-qualification-boundary.spec.ts` | Boundary activePorts                                                                       |

**Result:** market-qualification **26/26 PASS** (market-profile regression **19/19 PASS**).

---

## Documentation Update Summary

| Document                                                           | Update                          |
| ------------------------------------------------------------------ | ------------------------------- |
| This report                                                        | **New**                         |
| [Epic Breakdown](./rc-25-epic-breakdown.md)                        | Epic 4 DoD checked              |
| [Implementation Plan](./rc-25-implementation-plan.md)              | Status → Epic 4 awaiting review |
| Module README                                                      | Epic 4 surfaces                 |
| `docs/README.md` / status / roadmap / release history / v2 roadmap | Epic 4 pointer                  |

---

## Epic 4 Definition of Done

- [x] `MarketQualificationServicePort` can request/confirm/cancel/complete/fail runs
- [x] Heavy runs require explicit confirmation (no silent auto-spend)
- [x] `MarketQualificationQueryPort` reads target/state/confidence/health/runs
- [x] Lifecycle updates QualificationState without touching Session / Enforcement / Library
- [x] Confidence/health optional caller-supplied only — never calculated; never Risk/Ledger
- [x] Tests: transitions, immutability, invalid protection, ports, dependency direction
- [x] No Orchestrator / live order path / scoring / profile publish / REST / persistence product

**STOP:** Epic 4 complete for review. Do not start Epic 5 until approved.
