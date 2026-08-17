# Security Event Classification

**Document:** Version 3 Security Event Classification
**Date:** 2026-08-17
**Status:** Product Owner classification for V3-S05 — Approved with the S05 Planning Package. Planning only.
**Package:** V3-S05 Audit Trail Foundation (Security Audit Product)
**Nature:** Product classification. Not an RC. Not an ADR. Not implementation. Not an event schema. Not database design. Not a Master Plan revision.

**Companions:** [`v3-s05-implementation-package.md`](./v3-s05-implementation-package.md) · [`v3-s05-product-scope.md`](./v3-s05-product-scope.md) · [`v3-s05-security-review.md`](./v3-s05-security-review.md) · [`security-audit-overview.md`](./security-audit-overview.md) · [`incident-investigation-walkthrough.md`](./incident-investigation-walkthrough.md)

This document defines **what kinds of security events exist** for the Security Audit Product. It tells Product Owners and implementers which classes matter, how seriously, and what operators should expect when searching and retaining them.

It does **not** define field names, tables, APIs, or emitters. Emitters stay with Authentication, RBAC, Vault, and Security Platform packages. S05 consumes classified history.

---

## How to read the dimensions

| Dimension                      | Meaning                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Criticality**                | Overall forensic priority for Wave 1 Security Audit (`Critical` / `High` / `Medium` / `Low`)                                                            |
| **Customer Trust impact**      | How much this class affects whether operators and users believe the product is honest and safe                                                          |
| **Financial Integrity impact** | How much this class changes who can later affect capital, credentials that enable venues, or refused financial bypass — **not** the money Ledger itself |
| **Security impact**            | How much this class matters for attack detection, privilege abuse, and credential exposure posture                                                      |
| **Retention expectation**      | How long this class should remain useful in the product (Wave 1 interim stance; Wave 10 may refine compliance)                                          |
| **Search expectation**         | Whether Administrators must be able to find this class quickly in Security Audit                                                                        |

Scale for impact columns: **Critical** / **High** / **Medium** / **Low** / **None (this wave)**.

---

## Classes

### Authentication

Sign-in outcomes that prove identity was accepted, refused, or locked.

| Dimension                  | Value                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Criticality                | **Critical**                                                                                                   |
| Customer Trust impact      | **High** — users ask “was that me?”                                                                            |
| Financial Integrity impact | **High** — stolen sign-in is a path to later capital actions                                                   |
| Security impact            | **Critical** — primary account-takeover signal                                                                 |
| Retention expectation      | **Long** — keep across typical incident windows (months-scale interim; do not treat as disposable debug noise) |
| Search expectation         | **Must find** by time, outcome (success/failure/lockout), and actor when known                                 |

Examples (product language, not schema): sign-in succeeded; sign-in failed; account locked after repeated failures.

---

### Session

Ongoing sign-in presence: creation, refresh, logout, and revoke of devices/sessions.

| Dimension                  | Value                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| Criticality                | **Critical**                                                         |
| Customer Trust impact      | **Critical** — “was my account used on another device?”              |
| Financial Integrity impact | **High** — active sessions are the vehicle for later privileged work |
| Security impact            | **Critical** — session theft and cleanup trail                       |
| Retention expectation      | **Long** — same interim stance as Authentication                     |
| Search expectation         | **Must find** by time, actor, and revoke/logout vs create            |

Examples: session started; signed out; other sessions ended; signed out everywhere.

---

### Recovery

Account recovery and signed-in password change outcomes (never the secret itself).

| Dimension                  | Value                                                                      |
| -------------------------- | -------------------------------------------------------------------------- |
| Criticality                | **High**                                                                   |
| Customer Trust impact      | **Critical** — recovery disputes and “I didn’t change my password”         |
| Financial Integrity impact | **High** — recovery is a takeover path                                     |
| Security impact            | **High** — abuse of recovery / password change                             |
| Retention expectation      | **Long**                                                                   |
| Search expectation         | **Must find** by time and actor; outcome only — no tokens or reset secrets |

