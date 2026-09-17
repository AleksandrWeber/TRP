# V3-L02 FIV-CRED-02 — Security Review

**Document:** FIV-CRED-02 Security Review
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-PRE-01
**Slice:** FIV-CRED-02 — Connection Environment + Provider/Environment Uniqueness
**Authority:** Principal Security Architect + Application Security Engineer (independent)
**Nature:** **SECURITY REVIEW ONLY.** Does **not** authorize implementation. Does **not** grant Slice Approval. Does **not** close FIV-PRE-01. Does **not** authorize C7, Testnet I/O, FIV, or `allowRealVenueIo=true`.

**Reviewed artifacts:**

| Artifact | Path | Status |
| -------- | ---- | ------ |
| Planning Package | [`v3-l02-fiv-cred-02-planning-package.md`](./v3-l02-fiv-cred-02-planning-package.md) | COMPLETE |
| Architecture Review | [`v3-l02-fiv-cred-02-architecture-review.md`](./v3-l02-fiv-cred-02-architecture-review.md) | **PASS WITH CONDITIONS** (C-01…C-10) |
| FIV-CRED-01 Closure | [`v3-l02-fiv-cred-01-closure.md`](./v3-l02-fiv-cred-01-closure.md) | **CLOSED** |

**Repository baseline:** `04df4c2df99ee79ea6524e74b5b030c54eb61c98`

```text
SECURITY PASS WITH CONDITIONS
IMPLEMENTATION NOT AUTHORIZED BY THIS REVIEW
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Executive Security Conclusion

The FIV-CRED-02 Model C design is **security-acceptable** for Connection environment / uniqueness **if and only if** Architecture conditions C-01…C-10 remain mandatory implementation gates.

Independent repository verification confirms:

* Current Connections exchange Vault calls **omit purpose** → `SecretPurpose.Trading` (LIVE-class).
* Provider-only credentialed slot check exists (`assertCredentialSlotAvailable`).
* Handshake/capability Vault retrieve also omit purpose (LIVE default).
* No `Connection.environment` today → no Testnet Connection representation.
* FIV-CRED-01 exact-purpose Vault isolation is compatible with the proposed ENV equality mismatch check.
* Primary security hazards for implementation are: **omit-purpose LIVE default after multi-env lands**, **provider-only ambiguity**, **duplicate metadata-only rows during unique migration**, and **scope leakage into handshake origins / live provider wiring**.

**Verdict:** `SECURITY PASS WITH CONDITIONS` — conditions SC-01…SC-12 below (mapped to C-01…C-10).

---

## 2. Repository Evidence

### 2.1 Persistence (FACT)

`ConnectionRecord` (`apps/api/prisma/schema.prisma`):

```text
workspaceId, provider, connectionType, vaultSecretId?, status, …
NO environment, NO purpose
@@unique([workspaceId, provider, vaultSecretId])
```

### 2.2 Dangerous defaults / lookups (FACT)

| Path | Behavior | Security impact |
| ---- | -------- | --------------- |
| `ConnectionsService.storeCredentials` / `replaceCredentials` | Vault store/replace **without purpose** | Always LIVE `Trading` slot |
| `ConnectionsService.revoke` / local validate | Vault get/retrieve/revoke **without purpose** | LIVE-only |
| `assertCredentialSlotAvailable` | `findFirst(workspaceId, provider, vaultSecretId≠null)` | Provider-only; blocks coexistence; ambiguous if removed naively |
| `assertRevokedCredentialSlotAvailable` | Vault get by type only | LIVE-only |
| `ExchangeHandshakeService.perform` | Vault get/retrieve without purpose | LIVE-only retrieve |
| `ExchangeCapabilityService.verify` | Vault get/retrieve without purpose | LIVE-only retrieve |

### 2.3 Controls already present (FACT)

| Control | Evidence |
| ------- | -------- |
| Workspace-scoped Connection fetch | `findFirst({ id, workspaceId })` |
| Workspace membership at API | `requireWorkspace` / `WorkspaceAccessService` |
| Vault workspace ACL | `VaultAccessControl` |
| Write-only credentials | DTOs pass fields to Vault; metadata view has no secret fields |
| ENV1 purpose→env mapping | `tradingEnvironmentFromPurpose` |
| FIV-CRED-01 exact-purpose Vault isolation | Closed; regression suite present |

### 2.4 NOT VERIFIED

* Production row contents / whether any Connection `vaultSecretId` points at non-`Trading` Vault purposes (requires DB audit at implementation time — C-04).

---

## 3. Current Security Posture

```text
Implicit LIVE-only Connections credential path
        +
