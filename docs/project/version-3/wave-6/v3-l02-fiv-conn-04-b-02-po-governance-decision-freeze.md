# FIV-CONN-04-B-02 PO/Governance Decision Freeze

**Document:** FIV-CONN-04-B-02 Durable Migration Gate Lease — PO/Governance Decision Freeze  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-02 — Durable Migration Gate Lease  
**Parent:** FIV-CONN-04-B — Write-gate / lifecycle mutation lock  
**Authority:** Product Owner / Chief Architect  
**Nature:** **GOVERNANCE DECISION FREEZE ONLY.** Freezes B-02 binding conditions and acceptance criteria. Does **not** implement B-02. Does **not** create Prisma schema/migration/adapter. Does **not** authorize B-03, 04-D, Vault mutation, FIV, C7, venue I/O, or capital. Slice Approval is recorded in the companion artifact.

**Companion Slice Approval:** [`v3-l02-fiv-conn-04-b-02-slice-approval.md`](./v3-l02-fiv-conn-04-b-02-slice-approval.md)

**Repository baseline (freeze start):** `1524e6d08cbbc4ed1c3854f7ba95648b9f6e2714` (`HEAD == origin/main`)

```text
B-02 DECISION FREEZE = COMPLETE
COND-B02-01…COND-B02-06 = PASS (binding implementation constraints)
FIV-CONN-04-B-02 SLICE APPROVAL = SEE COMPANION ARTIFACT
B-02 IMPLEMENTATION = NOT STARTED BY THIS ACT
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Purpose

Convert the reviewed B-02 Planning Package into an explicit PO/Governance Decision Freeze that:

1. Reaffirms frozen parent OD-B-01…08 (not reopened).
2. Freezes B-02-specific mandatory conditions **COND-B02-01…06** as binding implementation constraints.
3. Freezes B02-AC01…B02-AC33.
4. Separates already-frozen governance from technical/operational choices.
5. Enables Slice Approval **only if** COND-B02-01…06 are all **PASS**.

This freeze is **not** wave-level implementation authorization. Parent wave B Implementation Authorization remains the ceiling; B-02 still requires its own Slice Approval + Implementation Planning Package before code.

---

## 2. Current Governance State

| Item                                  | Status                                           |
| ------------------------------------- | ------------------------------------------------ |
| FIV-CONN-04-A                         | **CLOSED**                                       |
| FIV-CONN-04-B-01                      | **CLOSED**                                       |
| B-02 Planning Package                 | COMPLETE (`d92866a…`)                            |
| B-02 Planning Review                  | **PASS WITH CONDITIONS**                         |
| B-02 Architecture Review              | **PASS WITH CONDITIONS** (`1524e6d…`)            |
| B-02 Security Review                  | **PASS WITH CONDITIONS** (`1524e6d…`)            |
| B-02 Slice Approval (pre-this-act)    | **NOT GRANTED**                                  |
| B-02 implementation                   | **NOT STARTED**                                  |
| B-03 / 04-D                           | **NOT AUTHORIZED**                               |
| FIV-CONN-04-B / FIV-CONN-04           | **NOT CLOSED**                                   |
| FIV / Capital / C7 / allowRealVenueIo | NOT PERFORMED / NOT ACTIVATED / DENY-ALL / FALSE |

---

## 3. Authoritative Artifacts

| Artifact                 | Path                                                                                                               | Role                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------- |
| B-02 Planning Package    | [`v3-l02-fiv-conn-04-b-02-planning-package.md`](./v3-l02-fiv-conn-04-b-02-planning-package.md)                     | Design SoT           |
| B-02 Architecture Review | [`v3-l02-fiv-conn-04-b-02-architecture-review.md`](./v3-l02-fiv-conn-04-b-02-architecture-review.md)               | Arch disposition     |
| B-02 Security Review     | [`v3-l02-fiv-conn-04-b-02-security-review.md`](./v3-l02-fiv-conn-04-b-02-security-review.md)                       | Sec disposition      |
| Parent B Planning        | [`v3-l02-fiv-conn-04-b-planning-package.md`](./v3-l02-fiv-conn-04-b-planning-package.md)                           | Parent design        |
| Parent OD-B Freeze       | [`v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md) | OD-B-01…08           |
| Parent Arch / Sec        | B architecture/security reviews                                                                                    | COND-ARCH / COND-SEC |
| Parent Wave Impl Auth    | [`v3-l02-fiv-conn-04-b-implementation-authorization.md`](./v3-l02-fiv-conn-04-b-implementation-authorization.md)   | Governance ceiling   |
| B-01 Closure + contract  | B-01 closure + `migration-gate*.ts`                                                                                | Closed contract SoT  |

