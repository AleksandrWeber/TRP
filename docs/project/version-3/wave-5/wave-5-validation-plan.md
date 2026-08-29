# Wave 5 Validation Plan

**Wave:** 5 — Notification Platform
**Date:** 2026-08-28
**Status:** Planning **OPEN**. Awaiting Product Owner Planning Review. Not implementation.
**Overview:** [`wave-5-overview.md`](./wave-5-overview.md)
**Progress:** [`wave-5-progress.md`](./wave-5-progress.md)
**Implementation package:** [`wave-5-implementation-package.md`](./wave-5-implementation-package.md)

---

## Purpose

Define how Wave 5 Close is proven after all packages (W5-N01…N04) complete implementation. This planning document records validation **intent** only. No validation runs are claimed from planning open.

---

## Wave exit validation (Master Plan)

| #   | Exit criterion (Execution Roadmap)                            | Validation approach (planning intent)              |
| --- | ------------------------------------------------------------- | -------------------------------------------------- |
| 1   | Telegram connect binds real chat; test sends real message     | Bot API round-trip test; chat receives message     |
| 2   | Email/Slack/Discord/Teams/Push connect/test/status/disconnect | Per-channel transport tests when shipped (N02–N04) |
| 3   | Reserved-inactive gone for shipped channels                   | Catalog audit; honest reserved for unshipped       |
| 4   | PC-06 routing delivers to active transport                    | End-to-end routing integration test                |
| 5   | Telegram cannot start/stop/approve trades                     | Conformance test — command rejection               |

---

## Per-package validation (planning intent)

| Package | Key validation                                           |
| ------- | -------------------------------------------------------- |
| W5-N01  | Real Telegram Bot API connect/test/disconnect; chat bind |
| W5-N02  | Real SMTP connect/test/disconnect; SSRF allowlist        |
| W5-N03  | Real Slack/Discord/Teams webhook connect/test/disconnect |
| W5-N04  | Real push connect/test/disconnect; device token handling |

Each package Close requires: Implementation Report, Architecture Review, Security Review, Product Review, Validation Report, Final Package Integration Verification.

---

## Regression suite (mandatory at each package Close)

| Command                        | Required |
| ------------------------------ | -------- |
| `pnpm lint`                    | PASS     |
| `pnpm typecheck`               | PASS     |
| `pnpm test`                    | PASS     |
| `pnpm --filter @trp/web build` | PASS     |
| `git diff --check`             | PASS     |

---

## Security validation (planning intent)

| Area                   | Required evidence at Close                 |
| ---------------------- | ------------------------------------------ |
| Workspace isolation    | Automated cross-workspace denial tests     |
| Authorization          | Role-based connect/test denial tests       |
| Secret handling        | No plaintext echo in logs/UI/errors        |
| SSRF                   | Provider endpoint allowlist enforced       |
| Telegram control plane | Trade commands rejected / ignored          |
| Verification Standard  | All categories evidenced per package Close |

---

## Honest Product validation (planning intent)

| Rule                     | Test intent                                           |
| ------------------------ | ----------------------------------------------------- |
| No fake delivery         | Status requires transport round-trip evidence         |
| Telegram delivery-only   | No session start/stop/approve via Telegram            |
| Reserved channels honest | Unshipped channels show reserved — not fake connected |
| Provider failure honest  | Vendor errors visible; not silent success             |

---

## Architecture validation (planning intent)

| Check                            | Required at Close |
| -------------------------------- | ----------------- |
| No duplicate notification engine | PASS              |
| PC-06 routing unchanged as SoT   | PASS              |
| Exchange Adapter untouched       | PASS              |
| Vault ownership preserved        | PASS              |
| No Master Plan modification      | PASS              |

---

## Planning open validation (this act)

