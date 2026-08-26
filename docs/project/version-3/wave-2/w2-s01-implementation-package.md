# W2-S01 Connection Management — Implementation Package

```text
Package:            W2-S01
Name:               Connection Management
Also known as:      Connections Product · Unified Connection Management
Wave:               2 — Connection Management
Master Plan map:    Wave 2 / V3-C01 (facade); capabilities CM-01, CM-21 (and Wave 2 collect path for CM-02…CM-06 planning)
Date:               2026-08-17
Status:             Implementation Package — Planning COMPLETE. Awaiting Product Owner Review and Approval.
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision. Not implementation.
Canon:              version-3-master-plan.md
```

**Process:** [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)
**Template:** [`../version-3-package-template.md`](../version-3-package-template.md)
**Annexes used (read-only):** [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md) · [`../v3-capability-inventory.md`](../v3-capability-inventory.md) · [`../v3-product-roadmap.md`](../v3-product-roadmap.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Mandatory:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Constitution:** [`../security-default-policy.md`](../security-default-policy.md)
**Baseline (read-only):** [`../../version-2-connection-management-audit.md`](../../version-2-connection-management-audit.md)

**Companions:**

| Document                                                                   | Role                                                            |
| -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`w2-s01-product-scope.md`](./w2-s01-product-scope.md)                     | IN / OUT, ownership, states, providers, acceptance              |
| [`w2-s01-security-review.md`](./w2-s01-security-review.md)                 | Threat model, security boundaries, Verification Standard intent |
| [`w2-s01-validation-plan.md`](./w2-s01-validation-plan.md)                 | How Close is proven                                             |
| [`connection-management-overview.md`](./connection-management-overview.md) | Operator / PO language product                                  |

**Prerequisites:**

| Prerequisite                    | Status                                           |
| ------------------------------- | ------------------------------------------------ |
| Version 2                       | **CERTIFIED**                                    |
| Wave 1 Security Foundation      | **CERTIFIED COMPLETE** (Product Owner authority) |
| V3-S01 Authentication & Session | **CLOSED** (consumed)                            |
| V3-S02 RBAC Product             | **CLOSED** (consumed)                            |
| V3-S03 Secret Vault             | **CLOSED** / Vault platform available (consumed) |
| V3-S04 OWASP & API Hardening    | **CLOSED** (consumed)                            |
| V3-S05 Audit Trail Foundation   | **CLOSED** (consumed)                            |
| V3-S06 Workspace Isolation      | **CLOSED** (consumed)                            |
| Master Plan                     | **FROZEN** — this package does not revise it     |
| Security Verification Standard  | **Approved** (mandatory)                         |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Approval of this package).** Scope, owners, and Wave 2 exit criteria are already in the frozen Master Plan and Execution Roadmap. This package sequences Connection Management product planning inside that freeze. Wave 1 remains CERTIFIED COMPLETE. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign.

```text
Connection Management consumes Wave 1 foundations.
It does NOT own secrets, identity, authz, workspace, security platform, or audit persistence.
It does NOT implement exchange adapters, live I/O, Telegram/SMTP delivery, or AI execution.
It does NOT reopen Wave 1.
STOP until Product Owner Approval before any implementation.
```

**Planning status:** **COMPLETE for review.** Product Owner must review and Approve before any implementation. **STOP** until Approval.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package   ← YOU ARE HERE (awaiting PO review)
        ↓
Review
        ↓
Approval                 ← required before code
        ↓
