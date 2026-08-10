# RC-22 Epic 6 — Lifecycle Policy

**Document:** Strategy Library Lifecycle Policy  
**Status:** Domain implemented (Epic 6) — application LifecyclePort deferred  
**Date:** 2026-08-10  
**Parent:** [Epic 6 Report](./rc-22-epic6-lifecycle-deprecation-archive.md) · [Domain Model Contract](./rc-22-domain-model-contract.md) §§10–12

---

## Phases

| Phase      | Certification `status` | New eligibility? | Historically queryable? |
| ---------- | ---------------------- | ---------------- | ----------------------- |
| Certified  | `active`               | **Yes**          | Yes                     |
| Deprecated | `deprecated`           | **No**           | Yes                     |
| Archived   | `archived`             | **No**           | Yes                     |

---

## Transition rules

| From       | To         | Allowed                                                          |
| ---------- | ---------- | ---------------------------------------------------------------- |
| certified  | deprecated | **Yes**                                                          |
| certified  | archived   | **Yes**                                                          |
| deprecated | archived   | **Yes**                                                          |
| archived   | *          | **No** (no resurrect — new version + new certification required) |
| *          | same phase | **No** (noop forbidden)                                          |

Each transition:

1. Creates a new `StrategyLifecycleRecord`
2. Returns a new frozen certification snapshot with updated `status`
3. Does **not** mutate the input certification
4. Does **not** change `contentHash`, evidence, or envelope

---

## Deprecation

- Requires reason + actor + timestamp
- Withdraws from **new** eligibility only
- Historical certification remains valid for archaeology

## Archive

- Terminal retention / catalog hygiene
- Not a delete (`strategyLifecycleHardDeleteImplemented() === false`)
- Remains listable via lifecycle history helpers

---

## Deferred

| Item                                | Target                                                                |
| ----------------------------------- | --------------------------------------------------------------------- |
| Nest `StrategyLibraryLifecyclePort` | Later wiring                                                          |
| Lake projection of lifecycle events | Optional; Lake remains Projection                                     |
| RC-22 Validation & Release          | **Complete** — [`rc-22-closure-report.md`](./rc-22-closure-report.md) |

---

## Code anchors

| Concern           | Symbol                                 |
| ----------------- | -------------------------------------- |
| Deprecate         | `deprecateStrategyCertification`       |
| Archive           | `archiveStrategyCertification`         |
| History           | `listLifecycleHistoryForCertification` |
| Eligibility guard | `canReceiveNewEligibilityRecord`       |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
