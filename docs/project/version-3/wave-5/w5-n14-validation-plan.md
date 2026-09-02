# W5-N14 Validation Plan

**Package:** W5-N14 Notification Platform Dead Letter Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N14 · CM-24
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Date:** 2026-09-02
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n14-product-scope.md`](./w5-n14-product-scope.md)
**Security:** [`w5-n14-security-review.md`](./w5-n14-security-review.md)
**Umbrella:** [`w5-n14-implementation-package.md`](./w5-n14-implementation-package.md)
**Overview:** [`w5-n14-overview.md`](./w5-n14-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock platform dead-letter foundation without proving cross-channel foundation coherence do **not** count as Close evidence.

Do not validate per-channel production transport I/O (N01…N04 transport scope), dead-letter runtime/processing/automatic replay, retry execution, notification execution, scheduler execution, worker execution, production runtime, Live Trading, Wave 5 COMPLETE, or Notification Platform Complete from N14 alone. Validate **Notification Platform Dead Letter Foundation** outcomes only.

---

## 0. What Close means for W5-N14

| Gate                | Meaning                                                                                                | Unlocks                           |
| ------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **W5-N14 Closed**   | Platform dead-letter foundation evidenced; walkthrough PASS                                            | V3-N14 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N14 alone                                                                             | Requires N01…N14 Close + PO       |
| **Not claimed**     | Live Trading / live orders                                                                             | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                                                                         | N01…N14 Close + PO                |
| **Not claimed**     | Production transports operational                                                                      | TD-049 / TD-050                   |
| **Not claimed**     | Per-channel notifications operational                                                                  | N01…N04 transport scope           |
| **Not claimed**     | Dead-letter runtime / processing / automatic replay                                                    | Post-foundation product scope     |
| **Not claimed**     | Retry execution / notification execution / scheduler execution / worker execution / production runtime | Post-foundation product scope     |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                                   |
| ----------------------------- | ------------------------------------------------------------------------- |
| Unit validation               | Platform dead-letter foundation mapping; workspace binding; honesty rules |
| Integration validation        | Cross-channel foundation consumption; cross-workspace deny                |
| UI validation                 | Honest Platform Ready / reserved / per-channel / Dead-Lettered labels     |
| Regression validation         | Wave 1–4, W5-N01…N13 boundaries                                           |
| Product walkthrough           | Platform Dead Letter Foundation Walkthrough executed in product           |
| Architecture validation       | No second engine; dead-letter foundation extension only; PC-06 preserved  |
| Security validation           | Verification Standard + isolation + authz + fail closed                   |
| Package acceptance validation | Acceptance criteria table; Close checklist                                |

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

| Area                             | Must prove                                                     |
| -------------------------------- | -------------------------------------------------------------- |
| Dead-letter foundation integrity | Platform Ready requires dead-letter foundation evidence        |
| Per-channel honesty              | Reserved-inactive not presented as Connected                   |
| Integration honesty              | N05 integration truth not overridden by dead-letter layer      |
| Delivery honesty                 | N06 delivery truth not overridden by dead-letter layer         |
| Dispatch honesty                 | N07 dispatch truth not overridden by dead-letter layer         |
| Queue honesty                    | N08 queue truth not overridden by dead-letter layer            |
| Workers honesty                  | N09 workers truth not overridden by dead-letter layer          |
| Worker execution honesty         | N10 worker execution truth not overridden by dead-letter layer |
| Worker runtime honesty           | N11 worker runtime truth not overridden by dead-letter layer   |
| Scheduler honesty                | N12 scheduler truth not overridden by dead-letter layer        |
| Retry honesty                    | N13 retry truth not overridden by dead-letter layer            |
| Secret non-echo                  | Responses, logs, errors never include secrets                  |
| Workspace binding                | Missing/wrong workspace fails closed                           |
| Cross-channel isolation          | Channel A state cannot leak to channel B                       |
| No capital side effect           | Dead-letter foundation never places live orders                |
| No dead-letter runtime           | Foundation ≠ runtime/processing/automatic replay               |
| No fake Dead-Lettered            | Dead-Lettered label requires real dead-letter round-trip       |

---

## 3. Integration validation

| Area                           | Must prove                                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| N01…N13 foundation consumption | Per-channel, integration, delivery, dispatch, queue, workers, worker execution, worker runtime, scheduler, and retry anchors consumed; not redesigned |
| Cross-workspace deny           | A cannot use B dead-letter state                                                                                                                      |
| PC-06 routing consumption      | Routing SoT unchanged; dead-letter foundation consumes only                                                                                           |
| Restart recovery               | W5-N14-b/c dead-letter anchors hydrate after restart                                                                                                  |
| Operational continuity         | Platform Readiness projection honest                                                                                                                  |
| Vault boundary                 | Dead-letter foundation retrieves; does not store credentials                                                                                          |
| W3-O02 queue substrate         | Consumed; queue owner unchanged                                                                                                                       |

---

## 4. UI validation

| Area                   | Must prove                                                       |
| ---------------------- | ---------------------------------------------------------------- |
| Platform Ready         | Only after dead-letter foundation evidence                       |
| Per-channel labels     | Honest per N01…N04 channel truth                                 |
| Reserved               | Unshipped channels show honest “Not offered”                     |
| No Live Trading        | UI never implies live capital from dead-letter foundation        |
| No dead-letter runtime | UI never implies runtime/processing/replay operational           |
| No fake Dead-Lettered  | UI never shows Dead-Lettered without real dead-letter round-trip |

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
| W5-N12 boundaries   | No reopen; scheduler foundation intact        |
| W5-N13 boundaries   | No reopen; retry foundation intact            |
| AI Gateway          | Anthropic path untouched                      |
| PC-06 routing       | Routing SoT unchanged                         |

---

## 6. Architecture validation

| Area                   | Must prove                                                             |
| ---------------------- | ---------------------------------------------------------------------- |
| No second engine       | Notification Delivery dead-letter foundation extension only            |
| No duplicate subsystem | Single notification delivery engine                                    |
| No duplicate SoT       | PC-06 routing unchanged                                                |
| No ownership drift     | Vault / notification-delivery / Exchange unchanged                     |
| No Master Plan change  | V3-N14 consumed not revised                                            |
| No dead-letter runtime | Foundation slices do not implement runtime/processing/automatic replay |

---

## 7. Per-slice validation intent (planning)

| Slice    | Key validation intent                                                           |
| -------- | ------------------------------------------------------------------------------- |
| W5-N14-a | Cross-channel dead-letter inventory complete; SURVIVE/EPHEMERAL; honesty frozen |
| W5-N14-b | Durable platform dead-letter anchors on notification-delivery owner             |
| W5-N14-c | Restart hydrate of dead-letter anchors                                          |
| W5-N14-d | Operational continuity / Platform Readiness projection                          |
| W5-N14-e | Close Evidence; Final Integration Verification; walkthrough PASS                |

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
| Documents created     | **PASS** | w5-n14 planning package files   |
| Master Plan alignment | **PASS** | V3-N14 · CM-24 mapped (PO auth) |
| Architecture check    | **PASS** | No ownership drift in planning  |
| Regression suite      | Pending  | Run after docs commit           |
| git diff --check      | Pending  | Run after docs commit           |

---

## Explicit non-claims

- W5-N14 Closed — **not claimed**
- Platform dead-letter foundation validation PASS at Close — **not claimed**
- Notification Platform Dead Letter implemented — **not claimed**
- Dead-letter runtime implemented — **not claimed**
- Dead-letter processing implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-24 implemented — **not claimed**
- Automatic replay implemented — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- W5-N14-a opened — **not claimed**
- W5-N14 Planning Review completed — **not claimed**
- W5-N14 Planning APPROVED — **not claimed**

---

**STOP.** W5-N14 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N14-a. Do not begin implementation.
