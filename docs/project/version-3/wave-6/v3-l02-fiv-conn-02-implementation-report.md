# V3-L02 FIV-CONN-02 — Implementation Report

**Document:** FIV-CONN-02 Provider + Environment Uniqueness — Implementation Report  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02  
**Slice:** FIV-CONN-02 — Provider + Environment Uniqueness  
**Authority:** Senior Staff Engineer (implementation only)  
**Nature:** Implementation completion evidence for PO Review. Does **not** close the slice. Does **not** authorize FIV-CONN-03…05. Does **not** grant PO approval.

**Slice Approval:** [`v3-l02-fiv-conn-02-slice-approval.md`](./v3-l02-fiv-conn-02-slice-approval.md) — GRANTED (`459970303fcc3a68d83df49a6fa6a06a1defeada`)

```text
FIV-CONN-02 Implementation = COMPLETE
PO REVIEW = READY
FIV-CONN-02 CLOSED = NO
```

---

## 1. Governance authorization

| Gate                          | Status               |
| ----------------------------- | -------------------- |
| FIV-CRED-02 Planning Approval | GRANTED              |
| FIV-CONN-02 Slice Planning    | COMPLETE             |
| FIV-CONN-02 Slice Approval    | GRANTED              |
| Strategy B (D-CRED-02-03)     | FROZEN / IMPLEMENTED |

Frozen parent decisions were not reopened. LIVE backfill remains FIV-CONN-04. Purpose-aware API/domain contract polish beyond minimum coexistence support remains FIV-CONN-03 ownership for broader mismatch matrix / handshake paths.

---

## 2. Implementation status

```text
IMPLEMENTED:
  Strategy B PostgreSQL partial unique index
  Application credential-slot check keyed by workspace + provider + environment
  P2002 → ConflictException mapping on credential bind
  Minimum EXCHANGE purpose pass-through on Connections Vault store/get/replace/retrieve/revoke
    (required so credentialed LIVE + TESTNET can coexist without provider-only Vault collision)
  Focused uniqueness / concurrency / NULL / DEMO / isolation regression tests

NOT PERFORMED / DEFERRED:
  LIVE backfill (FIV-CONN-04)
  Duplicate cleanup
  EXCHANGE NOT NULL enforcement (FIV-CONN-04)
  FIV-CONN-03 full API/domain purpose contract expansion beyond Connections-owned paths above
  FIV-CONN-05
  Vault module/schema redesign
  Binance / venue I/O / FIV
  C7 / allowRealVenueIo changes
  DEMO enablement
```

---

## 3. Exact files changed

| Path                                                                                                         | Change                                                                     |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `apps/api/prisma/migrations/20260917180000_v3_l02_fiv_conn_02_provider_environment_uniqueness/migration.sql` | Strategy B partial unique index                                            |
| `apps/api/prisma/schema.prisma`                                                                              | Document Strategy B index (comment only; no full `@@unique` on env triple) |
| `apps/api/src/modules/connections/connections.service.ts`                                                    | Environment-aware slot check; P2002 mapping; EXCHANGE purpose pass-through |
| `apps/api/src/modules/connections/connections.service.spec.ts`                                               | Memory Prisma/Vault Strategy B fidelity + FIV-CONN-02 tests                |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-02-implementation-report.md`                                  | This report                                                                |

Protected leftovers were **not** staged or modified.

---

## 4. Migration name

```text
20260917180000_v3_l02_fiv_conn_02_provider_environment_uniqueness
```

---

## 5. Database constraint / index semantics

```sql
CREATE UNIQUE INDEX "connection_records_ws_provider_env_credentialed_uidx"
ON "connection_records" ("workspace_id", "provider", "environment")
WHERE "vault_secret_id" IS NOT NULL
  AND "status" <> 'REVOKED'
  AND "environment" IS NOT NULL
  AND "connection_type" = 'EXCHANGE';
