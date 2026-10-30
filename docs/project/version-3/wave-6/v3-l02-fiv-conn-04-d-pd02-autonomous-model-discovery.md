# FIV-CONN-04-D P-D-02 — Autonomous Trading Model & SYSTEM_JOB Identity Discovery

**Document:** FIV-CONN-04-D — Autonomous Product Model / Execution Identity Discovery  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Related:** P-D-02 under ratified model **OPT-PD02-02** (SYSTEM_JOB) — exact canonical `actorId` still NOT PROVISIONED  
**Authority:** Read-only architecture / product / governance discovery  
**Nature:** **DISCOVERY ONLY.** Does **not** invent an `actorId`. Does **not** provision a SYSTEM_JOB identity. Does **not** reopen or change OPT-PD02-02. Does **not** dispose P-D-03. Does **not** grant D Implementation Authorization. Does **not** implement D. Does **not** modify Master Plan, Execution Roadmap, ADRs, prior P-D-02 artifacts, production code, schemas, or technical debt. Does **not** stage, commit, or push.

**Hypothesis under test (non-authoritative until verified):** Human configures exchanges / bot capacity / capital limits once; system autonomously selects coin, bot assignment, strategy, timeframe, capital allocation within limits, and executes; human is supervisory/configurational rather than per-operation approver.

```text
DISCOVERY RESULT (SUMMARY)
- autonomous product model: PARTIAL
- autonomous execution identity: NOT FOUND
- canonical SYSTEM_JOB actorId: NOT FOUND
- identity authority/provisioning: NOT FOUND
- P-D-02: STILL BLOCKED
- implementation started: NO
```

---

## 1. Executive finding

**Verdict: PARTIALLY CONFIRMED — some elements documented, others not**

Repository evidence supports a **hybrid** operating model:

| Claim                                                                                                                                                    | Verdict                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fully autonomous AI/trading product that owns capital end-to-end without human start / Gate / certification                                              | **NOT CONFIRMED** — explicitly rejected                                                                                                                    |
| Human approves every trade/order                                                                                                                         | **NOT CONFIRMED** — Risk Engine is order-approval SoT                                                                                                      |
| Human configures Exchange Scope, capacity (max bots), policies, credentials, envelopes; starts live session; supervises via Command Center / Kill Switch | **CONFIRMED**                                                                                                                                              |
| After session start, Strategy Runtime may emit Signal Intents and automated strategy execution proceeds on the canonical path under Risk                 | **CONFIRMED** (terminology: “autonomous trading worker” = Session/Bot lifecycle)                                                                           |
| System freely invents coin / strategy / timeframe / portfolio capital allocation outside certified envelopes                                             | **NOT CONFIRMED** — Option B allowlists + Gate + Risk constrain selection; portfolio-level capital allocation deferred / out of scope in inspected sources |
| Existing architecture supplies a canonical `SYSTEM_JOB` `actorId` usable as P-D-02 provenance for CONN-04-D                                              | **NOT FOUND**                                                                                                                                              |

**Important scope note:** FIV-CONN-04-D / P-D-02 concern **privileged connection environment migration-backfill** provenance (`PrivilegedActorContext`), **not** the trading Signal Intent → Risk → Execution attribution model. Even where trading “autonomy” language exists, it does **not** automatically provision a CONN-04 migration `SYSTEM_JOB` identity.

---

## 2. Product operating model

Describe **only** what repository evidence supports.

