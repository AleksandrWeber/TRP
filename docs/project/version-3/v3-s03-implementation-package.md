# V3-S03 Secret Vault & Encryption — Implementation Package

```text
Package:            V3-S03
Name:               Secret Vault & Encryption
Wave:               1 — Security Foundation
Capabilities:       SEC-06, SEC-07
Date:               2026-08-17
Status:             Platform Complete (Customer Complete open under Vault)
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision.
Canon:              version-3-master-plan.md
```

**Process:** [`version-3-implementation-policy.md`](./version-3-implementation-policy.md)
**Template:** [`version-3-package-template.md`](./version-3-package-template.md)
**Governance:** [`version-3-governance-freeze.md`](./version-3-governance-freeze.md)
**Annexes used (read-only):** Execution Roadmap, Security Vision, Connection Management Vision, Capability Inventory, Product Roadmap, Wave 1 Progress Report.

**Baseline (read-only, factual):** [`version-2-connection-management-audit.md`](../version-2-connection-management-audit.md)

**Companions:**

| Document                                                                                 | Role                                                                                                       |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [`v3-s03-product-scope.md`](./v3-s03-product-scope.md)                                   | IN / OUT, ownership, holdable types, classification, state machine, customer acceptance, migration summary |
| [`v3-s03-security-review.md`](./v3-s03-security-review.md)                               | Threat model, lifecycle, failure philosophy, encryption outcomes, isolation                                |
| [`v3-s03-validation-plan.md`](./v3-s03-validation-plan.md)                               | How Close is proven, including dual-run against `.env`; two completion gates                               |
| [`v3-s03-close-criteria-resolution.md`](./v3-s03-close-criteria-resolution.md)           | Platform Complete vs Customer Complete; UI owner = Vault                                                   |
| [`v3-s03-platform-complete-close-report.md`](./v3-s03-platform-complete-close-report.md) | Platform Complete Close record (Product Owner accepted)                                                    |
| [`secret-vault-overview.md`](./secret-vault-overview.md)                                 | Customer-language product                                                                                  |

**Prerequisites:** [`v3-s01-close-report.md`](./v3-s01-close-report.md) — Authentication & Session **CLOSED**. [`v3-s02-close-report.md`](./v3-s02-close-report.md) — RBAC Product **CLOSED**. Version 2 is **CERTIFIED**. Master Plan is **FROZEN**. Implementation of V3-S03 has **not** started.

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES.** Scope, owners, and exit criteria are already in the frozen Master Plan. Credential Vault is already the only justified new security domain. This package only sequences work inside that freeze. Version 2 remains certified. The Master Plan is not modified. The Connection Management Audit is not rewritten.

**Planning status:** **COMPLETE.** Product Owner **Approved**. Implementation may begin at slices **S03-a … S03-e**. This file remains planning: no code in the planning task that added the four sections below.

```text
The Vault exists to support the product.
The Vault is NOT a generic infrastructure project.
The Vault does NOT connect Binance, send Telegram, send email, run AI, or trade live.
The Vault owns secrets only.
```

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package
        ↓
Review
        ↓
Approval                 ← YOU ARE HERE (planning COMPLETE)
        ↓
Implementation           ← may begin (S03-a … S03-e only)
        ↓
Implementation Report
        ↓
Architecture Review
        ↓
Security Review
        ↓
Product Review
        ↓
Validation
        ↓