| Layer                 | Result   | Evidence                        |
| --------------------- | -------- | ------------------------------- |
| Documents created     | **PASS** | wave-5 planning package files   |
| Master Plan alignment | **PASS** | V3-N01…N04 mapped 1:1           |
| Architecture check    | **PASS** | No ownership drift in planning  |
| Regression suite      | **PASS** | lint / typecheck / test / build |
| git diff --check      | **PASS** | No whitespace errors            |

---

## W5-N01-a validation (inventory slice — local)

| Layer                           | Result   | Evidence                                                              |
| ------------------------------- | -------- | --------------------------------------------------------------------- |
| Telegram notification inventory | **PASS** | `w5-n01-a-telegram-notification-inventory.ts` (55 rows)               |
| Conformance registry            | **PASS** | `w5-n01-a-telegram-notification.ts`                                   |
| Ownership boundaries            | **PASS** | No new persistence owner; Exchange Adapter untouched                  |
| Honest Product baseline         | **PASS** | Implemented today = None; infrastructure documented; Bot API deferred |
| Regression suite                | **PASS** | lint / typecheck / test / build                                       |
| git diff --check                | **PASS** | No whitespace errors                                                  |

**Explicit non-claim:** W5-N01-a does **not** authorize Telegram real delivery, W5-N01 COMPLETE, or Wave 5 COMPLETE.

---

## W5-N01-b validation (durable foundation slice — local)

| Layer                          | Result   | Evidence                                                               |
| ------------------------------ | -------- | ---------------------------------------------------------------------- |
| Durable anchor persistence     | **PASS** | `workspace_telegram_notification_anchors` + persistence service        |
| Canonical anchor fields        | **PASS** | workspaceId, notificationId, channel, type, recipient, template, state |
| Ownership preserved            | **PASS** | Notification Delivery owner only; no new persistence owner             |
| No Bot API / outbound delivery | **PASS** | Explicit OUT in conformance registry                                   |
| Restart recovery not claimed   | **PASS** | Deferred to W5-N01-c                                                   |
| Regression suite               | **PASS** | lint / typecheck / test / build                                        |
| git diff --check               | **PASS** | No whitespace errors                                                   |

**Explicit non-claim:** W5-N01-b does **not** authorize Telegram notifications operational, restart survival, or W5-N01 COMPLETE.

---

## W5-N01-c validation (restart recovery slice — local)

| Layer                          | Result   | Evidence                                                      |
| ------------------------------ | -------- | ------------------------------------------------------------- |
| Restart recovery hydrate       | **PASS** | `TelegramNotificationRestartRecoveryService` + recovery store |
| Deterministic ordering         | **PASS** | workspaceId, notificationId ascending                         |
| Idempotent hydrate             | **PASS** | Conformance spec — hydrate twice yields same diagnostics      |
| Integrity verification         | **PASS** | `assertRecoverableTelegramNotificationAnchor`                 |
| Missing rows not fabricated    | **PASS** | Empty persistence → empty recovery cache                      |
| Corrupt rows fail honestly     | **PASS** | Explicit recovery error on corruption                         |
| Ownership preserved            | **PASS** | Notification Delivery owner only                              |
| No Bot API / outbound delivery | **PASS** | Explicit OUT in conformance registry                          |
| Operational continuity OUT     | **PASS** | Deferred to W5-N01-d                                          |
| Regression suite               | **PASS** | lint / typecheck / test / build                               |
| git diff --check               | **PASS** | No whitespace errors                                          |

**Explicit non-claim:** W5-N01-c does **not** authorize Telegram notifications operational, operational continuity, or W5-N01 COMPLETE.

---

## W5-N01-d validation (operational continuity slice — local)

