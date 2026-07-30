# Epic E17 — Runtime Recovery Specification

**Release:** RC-17  
**Epic:** E17 — Runtime Recovery  
**Date:** 2026-07-30  
**Status:** ACCEPTED (Architecture Review decisions incorporated)  
**Epic owner:** _(assign before US240)_  
**Architecture baseline:** ADR-012…ADR-018 (ACTIVE)  
**Primary debt:** TD-036  
**Story band:** US240–US249 ([story-id-allocation.md](../story-id-allocation.md))  
**Review:** Stage 2 P0 questions resolved in §4.6 (normative for implementation)

Related:

- [RC-17 Roadmap](../rc-17-roadmap.md)
- [RC-17 Development Process — Stage 1](../rc-17-development-process.md)
- [RC-17 Release Planning](../rc-17-release-planning.md)
- [Story ID Allocation](../story-id-allocation.md)
- [Architecture Decision Log](../../Architecture/ADR/ADL.md)
- [ADR-014 Runtime Lifecycle](../../adr/ADR-014-runtime-lifecycle.md)
- [ADR-018 Architectural Invariants](../../adr/ADR-018-architectural-invariants.md)
- [Epic Specification Template](../templates/epic-specification-template.md)
- Historical intent: RC-16 M3 US224–US227 (transferred — do not implement under those IDs)

---

## 1. Executive Summary

Runtime Recovery is required because RC-16 delivered an always-on paper trading
path (Deployment → Session → semantic tick → Signal Intent → Orders → Risk →
Execution → Fill → Accounting) with durable checkpoints and lifecycle **hooks**,
but not the complete ADR-014 restart algorithm. Process restart, deploy, crash,
or lease loss can leave non-terminal Trading Sessions without a single,
authoritative path back to a safe `RUNNING` or `PAUSED` state.

**Problems solved**

- Non-terminal Sessions after process death have no proven
  `RECOVERING → reconcile → resume` algorithm.
