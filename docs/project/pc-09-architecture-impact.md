# PC-09 Market Profile Product — Architecture Impact

**Package:** PC-09  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Market Profile remains owner. Qualification unchanged. Market State unchanged. No new SoT. No new profile calculations.

---

## Frozen artifacts

| Artifact                        | Status after PC-09  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                                                     | Owner before            | Owner after                                          |
| ----------------------------------------------------------- | ----------------------- | ---------------------------------------------------- |
| Profile versions / latest / history / dimensions / metadata | Market Profile          | Market Profile                                       |
| Qualification runs that publish                             | Market Qualification    | Unchanged                                            |
| Market State                                                | Market State            | Unchanged                                            |
| HTTP / Profile UI                                           | Missing product adapter | Sibling `market-profile-product` + `/market-profile` |

HTTP is transport. UI is not SoT. Profile views do not become Qualification, Market State, Risk, or execution SoT.

---

## Ports

| Port                               | Before                                     | After                                                                                                  |
| ---------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `MarketProfileQueryPort`           | Active latest / by-version / list-versions | **Additive** `listWorkspaceProfiles` over existing store versions; HTTP queries in the product adapter |
| `MarketProfileServicePort`         | Active publish                             | **Unchanged** — publish is not on this REST                                                            |
| Persistence                        | Process-local in-memory store              | Unchanged (`persistence: false`)                                                                       |
| Domain REST                        | `rest: false`                              | Unchanged (`rest: false`)                                                                              |
| Qualification / Market State ports | Unchanged                                  | Unchanged                                                                                              |

---

## What was not changed

- Market Profile domain model, versioning, and calculation posture (still no scoring)
- Qualification
- Market State
- Spec, Authority Matrix, Alias Dictionary, RC history
- Domain `MARKET_PROFILE_PORTS_ACTIVE.rest` remains `false`

---

**End of Architecture Impact.**
