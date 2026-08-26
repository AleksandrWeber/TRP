# W2-S05 AI Connectivity Foundation — Implementation Package

```text
Package:            W2-S05
Name:               AI Connectivity Foundation
Also known as:      OpenRouter Runtime Use · AI Connection Use Foundation
Wave:               2 — Connection Management
Master Plan map:    Wave 2 exit outcomes for OpenRouter vaulted-key use without
                    customer `.env` or restart (CM-17 Wave 2 use path; CM-06 for
                    OpenRouter; CM-03 OpenRouter test honesty). Not Wave 7 AI
                    Platform. Official Master Plan package IDs remain V3-C01…C04;
                    W2-S05 is Product Owner operational sequencing after W2-S04.
Date:               2026-08-26
Status:             Implementation Package — Planning COMPLETE. Awaiting Product Owner Review and Approval.
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision. Not implementation.
Canon:              version-3-master-plan.md
```

**Process:** [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)
**Template:** [`../version-3-package-template.md`](../version-3-package-template.md)
**Annexes used (read-only):** [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md) · [`../v3-capability-inventory.md`](../v3-capability-inventory.md) · [`../v3-product-roadmap.md`](../v3-product-roadmap.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Mandatory:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Constitution:** [`../security-default-policy.md`](../security-default-policy.md)
**Consumed products (read-only):** [`connection-management-overview.md`](./connection-management-overview.md) · [`paper-trading-overview.md`](./paper-trading-overview.md) · [`exchange-connectivity-overview.md`](./exchange-connectivity-overview.md) · [`market-data-overview.md`](./market-data-overview.md)

**Companions:**

| Document                                                       | Role                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------- |
| [`w2-s05-product-scope.md`](./w2-s05-product-scope.md)         | IN / OUT, ownership, honesty, acceptance              |
| [`w2-s05-security-review.md`](./w2-s05-security-review.md)     | Threat model, integrity, Verification Standard intent |
| [`w2-s05-validation-plan.md`](./w2-s05-validation-plan.md)     | How Close is proven                                   |
| [`ai-connectivity-overview.md`](./ai-connectivity-overview.md) | Operator / PO language product                        |
| [`w2-s05-planning-summary.md`](./w2-s05-planning-summary.md)   | Planning open record                                  |
| [`wave-2-progress.md`](./wave-2-progress.md)                   | Wave 2 package status                                 |

**Prerequisites:**

| Prerequisite                    | Status                                           |
| ------------------------------- | ------------------------------------------------ |
| Version 2                       | **CERTIFIED**                                    |
| Wave 1 Security Foundation      | **CERTIFIED COMPLETE** (Product Owner authority) |
| W2-S01 Connection Management    | **CLOSED** (consumed; not redesigned)            |
| W2-S02 Exchange Connectivity    | **CLOSED** (consumed; not redesigned)            |
| W2-S03 Market Data Foundation   | **CLOSED** (consumed; not redesigned)            |
| W2-S04 Paper Trading Foundation | **CLOSED** (Product Owner authority; consumed)   |
| V3-S01 Authentication & Session | **CLOSED** (consumed)                            |
| V3-S02 RBAC Product             | **CLOSED** (consumed)                            |
| V3-S03 Secret Vault             | **CLOSED** / Vault platform available (consumed) |
| V3-S04 OWASP & API Hardening    | **CLOSED** (consumed)                            |
| V3-S05 Audit Trail Foundation   | **CLOSED** (consumed)                            |
| V3-S06 Workspace Isolation      | **CLOSED** (consumed)                            |
| Master Plan                     | **FROZEN** — this package does not revise it     |
| Security Verification Standard  | **Approved** (mandatory)                         |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Approval of this package).** Wave 2 Master Plan customer-observable outcomes already name OpenRouter vaulted-key use without restart and without customer `.env`. Connection Management already collects OpenRouter credentials. This package sequences the remaining Wave 2 use path so the workspace vaulted key is preferred by AI Gateway runtime, with honest OpenRouter test and offline behavior. Wave 1 remains CERTIFIED COMPLETE. W2-S01…W2-S04 remain CLOSED. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Wave 7 AI Platform is not introduced. Live Trading is not introduced.

