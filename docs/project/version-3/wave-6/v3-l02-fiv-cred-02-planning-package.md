# V3-L02 FIV-CRED-02 — Connection Environment Planning Package

**Document:** FIV-CRED-02 Connection Environment + Provider/Environment Uniqueness Planning Package
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-PRE-01
**Slice:** FIV-CRED-02
**Authority:** Senior Backend Architect + Security Engineer + Governance Planning Author
**Nature:** **PLANNING ONLY.** Does **not** authorize implementation by itself. Does **not** close FIV-PRE-01. Does **not** authorize C7, Testnet I/O, FIV, credential provisioning, schema/API/UI changes, or `allowRealVenueIo=true`.

**Governance chain:**

```text
FIV-PRE-01 Implementation Authorization
        → FIV-CRED-01 CLOSED
        → FIV-CRED-02 Slice Planning   ← THIS ARTIFACT
        → Architecture Review
        → Security Review
        → PO/Governance Planning Approval
        → Slice Approval
        → Implementation
```

**Basis artifacts:**

| Artifact | Path | Status |
| -------- | ---- | ------ |
| FIV-CRED-01 Closure | `docs/project/version-3/wave-6/v3-l02-fiv-cred-01-closure.md` | **CLOSED** |
| FIV-PRE-01 PO Decision Freeze | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-po-governance-decision-freeze.md` | APPROVED (PO-CRED-01…09) |
| FIV-PRE-01 Implementation Authorization | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-implementation-authorization.md` | GRANTED (package; per-slice gates remain) |
| ENV1 taxonomy | `apps/api/src/modules/execution-adapter/live-venue-egress/trading-credential-environment.ts` | Shipped |

**Repository baseline (planning start):** `8cdcf650726d4f7ac0bb7c50e1907cf3adfa4a20`

```text
PLANNING COMPLETE — READY FOR ARCHITECTURE REVIEW
Implementation NOT YET AUTHORIZED BY THIS PLANNING ARTIFACT
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Objective

Solve the product-path ambiguity where Connections omit credential purpose/environment and resolve exchange Vault slots via omit-purpose default:

```text
purpose omitted
        ↓
defaultPurposeForType(exchange)
        ↓
SecretPurpose.Trading
        =
LIVE-class
```

Target (approved Model C / PO-CRED-02):

```text
Vault purpose
    =
runtime credential/environment SoT

Connection.environment
    =