```

| Property                                                  | Result    |
| --------------------------------------------------------- | --------- |
| Strategy B                                                | YES       |
| Full-table `@@unique(workspaceId, provider, environment)` | NO        |
| NULL coexistence preserved                                | YES       |
| REVOKED excluded                                          | YES       |
| Non-EXCHANGE excluded                                     | YES       |
| Non-credentialed excluded                                 | YES       |
| Existing `@@unique(workspaceId, provider, vaultSecretId)` | PRESERVED |
| Vault mutated                                             | NO        |
| Environment values rewritten                              | NO        |
| Rows deleted                                              | NO        |

Post-deploy verification (local DB): index present with exact predicate.

---

## 6. Pre-migration / duplicate / NULL-group audit

### Local DB audit (read-only; no mutations)

**Before CONN-01 apply (environment column absent):**

| Metric                                    | Value                               |
| ----------------------------------------- | ----------------------------------- |
| Total Connection rows                     | 13                                  |
| EXCHANGE                                  | 4 (1 credentialed, 3 metadata-only) |
| NOTIFICATION                              | 9 (5 credentialed)                  |
| Credentialed EXCHANGE provider duplicates | **0**                               |

**After CONN-01 + CONN-02 migrate deploy:**

| Audit                                                                                   | Result                                                               |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Eligible Strategy B duplicates (`credentialed + non-revoked + EXCHANGE + env NOT NULL`) | **[] empty** — constraint safe                                       |
| NULL-environment groups                                                                 | BINANCE×2, SMTP×2, TELEGRAM×3 (workspace `163bcf3b-…`) — **allowed** |
| Populated LIVE/TESTNET Connection rows                                                  | **0** (all still NULL; no backfill)                                  |
| Environment values mutated by this slice                                                | **NO**                                                               |

```text
Duplicate audit: PASS (no Strategy B blockers)
NULL-group audit: DEFINED / OBSERVED (coexistence retained)
LIVE backfill: NOT PERFORMED
Duplicate cleanup: NOT PERFORMED
```

---

## 7. Application behavior

### Credential slot check

Replaced provider-only `assertCredentialSlotAvailable` with:

- Connection uniqueness: `workspaceId + provider + environment` among credentialed, non-`REVOKED` rows (excluding self)
- Vault probe: for EXCHANGE `live` → `Trading` + `TradingLive`; for `testnet` → `TradingTestnet`; otherwise omit-purpose legacy default

Conflict message (no secrets):

```text
Credentials are already assigned to this provider and environment.
```

### DB race authority

`storeCredentials` / `replaceCredentials` map Prisma `P2002` → `ConflictException` (HTTP 409 via existing Nest mapping).

### Environment immutability

Preserved from FIV-CONN-01 — rename/lifecycle do not write `environment`.

### DEMO

Still rejected on EXCHANGE create.

---

## 8. Test results

Focused suites:

```text
connections.service.spec.ts              42 PASS
connection-environment.spec.ts            3 PASS
v3-l02-fiv-cred-01-purpose-isolation.spec 11 PASS
-----------------------------------------------
Total                                    56 PASS
```

FIV-CONN-02 coverage includes:

- second credentialed LIVE / TESTNET rejected
- LIVE + TESTNET coexistence
- cross-workspace / cross-provider allowed
- NULL metadata-only coexistence; NULL ≠ LIVE
- non-EXCHANGE / REVOKED / metadata-only eligibility boundaries
- ConflictException race mapping
- vaultSecretId replace does not open a second logical slot
- workspace isolation
- distinct Vault purposes for live vs testnet store
- DEMO rejected; no NULL→LIVE backfill

---

## 9. Security regression

| Concern                                                               | Result            |
| --------------------------------------------------------------------- | ----------------- |
| Strategy B eligibility predicate                                      | PASS              |
| No provider-only Connection slot selection for populated EXCHANGE env | PASS              |
| LIVE ↔ TESTNET Vault purpose isolation on Connections store path      | PASS              |
| Workspace isolation                                                   | PASS              |
| Environment immutability                                              | PASS              |
| Secret non-exposure in errors/tests/report                            | PASS              |
| No silent LIVE backfill                                               | PASS              |
| No destructive duplicate cleanup                                      | PASS              |
| C7 DENY-ALL                                                           | UNCHANGED         |
| `allowRealVenueIo`                                                    | FALSE (unchanged) |

SC-01…SC-12 applicable to this slice: preserved. Full CRED-02 mismatch matrix across handshake/capability remains later slices where those paths are owned.

---

## 10. Safety confirmations

| Confirmation                                 | Status            |
| -------------------------------------------- | ----------------- |
| LIVE backfill                                | **NOT PERFORMED** |
| Duplicate cleanup                            | **NOT PERFORMED** |
| Vault module/schema redesigned               | **NO**            |
| Credentials / secret material modified in DB | **NO**            |
| Secrets exposed                              | **NO**            |
| Binance / venue calls                        | **ZERO**          |
| FIV                                          | **NOT PERFORMED** |
| Capital movement                             | **ZERO**          |
| C7                                           | **DENY-ALL**      |
| `allowRealVenueIo`                           | **FALSE**         |
| Protected leftovers                          | **UNTOUCHED**     |
| FIV-CONN-03…05 implemented                   | **NO**            |

---

## 11. Commit / push

Recorded after successful commit + push verification in the implementing engineer’s final gate report.

```text
Next gate:
FIV-CONN-02 PO REVIEW
```
