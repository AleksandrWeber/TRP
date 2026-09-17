# FIV-CONN-04 Planning Package

**Document:** FIV-CONN-04 LIVE Environment Backfill / Migration Residuals — Planning Package  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04 — LIVE environment backfill / residual migration state  
**Authority:** Senior Staff Engineer + Principal Architecture Planning Engineer (draft under Product Owner + Chief Architect governance)  
**Nature:** **SLICE PLANNING ONLY.** Does **not** grant Planning Review pass. Does **not** grant Architecture/Security/PO approval. Does **not** grant Slice Approval. Does **not** authorize implementation. Does **not** modify production code, schema, migrations, Vault, credentials, Connection rows, or external integrations.

**Parent:** FIV-PRE-01 → FIV-CRED-02  
**Prior closed slices:** FIV-CRED-01 CLOSED · FIV-CONN-01 CLOSED · FIV-CONN-02 CLOSED · FIV-CONN-03 CLOSED  
**FIV-CONN-03 closure:** [`v3-l02-fiv-conn-03-closure.md`](./v3-l02-fiv-conn-03-closure.md)  
**Repository baseline (planning start):** `5214595d6c5e8eaf49388c746e91fe2d87fd77dd` (`main`, `HEAD == origin/main`)

```text
SLICE PLANNING PACKAGE — NOT IMPLEMENTATION AUTHORIZATION

Implementation:                 NOT PERFORMED
Schema changes:                 NONE
Migrations:                     NONE
Backfill:                       NOT PERFORMED
Duplicate cleanup:              NOT PERFORMED
Vault changes:                  NONE
Credential changes:             NONE
Database mutations:             NONE (read-only inventory only)
External I/O:                   ZERO
Binance calls:                  ZERO
Bybit calls:                    ZERO
OKX calls:                      ZERO
FIV:                            NOT PERFORMED
Capital movement:               ZERO
C7:                             DENY-ALL
allowRealVenueIo:               FALSE
Protected leftovers:            UNTOUCHED
Implementation authorization:   NOT GRANTED
Next gate:                      FIV-CONN-04 PLANNING REVIEW
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## Governance State

### Pre-check dirty/untracked state (planning start)

Recorded before any repository write for this task:

```text
 M apps/api/src/composition/live-admission-gate-ports.module.spec.ts
 M docs/project/technical-debt.md
 M docs/project/version-3/wave-5/wave-5-progress.md
?? apps/api/src/modules/notification-delivery/production-telegram-operator-test-message.spec.ts
?? docs/project/technical-debt 2.md
?? docs/project/version-3/next-wave-planning-package-proposal.md
?? docs/project/version-3/wave-5/d-gov-03-resolution-path-evidence.md
?? docs/project/version-3/wave-5/database-startup-blocker-analysis.md
?? docs/project/version-3/wave-5/next-package-planning-proposal.md
?? docs/project/version-3/wave-5/next-slice-planning-analysis.md
?? docs/project/version-3/wave-5/teams-incoming-webhook-fiv-deferred 2.md
?? docs/project/version-3/wave-5/teams-incoming-webhook-fiv-deferred.md
?? docs/project/version-3/wave-5/telegram-vault-credential-provisioning-analysis.md
?? docs/project/version-3/wave-5/wave-5-progress 2.md
?? docs/project/version-3/wave-6/d-gov-01-adr-l01-sequencing-decision-brief.md
?? docs/project/version-3/wave-6/d-gov-04-adr-authority-decision-brief.md
?? docs/project/version-3/wave-6/wave-6-planning-revalidation.md
```

**Protected leftovers:** MUST remain untouched. This planning act creates only this artifact.

### Authoritative governance chain reviewed

| Artifact                        | Path                                                    | Status                            |
| ------------------------------- | ------------------------------------------------------- | --------------------------------- |
| FIV-CRED-02 Planning Package    | `v3-l02-fiv-cred-02-planning-package.md`                | COMPLETE                          |
| FIV-CRED-02 Architecture Review | `v3-l02-fiv-cred-02-architecture-review.md`             | PASS WITH CONDITIONS              |
| FIV-CRED-02 Security Review     | `v3-l02-fiv-cred-02-security-review.md`                 | PASS WITH CONDITIONS              |
| FIV-CRED-02 Decision Freeze     | `v3-l02-fiv-cred-02-po-governance-decision-freeze.md`   | COMPLETE — D-CRED-02-01…14 FROZEN |
| FIV-CRED-02 Planning Approval   | `v3-l02-fiv-cred-02-po-governance-planning-approval.md` | GRANTED                           |
| FIV-CONN-01 Planning Package    | `v3-l02-fiv-conn-01-planning-package.md`                | COMPLETE                          |
| FIV-CONN-01 Closure             | `v3-l02-fiv-conn-01-closure.md`                         | CLOSED                            |
| FIV-CONN-02 Planning Package    | `v3-l02-fiv-conn-02-planning-package.md`                | COMPLETE                          |
| FIV-CONN-02 Slice Approval      | `v3-l02-fiv-conn-02-slice-approval.md`                  | GRANTED                           |
| FIV-CONN-02 Closure             | `v3-l02-fiv-conn-02-closure.md`                         | CLOSED                            |
| FIV-CONN-03 Planning Package    | `v3-l02-fiv-conn-03-planning-package.md`                | COMPLETE                          |
| FIV-CONN-03 Decision Freeze     | `v3-l02-fiv-conn-03-po-governance-decision-freeze.md`   | ALL FIVE FROZEN                   |
| FIV-CONN-03 Architecture Review | `v3-l02-fiv-conn-03-architecture-review.md`             | PASS WITH CONDITIONS              |
| FIV-CONN-03 Security Review     | `v3-l02-fiv-conn-03-security-review.md`                 | PASS WITH CONDITIONS              |
| FIV-CONN-03 Slice Approval      | `v3-l02-fiv-conn-03-slice-approval.md`                  | GRANTED                           |
| FIV-CONN-03 PO Review           | `v3-l02-fiv-conn-03-po-review.md`                       | PASS                              |
| FIV-CONN-03 Closure             | `v3-l02-fiv-conn-03-closure.md`                         | CLOSED                            |

**Note:** No separate `v3-l02-fiv-conn-02-po-governance-decision-freeze.md` exists in-repo. Strategy B / uniqueness governance for CONN-02 is carried by parent **D-CRED-02-03** plus CONN-02 Slice Approval / Closure. That absence is **not** a planning blocker.

Frozen parent decisions **D-CRED-02-01…14** and **D-CONN-03-01…05** are **not** reopened. FIV-CONN-01 / 02 / 03 are **not** redesigned.

### Slice ladder (do not collapse)

```text
ALREADY CLOSED:
  FIV-CRED-01
  FIV-CONN-01
  FIV-CONN-02
  FIV-CONN-03

