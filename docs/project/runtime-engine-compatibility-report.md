# Runtime Engine Completion — Compatibility Report

**Document:** Runtime Engine Compatibility Report  
**Date:** 2026-08-16  
**Verdict:** Additive in-process wiring. Existing REST, UI routes, and owners remain compatible. Live capital remains unauthorized.

---

## REST

| Endpoint                                      | Compatibility                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Trading Session start / pause / resume / stop | Unchanged transport. Start now has a production outbox consumer that subscribes and later evaluates closed candles. |
| Live Market Data query                        | Unchanged. Ingest is not a new public resource.                                                                     |
| Reporting HTTP                                | Unchanged (query-only product transport).                                                                           |
| Notification HTTP                             | Unchanged.                                                                                                          |
| AI Analytics HTTP                             | Unchanged.                                                                                                          |
| Existing `/v1/*` product routes               | Unchanged. No new API version. No new resource.                                                                     |

`/production` remains retired.

---

## Frontend compatibility

| Path                             | Compatibility                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Command Center start dialog      | Copy updated: closed candles may create **paper** orders; does not authorize live capital.         |
| Create Bot wizard                | Copy updated: after start, paper runtime reacts to market events; does not authorize live trading. |
| Reporting / Notification / AI UI | Unchanged screens. They read the same owners after automatic post-fill invocation.                 |
| Operator Shell                   | Unchanged.                                                                                         |

---

## Downstream

- US223 candle → fill → accounting path is unchanged (`pipeline.run` semantics).
- Inbox assertions in US223 are workspace-scoped so parallel fill tests do not collide.
- Envelope adaptation remains unimplemented.
- Public WebSocket market feed remains opt-in (`LIVE_MARKET_WS_ENABLED=true`).
- Deprecated Signal Engine and Paper Trading Executor remain unmounted.

---

**End of Compatibility Report.**