---

## 4. Frozen OD-B-01…OD-B-08 Baseline

**NOT REOPENED.** Binding summaries:

| ID          | Binding essence                                                                          |
| ----------- | ---------------------------------------------------------------------------------------- |
| **OD-B-01** | Global authorized migration window; ≤4h; deny-set only; not permanent                    |
| **OD-B-02** | DENY credential store/replace/revoke (all types); ALLOW NON-EXCHANGE create + rename     |
| **OD-B-03** | ALLOW disconnect/disable (status-only; no Vault / vaultSecretId / environment)           |
| **OD-B-04** | Dedicated singleton DB lease + ConnectionsService deny hooks; advisory never sole SoT    |
| **OD-B-05** | TTL + heartbeat + fencing; stale cannot mutate; expiry reclaim; audited operator reclaim |
| **OD-B-06** | Durable Security Audit `connection.migration-gate`                                       |
| **OD-B-07** | Normative deny/allow/privileged matrix; public env UPDATE DENY; 04-D needs lease+fencing |
| **OD-B-08** | Contention = immediate deterministic rejection; no queue/wait/blind retry                |

```text
OD-B-01…08 = FROZEN / BINDING
```

---

## 5. B-01 Dependency

B-01 is **CLOSED** and remains the authoritative contract:

```text
gateKey  = FIV-CONN-04
purpose  = FIV_CONN_04_MIGRATION_BACKFILL
fencing  = fenceGeneration (never fencingToken)
UNKNOWN  => DENY
Port     = MigrationGatePort (acquire/release/heartbeat/observe/validate)
```

B-02 **MUST** implement the closed port/durable SoT behind it. B-02 **MUST NOT** redesign B-01.

```text
B-01 INCOMPATIBILITY = NONE (Architecture Review ARCH-01 = PASS)
```

---

## 6. B-02 Scope

### In scope (when Slice-Approved + Impl-Planned)

```text
- Dedicated durable singleton lease model/table
- Persistence + Prisma migration (later impl act)
- MigrationGatePort production adapter + Nest binding
- acquire / release / heartbeat / observe / validate
- Stale reclaim (authorized acquire on expired)
- Operator reclaim (privileged; fenced; audited)
- fenceGeneration authority
- Durable ≤4h ceiling + TTL/heartbeat
- DB NOW() concurrency/expiry authority
- connection.migration-gate audit integration (catalog + emits)
- CAS predicate/helper export for future 04-D
```

### Out of scope (frozen exclusion)

```text
- B-03 ConnectionsService deny hooks
- 04-D environment UPDATE / backfill
- Vault / credential mutations
- EXCHANGE create changes
- FIV / C7 / capital / live venue I/O
- Soft re-acquire of ACTIVE leases
- Advisory-lock-only SoT
- TradingSession / Connection / KillSwitch overload
- B-01 contract redesign
```

---

## 7. COND-B02-01 — Maximum Window

### Requirement

```text
authorizedUntil <= acquiredAt + 4 hours
```

Must be enforced by **durable transaction semantics**, not application-level validation alone. ≤4h is frozen governance (OD-B-01).

### Evidence

| Source       | Reference                                                |
| ------------ | -------------------------------------------------------- |
| Planning     | §§12–13 (TTL vs max window; `authorizedUntil` persisted) |
| Architecture | CONDITION 01 / ARCH-12 **ACCEPTED**; COND-B02-ARCH-01    |
| Security     | COND-B02-SEC-01; SEC-B02-06; ST-B22                      |

### Disposition

```text
COND-B02-01 = PASS
```

### Binding implementation constraint

