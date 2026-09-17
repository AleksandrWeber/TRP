# V3-L02 FIV-CRED-02 — PO/Governance Decision Freeze

**Document:** FIV-CRED-02 PO/Governance Decision Freeze
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-PRE-01
**Slice:** FIV-CRED-02 — Connection Environment + Provider/Environment Uniqueness
**Authority:** Product Owner / Chief Architect (Governance Documentation Engineer + Principal Architecture Decision Recorder)
**Nature:** **GOVERNANCE DECISION FREEZE ONLY.** Freezes implementation-critical decisions. Does **not** grant Planning Approval. Does **not** authorize implementation. Does **not** close FIV-PRE-01. Does **not** authorize C7, Testnet I/O, FIV, or `allowRealVenueIo=true`.

**Basis:**

| Artifact | Path | Status |
| -------- | ---- | ------ |
| Planning Package | [`v3-l02-fiv-cred-02-planning-package.md`](./v3-l02-fiv-cred-02-planning-package.md) | COMPLETE |
| Architecture Review | [`v3-l02-fiv-cred-02-architecture-review.md`](./v3-l02-fiv-cred-02-architecture-review.md) | **PASS WITH CONDITIONS** |
| Security Review | [`v3-l02-fiv-cred-02-security-review.md`](./v3-l02-fiv-cred-02-security-review.md) | **PASS WITH CONDITIONS** |
| FIV-CRED-01 Closure | [`v3-l02-fiv-cred-01-closure.md`](./v3-l02-fiv-cred-01-closure.md) | **CLOSED** |

**Repository baseline:** `81ac9576d1ddc341cda4c85d7f27674d5d51a276`

```text
PO/GOVERNANCE DECISION FREEZE = COMPLETE
READY FOR PLANNING APPROVAL
IMPLEMENTATION NOT AUTHORIZED BY THIS ARTIFACT
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Authoritative Model C (carry-forward)

```text
Vault SecretPurpose
        =
runtime credential/environment SoT

Connection.environment
        =
persisted Connection constraint / audit context
```

**Prohibited:**

```text
Connection.environment silently overriding Vault purpose
Vault purpose silently rewriting Connection.environment
```

**Mismatch:**

```text
FAIL CLOSED
```

Agreement rule (frozen with D-CRED-02-08):

```text
tradingEnvironmentFromPurpose(vaultPurpose) === connection.environment
```

---

## 2. Formal Decisions

### D-CRED-02-01 — Environment taxonomy

```text
DECISION ID: D-CRED-02-01
Decision: Freeze LIVE and TESTNET using ENV1 vocabulary (live / testnet).
Rationale: ENV1 already ships TradingCredentialEnvironment; Architecture/Security forbid a second taxonomy.
Security consequence: Constrained allowlist; cannot become attacker URL/host.
Implementation implication: Persist/validate environment as ENV1 strings for EXCHANGE multi-env providers.
Status: FROZEN
```

```text
DEMO = DEFERRED
```

(See also D-CRED-02-14.)

---

### D-CRED-02-02 — Logical Connection identity

```text
DECISION ID: D-CRED-02-02
Decision: Logical Connection identity = workspaceId + provider + environment.
Rationale: Required for BINANCE+LIVE and BINANCE+TESTNET coexistence (PO-CRED-04).
Security consequence: Removes environment ambiguity from Connection identity.
Implementation implication: Lookups and uniqueness keyed by this triple for multi-env EXCHANGE.
Status: FROZEN
```

```text
vaultSecretId
        =
credential reference
NOT logical Connection identity
```

Changing `vaultSecretId` (credential replace) must **not** permit two logical Connections for the same `workspace + provider + environment`.

---

### D-CRED-02-03 — Physical uniqueness strategy

```text
DECISION ID: D-CRED-02-03
Decision: STRATEGY B — Partial/conditional uniqueness on credentialed EXCHANGE Connections.
Status: FROZEN
```

**Chosen strategy:**

```text
STRATEGY B
Partial unique constraint (PostgreSQL) on credentialed EXCHANGE rows:
  UNIQUE (workspace_id, provider, environment)
  WHERE vault_secret_id IS NOT NULL
    AND status <> 'REVOKED'   -- exact predicate may refine at implementation if REVOKED rows retain vaultSecretId