- In-memory Runtime worker state (`RuntimeLifecycleCoordinator`) is lost on
  restart and must not become authoritative (ADR-018 #22).
- Mid-path crashes (Intent, Order submit, Fill apply, Outbox dispatch) risk
  duplicate business effects unless recovery is fence-gated and idempotent.
- Operators cannot yet treat “restart the API” as an operationally safe action
  for continuous paper sessions.

**Production value**

Operators can restart the API process (deploy, crash, maintenance) without
losing session continuity or creating duplicate paper trades. Confidence in
always-on paper trading becomes operationally real. E17 is the foundation for
E18 (consumer progress under recovery), E19 (Kill Switch deactivation requires
successful reconciliation), E20 (subscription continuity proofs), and E21
(multi-session isolation under restart).

**Constraint statement**

This epic **extends** ADR-014; it does **not** redesign Orders, Risk,
Execution, Accounting, Market Data, or the Canonical Order Path. Prefer
extension of Trading Session + existing reconcile/checkpoint ports. Introduce
new components only with explicit justification (§8).

---

## 2. Epic Scope

### 2.1 In Scope

- Full ADR-014 restart recovery algorithm for **strategy-origin** (and any
  other) non-terminal Trading Sessions under the RC-16 paper path.
- Force / confirm `RECOVERING` on startup discovery.
- Acquire a **new fenced lease**; reject stale fence commits (ADR-018 #20–21).
- Load durable assembly: Deployment, Session checkpoints, strategy checkpoints,
  open Orders, Fills, Position, Ledger, Portfolio, Risk Decisions / Kill Switch
  state (as available).
- Call existing M2 reconciliation / rebuild ports; persist mismatch records;
  **block execution on ambiguity** and create an Incident.
- Restore market subscription continuity / gap recovery **using existing M1
  contracts** (deep multi-consumer hardening remains E20).
- Resume only from the **next unprocessed semantic market event**; transition
  to prior safe intent (`RUNNING` or `PAUSED`).
- Graceful shutdown: reject new starts, pause intake, drain in-flight work,
  persist checkpoints, shorten/release leases, leave recoverable state.
- Fail-safe suites: duplicate Intent/Order/Fill, replay/staleness, crash
  mid-path, chaos/restart evidence.
- Architecture conformance tests preventing Runtime → Execution / Accounting
  bypass during recovery.
- Persist RecoveryState progress; operator-visible recovery status (read
  models / existing Session APIs — no Dashboard redesign).
- TD-036 closure or honest residual filing; ADL-008 promotion from placeholder.
- Clarify that scheduler/Job queue (TD-002) **must not** create a second
  lifecycle model for recovery.

### 2.2 Out of Scope

- Real-capital / live broker adapters.
- Redesign of Orders, Risk, Execution Engine, Paper Adapter, Positions,
  Ledger, Portfolio ownership or state machines.
- New message bus / distributed exactly-once delivery claims.
- E18 full durable-consumer Inbox inventory and DLQ productization (may be
  **exercised** by E17 restarts; ownership stays E18).
- E19 Kill Switch product UX, continuous Risk monitors, Dashboard SSE/WS
  redesign (Kill Switch **state** must survive and fence recovery; product
  polish is E19).
- E20 multi-session stream fan-out, performance baselines, quarantine UX.
- E21 concurrent multi-strategy capacity / fairness.
- Research OS session recovery (`research-api` / historical replay recovery).
- Trading Platform V1 / `live-trading-engine` `RecoveryManager` as an alternate
  paper path — **do not extend it into a parallel recovery model**.
- Schema migrations that change ADR-owned aggregates without a story + review
  (prefer additive RecoveryState / Incident tables only if required by US249).
- Public API contract redesign beyond additive recovery status fields.

### 2.3 Non-goals (Recovery WILL NOT)

| Non-goal                                                                 | Rationale                                             |
| ------------------------------------------------------------------------ | ----------------------------------------------------- |
| Re-run strategy evaluation for already-checkpointed semantic events      | Would duplicate Signal Intents / Orders               |
| Re-submit Orders already in terminal or acknowledged states              | Canonical path + idempotency owns retries             |
| Re-apply Fills already Inbox-recorded                                    | ADR-015 / ADR-018 #35                                 |
| Invent compensating Ledger entries as a recovery shortcut                | Corrections remain explicit compensating entries only |
| Use wall-clock time as business clock for resume position                | ADR-018 #49–53                                        |
| Bypass Risk for “recovery orders”                                        | ADR-012 / ADR-018 #8, #41                             |
| Make Runtime own Order/Fill/Accounting mutation during recovery          | ADL-002; ADR-018 #1–6                                 |
| Claim distributed exactly-once                                           | ADR-018 #14                                           |
| Auto-create a replacement Session on restart                             | ADR-014: restart retains Session identity             |
| Resume execution while `RECOVERING` or while reconciliation is ambiguous | ADR-018 #23–24                                        |
| Treat in-memory worker / Job queue state as source of truth              | ADR-018 #22; TD-002 clarification                     |

---

## 3. Recovery Objectives

Measurable objectives for Epic E17:

| ID  | Objective                           | Measure                                                                                                                                  |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| O1  | Restart without duplicate execution | Crash mid-tick / mid-path fixtures produce **zero** duplicate Signal Intents, Orders, Fills, or Ledger entries                           |
| O2  | Recover runtime state               | Every non-terminal Session enters `RECOVERING` on process startup before any new evaluation                                              |
| O3  | Recover active session identity     | Same Session ID and generation history retained; no implicit replacement Session                                                         |
| O4  | Preserve determinism                | Recorded-stream replay after recover yields identical Orders/Fills/Positions/Ledger/Portfolio for the same semantic inputs (ADR-018 #52) |
| O5  | Preserve replay authority           | Resume cursor = next unprocessed **semantic** market event ID/sequence from durable checkpoint (ADR-018 #25)                             |
| O6  | Preserve accounting integrity       | Rebuild/reconcile ports pass (or fence) before resume; equity/PnL identities remain satisfied at consistent checkpoint                   |
| O7  | Fence-safe ownership                | Stale lease owner cannot commit runtime or execution work after recovery lease acquisition                                               |
| O8  | Fail closed on ambiguity            | Unreconciled / corrupted / partial durable state → Incident + blocked execution; never silent resume                                     |
| O9  | Graceful shutdown recoverability    | Controlled stop leaves durable checkpoints + released/shortened lease such that cold start recovers without data loss                    |
| O10 | Canonical path unchanged            | Recovery uses the same Order → Risk → Execution → Fill → Accounting path; no recovery-only execution fork                                |

---

## 4. Recovery Lifecycle

Complete lifecycle and transitions. Session status remains the **authoritative**
lifecycle; Runtime worker state is derived and rebuilt after resume.

```text
(any non-terminal Session discovered on process start
 OR ownership lost / restart signal)
        ↓
   SHUTDOWN / CRASH boundary
        ↓
   PERSIST (best-effort on graceful; last durable commit on crash)
        ↓
   RESTART (process boot)
        ↓
   BOOTSTRAP (module wiring; discover Sessions; reject new starts until ready)
        ↓
   RECOVER RUNTIME (per Session)
        ↓
   VALIDATE (reconcile + invariants + kill-switch / risk gates)
        ↓
   RESUME (RUNNING or PAUSED)  OR  FAIL / INCIDENT (blocked)
```

### 4.1 Transition catalog

| #   | From                              | To                                | Trigger                          | Owner                                                         | Guards                                                                                                                                    |
| --- | --------------------------------- | --------------------------------- | -------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | `RUNNING` / `PAUSED` / `STARTING` | graceful intake pause             | Shutdown signal                  | Trading Session + Runtime drain                               | Reject new Session starts; stop new evaluations                                                                                           |
| T2  | In-flight evaluation              | drained                           | Shutdown / pause / stop          | Strategy Runtime (lifecycle coordinator)                      | Await in-flight; no new Intent after drain request                                                                                        |
| T3  | Active Session                    | durable checkpoint written        | Drain complete or periodic       | Trading Session + Strategy Runtime checkpoint ports           | Checkpoint + Outbox same transaction when Intent emitted (existing M3 rule)                                                               |
| T4  | Holding lease                     | lease shortened / released        | Graceful shutdown                | Trading Session (lease)                                       | Fence token recorded; stale owner cannot commit                                                                                           |
| T5  | Process death                     | _(no transition)_                 | Crash                            | —                                                             | Last committed durable state is authority                                                                                                 |
| T6  | Boot                              | Bootstrap complete                | Process start                    | Platform / Session recovery entry                             | No Session evaluation until recovery pass for that Session                                                                                |
| T7  | Non-terminal status               | `RECOVERING`                      | Discovery                        | Trading Session                                               | Invalid if already `STOPPED`/`FAILED`; audit transition                                                                                   |
| T8  | `RECOVERING`                      | lease acquired (new generation)   | CAS/transactional acquire        | Trading Session                                               | Prior fence invalidated                                                                                                                   |
| T9  | `RECOVERING`                      | assembly loaded                   | Read ports                       | Trading Session orchestrates; modules own data                | Read-only; no business mutation yet                                                                                                       |
| T10 | `RECOVERING`                      | reconciled OK                     | Rebuild/reconcile ports          | Positions/Ledger/Portfolio (+ Order/Exec reconcile as needed) | Mismatch → fence, not resume                                                                                                              |
| T11 | `RECOVERING`                      | market continuity ready           | Subscription restore / gap fill  | Live Market Data                                              | Strategy ticks blocked until semantic continuity                                                                                          |
| T12 | `RECOVERING`                      | `RUNNING`, `PAUSED`, or `STOPPED` | Validate + resume intent (S7)    | Trading Session                                               | `resumeIntent` from RecoveryState; Kill Switch forces `PAUSED` if would be `RUNNING` (§4.6); `STOPPED` only when `resumeIntent = STOPPED` |
| T13 | `RECOVERING`                      | `FAILED`                          | Unrecoverable / ambiguous        | Trading Session + Incident record                             | **No new execution**; phase → `FAILED`                                                                                                    |
| T14 | `RUNNING`/`PAUSED`                | next semantic event admitted      | Market event after resume cursor | Strategy Runtime                                              | Fence + Session status + kill switch + reconcile gate                                                                                     |
| T15 | `STOPPING`                        | `RECOVERING`                      | Discovery on restart (S1)        | Trading Session                                               | §4.6 P0-2; `resumeIntent = STOPPED`                                                                                                       |

### 4.2 Per-Session recovery algorithm (normative)

Matches ADR-014 “Restart recovery”; detailed as sequence §4.4 and phases §4.5:

1. Mark/confirm Session `RECOVERING`; persist RecoveryState (`phase = RECOVERING`,
   `preRecoveryStatus`, `resumeIntent` per §4.6).
2. Acquire a **new** fenced lease (new generation/fencing token).
3. Load Deployment, Session/strategy checkpoints, open Orders, Fills, Position,
   Ledger, Portfolio, Risk state, Kill Switch state → enter `VALIDATING`.
4. Validate then reconcile durable facts vs projections (`RECONCILING`);
   persist reconciliation result; on mismatch/ambiguity → Incident + `FAILED`
   (do not proceed to resume).
5. Restore market subscription; recover stream gaps via existing M1 services;
   do not admit strategy evaluation until continuity is READY → phase `READY`.
6. Compute resume cursor = next unprocessed semantic event after last
   checkpointed evaluated event.
7. Apply §4.6 Kill Switch / STOPPING rules to `resumeIntent`; transition Session
   to `RUNNING` \| `PAUSED` \| `STOPPED`; arm Runtime worker with **current**
   fence only after status commit and only when intent is not `STOPPED`.
8. Finalize RecoveryState (`completed` / `failed`); emit durable Session
   lifecycle events via Outbox.

**Invariant:** steps 1–6 complete successfully before any new Signal Intent or
Order execution for that Session (ADR-018 #23–24).

### 4.3 Graceful shutdown algorithm (normative)

1. Reject new Session starts.
2. Pause intake of new strategy evaluations (Session → Runtime drain).
3. Drain in-flight transactions / evaluations.
4. Persist Session + strategy checkpoints (and any in-flight Outbox already
   co-committed).
5. Shorten and/or release leases.
6. Leave Sessions in recoverable non-terminal state (`PAUSED` preferred when
   operator-initiated maintenance; `RUNNING` remaining non-terminal is allowed
   if policy chooses — recovery will force `RECOVERING` on next boot either way).

### 4.4 Recovery Sequence

End-to-end recovery sequence (normative). Session status remains `RECOVERING`
for steps S2–S8; internal **recovery phase** advances per §4.5. No strategy
evaluation or new Order execution until S9 completes.

```text
Bootstrap
    ↓
Discover Session
    ↓
Acquire Lease
    ↓
Load Checkpoint
    ↓
Validate State
    ↓
Reconcile Orders
    ↓
Resume Market Feed
    ↓
Resume Runtime
    ↓
Accept Events
```

| Step | Name                   | Responsibility                                                                                                                                                                                                                 | Owner                                                                | Phase (§4.5)                                                 | Must not                                                                |
| ---- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| S0   | **Bootstrap**          | Wire modules; reject new Session starts until discovery sweep completes for this process; invoke Session Recovery Orchestrator entry.                                                                                          | Platform + Trading Session                                           | —                                                            | Admit strategy ticks before per-Session recovery                        |
| S1   | **Discover Session**   | Find non-terminal Sessions; persist `preRecoveryStatus` + `resumeIntent`; transition Session → `RECOVERING`; open RecoveryState (`phase = RECOVERING`). Apply §4.6 STOPPING / Kill Switch rules when computing `resumeIntent`. | Trading Session                                                      | `RECOVERING`                                                 | Create a replacement Session; skip terminal `STOPPED`/`FAILED`          |
| S2   | **Acquire Lease**      | CAS/transactional acquire of a **new** lease generation/fencing token; invalidate prior fence.                                                                                                                                 | Trading Session                                                      | `RECOVERING`                                                 | Accept stale-fence commits                                              |
| S3   | **Load Checkpoint**    | Load Deployment, Session/strategy checkpoints, open Orders, Fills, Position, Ledger, Portfolio, Risk, Kill Switch into recovery assembly (read-only).                                                                          | Trading Session orchestrates; modules own data                       | `RECOVERING` → enter `VALIDATING`                            | Mutate aggregates; read foreign persistence internals                   |
| S4   | **Validate State**     | Schema/version checks; Intent↔checkpoint legality; required Deployment present; Kill Switch loaded; compute semantic resume cursor candidate.                                                                                  | Trading Session + Strategy Runtime (+ Risk read)                     | `VALIDATING`                                                 | Guess-repair illegal pairs; advance cursor by wall-clock                |
| S5   | **Reconcile Orders**   | Reconcile uncertain Orders via Execution Engine ports; rebuild/reconcile accounting projections vs facts (US177); persist results. On mismatch → Incident + `FAILED`.                                                          | Orders / Execution Engine / Accounting (ports); Session orchestrates | `RECONCILING`                                                | Bypass CanonicalOrderPath; invent compensating Ledger entries           |
| S6   | **Resume Market Feed** | Restore subscription; run M1 gap/startup recovery; wait until semantic continuity READY for this Session’s stream.                                                                                                             | Live Market Data                                                     | `RECONCILING` → `READY` when feed ready **and** reconcile OK | Admit strategy evaluation while stream gapped/stale                     |
| S7   | **Resume Runtime**     | Commit Session exit from `RECOVERING` to `resumeIntent` (`RUNNING` \| `PAUSED` \| `STOPPED`); arm Runtime only with **current** fence after status commit; finalize RecoveryState (`completed`).                               | Trading Session + Strategy Runtime                                   | Exit `READY`                                                 | Arm Runtime while Session still `RECOVERING`; ignore Kill Switch (§4.6) |
| S8   | **Accept Events**      | Admit next semantic market event **after** checkpoint cursor; evaluate → Intent \| NO_ACTION under existing M3 rules.                                                                                                          | Strategy Runtime (+ MD admission)                                    | Post-recovery (Session `RUNNING` only for evaluate)          | Re-evaluate checkpointed event; execute while Kill Switch active        |

**Failure shortcut:** any step S1–S6 that hits ambiguity/corruption → durable Incident, RecoveryState `phase = FAILED`, Session → `FAILED` (or remain non-executable per Incident policy), **no** S7/S8.

**Idempotency:** crash mid-sequence re-enters at S1 for that Session (full algorithm). RecoveryState `lastAttemptedPhase` is diagnostic only — it does **not** skip validate/reconcile.

### 4.4.1 Recovery pipeline contract

Bootstrap ordering must **not** affect recovery behavior. Each stage owns a
public contract and must either:

1. invoke the previous stage through its public contract, or
2. fail deterministically with an explicit outcome.

No stage may rely solely on implicit NestJS hook ordering or cached in-memory
results populated by another bootstrap callback.

| Stage            | Inputs                                           | Prerequisites                                        | Outputs                                                       | Failure outcomes                      |
| ---------------- | ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------- |
| US240 discovery  | persistent Trading Sessions                      | none                                                 | `recovery_candidate` \| `no_recovery_required`                | `no_recovery_required`                |
| US241 lease      | US240 candidate                                  | candidate exists                                     | `LEASE_ACQUIRED` \| `LEASE_DENIED`                            | `LEASE_DENIED`                        |
| US242 checkpoint | US240 candidate + US241 lease                    | `LEASE_ACQUIRED`                                     | `VALID_CHECKPOINT` \| `NO_CHECKPOINT` \| `INVALID_CHECKPOINT` | `NO_CHECKPOINT`, `INVALID_CHECKPOINT` |
| US243 reconcile  | US241 lease + US242 checkpoint                   | `LEASE_ACQUIRED` + `VALID_CHECKPOINT`                | `RECONCILED` \| `RECONCILIATION_FAILED`                       | `RECONCILIATION_FAILED`               |
| US244 resume     | US241 lease + US242 checkpoint + US243 reconcile | `LEASE_ACQUIRED` + `VALID_CHECKPOINT` + `RECONCILED` | `READY` \| `RESUME_BLOCKED`                                   | `RESUME_BLOCKED`                      |

Stage rules:

- Downstream stages must not contact Runtime before prerequisite gating succeeds.
- Failure in any stage stops the pipeline cleanly for that Session.
- Runtime `READY` must still leave the worker idle and not accepting external
  events until later recovery stories explicitly admit them.

### 4.5 Recovery State Machine

Recovery progress is tracked as a **phase** on durable RecoveryState. This is
**not** a second Trading Session lifecycle: while phases run, Session status is
`RECOVERING` (except after successful exit or terminal failure).

#### Phases

| Phase         | Meaning                                                                           | Session status       | Execution / evaluate                   |
| ------------- | --------------------------------------------------------------------------------- | -------------------- | -------------------------------------- |
| `RECOVERING`  | Discovery done (or re-entered); lease acquire + assembly load in progress         | `RECOVERING`         | Forbidden                              |
| `VALIDATING`  | Assembly loaded; schema, checkpoint, Intent legality, Kill Switch, cursor checks  | `RECOVERING`         | Forbidden                              |
| `RECONCILING` | Order/Exec reconcile + accounting rebuild/reconcile + market continuity restore   | `RECOVERING`         | Forbidden                              |
| `READY`       | Validate + reconcile + market continuity succeeded; safe to exit Session recovery | `RECOVERING` (brief) | Forbidden until S7 commits             |
| `FAILED`      | Unrecoverable or ambiguous; Incident recorded                                     | `FAILED`             | Forbidden permanently for this Session |

```text
                    ┌──────────────────────────────────────┐
                    │                                      │
                    ▼                                      │
              RECOVERING ──► VALIDATING ──► RECONCILING ──► READY
                    │              │              │           │
                    │              │              │           │
                    └──────────────┴──────────────┴───────────┘
                                      │
                                      ▼
                                   FAILED

READY ──(S7 success)──► phase cleared / completed
                         Session status → RUNNING | PAUSED | STOPPED
```

#### Legal transitions (deterministic)

| From          | To            | Trigger                                                                                                  |
| ------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| _(none)_      | `RECOVERING`  | S1 discovery / re-entry after crash during recovery                                                      |
| `RECOVERING`  | `VALIDATING`  | Lease acquired + assembly load committed to RecoveryState                                                |
| `VALIDATING`  | `RECONCILING` | Validation passed (cursor candidate + legality OK)                                                       |
| `RECONCILING` | `READY`       | Orders/accounting reconcile OK **and** market continuity READY                                           |
| `RECOVERING`  | `FAILED`      | Lease acquire impossible; missing Deployment; hard I/O corruption                                        |
| `VALIDATING`  | `FAILED`      | Checkpoint corruption; illegal Intent/checkpoint pair; schema mismatch                                   |
| `RECONCILING` | `FAILED`      | Reconcile mismatch; uncertain Order cannot be reconciled; market continuity unrecoverable within policy  |
| `READY`       | `FAILED`      | Exit commit fails after READY (rare); treat as failed recovery attempt — re-entry starts at `RECOVERING` |
| `READY`       | _(completed)_ | S7 Session transition + Runtime arm committed; RecoveryState finalized                                   |

#### Illegal transitions (explicit — must reject and audit)

| Illegal transition                                         | Reason                                                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `VALIDATING` → `RECOVERING`                                | No backward phase moves; crash re-enters via new attempt at `RECOVERING` only                    |
| `RECONCILING` → `VALIDATING` or `RECOVERING`               | Same                                                                                             |
| `READY` → `RECONCILING` / `VALIDATING` / `RECOVERING`      | Same                                                                                             |
| `FAILED` → any non-terminal phase                          | `FAILED` is terminal for this recovery attempt **and** Session; new Session required for trading |
| `FAILED` → `READY`                                         | Never skip failure                                                                               |
| Any phase → `READY` skipping `VALIDATING` or `RECONCILING` | Reconcile-before-resume invariant                                                                |
| `RECOVERING` → `READY`                                     | Skips validate/reconcile                                                                         |
| `VALIDATING` → `READY`                                     | Skips reconcile / market continuity                                                              |
| Phase advance while Session status ∉ {`RECOVERING`}        | Phase machine only runs under Session `RECOVERING`                                               |
| `READY` → accept events / evaluate                         | Events only after Session exits `RECOVERING` (S7/S8)                                             |
| Any phase → emit Signal Intent / submit Order              | ADR-018 #24                                                                                      |

#### Dual status rule

| Layer              | Field                                   | Authority                                              |
| ------------------ | --------------------------------------- | ------------------------------------------------------ |
| Trading Session    | `status` (`RECOVERING` / `RUNNING` / …) | Authoritative lifecycle (ADR-014)                      |
| RecoveryState      | `phase` (`RECOVERING`…`FAILED`)         | Authoritative **progress within** Session `RECOVERING` |
| Runtime worker map | in-memory                               | Non-authoritative (ADR-018 #22)                        |

### 4.6 Architecture Review P0 Decisions (normative)

These decisions are **binding** for US240–US249 implementation. They close the
Stage 2 P0 questions.

#### P0-1 — RecoveryState persistence

| Decision                       | Normative rule                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Store**                      | Dedicated PostgreSQL table implementing `RecoveryStateRepository` (additive migration under **US249**).                                                                                                                                                                                                                                 |
| **Do not**                     | Rely solely on ephemeral in-memory maps, Job queue payloads, or log lines as recovery authority.                                                                                                                                                                                                                                        |
| **May**                        | Mirror a summary on the Session row for query convenience; **RecoveryState row remains source of truth** for phase/progress.                                                                                                                                                                                                            |
| **Required columns (logical)** | `sessionId`, `workspaceId`, `recoveryId`, `recoveryAttempt`, `phase`, `preRecoveryStatus`, `resumeIntent`, `fencingToken` (current), `lastSemanticEventId` (cursor checkpoint ref), `lastAttemptedPhase` (diagnostic), `startedAt`, `updatedAt`, `completedAt` \| `failedAt`, `failureReason`, `incidentId` (nullable), schema/version. |
| **`resumeIntent`**             | Persisted explicitly on RecoveryState at S1 (`RUNNING` \| `PAUSED` \| `STOPPED`). Do not infer solely from live Session status after transition to `RECOVERING`.                                                                                                                                                                        |
| **Incident**                   | Minimal durable Recovery Incident row (or table) referenced by `incidentId`; provisional pending E19 richer Safety Incident (ADL-013).                                                                                                                                                                                                  |
| **Clearing**                   | On successful S7, mark completed (retain for audit) or soft-clear per retention policy — never delete evidence required by US248.                                                                                                                                                                                                       |

#### P0-2 — `STOPPING` Session policy

| Decision                             | Normative rule                                                                                                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discovery**                        | `STOPPING` Sessions **are** discovered and enter recovery (extend Session transition matrix: `STOPPING` → `RECOVERING`).                                                      |
| **`resumeIntent`**                   | Always `STOPPED` — never `RUNNING` or `PAUSED`.                                                                                                                               |
| **Success path**                     | Complete validate/reconcile as needed for integrity → Session `RECOVERING` → `STOPPED`; release lease; Runtime remains idle. **Do not** resume market evaluation for trading. |
| **Ambiguity / mid-drain corruption** | RecoveryState `FAILED` + Session `FAILED` + Incident. No auto-complete to `STOPPED` when drain/checkpoint evidence is incomplete or contradictory.                            |
| **Market feed**                      | Optional continuity check for integrity only; S7 for `resumeIntent = STOPPED` skips Runtime arm and Accept Events.                                                            |
| **Rationale**                        | Operator already requested stop; crash must not resurrect trading. Completing stop when safe preserves ADR-014 terminal semantics.                                            |

Required Session transition extensions (US240/US245):

- Allow `STOPPING` → `RECOVERING`
- Allow `RECOVERING` → `STOPPED` **only when** `resumeIntent = STOPPED`

Illegal: `resumeIntent = STOPPED` then `RECOVERING` → `RUNNING` / `PAUSED`.

#### P0-3 — Kill Switch interaction

| Decision                                                | Normative rule                                                                                                                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **During recovery**                                     | Kill Switch state is loaded in S3/S4; it does **not** skip validate/reconcile. Active Kill Switch never authorizes new executable Orders.                                                               |
| **`resumeIntent` adjustment**                           | If computed `resumeIntent` would be `RUNNING` **and** Kill Switch is active at S7 → **force `PAUSED`**. Persist the adjustment on RecoveryState (`resumeIntent = PAUSED`, reason `kill_switch_active`). |
| **If `resumeIntent` was already `PAUSED` or `STOPPED`** | Unchanged by Kill Switch.                                                                                                                                                                               |
| **After resume**                                        | Active Kill Switch continues to block new execution (ADR-018 #44–45). Session may be `PAUSED` while switch is on — clearer operator signal than `RUNNING` with hidden block.                            |
| **Deactivation**                                        | Not productized in E17; must still require authorization + successful reconciliation when E19 lands. E17 must not add a recovery bypass that clears Kill Switch.                                        |

---

## 5. Recovery Ownership

Ownership is **explicit**. Trading Session **orchestrates** recovery; it does
**not** absorb other modules’ aggregates.

| Responsibility                                                         | Owning bounded context                                                 | Notes                                                                |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Discover non-terminal Sessions; force `RECOVERING`; prior safe intent  | **Trading Session**                                                    | ADR-014 Session ownership                                            |
| Persist RecoveryState progress / recovery metadata                     | **Trading Session**                                                    | Existing `RecoveryStateRepository` contract → implement in E17       |
| Lease acquire / heartbeat / fencing token                              | **Trading Session**                                                    | Extend existing lease; no second lease system                        |
| Orchestrate recovery steps (call ports in order)                       | **Trading Session** (Session Recovery Orchestrator)                    | Coordinator **inside** Session module — **not** a new BC (§8)        |
| Strategy checkpoint load/validate; Runtime worker arm/drain            | **Strategy Runtime**                                                   | Checkpoints owned by Runtime payload; Session owns lifecycle         |
| Signal Intent uniqueness / no re-emit for checkpointed events          | **Strategy Runtime**                                                   | ADR-018 #2                                                           |
| Open Order load; Order state machine; idempotent commands              | **Orders**                                                             | Recovery never mutates Order internals except via existing commands  |
| Risk Decision validity / Kill Switch durable state read                | **Risk**                                                               | Recovery does not redefine policy; fail-closed on stale/unreconciled |
| Adapter/order reconcile commands; Fill facts                           | **Execution Engine** (+ Paper Adapter)                                 | Sole adapter entry; recovery retries use same entry                  |
| Position rebuild, Ledger truth, Portfolio projection reconcile         | **Positions / Ledger / Portfolio** (Accounting)                        | Reuse US177 rebuild/reconcile ports                                  |
| Market subscription restore, gap recovery, market checkpoints          | **Live Market Data**                                                   | Existing US139/US142 services; E17 consumes contracts                |
| Outbox publish of Session recovery events; Inbox for durable consumers | **Event Processing**                                                   | Substrate only; consumer coverage gaps → E18                         |
| Incident record on ambiguity / unrecoverable recovery                  | **Trading Session** (minimal) until E19 Safety Incident productization | Must be durable; E19 may supersede richer Incident model via ADL     |
| Operator read of Session/recovery status                               | **Trading Session** public API / read model                            | Dashboard remains non-authoritative (ADR-018 #33, #58)               |
| Job/scheduler dequeue                                                  | **Must not own recovery lifecycle**                                    | TD-002: no second lifecycle via Job queue                            |

### 5.1 Recovery Coordinator decision

| Option                                          | Decision                                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| New bounded context “Recovery”                  | **Rejected** — would split ADR-014 Session ownership and invite a parallel lifecycle      |
| Session-owned **Recovery Orchestrator** service | **Accepted** — thin orchestration that calls module ports; lives under `trading-session/` |
| Reuse `live-trading-engine.RecoveryManager`     | **Rejected** for RC-16/RC-17 paper path — alternate stack; do not fork                    |

---

## 6. Recovery Invariants

These become **mandatory Stage 2 / Technical Review items**. Citations are to
ADR-018 unless noted.

| #   | Invariant                                                                                                                                    | Source           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| R1  | No duplicated Signal Intents for the same semantic evaluation identity                                                                       | #2               |
| R2  | No duplicated Orders from recovery or at-least-once redelivery                                                                               | #9               |
| R3  | No duplicated Fills                                                                                                                          | #9, #35          |
| R4  | No duplicated Ledger entries for the same Fill cause                                                                                         | #27–28, #35, #40 |
| R5  | Replay of the same ordered semantic stream + config remains deterministic                                                                    | #52              |
| R6  | Canonical order path unchanged; recovery uses same Execution Engine entry                                                                    | ADR-012; #4–6    |
| R7  | Recovery never executes business logic twice for a completed semantic step                                                                   | ADR-014; #23     |
| R8  | Recovery and reconciliation complete before execution resumes                                                                                | #23              |
| R9  | Session `RECOVERING` and all recovery phases (`RECOVERING`…`READY`) create no new execution; `STOPPING`/`STOPPED`/`FAILED`/`PAUSED` likewise | #24; §4.5        |
| R10 | At most one fenced runtime owner; stale fence commits rejected                                                                               | #20–21           |
| R11 | In-memory timers/queues/worker maps are non-authoritative                                                                                    | #22              |
| R12 | Checkpoints identify last processed semantic market event                                                                                    | #25              |
| R13 | Deployment configuration remains distinct from Session runtime state                                                                         | #19              |
| R14 | Active Kill Switch blocks new execution after resume                                                                                         | #44–45           |
| R15 | Risk rejects stale/incomplete/unreconciled state                                                                                             | #43              |
| R16 | Runtime does not submit/cancel Orders or mutate accounting during recovery                                                                   | #1, #6, #30      |
| R17 | Wall-clock may expire leases only; never choose resume cursor or PnL                                                                         | #49–53           |
| R18 | Ambiguity → Incident + blocked execution; never silent skip                                                                                  | ADR-014          |
| R19 | Session identity retained across recover; no implicit replacement Session                                                                    | ADR-014          |
| R20 | Outbox events for Session recovery transitions use transactional Outbox                                                                      | #11              |

---

## 7. Failure Scenarios

For each scenario: expected behaviour, recovery path, failure policy.

### 7.1 Unexpected shutdown (SIGKILL / power loss)

|                    |                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------- |
| **Expected**       | Last committed durable state is authority; in-flight uncommitted work discarded               |
| **Recovery path**  | Boot → discover → `RECOVERING` → lease → load → reconcile → market continuity → resume cursor |
| **Failure policy** | If last commit left projections inconsistent → reconcile mismatch → Incident + block          |

### 7.2 Crash during execution (Order submitted / adapter in flight)

|                    |                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Expected**       | Order + Execution Engine idempotency and adapter reconcile determine truth; no second submit for same client order ID                  |
| **Recovery path**  | After Session recover gates, Execution Engine reconcile commands for open/uncertain Orders (existing ports); then resume market cursor |
| **Failure policy** | Uncertain adapter state that cannot be reconciled → Incident + block new execution for Session (fail closed)                           |

### 7.3 Crash before execution (Intent persisted, Order not yet advanced)

|                    |                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Expected**       | Durable Intent remains; Orders intake / CanonicalOrderPath continues idempotently; Runtime does **not** re-evaluate the same candle to emit a second Intent |
| **Recovery path**  | Checkpoint proves event already evaluated → resume **next** event; downstream path processes existing Intent exactly once at business boundary              |
| **Failure policy** | Missing Intent uniqueness constraint → treat as architecture defect (block release)                                                                         |

### 7.4 Crash after Fill (Fill persisted, accounting not applied)

|                    |                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Expected**       | At-least-once Fill event delivery; Positions Inbox applies Fill at most once (ADR-015 atomic apply)       |
| **Recovery path**  | Event Processing redelivers; Inbox no-op if already applied; reconcile confirms projections               |
| **Failure policy** | Partial non-atomic apply must be impossible by existing M2 tests; if observed → severity blocker Incident |

### 7.5 Crash during Accounting (mid-transaction)

|                    |                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------- |
| **Expected**       | Transaction rolls back entirely (Inbox + Position + Ledger + Outbox + checkpoint)      |
| **Recovery path**  | Redeliver Fill event; apply once; reconcile                                            |
| **Failure policy** | Detected partial rows outside a transaction → Incident + block (data corruption class) |

### 7.6 Partial persistence (checkpoint advanced without Intent, or Intent without checkpoint)

|                    |                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Expected**       | M3 rule: Intent + Outbox + checkpoint atomic when Intent emitted; NO_ACTION advances checkpoint without Intent                  |
| **Recovery path**  | Detect illegal pairs during assembly validation                                                                                 |
| **Failure policy** | Ambiguous pair → Incident + block; do not guess which side to repair automatically in E17 (no silent heal that could duplicate) |

### 7.7 Checkpoint corruption (unreadable / schema mismatch / impossible cursor)

|                    |                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Expected**       | Schema version checked; invalid payload rejected                                                             |
| **Recovery path**  | Remain `RECOVERING` or transition `FAILED`; Incident with durable reason                                     |
| **Failure policy** | **No** execution; operator intervention required; no auto-rewind that reprocesses completed business effects |

### 7.8 Crash during `RECOVERING` itself

|                    |                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Expected**       | Recovery is idempotent; re-entry safe                                                                                   |
| **Recovery path**  | Re-discover Session still non-terminal / `RECOVERING`; re-acquire lease (new generation); restart algorithm from step 1 |
| **Failure policy** | RecoveryState may show `started` without `completed` — treat as incomplete; never skip reconcile                        |

### 7.9 Lease loss while RUNNING (expiry / fencing)

|                    |                                                                                   |
| ------------------ | --------------------------------------------------------------------------------- |
| **Expected**       | Session enters recovery path; stale owner commits rejected                        |
| **Recovery path**  | Same as restart recovery with new fence                                           |
| **Failure policy** | Dual-owner suspicion → fence + Incident if durable evidence of split-brain writes |

### 7.10 Kill Switch active across restart

|                    |                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Expected**       | Kill Switch state durable; recovery still runs full validate/reconcile; new execution remains blocked                         |
| **Recovery path**  | Load Kill Switch in S3/S4; if `resumeIntent` would be `RUNNING`, force `PAUSED` at S7 (§4.6 P0-3); do not arm executable path |
| **Failure policy** | Deactivation requires auth + successful reconciliation (E19 product gate); E17 must not clear or bypass Kill Switch           |

---

## 8. Architecture Boundaries

### 8.1 Existing components reused (no semantic redesign)

| Component                                                        | Role in E17                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| Trading Session aggregate + state machine                        | `RECOVERING` transitions, lease, eligibility               |
| Strategy Runtime checkpoints, Intent uniqueness, lifecycle drain | Resume cursor + drain on shutdown                          |
| Live Market Data startup/gap recovery (US139/US142)              | Stream continuity                                          |
| Orders / Execution Engine reconcile + idempotent submit          | Uncertain execution recovery                               |
| Positions `AccountingRebuildService` / reconciliation (US177)    | Projection vs facts                                        |
| Event Processing Outbox/Inbox/checkpoints                        | Durable Session events + consumer idempotency              |
| Risk Kill Switch + Decision read models                          | Fail-closed gates                                          |
| CanonicalOrderPath                                               | Unchanged orchestration for any post-recover Order advance |

### 8.2 Existing components extended

| Component                     | Extension                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Trading Session               | Startup discovery hook; Recovery Orchestrator; RecoveryState persistence; graceful shutdown coordination; recovery status reads |
| Strategy Runtime              | Recovery-safe arm only after Session exit from `RECOVERING`; prove no evaluate while recovering                                 |
| Boundary / architecture tests | Guards against recovery bypass edges                                                                                            |
| Session Outbox events         | Ensure `Recovering` / recovered transitions are durable                                                                         |

### 8.3 New components (only if necessary)

| Proposed                                                              | Justification                                                                                                                                                      | Alternative rejected                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| **Session Recovery Orchestrator** (service inside `trading-session/`) | ADR-014 requires a single algorithm owner; Session already owns lifecycle. Thin port-calling orchestrator avoids scattering recovery across Runtime/MD/Accounting. | New `recovery/` BC — splits ownership                 |
| **RecoveryState PostgreSQL repository** implementing existing port    | Port already exists without infrastructure; needed for progress + crash-during-recovery idempotency                                                                | Encode only in Session JSON blob without auditability |
| **Minimal Recovery Incident record** (durable)                        | ADR-014 mandates Incident on ambiguity; E19 richer Safety Incident may later absorb this                                                                           | Log-only Incident — fails operator/restart evidence   |

**Not introduced:** recovery-specific Execution Engine, recovery Order type,
recovery accounting pipeline, message broker, or Job-queue-driven Session
state machine.

---

## 9. Story Decomposition

**Reserved IDs:** US240–US249  
**Suggested implementation order:**

```text
US240 → US241 → US242 → US243 → US249
              ↘ US246 (can parallel after US241)
US243 + US249 → US244 → US245 → US247 → US248
```

---

### US240 — Startup discovery forces `RECOVERING`

|                                      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                          | On process bootstrap, discover all non-terminal Trading Sessions and transition/confirm each to `RECOVERING` before any strategy evaluation is admitted.                                                                                                                                                                                                                                                                                                                                    |
| **Dependencies**                     | RC-16 US220 (drain/lifecycle); Session persistence                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **ADR / invariants**                 | ADR-014 restart step 1; ADR-018 #19, #23–24                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Acceptance criteria**              | 1) Non-terminal Sessions (`STARTING`, `RUNNING`, `PAUSED`, `RECOVERING`, `STOPPING`) are discovered. 2) Each is confirmed `RECOVERING` with audited transition; `STOPPING` → `RECOVERING` with `resumeIntent = STOPPED` (§4.6 P0-2). 3) Terminal `STOPPED`/`FAILED` are ignored. 4) No Signal Intent emission occurs for a Session still entering recovery. 5) Idempotent if already `RECOVERING`. 6) RecoveryState opened at phase `RECOVERING` with `preRecoveryStatus` + `resumeIntent`. |
| **Expected artifacts**               | Discovery service/hook; unit + integration tests; Outbox event for recovering transition                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Order**                            | 1 (first)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Implementation note (2026-07-30)** | Stage 3 **discovery slice** landed: eligibility + deterministic single-candidate selection + startup logging (`StartupRecoveryDiscoveryService`). Force/`confirm` `RECOVERING`, RecoveryState open, and Outbox recovering events remain residual toward full US240 ACs #2/#6 — see [e17-us240-startup-recovery-discovery.md](./e17-us240-startup-recovery-discovery.md).                                                                                                                    |

---

### US241 — Fenced lease acquisition during recovery

|                                      |                                                                                                                                                                                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**                          | Acquire a new fenced lease for each recovering Session; reject commits from stale fencing tokens.                                                                                                                                                                                          |
| **Dependencies**                     | US240                                                                                                                                                                                                                                                                                      |
| **ADR / invariants**                 | ADR-014 lease; ADR-018 #20–21, #53                                                                                                                                                                                                                                                         |
| **Acceptance criteria**              | 1) Recovery acquires lease via CAS/transactional semantics with new generation. 2) Stale owner write attempts fail closed. 3) Wall-clock expiry is operational only. 4) Runtime arm uses only the new fence after later resume (wired in US245).                                           |
| **Expected artifacts**               | Lease acquire path in recovery orchestrator; fencing rejection tests                                                                                                                                                                                                                       |
| **Order**                            | 2                                                                                                                                                                                                                                                                                          |
| **Implementation note (2026-07-30)** | Stage 3 **lease ownership slice** landed: `RecoveryLeaseAcquisitionService` + `saveIfVersion` CAS; outcomes `LEASE_ACQUIRED` \| `LEASE_DENIED` only; no status→`RECOVERING`, checkpoint, or Runtime arm. See [e17-us241-startup-recovery-lease.md](./e17-us241-startup-recovery-lease.md). |

---

### US242 — Durable recovery assembly (read-only load)

|                                      |                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                          | Load Deployment, checkpoints, open Orders, Fills, Position, Ledger, Portfolio, Risk, and Kill Switch into a recovery assembly view without mutating business aggregates.                                                                                                                                                                           |
| **Dependencies**                     | US241                                                                                                                                                                                                                                                                                                                                              |
| **ADR / invariants**                 | ADR-014 step 3; ADR-017 boundaries                                                                                                                                                                                                                                                                                                                 |
| **Acceptance criteria**              | 1) Assembly includes all listed durable sources via **public ports**. 2) No cross-module persistence internals. 3) Missing required Deployment → fail path (not silent empty run). 4) Assembly is serializable for tests/Incident context.                                                                                                         |
| **Expected artifacts**               | Assembly DTO/ports; load tests with fixtures                                                                                                                                                                                                                                                                                                       |
| **Order**                            | 3                                                                                                                                                                                                                                                                                                                                                  |
| **Implementation note (2026-07-30)** | Stage 3 **checkpoint discovery/validation slice** landed: `RecoveryCheckpointValidationService` → `VALID_CHECKPOINT` \| `NO_CHECKPOINT` \| `INVALID_CHECKPOINT` via `StrategyRuntimePort.loadCheckpoint` (read-only). Full multi-module assembly remains residual. See [e17-us242-checkpoint-validation.md](./e17-us242-checkpoint-validation.md). |

