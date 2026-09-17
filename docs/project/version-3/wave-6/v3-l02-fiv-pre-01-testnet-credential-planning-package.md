# V3-L02 FIV-PRE-01 — Binance Testnet Credential Architecture & Implementation Planning Package

**Document:** FIV-PRE-01 Testnet Credential Planning Package  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02  
**Prerequisite ID:** FIV-PRE-01 — Binance Testnet Credential Architecture  
**Nature:** Governance planning artifact only. **Not** implementation authorization. **Not** credential provisioning authorization. **Not** FIV authorization. **Not** C7 enablement. **Not** Testnet or production venue I/O authorization.  
**Authority:** Senior Architect + Security Analyst + Governance Planning Author (draft for Architecture / Security / PO review)  
**Repository baseline (planning start):** `7254c5d8029c9f5eae847383c4c08788550c037d` (`main`)

```text
PLANNING PACKAGE — NOT IMPLEMENTATION APPROVAL

This artifact does NOT authorize:
  - code / schema / Vault / UI / API behavior changes
  - credential provisioning
  - Binance API calls
  - FIV execution
  - C7 enablement
  - Testnet or production I/O
  - real capital movement
```

**Classification legend (statements):** FACT · INFERENCE · NOT VERIFIED · OPEN (decision required)

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## Relationship to FIV-PRE-02 and FIV-PRE-03

```text
FIV-PRE-01
credential architecture
        ↓
must be resolved first

FIV-PRE-02
scoped C7
        ↓
remains separate

FIV-PRE-03
controlled Testnet I/O
        ↓
remains separate
```

**FACT (governance):** Prior FIV infrastructure enablement package already ordered these prerequisites sequentially. Resolving FIV-PRE-01 does **not** authorize C7, venue I/O, FIV, or capital movement.

| Prerequisite | Scope of this package | Status after this package |
| ------------ | --------------------- | ------------------------- |
| FIV-PRE-01 | Architecture + operator path for `BINANCE + trading_testnet` | **PLANNING REQUIRED** (this artifact) |
| FIV-PRE-02 | Scoped temporary LiveCommand (C7) | **Out of scope** — remains open |
| FIV-PRE-03 | Controlled Testnet I/O enablement (`allowRealVenueIo` composition) | **Out of scope** — remains open |

---

## Current Verified Architecture

### Repository evidence map (mandatory reconnaissance)

| Area | Primary locations | Label |
| ---- | ----------------- | ----- |
| Vault service | `apps/api/src/modules/secret-vault/secret-vault.service.ts` | FACT |
| Purpose taxonomy | `apps/api/src/modules/secret-vault/secret-purpose.ts` | FACT |
| Encryption AAD | `apps/api/src/modules/secret-vault/secret-envelope.ts` (`workspaceId:type:purpose`) | FACT |
| Vault schema | `apps/api/prisma/schema.prisma` — `VaultSecret` `@@unique([workspaceId, type, purpose])` | FACT |
| Connections model | `ConnectionRecord` — no purpose/environment columns | FACT |
| Connections service | `apps/api/src/modules/connections/connections.service.ts` — `vault.store`/`replace` omit `purpose` | FACT |
| Connections DTOs | `apps/api/src/modules/connections/connections.dto.ts` — no purpose/environment fields | FACT |
| Connections UI | `apps/web/src/connections/ConnectionsPage.tsx` — no purpose/environment selectors | FACT |
| ENV1 taxonomy | `trading-credential-environment.ts` — `live` / `testnet` / `demo` | FACT |
| ENV1 binding | `live-credential-environment-policy.ts` — fail-closed workspace/venue/purpose/endpoint | FACT |
| EG1 Binance hosts | `live-venue-allowlist.ts` — live=`api.binance.com`, testnet=`testnet.binance.vision` | FACT |
| Live credential provider | `live-trading-credential.provider.ts` — resolve by `(workspaceId, type, purpose)` | FACT |
| Nest live composition | `execution-adapter.module.ts` — `allowRealVenueIo: false`; empty in-memory provider | FACT |
| Handshake | `binance-handshake.adapter.ts` — origin always `https://api.binance.com` | FACT |
| ENV1 / EG1 / ADP1 / ISO1 tests | `v3-l02-s-env1-*.spec.ts`, `v3-l02-s-eg1-*.spec.ts`, `v3-l02-s-adp1-*.spec.ts`, `v3-l02-s-iso1-*.spec.ts` | FACT |

### How is a Binance credential created?

**FACT:** Operator path is Connection Management:

1. Create `ConnectionRecord` metadata (`provider=BINANCE`, status `DISCONNECTED`, no `vaultSecretId`).
2. `storeCredentials` maps provider → Vault type `binance` via `vaultSecretTypeForProvider`.
3. Calls `SecretVaultService.store({ workspaceId, type: 'binance', fields })` **without** `purpose`.
4. Persists returned Vault metadata `id` into `ConnectionRecord.vaultSecretId`.

**FACT:** Direct Vault `store` with explicit `purpose` is supported by `SecretVaultService`, but Connections never passes it. No HTTP Vault customer API exposes store (Vault module is internal).

