# FIV-CONN-03 Planning Package

**Document:** FIV-CONN-03 Connection API/Domain Contract — Planning Package
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-03 — Connection API/Domain Contract (purpose-aware Vault + Model C mismatch)
**Authority:** Senior Staff Engineer + Principal Architecture Planning Engineer (draft under PO + Chief Architect governance)
**Nature:** **SLICE PLANNING ONLY.** Does **not** grant Planning Review pass. Does **not** grant Architecture/Security/PO approval. Does **not** grant Slice Approval. Does **not** authorize implementation. Does **not** modify production code, schema, migrations, Vault, credentials, or external integrations.

**Parent:** FIV-PRE-01 → FIV-CRED-02
**Prior closed slices:** FIV-CRED-01 CLOSED · FIV-CONN-01 CLOSED · FIV-CONN-02 CLOSED
**FIV-CONN-02 closure:** [`v3-l02-fiv-conn-02-closure.md`](./v3-l02-fiv-conn-02-closure.md) (commit `42714f2f9b69de53b5e2a750395ec30c6ce965b3`)
**Repository baseline (planning start):** `42714f2f9b69de53b5e2a750395ec30c6ce965b3` (`main`)

```text
SLICE PLANNING PACKAGE — NOT IMPLEMENTATION AUTHORIZATION

Implementation:                 NOT PERFORMED
Schema changes:                 NONE
Migrations:                     NONE
Vault changes:                  NONE
Credential changes:             NONE
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
Next gate:                      FIV-CONN-03 PLANNING REVIEW
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Governance Context

### 1.1 Pre-check dirty/untracked state (planning start)

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

### 1.2 Authoritative governance chain reviewed

| Artifact                          | Path                                                    | Status               |
| --------------------------------- | ------------------------------------------------------- | -------------------- |
| FIV-CRED-02 Planning Package      | `v3-l02-fiv-cred-02-planning-package.md`                | COMPLETE             |
| FIV-CRED-02 Architecture Review   | `v3-l02-fiv-cred-02-architecture-review.md`             | PASS WITH CONDITIONS |
| FIV-CRED-02 Security Review       | `v3-l02-fiv-cred-02-security-review.md`                 | PASS WITH CONDITIONS |
| FIV-CRED-02 Decision Freeze       | `v3-l02-fiv-cred-02-po-governance-decision-freeze.md`   | COMPLETE             |
| FIV-CRED-02 Planning Approval     | `v3-l02-fiv-cred-02-po-governance-planning-approval.md` | GRANTED              |
| FIV-CONN-01 Closure               | `v3-l02-fiv-conn-01-closure.md`                         | CLOSED               |
| FIV-CONN-02 Planning Package      | `v3-l02-fiv-conn-02-planning-package.md`                | COMPLETE             |
| FIV-CONN-02 Slice Approval        | `v3-l02-fiv-conn-02-slice-approval.md`                  | GRANTED              |
| FIV-CONN-02 Implementation Report | `v3-l02-fiv-conn-02-implementation-report.md`           | COMPLETE / PASS      |
| FIV-CONN-02 PO Review             | `v3-l02-fiv-conn-02-po-review.md`                       | PASS                 |
| FIV-CONN-02 Re-Verification       | `v3-l02-fiv-conn-02-re-verification.md`                 | PASS                 |
| FIV-CONN-02 Closure               | `v3-l02-fiv-conn-02-closure.md`                         | CLOSED               |

Frozen parent decisions **D-CRED-02-01…14** are **not** reopened. Strategy B is **not** replaced. Model C is **not** reinterpreted.

### 1.3 Slice ladder (do not collapse)

```text
ALREADY CLOSED:
  FIV-CRED-01
  FIV-CONN-01
  FIV-CONN-02

CURRENT:
  FIV-CONN-03 PLANNING   ← THIS ARTIFACT

FUTURE:
  FIV-CONN-04
  FIV-CONN-05
```

---

## 2. Parent FIV-PRE-01 Context

FIV-PRE-01 establishes the operator + architecture path for:

```text
BINANCE + trading_testnet
  → separate purpose/classification
  → separate Vault credential binding
  → explicit environment binding
  → Binance Testnet only
