# PC-10 Market State Product — Current Consumer Graph

**Package:** PC-10  
**Date:** 2026-08-15  
**Verdict:** Consumers unchanged. This package does not add a new consumer or reverse an edge.

```text
Live Market Data ──read──► Market State
Qualification    ──read──► Market State
Profile          ──read──► Market State
                              │
                              ├──read──► Trading Orchestrator (existing in-memory consumer)
                              ├──read──► Reporting
                              ├──read──► AI Analytics
                              ├──read──► Command Center
                              ├──read──► Exchange Scope / multi-exchange
                              └──read──► Monitoring
```

| Consumer                            | Relationship after PC-10                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Trading Orchestrator**            | Unchanged. Still reads its existing Market State consumer adapter. Does not own State. Product UI does not orchestrate. |
| **Reporting / AI / Command Center** | Unchanged consumer-read projections.                                                                                    |
| **Qualification / Profile**         | Unchanged owners. Market State still observes them; they do not import this product adapter.                            |
| **Operator UI**                     | New sibling HTTP/UI over the owner. Not a consumer of Orchestrator.                                                     |

Forbidden reverses remain: Orchestrator does not own Market State. Market State does not command sessions, select strategies, or classify on this product path.

See [Product Relationships](./pc-10-product-relationships.md).

---

**End of Current Consumer Graph.**
