# FIV-CONN-03 PO/Governance Decision Support

**Document:** FIV-CONN-03 PO/Governance Decision Support
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-03 — Connection API/Domain Contract
**Authority:** PO/Governance Decision Support (under Product Owner + Chief Architect)
**Nature:** **DECISION SUPPORT ONLY — PENDING PO APPROVAL.** Does **not** freeze decisions. Does **not** authorize implementation. Does **not** grant Slice Approval. Does **not** modify production code, schema, migrations, Vault, credentials, or protected leftovers.

```text
STATUS:
DECISION SUPPORT — PENDING PO APPROVAL

Implementation:                 NOT PERFORMED
Implementation authorization:   NOT GRANTED
Decision freeze artifact:       NOT CREATED (no explicit PO approvals in this session)
External I/O:                   ZERO
Binance / Bybit / OKX:          ZERO
FIV:                            NOT PERFORMED
Capital movement:               ZERO
C7:                             DENY-ALL
allowRealVenueIo:               FALSE
Protected leftovers:            UNTOUCHED
```

**Planning package:** [`v3-l02-fiv-conn-03-planning-package.md`](./v3-l02-fiv-conn-03-planning-package.md) (`b43e7eedaeeced48585111ea9dfdeb345ca2e071`)
**Planning review:** [`v3-l02-fiv-conn-03-planning-review.md`](./v3-l02-fiv-conn-03-planning-review.md) (`31f2c40c9c3a0c53274bab12ab7851bae49512cd`) — **PASS WITH REQUIRED PO DECISIONS**
**Parent freeze:** [`v3-l02-fiv-cred-02-po-governance-decision-freeze.md`](./v3-l02-fiv-cred-02-po-governance-decision-freeze.md) — D-CRED-02-01…14 **FROZEN** (not reopened)

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

Open decisions:
D-CONN-03-01
D-CONN-03-02
D-CONN-03-03
D-CONN-03-04
D-CONN-03-05
```

### Pre-check (decision-support start)

```text
HEAD:        31f2c40c9c3a0c53274bab12ab7851bae49512cd
origin/main: 31f2c40c9c3a0c53274bab12ab7851bae49512cd
HEAD == origin/main: YES
```

Protected dirty/untracked leftovers were recorded and left untouched.

### Frozen constraints (cannot be overridden)

| ID  | Constraint                                                                                          |
| --- | --------------------------------------------------------------------------------------------------- |
| A   | Model C: Vault purpose = runtime SoT; Connection.environment = constraint; mismatch **FAIL CLOSED** |
| B   | Environment taxonomy: `live` / `testnet` only; DEMO deferred                                        |
| C   | Logical identity = `workspaceId + provider + environment`; `vaultSecretId` is reference only        |
| D   | LIVE ↔ TESTNET never silently fall back                                                             |
| E   | Provider-only credential lookup **FORBIDDEN** for multi-env EXCHANGE path                           |
| F   | Client-controlled Vault purpose **FORBIDDEN**                                                       |
| G   | Existing LIVE data remains LIVE; no silent LIVE → TESTNET                                           |
| H   | Workspace isolation + ENV1 + EG1 + C7 remain authoritative                                          |
| I   | External I/O ZERO; FIV not performed; capital ZERO; C7 DENY-ALL; `allowRealVenueIo=false`           |

**Labeling rule for this artifact:**

```text
RECOMMENDED FOR PO/GOVERNANCE CONSIDERATION
  ≠