```text
AI Connectivity Foundation consumes Connection Management, Vault, Wave 1, and existing AI Gateway.
It does NOT redesign Connection Management, Vault, Authentication, Authorization, or AI Gateway ownership.
It does NOT own secrets, identity, authz, workspace, audit persistence, or monitoring.
It does NOT deliver Wave 7 multi-provider AI Platform, Knowledge durability, or Notification delivery.
Vaulted OpenRouter key use does NOT mean Live Trading, capital control, or AI Platform Complete.
STOP until Product Owner Approval before any implementation.
```

**Planning status:** **COMPLETE for review.** Product Owner must review and Approve before any implementation. **STOP** until Approval.

**Master Plan clarity note:** The approved Master Plan / Execution Roadmap does **not** assign an official package ID `W2-S05`. Wave 2 roadmap IDs are `V3-C01`…`V3-C04`. Operational packages `W2-S01`…`W2-S04` were Product Owner–sequenced. This package maps only remaining named Wave 2 exit outcomes for OpenRouter use / no customer `.env` / OpenRouter test honesty. It does not invent new Master Plan capabilities.

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
Implementation           ← after Approval only; slices sequenced later by PO
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

Do not skip a stage. Do not start production code before Approval. Do not open Wave 3 from this package. Do not claim Wave 2 exit. Do not claim Live Trading. Do not claim Wave 7 AI Platform Complete. **This planning package does not open implementation slices.**

---

## Overview

W2-S05 opens **AI Connectivity Foundation**. It is the product package that lets a workspace **use a Vault-stored OpenRouter key** for AI Gateway runtime without editing customer `.env` and without restarting the product for that operator — with honest OpenRouter test success/failure and honest offline when no usable key exists.

It consumes W2-S01 Connection Management (AI / OpenRouter catalog, credential collect, lifecycle), Vault, Authentication, Authorization, Workspace Isolation, Security Platform, and Security Audit. It consumes prior Wave 2 packages as closed context and does not redesign them. Operators still manage the OpenRouter connection in Connections. This package does not invent a second Connections product and does not enable Live Trading or capital control by AI.

Vault still owns credentials. Authentication still owns identity. Authorization still owns permission. Workspace Isolation still owns the tenant boundary. AI Gateway / `OpenRouterProvider` still own protocol I/O. This package owns the **product outcomes**: workspace vaulted OpenRouter key preference for runtime use, OpenRouter connection test honesty (vendor-visible failure), no-restart use after save/rotate, honest offline / fallback rules for production customer story, and attributable AI-connectivity outcomes.

| Field                                | Value                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Package ID                           | W2-S05                                                                                           |
| Master Plan / Execution Roadmap name | Wave 2 OpenRouter use / no customer `.env` (CM-17 use path; CM-06; CM-03 OpenRouter); not V3-A01 |
| Product name                         | AI Connectivity Foundation                                                                       |
| Wave                                 | 2 — Connection Management                                                                        |
| Capabilities (inventory IDs)         | CM-17 (Wave 2 use path), CM-06 (OpenRouter), CM-03 (OpenRouter test); SEC-12 consume only        |
| Complexity                           | M                                                                                                |
| Previous                             | W2-S04 CLOSED                                                                                    |
| Next after W2-S05 Close              | Remaining Wave 2 packages / Wave Exit as sequenced by Product Owner; Live Trading stays later    |

---

## Business Goal

