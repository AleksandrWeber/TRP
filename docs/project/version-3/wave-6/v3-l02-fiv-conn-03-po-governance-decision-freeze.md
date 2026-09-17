# FIV-CONN-03 PO/Governance Decision Freeze

**Document:** FIV-CONN-03 PO/Governance Decision Freeze
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-03 — Connection API/Domain Contract
**Authority:** Product Owner / Chief Architect
**Nature:** **GOVERNANCE DECISION FREEZE ONLY.** Freezes D-CONN-03-01…05. Does **not** authorize implementation. Does **not** grant Slice Approval. Does **not** authorize C7, Testnet I/O, FIV, or `allowRealVenueIo=true`.

**Basis:**

| Artifact              | Path                                                                                                             | Status                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Planning Package      | [`v3-l02-fiv-conn-03-planning-package.md`](./v3-l02-fiv-conn-03-planning-package.md)                             | COMPLETE                        |
| Planning Review       | [`v3-l02-fiv-conn-03-planning-review.md`](./v3-l02-fiv-conn-03-planning-review.md)                               | PASS WITH REQUIRED PO DECISIONS |
| Decision Support      | [`v3-l02-fiv-conn-03-po-governance-decision-support.md`](./v3-l02-fiv-conn-03-po-governance-decision-support.md) | COMPLETE — all five recorded    |
| Parent CRED-02 Freeze | [`v3-l02-fiv-cred-02-po-governance-decision-freeze.md`](./v3-l02-fiv-cred-02-po-governance-decision-freeze.md)   | FROZEN (not reopened)           |
| FIV-CONN-01 Closure   | [`v3-l02-fiv-conn-01-closure.md`](./v3-l02-fiv-conn-01-closure.md)                                               | CLOSED                          |
| FIV-CONN-02 Closure   | [`v3-l02-fiv-conn-02-closure.md`](./v3-l02-fiv-conn-02-closure.md)                                               | CLOSED                          |

**Repository baseline (freeze act start):** `9f9e4c45a592772370cd34525ff190e1c7137c19`

```text
PO/GOVERNANCE DECISION FREEZE = COMPLETE
ALL FIVE DECISIONS FROZEN
IMPLEMENTATION NOT AUTHORIZED BY THIS ARTIFACT
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## Governance State

```text
FIV-CRED-01:
CLOSED

FIV-CONN-01:
CLOSED

FIV-CONN-02:
CLOSED

