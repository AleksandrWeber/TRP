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
D-CONN-03-03…05 OPEN — DECISION SUPPORT PENDING PO APPROVAL

Full decision-freeze artifact:  NOT CREATED (awaiting D-CONN-03-03…05)
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

Still open:
D-CONN-03-03
D-CONN-03-04
D-CONN-03-05
```

### Pre-check (this update)

```text
HEAD:        e6c036f232b1d1b767e8bc34a3c81920774e386d
origin/main: e6c036f232b1d1b767e8bc34a3c81920774e386d
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

D-CONN-03-01 and D-CONN-03-02 are FROZEN (explicit PO approvals).
D-CONN-03-03…05 recommendations remain non-binding.
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
It does NOT freeze D-CONN-03-03…05 by itself.
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
It does NOT freeze D-CONN-03-03…05.
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

## D-CONN-03-03 — DECISION SUPPORT

```text
Status: OPEN — PO APPROVAL REQUIRED
Depends on: D-CONN-03-01 FROZEN; D-CONN-03-02 FROZEN
Does NOT freeze NULL-environment policy in this act.
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

With **D-CONN-03-01=A** and **D-CONN-03-02=A** frozen, if PO later freezes **03=B (or EXCHANGE-scoped A), 04=A, 05=A**, the composition guarantees:

| Guarantee                                                    | How                    |
| ------------------------------------------------------------ | ---------------------- |
| LIVE Connection → LIVE purpose only (id-bound)               | 01+02+04               |
| TESTNET Connection → TESTNET purpose only                    | 01+02+04               |
| NULL environment → never implicitly LIVE                     | 03                     |
| NULL EXCHANGE → no trading credential use until env assigned | 03                     |
| Mismatch → FAIL CLOSED                                       | 04 before use (+ bind) |
| Client cannot select Vault purpose                           | 05                     |
| Provider-only / sibling-secret fallback forbidden            | 01+02                  |
| Cross-workspace fallback forbidden                           | ACL + workspaceId      |

**Inconsistency warnings for PO:**

1. Approving omit-purpose Trading retrieve for NULL EXCHANGE **conflicts** with frozen D-CONN-03-01.
2. Choosing **04=C (store only)** still contradicts residual CONN-03 validate-path purpose.
3. Implementing 01+02 without freezing 03 leaves NULL EXCHANGE validate as omit-purpose Trading hazard.

---

## Security Matrix

| Connection environment               | Vault purpose  | Expected result                                          |
| ------------------------------------ | -------------- | -------------------------------------------------------- |
| LIVE                                 | Trading        | governed by **D-CONN-03-02** (FROZEN — id-matched ALLOW) |
| LIVE                                 | TradingLive    | governed by **D-CONN-03-02** (FROZEN — id-matched ALLOW) |
| LIVE                                 | TradingTestnet | **DENY**                                                 |
| TESTNET                              | Trading        | **DENY**                                                 |
| TESTNET                              | TradingLive    | **DENY**                                                 |
| TESTNET                              | TradingTestnet | **ALLOW**                                                |
| NULL                                 | Trading        | **OPEN — D-CONN-03-03**                                  |
| NULL                                 | TradingLive    | **OPEN — D-CONN-03-03**                                  |
| NULL                                 | TradingTestnet | **DENY**                                                 |
| wrong workspace                      | any            | **DENY**                                                 |
| wrong provider / wrong vaultSecretId | any            | **DENY**                                                 |
| provider-only lookup (populated env) | n/a            | **FORBIDDEN / DENY**                                     |
| sibling-secret substitution          | n/a            | **FORBIDDEN / DENY** (D-CONN-03-02)                      |
| client-supplied purpose              | n/a            | **FORBIDDEN / DENY**                                     |

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
D-CONN-03-03: OPEN
D-CONN-03-04: OPEN
D-CONN-03-05: OPEN

Full five-decision freeze artifact: NOT CREATED
Reason: D-CONN-03-03…05 lack explicit PO approval.
D-CONN-03-03…05 recommendations are NOT approvals.
```

### How PO completes freeze later

PO/Governance must explicitly approve D-CONN-03-03…05. Only when **all five** are approved may a separate freeze artifact be created:

```text
docs/project/version-3/wave-6/v3-l02-fiv-conn-03-po-governance-decision-freeze.md
```

Freeze still does **not** authorize implementation.

---

## Next governance gate

```text
Next required PO decision:
  D-CONN-03-03

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