CURRENT:
  FIV-CONN-04 PLANNING   ← THIS ARTIFACT

FUTURE:
  FIV-CONN-05
```

### Parent ownership already frozen for this slice

| Decision         | Relevance to CONN-04                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-CRED-02-04** | Unambiguous LIVE backfill; ambiguous ≠ auto-LIVE; pre-audit required; zero Vault mutation                                                            |
| **D-CRED-02-05** | Migration sequence (audit → serialize → backfill → NOT NULL → unique…) — **partially already executed** by CONN-01/02; residual ownership is CONN-04 |
| **D-CRED-02-09** | Environment immutable after create — backfill needs explicit migration-time exception                                                                |
| **D-CRED-02-12** | Write serialization during migration critical section                                                                                                |
| **D-CONN-03-03** | EXCHANGE + NULL → FAIL CLOSED on validate/handshake; NULL ≠ LIVE; no CONN-03 backfill                                                                |

---

## Objective

Determine and plan the **exact residual work** required to safely and deterministically complete existing Connection records’ environment state and associated migration residuals after:

- FIV-CONN-01 (nullable `environment`, create-time EXCHANGE requirement, immutability);
- FIV-CONN-02 (Strategy B partial unique **already applied** without backfill);
- FIV-CONN-03 (Model C purpose-aware validate/handshake/capability; EXCHANGE NULL fail-closed).

**Central question:**

```text
What is required to safely and deterministically complete existing
Connection records' environment state and any associated migration
residuals, without mutating Vault secrets and without changing the
already-approved credential architecture?
```

**Intended residual responsibility (repository-confirmed):**

```text
LIVE environment backfill / migration residuals
+ audit / eligibility / quarantine
+ Strategy B collision gate before writes
± EXCHANGE NOT NULL enforcement ONLY if justified and PO-frozen
```

This package does **not** absorb FIV-CONN-03 credential-use logic, UI Testnet selection, Binance Testnet FIV, venue connectivity, C7, or FIV execution.

---

## Current Repository State

### Connection model (FACT)

**Path:** `apps/api/prisma/schema.prisma` → `ConnectionRecord` / `connection_records`

| Field            | Type      | Notes                                                                                               |
| ---------------- | --------- | --------------------------------------------------------------------------------------------------- |
| `id`             | String    | PK                                                                                                  |
| `workspaceId`    | String    | ownership                                                                                           |
| `displayName`    | String    |                                                                                                     |
| `provider`       | String    | e.g. `BINANCE`, `BYBIT`                                                                             |
| `connectionType` | String    | `EXCHANGE` / `NOTIFICATION` / `AI`                                                                  |
| `environment`    | `String?` | ENV1 `live` \| `testnet`; **still nullable**; schema comment: “nullable until FIV-CONN-04 backfill” |
| `vaultSecretId`  | `String?` | opaque Vault reference only                                                                         |
| `status`         | String    | default `DISCONNECTED`; revoke may retain `vaultSecretId`                                           |

**Indexes / uniqueness (FACT):**

```text
@@index([workspaceId, createdAt])
@@index([workspaceId, provider])
@@unique([workspaceId, provider, vaultSecretId])   -- PRESERVE

Strategy B (SQL SoT; not Prisma @@unique):
CREATE UNIQUE INDEX connection_records_ws_provider_env_credentialed_uidx
ON connection_records (workspace_id, provider, environment)
WHERE vault_secret_id IS NOT NULL
  AND status <> 'REVOKED'
  AND environment IS NOT NULL
  AND connection_type = 'EXCHANGE';
```

**No** EXCHANGE `environment NOT NULL` check constraint exists today.  
**No** Prisma relation from Connection to VaultSecret (application-scoped join by id).

### Relevant migrations (FACT)

| Migration                                                           | Effect                                                                  | Backfill?                           |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| `20260817193000_w2_s01_a_connection_metadata`                       | Create `connection_records`                                             | N/A                                 |
| `20260817193500_w2_s01_b_connection_vault_reference`                | Add `vault_secret_id` + unique `(workspace, provider, vault_secret_id)` | N/A                                 |
| `20260917170000_v3_l02_fiv_conn_01_connection_environment`          | `ADD COLUMN "environment" TEXT` (nullable)                              | **NO** — explicit no UPDATE/DEFAULT |
| `20260917180000_v3_l02_fiv_conn_02_provider_environment_uniqueness` | Strategy B partial unique                                               | **NO** — CREATE INDEX only          |

### Application behavior relevant to backfill (FACT)

| Concern                  | Current state                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| EXCHANGE create          | Requires explicit `live` \| `testnet` (CONN-01)                                                      |
| Environment mutation API | **Absent** — rename/lifecycle do not write `environment` (D-CRED-02-09)                              |
| EXCHANGE + NULL validate | **FAIL CLOSED** before Vault use (CONN-03 / D-CONN-03-03)                                            |
| Model C                  | Actual Vault `SecretPurpose` checked against `Connection.environment` on governed use path (CONN-03) |
| `vaultSecretId`          | Exact credential binding; never provider-only / sibling selection (CONN-03)                          |
| Purpose compatibility    | LIVE → `{Trading, TradingLive}`; TESTNET → `{TradingTestnet}`; mismatch FAIL CLOSED                  |
| Non-EXCHANGE NULL        | Allowed to continue (CONN-03)                                                                        |

### Critical sequence divergence (FACT)

Parent **D-CRED-02-05** ideal sequence placed Strategy B **after** LIVE backfill.  
Slice ownership executed uniqueness in **FIV-CONN-02 before** backfill.

CONN-02 planning explicitly documented this as safe **iff** CONN-04 audits credentialed collisions **before** assigning environments that would violate Strategy B. That residual gate is now mandatory for CONN-04.

```text
ALREADY DONE:
  1. nullable environment column (CONN-01)
  2. Strategy B partial unique (CONN-02)
  3. Model C / NULL EXCHANGE fail-closed on use path (CONN-03)

STILL RESIDUAL (CONN-04):
  A. pre-backfill audit / inventory
  B. eligibility / classification contract
  C. controlled LIVE backfill of approved rows only
  D. post-backfill verification
  E. EXCHANGE NOT NULL hardening — ONLY if PO freezes it as in-scope
```

### ENV1 / purpose helpers (FACT — reuse only)

**Path:** `trading-credential-environment.ts`

```text
tradingEnvironmentFromPurpose(purpose):
  TradingTestnet → testnet
  TradingDemo    → demo (deferred for Connections)
  Trading / TradingLive → live

