# FIV-CONN-03 PO/Governance Decision Support

**Document:** FIV-CONN-03 PO/Governance Decision Support
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-03 — Connection API/Domain Contract
**Authority:** PO/Governance Decision Support (under Product Owner + Chief Architect)
**Nature:** **PO DECISION RECORDING + DECISION SUPPORT.** Records only explicitly PO-approved decisions. Remaining decisions stay OPEN. Does **not** authorize implementation. Does **not** grant Slice Approval. Does **not** create the full five-decision freeze artifact. Does **not** modify production code, schema, migrations, Vault, credentials, or protected leftovers.

```text
STATUS:
D-CONN-03-01 FROZEN (PO APPROVED — OPTION A)
D-CONN-03-02 FROZEN (PO APPROVED — OPTION A)
D-CONN-03-03 FROZEN (PO APPROVED — OPTION B)
D-CONN-03-04 FROZEN (PO APPROVED — OPTION A)
D-CONN-03-05 OPEN — DECISION SUPPORT PENDING PO APPROVAL

Full decision-freeze artifact:  NOT CREATED (awaiting D-CONN-03-05)
Implementation:                 NOT PERFORMED
Implementation authorization:   NOT GRANTED
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

D-CONN-03-01:
FROZEN — APPROVED OPTION A

D-CONN-03-02:
FROZEN — APPROVED OPTION A

D-CONN-03-03:
FROZEN — APPROVED OPTION B

D-CONN-03-04:
FROZEN — APPROVED OPTION A

Still open:
D-CONN-03-05
```

### Pre-check (this update)

```text
HEAD:        bb06f83e2439d523c09b5af068771d89d5706de6
origin/main: bb06f83e2439d523c09b5af068771d89d5706de6
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

D-CONN-03-01 through D-CONN-03-04 are FROZEN (explicit PO approvals).
D-CONN-03-05 recommendations remain non-binding.
```

---

## D-CONN-03-01 — PO DECISION

```text
Status:                         FROZEN
Decision:                       APPROVED — OPTION A
Decision authority:             PO / Governance
Implementation authorization:   NOT GRANTED
```

### Exact frozen decision

```text
Derive Vault SecretPurpose server-side from trusted
Connection.environment and explicitly pass that derived purpose through the
governed EXCHANGE validate → handshake → capability path.
```

### Required properties (frozen)

| Property                              | Requirement                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| Purpose derivation                    | Server-side only                                           |
| Environment context                   | Trusted `Connection.environment`                           |
| Propagation                           | Explicit purpose through validate → handshake → capability |
| Provider-only lookup                  | **FORBIDDEN**                                              |
| Omit-purpose retrieval                | **FORBIDDEN** on the governed multi-env path               |
| Client-controlled purpose             | **FORBIDDEN**                                              |
| Model C                               | Authoritative                                              |
| Environment ↔ purpose mismatch        | **FAIL CLOSED**                                            |
| LIVE / TESTNET                        | Remain isolated                                            |
| Cross-environment credential fallback | **FORBIDDEN**                                              |

```text
This freezes the GOVERNANCE DECISION ONLY.
It does NOT authorize implementation.
It does NOT freeze D-CONN-03-05 by itself.
It does NOT create the full FIV-CONN-03 decision-freeze artifact.
```

### Prior analysis (retained for audit)

The original option analysis for handshake strategy remains below for history. **PO selected OPTION A.** Options B/C/D are not approved.

---

## Decision D-CONN-03-01 — Handshake strategy (historical analysis)

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

### Recommended for PO/Governance consideration (historical — superseded)

```text
RECOMMENDED FOR PO/GOVERNANCE CONSIDERATION:
OPTION A
(with OPTION B acceptable as equivalent if Architecture prefers stronger encapsulation)

Do NOT select OPTION D alone.
OPTION C only if PO explicitly chooses interim Testnet deny AND accepts
residual LIVE trading_live vs trading retrieve debt until a follow-on gate.
```

Rationale: Matches frozen D-CRED-02-08 preference for purpose-aware retrieve on CRED-02 validate path; closes repository-confirmed hazard; keeps origins in CRED-04.

### PO/Governance status

```text
PO/GOVERNANCE APPROVAL: GRANTED (this session)
Status: FROZEN — APPROVED OPTION A
See section "D-CONN-03-01 — PO DECISION" above.
```

---

## D-CONN-03-02 — PO DECISION

```text
Status:                         FROZEN
Decision:                       APPROVED — OPTION A
Decision authority:             PO / Governance
Implementation authorization:   NOT GRANTED
```

### Exact frozen decision

```text
LIVE-class purposes are {Trading, TradingLive}; TESTNET purpose is
{TradingTestnet}. LIVE dual-purpose handling is deterministic and MUST remain
bound to the specific Connection.vaultSecretId. The presence of two permitted
LIVE purpose classes does NOT authorize trying sibling secrets, ambient
credential fallback, first-match selection, or provider-only resolution.
```

### Required properties (frozen)

1. Connection identity determines the credential reference.
2. `vaultSecretId` remains the specific credential reference.
3. LIVE may recognize `Trading` and `TradingLive` only as explicitly governed LIVE purpose classes.
4. TESTNET recognizes `TradingTestnet` only.
5. `TradingTestnet` MUST NEVER be accepted for LIVE.
6. `Trading` MUST NEVER be accepted for TESTNET.
7. `TradingLive` MUST NEVER be accepted for TESTNET.
8. A LIVE Connection MUST NOT substitute another LIVE Connection's `vaultSecretId` merely because it has a permitted LIVE purpose.
9. No sibling-secret substitution.
10. No provider-only fallback.
11. No first-valid-credential selection.
12. No database-order-dependent credential selection.
13. No retry-across-purpose behavior.
14. No cross-workspace fallback.
15. Client cannot select `SecretPurpose`.
16. Model C remains authoritative.
17. `Connection.environment` ↔ actual Vault purpose mismatch **FAILS CLOSED**.

```text
This freezes the GOVERNANCE POLICY ONLY.
It does NOT authorize implementation.
It does NOT freeze D-CONN-03-05.
It does NOT create the full five-decision freeze artifact.
```

### Prior decision support (retained for audit)

The expanded Option A/B analysis and deterministic id-match contract remain below for history. **PO selected OPTION A** with the vaultSecretId-bound LIVE-class policy above.

---

## D-CONN-03-02 — DECISION SUPPORT (historical)

```text
Status: SUPERSEDED BY PO DECISION ABOVE — was OPEN; now FROZEN OPTION A
```

### Question

For `Connection.environment = LIVE` (`live`), should the governed Connection path accept:

```text
A: SecretPurpose.Trading AND SecretPurpose.TradingLive
   as two explicitly permitted LIVE purposes
   (within a deterministic, non-fallback resolution contract)

OR

B: normalize the governed Connection path to exactly one LIVE purpose

OR another repository-grounded policy?
```

Must preserve:

```text
LIVE ≠ TESTNET
TradingTestnet MUST NEVER be accepted as a LIVE credential
```

### Repository evidence (independent inspection)