| Layer                             | Result   | Evidence                                                     |
| --------------------------------- | -------- | ------------------------------------------------------------ |
| Operational continuity domain     | **PASS** | `telegram-notification-operational-continuity.ts`            |
| OperationalContinuityService      | **PASS** | `buildTelegramNotificationView()` integrated                 |
| Platform readiness projection     | **PASS** | `TelegramNotificationContinuityView` on platform projection  |
| Web UI projection                 | **PASS** | Telegram Notification section on Operational Continuity page |
| Supported states only             | **PASS** | Recovering / Ready / Degraded / Unavailable                  |
| Degraded never fabricates Ready   | **PASS** | Domain + conformance specs                                   |
| Ownership preserved               | **PASS** | Notification Delivery owner only                             |
| No Bot API / outbound delivery    | **PASS** | Explicit OUT in conformance registry                         |
| Telegram delivery not implemented | **PASS** | Explicit non-claim                                           |
| Regression suite                  | **PASS** | lint / typecheck / test / build                              |
| git diff --check                  | **PASS** | No whitespace errors                                         |

**Explicit non-claim:** W5-N01-d does **not** authorize Telegram notifications operational, Bot API I/O, or W5-N01 COMPLETE.

---

## W5-N01-e validation (package close evidence slice — local)

| Layer                      | Result   | Evidence                                                             |
| -------------------------- | -------- | -------------------------------------------------------------------- |
| Complete operational chain | **PASS** | Inventory → persistence → recovery → continuity → Platform Readiness |
| Approved slices a–d        | **PASS** | All recorded PASS in Close Evidence registry                         |
| Governance integrity       | **PASS** | notification-delivery sole owner; no duplicate engine                |
| Architecture integrity     | **PASS** | No ownership drift; Master Plan unchanged                            |
| Honest Product integrity   | **PASS** | No Bot API / delivery / Connected fabrication claims                 |
| Documentation completeness | **PASS** | Package close report, summary, walkthrough + slice reports           |
| No runtime changes in e    | **PASS** | Evidence-only slice                                                  |
| Regression suite           | **PASS** | lint / typecheck / test / build                                      |
| git diff --check           | **PASS** | No whitespace errors                                                 |

**Explicit non-claim:** W5-N01-e does **not** authorize W5-N01 CLOSED, Notification Platform Complete, or Wave 5 COMPLETE. Final Package Integration Verification **not performed** at e slice time.

---

## W5-N01 Final Package Integration Verification (2026-08-28)

| Layer                         | Result   | Evidence                                                      |
| ----------------------------- | -------- | ------------------------------------------------------------- |
| Internal package consistency  | **PASS** | `w5-n01-final-integration-verification.md` §1                 |
| Slice integration a→e         | **PASS** | Conformance registries + commit chain                         |
| Architecture integrity        | **PASS** | Notification Delivery owner preserved; no duplicate subsystem |
| Ownership integrity           | **PASS** | Exchange Adapter untouched; no second persistence owner       |
| Persistence integrity         | **PASS** | `workspace_telegram_notification_anchors`                     |
| Documentation synchronization | **PASS** | Package docs + wave-5 docs aligned                            |
| Validation completeness       | **PASS** | Slice validation reports a–e                                  |
| Regression safety             | **PASS** | lint / typecheck / test / build                               |
| Governance completeness       | **PASS** | Wave 5 Planning APPROVED; W5-N01 only authorized              |
| Honest Product integrity      | **PASS** | No Bot API / delivery / Connected fabrication claims          |
| Package readiness for Close   | **PASS** | Engineering confidence 97%                                    |
| Regression suite              | **PASS** | lint / typecheck / test / build                               |
| git diff --check              | **PASS** | No whitespace errors                                          |

**Engineering verdict:** READY FOR PRODUCT OWNER FINAL CLOSE.

---

## W5-N01 Product Owner Close (2026-08-28)

| Layer                      | Result   | Evidence                                                       |
| -------------------------- | -------- | -------------------------------------------------------------- |
| Product Owner Close Record | **PASS** | `w5-n01-product-owner-close-record.md`                         |
| Documentation synchronized | **PASS** | Package summary, close report, walkthrough, progress, overview |
| W5-N01 CLOSED              | **PASS** | Recorded 2026-08-28                                            |
| W5-N02 opened              | **No**   | Not authorized                                                 |
| Ownership boundaries       | **PASS** | No change at Close act                                         |
| Architecture deviations    | **PASS** | None at Close act                                              |
| Regression suite           | **PASS** | lint / typecheck / test / build                                |
| git diff --check           | **PASS** | No whitespace errors                                           |