APPROVED / FROZEN / ACCEPTED
```

No decision below is frozen by this document.

---

## Decision D-CONN-03-01 — Handshake strategy

### Question

How must Connection environment and Vault SecretPurpose be propagated through the EXCHANGE **validate → handshake → capability** path?

### Current repository evidence

| Path                                             | Behavior (FACT)                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Connections store/replace/revoke (populated env) | Purpose derived via `vaultPurposeForConnection` → `purposeForTradingEnvironment` (`live`→`trading_live`, `testnet`→`trading_testnet`) |
| Connections local validate (non-EXCHANGE)        | Purpose-aware get/retrieve                                                                                                            |
| EXCHANGE validate orchestration                  | `completeExchangeHandshake` passes `workspaceId`, `provider`, `vaultSecretId` only — **environment/purpose lost**                     |
| Handshake Vault get/retrieve                     | Omit purpose → `defaultPurposeForType` → `trading`                                                                                    |
| Capability Vault get/retrieve                    | Same omit-purpose → `trading`                                                                                                         |
| `ExchangeHandshakeRequest`                       | No `purpose` / `environment` fields                                                                                                   |
| Connection.environment availability              | Present on `ConnectionRow` before handshake call; not passed downstream                                                               |

**Problem:** Multi-env store (CONN-02) + omit-purpose validate retrieve creates LIVE/TESTNET credential-class confusion (Architecture C-06 / D-CRED-02-08 hazard). Also breaks LIVE validate for secrets stored under `trading_live` because handshake looks up `trading`.

### Options

#### OPTION A — Derive purpose and pass through every governed retrieve path

```text
Connection.environment (trusted server row)
  → derive expected purpose / LIVE-class policy (D-CONN-03-02)
  → pass purpose (and workspaceId) into handshake + capability Vault get/retrieve
  → adapter uses retrieved credentials only after purpose-bound retrieve succeeds
```

| Dimension    | Assessment                                                                          |
| ------------ | ----------------------------------------------------------------------------------- |
| Security     | Closes omit-purpose LIVE default after multi-env store; preserves workspace scoping |
| Architecture | Minimal change to existing request objects; origins remain FIV-CRED-04              |
| Model C      | Compatible — Connection env drives expected purpose class; Vault remains SoT        |
| Failure      | Missing/mismatched purpose → VALIDATION_FAILED / fail closed (no secret leak)       |
| Testability  | Assert purpose on handshake/capability retrieve calls                               |
| Scope        | FIV-CONN-03 residual; no origin/UI/backfill                                         |
| Risk         | Low if dual-purpose policy (D-CONN-03-02) is frozen first                           |

#### OPTION B — Resolve Connection into purpose-bound internal credential context first

```text
ConnectionsService builds internal PurposeBoundCredentialContext
  { workspaceId, connectionId, provider, environment, purposePolicy, vaultSecretId }
handshake/capability accept ONLY that context (no free-form type+omit-purpose retrieve)
```

| Dimension    | Assessment                                                                   |
| ------------ | ---------------------------------------------------------------------------- |
| Security     | Stronger encapsulation; harder to reintroduce omit-purpose calls             |
| Architecture | More refactor; still no origin changes                                       |
| Model C      | Compatible                                                                   |
| Failure      | Context construction fails closed if env NULL (per D-CONN-03-03) or mismatch |
| Testability  | Context contract tests + retrieve assertions                                 |
| Scope        | Slightly larger than A; still CONN-03                                        |
| Risk         | Medium (more surface), security upside                                       |

#### OPTION C — Interim deny EXCHANGE validate for `testnet` only; leave LIVE omit-purpose

Allowed by Architecture C-06 **only if** Testnet cannot CONNECT via omit-purpose LIVE retrieve.

| Dimension    | Assessment                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------- |
| Security     | Blocks Testnet CONNECT confusion; **does not** fix LIVE `trading_live` store vs `trading` retrieve |
| Architecture | Temporary; origins still CRED-04                                                                   |
| Model C      | Incomplete for LIVE path                                                                           |
| Failure      | Testnet validate rejected; LIVE may still fail or retrieve wrong slot                              |
| Testability  | Easy deny tests; leaves LIVE asymmetry                                                             |
| Scope        | Smaller code change; leaves debt                                                                   |
| Risk         | High residual for LIVE validate after CONN-02 stores                                               |

#### OPTION D — Defer all handshake purpose work to FIV-CRED-04

| Dimension     | Assessment                                               |
| ------------- | -------------------------------------------------------- |
| Security      | **Unsafe** without Option C interim — leaves C-06 hazard |
| Architecture  | Blurs CRED-04 (origins) with purpose retrieve            |
| Compatibility | Conflicts with Planning Review residual ownership        |
| Risk          | **Unacceptable** unless paired with fail-closed interim  |

### Recommended for PO/Governance consideration

```text
RECOMMENDED FOR PO/GOVERNANCE CONSIDERATION:
OPTION A
(with OPTION B acceptable as equivalent if Architecture prefers stronger encapsulation)

