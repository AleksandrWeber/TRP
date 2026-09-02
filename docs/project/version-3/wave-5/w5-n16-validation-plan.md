# W5-N16 Validation Plan

**Package:** W5-N16 Notification Platform Metrics Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N16 · CM-26
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Date:** 2026-09-02
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n16-product-scope.md`](./w5-n16-product-scope.md)
**Security:** [`w5-n16-security-review.md`](./w5-n16-security-review.md)
**Umbrella:** [`w5-n16-implementation-package.md`](./w5-n16-implementation-package.md)
**Overview:** [`w5-n16-overview.md`](./w5-n16-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock platform metrics foundation without proving cross-channel foundation coherence do **not** count as Close evidence.

Do not validate per-channel production transport I/O (N01…N04 transport scope), metric collection runtime/exporters/dashboards/alerting/analytics/production monitoring, dead-letter runtime/processing/automatic replay, retry execution, notification execution, scheduler execution, worker execution, production runtime, Live Trading, Wave 5 COMPLETE, or Notification Platform Complete from N16 alone. Validate **Notification Platform Metrics Foundation** outcomes only.

---

## 0. What Close means for W5-N16

| Gate                | Meaning                                                                                                  | Unlocks                           |
| ------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **W5-N16 Closed**   | Platform metrics foundation evidenced; walkthrough PASS                                                  | V3-N16 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N16 alone                                                                               | Requires N01…N16 Close + PO       |
| **Not claimed**     | Live Trading / live orders                                                                               | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                                                                           | N01…N16 Close + PO                |
| **Not claimed**     | Production transports operational                                                                        | TD-049 / TD-050                   |
| **Not claimed**     | Metric collection runtime / exporters / dashboards / alerting / analytics / production monitoring        | Post-foundation product scope     |
| **Not claimed**     | Dead-letter runtime / retry execution / notification execution / scheduler / worker / production runtime | Post-foundation product scope     |

---

## 1. Validation strategy overview

| Layer                    | Purpose                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| Conformance validation   | Platform conformance registry; inventory completeness; honesty rules   |
| Documentation validation | Planning package integrity; slice reports; walkthrough; Close Evidence |
| Architecture validation  | No second engine; metrics foundation extension only; PC-06 preserved   |
| Governance validation    | Master Plan unchanged; ownership preserved; no duplicate subsystem     |
| Regression validation    | Wave 1–4, W5-N01…N15 boundaries                                        |
| Package close validation | Final Integration Verification; Product Owner Close Record             |

### Planning-phase commands (docs-only gate)

| Command                        | Purpose              |
| ------------------------------ | -------------------- |
| `pnpm lint`                    | Monorepo lint        |
| `pnpm typecheck`               | Type safety          |
| `pnpm test`                    | Regression suite     |
| `pnpm --filter @trp/web build` | Web build            |
| `git diff --check`             | Whitespace integrity |

---

## 2. Conformance validation

| Area                         | Must prove                                              |
| ---------------------------- | ------------------------------------------------------- |
| Metrics foundation integrity | Platform Ready requires metrics foundation evidence     |
| Per-channel honesty          | Reserved-inactive not presented as Connected            |
| N05…N15 platform honesty     | Prior platform truth not overridden by metrics layer    |
| Secret non-echo              | Responses, logs, errors never include secrets           |
| Workspace binding            | Missing/wrong workspace fails closed                    |
| Cross-channel isolation      | Channel A state cannot leak to channel B                |
| No capital side effect       | Metrics foundation never places live orders             |
| No metric runtime            | Foundation ≠ collection/exporters/dashboards/monitoring |
| No fake Metrics Ready        | Metrics Ready label requires real collection round-trip |
| Fail honest                  | Missing/corrupt state surfaces honestly                 |

---

## 3. Documentation validation

| Area                      | Must prove                                                      |
| ------------------------- | --------------------------------------------------------------- |
| Planning package complete | All W5-N16 planning documents present and internally consistent |
| Slice reports             | Implementation reports for a–e at Close                         |
| Operational walkthrough   | Platform Metrics Foundation Walkthrough executed in product     |
| Close Evidence            | Package summary, close report, integration verification         |
| Wave documentation sync   | wave-5-overview.md and wave-5-progress.md synchronized          |

---

## 4. Architecture validation

| Area                   | Must prove                                                         |
| ---------------------- | ------------------------------------------------------------------ |
| No second engine       | Notification Delivery metrics foundation extension only            |
| No duplicate subsystem | Single notification delivery engine                                |
| No duplicate SoT       | PC-06 routing unchanged                                            |
| No ownership drift     | Vault / notification-delivery / Exchange unchanged                 |
| No Master Plan change  | V3-N16 consumed not revised                                        |
| No metric runtime      | Foundation slices do not implement collection/exporters/dashboards |
| Bounded contexts       | All existing bounded contexts preserved                            |

---

## 5. Governance validation

| Area                    | Must prove                                   |
| ----------------------- | -------------------------------------------- |
| Master Plan             | Unchanged by W5-N16                          |
| Version 2               | Consumed only — no redesign                  |
| Ownership boundaries    | Notification Platform and Delivery preserved |
| Persistence ownership   | notification-delivery owner only             |
| Secret Vault boundaries | Vault owns credentials                       |
| Workspace isolation     | Unchanged                                    |
| Planning Review         | PASS before implementation                   |
| Planning Approval       | RECORDED before W5-N16-a                     |

---

## 6. Regression validation

| Area                  | Must prove                          |
| --------------------- | ----------------------------------- |
| Wave 1–3 boundaries   | No redesign of closed waves         |
| Wave 4 boundaries     | Exchange Adapter untouched          |
| W5-N01…N15 boundaries | No reopen; prior foundations intact |
| AI Gateway            | Anthropic path untouched            |
| MN-02 Observability   | Unchanged                           |
| PC-06 routing         | Routing SoT unchanged               |

---

## 7. UI validation

| Area                  | Must prove                                                      |
| --------------------- | --------------------------------------------------------------- |
| Platform Ready        | Only after metrics foundation evidence                          |
| Per-channel labels    | Honest per N01…N04 channel truth                                |
| Reserved              | Unshipped channels show honest "Not offered"                    |
| No Live Trading       | UI never implies live capital from metrics foundation           |
| No metric runtime     | UI never implies collection/exporters/dashboards operational    |
| No fake Metrics Ready | UI never shows Metrics Ready without real collection round-trip |

---

## 8. Integration validation

| Area                           | Must prove                                                           |
| ------------------------------ | -------------------------------------------------------------------- |
| N01…N15 foundation consumption | Per-channel and platform anchors consumed; not redesigned            |
| Cross-workspace deny           | A cannot use B metrics state                                         |
| PC-06 routing consumption      | Routing SoT unchanged; metrics foundation consumes only              |
| Restart recovery               | W5-N16-b/c metric anchors hydrate after restart                      |
| Operational continuity         | Platform Readiness projection honest (`notificationPlatformMetrics`) |
| Vault boundary                 | Metrics foundation retrieves; does not store credentials             |
| W3-O02 queue substrate         | Consumed; queue owner unchanged                                      |
| MN-02 Observability boundary   | No duplicate observability platform                                  |

---

## 9. Per-slice validation intent (planning)

| Slice    | Key validation intent                                                       |
| -------- | --------------------------------------------------------------------------- |
| W5-N16-a | Cross-channel metrics inventory complete; SURVIVE/EPHEMERAL; honesty frozen |
| W5-N16-b | Durable platform metric anchors on notification-delivery owner              |
| W5-N16-c | Restart hydrate of metric anchors                                           |
| W5-N16-d | Operational continuity / Platform Readiness projection                      |
| W5-N16-e | Close Evidence; Final Integration Verification; walkthrough PASS            |

---

## 10. Package Close checklist (post-implementation)

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
| Documents created     | **PASS** | w5-n16 planning package files   |
| Master Plan alignment | **PASS** | V3-N16 · CM-26 mapped (PO auth) |
| Architecture check    | **PASS** | No ownership drift in planning  |
| Regression suite      | Pending  | Run after docs commit           |
| git diff --check      | Pending  | Run after docs commit           |

---

## Explicit non-claims

- W5-N16 Closed — **not claimed**
- Platform metrics foundation validation PASS at Close — **not claimed**
- Notification Platform Metrics implemented — **not claimed**
- Metric collection runtime implemented — **not claimed**
- Metric exporters implemented — **not claimed**
- Dashboards implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-26 implemented — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- W5-N16-a opened — **not claimed**
- W5-N16 Planning Review completed — **not claimed**
- W5-N16 Planning APPROVED — **not claimed**

---

**STOP.** W5-N16 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N16-a. Do not begin implementation.
