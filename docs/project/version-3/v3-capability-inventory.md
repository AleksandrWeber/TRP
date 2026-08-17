# Version 3 Capability Inventory

**Document:** Version 3 Capability Inventory
**Date:** 2026-08-16
**Status:** Annex — planning **FROZEN** in [`version-3-master-plan.md`](./version-3-master-plan.md)

Readiness scale (binding):

| %       | Meaning                          |
| ------- | -------------------------------- |
| **100** | Already implemented in Version 2 |
| **75**  | Mostly reusable                  |
| **50**  | Partially reusable               |
| **25**  | Major implementation required    |
| **0**   | Does not exist                   |

Priority: **Critical** / **High** / **Medium** / **Low**.
Complexity: **S** / **M** / **L** / **XL**.

Dashboard compact view: [`v3-readiness-dashboard.md`](./v3-readiness-dashboard.md).

---

## Part 2 — Capability catalog

For each capability: name, purpose, business value, dependencies, priority, complexity, readiness, wave, justification.

### Security Platform

#### SEC-01 Authentication

| Field          | Value                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Purpose        | Prove who the operator is, with production-grade credentials and optional MFA.                             |
| Business value | Stops shared/dev identity from standing in front of financial assets.                                      |
| Dependencies   | PC-18 durable `User.passwordHash`; JWT; US158 secret-length checks (TD-005 partial).                       |
| Priority       | Critical                                                                                                   |
| Complexity     | M                                                                                                          |
| Readiness      | **50%**                                                                                                    |
| Wave           | 1 (V3-S01)                                                                                                 |
| Justification  | Login exists and survives restart. MFA, lockout, password policy, and production session hardening do not. |

#### SEC-02 Authorization

| Field          | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Purpose        | Every command is allowed only for the right role in the right workspace.                               |
| Business value | Least privilege on deploy, connect, and live actions.                                                  |
| Dependencies   | `RolesGuard`, `CommandAuthorizationService`, `WorkspaceAccessService` (TD-006 partial).                |
| Priority       | Critical                                                                                               |
| Complexity     | M                                                                                                      |
| Readiness      | **50%**                                                                                                |
| Wave           | 1 (V3-S02)                                                                                             |
| Justification  | Trading commands are gated; remaining surfaces and a customer-visible permission model are incomplete. |

#### SEC-03 RBAC

| Field          | Value                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Purpose        | Productize existing roles: Reader, Researcher, Trader, Admin.                                             |
| Business value | Teams can separate research from capital without inventing a new IAM product.                             |
| Dependencies   | `Role` enum; Identity mapping; Workspace membership.                                                      |
| Priority       | Critical                                                                                                  |
| Complexity     | M                                                                                                         |
| Readiness      | **50%**                                                                                                   |
| Wave           | 1 (V3-S02)                                                                                                |
| Justification  | Roles exist in code. There is no operator product to assign, review, or audit them as a security feature. |

#### SEC-04 ABAC (evaluated)

| Field          | Value                                                                                                                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose        | Attribute-based engine (user, resource, environment).                                                                                                                                                                                                            |
| Business value | Only if RBAC + existing gates cannot express live conditions.                                                                                                                                                                                                    |
| Dependencies   | SEC-03; Runtime Enforcement Gate; workspace live flag; Kill Switch.                                                                                                                                                                                              |
| Priority       | Low                                                                                                                                                                                                                                                              |
| Complexity     | L                                                                                                                                                                                                                                                                |
| Readiness      | **0%**                                                                                                                                                                                                                                                           |
| Wave           | **Deferred — not justified as an engine**                                                                                                                                                                                                                        |
| Justification  | Live conditions (certified, gated, live-enabled, kill-switch off, venue permission) are attributes already enforced by existing owners. A general ABAC product would redesign IAM without a demonstrated gap. Revisit only if Wave 6 policy cannot be expressed. |

#### SEC-05 Session Management

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Purpose        | Issue, refresh, revoke, and expire sessions.                               |
| Business value | Stolen tokens and departed users cannot keep trading.                      |
| Dependencies   | JWT auth module.                                                           |
| Priority       | Critical                                                                   |
| Complexity     | M                                                                          |
| Readiness      | **25%**                                                                    |
| Wave           | 1 (V3-S01)                                                                 |
| Justification  | JWT exists. No operator revocation, rotation, or device/session inventory. |

#### SEC-06 Secret Vault

| Field          | Value                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Purpose        | Store customer integration secrets outside `.env`.                                                          |
| Business value | SaaS and self-serve connections become possible.                                                            |
| Dependencies   | New justified module; Workspace; encryption (SEC-07).                                                       |
| Priority       | Critical                                                                                                    |
| Complexity     | L                                                                                                           |
| Readiness      | **0%**                                                                                                      |
| Wave           | 1 (V3-S03)                                                                                                  |
| Justification  | Connection audit: no Secret Manager, no Prisma secret models. Cannot reuse ExchangeConnection (state only). |

