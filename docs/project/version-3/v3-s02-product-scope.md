# V3-S02 Product Scope

**Package:** V3-S02 RBAC Product
**Wave:** 1 — Security Foundation
**Status:** Implementation package — **not implementation**
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Umbrella:** [`v3-s02-implementation-package.md`](./v3-s02-implementation-package.md)

This document freezes **IN / OUT**, **roles**, **permission model**, **workspace ownership**, and **customer-visible acceptance** for V3-S02. It does not add journeys the Master Plan did not already name.

---

## Product purpose

RBAC is the product that answers **who may perform an action**.

It does **not** replace Authentication. Authentication (V3-S01, **CLOSED**) still proves who the operator is and issues, refreshes, and revokes sessions.

It does **not** manage credentials. Passwords, lockout, recovery, and session secrets stay with Authentication.

It does **not** manage exchange permissions. Venue rights such as `spot.trade` stay with Connection Management / Exchange Connectivity (Waves 2 and 4).

It does **not** introduce a new Source of Truth. Identity remains the owner of profile, **role**, and status. Workspace remains the owner of the workspace aggregate and membership. Authorization **decides** using those owners; it does not clone them.

---

## Customer value

An administrator can give an operator a least-privilege role **in the product**. That operator cannot perform another role’s actions. Operators no longer share one Admin password, edit SQL, or SSH to become a Trader.

Wave 1 line this package owns (Master Plan §14 / customer-observable Wave 1):

> An admin can give me a role; I cannot perform another role’s actions.

Execution Roadmap Wave 1 exit line this package owns:

> Workspace Admin can assign Reader / Researcher / Trader / Admin without sharing passwords.

Product Roadmap journey: **J3-02** — Admin assigns least-privilege role in a workspace.

---

## Business problems solved

| Problem today (Version 2 / after S01)                                                                                   | After S02 Close                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Roles exist in code (`Reader`, `Researcher`, `Trader`, `Admin`) but there is no product to assign them.                 | An Admin assigns those four roles in the UI.                                                         |
| Default register is Researcher; becoming Trader or Admin requires seed, SQL, or a shared password.                      | Role change is a product action. Seed remains an engineer bootstrap, not the customer path.          |
| Trading commands are gated (US158); many other mutating surfaces are open to any authenticated user (TD-006 remainder). | Remaining in-scope surfaces use the same permission model. Default is deny.                          |
| JWT `role` can be mistaken for authorization truth.                                                                     | JWT/role claims remain a hint. Identity is re-resolved. Workspace membership is checked server-side. |
| Reader, Researcher, and Trader are not a customer-visible contract.                                                     | Each role has a named privilege. Acting as another role fails closed.                                |

What this does **not** solve (later packages): vaulted secrets (S03); platform OWASP (S04); append-only audit product (S05); isolation test suite (S06); teammate invites (Wave 9); live authorization (Wave 6); exchange permission verification (Wave 4).

---

## Customer outcomes (Master Plan)

This package owns:

- An admin can give me a role; I cannot perform another role’s actions.
- Workspace Admin can assign Reader / Researcher / Trader / Admin without sharing passwords.
- J3-02: Admin assigns least-privilege role in a workspace.

**Must not (Master Plan §14 and this package):** enable live UI; collect exchange keys; amend Spec v2.0; replace Authentication; invent a second identity store; invent team membership.

Wave 1 outcomes owned by **other** packages:

| Outcome                                                   | Owner                                  |
| --------------------------------------------------------- | -------------------------------------- |
| Register, login, recover, session list/revoke             | **V3-S01** (CLOSED)                    |
| Store a secret the customer cannot read back as plaintext | **V3-S03**                             |
| Production OWASP defaults as a platform                   | **V3-S04**                             |
| Append-only security audit product                        | **V3-S05**                             |
| I cannot see another workspace’s data (isolation product) | **V3-S06** (S02 must not punch a hole) |

---

## Roles supported in Version 3

Reuse the existing Identity `Role` enum. Do **not** add roles. Do **not** invent an inheritance engine.

| Role           | Customer meaning (Version 3)                                                            | Wave 1 (this package)                                                                                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Reader**     | Projections only                                                                        | May read allowed projections in a workspace they are a member of. May not research, certify, or issue paper/live commands. May not assign roles.                                                                                     |
| **Researcher** | Lab and certify **into** library per policy; no live start                              | Default on register (unchanged). May run research and certify into the library. May not start paper or live sessions. May not assign roles.                                                                                          |
| **Trader**     | Paper session commands; live only if workspace live-enabled **and** MFA                 | May issue **paper** commands in a workspace they are a member of. Live start is **not** granted by this package (Wave 6). May not assign roles.                                                                                      |
| **Admin**      | Members, connections policy, live enablement, kill switch; **cannot** skip Gate or Risk | May assign the four roles. May issue paper commands (same as Trader for paper). Must **not** bypass Gate or Risk. Connections policy, live enablement, and kill-switch **product** stay later packages; S02 must not ship those UIs. |

