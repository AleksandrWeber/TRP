# W5-N15 Validation Plan

**Package:** W5-N15 Notification Platform Telemetry Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N15 · CM-25
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Date:** 2026-09-02
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n15-product-scope.md`](./w5-n15-product-scope.md)
**Security:** [`w5-n15-security-review.md`](./w5-n15-security-review.md)
**Umbrella:** [`w5-n15-implementation-package.md`](./w5-n15-implementation-package.md)
**Overview:** [`w5-n15-overview.md`](./w5-n15-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock platform telemetry foundation without proving cross-channel foundation coherence do **not** count as Close evidence.

Do not validate per-channel production transport I/O (N01…N04 transport scope), telemetry engine/collection runtime/observability platform/scaling signals, dead-letter runtime/processing/automatic replay, retry execution, notification execution, scheduler execution, worker execution, production runtime, Live Trading, Wave 5 COMPLETE, or Notification Platform Complete from N15 alone. Validate **Notification Platform Telemetry Foundation** outcomes only.

---

## 0. What Close means for W5-N15

| Gate                | Meaning                                                                                                  | Unlocks                           |
| ------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **W5-N15 Closed**   | Platform telemetry foundation evidenced; walkthrough PASS                                                | V3-N15 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N15 alone                                                                               | Requires N01…N15 Close + PO       |
| **Not claimed**     | Live Trading / live orders                                                                               | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                                                                           | N01…N15 Close + PO                |
| **Not claimed**     | Production transports operational                                                                        | TD-049 / TD-050                   |
| **Not claimed**     | Telemetry engine / collection / observability platform / scaling runtime                                 | Post-foundation product scope     |
| **Not claimed**     | Dead-letter runtime / retry execution / notification execution / scheduler / worker / production runtime | Post-foundation product scope     |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| Unit validation               | Platform telemetry foundation mapping; workspace binding; honesty rules |
| Integration validation        | Cross-channel foundation consumption; cross-workspace deny              |
| UI validation                 | Honest Platform Ready / reserved / per-channel / Telemetry Ready labels |
| Regression validation         | Wave 1–4, W5-N01…N14 boundaries                                         |
| Product walkthrough           | Platform Telemetry Foundation Walkthrough executed in product           |
| Architecture validation       | No second engine; telemetry foundation extension only; PC-06 preserved  |
| Security validation           | Verification Standard + isolation + authz + fail closed                 |
| Package acceptance validation | Acceptance criteria table; Close checklist                              |

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

| Area                           | Must prove                                                   |
| ------------------------------ | ------------------------------------------------------------ |
| Telemetry foundation integrity | Platform Ready requires telemetry foundation evidence        |
| Per-channel honesty            | Reserved-inactive not presented as Connected                 |
| N05…N14 platform honesty       | Prior platform truth not overridden by telemetry layer       |
| Secret non-echo                | Responses, logs, errors never include secrets                |
| Workspace binding              | Missing/wrong workspace fails closed                         |
| Cross-channel isolation        | Channel A state cannot leak to channel B                     |
| No capital side effect         | Telemetry foundation never places live orders                |
| No telemetry runtime           | Foundation ≠ engine/collection/observability/scaling runtime |
| No fake Telemetry Ready        | Telemetry Ready label requires real collection round-trip    |

---

## 3. Integration validation

| Area                           | Must prove                                                             |
| ------------------------------ | ---------------------------------------------------------------------- |
| N01…N14 foundation consumption | Per-channel and platform anchors consumed; not redesigned              |
| Cross-workspace deny           | A cannot use B telemetry state                                         |
| PC-06 routing consumption      | Routing SoT unchanged; telemetry foundation consumes only              |
| Restart recovery               | W5-N15-b/c telemetry anchors hydrate after restart                     |
| Operational continuity         | Platform Readiness projection honest (`notificationPlatformTelemetry`) |
| Vault boundary                 | Telemetry foundation retrieves; does not store credentials             |
| W3-O02 queue substrate         | Consumed; queue owner unchanged                                        |
| MN-02 Observability boundary   | No duplicate observability platform                                    |

---

## 4. UI validation

| Area                    | Must prove                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| Platform Ready          | Only after telemetry foundation evidence                          |
| Per-channel labels      | Honest per N01…N04 channel truth                                  |
| Reserved                | Unshipped channels show honest “Not offered”                      |
| No Live Trading         | UI never implies live capital from telemetry foundation           |
| No telemetry runtime    | UI never implies engine/collection/observability operational      |
| No fake Telemetry Ready | UI never shows Telemetry Ready without real collection round-trip |

---

## 5. Regression validation

| Area                  | Must prove                          |
| --------------------- | ----------------------------------- |
| Wave 1–3 boundaries   | No redesign of closed waves         |
| Wave 4 boundaries     | Exchange Adapter untouched          |
| W5-N01…N14 boundaries | No reopen; prior foundations intact |
| AI Gateway            | Anthropic path untouched            |
| MN-02 Observability   | Unchanged                           |
| PC-06 routing         | Routing SoT unchanged               |

---

## 6. Architecture validation

| Area                   | Must prove                                                           |
| ---------------------- | -------------------------------------------------------------------- |
| No second engine       | Notification Delivery telemetry foundation extension only            |
| No duplicate subsystem | Single notification delivery engine                                  |
| No duplicate SoT       | PC-06 routing unchanged                                              |
| No ownership drift     | Vault / notification-delivery / Exchange unchanged                   |
| No Master Plan change  | V3-N15 consumed not revised                                          |
| No telemetry runtime   | Foundation slices do not implement engine/collection/scaling runtime |

---

## 7. Per-slice validation intent (planning)

| Slice    | Key validation intent                                                         |
| -------- | ----------------------------------------------------------------------------- |
| W5-N15-a | Cross-channel telemetry inventory complete; SURVIVE/EPHEMERAL; honesty frozen |
| W5-N15-b | Durable platform telemetry anchors on notification-delivery owner             |
| W5-N15-c | Restart hydrate of telemetry anchors                                          |
| W5-N15-d | Operational continuity / Platform Readiness projection                        |
| W5-N15-e | Close Evidence; Final Integration Verification; walkthrough PASS              |

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
| Documents created     | **PASS** | w5-n15 planning package files   |
| Master Plan alignment | **PASS** | V3-N15 · CM-25 mapped (PO auth) |
| Architecture check    | **PASS** | No ownership drift in planning  |
| Regression suite      | Pending  | Run after docs commit           |
| git diff --check      | Pending  | Run after docs commit           |

---

## Explicit non-claims

- W5-N15 Closed — **not claimed**
- Platform telemetry foundation validation PASS at Close — **not claimed**
- Notification Platform Telemetry implemented — **not claimed**
- Telemetry engine implemented — **not claimed**
- Telemetry collection runtime implemented — **not claimed**
- Observability platform implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-25 implemented — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- W5-N15-a opened — **not claimed**
- W5-N15 Planning Review completed — **not claimed**
- W5-N15 Planning APPROVED — **not claimed**

---

**STOP.** W5-N15 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N15-a. Do not begin implementation.
