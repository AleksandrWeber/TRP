# V3-L02 FIV-CRED-01 — Credential Model Planning Package

**Document:** FIV-CRED-01 Credential Model Planning Package
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02
**Prerequisite:** FIV-PRE-01 — Binance Testnet Credential Architecture
**Authority:** Senior Backend Architect + Security Engineer + Governance Planning Author
**Nature:** **PLANNING ONLY.** Does **not** authorize implementation by itself. Does **not** close FIV-PRE-01. Does **not** authorize C7, Testnet I/O, FIV, credential provisioning, schema/API/UI/Connections/handshake changes, or `allowRealVenueIo=true`.

**Governance chain:**

```text
FIV-PRE-01 Planning
        → Architecture Review
        → Security Review
        → PO/Governance Decision Freeze
        → Implementation Authorization (package-level)
        → FIV-CRED-01 Slice Planning   ← THIS ARTIFACT
        → Planning Review
        → Slice Approval
        → Implementation (if required)
```

**Basis artifacts:**

| Artifact | Path | Status |
| -------- | ---- | ------ |
| FIV-PRE-01 Planning | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-testnet-credential-planning-package.md` | Complete |
| Architecture Review | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-architecture-review.md` | PASS WITH CONDITIONS |
| Security Review | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-security-review.md` | PASS WITH CONDITIONS |
| PO Decision Freeze | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-po-governance-decision-freeze.md` | APPROVED WITH CONDITIONS |
| Implementation Authorization | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-implementation-authorization.md` | GRANTED (package; per-slice gates remain) |

**Repository baseline (planning start):** `a617940a62e1d84cd66e9b9c8a3d5c205bb734d9`

```text
FIV-CRED-01 PLANNING COMPLETE
Implementation NOT YET AUTHORIZED BY THIS PLANNING ARTIFACT
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Objective

Determine the **smallest safe implementation boundary** for:

```text
FIV-CRED-01 — Credential Model
```

Approved carry-forward decisions (already frozen; not re-litigated here):

| Decision | Content |
| -------- | ------- |
| **PO-CRED-01** | Reuse existing `SecretPurpose.TradingTestnet` — no second Testnet purpose |
| **PO-CRED-02** | Asymmetric Model C — Vault purpose = runtime credential/environment SoT; `Connection.environment` = persisted store/audit constraint |
| **PO-CRED-06** | No cross-environment / provider-only fallback |
| **PO-CRED-07** | Existing LIVE data remains LIVE |
| **PO-CRED-08** | Mandatory security regression |
| **PO-CRED-09** | EG1/SSRF remains mandatory |

FIV-CRED-01 defines **only the credential-side half** of Model C. It does **not** implement `Connection.environment`.

---

## 2. Case classification (A / B / C)

### Verdict

```text
PRIMARY: Case A
WITH: residual verification / regression-test gaps (not schema gaps)
SECONDARY observation: omit-purpose LIVE default exists (Case C-adjacent product risk — owned by later slices, not FIV-CRED-01 code fix)
```

| Case | Meaning | Applies? |
| ---- | ------- | -------- |
| **A** | `SecretPurpose.TradingTestnet` exists and is fully supported by credential/Vault model | **YES** for taxonomy, persistence, exact-slot lookup, ENV1 mapping, encryption binding |
| **B** | Purpose exists but credential model does not fully support it | **NO** for Vault core; deferred product wiring gaps belong to FIV-CRED-02…05 |
| **C** | Unsafe fallback/default inside credential layer | **Partial observation only:** omitted `purpose` defaults to `SecretPurpose.Trading` (LIVE-class). This is **not** `TradingTestnet → Trading` remapping when purpose is explicit. Product callers that omit purpose (Connections/handshake today) cannot store/resolve Testnet — that is a later-slice binding gap, not a Vault cross-purpose fallback |

### Schema / enum change required?

```text
NO SCHEMA CHANGE REQUIRED
NO SecretPurpose ENUM CHANGE REQUIRED
NO Prisma migration REQUIRED for FIV-CRED-01
```

**FACT:** Prisma `VaultSecret.purpose` is `String` with unique `(workspaceId, type, purpose)`. Application const `SecretPurpose.TradingTestnet = 'trading_testnet'` is already accepted by `isSecretPurpose` and persisted as that string.

