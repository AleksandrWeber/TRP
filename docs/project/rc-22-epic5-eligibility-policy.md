# RC-22 Epic 5 — Eligibility Policy

**Document:** Strategy Library Eligibility Policy  
**Status:** Domain rules implemented (Epic 5) — application port / runtime wiring deferred  
**Date:** 2026-08-10  
**Parent:** [Epic 5 Report](./rc-22-epic5-eligibility-gate.md) · [Domain Model Contract](./rc-22-domain-model-contract.md) §9 · [API Contract](./rc-22-api-contract.md) §7

---

## Purpose

Define when a certified strategy is **domain-eligible** for future runtime selection — without performing runtime selection.

---

## Implemented rules

| Rule                                                           | Status       |
| -------------------------------------------------------------- | ------------ |
| Eligibility only for certified (active + admitted) strategies  | **Enforced** |
| Required evidence (backtesting + walk-forward) must be present | **Enforced** |
| Tactical envelope must be attached and immutable               | **Enforced** |
| Deprecated / archived certification ⇒ ineligible               | **Enforced** |
| Optional tactic point must be ⊆ envelope                       | **Enforced** |
| Optional exchange scope must be ⊆ envelope                     | **Enforced** |
| Eligibility record immutable; rules change ⇒ new record        | **Enforced** |
| Eligibility never mutates Certification                        | **Enforced** |
| Eligibility never references Trading Sessions                  | **Enforced** |

---

## Outcomes

| Outcome      | Meaning                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `eligible`   | Static domain gate passed — may be consumed by **future** runtime modules                            |
| `ineligible` | Gate failed — reasons listed (`certification_missing`, `evidence_incomplete`, `envelope_missing`, …) |

---

## Explicit non-rules (not evaluated)

- Market conditions / Market State
- Live exchange health
- Positions / balances / Risk Decision
- Session lifecycle / Kill Switch
- AI recommendations

Eligibility ≠ Risk approval. Risk Engine remains mandatory on any future executable path.

---

## Deferred

| Item                                        | Target                           |
| ------------------------------------------- | -------------------------------- |
| Nest `StrategyLibraryEligibilityPort`       | Later wiring                     |
| Deployment / Session bind consumption       | Final / post-RC-22 runtime epics |
| Lifecycle transitions affecting eligibility | Epic 6                           |

---

## Code anchors

| Concern                | Symbol                                                 |
| ---------------------- | ------------------------------------------------------ |
| Evaluate               | `evaluateStrategyEligibility`                          |
| Create eligible record | `createStrategyEligibility`                            |
| Rules replace          | `replaceEligibilityRulesInPlace` → throws              |
| Runtime integration    | `eligibilityRuntimeIntegrationImplemented() === false` |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
