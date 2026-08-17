# V3-S02 RBAC Product — Implementation Package

```text
Package:            V3-S02
Name:               RBAC Product
Wave:               1 — Security Foundation
Capabilities:       SEC-02, SEC-03
Date:               2026-08-16
Status:             Implementation Package
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision.
Canon:              version-3-master-plan.md
```

**Process:** [`version-3-implementation-policy.md`](./version-3-implementation-policy.md)
**Template:** [`version-3-package-template.md`](./version-3-package-template.md)
**Governance:** [`version-3-governance-freeze.md`](./version-3-governance-freeze.md)
**Annexes used (read-only):** Execution Roadmap, Security Vision, Capability Inventory, Product Roadmap.

**Companions:**

| Document                                                   | Role                                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`v3-s02-product-scope.md`](./v3-s02-product-scope.md)     | IN / OUT, roles, permission model, workspace ownership, customer acceptance |
| [`v3-s02-security-review.md`](./v3-s02-security-review.md) | Security Vision applied to S02 (planning)                                   |
| [`v3-s02-validation-plan.md`](./v3-s02-validation-plan.md) | How Close is proven                                                         |

**Prerequisite:** [`v3-s01-close-report.md`](./v3-s01-close-report.md) — V3-S01 Authentication & Session is **CLOSED**. Authentication Capability Map is accepted.

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES.** Scope, owners, and exit criteria are already in the frozen Master Plan. This package only sequences work inside that freeze. Version 2 remains certified. The Master Plan is not modified.

```text
RBAC governs WHO may perform an action.

It does NOT replace Authentication.
It does NOT manage credentials.
It does NOT manage exchange permissions.
It does NOT introduce a new Source of Truth.
```

**STOP.** Do not write production code until this package is **Approved**.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package   ← YOU ARE HERE
        ↓
Review
        ↓
Approval                 ← required before code
        ↓
