# W4-E02 Validation Plan

**Package:** W4-E02 Bybit Real I/O
**Wave:** 4 — Exchange Connectivity
**Master Plan / Roadmap:** V3-E02 · CM-08
**Status:** Planning **OPEN**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Date:** 2026-08-28
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w4-e02-product-scope.md`](./w4-e02-product-scope.md)
**Security:** [`w4-e02-security-review.md`](./w4-e02-security-review.md)
**Umbrella:** [`w4-e02-implementation-package.md`](./w4-e02-implementation-package.md)
**Overview:** [`w4-e02-overview.md`](./w4-e02-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock vendor I/O without proving a real connect/test round-trip (or an approved recorded sandbox contract) do **not** count as Close evidence.

Do not validate OKX/Kraken (E03–E04), venue permission verification product (E05), Live Trading, Wave 5 transports, or Wave 4 COMPLETE. Validate **Bybit Real I/O** outcomes only.

### Slice progress

| Slice    | Name                                             | Validation record                                                                 |
| -------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| W4-E02-a | Bybit Inventory & Exchange Connectivity Baseline | [`w4-e02-a-validation-report.md`](./w4-e02-a-validation-report.md) — **COMPLETE** |
| W4-E02-b | Durable Bybit Exchange Connectivity Foundation   | _Not started_                                                                     |
| W4-E02-c | Bybit Restart Recovery Foundation                | _Not started_                                                                     |
| W4-E02-d | Bybit Operational Continuity Foundation          | _Not started_                                                                     |
| W4-E02-e | Package Close evidence                           | _Not started_                                                                     |

---

## 0. What Close means for W4-E02

| Gate                | Meaning                                             | Unlocks                           |
| ------------------- | --------------------------------------------------- | --------------------------------- |
| **W4-E02 Closed**   | Bybit real I/O outcomes evidenced; walkthrough PASS | CM-08 advanced for package scope  |
| **Wave 4 COMPLETE** | Not claimed from E02 alone                          | Requires E01…E05 + PO declaration |
| **Not claimed**     | Live Trading / live orders                          | Wave 6 + ADR                      |
| **Not claimed**     | OKX / Kraken connected                              | E03–E04                           |
| **Not claimed**     | Venue permission verification Complete              | E05                               |
| **Not claimed**     | Exchange Connectivity Complete                      | E01…E05 + PO                      |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| Unit validation               | Status mapping; secret non-echo; workspace binding                |
| Integration validation        | Vault retrieve + adapter round-trip; cross-workspace deny         |
| UI validation                 | Honest Connected / Error / Expired / permission labels            |
| Regression validation         | Wave 1–3 and W4-E01 security and product boundaries               |
| Product walkthrough           | Bybit Real I/O Walkthrough executed in product                    |
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

| Area                    | Must prove                                       |
| ----------------------- | ------------------------------------------------ |
| Status integrity        | Connected requires round-trip evidence           |
| Secret non-echo         | Responses, logs, errors never include secrets    |
| Workspace binding       | Missing/wrong workspace fails closed             |
| Vendor error mapping    | Expired / permission errors map to honest labels |
| No capital side effect  | Connect/test never places live orders            |
| No engine clone helpers | Single factory extension pattern                 |

---

## 3. Integration validation

| Area                         | Must prove                                     |
| ---------------------------- | ---------------------------------------------- |
| Vault retrieve + adapter I/O | Credentials flow Vault → adapter → vendor only |
| Real round-trip              | Connect/test hits Bybit (or approved sandbox)  |
| Cross-workspace deny         | Workspace A cannot use B credentials           |
| Authz deny                   | Unauthorized role cannot connect/test          |
| Wave 2 Connections untouched | Facade not redesigned                          |
| W4-E01 foundation untouched  | No duplicate persistence owner                 |
| Order path untouched         | No live order via connect path                 |

---

## 4. UI validation

| Area               | Must prove                                       |
| ------------------ | ------------------------------------------------ |
| Connected label    | Only after successful test                       |
| Error / Expired    | Honest vendor-visible messaging where possible   |
| No live trading UI | No live capital claims from E02                  |
| Disconnect         | Operator can disconnect; status updates honestly |

---

## 5. Architecture validation

| Check                   | Must prove                       |
| ----------------------- | -------------------------------- |
| No engine clone         | Factory extension only           |
| Exchange Scope boundary | RC-27 isolation preserved        |
| No second order path    | Canonical path unchanged         |
| No ownership drift      | Vault / Adapter / Cluster owners |
| W4-E01 consumed         | Extend; do not redesign E01      |

---

## 6. Security validation

| Check                 | Must prove                    |
| --------------------- | ----------------------------- |
| Verification Standard | All rows evidenced at Close   |
| SSRF                  | Bybit vendor allowlist only   |
| Fail closed           | Missing auth/workspace denies |
| Plaintext exposure    | Zero tolerance                |

---

## 7. Product walkthrough

Execute **Bybit Real I/O Walkthrough** from [`w4-e02-implementation-package.md`](./w4-e02-implementation-package.md) at Product Review and Close.

---

## 8. Package acceptance validation

All acceptance criteria in [`w4-e02-product-scope.md`](./w4-e02-product-scope.md) must PASS at Close.

Copy and complete [`../version-3-product-checklist.md`](../version-3-product-checklist.md) at Close.

---

## Explicit non-claims

- W4-E02 validation PASS — **not claimed** (planning only)
- W4-E02 CLOSED — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- Bybit Connected — **not claimed**
- Planning Review PASS / APPROVED — **not claimed**

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review. Do not open W4-E02-a.
