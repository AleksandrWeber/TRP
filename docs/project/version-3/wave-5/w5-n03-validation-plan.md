# W5-N03 Validation Plan

**Package:** W5-N03 Slack / Discord / Teams
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N03 · CM-13, CM-14, CM-15
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Date:** 2026-08-29
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n03-product-scope.md`](./w5-n03-product-scope.md)
**Security:** [`w5-n03-security-review.md`](./w5-n03-security-review.md)
**Umbrella:** [`w5-n03-implementation-package.md`](./w5-n03-implementation-package.md)
**Overview:** [`w5-n03-overview.md`](./w5-n03-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock webhook I/O without proving a real connect/test round-trip (or an approved recorded sandbox contract) do **not** count as Close evidence.

Do not validate Telegram transport (N01), Email SMTP (N02), Push (N04), Live Trading, Wave 5 COMPLETE, or Notification Platform Complete from N03 alone. Validate **Slack / Discord / Teams** outcomes only.

---

## 0. What Close means for W5-N03

| Gate                | Meaning                                                                       | Unlocks                           |
| ------------------- | ----------------------------------------------------------------------------- | --------------------------------- |
| **W5-N03 Closed**   | Slack / Discord / Teams foundation + real webhook evidenced; walkthrough PASS | V3-N03 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N03 alone                                                    | Requires N01…N04 + PO             |
| **Not claimed**     | Live Trading / live orders                                                    | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                                                | N01…N04 + PO                      |
| **Not claimed**     | Slack / Discord / Teams operational (beyond package scope)                    | Separate PO act if needed         |
| **Not claimed**     | Telegram / Email notifications operational                                    | W5-N01 / W5-N02 post-foundation   |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| Unit validation               | Webhook mapping; secret non-echo; workspace binding            |
| Integration validation        | Vault retrieve + webhook connect/test; cross-workspace deny    |
| UI validation                 | Honest Connected / Error / reserved labels                     |
| Regression validation         | Wave 1–4, W5-N01, W5-N02 boundaries                            |
| Product walkthrough           | Slack / Discord / Teams Walkthrough executed in product        |
| Architecture validation       | No second engine; adapter extension only; PC-06 preserved      |
| Security validation           | Verification Standard + isolation + authz + SSRF + fail closed |
| Package acceptance validation | Acceptance criteria table; Close checklist                     |

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

| Area                   | Must prove                                     |
| ---------------------- | ---------------------------------------------- |
| Delivery integrity     | Connected/Delivering requires webhook evidence |
| Reserved honesty       | Reserved-inactive not presented as Connected   |
| Secret non-echo        | Responses, logs, errors never include secrets  |
| Workspace binding      | Missing/wrong workspace fails closed           |
| Provider error mapping | Webhook failures map to honest Error labels    |
| No capital side effect | Webhook test never places live orders          |

---

## 3. Integration validation

| Area                               | Must prove                                         |
| ---------------------------------- | -------------------------------------------------- |
| Vault retrieve + webhook connect   | Real handshake or approved sandbox                 |
| Vault retrieve + webhook test send | Verifiable test message received                   |
| Cross-workspace deny               | A cannot use B credentials or state                |
| PC-06 routing to webhook transport | Routed alert reaches active transport when enabled |
| Restart recovery                   | W5-N03-b/c anchors hydrate after restart           |
| Operational continuity             | Platform Readiness projection honest               |

---

## 4. UI validation

| Area             | Must prove                                      |
| ---------------- | ----------------------------------------------- |
| Connected label  | Only after real webhook connect                 |
| Delivering label | Only after real webhook send round-trip         |
| Error            | Webhook failures visible                        |
| Reserved         | Unshipped state shows honest “Not offered”      |
| No Live Trading  | UI never implies live capital from webhook test |

---

## 5. Regression validation

| Area                | Must prove                            |
| ------------------- | ------------------------------------- |
| Wave 1–3 boundaries | No redesign of closed waves           |
| Wave 4 boundaries   | Exchange Adapter untouched            |
| W5-N01 boundaries   | No reopen; Telegram foundation intact |
| W5-N02 boundaries   | No reopen; Email foundation intact    |
| PC-06 routing       | Routing SoT unchanged                 |

---

## 6. Architecture validation

| Area                   | Must prove                                         |
| ---------------------- | -------------------------------------------------- |
| No second engine       | Notification Delivery adapter extension only       |
| No duplicate subsystem | Single notification delivery engine                |
| No duplicate SoT       | PC-06 routing unchanged                            |
| No ownership drift     | Vault / notification-delivery / Exchange unchanged |
| No Master Plan change  | V3-N03 consumed not revised                        |

---

## 7. Per-slice validation intent (planning)

| Slice    | Key validation intent                                            |
| -------- | ---------------------------------------------------------------- |
| W5-N03-a | Inventory complete; SURVIVE/EPHEMERAL; honesty rules frozen      |
| W5-N03-b | Durable anchors on notification-delivery owner                   |
| W5-N03-c | Restart hydrate of anchors                                       |
| W5-N03-d | Operational continuity / Platform Readiness projection           |
| W5-N03-e | Close Evidence; Final Integration Verification; walkthrough PASS |

---

## 8. Package Close checklist (post-implementation)

| Item                                         | Required |
| -------------------------------------------- | -------- |
| All slices a–e Implementation Reports        | PASS     |
| Architecture Reviews                         | PASS     |
| Security Reviews                             | PASS     |
| Product Reviews                              | PASS     |
| Validation Reports                           | PASS     |
| Final Package Integration Verification       | PASS     |
| Operational Walkthrough                      | PASS     |
| Regression suite (lint/typecheck/test/build) | PASS     |
| git diff --check                             | PASS     |
| Product Owner Close Record                   | PO act   |

---

## Planning open validation (this act)

| Layer                 | Result   | Evidence                       |
| --------------------- | -------- | ------------------------------ |
| Documents created     | **PASS** | w5-n03 planning package files  |
| Master Plan alignment | **PASS** | V3-N03 · CM-13/14/15 mapped    |
| Architecture check    | **PASS** | No ownership drift in planning |
| Regression suite      | Pending  | Run after docs commit          |
| git diff --check      | Pending  | Run after docs commit          |

---

## Explicit non-claims

- W5-N03 Closed — **not claimed**
- Webhook validation PASS at Close — **not claimed**
- Slack / Discord / Teams operational — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- W5-N03-a opened — **not claimed**

---

**STOP.** W5-N03 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N03-a. Do not begin implementation.