### How is it stored?

**FACT:** Ciphertext-only in `vault_secrets` under AES-256-GCM envelope; wrapping key from host env `VAULT_WRAPPING_KEY`; AAD binds `workspaceId:type:purpose`. Plaintext must not persist outside approved retrieve-in-memory flows.

### How is its purpose represented?

**FACT:** `VaultSecret.purpose` string; unique with `(workspaceId, type, purpose)`.

**FACT:** `SecretPurpose` already includes:

| Key | Wire value | ENV1 credential env |
| --- | ---------- | ------------------- |
| `Trading` | `trading` | `live` (legacy LIVE-class) |
| `TradingLive` | `trading_live` | `live` |
| `TradingTestnet` | `trading_testnet` | `testnet` |
| `TradingDemo` | `trading_demo` | `demo` |
| `Notification` / `Ai` | non-trading | n/a |

**FACT:** When `purpose` is omitted, `defaultPurposeForType('binance'|'bybit'|'okx')` returns `SecretPurpose.Trading` (`'trading'`).

### How is its workspace represented?

**FACT:** `VaultSecret.workspaceId` + ACL via `VaultAccessControl` (membership + `PermissionClass.VaultConnections`) + crypto AAD. Cross-workspace access fails closed (`VaultIsolationError`).

### How is a Connection associated with the credential?

**FACT:** Opaque nullable `ConnectionRecord.vaultSecretId` referencing Vault row `id`. Credentials never returned on Connection views (`credentialsStored` boolean only).

**FACT:** Connections enforce **one active vault-backed connection per `(workspaceId, provider)`** and also `vault.get` without purpose (default `trading` slot) before store — so the product path assumes a single default LIVE-class slot per exchange provider.

### How is environment selected?

| Path | Mechanism | Label |
| ---- | --------- | ----- |
| Live order / ADP1 | Order `liveTradingEnvironment` ∈ `{live, testnet, demo}` → `purposeForTradingEnvironment` → Vault purpose for resolve | FACT |
| ENV1 trust | Trusted env derived from Vault purpose via `tradingEnvironmentFromPurpose`; client claim cannot escalate | FACT |
| EG1 host class | `egressEnvironmentForCredential`: live→live hosts; testnet/demo→testnet host slot | FACT |
| Connections | **No** environment field or selector | FACT |
| Handshake / capability | Hardcoded production Binance origin | FACT |

**FACT — purpose mapping asymmetry:**

```text
purposeForTradingEnvironment('live')     → trading_live
purposeForTradingEnvironment('testnet')  → trading_testnet
purposeForTradingEnvironment('demo')     → trading_demo

Connections store (omit purpose)         → trading   (LIVE-class under ENV1 binding,
                                                       but DIFFERENT Vault slot than trading_live)
```

**INFERENCE:** Even for LIVE orders, engine-requested purpose `trading_live` does not automatically resolve a Connections-provisioned `trading` secret unless a bridge/provider maps legacy → live. Current Nest composition uses empty in-memory provider (not Vault-backed) — so this slot gap is latent for production Vault wiring, not exercised by default Nest live I/O (which remains disabled).

### How does Binance adapter select credentials?

**FACT:** `LiveVenueExecutionAdapter.prepareAuth` calls `LiveTradingCredentialProvider.resolve({ workspaceId, type, purpose, executionMode: 'live' })`, then `assertLiveCredentialEnvironmentBinding`.

**FACT:** Only in-repo implementation is `InMemoryLiveTradingCredentialProvider` (exact slot key `${workspaceId}::${type}::${purpose}`). Nest module does **not** inject a Vault-backed provider.

**FACT:** Nest ships `allowRealVenueIo: false` — real HTTP egress refused regardless of credentials.

### How does trading currently resolve?

**FACT (policy layer):** ENV1 fail-closed binding already distinguishes LIVE vs TESTNET vs DEMO from purpose and denies environment/venue/workspace mismatches before signing/HTTP.

**FACT (product path):** Connections always land exchange secrets in `trading` (LIVE-class).

**FACT (FIV verification context, prior artifact):** Observed Vault inventory for Binance: purpose `trading` present; purpose `trading_testnet` count = 0. Secrets not exposed in that verification. This planning scan did not re-query a live database — provisioned row presence remains **NOT VERIFIED** from this artifact alone; prior FIV report status is treated as governance input: **FIV-PRE-01 = NOT VERIFIED**.

### Why do Connections default to trading?

**FACT chain:**

1. `ConnectionRecord` has no purpose/environment column.
2. DTOs / UI have no purpose/environment fields.
3. `storeCredentials` / `replaceCredentials` omit `purpose`.
4. Vault `resolvePurpose(undefined)` → `defaultPurposeForType` → `trading` for Binance.
5. Slot availability checks also call `vault.get` without purpose → inspect only the default `trading` slot.

```text
Connections store no explicit purpose
        ↓
Vault defaults exchange types to purpose = trading
        ↓
ENV1 treats trading as LIVE-class
        ↓
No operator path creates binance + trading_testnet
```

