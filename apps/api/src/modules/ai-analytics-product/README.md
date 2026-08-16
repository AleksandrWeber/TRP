# AI Analytics Product (`ai-analytics-product`)

**PC-17** — HTTP + UI product adapter over existing AI Analytics generation.

Not a bounded context. Not a Source of Truth. Distinct from research `/v1/ai/execute`.

| Concern                  | Owner                                                |
| ------------------------ | ---------------------------------------------------- |
| Analytical narratives    | **AI Analytics** (`AIAnalyticsPort`)                 |
| ReportRun / aggregations | **Reporting** (`ReportingQueryPort` / `compareRuns`) |
| Analytical facts         | **Knowledge Lake** (`KnowledgeLakeQueryPort`)        |
| Strategy membership      | **Strategy Library** (`StrategyLibraryLookupPort`)   |
| HTTP / product views     | This adapter                                         |
| Operator UI              | `/ai-analytics`                                      |

Forbidden: trading decisions, order generation, report ownership, strategy editing, knowledge editing, notification sending, autonomous actions, new storage.

AI Analytics domain `rest: false` / `persistence: false` is unchanged. This module is transport only.