| #   | Finding                                                                                                  | Evidence                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `SecretPurpose.Trading` = legacy default LIVE-class for exchange types                                   | `defaultPurposeForType(binance\|bybit\|okx)` → `Trading`; omit-purpose Vault path                                                   |
| 2   | `SecretPurpose.TradingLive` = explicit LIVE purpose                                                      | `purposeForTradingEnvironment('live')` → `TradingLive`                                                                              |
| 3   | `SecretPurpose.TradingTestnet` = TESTNET only                                                            | `purposeForTradingEnvironment('testnet')`; ENV1 maps to `testnet`                                                                   |
| 4   | Trading vs TradingLive are **same ENV1 environment class** (`live`), not distinct venue security classes | `tradingEnvironmentFromPurpose(Trading\|TradingLive)` → `live`                                                                      |
| 5   | Trading vs TradingTestnet **are** distinct environment classes                                           | ENV1 + D-CRED-02-08                                                                                                                 |
| 6   | New populated-`live` Connection store writes **TradingLive only**                                        | `vaultPurposeForConnection` → `purposeForTradingEnvironment`                                                                        |
| 7   | Legacy / NULL-env / omit-purpose paths still land on **Trading**                                         | handshake/capability omit purpose; `vaultPurposeForConnection` returns undefined when env null                                      |
| 8   | Multi-purpose probing exists **only for slot conflict checks**, not for credential use                   | `vaultPurposesToProbe`: LIVE probes `[Trading, TradingLive]` in `assertCredentialSlotAvailable` — conflict if **any** slot occupied |
| 9   | Store/replace/revoke/local-validate use **exact** `vaultPurposeForConnection` (single purpose)           | `connections.service.ts`                                                                                                            |
| 10  | No code falls back TradingLive → Trading or Trading → TradingLive at **retrieve/use**                    | Exact purpose or omit-purpose only                                                                                                  |
| 11  | No Connections path reaches TradingTestnet from LIVE store/retrieve helpers                              | LIVE probe list excludes Testnet; store uses TradingLive                                                                            |
| 12  | Handshake/capability can reach Trading from any EXCHANGE validate via omit-purpose                       | Residual hazard; mitigated by frozen D-CONN-03-01 going forward                                                                     |
| 13  | Connection.environment available on row before handshake; **lost** at handshake request                  | `ExchangeHandshakeRequest` has no env/purpose                                                                                       |
| 14  | `vaultSecretId` is the Connection credential reference; get checks `metadata.id === vaultSecretId`       | handshake/capability after get                                                                                                      |
| 15  | Existing Connection↔Vault purpose inventory in live DB was **not** re-queried in this act                | Association counts remain NOT VERIFIED here; policy must not require inventory mutation                                             |

**Interpretation:** Trading and TradingLive are **historical + explicit LIVE-class aliases**, not LIVE vs TESTNET. Dual-purpose at use time is a compatibility question inside LIVE-class only.

### Option A — LIVE-class `{Trading, TradingLive}`; TESTNET `{TradingTestnet}`

```text
LIVE Connection allowed purpose class:
  { Trading, TradingLive }

TESTNET Connection allowed purpose class:
  { TradingTestnet }

Equivalence is ONLY within the LIVE environment class.
```

**This does NOT mean “try both until one works.”**

#### Deterministic resolution contract required if PO chooses A

```text
Inputs (trusted):
  workspaceId, provider/type, connection.environment=live,
  connection.vaultSecretId

Allowlist:
  P = { Trading, TradingLive }   // fixed set; never includes TradingTestnet

Algorithm (deterministic; order does not change outcome):
  1. If vaultSecretId is null → no credential use (validate cannot proceed)
  2. For each purpose p in P (fixed enumeration):
       meta = vault.get({ workspaceId, type, purpose: p })
       if meta !== null AND meta.id === vaultSecretId:
         selectedPurpose = p
         break
  3. If no selectedPurpose → FAIL CLOSED (DENY)
  4. Assert tradingEnvironmentFromPurpose(selectedPurpose) === 'live'
     else FAIL CLOSED
  5. vault.retrieve({ workspaceId, type, purpose: selectedPurpose })
  6. Use credentials only after steps 3–5 succeed

FORBIDDEN:
  - selecting a different LIVE secret that does not match vaultSecretId
  - probing TradingTestnet for LIVE
  - "first occupied slot wins"
  - provider-only get without purpose after D-CONN-03-01
  - cross-workspace lookup
```

Because Vault rows are unique per `(workspaceId, type, purpose)` and ids are unique, **at most one** purpose in P can own a given `vaultSecretId`. Probe order cannot create non-determinism under the id-match rule.

| Dimension               | Assessment                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Security                | Safe under id-match + allowlist; blocks Testnet                                           |
| Architecture            | Compatible with frozen D-CONN-03-01 (pass selectedPurpose)                                |
| Model C / D-CRED-02-08  | **Direct match** to frozen LIVE-class allowlist                                           |
| Migration               | No Vault mutation                                                                         |
| Backwards compatibility | Legacy Trading + new TradingLive both usable when referenced                              |
| Determinism             | Yes, with id-match contract                                                               |
| Ambiguity               | Id not found → DENY (fail closed)                                                         |
| Risk                    | Medium if implementers misread as ambient cascade — freeze text must include the contract |

### Option B — Normalize LIVE path to exactly one purpose

Repository-grounded single purpose for **new** writes is already `TradingLive`.

```text
LIVE Connection path uses TradingLive only.
Legacy Trading secrets are out of band unless separately migrated.
```

| Dimension                 | Assessment                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| Backward compatibility    | **Weak** for Connections whose `vaultSecretId` points at Trading                               |
| Existing LIVE credentials | Pre-CONN-02 omit-purpose stores are Trading                                                    |
| Migration implications    | Would require governed Vault/ops work **outside** CONN-03 (forbidden to silent-normalize here) |
| Operational impact        | LIVE validate fails for legacy Trading until migration                                         |
| Security                  | Simpler exact-purpose surface                                                                  |
| D-CRED-02 consistency     | Narrower than frozen “Trading / TradingLive ALLOW”                                             |
| Risk                      | High operational; may pressure unauthorized Vault changes                                      |

**Which purpose if B?** Repository evidence points to **TradingLive** (current `purposeForTradingEnvironment('live')`), not Trading. PO must still choose B explicitly — not auto-selected here.

### Other option

```text
No additional architecture option is required.
Options A and B cover the repository-grounded design space.
OPTION C (ambient "try Trading then TradingLive then use whichever exists
without vaultSecretId match") is REJECTED as non-deterministic fallback.
```

### Critical fallback analysis