| Capability                                | Evidence                                                                                                                                                                                                                                                                                                                                       | Status                                                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Human selects / connects exchanges        | Connection Management Wave 2 goal; Exchange Scope isolation; Spec §3 Exchange Scope; Master Plan Wave 2 customer outcomes                                                                                                                                                                                                                      | **CONFIRMED**                                                                                                      |
| Human selects bot count (capacity)        | Exchange Scope binds “session capacity limits (UI: max bots)”; example “Binance max bots = 3”; Authority Matrix: Exchange Scope config (max bots, allowlists)                                                                                                                                                                                  | **CONFIRMED**                                                                                                      |
| Human configures capital / capital limits | Humans retain capital authority (archive Principle 8; Master Plan AI Never Controls Capital; ADR-020 human start). Exchange Risk Policy / risk-per-trade ranges exist. Portfolio-level capital allocation across currencies deferred (ADR-016 Follow-up). Not a single “human sets total capital once, system allocates freely” product claim. | **PARTIAL**                                                                                                        |
| System selects coin/instrument            | Tactics Contract Option B: MAY select instrument/symbol **from validated allowlist**. Spec §7 Strategy Selector / Tactical Engine. RC-26 also requires `marketSymbol` on orchestration requests — operator/context still supplies market identity in API contract.                                                                             | **PARTIAL**                                                                                                        |
| System selects bot assignment             | Bot = Trading Session (UI alias). Orchestrator emits `SessionHandoffIntent` with `createsSession: false`; Session remains SoT for start. No documented autonomous fleet manager that invents bot instances outside capacity + human session start.                                                                                             | **PARTIAL** (handoff/selection within constraints; **not** unconstrained bot inventing)                            |
| System selects strategy                   | Spec §7: Strategy Selector chooses only **certified** strategy version appropriate to context + Exchange Scope allowlists. Orchestrator coordinates; does not execute.                                                                                                                                                                         | **PARTIAL** (within certification/allowlist; not free invention)                                                   |
| System selects timeframe                  | Tactics Contract Option B: MAY select timeframe **from validated allowlist**. MUST NOT enlarge allowlists without research + certification.                                                                                                                                                                                                    | **PARTIAL**                                                                                                        |
| System allocates capital                  | Risk may enforce / consume tactical risk-per-trade ranges. Execution Engine has no position-sizing policy (ADR-012). Portfolio-level capital allocation deferred. No authoritative “system autonomously allocates capital within human limits” allocator stage.                                                                                | **NOT FOUND** (as autonomous allocator product capability)                                                         |
| System executes autonomously              | Spec: Session = “autonomous trading worker”; emits Signal Intents; ADR-012: all automated strategy execution uses single entry point after Risk. Live requires human start (Master Plan / Roadmap / ADR-020).                                                                                                                                  | **PARTIAL** (intra-session automated execution **after** human/session gates; **not** fully autonomous production) |
| Human approves every operation            | Risk Engine is the only component allowed to approve an Order Intent (ADR-016). No authoritative doc requiring per-trade human click.                                                                                                                                                                                                          | **NOT FOUND** (as required model)                                                                                  |
| Human acts as supervisor/configurator     | Command Center; pause/stop/kill; Approve deployments; Start/Stop Production (Architecture 008); dual control Admin enable / Trader start (Security Vision); Kill Switch product                                                                                                                                                                | **CONFIRMED**                                                                                                      |

### Hypothesis mapping (explicit)

| Hypothesis element                          | Repository mapping                                                                                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Human configures operating boundaries once  | **Supported in spirit** as Exchange Scope + Risk Policy + Tactical Envelope + Gate, not as a single one-shot “set and forget forever” product story         |
| Human selects exchanges                     | **Supported** (Connections / Exchange Scope)                                                                                                                |
| Human specifies how many bots may operate   | **Supported** (max bots / session capacity)                                                                                                                 |
| Human specifies/allocates available capital | **Partial** — human capital authority + policies; no complete autonomous capital-allocation product                                                         |
| System analyzes markets                     | **Supported** as Market State / Qualification / Profile informing selection — **not** as unconstrained free analysis that forces trades                     |
| System decides bot/coin/strategy/timeframe  | **Partial** — selection **inside** certified envelopes / allowlists; Session start remains human/Orchestrator-handoff constrained (`createsSession: false`) |
| System allocates capital within limits      | **Not established** as a named autonomous allocator                                                                                                         |
| System executes on exchange                 | **Partial** — paper path certified; live path gated (ADR + human start); always via Risk → Execution → Adapter                                              |
| Human is supervisory only                   | **Supported for per-order approval** (Risk Engine SoT); **not** for live enablement / session start / Kill Switch / deployment certification                |

---

## 3. Autonomous architecture

### 3.1 Documented runtime execution path (CONFIRMED)

From Spec v2.0 §3 “One execution path” and ADR-012:

```text
Market Event
  → Strategy Runtime
  → Signal Intent
  → Orders
  → Risk Engine (platform + Exchange Risk Policy inputs)
  → Execution Engine
  → Adapter (paper now; live later via ADR)
  → Fill
  → Position → Ledger → Portfolio
```

