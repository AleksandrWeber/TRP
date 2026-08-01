# RC-17 — Development Process

**Engineering workflow for Production Readiness & Operational Runtime**

Date: 2026-07-30

Status: Approved for RC-17 planning use

Related:

- [RC-17 Release Planning](./rc-17-release-planning.md)
- [RC-17 Roadmap](./rc-17-roadmap.md)
- [Release History](./release-history.md)
- [Story ID Allocation](./story-id-allocation.md)
- [Architecture Decision Log](../Architecture/ADR/ADL.md)
- [Release Process](./release-process.md)
- [RC-18 Development Process](./rc-18-development-process.md) — RC-18 proven practices (RIV/SIG/Residual Register)
- Templates: [`templates/`](./templates/)

---

## Overview

RC-17 work proceeds through seven stages. Stages 3–6 repeat **per epic**.
Stages 0–2 establish release-wide and epic-wide authority before code.

```text
Stage 0  Release Planning
Stage 1  Epic Planning
Stage 2  Architecture Review
Stage 3  Implementation
Stage 4  Technical Review
Stage 5  Architecture Health
Stage 6  Epic Retrospective
        ↑_______________↓  (repeat Stage 1–6 for each epic E17→E21)
RC-17 Release Validation (after final epic)
```

**Hard rules**

- No production implementation before Stage 2 exit for that epic.
- ADR-012…ADR-018 remain frozen; violations require a new ADR, not a story AC.
- Do not modify Runtime / Orders / Risk / Execution / Accounting ownership in
  planning docs or “drive-by” refactors outside accepted stories.
- Prefer templates under `docs/project/templates/` for Stages 4–6 outputs.

---

## Stage 0 — Release Planning

### Purpose

Define release mission, scope, success criteria, risks, dependencies, and
implementation order so later epics do not renegotiate the release.

### Inputs

- RC-16 Paper Trading Plan; M3 Strategy Runtime Plan; Architecture Freeze ADRs
- Project status, technical debt, module maturity, architecture snapshot
- Seeded ADL (RC-16 decisions + RC-17 placeholders)

### Outputs

- `rc-17-release-planning.md` (accepted)
- `rc-17-roadmap.md` (accepted)
- `rc-17-development-process.md` (this document)
- ADL seeded
- Templates available under `templates/`

### Entry criteria

- ADR-012…ADR-018 ACTIVE
- RC-16 baseline understood (M1/M2 complete; M3 canonical path through US223)
- Explicit agreement: planning only — no production code in Stage 0

### Exit criteria

- [ ] Release Planning accepted by engineering owner
- [ ] Roadmap epics E17–E21 have objectives and exit criteria
- [ ] Out of scope and DoD are unambiguous
- [ ] Recommended order recorded
- [ ] Process stages and templates ready for Stage 1

---

## Stage 1 — Epic Planning

### Purpose

Turn one roadmap epic into an implementable specification: stories, ACs,
dependencies, risks, and test strategy — without writing production code.

### Inputs

- Accepted Release Planning + Roadmap epic section
- Relevant ADRs and ADL entries
- Open TD items for the epic
- [Epic Specification Template](./templates/epic-specification-template.md)

### Outputs

- Completed Epic Specification (from template)
- Tentative → assigned User Story IDs
- Proposed ADL entries (status PROPOSED/DEFERRED)
- Story dependency graph and slice order

### Entry criteria

- Stage 0 exit complete
- Prior epic exit complete **or** Architecture Review proves safe parallelism
- Epic owner assigned

### Exit criteria

- [ ] Epic Specification filed and accepted
- [ ] Stories cite ADRs/invariants
- [ ] Out-of-scope list prevents Execution/Accounting redesign
- [ ] Dependencies and risks explicit
- [ ] Ready for Stage 2 (no unresolved planning blocker)

---

## Stage 2 — Architecture Review

### Purpose

Verify the epic extends RC-16 architecture rather than replacing it. Catch
boundary violations, dual paths, and ADR conflicts before implementation.

### Inputs

- Epic Specification
- ADR-012…ADR-018 (+ ADR-019 as needed)
- ADL + proposed entries
- Module maturity / dependency maps
- Architecture Health categories (preview)

### Outputs

- Architecture Review decision: **PROCEED** | **REVISE** | **BLOCKED (needs ADR)**
- Accepted or rejected ADL proposals
- Updated Epic Specification if revised
- Explicit list of modules allowed to change

### Entry criteria

- Stage 1 exit complete
- Reviewer ≠ sole implementer when practical

### Exit criteria

- [ ] PROCEED with recorded constraints
- [ ] No ACTIVE ADR conflict; new ADR opened if required (then pause)
- [ ] Allowed modules / forbidden changes listed
- [ ] Recovery, determinism, Outbox/Inbox impact assessed
- [ ] Implementation may begin (Stage 3)

**Stop rule (from Release Process):** if a story would touch more than three
modules or exceed scope, stop and re-enter Architecture Review.

---

## Stage 3 — Implementation

