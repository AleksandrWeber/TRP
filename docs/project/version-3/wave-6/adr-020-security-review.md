# ADR-020 Security Review — Wave 6 Live-Capital

**Document:** Security Review of ADR-020 (Wave 6 Live-Capital)  
**Date:** 2026-09-16  
**Subject:** [`docs/adr/ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)  
**Architecture Review:** [`adr-020-architecture-review.md`](./adr-020-architecture-review.md) — **PASS** (`057c8f19b7e78706706a13101e049fc50aa00385`)  
**Reviewed ADR commit baseline:** `057c8f19b7e78706706a13101e049fc50aa00385`  
**Nature:** Formal Security Review only. **Not** PO / Governance Review. **Not** ADR approval. **Not** implementation authorization. **Not** live-capital enablement. **Not** FIV.  
**Precedent:** Separate `*-security-review.md` artifacts (Wave package / slice security reviews); Architecture Review used matching separate-artifact pattern for ADR-020.

```text
SECURITY REVIEW — PASS

ADR-020 Status                      = DRAFT (unchanged)
Architecture Review                 = PASS (unchanged)
Security Review                     = PASS
PO / Governance Review              = NOT STARTED
Final PO / Governance Approval      = NOT GRANTED
D-GOV-01 satisfaction               = NOT ACHIEVED
D-GOV-05 / Implementation           = NOT AUTHORIZED
V3-L01 … L05 implementation         = NOT AUTHORIZED
Live trading / real capital         = NOT AUTHORIZED
Live UI                             = NOT AUTHORIZED
Credentials provisioned             = NO
FIV PASS                            = NOT CLAIMED
```

**PASS means only:** Security Review = PASS.  
It does **not** mean ADR approved, PO/Governance approved, implementation authorized, or live capital enabled.

---

## Scope

Security coherence of the ADR-020 **DRAFT** as a governance/architecture boundary document for future live capital — evaluated for prevention, authorization, isolation, secrets, execution safety, integrity, replay resistance, auditability, fail-closed behavior, operator truthfulness, and containment — sufficiently to proceed to separate PO/Governance Review.

This review does **not** claim the live path is implemented, tested, or production-ready.

---

## Sources reviewed

| Source                                                                                             | Role                                              |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [`ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)                                  | Subject                                           |
| [`adr-020-architecture-review.md`](./adr-020-architecture-review.md)                               | Architecture PASS; OPEN inventory                 |
| ADR-012, ADR-016, ADR-017, ADR-018                                                                 | Paper Freeze / risk / ownership / invariants      |
| [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md)                               | D-GOV-01…05; create-auth; review chain            |
| [`wave-6-planning-approval.md`](./wave-6-planning-approval.md)                                     | Planning APPROVED; impl NOT AUTHORIZED            |
| [`wave-6-planning-package.md`](./wave-6-planning-package.md)                                       | L01–L05; security matrix; OPEN items              |
| [`wave-6-po-planning-review.md`](./wave-6-po-planning-review.md)                                   | Formal planning review                            |
| [`d-gov-01-adr-l01-sequencing-decision-brief.md`](./d-gov-01-adr-l01-sequencing-decision-brief.md) | Interpretation A                                  |
| [`d-gov-04-adr-authority-decision-brief.md`](./d-gov-04-adr-authority-decision-brief.md)           | Authority chain                                   |
| Master Plan / Roadmap / SEC-08·SEC-16 readiness context                                            | Live gate; SSRF foundation vs financial integrity |

---

## Security perspectives

| Perspective                | Finding                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Prevention                 | Paper default; structural reject of live under RC-16 preserved; opt-in + multi-gate admission required before any future live path |
| Authorization              | Human start; Admin + ADR; connectivity ≠ authorization ≠ readiness                                                                 |
| Isolation                  | Paper vs live-opted environments required; mechanics OPEN                                                                          |
| Secret protection          | Vault/Connections; no secrets in ADR/source; provisioning forbidden by draft                                                       |
| Execution safety           | Canonical path; Gate + Risk + KS mandatory; no second engine/bypass                                                                |
| Integrity / replay / audit | L03/L05 required, not claimed delivered; mechanisms OPEN                                                                           |
| Fail-closed / containment  | Ambiguity ⇒ no new live exposure; compromise runbook OPEN                                                                          |
| Operator truthfulness      | L04 honesty / Rule 1; UI not authorized                                                                                            |

