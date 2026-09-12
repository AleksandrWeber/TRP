# W5-N20 Validation Plan

**Package:** W5-N20 Notification Retry Policy Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N20 · CM-30
**Status:** Planning **APPROVED** (2026-09-12). W5-N20-a inventory **COMPLETE**. W5-N20-b durable persistence **COMPLETE** (local). W5-N20-c restart recovery **COMPLETE** (local). W5-N20-d operational continuity **COMPLETE** (local). W5-N20-e Close Evidence **COMPLETE** (local). Final Integration Verification **PASS** (local). Package **CLOSED** by Product Owner (2026-09-12). Not runtime implementation.
**Date:** 2026-09-12
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n20-product-scope.md`](./w5-n20-product-scope.md)
**Security:** [`w5-n20-security-review.md`](./w5-n20-security-review.md)
**Umbrella:** [`w5-n20-implementation-package.md`](./w5-n20-implementation-package.md)
**Overview:** [`notification-retry-policy-overview.md`](./notification-retry-policy-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock platform retry policy foundation without proving cross-channel foundation coherence do **not** count as Close evidence.

Do not validate per-channel production transport I/O (N01…N04 transport scope), retry policy evaluation runtime, backoff calculation, retry scheduler runtime, retry execution runtime, transport execution success, provider acceptance, recipient receipt, exactly-once delivery, delivery guarantees, dead-letter processing, Live Notifications, Production Ready, Wave 5 COMPLETE, or Notification Platform Complete from N20 alone. Validate **Notification Retry Policy Foundation** outcomes only.

---

## 0. What Close means for W5-N20

| Gate                | Meaning                                                                               | Unlocks                           |
| ------------------- | ------------------------------------------------------------------------------------- | --------------------------------- |
| **W5-N20 Closed**   | Platform retry policy foundation evidenced; walkthrough PASS                          | V3-N20 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N20 alone                                                            | Requires separate PO act          |
| **Not claimed**     | Live Trading / live orders                                                            | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                                                        | Separate PO act                   |
| **Not claimed**     | Live Notifications / Production Ready                                                 | Separate PO acts                  |
| **Not claimed**     | Successful delivery / provider acceptance / recipient receipt                         | Transport evidence required       |
| **Not claimed**     | Exactly-once delivery / delivery guarantee                                            | Outside foundation                |
| **Not claimed**     | Policy evaluation / backoff / scheduler runtime / execution runtime / transport / DLQ | Deferred product scope            |
| **Not claimed**     | Policy Engine / Retry Platform / Workflow Engine / Event Bus / orchestration platform | Forbidden                         |

---

## 1. Validation strategy overview

| Layer                    | Purpose                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| Conformance validation   | Platform conformance registry; inventory completeness; honesty rules   |
| Documentation validation | Planning package integrity; slice reports; walkthrough; Close Evidence |
| Architecture validation  | No Policy Engine; retry policy extension only; PC-06 preserved         |
| Governance validation    | Master Plan unchanged; ownership preserved; no duplicate subsystem     |
| Regression validation    | Wave 1–4, W5-N01…N19 boundaries                                        |
| Package close validation | Final Integration Verification; Product Owner Close Record             |

### Planning-phase commands (docs-only gate)

| Command                        | Purpose              |
| ------------------------------ | -------------------- |
| `pnpm lint`                    | Monorepo lint        |
| `pnpm typecheck`               | Type safety          |
| `pnpm test`                    | Regression suite     |
| `pnpm --filter @trp/web build` | Web build            |
| `git diff --check`             | Whitespace integrity |
| `pnpm format:check`            | Prettier integrity   |

---

## 2. Conformance validation

| Area                       | Must prove                                                |
| -------------------------- | --------------------------------------------------------- |
| Retry policy integrity     | Platform Ready requires retry policy foundation evidence  |
| Per-channel honesty        | Reserved-inactive not presented as Connected              |
| N05…N19 platform honesty   | Prior platform truth not overridden by retry policy layer |
| Secret non-echo            | Responses, logs, errors never include secrets             |
| Workspace binding          | Missing/wrong workspace fails closed                      |
| Cross-channel isolation    | Channel A state cannot leak to channel B                  |
| No capital side effect     | Retry policy foundation never places live orders          |
| No delivery success claim  | Foundation ≠ successful delivery / acceptance / receipt   |
| No fake Retry Policy Ready | Label requires real runtime outcome evidence              |
| Fail honest                | Missing/corrupt state surfaces honestly                   |

---

## 3. Documentation validation

| Area                      | Must prove                                                       |
| ------------------------- | ---------------------------------------------------------------- |
| Planning package complete | All W5-N20 planning documents present and internally consistent  |
| Slice reports             | Implementation reports for a–e at Close                          |
| Operational walkthrough   | Platform Retry Policy Foundation Walkthrough executed in product |
| Close Evidence            | Package summary, close report, integration verification          |
| Wave documentation sync   | wave-5-overview.md and wave-5-progress.md synchronized           |

---

## 4. Architecture validation

| Area                                       | Must prove                                                   |
| ------------------------------------------ | ------------------------------------------------------------ |
| No second engine                           | Notification Delivery retry policy foundation extension only |
| No Policy Engine product                   | Capability of notification-delivery only                     |
| No Retry Platform                          | Forbidden                                                    |
| No Workflow Engine                         | Policy on existing owner only                                |
| No Event Bus product                       | Forbidden                                                    |
| No orchestration platform                  | Forbidden                                                    |
| No duplicate subsystem                     | Single notification delivery engine                          |
| No duplicate SoT                           | PC-06 routing unchanged                                      |
| No ownership drift                         | Vault / notification-delivery / Exchange unchanged           |
| No Master Plan change                      | V3-N20 consumed not revised                                  |
| No policy evaluation runtime               | Foundation slices do not implement runtime evaluation        |
| No backoff / scheduler / execution runtime | Foundation slices do not implement runtime I/O               |
| No transport execution                     | Foundation slices do not implement provider I/O              |
| Bounded contexts                           | All existing bounded contexts preserved                      |

---

## 5. Governance validation

| Area                        | Must prove                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| Master Plan                 | Unchanged by W5-N20                                                                        |
| Version 2                   | Consumed only — no redesign                                                                |
| Ownership boundaries        | Notification Platform and Delivery preserved                                               |
| Persistence ownership       | notification-delivery owner only                                                           |
| Secret Vault boundaries     | Vault owns credentials                                                                     |
| Workspace isolation         | Unchanged                                                                                  |
| Planning Review             | PASS before implementation                                                                 |
| Planning Approval           | RECORDED before W5-N20-a                                                                   |
| Engineering evidence only   | Engineering prepares evidence — does not self-approve or self-close                        |
| Product Owner acceptance    | Product Owner alone determines package acceptance                                          |
| No inferred delivery claims | Customer-visible claims require implemented evidence only                                  |
| Retry Policy boundaries     | Successful delivery / acceptance / receipt / exactly-once / guarantee / runtime remain OUT |

---

## 6. Regression validation

| Area                    | Must prove                          |
| ----------------------- | ----------------------------------- |
| Wave 1–3 boundaries     | No redesign of closed waves         |
| Wave 4 boundaries       | Exchange Adapter untouched          |
| W5-N01…N19 boundaries   | No reopen; prior foundations intact |
| W5-N18 retry execution  | Not redesigned                      |
| W5-N19 retry scheduling | Not redesigned                      |
| AI Gateway              | Anthropic path untouched            |
| MN-02 Observability     | Unchanged                           |
| PC-06 routing           | Routing SoT unchanged               |

---

## 7. UI validation

| Area                       | Must prove                                                                  |
| -------------------------- | --------------------------------------------------------------------------- |
| Platform Ready             | Only after retry policy foundation evidence                                 |
| Per-channel labels         | Honest per N01…N04 channel truth                                            |
| Reserved                   | Unshipped channels show honest "Not offered"                                |
| No Live Trading            | UI never implies live capital from retry policy foundation                  |
| No fake delivery success   | UI never implies successful delivery / acceptance / receipt from foundation |
| No fake Retry Policy Ready | UI never shows Retry Policy Ready without real runtime outcome evidence     |

---

## 8. Integration validation

| Area                           | Must prove                                                               |
| ------------------------------ | ------------------------------------------------------------------------ |
| N01…N19 foundation consumption | Per-channel and platform anchors consumed; not redesigned                |
| N18/N19 consumption            | Retry execution and scheduling foundations consumed; not redesigned      |
| Cross-workspace deny           | A cannot use B retry policy state                                        |
| PC-06 routing consumption      | Routing SoT unchanged; retry policy foundation consumes only             |
| Restart-safe recovery          | W5-N20-b/c anchors hydrate after restart                                 |
| Operational continuity         | Platform Readiness projection honest (`notificationPlatformRetryPolicy`) |
| Vault boundary                 | Retry policy foundation retrieves; does not store credentials            |
| W3-O02 queue substrate         | Consumed; queue owner unchanged                                          |
| MN-02 Observability boundary   | No duplicate observability platform                                      |

---

## 9. Per-slice validation intent (planning)

| Slice    | Key validation intent                                              |
| -------- | ------------------------------------------------------------------ |
| W5-N20-a | Retry policy inventory complete; SURVIVE/EPHEMERAL; honesty frozen |
| W5-N20-b | Durable policy persistence on notification-delivery owner          |
| W5-N20-c | Restart-safe policy recovery hydrate                               |
| W5-N20-d | Operational continuity / Platform Readiness projection             |
| W5-N20-e | Close Evidence; Final Integration Verification; walkthrough PASS   |

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

| Layer                 | Result   | Evidence                                            |
| --------------------- | -------- | --------------------------------------------------- |
| Documents created     | **PASS** | w5-n20 planning package files                       |
| Master Plan alignment | **PASS** | V3-N20 · CM-30 mapped (PO auth)                     |
| Architecture check    | **PASS** | No ownership drift in planning                      |
| Governance check      | **PASS** | No Policy Engine / Retry Platform / Workflow Engine |

---

## W5-N20-a slice validation (2026-09-12)

| Layer              | Result   | Evidence                                     |
| ------------------ | -------- | -------------------------------------------- |
| W5-N20-a inventory | **PASS** | w5-n20-a-retry-policy-inventory              |
| Policy classified  | **PASS** | FOUNDATION/DURABLE/RECOVERABLE/EPHEMERAL/OUT |
| Ownership verified | **PASS** | All rows on existing owners                  |
| Customer-visible   | **PASS** | None — internal inventory only               |

## W5-N20-b slice validation (2026-09-12)

| Layer                    | Result   | Evidence                                             |
| ------------------------ | -------- | ---------------------------------------------------- |
| W5-N20-b durable anchors | **PASS** | workspace_notification_platform_retry_policy_anchors |
| Inventory sync           | **PASS** | persist + ownership rows SURVIVE/DURABLE             |
| Ownership verified       | **PASS** | notification-delivery only; no new persistence owner |
| Customer-visible         | **PASS** | None — internal durable persistence only             |
| Restart recovery claimed | **PASS** | Not claimed — W5-N20-c                               |

## W5-N20-c slice validation (2026-09-12)

| Layer                      | Result   | Evidence                                              |
| -------------------------- | -------- | ----------------------------------------------------- |
| W5-N20-c restart hydrate   | **PASS** | NotificationPlatformRetryPolicyRestartRecoveryService |
| Deterministic / idempotent | **PASS** | ordered hydrate; repeated hydrate equal               |
| Integrity gate             | **PASS** | corrupt → fail honest; missing → empty                |
| Ownership verified         | **PASS** | notification-delivery only; no second recovery engine |
| Customer-visible           | **PASS** | None — internal restart recovery only                 |
| Operational continuity     | **PASS** | Not claimed — W5-N20-d                                |

## W5-N20-d slice validation (2026-09-12)

| Layer                           | Result   | Evidence                                                           |
| ------------------------------- | -------- | ------------------------------------------------------------------ |
| W5-N20-d continuity derivation  | **PASS** | notification-platform-retry-policy-operational-continuity.ts       |
| Platform Readiness field        | **PASS** | notificationPlatformRetryPolicy on projection + web UI             |
| States honesty                  | **PASS** | Recovering / Ready / Degraded / Unavailable; Ready never hardcoded |
| Degraded never fabricates Ready | **PASS** | integrity failure → Degraded                                       |
| Ownership verified              | **PASS** | notification-delivery capability; Platform Readiness extended only |
| Customer-visible                | **PASS** | Operator readiness via existing Platform Readiness view only       |

## W5-N20-e slice validation (2026-09-12)

| Layer                   | Result   | Evidence                                             |
| ----------------------- | -------- | ---------------------------------------------------- |
| W5-N20-e Close Evidence | **PASS** | w5-n20-e-package-close-evidence.ts                   |
| Operational chain       | **PASS** | inventory → persistence → recovery → continuity → PR |
| Approved slices a–d     | **PASS** | All PASS                                             |
| Package CLOSED          | **PASS** | Not claimed                                          |
| FIV performed           | **PASS** | See Final Integration Verification section below     |
| Customer-visible        | **PASS** | None — package validation only                       |

## Explicit non-claims

- W5-N20 Closed — **recorded** (2026-09-12)
- Platform retry policy foundation validation PASS at Close — **not claimed** (Close ≠ Retry Policy implemented)
- Notification Retry Policy implemented — **not claimed**
- Retry Policy implemented — **not claimed**
- Retry policy evaluation runtime — **not claimed**
- Backoff calculation — **not claimed**
- Retry scheduler runtime — **not claimed**
- Retry execution runtime — **not claimed**
- Successful delivery — **not claimed**
- Provider acceptance — **not claimed**
- Recipient receipt — **not claimed**
- Exactly-once delivery — **not claimed**
- Delivery guarantee — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-30 implemented — **not claimed**
- Live Notifications — **not claimed**
- Production Ready — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- W5-N20-a COMPLETE — **recorded** (local, 2026-09-12) — inventory only
- W5-N20-b COMPLETE — **recorded** (local, 2026-09-12) — durable persistence only
- W5-N20-c COMPLETE — **recorded** (local, 2026-09-12) — restart recovery only
- W5-N20-d COMPLETE — **recorded** (local, 2026-09-12) — operational continuity only
- W5-N20-e COMPLETE — **recorded** (local, 2026-09-12) — Close Evidence only
- Final Package Integration Verification — **PASS** (local, 2026-09-12)
- Product Owner Final Close — **recorded** (2026-09-12)
- W5-N20 Planning Review completed — **recorded** (PASS)
- W5-N20 Planning APPROVED — **recorded** (2026-09-12)

---

## W5-N20 Final Integration Verification (2026-09-12)

| Layer                                  | Result     | Evidence                                          |
| -------------------------------------- | ---------- | ------------------------------------------------- |
| Final Package Integration Verification | **PASS**   | w5-n20-final-integration-verification.md          |
| Slices a–e internally consistent       | **PASS**   | buildCloseEvidenceDiagnostics()                   |
| Regression suite                       | **PASS**   | lint / typecheck / test / web build               |
| Product Owner Final Close              | **CLOSED** | w5-n20-product-owner-close-record.md (2026-09-12) |
| W5-N20 CLOSED                          | **CLOSED** | by Product Owner (2026-09-12)                     |

---

**STOP.** W5-N20 is **CLOSED** by Product Owner (2026-09-12). Do NOT declare Retry Policy implemented. Do NOT declare Retry Scheduling implemented. Do NOT declare Retry Execution implemented. Do NOT declare Notification Platform COMPLETE. Do NOT declare Live Notifications. Do NOT declare Production Ready. Do NOT declare Wave 5 COMPLETE. Do not open W5-N21. Await Repository Synchronization.
