# RC-22 Epic 3 — Certification Policy (Implementation Status)

**Document:** Strategy Library Certification Policy  
**Status:** Domain rules implemented (Epic 3) — application port deferred  
**Date:** 2026-08-10  
**Parent:** [Epic 3 Report](./rc-22-epic3-strategy-certification.md) · [Domain Model Contract](./rc-22-domain-model-contract.md) §§6–7 · [API Contract](./rc-22-api-contract.md) §5

---

## Purpose

State the normative certification rules now enforced in the **domain model**, and what remains deferred.

---

## Implemented rules (Epic 3)

| Rule                                                                  | Status       |
| --------------------------------------------------------------------- | ------------ |
| Certification references an immutable `StrategyVersion`               | **Enforced** |
| Certification never mutates `StrategyVersion`                         | **Enforced** |
| Evidence is immutable and reference-based                             | **Enforced** |
| Required evidence: backtesting + walk-forward                         | **Enforced** |
| Optional evidence: monte-carlo, paper-trading, statistical-validation | **Allowed**  |
| Human `certifiedBy` required (no AI auto-admit)                       | **Enforced** |
| At most one **active** certification per version                      | **Enforced** |
| Decision on success path = `admitted`                                 | **Enforced** |
| Initial status = `active`                                             | **Enforced** |
| Required immutable `LibraryTacticalEnvelope` (Epic 4)                 | **Enforced** |
| Envelope change requires new certification (Epic 4)                   | **Enforced** |

---

## Reserved / not implemented

| Rule                                           | Status                                                 |
| ---------------------------------------------- | ------------------------------------------------------ |
| `active → deprecated → archived` transitions   | **Deferred — Epic 6**                                  |
| Application `StrategyLibraryCertificationPort` | **Deferred** (domain only in Epic 3)                   |
| Envelope required at certify                   | **Implemented — Epic 4**                               |
| Eligibility consumption                        | **Deferred — Epic 5**                                  |
| Knowledge Lake certify/deprecate projections   | **Deferred** (optional later; Lake remains Projection) |
| Registration workflow / candidate prepare port | **Deferred**                                           |

---

## Policy statements

1. **Research → Library gate:** Only an explicit certification record admits a version into Library membership claims.
2. **No side-effect certification:** Research modules must not mint Library certification by writing their own stores.
3. **No profitability-only admit:** Missing required evidence rejects certification.
4. **Immutability:** New evidence or algorithm change requires a **new** `StrategyVersion` + new certification — never edit certified content.
5. **Eligibility is separate:** An active certification is necessary for future eligibility, not sufficient alone without Epic 5 gate wiring and Risk approval on the executable path.

---

## Code anchors

| Concern                 | Symbol                                                             |
| ----------------------- | ------------------------------------------------------------------ |
| Create certification    | `createStrategyCertification`                                      |
| Evidence factory        | `createCertificationEvidence`                                      |
| Duplicate active reject | `assertUniqueActiveCertification`                                  |
| Reference check         | `certificationReferencesStrategyVersion`                           |
| Lifecycle transitions   | `strategyCertificationLifecycleTransitionsImplemented() === false` |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