#### SEC-07 Credential Encryption

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Purpose        | Secrets at rest are not application plaintext.                                               |
| Business value | Limits blast radius of database theft.                                                       |
| Dependencies   | SEC-06; platform wrapping key (KMS or equivalent — infrastructure choice at implementation). |
| Priority       | Critical                                                                                     |
| Complexity     | M                                                                                            |
| Readiness      | **0%**                                                                                       |
| Wave           | 1 (V3-S03)                                                                                   |
| Justification  | Only login passwords are bcrypt. OpenRouter and `DATABASE_URL` are plaintext env.            |

#### SEC-08 OWASP / API Security

| Field          | Value                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose        | Default-on protections: validation, encoding, rate limit, CSRF, XSS, SSRF, injection, secure cookies, CSP, replay protection on financial APIs.                                        |
| Business value | Request tampering, XSS, SSRF (webhooks), and injection are primary Version 3 threats.                                                                                                  |
| Dependencies   | helmet, `@fastify/rate-limit`, Throttler, ValidationPipe (US113).                                                                                                                      |
| Priority       | Critical                                                                                                                                                                               |
| Complexity     | L                                                                                                                                                                                      |
| Readiness      | **50%**                                                                                                                                                                                |
| Wave           | 1 (V3-S04); financial replay completes in Wave 6 (V3-L05)                                                                                                                              |
| Justification  | Baseline exists; production CSP is env-gated; CSRF/cookie posture, SSRF allowlists, and financial replay/nonces are not a product. Detail: [Security Vision](./v3-security-vision.md). |

#### SEC-09 Audit Trail

| Field          | Value                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Purpose        | Append-only log of security and admin actions.                                                                                     |
| Business value | Forensics and non-repudiation.                                                                                                     |
| Dependencies   | Identity; Outbox pattern (reuse, not a second ledger).                                                                             |
| Priority       | Critical                                                                                                                           |
| Complexity     | M                                                                                                                                  |
| Readiness      | **25%**                                                                                                                            |
| Wave           | 1 (V3-S05)                                                                                                                         |
| Justification  | Request logs and recovery incidents exist. There is no customer/admin audit product covering authz, vault, and connection changes. |

#### SEC-10 Financial Action Logging

| Field          | Value                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Purpose        | Every live (and optionally paper) place/cancel/kill is attributable and ordered.                           |
| Business value | Fraud detection and dispute evidence.                                                                      |
| Dependencies   | SEC-09; Orders; Execution; Wave 6 live path.                                                               |
| Priority       | Critical                                                                                                   |
| Complexity     | M                                                                                                          |
| Readiness      | **25%**                                                                                                    |
| Wave           | 6 (V3-L03)                                                                                                 |
| Justification  | Ledger is financial SoT for positions/cash. It is not a full operator audit of who initiated a live order. |

#### SEC-11 Workspace Isolation

| Field          | Value                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Purpose        | Credentials, orders, and research of workspace A are invisible to B.                                                        |
| Business value | Team and SaaS safety.                                                                                                       |
| Dependencies   | PC-14; WorkspaceAccessService.                                                                                              |
| Priority       | Critical                                                                                                                    |
| Complexity     | M                                                                                                                           |
| Readiness      | **75%**                                                                                                                     |
| Wave           | 1 (V3-S06); remainder Wave 9                                                                                                |
| Justification  | Membership checks exist. Global OpenRouter key and process-global adapters violate isolation for secrets and venue objects. |

#### SEC-12 Credential Rotation

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Purpose        | Replace a secret without destroying connection metadata. |
| Business value | Limits stolen-key window.                                |
| Dependencies   | SEC-06; Connection Management.                           |
| Priority       | High                                                     |
| Complexity     | M                                                        |
| Readiness      | **0%**                                                   |
| Wave           | 2 (V3-C04)                                               |
| Justification  | Audit: no rotate/replace/invalidate flow.                |

#### SEC-13 Security Monitoring

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Purpose        | Detect auth abuse, vault failures, anomalous financial commands. |
| Business value | Incident response before loss.                                   |
| Dependencies   | SEC-09; MN-02.                                                   |
| Priority       | High                                                             |
| Complexity     | M                                                                |
| Readiness      | **0%**                                                           |
| Wave           | 3 (V3-O05)                                                       |
| Justification  | No security monitoring product.                                  |