Close                    → then V3-S04 Implementation Package
```

Do not skip a stage. Do not start V3-S04 until this package is **Closed**. The next package opens at **Implementation Package**, not at code. Do not start Wave 2 Connection Management from this package.

---

## Overview

V3-S03 is the Wave 1 Security Foundation package that gives the product a **customer-managed Secret Vault**. Authentication already proves who the operator is (S01 CLOSED). RBAC already decides what that operator may do (S02 CLOSED). This package is where vendor credentials live so they are no longer tribal host files.

| Field                                | Value                                             |
| ------------------------------------ | ------------------------------------------------- |
| Package ID                           | V3-S03                                            |
| Master Plan / Execution Roadmap name | Secret Vault & Encryption                         |
| Wave                                 | 1 — Security Foundation                           |
| Capabilities (inventory IDs)         | SEC-06 Secret Vault, SEC-07 Credential Encryption |
| Complexity                           | L                                                 |
| Previous package                     | V3-S02 RBAC Product (**CLOSED**)                  |
| Next package                         | V3-S04 OWASP & API Hardening                      |

**Planning freeze added at Approval (canonical here):**

| Section                                                | Binding outcome                                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| [§5 Secret Classification](#5-secret-classification)   | Owner, rotation, read-back, export for every secret class                                     |
| [§6 Secret State Machine](#6-secret-state-machine)     | Created → Validated → Connected → Revoked → Deleted. Connected = stored, not provider-working |
| [§7 Failure Philosophy](#7-failure-philosophy)         | Vault down → paper, authentication, and research continue; integrations unavailable           |
| [§8 Secret Ownership Rules](#8-secret-ownership-rules) | Vault owns secrets only. Never Connections, Trading, AI, Notifications, Exchanges             |

---

## 1. Why Vault exists

In business language: a professional will not run a research operating system that later holds exchange keys, AI keys, and notification tokens if those secrets live in a server file only the host can edit. Version 2 made paper-first certification possible without that product. Version 3 cannot.

Today the customer cannot connect integrations themselves. Keys are either missing, global in `.env`, or simulated. Vault exists so **the customer owns secrets inside the product** — store, validate, revoke, delete — before any later product is allowed to use them.

The Vault supports Connection Management, venues, channels, and AI. It is not those products. It is not a platform-wide secret manager for Postgres and Redis.

Master Plan: Wave 1 business value is “safe identity **and** a vault so secrets are not tribal `.env`.” Identity is done. The vault is not.

---

## 2. What customer products will depend on Vault

Detail: [`v3-s03-product-scope.md`](./v3-s03-product-scope.md).

| Product                       | Depends on Vault for              | Not delivered in S03         |
| ----------------------------- | --------------------------------- | ---------------------------- |
| Connection Management         | Somewhere honest to put a key     | Wizard, catalog, health      |
| Binance / Bybit / OKX         | Trading credentials per workspace | Venue handshake, live orders |
| Telegram                      | Bot token                         | Bot API, delivery            |
| SMTP                          | Mail credentials                  | Sending mail                 |
| OpenRouter                    | Customer API key                  | Chat using that key          |
| Future AI providers           | Typed secrets                     | Wave 7 providers             |
| Future notification providers | Typed secrets                     | Wave 5 channels              |
| Live Trading                  | Venue secrets already held        | Wave 6 + ADR                 |
| Developer Platform            | Vaulted customer API keys         | Wave 9                       |
| Isolation / Audit             | Secret boundary and events        | S06 / S05 products           |

---

## Business Goal

- **Goal:** Replace host-level customer secrets with a secure customer-managed vault so later connections can be product, not SSH.
- **Master Plan reference:** §1 business goal 2; §3 blocker “No Credential Vault”; §4 Wave 1 “The product can store a secret that I cannot read back as plaintext”; §7 Credential Vault SEC-06 and Secret encryption SEC-07; §10 New justified: Credential Vault; Execution Roadmap V3-S03; Security Vision §4 Secret Vault; Connection Management Vision §6 Credential Vault; Capability Inventory SEC-06 / SEC-07.
- **Metric this package must meet or not regress (Master Plan §6):** credential exposure **0**; cross-workspace secret leak **0**; default misconfig **0 tolerated**; register **< 2 min**; login **< 30 s**. Time-to-connect-Binance is **Wave 4**, not this package.

---

## Customer Problem

- **Problem:** Exchange keys do not exist as customer data. The OpenRouter key lives in `.env`. Telegram is partly stubbed in memory. SMTP depends on nothing the customer can configure (reserved) while host mail for recovery is host-operated. Customers cannot connect integrations themselves.
- **Who feels it:** Workspace administrator (cannot vault connections); trading operator (cannot save venue keys); researcher (cannot own an AI key); the business (cannot leave `.env` as the SaaS path).
- **What they must do today that they should not:** Edit `.env`, restart the API, share a process-global OpenRouter key, or live without credentials at all. Factual source: Version 2 Connection Management Audit (not architecture wish).

---

## Business Value

- **Value delivered at Close:** The product holds customer vendor secrets. The operator cannot read them back. Lifecycle and validation exist. Secrets are a product, not a host file.
- **What remains blocked until later packages:** Using those secrets to connect Binance, send Telegram, send email, run AI, rotate as a connection product, isolate as an S06 **suite**, audit as an S05 **product**, harden as S04, or trade live. Wave 1 does **not** exit at S03 Close.

---

## Current State

Honest Version 2 / S01 / S02 facts. Baseline: Version 2 Connection Management Audit. Do not redesign Version 2.

| Capability or surface                  | Status                               | Evidence                                                                                |
| -------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| **Authentication / sessions**          | Already exists (CLOSED)              | V3-S01                                                                                  |
| **RBAC / People / C8 unbound**         | Already exists (CLOSED)              | V3-S02; C8 Vault/connections left Out                                                   |
| **Secret Manager / Vault module**      | **Missing**                          | Audit: no Secret Manager, no Prisma secret models                                       |
| **Encryption of integration secrets**  | **Missing**                          | Audit: only login passwords are bcrypt; OpenRouter and `DATABASE_URL` are plaintext env |
| **OpenRouter key**                     | Needs extension (not in S03 **use**) | `.env` global; no UI field; offline fallback if missing                                 |
| **Binance / Bybit / OKX trading keys** | **Missing**                          | Adapters store connection **state** only; simulated connect; no API keys                |
| **Public Binance data**                | Out of this package                  | No trading key; env switch / public REST-WS                                             |
| **Telegram bot token**                 | **Missing**                          | In-memory wizard; not Telegram; not durable                                             |
| **SMTP customer credentials**          | **Missing**                          | Reserved channel; no storage                                                            |
| **ExchangeConnection as secret store** | Must not become one                  | Audit: state is not credentials                                                         |
| **Host `DATABASE_URL` / Redis / JWT**  | Out of this package                  | Host infrastructure                                                                     |
| **Connection Management UI**           | Out of this package                  | Wave 2                                                                                  |
| **Live trading**                       | Out of this package                  | Wave 6                                                                                  |

Facts implementers must not forget:

- The audit is the baseline. Simulated `CONNECTED` without keys is not a vault success.
- Do not put secrets on `ExchangeConnection`.
- Do not wire Exchange Adapter, AI Gateway, or Notification Delivery to consume Vault in this package.
- Do not migrate `DATABASE_URL` into Vault.
- Do not claim OpenRouter env is gone until Wave 2 **uses** the vaulted key.
- Do not auto-copy `.env` into Vault (see Migration Strategy).
- S02 C8 is unbound; this package binds vault lifecycle only.

---

## Migration Strategy from Version 2

**Nature:** Transition plan. Not implementation. Not a cutover script. Not a redesign of Version 2.
**Baseline:** [`version-2-connection-management-audit.md`](../version-2-connection-management-audit.md) and `.env.example`.
**Rule:** Existing paper, sign-in, People, and certified journeys must keep working. Vault is **additive** in S03.

Version 2 uses `.env` as the store for the only live vendor key (OpenRouter) and for host infrastructure. Most integrations have **nothing to migrate** — the secrets do not exist yet. The risk is not a bulk dump. The risk is guessing after Vault exists: auto-importing a global host key into every workspace, switching consumers too early, or moving `JWT_SECRET` into the customer vault.

```text
S03 Close:  Vault can hold a secret.  .env consumers still work.
Wave 2:     OpenRouter use prefers workspace Vault; env becomes fallback only.
Wave 4–5:   Venue and channel secrets are first-written in Vault (nothing in .env today).
Production customer story:  vendor secrets are not .env.
Host .env:  DATABASE_URL, JWT, wrapping key, recovery mail, process flags — forever host.
```

### What Version 2 reads from `.env` today

Split by **kind**. Only vendor secrets are Vault candidates.

| Variable                                                                                   | Kind today                                        | In Vault?                                      | When the **reader** moves                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `OPENROUTER_API_KEY`                                                                       | Customer vendor secret, process-global, plaintext | **Yes** — customer re-enters in Vault          | **Wave 2** (AI Gateway **use**). S03 stores only.                                |
| `OPENROUTER_MODEL`                                                                         | Non-secret model id                               | **No**                                         | Stays host/config until a later settings/connection field. Not a secret.         |
| `OPENROUTER_BASE_URL`                                                                      | Non-secret endpoint                               | **No**                                         | Stays host/config.                                                               |
| Binance / Bybit / OKX API key + secret                                                     | **Absent**                                        | **Yes** (first write is Vault)                 | Wave 2 collect; Wave 4 I/O. Nothing to copy from `.env`.                         |
| Telegram bot token                                                                         | **Absent** (in-memory wizard only)                | **Yes** (first write is Vault)                 | Wave 5 send. S03 does not break the in-memory wizard.                            |
| Customer SMTP (notification email)                                                         | **Absent** (reserved channel)                     | **Yes** (first write is Vault)                 | Wave 5 send.                                                                     |
| Slack / Discord / Teams / Push secrets                                                     | **Absent**                                        | Later typed secrets, same Vault                | Wave 5.                                                                          |
| `DATABASE_URL`                                                                             | Host infrastructure                               | **Never**                                      | Host.                                                                            |
| Redis / `QUEUE_*` / `QUEUE_DRIVER`                                                         | Host infrastructure                               | **Never**                                      | Host.                                                                            |
| `JWT_SECRET` / `JWT_EXPIRES_IN`                                                            | Host application signing                          | **Never**                                      | Host. Authentication (S01).                                                      |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_FROM` / `MAIL_USER` / `MAIL_PASSWORD` / `PUBLIC_APP_URL` | Host recovery mail (S01)                          | **Never** as host mail                         | Host. Distinct from customer SMTP in Vault.                                      |
| `SEED_USER_EMAIL` / `SEED_USER_PASSWORD`                                                   | Host bootstrap                                    | **Never**                                      | Host. Not the customer path.                                                     |
| `API_PORT` / `API_HOST` / `CORS_ORIGIN` / rate-limit / throttle                            | Process config                                    | **Never**                                      | Host.                                                                            |
| `MARKET_DATA_PROVIDER`                                                                     | Public-data switch (`mock` \| `binance`)          | **Never** (not a secret)                       | Host until Connections can pick a provider. Public Binance needs no trading key. |
| `LIVE_MARKET_WS_ENABLED`                                                                   | Public stream flag                                | **Never**                                      | Host until Connections. No credentials.                                          |
| `MARKET_CACHE_*`                                                                           | Process config                                    | **Never**                                      | Host.                                                                            |
| `NODE_ENV` / persistence / logger / metrics drivers                                        | Process config                                    | **Never**                                      | Host.                                                                            |
| `VITE_API_URL`                                                                             | Web build config                                  | **Never**                                      | Host/build.                                                                      |
| **Platform wrapping key** (does not exist today)                                           | **New** host secret for SEC-07                    | **Never** (wraps Vault; is not a Vault record) | Host, same class as `JWT_SECRET`.                                                |

Audit remainder (not `.env`, still not migrated as files): simulated `ExchangeConnection` state stays state; Telegram in-memory bind stays until Wave 5; reserved notification fields stay labels until Wave 5.

### What moves first

Order is **store-before-consume**. S03 never flips a consumer.

| Order | Secret                                        | S03                                                                                                  | Later consume                                                                                                                                                                               |
| ----- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **OpenRouter API key**                        | Customer can **store** it in Vault. AI Gateway **keeps** reading `.env` (or stays offline if unset). | Wave 2: if this workspace has a vaulted key, Gateway uses it without restart. Env becomes **dev fallback only**, forbidden as the production customer story (Connection Management Vision). |
| **2** | **Binance / Bybit / OKX trading credentials** | Customer can **store** them. Adapters keep simulated connect **without** keys.                       | Wave 2 collect as Connections product; Wave 4 real I/O.                                                                                                                                     |
| **3** | **Telegram bot token**                        | Customer can **store** it. In-memory wizard unchanged.                                               | Wave 5 Bot API.                                                                                                                                                                             |
| **4** | **Customer SMTP**                             | Customer can **store** it. Reserved email channel unchanged. Host recovery mail unchanged.           | Wave 5 send.                                                                                                                                                                                |
| **5** | Future AI / notification / developer keys     | Same Vault, later types                                                                              | Waves 5 / 7 / 9                                                                                                                                                                             |

**First to leave `.env` as the customer path:** `OPENROUTER_API_KEY`. It is the only vendor secret Version 2 actually loads from env.

**Nothing is copied automatically from `.env` into Vault.** The host OpenRouter key is process-global. Importing it into every workspace would:

- treat a host secret as a customer secret,
- break workspace isolation,
- hide that the customer never entered the key.

The operator **re-enters** the key in Vault. That is the migration. It is slower than a script and is the honest, isolated path.

### What stays server / system configuration

These remain host `.env` (or equivalent host secret store). They are not customer Vault material:

- Database and queue: `DATABASE_URL`, Redis, `QUEUE_DRIVER`
- Application identity: `JWT_SECRET`, `JWT_EXPIRES_IN`
- **Vault wrapping key** (new in S03, host-held)
- Host recovery mail (`MAIL_*`, `PUBLIC_APP_URL`)
- Seed bootstrap (`SEED_USER_*`)
- Bind/listen, CORS, rate limits, `NODE_ENV`, driver flags
- Public market switches (`MARKET_DATA_PROVIDER`, `LIVE_MARKET_WS_ENABLED`) and cache TTLs
- OpenRouter **model** and **base URL** until a later non-secret settings field exists

Customer First still holds: the customer does not SSH to save **vendor** secrets. The host still SSH/operates **infrastructure**.

### How migration runs without downtime and without losing capability

This is a **dual-run**, not a night cutover.

| Phase                          | What is true                                                                                                                                                                                                                                                                       | Downtime                                                                                                                                                                                 | Capability                                                                                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Today (certified V2)**       | `.env` as now. No Vault.                                                                                                                                                                                                                                                           | —                                                                                                                                                                                        | Paper, auth, People, AI via env or offline, simulated exchange, in-memory Telegram.                                                                                                                                              |
| **S03 implementation / Close** | Vault is added. Wrapping key is host-configured. Existing env readers **unchanged**.                                                                                                                                                                                               | **None** for certified journeys. Vault store may require the wrapping key; if it is missing, **Vault** fails closed and honest. The API, paper, login, and AI-from-env must still start. | Operator can store secrets. Those secrets are **not yet used** by adapters. OpenRouter from env still works. Empty OpenRouter still offline.                                                                                     |
| **After S03, before Wave 2**   | Dual existence: env key (global) and optional vaulted key (per workspace). Only env is consumed.                                                                                                                                                                                   | None                                                                                                                                                                                     | Same as V2, plus Vault product.                                                                                                                                                                                                  |
| **Wave 2 OpenRouter consume**  | Lookup order for **that workspace**: vaulted key if stored and not revoked → else env fallback in non-production / explicit host fallback → else offline. Production customer story must not require env. **No process restart** for the operator who saved the key (Wave 2 exit). | None if precedence is in-process.                                                                                                                                                        | AI keeps working for hosts that still have env. Workspaces with a vaulted key use their own key. Decrypt failure for one workspace → that workspace goes **offline honestly**, not a process crash, not another workspace’s key. |
| **Wave 4 / 5**                 | First venue/channel secrets are Vault-only. No `.env` predecessor.                                                                                                                                                                                                                 | None from secret migration (there is no old store). I/O is new capability, not a cutover.                                                                                                | Paper remains default. Simulated connect without keys remains dishonest and is replaced by honest status in Connections, not by S03.                                                                                             |
| **Env key retirement**         | Remove `OPENROUTER_API_KEY` from the **customer** story after Wave 2 proves vaulted use. `.env.example` may keep a **dev fallback** until a later package forbids it in production. Never remove `DATABASE_URL` / `JWT_SECRET` / wrapping key.                                     | None if fallback remains until production policy is explicit.                                                                                                                            | Hosts that never stored a vault key keep fallback until they do, or see honest offline.                                                                                                                                          |

**Restart:** S03 must not require an extra customer restart to **save** a secret. Version 2 required restart after editing OpenRouter env; that is the behaviour we stop advertising. Host still restarts when **host** env changes (`DATABASE_URL`, wrapping key, `JWT_SECRET`).

**Loss of capability — forbidden:**

- Turning off AI Gateway env read in S03
- Importing env into Vault as a background job
- Failing API boot because Vault wrapping key is unset (Vault unavailable; rest of product up)
- Moving JWT or database URL into Vault
- Deleting Telegram in-memory wizard because a bot token **can** now be stored
- Treating simulated exchange `CONNECTED` as migrated credentials

**Rollback:** Disable Vault UI / vault routes if needed. Env consumers still work. Ciphertext may remain in the database unread. That is fail closed for Vault, not an outage of Version 2.

### S03 freeze for this strategy

S03 **does**:

- Hold OpenRouter, venue, Telegram, and customer SMTP material when the operator submits them
- Leave every Version 2 env reader in place
- Introduce a host wrapping key without making it a customer secret

S03 **does not**:

- Copy `.env` into Vault
- Switch AI Gateway, Exchange Adapter, or Notification Delivery onto Vault
- Remove `OPENROUTER_API_KEY` from host configuration
- Claim the host OpenRouter key is now “migrated”

Detail for IN / OUT: [`v3-s03-product-scope.md`](./v3-s03-product-scope.md). Close evidence: [`v3-s03-validation-plan.md`](./v3-s03-validation-plan.md).

---

## 3. Exactly what belongs IN this package

Detail: [`v3-s03-product-scope.md`](./v3-s03-product-scope.md).

| Item                              | Customer meaning                                                           | Notes / owner                     |
| --------------------------------- | -------------------------------------------------------------------------- | --------------------------------- |
| Credential Vault bounded context  | Product home for vendor secrets                                            | Master Plan §10 **New justified** |
| Secure storage                    | Not `.env`, not plaintext columns, not UI readback                         | SEC-06                            |
| Envelope encryption               | Ciphertext at rest; wrapping key separate                                  | SEC-07                            |
| Lifecycle                         | Add, Created → Validated → Connected → Revoked → Deleted, replace-by-store | Vault                             |
| Validation                        | Well-formed fields for holdable types                                      | Vault — **not** vendor I/O        |
| Vault product                     | Open Vault, add Binance credentials, see Stored/Connected, revoke, delete  | Existing shell                    |
| Holdable types                    | Binance, Bybit, OKX, Telegram, SMTP, OpenRouter                            | Schemas, not products             |
| Typed-secret contract             | Later providers do not need a second vault                                 | Same context                      |
| C8 vault cells                    | Trader/Admin in their workspace                                            | S02 model                         |
| Workspace-scoped records          | A cannot read B                                                            | Vault + Workspace                 |
| Runtime retrieve port             | Later adapters; not wired now                                              | Vault                             |
| Structured events                 | Create/revoke/delete without secrets                                       | For S05                           |
| Dual-run against Version 2 `.env` | Existing env readers keep working                                          | Migration Strategy                |

---

## 4. Exactly what is OUT

| Item                                                                    | Why out                                             | Owner later             |
| ----------------------------------------------------------------------- | --------------------------------------------------- | ----------------------- |
| Connection Management UI                                                | Wave 2 facade                                       | **V3-C01**              |
| Exchange connectivity                                                   | Real venue I/O                                      | Wave 4                  |
| Telegram Bot / delivery                                                 | Real transport                                      | Wave 5                  |
| SMTP delivery                                                           | Send mail                                           | **V3-N02**              |
| Live Trading                                                            | Unauthorized                                        | Wave 6                  |
| API key rotation automation                                             | Rotation product                                    | **V3-C04** / SEC-12     |
| Secrets synchronization                                                 | Not in Master Plan                                  | Out unless plan revised |
| Billing                                                                 | Isolated                                            | Wave 9                  |
| AI chat using stored key                                                | Gateway use                                         | Wave 2 / 7              |
| Vendor test / health / disconnect-as-connection                         | Testing product                                     | **V3-C03** / **C04**    |
| OWASP platform / audit product / isolation suite                        | Later Wave 1                                        | S04 / S05 / S06         |
| Host env (`DATABASE_URL`, Redis, JWT, host recovery mail, wrapping key) | Host infrastructure                                 | Host                    |
| Auto-copy `.env` into Vault                                             | Isolation; host OpenRouter is not a customer secret | Forbidden               |
| Switching AI Gateway / adapters onto Vault                              | Consume is later                                    | Wave 2 / 4 / 5          |
| Removing `OPENROUTER_API_KEY` from host env                             | Dual-run until Wave 2 proves vaulted use            | Wave 2+                 |
| Plaintext export                                                        | Forbidden                                           | —                       |
| Version 2 redesign                                                      | Certified                                           | —                       |

Nothing in IN Scope may be invented. If a desired item is not in the Master Plan, **stop**.

---

## Reuse from Version 2

Map to Master Plan §10. Do not redesign certified subsystems.

| Stance                                                                                    | This package                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reuse unchanged                                                                           | Strategy Library, Certification, Qualification, Market Profile, Orchestrator (`createsSession` false), paper Execution Adapter, Knowledge Lake, Reporting, AI Analytics (local), Ledger, Risk Engine, Gate, in-memory Telegram product, stub venue adapters, public Binance paths |
| Minor extension                                                                           | Operator shell: Vault page in existing Administration chrome; S02 permission matrix C8 vault cells                                                                                                                                                                                |
| Major extension                                                                           | Identity/Auth is **not** the Vault owner. Do not fold Vault into Authentication.                                                                                                                                                                                                  |
| New justified (only if Master Plan already named it)                                      | **Credential Vault** (this package). Connection Management facade is Wave 2. Billing is Wave 9.                                                                                                                                                                                   |
| Replace (must be **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, Library) | **Nothing**                                                                                                                                                                                                                                                                       |

