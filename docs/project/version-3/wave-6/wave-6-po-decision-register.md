# Wave 6 — PO / Chief Architect Decision Register

**Document:** Wave 6 PO / Chief Architect Decision Register
**Date:** 2026-09-16
**Wave:** 6 — Live Trading
**Nature:** Governance decision register only. **Not** a Master Plan revision. **Not** an ADR. **Not** implementation. **Not** Planning Package replacement.
**Primary source:** [`wave-6-planning-package.md`](./wave-6-planning-package.md)
**Cross-check:** Master Plan · Execution Roadmap · Package template · PO Guide · ADRs 012–018 · Wave 5 close/deferment · Technical Debt
**Repository baseline:** `af54cc34b59e88822c80bd805a900c19d25ccc0c`

```text
This register EXTRACTS open decisions.
It does NOT make decisions.
It does NOT approve options.
Temporary IDs (D-GOV-*, D-ARCH-*, …) are register-only — not Master Plan package IDs.
```

---

## PURPOSE

Provide a precise register of unresolved decisions that Product Owner / Chief Architect (and other named authorities where established) must resolve before relevant Wave 6 gates can pass — without redesigning the Planning Package or performing a new full audit.

---

## CURRENT GOVERNANCE STATE

| Item                                         | Status                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Wave 5                                       | **NOT COMPLETE** / **NOT CLOSED**                                                    |
| CM-15                                        | OPEN / DEFERRED / **NON-BLOCKING** (Final Close not authorized; CLOSED = NO)         |
| TD-CM15-TEAMS-LIVE                           | OPEN / DEFERRED / NON-BLOCKING                                                       |
| Wave 6 planning                              | **AUTHORIZED** (governance-only)                                                     |
| Wave 6 implementation                        | **NOT AUTHORIZED**                                                                   |
| Live trading                                 | **NOT AUTHORIZED**                                                                   |
| Real-capital movement                        | **NOT AUTHORIZED**                                                                   |
| Live UI implementation                       | **NOT AUTHORIZED**                                                                   |
| Live-capital ADR                             | **REQUIRED** / **NOT CREATED** / **NOT APPROVED** (no file; no number)               |
| ADR ↔ V3-L01 sequencing (D-GOV-01)           | **DECIDED — INTERPRETATION A ACCEPTED**                                              |
| D-GOV-02 (Wave 5 → Wave 6 / Rule 1)          | **DECIDED — INTERPRETATION C ACCEPTED**                                              |
| D-GOV-03 (Wave 5 COMPLETE / CM-15 deferred)  | **DECIDED — INTERPRETATION C ACCEPTED**                                              |
| D-GOV-04 (ADR creation / approval authority) | **DECIDED**                                                                          |
| D-GOV-05 (implementation authorization)      | **OPEN** / **NOT GRANTED**                                                           |
| FIV live/test environment                    | **NOT YET ESTABLISHED**                                                              |
| Technical Debt closure                       | **NOT AUTHORIZED**                                                                   |
| ADR creation by this synchronization task    | **NOT AUTHORIZED** (D-GOV-04 records who may authorize; does not grant a create act) |

Statuses above reflect PO decision synchronization for D-GOV-01, D-GOV-02, D-GOV-03, and D-GOV-04. Do not invent further status changes.

---

## GOVERNANCE DECISIONS

### D-GOV-01 — ADR ↔ V3-L01 sequencing

| Field                             | Content                                                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **STATUS**                        | **DECIDED — INTERPRETATION A ACCEPTED**                                                                                            |
| **Authoritative decision**        | An **approved** live-capital ADR **must exist before** V3-L01 **implementation** may begin.                                        |
| **Sequence in scope**             | approved live-capital ADR → V3-L01 implementation → downstream Wave 6 implementation                                               |
| **Authority**                     | **GOVERNANCE / PO** (Product Owner / Chief Architect). Architecture input expected; this record synchronizes the PO decision only. |
| **Affects**                       | Live gate; V3-L01; all downstream live enablement                                                                                  |
| **Evidence (decision brief)**     | [`d-gov-01-adr-l01-sequencing-decision-brief.md`](./d-gov-01-adr-l01-sequencing-decision-brief.md)                                 |
| **Blocks planning?**              | **NO** (Wave 6 planning may continue)                                                                                              |
| **Blocks V3-L01 implementation?** | **YES** — until an **approved** live-capital ADR exists **and** separate implementation authorization is granted (D-GOV-05)        |
| **Blocks FIV?**                   | **YES** (approved ADR remains prerequisite for live FIV)                                                                           |
| **Blocks release?**               | **YES**                                                                                                                            |
| **Blocks Wave 6 close?**          | **YES**                                                                                                                            |
| **Class**                         | GOVERNANCE / PO                                                                                                                    |

**Authoritative rule (accepted):**
“Approved live-capital ADR must exist before V3-L01 implementation may begin.”

**Scope of this decision (precise):**