- **Goal:** Allow operators to save an OpenRouter key in Connections and use AI for their workspace without editing customer `.env` or restarting the product for that change — with honest test and offline behavior.
- **Honesty:** **OpenRouter Connected / test success** means the vaulted key was usable for the offered OpenRouter test. It does **not** mean Live Trading, capital control, Notification delivery, Knowledge Platform Complete, or Wave 7 AI Platform Complete.
- **Master Plan reference:** Wave 2 customer-observable outcome — “I save an OpenRouter key in the UI and use AI without editing `.env` or restarting for me.” Execution Roadmap Wave 2 exit — OpenRouter key saved to vault and used without restart; customers do not need `.env` for OpenRouter. Vision — workspace vault key; test chat completion; offline fallback remains; env becomes dev fallback only.
- **Metric this package must meet or not regress:** credential exposure **0**; default misconfig **0**; cross-workspace key leak **0**; no dishonest Live Trading claim; no AI capital control; no plaintext OpenRouter key echo; no production customer story that requires OpenRouter `.env`. Live capital remains Wave 6. Full AI Platform remains Wave 7.

---

## Customer Problem

- **Problem:** W2-S01 lets operators store an OpenRouter key in Vault through Connections. That is not yet workspace runtime use. Paying customers still depend on host `.env` / process restart for AI, or see collect without honest use — violating Wave 2 Connection Management exit.
- **Who feels it:** Workspace operators who need their own AI key without SSH; Product Owner who cannot claim Wave 2 exit while OpenRouter remains process-global; later Wave 7 that must extend a working vaulted OpenRouter path rather than invent a second secret story.
- **What they must do today that they should not:** Edit `.env`, restart the API for their key, share a host-global OpenRouter key, or treat Connections collect as finished AI connectivity.

---

## Business Value

- **Value delivered at W2-S05 Close (after implementation):** An operator can open Connections, ensure an OpenRouter connection with Vault credentials, run OpenRouter test with success or vendor-visible failure, use AI for that workspace from the vaulted key without customer `.env` and without restart for that save/rotate, and see honest offline when no usable workspace key exists (with documented host fallback rules that are not the production customer story).
- **What remains blocked until later packages / waves:** Wave 7 multi-provider AI (OpenAI / Gemini / Anthropic); Knowledge durability / exporters; Notification delivery (Wave 5); Exchange real venue trading (Wave 4 / 6); Live Trading; monitoring product; analytics product; billing; Wave 2 COMPLETE unless Product Owner separately declares remaining exit criteria met.

---

## Current State

| Capability or surface                               | Status                              | Evidence                 |
| --------------------------------------------------- | ----------------------------------- | ------------------------ |
| Connection Management product                       | Already exists (W2-S01)             | W2-S01 CLOSED            |
| OpenRouter catalog + credential collect             | Already exists (W2-S01)             | Collect ≠ runtime use    |
| OpenRouter local validation honesty                 | Already exists (W2-S01)             | Not vendor test / use    |
| Rotate / disconnect lifecycle                       | Already exists (W2-S01)             | Consumed; not redesigned |
| Exchange Connectivity / Market Data / Paper         | Already exists (W2-S02…S04)         | Closed; not this package |
| Vault-backed OpenRouter ciphertext                  | Already exists                      | Vault consumed           |
| AI Gateway OpenRouter runtime from `.env`           | Version 2 / dual-run leftover       | Wave 2 exit gap          |
| Workspace vaulted OpenRouter runtime preference     | Missing as W2-S05 foundation        | This package             |
| OpenRouter vendor-visible test                      | Missing / incomplete vs Wave 2 exit | This package             |
| Production customer story without OpenRouter `.env` | Missing                             | This package             |
| Wave 7 AI Platform / multi-provider                 | Out of this package                 | Wave 7                   |

Facts implementers must not forget:

