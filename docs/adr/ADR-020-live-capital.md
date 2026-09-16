# ADR-020 — Wave 6 Live-Capital

Status: DRAFT

Date: 2026-09-16

Scope: Wave 6 — Live Trading (governance / architecture draft only)

Identity: **Wave 6 Live-Capital ADR** (Master Plan / Execution Roadmap named future ADR)

---

## Governance header (binding for this draft)

```text
Status                              = DRAFT
D-GOV-04 §1a Create Authorization   = GRANTED
  (commit 52e1b3aa2617d43d4b06c93fac5ff9a05bd5f2a4)
Architecture Review                 = NOT STARTED
Security Review                     = NOT STARTED
PO / Governance Review              = NOT STARTED
Final PO / Governance Approval      = NOT GRANTED
D-GOV-01 satisfaction               = NOT ACHIEVED
  (approved Live-Capital ADR required before V3-L01 implementation)
D-GOV-05 / Implementation           = NOT AUTHORIZED
Live trading / real capital         = NOT AUTHORIZED
Live UI implementation              = NOT AUTHORIZED
FIV PASS                            = NOT CLAIMED
Wave 5                              = NOT COMPLETE / NOT CLOSED
CM-15                               = OPEN / DEFERRED / NON-BLOCKING
```

**Planning Approved ≠ Live-Capital Approved.**  
**Create Authorization ≠ ADR Approved.**  
**This DRAFT ≠ Implementation Authorization.**

Provenance:

- Planning Approval baseline: `79e1ac23843f05e9b8236474cabbe4d5ac3af9f8`
- Create-authorization act: `52e1b3aa2617d43d4b06c93fac5ff9a05bd5f2a4`
- Decision Register: [`../project/version-3/wave-6/wave-6-po-decision-register.md`](../project/version-3/wave-6/wave-6-po-decision-register.md)
- Planning Package: [`../project/version-3/wave-6/wave-6-planning-package.md`](../project/version-3/wave-6/wave-6-planning-package.md)
- Paper Freeze: ADR-012 … ADR-018
- Master Plan · Execution Roadmap · Wave 6 Planning Approval / Review

---

## Context

### Paper Freeze state

RC-16 / Paper Freeze (ADR-012…018, Status: Accepted) establishes:

