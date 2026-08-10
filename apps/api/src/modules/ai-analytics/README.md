# AI Analytics (`ai-analytics`)

**RC-24** — AI Analyst / Assistant bounded context (Architecture Spec v2.0 §5.15).

## Authority

| Concern                    | Class                                               |
| -------------------------- | --------------------------------------------------- |
| Analytical narratives      | **Narrative**                                       |
| Reporting report artifacts | Projection (owned by Reporting; consumed read-only) |
| Existing `ai` module       | AI Gateway (CANONICAL) — distinct access layer      |

AI Analytics **never** becomes Source of Truth and never makes trading decisions.

## Epic posture

| Epic                                      | Status     |
| ----------------------------------------- | ---------- |
| 1 Boundary reservation                    | Done       |
| 3 AnalyticalNarrative domain              | Done       |
| 5 Deterministic narratives over ReportRun | **Active** |

## Epic 5 surfaces

- `AiAnalyticsService` / `AI_ANALYTICS_PORT` — `explain` / `summarize` / `identifyTrends` / `generateNarrative`
- Inputs: `ReportRun` + `AggregationSlice` via `REPORTING_QUERY_PORT` only
- Outputs: immutable `AnalyticalNarrative` (`authorityClass: narrative`)
- Deterministic narrator (`deterministic-report-narrator-v1`) — identical report → identical narrative

## Forbidden

Direct Knowledge Lake / Session / Library / Enforcement / Orders / Ledger access; report mutation; trading decisions; REST / persistence / UI.
