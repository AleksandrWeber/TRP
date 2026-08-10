# Architecture Decision Log (ADL)

Date seeded: 2026-07-30

Status: Active (living log)

Scope: Chronological engineering log of how TRP architecture evolves between
releases.

This document is **not** an Architecture Decision Record (ADR).

Related:

- Product Vision (Level-0): [`../../project/trp-product-vision.md`](../../project/trp-product-vision.md)
- UX Vision (Level-0): [`../../project/trp-ux-vision.md`](../../project/trp-ux-vision.md)
- V2 Architecture Decision Log (product↔canonical marriage): [`../../project/v2-architecture-decision-log.md`](../../project/v2-architecture-decision-log.md)
- ADR Index: [`../../adr/README.md`](../../adr/README.md)
- Release History: [`../../project/release-history.md`](../../project/release-history.md)
- Story ID Allocation: [`../../project/story-id-allocation.md`](../../project/story-id-allocation.md)
- RC-17 Release Planning: [`../../project/rc-17-release-planning.md`](../../project/rc-17-release-planning.md)
- RC-17 Roadmap: [`../../project/rc-17-roadmap.md`](../../project/rc-17-roadmap.md)

---

## Purpose

The Architecture Decision Log records **what was decided in practice** as the
system moved from release to release: integrations chosen, boundaries honored,
deferred work, and operational interpretations of frozen ADRs.

Use the ADL to:

- preserve chronology that ADRs intentionally omit;
- explain _how_ ADR-012…ADR-018 were applied during RC-16 / RC-17;
- give Epic Planning and Architecture Review a single narrative spine;
- leave placeholders for upcoming RC-17 decisions before implementation.

