# RC-22 Epic 4 — Domain Model Evolution

**Document:** Strategy Library Domain Model Evolution (Epic 4)  
**Status:** Epic 4 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 4 Report](./rc-22-epic4-tactical-envelope-binding.md) · [Epic 3 Evolution](./rc-22-epic3-domain-model-evolution.md)

---

## Evolution summary

```text
Epic 1  Boundary
Epic 2  Strategy + StrategyVersion
Epic 3  StrategyCertification + CertificationEvidence
Epic 4  LibraryTacticalEnvelope bound on StrategyCertification
        └── configuration only
        └── does NOT mutate StrategyVersion
        └── does NOT add eligibility / runtime
```

---

## What changed

| Concept                        | Before Epic 4        | After Epic 4                       |
| ------------------------------ | -------------------- | ---------------------------------- |
| `Strategy` / `StrategyVersion` | Unchanged            | Unchanged                          |
| `StrategyCertification`        | Evidence + admission | **+ required `tacticalEnvelope`**  |
| `LibraryTacticalEnvelope`      | Absent               | **Added** (Library SoT)            |
| RC-19 Session envelope stub    | Inactive             | Still inactive / non-authoritative |
| Eligibility                    | Absent               | Still absent (Epic 5)              |

---

## Binding shape

```text
StrategyVersion (immutable content)
        ▲
        │ reference (id + contentHash)
        │
StrategyCertification (active)
        │
        └── LibraryTacticalEnvelope (exactly one, immutable)
```

Changing envelope limits ⇒ **new certification** (typically with a new `StrategyVersion`).  
In-place envelope replace APIs throw by design.

---

## Configuration vs logic

| Envelope contains                                        | Envelope does **not** contain               |
| -------------------------------------------------------- | ------------------------------------------- |
| Approved markets / exchanges / symbols / timeframes      | Signal / indicator logic                    |
| Risk-per-trade / max-position bounds                     | Order submission                            |
| Named parameter **limits**                               | Live parameter optimisation                 |
| Execution **constraints** (caps / order-type allowlists) | Runtime adaptation / Orchestrator selection |

---

## Non-evolution

- No Eligibility port
- No Lookup / Registration
- No Trading Session schema change
- No Market State / Orchestrator / AI
- No Research ownership transfer