#### SEC-14 Incident Logging

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Purpose        | Durable incidents for ambiguity, auth attacks, and kill-switch trips.              |
| Business value | Operators can reconstruct failures.                                                |
| Dependencies   | US293 durable Incident on recovery (partial).                                      |
| Priority       | High                                                                               |
| Complexity     | S                                                                                  |
| Readiness      | **50%**                                                                            |
| Wave           | 1 (V3-S05)                                                                         |
| Justification  | Recovery incidents exist. Security/connection incidents are not a unified product. |

#### SEC-15 Security Health Dashboard

| Field          | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Purpose        | One view: MFA coverage, vault status, stale keys, CSP/rate-limit mode, open incidents. |
| Business value | Makes security operable, not tribal knowledge.                                         |
| Dependencies   | SEC-06, SEC-13, MN-01.                                                                 |
| Priority       | High                                                                                   |
| Complexity     | M                                                                                      |
| Readiness      | **0%**                                                                                 |
| Wave           | 3 (V3-O05)                                                                             |
| Justification  | Does not exist.                                                                        |

#### SEC-16 Tamper-evident financial operations

| Field          | Value                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Purpose        | Live financial audit records are append-only and integrity-protected.                                        |
| Business value | Fraud and order-manipulation resistance.                                                                     |
| Dependencies   | SEC-10; Ledger immutability pattern.                                                                         |
| Priority       | Critical                                                                                                     |
| Complexity     | L                                                                                                            |
| Readiness      | **25%**                                                                                                      |
| Wave           | 6 (V3-L03)                                                                                                   |
| Justification  | Append-only Ledger is a start. Operator action log with integrity (hash chain or equivalent) does not exist. |

---

### Connection Management & Exchange Connectivity

#### CM-01 Unified Connection Management product

| Field          | Value                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Purpose        | Single operator place for every external integration.                                                        |
| Business value | Replaces scattered env, simulated connect, and reserved placeholders.                                        |
| Dependencies   | Vault; existing owners (adapter, notification, AI gateway, market data).                                     |
| Priority       | Critical                                                                                                     |
| Complexity     | L                                                                                                            |
| Readiness      | **25%**                                                                                                      |
| Wave           | 2 (V3-C01)                                                                                                   |
| Justification  | Fragments exist; the product does not. Audit verdict: Version 2 does not have unified Connection Management. |

#### CM-02 Connection Wizard

| Field          | Value                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| Purpose        | Guided collect of only the fields that integration needs.                       |
| Business value | No SSH, no `.env`, no rebuild.                                                  |
| Dependencies   | Telegram wizard UX (pattern reuse); vault.                                      |
| Priority       | Critical                                                                        |
| Complexity     | M                                                                               |
| Readiness      | **25%**                                                                         |
| Wave           | 2 (V3-C02)                                                                      |
| Justification  | Telegram wizard is the only guided connect; it never collects a real bot token. |

#### CM-03 Connection Testing

| Field          | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Purpose        | Operator-triggered real round-trip to the vendor.                                     |
| Business value | Fail before live orders or silent “connected”.                                        |
| Dependencies   | Adapters; vault.                                                                      |
| Priority       | Critical                                                                              |
| Complexity     | M                                                                                     |
| Readiness      | **25%**                                                                               |
| Wave           | 2 (V3-C03); real venue tests complete in Wave 4                                       |
| Justification  | Telegram test is in-memory. Exchange ping is a constant 5 ms. OpenRouter has no ping. |

#### CM-04 Health Monitoring

| Field          | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Purpose        | Ongoing Connected / Disconnected / Error / Expired / Permission.                       |
| Business value | Operators see credential and vendor failure, not Cluster labels.                       |
| Dependencies   | CM-01; venue permission APIs (Wave 4).                                                 |
| Priority       | High                                                                                   |
| Complexity     | M                                                                                      |
| Readiness      | **25%**                                                                                |
| Wave           | 2 (V3-C03)                                                                             |
| Justification  | Simulated status enum and unused `GET /v1/market/health`. No expired/permission model. |

#### CM-05 Workspace-scoped credentials

| Field          | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Purpose        | Different workspaces hold different vendor keys.                                      |
| Business value | Team and tenant isolation of money-moving secrets.                                    |
| Dependencies   | SEC-06, SEC-11.                                                                       |
| Priority       | Critical                                                                              |
| Complexity     | M                                                                                     |
| Readiness      | **25%**                                                                               |
| Wave           | 2 (V3-C04)                                                                            |
| Justification  | ExchangeConnection is per workspace but stores no keys. OpenRouter is process-global. |

#### CM-06 No customer `.env` dependency