```

Plus mandatory **application-level** conflict checks replacing provider-only `assertCredentialSlotAvailable` with:

```text
workspaceId + provider + environment
```

**Rationale (repository/database evidence):**

| Evidence | Implication |
| -------- | ----------- |
| `datasource db { provider = "postgresql" }` | Partial unique indexes are first-class and migration-compatible via SQL |
| `ConnectionsService.create` allows multiple metadata-only rows per provider | Full UNIQUE(workspace, provider, environment) after backfill-to-`live` **collides** on legitimate current duplicates |
| Credentialed exclusivity today is app-enforced provider-only | Security uniqueness that matters is **credentialed** identity per env |
| Existing `@@unique([workspaceId, provider, vaultSecretId])` | Remains a credential-reference integrity aid; **not** replaced by logical env key; **not** part of logical identity |

**Why not Strategy A (full unique):**

* Would require destructive cleanup of metadata-only duplicate EXCHANGE rows that current product create path permits.
* Expands scope beyond credential ambiguity control without security necessity.
* Higher migration failure risk for zero security gain on non-credentialed rows.

**NULL / migration behavior:**

1. Add nullable `environment`.
2. Backfill unambiguous EXCHANGE → `live`.
3. Enforce NOT NULL for EXCHANGE `environment` (all EXCHANGE rows get explicit env).
4. Create **partial** unique index on credentialed rows only (Strategy B).
5. Multiple metadata-only EXCHANGE rows with same env remain allowed **until** credentials are stored; storing credentials for a second same-env Connection → Conflict.

**Concurrency / create races:**

* DB partial unique + app pre-check → deterministic Conflict under concurrent credential store.
* Concurrent metadata-only creates with same env remain allowed (matches current multi-row create semantics).

**Final NOT NULL state:**

* EXCHANGE `environment` is NOT NULL after backfill.
* Notification/AI: environment may remain null / omitted (not multi-env).

**Rollback implications:**

* Dropping partial unique index is forward-safe.
* Do not delete `live` backfill on rollback.
* Never rewrite environment to testnet on rollback.

**Existing `@@unique([workspaceId, provider, vaultSecretId])`:**

* **PRESERVE** as reference integrity.
* Do **not** put `vaultSecretId` into the new logical uniqueness key.

---

### D-CRED-02-04 — Existing LIVE Connection backfill

```text
DECISION ID: D-CRED-02-04
Decision: Backfill unambiguous LIVE-class Connections to environment = live; never auto-classify ambiguous records.
Rationale: Connections exchange Vault path historically omits purpose → Trading (LIVE-class); no Connection.environment exists today.
Security consequence: Preserves LIVE semantics (PO-CRED-07); prevents silent Testnet classification.
Implementation implication: Mandatory pre-migration audit; quarantine/block ambiguous rows; zero Vault secret mutation.
Status: FROZEN
```

```text
Existing unambiguous LIVE-class Connection
        ↓
environment = live

Ambiguous records
        ≠
