# PC-15 Slice 15-a — Architecture Impact

**Package:** PC-15 slice 15-a  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Trading Session remains Session owner. Orchestrator unchanged (`createsSession: false`). Deployment unchanged. Runtime unchanged. No new SoT. No new authority.

---

## Frozen artifacts

| Artifact                        | Status after 15-a   |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## System Boundaries

| Concern                            | Owner before            | Owner after                                |
| ---------------------------------- | ----------------------- | ------------------------------------------ |
| Trading Session lifecycle          | Trading Session         | Unchanged                                  |
| SessionHandoffIntent               | Trading Orchestrator    | Unchanged (immutable)                      |
| Consume wiring                     | Missing                 | Product-flow composition (not a BC)        |
| Command Center                     | Command UI + projection | Unchanged — still not Session SoT          |
| Deployment bind                    | Strategy Deployment     | Unchanged                                  |
| Orchestration                      | Trading Orchestrator    | Unchanged — `createsSession` remains false |
| Orders / Execution / Risk approval | Never this slice        | Still never                                |

HTTP is transport. UI is not SoT. The product-flow adapter does not execute, certify, orchestrate, or own Session.

---

## Authority Consumption

| Authority                 | How 15-a uses it                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Trading Orchestrator      | **Consumer read** of `getSessionHandoffIntent` / `listOrchestrationRuns`. Never emit from Session. Never set `createsSession: true`. |
| Trading Session           | **Owner** of create / start / pause / resume / stop. Consume delegates create.                                                       |
| Strategy Deployment       | **Bind ref only.** Create still requires an approved Deployment.                                                                     |
| Strategy Runtime          | Unchanged. Session still arms on start.                                                                                              |
| Risk / Orders / Execution | **Not used.**                                                                                                                        |

---

## Ports

| Port                                   | Before               | After                                                     |
| -------------------------------------- | -------------------- | --------------------------------------------------------- |
| Orchestrator emit / query              | Product REST (PC-11) | Unchanged                                                 |
| Trading Session create                 | HTTP (PC-13)         | **Same owner** — optional handoff id on the existing body |
| Session start from Orchestrator intent | Not consumed         | **Consumed by Session** via product-flow                  |
| Orchestrator `createsSession`          | false                | **false**                                                 |

---

## What was not changed

- Trading Session aggregate, transitions, lease, or recovery
- Orchestrator workflow or `createsSession`
- Deployment / Runtime / Library owners
- Spec, Authority Matrix, Alias Dictionary, RC history
- Orders, Execution, Risk approvals

---

**End of Architecture Impact.**
