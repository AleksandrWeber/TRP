# V3-L02 FIV-CRED-02 — Architecture Review

**Document:** FIV-CRED-02 Architecture Review
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-PRE-01
**Slice:** FIV-CRED-02 — Connection Environment + Provider/Environment Uniqueness
**Authority:** Principal Backend Architect + Security Architect
**Nature:** **ARCHITECTURE REVIEW ONLY.** Does **not** authorize implementation. Does **not** grant Slice Approval. Does **not** close FIV-PRE-01. Does **not** authorize C7, Testnet I/O, FIV, or `allowRealVenueIo=true`.

**Reviewed artifacts:**

| Artifact | Path |
| -------- | ---- |
| Planning Package | [`v3-l02-fiv-cred-02-planning-package.md`](./v3-l02-fiv-cred-02-planning-package.md) |
| FIV-CRED-01 Closure | [`v3-l02-fiv-cred-01-closure.md`](./v3-l02-fiv-cred-01-closure.md) |
| PO Decision Freeze | [`v3-l02-fiv-pre-01-po-governance-decision-freeze.md`](./v3-l02-fiv-pre-01-po-governance-decision-freeze.md) |

**Repository baseline:** `c67db2288909b5ec2198253621c3951cd98c40bd`

```text
ARCHITECTURE PASS WITH CONDITIONS
IMPLEMENTATION NOT AUTHORIZED BY THIS REVIEW
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Executive Summary

FIV-CRED-02’s proposed Model C Connection-side design is **architecturally sound** and compatible with closed FIV-CRED-01 exact-purpose Vault isolation.

Repository evidence confirms:

* `ConnectionRecord` has **no** `environment` / `purpose`.
* Exchange credential store/retrieve via Connections **omits Vault purpose** → `SecretPurpose.Trading` (LIVE-class).
* Credentialed slot enforcement is **provider-only** (`assertCredentialSlotAvailable`).
* Existing uniqueness `@@unique([workspaceId, provider, vaultSecretId])` does **not** encode environment and is a credential-reference uniqueness aid, not a logical Connection identity for multi-environment coexistence.
* ENV1 already provides `TradingCredentialEnvironment = live | testnet | demo` — reuse; do not invent a second taxonomy.
* Existing LIVE-class Connections can be safely backfilled to `live` **when unambiguous**; duplicate metadata-only EXCHANGE rows are the primary migration hazard.

**Verdict:** `ARCHITECTURE PASS WITH CONDITIONS` — conditions in §18 are mandatory and testable before implementation.

---

## 2. Repository Evidence

### 2.1 Persistence (FACT)

**Path:** `apps/api/prisma/schema.prisma` — `ConnectionRecord`

```text
id, workspaceId, displayName, provider, connectionType,
vaultSecretId?, status, createdAt, updatedAt
```

```text
@@index([workspaceId, createdAt])
@@index([workspaceId, provider])
@@unique([workspaceId, provider, vaultSecretId])
```

No FK from Connection to Vault (opaque id only). No workspace relation table FK on ConnectionRecord (workspace ownership enforced in application layer).

Migrations:

* `20260817193000_w2_s01_a_connection_metadata`
* `20260817193500_w2_s01_b_connection_vault_reference`

### 2.2 Application layer (FACT)

| Operation | Path / behavior |
| --------- | --------------- |
| list/get | `workspaceId`-scoped (`findMany` / `findFirst({ id, workspaceId })`) |
| create | `displayName` + `provider` only — no environment |
| rename | displayName only |
| store/replace credentials | Vault store/replace **without purpose** |
| revoke/validate | Vault get/retrieve/revoke **without purpose** |
| handshake | `ExchangeHandshakeService` Vault get/retrieve **without purpose** |
| capability | `ExchangeCapabilityService` Vault get/retrieve **without purpose** |
| workspace auth | Controller `requireWorkspace` + membership |

### 2.3 Provider-only / LIVE default (FACT)

| Occurrence | Behavior |
| ---------- | -------- |
| `ConnectionsService.assertCredentialSlotAvailable` | `findFirst({ workspaceId, provider, vaultSecretId: { not: null } })` |
| Same + `vault.get({ type })` omit purpose | Defaults to `Trading` |
| `assertRevokedCredentialSlotAvailable` | Vault get by type only |
| Handshake / capability retrieve | Type-only Vault resolve → LIVE slot |

### 2.4 Existing environment taxonomy (FACT)

`apps/api/src/modules/execution-adapter/live-venue-egress/trading-credential-environment.ts`:

```text
live | testnet | demo
tradingEnvironmentFromPurpose(Trading|TradingLive) → live
tradingEnvironmentFromPurpose(TradingTestnet) → testnet
purposeForTradingEnvironment(live) → TradingLive  // NOT Trading
```

---

## 3. Current Architecture

```text
Connection identity (practical today)
  = row id + workspaceId + provider (+ opaque vaultSecretId)

