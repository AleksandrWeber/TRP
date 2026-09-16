# ADR-020 Architecture Review — Wave 6 Live-Capital

**Document:** Architecture Review of ADR-020 (Wave 6 Live-Capital)  
**Date:** 2026-09-16  
**Subject:** [`docs/adr/ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)  
**Reviewed commit:** `83bbb12b2ad726923f5280307abe9fdaeaa12666`  
**Nature:** Architecture Review only. **Not** Security Review. **Not** PO / Governance Review. **Not** ADR approval. **Not** implementation authorization.  
**Precedent:** Separate `*-architecture-review.md` artifacts (Wave package / slice reviews); no ADR-embedded Architecture Review convention in `docs/adr/`.

```text
ARCHITECTURE REVIEW — PASS

ADR-020 Status                      = DRAFT (unchanged)
Architecture Review                 = PASS
Security Review                     = NOT STARTED
PO / Governance Review              = NOT STARTED
Final PO / Governance Approval      = NOT GRANTED
D-GOV-01 satisfaction               = NOT ACHIEVED
D-GOV-05 / Implementation           = NOT AUTHORIZED
V3-L01 … L05 implementation         = NOT AUTHORIZED
Live trading / real capital         = NOT AUTHORIZED
Live UI                             = NOT AUTHORIZED
FIV PASS                            = NOT CLAIMED
```

**PASS means only:** Architecture Review = PASS.  
It does **not** mean ADR approved, Security Review passed, implementation authorized, or live capital enabled.

---

## Reviewed source set

| Source                                                                                             | Role                                                     |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)                                  | Subject under review                                     |
| [`docs/adr/README.md`](../../../adr/README.md)                                                     | ADR inventory / indexing                                 |
| ADR-012, ADR-016, ADR-017, ADR-018                                                                 | Paper Freeze / execution / risk / ownership / invariants |
| ADR-007…019 inventory                                                                              | Adjacent ADR set (no overwrite / no contradiction found) |
| [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md)                               | D-GOV-01…05; create-auth §1a                             |
| [`wave-6-planning-approval.md`](./wave-6-planning-approval.md)                                     | Planning APPROVED; implementation NOT AUTHORIZED         |
| [`wave-6-planning-package.md`](./wave-6-planning-package.md)                                       | L01–L05; Gate; KS; Vault; OPEN items                     |
| [`wave-6-po-planning-review.md`](./wave-6-po-planning-review.md)                                   | Formal planning review                                   |
| [`d-gov-01-adr-l01-sequencing-decision-brief.md`](./d-gov-01-adr-l01-sequencing-decision-brief.md) | Interpretation A                                         |
| [`d-gov-04-adr-authority-decision-brief.md`](./d-gov-04-adr-authority-decision-brief.md)           | Authority chain                                          |
| Master Plan · Execution Roadmap                                                                    | Live gate; Wave 6 deps; L01 naming                       |

---

## Perspectives

| Perspective                        | Finding                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Developer / Engineering**        | ADR-020 extends ADR-012 canonical path via adapter binding; forbids second engine / parallel Bot / bypass; defers OPEN mechanisms without inventing them.     |
| **Consumer / Operator**            | Requires human start; Admin + ADR enablement; honest paper/live distinction; Rule 1 (no premature live UI promise). MFA/UX remain OPEN.                       |
| **Security / Safety architecture** | Consumes Risk, Kill Switch, Runtime Enforcement Gate, Vault; fail-closed; L03/L05 as requirements not claims. Formal Security Review remains **NOT STARTED**. |

---

## Criteria results

| ID        | Criterion                                     | Result   | Notes                                                                                                                                                                                      |
| --------- | --------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AR-01** | Governance compatibility (D-GOV-01/04/§1a/05) | **PASS** | §1a = create DRAFT only; Status DRAFT; V3-L01 NOT AUTHORIZED; D-GOV-05 NOT GRANTED; create ≠ approve ≠ implement preserved                                                                 |
| **AR-02** | Paper Freeze compatibility (012/016/017/018)  | **PASS** | Paper default; opt-in supersession only; ADR-018 #10 preserved until later approved+implemented path; no silent repeal                                                                     |
| **AR-03** | Canonical execution architecture              | **PASS** | Preserves ADR-012 Order→Risk→Execution→Adapter path; Roadmap “Session / Execution Adapter / Gate” treated as extension map + admission Gate, not a second engine; no parallel Bot / bypass |
| **AR-04** | Kill Switch architecture                      | **PASS** | Consumes existing KS; explicitly forbids second KS; live wiring / runbook **OPEN**                                                                                                         |
| **AR-05** | Runtime Enforcement Gate                      | **PASS** | Mandatory dependency; MUST NOT bypass; deny ⇒ fail-closed; live admission attributes **OPEN**                                                                                              |
| **AR-06** | Workspace / environment separation            | **PASS** | Paper vs live-opted environments; structural separation intent; exact mechanics **OPEN**                                                                                                   |
| **AR-07** | Human authorization boundary                  | **PASS** | Autonomous activation rejected; human start + Admin + ADR; MFA/UX **OPEN**                                                                                                                 |
| **AR-08** | Credentials / Vault                           | **PASS** | Vault/Connections ownership; paper/live separable; no secret exposure; no provisioning by this ADR                                                                                         |
| **AR-09** | Financial execution admission                 | **PASS** | Paper / live / unauthorized / fail-closed distinctions present; admission state machine **OPEN**                                                                                           |
| **AR-10** | Auditability (L03)                            | **PASS** | Tamper-evident log required; not claimed delivered; schema/integrity **OPEN**                                                                                                              |
| **AR-11** | Replay protection (L05)                       | **PASS** | Required future control; not claimed implemented; mechanism **OPEN**                                                                                                                       |
| **AR-12** | Operator UI truthfulness (L04)                | **PASS** | Honesty / Rule 1 preserved; UI implementation not authorized; state enum **OPEN**                                                                                                          |
| **AR-13** | Fail-closed behavior                          | **PASS** | Ambiguous/invalid ⇒ no new live exposure; detailed recovery **OPEN**                                                                                                                       |
| **AR-14** | Future L01–L05 compatibility                  | **PASS** | Coherent foundation for L01–L05; none claimed implemented                                                                                                                                  |
| **AR-15** | Open decisions remain OPEN                    | **PASS** | Required OPEN set present; not closed to obtain PASS                                                                                                                                       |
| **AR-16** | No architecture drift                         | **PASS** | No second engine/path/KS; no Gate bypass; no new waiver/exception; no invented CLOSED decisions                                                                                            |

---

## Architectural findings

### Strengths

1. Clear governance header separating DRAFT / create-auth / reviews / D-GOV-05 / live non-authorization.
2. Explicit Paper Freeze preservation with opted-in-only supersession language.
3. Canonical path preservation with explicit anti-drift prohibitions.
4. Safety controls positioned as **consumers** of existing KS / Gate / Risk / Vault — not replacements.
5. L03 / L04 / L05 treated as requirements aligned to packages, not as delivered capabilities.
6. OPEN inventory matches Planning Package unresolved mechanisms.

### Clarifications (non-blocking)

1. **“Gate PASS” vs “Runtime Enforcement Gate”:** ADR-020 lists both separately under admission (certified + Gate PASS **and** Runtime Enforcement Gate admission). That matches Master Plan / Roadmap (strategy certification Gate ≠ Runtime Enforcement Gate). No conflation found; both remain required; live Gate admission attributes remain **OPEN**.
2. **Canonical path diagram:** ADR-020 quotes ADR-012 execution chain; Session / Gate appear as Wave 6 dependency / admission map (Roadmap architecture note). This is consistent extension language, not a second path.
3. **ADR number ADR-020:** Assigned by sequential `docs/adr/` convention under create-auth; acceptable for DRAFT identity; approval still pending.

### Contradictions with authoritative decisions

**None identified.**

---

## Unresolved OPEN items (deferred — not blocking Architecture Review)

| Topic                                                               | Status                                     |
| ------------------------------------------------------------------- | ------------------------------------------ |
| Live Runtime Enforcement Gate admission attributes                  | **OPEN**                                   |
| Exact workspace policy / mode mechanics                             | **OPEN**                                   |
| MFA / detailed UX for human authorization                           | **OPEN**                                   |
| L04 live-state enum / state machine                                 | **OPEN**                                   |
| L05 replay-protection mechanism                                     | **OPEN**                                   |
| L03 integrity mechanism / schema / retention                        | **OPEN**                                   |
| RK-03 policy contents                                               | **OPEN**                                   |
| SEC-16 mechanism choices (beyond append-only + integrity-protected) | **OPEN**                                   |
| Live FIV venue / operational conditions                             | **OPEN**                                   |
| Live recovery / reconcile detail beyond fail-closed                 | **OPEN**                                   |
| Live trading secret-type policy / compromise runbook                | **OPEN**                                   |
| Release checklist content                                           | **OPEN**                                   |
| Kill Switch live incident runbook detail                            | **OPEN**                                   |
| L01–L05 slice IDs                                                   | **OPEN**                                   |
| D-GOV-05 implementation authorization                               | **OPEN / NOT GRANTED**                     |
| Numeric live risk thresholds                                        | **OPEN**                                   |
| Leverage / shorting / multi-currency live allocation                | **OUT OF SCOPE** unless separately decided |

These remain for later Architecture / Security / package decisions. They do **not** make ADR-020 architecturally incoherent for progression to Security Review.

---

## Implementation boundary (reconfirmed)

```text
Architecture Review PASS ≠ ADR APPROVED
Architecture Review PASS ≠ Security Review PASS
Architecture Review PASS ≠ PO / Governance approval
Architecture Review PASS ≠ D-GOV-05
Architecture Review PASS ≠ V3-L01 … L05 implementation
Architecture Review PASS ≠ live trading / real capital / live UI / FIV
```

ADR-020 remains **DRAFT**. V3-L01 implementation remains **NOT AUTHORIZED**.

---

## Verdict

### ARCHITECTURE REVIEW — PASS

ADR-020 is architecturally coherent, consistent with Paper Freeze and Wave 6 governance, and sufficiently defined for subsequent **Security Review**. Remaining OPEN items are legitimately deferred.

**Next gate:** Security Review (NOT STARTED).  
**Do not:** mark ADR Accepted; grant D-GOV-05; implement L01–L05; enable live capital.

---

## STOP

**STOP.** Architecture Review = **PASS**. ADR-020 remains **DRAFT**. Security Review / PO Review / Final Approval / Implementation remain **NOT** granted or started as applicable.
