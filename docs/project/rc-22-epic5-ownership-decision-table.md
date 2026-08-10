# RC-22 Epic 5 — Domain Ownership Decision Table

**Document:** Strategy Library Domain Ownership (Epic 5)  
**Status:** Epic 5 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 5 Report](./rc-22-epic5-eligibility-gate.md) · [Epic 4 Ownership](./rc-22-epic4-ownership-decision-table.md)

---

## Ownership decisions

| Fact / type                           | Owner (SoT)                   | Authority    | Epic 5 status   | Must not be owned by            |
| ------------------------------------- | ----------------------------- | ------------ | --------------- | ------------------------------- |
| Strategy / StrategyVersion            | Strategy Library              | SoT          | Implemented     | Research, Lake, Session         |
| StrategyCertification / Evidence refs | Strategy Library              | SoT          | Implemented     | Research, Lake, AI              |
| LibraryTacticalEnvelope               | Strategy Library              | SoT (config) | Implemented     | Session stub, AI                |
| **StrategyEligibility**               | **Strategy Library**          | Domain gate  | **Implemented** | Session, Orchestrator, Lake, UI |
| Evidence bodies                       | Research / Paper producers    | SoT          | Unchanged       | Strategy Library                |
| Trading Session lifecycle             | Trading Session               | SoT          | Unchanged       | Eligibility must not own        |
| Future selection among eligible       | Trading Orchestrator (future) | Consumer     | Not built       | Must use Library eligibility    |

---

## No duplicate gate

| Gate                | Owner            | Role                 |
| ------------------- | ---------------- | -------------------- |
| Certification admit | Strategy Library | Membership           |
| Eligibility         | Strategy Library | Static selectability |
| Risk Decision       | Risk Engine      | Executable approval  |
| Session lifecycle   | Trading Session  | Worker lifecycle     |

These are complementary — not parallel SoTs for the same fact.

---

## Conflict resolution

| Dispute                             | Winner                            |
| ----------------------------------- | --------------------------------- |
| Whether strategy is domain-eligible | **StrategyEligibility / Library** |
| Whether strategy was certified      | StrategyCertification             |
| Envelope body                       | LibraryTacticalEnvelope           |
| Session running state               | Trading Session                   |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
