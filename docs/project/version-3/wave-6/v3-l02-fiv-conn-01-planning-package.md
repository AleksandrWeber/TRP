# V3-L02 FIV-CONN-01 — Connection Environment Model Planning Package

**Document:** FIV-CONN-01 Slice Planning Package
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02
**Slice:** FIV-CONN-01 — Connection Environment Model
**Authority:** Senior Staff Engineer + Architecture Planning Engineer
**Nature:** **SLICE PLANNING ONLY.** Does **not** grant Slice Approval. Does **not** authorize implementation by itself. Does **not** implement uniqueness, backfill, Vault wiring, or handshake.

**Parent Planning Approval:** GRANTED — [`v3-l02-fiv-cred-02-po-governance-planning-approval.md`](./v3-l02-fiv-cred-02-po-governance-planning-approval.md) (`af471fcdd55ad5250cda9819dde586ba55820881`)

**Authoritative governance (not reopened):**

| Artifact | Status |
| -------- | ------ |
| FIV-CRED-02 Planning Package | COMPLETE |
| Architecture Review | PASS WITH CONDITIONS |
| Security Review | PASS WITH CONDITIONS |
| Decision Freeze (D-CRED-02-01…14) | COMPLETE — Strategy B frozen |
| Planning Approval | GRANTED |

**Repository baseline:** `af471fcdd55ad5250cda9819dde586ba55820881`

```text
SLICE PLANNING = READY FOR PO REVIEW
Implementation NOT AUTHORIZED BY THIS ARTIFACT
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## A. Slice Objective

Establish the **minimum Connection environment data-model foundation** so that Connections can represent:

```text
LIVE
TESTNET
```

using the existing ENV1 taxonomy, without implementing uniqueness, backfill, Vault resolution changes, or Binance handshake.

Deliver (when later Slice-Approved):

* `Connection.environment` as persisted metadata (design + implementation boundary);
* create-time validation: EXCHANGE requires explicit `live`|`testnet`; omit → REJECT;
* immutability after create;
* view/DTO/domain exposure of environment;
* focused regression tests for the data-model contract.

---

## B. Current Repository State

### B.1 Prisma model (FACT)

**Path:** `apps/api/prisma/schema.prisma` — `ConnectionRecord` / `connection_records`

| Field | Type | Nullable | Notes |
| ----- | ---- | -------- | ----- |
| `id` | String | NO | PK |
| `workspaceId` | String | NO | workspace ownership |
| `displayName` | String | NO | |
| `provider` | String | NO | e.g. BINANCE |
| `connectionType` | String | NO | EXCHANGE / NOTIFICATION / AI |
| `vaultSecretId` | String? | YES | opaque Vault reference |
| `status` | String | NO | default DISCONNECTED |
| `createdAt` / `updatedAt` | DateTime | NO | |
| **`environment`** | — | — | **ABSENT** |

**Indexes / uniqueness:**

```text
@@index([workspaceId, createdAt])
@@index([workspaceId, provider])
@@unique([workspaceId, provider, vaultSecretId])
```

No Prisma relations from ConnectionRecord to Vault or Workspace tables (application-scoped ownership).

**DB:** PostgreSQL (`datasource db { provider = "postgresql" }`).

### B.2 ENV1 taxonomy (FACT) — reuse

**Path:** `apps/api/src/modules/execution-adapter/live-venue-egress/trading-credential-environment.ts`

```text
TRADING_CREDENTIAL_ENVIRONMENTS = ['live', 'testnet', 'demo']
type TradingCredentialEnvironment = 'live' | 'testnet' | 'demo'
isTradingCredentialEnvironment(value)
tradingEnvironmentFromPurpose(purpose)
purposeForTradingEnvironment(environment)
```

**DEMO exists in ENV1 but is DEFERRED for Connections** (D-CRED-02-01 / D-CRED-02-14).

### B.3 Create path (FACT)

```text
POST /v1/connections
  → ConnectionsController.create
  → CreateConnectionMetadataDto { displayName, provider }
  → ConnectionsService.create({ workspaceId, actorUserId, displayName, provider })
  → prisma.connectionRecord.create({ … no environment })
  → view(row)
