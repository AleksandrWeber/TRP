# V3-S02-c Architecture Review

**Package:** V3-S02 RBAC Product  
**Slice:** S02-c — Role Assignment API  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Existing owner:** Role value: Identity. Authorization decision: Auth (`RolesGuard` + C6). Membership: Workspace. Credentials/sessions: Authentication (S01 CLOSED).  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §10–11, §16  
**Checklist:** [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md)  
**Nature:** Architecture review. Not an RC. Not an ADR. Not a Spec v2.0 amendment.

---

## Verdict

**PASS for S02-c.** No ownership drift. No new bounded context. No Source of Truth change. Unauthorized architectural deviations: **none**.

Package Close remains blocked until S02-d and S02-e are implemented and reviewed.

---

## Verify

### 1. No ownership drift

| Check                                                                             | Verdict  | Evidence                                                                                                     |
| --------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| Work landed in the named owner                                                    | **PASS** | `User.role` write is Identity (`assignRole` / last-Admin). HTTP is a People _transport_, not a People domain |
| Identity remains profile/role/status; Authentication remains credentials/sessions | **PASS** | No password/session fields on People views. `/me` still owned by Authentication, reading Identity            |
| Ledger / Risk / Gate / Library / Workspace not given new owners                   | **PASS** | Untouched as owners. Role assign does not call Workspace write                                               |
| Notification Delivery / Telegram                                                  | **PASS** | Untouched                                                                                                    |
| UI is not Source of Truth                                                         | **PASS** | No UI in this slice                                                                                          |
| HTTP remains transport                                                            | **PASS** | `PeopleController` maps Identity results. Authorization is C6 on the existing guard                          |

**Must not own:** credentials/sessions (S01 CLOSED); Workspace membership; People UI (S02-d); Vault (S03); live enablement (Wave 6); authorization event log productization (S02-e / S05).

### 2. No duplicate bounded context

| Check                                                  | Verdict  | Evidence                                                                   |
| ------------------------------------------------------ | -------- | -------------------------------------------------------------------------- |
| No second authentication, vault, ledger, or order path | **PASS** | Forbidden and not added                                                    |
| No new bounded context unless Master Plan named it     | **PASS** | No IAM / RBAC / People domain module. `PeopleController` lives in Identity |
| Persistence/ports added only inside an existing owner  | **PASS** | Existing Prisma User table. No new role table                              |
| Trading Session / SessionRecovery* not reused as login | **PASS** | Untouched as login                                                         |

**New context claimed?** None.

### 3. No duplicate Source of Truth

| Check                                                           | Verdict  | Evidence                                               |
| --------------------------------------------------------------- | -------- | ------------------------------------------------------ |
| Money remains Ledger                                            | **PASS** | Untouched                                              |
| Certification / Gate / Library not cloned                       | **PASS** | Untouched                                              |
| No parallel mechanism for risk, lifecycle, or identity profiles | **PASS** | One `User.role`. JWT role remains a hint               |
| Projections remain projections                                  | **PASS** | People list is a projection over Identity. UI is S02-d |

### 4. Master Plan respected

| Check                                      | Verdict  | Evidence                                                            |
| ------------------------------------------ | -------- | ------------------------------------------------------------------- |
| Package ID, wave, capabilities match       | **PASS** | V3-S02, Wave 1, SEC-02 / SEC-03 role assignment API                 |
| IN Scope is a subset of the plan           | **PASS** | Assignment API + last-Admin + validation. No People UI. No invites  |
| OUT OF Scope names later owners            | **PASS** | People UI S02-d; events S02-e; vault S03; live Wave 6; teams Wave 9 |
| Live capital not authorized                | **PASS** | C7 unchanged. Assignment does not grant live                        |
| Contradictions stopped rather than patched | **PASS** | Last-Admin is Identity invariant, not a UI check                    |

### 5. Product Principles respected

| Principle                    | Verdict  | Evidence                                                                                                           |
| ---------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| Customer First               | **PASS** | Admin assigns a role without SQL or seed-password sharing                                                          |
| Security Before Convenience  | **PASS** | C6 only. Self-escalation denied. Invalid roles rejected. Last Admin protected                                      |
| One Source of Truth          | **PASS** | Identity role + Workspace membership + Authz decides only                                                          |
| Paper First                  | **PASS** | Unchanged                                                                                                          |
| Live Must Be Earned          | **PASS** | Unchanged                                                                                                          |
| Honest Product               | **PASS** | API is not People UI. Events are not claimed. 409 copy is operator language                                        |
| AI Never Controls Capital    | **PASS** | Untouched                                                                                                          |
| Everything Is Auditable      | **PASS** | Assignment is attributable in principle (Admin session + Identity write). Structured logs are **S02-e**; not moved |
| No Hidden Configuration      | **PASS** | Roles are the existing enum, not a customer `.env`                                                                 |
| Architecture Is a Constraint | **PASS** | Identity extended; Authz reused; no new BC                                                                         |

### 6. Dependencies unchanged

| Check                                              | Verdict  | Evidence                                           |
| -------------------------------------------------- | -------- | -------------------------------------------------- |
| Depends only on certified V2 and Closed earlier V3 | **PASS** | PC-18, US105/US107, S01 Closed, S02-a/b            |
| No later-wave dependency                           | **PASS** | No vault, connections product, live ADR, S05 store |
| No Master Plan or Spec change required             | **PASS** | Compiles without plan edits                        |
| Reuse table honored                                | **PASS** | Major extension of Identity; Auth C6 reused        |

**Dependencies used:** Identity `User` / `Role` / repository; `RolesGuard` C6; S01 JWT/session + CSRF; Prisma User table.

**Dependencies refused:** People UI, membership table, ABAC engine, new IAM module, new roles, audit product UI, structured event emission (S02-e).

### 7. Architecture impact justified

| Check                                                          | Verdict  | Evidence                                           |
| -------------------------------------------------------------- | -------- | -------------------------------------------------- |
| Additions required by named outcomes                           | **PASS** | Admin assigns role through the product API         |
| Extension of existing owner                                    | **PASS** | Identity `assignRole` + last-Admin; HTTP transport |
| Canonical Order Path / Ledger / Runtime / Library not replaced | **PASS** | Untouched as owners                                |
| Spec v2.0 / Matrix / Alias unchanged                           | **PASS** | Unmodified                                         |

**Justified additions:** Identity `list` / `assignRole`; last-Admin; People HTTP transport; canonical Role DTO.

**Unjustified ideas rejected:** new People bounded context; role hierarchy; workspace membership on assign; moving S02-e logs into this slice; disable-user product.

### 8. No hidden redesign

| Check                             | Verdict  | Evidence                      |
| --------------------------------- | -------- | ----------------------------- |
| No Version 2.1 rewrite            | **PASS** | Version 2 untouched           |
| No new IAM / SOC / ABAC product   | **PASS** | Explicitly refused            |
| No Version 2-style RC             | **PASS** | None                          |
| No ADR                            | **PASS** | None                          |
| No silent Master Plan edit        | **PASS** | Unmodified                    |
| Certified V2 products not rebuilt | **PASS** | Paper/research HTTP unchanged |

---

## Close rule

Architecture Review **PASS** for this slice. Package Close is **not** claimed.

Question 8 (architectural deviations): **No.**

---

**STOP.** Wait for Product Owner review before beginning V3-S02-d People Product.

**End of S02-c Architecture Review.**