```

FIV-CRED-02 is the **Connection-side half** of Model C under FIV-PRE-01:

```text
Vault SecretPurpose     = runtime credential/environment SoT
Connection.environment  = persisted Connection constraint / audit context
Mismatch                = FAIL CLOSED
```

Authoritative FIV-CRED-02 decomposition (§14):

```text
FIV-CONN-01 — Environment domain/persistence model          CLOSED
FIV-CONN-02 — Provider + environment uniqueness             CLOSED
FIV-CONN-03 — Connection API/domain contract                ← THIS SLICE
FIV-CONN-04 — LIVE backward-compatible backfill             FUTURE
FIV-CONN-05 — Security regression / isolation tests         FUTURE
```

Parent one-liner for FIV-CONN-03:

> Create requires env for EXCHANGE; store/replace/revoke/validate purpose-aware Vault calls

**Repository alignment note (FACT):** Parts of that one-liner were delivered early for coexistence safety:

| Parent CONN-03 claim                                   | Current repository                  | Owner that delivered   |
| ------------------------------------------------------ | ----------------------------------- | ---------------------- |
| Create requires env for EXCHANGE                       | **DELIVERED**                       | FIV-CONN-01            |
| store/replace/revoke purpose-aware (Connections-owned) | **DELIVERED** (minimum coexistence) | FIV-CONN-02            |
| validate purpose-aware (full EXCHANGE path)            | **NOT DELIVERED**                   | Residual → FIV-CONN-03 |
| Model C mismatch fail-closed on Connections paths      | **NOT DELIVERED**                   | Residual → FIV-CONN-03 |

This package therefore **refines residual CONN-03 scope against the live repository** without inventing a new slice purpose and without double-counting CLOSED work.

---

## 3. Previous Closed Slices

### 3.1 FIV-CRED-01 — CLOSED

Exact-purpose Vault isolation taxonomy and fail-closed purpose resolution foundation.

### 3.2 FIV-CONN-01 — CLOSED

| Delivered                                          | Evidence                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| Nullable `ConnectionRecord.environment`            | migration `20260917170000_v3_l02_fiv_conn_01_connection_environment` |
| ENV1 vocabulary `live` / `testnet` (DEMO deferred) | schema comments + DTO `@IsIn`                                        |
| EXCHANGE create requires environment               | `ConnectionsService` + tests                                         |
| View/DTO exposure of environment                   | metadata views; no secrets                                           |
| Environment immutability after create              | rename/update cannot mutate env                                      |

**Not delivered by CONN-01:** uniqueness, Vault purpose wiring, backfill, handshake purpose.

### 3.3 FIV-CONN-02 — CLOSED

| Delivered                                                                                    | Evidence                                                                      |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Strategy B partial unique index                                                              | migration `20260917180000_v3_l02_fiv_conn_02_provider_environment_uniqueness` |
| App credential slot = workspace + provider + environment                                     | `assertCredentialSlotAvailable`                                               |
| P2002 → Conflict                                                                             | credential bind path                                                          |
| Minimum EXCHANGE purpose pass-through on Connections Vault store/get/replace/retrieve/revoke | `vaultPurposeForConnection` / `vaultPurposesToProbe`                          |
| LIVE + TESTNET coexistence for credentialed EXCHANGE                                         | tests + uniqueness                                                            |

**Explicitly deferred by CONN-02 closure / implementation report:**

```text
FIV-CONN-03 full API/domain purpose contract expansion beyond Connections-owned paths
Model C mismatch matrix
Handshake / capability purpose wiring
LIVE backfill / EXCHANGE NOT NULL (FIV-CONN-04)
FIV-CONN-05 security regression matrix
```

---

## 4. Current Problem Statement

### 4.1 What remains missing after FIV-CONN-02?

1. **EXCHANGE validate still omit-purpose Vault retrieve** through `ExchangeHandshakeService` and `ExchangeCapabilityService` → defaults to legacy `trading`, while CONN-02 stores populated-env LIVE under `trading_live` and TESTNET under `trading_testnet`.
2. **Model C mismatch enforcement is absent on Connections paths** — no `tradingEnvironmentFromPurpose(vaultPurpose) === connection.environment` check at store/replace/validate.
3. **LIVE-class dual-slot asymmetry** — slot probe accepts `Trading` + `TradingLive`, but store/retrieve/revoke for populated `live` uses exact `TradingLive` only; handshake still targets omit-purpose `Trading`.
4. **NULL-environment EXCHANGE rows still omit purpose** on Connections Vault helpers until FIV-CONN-04 backfill — validate/handshake behavior for those legacy rows is underspecified for the multi-env era.

### 4.2 What exact capability is required for FIV-PRE-01?

A Connection API/domain contract that makes Testnet Connections **credential-safe end-to-end on Connections-owned flows**: store → replace → revoke → validate, without retrieving LIVE-class secrets for a Testnet Connection (and without retrieving Testnet secrets for a LIVE Connection).

### 4.3 What repository component currently blocks it?

| Component                       | Path                                                 | Blocker                                                                              |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Handshake Vault get/retrieve    | `exchange-handshake.service.ts`                      | Omit purpose → `trading`                                                             |
| Capability Vault get/retrieve   | `exchange-capability.service.ts`                     | Omit purpose → `trading`                                                             |
| EXCHANGE validate orchestration | `connections.service.ts` `completeExchangeHandshake` | Passes no purpose/environment into handshake/capability                              |
| Model C mismatch helper         | Connections module                                   | **Absent** (ENV1 equality exists in execution policy, not Connections CRUD/validate) |

### 4.4 What security boundary is involved?

```text
ENV1 environment class
  ↔
Vault SecretPurpose (exact-purpose)
  ↔
