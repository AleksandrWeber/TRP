# Engineering Workflow Standard v1.0

**Document:** Engineering Workflow Standard  
**Version:** 1.0  
**Status:** Approved — project standard for all future RCs  
**Date:** 2026-08-10  
**Nature:** How the project is built. Complements Architecture Specification v2.0; does not replace it.  
**Provenance:** Codified from practices proven during RC-19 and RC-20.

**Authority parents:**

| Document                                                                  | Role                                            |
| ------------------------------------------------------------------------- | ----------------------------------------------- |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md) | Architectural constitution (what the system is) |
| [Product Vision](./trp-product-vision.md)                                 | Level-0 product purpose                         |
| [UX Vision](./trp-ux-vision.md)                                           | Level-0 experience rules                        |
| [CANONICAL](../CANONICAL.md)                                              | Level-1 stack, stages, MVP, reproducibility     |
| [Release Process](./release-process.md)                                   | Commit / push / freeze operational rules        |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)               | RC sequence RC-19…RC-28                         |

**Relationship to prior process docs:**

| Document                                                    | Status after this standard                              |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| [RC-17 Development Process](./rc-17-development-process.md) | Historical / reference for Stages 0–6                   |
| [RC-18 Development Process](./rc-18-development-process.md) | Historical / reference for RIV, SIG, residual practices |
| **This document**                                           | **Canonical engineering workflow for RC-21+**           |

If a future RC process note conflicts with this standard, this standard wins until a formal Workflow Update (Section 9).

---

## Purpose

This document defines the **mandatory engineering workflow** for Trading Research Platform (TRP).

It answers:

- How does a Release Candidate (RC) move from vision to git release?
- What must every Epic produce before the next Epic may start?
- Which validation gates close an RC?
- What engineering principles must remain stable?

It does **not** define product features, module ownership, or architectural redesign. Those remain in Spec v2.0 and companions.

---

# Section 1 — Development Lifecycle

Every Release Candidate follows the same lifecycle. Stages are sequential. Later stages must not silently renegotiate earlier approvals.

```text
Vision
  ↓
Architecture
  ↓
Planning
  ↓
API Contract (Backend, when applicable)
  ↓
UI Contract (Frontend, when applicable)
  ↓
Implementation (small Epics)
  ↓
Review
  ↓
Validation
  ↓
Git Release
  ↓
Next RC
```

### Vision

**Purpose:** Establish product intent and experience outcomes for the RC theme.

Cite [Product Vision](./trp-product-vision.md) and [UX Vision](./trp-ux-vision.md) where “what/why” or “how it feels” is material. Vision does not authorize architecture bypass or Freeze violations.

### Architecture

**Purpose:** Confirm the RC stays inside Architecture Specification v2.0, Authority Matrix, Alias Dictionary, and ACTIVE Freeze ADRs (ADR-012…ADR-018).

Architecture work at this stage is **conformance and mapping**, not redesign. If a real ownership gap appears, stop and propose an ADR — do not invent a parallel SoT in the RC plan.

### Planning

**Purpose:** Freeze RC mission, in-scope / out-of-scope, epic breakdown, order, risks, and acceptance criteria before code.

Typical planning artifacts:

- RC Implementation Plan (or Migration Plan)
- Epic Breakdown
- Explicit non-goals and deferred target RCs

**Hard rule:** No production implementation until the Implementation Plan is approved.

### API Contract (Backend, when applicable)

**Purpose:** Lock backend surfaces that Epics will implement or extend — routes, ports, DTOs, facade boundaries, compatibility expectations.

Required when the RC changes or introduces HTTP/API application interfaces, ports, or persistence contracts. Skip only when the RC is frontend-only against an already-stable API.

### UI Contract (Frontend, when applicable)

**Purpose:** Lock frontend interaction constitution — layout regions, projections shown, commands allowed, forbidden behaviours, and projection vs SoT rules.

Required when the RC introduces or materially changes an operator/researcher UI surface. The UI Contract is the implementation guide for all frontend Epics in that RC. If a UI proposal is not in the contract, it is out of scope until the contract is revised.

Example pattern: [RC-20 Command Center UI Contract](./rc-20-command-center-ui-contract.md).

### Implementation (small Epics)

