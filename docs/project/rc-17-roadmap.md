# RC-17 — Release Roadmap

**Production Readiness & Operational Runtime**

Date: 2026-07-30

Status: **BASELINED** (Runtime Recovery reference — E17 complete for Stage 3/4)

Baseline: RC-16 architecture (ADR-012…ADR-018); Strategy path through US223;
RC-17 E17 US240–US249 + US244A

Related:

- [RC-17 Release Planning](./rc-17-release-planning.md)
- [RC-17 Development Process](./rc-17-development-process.md)
- [RC-17 Retrospective](./rc-17-retrospective.md)
- [Release History](./release-history.md)
- [Story ID Allocation](./story-id-allocation.md) — **authoritative US240–US299**
- [Architecture Decision Log](../Architecture/ADR/ADL.md)
- [Epic Specification Template](./templates/epic-specification-template.md)

---

## Roadmap overview

| Epic | Name                    | Primary ADR focus                                        |
| ---- | ----------------------- | -------------------------------------------------------- |
| E17  | Runtime Recovery        | ADR-014, ADR-018 #19–25                                  |
| E18  | Event Processing        | ADR-013, ADR-018 #11–18, ADR-019                         |
| E19  | Operations              | ADR-016, ADR-017 Dashboard/Audit, ADR-018 #41–48, #58–59 |
| E20  | Market Data             | M1 contracts + ADR-014 semantic ticks, ADR-018 #49–53    |
| E21  | Multi-Strategy Platform | ADR-014 leases, ADR-017 isolation, ADR-018 #20, #54–55   |

**Epic numbering note:** RC-16 M3 planning temporarily labeled recovery-hook
stories US224–US227 as “Epic E17.” RC-17 **owns** Epic IDs E17–E21. Those M3
stories are absorbed into RC-17 E17 (and its validation stories). Do not run a
separate RC-16 “E17” in parallel. IDs US224–US227 are **transferred / do not
implement** — [`story-id-allocation.md`](./story-id-allocation.md).

**Official RC-17 Story ID allocation: US240–US299**
([`story-id-allocation.md`](./story-id-allocation.md)).

Epic sub-bands (soft guidance inside that envelope):

| Epic               | Soft band   |
| ------------------ | ----------- |
| E17                | US240–US249 |
| E18                | US250–US259 |
| E19                | US260–US269 |
| E20                | US270–US279 |
| E21                | US280–US289 |
| Spill / validation | US290–US299 |

Exact titles are assigned during Stage 1 Epic Planning.

---

## Epic E17 — Runtime Recovery

**Status (2026-07-30):** **BASELINED** — Stage 3 reference pipeline US240–US249 +
US244A; Stage 4 PASS WITH RECOMMENDATIONS. Production claim residuals owned by
RC-18 (TD-036). See [`rc-17-retrospective.md`](./rc-17-retrospective.md).

### Objective

Implement the full ADR-014 restart recovery algorithm so non-terminal Trading
Sessions become restart-safe: `RECOVERING` → reconcile → resume from the next
unprocessed semantic market event without duplicate business effects.

### Architectural goal