| Field          | Value                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose        | Customers never edit process env for integrations.                                                                                                                      |
| Business value | Hosted and self-serve operation.                                                                                                                                        |
| Dependencies   | Vault; wizards; runtime reload of secrets without full process restart where feasible.                                                                                  |
| Priority       | Critical                                                                                                                                                                |
| Complexity     | M                                                                                                                                                                       |
| Readiness      | **0%**                                                                                                                                                                  |
| Wave           | 2 (V3-C04)                                                                                                                                                              |
| Justification  | OpenRouter, market-data provider, and live WS flag all require env + restart. Platform infra (`DATABASE_URL`) may remain host env — that is not a customer integration. |

#### CM-07 Binance connectivity

| Field          | Value                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose        | Public data + trading credentials + real I/O as offered.                                                                                                    |
| Business value | First market becomes a real connection, not four disconnected surfaces.                                                                                     |
| Dependencies   | Existing public REST/WS, dataset import, stub trading adapter, Exchange Scope `binance`.                                                                    |
| Priority       | Critical                                                                                                                                                    |
| Complexity     | L                                                                                                                                                           |
| Readiness      | **50%**                                                                                                                                                     |
| Wave           | 4 (V3-E01); collection in Wave 2                                                                                                                            |
| Justification  | Public paths are partial (no customer UI). Trading is simulated without keys. Unify under Connection Management; do not merge market-data and trading SoTs. |

#### CM-08 Bybit connectivity

| Field          | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Purpose        | Real Bybit adapter I/O with vault credentials.          |
| Business value | Second venue without cloning the engine (RC-27).        |
| Dependencies   | Stub `BYBIT` adapter; vault; factory.                   |
| Priority       | High                                                    |
| Complexity     | L                                                       |
| Readiness      | **25%**                                                 |
| Wave           | 4 (V3-E02)                                              |
| Justification  | Same stub as Binance trading. No keys, no live REST/WS. |

#### CM-09 OKX connectivity

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Purpose        | Real OKX adapter I/O with vault credentials. |
| Business value | Third catalogued venue.                      |
| Dependencies   | Stub `OKX` adapter; vault; factory.          |
| Priority       | High                                         |
| Complexity     | L                                            |
| Readiness      | **25%**                                      |
| Wave           | 4 (V3-E03)                                   |
| Justification  | Identical to Bybit: stub only.               |

#### CM-10 Kraken connectivity

| Field          | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| Purpose        | First new factory adapter for a catalog label that has no client.                        |
| Business value | Proves “markets as plugins” without a rewrite.                                           |
| Dependencies   | `EXCHANGE_SCOPE_VENUE_CODES` includes `kraken` with `liveAdapter: false`.                |
| Priority       | Medium                                                                                   |
| Complexity     | L                                                                                        |
| Readiness      | **0%**                                                                                   |
| Wave           | 4 (V3-E04)                                                                               |
| Justification  | Label only. No adapter, REST, or WS. Add through Exchange Factory — do not fork Runtime. |

#### CM-11 Telegram (production)

| Field          | Value                                                             |
| -------------- | ----------------------------------------------------------------- |
| Purpose        | Real Bot API connect / test / receive. Still not a control plane. |
| Business value | Operators get real alerts.                                        |
| Dependencies   | PC-07 wizard; Notification Delivery port; TD-049.                 |
| Priority       | High                                                              |
| Complexity     | M                                                                 |
| Readiness      | **50%**                                                           |
| Wave           | 5 (V3-N01)                                                        |
| Justification  | Product UX and routing exist. Transport is in-memory.             |

#### CM-12 Email (SMTP)

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Purpose        | Activate reserved Email channel with vaulted SMTP.               |
| Business value | Universal operator channel.                                      |
| Dependencies   | Catalog labels; reserved adapter; vault; SSRF/SMTP allow policy. |
| Priority       | High                                                             |
| Complexity     | M                                                                |
| Readiness      | **25%**                                                          |
| Wave           | 5 (V3-N02)                                                       |
| Justification  | UI lists fields as “Not offered”. No transport.                  |

#### CM-13 Slack · CM-14 Discord · CM-15 Microsoft Teams

Same pattern: reserved catalog, webhook labels, no storage, no SDK.

| Field          | Slack / Discord / Teams                      |
| -------------- | -------------------------------------------- |
| Purpose        | Webhook delivery on existing routing.        |
| Business value | Team chat operations.                        |
| Dependencies   | PC-07 reserved pages; vault; SSRF allowlist. |
| Priority       | Medium                                       |
| Complexity     | M                                            |
| Readiness      | **25%**                                      |
| Wave           | 5 (V3-N03)                                   |
| Justification  | Identical reserved-inactive implementation.  |

#### CM-16 Push

