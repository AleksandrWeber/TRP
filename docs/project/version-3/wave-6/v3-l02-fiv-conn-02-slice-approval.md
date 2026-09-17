# V3-L02 FIV-CONN-02 — Slice Approval

**Document:** FIV-CONN-02 Product Owner / Chief Architect Individual Slice Approval  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02  
**Slice:** FIV-CONN-02 — Provider + Environment Uniqueness  
**Authority:** Product Owner / Chief Architect (PO/Governance Approval Recorder + Senior Staff Review Engineer)  
**Nature:** Formal **SLICE APPROVAL GATE**. Authorizes implementation of FIV-CONN-02 only, within approved planning boundary. Does **not** authorize FIV-CONN-03…05. Does **not** close FIV-CONN-02. Does **not** close FIV-CRED-02. Does **not** authorize C7, Testnet I/O, FIV, LIVE backfill, or `allowRealVenueIo=true`.

**Planning package:** [`v3-l02-fiv-conn-02-planning-package.md`](./v3-l02-fiv-conn-02-planning-package.md)  
**Planning commit:** `b1a474b154d5cf76679f91fc6493589ed8c422b3`  
**Parent Planning Approval:** GRANTED — [`v3-l02-fiv-cred-02-po-governance-planning-approval.md`](./v3-l02-fiv-cred-02-po-governance-planning-approval.md)  
**FIV-CONN-01:** CLOSED — [`v3-l02-fiv-conn-01-closure.md`](./v3-l02-fiv-conn-01-closure.md)  
**Repository baseline (approval start):** `b1a474b154d5cf76679f91fc6493589ed8c422b3` (`HEAD == origin/main`)

```text
SLICE APPROVAL = GRANTED

FIV-CONN-02
Planning Package:
COMPLETE
PO/Governance Slice Approval:
GRANTED
Implementation:
AUTHORIZED FOR FIV-CONN-02 ONLY
FIV-CONN-03:
NOT AUTHORIZED
FIV-CONN-04:
NOT AUTHORIZED
FIV-CONN-05:
NOT AUTHORIZED
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Slice identity

| Field | Value |
| ----- | ----- |
| **ID** | **FIV-CONN-02** |
| **Name** | Provider + Environment Uniqueness |
| **Parent** | V3-L02 FIV-CRED-02 |
| **Type** | Persistence uniqueness + application conflict enforcement |
| **Position** | Second FIV-CRED-02 sub-slice (CONN-01 CLOSED → CONN-02 → CONN-03…05) |
| **Frozen strategy** | **D-CRED-02-03 = STRATEGY B** |

---

## 2. Parent governance state

```text
V3-L02 FIV-CRED-02
Planning Package                  COMPLETE
Architecture Review               PASS WITH CONDITIONS
Security Review                   PASS WITH CONDITIONS
PO/Governance Decision Freeze     COMPLETE
PO/Governance Planning Approval   GRANTED

FIV-CONN-01
CLOSED

FIV-CONN-02
Planning Package                  COMPLETE
Slice Planning                    READY FOR PO REVIEW (planning artifact)
PO/Governance Slice Approval      GRANTED (this act)

FIV-CRED-02
NOT CLOSED

