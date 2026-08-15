# Reporting (`reporting`)

**RC-24** — Reporting bounded context (Architecture Spec v2.0 §5.14).

## Authority

| Concern                                           | Class                                                          |
| ------------------------------------------------- | -------------------------------------------------------------- |
| Reporting aggregations / report artifacts         | **Projection**                                                 |
| Knowledge Lake                                    | Projection warehouse (analytical **source**; consumed Epic 2+) |
| Strategy Library / Session / Ledger / Enforcement | Unchanged SoT / Gate owners                                    |

Reporting **never** becomes Source of Truth.

## Epic posture

| Epic                                            | Status                                   |
| ----------------------------------------------- | ---------------------------------------- |
| 1 Boundary + ownership                          | Done                                     |
| 2 Knowledge Lake Query Port consumption         | Done                                     |
| 3 Reporting Domain Model (immutable entities)   | Done                                     |
| 4 Deterministic report generation + query ports | **Active**                               |
| 5 AI Analytics narratives                       | Sibling module (`ai-analytics`)          |
| 6 Notification Delivery                         | Sibling module (`notification-delivery`) |

## Epic 4 surfaces

- `ReportingGenerationService` / `REPORTING_SERVICE_PORT` — `requestReportRun`, `compareRuns`
- `ReportingQueryService` / `REPORTING_QUERY_PORT` — definitions / runs / aggregations
- Deterministic aggregation over Lake projections only

Still inactive in the Reporting bounded context: persistence product, jobs, PDF. Domain port posture remains `rest: false`. PC-05 HTTP lives in the sibling `reporting-product` adapter (`GET /v1/report-runs`, `GET /v1/report-definitions`) and delegates existing queries only. Distinct from research `/v1/reports`. Delivery is owned by Notification Delivery (Reporting does not know channels). UI is `/reporting`, not `/reports`.

## Owns (declared)

- `report-generation-boundary`
- `analytical-projection-boundary`
- `report-definition` / `report-run` / `aggregation-slice` / `historical-window`

## Does not own

Trading decisions, strategy validation/certification, Runtime Enforcement, Session lifecycle, accounting/Ledger, Knowledge Lake storage, Orchestrator / Selection.

## Dependency direction

```text
Knowledge Lake ──read──▶ Reporting
Reporting ──X──▶ Knowledge Lake storage ownership
Reporting ──X──▶ Orders / Risk / Execution / Library writes
```

Lake must never depend on Reporting.