purposeForTradingEnvironment(env):
  testnet → TradingTestnet
  live    → TradingLive
```

Model C equality remains:

```text
tradingEnvironmentFromPurpose(actualVaultPurpose) === connection.environment
```

Legacy LIVE-class `Trading` remains ALLOW for `environment = live` (D-CONN-03-02). CONN-04 must **not** rewrite Vault purposes to `TradingLive`.

---

## Existing Connection Inventory

### Inventory method (this planning act)

Read-only Prisma query against local PostgreSQL (`trp-postgres` / `postgres:16-alpine`), selecting Connection metadata and **bound Vault metadata only** (`id`, `purpose`, `type`, `workspaceId`, `state`) for rows with `vaultSecretId`.  
**No** secret payloads, ciphertext, or API keys were read or logged.  
**No** rows were updated/deleted.

**Scope caveat:** This inventory is the **local developer DB** used by prior CONN-02 audits. Production/staging inventories are **mandatory** in any future authorized audit phase and may differ. Counts below are planning evidence, not a production certification.

### Aggregate snapshot (local DB, 2026-09-17)

| Metric                                          | Count         |
| ----------------------------------------------- | ------------- |
| Total Connection rows                           | **13**        |
| EXCHANGE                                        | **4**         |
| NOTIFICATION                                    | **9**         |
| AI                                              | **0**         |
| `environment = live`                            | **0**         |
| `environment = testnet`                         | **0**         |
| `environment IS NULL`                           | **13** (100%) |
| Populated-env EXCHANGE                          | **0**         |
| Credentialed EXCHANGE (`vaultSecretId` present) | **1**         |
| Metadata-only EXCHANGE                          | **3**         |

### Workspace distribution (local)

| Workspace                              | Rows |
| -------------------------------------- | ---- |
| `163bcf3b-ee70-4049-bf80-8ff79ca344ab` | 12   |
| `7c9cc6e9-d762-4cad-b71e-f6d2dc8d13ec` | 1    |

### EXCHANGE rows (local) — metadata only

| Provider | Env  | Credentialed | Status              | Bound Vault purpose    | Workspace match |
| -------- | ---- | ------------ | ------------------- | ---------------------- | --------------- |
| BINANCE  | NULL | YES          | `VALIDATION_FAILED` | `trading` (LIVE-class) | YES             |
| BINANCE  | NULL | NO           | `DISCONNECTED`      | n/a                    | n/a             |
| BINANCE  | NULL | NO           | `DISCONNECTED`      | n/a                    | n/a             |
| BYBIT    | NULL | NO           | `DISABLED`          | n/a                    | n/a             |

### Non-EXCHANGE NULL (local)

All 9 NOTIFICATION rows have `environment IS NULL` (SMTP ×2, TELEGRAM ×3, plus DISCORD/PUSH/SLACK/TEAMS). Per D-CONN-03-03 / CRED-02, these are **normal** and **out of LIVE backfill scope**.

### Consistency with prior CONN-02 audit

CONN-02 implementation report observed the same local shape: 13 rows; all environments NULL; NULL groups BINANCE/SMTP/TELEGRAM; no Strategy B-eligible populated-env duplicates. Planning inventory reconfirms **no LIVE backfill has occurred**.

---

## NULL EXCHANGE Analysis

FIV-CONN-03 established:

```text
EXCHANGE + NULL environment → FAIL CLOSED (validate/handshake/capability)
NULL ≠ LIVE
No omit-purpose Trading retrieval for NULL EXCHANGE
```

Local DB still contains **4** EXCHANGE + NULL rows. Classification without mutation:

| Class                              | Definition                                                                                                                                    | Local evidence                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **A — clearly LIVE**               | Bound `vaultSecretId` resolves to LIVE-class purpose `{trading, trading_live}` in same workspace; Connection is EXCHANGE; not TESTNET-purpose | **1 row** — BINANCE credentialed, purpose `trading`                                  |
| **B — clearly TESTNET**            | Bound purpose = `trading_testnet`                                                                                                             | **0 rows**                                                                           |
| **C — ambiguous**                  | Cannot prove LIVE-class from Vault purpose; lacks authoritative non-type-only evidence under CONN-04 evidence bar                             | **3 metadata-only EXCHANGE rows** (BINANCE×2, BYBIT×1) pending PO eligibility freeze |
| **D — invalid/orphaned**           | Invalid provider/type, or otherwise non-operable identity                                                                                     | **0 observed locally**                                                               |
| **E — missing credential binding** | EXCHANGE with `vaultSecretId IS NULL`                                                                                                         | **3 rows** (overlap with C)                                                          |
| **F — conflicting Vault purpose**  | Bound purpose maps to environment incompatible with proposed LIVE backfill (e.g. `trading_testnet`) or non-trading purpose on EXCHANGE        | **0 observed locally**                                                               |

### Purpose compatibility matrix (classification only; Vault not mutated)

| Proposed Connection env | Actual Vault purpose               | Classification outcome                                                        |
| ----------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| LIVE                    | `trading` / `trading_live`         | Eligible LIVE (Model C compatible)                                            |
| LIVE                    | `trading_testnet`                  | **BLOCKING mismatch** — do not backfill LIVE                                  |
| TESTNET                 | `trading_testnet`                  | Not LIVE backfill target (remain / separate remediation)                      |
| TESTNET                 | `trading` / `trading_live`         | **BLOCKING mismatch**                                                         |
| NULL EXCHANGE           | any                                | Invalid for use (CONN-03); backfill candidate only if eligibility proves LIVE |
| NULL EXCHANGE           | missing / dangling `vaultSecretId` | Not Vault-proven LIVE                                                         |

### Parent freeze vs CONN-04 evidence bar

Parent **D-CRED-02-04** / CRED-02 Architecture historically treated metadata-only EXCHANGE as “unambiguous LIVE **semantics**” because Connections historically omitted purpose → `Trading`.

This CONN-04 package **does not auto-execute that as eligibility**. Task governance requires:

```text
Only unambiguous LIVE Connections may be backfilled to LIVE.
No silent NULL → LIVE.
No blanket UPDATE all NULL EXCHANGE → LIVE.
No backfill based only on provider or connectionType.
Eligibility MUST be based on authoritative repository evidence.
```

Therefore metadata-only EXCHANGE eligibility is marked:

```text
PO DECISION REQUIRED — D-CONN-04-01
```

Strongest repository evidence for LIVE today is **bound Vault purpose LIVE-class** on the exact `vaultSecretId`.

---

## LIVE Backfill Eligibility

### Proposed eligibility contract (for PO freeze; not implemented)

A Connection is **eligible for LIVE backfill** only if **all** hold:

1. `connectionType = 'EXCHANGE'`
2. `environment IS NULL` (never rewrite populated `live`/`testnet`)
3. Authoritative LIVE evidence per frozen D-CONN-04-01 (recommended default: bound Vault purpose ∈ `{trading, trading_live}` via exact `vaultSecretId`)
4. Bound Vault secret workspaceId equals Connection.workspaceId (if credentialed)
5. Bound purpose is not TESTNET / DEMO / non-trading (if credentialed)
6. After projected `environment = 'live'`, Strategy B would not create a credentialed non-revoked duplicate on `(workspaceId, provider, 'live')`
7. `vaultSecretId` is **unchanged** by the operation
8. Row is not in an operator-quarantine set

### Explicit non-eligibility (fail closed)

| Condition                                        | Action                                                                                                                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Already `environment = 'live'`                   | Skip (idempotent no-op)                                                                                                                               |
| Already `environment = 'testnet'`                | Skip — **never** LIVE-ify                                                                                                                             |
| Non-EXCHANGE                                     | Out of scope — leave NULL                                                                                                                             |
| Ambiguous / quarantine                           | Skip — remain NULL (fail closed on use)                                                                                                               |
| Purpose mismatch / dangling / workspace mismatch | Block / quarantine                                                                                                                                    |
| Strategy B collision if set to live              | Block — do not write                                                                                                                                  |
| Revoked credentialed row                         | **PO DECISION REQUIRED** whether eligible; default recommendation: do not auto-backfill revoked rows into Strategy B identity without explicit freeze |

### Local projected eligibility (illustrative only)

| Row class                                | Projected disposition under recommended evidence bar                |
| ---------------------------------------- | ------------------------------------------------------------------- |
| BINANCE credentialed + purpose `trading` | **Eligible LIVE** (A)                                               |
| Metadata-only BINANCE/BYBIT              | **Not auto-eligible** until D-CONN-04-01 freezes metadata-only rule |
| All NOTIFICATION NULL                    | **Out of scope**                                                    |

Strategy B collision preview (local): setting the single credentialed NULL BINANCE to `live` does **not** collide with any existing credentialed `live` row (none exist). Two metadata-only BINANCE rows in the same workspace remain unconstrained by Strategy B after backfill if they stay metadata-only.

---

## Ambiguity Policy

```text
DEFAULT GOVERNANCE EXPECTATION:
  DO NOT silently classify ambiguous records as LIVE.
