# V3-S02 Security Review (planning)

**Package:** V3-S02 RBAC Product  
**Wave:** 1 — Security Foundation  
**Status:** Planning security review — **not** a post-implementation closeout  
**Stage:** Implementation Package  
**Date:** 2026-08-16  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 and [`v3-security-vision.md`](./v3-security-vision.md)  
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)  
**Umbrella:** [`v3-s02-implementation-package.md`](./v3-s02-implementation-package.md)  
**Scope:** [`v3-s02-product-scope.md`](./v3-s02-product-scope.md)

This review describes **only** controls that belong in V3-S02. Authentication remains Authentication. Workspace remains Workspace. Vault, OWASP platform, audit product, isolation suite, connections, and live capital keep their owners.

**Planning intent:** rows marked **PASS** mean this package is designed to satisfy the control when implemented. Close requires evidence. **NOT APPLICABLE** names the real owner.

---

## Boundary (binding)

```text
RBAC governs WHO may perform an action.

It does NOT replace Authentication.
It does NOT manage credentials.
It does NOT manage exchange permissions.
It does NOT introduce a new Source of Truth.
```

Authentication (V3-S01, CLOSED) proves identity and owns sessions. Identity owns `User.role`. Workspace owns membership. This package owns the **authorization decision** that combines those facts. Default is **deny**.

---

## Threats this package must reduce

From the Security Vision threat model, S02 is the primary control for **broken access control** on operator actions and a contributing control for **financial fraud** (unauthorized paper commands today; live remains Wave 6).

| Threat                     | S02 control                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Privilege escalation**   | Role assignment is Admin-only. Self-escalation denied. JWT `role` is a hint; Identity is re-resolved. Register cannot create Admin.                                      |
| **Horizontal access**      | Role change does not grant foreign workspace membership. People list is Admin-only. Non-Admin cannot enumerate operators. Workspace membership stays owner-only (PC-14). |
| **Vertical access**        | Reader cannot perform C4/C5/C6. Researcher cannot perform C5/C6. Trader cannot perform C6. Live (C7) denied for all roles in this package.                               |
| **Permission inheritance** | No inheritance engine. Explicit matrix. Admin’s paper-command ability is a listed cell, not `Admin extends Trader extends …`.                                            |
| **Role confusion**         | Four named roles only. UI copy uses Reader / Researcher / Trader / Admin. No silent “superuser”. Admin cannot skip Gate/Risk (C9).                                       |
| **Default-deny policy**    | Surfaces this package classifies are deny unless the matrix allows. Missing `@Roles` on in-scope mutating routes is a Close failure.                                     |
| Shared Admin password      | Assign roles in the product so operators do not share seed credentials.                                                                                                  |
| Stale JWT privilege        | Keep session + Identity re-resolution from S01.                                                                                                                          |

Out of this review: vault theft, SSRF, live-order replay, MFA, ABAC engine, financial action log product, exchange `spot.trade`.

---

## Expected threats (detail)

### Privilege escalation

An operator with a lower role must not obtain a higher role except by an Admin assignment.

| Attack                                                               | Required control                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `PATCH` own role to Admin                                            | C6 is Admin-only; caller cannot be the authorization source of their new role |
| Register with `role: Admin` in the body                              | Create path ignores client-supplied Admin (keep default Researcher)           |
| JWT payload `role` raised without Identity change                    | `resolveSessionAuthUser` / Identity reload; claim not trusted                 |
| Last Admin demotes self, then a Researcher becomes the only operator | Last-Admin protection; fail closed                                            |
| Admin “force Gate pass”                                              | C9 never; no such API                                                         |

### Horizontal access

An operator must not read or mutate another operator’s workspace because they learned an id or received a role.

| Attack                                                            | Required control                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------ |
| Trader in workspace A calls workspace B                           | `WorkspaceAccessService` membership (owner + Active)   |
| Researcher lists `/people`                                        | 403; no user directory                                 |
| Admin assigns Trader and that Trader appears in Admin’s workspace | Role ≠ membership. Do not invent members.              |
| People list returns password hashes or session ids                | Projection: id, display name, email, role, status only |

### Vertical access

Higher-class actions stay closed to lower roles even when the UI hides the control (UI is not the control).

| Attack                                              | Required control                                       |
| --------------------------------------------------- | ------------------------------------------------------ |
| Reader `POST` certify / campaign run                | C4 denied                                              |
| Researcher `POST` paper session start / place order | C5 denied (existing trading gate + remaining surfaces) |
| Trader `POST` role assignment                       | C6 denied                                              |
| Any role `POST /v1/live/...` as a product           | C7 denied in S02                                       |