Do NOT select OPTION D alone.
OPTION C only if PO explicitly chooses interim Testnet deny AND accepts
residual LIVE trading_live vs trading retrieve debt until a follow-on gate.
```

Rationale: Matches frozen D-CRED-02-08 preference for purpose-aware retrieve on CRED-02 validate path; closes repository-confirmed hazard; keeps origins in CRED-04.

### PO/Governance approval required

```text
PO/GOVERNANCE APPROVAL REQUIRED: YES
Status: OPEN — NOT FROZEN
```

---

## Decision D-CONN-03-02 — LIVE dual-purpose policy

### Question

For `Connection.environment = live`, which Vault purposes may satisfy retrieve/validate/handshake/capability, and under what exact match rules — without creating cross-environment credential fallback?

### Current repository evidence

| Purpose                              | ENV1 class via `tradingEnvironmentFromPurpose` | Store path today (populated env)                                          | Slot probe today               |
| ------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------ |
| `Trading` (`trading`)                | `live`                                         | Legacy omit-purpose stores; **not** written by new populated-`live` store | Probed for LIVE slot conflicts |
| `TradingLive` (`trading_live`)       | `live`                                         | Written by `purposeForTradingEnvironment('live')`                         | Probed                         |
| `TradingTestnet` (`trading_testnet`) | `testnet`                                      | Written for `testnet` Connections                                         | Probed for TESTNET only        |

Frozen **D-CRED-02-08** already states:

```text
live     ↔ Trading / TradingLive   (LIVE-class ALLOW)
testnet  ↔ TradingTestnet
```

Handshake still omit-purpose → always `Trading`. Connection `vaultSecretId` is checked against retrieved metadata id after get.

**Why two LIVE purposes exist:** Historical Connections omit-purpose defaulted exchange secrets to `Trading`. ENV1 later introduced explicit `TradingLive`. Both are LIVE-class. They are **not** Testnet.

### Options

#### OPTION A — LIVE accepts Trading and TradingLive as equivalent LIVE-class; TESTNET accepts only TradingTestnet

```text
LIVE Connection:
  ALLOW purpose ∈ {Trading, TradingLive}
  DENY  TradingTestnet / other

TESTNET Connection:
  ALLOW TradingTestnet only
  DENY  Trading / TradingLive

Resolution rule (required if A):
  Resolve by exact Vault slot for the Connection's vaultSecretId
  within the ALLOW set for that environment class.
  NEVER cascade across environment classes.
  NEVER "try until one works" across LIVE and TESTNET.
```

| Dimension               | Assessment                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| D-CRED-02 compatibility | **Direct match** to frozen LIVE-class mapping                                            |
| Migration               | No Vault mutation                                                                        |
| Backwards compatibility | Preserves legacy `Trading` secrets after CONN-04 backfill-to-live                        |
| Security                | Safe **iff** id-bound within LIVE-class only; no ambient provider-only probe at use time |
| Operational             | Operators keep legacy LIVE credentials usable                                            |
| Test matrix             | LIVE×{Trading,TradingLive} ALLOW; LIVE×TradingTestnet DENY; TESTNET×LIVE-class DENY      |
| Risk                    | Medium if implementers misread as “try all purposes” — freeze text must forbid cascade   |

#### OPTION B — Normalize LIVE Connection path to exactly one purpose (`TradingLive`)

```text
LIVE Connection retrieve/validate uses TradingLive only.
Legacy Trading secrets require a separate governed migration (out of CONN-03).
```

| Dimension               | Assessment                                                                      |
| ----------------------- | ------------------------------------------------------------------------------- |
| D-CRED-02 compatibility | Narrower than frozen allowlist (still compatible if PO chooses narrowing)       |
| Migration               | **Not** performed in CONN-03; legacy LIVE validate may fail until separate work |
| Backwards compatibility | Weak for pre-CONN-02 `Trading` rows                                             |
| Security                | Simpler exact-purpose surface                                                   |
| Operational             | Breaks legacy LIVE until migration/ops action                                   |
| Risk                    | High operational; may force premature Vault work (out of scope)                 |

#### OPTION C — Prefer TradingLive, then Trading, but only when metadata.id === connection.vaultSecretId

Functionally a constrained form of Option A (ordered dual LIVE-class, id-matched). Same security envelope as A if cascade never includes Testnet.

### Forbidden policies (explicit)

```text
FORBIDDEN:
  try Trading → TradingLive → TradingTestnet
  try multiple environments until one credential works
  first valid credential wins (ambient)
  provider-only fallback
  cross-workspace fallback
  TESTNET consuming Trading / TradingLive
  LIVE consuming TradingTestnet
  client-controlled purpose selection
  silent Vault purpose rewrite / reclassification