Connection.environment (constraint)
```

Controls: Model C, D-CRED-02-07/08, FIV-CRED-01 exact-purpose isolation, workspace ACL, EG1 host allowlists (origins remain FIV-CRED-04), C7 DENY-ALL, `allowRealVenueIo=false`.

### 4.5 What user/operator workflow is involved?

Operator Connection Management:

1. Create EXCHANGE Connection with explicit `live` or `testnet`.
2. Store credentials (already purpose-aware under CONN-02).
3. Validate / connect — **currently unsafe for multi-env** because handshake/capability omit purpose.
4. Capability verification after handshake — same omit-purpose hazard.

UI Testnet selector remains primarily **FIV-CRED-05** (UI still hardcodes `environment: 'live'` on create). FIV-CONN-03 is **API/service-first**.

### 4.6 Smallest coherent implementation boundary

Wire **purpose (and environment class) through EXCHANGE validate → handshake → capability**, and enforce **Model C mismatch FAIL CLOSED** on Connections credential bind/validate paths — without Binance origin changes, without LIVE backfill, without Vault redesign, without UI Testnet operator flow.

### 4.7 What must remain outside this slice?

FIV-CONN-04 (backfill / NOT NULL), FIV-CONN-05 (full CRED-02 regression matrix), FIV-CRED-03 (Vault-backed live provider Nest wiring), FIV-CRED-04 (handshake origin/host selection), FIV-CRED-05 (UI Testnet flow), C7, `allowRealVenueIo`, FIV, venue I/O enablement, DEMO, SecretPurpose redesign.

---

## 5. Repository Current State

### 5.1 Connection model (FACT)

`ConnectionRecord` (`apps/api/prisma/schema.prisma`):

- `environment String?` — ENV1 `live`|`testnet`; nullable until FIV-CONN-04
- Strategy B documented as SQL-only partial unique: credentialed + non-revoked + EXCHANGE + env NOT NULL
- Existing `@@unique([workspaceId, provider, vaultSecretId])` preserved
- `vaultSecretId` remains credential reference only (not logical identity)

### 5.2 Connections service purpose helpers (FACT)

`connections.service.ts`:

- `vaultPurposeForConnection` → EXCHANGE + populated env → `purposeForTradingEnvironment(env)` (`live`→`trading_live`, `testnet`→`trading_testnet`); else omit
- `vaultPurposesToProbe` → LIVE probes `[Trading, TradingLive]`; TESTNET probes `[TradingTestnet]`
- Used on store / replace / revoke / local validate / slot checks
- **Not** passed into handshake/capability
- **No** `tradingEnvironmentFromPurpose` mismatch assertion

### 5.3 Handshake / capability (FACT)

- `ExchangeHandshakeRequest` has no `purpose` / `environment`
- Vault `get`/`retrieve` called with `{ workspaceId, type, … }` only → `defaultPurposeForType` → `trading`
- Binance handshake origin hardcoded `https://api.binance.com` (FIV-CRED-04 ownership)

### 5.4 Vault / SecretPurpose / ENV1 (FACT)

- Exact-purpose Vault API already supports optional `purpose`
- Omit → `trading` for exchange types
- ENV1 maps: `trading`/`trading_live` → `live`; `trading_testnet` → `testnet`
- LIVE-class agreement for Model C uses environment equality via `tradingEnvironmentFromPurpose`, not string equality to `purposeForTradingEnvironment('live')` alone

### 5.5 API / UI (FACT)

- Create DTO: optional `environment` with service-level EXCHANGE require
- No client-supplied purpose fields (correct)
- Web `ConnectionsPage` hardcodes `environment: 'live'` — no Testnet selector (FIV-CRED-05)

### 5.6 Migrations (FACT)

- CONN-01: additive nullable `environment`
- CONN-02: Strategy B partial unique
- **No** LIVE backfill migration yet (CONN-04)

---

## 6. Exact FIV-CONN-03 Objective

```text
OBJECTIVE:
Complete the Connection API/domain contract for Model C purpose-aware
Vault resolution on all Connections-owned credential lifecycle paths,
including EXCHANGE validate → handshake → capability retrieve, with
fail-closed Connection.environment ↔ Vault purpose class agreement.

IN SCOPE (residual after CONN-01/02):
  - Purpose (and needed environment context) through handshake/capability
  - Model C mismatch FAIL CLOSED on Connections bind/validate paths
  - Explicit NULL-env EXCHANGE validate policy until CONN-04 (decision-gated)
  - LIVE-class dual-purpose retrieve policy for legacy Trading vs TradingLive
    (decision-gated; must not weaken exact-purpose isolation)
  - Focused unit/service tests for the residual contract

OUT OF SCOPE:
  - Re-implement CONN-01 create-requires-env
  - Re-implement CONN-02 Strategy B / slot uniqueness
  - LIVE backfill / EXCHANGE NOT NULL (CONN-04)
  - Full CR-02 security regression matrix (CONN-05)
  - Binance origin / EG1 host selection (FIV-CRED-04)
  - Nest Vault-backed live credential provider (FIV-CRED-03)
  - UI Testnet operator flow (FIV-CRED-05)
  - C7 / allowRealVenueIo / FIV / venue I/O / capital
  - Vault/SecretPurpose redesign
  - DEMO enablement
```

**Why needed after CONN-01 and CONN-02:**

CONN-01 made environment expressible. CONN-02 made credentialed LIVE+TESTNET coexist and purpose-aware on **Connections-owned** Vault writes/reads. Without CONN-03, EXCHANGE **validate** still retrieves the omit-purpose LIVE `trading` slot — violating Architecture C-06 / D-CRED-02-08 and blocking safe Testnet Connection validation under FIV-PRE-01.

---

## 7. Architecture Analysis

