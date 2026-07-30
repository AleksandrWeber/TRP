# RC-16 M3 — Strategy Runtime Implementation Plan

> **Baseline alignment (2026-07-30):** Epics E13–E16 (US211–US223) are the
> completed RC-16 M3 canonical path and form part of the RC-16 baseline for
> RC-17. The section titled “Epic E17 — Recovery Hooks and M3 Validation”
> (US224–US227) is **historical planning only**. Epic IDs **E17–E21** and
> recovery/validation implementation are owned by **RC-17**. Do not implement
> US224–US227 under those IDs — see
> [`story-id-allocation.md`](./story-id-allocation.md) and
> [`rc-17-roadmap.md`](./rc-17-roadmap.md).
> Release status: [`release-history.md`](./release-history.md).

Task: M3-001  
Date: 2026-07-29  
Milestone: M3 — Strategy Trading Sessions  
Priority: P0  
Type: Architecture / planning only

Status: **READY TO IMPLEMENT**  
Architecture basis: ADR-012…ADR-018 (frozen)  
Phase 0 entry gates: accepted (TD-034, TD-039, TD-040, TD-042 resolved)

---

## Executive Summary

M3 delivers continuous, durable Strategy Runtime on top of the completed M1
live-market foundation and M2 paper Order / Risk / Execution / accounting
core. An approved Strategy Deployment binds to a Trading Session; the Session
owns lifecycle and fencing; Strategy Runtime evaluates closed-candle Market
Events and emits immutable Signal Intents; Orders convert intents through the
existing mandatory Risk → Execution Engine → Paper Adapter → Fill →
Position → Ledger → Portfolio path.

Phase 0 removed parallel Stage-1 tick/direct-fill paths. No new ADR is
required. One Freeze recommendation remains for M3 to resolve in-story:
**name one authoritative Strategy Deployment owner** (answered below:
`strategy-deployment/` owns immutable Deployment configuration; Trading
Session owns runtime state only).

Story IDs start at **US211** to avoid collision with existing research /
Trading Platform V1 stories US184–US210.

---

## Architecture Overview

### Strategy Runtime responsibilities

Per ADR-017, Strategy Runtime:

| Does                                            | Must not                                  |
| ----------------------------------------------- | ----------------------------------------- |
| Load approved Deployment + immutable parameters | Submit/cancel Orders                      |
| Evaluate ordered closed-candle Market Events    | Call Execution Engine or adapters         |
| Persist strategy evaluation checkpoints         | Approve Risk or mutate Kill Switch        |
| Produce immutable, deduplicated Signal Intents  | Mutate Position / Ledger / Portfolio      |
| Emit evaluation diagnostics                     | Use wall-clock as strategy/business input |

Trading Session coordinates lifecycle around Runtime. Orders owns conversion
of Signal Intent → Order Intent and Risk attachment. Execution and accounting
remain unchanged owners from M2.

### Canonical flow (frozen)

```text
Binance public stream
        ↓
Live Market Data (normalized closed candle / mark / health)
        ↓
Trading Session (lease + eligibility + lifecycle)
        ↓
Strategy Runtime (evaluate + checkpoint)
        ↓
Signal Intent (immutable, deduplicated)
        ↓
Orders (Order Intent) → Risk (mandatory Decision)
        ↓ approved
Execution Engine → Paper Execution Adapter → Fill
        ↓
Position → Ledger → Portfolio
```

### Deployment versus Session

| Concept             | Owner module                                        | Nature                                |
| ------------------- | --------------------------------------------------- | ------------------------------------- |
| Strategy Deployment | `strategy-deployment/`                              | Immutable approved configuration      |
| Trading Session     | `trading-session/`                                  | Mutable runtime lifecycle             |
| Strategy Runtime    | `strategy-runtime/`                                 | Evaluation worker under Session lease |
| Signal Intent       | `strategy-runtime/` (produce) → `orders/` (consume) | Immutable command fact                |

Deployment fields (ADR-014): workspace; source Experiment / strategy version;
parameters; instrument; timeframe; market-data source; paper execution
configuration reference; Risk Policy version; code/config provenance hash.

A Deployment may have many Sessions; at most the configured number of
concurrent active Sessions.

### Runtime lifecycle

```text
Operator creates Session against Deployment
  → CREATED
  → start → STARTING
      load Deployment, acquire fenced lease, ensure market subscription,
      load strategy evaluator, verify Risk Policy + Kill Switch inactive,
      reconcile account/Orders/Positions/Portfolio (M3 uses M2 rebuild ports;
      full recovery hardening remains M5)
  → RUNNING
```