Do **not** use the ADL to silently supersede an ADR. Changing ownership,
dependency direction, execution paths, durability guarantees, or invariants
still requires a new ADR (ADR-018 #60).

---

## How ADL differs from ADR

|             | **ADR**                                      | **ADL**                                                                        |
| ----------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| Nature      | Normative decision                           | Chronological engineering log                                                  |
| Authority   | Architecture Freeze; supersession explicit   | Narrative + pointers; cannot override ADR                                      |
| Granularity | Cross-cutting rules                          | Release/epic application choices                                               |
| Lifecycle   | Accepted / Superseded / Deprecated           | Append-only entries with status                                                |
| Audience    | All implementers                             | Release planners, reviewers, operators of the architecture                     |
| Example     | “Execution Engine is the sole adapter entry” | “RC-16 reused existing Execution Engine; CanonicalOrderPath only orchestrates” |

**Rule:** If an ADL entry conflicts with an ACTIVE ADR, the ADR wins and the
ADL entry must be corrected or marked `INVALID`.

---

## Decision template

Copy for each new log entry:

```markdown
### ADL-NNN — Short title

| Field        | Value                                                     |
| ------------ | --------------------------------------------------------- |
| Date         | YYYY-MM-DD                                                |
| Release      | RC-XX                                                     |
| Epic / Story | E?? / US??? (optional)                                    |
| Status       | PROPOSED \| ACCEPTED \| SUPERSEDED \| DEFERRED \| INVALID |
| Related ADRs | ADR-0XX, …                                                |

#### Context

What situation forced a choice?

#### Decision

What did we choose to do (or not do)?

#### Alternatives considered

Brief list.

#### Consequences

Follow-ups, constraints, debt, validation needs.

#### Links

Specs, PRs, TD IDs, architecture notes.
```

---

## Chronological table

| ID      | Date       | Release  | Title                                                     | Status   | Related ADRs          |
| ------- | ---------- | -------- | --------------------------------------------------------- | -------- | --------------------- |
| ADL-001 | 2026-07-18 | RC-16    | Architecture Freeze ADR-012…ADR-018                       | ACCEPTED | ADR-012…018           |
| ADL-002 | 2026-07-29 | RC-16 M3 | Runtime ends after Signal Intent                          | ACCEPTED | ADR-012, 017, 018     |
| ADL-003 | 2026-07-29 | RC-16 M3 | CanonicalOrderPath introduced as orchestration only       | ACCEPTED | ADR-012, 017, 018     |
| ADL-004 | 2026-07-29 | RC-16 M3 | Existing Execution Engine reused                          | ACCEPTED | ADR-012               |
| ADL-005 | 2026-07-29 | RC-16 M3 | Existing Accounting reused                                | ACCEPTED | ADR-015               |
| ADL-006 | 2026-07-29 | RC-16 M3 | Strategy pipeline integrated without forks                | ACCEPTED | ADR-012, 017, 018 #60 |
| ADL-007 | 2026-07-29 | RC-16 M3 | Stage-1 parallel production path retired (TD-034)         | ACCEPTED | ADR-012, 018 #60      |
| ADL-008 | 2026-07-30 | RC-17    | _(placeholder)_ Full ADR-014 recovery algorithm ownership | DEFERRED | ADR-014               |
| ADL-009 | 2026-07-30 | RC-17    | _(placeholder)_ Durable consumer Inbox coverage policy    | DEFERRED | ADR-013, 018 #12      |
| ADL-010 | 2026-07-30 | RC-17    | _(placeholder)_ Kill Switch scope: workspace vs session   | DEFERRED | ADR-016               |
| ADL-011 | 2026-07-30 | RC-17    | _(placeholder)_ Multi-strategy tick fairness policy       | DEFERRED | ADR-014, 018          |
| ADL-012 | 2026-07-30 | RC-17    | _(placeholder)_ Operator projection transport (SSE vs WS) | DEFERRED | ADR-017               |
| ADL-013 | 2026-08-01 | RC-18    | Minimal Session-owned Recovery Incident (provisional→E19) | PROPOSED | ADR-014, US293        |

---

## RC-16 seed entries

### ADL-001 — Architecture Freeze ADR-012…ADR-018

| Field        | Value           |
| ------------ | --------------- |
| Date         | 2026-07-18      |
| Release      | RC-16           |
| Status       | ACCEPTED        |
| Related ADRs | ADR-012…ADR-018 |

#### Context

RC-15 validated simulation but not continuous paper trading. RC-16 required
frozen execution, events, runtime, accounting, risk, boundaries, and
invariants before implementation.

#### Decision

Accept ADR-012…ADR-018 as the Architecture Freeze. Implementation must cite
them; changes require a new ADR.

#### Consequences

RC-16/RC-17 planning extends the freeze; it does not replace it.

---

### ADL-002 — Runtime ends after Signal Intent

| Field        | Value                          |
| ------------ | ------------------------------ |
| Date         | 2026-07-29                     |
| Release      | RC-16 M3                       |
| Epic / Story | E14–E16 / US214–US221          |
| Status       | ACCEPTED                       |
| Related ADRs | ADR-012, ADR-017, ADR-018 #1–2 |

#### Context

Strategy evaluation needed a durable handoff into Orders without letting
Runtime own Order lifecycle or adapter submission.

#### Decision

Strategy Runtime produces immutable, deduplicated **Signal Intents** only.
Runtime **MUST NOT** submit or cancel Orders. Orders intake bridges Intent →
PROPOSED Order (`origin: strategy`).

#### Alternatives considered

- Runtime calls Execution Engine directly — rejected (ADR-012/018).
- Reuse research Signal Engine as Runtime — rejected (separate module).

#### Consequences

Clear one-way dependency Runtime → SignalIntent → Orders. Enforced by
boundary tests.

#### Links

[`050-US214-Signal-Intent.md`](../050-US214-Signal-Intent.md),
[`057-US221-Orders-Signal-Intent-Intake.md`](../057-US221-Orders-Signal-Intent-Intake.md)

---

### ADL-003 — CanonicalOrderPath introduced as orchestration only

| Field        | Value                     |
| ------------ | ------------------------- |
| Date         | 2026-07-29                |
| Release      | RC-16 M3                  |
| Epic / Story | E16 / US222               |
| Status       | ACCEPTED                  |
| Related ADRs | ADR-012, ADR-017, ADR-018 |

#### Context

Strategy-origin and manual PROPOSED Orders needed one shared advance path
through Risk → reservation → Execution without duplicating engine logic.

#### Decision

Introduce `canonical-order-path/` as **orchestration only**. It wires existing
Orders, Risk, cash reservation, and Execution Engine ports. It owns no new
execution semantics and does not import Strategy Runtime.

#### Alternatives considered

- Embed path inside Orders service — deferred to avoid Orders owning Risk/Exec.
- Separate strategy-only pipeline — rejected (fork).

#### Consequences

Single canonical paper path for manual and strategy origins. Boundary spec
required.

#### Links

[`058-US222-Canonical-Risk-Execution-Path.md`](../058-US222-Canonical-Risk-Execution-Path.md)

---

### ADL-004 — Existing Execution Engine reused

| Field        | Value       |
| ------------ | ----------- |
| Date         | 2026-07-29  |
| Release      | RC-16 M3    |
| Epic / Story | E16 / US222 |
| Status       | ACCEPTED    |
| Related ADRs | ADR-012     |

#### Context

M2 already delivered the sole adapter entry and Paper Execution Adapter.

#### Decision

Strategy Orders use the **existing** Execution Engine and Paper Adapter.
No second engine, no strategy-specific adapter, no live broker.

#### Consequences

Fill identity, idempotent submit, and paper-only binding remain M2 contracts.

---

### ADL-005 — Existing Accounting reused

| Field        | Value                   |
| ------------ | ----------------------- |
| Date         | 2026-07-29              |
| Release      | RC-16 M3                |
| Epic / Story | E16 / US223             |
| Status       | ACCEPTED                |
| Related ADRs | ADR-015, ADR-018 #26–40 |

#### Context

E2E strategy fills must update Position, Ledger, and Portfolio identically to
manual fills.

#### Decision

Reuse M2 Fill → Position → Ledger → Portfolio path and atomic Inbox consumer.
No strategy-specific accounting fork.

#### Consequences

Deterministic replay and rebuild remain the financial authority proofs.

#### Links

[`059-US223-Strategy-E2E-Candle-Fill-Accounting.md`](../059-US223-Strategy-E2E-Candle-Fill-Accounting.md)

---

### ADL-006 — Strategy pipeline integrated without forks

| Field        | Value                         |
| ------------ | ----------------------------- |
| Date         | 2026-07-29                    |
| Release      | RC-16 M3                      |
| Epic / Story | E13–E16 / US211–US223         |
| Status       | ACCEPTED                      |
| Related ADRs | ADR-012, ADR-017, ADR-018 #60 |

#### Context

Risk of parallel “strategy trading” stacks (research Signal Engine, Stage-1
production tick, Trading Platform V1 modules).

#### Decision

Integrate Strategy Deployment + Runtime into the **one** RC-16 path:
Deployment → Session → semantic tick → Intent → Orders → CanonicalOrderPath →
Risk → Execution → Fill → Accounting. No forks.

#### Consequences

Trading Platform V1 and research schedulers remain non-goals for Runtime.
TD-034 retirement is mandatory for honesty of this decision (see ADL-007).

---

### ADL-007 — Stage-1 parallel production path retired (TD-034)

| Field        | Value                |
| ------------ | -------------------- |
| Date         | 2026-07-29           |
| Release      | RC-16 M3 gate        |
| Status       | ACCEPTED             |
| Related ADRs | ADR-012, ADR-018 #60 |

#### Context

`ProductionService.tick` / Stage-1 paper adapter bypassed the canonical path
and blocked final architecture honesty.

#### Decision

Retire the Stage-1 parallel execution path. Paper execution proceeds only
through Order → Risk → Execution Engine → Paper Adapter → Fill → accounting.

#### Consequences

TD-034 resolved. Final RC-16/RC-17 conformance no longer tolerates a second
enabled execution path.

---

## RC-17 placeholders

Fill during Stage 1–2 of each epic. Do not invent implementation detail here.

### ADL-008 — Full ADR-014 recovery algorithm ownership _(placeholder)_

| Field        | Value                   |
| ------------ | ----------------------- |
| Date         | 2026-07-30              |
| Release      | RC-17                   |
| Epic         | E17                     |
| Status       | DEFERRED                |
| Related ADRs | ADR-014, ADR-018 #19–25 |

#### Context

M3 shipped Runtime lifecycle drain and checkpoints; full restart recovery
algorithm remains TD-036 / RC-17 E17.

#### Decision

_TBD for production algorithm closure under RC-18._ Expected direction confirmed
by RC-17 baseline: Trading Session owns lifecycle/recovery orchestration;
modules expose reconcile ports; no second lifecycle model via Job queue
(TD-002 clarification). RC-17 BASELINED the Stage 3 reference pipeline
(US240–US249 + US244A). **RC-18 mid-release (2026-08-01):** US290–US293
Implemented (force-`RECOVERING`, real reconcile adapters, RecoveryState,
Incident fail-closed). ADL-008 remains **DEFERRED** until US294 chaos evidence
and US295 promotion (or an explicit accepted deferral) are recorded. See
[`../../project/rc-18-mid-release-health-review.md`](../../project/rc-18-mid-release-health-review.md),
[`../../project/rc-17-retrospective.md`](../../project/rc-17-retrospective.md).

---

### ADL-009 — Durable consumer Inbox coverage policy _(placeholder)_

| Field        | Value                     |
| ------------ | ------------------------- |
| Date         | 2026-07-30                |
| Release      | RC-17                     |
| Epic         | E18                       |
| Status       | DEFERRED                  |
| Related ADRs | ADR-013, ADR-018 #12, #17 |

#### Context

RC-16 audits found uneven per-consumer Inbox/progress discipline for some
runtime consumers.

#### Decision

_TBD._ Expected direction: explicit inventory + architecture tests; no silent
exceptions for “internal” consumers.

---

### ADL-010 — Kill Switch scope: workspace vs session _(placeholder)_

| Field        | Value                   |
| ------------ | ----------------------- |
| Date         | 2026-07-30              |
| Release      | RC-17                   |
| Epic         | E19 / E21               |
| Status       | DEFERRED                |
| Related ADRs | ADR-016, ADR-018 #44–47 |

#### Context

Multi-strategy operation needs a clear rule: does Kill Switch halt a Session,
a workspace, or all paper execution?

#### Decision

_TBD before E21 concurrent RUNNING sessions._ Must remain durable and
fail-closed.

---

### ADL-011 — Multi-strategy tick fairness policy _(placeholder)_

| Field        | Value                   |
| ------------ | ----------------------- |
| Date         | 2026-07-30              |
| Release      | RC-17                   |
| Epic         | E21                     |
| Status       | DEFERRED                |
| Related ADRs | ADR-014, ADR-018 #49–53 |

#### Context

Shared closed-candle streams feeding many Sessions require admission/fairness
without wall-clock business authority.

#### Decision

_TBD._ Semantic event identity remains the business clock.

---

### ADL-012 — Operator projection transport (SSE vs WS) _(placeholder)_

| Field        | Value      |
| ------------ | ---------- |
| Date         | 2026-07-30 |
| Release      | RC-17      |
| Epic         | E19        |
| Status       | DEFERRED   |
| Related ADRs | ADR-017    |

#### Context

M1 used SSE for market projections; operations dashboard may extend the same
pattern or introduce WS. Transport choice must not make the UI authoritative.

#### Decision

_TBD._ Prefer extending existing projection patterns unless Architecture
Review proves otherwise.

---

### ADL-013 — Minimal Session-owned Recovery Incident (provisional → E19)

| Field        | Value                           |
| ------------ | ------------------------------- |
| Date         | 2026-08-01                      |
| Release      | RC-18                           |
| Epic         | TD-036 residual / E17 follow-on |
| Status       | PROPOSED                        |
| Related ADRs | ADR-014, ADR-018                |
| Related      | US293, SIG-001                  |

#### Context

E17 / ADR-014 require fail-closed behaviour on recovery ambiguity. RC-18 US293
delivers a **minimal** durable Recovery Incident owned by Trading Session,
correlated to RecoveryState via `incidentId`, without inventing a Safety
Incident product BC or operator resolve UX (E19).

#### Decision

Until E19 supersedes with richer Safety Incident productization:

1. Persist durable Incident evidence on recovery ambiguity / unrecoverable recovery.
2. Fail-closed order: Incident → RecoveryState `FAILED` + `incidentId` → Session `FAILED`.
3. Incident does not own Session lifecycle or RecoveryPhase.
4. Model is provisional; E19 may migrate/wrap without weakening fail-closed semantics.

Evidence: US293 Implemented; SIG-001 **PASS WITH RESIDUALS**. Formal
promotion / supersession tracked with US295 / E19.

---

## Maintenance rules

1. Append new IDs; do not renumber history.
2. Mark superseded entries `SUPERSEDED` and point to the replacement ADL/ADR.
3. Update the chronological table whenever an entry is added or status changes.
4. RC closeout must resolve or explicitly defer all placeholders for that RC.
5. Link TD items when a decision accepts residual debt.