**Purpose:** Deliver the RC as a sequence of small, reviewable Epics — each additive, each bounded, each producing mandatory artifacts (Sections 3–4).

Prefer many thin Epics over one large change set. Each Epic follows Section 2. Parallel Epics are allowed only when dependencies and contracts do not collide; approval still gates continuation.

### Review

**Purpose:** Verify each Epic (and the RC as a whole) against plan, contracts, architecture impact, and Definition of Done — before claiming progress.

Review is mandatory. Informal “looks good, continue” without recorded approval does not count.

### Validation

**Purpose:** Run the full RC Validation Standard (Section 5) before closure.

Validation proves the release candidate is coherent, green, and architecturally honest — not merely that individual Epics compiled.

### Git Release

**Purpose:** Persist the closed RC in version control per Release Policy (Section 7): commit, push (when requested), tag, and documentation updates.

### Next RC

**Purpose:** Hand off to the next roadmap RC only after closure is approved. Do not absorb the next RC’s scope into the current closeout.

---

# Section 2 — Epic Workflow

Every Epic — backend or frontend — follows the same mandatory lifecycle:

```text
Implementation
  ↓
Review
  ↓
Fixes (if required)
  ↓
Approval
  ↓
Next Epic
```

### Implementation

Deliver the Epic slice against the approved RC plan and applicable contracts. Produce the mandatory artifacts for the Epic type (Sections 3–4). Keep scope inside the Epic breakdown; do not absorb successor Epics or deferred RCs.

### Review

Independent check of code, tests, architecture impact, and Epic artifacts against acceptance criteria. Review outcomes must be recorded (Epic note, chat deliverable, or Closure Report reference).

### Fixes (if required)

Address review findings. Re-run focused gates (typecheck, lint, tests) for touched surfaces. Do not start the next Epic while required fixes remain open.

### Approval

Explicit approval that the Epic meets Definition of Done (Section 8).

**Hard rule:** No Epic may continue to the next Epic without approval.

### Next Epic

Begin the subsequent Epic only after Approval. If review rejects the Epic, return to Fixes (or, if scope was wrong, return to Planning / Contract revision — never silently expand).

---

# Section 3 — Backend Standards

Every Backend Epic must produce the following artifacts before Approval.

### Implementation Report

**Purpose:** Record what was delivered — summary of changes, modules touched, ports/APIs affected, tests added, and explicit out-of-scope confirmation.

The Implementation Report is the factual closeout of the Epic. It answers “what shipped?” without redesigning architecture.

### Architecture Impact

**Purpose:** Force an explicit check that the Epic did not drift ownership, introduce a second runtime, or invent a new SoT.

Mandatory block (append to the Epic note):

```text
Architecture Impact

New architectural concepts introduced:
None | <list>

Canonical ownership changed:
None | <list>

New runtime:
None | <description>

Backward compatibility:
100% | <caveats>

Architecture debt introduced:
None | <list>
```

Default expectation for thin evolution Epics: all `None` / `100%` unless a real Spec gap forced otherwise (then stop and report before expanding).

### Compatibility Report

**Purpose:** State compatibility with the frozen paper path, existing APIs, and prior RC behaviour.

Cover at minimum:

- Existing APIs / ports
- Trading Session lifecycle (if touched)
- Recovery / Risk / Ledger paths (if adjacent)
- Migration / backfill behaviour (if persistence changed)

A Compatibility Report may be a dedicated section in the Epic note for small Epics, or a standalone section aggregated at RC closure for multi-Epic backend work.

### Tests Summary

**Purpose:** Evidence that behaviour is covered — unit, integration, and any focused validation specs relevant to the Epic.

List what was added or updated and the gate result (PASS / FAIL). Tests are part of Done, not optional follow-up.

---

# Section 4 — Frontend Standards

Every Frontend Epic must produce the following artifacts before Approval.

### Implementation Report

**Purpose:** Record what UI surfaces shipped — routes/panels, commands wired, projections consumed, and confirmation that business logic stayed in ports (not in the UI).

### Architecture Impact

**Purpose:** Same discipline as backend — UI must not become a second SoT, invent lifecycle, or invent finance.

Use the same Architecture Impact block. Frontend Epics typically expect `None` / `100%` with notes that projections remain non-authoritative.

### Screenshot Review