FIV-PRE-01
NOT CLOSED
```

Frozen parent decisions (D-CRED-02-01…14) were **not** reopened.

---

## 3. Reviewed artifacts

| Artifact | Path | Status |
| -------- | ---- | ------ |
| Parent Planning Package | `v3-l02-fiv-cred-02-planning-package.md` | COMPLETE |
| Architecture Review | `v3-l02-fiv-cred-02-architecture-review.md` | PASS WITH CONDITIONS |
| Security Review | `v3-l02-fiv-cred-02-security-review.md` | PASS WITH CONDITIONS |
| Decision Freeze | `v3-l02-fiv-cred-02-po-governance-decision-freeze.md` | COMPLETE — Strategy B frozen |
| Parent Planning Approval | `v3-l02-fiv-cred-02-po-governance-planning-approval.md` | GRANTED |
| FIV-CONN-01 Closure | `v3-l02-fiv-conn-01-closure.md` | CLOSED |
| FIV-CONN-02 Planning Package | `v3-l02-fiv-conn-02-planning-package.md` | COMPLETE / READY FOR PO REVIEW |

Prior governance artifacts were **not** modified by this act.

---

## 4. Strategy B confirmation

```text
D-CRED-02-03
Physical uniqueness strategy = STRATEGY B
CONFIRMED
```

Planning explicitly:

* preserves partial/conditional uniqueness (not Strategy A full unique);
* refuses `@@unique([workspaceId, provider, environment])`;
* requires manual SQL partial unique index;
* applies uniqueness to credentialed EXCHANGE rows with populated environment.

Rationale accepted (not reopened): PostgreSQL partial unique indexes; metadata-only / NULL-environment coexistence; uniqueness conditional on approved eligibility.

---

## 5. NULL semantics confirmation

```text
Multiple NULL-environment rows MAY coexist
NULL ≠ LIVE
NULL ≠ TESTNET
```

Confirmed from planning §7:

* NULL rows outside Strategy B predicate;
* transition legacy EXCHANGE NULL awaiting FIV-CONN-04;
* notification/AI NULL permanent/normal;
* product must not treat NULL as LIVE or TESTNET.

### Eligibility predicate (approved — resolves OQ-02)

Repository field names (FACT):

| Governance term | Exact repository fields / values |
| --------------- | -------------------------------- |
| credentialed | `vault_secret_id IS NOT NULL` / Prisma `vaultSecretId` |
| non-revoked | `status <> 'REVOKED'` |
| EXCHANGE | `connection_type = 'EXCHANGE'` / Prisma `connectionType` |
| populated environment | `environment IS NOT NULL` (`live` \| `testnet`) |

**OQ-02 resolution (this Approval):** Include `connection_type = 'EXCHANGE'` in the Strategy B predicate — **CONFIRMED YES** (planning recommended default).

Approved physical form (planning §6.1):

```sql
CREATE UNIQUE INDEX "connection_records_ws_provider_env_credentialed_uidx"
ON "connection_records" ("workspace_id", "provider", "environment")
WHERE "vault_secret_id" IS NOT NULL
  AND "status" <> 'REVOKED'
  AND "environment" IS NOT NULL
  AND "connection_type" = 'EXCHANGE';