```

### Recommended for PO/Governance consideration

```text
RECOMMENDED FOR PO/GOVERNANCE CONSIDERATION:
OPTION A
(with id-matched resolution within LIVE-class allowlist;
 OPTION C as an ordered refinement of A)

Do NOT select ambient multi-purpose cascade.
Do NOT normalize Vault data in CONN-03 (OPTION B only if PO accepts
legacy LIVE breakage or schedules separate migration outside CONN-03).
```

Rationale: Preserves frozen D-CRED-02-08 LIVE-class allowlist; avoids Vault mutation; blocks cross-env fallback when id-bound.

### PO/Governance approval required

```text
PO/GOVERNANCE APPROVAL REQUIRED: YES
Status: OPEN — NOT FROZEN
Highest-risk decision: YES
```

---

## Decision D-CONN-03-03 — NULL-environment validation behavior

### Question

Until FIV-CONN-04 LIVE backfill, how must EXCHANGE validate / handshake / capability behave when `Connection.environment IS NULL`?

### Current repository evidence

| Fact                        | Evidence                                                               |
| --------------------------- | ---------------------------------------------------------------------- |
| Column nullable             | CONN-01 migration; no backfill yet                                     |
| NULL ≠ LIVE                 | Frozen PO-CRED / D-CRED-02 semantics; CONN-02 uniqueness excludes NULL |
| `vaultPurposeForConnection` | Returns `undefined` when env not populated → omit-purpose → `Trading`  |
| Observed NULL EXCHANGE rows | Still present per CONN-02 audits (metadata/credentialed legacy)        |
| New EXCHANGE creates        | Must supply `live`\|`testnet` (CONN-01)                                |

**Forbidden:** `NULL → implicit LIVE` identity.

### Options

#### OPTION A — FAIL CLOSED / reject EXCHANGE validate when environment IS NULL

```text
EXCHANGE + environment IS NULL
  → reject validate / handshake / capability
  → no Vault trading credential retrieve
```

| Dimension           | Assessment                                                                 |
| ------------------- | -------------------------------------------------------------------------- |
| Security            | Strongest; eliminates NULL omit-purpose LIVE retrieve during transition    |
| Operational         | Breaks validate for existing NULL credentialed EXCHANGE rows until CONN-04 |
| CONN-04 interaction | Encourages timely backfill; NULL rows remain listable/renamable            |
| CRED-05 UI          | UI already hardcodes live on create; NULL is legacy-only                   |
| Tests               | Assert reject; assert no retrieve                                          |

#### OPTION B — Transition exception: allow omit-purpose `Trading` retrieve for NULL EXCHANGE only, with explicit documentation that NULL ≠ LIVE identity

```text
NULL EXCHANGE validate may retrieve omit-purpose Trading (legacy path)
  BUT must never treat NULL as environment=live for uniqueness/identity
  AND must never retrieve TradingTestnet for NULL