| Scenario | Setup                                                                       | Deterministic governed behavior under Option A contract                                                     | Option B                                             |
| -------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1        | LIVE; Trading **and** TradingLive secrets exist as **different** Vault rows | Use the purpose whose metadata.id === `connection.vaultSecretId` only; never the sibling LIVE secret        | TradingLive only; Trading-referenced Connection DENY |
| 2        | LIVE; Trading absent; TradingLive exists                                    | ALLOW **iff** vaultSecretId matches TradingLive row; else DENY — **not** “fallback because Trading missing” | ALLOW iff id matches TradingLive                     |
| 3        | LIVE; Trading exists; TradingLive absent                                    | ALLOW **iff** vaultSecretId matches Trading; else DENY                                                      | DENY (unless id somehow TradingLive)                 |
| 4        | LIVE; only TradingTestnet exists                                            | **DENY**                                                                                                    | **DENY**                                             |
| 5        | TESTNET; Trading exists                                                     | **DENY**                                                                                                    | **DENY**                                             |
| 6        | TESTNET; TradingLive exists                                                 | **DENY**                                                                                                    | **DENY**                                             |
| 7        | TESTNET; TradingTestnet exists                                              | **ALLOW** subject to workspace/id/other checks                                                              | same                                                 |
| 8        | LIVE; wrong workspace credential                                            | **DENY**                                                                                                    | **DENY**                                             |
| 9        | LIVE; provider matches; purpose/env class mismatches                        | **FAIL CLOSED** — do not silently select another credential                                                 | **FAIL CLOSED**                                      |

```text
Fallback from TradingLive → Trading because TradingLive missing:
  NOT a free fallback — only id-matched allowlist membership (Option A)
  or DENY (Option B).

Fallback from LIVE → TradingTestnet:
  ALWAYS FORBIDDEN

"First valid credential wins":
  FORBIDDEN
```

### Determinism requirement

Policy must **not** depend on DB row order, creation time, network order, retry order, or “which secret happens to exist” without id binding.

If multiple LIVE-class secrets exist in a workspace, selection is solely by `connection.vaultSecretId` within the allowlist. Ambiguity (id not in allowlist slots) → **FAIL CLOSED**.

### Security analysis

| Control                       | Option A + id-match               | Option B        |
| ----------------------------- | --------------------------------- | --------------- |
| Model C                       | PASS                              | PASS (narrower) |
| ENV1                          | PASS                              | PASS            |
| EG1                           | Unaffected (origins CRED-04)      | Unaffected      |
| Workspace isolation           | PASS if workspaceId always passed | PASS            |
| Exact-purpose resolution      | PASS after selectedPurpose chosen | PASS            |
| No provider-only lookup       | Required by D-CONN-03-01          | Required        |
| No cross-environment fallback | PASS if Testnet excluded from P   | PASS            |
| Secret non-exposure           | Unchanged                         | Unchanged       |
| Fail-closed                   | Id miss / class mismatch DENY     | DENY            |
| C7 / FIV safety               | Unchanged DENY-ALL / no I/O       | Unchanged       |

```text
FORBIDDEN REMAINS:
  LIVE → TradingTestnet
  TESTNET → Trading
  TESTNET → TradingLive
  LIVE → arbitrary testnet credential
```

### Decision matrix (D-CONN-03-02)

| Connection environment  | Vault purpose  | Candidate policy result                                          |
| ----------------------- | -------------- | ---------------------------------------------------------------- |
| LIVE                    | Trading        | **OPEN — PO DECISION** (A: ALLOW if id-matched; B: DENY)         |
| LIVE                    | TradingLive    | **OPEN — PO DECISION** (A/B: ALLOW if id-matched / exact)        |
| LIVE                    | TradingTestnet | **DENY**                                                         |
| TESTNET                 | Trading        | **DENY**                                                         |
| TESTNET                 | TradingLive    | **DENY**                                                         |
| TESTNET                 | TradingTestnet | **ALLOW** (subject to other checks)                              |
| NULL                    | Trading        | **OPEN — D-CONN-03-03**                                          |
| NULL                    | TradingLive    | **OPEN — D-CONN-03-03**                                          |
| NULL                    | TradingTestnet | **DENY**                                                         |
| wrong workspace         | any            | **DENY**                                                         |
| provider-only lookup    | n/a            | **FORBIDDEN / DENY**                                             |
| client-supplied purpose | n/a            | **FORBIDDEN / DENY** (D-CONN-03-05 still open; principle intact) |

LIVE + Trading / TradingLive are **not** marked ALLOW as frozen.

### Future test matrix (implementation later)

1. LIVE + Trading (id-matched)
2. LIVE + TradingLive (id-matched)
3. LIVE + TradingTestnet → DENY
4. TESTNET + Trading → DENY
5. TESTNET + TradingLive → DENY
6. TESTNET + TradingTestnet → ALLOW
7. Multiple LIVE-purpose credentials in workspace; Connection bound to one → only that one used
8. Missing Trading with TradingLive present → id-match only (no free fallback)
9. Missing TradingLive with Trading present → id-match only under A; DENY under B
10. Wrong workspace → DENY
11. Wrong provider / vaultSecretId mismatch → DENY
12. Provider-only lookup → DENY
13. Client-supplied purpose → rejected
14. Deterministic resolution (probe order independence under id-match)
15. Ambiguity (id not in allowlist) → FAIL CLOSED
16. Secret non-leakage
17. No external venue calls

### Cross-decision dependencies (at time of D-CONN-03-02 support)

```text
D-CONN-03-01: FROZEN — APPROVED OPTION A
D-CONN-03-02: FROZEN — APPROVED OPTION A   (recorded this session)
D-CONN-03-03: OPEN
D-CONN-03-04: OPEN
D-CONN-03-05: OPEN
```

### Recommended for PO/Governance consideration (historical — superseded)

```text
RECOMMENDED FOR PO/GOVERNANCE CONSIDERATION:
OPTION A
  — LIVE-class allowlist {Trading, TradingLive}
  — TESTNET-class {TradingTestnet}
  — deterministic vaultSecretId-matched resolution within allowlist
  — NEVER ambient cascade; NEVER Testnet on LIVE path
```

### PO/Governance status

```text
PO/GOVERNANCE APPROVAL: GRANTED (this session)
Status: FROZEN — APPROVED OPTION A
See section "D-CONN-03-02 — PO DECISION" above.
```

---

## D-CONN-03-03 — PO DECISION

```text
Status:                         FROZEN
Decision:                       APPROVED — OPTION B
Decision authority:             PO / Governance
Implementation authorization:   NOT GRANTED
```

### Exact frozen decision

```text
For EXCHANGE Connections, validate/handshake/capability MUST FAIL CLOSED while
Connection.environment IS NULL. Non-EXCHANGE NULL behavior may continue where
already supported by the domain. NULL MUST NEVER equal LIVE. A NULL EXCHANGE
Connection MUST NOT perform omit-purpose Trading retrieval. No backfill or
environment mutation is performed by FIV-CONN-03.
```

### Required properties (frozen)

1. EXCHANGE + NULL environment: **FAIL CLOSED** for trading credential validation/handshake/capability.
2. Non-EXCHANGE + NULL: may continue according to existing domain behavior.
3. NULL is not LIVE.
4. NULL cannot authorize Trading.
5. NULL cannot authorize TradingLive.
6. NULL cannot authorize TradingTestnet.
7. No omit-purpose Trading retrieval for NULL EXCHANGE.
8. No provider-only lookup.
9. No sibling-secret substitution.
10. No cross-environment fallback.
11. No client-controlled purpose.
12. No backfill in FIV-CONN-03.
13. No schema/migration changes as part of this decision.
14. Future FIV-CONN-04 backfill remains separately governed.

```text
This freezes the POLICY ONLY.
It does NOT authorize implementation.
It does NOT freeze D-CONN-03-05.
It does NOT create the full five-decision freeze artifact.
```

