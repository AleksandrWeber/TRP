# V3-S01-e Architecture Review

**Package:** V3-S01 Authentication & Session  
**Slice:** S01-e — Password recovery and authenticated password change  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Existing owner:** Authentication (credentials, lockout, sessions, reset tokens, host mail port) / Identity (profile, role, status)  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §10–11, §16  
**Checklist:** [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md)  
**Nature:** Architecture review. Not an RC. Not an ADR. Not a Spec v2.0 amendment.

---

## Verdict

**PASS for S01-e.** No ownership drift. No new bounded context. No Source of Truth change. Unauthorized architectural deviations: **none**.

Auth remains the only authentication owner. Reset persistence is Auth-owned (`auth_password_resets`). Host mail is an Auth infrastructure port, like JWT signing — not Notification Delivery. No second session owner. Trading Session is unused. No new Source of Truth.

Package Close remains a separate review after this slice is accepted.

---

## Verify

### 1. No ownership drift

| Check                                                                             | Verdict  | Evidence                                                                       |
| --------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| Work landed in the named owner                                                    | **PASS** | Reset store + mail port in `AuthModule` / `AuthenticationService`              |
| Identity remains profile/role/status; Authentication remains credentials/sessions | **PASS** | Identity still password-free. Reset rows are not an Identity product           |
| Ledger / Risk / Gate / Library / Workspace not given new owners                   | **PASS** | Untouched                                                                      |
| Notification Delivery does not own identity mail                                  | **PASS** | Host mail port on Auth only                                                    |
| UI is not Source of Truth                                                         | **PASS** | Reset truth is the Auth store. UI posts the link secret once                   |
| HTTP remains transport                                                            | **PASS** | `/v1/auth/forgot-password`, `/reset-password`, `/change-password`, `/recovery` |

**Must not own:** RBAC (S02), vault (S03), Notification SMTP product (N02).

### 2. No duplicate bounded context

| Check                                                  | Verdict  | Evidence                                                 |
| ------------------------------------------------------ | -------- | -------------------------------------------------------- |
| No second authentication path                          | **PASS** | One `AuthenticationService`                              |
| No new bounded context                                 | **PASS** | No IAM / Recovery-as-a-product module. Pages are Auth UI |
| Persistence/ports only inside existing owner           | **PASS** | `auth_password_resets` + `HostMailPort`                  |
| Trading Session / SessionRecovery* not reused as login | **PASS** | Untouched                                                |

**New context claimed?** None.

### 3. No duplicate Source of Truth

| Check                                     | Verdict  | Evidence                                              |
| ----------------------------------------- | -------- | ----------------------------------------------------- |
| Money remains Ledger                      | **PASS** | Untouched                                             |
| Certification / Gate / Library not cloned | **PASS** | Untouched                                             |
| No parallel identity profiles             | **PASS** | Still `UserDomainService` + `PasswordCredentialStore` |
| UI remains a projection                   | **PASS** | Forgot/reset/change are forms over Auth               |

### 4. Master Plan respected

| Check                                      | Verdict  | Evidence                              |
| ------------------------------------------ | -------- | ------------------------------------- |
| Package ID, wave, capabilities match       | **PASS** | V3-S01, Wave 1, SEC-01 recovery       |
| IN Scope is a subset of the plan           | **PASS** | Forgot/reset + authenticated change   |
| OUT OF Scope names later owners            | **PASS** | MFA Wave 6; N02; S02                  |
| Live capital not authorized                | **PASS** | No live UI                            |
| Contradictions stopped rather than patched | **PASS** | No fake “email sent” when mail is off |

### 5. Product Principles respected

| Principle                    | Verdict            | Evidence                                                            |
| ---------------------------- | ------------------ | ------------------------------------------------------------------- |
| Customer First               | **PASS**           | Recover and change in the UI. No SSH/SQL                            |
| Security Before Convenience  | **PASS**           | Single-use short-lived reset; policy on set                         |
| One Source of Truth          | **PASS**           | One Auth credential + session store                                 |
| Paper First                  | **PASS**           | Paper-first shell                                                   |
| Live Must Be Earned          | **PASS**           | Live not offered                                                    |
| Honest Product               | **PASS**           | Unavailable when mail is off                                        |
| AI Never Controls Capital    | **NOT APPLICABLE** | Untouched                                                           |
| Everything Is Auditable      | **PASS**           | `auth.recover` / `password-change` events without secrets           |
| No Hidden Configuration      | **PASS**           | Host mail is host infra; product does not ask the customer for SMTP |
| Architecture Is a Constraint | **PASS**           | Extension of Auth                                                   |

### 6. Dependencies unchanged

| Check                                           | Verdict  | Evidence                              |
| ----------------------------------------------- | -------- | ------------------------------------- |
| Depends only on certified V2 + named host infra | **PASS** | PC-18 + Postgres + optional host SMTP |
| No later-wave dependency                        | **PASS** | No vault, N02, or live                |
| No Master Plan or Spec change required          | **PASS** |                                       |
| Reuse table honored                             | **PASS** | Major extension of Auth               |

**Dependencies used:** S01-a policy, S01-c/d sessions, bcrypt store.

**Dependencies refused:** Notification catalog, Telegram, Device Trust.

### 7. Architecture impact justified

| Check                                                          | Verdict  | Evidence                                                    |
| -------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| Additions required by named outcomes                           | **PASS** | Master Plan recovery; Implementation Package host mail port |
| Extension of existing owner                                    | **PASS** | Auth persistence + port                                     |
| Canonical Order Path / Ledger / Runtime / Library not replaced | **PASS** | Untouched                                                   |
| Spec v2.0 / Matrix / Alias unchanged                           | **PASS** | Unmodified                                                  |

**Justified additions:** `AuthPasswordReset` table; host SMTP adapter (`nodemailer`) used only when `MAIL_HOST` is set.

**Unjustified ideas rejected:** email-verification gate; Notification-owned identity mail; returning the reset secret in JSON.

### 8. No hidden redesign

| Check                             | Verdict  | Evidence                         |
| --------------------------------- | -------- | -------------------------------- |
| No Version 2.1 rewrite            | **PASS** | Login kept; recovery pages added |
| No new IAM / SOC / ABAC product   | **PASS** | None                             |
| No Version 2-style RC             | **PASS** | None                             |
| No ADR                            | **PASS** | None                             |
| No silent Master Plan edit        | **PASS** | Unmodified                       |
| Certified V2 products not rebuilt | **PASS** | Paper journey unchanged          |

---

## Close rule

Architecture Review **PASS** for this slice. Package Close is **not** claimed.

Question 8 (architectural deviations): **No.**

---

**STOP.** Wait for review before beginning V3-S02.

**End of S01-e Architecture Review.**
