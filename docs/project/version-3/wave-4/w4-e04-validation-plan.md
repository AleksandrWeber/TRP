# W4-E04 Validation Plan

**Package:** W4-E04 Kraken Adapter (factory)
**Wave:** 4 — Exchange Connectivity
**Master Plan / Roadmap:** V3-E04 · CM-10
**Status:** Planning **OPEN**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Date:** 2026-08-28
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w4-e04-product-scope.md`](./w4-e04-product-scope.md)
**Security:** [`w4-e04-security-review.md`](./w4-e04-security-review.md)
**Umbrella:** [`w4-e04-implementation-package.md`](./w4-e04-implementation-package.md)
**Overview:** [`w4-e04-overview.md`](./w4-e04-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock vendor I/O without proving a real connect/test round-trip (or an approved recorded sandbox contract) do **not** count as Close evidence when Kraken is offered.

Do not validate venue permission verification product (E05), Live Trading, Wave 5 transports, or Wave 4 COMPLETE. Validate **Kraken Adapter (factory)** outcomes only.

---

## 0. What Close means for W4-E04

| Gate                | Meaning                                                                  | Unlocks                           |
| ------------------- | ------------------------------------------------------------------------ | --------------------------------- |
| **W4-E04 Closed**   | Kraken factory adapter or honest not-offered evidenced; walkthrough PASS | CM-10 advanced for package scope  |
| **Wave 4 COMPLETE** | Not claimed from E04 alone                                               | Requires E01…E05 + PO declaration |
| **Not claimed**     | Live Trading / live orders                                               | Wave 6 + ADR                      |
| **Not claimed**     | Venue permission verification Complete                                   | E05                               |
| **Not claimed**     | Exchange Connectivity Complete                                           | E01…E05 + PO                      |
| **Not claimed**     | Kraken Connected (when not offered)                                      | Honest not-offered only           |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| Unit validation               | Status mapping; secret non-echo; workspace binding                   |
| Integration validation        | Vault retrieve + adapter round-trip; cross-workspace deny            |
| UI validation                 | Honest Connected / Error / Expired / permission / not-offered labels |
| Regression validation         | Wave 1–3 and W4-E01/E02/E03 security and product boundaries          |
| Product walkthrough           | Kraken Adapter (factory) Walkthrough executed in product             |
| Architecture validation       | No engine clone; factory extension only; Exchange Scope preserved    |
| Security validation           | Verification Standard + isolation + authz + SSRF + fail closed       |
| Package acceptance validation | Acceptance criteria table; Close checklist                           |

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
| Status integrity       | Connected requires round-trip evidence (offered) |
| Not-offered honesty    | Honest label when adapter not delivered          |
| Secret non-echo        | Responses, logs, errors never include secrets    |
| Workspace binding      | Missing/wrong workspace fails closed             |
| Vendor error mapping   | Expired / permission errors map to honest labels |
| No capital side effect | Connect/test never places live orders            |

---

## 3. Integration validation

| Area                         | Must prove                                    |
| ---------------------------- | --------------------------------------------- |
| Vault retrieve + adapter I/O | Real round-trip or approved sandbox (offered) |
| Cross-workspace deny         | A cannot use B credentials                    |
| Factory registration         | Kraken registered through factory (offered)   |
| Restart recovery             | W4-E04-b/c anchors hydrate after restart      |
| Operational continuity       | Platform Readiness projection honest          |

---

## 4. UI validation

| Area              | Must prove                                 |
| ----------------- | ------------------------------------------ |
| Connected label   | Only after real round-trip (offered)       |
| Not-offered label | Clear when adapter not delivered           |
| Error / Expired   | Vendor-visible failures shown (offered)    |
| No Live Trading   | UI never implies live capital from connect |

---

## 5. Regression validation

| Area                      | Must prove                                |
| ------------------------- | ----------------------------------------- |
| Wave 1–3 boundaries       | No redesign of closed waves               |
| W4-E01/E02/E03 boundaries | No reopen; no duplicate persistence owner |
| Exchange Scope            | Isolation boundary unchanged              |
| Canonical Order Path      | Unchanged                                 |

---

## 6. Architecture validation

| Area                   | Must prove                                          |
| ---------------------- | --------------------------------------------------- |
| No engine clone        | Factory extension only                              |
| No duplicate subsystem | Single exchange connectivity engine                 |
| No duplicate SoT       | No second order path                                |
| No ownership drift     | Vault / Adapter / Cluster / Risk / Ledger unchanged |
| No Master Plan change  | V3-E04 consumed not revised                         |

---

## 7. Security validation

| Area                  | Must prove                       |
| --------------------- | -------------------------------- |
| Verification Standard | Required rows PASS at Close      |
| Workspace isolation   | Cross-workspace deny evidenced   |
| Authorization         | Unauthorized role deny evidenced |
| SSRF                  | Kraken vendor endpoints only     |
| Fail closed           | Missing context denies           |

---

## 8. Slice validation records (planning — not created)

| Slice    | Name                                              | Validation record                                                                          |
| -------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| W4-E04-a | Kraken Inventory & Exchange Connectivity Baseline | [`w4-e04-a-validation-report.md`](./w4-e04-a-validation-report.md) — **PASS** (2026-08-28) |
| W4-E04-b | Durable Kraken Exchange Connectivity Foundation   | **Not created**                                                                            |
| W4-E04-c | Kraken Restart Recovery Foundation                | **Not created**                                                                            |
| W4-E04-d | Kraken Operational Continuity Foundation          | **Not created**                                                                            |
| W4-E04-e | Package Close evidence                            | **Not created**                                                                            |

**Slices not opened.** Validation records created only after slice authorization.

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

- W4-E04 validation PASS — **not claimed** (planning only)
- W4-E04 CLOSED — **not claimed**
- W4-E04 Planning APPROVED — **recorded**
- W4-E04-a inventory PASS — **recorded** (local; uncommitted)
- W4-E04-a customer-visible feature — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Kraken Connected — **not claimed**
- Exchange Connectivity Complete — **not claimed**

---

**STOP.** W4-E04-a inventory validation **PASS** (local). Await Product Owner review before W4-E04-b. Do not declare Kraken Connected.