Acquire/heartbeat CAS **MUST** clamp and reject any `expiresAt` / proposed expiry beyond persisted `authorizedUntil`, where `authorizedUntil = acquiredAt + authorizedWindowMs` and `authorizedWindowMs ≤ 4h`, using **DB time** predicates inside the lease transaction.

### Verification

- Unit/integration: reject window >4h; heartbeat beyond ceiling fails (ST-B22).
- Prove SQL/CAS predicate — not only pure B-01 helpers.

---

## 8. COND-B02-02 — Atomic Fencing CAS

### Requirement

Protected mutation semantic predicate:

```text
gateKey
+ purpose
+ holderId
+ fenceGeneration
+ ACTIVE
+ DB current time < expiresAt
```

Check-then-save alone is **FORBIDDEN**.

### Evidence

| Source       | Reference                                                     |
| ------------ | ------------------------------------------------------------- |
| Planning     | §§10–11 (fencing; check-then-save prohibition; CAS predicate) |
| Architecture | CONDITION 02 / ARCH-09/10; exact predicate §9                 |
| Security     | SEC-B02-01/04; S03; COND-SEC-B02 design mapping               |

### Disposition

```text
COND-B02-02 = PASS
```

### Binding implementation constraint

B-02 **MUST** expose a same-transaction CAS surface matching the predicate above. 04-D (later) **MUST** use it in the same txn as Connection UPDATE. B-02 itself does not perform 04-D UPDATE.

### Verification

- ST-B23 contract/integration: stale fence rejected after bump.
- Negative test: check-then-save-only path is not accepted as sole control.

---

## 9. COND-B02-03 — Audit Atomicity

### Requirement

Implementation planning **MUST** define transaction semantics for acquire, stale reclaim, release, heartbeat. Lease mutation + applicable Security Audit should be atomic where required by existing audit architecture. **No new audit subsystem.**

### Evidence

| Source       | Reference                                          |
| ------------ | -------------------------------------------------- |
| Planning     | §§25, 28 (audit architecture; same-txn preference) |
| Architecture | CONDITION 03 / ARCH-25; COND-B02-ARCH-03           |
| Security     | SEC-B02-12; S10/S11; Audit Review                  |

### Disposition

```text
COND-B02-03 = PASS
```

### Binding implementation constraint

Use existing `SecurityAuditService.record(..., transaction?)` and event family `connection.migration-gate`. Prefer **same transaction** for acquire / stale reclaim / release / heartbeat success paths. If same-txn is impossible for a path, document failure mode and **fail-closed for 04-D start** until audit is recorded — do not silently accept acquire audit loss. Catalog registration **before** first emit (COND-ARCH-B08).

### Verification

- Acquire success emits `gate_acquired` durably with lease commit.
- S10-style test: audit failure after acquire does not authorize protected work.
- No secrets / `fencingToken` in payloads (ST-B26).

---

## 10. COND-B02-04 — Fence Generation

### Requirement

Sole fencing authority = `fenceGeneration`. Do **not** introduce `fencingToken`, UUID fencing token, or alternate fencing authority.

### Evidence

| Source       | Reference                       |
| ------------ | ------------------------------- |
| Planning     | §§3.4, 10–11; B-01 closed field |
| Architecture | CONDITION 04 / ARCH-08          |
| Security     | SEC-B02-03; S15                 |

### Disposition

```text
COND-B02-04 = PASS
```

### Binding implementation constraint

Prisma column and audit keys **MUST** use `fenceGeneration` / `fence_generation`. Every successful takeover **MUST** advance it. Heartbeat/release **MUST NOT** bump. TradingSession `fencingToken` naming **MUST NOT** be copied.

### Verification

- Schema/review gate rejects `fencingToken` authority fields.
- Takeover increments exactly once per success; rollback grants no bump.

---

## 11. COND-B02-05 — Singleton Initialization

### Requirement

Implementation planning **MUST** define: initial row; initial `fenceGeneration`; idempotent initialization; already-existing row behavior; singleton DB constraint. Migration **not** created in this governance act.

### Evidence

| Source       | Reference                                      |
| ------------ | ---------------------------------------------- |
| Planning     | §§6–7 (model; singleton enforcement; seed)     |
| Architecture | CONDITION 05 / ARCH-05/G; Prisma §12           |
| Security     | Prisma security notes; UNKNOWN on missing seed |