While `RUNNING`, the tick model advances only on **semantic closed-candle
Market Events** (not wall-clock `setInterval` as authority — ADR-014/018).

Pause / resume / stop follow ADR-014. `PAUSED`, `RECOVERING`, `STOPPING`,
`STOPPED`, and `FAILED` forbid new Signal Intents and new executable Orders
from strategy origin.

### Session lifecycle (authoritative ADR-014)

```text
CREATED
  ↓ start
STARTING
  ↓ initialized
RUNNING ⇄ PAUSED
  ↓ stop
STOPPING
  ↓ drained
STOPPED

STARTING / RUNNING / PAUSED
  ↓ ownership lost or restart
RECOVERING
  ↓ reconciled
RUNNING or PAUSED

Any active state
  ↓ unrecoverable failure
FAILED
```

M2 already implements durable Session states, leases, and manual eligibility.
M3 extends origin to `strategy`, binds real Deployments, and drives Runtime
under the lease.

### Scheduler / Tick model

**Decision (within frozen ADR-014):** event-driven semantic ticks.

```text
ClosedCandle Market Event (stream-ordered)
  → Session eligibility gate (RUNNING + valid fence + healthy market)
  → Strategy Runtime.evaluate(event, checkpoint, deployment)
  → Signal Intent | NO_ACTION
  → checkpoint advance (same transaction as Intent Outbox when Intent emitted)
```

Operational components allowed (not business authority):

- lease heartbeat timer;
- Outbox dispatcher poller (existing);
- market reconnect/backfill (M1);
- optional lag watchdog that pauses Session on staleness (feeds M4 continuous
  Risk; M3 may pause on unhealthy market status only).

**Prohibited as authority:** US015-style in-memory `setInterval` schedules as
the source of trading decisions. Research Signal Engine / Evaluation Scheduler
remain research surfaces and are not the RC-16 Strategy Runtime.

### Strategy execution pipeline

1. Admit next closed candle after Session checkpoint (per-stream sequence).
2. Verify fencing token + Session `RUNNING` + market healthy/fresh.
3. Load Deployment-bound evaluator + checkpoint strategy state.
4. Evaluate deterministically on semantic inputs only.
5. Map outcome:
   - `HOLD` / no trade → NO_ACTION; advance evaluation checkpoint.
   - actionable signal → build Signal Intent with stable identity.
6. Deduplicate by Signal Intent identity (unique constraint).
7. Persist Intent + Outbox + strategy/session checkpoint atomically.
8. Orders consumer converts Intent → Order Intent (`origin: strategy`),
   runs existing Risk → executable Order → Execution Engine path.
9. Failures: see Failure handling; never bypass Risk or Execution.

### Interaction with Orders

- Strategy Runtime **never** creates Orders.
- New Orders port: `proposeFromSignalIntent(signalIntent)`.
- Extends Order Intent `origin` with `'strategy'` (M2 was `'manual'` only).
- Strategy-origin Orders still require Session fencing, paper mode, and
  mandatory Risk Decision.
- Idempotency: Signal Intent ID / hash is the upstream key; Orders continue
  to own clientOrderId + idempotencyKey uniqueness.

### Interaction with Risk

- M3 reuses M2 baseline Risk Decision path (US165).
- Strategy Runtime does not call Risk.
- Orders attaches Risk before executable transition.
- Execution Engine re-checks unexpired Decision + checkpoints + eligibility.
- Continuous Risk Policy / Kill Switch automation is **M4**; M3 must honor
  existing Kill Switch / rejection semantics and fail closed when Risk or
  checkpoints are unavailable/stale.

### Interaction with Execution Engine

- Unchanged single entry point (ADR-012 / US170).
- Strategy path reaches Execution only through Orders after Risk approval.
- No Runtime → Adapter edge. Architecture tests must forbid that import.

### Failure handling

| Failure                   | Behavior                                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Evaluator throws          | Session → `FAILED` or pause per policy; no Intent; checkpoint not advanced past failed event without durable failure record |
| Duplicate Market Event    | Inbox/semantic dedupe; no second evaluation effect                                                                          |
| Duplicate Signal Intent   | Unique constraint → successful no-op                                                                                        |
| Risk reject               | Order rejected; Session may continue; Intent remains audit fact                                                             |
| Stale/unhealthy market    | No new evaluation/execution; Session may `PAUSED`                                                                           |
| Stale lease / wrong fence | Reject commit; no Intent/Order                                                                                              |
| Outbox/consumer failure   | Retry; Inbox idempotency prevents duplicate Orders/Fills                                                                    |
| Process crash mid-tick    | Restart → `RECOVERING`; resume after reconcile from next unprocessed semantic event                                         |
| Uncertain Order/Fill      | Do not invent; reconcile via existing M2 ports before resume                                                                |

