# V3-L02 FIV-CONN-02 — Provider + Environment Uniqueness Planning Package

**Document:** FIV-CONN-02 Slice Planning Package  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02  
**Slice:** FIV-CONN-02 — Provider + Environment Uniqueness  
**Authority:** Senior Staff Engineer + Principal Architecture Planning Engineer  
**Nature:** **SLICE PLANNING ONLY.** Does **not** grant Slice Approval. Does **not** authorize implementation by itself. Does **not** create migrations, modify schema, mutate Connections/Vault data, perform LIVE backfill, or begin FIV-CONN-03.

**Parent Planning Approval:** GRANTED — [`v3-l02-fiv-cred-02-po-governance-planning-approval.md`](./v3-l02-fiv-cred-02-po-governance-planning-approval.md)

**FIV-CONN-01:** CLOSED — [`v3-l02-fiv-conn-01-closure.md`](./v3-l02-fiv-conn-01-closure.md) (closure commit `5f37e5a091ca41f8d20988ece7d30f361dddb9c5`)

**Repository baseline (planning start):** `5f37e5a091ca41f8d20988ece7d30f361dddb9c5`

```text
SLICE PLANNING = READY FOR PO REVIEW
Implementation NOT AUTHORIZED BY THIS ARTIFACT
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Slice identity

| Field | Value |
| ----- | ----- |
| **ID** | **FIV-CONN-02** |
| **Name** | Provider + Environment Uniqueness |
| **Parent** | V3-L02 FIV-CRED-02 |
| **Type** | Persistence uniqueness + application conflict enforcement |
| **Position** | Second FIV-CRED-02 sub-slice (CONN-01 CLOSED → CONN-02 → CONN-03…05) |
| **Frozen strategy** | **D-CRED-02-03 = STRATEGY B** (partial/conditional uniqueness) |

---

## 2. Governance state

```text
V3-L02 FIV-CRED-02
Planning Package                  COMPLETE
Architecture Review               PASS WITH CONDITIONS
Security Review                   PASS WITH CONDITIONS
PO/Governance Decision Freeze     COMPLETE
PO/Governance Planning Approval   GRANTED

FIV-CONN-01
CLOSED

FIV-CONN-02
SLICE PLANNING                    ← THIS ARTIFACT
Slice Approval                    NOT GRANTED
Implementation                    NOT AUTHORIZED

FIV-CRED-02
NOT CLOSED

FIV-PRE-01
NOT CLOSED