Owner from Master Plan §11:

| Area                                                                        | Owner                                 | This package must not own            |
| --------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------ |
| Credentials (vendor secrets), lifecycle, validation, encryption, revocation | **Vault**                             | Venue I/O, send(), model call, money |
| Authentication                                                              | Authentication (S01)                  | Login passwords as vault items       |
| Authorization decision                                                      | Authz (S02)                           | New IAM context                      |
| Workspace membership                                                        | Workspace                             | —                                    |
| Connection Management UI                                                    | Connection Management facade (Wave 2) | Ciphertext                           |
| Exchange I/O                                                                | Exchange Adapter                      | Secret storage                       |
| Notifications                                                               | Notification Delivery                 | Secret storage                       |
| AI HTTP                                                                     | AI Gateway                            | Secret storage                       |
| Money                                                                       | Ledger                                | —                                    |

---

## Architecture decision: new bounded context?

**YES.** Secret Vault / Credential Vault **is** a new bounded context.

**Justification using Version 3 rules:**

1. Master Plan §7: Credential Vault is SEC-06 — **only justified new security domain**.
2. Master Plan §10: **New justified** = Credential Vault; Connection Management facade; Billing (isolated).
3. Master Plan §11: Security Platform / Vault / Audit — Identity/Auth **+ Vault module**. Vault is named separately from Identity.
4. Architecture checklist: no new bounded context **unless the Master Plan already named it** (Credential Vault is listed).
5. Capability Inventory SEC-06: “New justified module; Workspace; encryption. Cannot reuse `ExchangeConnection` (state only).”
6. Execution Roadmap Wave 1: “**New justified module:** Credential Vault (not a financial SoT).”
7. Security Vision: Vault is not financial SoT; list APIs return metadata, never secret material.
8. Reuse rule: existing ownership is **not** sufficient. Identity owns profile/role/status. Authentication owns login credentials/sessions. Exchange Adapter owns protocol and today holds **state without keys**. Notification and AI Gateway do not own encryption of customer secrets. Putting keys in `.env` or on `ExchangeConnection` would duplicate and violate the audit.

**NO** would be wrong: it would either overload Identity/Auth with vendor secrets, or store keys on connection state, or keep `.env`. All three contradict the frozen plan and the Version 2 audit.

There is still **only one** vault. This package must not create a second.

HTTP remains transport. UI remains not Source of Truth. Spec v2.0 / Authority Matrix / Alias Dictionary unchanged. No RC. No ADR (vault ownership is already in the Master Plan; a future ADR is named for live capital, not for this vault).

---

## Who owns what (explicit)

| Concern                                             | Owner                                                 |
| --------------------------------------------------- | ----------------------------------------------------- |
| **Credentials** (exchange, AI, notification tokens) | **Vault**                                             |
| **Secret lifecycle**                                | **Vault**                                             |
| **Validation** (well-formed; not vendor handshake)  | **Vault**                                             |
| **Encryption**                                      | **Vault** (SEC-07)                                    |
| **Revocation** (secret unusable)                    | **Vault**                                             |
| Login passwords / sessions                          | Authentication (S01 CLOSED)                           |
| Who may open Vault                                  | Authorization (S02) + C8 vault cells in this package  |
| Vendor Connected / expired / permission             | Connection Management / Exchange Connectivity (later) |
| Host wrapping key custody                           | Host infrastructure                                   |
| Money                                               | Ledger                                                |

Canonical freeze of this table: **§8 Secret Ownership Rules**. Classification, states, and outage behaviour: **§5–§7**.

---

## 5. Secret Classification

Planning freeze. Not implementation. Not a second vault. Not a rotation product.

This table is the policy later packages must consult before they treat a value as a customer secret, a host secret, or “something the operator can see again.”

**Column meaning**

| Column        | Meaning in this package                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**     | **Customer** = operator stores it in Vault. **Host** = infrastructure; never a Vault record.                                                                                          |
| **Rotation**  | **Yes** = the operator may replace the secret in Vault (store again). That is lifecycle, not Wave 2 `V3-C04` rotation-as-connection-product. **Manual** = host rotates outside Vault. |
| **Read back** | **No** = after store, no role sees plaintext in UI, list API, or logs. **N/A** = not a Vault record; Vault has no read-back path for it.                                              |
| **Export**    | **No** = no plaintext download, copy-after-save, or support dump. **N/A** = not a Vault record.                                                                                       |

| Secret                                                                                       | Owner    | Rotation | Read back | Export |
| -------------------------------------------------------------------------------------------- | -------- | -------- | --------- | ------ |
| Binance API                                                                                  | Customer | Yes      | No        | No     |
| Bybit API                                                                                    | Customer | Yes      | No        | No     |
| OKX API                                                                                      | Customer | Yes      | No        | No     |
| Telegram Bot                                                                                 | Customer | Yes      | No        | No     |
| SMTP (customer notification mail)                                                            | Customer | Yes      | No        | No     |
| OpenRouter                                                                                   | Customer | Yes      | No        | No     |
| Later typed vendor secrets (same Vault: Kraken, other AI, other channels, customer API keys) | Customer | Yes      | No        | No     |
| `JWT_SECRET`                                                                                 | Host     | Manual   | N/A       | N/A    |
| Vault wrapping key                                                                           | Host     | Manual   | N/A       | N/A    |
| `DATABASE_URL`                                                                               | Host     | Manual   | N/A       | N/A    |
| Redis / queue                                                                                | Host     | Manual   | N/A       | N/A    |
| Host recovery mail (`MAIL_*`)                                                                | Host     | Manual   | N/A       | N/A    |

Login passwords are **Authentication (S01)**. They are not Vault rows and must not be classified as customer vendor secrets.

Host OpenRouter env remains a **dual-run leftover** until Wave 2 consumes the vaulted key. It is not a Vault read-back path and must not be auto-imported.

---

## 6. Secret State Machine

Planning freeze. Formal states for every holdable customer secret. Operator labels on the Vault screen must not invent a sixth success state.

```text
Created
  ↓
Validated
  ↓
Connected
  ↓
Revoked
  ↓
Deleted
```

**Connected means:** Vault stores the credential.

**Connected does not mean:** the external provider works. Not Binance trading. Not Telegram delivery. Not SMTP send. Not OpenRouter chat. Not live.

| State         | Meaning                                                                                                                                                                  | Operator may see                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| **Created**   | Operator submitted material for a holdable type. It exists only long enough to validate and encrypt. It is not logged. It is not yet a success.                          | Submitting / validating — not Stored, not Connected |
| **Validated** | Required fields are present and well-formed for that type. **Not** a vendor handshake. **Not** `spot.trade`. **Not** a Bot API call.                                     | Honest accept, or honest field error                |
| **Connected** | Vault holds ciphertext for this workspace + type + purpose. Metadata is listable. Plaintext is not. Retrieve exists for later adapters; this package does not wire them. | **Stored** / Vault **Connected**                    |
| **Revoked**   | Retrieve fails. Record may remain as revoked. Operator cannot read the old secret.                                                                                       | **Revoked**                                         |
| **Deleted**   | Record and ciphertext are gone from the product. No undelete.                                                                                                            | **Not stored**                                      |

**Reject (not a success path):** Created → validation fails → **not stored**. Nothing is shown as Connected.

**Replace (lifecycle, not V3-C04):** Connected → Created (new material) → Validated → Connected. Previous material becomes unreadable.

**Not stored** is the absence of a Connected/Revoked record. It is the start and the result of Deleted.

Mapping to existing Vault language: operator **Stored** and Vault **Connected** are the same success state as **Connected** here. They remain vault-record status, never venue status.

---

## 7. Failure Philosophy

Planning freeze. Vault must not take down the paper-first product.

```text
Vault unavailable
  ↓
Paper Trading continues
  ↓
Authentication continues
  ↓
Research continues
  ↓
Integrations unavailable
```

“Integrations unavailable” means: the operator cannot store or retrieve vendor secrets through Vault, and later products that would consume Vault cannot honestly claim those integrations work. It does **not** mean paper, sign-in, People, or research must stop.