Examples: password changed; recovery completed; recovery unavailable (honest host-mail-off outcome when recorded).

---

### Authorization

Permission decisions and refusals on privileged actions (including People refusals already recorded).

| Dimension                  | Value                                                                    |
| -------------------------- | ------------------------------------------------------------------------ |
| Criticality                | **Critical**                                                             |
| Customer Trust impact      | **High** — “why was I blocked?”                                          |
| Financial Integrity impact | **High** — refused or allowed paths toward capital-adjacent power        |
| Security impact            | **Critical** — privilege abuse and default-deny evidence                 |
| Retention expectation      | **Long**                                                                 |
| Search expectation         | **Must find** by time, actor, action class, and outcome (allowed/denied) |

Examples: privileged action denied; People action refused.

---

### Privilege

Role and privilege assignment changes (who became Reader / Researcher / Trader / Administrator).

| Dimension                  | Value                                                               |
| -------------------------- | ------------------------------------------------------------------- |
| Criticality                | **Critical**                                                        |
| Customer Trust impact      | **High** — who can administer and who can trade later               |
| Financial Integrity impact | **Critical** — Trader/Admin changes are capital-adjacent precursors |
| Security impact            | **Critical** — escalation and insider misuse                        |
| Retention expectation      | **Longest among Wave 1 classes** — treat as durable access history  |
| Search expectation         | **Must find** by actor, subject, previous role, new role, and time  |

Examples: role changed; role change refused (including own-role deny); last-Administrator protection refused.

---

### Vault

Secret lifecycle and vault access refusals (never plaintext, never wrapping keys).

| Dimension                  | Value                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| Criticality                | **Critical**                                                                                            |
| Customer Trust impact      | **High** — “who touched credentials?”                                                                   |
| Financial Integrity impact | **Critical** — venue/AI secrets enable later money movement                                             |
| Security impact            | **Critical** — credential exposure window                                                               |
| Retention expectation      | **Longest among Wave 1 classes** — credential history must outlast short incidents                      |
| Search expectation         | **Must find** by time, actor, workspace, secret type/purpose class, and outcome — never by secret value |

Examples: secret created; secret revoked; secret deleted; secret replaced; vault access denied.

---

### Security Platform

Platform-edge hardening signals (abuse shaping, throttles, hardened denials) owned by S04 emitters.

| Dimension                  | Value                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------- |
| Criticality                | **High**                                                                                |
| Customer Trust impact      | **Medium** — explains “try later” and opaque denials when investigated                  |
| Financial Integrity impact | **Medium** — spray/flood often precedes takeover attempts                               |
| Security impact            | **High** — attack precursor and abuse evidence                                          |
| Retention expectation      | **Medium–Long** — keep enough for incident windows; may be denser than Privilege events |
| Search expectation         | **Must find** by time, path class, and outcome; IP when present                         |

Examples: request throttled; shaped unauthorized denial.

---

### Abuse

Hostile or abusive patterns called out as abuse-class history (overlaps Security Platform; kept distinct for operator language).

| Dimension                  | Value                                                                           |
| -------------------------- | ------------------------------------------------------------------------------- |
| Criticality                | **High**                                                                        |
| Customer Trust impact      | **Medium**                                                                      |
| Financial Integrity impact | **Medium**                                                                      |
| Security impact            | **Critical** — explicit abuse narrative for investigation                       |
| Retention expectation      | **Long** within incident windows                                                |
| Search expectation         | **Must find** as an abuse/security filter, not buried only under generic errors |

Examples: repeated sensitive-action spray; lockout-related abuse trail when presented as abuse history.

Note: Emitters may originate under Authentication or Security Platform. Classification for the **product** may still label the operator-visible story as Abuse when that is the investigation frame.

---

### Workspace

Workspace-scoped security boundary events (membership/access boundary signals that are security-relevant when recorded).