### Runtime state machine

Strategy Runtime worker states (operational, under Session authority):

```text
IDLE
  ↓ Session RUNNING + lease acquired
ARMED
  ↓ closed candle admitted
EVALUATING
  ↓ Intent | NO_ACTION committed
ARMED
  ↓ Session PAUSED / STOPPING / RECOVERING / FAILED
DRAINING → IDLE
```

Authoritative business state remains **Trading Session** status + durable
checkpoints. Worker state is derived and must not outrank Session/lease.

### Restart behavior (M3 minimum)

M3 implements ADR-014 recovery **hooks** sufficient for continuous sessions:

1. On process start, discover non-terminal strategy Sessions.
2. Transition/confirm `RECOVERING`; acquire new fenced lease.
3. Load Deployment, checkpoints, open Orders, accounting, Kill Switch.
4. Call existing reconciliation/rebuild ports; fence on mismatch.
5. Restore market subscription continuity from M1 checkpoints.
6. Resume only from next unprocessed semantic candle.
7. Transition to prior safe intent (`RUNNING` or `PAUSED`).

Deep multi-worker reconciliation hardening, chaos, and sustained recovery
proof remain **M5**. M3 must not resume execution before reconcile.

---

## Implementation Plan

### Required modules

| Module                                              | Role in M3                                                 |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `strategy-deployment/` (**new**)                    | Authoritative immutable Deployment aggregate               |
| `strategy-runtime/` (**new**)                       | Evaluation pipeline, Signal Intent, strategy checkpoints   |
| `trading-session/` (extend)                         | Strategy origin, Deployment binding, runtime authorization |
| `orders/` (extend)                                  | Consume Signal Intent; `origin: strategy`                  |
| `risk/` (reuse)                                     | Mandatory Decision — no policy redesign                    |
| `execution-engine/` + paper adapter (reuse)         | Unchanged path                                             |
| `live-market-data/` (reuse)                         | Closed-candle consumption / health                         |
| `event-processing/` (reuse)                         | Outbox/Inbox/checkpoints                                   |
| `positions/` / `ledger/` / `portfolio/` (reuse)     | Accounting unchanged                                       |
| Research `signal-engine/` / `evaluation-scheduler/` | **Not** RC-16 Runtime; keep isolated                       |

### Required services

- `StrategyDeploymentService` — create/approve/query immutable Deployments
- `StrategyRuntimeService` — evaluate under Session lease
- `SignalIntentApplicationService` / Orders adapter — Intent → Order Intent
- `SessionRuntimeCoordinator` (in Trading Session) — start/pause/resume/stop
  wiring to Runtime port
- `StrategyRuntimeRecoveryService` — startup RECOVERING algorithm (M3 scope)
- Existing: `TradingSessionService`, `OrderService`, Risk evaluate, Execution
  Engine, market status queries

### Required repositories

- `StrategyDeploymentRepository` (PostgreSQL)
- `StrategyCheckpointRepository` (or Session-owned checkpoint rows with
  strategy payload — Session remains lifecycle owner; strategy state payload
  schema owned by Runtime)
- `SignalIntentRepository` (append-only Intent facts + uniqueness)
- Extend `TradingSessionRepository` for strategy origin / checkpoint fields
  already partially present

### Required events (schema-versioned, Outbox)

| Event                                                                                | Producer                 |
| ------------------------------------------------------------------------------------ | ------------------------ |
| `StrategyDeploymentApproved`                                                         | strategy-deployment      |
| `TradingSessionStarted` / `Paused` / `Resumed` / `Stopped` / `Failed` / `Recovering` | trading-session (extend) |
| `StrategyEvaluated` (diagnostics; optional durable)                                  | strategy-runtime         |
| `SignalIntentEmitted`                                                                | strategy-runtime         |
| `SignalIntentDeduplicated` (optional audit)                                          | strategy-runtime         |
| Existing Order / Risk / Fill / accounting events                                     | unchanged                |

### Required APIs

Authenticated JWT + `X-Workspace-Id` + Trader/Admin where mutating:

