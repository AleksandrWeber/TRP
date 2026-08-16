# PC-16 Knowledge Lake Product — Product Surface

**Package:** PC-16  
**Date:** 2026-08-16

Knowledge Lake is now a customer product: operators browse and inspect the existing analytical warehouse. The current Knowledge Lake implementation remains the only stored-knowledge owner.

---

## Operator path

```text
Research
  ↓
Knowledge Lake Home
  ↓
Search / Filters
  ↓
Entry details
  ├── Metadata
  ├── Provenance
  ├── References
  ├── Relationship viewer
  ├── History (workspace)
  ├── Connected Reports
  ├── Connected AI Narratives (Reporting references)
  ├── Connected Research
  ├── Connected Strategies
  └── Connected Qualification / Profile / State (when cited)
```

Everything on this path is read-only.

## HTTP

Transport only. Delegates to `KnowledgeLakeQueryPort.list` / `getByEventId`. Extra filters (`q`, `libraryEntryId`, `reportRunId`) are applied to existing query results. Relationships and provenance are derived from admitted facts. Connected reports and strategies are existing owner reads.

## Not this product

| Item                    | Owner / later package   |
| ----------------------- | ----------------------- |
| Research Knowledge page | `/knowledge`            |
| Report generation       | Reporting               |
| AI authoring            | PC-17                   |
| Manual ingestion        | Internal producers only |
| Semantic search engine  | Forbidden               |

---

**End of Product Surface.**