| Area                                          | Assessment                                                                 | Minimum change if insufficient                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **A. Connection environment semantics**       | Sufficient post-CONN-01 for API creates; NULL legacy remains until CONN-04 | Define NULL-env validate policy for CONN-03 only                                 |
| **B. Vault purpose resolution**               | Vault exact-purpose API sufficient; Connections helpers partially wired    | Extend helpers into handshake/capability; add mismatch assert                    |
| **C. Environment-aware credential selection** | Slot uniqueness done; retrieve path incomplete                             | Pass Connection-derived purpose into handshake/capability                        |
| **D. Provider/environment identity**          | Strategy B sufficient                                                      | No uniqueness redesign                                                           |
| **E. Connection lifecycle**                   | Create/store/replace/revoke largely ready; validate incomplete             | Wire validate path                                                               |
| **F. Credential validation**                  | Local validate purpose-aware; EXCHANGE validate not                        | Purpose-aware handshake retrieve OR interim deny-testnet-validate                |
| **G. Binance environment routing**            | Origin hardcoded LIVE                                                      | **Out of scope** → FIV-CRED-04                                                   |
| **H. Testnet vs LIVE isolation**              | Store/slot isolation present; validate retrieve not                        | Purpose-aware retrieve + mismatch FAIL CLOSED                                    |
| **I. API contracts**                          | Environment on create/view OK; handshake request lacks purpose             | Extend internal handshake/capability request types (not necessarily public HTTP) |
| **J. UI/operator flow**                       | No Testnet selector                                                        | **Out of scope** → FIV-CRED-05 (API-first)                                       |
| **K. Workspace isolation**                    | Existing ACL + getRow + Vault ACL sufficient                               | Preserve; never resolve without workspaceId                                      |
| **L. Error/fail-closed**                      | Conflict/BadRequest patterns exist                                         | Mismatch → fail closed without secret leakage                                    |
| **M. Security boundaries**                    | Model C frozen; C7/EG1/ENV1 intact                                         | Do not weaken; no C7 / allowRealVenueIo changes                                  |
| **N. Adapter architecture**                   | Handshake adapters origin-bound                                            | Purpose only in this slice; origins deferred                                     |
| **O. FIV-PRE-01 preflight**                   | Needs Testnet Connection credential path without LIVE retrieve confusion   | CONN-03 residual is the Connections-side blocker for validate safety             |

**Verdict:** Existing architecture is **sufficient** to complete FIV-CONN-03 with **minimal targeted wiring + mismatch enforcement**. No schema/migration required for the residual objective. No Vault redesign required.

---

## 8. Security Analysis

| Hazard                              | Current exposure                                       | CONN-03 control direction                                  |
| ----------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| Cross-workspace credential access   | Controlled by existing Vault ACL + Connections getRow  | Preserve; always pass workspaceId                          |
| Cross-environment credential access | **Latent:** Testnet store + omit-purpose LIVE retrieve | Purpose-aware retrieve + mismatch FAIL CLOSED              |
| Provider-only lookup                | Closed for credential slots (CONN-02)                  | Must not reintroduce on handshake                          |
| Environment tampering               | Immutable after create (CONN-01)                       | Preserve; no env PATCH                                     |
| Vault purpose mismatch              | **Not enforced on Connections paths**                  | D-CRED-02-08 equality check                                |
| Credential leakage                  | Write-only views                                       | Preserve; errors must not include secrets                  |
| Endpoint authorization              | Existing membership/roles                              | Preserve                                                   |
| Secret exposure                     | Ciphertext-only Vault                                  | Preserve                                                   |
| SSRF/egress                         | Handshake origins + EG1                                | Origins unchanged (CRED-04); no new egress                 |
| Testnet/live endpoint separation    | Origin still LIVE-only                                 | CRED-04; CONN-03 must not enable Testnet network I/O       |
| Replay                              | N/A for this slice beyond existing handshake           | No change                                                  |
| Concurrency                         | Strategy B + P2002                                     | Preserve; purpose wiring must not race across envs         |
| Fail-closed                         | Partial                                                | Complete for mismatch + omit-purpose after multi-env store |

**Must not weaken:** ENV1, EG1, C7 DENY-ALL, `allowRealVenueIo=false`, FIV-CRED-01 exact-purpose isolation, workspace boundaries, Strategy B.

Architecture interim option **C-06** remains available only if Testnet Connections cannot become CONNECTED via omit-purpose LIVE retrieve: deny EXCHANGE validate for `testnet` until purpose-aware retrieve lands (prefer purpose-aware retrieve in CRED-02 path).

---

## 9. Proposed Scope

### In scope

1. Internal purpose/environment context on handshake + capability Vault get/retrieve.
2. Connections EXCHANGE validate orchestration passing that context.
3. Model C mismatch FAIL CLOSED helper on Connections credential bind/validate paths.
4. Decision-gated NULL-env EXCHANGE validate policy (until CONN-04).
5. Decision-gated LIVE-class dual-purpose retrieve policy for legacy `Trading` vs new `TradingLive`.
6. Focused automated tests for residual contract (no venue I/O).

### Explicitly not in scope

Everything in §17 Non-Goals.

### Schema / migration / Vault

```text
Schema changes:     NONE (expected)
Migrations:         NONE (expected)
Vault module/schema: NONE
SecretPurpose:      UNCHANGED
```

If implementation discovers a schema need, **STOP** and return to PO — do not silently expand.

---

## 10. Proposed Sub-Slices

Every sub-slice remains independently governable. None authorize implementation by themselves.

### FIV-CONN-03-A — Handshake/capability purpose wiring

