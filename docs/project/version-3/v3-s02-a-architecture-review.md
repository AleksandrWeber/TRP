# V3-S02-a Architecture Review

**Package:** V3-S02 RBAC Product  
**Slice:** S02-a — Permission Model  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Existing owner:** Authorization decision: Auth module in place. Role value: Identity. Membership: Workspace.  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §10–11, §16  
**Checklist:** [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md)  
**Nature:** Architecture review. Not an RC. Not an ADR. Not a Spec v2.0 amendment.

---

## Verdict

**PASS for S02-a.** No ownership drift. No new bounded context. No Source of Truth change. Unauthorized architectural deviations: **none**.

Package Close remains blocked until S02-b … S02-e are implemented and reviewed.

---

## Verify

### 1. No ownership drift

| Check                                                                             | Verdict            | Evidence                                                                                                                     |
| --------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Work landed in the named owner                                                    | **PASS**           | Catalog, matrix, `AuthorizationDecisionService`, and `RolesGuard` stay in `AuthModule` next to `CommandAuthorizationService` |
| Identity remains profile/role/status; Authentication remains credentials/sessions | **PASS**           | `isKnownRole` is a helper on the Identity `Role` enum. Sessions and passwords untouched. Role store still `User.role`        |
| Ledger / Risk / Gate / Library / Workspace not given new owners                   | **PASS**           | Untouched. Membership still `WorkspaceAccessService`                                                                         |
| Notification Delivery / Telegram                                                  | **NOT APPLICABLE** | Not touched                                                                                                                  |
| UI is not Source of Truth                                                         | **PASS**           | No UI in this slice                                                                                                          |
| HTTP remains transport                                                            | **PASS**           | No new routes                                                                                                                |

**Must not own:** credentials/sessions (S01 CLOSED); Workspace membership; People product (S02-d); Vault (S03); live enablement (Wave 6).

### 2. No duplicate bounded context

| Check                                                  | Verdict  | Evidence                                                                 |
| ------------------------------------------------------ | -------- | ------------------------------------------------------------------------ |
| No second authentication, vault, ledger, or order path | **PASS** | Forbidden and not added                                                  |
| No new bounded context unless Master Plan named it     | **PASS** | No IAM / RBAC / People domain module. Policy files live in existing Auth |
| Persistence/ports added only inside an existing owner  | **PASS** | No new tables. Identity already persists role                            |
| Trading Session / SessionRecovery* not reused as login | **PASS** | Untouched                                                                |

**New context claimed?** None.

### 3. No duplicate Source of Truth

| Check                                                           | Verdict  | Evidence                                                   |
| --------------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| Money remains Ledger                                            | **PASS** | Untouched                                                  |
| Certification / Gate / Library not cloned                       | **PASS** | Untouched                                                  |
| No parallel mechanism for risk, lifecycle, or identity profiles | **PASS** | One `User.role`. Matrix is policy, not a second role store |
| Projections remain projections                                  | **PASS** | No People UI yet                                           |

### 4. Master Plan respected

| Check                                      | Verdict  | Evidence                                                                                                   |
| ------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| Package ID, wave, capabilities match       | **PASS** | V3-S02, Wave 1, SEC-02 / SEC-03 (policy portion)                                                           |
| IN Scope is a subset of the plan           | **PASS** | Permission model and default-deny policy only                                                              |
| OUT OF Scope names later owners            | **PASS** | Surface coverage S02-b; People S02-c/d; vault S03; live Wave 6; teams Wave 9                               |
| Live capital not authorized                | **PASS** | C7 empty for every role                                                                                    |
| Contradictions stopped rather than patched | **PASS** | Allow-by-omission on unclassified routes left for S02-b so certified journeys are not broken in this slice |

### 5. Product Principles respected

| Principle                    | Verdict            | Evidence                                                                                        |
| ---------------------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| Customer First               | **PASS**           | Policy is the foundation for later People; no SSH required to _have_ a consistent decision      |
| Security Before Convenience  | **PASS**           | Default deny; unknown anything fails closed; no Admin-by-register                               |
| One Source of Truth          | **PASS**           | Identity role + Workspace membership + Authz decides only                                       |
| Paper First                  | **PASS**           | C5 remains Trader/Admin; live off                                                               |
| Live Must Be Earned          | **PASS**           | C7 denied                                                                                       |
| Honest Product               | **PASS**           | No People UI pretending assignment shipped                                                      |
| AI Never Controls Capital    | **NOT APPLICABLE** | Untouched                                                                                       |
| Everything Is Auditable      | **PASS**           | Decision reasons are structured (`unknown_role`, `missing_permission`, …). Audit product is S05 |
| No Hidden Configuration      | **PASS**           | Matrix is code policy, not a customer `.env`                                                    |
| Architecture Is a Constraint | **PASS**           | Extension of Auth + Identity helper, not a redesign                                             |

### 6. Dependencies unchanged

| Check                                              | Verdict  | Evidence                                    |
| -------------------------------------------------- | -------- | ------------------------------------------- |
| Depends only on certified V2 and Closed earlier V3 | **PASS** | PC-18, US107, US158, S01 Closed             |
| No later-wave dependency                           | **PASS** | No vault, connections, live ADR             |
| No Master Plan or Spec change required             | **PASS** | Compiles and tests without plan edits       |
| Reuse table honored                                | **PASS** | Major extension Identity/Auth (policy part) |

**Dependencies used:** Identity `Role`, `RolesGuard`, `CommandAuthorizationService`, `WorkspaceAccessService`.

**Dependencies refused:** People HTTP, membership table, ABAC engine, new IAM module.

### 7. Architecture impact justified

| Check                                                          | Verdict  | Evidence                                      |
| -------------------------------------------------------------- | -------- | --------------------------------------------- |
| Additions required by named outcomes                           | **PASS** | SEC-02 / SEC-03 permission model              |
| Extension of existing owner                                    | **PASS** | Policy helpers + decision service inside Auth |
| Canonical Order Path / Ledger / Runtime / Library not replaced | **PASS** | Untouched                                     |
| Spec v2.0 / Matrix / Alias unchanged                           | **PASS** | Unmodified                                    |

**Justified additions:** permission catalog, explicit role matrix, `AuthorizationDecisionService`, `@RequirePermission`, `isKnownRole`.

**Unjustified ideas rejected:** new RBAC bounded context; role inheritance; per-workspace role table; classifying remaining HTTP in this slice; People UI.

### 8. No hidden redesign

| Check                             | Verdict  | Evidence              |
| --------------------------------- | -------- | --------------------- |
| No Version 2.1 rewrite            | **PASS** | US158 paper gate kept |
| No new IAM / SOC / ABAC product   | **PASS** | Explicitly refused    |
| No Version 2-style RC             | **PASS** | None                  |
| No ADR                            | **PASS** | None                  |
| No silent Master Plan edit        | **PASS** | Unmodified            |
| Certified V2 products not rebuilt | **PASS** | Untouched             |

---

## Close rule

Architecture Review **PASS** for this slice. Package Close is **not** claimed.

Question 8 (architectural deviations): **No.**

---

**STOP.** Wait for review before beginning S02-b.

**End of S02-a Architecture Review.**