| Dimension                  | Value                                                      |
| -------------------------- | ---------------------------------------------------------- |
| Criticality                | **High** (when emitted)                                    |
| Customer Trust impact      | **High** — “can someone see our workspace?”                |
| Financial Integrity impact | **High** — wrong workspace access is capital and data risk |
| Security impact            | **Critical** — tenancy boundary                            |
| Retention expectation      | **Long**                                                   |
| Search expectation         | **Must find** by workspace, actor, and time                |

Examples (Wave 1 may be sparse): cross-workspace access denied when such events are emitted; workspace-scoped security decisions already attributed with workspace id.

Honest limit: full isolation **suite** product remains **V3-S06**. S05 still classifies Workspace events so tenancy denials are first-class when present.

---

### Configuration

Security-relevant configuration or policy changes that alter posture (when recorded as security history).

| Dimension                  | Value                                                                      |
| -------------------------- | -------------------------------------------------------------------------- |
| Criticality                | **High** (when emitted)                                                    |
| Customer Trust impact      | **High** — “who changed security posture?”                                 |
| Financial Integrity impact | **High** when the change enables live, connections, or capital paths later |
| Security impact            | **High**                                                                   |
| Retention expectation      | **Long**                                                                   |
| Search expectation         | **Must find** by time, actor, and configuration class                      |

Examples (mostly later waves, ingest-ready): live enablement; kill-switch trips; connection security posture changes; security policy toggles if ever productized.

Honest limit: Connection Management, live enablement, and kill switch are **not** S05 products. Classification exists so S05 remains ready to retain and search them when those packages emit events.

---

## Summary matrix

| Class             | Criticality | Trust    | Financial integrity          | Security | Retention   | Search    |
| ----------------- | ----------- | -------- | ---------------------------- | -------- | ----------- | --------- |
| Authentication    | Critical    | High     | High                         | Critical | Long        | Must find |
| Session           | Critical    | Critical | High                         | Critical | Long        | Must find |
| Recovery          | High        | Critical | High                         | High     | Long        | Must find |
| Authorization     | Critical    | High     | High                         | Critical | Long        | Must find |
| Privilege         | Critical    | High     | Critical                     | Critical | Longest     | Must find |
| Vault             | Critical    | High     | Critical                     | Critical | Longest     | Must find |
| Security Platform | High        | Medium   | Medium                       | High     | Medium–Long | Must find |
| Abuse             | High        | Medium   | Medium                       | Critical | Long        | Must find |
| Workspace         | High        | High     | High                         | Critical | Long        | Must find |
| Configuration     | High        | High     | High (when capital-adjacent) | High     | Long        | Must find |

---

## What this classification is not

- Not an event schema
- Not a database design
- Not a requirement to invent emitters that prior packages did not already own
- Not monitoring thresholds (owner: **V3-O05**)
- Not the financial action log for live place/cancel (owner: **V3-L03**)
- Not permission to store secrets in audit history

---

## Event Minimalism (binding)

Classification is also an admission standard. Security Audit must retain **meaningful security history**, not mirror every application log line.

Before a new security event class is admitted, its owner must be able to answer:

1. What investigation question does this event answer?
2. Which existing classified event does it complement rather than duplicate?
3. Why does its criticality justify its retention expectation?
4. How will an Administrator find it without drowning in routine noise?

Do not admit events that only repeat a successful routine operation, internal retry, technical diagnostic, or existing audit outcome without improving an investigation.

Do retain a meaningful allowed, denied, refused, lockout, revoke, privilege, vault-lifecycle, posture-change, or abuse outcome when it materially establishes **who did what, when, and with what result**.

**Product rule:** one operator-visible security fact should have one audit story. Emitters may create technical logs for their own operations; S05 must not copy those logs into the customer audit product merely because they exist.

---

## Product Owner decision

This classification and Event Minimalism are binding for V3-S05 planning and Close evidence: the Security Audit Product must treat the **Critical** / **Must find** / **Long(est)** classes as first-class investigation material, not optional log noise.

**STOP.** Implementation may follow S05 Approval. This file itself remains planning classification — no code implied by editing it.
