# PC-09 Market Profile Product — Compatibility Report

**Package:** PC-09  
**Date:** 2026-08-15  
**Verdict:** Compatible. Additive product adapter. Qualification and Market State remain unchanged.

---

## REST

| Contract                                 | Compatibility                                                     |
| ---------------------------------------- | ----------------------------------------------------------------- |
| New `/v1/market-profiles` product routes | **Additive** — sibling controller; domain `rest: false` unchanged |
| Market Qualification REST / ports        | **Unchanged**                                                     |
| Market State REST / ports                | **Unchanged**                                                     |
| PC-15 15-b complete-and-publish          | **Unchanged** — still calls owner ports, not this HTTP            |

Missing `X-Workspace-Id` is 400. Foreign workspace is 403. Unknown target/version is 404.

## UI

| Surface                                | Compatibility                            |
| -------------------------------------- | ---------------------------------------- |
| `/market-profile`                      | **New** Market Profile product           |
| Research `/reports`                    | **Unchanged** — not relabeled as Profile |
| Qualification / Orchestrator / Cluster | **Unchanged** consumers                  |

## Shell

Profile is added to Research nav. Live Bots, Production, and adapter Exchanges stay hidden.

## Downstream packages

- PC-10 Market State Product is next after review.
- Orchestrator continues to consume Profile; it does not own Profile.

---

**End of Compatibility Report.**