### Code change required?

```text
LIKELY: NO CODE CHANGE REQUIRED for the credential model itself
REQUIRED IF IMPLEMENTATION APPROVED: verification / security regression tests at Vault + purpose/ENV1 boundary
```

Do **not** force a production code change merely because the slice ID exists.

---

## 3. SecretPurpose reconnaissance

### Definition (FACT)

**Path:** `apps/api/src/modules/secret-vault/secret-purpose.ts`

```text
SecretPurpose.Trading        = 'trading'          // legacy LIVE-class
SecretPurpose.TradingLive    = 'trading_live'     // explicit LIVE
SecretPurpose.TradingTestnet = 'trading_testnet'  // TESTNET
SecretPurpose.TradingDemo    = 'trading_demo'     // OKX demo
SecretPurpose.Notification   = 'notification'
SecretPurpose.Ai             = 'ai'
```

### Presence matrix

| Surface | `TradingTestnet` present? | Evidence class |
| ------- | ------------------------- | -------------- |
| Application const/type | **YES** | FACT |
| `isSecretPurpose` / `isTradingSecretPurpose` | **YES** | FACT |
| `defaultPurposeForType(binance\|bybit\|okx)` | Returns `Trading` (**not** Testnet) | FACT |
| Prisma enum | **N/A** — purpose is free-form `String` | FACT |
| Vault persist / unique slot | Supported via string purpose column | FACT |
| ENV1 `tradingEnvironmentFromPurpose` | Maps → `'testnet'` | FACT |
| ENV1 `purposeForTradingEnvironment('testnet')` | Maps → `TradingTestnet` | FACT |
| Connections store/retrieve | **Does not pass purpose** → defaults to `Trading` | FACT |
| Vault service specs | Default Binance store asserts `purpose === Trading`; **no dedicated TradingTestnet store/retrieve suite** | FACT |
| ADP1 / ENV1 / ISO1 specs | Use `TradingTestnet` in policy / in-memory credential slots | FACT |
| Dedicated `secret-purpose.spec.ts` | **ABSENT** | FACT |

### Purpose validation / serialization / persistence / lookup / defaults

| Concern | Owner / location | Behavior | Class |
| ------- | ---------------- | -------- | ----- |
| Validation | `SecretVaultService.resolvePurpose` + `isSecretPurpose` | Unknown purpose → `VaultValidationError`; `public_market_data` refused | FACT |
| Default | `defaultPurposeForType` | Exchange types → `Trading` when purpose omitted | FACT |
| Persistence | `VaultSecret.purpose` (`apps/api/prisma/schema.prisma`) | String column; unique with workspace+type | FACT |
| Lookup | `SecretVaultRepository.findBySlot({ workspaceId, type, purpose })` | Exact triple match | FACT |
| Serialization | Metadata / audit / events carry purpose string; ciphertext AAD binds purpose | No secret field values in metadata | FACT |
| ENV1 mapping | `trading-credential-environment.ts` | Purpose → environment; testnet purpose is first-class | FACT |

---

## 4. Vault flow and purpose participation

Inspected flow (read-only):

```text
validate → store/create → encrypt(wrap) → retrieve → decrypt(unwrap) → resolve(findBySlot) → revoke → delete
```

| Question | Answer | Class |
| -------- | ------ | ----- |
| Who owns purpose? | **Vault** owns purpose as part of secret slot identity and metadata. Connections do not own purpose today. | FACT |
| Where persisted? | `vault_secrets.purpose` (Prisma `VaultSecret`) | FACT |
| Where validated? | `SecretVaultService.resolvePurpose` on store/replace/validate/get/retrieve/revoke/delete queries | FACT |
| Where used for lookup? | Exact `SecretSlot = { workspaceId, type, purpose }` in in-memory and Prisma repositories | FACT |
| Can a caller request `TradingTestnet`? | **YES** — pass `purpose: 'trading_testnet'` / `SecretPurpose.TradingTestnet` into Vault APIs | FACT |
| Can `TradingTestnet` accidentally resolve `Trading`? | **NO** at Vault repository/service when purpose is explicit — different slot keys; AAD also binds purpose | FACT |
| Can `Trading` accidentally resolve `TradingTestnet`? | **NO** under the same exact-slot rule | FACT |
| Replace / rotate | `replace` / re-`store` into the **same** slot (same purpose). Previous ciphertext superseded. | FACT |
| Purpose mutation API | **None.** No `updatePurpose`. Purpose is not changed by `updateMetadata`. | FACT |