**Purpose:** Visual and interaction evidence that the UI matches the UI Contract for the Epic slice.

Required for every Frontend Epic that changes visible operator/researcher surfaces. Store screenshots under `docs/project/screenshots/` (or the RC-specific path established for that release) and reference them from the Epic note or Closure Report.

### Projection Contract (only when projections change)

**Purpose:** Document which read models the UI consumes, their source ports/APIs, refresh semantics, and non-authoritative status.

**Required when:** the Epic introduces, replaces, or materially changes projected fields, aggregation, or refresh behaviour.

**Not required when:** the Epic only restyles, rearranges layout within an already-documented projection, or wires commands without changing read models — provided the parent UI Contract already covers those projections.

---

# Section 5 — RC Validation Standard

Before closing an RC, **all applicable gates** must PASS. Abort closure on any failed gate.

| Gate                         | Objective                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| **TypeScript**               | Prove the monorepo typechecks; no silent type debt left as “fix later.”                        |
| **Lint**                     | Prove style and static rules pass; no waived lint failures without recorded exception.         |
| **Unit Tests**               | Prove module-level behaviour for changed and critical paths.                                   |
| **Integration Tests**        | Prove cross-module / API / persistence behaviour for the RC’s integration surfaces.            |
| **Build**                    | Prove production builds succeed for affected packages (api, web, research as applicable).      |
| **Architecture Validation**  | Prove Spec / Authority / Alias / Freeze conformance; no new SoT or duplicate runtime.          |
| **Projection Validation**    | Prove read models remain projections of canonical ports — UI/cache is not authoritative.       |
| **UI Validation**            | Prove UI Contract compliance (when frontend shipped): commands, regions, forbidden behaviours. |
| **Documentation Validation** | Prove plans, contracts, Epic notes, Closure Report, and indexes match what actually shipped.   |
| **Smoke Test**               | Prove critical paths work end-to-end in a running stack (health, auth, key pages/APIs).        |
| **Git Release**              | Persist closure per Section 7; tag and docs updated; no silent local-only “done.”              |

### Gate notes

- Prefer repo scripts (`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`) as the mechanical sources of truth for green/red.
- Architecture, Projection, UI, and Documentation gates are **review + evidence** gates — Closure Report must record PASS with brief rationale.
- Smoke Test may be manual or scripted; record steps and result in the Closure Report.
- Fixture-only fixes required to green typecheck after prior RC fields are allowed during validation; they must not absorb new feature work.

---

# Section 6 — Engineering Principles

These principles are stable. They govern every RC. They must not be casually overridden by Epic convenience.

### Evolution instead of Rewrite

Expand the frozen path with facades, scopes, thin fields, and projections. Do not create a parallel trading stack, second Session lifecycle, or second Risk/Ledger authority.

### Thin Adapters

HTTP, UI, and product aliases adapt to canonical ports. Adapters stay thin. Domain ownership stays where Spec and Freeze place it.

### Single Source of Truth

Each concern has one owner. Session lifecycle, Risk, Ledger, Execution — never duplicated in UI, facades, or “helper” tables that become silent SoTs.

### Read Models are Projections

Dashboards, Command Center panels, notifications, and status strips answer “what is happening now?” as projections. They do not recompute finance or invent durable state.

### UI never owns business logic

The UI may call ports, classify responses for display, and enforce interaction safety (confirm dialogs, disabled states). It must not decide trading, risk, recovery, or ledger truth.

### AI explains but does not decide

Deterministic logic and human approval decide. AI may summarize, explain, and assist research. AI never controls capital and never overrides SoT.

### Documentation is part of the product

Plans, contracts, Architecture Impact, Closure Reports, and this workflow are deliverables — not optional afterthoughts. Undocumented behaviour is unfinished behaviour.

---

# Section 7 — Release Policy

Closing an RC requires the following release process. Steps are sequential unless noted.

### RC Closure

Produce and approve an RC Closure Report: epic delivery table, architecture impact summary, validation gate results, explicit non-goals, and next-RC handoff. Status becomes **CLOSED** only after validation PASS and review approval.

### Git Commit

Create a coherent commit (or commit set) that includes code, tests, and documentation for the closed RC. Follow [Release Process](./release-process.md) commit cadence and hook rules. Do not commit secrets.

### Git Push

