# V3-S05 Product Scope

**Package:** V3-S05 Audit Trail Foundation (Security Audit Product)
**Wave:** 1 — Security Foundation
**Status:** Planning Package **Approved**. Not implementation code.
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Umbrella:** [`v3-s05-implementation-package.md`](./v3-s05-implementation-package.md)
**Capabilities:** SEC-09 Audit Trail; SEC-14 Incident Logging

This document freezes **IN / OUT**, **ownership**, **customer outcomes**, and **forensic product language** for V3-S05. It does not add journeys the Master Plan did not already name. It does not redesign Version 2. It does not invent a new bounded context.

---

## Product Owner Planning Alignment

**Accepted:** 2026-08-17. This planning-only alignment accepts the implemented
Timeline foundation and changes no Master Plan, Version 2 artifact, ownership
boundary, or architecture.

| Slice | Product sequence                                                |
| ----- | --------------------------------------------------------------- |
| S05-a | Security Event Store foundation                                 |
| S05-b | Investigation Timeline foundation                               |
| S05-c | Integrity / tamper-evidence foundation                          |
| S05-d | Incident attribution, criticality, and investigation enrichment |
| S05-e | Retention, export, and Close                                    |

The Timeline foundation is a read model and may precede full investigation
semantics. S05-d must retain an **Incident → contains → Events** model so the
product grows around an investigation, rather than permanently treating an
incident as events grouped only after the fact.

---

## Product purpose

The Security Audit Product is the customer-facing security history for operators.

It **consumes** security events already emitted by Authentication (S01), RBAC (S02), Vault (S03), and platform hardening (S04).

It does **not** replace application logging.

It does **not** replace monitoring, metrics, or Grafana.

It does **not** own Authentication, RBAC, Vault, Connection Management, or Live Trading.

It provides attributable, searchable, trustworthy security history — designed as **forensic audit**, not a disposable event journal.

```text
S05 owns the Security Audit Product.
Emitters stay with their owners.
History is append-only and integrity-aware.
Operators find answers in the product — not in SSH.
```

---

## Why S05 exists (business language)

A professional will not trust a research operating system that can store venue secrets and assign trading-capable roles — but cannot later show _who changed access, who touched credentials, which sessions existed, and whether that record was altered_.

S01–S04 made security actions attributable in structured logs. Wave 1 still requires those actions to be **in an append-only audit log** as a product operators can use.

Without S05, Connection Management and later capital-adjacent work would invent “audit” under deadline pressure — usually as screenshots of logs. That fails forensic use and fails Product Principle **Everything Is Auditable**.

---

## Customer value

After this package Closes, an Administrator can:

- Open a Security Audit / Security History surface
- See a chronological timeline of security-relevant events for their workspace
- Search and filter to reconstruct an incident or access change
- Trust that ordinary product paths cannot silently rewrite that history
- Export a filtered non-secret excerpt if export remains Approved IN Scope

Wave 1 exit line this package owns (Master Plan / Execution Roadmap):

> Security-relevant authz failures and admin actions are in an append-only audit log.

This package does **not** own:

> Cross-workspace credential or data reads fail closed in tests as a product suite (S06)
> I save Binance credentials… (Wave 2)
> Monitoring thresholds / health dashboard (Wave 3)
> Live place/cancel attribution (Wave 6 / V3-L03)

---

## Customer outcomes (this package only)

### The customer receives

1. **What does the customer receive?**
   A Security Audit Product: durable security event store, operator timeline, search, filtering, attribution, retention stance, integrity / tamper-evidence foundation, and (if Approved) filtered export — consuming events from prior Wave 1 packages.

2. **What does the customer NOT receive?**
   See OUT OF Scope — especially monitoring/Grafana, Vault ownership, Connections, exchanges, billing, live trading, financial action log, isolation suite, or editable audit history.

3. **What business problem does S05 solve?**
   Security history exists only as engineering logs; operators cannot forensically review, find, or trust it as a product before the platform holds more customer credentials and capital-adjacent power.

4. **Which future packages depend on S05?**
   V3-S06 and Wave 1 exit → Wave 2 Connections; V3-O05 monitoring; V3-L03 financial action logging / SEC-16; Wave 10 compliance retention refinement; any later security-relevant admin action that must remain attributable in the same product.

### Explicit receive / not-receive table

| Customer receives                        | Customer does NOT receive                    |
| ---------------------------------------- | -------------------------------------------- |
| Security Timeline for their workspace    | Raw host logs as the product                 |
| Search and filtering                     | Monitoring alerts / Grafana                  |
| Attributable event detail (non-secret)   | Passwords, tokens, vault plaintext           |
| Append-only history                      | Edit / delete audit rows in Admin UI         |
| Integrity / tamper-evidence foundation   | Claim of SEC-16 live financial complete      |
| Defined retention stance                 | Final Wave 10 legal retention as if finished |
| Filtered export (if Approved IN)         | Unscoped dump of all tenants                 |
| Honest deny for non-Admin                | Spy tool for Readers                         |
| Ingest readiness for later event classes | Connection Management or live UI themselves  |