```

### Disposition options (PO must freeze one)

| Option                                                 | Behavior                                                                    | Consequence                                                         |
| ------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **A — Remain NULL + fail closed**                      | Leave ambiguous EXCHANGE NULL; CONN-03 continues to deny validate/handshake | Safest; operators cannot use those Connections until remediated     |
| **B — Quarantine list + operator review**              | Emit durable audit quarantine IDs; still no silent LIVE write               | Explicit operator workflow; still fail closed at runtime            |
| **C — Separate remediation slice**                     | CONN-04 backfills only Vault-proven LIVE; ambiguous deferred                | Narrows CONN-04; may delay EXCHANGE NOT NULL                        |
| **D — Auto-LIVE metadata-only** (parent-era semantics) | Backfill all EXCHANGE NULL without Vault proof                              | Conflicts with CONN-04 evidence bar unless PO explicitly freezes it |

**Recommended for Planning Review (not a substitute for PO freeze):** **A + B** combined — remain NULL, fail closed, produce operator-readable quarantine inventory. Do **not** invent a new exception mechanism or conditional closure path that weakens CONN-03 fail-closed.

Ambiguous rows **must not** block idempotent re-runs of eligible LIVE updates, but **may** block EXCHANGE NOT NULL enforcement and/or FIV-PRE-01 completion depending on **D-CONN-04-06 / D-CONN-04-10**.

---

## Vault Safety

```text
FIV-CONN-04 MUST NOT mutate Vault secrets.
```

Forbidden:

- change `SecretPurpose`
- rename / copy / move / rotate / delete / create secrets
- rewrite ciphertext / payload / wrapping material
- “fix” mismatch by changing Vault to match Connection

Allowed (future authorized write phase only):

- read Vault **metadata** (`id`, `purpose`, `type`, `workspaceId`, `state`) for classification
- update **Connection.environment** metadata only for approved rows

```text
Vault SecretPurpose remains runtime source of truth (Model C).
Connection.environment is constraint / audit context only.
```

---

## Model C Compatibility

FIV-CONN-03 Model C (unchanged):

```text
Connection.environment  = environment constraint / audit context
Vault SecretPurpose     = runtime source of truth
Mismatch                = FAIL CLOSED
```

### How backfill avoids creating mismatches

1. Classify using **actual** bound Vault purpose (id-matched), not Connection type alone.
2. Write `environment = 'live'` **only** when `tradingEnvironmentFromPurpose(purpose) === 'live'`.
3. Never write `live` when purpose is `trading_testnet`.
4. Never mutate Vault purpose to “make Model C pass.”
5. Never replace `vaultSecretId` to find a LIVE-compatible sibling.
6. After write, governed use path continues to assert actual purpose vs environment (CONN-03).

### LIVE dual-purpose note

Backfilling NULL → `live` for a secret with purpose `trading` is Model C **compatible** (D-CONN-03-02). It does **not** require migrating the secret to `trading_live`.

---

## vaultSecretId Binding

```text
Runtime credential binding remains: Connection.vaultSecretId
```

FIV-CONN-04 must **not**:

- select credentials by provider-only
- select by provider + environment lookup
- select by purpose-only / first match / sibling credential
- replace `vaultSecretId` during backfill

Backfill updates **at most**:

```text
connection_records.environment  (NULL → 'live' for approved rows)
```

Optionally `updatedAt` via ORM — never identity/credential fields.

---

## Strategy B Compatibility

Strategy B (CLOSED in CONN-02):

```text
UNIQUE (workspace_id, provider, environment)
WHERE vault_secret_id IS NOT NULL
  AND status <> 'REVOKED'
  AND environment IS NOT NULL
  AND connection_type = 'EXCHANGE'
