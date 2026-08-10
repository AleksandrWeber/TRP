# RC-22 Epic 4 — Domain Ownership Decision Table

**Document:** Strategy Library Domain Ownership (Epic 4)  
**Status:** Epic 4 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 4 Report](./rc-22-epic4-tactical-envelope-binding.md) · [Epic 3 Ownership](./rc-22-epic3-ownership-decision-table.md)

---

## Ownership decisions

| Fact / type                           | Owner (SoT)                    | Authority         | Epic 4 status   | Must not be owned by           |
| ------------------------------------- | ------------------------------ | ----------------- | --------------- | ------------------------------ |
| Strategy / StrategyVersion            | Strategy Library               | SoT               | Implemented     | Research, Lake, Session        |
| StrategyCertification / Evidence refs | Strategy Library               | SoT               | Implemented     | Research, Lake, AI             |
| Evidence bodies                       | Research / Paper producers     | SoT               | Unchanged       | Strategy Library               |
| **LibraryTacticalEnvelope**           | **Strategy Library**           | SoT (config)      | **Implemented** | Session stub, Orchestrator, AI |
| RC-19 Session envelope stub           | Trading Session (attachment)   | Non-authoritative | Unchanged       | Must not override Library      |
| Eligibility                           | Strategy Library gate (future) | Gate              | **Not Epic 4**  | Lake, UI                       |
| Research experiments                  | Research Lab                   | SoT               | Unchanged       | Strategy Library               |

---

## Configuration-only clarification

| Envelope is                        | Envelope is not         |
| ---------------------------------- | ----------------------- |
| Approved operational boundaries    | Trading / signal logic  |
| Library configuration SoT          | Runtime decision engine |
| Input to future eligibility checks | Risk approval           |

---

## Conflict resolution

| Dispute                             | Winner               |
| ----------------------------------- | -------------------- |
| Envelope body for certified version | **Strategy Library** |
| Session stub vs Library envelope    | **Library**          |
| Research artifact bodies            | Research Lab         |
| Session lifecycle                   | Trading Session      |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