### Disposition

```text
COND-B02-05 = PASS
```

### Binding implementation constraint

- Model `ConnectionMigrationGateLease` / table `connection_migration_gate_leases`.
- PK `gateKey = 'FIV-CONN-04'`.
- Migration seeds one `INACTIVE` row with `fenceGeneration = 0`.
- Idempotent: re-apply / already-existing singleton row must not create a second row or reset an ACTIVE lease silently.
- Hot path must not INSERT a second lease row; missing row → UNKNOWN ⇒ DENY.

### Verification

- Migration seed test; PK uniqueness; dual-INSERT → fail; missing row → UNKNOWN.

---

## 12. COND-B02-06 — Operator Reclaim

### Requirement

Operator reclaim must remain: authorized; purpose-bound; fenced; audited; global; **without emergency bypass**.

### Evidence

| Source       | Reference                     |
| ------------ | ----------------------------- |
| Planning     | §16 (stale/operator reclaim)  |
| Architecture | CONDITION 06 / ARCH-16        |
| Security     | SEC-B02-13; S18; COND-SEC-B03 |

### Disposition

```text
COND-B02-06 = PASS
```

### Binding implementation constraint

Operator reclaim (before TTL) **MUST** bump `fenceGeneration`, emit durable audit, remain privileged/purpose-bound/global. No public force-unlock. No emergency-manager coupling. Exact HTTP/admin surface remains **operational** (not over-frozen); if public HTTP is proposed later, that requires a separate PO decision — semantics here are frozen.

### Verification

- ST-B24: reclaim bumps fence; old fence rejected; audit present.
- Unauthorized reclaim denied (S18).

---

## 13. Architecture Review Disposition

```text
ARCHITECTURE REVIEW = PASS WITH CONDITIONS
BLOCKED COUNT = 0
COND-B02-01…06 = ACCEPTED as binding impl constraints
```

Architecture does **not** authorize implementation by itself. Conditions are satisfied as **design + freeze**, not as completed code.

---

## 14. Security Review Disposition

```text
SECURITY REVIEW = PASS WITH CONDITIONS
BLOCKED COUNT = 0
S01–S19 addressed by design; S20 = ops-trust residual
COND-B02-01…06 = ACCEPTED as binding security constraints
```

Security does **not** authorize implementation by itself.

---

## 15. Technical Decisions

| Decision                                           | Status                 | Notes                                    |
| -------------------------------------------------- | ---------------------- | ---------------------------------------- |
| Model `ConnectionMigrationGateLease`               | **FROZEN (technical)** | Dedicated singleton table                |
| Table `connection_migration_gate_leases`           | **FROZEN (technical)** | Repo naming convention                   |
| Persist `INACTIVE \| ACTIVE`; compute `EXPIRED`    | **FROZEN (technical)** | OD-B02-T6                                |
| Persist `authorizedUntil` + `authorizedWindowMs`   | **FROZEN (technical)** | Supports COND-B02-01                     |
| DB `NOW()` authoritative for CAS/expiry            | **FROZEN (technical)** | COND-ARCH / B02-AC19                     |
| CAS via `updateMany` (+ optional FOR UPDATE)       | **FROZEN (technical)** | Prefer recovery `saveIfVersion` analogue |
| Port adapter implements closed `MigrationGatePort` | **FROZEN (technical)** | No B-01 redesign                         |
| Audit via existing Security Audit                  | **FROZEN (technical)** | No new subsystem                         |

These are binding for B-02 implementation planning/implementation but are **not** new OD-B policy.

---

## 16. Governance Decisions

| Decision                                 | Status                                              |
| ---------------------------------------- | --------------------------------------------------- |
| OD-B-01…08                               | Already frozen — **not reopened**                   |
| ≤4h maximum window                       | **Governance frozen** (OD-B-01 / COND-B02-01)       |
| COND-B02-01…06                           | **Frozen as binding B-02 conditions**               |
| B02-AC01…AC33                            | **Frozen** (see §18)                                |
| `fenceGeneration` sole fencing           | **Governance+contract frozen** (B-01 + COND-B02-04) |
| Audit family `connection.migration-gate` | **Governance frozen** (OD-B-06)                     |
| B-03 / 04-D not in B-02                  | **Governance frozen** (slice walls)                 |