Make durable Session state, fenced leases, strategy checkpoints, and
accounting reconciliation the sole authority for resume. In-memory timers and
queues remain non-authoritative (ADR-018 #22). Recovery completes before any
new Signal Intent or Order execution (ADR-018 #23–24).

### Expected business value

Operators can restart the API process (deploy, crash, maintenance) without
losing session continuity or creating duplicate paper trades. Confidence in
always-on paper trading becomes operationally real.

### Tentative User Stories

| ID    | Story                                                                                            | Notes                      |
| ----- | ------------------------------------------------------------------------------------------------ | -------------------------- |
| US240 | Startup discovers non-terminal Sessions and forces `RECOVERING`                                  | ADR-014 algorithm step 1   |
| US241 | Acquire new fenced lease; reject stale fence commits                                             | ADR-018 #20–21             |
| US242 | Load Deployment, checkpoints, open Orders, Fills, Position, Ledger, Portfolio, Risk, Kill Switch | Read-only assembly         |
| US243 | Reconcile durable facts vs projections; persist mismatches; block execution on ambiguity         | Reuse M2 rebuild ports     |
| US244 | Restore market subscription; recover stream gaps before evaluate                                 | Ties to E20 contracts      |
| US245 | Resume from next unprocessed semantic event; transition to prior safe intent                     | RUNNING or PAUSED          |
| US246 | Graceful shutdown: reject starts, drain, checkpoint, release lease                               | ADR-014 shutdown           |
| US247 | Duplicate/replay/staleness fail-safe suite                                                       | Absorbs US225 intent       |
| US248 | Architecture conformance + recovery chaos/restart evidence                                       | Absorbs US226–US227 intent |

### Dependencies

- RC-16 M3 through US223 (canonical path)
- TD-036 (primary debt owner)
- M2 reconciliation/rebuild (US177)
- Session lifecycle drain (US220)
- Must not depend on E21 concurrency proofs (single-session first)

### Exit criteria

- [ ] Every non-terminal Session enters `RECOVERING` on startup
- [ ] Reconciliation-before-resume enforced; ambiguity creates Incident and
      blocks execution
- [ ] No duplicate Signal Intents / Orders / Fills after crash mid-path
- [ ] Checkpoint identifies last processed semantic market event
- [ ] Architecture tests prevent Runtime → Execution / Accounting bypass
- [ ] Chaos/restart evidence attached; residual issues filed as TD

---

## Epic E18 — Event Processing

### Objective

Close remaining ADR-013 operational gaps so durable event delivery is
correct under recovery, fan-out, retry, and dead-letter conditions for every
durable consumer on the trading path.

### Architectural goal

Transactional Outbox + Inbox remain the substrate. Every durable consumer
records Inbox idempotency and restart-safe progress (ADR-018 #12, #17).
Application emission failure semantics stay under ADR-019 (notifications ≠
durable facts). No claim of distributed exactly-once delivery (ADR-018 #14).

### Expected business value

Retries and restarts stop being a source of silent double-application or lost
consumer progress. Operators can see stuck deliveries and dead letters instead
of discovering them through incorrect Positions.

### Tentative User Stories

| ID    | Story                                                                        | Notes                  |
| ----- | ---------------------------------------------------------------------------- | ---------------------- |
| US250 | Audit all durable consumers; enforce Inbox + checkpoint coverage             | Architecture test gate |
| US251 | Outbox fan-out ack observability and operator query                          | Builds on TD-042       |
| US252 | Retry policy + dead-letter handling without silent ack                       | ADR-018 #18            |
| US253 | Per-aggregate/stream ordering proofs under concurrent publish                | ADR-018 #15            |
| US254 | Consumer lag / DLQ metrics and health signals                                | Feeds E19              |
| US255 | Failure-injection suite: crash between write and publish; duplicate delivery |                        |
| US256 | Event-processing architecture conformance + docs sync                        |                        |

### Dependencies

- E17 recovery hooks at least far enough that restart exercises consumer
  progress (prefer E17 exit; allow overlap only for pure dispatcher work)
- ADR-013 / ADR-019
- Existing Event Processing module (US128–US130, US155, TD-042)

### Exit criteria

- [ ] Inventory of durable consumers is complete; each has Inbox idempotency
- [ ] Fan-out progress survives restart without skipping unacked consumers
- [ ] Dead letters are durable, queryable, and never silently acknowledged
- [ ] Duplicate delivery tests pass for Orders, Fill accounting, Portfolio, Risk
- [ ] No new message bus or exact-once redesign introduced

---

## Epic E19 — Operations

### Objective

Deliver the operator and safety experience required for production readiness:
continuous Risk monitoring, durable Kill Switch, incidents, alerts, audit, and
dashboard projections over the canonical runtime.

### Architectural goal

Risk owns safety decisions and Kill Switch; Dashboard/Audit consume public
APIs and read models only (ADR-017, ADR-018 #33, #42, #58–59). Continuous Risk
and Kill Switch productize ADR-016 without creating a second execution path.
Safety overrides strategy output (ADR-018 #48).

### Expected business value

Operators can pause risk, kill execution, investigate incidents, and trust
what the UI shows because it reflects durable projections—not a parallel
ledger.

### Tentative User Stories

| ID    | Story                                                                               | Notes                        |
| ----- | ----------------------------------------------------------------------------------- | ---------------------------- |
| US260 | Durable Kill Switch activate/deactivate with auth + reconciliation gate             | ADR-016 / #44–47             |
| US261 | Continuous Risk monitors (limits, staleness, unreconciled block)                    | Fail-closed                  |
| US262 | Safety Incident model + persistence + Outbox                                        |                              |
| US263 | In-app alerts port + replaceable notifier binding                                   | No external channel required |
| US264 | Audit records for commands affecting Session/Risk/Kill Switch                       | ADR-018 #59                  |
| US265 | Operator query APIs: Sessions, Orders, Fills, Positions, Portfolio, Risk, MD health | Extend existing reads        |
| US266 | Dashboard live projections (SSE/WS) — non-authoritative                             | ADR-018 #33                  |
| US267 | Ops Mini Validation: kill, incident, alert, audit flows                             |                              |

### Dependencies

- E17 exit (Kill Switch deactivation requires successful reconciliation)
- E18 health/lag signals strongly preferred
- ADR-016 baseline Risk Decisions (US165) already present
- TD-041 pagination recommended before large Ledger history UIs

### Exit criteria

- [ ] Active Kill Switch blocks new execution and survives restart
- [ ] Deactivating critical Kill Switch requires authorization + reconciliation
- [ ] Continuous Risk rejects stale/incomplete/unreconciled state
- [ ] Incidents and alerts are durable and workspace-scoped
- [ ] Dashboard never recalculates authoritative accounting
- [ ] Ops validation evidence attached

---

## Epic E20 — Market Data

### Objective

Harden Live Market Data for sustained operational runtime: concurrent session
load, gap/backfill correctness, staleness fencing of strategy evaluation, and
operator-visible market health.

### Architectural goal

Preserve M1 contracts (normalized closed candles, mark prices, checkpoints,
Inbox projections). Semantic closed-candle admission remains the only strategy
evaluation trigger (ADR-014 / ADR-018 #25, #49–53). Market Data does not become
a second Runtime or Execution owner.

### Expected business value

Strategies do not silently trade on stale or gapped data. Operators see market
health and recovery progress. Multi-session paper trading shares a resilient
stream without corrupting per-session checkpoints.

### Tentative User Stories

| ID    | Story                                                              | Notes       |
| ----- | ------------------------------------------------------------------ | ----------- |
| US270 | Staleness thresholds fence Session evaluation / Risk as configured | Fail-closed |
| US271 | Gap detection + REST backfill under concurrent Session consumers   |             |
| US272 | Subscription/checkpoint continuity across process restart          | With E17    |
| US273 | Shared stream fan-out to multiple Sessions without cross-talk      | Prep E21    |
| US274 | Operator market status / quarantine / health APIs polish           |             |
| US275 | Recorded-stream replay under multi-subscription fixtures           | Determinism |
| US276 | Market-data operational conformance + performance baseline         |             |

### Dependencies

- M1 complete (US126–US152)
- E17 for restart continuity proofs
- E18 for durable MD projection consumers
- Must not introduce wall-clock authority for business evaluation

### Exit criteria

- [ ] Stale/gapped market state cannot admit strategy ticks that produce new
      Intents while fenced
- [ ] Gap recovery restores READY only after semantic continuity
- [ ] Multi-session consumers share stream safely with isolated checkpoints
- [ ] Deterministic replay fixtures remain green
- [ ] No provider payload leakage outside adapters

---

## Epic E21 — Multi-Strategy Platform

### Objective

Enable multiple approved Strategy Deployments / Trading Sessions to run
concurrently within a workspace under fenced ownership, isolation, and
observable capacity—without forks of the canonical execution path.

### Architectural goal

One CanonicalOrderPath, one Execution Engine, one Accounting model, many
Sessions. At most one fenced runtime owner per Session (ADR-018 #20).
Workspace isolation absolute (ADR-018 #54–55). No new strategy→adapter bypass.

### Expected business value

Teams can paper-trade several approved strategies at once, compare live
behavior, and operate the platform as a multi-strategy lab—not a single-session
prototype.

### Tentative User Stories

| ID    | Story                                                               | Notes                               |
| ----- | ------------------------------------------------------------------- | ----------------------------------- |
| US280 | Concurrent Sessions: lease isolation and command routing            |                                     |
| US281 | Per-Session Signal Intent / Order / checkpoint namespaces           | Already keyed; prove under load     |
| US282 | Shared Risk/Kill Switch interaction policies (workspace vs session) | ADR-016 clarity; may need ADL entry |
| US283 | Capacity limits / admission control for Session starts              | Operational, not business clock     |
| US284 | Fair scheduling of semantic ticks across Sessions                   | No wall-clock business authority    |
| US285 | Cross-session isolation tests (no Workspace A↔B or Session bleed)   |                                     |
| US286 | Multi-strategy Mini Validation + release-prep evidence              |                                     |

### Dependencies

- E17, E18, E20 exit (or accepted partial with explicit risk)
- E19 Kill Switch policy clarified before concurrent RUNNING sessions
- CanonicalOrderPath / Runtime boundaries unchanged

### Exit criteria

- [ ] ≥2 concurrent RUNNING strategy Sessions proven without duplicate or
      crossed effects
- [ ] Lease collision cannot commit work for the losing fence
- [ ] Kill Switch / Risk policies behave per accepted ADL/ADR rules
- [ ] No second execution or accounting path introduced
- [ ] Multi-strategy validation evidence attached

---

## Cross-epic sequencing

```text
E17 Runtime Recovery
        ↓
E18 Event Processing
        ↓
E19 Operations ──────────────┐
        ↓                    │
E20 Market Data              │ (ops reads may start earlier if gated)
        ↓                    │
E21 Multi-Strategy Platform ←┘
        ↓
RC-17 Release Validation
```

---

## Release validation (after E21)

Not a separate epic in this roadmap, but required by
[RC-17 Release Planning DoD](./rc-17-release-planning.md):

- Functional + deterministic replay + invariant + stress + recovery + security
  - architecture + documentation validation
- Explicit pass/fail Release Review
- Tag/cut only on pass with no blockers