---

### US243 — Reconcile durable facts vs projections; fence on mismatch

|                                      |                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                          | Invoke existing rebuild/reconcile ports; persist mismatch; block execution on ambiguity.                                                                                                                                                                                                                                                      |
| **Dependencies**                     | US242; US177 rebuild/reconcile                                                                                                                                                                                                                                                                                                                |
| **ADR / invariants**                 | ADR-014 step 4; ADR-015; ADR-018 #23, #36–40, #43                                                                                                                                                                                                                                                                                             |
| **Acceptance criteria**              | 1) Reconcile runs before market resume/evaluate. 2) Match → continue. 3) Mismatch → durable record + execution blocked. 4) Does not “fix” projections by replaying live effects outside rebuild. 5) Order/Exec uncertain states invoke existing reconcile commands where applicable.                                                          |
| **Expected artifacts**               | Orchestrator reconcile step; mismatch fixtures; fence tests                                                                                                                                                                                                                                                                                   |
| **Order**                            | 4                                                                                                                                                                                                                                                                                                                                             |
| **Implementation note (2026-07-30)** | Stage 3 **read-only reconciliation slice** landed: `RecoveryStateReconciliationService` → `RECONCILED` \| `RECONCILIATION_FAILED` via local `RECOVERY_RECONCILIATION_PORTS` (stub default). Durable Incident + mutative rebuild persist remain residual (US249 / adapters). See [e17-us243-reconciliation.md](./e17-us243-reconciliation.md). |