provider-only credentialed uniqueness
        +
no Connection.environment
        =
safe TODAY only because Testnet Connections do not exist on this path
```

Once multi-environment Connections are introduced **without** C-01…C-06, the same omit-purpose path becomes a **LIVE/Testnet confusion vulnerability**.

---

## 4. Target Security Model

```text
Logical Connection (EXCHANGE multi-env)
  = workspaceId + provider + environment   // constraint/audit

Vault SoT
  = SecretPurpose → ENV1 environment

Binding
  = tradingEnvironmentFromPurpose(vaultPurpose) === connection.environment
  else FAIL CLOSED

No override either direction
No provider-only credentialed selection
No omit-purpose LIVE default for multi-env EXCHANGE after feature land
No user-controlled URL/endpoint from environment
```

---

## 5. Conditions C-01…C-10 — Security Assessment

### C-01 — Connection/Vault mismatch

**Security status: PASS (as design) — must be implemented**

Invariant:

```text
tradingEnvironmentFromPurpose(vaultPurpose) === connection.environment
```

| Combination | Required result |
| ----------- | --------------- |
| live + Trading | ALLOW |
| live + TradingLive | ALLOW |
| testnet + TradingTestnet | ALLOW |
| testnet + Trading / TradingLive | FAIL CLOSED |
| live + TradingTestnet | FAIL CLOSED |

Compatible with FIV-CRED-01: Vault still exact-purpose; Connection adds ENV-class agreement without remapping purposes.

**Where check must occur (architecturally):**

1. **storeCredentials / replaceCredentials** — before/after Vault write: stored purpose must match Connection.environment.
2. **retrieve paths owned by Connections validate** — retrieve purpose derived from Connection.environment; compare metadata.purpose ENV class.
3. **revoke / get slot checks** — purpose-aware.

Connection.environment MUST NOT override Vault purpose.
Vault MUST NOT rewrite Connection.environment.

### C-02 — Physical uniqueness

**Security status: PASS WITH CONDITIONS — freeze before implementation**

Logical key `workspaceId + provider + environment` is correct.

**Security preference among options:**

| Option | Security assessment |
| ------ | ------------------- |
| **A — Full UNIQUE(workspaceId, provider, environment)** | Strongest ambiguity prevention **after** duplicate cleanup; fails migration if unclean |
| **B — Partial unique (credentialed rows only)** | Acceptable if metadata-only duplicates remain; **must** still prevent two credentialed same-env Connections; app-level checks required |
| **C — App-only uniqueness** | **Insufficient alone** — races under concurrent create/store |

**Mandatory security requirements for whichever option PO freezes:**

* DB unique (full or partial) **plus** application conflict checks.
* Nullable environment phase must not allow two credentialed same-env rows.
* Concurrent creates of same logical identity → deterministic Conflict.
* Eventual NOT NULL for EXCHANGE environments.

**Security recommendation to PO:** Prefer **B (partial unique on credentialed EXCHANGE)** if duplicate metadata-only rows are common; Prefer **A** if audit shows cleanup is cheap and product forbids duplicate metadata rows. Either is acceptable; **C alone is not**.

### C-03 — vaultSecretId not logical identity

**Security status: PASS**

`vaultSecretId` = opaque credential reference.

Risk if mis-modeled: replacing `vaultSecretId` could appear to create a “new” identity while logical Connection remains same env — or vice versa.

**Required control:** Logical uniqueness ignores `vaultSecretId`. Replacing credentials keeps same Connection identity; must re-validate C-01 against new Vault purpose. Must not allow two Connections with same workspace+provider+environment via vaultSecretId churn.

### C-04 — Pre-migration audit

**Security status: PASS (required) — BLOCKING prerequisite**

**Do NOT assume all existing records are LIVE** without audit.

Code-path **INFERENCE:** Connections exchange store always wrote `Trading` → LIVE-class. Exceptional cases (manual DB edits, out-of-band Vault writes bound via `vaultSecretId`) are **NOT VERIFIED**.

Audit must identify:

* Connections without environment (all today);
* missing / dangling `vaultSecretId`;
* Vault purpose LIVE-class vs TESTNET vs other for bound secrets;
* provider-only credential bindings;
* duplicate `(workspace, provider)` rows that would collide under `live`;
* cross-workspace anomalies;
* ambiguous records.

**Backfill rule:**

```text
Unambiguous LIVE-class → environment = live
Ambiguous / TESTNET-bound / unclassifiable → QUARANTINE / BLOCK migration
Never silent Testnet classification
Never invent environment from client input
```

### C-05 — Omitted environment

**Security status: PASS (required)**

For multi-environment EXCHANGE:

```text
create (and any import/admin/internal create path)
environment omitted or invalid
        → REJECT / FAIL CLOSED