```

**Files:**

* `apps/api/src/modules/connections/connections.controller.ts`
* `apps/api/src/modules/connections/connections.dto.ts`
* `apps/api/src/modules/connections/connections.service.ts`

### B.4 Update path (FACT)

Only `rename` updates Connection metadata (`displayName` only via `RenameConnectionMetadataDto` / `PATCH :id`).

No general update DTO exists for environment — favorable for immutability.

### B.5 Vault relationship (FACT)

* `vaultSecretId` optional opaque reference only.
* Credentials store/retrieve omit purpose today → LIVE `Trading` (later slices).
* FIV-CONN-01 must **not** move secrets, change Vault purposes, resolve secrets, or alter Vault data.

---

## C. Exact Affected Components / Files (planned)

| Path | Role in FIV-CONN-01 |
| ---- | ------------------- |
| `apps/api/prisma/schema.prisma` | Design `environment String?` (additive) |
| Future migration under `apps/api/prisma/migrations/` | Additive nullable column only — **Slice Approval must confirm ownership vs FIV-CONN-04** (see §H) |
| `trading-credential-environment.ts` | **Reuse** — no second taxonomy; may add Connection-allowed subset helper |
| `connections.dto.ts` | Create DTO environment field + validation |
| `connections.service.ts` | create + view; reject omit for EXCHANGE; no env on rename |
| `connections.controller.ts` | Pass environment from body |
| `ConnectionMetadataView` / `ConnectionRow` types | Expose environment |
| `connection-catalog.ts` | Possibly mark EXCHANGE as multi-env (optional thin helper) |
| `connections.service.spec.ts` / new focused spec | Contract tests |
| Web UI | **NOT IN SCOPE** (FIV-CRED-05) |

---

## D. Proposed Data-Model Change

```text
model ConnectionRecord {
  ...
  environment String? @map("environment")
  ...
}
```

**Semantics:**

| Provider class | `environment` |
| -------------- | ------------- |
| EXCHANGE (BINANCE/BYBIT/OKX) | Required at create: `live` \| `testnet` |
| NOTIFICATION / AI | Null / omitted allowed |

**Persistence values:** ENV1 strings `live` / `testnet` only for Connections.

**Not derived from** `vaultSecretId`.

**Logical identity (governance):** `workspaceId + provider + environment` — uniqueness enforcement is **FIV-CONN-02**, not this slice.

---

## E. Existing ENV1 Type / Enum Reuse

```text
Reuse:
  TradingCredentialEnvironment
  isTradingCredentialEnvironment
  TRADING_CREDENTIAL_ENVIRONMENTS

Connection-allowed subset (FIV-CONN-01):
  'live' | 'testnet'

Reject for Connections:
  'demo' and any other string
```

Proposed thin helper (optional, same module or connections module):

```text
isConnectionEnvironment(value): value is 'live' | 'testnet'
```

**Do not** create `ConnectionEnvironment` Prisma enum or parallel string taxonomy.

---

## F. Connection.environment Contract

```text
CREATE (EXCHANGE)
  environment required ∈ { live, testnet }
  omitted / invalid / demo → REJECT / FAIL CLOSED

CREATE (non-EXCHANGE)
  environment omitted → ALLOW (null)

READ (list/get/view)
  expose environment as metadata (null or live|testnet)

Model C
  Connection.environment = constraint/audit metadata only
  Vault purpose remains runtime SoT (unchanged in this slice)