Implementation           ← S02-a … S02-e only
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
Close                    → then V3-S03 Implementation Package
```

Do not skip a stage. Do not start V3-S03 until this package is **Closed**. The next package opens at **Implementation Package**, not at code.

---

## Overview

V3-S02 is the Wave 1 Security Foundation package that productizes authorization. Authentication already proves who the operator is (S01 CLOSED). This package decides **what that operator may do**, using the existing Identity roles and Workspace membership, so an administrator can assign Reader / Researcher / Trader / Admin in the product and an operator cannot perform another role’s actions.

| Field                                | Value                                        |
| ------------------------------------ | -------------------------------------------- |
| Package ID                           | V3-S02                                       |
| Master Plan / Execution Roadmap name | RBAC Product                                 |
| Wave                                 | 1 — Security Foundation                      |
| Capabilities (inventory IDs)         | SEC-02 Authorization, SEC-03 RBAC            |
| Complexity                           | M                                            |
| Previous package                     | V3-S01 Authentication & Session (**CLOSED**) |
| Next package                         | V3-S03 Secret Vault & Encryption             |

---

## Authorization Philosophy

This section is binding for every later authorization decision in Version 3. Slices, reviews, and later packages that reuse this model do not weaken it.

```text
Everything is forbidden unless explicitly allowed.
Permissions are additive.
Roles never bypass ownership.
Ownership always wins.
Authorization never creates resources.
Authorization only decides whether an already requested action may continue.
RBAC never changes business logic.
RBAC never owns identity.
RBAC never owns sessions.
```

| Principle                                      | Meaning                                                                                                                                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default Deny**                               | An action proceeds only when the permission model names it for that role **and** ownership holds. Silence is not a grant.                                                                                            |
| **Least Privilege**                            | Default new user is Researcher. No extra privilege as convenience. Admin is people and policy, not unrestricted access.                                                                                              |
| **Explicit Allow**                             | A permission exists only when this package (or a later approved package) lists it. No “authenticated means allowed.”                                                                                                 |
| **Ownership Always Wins**                      | Workspace membership (Workspace) and resource ownership stay with their owners. A role never substitutes for membership.                                                                                             |
| **Permissions Are Additive**                   | A role receives only the allows listed for it. There is no inheritance engine (`Admin` is not silently `Trader` plus extras). Where Admin may also issue paper commands, that is an explicit allow, not a hierarchy. |
| **No Implicit Access**                         | Missing `@Roles`, a UI hide, a JWT `role` hint, or “the user is signed in” is not authorization.                                                                                                                     |
| **Authorization Never Creates Resources**      | RBAC does not create users, workspaces, sessions, orders, or memberships. It does not invite, provision, or persist a second people store.                                                                           |
| **Authorization Never Owns Identity**          | Identity owns profile, role value, and status. RBAC reads the role; it does not become Identity.                                                                                                                     |
| **Authorization Never Owns Sessions**          | Authentication owns credentials and sessions (V3-S01 CLOSED). RBAC consumes an already proven session.                                                                                                               |
| **Authorization Never Changes Business Logic** | Gate, Risk, Library, Ledger, and other domain rules still apply after allow. An allow is not a Gate pass, a fill, or a live enablement.                                                                              |

Fail closed:

```text
Unknown role          →  Denied
Unknown permission    →  Denied
Unknown action        →  Denied
Missing permission    →  Denied
```

Authorization decides **whether an already requested action may continue**. It does not start the action, invent the resource, or replace the domain owner that executes it.

---

## Business Goal

- **Goal:** Least privilege becomes a customer product. Teams (and solo operators) can separate research from capital-adjacent paper commands without sharing an Admin password or inventing a new IAM platform.
- **Master Plan reference:** §7 Least Privilege; §14 Wave 1 “An admin can give me a role; I cannot perform another role’s actions.”; Execution Roadmap Wave 1 S02; Security Vision §4 Authorization & RBAC; Product Roadmap **J3-02**.
- **Metric this package must meet or not regress (Master Plan §6):** time to register **< 2 min**; time to secure login **< 30 s**; credential exposure **0**; cross-workspace leak via this package **0**; default misconfig / convenience privilege **0 tolerated**.

---

## Customer Problem

- **Problem:** After S01, each operator can have their own account and session, but privilege is still tribal. Roles exist in code. Becoming Trader or Admin means sharing seed credentials, editing the database, or leaving every authenticated user able to hit surfaces that never received `@Roles` (TD-006 remainder). A Reader is not a real product contract.
- **Who feels it:** Workspace administrator (cannot assign least privilege in the UI); researcher (must share Admin to run paper); operator (cannot be limited to projections); the business (no separation of research vs capital-adjacent actions before vault and live).
- **What they must do today that they should not:** SSH, SQL `User.role` updates, shared `admin@trp.local`, or hope that missing `@Roles` is “fine because we trust the team.”

---

## Business Value

- **Value delivered at Close:** An Admin assigns Reader / Researcher / Trader / Admin in the product. Those roles bind server-side. Operators do not share passwords to change privilege. Authentication remains the login product. Workspace remains the membership product.
- **What remains blocked until later packages:** Encrypted customer secrets (S03); platform OWASP (S04); audit product (S05); isolation suite (S06); connections (Wave 2); live authorization (Wave 6); teammate invites and disable-user (Wave 9). Wave 1 does **not** exit at S02 Close.

---

## Current State

Honest Version 2 / S01 facts. Reuse the pattern: Already exists / Needs extension / Missing / Out of this package.

| Capability or surface                        | Status                       | Evidence (owners, files, certified PC/US if known)                                                                                            |
| -------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**                           | Already exists (CLOSED)      | V3-S01: register, login, lockout, sessions, recovery. `AuthModule`, cookies, CSRF.                                                            |
| **Identity role store**                      | Already exists               | `Role` enum; `User.role`; `UserDomainService` default Researcher; Prisma mapping `ADMINISTRATOR` / `RESEARCHER` / `TRADER` / `VIEWER`. PC-18. |
| **Role assignment product**                  | Missing                      | `UserDomainService.update` can set `role` with **no** HTTP People API and **no** Admin gate.                                                  |
| **Authorization (trading)**                  | Needs extension              | `CommandAuthorizationService`: Trader or Admin + workspace membership (US158).                                                                |
| **RolesGuard**                               | Needs extension              | Enforces `@Roles` when present; **allows any authenticated user when metadata is missing** (allow-by-omission).                               |
| **Trading HTTP gates**                       | Already exists (partial)     | Orchestrator, orders, paper account, session commands, deployment, exchange-adapter connect: `@Roles(Trader, Admin)`.                         |
| **Remaining surfaces (TD-006)**              | Needs extension              | Research, certification, campaigns, live controller, many mutating routes: authenticated but not role-classified.                             |
| **Workspace membership**                     | Already exists               | PC-14: owner + Active. `WorkspaceAccessService`. No member table.                                                                             |
| **People UI**                                | Missing                      | Administration band has Sessions and Password; no People.                                                                                     |
| **JWT role**                                 | Already exists (hint)        | Payload includes `role`; `JwtStrategy.validate` re-loads session + Identity (`resolveSessionAuthUser`).                                       |
| **Admin probe route**                        | Already exists (not product) | `GET /v1/auth/admin` returns `{ message: 'admin ok' }` — not People.                                                                          |
| **Live authorization**                       | Out of this package          | Live UI off. Live controller exists without a customer live product. S02 default-denies live mutations; Wave 6 owns live authz.               |
| **Vault / connections / billing / API keys** | Out of this package          | Later waves.                                                                                                                                  |
| **ABAC**                                     | Out of Version 3             | Security Vision: not justified as an engine.                                                                                                  |
| **First Admin**                              | Engineer bootstrap           | `prisma/seed.ts` Admin. Not the customer path (PC-18 / S01).                                                                                  |

Facts implementers must not forget:

- Identity is password-free. Authentication owns credentials and sessions. Do not move passwords into Identity or roles into Authentication.
- Workspace membership is owner-only until Wave 9. Assigning a role does **not** invite someone into a workspace.
- Default register role is Researcher. Do not change that to Admin.
- Admin today may issue paper trading commands (US158). Keep that as an **explicit matrix cell**, not inheritance.
- `RolesGuard` allow-by-omission is the TD-006 gap. Closing it must not break certified Researcher research journeys or Trader paper journeys.

---

## Reuse from Version 2

Map to Master Plan §10. Do not redesign certified subsystems.

| Stance                                                                                    | This package                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reuse unchanged                                                                           | Strategy Library, Certification, Qualification, Market Profile, Orchestrator (`createsSession` false), paper Execution Adapter, Knowledge Lake, Reporting, AI Analytics (local), Ledger, Risk Engine, Gate as authorities |
| Minor extension                                                                           | Product HTTP controllers that receive `@Roles` / command authorization they lacked (same owners, same routes)                                                                                                             |
| Major extension                                                                           | Identity/Auth — role **product** and complete authorization surface (Master Plan §10 already names Identity/Auth as major extension)                                                                                      |
| New justified (only if Master Plan already named it)                                      | **Nothing.** Credential Vault is V3-S03. Connection Management facade is Wave 2. Billing is Wave 9. RBAC is **not** a new bounded context.                                                                                |
| Replace (must be **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, Library) | **Nothing**                                                                                                                                                                                                               |

Owner from Master Plan §11:

| Area                                   | Owner                                                              | This package must not own                      |
| -------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| Authentication (credentials, sessions) | Authentication                                                     | Login, recovery, session issue/revoke          |
| Identity (profile, **role**, status)   | Identity                                                           | Passwords, workspace aggregate                 |
| Authorization **decision**             | Auth module in place (`RolesGuard`, `CommandAuthorizationService`) | A new IAM bounded context; a second role store |
| Workspace aggregate and membership     | Workspace                                                          | Role values; credentials                       |
| Money                                  | Ledger                                                             | —                                              |
| Risk / Gate                            | Risk Engine / Gate                                                 | Admin bypass                                   |
| Vault                                  | Vault module (S03)                                                 | —                                              |
| Connections                            | Connection Management facade (Wave 2)                              | Exchange permissions                           |
| Live policy enablement                 | Admin + ADR (Wave 6)                                               | Trader self-serve live                         |

---

## Dependencies

| Dependency                                                                         | Kind                | Status required before this package |
| ---------------------------------------------------------------------------------- | ------------------- | ----------------------------------- |
| Version 2 Identity (PC-18)                                                         | Version 2 product   | Exists                              |
| Version 2 Workspace (PC-14)                                                        | Version 2 product   | Exists                              |
| `Role` enum, `RolesGuard`, `CommandAuthorizationService`, `WorkspaceAccessService` | Version 2 product   | Exists                              |
| V3-S01 Authentication & Session                                                    | Earlier V3 package  | **Closed**                          |
| Host JWT / DB                                                                      | Host infrastructure | Host-operated                       |

This package does **not** depend on:

- Credential Vault (V3-S03)
- Connection Management (Wave 2)
- Email Notification product (V3-N02)
- Audit product (V3-S05)
- Isolation suite (V3-S06)
- Live-capital ADR (Wave 6)
- Wave 9 teams / billing / API keys

---

## Implementation Scope

Detail: [`v3-s02-product-scope.md`](./v3-s02-product-scope.md).

### IN Scope

| Item                                               | Customer meaning                                                  | Notes / owner inside existing domain                                 |
| -------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| Permission model (C0–C9)                           | Who may do which class of action                                  | Authz decision in existing Auth; Identity role; Workspace membership |
| Default-deny on in-scope mutating/sensitive routes | Missing `@Roles` is not a grant for C4+                           | Extend `RolesGuard` usage / command authorization in place           |
| Role assignment                                    | Admin sets Reader / Researcher / Trader / Admin                   | Identity persists `User.role`                                        |
| People product                                     | Admin sees operators and assigns roles in the UI                  | Projection; existing shell Administration band                       |
| Least-privilege defaults                           | Register remains Researcher                                       | Identity                                                             |
| Last-Admin protection                              | Cannot leave zero Active Admins                                   | Authz + Identity update                                              |
| TD-006 remainder (in-scope surfaces)               | Remaining product HTTP uses the same model                        | Existing controllers; no second gate                                 |
| Vertical / horizontal access                       | Cannot act as another role; cannot use role as foreign membership | Tests + Workspace unchanged                                          |
| Authorization events                               | Structured role-change / C6 deny logs                             | For S05; not audit product                                           |
| Keep workspace header authorization                | `X-Workspace-Id` server-checked                                   | Workspace                                                            |

### OUT OF Scope

| Item                                                    | Why out              | Owner later (or Master Plan deferral) |
| ------------------------------------------------------- | -------------------- | ------------------------------------- |
| Credential Vault                                        | Explicitly out       | **V3-S03**                            |
| Connection Management                                   | Explicitly out       | Wave 2                                |
| Exchange permissions                                    | Explicitly out       | Wave 4                                |
| Billing                                                 | Explicitly out       | Wave 9                                |
| API keys                                                | Explicitly out       | Wave 9                                |
| Live Trading authorization                              | Explicitly out       | Wave 6                                |
| Authentication / credentials / sessions                 | Does not replace S01 | **V3-S01** CLOSED                     |
| Team invites / shared membership / disable-user product | SaaS                 | Wave 9                                |
| Platform admin console                                  | Administration group | Wave 9                                |
| ABAC engine                                             | Not justified        | Out of Version 3                      |
| New IAM bounded context / new people SoT                | Forbidden            | —                                     |
| MFA, OAuth, passkeys                                    | Not S02              | Wave 6 / not planned                  |
| Audit product, OWASP product, isolation product         | Later Wave 1         | S04 / S05 / S06                       |
| Gate/Risk bypass                                        | Forbidden            | —                                     |
| Engineer seed as customer Admin path                    | Host bootstrap only  | —                                     |

Nothing in IN Scope may be invented. If a desired item is not in the Master Plan, **stop**.

---

## Product Acceptance Criteria

Detail: [`v3-s02-product-scope.md`](./v3-s02-product-scope.md). Copy and complete [`version-3-product-checklist.md`](./version-3-product-checklist.md) at Close.

| #   | Outcome                                                                    | Fail if                                          |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | Admin assigns Reader / Researcher / Trader / Admin in the product          | SSH, customer `.env`, or SQL required            |
| 2   | Reader is projections-only                                                 | Reader researches, papers, or assigns roles      |
| 3   | Researcher researches/certifies; cannot paper-command or assign roles      | Researcher starts paper or opens People as Admin |
| 4   | Trader issues paper commands; cannot assign roles or live-trade as product | Trader escalates; live UI appears                |
| 5   | Admin cannot skip Gate or Risk                                             | Override API or UI                               |
| 6   | Register remains Researcher; S01 login/recovery unregressed                | Admin-by-register                                |
| 7   | Last Active Admin cannot be demoted                                        | Zero Admins possible                             |
| 8   | Non-Admin cannot enumerate operators or change roles                       | Directory leak; self-escalation                  |
| 9   | No vault, connections, billing, API keys, live UI                          | Later package leaked                             |
| 10  | Certified paper-first journeys still work for the roles that own them      | J-01…J-14 broken                                 |

The customer never uses SSH, customer `.env`, or manual database edits for these journeys.

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.** Planning records the script now. Execution is **NOT APPLICABLE** until the product exists.

```text
RBAC Walkthrough (J3-02)