### Permission inheritance

Do not implement role hierarchy (`includes`). A future mistaken `Admin ⊃ Trader ⊃ live` must not be possible because there is no inheritance code. Matrix rows are explicit. Tests assert Reader ⊄ Researcher privileges are not implemented as a chain the server walks.

### Role confusion

Admin is people and policy, not a bypass. Product copy must not call Admin “full access” or “unrestricted”. Command Center / Gate / Risk remain their owners. Seed Admin is not labeled as the customer Administrator path.

### Default-deny policy

`RolesGuard` today allows any authenticated user when `@Roles` is missing. That is **allow-by-omission**. S02 must not leave in-scope mutating/sensitive routes in that state. Public C0 routes stay explicit `@Public()`. C1/C2/C3 may remain authenticated-any-role where the matrix says Yes for all four roles. C4+ must declare allowed roles.

---

## Control-by-control (S02 only)

### Authorization & RBAC

| Rule               | S02 requirement                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Roles              | Reuse `Role`: Reader, Researcher, Trader, Admin. No fifth role.                                                    |
| Decision owner     | Existing Auth authorization (`RolesGuard`, `CommandAuthorizationService` extended in place). Not a new IAM module. |
| Role store         | Identity `User.role` remains Source of Truth for the role value.                                                   |
| Membership         | Workspace `WorkspaceAccessService`. No second membership.                                                          |
| Hint vs truth      | JWT `role` hint only. Identity re-resolved per request (S01 session path kept).                                    |
| Admin vs Gate/Risk | Admin cannot skip Gate or Risk. No override API.                                                                   |
| Live               | Not authorized as a product. Default-deny live mutations.                                                          |
| ABAC               | Do not build an engine. Live attributes stay later owners.                                                         |
| TD-006             | Remaining in-scope runtime/product HTTP surfaces use the same model.                                               |

### Least Privilege

- Default new user remains **Researcher**.
- This package is the owner of role assignment (checklist item 17).
- People list/assign is **Admin only**.
- Vault list/plaintext, connection wizards, billing, API keys: not this package and not granted here.

### Zero Trust

- Every non-public API this package adds is authenticated (S01 session).
- Workspace id is not trusted from the client.
- Network location is not a role.

### Audit (not the S05 product)

Keep structured events S05 can later persist: role assigned (actor, subject, from, to, workspace id when known), authorization denied on C6, last-Admin refusal. **No** passwords, tokens, hashes.

### Secure by Default

- No Admin-by-register.
- No debug prefill of seed Admin on People or login (keep PC-18 / S01).
- Live remains off. Integrations remain disconnected.

---

## Security checklist (planning intent)

