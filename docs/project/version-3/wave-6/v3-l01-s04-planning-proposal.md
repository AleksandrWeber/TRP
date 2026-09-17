# V3-L01-S04 Planning Proposal

**Document:** PROPOSED-V3-L01-S04 Individual Slice Planning Proposal  
**Date:** 2026-09-17  
**Package:** V3-L01 — Live capital ADR + workspace policy (LT-01)  
**Wave:** 6 — Live Trading  
**Nature:** Individual slice planning proposal only. **Not** S04 implementation approval. **Not** implementation. **Not** Gate/KS/Session mutation. **Not** LiveCommand activation. **Not** FIV. **Not** live-capital activation. **Not** an ADR. **Not** a Master Plan / Roadmap revision.  
**Authority:** Planning Engineer / Solution Architect under PO / Chief Architect governance lifecycle  
**Preceded by:** V3-L01-S03 Final Close — **CLOSED** ([`v3-l01-s03-final-close.md`](./v3-l01-s03-final-close.md))  
**Slice planning approval (package):** [`v3-l01-slice-approval.md`](./v3-l01-slice-approval.md)  
**ADR:** [`docs/adr/ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)  
**Repository baseline:** `189f212512a737789bf87ca60f505440687a464a` (`docs(wave-6): close v3-l01-s03`)

```text
PROPOSED-V3-L01-S04
PLANNING ONLY
NOT APPROVED FOR IMPLEMENTATION

This artifact is a planning proposal only.
S04 implementation requires explicit PO / Chief Architect Slice Approval
after Planning Review of this proposal.
S03 Final Close ≠ S04 authorization.
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Executive Summary

**PROPOSED-V3-L01-S04 — Gate · KS · Session Admission Wiring, Fail-Closed** is the final V3-L01 slice. It must establish the architecture for a **fail-closed live admission decision** that consumes:

```text
WorkspaceLivePolicyState (S02/S03 SoT)
  + authorization
  + Runtime Enforcement Gate
  + Kill Switch
  + Session eligibility
  + human-start
  + V2 Paper Freeze / liveCapitalAuthorized anchors
```

The binding distinction (preserved from ADR-020 / S01–S03):

```text
Policy ≠ authorization ≠ admission ≠ execution
```

S04 owns **admission wiring only**. S04 does **not** own real exchange I/O, credentials, LiveCommand activation, L02–L05, or live-capital activation.

Repository reconnaissance shows:

- Gate exists (`RuntimeEnforcementPort.validateDeployment`) but evaluates **Strategy Library certification only** — no live-policy / KS / human-start inputs today.
- Durable workspace Kill Switch exists (`WorkspaceKillSwitchState` / `isKillSwitchArmed`) but production recovery policy is stubbed to always-inactive (`InactiveRecoveryEventAdmissionPolicy`).
- Dual Session models exist (durable paper `TradingSession` vs aggregate with `ExecutionMode`); no unified live admission object exists.
- S02/S03 policy SoT is ready; honesty helpers `livePolicyAuthorizes*` remain always `false`.
- `PermissionClass.LiveCommand` / C7 remains deny-all / unbound.
- V2 anchors remain `paperFreeze: true` and `liveCapitalAuthorized: false`.
- No code path currently enforces ADR-020 “human start” as a live-admission prerequisite.

This proposal maps that evidence into a concrete admission architecture **for PO / Chief Architect review**, marks BLOCKING OPEN decisions, and defines acceptance criteria. **No code, migration, Gate/KS/Session change, or permission change is authorized by this artifact.**

---

## 2. Governance State

Do **not** reinterpret these states:

| Item | Status |
| ---- | ------ |
| Wave 6 Planning | **APPROVED** |
| ADR-020 | **ACCEPTED** |
| D-GOV-05 | **GRANTED** (wave-level; package/slice gates remain) |
| V3-L01 Package Planning | **APPROVED** |
| V3-L01 Slice Planning | **APPROVED** (S01 → S02 → S03 → S04 decomposition) |
| V3-L01-S01 | **CLOSED** |
| V3-L01-S02 | **CLOSED** (impl `d6bfba29e0ec3b73e1d964ba60c8bb3230a2bc23`) |
| V3-L01-S03 | **CLOSED** (impl `d8d64e64d979a540eccd739eb056d1ab02465b1e`) |
| **V3-L01-S04** | **NOT APPROVED FOR IMPLEMENTATION** |
| L02–L05 | **NOT AUTHORIZED** |
| Live capital activation | **NOT AUTHORIZED** |
| FIV | **NOT PERFORMED** / **NOT AUTHORIZED** |
| Wave 6 | **NOT COMPLETE** |
| Wave 5 | **NOT COMPLETE** / **NOT CLOSED** |

Evidence: [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md) · ADR-020 · [`v3-l01-s03-final-close.md`](./v3-l01-s03-final-close.md).

```text
This planning proposal ≠ S04 Slice Approval
S04 Slice Approval ≠ live ready
Admission ALLOW ≠ live trading available ≠ capital movement
```

**D-ARCH status (register):** D-ARCH-02 S02/S03 portions **DECIDED / CLOSED**. **D-ARCH-03** (Gate live admission attributes), **D-ARCH-04** (Session live-mode integration), **D-ARCH-05** (KS live wiring) remain **OPEN** — this proposal surfaces them as **PO-S04 OPEN DECISIONS**.

---

## 3. Scope

### 3.1 Slice identity

| Field | Value |
| ----- | ----- |
| **Proposed Slice ID** | **PROPOSED-V3-L01-S04** |
| **Name** | Gate · KS · Session Admission Wiring, Fail-Closed |
| **Package** | V3-L01 |
| **Position** | Fourth / final slice in approved order S01 → S02 → S03 → S04 |
| **Type** | Fail-closed live admission foundation wiring (consume-only of Gate / KS / Session / policy) |
| **Follows** | S03 — Admin Enable/Disable + Audit (**CLOSED**) |
| **Precedes** | V3-L01 Package Completion / PO Package Review (separate); then L02 (unauthorized) |

**Do not silently canonicalize or rename** this ID in this act. Canonical rename remains **OPEN / NON-BLOCKING** (same convention as PO-S02-07 / PO-S03-11).

### 3.2 Intended planning scope (after separate Approval)

S04 is intended to define and, after separate Approval, implement:

1. A **live admission evaluator** that fail-closes on unknown / missing / invalid / contradictory inputs.  
2. Consumption of S02/S03 `WorkspaceLivePolicyState` as a **necessary-but-not-sufficient** input.  
3. Consumption of Runtime Enforcement Gate (`validateDeployment` / `EnforcementDecision`) without bypass.  
4. Consumption of durable Kill Switch state (`armed` ⇒ deny live admission).  
5. Minimum Session eligibility checks required for admission (not full Session redesign).  
6. Explicit human-start evaluation if required by ADR-020 (reuse existing mechanism if found; otherwise define minimum wiring — **OPEN**).  
7. Hard preservation of V2 `paperFreeze` and `liveCapitalAuthorized` as admission prerequisites.  
8. Explicit authorization evaluation for the admission actor (exact cell — **OPEN**).  
9. A machine-readable admission decision object (reuse or minimal new type — **OPEN**).  
10. Deny-reason exposure policy that avoids security leakage.  
11. Concurrency / staleness boundary vs future L02 execution revalidation.  
12. Negative evidence that S04 cannot reach venue / credentials / capital.

### 3.3 Planning objective

Resolve D-ARCH-03 / D-ARCH-04 / D-ARCH-05 **as a proposal for PO / Chief Architect review**, grounded in repository evidence — without inventing silent decisions or shipping code.

---

## 4. Explicit Non-Scope

S04 **MUST NOT** cover (binding exclusions):

| Exclusion | Belongs to |
| --------- | ---------- |
| Real exchange order submit / cancel / capital movement | **L02** / activation gates |
| Live adapter venue binding / production credentials | **L02** / Ops |
| Credential provisioning / Vault mutation | Ops / later |
| Tamper-evident financial action log | **L03** |
| Live operator UI / unhiding `/trading/live` | **L04** (Rule 1) |
| Replay-protection mechanism | **L05** |
| Unbinding `PermissionClass.LiveCommand` for all roles “for convenience” | **Forbidden** unless explicit later PO act |
| Flipping V2 `liveCapitalAuthorized` / weakening `paperFreeze` | **Forbidden** |
| Second policy store / replacing S02 SoT | **Forbidden** |
| Second Kill Switch / second Gate / parallel execution engine | **Forbidden** (ADR-020) |
| Reinterpreting `LIVE_POLICY_OPTED_IN` as authorization or execution | **Forbidden** |
| Treating Security Audit evidence as authorization | **Forbidden** |
| MFA invention | Production activation / later (PO-S03-10 precedent) |
| Full KS incident runbook productization | Later / Ops (**NON-BLOCKING OPEN** for full runbook) |
| Live-capital activation / FIV / production release | Separate gates |
| Closing V3-L01 package or Wave 6 | Separate PO acts |

**S04 must not create a mechanism that allows live trading by itself.**

Even if an admission evaluation returns ALLOW in a test environment, that does **not** activate live trading.

---

## 5. Repository Reconnaissance

### 5.1 Method

Inspected Wave 6 / ADR-020 / S01–S03 governance artifacts, then searched Runtime Enforcement Gate, Kill Switch (trading-session + live-trading-engine), Trading Session dual models, Auth permission matrix, S02/S03 live-policy ports, V2 conformance anchors, recovery admission precedents, and human-start references.

### 5.2 Authoritative findings (current truth)

| Surface | Evidence | Finding |
| ------- | -------- | ------- |
| Gate | `runtime-enforcement/` · `validateDeployment` · `EnforcementDecision` | Library certification Gate; purposes `deployment_bind` \| `session_start`; **no** live-policy/KS/human-start inputs |
| Durable KS | `durable-kill-switch-state.ts` · Prisma `WorkspaceKillSwitchState` | Workspace-scoped `armed` persistence; **does not** execute halt or wire admission by itself |
| KS admission stub | `InactiveRecoveryEventAdmissionPolicy` | Production binding returns `isKillSwitchActive() → false` always |
| Recovery admission precedent | `decideRecoveryEventAdmission()` | Pure function; `killSwitchActive` ⇒ `'kill_switch_active'` block |
| Live engine KS | `live-trading-engine/EmergencyManager` | Session-scoped emergency stop; C7-gated REST; **distinct** from durable workspace KS |
| Durable Session | `trading-session.ts` · `TradingSessionService` | Production paper lifecycle; **no** `ExecutionMode` field |
| Aggregate Session | `trading-session-aggregate.ts` | Has `ExecutionMode.PAPER \| LIVE \| RESEARCH`; used by research/paper runner |
| Paper rejects | `PaperTradingRunner` · `ResearchApplicationService` · `ExecutionEngineService` | Non-PAPER / non-`paper` rejected today |
| LiveCommand C7 | `permission-matrix.ts` · live controller | **Deny-all** — never granted to any role |
| RoleAdmin C6 | S03 live-policy Admin API | Used for **policy enablement**, not live execution |
| S02/S03 policy | `workspace/live-policy/*` | Canonical SoT; `PAPER` / `LIVE_POLICY_OPTED_IN` |
| Honesty helpers | `livePolicyAuthorizes*` | Always `false` |
| V2 anchors | `v2-certification-checklist.ts` · `v2-compatibility-matrix.ts` | `liveCapitalAuthorized: false`; `paperFreeze: true` |
| Human-start | ADR-020 / planning docs | **Required by ADR**; **no** dedicated live-admission human-start code found |
| Live admission object | Search | **None** unifying policy+Gate+KS+Session |
| S04 implementation | Search | **Absent** (correct) |

### 5.3 Protected leftovers

Known dirty/untracked Wave 5 leftovers exist in the working tree. They are **out of scope** for this planning act and were **not** modified, staged, renamed, or cleaned.

---

## 6. Existing Gate Architecture

### 6.1 Implementation

| Piece | Path |
| ----- | ---- |
| Port | `apps/api/src/modules/runtime-enforcement/ports/runtime-enforcement.port.ts` |
| Pure logic | `apps/api/src/modules/runtime-enforcement/domain/validate-deployment.ts` |
| Nest adapter | `apps/api/src/modules/runtime-enforcement/runtime-enforcement-gate.service.ts` |
| Reject error | `runtime-enforcement-rejected.error.ts` |

### 6.2 Decision I/O (actual)

**Input (`ValidateDeploymentRequest`):** `workspaceId`, optional strategy identity fields, `purpose: 'deployment_bind' | 'session_start'`, optional `tradingSessionId`, `requestedAt`.

**Output (`EnforcementDecision`):** `outcome: 'pass' | 'fail'`, `validation: 'VALID' | 'INVALID'`, `reasons: EnforcementReasonCode[]`, `checkedAt`.

**Deny reasons today:** strategy/certification/eligibility/envelope/scope/`workspace_mismatch` codes only.

### 6.3 What Gate does **not** evaluate today

- `WorkspaceLivePolicyState`
- Kill Switch armed state
- `ExecutionMode`
- human-start proof
- `liveCapitalAuthorized` / `paperFreeze`
- credentials / Vault
- LiveCommand authorization

### 6.4 Fail-closed precedent

- Soft-pass forbidden by port contract.
- Expected failures return `INVALID` (do not throw from pure Gate).
- Consumers (e.g. Strategy Deployment) refuse persistence on INVALID.
- Missing `workspaceId` → fail with `workspace_mismatch`.

### 6.5 S04 implication

S04 must **consume** Gate PASS as a necessary admission input and **must not bypass** Gate. Whether S04 extends Gate attributes in-place (D-ARCH-03) or composes an outer admission evaluator that *calls* Gate is a **PO-S04 OPEN DECISION**. Interim fail-closed deny when live attributes are unresolved is allowed by slice planning; soft-pass is forbidden.

---

## 7. Existing Kill Switch Architecture

### 7.1 Two parallel tracks (must not conflate)

| Track | Owner | Scope | Semantics today |
| ----- | ----- | ----- | --------------- |
| **Durable workspace KS (W3-O04)** | `trading-session` | Workspace | Persist `armed` / clear; **no** admission wiring in production |
| **Live engine EmergencyManager (US210)** | `live-trading-engine` | Session | Freeze / cancel / disable / optional close; gated by LiveCommand |

Prisma notes durable KS as distinct from live `trading_frozen`.

### 7.2 Durable substrate (S04 primary consume target)

| Symbol | Behavior |
| ------ | -------- |
| `DurableKillSwitchState.armed` | Boolean armed flag |
| `isKillSwitchArmed(state)` | `state?.armed === true` |
| `KillSwitchPersistenceService` | Load/save; comment: does not wire admission |
| `buildArmedKillSwitchState` / `buildClearedKillSwitchState` | Domain builders |

### 7.3 Recovery admission stub (critical)

```text
InactiveRecoveryEventAdmissionPolicy.isKillSwitchActive() → always false
```

Recovery pure functions already deny on `killSwitchActive === true` with reason `'kill_switch_active'`. Production policy does not yet read durable KS — this is the principal S04 wiring gap for KS.

### 7.4 S04 implication

S04 should wire **durable workspace KS** into live admission such that:

```text
Kill Switch ACTIVE (armed) ⇒ DENY LIVE admission
```

regardless of policy opt-in, Admin enablement, Session desire, or human-start — subject to PO confirmation of absolute precedence (**PO-S04-04**). Do **not** invent a second KS. Relationship to live-engine `EmergencyManager` remains OPEN (likely L02 / later; S04 must not productize C7 live REST).

---

## 8. Existing Session Architecture

### 8.1 Dual models (PO ambiguity)

| Model | Has `ExecutionMode`? | Production role |
| ----- | -------------------- | --------------- |
| Durable `TradingSession` (`domain/trading-session.ts`) | **No** | Paper lifecycle + leases + recovery |
| Aggregate `TradingSession` (`trading-session-aggregate.ts`) | **Yes** (`PAPER` / `LIVE` / `RESEARCH`) | Research / paper runner / smoke |

### 8.2 Current Paper/Live behavior

- Research create rejects non-`PAPER`.
- PaperTradingRunner rejects non-`PAPER`.
- Execution engine rejects non-`paper` intent mode.
- Durable session start consumes deployment enforcement stamp (`deployment_bind` PASS) — does **not** re-run Gate for `session_start` as a fresh live-capital decision.
- Live session product path for real capital is **not** implemented.

### 8.3 Session eligibility inputs available today

- `workspaceId` association
- Status / lease / fencing (durable)
- Deployment enforcement authorization stamp
- Aggregate `ExecutionMode` (non-durable path)

### 8.4 S04 implication (minimum wiring only)

S04 must define the **minimum** Session eligibility for future live admission without redesigning Session. Candidate checks (not approved):

- Session exists and is reachable
- Session.workspaceId matches admission workspace
- Execution mode / intent is explicitly live-requesting **or** admission is evaluated as a separate pre-start check (OPEN)
- Session not in terminal/failed state incompatible with admission
- Cross-workspace Session mismatch ⇒ DENY

Exact eligibility definition = **PO-S04-05** / D-ARCH-04.

---

## 9. Existing Authorization Architecture

### 9.1 Canonical mechanism

```text
JwtAuthGuard → AuthCsrfGuard → RolesGuard → ThrottlerGuard
@RequirePermission(PermissionClass.*)
decideAuthorization() — default deny
```

| Class | Code | Live relevance |
| ----- | ---- | -------------- |
| RoleAdmin | C6 | S03 policy enablement; Admin surfaces |
| LiveCommand | C7 | Live REST mutations; **deny-all** |
| PaperCommand | (Trader/Admin) | Paper path only |

### 9.2 Distinctions (binding)

| Concept | Meaning | S04 role |
| ------- | ------- | -------- |
| Authentication | Signed-in operator | Required for any admission-triggering call |
| Authorization | Role matrix cell for the live-admission action | Required; exact cell **OPEN** |
| Workspace policy | S02/S03 `PAPER` / `LIVE_POLICY_OPTED_IN` | Necessary input only |
| Admission | S04 multi-gate decision | This slice |
| Execution | L02 venue I/O | Out of scope |

### 9.3 Critical note

**Do not automatically conclude RoleAdmin is the live execution actor.** S03 used RoleAdmin for **control-plane policy**, not live start. ADR-020 requires human start + Admin+ADR enablement; live command permission remains C7 deny-all. Exact admission authorization = **PO-S04-01**.

---

## 10. V2 Safety Anchors

| Anchor | Location | Current value | S04 treatment |
| ------ | -------- | ------------- | ------------- |
| `liveCapitalAuthorized` | `V2_READINESS` in `v2-certification-checklist.ts` | **`false`** | Hard prerequisite: `false` ⇒ **DENY** live admission |
| `paperFreeze` | Every row in `v2-compatibility-matrix.ts` | **`true`** | Hard prerequisite: `true` ⇒ **DENY** live admission |

These anchors are **not** superseded by S03 `LIVE_POLICY_OPTED_IN`.

```text
paperFreeze = true            → DENY LIVE
liveCapitalAuthorized = false → DENY LIVE
```

No override path in S04. Do not flip anchors. Do not weaken Paper Freeze rejects on paper paths.

**S04 consume posture:** Treat both as **hard known-valid prerequisites** for any ALLOW. While they remain at current V2 values, the all-prerequisites-valid ALLOW case is **structurally unreachable in production conformance** — which is correct and fail-closed. Test environments may inject controlled doubles **only** if PO approves explicit test harness rules that do not alter production anchors (**PO-S04** related).

---

## 11. S02/S03 Policy Contract

### 11.1 Canonical SoT (CLOSED)

| Element | Implementation |
| ------- | -------------- |
| Prisma | `WorkspaceLivePolicyState` / `workspace_live_policy_states` |
| Enum | `WorkspaceLivePolicy.PAPER` \| `LIVE_POLICY_OPTED_IN` |
| Ports | `WorkspaceLivePolicyPersistenceService` (`persistPolicy`, `loadState`, `resolveEffectivePolicy`, `isOptedIn`) |
| Admin control plane | S03 `POST .../live-policy/enable|disable` + Security Audit |
| Honesty | `livePolicyAuthorizesLiveTrading/Admission/Execution` → always `false` |

### 11.2 Semantic rules S04 must preserve

```text
PAPER                    = safe default; always denies live admission
LIVE_POLICY_OPTED_IN     = administrative opt-in ONLY; necessary ≠ sufficient
Missing / invalid policy = fail closed (never coerce to live)
Audit                    = evidence, NOT authorization
```

### 11.3 S04 must NOT

- create another policy store;
- replace S02 semantics;
- treat audit records as authz;
- flip honesty helpers to `true` without explicit PO act (**recommend keep false**; separate admission decision object instead — **PO-S04**).

---

## 12. Proposed Admission Architecture

### 12.1 Conceptual model (semantic form — not final code)

```text
LIVE ADMISSION ALLOW =
    workspace policy == LIVE_POLICY_OPTED_IN
AND required authorization exists and is known-valid
AND Gate outcome == pass (VALID)
AND Kill Switch is known inactive (not armed)
AND Session is eligible (known-valid)
AND human-start requirements are satisfied (known-valid)
AND paperFreeze permits live (known false)          // currently true → DENY
AND liveCapitalAuthorized permits live (known true) // currently false → DENY
AND all required inputs are known-valid (no unknown/unavailable/contradiction)
OTHERWISE
    DENY  (or ERROR when dependency failure must surface as transport error —
           still must NOT allow live)
```

Exact expression must be derived from PO decisions; this is the ADR-020 / repository-aligned semantic target.

### 12.2 Recommended composition (evidence-aligned; not approved)

Prefer an **outer pure admission evaluator** (precedent: `decideRecoveryEventAdmission`) that:

1. Loads/receives snapshot inputs (policy, KS, Gate decision, Session facts, authz, human-start, V2 anchors).  
2. Fail-closes on any unknown / missing / invalid / unavailable input.  
3. Calls / consumes Gate result rather than bypassing Gate.  
4. Returns a dedicated `LiveAdmissionDecision` (name OPEN) with machine-readable reason.  
5. Does **not** submit orders, touch Vault, or mutate Gate/KS foundations beyond reading state.

Whether Gate itself gains new live attributes (D-ARCH-03) vs outer composition remains **PO-S04-03**.

### 12.3 Ownership sketch

| Concern | Proposed owner |
| ------- | -------------- |
| Admission pure decision | New domain function under trading-session **or** dedicated live-admission module — **OPEN** |
| Policy read | Existing `workspace/live-policy/` |
| Gate call | Existing `RuntimeEnforcementPort` |
| KS read | Existing `KillSwitchPersistenceService` / `isKillSwitchArmed` |
| Session facts | Existing Session ports (which model — OPEN) |
| Authorization | Existing Auth matrix / RolesGuard if HTTP surface exists |
| Execution | **Not touched** (L02) |

### 12.4 Critical distinction

```text
S04 ALLOW  = “future live execution MAY be admitted under current known-valid inputs”
≠ live trading active
≠ credentials available
≠ venue reachable
≠ L02 authorized
```

---

## 13. Admission Decision Model

### 13.1 Existing candidates (reuse first)

| Type | Module | Fit for S04? |
| ---- | ------ | ------------ |
| `EnforcementDecision` | runtime-enforcement | Gate-only; incomplete for multi-gate live admission |
| `RecoveryEventAdmissionResult` | trading-session | Strong pure-function precedent; recovery-scoped reasons |
| `ExecutionEligibility` | trading-session | Lease/status only |
| `DeploymentEnforcementAuthorization` | strategy-deployment | Bind stamp, not live multi-gate |

**Finding:** No unified live admission decision object exists.

### 13.2 Proposed minimal conceptual shape (not implemented)

```text
{
  allowed: boolean,                 // true only if all prerequisites known-valid
  reason: <machine-readable code>,  // single primary reason (deny or allow)
  reasons?: <code[]>,               // optional detail for internal diagnostics
  workspaceId: string,
  sessionId?: string | null,
  actorId?: string | null,
  evaluatedPolicy?: 'PAPER' | 'LIVE_POLICY_OPTED_IN' | 'UNKNOWN',
  gateOutcome?: 'pass' | 'fail' | 'unknown' | 'unavailable',
  killSwitch?: 'inactive' | 'active' | 'unknown' | 'unavailable',
  evaluatedAt: string,              // ISO
  inputVersion / snapshotId?: ...   // if PO requires staleness token — OPEN
}
```

### 13.3 Leakage rule

Public/API consumers should receive **generic denial** or a **safe subset** of reasons. Internal diagnostics may retain richer codes. Must not leak credentials, tenant internals, authorization matrix details, or infrastructure state. Exact exposure = **PO-S04-09**.

---

## 14. Fail-Closed Matrix

Rule: **Unknown / missing / malformed / stale / contradictory / unavailable MUST NOT yield ALLOW LIVE.**

| Input condition | Expected result | Rationale |
| --------------- | --------------- | --------- |
| policy = PAPER | **DENY** | Safe default; S02/S03 + ADR-020 |
| policy = LIVE_POLICY_OPTED_IN + all prerequisites known-valid | **ALLOW** only if *all* other gates pass including V2 anchors; today anchors deny → effective **DENY** in prod | Necessary ≠ sufficient |
| policy missing (no durable row) | **DENY** (effective PAPER via `resolveEffectivePolicy`) | S02 missing → PAPER |
| policy invalid / unparsable | **DENY** / **ERROR** | PO-S02-05 fail-closed; never coerce to live |
| Gate deny (INVALID) | **DENY** | ADR-020 §6 |
| Gate unknown / indeterminate | **DENY** | Fail-closed |
| Gate unavailable / dependency failure | **DENY** / **ERROR** | Must not soft-allow; transport ERROR still no live — **PO-S04-07** |
| Kill Switch active (armed) | **DENY** | ADR-020 §5; recovery precedent |
| Kill Switch unknown | **DENY** | Fail-closed |
| Kill Switch unavailable | **DENY** / **ERROR** | **PO-S04-07** |
| Session invalid / ineligible | **DENY** | Cross-mismatch / bad state |
| Session unavailable | **DENY** / **ERROR** | **PO-S04-07** |
| human-start missing | **DENY** | ADR-020 §1/§3 |
| human-start invalid / stale | **DENY** | Fail-closed |
| authorization missing / denied | **DENY** | Default-deny matrix |
| paperFreeze = true | **DENY** | V2 hard stop |
| liveCapitalAuthorized = false | **DENY** | V2 hard stop |
| conflicting inputs (e.g. Session workspace ≠ request workspace) | **DENY** | Isolation |
| stale snapshot vs current policy/KS (if detected) | **DENY** | Fail-closed; see §21 |

Where DENY vs ERROR is unresolved for dependency failures, mark **PO-S04-07**. In all cases, result **must not** be live ALLOW.

---

## 15. Gate Precedence

### 15.1 Documented repository / ADR precedence (not invented)

| Control | Established behavior |
| ------- | -------------------- |
| Paper Freeze / paper rejects | Structural reject of live under RC-16 / paper paths |
| `liveCapitalAuthorized = false` | Conformance hard stop |
| Gate INVALID | Fail-closed; no soft-pass |
| Durable KS armed | Recovery admission blocks when `killSwitchActive` |
| Workspace policy PAPER | Must deny live admission |
| LiveCommand deny-all | Live REST mutations denied |

### 15.2 Proposed live-admission evaluation order (discussion baseline)

Recommended **short-circuit deny order** (evidence-aligned; not approved):

1. V2 hard stops (`paperFreeze`, `liveCapitalAuthorized`)  
2. Kill Switch armed (emergency stop)  
3. Workspace policy (PAPER / missing / invalid)  
4. Authorization  
5. Session eligibility / workspace match  
6. Human-start  
7. Gate validateDeployment  

Rationale: cheapest / hardest safety anchors first; Gate last among “capability” checks because it is relatively expensive Library I/O. Absolute emergency-stop intent favors KS early (**PO-S04-04**).

**PO-S04-03** must confirm exact Gate precedence relative to policy/authz/Session.

S04 **MUST NOT** invent contradictory precedence that allows Gate PASS to override KS active or Paper Freeze.

---

## 16. Kill Switch Precedence

### 16.1 ADR-020 binding intent

When Kill Switch is active for the relevant scope: new live Order creation / approval / execution is blocked; KS participates in live-capital admission; do not create a second KS.

### 16.2 Planning recommendation

```text
Kill Switch ACTIVE ⇒ DENY LIVE admission
  regardless of:
    workspace policy LIVE_POLICY_OPTED_IN
    Admin enablement history
    permissions (including any future C7 grant)
    Session desire
    human-start presence
    Gate PASS
```

### 16.3 Ambiguities (OPEN)

| Question | Status |
| -------- | ------ |
| Is “relevant scope” workspace durable KS only for S04? | **Recommend YES** for S04 substrate |
| Does live-engine `trading_frozen` also block S04 admission? | **OPEN** — likely later/L02 |
| Replace `InactiveRecoveryEventAdmissionPolicy` as part of S04? | **OPEN** (related wiring; may be in-scope if S04 owns KS consumption) |
| Absolute precedence over Gate PASS? | **Recommend YES** — confirm **PO-S04-04** |

---

## 17. Session Eligibility

### 17.1 Minimum required wiring (planning)

S04 should evaluate only what is needed for fail-closed live admission:

| Check | Intent |
| ----- | ------ |
| Session identity present / loadable | Else DENY/ERROR |
| `session.workspaceId == admission.workspaceId` | Cross-workspace DENY |
| Lifecycle compatible with admission | Invalid/failed/terminal ⇒ DENY |
| Explicit live-request semantics | Do not admit “by accident” from paper Session — **OPEN** how encoded |
| Deployment/Gate linkage if required | Reuse stamp vs fresh `session_start` Gate — **OPEN** |

### 17.2 Explicit non-goals

- Full Session redesign  
- Unifying durable + aggregate models in one rewrite (may need a **bridge decision** only)  
- Live UI session chrome  
- Venue binding fields for L02

**PO-S04-05** owns the exact eligibility definition.

---

## 18. Human-Start Requirements

### 18.1 ADR-020 requirement

Explicit human authorization / human start is required before live session operation. Autonomous activation is insufficient. AI cannot start/approve/size (Master Plan / slice planning).

### 18.2 Repository finding

No dedicated live-admission human-start proof object / verifier was found in application code. Live REST start endpoints exist under C7 deny-all but are not a productized ADR-020 human-start admission control for S04.

### 18.3 Planning constraints

- Do **not** invent a complex new human-start product if a sufficient existing authenticated human action can be bound — but also do **not** silently claim JWT presence alone equals human-start without PO confirmation.  
- Human-start must be explicitly evaluated for live admission.  
- Missing / invalid ⇒ DENY.  
- Replay / expiry semantics are **OPEN** (**PO-S04-06**).  
- Actor-bound vs session-bound representation is **OPEN**.

### 18.4 Recommendation (not Approval)

Treat human-start as a **distinct prerequisite boolean/proof** in the admission snapshot, verified from an authenticated human-initiated start request (not AI/system). Exact persistence and TTL = PO decision. Do not activate C7 merely to satisfy human-start.

---

## 19. Authorization Boundary

```text
Authentication ≠ Authorization ≠ Workspace policy ≠ Admission ≠ Execution
```

| Layer | S04 posture |
| ----- | ----------- |
| Authentication | Required for any admission-triggering API (if exposed) |
| Authorization | Explicitly evaluate required permission/role for *admission action* — cell **OPEN** |
| Workspace membership | Reuse `WorkspaceAccessService` for isolation |
| Policy | Consume S02 SoT only |
| Admission | S04 evaluator |
| Execution | Forbidden in S04 |

**Recommend:** Do not use RoleAdmin as a silent stand-in for live execution authority. Do not unbound LiveCommand without an explicit later governance act. S04 may **check** C7 (and observe deny-all) without **activating** C7 (**PO-S04-02**).

---

## 20. LiveCommand / C7 Analysis

| Fact | Evidence |
| ---- | -------- |
| C7 never granted | `permission-matrix.ts` ADMIN_ALLOWS excludes C7 |
| Live REST requires C7 | `live-trading.controller.ts` |
| S03 preserved deny-all | PO-S03-01; S03 conformance helpers |

### S04 design options (OPEN — do not choose silently)

| Option | Meaning | Risk |
| ------ | ------- | ---- |
| **A. Check C7; remain deny-all** | Admission always DENY on authz until later gate | Safest; matches current matrix |
| **B. Admission uses other permission (e.g. new cell / PaperCommand-like)** | Avoids C7 activation | Needs PO design |
| **C. Enable C7 for selected role(s) in S04** | Unbinds live command surface | High risk; likely **out of S04** |

**Planning recommendation:** **Option A** for end of S04 — C7 remains deny-all; S04 implements fail-closed evaluator and tests; any real ALLOW in production remains blocked by V2 anchors + C7. Enabling C7 belongs to a **later explicit PO governance gate**, not silent S04 scope.

**PO-S04-02** must decide.

---

## 21. Concurrency / Staleness

### 21.1 Race scenarios to analyze

| Scenario | Risk |
| -------- | ---- |
| Admin disables policy (`PAPER`) while Session active | Stale ALLOW |
| KS arms during/after admission | Execution after deny-worthy state |
| Policy changes between evaluation and execution | Same |
| Session state changes between checks | Mismatch |
| Authorization revoked between checks | Privilege race |

### 21.2 S04 vs L02 boundary

```text
S04 = admission decision at evaluation time (possibly snapshotted)
L02 = irreversible execution boundary — MUST revalidate critical inputs
      immediately before venue I/O (unauthorized to implement now)
```

### 21.3 Options for S04 (OPEN — PO-S04-10)

| Strategy | Notes |
| -------- | ----- |
| Atomic single-function evaluation of a snapshot | Minimum for S04 |
| Version / `updatedAt` tokens on policy + KS | Helps detect staleness |
| Persist admission decision | Auditability vs replay risk — **PO-S04-11** |
| Mandatory L02 re-check contract | Document only in S04; implement in L02 |

**Recommend:** S04 delivers atomic snapshot evaluation + documents L02 revalidation contract; does not implement L02 execution boundary.

---

## 22. S03 → S04 Contract

### 22.1 S03 provides

| Element | Use in S04 |
| ------- | ---------- |
| Current `WorkspaceLivePolicyState` | Necessary admission input |
| Admin enable/disable transitions | Control plane only |
| Security Audit `authz.workspace-live-policy-change` | Evidence / investigation — **not** authz |

### 22.2 Binding rules

```text
S04 consumes policy state
S04 must not modify S03 semantics
Audit is evidence, NOT authorization
LIVE_POLICY_OPTED_IN ≠ admission
```

### 22.3 S04 must not

- rewrite enable/disable API;
- create parallel policy store;
- treat successful audit as proof of admission;
- mutate Session/Gate/KS foundations beyond read/wiring needed for admission.

---

## 23. S04 → L02 Contract

### 23.1 What L02 may receive (conceptual)

| Candidate field | Purpose |
| --------------- | ------- |
| Admission decision (`allowed` + reason) | Gate for attempting live path |
| workspaceId / sessionId / actorId | Identity binding |
| evaluated policy | Provenance |
| gateOutcome / killSwitch / authz / human-start results | Diagnostics / revalidation hints |
| evaluatedAt / snapshot version | Staleness |

### 23.2 What L02 must revalidate before irreversible execution

At minimum (planning contract — not L02 implementation):

- policy still `LIVE_POLICY_OPTED_IN`
- KS still inactive
- Gate still PASS (fresh or explicitly accepted freshness policy)
- authorization still valid
- human-start still valid (if TTL)
- V2 anchors still permit (when/if ever flipped by separate governance)
- credentials/venue readiness (L02-owned)

### 23.3 Binding

```text
S04 ALLOW ≠ L02 authorized ≠ venue submit
L02 remains separately gated and unauthorized
```

Exact contract shape = **PO-S04-12**.

---

## 24. Security Analysis

| Threat | S04 control |
| ------ | ----------- |
| Fail-open regression | Explicit unknown→DENY matrix; conformance tests |
| Policy/authz confusion | Preserve honesty helpers; separate admission object |
| Gate bypass | Mandatory Gate consume; no alternate path |
| KS bypass | Armed ⇒ DENY; replace stub carefully under Approval |
| Session mismatch | workspaceId equality checks |
| Human-start bypass | Explicit prerequisite; AI denied |
| Cross-workspace leakage | Membership + workspace keying |
| Privilege escalation | No C7 unbound; no RoleAdmin≠live execution assumption |
| Deny-reason disclosure | Internal vs public reason split |
| Accidental C7 activation | PO-S04-02; AC forbids |
| Accidental Paper Freeze weaken / liveCapitalAuthorized flip | AC + V2 regression tests |
| Credential / Vault activation | Explicit non-scope |
| Capital movement | Explicit non-scope |

**No implementation security approval is claimed by this planning proposal.**

---

## 25. Consumer / Operator Honesty

| Statement | Allowed after S04? |
| --------- | ------------------ |
| Live admission foundation evaluates fail-closed prerequisites | **Yes** (precise, internal) |
| Workspace policy opted-in | **Yes** (policy only) |
| Admission ALLOW in a test harness | **Yes** only with honesty that execution is still unavailable |
| Live trading is active / available | **No** |
| Capital available / orders can execute | **No** |
| Production enabled / credentials ready | **No** |
| Gate PASS alone means live ready | **No** |

```text
Admission ALLOW ≠ execution capability
S04 ≠ live trading on
```

No UI language may claim live trading from S04 alone (L04 still gated).

---

## 26. Test Strategy

Planning-only; do not implement yet.

### A. Policy

- PAPER denies  
- LIVE_POLICY_OPTED_IN necessary but not sufficient  
- missing → effective PAPER deny  
- invalid → fail closed  

### B. Authorization

- authorized actor (per PO cell)  
- unauthorized actor  
- missing actor  
- wrong workspace  

### C. Gate

- allow / deny / unknown / unavailable  

### D. Kill Switch

- inactive / active / unknown / unavailable  

### E. Session

- eligible / invalid / wrong workspace / wrong mode / unavailable  

### F. Human-start

- valid / missing / invalid / stale-expired if applicable  

### G. V2

- `paperFreeze=true` denies  
- `liveCapitalAuthorized=false` denies  

### H. Combined matrix

Every critical deny + representative all-prerequisites-valid case (harness may use test doubles without flipping production anchors — if PO allows).

### I. Fail-closed

Any unknown/missing/error must not produce unsafe live ALLOW.

### J. Regression

V2 certification/compatibility, S01–S03 conformance, Gate fail-closed suites, recovery KS reason tests remain green.

### Security tests (explicit)

Cross-workspace admission · privilege escalation · stale authz · policy race · KS race · Session mismatch · human-start replay · missing prerequisite · dependency failure · malformed state · fail-open regression.

---

## 27. Acceptance Criteria

For a **future** S04 implementation (not authorized by this proposal).

| ID | Criterion |
| -- | --------- |
| **AC-01** | Workspace policy is required as an admission input (S02 SoT consumed). |
| **AC-02** | PAPER always denies live admission. |
| **AC-03** | LIVE_POLICY_OPTED_IN is necessary but not sufficient. |
| **AC-04** | Missing/invalid policy fails closed (never coerces to live). |
| **AC-05** | Authorization is explicitly evaluated. |
| **AC-06** | Cross-workspace admission is rejected. |
| **AC-07** | Gate deny blocks admission. |
| **AC-08** | Unknown/unavailable Gate does not produce allow. |
| **AC-09** | Active Kill Switch blocks admission. |
| **AC-10** | Unknown/unavailable Kill Switch does not produce allow. |
| **AC-11** | Session eligibility is explicitly evaluated. |
| **AC-12** | Wrong/invalid Session blocks admission. |
| **AC-13** | Human-start requirement is explicitly evaluated. |
| **AC-14** | Missing/invalid human-start blocks admission. |
| **AC-15** | `paperFreeze=true` blocks admission. |
| **AC-16** | `liveCapitalAuthorized=false` blocks admission. |
| **AC-17** | All critical prerequisites must be known-valid before allow. |
| **AC-18** | Admission is fail-closed (unknown/error ≠ allow). |
| **AC-19** | No S04 path executes real exchange I/O. |
| **AC-20** | No credentials/Vault are activated. |
| **AC-21** | No L02–L05 functionality is introduced. |
| **AC-22** | S02/S03 policy SoT remains canonical. |
| **AC-23** | Audit is evidence, not authorization. |
| **AC-24** | V2 conformance remains intact (`paperFreeze` / `liveCapitalAuthorized` unchanged). |
| **AC-25** | LiveCommand / C7 remains deny-all unless a separate PO act explicitly changes it. |
| **AC-26** | Honesty helpers `livePolicyAuthorizes*` remain false unless a separate PO act changes them. |
| **AC-27** | No second Gate or second Kill Switch is created. |
| **AC-28** | Admission ALLOW is never marketed as live trading available. |
| **AC-29** | L02 revalidation contract is documented; L02 not implemented. |
| **AC-30** | AI/system autonomous path cannot satisfy human-start / admission. |

---

## 28. PO-S04 Open Decisions

```text
OPEN — PO DECISION REQUIRED
Do not invent a decision in implementation without Approval.
```

| ID | Question | Evidence / recommendation | Status |
| -- | -------- | ------------------------- | ------ |
| **PO-S04-01** | Exact authorization requirement for live admission | RoleAdmin ≠ live execution; C7 deny-all. **Recommend:** explicit cell; do not silently use RoleAdmin as live actor; prefer check-without-activate C7 or deferred grant. | **OPEN** |
| **PO-S04-02** | Whether LiveCommand/C7 remains deny-all after S04 | Matrix + S03. **Recommend:** remains deny-all; enabling C7 is a later governance gate. | **OPEN** |
| **PO-S04-03** | Exact Gate precedence / whether Gate gains live attributes vs outer evaluator | Gate is Library-only today (D-ARCH-03). **Recommend:** outer evaluator calling Gate; short-circuit order per §15. | **OPEN** (D-ARCH-03) |
| **PO-S04-04** | Exact Kill Switch precedence | ADR-020 + recovery `kill_switch_active`. **Recommend:** ACTIVE always DENY regardless of other allows; consume durable workspace KS. | **OPEN** (D-ARCH-05) |
| **PO-S04-05** | Exact Session eligibility definition | Dual Session models. **Recommend:** minimum workspace match + loadable + non-terminal; decide durable vs aggregate bridge. | **OPEN** (D-ARCH-04) |
| **PO-S04-06** | Exact human-start requirement | ADR-020 requires; no code proof found. **Recommend:** explicit authenticated human proof distinct from JWT-only; define TTL/replay. | **OPEN** |
| **PO-S04-07** | Exact handling of dependency unavailable/error | Gate/KS/Session unavailable. **Recommend:** never ALLOW; choose DENY vs ERROR per Nest precedent. | **OPEN** |
| **PO-S04-08** | Exact admission decision object | No unified type; recovery admission is closest precedent. **Recommend:** new minimal pure decision type. | **OPEN** |
| **PO-S04-09** | Exact deny-reason exposure | Gate exposes machine reasons internally. **Recommend:** internal codes + generic public denial. | **OPEN** |
| **PO-S04-10** | Concurrency/staleness strategy | Races between policy/KS and execution. **Recommend:** atomic snapshot in S04 + mandatory L02 re-check contract. | **OPEN** |
| **PO-S04-11** | Whether admission result may be persisted/audited | Security Audit exists; L03 is financial log. **Recommend:** optional classified audit of admission denials/allows without treating as authz; decide persistence. | **OPEN** |
| **PO-S04-12** | Exact S04 → L02 contract | L02 unauthorized. **Recommend:** document required revalidation fields; do not implement L02. | **OPEN** |
| **PO-S04-13** | Slice ID canonicalization | Same as PO-S02-07 / PO-S03-11. | **OPEN / NON-BLOCKING** |
| **PO-S04-14** | Whether honesty helpers may ever return true | Currently always false. **Recommend:** keep false; admission object is separate. | **OPEN** |
| **PO-S04-15** | Whether replacing `InactiveRecoveryEventAdmissionPolicy` is in S04 | Stub returns false. **Recommend:** in-scope if S04 owns KS wiring for admission surfaces that already consult the policy. | **OPEN** |

Where repository precedent is clear, recommendations are stated. Genuine product/architecture choices remain **OPEN**.

---

## 29. Risks

| Risk | Mitigation |
| ---- | ---------- |
| Fail-open regression | AC-17/18; unknown→DENY matrix; dedicated fail-open tests |
| Policy/authz confusion | Honesty helpers; explicit layering language |
| Gate bypass | AC-07/08; no alternate admission path |
| KS bypass | AC-09/10; absolute ACTIVE deny recommendation |
| Session mismatch | AC-06/11/12 |
| Human-start bypass | AC-13/14/30 |
| Stale state / admission→execution race | PO-S04-10; L02 revalidation contract |
| Cross-workspace leakage | Membership + workspace equality tests |
| Excessive deny-reason disclosure | PO-S04-09 |
| Accidental C7 activation | PO-S04-02; AC-25 |
| Accidental Paper Freeze weakening | AC-15/24 |
| Accidental `liveCapitalAuthorized` change | AC-16/24 |
| Dual Session model wrong target | PO-S04-05 |
| Treating S03 audit as admission proof | AC-23 |
| Scope creep into L02 venue I/O | AC-19/20/21 |
| Operator honesty failure (“live on”) | AC-28; §25 |

---

## 30. Recommendation

**Overall S04 Planning Proposal verdict: READY FOR REVIEW**

| Perspective | Verdict | Notes |
| ----------- | ------- | ----- |
| **Developer** | **PASS** (for planning) | Clear consume path for policy/Gate/KS; OPEN items listed; recovery admission precedent |
| **Consumer / Operator** | **PASS** (for planning) | Admission ≠ live available; Paper default preserved |
| **Security** | **PASS** (for planning) | Fail-closed matrix; V2 anchors hard; C7 not activated; no venue/credentials |

**Recommended next gate:** PO / Chief Architect Planning Review of this proposal → resolve PO-S04-01…12 (blocking) → Individual Slice Approval for **PROPOSED-V3-L01-S04** only → then implementation.

```text
READY FOR REVIEW ≠ APPROVED FOR IMPLEMENTATION
```

---

## 31. Governance Gate

```text
This artifact is a planning proposal only.
S04 implementation requires explicit PO / Chief Architect
Planning Review + Slice Approval.
```

Lifecycle:

```text
S03 CLOSED (done)
        ↓
S04 Individual Planning Proposal (this artifact) — PROPOSED
        ↓
S04 Planning Review / PO Slice Approval  ← NEXT
        ↓
S04 implementation (admission wiring only; fail-closed)
        ↓
S04 PO Review / Close
        ↓
V3-L01 Package Completion (separate act)
        ↓
L02 … (out of scope / unauthorized)
```

### Explicit non-authorizations

This proposal does **NOT** authorize:

- S04 implementation  
- Gate / Kill Switch / Session production behavior changes  
- LiveCommand / C7 grants  
- Prisma / migrations  
- API endpoints  
- credentials / Vault / FIV / production release  
- live-capital activation  
- L02–L05  
- silent resolution of §28 OPEN items  
- modification of S01–S03 closed artifacts or ADR-020  
- closing V3-L01 or Wave 6  

```text
PROPOSED ≠ APPROVED FOR IMPLEMENTATION
ADMISSION ALLOW ≠ LIVE TRADING
POLICY ≠ AUTHORIZATION ≠ ADMISSION ≠ EXECUTION
```

---

## STOP

**STOP.** PROPOSED-V3-L01-S04 Planning Proposal produced.  
Status: **PROPOSED — NOT APPROVED FOR IMPLEMENTATION.**  
Do **not** implement. Do **not** modify Gate / Kill Switch / Session. Do **not** activate LiveCommand. Do **not** create migrations or endpoints. Do **not** perform FIV. Do **not** enable live capital. Do **not** start L02. Do **not** close S04 / V3-L01 / Wave 6.  
Await PO / Chief Architect Planning Review.