```

### Effects on CONN-04

| Scenario                                     | Effect                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| Metadata-only NULL → `live`                  | Still outside Strategy B (no `vault_secret_id`) — allowed even if duplicates |
| Credentialed NULL → `live`                   | Enters Strategy B; second credentialed same WS+provider+live → **DB reject** |
| Existing credentialed `live` already present | Backfilling another credentialed NULL same provider → **BLOCKING**           |
| Credentialed NULL → `live` with no sibling   | Safe under uniqueness                                                        |
| TESTNET credentialed rows                    | Unrelated to LIVE backfill; must remain `testnet`                            |

### Local blocker status

| Blocker type                                         | Local                                                   |
| ---------------------------------------------------- | ------------------------------------------------------- |
| Credentialed LIVE collision after projected backfill | **None observed**                                       |
| Duplicate metadata-only after backfill               | Present historically; **non-blocking** under Strategy B |
| Need to change uniqueness                            | **Forbidden** — CONN-02 CLOSED                          |

Do **not** clean duplicates in CONN-04 unless PO explicitly authorizes a separate destructive remediation decision (default: **no cleanup**).

---

## Migration / Backfill Strategy

### Safe ordering (residual, post CONN-01/02/03)

```text
1. Audit (read-only) — inventory + Vault purpose join by vaultSecretId
2. Detect blockers — Strategy B collisions, mismatches, dangling refs
3. Establish eligibility — deterministic classifier under frozen PO rules
4. Write gate — serialize Connection credential/create writes (D-CRED-02-12)
5. Write only approved/unambiguous rows — Connection.environment NULL→live
6. Validate purpose compatibility — Model C projection checks (read-only verify)
7. Validate uniqueness — re-query Strategy B groups; expect zero duplicate eligible keys
8. Verify resulting state — counts, residual NULL EXCHANGE, no TESTNET flips
9. ONLY THEN consider EXCHANGE NOT NULL enforcement if PO freezes it in-scope
10. Re-enable writes; emit operator audit report
```

### Migration-time environment exception

D-CRED-02-09 makes environment immutable via application APIs after create.  
CONN-04 backfill therefore requires an **explicit controlled migration-time exception**:

```text
Authorized SQL/ORM UPDATE of environment
  ONLY for audited eligible NULL→live rows
  ONLY during write-gated maintenance window
  NOT via public PATCH/rename API
  NOT as a general mutability weakening
```

Application immutability remains intact after the migration window.

### NOT NULL enforcement

Parent freeze expected eventual EXCHANGE `environment NOT NULL`.  
Current schema is still `String?`. Whether CONN-04 includes:

- DB CHECK / partial constraint, and/or
- application invariants beyond create-time validation

is **PO DECISION REQUIRED (D-CONN-04-07)**.

If ambiguous NULL EXCHANGE may remain, **NOT NULL cannot be enforced** without destroying fail-closed residual rows or forcing unsafe classification.

---

## Concurrency

During backfill, concurrent writers can race:

| Concurrent op                     | Hazard                                                   | Required protection                                                                  |
| --------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Connection create (EXCHANGE live) | New credentialed live sibling while NULL→live backfill   | Write gate / maintenance deny create+credential writes                               |
| store/replace credentials         | NULL row becomes credentialed mid-audit; uniqueness race | Deny credential writes during critical section (D-CRED-02-12)                        |
| revoke                            | Eligibility/status change mid-batch                      | Gate revoke or re-read status inside transaction                                     |
| environment API mutation          | Should be impossible today                               | Keep immutable; no new public env PATCH                                              |
| Concurrent backfill workers       | Double-update / partial reports                          | Single serialized backfill job; row-level idempotent predicate `environment IS NULL` |

**Minimum protections (plan):**

1. Application write gate (primary, frozen preference)
2. Transactional batch or single-statement conditional UPDATE
3. Rely on Strategy B unique index as final fail-closed authority
4. Optimistic re-read of purpose+eligibility immediately before write
5. Abort closed on unexpected P2002 / mismatch

Do **not** rely on advisory locks alone.

---

## Idempotency

Future authorized backfill **MUST** be idempotent.

```text
Second execution MUST NOT:
  - change already-correct live/testnet rows
  - switch environments
  - select another credential
  - create duplicates
```

### Idempotent write shape (planned)

```text
UPDATE connection_records
SET environment = 'live'
WHERE id = :approvedId
  AND connection_type = 'EXCHANGE'
  AND environment IS NULL
  AND vault_secret_id IS NOT DISTINCT FROM :expectedVaultSecretId  -- unchanged binding
```

### Proof of idempotency

1. Fixture: eligible NULL → after run env=`live`; second run updated=0.
2. Fixture: already `live` → skipped.
3. Fixture: `testnet` → never updated.
4. Fixture: vaultSecretId unchanged before/after.
5. Counts: eligible stable; no growth in Strategy B duplicate groups.

---

## Rollback / Recovery

| Failure mode                              | Recovery                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Partial batch failure                     | Prefer single transaction per batch; on error roll back uncommitted writes                       |
| Process crash mid-run                     | Re-run idempotent job; audit diffs of residual NULL eligible rows                                |
| Uniqueness conflict (P2002)               | Abort closed; do not retry blindly; quarantine colliding IDs                                     |
| Concurrent Connection update              | Gate should prevent; if observed, abort and re-audit                                             |
| Unexpected purpose mismatch at write time | Skip/quarantine that row; never mutate Vault                                                     |
| Operator abort                            | Forward-fix preferred; **do not** rewrite `live` → NULL casually; **never** rewrite to `testnet` |

```text
Rollback MUST NOT:
  LIVE → TESTNET
  TESTNET → LIVE
  mutate Vault purposes
  delete Connections to “undo”