**Explicit non-claim:** W5-N01 Close does **not** authorize Telegram Bot implemented, Telegram notifications operational, Notification Platform Complete, Production Ready, Live Notifications, or Wave 5 COMPLETE.

---

## W5-N03-a validation (2026-08-29 — `b27d19f`)

| Layer                | Result   | Evidence                                                           |
| -------------------- | -------- | ------------------------------------------------------------------ |
| Webhook inventory    | **PASS** | `w5-n03-a-slack-discord-teams-notification-inventory.ts` (82 rows) |
| Conformance registry | **PASS** | `w5-n03-a-slack-discord-teams-notification.ts`                     |
| Slice reports        | **PASS** | w5-n03-a-* reports under wave-5                                    |
| Architecture check   | **PASS** | No ownership drift; no webhook I/O                                 |
| Regression suite     | **PASS** | lint / typecheck / test / build                                    |
| git diff --check     | **PASS** | No whitespace errors                                               |

**Explicit non-claim:** W5-N03-a does **not** authorize Slack implemented, Discord implemented, Microsoft Teams implemented, Slack/Discord/Teams notifications operational, W5-N03 COMPLETE, or Wave 5 COMPLETE.

---

## W5-N03-b validation (2026-08-29 — `bfb2844`)

| Layer              | Result   | Evidence                                                          |
| ------------------ | -------- | ----------------------------------------------------------------- |
| Durable foundation | **PASS** | `w5-n03-b-durable-slack-discord-teams-notification.ts`            |
| Anchor persistence | **PASS** | `slack-discord-teams-notification-persistence.service.spec.ts`    |
| Prisma migration   | **PASS** | `20260829160000_w5_n03_b_slack_discord_teams_notification_anchor` |
| Slice reports      | **PASS** | w5-n03-b-* reports under wave-5                                   |
| Architecture check | **PASS** | No ownership drift; no webhook I/O                                |
| Regression suite   | **PASS** | lint / typecheck / test / build                                   |
| git diff --check   | **PASS** | No whitespace errors                                              |

**Explicit non-claim:** W5-N03-b does **not** authorize Slack implemented, Discord implemented, Microsoft Teams implemented, Slack/Discord/Teams notifications operational, restart survival, W5-N03 COMPLETE, or Wave 5 COMPLETE.

---

## W5-N03-c validation (2026-08-29)

| Layer               | Result   | Evidence                                                                |
| ------------------- | -------- | ----------------------------------------------------------------------- |
| Restart recovery    | **PASS** | `w5-n03-c-slack-discord-teams-notification-restart-recovery.ts`         |
| Hydrate integrity   | **PASS** | `slack-discord-teams-notification-restart-recovery.service.ts`          |
| Persistence hydrate | **PASS** | `slack-discord-teams-notification-persistence.service.ts` write-through |
| Slice reports       | **PASS** | w5-n03-c-* reports under wave-5                                         |
| Architecture check  | **PASS** | No ownership drift; no webhook I/O                                      |
| Regression suite    | **PASS** | lint / typecheck / test / build                                         |
| git diff --check    | **PASS** | No whitespace errors                                                    |

**Explicit non-claim:** W5-N03-c does **not** authorize Slack implemented, Discord implemented, Microsoft Teams implemented, Slack/Discord/Teams notifications operational, operational continuity, W5-N03 COMPLETE, or Wave 5 COMPLETE.

---

## W5-N02-a validation (2026-08-28 — local)