### Prior decision support (retained for audit)

The Option A/B analysis for NULL-environment behavior remains below for history. **PO selected OPTION B.**

---

## D-CONN-03-03 — DECISION SUPPORT (historical)

```text
Status: SUPERSEDED BY PO DECISION ABOVE — was OPEN; now FROZEN OPTION B
```

### Question

How should the governed EXCHANGE Connection validate / handshake / capability path behave when:

```text
Connection.environment IS NULL
```

Frozen constraint:

```text
NULL != LIVE
The system MUST NOT silently interpret NULL as LIVE.
NULL is not a credential class.
```

### Repository evidence

| #   | Finding                                                                | Evidence                                                                                                     |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | `environment` column is nullable                                       | CONN-01 migration; schema `String?`; no CONN-04 backfill yet                                                 |
| 2   | New EXCHANGE creates require `live`\|`testnet`                         | `resolveConnectionEnvironmentForCreate` — omit/demo rejected                                                 |
| 3   | Notification/AI creates may keep `environment = null`                  | CONN-01 tests; single-purpose Vault types                                                                    |
| 4   | Legacy EXCHANGE NULL rows still exist                                  | CONN-02 audits observed NULL EXCHANGE groups; Strategy B excludes `environment IS NULL`                      |
| 5   | Rename/status ops tolerate NULL                                        | Environment immutable; not rewritten                                                                         |
| 6   | `vaultPurposeForConnection` returns `undefined` when env not populated | Omit-purpose → Vault `Trading` default **today**                                                             |
| 7   | EXCHANGE validate → handshake/capability currently omit purpose        | Environment lost; retrieve defaults to `Trading` — **implicit LIVE-class retrieve hazard for NULL EXCHANGE** |
| 8   | Slot check with NULL env does not filter by environment                | `assertCredentialSlotAvailable` only adds env predicate when non-null                                        |
| 9   | Slot probe for NULL EXCHANGE uses omit-purpose path                    | `vaultPurposesToProbe` returns `null` → omit-purpose get                                                     |
| 10  | NULL is transitional for EXCHANGE until FIV-CONN-04 backfill           | Parent freeze D-CRED-02-04/05; CONN-04 owns backfill                                                         |
| 11  | Non-EXCHANGE NULL is normal/permanent for notification/AI              | Not multi-env; not a trading credential class                                                                |
| 12  | UI hardcodes `environment: 'live'` on EXCHANGE create                  | CRED-05; does not create new NULL EXCHANGE via UI                                                            |

**Interpretation:** NULL is an **incomplete EXCHANGE environment state** (legacy) or a **non-trading normal omit** (notification/AI). It must not become a credential-selection mechanism. Today's NULL EXCHANGE validate path effectively retrieves omit-purpose `Trading` — that is the hazard D-CONN-03-03 must close without calling NULL “LIVE”.

### Option A — FAIL CLOSED for governed EXCHANGE validation when environment is NULL

```text
EXCHANGE + environment IS NULL
  → reject / FAIL CLOSED on validate → handshake → capability
  → no Vault trading credential retrieve
  → NULL never interpreted as LIVE
```

| Dimension            | Assessment                                                             |
| -------------------- | ---------------------------------------------------------------------- |
| Security             | Strongest for EXCHANGE; removes NULL omit-purpose Trading retrieve     |
| Model C              | Compatible — no env means no eligible purpose class                    |
| D-CONN-03-01         | Compatible — no omit-purpose on governed path                          |
| D-CONN-03-02         | Compatible — no LIVE-class allowlist selection without env             |
| Existing data        | NULL EXCHANGE credentialed rows cannot validate until CONN-04 backfill |
| Operational          | List/rename/disable/revoke may remain; CONNECT blocked                 |
| FIV-CONN-04          | Dependency: backfill restores validate for unambiguous LIVE rows       |
| FIV-CONN-05          | UI must not reinterpret NULL as LIVE                                   |
| Testability          | High                                                                   |
| Complexity           | Low                                                                    |
| Accidental LIVE risk | **Lowest**                                                             |

### Option B — Non-EXCHANGE / non-credentialed behavior allowed; EXCHANGE trading credential validate FAIL CLOSED while NULL

```text
Non-EXCHANGE (notification/AI) with NULL env:
  may continue non-trading flows as today (local validate with type-default purpose)

EXCHANGE with NULL env:
  any trading credential validate / handshake / capability → FAIL CLOSED
  no trading credential retrieve

Metadata-only EXCHANGE (NULL env, no vaultSecretId):
  validate still FAIL CLOSED (nothing to authorize safely)
```

| Dimension            | Assessment                                                                |
| -------------------- | ------------------------------------------------------------------------- |
| Security             | Same EXCHANGE trading safety as A; preserves legitimate NULL non-EXCHANGE |
| Model C / 01 / 02    | Compatible                                                                |
| Existing data        | Same EXCHANGE impact as A; notification/AI unaffected                     |
| Operational          | Better than a naive “all Connections reject” reading of A                 |
| FIV-CONN-04 / 05     | Same as A                                                                 |
| Accidental LIVE risk | **Lowest** for trading paths                                              |

### Option C — Other

```text
No additional option required.

REJECTED (must not be approved):
  - Treat NULL as LIVE for retrieve
  - Allow omit-purpose Trading retrieve for NULL EXCHANGE as continuity exception
    (conflicts with frozen D-CONN-03-01 omit-purpose prohibition on governed path)
  - Allow TradingTestnet for NULL
  - Provider-only sibling substitution while NULL
```

### Critical NULL scenarios

| Scenario | Setup                                           | Policy status                                                                                                             |
| -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1        | NULL + Vault Trading                            | **OPEN — PO DECISION REQUIRED** (A/B: DENY trading validate; never identity=LIVE)                                         |
| 2        | NULL + Vault TradingLive                        | **OPEN — PO DECISION REQUIRED** (A/B: DENY trading validate)                                                              |
| 3        | NULL + Vault TradingTestnet                     | **DENY / FAIL CLOSED**                                                                                                    |
| 4        | NULL + no credential                            | **OPEN — PO DECISION REQUIRED** (recommend: reject EXCHANGE validate; non-EXCHANGE unchanged under B)                     |
| 5        | NULL later backfilled to LIVE by CONN-04        | Must preserve safe transition: current NULL behavior must not invent LIVE identity; after backfill, D-CONN-03-01/02 apply |
| 6        | NULL + client purpose=Trading                   | **FORBIDDEN** (client-controlled purpose)                                                                                 |
| 7        | NULL + provider matches another LIVE Connection | No provider-only lookup; no sibling-secret substitution                                                                   |

### NULL must not become a credential class

```text
NULL is NOT:
  LIVE | TESTNET | Trading | TradingLive | TradingTestnet

NULL is:
  incomplete / unresolved EXCHANGE environment state
  OR normal omit for non-multi-env Connection types
```

### Security analysis