- Wave 6 **planning** may continue.
- ADR **creation** is **NOT** authorized by D-GOV-01.
- ADR **approval** is **NOT** issued by D-GOV-01.
- V3-L01 **implementation** cannot begin until an **approved** live-capital ADR exists.
- Downstream L02–L05 implementation remains blocked by the applicable package/gate requirements.
- Implementation authorization remains separately governed by **D-GOV-05**.
- **D-GOV-04** is **DECIDED** (ADR creation / drafting / review / approval authority chain — see D-GOV-04). D-GOV-04 does **not** create or approve the ADR and does **not** satisfy D-GOV-01 by itself.
- **D-GOV-02** is **DECIDED — INTERPRETATION C ACCEPTED** (Wave 5 CLOSED is **not** a blanket prerequisite for all Wave 6 activities — see D-GOV-02).

**This decision does NOT mean:** ADR created; ADR approved; Wave 6 / V3-L01 implementation authorized; live trading; real capital; live UI; production release; FIV; Wave 5 complete; CM-15 closed.

**Repository-grounded rationale (from D-GOV-01 evidence brief):**

1. The Roadmap Live-capital gate states that Wave 6 starts only after Waves 1–4 exit and an approved live-capital ADR.
2. The Master Plan states live-capital ADR before Wave 6.
3. The global implementation order is: `[live-capital ADR] → L01 … L05`.
4. LT-01 states “after ADR” and lists ADR as a dependency.
5. No authoritative repository sentence states that V3-L01 may implement before ADR approval.
6. No authoritative repository sentence explicitly assigns ADR creation to V3-L01.
7. The package name “Live capital ADR + workspace policy” and the template exception for creating the named ADR when Wave 6 is reached do not override the explicit approved-ADR gate.

**Historical alternatives (evidence-supported; not re-opened by this sync):**

1. Interpretation A — Approved ADR before V3-L01 / Wave 6 implementation — **ACCEPTED**.
2. Interpretation B — V3-L01 may draft/obtain ADR approval when Wave 6 is reached — **NOT SELECTED**.

Do **not** convert this decision into an ADR.

---

### D-GOV-02 — Wave 5 → Wave 6 transition / Wave 5 closure boundary

| Field                      | Content                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **STATUS**                 | **DECIDED — INTERPRETATION C ACCEPTED**                                                                    |
| **Evidence brief**         | [`d-gov-02-wave5-wave6-transition-decision-brief.md`](./d-gov-02-wave5-wave6-transition-decision-brief.md) |
| **Authoritative decision** | Wave 5 **CLOSED** is **NOT** a blanket prerequisite for all Wave 6 activities.                             |
| **Class**                  | GOVERNANCE / PO                                                                                            |

**Authoritative decision (Product Owner / Chief Architect):**

Wave 6 **governance planning** may continue while Wave 5 remains open (and while CM-15 remains OPEN / DEFERRED / NON-BLOCKING). This does **NOT** authorize implementation.

Live-Capital ADR governance work may proceed according to **D-GOV-04**, **without** requiring Wave 5 CLOSED as an additional prerequisite (drafting, Architecture Review, Security Review, PO / Governance Review, final approval).

Irreversible Wave 6 product promises remain constrained by **Rule 1** and all other applicable gates.

**Rule 1 (preserved):**

> Finish a wave’s exit criteria before starting the next wave’s irreversible product promises (especially live UI).

- Binding execution constraint.
- **NOT** equivalent to “Wave 5 must be CLOSED before any Wave 6 activity.”
- Constrains irreversible next-wave product promises; live UI explicitly highlighted.
- Do not invent a broader blanket prohibition. Where irreversibility is not defined for an activity, do not invent an answer.

**Boundaries (precise):**

| Activity                         | Boundary                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Wave 6 governance planning       | **PERMITTED** while Wave 5 open                                                             |
| Live-Capital ADR governance work | **Not additionally gated** by Wave 5 CLOSED; governed by **D-GOV-04**                       |
| V3-L01 implementation            | **NOT AUTHORIZED** (D-GOV-01 + approved ADR + D-GOV-05 + Rule 1 + other gates)              |
| Irreversible product promises    | Constrained by **Rule 1**                                                                   |
| Live UI                          | **NOT AUTHORIZED**                                                                          |
| Live trading                     | **NOT AUTHORIZED**                                                                          |
| Real capital                     | **NOT AUTHORIZED**                                                                          |
| FIV PASS                         | **NOT AUTHORIZED** / **NOT CLAIMED**                                                        |
| Wave 5                           | Remains **NOT COMPLETE** / **NOT CLOSED**                                                   |
| D-GOV-03                         | Remains independent (**now DECIDED C** — Wave 5 closure withheld; not merged with D-GOV-02) |
| D-GOV-05                         | Remains **NOT GRANTED**                                                                     |

**Historical alternatives (evidence-supported; not re-opened):**

1. Interpretation A — Wave 5 CLOSED before any Wave 6 activity — **NOT SELECTED**.
2. Interpretation B — Planning while open; irreversible implementation blocked — **NOT SELECTED** (as the sole framing).
3. Interpretation C — Planning + ADR prep may proceed; Wave 5 closure independent for specific activities; Rule 1 constrains irreversible promises — **ACCEPTED**.

**This decision does NOT:** close Wave 5; create/approve the ADR; authorize implementation, live trading, real capital, live UI, or FIV PASS. (**D-GOV-03** was decided separately as Interpretation C.)

**Do not collapse:** planning ≠ implementation ≠ irreversible promises ≠ live UI ≠ live enablement ≠ real-capital operation.

---

### D-GOV-03 — Wave 5 completion with CM-15 deferred