automatically classified as LIVE
```

**Pre-migration audit MUST identify:**

* missing Vault reference / dangling `vaultSecretId`;
* bound Vault purpose that is not LIVE-class (`Trading` / `TradingLive`);
* duplicate credentialed collisions under Strategy B after backfill;
* cross-workspace inconsistency;
* invalid bindings;
* records that cannot be safely classified.

**No Vault secret mutation** (no purpose change, copy, rotate, or reclassification).

---

### D-CRED-02-05 — Migration sequence

```text
DECISION ID: D-CRED-02-05
Decision: Freeze the following migration sequence.
Status: FROZEN
```

```text
1. Pre-migration audit (read-only)
2. Application write gate / maintenance serialization for Connection credential writes
3. Add nullable environment column (no unique yet)
4. Backfill unambiguous EXCHANGE → live; quarantine ambiguous
5. Detect/resolve credentialed duplicates that would violate Strategy B
6. Enforce NOT NULL for EXCHANGE environment
7. Deploy purpose-aware application checks (D-CRED-02-07/08)
8. Create Strategy B partial unique index
9. Re-enable writes; run security regression suite
```

| Topic | Frozen requirement |
| ----- | ------------------ |
| Atomicity | Must not end in Testnet store + omit-purpose LIVE retrieve |
| Failure | Abort closed; no partial unique over unclean data |
| Rollback | Forward-fix preferred; drop unique OK; never rewrite to testnet |
| Duplicates | Resolve before partial unique |
| Concurrency | Write serialization during steps 2–8 (D-CRED-02-12) |
| Vault | Zero mutation |

**Owner of migration execution:** FIV-CRED-02 implementation (after Planning Approval + Slice Approval).

---

### D-CRED-02-06 — Missing environment

```text
DECISION ID: D-CRED-02-06
Decision: Multi-environment EXCHANGE Connection with omitted/invalid environment → REJECT / FAIL CLOSED.
Rationale: PO-CRED-03; Security C-05 / SC-05.
Security consequence: No silent LIVE default after multi-env model lands.
Implementation implication: Validate on all create entry points.
Status: FROZEN
```

**Applies to:**

| Path | Behavior |
| ---- | -------- |
| Public API create | REJECT if omit/invalid for EXCHANGE |
| Internal domain/service create | REJECT (same rule) |
| Import / administrative create | REJECT (same rule) |
| Background job create (if any) | REJECT (same rule) |
| Update of environment | N/A — immutable (D-CRED-02-09) |
| Notification/AI create | Environment omit **allowed** (not multi-env) |

```text
missing environment → LIVE
        =
FORBIDDEN for multi-environment EXCHANGE after feature land
```

---

### D-CRED-02-07 — Provider-only lookup

```text
DECISION ID: D-CRED-02-07
Decision: Provider-only Connection lookup is FORBIDDEN where environment is relevant.
Rationale: Architecture/Security findings; prevents LIVE/TESTNET ambiguity.
Security consequence: Exact Connection selection only.
Implementation implication: Replace provider-only slot checks and omit-purpose Vault resolves on Connections paths.
Status: FROZEN
```

Required resolution key:

```text
workspaceId + provider + environment
```

**Known affected paths (do not modify in this freeze act):**

* `ConnectionsService.assertCredentialSlotAvailable`
* `ConnectionsService.assertRevokedCredentialSlotAvailable`
* Connections store/replace/revoke/get Vault calls (omit purpose)
* Local validate Vault retrieve
* `ExchangeHandshakeService` / `ExchangeCapabilityService` omit-purpose retrieve (purpose-aware retrieve required per D-CRED-02-08; origin selection remains FIV-CRED-04)

Forbidden:

```text
provider-only
workspace + provider   // when environment ambiguity exists
```

---

### D-CRED-02-08 — Purpose-aware validation

```text
DECISION ID: D-CRED-02-08
Decision: Connection.environment drives expected Vault purpose class; exact-purpose resolve; mismatch FAIL CLOSED.
Rationale: Model C + FIV-CRED-01 composition.
Security consequence: Prevents LIVE↔TESTNET credential confusion.
Implementation implication: Use tradingEnvironmentFromPurpose equality; store/retrieve with explicit purpose.
Status: FROZEN
```

```text
Connection.environment
        ↓
expected Vault purpose/environment
        ↓