| Requirement                                  | A                         | B                 |
| -------------------------------------------- | ------------------------- | ----------------- |
| NULL ≠ LIVE                                  | PASS                      | PASS              |
| Model C                                      | PASS                      | PASS              |
| Exact Connection credential binding          | PASS (no retrieve)        | PASS for EXCHANGE |
| vaultSecretId separation                     | PASS                      | PASS              |
| Workspace / provider / environment isolation | PASS                      | PASS              |
| No provider-only lookup                      | PASS                      | PASS              |
| No client-controlled purpose                 | PASS                      | PASS              |
| No sibling-secret substitution               | PASS                      | PASS              |
| No cross-environment fallback                | PASS                      | PASS              |
| Fail-closed unsafe credential use            | PASS                      | PASS              |
| Secret non-exposure                          | PASS                      | PASS              |
| Non-EXCHANGE continuity                      | May over-block if misread | **PASS**          |

### FIV-CONN-04 dependency

```text
FIV-CONN-04 owns LIVE backfill / EXCHANGE NOT NULL / audit / quarantine.
D-CONN-03-03 MUST NOT perform backfill or rewrite environment.
If PO chooses A or B, NULL EXCHANGE trading validate remains blocked until
CONN-04 assigns an explicit environment (expected: live for unambiguous rows).
Document as dependency — do not implement here.
```

Note: Task text mentioning “FIV-CONN-04 owns LIVE origin management” is out of band for this decision; **origins remain FIV-CRED-04**. CONN-04 ownership here is **backfill / NOT NULL**.

### FIV-CONN-05 boundary

```text
UI / Testnet operator flow remains FIV-CRED-05 / FIV-CONN-05 scope.
UI must not reinterpret NULL as LIVE.
No UI implementation in this act.
```

### Decision matrix (D-CONN-03-03)

| Connection environment | Vault purpose  | D-CONN-03-03 policy                   |
| ---------------------- | -------------- | ------------------------------------- |
| NULL                   | Trading        | **OPEN**                              |
| NULL                   | TradingLive    | **OPEN**                              |
| NULL                   | TradingTestnet | **DENY**                              |
| LIVE                   | Trading        | governed by **D-CONN-03-02** (FROZEN) |
| LIVE                   | TradingLive    | governed by **D-CONN-03-02** (FROZEN) |
| LIVE                   | TradingTestnet | **DENY**                              |
| TESTNET                | Trading        | **DENY**                              |
| TESTNET                | TradingLive    | **DENY**                              |
| TESTNET                | TradingTestnet | **ALLOW**                             |

NULL + Trading / TradingLive are **not** marked approved.

### Future test matrix

1. NULL + Trading → EXCHANGE trading validate DENY (once frozen)
2. NULL + TradingLive → DENY
3. NULL + TradingTestnet → DENY
4. NULL + no credential → EXCHANGE validate reject
5. NULL + provider-only lookup attempt → DENY
6. NULL + client-supplied purpose → rejected
7. NULL + wrong workspace → DENY
8. NULL + wrong provider → DENY
9. NULL → future LIVE backfill compatibility (no identity invention before backfill)
10. validate path
11. handshake path
12. capability path
13. no implicit LIVE behavior
14. no sibling-secret substitution
15. no secret leakage
16. regression D-CONN-03-01
17. regression D-CONN-03-02
18. Non-EXCHANGE NULL local validate still works (if Option B frozen)

No external venue calls.

### Recommended for PO/Governance consideration

```text
RECOMMENDED FOR PO/GOVERNANCE CONSIDERATION:
OPTION B
  — EXCHANGE trading credential validate/handshake/capability FAIL CLOSED while environment IS NULL
  — non-EXCHANGE / non-trading NULL behavior may continue
  — NULL never equals LIVE
  — no omit-purpose Trading retrieve for NULL EXCHANGE
  — no backfill in CONN-03

OPTION A
  — acceptable if interpreted as EXCHANGE-scoped only (same trading outcome as B)

REJECTED:
  NULL → LIVE
  omit-purpose Trading continuity for NULL EXCHANGE
  TradingTestnet for NULL
```

```text
PO/GOVERNANCE APPROVAL: GRANTED (this session)
Status: FROZEN — APPROVED OPTION B
See section "D-CONN-03-03 — PO DECISION" above.
```

---

## D-CONN-03-04 — PO DECISION

```text
Status:                         FROZEN
Decision:                       APPROVED — OPTION A
Decision authority:             PO / Governance
Implementation authorization:   NOT GRANTED
```

### Exact frozen decision

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

### Required properties (frozen)

1. Actual Vault SecretPurpose must be verified.
2. Connection.environment alone is not sufficient proof of the actual secret's purpose.
3. The check must occur before credential use.
4. No mismatched credential may reach handshake.
5. No mismatched credential may reach capability.
6. Bind-time store/replace validation is preferred where applicable.
7. Capability should reuse the governed validation/helper rather than creating an independent credential resolution mechanism.
8. No sibling-secret substitution.
9. No provider-only lookup.
10. No cross-environment fallback.
11. No client-controlled purpose.
12. NULL EXCHANGE behavior remains governed by D-CONN-03-03.
13. LIVE dual-purpose behavior remains governed by D-CONN-03-02.

```text
This freezes the GOVERNANCE POLICY ONLY.
It does NOT authorize implementation.
It does NOT freeze D-CONN-03-05.
It does NOT create the full five-decision freeze artifact.
```

### Prior decision support (retained for audit)

The Option A/B timing analysis remains below for history. **PO selected OPTION A.**

---

## D-CONN-03-04 — DECISION SUPPORT (historical)

```text
Status: SUPERSEDED BY PO DECISION ABOVE — was OPEN; now FROZEN OPTION A
```

### Question

At what exact points must the system enforce:

```text
Connection.environment
        ↕
Vault SecretPurpose
```

so that Model C remains fail closed and an incorrect-purpose credential cannot reach validate use / handshake / capability?

### Repository evidence (current path)

```text
ConnectionsService.validate
  → getRow (environment + vaultSecretId available)
  → EXCHANGE: completeExchangeHandshake
       → handshake.perform({ workspaceId, provider, vaultSecretId })  // env/purpose LOST
            → vault.get({ workspaceId, type })   // omit purpose → Trading
            → check metadata.id === vaultSecretId
            → vault.retrieve({ workspaceId, type })  // omit purpose
            → adapter.handshake(credentials)         // USE
       → on CONNECTED: capabilities.verify({ … vaultSecretId })
            → same omit-purpose get/retrieve → USE
```

| #   | Finding                                                                       | Evidence                                        |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | `environment` + `vaultSecretId` available on Connection row at validate start | `validate()` / `getRow`                         |
| 2   | Purpose resolved only for store/replace/revoke/local validate today           | `vaultPurposeForConnection`                     |
| 3   | EXCHANGE handshake/capability omit purpose                                    | handshake/capability services                   |
| 4   | No Model C `tradingEnvironmentFromPurpose` check in Connections module        | grep: absent                                    |
| 5   | Id check exists after get, before retrieve                                    | `metadata.id !== vaultSecretId` → fail          |
| 6   | Handshake can run without environment/purpose mismatch check                  | current flow                                    |
| 7   | Capability can run after handshake without separate Model C gate              | current flow                                    |
| 8   | NULL EXCHANGE still reaches handshake today                                   | until D-CONN-03-03 implemented                  |
| 9   | No sibling-secret search at use time today                                    | id check only; omit-purpose is different hazard |
| 10  | Store writes exact purpose for populated env                                  | CONN-02                                         |

