# PC-10 Market State Product — Product Relationships

**Package:** PC-10  
**Date:** 2026-08-15

| Product                              | Relationship                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Market State**                     | **Owner.** This package is HTTP + UI over existing store / observational reads.                              |
| **Qualification (PC-08)**            | Unchanged owner of runs. State displays a reference only.                                                    |
| **Market Profile (PC-09)**           | Unchanged owner of versions. State displays a reference only. Profile trend is not live Market State.        |
| **Orchestrator (PC-11)**             | Unchanged consumer of current Market State. This package does not change that read and does not orchestrate. |
| **Exchange Scope / Cluster (PC-12)** | Isolation identity on the state row. State does not own Cluster.                                             |
| **Product Flow (PC-15)**             | Unchanged. Orchestrator still uses its existing Market State consumer.                                       |

Market State is not Qualification, not Profile, not Risk, not execution, and not Orchestrator.

See [Current Consumer Graph](./pc-10-current-consumer-graph.md).

---

**End of Product Relationships.**