```

Must apply to:

* public API create;
* internal service create helpers;
* future import/admin paths;
* background job creators (if any — none found today for Connections create).

Does **not** apply as reject to notification/AI single-environment providers (omit allowed).

Update of environment: forbidden under C-07 (immutability).

### C-06 — Purpose-aware validation

**Security status: PASS (required) — BLOCKING for Testnet credential use**

Affected paths that must stop omit-purpose / provider-only behavior:

| Path | Required change (future impl) |
| ---- | ----------------------------- |
| `assertCredentialSlotAvailable` | Key by workspace+provider+environment; Vault get with expected purpose |
| `assertRevokedCredentialSlotAvailable` | Purpose-aware |
| store/replace/revoke/get | Pass purpose from Connection.environment mapping |
| local validate retrieve | Purpose-aware |
| Handshake retrieve | Purpose-aware **retrieve**; origin selection = FIV-CRED-04 |
| Capability retrieve | Purpose-aware |

**Interim fail-closed option (Architecture C-06):** deny EXCHANGE validate for `testnet` until FIV-CRED-04 — acceptable **only if** Testnet Connections cannot be marked CONNECTED via omit-purpose LIVE retrieve.

Forbidden after multi-env store lands:

```text
missing purpose → Trading
```

for EXCHANGE multi-env contexts.

### C-07 — Environment immutability

**Security status: PASS (prefer immutable)**

Allowing LIVE↔TESTNET mutation without controlled ceremony enables:

* credential confusion (bound Vault purpose stale vs new env);
* audit ambiguity;
* privilege/venue-class boundary bypass;
* handshake against wrong key class.

**Required:** immutable after create in FIV-CRED-02.

If future mutation needed: controlled transition that (1) requires matching Vault purpose already present for target env, (2) re-runs uniqueness, (3) audits, (4) never auto-substitutes credentials, (5) never changes endpoints by client string.

### C-08 — Scope freeze

**Security status: PASS**

FIV-CRED-02 may own Connection metadata/security boundary only.

Must **not** absorb:

* FIV-CRED-03 Vault-backed live credential provider wiring;
* FIV-CRED-04 Binance environment-aware handshake origins / EG1 I/O;
* FIV-CRED-05 full UI Testnet operator flow (API contract may land in CRED-02);
* FIV-CRED-06 final FIV isolation.

**Hand-off dependencies:**

| Dependency | Owner |
| ---------- | ----- |
| Production live credential provider composition | FIV-CRED-03 |
| Testnet/LIVE handshake origin selection | FIV-CRED-04 |
| Operator UI environment selector polish | FIV-CRED-05 |

### C-09 — DEMO deferred

**Security status: PASS**

Target taxonomy for FIV-CRED-02: `live` | `testnet` only (ENV1 strings). DEMO deferred. No parallel environment taxonomy.

### C-10 — Secret safety

**Security status: PASS**

Architecture must not require secrets in Connections persistence, API responses, logs, migration output, errors, or governance docs.

`vaultSecretId` reference only. Material remains Vault ciphertext + in-memory retrieve.

Migration must not print/decrypt secrets.

---

## 6. Threat Matrix

| Threat | Attack/Failure Condition | Current State | Target Control | Residual Risk | Status |
| ------ | ------------------------ | ------------- | -------------- | ------------- | ------ |
| TESTNET → LIVE credential | Testnet Connection retrieves Trading | Latent (no Testnet Connection path) | C-01 + purpose-aware retrieve | Low if C-01/C-06 enforced | Controlled |
| LIVE → TESTNET credential | Live Connection retrieves TradingTestnet | Latent | C-01 | Low | Controlled |
| Missing environment | Omit env → silent LIVE | Present (omit purpose) | C-05 reject EXCHANGE omit | Medium if API clients not updated | Controlled |
| Provider-only lookup | Resolve by provider across envs | Present | C-02/C-06 | High if missed | Controlled |
| Cross-workspace access | WS-A uses WS-B Connection/cred | Mitigated | Preserve workspace ACL | Low | Controlled |
| Duplicate Connection | Two same env Connections | Metadata duplicates possible | C-02 + app conflict | Medium during migration | Controlled |
| Migration ambiguity | Backfill wrong env / collide unique | N/A yet | C-04 abort closed | High without audit | Controlled |
| Environment tampering | PATCH env LIVE↔TESTNET | N/A (no field) | C-07 immutable | Low | Controlled |
| Secret exposure | Secrets in API/logs/migration | Mitigated write-only | C-10 | Low | Controlled |
| Endpoint confusion | env becomes URL / client host | Not present; handshake separate | Allowlist enum; CRED-04/EG1 | Low if scope held | Controlled |

---

## 7. Migration Security Analysis

### Safest sequence (security-ordered)

```text
1. Offline/pre-deploy AUDIT (read-only)
2. Maintenance window or lock Connection credential writes (recommended)
3. Add nullable environment (no unique yet)
4. Backfill unambiguous EXCHANGE → live
5. Quarantine/block ambiguous rows
6. Resolve duplicates per frozen C-02 strategy
7. Enforce NOT NULL for EXCHANGE environment
8. Deploy purpose-aware application checks (C-01/C-06)
9. Add physical unique constraint
10. Re-enable writes; run regression suite
```

Architecture’s ordering is acceptable; **security adds write-lock recommendation** between audit and unique enforcement to reduce races.

### Explicit answers

| Topic | Security requirement |
| ----- | -------------------- |
| Atomicity | Partial migrate without C-01/C-06 leaves Testnet store + LIVE retrieve possible — **forbidden end state** |
| Duplicates | Must be resolved before hard unique; else migration fails closed |
| Rollback | Prefer forward-fix; rolling back unique is safer than deleting `live`; never rewrite to testnet |
| Backfill misclassification | Prevent via C-04 Vault purpose inspection; quarantine exceptions |
| Secret integrity | Vault secrets **completely unchanged** |
| Availability | Brief conflict/reject window acceptable; omit-purpose LIVE retrieve after Testnet store is **not** an acceptable availability tradeoff |

**Migration security:** **PASS WITH CONDITIONS** (C-04 + write serialization + C-02 freeze).

---

## 8. Concurrency Analysis

| Scenario | Required control |
| -------- | ---------------- |
| Two concurrent creates `WS-A + BINANCE + testnet` | DB unique + app Conflict; one wins |
| Update status while credential resolve | Status transitions unchanged; env immutable; resolve by id+workspace |
| Migration while writes | Prefer lock/deny credential store during backfill+unique |
| Delete/recreate same logical identity | After delete, recreate allowed; must not resurrect wrong Vault purpose; new store must C-01 match |

**Concurrency:** **PASS WITH CONDITIONS** (DB unique + app checks + migration write lock).

---

## 9. Workspace Isolation

**PASS** — environment must remain subordinate to `workspaceId` in all lookups and uniqueness.

```text
Workspace A  X  Workspace B Connection
Workspace A  X  Workspace B credential
```

Preserve controller membership, `getRow(id, workspaceId)`, Vault ACL. Do not introduce provider+environment lookup without workspace.

---

## 10. Environment Tampering

Requests claiming env inconsistent with bound Vault purpose → **FAIL CLOSED**.

No implicit correction, no automatic credential substitution, no endpoint override.

Immutable environment prevents post-create LIVE↔TESTNET flip without new Connection.

---

## 11. Endpoint Security Boundary

**PASS**

`Connection.environment` is a constrained domain value (`live`|`testnet`), **not** a URL.

Must not accept:

```text
https://attacker.example
```

or arbitrary hosts. Origin/endpoint selection remains ENV1/EG1 + **FIV-CRED-04**.

---

## 12. Regression Requirements (minimum before FIV-CRED-02 close)

| Area | Required tests |
| ---- | -------------- |
| Env × purpose matrix | live+Trading/TradingLive ALLOW; testnet+TradingTestnet ALLOW; cross DENY |
| Missing env | EXCHANGE create omit → reject |
| Duplicates | second credentialed same env → Conflict |
| Provider-only | no ambiguous resolve across envs |
| Workspace | cross-workspace DENY |
| Immutability | env change rejected |
| Secret safety | metadata/errors/logs free of secret fields; placeholders only |
| LIVE regression | existing Trading + live Connection still works |
| Migration fixtures | backfill live; ambiguous abort; Vault purpose unchanged |

Zero Binance network I/O in suite.

---

## 13. FIV-CRED-02 / 03 / 04 Separation

```text
FIV-CRED-02 = Connection metadata/security boundary
FIV-CRED-03 = Vault-backed runtime live credential provider
FIV-CRED-04 = environment-aware Binance handshake / origins
```

Do not merge. CRED-02 may pass purpose into retrieve; CRED-04 selects fixed origins.

---

## 14. Residual Risks

| Risk | Severity | Blocking for CRED-02 impl? | Notes |
| ---- | -------- | -------------------------- | ----- |
| C-02 strategy not frozen | High | **YES** | PO must freeze A vs B |
| Audit not run | High | **YES** | C-04 |
| Handshake omit-purpose after Testnet store | High | **YES** unless interim deny-validate | C-06 |
| Client omit env after API change | Medium | NO if C-05 enforced | Compatibility |
| DEMO later expansion | Low | NO | C-09 |
| CRED-03/04 delay | Medium | NO for CRED-02 close if bounds held | Residual product gap |

---

## 15. Security Conditions (testable)

| ID | Condition | Maps to | Owner | Blocking? |
| -- | --------- | ------- | ----- | --------- |
| **SC-01** | Implement ENV equality mismatch check; no override either way | C-01 | FIV-CRED-02 | YES |
| **SC-02** | Freeze physical unique strategy (A or B); forbid app-only | C-02 | PO + FIV-CRED-02 | YES |
| **SC-03** | Logical identity excludes vaultSecretId; replace creds re-check C-01 | C-03 | FIV-CRED-02 | YES |
| **SC-04** | Pre-migration audit + quarantine ambiguous; no assume-all-LIVE | C-04 | FIV-CRED-02 | YES |
| **SC-05** | EXCHANGE omit/invalid env → reject on all create paths | C-05 | FIV-CRED-02 | YES |
| **SC-06** | Purpose-aware Vault ops on Connections paths; interim deny testnet validate OR purpose-aware handshake retrieve | C-06 | FIV-CRED-02 (+ CRED-04 for origins) | YES |
| **SC-07** | Environment immutable after create | C-07 | FIV-CRED-02 | YES |
| **SC-08** | No CRED-03/04/05/06 absorption; no C7/FIV/I/O | C-08 | FIV-CRED-02 | YES |
| **SC-09** | DEMO deferred; ENV1 vocabulary only | C-09 | FIV-CRED-02 | YES |
| **SC-10** | No secret material outside Vault boundary | C-10 | FIV-CRED-02 | YES |
| **SC-11** | Migration write serialization / deny credential writes during critical phases | Migration | FIV-CRED-02 | YES (recommended hardening) |
| **SC-12** | Regression suite §12 green before slice close | Regression | FIV-CRED-02 | YES for closure |

---

## 16. Security Verdict

```text
SECURITY PASS WITH CONDITIONS
```

Architecture C-01…C-10 are security-sound as **mandatory gates**. Additional SC-11 (migration write lock) and SC-12 (regression suite) are required for secure delivery/closure.

```text
IMPLEMENTATION NOT AUTHORIZED BY THIS REVIEW
```

---

## 17. Governance Status

```text
FIV-CRED-02
PLANNING COMPLETE
ARCHITECTURE REVIEW
PASS WITH CONDITIONS
SECURITY REVIEW
PASS WITH CONDITIONS

PO/GOVERNANCE REVIEW
PENDING

IMPLEMENTATION
NOT AUTHORIZED BY THIS REVIEW

FIV-CRED-01
CLOSED

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
PO/GOVERNANCE REVIEW
        → DECISION FREEZE
        → PLANNING APPROVAL
        → Slice Approval
        → Implementation
```

---

## 18. Safety Confirmations (this review act)

| Confirmation | Status |
| ------------ | ------ |
| No implementation | YES |
| No schema/migration/Connections/Vault/API/UI changes | YES |
| No secrets accessed or exposed | YES |
| No Binance / FIV / capital movement | YES |
| Protected leftovers untouched | YES |
| Planning package / architecture review unmodified | YES |
