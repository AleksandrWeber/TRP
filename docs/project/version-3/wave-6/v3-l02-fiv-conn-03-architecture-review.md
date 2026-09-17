# FIV-CONN-03 Architecture Review

**Document:** FIV-CONN-03 Architecture Review
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-03 — Connection API/Domain Contract
**Authority:** Architecture Review (Principal Backend Architect under PO + Chief Architect)
**Nature:** **ARCHITECTURE REVIEW ONLY.** Does **not** authorize implementation. Does **not** grant Slice Approval. Does **not** perform Security Review. Does **not** authorize C7, Testnet I/O, FIV, or `allowRealVenueIo=true`.

**Reviewed artifacts:**

| Artifact                    | Path                                                                                                             | Status                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Planning Package            | [`v3-l02-fiv-conn-03-planning-package.md`](./v3-l02-fiv-conn-03-planning-package.md)                             | COMPLETE                         |
| Planning Review             | [`v3-l02-fiv-conn-03-planning-review.md`](./v3-l02-fiv-conn-03-planning-review.md)                               | PASS WITH REQUIRED PO DECISIONS  |
| Decision Support            | [`v3-l02-fiv-conn-03-po-governance-decision-support.md`](./v3-l02-fiv-conn-03-po-governance-decision-support.md) | COMPLETE — all five FROZEN       |
| Decision Freeze             | [`v3-l02-fiv-conn-03-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-03-po-governance-decision-freeze.md)   | COMPLETE — all five FROZEN       |
| Parent CRED-02 Freeze       | [`v3-l02-fiv-cred-02-po-governance-decision-freeze.md`](./v3-l02-fiv-cred-02-po-governance-decision-freeze.md)   | FROZEN (not reopened)            |
| CRED-02 Architecture Review | [`v3-l02-fiv-cred-02-architecture-review.md`](./v3-l02-fiv-cred-02-architecture-review.md)                       | PASS WITH CONDITIONS (reference) |
| FIV-CONN-01 Closure         | [`v3-l02-fiv-conn-01-closure.md`](./v3-l02-fiv-conn-01-closure.md)                                               | CLOSED                           |
| FIV-CONN-02 Closure         | [`v3-l02-fiv-conn-02-closure.md`](./v3-l02-fiv-conn-02-closure.md)                                               | CLOSED                           |

**Repository baseline:** `321273a425935f6eddcd17db70956cbbdab60b07` (`HEAD == origin/main`)

```text
ARCHITECTURE PASS WITH CONDITIONS
IMPLEMENTATION NOT AUTHORIZED BY THIS REVIEW
SECURITY REVIEW: NOT PERFORMED IN THIS TASK
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## Governance State

```text
FIV-CONN-01:
CLOSED

FIV-CONN-02:
CLOSED

FIV-CONN-03:
Planning Review PASS WITH REQUIRED PO DECISIONS

D-CONN-03-01:
FROZEN

D-CONN-03-02:
FROZEN

D-CONN-03-03:
FROZEN

D-CONN-03-04:
FROZEN

D-CONN-03-05:
FROZEN
```

Frozen decisions were **not** reopened by this review.

---

## Architecture Verdict

```text
ARCHITECTURE PASS WITH CONDITIONS
```

The frozen FIV-CONN-03 contract is architecturally sound, internally consistent, compatible with closed CONN-01 / CONN-02, and repository-compatible without redesigning Vault, SecretPurpose, ENV1, EG1, UI, origins, or CONN-04/05.

Residual hazards in the current repository are **implementation gaps**, not governance or architecture contradictions. Mandatory conditions in §Conditions must be satisfied by any future implementation design and verified in Security Review / Slice Approval.

---

## Repository Evidence

### Persistence / CONN-01 constructs (FACT)

- `ConnectionRecord.environment` is nullable (`live` | `testnet` | `NULL`).
- Create requires EXCHANGE environment; environment is immutable after create.
- `vaultSecretId` remains the opaque credential reference.
- Logical EXCHANGE identity (CONN-02): `workspaceId + provider + environment` under Strategy B eligibility.

### Purpose derivation helpers (FACT)

- `vaultPurposeForConnection` → `purposeForTradingEnvironment(environment)` for EXCHANGE with populated env.
- LIVE store purpose = `SecretPurpose.TradingLive`; TESTNET = `SecretPurpose.TradingTestnet`.
- ENV1: `tradingEnvironmentFromPurpose(Trading|TradingLive)` → `live`; `TradingTestnet` → `testnet`.
- `SecretVaultMetadata.purpose` is available after Vault `get`.

### Slot conflict probe (FACT — not credential use)

- `vaultPurposesToProbe`: LIVE → `[Trading, TradingLive]`; TESTNET → `[TradingTestnet]`; NULL → `null`.
- Used only by `assertCredentialSlotAvailable` for conflict detection.
- **Not** used by handshake/capability retrieve today.

### EXCHANGE validate → handshake → capability (FACT — residual hazard)

```text
ConnectionsController.validate
  → ConnectionsService.validate
    → completeExchangeHandshake
      → ExchangeHandshakeService.perform
           vault.get({ workspaceId, type })      // NO purpose
           metadata.id === vaultSecretId
           vault.retrieve({ workspaceId, type }) // NO purpose
           adapter.handshake
      → ExchangeCapabilityService.verify         // same omit-purpose pattern
```

- Handshake/capability request types carry `workspaceId`, `provider`, `vaultSecretId` — **no** `environment` / `purpose`.
- Omit-purpose resolves via `SecretVaultService.resolvePurpose` → `defaultPurposeForType(exchange)` → `Trading`.
- No Model C `Connection.environment ↔ actual SecretPurpose` gate under Connections.
- NULL EXCHANGE is not fail-closed on this path today.

### Client API surface (FACT)

- `CreateConnectionMetadataDto`: optional `environment` only — **no** `purpose`.
- `StoreConnectionCredentialsDto`: credentials only — **no** `purpose`.
- Validate endpoint: no body credential-selector fields.
- Web create API: `environment?: 'live'|'testnet'` only.

### Vault resolution model (FACT)

- Vault lookup is **slot-based**: `(workspaceId, type, purpose)` via `findBySlot`.
- **No** `findById` API.
- Runtime binding today: slot get/retrieve + post-check `metadata.id === connection.vaultSecretId`.

### Contrast: purpose-aware Connections paths already exist (FACT)

| Path                            | Purpose behavior                    |
| ------------------------------- | ----------------------------------- |
| store / replace                 | exact `vaultPurposeForConnection`   |
| revoke                          | exact purpose                       |
| completeLocalValidation         | exact purpose                       |
| EXCHANGE handshake / capability | **omit purpose** ← CONN-03 residual |

---

## Core Architecture

### Required governed chain (frozen)

```text
Connection
  ↓
trusted Connection.environment
  ↓
expected SecretPurpose class
  ↓
exact vaultSecretId
  ↓
actual Vault secret
  ↓
actual SecretPurpose metadata
  ↓
Model C assertion
  ↓
credential use
  ↓
handshake / capability
```

### Forbidden architecture

```text
Connection
  ↓
provider-only lookup
  ↓
find any matching secret
  ↓
try until one works
```

### Architectural assessment

**PASS.** The repository already contains the necessary constructs:

1. Trusted persisted `Connection.environment` (CONN-01).
2. Exact `vaultSecretId` on Connection.
3. ENV1 purpose ↔ environment maps.
4. Vault metadata exposing actual `purpose`.
5. Existing id-match check after slot get.
6. Existing purpose-aware store/replace/local-validate patterns to extend, not replace.

CONN-03 does **not** require a parallel credential-resolution subsystem. It requires wiring purpose + Model C onto the existing Connections-owned validate → handshake → capability path.

---

## Model C

```text
Vault SecretPurpose     = runtime environment source of truth (via ENV1)
Connection.environment  = environment constraint / audit context
Mismatch                = FAIL CLOSED
```

### Expected vs actual

| Concept                | Source                                                                                      | Role                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Expected purpose class | Derived server-side from `Connection.environment`                                           | Selects permitted purpose class / guides slot resolution |
| Actual SecretPurpose   | Vault metadata of the id-matched secret                                                     | Runtime SoT for Model C                                  |
| Agreement              | `tradingEnvironmentFromPurpose(actual) == Connection.environment` (LIVE-class dual allowed) | Gate before credential use                               |

**PASS.** Architecture supports both expected and actual purpose. Expected purpose must **never** be treated as proof of actual purpose (D-CONN-03-04).

Existing live-egress Model C helpers (`assertLiveCredentialEnvironmentBinding`) demonstrate the pattern but are **not** wired into Connections validate — CONN-03 must provide Connections-path enforcement (shared helper preferred), without absorbing ADP1/execution scope.

---

## vaultSecretId Binding

```text
Logical Connection identity (EXCHANGE):
  workspaceId + provider + environment

Runtime credential binding:
  Connection.vaultSecretId → exact Vault secret
```

**PASS.** Frozen contract preserves this distinction.

Architectural constraint (repository): Vault has no get-by-id. Therefore slot-based get/retrieve **plus** mandatory `metadata.id === vaultSecretId` remains the compatible binding mechanism. Purpose may be supplied to select the slot; identity of the credential remains the id.

Provider-only lookup (omit purpose / ignore id) is architecturally **forbidden** for the governed multi-env path.

---

## LIVE Dual-Purpose

Frozen D-CONN-03-02:

```text
LIVE-class:    { Trading, TradingLive }
TESTNET-class: { TradingTestnet }
```

### Architectural interpretation (mandatory)

Dual LIVE purpose classes are **acceptance classes for Model C**, not a search order and not sibling substitution.

**Forbidden:**

```text
try Trading → if absent try TradingLive → if absent try TradingTestnet
find all LIVE secrets → choose one
first-match / ambient cascade / cross-environment retry
```

**Required under slot-based Vault:**

```text
Resolve only within the permitted purpose class for Connection.environment
AND accept only the secret whose metadata.id === Connection.vaultSecretId
AND verify actual SecretPurpose against environment (Model C)
ELSE FAIL CLOSED
```

`vaultPurposesToProbe` today is **conflict probing**, not credential use. CONN-03 must not reinterpret it as an ambient retrieve cascade. Any multi-slot inspection for LIVE is permitted **only** as id-anchored location of the bound secret within `{Trading, TradingLive}` (see Condition C-01).

**PASS WITH CONDITION C-01.**

---

## NULL Environment

Frozen D-CONN-03-03 Option B:

```text
EXCHANGE + environment NULL → FAIL CLOSED
  for trading validation / handshake / capability
Non-EXCHANGE + NULL → may continue where already supported
NULL ≠ LIVE
No omit-purpose Trading retrieval for NULL EXCHANGE
No backfill in CONN-03
```

**PASS.** Implementable as an early gate in Connections EXCHANGE validate before any handshake/capability Vault I/O.

- Does not change CONN-01 nullable meaning.
- Does not require CONN-04 backfill.
- Does not alter non-EXCHANGE local-validation omit-purpose behavior where already domain-supported.

---

## Mismatch Enforcement

Frozen D-CONN-03-04 Option A:

```text
Actual Vault SecretPurpose MUST be verified against Connection.environment
before credential use for handshake/capability.
Shared governed validation/helper preferred for capability.
```

**PASS WITH CONDITIONS C-02 / C-03.**

Architectural placement:

1. Prefer one shared Connections-owned (or Connections-invoked) purpose-validation helper.
2. Helper returns id-matched metadata + Model C result **before** retrieve/use.
3. Handshake and capability consume the same contract — no independent capability credential architecture.
4. Bind-time store/replace already purpose-aware (CONN-02); use-path check remains mandatory.

Risks without the shared helper: duplicate Vault retrieval, inconsistent validation, capability bypass — classified under Risks (not blockers if conditions held).

---

## Client Purpose Authority

Frozen D-CONN-03-05 Option A (+ Option B defensive detail):

```text
SecretPurpose MUST NEVER be client-authoritative.
Internal server-side purpose parameters are permitted.
```

### Current API evidence

| Surface                       | Client purpose field?  | Effect today                              |
| ----------------------------- | ---------------------- | ----------------------------------------- |
| Create DTO                    | **No**                 | N/A                                       |
| Store credentials DTO         | **No**                 | N/A                                       |
| Validate endpoint             | **No** body selector   | Server loads Connection by id + workspace |
| Handshake/capability services | Internal only; no HTTP | Not client-reachable                      |

**PASS.** Architecture can guarantee client ≠ purpose authority by:

1. Continuing to omit purpose from client DTOs / public API.
2. Deriving purpose only from trusted Connection row + vault binding.
3. Defensively ignoring/rejecting any future smuggled purpose field per API contract (Condition C-04).

No current public Connections API exposes a SecretPurpose selector. No removal required in this review (review-only).

---

## Handshake

### Current architecture

```text
completeExchangeHandshake
  → handshake.perform({ workspaceId, provider, vaultSecretId, … })
  → vault.get/retrieve WITHOUT purpose
  → id match
  → adapter.handshake
```

### Target architecture (contract-level)

```text
completeExchangeHandshake
  → NULL EXCHANGE fail-closed (D-CONN-03-03)
  → derive expected purpose class from Connection.environment
  → id-anchored Vault resolve + actual-purpose Model C
  → only then retrieve/use → adapter.handshake
```

**PASS WITH CONDITIONS.** Handshake must not grow a parallel credential resolver. Extend the existing Connections → handshake request contract with **server-derived** purpose/environment context (not client fields), or perform Model C in Connections before calling handshake with already-validated material — either way, one governed path.

---

## Capability

### Current architecture

```text
On CONNECTED handshake:
  capabilities.verify({ workspaceId, provider, vaultSecretId, handshakeSucceeded })
  → vault.get/retrieve WITHOUT purpose
  → id match
  → adapter.verify
```

Same omit-purpose residual as handshake.

**PASS WITH CONDITIONS.** Capability must reuse the same governed purpose-validation contract (D-CONN-03-04). No capability-only credential resolution. No bypass of Model C or NULL fail-closed.

---

## CONN-01 Compatibility

| CONN-01 construct          | CONN-03 consumption                                          |
| -------------------------- | ------------------------------------------------------------ |
| `Connection.environment`   | Trusted environment context for purpose derivation + Model C |
| Nullable transitional NULL | Fail-closed for EXCHANGE use paths; no meaning change        |
| Environment immutability   | Unchanged                                                    |
| `vaultSecretId`            | Remains credential reference                                 |
| ENV1 vocabulary            | Reused; no second taxonomy                                   |

**PASS.** No CONN-01 redesign required.

---

## CONN-02 Compatibility

| CONN-02 construct                     | CONN-03 relationship                                |
| ------------------------------------- | --------------------------------------------------- |
| Strategy B uniqueness                 | Untouched                                           |
| Purpose-aware store/replace           | Prerequisite; CONN-03 aligns use path               |
| `vaultPurposesToProbe` conflict check | Remains conflict-only unless id-anchored under C-01 |
| P2002 conflict behavior               | Untouched                                           |
| vaultSecretId not in logical identity | Preserved                                           |

**PASS.** CONN-03 closes the residual omit-purpose use-path gap created by CONN-02 store purpose pass-through; it does not duplicate uniqueness rules.

---

## Scope Boundaries

```text
FIV-CONN-03 INCLUDES:
  Connection-side purpose safety
  validate / handshake / capability purpose propagation
  Model C enforcement on Connections use path
  client-purpose prohibition

FIV-CONN-03 DOES NOT INCLUDE:
  origin management (FIV-CRED-04)
  LIVE backfill / duplicate cleanup (FIV-CONN-04)
  UI / Testnet onboarding UI (FIV-CRED-05 / FIV-CONN-05)
  Vault redesign / SecretPurpose redesign / findById introduction
  venue I/O / FIV / C7 / allowRealVenueIo / capital
```

**PASS.** Scope remains limited to Connection-side contract wiring. FIV-CONN-04 / FIV-CONN-05 remain authoritative for their scopes.

---

## Security Invariants

| #   | Invariant                                | Structurally enforceable?                                           |
| --- | ---------------------------------------- | ------------------------------------------------------------------- |
| 1   | Workspace isolation                      | **YES** — existing workspace-scoped Connection + Vault queries      |
| 2   | Provider isolation                       | **YES** — provider → vault type + Connection provider               |
| 3   | Environment isolation                    | **YES** — with purpose pass-through + Model C (CONN-03 residual)    |
| 4   | Exact vaultSecretId binding              | **YES** — existing id match; must remain mandatory                  |
| 5   | Actual SecretPurpose verification        | **YES** — metadata.purpose available; not yet wired                 |
| 6   | Model C fail closed                      | **YES** — architecturally; not yet on Connections path              |
| 7   | NULL ≠ LIVE                              | **YES** — early EXCHANGE NULL gate                                  |
| 8   | No provider-only lookup                  | **YES** — forbid omit-purpose on governed EXCHANGE path             |
| 9   | No sibling-secret substitution           | **YES** — id-anchored only (C-01)                                   |
| 10  | No cross-environment fallback            | **YES** — purpose class isolation                                   |
| 11  | No client-controlled purpose             | **YES** — DTO + server derivation (C-04)                            |
| 12  | No credential leakage                    | **YES** — existing vault/error patterns; Security Review owns depth |
| 13  | No external venue access from this slice | **YES** — CONN-03 does not authorize venue I/O / FIV / C7           |

**PASS** at architecture level. Security Review remains the next gate for adversarial depth.

---

## Testability

Frozen contract is testable without external venue I/O:

| Case                                         | Testable level              |
| -------------------------------------------- | --------------------------- |
| LIVE + Trading → ALLOW (id-matched)          | unit / service / in-process |
| LIVE + TradingLive → ALLOW                   | unit / service / in-process |
| LIVE + TradingTestnet → DENY                 | unit / service / in-process |
| TESTNET + Trading → DENY                     | unit / service / in-process |
| TESTNET + TradingLive → DENY                 | unit / service / in-process |
| TESTNET + TradingTestnet → ALLOW             | unit / service / in-process |
| NULL + EXCHANGE → DENY                       | unit / service              |
| wrong workspace → DENY                       | service / in-process        |
| wrong provider → DENY                        | service / in-process        |
| wrong vaultSecretId → DENY                   | service / in-process        |
| provider-only lookup → DENY                  | service                     |
| sibling-secret substitution → DENY           | service                     |
| client purpose injection → NOT AUTHORITATIVE | DTO / controller / service  |
| handshake mismatch → DENY                    | service                     |
| capability mismatch → DENY                   | service                     |

**PASS.** Existing Connections + exchange-connectivity specs provide fixtures patterns; in-memory Vault already supports multi-purpose slots.

---

## Risks

| ID   | Risk                                                     | Class      | Notes                                               |
| ---- | -------------------------------------------------------- | ---------- | --------------------------------------------------- |
| R-01 | LIVE dual-purpose confusion                              | **HIGH**   | Mitigated by C-01; must not become retrieve cascade |
| R-02 | Sibling-secret substitution                              | **HIGH**   | Mitigated by mandatory id match                     |
| R-03 | Provider-only lookup                                     | **HIGH**   | Current residual; closed by purpose pass-through    |
| R-04 | NULL environment ambiguity                               | **MEDIUM** | Closed by D-CONN-03-03 early gate                   |
| R-05 | Expected-vs-actual purpose confusion                     | **HIGH**   | Closed by D-CONN-03-04 + C-02                       |
| R-06 | Handshake bypass                                         | **MEDIUM** | Closed if handshake uses shared contract            |
| R-07 | Capability bypass                                        | **MEDIUM** | Closed by C-03 shared helper                        |
| R-08 | Client purpose injection                                 | **LOW**    | No field today; C-04 defensive                      |
| R-09 | Scope bleed into CONN-04 / CONN-05                       | **MEDIUM** | Scope boundaries explicit                           |
| R-10 | Duplicate credential retrieval / inconsistent validation | **MEDIUM** | Mitigated by C-02 / C-03                            |

No **BLOCKING** architectural defects found against the frozen decisions.

---

## Conditions

Mandatory, actionable, testable. Do **not** constitute implementation authorization.

### C-01 — Id-anchored LIVE dual-purpose resolution

Under slot-based Vault (no findById), any LIVE multi-purpose slot inspection MUST:

1. Stay within `{Trading, TradingLive}` only;
2. Accept only `metadata.id === Connection.vaultSecretId`;
3. FAIL CLOSED if no id match;
4. NEVER accept a different secret id;
5. NEVER fall through to `TradingTestnet`;
6. NEVER first-match without id.

TESTNET remains single-purpose `{TradingTestnet}`.

**Test:** sibling LIVE secret with different id → DENY; TESTNET secret for LIVE connection → DENY.

### C-02 — Shared Model C / purpose-validation helper

Handshake and capability MUST share one governed validation contract that:

1. Uses trusted Connection context;
2. Resolves the id-bound Vault secret;
3. Asserts actual SecretPurpose against environment;
4. Occurs before credential use.

**Test:** mismatch denied for both handshake and capability paths with the same rule.

### C-03 — No capability-independent credential architecture

Capability MUST NOT resolve credentials by a different algorithm than the governed Connections path.

**Test:** capability cannot succeed when handshake Model C would deny the same Connection.

### C-04 — Client purpose remains non-authoritative

Public Connections DTOs/APIs MUST NOT gain an authoritative `purpose` / credential-selector field. If a smuggled field appears, ignore or reject per API contract; it must not select Vault purpose, sibling credentials, override environment/`vaultSecretId`, or bypass Model C.

**Test:** injected purpose does not change resolved credential or Model C outcome.

### C-05 — NULL EXCHANGE fail-closed before Vault use

EXCHANGE + `environment IS NULL` MUST fail closed before handshake/capability Vault get/retrieve. No omit-purpose Trading retrieval. No backfill.

**Test:** NULL EXCHANGE validate performs zero credential retrieve for trading handshake/capability.

### C-06 — No Vault / SecretPurpose / ENV1 redesign

CONN-03 MUST implement within existing Vault slot API, SecretPurpose enum, and ENV1 maps. Introducing findById, redesigning purposes, or changing EG1/C7 is out of scope.

**Test:** implementation review shows no schema/Vault redesign; slot + id-match remains.

### C-07 — Conflict probe ≠ credential cascade

`vaultPurposesToProbe` (or equivalent) remains conflict-check semantics unless explicitly constrained by C-01 id-anchoring for use-path resolution. Ambient “try until works” is forbidden.

**Test:** retrieve path never accepts first occupied slot without id match.

---

## Decision Verification

| Decision     | Freeze state               | Architecture verification                                       |
| ------------ | -------------------------- | --------------------------------------------------------------- |
| D-CONN-03-01 | FROZEN — APPROVED OPTION A | **VERIFIED** — purpose pass-through architecturally supportable |
| D-CONN-03-02 | FROZEN — APPROVED OPTION A | **VERIFIED** — with C-01 id-anchored dual LIVE class            |
| D-CONN-03-03 | FROZEN — APPROVED OPTION B | **VERIFIED** — early NULL fail-closed; no backfill              |
| D-CONN-03-04 | FROZEN — APPROVED OPTION A | **VERIFIED** — with C-02/C-03 shared actual-purpose gate        |
| D-CONN-03-05 | FROZEN — APPROVED OPTION A | **VERIFIED** — no client purpose authority; C-04 defensive      |

---

## Implementation Readiness

```text
READY WITH CONDITIONS
```

Ready for **FIV-CONN-03 SECURITY REVIEW**, then later PO Planning / Slice Approval gates. Not ready to implement until those gates authorize.

---

## Implementation Authorization

```text
NOT GRANTED
```

This Architecture Review does **not** create Slice Approval, implementation plan, implementation task, schema changes, migrations, FIV authorization, or venue I/O authorization.

---

## Safety State

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
Schema:             NOT MODIFIED
Migrations:         NOT CREATED
Backfill:           NOT PERFORMED
Duplicate cleanup:  NOT PERFORMED
Implementation:     NOT PERFORMED
```

---

## Protected Work

```text
Protected leftovers:
UNTOUCHED
```

---

## Next governance gate

```text
FIV-CONN-03 SECURITY REVIEW
```

Security Review is a **separate** activity. This artifact does not claim Security Review PASS.

---

**END OF FIV-CONN-03 ARCHITECTURE REVIEW**