- Wave 1 is CERTIFIED COMPLETE and must not be reopened.
- W2-S01…W2-S04 are CLOSED and must not be redesigned.
- Vault owns ciphertext. This package never stores customer secrets locally and never echoes plaintext keys.
- AI Gateway / OpenRouterProvider remain protocol I/O owners.
- Connection Management remains the Connections facade.
- Env OpenRouter key becomes **dev / host fallback only**, not the production customer story, when a workspace vault key exists (Vision / Vault migration plan already named).
- Offline must be honest when no usable key exists.
- AI never controls capital. No Live Trading. No Gate/Risk bypass.
- No Wave 7 multi-provider AI Platform claim.
- No Notification delivery. No Telegram production send.
- No implementation slices in this planning open — Product Owner sequences slices only after Approval.

---

## Reuse from existing products

| Stance          | This package                                                                                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reuse unchanged | Connection Management facade; Vault; Authentication; Authorization; Workspace Isolation; Audit; Platform; AI Gateway / OpenRouterProvider ownership; Paper / Market Data / Exchange Connectivity closed products |
| Minor extension | AI Gateway runtime preference: workspace vaulted OpenRouter key when present; Connections OpenRouter test honesty for vendor-visible outcomes; offline honesty                                                   |
| Major extension | Nothing. No new AI Platform domain. No second Connections product. No second Vault. No Live Trading domain.                                                                                                      |
| New justified   | Nothing. No new bounded context. Master Plan already named Wave 2 OpenRouter use / Connections facade / Vault.                                                                                                   |
| Replace         | **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, Library, Wave 1, W2-S01…W2-S04 ownership                                                                                                         |

| Area                 | Owner                 | This package must not own         |
| -------------------- | --------------------- | --------------------------------- |
| Customer credentials | Vault                 | Ciphertext / encryption keys      |
| Identity / sessions  | Authentication        | Login, MFA, recovery              |
| Permissions          | Authorization         | Role matrix redesign              |
| Workspace membership | Workspace             | Tenancy SoT                       |
| Hardening defaults   | Security Platform     | CSP / rate-limit product rewrite  |
| Audit persistence    | Security Audit        | Append-only store                 |
| Connection product   | Connection Management | Catalog / lifecycle redesign      |
| AI protocol I/O      | AI Gateway            | Gateway rewrite as new domain     |
| Live money / orders  | Ledger / Order Path   | Live trading / exchange execution |

---

## Dependencies

| Dependency                      | Kind                       | Status required before this package  |
| ------------------------------- | -------------------------- | ------------------------------------ |
| Wave 1 CERTIFIED COMPLETE       | Prior wave                 | **Required**                         |
| W2-S01 Connection Management    | Prior Wave 2 package       | **CLOSED**                           |
| W2-S02 Exchange Connectivity    | Prior Wave 2 package       | **CLOSED** (context; not redesigned) |
| W2-S03 Market Data Foundation   | Prior Wave 2 package       | **CLOSED** (context; not redesigned) |
| W2-S04 Paper Trading Foundation | Prior Wave 2 package       | **CLOSED**                           |
| Vault                           | Earlier V3 package         | Closed / available                   |
| Authentication                  | Earlier V3 package         | Closed                               |
| Authorization                   | Earlier V3 package         | Closed                               |
| Workspace Isolation             | Earlier V3 package         | Closed                               |
| Security Platform               | Earlier V3 package         | Closed                               |
| Security Audit                  | Earlier V3 package         | Closed                               |
| AI Gateway / OpenRouterProvider | Existing Version 2 product | Available (consumed; not redesigned) |

This package does **not** depend on:

- Wave 3 Monitoring / durable ops products
- Wave 4 remaining venue trading outcomes
- Wave 5 production Telegram / SMTP delivery
- Wave 6 live trading ADR
- Wave 7 multi-provider AI platform / Knowledge exporters
- Billing, analytics dashboards, or Wave 9 SaaS admin
- Risk engine, leverage, margin, liquidation, or strategy engine

---

## Implementation Scope

### IN Scope

