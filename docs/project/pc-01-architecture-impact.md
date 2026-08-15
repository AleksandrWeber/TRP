# PC-01 Strategy Library Product — Architecture Impact

**Package:** PC-01  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Library ownership unchanged. No new SoT. No new domain.

---

## Frozen artifacts

| Artifact                        | Status after PC-01  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                                    | Owner before                          | Owner after       |
| ------------------------------------------ | ------------------------------------- | ----------------- |
| Certified strategy versions / membership   | Strategy Library                      | Strategy Library  |
| Tactical envelopes                         | Strategy Library                      | Strategy Library  |
| Eligibility decisions                      | Strategy Library                      | Strategy Library  |
| Lifecycle / deprecation / archive domain   | Strategy Library                      | Strategy Library  |
| Experimental registry CRUD (`/strategies`) | Strategies module (US005)             | Strategies module |
| Runtime Enforcement                        | Runtime Enforcement (validation only) | Unchanged         |
| Strategy Deployment                        | Strategy Deployment                   | Unchanged         |
| Workspace membership for HTTP access       | Workspace (`WorkspaceAccessService`)  | Workspace         |

HTTP is transport. UI is not SoT. Knowledge Lake is not Library.

---

## Ports

| Port                                                      | Before                | After                                   |
| --------------------------------------------------------- | --------------------- | --------------------------------------- |
| `StrategyLibraryLookupPort`                               | Active (RC-23)        | Active — now also HTTP                  |
| `StrategyLibraryEligibilityPort`                          | Active (RC-23)        | Active — now also HTTP                  |
| Registration / Certification / Lifecycle Nest write ports | Inactive              | **Inactive**                            |
| Persistence                                               | Process-local adapter | Process-local adapter (not a new store) |

`STRATEGY_LIBRARY_BOUNDARY.activePorts` is unchanged (lookup/eligibility true; lifecycle/persistence/write false).

---

## What was not changed

- Library authority or SoT class
- Runtime Enforcement (still validation only; no Gate product — PC-04)
- Certification product (PC-02)
- Deployment / Session
- Orchestrator
- `/v1/strategies` contract
- Spec, Authority Matrix, Alias Dictionary, RC history

---

**End of Architecture Impact.**
