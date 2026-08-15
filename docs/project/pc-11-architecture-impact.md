# PC-11 Trading Orchestrator Product — Architecture Impact

**Package:** PC-11  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Orchestrator remains coordination only. Trading Session remains Session owner. No new SoT. No new authority. `createsSession` remains false.

---

## Frozen artifacts

| Artifact                        | Status after PC-11  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                              | Owner before         | Owner after                        |
| ------------------------------------ | -------------------- | ---------------------------------- |
| Orchestration plans / runs / intents | Trading Orchestrator | Trading Orchestrator               |
| Strategy certification / envelope    | Strategy Library     | Strategy Library (consumed)        |
| PASS / FAIL                          | Runtime Enforcement  | Runtime Enforcement (consumed)     |
| Deployment bind                      | Strategy Deployment  | Unchanged                          |
| Trading Session lifecycle            | Trading Session      | Unchanged — handoff is intent only |
| Orders / Execution / Risk approval   | Never Orchestrator   | Still never                        |

HTTP is transport. UI is not SoT. The product adapter does not execute, certify, or start Sessions.

---

## Authority consumption

| Authority            | How PC-11 uses it                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Trading Orchestrator | **Owner** of coordination artifacts. REST/UI expose existing commands.                                                              |
| Strategy Library     | **Read** Lookup / Eligibility. Does not certify.                                                                                    |
| Runtime Enforcement  | **Consume** `validateDeployment` on handoff. Fail-closed. No override.                                                              |
| Strategy Deployment  | **Bind ref only** (`deploymentBindRef`). Orchestrator does not import Deployment.                                                   |
| Trading Session      | **Handoff intent only.** Session remains lifecycle SoT. PC-15 consumes the intent.                                                  |
| Market State         | **Consumer seed** of a current-condition view until PC-10 / PC-15 wires the real query port. Does not classify. Does not own State. |
| Risk                 | **Policy read only.** Never `approveRisk`.                                                                                          |
| Orders / Execution   | **Not used.**                                                                                                                       |

`createsSession` remains **false** on every Session Handoff Intent view.

---

## Ports

| Port                                  | Before                            | After                                               |
| ------------------------------------- | --------------------------------- | --------------------------------------------------- |
| `TradingOrchestratorServicePort`      | Active in-process (`rest: false`) | **Active** — same commands + HTTP                   |
| `TradingOrchestratorQueryPort`        | Active in-process (`rest: false`) | **Active** — same queries + HTTP                    |
| Persistence                           | Process-local coordination store  | Process-local product-visible store (not a new SoT) |
| Session start / Orders / Risk approve | Existing owners                   | **Unchanged**                                       |

---

## What was not changed

- Orchestration workflow sequence (Market State → Library → Gate → intent)
- `createsSession` / `forcesTrade` / `approvesRisk` / `submitsOrders`
- Deployment / Session / Runtime / Library owners
- Spec, Authority Matrix, Alias Dictionary, RC history
- Session consumption of the intent (PC-15 15-a)

---

**End of Architecture Impact.**