| Item                                     | Customer meaning                                                               | Notes / owner inside existing domain |
| ---------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| Vaulted OpenRouter runtime preference    | Workspace vault key used for AI when present                                   | Consume Vault + AI Gateway           |
| No customer `.env` for OpenRouter use    | Production customer story does not require OpenRouter env                      | CM-06 OpenRouter                     |
| No restart for vaulted key use           | Save/rotate vaulted OpenRouter key does not require operator process restart   | Wave 2 exit                          |
| OpenRouter connection test               | Operator-triggered test; success or vendor-visible failure                     | CM-03 OpenRouter; CM-17 test         |
| Honest offline                           | No usable workspace key → offline honesty (host fallback not production story) | Vision already named                 |
| Workspace-scoped AI key use              | Workspace A cannot use Workspace B’s OpenRouter key                            | CM-05 / isolation consume            |
| Consume Connections OpenRouter lifecycle | Create / validate / rotate / disconnect remain Connection Management           | Do not redesign facade               |
| Security boundaries                      | Authn / Authz / Isolation / Vault / Audit / Platform consumed                  | Does not redefine                    |
| Audit interaction                        | OpenRouter use / test / fail / offline attributable                            | Emits to Security Audit              |
| Failure philosophy                       | Fail closed; no fake AI online; no secret echo                                 | Security Default Policy              |
| Validation strategy                      | Close criteria, evidence, regressions                                          | This package + validation plan       |

### OUT OF Scope

| Item                                | Why out                                                      | Owner later              |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------ |
| Wave 7 AI Platform Complete         | Multi-provider / full AI product                             | Wave 7 / V3-A01…A04      |
| OpenAI / Gemini / Anthropic         | Optional providers                                           | Wave 7 (CM-18…CM-20)     |
| Knowledge durability / export       | Knowledge Platform                                           | Wave 7                   |
| Notification delivery               | Telegram / SMTP send                                         | Wave 5                   |
| Telegram vendor production test     | Vision: real Telegram after W5                               | Wave 5                   |
| Exchange Connectivity redesign      | Already CLOSED                                               | W2-S02                   |
| Market Data redesign                | Already CLOSED                                               | W2-S03                   |
| Paper Trading redesign              | Already CLOSED                                               | W2-S04                   |
| Connection Management redesign      | Facade already shipped                                       | W2-S01                   |
| Vault redesign                      | Secret store                                                 | Vault                    |
| Live Trading                        | Wave 6                                                       | Wave 6 / Order Path      |
| AI capital control                  | Forbidden                                                    | Never                    |
| Monitoring                          | Ops health product                                           | Wave 3                   |
| Analytics                           | Analytics product                                            | Later                    |
| Billing                             | SaaS commercial                                              | Wave 9                   |
| Background health scheduler product | CM-04 full health product may remain later Wave 2 sequencing | PO clarification / later |
| Wave 2 COMPLETE declaration         | Exit is Product Owner only                                   | Product Owner            |
| Wave 1 changes                      | CERTIFIED COMPLETE                                           | Forbidden                |
| Master Plan changes                 | Frozen                                                       | Forbidden                |
| Implementation slices               | Not opened in this planning task                             | After Approval by PO     |

Nothing in IN Scope may be invented. If a desired item is not already named in Master Plan / Execution Roadmap / Vision / inventory for Wave 2 OpenRouter use, **stop**.

---

## Product Acceptance Criteria

| #   | Outcome                                                                                       | Fail if                                               |
| --- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Operator saves OpenRouter key via Connections / Vault and uses AI for that workspace          | Customer `.env` required for that journey             |
| 2   | Vaulted key use does not require operator process restart                                     | Restart required after save/rotate for use            |
| 3   | OpenRouter test shows success or vendor-visible failure                                       | Fake Connected; secret echo; silent success           |
| 4   | No usable workspace key → honest offline (host env not production customer story)             | Fake AI online; auto-import host key into all tenants |
| 5   | Workspace A cannot use Workspace B’s OpenRouter key                                           | Cross-tenant leak                                     |
| 6   | Unauthorized roles cannot manage or use OpenRouter connectivity outcomes                      | Privilege bypass                                      |
| 7   | Product never claims Live Trading, capital control, Notification delivery, or Wave 7 Complete | Dishonest product claim                               |
| 8   | Secrets never shown, exported, or logged as plaintext                                         | Plaintext exposure                                    |