### Distinctions (mandatory)

| Stage                    | Meaning                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| A. Credential lookup     | Find Connection + `vaultSecretId` reference                             |
| B. Credential retrieval  | Vault get/retrieve of the referenced secret + purpose metadata          |
| C. Credential validation | Model C: env class ↔ actual SecretPurpose; id/workspace/provider checks |
| D. Credential use        | Permit credentials into handshake/capability adapters                   |
| E. Handshake             | Provider connectivity proof                                             |
| F. Capability            | Post-handshake capability verify                                        |

**Hard requirement:** Invalid environment/purpose relationship must not reach **D/E/F**.

### Option A — Enforce Model C before credential use (actual purpose verified before handshake/capability)

```text
Connection context
  → D-CONN-03-03: if EXCHANGE && env NULL → FAIL CLOSED (no retrieve)
  → D-CONN-03-01/02: resolve purpose via vaultSecretId within env allowlist
  → vault.get(purpose-bound) + id match
  → verify tradingEnvironmentFromPurpose(actualPurpose) === connection.environment
  → only then vault.retrieve + handshake/capability
```

Also strongly preferred at **store/replace** bind time (write purpose must match Connection env class) so bad binds fail early.

| Dimension                 | Assessment                                                          |
| ------------------------- | ------------------------------------------------------------------- |
| Security                  | Blocks use of mismatched purpose; actual purpose checked before use |
| Duplication               | Low if shared helper; store gate optional-but-preferred             |
| Consistency with 01/02/03 | Direct                                                              |
| Complexity                | Moderate                                                            |
| Risk                      | Low if actual-purpose check is mandatory (not expected-only)        |

### Option B — Enforce at every governed boundary

```text
1. Before retrieval where expected purpose class is known (gate NULL; select allowlist)
2. Immediately after Vault get using actual SecretPurpose metadata
3. Before handshake/use
4. Before capability/use
```

Must reuse one shared Model C assert to avoid divergent policy. Should **not** re-retrieve secrets at each step.

| Dimension             | Assessment                                  |
| --------------------- | ------------------------------------------- |
| Security              | Defense in depth                            |
| Duplication           | Higher call-site count; OK if single helper |
| Risk of inconsistency | Medium if copy-pasted checks differ         |
| Complexity            | Higher than A                               |

### Option C — Other

```text
No additional architecture required.

REJECTED:
  - Expected-purpose-only checks without verifying actual Vault purpose
  - Store-only enforcement (leaves validate path open)
  - Post-handshake-only checks (too late — credential already used)
  - Sibling-secret search to “find a matching purpose”
```

### Pre-retrieval analysis

`Connection.environment` yields an **expected purpose class** (LIVE allowlist vs TESTNET singleton) under D-CONN-03-02. Pre-retrieval gates should:

- FAIL CLOSED if EXCHANGE env NULL (D-CONN-03-03)
- FAIL CLOSED if `vaultSecretId` missing
- Select the Vault slot by **id-matched** purpose within allowlist (not ambient)

**Expected purpose alone is not sufficient** to prove the bound secret is correct.

### Post-retrieval analysis

After `vault.get` returns metadata for the id-matched slot:

```text
actualPurpose = metadata.purpose
assert tradingEnvironmentFromPurpose(actualPurpose) === connection.environment
assert metadata.id === connection.vaultSecretId
assert workspace/type/provider consistent
```

Only then retrieve plaintext and allow use. This is the strongest Model C control because it uses the **actual** Vault SecretPurpose.

### Handshake safety

Required conceptual sequence:

```text
Connection context
→ derive expected environment/purpose class
→ resolve exact vaultSecretId within allowlist
→ retrieve actual secret metadata
→ verify Model C (actual purpose)
→ only then permit handshake
```

No handshake with mismatched credential.

### Capability safety

Capability MUST use the same purpose-bound, Model-C-verified credential context as handshake. It must not:

- omit purpose
- re-resolve by provider only
- substitute a sibling LIVE secret
- bypass NULL EXCHANGE fail-closed

### Error / fail-closed semantics

| Condition                          | Required behavior                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| Missing environment (EXCHANGE)     | FAIL CLOSED (D-CONN-03-03) — no retrieve                                     |
| Missing vaultSecretId              | Existing Conflict — credentials not stored                                   |
| Missing Vault secret / id mismatch | FAIL CLOSED / VALIDATION_FAILED                                              |
| Wrong workspace                    | DENY (ACL + workspaceId)                                                     |
| Wrong provider / type              | DENY                                                                         |
| Wrong purpose / env class mismatch | FAIL CLOSED before use                                                       |
| Stale/revoked credential           | Existing status/revoke semantics — fail closed for validate when not allowed |
| Malformed / unexpected purpose     | FAIL CLOSED                                                                  |
| Handshake attempted after mismatch | Must be unreachable if gates hold                                            |

Reuse existing Conflict / VALIDATION_FAILED patterns; do not invent new public error taxonomy unless Architecture Review requires it.

### Security matrix

| Environment                 | Actual Vault Purpose | Expected                             |
| --------------------------- | -------------------- | ------------------------------------ |
| LIVE                        | Trading              | governed LIVE policy (D-CONN-03-02)  |
| LIVE                        | TradingLive          | governed LIVE policy (D-CONN-03-02)  |
| LIVE                        | TradingTestnet       | **DENY**                             |
| TESTNET                     | Trading              | **DENY**                             |
| TESTNET                     | TradingLive          | **DENY**                             |
| TESTNET                     | TradingTestnet       | **ALLOW**                            |
| NULL                        | Trading              | **DENY for EXCHANGE** (D-CONN-03-03) |
| NULL                        | TradingLive          | **DENY for EXCHANGE** (D-CONN-03-03) |
| NULL                        | TradingTestnet       | **DENY**                             |
| wrong workspace             | any                  | **DENY**                             |
| wrong provider              | any                  | **DENY**                             |
| wrong vaultSecretId         | any                  | **DENY**                             |
| provider-only lookup        | n/a                  | **FORBIDDEN / DENY**                 |
| sibling-secret substitution | n/a                  | **FORBIDDEN / DENY**                 |

### Future test matrix

1. Expected purpose derivation
2. Actual SecretPurpose verification
3. LIVE + Trading
4. LIVE + TradingLive
5. LIVE + TradingTestnet → DENY
6. TESTNET + Trading → DENY
7. TESTNET + TradingLive → DENY
8. TESTNET + TradingTestnet → ALLOW
9. NULL + Trading → EXCHANGE DENY
10. NULL + TradingLive → EXCHANGE DENY
11. NULL + TradingTestnet → DENY
12. Wrong workspace
13. Wrong provider
14. Wrong vaultSecretId
15. Provider-only lookup rejection
16. Sibling-secret substitution rejection
17. Handshake blocked on mismatch
18. Capability blocked on mismatch
19. No secret leakage
20. Deterministic vaultSecretId binding
21. Regression D-CONN-03-01
22. Regression D-CONN-03-02
23. Regression D-CONN-03-03

No external venue calls.

### Cross-decision dependencies