persisted Connection constraint / audit context
```

FIV-CRED-02 must plan the **Connection-side half** of Model C: explicit environment, provider+environment uniqueness, LIVE backfill, and fail-closed mismatch/missing-environment rules — **without** implementing Vault-backed live provider wiring (FIV-CRED-03) or handshake origin selection (FIV-CRED-04).

---

## 2. Current Connection Model

### 2.1 Persistence (FACT)

**Path:** `apps/api/prisma/schema.prisma` → `ConnectionRecord` / table `connection_records`

| Field | Present? |
| ----- | -------- |
| `id` | YES |
| `workspaceId` | YES |
| `displayName` | YES |
| `provider` | YES (string; e.g. `BINANCE`) |
| `connectionType` | YES (`EXCHANGE` / `NOTIFICATION` / `AI`) |
| `vaultSecretId` | YES (nullable opaque Vault id) |
| `status` | YES |
| `createdAt` / `updatedAt` | YES |
| `environment` | **NO** |
| `purpose` | **NO** |

**Indexes / uniqueness (FACT):**

```text
@@index([workspaceId, createdAt])
@@index([workspaceId, provider])
@@unique([workspaceId, provider, vaultSecretId])
```

Migrations:

* `apps/api/prisma/migrations/20260817193000_w2_s01_a_connection_metadata/migration.sql`
* `apps/api/prisma/migrations/20260817193500_w2_s01_b_connection_vault_reference/migration.sql`

### 2.2 Domain / API surface (FACT)

| Concern | Path |
| ------- | ---- |
| Service | `apps/api/src/modules/connections/connections.service.ts` |
| Controller | `apps/api/src/modules/connections/connections.controller.ts` |
| DTOs | `apps/api/src/modules/connections/connections.dto.ts` |
| Catalog | `apps/api/src/modules/connections/connection-catalog.ts` |
| Vault type map | `apps/api/src/modules/connections/connection-vault.ts` |
| Validator | `apps/api/src/modules/connections/connection-validator.ts` |
| Lifecycle | `apps/api/src/modules/connections/connection-lifecycle.ts` |
| View type | `ConnectionMetadataView` (no environment field) |

**Create DTO fields today:** `displayName`, `provider` only — **no environment**.

### 2.3 Answers to mandatory questions

| # | Question | Answer | Class |
| - | -------- | ------ | ----- |
| 1 | Does Connection contain `environment`? | **No** | FACT |
| 2 | Does Connection contain `purpose`? | **No** | FACT |
| 3 | How is provider/type represented? | `provider` string + derived `connectionType` via `providerType()` | FACT |
| 4 | How is workspace ownership enforced? | `X-Workspace-Id` + `WorkspaceAccessService.assertMember`; row fetch `findFirst({ id, workspaceId })` | FACT |
| 5 | What makes a Connection unique? | DB: `(workspaceId, provider, vaultSecretId)`. App credential-slot: **provider-only** among credentialed rows | FACT |
| 6 | How is associated credential resolved? | `vaultSecretTypeForProvider(provider)` + Vault `get`/`store`/`retrieve`/`revoke` **without purpose** → defaults to `SecretPurpose.Trading` for exchanges | FACT |
| 7 | Where does LIVE default occur? | Vault `resolvePurpose` omit → `defaultPurposeForType` → `Trading` (LIVE-class under ENV1) | FACT |
| 8 | Can two Binance Connections coexist? | **Metadata-only:** create does not block multiple BINANCE rows. **Credentialed:** `assertCredentialSlotAvailable` denies second credentialed provider slot | FACT |
| 9 | Can LIVE and TESTNET be represented independently? | **No** today — no environment field; Vault purpose always defaults LIVE for Connections path | FACT |
| 10 | Provider-only lookup? | **YES** — see §12 | FACT |

### 2.4 Credential store / resolve path (FACT)

```text
ConnectionsService.storeCredentials / replaceCredentials
        → vault.store|replace({ workspaceId, type, fields })  // purpose omitted
        → SecretPurpose.Trading

ConnectionsService.revoke / validate (local)
ExchangeHandshakeService.perform
ExchangeCapabilityService.verify
        → vault.get|retrieve({ workspaceId, type })  // purpose omitted
        → SecretPurpose.Trading slot only
```

### 2.5 NOT VERIFIED / INFERENCE

| Item | Class |
| ---- | ----- |
| Production row counts / whether any Testnet Vault rows already exist outside Connections | NOT VERIFIED (no live DB inspection) |
| All existing exchange Connection credentials in prod/staging are LIVE-class `trading` | **INFERENCE** from code path (omit-purpose → Trading); consistent with FIV-CRED-01 findings |
| PostgreSQL NULL uniqueness allows multiple `(workspace, provider, NULL vaultSecretId)` rows | INFERENCE from SQL NULL unique semantics + create() allowing repeats |

---

## 3. Approved Target Model

### 3.1 Connection identity (target)

```text
Connection
    ├── workspaceId
    ├── provider/type
    └── environment   // NEW persisted constraint / audit context