```

No silent:

```text
missing environment → live
```

---

## G. Immutability Contract

```text
Connection.environment = IMMUTABLE AFTER CREATE
```

**Smallest enforcement boundary:**

1. Do not add environment to `RenameConnectionMetadataDto`.
2. `rename` / lifecycle transitions must not accept or write `environment`.
3. No PATCH/PUT environment endpoint.
4. Service-level guard: any accidental update payload including environment → reject (defense in depth).
5. Tests assert rename and status transitions leave environment unchanged.

No LIVE↔TESTNET transition API.

---

## H. Migration Boundary

| Concern | Owner |
| ------- | ----- |
| Schema **design** for `environment` | FIV-CONN-01 (this plan) |
| Additive nullable column migration | **Prefer FIV-CONN-01** if Slice Approval treats persistence as part of data-model foundation; else first step of FIV-CONN-04 |
| LIVE backfill / audit / quarantine | **FIV-CONN-04** |
| NOT NULL for EXCHANGE | **FIV-CONN-04** |
| Strategy B partial unique | **FIV-CONN-02** |
| Purpose-aware Vault calls | **FIV-CONN-03** (API/domain contract slice per parent plan) |

**This planning act:**

```text
Migration creation = NOT PERFORMED
Backfill = NOT PERFORMED
```

**Open for Slice Approval (non-blocking for planning completeness):** Confirm whether FIV-CONN-01 implementation may ship an additive nullable Prisma migration without backfill. Recommendation: **YES** — required to persist the data model; backfill remains FIV-CONN-04. If PO insists zero migration files in CONN-01, then CONN-01 is types/DTO/validation/tests only and persistence waits for CONN-04.

---

## I. Security Impact

Preserves applicable SC controls for this slice:

| Control | FIV-CONN-01 coverage |
| ------- | -------------------- |
| No implicit LIVE default | EXCHANGE omit → reject |
| Environment immutability | No mutation API |
| Workspace isolation | Unchanged getRow/list scoping |
| Secret non-exposure | No secrets on Connection; vaultSecretId reference only |
| Connection/Vault mismatch | **Not enforced yet** (later slice) — Model C metadata only here |
| Uniqueness Strategy B | **Not implemented** (FIV-CONN-02) |

No security control weakened.

---

## J. Test Plan (do not implement yet)

| Area | Planned tests |
| ---- | ------------- |
| Valid values | create EXCHANGE with `live` / `testnet` accepted (once persist available) |
| Invalid values | `demo`, `prod`, empty, garbage → reject |
| Omitted environment | EXCHANGE omit → reject; notification omit → allow |
| Persistence | stored environment round-trips in get/list view |
| Immutability | rename / status transition does not change environment; no env update API |
| Workspace | create/get remain workspace-scoped |
| vaultSecretId | remains reference; environment not derived from it |
| DEMO | not introduced as allowed Connection environment |
| Secret safety | metadata JSON has no credential fields |

---

## K. Explicit Non-Goals

```text
FIV-CONN-02 — provider/environment uniqueness (Strategy B)
FIV-CONN-03 — full API purpose-aware Vault store/retrieve contract
FIV-CONN-04 — LIVE backfill / audit / NOT NULL
FIV-CONN-05 — full security regression matrix across CRED-02
FIV-CRED-03 — Vault-backed live credential provider
FIV-CRED-04 — Binance handshake origins
FIV-CRED-05 — UI Testnet operator flow
C7 / FIV / Binance I/O / real capital
```

---

## L. Acceptance Criteria

| ID | Criterion |
| -- | --------- |
| **AC-01** | Connection can represent LIVE |
| **AC-02** | Connection can represent TESTNET |
| **AC-03** | Only existing approved ENV1 taxonomy strings used |
| **AC-04** | No DEMO environment introduced for Connections |
| **AC-05** | Environment persisted as Connection metadata (when persistence authorized) |
| **AC-06** | Environment not derived from vaultSecretId |
| **AC-07** | vaultSecretId remains credential reference only |
| **AC-08** | Environment not silently defaulted to LIVE |
| **AC-09** | Environment immutable after Connection creation |
| **AC-10** | Workspace ownership unchanged |
| **AC-11** | No secret material stored in Connection |
| **AC-12** | No provider/environment uniqueness implementation in this slice |
| **AC-13** | No LIVE backfill / uniqueness migration in this slice |
| **AC-14** | No Binance I/O |
| **AC-15** | C7 remains DENY-ALL |
| **AC-16** | `allowRealVenueIo` remains false |
| **AC-17** | EXCHANGE create without environment fails closed |

---

## M. Risks / Open Questions

| ID | Item | Severity | Resolution path |
| -- | ---- | -------- | --------------- |
| OQ-01 | Does CONN-01 ship additive nullable Prisma migration? | Medium | Slice Approval decide; recommend YES without backfill |
| OQ-02 | Existing rows lack environment until CONN-04 | Medium | Expected; create path for EXCHANGE requires env only for new rows post-CONN-01 |
| OQ-03 | Web clients omit environment after API change | Medium | Reject with clear 4xx; UI in FIV-CRED-05 |
| R-01 | Implementing create validation before column exists | Low | Order: schema add (if authorized) → service → tests |
| R-02 | Accidental uniqueness work creep | Medium | AC-12 gate in PO Review |

No blocked planning contradictions with Strategy B or Model C.

---

## N. Implementation Sequence (post Slice Approval — do not execute now)

```text
1. Confirm OQ-01 with Slice Approval
2. Reuse ENV1; add Connection-allowed subset helper (live|testnet)
3. Add Connection.environment representation (Prisma nullable String if authorized)
4. Update ConnectionRow / ConnectionMetadataView
5. Update CreateConnectionMetadataDto + controller pass-through
6. Update ConnectionsService.create validation (EXCHANGE required; reject demo/omit)
7. Enforce immutability (rename/lifecycle cannot write environment)
8. Add focused unit/service tests (§J)
9. Run connections + related suites
10. STOP — do not implement Strategy B / backfill / Vault purpose wiring
```

---

## O. Slice Gate Recommendation

```text
SLICE PLANNING = READY FOR PO REVIEW
```

**Next gate:**

```text
PO/GOVERNANCE SLICE APPROVAL
        → Implementation (FIV-CONN-01 only)
        → PO Review
        → Closure
```

```text
FIV-CONN-01
PLANNING COMPLETE — AWAITING SLICE APPROVAL

FIV-CONN-02…05
NOT STARTED

FIV-CRED-02
PLANNING APPROVED / NOT CLOSED

FIV-PRE-01
IMPLEMENTATION AUTHORIZED / NOT CLOSED

C7
DENY-ALL

allowRealVenueIo
FALSE
```

---

## Safety Confirmations (this planning act)

| Confirmation | Status |
| ------------ | ------ |
| No implementation | YES |
| No schema/migration/Connections/Vault changes | YES |
| No credentials / secrets / Binance / FIV | YES |
| Parent governance artifacts unmodified | YES |
| Protected leftovers untouched | YES |