Push to remote when explicitly requested by the engineering owner. Do not auto-push. Do not force-push protected branches.

### Version Tag

Tag the release according to project versioning practice when the RC is intended as a recoverable release point. Tag messaging must match Closure Report identity (e.g. RC-20).

### Roadmap Update

Update [V2 Implementation Roadmap](./v2-implementation-roadmap.md) (or successor roadmap) to reflect RC completion and the next active RC.

### Project Status Update

Update [Project Status](./project-status.md): current phase, completed RC, next goal, and links to Closure Report / plans.

### CHANGELOG Update

Update [`CHANGELOG.md`](../../CHANGELOG.md) with user-visible and release-relevant changes for the RC. Move entries from `[Unreleased]` as appropriate.

---

# Section 8 — Definition of Done

### Epic is complete when

1. Implementation matches the approved Epic scope and applicable API / UI Contracts.
2. Mandatory artifacts for the Epic type are written (Sections 3–4).
3. Focused typecheck / lint / tests for touched surfaces PASS.
4. Review is complete; required Fixes are done.
5. **Approval** is recorded.
6. No successor Epic scope was silently absorbed.

### RC is complete when

1. All planned Epics are complete and approved.
2. Explicit non-goals remain out of scope (recorded, not quietly dropped into “done”).
3. RC Validation Standard (Section 5) gates PASS.
4. RC Closure Report is written and approved.
5. Architecture Specification v2.0 (and Freeze ADRs) remain intact unless a new ADR was explicitly accepted.
6. Release Policy steps for documentation (roadmap, project status, CHANGELOG) are done or explicitly scheduled with the Git Release.

### Release is production-ready when

1. The RC (or stable release cut) is **CLOSED** with validation PASS.
2. Git Release is complete (commit + push as required + tag when applicable).
3. No open gate failures or undocumented critical debt blocking the claimed readiness level.
4. Residual items (if any) are registered with explicit ownership and target — not silent skips.
5. Production claims match evidence (e.g. restart-safety PASS requires its governance residuals closed or explicitly deferred).

---

# Section 9 — Future Evolution

This workflow is expected to **remain stable**.

It was extracted from proven RC-19 / RC-20 practice. Stability of process is itself an engineering asset.

### Changing the workflow

Informal process changes are **forbidden**.

Any change to this standard requires:

```text
Proposal
  ↓
Review
  ↓
Approval
  ↓
Workflow Update
```

| Step                | Requirement                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| **Proposal**        | Written proposal describing change, rationale, and impact on RCs in flight |
| **Review**          | Engineering review against Spec / Freeze / existing RC plans               |
| **Approval**        | Explicit approval to amend this standard                                   |
| **Workflow Update** | Version bump (e.g. v1.1), changelog note in this document, index update    |

RC-specific process notes may **add** practices for a single RC (e.g. RIV/SIG for recovery slices) but must not contradict this standard without a Workflow Update.

---

# Workflow Diagram

## RC lifecycle

```text
┌─────────────┐
│   Vision    │  Product / UX intent for the RC theme
└──────┬──────┘
       ↓
┌─────────────┐
│Architecture │  Spec / Authority / Alias / Freeze conformance
└──────┬──────┘
       ↓
┌─────────────┐
│  Planning   │  Implementation Plan + Epic Breakdown + non-goals
└──────┬──────┘
       ↓
┌─────────────┐
│API Contract │  Backend surfaces (when applicable)
└──────┬──────┘
       ↓
┌─────────────┐
│UI Contract  │  Frontend interaction constitution (when applicable)
└──────┬──────┘
       ↓
┌─────────────────────────────────────────┐
│     Implementation (small Epics)        │
│  ┌───────────────────────────────────┐  │
│  │ Impl → Review → Fixes → Approval  │──┼──→ next Epic
│  └───────────────────────────────────┘  │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────┐
│   Review    │  RC-level review of delivery vs plan
└──────┬──────┘
       ↓
┌─────────────┐
│ Validation  │  Section 5 gates (all PASS)
└──────┬──────┘
       ↓
┌─────────────┐
│ Git Release │  Commit · Push · Tag · Docs
└──────┬──────┘
       ↓
┌─────────────┐
│  Next RC    │  Roadmap handoff only after CLOSED
└─────────────┘
```