Implementation           ← W2-S01 slices only (after Approval)
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
Close
```

Do not skip a stage. Do not start production code before Approval. Do not open Wave 3 from this package. Do not claim Wave 2 exit until Master Plan Wave 2 exit criteria are met.

---

## Overview

W2-S01 opens Wave 2. It defines the **Connection Management** customer product: the operator place to create, validate, replace, disconnect, and review external service connections for a workspace — without `.env`, without SSH, and without claiming live venue I/O, delivery, or AI execution that later waves own.

Connection Management is a **product facade**. Vault still owns credentials. Exchange Adapter, Notification Delivery, and AI Gateway still own protocol I/O when those waves ship. This package owns connection metadata, lifecycle, state, validation orchestration, and provider-specific product behavior planning.

| Field                                | Value                                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Package ID                           | W2-S01                                                                                          |
| Master Plan / Execution Roadmap name | Connection Management Product (Wave 2 / V3-C01 opening package)                                 |
| Product name                         | Connection Management                                                                           |
| Wave                                 | 2 — Connection Management                                                                       |
| Capabilities (inventory IDs)         | CM-01, CM-21; Wave 2 collect / wizard / test / rotate / disconnect planning (CM-02…CM-06)       |
| Complexity                           | L                                                                                               |
| Previous                             | Wave 1 CERTIFIED COMPLETE                                                                       |
| Next after W2-S01 Close              | Remaining Wave 2 packages / slices as sequenced by Execution Roadmap (V3-C02…C04 or follow-ons) |

---

## Business Goal

- **Goal:** Paying customers can self-serve external connections in one product surface: catalog, lifecycle, validation, and honest status — without host files and without simulated “Connected” as the customer story.
- **Master Plan reference:** Execution Roadmap Wave 2; Connection Management Vision; Capability Inventory CM-01 / CM-21; Product Roadmap journeys J3-03 (collect portion), J3-04, J3-05, J3-07 (collect portion).
- **Metric this package must meet or not regress:** credential exposure **0**; default misconfig **0**; cross-workspace leak **0** for connection metadata; no dishonest “live trading connected” claim. Time-to-real-Binance-handshake remains Wave 4. Live capital remains Wave 6.

---

## Customer Problem

- **Problem:** Version 2 has no unified Connection Management. Operators cannot self-serve real external connections. Secrets live in `.env` or do not exist. Exchange “connect” is simulated. Telegram is an in-memory wizard. Reserved channels and AI keys are not customer-operable.
- **Who feels it:** Workspace operators / Admins / Traders who need integrations; Product Owner who cannot honestly sell self-serve connections.
- **What they must do today that they should not:** Edit `.env`, restart hosts, ask engineers to paste keys, trust simulated CONNECTED badges, or live without a single place to see connection health.

---

## Business Value

- **Value delivered at W2-S01 Close (after implementation):** One Connections product for offered providers; vault-backed secrets; validation flow with honest states; create / replace / disconnect / review without SSH or customer `.env`.
- **What remains blocked until later packages / waves:** Real exchange handshake I/O (Wave 4); production Telegram / SMTP delivery (Wave 5); OpenRouter runtime use beyond collect/test honesty rules (Wave 2 partial / Wave 7); monitoring product (Wave 3); live trading (Wave 6); billing and customer dashboards as SaaS products (Wave 9+).

---

## Current State

| Capability or surface                    | Status                           | Evidence                                                                   |
| ---------------------------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| Unified Connections product              | Missing                          | Version 2 Connection Management Audit                                      |
| Credential Vault                         | Already exists (Wave 1)          | V3-S03 Closed; Wave 1 CERTIFIED COMPLETE                                   |
| Authentication / Session                 | Already exists (Wave 1)          | V3-S01 Closed                                                              |
| Authorization / RBAC                     | Already exists (Wave 1)          | V3-S02 Closed                                                              |
| Workspace isolation                      | Already exists (Wave 1)          | V3-S06 Closed                                                              |
| Security Platform / Audit                | Already exists (Wave 1)          | V3-S04 / V3-S05 Closed                                                     |
| Simulated exchange connect state         | Needs extension (honest product) | Durable state without keys; must not remain the customer “Connected” story |
| Telegram in-memory wizard                | Needs extension (pattern reuse)  | UX pattern only until Wave 5 delivery                                      |
| OpenRouter via `.env`                    | Needs extension                  | Customer path must become vault + Connections                              |
| Exchange / Telegram / SMTP / AI real I/O | Out of this package              | Waves 4 / 5 / 7                                                            |

Facts implementers must not forget:

- Wave 1 is CERTIFIED COMPLETE and must not be reopened.
- Vault owns ciphertext. Connections never store customer secrets as plaintext product columns.
- Simulated CONNECTED without validation is not a customer success.
- Public market-data paths may need no trading key; do not invent secrets for public-only paths.
- Host infrastructure (`DATABASE_URL`, Redis, JWT) stays host-operated.

---

## Reuse from Version 2

| Stance          | This package                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Reuse unchanged | Certified paper path; Ledger; Canonical Order Path; Exchange Scope identity labels; Strategy Library |
| Minor extension | Telegram wizard UX language; Command Center projection of connection health (read-only later)        |
| Major extension | Customer connection product over existing adapter / notification / AI owners                         |
| New justified   | Connection Management **facade** (Master Plan already named it)                                      |
| Replace         | **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, Library                              |

| Area                 | Owner                 | This package must not own        |
| -------------------- | --------------------- | -------------------------------- |
| Customer credentials | Vault                 | Ciphertext / encryption keys     |
| Identity / sessions  | Authentication        | Login, MFA, recovery             |
| Permissions          | Authorization         | Role matrix redesign             |
| Workspace membership | Workspace             | Tenancy SoT                      |
| Hardening defaults   | Security Platform     | CSP / rate-limit product rewrite |
| Audit persistence    | Security Audit        | Append-only store                |
| Venue protocol       | Exchange Adapter      | Real venue HTTP/WS (Wave 4+)     |
| Notification send    | Notification Delivery | Telegram / SMTP delivery         |
| Model call           | AI Gateway            | OpenRouter request execution     |

---

## Dependencies

| Dependency                | Kind               | Status required before this package  |
| ------------------------- | ------------------ | ------------------------------------ |
| Wave 1 CERTIFIED COMPLETE | Prior wave         | **Required**                         |
| Vault                     | Earlier V3 package | Closed / available                   |
| Authentication            | Earlier V3 package | Closed                               |
| Authorization             | Earlier V3 package | Closed                               |
| Workspace Isolation       | Earlier V3 package | Closed                               |
| Security Platform         | Earlier V3 package | Closed                               |
| Security Audit            | Earlier V3 package | Closed                               |
| Exchange Adapter stubs    | Version 2 product  | Exists (no real I/O required here)   |
| Notification catalog      | Version 2 product  | Exists                               |
| AI Gateway OpenRouter     | Version 2 product  | Exists (env today; vault path later) |

This package does **not** depend on:

- Wave 3 Monitoring / durable ops products
- Wave 4 real venue handshake completion
- Wave 5 production Telegram / SMTP delivery
- Wave 6 live trading ADR
- Wave 7 multi-provider AI platform
- Billing, analytics dashboards, or Wave 9 SaaS admin

---

## Implementation Scope

### IN Scope

| Item                       | Customer meaning                                              | Notes / owner inside existing domain        |
| -------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| Connection lifecycle       | Create, validate, replace, disconnect, review                 | Connection Management                       |
| Connection state model     | Disconnected → … → Connected / failed / revoked / disabled    | Connection Management                       |
| Workspace ownership        | Connections belong to a workspace                             | Consumes Workspace Isolation                |
| Vault integration          | Secrets written/read via Vault; never customer `.env`         | Consumes Vault                              |
| Connection validation flow | Operator-triggered validation with honest outcomes            | Connection Management orchestrates          |
| Connection Type catalog    | Exchange, Notification, AI, Storage (planning model)          | Catalog ownership only                      |
| Supported providers        | Under types: Binance/Bybit/OKX; Telegram/SMTP; OpenRouter     | Catalog ownership only                      |
| Customer workflows         | Operator journeys for connections                             | Product Walkthrough                         |
| Security boundaries        | Authn / Authz / Isolation / Vault / Audit / Platform consumed | Does not redefine                           |
| Audit interaction          | Connection lifecycle events attributable                      | Emits to Security Audit; does not own store |
| Failure philosophy         | Fail closed; honest unavailable / failed; no fake Connected   | Security Default Policy                     |
| Validation strategy        | Slices, Close criteria, evidence, regressions                 | This package + validation plan              |

### OUT OF Scope

| Item                | Why out                                         | Owner later                             |
| ------------------- | ----------------------------------------------- | --------------------------------------- |
| Exchange adapters   | Protocol I/O not this facade                    | Exchange Adapter / Wave 4               |
| Real API calls      | Live vendor I/O deferred where Master Plan says | Wave 4 / 5 / 7                          |
| Live Trading        | Capital path gated                              | Wave 6                                  |
| Telegram delivery   | Send path                                       | Wave 5 Notification Platform            |
| SMTP delivery       | Send path                                       | Wave 5                                  |
| OpenRouter requests | Model execution                                 | AI Gateway / Wave 7 (use after collect) |
| AI execution        | Narratives / chat that spend the key            | AI Platform                             |
| Order placement     | Trading SoT                                     | Canonical Order Path / Wave 6           |
| Monitoring          | Ops health product                              | Wave 3                                  |
| Analytics           | Metrics product                                 | Later waves                             |
| Billing             | SaaS commercial                                 | Wave 9                                  |
| Customer dashboards | Broader SaaS surfaces                           | Later waves                             |
| Wave 3+             | Later wave packages                             | Execution Roadmap                       |

Nothing in IN Scope may be invented. If a desired item is not in the Master Plan, **stop**.

---

## Product Acceptance Criteria

| #   | Outcome                                                                                                 | Fail if                                                          |
| --- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | Operator opens Connections and sees Connection Types and offered providers with honest status           | Scattered env-only story; simulated Connected as default success |
| 2   | Operator creates a connection; secret goes to Vault; metadata owned by Connections                      | Secret in `.env` or plaintext connection columns                 |
| 3   | Operator runs validation; state becomes Connected or Validation Failed honestly                         | Fake success; live-trading claim from validation                 |
| 4   | Operator replaces credentials; old material invalidated via Vault; connection id retained where planned | SSH / host file edit required                                    |
| 5   | Operator disconnects; connection stops being usable; state honest                                       | Secret still treated as live Connected without operator intent   |
| 6   | Operator reviews connection history / status without reading secrets back                               | Plaintext secret shown                                           |
| 7   | Workspace A cannot manage Workspace B connections                                                       | Cross-tenant leak                                                |
| 8   | Unauthorized roles cannot manage connections                                                            | Reader/Researcher can mutate connections                         |

The customer never uses SSH, customer `.env`, or manual database edits for these journeys.

Copy and complete [`../version-3-product-checklist.md`](../version-3-product-checklist.md) at Close.

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.**

```text
Connection Management Walkthrough

