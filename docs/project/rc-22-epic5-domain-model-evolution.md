# RC-22 Epic 5 — Domain Model Evolution

**Document:** Strategy Library Domain Model Evolution (Epic 5)  
**Status:** Epic 5 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 5 Report](./rc-22-epic5-eligibility-gate.md) · [Epic 4 Evolution](./rc-22-epic4-domain-model-evolution.md)

---

## Evolution summary

```text
Epic 1  Boundary
Epic 2  Strategy + StrategyVersion
Epic 3  StrategyCertification + CertificationEvidence
Epic 4  LibraryTacticalEnvelope (on certification)
Epic 5  StrategyEligibility (domain gate over certification + envelope)
        └── static conditions only
        └── no Session / Orchestrator / Market State
```

---

## What changed

| Concept                                       | Before Epic 5 | After Epic 5                              |
| --------------------------------------------- | ------------- | ----------------------------------------- |
| Strategy / Version / Certification / Envelope | Implemented   | Unchanged                                 |
| `StrategyEligibility`                         | Absent        | **Added** (immutable decision record)     |
| Eligibility evaluation                        | Absent        | **Added** (`evaluateStrategyEligibility`) |
| Application EligibilityPort / Session bind    | Absent        | Still absent (deferred)                   |
| Lifecycle transitions                         | Reserved      | Still deferred (Epic 6)                   |

---

## Binding shape

```text
StrategyVersion
    ▲
    │
StrategyCertification ──▶ LibraryTacticalEnvelope
    ▲
    │ references (certificationId + libraryEntryId + envelopeVersion)
    │ never mutates
    │
StrategyEligibility (eligible | ineligible)
```

---

## Static vs forbidden evaluation inputs

| Allowed (static domain)                  | Forbidden (runtime / live) |
| ---------------------------------------- | -------------------------- |
| Certification exists / active / admitted | Market State / regime      |
| Required evidence complete               | Live exchange connectivity |
| Tactical envelope attached + immutable   | Open positions / portfolio |
| Optional tactic point ⊆ envelope         | Trading Session lifecycle  |
| Optional exchange scope ⊆ envelope       | Orchestrator selection     |

---

## Non-evolution

- No Strategy Selector
- No Orchestrator / Market State modules
- No Session schema or bind-path changes
- No Research / Lake ownership changes
- No AI
