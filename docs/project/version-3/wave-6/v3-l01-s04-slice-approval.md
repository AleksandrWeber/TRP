# V3-L01-S04 Slice Approval

**Document:** V3-L01-S04 Product Owner / Chief Architect Individual Slice Approval  
**Date:** 2026-09-17  
**Package:** V3-L01 — Live capital ADR + workspace policy (LT-01)  
**Wave:** 6 — Live Trading  
**Nature:** Official Individual Slice Approval for **PROPOSED-V3-L01-S04** only. **Not** Package Close. **Not** Wave 6 COMPLETE. **Not** live-capital activation. **Not** FIV. **Not** L02–L05 authorization. **Not** an ADR. **Not** a Master Plan / Roadmap revision.  
**Authority:** Product Owner / Chief Architect  
**Preceded by:** PO / Chief Architect Planning Review of [`v3-l01-s04-planning-proposal.md`](./v3-l01-s04-planning-proposal.md) — **PASS WITH REQUIRED PO DECISIONS**  
**Planning proposal:** [`v3-l01-s04-planning-proposal.md`](./v3-l01-s04-planning-proposal.md)  
**Package Slice Planning Approval:** [`v3-l01-slice-approval.md`](./v3-l01-slice-approval.md)  
**Package Planning Approval:** [`v3-l01-package-planning-approval.md`](./v3-l01-package-planning-approval.md)  
**S01 Final Close (prerequisite):** [`v3-l01-s01-final-close.md`](./v3-l01-s01-final-close.md) — **CLOSED**  
**S02 Final Close (prerequisite):** [`v3-l01-s02-final-close.md`](./v3-l01-s02-final-close.md) — **CLOSED**  
**S03 Final Close (prerequisite):** [`v3-l01-s03-final-close.md`](./v3-l01-s03-final-close.md) — **CLOSED**  
**Repository baseline (approval start):** `189f212512a737789bf87ca60f505440687a464a` (`docs(wave-6): close v3-l01-s03`)

```text
PROPOSED-V3-L01-S04
V3-L01-S04 SLICE APPROVAL = GRANTED
V3-L01-S04 IMPLEMENTATION = AUTHORIZED

S04 Planning Review                 = PASS WITH REQUIRED PO DECISIONS
S04 Slice Approval                  = GRANTED (this act)
S04 implementation                  = AUTHORIZED (live admission wiring only; fail-closed)
L02–L05                             = NOT AUTHORIZED
Canonical slice ID                  = PROPOSED-V3-L01-S04 (retained; not renamed)
Live-capital activation             = NOT AUTHORIZED
Production release                  = NOT AUTHORIZED
Real-capital orders                 = NOT AUTHORIZED
Live FIV                            = NOT AUTHORIZED
Credential provisioning             = NOT AUTHORIZED by this Approval
Live UI (L04)                       = NOT AUTHORIZED
LiveCommand / C7                    = DENY-ALL / UNBOUND (preserved)
Wave 5                              = NOT COMPLETE / NOT CLOSED
CM-15                               = OPEN / DEFERRED / NON-BLOCKING
```

Protected dirty/untracked leftovers outside the S04 planning proposal, this Approval, and Decision Register synchronization were **not** modified by this act.

---

## 1. Approval Status

```text
V3-L01-S04 SLICE APPROVAL = GRANTED
V3-L01-S04 IMPLEMENTATION = AUTHORIZED
This authorization applies ONLY to S04.
```

| Field | Decision |
| ----- | -------- |
| **S04 Planning Review** | **PASS WITH REQUIRED PO DECISIONS** |
| **S04 Slice Approval Decision** | **APPROVED / GRANTED** |
| **S04 Implementation Authorization** | **AUTHORIZED** (this act; live admission evaluator / fail-closed wiring only) |
| **Governance** | **APPROVED** |
| **Repository Synchronization (S04 Slice Approval)** | **AUTHORIZED** (this act) |
| **L02–L05** | **NOT AUTHORIZED** |
| **Live-capital activation** | **NOT AUTHORIZED** |
| **Production Ready** | **Not granted** |