```

| Dimension           | Assessment                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Security            | Weaker; documents exception; risk of operator confusion if treated as LIVE                 |
| Operational         | Preserves validate for legacy NULL rows                                                    |
| CONN-04 interaction | Backfill later converts NULL→live without Vault rewrite                                    |
| Tests               | NULL + Trading governed allow; NULL + TradingTestnet DENY; NULL never equals live identity |

#### OPTION C — Treat NULL as live for retrieve only

```text
FORBIDDEN — silent LIVE default / PO-CRED-03 violation
```

### Recommended for PO/Governance consideration

```text
RECOMMENDED FOR PO/GOVERNANCE CONSIDERATION:
OPTION A (fail closed)
  — if PO prioritizes security clarity during transition

ALTERNATE (explicitly weaker):
OPTION B
  — only if PO prioritizes continuity for existing NULL credentialed EXCHANGE rows
    until CONN-04, with mandatory documentation that NULL ≠ LIVE

OPTION C:
REJECTED — must not be approved
```

### PO/Governance approval required

```text
PO/GOVERNANCE APPROVAL REQUIRED: YES
Status: OPEN — NOT FROZEN
```

---

## Decision D-CONN-03-04 — Model C mismatch enforcement timing

### Question

At which trust boundaries must `Connection.environment` be compared to Vault SecretPurpose (via `tradingEnvironmentFromPurpose`) so that incorrect-purpose secrets cannot be used for handshake/capability?

### Current repository evidence / flow

```text
credential lookup (Vault get by workspace+type[+purpose])
  → credential retrieval (Vault retrieve plaintext in-memory)
  → credential use (adapter handshake / capability verify)
```

Today: EXCHANGE validate jumps from Connection row → handshake omit-purpose get/retrieve → adapter use. **No Model C mismatch assert** in Connections module.

### Distinctions (mandatory)

| Stage      | Meaning                                          |
| ---------- | ------------------------------------------------ |
| Lookup     | Resolve Vault metadata for expected purpose / id |
| Retrieval  | Decrypt/return fields in memory                  |
| Use        | Sign/call adapter                                |
| Handshake  | Connectivity proof                               |
| Capability | Post-handshake capability verify                 |

**Requirement:** Incorrect-purpose secret must not reach **use**.

### Options

#### OPTION A — Enforce at store + replace + before retrieve on validate/handshake/capability

Minimum points:

1. **Before bind (store/replace):** expected purpose class from Connection.environment must match purpose being written / replaced.
2. **Before Vault retrieve on validate path:** derive expected purpose policy; perform purpose-bound get; require `metadata.id === vaultSecretId`; assert `tradingEnvironmentFromPurpose(resolvedPurpose) === connection.environment` (for populated env).
3. **Handshake and capability** inherit the same pre-retrieve gate (no separate weaker path).

| Dimension      | Assessment                                    |
| -------------- | --------------------------------------------- |
| Security value | Prevents wrong-class bind and wrong-class use |
| Duplication    | Acceptable; defense in depth at bind + use    |
| Failure        | Fail closed before plaintext use              |
| Scope          | CONN-03                                       |
| Testability    | Unit asserts at each gate                     |

#### OPTION B — Validate-path only (leave store/replace without mismatch assert)

Leaves a window where wrong-class material could be bound (if ever possible) and only fails later.

#### OPTION C — Store only

Leaves handshake/capability omit-purpose hazard unfixed — **insufficient** alone.

### Recommended for PO/Governance consideration

```text
RECOMMENDED FOR PO/GOVERNANCE CONSIDERATION:
OPTION A

Minimum non-negotiable subset even if PO narrows:
  mismatch / purpose-bound checks MUST run before credential use
  on handshake and capability (and Connections validate orchestration).