---

## 17. Frozen Implementation Constraints

```text
1. Durable txn enforces authorizedUntil <= acquiredAt + 4h (COND-B02-01)
2. Protected CAS predicate exact (COND-B02-02); check-then-save alone FORBIDDEN
3. Acquire/reclaim/release/heartbeat audit semantics defined; prefer same-txn (COND-B02-03)
4. fenceGeneration only (COND-B02-04)
5. Singleton seed fenceGeneration=0; PK; idempotent init (COND-B02-05)
6. Operator reclaim authorized/fenced/audited; no emergency bypass (COND-B02-06)
7. Implement MigrationGatePort; do not change B-01 contract files unless PO reopens B-01
8. Register connection.migration-gate before first emit
9. No Vault/external I/O inside lease transactions
10. No B-03 hooks; no 04-D UPDATE/backfill in B-02
```

---

## 18. Acceptance Criteria (B02-AC01…B02-AC33)

| ID       | Criterion                                      | Status     | Implementation implication          |
| -------- | ---------------------------------------------- | ---------- | ----------------------------------- |
| B02-AC01 | Dedicated durable singleton lease model        | **FROZEN** | Create dedicated Prisma model/table |
| B02-AC02 | Global gate identity enforced                  | **FROZEN** | PK/`gateKey=FIV-CONN-04` only       |
| B02-AC03 | Purpose = `FIV_CONN_04_MIGRATION_BACKFILL`     | **FROZEN** | Persist + reject mismatch           |
| B02-AC04 | No workspace/provider/environment partitioning | **FROZEN** | No such columns/rows                |
| B02-AC05 | Database is durable SoT                        | **FROZEN** | No memory SoT                       |
| B02-AC06 | Concurrent acquire cannot grant two ACTIVE     | **FROZEN** | CAS + singleton                     |
| B02-AC07 | Contention immediate deterministic rejection   | **FROZEN** | `CONTENTION_DENIED`; no queue       |
| B02-AC08 | Expired authority safely reclaimable           | **FROZEN** | Authorized acquire on expired       |
| B02-AC09 | Takeover advances `fenceGeneration`            | **FROZEN** | Increment on success only           |
| B02-AC10 | Stale cannot release newer                     | **FROZEN** | Owner+fence CAS                     |
| B02-AC11 | Stale cannot heartbeat newer                   | **FROZEN** | Owner+fence CAS                     |
| B02-AC12 | Protected mutation requires current fencing    | **FROZEN** | Export CAS for 04-D                 |
| B02-AC13 | Check-then-save alone forbidden                | **FROZEN** | Design/review reject                |
| B02-AC14 | Atomic same-txn CAS defined                    | **FROZEN** | COND-B02-02                         |
| B02-AC15 | TTL ≠ max authorized window                    | **FROZEN** | Distinct fields                     |
| B02-AC16 | Max authorized window ≤4h                      | **FROZEN** | COND-B02-01                         |
| B02-AC17 | Heartbeat ≤ `authorizedUntil`                  | **FROZEN** | SQL ceiling                         |
| B02-AC18 | Expired cannot be resurrected                  | **FROZEN** | Heartbeat fail-closed               |
| B02-AC19 | DB authoritative time                          | **FROZEN** | `NOW()` predicates                  |
| B02-AC20 | Unknown/unreadable = fail-closed               | **FROZEN** | UNKNOWN ⇒ DENY                      |
| B02-AC21 | Release owner+fence protected                  | **FROZEN** | CAS release                         |
| B02-AC22 | Stale reclaim fenced and audited               | **FROZEN** | Bump + audit                        |
| B02-AC23 | Audit family `connection.migration-gate`       | **FROZEN** | Catalog + emit                      |
| B02-AC24 | No secrets/raw `fencingToken` in audit         | **FROZEN** | Sanitizer/ST-B26                    |
| B02-AC25 | Multi-instance races covered                   | **FROZEN** | Tests R01–R15 subset                |
| B02-AC26 | No application-memory SoT                      | **FROZEN** | Adapter rule                        |
| B02-AC27 | No supported application bypass                | **FROZEN** | Single port path                    |
| B02-AC28 | Model C preserved                              | **FROZEN** | No Vault purpose change             |
| B02-AC29 | Strategy B preserved                           | **FROZEN** | No uniqueness change                |
| B02-AC30 | No Vault/credential/external I/O               | **FROZEN** | Slice non-scope                     |
| B02-AC31 | No B-03 hooks                                  | **FROZEN** | Boundary                            |
| B02-AC32 | No 04-D/backfill                               | **FROZEN** | Boundary                            |
| B02-AC33 | Compatible with CLOSED B-01                    | **FROZEN** | Port compatibility                  |

