# V3-S02-d Architecture Review

**Package:** V3-S02 RBAC Product  
**Slice:** S02-d — People Product  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Existing owner:** People UI is a projection. Role value: Identity. Authorization: Auth C6. Membership: Workspace. Credentials: Authentication (S01 CLOSED).  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §10–11, §16  
**Checklist:** [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md)  
**Nature:** Architecture review. Not an RC. Not an ADR. Not a Spec v2.0 amendment.

---

## Verdict

**PASS for S02-d.** No ownership drift. No new bounded context. No Source of Truth change. Unauthorized architectural deviations: **none**.

People is customer UI over the S02-c API. Self-role is an Identity invariant (same owner as role), not a UI-only check.

Package Close remains blocked until S02-e is implemented and reviewed.

---

## Verify

### 1. No ownership drift

| Check                                                                             | Verdict  | Evidence                                                                       |
| --------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| Work landed in the named owner                                                    | **PASS** | Web page + catalog in existing shell. Role write remains Identity `assignRole` |
| Identity remains profile/role/status; Authentication remains credentials/sessions | **PASS** | People views have no passwords. `/me` still Authentication                     |
| Ledger / Risk / Gate / Library / Workspace not given new owners                   | **PASS** | Untouched                                                                      |
| UI is not Source of Truth                                                         | **PASS** | People lists and confirms; Identity persists                                   |
| HTTP remains transport                                                            | **PASS** | Existing `/v1/people` routes. No second People API                             |

**Must not own:** credentials/sessions; Workspace membership; vault; live; authorization event log (S02-e / S05).

### 2. No duplicate bounded context

| Check                                                  | Verdict  | Evidence                                              |
| ------------------------------------------------------ | -------- | ----------------------------------------------------- |
| No second authentication, vault, ledger, or order path | **PASS** | Not added                                             |
| No new bounded context unless Master Plan named it     | **PASS** | No People domain module. Controller stays in Identity |
| Persistence/ports added only inside an existing owner  | **PASS** | Self-role uses existing User aggregate. No new table  |
| Trading Session not reused as login                    | **PASS** | Untouched                                             |

**New context claimed?** None.

### 3. No duplicate Source of Truth

| Check                                       | Verdict  | Evidence                                  |
| ------------------------------------------- | -------- | ----------------------------------------- |
| Money remains Ledger                        | **PASS** | Untouched                                 |
| Certification / Gate / Library not cloned   | **PASS** | Untouched                                 |
| No parallel mechanism for identity profiles | **PASS** | One `User.role`. UI drafts are not stored |
| Projections remain projections              | **PASS** | People page is a projection               |

### 4. Master Plan respected

| Check                                      | Verdict  | Evidence                                           |
| ------------------------------------------ | -------- | -------------------------------------------------- |
| Package ID, wave, capabilities match       | **PASS** | V3-S02 Wave 1 People product                       |
| IN Scope is a subset of the plan           | **PASS** | People UI + self-role. No invites                  |
| OUT OF Scope names later owners            | **PASS** | Events S02-e; vault S03; live Wave 6; teams Wave 9 |
| Live capital not authorized                | **PASS** | No live UI                                         |
| Contradictions stopped rather than patched | **PASS** | Self-role in Identity, not only a hidden button    |

### 5. Product Principles respected

| Principle                    | Verdict  | Evidence                                                              |
| ---------------------------- | -------- | --------------------------------------------------------------------- |
| Customer First               | **PASS** | Admin assigns in the shell. No SSH                                    |
| Security Before Convenience  | **PASS** | Own-role blocked even with a second Admin. Confirmation before change |
| One Source of Truth          | **PASS** | Identity role; UI projects                                            |
| Paper First                  | **PASS** | Shell unchanged                                                       |
| Live Must Be Earned          | **PASS** | No live chrome                                                        |
| Honest Product               | **PASS** | Forbidden is unavailable, not empty. People is not invites            |
| AI Never Controls Capital    | **PASS** | Untouched                                                             |
| Everything Is Auditable      | **PASS** | Events remain S02-e as planned                                        |
| No Hidden Configuration      | **PASS** | Four roles on screen                                                  |
| Architecture Is a Constraint | **PASS** | Projection over existing API                                          |

### 6. Dependencies unchanged

| Check                                              | Verdict  | Evidence                         |
| -------------------------------------------------- | -------- | -------------------------------- |
| Depends only on certified V2 and Closed earlier V3 | **PASS** | S01, S02-a/b/c, PC-19/20 shell   |
| No later-wave dependency                           | **PASS** | No vault, connections, live, S05 |
| No Master Plan or Spec change required             | **PASS** | Unmodified                       |
| Reuse table honored                                | **PASS** | AppLayout + Identity assign path |

**Justified additions:** People page; catalog link; self-role Identity invariant.

**Unjustified ideas rejected:** People bounded context; invite product; UI-only self-role (bypassable); moving S02-e logs here.

### 7. Architecture impact justified

Self-role is a named S02-d security outcome (“self-role restrictions”). It belongs with Identity role mutation, not a new policy engine.

### 8. No hidden redesign

No Version 2 rewrite. No IAM product. No RC. No ADR. No Master Plan edit.

---

## Close rule

Architecture Review **PASS** for this slice. Package Close is **not** claimed.

Question 8 (architectural deviations): **No.**

---

**STOP.** Wait for Product Owner review before beginning V3-S02-e.

**End of S02-d Architecture Review.**