Store+replace gates strongly preferred to prevent bad binds.
```

Architecture Review may specify exact helper placement; PO freezes **which stages are mandatory**.

### PO/Governance approval required

```text
PO/GOVERNANCE APPROVAL REQUIRED: YES
Status: OPEN — NOT FROZEN
```

---

## Decision D-CONN-03-05 — Prohibition of client-supplied purpose

### Question

May any Connections HTTP/API client supply `SecretPurpose` (or equivalent) as an authoritative credential-selection input?

### Current repository evidence

| Surface                       | Purpose field?                                           |
| ----------------------------- | -------------------------------------------------------- |
| `CreateConnectionMetadataDto` | `environment?` only — no purpose                         |
| Connections controller create | Passes `body.environment` only                           |
| Store/replace/validate HTTP   | No purpose parameter observed                            |
| Server derivation             | `vaultPurposeForConnection(connection)` from trusted row |

### Options

#### OPTION A — Purpose never exposed on client API

Client supplies Connection identity (+ environment only at create). Server derives purpose. Vault result checked against expected class.

#### OPTION B — Purpose may exist only as internal server-side field

Never accepted from client; never authoritative from client even if present in ignored body fields (strip/reject).

#### OPTION C — Optional client purpose

**Rejected** — client becomes credential-selection authority.

### Recommended for PO/Governance consideration

```text
RECOMMENDED FOR PO/GOVERNANCE CONSIDERATION:
OPTION A
(with OPTION B as implementation detail: ignore/reject any sneaked purpose field)

OPTION C: REJECTED
```

Preserves Model C, environment isolation, workspace isolation, no fallback, no credential confusion.

### PO/Governance approval required

```text
PO/GOVERNANCE APPROVAL REQUIRED: YES
Status: OPEN — NOT FROZEN
```

---

## Cross-Decision Consistency

If PO later freezes the **recommended set** (01=A, 02=A/C id-matched, 03=A or documented B, 04=A, 05=A), the composition guarantees:

| Guarantee                                 | How                                         |
| ----------------------------------------- | ------------------------------------------- |
| LIVE Connection → LIVE purpose only       | 01+02+04                                    |
| TESTNET Connection → TESTNET purpose only | 01+02+04                                    |
| NULL environment → never implicitly LIVE  | 03 rejects C; A or documented B             |
| Mismatch → FAIL CLOSED                    | 04 before use (+ bind)                      |
| Client cannot select Vault purpose        | 05                                          |
| Provider-only fallback forbidden          | 01+02 id/env-bound; D-CRED-02-07            |
| Cross-workspace fallback forbidden        | existing ACL + workspaceId on all retrieves |
| No cross-environment credential fallback  | 02 forbidden list                           |

**Inconsistency warnings for PO:**

1. Choosing **01=C (defer)** without **03/deny interim** reopens C-06.
2. Choosing **02=B (TradingLive only)** without a migration plan breaks legacy `Trading` after NULL→live backfill.
3. Choosing **03=B** while claiming “NULL never retrieves LIVE-class” is contradictory — B explicitly allows omit-purpose `Trading` for NULL as a **documented exception**, not as LIVE identity.
4. Choosing **04=C (store only)** contradicts residual CONN-03 purpose (validate path).

---

## Security Matrix

Results that depend on OPEN decisions are marked accordingly. **No ALLOW invented beyond frozen D-CRED-02 where applicable.**

| Connection environment               | Vault purpose  | Expected result                                                                                                  |
| ------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| LIVE                                 | Trading        | **OPEN — PO DECISION REQUIRED** (D-CONN-03-02: ALLOW under Option A/C; DENY under Option B)                      |
| LIVE                                 | TradingLive    | **ALLOW** (all viable 02 options; matches current store)                                                         |
| LIVE                                 | TradingTestnet | **DENY**                                                                                                         |
| TESTNET                              | Trading        | **DENY**                                                                                                         |
| TESTNET                              | TradingLive    | **DENY**                                                                                                         |
| TESTNET                              | TradingTestnet | **ALLOW**                                                                                                        |
| NULL                                 | Trading        | **OPEN — PO DECISION REQUIRED** (D-CONN-03-03: DENY under A; governed legacy allow under B; never identity=LIVE) |
| NULL                                 | TradingLive    | **OPEN — PO DECISION REQUIRED** (typically DENY unless PO expands B — default expect DENY)                       |
| NULL                                 | TradingTestnet | **DENY**                                                                                                         |
| wrong workspace                      | any            | **DENY**                                                                                                         |
| wrong provider / wrong vaultSecretId | any            | **DENY**                                                                                                         |
| provider-only lookup (populated env) | n/a            | **FORBIDDEN / DENY**                                                                                             |
| client-supplied purpose              | n/a            | **FORBIDDEN / DENY** (D-CONN-03-05)                                                                              |

---

## Required Future Test Matrix

Implementation (when later authorized) must cover at least:

1. LIVE + Trading
2. LIVE + TradingLive
3. LIVE + TradingTestnet → DENY
4. TESTNET + Trading → DENY
5. TESTNET + TradingLive → DENY
6. TESTNET + TradingTestnet → ALLOW
7. NULL + Trading (per frozen 03)
8. NULL + TradingLive (per frozen 03)
9. NULL + TradingTestnet → DENY
10. wrong workspace → DENY
11. wrong provider / vaultSecretId mismatch → DENY
12. provider-only lookup attempt → DENY
13. client-supplied purpose attempt → rejected/ignored
14. validate path purpose propagation
15. handshake path purpose-bound retrieve
16. capability path purpose-bound retrieve
17. mismatch detected **before** credential use
18. secret non-exposure in errors/views
19. regression CONN-01 (create-requires-env; immutability)
20. regression CONN-02 (Strategy B; coexistence; no cross-env slot)

```text
External venue calls in tests: FORBIDDEN
Use mocked/faked handshake/capability adapters only.
```

---

## Scope Boundaries

```text
FIV-CONN-03:
  Connection-side validate/handshake/capability purpose safety
  Model C enforcement on Connections-owned paths
  Decision-level contract for D-CONN-03-01…05