### Purpose

Deliver accepted User Stories inside frozen architecture: domain, persistence,
application, adapters, tests, and living docs sync.

### Inputs

- Architecture Review PROCEED + Epic Specification
- Story ACs citing ADRs
- Existing module patterns and boundary tests

### Outputs

- Code + tests for the story slice
- Docs sync per [Release Process](./release-process.md)
- TD updates; CHANGELOG as needed
- Commits per team cadence (2–4 stories)

### Entry criteria

- Stage 2 exit for the epic
- Story selected from accepted dependency order

### Exit criteria (per story)

- [ ] ACs met; quality gates green for touched packages
- [ ] Boundary / invariant tests updated when ownership touched
- [ ] No parallel execution path introduced
- [ ] Project status / debt / changelog updated as required
- [ ] Story closed or explicitly split with remaining ACs tracked

### Exit criteria (per epic implementation wave)

- [ ] All committed stories for the epic Done or deferred with TD
- [ ] Ready for Stage 4 Technical Review

---

## Stage 4 — Technical Review

### Purpose

Engineering review of what was built: correctness, tests, operability, debt,
and conformance to the Epic Specification — not a redesign forum.

### Inputs

- Implemented stories + PR/commit set
- Epic Specification and Architecture Review constraints
- [Technical Review Template](./templates/technical-review-template.md)

### Outputs

- Completed Technical Review record
- Required fixes list (blockers vs non-blocking)
- Residual TD proposals

### Entry criteria

- Epic implementation wave complete enough to review (prefer full epic)
- Tests and local quality gates runnable

### Exit criteria

- [ ] Review verdict: **PASS** | **PASS WITH FIXES** | **FAIL**
- [ ] All blockers fixed or epic returned to Stage 3
- [ ] Non-blocking items filed as TD with owners
- [ ] Proceed to Stage 5 only on PASS or PASS WITH FIXES (fixes done)

---

## Stage 5 — Architecture Health

### Purpose

Cross-cutting health check that the epic left the architecture stronger (or
no worse) across recovery, determinism, coupling, and debt — using the shared
checklist.

### Inputs

- Technical Review PASS
- [Architecture Health Template](./templates/architecture-health-template.md)
- ADRs, ADL, boundary tests, replay/recovery evidence

### Outputs

- Completed Architecture Health report
- Category scores / answers with evidence links
- Health blockers vs accepted residual risk

### Entry criteria

- Stage 4 exit complete
- Evidence artifacts available (tests, fixtures, notes)

### Exit criteria

- [ ] All checklist categories answered with evidence
- [ ] No unmet health blocker for the epic exit criteria
- [ ] ADL updated if health review crystallized a decision
- [ ] Proceed to Stage 6

---

## Stage 6 — Epic Retrospective

### Purpose

Capture outcomes, trade-offs, debt, and recommendations before the next epic
starts — so process and architecture lessons compound.

### Inputs

- Epic Specification vs actual delivery
- Technical Review + Architecture Health
- [Epic Retrospective Template](./templates/epic-retrospective-template.md)

### Outputs

- Completed Epic Retrospective
- Recommendations for next epic / release DoD
- TD register updates

### Entry criteria

- Stage 5 exit complete

### Exit criteria

- [ ] Retrospective filed
- [ ] Completed stories listed
- [ ] Architecture decisions / trade-offs / debt recorded
- [ ] Lessons and recommendations explicit
- [ ] Next epic may enter Stage 1 (or Release Validation if E21 done)

---

## After E21 — Release Validation

When Stage 6 completes for Epic E21:

1. Execute RC-17 Release Definition of Done
   ([release planning](./rc-17-release-planning.md)).
2. Publish Release Review (pass/fail).
3. Close or defer all ADL RC-17 placeholders.
4. Sync roadmap, project status, module maturity, version history, CHANGELOG.
5. Tag/cut only on explicit pass with no blockers.

---

## RACI (lightweight)

| Stage                 | Responsible        | Accountable        | Consulted                         |
| --------------------- | ------------------ | ------------------ | --------------------------------- |
| 0 Release Planning    | Release lead       | Architecture owner | Implementers                      |
| 1 Epic Planning       | Epic owner         | Release lead       | Architecture owner                |
| 2 Architecture Review | Architecture owner | Architecture owner | Epic owner                        |
| 3 Implementation      | Story owners       | Epic owner         | Architecture owner (on stop rule) |
| 4 Technical Review    | Reviewer           | Epic owner         | Story owners                      |
| 5 Architecture Health | Architecture owner | Release lead       | Epic owner                        |
| 6 Retrospective       | Epic owner         | Release lead       | Team                              |

---

## Anti-patterns

- Starting Stage 3 from a roadmap bullet without Epic Specification
- “Small” Execution/Accounting redesigns inside recovery stories
- Treating dashboard UI as financial authority
- Claiming epic exit without restart/replay evidence when the epic owns those
  risks
- Opening a second E17 numbering track parallel to RC-17 E17