| Field                            | Content                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **STATUS**                       | **DECIDED — INTERPRETATION C ACCEPTED**                                                                                                      |
| **Evidence brief**               | [`../wave-5/d-gov-03-wave5-close-with-cm15-deferred-decision-brief.md`](../wave-5/d-gov-03-wave5-close-with-cm15-deferred-decision-brief.md) |
| **Evidence addendum**            | [`../wave-5/d-gov-03-evidence-verification-addendum.md`](../wave-5/d-gov-03-evidence-verification-addendum.md)                               |
| **Scope**                        | Whether Wave 5 may be declared COMPLETE/CLOSED while CM-15 remains OPEN/DEFERRED/NON-BLOCKING                                                |
| **Authority**                    | **GOVERNANCE / PO** (exclusive Wave COMPLETE declaration — PO Guide)                                                                         |
| **Affects**                      | Wave 5 COMPLETE / CLOSED only; not Wave 6 live gate; does not change D-GOV-02 planning authorization                                         |
| **Planning blocker (W6)?**       | **NO** (Wave 6 governance planning remains authorized per D-GOV-02)                                                                          |
| **Implementation blocker (W6)?** | Unchanged — Wave 6 implementation remains **NOT AUTHORIZED** per D-GOV-05 (independent of this decision)                                     |
| **Class**                        | GOVERNANCE / PO                                                                                                                              |

**Authoritative decision (Product Owner / Chief Architect):**

**INTERPRETATION C ACCEPTED.**

Wave 5 is **NOT** authorized to be declared COMPLETE or CLOSED at this time.

Wave 5 closure is withheld because the governance treatment of a **shipped-but-deferred** CM-15 package has not yet been explicitly resolved.

| Interpretation                                                                                              | Outcome          |
| ----------------------------------------------------------------------------------------------------------- | ---------------- |
| A — Wave 5 MAY CLOSE with CM-15 OPEN / DEFERRED / NON-BLOCKING                                              | **NOT SELECTED** |
| B — Wave 5 MAY NOT CLOSE until CM-15 FINAL CLOSE / CLOSED                                                   | **NOT SELECTED** |
| C — Wave 5 closure depends on explicit additional governance resolution of CM-15 closure/deferral treatment | **ACCEPTED**     |

**What this decision is NOT based on:**

- **NOT** a rule that every package must always be CLOSED before Wave Close (no such authoritative rule was found).
- **NOT** treating `DEFERRED` as equivalent to `RESERVED` (no such authoritative rule was found).
- **NOT** a decision that CM-15 must necessarily be CLOSED.

**Current governance condition:**

```text
Wave 5 remains OPEN until the PO / Chief Architect explicitly resolves
the CM-15 closure/deferral treatment for Wave Close, based on an
authoritative governance rule or an explicit governance decision.
```

Governance clarification requirement only. Does **not** authorize implementation, FIV, Microsoft 365 acquisition, spending, or external infrastructure.

**Decision effect:**

| Item                        | Effect                                         |
| --------------------------- | ---------------------------------------------- |
| Wave 5 COMPLETE             | **NO**                                         |
| Wave 5 CLOSED               | **NO**                                         |
| CM-15 Implementation        | **PASS** (unchanged)                           |
| CM-15 FIV                   | **DEFERRED** (unchanged)                       |
| CM-15 Final Close           | **NOT AUTHORIZED** (unchanged)                 |
| CM-15 CLOSED                | **NO** (unchanged)                             |
| TD-CM15-TEAMS-LIVE          | **OPEN / DEFERRED / NON-BLOCKING** (unchanged) |
| Live-Capital ADR            | **Unaffected**                                 |
| Wave 6 governance planning  | Remains authorized per **D-GOV-02**            |
| Wave 6 implementation       | Remains **NOT AUTHORIZED** per **D-GOV-05**    |
| Live trading / real capital | Remains **NOT AUTHORIZED**                     |

**This decision does NOT:** close Wave 5; close CM-15; authorize CM-15 FIV; require CM-15 CLOSED; create/approve the ADR; authorize implementation, live trading, real capital, or live UI.

---

### D-GOV-04 — ADR creation / approval authority

| Field                                    | Content                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **STATUS**                               | **DECIDED**                                                                                              |
| **Evidence brief**                       | [`d-gov-04-adr-authority-decision-brief.md`](./d-gov-04-adr-authority-decision-brief.md)                 |
| **Affects**                              | ADR artifact path; D-GOV-01 satisfaction path; live enablement prerequisites                             |
| **Blocks planning?**                     | **NO**                                                                                                   |
| **Blocks V3-L01 implementation?**        | **YES** until an ADR that satisfies D-GOV-01 exists **and** D-GOV-05 grants implementation authorization |
| **Blocks FIV / release / Wave 6 close?** | **YES** for live-capital path (approved ADR still required)                                              |
| **Class**                                | GOVERNANCE / PO                                                                                          |

**Authoritative decision (Product Owner / Chief Architect):**

#### 1. Authorization to create the Live-Capital ADR

Authority to **authorize creation** of the future Wave 6 Live-Capital ADR belongs to **Product Owner / Governance**.
Wave 6 **planning** authorization does **NOT** automatically constitute authorization to create the ADR.
**This synchronization does NOT grant a create act** — it records who may authorize creation later.

#### 2. ADR drafting authority

