# ADR-009 — Multi-dataset Campaign

Status: Accepted

Date: 2026-07-16

---

## Context

Campaign Layer originally runs one strategy × many params on a **single** dataset.
Product needed the same campaign shape across several datasets without forking
the Research Engine or inventing a new persistence model.

---

## Decision

`MultiDatasetCampaignService` is an **orchestration layer** that:

- reuses existing `ResearchCampaignService` once per dataset;
- continues when an individual dataset campaign fails;
- aggregates per-dataset summaries into `MultiDatasetCampaignSummary`;
- does **not** change Research Engine / Validation / Knowledge semantics;
- does **not** add Campaign or multi-dataset persistence (results remain in-memory /
  API response; Experiments remain the persisted units via the existing path).

HTTP (`POST /campaigns/run-multi`) and Multi-dataset UI are thin consumers of
this orchestration service.

---

## Consequences

### Advantages

- Single-dataset Campaign behavior stays the source of truth per dataset.
- Failures are isolated per dataset without aborting the whole multi run.
- No new DB entities or engine forks.

### Constraints

- Cross-dataset comparison is summary-level only (no shared campaign entity).
- Walk-forward / temporal splits remain out of scope (separate future stories).
