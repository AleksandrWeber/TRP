# ADR-007 — Campaign Layer

Status: Accepted

Date: 2026-07-16

---

## Context

Research OS needed to evaluate many parameter sets for one strategy on one dataset
without embedding batch orchestration inside the Research Layer.

Early campaigns (EMA grid, Donchian periods) were run as repeated single experiments.
A dedicated Campaign Layer appeared so batch runs could:

- drive a fixed `paramsList` sequentially through the existing Experiment path;
- aggregate verdicts and pick a best experiment;
- produce an in-memory Campaign Summary and Campaign Report.

Campaign stays separate from the Research Layer because Research owns a single
reproducible Experiment (dataset → strategy → backtest → validation → persist).
Campaign owns only the batch loop and reporting over those Experiments.
It must not fork backtest, validation, or Knowledge semantics.

---

## Decision

Campaign Layer is responsible only for:

- launching a series of experiments (via existing `ExperimentsService`);
- aggregating results across successful runs;
- Campaign Summary (in-memory);
- Campaign Report (in-memory; deterministic verdict + recommendations).

Campaign Layer is **not** responsible for:

- Backtest Engine;
- Validation;
- Knowledge (writes happen only through the existing Experiment post-create path);
- Database persistence of Campaign / Summary / Report entities
  (Experiments remain the persisted units).

---

## Consequences

### Advantages

- Research Layer stays the single path for calculation, validation, and Experiment persistence.
- Campaign can fail individual runs without stopping the batch or changing engine rules.
- Summary and Report stay ephemeral views; no second source of truth in the DB.
- Knowledge dedup / lineage remain Experiment-scoped and unchanged by Campaign.

### Extensions enabled by this split

- **Campaign API** — thin HTTP surface (`POST /research-campaigns`) over the runner/report (already present).
- **Campaign UI** — product next (US020): present Summary / Report without moving orchestration into Research Layer.