**After explicit creation authorization:** Engineering / Architecture may prepare the ADR **draft**.
Drafting is strictly separate from: ADR approval · implementation authorization · live-capital authorization.
Drafting must **not** be treated as approval.

#### 3. Mandatory ADR reviews

Before final approval, the Live-Capital ADR must undergo:

- **Architecture Review**
- **Security Review** (mandatory gate)
- **Product Owner / Governance Review**

Operations may provide required operational input where the ADR covers venue, credentials, operational controls, rollback/runbook, or production procedures. Operations does **NOT** automatically become an ADR approval authority.

#### 4. Final ADR approval authority

Final governance approval belongs to **Product Owner / Governance**, only after Architecture and Security reviews have passed.

```text
ADR creation authorization (PO / Governance)
        ↓
ADR drafting (Engineering / Architecture)
        ↓
Architecture Review
        ↓
Security Review
        ↓
PO / Governance Review
        ↓
PO / Governance Approval
        ↓
Approved Live-Capital ADR
```

#### 5. Definition of an ADR that satisfies D-GOV-01

For D-GOV-01, the Live-Capital ADR is **approved** only when **all** of the following are true:

1. A physical ADR artifact exists under `docs/adr/`.
2. It is explicitly identified as the Wave 6 Live-Capital ADR.
3. Architecture Review has passed.
4. Security Review has passed.
5. PO / Governance approval has been granted.
6. The approval state is recorded in the ADR and/or an authoritative governance record.
7. The ADR is published in the repository.

`Status: Accepted` may be used consistently with ADR-012…018 precedent, but the status string alone is **NOT** sufficient proof of governance approval.

#### 6. Relationship to D-GOV-01

D-GOV-01 remains **DECIDED — Interpretation A**: an approved Live-Capital ADR **MUST EXIST** before V3-L01 implementation may begin.
**D-GOV-04 does NOT itself satisfy D-GOV-01.** Only the eventual approved Live-Capital ADR does.

#### 7. Relationship to implementation

Approval of the Live-Capital ADR does **NOT** automatically authorize: V3-L01 / Wave 6 implementation · live trading · real-capital movement · live production enablement · FIV PASS.
V3-L01 implementation remains subject to **D-GOV-05 / Package Approval** and other applicable gates.

**Current artifact state (unchanged by this decision):** Live-Capital ADR = **NOT CREATED** / **NOT APPROVED**.

**Do not create the ADR in this task.**

---

### D-GOV-05 — Implementation authorization gate

| Field                      | Content                                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **STATUS**                 | **OPEN** / **NOT GRANTED**                                                                                                                           |
| **What must be decided?**  | After which prerequisites (ADR approved / sequencing resolved / Wave 5 rule / package Planning Approval) may **implementation** of any V3-L0x begin? |
| **Authority**              | **GOVERNANCE / PO** (package Approval before production code — package template).                                                                    |
| **Why required?**          | Planning ≠ implementation authorization (established).                                                                                               |
| **Affects**                | All L01–L05                                                                                                                                          |
| **Evidence**               | Package template; Planning Package non-declarations                                                                                                  |
| **If remains OPEN**        | Implementation remains NOT AUTHORIZED (current default)                                                                                              |
| **Planning?**              | **NO**                                                                                                                                               |
| **Implementation?**        | **YES** (by definition)                                                                                                                              |
| **FIV / release / close?** | **YES** (downstream)                                                                                                                                 |
| **Class**                  | GOVERNANCE / PO                                                                                                                                      |

---

## ARCHITECTURE DECISIONS

Authority default: **CHIEF ARCHITECT / ARCHITECTURE** for technical design within Master Plan; **PO** if product-gate or Master Plan conflict. Where not explicit: **AUTHORITY NOT SPECIFIED — PO DECISION REQUIRED**.

