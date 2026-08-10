# RC-22 Epic 5 — Eligibility Coverage Report

**Document:** Eligibility Coverage over Certification + Envelope  
**Status:** Epic 5 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 5 Report](./rc-22-epic5-eligibility-gate.md) · [Certification Coverage](./rc-22-epic4-certification-coverage-report.md)

---

## Purpose

Prove the domain eligibility gate covers certification completeness and envelope presence before any future runtime consumer selects a strategy.

---

## Coverage matrix

| Condition                            | Evaluated? | Ineligible reason                                      |
| ------------------------------------ | ---------- | ------------------------------------------------------ |
| Certification present                | **Yes**    | `certification_missing`                                |
| Decision = admitted                  | **Yes**    | `certification_not_admitted`                           |
| Status = active                      | **Yes**    | `certification_not_active` / `deprecated` / `archived` |
| Required evidence complete           | **Yes**    | `evidence_incomplete`                                  |
| Envelope attached                    | **Yes**    | `envelope_missing`                                     |
| Envelope immutable                   | **Yes**    | `envelope_not_immutable`                               |
| Tactic point ⊆ envelope (optional)   | **Yes**    | `envelope_violation`                                   |
| Exchange scope ⊆ envelope (optional) | **Yes**    | `scope_not_allowed`                                    |
| Market State / live exchange         | **No**     | — (forbidden)                                          |
| Positions / Risk                     | **No**     | — (forbidden)                                          |
| Trading Session                      | **No**     | — (forbidden)                                          |

---

## Happy path

```text
active StrategyCertification
  + required evidence
  + LibraryTacticalEnvelope
  (+ optional in-envelope tacticPoint)
  → StrategyEligibility(outcome=eligible)
```

---

## Gaps deferred

| Gap                                     | Target                            |
| --------------------------------------- | --------------------------------- |
| Application EligibilityPort             | Later wiring                      |
| Deployment/Session bind enforcement     | Runtime integration (post domain) |
| Lifecycle auto-invalidating eligibility | Epic 6                            |

---

## Verdict

**Domain eligibility coverage: COMPLETE** for static certification + envelope conditions.  
Runtime consumption remains deferred by design.