| Field          | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Purpose        | Browser/device push for attention events.                                             |
| Business value | Operator mobility.                                                                    |
| Dependencies   | Catalog; device-token store (new, justified under notification); vault for VAPID/FCM. |
| Priority       | Medium                                                                                |
| Complexity     | M                                                                                     |
| Readiness      | **25%**                                                                               |
| Wave           | 5 (V3-N04)                                                                            |
| Justification  | Labels only. No FCM/APNs/Web Push.                                                    |

#### CM-17 OpenRouter (customer keys)

| Field          | Value                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| Purpose        | Per-workspace OpenRouter key in vault; test; disconnect.                      |
| Business value | AI assistance without a shared host key.                                      |
| Dependencies   | `OpenRouterProvider`; AI Gateway; vault.                                      |
| Priority       | High                                                                          |
| Complexity     | M                                                                             |
| Readiness      | **50%**                                                                       |
| Wave           | 2 collect (V3-C02); Wave 7 complete (V3-A01)                                  |
| Justification  | Live HTTP provider exists. Key is global `.env`. No UI, no test, no rotation. |

#### CM-18 OpenAI · CM-19 Gemini · CM-20 Anthropic

| Field          | Value                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Purpose        | Optional direct providers behind the existing AI Gateway.                                        |
| Business value | Customer choice; OpenRouter remains default.                                                     |
| Dependencies   | Gateway provider interface; vault; CM-17 pattern.                                                |
| Priority       | Medium                                                                                           |
| Complexity     | M                                                                                                |
| Readiness      | **0%**                                                                                           |
| Wave           | 7 (V3-A02)                                                                                       |
| Justification  | Missing. Default model id `openai/gpt-4o-mini` is an OpenRouter route, not an OpenAI connection. |

#### CM-21 Future provider framework

| Field          | Value                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose        | Catalog + factory + vault schema so a new vendor is an adapter, not a product rewrite.                                                                                             |
| Business value | Binance is the first market, not the ceiling.                                                                                                                                      |
| Dependencies   | Exchange Factory; notification catalog; AI provider interface; Connection Management catalog.                                                                                      |
| Priority       | Medium                                                                                                                                                                             |
| Complexity     | M                                                                                                                                                                                  |
| Readiness      | **50%**                                                                                                                                                                            |
| Wave           | 2 (V3-C01)                                                                                                                                                                         |
| Justification  | Factories and reserved catalogs exist. Connection Management must publish the extension contract. Polygon / Yahoo / Alpaca remain enum-only and are **not** Version 3 Core venues. |

---

### Live Trading

#### LT-01 Live capital path

| Field          | Value                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Purpose        | Opt-in live sessions under Paper-default policy after ADR.                                       |
| Business value | Earned production use of certified strategies.                                                   |
| Dependencies   | ADR; Waves 1–4; Gate; human start; Kill Switch.                                                  |
| Priority       | Critical                                                                                         |
| Complexity     | XL                                                                                               |
| Readiness      | **25%**                                                                                          |
| Wave           | 6 (V3-L01)                                                                                       |
| Justification  | Canonical path already says “paper now; live later via ADR”. Live UI is hidden. Residual TD-052. |

#### LT-02 Live order I/O

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Purpose        | Venue adapters submit/cancel real orders; fills enter existing accounting. |
| Business value | Live is real, not a second ledger.                                         |
| Dependencies   | Wave 4 adapters; Canonical Order Path; Risk Engine.                        |
| Priority       | Critical                                                                   |
| Complexity     | L                                                                          |
| Readiness      | **0%**                                                                     |
| Wave           | 6 (V3-L02)                                                                 |
| Justification  | Adapters throw that live orchestration is required; no keys.               |

#### LT-03 Durable Kill Switch

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Purpose        | Operator halt that survives restart and blocks evaluation/orders.          |
| Business value | Capital preservation overrides profit.                                     |
| Dependencies   | Hidden live-only Kill Switch REST; Runtime admission `kill_switch_active`. |
| Priority       | Critical                                                                   |
| Complexity     | M                                                                          |
| Readiness      | **25%**                                                                    |
| Wave           | 3 (V3-O04)                                                                 |
| Justification  | Domain hooks exist. Product is hidden; durable paper switch is TD-047.     |

#### LT-04 Live operator UI

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Purpose        | Honest Live Bots / live session surfaces after Wave 6.                 |
| Business value | Operators can run live without fake chrome.                            |
| Dependencies   | LT-01, LT-02, PC-19 redirects, Product UI Policy.                      |
| Priority       | High                                                                   |
| Complexity     | M                                                                      |
| Readiness      | **0%**                                                                 |
| Wave           | 6 (V3-L04)                                                             |
| Justification  | `/trading/live` redirects to paper. Must not unhide until I/O is real. |