exact-purpose credential resolution
```

**Mapping:**

```text
live     ↔ Trading / TradingLive   (LIVE-class ALLOW)
testnet  ↔ TradingTestnet
```

Incompatible combinations → **FAIL CLOSED**.

FIV-CRED-01 remains authoritative for Vault exact-purpose isolation. FIV-CRED-02 must not weaken it.

**Interim option (Architecture C-06):** deny EXCHANGE validate for `testnet` until FIV-CRED-04 **only if** Testnet Connections cannot become CONNECTED via omit-purpose LIVE retrieve. Prefer purpose-aware retrieve in CRED-02 validate path.

---

### D-CRED-02-09 — Environment immutability

```text
DECISION ID: D-CRED-02-09
Decision: Connection.environment is IMMUTABLE AFTER CREATE.
Rationale: LIVE↔TESTNET mutation creates credential/audit ambiguity and stale Vault binding risk.
Security consequence: Prevents privilege/venue-class boundary bypass via PATCH.
Implementation implication: No environment field on rename/update DTOs; reject mutation attempts.
Status: FROZEN
```

Arbitrary transitions:

```text
LIVE → TESTNET
TESTNET → LIVE
```

are **forbidden** in FIV-CRED-02 (would require new Connection + matching Vault purpose slot, not in-place env flip).

No controlled transition mechanism is authorized by this freeze.

---

### D-CRED-02-10 — Workspace isolation

```text
DECISION ID: D-CRED-02-10
Decision: Connection resolution remains workspace-scoped; cross-workspace access FAIL CLOSED.
Rationale: Existing controller membership + getRow(workspaceId,id) + Vault ACL.
Security consequence: Environment must not bypass workspace authorization.
Implementation implication: All uniqueness/lookups include workspaceId.
Status: FROZEN
```

---

### D-CRED-02-11 — Secret safety

```text
DECISION ID: D-CRED-02-11
Decision: Connection stores references/metadata only; secret material remains in Vault.
Rationale: Existing W2 Vault ownership; Security C-10.
Security consequence: No secret exposure via Connection APIs/migrations.
Implementation implication: Write-only credentials; no decrypt in migration; placeholders in tests.
Status: FROZEN
```

No secret values in Connection records, migration output, logs, errors, API responses, tests, governance artifacts, or git history.

No credential provisioning in FIV-CRED-02.

---

### D-CRED-02-12 — Concurrency and migration write serialization

```text
DECISION ID: D-CRED-02-12
Decision: Freeze migration/write serialization requirement.
Rationale: Security SC-11; prevent ambiguous logical Connections during backfill/unique.
Security consequence: No concurrent credential store racing migration into inconsistent state.
Implementation implication: Application write gate during migration critical section.
Status: FROZEN
```

```text
Migration/backfill
        +
concurrent Connection writes
        ↓