---

## Root Cause of FIV-PRE-01

### Target that cannot be established without ambiguity today

```text
BINANCE + trading_testnet
        ↓
separate purpose/classification
        ↓
separate Vault credential binding
        ↓
explicit environment binding
        ↓
Binance Testnet only
```

### Actual root causes (repository-confirmed)

| Candidate | Present? | Role in FIV-PRE-01 |
| --------- | -------- | ------------------ |
| Missing `SecretPurpose` value `trading_testnet` | **No** — value exists | Not root cause |
| Missing environment-aware purpose taxonomy (ENV1) | **No** — ENV1 maps purpose↔env | Not root cause |
| Connections lacking purpose/environment fields | **Yes** | **Primary product-path root cause** |
| Connections defaulting to `trading` | **Yes** | **Primary product-path root cause** |
| Credential selector not environment-aware (Vault slot) | **Partial** — live provider interface is purpose-aware; Connections/handshake omit purpose | Contributor |
| Binance adapter accepting generic trading credentials for Testnet | **No for ENV1 policy** — mismatch fails closed when purpose is correct; **Yes for Connections handshake** — always production origin | Split: ADP1/ENV1 OK; handshake gap |
| Insufficient database representation for Vault purpose | **No** — purpose column + unique slot exist | Not root cause for Vault |
| Insufficient Connection DB representation | **Yes** — no env/purpose on Connection | Contributor (auditability / binding clarity) |
| Insufficient API/UI representation | **Yes** | **Primary operator root cause** |
| Insufficient Vault metadata model | **No** for purpose enum | Not root cause |
| Insufficient validation at Connections boundary | **Yes** — no env selection; handshake not env-aware | Contributor |
| Insufficient isolation tests for Connections→testnet path | **Yes** — ENV1/EG1/ADP1 cover policy with in-memory seeds; Connections path does not assert `trading_testnet` provisioning | Contributor |
| No provisioned `binance`+`trading_testnet` secret | **Yes (prior FIV verification)** | **Operational gap** — blocked after architecture/product path exists |
| Nest live path not Vault-backed / I/O disabled | **Yes** | Separate from FIV-PRE-01 architecture, but required later for FIV-PRE-03 composition |

### Root-cause summary

**FACT:** FIV-PRE-01 is **not** “invent `trading_testnet` in Vault taxonomy.” That taxonomy already exists (ENV1 / `SecretPurpose`).

**FACT:** FIV-PRE-01 **is** the inability of the operator-facing Connection/Vault product path to create, bind, validate, and resolve an unambiguous **`binance` + `trading_testnet`** credential for a workspace without:

- silently using LIVE-class `trading`;
- colliding with the single-provider Connections slot assumption;
- validating against production handshake hosts;
- or relying on non-product ad-hoc Vault store calls without an approved operator contract.

**INFERENCE:** Until Connections (or an explicitly authorized alternate ops path) can target `trading_testnet` without fallback to `trading`, provisioning remains either impossible via product UI/API or unsafe/ambiguous if done only via undocumented side paths.

---

## Critical safety requirement — preserve LIVE

```text
LIVE
BINANCE + trading  (and/or trading_live — see Q decisions)
        ↓
existing LIVE credential flow
        ↓
MUST REMAIN UNCHANGED by default

TESTNET
BINANCE + trading_testnet
        ↓
separate purpose/classification
        ↓
separate Vault credential binding
        ↓
explicit environment binding
        ↓
Binance Testnet only
```

### Mandatory isolation properties (proposed contract — not yet authorized)

| Property | Required behavior |
| -------- | ----------------- |
| Purpose mismatch | FAIL CLOSED |
| Environment mismatch | FAIL CLOSED |
| Workspace mismatch | FAIL CLOSED |
| Venue mismatch | FAIL CLOSED |
| Missing Testnet credential | FAIL CLOSED — **no** fallback to LIVE |
| Testnet credential → Production endpoint | DENY |
| Production/LIVE credential → Testnet path | DENY |
| Silent default `trading_testnet` → `trading` | **PROHIBITED** |
| Silent conversion of existing LIVE Connection/secret to Testnet | **PROHIBITED** |

**FACT:** ENV1 already enforces purpose↔endpoint binding when trusted purpose is supplied correctly. The planning gap is ensuring product paths never supply the wrong purpose or omit purpose such that LIVE is used unintentionally for Testnet work (or vice versa).

---

## Target credential model (conceptual — not implemented)

### Dimensions that must align for resolution

Based on repository architecture, a trading credential should resolve only when **all** match:

```text
workspace
  + venue (Vault type ↔ LiveVenueId)
  + purpose (Vault SecretPurpose; ENV1 trusted source)
  + endpoint/credential environment (derived from purpose; must equal server-selected env)
  + Connection binding (opaque vaultSecretId; optional explicit env metadata — OPEN)
```

### Alternative models compared

#### Model M1 — Purpose encodes environment (status quo ENV1)

```text
purpose = trading_testnet
environment = derived(testnet)
```

