# W3-O01 Security Review

**Package:** W3-O01 Durable Analytical Stores
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O01 · IN-01 · TD-048
**Status:** Planning **COMPLETE**. Not implementation. Awaiting Product Owner Planning Review and Approval.
**Date:** 2026-08-26
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w3-o01-implementation-package.md`](./w3-o01-implementation-package.md)
**Scope:** [`w3-o01-product-scope.md`](./w3-o01-product-scope.md)

```text
Durable Analytical Stores use Wave 1 security and existing aggregates.
They do not replace Vault, Auth, Authz, Isolation, Platform, or Audit.
Survive-restart is not Live Trading and not Monitoring Complete.
No plaintext secret echo. No second Lake / Outbox.
No new security ownership.
Fail Closed.
```

## Planning verdict

| Area                                    | Verdict       |
| --------------------------------------- | ------------- |
| Authentication / Authorization consumed | PASS (intent) |
| Workspace Isolation consumed            | PASS (intent) |
| Vault consumed; no local secret store   | PASS (intent) |
| Security Platform / Audit consumed      | PASS (intent) |
| No Live Trading / capital control       | PASS (intent) |
| No Wave 1 / Wave 2 / ownership redesign | PASS (intent) |
| No new security ownership               | PASS (intent) |
| Evidence rows                           | PENDING Close |

Planning intent below is the baseline. Close evidence is recorded only after approved implementation and Security Verification Standard worksheets.

---

## Boundary (binding)

| In                                                  | Out                                       |
| --------------------------------------------------- | ----------------------------------------- |
| Workspace-scoped durable analytical artifact access | Owning customer secret ciphertext         |
| Authn/Authz gates on analytical durability surfaces | Redesigning Auth / Vault / Audit store    |
| Survive-restart / honest ephemeral outcomes         | Reopening Wave 1 or Wave 2 packages       |
| Fail closed on missing context                      | Identity / RBAC matrix rewrite            |
| No fake post-restart success                        | Monitoring product security scopes (O05)  |
| Audit attribution for required durability outcomes  | Kill Switch product security scopes (O04) |
| Verification Standard + regression expectations     | Live trading financial controls (Wave 6)  |
| Forbid second Lake / Outbox                         | Notification transport security (Wave 5)  |

---

## How Durable Analytical Stores use existing security capabilities

| Capability                         | How this package uses it                                                          | Must not do                                  |
| ---------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- |
| **Security Default Policy**        | Default deny; fail closed; least privilege; honest product; attributable outcomes | Invent a second constitution                 |
| **Security Verification Standard** | Every Close category/row evidenced; regressions for fixed vulns owned by package  | Skip worksheets; claim PASS without evidence |
| **Workspace Isolation**            | Analytical artifacts are workspace-bound; A↛B                                     | Soften isolation to share artifacts          |
| **Vault**                          | No local secret store; no echo                                                    | Duplicate Vault                              |
| **Authentication**                 | Only signed-in subjects access                                                    | Create a parallel login                      |
| **Authorization**                  | Only permitted roles access                                                       | Hard-code a new IAM                          |
| **Security Platform**              | Inherit hardening and abuse / rate-limit defaults                                 | Fork platform middleware                     |
| **Security Audit**                 | Emit durability-relevant outcomes where required                                  | Persist audit itself                         |
| **Existing analytical owners**     | Persistence on existing aggregates                                                | Invent second SoT / Lake / Outbox            |

---

## Required coverage

### 1. Workspace isolation

| Outcome          | Required                                                 |
| ---------------- | -------------------------------------------------------- |
| Workspace scoped | Workspace A cannot read Workspace B analytical artifacts |
| Fail closed      | Missing or forged workspace context denies               |

### 2. Authorization

| Outcome            | Required                                        |
| ------------------ | ----------------------------------------------- |
| Authenticated only | Anonymous access denied                         |
| Authorized only    | Roles without permission cannot access          |
| No new role        | Reuse existing Authorization; do not invent IAM |
| Fail closed        | Missing permission denies — not empty success   |

### 3. Secret handling

| Outcome                  | Required                                                  |
| ------------------------ | --------------------------------------------------------- |
| No local secret store    | Durability work never stores vendor secrets outside Vault |
| No plaintext echo        | Logs, errors, exports never include secrets               |
| Vault unchanged as owner | Ciphertext ownership remains Vault                        |

### 4. Durability integrity

| Outcome                      | Required                                             |
| ---------------------------- | ---------------------------------------------------- |
| Survive means present        | Claimed survive surfaces remain after restart        |
| No fake present              | Missing post-restart artifact never shown as success |
| Ephemeral honesty            | Non-survive surfaces labeled honestly                |
| Client cannot assert durable | Client-supplied “survived” claims rejected           |

### 5. Architecture security

| Outcome              | Required                              |
| -------------------- | ------------------------------------- |
| No second Lake       | Forbidden                             |
| No second Outbox     | Forbidden                             |
| No ownership drift   | Existing owners unchanged             |
| No Live Trading path | Durability cannot enable live capital |

### 6. Replay / repudiation

| Outcome                                      | Required                                                 |
| -------------------------------------------- | -------------------------------------------------------- |
| Attributable events                          | Required durability outcomes emit to Security Audit      |
| Prior presence ≠ forever without persistence | Replay of old UI state does not forge current durability |

---

## Threat Review (STRIDE) — planning intent

| Category               | Threat                                              | Mitigation (planning)                               | Verdict       |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------- | ------------- |
| Spoofing               | Actor claims another workspace’s analytical context | Authn + workspace binding                           | PASS (intent) |
| Tampering              | Client forces “survived” / present status           | Server-owned status; reject client integrity fields | PASS (intent) |
| Repudiation            | Durability-relevant actions without audit           | Emit attributable audit outcomes                    | PASS (intent) |
| Information Disclosure | Secrets or foreign-workspace artifacts in UI/logs   | Isolation + no echo + Authz                         | PASS (intent) |
| Denial of Service      | Unbounded persistence / restart thrash abuse        | Inherit platform rate limits / abuse defaults       | PASS (intent) |
| Elevation of Privilege | Unauthorized role accesses analytical surfaces      | Authorization on access paths                       | PASS (intent) |

Additional named threats:

| Threat                                   | Control                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| Silent analytical wipe after restart     | Default survive; Close evidence requires restart proof |
| Fake durable claim for ephemeral surface | Honesty model; acceptance criteria forbid              |
| Second Lake / Outbox as parallel SoT     | Architecture constraints forbid                        |
| Durability used to enable Live Trading   | Out of scope; no live order path                       |

---

## Security Verification Standard (planning)

At Close, every applicable category/row in [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) must be evidenced for package-owned surfaces.

Regression suite must include:

- Cross-workspace analytical artifact deny
- Unauthorized access deny
- No plaintext secret echo on durability paths
- No fake post-restart success
- No Live Trading path from durability package
- Wave 1 / Wave 2 regressions for consumed security boundaries
- No second Lake / Outbox introduced

---

## Explicit non-goals (security)

- Redesign Vault encryption
- Redesign Authentication / Authorization / Isolation products
- Redesign Security Platform or Security Audit store
- Monitoring security dashboard productization (O05)
- Kill Switch product security (O04)
- Notification delivery transport security (Wave 5)
- Live trading financial controls (Wave 6)
- External pentest alone as package Close
- New security product ownership

---

## Planning security checklist summary

| Item                                     | Planning                  |
| ---------------------------------------- | ------------------------- |
| Consumes Wave 1 security products only   | YES                       |
| No new security product invented         | YES                       |
| Workspace isolation required             | YES                       |
| Secret non-disclosure required           | YES                       |
| Fail Closed                              | YES                       |
| Live Trading forbidden                   | YES                       |
| Verification Standard mandatory at Close | YES                       |
| Evidence complete                        | NO — after implementation |

---

**STOP.** Wait for Product Owner Planning Review before W3-O01 implementation begins. This document is planning intent only.