| #   | Control                    | Verdict            | Evidence or owner                                                                                                                                             | Action |
| --- | -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Authentication             | **PASS**           | S02 exposes no new public routes except none. People and role APIs are authenticated. Disabled users fail closed via S01. Passwordless not added.             |        |
| 2   | Authorization              | **PASS**           | This package’s primary control. Server-side role + workspace. JWT hint. No ABAC engine. Admin cannot skip Gate/Risk.                                          |        |
| 3   | OWASP Top 10 review        | **PASS**           | Worksheet below. Broken access control is in scope. SSRF/crypto/vault not owned here.                                                                         |        |
| 4   | Input validation           | **PASS**           | Role assignment body: canonical `Role` enum only. User ids canonical. Unknown fields rejected on these APIs. No money types.                                  |        |
| 5   | Output encoding            | **PASS**           | React defaults on People UI. JSON does not reflect HTML. No secrets in responses.                                                                             |        |
| 6   | Session review             | **NOT APPLICABLE** | Consumes S01 sessions; does not issue, refresh, or revoke. Auth sessions ≠ trading sessions. Owner: **V3-S01**.                                               |        |
| 7   | Credential review          | **NOT APPLICABLE** | S02 does not touch passwords, bcrypt, reset, or refresh secrets. Owner: **V3-S01**.                                                                           |        |
| 8   | Secret storage             | **NOT APPLICABLE** | No vendor secrets. Owner: **V3-S03**.                                                                                                                         |        |
| 9   | Rate limiting              | **PASS**           | Do not remove global Fastify/Throttler limits. People APIs are authenticated; platform tightening remains **V3-S04**.                                         |        |
| 10  | Replay protection          | **NOT APPLICABLE** | No new tokens. Session replay: **V3-S01**. Live place/cancel: **V3-L05**.                                                                                     |        |
| 11  | CSRF                       | **PASS**           | Mutating People/role APIs use the S01 cookie session transport. SameSite=Strict **and** existing CSRF guard apply; do not add a cookie mutation without CSRF. |        |
| 12  | XSS                        | **PASS**           | People UI keeps React encoding. Session transport already S01 (no access token in JS storage at S01 exit). Platform CSP product: **V3-S04**.                  |        |
| 13  | Injection review           | **PASS**           | Prisma parameterized access for Identity role updates. No string-built SQL. Role values are enum, not concatenated queries.                                   |        |
| 14  | Logging review             | **PASS**           | Role change and C6 deny: actor, subject, outcome, workspace. No passwords, tokens, hashes.                                                                    |        |
| 15  | Audit review               | **PASS**           | Attributable role changes. Does **not** claim SEC-09 product. Owner of audit product: **V3-S05**.                                                             |        |
| 16  | Error leakage review       | **PASS**           | Non-Admin People: forbidden, not a leaky empty list of all emails. Unknown user: no cross-workspace oracle. No stack traces to customers.                     |        |
| 17  | Permission review          | **PASS**           | This **is** V3-S02. Default Researcher. No extra privilege as convenience. Role assignment owned here.                                                        |        |
| 18  | Workspace isolation        | **PASS**           | Membership remains Workspace. Role assignment does not add members. Must not punch a hole; isolation **product** tests: **V3-S06**.                           |        |
| 19  | Financial Integrity review | **PASS**           | Ledger untouched. No silent balance edits. Canonical Order Path not duplicated. Live orders not enabled.                                                      |        |
| 20  | Secure-by-default review   | **PASS**           | No Admin-by-register; live off; no fake Connected; seed not the customer Admin path.                                                                          |        |
| 21  | Zero Trust review          | **PASS**           | New APIs authenticated. Workspace membership server-side. Live enablement not a hidden UI flag (not shipped).                                                 |        |
| 22  | Least Privilege review     | **PASS**           | Default-deny matrix. Admin is people/policy, not Gate/Risk bypass. Telegram not a control plane (untouched).                                                  |        |
| 23  | AI safety review           | **NOT APPLICABLE** | Package does not touch AI.                                                                                                                                    |        |
| 24  | Connection security review | **NOT APPLICABLE** | Package does not touch connections. Keep existing Trader/Admin gate on adapter connect; no wizard. Owner: Wave 2.                                             |        |

---

## OWASP Top 10 worksheet

| OWASP class                                | Verdict            | Notes / owner                                                                |
| ------------------------------------------ | ------------------ | ---------------------------------------------------------------------------- |
| Broken access control                      | **PASS**           | Primary S02 class: vertical, horizontal, escalation, default-deny.           |
| Cryptographic failures                     | **NOT APPLICABLE** | No new crypto. Credentials **V3-S01**. Vault **V3-S03**.                     |
| Injection                                  | **PASS**           | Enum role + Prisma.                                                          |
| Insecure design                            | **PASS**           | No inheritance engine; no Admin-as-bypass; no new SoT.                       |
| Security misconfiguration                  | **NOT APPLICABLE** | Platform CSP/helmet product **V3-S04**. S02 must not weaken S01 cookie/CSRF. |
| Vulnerable and outdated components         | **NOT APPLICABLE** | No new framework. Platform review **V3-S04**.                                |
| Identification and authentication failures | **NOT APPLICABLE** | Authn **V3-S01**. S02 must not add public auth routes.                       |
| Software and data integrity failures       | **PASS**           | Role store remains Identity; UI not SoT.                                     |
| Security logging and monitoring failures   | **PASS**           | Structured role-change events; audit **product** **V3-S05**.                 |
| Server-side request forgery (SSRF)         | **NOT APPLICABLE** | No customer URLs. **V3-S04** / Wave 2 webhooks.                              |

---

## Threat Review (lightweight STRIDE)

| Category                   | What PASS requires (this package)                                             | Verdict  | Notes / owner                                                                |
| -------------------------- | ----------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| **Spoofing**               | Attacker cannot pretend to be an operator on People/role APIs.                | **PASS** | Authenticated S01 session required. Public routes unchanged.                 |
| **Tampering**              | Client cannot alter role/membership in a way the server honors.               | **PASS** | Identity persists role; Workspace persists membership; JWT role not trusted. |
| **Repudiation**            | Role assignment and C6 deny are attributable.                                 | **PASS** | Structured events. Audit product is **V3-S05**.                              |
| **Information Disclosure** | No secrets; People is Admin-only; errors do not enumerate foreign workspaces. | **PASS** | Projection omits credentials and tokens.                                     |
| **Denial of Service**      | Expensive unbounded People work considered.                                   | **PASS** | Authenticated Admin list; existing global throttle. Platform/IP: **V3-S04**. |
| **Elevation of Privilege** | No Admin/live/workspace power as convenience. Default-deny.                   | **PASS** | Primary STRIDE row for S02. C7/C8/C9 closed. Last-Admin protected.           |

