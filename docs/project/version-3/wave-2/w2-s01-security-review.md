# W2-S01 Security Review (planning)

**Package:** W2-S01 Connection Management
**Wave:** 2 — Connection Management
**Status:** Planning **COMPLETE**. Not implementation. Awaiting Product Owner Approval. Close evidence later.
**Date:** 2026-08-17
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) — **mandatory**
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w2-s01-implementation-package.md`](./w2-s01-implementation-package.md)
**Scope:** [`w2-s01-product-scope.md`](./w2-s01-product-scope.md)

This review describes **required security outcomes** for W2-S01. It does not describe how to implement them. It does **not** redefine Wave 1 security products. It references them.

```text
Connection Management uses Wave 1 security.
It does not replace Vault, Auth, Authz, Isolation, Platform, or Audit.
Secrets never become Connection columns.
Connected is earned by validation — never simulated.
```

**Planning intent:** rows marked **PASS** mean this package is designed to satisfy the control when implemented. Close requires evidence. **NOT APPLICABLE** names the real owner.

---

## Boundary (binding)

| In                                                 | Out                                              |
| -------------------------------------------------- | ------------------------------------------------ |
| Connection metadata lifecycle security             | Owning customer secret ciphertext                |
| Validation-gated Connected state                   | Exchange adapter protocol security redesign      |
| Workspace-scoped connection access                 | Reopening Wave 1 packages                        |
| Authn/Authz gates on connection actions            | Identity / RBAC matrix rewrite                   |
| Audit emit for connection lifecycle                | Audit store / timeline / incidents redesign      |
| Honest failure when Vault / validation unavailable | Live trading enablement                          |
| Provider catalog honesty (offered vs reserved)     | Telegram / SMTP delivery security product        |
| Verification Standard + regression expectations    | Monitoring / analytics / billing security scopes |

---

## How Connection Management uses existing security capabilities

| Capability                         | How Connections uses it                                                                               | Must not do                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Security Default Policy**        | Default deny on unknown actions; fail closed; least privilege; honest product; attributable lifecycle | Invent a second constitution                 |
| **Security Verification Standard** | Every Close category/row evidenced; regressions for fixed vulns owned by this package                 | Skip worksheets; claim PASS without evidence |
| **Workspace Isolation**            | Connection records and actions are workspace-bound; A↛B                                               | Soften isolation for “convenience”           |
| **Vault**                          | Only writer/reader path for integration secrets; no secret echo                                       | Store secrets outside Vault                  |
| **Authentication**                 | Only signed-in subjects perform connection actions                                                    | Create a parallel login                      |
| **Authorization**                  | Only permitted roles manage connections                                                               | Hard-code role names as a new IAM            |
| **Security Platform**              | Inherit hardening (headers, abuse controls, secure defaults)                                          | Fork platform middleware                     |
| **Security Audit**                 | Emit create/validate/replace/disconnect/revoke/disable events                                         | Persist audit itself                         |

---

## Security outcomes (mandatory)

### A. Secrets

| Outcome                         | Required                                                          |
| ------------------------------- | ----------------------------------------------------------------- |
| No customer `.env` path         | Integration secrets enter through Connections → Vault only        |
| No plaintext echo               | UI/API never return stored secret material                        |
| No plaintext connection columns | Connection metadata may reference Vault ids — never hold raw keys |
| Replace invalidates prior use   | Old material cannot remain the live secret after replace          |
| Revoked/disabled not Connected  | Status and runtime use agree                                      |

### B. Access control

| Outcome            | Required                                               |
| ------------------ | ------------------------------------------------------ |
| Authenticated only | Anonymous connection mutate/list denied                |
| Authorized only    | Roles without permission cannot manage connections     |
| Workspace scoped   | Workspace A cannot read/mutate Workspace B connections |
| Fail closed        | Missing workspace context denies                       |

### C. Honesty / abuse

| Outcome                        | Required                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| No simulated Connected success | Connected requires successful validation for offered scope     |
| No live-trading claim          | Connection cards must not enable or imply Wave 6               |
| No delivery claim              | Telegram/SMTP Connected ≠ message sent                         |
| No AI-online claim             | OpenRouter Connected ≠ model execution product                 |
| Validation failures honest     | Validation Failed with operator-safe reason; no secret leakage |

### D. Auditability

| Outcome                | Required                                                 |
| ---------------------- | -------------------------------------------------------- |
| Lifecycle attributable | Who created/validated/replaced/disconnected is auditable |
| Deny attributable      | Where product already audits denies, keep emit rules     |
| No silent admin path   | Host SQL / `.env` is not the customer success path       |

---

## Threat Review (STRIDE) — planning intent

| Category                   | Threat example                                           | Required outcome                                          | Verdict       |
| -------------------------- | -------------------------------------------------------- | --------------------------------------------------------- | ------------- |
| **Spoofing**               | Act as another operator to manage connections            | Authentication binding required                           | PASS (intent) |
| **Tampering**              | Change connection status to Connected without validation | State transitions enforced; no client-trusted status      | PASS (intent) |
| **Repudiation**            | Deny having rotated or disconnected a connection         | Audit events for lifecycle                                | PASS (intent) |
| **Information Disclosure** | Read another workspace’s connection metadata or secrets  | Isolation + Vault retrieve deny; no secret echo           | PASS (intent) |
| **Denial of Service**      | Validation spam against vendors / platform               | Inherit platform abuse controls; fail closed under stress | PASS (intent) |
| **Elevation of Privilege** | Reader mutates connections or crosses workspaces         | Authorization + isolation fail closed                     | PASS (intent) |

A package cannot Close while any Threat Review row is **REQUIRES ACTION**.

---

## Threats this package must reduce

| Threat (Security Vision / Wave 2)        | Control in this package                 |
| ---------------------------------------- | --------------------------------------- |
| Credential theft via `.env` / logs       | Vault-only path; no secret logging/echo |
| Broken access control on integrations    | Authz + workspace scope on every action |
| Dishonest connected theater              | Validation-gated Connected              |
| Cross-tenant credential use              | Workspace-scoped connections            |
| Secret replace without attribution       | Audit emit on replace/disconnect        |
| Privilege escalation via connection APIs | Least privilege; default deny           |

---

## Controls explicitly not this package

| Control                                 | Owner                                                             |
| --------------------------------------- | ----------------------------------------------------------------- |
| Password / session / MFA mechanics      | Authentication (S01)                                              |
| Role matrix content                     | Authorization (S02)                                               |
| Encryption / wrapping keys              | Vault (S03)                                                       |
| Secure headers / rate-limit product     | Security Platform (S04)                                           |
| Append-only audit store                 | Security Audit (S05)                                              |
| Isolation proof suite ownership         | Workspace Isolation (S06) — Connections **consumes** the boundary |
| Venue request signing / live orders     | Wave 4 / Wave 6                                                   |
| Telegram Bot API send hardening         | Wave 5                                                            |
| SMTP relay abuse as send product        | Wave 5                                                            |
| OpenRouter spend controls as AI product | AI Gateway / Wave 7                                               |

---

## Security Verification Standard expectations

W2-S01 starts after the Verification Standard is approved. At Close, **every category and every row** must be **PASS**, **NOT APPLICABLE**, or **REQUIRES ACTION** (zero REQUIRES ACTION allowed to Close).

Must include:

1. Injection through Secure Headers (categories 1–14) as applicable to connection surfaces
2. Explicit OWASP Top 10 and OWASP API Top 10 mapping for connection APIs/UI
3. **Security Regression Suite** — every found-and-fixed vulnerability owned by Connections leaves an automated regression in ordinary tests
4. Timing/Abuse rows where connection validate/replace endpoints could be abused
5. Explicit **NOT APPLICABLE** with named owners for live trading, delivery send, and AI execution paths not offered by this package

Planning worksheet expectation (complete at implementation Close, not now):

| Area                   | Expectation                                                  |
| ---------------------- | ------------------------------------------------------------ |
| Connection mutate APIs | Authn + Authz + workspace checked                            |
| Secret fields          | Write-only; never returned                                   |
| Status updates         | Server-side state machine only                               |
| Cross-tenant tests     | A↛B for list/get/create/validate/replace/disconnect          |
| Audit emit             | Lifecycle events present                                     |
| Honest error bodies    | No ciphertext, no foreign ids beyond anti-enumeration policy |
| Deferred I/O           | Cannot be toggled into “live connected” by client            |

---

## Failure philosophy (security)

| Failure                  | Security-required behavior                                                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vault unavailable        | Fail closed; do not accept secrets into unsafe storage                                                                                                                                               |
| Validation ambiguous     | Do not mark Connected                                                                                                                                                                                |
| Authz missing            | Deny                                                                                                                                                                                                 |
| Workspace missing/forged | Deny                                                                                                                                                                                                 |
| Audit emit fails         | Follow existing Wave 1 durability rules for security events; do not silently succeed a privileged mutate if policy requires durable audit — record honest limitation if any transitional rule exists |

---

## Out of this review as primary owners

- Wave 1 product redesign
- Exchange adapter cryptography
- Notification delivery transport security
- AI gateway provider plugins
- Monitoring alerts product
- Billing isolation
- Live capital ADR controls

---

**STOP.** Wait for Product Owner review before W2-S01 implementation begins. Re-run this Security Review with evidence at Close.