| Field            | Content                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objective**    | Eliminate omit-purpose Vault retrieve on EXCHANGE validate path                                                                             |
| **Likely files** | `exchange-handshake.service.ts` (+ spec), `exchange-capability.service.ts` (+ spec), `connections.service.ts` (`completeExchangeHandshake`) |
| **Data/schema**  | NONE                                                                                                                                        |
| **API**          | Internal request types only; public Connections HTTP shape unchanged unless Planning Review expands                                         |
| **Security**     | Exact-purpose retrieve; no cross-env fallback; no secret exposure                                                                           |
| **Tests**        | Handshake/capability retrieve asserts purpose; Testnet Connection cannot retrieve `trading`                                                 |
| **Dependencies** | CONN-02 CLOSED; D-CONN-03-01 decision                                                                                                       |
| **Exclusions**   | Binance origin/host selection; EG1 redesign; real venue I/O                                                                                 |
| **Acceptance**   | Omit-purpose retrieve absent on EXCHANGE validate path **or** interim deny-testnet-validate explicitly implemented per C-06                 |

### FIV-CONN-03-B — Model C mismatch FAIL CLOSED

| Field            | Content                                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objective**    | Enforce `tradingEnvironmentFromPurpose(vaultPurpose) === connection.environment` on Connections bind/validate                                                   |
| **Likely files** | `connections.service.ts`, possibly `connection-environment.ts`, specs                                                                                           |
| **Data/schema**  | NONE                                                                                                                                                            |
| **API**          | Error semantics only (fail closed; no secrets)                                                                                                                  |
| **Security**     | LIVE↔TESTNET confusion denied                                                                                                                                   |
| **Tests**        | Matrix: live+TradingLive ALLOW; live+Trading ALLOW (if dual-class policy says so); live+TradingTestnet DENY; testnet+Trading DENY; testnet+TradingTestnet ALLOW |
| **Dependencies** | D-CONN-03-02 / D-CONN-03-04                                                                                                                                     |
| **Exclusions**   | Execution-adapter Nest provider wiring (CRED-03)                                                                                                                |
| **Acceptance**   | AC-07 parent CRED-02 satisfied on Connections-owned paths                                                                                                       |

### FIV-CONN-03-C — Legacy LIVE-class retrieve policy

| Field            | Content                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Objective**    | Define deterministic retrieve/revoke/validate behavior for `live` Connections vs legacy `Trading` and new `TradingLive` slots |
| **Likely files** | `connections.service.ts` helpers; handshake/capability if dual probe adopted                                                  |
| **Data/schema**  | NONE — no Vault purpose rewrite                                                                                               |
| **API**          | None public                                                                                                                   |
| **Security**     | Must not retrieve Testnet for live; must not invent cross-purpose fallback beyond LIVE-class allowlist frozen in Model C      |
| **Tests**        | Legacy `trading` secret + live Connection; new `trading_live` secret + live Connection; no silent Testnet                     |
| **Dependencies** | D-CONN-03-02 mandatory                                                                                                        |
| **Exclusions**   | Migrating Vault rows between purposes; backfill                                                                               |
| **Acceptance**   | Documented + tested LIVE-class policy; fail closed on ambiguity                                                               |

### FIV-CONN-03-D — Residual contract regression tests

| Field            | Content                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Objective**    | Lock residual CONN-03 security/contract properties without claiming full CONN-05 matrix |
| **Likely files** | `connections.service.spec.ts`, handshake/capability specs                               |
| **Data/schema**  | NONE                                                                                    |
| **API**          | N/A                                                                                     |
| **Security**     | Workspace isolation, env isolation, secret non-exposure regressions                     |
| **Tests**        | See §14                                                                                 |
| **Dependencies** | 03-A…C decisions frozen                                                                 |
| **Exclusions**   | Full CR-02-01…10 matrix (CONN-05); venue network tests                                  |
| **Acceptance**   | Residual ACs/SCs covered by automated tests                                             |

---

## 11. PO/Architecture Decisions Required

Frozen D-CRED-02-* decisions are **not** reopened. The following are **slice-local** decisions needed before implementation authorization.

### D-CONN-03-01 — Handshake/capability purpose strategy

| Field                      | Content                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Question**               | Wire purpose-aware retrieve into handshake/capability now, or interim deny EXCHANGE validate for `testnet` until FIV-CRED-04?                                                                                                                                                                                                                                                            |
| **Options**                | **A)** Purpose-aware retrieve in CONN-03 (preferred by Architecture C-06 / D-CRED-02-08). **B)** Interim deny-testnet-validate only (allowed only if Testnet cannot CONNECT via omit-purpose LIVE retrieve). **C)** Defer all handshake changes to FIV-CRED-04 (rejected unless fail-closed interim exists — would leave LIVE `trading_live` store vs `trading` retrieve inconsistency). |
| **Recommended (evidence)** | **A** — parent AC-15 + C-06 prefer purpose-aware retrieve in CRED-02 validate path; origins stay CRED-04                                                                                                                                                                                                                                                                                 |
| **Consequences**           | A closes C-06 hazard; B blocks Testnet connect until CRED-04; C unsafe without B                                                                                                                                                                                                                                                                                                         |
| **Security**               | Prevents Testnet Connection retrieving LIVE `trading` credentials                                                                                                                                                                                                                                                                                                                        |
| **Reversibility**          | High for request-field additions; interim deny is easily removed later                                                                                                                                                                                                                                                                                                                   |
| **PO approval mandatory**  | **YES**                                                                                                                                                                                                                                                                                                                                                                                  |

### D-CONN-03-02 — LIVE-class dual purpose on retrieve/validate