| ID            | What must be decided?                                                    | Why                                              | Package / gate | If OPEN                                       | Impl?         | FIV?          | Release?      | W6 close?     | Evidence                          |
| ------------- | ------------------------------------------------------------------------ | ------------------------------------------------ | -------------- | --------------------------------------------- | ------------- | ------------- | ------------- | ------------- | --------------------------------- |
| **D-ARCH-01** | L01–L05 **slice decomposition**                                          | Slices not in Master Plan/Roadmap                | All L          | Cannot open slice-level impl packages cleanly | YES           | NOT SPECIFIED | NOT SPECIFIED | NOT SPECIFIED | Planning Package; package process |
| **D-ARCH-02** | Workspace live policy persistence / enablement API shape                 | New components NOT SPECIFIED                     | L01            | Policy store undefined                        | YES           | NOT SPECIFIED | YES           | YES           | L01 planning                      |
| **D-ARCH-03** | Runtime Enforcement Gate **live admission attributes**                   | Dependency named; attributes NOT SPECIFIED       | L01/L02        | Live admission undefined                      | YES           | YES           | YES           | YES           | Roadmap deps; L01                 |
| **D-ARCH-04** | Session integration for live mode                                        | Minor extension named; detail OPEN               | L01            | Session live mode undefined                   | YES           | YES           | YES           | YES           | Master Plan §10                   |
| **D-ARCH-05** | Kill Switch live execution wiring                                        | Foundation closed; live proof deferred to Wave 6 | L01/L02/L04    | Exit KS criterion unmet                       | YES           | YES           | YES           | YES           | W3 deferral; Wave 6 exit          |
| **D-ARCH-06** | Live timeout / lost-response / reconcile policy                          | ADR-012/016 principles; live mapping OPEN        | L02            | Failure scenarios unresolved                  | YES           | YES           | YES           | YES           | L02 failure matrix                |
| **D-ARCH-07** | Live duplicate/cancel-fill race/partial-fill/crash-after-submit behavior | Principles exist; live specifics OPEN            | L02            | Accounting/truth risk                         | YES           | YES           | YES           | YES           | L02 scenarios                     |
| **D-ARCH-08** | Venue adapter live binding / venue matrix                                | LT-02; TD-051 relevant                           | L02            | No live adapter scope                         | YES           | YES           | YES           | YES           | LT-02; TD-051                     |
| **D-ARCH-09** | RK-03 live risk policy contents                                          | Capability named; contents OPEN                  | L02            | Risk policies undefined                       | YES           | YES           | YES           | YES           | Capability inventory              |
| **D-ARCH-10** | Financial action **event schema**                                        | Attributable required; schema OPEN               | L03            | Cannot implement log                          | YES           | YES           | YES           | YES           | SEC-10; L03                       |
| **D-ARCH-11** | Tamper-evidence **integrity mechanism**                                  | “Hash chain or equivalent” — must choose         | L03            | Integrity OPEN                                | YES           | YES           | YES           | YES           | SEC-16                            |
| **D-ARCH-12** | Action↔order↔fill↔position↔ledger linkage design                         | SoT ownership AUTHORITATIVE; join OPEN           | L03            | Audit join unclear                            | YES           | YES           | NOT SPECIFIED | YES           | L03                               |
| **D-ARCH-13** | Retention for financial action log                                       | NOT SPECIFIED                                    | L03            | Retention OPEN                                | NOT SPECIFIED | NOT SPECIFIED | NOT SPECIFIED | NOT SPECIFIED | L03                               |
| **D-ARCH-14** | Formal **live UI state model**                                           | NOT SPECIFIED — Architect decision               | L04            | Honesty model incomplete                      | YES           | YES           | YES           | YES           | L04                               |
| **D-ARCH-15** | Unknown/indeterminate / venue-unavailable UI representation              | Continuity principles; UX OPEN                   | L04            | Misleading UI risk                            | YES           | YES           | YES           | YES           | L04                               |
| **D-ARCH-16** | Replay/idempotency **mechanism**                                         | Requirement AUTHORITATIVE; mechanism OPEN        | L05            | Cannot implement L05                          | YES           | YES           | YES           | YES           | Master Plan; L05                  |
| **D-ARCH-17** | Request identity for place/cancel replay                                 | Related to D-ARCH-16                             | L05            | Same                                          | YES           | YES           | YES           | YES           | L05                               |
| **D-ARCH-18** | Live recovery playbook after external submit                             | ADR-014/012; live OPEN                           | L02            | Orphan venue risk                             | YES           | YES           | YES           | YES           | L02 #11                           |

**Do not select technical solutions** unless already AUTHORITATIVE.

---

## SECURITY DECISIONS

```text
Security architecture exists       = YES
Live-capital authorization exists  = NO
Implementation security approval   = NO
FIV evidence exists                = NO
```

| Topic                                | Classification                                        | Decision needed?                 | Authority                                                       |
| ------------------------------------ | ----------------------------------------------------- | -------------------------------- | --------------------------------------------------------------- |
| Authentication (W1)                  | EXISTING                                              | Live surface wiring OPEN         | AUTHORITY NOT SPECIFIED — PO DECISION REQUIRED (Security input) |
| Authorization / RBAC                 | EXISTING + AUTHORITATIVE REQUIRED (live extra policy) | Live policy model OPEN           | PO + Architecture; Security review per package process          |
| Admin privilege / Admin+ADR          | AUTHORITATIVE REQUIRED                                | Enablement API/controls OPEN     | PO / Architecture                                               |
| Human confirmation / start           | AUTHORITATIVE REQUIRED                                | UX OPEN                          | PRODUCT / PO                                                    |
| MFA for live                         | Master Plan least-privilege note                      | OPEN / NOT SPECIFIED detail      | AUTHORITY NOT SPECIFIED — PO DECISION REQUIRED                  |
| Workspace isolation                  | EXISTING + REQUIRED on live                           | Live artifact checks OPEN        | Architecture / Security                                         |
| Vault / credentials                  | EXISTING Vault; REQUIRED trading secrets              | Live key types/provisioning OPEN | Architecture / Ops / Security                                   |
| Credential provisioning              | REQUIRED for live/FIV                                 | OPEN + INFORMATION REQUIRED      | OPERATIONS / RELEASE                                            |
| Network egress / SSRF / TLS to venue | AUTHORITATIVE REQUIRED for live adapter               | Policy OPEN                      | SECURITY / Architecture                                         |
| Venue connectivity                   | AUTHORITATIVE REQUIRED post-ADR                       | Binding OPEN                     | Architecture                                                    |
| Fail-closed                          | AUTHORITATIVE REQUIRED                                | Live wiring OPEN                 | Architecture / Security                                         |
| Replay                               | AUTHORITATIVE REQUIRED (L05)                          | Mechanism OPEN                   | Architecture / Security                                         |
| Audit integrity                      | AUTHORITATIVE REQUIRED (SEC-16)                       | Mechanism OPEN                   | Architecture / Security                                         |
| Kill Switch                          | EXISTING foundation; REQUIRED live proof              | Live wiring OPEN                 | Architecture                                                    |
| Runtime Enforcement Gate             | EXISTING reuse; REQUIRED live admission               | Attributes OPEN                  | Architecture                                                    |
| External financial side effects      | PROHIBITED until ADR + release                        | Release gate OPEN                | PO / Ops                                                        |

