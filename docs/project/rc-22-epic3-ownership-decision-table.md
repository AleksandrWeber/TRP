# RC-22 Epic 3 — Domain Ownership Decision Table

**Document:** Strategy Library Domain Ownership (Epic 3)  
**Status:** Epic 3 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 3 Report](./rc-22-epic3-strategy-certification.md) · [Epic 2 Ownership Table](./rc-22-epic2-ownership-decision-table.md)

---

## Ownership decisions

| Fact / type                              | Owner (SoT)                                         | Authority                      | Epic 3 status        | Must not be owned by             |
| ---------------------------------------- | --------------------------------------------------- | ------------------------------ | -------------------- | -------------------------------- |
| Library Strategy / StrategyVersion       | Strategy Library                                    | SoT                            | Implemented (Epic 2) | Research, Lake, Session          |
| **StrategyCertification**                | **Strategy Library**                                | SoT (admission)                | **Implemented**      | Research, Lake, AI, Session      |
| **CertificationEvidence** (refs)         | **Strategy Library**                                | SoT for “what justified admit” | **Implemented**      | —                                |
| Evidence **bodies** / research artifacts | Research Lab (and Paper producers where applicable) | SoT                            | Unchanged            | Strategy Library                 |
| Experimental registry Strategy           | `strategies`                                        | SoT (editable config)          | Unchanged            | Strategy Library                 |
| Tactical Envelope                        | Strategy Library (future)                           | SoT                            | **Not Epic 3**       | Session inventing envelopes      |
| Eligibility                              | Strategy Library gate (future)                      | Gate                           | **Not Epic 3**       | Lake, UI                         |
| Knowledge Lake analytical copies         | Knowledge Lake                                      | Projection                     | Unchanged            | Must not authorize certification |
| Session lifecycle                        | Trading Session                                     | SoT                            | Unchanged            | Strategy Library                 |

---

## No duplicate Source of Truth

| Concern                          | Single owner                     |
| -------------------------------- | -------------------------------- |
| Algorithm version content        | StrategyVersion (Library)        |
| Admission decision               | StrategyCertification (Library)  |
| Backtest / WF / MC result bodies | Research stores                  |
| Paper run facts                  | Paper / Session path owners      |
| Analytical warehouse             | Knowledge Lake (Projection only) |

---

## Conflict resolution

| Dispute                        | Winner                          |
| ------------------------------ | ------------------------------- |
| Whether a version was admitted | StrategyCertification (Library) |
| Contents of a backtest report  | Research Lab                    |
| Lake vs Library on membership  | **Library**                     |
| Session lifecycle              | Trading Session                 |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