**INFERENCE:** Purpose is effectively **immutable for a given credential record identity** because it is the slot key. Changing purpose means operating a different slot (new create), not mutating an existing row’s purpose in place.

---

## 5. Current Credential Model

### FACT — entity and fields

| Element | Repository model |
| ------- | ---------------- |
| Credential entity | `VaultSecret` / `SecretVaultRecord` |
| Identity | `id` (UUID) |
| Purpose | `purpose: SecretPurpose` (app) / `String` (DB) |
| Provider/type | `type: HoldableSecretType` (e.g. `binance`, `bybit`, `okx`) |
| Workspace ownership | `workspaceId` + `VaultAccessControl` (membership + C8) |
| Unique active slot | `@@unique([workspaceId, type, purpose])` |
| Encryption boundary | Host wrapping key; ciphertext columns only; unwrap in server memory |
| Environment semantics | Derived from purpose via ENV1 (`tradingEnvironmentFromPurpose`) — **not** a separate Vault column |
| Validation | Holdable field schema + purpose allowlist |
| Lookup | Exact `(workspaceId, type, purpose)` |
| Connection reference | `ConnectionRecord.vaultSecretId` opaque FK-like id only — **no** purpose/environment column on Connection today |

### FACT — LIVE vs TESTNET purpose semantics (credential side)

```text
SecretPurpose.Trading / TradingLive  →  tradingEnvironment = live
SecretPurpose.TradingTestnet         →  tradingEnvironment = testnet
SecretPurpose.TradingDemo            →  tradingEnvironment = demo
```

### FACT — runtime live credential provider (ADP1)

- Port: `LiveTradingCredentialProvider.resolve({ workspaceId, type, purpose, executionMode })`
- In-repo implementation: `InMemoryLiveTradingCredentialProvider` with slot key `` `${workspaceId}::${type}::${purpose}` ``
- Nest composition does **not** currently inject a Vault-backed production provider (**FACT** from prior FIV-PRE-01 planning + code search; wiring is FIV-CRED-03)

### NOT VERIFIED

- Production database row inventory of existing purposes (no live DB inspection performed; planning must not require it).
- Whether any out-of-repo operator tooling already stores `trading_testnet` rows.

### INFERENCE

- Existing Connections-provisioned exchange secrets are almost certainly `purpose = trading` because Connections omit purpose.
- Coexistence of `trading` and `trading_live` LIVE-class slots is a known LIVE compatibility topic for later Vault-backed live resolve; **must not** be “fixed” by collapsing into Testnet (PO-CRED-07).

---

## 6. Target FIV-CRED-01 model

Preserve:

```text
SecretPurpose.Trading
        = existing LIVE-class credential purpose (legacy default)

SecretPurpose.TradingLive
        = explicit LIVE-class credential purpose (ENV1)

SecretPurpose.TradingTestnet
        = dedicated TESTNET credential purpose
```

**Do NOT create another Testnet purpose.**

Target invariants (credential resolution):

```text
TradingTestnet credential
        X
Trading credential resolution

Trading credential
        X
TradingTestnet credential resolution
```

unless a future **explicitly authorized** mechanism permits it (none authorized now).

### Model C — credential-side half only

```text
Vault purpose
    =
runtime credential / environment SoT
```

Communication to later slices (contract, not implementation here):

| Downstream slice | Credential-side signal |
| ---------------- | ---------------------- |
| FIV-CRED-02 | Must bind Connection store/audit environment to the purpose that will be written/read |
| FIV-CRED-03 | Must resolve Vault by exact requested purpose; fail closed if missing |
| FIV-CRED-04 | Must derive handshake origin class from purpose→ENV1→EG1, not client claim |
| FIV-CRED-05 | UI selects Venue + Environment; backend derives `TradingTestnet` / LIVE purposes |
| FIV-CRED-06 | Regression proves isolation matrix |

FIV-CRED-01 **must not** implement `Connection.environment`.

---

## 7. Explicit out-of-scope boundary

FIV-CRED-01 **MUST NOT** solve:

