# W2-S05 Security Review

**Package:** W2-S05 AI Connectivity Foundation
**Wave:** 2 — Connection Management
**Status:** Planning **COMPLETE**. Not implementation. Awaiting Product Owner Approval.
**Date:** 2026-08-26
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w2-s05-implementation-package.md`](./w2-s05-implementation-package.md)
**Scope:** [`w2-s05-product-scope.md`](./w2-s05-product-scope.md)

```text
AI Connectivity uses Wave 1 security, Connection Management, Vault, and AI Gateway.
It does not replace Vault, Auth, Authz, Isolation, Platform, or Audit.
Vaulted OpenRouter use is not Live Trading and not AI capital control.
No plaintext secret echo. No host env auto-import into every workspace.
No Wave 7 Complete claim. No Notification delivery claim.
```

## Planning verdict

| Area                                    | Verdict       |
| --------------------------------------- | ------------- |
| Authentication / Authorization consumed | PASS (intent) |
| Workspace Isolation consumed            | PASS (intent) |
| Vault consumed; no local secret store   | PASS (intent) |
| Security Platform / Audit consumed      | PASS (intent) |
| No Live Trading / AI capital control    | PASS (intent) |
| No Wave 1 / ownership redesign          | PASS (intent) |
| Evidence rows                           | PENDING Close |

Planning intent below is the baseline. Close evidence is recorded only after approved implementation and Security Verification Standard worksheets.

---

## Boundary (binding)

| In                                                        | Out                                                 |
| --------------------------------------------------------- | --------------------------------------------------- |
| Workspace-scoped OpenRouter vault retrieve for use / test | Owning customer secret ciphertext                   |
| Authn/Authz gates on manage and use paths                 | Redesigning Connection Management / Vault / Gateway |
| OpenRouter test honesty                                   | Reopening Wave 1 packages                           |
| No-restart vaulted key use                                | Identity / RBAC matrix rewrite                      |
| Honest offline                                            | Audit store / timeline / incidents redesign         |
| No plaintext echo / export                                | Live trading enablement                             |
| OWASP / API implications for AI connectivity surfaces     | Wave 7 multi-provider security scopes               |
| Audit attribution for test / use / fail / offline         | Notification delivery security scopes               |
| Verification Standard + regression expectations           | Monitoring / analytics / billing security scopes    |
| Forbid host env auto-import into all workspaces           | AI capital control / Gate-Risk bypass               |

---

## How AI Connectivity uses existing security capabilities

| Capability                         | How AI Connectivity uses it                                                       | Must not do                                        |
| ---------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Security Default Policy**        | Default deny; fail closed; least privilege; honest product; attributable outcomes | Invent a second constitution                       |
| **Security Verification Standard** | Every Close category/row evidenced; regressions for fixed vulns owned by package  | Skip worksheets; claim PASS without evidence       |
| **Workspace Isolation**            | OpenRouter key use and test are workspace-bound; A↛B                              | Soften isolation to share AI keys                  |
| **Vault**                          | Retrieve workspace OpenRouter ciphertext for use/test; no local store; no echo    | Duplicate Vault; auto-import host env into tenants |
| **Authentication**                 | Only signed-in subjects manage / use                                              | Create a parallel login                            |
| **Authorization**                  | Only permitted roles manage / use                                                 | Hard-code a new IAM                                |
| **Security Platform**              | Inherit hardening and abuse / rate-limit defaults                                 | Fork platform middleware                           |
| **Security Audit**                 | Emit OpenRouter test / use / fail / offline                                       | Persist audit itself                               |
| **Connection Management**          | Existing OpenRouter connection records and lifecycle                              | Bypass the facade or invent a second product       |
| **AI Gateway**                     | Protocol I/O owner for OpenRouter                                                 | Replace gateway ownership                          |

---

## Required coverage

### 1. Workspace isolation

| Outcome                    | Required                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| Workspace scoped           | Workspace A cannot retrieve or use Workspace B OpenRouter material       |
| Fail closed                | Missing or forged workspace context denies                               |
| No silent host key fan-out | Host env OpenRouter key is never written into every workspace as default |

### 2. Authorization

| Outcome            | Required                                        |
| ------------------ | ----------------------------------------------- |
| Authenticated only | Anonymous AI connectivity manage / use denied   |
| Authorized only    | Roles without permission cannot manage or use   |
| No new role        | Reuse existing Authorization; do not invent IAM |
| Fail closed        | Missing permission denies — not empty success   |

### 3. Secret handling

| Outcome                | Required                                                        |
| ---------------------- | --------------------------------------------------------------- |
| Write-only credentials | OpenRouter key never read back, exported, downloaded, or logged |
| Vault-only ciphertext  | No local plaintext secret store in this package                 |
| Retrieve for use only  | Decrypt/retrieve only on authorized use/test paths              |
| Rotate invalidates old | Previous material unusable after replace (consume CM lifecycle) |

### 4. Runtime preference integrity

| Outcome                             | Required                                                          |
| ----------------------------------- | ----------------------------------------------------------------- |
| Prefer workspace vault key          | When present, vaulted workspace key is used                       |
| No customer `.env` production story | Customer journey must not require OpenRouter env                  |
| No restart dependency               | Save/rotate vaulted key must not require operator process restart |
| Client cannot assert online         | Client-supplied “AI online” / Connected claims rejected           |

### 5. Test honesty

| Outcome                  | Required                                                       |
| ------------------------ | -------------------------------------------------------------- |
| Vendor-visible failure   | Failed OpenRouter test shows actionable vendor-visible outcome |
| No fake Connected        | Simulated success forbidden                                    |
| No secret in error text  | Failures never include the API key                             |
| Test is not Live Trading | Test success does not enable live capital                      |

### 6. AI safety / capital boundary

| Outcome                | Required                                                     |
| ---------------------- | ------------------------------------------------------------ |
| No capital control     | AI connectivity cannot place live orders or bypass Gate/Risk |
| No Live Trading claim  | Product copy and capabilities exclude Live Trading           |
| Paper remains separate | Paper Trading Foundation remains paper-only (W2-S04 CLOSED)  |

### 7. Replay / repudiation

| Outcome              | Required                                                  |
| -------------------- | --------------------------------------------------------- |
| Prior test ≠ forever | Replaying an old success does not forge current usability |
| Attributable events  | Test / use / fail / offline emit to Security Audit        |

---

## Threat Review (STRIDE) — planning intent

| Category               | Threat                                          | Mitigation (planning)                               | Verdict       |
| ---------------------- | ----------------------------------------------- | --------------------------------------------------- | ------------- |
| Spoofing               | Actor claims another workspace’s AI key context | Authn + workspace binding on retrieve/use           | PASS (intent) |
| Tampering              | Client forces Connected / AI online             | Server-owned status; reject client integrity fields | PASS (intent) |
| Repudiation            | OpenRouter use/test without audit               | Emit attributable audit outcomes                    | PASS (intent) |
| Information Disclosure | Plaintext key in UI, logs, errors, export       | Write-only; no echo; redacted errors                | PASS (intent) |
| Denial of Service      | Unbounded vendor test spam                      | Inherit platform rate limits / abuse defaults       | PASS (intent) |
| Elevation of Privilege | Unauthorized role uses or manages OpenRouter    | Authorization on manage and use paths               | PASS (intent) |

Additional named threats:

| Threat                                | Control                                               |
| ------------------------------------- | ----------------------------------------------------- |
| Host env auto-imported to all tenants | Forbidden; env is non-production fallback only        |
| AI used to spend capital              | Out of scope; no live order path from AI connectivity |
| Fake Wave 7 / Live Trading claims     | Honesty model; acceptance criteria forbid             |

---

## Security Verification Standard (planning)

At Close, every applicable category/row in [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) must be evidenced for package-owned surfaces.

Regression suite must include:

- Cross-workspace OpenRouter key deny
- Unauthorized manage / use deny
- No plaintext echo on save, test, use, rotate, disconnect
- Honest offline when no usable key
- No Live Trading / capital control path from AI connectivity
- Wave 1 / W2-S01…W2-S04 regressions for consumed security boundaries

---

## Explicit non-goals (security)

- Redesign Vault encryption
- Redesign Authentication / Authorization / Isolation products
- Redesign Security Platform or Security Audit store
- Notification delivery transport security (Wave 5)
- Live trading financial controls (Wave 6)
- Wave 7 multi-provider AI Platform security productization
- External pentest alone as package Close

---

## Planning security checklist summary

| Item                                     | Planning                  |
| ---------------------------------------- | ------------------------- |
| Consumes Wave 1 security products only   | YES                       |
| No new security product invented         | YES                       |
| Workspace isolation required             | YES                       |
| Secret non-disclosure required           | YES                       |
| AI capital control forbidden             | YES                       |
| Live Trading forbidden                   | YES                       |
| Verification Standard mandatory at Close | YES                       |
| Evidence complete                        | NO — after implementation |

---

**STOP.** Wait for Product Owner review before W2-S05 implementation begins. This document is planning intent only.
