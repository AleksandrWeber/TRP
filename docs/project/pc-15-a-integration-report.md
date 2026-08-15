# PC-15 Slice 15-a — Integration Report

**Package:** PC-15  
**Slice:** 15-a Orchestrator → Session  
**Date:** 2026-08-15  
**Verdict:** Certified product flow is wired. Producer and consumer remain the existing owners.

---

## Flow

```text
Trading Orchestrator
  → SessionHandoffIntent (immutable, createsSession: false)
  → Trading Session consumes (product-flow adapter)
  → Paper Session created (TradingSessionService.create)
  → Command Center reflects the new Session (existing list / detail)
```

---

## Producer

| Item                                  | Owner                                              |
| ------------------------------------- | -------------------------------------------------- |
| Plan / run / selection / handoff emit | Trading Orchestrator                               |
| Gate before handoff                   | Runtime Enforcement (consumed, not owned)          |
| Bind ref on the intent                | Strategy Deployment id (not owned by Orchestrator) |

Orchestrator `createsSession` remains **false**. Orchestrator does not import Trading Session, Bot Facade, or product-flow.

---

## Consumer

| Item                          | Owner                                                   |
| ----------------------------- | ------------------------------------------------------- |
| Read `SessionHandoffIntent`   | Product-flow adapter via `TradingOrchestratorQueryPort` |
| Create paper session          | Trading Session (`TradingSessionService.create`)        |
| Start / pause / resume / stop | Trading Session (unchanged PC-13 commands)              |
| Paper account                 | Paper Account (unchanged)                               |

The adapter does not own lifecycle. Idempotent consume uses existing Session create idempotency (`handoff:{sessionHandoffIntentId}`). A second create for an already-consumed intent returns the same session.

---

## Command Center

Command Center remains command UI + projection. After consume:

- `GET /v1/trading-sessions` lists the new session
- `GET /v1/trading-sessions/:id` includes `sessionHandoff` (`consumed: true`, `createsSession: false`)
- Existing create wizard passes `sessionHandoffIntentId` when an Orchestrator handoff exists for the selected Deployment

No new Command Center screen. No Orchestrator “Start session” control.

---

## History

Orchestration history is the existing process-local coordination store. Consume does not change run status, handoff status, or intent fields. `GET /v1/orchestrations/handoffs/:id` returns the same record after consume.

---

## Fail-closed

| Case                                    | Result                      |
| --------------------------------------- | --------------------------- |
| Unknown handoff id                      | 404                         |
| Workspace mismatch                      | 404 (query scoped)          |
| Deployment bind ≠ create `deploymentId` | 422                         |
| Unapproved Deployment                   | 422 (existing Session rule) |
| Already consumed                        | Same session (idempotent)   |

---

**End of Integration Report.**