Logical environment
  = implicit LIVE via Vault omit-purpose default

Credentialed uniqueness (app)
  = one credentialed Connection per (workspace, provider)

Vault SoT for Connections path
  = always Trading for exchanges
```

Consequence: LIVE and TESTNET cannot coexist as first-class Connections; Testnet product path cannot be represented without purpose/environment.

---

## 4. Target Architecture

```text
Logical Connection (EXCHANGE multi-env)
  = workspaceId + provider + environment

Credential reference
  = vaultSecretId → Vault record (workspaceId + type + purpose)

Runtime environment SoT
  = Vault SecretPurpose (via ENV1 mapping)

Persisted constraint / audit
  = Connection.environment

Agreement rule
  = tradingEnvironmentFromPurpose(vaultPurpose) == Connection.environment
  else FAIL CLOSED
```

No silent override either direction.

---

## 5. Model C Analysis (AD-02-01)

| Property | Assessment |
| -------- | ---------- |
| One authoritative runtime environment source | **YES** — Vault purpose / ENV1 |
| One persisted Connection constraint | **YES** — `Connection.environment` |
| Deterministic mismatch detection | **YES** — ENV equality check |
| Connection overrides Vault | **FORBIDDEN** |
| Vault rewrites Connection.environment | **FORBIDDEN** |

**AQ-02-01:** Model C is architecturally sound for this Connection model. **PASS.**

---

## 6. Environment Model (AD-02-02)

**Sufficient for FIV-CRED-02:** `live` + `testnet` for multi-environment EXCHANGE providers (Binance/Bybit primary).

**Reuse:** ENV1 `TradingCredentialEnvironment` string vocabulary — **do not** create a parallel Connection-only enum/type.

**DEMO:** Exists in ENV1 for OKX. **Do not silently expand FIV-CRED-02** to require DEMO Connection create. Treat DEMO Connection enablement as a **future decision** unless PO explicitly expands scope.

Notification/AI providers remain single-environment (no EXCHANGE multi-env requirement).

---

## 7. Uniqueness Analysis (AD-02-03)

### Semantic field roles

| Field | Identifies |
| ----- | ---------- |
| `workspaceId + provider + environment` | **Logical Connection** for multi-env EXCHANGE |
| `vaultSecretId` | **Credential reference** (opaque pointer to Vault row) |
| Vault `(workspaceId, type, purpose)` | **Credential slot / environment SoT** |
| `environment` | **Persisted constraint/audit context** (not runtime SoT) |

`vaultSecretId` must **not** be part of the new logical uniqueness key for coexistence.

### Current `@@unique([workspaceId, provider, vaultSecretId])`

* **Preserve or carefully evolve** as a reference-integrity / anti-double-bind aid.
* **Insufficient** alone for LIVE+TESTNET coexistence.
* Must be **supplemented** by environment-aware uniqueness and replacement of provider-only app checks.

### Proposed logical uniqueness

```text
workspaceId + provider + environment
```

**AQ-02-02:** Correct **logical** uniqueness boundary for multi-env EXCHANGE — **YES**, with conditions on physical unique form (§18 C-02, C-03).

### Duplicate hazard (critical)

`create()` allows multiple metadata-only BINANCE rows (`vaultSecretId = null`). PostgreSQL UNIQUE treats NULLs as distinct, so multiple `(workspace, BINANCE, NULL)` can exist today.

If a naive `@@unique([workspaceId, provider, environment])` is applied after backfilling all rows to `live`, **duplicate metadata-only rows collide**.

Architecture requires an explicit physical strategy (condition C-02).

---

## 8. Existing LIVE Migration Analysis (AD-02-04)

### Can existing Connections be backfilled to `live`?

**YES for unambiguous LIVE-class Connections**, based on code-path evidence:

* No Connection environment exists today.
* Connections exchange Vault path always omits purpose → `Trading` (LIVE-class).
* No Connections path writes `TradingTestnet`.

**NOT VERIFIED:** live production row inventories (no DB inspection in this review).

### Ambiguous records

| Case | Classification |
| ---- | -------------- |
| EXCHANGE Connection with credentials stored via Connections path | Unambiguous → `live` |
| EXCHANGE metadata-only Connection | Unambiguous **semantics** → `live`, but may be **duplicate** under new unique key |
| Connection whose `vaultSecretId` points to a Vault row with purpose `trading_testnet` | **Ambiguous / exceptional** — must **not** silently backfill as live; pre-migration audit must detect via Vault metadata join if possible |
| Notification/AI Connections | Not multi-env; env may be null or N/A — Architecture: prefer leave null / non-EXCHANGE exempt |

**AQ-02-03:** Unambiguous LIVE-class Connections **can** safely be backfilled to `live`.

**AQ-02-04:** Ambiguous / colliding records → **FAIL CLOSED migration** (abort or quarantine); never silent Testnet classification; never invent environment from client input.

### Pre-migration audit — REQUIRED

Transactional backfill only after audit shows:

1. No EXCHANGE Connection bound to non-LIVE Vault purpose (or explicit handling plan).
2. Duplicate `(workspace, provider)` rows that would share `live` are resolved per C-02 strategy.
3. At most one credentialed Connection per `(workspace, provider)` today (expected from app slot check).

---

## 9. Missing-Environment Behavior (AD-02-05)

Current: omit purpose → LIVE (Vault).

Post-change for multi-environment EXCHANGE:

```text
environment omitted on create
        ↓