```text
B02-AC01…AC33 = ALL FROZEN
BLOCKED AC COUNT = 0
```

---

## 19. Explicit Exclusions

This Decision Freeze does **not** authorize or include:

- B-03 ConnectionsService enforcement hooks
- 04-D environment UPDATE / LIVE backfill
- Vault secret create/replace/revoke/delete
- Credential business-logic redesign
- EXCHANGE create policy changes beyond matrix preservation
- FIV execution
- C7 enablement / `allowRealVenueIo=true`
- Real capital / live venue I/O
- Permanent global credential freeze
- Soft re-acquire / queue / wait / blind retry
- New audit architecture
- B-01 source modifications
- Creating Prisma migration in **this** governance task

---

## 20. Safety Boundary

| Control               | Status for this act |
| --------------------- | ------------------- |
| Database writes       | **ZERO**            |
| Prisma schema changes | **ZERO**            |
| Vault / credentials   | **ZERO**            |
| External I/O          | **ZERO**            |
| FIV                   | **NOT PERFORMED**   |
| Capital               | **ZERO**            |
| C7                    | **DENY-ALL**        |
| allowRealVenueIo      | **FALSE**           |
| Protected leftovers   | **UNTOUCHED**       |
| B-01 files            | **UNTOUCHED**       |

---

## 21. Decision

### Condition matrix

| Condition   | Disposition |
| ----------- | ----------- |
| COND-B02-01 | **PASS**    |
| COND-B02-02 | **PASS**    |
| COND-B02-03 | **PASS**    |
| COND-B02-04 | **PASS**    |
| COND-B02-05 | **PASS**    |
| COND-B02-06 | **PASS**    |

```text
COND-B02 BLOCKED COUNT = 0
DECISION FREEZE = COMPLETE
SLICE APPROVAL ELIGIBILITY = SATISFIED
```

### Operational choices (NOT over-frozen as OD-B policy)

| Choice                                  | Classification            | Default recommendation                                                |
| --------------------------------------- | ------------------------- | --------------------------------------------------------------------- |
| Default TTL 15 minutes                  | **Operational/technical** | Acceptable under ≤4h ceiling                                          |
| Heartbeat cadence ≤5 minutes            | **Operational/technical** | Must renew before TTL                                                 |
| Stale reclaim at `expiresAt ≤ DB NOW()` | **Technical**             | No extra grace                                                        |
| Exact operator reclaim HTTP surface     | **Operational**           | Privileged method required; public HTTP needs separate PO if proposed |

```text
≤4h MAXIMUM = GOVERNANCE FROZEN (NOT AN OPERATIONAL CHOICE)
```

### Formal freeze decision

```text
FIV-CONN-04-B-02 PO/GOVERNANCE DECISION FREEZE = COMPLETE
COND-B02-01…06 = FROZEN / PASS
B02-AC01…AC33 = FROZEN
OD-B-01…08 = UNCHANGED / NOT REOPENED
```

---

## 22. Next Gate

```text
Companion: FIV-CONN-04-B-02 Slice Approval (GRANTED if eligibility holds)

After Slice Approval:
  Next gate = FIV-CONN-04-B-02 IMPLEMENTATION PLANNING PACKAGE

DO NOT implement B-02 in this Decision Freeze act.
DO NOT skip Implementation Planning Package.
DO NOT authorize B-03 / 04-D / FIV / C7 / capital.
```

---

**END OF FIV-CONN-04-B-02 PO/GOVERNANCE DECISION FREEZE**
