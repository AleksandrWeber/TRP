# Release History

Date: 2026-08-01

Status: Authoritative living summary of release outcomes

Related:

- [Project Status](./project-status.md)
- [Roadmap](./roadmap.md)
- [Story ID Allocation](./story-id-allocation.md)
- [RC-18 Mid-Release Health Review](./rc-18-mid-release-health-review.md)
- [RC-17 Release Planning](./rc-17-release-planning.md)
- [Architecture Decision Log](../Architecture/ADR/ADL.md)
- ADR Index: [`../adr/README.md`](../adr/README.md)

---

## How to read this table

- **Historical audit verdicts** (e.g. an earlier FAIL) are preserved in the
  linked review documents.
- **Current baseline column** describes how the repository treats that release
  _now_ for planning and implementation.
- Prefer annotations over rewriting past review text.

| Release | Theme                                                                  | Status                | Completion                         | Notes                                                                                                                                                                                                                                                    |
| ------- | ---------------------------------------------------------------------- | --------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RC-14   | Production SaaS foundation                                             | COMPLETE              | Tag `rc-14`                        | Identity, Auth, RBAC, Workspace, Prisma drivers, Queue, Logging, Metrics, Validation, API versioning                                                                                                                                                     |
| RC-15   | Research & Simulation Platform                                         | COMPLETE              | Through US125                      | Market Data → Backtest / Walk-Forward → Portfolio / Trade → Performance → Comparison → Simulation Report                                                                                                                                                 |
| RC-15.1 | Validation Release                                                     | COMPLETE              | Tag `rc-15.1` (`bf46b64`)          | VS001–VS004 fixes integrated; docs synced; quality gates green                                                                                                                                                                                           |
| RC-16   | Paper Trading Platform (architecture + foundation + strategy path)     | **BASELINE ACCEPTED** | M0–M2 + M3 through US223 (E13–E16) | ADR-012…ADR-018 freeze; M1/M2 validated; canonical SignalIntent → CanonicalOrderPath path landed. Historical 2026-07-18 final-release audit remains FAIL for audit trail; residual M3 hooks + M4–M7 product intent **transferred to RC-17** (2026-07-30) |
| RC-17   | Production Readiness & Operational Runtime (Runtime Recovery baseline) | **BASELINED**         | E17 US240–US249 + US244A           | Runtime Recovery reference pipeline Stage 3 + Stage 4 PASS WITH RECOMMENDATIONS. Production restart-safety subject to RC-18 TD-036 mandatory residuals. E18–E21 product epics forwarded to RC-18+                                                        |
| RC-18   | Production Recovery & Operational Readiness                            | **IN PROGRESS**       | US290–US294 Done; US295 Open       | TD-036 R1–R5 closed; US295 ADL-008 remains Open before production restart-safety PASS claims                                                                                                                                                             |
| RC-19   | Spec v2.0 + thin integration hooks                                     | **CLOSED**            | Epics 1–3                          | Exchange Scope, Bot Facade, Tactical Envelope stub — [`rc-19-closure-report.md`](./rc-19-closure-report.md)                                                                                                                                              |
| RC-20   | Command Center foundation                                              | **CLOSED**            | Epics 1–6                          | Ops workspace projections + lifecycle commands — [`rc-20-closure-report.md`](./rc-20-closure-report.md)                                                                                                                                                  |
| RC-21   | Knowledge Lake (projection warehouse)                                  | **CLOSED**            | Epics 1–6 · tag `v1.0.0-rc21`      | Append-only Lake + query port; IDE deferred — [`rc-21-closure-report.md`](./rc-21-closure-report.md)                                                                                                                                                     |
| RC-22   | Strategy Library + library Tactical Envelope (domain)                  | **CLOSED**            | Epics 1–6 · tag `v1.0.0-rc22`      | Certified membership domain; Nest ports deferred — [`rc-22-closure-report.md`](./rc-22-closure-report.md)                                                                                                                                                |

---

## RC-22

| Field         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Theme         | Strategy Library + library Tactical Envelope (domain)                                  |
| Status        | **CLOSED**                                                                             |
| Completion    | Epics 1–6 · tag `v1.0.0-rc22`                                                          |
| Closure       | [`rc-22-closure-report.md`](./rc-22-closure-report.md)                                 |
| Validation    | [`rc-22-validation-report.md`](./rc-22-validation-report.md)                           |
| Certification | [`rc-22-strategy-library-certification.md`](./rc-22-strategy-library-certification.md) |

### Delivered

- Strategy Library boundary and ownership invariants
- Strategy / StrategyVersion immutable domain model
- Certification + evidence refs + library tactical envelope
- Static eligibility gate and deprecate/archive lifecycle history
- Domain certification and Engineering Workflow validation gates green

### Explicitly deferred

- Nest application ports and durable persistence
- Session / Deployment / Orchestrator consumption
- REST / UI / Reporting / AI product surfaces

---

## RC-14

| Field      | Value                      |
| ---------- | -------------------------- |
| Theme      | Production SaaS foundation |
| Status     | COMPLETE                   |
| Completion | `rc-14`                    |

Foundation for multi-tenant workspace operation and platform services used by
later research and paper-trading work.

---

## RC-15 / RC-15.1

| Field      | Value                                       |
| ---------- | ------------------------------------------- |
| Theme      | Research & Simulation Platform + validation |
| Status     | COMPLETE                                    |
| Completion | RC-15 through US125; RC-15.1 tag `rc-15.1`  |