| Dependency unavailable                                                       | Product behaviour                                                                                                                                                                                                                                                                                    | Must not happen                                                                                                |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Vault** (module, routes, or store)                                         | Paper trading continues. Authentication continues. Research continues (paper research; AI remains env or offline per dual-run). Vault UI/API fails closed and honest. Integrations that need a vaulted secret are unavailable.                                                                       | API boot failure; login outage; paper outage; fake “Binance connected”                                         |
| **Wrapping key**                                                             | Same as Vault unavailable for secret store/retrieve. Certified journeys still start. Ciphertext already stored is unreadable until the host wrapping key is restored; product must not pretend those secrets still work.                                                                             | Fail the process because the wrapping key is unset; silent plaintext persist; claim old ciphertext is fine     |
| **Database**                                                                 | Host outage for **every** persisted product that already uses the database (sign-in, People, paper that persist). That is not a Vault-specific kill switch. If the database is up and only Vault records/module are unusable, treat it as **Vault unavailable** — paper and authentication continue. | Treat a Vault-only failure as a platform crash; treat a full database outage as something Vault can paper over |
| **Provider validation** (Binance, Telegram, OpenRouter, SMTP, or any vendor) | **Not used in this package.** Vault validation is field well-formedness only. Provider downtime must not block Created → Validated → Connected. Connected still does not mean the provider answered.                                                                                                 | Require a vendor round-trip to store; show vendor outage as a Vault success or as a platform outage            |

Paper-first continues **wherever the Master Plan already allows it without Vault**. Paper does not need Vault. Sign-in does not need Vault. Research as certified today does not need Vault. Connection, venue I/O, Telegram send, SMTP send, and AI-use of a vaulted key are later products; they may be unavailable without a usable Vault. That is correct.

Rollback remains: disable Vault; env consumers still work; ciphertext may remain unread. Fail closed for Vault, not an outage of Version 2.

---

## 8. Secret Ownership Rules

Planning freeze. Restated so a later package cannot “helpfully” fold connections, trading, AI, or notifications into Vault.

```text
The Vault never owns
  Connections
  Notifications
  AI
  Trading
  Exchanges

Only secrets.
Only credentials.
```

**Vault owns**

- Customer vendor credentials (the classified Customer rows in §5)
- Secret lifecycle (the state machine in §6)
- Validation of well-formed fields (not vendor I/O)
- Encryption at rest and wrapping-key _use_ (the wrapping key itself stays host-held)
- Revocation and deletion of stored credentials
- Runtime retrieve **port** (not the adapters that will call it later)

**Vault never owns**

| Product                                                                                     | Owner                                              |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Connection Management (catalog, wizard, test, health, disconnect)                           | Wave 2                                             |
| Trading (paper or live)                                                                     | Paper: certified Version 2. Live: Wave 6 after ADR |
| Exchanges / venue protocol / `spot.trade`                                                   | Exchange Adapter / Wave 4                          |
| AI (model call, chat using a key)                                                           | AI Gateway / Wave 2 and 7                          |
| Notifications (Telegram delivery, SMTP send, other channels)                                | Notification Delivery / Wave 5                     |
| Authentication (login, sessions, recovery, login passwords)                                 | V3-S01 (**CLOSED**)                                |
| Authorization / People / roles                                                              | V3-S02 (**CLOSED**)                                |
| Money                                                                                       | Ledger                                             |
| Host infrastructure (`DATABASE_URL`, Redis, `JWT_SECRET`, wrapping key, host recovery mail) | Host                                               |

A later package may **consume** a vaulted secret. Consuming is not owning. Storing a Binance key does not make Vault the Binance product. Storing an OpenRouter key does not make Vault the AI product. Storing a Telegram token does not make Vault the notification product.

---

## Dependencies

| Dependency                                     | Kind                | Status required before this package |
| ---------------------------------------------- | ------------------- | ----------------------------------- |
| Version 2 Identity (PC-18) / Workspace (PC-14) | Version 2 product   | Exists                              |
| Version 2 Connection Management Audit          | Factual baseline    | Exists (read-only)                  |
| V3-S01 Authentication & Session                | Earlier V3 package  | **Closed**                          |
| V3-S02 RBAC Product                            | Earlier V3 package  | **Closed**                          |
| Host DB / wrapping key                         | Host infrastructure | Host-operated                       |

This package does **not** depend on:

- Connection Management (Wave 2)
- Exchange Connectivity (Wave 4)
- Notification Platform (Wave 5)
- V3-S04 / S05 / S06 (later Wave 1)
- Live-capital ADR
- Billing / teams / developer API keys

---

## Implementation Scope

See Product Scope companions for full tables. Summary IN / OUT is sections 3 and 4 above.

---

## Product Acceptance Criteria

Detail: [`v3-s03-product-scope.md`](./v3-s03-product-scope.md). Copy and complete [`version-3-product-checklist.md`](./version-3-product-checklist.md) at Close.

| #   | Outcome                                                                                                                           | Fail if                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | Trader/Admin stores Binance credentials in Vault without SSH / customer `.env` / SQL                                              | Host file is the path                           |
| 2   | Operator cannot read the secret back                                                                                              | Plaintext in UI, API, or logs                   |
| 3   | Validation refuses incomplete credentials honestly                                                                                | Fake Stored                                     |
| 4   | Vault Connected / Stored does not claim Binance trading                                                                           | Venue theater                                   |
| 5   | Revoke stops use                                                                                                                  | Cosmetic revoke                                 |
| 6   | Delete removes the credential                                                                                                     | Still retrievable                               |
| 7   | Reader/Researcher cannot manage Vault                                                                                             | Least-privilege fail                            |
| 8   | Workspace A cannot read B                                                                                                         | Leak (**0 tolerated**)                          |
| 9   | No connections / Telegram send / SMTP send / AI-use / live / billing / rotation product                                           | Later package leaked                            |
| 10  | S01, S02, and certified paper-first journeys still work if Vault or wrapping key is unavailable                                   | Regression; API down because wrapping key unset |
| 11  | Customer secrets cannot be read back or exported; host secrets (`JWT_SECRET`, wrapping key, `DATABASE_URL`) are not Vault records | Classification broken                           |
| 12  | Vault does not present Connections, Trading, AI, Notifications, or Exchanges as its product                                       | Ownership drift                                 |

The customer never uses SSH, customer `.env`, or manual database edits for these journeys.

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.** Planning records the script now. Execution is **NOT APPLICABLE** until the product exists.

```text
Secret Vault Walkthrough

□ Operator opens Vault
□ Adds Binance credentials          → Created
□ Validation                        → Validated (fields, not Binance)
□ Stored / Visible as Connected     → Connected (Vault holds the credential)
□ Confirm the secret cannot be read back or exported
□ Can revoke                        → Revoked
□ Can delete                        → Deleted

Honesty (required on the same walkthrough):

□ Connected means Vault stored the secret — not that Binance works
□ No Telegram delivery, email send, AI chat, or live trading
□ Reader/Researcher refused
□ No SSH, customer .env, or SQL
□ Sign-in and paper still available without this secret

PASS / NOT APPLICABLE / REQUIRES ACTION
```

**Connected** means **the vault holds the credential**. It does not mean Binance works.

Refresh-token reuse → family revoke is **NOT APPLICABLE**: this package does not issue or refresh sessions. Owner: **V3-S01**.

| Field                   | Value                                                        |
| ----------------------- | ------------------------------------------------------------ |
| Walkthrough name        | Secret Vault Walkthrough                                     |
| Executed in the product | **NOT APPLICABLE** (Implementation Package — no product yet) |
| Overall                 | **NOT APPLICABLE** until Product Review / Close              |

Customer-facing description: [`secret-vault-overview.md`](./secret-vault-overview.md).

---

## Architecture Review

**Fill at package time (intent).** Copy and complete [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md) again at Close (evidence).

### Package identity (intent)

| Field                            | Value                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Package                          | V3-S03                                                                          |
| Wave                             | 1 — Security Foundation                                                         |
| Existing owner (Master Plan §11) | **New justified:** Credential Vault module. Not Identity. Not Exchange Adapter. |
| Stage                            | Approved (planning COMPLETE)                                                    |

### 1. No ownership drift (intent)

| Check                                                                               | Verdict  | Evidence                                                                    |
| ----------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| Work landed in the named owner                                                      | **PASS** | Vault module named in Master Plan §10–11                                    |
| Identity remains profile/role/status; Authentication remains credentials/sessions   | **PASS** | Vendor secrets are not login passwords. S01/S02 owners unchanged            |
| Ledger / Risk / Gate / Library / Workspace aggregate not given new competing owners | **PASS** | Untouched SoT                                                               |
| Notification Delivery / Telegram                                                    | **PASS** | Not wired to consume Vault. Telegram remains in-memory product until Wave 5 |
| UI is not Source of Truth                                                           | **PASS** | Vault page is a projection                                                  |
| HTTP remains transport                                                              | **PASS** | Vault routes transport Vault                                                |