**Do not call the system secure. No security approval issued by this register.**

---

## OPERATIONS / FIV DECISIONS

| ID           | Decision                                                      | Planning | Implementation      | FIV     | Release       | Note                                                                                 |
| ------------ | ------------------------------------------------------------- | -------- | ------------------- | ------- | ------------- | ------------------------------------------------------------------------------------ |
| **D-OPS-01** | Safe test/live **venue** identity                             | NO       | NOT SPECIFIED       | **YES** | YES           | If unknown: **INFORMATION REQUIRED**; may yield `FIV BLOCKED — ENVIRONMENT REQUIRED` |
| **D-OPS-02** | Sandbox/testnet availability                                  | NO       | NOT SPECIFIED       | YES     | NOT SPECIFIED | Do not invent venue                                                                  |
| **D-OPS-03** | Test account / credentials in Vault                           | NO       | YES (for live path) | YES     | YES           |                                                                                      |
| **D-OPS-04** | Human operator for FIV                                        | NO       | NO                  | YES     | NOT SPECIFIED |                                                                                      |
| **D-OPS-05** | Safe test capital / order constraints                         | NO       | NOT SPECIFIED       | YES     | YES           |                                                                                      |
| **D-OPS-06** | Cancel / Kill Switch / audit / replay verification procedures | NO       | NOT SPECIFIED       | YES     | YES           |                                                                                      |
| **D-OPS-07** | Rollback / stop procedure for live test                       | NO       | NOT SPECIFIED       | YES     | YES           |                                                                                      |
| **D-OPS-08** | Production live **release gate** checklist                    | NO       | NO                  | NO      | YES           | After ADR + FIV                                                                      |

Authority: **OPERATIONS / RELEASE** for environment/credentials/runbooks; **PO** for authorizing live/test capital risk. Where unclear: **AUTHORITY NOT SPECIFIED — PO DECISION REQUIRED**.

**Do not invent a venue. Do not claim FIV PASS.**

---

## PRODUCT / CONSUMER DECISIONS

| ID            | What must be decided?                                                    | Authority                                   | Package | Notes                                       |
| ------------- | ------------------------------------------------------------------------ | ------------------------------------------- | ------- | ------------------------------------------- |
| **D-PROD-01** | What “Live” means in UI (vs paper / connected / authorized / executable) | PRODUCT / CONSUMER + **PO** (product truth) | L04     | Do not collapse states                      |
| **D-PROD-02** | When workspace may **show** Live                                         | PO / Product                                | L04     | Venue-reachable rule AUTHORITATIVE; UX OPEN |
| **D-PROD-03** | Paper default / opt-in presentation                                      | PO / Product                                | L01/L04 | Policy AUTHORITATIVE; copy OPEN             |
| **D-PROD-04** | Authorization vs execution-readiness visibility                          | Product / Architect                         | L04     |                                             |
| **D-PROD-05** | Verification / unavailable / unknown wording                             | Product                                     | L04     | Continuity AUTHORITATIVE; copy OPEN         |
| **D-PROD-06** | Customer-visible failure behavior for live path                          | Product / PO                                | L02/L04 | Fail-closed AUTHORITATIVE; UX OPEN          |

**Do not design final UI copy. Do not decide consumer policy here — identify decisions only.**

---

## DECISION IMPACT MATRIX