| Pros | Cons |
| ---- | ---- |
| Already implemented in ENV1/EG1/ADP1 | Legacy `trading` vs `trading_live` dual LIVE slots |
| Vault unique slot already separates envs | Connections do not expose purpose |
| Crypto AAD already binds purpose | Operator must not select raw purpose unsafely |

#### Model M2 — Independent purpose + environment

```text
purpose = trading
environment = trading_testnet   (persisted separately)
```

| Pros | Cons |
| ---- | ---- |
| Separates “capability” from “env” conceptually | **Conflicts with ENV1 trusted-source design** (env derived from purpose) |
| | Requires schema + policy rewrite; dual sources of truth risk |

#### Model M3 — Explicit CredentialClass / capability object

```text
CredentialClass { venue, environment, capability }
```

| Pros | Cons |
| ---- | ---- |
| Strongest long-term taxonomy | Highest migration/API complexity |
| Clear audit surface | Overkill if ENV1 purpose slots already suffice |

### Planning recommendation direction (NOT a silent decision)

**INFERENCE (technical fit):** Repository evidence favors **M1** — keep ENV1 purpose-as-trusted-environment, and close FIV-PRE-01 by making the **Connections/operator path purpose/environment-aware** while preserving legacy `trading` LIVE behavior.

**OPEN:** Whether new LIVE credentials should be stored as `trading_live` vs remaining `trading`, and whether a read-time alias bridge is allowed (must be explicit if approved).

**UI guidance (proposal):** Operator selects **Venue + Environment** (e.g. BINANCE + TESTNET). Backend derives/validates `SecretPurpose.TradingTestnet`. UI should **not** expose raw `SecretPurpose` enum as a free-form operator control unless Architecture/Security explicitly approve it.

---

## Architecture Options

### Option A — Use existing `SecretPurpose.TradingTestnet` + extend Connections

Introduce explicit environment (or derived purpose) on the Connections create/store path so Vault `store`/`replace`/`get`/`retrieve`/`revoke` receive `purpose: 'trading_testnet'` for Testnet, while default/LIVE path continues to use `trading` (or later `trading_live` if separately approved).

### Option B — Persist independent Connection.environment + keep purpose=trading

Add Connection `environment` column; keep Vault purpose as generic `trading`; teach ENV1 to trust Connection.environment.

### Option C — CredentialClass / capability model

New classification entity spanning venue + environment + capability; Connections and live provider resolve via CredentialClass id.

### Evaluation matrix (technical trade-offs only — no political ranking)

| Criterion | Option A | Option B | Option C |
| --------- | -------- | -------- | -------- |
| LIVE isolation | Strong if no fallback and LIVE defaults unchanged; must not rewrite existing `trading` rows | Weakened: env on Connection can diverge from Vault purpose → dual trust sources | Strong if class immutable and fail-closed |
| Testnet isolation | Strong: distinct Vault slot `trading_testnet`; ENV1 already maps | Depends on rewriting ENV1 trust rules | Strong if class encodes env |
| Workspace isolation | Unchanged (already workspace-scoped) | Unchanged | Unchanged if class is workspace-scoped |
| Vault compatibility | **Highest** — purpose enum + unique slot + AAD already support `trading_testnet` | Requires ENV1 redesign; purpose becomes less meaningful for trading | Requires new mapping layer onto Vault slots |
| Connections compatibility | Requires API/UI/slot-policy changes; one-provider assumption must become per-(provider, env) | Schema + DTO + UI; still fight Vault purpose defaults | Largest Connections redesign |
| Migration complexity | Low–medium: no Vault enum migration; Connection slot rules + optional metadata | Medium–high: ENV1 rewrite + backfill semantics | High |
| API/UI complexity | Medium: Venue+Environment selector; backend derives purpose | Medium: Environment field; purpose hidden but semantic conflict | High |
| Security | Aligns with existing ENV1 fail-closed; handshake must become env-aware | Risk of Connection.environment vs Vault.purpose disagreement | Good if single source of truth enforced |
| Fail-closed behavior | Reuses ENV1 | Must re-prove fail-closed after trust-source change | Must re-prove end-to-end |
| Auditability | Purpose in Vault + optional Connection env label | Connection env auditable but Vault purpose may mislead | Explicit class events |
| Backward compatibility | Best for existing `trading` LIVE secrets if left untouched | Risk of silent reinterpretation if defaults change | Requires mapping legacy secrets |
| Testing burden | Extend Connections + handshake + regression; ENV1 mostly reuse | Rebuild ENV1 tests + Connections | New suite across layers |
| Risk of credential confusion | Medium if LIVE `trading` vs `trading_live` unresolved; low for Testnet vs LIVE if no fallback | High (two sources of env truth) | Lower long-term; high during transition |

**FACT:** Option A uniquely matches already-shipped ENV1/SecretPurpose design. Options B and C imply larger safety re-proof.

---

## Mandatory decision questions

### Q1 — Should `trading_testnet` be a new `SecretPurpose`?

**FACT:** It already is (`SecretPurpose.TradingTestnet = 'trading_testnet'`).