```

---

## Observability

Future authorized backfill must report (no secrets):

| Counter / set | Meaning                        |
| ------------- | ------------------------------ |
| scanned       | Rows examined                  |
| eligible      | Passed classifier              |
| updated       | NULL→live writes committed     |
| skipped       | Already correct / out of scope |
| ambiguous     | Quarantined / unresolved       |
| blocked       | Strategy B / policy blockers   |
| mismatched    | Purpose/workspace conflicts    |
| duplicate     | Logical identity collisions    |
| failed        | Hard errors                    |

**Must not log:** API secrets, ciphertext, private credential material, raw payloads, wrapping keys.

Operator report must answer: what changed, why, what remains unresolved, which IDs need manual review.

---

## Security Analysis

| Threat                               | Control                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| Cross-workspace mutation             | Updates keyed by Connection id + workspace checks; Vault workspace must match |
| Wrong environment assignment         | Vault-purpose evidence; no type-only LIVE                                     |
| Purpose mismatch accepted            | Deny eligibility; Model C remains fail-closed                                 |
| Accidental LIVE classification       | Ambiguous ≠ LIVE; PO-frozen classifier                                        |
| TESTNET→LIVE escalation              | Skip all `environment='testnet'`; deny TESTNET purpose→live                   |
| Credential substitution              | Never change `vaultSecretId`                                                  |
| Sibling selection                    | Forbidden                                                                     |
| Duplicate collision                  | Pre-audit + Strategy B                                                        |
| Concurrent write race                | Write gate + unique index                                                     |
| Privilege escalation via environment | No public env mutation; migration-time exception only                         |
| Vault mutation                       | Forbidden entirely                                                            |
| Secret leakage                       | Metadata-only audit logs                                                      |

Fail-closed default: if uncertain, **do not write**.

---

## Developer Perspective

| Question       | Answer                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| Deterministic? | Yes, if classifier is frozen and evidence is Vault-id + row predicates |
| Testable?      | Yes — SQL fixtures + service/migration unit tests without venue I/O    |
| Rerun safely?  | Yes — idempotent conditional UPDATE                                    |
| Auditable?     | Yes — counters + ID lists without secrets                              |

Do not reimplement CONN-01/02/03 contracts; only residual migration tooling / scripts / gated updates.

---

## Operator Perspective

Operators must understand:

1. Which Connection IDs were updated NULL→live and why (evidence class).
2. Which IDs remained NULL and why (ambiguous / blocked / out of scope).
3. That EXCHANGE NULL rows still **cannot** validate (CONN-03) until remediated.
4. That Vault secrets were **not** changed.
5. That no FIV / venue I/O / capital movement occurred.

No silent data changes. Maintenance window + write gate should be visible in runbooks.

---

## Security Perspective

Process must guarantee:

| Guarantee                       | Mechanism                                             |
| ------------------------------- | ----------------------------------------------------- |
| Workspace isolation             | workspace predicates + Vault workspace match          |
| Exact `vaultSecretId`           | unchanged; id-matched purpose read only               |
| Model C                         | classify from actual purpose; post-use path unchanged |
| No cross-environment escalation | never touch TESTNET rows; deny testnet purpose→live   |
| No sibling substitution         | no credential rebinding                               |
| No Vault mutation               | hard scope exclusion                                  |

---

## Proposed Sub-Slices

Candidate structure (not approved by this artifact):

| Sub-slice                                                     | Needed?         | Rationale                                                                                                                             |
| ------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **FIV-CONN-04-A** Pre-backfill audit / inventory              | **YES**         | Mandatory by D-CRED-02-04/05; production may differ from local                                                                        |
| **FIV-CONN-04-B** Eligibility and classification contract     | **YES**         | Locks deterministic LIVE evidence + ambiguity disposition                                                                             |
| **FIV-CONN-04-C** Controlled LIVE backfill                    | **YES**         | Core residual write; metadata only                                                                                                    |
| **FIV-CONN-04-D** Post-backfill verification / reconciliation | **YES**         | Proves idempotency, Model C, Strategy B, residual NULL set                                                                            |
| **FIV-CONN-04-E** Final constraint hardening (NOT NULL)       | **CONDITIONAL** | Justified by parent freeze final state, but only if zero unresolved NULL EXCHANGE remain or PO accepts destructive/forced disposition |

Recommendation: treat **A→B→C→D** as the default coherent package; keep **E** explicitly optional pending D-CONN-04-07.

---

## Required PO Decisions

All items below are **PO DECISION REQUIRED** before implementation authorization. This package presents options; it does **not** freeze them.

### D-CONN-04-01 — What qualifies as unambiguous LIVE?

| Options                                                                  | Consequences                          |
| ------------------------------------------------------------------------ | ------------------------------------- |
| **A)** Vault-proven only: bound purpose ∈ `{trading, trading_live}`      | Strict; metadata-only remain NULL     |
| **B)** Vault-proven **or** metadata-only EXCHANGE (parent-era semantics) | Broader backfill; weaker evidence bar |
| **C)** Vault-proven + explicit operator allowlist IDs                    | Safest ops hybrid                     |

### D-CONN-04-02 — Ambiguous NULL EXCHANGE handling

Options: remain NULL fail-closed / quarantine+review / defer to separate slice.  
**Must not** silent LIVE.

### D-CONN-04-03 — Purpose mismatch handling

Options: quarantine+skip / abort entire backfill / manual remediation only.  
**Must not** mutate Vault to reconcile.

### D-CONN-04-04 — Missing / dangling / revoked credentials

Options per subclass: skip; quarantine; include revoked metadata-only env write; exclude all revoked from LIVE identity.  
Default recommendation: dangling/mismatch = quarantine; revoked = exclude from auto-LIVE unless explicitly frozen.

### D-CONN-04-05 — Duplicate logical identities

Options: block write for colliding credentialed sets / require manual cleanup slice / allow metadata-only duplicates only (Strategy B default).  
**Must not** auto-merge secrets.

### D-CONN-04-06 — May NULL EXCHANGE remain after backfill?

Options: yes (fail closed residual) / no (forces classification or deletion — deletion out of default scope).

### D-CONN-04-07 — Is EXCHANGE NOT NULL part of CONN-04?

Options: include in 04-E / defer to later slice / never enforce at DB (app-only).  
Blocked if D-CONN-04-06 allows residual NULL.

### D-CONN-04-08 — Transaction / concurrency policy

Confirm D-CRED-02-12 application write gate scope: deny store/replace/revoke/(create?) during critical section; single-runner backfill.

### D-CONN-04-09 — Operator audit requirements

Minimum report fields/counters; retention; who signs completion.

### D-CONN-04-10 — Do unresolved rows block FIV-PRE-01 completion?

Options: unresolved NULL EXCHANGE blocks PRE-01 / only blocks EXCHANGE NOT NULL / PRE-01 can proceed with fail-closed residuals documented.

---

## Architecture Questions

### AQ-04-01 — What is authoritative evidence for classifying NULL EXCHANGE as LIVE?

**Answer:** Strongest: exact `vaultSecretId` → Vault metadata purpose ∈ `{trading, trading_live}` with matching workspace. Historical omit-purpose path is supporting rationale but is **not** sufficient alone under the CONN-04 evidence bar unless PO freezes D-CONN-04-01 Option B/C.

### AQ-04-02 — Can environment be inferred from Vault purpose?

**Answer:** Yes for **eligibility classification** via `tradingEnvironmentFromPurpose`. No for silently mutating Connection without audit/eligibility gates. Vault purpose does not authorize rewriting an existing `testnet` Connection to `live`.

### AQ-04-03 — If Vault purpose says LIVE-class, can Connection safely be backfilled LIVE?

**Answer:** Yes **iff** other gates pass (EXCHANGE, NULL env, workspace match, Strategy B, not revoked-if-excluded). This preserves Model C for subsequent use.

### AQ-04-04 — What happens when Vault purpose conflicts with existing Connection data?

**Answer:** For NULL Connection proposing LIVE: treat as **mismatch/ambiguous** — do not write LIVE; quarantine. For already-populated env conflicting with purpose: **out of CONN-04 mutation scope** — CONN-03 fail-closed remains; remediation is separate.

### AQ-04-05 — How are ambiguous records isolated?

**Answer:** Remain `environment NULL`; excluded from UPDATE set; listed in quarantine/audit output; runtime remains FAIL CLOSED (CONN-03). No new bypass flag.

### AQ-04-06 — How does Strategy B uniqueness affect backfill?

**Answer:** Credentialed NULL→live enters the partial unique index. Pre-audit must ensure ≤1 credentialed non-revoked EXCHANGE per `(workspace, provider, live)` after projection. Metadata-only duplicates do not violate Strategy B.

### AQ-04-07 — Can backfill be safely rerun?

**Answer:** Yes if implemented as conditional idempotent UPDATE on `environment IS NULL` with unchanged `vaultSecretId` predicate and deterministic eligibility.

### AQ-04-08 — Can backfill occur while normal Connection writes continue?

**Answer:** Not safely for credential bind/create races. Require write serialization (D-CRED-02-12). Reads may continue; credential writes should not.

### AQ-04-09 — Does NOT NULL need to be introduced?

**Answer:** Parent freeze expected it eventually. Repository still nullable. Introduce only if PO freezes D-CONN-04-07 **and** residual NULL EXCHANGE set is empty or otherwise dispositioned. Otherwise defer.

### AQ-04-10 — What evidence is required before declaring backfill complete?

**Answer:**

1. Audit inventory complete for target environment(s).
2. All eligible rows updated or explicitly skipped with reason.
3. Zero Strategy B duplicate groups for live/testnet credentialed keys.
4. Zero TESTNET→LIVE or LIVE→TESTNET flips.
5. Zero Vault mutations.
6. Residual NULL EXCHANGE set enumerated and dispositioned per PO policy.
7. Idempotent re-run is no-op.
8. Model C spot-check: updated rows’ bound purposes map to `live`.

---

## Security Questions

### SQ-04-01 — Can an attacker cause a NULL Connection to become LIVE?

**Answer:** Not via public API today (no env mutation DTO). Risk is privileged migration misuse or compromised admin running backfill with weak classifier. Mitigate: PO-frozen eligibility, write gate, audited ID allowlist, no client-controlled purpose/env.

### SQ-04-02 — Can backfill accidentally select a sibling credential?

**Answer:** No if `vaultSecretId` is immutable in the UPDATE and purpose is read only for that id. Forbidden to lookup by provider/purpose.

### SQ-04-03 — Can backfill cross workspace boundaries?

**Answer:** Prevent by Connection workspace predicate + Vault workspace match check before eligibility.

### SQ-04-04 — Can TESTNET become LIVE?

**Answer:** Forbidden. Skip `environment='testnet'`; deny LIVE eligibility when purpose is `trading_testnet`.

### SQ-04-05 — Can a purpose mismatch be hidden?

**Answer:** Not if eligibility requires actual purpose inspection and CONN-03 use-time Model C remains. Do not “fix” by writing env without purpose check.

### SQ-04-06 — Can a revoked credential become eligible?

**Answer:** Only if PO freezes that. Default recommendation: exclude revoked from auto-LIVE identity entry (Strategy B already excludes REVOKED from uniqueness, but env write still changes audit semantics).

### SQ-04-07 — Can concurrent writes bypass uniqueness?

**Answer:** No for credentialed populated-env rows — Strategy B DB index is authoritative. App gate reduces race windows; P2002 must map to Conflict/abort.

### SQ-04-08 — Can Vault secrets be mutated indirectly?

**Answer:** Not by CONN-04 scope. Ensure scripts call no Vault store/replace/rotate APIs. Metadata SELECT only.

---

## Acceptance Criteria

| ID        | Criterion                                                                                 |
| --------- | ----------------------------------------------------------------------------------------- |
| **AC-01** | All Connection records in target DB(s) are inventoried (counts by type/env/credentialed). |
| **AC-02** | EXCHANGE NULL records are identified with workspace/provider/status/credentialed flags.   |
| **AC-03** | Unambiguous LIVE eligibility is deterministic under frozen D-CONN-04-01.                  |
| **AC-04** | Ambiguous records are not silently classified as LIVE.                                    |
| **AC-05** | Vault secrets are not mutated.                                                            |
| **AC-06** | `vaultSecretId` remains unchanged for all rows.                                           |
| **AC-07** | Model C remains valid for updated rows (LIVE-class purpose ↔ `live`).                     |
| **AC-08** | Strategy B uniqueness is preserved (no credentialed duplicate live keys).                 |
| **AC-09** | Workspace isolation is preserved.                                                         |
| **AC-10** | Backfill is idempotent (second run no-op on already-live).                                |
| **AC-11** | Concurrent write behavior is defined and enforced via write gate.                         |
| **AC-12** | Rollback/recovery is defined (forward-fix; never env flip to testnet).                    |
| **AC-13** | Auditability is defined (counters + unresolved ID list).                                  |
| **AC-14** | No secret leakage in logs/reports/artifacts.                                              |
| **AC-15** | Existing LIVE remains LIVE.                                                               |
| **AC-16** | Existing TESTNET remains TESTNET.                                                         |
| **AC-17** | No FIV occurs.                                                                            |
| **AC-18** | No external venue I/O occurs.                                                             |
| **AC-19** | Non-EXCHANGE NULL rows are not auto-backfilled.                                           |
| **AC-20** | Application environment immutability remains intact outside migration exception.          |
| **AC-21** | CONN-01/02/03 CLOSED behaviors are not redesigned.                                        |
| **AC-22** | Migration-time exception is explicit, time-bounded, and documented.                       |
| **AC-23** | Residual NULL EXCHANGE set after backfill is explicitly enumerated.                       |
| **AC-24** | NOT NULL enforcement occurs only if PO-frozen and residual policy allows.                 |

---

## Security Acceptance Criteria

| ID           | Criterion                                                                            |
| ------------ | ------------------------------------------------------------------------------------ |
| **SC-04-01** | No cross-workspace mutation.                                                         |
| **SC-04-02** | No cross-provider mutation.                                                          |
| **SC-04-03** | No TESTNET→LIVE escalation.                                                          |
| **SC-04-04** | No LIVE→TESTNET reinterpretation.                                                    |
| **SC-04-05** | No sibling-secret substitution.                                                      |
| **SC-04-06** | No `vaultSecretId` replacement.                                                      |
| **SC-04-07** | No purpose mismatch accepted into LIVE backfill.                                     |
| **SC-04-08** | No revoked credential silently accepted unless PO explicitly freezes inclusion.      |
| **SC-04-09** | No provider-only credential selection.                                               |
| **SC-04-10** | No client-controlled environment mutation.                                           |
| **SC-04-11** | No Vault mutation.                                                                   |
| **SC-04-12** | No secret leakage.                                                                   |
| **SC-04-13** | NULL ≠ LIVE preserved for non-updated rows.                                          |
| **SC-04-14** | Strategy B remains the uniqueness authority for credentialed populated-env EXCHANGE. |

---

## Dependencies

| Dependency                | State              | CONN-04 relation                                       |
| ------------------------- | ------------------ | ------------------------------------------------------ |
| FIV-CRED-01               | CLOSED             | Exact-purpose taxonomy reused; do not reimplement      |
| FIV-CONN-01               | CLOSED             | Nullable env + immutability + create validation reused |
| FIV-CONN-02               | CLOSED             | Strategy B already present; collision gate required    |
| FIV-CONN-03               | CLOSED             | Model C + NULL fail-closed reused; do not reopen       |
| FIV-CRED-02 parent freeze | FROZEN             | D-CRED-02-04/05/09/12 govern backfill                  |
| Prisma / PostgreSQL       | Available          | Metadata UPDATE + read-only joins                      |
| Vault                     | Read metadata only | No redesign                                            |
| Connections service       | Immutable env APIs | Migration exception outside normal APIs                |
| Credential services       | Unchanged          | No rebind                                              |
| Workspace authorization   | Unchanged          | Preserve isolation                                     |

**Do not reimplement:** ENV1 taxonomy, Strategy B index, Model C handshake wiring, SecretPurpose set, EG1, C7.

---

## FIV-PRE-01 Relationship

### What completing FIV-CONN-04 unblocks

- Legacy EXCHANGE rows gain explicit `live` where unambiguously proven, restoring a coherent multi-env inventory.
- Reduces transitional NULL EXCHANGE population that is permanently fail-closed under CONN-03.
- Enables a principled decision on EXCHANGE NOT NULL (parent residual).
- Advances FIV-CRED-02 Connection-side migration completeness toward PRE-01 readiness **without** authorizing FIV.

### What remains after FIV-CONN-04

| Item                                     | Owner           |
| ---------------------------------------- | --------------- |
| Full security regression matrix          | FIV-CONN-05     |
| Vault-backed live provider Nest wiring   | FIV-CRED-03     |
| Handshake origin/host selection          | FIV-CRED-04     |
| UI Testnet operator flow                 | FIV-CRED-05     |
| C7 / controlled Testnet I/O / FIV itself | later PRE gates |

```text
FIV-PRE-01: NOT CLOSED by this package
FIV: NOT READY / NOT AUTHORIZED
```

Unresolved ambiguous NULL EXCHANGE may still leave operator-visible fail-closed Connections; whether that blocks PRE-01 is **D-CONN-04-10**.

---

## Scope

```text
IN SCOPE (planning boundary for future authorized implementation):
  - Read-only pre-backfill audit / inventory
  - Deterministic LIVE eligibility classifier (PO-frozen)
  - Ambiguity / quarantine policy (no silent LIVE)
  - Controlled Connection.environment NULL→live writes for approved rows
  - Strategy B collision detection before/after writes
  - Idempotency, concurrency gate, rollback/observability definitions
  - Optional EXCHANGE NOT NULL hardening ONLY if PO-frozen and evidence-justified
  - Focused tests/fixtures for migration classifier + idempotency (no venue I/O)
