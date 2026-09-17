# V3-L02 FIV-CONN-01 — Implementation Report

**Document:** FIV-CONN-01 Connection Environment Model — Implementation Report  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02  
**Slice:** FIV-CONN-01 — Connection Environment Model  
**Authority:** Senior Staff Engineer (implementation only)  
**Nature:** Implementation completion evidence for PO Review. Does **not** close the slice. Does **not** authorize FIV-CONN-02…05.

**Slice Approval:** [`v3-l02-fiv-conn-01-slice-approval.md`](./v3-l02-fiv-conn-01-slice-approval.md) — GRANTED (`05c7171a438d403e96ac7efdb448771321c706f8`)

```text
FIV-CONN-01 Implementation = COMPLETE
PO REVIEW = READY
FIV-CONN-01 CLOSED = NO
```

---

## 1. Governance authorization

| Gate | Status |
| ---- | ------ |
| FIV-CRED-02 Planning Approval | GRANTED |
| FIV-CONN-01 Slice Planning | COMPLETE |
| FIV-CONN-01 Slice Approval | GRANTED |
| OQ-01 | Additive nullable migration = FIV-CONN-01; LIVE backfill = FIV-CONN-04 |

Frozen parent decisions were not reopened. Strategy B uniqueness remains FIV-CONN-02 ownership.

---

## 2. Scope implemented

```text
1. Additive nullable Connection.environment Prisma field + migration
2. ENV1 TradingCredentialEnvironment reuse (Connection subset live|testnet)
3. Domain/DTO/service/view contracts for environment
4. EXCHANGE create validation: required live|testnet; omit/demo → FAIL CLOSED
5. Environment immutability via rename-only update path (no environment mutation API)
6. Focused regression tests
7. Minimal web create alignment (EXCHANGE → explicit live; no Testnet UI)
```

---

## 3. Exact files changed

| Path | Change |
| ---- | ------ |
| `apps/api/prisma/schema.prisma` | `ConnectionRecord.environment String?` |
| `apps/api/prisma/migrations/20260917170000_v3_l02_fiv_conn_01_connection_environment/migration.sql` | Additive `ADD COLUMN "environment" TEXT` |
| `apps/api/src/modules/execution-adapter/live-venue-egress/trading-credential-environment.ts` | `CONNECTION_TRADING_ENVIRONMENTS` / `isConnectionTradingEnvironment` |
| `apps/api/src/modules/execution-adapter/live-venue-egress/index.ts` | Re-exports |
| `apps/api/src/modules/connections/connection-environment.ts` | Create-time resolve helper |
| `apps/api/src/modules/connections/connection-environment.spec.ts` | ENV1 reuse + DEMO boundary tests |
| `apps/api/src/modules/connections/connections.dto.ts` | Optional `environment` on create DTO (`live`\|`testnet` only) |
| `apps/api/src/modules/connections/connections.service.ts` | Persist/view/validate; rename does not write environment |
| `apps/api/src/modules/connections/connections.controller.ts` | Pass `body.environment` |
| `apps/api/src/modules/connections/connections.service.spec.ts` | Existing creates + FIV-CONN-01 cases |
| `apps/web/src/shared/api.ts` | View + createConnection types |
| `apps/web/src/connections/ConnectionsPage.tsx` | EXCHANGE create sends `environment: 'live'` |
| `apps/web/src/connections/ConnectionsPage.spec.tsx` | Fixture `environment` |
| `apps/web/src/market-data/MarketDataPage.spec.tsx` | Fixture `environment` |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-01-implementation-report.md` | This report |

Protected leftovers were **not** staged or modified.

---

## 4. Prisma schema change

```text
ConnectionRecord.environment = String? @map("environment")
```

Nullable. No `@default`. No `NOT NULL`. Comments document ENV1 vocabulary and FIV-CONN-04 backfill ownership.

---

## 5. Migration details

```text
Migration:
20260917170000_v3_l02_fiv_conn_01_connection_environment

SQL:
ALTER TABLE "connection_records" ADD COLUMN "environment" TEXT;
```

| Property | Result |
| -------- | ------ |
| Additive | YES |
| Existing rows preserved | YES (NULL) |
| LIVE backfill | NOT PERFORMED |
| TESTNET backfill | NOT PERFORMED |
| Duplicate cleanup | NOT PERFORMED |
| Provider/environment unique | NOT CREATED |
| Strategy B partial unique | NOT CREATED |
| Vault records | UNCHANGED |

---

## 6. Domain/type changes

- Reused ENV1 `TradingCredentialEnvironment` (`live` \| `testnet` \| `demo`).
- Added Connection subset `ConnectionTradingEnvironment` = `live` \| `testnet` (no duplicate enum taxonomy).
- `ConnectionMetadataView.environment: ConnectionTradingEnvironment | null`.
- View mapping: only `live`/`testnet` project; anything else → `null` (never silent LIVE).

---

## 7. Validation behavior

| Case | Behavior |
| ---- | -------- |
| EXCHANGE + `live` / `testnet` | Accepted and persisted |
| EXCHANGE omit / null / `''` | `BadRequestException` — environment required |
| EXCHANGE + `demo` / other | `BadRequestException` — must be live or testnet |
| NOTIFICATION / AI omit | Persists `null` |
| DTO `@IsIn(['live','testnet'])` | Rejects invalid values at boundary |

No `missing → LIVE` fallback.

---

## 8. Immutability enforcement

```text
Environment immutability: IMPLEMENTED
```

Mechanism (repository-compatible, smallest):

- No `PATCH /connections/:id/environment`.
- `RenameConnectionMetadataDto` accepts only `displayName`.
- `rename()` Prisma update writes **only** `displayName`.
- Lifecycle status updates write **only** `status`.
- No LIVE ↔ TESTNET transition API.

Limitation documented: there is no general Connection update DTO that could smuggle `environment`; enforcement is structural absence of a mutation path rather than an explicit reject-if-present guard on a non-existent field. This does not weaken the governance requirement.

---

## 9. Tests added/changed

| Suite | Coverage |
| ----- | -------- |
| `connection-environment.spec.ts` | ENV1 reuse; live/testnet accept; omit/demo reject; null for non-exchange |
| `connections.service.spec.ts` (FIV-CONN-01 block) | LIVE/TESTNET representable; demo reject; null legacy/notification; rename immutability; workspace isolation; secret non-exposure |
| Existing connection creates | EXCHANGE creates pass explicit `environment: 'live'` |
| Web fixtures | `environment` on `ConnectionMetadataView` mocks |

---

## 10. Test commands/results

```bash
cd apps/api && npx prisma validate   # PASS
cd apps/api && npx prisma generate   # PASS