## Epic lifecycle (mandatory)

```text
Implementation ──→ Review ──→ Fixes? ──→ Approval ──→ Next Epic
                     │           ↑
                     └───────────┘
                   (findings open)

No Approval → no Next Epic
```

---

# Artifact Matrix

| Artifact                        | When required                         | Owner stage          | Purpose                              |
| ------------------------------- | ------------------------------------- | -------------------- | ------------------------------------ |
| Product / UX citation           | When intent or experience is material | Vision               | Bind RC to Level-0 authority         |
| Architecture mapping            | Every RC                              | Architecture         | Conformance, not redesign            |
| Implementation / Migration Plan | Every RC                              | Planning             | Freeze scope before code             |
| Epic Breakdown                  | Every RC                              | Planning             | Small delivery slices                |
| API Contract                    | Backend surfaces change               | API Contract         | Lock ports / APIs / compatibility    |
| UI Contract                     | Frontend surfaces change              | UI Contract          | Lock interaction + projection rules  |
| Implementation Report           | Every Epic                            | Epic closeout        | What shipped                         |
| Architecture Impact             | Every Epic                            | Epic closeout        | Ownership / runtime / debt check     |
| Compatibility Report            | Every Backend Epic                    | Epic / RC closeout   | Frozen-path and API compatibility    |
| Tests Summary                   | Every Backend Epic                    | Epic closeout        | Evidence of coverage                 |
| Screenshot Review               | Every Frontend Epic (visible UI)      | Epic closeout        | Visual/contract evidence             |
| Projection Contract             | Frontend Epic when projections change | Epic closeout        | Read-model source and non-SoT status |
| RC Closure Report               | Every RC                              | Validation / Release | Acceptance record                    |
| Validation gate record          | Every RC                              | Validation           | PASS/FAIL per Section 5              |
| Roadmap / Status / CHANGELOG    | Every RC release                      | Git Release          | Living project truth                 |

---

# Review Checklist

Use this checklist for Epic Approval and RC Closure. All applicable items must be checked.

## A. Epic Review Checklist

### Scope

- [ ] Epic matches approved Epic Breakdown
- [ ] No successor Epic or deferred RC scope absorbed
- [ ] Explicit out-of-scope confirmed

### Contracts

- [ ] API Contract followed (if backend applicable)
- [ ] UI Contract followed (if frontend applicable)
- [ ] Alias Dictionary respected (product labels ≠ new aggregates)

### Artifacts

- [ ] Implementation Report present
- [ ] Architecture Impact block present (`None` / `100%` or justified caveats)
- [ ] Compatibility Report present (backend)
- [ ] Tests Summary present (backend)
- [ ] Screenshot Review present (frontend visible UI)
- [ ] Projection Contract present (only if projections changed)

### Quality

- [ ] Focused typecheck / lint / tests PASS for touched surfaces
- [ ] No new SoT / duplicate runtime / UI-owned business logic
- [ ] Thin adapters only

### Gate

- [ ] Review complete
- [ ] Required Fixes done
- [ ] **Approval recorded** — next Epic may start

## B. RC Closure Checklist

### Delivery

- [ ] All planned Epics approved
- [ ] Non-goals still out of scope
- [ ] Closure Report drafted

### Validation gates

- [ ] TypeScript PASS
- [ ] Lint PASS
- [ ] Unit Tests PASS
- [ ] Integration Tests PASS
- [ ] Build PASS
- [ ] Architecture Validation PASS
- [ ] Projection Validation PASS (if projections shipped)
- [ ] UI Validation PASS (if UI shipped)
- [ ] Documentation Validation PASS
- [ ] Smoke Test PASS

### Release

- [ ] Git Commit prepared / done
- [ ] Git Push when requested
- [ ] Version Tag when applicable
- [ ] Roadmap updated
- [ ] Project Status updated
- [ ] CHANGELOG updated

### Handoff

- [ ] Next RC identified; not started inside this closeout
- [ ] Residuals registered with owners / targets
- [ ] **RC CLOSED** only after approval

---

## Document control

| Version | Date       | Change                                       |
| ------- | ---------- | -------------------------------------------- |
| 1.0     | 2026-08-10 | Initial standard from RC-19 / RC-20 practice |

**STOP.** This document defines process only. No implementation. No architecture redesign.