```text
V3-L01-S04 SLICE APPROVED FOR IMPLEMENTATION
≠ PACKAGE COMPLETE
≠ LIVE READY
≠ PRODUCTION READY
≠ L02 AUTHORIZED
≠ LiveCommand ACTIVATED
```

```text
Policy ≠ authorization ≠ admission ≠ execution

Admission ALLOW ≠ live trading available
Admission ALLOW ≠ capital movement
Admission ALLOW ≠ credentials ready
Admission ALLOW ≠ production enabled
```

---

## 2. Slice Identity

| Field | Value |
| ----- | ----- |
| **ID** | **PROPOSED-V3-L01-S04** |
| **Title / Name** | Gate · KS · Session Admission Wiring, Fail-Closed |
| **Parent package** | V3-L01 — Live capital ADR + workspace policy (LT-01) |
| **Wave** | 6 — Live Trading |
| **Type** | Fail-closed live admission foundation wiring |
| **Position** | Fourth / final slice in approved order S01 → S02 → S03 → S04 |

**Identifier note:** The ID remains **PROPOSED-V3-L01-S04** as recorded. This Approval does **not** silently rename or canonicalize the identifier. Canonicalization remains **NON-BLOCKING / RETAINED**.

---

## 3. Governance Prerequisites

| Prerequisite | Status |
| ------------ | ------ |
| Wave 6 Planning Approval | **GRANTED** |
| ADR-020 Accepted | **YES** |
| D-GOV-05 | **GRANTED** (wave-level; per-slice gates remain) |
| V3-L01 Package Planning Approval | **GRANTED** — [`v3-l01-package-planning-approval.md`](./v3-l01-package-planning-approval.md) |
| V3-L01 Slice Planning Approval | **GRANTED** — [`v3-l01-slice-approval.md`](./v3-l01-slice-approval.md) |
| V3-L01-S01 Final Close | **CLOSED** — [`v3-l01-s01-final-close.md`](./v3-l01-s01-final-close.md) |
| V3-L01-S02 Final Close | **CLOSED** — [`v3-l01-s02-final-close.md`](./v3-l01-s02-final-close.md) |
| V3-L01-S03 Final Close | **CLOSED** — [`v3-l01-s03-final-close.md`](./v3-l01-s03-final-close.md) |
| S04 Planning Proposal | [`v3-l01-s04-planning-proposal.md`](./v3-l01-s04-planning-proposal.md) — **PREPARED** |
| S04 Planning Review | **PASS WITH REQUIRED PO DECISIONS** (PO / Chief Architect) |

**Review findings accepted by this Approval:**

| Check | Result |
| ----- | ------ |
| Planning proposal complete | **YES** |
| Developer | **PASS** (for planning) |
| Consumer / Operator | **PASS** (for planning) |
| Security | **PASS** (for planning) |
| Scope leakage | **NONE** (exclusions preserved) |
| Acceptance criteria | **testable** |
| S03 → S04 contract | **PASS** |
| Blocking OPEN decisions for S04 | **RESOLVED by PO-S04-01…15** (this act); PO-S04-06 resolved as **APPROVED IN PRINCIPLE / IMPLEMENTATION CONTRACT REQUIRED** |

---

## 4. Explicit PO Decisions (binding)

### PO-S04-01 — Live admission authorization

**APPROVED.**

S04 must evaluate the canonical authorization mechanism (existing PermissionClass + role matrix + RolesGuard patterns).

Do **NOT** equate RoleAdmin / C6 with live execution authorization.  
LiveCommand / C7 remains deny-all unless a separate explicit governance decision authorizes it.

### PO-S04-02 — LiveCommand / C7

**APPROVED.**

LiveCommand / C7 remains **DENY-ALL / UNBOUND** after S04.

S04 may evaluate C7 as a prerequisite if the repository architecture requires it.  
S04 **MUST NOT** activate C7.

### PO-S04-03 — Gate precedence

**APPROVED.**

Use the following conceptual precedence:

```text
V2 hard safety stops
  → Kill Switch
  → Workspace Live Policy
  → Authorization
  → Session eligibility
  → Human Start
  → Gate
```

A hard deny at any prerequisite results in **DENY**.  
The exact evaluation order may be optimized in implementation provided the resulting security semantics are identical and no fail-open path exists.