```text
D-CONN-03-01: FROZEN — APPROVED OPTION A
D-CONN-03-02: FROZEN — APPROVED OPTION A
D-CONN-03-03: FROZEN — APPROVED OPTION B
D-CONN-03-04: OPEN
D-CONN-03-05: OPEN
Full five-decision freeze: NOT CREATED
```

### Recommended for PO/Governance consideration (historical — superseded)

```text
RECOMMENDED FOR PO/GOVERNANCE CONSIDERATION:
OPTION A as the minimum mandatory use-path gate:
  actual Vault SecretPurpose verified against Connection.environment
  BEFORE handshake/capability credential use
  (plus D-CONN-03-03 NULL gate before any EXCHANGE retrieve)

WITH PREFERRED ADDITIONS (may be folded into Option A freeze text):
  - store/replace bind-time Model C gate
  - shared helper reused at capability (Option B-style depth without duplicate retrieval)

REJECTED:
  expected-purpose-only without actual-purpose verification
  store-only / post-handshake-only enforcement
  sibling-secret search
```

### PO/Governance status

```text
PO/GOVERNANCE APPROVAL: GRANTED (this session)
Status: FROZEN — APPROVED OPTION A
See section "D-CONN-03-04 — PO DECISION" above.
```

---

## D-CONN-03-05 — DECISION SUPPORT

```text
Status: OPEN — PO APPROVAL REQUIRED
Depends on: D-CONN-03-01…04 FROZEN
Does NOT freeze client-purpose prohibition in this act.
```

### Question

Should `SecretPurpose` or any equivalent credential-purpose selector be exposed as a **client-authoritative** input?

```text
Security objective:
  The client MUST NOT select which Vault credential purpose is used.
  The server derives expected purpose from trusted Connection context.
```

### Repository evidence

| #   | Finding                                                | Evidence                                                                                                           |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 1   | No DTO accepts `SecretPurpose` / `purpose`             | `connections.dto.ts` — create has `environment?` only; store has `credentials` only; rename has `displayName` only |
| 2   | No Connections HTTP API accepts purpose                | Controller create/store/replace/validate — no purpose param                                                        |
| 3   | No handshake/capability HTTP purpose field             | Internal services; request types have no purpose today (to be added server-side under 01)                          |
| 4   | Web connections UI has no purpose field                | `apps/web/src/connections` — no purpose matches                                                                    |
| 5   | Purpose is server-derived from Connection row          | `vaultPurposeForConnection(connection)`                                                                            |
| 6   | Client may supply `environment` **only at create**     | `CreateConnectionMetadataDto.environment?`; EXCHANGE required; immutable after create                              |
| 7   | Environment immutability protects post-create path     | Rename does not accept environment                                                                                 |
| 8   | Client cannot supply `vaultSecretId`                   | Not in DTOs; set only from Vault store metadata id                                                                 |
| 9   | Internal Vault APIs accept optional purpose            | Server-to-Vault only — not client authoritative                                                                    |
| 10  | Slot probe multi-purpose is server conflict check only | Not client-driven search                                                                                           |
| 11  | Handshake currently omits purpose                      | Residual implementation gap; not a client purpose API                                                              |

**Interpretation:** Client-authoritative purpose is **not currently exposed**. D-CONN-03-05 freezes that it must **remain** non-authoritative (and that sneaked body fields must not become authority).

### Option A — Purpose never exposed as client-authoritative API input

```text
Server derives expected SecretPurpose from trusted Connection.environment
+ vaultSecretId-bound resolution (D-CONN-03-01/02/04).
No public purpose field on Connections APIs.
```

| Dimension                                   | Assessment                |
| ------------------------------------------- | ------------------------- |
| Credential-selection authority              | Server-only               |
| Privilege escalation                        | Lowest                    |
| LIVE/TESTNET isolation                      | Preserved                 |
| Model C / workspace / provider / id binding | Compatible                |
| Environment immutability                    | Complements               |
| API abuse / tampering                       | No purpose attack surface |
| Auditability / testability                  | High                      |
| Backwards compatibility                     | Matches current API       |

### Option B — Purpose may exist as internal server-side value; never client-authoritative

```text
Internal helpers/services may pass purpose.
Any externally supplied purpose is ignored or rejected (never authoritative).
```

| Dimension                | Assessment                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Difference vs A          | Implementation detail: A forbids public field; B allows internal params + reject/ignore sneaked fields |
| Security                 | Equivalent if reject/ignore is strict                                                                  |
| Recommended relationship | **B is a refinement of A**, not an alternative that weakens A                                          |

### Option C — Other

```text
REJECTED:
  Optional client purpose as authoritative selector
  Client purpose that overrides Connection.environment
  Client purpose that selects sibling vaultSecretId
```

### Client authority boundary

```text
CLIENT-AUTHORITATIVE (allowed where API already permits):
  displayName, provider (at create), credentials (write-only),
  environment at create only (EXCHANGE live|testnet)

SERVER-DERIVED SECURITY CONTEXT (client MUST NOT be authority):
  SecretPurpose / credential class
  credential environment class beyond trusted Connection.environment
  vaultSecretId selection / sibling selection
  Vault slot search / provider-only fallback
```

Client must not replace `Connection.environment` with `SecretPurpose` or use purpose as an alternate environment selector.

### Attack scenarios

| Scenario | Client action                     | Expected                                                            |
| -------- | --------------------------------- | ------------------------------------------------------------------- |
| 1        | TESTNET + purpose=Trading         | DENY / ignore / reject — no LIVE credentials                        |
| 2        | LIVE + purpose=TradingTestnet     | DENY — no TESTNET credentials                                       |
| 3        | LIVE + purpose=TradingLive        | Must not select sibling secret; vaultSecretId remains authoritative |
| 4        | LIVE + vaultSecretId=other        | DENY (not client-settable)                                          |
| 5        | TESTNET + provider-only selection | DENY                                                                |
| 6        | Unknown purpose                   | No credential-selection authority                                   |
| 7        | Omits purpose                     | Normal server-derived behavior                                      |
| 8        | Internal server-derived purpose   | Allowed under server contract + Model C                             |

### API / DTO review

| Artifact                                      | Client purpose?        | Notes                                         |
| --------------------------------------------- | ---------------------- | --------------------------------------------- |
| `CreateConnectionMetadataDto`                 | No                     | `environment?` only                           |
| `RenameConnectionMetadataDto`                 | No                     | displayName only                              |
| `StoreConnectionCredentialsDto`               | No                     | credentials object only                       |
| Connections controller validate/store/replace | No                     | path id + auth context                        |
| Handshake/capability request types            | No purpose field today | Future internal purpose under 01 — not client |
| Web ConnectionsPage                           | No purpose             | Hardcodes live on create                      |

If a sneaked `purpose` field appears in a future body, policy requires **reject or ignore** (never authority). Do not remove anything in this governance act.

### Security analysis

| Control                                   | A         | B                     |
| ----------------------------------------- | --------- | --------------------- |
| Client not credential-selection authority | PASS      | PASS if ignore/reject |
| LIVE/TESTNET isolation                    | PASS      | PASS                  |
| Model C                                   | PASS      | PASS                  |
| vaultSecretId binding                     | PASS      | PASS                  |
| Sibling / provider-only / cross-env       | FORBIDDEN | FORBIDDEN             |
| Parameter tampering                       | No field  | Must strip/reject     |