**Default new user:** Researcher. Never Admin. Never live-capable Trader by register.

**No role inheritance product.** Admin is not “Trader plus a flag” implemented as a hierarchy that could silently inherit live, vault, or Gate bypass. Privileges are listed in the permission model. Where Admin may also do paper commands, that is an explicit matrix row, not inheritance.

**First Administrator:** Host/engineer bootstrap (existing seed `admin@trp.local` or equivalent host bootstrap) remains the way the first Admin exists. It is **not** the customer path. Customers do not register as Admin. After bootstrap, further role grants happen in the product (this package).

---

## Permission model

RBAC governs **who may perform an action**. Evaluation is server-side only.

```text
authenticated session (Authentication)
  → Identity role re-resolved (Identity)
  → workspace membership (Workspace)
  → permission decision (this package)
  → domain gates unchanged (Gate, Risk, Kill Switch — not this package)
```

Default policy: **deny**. A mutating or sensitive action is allowed only when the matrix names it for that role **and** Workspace membership holds.

JWT `role` is a hint. A forged or stale claim must not authorize. `JwtStrategy` already re-loads Identity through the session; S02 must keep that.

### Classes (Wave 1)

| Class                      | Surfaces (customer language)                                                                                             | Reader    | Researcher | Trader          | Admin           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- | --------------- | --------------- |
| **C0 Public**              | Register, login, recover (already `@Public()`)                                                                           | —         | —          | —               | —               |
| **C1 Self**                | Own profile (`/me`), own sessions, own password change                                                                   | Yes       | Yes        | Yes             | Yes             |
| **C2 Own workspace**       | Bootstrap / list / rename / archive **own** workspace                                                                    | Yes       | Yes        | Yes             | Yes             |
| **C3 Projection**          | Read reports, library browse, command-center views, knowledge read, portfolio/accounting read, market profile/state read | Yes       | Yes        | Yes             | Yes             |
| **C4 Research**            | Lab, campaigns, datasets, experiments, historical research, certify into library, research-control executions            | No        | Yes        | Yes             | Yes             |
| **C5 Paper command**       | Paper session commands, paper orders, paper account, orchestrator commands, deployment that binds the paper path         | No        | No         | Yes             | Yes             |
| **C6 Role admin**          | List operators for assignment; assign Reader / Researcher / Trader / Admin                                               | No        | No         | No              | Yes             |
| **C7 Live command**        | Live session start, live orders, live kill-switch product                                                                | **No**    | **No**     | **No** (Wave 6) | **No** (Wave 6) |
| **C8 Vault / connections** | Collect, test, or rotate vendor secrets; connection wizards                                                              | **No**    | **No**     | **Out**         | **Out**         |
| **C9 Bypass**              | Skip Gate, skip Risk, force fill, silent Ledger edit                                                                     | **Never** | **Never**  | **Never**       | **Never**       |

Live HTTP routes that already exist in Version 2 must **not** become a customer live product. S02 applies default-deny to live mutations. It does not unhide live UI. It does not invent live-enablement policy.

Exchange adapter connect/disconnect already requires Trader or Admin. S02 **keeps** that gate. It does **not** ship Connection Management.

### How a decision is made

1. No session → unauthenticated. Only C0.
2. Disabled user → deny (Authentication / Identity, already fail-closed).
3. Not a workspace member → deny (Workspace). Unknown workspace ids do not leak foreign records (existing `WorkspaceAccessService` behavior).
4. Role not in the matrix cell → deny.
5. Domain owner still applies its own rules (Gate, Risk, Library certification policy). Passing RBAC is not a Gate pass.

---

## Workspace ownership model

Workspace remains **Workspace** owner. S02 does not take membership away from Workspace and does not add a second membership store.

| Fact                                                        | Owner                                                | S02 rule                                                |
| ----------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| Workspace aggregate (`id`, `name`, `ownerUserId`, `status`) | Workspace                                            | Unchanged                                               |
| Membership                                                  | Workspace (`WorkspaceAccessService`: owner + Active) | Unchanged. Owner is the member.                         |
| `X-Workspace-Id`                                            | Transport header; membership checked server-side     | Unchanged. Not a client honor system.                   |
| Role                                                        | Identity (`User.role`)                               | Unchanged store. S02 adds the **product** to assign it. |
| Team invite / shared workspace members                      | Wave 9 (`J3-12`, V3-W01+)                            | **Out.** Do not invent a membership table.              |