FIV-CONN-03:
PLANNING REVIEW PASS WITH REQUIRED PO DECISIONS
FIVE PO DECISIONS: FROZEN
```

---

## Decision D-CONN-03-01

```text
Status:   FROZEN
Decision: APPROVED — OPTION A
```

### Exact governed decision

```text
Derive Vault SecretPurpose server-side from trusted
Connection.environment and explicitly pass that derived purpose through the
governed EXCHANGE validate → handshake → capability path.
```

### Required properties

- Purpose is derived server-side
- Connection.environment is the trusted environment context
- Purpose is passed explicitly through the governed path
- No provider-only lookup
- No omit-purpose retrieval on the governed multi-env path
- No client-controlled purpose
- Model C remains authoritative
- Connection.environment ↔ Vault purpose mismatch **FAILS CLOSED**
- LIVE and TESTNET remain isolated
- No credential fallback across environments

---

## Decision D-CONN-03-02

```text
Status:   FROZEN
Decision: APPROVED — OPTION A
```

### Exact governed decision

```text
LIVE-class purposes are {Trading, TradingLive}; TESTNET purpose is
{TradingTestnet}. LIVE dual-purpose handling is deterministic and MUST remain
bound to the specific Connection.vaultSecretId. The presence of two permitted
LIVE purpose classes does NOT authorize trying sibling secrets, ambient
credential fallback, first-match selection, or provider-only resolution.
```

### Required properties

- Connection identity determines the credential reference
- `vaultSecretId` remains the specific credential reference
- LIVE may recognize `Trading` and `TradingLive` only as governed LIVE purpose classes
- TESTNET recognizes `TradingTestnet` only
- `TradingTestnet` MUST NEVER be accepted for LIVE
- `Trading` / `TradingLive` MUST NEVER be accepted for TESTNET
- No sibling-secret substitution
- No provider-only fallback
- No first-valid-credential selection
- No database-order-dependent selection
- No retry-across-purpose behavior
- No cross-workspace fallback
- Client cannot select `SecretPurpose`
- Model C remains authoritative
- Environment ↔ actual Vault purpose mismatch **FAILS CLOSED**

---

## Decision D-CONN-03-03

```text
Status:   FROZEN
Decision: APPROVED — OPTION B
```

### Exact governed decision

```text
For EXCHANGE Connections, validate/handshake/capability MUST FAIL CLOSED while
Connection.environment IS NULL. Non-EXCHANGE NULL behavior may continue where
already supported by the domain. NULL MUST NEVER equal LIVE. A NULL EXCHANGE
Connection MUST NOT perform omit-purpose Trading retrieval. No backfill or
environment mutation is performed by FIV-CONN-03.
```

### Required properties

- EXCHANGE + NULL → FAIL CLOSED for trading credential validate/handshake/capability
- Non-EXCHANGE + NULL may continue per existing domain behavior
- NULL ≠ LIVE
- NULL cannot authorize Trading / TradingLive / TradingTestnet
- No omit-purpose Trading retrieval for NULL EXCHANGE
- No provider-only lookup / sibling-secret substitution / cross-environment fallback
- No client-controlled purpose
- No backfill / schema / migration in FIV-CONN-03 for this decision
- FIV-CONN-04 backfill remains separately governed

---

## Decision D-CONN-03-04

```text
Status:   FROZEN
Decision: APPROVED — OPTION A
```

### Exact governed decision

```text
Model C MUST enforce the actual Vault SecretPurpose against the trusted
Connection.environment before credential use for handshake/capability.
Bind-time store/replace validation is preferred. The governed use path MUST
perform an actual-purpose check before handshake/capability use. A shared
purpose-validation helper SHOULD be used for capability paths to avoid
duplicate credential retrieval.
```

### Required conceptual sequence

```text
Connection
→ expected purpose class
→ exact vaultSecretId-matched resolution
→ Vault metadata / actual SecretPurpose
→ Model C actual-purpose assertion
→ credential retrieval/use
→ handshake/capability
```

### Required properties

- Actual Vault SecretPurpose must be verified
- Connection.environment alone is not sufficient proof of actual secret purpose
- Check must occur before credential use
- No mismatched credential may reach handshake or capability
- Bind-time store/replace validation preferred
- Capability reuses governed helper (no independent resolution path)
- No sibling-secret substitution / provider-only lookup / cross-env fallback
- No client-controlled purpose
- NULL EXCHANGE remains governed by D-CONN-03-03
- LIVE dual-purpose remains governed by D-CONN-03-02

---

## Decision D-CONN-03-05

```text
Status:   FROZEN
Decision: APPROVED — OPTION A
```

### Exact governed decision

```text
SecretPurpose MUST NEVER be client-authoritative. Purpose is derived
server-side from trusted Connection context and governed credential binding.
The client must not be able to select, override, or inject a Vault
SecretPurpose as a credential-selection authority.
```

### Defensive implementation detail (frozen with Option A)

Option B behavior is also required as a defensive security measure:

- internal server-side purpose parameters are permitted;
- client-supplied purpose MUST NOT become authoritative;
- smuggled client purpose fields must be ignored or rejected per governed API contract;
- client input must not select Vault SecretPurpose, sibling credentials, override `Connection.environment` or `vaultSecretId`, or trigger credential fallback.

### Required properties

- Purpose is never client-authoritative
- Purpose is derived server-side
- Connection.environment remains trusted server-side context
- `vaultSecretId` remains the specific credential binding
- Client cannot select SecretPurpose or another credential by purpose
- Client cannot select a sibling LIVE credential
- Client cannot cross LIVE ↔ TESTNET through purpose injection
- Client cannot bypass Model C
- No provider-only lookup / sibling-secret substitution / cross-environment fallback / first-match selection

---

## Cross-Decision Security Invariants

```text
Model C:                              FAIL CLOSED
NULL ≠ LIVE:                          FORBIDDEN to equate
Cross-environment fallback:           FORBIDDEN
Sibling-secret substitution:          FORBIDDEN
Provider-only lookup:                 FORBIDDEN
Client-controlled purpose:            FORBIDDEN
Deterministic vaultSecretId binding:  REQUIRED
Workspace isolation:                  REQUIRED
Actual SecretPurpose verification
  before credential use:              REQUIRED
