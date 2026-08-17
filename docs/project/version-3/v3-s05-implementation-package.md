# V3-S05 Audit Trail Foundation — Implementation Package

```text
Package:            V3-S05
Name:               Audit Trail Foundation
Also known as:      Security Audit Product
Wave:               1 — Security Foundation
Capabilities:       SEC-09, SEC-14
Date:               2026-08-17
Status:             Approved
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision.
Canon:              version-3-master-plan.md
```

**Process:** [`version-3-implementation-policy.md`](./version-3-implementation-policy.md)
**Template:** [`version-3-package-template.md`](./version-3-package-template.md)
**Governance:** [`version-3-governance-freeze.md`](./version-3-governance-freeze.md)
**Annexes used (read-only):** Execution Roadmap, Security Vision, Capability Inventory, Product Roadmap, Wave 1 Progress Report.
**Mandatory:** [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md)

**Product Owner decision:** V3-S05 Planning Package **FINAL APPROVED** (2026-08-17), including Security Event Classification, Incident Investigation Walkthrough, and Event Minimalism.
**Product Owner Planning Alignment:** Accepted 2026-08-17. This corrects the order of approved implementation slices to match the accepted Timeline foundation. It is not an architecture, Master Plan, or Version 2 change.

**Companions:**

| Document                                                                           | Role                                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`v3-s05-product-scope.md`](./v3-s05-product-scope.md)                             | IN / OUT, customer meaning, ownership, forensic criticality, acceptance         |
| [`v3-s05-security-review.md`](./v3-s05-security-review.md)                         | Threat model, integrity, immutability, OWASP maps, Verification Standard intent |
| [`v3-s05-validation-plan.md`](./v3-s05-validation-plan.md)                         | How Close is proven                                                             |
| [`security-audit-overview.md`](./security-audit-overview.md)                       | Operator-language product                                                       |
| [`security-event-classification.md`](./security-event-classification.md)           | Product Owner event-class criticality / trust / retention / search              |
| [`incident-investigation-walkthrough.md`](./incident-investigation-walkthrough.md) | Unauthorized-access investigation fitness scenario                              |

**Prerequisites:**

| Prerequisite                     | Status                                                                |
| -------------------------------- | --------------------------------------------------------------------- |
| Version 2                        | **CERTIFIED**                                                         |
| V3-S01 Authentication & Session  | **CLOSED**                                                            |
| V3-S02 RBAC Product              | **CLOSED**                                                            |
| V3-S03 Secret Vault & Encryption | **Platform Complete** (Customer Complete may remain open under Vault) |
| V3-S04 OWASP & API Hardening     | **CLOSED**                                                            |
| Master Plan                      | **FROZEN**                                                            |
| Security Verification Standard   | **Approved** (mandatory)                                              |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES.** Scope, owners, and exit criteria are already in the frozen Master Plan (SEC-09 / SEC-14 / V3-S05). This package only sequences work inside that freeze. Version 2 remains certified. The Master Plan is not modified. No new bounded context is invented.

```text
S05 is the customer-facing Security Audit Product.
It consumes security events already emitted by S01–S04.
It does NOT replace logging.
It does NOT replace monitoring.
It does NOT own Authentication, RBAC, Vault, or Monitoring.
It provides attributable, searchable, trustworthy security history for operators.
Architecture must support forensic audit — not a disposable event journal.
```

**Planning status:** **COMPLETE.** Product Owner **Final Approved**. Implementation may begin at slices **S05-a … S05-e** only, starting with **S05-a**.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package
        ↓
Review
        ↓
Approval                 ← DONE (Product Owner)
        ↓