| Topic | Owner slice / package |
| ----- | --------------------- |
| Connection environment | FIV-CRED-02 |
| Provider + environment uniqueness | FIV-CRED-02 |
| Exact-purpose Vault-backed live provider wiring | FIV-CRED-03 |
| Binance handshake / endpoint selection | FIV-CRED-04 |
| API/UI Testnet operator flow | FIV-CRED-05 |
| Full security regression close | FIV-CRED-06 |
| C7 / HumanStartProof / S04 | Separate FIV-PRE / L02 gates |
| EG1 allowlist changes | Not this slice (PO-CRED-09: remain mandatory) |
| Execution / FIV / `allowRealVenueIo` | Not authorized |

---

## 8. Credential resolution contract (future-facing; freeze for this slice)

```text
requested purpose
        ↓
exact matching credential
        ↓
(workspaceId + type + purpose)
```

Required:

```text
TradingTestnet → TradingTestnet
Trading        → Trading
TradingLive    → TradingLive
```

Forbidden:

```text
TradingTestnet → Trading
Trading        → TradingTestnet
TradingTestnet → TradingLive
TradingLive    → TradingTestnet
provider-only lookup when purpose required
nearest-match / fuzzy purpose
implicit purpose conversion
```

Missing credential:

```text
missing credential
        ↓
FAIL CLOSED
```

**Note:** Vault already implements exact-slot lookup. FIV-CRED-01 freezes this as the **credential-model contract**. Enforcing it on Connections/handshake/live provider composition remains later slices.

### Omit-purpose rule (credential layer honesty)

```text
purpose omitted on Vault API
        ↓
defaultPurposeForType(type)
        ↓
exchange types → SecretPurpose.Trading (LIVE-class)
```

This default **must remain documented**. For multi-environment Binance product paths, later slices **must not** rely on omit-purpose; they must pass explicit purpose (PO-CRED-03). FIV-CRED-01 does **not** change the default (would risk LIVE breakage).

---

## 9. Workspace isolation

**FACT:** Vault operations authorize via `VaultAccessControl` (workspace membership + permission). Repository queries are scoped by `workspaceId` in the slot.

Required invariant:

```text
Workspace A
    X
Workspace B credential
```

### Planned test cases (do not implement in this planning act)

| ID | Scenario | Expected |
| -- | -------- | -------- |
| WS-01 | Same workspace + same purpose | ALLOW (exact slot) |
| WS-02 | Same workspace + different purpose | DENY cross-purpose resolve; both slots may coexist |
| WS-03 | Different workspace + same purpose | DENY |
| WS-04 | Different workspace + different purpose | DENY |

Existing coverage partially exists in vault isolation / ISO1 suites; FIV-CRED-01 planning requires explicit TradingTestnet inclusion in the planned matrix.

---

## 10. Existing LIVE credentials

Preserve:

```text
SecretPurpose.Trading = existing LIVE-class credential purpose
```

**Prohibited by this planning package:**

- automatic LIVE → Testnet conversion
- reclassification of existing rows
- secret copying between purposes
- migration of LIVE secrets into Testnet
- changing existing LIVE purpose values

```text
MIGRATION REQUIRED FOR FIV-CRED-01: NONE
```

Existing LIVE rows remain LIVE under PO-CRED-07.

---

## 11. Credential lifecycle and purpose immutability

| Operation | Exists? | Purpose behavior | Class |
| --------- | ------- | ---------------- | ----- |
| Create / store | YES | Purpose chosen at store (or defaulted) and written into slot | FACT |
| Validate | YES | Resolves purpose; no persist | FACT |
| Replace / rotate | YES | Same query purpose → same slot; ciphertext replaced | FACT |
| Revoke | YES | Clears ciphertext; purpose metadata retained on revoked record | FACT |
| Delete | YES | Removes slot | FACT |
| Purpose change | **NO dedicated operation** | N/A | FACT |
| Metadata update | YES | Timestamps/revision only; purpose unchanged | FACT |

### Preferred safety property (evaluate / freeze)

```text
credential purpose is immutable
```

**Assessment:** Satisfied by absence of purpose-mutation API and by unique slot identity. Preferred operational rule for later slices:

```text
purpose change requires explicit controlled operation
        =
store/replace into a different purpose slot
        +
never silent rewrite of existing purpose
```