must not produce ambiguous logical Connections
```

**Repository-compatible control (frozen preference):**

1. **Primary:** Application write gate denying Connection credential store/replace/revoke (and EXCHANGE create if needed) during migration critical section.
2. **Supporting:** Single transactional migration steps where Prisma/SQL allows; PostgreSQL unique index creation fails closed on conflict.
3. **Operational:** Maintenance window recommended for production deploy.

**Not required as sole control:** advisory locks alone without app gate.

**Implementation owner:** FIV-CRED-02 implementation (migration runbook + temporary write gate).

---

### D-CRED-02-13 — Scope freeze

```text
DECISION ID: D-CRED-02-13
Decision: Freeze exact FIV-CRED-02 scope and exclusions.
Status: FROZEN
```

**In scope:**

```text
1. Connection environment model
2. Provider/environment uniqueness (Strategy B)
3. Connection API/domain contract
4. Existing LIVE metadata backfill
5. Security regression coverage
```

**Excluded:**

```text
FIV-CRED-03 — Vault-backed live credential provider wiring
FIV-CRED-04 — Binance environment-aware handshake / origins
FIV-CRED-05 — API/UI Testnet operator flow beyond Connection contract
FIV-CRED-06 — Final isolation/FIV verification
C7 / S04 / HumanStartProof / ExecutionAdapter / EG1 redesign
Binance I/O / FIV / real capital
```

---

### D-CRED-02-14 — DEMO

```text
DECISION ID: D-CRED-02-14
Decision: DEMO = DEFERRED. No parallel environment taxonomy.
Rationale: Architecture C-09 / Security C-09; FIV-CRED-02 targets LIVE+TESTNET only.
Security consequence: Smaller attack/validation surface.
Implementation implication: Reject demo as Connection.environment in FIV-CRED-02 unless later PO expands scope.
Status: FROZEN
```

---

## 3. Security Conditions Mapping (SC-01…SC-12)

| Security Condition | Frozen Decision | Implementation Owner | Blocking Before Coding? |
| ------------------ | --------------- | -------------------- | ----------------------- |
| **SC-01** ENV equality mismatch | D-CRED-02-08 (+ Model C) | FIV-CRED-02 | **YES** |
| **SC-02** Physical unique strategy | D-CRED-02-03 = **Strategy B** | FIV-CRED-02 | **YES** (now frozen) |
| **SC-03** vaultSecretId ≠ logical identity | D-CRED-02-02 | FIV-CRED-02 | **YES** |
| **SC-04** Pre-migration audit | D-CRED-02-04 / D-CRED-02-05 | FIV-CRED-02 | **YES** |
| **SC-05** Omit env reject | D-CRED-02-06 | FIV-CRED-02 | **YES** |
| **SC-06** Purpose-aware validation | D-CRED-02-07 / D-CRED-02-08 | FIV-CRED-02 (origins → CRED-04) | **YES** |
| **SC-07** Environment immutability | D-CRED-02-09 | FIV-CRED-02 | **YES** |
| **SC-08** Scope freeze | D-CRED-02-13 | FIV-CRED-02 | **YES** |
| **SC-09** DEMO deferred | D-CRED-02-01 / D-CRED-02-14 | FIV-CRED-02 | **YES** |
| **SC-10** Secret safety | D-CRED-02-11 | FIV-CRED-02 | **YES** |
| **SC-11** Migration write serialization | D-CRED-02-12 | FIV-CRED-02 | **YES** |
| **SC-12** Regression suite before close | D-CRED-02-13 item 5 | FIV-CRED-02 | **YES for closure** (not before first coding, but before slice close) |

```text
SC-01…SC-12 = MAPPED / FROZEN INTO D-CRED-02-01…14
Unresolved implementation-critical uniqueness = RESOLVED (Strategy B)
```

---

## 4. Decision Summary Table

| ID | Decision | Status |
| -- | -------- | ------ |
| D-CRED-02-01 | LIVE/TESTNET via ENV1; DEMO deferred | FROZEN |
| D-CRED-02-02 | Logical identity = workspace+provider+environment | FROZEN |
| D-CRED-02-03 | **Physical uniqueness = Strategy B (partial)** | FROZEN |
| D-CRED-02-04 | Unambiguous backfill live; ambiguous ≠ auto-LIVE | FROZEN |
| D-CRED-02-05 | Audit → gate → schema → backfill → NOT NULL → checks → partial unique | FROZEN |
| D-CRED-02-06 | EXCHANGE omit env → REJECT | FROZEN |
| D-CRED-02-07 | Provider-only lookup FORBIDDEN | FROZEN |
| D-CRED-02-08 | Purpose-aware ENV equality FAIL CLOSED | FROZEN |
| D-CRED-02-09 | Environment IMMUTABLE after create | FROZEN |
| D-CRED-02-10 | Workspace-scoped resolution | FROZEN |
| D-CRED-02-11 | Secrets stay in Vault | FROZEN |
| D-CRED-02-12 | Migration write serialization | FROZEN |
| D-CRED-02-13 | Scope + exclusions | FROZEN |
| D-CRED-02-14 | DEMO deferred | FROZEN |

---

## 5. Planning Approval Recommendation

```text
READY FOR PLANNING APPROVAL
```

All implementation-critical ambiguities identified by Architecture/Security (especially physical uniqueness A vs B) are now **FROZEN**.

This artifact does **not** grant Planning Approval or implementation authorization.

---

## 6. Governance Status

```text
FIV-CRED-01
CLOSED

FIV-CRED-02
Planning Package                  COMPLETE
Architecture Review               PASS WITH CONDITIONS
Security Review                   PASS WITH CONDITIONS
PO/Governance Decision Freeze     COMPLETE
Planning Approval                 PENDING
Implementation                    NOT AUTHORIZED

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
PO/GOVERNANCE PLANNING APPROVAL
        → Slice Approval
        → Implementation
```

---

## 7. Safety Confirmations (this freeze act)

| Confirmation | Status |
| ------------ | ------ |
| No implementation | YES |
| No schema/migration/Connections/Vault/API/UI changes | YES |
| No credentials modified; no secrets exposed | YES |
| No Binance / FIV / capital movement | YES |
| Planning / Architecture / Security artifacts unmodified | YES |
| Protected leftovers untouched | YES |
