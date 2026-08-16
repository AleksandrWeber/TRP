# V3-S02-b Architecture Review

**Package:** V3-S02 RBAC Product  
**Slice:** S02-b — Surface Coverage  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Existing owner:** Authorization decision: Auth module in place. Role value: Identity. Membership: Workspace.  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §10–11, §16  
**Checklist:** [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md)  
**Nature:** Architecture review. Not an RC. Not an ADR. Not a Spec v2.0 amendment.

---

## Verdict

**PASS for S02-b.** No ownership drift. No new bounded context. No Source of Truth change. Unauthorized architectural deviations: **none**.

Package Close remains blocked until S02-c … S02-e are implemented and reviewed.

---

## Verify

### 1. No ownership drift

| Check                                                                             | Verdict  | Evidence                                                                                                       |
| --------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| Work landed in the named owner                                                    | **PASS** | `@RequirePermission` metadata and fail-closed `RolesGuard` stay in existing Auth. Controllers remain transport |
| Identity remains profile/role/status; Authentication remains credentials/sessions | **PASS** | No Identity store change. Auth C0/C1 routes keep Authentication as owner                                       |
| Ledger / Risk / Gate / Library / Workspace not given new owners                   | **PASS** | Risk/Library/Workspace HTTP only received permission metadata. Domain services unchanged                       |
| Notification Delivery / Telegram                                                  | **PASS** | Telegram HTTP classified; Telegram does not own trading commands                                               |
| UI is not Source of Truth                                                         | **PASS** | No UI in this slice                                                                                            |
| HTTP remains transport                                                            | **PASS** | No new routes. No business logic moved into the guard                                                          |

**Must not own:** credentials/sessions (S01 CLOSED); Workspace membership; People product (S02-d); Vault (S03); live enablement (Wave 6).

### 2. No duplicate bounded context

| Check                                                  | Verdict  | Evidence                             |
| ------------------------------------------------------ | -------- | ------------------------------------ |
| No second authentication, vault, ledger, or order path | **PASS** | Forbidden and not added              |
| No new bounded context unless Master Plan named it     | **PASS** | No IAM / RBAC / People domain module |
| Persistence/ports added only inside an existing owner  | **PASS** | No new tables                        |
| Trading Session / SessionRecovery* not reused as login | **PASS** | Untouched as login                   |

**New context claimed?** None.

### 3. No duplicate Source of Truth

| Check                                                           | Verdict  | Evidence                                                 |
| --------------------------------------------------------------- | -------- | -------------------------------------------------------- |
| Money remains Ledger                                            | **PASS** | Untouched                                                |
| Certification / Gate / Library not cloned                       | **PASS** | Certification HTTP classified as C4; Library remains SoT |
| No parallel mechanism for risk, lifecycle, or identity profiles | **PASS** | One `User.role`. One matrix. Guard does not store grants |
| Projections remain projections                                  | **PASS** | C3 reads do not become commands                          |

### 4. Master Plan respected

| Check                                      | Verdict  | Evidence                                                                                     |
| ------------------------------------------ | -------- | -------------------------------------------------------------------------------------------- |
| Package ID, wave, capabilities match       | **PASS** | V3-S02, Wave 1, SEC-02 / SEC-03 (TD-006 remainder)                                           |
| IN Scope is a subset of the plan           | **PASS** | Surface coverage only. No People, no assignment API                                          |
| OUT OF Scope names later owners            | **PASS** | People S02-c/d; vault S03; live Wave 6; teams Wave 9                                         |
| Live capital not authorized                | **PASS** | C7 on live mutations; empty for every role                                                   |
| Contradictions stopped rather than patched | **PASS** | Allow-by-omission closed by classification + fail-closed guard, not by a second gate service |

### 5. Product Principles respected

| Principle                    | Verdict  | Evidence                                                                                        |
| ---------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| Customer First               | **PASS** | Unauthorized actions fail before business logic; no SSH required to have consistent HTTP policy |
| Security Before Convenience  | **PASS** | Default deny on unclassified HTTP. No extra class invented for convenience                      |
| One Source of Truth          | **PASS** | Identity role + Workspace membership + Authz decides only                                       |
| Paper First                  | **PASS** | C5 remains Trader/Admin; live mutations denied                                                  |
| Live Must Be Earned          | **PASS** | C7 denied                                                                                       |
| Honest Product               | **PASS** | No People UI pretending assignment shipped. Public routes stay explicitly public                |
| AI Never Controls Capital    | **PASS** | AI generate/execute classified as C4 research, not C5/C7                                        |
| Everything Is Auditable      | **PASS** | Decision reasons unchanged. Authorization event log is S02-e                                    |
| No Hidden Configuration      | **PASS** | Classification is decorator metadata, not a customer `.env`                                     |
| Architecture Is a Constraint | **PASS** | Extension of Auth + existing controllers, not a redesign                                        |

### 6. Dependencies unchanged

| Check                                              | Verdict  | Evidence                                     |
| -------------------------------------------------- | -------- | -------------------------------------------- |
| Depends only on certified V2 and Closed earlier V3 | **PASS** | PC products, US107, US158, S01 Closed, S02-a |
| No later-wave dependency                           | **PASS** | No vault, connections product, live ADR      |
| No Master Plan or Spec change required             | **PASS** | Decorators compile without plan edits        |
| Reuse table honored                                | **PASS** | Minor extension of existing HTTP; Auth guard |

**Dependencies used:** Identity `Role`, `RolesGuard`, `AuthorizationDecisionService`, `CommandAuthorizationService`, `WorkspaceAccessService`.

**Dependencies refused:** People HTTP, membership table, ABAC engine, new IAM module, C10+.

### 7. Architecture impact justified

| Check                                                          | Verdict  | Evidence                                           |
| -------------------------------------------------------------- | -------- | -------------------------------------------------- |
| Additions required by named outcomes                           | **PASS** | TD-006 remainder / SEC-02 surface coverage         |
| Extension of existing owner                                    | **PASS** | Guard + decorator metadata inside Auth / transport |
| Canonical Order Path / Ledger / Runtime / Library not replaced | **PASS** | Untouched as owners                                |
| Spec v2.0 / Matrix / Alias unchanged                           | **PASS** | Unmodified                                         |

**Justified additions:** fail-closed unclassified deny; `@RequirePermission` on remaining controllers; surface-coverage inventory helper.

**Unjustified ideas rejected:** new permission classes; second gate service; classifying Telegram as C8 (would deny the shipped V2 product); People UI; role-assignment HTTP.

### 8. No hidden redesign

| Check                             | Verdict  | Evidence                        |
| --------------------------------- | -------- | ------------------------------- |
| No Version 2.1 rewrite            | **PASS** | US158 paper gate kept           |
| No new IAM / SOC / ABAC product   | **PASS** | Explicitly refused              |
| No Version 2-style RC             | **PASS** | None                            |
| No ADR                            | **PASS** | None                            |
| No silent Master Plan edit        | **PASS** | Unmodified                      |
| Certified V2 products not rebuilt | **PASS** | HTTP owners and paths unchanged |

---

## Close rule

Architecture Review **PASS** for this slice. Package Close is **not** claimed.

Question 8 (architectural deviations): **No.**

---

**STOP.** Wait for Product Owner review before beginning V3-S02-c Role Assignment API.

**End of S02-b Architecture Review.**