Do **not** implement a purpose-mutation API in FIV-CRED-01.

---

## 12. FIV-CRED-01 Security Analysis

### CR-01 — Purpose confusion (Testnet selected as LIVE)

| Field | Content |
| ----- | ------- |
| Attack condition | Caller requests LIVE use while resolving/storing under wrong purpose, or omit-purpose stores LIVE while operator believes Testnet |
| Current mitigation | Exact Vault slots; ENV1 denies environment mismatch when trusted purpose is Testnet and endpoint is live |
| Gap | Connections/handshake omit purpose (product path) — **out of FIV-CRED-01 implementation scope** |
| Required future mitigation | FIV-CRED-02/04/05 explicit environment; FIV-CRED-03 exact resolve |
| Required test | ENV1 mismatch + Vault exact purpose deny; Connections negative cases in later slices |

### CR-02 — LIVE credential selected as Testnet

| Field | Content |
| ----- | ------- |
| Attack condition | Request `TradingTestnet` but somehow receive `Trading` material |
| Current mitigation | Exact slot lookup; AAD binds purpose; ENV1 purpose→env mapping |
| Gap | No dedicated Vault TradingTestnet↔Trading isolation suite yet |
| Required future mitigation | Add Vault-layer negative tests (this slice’s verification); provider wiring in FIV-CRED-03 |
| Required test | Store Trading only → retrieve TradingTestnet = fail closed |

### CR-03 — Provider-only lookup

| Field | Content |
| ----- | ------- |
| Attack condition | Resolve by workspace+type without purpose when multi-env is required |
| Current mitigation | Vault slot always includes purpose (defaulted if omitted) |
| Gap | Defaulting omitted purpose to LIVE can mask product intent; Connections uniqueness is provider-centric |
| Required future mitigation | FIV-CRED-02 uniqueness; forbid provider-only product resolution when env required (PO-CRED-06) |
| Required test | Explicit deny of provider-only multi-env resolve (later slices); Vault documents purpose always part of slot |

### CR-04 — Cross-workspace credential resolution

| Field | Content |
| ----- | ------- |
| Attack condition | Workspace A retrieves Workspace B secret |
| Current mitigation | `VaultAccessControl` + workspace-scoped repository |
| Gap | None identified for Vault core in this reconnaissance |
| Required future mitigation | Preserve; include TradingTestnet in isolation regression |
| Required test | WS-03 / WS-04 |

### CR-05 — Missing purpose fallback

| Field | Content |
| ----- | ------- |
| Attack condition | Missing Testnet credential falls back to LIVE |
| Current mitigation | Exact slot miss → `VaultNotStoredError` / null provider resolve — **no nearest match in Vault/InMemory provider** |
| Gap | Product paths that omit purpose never attempt Testnet slot |
| Required future mitigation | Keep fail-closed; never add fallback |
| Required test | Missing TradingTestnet with Trading present = DENY |

### CR-06 — Purpose mutation

| Field | Content |
| ----- | ------- |
| Attack condition | Reclassify LIVE secret as Testnet without new store ceremony |
| Current mitigation | No purpose update API |
| Gap | None in core API |
| Required future mitigation | Keep immutable; ban migrations in FIV-CRED-01 |
| Required test | Assert metadata update cannot change purpose (if implementation tests added) |

### CR-07 — Secret exposure

| Field | Content |
| ----- | ------- |
| Attack condition | apiKey/apiSecret appear in logs, errors, API, tests |
| Current mitigation | Metadata strip; `redactCredentialMaterial`; ciphertext-only persist; vault events carry purpose/type not fields |
| Gap | Continuous regression vigilance |
| Required future mitigation | Keep redaction; secret-safety tests in planned suite |
| Required test | No secret values in logs/errors/API/test output |

### CR-08 — Backward compatibility with existing LIVE credentials

| Field | Content |
| ----- | ------- |
| Attack condition | FIV-CRED-01 changes break existing `Trading` rows or reclassify them |
| Current mitigation | Purpose already distinct; no migration planned |
| Gap | Dual LIVE purposes (`trading` vs `trading_live`) remain a later live-resolve concern |
| Required future mitigation | Do not alter LIVE semantics; do not collapse LIVE purposes into Testnet |
| Required test | Existing LIVE vault / ENV1 / ADP1 / ISO1 regressions remain green |

