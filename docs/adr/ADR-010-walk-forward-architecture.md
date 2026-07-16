# ADR-010 — Walk-Forward Architecture

Status: Accepted

Date: 2026-07-16

Last updated: 2026-07-16 (US050A — documentation sync to current implementation)

---

## Context

Walk-Forward is the first vertical for rolling train/test evaluation in TRP
Research OS. It stays in the Campaign Layer and must not fork Research Engine,
Validation, or Knowledge.

Dataset Slice (ADR-011) provides the evidence-scope abstraction. Walk-Forward
orchestrates Train/Test slices per window; it does not embed slice construction
ad hoc and does not change Engine accounting or Validation thresholds.

---

## Decision

### Role in Research OS

Walk-Forward is a **Campaign Layer orchestration** capability. It plans
windows, builds Train/Test `SliceRef`s, runs Train campaigns, evaluates best
params on Test, aggregates successful results (Aggregate v2), optionally
analyzes them deterministically, and exposes thin API/UI surfaces.

It is **not** a second research path and **not** a Knowledge writer.

### Orchestration above ResearchCampaignService

Walk-Forward is an orchestration layer **above** `ResearchCampaignService`
and `ExperimentsService`:

- each successful window runs a Train campaign via `ResearchCampaignService`;
- best Train params are evaluated on the Test slice via `ExperimentsService`;
- Experiments remain the only persisted research units;
- Walk-Forward summaries / aggregates / analysis are in-memory views.

### Research Engine is not modified

Walk-Forward **does not** modify:

- Research Engine / Backtest;
- Validation Engine;
- Knowledge Layer;
- Experiment API contracts or DB schema for Walk-Forward entities.

Dataset Slice and Experiment/Campaign slice support live **above** the Engine
(ADR-011). The Engine receives only a plain bar array.

### Window Builder

`buildWalkForwardWindows(datasetLength, windowSize, stepSize)` builds inclusive
index windows (`trainStart`/`trainEnd`, `testStart`/`testEnd`).

### Dataset Slice (per window)

For each window, Walk-Forward obtains immutable `SliceRef`s via
`createSliceRef` / SliceResolver (ADR-011):

- **Train Slice** — role `TRAIN`, range `[trainStart, trainEnd]`;
- **Test Slice** — role `TEST`, range `[testStart, testEnd]`.

Windows carry `trainSliceIdentity` / `testSliceIdentity` as provenance.

### Train Campaign

Per window, `WalkForwardCampaignService` runs
`ResearchCampaignService.run(...)` with the **Train** `SliceRef` and the
window’s `paramsList`. Campaign semantics are unchanged; slice is input scope
only.

On Train campaign failure, the window is recorded as an error window and
orchestration continues to the next window.

### Test Experiment

After a successful Train campaign:

1. select `bestExperiment` from the Train campaign result;
2. run a separate Experiment on the **Test** `SliceRef` with the same
   `strategyId` and the best experiment’s params (`ExperimentsService`).

Test evaluation failure does **not** fail the window and does **not** stop
other windows. Window fields include `trainBestExperimentId` /
`testExperimentId`, `trainMetrics` / `testMetrics`, `trainVerdict` /
`testVerdict`.

### Aggregate v2

Deterministic aggregate over **successful** windows only (error windows
excluded). Summary contains two independent blocks:

**Train Aggregate** (reference):

- averages (profit factor, return, drawdown, expectancy);
- best/worst window indices (by Train profit factor);
- `passCount` / `needsReviewCount` / `failCount` from Train campaign summaries.

**Test Aggregate:**

- `testPassCount` / `testNeedsReviewCount` / `testFailCount`;
- `averageTestReturnPercent` / `averageTestProfitFactor` /
  `averageTestMaxDrawdownPercent`.

**`overallVerdict`** uses **Test verdicts only** (PASS / NEEDS_REVIEW / FAIL).
If no Test verdicts are present, `overallVerdict` is FAIL. Train Aggregate is
kept for reference and does not drive the overall Walk-Forward verdict.

### Analysis Layer

`WalkForwardAnalysisService.buildAnalysis(WalkForwardCampaignSummary)` is
fully deterministic (no AI / LLM / external APIs): overall assessment,
strengths / weaknesses / recommendations, stability and consistency scores.

**Intentional current state:** Analysis still consumes the **Train Aggregate**
fields (and the summary’s `overallVerdict` as exposed). It has **not** been
rewired to Test Aggregate metrics. Updating Analysis for Aggregate v2 is a
later story.

### API

`POST /campaigns/run-walk-forward` validates input and returns
`WalkForwardCampaignSummary` from the runner (no Analysis attachment on this
endpoint in the first vertical).

### UI

`WalkForwardCampaignPage` at `/campaigns/walk-forward`: form → API client →
summary + per-window table. First vertical does not show Analysis, charts,
Knowledge, or History. Test Aggregate fields are present on the summary
object but are not a dedicated UI surface yet.

---

## Consequences

### Advantages

- Clear freeze boundary: engine/validation/knowledge stay untouched.
- True Train/Test evidence via Dataset Slice without forking the Engine.
- Campaign remains the Train search path; Test is a single-experiment
  out-of-sample check.
- Aggregate v2 separates in-sample reference from out-of-sample verdict.
- Aggregate and Analysis stay reproducible without AI.
- API/UI remain thin consumers of orchestration.

### Constraints

- No Walk-Forward persistence entity.
- Analysis still Train-oriented while `overallVerdict` is Test-based
  (intentional until an Analysis update story).
- Knowledge Result Identity does not yet include `sliceIdentity` (ADR-011
  recommendation; separate versioning story).
- First API/UI vertical does not expose Analysis or a dedicated Test
  Aggregate presentation.
