# W5-N12 Validation Plan

**Package:** W5-N12 Notification Platform Scheduler Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N12 · CM-22
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Date:** 2026-09-02
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n12-product-scope.md`](./w5-n12-product-scope.md)
**Security:** [`w5-n12-security-review.md`](./w5-n12-security-review.md)
**Umbrella:** [`w5-n12-implementation-package.md`](./w5-n12-implementation-package.md)
**Overview:** [`w5-n12-overview.md`](./w5-n12-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock platform scheduler foundation without proving cross-channel foundation coherence do **not** count as Close evidence.

Do not validate per-channel production transport I/O (N01…N04 transport scope), scheduler runtime/execution (orchestration/retry/dead-letter), Live Trading, Wave 5 COMPLETE, or Notification Platform Complete from N12 alone. Validate **Notification Platform Scheduler Foundation** outcomes only.

---

## 0. What Close means for W5-N12

| Gate                | Meaning                                                             | Unlocks                           |
| ------------------- | ------------------------------------------------------------------- | --------------------------------- |
| **W5-N12 Closed**   | Platform scheduler foundation evidenced; walkthrough PASS           | V3-N12 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N12 alone                                          | Requires N01…N12 Close + PO       |
| **Not claimed**     | Live Trading / live orders                                          | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                                      | N01…N12 Close + PO                |
| **Not claimed**     | Production transports operational                                   | TD-049 / TD-050                   |
| **Not claimed**     | Per-channel notifications operational                               | N01…N04 transport scope           |
| **Not claimed**     | Scheduler runtime / execution / orchestration / retry / dead-letter | Post-foundation product scope     |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| Unit validation               | Platform scheduler foundation mapping; workspace binding; honesty rules |
| Integration validation        | Cross-channel foundation consumption; cross-workspace deny              |
| UI validation                 | Honest Platform Ready / reserved / per-channel / Scheduled labels       |
| Regression validation         | Wave 1–4, W5-N01…N11 boundaries                                         |
| Product walkthrough           | Platform Scheduler Foundation Walkthrough executed in product           |
| Architecture validation       | No second engine; scheduler foundation extension only; PC-06 preserved  |
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

| Area                           | Must prove                                                               |
| ------------------------------ | ------------------------------------------------------------------------ |
| Scheduler foundation integrity | Platform Ready requires scheduler foundation evidence                    |
| Per-channel honesty            | Reserved-inactive not presented as Connected                             |
| Integration honesty            | N05 integration truth not overridden by scheduler layer                  |
| Delivery honesty               | N06 delivery truth not overridden by scheduler layer                     |
| Dispatch honesty               | N07 dispatch truth not overridden by scheduler layer                     |
| Queue honesty                  | N08 queue truth not overridden by scheduler layer                        |
| Workers honesty                | N09 workers truth not overridden by scheduler layer                      |
| Worker execution honesty       | N10 worker execution truth not overridden by scheduler layer             |
| Worker runtime honesty         | N11 worker runtime truth not overridden by scheduler layer               |
| Secret non-echo                | Responses, logs, errors never include secrets                            |
| Workspace binding              | Missing/wrong workspace fails closed                                     |
| Cross-channel isolation        | Channel A state cannot leak to channel B                                 |
| No capital side effect         | Scheduler foundation never places live orders                            |
| No scheduler runtime           | Foundation ≠ scheduler runtime/execution/orchestration/retry/dead-letter |
| No fake Scheduled              | Scheduled label requires real scheduler round-trip                       |

---

## 3. Integration validation

| Area                           | Must prove                                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| N01…N11 foundation consumption | Per-channel, integration, delivery, dispatch, queue, workers, worker execution, and worker runtime anchors consumed; not redesigned |
| Cross-workspace deny           | A cannot use B scheduler state                                                                                                      |
| PC-06 routing consumption      | Routing SoT unchanged; scheduler foundation consumes only                                                                           |
| Restart recovery               | W5-N12-b/c scheduler anchors hydrate after restart                                                                                  |
| Operational continuity         | Platform Readiness projection honest                                                                                                |
| Vault boundary                 | Scheduler foundation retrieves; does not store credentials                                                                          |
| W3-O02 queue substrate         | Consumed; queue owner unchanged                                                                                                     |

---

## 4. UI validation

| Area                 | Must prove                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Platform Ready       | Only after scheduler foundation evidence                                                 |
| Per-channel labels   | Honest per N01…N04 channel truth                                                         |
| Reserved             | Unshipped channels show honest “Not offered”                                             |
| No Live Trading      | UI never implies live capital from scheduler foundation                                  |
| No scheduler runtime | UI never implies scheduler runtime/execution/orchestration/retry/dead-letter operational |
| No fake Scheduled    | UI never shows Scheduled without real scheduler round-trip                               |

---

## 5. Regression validation

| Area                | Must prove                                    |
| ------------------- | --------------------------------------------- |
| Wave 1–3 boundaries | No redesign of closed waves                   |
| Wave 4 boundaries   | Exchange Adapter untouched                    |
| W5-N01 boundaries   | No reopen; Telegram foundation intact         |
| W5-N02 boundaries   | No reopen; Email foundation intact            |
| W5-N03 boundaries   | No reopen; team chat foundation intact        |
| W5-N04 boundaries   | No reopen; Push foundation intact             |
| W5-N05 boundaries   | No reopen; integration foundation intact      |
| W5-N06 boundaries   | No reopen; delivery foundation intact         |
| W5-N07 boundaries   | No reopen; dispatch foundation intact         |
| W5-N08 boundaries   | No reopen; queue foundation intact            |
| W5-N09 boundaries   | No reopen; workers foundation intact          |
| W5-N10 boundaries   | No reopen; worker execution foundation intact |
| W5-N11 boundaries   | No reopen; worker runtime foundation intact   |
| AI Gateway          | Anthropic path untouched                      |
| PC-06 routing       | Routing SoT unchanged                         |

---

## 6. Architecture validation

| Area                   | Must prove                                                                       |
| ---------------------- | -------------------------------------------------------------------------------- |
| No second engine       | Notification Delivery scheduler foundation extension only                        |
| No duplicate subsystem | Single notification delivery engine                                              |
| No duplicate SoT       | PC-06 routing unchanged                                                          |
| No ownership drift     | Vault / notification-delivery / Exchange unchanged                               |
| No Master Plan change  | V3-N12 consumed not revised                                                      |
| No scheduler runtime   | Foundation slices do not implement scheduler runtime/execution/retry/dead-letter |

---

## 7. Per-slice validation intent (planning)

| Slice    | Key validation intent                                                         |
| -------- | ----------------------------------------------------------------------------- |
| W5-N12-a | Cross-channel scheduler inventory complete; SURVIVE/EPHEMERAL; honesty frozen |
| W5-N12-b | Durable platform scheduler anchors on notification-delivery owner             |
| W5-N12-c | Restart hydrate of scheduler anchors                                          |
| W5-N12-d | Operational continuity / Platform Readiness projection                        |
| W5-N12-e | Close Evidence; Final Integration Verification; walkthrough PASS              |

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
| Documents created     | **PASS** | w5-n12 planning package files   |
| Master Plan alignment | **PASS** | V3-N12 · CM-22 mapped (PO auth) |
| Architecture check    | **PASS** | No ownership drift in planning  |
| Regression suite      | Pending  | Run after docs commit           |
| git diff --check      | Pending  | Run after docs commit           |

---

## Explicit non-claims

- W5-N12 Closed — **not claimed**
- Platform scheduler foundation validation PASS at Close — **not claimed**
- Notification Platform Scheduler implemented — **not claimed**
- Scheduler runtime implemented — **not claimed**
- Scheduler execution implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-22 implemented — **not claimed**
- Worker orchestration implemented — **not claimed**
- Retry implemented — **not claimed**
- Dead-letter processing implemented — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- W5-N12-a opened — **not claimed**
- W5-N12 Planning Review completed — **not claimed**
- W5-N12 Planning APPROVED — **not claimed**

---

**STOP.** W5-N12 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N12-a. Do not begin implementation.