- a single canonical paper-execution path;
- mandatory Risk approval and durable Kill Switch (ADR-016);
- structural rejection of `live` mode under RC-16 (ADR-012 / ADR-016);
- invariant that RC-16 **MUST NOT** submit real-capital orders (ADR-018 #10).

Paper remains the **default**. Real-capital support is outside RC-16.

### Why a new Live-Capital ADR is required

Authoritative sources require a **future / approved live-capital ADR** before Wave 6 live enablement:

- ADR-012: future live adapter requires a **new ADR**, separate credentials, additional safety review, and an explicit release.
- ADR-016: a **new ADR** is required before live capital (and related expansions).
- Master Plan §16.8: “Live capital still requires a **future ADR**. This plan does not write that ADR.”
- Execution Roadmap: Wave 6 starts only after Waves 1–4 exit **and** an **approved** live-capital ADR.
- D-GOV-01 Interpretation A: an **approved** live-capital ADR must exist **before** V3-L01 **implementation** may begin.

This document is that named Wave 6 Live-Capital ADR artifact, currently in **DRAFT** only.

### Wave 6 scope

Wave 6 packages (Execution Roadmap): **V3-L01 … V3-L05** — live capital workspace policy, live order I/O, tamper-evident financial action log, honest live operator UI, replay protection on live place/cancel.

This ADR defines the architectural / governance boundary required before those packages may be implemented. It does **not** implement them.

### Relationship to V3-L01

- Roadmap package name: “Live capital ADR + workspace policy”.
- D-GOV-01 Interpretation B (L01 creates/owns the ADR as substitute for prior approval) was **NOT SELECTED**.
- **Approved** ADR must exist **before** V3-L01 **implementation**.
- Therefore: **V3-L01 implementation = NOT AUTHORIZED** until this ADR completes Architecture Review, Security Review, and PO / Governance approval and is published as approved per D-GOV-04 §5.

### Relationship to existing execution architecture

Canonical path remains authoritative (ADR-012 / Planning Package):

```text
Strategy Runtime → Signal Intent → Order Service → Risk Engine
  → approved Risk Decision → Order Aggregate → Execution Engine
  → Execution Adapter → Fill / Rejection → Accounting pipeline
```

Live capital, if later approved and implemented, **extends** this path with a live adapter binding for opted-in workspaces. It does **not** introduce a second trading engine or parallel Bot path.

### Relationship to existing safety controls

Live-capital admission, when later authorized, must **consume** existing foundations:

- Kill Switch (Wave 3 / ADR-016) — do not create a second Kill Switch;
- Runtime Enforcement Gate (Roadmap dependency) — do not bypass;
- Vault / Connections credential ownership — do not expose secrets;
- Risk mandatory approval (ADR-016 / ADR-018).

Exact live admission attribute sets and live wiring proofs remain **OPEN** where not yet specified.

---

## Existing governance constraints

| Decision         | Status                         | Binding effect on this ADR                                                                           |
| ---------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **D-GOV-01**     | **DECIDED — Interpretation A** | Approved Live-Capital ADR must exist before V3-L01 implementation                                    |
| **D-GOV-02**     | **DECIDED — Interpretation C** | Wave 5 CLOSED is not a blanket Wave 6 planning prerequisite; Rule 1 constrains irreversible promises |
| **D-GOV-03**     | **DECIDED — Interpretation C** | Wave 5 COMPLETE/CLOSED withheld; CM-15 OPEN / DEFERRED / NON-BLOCKING                                |
| **D-GOV-04**     | **DECIDED**                    | Create → draft → Architecture Review → Security Review → PO Review → PO Approval                     |
| **D-GOV-04 §1a** | **GRANTED**                    | Authorizes **creation of this DRAFT only**                                                           |
| **D-GOV-05**     | **NOT GRANTED**                | Implementation remains **NOT AUTHORIZED**                                                            |

**D-GOV-04 §1a authorizes creation of this ADR draft only.**  
It does **not** approve this ADR.  
It does **not** authorize implementation, live trading, live UI, real-capital movement, or FIV.

---

## Paper Freeze compatibility

This DRAFT does **not** repeal Paper Freeze for the platform as a whole.

| Constraint                                        | Source                      | Preserved?                                                                                    |
| ------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| No real-capital orders under RC-16                | ADR-018 #10                 | **Yes** until opted-in live path is separately approved **and** implemented under later gates |
| Structural reject of `live` under RC-16 config    | ADR-012 / ADR-016           | **Yes** as default; future live binding is a **supersession for opted-in workspaces only**    |
| Single Execution Engine entry to adapters         | ADR-012 / ADR-018 #4        | **Yes**                                                                                       |
| Mandatory Risk approval                           | ADR-016 / ADR-018 #8 / #41  | **Yes**                                                                                       |
| Durable Kill Switch                               | ADR-016 / ADR-018 #44–47    | **Yes** — extend participation; do not replace                                                |
| Module ownership / no cross-bypass                | ADR-017 / ADR-018 #60       | **Yes**                                                                                       |
| Credentials stay in adapters / no secret exposure | ADR-017 / ADR-018 #57 / #59 | **Yes**                                                                                       |

**Transition boundary (conceptual — not yet enacted):**

```text
Paper / simulation (DEFAULT)
        ↓
Approved Live-Capital ADR + required reviews (this artifact’s future approval)
        ↓
Per-workspace live opt-in under Admin + ADR policy (L01 intent)
        ↓
Certified strategy + Gate PASS + human start + inactive Kill Switch
  + Runtime Enforcement Gate admission + valid live credentials
        ↓
Live-capital execution on the canonical path (L02 intent)
```

Paper remains default. Opt-in is per workspace. Transition has **not** occurred. Live capital remains **NOT AUTHORIZED**.

---

## Decision (DRAFT — pending acceptance)

The following architectural / governance decisions are **proposed** for review. They are **not** Accepted. Final architectural acceptance is pending Architecture Review, Security Review, and PO / Governance approval.

### 1. Live-capital activation boundary

**Proposed:**

1. Paper / simulation remains the default operating mode.
2. Live-capital operation is permitted only for workspaces that have completed an explicit, audited live opt-in under Admin + ADR policy (Master Plan §11; Planning Package L01).
3. Live session admission requires, at minimum: certified library membership, Gate PASS, human start, inactive Kill Switch, Runtime Enforcement Gate admission, and valid live credentials — as established by Master Plan / Roadmap / Planning Package.
4. Ambiguous, incomplete, unauthorized, or invalid live-capital state **fails closed** (no new live exposure).

**Not claimed:** live mode enabled; Gate live admission attributes fully specified; numeric risk thresholds defined by this draft.

### 2. Workspace policy

**Proposed:**

1. **Paper workspace** and **live-capital workspace** (or live-opted workspace mode) are distinct authorization environments.
2. Accidental cross-environment operation must be prevented by architecture and policy (structural separation, not UI-only hiding — ADR-012 precedent).
3. Explicit live-mode identification is required for operator surfaces and execution bindings (Planning Package L01 / L04 honesty rules).
4. Live capital supersedes Paper Freeze **only for opted-in workspaces**; all others remain paper-bound.

**OPEN:** exact workspace identity / mode representation; persistence and migration mechanics; concrete cross-environment prevention mechanism details.

### 3. Human authorization

**Proposed:**

1. Autonomous activation of real-capital operation is **not** sufficient.
2. Explicit human authorization / human start is required before live session operation (Master Plan Live Must Be Earned; Roadmap exit).
3. Enablement authority is **Admin + ADR**, not trader self-serve without audit (Master Plan §11).

**OPEN:** MFA requirements; exact UX flows; role matrix beyond Admin + audited enablement.

### 4. Canonical execution path (no architectural drift)

**Proposed / binding preservation:**

1. Preserve ADR-012 canonical Order / Risk / Execution path.
2. **Prohibit:** a second trading engine; a parallel Bot execution path; an undocumented execution bypass; a second risk/control path that replaces mandatory Risk.
3. Live adapter, when later authorized, binds through the existing Execution Engine port — factory / adapter extension, not a parallel engine (Wave 4 / ADR-012 pattern).

### 5. Kill Switch

**Proposed:**

1. Existing Kill Switch foundation participates in live-capital execution admission and emergency shutdown.
2. When Kill Switch is active for the relevant scope: new live Order creation / approval / execution is blocked (ADR-016 behavior preserved and extended to live binding).
3. Roadmap exit intent: Kill Switch stops live evaluation and rejects new live orders.
4. **Do not** create a second Kill Switch mechanism.

**OPEN:** exact live admission / incident runbook wiring; live-scoped KS proofs; any live-specific automatic trigger additions beyond ADR-016.

### 6. Runtime Enforcement Gate

**Proposed:**

1. Runtime Enforcement Gate is a mandatory dependency of live-capital admission (Execution Roadmap Wave 6 Dependencies; Planning Package L01).
2. Live-capital execution **MUST NOT** bypass the Gate.
3. Gate deny ⇒ fail-closed (no new live exposure).

**OPEN:** live admission attribute set (Planning Package / D-ARCH-03 — NOT SPECIFIED).

### 7. Live credentials and Vault

**Proposed:**

1. Live trading credentials are controlled secrets, owned per existing Vault / Connections architecture.
2. Paper and live credentials must be separable; live credentials must not be required for paper operation (ADR-016 paper-only safety preserved as default).
3. External provider payloads / credentials remain inside adapters (ADR-018 #57).
4. Audit and logs **MUST NOT** expose secrets (ADR-018 #59).

**Prohibited by this draft:** provisioning real credentials; inserting secrets into the repository; modifying Vault contents as part of this ADR act.

**OPEN:** live trading secret-type policy details; credential compromise runbook; authorized test-venue key procedures.

### 8. Risk controls

**Proposed categories required before live-capital implementation** (grounded in ADR-016 / Planning Package; thresholds not invented here):

1. Mandatory Risk Decision on every executable Order.
2. Kill Switch interaction as above.
3. Fail-closed on stale / unavailable market data, unavailable Risk, accounting mismatch (ADR-016 fail-safe principles).
4. Venue / RK-03 policy controls as applicable to L02.

**OPEN:** RK-03 policy contents; numeric loss/drawdown thresholds for live; leverage / shorting / multi-currency allocation (ADR-016 explicitly requires ADR coverage before those expansions — treat as out of scope unless separately decided).

### 9. Live execution admission (conceptual)

**Proposed distinctions:**

| State                  | Meaning                                                                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| Paper execution        | Default RC-16 / paper adapter path                                             |
| Live-capital execution | Opted-in workspace + all admission conditions satisfied + live adapter binding |
| Unauthorized           | Live requested or implied without required gates / ADR approval / D-GOV-05     |
| Fail-closed            | Ambiguous / invalid / denied — no new live exposure                            |

**OPEN:** exact admission state machine / attributes; order live-mode fields.

### 10. Financial action auditability (L03 alignment)

**Proposed:**

1. Live place / cancel / kill (and related financial actions in scope) must be attributable and ordered in a tamper-evident financial action log (V3-L03 / SEC-10 / SEC-16 intent).
2. Append-only and integrity-protected properties are AUTHORITATIVE requirements of the planning package.
3. This ADR does **not** implement L03 and does **not** claim tamper-evident live logging is delivered.

**OPEN:** exact schema; cryptographic integrity mechanism (“hash chain or equivalent” — do not choose here); retention.

### 11. Replay protection (L05 alignment)

**Proposed:**

1. Replay protection is a prerequisite for live financial place/cancel APIs (Master Plan; V3-L05).
2. Duplicate Orders / Fills remain forbidden (ADR-018 #9).
3. This ADR does **not** implement replay protection and does **not** claim SEC-16 / replay controls are complete.

**OPEN:** exact replay-protection mechanism (Architect decision required).

### 12. Live operator UI (L04 alignment)

**Proposed requirements for a future honest live operator UI:**

1. Explicit live state; clear paper / live distinction.
2. No false connected / verified / live-ready claims.
3. UI may say Live only when venue-reachable under policy; otherwise must not claim Live (Planning Package L04).
4. Live UI is an irreversible product promise (Rule 1 / D-GOV-02) — must not ship prematurely.

**This ADR does NOT authorize L04 implementation.**

**OPEN:** live-state enum / UX state machine; exact copy.

### 13. Failure-safe / fail-closed behavior

**Proposed:**

On uncertainty, authorization failure, missing / expired credentials, missing approved ADR binding, venue unavailability, timeout with uncertain outcome, replay suspicion, Kill Switch active, or Gate deny: the system **fails closed** — stop creating new live exposure (ADR-016 fail-safe; Master Plan continuity).

**OPEN:** precise live recovery / reconcile behaviors beyond fail-closed principles.

### 14. Security boundary (review scope — not PASS)

When Security Review runs, scope includes at least:

- credential isolation / Vault;
- authorization (Admin + ADR; human start);
- workspace isolation;
- execution admission (Gate + Risk + KS);
- replay protection requirement;
- auditability (L03);
- operator UI truthfulness (L04);
- SSRF / egress considerations for live execution where relevant (Planning Package security OPEN items).

**Security Review = NOT STARTED.** This draft does **not** claim the project is live-ready or secure for live capital.

---

## Implementation boundary

```text
This ADR DRAFT does NOT authorize implementation.
V3-L01 implementation = NOT AUTHORIZED
V3-L02 … L05 implementation = NOT AUTHORIZED
Live UI implementation = NOT AUTHORIZED
Live order submission = NOT AUTHORIZED
Real-capital movement = NOT AUTHORIZED
Production enablement = NOT AUTHORIZED
FIV PASS = NOT CLAIMED
```

Per **D-GOV-01**, V3-L01 implementation may begin only after an **approved** Live-Capital ADR exists **and** separate implementation authorization (**D-GOV-05**) is granted, plus other applicable gates.

---

## Review and approval chain (D-GOV-04)

```text
1. ADR Draft                         ← THIS ARTIFACT (in progress / created)
2. Architecture Review               ← NOT STARTED
3. Security Review                   ← NOT STARTED
4. PO / Governance Review            ← NOT STARTED
5. Final PO / Governance Approval    ← NOT GRANTED
6. Repository publication/acceptance ← pending approval (Status remains DRAFT until then)
```

For D-GOV-01 satisfaction, **all** of D-GOV-04 §5 must hold (physical artifact; Wave 6 Live-Capital identity; Architecture PASS; Security PASS; PO approval recorded; published). `Status: Accepted` alone will not be sufficient proof.

---

## Open decisions

Do **not** treat the following as decided by this DRAFT:

| ID / topic                                                                    | Status                                                         |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Live Runtime Enforcement Gate admission attributes                            | **OPEN**                                                       |
| Exact workspace policy / mode mechanics                                       | **OPEN**                                                       |
| MFA / detailed UX for human authorization                                     | **OPEN**                                                       |
| L04 live-state enum / state machine                                           | **OPEN**                                                       |
| L05 replay-protection mechanism                                               | **OPEN**                                                       |
| L03 integrity mechanism (hash chain or equivalent)                            | **OPEN**                                                       |
| L03 schema / retention                                                        | **OPEN**                                                       |
| RK-03 policy contents                                                         | **OPEN**                                                       |
| SEC-16 mechanism choices beyond append-only + integrity-protected requirement | **OPEN**                                                       |
| Live FIV venue / operational conditions                                       | **OPEN**                                                       |
| Live recovery / reconcile detail beyond fail-closed                           | **OPEN**                                                       |
| Live trading secret-type policy / compromise runbook                          | **OPEN**                                                       |
| Release checklist content                                                     | **OPEN**                                                       |
| Kill Switch live incident runbook detail                                      | **OPEN**                                                       |
| L01–L05 slice IDs / sequencing inside packages                                | **OPEN**                                                       |
| D-GOV-05 implementation authorization                                         | **OPEN / NOT GRANTED**                                         |
| Numeric live risk thresholds                                                  | **OPEN** (not invented here)                                   |
| Leverage / shorting / multi-currency live allocation                          | **OUT OF SCOPE** unless separately decided (ADR-016 follow-up) |

---

## Consequences (expected if later Accepted)

### Advantages

- Clear supersession path from Paper Freeze for **opted-in** workspaces only.
- Preserves canonical execution, Risk, Kill Switch, Gate, Vault, and accounting ownership.
- Separates create-auth, draft, review, approval, and implementation authorization.
- Makes fail-closed and honesty rules explicit before live UI or live I/O.

### Constraints

- No live implementation until approval + D-GOV-05 (+ other gates).
- No claim that Wave 5 COMPLETE or CM-15 CLOSED is required or granted by this ADR.
- OPEN mechanisms must be resolved by later architecture / security / package decisions — not silently filled by implementers.

### Follow-up (after approval — not authorized now)

- V3-L01 workspace policy implementation (only after D-GOV-01 + D-GOV-05).
- V3-L02 live adapter path; V3-L03 audit log; V3-L04 honest UI; V3-L05 replay protection.
- Architecture Review · Security Review · PO / Governance Review of **this** ADR.
- Explicit release / production enablement acts (separate from ADR acceptance).

---

## Non-declarations

This DRAFT does **not**:

- accept or approve itself;
- authorize V3-L01 … L05 implementation;
- enable live trading or real capital;
- provision credentials;
- perform or claim FIV PASS;
- close Wave 5 or CM-15;
- create exceptions or waivers;
- modify ADR-012…018 Accepted text;
- redesign Master Plan or Execution Roadmap.

---

## STOP

**STOP.** ADR-020 is **DRAFT** only. Architecture / Security / PO Reviews **NOT STARTED**. Implementation **NOT AUTHORIZED**. Do not begin live capital enablement from this artifact.