FIV
NOT PERFORMED
```

Frozen parent decisions (D-CRED-02-01…14) are **not** reopened. Strategy B is **not** replaced with Strategy A.

---

## 3. Reviewed artifacts

| Artifact | Path | Status |
| -------- | ---- | ------ |
| Parent Planning Package | `v3-l02-fiv-cred-02-planning-package.md` | COMPLETE |
| Architecture Review | `v3-l02-fiv-cred-02-architecture-review.md` | PASS WITH CONDITIONS |
| Security Review | `v3-l02-fiv-cred-02-security-review.md` | PASS WITH CONDITIONS |
| Decision Freeze | `v3-l02-fiv-cred-02-po-governance-decision-freeze.md` | COMPLETE — Strategy B frozen |
| Parent Planning Approval | `v3-l02-fiv-cred-02-po-governance-planning-approval.md` | GRANTED |
| FIV-CONN-01 Planning Package | `v3-l02-fiv-conn-01-planning-package.md` | COMPLETE |
| FIV-CONN-01 Slice Approval | `v3-l02-fiv-conn-01-slice-approval.md` | GRANTED |
| FIV-CONN-01 Implementation Report | `v3-l02-fiv-conn-01-implementation-report.md` | COMPLETE |
| FIV-CONN-01 PO Review | `v3-l02-fiv-conn-01-po-review.md` | PASS |
| FIV-CONN-01 Closure | `v3-l02-fiv-conn-01-closure.md` | CLOSED |

---

## 4. Current repository / database state

### 4.1 Platform assumptions (FACT)

| Item | Evidence |
| ---- | -------- |
| Database | PostgreSQL (`datasource db { provider = "postgresql" }`) |
| CI / compose image | `postgres:16` / `postgres:16-alpine` |
| Prisma | `prisma` / `@prisma/client` `^6.5.0` |
| Partial unique indexes in repo | **None today** — no `CREATE UNIQUE INDEX … WHERE` in migrations |
| Raw SQL migrations | Standard convention under `apps/api/prisma/migrations/<timestamp>_<name>/migration.sql` |

### 4.2 ConnectionRecord after FIV-CONN-01 (FACT)

**Path:** `apps/api/prisma/schema.prisma` → `ConnectionRecord` / `connection_records`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | String | PK |
| `workspaceId` | String | ownership |
| `displayName` | String | |
| `provider` | String | e.g. `BINANCE` |
| `connectionType` | String | `EXCHANGE` / `NOTIFICATION` / `AI` |
| `environment` | `String?` | ENV1 `live`\|`testnet`; **nullable**; no backfill |
| `vaultSecretId` | `String?` | opaque Vault reference |
| `status` | String | default `DISCONNECTED`; revoke retains `vaultSecretId` |
| timestamps | DateTime | |

**Indexes / uniqueness today:**

```text
@@index([workspaceId, createdAt])
@@index([workspaceId, provider])
@@unique([workspaceId, provider, vaultSecretId])   -- credential-reference aid; PRESERVE
```

**No** provider+environment unique. **No** Strategy B partial unique.

**Migration history (Connections):**

* `20260817193000_w2_s01_a_connection_metadata` — create table  
* `20260817193500_w2_s01_b_connection_vault_reference` — `vault_secret_id` + unique on `(workspace_id, provider, vault_secret_id)`  
* `20260917170000_v3_l02_fiv_conn_01_connection_environment` — `ADD COLUMN "environment" TEXT` (nullable; no UPDATE/backfill)

### 4.3 Application create / update behavior (FACT)

| Path | Capability |
| ---- | ---------- |
| `ConnectionsController.create` → `ConnectionsService.create` | **Only production create path** for `ConnectionRecord` |
| `prisma.connectionRecord.create` | Used solely from `ConnectionsService.create` |
| Seed (`prisma/seed.ts`) | **No** ConnectionRecord seeding |
| Background jobs | **No** Connection create writers found |
| `rename` | `displayName` only — **does not** write `environment` / `provider` / `workspaceId` |
| `storeCredentials` / `replaceCredentials` | Writes `vaultSecretId` (+ status); **not** identity fields |
| Lifecycle (`disconnect` / `disable` / `revoke` / validate) | Status transitions; revoke keeps `vaultSecretId`, sets `REVOKED` |
| Provider / workspace / environment mutation API | **Absent** (immutability preserved from FIV-CONN-01) |

**Credential slot check (still provider-only):**

```text
assertCredentialSlotAvailable
  findFirst({ workspaceId, provider, vaultSecretId: { not: null } })
```

Blocks second credentialed Connection **per provider**, ignoring environment — must be replaced in this slice with provider+environment.

### 4.4 Prisma vs Strategy B (FACT / design implication)

* Prisma `@@unique([...])` **cannot** express a PostgreSQL partial unique predicate.
* Generated Prisma migrations **cannot** alone represent Strategy B.
* **Manual SQL migration is required** for the partial unique index.
* Schema must **not** add `@@unique([workspaceId, provider, environment])` (that would be Strategy A / full unique and collides with metadata-only duplicates).
* Introspection (`prisma db pull`) may not preserve partial indexes as first-class Prisma schema constructs — document the index in schema comments; treat SQL migration as SoT for the physical constraint.
* Existing project pattern: raw SQL in timestamped migration folders (compatible).

**Strategy B technical contradiction check:** **NONE.** PostgreSQL 16 supports partial unique indexes. Repository already uses PostgreSQL + raw SQL migrations. Strategy B remains implementable.

---

## 5. Strategy B confirmation

```text
D-CRED-02-03
Physical uniqueness strategy = STRATEGY B
CONFIRMED — NOT REOPENED
```

**Why Strategy B (frozen, not reinterpreted):**

* PostgreSQL supports partial unique indexes.
* `create()` still allows multiple metadata-only EXCHANGE rows for the same provider (and, post-CONN-01, even the same populated `live`/`testnet`).
* Full unique `UNIQUE (workspaceId, provider, environment)` after LIVE backfill would collide with those legitimate metadata-only duplicates.
* Security-relevant uniqueness is the **credentialed** logical identity per environment.

```text
Do NOT replace Strategy B with Strategy A.
Do NOT silently reinterpret Strategy B as
  UNIQUE (workspaceId, provider, environment) WHERE environment IS NOT NULL
