# Runtime Engine Completion — Architecture Impact

**Document:** Runtime Engine Architecture Impact  
**Date:** 2026-08-16  
**Verdict:** Architecture unchanged. Authority unchanged. No new bounded context. No new Source of Truth. No new ownership.

---

## Frozen artifacts

| Artifact                        | Status after this task |
| ------------------------------- | ---------------------- |
| Architecture Specification v2.0 | Unmodified             |
| Authority Matrix                | Unmodified             |
| Alias Dictionary                | Unmodified             |
| RC-19 … RC-28                   | Unmodified (CLOSED)    |
| PC-01 … PC-20                   | Unmodified (CLOSED)    |
| Trading Session ownership       | Unchanged              |
| Runtime ownership               | Unchanged              |
| Orders ownership                | Unchanged              |
| Risk ownership                  | Unchanged              |
| Execution ownership             | Unchanged              |
| Accounting ownership            | Unchanged              |
| Reporting ownership             | Unchanged              |
| Notification ownership          | Unchanged              |
| AI ownership                    | Unchanged              |

---

## System Boundaries

| Concern                          | Owner before                                   | Owner after                                                                     |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Closed candle admit / projection | Live Market Data                               | Unchanged — ingest now publishes the existing `MarketClosedCandle` outbox event |
| Session start / arm              | Trading Session / Strategy Runtime lifecycle   | Unchanged                                                                       |
| Runtime evaluation               | Strategy Runtime (`RuntimeEvaluationService`)  | Unchanged                                                                       |
| Pipeline composition             | Strategy Trading Pipeline                      | Unchanged — worker added in the same module                                     |
| Risk decision                    | Canonical Risk                                 | Unchanged                                                                       |
| Paper order / fill               | Orders / Execution                             | Unchanged                                                                       |
| Position / ledger                | Positions / Ledger                             | Unchanged                                                                       |
| Report / notify / narrate        | Reporting / Notification / AI via product-flow | Unchanged consumers, invoked after `filled`                                     |

Live Market Data still must not import Strategy Runtime, Orders, or the pipeline. Strategy Runtime still must not import Orders. The worker lives in Strategy Trading Pipeline, the existing composition root.

---

## What was not changed

- Spec, Authority Matrix, Alias Dictionary, RC history, PC history
- `decideRuntimeEvaluation` (Deployment `action` / `compareCloseToOpen`; default `NO_ACTION`)
- Envelope runtime adaptation flag (`false`)
- Product-flow HTTP (Reporting remains query-only on the product transport)
- New REST resources
- New persistence models
- Signal Engine / Evaluation Scheduler / US016 executor

---

**End of Architecture Impact.**