**Must not own:** venue protocol; Notification `send()`; AI Gateway calls; Ledger; Gate/Risk; Connection Management catalog; login sessions; host `DATABASE_URL`; Trading; Exchanges as a product. Vault owns secrets only.

### 2. No duplicate bounded context (intent)

| Check                                                           | Verdict  | Evidence                                                                                       |
| --------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| No second authentication, vault, ledger, or order path          | **PASS** | **One** Credential Vault. No second order path                                                 |
| No new bounded context unless Master Plan named it              | **PASS** | Credential Vault **is** named                                                                  |
| Persistence/ports added only inside an existing owner           | **PASS** | Persistence inside the **named Vault owner**, not on `ExchangeConnection`, Identity, or `.env` |
| Trading Session / SessionRecovery* not reused as login sessions | **PASS** | Untouched                                                                                      |

**New context claimed?** Named in Master Plan as: **Credential Vault**.

### 3. No duplicate Source of Truth (intent)

| Check                                                           | Verdict  | Evidence                                                                  |
| --------------------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| Money remains Ledger                                            | **PASS** | Vault is not money                                                        |
| Certification / Gate / Library not cloned                       | **PASS** | Untouched                                                                 |
| No parallel mechanism for risk, lifecycle, or identity profiles | **PASS** | Secret lifecycle is new and **only** in Vault. Identity profile unchanged |
| Projections remain projections                                  | **PASS** | Vault UI                                                                  |

### 4. Master Plan respected (intent)

| Check                                   | Verdict  | Evidence                                        |
| --------------------------------------- | -------- | ----------------------------------------------- |
| Package ID, wave, capabilities match    | **PASS** | V3-S03, Wave 1, SEC-06 / SEC-07                 |
| IN Scope is a subset of the plan        | **PASS** | Wave 1 secret line; Security Vision vault rules |
| OUT OF Scope names the real later owner | **PASS** | C01–C04, E*, N*, S04–S06, Wave 6                |
| Live capital not authorized             | **PASS** | Explicitly out                                  |
| Stop rather than patch planning         | **PASS** | No Master Plan edit; audit not rewritten        |

### 5. Product Principles respected (intent)

| Principle                    | Verdict  | Evidence (one line)                                                 |
| ---------------------------- | -------- | ------------------------------------------------------------------- |
| Customer First               | **PASS** | Vault UI; no SSH/`.env` for customer vendor secrets                 |
| Security Before Convenience  | **PASS** | No plaintext readback; no export; no fake venue Connected           |
| One Source of Truth          | **PASS** | One Vault; Ledger remains money; no secrets on `ExchangeConnection` |
| Paper First                  | **PASS** | Paper default; Vault does not start trading                         |
| Live Must Be Earned          | **PASS** | Live not authorized                                                 |
| Honest Product               | **PASS** | Vault Connected ≠ Binance connected                                 |
| AI Never Controls Capital    | **PASS** | Key may be stored; AI not invoked to trade                          |
| Everything Is Auditable      | **PASS** | Structured vault events; audit product is S05                       |
| No Hidden Configuration      | **PASS** | Customer secrets configured in Vault, not hidden host files         |
| Architecture Is a Constraint | **PASS** | New context only because Master Plan named it                       |

### 6. Dependencies unchanged (intent)

| Check                                              | Verdict  | Evidence                                             |
| -------------------------------------------------- | -------- | ---------------------------------------------------- |
| Depends only on certified V2 and Closed earlier V3 | **PASS** | PC-14, PC-18, S01 Closed, S02 Closed, audit baseline |
| No later-wave dependency                           | **PASS** | No C01, no venue I/O, no S04 requirement to compile  |
| Does not require Master Plan or Spec change        | **PASS** | Planning question YES                                |
| Reuse table honored                                | **PASS** | New justified Vault only                             |

**Dependencies used:** S01, S02, Workspace membership, host DB, host wrapping key.
**Dependencies refused:** Wave 2+, S04–S06 as blockers, live ADR.

### 7. Architecture impact justified (intent)

| Check                                                                 | Verdict  | Evidence                                      |
| --------------------------------------------------------------------- | -------- | --------------------------------------------- |
| Schema/module/port additions required by named outcome                | **PASS** | SEC-06/07 cannot be met without a vault store |
| Extension of existing owner, not platform rewrite                     | **PASS** | New **named** module; Version 2 not rewritten |
| Canonical Order Path, Ledger, Runtime evaluator, Library not replaced | **PASS** | Untouched                                     |
| Spec v2.0 / Matrix / Alias unchanged                                  | **PASS** | No ADR. No RC.                                |

**Justified additions (list):** Credential Vault module; encrypted secret persistence; retrieve port; Vault page; C8 vault cells.

**Unjustified ideas rejected:** Generic infra vault for Postgres/Redis; secrets on `ExchangeConnection`; Connection Management in Wave 1; wiring adapters now; plaintext export; second vault; ABAC; live UI.

### 8. No hidden redesign (intent)

| Check                                          | Verdict  | Evidence                                   |
| ---------------------------------------------- | -------- | ------------------------------------------ |
| No Version 2.1 rewrite                         | **PASS** | Audit respected; adapters not redesigned   |
| No new IAM / SOC / order engine / ABAC product | **PASS** | Vault only                                 |
| No Version 2-style RC track                    | **PASS** | —                                          |
| No ADR except named future live-capital ADR    | **PASS** | Vault already in Master Plan               |
| No silent Master Plan edit                     | **PASS** | This package does not edit the Master Plan |
| Certified V2 products not rebuilt              | **PASS** | Maintain                                   |

Summary (must match the checklist):

| Rule                                                           | Decision                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| No new bounded context unless the Master Plan already named it | **Yes — Credential Vault**, already named. One vault only.                     |
| No ownership drift                                             | Vendor secrets → Vault. Authn/Authz/Workspace/Ledger/adapters keep their jobs. |
| No duplicate Source of Truth                                   | No second money path; no second vault; no secrets on connection state          |
| HTTP remains transport; UI remains not Source of Truth         | Vault page is a projection                                                     |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | Unchanged                                                                      |
| Justified persistence/ports inside an existing owner           | Persistence **inside Vault**, the Master-Plan-named owner                      |

Forbidden: duplicate auth, vault, ledger, or order path; hidden redesign; Version 2-style RC track.

---

## Security Review

Detail: [`v3-s03-security-review.md`](./v3-s03-security-review.md). Copy and complete [`version-3-security-checklist.md`](./version-3-security-checklist.md) again at Close.

Planning STRIDE:

| Category               | Verdict                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| Spoofing               | **PASS** (intent) — S01 session on Vault APIs                        |
| Tampering              | **PASS** (intent) — server owns encrypt and lifecycle                |
| Repudiation            | **PASS** (intent) — structured vault events; audit product is S05    |
| Information Disclosure | **PASS** (intent) — primary control; no plaintext readback           |
| Denial of Service      | **PASS** (intent) — authenticated, size-bounded; platform DoS is S04 |
| Elevation of Privilege | **PASS** (intent) — C8 vault cells only; no live/Admin-from-vault    |

Threats this package must reduce:

| Threat (from Security Vision) | Control in this package                            |
| ----------------------------- | -------------------------------------------------- |
| Credential leakage            | Vault path; no `.env` product; no UI/log plaintext |
| Data theft                    | Encryption at rest; wrapping key separated         |
| Cross-workspace leak          | Workspace-scoped records                           |
| Insider plaintext             | Metadata only; no export                           |
| Fake venue Connected          | Honest Vault language                              |

Controls explicitly **not** this package (name the owning `V3-*` ID):

| Control                                     | Owner            |
| ------------------------------------------- | ---------------- |
| Authentication, sessions, login credentials | V3-S01           |
| Role assignment product                     | V3-S02           |
| Platform OWASP / CSP / SSRF                 | V3-S04           |
| Audit product                               | V3-S05           |
| Isolation product                           | V3-S06           |
| Connections / rotation product              | Wave 2           |
| Exchange I/O                                | Wave 4           |
| Telegram / SMTP delivery                    | Wave 5           |
| Live MFA / live authz                       | Wave 6           |
| ABAC engine                                 | Out of Version 3 |

A package cannot Close while any checklist item **or Threat Review row** is **REQUIRES ACTION**.

---

## Implementation Slices

Do not implement in the Implementation Package task. Merge order is a → e. Each slice is independently reviewable.

### S03-a — Vault bounded context and lifecycle

**Goal:** Create the Credential Vault owner: holdable types, workspace binding, states (**Created → Validated → Connected → Revoked → Deleted**), metadata. Connected means Vault stores the credential — not that the provider works. No vendor I/O. Encryption may be a failing closed placeholder only if S03-b immediately follows — do not Close a slice that persists plaintext in production-like config.