FIV-CRED-04:
  Binance/environment-aware handshake ORIGINS / EG1 host selection

FIV-CRED-05:
  UI / Testnet operator connection flow

FIV-CONN-04:
  LIVE backfill / EXCHANGE NOT NULL / audit / quarantine

FIV-CONN-05:
  Full CRED-02 security regression matrix
```

---

## Non-Goals

```text
UI implementation
Binance Testnet onboarding UI
Origin redesign
Vault redesign / SecretPurpose redesign
LIVE backfill / duplicate cleanup
Venue I/O / FIV / C7 changes / allowRealVenueIo=true
Silent decision freeze without PO approval
Implementation / Slice Approval
```

---

## Safety State

```text
External I/O:                 ZERO
Binance:                      ZERO
Bybit:                        ZERO
OKX:                          ZERO
FIV:                          NOT PERFORMED
Capital:                      ZERO
C7:                           DENY-ALL
allowRealVenueIo:             FALSE
Implementation:               NOT PERFORMED
Implementation authorization: NOT GRANTED
Protected leftovers:          UNTOUCHED
```

---

## PO/Governance Decision Status

```text
D-CONN-03-01: OPEN
D-CONN-03-02: OPEN
D-CONN-03-03: OPEN
D-CONN-03-04: OPEN
D-CONN-03-05: OPEN

Decision freeze artifact: NOT CREATED
Reason: No explicit PO/Governance approvals were supplied in this session.
Recommendations above are NOT approvals.
```

### How PO freezes later

PO/Governance must explicitly approve each decision (option letter + any refinements). Only then may a separate freeze artifact be created:

```text
docs/project/version-3/wave-6/v3-l02-fiv-conn-03-po-governance-decision-freeze.md
```

Freeze still does **not** authorize implementation.

---

## Next governance gate

```text
After PO freezes D-CONN-03-01…05:
  FIV-CONN-03 ARCHITECTURE REVIEW
  + FIV-CONN-03 SECURITY REVIEW
  → PO/Governance Planning Approval
  → Slice Approval
  → Implementation (only if authorized)

Until freeze:
  Decisions remain OPEN
  Implementation authorization: NOT GRANTED
```

---

**END OF FIV-CONN-03 PO/GOVERNANCE DECISION SUPPORT**
