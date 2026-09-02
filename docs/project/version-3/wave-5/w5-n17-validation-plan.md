# W5-N17 Validation Plan

**Package:** W5-N17 Notification Platform Delivery Reliability Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N17 · CM-27
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Date:** 2026-09-02
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n17-product-scope.md`](./w5-n17-product-scope.md)
**Security:** [`w5-n17-security-review.md`](./w5-n17-security-review.md)
**Umbrella:** [`w5-n17-implementation-package.md`](./w5-n17-implementation-package.md)
**Overview:** [`notification-delivery-reliability-overview.md`](./notification-delivery-reliability-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock platform delivery reliability foundation without proving cross-channel foundation coherence do **not** count as Close evidence.

Do not validate per-channel production transport I/O (N01…N04 transport scope), delivery execution runtime/dead-letter processing/automatic replay/retry execution, notification execution/scheduler execution/worker execution/production runtime, metric collection runtime/exporters/dashboards/alerting/analytics/production monitoring, Live Trading, Wave 5 COMPLETE, or Notification Platform Complete from N17 alone. Validate **Notification Platform Delivery Reliability Foundation** outcomes only.

---

## 0. What Close means for W5-N17

| Gate                | Meaning                                                                                           | Unlocks                           |
| ------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------- |
| **W5-N17 Closed**   | Platform delivery reliability foundation evidenced; walkthrough PASS                              | V3-N17 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N17 alone                                                                        | Requires N01…N17 Close + PO       |
| **Not claimed**     | Live Trading / live orders                                                                        | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                                                                    | N01…N17 Close + PO                |
| **Not claimed**     | Production transports operational                                                                 | TD-049 / TD-050                   |
| **Not claimed**     | Delivery execution runtime / dead-letter processing / retry execution                             | Post-foundation product scope     |
| **Not claimed**     | Metric collection runtime / exporters / dashboards / alerting / analytics / production monitoring | Post-foundation product scope     |
| **Not claimed**     | Notification execution / scheduler / worker / production runtime                                  | Post-foundation product scope     |

---

## 1. Validation strategy overview

| Layer                    | Purpose                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| Conformance validation   | Platform conformance registry; inventory completeness; honesty rules     |
| Documentation validation | Planning package integrity; slice reports; walkthrough; Close Evidence   |
| Architecture validation  | No second engine; reliability foundation extension only; PC-06 preserved |
| Governance validation    | Master Plan unchanged; ownership preserved; no duplicate subsystem       |
| Regression validation    | Wave 1–4, W5-N01…N16 boundaries                                          |
| Package close validation | Final Integration Verification; Product Owner Close Record               |

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

| Area                             | Must prove                                                        |
| -------------------------------- | ----------------------------------------------------------------- |
| Reliability foundation integrity | Platform Ready requires reliability foundation evidence           |
| Per-channel honesty              | Reserved-inactive not presented as Connected                      |
| N05…N16 platform honesty         | Prior platform truth not overridden by reliability layer          |
| Secret non-echo                  | Responses, logs, errors never include secrets                     |
| Workspace binding                | Missing/wrong workspace fails closed                              |
| Cross-channel isolation          | Channel A state cannot leak to channel B                          |
| No capital side effect           | Reliability foundation never places live orders                   |
| No delivery runtime              | Foundation ≠ execution/dead-letter/retry/monitoring               |
| No fake Reliability Ready        | Reliability Ready label requires real delivery outcome round-trip |
| Fail honest                      | Missing/corrupt state surfaces honestly                           |

---

## 3. Documentation validation

| Area                      | Must prove                                                               |
| ------------------------- | ------------------------------------------------------------------------ |
| Planning package complete | All W5-N17 planning documents present and internally consistent          |
| Slice reports             | Implementation reports for a–e at Close                                  |
| Operational walkthrough   | Platform Delivery Reliability Foundation Walkthrough executed in product |
| Close Evidence            | Package summary, close report, integration verification                  |
| Wave documentation sync   | wave-5-overview.md and wave-5-progress.md synchronized                   |

---

## 4. Architecture validation

| Area                   | Must prove                                                     |
| ---------------------- | -------------------------------------------------------------- |
| No second engine       | Notification Delivery reliability foundation extension only    |
| No duplicate subsystem | Single notification delivery engine                            |
| No duplicate SoT       | PC-06 routing unchanged                                        |
| No ownership drift     | Vault / notification-delivery / Exchange unchanged             |
| No Master Plan change  | V3-N17 consumed not revised                                    |
| No delivery runtime    | Foundation slices do not implement execution/dead-letter/retry |
| Bounded contexts       | All existing bounded contexts preserved                        |

---

## 5. Governance validation

| Area                            | Must prove                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| Master Plan                     | Unchanged by W5-N17                                                                 |
| Version 2                       | Consumed only — no redesign                                                         |
| Ownership boundaries            | Notification Platform and Delivery preserved                                        |
| Persistence ownership           | notification-delivery owner only                                                    |
| Secret Vault boundaries         | Vault owns credentials                                                              |
| Workspace isolation             | Unchanged                                                                           |
| Planning Review                 | PASS before implementation                                                          |
| Planning Approval               | RECORDED before W5-N17-a                                                            |
| Engineering evidence only       | Engineering prepares evidence — does not self-approve or self-close                 |
| Product Owner acceptance        | Product Owner alone determines package acceptance                                   |
| No inferred reliability claims  | Customer-visible claims require implemented evidence only                           |
| Delivery Reliability boundaries | Successful transport / recipient / end-to-end / exactly-once / real-time remain OUT |

---

## 6. Regression validation

| Area                  | Must prove                          |
| --------------------- | ----------------------------------- |
| Wave 1–3 boundaries   | No redesign of closed waves         |
| Wave 4 boundaries     | Exchange Adapter untouched          |
| W5-N01…N16 boundaries | No reopen; prior foundations intact |
| W5-N14 dead-letter    | Not redesigned                      |
| W5-N15 telemetry      | Not redesigned                      |
| W5-N16 metrics        | Not redesigned                      |
| AI Gateway            | Anthropic path untouched            |
| MN-02 Observability   | Unchanged                           |
| PC-06 routing         | Routing SoT unchanged               |

---

## 7. UI validation

| Area                      | Must prove                                                                |
| ------------------------- | ------------------------------------------------------------------------- |
| Platform Ready            | Only after reliability foundation evidence                                |
| Per-channel labels        | Honest per N01…N04 channel truth                                          |
| Reserved                  | Unshipped channels show honest "Not offered"                              |
| No Live Trading           | UI never implies live capital from reliability foundation                 |
| No delivery runtime       | UI never implies execution/dead-letter/retry operational                  |
| No fake Reliability Ready | UI never shows Reliability Ready without real delivery outcome round-trip |

---

## 8. Integration validation

| Area                           | Must prove                                                               |
| ------------------------------ | ------------------------------------------------------------------------ |
| N01…N16 foundation consumption | Per-channel and platform anchors consumed; not redesigned                |
| N14/N15/N16 consumption        | Dead-letter, telemetry, metrics foundations consumed; not redesigned     |
| Cross-workspace deny           | A cannot use B reliability state                                         |
| PC-06 routing consumption      | Routing SoT unchanged; reliability foundation consumes only              |
| Restart recovery               | W5-N17-b/c reliability anchors hydrate after restart                     |
| Operational continuity         | Platform Readiness projection honest (`notificationPlatformReliability`) |
| Vault boundary                 | Reliability foundation retrieves; does not store credentials             |
| W3-O02 queue substrate         | Consumed; queue owner unchanged                                          |
| MN-02 Observability boundary   | No duplicate observability platform                                      |

---

## 9. Per-slice validation intent (planning)

| Slice    | Key validation intent                                                                    |
| -------- | ---------------------------------------------------------------------------------------- |
| W5-N17-a | Cross-channel delivery reliability inventory complete; SURVIVE/EPHEMERAL; honesty frozen |
| W5-N17-b | Durable platform reliability anchors on notification-delivery owner                      |
| W5-N17-c | Restart hydrate of reliability anchors                                                   |
| W5-N17-d | Operational continuity / Platform Readiness projection                                   |
| W5-N17-e | Close Evidence; Final Integration Verification; walkthrough PASS                         |

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

## W5-N17-a slice validation (2026-09-02)

| Layer                  | Result          | Evidence                                     |
| ---------------------- | --------------- | -------------------------------------------- |
| W5-N17-a inventory     | **PASS**        | w5-n17-a-delivery-reliability-inventory      |
| Reliability classified | **PASS**        | FOUNDATION/DURABLE/RECOVERABLE/EPHEMERAL/OUT |
| Ownership verified     | **PASS**        | All rows on existing owners                  |
| Customer-visible       | **PASS**        | None — internal inventory only               |
| W5-N17-b opened        | **Not claimed** | Slice c not opened                           |

---

## W5-N17-b slice validation (2026-09-02)

| Layer                             | Result          | Evidence                                            |
| --------------------------------- | --------------- | --------------------------------------------------- |
| W5-N17-b durable anchors          | **PASS**        | workspace_notification_platform_reliability_anchors |
| platformReliabilityAnchorsMissing | **PASS**        | false after slice b                                 |
| Ownership verified                | **PASS**        | notification-delivery owner only                    |
| Restart recovery                  | **Not claimed** | W5-N17-c not opened                                 |
| Customer-visible                  | **PASS**        | None — internal durability only                     |
| W5-N17-c opened                   | **Not claimed** | Slice d not opened                                  |

---

## W5-N17-c slice validation (2026-09-02)

| Layer                       | Result          | Evidence                                              |
| --------------------------- | --------------- | ----------------------------------------------------- |
| W5-N17-c restart recovery   | **PASS**        | NotificationPlatformReliabilityRestartRecoveryService |
| Recovery deterministic      | **PASS**        | workspaceId + reliabilityAnchorId ordering            |
| Recovery idempotent         | **PASS**        | hydrate twice yields same diagnostics                 |
| Missing rows not fabricated | **PASS**        | empty cache on missing persistence                    |
| Corrupt rows fail honest    | **PASS**        | NotificationPlatformReliabilityRestartRecoveryError   |
| Operational continuity      | **Not claimed** | W5-N17-d not opened                                   |
| Customer-visible            | **PASS**        | None — internal restart recovery only                 |
| W5-N17-d opened             | **Not claimed** | Slice d not opened                                    |

---

## Planning open validation (this act)

| Layer                 | Result   | Evidence                        |
| --------------------- | -------- | ------------------------------- |
| Documents created     | **PASS** | w5-n17 planning package files   |
| Master Plan alignment | **PASS** | V3-N17 · CM-27 mapped (PO auth) |
| Architecture check    | **PASS** | No ownership drift in planning  |
| Regression suite      | Pending  | Run after docs commit           |
| git diff --check      | Pending  | Run after docs commit           |

---

## Explicit non-claims

- W5-N17 Closed — **not claimed**
- Platform delivery reliability foundation validation PASS at Close — **not claimed**
- Notification Platform Delivery Reliability implemented — **not claimed**
- Delivery execution runtime implemented — **not claimed**
- Dead-letter processing implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-27 implemented — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- W5-N17-a opened — **not claimed**
- W5-N17 Planning Review completed — **not claimed**
- W5-N17 Planning APPROVED — **not claimed**

---

**STOP.** W5-N17-c is **COMPLETE** (uncommitted). Await Product Owner Review. Do not open W5-N17-d. Do not declare Delivery Reliability implemented.