```

Governed chain:

```text
CLIENT
  ↓
Connection context
  ↓
trusted Connection.environment
  ↓
expected purpose class
  ↓
exact vaultSecretId
  ↓
actual Vault secret
  ↓
actual SecretPurpose
  ↓
Model C assertion
  ↓
credential use
  ↓
handshake / capability
```

Explicitly impossible:

```text
Client → SecretPurpose → arbitrary Vault credential
Client → sibling vaultSecretId
Client → provider-only lookup
LIVE → TradingTestnet
TESTNET → Trading
TESTNET → TradingLive
NULL → implicit LIVE
Mismatch → handshake
Mismatch → capability
```

---

## Security Matrix

| Connection environment  | Actual Vault purpose | Result                                          |
| ----------------------- | -------------------- | ----------------------------------------------- |
| LIVE                    | Trading              | **ALLOW** under frozen LIVE policy (id-matched) |
| LIVE                    | TradingLive          | **ALLOW** under frozen LIVE policy (id-matched) |
| LIVE                    | TradingTestnet       | **DENY**                                        |
| TESTNET                 | Trading              | **DENY**                                        |
| TESTNET                 | TradingLive          | **DENY**                                        |
| TESTNET                 | TradingTestnet       | **ALLOW**                                       |
| NULL + EXCHANGE         | Trading              | **DENY**                                        |
| NULL + EXCHANGE         | TradingLive          | **DENY**                                        |
| NULL + EXCHANGE         | TradingTestnet       | **DENY**                                        |
| wrong workspace         | any                  | **DENY**                                        |
| wrong provider          | any                  | **DENY**                                        |
| sibling vaultSecretId   | any                  | **DENY**                                        |
| provider-only lookup    | n/a                  | **DENY**                                        |
| client-supplied purpose | n/a                  | **NOT AUTHORITATIVE** / **DENY** where required |

---

## Scope Boundaries

```text
FIV-CONN-03 INCLUDES:
  Connection-side purpose safety
  validate/handshake/capability purpose propagation
  Model C enforcement
  client-purpose prohibition

FIV-CONN-03 DOES NOT INCLUDE:
  origin management (FIV-CRED-04)
  LIVE backfill / duplicate cleanup (FIV-CONN-04)
  UI / Testnet onboarding UI (FIV-CRED-05 / FIV-CONN-05)
  Vault redesign / SecretPurpose redesign
  venue I/O / FIV / C7 changes / real capital

FIV-CONN-04 remains authoritative for its own scope.
FIV-CONN-05 remains authoritative for its own scope.
```

Parent frozen D-CRED-02-01…14 are **not** reopened by this freeze.

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
```

---

## Implementation State

```text
Implementation:                 NOT PERFORMED
Implementation authorization:   NOT GRANTED
Slice Approval:                 NOT GRANTED
```

---

## Decision Authority

```text
Decision authority: PO / Governance
Decision state:     ALL FIVE DECISIONS FROZEN
```

---

## Important Governance Statement

```text
The five FIV-CONN-03 governance decisions are frozen and govern future
implementation. This freeze does NOT authorize implementation, Slice Approval,
FIV, external venue I/O, or capital movement.
```

---

## Next governance gate

```text
FIV-CONN-03 ARCHITECTURE REVIEW
+ FIV-CONN-03 SECURITY REVIEW
→ PO/Governance Planning Approval
→ Slice Approval
→ Implementation (only if authorized)
```

---

**END OF FIV-CONN-03 PO/GOVERNANCE DECISION FREEZE**
