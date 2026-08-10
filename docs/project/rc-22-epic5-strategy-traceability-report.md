# RC-22 Epic 5 — Strategy Traceability Report

**Document:** Strategy Library Traceability (Idea → Eligibility)  
**Status:** Epic 5 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 5 Report](./rc-22-epic5-eligibility-gate.md) · Spec §8 Research Lifecycle

---

## Purpose

Show end-to-end traceability from research artifacts to domain eligibility — without runtime execution.

---

## Trace chain

```text
Idea / Hypothesis
  ↓
Research Lab (experiments, campaigns)          ← Research SoT (bodies)
  ↓
Validation evidence
  • backtesting sourceRef
  • walk-forward sourceRef
  • optional monte-carlo / paper / statistical
  ↓
Strategy (family)                              ← Library
  └── StrategyVersion (immutable contentHash)  ← Library
        ↓
StrategyCertification (active, human admit)    ← Library
  • CertificationEvidence[] (refs only)
  • LibraryTacticalEnvelope (config SoT)
        ↓
StrategyEligibility (domain gate)              ← Library
  • eligible | ineligible + reasons
        ↓
Future runtime consumers (NOT Epic 5)
  • Deployment / Session / Orchestrator
  • still subject to Risk Engine
```

---

## Identity map

| Stage             | Stable id                                    |
| ----------------- | -------------------------------------------- |
| Family            | `strategyFamilyId`                           |
| Version           | `libraryEntryId` + `contentHash`             |
| Certification     | `certificationId`                            |
| Envelope          | `envelopeVersion`                            |
| Eligibility       | `eligibilityId` + `rulesVersion`             |
| Evidence artifact | `sourceRef.owner` + `sourceRef.id` (foreign) |

---

## What is traceable vs not claimed

| Traceable now                                    | Not claimed in Epic 5         |
| ------------------------------------------------ | ----------------------------- |
| Version ↔ certification ↔ envelope ↔ eligibility | Session executed the strategy |
| Evidence refs → Lab artifact ids                 | Lake is membership SoT        |
| Ineligible reasons                               | Live market suitability       |

---

## Alias Dictionary alignment

| Product language   | Canonical                                                |
| ------------------ | -------------------------------------------------------- |
| Mission            | Strategy Deployment (future consumer of eligibility)     |
| Bot                | Trading Session (not referenced by eligibility)          |
| Certified strategy | `libraryEntryId` with active certification + eligibility |

---

## Verdict

Traceability from Research evidence refs through Library certification/envelope to domain eligibility is **complete** for RC-22 Epics 1–5. Runtime selection remains a future consumer.