---

## Criteria results (SR-01…SR-18)

| ID        | Criterion                                | Result   | Notes                                                                                                                                                                                                   |
| --------- | ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SR-01** | Paper Freeze boundary                    | **PASS** | Does not weaken ADR-012/016/017/018; live not currently permitted; opt-in supersession gated                                                                                                            |
| **SR-02** | Authorization security boundary          | **PASS** | Human auth required; autonomous activation rejected; MFA/UX **OPEN**                                                                                                                                    |
| **SR-03** | Workspace isolation                      | **PASS** | Paper vs live separation required; cross-env prevention required; mechanics **OPEN**                                                                                                                    |
| **SR-04** | Credential / secret security             | **PASS** | Vault boundary; paper/live separable; no secrets in ADR; no provisioning implied                                                                                                                        |
| **SR-05** | Execution admission security             | **PASS** | Live not from connectivity/UI/flag alone; multi-condition admission; attributes **OPEN**                                                                                                                |
| **SR-06** | Runtime Enforcement Gate                 | **PASS** | Mandatory; MUST NOT bypass; deny ⇒ fail-closed                                                                                                                                                          |
| **SR-07** | Kill Switch                              | **PASS** | Existing KS only; emergency-stop concept; live wiring/runbook **OPEN**; no live KS test                                                                                                                 |
| **SR-08** | Canonical execution path                 | **PASS** | No second engine/Bot/bypass/alternate credential or safety path                                                                                                                                         |
| **SR-09** | Financial action integrity (L03)         | **PASS** | Tamper-evident log required; not claimed implemented; schema/integrity/retention **OPEN**                                                                                                               |
| **SR-10** | Replay protection (L05)                  | **PASS** | Required for live place/cancel; duplicates forbidden (ADR-018 #9); mechanism **OPEN**                                                                                                                   |
| **SR-11** | Operator UI truthfulness (L04)           | **PASS** | Paper/live honesty; no false connected/verified; UI not authorized; state enum **OPEN**                                                                                                                 |
| **SR-12** | SSRF / network boundary                  | **PASS** | Draft names SSRF/egress as Security Review scope; existing SEC-08/S04 SSRF foundation and Wave 4 vendor allowlists are reuse context — **not** claimed sufficient for live; live egress policy **OPEN** |
| **SR-13** | Fail-closed behavior                     | **PASS** | Authz fail, missing creds, Gate deny, KS active, replay suspicion, etc. ⇒ no new live exposure                                                                                                          |
| **SR-14** | Credential compromise containment        | **PASS** | Vault + KS relationship acknowledged; compromise runbook / recovery **OPEN**                                                                                                                            |
| **SR-15** | Least privilege                          | **PASS** | Admin + ADR enablement; trader self-serve without audit rejected; full role matrix **OPEN**                                                                                                             |
| **SR-16** | Financial safety constraints             | **PASS** | Numeric thresholds / leverage / shorting / multi-currency not invented; **OPEN** / out of scope per ADR-016                                                                                             |
| **SR-17** | Recovery / incident handling             | **PASS** | Fail-closed principle present; detailed recovery **OPEN**                                                                                                                                               |
| **SR-18** | Security review completeness vs OPEN set | **PASS** | Required OPEN inventory preserved; not closed to obtain PASS                                                                                                                                            |

---

## Blocking security findings

**None.**

No unsafe bypass, no Paper Freeze contradiction, and no invented CLOSED security mechanisms were identified in ADR-020.

---

## Security-relevant OPEN items (deferred — not blocking Security Review)

| Topic                                                                        | Status                                     |
| ---------------------------------------------------------------------------- | ------------------------------------------ |
| Live Runtime Enforcement Gate admission attributes                           | **OPEN**                                   |
| Exact workspace policy / mode mechanics                                      | **OPEN**                                   |
| MFA / detailed UX for human authorization                                    | **OPEN**                                   |
| L04 live-state enum / state machine                                          | **OPEN**                                   |
| L05 replay-protection mechanism                                              | **OPEN**                                   |
| L03 integrity mechanism / schema / retention / key management / verification | **OPEN**                                   |
| RK-03 policy contents                                                        | **OPEN**                                   |
| SEC-16 mechanism choices beyond append-only + integrity-protected            | **OPEN**                                   |
| Live FIV venue / security conditions                                         | **OPEN**                                   |
| Live recovery / reconcile detail beyond fail-closed                          | **OPEN**                                   |
| Live trading secret-type policy / compromise runbook                         | **OPEN**                                   |
| Live egress / SSRF policy for live adapters beyond existing foundations      | **OPEN**                                   |
| Release checklist content                                                    | **OPEN**                                   |
| Kill Switch live incident runbook detail                                     | **OPEN**                                   |
| Operator / Vault / exchange least-privilege role matrix                      | **OPEN**                                   |
| Numeric live risk thresholds / max exposure / order limits                   | **OPEN**                                   |
| Leverage / shorting / multi-currency live allocation                         | **OUT OF SCOPE** unless separately decided |
| D-GOV-05 implementation authorization                                        | **OPEN / NOT GRANTED**                     |

---

## Selected boundary summaries

| Boundary                     | Result                                                          |
| ---------------------------- | --------------------------------------------------------------- |
| Paper Freeze compatibility   | **PASS** — paper default; live gated                            |
| Authorization                | **PASS** — human + Admin + ADR; connectivity ≠ authz            |
| Workspace isolation          | **PASS** — required; mechanics OPEN                             |
| Credential / Vault           | **PASS** — Vault ownership; no secrets in artifact              |
| Execution admission          | **PASS** — multi-gate; not connectivity-alone                   |
| Runtime Enforcement Gate     | **PASS** — no bypass                                            |
| Kill Switch                  | **PASS** — single foundation; live detail OPEN                  |
| Financial integrity (L03)    | **PASS** — required, not delivered                              |
| Replay protection (L05)      | **PASS** — required, mechanism OPEN                             |
| Operator UI truthfulness     | **PASS** — honesty preserved; UI unauthorized                   |
| Network / egress             | **PASS** — relevance acknowledged; live sufficiency not claimed |
| Fail-closed                  | **PASS**                                                        |
| Compromise / recovery        | **PASS** — containment intent; runbook OPEN                     |
| Least privilege              | **PASS** — model sketched; matrix OPEN                          |
| Financial safety constraints | **PASS** — not invented                                         |

---

## Implementation boundary (reconfirmed)

```text
Security Review PASS ≠ ADR APPROVED
Security Review PASS ≠ PO / Governance approval
Security Review PASS ≠ D-GOV-05
Security Review PASS ≠ V3-L01 … L05 implementation
Security Review PASS ≠ live trading / real capital / live UI / FIV
Security Review PASS ≠ credentials provisioned
```

ADR-020 remains **DRAFT**. Architecture Review remains **PASS**. Implementation remains **NOT AUTHORIZED**.

---

## Verdict

### SECURITY REVIEW — PASS

ADR-020 is sufficiently safe and security-coherent as a DRAFT governance boundary to proceed to separate **PO / Governance Review**. Remaining security mechanisms are legitimately deferred and explicitly **OPEN**.

**Next gate:** PO / Governance Review (NOT STARTED).  
**Do not:** mark ADR Accepted; grant D-GOV-05; implement L01–L05; enable live capital; provision credentials; perform FIV.

---

## STOP

**STOP.** Security Review = **PASS**. ADR-020 remains **DRAFT**. PO / Governance Review **NOT STARTED**. Final approval **NOT GRANTED**. Implementation **NOT AUTHORIZED**.
