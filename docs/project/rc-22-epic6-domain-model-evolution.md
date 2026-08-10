# RC-22 Epic 6 — Domain Model Evolution

**Document:** Strategy Library Domain Model Evolution (Epic 6)  
**Status:** Epic 6 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 6 Report](./rc-22-epic6-lifecycle-deprecation-archive.md)

---

## Evolution summary

```text
Epic 1  Boundary
Epic 2  Strategy + StrategyVersion
Epic 3  StrategyCertification + CertificationEvidence
Epic 4  LibraryTacticalEnvelope
Epic 5  StrategyEligibility
Epic 6  StrategyLifecycleRecord + deprecate/archive transitions
        └── immutable records
        └── certification content unchanged
        └── domain complete (application ports still inactive)
```

---

## What changed

| Concept                                 | Before Epic 6 | After Epic 6                              |
| --------------------------------------- | ------------- | ----------------------------------------- |
| Certification status vocabulary         | Reserved      | **Transitions implemented** via snapshots |
| `StrategyLifecycleRecord`               | Absent        | **Added**                                 |
| Deprecate / archive APIs                | Absent        | **Added** (domain)                        |
| Hard delete                             | Forbidden     | Still forbidden                           |
| Eligibility / Envelope / Version shapes | Implemented   | **Unchanged**                             |

---

## Transition model

```text
certified (status=active)
    │ deprecate → lifecycle record + new snapshot (deprecated)
    │ archive   → lifecycle record + new snapshot (archived)
    ▼
deprecated
    │ archive → lifecycle record + new snapshot (archived)
    ▼
archived  (terminal; historically queryable; no resurrect)
```

Original certification objects remain as historical snapshots when callers retain them.  
New snapshot carries updated `status` only — `contentHash`, evidence, envelope unchanged.

---

## Non-evolution

- No eligibility rule redesign
- No certification admit redesign
- No runtime / Orchestrator
- No application port activation
- No Lake ownership change