```

```text
Eligibility:
credentialed + non-revoked + EXCHANGE + environment IS NOT NULL
```

---

## 6. SA-01…SA-23 matrix

| ID | Criterion | Result | Planning evidence |
| -- | --------- | ------ | ----------------- |
| **SA-01** | Strategy B explicitly preserved | **PASS** | §5; refuses Strategy A reinterpretation |
| **SA-02** | Logical uniqueness = workspaceId + provider + environment | **PASS** | §5 logical identity |
| **SA-03** | vaultSecretId not part of uniqueness | **PASS** | §5; AC-03; preserve existing vaultSecretId unique as reference aid only |
| **SA-04** | Multiple NULL-environment rows may coexist; NULL ≠ LIVE/TESTNET | **PASS** | §7 answers 1–2; NULL semantics block |
| **SA-05** | Eligibility = credentialed + non-revoked + EXCHANGE + env NOT NULL | **PASS** | §6.1 predicate + this Approval OQ-02 |
| **SA-06** | Same WS+provider+LIVE cannot produce two eligible Connections | **PASS** | §6.3 REJECT row |
| **SA-07** | Same WS+provider+TESTNET cannot produce two eligible Connections | **PASS** | §6.3 REJECT row |
| **SA-08** | LIVE + TESTNET coexistence allowed | **PASS** | §6.3 ALLOWED |
| **SA-09** | Cross-workspace isolation preserved | **PASS** | §6.3; §12 workspaceId in key |
| **SA-10** | Different providers independently unique | **PASS** | §6.3 ALLOWED |
| **SA-11** | DB uniqueness is final race authority; create/update/instances/workers/P2002 covered | **PASS** | §8 concurrency model |
| **SA-12** | Non-destructive populated-env duplicate audit defined | **PASS** | §9.1–9.2 read-only SQL |
| **SA-13** | NULL-group audit separate from populated-env duplicates | **PASS** | §9.3 |
| **SA-14** | LIVE backfill = FIV-CONN-04; not CONN-02 | **PASS** | §10; §15; AC-10 |
| **SA-15** | No silent delete/merge/reassign | **PASS** | §9.4; AC-11; non-goals |
| **SA-16** | Safe CONN-01 → CONN-02 → CONN-04 ordering defined | **PASS** | §10 with safety rationale |
| **SA-17** | Existing ConflictException / P2002 / 409; no secret in errors | **PASS** | §11 |
| **SA-18** | FIV-CONN-01 environment immutability preserved | **PASS** | §4.3; AC-12; no identity mutation API |
| **SA-19** | live\|testnet supported; demo deferred | **PASS** | §6.4; AC-13 |
| **SA-20** | Security controls preserved | **PASS** | §12 |
| **SA-21** | No Vault changes required | **PASS** | AC-14; §6.2 Vault purpose wiring stays CONN-03 |
| **SA-22** | Binance/venue I/O = ZERO | **PASS** | §12; §13; AC-16; non-goals |
| **SA-23** | Scope limited to uniqueness + audit/DB/error/concurrency tests | **PASS** | §15; AC-20 |

```text
SA-01…SA-23 = 23/23 PASS
```

---

## 7. AC-01…AC-23 verification

| AC | Description | Planning Coverage | Status |
| -- | ----------- | ----------------- | ------ |
| AC-01 | Strategy B implemented as approved uniqueness strategy | §5–§6.1; AC-01 text | **PASS** |
| AC-02 | Populated env unique by workspaceId+provider+environment for credentialed non-revoked EXCHANGE | §6.1–§6.3; AC-02 | **PASS** |
| AC-03 | vaultSecretId not part of logical uniqueness | §5; AC-03 | **PASS** |
| AC-04 | NULL-environment behavior defined and safe | §7; AC-04 | **PASS** |
| AC-05 | LIVE and TESTNET can coexist | §6.3; AC-05 | **PASS** |
| AC-06 | Different workspaces isolated | §6.3; §12; AC-06 | **PASS** |
| AC-07 | Different providers independently unique | §6.3; AC-07 | **PASS** |
| AC-08 | Concurrent writes cannot bypass DB uniqueness | §8; AC-08 | **PASS** |
| AC-09 | Existing duplicate detection defined | §9; AC-09 | **PASS** |
| AC-10 | No automatic LIVE backfill in FIV-CONN-02 | §10; §15; AC-10 | **PASS** |
| AC-11 | No destructive duplicate cleanup | §9.4; AC-11 | **PASS** |
| AC-12 | Environment immutability preserved | §4.3; AC-12 | **PASS** |
| AC-13 | DEMO deferred | §6.4; AC-13 | **PASS** |
| AC-14 | No Vault changes required for uniqueness | AC-14; §15 | **PASS** |
| AC-15 | No secret material exposed | §11–§12; AC-15 | **PASS** |
| AC-16 | No Binance/venue I/O | §13; AC-16 | **PASS** |
| AC-17 | C7 remains DENY-ALL | §12; AC-17 | **PASS** |
| AC-18 | allowRealVenueIo remains FALSE | §12; AC-18 | **PASS** |
| AC-19 | Uniqueness/concurrency regression tests defined | §13; AC-19 | **PASS** |
| AC-20 | Implementation limited to FIV-CONN-02 | §15; AC-20 | **PASS** |
| AC-21 | Existing vaultSecretId unique preserved | §5; AC-21 | **PASS** |
| AC-22 | Manual SQL partial unique; no Strategy A @@unique | §4.4; §6.1; AC-22 | **PASS** |
| AC-23 | assertCredentialSlotAvailable → provider+environment | §6.2; AC-23 | **PASS** |

```text
AC-01…AC-23 = 23/23 VERIFIED
```

All criteria are concrete, testable, Strategy B–consistent, NULL-semantics–consistent, parent-governance–consistent, and limited to FIV-CONN-02.

---

## 8. Concurrency boundary

```text
Database Strategy B partial unique index
        =
final authority against race conditions
```

Approved coverage from planning §8:

* concurrent metadata-only create → allowed;
* concurrent credential bind → one wins; loser Conflict / P2002;
* identity-field updates → N/A (immutable; no mutation API);
* multiple API instances → DB enforces;
* background/worker writers → none today; same DB rule if added;
* no auto-retry of uniqueness conflicts as success.

---

## 9. Duplicate-audit boundary

```text
FIV-CONN-02:
  read-only audit
  detect Strategy B blockers
  fail closed on index apply if blockers exist
  NO delete / merge / reassign