| Method | Path                                          | Purpose                                                |
| ------ | --------------------------------------------- | ------------------------------------------------------ |
| POST   | `/v1/strategy-deployments`                    | Create draft Deployment from approved strategy/version |
| POST   | `/v1/strategy-deployments/:id/approve`        | Freeze immutable approval                              |
| GET    | `/v1/strategy-deployments`                    | List workspace Deployments                             |
| GET    | `/v1/strategy-deployments/:id`                | Read Deployment                                        |
| POST   | `/v1/trading-sessions`                        | Create Session (`origin: strategy`, deploymentId)      |
| POST   | `/v1/trading-sessions/:id/start`              | STARTING → RUNNING                                     |
| POST   | `/v1/trading-sessions/:id/pause`              | Pause                                                  |
| POST   | `/v1/trading-sessions/:id/resume`             | Resume after reconcile                                 |
| POST   | `/v1/trading-sessions/:id/stop`               | Stop + drain                                           |
| GET    | `/v1/trading-sessions/:id`                    | Status, lease, checkpoints                             |
| GET    | `/v1/trading-sessions/:id/signal-intents`     | Intent history (read)                                  |
| GET    | `/v1/strategy-runtime/:sessionId/diagnostics` | Last evaluation / lag                                  |

Manual Order APIs remain. No Runtime endpoint may place Orders or call
Execution.

### Module dependency diagram (text)

```text
identity/workspace/RBAC
        ↑
live-market-data ─────────────────────────────┐
        ↑                                     │
strategy-deployment ← strategies (read)       │
        ↑                                     │
trading-session ←── lease/lifecycle ──────────┤
        ↑                                     │
strategy-runtime ← market events + deployment │
        │ SignalIntent                        │
        ↓                                     │
     orders ──→ risk (Decision)               │
        │                                     │
        ↓                                     │
execution-engine → paper-adapter ← market read┘
        ↓
      fills → positions → ledger → portfolio

event-processing observes all durable writes
dashboard/API adapters depend only on public ports
```

Forbidden edges:

- strategy-runtime → execution-engine / paper-adapter / positions / ledger
- strategy-runtime → risk (evaluate)
- trading-session → order mutation internals
- dashboard → persistence

### Validation strategy

- Architecture/dependency tests forbidding Runtime → Execution/Risk/accounting
  writes.
- State-machine tests: Session + Runtime worker transitions; invalid rejected.
- Property tests: Signal Intent identity stability; dedupe; checkpoint
  monotonicity.
- Deterministic replay: same ordered closed-candle stream + Deployment ⇒ same
  Intents (and downstream Orders/Fills given M2 determinism).
- PostgreSQL integration: lease fencing, Outbox+Intent atomicity, Inbox
  consumer → Order.
- Failure injection: evaluator throw, stale fence, unhealthy market, Risk
  reject, crash between Intent write and Order consume.
- Authorization: workspace isolation; Trader/Admin on commands.
- Cite ADR-018 invariants 1–2, 19–25, 41, 49–52, 54–56 in story ACs.

### Testing strategy

| Layer         | Focus                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Unit          | Deployment immutability; Intent hashing; evaluator pure functions; transition tables |
| Integration   | Session start→tick→Intent→Order→Risk→Fill→accounting on Postgres                     |
| Concurrency   | Two workers, one lease; stale fence rejected                                         |
| Replay        | Recorded M1 stream fixtures through Runtime                                          |
| Recovery      | Kill process mid-tick; restart RECOVERING; no duplicate Intent/Order/Fill            |
| Perf baseline | Sustained candle throughput for N sessions (practical sizes; full stress in M6/M7)   |
| Conformance   | ADR-012…018 checklist update for M3                                                  |

Mini Validation for full strategy→risk→order→fill remains **after M4** per
plan; M3 exits with its own story gate (historically labeled Epic E17 below),
not final RC-16 release.

> **Ownership update (2026-07-30):** That historical “Epic E17” gate
> (US224–US227) was **not** executed under RC-16. Recovery and validation
> ownership moved to **RC-17 Epic E17** with IDs **US240+**. See
> [`story-id-allocation.md`](./story-id-allocation.md).

---

## User Story Roadmap

### Story ID policy

RC-16 M3 stories: **US211–US235** (historical band).  
Do not reuse US184–US210 (research runner / Trading Platform V1).

**Authoritative allocation (2026-07-30):** [`story-id-allocation.md`](./story-id-allocation.md).
US211–US223 implemented under RC-16. US224–US235 are not an active RC-16
backlog — recovery work uses RC-17 **US240–US299**.