### 3.2 Documented selection / orchestration reading (CONFIRMED as Spec §7)

```text
Market State
  → Strategy Selector
  → Tactical Engine
  → Trading Orchestrator
  → Risk Engine
  → Execution
  → Exchange
```

Spec reading (preserve repository terminology):

1. Market State classifies conditions and informs selection.
2. Strategy Selector chooses only a **certified** strategy version.
3. Tactical Engine selects parameters **only inside** the certified Tactical Envelope (Option B).
4. Trading Orchestrator coordinates selection/handoff; **does not submit orders**; **does not replace** Risk or Execution Engine.
5. Risk Engine produces Risk Decision.
6. Execution acts only after Risk approval.
7. Exchange interaction solely via scoped adapter.

### 3.3 Flow **not** established as a single named pipeline

The hypothesis chain:

```text
Market Data → Analysis → Strategy Selection → Bot/Resource Allocation → Risk/Policy Gate → Execution → Exchange
```

…is **not** found as one authoritative named pipeline with a dedicated **Bot/Resource Allocation** or **Capital Allocation** stage in Master Plan / Spec / ADRs. Closest confirmed combination is Spec §7 selection + Spec §3 runtime path, with Session ownership separate from Orchestrator (`createsSession: false`).

### 3.4 Explicit non-goals / anti-autonomy language (CONFIRMED)

| Source              | Statement (paraphrase preserved by meaning)                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product Vision      | TRP is **not** a trading bot / AI trader; non-goal: Autonomous AI trading bot; “AI never controls capital”; “Nothing reaches production without validation and human approval.” |
| Master Plan         | **AI Never Controls Capital** — AI does not decide, approve, size, or start trades. **Live Must Be Earned** — certified strategy, Gate PASS, human start.                       |
| Roadmap Wave 6 exit | Live session requires certified library + Gate PASS + human start; AI cannot start, approve, or size live orders.                                                               |
| ADR-020             | Explicit human authorization / human start required before live session operation.                                                                                              |
| Architecture 008    | “Production is never fully autonomous.”                                                                                                                                         |
| Spec                | Trading Orchestrator is **Not AI**. Session is “autonomous trading worker” lifecycle (UI: Bot) — worker loop, not AI capital owner.                                             |

**Terminology tension (reported, not resolved):** Product Vision rejects “trading bot” / “Autonomous AI trading bot,” while Spec uses “autonomous trading worker” / UI “Bot” for Trading Session + Strategy Runtime. These are **different uses** of bot/autonomy language in the repository.

---

## 4. Human-control boundary

| Layer                                        | Who / what                                                                                                                       | Evidence status                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Configuration**                            | Operator/Admin: Connections, Exchange Scope, allowlists, max bots, vault credentials, RBAC                                       | **CONFIRMED**                                                             |
| **Policy / risk limits**                     | Human-authored Exchange Risk Policy + platform Risk Policy + certified Tactical Envelope; consumed by Risk Engine / Orchestrator | **CONFIRMED**                                                             |
| **Execution authorization (session / live)** | Certified library + Gate PASS + human start + inactive Kill Switch + (live) Admin enable / ADR gates                             | **CONFIRMED** for live; paper uses certified path with Session lifecycle  |
| **Per-operation (per-order) approval**       | **Risk Engine** deterministic decision — **not** documented as human click-per-order                                             | **CONFIRMED** as engine SoT; human-per-order **NOT FOUND** as requirement |
| **Emergency intervention**                   | Durable Kill Switch; Command Center pause/stop/kill via Session/Risk ports                                                       | **CONFIRMED**                                                             |

### Distinguishing A–E (requested architecture layers)

| Layer                          | Documented? | Notes                                                                                                                                                                                      |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A. Human configuration/control | **Yes**     | Connections, scopes, capacity, policies, envelopes, enablement                                                                                                                             |
| B. Autonomous decision-making  | **Partial** | Selection/tactics **inside** envelopes; Orchestrator; Runtime evaluation — constrained, not free AI capital control                                                                        |
| C. Execution                   | **Yes**     | Orders → Execution Engine → Adapter only after Risk                                                                                                                                        |
| D. Risk/policy authorization   | **Yes**     | Risk Engine mandatory; policies as inputs                                                                                                                                                  |
| E. Audit/accountability        | **Partial** | Security Audit / financial action log / HumanStartProof planned or present in parts; **no** canonical SYSTEM_JOB trading identity; CONN-04 privileged audit uses caller-supplied `actorId` |

