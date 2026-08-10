# RC-22 Epic 6 — Domain Ownership Decision Table

**Document:** Strategy Library Domain Ownership (Epic 6)  
**Status:** Epic 6 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 6 Report](./rc-22-epic6-lifecycle-deprecation-archive.md)

---

## Ownership decisions (final domain)

| Fact / type                           | Owner (SoT)          | Authority             | Status          |
| ------------------------------------- | -------------------- | --------------------- | --------------- |
| Strategy / StrategyVersion            | Strategy Library     | SoT                   | Implemented     |
| StrategyCertification / Evidence refs | Strategy Library     | SoT                   | Implemented     |
| LibraryTacticalEnvelope               | Strategy Library     | SoT (config)          | Implemented     |
| StrategyEligibility                   | Strategy Library     | Domain gate           | Implemented     |
| **StrategyLifecycleRecord**           | **Strategy Library** | SoT (lifecycle audit) | **Implemented** |
| Evidence bodies                       | Research / Paper     | SoT                   | Unchanged       |
| Knowledge Lake facts                  | Knowledge Lake       | Projection            | Unchanged       |
| Trading Session lifecycle             | Trading Session      | SoT                   | Unchanged       |
| Runtime selection                     | Future Orchestrator  | Consumer              | Not built       |

---

## Ownership separation (audit)

| Domain           | Owns                                                                | Must not own                                 |
| ---------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| Research         | Experiments, evidence bodies                                        | Library membership / eligibility             |
| Strategy Library | Certified versions, certification, envelope, eligibility, lifecycle | Session lifecycle, Lake warehouse, execution |
| Knowledge Lake   | Analytical projections                                              | Certification / eligibility authority        |
| Runtime          | Session / Risk / Execution (existing)                               | Inventing Library membership                 |

**Verdict:** No ownership conflicts.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