| Decision                                     | Authority                                    | Package                 | Planning Blocker | Implementation Blocker                                                | FIV Blocker   | Release Blocker | Wave Close Blocker | Evidence                                                                              |
| -------------------------------------------- | -------------------------------------------- | ----------------------- | ---------------- | --------------------------------------------------------------------- | ------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------- |
| D-GOV-01 ADR↔L01 (**DECIDED A**)             | PO                                           | L01+                    | NO               | YES — until approved ADR exists **and** D-GOV-05 grants impl auth     | YES           | YES             | YES                | Interpretation A: approved ADR before L01 impl                                        |
| D-GOV-02 W5→W6 (**DECIDED C**)               | PO                                           | planning / ADR / Rule 1 | NO               | YES for irreversible promises / live UI; L01 still needs ADR+D-GOV-05 | YES*          | YES*            | NOT SPECIFIED      | Interp C: W5 CLOSED not blanket; Rule 1 binds irreversible                            |
| D-GOV-03 W5 COMPLETE / CM-15 (**DECIDED C**) | PO                                           | Wave 5                  | NO               | NO — W5 COMPLETE withheld pending CM-15 governance resolution         | NO            | NO              | NO                 | Interp C: W5 closure withheld; NOT “all packages must CLOSE”; NOT “DEFERRED≡RESERVED” |
| D-GOV-04 ADR authority (**DECIDED**)         | PO / Governance (Arch+Sec reviews mandatory) | ADR                     | NO               | YES — until approved ADR exists per D-GOV-04 §5 **and** D-GOV-05      | YES           | YES             | YES                | Authority chain decided; ADR still missing                                            |
| D-GOV-05 Impl authorization                  | PO                                           | All L                   | NO               | YES                                                                   | YES           | YES             | YES                | Package template                                                                      |
| D-ARCH-01 slices                             | Architect / PO                               | All L                   | NO               | YES                                                                   | NOT SPECIFIED | NOT SPECIFIED   | NOT SPECIFIED      | No slice IDs                                                                          |
| D-ARCH-03 Gate attrs                         | Architect                                    | L01/L02                 | NO               | YES                                                                   | YES           | YES             | YES                | Roadmap deps                                                                          |
| D-ARCH-08 venue binding                      | Architect                                    | L02                     | NO               | YES                                                                   | YES           | YES             | YES                | LT-02                                                                                 |
| D-ARCH-10/11 log schema/integrity            | Architect                                    | L03                     | NO               | YES                                                                   | YES           | YES             | YES                | SEC-10/16                                                                             |
| D-ARCH-14 UI state model                     | Architect                                    | L04                     | NO               | YES                                                                   | YES           | YES             | YES                | L04 NOT SPECIFIED                                                                     |
| D-ARCH-16 replay mechanism                   | Architect                                    | L05                     | NO               | YES                                                                   | YES           | YES             | YES                | L05 OPEN                                                                              |
| D-OPS-01 FIV venue                           | Ops / PO                                     | L02                     | NO               | NOT SPECIFIED                                                         | YES           | YES             | YES                | FIV matrix                                                                            |
| D-OPS-08 release gate                        | Ops / PO                                     | Wave 6                  | NO               | NO                                                                    | NO            | YES             | YES                | Release boundary                                                                      |
| D-PROD-01…06 Live meaning/UI                 | PO / Product                                 | L04                     | NO               | YES                                                                   | YES           | YES             | YES                | Honesty rules                                                                         |

\*For D-GOV-02 FIV/Release: live UI / live enablement / real-capital remain **prohibited**; live FIV/release also need approved ADR and other gates. D-GOV-02 does **not** authorize them.

---

## DEPENDENCY GRAPH

```text
Governance Decisions
       ↓
D-GOV-01 = Interpretation A ACCEPTED
  (approved live-capital ADR MUST exist before V3-L01 implementation)
       ↓
D-GOV-02 = Interpretation C ACCEPTED
  (Wave 5 CLOSED is NOT a blanket Wave 6 prerequisite;
   planning + ADR governance may proceed while Wave 5 open;
   irreversible promises constrained by Rule 1)
       ↓
D-GOV-03 = Interpretation C ACCEPTED
  (Wave 5 COMPLETE/CLOSED withheld pending explicit CM-15
   closure/deferral governance resolution; Wave 6 planning unaffected)
       ↓
D-GOV-04 = DECIDED — authority chain
  create auth (PO) → draft (Eng/Arch) → Architecture Review
  → Security Review → PO Review → PO Approval → Approved ADR
  (Wave 5 CLOSED NOT an additional ADR prerequisite)
       ↓
Approved live-capital ADR   ← REQUIRED; currently NOT CREATED / NOT APPROVED
  (D-GOV-04 does NOT itself satisfy D-GOV-01)
       ↓
Architecture / Security decisions (D-ARCH-*, security OPENs for L packages)
       ↓
Implementation Authorization (D-GOV-05)  ← NOT GRANTED
  (+ Rule 1 for irreversible product promises, esp. live UI)
       ↓
L01 → L02 → L03 → L04 → L05   [Roadmap ORDER is AUTHORITATIVE]
       ↓
FIV  [safe venue NOT ESTABLISHED — may be FIV BLOCKED]
       ↓
Release Gate  [NOT SPECIFIED checklist — OPEN]
       ↓
Wave 6 Exit / CLOSE  [PO exclusive — not started]
```

**Not invented:** L01→L05 order is AUTHORITATIVE. D-GOV-01 places **approved** ADR **before** L01 implementation. D-GOV-02 Interpretation C: Wave 5 CLOSED is not a blanket prerequisite. D-GOV-03 Interpretation C: Wave 5 COMPLETE/CLOSED withheld pending CM-15 governance resolution (does **not** establish “all packages must CLOSE” or “DEFERRED≡RESERVED”). D-GOV-04 defines the create/draft/review/approve chain. ADR is **not** yet created or approved. D-GOV-05 remains **NOT GRANTED**. Release checklist content **NOT SPECIFIED**.

---

## SAFE ACTIVITIES NOW

Supported under current governance boundary:

- Documentation and planning revision (Wave 6 planning authorized)
- PO / Chief Architect decision preparation (this register)
- Architecture analysis / security analysis (planning-gate, non-approving)
- FIV **preparation** (environment requirements listing — not FIV execution/PASS)
- Read-only evidence gathering

**Planning is not implementation authorization.**

---

## PROHIBITED ACTIVITIES NOW

