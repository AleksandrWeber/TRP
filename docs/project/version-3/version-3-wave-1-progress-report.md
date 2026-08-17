# Version 3 Wave 1 Progress Report

**Document:** Version 3 Wave 1 Progress Report
**Date:** 2026-08-16
**Status:** Product Owner status after V3-S01 and V3-S02 Close
**Wave:** 1 — Security Foundation
**Nature:** Progress report. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

Audience: Product Owner, business stakeholders, and later project reviews.

V3-S01 Authentication & Session is **CLOSED**. V3-S02 RBAC Product is **CLOSED**. Both packages are committed locally. Nothing has been pushed. V3-S03 has not started. Version 2 was not modified. The Master Plan was not modified.

Wave 1 is **not** complete.

---

## 1. What has been delivered so far

Two of six Security Foundation packages are closed.

| Package | Status      | What the operator got                                                |
| ------- | ----------- | -------------------------------------------------------------------- |
| V3-S01  | CLOSED      | Authentication Platform, Sign-in Sessions, Password Recovery         |
| V3-S02  | CLOSED      | Roles and permissions, People, Role Assignment, Authorization Events |
| V3-S03  | Not started | Secret Vault                                                         |
| V3-S04  | Not started | Platform security hardening                                          |
| V3-S05  | Not started | Security audit product                                               |
| V3-S06  | Not started | Isolation product                                                    |

### Authentication Platform

An operator can create an account with the product password rule, sign in with email and password, and keep working without typing the password on every action. There is no shared default password on the product sign-in form. Repeated failed sign-ins lock the account for a time. A new account is always Researcher, never Administrator.

The first Administrator still comes from host bootstrap. After that, People is the customer path.

### Session Management

An operator can open Sign-in sessions, see this device, end another sign-in, end every other sign-in, or sign out everywhere. Ending a sign-in takes effect immediately. Header logout still ends only this device.

### Password Recovery

When host mail is configured, a forgotten password can be recovered from the product. When host mail is off, the product says recovery is unavailable. It does not pretend mail was sent. A signed-in operator can change password; other devices end; this device stays signed in.

### RBAC

Reader, Researcher, Trader, and Administrator each have named privileges. A person cannot perform another role’s actions. Administrator cannot skip Gate or Risk and cannot start live trading.

### People

An Administrator opens People under Administration, sees who can use the product and their current roles, and assigns a role with confirmation. Anyone who is not an Administrator sees that People is unavailable — not an empty directory. The signed-in Administrator is labeled **You**. Trying to change your own role is denied with a clear explanation. The last active Administrator cannot be removed.

### Role Assignment

An Administrator assigns Reader, Researcher, Trader, or Administrator in the product. The other person keeps their sign-in. The new role applies on their next action. Assigning a role does **not** put that person into someone else’s workspace.

### Authorization Events

When a role is changed, or when someone who is not allowed tries to change a role, the product records who, whom, the previous role, the new role, and whether it was allowed. Operators cannot search that record yet. Passwords and sign-in secrets are not written into it.

---

## 2. What business problems are now solved

| Problem before these packages                                                   | After S01 and S02                                                                                               |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Shared or leftover Administrator password on the product path                   | Each person signs in as themselves. Lockout after repeated failures.                                            |
| Sign-ins that could not be ended                                                | Sign-ins are visible and can be ended, including everywhere.                                                    |
| Forgotten password required an engineer, SSH, or a database edit                | Recovery exists when host mail is on; otherwise the product says unavailable. Signed-in password change exists. |
| Roles existed in code with no product to assign them                            | An Administrator assigns least privilege in People.                                                             |
| Signed-in often meant allowed                                                   | The same permission rules apply to research, paper trading, and administration.                                 |
| Becoming Trader or Administrator meant sharing a password or editing a database | Role change is a product action.                                                                                |
| Role changes were not attributable                                              | Role changes and People refusals are recorded for a later security history.                                     |

These problems are solved **for identity and roles**. They are not solved for venue keys, platform hardening, a searchable audit, or a finished isolation product.

---

## 3. What remains in Wave 1

The Master Plan’s Wave 1 business value is: safe identity **and** a vault so secrets are not tribal host files. Identity is in place. The vault is not.

| Remaining package                   | Customer meaning                                                                                                                     | Wave 1 outcome it owns                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **V3-S03 Secret Vault**             | Store a secret the customer cannot read back as plaintext. Stop using host files as the customer secret path.                        | “The product can store a secret that I cannot read back as plaintext.”                      |
| **V3-S04 OWASP platform hardening** | Production defaults for flood, headers, and similar platform controls.                                                               | Not a separate customer page. Required before Wave 1 can claim production-default security. |
| **V3-S05 Security audit platform**  | A security history operators can use. S02 only recorded events; it did not ship this product.                                        | Append-only security audit.                                                                 |
| **V3-S06 Isolation product**        | Prove a person cannot see another workspace’s data as a product test suite. S02 did not punch a hole; it did not close this package. | “I cannot see another workspace’s data.”                                                    |

**Connection security prerequisites:** Connection Management is **Wave 2**, not Wave 1. Customers still cannot save exchange or AI keys in the product. Wave 1’s remaining vault work is the prerequisite: without a vault, Wave 2 would still be host files. Isolation (S06) is the remaining Wave 1 check that one workspace cannot read another’s data or secrets.