□ Sign in to a workspace with connection permission
□ Open Connections
□ Create a connection for an offered provider (secret not shown after save)
□ Run Validate — see Pending Validation then Connected or Validation Failed
□ Replace credentials — connection retained; secret not readable back
□ Disconnect — state Disconnected or Revoked/Disabled as designed
□ Review connection status without seeing plaintext secrets
□ Attempt foreign workspace connection — denied
□ Unauthorized role — Connections unavailable or mutate denied
□ Product never claims Live Trading, Telegram delivered, email sent, or AI online from this package alone

PASS / NOT APPLICABLE / REQUIRES ACTION
```

Overall verdict for this package (fill at Close):

| Field                   | Value                             |
| ----------------------- | --------------------------------- |
| Walkthrough name        | Connection Management Walkthrough |
| Executed in the product | Yes (at Close)                    |
| Overall                 | PENDING APPROVAL                  |

---

## Architecture Review (planning intent)

| Rule                                                           | Decision                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| No new bounded context unless the Master Plan already named it | Connection Management facade already named; not a financial SoT         |
| No ownership drift                                             | Vault / Auth / Authz / Workspace / Platform / Audit ownership unchanged |
| No duplicate Source of Truth                                   | No second vault; no second order path; no secret columns on adapters    |
| HTTP remains transport; UI remains not Source of Truth         | Yes                                                                     |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | Unchanged                                                               |
| Justified persistence/ports inside an existing owner           | Connection metadata under Connections; secrets under Vault              |

Forbidden: duplicate auth, vault, ledger, or order path; hidden redesign; Version 2-style RC track; reopening Wave 1.

Copy and complete [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) at Close.

---

## Security Review (planning intent)

Full planning Security Review: [`w2-s01-security-review.md`](./w2-s01-security-review.md).

| Category               | Planning verdict |
| ---------------------- | ---------------- |
| Spoofing               | PASS (intent)    |
| Tampering              | PASS (intent)    |
| Repudiation            | PASS (intent)    |
| Information Disclosure | PASS (intent)    |
| Denial of Service      | PASS (intent)    |
| Elevation of Privilege | PASS (intent)    |

Threats this package must reduce:

| Threat (from Security Vision)      | Control in this package                                   |
| ---------------------------------- | --------------------------------------------------------- |
| Credential theft / `.env` exposure | Vault-only customer secret path; no secret echo           |
| Broken access control              | Authz + workspace isolation on every connection action    |
| Dishonest connected state          | Validation-gated Connected; no simulated success          |
| Cross-tenant secret use            | Workspace-scoped connections consuming isolation proof    |
| Repudiation of lifecycle           | Audit events for create / validate / replace / disconnect |

Controls explicitly **not** this package:

| Control                   | Owner                |
| ------------------------- | -------------------- |
| Secret encryption at rest | Vault                |
| Session / login           | Authentication       |
| Role matrix               | Authorization        |
| Audit append-only store   | Security Audit       |
| Platform hardening suite  | Security Platform    |
| Live order controls       | Wave 6 / Gate / Risk |

Security Verification Standard is **mandatory**. Complete at Close with Regression Suite.

---

## Connection state model (planning)

| State                  | Meaning (operator)                                               | Owner                                                                        |
| ---------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Disconnected**       | No active connection; not validated for use                      | Connection Management                                                        |
| **Pending Validation** | Operator started validation; outcome not final yet               | Connection Management                                                        |
| **Connected**          | Last validation succeeded for this connection’s offered scope    | Connection Management                                                        |
| **Validation Failed**  | Validation attempted and failed honestly                         | Connection Management                                                        |
| **Revoked**            | Connection deliberately revoked; not usable                      | Connection Management (status); Vault owns secret revoke when secret revoked |
| **Disabled**           | Connection present but disabled by policy / operator; not usable | Connection Management                                                        |

**Transitions (planning):**

```text
Disconnected
  → (create / attach secret via Vault) → Disconnected or Pending Validation
  → (validate) → Pending Validation → Connected | Validation Failed

