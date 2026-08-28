# W4-E06 Validation Plan

**Package:** W4-E06 Wave 4 Completion Review
**Wave:** 4 — Exchange Connectivity
**Governance map:** Roll-up after Master Plan **V3-E01…E05**
**Status:** W4-E06-d **COMPLETE** — awaiting Product Owner review. W4-E06-e not opened.
**Date:** 2026-08-28
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w4-e06-product-scope.md`](./w4-e06-product-scope.md)
**Security:** [`w4-e06-security-review.md`](./w4-e06-security-review.md)
**Umbrella:** [`w4-e06-implementation-package.md`](./w4-e06-implementation-package.md)
**Overview:** [`w4-e06-overview.md`](./w4-e06-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Governance artifacts that present deferred product outcomes as delivered do **not** count as Close evidence.

Do not validate Live Trading, Wave 5 transports, or Wave 4 COMPLETE from W4-E06 planning alone. Validate **Wave 4 Completion Review** governance outcomes only.

---

## 0. What Close means for W4-E06

| Gate                               | Meaning                                                       | Unlocks                                  |
| ---------------------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| **W4-E06 Closed**                  | Wave 4 Completion Review evidence assembled; walkthrough PASS | PO may decide Wave 4 COMPLETE separately |
| **Wave 4 COMPLETE**                | Not claimed from W4-E06 alone                                 | Separate PO governance act               |
| **Exchange Connectivity Complete** | Not claimed from W4-E06 alone                                 | Separate honest product declaration      |
| **Not claimed**                    | Live Trading / live orders                                    | Wave 6 + ADR                             |
| **Not claimed**                    | Per-package deferred I/O delivered                            | E01…E05 product scope                    |
| **Not claimed**                    | Venue Permission Verification Complete (product)              | E05 deferred outcomes                    |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| Inventory validation          | E01…E05 delivered vs deferred honestly enumerated         |
| Exit criteria validation      | Master Plan / Roadmap criteria mapped to evidence         |
| Integration validation        | Cross-package consistency; no duplicate subsystem         |
| Honest Product validation     | Foundation ≠ product complete; Connected ≠ Live Trading   |
| Documentation validation      | wave-4-progress and companions synchronized               |
| Architecture validation       | No engine clone; single factory; Exchange Scope preserved |
| Security validation           | No new secret paths; E01…E05 security verdicts consumed   |
| Package acceptance validation | Acceptance criteria table; Close checklist                |

### Planning-phase commands (docs-only gate)

| Command                        | Purpose              |
| ------------------------------ | -------------------- |
| `pnpm lint`                    | Monorepo lint        |
| `pnpm typecheck`               | Type safety          |
| `pnpm test`                    | Regression suite     |
| `pnpm --filter @trp/web build` | Web build            |
| `git diff --check`             | Whitespace integrity |

---

## 2. Inventory validation (slice a)

| Area                   | Must prove                              |
| ---------------------- | --------------------------------------- |
| E01…E05 Close records  | All present and indexed                 |
| Foundation vs deferred | Each package deferred outcomes explicit |
| FIV verdicts           | All PASS at Close                       |
| No silent reopen       | E01…E05 remain CLOSED                   |

---

## 3. Exit criteria validation (slice b)

| Area                            | Must prove                            |
| ------------------------------- | ------------------------------------- |
| Master Plan Wave 4 criteria     | Mapped to evidence or honest deferral |
| Execution Roadmap exit criteria | Same                                  |
| No fabricated completion        | Gaps labeled deferred — not hidden    |
| Paper default preserved         | No live capital claims in mapping     |

---

## 4. Cross-package integration validation (slice c)

| Area                   | Must prove                                    |
| ---------------------- | --------------------------------------------- |
| Single factory pattern | No engine clone across E01…E05                |
| Persistence owner      | `exchange-adapter` only for E01…E05 artifacts |
| No duplicate SoT       | Canonical Order Path unchanged                |
| Exchange Scope         | Isolation boundary unchanged                  |

---

## 5. Honest Product validation (slice d)

| Area               | Must prove                                 |
| ------------------ | ------------------------------------------ |
| Connected rules    | Not conflated with Live Trading            |
| Foundation scope   | Not presented as full product I/O complete |
| Permission honesty | E05 deferred probes explicit in roll-up    |
| Wave non-claims    | No Wave 4 COMPLETE in slice artifacts      |

---

## 6. Regression validation

| Area                | Must prove                                |
| ------------------- | ----------------------------------------- |
| Wave 1–3 boundaries | No redesign of closed waves               |
| E01…E05 boundaries  | No reopen; no duplicate persistence owner |
| Monorepo regression | lint / typecheck / test / web build PASS  |

---

## 7. Architecture validation

| Area                   | Must prove                                          |
| ---------------------- | --------------------------------------------------- |
| No engine clone        | Factory extension pattern only across wave          |
| No duplicate subsystem | Single exchange connectivity engine                 |
| No duplicate SoT       | No second order path                                |
| No ownership drift     | Vault / Adapter / Cluster / Risk / Ledger unchanged |
| No Master Plan change  | V3-E01…E05 consumed not revised                     |

---

## 8. Security validation

| Area                      | Must prove                    |
| ------------------------- | ----------------------------- |
| E01…E05 security consumed | No new runtime secret surface |
| Governance docs           | No plaintext secrets pasted   |
| Workspace isolation       | Roll-up respects boundaries   |
| Fail closed               | Missing evidence flagged      |

---

## 9. Slice validation records (future)

| Slice    | Name                                                | Validation record                                                             |
| -------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| W4-E06-a | Wave 4 Package Roll-Up Inventory & Honesty Baseline | [`w4-e06-a-validation-report.md`](./w4-e06-a-validation-report.md) — **PASS** |
| W4-E06-b | Wave Exit Criteria Evidence Foundation              | [`w4-e06-b-validation-report.md`](./w4-e06-b-validation-report.md) — **PASS** |
| W4-E06-c | Cross-Package Integration Verification Foundation   | [`w4-e06-c-validation-report.md`](./w4-e06-c-validation-report.md) — **PASS** |
| W4-E06-d | Wave Operational Continuity & Honest Product Review | [`w4-e06-d-validation-report.md`](./w4-e06-d-validation-report.md) — **PASS** |
| W4-E06-e | Wave Completion Evidence Assembly                   | _Not opened_                                                                  |

---

## 10. Package Close checklist (future)

| #   | Item                                | Evidence                 |
| --- | ----------------------------------- | ------------------------ |
| 1   | All slices a–e COMPLETE             | Slice validation reports |
| 2   | Completion Review walkthrough PASS  | Walkthrough document     |
| 3   | Wave Completion Review report       | Governance artifact      |
| 4   | Final integration verification PASS | Integration verification |
| 5   | Security review at Close PASS       | Security review          |
| 6   | Product Owner Close Record          | PO governance act        |

---

## Explicit non-claims

- W4-E06 package validation PASS — **not claimed**
- W4-E06 CLOSED — **not claimed**
- W4-E06-e opened — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- Live Trading — **not claimed**

---

**STOP.** W4-E06-d validation **PASS**. Await Product Owner review before W4-E06-e. Do not declare Wave 4 COMPLETE.