---

### Notification, AI, Knowledge, Analytics

#### NT-01 Notification product (settings / routing)

| Field          | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Purpose        | Preferences, routing, quiet hours, history.                                      |
| Business value | Already ships in Version 2.                                                      |
| Dependencies   | PC-06.                                                                           |
| Priority       | — (maintain)                                                                     |
| Complexity     | S                                                                                |
| Readiness      | **100%**                                                                         |
| Wave           | Reuse unchanged                                                                  |
| Justification  | Closed Product Completion scope. Version 3 extends transports, not this product. |

#### NT-02 Durable notification queue

| Field          | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Purpose        | Delivery survives restart.                              |
| Business value | Production alerts are not process-local.                |
| Dependencies   | Distinct from resolved paper Outbox (TD-035 vs TD-045). |
| Priority       | High                                                    |
| Complexity     | M                                                       |
| Readiness      | **0%**                                                  |
| Wave           | 3 (V3-O02)                                              |
| Justification  | TD-045. In-process delivery.                            |

#### AI-01 Multi-provider gateway · AI-02 Customer-owned keys

**Not extra inventory rows.** Canonical IDs are **CM-17** (and CM-18…CM-20). Package **V3-A01**. Covered with CM-17…CM-20. Readiness **25%** / **0%**. Wave 7 (collect starts Wave 2).

#### AI-03 AI Analytics product

Readiness **100%**. Reuse unchanged (local narratives from Reporting). May optionally call gateway later; must not become Gate authority.

#### AI-04 AI never controls capital

Readiness **100%** as an invariant. Version 3 **maintains** this; it is not a feature to “implement later”. Tests must keep failing if AI can start sessions or pass the Gate.

#### KN-01 Knowledge Lake product

Readiness **100%**. Reuse unchanged. Never financial SoT.

#### KN-02 Research knowledge durability

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Purpose        | Campaign/knowledge/experiment stores that V2 left in-memory become durable.                    |
| Business value | Knowledge compounds across restarts.                                                           |
| Dependencies   | TD-001, TD-003.                                                                                |
| Priority       | Medium                                                                                         |
| Complexity     | M                                                                                              |
| Readiness      | **25%**                                                                                        |
| Wave           | 7 (V3-A03)                                                                                     |
| Justification  | Research OS works in-process. Version 3 production cannot treat Maps as the knowledge product. |

#### KN-03 Vector search

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Purpose        | Semantic search if deterministic filters fail.                            |
| Business value | Find related experiments.                                                 |
| Dependencies   | TD-007; future README promotion rule.                                     |
| Priority       | Low                                                                       |
| Complexity     | L                                                                         |
| Readiness      | **0%**                                                                    |
| Wave           | 7 optional                                                                |
| Justification  | Do not build RAG because it is fashionable. Promote only if search fails. |

#### AN-01 Reporting product

Readiness **100%**. Reuse. RC-24 ReportRuns.

#### AN-02 Advanced performance metrics

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Purpose        | Sharpe / Sortino / Calmar on existing reports.     |
| Business value | Risk-adjusted evidence.                            |
| Dependencies   | TD-029; Reporting owner.                           |
| Priority       | Medium                                             |
| Complexity     | M                                                  |
| Readiness      | **25%**                                            |
| Wave           | 8 (V3-P03)                                         |
| Justification  | Basic metrics exist. Risk-adjusted metrics do not. |

#### AN-03 Report exporters

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Purpose        | PDF / CSV / HTML export of reports.                           |
| Business value | Share evidence outside the app.                               |
| Dependencies   | TD-031; campaign JSON/CSV export exists as a different slice. |
| Priority       | Medium                                                        |
| Complexity     | S                                                             |
| Readiness      | **0%**                                                        |
| Wave           | 7 (V3-A04)                                                    |
| Justification  | SimulationReport has no exporters.                            |

#### AN-04 Configurable scoring

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Purpose        | Configurable comparison weights.                      |
| Business value | Researchers control scoring without a hidden formula. |
| Dependencies   | TD-030.                                               |
| Priority       | Low                                                   |
| Complexity     | S                                                     |
| Readiness      | **25%**                                               |
| Wave           | 8 (V3-P03)                                            |
| Justification  | Fixed weights today.                                  |

---

### Strategy Evolution, Portfolio, Risk

#### SE-01 Tactical envelopes