| Field                      | Content                                                                                                                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Question**               | For `environment=live`, may retrieve/validate accept legacy `Trading` and/or exact `TradingLive`, and in what order?                                                                                                               |
| **Options**                | **A)** Exact `TradingLive` only (matches current store). **B)** Prefer `TradingLive`, fallback to `Trading` if reference matches `vaultSecretId`. **C)** Probe both but require `vaultSecretId` exact match (no ambient fallback). |
| **Recommended (evidence)** | **C** (or B with id match) — Model C LIVE-class allowlist includes both; CONN-02 probe already lists both; must never fall back to Testnet                                                                                         |
| **Consequences**           | A breaks legacy omit-purpose-stored secrets after backfill-to-live; B/C preserve LIVE compatibility                                                                                                                                |
| **Security**               | Dual LIVE-class only; no cross-env                                                                                                                                                                                                 |
| **Reversibility**          | Medium                                                                                                                                                                                                                             |
| **PO approval mandatory**  | **YES**                                                                                                                                                                                                                            |

### D-CONN-03-03 — NULL-environment EXCHANGE validate policy

| Field                      | Content                                                                                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Question**               | Until FIV-CONN-04 backfill, how should EXCHANGE Connections with `environment IS NULL` behave on validate/handshake?                                                                                                 |
| **Options**                | **A)** Fail closed (reject validate). **B)** Allow omit-purpose legacy `trading` retrieve (preserves today’s NULL rows). **C)** Treat NULL as live for retrieve only (forbidden by PO-CRED-03 spirit / silent LIVE). |
| **Recommended (evidence)** | **B** short-term with explicit documentation that NULL ≠ LIVE identity, **or A** if PO prefers fail-closed during transition — **C rejected**                                                                        |
| **Consequences**           | A may break existing NULL credentialed rows until backfill; B preserves ops but keeps a documented transition exception                                                                                              |
| **Security**               | Must not treat NULL as Testnet; must not invent environment                                                                                                                                                          |
| **Reversibility**          | High until CONN-04                                                                                                                                                                                                   |
| **PO approval mandatory**  | **YES**                                                                                                                                                                                                              |

### D-CONN-03-04 — Mismatch check timing

| Field                      | Content                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| **Question**               | Where must Model C mismatch be enforced in CONN-03?                                        |
| **Options**                | **A)** store + replace + validate/retrieve paths. **B)** validate only. **C)** store only. |
| **Recommended (evidence)** | **A** — D-CRED-02-08 + parent AC-07                                                        |
| **Consequences**           | A is strongest; B/C leave windows                                                          |
| **Security**               | Prevents binding wrong-class secrets                                                       |
| **Reversibility**          | High                                                                                       |
| **PO approval mandatory**  | **YES**                                                                                    |

### D-CONN-03-05 — Public API surface for purpose

| Field                      | Content                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Question**               | Should purpose ever be client-supplied on Connections HTTP APIs?                                                                         |
| **Options**                | **A)** Never — derive from Connection.environment only (current Model C). **B)** Optional client purpose (rejected — tampering surface). |
| **Recommended (evidence)** | **A**                                                                                                                                    |
| **Consequences**           | Keeps Vault purpose SoT / Connection env constraint clean                                                                                |
| **Security**               | Prevents client purpose escalation                                                                                                       |
| **Reversibility**          | N/A if A                                                                                                                                 |
| **PO approval mandatory**  | **YES** (confirm; should be trivial affirm)                                                                                              |

---

## 12. Acceptance Criteria

| ID        | Criterion                                                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AC-01** | EXCHANGE validate → handshake Vault get/retrieve uses Connection-derived purpose policy (or interim deny-testnet-validate per D-CONN-03-01 Option B) |
| **AC-02** | EXCHANGE capability Vault get/retrieve uses the same purpose policy as handshake                                                                     |
| **AC-03** | Testnet Connection cannot retrieve omit-purpose / LIVE `trading` credentials during validate                                                         |
| **AC-04** | LIVE Connection cannot retrieve `trading_testnet` credentials during validate                                                                        |
| **AC-05** | Model C mismatch `tradingEnvironmentFromPurpose(purpose) !== connection.environment` FAIL CLOSED on Connections paths required by D-CONN-03-04       |
| **AC-06** | Purpose is never accepted from client HTTP input on Connections APIs                                                                                 |
| **AC-07** | NULL-env EXCHANGE validate behavior matches frozen D-CONN-03-03                                                                                      |
| **AC-08** | LIVE-class dual-purpose policy matches frozen D-CONN-03-02; no Testnet fallback                                                                      |
| **AC-09** | Workspace isolation preserved on handshake/capability retrieve                                                                                       |
| **AC-10** | No secret values in API responses, errors, logs, or tests beyond existing fixtures                                                                   |
| **AC-11** | No schema/migration changes in FIV-CONN-03 (unless PO expands — default NONE)                                                                        |
| **AC-12** | No Binance/Bybit/OKX production network calls required by implementation tests                                                                       |
| **AC-13** | C7 remains DENY-ALL; `allowRealVenueIo` remains false                                                                                                |
| **AC-14** | FIV-CONN-01/02 delivered behaviors remain intact (create-requires-env; Strategy B; coexistence)                                                      |
| **AC-15** | Scope limited to residual CONN-03; CONN-04/05/CRED-03/04/05 not implemented                                                                          |
| **AC-16** | Environment immutability preserved                                                                                                                   |
| **AC-17** | DEMO remains deferred                                                                                                                                |
| **AC-18** | Automated tests cover residual mismatch + purpose-aware validate paths                                                                               |