Implementation           ← YOU ARE HERE (S05-a … S05-e only)
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
Close                    → then V3-S06 Implementation Package
```

Do not skip a stage. Do not start V3-S06 until this package is **Closed**. The next package opens at **Implementation Package**, not at code. Do not start Wave 2 Connection Management from this package. Wave 1 exit still requires S06 after S05 Close.

---

## Overview

V3-S05 is the Wave 1 Security Foundation package that turns structured security events from Authentication, RBAC, Vault, and platform hardening into a **customer-facing Security Audit Product**: durable store, operator timeline, search and filter, attribution, retention stance, and integrity / tamper-evidence **foundation**.

This is forensic-grade security history for operators who must later explain _who did what, when, in which workspace, with what outcome_ — without SSH, without raw log diving, and without trusting that someone silently edited the past.

| Field                                | Value                                       |
| ------------------------------------ | ------------------------------------------- |
| Package ID                           | V3-S05                                      |
| Master Plan / Execution Roadmap name | Audit Trail Foundation                      |
| Product name                         | Security Audit Product                      |
| Wave                                 | 1 — Security Foundation                     |
| Capabilities (inventory IDs)         | SEC-09 Audit Trail; SEC-14 Incident Logging |
| Complexity                           | M                                           |
| Previous package                     | V3-S04 OWASP & API Hardening (**CLOSED**)   |
| Next package                         | V3-S06 Workspace Isolation Hardening        |

---

## Business Goal

- **Goal:** Give operators attributable, searchable, trustworthy security history so the platform can hold customer credentials with non-repudiation and forensic reconstructability — Product Principle **Everything Is Auditable** as a product, not only as structured logs.
- **Master Plan reference:** §1 Security Platform; §4 Wave 1 exit “Security-relevant authz failures and admin actions are in an append-only audit log”; §7 Audit trail (SEC-09 Wave 1; SEC-10 Wave 6); Execution Roadmap V3-S05 / SEC-09 / SEC-14; Security Vision § Audit Trail (V3-S05); Capability Inventory SEC-09, SEC-14.
- **Metric this package must meet or not regress (Master Plan §6):** credential exposure **0** (audit records must never contain secrets); cross-workspace leak **0** (audit views are workspace-scoped); default misconfig **0**. S05 must not regress S01–S04 journeys. Time-to-connect-Binance remains Wave 4.

---

## Customer Problem

- **Problem:** S01–S04 already emit structured security signals (login, session, role change, vault lifecycle, platform abuse). Operators still cannot open a product history, search it, export a trustworthy excerpt, or prove that the record was not silently altered. Investigators must dig application logs or ask engineers.
- **Who feels it:** Workspace Administrators (access decisions, vault changes); the business (cannot claim Wave 1 append-only audit); auditors and future incident responders (no forensic product surface).
- **What they must do today that they should not:** SSH into hosts, scrape application logs, query databases by hand, or accept that security history is ephemeral and unverifiable.

---

## Business Value

- **Value delivered at Close:** Operators can use a Security Audit Product — timeline, search, filter, attribution — backed by an append-only security event store with retention and integrity foundation suitable for forensic use. Wave 1 exit line for append-only audit is met.
- **What remains blocked until later packages:** Isolation suite product (**S06**); Connection Management (Wave 2 — after full Wave 1 exit); security monitoring / health dashboard (**V3-O05**, Wave 3); financial action logging and full live tamper-evidence (**V3-L03** / SEC-10 / SEC-16, Wave 6); compliance retention finalization (Wave 10). Connection connect/disconnect and live enablement events are **consumed later** when those products emit them — S05 must be ready to accept them without redesign.

---

## Forensic posture (binding planning stance)

S05 is **not** “a nicer log viewer.” Planning and later architecture must answer, and Close must evidence, the following forensic questions.

### Event Minimalism (binding)

Security Audit is an investigation product, not a complete trace of every application operation. A high-volume, low-value journal obscures the events an operator needs during an incident.

| Rule                               | Required outcome                                                                                                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Record investigative value         | Persist an event only when it materially helps explain a security decision, security posture change, credential lifecycle, abuse attempt, or later financial-integrity precursor                          |
| One security fact, one audit story | Do not represent the same operator-visible outcome through multiple redundant audit events                                                                                                                |
| No operational noise               | Do not persist routine technical chatter, repeated successful reads, or debug detail that does not help an investigation                                                                                  |
| Preserve meaningful refusal        | Do retain denied, refused, lockout, revoke, privilege, and vault-lifecycle outcomes when they explain whether a control held                                                                              |
| Classify before adding             | A new event class must have a documented classification, retention expectation, search expectation, and investigation purpose in [`security-event-classification.md`](./security-event-classification.md) |
| Review volume at Close             | Close evidence must show that S05-a consumes the meaningful S01–S04 security outcomes without duplicating them into a noisy parallel history                                                              |

Event Minimalism never permits omission of a security-critical, trust-critical, or financial-integrity-precursor event named in the approved classification. It is a quality constraint: **signal over volume**.

### 1. Which events are critical for security?

At minimum (already emitted or named by prior packages / Security Vision):

| Class                                     | Examples                                                                                            | Why critical                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Authentication abuse & identity           | Login success/failure/lockout; session create/refresh/logout/revoke family                          | Account takeover, session theft, insider access |
| Authorization & privilege                 | Role assign / refuse; authz deny on privileged actions                                              | Privilege escalation, insider misuse            |
| Secret lifecycle                          | Vault create / revoke / delete / replace; retrieve denied                                           | Credential exposure window, key misuse          |
| Platform abuse                            | Throttle / shaped deny (S04)                                                                        | Spray, enumeration, DoS precursors              |
| Future emitters (ingest-ready, not owned) | Connection connect/disconnect; live enablement; kill switch; Gate override **attempts** (must fail) | Posture changes before and during capital risk  |

### 2. Which events are critical for financial integrity?

Wave 1 S05 does **not** own live place/cancel/kill attribution (that is **SEC-10 / V3-L03**). It **does** own the security-side precursors that change who _can_ affect money later:

| Class                                | Examples                                                      | Why critical for financial integrity      |
| ------------------------------------ | ------------------------------------------------------------- | ----------------------------------------- |
| Privilege to trade-capable roles     | Role change to/from Trader / Admin                            | Who could later initiate capital actions  |
| Credential availability              | Vault create / revoke / delete / replace for venue/AI secrets | Who could connect venues that move money  |
| Session control near capital         | Session revoke / revoke-all around sensitive periods          | Stolen session used for later live ops    |
| Failed Gate overrides (when emitted) | Gate override attempts that must fail                         | Proof the system refused financial bypass |

S05 must store these with attribution quality that **V3-L03 can correlate later** (actor, workspace, time, outcome, correlation ids where already present). It must not pretend to be the Ledger or the live financial action log.

### 3. Which events are critical for user trust?

| Class                                        | Examples                                           | Why critical for trust                    |
| -------------------------------------------- | -------------------------------------------------- | ----------------------------------------- |
| Honest access decisions                      | Role refused; People unavailable; own-role deny    | Operator can explain “why was I blocked?” |
| Session hygiene                              | Logout, revoke others, revoke all                  | “Was my account used elsewhere?”          |
| Recovery / password change (when structured) | Password change; recovery outcomes without secrets | Account recovery disputes                 |
| Vault refusals                               | Unauthorized vault access denied                   | Proof the product refused secret misuse   |

Trust events must be readable by Administrators without exposing passwords, tokens, ciphertext, or wrapping keys.

### 4. Which events must not be changed or deleted without a trail?

**All persisted security audit records in the durable store** are append-only for ordinary product paths.

| Rule             | Meaning                                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No silent edit   | Product APIs and ordinary Admin UI must not update event payload, actor, time, or outcome                                                                                                      |
| No silent delete | Product APIs and ordinary Admin UI must not remove security audit rows                                                                                                                         |
| Retention expiry | If retention removes or archives records, that action itself must be attributable (system retention job identity) or out of ordinary operator UI — named at implementation, validated at Close |
| Break-glass      | Any host-level exceptional purge (if ever required by law/host) is **outside** the product promise and must not be framed as a customer feature in S05                                         |

### 5. How will the operator find the needed events?

| Capability                     | Operator meaning                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| Security Timeline              | Chronological workspace-scoped history                                              |
| Search                         | Find by actor, subject, event class, free-text safe fields                          |
| Filtering                      | Time range, event class/severity, outcome (success/deny/failure), actor             |
| Attribution display            | Who (actor), on whom/what (subject/resource class), when, where (workspace), result |
| Export (if in approved slices) | Download a filtered excerpt for incident response — still non-secret                |

### 6. How can the future prove the journal was not forged?

S05 must ship an **integrity / tamper-evidence foundation** for the security audit store so Wave 6 (SEC-16) and external review are not forced to invent integrity from scratch.

| Layer                                                                                                                                                               | S05 owns (foundation)         | Later owner                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| Append-only product semantics                                                                                                                                       | Yes                           | —                                                                 |
| Durable store not rewritten by product paths                                                                                                                        | Yes                           | —                                                                 |
| Integrity protection suitable for detection of silent mutation (e.g. hash chain, signed sequence, or equivalent — exact mechanism at implementation after Approval) | **Yes — foundation required** | Full live financial tamper-evidence completes **SEC-16 / V3-L03** |
| External auditor tooling / third-party attestation product                                                                                                          | No                            | Wave 10 / compliance as named later                               |
| Monitoring alerts on integrity failure                                                                                                                              | No                            | **V3-O05** (consumes signals; does not own the store)             |

Planning rule: choose a mechanism that makes **undetected silent rewrite of historical security events impractical** for ordinary compromise of application write paths. Do not claim cryptographic perfection against a fully compromised host database administrator — claim product-path non-repudiation and detectable tampering relative to the integrity foundation.

---

## Current State

Honest S01–S04 facts. Do not redesign Version 2.

| Capability or surface                           | Status                                  | Evidence                                                                                                      |
| ----------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Structured `auth.login` events                  | Already exists (CLOSED)                 | V3-S01                                                                                                        |
| Structured `auth.session` events                | Already exists (CLOSED)                 | V3-S01                                                                                                        |
| Structured role-change / authz-deny events      | Already exists (CLOSED)                 | V3-S02                                                                                                        |
| Structured vault lifecycle events               | Already exists (Platform Complete path) | V3-S03                                                                                                        |
| Platform abuse / shaped-deny events             | Already exists (CLOSED)                 | V3-S04 `emitPlatformSecurityEvent`                                                                            |
| Append-only durable security event **store**    | Missing as product                      | Logs only                                                                                                     |
| Operator Security Timeline / search / filter    | Missing                                 | Authorization Events overview: “cannot search yet”                                                            |
| Security export                                 | Missing                                 | Deferred to S05 planning                                                                                      |
| Retention policy as product stance              | Missing                                 | Security Vision: Wave 10 compliance defines final retention; S05 must still ship a **defined** interim policy |
| Audit integrity / tamper evidence               | Missing                                 | SEC-16 Wave 6 for live financial; S05 needs security-audit foundation                                         |
| Security monitoring / Grafana / metrics product | Out of this package                     | V3-O05 / Wave 3                                                                                               |
| Financial action log (live place/cancel)        | Out of this package                     | V3-L03 / SEC-10                                                                                               |
| Connection / exchange / billing / live UI       | Out of this package                     | Later waves                                                                                                   |

Facts implementers must not forget:

- S05 **consumes** events; it does not re-implement Auth, RBAC, Vault, or platform hardening.
- Prefer reuse of existing outbox / durable messaging patterns where the Master Plan / inventory already named them — do **not** invent a second Ledger.
- Do not store secrets, passwords, tokens, hashes of credentials, wrapping keys, or plaintext vault material in audit records.
- Do not claim Wave 1 exit at S05 Close (S06 remains).
- Do not claim financial-complete security (Wave 6) or operable monitoring (Wave 3).

---

## Reuse from Version 2 / prior V3

| Stance          | This package                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reuse unchanged | Prisma parameterized access; Spec v2.0 / Authority Matrix / Alias Dictionary; Ledger as money SoT; existing structured event emitters in S01–S04                                                                                                       |
| Minor extension | Logger-shaped events become persisted audit records via a consume/persist path                                                                                                                                                                         |
| Major extension | Durable append-only Security Event Store; operator Security Timeline; search/filter; attribution model; retention stance; integrity foundation; security-class incident durability (SEC-14) aligned with existing Incident idea where inventory allows |
| New justified   | **Nothing as a new bounded context** — Audit product is Master Plan–owned under Security Platform / Identity/Auth (+ Vault module ownership line)                                                                                                      |
| Replace         | **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, Library, Auth, RBAC, Vault domain                                                                                                                                                      |

Owner from Master Plan §11:

| Area                                        | Owner                                                  | This package must not own                                             |
| ------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| Security Audit Product (SEC-09 / SEC-14)    | **V3-S05** (Identity/Auth security platform extension) | Authentication SoT, RBAC SoT, Vault ciphertext, Monitoring dashboards |
| Authentication / sessions                   | V3-S01                                                 | Re-own login                                                          |
| Roles / People                              | V3-S02                                                 | Re-own permission matrix                                              |
| Vault                                       | V3-S03                                                 | Re-own encryption                                                     |
| OWASP platform edge                         | V3-S04                                                 | Re-own headers / rate limits                                          |
| Isolation suite                             | V3-S06                                                 | Claiming S06 PASS by audit UI                                         |
| Monitoring / health dashboard               | V3-O05                                                 | Metrics, Grafana, alert product                                       |
| Financial action log / live tamper-evidence | V3-L03 (SEC-10 / SEC-16)                               | Live place/cancel SoT                                                 |

---

## Dependencies

| Dependency                                   | Kind                       | Status required before this package                                                                                           |
| -------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| V3-S01 structured auth/session events        | Earlier V3 package         | Closed                                                                                                                        |
| V3-S02 structured authorization events       | Earlier V3 package         | Closed                                                                                                                        |
| V3-S03 structured vault events               | Earlier V3 package         | Platform Complete                                                                                                             |
| V3-S04 platform security events              | Earlier V3 package         | Closed                                                                                                                        |
| Identity / Workspace scoping                 | Version 2 + S01/S02        | Exists                                                                                                                        |
| Existing Incident durability idea (recovery) | Version 2 partial / SEC-14 | Exists partially — unify security-class durability without a second unrelated incident SoT if one store can distinguish class |

This package does **not** depend on:

- Connection Management (`V3-C01`…`C04`) — but must remain **ingest-ready** for connection events later
- Exchange I/O, Telegram, SMTP send, OpenRouter consumers
- V3-S06 Isolation suite
- Wave 3 monitoring dashboards / Grafana
- Wave 6 live / V3-L03 financial action log completion
- Billing, Vault Customer Complete UI (may remain open under Vault)

---

## Implementation Scope

### IN Scope

| Item                                | Customer meaning                                                         | Notes                                                            |
| ----------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Security Event Store                | Durable append-only history of security-relevant events                  | Consumes S01–S04 emitters; no secret payloads                    |
| Security Timeline                   | Operator sees chronological security history                             | Workspace-scoped                                                 |
| Operator Security History           | Administrators can review attributable actions                           | RBAC-gated (Admin); others denied honestly                       |
| Search                              | Find events without SSH                                                  | Safe fields only                                                 |
| Filtering                           | Narrow by time, class, actor, outcome                                    | Product UX                                                       |
| Event Attribution                   | Who / whom / what class / when / workspace / outcome                     | Non-repudiation                                                  |
| Security Export (planned)           | Filtered download for incident response                                  | Optional slice if PO keeps it IN; never secrets                  |
| Retention Policy                    | Defined product stance for how long security history is kept             | Interim Wave 1 policy; Wave 10 may refine compliance             |
| Audit Integrity foundation          | Detectable tampering / append-only trust                                 | Foundation for later SEC-16; not a monitoring product            |
| Tamper Evidence foundation          | Integrity material for future proof                                      | Mechanism chosen at implementation; requirements fixed here      |
| SEC-14 security incident durability | Security-class incidents reconstructable                                 | Align with existing Incident idea; do not invent a competing SoT |
| Ingest readiness                    | Later connection / live / kill-switch events can append without redesign | Schemas/extension points only — do not build those products      |

### OUT OF Scope

| Item                                         | Why out                   | Owner later                  |
| -------------------------------------------- | ------------------------- | ---------------------------- |
| Monitoring                                   | Different product         | V3-O05                       |
| Metrics / Grafana                            | Not audit history         | Wave 3                       |
| Vault domain / encryption                    | Already owned             | V3-S03                       |
| Connection Management                        | Wave 2                    | `V3-C01`…`C04`               |
| Exchange integrations                        | Waves 2/4                 | Exchange packages            |
| Billing                                      | Wave 9                    | Billing                      |
| Live Trading / live UI                       | Wave 6 + ADR              | Live packages                |
| Financial action logging (place/cancel/kill) | SEC-10                    | V3-L03                       |
| Full live tamper-evident financial ops       | SEC-16                    | V3-L03                       |
| Isolation suite product                      | Later Wave 1              | V3-S06                       |
| MFA / extra factors                          | Later                     | Pre-live                     |
| Editing or deleting audit rows from Admin UI | Violates forensic posture | Forbidden as product feature |

Nothing in IN Scope may be invented beyond Master Plan / Security Vision / SEC-09 / SEC-14. If a desired item is not named, **stop**.

---

## Product Acceptance Criteria

| #   | Outcome                                                                                                                           | Fail if                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | An Administrator opens Security Audit / Security History and sees a chronological timeline of security events for their workspace | No product surface; or only engineers can see logs                        |
| 2   | The Administrator can filter and/or search to find a known role change, login failure class, or vault lifecycle event             | Finding requires SSH, SQL, or raw log files                               |
| 3   | Each shown event attributes actor (when known), subject/resource class, time, workspace scope, and outcome without secrets        | Passwords, tokens, vault plaintext, or wrapping keys appear               |
| 4   | Ordinary product paths cannot edit or delete historical security events                                                           | Admin UI or API mutates or erases audit rows silently                     |
| 5   | Integrity foundation makes silent mutation of stored history detectable (or prevented) per Security Review                        | History can be rewritten with no integrity signal                         |
| 6   | Non-Administrators cannot use the audit product as a cross-user spy tool; cross-workspace audit reads fail closed                 | Reader sees another workspace’s security history                          |
| 7   | S01–S04 customer journeys still work                                                                                              | Audit persistence breaks login, People, Vault platform path, or hardening |

The customer never uses SSH, customer `.env`, or manual database edits for these journeys.

Copy and complete [`version-3-product-checklist.md`](./version-3-product-checklist.md) at Close.

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.**

```text
Security Audit Walkthrough