---

## 13. Proposed FIV-CRED-01 Implementation Boundary

### REQUIRED (if Slice Approval chooses verification-only delivery)

| Path | Why |
| ---- | --- |
| `apps/api/src/modules/secret-vault/secret-vault.service.spec.ts` (and/or new focused spec) | Positive/negative TradingTestnet store+retrieve+isolation |
| `apps/api/src/modules/execution-adapter/live-venue-egress/v3-l02-s-env1-credential-environment.spec.ts` | Confirm purpose↔env contract remains fail-closed (extend only if gaps found) |
| This planning artifact (already) | Model freeze |

### POSSIBLY REQUIRED

| Path | Why |
| ---- | --- |
| `apps/api/src/modules/secret-vault/secret-purpose.ts` | Comment/doc clarification only if reviewers demand sharper freeze text — **no new purpose values** |
| New `secret-purpose.spec.ts` | Unit coverage for `isSecretPurpose`, `isTradingSecretPurpose`, defaults, TradingTestnet membership |
| `apps/api/src/modules/execution-adapter/live-venue/live-trading-credential.provider.ts` | **Only** if a pure in-memory exact-match regression is insufficient elsewhere — prefer not to expand ADP1 here |

### NOT IN SCOPE

| Path / area | Why |
| ----------- | --- |
| `apps/api/prisma/schema.prisma` / migrations | No schema change |
| `apps/api/src/modules/connections/**` | FIV-CRED-02 |
| `apps/api/src/modules/exchange-connectivity/**` | FIV-CRED-04 |
| API controllers / DTOs / web UI | FIV-CRED-05 |
| Vault-backed `LiveTradingCredentialProvider` Nest wiring | FIV-CRED-03 |
| EG1 allowlist / SSRF policy modules | Remain mandatory; do not modify unless separately authorized |
| C7 / HumanStartProof / S04 / LTE / EmergencyManager | Out of package slice |
| Credential provisioning scripts / secret values | Forbidden |

Do not fabricate additional paths; only touch the REQUIRED/POSSIBLY REQUIRED set if implementation is later approved.

---

## 14. Proposed implementation

### Minimum necessary to establish `TradingTestnet` as first-class

**Repository evidence shows it is already first-class in Vault taxonomy + ENV1.**

Therefore:

```text
NO CODE CHANGE REQUIRED
```

for production credential-model behavior, schema, or enum — **unless** Slice Approval explicitly requires shipping the missing verification tests as the implementation deliverable.

### If Slice Approval requires an implementation PR

Deliver **tests (+ optional purpose unit spec) only**:

1. Store `binance` + `TradingTestnet` → metadata purpose is `trading_testnet`.
2. Retrieve with `TradingTestnet` succeeds; retrieve with `Trading` does not return that material.
3. Store `Trading` only → `TradingTestnet` retrieve fails closed.
4. Same workspace both purposes coexist under unique constraint.
5. Cross-workspace deny.
6. Secret-safety assertions (metadata/list/errors).
7. Existing LIVE tests remain green.

**Still forbidden in that PR:** Connections, handshake, UI, migrations, provisioning, C7, network I/O, purpose mutation APIs, changing omit-purpose default.

---

## 15. Required tests (plan only)

### Positive

```text
Trading credential resolves as Trading.
TradingTestnet credential resolves as TradingTestnet.
Trading and TradingTestnet coexist in one workspace (distinct slots).
```

### Negative

```text
TradingTestnet requested → Trading credential = DENY
Trading requested → TradingTestnet credential = DENY
missing credential = DENY
provider-only multi-env product lookup = DENY (assert in later slice; document here)
```

### Workspace

```text
Workspace A → A = ALLOW
Workspace A → B = DENY
```

### Secret safety

```text
no secret values in logs
no secret values in errors
no secret values in API responses
no secret values in test output / fixtures
```

### Regression

```text
Existing LIVE credential tests remain passing
ENV1 / EG1 / ADP1 / ISO1 suites remain green
No Connection/environment behavior changed by FIV-CRED-01
```

---

## 16. Acceptance Criteria

