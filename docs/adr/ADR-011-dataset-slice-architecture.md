# ADR-011 — Dataset Slice Architecture

Status: Accepted

Date: 2026-07-16

---

## Context

Walk-Forward (ADR-010) currently plans index windows but does not yet run
experiments on true bar ranges. Phase 2 needs a shared abstraction so
orchestration layers (Walk-Forward, and later Cross Validation, Monte Carlo,
Bootstrap, Rolling / Anchored windows) can select evidence scope without
forking the Research Engine.

The abstraction must stay above the Engine: slices choose _which bars_;
backtest/validation semantics stay unchanged.

---

## Decision

### Dataset Slice

A **Dataset Slice** is a logical, immutable view over an existing Dataset:

- it is **not** a new market data source;
- it does **not** own backtest, fees, validation, or Knowledge rules;
- it only defines an evidence scope on bars already stored in a Dataset.

### SliceRef (immutable)

`SliceRef` is the immutable reference passed across Experiment / Campaign /
Walk-Forward boundaries.

A `SliceRef` contains:

- `datasetId`
- `startIndex` (inclusive)
- `endIndex` (inclusive)
- `role`

There is **no** separate `sliceId`.
There is **no** `parentWindowId` (window linkage stays in the orchestrator,
not in the slice).

Once created, a `SliceRef` must not be mutated.

### sliceIdentity

`sliceIdentity` is derived solely from:

`datasetId` + `startIndex` + `endIndex` + `role`

It is the canonical identity of a slice for provenance and future dedup.
A separate opaque `sliceId` is not required.

**Recommendation:** future Result Identity / Knowledge dedup should include
`sliceIdentity` so full-dataset and sliced runs do not collide incorrectly.
That change is **not** implemented by this ADR; it requires a later
versioning / Knowledge story.

### Slice roles

Allowed roles:

- `FULL` — entire dataset (or unrestricted scope)
- `TRAIN` — in-sample / fit scope
- `TEST` — out-of-sample evaluation scope
- `HOLD_OUT` — reserved hold-out scope
- `VALIDATION` — validation / tuning scope (distinct from TEST when a
  three-way split is used)

### SliceResolver (sole construction point)

`SliceResolver` is the **only** place allowed to form slices:

- validates bounds against dataset length;
- rejects empty / inverted ranges;
- validates role;
- returns an immutable `SliceRef` and its `sliceIdentity`.

Orchestrators (Campaign, Walk-Forward, future samplers) must not construct
slice objects ad hoc; they request slices through `SliceResolver`.

### Interaction with Experiment

Experiment accepts a `SliceRef` (or continues to accept full-dataset runs as
`FULL` via resolver) as the bar scope for a run.

Experiment persists slice provenance (`sliceIdentity` / range / role) without
changing Engine accounting or Validation thresholds.

The Engine still receives a contiguous bar sequence derived from the slice;
it does not plan windows and does not know Walk-Forward / CV / Bootstrap.

### Interaction with Campaign

`ResearchCampaignService` remains a sequential params loop.

Campaign input scope becomes either a full dataset or a `SliceRef`.
Campaign Summary / Report shapes stay the same; slice is input scope, not
campaign logic.

### Interaction with Walk-Forward

Window Builder still produces index windows.

Walk-Forward Runner asks `SliceResolver` for `TRAIN` / `TEST` (and optionally
`VALIDATION`) `SliceRef`s per window, then runs campaigns through existing
`ResearchCampaignService`.

Aggregate / Analysis / API / UI from ADR-010 remain consumers of campaign
results; they do not form slices.

### Research Engine unchanged

Dataset Slice architecture **must not** modify:

- Backtest Engine semantics;
- Validation Engine rules;
- accounting / fee behavior;
- Strategy Contract.

Slice selects bars; Engine computes trades; Validation judges metrics;
Knowledge remains experiment-scoped unless a separate ADR says otherwise.

### Future reuse

The same `SliceRef` + `SliceResolver` contract is intended for later
orchestrators only (no Engine forks):

- Cross Validation (folds as slices)
- Monte Carlo (randomized slice schedules)
- Bootstrap (resampled slice sets)
- Rolling Window
- Anchored Window

---

## Consequences

### Advantages

- One immutable slice contract for all sampling strategies.
- Clear construction boundary (`SliceResolver` only).
- Engine / Validation / Knowledge stay protected from orchestration sprawl.
- Walk-Forward can close the “index-only” gap without a second research path.

### Constraints

- Implementation of resolver, Experiment wiring, and Result Identity inclusion
  of `sliceIdentity` are **future stories** (this ADR freezes design only).
- Orchestrators must not embed window parentage inside `SliceRef`.
- Until Result Identity includes `sliceIdentity`, sliced vs full-dataset
  Knowledge collisions remain a known risk to address explicitly later.
