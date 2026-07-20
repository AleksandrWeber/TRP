# Architecture Decision Records

Index of accepted architectural decisions for TRP Research OS.

Full living project status: [`docs/project/project-status.md`](../project/project-status.md).
Version 1 completion: [`docs/releases/V1-COMPLETION.md`](../releases/V1-COMPLETION.md) (`v1.0.0`).

Note: ADR-001…ADR-006 currently exist as index-only decisions. ADR-007 onward are standalone ADR documents. Do not create stub files for ADR-001…006.

---

ADR-001 — EMA залишається benchmark, не MVP
Status: Accepted

ADR-002 — Research Layer підтримує Strategy Registry
Status: Accepted

ADR-003 — Knowledge immutable
Status: Accepted

ADR-004 — Result Identity використовується для dedup
Status: Accepted

ADR-005 — Versioning: Engine ≠ Git Commit
Status: Accepted

ADR-006 — Experiment Provenance містить Engine/Validation versions
Status: Accepted

ADR-007 — Campaign Layer (batch runner / summary / report; not Research Engine)
Status: Accepted
File: [`ADR-007-campaign-layer.md`](./ADR-007-campaign-layer.md)

ADR-008 — Deterministic Research Analysis (CampaignReport only; no AI)
Status: Accepted
File: [`ADR-008-deterministic-research-analysis.md`](./ADR-008-deterministic-research-analysis.md)

ADR-009 — Multi-dataset Campaign (orchestration over ResearchCampaignService)
Status: Accepted
File: [`ADR-009-multi-dataset-campaign.md`](./ADR-009-multi-dataset-campaign.md)

ADR-010 — Walk-Forward Architecture (Train/Test Slice orchestration; Aggregate v2; Research Engine unchanged)
Status: Accepted
File: [`ADR-010-walk-forward-architecture.md`](./ADR-010-walk-forward-architecture.md)

ADR-011 — Dataset Slice Architecture (immutable SliceRef; SliceResolver-only construction)
Status: Accepted
File: [`ADR-011-dataset-slice-architecture.md`](./ADR-011-dataset-slice-architecture.md)

ADR-012 — Execution Architecture (single execution entry point; paper adapter; Strategy Runtime separation)
Status: Accepted
File: [`ADR-012-execution-architecture.md`](./ADR-012-execution-architecture.md)

ADR-013 — Event Processing Model (Transactional Outbox/Inbox; durable idempotent events)
Status: Accepted
File: [`ADR-013-event-processing-model.md`](./ADR-013-event-processing-model.md)

ADR-014 — Runtime Lifecycle (Trading Session state machine; fenced leases; restart recovery)
Status: Accepted
File: [`ADR-014-runtime-lifecycle.md`](./ADR-014-runtime-lifecycle.md)

ADR-015 — Accounting Model (Fill → Position → Ledger → Portfolio; decimal source of truth)
Status: Accepted
File: [`ADR-015-accounting-model.md`](./ADR-015-accounting-model.md)

ADR-016 — Risk & Safety Model (mandatory Risk approval; durable Kill Switch; paper-only)
Status: Accepted
File: [`ADR-016-risk-safety-model.md`](./ADR-016-risk-safety-model.md)

ADR-017 — Module Boundaries (RC-16 ownership, inputs, outputs, dependencies, prohibitions)
Status: Accepted
File: [`ADR-017-module-boundaries.md`](./ADR-017-module-boundaries.md)

ADR-018 — Architectural Invariants (immutable execution, event, runtime, accounting, and safety rules)
Status: Accepted
File: [`ADR-018-architectural-invariants.md`](./ADR-018-architectural-invariants.md)

ADR-019 — Event Emission Semantics (application events are infrastructure notifications; Contract B)
Status: Accepted
File: [`ADR-019-event-emission-semantics.md`](./ADR-019-event-emission-semantics.md)
