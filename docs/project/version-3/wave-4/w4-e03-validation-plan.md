# W4-E03 Validation Plan

**Package:** W4-E03 OKX Real I/O
**Wave:** 4 — Exchange Connectivity
**Master Plan / Roadmap:** V3-E03 · CM-09
**Status:** W4-E03-b durable persistence **COMPLETE** (local). Awaiting Product Owner review. Not OKX Connected. Slices c…e not opened.
**Date:** 2026-08-28
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w4-e03-product-scope.md`](./w4-e03-product-scope.md)
**Security:** [`w4-e03-security-review.md`](./w4-e03-security-review.md)
**Umbrella:** [`w4-e03-implementation-package.md`](./w4-e03-implementation-package.md)
**Overview:** [`w4-e03-overview.md`](./w4-e03-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock vendor I/O without proving a real connect/test round-trip (or an approved recorded sandbox contract) do **not** count as Close evidence.

Do not validate Kraken (E04), venue permission verification product (E05), Live Trading, Wave 5 transports, or Wave 4 COMPLETE. Validate **OKX Real I/O** outcomes only.

### Slice progress (planning)

| Slice    | Name                                           | Validation record                                                  |
| -------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| W4-E03-a | OKX Inventory & Exchange Connectivity Baseline | [`w4-e03-a-validation-report.md`](./w4-e03-a-validation-report.md) |
| W4-E03-b | Durable OKX Exchange Connectivity Foundation   | [`w4-e03-b-validation-report.md`](./w4-e03-b-validation-report.md) |
| W4-E03-c | OKX Restart Recovery Foundation                | **Not opened**                                                     |
| W4-E03-d | OKX Operational Continuity Foundation          | **Not opened**                                                     |
| W4-E03-e | Package Close evidence                         | **Not opened**                                                     |

---

## 0. What Close means for W4-E03

| Gate                | Meaning                                           | Unlocks                           |
| ------------------- | ------------------------------------------------- | --------------------------------- |
| **W4-E03 Closed**   | OKX real I/O outcomes evidenced; walkthrough PASS | CM-09 advanced for package scope  |
| **Wave 4 COMPLETE** | Not claimed from E03 alone                        | Requires E01…E05 + PO declaration |
| **Not claimed**     | Live Trading / live orders                        | Wave 6 + ADR                      |
| **Not claimed**     | Kraken connected                                  | E04                               |
| **Not claimed**     | Venue permission verification Complete            | E05                               |
| **Not claimed**     | Exchange Connectivity Complete                    | E01…E05 + PO                      |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| Unit validation               | Status mapping; secret non-echo; workspace binding                |
| Integration validation        | Vault retrieve + adapter round-trip; cross-workspace deny         |
| UI validation                 | Honest Connected / Error / Expired / permission labels            |
| Regression validation         | Wave 1–3 and W4-E01/E02 security and product boundaries           |
| Product walkthrough           | OKX Real I/O Walkthrough executed in product                      |
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

| Area                    | Must prove                                        |
| ----------------------- | ------------------------------------------------- |
| Status integrity        | Connected requires round-trip evidence            |
| Secret non-echo         | Responses, logs, errors never include secrets     |
| Workspace binding       | Missing/wrong workspace fails closed              |
| Vendor error mapping    | Expired / permission errors map to honest labels  |
| No capital side effect  | Connect/test never places live orders             |
| Passphrase completeness | Incomplete OKX material refused at Vault boundary |

---

## 3. Integration validation

| Area                 | Must prove                                       |
| -------------------- | ------------------------------------------------ |
| Vault retrieve       | Adapter uses Vault material only for signing     |
| Real round-trip      | Connect/test hits OKX vendor or approved sandbox |
| Cross-workspace deny | Foreign workspace credentials unusable           |
| Disconnect           | Disconnect stops subsequent round-trips          |
| Audit attribution    | Required connect outcomes emitted                |

---

## 4. UI validation

| Area                 | Must prove                             |
| -------------------- | -------------------------------------- |
| Connected honesty    | Connected only after successful test   |
| Error visibility     | Vendor/network failures visible        |
| Expired / permission | Honest labels when vendor reports      |
| No live trading      | No Live Trading / place order controls |
| Paper default        | Product does not imply live capital    |

---

## 5. Regression validation

| Area                    | Must prove                                |
| ----------------------- | ----------------------------------------- |
| Wave 1–3 boundaries     | No Auth/Vault/Isolation redesign          |
| W4-E01/E02 boundaries   | No duplicate persistence owner            |
| Exchange Scope          | RC-27 isolation preserved                 |
| Canonical Order Path    | Unchanged                                 |
| Existing venue packages | Binance/Bybit foundation regressions pass |

---

## 6. Architecture validation

| Area              | Must prove                                    |
| ----------------- | --------------------------------------------- |
| Factory extension | No engine clone per venue                     |
| Ownership         | exchange-adapter sole owner for new artifacts |
| No duplicate SoT  | No second order path                          |
| Master Plan       | Unchanged                                     |

---

## 7. Security validation

Copy and complete [`../version-3-security-checklist.md`](../version-3-security-checklist.md) at Close.

Every row of [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) must PASS at Close.

---

## 8. Package acceptance validation

All acceptance criteria in [`w4-e03-product-scope.md`](./w4-e03-product-scope.md) must PASS at Close.

Copy and complete [`../version-3-product-checklist.md`](../version-3-product-checklist.md) at Close.

---

## Explicit non-claims

- W4-E03 validation PASS — **not claimed** (planning only)
- W4-E03 CLOSED — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- OKX Connected — **not claimed**
- Planning Review PASS / APPROVED — **not claimed**

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review. Do not open W4-E03-a.
