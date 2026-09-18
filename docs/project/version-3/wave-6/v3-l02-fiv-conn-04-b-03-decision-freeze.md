# FIV-CONN-04-B-03 Decision Freeze

**Document:** FIV-CONN-04-B-03 Lifecycle Enforcement Hooks — Decision Freeze  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-03 — Application/service enforcement hooks  
**Authority:** Product Owner / Chief Architect (immutable governance recording)  
**Nature:** **PO/GOVERNANCE DECISION FREEZE ONLY.** Freezes D-B03-01…08 and C-B03-01. Does **not** implement B-03. Does **not** modify production code, Prisma, Vault, 04-D, backfill, FIV, C7, venue I/O, or capital.

**Basis:**

| Artifact               | Path / commit                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Planning Package       | [`v3-l02-fiv-conn-04-b-03-planning-package.md`](./v3-l02-fiv-conn-04-b-03-planning-package.md) @ `0002f00…`                      |
| Planning Review        | [`v3-l02-fiv-conn-04-b-03-planning-review.md`](./v3-l02-fiv-conn-04-b-03-planning-review.md) @ `78f8dd8…` (PASS WITH CONDITIONS) |
| Parent OD-B freeze     | [`v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md)               |
| Parent Arch Review     | [`v3-l02-fiv-conn-04-b-architecture-review.md`](./v3-l02-fiv-conn-04-b-architecture-review.md) (COND-ARCH-B05)                   |
| Parent Security Review | [`v3-l02-fiv-conn-04-b-security-review.md`](./v3-l02-fiv-conn-04-b-security-review.md)                                           |
| B-01 contract (CLOSED) | `migration-gate.ts` / `.port.ts`                                                                                                 |
| B-02 lease (CLOSED)    | `PrismaMigrationGateAdapter` / `MIGRATION_GATE_PORT`                                                                             |

**Repository baseline (freeze act start):** `78f8dd8981b96c8422cb59300a6a948d3f9a47f8` (`HEAD == origin/main`)

---

## 1. Decision Status

```text
DECISION FREEZE = APPROVED
ALL DECISIONS D-B03-01…08 FROZEN
C-B03-01 = RESOLVED / FROZEN
C-B03-02 = SATISFIED (this freeze ratifies provisional decisions)
C-B03-03 = CLOSED AS OPTIONAL (non-mandatory helper extraction)
```

```text
B-03 IMPLEMENTATION = NOT STARTED BY THIS ARTIFACT
Slice Approval = SEPARATE ARTIFACT (may be GRANTED only after this freeze)
04-D / FIV / C7 / live I/O / capital = NOT AUTHORIZED
```

Protected dirty/untracked leftovers were **not** modified.

**Authoritative decision ID set:** Planning Review brief numbering (not Planning Package §19 renumbering).

---

## 2. D-B03-01…08

| Decision     | Proposed Decision                                                                                                                                                                                             | Evidence                                                                                                          | Frozen? | Conditions                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------- |
| **D-B03-01** | Gate-denied deny-set → Nest `ConflictException` (HTTP **409**); stable non-secret public message; no lease/holder/fence/DB leakage; ordinary authz remains **403** `ForbiddenException` / existing BadRequest | ConnectionsService conflict convention; controller preserves ConflictException; Arch Review conflict/locked-style | **YES** | Exact message string(s) fixed at Implementation Planning |
| **D-B03-02** | Entry `observe` for all deny-set methods; after Vault I/O and before Connection mutation side-effects, **re-observe** for store/replace/**revoke**; ACTIVE\|UNKNOWN → audit + deny; no Vault-spanning DB txn  | COND-ARCH-B05; ST-B25; service Vault→Connection sequencing                                                        | **YES** | C-B03-01 includes revoke                                 |
| **D-B03-03** | Durable `lifecycle_mutation_blocked` before throw; payload + `attribution.workspaceId` + `actorId`; audit failure ⇒ fail closed (do not mutate)                                                               | OD-B-06; COND-SEC-B06; existing Security Audit                                                                    | **YES** | May extend audit helper to pass workspace attribution    |
| **D-B03-04** | Vault/Connection desync after mid-flight deny = **ACCEPTED RESIDUAL**; no B-03 compensation txn / soft-pass                                                                                                   | Parent B planning §2.3; COND-ARCH-B05 fail-closed bind only                                                       | **YES** | Later ops/governance owns cleanup                        |
| **D-B03-05** | EXPIRED / OWNERSHIP_LOST / CONTENTION_DENIED → deny-set **ALLOW** per `isDenySetBlocked`; ACTIVE\|UNKNOWN → **DENY**; do not reinterpret                                                                      | Closed B-01 helpers                                                                                               | **YES** | None                                                     |
| **D-B03-06** | Direct Prisma/DBA mutate = **S20 residual outside B-03**; app path = ConnectionsService only                                                                                                                  | Repo grep at freeze HEAD; B-02 S20                                                                                | **YES** | COND-SEC-B04 if future workers added                     |
| **D-B03-07** | Context from existing authz only; `observe()` is additional policy, not authz replacement; no client grant fields                                                                                             | Controller/DTO/service evidence                                                                                   | **YES** | None                                                     |
| **D-B03-08** | Sequence: authz → entry observe → (prechecks) → Vault I/O → re-observe → Connection mutate or fail closed; no new atomicity; same-txn CAS remains **04-D only**; create = entry observe only                  | COND-ARCH-B04/B05/B10                                                                                             | **YES** | None                                                     |

```text
D-B03-01…08 = FROZEN / APPROVED
```

---

## 3. C-B03-01 — Revoke Mid-Flight (FINAL)

```text
C-B03-01 = RESOLVED / FROZEN
Decision: REVOKE REQUIRES MID-FLIGHT RE-OBSERVATION
```

### Repository facts

`ConnectionsService.revoke`:

1. Load Connection row
2. `vault.get` (ownership check)
3. `vault.revoke` (**Vault I/O mutation**)
4. `updateStatus(…, 'REVOKED')` (**durable Connection mutation side-effect**)
5. Lifecycle audit

This is the same Vault→Connection race class as store/replace.

### Binding parent condition

**COND-ARCH-B05:** Deny-set paths MUST observe durable ON; **after Vault I/O and before Connection bind side-effects**, re-validate gate still not active **or** fail closed on bind if gate flipped ON mid-flight.

Revoke’s `updateStatus(…, 'REVOKED')` is a Connection mutation side-effect after Vault I/O. Narrowing revoke to entry-only would contradict COND-ARCH-B05.

### Frozen revoke behavior

| Step                                                                        | Required behavior                                                                                                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry                                                                       | `observe()`; if ACTIVE\|UNKNOWN → audit `lifecycle_mutation_blocked` + `ConflictException`; do not Vault-revoke                                                     |
| After `vault.revoke` succeeds                                               | **Re-observe** before `updateStatus(REVOKED)`                                                                                                                       |
| Re-observe ACTIVE\|UNKNOWN / observe error                                  | Audit blocked + `ConflictException`; **do not** update Connection to REVOKED                                                                                        |
| Re-observe non-blocking (INACTIVE/EXPIRED/OWNERSHIP_LOST/CONTENTION_DENIED) | Proceed with status update under ordinary rules                                                                                                                     |
| New transaction boundary?                                                   | **No** — no Vault-spanning Prisma txn; no new atomicity mechanism                                                                                                   |
| Architecture change?                                                        | **No** — apply existing COND-ARCH-B05 consistently                                                                                                                  |
| Partial mutation possible?                                                  | **Yes** — Vault may already be revoked while Connection remains non-REVOKED → covered by **D-B03-04** accepted residual (fail closed; no soft-pass cleanup in B-03) |
| Audit                                                                       | Required on both entry deny and mid-flight deny (D-B03-03)                                                                                                          |

### Explicit non-decisions

- Does **not** require same-txn fencing CAS (04-D only).
- Does **not** authorize Vault compensation / auto-restore.
- Does **not** change OD-B-07: revoke remains DENY while gate ACTIVE.

### AC10 approved wording change

**Prior (Planning Package):**  
Credential store/replace re-check gate after Vault I/O before Connection bind (COND-ARCH-B05 / ST-B25).

**Frozen (this Decision Freeze):**

```text
B03-AC10: Credential store, replace, and revoke MUST re-observe the migration
gate after Vault I/O and before Connection mutation side-effects
(vaultSecretId bind for store/replace; status REVOKED for revoke).
ACTIVE | UNKNOWN | observe failure ⇒ durable lifecycle_mutation_blocked audit
+ fail closed (no Connection mutation). (COND-ARCH-B05 / ST-B25 / C-B03-01)
```

```text
AC10 STATUS AFTER FREEZE = PASS
```

---

## 4. Architecture Freeze

| #   | Decision                                                                                                                 | Status              |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| 1   | `ConnectionsService` method entry is the canonical enforcement boundary                                                  | **FROZEN**          |
| 2   | Controller-only enforcement is insufficient                                                                              | **FROZEN**          |
| 3   | B-03 consumes `MIGRATION_GATE_PORT` / `MigrationGatePort.observe()`                                                      | **FROZEN**          |
| 4   | B-03 reuses B-01 classification helpers (`classifyConnectionMutation`, `shouldBlockDenySetMutation`, `isDenySetBlocked`) | **FROZEN**          |
| 5   | Migration gate does not replace normal authentication/authorization                                                      | **FROZEN**          |
| 6   | Protected operations fail closed on UNKNOWN / observe error                                                              | **FROZEN**          |
| 7   | Store/replace perform post-Vault re-observation                                                                          | **FROZEN**          |
| 8   | Revoke mid-flight = C-B03-01 (required re-observe)                                                                       | **FROZEN**          |
| 9   | No Vault-spanning DB transaction                                                                                         | **FROZEN**          |
| 10  | No second migration gate / in-memory SoT / client-controlled gate                                                        | **FROZEN**          |
| 11  | No direct client-controlled migration authority                                                                          | **FROZEN**          |
| 12  | S20 direct Prisma residual remains outside B-03                                                                          | **FROZEN**          |
| 13  | 04-D remains outside B-03                                                                                                | **FROZEN**          |
| —   | EXCHANGE `create` = entry observe only (no Vault)                                                                        | **FROZEN**          |
| —   | Helper extraction optional (C-B03-03)                                                                                    | **FROZEN OPTIONAL** |

```text
ARCHITECTURE FREEZE = APPROVED
BLOCKERS = NONE
```

---

## 5. Security Freeze

| ID        | Threat                              | Result        | Frozen control                                                  |
| --------- | ----------------------------------- | ------------- | --------------------------------------------------------------- |
| SB-B03-01 | Alternate ConnectionsService path   | **PASS**      | Hook all four deny-set methods; no ungated twins                |
| SB-B03-02 | Controller/internal bypass          | **PASS**      | Service-level enforcement                                       |
| SB-B03-03 | Direct Prisma bypass                | **CONDITION** | S20 residual documented; outside app trust                      |
| SB-B03-04 | Cross-workspace gate confusion      | **PASS**      | Global gate + workspace row isolation + target workspace audit  |
| SB-B03-05 | Fail-open observe failure           | **PASS**      | UNKNOWN → DENY                                                  |
| SB-B03-06 | Client-supplied migration authority | **PASS**      | No grant DTO/service fields                                     |
| SB-B03-07 | Gate replacing ordinary authz       | **PASS**      | Additional deny only                                            |
| SB-B03-08 | Gate change during operation        | **PASS**      | Entry + mid-flight re-observe for store/replace/revoke          |
| SB-B03-09 | Privileged context leakage          | **PASS**      | No public acquire/release/heartbeat/reclaim on Connections HTTP |
| SB-B03-10 | ACTIVE/EXPIRED/UNKNOWN semantics    | **PASS**      | B-01 helpers only                                               |
| SB-B03-11 | Audit bypass                        | **PASS**      | Audit before throw; audit fail ⇒ fail closed                    |
| SB-B03-12 | Unreviewed operational bypass       | **CONDITION** | S20 + future COND-SEC-B04                                       |
| SB-B03-13 | Vault orphan residual               | **CONDITION** | Accepted residual D-B03-04                                      |
| SB-B03-14 | HTTP denial leakage                 | **PASS**      | D-B03-01 non-leaking ConflictException                          |

```text
SECURITY FREEZE = APPROVED
BLOCKERS = NONE
(CONDITIONS = accepted residuals / future worker governance — not B-03 blockers)
```

---

## 6. Operation Matrix

Frozen (OD-B-07 / D-CONN-04-08 / OD-B-02 / OD-B-03 / B-01 `isDenySetBlocked`). **Not reopened.**

| Operation                                 | INACTIVE        | ACTIVE       | EXPIRED      | OWNERSHIP_LOST | CONTENTION_DENIED | UNKNOWN      | B-03         |
| ----------------------------------------- | --------------- | ------------ | ------------ | -------------- | ----------------- | ------------ | ------------ |
| credential store                          | ALLOW           | **DENY**     | ALLOW        | ALLOW          | ALLOW             | **DENY**     | Owns         |
| credential replace                        | ALLOW           | **DENY**     | ALLOW        | ALLOW          | ALLOW             | **DENY**     | Owns         |
| credential revoke                         | ALLOW           | **DENY**     | ALLOW        | ALLOW          | ALLOW             | **DENY**     | Owns         |
| EXCHANGE create                           | ALLOW           | **DENY**     | ALLOW        | ALLOW          | ALLOW             | **DENY**     | Owns         |
| NON-EXCHANGE create                       | ALLOW           | ALLOW        | ALLOW        | ALLOW          | ALLOW             | ALLOW        | Observe only |
| rename                                    | ALLOW           | ALLOW        | ALLOW        | ALLOW          | ALLOW             | ALLOW        | Observe only |
| disconnect                                | ALLOW           | ALLOW        | ALLOW        | ALLOW          | ALLOW             | ALLOW        | Observe only |
| disable                                   | ALLOW           | ALLOW        | ALLOW        | ALLOW          | ALLOW             | ALLOW        | Observe only |
| reads                                     | ALLOW           | ALLOW        | ALLOW        | ALLOW          | ALLOW             | ALLOW        | Observe only |
| validation                                | ALLOW           | ALLOW        | ALLOW        | ALLOW          | ALLOW             | ALLOW        | Observe only |
| privileged 04-D env UPDATE                | Outside B-03    | Outside B-03 | Outside B-03 | Outside B-03   | Outside B-03      | Outside B-03 | **No**       |
| migration-gate acquire/HB/release/reclaim | B-02 privileged | B-02         | B-02         | B-02           | B-02              | B-02         | **No**       |

**Observation cheat sheet (deny-set):**

| Observation                          | Deny-set |
| ------------------------------------ | -------- |
| ACTIVE                               | DENY     |
| UNKNOWN / unreadable / observe error | DENY     |
| INACTIVE                             | ALLOW    |
| EXPIRED                              | ALLOW    |
| OWNERSHIP_LOST                       | ALLOW    |
| CONTENTION_DENIED                    | ALLOW    |

---

## 7. Audit Policy

```text
eventType = connection.migration-gate
outcome   = lifecycle_mutation_blocked
```

| Requirement               | Frozen rule                                                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When                      | Every gate-denied deny-set attempt (entry or mid-flight)                                                                                                        |
| Timing                    | Durable audit **before** denial is returned / before Connection mutation proceeds                                                                               |
| Classification            | Existing catalog `connection.migration-gate` (already registered in B-02)                                                                                       |
| Attribution               | `actorId` required; **target `workspaceId` required** for blocked mutations (COND-SEC-B06)                                                                      |
| Payload (safe)            | `operation`, `reasonCode`, `observation`, `workspaceId`, `gateKey`, `connectionId` when known, optional `correlationId`; **never** secrets / `fencingToken` key |
| Audit persistence failure | **Fail closed** — do not complete the Connection mutation; do not soft-pass                                                                                     |
| Authz-only failures       | Do not require migration-gate audit                                                                                                                             |
| New audit subsystem       | **FORBIDDEN**                                                                                                                                                   |

Reuse `ConnectionMigrationGateAudit` + `SecurityAuditService`. Implementation Planning may extend the audit helper to accept `workspaceId` in attribution.

---

## 8. Vault Residual

```text
D-B03-04 = ACCEPTED RESIDUAL
```

| Item                 | Position                                                                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger              | Entry ALLOW → Vault store/replace/revoke succeeds → mid-flight observe ACTIVE\|UNKNOWN → Connection mutation denied                                                                                   |
| Why acceptable       | Pre-existing Vault↔Connection non-atomicity (parent B §2.3); COND-ARCH-B05 prioritizes fail-closed Connection mutation over inventing distributed compensation; soft-pass would defeat the write gate |
| Security criticality | Residual desync is operational/integrity debt; **must not** complete unsafe Connection bind/status during ACTIVE window                                                                               |
| Observability        | Mid-flight `lifecycle_mutation_blocked` audit; existing Vault lifecycle audits may also exist                                                                                                         |
| Later owner          | Ops / later Wave governance (not B-03; not silently absorbed)                                                                                                                                         |
| B-03 must not        | Auto-cleanup via revoke/store that bypasses the gate; invent compensation transactions                                                                                                                |

---

## 9. S20 Residual

**Re-verified at freeze HEAD (`78f8dd8…`):** under `apps/api/src`, only `ConnectionsService` performs `connectionRecord.create` / `update`. No new production direct mutation paths since Planning Review.

```text
D-B03-06 = FROZEN
App-supported deny-set path = ConnectionsService (B-03 seals)
Direct Prisma / DBA / scripts = S20 operational trust residual (outside B-03)
Future workers = COND-SEC-B04 (later governance)
```

---

## 10. Acceptance Criteria

| AC       | Final status | Notes                                                                |
| -------- | ------------ | -------------------------------------------------------------------- |
| B03-AC01 | **PASS**     | Four deny hooks                                                      |
| B03-AC02 | **PASS**     | ACTIVE denies                                                        |
| B03-AC03 | **PASS**     | Allow-set preserved                                                  |
| B03-AC04 | **PASS**     | INACTIVE regression                                                  |
| B03-AC05 | **PASS**     | UNKNOWN / observe fail                                               |
| B03-AC06 | **PASS**     | B-01/B-02 only SoT                                                   |
| B03-AC07 | **PASS**     | Blocked audit + workspace                                            |
| B03-AC08 | **PASS**     | No client grant injection                                            |
| B03-AC09 | **PASS**     | Ordinary authz remains                                               |
| B03-AC10 | **PASS**     | **Updated wording** — store/replace/**revoke** mid-flight (C-B03-01) |
| B03-AC11 | **PASS**     | No public gate HTTP                                                  |
| B03-AC12 | **PASS**     | No Prisma changes in B-03                                            |
| B03-AC13 | **PASS**     | No 04-D/FIV/C7/capital                                               |
| B03-AC14 | **PASS**     | S20 documented                                                       |
| B03-AC15 | **PASS**     | EXPIRED does not block deny-set                                      |

```text
B03-AC01…AC15 = 15/15 PASS
NEEDS CLARIFICATION = 0
FAIL = 0
BLOCKERS = 0
```

---

## 11. Explicit Non-Authorization

This Decision Freeze does **not**:

- start B-03 coding
- authorize 04-D, backfill, Vault redesign, FIV, C7, venue I/O, or capital
- reopen OD-B-01…08, D-CONN-04-08, or B-01/B-02 contracts

Slice Approval is recorded in a **separate** artifact.

---

## 12. Next Gate After Freeze

If Slice Approval is GRANTED in the companion artifact:

```text
Next: FIV-CONN-04-B-03 IMPLEMENTATION PLANNING
```

Implementation remains not started until Implementation Planning + subsequent implementation act.