### Epic E13 — Strategy Deployment Foundation

| ID    | Story                                                            | Depends on               |
| ----- | ---------------------------------------------------------------- | ------------------------ |
| US211 | Strategy Deployment domain + persistence + API (**Implemented**) | M2 complete; ADR-014/017 |
| US212 | Durable Deployment persistence + approval freeze                 | Covered by US211         |
| US213 | Deployment query API + workspace authorization                   | Covered by US211         |

### Epic E14 — Signal Intent and Runtime Contracts

| ID    | Story                                                                | Depends on   |
| ----- | -------------------------------------------------------------------- | ------------ |
| US214 | Signal Intent contracts (identity, dedupe, schema) (**Implemented**) | US211        |
| US215 | Strategy checkpoint contracts (**Implemented**)                      | US214        |
| US216 | Strategy Runtime module ports + Nest boundary (**Implemented**)      | US214, US215 |

### Epic E15 — Session ↔ Runtime Integration

| ID    | Story                                                                               | Depends on               |
| ----- | ----------------------------------------------------------------------------------- | ------------------------ |
| US217 | Trading Session strategy origin + Deployment binding (**Implemented**)              | US212, US156/157         |
| US218 | Semantic closed-candle tick admission under lease (**Implemented**)                 | US216, US217, M1 candles |
| US219 | Runtime evaluate → Intent \| NO_ACTION + atomic checkpoint/Outbox (**Implemented**) | US218                    |
| US220 | Session pause/resume/stop drains Runtime safely (**Implemented**)                   | US219                    |

### Epic E16 — Intent → Order → Canonical Execution

| ID    | Story                                                                         | Depends on       |
| ----- | ----------------------------------------------------------------------------- | ---------------- |
| US221 | Orders consume Signal Intent (`origin: strategy`) (**Implemented**)           | US214, US159–164 |
| US222 | Risk + Execution path for strategy-origin Orders (reuse M2) (**Implemented**) | US221, US165–171 |
| US223 | End-to-end strategy candle → Fill → accounting (happy path) (**Implemented**) | US219, US222     |

### Epic E17 — Recovery Hooks and M3 Validation _(historical label — transferred)_

> **Not active under RC-16.** Epic ID **E17** is owned by RC-17
> ([`rc-17-roadmap.md`](./rc-17-roadmap.md)). The stories below were never
> implemented under these IDs; their intent is absorbed by RC-17 E17 (US240+).
> IDs US224–US227 are **transferred / do not implement** —
> [`story-id-allocation.md`](./story-id-allocation.md).

| ID    | Story                                          | Depends on   | Living status           |
| ----- | ---------------------------------------------- | ------------ | ----------------------- |
| US224 | Startup RECOVERING + fence + checkpoint resume | US220, US177 | Transferred → RC-17 E17 |
| US225 | Duplicate/replay/staleness fail-safe tests     | US223, US224 | Transferred → RC-17 E17 |
| US226 | Architecture conformance + dependency guards   | US216–US223  | Transferred → RC-17 E17 |
| US227 | M3 performance baseline + exit review          | US225, US226 | Transferred → RC-17 E17 |

Optional thin stories if needed during decomposition: US228–US235 reserved for
split persistence/API/diagnostics without changing architecture — **retired /
unused** as of 2026-07-30 (see story-id allocation).

### Implementation order

```text
US211 → US212 → US213
              ↘
US214 → US215 → US216 → US217 → US218 → US219 → US220
   ↘________________________↗
                              US221 → US222 → US223
                                                ↓
                                         US224 → US225 → US226 → US227
```

Critical path: Deployment owner → Intent contracts → Runtime ports → Session
binding → semantic tick → Intent persistence → Orders bridge → E2E → recovery
hooks → validation.

### Recommended task decomposition (per story)

1. Domain contracts + invariants cited
2. Persistence + Outbox (if durable write)
3. Application service + ports
4. HTTP adapter (if user-facing)
5. Unit + integration tests
6. Docs sync (Architecture note + CHANGELOG + TD if touched)
7. No scope creep into M4 Kill Switch automation or M5 deep recovery

---

## Risks