---

### US244 — Restore market subscription and stream continuity

|                                      |                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                          | Restore market subscription and recover stream gaps using M1 contracts before strategy evaluation.                                                                                                                                                                                                                                                                  |
| **Dependencies**                     | US243 (prefer); Live Market Data US139/US142                                                                                                                                                                                                                                                                                                                        |
| **ADR / invariants**                 | ADR-014 step 5; ADR-018 #25                                                                                                                                                                                                                                                                                                                                         |
| **Acceptance criteria**              | 1) Uses existing gap/startup recovery services. 2) Strategy evaluation remains fenced until continuity READY. 3) Does not implement E20 multi-session fan-out hardening (document residual if needed). 4) Provider payloads stay inside adapters.                                                                                                                   |
| **Expected artifacts**               | Orchestrator MD step; integration with StartupRecovery/GapRecovery; tests                                                                                                                                                                                                                                                                                           |
| **Order**                            | 6 (after US249 preferred)                                                                                                                                                                                                                                                                                                                                           |
| **Implementation note (2026-07-30)** | Stage 3 **deterministic Runtime resume slice** landed under local US244 scoping: `RecoveryRuntimeResumeService` hydrates Runtime context after US240–US243 and enters recovery `READY` while worker remains `IDLE` / `acceptsTicks = false`. No market feed, evaluation, SignalIntent, or Orders. See [e17-us244-runtime-resume.md](./e17-us244-runtime-resume.md). |