The customer never uses SSH, customer `.env`, local secret files, or manual database edits for these journeys.

Copy and complete [`../version-3-product-checklist.md`](../version-3-product-checklist.md) at Close.

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.**

```text
AI Connectivity Walkthrough

□ Sign in
□ Open Connections
□ Open or create OpenRouter (AI) connection
□ Store / replace Vault-backed OpenRouter key (write-only)
□ Run OpenRouter Test — success or vendor-visible failure
□ Use AI for this workspace from vaulted key (no customer .env; no restart)
□ Rotate key — previous material unusable; use continues without restart story broken
□ Disconnect / revoke — AI use stops honestly for this workspace
□ No usable key — honest offline
□ Foreign workspace OpenRouter key — denied
□ Unauthorized role — denied
□ Confirm no Live Trading, no capital control, no Notification delivery, no Wave 7 Complete

PASS / NOT APPLICABLE / REQUIRES ACTION
```

Overall verdict for this package (fill at Close):

| Field                   | Value                       |
| ----------------------- | --------------------------- |
| Walkthrough name        | AI Connectivity Walkthrough |
| Executed in the product | Yes (at Close)              |
| Overall                 | PENDING APPROVAL            |

---

## Architecture Review (planning intent)

| Rule                                                           | Decision                                                                                                   |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| No new bounded context unless the Master Plan already named it | Connections facade, Vault, AI Gateway already named; Wave 2 OpenRouter use already named                   |
| No ownership drift                                             | Vault / Auth / Authz / Workspace / Platform / Audit / Connections / AI Gateway unchanged as owners         |
| No duplicate Source of Truth                                   | No second vault; no second Connections product; no second AI gateway; no live trading SoT                  |
| HTTP remains transport; UI remains not Source of Truth         | Yes                                                                                                        |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | Unchanged                                                                                                  |
| Justified persistence/ports inside an existing owner           | Runtime preference lives with AI Gateway consume of Vault; connection records remain Connection Management |

Forbidden: duplicate auth, vault, ledger, or live order path; hidden redesign; Version 2-style RC track; reopening Wave 1; redesigning W2-S01…W2-S04; claiming Live Trading; claiming Wave 7 Complete; auto-importing host OpenRouter env into every workspace; AI capital control.

---

## Security Review (planning intent)

Full planning Security Review: [`w2-s05-security-review.md`](./w2-s05-security-review.md).

| Category               | Planning verdict |
| ---------------------- | ---------------- |
| Spoofing               | PASS (intent)    |
| Tampering              | PASS (intent)    |
| Repudiation            | PASS (intent)    |
| Information Disclosure | PASS (intent)    |
| Denial of Service      | PASS (intent)    |
| Elevation of Privilege | PASS (intent)    |

Threats this package must reduce:

| Threat                                        | Control in this package                                      |
| --------------------------------------------- | ------------------------------------------------------------ |
| Cross-tenant OpenRouter key use               | Workspace-scoped vault retrieve and runtime preference       |
| Unauthorized AI connectivity / key use        | Authz + workspace isolation on manage and use paths          |
| Plaintext key echo / export                   | Write-only credentials; no read-back; no log of secret       |
| Host env auto-imported into every workspace   | Forbidden; env is fallback only, not silent tenant default   |
| Fake AI online / fake Connected               | Honest offline; vendor-visible test failure                  |
| AI used to place live orders / spend capital  | AI never controls capital; no Live Trading from this package |
| Replay of prior test success as current proof | Test/use outcomes not client-assertable integrity tokens     |

