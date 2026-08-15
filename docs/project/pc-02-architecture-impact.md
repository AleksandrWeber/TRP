# PC-02 Certification Product — Architecture Impact

**Package:** PC-02  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Library ownership unchanged. No new SoT. No new domain. No new certification authority.

---

## Frozen artifacts

| Artifact                        | Status after PC-02  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                                    | Owner before                                            | Owner after                                                    |
| ------------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------------- |
| Certified strategy versions / membership   | Strategy Library                                        | Strategy Library                                               |
| Certification admit rules                  | Strategy Library domain (`createStrategyCertification`) | Unchanged — HTTP delegates                                     |
| Certification attempt history              | Not product-visible                                     | Same Library module (command log, not a second membership SoT) |
| Experimental registry CRUD (`/strategies`) | Strategies module (US005)                               | Strategies module (candidate source only)                      |
| Evidence bodies                            | Research Lab                                            | Research Lab (Library stores refs)                             |
| Runtime Enforcement                        | Runtime Enforcement (validation only)                   | Unchanged                                                      |
| Strategy Deployment                        | Strategy Deployment                                     | Unchanged                                                      |
| Trading Session                            | Trading Session                                         | Unchanged                                                      |

HTTP is transport. UI is not SoT. Certification never owns strategies. Knowledge Lake is not used to certify.

---

## Ports

| Port                                      | Before                                  | After                                              |
| ----------------------------------------- | --------------------------------------- | -------------------------------------------------- |
| `StrategyLibraryCertificationPort`        | Locked in RC-22 contract; Nest inactive | **Active** — Nest + HTTP                           |
| `StrategyLibraryLookupPort`               | Active (PC-01 HTTP)                     | Active — membership reflects certified admits      |
| `StrategyLibraryEligibilityPort`          | Active (PC-01 HTTP)                     | Active — eligibility evaluated on successful admit |
| Registration / Lifecycle Nest write ports | Inactive                                | **Inactive**                                       |
| Persistence                               | Process-local adapter                   | Process-local adapter (not a new store)            |

---

## What was not changed

- Library authority or SoT class
- Runtime Enforcement (still validation only; no Gate product — PC-04)
- Deployment / Session
- Orchestrator
- `/v1/strategies` contract
- Spec, Authority Matrix, Alias Dictionary, RC history
- Manual certification / Strategy Approval / a second certification engine

---

**End of Architecture Impact.**