---

### US245 — Resume from next semantic event; transition to safe intent

|                                      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                          | Compute resume cursor from checkpoint; transition Session per `resumeIntent` (`RUNNING` \| `PAUSED` \| `STOPPED`); arm Runtime with current fence when applicable.                                                                                                                                                                                                                                                                                                               |
| **Dependencies**                     | US243, US244, US249                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **ADR / invariants**                 | ADR-014 steps 6–7; ADR-018 #23–25, #44–45, #52; §4.6 P0-2/P0-3                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Acceptance criteria**              | 1) Resume cursor = next unprocessed semantic event after last checkpoint. 2) No re-evaluation of checkpointed event. 3) Transition follows durable `resumeIntent` (`STOPPED` for prior `STOPPING`; Kill Switch active forces `PAUSED` instead of `RUNNING`). 4) Runtime arm only after status commit and only when `resumeIntent` ∈ {`RUNNING`, `PAUSED`} — never for `STOPPED`. 5) Kill Switch active ⇒ no new executable Orders. 6) Phase must be `READY` before Session exit. |
| **Expected artifacts**               | Resume policy; cursor unit tests; end-to-end recover→tick test                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Order**                            | 7                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Implementation note (2026-07-30)** | Stage 3 **deterministic event admission slice** landed under local US245 scoping: `RecoveryEventAdmissionService` transitions Runtime `IDLE → EVENT_ADMISSION_ENABLED` after recovery `READY`. Tick admission becomes reachable; evaluation / SignalIntent / Orders remain blocked. Full Session exit / resumeIntent transition remains residual. See [e17-us245-deterministic-event-admission.md](./e17-us245-deterministic-event-admission.md).                                |

