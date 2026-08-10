# RC-22 Epic 6 — Lifecycle, Deprecation, Archive & Internal Audit

**Status:** Implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** Domain lifecycle completion + internal audit (no runtime; Validation & Release is a separate task)  
**Parent:** [RC-22 Implementation Plan](./rc-22-implementation-plan.md) · [Epic Breakdown](./rc-22-epic-breakdown.md)  
**Prior:** Epics 1–5 **approved**  
**Companions:** [Domain Model Evolution](./rc-22-epic6-domain-model-evolution.md) · [Lifecycle Policy](./rc-22-epic6-lifecycle-policy.md) · [Ownership Decision Table](./rc-22-epic6-ownership-decision-table.md) · [Internal Audit Report](./rc-22-epic6-internal-audit-report.md) · [Strategy Readiness Report](./rc-22-epic6-strategy-readiness-report.md) · [Strategy Traceability Report](./rc-22-epic6-strategy-traceability-report.md)

---

## Implementation Report

### What shipped

- `StrategyLifecycleRecord` — immutable transition audit records
- `deprecateStrategyCertification` / `archiveStrategyCertification` — emit new lifecycle record + new frozen certification snapshot (`status` updated)
- Phases: `certified` (active) → `deprecated` → `archived` (also `certified` → `archived`)
- No in-place mutation of original certification; `contentHash` / envelope unchanged
- Historical query helpers: `appendStrategyLifecycleRecord`, `listLifecycleHistoryForCertification`
- Deprecated/archived cannot receive new eligibility (`canReceiveNewEligibilityRecord`)
- Boundary: `lifecycleDomain: true`; application lifecycle port remains `false`
- Internal audit + readiness + traceability documentation

### Modules touched

| Path                                | Change                            |
| ----------------------------------- | --------------------------------- |
| `domain/strategy-lifecycle.ts`      | **New**                           |
| `domain/strategy-lifecycle.spec.ts` | **New**                           |
| `domain/strategy-certification.ts`  | Lifecycle transitions flag → true |
| Boundary / index / module           | Epic 6 posture + exports          |

### Ports / APIs affected

**None wired.** Application Registration / Certification / Lookup / Eligibility / Lifecycle ports remain inactive. Domain lifecycle complete.

### Explicit out of scope (confirmed absent)

- Runtime / Trading Orchestrator / Strategy Selector
- Eligibility model redesign
- Certification model redesign
- Session / Research / Knowledge Lake changes
- RC-22 Validation & Release (separate task)

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Lifecycle / deprecate / archive already in Domain Model Contract §§10–12)

Canonical ownership changed:
None

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
(Application ports intentionally inactive until later wiring)
```

---

## Compatibility Report

| Surface                                         | Result                                                    |
| ----------------------------------------------- | --------------------------------------------------------- |
| Certification / Envelope / Eligibility entities | **Unchanged shapes** — lifecycle adds snapshots + records |
| Strategy / StrategyVersion                      | **Unchanged**                                             |
| Research / Lake / Session / Runtime             | **Unchanged**                                             |
| Application ports                               | Still inactive as planned                                 |

---

## Internal Audit Report

See [`rc-22-epic6-internal-audit-report.md`](./rc-22-epic6-internal-audit-report.md) — **PASS**.

---

## Strategy Readiness Report

See [`rc-22-epic6-strategy-readiness-report.md`](./rc-22-epic6-strategy-readiness-report.md) — domain module **READY** for Validation & Release task.

---

## Tests Summary

| Suite                       | File                                | Result        |
| --------------------------- | ----------------------------------- | ------------- |
| Lifecycle                   | `domain/strategy-lifecycle.spec.ts` | **PASS** (6)  |
| Full Strategy Library suite | `src/modules/strategy-library`      | **PASS** (50) |

**Gate:** `pnpm --filter api exec vitest run src/modules/strategy-library` → **50/50 PASS**

---

## Documentation Update Summary

| Document                               | Update               |
| -------------------------------------- | -------------------- |
| This Epic Report                       | **New**              |
| Domain Model Evolution                 | **New**              |
| Lifecycle Policy                       | **New**              |
| Ownership Decision Table               | **New**              |
| Internal Audit Report                  | **New**              |
| Strategy Readiness Report              | **New**              |
| Strategy Traceability Report           | **Updated** (Epic 6) |
| Domain Model Contract §§10–12          | Implemented          |
| Epic Breakdown / Plan / README indexes | Updated              |
| Module README                          | Lifecycle complete   |

---

## Epic 6 Definition of Done (task-scoped)

- [x] Lifecycle records + deprecation + archive + policies
- [x] Transitions create new records; no in-place mutation
- [x] Archived historically queryable; deprecated blocks new eligibility
- [x] Internal audit (domain, ownership, ports, model)
- [x] No runtime introduced
- [ ] RC-22 Validation & Release / Closure tag — **separate task**

**STOP:** Epic 6 complete for review. RC-22 Validation & Release is a separate task.
