# FIV-CONN-04 Architecture / Security Confirmation

**Document:** FIV-CONN-04 Architecture / Security Confirmation  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04 — LIVE environment backfill / residual migration state  
**Authority:** Repository-side Architecture / Security Reviewer  
**Nature:** **GOVERNANCE CONFIRMATION ONLY.** Confirms frozen plan coherence and safety. Does **not** grant Slice Approval. Does **not** authorize implementation. Does **not** create migrations, mutate Connections/Vault/credentials, perform backfill, or authorize FIV/C7/venue I/O/capital.

**Decision Freeze:** [`v3-l02-fiv-conn-04-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-po-governance-decision-freeze.md) (`7bebb633d9e92da93315d03e93880b3f02d80ba8`)  
**Planning Package:** [`v3-l02-fiv-conn-04-planning-package.md`](./v3-l02-fiv-conn-04-planning-package.md)  
**Planning Review:** [`v3-l02-fiv-conn-04-planning-review.md`](./v3-l02-fiv-conn-04-planning-review.md)  
**Decision Support:** [`v3-l02-fiv-conn-04-po-governance-decision-support.md`](./v3-l02-fiv-conn-04-po-governance-decision-support.md)  
**Repository baseline:** `7bebb633d9e92da93315d03e93880b3f02d80ba8` (`HEAD == origin/main`)

```text
ARCHITECTURE/SECURITY CONFIRMATION = PASS WITH CONDITIONS

Implementation:                 NOT AUTHORIZED
Slice Approval:                 NOT GRANTED
Backfill:                       NOT PERFORMED
Next gate:                      FIV-CONN-04 SLICE PLANNING
  (only after PO/Governance acceptance of this confirmation)
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Executive Verdict

```text
ARCHITECTURE/SECURITY CONFIRMATION = PASS WITH CONDITIONS
```

The frozen FIV-CONN-04 plan (D-CONN-04-01…10) is **internally coherent**, **consistent** with CLOSED FIV-CRED-01 / FIV-CONN-01 / FIV-CONN-02 / FIV-CONN-03, and **compatible** with Model C, ENV1, Strategy B, Vault exact-purpose isolation, workspace isolation, and existing Security Audit conventions.

No frozen PO decision must be changed. No architectural redesign is required.

**Conditions** are implementation/slice-planning obligations (write gate, controlled migration-time env update, CONN-04 audit event shapes, target-environment preflight). They belong to later gates — **not** blockers against confirming the frozen plan.

---

## 2. Repository Evidence Inspected

| Area                      | Path / evidence                                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connection model          | `apps/api/prisma/schema.prisma` — `ConnectionRecord.environment String?`, `vaultSecretId String?`, Strategy B comment                                                   |
| Strategy B SQL            | `apps/api/prisma/migrations/20260917180000_v3_l02_fiv_conn_02_provider_environment_uniqueness/migration.sql`                                                            |
| ENV1 helpers              | `trading-credential-environment.ts` — `tradingEnvironmentFromPurpose`, `purposeForTradingEnvironment`, `isConnectionTradingEnvironment`                                 |
| Connections service       | `connections.service.ts` — rename immutability; EXCHANGE NULL fail-closed before handshake; `vaultPurposeForConnection` / `vaultPurposesToProbe`; Strategy B slot check |
| Model C (Connections use) | `exchange-connection-credential.ts` — `resolveGovernedExchangeCredentials`, `assertConnectionPurposeModelC`, exact `vaultSecretId` match                                |
| Handshake / capability    | `exchange-handshake.service.ts`, `exchange-capability.service.ts`                                                                                                       |
| Security Audit            | `security-audit.service.ts`, `connection-lifecycle-audit.ts`, `connection-validation-audit.ts`, `SecurityAuditRecord` model; sensitive-key rejection                    |
| Production venue I/O flag | `execution-adapter.module.ts` — `allowRealVenueIo: false`                                                                                                               |
| Tests                     | `connections.service.spec.ts`, `exchange-connection-credential.spec.ts`, ENV1 / isolation suites                                                                        |
| Governance                | CONN-04 freeze + planning/review/support; CRED-02 D-CRED-02-12; CONN-03 freeze                                                                                          |

**Not found (expected at confirmation time):** runtime write gate for CONN-04; LIVE backfill job/migration; CONN-04-specific audit event types. These are **slice/implementation deliverables**, not confirmation defects.

---

## 3. Architecture Confirmation

### A. LIVE classification — **PASS**

Frozen D-CONN-04-01 Option A is implementable using existing Vault metadata on exact `vaultSecretId` + `tradingEnvironmentFromPurpose` / LIVE-class purposes `{Trading, TradingLive}`.

Repository already forbids weak inference on the use path (NULL EXCHANGE fail-closed; purpose derived server-side). Future backfill must not promote on provider/type/status/metadata alone — aligned with freeze.

### B. TESTNET separation — **PASS**

`TradingTestnet` maps to `testnet` only; LIVE-class purposes map to `live`. CONN-03 Model C denies LIVE↔TESTNET cross-use. Frozen plan forbids classifying TESTNET purpose as LIVE and forbids LIVE↔TESTNET rewrite.

### C. vaultSecretId binding — **PASS**

Frozen plan: backfill updates environment metadata only; never replaces `vaultSecretId`. Use path already requires `metadata.id === vaultSecretId`. Compatible.

### D. Strategy B — **PASS**

Partial unique index already authoritative. Frozen D-CONN-04-05 Option A (prevention: skip/report; no cleanup/merge/rebind) is compatible with the DB constraint as final authority under concurrency.

### E. NULL semantics — **PASS**

CONN-03: EXCHANGE + NULL → fail closed for trading use; NON-EXCHANGE NULL continues. Frozen D-CONN-04-06 Option C preserves residual EXCHANGE NULL as documented fail-closed; NULL ≠ LIVE. D-CONN-04-07 Option A keeps column nullable — schema already matches.

### F. Defective bindings — **PASS**

Frozen D-CONN-04-03/04 Option A (skip/audit; never auto-LIVE) aligns with CONN-03 fail-closed for missing/revoked/mismatch/workspace/id failures. No Vault repair / sibling fallback in plan.

### G. Idempotency — **PASS (design-confirmed)**

Conditional `WHERE environment IS NULL` + unchanged `vaultSecretId` revalidation is compatible with current immutability model and Strategy B. No already-populated env rewrite. Implementation remains future work.

### H. Concurrency — **PASS WITH CONDITION**

Frozen D-CONN-04-08 Option B matches D-CRED-02-12 intent (deny store/replace/revoke + EXCHANGE create during window). **No runtime write gate exists yet** — must be delivered in later Slice Planning / Implementation. Not a plan incoherence.

### I. Rollback — **PASS**

Forward-fix only; no Vault rollback; no LIVE↔TESTNET rewrite; no destructive cleanup — consistent with CRED-02 / CONN-04 freeze and existing immutability.

---

## 4. Security Confirmation

| ID        | Criterion                   | Result                                                                                                                                                           |
| --------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SC-01** | Workspace isolation         | **PASS** — Connection + Vault workspace scoping; plan requires workspace match for LIVE eligibility                                                              |
| **SC-02** | Purpose isolation           | **PASS** — Model C + exact-purpose retrieve (CONN-03 / CRED-01)                                                                                                  |
| **SC-03** | Environment isolation       | **PASS** — LIVE/TESTNET fail-closed against each other                                                                                                           |
| **SC-04** | Secret safety               | **PASS** — Security Audit rejects sensitive keys; plan forbids secret logging; opaque `vaultSecretId` only                                                       |
| **SC-05** | No privilege escalation     | **PASS** — Backfill is metadata-only; does not grant C7, FIV, venue I/O, human-start, or live execution                                                          |
| **SC-06** | Strategy B collision safety | **PASS** — Skip/report; no substitution (D-CONN-04-05)                                                                                                           |
| **SC-07** | Revoked/dangling safety     | **PASS** — Never auto-LIVE (D-CONN-04-04)                                                                                                                        |
| **SC-08** | Audit integrity             | **PASS WITH CONDITION** — Existing durable Security Audit store + sensitive-key controls support D-CONN-04-09; CONN-04 event shapes/types are slice deliverables |
| **SC-09** | Concurrency safety          | **PASS WITH CONDITION** — Policy frozen; write gate code deferred to implementation                                                                              |
| **SC-10** | Client authority            | **PASS** — No client purpose/`vaultSecretId`/env promotion on public APIs; backfill is privileged migration-time only                                            |
| **SC-11** | No runtime bypass           | **PASS** — D-CONN-04-02 forbids waiver; residual NULL remains fail-closed                                                                                        |
| **SC-12** | FIV boundary                | **PASS** — This confirmation performed zero venue I/O; plan does not authorize FIV                                                                               |

---

## 5. Verification of D-CONN-04-01…10

| ID                                       | Frozen   | Architecture/Security coherence                         | Notes |
| ---------------------------------------- | -------- | ------------------------------------------------------- | ----- |
| **01** A Vault-proven LIVE               | Coherent | Matches Model C / Vault metadata evidence               |
| **02** A Remain NULL + fail closed       | Coherent | Matches CONN-03; audit-only disposition OK              |
| **03** A Skip mismatch; continue         | Coherent | Does not reopen use-time Model C                        |
| **04** A Skip defective; never auto-LIVE | Coherent | Aligns CRED-01 / CONN-03                                |
| **05** A Collision prevention only       | Coherent | Strategy B remains authority                            |
| **06** C Residual NULL allowed           | Coherent | Non-EXCHANGE NULL normal; EXCHANGE residual fail-closed |
| **07** A Keep nullable                   | Coherent | Matches current schema; NOT NULL deferred               |
| **08** B Write gate deny set             | Coherent | Matches D-CRED-02-12; code TBD at implementation        |
| **09** B Fields + durable Security Audit | Coherent | Existing audit infrastructure reusable; event types TBD |
| **10** B PRE-01 specific Testnet path    | Coherent | See §7                                                  |

**No frozen decision conflicts with repository architecture.**

---

## 6. Verification of Frozen Safety Invariants

| Invariant                                         | Status                                        |
| ------------------------------------------------- | --------------------------------------------- |
| Model C authoritative                             | **PRESERVED**                                 |
| Vault SecretPurpose = runtime SoT                 | **PRESERVED**                                 |
| Connection.environment = constraint/audit context | **PRESERVED**                                 |
| Env ↔ purpose class match at use time             | **PRESERVED** (CONN-03)                       |
| Strategy B = DB uniqueness authority              | **PRESERVED**                                 |
| NULL ≠ LIVE                                       | **PRESERVED**                                 |
| No provider-only lookup                           | **PRESERVED**                                 |
| No sibling-secret substitution                    | **PRESERVED**                                 |
| No cross-workspace fallback                       | **PRESERVED**                                 |
| No cross-environment fallback                     | **PRESERVED**                                 |
| No client-controlled Vault purpose                | **PRESERVED**                                 |
| No Vault secret mutation                          | **PRESERVED** (plan + this act)               |
| No vaultSecretId replacement in backfill          | **PRESERVED** (plan)                          |
| No LIVE ↔ TESTNET rewrite                         | **PRESERVED**                                 |
| DEMO deferred                                     | **PRESERVED**                                 |
| C7 DENY-ALL                                       | **PRESERVED**                                 |
| allowRealVenueIo FALSE                            | **PRESERVED** (`execution-adapter.module.ts`) |
| FIV NOT PERFORMED                                 | **PRESERVED** (this act)                      |
| Capital ZERO                                      | **PRESERVED**                                 |
| External I/O ZERO                                 | **PRESERVED**                                 |

---

## 7. FIV-PRE-01 Dependency Assessment

Frozen **D-CONN-04-10 Option B** is **technically coherent**.

Repository already supports a specific multi-env Testnet path without requiring unrelated Connections to be backfilled first:

```text
BINANCE EXCHANGE Connection
  + environment = testnet          (CONN-01 create contract)
  + vaultSecretId exact binding
  + SecretPurpose.TradingTestnet   (CRED-01 / CONN-02/03)
  + Model C assert at use time     (CONN-03)
  + environment-aware handshake/capability
  + EG1 Testnet host class         (origins/host selection remains CRED-04 ownership)
```

Unrelated EXCHANGE NULL residuals remain fail-closed (CONN-03) and, per freeze, do **not** automatically block PRE-01 if documented and non-interfering with the specific Testnet path.

```text
This confirmation does NOT:
  close FIV-PRE-01
  authorize FIV
  call Binance
  create Testnet credentials
  enable allowRealVenueIo
  grant C7
```

---

## 8. Blocking Issues

```text
Blocking architectural/security defects against the frozen plan: NONE
```

No conflict requires changing D-CONN-04-01…10 or replanning the slice objective.

---

## 9. Non-Blocking Residual Risks / Conditions

Conditions for **later Slice Planning / Implementation** (not confirmation blockers):

| ID       | Condition                                                                                               | Gate ownership                                |
| -------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **C-01** | Implement D-CONN-04-08 write gate (deny store/replace/revoke + EXCHANGE create) for the backfill window | Slice Planning → Implementation               |
| **C-02** | Controlled migration-time environment UPDATE exception (public APIs remain immutable)                   | Slice Planning → Implementation               |
| **C-03** | Vault-proven LIVE classifier + conditional idempotent UPDATE per D-CONN-04-01…05                        | Slice Planning → Implementation               |
| **C-04** | D-CONN-04-09 Security Audit event types/payloads (no secrets) + run counters                            | Slice Planning → Implementation               |
| **C-05** | Target-environment read-only preflight audit (local ≠ production)                                       | Slice Planning / Implementation Authorization |
| **C-06** | Operator-facing residual EXCHANGE NULL inventory (audit-only; no waiver)                                | Implementation / ops runbook                  |

Residual risk: if write gate is omitted at implementation, concurrent credential races could produce Strategy B conflicts — mitigated by frozen policy **if implemented**.

---

## 10–15. Explicit Safety Statements (this act)

```text
10. No implementation was performed.
11. No migration / LIVE backfill was performed.
12. No Vault / credential mutation occurred.
13. No external I/O occurred (Binance/Bybit/OKX = ZERO).
14. C7 remains DENY-ALL.
15. allowRealVenueIo remains FALSE.
```

---

## 16. Recommendation for Next Governance Gate

```text
Recommendation:
  ACCEPT this Architecture/Security Confirmation (PASS WITH CONDITIONS C-01…C-06)
  then proceed to:
    FIV-CONN-04 SLICE PLANNING

Do NOT authorize implementation from this artifact alone.
Do NOT create migrations or perform backfill yet.
Do NOT close FIV-CONN-04 or FIV-PRE-01.
```

Slice Planning must incorporate frozen D-CONN-04-01…10 and address conditions C-01…C-06 as acceptance criteria / work items — without reopening frozen decisions.

---

## Safety State (this confirmation act)

```text
External I/O:       ZERO
FIV:                NOT PERFORMED
Capital:            ZERO
C7:                 DENY-ALL
allowRealVenueIo:   FALSE
Vault:              NOT MODIFIED
Credentials:        NOT MODIFIED
Database:           NOT MODIFIED
LIVE backfill:      NOT PERFORMED
Protected leftovers: UNTOUCHED
```

---

**END OF FIV-CONN-04 ARCHITECTURE / SECURITY CONFIRMATION**