---

## 5. Identity model

### 5.1 Does an autonomous execution service already have a documented identity/name/role?

| Named concept                                | Documented role                                                              | Provisioned service-account / SYSTEM_JOB identity?                                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Trading Session + Strategy Runtime (UI: Bot) | Autonomous trading **worker lifecycle**; emits Signal Intents                | **No** service identity string as SYSTEM_JOB SoT                                                                                      |
| Trading Orchestrator                         | Selection/handoff coordinator; not Execution Engine; `createsSession: false` | **No**                                                                                                                                |
| Risk Engine                                  | Sole Order Intent approver                                                   | **No** (authority, not actor registry identity)                                                                                       |
| Execution Engine                             | Sole adapter entry after Risk                                                | Domain event default `actorId: 'execution-engine'` exists in code — **domain-local**, not PrivilegedActorContext / CONN-04 SYSTEM_JOB |
| SYSTEM_JOB (`PrivilegedActorKind`)           | Privileged **kind** for migration-gate / CONN-04 B-04                        | Kind **yes**; concrete CONN-04 `actorId` **no**                                                                                       |

**Finding:** No ratified **autonomous trading execution** service-account / machine identity is established in Master Plan, Spec, or ADRs as a canonical `SYSTEM_JOB` `actorId`.

### 5.2 Candidate identity table

| Candidate identity                                                               | Source                                                              |                              Authoritative? |   Suitable as SYSTEM_JOB actorId? | Reason                                                                                                       |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------: | --------------------------------: | ------------------------------------------------------------------------------------------------------------ |
| `PrivilegedActorKind` / `SYSTEM_JOB` (kind only)                                 | `apps/api/src/modules/connections/migration-gate.ts`                |                       Kind contract **yes** |                   N/A (not an id) | Establishes allowed kind; does not mint value                                                                |
| `PrivilegedActorContext`                                                         | same                                                                |                               Shape **yes** |                               N/A | Caller-supplied `{ actorId, actorKind, correlationId? }`                                                     |
| `FIV-CONN-04` gate key                                                           | `migration-gate.ts` `MIGRATION_GATE_KEY_FIV_CONN_04`                |                            Gate key **yes** |                            **No** | Resource/gate identity ≠ actor                                                                               |
| `FIV_CONN_04_MIGRATION_BACKFILL`                                                 | `migration-gate.ts` purpose constant                                |                             Purpose **yes** |                            **No** | Lease purpose ≠ actor                                                                                        |
| `system:startup-recovery`                                                        | `startup-recovery-discovery.service.ts` `STARTUP_RECOVERY_ACTOR_ID` |                Domain-local recovery events |                            **No** | Not PrivilegedActorContext; not CONN-04 SoT                                                                  |
| `execution-engine`                                                               | `execution-engine.service.ts` default / envelope `actorId`          |         Domain-local durable-event producer |                            **No** | Module string; false attribution if reused for CONN-04 SYSTEM_JOB                                            |
| `portfolio-projection` / `position-valuation` / `position-accounting` / `ledger` | respective services                                                 |                   Domain-local event actors |                            **No** | Unrelated domains                                                                                            |
| HTTP `request.user.userId`                                                       | Connections controller / ordinary facade                            | Authoritative for ordinary Connections HTTP | **No** for OPT-PD02-02 SYSTEM_JOB | Would be OPERATOR-class subject if separately ratified; conflicts with selected single-mode SYSTEM_JOB model |
| HumanStartProof `actorId`                                                        | Prisma / live-admission                                             |                           Human start proof |             **No** for SYSTEM_JOB | Human subject binding                                                                                        |
| Bot / Session id                                                                 | Bot facade / Trading Session                                        |                         Bot id = session id |                            **No** | Runtime aggregate id ≠ privileged job identity                                                               |
| Test fixtures `job-1`, `op-1`, `client-a`, `crash-a`, …                          | `*.spec.ts`                                                         |                                      **No** |                            **No** | Non-authoritative fixtures                                                                                   |
| Actor / ops identity registry                                                    | searched docs + code                                                |                               **NOT FOUND** |                               N/A | No SoT registry                                                                                              |
| Canonical CONN-04 SYSTEM_JOB constant in production                              | non-`*.spec.ts` code                                                |                               **NOT FOUND** |                                 — | Consistent with P-D-02 disposition / ratification                                                            |