REJECT / FAIL CLOSED
```

No generic silent LIVE fallback for environment-aware EXCHANGE API.

Single-environment providers (notification/AI): omit environment allowed.

**AQ-02-05:** Missing environment must **not** default to LIVE for multi-env EXCHANGE creates after feature land.

Legacy rows: explicit persisted `live` after backfill (not omit-default).

---

## 10. Provider-Only Lookup Analysis (AD-02-06)

| Occurrence | Caller | Impact | Required future key |
| ---------- | ------ | ------ | ------------------- |
| `assertCredentialSlotAvailable` findFirst provider | storeCredentials | Blocks TESTNET coexistence; ambiguous if naively removed | workspace+provider+environment |
| Vault get omit purpose (same method) | storeCredentials | Always LIVE slot | include purpose from Connection.environment |
| `assertRevokedCredentialSlotAvailable` | revoke re-store path | LIVE-only | purpose-aware |
| Handshake Vault get/retrieve | validate EXCHANGE | LIVE-only retrieve | purpose from Connection (CRED-02 contract); origin selection CRED-04 |
| Capability Vault get/retrieve | post-handshake | LIVE-only | purpose from Connection |

**AQ-02-06:** Remove/replace all provider-only credentialed Connection selection and omit-purpose Vault resolves on Connections-owned paths. Handshake **origin** remains CRED-04; purpose-aware retrieve is required for correctness when TESTNET Connections exist (condition C-06).

Target:

```text
workspaceId + provider + environment → exact Connection
Connection.environment → expected purpose class → exact Vault slot
```

No provider-only. No workspace+provider when env-ambiguous. No cross-env fallback.

---

## 11. Workspace Isolation (AD-02-07)

**PASS** — preserve existing boundaries:

* Controller membership on `X-Workspace-Id`.
* `getRow({ id, workspaceId })`.
* Vault `VaultAccessControl` on retrieve/store.

Target model must keep `workspaceId` in all uniqueness and lookup keys.

---

## 12. Environment Tampering (AD-02-08)

**Recommendation:** `environment` is **immutable after create**.

| Option | Assessment |
| ------ | ---------- |
| Immutable | Preferred — prevents LIVE↔TESTNET rebind without new Connection + new Vault purpose slot |
| Mutable controlled op | Acceptable only if it re-validates Vault purpose match, uniqueness, and audit; higher risk |

**AQ-02-07:** Prefer **immutable**. If mutable later, require explicit controlled operation — not a free PATCH field.

---

## 13. Connection/Vault Mismatch Contract (AD-02-09)

Exact future validation:

```text
ALLOW when:
  tradingEnvironmentFromPurpose(vaultPurpose) === connection.environment