**Decision required:** Confirm that FIV-PRE-01 **reuses** this existing purpose rather than inventing a parallel classification (Option B/C).

**Escalation if rejected:** Must specify replacement taxonomy and ENV1 rewrite authorization.

### Q2 — Should environment be independently persisted on the Connection?

**OPEN.**

| Choice | Implication |
| ------ | ----------- |
| Yes (denormalized label) | Improves operator audit UI; must remain **consistent** with Vault purpose; Vault purpose remains trusted for ENV1 |
| No | Connection continues as opaque vault id holder; environment only via Vault purpose lookup |

**Security default proposal for review:** If persisted, treat as **non-authoritative display/constraint hint**; authoritative env remains Vault purpose (ENV1). Mismatch → FAIL CLOSED.

### Q3 — Should Connection creation/store require explicit environment/purpose rather than defaulting to `trading`?

**OPEN — security-sensitive.**

| Choice | Implication |
| ------ | ----------- |
| Require explicit environment for **new** exchange credential stores | Prevents accidental LIVE-class default for Testnet work; may break UX that relied on implicit LIVE |
| Keep default `trading` for unspecified LIVE, require explicit `testnet` | Preserves backward UX; Testnet cannot be silent |

**Security default proposal for review:** **No silent Testnet.** Default may remain LIVE-class `trading` **only** if product clearly labels the control as LIVE; Testnet must be an explicit operator selection. Prefer failing closed when environment is omitted on APIs that claim multi-env support.

### Q4 — Can an existing LIVE Connection be reused for Testnet?

**Security default examined:** **NO.**

**Rationale (FACT + inference):**

- LIVE Connection’s `vaultSecretId` points at a LIVE-class Vault slot (`trading`).
- Reusing it for Testnet would either misuse LIVE keys against Testnet hosts or require replacing ciphertext in-place — both confuse audit trails and violate env isolation.
- Connections currently allow only one vault-backed secret per provider, which **encourages** unsafe reuse unless the model becomes per-(provider, environment).

**Decision required:** Confirm prohibition of LIVE Connection reuse for Testnet; require a **separate** Connection (and Vault slot) for Testnet.

### Q5 — Can a Testnet credential ever be used by a LIVE execution path?

**Expected safety property:** **NO**

**FACT:** ENV1 denies purpose `trading_testnet` against live endpoint class (`environment_mismatch`).

**Decision required:** Affirm no authorized exception mechanism for FIV-PRE-01 scope.

### Q6 — Can a LIVE credential ever be selected by a Testnet execution path?

**Expected safety property:** **NO**

**FACT:** ENV1 denies `trading` / `trading_live` against testnet endpoint class.

**Decision required:** Affirm no fallback from missing Testnet secret to LIVE secret.

### Q7 — What happens to existing Connections after the model changes?

**Analysis constraints (do not invent silent migration):**

| Existing artifact | Required preservation |
| ----------------- | --------------------- |
| Existing workspaces | Unchanged membership/isolation |
| Existing LIVE credentials (`purpose=trading`) | Remain LIVE-class; **no** conversion to `trading_testnet` |
| Existing Connections | Remain bound to existing `vaultSecretId`; remain LIVE-class under current purpose |
| Backward compatibility | LIVE path must keep working without mandatory operator re-entry of secrets |
| Migration/default behavior | **OPEN** — any backfill must be explicit and non-destructive |

**PROHIBITED migration behavior:** Silent conversion of LIVE credentials/Connections into Testnet.

**OPEN:** Whether to introduce a parallel Testnet Connection beside an existing LIVE Connection for the same provider (recommended direction for review), including unique-constraint / slot-policy changes.

---

## Migration analysis (planning only — no migration files)

### Likely schema impacts (if Option A + per-env Connections)

| Change | Need? | Notes |
| ------ | ----- | ----- |
| New Vault purpose enum in DB | **No** | Purpose is `String`; `trading_testnet` already valid |
| `ConnectionRecord.environment` or `credentialPurpose` column | **Optional** | For operator clarity / constraints; not required for Vault uniqueness |
| Unique constraints | **Likely** | Today: one vault-backed connection per provider; must become per provider+environment (or equivalent) without breaking existing LIVE rows |
| Nullable new columns | If added, null means “legacy LIVE / unspecified” — **must not** mean Testnet | OPEN semantics |
| Backfill | Existing rows → LIVE-class only if any label added; **never** Testnet | Mandatory rule |
| Rollback | Removing optional Connection env label should leave Vault slots intact | Prefer additive migrations |
| Data integrity | Preserve `(workspaceId, type, purpose)` uniqueness; forbid cross-env `vaultSecretId` reuse | |
| Workspace isolation | Unchanged constraints | |

### Explicit non-recommendation

Do **not** recommend a migration that:

- rewrites `purpose` from `trading` → `trading_testnet`;
- points existing LIVE Connections at Testnet secrets;
- collapses LIVE and Testnet into one Connection.

---

## UI/API analysis

### What is missing for operator selection of BINANCE + TESTNET (without exposing secrets)

