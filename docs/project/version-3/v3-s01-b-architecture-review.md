# V3-S01-b Architecture Review

**Package:** V3-S01 Authentication & Session
**Slice:** S01-b — Login & Lockout
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Stage:** Post-implementation slice review — **not** package Close
**Existing owner:** Authentication (credentials, lockout) / Identity (profile, role, status)
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §10–11, §16
**Checklist:** [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md)
**Nature:** Architecture review. Not an RC. Not an ADR. Not a Spec v2.0 amendment.

---

## Verdict

**PASS for S01-b.** No ownership drift. No new bounded context. No Source of Truth change. Unauthorized architectural deviations: **none**.

Package Close remains blocked until S01-c … S01-e are implemented and reviewed.

---

## Verify

### 1. No ownership drift

| Check                                                                    | Verdict  | Evidence                                                                      |
| ------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------- |
| Work landed in the named owner                                           | **PASS** | Lockout lives in `AuthModule` / `AuthenticationService` / `LoginLockoutStore` |
| Identity remains profile/role/status; Authentication remains credentials | **PASS** | Identity still password-free; lockout is not an Identity product              |
| Ledger / Risk / Gate / Library / Workspace not given new owners          | **PASS** | Untouched                                                                     |
| Notification Delivery does not own identity mail                         | **PASS** | No mail in this slice                                                         |
| UI is not Source of Truth                                                | **PASS** | UI maps 401s; API enforces lockout                                            |
| HTTP remains transport                                                   | **PASS** | Existing `POST /v1/auth/login`                                                |

**Must not own:** sessions product (S01-c/d), recovery mail (S01-e), RBAC (S02), vault (S03).

### 2. No duplicate bounded context

| Check                                                  | Verdict  | Evidence                                                                         |
| ------------------------------------------------------ | -------- | -------------------------------------------------------------------------------- |
| No second authentication path                          | **PASS** | One `AuthenticationService.login`                                                |
| No new bounded context                                 | **PASS** | No IAM / SSO / Device Trust module                                               |
| Persistence/ports only inside existing owner           | **PASS** | `auth_login_lockouts` is Auth persistence, as the Implementation Package allowed |
| Trading Session / SessionRecovery* not reused as login | **PASS** | Untouched; lockout table is not an auth session store                            |

**New context claimed?** None.

### 3. No duplicate Source of Truth

| Check                                     | Verdict  | Evidence                        |
| ----------------------------------------- | -------- | ------------------------------- |
| Money remains Ledger                      | **PASS** | Untouched                       |
| Certification / Gate / Library not cloned | **PASS** | Untouched                       |
| No parallel identity profiles             | **PASS** | Still `UserDomainService`       |
| UI remains a projection                   | **PASS** | Sign-in form is not lockout SoT |

### 4. Master Plan respected

| Check                                      | Verdict  | Evidence                                                 |
| ------------------------------------------ | -------- | -------------------------------------------------------- |
| Package ID, wave, capabilities match       | **PASS** | V3-S01, Wave 1, SEC-01 (login/lockout portion)           |
| IN Scope is a subset of the plan           | **PASS** | Login + lockout only                                     |
| OUT OF Scope names later owners            | **PASS** | Refresh/sessions S01-c/d; recovery S01-e; MFA Wave 6     |
| Live capital not authorized                | **PASS** | No live UI                                               |
| Contradictions stopped rather than patched | **PASS** | Refresh, remember-me, and trusted devices were not added |

### 5. Product Principles respected

| Principle                    | Verdict            | Evidence                                                          |
| ---------------------------- | ------------------ | ----------------------------------------------------------------- |
| Customer First               | **PASS**           | Sign-in remains in the product UI                                 |
| Security Before Convenience  | **PASS**           | Spray locks; no remember-me                                       |
| One Source of Truth          | **PASS**           | One Auth lockout store                                            |
| Paper First                  | **PASS**           | Paper-first copy unchanged                                        |
| Live Must Be Earned          | **PASS**           | Live not offered                                                  |
| Honest Product               | **PASS**           | Generic errors; no “account locked” enumeration                   |
| AI Never Controls Capital    | **NOT APPLICABLE** | Slice does not touch AI                                           |
| Everything Is Auditable      | **PASS**           | Structured login/lockout logs; no secrets                         |
| No Hidden Configuration      | **PASS**           | 5 failures / 15 minutes are product behavior, not customer `.env` |
| Architecture Is a Constraint | **PASS**           | Extension of Auth, not a redesign                                 |

### 6. Dependencies unchanged

| Check                                           | Verdict  | Evidence                                                                  |
| ----------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| Depends only on certified V2 + named host infra | **PASS** | PC-18 Identity/Auth + Postgres                                            |
| No later-wave dependency                        | **PASS** | No vault, notifications, or live                                          |
| No Master Plan or Spec change required          | **PASS** | Compiles and tests without plan edits                                     |
| Reuse table honored                             | **PASS** | Major extension of Auth is the S01 stance; this slice is the lockout part |

**Dependencies used:** PC-18 Identity, existing bcrypt store, existing login UI, Prisma.

**Dependencies refused:** Notification platform, session module, Device Trust, second login stack.

### 7. Architecture impact justified

| Check                                                          | Verdict  | Evidence                                            |
| -------------------------------------------------------------- | -------- | --------------------------------------------------- |
| Additions required by named outcomes                           | **PASS** | Security Vision lockout + Master Plan SEC-01        |
| Extension of existing owner                                    | **PASS** | Auth persistence for failed attempts / locked-until |
| Canonical Order Path / Ledger / Runtime / Library not replaced | **PASS** | Untouched                                           |
| Spec v2.0 / Matrix / Alias unchanged                           | **PASS** | Unmodified                                          |

**Justified additions:** `AuthLoginLockout` table and `LoginLockoutStore` inside Authentication.

**Unjustified ideas rejected:** refresh tokens; cookie sessions; remember-me; trusted devices; Identity-owned lockout columns as a new people product.

### 8. No hidden redesign

| Check                             | Verdict  | Evidence                       |
| --------------------------------- | -------- | ------------------------------ |
| No Version 2.1 rewrite            | **PASS** | PC-18 login kept               |
| No new IAM / SOC / ABAC product   | **PASS** | None                           |
| No Version 2-style RC             | **PASS** | None                           |
| No ADR                            | **PASS** | None                           |
| No silent Master Plan edit        | **PASS** | Unmodified                     |
| Certified V2 products not rebuilt | **PASS** | Paper operator shell unchanged |

---

## Close rule

Architecture Review **PASS** for this slice. Package Close is **not** claimed.

Question 8 (architectural deviations): **No.**

---

**STOP.** Wait for review before beginning S01-c.

**End of S01-b Architecture Review.**