---

### US246 — Graceful shutdown: reject starts, drain, checkpoint, release lease

|                                      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                          | Implement ADR-014 graceful shutdown so controlled stops leave recoverable durable state.                                                                                                                                                                                                                                                                                                                                                                                        |
| **Dependencies**                     | US241 (lease); US220 drain hooks                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **ADR / invariants**                 | ADR-014 graceful shutdown; ADR-018 #22                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Acceptance criteria**              | 1) Rejects new starts during shutdown. 2) Drains in-flight evaluations. 3) Persists checkpoints. 4) Shortens/releases leases. 5) Subsequent cold start recovers without duplicate effects (paired with US247).                                                                                                                                                                                                                                                                  |
| **Expected artifacts**               | Shutdown hook/coordinator; tests for drain + checkpoint + lease release                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Order**                            | Parallel after US241                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Implementation note (2026-07-30)** | Stage 3 **deterministic Runtime arming slice** landed under local US246 scoping (distinct from original graceful-shutdown title): `RecoveryRuntimeArmingService` transitions `EVENT_ADMISSION_ENABLED → ARMED` after operational re-validation. No strategy evaluation, SignalIntent, Orders, or checkpoint writes. Original graceful-shutdown ACs remain residual / later story. See [e17-us246-deterministic-runtime-arming.md](./e17-us246-deterministic-runtime-arming.md). |

---

### US247 — Duplicate / replay / staleness fail-safe suite