**Do not invent an identity.** None of the above closes Q5.

---

## 6. SYSTEM_JOB conclusion

| Question                                                                       | Answer                                                                                                                                                                        |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does the existing architecture establish SYSTEM_JOB **conceptually**?          | **YES** — as `PrivilegedActorKind` for CONN-04 migration-gate / B-04 privileged context (`SYSTEM_JOB` \| `OPERATOR`; `CLIENT` forbidden). Also ratified for D as OPT-PD02-02. |
| Does it establish a **concrete** `actorId`?                                    | **NO**                                                                                                                                                                        |
| Does it establish an identity **provisioning mechanism**?                      | **NO** (paths P1–P4 specified as needed; authority/process/registry **not** found)                                                                                            |
| Does it establish **ownership**?                                               | **NO**                                                                                                                                                                        |
| Does it establish the **trusted boundary** where this identity is constructed? | **Designed in planning / ratification** (trusted non-public D entry); **not implemented** in production. B-04 validates/forwards caller-supplied actor only.                  |

**Trading implication vs CONN-04 implication:**

- Architecture **implies** automated intra-session actions are **not** per-order OPERATOR approvals (Risk Engine SoT).
- Architecture does **not** establish that those trading actions are attributed via CONN-04 `SYSTEM_JOB` / `PrivilegedActorContext`.
- CONN-04 `SYSTEM_JOB` is a **migration privilege kind**, not a documented universal “all autonomous exchange operations” actor registry.

---

## 7. Relationship to P-D-02

**Verdict: C — confirms that external governance/operations provisioning is still required.**

| Outcome                                                | Selected?                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| A. Resolves P-D-02                                     | **No**                                                            |
| B. Partially resolves P-D-02                           | **No** as satisfaction (model already selected; Q5 still missing) |
| C. External governance/ops provisioning still required | **Yes**                                                           |

Reasons:

1. OPT-PD02-02 already selected; this discovery does **not** change that.
2. No authoritative CONN-04 SYSTEM_JOB `actorId` recovered from product architecture or code.
3. Autonomous trading “worker” language does not yield a mintable privileged migration identity.
4. Domain-local strings (`execution-engine`, `system:startup-recovery`) remain unsuitable.
5. G1–G7 authority/process/SoT gap from prior identity-authority discovery remains applicable.

```text
Repository evidence does not establish a canonical SYSTEM_JOB actorId.
```

---

## 8. Governance impact

- **If** an authoritative autonomous execution identity already existed, this document would cite the exact SoT and evaluate whether it could satisfy P-D-02 Q5 under OPT-PD02-02.
- **It does not exist.**

```text
Repository evidence does not establish a canonical SYSTEM_JOB actorId.
```

Therefore:

- Do **not** treat Spec “autonomous trading worker” as P-D-02 satisfaction.
- Do **not** promote `execution-engine` or `system:startup-recovery` into CONN-04 SYSTEM_JOB.
- Do **not** invent a value to unblock D.
- Next gate remains: establish SYSTEM_JOB identity governance authority + provisioning process (G1–G7), then provision exact string + owner, then P-D-02 satisfaction disposition.

P-D-03, D Implementation Authorization, and D implementation remain **out of scope** for this artifact.

---

## 9. Evidence index