### PO-S04-04 — Kill Switch

**APPROVED.**

Kill Switch ACTIVE → **DENY LIVE**, regardless of all other positive inputs.  
Kill Switch UNKNOWN / UNAVAILABLE → **MUST NOT ALLOW** (DENY or controlled ERROR per repository conventions).  
Do **NOT** create a second Kill Switch.

### PO-S04-05 — Session

**APPROVED.**

S04 defines only the **minimum** Session eligibility contract required for live admission. No Session redesign.

At minimum evaluate existing repository semantics for:

- workspace association;
- lifecycle;
- execution mode;
- actor/context.

Invalid or incompatible Session → **DENY**.

### PO-S04-06 — Human start

**APPROVED IN PRINCIPLE / IMPLEMENTATION CONTRACT REQUIRED.**

#### Repository evidence summary

Re-inspection found **no** dedicated live-admission human-start proof object / verifier (`humanStart`, `startProof`, `startToken`, etc. absent in application code).

Closest surfaces and why they are insufficient without semantic invention:

| Candidate | Why insufficient for ADR-020 human-start |
| --------- | ---------------------------------------- |
| Paper / trading-session JWT start (`PaperCommand`) | Authenticated paper start ≠ live human-start |
| Live REST start (`LiveCommand` / C7) | Deny-all; not productized ADR-020 human-start |
| Deployment Gate stamp / `session_start` purpose | Gate PASS evidence — separate ADR-020 item |
| Orchestrator `confirmRun` | Explicit-confirm pattern; wrong domain |
| S03 live-policy Admin enable | Enablement ≠ session human-start |
| Password-reset single-use token | Anti-replay analog only; not live-start |
| Session lease / fencing | Concurrency, not human authorization |
| Auth `mfaSatisfied` | Field exists; MFA OPEN; not wired as live-start |

#### ADR-020 interpretation (binding)

ADR-020 requires explicit human authorization / human start before live session operation; autonomous activation is not sufficient; Admin+ADR enablement is distinct from human start; MFA/UX remain OPEN.

#### Binding implementation contract (S04 must enforce)

S04 **MUST** implement (or consume, if a later PO act supplies a durable proof) an admission input that satisfies **all** of the following — without inventing cryptographic algorithms in this Approval:

1. **Distinct prerequisite** in the live admission snapshot: human-start status must be known-valid before ALLOW.  
2. **Explicit human initiation** — AI / autonomous / system-only paths **MUST NOT** satisfy human-start.  
3. **Actor binding** — attributable authenticated human actor identity required.  
4. **Workspace binding** — human-start must apply to the admission workspace.  
5. **Session binding** — human-start must apply to the admission session (or equivalent session-scoped start context once Session eligibility is established).  
6. **Freshness / TTL** — if a durable proof is used, invalid/expired proof **MUST DENY**; exact TTL value may follow repository conventions once chosen in implementation under this contract (do not invent opaque crypto).  
7. **Replay protection** — reused / replayed / already-consumed proof **MUST DENY** when a single-use or freshness model is used; do not invent a new nonce algorithm beyond existing repository patterns if reused.  
8. **Invalid / missing / stale / unknown** → **DENY** (fail-closed).  
9. **Separation preserved:** Admin+ADR workspace enablement ≠ human-start; Gate PASS ≠ human-start; Kill Switch ≠ human-start; JWT presence alone **MUST NOT** silently equal human-start under this Approval.  
10. **Do not activate C7** to manufacture human-start satisfaction.

Exact durable representation (boolean input vs stored proof record) may be chosen in implementation **only** if it satisfies this contract and does not weaken fail-closed semantics. MFA remains separately OPEN for production activation (not required to begin S04 under this contract).

```text
PO-S04-06 = APPROVED IN PRINCIPLE / IMPLEMENTATION CONTRACT REQUIRED
≠ mechanism invented in this Approval
≠ JWT alone equals human-start
≠ C7 activation
≠ MFA invented
```

### PO-S04-07 — Dependency failure

**APPROVED.**

Unknown, unavailable, malformed, or stale admission dependencies **MUST NOT** produce ALLOW.  
Use DENY or controlled ERROR according to repository conventions.

### PO-S04-08 — Admission decision