alone — that would unique-constrain all populated-env rows including metadata-only
and contradicts D-CRED-02-03.
```

**Logical identity (unchanged):**

```text
workspaceId + provider + environment
```

**`vaultSecretId`:** credential reference only — **not** part of logical uniqueness (D-CRED-02-02 / C-03). Existing `@@unique([workspaceId, provider, vaultSecretId])` is **preserved** as reference integrity.

---

## 6. Exact uniqueness design

### 6.1 Physical mechanism (planned)

Target PostgreSQL partial unique index (repository-compatible Strategy B refinement):

```sql
CREATE UNIQUE INDEX "connection_records_ws_provider_env_credentialed_uidx"
ON "connection_records" ("workspace_id", "provider", "environment")
WHERE "vault_secret_id" IS NOT NULL
  AND "status" <> 'REVOKED'
  AND "environment" IS NOT NULL
  AND "connection_type" = 'EXCHANGE';
```

| Predicate element | Rationale |
| ----------------- | --------- |
| `vault_secret_id IS NOT NULL` | Core Strategy B — uniqueness applies to credentialed rows only |
| `status <> 'REVOKED'` | Revoke retains `vaultSecretId` (FACT); exclude so a non-revoked same-env Connection can become credentialed after revoke |
| `environment IS NOT NULL` | Clarifies NULL-env legacy rows are outside uniqueness until FIV-CONN-04 backfill; also safe vs PG NULL distinctness |
| `connection_type = 'EXCHANGE'` | Multi-env uniqueness is an EXCHANGE concern; notification/AI remain out of scope |

**Frozen allowance for predicate refinement:** D-CRED-02-03 explicitly permits refining the exact predicate at implementation. The above is the planned refinement; it does **not** change Strategy B into Strategy A.

### 6.2 Application-level enforcement (planned)

Replace provider-only `assertCredentialSlotAvailable` with:

```text
findFirst({
  workspaceId,
  provider,
  environment,                    // Connection's own env (immutable)
  vaultSecretId: { not: null },
  status: { not: 'REVOKED' },
  id: { not: currentConnection.id },
})
→ if found: ConflictException
```

Also update messaging from provider-only (“Credentials are already assigned to this provider.”) to environment-aware conflict text **without** secret material.

`assertRevokedCredentialSlotAvailable` remains Vault-slot oriented for this slice; purpose-aware Vault wiring stays FIV-CONN-03. FIV-CONN-02 must not weaken Vault isolation or introduce omit-purpose LIVE defaults beyond current behavior.

### 6.3 Populated environment rules

| Scenario | Result |
| -------- | ------ |
| Same workspace + provider + `live`, second **credentialed** Connection | **REJECT** (DB + app) |
| Same workspace + provider + `testnet`, second **credentialed** Connection | **REJECT** |
| Same workspace + provider + `live` **and** `testnet` (each credentialed) | **ALLOWED** |
| Different workspaces, same provider + env | **ALLOWED** |
| Different providers, same workspace + env | **ALLOWED** |
| Same workspace + provider + env, multiple **metadata-only** (`vaultSecretId` NULL) | **ALLOWED** under Strategy B |
| `vaultSecretId` replace on same Connection | Identity unchanged; must not bypass uniqueness |

### 6.4 DEMO

```text
DEMO = DEFERRED (D-CRED-02-01 / D-CRED-02-14)
```

No DEMO uniqueness product path. Connection create already rejects `demo` (FIV-CONN-01). Do not index or special-case `demo`.

---

## 7. NULL semantics (mandatory answers)

Post-FIV-CONN-01 state: existing rows may have `environment IS NULL`; new EXCHANGE creates require `live`\|`testnet`; notification/AI may remain NULL.

| # | Question | Answer |
| - | -------- | ------ |
| **1** | Can multiple NULL-environment metadata-only rows coexist? | **YES.** Current unique indexes do not prevent it. Strategy B predicate excludes `environment IS NULL` and `vault_secret_id IS NULL`, so the new index also does not constrain them. |
| **2** | Should they coexist? | **YES for the transition.** Legacy EXCHANGE NULL rows await FIV-CONN-04 backfill. Notification/AI NULL is permanent/normal. Product must not treat NULL as LIVE. |
| **3** | What happens when one is later assigned LIVE? | **FIV-CONN-04 ownership.** Backfill sets `environment = 'live'` for unambiguous rows. If the row is still metadata-only, Strategy B still allows siblings with the same env until credentials are stored. If credentialed, uniqueness applies to `(workspace, provider, live)`. |
| **4** | What happens when two are concurrently assigned LIVE? | Concurrent metadata UPDATEs to `live` on two **credentialed** same-provider rows would race into Strategy B; DB rejects the second. FIV-CONN-04 must **audit first** and abort closed if credentialed collisions would result. Concurrent backfill of two **metadata-only** rows to `live` remains allowed under Strategy B. |
| **5** | How does Strategy B prevent a duplicate populated environment? | It prevents a second **credentialed, non-revoked EXCHANGE** row with the same `(workspaceId, provider, environment)`. It does **not** prevent duplicate metadata-only populated-env rows (by design). |
| **6** | What database behavior is relied upon? | PostgreSQL partial unique index as final authority under concurrent writers; PostgreSQL treats NULL keys as distinct in unique indexes (PG 16 default); Prisma `P2002` on unique violation for error translation. |

```text
NULL semantics (FIV-CONN-02):
  Multiple NULL-environment rows MAY coexist
  NULL ≠ LIVE
  Uniqueness for populated env applies to credentialed EXCHANGE rows (Strategy B)
  LIVE backfill / EXCHANGE NOT NULL = FIV-CONN-04