DENY otherwise (FAIL CLOSED)
```

Examples:

| Connection env | Vault purpose | Result |
| -------------- | ------------- | ------ |
| live | Trading | ALLOW (LIVE-class) |
| live | TradingLive | ALLOW |
| testnet | TradingTestnet | ALLOW |
| testnet | Trading | DENY |
| live | TradingTestnet | DENY |

**Do not** require `purpose === purposeForTradingEnvironment(env)` alone — that would incorrectly deny legacy `Trading` for `live` Connections (`purposeForTradingEnvironment('live')` returns `TradingLive`).

This **composes with** FIV-CRED-01 exact-purpose Vault isolation; it does not weaken it.

**AQ-02-08:** ENV equality via `tradingEnvironmentFromPurpose` as above.

---

## 14. Migration Strategy

Recommended ordering (repository-adjusted):

```text
Phase 0 — Precondition audit (non-destructive)
  Inventory EXCHANGE Connections; detect duplicates; detect vaultSecretId → purpose mismatches

Phase 1 — Add nullable environment column (no unique yet)

Phase 2 — Backfill unambiguous EXCHANGE rows → 'live'
  Abort/quarantine on ambiguous Vault purpose bindings

Phase 3 — Apply C-02 uniqueness strategy
  Resolve metadata-only duplicates before hard unique if required

Phase 4 — Enforce NOT NULL for EXCHANGE environment

Phase 5 — Replace provider-only app slot checks; purpose-aware Vault calls

