# RC-18 — Development Process & Engineering Guide

**Engineering workflow for Production Recovery & Operational Readiness**

Date: 2026-08-01

Status: **Approved for RC-18 use** (extends RC-17 Stages 0–6)

Related:

- [RC-17 Development Process](./rc-17-development-process.md) — base lifecycle
- [RC-18 Release Planning](./rc-18-release-planning.md)
- [Product Vision](./trp-product-vision.md) — Level-0 product authority
- [UX Vision](./trp-ux-vision.md) — Level-0 experience authority
- [Mid-Release Health Review](./rc-18-mid-release-health-review.md)
- [Residual Register](./rc-18-residual-register.md)
- [Tech Lead Decision Log](./rc-18-tech-lead-decision-log.md)
- [Release Process](./release-process.md)

---

## Relationship to RC-17 process

RC-18 **reuses** the RC-17 Stages 0–6 lifecycle
([`rc-17-development-process.md`](./rc-17-development-process.md)):

```text
Stage 0  Release Planning
Stage 1  Epic / residual planning
Stage 2  Architecture Review
Stage 3  Implementation
Stage 4  Technical Review
Stage 5  Architecture Health
Stage 6  Retrospective / closeout
```

Hard rules unchanged:

- No production implementation before Stage 2 exit for that workstream.
- ADR-012…ADR-019 frozen; violations require a new ADR.
- Prefer templates under `docs/project/templates/`.

This document adds **RC-18 engineering practices** proven during mandatory
TD-036 residual delivery (US290–US293). Mid-release recommendation: treat them
as **project-standard**.

---

## Proven RC-18 engineering practices (standard)

### 1. Story Specification review

Before coding a residual Story:

- Publish Story Spec as implementation authority (WHAT, not HOW).
- Cite Stage 2 PROCEED constraints and predecessor Stories.
- Cite [Product Vision](./trp-product-vision.md) and [UX Vision](./trp-ux-vision.md)
  (Level-0) where product intent or UX outcomes are material.
- Explicit out-of-scope table (successors / E19 / Freeze).

**Value:** Prevents absorbing US294 chaos, US295 governance, or E19 UX into
implementation Stories.

### 2. Pre-Implementation Verification

Before Stage 3 coding:

- Confirm current code matches the Story gap (not already done; not blocked).
- Confirm module envelope and Freeze constraints.
- Tech Lead records PASS / FAIL (Decision Log).

**Value:** Caught US290 discovery gap (select without force-`RECOVERING`)
before implementation.

### 3. Tech Lead Review

Required for residual Story Specs and Pre-Impl gates. Outcomes go to the
[Tech Lead Decision Log](./rc-18-tech-lead-decision-log.md).

### 4. Recovery Integration Validation (RIV)

After a multi-Story recovery slice that changes open → progress → reconcile
handoffs (e.g. US290–US292), run an **RIV** before claiming subsystem
coherence:

- Full pipeline flow (dual-status)
- Restart behaviour (domain + known gaps)
- Architecture invariants + boundaries
- Persist report under `docs/project/rc-18-riv-*.md`

Reference: [RIV-001](./rc-18-riv-001-recovery-integration-validation.md).

### 5. Safety Integration Validation (SIG)

After a fail-closed / safety residual (e.g. US293), run a **SIG**:

- Ambiguity → Incident → Session FAILED paths
- Restart re-entry blocked
- Ownership invariants (Incident never owns lifecycle/progress)
- Persist report under `docs/project/rc-18-sig-*.md`

Reference: [SIG-001](./rc-18-sig-001-safety-integration-validation.md).

### 6. Milestone Closeout / Mid-Release Health Review

At residual milestones (not only full Release Closure):

- Audit story status, architecture consistency, residual ownership, process
- Sync living docs (project status, roadmap, TD, story-id allocation,
  architecture snapshot, module maturity, release history, CHANGELOG)
- Run format / lint / typecheck / build

Reference: [Mid-Release Health Review](./rc-18-mid-release-health-review.md).

### 7. Residual Register

Maintain explicit ownership for every remaining residual:
[`rc-18-residual-register.md`](./rc-18-residual-register.md). Complements the
TD-036 table; must not invent undocumented mandatory items.

### 8. Tech Lead Decision Log

Chronological engineering gates:
[`rc-18-tech-lead-decision-log.md`](./rc-18-tech-lead-decision-log.md).
Does not supersede ADRs or the ADL.

---

## Recommended Story Stage 3 micro-flow

```text
Story Spec accepted
        ↓
Pre-Implementation Verification (Tech Lead PASS)
        ↓
Stage 3 coding under Freeze
        ↓
Story tests + quality gates
        ↓
RIV and/or SIG when integration/safety scope requires
        ↓
Docs sync (living documents + Residual Register)
        ↓
Next residual Story
```

---

## Documentation sync checklist (per residual / mid-release)

- [ ] CHANGELOG
- [ ] project-status.md
- [ ] roadmap.md
- [ ] architecture-snapshot.md
- [ ] module-maturity.md
- [ ] technical-debt.md (TD-036 rows)
- [ ] residual-register.md
- [ ] release-history.md
- [ ] story-id-allocation.md
- [ ] Story Spec status / DoD / lifecycle
- [ ] Decision Log entry (if gate occurred)

---

## What remains RC-17 Stage 4–6

Full epic Technical Review, Architecture Health, and Retrospective still apply
to product epics E18–E21. Mandatory residuals may use **mid-release health
review** instead of inventing a fake epic Stage 6 for TD-036.

---

## Sign-off

| Role                 | Status                                   | Date       |
| -------------------- | ---------------------------------------- | ---------- |
| Process (docs)       | Recorded from mid-release recommendation | 2026-08-01 |
| Engineering adoption | Recommended standard for RC-18+          | 2026-08-01 |