| Field          | Value                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Purpose        | Pre-validated tactic sets on certified versions.                                                                           |
| Business value | Adaptation without inventing strategies.                                                                                   |
| Dependencies   | Tactics Contract Option B; Library envelope (config only).                                                                 |
| Priority       | High                                                                                                                       |
| Complexity     | S                                                                                                                          |
| Readiness      | **75%**                                                                                                                    |
| Wave           | 8 (V3-P04)                                                                                                                 |
| Justification  | Envelope exists; `tacticalEnvelopeRuntimeAdaptationImplemented()` is false — **keep false**. Productize selection UX only. |

#### SE-02 Certified tactic selection

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Purpose        | Human/orchestrator selects among certified envelope values.        |
| Business value | Strategy evolution without a rewrite.                              |
| Dependencies   | Orchestrator; SE-01.                                               |
| Priority       | Medium                                                             |
| Complexity     | M                                                                  |
| Readiness      | **50%**                                                            |
| Wave           | 8 (V3-P04)                                                         |
| Justification  | Orchestrator coordinates; runtime adaptation APIs must not appear. |

#### SE-03 Auto strategy rotation

**Out of Version 3 Core.** Future Strategy Selector. Readiness **0%**. Do not implement as “AI picks a new EMA”.

#### PF-01 Portfolio projection · PF-02 Portfolio product

| Field         | PF-01                                                                                                    | PF-02                      |
| ------------- | -------------------------------------------------------------------------------------------------------- | -------------------------- |
| Purpose       | Keep Ledger→Portfolio projection                                                                         | Customer portfolio surface |
| Readiness     | **75%**                                                                                                  | **50%**                    |
| Wave          | 8 (V3-P01)                                                                                               | 8 (V3-P01)                 |
| Justification | Accounting exists. Product UI is partial (positions/orders/risk pages). Do not recalculate ledger in UI. |

#### RK-01 Risk Engine · RK-02 Risk product · RK-03 Live risk policies

| Field         | RK-01                                                                                             | RK-02           | RK-03      |
| ------------- | ------------------------------------------------------------------------------------------------- | --------------- | ---------- |
| Readiness     | **100%** architecture                                                                             | **50%** product | **50%**    |
| Wave          | Reuse                                                                                             | 8 (V3-P02)      | 6 (V3-L02) |
| Justification | Single risk authority remains. Live policies extend Exchange Scope inputs; they do not fork Risk. |

---

### Workspace, Billing, Admin, Developer, Monitoring, Compliance, Infrastructure, Performance

#### WS-01 Workspace product

Readiness **100%**. Reuse (list/create/rename/archive/switch).

#### WS-02 Team membership

Readiness **25%**. Wave 9 (V3-W01). Membership checks exist; invites/roles-as-product do not.

#### WS-03 Multi-tenant isolation

Readiness **25%**. Starts Wave 1 (secrets/adapters), completes Wave 9. Global process keys are the gap.

#### BL-01 Billing · BL-02 Usage metering

Readiness **0%**. Wave 9. New isolated domain. Must not sit on the order path. Medium priority (required for hosted SaaS Complete).

#### AD-01 Administration console · AD-02 User administration

Readiness **25%** / **0%**. Wave 9. Admin role exists; console does not.

#### DV-01 Customer API keys · DV-02 Webhooks · DV-03 Stable public API

Readiness **0%** / **0%** / **50%**. Wave 9. REST exists; customer keys and signed webhooks do not. Webhooks require SSRF controls from SEC-08.

#### MN-01 Health endpoints

Readiness **75%**. Reuse `/health`; unused market health in UI.

#### MN-02 Observability product · MN-03 Operational alerting

Readiness **25%**. Wave 3. Metrics exist as operator leftovers; not a product. Alerting can reuse Notification routing.

#### CP-01 Compliance reporting · CP-02 Data retention & export

Readiness **0%** / **25%**. Wave 10. Campaign export is a start, not compliance.

#### IN-01 Durable analytical stores

Readiness **25%**. Wave 3. TD-048.

#### IN-02 Recovery residual US295 / ADL-008

Readiness **50%**. Wave 3. US290–294 closed; US295 open. Blocks production restart-safety **claims**, not the paper loop.

#### IN-03 Job scheduler · IN-04 Durable queue default

Readiness **25%** / **50%**. Wave 3/10. TD-004; BullMQ optional, memory default.

#### PE-02 Large dataset scale · PE-03 Ledger pagination · PE-04 Playwright E2E

Readiness **25%** / **25%** / **0%**. Wave 10. TD-033, TD-041, TD-043.

#### OT-01 IDE shell

Readiness **25%**. Wave 9 stretch. TD-046. PC-19 chrome is not an IDE. Not a Core Complete blocker.

#### OT-02 Market State classification

Readiness **25%**. Stretch. V2 product does not classify; Spec describes classification. Extension of Market State owner only — no new engine. Low priority.

---

## Part 3 — Groups mapped to waves

