# W3-O04 Security Review

**Package:** W3-O04 Durable Kill Switch Product
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O04 · LT-03 · TD-047
**Status:** Planning **COMPLETE**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Date:** 2026-08-27
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w3-o04-implementation-package.md`](./w3-o04-implementation-package.md)
**Scope:** [`w3-o04-product-scope.md`](./w3-o04-product-scope.md)

```text
Durable Kill Switch Product uses Wave 1 security and existing Session / Command Center ownership.
It does not replace Vault, Auth, Authz, Isolation, Platform, or Audit.
It does not redesign Risk Engine or Runtime evaluator behaviour.
It introduces no new persistence owner, Kill Switch engine, or runtime controller.
Kill Switch Complete is not Live Trading, Monitoring Complete, or Wave 3 COMPLETE.
No plaintext secret echo. No second Lake / Outbox / Inbox / Event Store / Projection Store.
No new security ownership.
Fail Closed.
No unauthorized arm / clear.
No cross-workspace Kill Switch control.
```

## Planning verdict

| Area                                       | Verdict       |
| ------------------------------------------ | ------------- |
| Authentication reused                      | PASS (intent) |
| Authorization reused                       | PASS (intent) |
| Workspace Isolation reused                 | PASS (intent) |
| Vault reused; no local secret store        | PASS (intent) |
| Security Platform reused                   | PASS (intent) |
| Security Audit reused (emit only)          | PASS (intent) |
| Fail Closed preserved                      | PASS (intent) |
| No new security ownership                  | PASS (intent) |
| No Live Trading / capital control from O04 | PASS (intent) |
| No Gate/Risk/Kill Switch bypass            | PASS (intent) |
| No Wave 1 / Wave 2 / W3-O01…O03 redesign   | PASS (intent) |
| Evidence rows                              | PENDING Close |

Planning intent below is the baseline. Close evidence is recorded only after approved implementation and Security Verification Standard worksheets.

---

## Boundary (binding)

| In                                                    | Out                                      |
| ----------------------------------------------------- | ---------------------------------------- |
| Workspace-scoped Kill Switch arm / clear access       | Owning customer secret ciphertext        |
| Authn/Authz gates on halt surfaces                    | Redesigning Auth / Vault / Audit store   |
| Durable armed / cleared outcomes on existing owner    | Reopening Wave 1, Wave 2, W3-O01…O03     |
| Fail closed on missing context                        | Identity / RBAC matrix rewrite           |
| No fake cleared while armed persists                  | Monitoring product security scopes (O05) |
| Audit attribution for required arm / clear outcomes   | Live trading financial controls (Wave 6) |
| Verification Standard + regression expectations       | BC/HA/DR platform security scopes        |
| Forbid second Kill Switch engine / runtime controller | Risk Engine redesign                     |
| Admission block while armed on paper                  | Telegram as Kill Switch owner            |

---

## How Durable Kill Switch Product uses existing security capabilities

| Capability                         | How this package uses it                                                          | Must not do                                  |
| ---------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- |
| **Security Default Policy**        | Default deny; fail closed; least privilege; honest product; attributable outcomes | Invent a second constitution                 |
| **Security Verification Standard** | Every Close category/row evidenced; regressions for fixed vulns owned by package  | Skip worksheets; claim PASS without evidence |
| **Workspace Isolation**            | Kill Switch state is workspace-bound; A↛B                                         | Soften isolation to share halt control       |
| **Vault**                          | No local secret store; no echo                                                    | Duplicate Vault                              |
| **Authentication**                 | Only signed-in subjects access                                                    | Create a parallel login                      |
| **Authorization**                  | Only permitted roles arm / clear                                                  | Hard-code a new IAM                          |
| **Security Platform**              | Inherit hardening and abuse / rate-limit defaults                                 | Fork platform middleware                     |
| **Security Audit**                 | Emit arm / clear / halt-relevant outcomes where required                          | Persist audit itself                         |
| **Session / Command Center**       | Product facade on existing ownership                                              | Invent second Kill Switch SoT                |
| **Runtime admission**              | Existing `kill_switch_active` gate — no bypass                                    | Bypass Gate/Risk chain                       |
| **Risk Engine**                    | Safety context consumed — not redesigned                                          | Become Risk Engine                           |

---

## Security Review (planning verification)

| Check                      | Result |
| -------------------------- | ------ |
| Authentication reused      | PASS   |
| Authorization reused       | PASS   |
| Workspace Isolation reused | PASS   |
| Vault reused               | PASS   |
| Security Platform reused   | PASS   |
| Security Audit reused      | PASS   |
| Fail Closed preserved      | PASS   |
| No new security ownership  | PASS   |

---

## Required coverage

### 1. Workspace isolation

| Outcome          | Required                                                |
| ---------------- | ------------------------------------------------------- |
| Workspace scoped | Workspace A cannot read / drive Workspace B Kill Switch |
| Fail closed      | Missing or forged workspace context denies              |

### 2. Authorization

| Outcome                | Required                                                        |
| ---------------------- | --------------------------------------------------------------- |
| Authenticated only     | Anonymous arm / clear denied                                    |
| Authorized only        | Roles without permission cannot arm / clear                     |
| No new role            | Reuse existing Authorization; do not invent IAM                 |
| Fail closed            | Missing permission denies — not empty success                   |
| Arm / clear separation | Clear requires explicit authorized action where policy requires |

### 3. Secret handling

| Outcome                  | Required                                                   |
| ------------------------ | ---------------------------------------------------------- |
| No local secret store    | Kill Switch work never stores vendor secrets outside Vault |
| No plaintext echo        | Logs, errors, exports never include secrets                |
| Vault unchanged as owner | Ciphertext ownership remains Vault                         |

### 4. Halt integrity

| Outcome                        | Required                                              |
| ------------------------------ | ----------------------------------------------------- |
| No client-forged cleared state | Client cannot clear armed state without authorization |
| No silent loss on restart      | Armed state must not disappear without honest record  |
| Admission block while armed    | Paper evaluation/admission denied while armed         |
| No Gate/Risk bypass            | Kill Switch remains in domain gate chain              |

### 5. Audit attribution

| Outcome            | Required                                          |
| ------------------ | ------------------------------------------------- |
| Arm attributable   | Who armed, when, workspace, reason where required |
| Clear attributable | Who cleared, when, workspace                      |
| Emit only          | Security Audit store ownership unchanged          |

### 6. Threat model (planning intent)

| Threat                            | Mitigation intent                               |
| --------------------------------- | ----------------------------------------------- |
| Unauthorized arm / clear          | Authn + Authz + fail closed                     |
| Cross-workspace halt              | Workspace Isolation                             |
| Forged inactive state while armed | Server-side durable state on existing owner     |
| Secret exposure in halt flows     | Vault-only secrets; no echo                     |
| Kill Switch bypass on paper       | Runtime admission `kill_switch_active` enforced |
| Privilege escalation via halt UI  | Reuse Authorization; no new privileged bypass   |
| Live Trading enablement via O04   | Out of scope; no capital path from package      |
| Second operational controller     | Forbidden — product facade only                 |

---

## Explicit non-goals (security)

- Redesign Vault encryption
- Redesign Authentication / Authorization / Isolation products
- Redesign Security Platform or Security Audit store
- Redesign Risk Engine safety semantics
- Monitoring security dashboard productization (O05)
- Live trading financial controls (Wave 6) — except reusing same control later
- Business Continuity / HA / DR platform security
- External pentest alone as package Close
- New security product ownership
- Telegram as Kill Switch security owner

---

## Planning security checklist summary

| Item                                     | Planning                  |
| ---------------------------------------- | ------------------------- |
| Consumes Wave 1 security products only   | YES                       |
| No new security product invented         | YES                       |
| Workspace isolation required             | YES                       |
| Secret non-disclosure required           | YES                       |
| Fail Closed                              | YES                       |
| Arm / clear authorization required       | YES                       |
| Live Trading forbidden from O04          | YES                       |
| Verification Standard mandatory at Close | YES                       |
| Evidence complete                        | NO — after implementation |

---

**STOP.** Planning COMPLETE for review. Wait for Product Owner Planning Review. Do not create W3-O04-a. This document is planning intent only.