```

---

## Non-Scope

```text
OUT OF SCOPE:
  - Reopening/modifying FIV-CONN-01 / 02 / 03
  - FIV-CONN-05 full regression matrix (beyond backfill-focused proofs)
  - UI Testnet selection / FIV-CRED-05
  - Binance/Bybit/OKX calls; handshake origin work (CRED-04)
  - Vault/SecretPurpose/ENV1/EG1 redesign
  - Credential create/rotate/delete; vaultSecretId replacement
  - Duplicate destructive cleanup (unless separately PO-authorized later)
  - C7 changes; allowRealVenueIo=true; FIV; capital movement
  - DEMO support
  - Blanket NULL→LIVE without evidence
```

---

## Risks

| ID   | Risk                                               | Severity | Mitigation                            |
| ---- | -------------------------------------------------- | -------- | ------------------------------------- |
| R-01 | Metadata-only auto-LIVE over-classification        | High     | Freeze D-CONN-04-01 strict evidence   |
| R-02 | Strategy B collision on credentialed backfill      | High     | Pre-audit + abort closed              |
| R-03 | Concurrent credential store during backfill        | High     | D-CRED-02-12 write gate               |
| R-04 | Weakening env immutability permanently             | Medium   | Time-bounded migration exception only |
| R-05 | Enforcing NOT NULL while ambiguous residuals exist | High     | Make 04-E conditional                 |
| R-06 | Scope bleed into CONN-03/05/CRED-04                | Medium   | Explicit non-scope                    |
| R-07 | Local inventory ≠ production                       | High     | Mandatory prod audit in 04-A          |
| R-08 | Operator confusion that NULL still fails closed    | Medium   | Audit report + runbook                |

---

## Open Questions

All implementation-critical open questions are captured as **PO DECISION REQUIRED** items D-CONN-04-01…10.  
No additional unresolved questions are deferred as hidden implementation choices.

Informational (non-blocking) notes:

- No dedicated CONN-02 decision-freeze file exists; parent CRED-02 + CONN-02 approvals are authoritative.
- Production inventories may differ from the local 13-row snapshot; 04-A is mandatory.

---

## Planning Verdict

```text
READY FOR PLANNING REVIEW

