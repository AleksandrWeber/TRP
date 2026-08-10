# RC-22 Epic 3 — Strategy Certification & Evidence

**Status:** Implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** Domain certification model only (no application ports, no eligibility)  
**Parent:** [RC-22 Implementation Plan](./rc-22-implementation-plan.md) · [Epic Breakdown](./rc-22-epic-breakdown.md)  
**Contract:** [Domain Model Contract](./rc-22-domain-model-contract.md) §§6–7  
**Prior:** Epic 1–2 **approved**  
**Companions:** [Domain Model Evolution](./rc-22-epic3-domain-model-evolution.md) · [Ownership Decision Table](./rc-22-epic3-ownership-decision-table.md) · [Certification Policy](./rc-22-epic3-certification-policy.md)

---

## Implementation Report

### What shipped

- `CertificationEvidence` — immutable refs (`backtesting`, `walk-forward`, `monte-carlo`, `paper-trading`, `statistical-validation`)
- `StrategyCertification` — admission record bound to `StrategyVersion` by identity + `contentHash` snapshot
- Rules: never mutates `StrategyVersion`; required evidence = backtesting + walk-forward; at most one **active** certification per version
- Status vocabulary reserved (`active` | `deprecated` | `archived`) — Epic 3 only issues `active`; **no** lifecycle transitions
- Boundary: `certificationDomain: true`; application `certification` / eligibility / lookup / lifecycle ports remain `false`
- Module exports updated

### Modules touched

| Path                                                     | Change                      |
| -------------------------------------------------------- | --------------------------- |
| `strategy-library/domain/certification-evidence.ts`      | **New**                     |
| `strategy-library/domain/strategy-certification.ts`      | **New**                     |
| `strategy-library/domain/strategy-certification.spec.ts` | **New**                     |
| `strategy-library/domain/strategy-library-boundary.ts`   | `certificationDomain: true` |
| `strategy-library/index.ts`                              | Export certification domain |
| Boundary / module specs                                  | Epic 3 posture              |

### Ports / APIs affected

**None.** No `StrategyLibraryCertificationPort`, registration, lookup, eligibility, REST, or persistence.

### Explicit out of scope (confirmed absent)

- Eligibility
- Registration / Lookup / Query ports
- Tactical Envelope binding
- Lifecycle transitions (deprecate / archive)
- Research ownership changes
- Knowledge Lake ownership / admits
- Orchestrator / Market State / UI

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Certification + Evidence already in Domain Model Contract / Spec §5.2 / §8)

Canonical ownership changed:
None
(Library owns certification records; Research retains artifact bodies)

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                             | Result                                           |
| ----------------------------------- | ------------------------------------------------ |
| Strategy / StrategyVersion (Epic 2) | **Unchanged** — certification binds by reference |
| Experimental registry               | **Unchanged**                                    |
| Research Lab modules                | **Unchanged** — evidence uses `sourceRef` only   |
| Knowledge Lake                      | **Unchanged** — no admits in Epic 3              |
| Session / Paper / Execution         | **Unchanged**                                    |
| Application ports                   | **None added**                                   |

### Architecture validation checklist

| Check                                        | Result   |
| -------------------------------------------- | -------- |
| Research remains owner of research artifacts | **PASS** |
| Strategy Library owns certification          | **PASS** |
| No duplicate Source of Truth                 | **PASS** |
| No runtime introduced                        | **PASS** |

---

## Domain Model Evolution

See [`rc-22-epic3-domain-model-evolution.md`](./rc-22-epic3-domain-model-evolution.md).

Summary: Certification is an **external** immutable record referencing `StrategyVersion`; version content stays certification-free; evidence types expanded to include paper-trading + statistical-validation per Epic 3 task.

---

## Tests Summary

| Suite                       | File                                       | Result        |
| --------------------------- | ------------------------------------------ | ------------- |
| Certification + Evidence    | `domain/strategy-certification.spec.ts`    | **PASS** (8)  |
| Boundary posture            | `domain/strategy-library-boundary.spec.ts` | **PASS** (10) |
| Strategy model (regression) | `domain/strategy-version.spec.ts`          | **PASS** (9)  |
| Nest module                 | `strategy-library.module.spec.ts`          | **PASS** (1)  |

**Gate:** `pnpm --filter api exec vitest run src/modules/strategy-library` → **28/28 PASS**

Coverage intent:

- Certification references immutable StrategyVersion
- Evidence immutable + reference-based
- Duplicate active certification rejected
- Certification never mutates StrategyVersion
- Required evidence enforced; lifecycle transitions absent

---

## Documentation Update Summary

| Document                 | Update                            |
| ------------------------ | --------------------------------- |
| This Epic Report         | **New**                           |
| Domain Model Evolution   | **New**                           |
| Ownership Decision Table | **New** (Epic 3)                  |
| Certification Policy     | **New** (implementation status)   |
| Domain Model Contract    | §§6–7 status + evidence type note |
| Epic Breakdown           | Epic 3 DoD                        |
| Module README            | Certification section             |
| `docs/README.md`         | Index                             |

---

## Epic 3 Definition of Done (task-scoped)

- [x] `StrategyCertification` + `CertificationEvidence` domain concepts
- [x] Bind certification to immutable `StrategyVersion` (no version mutation)
- [x] At most one active certification per version
- [x] Evidence refs for backtesting / walk-forward / monte-carlo / paper-trading / statistical-validation
- [x] No eligibility / envelope / registration / lookup / Lake ownership changes
- [x] Tests for reference binding, immutability, duplicate reject

**Deferred to later Epics:** application CertificationPort, envelope-at-certify, Lake projection admit, lifecycle transitions, eligibility.

**STOP:** Epic 3 complete for review. Do not start Epic 4 until approved.
