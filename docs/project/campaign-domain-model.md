# TRP — Campaign Domain Model

Last updated: 2026-07-16

Read-only description of the **currently implemented** Campaign Layer.
Source: `apps/api/src/modules/research-campaign/`.

---

## Purpose

A Campaign runs one strategy on one dataset across a fixed list of parameter sets.
It reuses the existing Experiment path (backtest → validation → optional Knowledge write)
and produces an in-memory Summary and Report for the whole batch.

---

## Main Entities

### Campaign

Logical batch identified by `campaignId` (UUID generated at start).

Input (`ResearchCampaignInput`):

- `datasetId`
- `strategyId`
- `paramsList` — non-empty array of strategy params

Not persisted as a DB table. Exists for the duration of one `POST /research-campaigns` (or service) call.

### Campaign Run

One iteration over a single params object in `paramsList`.

Successful run:

- calls `ExperimentsService.run(datasetId, strategyId, params)`
- produces a persisted Experiment
- contributes to summary counters and in-memory experiment list

Failed run (thrown error):

- does not create an Experiment
- recorded as `CampaignFailedRun` `{ params, error }`
- campaign continues

There is no separate persisted “CampaignRun” entity.

### Campaign Summary

In-memory aggregate after all runs (`CampaignSummary`):

- `campaignId`, `strategyId`, `datasetId`
- `totalRuns` — length of `paramsList`
- `passCount`, `failCount`, `needsReviewCount` — from Experiment verdicts
- `bestExperimentId` — highest `metrics.profitFactor` among successful runs
- `createdAt`
- `failedRuns` — execution errors (not validation FAIL)

Not stored in the database.

### Campaign Report

Derived view from Summary + successful experiments (`CampaignReport`):

- same identity/aggregate fields as Summary
- `bestProfitFactor`, `bestReturn`, `bestExpectancy` — from best experiment
- `lowestDrawdown` — minimum `maxDrawdownPercent` among completed experiments
- `verdict` — campaign-level: `PASS` | `NEEDS_REVIEW` | `FAIL`
- `recommendations` — deterministic strings (no AI)
- `createdAt`

Not stored in the database.

---

## Relationships

```
Campaign
  └── Campaign Run (1..N, sequential)
        ├── success → Experiment (persisted)
        │              └── Knowledge (via existing post-create path)
        └── error → CampaignFailedRun (in Summary only)

Campaign Summary  ← aggregates successful Experiments + failedRuns
Campaign Report   ← built from Summary + experiment snapshots
```

API response shape:

```
{ summary, report, experimentIds }
```

---

## Lifecycle

1. Validate request (`datasetId`, `strategyId`, non-empty `paramsList`).
2. Allocate `campaignId` + `createdAt`.
3. For each params set, run Experiment (or catch error).
4. Build Summary (counts, bestExperimentId, failedRuns).
5. Build Report (verdict, best metrics, recommendations).
6. Return Summary + Report + experimentIds.
7. Process ends — Campaign / Summary / Report are not saved as Campaign rows.

---

## Data Flow

```
POST /research-campaigns
  → ResearchCampaignService.run
      → ExperimentsService.run (per params)
          → Backtest + Validation
          → Experiment persist
          → Knowledge.recordFromExperiment (existing side effect)
  → CampaignReportService.build(summary, experiments)
  → { summary, report, experimentIds }
```

Knowledge is **not** called directly by the Campaign Layer.

---

## Failure Handling

| Case                               | Behavior                                                               |
| ---------------------------------- | ---------------------------------------------------------------------- |
| Invalid body                       | `BadRequestException`; campaign does not start                         |
| Experiment throws                  | Logged; params + error appended to `failedRuns`; next params continues |
| Experiment verdict `fail`          | Counted in `failCount`; experiment kept                                |
| Experiment verdict `needs_review`  | Counted in `needsReviewCount`                                          |
| Experiment verdict `pass`          | Counted in `passCount`                                                 |
| All configs fail validation        | Report verdict `FAIL` + recommendations                                |
| Empty successful set + errors only | Counters stay 0; `bestExperimentId` may be null                        |

Campaign-level verdict rules:

- any Experiment `pass` → Report `PASS`
- else any `needs_review` → `NEEDS_REVIEW`
- else → `FAIL`

---

## Current Limitations

- No Campaign table / no persistence of Summary or Report.
- No GET-by-`campaignId`; history only via Experiments created.
- No parallel runs; strictly sequential.
- No multi-strategy or multi-dataset campaign in one request.
- `totalRuns` counts planned params, not only successful Experiments.
- Best candidate is by Profit Factor only.
- UI for campaigns not implemented.

---

## Future Extensions

- Persist Campaign / Summary / Report.
- Campaign UI.
- GET campaign by id / list campaigns.
- Multi-dataset campaigns.
- Walk-forward style campaign schedules.
- Campaign-level Knowledge summary entry.