|                                      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                          | Prove recovery does not duplicate business effects and fails closed on staleness (absorbs transferred US225 intent).                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Dependencies**                     | US245, US246                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **ADR / invariants**                 | ADR-018 #2, #9, #35, #43, #52                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Acceptance criteria**              | 1) Crash mid-evaluate / mid-Intent / mid-Order / mid-Fill fixtures → no duplicates. 2) Duplicate event delivery → Inbox no-op. 3) Stale Risk/market checkpoint cannot authorize new execution. 4) Deterministic replay fixture remains green after recover.                                                                                                                                                                                                                                                                           |
| **Expected artifacts**               | Failure-injection + property tests; evidence notes for US248                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Order**                            | 8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Implementation note (2026-07-30)** | Stage 3 **first deterministic strategy evaluation slice** landed under local US247 scoping (distinct from original fail-safe suite title): `RecoveryStrategyEvaluationService` evaluates an admitted market event on an `ARMED` Runtime with restored checkpoint context and produces a decision only. No SignalIntent, Orders, or checkpoint writes. Original fail-safe suite ACs remain residual / later story. See [e17-us247-first-deterministic-strategy-evaluation.md](./e17-us247-first-deterministic-strategy-evaluation.md). |

---

### US248 — Architecture conformance + recovery chaos/restart evidence

|                                      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                          | Architecture tests and chaos/restart evidence package for epic exit (absorbs transferred US226–US227 validation intent; performance baseline only if needed for recovery SLOs — not a general M3 perf redo).                                                                                                                                                                                                                                                                                                                                                                |
| **Dependencies**                     | US247                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **ADR / invariants**                 | ADR-018 #1–6, #60; architecture health checklist                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Acceptance criteria**              | 1) Dependency/boundary tests: Runtime ↛ Execution/Accounting; recovery orchestrator does not bypass CanonicalOrderPath. 2) Chaos/restart evidence attached to epic closeout. 3) Residual issues filed as TD with owner. 4) ADL-008 updated to ACCEPTED (or explicit DEFERRED with reason — preferred ACCEPTED).                                                                                                                                                                                                                                                             |
| **Expected artifacts**               | Boundary specs; chaos evidence doc/section; TD updates; ADL-008                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Order**                            | 9 (last)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Implementation note (2026-07-30)** | Stage 3 **deterministic SignalIntent generation slice** landed under local US248 scoping (distinct from original chaos/restart evidence title): `RecoverySignalIntentGenerationService` transforms a validated US247 `SIGNAL_INTENT` decision into exactly one SignalIntent via `StrategyRuntimePort.emitSignalIntent`. No Orders, Execution Engine, Accounting, or checkpoint writes. Original chaos/restart evidence ACs remain residual / later story. See [e17-us248-deterministic-signal-intent-generation.md](./e17-us248-deterministic-signal-intent-generation.md). |

---

### US249 — RecoveryState persistence, Incident on ambiguity, operator status

|                                      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**                          | Persist RecoveryState per §4.6 P0-1; create durable Incident when recovery cannot safely resume; expose operator-readable recovery status including phase.                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Dependencies**                     | US242 (assembly context); complements US243                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **ADR / invariants**                 | ADR-014 Incident rule; ADR-018 #18, #59; §4.5–§4.6                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Acceptance criteria**              | 1) Dedicated PostgreSQL `RecoveryStateRepository` with required logical columns (§4.6 P0-1). 2) Phase advances only via legal transitions (§4.5); illegal transitions rejected + audited. 3) Ambiguity/corruption paths create durable Incident + `phase = FAILED` + blocked execution. 4) Operator can query Session recovery status/phase without Dashboard authority. 5) Minimal Incident model documented as provisional pending E19. 6) No secrets in Incident/Audit payloads.                                                                          |
| **Expected artifacts**               | Prisma/repo implementation; Incident record; query API additive fields; tests                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Order**                            | 5 (before US244/US245)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Implementation note (2026-07-30)** | Stage 3 **recovery completion / Session-exit slice** landed under local US249 scoping (distinct from original RecoveryState persistence title): `RecoveryCompletionService` verifies US240–US246 consistency after a terminal Stage 3 outcome, exits Session from `RECOVERING`, releases recovery lease ownership, and emits `TradingSessionRecoveryCompleted`. No Orders / Runtime lifecycle mutation. Original RecoveryState + Incident + operator status ACs remain residual. See [e17-us249-recovery-completion.md](./e17-us249-recovery-completion.md). |

---

## 10. Architecture Review Checklist

Stage 2 / pre-US240 gate. Items marked **[P0]** were decided in §4.6 and must
be verified present in the Spec and reflected in story ACs.

### 10.1 Authority & freeze

- [x] ADR-012…ADR-018 remain ACTIVE; no silent supersession via this epic
- [x] ADL-008 draft decision text agreed (Session-owned orchestrator; no new BC)
- [x] TD-036 accepted as primary debt owner for E17
- [x] TD-002 clarified: Job queue must not own Session recovery lifecycle
- [x] Story IDs US240–US249 confirmed free in [story-id-allocation.md](../story-id-allocation.md)

### 10.2 Ownership & boundaries

- [x] Trading Session owns orchestration; module ports own aggregates (§5)
- [x] No redesign of Orders / Risk / Execution / Accounting ownership
- [x] `live-trading-engine.RecoveryManager` not adopted as paper recovery path
- [x] Research session recovery remains isolated
- [x] New components limited to orchestrator + RecoveryState + minimal Incident (§8)

### 10.3 Lifecycle, sequence & state machine

- [x] Normative algorithms in §4.2 and §4.3 accepted
- [x] **Recovery sequence (§4.4)** accepted end-to-end with per-step ownership
- [x] **Recovery state machine (§4.5)** phases `RECOVERING` → `VALIDATING` → `RECONCILING` → `READY` / `FAILED` accepted
- [x] **Illegal state transitions (§4.5)** listed explicitly and rejected by design
- [x] Dual status rule (Session status vs RecoveryState phase) accepted
- [x] Invariants R1–R20 accepted as mandatory review items (**recovery invariants**)
- [x] Resume cursor defined strictly as semantic checkpoint successor
- [x] `RECOVERING` (and all recovery phases) forbid new execution (test plan named)

### 10.4 P0 decisions (normative)

- [x] **[P0]** RecoveryState persistence = dedicated PostgreSQL via `RecoveryStateRepository` + explicit `resumeIntent` (§4.6 P0-1)
- [x] **[P0]** `STOPPING` → recover with `resumeIntent = STOPPED` only; never resurrect trading (§4.6 P0-2)
- [x] **[P0]** Active Kill Switch forces `PAUSED` instead of `RUNNING` at resume; never skips reconcile (§4.6 P0-3)

### 10.5 Failure & evidence

- [x] Failure scenarios §7 accepted (especially partial persistence & corruption)
- [x] Ambiguity policy = Incident + block (no auto-heal that replays effects)
- [x] Chaos/restart evidence required at US248 (format agreed)
- [x] Overlap with E18/E20 explicitly residual vs in-scope

### 10.6 Implementation readiness

- [x] Story dependency graph accepted
- [x] Modules allowed to change listed and signed (§10.7)
- [x] No production API/behavior change claimed by this planning doc alone
- [x] Epic Spec status → **ACCEPTED**; Architecture Review decision = **PROCEED** (pending sign-off names)
- [ ] Sign-off table completed (epic / architecture / release)

### 10.7 Modules allowed to change (planning gate)

| Module                                  | Allowed                                                                                                                                                                   | Forbidden                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `trading-session/`                      | Recovery orchestrator, RecoveryState infra, phase machine, shutdown/discovery, status reads, transition extensions for `STOPPING`→`RECOVERING` and `RECOVERING`→`STOPPED` | Owning Order/Fill/Ledger mutations                 |
| `strategy-runtime/`                     | Recovery-safe arm/evaluate gates; checkpoint read helpers                                                                                                                 | Order submit; accounting writes                    |
| `live-market-data/`                     | Wire existing recovery ports into Session orchestrator                                                                                                                    | Strategy evaluation; Orders                        |
| `positions/` / `ledger/` / `portfolio/` | Expose/consume existing reconcile ports                                                                                                                                   | New accounting semantics                           |
| `orders/` / `execution-engine/`         | Use existing reconcile/idempotent APIs from orchestrator                                                                                                                  | Recovery-only order types                          |
| `risk/`                                 | Read Kill Switch / decisions for gates                                                                                                                                    | Policy redesign; clear Kill Switch during recovery |
| `event-processing/`                     | Session recovery Outbox events                                                                                                                                            | New bus / exactly-once claims                      |
| `canonical-order-path/`                 | None unless wiring bug                                                                                                                                                    | New execution semantics                            |
| `live-trading-engine/`                  | **None for E17 paper recovery**                                                                                                                                           | Parallel recovery path                             |
| Dashboard / UI                          | Optional read of new status/phase fields only                                                                                                                             | Authoritative ledger                               |