---

## 13. Security Criteria

| ID        | Criterion                                                                                    |
| --------- | -------------------------------------------------------------------------------------------- |
| **SC-01** | Workspace isolation: handshake/capability retrieve cannot cross workspaceId                  |
| **SC-02** | Environment isolation: no cross-env Vault purpose fallback                                   |
| **SC-03** | Exact-purpose Vault access on Connections-owned EXCHANGE validate path (unless interim deny) |
| **SC-04** | Fail-closed on Connection↔Vault environment class mismatch                                   |
| **SC-05** | No provider-only credential selection when environment is populated                          |
| **SC-06** | Secret non-exposure in metadata, errors, audit, docs                                         |
| **SC-07** | Endpoint allowlisting unchanged; no new egress hosts in CONN-03                              |
| **SC-08** | LIVE/Testnet separation preserved at credential purpose layer                                |
| **SC-09** | Authorization model unchanged (membership + role gates)                                      |
| **SC-10** | Concurrency: purpose wiring must not bypass Strategy B uniqueness                            |
| **SC-11** | C7 DENY-ALL / `allowRealVenueIo=false` unchanged                                             |
| **SC-12** | No Vault secret mutation/reclassification/copy as part of CONN-03                            |

---

## 14. Test Strategy

**Do not run external trading calls. Prefer fakes/mocks for handshake adapters.**

### Unit

- Purpose derivation helpers (`vaultPurposeForConnection` / mismatch assert)
- LIVE-class dual-purpose policy table
- NULL-env policy table

### Service

- Connections store/replace already purpose-aware — regression only
- Connections EXCHANGE validate passes purpose into handshake/capability (or deny path)
- Mismatch DENY cases

### Integration (in-process)

- Handshake service retrieves with expected purpose
- Capability service retrieves with expected purpose
- Workspace isolation on retrieve

### Migration

- **None** expected for CONN-03

### API

- Public create/validate HTTP still does not accept `purpose`
- Error responses contain no secrets

### UI

- **None** required for CONN-03 (CRED-05)

### Security regression (residual)

- Testnet store → validate must not hit `trading`
- LIVE store `trading_live` → validate must not hit `trading_testnet`
- Cross-workspace deny

### Concurrency

- Not primary CONN-03 focus; retain CONN-02 uniqueness regressions

**Coverage expectation:** qualitative completeness of AC-01…18 / SC-01…12 via focused specs — do not fabricate test counts.

---

## 15. Dependencies

| Dependency                         | Status      | Notes                                                |
| ---------------------------------- | ----------- | ---------------------------------------------------- |
| FIV-CRED-02 Planning Approval      | GRANTED     | Parent                                               |
| FIV-CONN-01                        | CLOSED      | Environment model                                    |
| FIV-CONN-02                        | CLOSED      | Uniqueness + min purpose pass-through                |
| D-CRED-02-01…14                    | FROZEN      | Not reopened                                         |
| D-CONN-03-01…05                    | **OPEN**    | Required before Slice Approval                       |
| FIV-CONN-04                        | NOT STARTED | Backfill after CONN-03                               |
| FIV-CONN-05                        | NOT STARTED | Full matrix after contract complete                  |
| FIV-CRED-04                        | NOT STARTED | Origins only; not a hard blocker if D-CONN-03-01 = A |
| ENV1 / EG1 / C7 / allowRealVenueIo | IN FORCE    | Must remain                                          |

---

## 16. Risks

| ID   | Description                                                                    | Likelihood           | Impact   | Mitigation                                 | Owner/gate  | Blocks implementation?         |
| ---- | ------------------------------------------------------------------------------ | -------------------- | -------- | ------------------------------------------ | ----------- | ------------------------------ |
| R-01 | LIVE `trading_live` store vs handshake `trading` retrieve breaks LIVE validate | High (latent now)    | High     | D-CONN-03-01 Option A + D-CONN-03-02       | Arch/PO     | **YES** until decided          |
| R-02 | Testnet store + omit-purpose LIVE retrieve confusion                           | High if Testnet used | Critical | Purpose-aware retrieve / interim deny      | Security/PO | **YES** for Testnet enablement |
| R-03 | Scope bleed into CRED-04 origins                                               | Medium               | High     | Hard exclusion; no adapter origin edits    | Arch        | No if held                     |
| R-04 | Scope bleed into CONN-04 backfill                                              | Medium               | Medium   | No migrations in CONN-03                   | PO          | No if held                     |
| R-05 | Dual LIVE-class retrieve weakens exact-purpose                                 | Medium               | High     | Id-matched LIVE-class only; never Testnet  | Security    | Conditional                    |
| R-06 | NULL-env validate policy breaks operators                                      | Medium               | Medium   | D-CONN-03-03 explicit; CONN-04 follows     | PO          | Conditional                    |
| R-07 | UI still hardcodes live → operators cannot create Testnet via UI               | High                 | Medium   | Accept API-first; CRED-05 later            | PO          | No for CONN-03                 |
| R-08 | Protected leftovers accidentally modified                                      | Low                  | High     | Stage only this artifact                   | Implementer | Process                        |
| R-09 | External I/O accidentally enabled in tests                                     | Low                  | Critical | Mock adapters; keep allowRealVenueIo false | Security    | Yes if violated                |
| R-10 | Rollback difficulty if public API changed                                      | Low                  | Medium   | Prefer internal request fields only        | Arch        | No if internal-only            |