Controls explicitly **not** this package:

| Control                   | Owner                |
| ------------------------- | -------------------- |
| Secret encryption at rest | Vault                |
| Session / login           | Authentication       |
| Role matrix               | Authorization        |
| Audit append-only store   | Security Audit       |
| Platform hardening suite  | Security Platform    |
| Connection catalog SoT    | W2-S01               |
| Live order controls       | Wave 6 / Gate / Risk |

Security Verification Standard is **mandatory**. Complete at Close with Regression Suite.

---

## Honesty model (planning)

| Claim                                   | Allowed after this package? | Meaning                                                 |
| --------------------------------------- | --------------------------- | ------------------------------------------------------- |
| **OpenRouter key stored**               | Yes                         | Vault holds workspace ciphertext (already W2-S01)       |
| **OpenRouter test succeeded**           | Yes, if vendor test passed  | Offered OpenRouter test used vaulted key                |
| **AI usable for this workspace**        | Yes, if vaulted key usable  | Runtime prefers workspace vault key; no customer `.env` |
| **AI offline**                          | Yes, when no usable key     | Honest unavailable — not fake success                   |
| **Live Trading enabled**                | **No**                      | Live Trading is not this package                        |
| **AI controls capital / places orders** | **No**                      | Forbidden                                               |
| **Notification delivered**              | **No**                      | Wave 5                                                  |
| **Wave 7 AI Platform Complete**         | **No**                      | Multi-provider / Knowledge remain later                 |
| **Wave 2 COMPLETE**                     | **No**                      | Product Owner exit declaration only                     |

Connections collect success is **not** the customer success for AI Connectivity Foundation. Collect remains W2-S01 honesty. This package adds runtime use and OpenRouter test honesty; it does not change Exchange Connected meaning or Paper Trading honesty.

---

## Planning principles (binding)

1. AI Connectivity must consume Connection Management and Vault.
2. AI Connectivity must never store or echo plaintext OpenRouter keys.
3. Runtime must prefer workspace vaulted OpenRouter key when present.
4. Production customer story must not require OpenRouter `.env`.
5. Save/rotate vaulted key must not require operator process restart for use.
6. No usable key → honest offline.
7. OpenRouter test must be honest — success or vendor-visible failure; never fake Connected.
8. AI never controls capital. No Live Trading. No Gate/Risk bypass.
9. No Wave 7 multi-provider claim. No Notification delivery.
10. No redesign of Wave 1 or W2-S01…W2-S04 ownership.
11. No implementation slices opened by this planning package.

---

## Architecture Constraints (binding)

- Preserve Version 2 architecture.
- Preserve Canonical Order Path ownership.
- Preserve Ledger ownership.
- Preserve Workspace Isolation.
- Preserve provider independence and transport independence at product boundaries.
- Preserve Security Platform ownership.
- No new bounded contexts unless already authorized by the Master Plan.
- AI Gateway remains protocol owner; Connection Management remains facade; Vault remains secret owner.

---

## Security Constraints (binding)

Reuse existing:

- Authentication
- Authorization
- Workspace Isolation
- Vault
- Security Platform
- Security Audit

Do not redesign any security products.

---

## Customer Journey (operator language)

```text
Sign in
  ↓
Open Connections
  ↓
OpenRouter (AI) connection + Vault key
  ↓
Test OpenRouter
  ↓
Use AI for this workspace (vaulted key; no .env; no restart)
  ↓
Rotate or Disconnect when needed
  ↓
Honest offline if no usable key
```

---

## Operator-visible functionality

- OpenRouter connection management remains on Connections (consumed).
- Store / replace OpenRouter key (write-only).
- Run OpenRouter Test with success or vendor-visible failure.
- Use AI for the current workspace from vaulted key without customer `.env` and without restart.
- See honest offline when AI is unavailable for the workspace.
- Rotate and disconnect remain available via Connection Management lifecycle.