---

## 11. ADL Impact

Placeholders until implementation / Architecture Review completes. Seeded IDs
align with [ADL.md](../../Architecture/ADR/ADL.md).

### ADL-008 — Full ADR-014 recovery algorithm ownership _(promote)_

| Field        | Value                       |
| ------------ | --------------------------- |
| Date         | 2026-07-30 (draft)          |
| Release      | RC-17                       |
| Epic / Story | E17 / US240–US249           |
| Status       | **PROPOSED** (was DEFERRED) |
| Related ADRs | ADR-014, ADR-018 #19–25     |

#### Context

M3 shipped Runtime lifecycle drain and checkpoints; full restart recovery
remained TD-036.

#### Decision (draft)

Trading Session owns the recovery **orchestration** algorithm. Strategy
Runtime, Live Market Data, Orders, Execution, Accounting, and Risk expose
**ports** used during recovery. No new Recovery bounded context. Job/scheduler
state must not become a second Session lifecycle (TD-002). Minimal durable
Incident records ambiguity until E19 Safety Incident productization.

#### Alternatives considered

- New Recovery BC — rejected (splits ADR-014 ownership).
- Runtime-owned full recovery — rejected (Runtime must not own Orders/accounting).
- Extend `live-trading-engine.RecoveryManager` — rejected (parallel stack).

#### Consequences

US240–US249 implement algorithm; US248 accepts ADL-008; residual consumer
coverage remains E18.

---

### ADL-013 — Recovery ambiguity creates durable Incident _(proposed new)_

| Field        | Value                   |
| ------------ | ----------------------- |
| Date         | 2026-07-30              |
| Release      | RC-17                   |
| Epic / Story | E17 / US249             |
| Status       | **PROPOSED**            |
| Related ADRs | ADR-014, ADR-018 #23–24 |

#### Context

ADR-014 requires an Incident on recovery ambiguity but RC-16 did not ship a
minimal durable record on the paper Session path.

#### Decision (draft)

E17 introduces a **minimal durable Recovery Incident** (workspace-scoped,
Session-correlated, no secrets). E19 may supersede with the richer Safety
Incident model without changing fail-closed semantics.

#### Consequences

US249 implements; E19 must migrate or wrap without weakening block-on-ambiguity.

---

### ADL-014 — Graceful shutdown leaves lease + checkpoint recoverable _(proposed new)_

| Field        | Value                |
| ------------ | -------------------- |
| Date         | 2026-07-30           |
| Release      | RC-17                |
| Epic / Story | E17 / US246          |
| Status       | **PROPOSED**         |
| Related ADRs | ADR-014, ADR-018 #22 |

#### Context

Need an explicit engineering interpretation of ADR-014 shutdown for the Nest
API process.

#### Decision (draft)

Shutdown rejects starts, drains Runtime, persists checkpoints, shortens/releases
leases. In-memory worker maps are discarded and rebuilt after recover.

#### Consequences

US246 + US247 prove recoverability after controlled stop.

---

**Note:** Do not treat these ADL drafts as ADR replacements. If ownership or
invariants must change, open a new ADR (ADR-018 #60).

---

## 12. Exit Criteria

Epic E17 is **complete** when all of the following are objectively true:

1. **Discovery:** Every non-terminal Trading Session enters/confirm
   `RECOVERING` on startup before evaluation (US240).
2. **Fence:** Recovery acquires a new lease generation; stale fence commits
   cannot succeed (US241).
3. **Reconcile-before-resume:** Reconciliation/rebuild runs; ambiguity creates
   durable Incident and blocks execution (US243, US249).
4. **Semantic resume:** Resume cursor is the next unprocessed semantic market
   event; checkpoint identifies last processed event (US245).
5. **No duplicates:** Crash/restart suites show no duplicate Signal Intents,
   Orders, Fills, or Ledger entries (US247).
6. **Graceful stop:** Controlled shutdown leaves durable recoverable state;
   cold start recovers cleanly (US246 + US247).
7. **Determinism:** Recorded-stream deterministic replay remains green after
   recovery paths (US247/US248).
8. **Architecture:** Boundary tests prevent Runtime → Execution/Accounting
   bypass and recovery forks of CanonicalOrderPath (US248).
9. **Evidence:** Chaos/restart evidence attached; residuals filed as TD with
   owners/milestones (US248).
10. **Debt/ADL:** TD-036 resolved or explicitly residual with justification;
    ADL-008 ACCEPTED; ADL-013/ADL-014 ACCEPTED or explicitly deferred with
    pointer to TD.
11. **Non-regression:** ADR-012…ADR-018 invariants R1–R20 checked in Technical
    Review / Architecture Health for the epic.
12. **Process:** Stage 4–6 artifacts filed per
    [rc-17-development-process.md](../rc-17-development-process.md); no open
    planning blocker for E18 start (E18 may overlap only on pure dispatcher
    work per roadmap, with explicit risk).

---

## Risks

| Risk                                               | Severity | Mitigation                                                                     |
| -------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| Resume before reconcile                            | High     | US243/US245 gate; architecture test forbids evaluate while `RECOVERING`        |
| Silent auto-heal duplicates effects                | High     | Ambiguity → Incident only; no reconstructive write path in E17                 |
| Partial Intent/checkpoint pairs from earlier bugs  | High     | US242 validation + US247 fixtures; blocker if illegal pairs exist in prod data |
| Over-scope into E18 consumer matrix / E20 fan-out  | Medium   | Explicit residuals; US244 limited to existing MD contracts                     |
| TD-002 Job queue accidentally drives Session state | Medium   | ADL-008 + review checklist; reject Job-owned recovery                          |
| Minimal Incident conflicts with future E19 model   | Low      | ADL-013 provisional; fail-closed semantics stable                              |
| `live-trading-engine` confusion                    | Medium   | Out of scope; do not wire into paper Session recovery                          |
| Checkpoint schema evolution needed mid-epic        | Medium   | Additive schema only; corruption → Incident (US249)                            |

---

## Open Architectural Questions

**P0 resolved** in §4.6 (RecoveryState persistence, `STOPPING` policy, Kill Switch).

Remaining items are **non-blocking** for opening US240; resolve during
implementation stories or file as TD if deferred past E17 exit:

1. **Incident storage shape:** dedicated Recovery Incident table vs thin row
   beside RecoveryState (fail-closed semantics fixed; schema choice is US249).
2. **Execution reconcile breadth:** exact Order-state set mandatory in E17 vs
   residual TD (US243 may start with open/uncertain/submitted; expand if chaos
   finds gaps).
3. **Multi-instance CI:** single-writer assumed for first green path; overlapping
   process-boot lease proof recommended in US241/US248 but not a Spec blocker.
4. **US244 vs E20 residual list:** document multi-session fan-out gaps in US244
   AC notes when implementing (E20 owns hardening).
5. **RecoveryState retention:** how long completed/failed rows are retained
   after US248 evidence capture (ops policy; default keep until E19 Incident
   migration).

---

## Recommendations before opening US240

1. Complete sign-off table (§ below); checklist §10 already incorporates P0.
2. Implement transition matrix extensions (`STOPPING`→`RECOVERING`,
   `RECOVERING`→`STOPPED`) under US240/US245 only — with tests for illegal
   `resumeIntent = STOPPED` → `RUNNING`/`PAUSED`.
3. US249 first persistence slice may land just after US242 as planned; encode
   §4.5 phase enum exactly.
4. Inventory existing Session statuses in DB/fixtures (including stuck
   `STOPPING`/`STARTING`).
5. Confirm Intent+checkpoint atomicity in current M3 paths — illegal pairs are
   release blockers.
6. Keep E18/E19/E20 owners informed of residuals; do not expand US244/US249
   into those epics.
7. Do **not** modify Runtime production behavior until US240 is opened under
   this ACCEPTED Spec + signed PROCEED.

---

## Sign-off

| Role               | Name | Date |
| ------------------ | ---- | ---- |
| Epic owner         |      |      |
| Architecture owner |      |      |
| Release lead       |      |      |

**Architecture Review gate**

- Review date: 2026-07-30
- Decision: **PROCEED** (P0 decisions normative in §4.6)
- Constraints: ADR-012…ADR-018 frozen; Session-owned orchestrator only; no
  recovery execution fork; `STOPPING` resumes only to `STOPPED`; Kill Switch
  forces `PAUSED` over `RUNNING`