cd apps/api && npx vitest run \
  src/modules/connections/connection-environment.spec.ts \
  src/modules/connections/connections.service.spec.ts \
  src/modules/secret-vault/v3-l02-fiv-cred-01-purpose-isolation.spec.ts
# PASS — 42 tests

cd apps/api && npx vitest run \
  src/modules/connections/ \
  src/modules/execution-adapter/live-venue-egress/
# PASS — 86 tests (connections + ENV1 + EG1)

cd apps/web && npx vitest run \
  src/connections/ConnectionsPage.spec.tsx \
  src/market-data/MarketDataPage.spec.tsx
# PASS — 12 tests
```

Full repository suite: **NOT EXECUTED**.

---

## 11. Security verification

| Control | Status |
| ------- | ------ |
| Workspace isolation | PRESERVED (get/rename still scoped) |
| Secret non-exposure | PRESERVED (`vaultSecretId` reference; views redact) |
| Vault purpose boundary | UNCHANGED (no Vault schema/service changes) |
| No implicit LIVE default | ENFORCED for EXCHANGE create |
| Environment immutability | ENFORCED on normal update path |
| ENV1 / EG1 / C7 / S04 | Not weakened |
| New auth framework | NONE |

---

## 12. Explicit non-goals confirmed

```text
Provider/environment uniqueness     NOT IMPLEMENTED (FIV-CONN-02)
Strategy B unique index             NOT IMPLEMENTED (FIV-CONN-02)
LIVE backfill                       NOT PERFORMED (FIV-CONN-04)
Duplicate cleanup                   NOT PERFORMED
Migration write serialization       NOT IMPLEMENTED
Vault credential wiring             NOT IMPLEMENTED
Environment-aware Binance handshake NOT IMPLEMENTED
Testnet credential provisioning     NOT IMPLEMENTED
API/UI operator Testnet flow        NOT IMPLEMENTED
FIV-CRED-03…06                      NOT STARTED
FIV execution / live capital        NOT PERFORMED
```

---

## 13. Backfill status

```text
LIVE backfill: NOT PERFORMED
```

Existing Connection rows remain `environment = NULL` after migration. Null remains distinguishable from LIVE/TESTNET.

---

## 14. Uniqueness status

```text
Provider/environment uniqueness: NOT IMPLEMENTED
Strategy B: NOT IMPLEMENTED IN THIS SLICE
```

Logical identity remains governance rule `workspaceId + provider + environment` without physical uniqueness enforcement.

---

## 15. Binance / FIV / capital status

```text
Binance calls: ZERO
FIV: NOT PERFORMED
Capital movement: ZERO
C7: DENY-ALL (unchanged)
allowRealVenueIo: FALSE (unchanged)
```

---

## 16. Repository status

Implementation commit staged **only** FIV-CONN-01 files listed in §3. Protected leftovers remain dirty/untracked and untouched.

---

## 17. Commit hash

```text
b1ac062c619311663d37dc2159c9f7473ddda60f
```

---

## 18. Push verification

```text
PUSHED to origin/main
HEAD == origin/main: YES
```

---

## 19. PO Review readiness

```text
PO REVIEW = READY
Next gate = FIV-CONN-01 PO REVIEW
```

Slice is **not** closed by this report. FIV-CONN-02 is **not** started.

---

## IC-01…IC-18

| ID | Criterion | Result |
| -- | --------- | ------ |
| IC-01 | Nullable environment representation | PASS |
| IC-02 | Existing TradingCredentialEnvironment reused | PASS |
| IC-03 | Connections support live/testnet | PASS |
| IC-04 | demo not enabled for Connections | PASS |
| IC-05 | No implicit LIVE default | PASS |
| IC-06 | Environment immutability at approved boundary | PASS |
| IC-07 | vaultSecretId reference-only | PASS |
| IC-08 | Existing records preserved | PASS |
| IC-09 | No LIVE backfill | PASS |
| IC-10 | No provider/environment uniqueness | PASS |
| IC-11 | No Strategy B index | PASS |
| IC-12 | No Vault changes | PASS |
| IC-13 | No Binance calls | PASS |
| IC-14 | No capital movement | PASS |
| IC-15 | C7 remains DENY-ALL | PASS |
| IC-16 | allowRealVenueIo remains FALSE | PASS |
| IC-17 | Relevant tests pass | PASS |
| IC-18 | Protected leftovers untouched | PASS |

```text
IC-01…IC-18 = 18/18 PASS
```