Phase 6 — Add physical unique constraint consistent with C-02
```

### Contract

| Element | Requirement |
| ------- | ----------- |
| Precondition | Audit clean or explicit quarantine plan; Slice Approval; FIV-CRED-01 still closed |
| Transformation | Metadata only — add/backfill `environment`; **no** Vault secret mutation |
| Postcondition | EXCHANGE Connections have explicit env; LIVE semantics preserved; coexistence possible |
| Failure | Abort closed; do not partial-enforce unique over unclean data |
| Rollback | Prefer forward-fix; dropping unique is safer than deleting `live` backfill; never rewrite to testnet on rollback |
| Duplicates | Detect before unique; resolve per C-02; never auto-merge secrets |

### Critical migration rule (confirmed)

MUST NOT:

* change Vault purposes;
* copy/rotate/reclassify secrets;
* migrate LIVE credentials to Testnet;
* network / Binance I/O.

---

## 15. Security Threat Matrix

| Threat | Current Exposure | Target Control | Verification |
| ------ | ---------------- | -------------- | ------------ |
| TESTNET → LIVE credential | High once Testnet Connection exists without mismatch check; today all LIVE | ENV equality fail-closed | Store/retrieve deny tests |
| LIVE → TESTNET credential | Low today (Testnet unused by Connections) | Same | Deny tests |
| Missing environment → LIVE | Present (omit purpose) | Reject EXCHANGE omit | Create 4xx test |
| Provider-only lookup | Present | provider+env keys | Coexistence + conflict tests |
| Cross-workspace access | Mitigated today | Preserve | Isolation tests |
| Duplicate environment Connection | Metadata duplicates possible | Unique strategy C-02 | Conflict tests |
| Environment tampering | N/A (no field) | Immutable (preferred) | No PATCH env / deny mutate |
| Unsafe migration | N/A | Audit + abort closed | Migration dry-run / fixtures |
| Secret exposure | Mitigated (write-only) | Preserve | Metadata assertions |
| Arbitrary endpoint selection | Handshake origins separate | Remain FIV-CRED-04 / EG1 | Out of CRED-02 scope |

**Security posture for this design:** **PASS WITH CONDITIONS** (same conditions as architecture).

---

## 16. Architecture Risks

| ID | Severity | Rationale | Mitigation | Owner | Blocking? |
| -- | -------- | --------- | ---------- | ----- | --------- |
| AR-01 Two sources of env truth | Medium | Misimplementation could treat Connection.environment as SoT | Document Model C; mismatch fail-closed; tests | FIV-CRED-02 | Non-blocking if C-01 held |
| AR-02 Migration ambiguity | High | Duplicate metadata rows; rare Vault purpose mismatch | Pre-audit; abort closed; C-02/C-04 | FIV-CRED-02 | **Blocking until audit strategy frozen** |
| AR-03 Provider-only legacy lookup | High | Blocks coexistence / wrong slot | Replace in CRED-02 | FIV-CRED-02 | **Blocking for merge** |
| AR-04 Uniqueness constraint migration | High | Naive unique fails on duplicates | C-02 physical form | FIV-CRED-02 | **Blocking** |
| AR-05 Missing env compatibility | Medium | Clients omit env | Reject EXCHANGE omit; version API carefully | FIV-CRED-02 | Non-blocking if C-05 held |
| AR-06 Environment mutation | Medium | LIVE↔TESTNET rebind | Immutable preferred | FIV-CRED-02 | Non-blocking if C-07 held |
| AR-07 Cross-workspace access | Low (mitigated) | Regression risk | Keep workspace keys | FIV-CRED-02 | Non-blocking |
| AR-08 Scope leakage CRED-03/04 | Medium | Handshake origins / live provider wiring | Hard boundary §§17 | FIV-CRED-02..04 | Non-blocking if C-06/C-08 held |

---

## 17. Boundaries — CRED-02 / CRED-03 / CRED-04

### FIV-CRED-02 owns

* `Connection.environment` persistence + API contract
* Uniqueness / slot checks
* LIVE backfill migration (metadata only)
* Purpose-aware Vault calls on Connections-owned store/replace/revoke/validate paths
* Mismatch fail-closed at Connection↔Vault purpose binding points owned by Connections
* Tests for above

### FIV-CRED-03 owns (AQ-02-09)

* Vault-backed `LiveTradingCredentialProvider` production wiring / composition
* Live execution credential resolve path beyond Connections management

### FIV-CRED-04 owns (AQ-02-10)

* Environment-aware Binance handshake **origin/endpoint selection**
* EG1 host class application for validate I/O
* DNS-pin / network security posture for handshake
* Must consume Connection.environment / purpose already established by CRED-02

**AQ-02-09 / AQ-02-10:** Confirmed as above.

---

## 18. Required Conditions

Implementation of FIV-CRED-02 is architecturally acceptable **only if** all conditions below are satisfied (testable):

### C-01 — Model C mismatch check

Implement agreement as:

```text
tradingEnvironmentFromPurpose(vaultPurpose) === connection.environment
```

Legacy `Trading` and `TradingLive` both ALLOW for `live`. Never silent override either direction.

### C-02 — Physical uniqueness strategy (choose one before coding)

Freeze one of:

1. **Partial unique** on credentialed EXCHANGE rows: unique `(workspaceId, provider, environment)` where credentials present; **or**
2. **Full unique** on all EXCHANGE `(workspaceId, provider, environment)` **after** pre-migration duplicate metadata cleanup.

Document the choice in Slice Approval. Naive unique without cleanup is **forbidden**.

### C-03 — Do not put `vaultSecretId` in logical uniqueness key

Keep logical Connection identity as workspace+provider+environment. Evolve existing `(workspace, provider, vaultSecretId)` unique only as reference integrity, not as env coexistence key.

### C-04 — Pre-migration audit mandatory

Before enforcing NOT NULL / unique:

* Inventory EXCHANGE Connections.
* Detect duplicate live collisions under chosen C-02 strategy.
* Detect `vaultSecretId` bindings to non-LIVE Vault purposes (if any).
* Abort closed on unresolvable ambiguity (no silent Testnet classification).

### C-05 — Missing environment reject for EXCHANGE

Post-feature EXCHANGE create without valid `live`|`testnet` → REJECT. No silent LIVE default.

### C-06 — Purpose-aware retrieve on Connections validate path

When TESTNET Connections can store credentials, validate/handshake/capability Vault retrieve **must** use Connection-derived purpose (not omit-purpose LIVE default). **Origin/host selection remains FIV-CRED-04**; CRED-02 must not enable Testnet network I/O, but must not leave omit-purpose retrieve after multi-env store lands.

Acceptable interim: deny EXCHANGE validate for `testnet` until CRED-04 (fail closed) — must be explicit in implementation plan.

### C-07 — Environment immutability

No free mutation of `environment` after create in FIV-CRED-02. Controlled mutation only if separately approved.

### C-08 — Scope freeze

No Vault-backed live provider Nest wiring (CRED-03). No Binance origin/EG1 redesign (CRED-04). No C7 / FIV / `allowRealVenueIo`. No secret copy/rotation/reclassification.

### C-09 — DEMO deferred

Do not require DEMO Connection create in FIV-CRED-02 unless PO expands scope.

### C-10 — Secret safety unchanged

Write-only credentials; no secrets in metadata, logs, errors, migrations, or docs.

---

## 19. Architecture Verdict

```text
ARCHITECTURE PASS WITH CONDITIONS
```

Design is internally coherent, Model C compatible, LIVE-preserving, and separable from CRED-03/04 **if and only if** conditions C-01…C-10 are met.

```text
IMPLEMENTATION NOT AUTHORIZED BY THIS REVIEW
```

---

## 20. Governance Status

```text
FIV-CRED-02
PLANNING COMPLETE
ARCHITECTURE REVIEW
PASS WITH CONDITIONS

IMPLEMENTATION
NOT AUTHORIZED BY THIS REVIEW

FIV-CRED-01
CLOSED

FIV-CRED-03
NOT STARTED

FIV-CRED-04
NOT STARTED

FIV-PRE-01
IMPLEMENTATION AUTHORIZED / NOT CLOSED

FIV
NOT READY / NOT AUTHORIZED

C7
DENY-ALL

allowRealVenueIo
FALSE
```

**Next gate:**

```text
Security Review
        → PO/Governance Review
        → Planning Approval
        → Slice Approval
        → Implementation
```

---

## 21. Safety Confirmations (this review act)

| Confirmation | Status |
| ------------ | ------ |
| No implementation | YES |
| No schema/migration/Connections/Vault/API/UI changes | YES |
| No secrets accessed or exposed | YES |
| No Binance / FIV / capital movement | YES |
| Protected leftovers untouched | YES |
| Planning package unmodified | YES |