**Touch (expected):** New Vault module only. Do not add columns to `ExchangeConnection`. Do not edit Version 2 certification docs.

**Done when:** Tests prove a workspace-scoped record can be created as metadata + secret material owned by Vault; foreign workspace denied; `ExchangeConnection` still has no secrets.

**Must not:** Vault UI; adapter wiring; Connection Management; Master Plan edit; `.env` as the store; auto-import from `.env`.

### S03-b — Encryption and wrapping-key separation

**Goal:** SEC-07 outcomes: secrets at rest are ciphertext; wrapping key is not stored with ciphertext; production-like config refuses plaintext persist.

**Touch (expected):** Vault persistence/encryption path only. Host wrapping key remains host-operated.

**Done when:** Persisted form ≠ plaintext; list/read models have no secret fields; wrapping key is not in the secret record.

**Must not:** Choose a second vault product; store `DATABASE_URL` in Vault; fail API boot solely because the wrapping key is unset (Failure Philosophy: paper, authentication, and research continue); document algorithms as if they were the Master Plan.

### S03-c — Credential validation (no vendor I/O)

**Goal:** Validate required fields for Binance, Bybit, OKX, Telegram, SMTP, OpenRouter. Honest reject. Typed contract so later providers do not need a new context.

**Touch (expected):** Vault validation policy. No HTTP to `api.binance.com`, `api.telegram.org`, OpenRouter, or SMTP servers.

**Done when:** Incomplete Binance material is rejected; well-formed material is accepted as vault-valid; tests prove no network vendor call.

**Must not:** Connection test; `spot.trade` verification; SSRF allowlists as a product.

### S03-d — Secret Vault product _(original package text)_

**Goal (original):** Customer-visible Vault in the existing paper-first Administration chrome. Operator opens Vault, adds Binance credentials, sees Stored / Vault Connected, cannot read back, can revoke and delete.

**Touch (expected, original):** `apps/web` Vault page + catalog link; reuse `AppLayout`. Component tests.

**Done when (original):** Walkthrough UI steps can be performed without SSH. Copy is operator language. No “Binance connected” theater.

**Must not:** Connections home; live UI; Telegram send; email send; AI-using-key; billing; debug prefill.

**Execution note (honest):** Later PO-directed slices prohibited UI/HTTP. Executed **S03-d** delivered access control, workspace isolation, and concurrency (**Platform Complete**). The Vault product UI above remains **Customer Complete**, still owned by **Vault**, not by Connection Management. See [`v3-s03-close-criteria-resolution.md`](./v3-s03-close-criteria-resolution.md).

### S03-e — Access, isolation, retrieve port, events _(original package text)_

**Goal (original):** Bind C8 vault cells (Trader/Admin). Reader/Researcher denied. Retrieve port exists and is not a customer API. Isolation: A cannot read B. Structured events without secrets. Host vs customer split documented in behavior.

**Touch (expected, original):** Authorization on vault routes; isolation tests; retrieve port with no Exchange/AI/Notification consumers; logging.

**Done when (original):** Validation plan security and architecture tables can be evidenced. Adapters still do not consume Vault.

**Must not:** S05 audit UI; S06 rewrite of Workspace; Wave 2 wizard; wiring OpenRouter to vaulted keys; removing the env OpenRouter reader; auto-copying env into Vault.

**Execution note (honest):** Executed **S03-e** completed Platform Complete evidence under no-UI / no-HTTP. Vault HTTP routes and browser walkthrough remain Customer Complete under Vault.

Do not use slices to smuggle OUT OF Scope work.

---

## Validation Plan

Detail: [`v3-s03-validation-plan.md`](./v3-s03-validation-plan.md).
Close criteria split: [`v3-s03-close-criteria-resolution.md`](./v3-s03-close-criteria-resolution.md).
Platform Complete Close: [`v3-s03-platform-complete-close-report.md`](./v3-s03-platform-complete-close-report.md).

Tests that mock the customer outcome do not count. **UI owner = Vault.** Connection Management does not own Vault UI / HTTP / walkthrough.

| Gate                  | Meaning                                     | Unlocks                                          |
| --------------------- | ------------------------------------------- | ------------------------------------------------ |
| **Platform Complete** | Vault domain is complete and validated      | Future packages may consume Vault                |
| **Customer Complete** | Vault UI and operator workflow are complete | Operators can manage secrets through the product |

| Evidence                                                               | Gate 1 Platform Complete           | Gate 2 Customer Complete              |
| ---------------------------------------------------------------------- | ---------------------------------- | ------------------------------------- |
| Unit tests (lifecycle, encryption, validation, no vendor I/O)          | **Required — PASS**                | Required (unchanged)                  |
| Integration (restart, retrieve port, dual-run, V2/S01/S02 unregressed) | **Required — PASS**                | Required (unchanged)                  |
| Horizontal / vertical Vault HTTP + CSRF                                | Not required for Platform Complete | **Required** (open)                   |
| UI tests (Vault page)                                                  | Not required for Platform Complete | **Required** — owner **Vault** (open) |
| Manual Secret Vault Walkthrough                                        | Not required for Platform Complete | **Required** — owner **Vault** (open) |
| Security / Architecture / Product checklists (domain rows)             | **Required — PASS**                | Required (plus product surface rows)  |
| Customer acceptance — domain store / no readback                       | **Required — PASS**                | Required                              |
| Customer acceptance — store in product UI without SSH                  | Deferred at Platform Complete      | **Required** (open)                   |

**Product Owner accepted Platform Complete (2026-08-17).** Customer Complete remains open under Vault. That does not open Connection Management. V3-S04 may begin at Implementation Package.

---

## Required Reports

Every package produces these before Close. Do not create RC or ADR documents from a package.

| Report                 | When                        | Path convention                                                                             |
| ---------------------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| Implementation Package | Before Approval             | `v3-s03-implementation-package.md` (this file)                                              |
| Implementation Report  | After Implementation        | `v3-s03-implementation-report.md`                                                           |
| Architecture Review    | After Implementation Report | `v3-s03-architecture-review.md`                                                             |
| Security Review        | After Architecture Review   | Close evidence; planning companion already exists. **Must include Threat Review (STRIDE).** |
| Product Review         | After Security Review       | `v3-s03-product-review.md` **Must include the Product Walkthrough artifact.**               |
| Validation evidence    | After Product Review        | `v3-s03-validation-plan.md` plus recorded results                                           |
| Package Close record   | At Close                    | Close Checklist + Package Summary Standard below                                            |

Optional companions (written with this package): product-scope, security-review (planning), validation-plan, customer overview.

**Forbidden:** Version 2-style RC documents; ADRs except the Master Plan’s named future live-capital ADR (Wave 6); Master Plan edits from inside the package; Version 2 document edits; rewriting the Connection Management Audit.

---

## Package Close Checklist

Two named gates — see [`v3-s03-close-criteria-resolution.md`](./v3-s03-close-criteria-resolution.md).

| Gate                  | Meaning                                     | Unlocks                                          |
| --------------------- | ------------------------------------------- | ------------------------------------------------ |
| **Platform Complete** | Vault domain is complete and validated      | Future packages may consume Vault                |
| **Customer Complete** | Vault UI and operator workflow are complete | Operators can manage secrets through the product |

### Gate 1 — Platform Complete — **CLOSED** (Product Owner 2026-08-17)

Record: [`v3-s03-platform-complete-close-report.md`](./v3-s03-platform-complete-close-report.md).

| #   | Gate                                                         | Verdict                                                                            |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 1   | **Implementation Review** (domain slices S03-a … S03-e)      | **PASS**                                                                           |
| 2   | **Architecture Review** (domain)                             | **PASS**                                                                           |
| 3   | **Security Review** (domain)                                 | **PASS**                                                                           |
| 4   | **Product Review** (domain; Customer Complete honestly open) | **PASS**                                                                           |
| 5   | **Validation** (Platform Complete rows only)                 | **PASS**                                                                           |
| 6   | **All mandatory domain reports**                             | **PASS**                                                                           |
| 7   | **Master Plan compliance**                                   | **PASS**                                                                           |
| 8   | **Product Principles compliance**                            | **PASS**                                                                           |
| 9   | **Customer walkthrough (browser / Vault page)**              | **NOT required for Platform Complete** — remains Customer Complete under **Vault** |
| 10  | **UI owner named**                                           | **Vault** — not Connection Management                                              |

### Gate 2 — Customer Complete — **OPEN** (Vault-owned; not Connections)