FIV-CONN-04:
  LIVE backfill + any required resolution ownership
```

Populated-env credentialed duplicates (§9.1) separated from metadata-only groups (§9.2) and NULL groups (§9.3).

---

## 10. LIVE-backfill boundary

```text
LIVE backfill = FIV-CONN-04
FIV-CONN-02 does NOT perform LIVE backfill
FIV-CONN-02 does NOT enforce EXCHANGE NOT NULL
```

Ordering CONN-01 → CONN-02 → CONN-04 accepted as technically safe under Strategy B predicates (planning §10).

---

## 11. Security boundary

Implementation must preserve:

```text
workspace isolation
Vault-purpose boundary (no CONN-02 weakening; purpose wiring = CONN-03)
no cross-environment fallback
no provider-only identity
secret non-exposure
DEMO deferred
C7 = DENY-ALL
allowRealVenueIo = FALSE
Binance / venue I/O = ZERO
```

`vaultSecretId` remains credential reference only — not a security workaround for logical identity.

---

## 12. Scope freeze

**Approved FIV-CONN-02 scope:**

```text
1. Strategy B provider/environment uniqueness (partial unique index)
2. Application slot check keyed by workspace + provider + environment
3. Pre-apply non-destructive duplicate audit
4. P2002 / ConflictException error semantics (no secrets)
5. Concurrency / uniqueness regression tests
6. Preserve FIV-CONN-01 immutability / DEMO / omit-env reject
```

**Explicitly OUT OF SCOPE:**

```text
FIV-CONN-03
FIV-CONN-04
FIV-CONN-05
LIVE backfill
credential provisioning
Vault credential wiring
Binance handshake / Binance I/O / venue I/O / FIV
C7 / S04 / HumanStartProof / ExecutionAdapter / EG1 changes
real capital
DEMO enablement
destructive duplicate cleanup
Strategy A full unique
unrelated refactoring / architecture redesign
```

---

## 13. Formal Slice Approval

```text
SLICE APPROVAL = GRANTED
```

Granted because:

* SA-01…SA-23 = ALL PASS;
* AC-01…AC-23 = ALL adequately covered / VERIFIED;
* Strategy B confirmed and not replaced;
* NULL semantics and eligibility predicate precise;
* scope frozen;
* no implementation-blocking contradiction against repository evidence or parent freeze.

```text
FIV-CONN-02 ≠ CLOSED
```

This act only authorizes implementation of FIV-CONN-02.

---

## 14. Implementation authorization boundary

If / when implementing after this Approval:

```text
MAY implement:
  Strategy B uniqueness + directly necessary supporting behavior
  (audit, SQL migration for partial unique, app conflict mapping, tests)

MUST NOT implement:
  LIVE backfill
  FIV-CONN-03 / FIV-CONN-04 / FIV-CONN-05
  opportunistic cleanup
  unrelated refactoring
  architecture redesign
  Vault purpose wiring beyond current omit-purpose baseline changes owned by CONN-03
  Binance / FIV / C7 / allowRealVenueIo changes
```

OQ-01 (exact Conflict message copy) and OQ-03 (unit vs integration race test) remain non-blocking implementation polish items.

---

## 15. Next gate

```text
Next gate:
FIV-CONN-02 IMPLEMENTATION
```

Then:

```text
Implementation
        → PO Review
        → Closure
```

FIV-CONN-03…05 remain unauthorized until their own slice gates.

---

## Safety confirmations (this approval act)

| Confirmation | Status |
| ------------ | ------ |
| No implementation performed | YES |
| No schema/migration/Connections/Vault/API/UI changes | YES |
| No LIVE backfill / duplicate cleanup | YES |
| No credentials modified; no secrets exposed | YES |
| No Binance / FIV / capital movement | YES |
| Prior governance artifacts unmodified | YES |
| Protected leftovers untouched | YES |
| Strategy B not replaced | YES |
| FIV-CONN-02 not closed | YES |
| FIV-CONN-03…05 not authorized | YES |