---

## Ownership (binding)

| Concern                                      | Owner                                       | Must not own                            |
| -------------------------------------------- | ------------------------------------------- | --------------------------------------- |
| Security Event Store (durable, append-only)  | **S05**                                     | Session SoT, role SoT, vault ciphertext |
| Security Timeline / search / filter / export | **S05**                                     | Monitoring dashboards                   |
| Event Attribution model                      | **S05** (normalize)                         | Re-deciding Auth/RBAC/Vault outcomes    |
| Retention policy (Wave 1 interim)            | **S05**                                     | Wave 10 compliance law rewrite          |
| Audit integrity / tamper-evidence foundation | **S05**                                     | Full SEC-16 live financial product      |
| SEC-14 security incident durability          | **S05** (align with existing Incident idea) | Second unrelated incident empire        |
| Login / lockout / sessions                   | Authentication (S01)                        | Audit as a second login                 |
| Roles / People / permission decisions        | Authorization (S02)                         | Audit as a second RBAC                  |
| Secret encryption / retrieve                 | Vault (S03)                                 | Audit storing secrets                   |
| Platform headers / rate limits               | S04                                         | Audit as hardening                      |
| Isolation suite                              | V3-S06                                      | Claiming S06 by timeline UI             |
| Monitoring / metrics / Grafana               | V3-O05                                      | —                                       |
| Financial action log / live tamper-evidence  | V3-L03                                      | —                                       |
| Connections / venues / channels / AI use     | Wave 2+                                     | Fake connection history                 |

**Bounded context:** S05 does **not** introduce a new bounded context. Master Plan already places Security Platform / Vault / Audit under Identity/Auth + Vault module.

---

## Forensic criticality (product language)

Operators and auditors care about different questions. S05 must treat event classes accordingly. Implementation may use severity/criticality labels; Product Review must keep the language understandable.

### Critical for security posture

| Operator question                   | Event classes (examples)                         |
| ----------------------------------- | ------------------------------------------------ |
| Was this account attacked?          | Login failures, lockouts, platform throttle/deny |
| Was a session stolen or cleaned up? | Session create, logout, revoke, revoke-all       |
| Did privileges change?              | Role assign / refuse                             |
| Were secrets created or destroyed?  | Vault create / revoke / delete / replace         |
| Was secret access refused?          | Vault retrieve/authorization denied              |

### Critical for financial integrity (precursors — not the money SoT)

| Operator question                             | Event classes (examples)                             |
| --------------------------------------------- | ---------------------------------------------------- |
| Who gained power that can later move capital? | Role change involving Trader / Admin                 |
| Which credentials became usable or unusable?  | Vault lifecycle for venue/AI secrets                 |
| Were Gate/Risk bypasses attempted?            | Gate override attempts that must fail (when emitted) |
| What sessions existed near a later dispute?   | Session revoke family around the period              |

**Honest boundary:** Ledger remains money Source of Truth. Live place/cancel/kill attribution is **V3-L03**. S05 stores the security precursors those disputes will need.

### Critical for user trust

| Operator question                       | Event classes (examples)                                             |
| --------------------------------------- | -------------------------------------------------------------------- |
| Why was I refused?                      | Authz deny, own-role deny, People unavailable outcomes when recorded |
| Did someone else use my sign-in?        | Session list-relevant session events                                 |
| Did password recovery or change happen? | Recovery / password-change outcomes without secrets                  |

### Must not change or disappear without a trail

| Record kind                       | Product rule                                                    |
| --------------------------------- | --------------------------------------------------------------- |
| Persisted security audit events   | Append-only; no Admin edit/delete                               |
| Integrity / sequence material     | Protected with the event store foundation                       |
| Retention removals / archives     | Attributable system action or out of ordinary UI — never silent |
| Security-class incidents (SEC-14) | Durable reconstruction; not ephemeral toast logs                |

---

## How the operator finds events

| Capability          | Meaning                                                 |
| ------------------- | ------------------------------------------------------- |
| Timeline            | Default chronological Security History                  |
| Filter              | Time range, event class, outcome, actor                 |
| Search              | Safe free-text over non-secret fields                   |
| Attribution columns | Actor, subject/resource class, time, workspace, outcome |
| Export (if IN)      | Filtered excerpt for tickets / counsel / incident notes |

Finding must not require knowing internal type strings from engineers — but may show clear event names (e.g. “Role changed”, “Sign-in failed”, “Vault secret revoked”).

---

## How the future proves the journal was not forged

Product promise at S05 Close:

- Ordinary product and Admin paths cannot rewrite history.
- Integrity foundation makes silent mutation **prevented or detectable**.
- Export (if present) can include integrity metadata sufficient for later verification workflows.

