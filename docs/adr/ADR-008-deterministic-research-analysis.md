# ADR-008 — Deterministic Research Analysis

Status: Accepted

Date: 2026-07-16

---

## Context

After Campaign Report exists, the product needs a structured analysis view
(executive summary, strengths, weaknesses, recommendations, next hypothesis)
without introducing an external AI dependency or a second research path.

Analysis must stay reproducible and reviewable: the same CampaignReport always
yields the same analysis output.

---

## Decision

Research Analysis:

- operates **only** on top of an existing `CampaignReport`;
- does **not** call external AI / LLMs;
- is **deterministic** (pure function of report fields / verdict);
- does **not** depend on Knowledge Layer reads/writes;
- does **not** depend on UI (UI may display analysis; analysis does not own UI).

`ResearchAnalysisService.buildAnalysis(CampaignReport)` is the sole analysis
entry point. HTTP (`POST /campaigns/analyze`) and web views are thin consumers.

---

## Consequences

### Advantages

- Analysis is testable without mocks for AI providers.
- Campaign Report remains the single analytical input surface.
- Knowledge and Research Engine stay unchanged by analysis.

### Constraints

- Analysis quality is bounded by Campaign Report content.
- Future AI-assisted analysis would require a separate ADR (non-deterministic path).