| Layer | Current | Gap |
| ----- | ------- | --- |
| API DTOs | `CreateConnectionMetadataDto`, `StoreConnectionCredentialsDto` — no env/purpose | Need explicit environment (or equivalent) on create and/or store |
| Validation | Provider + credential field shapes only | Need allowlist env validation; reject unknown env; no silent default to Testnet |
| Connection endpoints | CRUD/validate/handshake without env | Need env-aware store/get/revoke/handshake |
| Frontend forms | Provider + displayName + credential fields | Need Environment selector (LIVE / TESTNET [/ DEMO where supported]) |
| Purpose selectors | None | Prefer **not** raw SecretPurpose picker |
| Secret exposure | Credentials write-only; views omit secrets | **Must remain** |

### Proposed operator model (for decision — not authorized)

```text
Operator selects: Venue (BINANCE) + Environment (TESTNET)
        ↓
Backend derives: type=binance, purpose=trading_testnet
        ↓
Vault store into distinct slot
        ↓
Connection binds vaultSecretId
        ↓
Validate against Testnet handshake origin (future) — NOT production
        ↓
Secrets never returned
```

**OPEN:** Whether DEMO appears for Binance (FACT: ENV1 marks Binance/Bybit + `demo` as `unsupported_venue_environment`).

---

## Vault binding requirements (target security contract)

A credential is resolvable for live trading use only when:

```text
workspace match
  AND vault type ↔ venue match
  AND purpose match (exact slot; no fallback)
  AND tradingEnvironmentFromPurpose(purpose) == server-selected endpoint environment
  AND EG1 allowlist origin for that environment
  AND execution mode permits trading retrieve (not paper/mock)
```

### Fail-closed — no fallbacks

| Prohibited fallback | Status |
| ------------------- | ------ |
| `trading_testnet` → `trading` | PROHIBITED |
| missing Testnet credential → LIVE credential | PROHIBITED |
| environment mismatch → nearest credential | PROHIBITED |
| omit purpose → accidental Testnet | PROHIBITED |
| omit purpose → silent LIVE when caller requested Testnet | PROHIBITED |

**FACT:** Crypto AAD already includes purpose — retrieving with wrong purpose fails unwrap even if ciphertext bytes were somehow confused.

---

## Binance endpoint isolation

### Current boundaries (FACT)

| Boundary | LIVE | TESTNET |
| -------- | ---- | ------- |
| EG1 allowlist | `api.binance.com` | `testnet.binance.vision` |
| ENV1 | `trading` / `trading_live` → live | `trading_testnet` → testnet |
| ADP1 signer | Signs query; host from EG1 origin | Same |
| Handshake / capability | **Always** `https://api.binance.com` | **Not implemented** |
| Market-data REST defaults | Production bases | Not ENV1 trading path |

### Future enforcement points (identify only — do not change now)

1. `purposeForTradingEnvironment` / Vault resolve slot  
2. `assertLiveCredentialEnvironmentBinding`  
3. `liveVenueOrigin` / `assertLiveVenueEgress` / DNS-pinned HTTP client  
4. Connections handshake/capability adapters (must become environment-aware)  
5. Any future Vault-backed `LiveTradingCredentialProvider` composition  
6. API/UI environment selection validation  

### Required future guarantees

```text
trading_testnet  →  Binance Testnet endpoint only
trading_live / trading  →  Binance Production endpoint only
```

Cross-binding DENY unless a **separate** explicitly approved mechanism exists (none proposed here; default **NO**).

---

## Required Security and Regression Tests

### Positive

- Binance Testnet credential resolves for `trading_testnet` (exact slot).
- Correct workspace resolves correct credential.
- Correct environment resolves correct credential / EG1 Testnet origin.
- Operator store with explicit TESTNET creates `purpose=trading_testnet` (not `trading`).
- LIVE store path still creates/retains LIVE-class purpose behavior as approved.

### Negative

- Testnet credential cannot resolve for LIVE endpoint/purpose.
- LIVE credential cannot resolve for Testnet.
- Workspace A cannot resolve workspace B credential.
- Wrong purpose fails; wrong environment fails.
- Missing Testnet credential fails (no LIVE fallback).
- Malformed environment fails; unknown purpose fails.
- No silent fallback occurs when purpose omitted on a Testnet-intent API.

### Production safety

- Testnet path cannot select production endpoint.
- Testnet path cannot use production/LIVE credential.
- LIVE path cannot silently select Testnet credential.
- Handshake for Testnet Connection does not call `api.binance.com`.

### Secret safety

- Secret never returned to frontend.
- Secret never logged.
- Secret never persisted outside approved Vault flow.
- Secret never appears in error messages (fixed deny codes / redaction).

### Backward compatibility

- Existing LIVE credentials remain functional under approved LIVE purpose semantics.
- Existing LIVE Connections remain LIVE.
- No automatic conversion to Testnet.
- Regression: ENV1/EG1/ADP1/ISO1 suites remain green.

### Suggested ownership by slice

Map tests to FIV-CRED-01…06 below; prefer deterministic policy tests with zero network, plus Connections service tests with Vault fakes.

---

## Proposed Implementation Slices