Still not Wave 1, and still not started: extra sign-in factors, teammate invitations, live trading, billing, API keys.

Wave 1 customer-observable lines from the Master Plan:

| Outcome                                                              | Status                                                                                                       |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Register an account that survives restart                            | **Met** (S01)                                                                                                |
| Log in securely (no shared default password on the product path)     | **Met** (S01)                                                                                                |
| Recover an account through a supported recovery path                 | **Met** (S01) — or honest unavailable if host mail is off                                                    |
| See and sign out sessions, including everywhere                      | **Met** (S01)                                                                                                |
| An admin can give me a role; I cannot perform another role’s actions | **Met** (S02)                                                                                                |
| The product can store a secret I cannot read back as plaintext       | **Not met** (S03)                                                                                            |
| I cannot see another workspace’s data                                | **Not met as a Wave 1 product** (S06). Membership is still owner-only. Role assignment does not add members. |

---

## 4. Current readiness

These figures do not rewrite the frozen Version 2 dashboard. They describe progress toward declared Version 3 Wave 1 scope.

### Security Foundation

| Measure                                     | Figure                | Meaning                                                                                                 |
| ------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| Wave 1 packages closed                      | **2 of 6 (33%)**      | S01 and S02 closed. S03–S06 not started.                                                                |
| Wave 1 customer-observable outcomes         | **5 of 7**            | Identity, sessions, recovery, and roles. Vault and isolation product remain.                            |
| Authentication (declared S01 scope)         | **75%**               | Register, lockout, recovery, password change shipped. Extra sign-in factors remain later.               |
| Session management (declared S01 scope)     | **100% of S01 scope** | Revocable sign-ins shipped. Trusted devices were never in S01.                                          |
| Authorization and RBAC (declared S02 scope) | **100% of S02 scope** | People, roles, and central permission rules shipped. Live, vault, and bypass remain unbound on purpose. |

Wave 1 is not 33% “done” in the customer’s eyes and not 71% “done” either. Identity and roles are in the product. Secrets, platform hardening, audit product, and isolation product are not.

### Production readiness delta

Certified Version 2 production readiness remains **40%**. S01 and S02 did **not** invent a new production percentage.

What changed: the product now knows who is signed in, can end that sign-in, can recover or rotate a password without an engineer, and can assign least privilege without sharing an Administrator password. What did not change: venue keys are still not a customer product; live capital is still unauthorized; the frozen production score is still not a production-complete claim.

### Reuse from Version 2

Paper-first product remains the product (**99%** paper path reused, not rebuilt). Research, certification, paper trading, library, Gate, and Risk are still the Version 2 products. Version 3 added sign-in, sessions, recovery, and People on top of that shell. Architecture was not redesigned.

### Customer-visible improvements

- Create account and sign in without a shared product password
- Sign-in sessions and sign out everywhere
- Password recovery or an honest unavailable state
- People: assign Reader / Researcher / Trader / Administrator
- A Reader cannot research or paper-trade; a Researcher cannot paper-trade; a Trader cannot assign roles
- Trying to change your own role is refused on screen

---

## 5. What Version 3 can do today — and what it still cannot do

### Can do today

- Create an account that survives restart
- Sign in; stay signed in while working; end a sign-in
- Recover a forgotten password when host mail is on
- Change password while signed in
- Research, certify, and paper-trade **as the Version 2 paper-first product**, now behind the signed-in role
- Assign and reduce roles in People
- Refuse another role’s actions, including an Administrator who tries to skip Gate or Risk or start live trading

### Cannot do today

- Store venue or AI secrets in the product (no vault)
- Connect an exchange or AI key from the UI (Wave 2; needs the vault first)
- Search a security history (events exist; the audit product does not)
- Invite a teammate into a shared workspace
- Disable a person as a product action
- Turn on extra sign-in factors, social sign-in, passkeys, or trusted devices
- Start live trading
- Claim production-complete security (platform hardening and isolation product remain)
- Push S01/S02 to the shared remote — those commits are local only

---

## 6. Why Secret Vault is the logical next package

The Master Plan’s Wave 1 promise is not only “people can sign in.” It is “secrets are not tribal host files.”

Today the product knows **who** is signed in and **what role** they have. It still has nowhere safe to put a venue key or an AI key. If Connection Management started now, operators would still paste secrets into host files, or the product would have to store them in a way the customer can read back. That is the problem Wave 1 named and has not solved.

Vault is next because:

- Identity and roles are already closed. The next missing Wave 1 outcome is a secret the customer cannot read back as plaintext.
- Connection Management (Wave 2) cannot be an honest product until that exists.
- Live trading, notifications, and customer AI keys all depend on the same fact: the product holds the secret; the operator does not copy it into a server file.

Vault does not unlock live trading. It does not unlock connections by itself. It is the next Security Foundation package, starting at Implementation Package, not at code.

---

## Repository note (for reviews)

| Item          | State                                                      |
| ------------- | ---------------------------------------------------------- |
| V3-S01        | CLOSED, committed locally                                  |
| V3-S02        | CLOSED, committed locally (`v3-s02-close` tag, local only) |
| Remote        | **Not pushed**                                             |
| V3-S03        | **Not started**                                            |
| Backup branch | Kept                                                       |

---

**STOP.** Wait for Product Owner review before pushing S01/S02 or opening V3-S03.

**End of Version 3 Wave 1 Progress Report.**