**“In a workspace” (J3-02)** means: the Admin is signed in, workspace context is present and authorized, and the assigned role then governs what that operator may do **in workspaces they are a member of**.

Today membership is **owner-only** (PC-14). Assigning a role does **not** put the assignee into the Admin’s workspace. Each operator still uses workspaces they own. That is honest solo-researcher Version 3 until Wave 9.

S02 must not punch an isolation hole: a non-Admin must not list other operators; a user in workspace A must not read workspace B because of a role change.

---

## Administrative capabilities (this package)

| Capability                                             | In S02? | Notes                                                                          |
| ------------------------------------------------------ | ------- | ------------------------------------------------------------------------------ |
| Assign Reader / Researcher / Trader / Admin            | **Yes** | Admin only. Identity persists the role.                                        |
| See current role of operators the Admin may administer | **Yes** | People list is Admin-only. No passwords, hashes, or session secrets.           |
| See own current role                                   | **Yes** | Already on `/me`. Non-Admin does not get a People directory.                   |
| Last-Admin protection                                  | **Yes** | Cannot demote or remove the last Active Admin.                                 |
| Self-escalation                                        | **No**  | Researcher / Trader / Reader cannot assign any role, including their own.      |
| Register as Admin                                      | **No**  | Default remains Researcher.                                                    |
| Disable a user                                         | **No**  | Wave 9. Identity `disable` may exist in domain; it is not this product.        |
| Invite a teammate                                      | **No**  | Wave 9.                                                                        |
| Admin force-logout of another user                     | **No**  | S01 is self-service sessions. People force-logout is not a Wave 1 S02 outcome. |
| Live enablement                                        | **No**  | Admin + ADR, Wave 6.                                                           |
| Kill Switch product                                    | **No**  | V3-O04.                                                                        |
| Platform admin console                                 | **No**  | Wave 9 Administration group.                                                   |

---

## User journeys

### J3-02 — Admin assigns least-privilege role (this package)

1. Administrator signs in (S01).
2. Opens **People** (or equivalent Administration label) in the existing paper-first shell.
3. Sees operators and their current roles. Does not see passwords or session tokens.
4. Assigns **Reader**, **Researcher**, **Trader**, or **Admin**.
5. The assignee signs in (or continues with a later request). Identity role is the one assigned.
6. The assignee cannot perform a higher class’s actions (Reader cannot research; Researcher cannot start paper; Trader cannot assign roles; nobody skips Gate/Risk).

Honest failures the customer must still see:

- Non-Admin who opens People is refused (forbidden), not shown an empty fake directory of everyone.
- Assigning a role to an unknown user fails without leaking whether other workspaces exist.
- Demoting the last Admin is refused with honest product language.
- Live, vault, connections, billing, and API keys are not offered as if they shipped.

### Supporting journeys (must not regress)

| Journey               | Owner               | S02 duty                                                                                            |
| --------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| J-01…J-14 paper-first | Version 2 certified | Researcher can still research and certify. Trader/Admin can still issue paper commands. No live UI. |
| J3-01 Secure sign-in  | V3-S01 CLOSED       | Unchanged. Role assignment is not a new login.                                                      |
| J3-12 Invite teammate | Wave 9              | Not started. People is not an invite product.                                                       |

---

## IN SCOPE

| Item                                    | Customer meaning                                                | Owner inside existing domain                                                                                                     |
| --------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Permission model**                    | Named classes C0–C9; default-deny                               | Authorization decision in existing Auth (`RolesGuard`, `CommandAuthorizationService`) using Identity role + Workspace membership |
| **Role assignment**                     | Admin sets Reader / Researcher / Trader / Admin                 | Identity persists `User.role`. HTTP is transport.                                                                                |
| **People product**                      | Admin lists operators and assigns roles in the UI               | Projection over Identity. Not a new People bounded context.                                                                      |
| **TD-006 remainder**                    | Remaining in-scope mutating surfaces use the same authorization | Existing product HTTP controllers; no second gate                                                                                |
| **Least privilege defaults**            | Register remains Researcher; no Admin-by-register               | Identity create path (already default Researcher)                                                                                |
| **Last-Admin protection**               | Product refuses to leave the host with zero Admins              | Authorization + Identity update path                                                                                             |
| **Vertical / horizontal access tests**  | Cannot self-escalate; cannot use role to read another workspace | Tests; Workspace membership unchanged                                                                                            |
| **Authorization events**                | Structured logs: role change, authz deny on C6                  | Logs for V3-S05; not the audit product                                                                                           |
| **Keep workspace header authorization** | `X-Workspace-Id` still server-checked                           | Workspace                                                                                                                        |

---

## OUT OF SCOPE