---

## Customer NEVER receives

- Plaintext OpenRouter key read-back, export, or download
- Live Trading enablement from AI Connectivity
- AI capital control / order placement
- Notification message delivery as a finished Wave 5 product
- Wave 7 multi-provider AI Platform Complete
- Wave 2 COMPLETE claim from this package alone
- Cross-workspace AI keys
- Host `.env` OpenRouter key silently copied into every workspace

---

## Out-of-scope declarations (binding)

- No Wave 7 AI Platform Complete
- No OpenAI / Gemini / Anthropic providers
- No Knowledge durability / export product
- No Notification delivery
- No Telegram production vendor test as Wave 5 replacement
- No Live Trading
- No AI capital control
- No Connection Management redesign
- No Vault redesign
- No Wave 1 changes
- No Master Plan changes
- No Version 2 architecture changes
- No ownership changes
- No implementation slices in this planning open
- No Wave 2 COMPLETE declaration
- No Live Trading declaration

---

## Package Close Checklist (planning — evidence at Close)

| #   | Criterion                               | At planning |
| --- | --------------------------------------- | ----------- |
| 1   | Planning Package complete for PO review | YES         |
| 2   | Architecture constraints recorded       | YES         |
| 3   | Security constraints recorded           | YES         |
| 4   | Validation plan prepared                | YES         |
| 5   | Product walkthrough named               | YES         |
| 6   | No Master Plan revision                 | YES         |
| 7   | No ownership change                     | YES         |
| 8   | No implementation started               | YES         |
| 9   | No Wave 2 COMPLETE / Live Trading claim | YES         |
| 10  | Master Plan ID clarity note recorded    | YES         |

---

## Mandatory Questions

1. **What business problem does W2-S05 solve?**
   Operators can collect an OpenRouter key in Connections, but AI runtime still depends on host `.env` / restart or lacks honest vaulted-key use. Wave 2 exit requires OpenRouter use without customer `.env` or restart.

2. **Why is W2-S05 required after W2-S04?**
   W2-S04 closed Paper Trading Foundation (paper-first simulated execution). It did not deliver OpenRouter vaulted-key runtime use. Remaining Wave 2 Connection Management exit outcomes for OpenRouter use / no customer `.env` remain after Paper Trading Close and are sequenced here by Product Owner.

3. **Which existing products does W2-S05 consume?**
   Connection Management (W2-S01), Vault, Authentication, Authorization, Workspace Isolation, Security Platform, Security Audit, existing AI Gateway / OpenRouterProvider; prior closed Wave 2 packages (W2-S02…S04) as non-redesigned context.

4. **What does W2-S05 own?**
   Product outcomes for workspace vaulted OpenRouter runtime preference, OpenRouter connection test honesty, no-restart vaulted-key use, production customer story without OpenRouter `.env`, and honest offline for AI connectivity — without owning Vault, Connections facade, or AI Gateway as domains.

5. **What is explicitly out of scope?**
   Wave 7 AI Platform / multi-provider AI, Knowledge products, Notification delivery, Live Trading, AI capital control, Connection Management redesign, Vault redesign, Wave 1 changes, Master Plan changes, ownership changes, Wave 2 COMPLETE declaration, and implementation slices in this planning open.

6. **Does W2-S05 modify Wave 1?**
   No.

7. **Does W2-S05 modify Version 2 architecture?**
   No.

8. **Does W2-S05 introduce any ownership changes?**
   No.

---

## STOP

Wait for Product Owner Planning Review before implementation approval.

Do **not** implement production code.
Do **not** open implementation slices.
Do **not** declare W2-S05 approved.
Do **not** declare Wave 2 COMPLETE.
Do **not** declare Live Trading.
Do **not** declare Wave 7 AI Platform Complete.
