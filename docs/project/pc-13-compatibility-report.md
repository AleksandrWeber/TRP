# PC-13 Command Center Product — Compatibility Report

**Package:** PC-13  
**Date:** 2026-08-15  
**Verdict:** Additive Command Center UI and Session create/start transport. Orchestrator, Deployment, Runtime, and Trading Session domain unchanged.

---

## REST

| Endpoint                                            | Compatibility                                                 |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `GET /v1/trading-sessions`                          | Unchanged list (BotView)                                      |
| `GET /v1/trading-sessions/:id`                      | Additive health / runtime / deploymentReference fields        |
| `POST /v1/trading-sessions`                         | **New** transport for existing `TradingSessionService.create` |
| `POST /v1/trading-sessions/:id/start`               | **New** transport for existing `TradingSessionService.start`  |
| `POST /v1/trading-sessions/:id/pause\|resume\|stop` | Unchanged                                                     |
| `POST /v1/paper-accounts`                           | **New** transport for existing `PaperAccountService.create`   |
| `/v1/strategy-deployments`                          | Unchanged (PC-03)                                             |
| `/v1/orchestrations/*`                              | Unchanged (PC-11)                                             |
| `/v1/paper/sessions`                                | Unchanged sandbox                                             |

No new API version. No Orders path. `/production` remains retired. `/live/kill-switch` is not used by Command Center.

---

## Frontend compatibility

| Path                                  | Compatibility                                             |
| ------------------------------------- | --------------------------------------------------------- |
| `/command-center`                     | Same fleet workspace; Create paper bot CTA added          |
| `/command-center/new`                 | **New** wizard over Session/Deploy/Paper Account ports    |
| `/command-center/sessions/:sessionId` | **New** monitoring / details                              |
| `/trading/paper`                      | Unchanged sandbox                                         |
| `/deployments`                        | Unchanged bind owner                                      |
| `/orchestrator`                       | Unchanged coordination; Command Center links as reference |
| Operator Shell bands                  | Same Research / Paper trading / Administration frame      |
| Emergency Controls                    | Still hidden on the product page                          |

---

## Downstream

- Trading Session remains the Session owner.
- Orchestrator still does not create Sessions. PC-15 15-a remains the intent consumer.
- Deployment remains the bind workflow (PC-03).
- Runtime remains evaluation owner. Command Center only reads status.
- Exchange Scope product (PC-12) is not this package. Existing scope projections remain.

---

**End of Compatibility Report.**