Do not implement these in V3-S02. Several are real Version 3 work on **later** packages.

| Item                                         | Why out                                                    | Owner later                                        |
| -------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| **Credential Vault**                         | Justified new security domain; not authorization           | **V3-S03**                                         |
| **Connection Management**                    | Wave 2 product                                             | **V3-C01+**                                        |
| **Exchange permissions**                     | Venue `spot.trade` (and similar) from the venue, not RBAC  | Wave 4 (`V3-E*` / Security Vision live attributes) |
| **Billing**                                  | Isolated billing; not security foundation                  | Wave 9                                             |
| **API keys**                                 | Developer platform                                         | Wave 9                                             |
| **Live Trading authorization**               | Live start requires live-enabled + MFA + Gate + ADR        | Wave 6                                             |
| **Authentication / credentials / sessions**  | Already CLOSED                                             | **V3-S01**                                         |
| **Email verification, MFA, OAuth, passkeys** | Not S02; MFA before live is Wave 6                         | Wave 6 / not planned                               |
| **Team invites / shared membership**         | SaaS teams                                                 | Wave 9 **J3-12**                                   |
| **Disable user product**                     | Wave 9 customer line                                       | Wave 9                                             |
| **Platform admin console**                   | Administration group                                       | Wave 9                                             |
| **ABAC engine**                              | Not justified                                              | Out of Version 3                                   |
| **New IAM / RBAC bounded context**           | Authorization extends existing Auth + Identity + Workspace | —                                                  |
| **New Source of Truth for people or roles**  | Identity already owns role                                 | —                                                  |
| **Gate / Risk bypass for Admin**             | Forbidden by Least Privilege                               | —                                                  |
| **Audit product / customer audit UI**        | Structured events only                                     | **V3-S05**                                         |
| **Workspace isolation suite as a product**   | Must not punch a hole                                      | **V3-S06**                                         |
| **Kill Switch product**                      | Operations                                                 | **V3-O04**                                         |
| **Engineer seed as customer Admin path**     | Seed remains host bootstrap (PC-18 / S01)                  | —                                                  |

Nothing above is invented as IN Scope. If a desired item is not in the Master Plan, **stop**.

---

## Product acceptance criteria (customer-visible)

A reviewer who is not an engineer must be able to do the following **in the product UI**:

| #   | Outcome                                                                                                          | Fail if                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | An **Admin** opens People and assigns Reader / Researcher / Trader / Admin without SSH, customer `.env`, or SQL. | Role change requires database edit, seed-password sharing, or curl-only as the product path. |
| 2   | A **Reader** can see allowed projections and **cannot** run research or start a paper session.                   | Reader can certify, start paper, or assign roles.                                            |
| 3   | A **Researcher** can research and certify into the library and **cannot** start a paper session or assign roles. | Researcher issues paper commands or opens People as if Admin.                                |
| 4   | A **Trader** can issue paper commands and **cannot** assign roles or start live trading as a product.            | Trader becomes Admin; live UI appears; Gate/Risk skipped.                                    |
| 5   | An **Admin** cannot skip Gate or Risk.                                                                           | Admin-only override of a failed Gate or Risk decision.                                       |
| 6   | Register still creates **Researcher**. Time to register / login does not regress (Master Plan §6).               | Admin-by-register; S01 login/recovery broken.                                                |
| 7   | Last Active Admin cannot be demoted.                                                                             | Product can leave zero Admins.                                                               |
| 8   | Non-Admin cannot enumerate operators or change anyone’s role (including self).                                   | Horizontal user directory leak; self-escalation.                                             |
| 9   | No vault, connection wizard, billing, API keys, or live trading UI.                                              | S03–S06 or Wave 2+ product leaked into S02.                                                  |
| 10  | Certified Version 2 paper-first journeys still work for the roles that own them.                                 | J-01…J-14 broken for Researcher research or Trader paper.                                    |

**Metrics (Master Plan §6) that this package must not regress:**

- Time to register **< 2 min**
- Time to secure login **< 30 s**
- Credential exposure: **0** (role assignment returns no passwords, tokens, or hashes)
- Cross-workspace secret/data leak via this package: **0**
- Security incidents from default misconfig (privilege granted as convenience): **0 tolerated** at package release

---

## Honest product rules for this package

- Do not show **Connected** to an exchange.
- Do not show live trading as available.
- Do not show MFA as available.
- Do not show vault, billing, or API keys as available.
- Do not present People as team invites.
- Do not present engineer seed as the way customers become Admin.
- Do not claim the audit **product** shipped because role-change logs exist.
- Roles on `/me` remain visible; assigning roles is this package and is Admin-only.

---

**STOP.** This is scope. Not implementation. Wait for Review and Approval of the Implementation Package.
