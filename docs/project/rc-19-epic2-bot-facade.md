# RC-19 Epic 2 — Bot Facade

**Status:** Implemented  
**Date:** 2026-08-10  
**Canonical runtime:** Trading Session (ADR-014)  
**Product term:** Bot

---

## Principle

Bot is a **facade**, not a domain aggregate.

| Layer                         | Owner                    |
| ----------------------------- | ------------------------ |
| Product / UI language         | **Bot**                  |
| Canonical runtime SoT         | **Trading Session**      |
| Persistence                   | `trading_sessions` only  |
| Lifecycle / leases / recovery | Trading Session services |

There is no `bots` table, no Bot state machine, and no second runtime.

---

## Mapping

| Product     | Canonical                                                    |
| ----------- | ------------------------------------------------------------ |
| Bot         | Trading Session                                              |
| Bot id      | Trading Session id (identical)                               |
| Bot State   | Trading Session status                                       |
| Bot Status  | Trading Session runtime status (same field)                  |
| Bot Mission | Strategy Deployment id bound on the Session (`deploymentId`) |

Implemented in `apps/api/src/modules/bot-facade/`.

---

## Public interface (`BotFacadeService`)

| Method                       | Delegates to                                               |
| ---------------------------- | ---------------------------------------------------------- |
| `listBots(workspaceId)`      | `TradingSessionRepository.findByWorkspaceId` → `toBotView` |
| `getBot(workspaceId, botId)` | `TradingSessionService.get`                                |
| `pauseBot`                   | `TradingSessionService.pause` (`sessionId = botId`)        |
| `resumeBot`                  | `TradingSessionService.resume`                             |
| `stopBot`                    | `TradingSessionService.stop`                               |
| `deleteBot`                  | `stopBot` (no row deletion; history preserved)             |

REST paths remain canonical (`trading-session`). Bot Facade is the application interface for future UI / product APIs. Alias Dictionary forbids treating `/bots` as a new aggregate resource.

---

## Compatibility

- Existing `TradingSessionService` APIs unchanged.
- No data migration.
- Epic 1 `exchangeScopeId` is projected onto `BotView`.

---

## Out of scope (unchanged)

Fleet management, Command Center, Orchestrator, Strategy Library, multi-exchange, Mission scheduler.

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Bot already existed in Spec / Alias Dictionary as product term; this epic only added a facade)

Canonical ownership changed:
None

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```