```

### 3.2 Environment values for FIV-CRED-02

Evaluate and plan **at minimum**:

```text
LIVE
TESTNET
```

**Reuse existing taxonomy — do not invent a second abstraction.**

**FACT:** ENV1 already defines:

```text
TradingCredentialEnvironment = 'live' | 'testnet' | 'demo'
```

in `trading-credential-environment.ts`.

**Planning recommendation:**

* Persist Connection environment using the **same string vocabulary** (`live` / `testnet`, and optionally `demo` later for OKX).
* For FIV-CRED-02 initial multi-environment enablement of Binance (and Bybit): require explicit `live` | `testnet`.
* `demo` may remain deferred unless Architecture insists OKX demo Connections land in the same slice; default proposal = **defer DEMO Connection create** to a later gate unless required for uniqueness completeness.

### 3.3 Multi-environment providers

| Provider family | Multi-environment? | Environment rule (proposal) |
| --------------- | ------------------ | --------------------------- |
| `BINANCE`, `BYBIT`, `OKX` (EXCHANGE) | YES | Environment **required** on create; missing → REJECT |
| Notification / AI providers | NO (single Vault purpose today) | Environment **not required**; omit or ignore; do not invent fake environments |

---

## 4. Model C Contract (Connection-side)

Preserve:

```text
Vault purpose = runtime credential/environment SoT
Connection.environment = persisted store/audit constraint
```

### Eligible

```text
Connection: BINANCE + testnet
Vault purpose: TradingTestnet
        → ELIGIBLE (environments match)
```

```text
Connection: BINANCE + live
Vault purpose: Trading  OR  TradingLive
        → ELIGIBLE (both ENV1 LIVE-class)
```

### Must FAIL CLOSED

```text
Connection: BINANCE + testnet
Vault purpose: Trading / TradingLive
        → DENY
```

```text
Connection: BINANCE + live
Vault purpose: TradingTestnet
        → DENY
```

**Critical implementation note (planning):** Do **not** compare Connection.environment to `purposeForTradingEnvironment(env)` string equality alone for LIVE, because:

```text
purposeForTradingEnvironment('live') → TradingLive
Connections-legacy Vault rows → Trading
```

Both are LIVE-class under `tradingEnvironmentFromPurpose`. The mismatch check must be:

```text
tradingEnvironmentFromPurpose(vaultPurpose)
        ==
Connection.environment
```

Connection.environment MUST NOT override Vault purpose.
Vault purpose MUST NOT silently rewrite Connection.environment.

Full Vault-backed live provider wiring remains **FIV-CRED-03**. FIV-CRED-02 must still define and (when implemented) enforce the constraint at Connection credential store/replace/validate paths that already touch Vault.

---

## 5. Provider + Environment Uniqueness

### Current (FACT)

* DB unique: `(workspaceId, provider, vaultSecretId)` — insufficient for LIVE+TESTNET coexistence of credentialed Connections.
* App slot: `findFirst({ workspaceId, provider, vaultSecretId: { not: null } })` — **provider-only**; blocks second credentialed BINANCE regardless of intended environment.

### Target invariant

```text
Workspace A
    BINANCE + live
    BINANCE + testnet
```

must be representable simultaneously (each with its own Vault purpose slot).

Duplicates for the same `(workspaceId, provider, environment)` must not silently coexist as ambiguous credentialed Connections.

### Minimal safe uniqueness proposal

```text
For EXCHANGE multi-environment providers:
  unique active credentialed identity ≈
    workspaceId + provider + environment
```

Recommended sequencing (planning only):

1. Add nullable `environment` column.
2. Backfill existing rows → `live`.
3. Enforce NOT NULL for EXCHANGE (or for multi-env providers).
4. Replace provider-only `assertCredentialSlotAvailable` with provider+environment.
5. Add unique constraint supporting coexistence — e.g. `@@unique([workspaceId, provider, environment])` **or** a partial unique on credentialed rows; Architecture must pick exact SQL form that preserves metadata-only create semantics if still allowed.

**Conflict with current DB unique:** `(workspaceId, provider, vaultSecretId)` may remain as Vault reference integrity aid, but **cannot** be the sole coexistence key.

Do **not** implement or generate migration in this planning act.

---

## 6. Existing LIVE Connections — Backward Compatibility

### Evidence

All Connections exchange credential paths omit Vault purpose → `SecretPurpose.Trading` (LIVE-class). No Connection.environment exists to mark Testnet.

### Default approved backfill direction

```text
Existing Connection rows (especially EXCHANGE)
        ↓
