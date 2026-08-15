# PC-12 Exchange Scope Product — Compatibility Report

**Package:** PC-12  
**Date:** 2026-08-15  
**Verdict:** Compatible. Additive product adapter. Existing default overview remains.

---

## REST

| Contract                                 | Compatibility                                                     |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `GET /v1/exchange-scopes/default`        | **Unchanged** — Bot Facade overview                               |
| New `/v1/exchange-scopes` product routes | **Additive** — sibling controller; domain `rest: false` unchanged |
| Runtime / Session / Deployment REST      | **Unchanged**                                                     |

Missing `X-Workspace-Id` is 400. Foreign workspace is 403. Unknown scope is 404.

## UI

| Surface                                    | Compatibility                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `/clusters`                                | **New** Cluster product                                                              |
| `/trading/exchanges`                       | **Unchanged** redirect out of the product path (adapter connect is not this package) |
| Command Center / Deployment / Orchestrator | **Unchanged** consumers; they still read existing scope identity                     |

## Shell

Cluster is added to Paper trading nav. Adapter Exchanges, Live Bots, and Production stay hidden.

## Downstream packages

- PC-08 Qualification Product is next after review.
- Command Center and Orchestrator continue to consume Exchange Scope projections; they do not own Cluster.

---

**End of Compatibility Report.**