```

---

## 8. Concurrency model

```text
Database Strategy B partial unique index
        =
final authority against race conditions
```

Application pre-checks are **best-effort**; they do not replace the index.

| Scenario | Control |
| -------- | ------- |
| Concurrent `create` same WS+provider+LIVE (metadata-only) | **Allowed** (Strategy B) |
| Concurrent `storeCredentials` on two metadata-only same WS+provider+LIVE | First UPDATE setting `vault_secret_id` wins; second hits unique index → **Conflict** |
| Concurrent `create` alone | No uniqueness conflict (no `vault_secret_id`) |
| Concurrent update of identity fields | **N/A** — no API mutates `provider` / `environment` / `workspaceId` |
| Transaction behavior | Prefer single-row UPDATE for credential bind; catch unique violation even if app check raced |
| Unique violation | Prisma `P2002` → map to existing `ConflictException` / HTTP **409** pattern |
| Retry behavior | Do **not** auto-retry uniqueness conflicts as success; surface Conflict to client |
| Worker/background writes | None found for Connection create; if added later, same DB rule applies |
| Process restart / multiple API instances | Stateless app checks; DB index enforces cross-instance |

**Migration write serialization** (D-CRED-02-12 / SC-11) remains owned by the broader FIV-CRED-02 migration runbook (primarily FIV-CONN-04 critical section). FIV-CONN-02 index creation should still fail closed if credentialed populated-env duplicates already exist at apply time.

---

## 9. Existing duplicate audit (defined; not executed)

FIV-CONN-02 plans **read-only audit queries** for implementation/pre-migration gates. This planning act does **not** execute them against production, does **not** delete/merge/reassign environments.

### 9.1 Credentialed populated-env duplicates (Strategy B blockers)

```sql
SELECT workspace_id, provider, environment, COUNT(*) AS n, array_agg(id) AS ids
FROM connection_records
WHERE vault_secret_id IS NOT NULL
  AND status <> 'REVOKED'
  AND environment IS NOT NULL
  AND connection_type = 'EXCHANGE'
