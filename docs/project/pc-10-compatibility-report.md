# PC-10 Market State Product — Compatibility Report

**Package:** PC-10  
**Date:** 2026-08-15  
**Verdict:** Compatible. Additive product adapter. Qualification, Profile, and Trading Orchestrator remain unchanged.

---

## REST

| Contract                               | Compatibility                                                     |
| -------------------------------------- | ----------------------------------------------------------------- |
| New `/v1/market-states` product routes | **Additive** — sibling controller; domain `rest: false` unchanged |
| Market Qualification REST / ports      | **Unchanged**                                                     |
| Market Profile REST / ports            | **Unchanged**                                                     |
| Trading Orchestrator REST / ports      | **Unchanged**                                                     |

Missing `X-Workspace-Id` is 400. Foreign workspace is 403. Unknown target/version is 404.

## UI

| Surface                                          | Compatibility                |
| ------------------------------------------------ | ---------------------------- |
| `/market-state`                                  | **New** Market State product |
| Qualification / Profile / Orchestrator / Cluster | **Unchanged** consumers      |
| Research `/reports`                              | **Unchanged**                |

## Shell

Market State is added to Research nav. Live Bots, Production, and adapter Exchanges stay hidden.

## Downstream packages

- Wave C is **Closed**.
- Orchestrator continues to consume Market State via its existing adapter; it does not own State.

---

**End of Compatibility Report.**