| Path                                                                                  | Section / symbol                                                                                               | Conclusion supported                                                                                                               |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `docs/project/trp-product-vision.md`                                                  | Vision / What TRP is not; Mission; AI never controls capital                                                   | Rejects trading-bot / Autonomous AI trading bot product; human approval before production; AI never controls capital               |
| `docs/project/version-3/version-3-master-plan.md`                                     | Version 3 Product Principles                                                                                   | Live Must Be Earned; AI Never Controls Capital                                                                                     |
| `docs/project/version-3/v3-execution-roadmap.md`                                      | Wave 2 Connection Management; Wave 6 exit criteria                                                             | Human connects integrations; live needs human start; AI cannot start/approve/size live orders; Kill Switch                         |
| `docs/project/version-3/v3-security-vision.md`                                        | Threat model / dual control (inspected via prior Wave-6 refs + Security Vision language)                       | Admin enable / Trader start dual control; Kill Switch in defense-in-depth                                                          |
| `docs/project/trp-architecture-specification-v2.md`                                   | §3 Building blocks; One execution path; §5.5–5.6; §7 Decision flow                                             | Autonomous trading worker = Session; Orchestrator ≠ Execution; certified selection path                                            |
| `docs/project/v2-tactics-contract.md`                                                 | Option B normative rule                                                                                        | System MAY select symbol/timeframe/risk params **from allowlists only**                                                            |
| `docs/project/v2-cluster-isolation-invariants.md`                                     | Exchange Scope definition; Policy vs engine                                                                    | Human/scope config: max bots / capacity; example max bots = 3                                                                      |
| `docs/project/v2-authority-matrix.md`                                                 | Authority matrix rows                                                                                          | Risk Engine SoT for risk decision; Session lifecycle SoT; Exchange Scope owns max bots/allowlists; Orchestrator not money SoT      |
| `docs/project/rc-26-api-contract.md`                                                  | §6 orchestration / selection                                                                                   | `marketSymbol` required; mission-change confirm semantics                                                                          |
| `docs/project/pc-15-a-integration-report.md` (+ PC-11/15 family)                      | `createsSession: false`                                                                                        | Orchestrator does not start Session                                                                                                |
| `docs/adr/ADR-012-execution-architecture.md`                                          | Single execution entry point; canonical flow                                                                   | Automated strategy execution shares one path; Execution Engine not sizing authority                                                |
| `docs/adr/ADR-016-risk-safety-model.md`                                               | Risk Engine; Kill Switch                                                                                       | Only Risk Engine approves Order Intent; durable Kill Switch                                                                        |
| `docs/adr/ADR-020-live-capital.md`                                                    | §3 Human authorization; admission                                                                              | Human start required for live; not autonomous live activation                                                                      |
| `docs/Architecture/008-Production-System.md`                                          | Human Supervision                                                                                              | “Production is never fully autonomous.”                                                                                            |
| `docs/archive/02-architecture-pre-cleanup.md`                                         | Principle 8 — Human Authority (lineage)                                                                        | Humans retain deployment/capital/production approval/strategy promotion — archive, contradictory tension with automated path noted |
| `apps/api/src/modules/connections/migration-gate.ts`                                  | `PrivilegedActorKind`, purpose/key constants                                                                   | SYSTEM_JOB conceptual kind; purpose/key ≠ actorId                                                                                  |
| `apps/api/src/modules/connections/conn04-migration-boundary.service.ts`               | start/resume/heartbeat/release                                                                                 | Caller-supplied privileged actor; no identity factory                                                                              |
| `apps/api/src/modules/execution-engine/execution-engine.service.ts`                   | default `actorId`                                                                                              | Domain-local `execution-engine`                                                                                                    |
| `apps/api/src/modules/trading-session/recovery/startup-recovery-discovery.service.ts` | `STARTUP_RECOVERY_ACTOR_ID`                                                                                    | Domain-local `system:startup-recovery`                                                                                             |
| Prior P-D-02 artifacts (read-only cross-check)                                        | disposition / ratification / identity-authority-discovery / governance-escalation / identity-provisioning-spec | P-D-02 BLOCKED; no authority/process; OPT-PD02-02 selected; Q5 incomplete                                                          |

---

## 10. Final status block

```text
DISCOVERY RESULT:
- autonomous product model: PARTIAL
- autonomous execution identity: NOT FOUND
- canonical SYSTEM_JOB actorId: NOT FOUND
- identity authority/provisioning: NOT FOUND
- P-D-02: STILL BLOCKED
- implementation started: NO

OPT-PD02-02: UNCHANGED (not reopened)
P-D-03: UNTOUCHED
D IMPLEMENTATION AUTHORIZATION: NOT GRANTED
PRODUCTION CODE MODIFIED: NO
MASTER PLAN / ROADMAP / ADRS MODIFIED: NO
PRIOR P-D-02 ARTIFACTS MODIFIED: NO
COMMIT/PUSH: NOT PERFORMED
```

**END OF AUTONOMOUS MODEL / SYSTEM_JOB IDENTITY DISCOVERY**
