# RC-22 Epic 4 — Certification Coverage Report

**Document:** Certification × Tactical Envelope Coverage  
**Status:** Epic 4 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 4 Report](./rc-22-epic4-tactical-envelope-binding.md) · [Certification Policy](./rc-22-epic3-certification-policy.md)

---

## Purpose

Prove that certification admission now covers tactical envelope binding — every certified membership claim includes approved operational boundaries.

---

## Coverage matrix

| Certification requirement                      | Epic 3  | Epic 4             |
| ---------------------------------------------- | ------- | ------------------ |
| Immutable StrategyVersion reference            | **Yes** | **Yes**            |
| Human `certifiedBy`                            | **Yes** | **Yes**            |
| Required evidence (backtesting + walk-forward) | **Yes** | **Yes**            |
| At most one active certification per version   | **Yes** | **Yes**            |
| Immutable `LibraryTacticalEnvelope`            | No      | **Yes (required)** |
| Envelope ⊆ StrategyVersion allowlists          | No      | **Yes**            |
| One envelope per certification                 | No      | **Yes**            |
| In-place envelope change forbidden             | N/A     | **Yes**            |
| Eligibility enforcement                        | No      | No (Epic 5)        |
| Lifecycle transitions                          | No      | No (Epic 6)        |

---

## Admit path (domain)

```text
StrategyVersion (immutable)
  + CertificationEvidence[] (required types)
  + LibraryTacticalEnvelope (compatible allowlists)
  + certifiedBy (human)
  → StrategyCertification (status=active)
```

Missing envelope ⇒ certification create fails.  
Mutating envelope on existing certification ⇒ rejected; create a new certification.

---

## Gaps explicitly deferred

| Gap                                                         | Target                           |
| ----------------------------------------------------------- | -------------------------------- |
| Application CertificationPort wiring                        | Later epic / port implementation |
| Out-of-envelope reject at Deployment/Session bind           | Epic 5 Eligibility               |
| Runtime ignore → Runtime enforce Session stub subordination | Epic 5+                          |
| Deprecate / archive certification                           | Epic 6                           |

---

## Verdict

**Certification coverage for tactical boundaries: COMPLETE at domain layer.**  
Production-path enforcement remains Epic 5.