GROUP BY workspace_id, provider, environment
HAVING COUNT(*) > 1;
```

**Expected today:** empty (provider-only app slot check allows at most one credentialed Connection per provider). If non-empty → **BLOCK** index creation; escalate; no silent cleanup in FIV-CONN-02.

### 9.2 Metadata-only populated-env groups (allowed; informational)

```sql
SELECT workspace_id, provider, environment, COUNT(*) AS n, array_agg(id) AS ids
FROM connection_records
WHERE vault_secret_id IS NULL
  AND environment IS NOT NULL
GROUP BY workspace_id, provider, environment
HAVING COUNT(*) > 1;
```

Allowed under Strategy B. Document for operators; **do not** destroy in this slice.

### 9.3 NULL-environment groups (legacy / non-EXCHANGE)

```sql
SELECT workspace_id, provider, connection_type, COUNT(*) AS n, array_agg(id) AS ids
FROM connection_records
WHERE environment IS NULL
GROUP BY workspace_id, provider, connection_type
HAVING COUNT(*) > 1;
```

Informational for FIV-CONN-04 backfill planning. No destructive action in FIV-CONN-02.

### 9.4 Duplicate-resolution boundary

```text
FIV-CONN-02: detect + fail closed on Strategy B blockers; no cleanup
FIV-CONN-04: owns LIVE backfill + any required resolution before NOT NULL / backfill collisions
```

---

## 10. Migration ordering

```text
FIV-CONN-01 (CLOSED)
  nullable environment exists; no uniqueness; no backfill
        ↓
FIV-CONN-02 (this slice)
  Strategy B partial unique + app slot check by provider+environment
  NO LIVE backfill; NO destructive cleanup
        ↓
FIV-CONN-03
  purpose-aware Vault / API contract (out of scope here)
        ↓
FIV-CONN-04
  LIVE backfill + EXCHANGE NOT NULL + audit/quarantine