| Group                                          | Wave               | Notes                                             |
| ---------------------------------------------- | ------------------ | ------------------------------------------------- |
| Security Platform                              | 1, 3, 6            | Foundation, monitoring, financial tamper-evidence |
| Connection Management                          | 2, 4, 5, 7         | Product, venues, notifications, AI keys           |
| Infrastructure                                 | 3, 10              | Durability first                                  |
| Monitoring                                     | 3                  | With security health                              |
| Exchange Connectivity                          | 4                  | Adapter I/O                                       |
| Notification Platform                          | 5                  | Real transports                                   |
| Live Trading                                   | 3 (kill switch), 6 | Gated                                             |
| AI Platform                                    | 7                  | Gateway only                                      |
| Knowledge Platform                             | 7                  | Lake reused                                       |
| Analytics                                      | 7–8                | Exporters then metrics                            |
| Portfolio / Risk / Strategy Evolution          | 8                  | Productize                                        |
| Workspace / SaaS / Billing / Admin / Developer | 9                  | After secrets isolation                           |
| Compliance / Performance                       | 10                 | Closeout                                          |
| Other (IDE, classify)                          | Stretch            | Explicit                                          |

---

## Part 6 — Version 2 subsystem reuse

| Version 2 subsystem                      | Stance                                 | Justification                                                                               |
| ---------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Research Lab (campaigns, backtest, WF)   | **Minor extension**                    | Durability (KN-02). Do not replace the lab.                                                 |
| Strategy Library                         | **Reuse unchanged**                    | Certified membership remains the only production entry.                                     |
| Certification                            | **Reuse unchanged**                    |                                                                                             |
| Runtime Validation Gate                  | **Minor extension**                    | Live admission reasons; still fail-closed; no override.                                     |
| Strategy Deployment                      | **Minor extension**                    | Live mission flag after ADR. Does not start sessions.                                       |
| Exchange Scope / Cluster                 | **Minor extension**                    | Bind real adapters; still isolation, not a terminal.                                        |
| Qualification                            | **Reuse unchanged**                    | No scoring invented.                                                                        |
| Market Profile                           | **Reuse unchanged**                    |                                                                                             |
| Market State                             | **Reuse unchanged** (stretch classify) | No new SoT.                                                                                 |
| Trading Orchestrator                     | **Reuse unchanged**                    | `createsSession` remains false.                                                             |
| Command Center                           | **Minor extension**                    | Kill switch, live fleet after Wave 6.                                                       |
| Trading Session + Strategy Runtime       | **Minor extension**                    | Live mode; same evaluator. No Signal Engine merge.                                          |
| Risk Engine                              | **Minor extension**                    | Live policies. Still single authority.                                                      |
| Orders + Canonical Order Path            | **Minor extension**                    | Live adapter at the end. No bypass.                                                         |
| Paper Execution Adapter                  | **Reuse unchanged**                    | Default path.                                                                               |
| Exchange Adapter factory                 | **Major extension**                    | Real I/O + credentials. Same factory.                                                       |
| Accounting / Ledger / Portfolio          | **Minor extension**                    | Live fills; portfolio product; no UI recalculation.                                         |
| Knowledge Lake                           | **Reuse unchanged**                    | Projection warehouse.                                                                       |
| Reporting                                | **Minor extension**                    | Metrics, exporters.                                                                         |
| AI Analytics                             | **Reuse unchanged**                    | Optional gateway call later.                                                                |
| AI Gateway                               | **Major extension**                    | Customer keys + providers.                                                                  |
| Notification settings                    | **Reuse unchanged**                    |                                                                                             |
| Notification Delivery + Telegram product | **Major extension**                    | Real adapters.                                                                              |
| Identity / Auth                          | **Major extension**                    | Security Platform.                                                                          |
| Workspace                                | **Minor then major**                   | Isolation now; teams in Wave 9.                                                             |
| Operator Shell                           | **Minor extension**                    | Connections / security nav; live unhide only when real.                                     |
| Live Market Data                         | **Minor extension**                    | Remaining Nest wiring / UI; public paths already partial.                                   |
| Recovery                                 | **Major extension**                    | US295.                                                                                      |
| Live Trading Engine (hidden)             | **Major extension or absorb**          | Reuse health/kill hooks; do not ship a second runtime. Product is Session + Command Center. |
| Credential Vault                         | **New (justified)**                    | No owner.                                                                                   |
| Connection Management UI                 | **New facade (justified)**             | Command Center pattern.                                                                     |
| Billing                                  | **New (justified, isolated)**          | Wave 9.                                                                                     |

**Replace:** none of the trading Sources of Truth.

---

**STOP.** Inventory is planning authority. Implementation waits for approval.