**APPROVED.**

S04 must define an explicit internal admission decision contract distinguishing **ALLOW**, **DENY**, and controlled evaluation error where required.  
Do not expose security-sensitive internal details unnecessarily.

### PO-S04-09 — Deny reasons

**APPROVED.**

Separate internal diagnostic reason from externally exposed response.  
Do not expose sensitive security/configuration information through public responses.

### PO-S04-10 — Concurrency / staleness

**APPROVED.**

S04 admission must evaluate a coherent state/snapshot according to repository capabilities.  
Admission is **not** permanent authorization.  
Future L02 must revalidate safety-critical state immediately before irreversible venue I/O.  
S04 must document this boundary but **MUST NOT** implement L02.

### PO-S04-11 — Admission persistence

**APPROVED.**

Do **NOT** persist every runtime admission evaluation as Security Audit.  
S03 Security Audit remains the audit trail for administrative policy changes.  
S04 admission is a runtime decision.

### PO-S04-12 — S04 → L02 contract

**APPROVED.**

S04 must define a future L02-facing contract containing, as appropriate:

- workspace identity;
- session identity;
- actor identity;
- admission result;
- evaluated policy;
- authorization result;
- Gate result;
- Kill Switch result;
- evaluation timestamp/version.

L02 must revalidate safety-critical conditions before irreversible execution.  
L02 remains **NOT AUTHORIZED** by this Approval.

### PO-S04-13 — Honesty helpers

**APPROVED.**

S04 must not modify existing honesty helpers to imply live execution capability.  
Admission ALLOW does **NOT** mean `liveCapitalAuthorized = true` or that production/live trading is active.

### PO-S04-14 — Gate / KS duplication

**APPROVED.**

No second Gate.  
No second Kill Switch.  
Reuse canonical mechanisms or introduce only minimal adapters where repository evidence requires them.

### PO-S04-15 — Kill Switch recovery stub

**APPROVED.**

Do not replace the recovery-only `InactiveRecoveryEventAdmissionPolicy` with a fake live Kill Switch.  
Use the canonical live-relevant Kill Switch state (durable workspace Kill Switch substrate).  
If an adapter is required, keep it minimal and document it.

---

## 5. Approved S04 Scope

S04 is approved **ONLY** for:

**Gate · KS · Session Admission Wiring, Fail-Closed** — a fail-closed live admission evaluator that consumes S02/S03 `WorkspaceLivePolicyState`, evaluates authorization without activating LiveCommand, integrates Runtime Enforcement Gate without bypass, integrates durable Kill Switch without creating a second KS, applies minimum Session eligibility, enforces the approved human-start contract (PO-S04-06), preserves V2 hard safety anchors (`paperFreeze`, `liveCapitalAuthorized`), defines an admission decision object with safe deny-reason exposure, documents the S04 → L02 revalidation boundary, and ships tests/adapters necessary for that admission wiring — **without** venue I/O, credentials, C7 activation, L02–L05, FIV, or live-capital activation.

```text
S04 owns admission wiring only.
S04 does NOT own real exchange I/O.
```

---

## 6. Explicit Non-Scope

S04 does **NOT** include / this Approval does **NOT** authorize:

| Exclusion | Belongs to |
| --------- | ---------- |
| `PermissionClass.LiveCommand` / C7 activation / unbound for roles | **Forbidden** / later governance act |
| Live order submit / cancel / capital movement / exchange communication | **L02** / activation gates |
| Live adapter venue binding / production credentials / Vault provisioning | **L02** / Ops |
| Tamper-evident financial action log | **L03** |
| Operator UI / live chrome / unhiding `/trading/live` | **L04** (Rule 1) |
| Replay-protection mechanism for live place/cancel APIs | **L05** |
| FIV / production activation / live-capital activation | Separate gates |
| V3-L01 package close / Wave 6 close | Separate PO acts |
| Second Gate / second Kill Switch / parallel execution engine | **Forbidden** |
| Treating Security Audit as authorization | **Forbidden** |
| Flipping V2 `liveCapitalAuthorized` / weakening `paperFreeze` | **Forbidden** |
| Reinterpreting `LIVE_POLICY_OPTED_IN` as execution | **Forbidden** |
| Inventing MFA as S04 scope | Deferred / production activation |
| Replacing `InactiveRecoveryEventAdmissionPolicy` with a fake live KS | **Forbidden** (PO-S04-15) |
| Implementing L02 revalidation execution boundary | **L02** (document only in S04) |

