# RC-22 Epic 6 — Strategy Traceability Report

**Document:** Strategy Library Traceability (Idea → Lifecycle)  
**Status:** Epic 6 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 6 Report](./rc-22-epic6-lifecycle-deprecation-archive.md) · [Epic 5 Traceability](./rc-22-epic5-strategy-traceability-report.md)

---

## Full trace chain

```text
Idea / Hypothesis
  ↓
Research Lab (evidence bodies)                 ← Research SoT
  ↓
Strategy (family)                              ← Library
  └── StrategyVersion (contentHash)            ← Library
        ↓
StrategyCertification (admitted, active)
  • CertificationEvidence[] (refs)
  • LibraryTacticalEnvelope
        ↓
StrategyEligibility (domain gate)
        ↓
StrategyLifecycleRecord(s)
  • certified → deprecated → archived
  • historically queryable; no delete
        ↓
Future runtime consumers (NOT RC-22)
  • Deployment / Session / Orchestrator
  • Risk Engine still mandatory
```

---

## Identity map

| Stage             | Stable id                        |
| ----------------- | -------------------------------- |
| Family            | `strategyFamilyId`               |
| Version           | `libraryEntryId` + `contentHash` |
| Certification     | `certificationId`                |
| Envelope          | `envelopeVersion`                |
| Eligibility       | `eligibilityId` + `rulesVersion` |
| Lifecycle         | `lifecycleRecordId`              |
| Evidence artifact | `sourceRef` (foreign)            |

---

## Lifecycle impact on eligibility

| Phase      | New eligibility records?        |
| ---------- | ------------------------------- |
| Certified  | Allowed (if static gate passes) |
| Deprecated | **Blocked**                     |
| Archived   | **Blocked**                     |

Prior eligibility records remain historical facts; they are not mutated by lifecycle transitions.

---

## Verdict

Traceability from Research refs through certification, envelope, eligibility, and lifecycle history is **complete** for the Strategy Library domain.
