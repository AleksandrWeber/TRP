# W5-N09 Validation Plan

**Package:** W5-N09 Notification Platform Workers Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N09 · CM-20
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Date:** 2026-08-29
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n09-product-scope.md`](./w5-n09-product-scope.md)
**Security:** [`w5-n09-security-review.md`](./w5-n09-security-review.md)
**Umbrella:** [`w5-n09-implementation-package.md`](./w5-n09-implementation-package.md)
**Overview:** [`w5-n09-overview.md`](./w5-n09-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock platform workers foundation without proving cross-channel foundation coherence do **not** count as Close evidence.

Do not validate per-channel production transport I/O (N01…N04 transport scope), worker runtime execution (orchestration/retry/scheduler), Live Trading, Wave 5 COMPLETE, or Notification Platform Complete from N09 alone. Validate **Notification Platform Workers Foundation** outcomes only.

---

## 0. What Close means for W5-N09

| Gate                | Meaning                                                      | Unlocks                           |
| ------------------- | ------------------------------------------------------------ | --------------------------------- |
| **W5-N09 Closed**   | Platform workers foundation evidenced; walkthrough PASS      | V3-N09 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N09 alone                                   | Requires N01…N09 Close + PO       |
| **Not claimed**     | Live Trading / live orders                                   | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                               | N01…N09 Close + PO                |
| **Not claimed**     | Production transports operational                            | TD-049 / TD-050                   |
| **Not claimed**     | Per-channel notifications operational                        | N01…N04 transport scope           |
| **Not claimed**     | Worker runtime execution / orchestration / retry / scheduler | Post-foundation product scope     |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                               |
| ----------------------------- | --------------------------------------------------------------------- |
| Unit validation               | Platform workers foundation mapping; workspace binding; honesty rules |
| Integration validation        | Cross-channel foundation consumption; cross-workspace deny            |
| UI validation                 | Honest Platform Ready / reserved / per-channel labels                 |
| Regression validation         | Wave 1–4, W5-N01…N08 boundaries                                       |
| Product walkthrough           | Platform Workers Foundation Walkthrough executed in product           |
| Architecture validation       | No second engine; workers foundation extension only; PC-06 preserved  |
| Security validation           | Verification Standard + isolation + authz + fail closed               |
| Package acceptance validation | Acceptance criteria table; Close checklist                            |

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

| Area                         | Must prove                                                          |
| ---------------------------- | ------------------------------------------------------------------- |
| Workers foundation integrity | Platform Ready requires workers foundation evidence                 |
| Per-channel honesty          | Reserved-inactive not presented as Connected                        |
| Integration honesty          | N05 integration truth not overridden by workers layer               |
| Delivery honesty             | N06 delivery truth not overridden by workers layer                  |
| Dispatch honesty             | N07 dispatch truth not overridden by workers layer                  |
| Queue honesty                | N08 queue truth not overridden by workers layer                     |
| Secret non-echo              | Responses, logs, errors never include secrets                       |
| Workspace binding            | Missing/wrong workspace fails closed                                |
| Cross-channel isolation      | Channel A state cannot leak to channel B                            |
| No capital side effect       | Workers foundation never places live orders                         |
| No worker runtime execution  | Foundation ≠ worker runtime execution/orchestration/retry/scheduler |

---

## 3. Integration validation

| Area                           | Must prove                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| N01…N08 foundation consumption | Per-channel, integration, delivery, dispatch, and queue anchors consumed; not redesigned |
| Cross-workspace deny           | A cannot use B workers state                                                             |
| PC-06 routing consumption      | Routing SoT unchanged; workers foundation consumes only                                  |
| Restart recovery               | W5-N09-b/c workers anchors hydrate after restart                                         |
| Operational continuity         | Platform Readiness projection honest                                                     |
| Vault boundary                 | Workers foundation retrieves; does not store credentials                                 |
| W3-O02 queue substrate         | Consumed; queue owner unchanged                                                          |

---

## 4. UI validation

| Area                        | Must prove                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Platform Ready              | Only after workers foundation evidence                                              |
| Per-channel labels          | Honest per N01…N04 channel truth                                                    |
| Reserved                    | Unshipped channels show honest “Not offered”                                        |
| No Live Trading             | UI never implies live capital from workers foundation                               |
| No worker runtime execution | UI never implies worker runtime execution/orchestration/retry/scheduler operational |

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
| W5-N06 boundaries   | No reopen; delivery foundation intact    |
| W5-N07 boundaries   | No reopen; dispatch foundation intact    |
| W5-N08 boundaries   | No reopen; queue foundation intact       |
| AI Gateway          | Anthropic path untouched                 |
| PC-06 routing       | Routing SoT unchanged                    |

---

## 6. Architecture validation

| Area                        | Must prove                                                        |
| --------------------------- | ----------------------------------------------------------------- |
| No second engine            | Notification Delivery workers foundation extension only           |
| No duplicate subsystem      | Single notification delivery engine                               |
| No duplicate SoT            | PC-06 routing unchanged                                           |
| No ownership drift          | Vault / notification-delivery / Exchange unchanged                |
| No Master Plan change       | V3-N09 consumed not revised                                       |
| No worker runtime execution | Foundation slices do not implement worker runtime execution/retry |

---

## 7. Per-slice validation intent (planning)

| Slice    | Key validation intent                                                       |
| -------- | --------------------------------------------------------------------------- |
| W5-N09-a | Cross-channel workers inventory complete; SURVIVE/EPHEMERAL; honesty frozen |
| W5-N09-b | Durable platform workers anchors on notification-delivery owner             |
| W5-N09-c | Restart hydrate of workers anchors                                          |
| W5-N09-d | Operational continuity / Platform Readiness projection                      |
| W5-N09-e | Close Evidence; Final Integration Verification; walkthrough PASS            |

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
| Documents created     | **PASS** | w5-n09 planning package files   |
| Master Plan alignment | **PASS** | V3-N09 · CM-20 mapped (PO auth) |
| Architecture check    | **PASS** | No ownership drift in planning  |
| Regression suite      | Pending  | Run after docs commit           |
| git diff --check      | Pending  | Run after docs commit           |

---

## Explicit non-claims

- W5-N09 Closed — **not claimed**
- Platform workers foundation validation PASS at Close — **not claimed**
- Notification Platform Workers implemented — **not claimed**
- Worker runtime execution implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-20 implemented — **not claimed**
- Queue orchestration implemented — **not claimed**
- Retry implemented — **not claimed**
- Scheduler implemented — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- W5-N09-a opened — **not claimed**
- W5-N09 Planning Review completed — **not claimed**
- W5-N09 Planning APPROVED — **not claimed**

---

**STOP.** W5-N09 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N09-a. Do not begin implementation.