□ Sign in as Administrator
□ Open Security Audit / Security History
□ See timeline of recent security events (at least auth, role, vault, and/or platform classes present from prior packages)
□ Filter or search to a known event (e.g. a role change or failed login class)
□ Confirm attribution fields are present and understandable
□ Confirm no secrets appear in any event detail
□ Attempt to edit or delete an event (if any control exists) → refused / not offered
□ Sign in as non-Administrator → Security Audit unavailable or denied honestly
□ Confirm paper remains default; no live / connections / monitoring claims

PASS / REQUIRES ACTION
```

Overall verdict for this package (fill at Close):

| Field                   | Value                          |
| ----------------------- | ------------------------------ |
| Walkthrough name        | Security Audit Walkthrough     |
| Executed in the product | Yes / pending Approval         |
| Overall                 | PENDING PRODUCT OWNER APPROVAL |

---

## Architecture Review

**Fill at package time (intent) and again at Close (evidence).**

Copy and complete [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md) at Close.

Summary (planning intent):

| Rule                                                           | Decision                                                                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| No new bounded context unless the Master Plan already named it | **PASS (intent)** — Audit is Master Plan Security Platform under Identity/Auth (+ Vault ownership line); not a new domain like Orders/Ledger |
| No ownership drift                                             | **PASS (intent)** — does not own Auth, RBAC, Vault, Monitoring, Connections, Orders, Ledger                                                  |
| No duplicate Source of Truth                                   | **PASS (intent)** — audit store is history of security decisions; not money SoT; not session SoT; not permission SoT                         |
| HTTP remains transport; UI remains not Source of Truth         | **PASS (intent)**                                                                                                                            |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | Unchanged                                                                                                                                    |
| Justified persistence/ports inside an existing owner           | Durable audit persistence + integrity foundation inside Security Platform / Identity/Auth                                                    |

Forbidden: duplicate auth, vault, ledger, or order path; hidden redesign; Version 2-style RC track; “Audit” as a second financial ledger.

---

## Security Review

**Fill at package time (intent) and again at Close (evidence).**

Companions: [`v3-s05-security-review.md`](./v3-s05-security-review.md), [`version-3-security-checklist.md`](./version-3-security-checklist.md), [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md).

Threat Review (STRIDE) — planning intent:

| Category               | Verdict                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Spoofing               | **PASS (intent)** — actor attribution from authenticated session; no forged actor from client body              |
| Tampering              | **PASS (intent)** — append-only + integrity foundation                                                          |
| Repudiation            | **PASS (intent)** — this package’s primary job                                                                  |
| Information Disclosure | **PASS (intent)** — no secrets in store/UI/export; RBAC + workspace scope                                       |
| Denial of Service      | **PASS (intent)** — inherit S04 limits; audit write path must not become an unbounded flood sink without policy |
| Elevation of Privilege | **PASS (intent)** — reading audit does not grant roles; Admin-only product surface                              |

### Security Verification Standard

**Mandatory for this package.** Every category and every row must be completed at Close. Planning intent rows live in [`v3-s05-security-review.md`](./v3-s05-security-review.md). Security Regression Suite is mandatory for every found-and-fixed defect owned by S05.

---

## Implementation Slices

Independently reviewable. Do not implement in this planning task.

### S05-a — Security Event Store & append-only persistence

**Goal:** Durable Security Event Store that consumes existing structured emitters (auth, session, role, vault, platform) into append-only records with workspace scope and non-secret payloads.

**Event Minimalism:** Consume only classified, investigation-valuable outcomes. One operator-visible security fact must produce one audit story, not redundant rows copied from logs. Do not turn routine technical activity into Security Audit noise.

**Touch (expected):** Persist path / repository inside Security Platform / Identity/Auth; adapters from existing log-shaped emitters without rewriting Auth/RBAC/Vault domains.

**Done when:** Events from closed packages survive restart; ordinary APIs cannot update/delete rows; secrets absent by tests; consumed event classes meet the Event Minimalism rules and the Product Owner classification.

**Must not:** Build monitoring; redesign Vault encryption; invent Connection Management events as fake history.

### S05-b — Investigation Timeline foundation

**Goal:** Provide the read-model foundation for investigation-first chronology: workspace-scoped chronological navigation, stable event grouping foundation, and Timeline API foundation.

**Touch (expected):** Audit read model, chronological cursor/navigation contract, deterministic investigation grouping projection, and Timeline API foundation.

**Done when:** Recorded security events can be read in chronological investigation order, navigation does not cross workspace scope, and grouping does not create a second event history.

**Must not:** Build search, filtering, export, retention, integrity chain, monitoring, dashboard, or UI.

### S05-c — Integrity / tamper-evidence foundation

**Goal:** Integrity foundation so silent mutation of historical security events is prevented or detectable.

**Touch (expected):** Append integrity mechanism (hash chain, signed sequence, or equivalent chosen at implementation).

**Done when:** Tamper/mutation tests fail closed or detect integrity break; Security Review evidence recorded.

**Must not:** Claim full SEC-16 live financial tamper product; build Grafana alerts (O05).

### S05-d — Incident attribution, criticality, and investigation enrichment (SEC-14)

**Goal:** Normalize required attribution; classify event criticality for security, trust, and financial precursors; introduce durable security incidents for richer investigations without a competing incident Source of Truth.

**Touch (expected):** Audit attribution model, criticality map, incident linkage and reconstruction rules, and enrichment of the Timeline foundation.

**Done when:** Every persisted event has required attribution; criticality is documented and tested; security incidents are durable and reconstructable without a second conflicting SoT.

**Must not:** Re-own Auth/RBAC/Vault outcomes, own the live financial action log (L03), invent ABAC, or expose secrets.

**Incident-first future model (binding design constraint):** The Timeline foundation must remain compatible with `Incident → contains → Events`. S05-d must make Incident the investigation aggregate and associate existing immutable audit events with it. It must not redesign the Timeline as `Events → grouped later` in a way that prevents a durable Incident model.

### S05-e — Retention, export (if approved), ingest readiness, Verification Standard Close pack

**Goal:** Defined retention policy stance; filtered export if Product Owner keeps export IN; extension points for later connection/live/kill-switch events; complete Security Verification Standard + Regression Suite for Close.

**Touch (expected):** Retention job/policy documentation + behavior; export path if IN; Close evidence packs.

**Done when:** Retention is defined and safe; export (if IN) is non-secret and RBAC-gated; ingest readiness documented; Verification Standard has zero REQUIRES ACTION for S05-owned rows.

**Must not:** Start S06 implementation; open Wave 2; finalize Wave 10 compliance law as if S05 owned it.

---

## Validation Plan

Companion: [`v3-s05-validation-plan.md`](./v3-s05-validation-plan.md).

| Gate                                              | Required                                  | Evidence                                                              |
| ------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Unit tests                                        | Yes                                       | Store append-only, attribution, integrity, classification, no-secrets |
| Integration tests                                 | Yes                                       | Persist from emitters; RBAC; workspace isolation; search/filter       |
| UI tests                                          | Yes where timeline UX is customer-visible | Admin timeline / deny for non-Admin                                   |
| Manual product walkthrough                        | Yes                                       | Security Audit Walkthrough                                            |
| Security verification (checklist)                 | Yes                                       | Close Security Review                                                 |
| Security Verification Standard + Regression Suite | **Yes**                                   | Mandatory                                                             |
| Architecture verification                         | Yes                                       | Checklist                                                             |
| Product verification                              | Yes                                       | Checklist                                                             |
| Customer acceptance of Master Plan outcomes       | Yes                                       | Wave 1 append-only audit line                                         |

---

## Required Reports

| Report                 | When                        | Path convention                                                          |
| ---------------------- | --------------------------- | ------------------------------------------------------------------------ |
| Implementation Package | Before Approval             | `v3-s05-implementation-package.md` (this file)                           |
| Implementation Report  | After Implementation        | `v3-s05-implementation-report.md`                                        |
| Architecture Review    | After Implementation Report | `v3-s05-architecture-review.md`                                          |
| Security Review        | After Architecture Review   | Update `v3-s05-security-review.md` with evidence + Verification Standard |
| Product Review         | After Security Review       | `v3-s05-product-review.md` with walkthrough                              |
| Validation evidence    | After Product Review        | `v3-s05-validation-plan.md` results                                      |
| Package Close record   | At Close                    | Close Checklist + Package Summary                                        |

**Forbidden:** Version 2-style RC documents; ADRs; Master Plan edits; Version 2 certification edits.

---

## Package Close Checklist

| #   | Gate                                                                                             | Verdict                         |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------- |
| 1   | Implementation Review                                                                            | NOT DONE                        |
| 2   | Architecture Review                                                                              | NOT DONE                        |
| 3   | Security Review (checklist + STRIDE + Timing + Abuse + Verification Standard + Regression Suite) | NOT DONE                        |
| 4   | Product Review (walkthrough PASS)                                                                | NOT DONE                        |
| 5   | Validation                                                                                       | NOT DONE                        |
| 6   | All mandatory reports                                                                            | NOT DONE                        |
| 7   | Master Plan compliance                                                                           | PENDING (planning: PASS intent) |
| 8   | Product Principles compliance                                                                    | PENDING (planning: PASS intent) |
| 9   | Customer walkthrough                                                                             | NOT DONE                        |

---

## Customer-visible Changes

**Fill at Close.**

Planning expectation:

- New Administration surface: Security Audit / Security History (timeline, search, filter; export if approved).
- Honest unavailable/deny for non-Administrators.

What the UI / copy must **not** claim:

- Wave 1 complete; Connections available; live trading; monitoring/Grafana; “unforgeable against compromised DBAs”; financial action log complete.

---

## Next Package Dependencies

| Field                             | Value                                                                                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| This package unblocks             | **V3-S06** Workspace Isolation Hardening (after Close). Also contributes to Wave 1 exit with S06. Later: V3-O05 monitoring can consume audit signals; V3-L03 can correlate financial actions to security precursors; Wave 2 connection events can append into the same product. |
| This package does **not** unblock | Connection Management (needs full Wave 1 exit including S06); live trading; billing                                                                                                                                                                                             |
| Remaining wave work               | S06                                                                                                                                                                                                                                                                             |

---

## Lessons Learned

**Fill at Close.**

---

## Package Summary Standard (planning answers — mandatory questions)

1. **What does the customer receive?**
   A Security Audit Product: attributable, searchable, workspace-scoped security history (timeline, filter/search, retention stance, integrity foundation, optional export) consuming events already emitted by Authentication, RBAC, Vault, and platform hardening.

2. **What does the customer NOT receive?**
   Monitoring, metrics, Grafana, Vault product ownership, Connection Management, exchange integrations, billing, live trading, financial action log (L03), isolation suite (S06), or the right to edit/delete audit history from the product.

3. **What business problem does S05 solve?**
   Security-relevant actions already happen and are logged structurally, but operators cannot forensically review, find, or trust that history as a product — blocking Wave 1’s append-only audit exit and weakening readiness for real financial assets.

4. **Which future packages depend on S05 / what products consume S05 later?**
   **V3-S06** (Wave 1 completion sequencing); Wave 1 exit → Wave 2 Connections (connection events append into audit); **V3-O05** monitoring (thresholds over audit/incident signals); **V3-L03** financial action logging (correlates to security precursors; SEC-16 builds on integrity ideas); Wave 10 compliance retention refinement; any later admin action that must remain attributable.

5. **Does S05 introduce a new bounded context?**
   **No.** Master Plan §11 already places Security Platform / Vault / Audit under Identity/Auth + Vault module. S05 extends that ownership line with the audit **product**. It does not create Orders-, Ledger-, or Monitoring-shaped contexts.

6. **Was the Master Plan respected?**
   **Yes (planning).** Package ID, wave, SEC-09 / SEC-14, and Wave 1 append-only audit exit line match. No Master Plan edits. No Version 2 edits. OUT OF Scope matches deferred owners. Forensic requirements are architecture constraints inside the freeze — not new waves.

7. **Were Product Principles respected?**
   **Yes (planning).** **Everything Is Auditable** (primary); **Security Before Convenience** (append-only, no silent delete); **Honest Product** (does not claim monitoring or live financial log); **Customer First** (operators use product UI, not SSH); **Architecture Is a Constraint** (no new context; no second ledger); **Paper First / Live Must Be Earned** (unchanged).

---

## Future guidance (binding)

1. No production code before Approval.
2. Do not modify Version 2 certification, Spec v2.0, Authority Matrix, or Alias Dictionary.
3. Do not create RC/ADR documents from this package.
4. Do not start Connection Management until Wave 1 exits (S05–S06 Closed as required).
5. Treat forensic criticality, immutability, findability, integrity foundation, and **Event Minimalism** as **Close requirements**, not backlog ideas.
6. Conflicts: **Master Plan wins.**

---

**Approved.** Implement slices **S05-a … S05-e** only, preserving Version 3 discipline. After Close, open V3-S06 at Implementation Package — not at code.