- Live-capital movement
- Live trading
- Live enablement
- Live UI implementation
- Production release
- ADR approval without Architecture + Security + PO / Governance approval (D-GOV-04)
- ADR creation without explicit PO / Governance creation authorization (D-GOV-04); this sync does not grant a create act
- Wave 5 closure
- CM-15 closure
- Technical Debt closure
- FIV PASS claims
- Wave 6 package closure
- Implementation of L01–L05

---

## MINIMUM DECISION SET BY PACKAGE

### A. Before V3-L01 implementation

1. D-GOV-05 implementation authorization (**OPEN** — not granted)
2. D-GOV-01 ADR↔L01 sequencing — **DECIDED A**: **approved** live-capital ADR must exist before L01 implementation
3. D-GOV-04 ADR creation/approval path — **DECIDED** (authority chain recorded); **and** resulting **approved** live-capital ADR per D-GOV-04 §5 (currently **NOT CREATED** / **NOT APPROVED**)
4. D-GOV-02 — **DECIDED C**: Wave 5 CLOSED not blanket prerequisite; Rule 1 still constrains irreversible promises (esp. live UI); classify L01 enablement irreversibility where needed
5. D-ARCH-01 (L01 slices) · D-ARCH-02 · D-ARCH-03 · D-ARCH-04 · D-ARCH-05 (as applicable to L01 scope)
6. Security: live policy / Admin enablement controls OPEN items affecting L01

### B. Before L02 implementation

All of A (or equivalent ADR+L01 baseline) **plus:**
D-ARCH-06…09 · D-ARCH-18 · venue/credential decisions · RK-03 · TD-051 awareness · real-capital remains unauthorized until ADR+release

### C. Before L03 implementation

L02 path producing actions (or agreed stub scope — **NOT SPECIFIED**) **plus:**
D-ARCH-10 · D-ARCH-11 · D-ARCH-12 · D-ARCH-13 (if retention in scope)

### D. Before L04 implementation

D-GOV-02 (Rule 1 / irreversible) · L01+L02 verified venue-reachability premise · D-ARCH-14 · D-ARCH-15 · D-PROD-01…06

### E. Before L05 implementation

Live place/cancel APIs in scope **plus:** D-ARCH-16 · D-ARCH-17

### F. Before Live FIV

Approved ADR · implementation of path under test · D-OPS-01…07 · human operator · **INFORMATION REQUIRED** if venue unknown (`FIV BLOCKED — ENVIRONMENT REQUIRED`)

### G. Before production live enablement

Approved ADR · FIV PASS (process) · D-OPS-08 release gate · Admin+ADR enablement · fail-closed/KS proof · **PO** product authorization

### H. Before Wave 6 closure

All exit criteria evidence · PO Wave COMPLETE declaration · no outstanding AUTHORITATIVE exit gaps · Wave 5 completeness remains independently gated by **D-GOV-03** (Wave 5 closure currently withheld) where Rule 1 / honesty requires it

**Not every decision blocks every package** — see matrix.

---

## ITEMS NOT SPECIFIED BY AUTHORITATIVE DOCUMENTATION

- Live-capital ADR filename / number (still NOT SPECIFIED until creation authorized and artifact produced)
- Whether Wave 6 **non-UI** implementation may start while Wave 5 NOT COMPLETE
  ~~* Whether Wave 5 CLOSED is a blanket Wave 6 prerequisite~~ — **DECIDED by D-GOV-02 Interpretation C**: NOT a blanket prerequisite
- ~~Whether Wave 5 may COMPLETE with CM-15 deferred~~ — **DECIDED by D-GOV-03 Interpretation C**: Wave 5 COMPLETE/CLOSED **withheld** pending explicit CM-15 closure/deferral governance resolution (does **not** decide that CM-15 must be CLOSED; does **not** equate DEFERRED with RESERVED)
- L01–L05 slice IDs
- Gate live admission attribute set
- SEC-16 integrity mechanism choice
- L05 replay mechanism
- L04 formal state enum
- RK-03 policy contents
- Financial action log retention
- Safe FIV venue identity
- Production live release checklist contents
- MFA procedural detail for live enablement

---

## NON-DECLARATIONS

This register does **not** authorize and does **not** claim:

- no implementation authorized;
- no ADR created;
- no ADR approved;
- no live trading;
- no real-capital movement;
- no live UI implementation;
- no production release;
- no FIV PASS;
- no Wave 5 closure / Wave 5 remains NOT COMPLETE;
- no CM-15 closure;
- no Technical Debt closure;
- no Wave 6 package closure.

**D-GOV-01** is recorded as **DECIDED — INTERPRETATION A ACCEPTED**.
**D-GOV-02** is recorded as **DECIDED — INTERPRETATION C ACCEPTED**. That does **not** close Wave 5, create/approve the ADR, grant **D-GOV-05**, or authorize implementation.
**D-GOV-03** is recorded as **DECIDED — INTERPRETATION C ACCEPTED**. That does **not** close Wave 5, does **not** close CM-15, does **not** require CM-15 CLOSED, does **not** equate DEFERRED with RESERVED, and does **not** establish that every package must always be CLOSED before Wave Close.
**D-GOV-04** is recorded as **DECIDED** (authority chain). That does **not** create or approve the Live-Capital ADR.

---

## STOP

STOP — D-GOV-03 synchronized as Interpretation C. Wave 5 remains NOT COMPLETE / NOT CLOSED. CM-15 remains NOT CLOSED. No ADR created or approved. No implementation authorized.