### Decision matrix

| Client input           | Connection environment | Actual purpose | Expected                                                                   |
| ---------------------- | ---------------------- | -------------- | -------------------------------------------------------------------------- |
| omitted                | LIVE                   | Trading        | governed LIVE policy                                                       |
| omitted                | LIVE                   | TradingLive    | governed LIVE policy                                                       |
| omitted                | LIVE                   | TradingTestnet | DENY                                                                       |
| purpose=Trading        | TESTNET                | Trading        | **OPEN — PO DECISION** (DENY / ignore / reject — client not authoritative) |
| purpose=TradingLive    | TESTNET                | TradingLive    | **OPEN — PO DECISION** (client not authoritative)                          |
| purpose=TradingTestnet | LIVE                   | TradingTestnet | DENY                                                                       |
| purpose=TradingLive    | LIVE                   | TradingLive    | governed by vaultSecretId binding; client input not authoritative          |
| purpose=unknown        | LIVE                   | any            | no client authority                                                        |
| vaultSecretId=sibling  | LIVE                   | valid sibling  | DENY                                                                       |

### Future test matrix

1. client purpose=Trading on TESTNET
2. client purpose=TradingLive on TESTNET
3. client purpose=TradingTestnet on LIVE
4. client purpose=TradingLive on LIVE with sibling secret
5. client-supplied vaultSecretId
6. provider-only lookup
7. omitted purpose
8. unknown purpose
9. internal server-derived purpose
10. wrong workspace
11. wrong provider
12. environment tampering
13. Model C mismatch
14. no secret leakage
15. handshake path
16. capability path
    17–20. regression D-CONN-03-01…04

No external venue calls.

### Cross-decision consistency (01–05 chain)

```text
D-CONN-03-01: Server derives purpose; pass through validate→handshake→capability
D-CONN-03-02: LIVE {Trading,TradingLive}; TESTNET {TradingTestnet}; id-bound; no fallback
D-CONN-03-03: EXCHANGE+NULL FAIL CLOSED; non-EXCHANGE NULL may continue; NULL≠LIVE
D-CONN-03-04: Actual Vault purpose vs Connection.environment before use
D-CONN-03-05: Client MUST NOT be authoritative for SecretPurpose (OPEN)
```

Collective chain:

```text
Connection → trusted environment → expected purpose class
→ exact vaultSecretId → actual Vault secret → actual SecretPurpose
→ Model C → credential use → handshake/capability
```

No client input may bypass this chain.

### Recommended for PO/Governance consideration

```text
RECOMMENDED FOR PO/GOVERNANCE CONSIDERATION:
OPTION A
  — Purpose never exposed as client-authoritative API input

WITH OPTION B AS IMPLEMENTATION DETAIL:
  — Internal server-side purpose parameters allowed
  — Any externally supplied purpose ignored or rejected (never authoritative)

OPTION C (client-authoritative purpose):
  REJECTED — do not approve

Difference A vs B:
  A = public contract: no purpose field / no client authority
  B = defensive implementation: even if a purpose key is smuggled in a body,
      it must not become credential-selection authority
```

```text
PO/GOVERNANCE APPROVAL REQUIRED: YES
Status: OPEN — NOT FROZEN
```

---

## Cross-Decision Consistency

With **D-CONN-03-01…04 frozen**, if PO freezes **05=A** (or A+B defensive), the composition guarantees:

| Guarantee                                           | How                         |
| --------------------------------------------------- | --------------------------- |
| LIVE → LIVE purpose only (id-bound)                 | 01+02+04                    |
| TESTNET → TESTNET purpose only                      | 01+02+04                    |
| NULL EXCHANGE → no trading credential use           | 03                          |
| NULL ≠ LIVE                                         | 03                          |
| Actual purpose verified before handshake/capability | 04                          |
| Client cannot select Vault purpose                  | 05 (OPEN — recommended A/B) |
| Provider-only / sibling-secret fallback forbidden   | 01+02+04+05                 |

**Inconsistency warnings for PO:**

1. Approving client-authoritative purpose (05 Option C) would bypass 01–04.
2. Allowing client purpose to pick between Trading/TradingLive would violate D-CONN-03-02 id-binding.
3. Implementing 01–04 without freezing 05 leaves a future API-expansion risk if purpose is added carelessly.

## Security Matrix

| Connection environment                | Vault purpose  | Expected result                                 |
| ------------------------------------- | -------------- | ----------------------------------------------- |
| LIVE                                  | Trading        | governed by **D-CONN-03-02** (FROZEN)           |
| LIVE                                  | TradingLive    | governed by **D-CONN-03-02** (FROZEN)           |
| LIVE                                  | TradingTestnet | **DENY**                                        |
| TESTNET                               | Trading        | **DENY**                                        |
| TESTNET                               | TradingLive    | **DENY**                                        |
| TESTNET                               | TradingTestnet | **ALLOW**                                       |
| NULL                                  | Trading        | **DENY for EXCHANGE** (**D-CONN-03-03** FROZEN) |
| NULL                                  | TradingLive    | **DENY for EXCHANGE** (**D-CONN-03-03** FROZEN) |
| NULL                                  | TradingTestnet | **DENY**                                        |
| wrong workspace                       | any            | **DENY**                                        |
| wrong provider / wrong vaultSecretId  | any            | **DENY**                                        |
| provider-only lookup                  | n/a            | **FORBIDDEN / DENY**                            |
| sibling-secret substitution           | n/a            | **FORBIDDEN / DENY**                            |
| client-supplied purpose               | n/a            | **FORBIDDEN / DENY**                            |
| mismatch reaches handshake/capability | n/a            | **DENY before use** (**D-CONN-03-04** FROZEN)   |

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
D-CONN-03-01: FROZEN — APPROVED OPTION A
D-CONN-03-02: FROZEN — APPROVED OPTION A
D-CONN-03-03: FROZEN — APPROVED OPTION B
D-CONN-03-04: FROZEN — APPROVED OPTION A
D-CONN-03-05: OPEN

Full five-decision freeze artifact: NOT CREATED
Reason: D-CONN-03-05 lacks explicit PO approval.
D-CONN-03-05 recommendations are NOT approvals.
```

### How PO completes freeze later

PO/Governance must explicitly approve D-CONN-03-05. Only when **all five** are approved may a separate freeze artifact be created:

```text
docs/project/version-3/wave-6/v3-l02-fiv-conn-03-po-governance-decision-freeze.md
```

Freeze still does **not** authorize implementation.

---

## Next governance gate

```text
Next required PO decision:
  D-CONN-03-05

After PO freezes D-CONN-03-01…05 (all five):
  FIV-CONN-03 ARCHITECTURE REVIEW
  + FIV-CONN-03 SECURITY REVIEW
  → PO/Governance Planning Approval
  → Slice Approval
  → Implementation (only if authorized)

Until all five are frozen:
  Implementation authorization: NOT GRANTED
```

---

**END OF FIV-CONN-03 PO/GOVERNANCE DECISION SUPPORT**
