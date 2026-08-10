# RC-22 Epic 4 — Tactical Envelope Binding

**Status:** Implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** Domain envelope binding + validation only (no runtime / eligibility)  
**Parent:** [RC-22 Implementation Plan](./rc-22-implementation-plan.md) · [Epic Breakdown](./rc-22-epic-breakdown.md)  
**Contract:** [Domain Model Contract](./rc-22-domain-model-contract.md) §8 · [Tactics Contract](./v2-tactics-contract.md)  
**Prior:** Epics 1–3 **approved**  
**Companions:** [Domain Model Evolution](./rc-22-epic4-domain-model-evolution.md) · [Tactical Envelope Contract](./rc-22-epic4-tactical-envelope-contract.md) · [Ownership Decision Table](./rc-22-epic4-ownership-decision-table.md) · [Certification Coverage Report](./rc-22-epic4-certification-coverage-report.md)

---

## Implementation Report

### What shipped

- `LibraryTacticalEnvelope` — immutable configuration (markets, exchanges, symbols, timeframes, risk/max-position limits, parameter limits, execution constraints)
- Binding helpers: `bindTacticalEnvelopeToCertification`, `assertOneEnvelopePerCertification`, `assertEnvelopeCompatibleWithStrategyVersion`
- `StrategyCertification.tacticalEnvelope` **required** at create
- In-place replace forbidden (`replaceLibraryTacticalEnvelopeInPlace` / `replaceCertificationTacticalEnvelope` → throw; new certification required)
- Boundary: `tacticalEnvelopeDomain: true`
- Distinct from RC-19 Session `tactical-envelope` stub (remains non-authoritative)

### Modules touched

| Path                                       | Change                      |
| ------------------------------------------ | --------------------------- |
| `domain/library-tactical-envelope.ts`      | **New**                     |
| `domain/tactical-envelope-binding.ts`      | **New**                     |
| `domain/tactical-envelope-binding.spec.ts` | **New**                     |
| `domain/strategy-certification.ts`         | Require envelope on certify |
| `domain/strategy-certification.spec.ts`    | Envelope on all admits      |
| Boundary / index / module                  | Epic 4 posture + exports    |

### Ports / APIs affected

**None.** No eligibility, lookup, registration, REST, Session changes, or runtime.

### Explicit out of scope (confirmed absent)

- Eligibility
- Lookup / Registration
- Runtime / parameter optimisation / strategy execution
- Trading Session changes
- Market State / Orchestrator / AI
- Research ownership changes

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Tactical Envelope already in Spec / Tactics Contract / Domain Model §8)

Canonical ownership changed:
None
(Library owns envelope body for certified versions; Session stub remains non-SoT)

New runtime:
None

Backward compatibility:
100% (RC-19 Session stub untouched)

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                                | Result                                                              |
| -------------------------------------- | ------------------------------------------------------------------- |
| Strategy / StrategyVersion             | **Unchanged** — envelope does not mutate versions                   |
| StrategyCertification (Epic 3)         | **Extended** — envelope required field                              |
| RC-19 `tactical-envelope` stub         | **Unchanged** — Session attachment still inactive/non-authoritative |
| Research Lab                           | **Unchanged**                                                       |
| Trading Session / Paper / Orchestrator | **Unchanged**                                                       |
| Application ports                      | **None added**                                                      |

### Architecture validation checklist

| Check                                   | Result   |
| --------------------------------------- | -------- |
| Strategy Library remains owner          | **PASS** |
| Research ownership unchanged            | **PASS** |
| Tactical Envelope is configuration only | **PASS** |
| No runtime introduced                   | **PASS** |

---

## Certification Coverage Report

See [`rc-22-epic4-certification-coverage-report.md`](./rc-22-epic4-certification-coverage-report.md).

Summary: every new `StrategyCertification` must carry exactly one immutable `LibraryTacticalEnvelope` aligned with the referenced `StrategyVersion` allowlists.

---

## Tests Summary

| Suite                       | File                                       | Result        |
| --------------------------- | ------------------------------------------ | ------------- |
| Envelope + binding          | `domain/tactical-envelope-binding.spec.ts` | **PASS** (8)  |
| Certification (w/ envelope) | `domain/strategy-certification.spec.ts`    | **PASS** (8)  |
| Strategy model              | `domain/strategy-version.spec.ts`          | **PASS** (9)  |
| Boundary                    | `domain/strategy-library-boundary.spec.ts` | **PASS** (10) |
| Nest module                 | `strategy-library.module.spec.ts`          | **PASS** (1)  |

**Gate:** `pnpm --filter api exec vitest run src/modules/strategy-library` → **36/36 PASS**

Coverage intent:

- Immutable binding
- One envelope per certification
- Envelope cannot mutate StrategyVersion
- New envelope requires new certification reference

---

## Documentation Update Summary

| Document                               | Update                |
| -------------------------------------- | --------------------- |
| This Epic Report                       | **New**               |
| Domain Model Evolution                 | **New**               |
| Tactical Envelope Contract             | **New**               |
| Ownership Decision Table               | **New**               |
| Certification Coverage Report          | **New**               |
| Domain Model Contract §8               | Implementation status |
| Epic Breakdown / Plan / README indexes | Updated               |
| Module README                          | Envelope section      |

---

## Epic 4 Definition of Done

- [x] Certification requires structurally valid envelope.
- [x] Envelope covers markets / exchanges / symbols / timeframes and tactical ranges/sets.
- [x] Library owns envelope body; Session stub not treated as SoT.
- [x] Envelope expansion ⇒ new certification (no in-place enlarge).
- [x] Tests: reject mutate in place; one envelope per certification; no StrategyVersion mutation.

**STOP:** Epic 4 complete for review. Do not start Epic 5 until approved.
