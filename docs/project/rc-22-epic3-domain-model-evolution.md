# RC-22 Epic 3 — Domain Model Evolution

**Document:** Strategy Library Domain Model Evolution (Epic 3)  
**Status:** Epic 3 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 3 Report](./rc-22-epic3-strategy-certification.md) · [Domain Model Contract](./rc-22-domain-model-contract.md)

---

## Evolution summary

```text
Epic 1  Boundary (SoT declared)
Epic 2  Strategy + StrategyVersion (immutable content)
Epic 3  StrategyCertification + CertificationEvidence (external bind)
        └── does NOT embed status into StrategyVersion
        └── does NOT mutate StrategyVersion
```

---

## What changed in the model

| Concept                 | Before Epic 3           | After Epic 3                                       |
| ----------------------- | ----------------------- | -------------------------------------------------- |
| `Strategy`              | Family identity         | Unchanged                                          |
| `StrategyVersion`       | Immutable content       | Unchanged (still no embedded certification)        |
| `StrategyCertification` | Absent                  | **Added** — references version by id + contentHash |
| `CertificationEvidence` | Absent                  | **Added** — immutable `sourceRef` pointers         |
| Eligibility / Envelope  | Absent                  | Still absent (Epics 4–5)                           |
| Lifecycle transitions   | Vocabulary only in docs | Status enum reserved; **no** transition APIs       |

---

## Binding shape

```text
StrategyVersion (immutable)
        ▲
        │ references (libraryEntryId + contentHash snapshot)
        │
StrategyCertification (immutable, status=active)
        │
        └── CertificationEvidence[] → Research / Paper artifact ids
```

Certification is the **gate record** between Research evidence and Library membership claims.  
It does not rewrite version content and does not grant eligibility (Epic 5).

---

## Evidence type set (Epic 3)

| Type                     | Required to admit? | Artifact owner                 |
| ------------------------ | ------------------ | ------------------------------ |
| `backtesting`            | **Yes**            | Research / Backtesting         |
| `walk-forward`           | **Yes**            | Research / Walk Forward        |
| `monte-carlo`            | No                 | Research (when available)      |
| `paper-trading`          | No                 | Paper path producers           |
| `statistical-validation` | No                 | Research / validation surfaces |

**Contract alignment note:** Domain Model Contract §7 originally listed `riskEvaluation` / `experimentVersion`. Epic 3 adopts the task evidence set above; those earlier labels remain conceptually covered by research `sourceRef.owner` flexibility and may be added as explicit types in a later contract amendment if needed.

---

## Invariants locked in Epic 3

1. Certification never mutates `StrategyVersion`.
2. Evidence is immutable and reference-based (no result-body ownership).
3. At most one **active** certification per `libraryEntryId`.
4. Human `certifiedBy` required.
5. Lifecycle transitions (`active → deprecated → archived`) not implemented.

---

## Non-evolution (explicit)

- No Registration / Lookup / Eligibility ports
- No Tactical Envelope on certification
- No Knowledge Lake projection admits
- No Research module ownership transfer