Connected
  → (replace secret) → Pending Validation → Connected | Validation Failed
  → (disconnect) → Disconnected
  → (revoke) → Revoked
  → (disable) → Disabled

Validation Failed
  → (retry validate / replace) → Pending Validation → …
  → (disconnect / revoke / disable) → Disconnected | Revoked | Disabled

Disabled / Revoked
  → (re-enable / recreate per product rules) → Disconnected | Pending Validation
```

Vault owns whether ciphertext exists, is revoked, or is deleted. Connection Management owns whether the **connection** is Connected. Connected never means live trading, message delivered, or AI executed.

---

## Connection Type model (planning recommendation)

Product Owner recommendation for the catalog model. **Does not change ownership. Does not revise the Master Plan.** It only structures how Connections scales from Wave 2 into Waves 5–7.

```text
Connection Type
  ├── Exchange
  │     ├── Binance
  │     ├── Bybit
  │     └── OKX
  ├── Notification
  │     ├── Telegram
  │     └── SMTP
  ├── AI
  │     └── OpenRouter
  └── Storage
        └── (none offered in Wave 2)
```

| Layer               | Meaning                                                                | Owner                         |
| ------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| **Connection Type** | Category of external integration (Exchange, Notification, AI, Storage) | Connection Management catalog |
| **Provider**        | Concrete vendor inside a type (Binance, Telegram, OpenRouter, …)       | Connection Management catalog |
| **Connection**      | Workspace instance of a provider (lifecycle + state)                   | Connection Management         |
| **Secret**          | Credential material for that connection                                | Vault                         |

| Connection Type  | Wave 2 offered providers | Wave 2 role                                       | Protocol I/O later                |
| ---------------- | ------------------------ | ------------------------------------------------- | --------------------------------- |
| **Exchange**     | Binance, Bybit, OKX      | Catalog + credential collect + validation honesty | Exchange Adapter (Wave 4+)        |
| **Notification** | Telegram, SMTP           | Catalog + credential collect + validation honesty | Notification Delivery (Wave 5+)   |
| **AI**           | OpenRouter               | Catalog + credential collect + validation honesty | AI Gateway (Wave 2/7 rules)       |
| **Storage**      | None                     | Type reserved for later scaling                   | Later wave / Master Plan deferral |

Why this model: adding Slack under **Notification**, Anthropic under **AI**, or a future object store under **Storage** extends the catalog without inventing a new Connections product or changing Vault / adapter ownership.

Do not implement provider adapters in this planning package. Do not claim reserved providers or the Storage type as offered until the Master Plan wave ships them.

---

## Implementation Slices (planning — not to implement now)

### W2-S01-a — Connections catalog & metadata foundation

**Goal:** Workspace-scoped connection records and offered catalog modeled as **Connection Type → Provider** without vendor I/O.
**Touch (expected):** Connection Management product surface + metadata persistence ports (existing domains only).
**Done when:** Operator can list Connection Types and offered providers (Exchange / Notification / AI; Storage empty) and see Disconnected / not-yet-validated honesty.
**Must not:** Real API calls; secret plaintext columns; Wave 1 reopen; treat Storage as offered.

### W2-S01-b — Vault-backed create & replace

**Goal:** Create and replace connections writing secrets only through Vault.
**Done when:** Create/replace walkthrough works; secret not readable back.
**Must not:** `.env` customer path; adapter I/O.

### W2-S01-c — Validation flow & state machine

**Goal:** Pending Validation → Connected | Validation Failed with honest failures.
**Done when:** State transitions evidenced; no fake Connected.
**Must not:** Live trading enablement; Telegram/SMTP send; OpenRouter spend beyond approved test probe policy.

### W2-S01-d — Disconnect, revoke, disable & review

**Goal:** Disconnect / revoke / disable and operator review without secret disclosure.
**Done when:** Walkthrough complete; audit events emitted.
**Must not:** Audit store redesign; cross-workspace access.

### W2-S01-e — Security verification & Close evidence

**Goal:** Verification Standard + regressions + Product Walkthrough PASS.
**Done when:** Close checklist eligible.
**Must not:** Scope expansion into Wave 3+.

---

## Validation Plan

Companion: [`w2-s01-validation-plan.md`](./w2-s01-validation-plan.md).

| Gate                                                          | Required                       |
| ------------------------------------------------------------- | ------------------------------ |
| Unit tests                                                    | Yes                            |
| Integration tests                                             | Yes                            |
| UI tests                                                      | Yes (customer-visible package) |
| Manual product walkthrough                                    | **Yes**                        |
| Security verification (checklist)                             | **Yes**                        |
| Security Verification Standard + Regression Suite             | **Yes**                        |
| Architecture verification (checklist)                         | **Yes**                        |
| Product verification (checklist)                              | **Yes**                        |
| Customer acceptance of Master Plan outcomes this package owns | **Yes**                        |

---

## Required Reports

| Report                 | When                        | Path convention                                               |
| ---------------------- | --------------------------- | ------------------------------------------------------------- |
| Implementation Package | Before Approval             | `w2-s01-implementation-package.md` (this document)            |
| Implementation Report  | After Implementation        | `w2-s01-implementation-report.md`                             |
| Architecture Review    | After Implementation Report | `w2-s01-architecture-review.md`                               |
| Security Review        | After Architecture Review   | `w2-s01-security-review.md` (planning now; evidence at Close) |
| Product Review         | After Security Review       | `w2-s01-product-review.md`                                    |
| Validation evidence    | After Product Review        | `w2-s01-validation-plan.md` + recorded results                |
| Package Close record   | At Close                    | Close Checklist + Package Summary Standard                    |

**Forbidden:** Version 2-style RC documents; ADRs except Master Plan’s named Wave 6 live-capital ADR; Master Plan edits from inside this package; Wave 1 reopen.

---

## Package Close Checklist

| #   | Gate                          | Verdict                |
| --- | ----------------------------- | ---------------------- |
| 1   | Implementation Review         | NOT DONE (planning)    |
| 2   | Architecture Review           | NOT DONE (planning)    |
| 3   | Security Review               | NOT DONE (planning)    |
| 4   | Product Review                | NOT DONE (planning)    |
| 5   | Validation                    | NOT DONE (planning)    |
| 6   | All mandatory reports         | NOT DONE (planning)    |
| 7   | Master Plan compliance        | PASS (planning intent) |
| 8   | Product Principles compliance | PASS (planning intent) |
| 9   | Customer walkthrough          | NOT DONE (planning)    |

---

## Customer-visible Changes

**Fill at Close.**

-

What the UI / copy must **not** claim:

- Live trading connected
- Telegram delivered / email sent
- AI online solely because a key was stored or validated
- Wave 3+ monitoring or billing products

---

## Next Package Dependencies

| Field                             | Value                                                                  |
| --------------------------------- | ---------------------------------------------------------------------- |
| This package unblocks             | Remaining Wave 2 connection slices / V3-C02…C04 sequencing             |
| This package does **not** unblock | Wave 4 venue I/O exit; Wave 5 delivery; Wave 6 live; Wave 3 monitoring |
| Remaining wave work               | Wave 2 exit criteria in Execution Roadmap                              |

---

## Lessons Learned

**Fill at Close.**

-

---

## Package Summary Standard (mandatory at Close)

1. What did the customer receive?
2. What did the customer NOT receive?
3. What business problem was solved?
4. What remains for later packages?
5. Which package becomes available next?
6. Was the Master Plan followed?
7. Were Product Principles respected?
8. Were any architectural deviations introduced?

Answers: **PENDING CLOSE** (planning package only).

---

## Mandatory Questions (Planning Package answers)

### 1. What customer problem does Connection Management solve?

Paying customers cannot self-serve external integrations today. Keys live in host files or do not exist; “Connected” is often simulated; there is no single honest product to create, validate, replace, disconnect, and review connections per workspace.

### 2. Which Wave 1 capabilities does it consume?

Vault (credentials), Authentication (identity/session), Authorization (who may manage connections), Workspace Isolation (tenant boundary), Security Platform (hardening defaults), Security Audit (attributable lifecycle events).

### 3. What does Connection Management own?

Connection metadata, connection lifecycle, connection state, connection validation orchestration, and provider-specific **product** behavior (catalog, wizard fields, honesty rules) — not protocol engines.

### 4. What does it explicitly not own?

Customer secrets (Vault), identity/authentication, authorization, workspace membership, security platform, audit persistence, exchange adapters, notification delivery, AI execution, order placement, monitoring, analytics, billing.

### 5. Which providers are planned?

Catalog model: **Connection Type → Provider**. Types: **Exchange**, **Notification**, **AI**, **Storage**. Wave 2 offered providers: Exchange — Binance, Bybit, OKX; Notification — Telegram, SMTP; AI — OpenRouter; Storage — none. Planning only in this package.

### 6. What remains outside Wave 2?

Exchange real I/O completion (Wave 4), Telegram/SMTP delivery (Wave 5), live trading (Wave 6), broader AI providers / runtime platform (Wave 7), monitoring & durability products (Wave 3), analytics, billing, customer dashboards, Wave 9+ SaaS.

---

## Future guidance (binding)

1. No production code before Product Owner Approval.
2. No Master Plan, Version 2, architecture, or ownership changes from this package.
3. Do not reopen Wave 1.
4. Do not implement providers, adapters, or live integrations under the guise of planning.
5. Conflicts: **Master Plan wins.**

---

**STOP.** Wait for Product Owner review before W2-S01 implementation begins.
