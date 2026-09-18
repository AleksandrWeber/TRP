# FIV-CONN-04-B PO/Governance Implementation Authorization

**Document:** FIV-CONN-04-B Write-Gate / Lifecycle Mutation Lock — Implementation Authorization  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B — Write-gate / lifecycle mutation lock  
**Authority:** Product Owner / Chief Architect  
**Nature:** **GOVERNANCE IMPLEMENTATION AUTHORIZATION ONLY.** Grants wave/slice-level permission to proceed toward FIV-CONN-04-B implementation under mandatory conditions and remaining slice lifecycle gates. Does **not** start implementation in this act. Does **not** create migrations, lease tables, deny hooks, or mutate Connections/Vault/credentials. Does **not** authorize FIV/C7/venue I/O/capital. Does **not** authorize FIV-CONN-04-C/D/E or LIVE backfill.

**Governance chain:**

```text
Planning Package
  → PO/Governance Planning Review + Decision Freeze
  → Architecture Review
  → Security Review
  → Implementation Authorization   ← THIS ARTIFACT
  → Slice Planning / Slice Approval (next)
  → Implementation (not this act)
  → PO Review → Closure
```

**Basis artifacts:**

| Artifact                     | Path                                                                                                                     | Status / Commit                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| Planning Package             | [`v3-l02-fiv-conn-04-b-planning-package.md`](./v3-l02-fiv-conn-04-b-planning-package.md)                                 | COMPLETE (`5c3fb87…`)                 |
| PO Planning Review           | [`v3-l02-fiv-conn-04-b-po-planning-review.md`](./v3-l02-fiv-conn-04-b-po-planning-review.md)                             | **PASS** (`aaf2f70…`)                 |
| PO Decision Freeze           | [`v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md)       | OD-B-01…08 **FROZEN** (`aaf2f70…`)    |
| Architecture Review          | [`v3-l02-fiv-conn-04-b-architecture-review.md`](./v3-l02-fiv-conn-04-b-architecture-review.md)                           | **PASS WITH CONDITIONS** (`852c6f1…`) |
| Security Review              | [`v3-l02-fiv-conn-04-b-security-review.md`](./v3-l02-fiv-conn-04-b-security-review.md)                                   | **PASS WITH CONDITIONS** (`3ad6a07…`) |
| Parent Arch/Sec Confirmation | [`v3-l02-fiv-conn-04-architecture-security-confirmation.md`](./v3-l02-fiv-conn-04-architecture-security-confirmation.md) | PASS WITH CONDITIONS                  |
| Parent Slice Approval        | [`v3-l02-fiv-conn-04-po-governance-slice-approval.md`](./v3-l02-fiv-conn-04-po-governance-slice-approval.md)             | GRANTED (parent CONN-04)              |
| FIV-CONN-04-A Closure        | [`v3-l02-fiv-conn-04-a-closure.md`](./v3-l02-fiv-conn-04-a-closure.md)                                                   | CLOSED                                |

**Repository baseline (authorization start):** `3ad6a076f21367e17648ef42ffc6142703d8a2b4` (`HEAD == origin/main`)

```text
FIV-CONN-04-B IMPLEMENTATION AUTHORIZATION = GRANTED

Implementation NOT STARTED by this act
Next gate: FIV-CONN-04-B Slice Planning / Slice Approval
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Authorization Scope

This authorization applies **ONLY** to FIV-CONN-04-B write-gate / lifecycle mutation lock work within:

- Frozen OD-B-01…OD-B-08
- Mandatory COND-ARCH-B01…B10
- Mandatory COND-SEC-B01…B11
- SEC-B01…SEC-B14
- SEC-AC-01…SEC-AC-24 (incl. SEC-AC-23/24)
- Security tests T-01…T-20 plus ST-B21…ST-B26
- Approved sub-slices **B-01…B-06**

```text
AUTHORIZES:
  Proceeding through remaining FIV-CONN-04-B slice lifecycle gates
  toward implementation of the write gate under the frozen design

DOES NOT AUTHORIZE:
  Starting code/schema/migration work in THIS act
  Bypassing B-01…B-06 Slice Planning / Slice Approval gates
  Uncontrolled single-change delivery of all sub-slices
  FIV-CONN-04-C / 04-D / 04-E
  LIVE backfill / Vault mutation / FIV / C7 / capital
```

---

## 2. Governance Baseline

```text
CLOSED:
  FIV-CRED-01, FIV-CONN-01, FIV-CONN-02, FIV-CONN-03, FIV-CONN-04-A

FROZEN (not reopened):
  D-CRED-02-01…14 (incl. D-CRED-02-12)
  D-CONN-03-01…05
  D-CONN-04-01…10 (incl. D-CONN-04-08 write gate)
  OD-B-01…OD-B-08

FIV-CONN-04 parent Slice Approval: GRANTED
FIV-CONN-04 parent: NOT CLOSED
FIV-PRE-01: NOT CLOSED
FIV: NOT AUTHORIZED / NOT PERFORMED
C7: DENY-ALL
allowRealVenueIo: FALSE
LIVE CAPITAL: NOT ACTIVATED
```

### Authority checklist (this act)

| Check                                           | Result                     |
| ----------------------------------------------- | -------------------------- |
| Planning Review = PASS                          | **YES**                    |
| Architecture = PASS WITH CONDITIONS; no BLOCKED | **YES**                    |
| Security = PASS WITH CONDITIONS; no BLOCKED     | **YES**                    |
| OD-B-01…08 frozen                               | **YES**                    |
| Mandatory conditions identifiable               | **YES** (§7–§11)           |
| Implementation scope bounded                    | **YES** (§19–§20)          |
| 04-B ownership distinct from 04-A/C/D/E         | **YES** (§21)              |
| Safety boundaries intact                        | **YES** (§17 Safety State) |

---

## 3. Planning Review Result

```text
PO/GOVERNANCE PLANNING REVIEW = PASS
Decision Freeze companion = GRANTED (OD-B-01…08)
Blockers = NONE
```

---

## 4. Architecture Review Result

```text
ARCHITECTURE REVIEW = PASS WITH CONDITIONS
BLOCKED findings = NONE
Mandatory conditions = COND-ARCH-B01…B10 (accepted; not weakened)
```

---

## 5. Security Review Result

```text
SECURITY REVIEW = PASS WITH CONDITIONS
BLOCKED findings = NONE
Mandatory conditions = COND-SEC-B01…B11 + SEC-B01…B14 + SEC-AC-23/24 + ST-B21…ST-B26
(accepted; not weakened)
```

---

## 6. Frozen OD-B-01…OD-B-08

| ID          | Frozen decision                                                                                    | Status      |
| ----------- | -------------------------------------------------------------------------------------------------- | ----------- |
| **OD-B-01** | **F** Global authorized migration window; ≤4h; deny-set only; not permanent                        | **BINDING** |
| **OD-B-02** | Credential store/replace/revoke **DENY** all connectionTypes; NON-EXCHANGE create/rename **ALLOW** | **BINDING** |
| **OD-B-03** | Disconnect/disable **ALLOW** (status-only; no Vault/`vaultSecretId`/environment mutation)          | **BINDING** |
| **OD-B-04** | Dedicated singleton DB lease + `ConnectionsService` deny hooks; advisory optional only             | **BINDING** |
| **OD-B-05** | TTL + heartbeat + fencing; stale cannot mutate; expiry reclaim; audited operator reclaim           | **BINDING** |
| **OD-B-06** | Durable Security Audit `connection.migration-gate`; no secrets                                     | **BINDING** |
| **OD-B-07** | Normative operation matrix (DENY/ALLOW/N/A as frozen)                                              | **BINDING** |
| **OD-B-08** | Immediate deterministic rejection; no queue/wait/blind retry                                       | **BINDING** |

---

## 7. Mandatory COND-ARCH-B01…B10

| ID                | Condition                                                                                                                  | Authorization status     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **COND-ARCH-B01** | Heartbeat/`expiresAt` MUST NOT extend past `acquiredAt + maxWindow` (≤4h unless later PO extends)                          | **ACCEPTED / MANDATORY** |
| **COND-ARCH-B02** | Lease TTL and max migration window are distinct concepts                                                                   | **ACCEPTED / MANDATORY** |
| **COND-ARCH-B03** | Durable singleton DB lease is multi-instance SoT; process-local never authoritative                                        | **ACCEPTED / MANDATORY** |
| **COND-ARCH-B04** | Privileged 04-D writes MUST validate holder+fencing+non-expired ON via **DB CAS in same transaction** as Connection UPDATE | **ACCEPTED / MANDATORY** |
| **COND-ARCH-B05** | Deny-set paths observe durable ON; re-validate before Connection bind after Vault I/O or fail closed                       | **ACCEPTED / MANDATORY** |
| **COND-ARCH-B06** | Operator reclaim MUST bump/invalidate fencing + durable audit                                                              | **ACCEPTED / MANDATORY** |
| **COND-ARCH-B07** | Audit payloads MUST NOT use sensitive-key-rejected field names (e.g. avoid `fencingToken` / `/token/`)                     | **ACCEPTED / MANDATORY** |
| **COND-ARCH-B08** | Register `connection.migration-gate` in classification + attribution before emission                                       | **ACCEPTED / MANDATORY** |
| **COND-ARCH-B09** | Unreadable gate state ⇒ fail closed (deny mutations; refuse 04-D start)                                                    | **ACCEPTED / MANDATORY** |
| **COND-ARCH-B10** | No Vault/external I/O inside lease acquire/release transactions                                                            | **ACCEPTED / MANDATORY** |

```text
No COND-ARCH condition may be silently weakened.
```

---

## 8. Mandatory COND-SEC-B01…B11

| ID               | Condition                                                                                                                 | Authorization status     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **COND-SEC-B01** | Enforce heartbeat ≤ `acquiredAt + maxWindow` (≤4h)                                                                        | **ACCEPTED / MANDATORY** |
| **COND-SEC-B02** | Same-txn durable fencing CAS for privileged env writes; check-then-save alone = security defect                           | **ACCEPTED / MANDATORY** |
| **COND-SEC-B03** | Operator reclaim bumps fencing + audit; old fence dead                                                                    | **ACCEPTED / MANDATORY** |
| **COND-SEC-B04** | No new worker/job/admin utility mutates deny-set without durable gate                                                     | **ACCEPTED / MANDATORY** |
| **COND-SEC-B05** | Migration runner must hold valid lease+fence; no ungated env backfill scripts                                             | **ACCEPTED / MANDATORY** |
| **COND-SEC-B06** | Blocked-mutation audits attribute target `workspaceId`; global acquire/release must not claim foreign workspace authority | **ACCEPTED / MANDATORY** |
| **COND-SEC-B07** | Audit payload keys must pass `SENSITIVE_KEY` filter                                                                       | **ACCEPTED / MANDATORY** |
| **COND-SEC-B08** | Deny hooks cover store/replace/revoke + EXCHANGE create; no ungated twins                                                 | **ACCEPTED / MANDATORY** |
| **COND-SEC-B09** | Ordinary clients cannot acquire/release migration lease                                                                   | **ACCEPTED / MANDATORY** |
| **COND-SEC-B10** | Unreadable gate state ⇒ deny + refuse 04-D                                                                                | **ACCEPTED / MANDATORY** |
| **COND-SEC-B11** | Security tests include ST-B21…ST-B26 (or equivalent)                                                                      | **ACCEPTED / MANDATORY** |

### Verification requirement

Any future implementation plan / Slice Approval must state **how each** COND-SEC-B01…B11 will be verified (unit/integration/concurrency/audit tests). This is not optional.

---

## 9. Mandatory SEC-B01…B14

| ID      | Topic                                             | Status under this authorization |
| ------- | ------------------------------------------------- | ------------------------------- |
| SEC-B01 | Workspace isolation                               | **MANDATORY**                   |
| SEC-B02 | No cross-workspace data authority via global gate | **MANDATORY**                   |
| SEC-B03 | No provider-only lock identity                    | **MANDATORY**                   |
| SEC-B04 | No environment-only lock identity                 | **MANDATORY**                   |
| SEC-B05 | No Vault mutation by 04-B                         | **MANDATORY**                   |
| SEC-B06 | No secret leakage                                 | **MANDATORY**                   |
| SEC-B07 | Fail-closed contention                            | **MANDATORY**                   |
| SEC-B08 | Stale holder fencing                              | **MANDATORY**                   |
| SEC-B09 | Retries cannot bypass                             | **MANDATORY**                   |
| SEC-B10 | No alternate app-path bypass                      | **MANDATORY**                   |
| SEC-B11 | Multi-instance durable SoT                        | **MANDATORY**                   |
| SEC-B12 | Audit integrity                                   | **MANDATORY**                   |
| SEC-B13 | Gate not openable by ordinary clients             | **MANDATORY**                   |
| SEC-B14 | Not a permanent standing freeze                   | **MANDATORY**                   |

---

## 10. Security Acceptance Criteria (incl. SEC-AC-23/24)

SEC-AC-01…SEC-AC-22 from Security Review remain binding.

| ID            | Criterion                                                                      | Status        |
| ------------- | ------------------------------------------------------------------------------ | ------------- |
| **SEC-AC-23** | Mid-flight gate acquire cannot complete unsafe Connection bind after Vault I/O | **MANDATORY** |
| **SEC-AC-24** | 04-B itself performs zero Vault mutate and zero env UPDATE                     | **MANDATORY** |

Implementation verification of SEC-AC-01…24 is required before FIV-CONN-04-B Closure.

---

## 11. ST-B21…ST-B26 Requirements

| ID         | Required coverage                                                       | Status        |
| ---------- | ----------------------------------------------------------------------- | ------------- |
| **ST-B21** | Unauthorized / ordinary client cannot acquire lease                     | **MANDATORY** |
| **ST-B22** | Heartbeat cannot extend past `acquiredAt + 4h`                          | **MANDATORY** |
| **ST-B23** | Stale owner UPDATE rejected after fence bump (CAS TOCTOU fixture)       | **MANDATORY** |
| **ST-B24** | Operator reclaim bumps fence; old fence rejected; audit present         | **MANDATORY** |
| **ST-B25** | Mid-flight: Vault I/O then gate ON → Connection bind fails closed       | **MANDATORY** |
| **ST-B26** | Audit payload rejects sensitive keys; accepted fence field name records | **MANDATORY** |

Plus planning tests T-01…T-20 remain required base coverage.

---

## 12. Critical Fencing Requirement

```text
A stale owner MUST NOT mutate.

Check-then-save fencing alone is FORBIDDEN as the sole control.

REQUIRED:
  same-transaction durable CAS fencing for privileged 04-D writes
  (COND-ARCH-B04 / COND-SEC-B02)

Owner A (fence N) → expiry → Owner B (N+1) → A mutates
  ⇒ A MUST be REJECTED
```

---

## 13. TTL / 4h Requirement

```text
Maximum authorized migration window: ≤ 4 hours from acquiredAt
  (unless a later explicit PO decision extends)

Lease TTL / heartbeat = liveness of current hold
Max window = hard governance ceiling

Heartbeat MUST NOT extend authority beyond acquiredAt + maxWindow
(COND-ARCH-B01/B02 / COND-SEC-B01)
```

---

## 14. Stale Reclaim Requirement

```text
Operator reclaim MUST:
  - authorize privileged reclaim only
  - bump/invalidate fencing
  - emit durable audit
  - leave prior fencing token without mutation authority

Stale ownership MUST NOT regain authority
(COND-ARCH-B06 / COND-SEC-B03)
```

---

## 15. Fail-Closed Requirement

```text
Unread / unknown / invalid gate state
  ⇒ MUST NOT be interpreted as permission to mutate

Deny-set mutations: DENY
04-D start: REFUSE
(COND-ARCH-B09 / COND-SEC-B10)
```

---

## 16. Bypass Protection Requirement

```text
NO supported application path may bypass the gate.

Must cover:
  REST controllers
  ConnectionsService deny-set methods
  credential paths (via ConnectionsService)
  workers / scheduled jobs (none today; future must gate)
  admin / migration utilities (must use lease APIs)

Trust boundaries:
  Application runtime  = Nest app paths (gated)
  Database             = durable lease SoT + Strategy B uniqueness
  Vault                = credential SoT (04-B does not mutate)
  Direct Prisma / DBA  = operational trust residual — NOT an app bypass mechanism

Implementation MUST NOT introduce an ungated supported application path.
```

---

## 17. Model C Requirement

```text
Vault purpose = runtime credential SoT
Connection.environment = environment constraint / audit context

MUST NOT:
  - client-selected SecretPurpose via gate
  - provider-only resolution
  - cross-environment fallback
  - sibling-secret substitution
  - Vault purpose mutation by 04-B
```

---

## 18. Strategy B Requirement

```text
(workspaceId, provider, environment) uniqueness remains authoritative
  for credentialed non-REVOKED EXCHANGE Connections

Gate DENY EXCHANGE create during window
DB unique index remains final backstop

NO cleanup / merge / substitution (D-CONN-04-05)
```

---

## 19. Approved B-01…B-06 Implementation Scope

| Sub-slice | Scope                                                                   | Authorized under this act?                      |
| --------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| **B-01**  | Gate domain/contract                                                    | Governance-authorized subject to Slice Approval |
| **B-02**  | Durable lease (incl. schema/migration when Slice-Approved)              | Governance-authorized subject to Slice Approval |
| **B-03**  | Lifecycle enforcement (`ConnectionsService` deny hooks)                 | Governance-authorized subject to Slice Approval |
| **B-04**  | 04-D integration boundary (refuse D without lease+fence; no D backfill) | Governance-authorized subject to Slice Approval |
| **B-05**  | Audit/security regression tests                                         | Governance-authorized subject to Slice Approval |
| **B-06**  | Crash/concurrency verification                                          | Governance-authorized subject to Slice Approval |

Repository changes are limited to those necessary to satisfy B-01…B-06 under frozen decisions and mandatory conditions.

```text
This authorization is NOT blanket permission to implement all B-01…B-06
without the required per-sub-slice lifecycle gates.
```

---

## 20. Explicit Non-Scope

```text
EXCLUDED from this authorization:
  - FIV-CONN-04-A modifications
  - FIV-CONN-04-C Vault-proven classifier delivery
  - FIV-CONN-04-D actual environment backfill / per-row UPDATE execution
  - FIV-CONN-04-E residual verification execution
  - Vault mutation
  - Credential provisioning / replacement / revocation (as business ops)
  - Binance / Binance Testnet / venue I/O
  - FIV execution
  - Live trading / live capital
  - C7 activation
  - allowRealVenueIo changes
  - Permanent global credential freeze
  - Implementation work inside THIS authorization act
```

```text
FIV-CONN-04-B provides the gate required by later 04-D.
It does NOT itself perform the 04-D backfill.
```

---

## 21. 04-D Integration Boundary

| Owner    | Owns                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| **04-B** | Migration gate; lease; fencing; TTL/heartbeat; lifecycle exclusion; gate audit; refuse D without proof            |
| **04-D** | Vault-proven LIVE classification application; conditional `environment` UPDATE; per-row audit; backfill execution |

Hard precondition for any future 04-D write (not authorized here):

```text
durable lease ON
  + matching holderId
  + matching fencingToken
  + non-expired
  + proven in SAME DB transaction as conditional UPDATE
Vault metadata reads remain OUTSIDE that transaction
```

---

## 22. Implementation Acceptance Gate

Before FIV-CONN-04-B may be closed, implementation must demonstrate:

1. OD-B-01…08 respected
2. COND-ARCH-B01…B10 satisfied
3. COND-SEC-B01…B11 satisfied
4. SEC-B01…B14 satisfied
5. SEC-AC-01…24 verified
6. T-01…T-20 + ST-B21…ST-B26 covered
7. Zero Vault mutation / zero env UPDATE by 04-B modules
8. C7 DENY-ALL / `allowRealVenueIo=false` unchanged
9. No FIV / venue I/O / capital activation

---

## 23. Authorization Verdict

### Eligibility evaluation

| Criterion                                           | Met?    |
| --------------------------------------------------- | ------- |
| Planning Review = PASS                              | **YES** |
| Architecture PASS WITH CONDITIONS; no BLOCKED       | **YES** |
| Security PASS WITH CONDITIONS; no BLOCKED           | **YES** |
| OD-B-01…08 frozen                                   | **YES** |
| Mandatory architecture/security conditions accepted | **YES** |
| Scope bounded to B-01…B-06                          | **YES** |
| Safety boundaries intact                            | **YES** |

### Verdict

```text
FIV-CONN-04-B IMPLEMENTATION AUTHORIZATION = GRANTED
```

```text
Interpretation:
  Governance-level permission to proceed through remaining
  FIV-CONN-04-B slice lifecycle gates toward implementation
  under frozen OD-B decisions and mandatory COND-ARCH / COND-SEC.

NOT interpretation:
  Permission to start coding/schema/migration in this act
  Permission to skip Slice Planning / Slice Approval
  Permission to implement 04-C / 04-D / 04-E
  Permission to perform LIVE backfill / FIV / C7 / capital
```

---

## 24. Post-Authorization Lifecycle Requirements

```text
Next gate (REQUIRED):
  FIV-CONN-04-B Slice Planning / Slice Approval

Then (per sub-slice B-01…B-06 as governed):
  Planning → Planning Review → Slice Approval
  → Implementation → PO Review → Closure

DO NOT start implementation in this authorization act.
DO NOT treat this artifact as a blanket implement-all-now order.
```

---

## Trust Boundary (preserved)

| Boundary                      | Role                                                  |
| ----------------------------- | ----------------------------------------------------- |
| Application runtime           | Trusted Nest implementation; deny hooks mandatory     |
| Database                      | Durable lease SoT + Strategy B uniqueness             |
| Vault                         | Credential SoT; **not mutated by 04-B**               |
| Direct Prisma / ops DB access | Operational trust residual; not an application bypass |

---

## Safety State (this authorization act)

```text
Database writes:        ZERO
Schema/migrations:      NOT CREATED
Vault mutations:        ZERO
Credential mutations:   ZERO
External I/O:           ZERO
FIV:                    NOT PERFORMED
Capital:                ZERO
C7:                     DENY-ALL
allowRealVenueIo:       FALSE
LIVE backfill:          NOT PERFORMED
Protected leftovers:    UNTOUCHED
Implementation started: NO
```

---

## Final State

```text
FIV-CONN-04-A = CLOSED
FIV-CONN-04-B = IMPLEMENTATION AUTHORIZED AT GOVERNANCE LEVEL
FIV-CONN-04-B IMPLEMENTATION = NOT STARTED IN THIS ACT
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
```

**END OF FIV-CONN-04-B IMPLEMENTATION AUTHORIZATION**
