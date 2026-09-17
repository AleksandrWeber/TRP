# V3-L02 Planning Proposal — Live Order I/O on Canonical Path

**Document:** V3-L02 Package Planning Proposal
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 — Live order I/O on canonical path, real submit/cancel, real capital movement
**Capability:** **LT-02** (do not rename; do not redefine)
**Nature:** Package planning proposal only. **Not** Planning Approval. **Not** Slice Approval. **Not** implementation authorization. **Not** implementation. **Not** FIV. **Not** live-capital activation. **Not** an ADR. **Not** a Master Plan / Roadmap revision.
**Authority:** Planning Engineer / Solution Architect under PO / Chief Architect governance lifecycle
**Preceded by:** V3-L01-S04 Final Close — **CLOSED** ([`v3-l01-s04-final-close.md`](./v3-l01-s04-final-close.md); impl `cc3ca922b536741318a9cc7336bde0511814abe9`)
**ADR:** [`docs/adr/ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)
**Planning Package:** [`wave-6-planning-package.md`](./wave-6-planning-package.md) §4
**Decision Register:** [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md)
**Repository baseline (proposal start):** `465a330ff01bbcffaefc4ca9cc06120ab6881a12` (`docs(wave-6): close v3-l01-s04`)

```text
V3-L02
PLANNING PROPOSAL ONLY
NOT APPROVED FOR IMPLEMENTATION

This artifact is a planning proposal only.
L02 implementation requires explicit PO / Chief Architect
Planning Approval and Slice Approval after review of this proposal.
S04 Final Close ≠ L02 authorization.
D-GOV-05 GRANTED ≠ L02 authorized ≠ live capital activated.
```

```text
Wave 6 Planning                 = APPROVED
ADR-020                         = ACCEPTED
D-GOV-05                        = GRANTED (wave-level; package/slice gates remain)
V3-L01-S01…S04                  = CLOSED
V3-L01 package                  = NOT CLOSED
V3-L02                          = PLANNING PROPOSAL (this artifact)
V3-L02 IMPLEMENTATION           = NOT AUTHORIZED
L03 / L04 / L05                 = NOT AUTHORIZED
Live capital                    = NOT ACTIVATED
FIV                             = NOT PERFORMED
Wave 6                          = NOT COMPLETE
LiveCommand / C7                = DENY-ALL / UNBOUND
paperFreeze                     = true (authoritative)
liveCapitalAuthorized           = false (authoritative)
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.
Especially preserved: `workspace.module.ts` and all protected Wave 5 leftovers.

**Classification legend:** AUTHORITATIVE · DERIVED · OPEN · NOT SPECIFIED · PO DECISION REQUIRED

---

## 1. Executive Summary

**V3-L02 (LT-02)** is the Wave 6 package that transitions from **approved live admission** (V3-L01-S04) into **actual irreversible financial I/O** on the **canonical** Order → Risk → Execution → Adapter path: real submit, real cancel, and order-induced real capital movement at the venue.

Repository reconnaissance shows:

1. **Canonical Paper path exists and works:** `OrderService` → `CanonicalOrderPathService` → Risk → Ledger cash reservation → `ExecutionEngineService` → `PaperExecutionAdapter` (sole Nest `EXECUTION_ADAPTER` binding).
2. **Live is designed to extend that same path** (ADR-020 / ADR-012), via a live `ExecutionAdapterPort` binding — **not** a second trading engine.
3. **A parallel live prototype exists** (`live-trading-engine` → `order-engine` → `ExchangeAdapterService`) and is **not** the ADR-012 canonical path. It is unreachable in production because `PermissionClass.LiveCommand` / C7 is deny-all.
4. **S04 admission is CLOSED** and provides `LiveAdmissionService.evaluate` / `evaluateForL02Contract` with binding `l02MustRevalidateBeforeVenueIo: true`. Production admission always DENYs on V2 hard stops (`paperFreeze`, `liveCapitalAuthorized=false`) and C7 deny-all.
5. **No production venue submit/cancel I/O exists.** Binance/Bybit/OKX `VenueExchangeAdapter` stubs throw; Binance handshake can validate API restrictions only; Vault holds encrypted trading secrets but is not wired into order adapters.
6. **Paper order state machine has no first-class “unknown / ambiguous venue outcome” state.** Paper idempotency (clientOrderId / intentHash / unique constraints) is strong locally but insufficient alone for lost-response live I/O without reconcile semantics (D-ARCH-06/07/18).
7. **“Real capital movement” in LT-02 authoritative sources means order-induced venue exposure** (place/cancel → fill → position → ledger), **not** withdrawals/transfers. Expanding into banking/transfer is **PO DECISION REQUIRED** if desired; this proposal does **not** invent that scope.

```text
Policy ≠ authorization ≠ admission ≠ execution ≠ fill ≠ settled capital truth

Paper ≠ Live
LIVE_POLICY_OPTED_IN ≠ live execution authorized
S04 ALLOW ≠ order submitted
Order submitted ≠ order filled
Network success ≠ venue success unless verified
Unknown venue outcome ≠ rejected
Cancel requested ≠ canceled
```

**This proposal does not authorize implementation, venue connection, credential provisioning, C7 activation, Paper Freeze change, `liveCapitalAuthorized` flip, FIV, or live-capital activation.**

---

## 2. Scope

### 2.1 Package identity

| Field | Value | Class |
| ----- | ----- | ----- |
| Package ID | **V3-L02** | AUTHORITATIVE |
| Name | Live order I/O on canonical path, real submit/cancel, real capital movement | AUTHORITATIVE |
| Capability | **LT-02** | AUTHORITATIVE |
| Related risk capability | **RK-03** (policy contents OPEN) | AUTHORITATIVE / OPEN |
| Roadmap position | After V3-L01; before V3-L03 → L04 → L05 | AUTHORITATIVE |
| Current status | **PLANNING PROPOSAL** | This artifact |

### 2.2 Intended planning scope (after separate Approvals)

L02 is intended to define and, **only after** Planning Approval + Slice Approval(s), implement the **smallest safe architecture** for:

1. Binding live execution through the **canonical** Execution Engine → Execution Adapter port (extend; do not fork).
2. Consuming **S04 admission** with **mandatory revalidation immediately before irreversible venue I/O**.
3. Preserving human-start, authorization, Kill Switch, Gate, Session eligibility, workspace live policy, V2 hard stops, and Paper as default.
4. Real **submit** and **cancel** I/O for an explicitly approved venue matrix (venue identity = **PO DECISION REQUIRED**).
5. Representing **ambiguous / unknown venue outcomes** honestly (no false success; no false ordinary failure that invites duplicate submit).
6. Operational persistence required for correctness (orders, adapter ids, client order ids, reconcile markers) — **not** L03 tamper-evident financial action log.
7. Internal submit/cancel idempotency sufficient for safe retries — **not** L05 general financial API replay subsystem.
8. Credential retrieve-at-I/O-time from Vault / Connections with workspace isolation — **not** credential provisioning.
9. Fills entering existing Position → Ledger accounting ownership (ADR-015 / LT-02 path).
10. Explicit non-activation: deployable code must not enable live capital by itself.

### 2.3 Planning objective

Answer the architecture questions required for PO + Chief Architect review (see §32–§34), grounded in repository evidence, without silently resolving OPEN financial/governance semantics.

---

## 3. Non-Scope

L02 **MUST NOT** cover (binding exclusions for this proposal and any future implementation under it unless a new PO act expands scope):

| Exclusion | Belongs to / reason |
| --------- | ------------------- |
| Tamper-evident financial action log | **L03** |
| Honest live operator UI / unhiding `/trading/live` | **L04** (Rule 1) |
| General financial API replay-protection subsystem | **L05** |
| Closing V3-L01 package | Separate PO act |
| Activating LiveCommand / C7 for convenience | Forbidden without explicit PO act |
| Flipping `liveCapitalAuthorized` / weakening Paper Freeze as side effect of “shipping L02 code” | Forbidden without explicit activation gate |
| Credential provisioning / inserting secrets into repo / Vault mutation for production keys | Ops / release / separate gate |
| Withdrawals, deposits, internal transfers, fiat banking | **Not evidenced** as LT-02; **PO DECISION REQUIRED** if desired |
| Second trading engine / parallel Bot path as the live SoT | Forbidden (ADR-020 §4) |
| Treating `live-trading-engine` prototype as canonical without explicit architecture decision | **PO/ARCH decision** (see §33) |
| Numeric live risk thresholds / leverage / shorting / multi-currency expansions | ADR-020 OPEN / OUT OF SCOPE |
| FIV execution / FIV PASS | Separate Ops gates |
| Production live-capital activation / release | Separate PO / Ops gates |
| MFA invention | Production activation OPEN |
| Automatic Paper → Live migration | Forbidden |
| Autonomous live activation | Forbidden (ADR-020 §3) |

```text
L02 planning ≠ L02 authorized ≠ live capital activated ≠ FIV
```

---

## 4. Current Architecture

### 4.1 Canonical money path (AUTHORITATIVE / evidenced)

```text
Strategy Runtime / Manual propose
  → Signal Intent / OrderIntent (mode: paper)
  → OrderService (PaperOrder aggregate)
  → CanonicalOrderPathService.advanceToExecutable
       RISK_PENDING → RiskDecisionService.evaluate
       APPROVED → CASH_RESERVATION_PORT.reserveCash
       RESERVED → EXECUTABLE
  → ExecutionEngineService.submit
       → ExecutionAdapterPort (PaperExecutionAdapter only)
  → PaperFill + Order SUBMITTED → ACKNOWLEDGED → FILLED (or resting)
  → Outbox OrderFillRecorded → PositionAccountingConsumer
  → Ledger / Positions (existing ownership)
```

Primary modules (absolute under `apps/api/src/modules/`):

| Concern | Path |
| ------- | ---- |
| Canonical path | `canonical-order-path/canonical-order-path.service.ts` |
| Orders | `orders/order.service.ts`, `orders.controller.ts` |
| Order SM | `orders/domain/order-status.ts`, `order-intent.ts`, `order.ts` |
| Execution Engine | `execution-engine/execution-engine.service.ts` |
| Execution Adapter port | `execution-adapter/execution-adapter.port.ts` |
| Paper adapter | `execution-adapter/paper-execution.adapter.ts` |
| Strategy driver | `strategy-trading-pipeline/`, `trading-session-runtime.worker.ts` |
| Session eligibility | `trading-session/domain/execution-eligibility.ts` |
| Live admission (S04) | `trading-session/live-admission/` |
| Vault | `secret-vault/` |
| Connections | `connections/` |
| Exchange factory (parallel) | `exchange-adapter/` |
| Live prototype (parallel) | `live-trading-engine/` |

### 4.2 Parallel / non-canonical stacks (evidenced risk)

Still mounted in `app.module.ts`:

| Stack | Role today | Canonical? |
| ----- | ---------- | ---------- |
| `paper-trading-foundation` | Separate paper stores/API | **No** |
| `order-engine` (`/v1/trading-orders`) | Portfolio-scoped US206; no live venue I/O | **No** |
| `live-trading-engine` | Prototype coordinator + EmergencyManager; C7-gated | **No** |
| `exchange-adapter` factory MOCK/BINANCE/BYBIT/OKX | Connectivity / sim / stubs | **Not** wired into `ExecutionEngineService` |

**Architectural risk:** two live-looking surfaces (canonical ADR-012 path vs US210 live prototype). ADR-020 requires live to **extend** the canonical path. L02 must not accidentally productize the parallel path as SoT.

**Planning recommendation (not implementation):** Prefer live binding on `ExecutionAdapterPort` + `ExecutionEngineService`. Treat `live-trading-engine` as non-canonical until PO/Architect explicitly decides migrate/deprecate/freeze (see **AD-L02-01**). Consolidation of paper-trading-foundation / order-engine is **not** required for L02 safety and is **out of L02 scope** unless PO expands.

### 4.3 What prevents accidental live execution today

| Control | Evidence | Effect |
| ------- | -------- | ------ |
| Intent mode hard-coded paper | `createOrderIntent` / OrdersController | Live intent rejected |
| Execution Engine `assertPaper` | `execution-engine.service.ts` | Non-paper throws |
| Adapter factory | `createExecutionAdapterBinding` — mode must be `paper` | Non-paper binding throws |
| Nest DI | Only `PaperExecutionAdapter` bound | No live adapter reachable |
| Venue stubs | `VenueExchangeAdapter.submitOrder/cancelOrder` throw US210 | No real venue place/cancel |
| C7 deny-all | `permission-matrix.ts` | `/v1/live/*` mutations unreachable |
| V2 anchors | `liveCapitalAuthorized: false`, `paperFreeze: true` | S04 DENY |
| Honesty helpers | `livePolicyAuthorizes*` always `false` | No false “authorized to trade live” |
| S04 fail-closed | `decideLiveAdmission` | Unknown/unavailable ⇒ NOT ALLOW |

---

## 5. Canonical Paper Execution Path

```text
HTTP POST /v1/orders (PaperCommand)
  → validation (workspace, account mode paper, exchange-scope)
  → authorization (CommandAuthorizationService + PaperCommand)
  → TradingSession eligibility (RUNNING + fencing) when session-bound
  → OrderIntent / PaperOrder PROPOSED
  → (strategy worker / internal) CanonicalOrderPathService
       → Risk approval
       → Ledger cash reservation
       → EXECUTABLE
  → ExecutionEngineService.submit
  → PaperExecutionAdapter.submit (deterministic match / acknowledge)
  → persist PaperFill + Order transitions
  → Outbox events / response projections
```

**Notes:**

- Public Orders API exposes **propose** and **cancel**, not a public “force submit” for the full Risk→Execute chain; strategy runtime worker drives full `runCanonicalPath`.
- Cancel pre-adapter releases reservation locally; post-adapter cancel goes through `ExecutionEngineService.cancel` → adapter.cancel.
- Idempotency: `idempotencyKey`, `clientOrderId`, `intentHash` with workspace-scoped unique constraints on `PaperOrder`; fill uniqueness on `adapterFillId`.

---

## 6. Proposed Live Execution Path

### 6.1 Target (AUTHORITATIVE planning shape)

```text
Human-start issued (S04 proof)
  → EvaluateLiveAdmission (S04) — necessary snapshot
  → OrderIntent / Order with live mode (exact field representation OPEN)
  → Risk (mandatory; RK-03 contents OPEN)
  → Reservation / exposure control (live semantics OPEN — may differ from paper cash)
  → EXECUTABLE
  → Revalidate S04 safety-critical state immediately before venue I/O
  → ExecutionEngineService.submit
  → Live ExecutionAdapter (Vault-backed, workspace-scoped credentials)
  → Venue submit/cancel
  → Persist known / unknown outcomes honestly
  → Fill → Position → Ledger (existing ownership)
```

### 6.2 Binding principle

| Rule | Source |
| ---- | ------ |
| Single Execution Engine entry | ADR-012 / ADR-020 §4 |
| Live adapter extends factory/port; no parallel engine as SoT | ADR-020 §4 |
| Credentials remain inside adapters; never in logs/UI/orders | ADR-020 §7; Vault ownership |
| Fail closed on ambiguity | ADR-020 §13 |
| Revalidate before irreversible I/O | PO-S04-10 / PO-S04-12; `l02MustRevalidateBeforeVenueIo: true` |

### 6.3 What must change (planning inventory)

| Area | Today | L02 change (proposed; not authorized) |
| ---- | ----- | ------------------------------------- |
| `ExecutionAdapterPort` | Paper-only types (`mode: 'paper'`, `liveCapital: false`) | Extend for live command/result types **or** generalized port — **AD-L02-02** |
| Nest binding / factory | Paper only | Conditional live binding for opted-in workspaces after governance gates — must remain off by default |
| Order intent mode | Paper forced | Live mode representation — **PO-L02-03** / **AD-L02-03** |
| Execution Engine | `assertPaper` | Live branch only after admission revalidation + anchors allow |
| Venue I/O | Stubs / MOCK | Real submit/cancel/query for approved venue(s) |
| Outcome model | filled / acknowledged | Add **unknown / reconciliation_required** outcomes |
| S04 | Admission only; no caller at I/O | Mandatory revalidate call site before venue I/O |
| Human-start | In-memory; consumed by `evaluate` | Freshness model for I/O-time revalidation — **AD-L02-04** |
| C7 / authz | Deny-all | Whether LiveCommand activates — **PO-L02-04** (do not silently activate) |
| V2 anchors | Hard DENY | Flip only via separate activation governance — **not L02 code alone** |

### 6.4 What must NOT change

- Paper remains default for non-opted / non-activated workspaces.
- Canonical Risk mandatory approval.
- Durable Kill Switch substrate (no second KS).
- Runtime Enforcement Gate (no second Gate / no bypass).
- Vault ownership of secrets; Connections holds `vaultSecretId` only.
- S02/S03 `WorkspaceLivePolicyState` SoT semantics (`LIVE_POLICY_OPTED_IN` ≠ execution).
- L03 / L04 / L05 package boundaries.
- Honesty: ALLOW ≠ submitted ≠ filled.

---

## 7. S04 Admission Integration

### 7.1 Authoritative S04 surface (CLOSED)

| Item | Evidence |
| ---- | -------- |
| Service | `LiveAdmissionService` — `apps/api/src/modules/trading-session/live-admission/live-admission.service.ts` |
| Pure evaluator | `decideLiveAdmission` |
| L02 contract | `evaluateForL02Contract` → `LiveAdmissionL02Contract` |
| Persistence of every admission | **Not** Security Audit (PO-S04-11) |
| HTTP controller | **None** |

### 7.2 `LiveAdmissionL02Contract` fields (safe as context, not lasting grant)

- `workspaceId`, `sessionId`, `actorId`
- `admission` (`LiveAdmissionDecision`)
- `evaluatedPolicy`, `authorization`, `gateOutcome`, `killSwitch`
- `evaluatedAt`, `schemaVersion`
- `l02MustRevalidateBeforeVenueIo: true` (**always**)

### 7.3 Binding integration rules for L02

1. L02 **MAY** call `evaluate` / `evaluateForL02Contract` to obtain a snapshot.
2. L02 **MUST** revalidate safety-critical state **immediately before** irreversible venue submit/cancel.
3. L02 **MUST NOT** treat a prior ALLOW as durable authorization across time, process restart, or queue delay.
4. L02 **MUST NOT** invent a second admission engine.
5. Production ALLOW remains impossible while `paperFreeze` / `liveCapitalAuthorized=false` / C7 deny-all remain authoritative — L02 code must preserve fail-closed even if accidentally deployed.

### 7.4 Critical interaction: human-start consume

`evaluate` **consumes** the human-start token (single-use). A second evaluate with the same token → `HUMAN_START_REPLAYED`.

**Implication:** naive “admit once, then submit later” burns the proof. L02 needs an explicit freshness model (see §8 / **AD-L02-04**). Options are listed without selection.

---

## 8. Human Authorization

### 8.1 S04 contract (binding; do not weaken)

Human-start requires: explicit human initiation; actor / workspace / session binding; TTL (`HUMAN_START_PROOF_TTL_MS = 15m`); single-use/replay protection; JWT alone ≠ human-start; Admin enablement ≠ start; Gate ≠ start; AI/autonomous paths cannot satisfy; C7 must not be activated to manufacture satisfaction.

Store today: **in-memory / process-local** (`InMemoryHumanStartProofStore`). Hash-only persistence of token.

### 8.2 How L02 consumes proof (proposed contract; OPEN mechanism detail)

| Requirement | Rule |
| ----------- | ---- |
| No second human-auth mechanism | Prefer S04 proof unless repository evidence forces otherwise |
| Before irreversible I/O | Human-start must be known-valid under S04 semantics |
| After process restart | In-memory proofs are lost ⇒ fail closed until re-issued |
| Multi-order session | **PO/ARCH:** whether one start covers session lifetime vs per-order — **PO-L02-05** |

**Recommended options (not selected):**

1. **Per-I/O issue+consume** — safest against replay; higher operator friction.
2. **Session-scoped start with separate I/O revalidation of non-consumed session lease** — requires new durable model (beyond S04 in-memory) — **AD-L02-04**.
3. **Admit with consume at session arm; I/O revalidates other gates + session-bound start marker** — must not weaken single-use semantics without PO act.

---

## 9. Authorization

| Surface | Today | L02 implication |
| ------- | ----- | --------------- |
| Paper commands | `PaperCommand` | Remains for paper |
| Live commands | `LiveCommand` / C7 deny-all | Activation = **PO-L02-04** |
| RoleAdmin / C6 | S03 policy enablement only | **≠** live execution (PO-S04-01) |
| Workspace membership | Required | Cross-workspace execution forbidden |
| Actor authz change after admission | Not lasting | Revalidate before I/O; open orders at venue are separate (**PO-L02-06**) |

```text
RoleAdmin ≠ live execution
C7 deny-all remains unless explicit PO act
JWT ≠ human-start ≠ LiveCommand grant
```

---

## 10. Kill Switch

### 10.1 Admission (S04 CLOSED)

Durable workspace KS (`WorkspaceKillSwitchState` / `isKillSwitchArmed`):

- ACTIVE ⇒ DENY LIVE
- UNKNOWN/UNAVAILABLE ⇒ MUST NOT ALLOW
- No second KS

### 10.2 L02 execution-time requirements (proposed)

| Checkpoint | Requirement |
| ---------- | ----------- |
| Before new submit | Re-check KS; ACTIVE ⇒ block new live exposure |
| Before cancel I/O | Re-check policy for cancel (**PO-L02-07** whether cancel allowed under KS) |
| Between admission and I/O | Stale ALLOW discarded; revalidate |

### 10.3 Existing / open orders when KS activates — **PO DECISION REQUIRED**

Planning Package L02 scenario #9 states authoritative **intent**: stop evaluation; reject new live orders; **cancel pending per ADR-016 KS**.

Repository evidence:

| Mechanism | Cancels venue open orders? |
| --------- | -------------------------- |
| Durable paper/workspace KS persistence | **No** — “Does not execute halt” |
| `live-trading-engine` EmergencyManager | Best-effort **local** cancel via OrderService; **not** venue REST cancel; C7-gated |

```text
PO-L02-08 — Kill Switch behavior for already-submitted venue orders
Question: On KS ACTIVE, must L02 (a) block new submit only,
(b) attempt venue cancel of outstanding live orders,
(c) both, or (d) other runbook?
Why it matters: Capital bleed vs accidental liquidation semantics.
Evidence: Planning Package #9 AUTHORITATIVE intent; durable KS does not cancel;
  EmergencyManager cancels local only; ADR-020 OPEN runbook detail.
Options: A block-new-only · B best-effort venue cancel · C block-new + venue cancel · D runbook-deferred
Owner: PO / Chief Architect (Ops input)
Do NOT invent emergency liquidation in implementation without this decision.
```

---

## 11. Workspace Live Policy

| State | Meaning | L02 effect |
| ----- | ------- | ---------- |
| `PAPER` | Default | Live I/O DENY |
| `LIVE_POLICY_OPTED_IN` | Admin opt-in only | Necessary, **not** sufficient |

**Policy disable while live orders open — PO DECISION REQUIRED:**

```text
PO-L02-09 — LIVE_POLICY_OPTED_IN → PAPER with open live orders
Question: Does disable (a) block new live I/O only, (b) require cancel,
(c) forbid disable until flat, or (d) other?
Evidence: PO-S03-09 disable → PAPER ONLY (no exchange ops in S03);
  does not define open-order behavior.
Owner: PO / Chief Architect
Do NOT assume policy disable auto-cancels venue orders.
```

---

## 12. Session

S04 minimum eligibility (workspace / lifecycle / execution mode / actor-context) remains binding.

L02 must:

- Bind orders to eligible session context.
- Revalidate session eligibility before irreversible I/O.
- Fail closed on terminal / mismatched / workspace-mismatched session.

**Session termination with open live orders — PO-L02-10** (same class as policy/KS open-order decisions).

Dual session models (durable `TradingSession` vs aggregate `ExecutionMode`) remain residual risk; L02 should consume S04 mappers rather than redesign Session (**PO-S04-05** preserved).

---

## 13. Gate

- Consume `RUNTIME_ENFORCEMENT_PORT.validateDeployment` (purpose `session_start` in S04).
- No bypass; no second Gate.
- Unknown/unavailable ⇒ MUST NOT ALLOW / block live I/O.
- Residual live attribute productization may remain (**D-ARCH-03** residual) — do not invent attribute sets in L02 without decision.

---

## 14. Credential Architecture

### 14.1 Findings

| Concern | Finding |
| ------- | ------- |
| SoT | `SecretVaultService` — AES-256-GCM; AAD binds `workspaceId:type:purpose` |
| Types | `binance` / `bybit` / `okx` (+ non-trading types) |
| Purpose | Exchange secrets use purpose `trading` |
| Connections | Stores opaque `vaultSecretId` only |
| Access | Workspace membership + C8 `VaultConnections` |
| Retrieve | Server-memory only; not a customer API |
| Logs / frontend / orders | Designed **not** to expose secret material |
| L01 | No Vault mutation |

### 14.2 L02 credential boundary (proposed)

1. Retrieve credentials **at adapter I/O time** inside adapter boundary.
2. Scope retrieve by **workspaceId + type + purpose** (+ connection binding as decided).
3. Never persist secrets on Order / Fill / Outbox / logs / API responses.
4. Cross-workspace retrieve must fail closed (existing Vault isolation).
5. Missing/expired/invalid credentials ⇒ fail closed (no venue call with empty signing).
6. **Do not provision** credentials in L02.
7. Process-global credential-less `ExchangeFactory` stubs are **insufficient** for live — L02 needs workspace-bound adapter session (**AD-L02-05**).

### 14.3 Sandbox vs production credentials — **PO-L02-11**

Catalog advertises TESTNET capability; Binance handshake currently uses live API host `https://api.binance.com`. Endpoint/credential environment selection is **OPEN**.

---

## 15. Venue / Exchange Architecture

### 15.1 Inventory

| Venue | Connections + Vault | Handshake | Factory order adapter | Real submit/cancel |
| ----- | ------------------- | --------- | --------------------- | ------------------ |
| MOCK | N/A | N/A | Full in-process sim | Sim only |
| BINANCE | Yes | Real API restrictions check | Stub throws | **No** |
| BYBIT | Yes | `not_implemented` | Stub throws | **No** |
| OKX | Yes | `not_implemented` | Stub throws | **No** |
| Paper (`PaperExecutionAdapter`) | N/A | N/A | Canonical paper | Paper only |

Timeouts, retries, rate limits, sandbox switching, signed live REST/WS order I/O: **largely unimplemented** on venue adapters.

### 15.2 Supported venue(s) for L02 — **PO DECISION REQUIRED**

```text
PO-L02-01 — Supported venue matrix for L02
Question: Which venue(s) are in L02 scope (MOCK-only harness? Binance only?
  multi-venue? testnet vs mainnet)?
Why it matters: Bounds adapter work, FIV, credential policy, SSRF/egress.
Evidence: D-ARCH-08 OPEN; D-OPS-01 OPEN; stubs for BINANCE/BYBIT/OKX;
  MOCK has submit/cancel; PaperExecutionAdapter is paper-only.
Options: A MOCK harness only (no real capital) · B single venue testnet ·
  C single venue mainnet-gated · D multi-venue · E defer venue I/O to later slice
Owner: PO / Chief Architect (Ops input)
```

### 15.3 Adapter recommendation (not selected as final)

Prefer implementing live I/O behind **`ExecutionAdapterPort`** consumed only by Execution Engine (ADR-012), with venue HTTP confined to adapter internals. Do **not** call `ExchangeAdapterService` from Orders/Risk directly.

Whether to reuse `exchange-adapter` types inside a new live `ExecutionAdapter` implementation is **AD-L02-06**.

---

## 16. Order State Machine

### 16.1 Current canonical states

`proposed → risk_pending → approved → reserved → executable → submitted → acknowledged → filled`
(+ `rejected`, `cancel_pending → cancelled`; `cancel_pending` may also → `filled`)

### 16.2 Live gaps

| Need | Current support |
| ---- | --------------- |
| Partial fills | Paper capabilities `partialFills: false`; exchange domain has `PARTIALLY_FILLED` |
| Unknown after timeout | Query returns `outcome: 'unknown'` + `reconciliationRequired: true` on paper adapter; **OrderStatus has no UNKNOWN** |
| Venue accepted + local crash | No dedicated reconciliation state on Order aggregate |

### 16.3 Minimum proposed extension (planning only)

Introduce explicit representation for **uncertain venue outcome** (name TBD — **AD-L02-07**), e.g.:

- adapter/engine result `outcome: 'unknown' | 'reconciliation_required'`
- order marker / status that **blocks optimistic FILLED/CANCELLED/REJECTED**
- forbids automatic resubmit until reconcile

Do **not** map unknown → rejected (duplicate risk). Do **not** map unknown → filled (false success).

---

## 17. Submit Semantics

| Topic | Proposed rule |
| ----- | ------------- |
| Preconditions | Session eligible; S04 revalidation ALLOW; credentials valid; Risk approved; KS inactive; policy opted-in; V2 anchors permit; authz permits |
| Irreversible point | First signed venue submit request that can create capital exposure |
| Success | Only after verified venue acceptance (and local persist of adapter order id / client order id) |
| Known reject | Persist rejected; no fill; no false success |
| Unknown | Persist unknown; **no** automatic duplicate submit |
| Partial | Accounting must reflect venue truth when supported (**PO-L02-12** order types / partial policy) |
| Capital movement | Order-induced exposure / fills / position / ledger — not withdrawals |

---

## 18. Cancel Semantics

| Topic | Finding / proposed rule |
| ----- | ----------------------- |
| Identity | Local `orderId` + `adapterOrderId` / venue id + workspace scope |
| Pre-submit cancel | Local only (paper pattern) — not venue I/O |
| Post-submit cancel | Venue cancel via Execution Engine → live adapter |
| Idempotent cancel | Desired; venue semantics vary — **AD-L02-08** |
| Already filled | Cancel must not invent cancelled; race → filled wins per transition rules / venue truth |
| Already canceled | Idempotent success or no-op — **AD-L02-08** |
| Venue unknown | Unknown outcome; reconcile; no false cancelled |
| Re-admission | Cancel still financial I/O — revalidate KS/policy/authz/session per **PO-L02-07** |
| Irreversibility | Cancel request is irreversible network I/O; cancelled state only when verified |

---

## 19. Idempotency

### 19.1 Existing paper strengths

- `clientOrderId`, `idempotencyKey`, `intentHash` unique per workspace on `PaperOrder`
- Cash reservation idempotency keys
- Fill unique (`workspaceId`, `adapterFillId`)
- Submit `already_executed` when not EXECUTABLE
- Stable paper `adapterOrderId` derivation

### 19.2 Live requirements

| Failure | Required behavior |
| ------- | ----------------- |
| HTTP/client retry | Same idempotency key ⇒ same order; no second venue order |
| Worker retry | Same |
| Network timeout after accept | Reconcile by clientOrderId / venue query before any resubmit |
| Process crash after venue accept before local persist | Reconcile on recovery (**D-ARCH-18**) |
| Duplicate cancel | Safe no-op / idempotent ack |

### 19.3 Sufficiency verdict

Paper local idempotency is **necessary but not sufficient** for live lost-response. Live needs venue-visible client order ids + query/reconcile before retry.

```text
PO-L02-13 / AD-L02-09 — Live idempotency & client order id contract
L05 general replay subsystem is OUT OF SCOPE for L02;
L02 still requires order-level idempotency for safe I/O.
```

Do **not** claim “retry is safe” without reconcile.

---

## 20. Retry Semantics

| Class | Policy (proposed) |
| ----- | ----------------- |
| Known failure before venue accept | May retry under idempotency key |
| Known venue reject | Do not retry as new economic intent without new idempotency / human action |
| Unknown outcome | **No** blind retry; query/reconcile first |
| 5xx / timeout | Treat as **unknown** unless adapter can prove non-accept |
| Credential failure | Fail closed; no retry with empty/invalid signing |
| Rate limit | Backoff; still idempotent |

Exact timeout budgets / backoff — **AD-L02-10** (D-ARCH-06).

---

## 21. Ambiguous Outcome Handling

Honesty matrix (binding for contracts):

| Situation | Must represent as | Must NOT represent as |
| --------- | ----------------- | --------------------- |
| Venue reject verified | known failure / rejected | success |
| Venue accept verified | submitted/acked (not filled unless fill verified) | filled without fill |
| Timeout / lost response | **unknown** | rejected or filled |
| Cancel timeout | **unknown cancel** | cancelled |
| Crash after submit | **unknown** + reconcile required | ignored / proposed |

UI/API contracts for L04 later must consume these distinctions; L02 backend must not bake optimistic success.

---

## 22. Persistence

### 22.1 Operational persistence (in L02 scope)

Minimum correctness data:

- Order aggregate + lifecycle transitions
- `clientOrderId` / idempotency keys
- Venue / adapter order ids when known
- Submission attempt markers / correlation ids
- Unknown / reconciliation_required markers
- Fill facts when verified
- Ledger/position updates via existing pipelines

### 22.2 Not in L02

- Tamper-evident financial action log schema/integrity (**L03**)
- Operator-facing live chrome (**L04**)

### 22.3 Transactions

| Concern | Guidance |
| ------- | -------- |
| Local state vs venue I/O | Cannot put venue inside DB transaction; design for crash windows |
| Persist intent before I/O | Prefer durable “about to submit / submitted-unconfirmed” before or atomically around send — **AD-L02-11** |
| Fill accounting | Preserve existing fill → position → ledger ownership |

---

## 23. Reconciliation

| Source of truth | Authority |
| --------------- | --------- |
| Local order intent / lifecycle | Orders aggregate (operational) |
| Venue order / fill truth | Venue (for live) — query/reconcile |
| Positions | Rebuildable from fills (ADR-015) |
| Balances / cash | Ledger for internal; venue balances for external capital — join design OPEN |
| Tamper-evident audit | **L03** (not L02) |

L02 must define **minimum** reconcile hooks for unknown outcomes (query by clientOrderId / adapterOrderId). Full recovery playbook = **D-ARCH-18** / **PO-L02-14**.

---

## 24. Concurrency

Races to address in design (not implement locks unless evidenced necessary):

| Race | Required semantic |
| ---- | ----------------- |
| Duplicate submit | Idempotency + unique constraints + venue clientOrderId |
| Submit + cancel | State machine + venue truth; cancel_pending vs filled |
| Two workers | Existing optimistic version / unique keys; no second path |
| KS / policy / session / human-start expiry mid-flight | Revalidate before I/O; in-flight unknown handled honestly |
| Credential rotation mid-flight | Fail closed on sign/auth errors; no cross-workspace keys |

Distributed locking: **not** proposed unless repository evidence later requires it.

---

## 25. Failure Modes

| Failure | Classification | L02 handling principle |
| ------- | -------------- | ---------------------- |
| Submit timeout | unknown | Reconcile; no blind retry |
| Submit network failure | unknown unless proven | Same |
| Venue 5xx | unknown / retryable per policy | Same |
| Venue rejection | known failure | Persist reject |
| Accept + response lost | unknown | Reconcile |
| Cancel timeout / lost ack | unknown | Reconcile |
| Process crash | unknown possible orphan | Recovery reconcile |
| DB failure after venue accept | unknown local lag | Reconcile; fail closed new exposure |
| Queue failure | at-least-once | Idempotent handlers |
| Credential failure | known deny | Fail closed |
| KS during execution | block new; open-order policy **PO-L02-08** | |
| Policy disable during execution | **PO-L02-09** | |
| Session invalidation | block new; open-order **PO-L02-10** | |
| Human-start expiry | block new I/O needing start | |

---

## 26. Security Model

### 26.1 Perspectives

| Perspective | Trust boundary | Failure mode | Misleading behavior | Dangerous assumption | Required invariant |
| ----------- | -------------- | ------------ | ------------------- | -------------------- | ------------------ |
| **Developer** | Module ports; no cross-bypass | Wiring live prototype instead of canonical path | Treating stubs as production-ready | “Retry is safe” | Only Execution Engine calls adapter; unknown ≠ reject |
| **Consumer / Operator** | API honesty | Seeing “submitted” on unknown | Optimistic UI | Policy opt-in = live | Explicit states; Paper ≠ Live |
| **Security** | Authn/authz/workspace/Vault/egress | C7 activation; credential leak; SSRF | Admission ALLOW as execution | Stale admission | Revalidate; fail closed; no secret logging |

### 26.2 Security review checklist (planning risks)

| Risk | Assessment |
| ---- | ---------- |
| SSRF / arbitrary venue URL | Real if adapter accepts operator-supplied URLs; prefer fixed allowlisted endpoints per venue — **SD-L02-01** |
| Credential exposure | Mitigated by Vault design if L02 preserves boundary |
| Workspace isolation | Vault AAD + membership; must extend to adapter session |
| Authorization bypass | Risk if parallel `/v1/live` path productized without gates |
| Replay | Human-start single-use; order idempotency; L05 still separate |
| Duplicate orders | Primary live risk on lost-response |
| Race conditions | KS/policy/session vs I/O |
| Confused deputy | Connections/Vault retrieve must stay workspace-bound |
| Forged human-start | Hash + consume + binding; in-memory store limits durability |
| Stale admission | `l02MustRevalidateBeforeVenueIo` |
| Venue response spoofing | TLS + official endpoints; no trust of unsigned responses |
| Request signing | Venue-specific; inside adapter |
| Logging secrets | Forbidden |
| Error leakage | Separate public vs diagnostic reasons (S04 precedent) |
| DoS / rate limits | Venue + local limits OPEN |

---

## 27. Consumer Honesty

Backend contracts and any interim operator messages must preserve:

```text
Paper ≠ Live
Policy enabled ≠ live execution authorized
Admission ALLOW ≠ order submitted
Order submitted ≠ order filled
Network success ≠ venue success unless verified
Unknown venue outcome ≠ rejected
Cancel requested ≠ canceled
```

No optimistic “success” API for unknown venue outcomes. L04 will later present these states; L02 must not poison the contract.

---

## 28. API / Command Surface

### 28.1 Existing surfaces

| Surface | Path | Notes |
| ------- | ---- | ----- |
| Paper orders | `POST/GET /v1/orders`, cancel | PaperCommand; mode paper |
| Trading sessions | `/v1/trading-sessions` | Paper lifecycle |
| Live prototype | `/v1/live/...` | C7 deny-all |
| Live policy admin | enable/disable | C6; not execution |
| Exchange connect | `/v1/exchanges/...` | Simulated connect; no submit HTTP |

### 28.2 L02 API options (not selected)

| Option | Pros | Cons |
| ------ | ---- | ---- |
| Extend canonical Orders API with live mode after gates | One path | Must not break Paper Freeze honesty |
| Internal-only command/worker path first | Smaller attack surface | L04 later needs API |
| Activate `/v1/live` prototype | Existing shapes | **Non-canonical**; high architecture risk |

**Recommendation for review:** Prefer canonical Orders/Execution path; treat `/v1/live` as non-SoT pending **AD-L02-01**. Exact endpoint set = **AD-L02-12**.

For every future live place/cancel API, require: authentication; authorization; workspace; session; human-start; admission revalidation; idempotency key; validation; honest error/unknown semantics; CSRF if cookie-based (follow existing API norms).

---

## 29. L03 Boundary

| L02 may | L02 must not |
| ------- | ------------ |
| Ordinary operational order/fill/reconcile persistence | Tamper-evident financial action log |
| Correlation ids for ops correctness | Claim SEC-16 integrity mechanism delivered |
| Emit existing Outbox/domain events as today | Implement L03 schema/hash-chain |

```text
Operational persistence ≠ financial action audit evidence
```

---

## 30. L04 Boundary

| L02 may | L02 must not |
| ------- | ------------ |
| Define honest backend states/contracts L04 will consume | Implement live operator UI |
| Keep `/trading/live` redirected/hidden | Unhide live UI |

---

## 31. L05 Boundary

| L02 may | L02 must not |
| ------- | ------------ |
| Order-level idempotency / clientOrderId / reconcile-before-retry | General financial API replay-protection subsystem |
| Reuse S04 human-start replay protection | Treat S04 human-start as L05 completion |

---

## 32. PO Decisions Required

| ID | Question | Why it matters | Current evidence | Options (not selected) | Owner |
| -- | -------- | -------------- | ---------------- | ---------------------- | ----- |
| **PO-L02-01** | Supported venue(s) + sandbox vs production | Bounds all I/O work and FIV | D-ARCH-08/D-OPS-01 OPEN; stubs vs MOCK | A MOCK-only · B single testnet · C single mainnet-gated · D multi-venue · E defer | PO + Ops |
| **PO-L02-02** | Exact meaning of “real capital movement” for L02 | Prevents silent scope expansion | LT-02 path = place/cancel/fill/position/ledger; no withdrawal flow | A order-induced only · B include transfers/withdrawals · C defer transfers forever | PO |
| **PO-L02-03** | Live order types / instruments allowed | Risk and adapter surface | Paper market/limit; partialFills false | A market+limit spot only · B expand · C venue-defined subset | PO + Arch |
| **PO-L02-04** | Activate `LiveCommand` / C7? | Authz gate for live APIs | C7 deny-all; PO-S04-02 preserve unless new act | A keep deny-all + alternate cell · B activate C7 for specific roles · C new PermissionClass | PO |
| **PO-L02-05** | Human-start granularity (per session vs per order vs per I/O) | Safety vs operability; interacts with consume-on-evaluate | S04 in-memory single-use 15m TTL | A per I/O · B session-scoped durable · C hybrid | PO + Arch |
| **PO-L02-06** | Actor authz loss with open venue orders | Security vs capital | Revalidate before new I/O only today | A block new only · B force cancel · C freeze+runbook | PO |
| **PO-L02-07** | Does cancel require full re-admission / allow under KS? | Cancel may reduce or complicate exposure | Not specified | A full re-admit · B KS allows cancel-only · C deny all I/O including cancel | PO + Arch |
| **PO-L02-08** | KS behavior for outstanding venue orders | Capital bleed vs liquidation | Planning #9 intent cancel pending; code doesn’t venue-cancel | A block-new · B venue cancel · C both · D runbook later | PO + Ops |
| **PO-L02-09** | Policy disable with open live orders | Operator expectation | S03 disable = PAPER only, no exchange ops | A block-new · B forbid disable · C auto-cancel · D runbook | PO |
| **PO-L02-10** | Session termination with open live orders | Orphan exposure | Dual session models; eligibility DENY | Same option class as PO-L02-09 | PO + Arch |
| **PO-L02-11** | Credential environment (testnet/mainnet) + provisioning authority | Prevent accidental mainnet | Handshake uses Binance mainnet host; TESTNET catalog unused | A testnet-only until release · B mainnet with separate gate · C both with purpose slots | PO + Ops + Sec |
| **PO-L02-12** | Max order size / workspace capital limits / RK-03 contents | Risk | D-ARCH-09 OPEN; thresholds not invented | Defer numeric limits · Approve specific RK-03 · External risk service | PO + Arch |
| **PO-L02-13** | Idempotency / ambiguous submit product policy | Duplicate capital | Paper keys strong; live reconcile OPEN | Adopt reconcile-first · Require venue clientOrderId · Other | PO + Arch |
| **PO-L02-14** | Reconciliation / balance SoT expectations for L02 exit | Completeness vs L03 | D-ARCH-18 OPEN | Minimal query-reconcile · Full balance sync · Defer balances | PO + Arch |
| **PO-L02-15** | Approval/confirmation semantics beyond S04 human-start | Extra confirm UX | MFA OPEN | No extra · MFA later · Per-order confirm | PO |
| **PO-L02-16** | Whether L02 may ship behind flags while V2 anchors remain deny | Deploy safety | Anchors hard DENY today | Code dark · Require anchor flip for any live path tests in prod-like envs | PO + Sec |

---

## 33. Architecture Decisions Required

| ID | Decision | Why | Evidence | Notes |
| -- | -------- | --- | -------- | ----- |
| **AD-L02-01** | Canonical live path vs `live-trading-engine` prototype | Prevent dual SoT | ADR-020 extend canonical; parallel US210 stack exists | Prefer canonical; freeze/deprecate prototype |
| **AD-L02-02** | How to extend `ExecutionAdapterPort` for live | Port is paper-typed today | `execution-adapter.port.ts` | Generalize vs parallel live port (still single engine entry) |
| **AD-L02-03** | Order live-mode field / persistence model | Intent mode forced paper | `order-intent.ts`, PaperOrder | |
| **AD-L02-04** | Human-start durability + I/O revalidation model | In-memory consume-on-evaluate | `human-start-proof.ts` | |
| **AD-L02-05** | Workspace-bound credentialed adapter session | Factory is credential-less | `exchange-factory.ts`, Vault retrieve | |
| **AD-L02-06** | Relationship live ExecutionAdapter ↔ `ExchangeAdapter` types | Two ports | execution-adapter vs exchange-adapter | |
| **AD-L02-07** | Unknown/reconcile order state representation | No UNKNOWN status | `order-status.ts` | |
| **AD-L02-08** | Cancel idempotency / already-terminal semantics | Venue variance | Paper cancel patterns | |
| **AD-L02-09** | Live clientOrderId / idempotency contract | Lost-response | Paper uniques; D-ARCH-07 | Not L05 |
| **AD-L02-10** | Timeout / retry / backoff policy | D-ARCH-06 | No venue timeouts today | |
| **AD-L02-11** | Persist-before-send vs send-before-persist crash window | Orphan venue orders | D-ARCH-18 | |
| **AD-L02-12** | API/command surface for live place/cancel | Multiple existing surfaces | Orders vs `/v1/live` | |
| **AD-L02-13** | Live reservation / exposure model vs paper cash reserve | Capital semantics differ | Ledger reservation paper-oriented | |
| **AD-L02-14** | Slice decomposition of L02 (see §35) | D-ARCH-01 L02 OPEN | This proposal | |

Residual register items: **D-ARCH-06, 07, 08, 09, 18** remain OPEN pending decisions above.

---

## 34. Security Decisions Required

| ID | Decision | Why | Owner |
| -- | -------- | --- | ----- |
| **SD-L02-01** | Egress allowlist / fixed venue endpoints (anti-SSRF) | Adapter network I/O | Security + Arch |
| **SD-L02-02** | Live trading secret-type / purpose policy (incl. testnet separation) | Credential mixups | Security + Ops |
| **SD-L02-03** | Whether C7 activation is acceptable security posture | Live API authz | Security + PO |
| **SD-L02-04** | TLS / certificate requirements for venue calls | Transport | Security |
| **SD-L02-05** | Logging / error redaction standard for live I/O | Secret & PII leakage | Security |
| **SD-L02-06** | Rate-limit / abuse controls on live place/cancel | DoS / runaway bots | Security + Arch |
| **SD-L02-07** | MFA requirement timing relative to L02 vs activation | ADR-020 MFA OPEN | PO + Security |

---

## 35. Proposed Implementation Decomposition

Slice IDs below are **PROPOSED** for PO/Architect acceptance (D-ARCH-01 L02 portion). Do not silently rename after approval without a PO act.

### PROPOSED-V3-L02-S01 — Canonical Live Binding Contract (no venue I/O)

| Field | Content |
| ----- | ------- |
| Objective | Define live mode types, ExecutionAdapterPort extension design, unknown-outcome contract, S04 revalidation call-site contract — **without** real venue calls |
| Scope | Types/contracts/tests/fakes; preserve Paper path |
| Dependencies | S04 CLOSED; ADR-020; this planning approval |
| Security boundary | No credentials; no network; V2 anchors unchanged |
| Acceptance | Contracts reviewable; Paper regression green; no live I/O |
| Tests | Unit/contract; Paper regression |
| Non-scope | Venue HTTP; C7 activation; L03–L05 |

### PROPOSED-V3-L02-S02 — Admission Revalidation at Execution Boundary

| Field | Content |
| ----- | ------- |
| Objective | Wire mandatory S04 revalidation immediately before adapter I/O in Execution Engine (fail-closed) |
| Scope | Engine guard; human-start freshness per approved PO-L02-05/AD-L02-04 |
| Dependencies | S01 contracts; S04 service |
| Security boundary | Deny when anchors/KS/policy/authz/gate/session/start fail |
| Acceptance | No adapter call without revalidation ALLOW; stale ALLOW rejected |
| Tests | Unit/service; race with KS/policy/session |
| Non-scope | Real venue; credential retrieve |

### PROPOSED-V3-L02-S03 — Vault-Scoped Live Adapter Skeleton (MOCK or approved harness)

| Field | Content |
| ----- | ------- |
| Objective | Workspace-bound adapter session retrieving from Vault; MOCK/harness submit/cancel with unknown-outcome support |
| Scope | Adapter + isolation tests; still no production venue unless PO-L02-01 says otherwise |
| Dependencies | S01–S02; Vault/Connections |
| Security boundary | No cross-workspace credentials; no secret logging |
| Acceptance | Isolation proofs; unknown outcomes represented |
| Tests | Adapter/security/isolation/idempotency |
| Non-scope | Production mainnet; L04 UI |

### PROPOSED-V3-L02-S04 — Real Venue Submit/Cancel (approved venue only)

| Field | Content |
| ----- | ------- |
| Objective | Implement real submit/cancel/query for PO-approved venue/environment |
| Scope | Signed I/O; error mapping; timeouts; clientOrderId; reconcile hooks |
| Dependencies | S01–S03; PO-L02-01/11; SD-L02-01 |
| Security boundary | Allowlisted egress; TLS; redaction |
| Acceptance | Known success/fail/unknown proven in tests (not FIV claim) |
| Tests | Adapter integration with recorded fixtures; failure injection |
| Non-scope | FIV PASS; activation; multi-venue creep |

### PROPOSED-V3-L02-S05 — Idempotency, Crash-Window, Reconcile Minimum

| Field | Content |
| ----- | ------- |
| Objective | Close D-ARCH-06/07/18 minimum: reconcile-before-retry; crash after submit; duplicate prevention |
| Scope | Persistence markers; query reconcile; worker safety |
| Dependencies | S04 venue I/O |
| Security boundary | No blind retry; no false terminal states |
| Acceptance | Duplicate submit prevented across retry/timeout/restart scenarios in tests |
| Tests | Idempotency/concurrency/failure injection |
| Non-scope | L05 API replay; L03 audit log |

### PROPOSED-V3-L02-S06 — KS/Policy/Session Open-Order Policy Hooks

| Field | Content |
| ----- | ------- |
| Objective | Implement **only** the behaviors decided in PO-L02-07…10 |
| Scope | Block-new and/or cancel hooks as approved |
| Dependencies | PO decisions; S04–S05 |
| Security boundary | No invented liquidation |
| Acceptance | Matches PO decisions exactly |
| Tests | KS/policy/session race tests |
| Non-scope | Full Ops runbook productization if PO defers |

```text
Each slice still requires individual Slice Approval.
Proposed decomposition ≠ implementation authorization.
```

---

## 36. Acceptance Criteria

Measurable L02 package acceptance (after authorized implementation — **not** claimed now):

| ID | Criterion |
| -- | --------- |
| **AC-01** | Live I/O uses canonical Execution Engine → Adapter path (no parallel SoT). |
| **AC-02** | S04 admission revalidated immediately before irreversible venue I/O. |
| **AC-03** | Human-start verified per S04 contract / approved L02 freshness model. |
| **AC-04** | Authorization explicitly evaluated; cross-workspace execution rejected. |
| **AC-05** | Workspace isolation enforced for orders and credentials. |
| **AC-06** | Kill Switch ACTIVE blocks new live submit per approved policy. |
| **AC-07** | Paper Freeze / `liveCapitalAuthorized` hard stops remain authoritative until separate activation act. |
| **AC-08** | Credentials retrieved only inside adapter boundary from Vault; never logged/UI/order-persisted. |
| **AC-09** | Real submit implemented for approved venue/harness scope only. |
| **AC-10** | Real cancel implemented with honest terminal/unknown semantics. |
| **AC-11** | Idempotency prevents duplicate venue orders across retries/timeouts/restarts. |
| **AC-12** | Ambiguous outcomes are unknown/reconcile — not false success/false ordinary failure. |
| **AC-13** | Operational persistence sufficient for crash-window recovery of in-flight submits. |
| **AC-14** | Minimum reconciliation path exists for unknown outcomes. |
| **AC-15** | Failure handling fail-closed for new live exposure under uncertainty. |
| **AC-16** | No false success responses for unknown venue outcomes. |
| **AC-17** | No false “rejected” that invites duplicate submit when outcome unknown. |
| **AC-18** | No credential leakage in logs, API, frontend, or order records. |
| **AC-19** | No cross-workspace execution or credential use. |
| **AC-20** | No accidental Paper/Live confusion in API contracts. |
| **AC-21** | No C7 bypass; C7 remains deny-all unless explicit PO act. |
| **AC-22** | No L03 tamper-evident financial action log implementation. |
| **AC-23** | No L04 live UI implementation / unhide. |
| **AC-24** | No L05 general replay-protection subsystem implementation. |
| **AC-25** | Paper default preserved; deploy does not auto-activate live capital. |
| **AC-26** | Fills enter existing Position/Ledger ownership without second ledger. |
| **AC-27** | RK-03 / financial limits only as PO-approved (no invented thresholds). |

---

## 37. Test Strategy

Plan (do **not** execute a large implementation campaign under this planning act):

| Layer | Focus |
| ----- | ----- |
| Unit | State transitions; unknown outcomes; idempotency helpers; mappers |
| Domain | Order SM extensions; admission revalidation predicates |
| Service | Execution Engine guards; cancel/submit orchestration |
| Integration | Adapter + Vault retrieve (harness); Nest module wiring |
| Database | Unique constraints; crash markers; optimistic concurrency |
| Adapter | Venue fixtures; timeout; 5xx; reject; accept |
| Authorization | Workspace; roles; C7 posture |
| Security | Redaction; isolation; SSRF allowlist |
| Idempotency | Retry/timeout/restart duplicate prevention |
| Concurrency | submit+cancel; dual worker |
| Failure injection | DB down; process kill; queue redelivery |
| Ambiguous venue | Lost response; query reconcile |
| KS / policy / session races | Mid-flight changes |
| Credential isolation | Cross-workspace deny |
| Workspace isolation | Order+secret boundaries |
| Paper regression | Canonical paper path unchanged for default workspaces |

Implementation tests ≠ FIV. FIV remains separately gated.

---

## 38. Rollout / Safety Strategy

| Rule | Binding |
| ---- | ------- |
| Paper default | Preserved |
| Deploy ≠ activate | L02 code must not enable live capital merely by shipping |
| No automatic Paper→Live migration | Preserved |
| No implicit credential activation | Preserved |
| No automatic venue connection | Preserved |
| No autonomous activation | ADR-020 |
| Feature flags | Use only if repository already supports; do not invent ad hoc flag systems in planning as implementation |
| V2 anchors | Remain deny until explicit activation governance |
| Production execution | Requires all package/slice gates + activation/release gates + (typically) FIV |

---

## 39. Risks

| Risk | Severity | Mitigation direction |
| ----- | -------- | -------------------- |
| Dual execution paths (canonical vs live-trading-engine) | High | AD-L02-01; freeze prototype |
| Duplicate orders on lost-response | Critical | Reconcile-first; unknown state |
| Accidental mainnet | Critical | PO-L02-01/11; egress allowlist |
| KS without venue cancel | High | PO-L02-08 explicit |
| In-memory human-start loss | High | AD-L02-04 |
| Partial fills unsupported locally | Medium | PO-L02-03 / state extension |
| Scope creep into L03/L04/L05 | High | Explicit boundaries |
| Treating S04 ALLOW as durable | Critical | Revalidation mandatory |
| Credential-less factory reused for live | High | AD-L02-05 |

---

## 40. Open Questions

1. Final L02 slice ID canonicalization vs PROPOSED-* retention (non-blocking precedent).
2. Whether manual HTTP live propose+execute becomes a first-class operator API in L02 or waits for L04.
3. Whether live cash reservation equals paper ledger reservation or a distinct exposure model (**AD-L02-13**).
4. Whether MOCK-only S03 can be accepted as an intermediate “I/O shape complete” without real venue (still not live capital).
5. How production activation will flip `liveCapitalAuthorized` / Paper Freeze without weakening non-opted workspaces.
6. Ops FIV venue identity when PO-L02-01 selects real venue (**D-OPS-01**).
7. Interaction of L02 unknown states with future L04 UI enum (**D-ARCH-14/15** — L04 owns UX).

---

## Governance State After This Artifact

```text
V3-L02                          = PLANNING PROPOSAL
V3-L02 Planning Approval        = NOT GRANTED
V3-L02 Slice Approval           = NOT GRANTED
V3-L02 IMPLEMENTATION           = NOT AUTHORIZED
L03 / L04 / L05                 = NOT AUTHORIZED
V3-L01                          = NOT CLOSED (S01–S04 CLOSED)
Live capital                    = NOT ACTIVATED
FIV                             = NOT PERFORMED
Wave 6                          = NOT COMPLETE
C7                              = DENY-ALL / UNBOUND
```

---

## STOP

**STOP.** This document is a **PLANNING PROPOSAL ONLY**.

Do **not** implement L02 from this artifact.
Do **not** submit or cancel real orders.
Do **not** connect to exchanges for live capital.
Do **not** provision credentials.
Do **not** activate C7.
Do **not** modify Paper Freeze or `liveCapitalAuthorized`.
Do **not** perform FIV.
Do **not** close L02 / V3-L01 / Wave 6.

Wait for PO + Chief Architect Planning Review (and subsequent Slice Approval) before any implementation.
