# V3-S02-e Architecture Review

**Package:** V3-S02 RBAC Product  
**Slice:** S02-e — Privilege Constraints & Authorization Events  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Existing owner:** Authentication / RBAC records authorization decisions. Identity owns `User.role`. Workspace owns membership. Logger (US111) is the existing event model.  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §10–11, §16  
**Checklist:** [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md)  
**Nature:** Architecture review. Not an RC. Not an ADR. Not a Spec v2.0 amendment.

---

## Verdict

**PASS for S02-e.** No ownership drift. No new bounded context. No Source of Truth change. Unauthorized architectural deviations: **none**.

Identity still owns roles. RBAC still authorizes. Authorization events record decisions. The Events campaign bus is unused. S05 is not started.

Package Close remains blocked until Product Owner review.

---

## Verify

### 1. No ownership drift

| Check                                                                             | Verdict  | Evidence                                                                                       |
| --------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| Work landed in the named owner                                                    | **PASS** | Role-change logs on the People/Identity assignment path. C6 deny in RolesGuard (authorization) |
| Identity remains profile/role/status; Authentication remains credentials/sessions | **PASS** | No password or session writes. `/me` unchanged                                                 |
| Ledger / Risk / Gate / Library / Workspace not given new owners                   | **PASS** | Constraints tests assert they were not bypassed or rewritten                                   |
| UI is not Source of Truth                                                         | **PASS** | Own-role refusal is Identity. People shows the explanation                                     |
| HTTP remains transport                                                            | **PASS** | Existing People routes. No second events API                                                   |

**Must not own:** credentials/sessions; Workspace membership; vault; live; S05 audit product.

### 2. No duplicate bounded context

| Check                                                  | Verdict  | Evidence                                                               |
| ------------------------------------------------------ | -------- | ---------------------------------------------------------------------- |
| No second authentication, vault, ledger, or order path | **PASS** | Not added                                                              |
| No new bounded context unless Master Plan named it     | **PASS** | No Authorization Events module. Helpers live in Auth next to the guard |
| Persistence/ports added only inside an existing owner  | **PASS** | Existing Logger port. No new table                                     |
| Trading Session not reused as login                    | **PASS** | Untouched                                                              |
| Events product bus not reused as SoT                   | **PASS** | Domain `EventsModule` is not the authorization record                  |

**New context claimed?** None.

### 3. No duplicate Source of Truth

| Check                                       | Verdict  | Evidence                                                      |
| ------------------------------------------- | -------- | ------------------------------------------------------------- |
| Money remains Ledger                        | **PASS** | Untouched                                                     |
| Certification / Gate / Library not cloned   | **PASS** | No override path added                                        |
| No parallel mechanism for identity profiles | **PASS** | One `User.role`                                               |
| Projections remain projections              | **PASS** | Logs are not a second role store. People remains a projection |

### 4. Master Plan respected

| Check                                      | Verdict  | Evidence                                                     |
| ------------------------------------------ | -------- | ------------------------------------------------------------ |
| Package ID, wave, capabilities match       | **PASS** | V3-S02 Wave 1 privilege constraints and authorization events |
| IN Scope is a subset of the plan           | **PASS** | Structured logs, constraints, required People explanation    |
| OUT OF Scope names later owners            | **PASS** | S05 audit UI; S06 isolation product; S03 vault; live Wave 6  |
| Live capital not authorized                | **PASS** | C7 still unbound. No live chrome                             |
| Contradictions stopped rather than patched | **PASS** | Own-role still Identity; UI does not become the only check   |

### 5. Product Principles respected

| Principle                    | Verdict  | Evidence                                                                 |
| ---------------------------- | -------- | ------------------------------------------------------------------------ |
| Customer First               | **PASS** | Own-role refusal is visible in People, not only an HTTP status           |
| Security Before Convenience  | **PASS** | Admin cannot skip Gate/Risk. Own-role still denied                       |
| One Source of Truth          | **PASS** | Role in Identity. Membership in Workspace. Logs are not a competing role |
| Paper First                  | **PASS** | Unchanged                                                                |
| Live Must Be Earned          | **PASS** | C7 / live UI still absent                                                |
| Honest Product               | **PASS** | Denied own-role shows an explanation. Events overview does not claim S05 |
| AI Never Controls Capital    | **PASS** | Untouched                                                                |
| Everything Is Auditable      | **PASS** | Role change and C6 deny recorded. Audit _product_ remains S05            |
| No Hidden Configuration      | **PASS** | No new roles or hidden Admin skip                                        |
| Architecture Is a Constraint | **PASS** | Existing Logger; three owners unchanged                                  |

### 6. Dependencies unchanged

| Check                                              | Verdict  | Evidence                             |
| -------------------------------------------------- | -------- | ------------------------------------ |
| Depends only on certified V2 and Closed earlier V3 | **PASS** | S01 CLOSED; S02-a…d accepted         |
| No later-wave dependency                           | **PASS** | Logs do not require S05 to function  |
| No Master Plan or Spec change required             | **PASS** | Unmodified                           |
| Reuse table honored                                | **PASS** | Logger, RolesGuard, People, Identity |

**Justified additions:** `authorization-events.ts` helpers; C6 logging in RolesGuard; People own-row confirm path so the walkthrough is a real attempt.

**Unjustified ideas rejected:** new Events bounded context; persisting to the campaign event bus; S05 UI; ABAC; membership rewrite.

### 7. Architecture impact justified

Recording decisions is the named S02-e outcome. Using the existing Logger keeps one event model. Enabling the own-row control is the minimum UI so “tries to change own role” is a product journey, not an API-only check. Identity remains the deny.

### 8. No hidden redesign

No Version 2 rewrite. No IAM product. No RC. No ADR. No Master Plan edit. No S03.

---

## Close rule

Architecture Review **PASS** for this slice. Package Close is **not** claimed.

Question 8 (architectural deviations): **No.**

---

**STOP.** Wait for Product Owner review before V3-S02 Package Close.

**End of S02-e Architecture Review.**
