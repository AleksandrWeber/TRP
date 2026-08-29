# W5-N04 Validation Plan

**Package:** W5-N04 Push
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N04 · CM-16
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Date:** 2026-08-29
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n04-product-scope.md`](./w5-n04-product-scope.md)
**Security:** [`w5-n04-security-review.md`](./w5-n04-security-review.md)
**Umbrella:** [`w5-n04-implementation-package.md`](./w5-n04-implementation-package.md)
**Overview:** [`w5-n04-overview.md`](./w5-n04-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock push I/O without proving a real connect/test round-trip (or an approved recorded sandbox contract) do **not** count as Close evidence.

Do not validate Telegram transport (N01), Email SMTP (N02), Slack/Discord/Teams (N03), Live Trading, Wave 5 COMPLETE, or Notification Platform Complete from N04 alone. Validate **Push** outcomes only.

---

## 0. What Close means for W5-N04

| Gate                | Meaning                                                           | Unlocks                           |
| ------------------- | ----------------------------------------------------------------- | --------------------------------- |
| **W5-N04 Closed**   | Push foundation + real push transport evidenced; walkthrough PASS | V3-N04 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N04 alone                                        | Requires N01…N04 Close + PO       |
| **Not claimed**     | Live Trading / live orders                                        | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                                    | N01…N04 Close + PO                |
| **Not claimed**     | Push operational (beyond package scope)                           | Separate PO act if needed         |
| **Not claimed**     | Telegram / Email / Slack notifications operational                | W5-N01…N03 post-foundation        |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| Unit validation               | Push mapping; secret non-echo; workspace binding               |
| Integration validation        | Vault retrieve + push connect/test; cross-workspace deny       |
| UI validation                 | Honest Connected / Error / reserved labels                     |
| Regression validation         | Wave 1–4, W5-N01, W5-N02, W5-N03 boundaries                    |
| Product walkthrough           | Push Walkthrough executed in product                           |
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

| Area                   | Must prove                                    |
| ---------------------- | --------------------------------------------- |
| Delivery integrity     | Connected/Delivering requires push evidence   |
| Reserved honesty       | Reserved-inactive not presented as Connected  |
| Secret non-echo        | Responses, logs, errors never include secrets |
| Workspace binding      | Missing/wrong workspace fails closed          |
| Device token binding   | Device tokens scoped to workspace             |
| Provider error mapping | Push failures map to honest Error labels      |
| No capital side effect | Push test never places live orders            |

---

## 3. Integration validation

| Area                             | Must prove                                         |
| -------------------------------- | -------------------------------------------------- |
| Vault retrieve + push connect    | Real handshake or approved sandbox                 |
| Vault retrieve + push test send  | Verifiable test push received on device            |
| Cross-workspace deny             | A cannot use B credentials, tokens, or state       |
| PC-06 routing to push transport  | Routed alert reaches active transport when enabled |
| Restart recovery                 | W5-N04-b/c anchors hydrate after restart           |
| Operational continuity           | Platform Readiness projection honest               |
| Device registration / revocation | Tokens registered and revoked workspace-scoped     |

---

## 4. UI validation

| Area             | Must prove                                   |
| ---------------- | -------------------------------------------- |
| Connected label  | Only after real push connect                 |
| Delivering label | Only after real push send round-trip         |
| Error            | Push provider failures visible               |
| Reserved         | Unshipped state shows honest “Not offered”   |
| No Live Trading  | UI never implies live capital from push test |

---

## 5. Regression validation

| Area                | Must prove                             |
| ------------------- | -------------------------------------- |
| Wave 1–3 boundaries | No redesign of closed waves            |
| Wave 4 boundaries   | Exchange Adapter untouched             |
| W5-N01 boundaries   | No reopen; Telegram foundation intact  |
| W5-N02 boundaries   | No reopen; Email foundation intact     |
| W5-N03 boundaries   | No reopen; team chat foundation intact |
| PC-06 routing       | Routing SoT unchanged                  |

---

## 6. Architecture validation

| Area                   | Must prove                                         |
| ---------------------- | -------------------------------------------------- |
| No second engine       | Notification Delivery adapter extension only       |
| No duplicate subsystem | Single notification delivery engine                |
| No duplicate SoT       | PC-06 routing unchanged                            |
| No ownership drift     | Vault / notification-delivery / Exchange unchanged |
| No Master Plan change  | V3-N04 consumed not revised                        |

---

## 7. Per-slice validation intent (planning)

| Slice    | Key validation intent                                            |
| -------- | ---------------------------------------------------------------- |
| W5-N04-a | Inventory complete; SURVIVE/EPHEMERAL; honesty rules frozen      |
| W5-N04-b | Durable anchors on notification-delivery owner                   |
| W5-N04-c | Restart hydrate of anchors                                       |
| W5-N04-d | Operational continuity / Platform Readiness projection           |
| W5-N04-e | Close Evidence; Final Integration Verification; walkthrough PASS |

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
| Documents created     | **PASS** | w5-n04 planning package files  |
| Master Plan alignment | **PASS** | V3-N04 · CM-16 mapped          |
| Architecture check    | **PASS** | No ownership drift in planning |
| Regression suite      | Pending  | Run after docs commit          |
| git diff --check      | Pending  | Run after docs commit          |

---

## Explicit non-claims

- W5-N04 Closed — **not claimed**
- Push validation PASS at Close — **not claimed**
- Push operational — **not claimed**
- CM-16 implemented — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- W5-N04-a opened — **not claimed**
- W5-N04 Planning Review completed — **not claimed**
- W5-N04 Planning APPROVED — **not claimed**

---

**STOP.** W5-N04 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N04-a. Do not begin implementation.