| Risk                                                                | Severity | Mitigation                                                                       |
| ------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| Accidental reuse of Signal Engine / Evaluation Scheduler as Runtime | High     | New `strategy-runtime/` module; architecture import tests                        |
| Parallel Trading Platform V1 (`order-engine` etc.) confusion        | High     | M3 stories target RC-16 `orders/` / `execution-engine/` only; document non-goals |
| Duplicate Intents/Orders from retries                               | High     | Intent unique constraints + Inbox + existing Order idempotency                   |
| Wall-clock scheduler authority regresses ADR-014                    | High     | Semantic candle admission only; timers for lease/ops only                        |
| Strategy Deployment ownership ambiguity                             | Medium   | Resolved: `strategy-deployment/` sole owner                                      |
| Resume before reconcile                                             | High     | US224 gates RUNNING on rebuild ports; mismatch fences                            |
| Stale Risk/market checkpoints on strategy Orders                    | Medium   | Reuse M2 fail-closed Decision rules                                              |
| Over-scoping Kill Switch / continuous Risk into M3                  | Medium   | Explicit M4 boundary in story ACs                                                |
| Over-scoping full recovery proof into M3                            | Medium   | M3 hooks only; M5 owns chaos/sustained recovery                                  |
| Evaluator non-determinism                                           | Medium   | Pure functions; fixture replay in US225/US227                                    |

None of these require an ADR change if mitigations hold.

---

## Entry / Exit criteria for M3

### Entry (satisfied)

- [x] ADR-012…ADR-018 frozen and audited
- [x] M1 complete (US126–US152)
- [x] M2 complete (US153–US183)
- [x] Phase 0 / E12 gates: no Stage-1 tick/direct-fill bypass; decimal marks;
      Position fill ordinals; Outbox consumer fan-out progress
- [x] M3-001 implementation plan accepted (this document)

### Exit

> **Baseline alignment (2026-07-30):** Canonical-path exit items through US223
> are satisfied and form the RC-16 M3 baseline. Restart/recovery and full M3
> validation checklist items below that depended on US224–US227 were
> **transferred to RC-17 Epic E17** rather than kept as an open RC-16 backlog.

- [x] Immutable Strategy Deployment owned and API-accessible
- [x] Strategy Sessions start/pause/resume/stop under fenced leases
- [x] Continuous evaluation on live closed candles produces durable Signal
      Intents
- [x] Strategy-origin Orders traverse Risk → Execution Engine → Fill →
      accounting with no bypass
- [ ] Restart places Sessions in RECOVERING and resumes without duplicate
      Intents/Orders/Fills — **transferred to RC-17 E17**
- [ ] Architecture conformance tests green for Runtime boundaries — **partial
      under US216+; residual transferred to RC-17 E17**
- [x] US211–US223 complete; CHANGELOG + docs synchronized for canonical path
- [ ] US224–US227 — **not executed under RC-16; IDs transferred** (see
      story-id allocation)
- [x] No unresolved M3 canonical-path blocker; residual recovery/ops filed
      under RC-17 / TD-036

M3 canonical path does **not** require M4 continuous Risk/Kill Switch
automation, M5 full recovery validation sprint, or M6 Dashboard — those remain
RC-17 scope after the 2026-07-30 transfer.

---

## Recommendations

1. **Implement under frozen ADRs** — no architecture changes.
2. **Create `strategy-deployment/` and `strategy-runtime/`** rather than
   extending research Signal Engine.
3. **Bridge Orders with `origin: 'strategy'`** without altering Execution or
   accounting ownership.
4. **Keep semantic event ticks** as the only evaluation trigger.
5. **Defer continuous Risk/Kill Switch productization to M4** while honoring
   fail-closed checks already present.
6. **Defer deep recovery/chaos to M5** while shipping US224 hooks.
7. **Add dependency lint tests early (US216/US226)** to prevent bypass edges.
8. **Clarify in each story** that Trading Platform V1 modules are out of
   scope for M3 RC-16 Runtime.

---

## Final Verdict

### READY TO IMPLEMENT

Frozen architecture is sufficient. Phase 0 cleared parallel-path blockers.
M2 provides the Order/Risk/Execution/accounting spine. M3 is an integration
and runtime-ownership milestone, not an architecture redesign.

Proceed to US211 (Strategy Deployment domain contracts).

---

## Appendix — Mapping to plan epic groups

| Plan epic group                            | M3 coverage       |
| ------------------------------------------ | ----------------- |
| 3. Strategy Deployment and Approval        | E13               |
| 4. Trading Session Runtime                 | E14–E15, US224    |
| 5–7. Orders / Broker / Accounting          | E16 reuse         |
| 8. Risk and Kill Switch                    | Honor M2; full M4 |
| 9. Recovery and Reconciliation             | M3 hooks; full M5 |
| 10–12. Dashboard / Observability / Release | Later milestones  |