□ Sign in as Administrator (host-bootstrap Admin; form is not prefilled)
□ Open People in the signed-in shell
□ See operators and current roles
□ Assign Reader to an operator
□ Sign in as that Reader
□ Confirm projections are available
□ Confirm research / paper start is refused
□ Assign Researcher; confirm research works and paper start is refused
□ Assign Trader; confirm paper commands work and role assign is refused
□ As Trader, attempt to assign Admin to self — refused
□ As Admin, attempt to demote the last Administrator — refused
□ Confirm Gate / Risk still bind
□ Confirm no live trading, vault, connections, billing, or API keys
□ Tokens and passwords never exposed

PASS / NOT APPLICABLE / REQUIRES ACTION
```

Refresh-token reuse → family revoke is **NOT APPLICABLE**: this package does not issue or refresh sessions. Owner: **V3-S01**.

| Field                   | Value                                                        |
| ----------------------- | ------------------------------------------------------------ |
| Walkthrough name        | RBAC Walkthrough (J3-02)                                     |
| Executed in the product | **NOT APPLICABLE** (Implementation Package — no product yet) |
| Overall                 | **NOT APPLICABLE** until Product Review / Close              |

---

## Architecture Review

**Fill at package time (intent).** Copy and complete [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md) again at Close (evidence).

### Package identity (intent)

| Field                            | Value                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| Package                          | V3-S02                                                                                     |
| Wave                             | 1 — Security Foundation                                                                    |
| Existing owner (Master Plan §11) | Authorization decision: Auth module in place. Role value: Identity. Membership: Workspace. |
| Stage                            | Implementation Package                                                                     |

### 1. No ownership drift (intent)

| Check                                                                               | Verdict            | Evidence                                                                                                    |
| ----------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Work landed in the named owner                                                      | **PASS**           | Authz in `RolesGuard` / `CommandAuthorizationService`; role persist in Identity; membership stays Workspace |
| Identity remains profile/role/status; Authentication remains credentials/sessions   | **PASS**           | S02 does not take sessions or passwords. Role assignment is Identity write + Authz gate                     |
| Ledger / Risk / Gate / Library / Workspace aggregate not given new competing owners | **PASS**           | Unchanged SoT                                                                                               |
| Notification Delivery / Telegram                                                    | **NOT APPLICABLE** | Not touched                                                                                                 |
| UI is not Source of Truth                                                           | **PASS**           | People is a projection                                                                                      |
| HTTP remains transport                                                              | **PASS**           | New People/role routes transport Identity + Authz                                                           |

**Must not own:** Authentication credentials/sessions; Workspace membership model; Vault; Connections; Ledger; Gate/Risk decisions; live enablement.

### 2. No duplicate bounded context (intent)

| Check                                                           | Verdict  | Evidence                                                                               |
| --------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| No second authentication, vault, ledger, or order path          | **PASS** | Forbidden                                                                              |
| No new bounded context unless Master Plan named it              | **PASS** | RBAC is not Vault / Connection facade / Billing. No IAM context.                       |
| Persistence/ports added only inside an existing owner           | **PASS** | No new role SoT table. Optional HTTP DTOs only. Identity `User.role` already persists. |
| Trading Session / SessionRecovery* not reused as login sessions | **PASS** | Untouched                                                                              |

**New context claimed?** None.

### 3. No duplicate Source of Truth (intent)

| Check                                                           | Verdict  | Evidence                                            |
| --------------------------------------------------------------- | -------- | --------------------------------------------------- |
| Money remains Ledger                                            | **PASS** | Untouched                                           |
| Certification / Gate / Library not cloned                       | **PASS** | Untouched                                           |
| No parallel mechanism for risk, lifecycle, or identity profiles | **PASS** | One `User.role`. No per-workspace role store in S02 |
| Projections remain projections                                  | **PASS** | People UI                                           |

### 4. Master Plan respected (intent)

| Check                                   | Verdict  | Evidence                                                 |
| --------------------------------------- | -------- | -------------------------------------------------------- |
| Package ID, wave, capabilities match    | **PASS** | V3-S02, Wave 1, SEC-02 / SEC-03                          |
| IN Scope is a subset of the plan        | **PASS** | J3-02; Wave 1 admin-assigns-role line                    |
| OUT OF Scope names the real later owner | **PASS** | Vault S03; connections Wave 2; live Wave 6; teams Wave 9 |
| Live capital not authorized             | **PASS** | C7 deny                                                  |
| Stop rather than patch planning         | **PASS** | Membership stays owner-only; no invented invites         |

### 5. Product Principles respected (intent)

| Principle                    | Verdict            | Evidence (one line)                                        |
| ---------------------------- | ------------------ | ---------------------------------------------------------- |
| Customer First               | **PASS**           | People UI; no SSH/SQL for role grant                       |
| Security Before Convenience  | **PASS**           | Default-deny; no Admin-by-register                         |
| One Source of Truth          | **PASS**           | Identity role; Workspace membership; Authz decides only    |
| Paper First                  | **PASS**           | Paper commands stay Trader/Admin; live off                 |
| Live Must Be Earned          | **PASS**           | Not authorized here                                        |
| Honest Product               | **PASS**           | People is not invites; seed is not the customer Admin path |
| AI Never Controls Capital    | **NOT APPLICABLE** | Untouched                                                  |
| Everything Is Auditable      | **PASS**           | Structured role-change events; audit product is S05        |
| No Hidden Configuration      | **PASS**           | Roles assigned in product, not `.env`                      |
| Architecture Is a Constraint | **PASS**           | No new context; no Spec edit                               |

### 6. Dependencies unchanged (intent)

| Check                                              | Verdict  | Evidence                           |
| -------------------------------------------------- | -------- | ---------------------------------- |
| Depends only on certified V2 and Closed earlier V3 | **PASS** | PC-14, PC-18, S01 Closed           |
| No later-wave dependency                           | **PASS** | No vault, connections, live ADR    |
| Does not require Master Plan or Spec change        | **PASS** | Planning question YES              |
| Reuse table honored                                | **PASS** | Major extension Identity/Auth only |

**Dependencies used:** PC-18, PC-14, S01, existing Role / guards / command authz.
**Dependencies refused:** S03–S06, Wave 2+, Wave 9.

### 7. Architecture impact justified (intent)

| Check                                                                 | Verdict  | Evidence                                        |
| --------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| Schema/module/port additions required by named outcome                | **PASS** | HTTP + UI for J3-02; no new SoT schema required |
| Extension of existing owner, not platform rewrite                     | **PASS** | In-place Authz + Identity                       |
| Canonical Order Path, Ledger, Runtime evaluator, Library not replaced | **PASS** | Untouched                                       |
| Spec v2.0 / Matrix / Alias unchanged                                  | **PASS** | No ADR. No RC.                                  |

**Justified additions (list):** Admin-only People/role HTTP as transport over Identity; permission matrix applied to existing routes; People page projection in existing shell.

**Unjustified ideas rejected:** New RBAC bounded context; per-workspace Role table; membership/invite product; ABAC engine; Admin Gate bypass; live authz; vault; connection permissions.

### 8. No hidden redesign (intent)

| Check                                          | Verdict  | Evidence                                   |
| ---------------------------------------------- | -------- | ------------------------------------------ |
| No Version 2.1 rewrite                         | **PASS** | —                                          |
| No new IAM / SOC / order engine / ABAC product | **PASS** | Explicitly refused                         |
| No Version 2-style RC track                    | **PASS** | —                                          |
| No ADR except named future live-capital ADR    | **PASS** | —                                          |
| No silent Master Plan edit                     | **PASS** | This package does not edit the Master Plan |
| Certified V2 products not rebuilt              | **PASS** | Maintain                                   |

Summary (must match the checklist):

| Rule                                                           | Decision                                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| No new bounded context unless the Master Plan already named it | **None.** RBAC is authorization decisions inside existing Auth + Identity + Workspace.                          |
| No ownership drift                                             | Authentication keeps credentials/sessions. Identity keeps role. Workspace keeps membership. Authz decides only. |
| No duplicate Source of Truth                                   | No second people/role store.                                                                                    |
| HTTP remains transport; UI remains not Source of Truth         | People page is a projection.                                                                                    |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | Unchanged.                                                                                                      |
| Justified persistence/ports inside an existing owner           | HTTP/UI only unless Identity already persists role (it does).                                                   |

Forbidden: duplicate auth, vault, ledger, or order path; hidden redesign; Version 2-style RC track.

---

## Security Review

Detail: [`v3-s02-security-review.md`](./v3-s02-security-review.md). Copy and complete [`version-3-security-checklist.md`](./version-3-security-checklist.md) again at Close.

Planning STRIDE:

| Category               | Verdict                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Spoofing               | **PASS** (intent) — S01 session on People/role APIs                                |
| Tampering              | **PASS** (intent) — Identity + Workspace not client-honored; JWT role is a hint    |
| Repudiation            | **PASS** (intent) — structured role-change events; audit product is S05            |
| Information Disclosure | **PASS** (intent) — Admin-only People; no secrets                                  |
| Denial of Service      | **PASS** (intent) — authenticated Admin; global throttle kept; platform DoS is S04 |
| Elevation of Privilege | **PASS** (intent) — primary control; default-deny; no live/Admin-by-register       |

Threats this package must reduce:

| Threat (from Security Vision / this package)   | Control in this package                                   |
| ---------------------------------------------- | --------------------------------------------------------- |
| Privilege escalation                           | Admin-only assign; no self-escalate; Identity re-resolved |
| Horizontal access                              | Role ≠ membership; People Admin-only                      |
| Vertical access                                | Matrix C4–C7                                              |
| Permission inheritance                         | No inheritance engine                                     |
| Role confusion                                 | Four roles; Admin ≠ Gate/Risk bypass                      |
| Default-deny                                   | Classify C4+ routes; stop allow-by-omission               |
| Financial fraud (paper commands by Researcher) | C5 Trader/Admin only                                      |
| Shared Admin password                          | People product                                            |

Controls explicitly **not** this package (name the owning `V3-*` ID):

| Control                               | Owner            |
| ------------------------------------- | ---------------- |
| Authentication, sessions, credentials | V3-S01           |
| Vault / encryption                    | V3-S03           |
| Platform OWASP / CSP / SSRF           | V3-S04           |
| Audit product                         | V3-S05           |
| Isolation product                     | V3-S06           |
| Connections / exchange permissions    | Wave 2 / Wave 4  |
| Live MFA / live authz                 | Wave 6           |
| ABAC engine                           | Out of Version 3 |

A package cannot Close while any checklist item **or Threat Review row** is **REQUIRES ACTION**.

---

## Implementation Slices

Do not implement in the Implementation Package task. Merge order is a → e. Each slice is independently reviewable.

### S02-a — Permission model and default-deny policy

**Goal:** Encode the Version 3 permission matrix (C0–C9) as the server-side policy. Default is deny for classes this package owns. Fixture users of each role in tests. No People UI.

**Touch (expected):** `Role` documentation in Authz policy module next to `RolesGuard` / `CommandAuthorizationService`; unit tests for matrix cells; do not invent a new bounded context.

**Done when:** Tests prove Reader ⊄ C4/C5/C6; Researcher ⊄ C5/C6; Trader ⊄ C6; all roles ⊄ C7/C9; no inheritance engine; register default still Researcher.

**Must not:** Role-assignment HTTP; People UI; vault; live UI; membership table; Master Plan edit.

### S02-b — Surface coverage (TD-006 remainder)

**Goal:** In-scope product HTTP mutating/sensitive routes use the matrix. Research mutations → Researcher+. Paper commands remain Trader+. Live mutations stay denied as a product. Authenticated-any-role remains only where C1/C2/C3 say Yes for all four roles.

**Touch (expected):** Existing controllers that lack `@Roles` or command authorization (research, certification, campaigns, live, and other in-scope mutators). Keep certified owners. Do not create a second gate service.

**Done when:** Vertical HTTP tests pass. Researcher can still complete certified research/certify journeys. Trader/Admin paper commands still pass US158. Reader is refused on C4/C5.

**Must not:** Connection wizard; enable live UI; skip Gate/Risk; break J-01.

### S02-c — Role assignment API

**Goal:** Admin-only HTTP to assign Reader / Researcher / Trader / Admin. Identity persists the role. Last-Admin protection. No self-escalation. JWT role remains a hint.

**Touch (expected):** Identity update path behind an Admin-authorized transport (new `/v1/...` people/role routes or equivalent under existing API versioning). DTOs with canonical `Role`. CSRF applies (S01 cookie transport).

**Done when:** Admin assign survives restart; non-Admin 403; last Admin cannot be demoted; `/me` reflects Identity role on the next authenticated request.

**Must not:** Disable-user product (Wave 9); invite members; change passwords; admin force-logout; seed as the API.

### S02-d — People product

**Goal:** Customer-visible People in the existing paper-first Administration chrome. Admin lists operators, sees current role, assigns least privilege. Non-Admin sees honest forbidden/unavailable — not a fake empty directory.

**Touch (expected):** `apps/web` page + catalog link in Administration; reuse `AppLayout`. Component tests.

**Done when:** J3-02 walkthrough steps that are UI-visible can be performed without SSH. Copy is operator language.

**Must not:** New shell; live/vault/connections/billing/API keys; team invites labeled as People.

### S02-e — Privilege constraints and authorization events

**Goal:** Horizontal access tests (role assign ≠ workspace membership). Structured logs for role change and C6 deny (no secrets). Confirm Admin cannot skip Gate/Risk. Confirm no leaked later-wave UI.

**Touch (expected):** Integration tests; logging on assignment path; pc19/pc20 assertions that later products did not appear.

**Done when:** Security verification table in the validation plan can be evidenced. Architecture: still three owners (Authn, Identity role, Workspace membership).

**Must not:** Audit product UI (S05); isolation product rewrite (S06); ABAC.

Do not use slices to smuggle OUT OF Scope work.

---

## Validation Plan

Detail: [`v3-s02-validation-plan.md`](./v3-s02-validation-plan.md).

Close requires all of the following that apply. Tests that mock the customer outcome do not count.

| Gate                                                          | Required | Evidence                                                           |
| ------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| Unit tests                                                    | **Yes**  | Matrix, last-Admin, self-escalate, RolesGuard, command authz       |
| Integration tests                                             | **Yes**  | HTTP vertical/horizontal; assign survives restart; S01 unregressed |
| UI tests                                                      | **Yes**  | People Admin vs non-Admin; catalog; no leaked products             |
| Manual product walkthrough                                    | **Yes**  | RBAC Walkthrough artifact — not a unit/integration/UI test         |
| Security verification (checklist)                             | **Yes**  | Planning review now; evidence at Close                             |
| Architecture verification (checklist)                         | **Yes**  | Intent now; evidence at Close                                      |
| Product verification (checklist)                              | **Yes**  | Intent in scope doc; evidence at Close                             |
| Customer acceptance of Master Plan outcomes this package owns | **Yes**  | J3-02; Wave 1 admin-assigns-role line                              |

Companion validation document: [`v3-s02-validation-plan.md`](./v3-s02-validation-plan.md).

---

## Required Reports

Every package produces these before Close. Do not create RC or ADR documents from a package.

| Report                 | When                        | Path convention                                                                                                          |
| ---------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Implementation Package | Before Approval             | `v3-s02-implementation-package.md` (this file)                                                                           |
| Implementation Report  | After Implementation        | `v3-s02-implementation-report.md`                                                                                        |
| Architecture Review    | After Implementation Report | `v3-s02-architecture-review.md`                                                                                          |
| Security Review        | After Architecture Review   | `v3-s02-security-review.md` (Close evidence; planning companion already exists) **Must include Threat Review (STRIDE).** |
| Product Review         | After Security Review       | `v3-s02-product-review.md` **Must include the Product Walkthrough artifact.**                                            |
| Validation evidence    | After Product Review        | `v3-s02-validation-plan.md` plus recorded results                                                                        |
| Package Close record   | At Close                    | Close Checklist + Package Summary Standard below                                                                         |

Optional companions (written with this package): product-scope, security-review (planning), validation-plan.

**Forbidden:** Version 2-style RC documents; ADRs except the Master Plan’s named future live-capital ADR (Wave 6); Master Plan edits from inside the package.

---

## Package Close Checklist

A package may be marked **CLOSED** only after **all** of the following are true. **Now: NOT DONE** — this is the Implementation Package.

| #   | Gate                                                                                                                                                                           | Verdict                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| 1   | **Implementation Review** — slices done; Implementation Report written; honest limitations recorded                                                                            | **NOT DONE**                                      |
| 2   | **Architecture Review** — architecture checklist complete; no ownership drift; no duplicate context or SoT                                                                     | **NOT DONE**                                      |
| 3   | **Security Review** — security checklist complete; Threat Review (STRIDE) complete; zero **REQUIRES ACTION**                                                                   | **NOT DONE**                                      |
| 4   | **Product Review** — product checklist complete; Product Walkthrough artifact present and **PASS** (or **NOT APPLICABLE** with reason); customer-visible outcomes demonstrated | **NOT DONE**                                      |
| 5   | **Validation** — validation plan executed; customer walkthrough passed                                                                                                         | **NOT DONE**                                      |
| 6   | **All mandatory reports** — listed in Required Reports, present, and consistent                                                                                                | **NOT DONE**                                      |
| 7   | **Master Plan compliance** — no invented scope; wave and capability IDs unchanged                                                                                              | **NOT DONE** (intent: PASS at Close if unchanged) |
| 8   | **Product Principles compliance**                                                                                                                                              | **NOT DONE**                                      |
| 9   | **Customer walkthrough** — Product Walkthrough artifact executed; non-engineer path; no SSH; no customer `.env`; no manual DB edits                                            | **NOT DONE**                                      |

If any row is **NOT DONE**, the package is **not Closed**. V3-S03 must not open.

---

## Customer-visible Changes

**Fill at Close.** What a customer can now do in the product that they could not do before this package.

- _(empty until Close)_

What the UI / copy must **not** claim (already binding for implementation):

- Live trading
- Vault, connection setup, billing, API keys
- Team invites
- That RBAC replaced sign-in
- That Admin can skip Gate or Risk
- Engineer seed as the customer Administrator path

---

## Next Package Dependencies

| Field                             | Value                                                                   |
| --------------------------------- | ----------------------------------------------------------------------- |
| This package unblocks             | **V3-S03** Secret Vault & Encryption (after Close)                      |
| This package does **not** unblock | Connections, live capital, Wave 9 teams, OWASP/audit/isolation products |
| Remaining wave work               | S03 → S04 → S05 → S06                                                   |

Do not claim wave exit. S02 is not the last package of Wave 1.

---

## Lessons Learned

**Fill at Close.** Process, reuse, and honesty only. Not a backlog of new product.

- _(empty until Close)_

If a lesson requires new scope, it is a **Master Plan revision request**, not a silent next-slice.

---

## Package Summary Standard (mandatory at Close)

Cursor (or any implementer) must answer **exactly** these questions at the end of every Version 3 package. Do not paraphrase the questions. Do not skip any.

1. What did the customer receive?
2. What did the customer NOT receive?
3. What business problem was solved?
4. What remains for later packages?
5. Which package becomes available next?
6. Was the Master Plan followed?
7. Were Product Principles respected?
8. Were any architectural deviations introduced?

Answers:

1. _(Close)_
2. _(Close)_
3. _(Close)_
4. _(Close)_
5. _(Close)_ — **V3-S03** after Close
6. _(Close)_
7. _(Close)_
8. _(Close)_ — must be **No** unless an approved Master Plan revision already authorized a deviation.

Question 8 must be **No** unless an approved Master Plan revision (and, where the Master Plan already requires it, a future ADR) already authorized the deviation. An unauthorized deviation means the package **cannot Close**.

---

## Future guidance (binding)

1. **No future Version 3 package may bypass this process.**
2. **If a package cannot satisfy this template, implementation stops until planning is updated.** Planning updates are Master Plan revisions, not package-local edits.
3. Do not start production code before Approval.
4. Do not modify Version 2 certification, Spec v2.0, the Authority Matrix, or the Alias Dictionary from inside a package.
5. Do not create RC documents. Do not create ADR documents except the Master Plan’s named Wave 6 live-capital ADR when that wave is reached.
6. Live capital remains unauthorized until that future ADR. No earlier package may enable live money.
7. Conflicts: **Master Plan wins.**

---

## Product checklist (planning intent)

Copy of [`version-3-product-checklist.md`](./version-3-product-checklist.md) for Implementation Package. Close repeats with demonstrated answers.

| Field                      | Value                                                                       |
| -------------------------- | --------------------------------------------------------------------------- |
| Package                    | V3-S02                                                                      |
| Wave                       | 1 — Security Foundation                                                     |
| Master Plan outcomes owned | Admin assigns a role; operator cannot perform another role’s actions; J3-02 |
| Stage                      | Implementation Package                                                      |

### 1. Customer receives

- **Customer receives:** An Administrator can assign Reader / Researcher / Trader / Admin in the product. Those roles bind. Least privilege is visible.
- **How they do it:** Sign in → Administration → People → assign role. No jargon required.
- **Master Plan outcome IDs / wave lines:** Wave 1 admin-assigns-role; Execution Roadmap S02 exit line; J3-02.

**Verdict (Close):** not yet.

### 2. Customer does NOT receive

- **Customer does NOT receive:** Vault, connections, exchange permissions, billing, API keys, live trading authorization, team invites, disable-user, MFA, a new login product, an ABAC engine.
- **Owner later:** S03; Wave 2; Wave 4; Wave 9; Wave 6; S01 already delivered authn.

**Verdict (Close):** fail if UI implies those capabilities.

### 3. Business value delivered

- **Business value:** Stop shared Admin passwords and SQL role edits; separate research from paper commands.
- **Metric:** §6 no regression; zero convenience privilege.
- **40% residue (honest):** Secrets still not vaulted; isolation suite not a product; live not earned; teams not invited.

### 4. Customer journey impact

```text
Sign in securely
  → isolated workspace
  → connect exchange / notifications / AI in the product
  → research → certify → Gate → deploy → orchestrate
  → paper session (default) or live session (opt-in, audited, kill-switch armed)
  → reports, knowledge, real alerts
  → Command Center
```

- **Journey step(s) affected:** After sign-in, **who** may research vs paper-command vs administer people. J3-02.
- **Journey steps explicitly unchanged:** Sign-in (S01); connect (Wave 2); live (Wave 6); Gate/Risk authorities.
- **Paper remains default:** Yes.

### 5. Next customer capability unlocked

- **Next package this Close unblocks:** V3-S03 Secret Vault & Encryption.
- **Next customer-visible capability:** Store a secret that cannot be read back as plaintext.
- **Wave exit claimed?** **No.**

### 6–8. Walkthrough / UX / docs

Walkthrough script exists in this package and the validation plan. Executed in product: **NOT APPLICABLE** until implementation. Version 2 certification docs must not be rewritten. Master Plan must not be edited.

Product Principles: see Architecture Review §5 (intent PASS).

---

**READY FOR REVIEW.**

**STOP.** Wait for Review and Approval before production code. Do not implement RBAC. Do not open V3-S03. Do not modify Version 2. Do not modify the Master Plan.