---

## 7. Security Boundaries

Preserved by this Approval:

| Boundary | Status |
| -------- | ------ |
| Paper Freeze (`paperFreeze = true`) | **PRESERVED** — hard DENY for live admission |
| `liveCapitalAuthorized = false` | **PRESERVED** — hard DENY for live admission |
| LiveCommand / C7 deny-all | **PRESERVED** |
| No Runtime Enforcement Gate bypass | **BINDING** |
| No second Gate / second Kill Switch | **BINDING** |
| Kill Switch ACTIVE absolute DENY | **BINDING** |
| Fail-closed on unknown / unavailable / malformed / stale | **BINDING** |
| Human-start distinct from enablement / Gate / JWT-alone | **BINDING** (PO-S04-06 contract) |
| No credentials / Vault activation | **BINDING** |
| No real capital / exchange I/O | **BINDING** |
| Honesty helpers remain truthful | **BINDING** |
| Admission ALLOW ≠ execution capability | **BINDING** |
| S02/S03 policy SoT canonical | **BINDING** |
| Audit evidence ≠ authorization | **BINDING** |

---

## 8. S03 → S04 Contract

S04 **consumes** the S03/S02 canonical policy SoT:

- `WorkspaceLivePolicyState` / `workspace_live_policy_states`
- domain enum `PAPER` / `LIVE_POLICY_OPTED_IN`
- domain/persistence ports including effective-policy resolution

S04 **MUST NOT**:

- create another policy store;
- replace S02/S03 semantics;
- treat Security Audit records as authorization;
- reinterpret `LIVE_POLICY_OPTED_IN` as admission or execution.

```text
LIVE_POLICY_OPTED_IN = necessary but not sufficient for live admission
```

---

## 9. S04 → L02 Contract

S04 must document (not implement) an L02-facing contract including, as appropriate: workspace / session / actor identities; admission result; evaluated policy; authorization / Gate / Kill Switch results; evaluation timestamp/version.

```text
S04 ALLOW ≠ L02 authorized ≠ venue submit
L02 must revalidate safety-critical conditions before irreversible execution
L02 remains NOT AUTHORIZED
```

---

## 10. Acceptance Criteria

Future S04 implementation is bounded by:

| ID | Criterion |
| -- | --------- |
| **AC-01** | Workspace policy is required as an admission input. |
| **AC-02** | PAPER always denies live admission. |
| **AC-03** | LIVE_POLICY_OPTED_IN is necessary but insufficient. |
| **AC-04** | Missing/invalid policy fails closed. |
| **AC-05** | Authorization is explicitly evaluated. |
| **AC-06** | Cross-workspace admission is rejected. |
| **AC-07** | Gate deny blocks admission. |
| **AC-08** | Unknown/unavailable Gate cannot produce ALLOW. |
| **AC-09** | Kill Switch active blocks admission. |
| **AC-10** | Unknown/unavailable Kill Switch cannot produce ALLOW. |
| **AC-11** | Session eligibility is evaluated. |
| **AC-12** | Invalid/mismatched Session blocks admission. |
| **AC-13** | Human-start is explicitly verified according to the approved PO-S04-06 contract. |
| **AC-14** | Missing/invalid/stale/replayed human-start blocks admission. |
| **AC-15** | `paperFreeze=true` blocks admission. |
| **AC-16** | `liveCapitalAuthorized=false` blocks admission. |
| **AC-17** | All required prerequisites must be known-valid before ALLOW. |
| **AC-18** | Admission is fail-closed. |
| **AC-19** | No exchange I/O. |
| **AC-20** | No credentials/Vault activation. |
| **AC-21** | No L02–L05 functionality. |
| **AC-22** | S02/S03 policy SoT remains canonical. |
| **AC-23** | Audit remains evidence, not authorization. |
| **AC-24** | V2 conformance remains intact. |
| **AC-25** | LiveCommand/C7 remains deny-all. |
| **AC-26** | No second Gate. |
| **AC-27** | No second Kill Switch. |
| **AC-28** | Existing honesty helpers remain truthful. |
| **AC-29** | Admission decision does not claim execution capability. |
| **AC-30** | S04 → L02 revalidation boundary is documented. |
| **AC-31** | AI/system autonomous paths cannot satisfy human-start. |
| **AC-32** | JWT presence alone does not satisfy human-start under PO-S04-06. |
| **AC-33** | Canonical durable Kill Switch state is consumed; recovery stub is not faked as live KS. |