Qualitative categories only — no fabricated probabilities.

---

## 17. Non-Goals

```text
FIV-CONN-01 work (already CLOSED) — do not re-implement
FIV-CONN-02 work (already CLOSED) — do not re-implement Strategy B
FIV-CONN-04 — LIVE backfill / audit / quarantine / EXCHANGE NOT NULL
FIV-CONN-05 — full CRED-02 security regression matrix CR-02-01…10
FIV-CRED-03 — Vault-backed live credential provider Nest wiring
FIV-CRED-04 — Binance environment-aware handshake origins / EG1 I/O
FIV-CRED-05 — API/UI Testnet operator flow beyond API-first contract
LIVE backfill
Duplicate cleanup
Production trading
Binance / Bybit / OKX production I/O
Real capital movement
FIV execution
C7 bypass / enablement
allowRealVenueIo changes
Vault redesign
SecretPurpose redesign
DEMO support
Unrelated refactors
Protected leftover cleanup
```

---

## 18. External I/O Boundary

```text
External trading I/O:   ZERO (planning and required for CONN-03 implementation tests)
Binance calls:          ZERO
Bybit calls:            ZERO
OKX calls:              ZERO
FIV:                    NOT PERFORMED
Capital movement:       ZERO
C7:                     DENY-ALL
allowRealVenueIo:       FALSE
```

Any future real handshake network call remains **implementation/FIV / CRED-04 / PRE-03** scope and is **not** authorized by this planning package. CONN-03 implementation, when later approved, must use mocked/faked adapters for tests.

---

## 19. FIV-PRE-01 Contribution

| Statement                        | Status                                                                                                                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FIV-PRE-01 requirement addressed | Connection-side Model C **validate-path** purpose safety for multi-env EXCHANGE Connections (residual after CONN-01/02)                                                                                              |
| Satisfies full FIV-PRE-01?       | **NO**                                                                                                                                                                                                               |
| Remains unresolved after CONN-03 | LIVE backfill (CONN-04); full security matrix (CONN-05); Vault-backed live provider (CRED-03); Testnet origin routing (CRED-04); UI Testnet flow (CRED-05); C7 (PRE-02); controlled Testnet I/O (PRE-03); FIV itself |
| FIV-CONN-04 must handle          | LIVE backfill, EXCHANGE NOT NULL, audit/quarantine, migration write serialization critical section                                                                                                                   |
| FIV-CONN-05 must handle          | Full CRED-02 security regression / isolation matrix before FIV-CRED-02 closure                                                                                                                                       |

```text
FIV-CONN-03 contributes a necessary but not sufficient
Connection API/domain contract completion toward FIV-PRE-01.
It does NOT close FIV-PRE-01.
It does NOT close FIV-CRED-02.
```

---

## 20. Implementation Readiness

```text
IMPLEMENTATION READINESS:
READY WITH CONDITIONS
```

**Conditions (non-exhaustive):**

1. Planning Review completes.
2. Architecture Review affirms residual scope vs parent one-liner refinement.
3. Security Review affirms D-CONN-03-01…05 directions.
4. PO Decision Freeze for D-CONN-03-01…05.
5. PO Planning Approval for FIV-CONN-03.
6. Slice Approval for implementation.

```text
This readiness verdict is NOT implementation authorization.
```

Even if later marked READY, implementation remains prohibited until the full gate chain above completes.

---

## 21. Explicit "No Implementation Performed" Statement

```text
Implementation:                 NOT PERFORMED
Schema changes:                 NONE
Migrations:                     NONE
Vault changes:                  NONE
Credential changes:             NONE
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
Next gate:                      FIV-CONN-03 PLANNING REVIEW
```

This artifact creates documentation only. No production code, tests, Prisma schema, migrations, Vault, credentials, SecretPurpose, C7, or venue I/O settings were modified by this planning task.

---

## Appendix A — Evidence map (planning reconnaissance)

| Concern             | Primary path                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Connection model    | `apps/api/prisma/schema.prisma`                                                                 |
| Connections service | `apps/api/src/modules/connections/connections.service.ts`                                       |
| Connections DTOs    | `apps/api/src/modules/connections/connections.dto.ts`                                           |
| Handshake           | `apps/api/src/modules/exchange-connectivity/exchange-handshake.service.ts`                      |
| Capability          | `apps/api/src/modules/exchange-connectivity/exchange-capability.service.ts`                     |
| Binance origin      | `apps/api/src/modules/exchange-connectivity/binance-handshake.adapter.ts`                       |
| Vault               | `apps/api/src/modules/secret-vault/secret-vault.service.ts`                                     |
| SecretPurpose       | `apps/api/src/modules/secret-vault/secret-purpose.ts`                                           |
| ENV1 maps           | `apps/api/src/modules/execution-adapter/live-venue-egress/trading-credential-environment.ts`    |
| UI                  | `apps/web/src/connections/ConnectionsPage.tsx`                                                  |
| CONN-01 migration   | `apps/api/prisma/migrations/20260917170000_v3_l02_fiv_conn_01_connection_environment/`          |
| CONN-02 migration   | `apps/api/prisma/migrations/20260917180000_v3_l02_fiv_conn_02_provider_environment_uniqueness/` |

---

**END OF FIV-CONN-03 PLANNING PACKAGE**
