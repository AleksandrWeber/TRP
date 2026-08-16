# Knowledge Lake Product (`knowledge-lake-product`)

**PC-16** — HTTP + UI product adapter over existing Knowledge Lake queries.

Not a bounded context. Not a Source of Truth. Distinct from research `/v1/knowledge`.

| Concern                      | Owner                                              |
| ---------------------------- | -------------------------------------------------- |
| Analytical facts / warehouse | **Knowledge Lake** (`KnowledgeLakeQueryPort`)      |
| ReportRun citations          | **Reporting** (`ReportingQueryPort`)               |
| Strategy membership          | **Strategy Library** (`StrategyLibraryLookupPort`) |
| AI narratives                | **AI Analytics** (referenced via Reporting only)   |
| HTTP / product views         | This adapter                                       |
| Operator UI                  | `/knowledge-lake`                                  |

Forbidden: editing, deleting, manual ingestion, AI authoring, report generation, new persistence, indexing redesign, semantic search redesign.

Knowledge Lake domain query posture is unchanged. This module is transport only.
