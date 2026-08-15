# PC-09 Market Profile Product — Product Relationships

**Package:** PC-09  
**Date:** 2026-08-15

| Product                              | Relationship                                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Market Profile**                   | **Owner.** This package is HTTP + UI over existing query ports.                                                 |
| **Qualification (PC-08)**            | Unchanged owner of runs. Profile displays `qualificationRunId` as published source. Publish remains PC-15 15-b. |
| **Market State (PC-10)**             | Unchanged. Profile trend dimension is not live Market State.                                                    |
| **Orchestrator (PC-11)**             | Consumer of latest Profile. This package does not change that read.                                             |
| **Exchange Scope / Cluster (PC-12)** | Isolation identity on the profile row. Profile does not own Cluster.                                            |
| **Product Flow (PC-15 15-b)**        | Existing publish wiring. Not duplicated here.                                                                   |

Profile is not Qualification, not Market State, not Risk, and not execution.

---

**End of Product Relationships.**