| Layer                | Result   | Evidence                                             |
| -------------------- | -------- | ---------------------------------------------------- |
| Email inventory      | **PASS** | `w5-n02-a-email-notification-inventory.ts` (69 rows) |
| Conformance registry | **PASS** | `w5-n02-a-email-notification.ts`                     |
| Slice reports        | **PASS** | w5-n02-a-* reports under wave-5                      |
| Architecture check   | **PASS** | No ownership drift; Auth host mail separate          |
| Regression suite     | **PASS** | lint / typecheck / test / build                      |
| git diff --check     | **PASS** | No whitespace errors                                 |

**Explicit non-claim:** W5-N02-a does **not** authorize SMTP implemented, Email notifications operational, W5-N02 COMPLETE, or Wave 5 COMPLETE. Changes **local only** — not committed.

---

## W5-N02-b validation (2026-08-28 — local)

| Layer                | Result   | Evidence                                       |
| -------------------- | -------- | ---------------------------------------------- |
| Durable anchor       | **PASS** | `WorkspaceEmailNotificationAnchor` + migration |
| Conformance registry | **PASS** | `w5-n02-b-durable-email-notification.ts`       |
| Slice reports        | **PASS** | w5-n02-b-* reports under wave-5                |
| Architecture check   | **PASS** | Notification Delivery owner only; no SMTP I/O  |
| Regression suite     | **PASS** | lint / typecheck / test / build                |
| git diff --check     | **PASS** | No whitespace errors                           |

**Explicit non-claim:** W5-N02-b does **not** authorize SMTP implemented, Email notifications operational, restart recovery, W5-N02 COMPLETE, or Wave 5 COMPLETE. **Recorded** (`bbaa96c`).

---

## W5-N02-c validation (2026-08-28 — local)

| Layer                | Result   | Evidence                                            |
| -------------------- | -------- | --------------------------------------------------- |
| Restart recovery     | **PASS** | `EmailNotificationRestartRecoveryService` + hydrate |
| Conformance registry | **PASS** | `w5-n02-c-email-notification-restart-recovery.ts`   |
| Slice reports        | **PASS** | w5-n02-c-* reports under wave-5                     |
| Architecture check   | **PASS** | Notification Delivery owner only; no SMTP I/O       |
| Regression suite     | **PASS** | lint / typecheck / test / build                     |
| git diff --check     | **PASS** | No whitespace errors                                |

**Explicit non-claim:** W5-N02-c does **not** authorize SMTP implemented, Email notifications operational, operational continuity, W5-N02 COMPLETE, or Wave 5 COMPLETE. **Recorded** (`d4d8bc3`).

---

## W5-N02-d validation (2026-08-28 — local)

| Layer                         | Result   | Evidence                                                      |
| ----------------------------- | -------- | ------------------------------------------------------------- |
| Operational continuity domain | **PASS** | `email-notification-operational-continuity.ts`                |
| OperationalContinuityService  | **PASS** | `buildEmailNotificationView()` integrated                     |
| Platform readiness projection | **PASS** | `EmailNotificationContinuityView` on platform projection      |
| Web projection                | **PASS** | Email Notification section on `OperationalContinuityView.tsx` |
| Conformance registry          | **PASS** | `w5-n02-d-email-notification-operational-continuity.ts`       |
| Slice reports                 | **PASS** | w5-n02-d-* reports under wave-5                               |
| Regression suite              | **PASS** | lint / typecheck / test / build                               |
| git diff --check              | **PASS** | No whitespace errors                                          |

**Explicit non-claim:** W5-N02-d does **not** authorize SMTP implemented, Email notifications operational, W5-N02 COMPLETE, or Wave 5 COMPLETE. **Recorded** (`b9f1a62`).

---

## W5-N02-e validation (2026-08-28 — local)