---

## Timing Assessment

**Could observable timing reveal protected information?** Assessment only. Do not add dummy sleeps.

| Surface                                   | What PASS requires (this package)                                                                                                  | Verdict            | Notes / owner                                                                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**                        | Known vs unknown identity timing on auth surfaces.                                                                                 | **NOT APPLICABLE** | **V3-S01**. S02 does not own login/recover.                                                                                                                                           |
| **Credential validation**                 | Password compare timing.                                                                                                           | **NOT APPLICABLE** | **V3-S01**.                                                                                                                                                                           |
| **Recovery flow**                         | Recovery enumeration timing.                                                                                                       | **NOT APPLICABLE** | **V3-S01**.                                                                                                                                                                           |
| **Session validation**                    | Valid/invalid/revoked session timing.                                                                                              | **NOT APPLICABLE** | **V3-S01**.                                                                                                                                                                           |
| **People / role lookup** _(this package)_ | Timing must not be a practical oracle for whether a user id exists **across workspaces** beyond the Admin-only product disclosure. | **PASS**           | Admin People is allowed to list operators the Admin may administer. Non-Admin receives forbidden without a distinct “exists” vs “not exists” body. Unknown-id assign fails uniformly. |

---

## Abuse Assessment

| Category                | What PASS requires (this package)          | Verdict            | Notes / owner                                                                 |
| ----------------------- | ------------------------------------------ | ------------------ | ----------------------------------------------------------------------------- |
| **Credential stuffing** | Auth surfaces.                             | **NOT APPLICABLE** | **V3-S01** lockout.                                                           |
| **Brute force**         | Secret guessing.                           | **NOT APPLICABLE** | **V3-S01**. Role enum is not a secret to brute.                               |
| **Enumeration**         | User existence not disclosed to non-Admin. | **PASS**           | C6 forbidden for non-Admin. Admin list is the product disclosure.             |
| **Replay attempts**     | Token replay.                              | **NOT APPLICABLE** | Session replay **V3-S01**. No new tokens.                                     |
| **Resource exhaustion** | Unbounded People list/assign.              | **PASS**           | Authenticated Admin; existing global limits; no unbounded fan-out.            |
| **Automation abuse**    | Scripted role grants.                      | **PASS**           | Requires Admin session. Not a public surface. Platform tightening **V3-S04**. |
| **Distributed attacks** | Edge / IP.                                 | **NOT APPLICABLE** | **V3-S04** / host infrastructure.                                             |

---

## Controls explicitly not this package

| Control                                                  | Owner            |
| -------------------------------------------------------- | ---------------- |
| Password, lockout, sessions, recovery                    | V3-S01 (CLOSED)  |
| Credential Vault / encryption                            | V3-S03           |
| Platform CSP, helmet, global OWASP, SSRF allowlists      | V3-S04           |
| Append-only audit product                                | V3-S05           |
| Isolation test suite as a product                        | V3-S06           |
| Connection wizards                                       | Wave 2           |
| Exchange permission verification                         | Wave 4           |
| MFA for live                                             | Wave 6           |
| Live-order replay / financial action log                 | V3-L05 / V3-L03  |
| Kill Switch product                                      | V3-O04           |
| Team invites / disable-user product / API keys / billing | Wave 9           |
| ABAC engine                                              | Out of Version 3 |

---

## Security exit for this package

S02 security is done when:

1. Only Admin can assign roles. Self-escalation fails.
2. Reader / Researcher / Trader cannot perform a higher class’s actions (vertical).
3. Role assignment does not grant foreign workspace membership (horizontal).
4. Default-deny holds on in-scope mutating/sensitive routes (no allow-by-omission).
5. No role inheritance engine. No fifth role. Admin cannot skip Gate/Risk.
6. Live, vault, connections, billing, and API keys are not authorized as this product.
7. Register remains Researcher. Last Active Admin cannot be removed.
8. Role-change events are structured and contain no secrets.

---

**STOP.** Planning security review only. Do not implement RBAC until the Implementation Package is **Approved**.