Product promise **not** made at S05 Close:

- Cryptographic proof against a fully compromised database host administrator (honest limit).
- Live financial tamper-evident operations product (**SEC-16 / V3-L03**).
- Continuous monitoring of integrity failures (**V3-O05**).

---

## IN Scope (exact)

| Capability                 | Meaning for the operator / platform                     |
| -------------------------- | ------------------------------------------------------- |
| Security Event Store       | Durable append-only security history                    |
| Security Timeline          | Chronological operator view                             |
| Operator Security History  | Admin-accessible review surface                         |
| Search                     | Find without SSH                                        |
| Filtering                  | Narrow the timeline                                     |
| Event Attribution          | Who / what / when / workspace / outcome                 |
| Security Export            | Filtered non-secret download **if Approved**            |
| Retention Policy           | Defined Wave 1 interim retention stance                 |
| Audit Integrity            | Foundation against silent rewrite                       |
| Tamper Evidence            | Integrity material for future proof                     |
| SEC-14 incident durability | Security-class incidents reconstructable                |
| Consume existing emitters  | Auth, session, role, vault, platform abuse              |
| Ingest readiness           | Later connection / live / kill-switch events can append |

---

## OUT OF Scope (explicit)

| Item                                    | Owner later                                           |
| --------------------------------------- | ----------------------------------------------------- |
| Monitoring                              | Wave 3 `V3-O05`                                       |
| Metrics                                 | Wave 3                                                |
| Grafana                                 | Wave 3 / host ops                                     |
| Vault domain / Customer Complete UI     | V3-S03 (Vault-owned)                                  |
| Connection Management                   | Wave 2 `V3-C01`…`C04`                                 |
| Exchange integrations                   | Waves 2/4                                             |
| Billing                                 | Wave 9                                                |
| Live Trading                            | Wave 6 + ADR                                          |
| Financial action logging                | V3-L03 / SEC-10                                       |
| Full live tamper-evident financial ops  | V3-L03 / SEC-16                                       |
| Workspace Isolation suite product       | V3-S06                                                |
| MFA / extra factors                     | Later pre-live                                        |
| Admin UI to edit or delete audit events | **Forbidden** (not deferred — out as product feature) |

---

## Product Walkthrough (operator experience)

### Happy path — reconstruct a role change

```text
Sign in as Administrator
        ↓
Open Security Audit / Security History
        ↓
Filter or search for role changes
        ↓
See who changed whose role, when, and the outcome
        ↓
No passwords or secrets shown
```

### Honest deny — non-Administrator

```text
Sign in as Reader / Researcher / Trader
        ↓
Open Security Audit (if linked) or attempt the route
        ↓
Unavailable or denied with a clear explanation
        ↓
No other workspace’s history visible
```

### Forensic trust — history stays history

```text
Administrator views an old event
        ↓
No edit control / no delete control
        ↓
Integrity foundation remains intact after ordinary use
```

---

## Acceptance (planning)

| #   | Criterion                                 | Fail if                                   |
| --- | ----------------------------------------- | ----------------------------------------- |
| 1   | Admin can use Security Audit without SSH  | History only in host logs                 |
| 2   | Search/filter finds known security events | Blind scroll-only or engineer-only        |
| 3   | Attribution is present and non-secret     | Missing actor/time/outcome or secret leak |
| 4   | Append-only product semantics             | Edit/delete offered or works              |
| 5   | Integrity foundation evidenced            | Silent rewrite undetectable/unprevented   |
| 6   | Workspace + RBAC boundaries hold          | Cross-workspace or non-Admin spy access   |
| 7   | Prior Wave 1 journeys unregressed         | Login/People/Vault/hardening broken       |

---

## Mandatory questions (planning answers)

1. **What does the customer receive?** Security Audit Product as defined above.
2. **What does the customer NOT receive?** Monitoring, Vault ownership, Connections, exchanges, billing, live trading, L03 financial log, S06 isolation suite, editable history.
3. **What business problem does S05 solve?** Lack of forensic, searchable, trustworthy security history as a product.
4. **What products consume S05 later?** S06 sequencing / Wave 1 exit; Wave 2 connection events; O05 monitoring; L03 financial correlation / SEC-16; Wave 10 compliance.
5. **Does S05 introduce a new bounded context?** **No.**
6. **Was the Master Plan respected?** **Yes (planning).**
7. **Were Product Principles respected?** **Yes (planning)** — especially Everything Is Auditable, Honest Product, Security Before Convenience, Customer First, Architecture Is a Constraint.

---

## Status

**Approved.** Implement S05-a … S05-e per [`v3-s05-implementation-package.md`](./v3-s05-implementation-package.md). Classification: [`security-event-classification.md`](./security-event-classification.md). Investigation fitness: [`incident-investigation-walkthrough.md`](./incident-investigation-walkthrough.md).