> Proposals only. **Not authorized.** Ordering assumes Architecture/Security/PO approval of Option A-leaning model unless decisions select otherwise.

### FIV-CRED-01 — Credential model clarification

| Field | Content |
| ----- | ------- |
| Objective | Freeze purpose/environment representation for LIVE vs TESTNET; document legacy `trading` vs `trading_live` policy |
| Scope | Docs + possibly pure helper clarifications only if separately authorized; no provisioning |
| Expected files | `secret-purpose.ts`, `trading-credential-environment.ts`, governance docs |
| Data model | Prefer no Prisma change |
| API/UI | None |
| Security | Confirm fail-closed mapping; no alias fallback unless explicitly approved |
| Tests | Unit tests for purpose↔env bijection / legacy LIVE rules |
| Prohibited | Provisioning; C7; I/O; rewriting existing secrets |
| Acceptance | Written decision on Q1–Q7 model; tests assert no LIVE↔TESTNET alias |
| Governance gate | Architecture + Security review of model |

### FIV-CRED-02 — Connection binding (environment-aware)

| Field | Content |
| ----- | ------- |
| Objective | Explicit environment-aware Connection create/store/replace/revoke; per-(provider, env) slot policy |
| Scope | Connections service/DTO/schema-as-approved; preserve LIVE defaults |
| Expected files | `connections.service.ts`, `connections.dto.ts`, Prisma `ConnectionRecord` if approved, lifecycle |
| Data model | Optional env/purpose label; unique slot policy change |
| API | Environment required or explicitly defaulted per approved Q3 |
| UI | Deferred to FIV-CRED-05 or thin API-first |
| Security | No LIVE→Testnet reuse; no secret in responses |
| Tests | Store TESTNET → `trading_testnet`; LIVE unchanged; conflict rules |
| Prohibited | Handshake production calls in unit tests; real keys; C7 |
| Acceptance | Can create distinct LIVE and TESTNET Binance Connections in one workspace |
| Governance gate | PO + Architecture on Q2–Q4 + migration |

### FIV-CRED-03 — Vault selector / live credential provider

| Field | Content |
| ----- | ------- |
| Objective | Strict resolve by workspace+type+purpose; Vault-backed provider if composition requires |
| Scope | `LiveTradingCredentialProvider` implementation; wiring decision separate from FIV-PRE-03 I/O flag |
| Expected files | new Vault-backed provider; composition module (careful) |
| Data model | None beyond existing Vault slots |
| API | None customer-facing |
| UI | None |
| Security | Exact slot; no fallback; paper/mock deny retrieve |
| Tests | Isolation + missing slot + wrong purpose |
| Prohibited | Enabling `allowRealVenueIo`; C7 grants |
| Acceptance | Resolve returns Testnet only for `trading_testnet` |
| Governance gate | Security review of composition |

### FIV-CRED-04 — Binance environment isolation (handshake + egress consistency)

| Field | Content |
| ----- | ------- |
| Objective | Testnet Connection validation uses Testnet origin; LIVE remains production origin; align with EG1 |
| Scope | `binance-handshake.adapter.ts`, capability adapter, related services |
| Expected files | exchange-connectivity Binance adapters |
| Data model | None |
| API | Validate path becomes env-aware |
| UI | None beyond status |
| Security | Prevent Testnet keys validated only against production (false confidence / key misuse risk) |
| Tests | Origin selection unit tests; deny cross-env |
| Prohibited | Real Binance calls in CI unless separately authorized harness; production I/O |
| Acceptance | TESTNET validate → `testnet.binance.vision`; LIVE → `api.binance.com` |
| Governance gate | Security review |

### FIV-CRED-05 — API/UI operator flow

| Field | Content |
| ----- | ------- |
| Objective | Operator selects BINANCE + TESTNET without secret exposure or raw purpose enum |
| Scope | Web Connections forms + API client types |
| Expected files | `ConnectionsPage.tsx` / view components; shared API types |
| Data model | None beyond CRED-02 |
| API | Consume env-aware DTOs |
| UI | Environment selector; clear LIVE vs TESTNET labeling |
| Security | Write-only credentials; no secret echo |
| Tests | Component/service tests for env selection wiring |
| Prohibited | Displaying secrets; enabling trading buttons/C7 |
| Acceptance | Operator can provision Testnet Connection metadata+credentials via UI |
| Governance gate | PO UX + Security |

### FIV-CRED-06 — Security regression suite

| Field | Content |
| ----- | ------- |
| Objective | Cross-environment and cross-workspace isolation proof for the new path |
| Scope | Extend ENV1/EG1/ADP1/ISO1 + Connections specs |
| Expected files | `*.spec.ts` under secret-vault, connections, live-venue-egress, platform-conformance |
| Data model | None |
| API/UI | None |
| Security | Encode all negative cases from § Required Security and Regression Tests |
| Tests | This slice *is* the suite |
| Prohibited | Networked FIV; real capital; live keys in fixtures |
| Acceptance | Documented matrix green; no secret material in snapshots |
| Governance gate | Security sign-off |

### Suggested dependency order

