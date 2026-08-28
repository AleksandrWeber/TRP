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

## Explicit non-claims

- Wave 5 validation PASS at Close — **not claimed**
- W5-N01 validation PASS — **not claimed**
- Package Final Integration Verification — **not claimed**
- Live Trading validation — **not claimed**

---

**STOP.** Planning **OPEN** only. Package validation runs only after approved implementation.