| ID | Criterion |
| -- | --------- |
| **AC-01** | Existing `SecretPurpose.Trading` semantics remain unchanged |
| **AC-02** | Existing `SecretPurpose.TradingTestnet` is preserved and treated as a distinct credential purpose |
| **AC-03** | Exact-purpose resolution is enforced at the credential/Vault contract |
| **AC-04** | No cross-purpose fallback exists (`TradingTestnet ⇄ Trading`) |
| **AC-05** | Workspace isolation remains enforced |
| **AC-06** | Missing credential fails closed |
| **AC-07** | Existing LIVE credentials remain LIVE; no migration/reclassification |
| **AC-08** | No secret exposure occurs |
| **AC-09** | Required security regression tests for this slice pass (when implementation authorized) |
| **AC-10** | No Connection/environment behavior is changed by FIV-CRED-01 |
| **AC-11** | No Binance network I/O occurs |
| **AC-12** | No Prisma schema/migration change for FIV-CRED-01 |
| **AC-13** | No second Testnet purpose invented |

---

## 17. Slice completion boundary

FIV-CRED-01 is complete only when:

* planning approved;
* implementation completed **if required** by Slice Approval;
* required tests pass;
* PO Review passes;
* required security review passes;
* no unauthorized scope was changed.

Completion of FIV-CRED-01 does **NOT** mean:

```text
FIV-PRE-01 CLOSED
```

unless the PO explicitly closes FIV-PRE-01 after all required slices.

---

## 18. Next slices (remain separate)

```text
FIV-CRED-02
Connection environment + provider/environment uniqueness

FIV-CRED-03
Exact-purpose Vault resolution (Vault-backed live credential provider / composition)

FIV-CRED-04
Environment-aware Binance handshake

FIV-CRED-05
API/UI Testnet operator flow

FIV-CRED-06
Security regression and isolation verification
```

Do **not** implement them in FIV-CRED-01.

---

## 19. Gaps summary (exact)

| Gap ID | Gap | FIV-CRED-01 action |
| ------ | --- | ------------------ |
| G-01 | No dedicated Vault TradingTestnet store/retrieve isolation suite | Plan tests; implement only after Slice Approval |
| G-02 | No `secret-purpose.spec.ts` | Optional verification |
| G-03 | Connections omit purpose → always LIVE slot | **Out of scope** → FIV-CRED-02 |
| G-04 | Handshake/capability retrieve omit purpose | **Out of scope** → FIV-CRED-04 |
| G-05 | No Vault-backed `LiveTradingCredentialProvider` in Nest composition | **Out of scope** → FIV-CRED-03 |
| G-06 | Dual LIVE purposes (`trading` / `trading_live`) | Document only; do not “fix” via Testnet |
| G-07 | `ConnectionRecord` has no environment column | **Out of scope** → FIV-CRED-02 |

**Non-gaps (already present):**

* `SecretPurpose.TradingTestnet` const
* Prisma string purpose persistence
* Exact slot uniqueness including purpose
* ENV1 mapping for testnet
* Encryption AAD binding including purpose
* In-memory live provider exact purpose keying

---

## 20. Governance status

```text
FIV-CRED-01
PLANNING COMPLETE

Implementation
NOT YET AUTHORIZED BY THIS PLANNING ARTIFACT

FIV-PRE-01
IMPLEMENTATION AUTHORIZED / NOT CLOSED

FIV-PRE-02
OPEN

FIV-PRE-03
OPEN

FIV
NOT READY / NOT AUTHORIZED

C7
DENY-ALL

allowRealVenueIo
MUST REMAIN FALSE
```

**Next gate:**

```text
Planning Review
        → Slice Approval
        → Implementation
```

---

## 21. Safety confirmations (this planning act)

| Confirmation | Status |
| ------------ | ------ |
| No implementation code shipped | YES (planning artifact only) |
| No Prisma/schema/migration changes | YES |
| No API/UI/Connections/handshake/C7 changes | YES |
| No credentials modified or provisioned | YES |
| No secrets accessed, printed, decoded, or exposed | YES |
| No Binance API calls | YES |
| No FIV execution | YES |
| No capital moved | YES |
| `allowRealVenueIo` not enabled | YES |
| Protected leftovers untouched | YES |

---

## 22. Claims this artifact does **not** make

* Slice Approval
* Implementation complete
* FIV-PRE-01 closed
* FIV READY
* C7 authorized
* Testnet I/O authorized