```text
FIV-CRED-01 (model freeze)
    → FIV-CRED-02 (Connections binding)
        → FIV-CRED-03 (selector) + FIV-CRED-04 (handshake isolation)  [parallelizable after 02]
            → FIV-CRED-05 (UI)
                → FIV-CRED-06 (regression close)
                    → (later, separate) FIV-PRE-02 / FIV-PRE-03
```

---

## Non-Scope

This planning package must **NOT** include or authorize:

- C7 implementation or authorization (FIV-PRE-02)
- FIV execution
- Binance API calls (including Testnet) as part of this planning commit
- Order submission / cancellation
- Production trading / Testnet trading
- Real capital movement
- Live credential rotation ceremonies
- EmergencyManager changes
- LTE changes
- S04 modification
- HumanStartProof modification
- EG1 modification (beyond identifying enforcement boundaries)
- Execution adapter redesign beyond credential/environment binding requirements
- Enabling `allowRealVenueIo` (FIV-PRE-03)
- Vault host wrapping-key changes
- Secret value creation, display, or transport in docs

---

## PO / Architecture / Security Decisions Required

Before any implementation authorization:

1. **Target credential model** — confirm M1 (purpose encodes env) vs B/C alternatives.  
2. **`trading_testnet` representation** — confirm reuse of existing `SecretPurpose.TradingTestnet`.  
3. **Connection environment representation** — Q2 (persist label vs Vault-only).  
4. **LIVE/Testnet isolation contract** — affirm Q4–Q6 (**NO** cross-use; **NO** fallback).  
5. **Migration/backfill strategy** — additive only; existing LIVE remains LIVE; no silent conversion.  
6. **API/UI operator model** — Venue+Environment selection; no raw purpose picker unless approved.  
7. **Vault resolution contract** — exact `(workspace, type, purpose)`; fail-closed.  
8. **Required implementation slices** — accept/reorder/reject FIV-CRED-01…06.  
9. **Security test requirements** — accept § Required Security and Regression Tests as exit criteria.  
10. **Legacy LIVE slot policy** — resolve `trading` vs `trading_live` for engine resolve vs Connections store (**OPEN**, high importance).  
11. **Handshake environment binding** — require Testnet handshake origin change before claiming operator Testnet “validated.”  

Do **not** treat recommendations in this document as approved decisions.

---

## Governance status

```text
FIV-PRE-01 = PLANNING REQUIRED
Implementation = NOT AUTHORIZED
Credential provisioning = NOT AUTHORIZED BY THIS ARTIFACT
Binance API calls = PROHIBITED
FIV execution = NOT AUTHORIZED
C7 = NOT AUTHORIZED
Testnet I/O = NOT AUTHORIZED
Production I/O = PROHIBITED
Real capital = PROHIBITED
```

### Next gate

```text
Planning Package
        → Architecture Review
        → Security Review
        → PO / Governance Decision
        → Implementation Authorization
```

### Explicit non-claims

This artifact does **not** claim:

- FIV READY / FIV PASS / FIV COMPLETE  
- implementation authorized  
- Testnet I/O authorized  
- production I/O authorized  
- credential provisioning completed  

---

## Appendix A — Evidence citations (selected)

```13:20:apps/api/src/modules/secret-vault/secret-purpose.ts
export const SecretPurpose = {
  Trading: 'trading',
  TradingLive: 'trading_live',
  TradingTestnet: 'trading_testnet',
  TradingDemo: 'trading_demo',
  Notification: 'notification',
  Ai: 'ai',
} as const;
```

```30:38:apps/api/src/modules/secret-vault/secret-purpose.ts
// Legacy default remains LIVE-class (ENV1 maps `trading` → live).
return SecretPurpose.Trading;
```

```175:181:apps/api/src/modules/connections/connections.service.ts
const stored = await this.vault.store({
  // ...
  type: vaultSecretTypeForProvider(connection.provider as ConnectionProvider),
  fields: input.credentials,
});
```

```44:49:apps/api/src/modules/execution-adapter/live-venue-egress/trading-credential-environment.ts
export function purposeForTradingEnvironment(
  environment: TradingCredentialEnvironment,
): SecretPurposeType {
  if (environment === 'testnet') return SecretPurpose.TradingTestnet;
  if (environment === 'demo') return SecretPurpose.TradingDemo;
  return SecretPurpose.TradingLive;
}
```

```27:30:apps/api/src/modules/execution-adapter/live-venue-egress/live-venue-allowlist.ts
BINANCE: Object.freeze({
  live: Object.freeze(['api.binance.com']),
  testnet: Object.freeze(['testnet.binance.vision']),
}),
```

---

## Appendix B — Planning execution record

| Item | Value |
| ---- | ----- |
| Artifact path | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-testnet-credential-planning-package.md` |
| Code implementation in this change | **None** |
| Schema / migrations | **None** |
| Vault config changes | **None** |
| Credentials modified | **None** |
| Secrets exposed | **None** |
| Binance API calls | **None** |
| FIV executed | **None** |
| Capital moved | **None** |
| Protected leftovers touched | **None** |