---

## 11. Implementation Gate

```text
S04 implementation is now authorized.
This authorization applies only to S04.
Implementation may begin ONLY after this Approval is synchronized to origin/main.
```

| Boundary | Status |
| -------- | ------ |
| S04 live admission wiring implementation | **AUTHORIZED** |
| L02–L05 | **NOT AUTHORIZED** by this act |
| LiveCommand / C7 activation | **NOT AUTHORIZED** |
| Live-capital activation / FIV / credentials | **NOT AUTHORIZED** |

Implementation must preserve:

- fail-closed admission semantics (PO-S04-03…07)
- human-start contract (PO-S04-06)
- C7 deny-all (PO-S04-02)
- durable KS absolute ACTIVE deny (PO-S04-04)
- no second Gate/KS (PO-S04-14)
- V2 anchors unchanged
- honesty: admission ≠ live trading available
- L02 boundary documented only (PO-S04-10 / PO-S04-12)

---

## 12. Explicit Non-Authorizations

This Approval does **NOT** authorize:

1. L02 / L03 / L04 / L05  
2. Live UI  
3. Live-capital activation  
4. Production release  
5. Real-capital orders  
6. Credential provisioning / Vault mutation  
7. FIV  
8. `PermissionClass.LiveCommand` activation  
9. Silent rename of **PROPOSED-V3-L01-S04**  
10. Treating JWT alone as human-start  
11. Inventing MFA as S04 delivery  
12. Implementing L02 venue I/O under S04  
13. Reversal of PO-S04-01…15 without a new PO act  

```text
The only newly granted governance state is:
V3-L01-S04 SLICE APPROVAL = GRANTED
V3-L01-S04 IMPLEMENTATION = AUTHORIZED
(applies ONLY to S04)
```

---

## Binding authorization

Product Owner / Chief Architect **Approves** the V3-L01-S04 Individual Slice Planning Proposal (as reviewed) with **PO-S04-01…PO-S04-15** as binding design decisions (PO-S04-06 as **APPROVED IN PRINCIPLE / IMPLEMENTATION CONTRACT REQUIRED**), **authorizes** S04 implementation subject to the frozen planning documents and the rules in this Approval, and authorizes repository synchronization of this Approval record (with the S04 planning proposal and Decision Register current-state sync).

### What is authorized

1. **V3-L01-S04 Slice Approval = GRANTED.**  
2. **V3-L01-S04 Implementation = AUTHORIZED** — fail-closed live admission evaluator and wiring only, under PO-S04-01…15.  
3. Progression to S04 implementation execution under acceptance criteria in §10, **after** this governance synchronization completes.

### What remains NOT authorized

4. L02–L05.  
5. Live-capital activation, real orders, production release, FIV, credentials, live UI.  
6. LiveCommand / C7 activation.  
7. Silent rename of **PROPOSED-V3-L01-S04**.  
8. Reversal of PO-S04-01…15 without a new PO act.

---

## Final approval statement

```text
V3-L01-S04 SLICE APPROVAL = GRANTED
V3-L01-S04 IMPLEMENTATION = AUTHORIZED
This authorization applies ONLY to S04.
```

---

## STOP

**STOP.** V3-L01-S04 = **SLICE APPROVED / IMPLEMENTATION AUTHORIZED**.  
Next step = **S04 implementation** (admission wiring only; fail-closed) in a **separate** task after this Approval is synchronized to `origin/main`.  
Do **not** implement L02. Do **not** activate LiveCommand. Do **not** enable live capital. Do **not** provision credentials. Do **not** perform FIV. Do **not** close S04 / V3-L01 / Wave 6 in this act.
