# FIV-CONN-04-B-04 Decision Freeze

**Document:** FIV-CONN-04-B-04 Backfill Integration Boundary — Decision Freeze
**Date:** 2026-09-18
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-04-B-04 — 04-D integration boundary
**Authority:** Product Owner / Chief Architect (immutable governance recording)
**Nature:** **PO/GOVERNANCE DECISION FREEZE ONLY.** Freezes C-B04-01…06 and required B-04 implementation rules. Does **not** implement B-04. Does **not** modify production code, tests, Prisma, migrations, Vault, 04-D, backfill, FIV, C7, venue I/O, or capital.

**Basis:**

| Artifact | Path / commit |
| -------- | ------------- |
| Planning Package | [`v3-l02-fiv-conn-04-b-04-planning-package.md`](./v3-l02-fiv-conn-04-b-04-planning-package.md) |
| Planning Review | [`v3-l02-fiv-conn-04-b-04-planning-review.md`](./v3-l02-fiv-conn-04-b-04-planning-review.md) @ `913f095…` (PASS WITH CONDITIONS) |
| Parent OD-B freeze | [`v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md) |
| Parent Impl Authorization | [`v3-l02-fiv-conn-04-b-implementation-authorization.md`](./v3-l02-fiv-conn-04-b-implementation-authorization.md) §19 |
| Parent Arch / Security | ARCH-B04, COND-ARCH-B04, COND-SEC-B05 |
| B-01 / B-02 / B-03 | CLOSED contracts (consume; do not redesign) |

**Repository baseline (freeze act start):** `913f095b4312c1bc778df050d60f26bad638a66e` (`HEAD == origin/main`)

---

## 1. Decision Status

```text
DECISION FREEZE = APPROVED
C-B04-01…06 = FROZEN / PASS
REQUIRED FROZEN DECISIONS 1…13 = FROZEN / APPROVED
```

```text
B-04 IMPLEMENTATION = NOT STARTED BY THIS ARTIFACT
Slice Approval = SEPARATE ARTIFACT (may be GRANTED only after this freeze)
04-D / FIV / C7 / live I/O / capital = NOT AUTHORIZED
```

Protected dirty/untracked leftovers were **not** modified.

Parent OD-B-01…08 are **not** reopened.

---

## 2. C-B04-01…06 Freeze Results

| ID | Condition (Planning Review §23) | Verdict | Frozen rule |
| -- | ------------------------------- | ------- | ----------- |
| **C-B04-01** | Export surface for durable write proof | **PASS / FROZEN** | See §3.1 |
| **C-B04-02** | CAS may touch `heartbeatAt`; must not bump fence | **PASS / FROZEN** | See §3.2 |
| **C-B04-03** | Internal API only; no public Connections HTTP | **PASS / FROZEN** | See §3.3 |
| **C-B04-04** | Start = acquire primary; validate = resume; observe ≠ start | **PASS / FROZEN** | See §3.4 |
| **C-B04-05** | Heartbeat/release assigned to B04-S1 | **PASS / FROZEN** | See §3.5 |
| **C-B04-06** | Zero Connection.environment UPDATE in B-04 | **PASS / FROZEN** | See §3.6 |

```text
C-B04 FAIL / BLOCKED COUNT = 0
```

No governance conflict with ARCH-B04, COND-ARCH-B04, COND-SEC-B05, or closed B-01/B-02/B-03.

---

## 3. Frozen Condition Detail

### 3.1 C-B04-01 — Durable write-proof export surface

```text
C-B04-01 = FROZEN / PASS
```

**Frozen rule:**

```text
B-04 write-authority proof MUST invoke
  PrismaMigrationGateAdapter.assertDurableAuthorityCas(transaction, grant)
OR an equivalent same-txn CAS API that is:
  - explicitly exported for Nest DI (e.g. port extension / dedicated token)
  - backed by the same durable singleton lease row (no second SoT)
  - semantically identical to B-02 CAS predicates
    (gateKey + purpose + holderId + fenceGeneration + ACTIVE + expiresAt > DB NOW)

FORBIDDEN:
  - informal unchecked cast to concrete adapter without recorded export
  - observe()-only or validate()-only as write authority
  - a second lease table / process-local SoT
```

Exact Nest token / interface shape is an Implementation Planning detail under this freeze.

### 3.2 C-B04-02 — CAS side-effect vs fencing authority

```text
C-B04-02 = FROZEN / PASS
```

**Frozen rule:**

```text
assertDurableAuthorityCas MAY touch heartbeatAt / updatedAt as a
non-authority side-effect of the CAS proof (B-02 residual behavior).

MUST NOT:
  - bump fenceGeneration
  - transition lease state to grant new authority
  - resurrect EXPIRED / OWNERSHIP_LOST grants
```

### 3.3 C-B04-03 — HTTP / API interpretation

```text
C-B04-03 = FROZEN / PASS
```

**Frozen rule:**

```text
Parent planning “expose acquire/heartbeat/release API” =
  INTERNAL privileged composition over MigrationGatePort
  (Nest provider / service façade).

Public ConnectionsController endpoints for
  acquire / release / heartbeat / reclaim / start / write-proof
remain OUT OF SCOPE for B-04.

Adding public HTTP requires a SEPARATE PO Decision Freeze (COND-SEC-B09).
Public Connection.environment mutation API remains FORBIDDEN (AC-B23 / ARCH-B07).
```

### 3.4 C-B04-04 — Start semantics

```text
C-B04-04 = FROZEN / PASS
```

**Frozen rule:**

```text
START (beginAuthorizedMigrationSession or equivalent) requires privileged actor.

PRIMARY PATH (new runner):
  durable MigrationGatePort.acquire → ACTIVE grant
  for purpose FIV_CONN_04_MIGRATION_BACKFILL

RESUME / CONTINUE PATH ONLY:
  MigrationGatePort.validate(existingGrant) → ACTIVE match
  (must already hold matching holderId + fenceGeneration + non-expired)

NEVER:
  observe() alone = start success
  process-local “I acquired earlier” without durable proof
  soft re-acquire / wait / queue on CONTENTION
```

### 3.5 C-B04-05 — Heartbeat / release slice ownership

```text
C-B04-05 = FROZEN / PASS
```

**Frozen rule:**

```text
B04-S1 OWNS:
  - start / refuse-start
  - heartbeat wrappers
  - release wrappers
  (all delegated to MigrationGatePort; ownership + fence bound)

B04-S2 OWNS:
  - same-txn write-authority proof only
  (assertDurableAuthorityCas / equivalent)

B04-S3 OWNS:
  - boundary tests + security/regression walls

AC13 (heartbeat/release via MigrationGatePort semantics) = B04-S1 ownership.
Heartbeat/release MUST NOT authorize protected writes without CAS proof.
```

### 3.6 C-B04-06 — Zero environment UPDATE

```text
C-B04-06 = FROZEN / PASS
```

**Frozen rule:**

```text
B-04 performs ZERO Connection.environment UPDATE / LIVE backfill.

Any production path, helper, or test double shipped under B-04 that mutates
Connection.environment is a SCOPE DEFECT.

04-D alone owns privileged environment UPDATE execution (future; not authorized here).
```

---

## 4. Required Frozen Decisions (1…13)

| # | Decision | Verdict |
| - | -------- | ------- |
| 1 | `observe()` is **NEVER** durable write authority | **FROZEN** |
| 2 | `assertDurableAuthorityCas` (or equivalent same-txn CAS) is **mandatory** wherever durable write-authority proof is required | **FROZEN** |
| 3 | **No** second source of truth | **FROZEN** |
| 4 | **No** public Connections HTTP gate surface in B-04 | **FROZEN** |
| 5 | **UNKNOWN ⇒ REFUSE** (start and write-proof) | **FROZEN** |
| 6 | Only **ACTIVE + matching ownership + matching fence + same-txn CAS** may produce durable write authority | **FROZEN** |
| 7 | Heartbeat/release remain **ownership-bound** (B-02 semantics; stale rejected) | **FROZEN** |
| 8 | B-04 performs **no** environment UPDATE | **FROZEN** |
| 9 | **04-D** remains separate | **FROZEN** |
| 10 | **Backfill** remains separate | **FROZEN** |
| 11 | **Vault** remains separate | **FROZEN** |
| 12 | **FIV** remains separate | **FROZEN** |
| 13 | **C7** remains separate | **FROZEN** |

```text
REQUIRED FROZEN DECISIONS 1…13 = APPROVED
```

---

## 5. State / Fail-Closed Matrix (frozen for B-04)

| Observation | Start | Heartbeat / Release | Write-proof |
| ----------- | ----- | ------------------- | ----------- |
| INACTIVE | REFUSE | N/A / N/A | REFUSE |
| ACTIVE + matching grant | ALLOW (holder) | ALLOW iff port CAS | ALLOW iff same-txn CAS |
| ACTIVE + wrong fence/holder | REFUSE | REFUSE | REFUSE |
| EXPIRED | REFUSE | REFUSE | REFUSE |
| OWNERSHIP_LOST | REFUSE | REFUSE | REFUSE |
| CONTENTION_DENIED | REFUSE | N/A | N/A |
| UNKNOWN | REFUSE | REFUSE | REFUSE |

```text
NEVER: UNKNOWN → ALLOW
NEVER: observe() alone → ALLOW write-proof
NEVER: check-outside-txn alone → ALLOW write-proof
```

---

## 6. Acceptance Criteria Disposition

| ID | Disposition |
| -- | ----------- |
| B04-AC01 | **ACCEPTED** |
| B04-AC02 | **ACCEPTED** |
| B04-AC03 | **ACCEPTED** |
| B04-AC04 | **ACCEPTED** |
| B04-AC05 | **ACCEPTED** |
| B04-AC06 | **ACCEPTED** |
| B04-AC07 | **ACCEPTED** |
| B04-AC08 | **ACCEPTED** |
| B04-AC09 | **ACCEPTED** |
| B04-AC10 | **ACCEPTED** |
| B04-AC11 | **ACCEPTED** |
| B04-AC12 | **ACCEPTED** |
| B04-AC13 | **ACCEPTED** (owned by B04-S1 per C-B04-05) |
| B04-AC14 | **ACCEPTED** |
| B04-AC15 | **ACCEPTED** |
| B04-AC16 | **ACCEPTED** |
| B04-AC17 | **ACCEPTED** |
| B04-AC18 | **ACCEPTED** |

```text
B04-AC01…B04-AC18 = ACCEPTED (0 BLOCKED)
```

---

## 7. Security Criteria Compatibility

| ID | Compatible with freeze? |
| -- | ----------------------- |
| SB-B04-01…SB-B04-12 | **YES — CONFIRMED** |

No SB weakened. Observe-only bypass, client fence, UNKNOWN fail-open, concurrent second runner, stale writer, ungated backfill, public env API, and Vault-in-txn remain fail-closed obligations for implementation verification.

```text
SB-B04-01…12 = COMPATIBLE / BINDING
```

---

## 8. Architecture / Security Parent Conditions

| ID | Freeze disposition |
| -- | ------------------ |
| **ARCH-B04** | **BINDING** — refuse start without valid lease + fencing proof |
| **COND-ARCH-B04** | **BINDING** — same-txn durable CAS for write proof; UPDATE execution remains 04-D |
| **COND-SEC-B05** | **BINDING** — runner must hold lease+fence; no ungated env backfill scripts |

---

## 9. Slice Scope (frozen)

### IN SCOPE (ONLY)

- Privileged 04-D **integration boundary** façade
- Start / refuse-start boundary
- Heartbeat / release wrappers (B04-S1)
- Same-txn durable **write-proof** boundary (B04-S2)
- Reuse of closed B-01 / B-02 contracts (`MigrationGatePort`, `assertDurableAuthorityCas` / equivalent, pure asserts, audit family)
- Tests proving refuse-start / refuse-write / contention / stale fence (B04-S3)

### OUT OF SCOPE

- 04-D privileged environment UPDATE / backfill execution
- LIVE backfill / data migration
- Vault mutation / redesign / compensation
- FIV / C7 / live capital / venue I/O
- Public Connections gate HTTP
- Prisma schema / migrations
- B-01 / B-02 / B-03 redesign
- S20 remediation / D-B03 residual remediation
- Permanent standing credential freeze

---

## 10. Residuals

| Residual | Reassigned to B-04? | Disposition |
| -------- | ------------------- | ----------- |
| **D-B03-04** Vault orphan | **NO** | **PRESERVED** |
| **D-B03-06** S20 | **NO** | **PRESERVED** |
| **D-B03-08** observe→mutate race | **NO** | **PRESERVED** |

```text
NO SILENT REASSIGNMENT
```

---

## 11. Implementation Authorization Boundary

```text
This Decision Freeze does NOT:
  - implement B-04
  - start coding / tests
  - authorize 04-D / backfill / FIV / C7 / capital / venue I/O
  - close B-04 / FIV-CONN-04-B / Wave 6

Slice Approval (companion artifact) may grant the slice path to
Implementation Planning. Coding remains a later act.
```

---

## 12. Next Gate

```text
Companion: FIV-CONN-04-B-04 SLICE APPROVAL
Then (if GRANTED): FIV-CONN-04-B-04 IMPLEMENTATION PLANNING
```

---

## Final Freeze State

```text
DECISION FREEZE = APPROVED
C-B04-01…06 = FROZEN / PASS
Required decisions 1…13 = FROZEN
B04-AC01…18 = ACCEPTED
SB-B04-01…12 = COMPATIBLE
Residuals D-B03-04/06/08 = PRESERVED
Implementation started = NO
```

**END OF FIV-CONN-04-B-04 DECISION FREEZE**