Simulation stack is separate from paper/live trading. Retrospective:
[`rc-15-retrospective-development-guide-v2.md`](./rc-15-retrospective-development-guide-v2.md).

---

## RC-16

| Field      | Value                                                         |
| ---------- | ------------------------------------------------------------- |
| Theme      | Paper Trading Platform                                        |
| Status     | **BASELINE ACCEPTED** (for RC-17)                             |
| Completion | Planning + Freeze + M1 + M2 + M3 canonical path (US211–US223) |

### Delivered (baseline)

- Architecture Freeze: ADR-012…ADR-018 (ADR-019 event emission semantics also Active)
- M1 — Live Market Data Foundation (US126–US152)
- M2 — Durable Paper Order and Accounting Core (US153–US183)
- M3 E13–E16 — Strategy Deployment, Runtime, Signal Intent, CanonicalOrderPath,
  E2E candle → Fill → accounting (US211–US223)
- Pre-M3 gates: TD-034, TD-039, TD-040, TD-042 resolved

### Historical audit (preserved)

On 2026-07-18, before M3 strategy path completion, the final-release review
recorded **FAIL — RC-16 FINAL RELEASE IS NOT READY** because M3–M7 were still
open in the original plan. That document remains the audit record:

[`rc-16-release-summary.md`](./rc-16-release-summary.md)

### Scope transfer (2026-07-30)

Remaining originally planned RC-16 product work was **formally transferred** into
RC-17 planning ownership:

| Original RC-16 intent                                         | RC-17 owner                      |
| ------------------------------------------------------------- | -------------------------------- |
| M3 recovery hooks / validation (hist. “Epic E17” US224–US227) | Epic E17 Runtime Recovery        |
| M4 Risk and Safety Controls                                   | Epic E19 Operations              |
| M5 Recovery and Reconciliation                                | Epic E17 Runtime Recovery        |
| M6 Operations Experience                                      | Epic E19 Operations              |
| Market-data operational hardening beyond M1                   | Epic E20 Market Data             |
| Concurrent multi-strategy operation                           | Epic E21 Multi-Strategy Platform |

RC-16 is therefore the **accepted engineering baseline** for RC-17
implementation. New recovery/ops work proceeds under RC-17, not under a
parallel RC-16 M3–M7 backlog.

Plans: [`rc-16-paper-trading-plan.md`](./rc-16-paper-trading-plan.md),
[`rc-16-m3-strategy-runtime-plan.md`](./rc-16-m3-strategy-runtime-plan.md).

---

## RC-17

| Field            | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| Theme            | Production Readiness & Operational Runtime                             |
| Status           | **BASELINED** (Runtime Recovery reference)                             |
| Completion       | E17 US240–US249 + US244A (2026-07-30)                                  |
| Retrospective    | [`rc-17-retrospective.md`](./rc-17-retrospective.md)                   |
| Technical Review | [`e17-stage-4-technical-review.md`](./e17-stage-4-technical-review.md) |

### Delivered (baseline)

- Planning package (Stages 0–2 authority): release planning, roadmap, process,
  ADL seed, templates, story band US240–US299
- Epic E17 Runtime Recovery Stage 3 reference pipeline:
  discovery → lease → checkpoint → reconcile → READY → event admission →
  arming → evaluate-only → SignalIntent → Session exit / lease release
- US244A pipeline orchestration / bootstrap-safety corrective
- Stage 4 Technical Review: **PASS WITH RECOMMENDATIONS**
- Boundary preservation: Session orchestrator; Runtime via ports; no
  RecoveryCoordinator; Canonical Order Path unchanged

### Scope transfer to RC-18+ (2026-07-30)

Original RC-17 planning epics beyond the Runtime Recovery baseline remain
**forward work** (not closed by this baseline):

| Original RC-17 intent                                                                               | Forward owner                                                    |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| E17 residuals (force-`RECOVERING`, real reconcile adapters, RecoveryState/Incident, chaos evidence) | **RC-18 mandatory** (TD-036) — R1–R4 Done 2026-08-01; R5–R6 open |
| E18 Event Processing                                                                                | RC-18+                                                           |
| E19 Operations (Kill Switch product, operator status, auth leftovers)                               | RC-18+ / E19                                                     |
| E20 Market Data operational hardening                                                               | RC-18+                                                           |
| E21 Multi-Strategy Platform                                                                         | RC-18+                                                           |

### RC-18 mid-release note (2026-08-01)

US290–US293 Implemented. See
[`rc-18-mid-release-health-review.md`](./rc-18-mid-release-health-review.md)
and [`rc-18-residual-register.md`](./rc-18-residual-register.md). Production
restart-safety still requires US294 + US295.

### Production readiness note

RC-17 is the **accepted Runtime Recovery architecture baseline**. Claiming
operators can safely restart continuous paper sessions still requires RC-18
mandatory TD-036 items **US294–US295** (R1–R4 closed at mid-release). ADL-008
remains DEFERRED until those land or an explicit accepted deferral is recorded.

Plans: [`rc-17-release-planning.md`](./rc-17-release-planning.md),
[`rc-17-roadmap.md`](./rc-17-roadmap.md),
[`rc-17-retrospective.md`](./rc-17-retrospective.md).

---

## Version 1 note

Trading Platform **Version 1** (`v1.0.0`) remains the certified production tag
on `main` for the Research/Simulation + foundation stack. RC-16/RC-17 advance
the paper-trading runtime under the Architecture Freeze; they do not rewrite
V1 certification history. See [`../releases/V1-COMPLETION.md`](../releases/V1-COMPLETION.md).
