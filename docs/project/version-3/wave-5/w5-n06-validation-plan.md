# W5-N06 Validation Plan

**Package:** W5-N06 Notification Platform Delivery Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N06 · CM-18
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Date:** 2026-08-29
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n06-product-scope.md`](./w5-n06-product-scope.md)
**Security:** [`w5-n06-security-review.md`](./w5-n06-security-review.md)
**Umbrella:** [`w5-n06-implementation-package.md`](./w5-n06-implementation-package.md)
**Overview:** [`w5-n06-overview.md`](./w5-n06-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock platform delivery foundation without proving cross-channel foundation coherence do **not** count as Close evidence.

Do not validate per-channel production transport I/O (N01…N04 transport scope), Live Trading, Wave 5 COMPLETE, or Notification Platform Complete from N06 alone. Validate **Notification Platform Delivery Foundation** outcomes only.

---

## 0. What Close means for W5-N06

| Gate                | Meaning                                                  | Unlocks                           |
| ------------------- | -------------------------------------------------------- | --------------------------------- |
| **W5-N06 Closed**   | Platform delivery foundation evidenced; walkthrough PASS | V3-N06 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N06 alone                               | Requires N01…N06 Close + PO       |
| **Not claimed**     | Live Trading / live orders                               | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                           | N01…N06 Close + PO                |
| **Not claimed**     | Production transports operational                        | TD-049 / TD-050                   |
| **Not claimed**     | Per-channel notifications operational                    | N01…N04 transport scope           |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                                |
| ----------------------------- | ---------------------------------------------------------------------- |
| Unit validation               | Platform delivery foundation mapping; workspace binding; honesty rules |
| Integration validation        | Cross-channel foundation consumption; cross-workspace deny             |
| UI validation                 | Honest Platform Ready / reserved / per-channel labels                  |
| Regression validation         | Wave 1–4, W5-N01…N05 boundaries                                        |
| Product walkthrough           | Platform Delivery Foundation Walkthrough executed in product           |
| Architecture validation       | No second engine; delivery foundation extension only; PC-06 preserved  |
| Security validation           | Verification Standard + isolation + authz + fail closed                |
| Package acceptance validation | Acceptance criteria table; Close checklist                             |

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

| Area                          | Must prove                                             |
| ----------------------------- | ------------------------------------------------------ |
| Delivery foundation integrity | Platform Ready requires delivery foundation evidence   |
| Per-channel honesty           | Reserved-inactive not presented as Connected           |
| Integration honesty           | N05 integration truth not overridden by delivery layer |
| Secret non-echo               | Responses, logs, errors never include secrets          |
| Workspace binding             | Missing/wrong workspace fails closed                   |
| Cross-channel isolation       | Channel A state cannot leak to channel B               |
| No capital side effect        | Delivery foundation never places live orders           |

---

## 3. Integration validation

| Area                           | Must prove                                                   |
| ------------------------------ | ------------------------------------------------------------ |
| N01…N05 foundation consumption | Per-channel and integration anchors consumed; not redesigned |
| Cross-workspace deny           | A cannot use B delivery state                                |
| PC-06 routing consumption      | Routing SoT unchanged; delivery foundation consumes only     |
| Restart recovery               | W5-N06-b/c delivery anchors hydrate after restart            |
| Operational continuity         | Platform Readiness projection honest                         |
| Vault boundary                 | Delivery foundation retrieves; does not store credentials    |

---

## 4. UI validation

| Area               | Must prove                                             |
| ------------------ | ------------------------------------------------------ |
| Platform Ready     | Only after delivery foundation evidence                |
| Per-channel labels | Honest per N01…N04 channel truth                       |
| Reserved           | Unshipped channels show honest “Not offered”           |
| No Live Trading    | UI never implies live capital from delivery foundation |

---

## 5. Regression validation

| Area                | Must prove                               |
| ------------------- | ---------------------------------------- |
| Wave 1–3 boundaries | No redesign of closed waves              |
| Wave 4 boundaries   | Exchange Adapter untouched               |
| W5-N01 boundaries   | No reopen; Telegram foundation intact    |
| W5-N02 boundaries   | No reopen; Email foundation intact       |
| W5-N03 boundaries   | No reopen; team chat foundation intact   |
| W5-N04 boundaries   | No reopen; Push foundation intact        |
| W5-N05 boundaries   | No reopen; integration foundation intact |
| AI Gateway          | OpenAI path untouched                    |
| PC-06 routing       | Routing SoT unchanged                    |

---

## 6. Architecture validation

| Area                   | Must prove                                               |
| ---------------------- | -------------------------------------------------------- |
| No second engine       | Notification Delivery delivery foundation extension only |
| No duplicate subsystem | Single notification delivery engine                      |
| No duplicate SoT       | PC-06 routing unchanged                                  |
| No ownership drift     | Vault / notification-delivery / Exchange unchanged       |
| No Master Plan change  | V3-N06 consumed not revised                              |

---

## 7. Per-slice validation intent (planning)

| Slice    | Key validation intent                                                        |
| -------- | ---------------------------------------------------------------------------- |
| W5-N06-a | Cross-channel delivery inventory complete; SURVIVE/EPHEMERAL; honesty frozen |
| W5-N06-b | Durable platform delivery anchors on notification-delivery owner             |
| W5-N06-c | Restart hydrate of delivery anchors                                          |
| W5-N06-d | Operational continuity / Platform Readiness projection                       |
| W5-N06-e | Close Evidence; Final Integration Verification; walkthrough PASS             |

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

| Layer                 | Result   | Evidence                        |
| --------------------- | -------- | ------------------------------- |
| Documents created     | **PASS** | w5-n06 planning package files   |
| Master Plan alignment | **PASS** | V3-N06 · CM-18 mapped (PO auth) |
| Architecture check    | **PASS** | No ownership drift in planning  |
| Regression suite      | Pending  | Run after docs commit           |
| git diff --check      | Pending  | Run after docs commit           |

---

## Explicit non-claims

- W5-N06 Closed — **not claimed**
- Platform delivery foundation validation PASS at Close — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-18 implemented — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- W5-N06-a opened — **not claimed**
- W5-N06 Planning Review completed — **not claimed**
- W5-N06 Planning APPROVED — **not claimed**

---

**STOP.** W5-N06 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N06-a. Do not begin implementation.