Planning Package: COMPLETE
Implementation: NOT AUTHORIZED
Slice Approval: NOT GRANTED
Backfill: NOT PERFORMED
FIV-CONN-04: NOT STARTED (planning artifact only)

PO decisions required before implementation:
  D-CONN-04-01 … D-CONN-04-10
```

This package does **not** disguise PO decisions as implementation choices. Residual technical sequence is defined; eligibility/ambiguity/NOT NULL/PRE-01-blocking policy require governance freeze.

---

## Safety State (this planning act)

```text
External I/O:       ZERO
Binance:            ZERO
Bybit:              ZERO
OKX:                ZERO
FIV:                NOT PERFORMED
Capital:            ZERO
C7:                 DENY-ALL
allowRealVenueIo:   FALSE
Vault:              NOT MODIFIED
Credentials:        NOT MODIFIED
Database:           READ-ONLY INVENTORY ONLY (no mutations)
Schema:             NOT MODIFIED
Migrations:         NOT CREATED
Protected leftovers: UNTOUCHED
```

---

## Next governance gate

```text
Next gate:
FIV-CONN-04 PLANNING REVIEW
```

Do **not** begin Architecture/Security/PO freeze, Slice Approval, or implementation in this act.

---

**END OF FIV-CONN-04 PLANNING PACKAGE**
