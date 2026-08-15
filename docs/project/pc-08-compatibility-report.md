# PC-08 Qualification Product — Compatibility Report

**Package:** PC-08  
**Date:** 2026-08-15  
**Verdict:** Compatible. Additive product adapter. Profile and Market State remain unchanged.

---

## REST

| Contract                               | Compatibility                                                     |
| -------------------------------------- | ----------------------------------------------------------------- |
| New `/v1/qualification` product routes | **Additive** — sibling controller; domain `rest: false` unchanged |
| Market Profile REST / ports            | **Unchanged**                                                     |
| Market State REST / ports              | **Unchanged**                                                     |
| PC-15 15-b complete-and-publish        | **Unchanged** — still calls owner ports, not this HTTP            |

Missing `X-Workspace-Id` is 400. Foreign workspace is 403. Unknown target/run is 404.

## UI

| Surface                | Compatibility                                  |
| ---------------------- | ---------------------------------------------- |
| `/qualification`       | **New** Qualification product                  |
| Research `/reports`    | **Unchanged** — not relabeled as Qualification |
| Orchestrator / Cluster | **Unchanged** consumers                        |

## Shell

Qualification is added to Research nav. Live Bots, Production, and adapter Exchanges stay hidden.

## Downstream packages

- PC-09 Market Profile Product is next after review.
- Orchestrator continues to consume Profile / State; it does not own Qualification.

---

**End of Compatibility Report.**