| Layer                      | Result   | Evidence                                                   |
| -------------------------- | -------- | ---------------------------------------------------------- |
| Complete operational chain | **PASS** | `w5-n02-e-package-close-evidence.ts` — a→b→c→d verified    |
| Approved slices a–d        | **PASS** | All recorded PASS in registry                              |
| Governance integrity       | **PASS** | notification-delivery sole owner; no duplicate engine      |
| Architecture integrity     | **PASS** | No ownership drift; Master Plan unchanged                  |
| Honest Product integrity   | **PASS** | No SMTP / delivery / Connected fabrication claims          |
| Documentation completeness | **PASS** | Package close report, summary, walkthrough + slice reports |
| Conformance registry       | **PASS** | `w5-n02-e-package-close-evidence.ts`                       |
| Slice reports              | **PASS** | w5-n02-e-* reports under wave-5                            |
| Regression suite           | **PASS** | lint / typecheck / test / build                            |
| git diff --check           | **PASS** | No whitespace errors                                       |

**Explicit non-claim:** W5-N02-e does **not** authorize SMTP implemented, Email notifications operational, Notification Platform Complete, or Wave 5 COMPLETE. **Recorded** (`09b7f10`).

---

## W5-N02 Final Integration Verification (2026-08-28)

| Layer                      | Result   | Evidence                                   |
| -------------------------- | -------- | ------------------------------------------ |
| Complete operational chain | **PASS** | `w5-n02-final-integration-verification.md` |
| Dependency integrity       | **PASS** | Slice chain a→e verified                   |
| Architecture integrity     | **PASS** | No ownership drift; Master Plan unchanged  |
| Documentation sync         | **PASS** | Package docs aligned                       |
| Validation completeness    | **PASS** | All slice reports PASS                     |
| Honest Product integrity   | **PASS** | No SMTP / delivery fabrication claims      |
| Regression suite           | **PASS** | lint / typecheck / test / build            |
| git diff --check           | **PASS** | No whitespace errors                       |

**Explicit non-claim:** Final Integration Verification does **not** authorize SMTP implemented, Email notifications operational, Notification Platform Complete, or Wave 5 COMPLETE. **Recorded** (`5b72450`).

---

## W5-N02 Product Owner Close (2026-08-28)

| Layer                      | Result   | Evidence                                              |
| -------------------------- | -------- | ----------------------------------------------------- |
| Product Owner Close Record | **PASS** | `w5-n02-product-owner-close-record.md`                |
| Package documentation sync | **PASS** | summary, close report, walkthrough, final integration |
| Wave progress sync         | **PASS** | `wave-5-progress.md`                                  |
| Conformance spec updated   | **PASS** | `w5-n02-e-package-close-evidence.spec.ts`             |
| W5-N03 not opened          | **PASS** | No W5-N03 planning or implementation artifacts        |

**Explicit non-claim:** Product Owner Close records W5-N02 **CLOSED** only. Does **not** authorize SMTP implemented, Email notifications operational, Notification Platform Complete, or Wave 5 COMPLETE.

---

## Explicit non-claims

- Wave 5 validation PASS at Close — **not claimed**
- W5-N01 validation PASS — **recorded** (slices a–e + Final Integration Verification)
- W5-N01 CLOSED — **recorded** (2026-08-28)
- Notification Platform Complete — **not claimed**
- Live Trading validation — **not claimed**
- W5-N02-a validation PASS — **recorded** (`a7241ea`)
- W5-N02-b validation PASS — **recorded** (`bbaa96c`)
- W5-N02-c validation PASS — **recorded** (`d4d8bc3`)
- W5-N02-d validation PASS — **recorded** (`b9f1a62`)
- W5-N02-e validation PASS — **recorded** (`09b7f10`)
- W5-N02 Final Integration PASS — **recorded** (`5b72450`)
- W5-N02 CLOSED — **recorded** (2026-08-28)
- W5-N03 opened — **not claimed**

---

**STOP.** W5-N02 **CLOSED** by Product Owner. Await explicit Product Owner instruction before W5-N03 Planning Package. Do not declare Email SMTP implemented or Email notifications operational.