| #   | Gate                                                         | Verdict      |
| --- | ------------------------------------------------------------ | ------------ |
| A   | Vault HTTP + CSRF evidence                                   | **NOT DONE** |
| B   | Vault UI tests                                               | **NOT DONE** |
| C   | Manual Secret Vault Walkthrough **PASS**                     | **NOT DONE** |
| D   | Product checkboxes that require opening Vault in the product | **NOT DONE** |

Customer Complete does **not** transfer to `V3-C01` Connection Management. CM consumes Vault; it does not own the Vault page.

**V3-S04 may open** at Implementation Package after Platform Complete. Connection Management must not open from this package. Wave 1 exit still requires S04–S06.

---

## Customer-visible Changes

**Fill at Close.** What a customer can now do in the product that they could not do before this package.

- _(empty until Close)_

What the UI / copy must **not** claim (already binding for implementation):

- Binance / Bybit / OKX trading connected
- Live trading
- Telegram delivery
- Email sending
- AI chat using the stored key
- Connection Management
- Billing, developer API keys
- That `.env` is still the customer secret path
- That Admin can read secrets back
- That the audit product shipped

---

## Next Package Dependencies

| Field                             | Value                                                                                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| This package unblocks             | **V3-S04** OWASP & API Hardening (after **Platform Complete**). Also **unblocks the possibility** of Wave 2, which still must wait for Wave 1 exit (S04–S06). Future packages may **consume Vault**. |
| This package does **not** unblock | Operators managing secrets through Vault UI (**Customer Complete** still open under Vault); Connection Management implementation; venue I/O; Telegram/SMTP delivery; AI-use; live capital            |
| Remaining wave work               | S04 → S05 → S06                                                                                                                                                                                      |

Do not claim wave exit. S03 is not the last package of Wave 1.

---

## Lessons Learned

**Fill at Close.** Process, reuse, and honesty only. Not a backlog of new product.

- _(empty until Close)_

If a lesson requires new scope, it is a **Master Plan revision request**, not a silent next-slice.

---

## Mandatory questions (planning answers)

These answers are the planning authority for V3-S03. Close will repeat the Package Summary Standard with evidence.

### 1. What does the customer receive?

Secure credential storage, credential lifecycle, credential validation, credential removal, and product ownership of secrets **in the Vault domain**.

- **Platform Complete:** domain can store / revoke / delete without plaintext readback; no Vault page claimed. **Closed.**
- **Customer Complete (Vault-owned, open):** operator stores Binance (and other holdable) credentials in the Vault **page**, cannot read them back, revoke, delete — without SSH / customer `.env` / SQL.

### 2. What does the customer NOT receive?

Binance connection, Telegram delivery, AI chat, email sending, live trading, Connection Management UI, exchange connectivity, rotation automation, secrets synchronization, or billing.

### 3. What business problem does Vault solve?

Customers cannot connect integrations themselves because secrets live in `.env`, in memory, or nowhere. Vault makes secrets a customer product so the host file is not the path.

### 4. Why is Vault required before Connection Management?

Connection Management without a vault still has nowhere honest to put a key. It would recreate `.env`, store plaintext on connection state, or let the operator read secrets back. The Version 2 Connection Management Audit shows there is no vault, no secret models, and no customer key path. Wave 2 depends on Wave 1 vault. Master Plan §3: no Credential Vault blocks connection wizards and customer keys.

### 5. Which future packages depend on Vault?

`V3-C01`–`C04` (Connection Management, wizard, test/health, rotation/disconnect); Wave 4 exchange packages (Binance, Bybit, OKX, Kraken); Wave 5 notification packages (Telegram, SMTP, Slack, Discord, Teams, Push); Wave 2/7 AI (OpenRouter and later providers); `V3-S05` (vault events); `V3-S06` (vault isolation tests); Wave 6 live (uses already-vaulted venue secrets); Wave 9 developer API keys. Immediate **next package** after Close is still **V3-S04**, not Connections.

### 6. Does this introduce a new bounded context?

**Yes.** Credential Vault, already justified and named in the Master Plan. Existing Identity/Auth/Exchange/Notification/AI ownership is not sufficient to store customer vendor secrets. One vault only. Not financial SoT.

### 7. Was the Master Plan respected?

**Yes (planning).** Package ID, wave, SEC-06/SEC-07, new justified Vault, host vs customer env split, no live capital, no Connection Management in Wave 1, no Master Plan edits. Classification, state machine, failure philosophy, and ownership rules added as planning freeze only. Implementation must keep this true.

### 8. Were Product Principles respected?

**Yes (planning intent).** Customer First (Vault in the product), Security Before Convenience (no readback, no export), One Source of Truth (one vault, Ledger untouched), Paper First and Live Must Be Earned (no live), Honest Product (Vault Connected is not Binance), AI Never Controls Capital (store ≠ trade), Everything Is Auditable (events, not S05 product), No Hidden Configuration (secrets in Vault), Architecture Is a Constraint (new context only because the plan named it). Dual-run keeps Version 2 capability while Vault is added.

### Migration from Version 2

**Plan (not implementation):** The only vendor secret Version 2 reads from `.env` is `OPENROUTER_API_KEY`. S03 lets the customer store it in Vault and **does not** switch AI Gateway off env. Exchange, Telegram, and customer SMTP have nothing in `.env` to copy — first write is Vault. `DATABASE_URL`, `JWT_SECRET`, host recovery mail, Redis, and process flags stay host. A new wrapping key is host-only. No auto-import. No downtime: Vault is additive; certified journeys keep working; Wave 2 is when OpenRouter **use** prefers the workspace vault key.

---

## Package Summary Standard (mandatory at Close)

Cursor (or any implementer) must answer **exactly** these questions at the end of every Version 3 package. Do not paraphrase the questions. Do not skip any.

1. What did the customer receive?
2. What did the customer NOT receive?
3. What business problem was solved?
4. What remains for later packages?
5. Which package becomes available next?
6. Was the Master Plan followed?
7. Were Product Principles respected?
8. Were any architectural deviations introduced?

Answers:

1. _(Close)_
2. _(Close)_
3. _(Close)_
4. _(Close)_
5. _(Close)_
6. _(Close)_
7. _(Close)_
8. _(Close)_

Question 8 must be **No** unless an approved Master Plan revision (and, where the Master Plan already requires it, a future ADR) already authorized the deviation. An unauthorized deviation means the package **cannot Close**. The new Vault context is **not** a deviation; it is already in the Master Plan.

---

## Product checklist (planning intent)

Copy and complete [`version-3-product-checklist.md`](./version-3-product-checklist.md) at Close. Intent now:

| Prompt                    | Planning intent                                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Customer receives         | Store / validate / revoke / delete secrets in Vault; no plaintext readback; no export                                                    |
| Customer does NOT receive | Connections, venue I/O, Telegram/email/AI-use, live, billing                                                                             |
| Business value            | Customer-owned secrets; unblocks later connections without claiming them                                                                 |
| Journey step affected     | After “sign in securely” / isolated workspace — **prepare** “connect in the product”; do not complete that step                          |
| Next capability unlocked  | Not Connections. Next **package** is S04. Next **customer connect** is Wave 2 after Wave 1                                               |
| Walkthrough               | Script above; execute at Product Review / Close                                                                                          |
| UX                        | Operator language; Vault Connected = secret stored, not provider working; no live                                                        |
| Documentation             | This package + companions; no Version 2 or Master Plan edits. Classification, state machine, failure philosophy, ownership rules frozen. |

---

## Future guidance (binding)

1. **No future Version 3 package may bypass this process.**
2. **If a package cannot satisfy this template, implementation stops until planning is updated.** Planning updates are Master Plan revisions, not package-local edits.
3. Do not start production code before Approval. **This package is Approved.** Implementation starts at S03-a.
4. Do not modify Version 2 certification, Spec v2.0, the Authority Matrix, the Alias Dictionary, or the Connection Management Audit from inside a package.
5. Do not create RC documents. Do not create ADR documents except the Master Plan’s named Wave 6 live-capital ADR when that wave is reached.
6. Live capital remains unauthorized until that future ADR. No earlier package may enable live money.
7. Conflicts: **Master Plan wins.**
8. Do not start Connection Management, S04, or any other package until this one is **Closed**.
9. Secret Classification, Secret State Machine, Failure Philosophy, and Secret Ownership Rules are binding. Implementation must not weaken them.

---

**STOP.** V3-S03 **Platform Complete** is closed (Product Owner 2026-08-17). See [`v3-s03-platform-complete-close-report.md`](./v3-s03-platform-complete-close-report.md). **Customer Complete** remains Vault-owned. V3-S04 may begin at Implementation Package. No Master Plan edits. No Version 2 edits. No RC. No ADR. Do not start Connection Management (Wave 1 exit still requires S04–S06).