environment = live
```

**Can existing Connections be safely backfilled to LIVE?**

```text
YES — based on repository evidence
```

**Why:**

* No alternate environment field exists today.
* Credential store/retrieve always targets LIVE-class `Trading` purpose.
* Backfill to `live` preserves current semantics (PO-CRED-07); does **not** migrate secrets or reclassify Vault purposes.

**Prohibitions:**

* Do not convert any Connection to `testnet` during backfill.
* Do not copy/move LIVE Vault secrets into `TradingTestnet`.
* Do not alter existing Vault purpose values in FIV-CRED-02.

---

## 7. No Silent LIVE Default (PO-CRED-03)

Once multi-environment Connections exist for a provider:

```text
Create Connection (multi-env provider)
    environment omitted
        ↓
REJECT / FAIL CLOSED
```

| Scenario | Preferred behavior |
| -------- | ------------------ |
| EXCHANGE create without environment | Reject |
| EXCHANGE create with invalid environment | Reject |
| Notification/AI create without environment | Allow (single-environment providers) |
| Legacy rows after backfill | Explicit `live` persisted — not “implicit default at read time” |

**Do not** keep omit-environment → silent LIVE for new multi-env creates after the feature lands.

---

## 8. API / Domain Contract Impact Surface

Paths that **will** require environment awareness in future implementation:

| Path | File | Impact |
| ---- | ---- | ------ |
| create | `connections.service.ts` / DTO / controller | Accept + validate environment for EXCHANGE |
| list / get / view | service `view()` | Expose environment in metadata (no secrets) |
| rename | service | Likely unchanged |
| storeCredentials / replaceCredentials | service | Pass Vault purpose derived from Connection.environment; uniqueness by provider+env |
| revoke / validate | service | Vault get/retrieve/revoke with exact purpose |
| assertCredentialSlotAvailable | service | Replace provider-only check |
| handshake trigger | `completeExchangeHandshake` → `ExchangeHandshakeService` | Must pass purpose eventually — **origin selection is FIV-CRED-04**; FIV-CRED-02 should at least pass correct Vault purpose into retrieve |
| capability verify | `ExchangeCapabilityService` | Same purpose-aware retrieve |
| Web Connections UI | `apps/web/src/connections/*` | Environment selector — primarily **FIV-CRED-05**; FIV-CRED-02 may ship API-first |

Minimum future implementation surface for FIV-CRED-02 = **API/service/persistence + tests**; UI may be deferred if Architecture accepts API-first.

---

## 9. Provider-Only Lookup

### FOUND (FACT)

| Location | Behavior |
| -------- | -------- |
| `ConnectionsService.assertCredentialSlotAvailable` | `findFirst({ workspaceId, provider, vaultSecretId: { not: null } })` |
| Vault calls from Connections / handshake / capability | type+workspace **without purpose** → LIVE `Trading` slot |
| `assertRevokedCredentialSlotAvailable` | Vault get by type only (omit purpose) |

### Target resolution

```text
workspace + provider + environment
        ↓
exact Connection
        ↓
expected purpose via purposeForTradingEnvironment / LIVE-class rule
        ↓
exact Vault slot
```

No cross-environment fallback.
No provider-only credentialed Connection selection once multi-env is live.

---

## 10. Credential Resolution Boundary (to FIV-CRED-03)

FIV-CRED-01 closed exact-purpose Vault isolation.

FIV-CRED-02 defines the Connection constraint contract:

```text
Connection.environment
        ↓
expected TradingCredentialEnvironment
        ↓
compatible Vault purpose(s)
        ↓
exact Vault resolve (workspace + type + purpose)
```

Mismatch → **FAIL CLOSED**.

Vault-backed `LiveTradingCredentialProvider` Nest wiring = **FIV-CRED-03** (out of scope).

---

## 11. FIV-CRED-02 Security Analysis

### CR-02-01 — Testnet Connection resolves LIVE credential

| Field | Content |
| ----- | ------- |
| Threat | TESTNET Connection uses `Trading` material |
| Current state | No Connection.environment; all Connections resolve LIVE slot |
| Impact | Capital / wrong-venue risk if Testnet product path later mis-binds |
| Required mitigation | Persist env; store/retrieve with `TradingTestnet`; mismatch deny via ENV1 equality |
| Required test | BINANCE+testnet + Trading only → DENY |

### CR-02-02 — LIVE Connection resolves Testnet credential

| Field | Content |
| ----- | ------- |
| Threat | LIVE Connection uses `TradingTestnet` material |
| Current state | Testnet Vault slot unused by Connections |
| Impact | False confidence / wrong key class |
| Required mitigation | Same mismatch check |
| Required test | BINANCE+live + TradingTestnet only → DENY |

### CR-02-03 — Missing environment defaults to LIVE

| Field | Content |
| ----- | ------- |
| Threat | Operator intends Testnet; omit env; silent LIVE |
| Current state | Entire create path has no env (effectively always LIVE credentials) |
| Impact | High once Testnet UI exists |
| Required mitigation | Reject omit for EXCHANGE creates after feature |
| Required test | Create BINANCE without environment → 4xx |

### CR-02-04 — Provider-only Connection lookup

| Field | Content |
| ----- | ------- |
| Threat | Ambiguous selection between LIVE and TESTNET Connections |
| Current state | Provider-only credential slot enforcement |
| Impact | Blocks coexistence; unsafe if naively relaxed |
| Required mitigation | provider+environment uniqueness + lookups |
| Required test | Two credentialed BINANCE (live+testnet) allowed; third same env denied |

### CR-02-05 — Cross-workspace Connection access

| Field | Content |
| ----- | ------- |
| Threat | Workspace A uses Workspace B Connection/credentials |
| Current state | `getRow(workspaceId, id)` + Vault access control |
| Impact | Isolation break |
| Required mitigation | Preserve workspace scoping |
| Required test | Cross-workspace get/store/retrieve DENY |

### CR-02-06 — Duplicate provider/environment Connections

| Field | Content |
| ----- | ------- |
| Threat | Ambiguous duplicate LIVE BINANCE Connections |
| Current state | Multiple metadata BINANCE allowed; one credentialed provider |
| Impact | Operator confusion / race |
| Required mitigation | Unique (workspace, provider, environment) for credentialed or all EXCHANGE rows — Architecture pick |
| Required test | Duplicate env create/store → Conflict |

### CR-02-07 — Existing LIVE Connection migration

| Field | Content |
| ----- | ------- |
| Threat | Backfill marks LIVE as TESTNET or mutates secrets |
| Current state | No env column |
| Impact | Catastrophic misclassification |
| Required mitigation | Backfill `live` only; no Vault purpose rewrite |
| Required test | Migration/backfill unit or SQL fixture asserts `live` |

### CR-02-08 — Environment tampering

| Field | Content |
| ----- | ------- |
| Threat | Client sends arbitrary environment / purpose to escalate |
| Current state | No env field; Vault purpose not client-set via Connections DTO |
| Impact | Wrong slot / wrong venue class |
| Required mitigation | Server allowlist `live`\|`testnet` (and demo if enabled); never accept raw SecretPurpose from client; EG1 origins remain server-fixed (FIV-CRED-04) |
| Required test | Invalid environment rejected; client cannot set purpose string |

### CR-02-09 — Secret exposure

| Field | Content |
| ----- | ------- |
| Threat | apiKey/secret in responses, logs, errors |
| Current state | Write-only credentials; metadata without secret fields |
| Impact | Credential leak |
| Required mitigation | Preserve write-only; no secret in environment APIs |
| Required test | Metadata JSON excludes credential fields |

### CR-02-10 — Backward compatibility

| Field | Content |
| ----- | ------- |
| Threat | Breaking existing LIVE Connections / Vault `Trading` rows |
| Current state | LIVE-only Connections path |
| Impact | Production outage |
| Required mitigation | Backfill live; accept Trading and TradingLive as LIVE-class match |
| Required test | Legacy Trading retrieve still works for live Connection |

---

## 12. Data Migration Analysis

### Is migration required?

```text
YES — schema migration required to add Connection.environment
```

### Components

| Step | Content |
| ---- | ------- |
| Precondition | FIV-CRED-02 Slice Approval; no concurrent unauthorized Connection schema edits |
| Transformation | Add `environment` column (nullable initially); backfill EXCHANGE (and/or all) rows to `live`; set NOT NULL for required providers; add uniqueness; update app slot checks |
| Postcondition | Every existing Connection has explicit `live`; new EXCHANGE creates require environment; LIVE+TESTNET coexistence possible |
| Rollback | Drop new unique constraint; restore prior nullability only if carefully sequenced — prefer forward-fix; do not delete backfilled `live` values casually |
| LIVE preservation | Backfill value `live` only; Vault untouched |
| Duplicate detection | Before unique constraint: detect duplicate credentialed `(workspace, provider)` that would collide when all become `live` — expect at most one credentialed per provider today |
| Failure behavior | Fail migration closed if duplicate live identities cannot be uniquified |

### Nullable transition

Recommended:

```text
add nullable column
  → backfill live
  → enforce NOT NULL for EXCHANGE
  → add unique (workspace, provider, environment)
```

Do **not** execute migration in this planning task.

---

## 13. Prisma / Persistence Analysis

### Minimal future schema change (proposal)

```text
model ConnectionRecord {
  ...
  environment String?  @map("environment")  // then NOT NULL for EXCHANGE after backfill
  ...
  @@unique([workspaceId, provider, environment])  // exact form TBD with Architecture
}
```

### Conventions

* String environment values aligned with ENV1 (`live`, `testnet`, …).
* New migration under `apps/api/prisma/migrations/` with timestamp naming like existing W2 Connections migrations.
* Do not create a parallel Prisma enum unless Architecture prefers; string + app allowlist matches Vault purpose style.

---

## 14. Proposed Slice Decomposition

```text
FIV-CONN-01 — Environment domain/persistence model
  Add Connection.environment; ENV1 vocabulary reuse; view/DTO types

FIV-CONN-02 — Provider + environment uniqueness
  Replace provider-only slot checks; unique constraint; coexistence tests

FIV-CONN-03 — Connection API/domain contract
  Create requires env for EXCHANGE; store/replace/revoke/validate purpose-aware Vault calls

FIV-CONN-04 — LIVE backward-compatible backfill
  Migration + backfill existing → live; Trading LIVE-class match rule

FIV-CONN-05 — Security regression / isolation tests
  CR-02-01…10 matrix; no network; placeholders only
```

These are **sub-steps inside FIV-CRED-02**, not separate FIV-PRE packages. Architecture may collapse FIV-CONN-01…05 into fewer PRs if safer, but must not expand into FIV-CRED-03…06.

---

## 15. Acceptance Criteria

| ID | Criterion |
| -- | --------- |
| **AC-01** | Connection environment is explicit for multi-environment providers |
| **AC-02** | LIVE and TESTNET are represented distinctly |
| **AC-03** | Existing LIVE Connections remain LIVE |
| **AC-04** | Existing LIVE credentials are not silently migrated to Testnet |
| **AC-05** | Workspace + provider + environment uniqueness is enforced where applicable |
| **AC-06** | Provider-only lookup cannot select a Connection in an ambiguous environment |
| **AC-07** | Connection environment mismatch with Vault purpose fails closed |
| **AC-08** | Missing environment cannot silently select LIVE once multi-environment behavior applies |
| **AC-09** | Cross-workspace access remains denied |
| **AC-10** | No secret values are exposed |
| **AC-11** | No Binance network I/O is required by FIV-CRED-02 implementation |
| **AC-12** | C7 remains DENY-ALL |
| **AC-13** | `allowRealVenueIo` remains false |
| **AC-14** | LIVE-class Vault purposes `Trading` and `TradingLive` both satisfy Connection `live` |
| **AC-15** | Handshake/capability retrieve purpose wiring either updated for exact purpose or explicitly deferred with fail-closed guard — Architecture must decide boundary vs FIV-CRED-04 |

---

## 16. Explicit Exclusions

```text
FIV-CRED-01 — already CLOSED
FIV-CRED-03 — Vault-backed live credential provider wiring
FIV-CRED-04 — Binance environment-aware handshake / fixed origins
FIV-CRED-05 — API/UI Testnet operator flow beyond Connection contract
FIV-CRED-06 — final security / FIV isolation verification
C7 / S04 / HumanStartProof / ExecutionAdapter / EG1 redesign
FIV execution / Binance I/O / real capital
```

---

## 17. Architecture Review Questions

### AQ-02-01

Is `Connection.environment` sufficient as the persisted Connection constraint while Vault purpose remains runtime SoT?

**Answer:** **YES** — aligns with PO-CRED-02 Model C. Connection.environment is constraint/audit; Vault purpose remains SoT. Mismatch fail-closed.

### AQ-02-02

What exact mismatch check prevents Connection TESTNET + Trading credential?

**Answer:**

```text
tradingEnvironmentFromPurpose(vaultPurpose) === connection.environment
```

For testnet Connection, vaultPurpose must be `TradingTestnet`. `Trading` / `TradingLive` → DENY.

### AQ-02-03

What exact uniqueness key permits BINANCE+LIVE and BINANCE+TESTNET coexistence?

**Answer (proposed):**

```text
(workspaceId, provider, environment)
```

replacing provider-only credential slot checks. Exact Prisma unique form subject to Architecture confirmation regarding metadata-only duplicates.

### AQ-02-04

How are existing LIVE Connections safely backfilled?

**Answer:** Schema add nullable `environment` → set `live` for existing rows → enforce NOT NULL for EXCHANGE → no Vault secret migration.

### AQ-02-05

How is missing environment handled?

**Answer:** For multi-environment EXCHANGE creates after feature: **REJECT / FAIL CLOSED**. For notification/AI: omit allowed. Legacy rows: explicit backfilled `live`.

### AQ-02-06

Where is provider-only lookup currently present?

**Answer:** `assertCredentialSlotAvailable` (Connections); Vault omit-purpose get/retrieve/store/revoke in Connections, `ExchangeHandshakeService`, `ExchangeCapabilityService`.

### AQ-02-07

What is the smallest schema/API change necessary?

**Answer:** Add `ConnectionRecord.environment`; create DTO/service validation; purpose-aware Vault calls from Connections; uniqueness + backfill migration; metadata view exposure. UI optional (FIV-CRED-05). Handshake origin selection remains FIV-CRED-04.

---

## 18. Security Review Questions

### SQ-02-01

Can a TESTNET Connection ever resolve a LIVE credential?

**Target answer:** **NO** — fail closed on environment≠purpose env.

### SQ-02-02

Can a LIVE Connection ever resolve a TESTNET credential?

**Target answer:** **NO** — same check.

### SQ-02-03

Can a Connection from workspace A resolve workspace B credentials?

**Target answer:** **NO** — preserve workspace membership + Vault isolation (already present).

### SQ-02-04

Can omitted environment accidentally select LIVE?

**Target answer after feature:** **NO** for EXCHANGE creates (reject). Backfilled rows are explicitly `live`, not an omit-default.

### SQ-02-05

Can duplicate environment-specific Connections create ambiguous resolution?

**Target answer:** **NO** — uniqueness on workspace+provider+environment (or equivalent).

### SQ-02-06

Can user-controlled input influence arbitrary endpoint selection?

**Target answer:** **NO** — environment allowlist only; EG1 fixed origins remain mandatory (PO-CRED-09); client must not supply arbitrary URLs/hosts. Endpoint selection implementation stays FIV-CRED-04.

---

## 19. Proposed Implementation Boundary

### REQUIRED

| Path | Why |
| ---- | --- |
| `apps/api/prisma/schema.prisma` | Add `environment` |
| New Prisma migration under `apps/api/prisma/migrations/` | Persist + backfill |
| `apps/api/src/modules/connections/connections.service.ts` | Create/store/slot/view purpose+env logic |
| `apps/api/src/modules/connections/connections.dto.ts` | Environment on create |
| `apps/api/src/modules/connections/connections.controller.ts` | Pass-through if needed |
| `apps/api/src/modules/connections/connections.service.spec.ts` (+ focused new spec) | Regression matrix |
| Reuse `trading-credential-environment.ts` / `secret-purpose.ts` | No second taxonomy |

### POSSIBLY REQUIRED

| Path | Why |
| ---- | --- |
| `apps/api/src/modules/exchange-connectivity/exchange-handshake.service.ts` | Purpose-aware retrieve (if not deferred to FIV-CRED-04 with temporary guard) |
| `apps/api/src/modules/exchange-connectivity/exchange-capability.service.ts` | Same |
| `apps/web/src/connections/*` | Thin API consumer — prefer FIV-CRED-05 unless API-first rejected |

### NOT IN SCOPE

| Path / area | Why |
| ----------- | --- |
| Vault-backed `LiveTradingCredentialProvider` Nest wiring | FIV-CRED-03 |
| Binance handshake origin / EG1 host selection changes | FIV-CRED-04 |
| Full operator UI Testnet flow | FIV-CRED-05 |
| Final FIV isolation suite | FIV-CRED-06 |
| C7 / S04 / HumanStartProof / ExecutionAdapter redesign | Separate |
| Secret provisioning / real keys / Binance I/O | Forbidden |

---

## 20. Migration Safety Summary

```text
MIGRATION REQUIRED: YES (schema + backfill)
DATA SECRET MIGRATION: NO
SAFE LIVE BACKFILL: YES (evidence-based)
```

| Element | Plan |
| ------- | ---- |
| Precondition | Slice Approval; inventory of credentialed provider duplicates |
| Transformation | Add column → backfill `live` → constrain → unique |
| Postcondition | Explicit env on Connections; coexistence enabled |
| Rollback | Forward-fix preferred; do not reclassify to testnet |
| LIVE preservation | Backfill `live` only; Vault purposes unchanged |
| Duplicate detection | Pre-unique check for colliding live identities |
| Failure | Abort closed; no partial unique without backfill |

---

## 21. Governance Conclusion

```text
PLANNING COMPLETE — READY FOR ARCHITECTURE REVIEW
```

```text
Planning Approval = NOT GRANTED BY THIS ARTIFACT
Slice Approval = NOT GRANTED BY THIS ARTIFACT
Implementation = NOT AUTHORIZED BY THIS ARTIFACT
```

```text
FIV-CRED-01
CLOSED

FIV-CRED-02
PLANNING COMPLETE — AWAITING ARCHITECTURE / SECURITY / PO PLANNING APPROVAL

FIV-PRE-01
IMPLEMENTATION AUTHORIZED / NOT CLOSED

FIV-CRED-03…06
NOT STARTED

FIV
NOT READY / NOT AUTHORIZED

C7
DENY-ALL

allowRealVenueIo
FALSE
```

**Next gate:**

```text
Architecture Review
        → Security Review
        → PO/Governance Planning Approval
        → Slice Approval
        → Implementation
```

---

## 22. Safety Confirmations (this planning act)

| Confirmation | Status |
| ------------ | ------ |
| No implementation code | YES |
| No Prisma/schema/migration changes | YES |
| No Connections/Vault/Binance/API/UI/C7 changes | YES |
| No credentials accessed or modified | YES |
| No secrets exposed | YES |
| No Binance calls / FIV / capital movement | YES |
| Protected leftovers untouched | YES |
