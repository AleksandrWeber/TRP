# PC-03 Deployment Product — Architecture Impact

**Package:** PC-03  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Deployment remains workflow owner. Library remains sole Strategy SoT. Runtime remains sole validation authority. Trading Session unchanged. No new SoT. No new domain. No Deploy Engine.

---

## Frozen artifacts

| Artifact                        | Status after PC-03  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                                    | Owner before        | Owner after                              |
| ------------------------------------------ | ------------------- | ---------------------------------------- |
| Deployment configuration / approval        | Strategy Deployment | Strategy Deployment                      |
| PASS / FAIL (VALID / INVALID)              | Runtime Enforcement | Runtime Enforcement                      |
| Certified membership / envelope            | Strategy Library    | Strategy Library (Gate still reads only) |
| Session lifecycle                          | Trading Session     | Unchanged                                |
| Experimental registry CRUD (`/strategies`) | Strategies module   | Unchanged                                |

HTTP is transport. UI is not SoT. Optional `libraryEntryId` is an identity hint for the existing Gate. Deployment does not import Strategy Library.

---

## Ports

| Port                                              | Before                     | After                                                |
| ------------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| Strategy Deployment create / approve / get / list | Active REST                | **Active** — same owner + product view               |
| `RuntimeEnforcementPort.validateDeployment`       | Consumed on create/approve | Unchanged consumer                                   |
| `StrategyLibraryLookupPort`                       | Not imported by Deployment | **Still not imported** by Deployment                 |
| Trading Session start                             | Existing owner             | **Unchanged** — this package does not start sessions |

---

## What was not changed

- Deployment aggregate / draft → approved freeze / configuration hash
- Runtime Enforcement Gate sequence / reason catalog / fail-closed rules
- Library authority or SoT class
- Trading Session
- Orchestrator
- Spec, Authority Matrix, Alias Dictionary, RC history
- Automatic deployment / Deploy Engine / a second bind authority

---

**End of Architecture Impact.**