```

### Why CONN-02 before CONN-04 is technically safe

1. Index CREATE is safe while many rows still have `environment IS NULL` because those rows are excluded by `environment IS NOT NULL`.
2. Today’s app slot check implies ≤1 credentialed Connection per `(workspace, provider)` → after future backfill to `live`, at most one credentialed `(workspace, provider, live)` is expected.
3. Parent D-CRED-02-05 listed partial unique after backfill as an ideal full-package sequence; **slice ownership** places uniqueness in CONN-02 and backfill in CONN-04. That split is safe **iff** CONN-04 audits credentialed collisions before assigning environments that would violate Strategy B.

```text
Ordering: DEFINED and SAFE under Strategy B predicates above
Governance ownership: unchanged (uniqueness = CONN-02; backfill = CONN-04)
```

If implementation discovers credentialed populated-env duplicates already present → **STOP** / BLOCK index apply; do not switch to Strategy A.

---

## 11. Error semantics

Reuse existing Connections / Nest patterns — **no new error framework**.

| Layer | Behavior |
| ----- | -------- |
| App pre-check | `ConflictException` (already used for credential slot conflicts) |
| DB unique hit | Prisma `PrismaClientKnownRequestError` code **`P2002`** (pattern used in Vault, orders, identity, etc.) |
| HTTP | Nest maps `ConflictException` → **409** |
| Controller | `credentialError` already rethrows `ConflictException` |

**Planned message shape (no secrets):**

```text
Credentials are already assigned to this provider and environment.
```

(or equivalent without Vault ids, api keys, ciphertext, or `vaultSecretId` values)

Create path uniqueness: metadata-only duplicate creates remain **200/201 success** under Strategy B. Conflict primarily surfaces on **credential store/bind**, not on create.

---

## 12. Security impact

Preserves parent security decisions:

| Control | FIV-CONN-02 effect |
| ------- | ------------------ |
| Workspace isolation | Uniqueness key includes `workspaceId`; no cross-workspace collision or access |
| Environment / Vault-purpose consistency | Not fully wired here (FIV-CONN-03); uniqueness does not substitute Model C mismatch checks |
| No cross-environment fallback | Slot check becomes provider+environment — removes provider-only ambiguity for credentialed rows |
| No provider-only identity | App check replaced; DB index includes environment |
| Secret non-exposure | Errors/audit queries return ids/counts only — never secret material |
| DEMO deferred | Unchanged |
| C7 / `allowRealVenueIo` | Unchanged (DENY-ALL / false) |

**Must not:**

* use `vaultSecretId` as a security workaround for logical identity;
* expose credential information in uniqueness errors;
* enable Binance/venue I/O;
* perform FIV.

---

## 13. Test plan (plan only — do not write tests in this task)

| ID | Case | Expected |
| -- | ---- | -------- |
| T-01 | Unique LIVE — second credentialed same WS+provider+LIVE | REJECT / Conflict |
| T-02 | Unique TESTNET — second credentialed same WS+provider+TESTNET | REJECT |
| T-03 | Different environments LIVE+TESTNET same WS+provider | ALLOWED |
| T-04 | Different workspaces same provider+LIVE | ALLOWED |
| T-05 | Different providers same WS+LIVE | ALLOWED |
| T-06 | NULL metadata-only multiples | ALLOWED; view remains null ≠ live |
| T-07 | Metadata-only duplicate populated env (two creates, no credentials) | ALLOWED under Strategy B |
| T-08 | Concurrent credential bind race (where practical) | One success; one Conflict / P2002 mapped |
| T-09 | Concurrent environment assignment | N/A for product API (immutable); cover backfill hazard as CONN-04 test ownership note |
| T-10 | `vaultSecretId` replace / churn | Cannot create second logical credentialed identity for same env |
| T-11 | DEMO | Still rejected on create; no DEMO uniqueness path |
| T-12 | FIV-CONN-01 regression | Immutability, omit-env reject, live/testnet persist, workspace isolation |
| T-13 | Migration/index apply | Clean DB accepts index; fixture with credentialed duplicate fails closed |

Zero Binance network I/O in suite.

---

## 14. Acceptance criteria

| ID | Criterion |
| -- | --------- |
| **AC-01** | Strategy B is implemented as the approved uniqueness strategy (partial unique on credentialed EXCHANGE rows) |
| **AC-02** | Populated environment values are unique by `workspaceId + provider + environment` for **credentialed, non-revoked EXCHANGE** Connections |
| **AC-03** | `vaultSecretId` is not part of logical uniqueness |
| **AC-04** | NULL-environment behavior is explicitly defined and safe (multiples allowed; NULL ≠ LIVE) |
| **AC-05** | LIVE and TESTNET can coexist for the same workspace/provider |
| **AC-06** | Different workspaces remain isolated |
| **AC-07** | Different providers remain independently unique |
| **AC-08** | Concurrent writes cannot bypass database uniqueness |
| **AC-09** | Existing duplicate detection (audit queries) is defined |
| **AC-10** | No automatic LIVE backfill occurs in FIV-CONN-02 |
| **AC-11** | No destructive duplicate cleanup occurs in this slice |
| **AC-12** | Environment immutability from FIV-CONN-01 is preserved |
| **AC-13** | DEMO remains deferred |
| **AC-14** | No Vault module/schema changes are required for uniqueness |
| **AC-15** | No secret material is exposed |
| **AC-16** | No Binance/venue I/O occurs |
| **AC-17** | C7 remains DENY-ALL |
| **AC-18** | `allowRealVenueIo` remains FALSE |
| **AC-19** | Relevant uniqueness/concurrency regression tests are defined and (at implementation) executed |
| **AC-20** | Implementation remains limited to FIV-CONN-02 |
| **AC-21** | Existing `@@unique([workspaceId, provider, vaultSecretId])` is preserved |
| **AC-22** | Partial unique is delivered via manual SQL migration (Prisma schema does not fake Strategy A `@@unique`) |
| **AC-23** | Provider-only `assertCredentialSlotAvailable` is replaced with provider+environment |

```text
AC-01…AC-23 = 23/23 DEFINED
```

---

## 15. Explicit non-goals

```text
LIVE backfill                          (FIV-CONN-04)
FIV-CONN-03                            (purpose-aware Vault / API contract)
FIV-CONN-04 / FIV-CONN-05
Vault credential wiring / Nest live provider (FIV-CRED-03)
Binance handshake / Binance API calls / live venue I/O / FIV
C7 / S04 / HumanStartProof / ExecutionAdapter / EG1 changes
real capital
DEMO environment enablement
credential rotation / secret provisioning
destructive duplicate cleanup / merge
Strategy A full unique
EXCHANGE NOT NULL enforcement
```

If a dependency is discovered during implementation → document and escalate; do not silently expand scope.

---

## 16. Risks

| ID | Risk | Severity | Mitigation |
| -- | ---- | -------- | ---------- |
| R-01 | Mis-implementing Strategy A full unique | High | AC-01/AC-22; Slice Approval checklist; refuse `@@unique([workspaceId,provider,environment])` |
| R-02 | Index apply fails on unexpected credentialed duplicates | Medium | Pre-apply audit §9.1; abort closed |
| R-03 | App check updated but DB index omitted | High | AC-08 — DB is mandatory final authority |
| R-04 | REVOKED rows blocking new credentialed same env | Medium | `status <> 'REVOKED'` predicate |
| R-05 | CONN-04 backfill producing Strategy B violations | High | CONN-04 audit before UPDATE; ownership documented |
| R-06 | Prisma introspection drift on partial index | Low | SQL migration SoT + schema comment |
| R-07 | Scope creep into Vault purpose / handshake | Medium | Non-goals; AC-20 |

---

## 17. Open questions

| ID | Question | Blocking for planning completeness? | Resolution path |
| -- | -------- | ----------------------------------- | --------------- |
| OQ-01 | Exact Conflict message copy | No | Slice Approval / implementation polish |
| OQ-02 | Whether to include `connection_type = 'EXCHANGE'` in predicate (recommended YES) | No — recommended default above | Confirm at Slice Approval |
| OQ-03 | Integration vs unit approach for concurrent store race | No | Prefer deterministic unit with mocked race + optional PG integration if harness ready |

No open question blocks Strategy B confirmation or planning completeness.

---

## 18. Implementation sequence (post Slice Approval — do not execute now)

```text
1. Verify current schema/index state (ConnectionRecord; no Strategy B index yet)
2. Run read-only duplicate audit queries (§9) in target environment
3. Abort if credentialed populated-env duplicates exist
4. Author manual SQL migration creating Strategy B partial unique index (§6.1)
5. Document index in schema.prisma comments (do NOT add full @@unique on env triple)
6. Replace assertCredentialSlotAvailable with provider+environment (+ map P2002 → Conflict)
7. Preserve FIV-CONN-01 immutability / DEMO / omit-env reject
8. Add uniqueness / concurrency / regression tests (§13)
9. Run connections-focused suites
10. STOP — no LIVE backfill; no FIV-CONN-03; no Vault/Binance/C7 changes
```

---

## 19. Slice Approval recommendation

```text
SLICE PLANNING = READY FOR PO REVIEW
```

This artifact recommends PO/Governance Slice Approval for FIV-CONN-02 **only after** review of this package. It does **not** grant Slice Approval and does **not** authorize implementation.

**Next gate:**

```text
FIV-CONN-02 PO/GOVERNANCE SLICE APPROVAL
        → Implementation (FIV-CONN-02 only)
        → PO Review
        → Closure
```

---

## 20. Safety confirmations (this planning act)

| Confirmation | Status |
| ------------ | ------ |
| No implementation code | YES |
| No Prisma schema / migration created or modified | YES |
| No Connections / Vault / API / UI changes | YES |
| No LIVE backfill / duplicate cleanup | YES |
| No credentials accessed or secrets exposed | YES |
| No Binance / FIV / capital movement | YES |
| Strategy B not replaced | YES |
| Protected leftovers untouched | YES |
| Prior governance artifacts unmodified | YES |
