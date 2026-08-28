# W4-E05 Validation Plan

**Package:** W4-E05 Venue Permission Verification
**Wave:** 4 — Exchange Connectivity
**Master Plan / Roadmap:** V3-E05 · feeds LT-02 later
**Status:** Planning **OPEN**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Date:** 2026-08-28
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w4-e05-product-scope.md`](./w4-e05-product-scope.md)
**Security:** [`w4-e05-security-review.md`](./w4-e05-security-review.md)
**Umbrella:** [`w4-e05-implementation-package.md`](./w4-e05-implementation-package.md)
**Overview:** [`w4-e05-overview.md`](./w4-e05-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock vendor permission I/O without proving a real permission probe (or an approved recorded sandbox contract) do **not** count as Close evidence.

Do not validate per-venue Real I/O product outcomes (E01–E04), Live Trading, Wave 5 transports, or Wave 4 COMPLETE from E05 alone. Validate **Venue Permission Verification** outcomes only.

---

## 0. What Close means for W4-E05

| Gate                | Meaning                                                             | Unlocks                           |
| ------------------- | ------------------------------------------------------------------- | --------------------------------- |
| **W4-E05 Closed**   | Cross-venue vendor-verified permissions evidenced; walkthrough PASS | V3-E05 advanced for package scope |
| **Wave 4 COMPLETE** | Not claimed from E05 alone                                          | Requires PO Completion Review     |
| **Not claimed**     | Live Trading / live orders                                          | Wave 6 + ADR                      |
| **Not claimed**     | Exchange Connectivity Complete                                      | E01…E05 Close + PO                |
| **Not claimed**     | Per-venue Real I/O Complete                                         | E01–E04                           |
| **Not claimed**     | Venue Permission Verification Complete (beyond package scope)       | Separate PO act if needed         |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| Unit validation               | Permission mapping; secret non-echo; workspace binding            |
| Integration validation        | Vault retrieve + permission probe; cross-workspace deny           |
| UI validation                 | Honest permission / Expired / insufficient labels                 |
| Regression validation         | Wave 1–3 and W4-E01…E04 security and product boundaries           |
| Product walkthrough           | Venue Permission Verification Walkthrough executed in product     |
| Architecture validation       | No engine clone; factory extension only; Exchange Scope preserved |
| Security validation           | Verification Standard + isolation + authz + SSRF + fail closed    |
| Package acceptance validation | Acceptance criteria table; Close checklist                        |

### Planning-phase commands (docs-only gate)

| Command                        | Purpose              |
| ------------------------------ | -------------------- |
| `pnpm lint`                    | Monorepo lint        |
| `pnpm typecheck`               | Type safety          |
| `pnpm test`                    | Regression suite     |
| `pnpm --filter @trp/web build` | Web build            |
| `git diff --check`             | Whitespace integrity |

---

## 2. Unit validation

| Area                   | Must prove                                       |
| ---------------------- | ------------------------------------------------ |
| Permission integrity   | Verified requires probe evidence                 |
| Default honesty        | Hardcoded defaults not presented as verified     |
| Secret non-echo        | Responses, logs, errors never include secrets    |
| Workspace binding      | Missing/wrong workspace fails closed             |
| Vendor error mapping   | Expired / permission errors map to honest labels |
| No capital side effect | Permission probe never places live orders        |

---

## 3. Integration validation

| Area                              | Must prove                                     |
| --------------------------------- | ---------------------------------------------- |
| Vault retrieve + permission probe | Real probe or approved sandbox                 |
| Cross-workspace deny              | A cannot use B credentials or permission state |
| Factory permission surface        | Vendor-reported permissions through factory    |
| Restart recovery                  | W4-E05-b/c anchors hydrate after restart       |
| Operational continuity            | Platform Readiness / CM-04 projection honest   |

---

## 4. UI validation

| Area               | Must prove                                    |
| ------------------ | --------------------------------------------- |
| Permission label   | Only after real vendor probe                  |
| Expired            | Vendor-visible failures shown                 |
| Permission problem | Insufficient permissions visible              |
| No Live Trading    | UI never implies live capital from permission |

---

## 5. Regression validation

| Area                  | Must prove                                |
| --------------------- | ----------------------------------------- |
| Wave 1–3 boundaries   | No redesign of closed waves               |
| W4-E01…E04 boundaries | No reopen; no duplicate persistence owner |
| Exchange Scope        | Isolation boundary unchanged              |
| Canonical Order Path  | Unchanged                                 |

---

## 6. Architecture validation

| Area                   | Must prove                                          |
| ---------------------- | --------------------------------------------------- |
| No engine clone        | Factory extension only                              |
| No duplicate subsystem | Single exchange connectivity engine                 |
| No duplicate SoT       | No second order path                                |
| No ownership drift     | Vault / Adapter / Cluster / Risk / Ledger unchanged |
| No Master Plan change  | V3-E05 consumed not revised                         |

---

## 7. Security validation

| Area                  | Must prove                       |
| --------------------- | -------------------------------- |
| Verification Standard | Required rows PASS at Close      |
| Workspace isolation   | Cross-workspace deny evidenced   |
| Authorization         | Unauthorized role deny evidenced |
| SSRF                  | Vendor endpoints only            |
| Fail closed           | Missing context denies           |

---

## 8. Slice validation records

| Slice    | Name                                               | Validation record                                                                          |
| -------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| W4-E05-a | Venue Permission Inventory & Honesty Baseline      | [`w4-e05-a-validation-report.md`](./w4-e05-a-validation-report.md) — **PASS** (2026-08-28) |
| W4-E05-b | Durable Venue Permission Verification Foundation   | [`w4-e05-b-validation-report.md`](./w4-e05-b-validation-report.md) — **PASS** (2026-08-28) |
| W4-E05-c | Venue Permission Restart Recovery Foundation       | [`w4-e05-c-validation-report.md`](./w4-e05-c-validation-report.md) — **PASS** (2026-08-28) |
| W4-E05-d | Venue Permission Operational Continuity Foundation | [`w4-e05-d-validation-report.md`](./w4-e05-d-validation-report.md) — **PASS** (2026-08-28) |
| W4-E05-e | Package Close evidence                             | [`w4-e05-e-validation-report.md`](./w4-e05-e-validation-report.md) — **PASS** (2026-08-28) |

**W4-E05-e Close Evidence recorded.** Final Package Integration Verification and Product Owner Close remain separate governance steps.

---

## 9. Package Close checklist (future)

| #   | Item                                   | Evidence                 |
| --- | -------------------------------------- | ------------------------ |
| 1   | All slices a–e COMPLETE                | Slice validation reports |
| 2   | Operational walkthrough PASS           | Walkthrough document     |
| 3   | Package summary + close package report | Close artifacts          |
| 4   | Final integration verification PASS    | Integration verification |
| 5   | Security Verification Standard PASS    | Security review at Close |
| 6   | Product Owner Close Record             | PO governance act        |

---

## Explicit non-claims

- W4-E05 validation PASS — **not claimed**
- W4-E05 CLOSED — **not claimed**
- W4-E05 Planning APPROVED — **recorded**
- W4-E05 Planning Review PASS — **recorded**
- W4-E05-a inventory PASS — **recorded**
- W4-E05-b durable foundation PASS — **recorded**
- W4-E05-c restart recovery PASS — **recorded**
- W4-E05-d operational continuity PASS — **recorded**
- W4-E05-e Close Evidence PASS — **recorded**
- Wave 4 COMPLETE — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- Venue Permission Verification Complete — **not claimed**

---

**STOP.** W4-E05-e Close Evidence **PASS** (2026-08-28). Await Product Owner Package Review. Do not declare Venue Permission Verification Complete or Exchange Connectivity Complete.
