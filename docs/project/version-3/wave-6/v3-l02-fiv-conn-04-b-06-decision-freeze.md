# FIV-CONN-04-B-06 Decision Freeze

**Document:** FIV-CONN-04-B-06 Crash / Concurrency Verification — Decision Freeze  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-06 — Crash / concurrency verification  
**Authority:** Product Owner / Chief Architect (immutable governance recording)  
**Nature:** **PO/GOVERNANCE DECISION FREEZE ONLY.** Freezes C-B06-01…05 (incl. RACE-09 interpretation), B-06 evidence method, consume-only boundary, and traceability rules. Does **not** implement B-06. Does **not** create B-06 specs. Does **not** modify production code, B-05, OD-B-06, D-B03 residuals, Prisma, migrations, Vault, 04-D, FIV, C7, venue I/O, or capital.

**Basis:**

| Artifact                  | Path / identity                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Planning Package          | [`v3-l02-fiv-conn-04-b-06-planning-package.md`](./v3-l02-fiv-conn-04-b-06-planning-package.md)                                                   |
| Planning Review           | Formal Planning Review — **PASS WITH CONDITIONS** (conditions resolved by this freeze)                                                           |
| Parent OD-B freeze        | [`v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md) §11 / §13 / OD-B-06 / OD-B-08 |
| Parent Impl Authorization | [`v3-l02-fiv-conn-04-b-implementation-authorization.md`](./v3-l02-fiv-conn-04-b-implementation-authorization.md) §19 / §24                       |
| Parent Planning §19       | B-06 objective; AC-B06…AC-B10; Security row (AC-B20 class); RACE-05…10                                                                           |
| B-01 ownership            | Crash/concurrency verification → **B-06**                                                                                                        |
| B-02 closure residual     | Live dual-process Postgres E2E = optional ops hardening                                                                                          |
| B-03 closure residuals    | D-B03-04 / D-B03-06 / D-B03-08 **PRESERVED**                                                                                                     |
| B-05 deferral             | Multi-instance / crash harness deferred to B-06; OD-B-06 not reopened                                                                            |
| B-05 CLOSED               | Commit `d6b8602`                                                                                                                                 |

**Repository baseline (freeze act start):** `d6b860299f3a5ade944c5ea55a7c007fe091843d` (`HEAD == origin/main`)

---

## 1. Decision Status

```text
DECISION FREEZE = APPROVED
C-B06-01…05 = FROZEN / PASS
RACE-09 INTERPRETATION = FROZEN (C-B06-05)
BLOCKERS = NONE
```

```text
B-06 IMPLEMENTATION = NOT STARTED BY THIS ARTIFACT
Slice Approval = SEPARATE ARTIFACT (may be GRANTED only after this freeze)
04-D / FIV / C7 / live I/O / capital = NOT AUTHORIZED
OD-B-06 = NOT REOPENED
D-B03-04 / D-B03-06 / D-B03-08 = PRESERVED
```

Protected dirty/untracked leftovers were **not** modified.  
B-05 files were **not** modified by this act.  
Parent OD-B-01…08 are **not** reopened.

---

## 2. C-B06-01…05 Freeze Results

| ID           | Exact frozen meaning                                                                                                                                                                      | Authoritative source                                                                      | Verdict           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------- |
| **C-B06-01** | Multi-instance evidence = dual logical clients/adapters + unit/integration against shared lease SoT (B-02 CAS/FOR UPDATE). Testcontainers / live multi-process Postgres **NOT selected**. | Parent §19 “optional testcontainers”; no apps/api migration-gate harness; Planning Review | **FROZEN / PASS** |
| **C-B06-02** | B-02 live dual-process Postgres residual remains **OPEN / OPTIONAL ops residual**. B-06 must not silently close it, mandate it, or claim live dual-process proof.                         | B-02 closure §7; B-02 PO Review                                                           | **FROZEN / PASS** |
| **C-B06-03** | B-06 = verification/consume of CLOSED B-02/B-03/B-04 (+ B-05 walls where applicable). Not greenfield SoT / fencing / TTL / boundary / audit architecture. Defect ⇒ STOP + escalate.       | B-01 ownership; Parent §19; Planning Review                                               | **FROZEN / PASS** |
| **C-B06-04** | `B06-AC*` / `SB-B06-*` = tracing IDs only. Normative parents: AC-B06…AC-B10, **AC-B20**, RACE-05…10, SEC/COND. Evidence must map RACE → B06-AC → parent AC → test.                        | Planning Package §7; Planning Review                                                      | **FROZEN / PASS** |
| **C-B06-05** | **RACE-09** = immediate contention / acquire-fail closed under OD-B-08. **No** invent wait/queue/timeout harness. Prove: acquire fail → no lease proof → boundary refuses D.              | OD-B-08; B-02 planning (acquire_timeout optional); Planning Review                        | **FROZEN / PASS** |

```text
C-B06 FAIL / BLOCKED COUNT = 0
No conflict with Parent B Decision Freeze / Implementation Authorization / OD-B-06 / OD-B-08.
```

---

## 3. Frozen Condition Detail

### 3.1 C-B06-01 — Multi-instance evidence method

```text
C-B06-01 = FROZEN / PASS
```

```text
FROZEN RULE:
  B-06 proves “multi-instance” / shared SoT via:
    - dual logical clients / dual adapter instances
    - unit/integration verification against the existing durable lease SoT
    - existing B-02 CAS / FOR UPDATE semantics
    - existing B-03 deny observation and B-04 boundary refuse paths

  NOT SELECTED FOR B-06:
    - testcontainers
    - live multi-process Postgres
    - two real Node processes against live Postgres

  “multi-instance” MUST NOT silently become live dual-process chaos.
```

### 3.2 C-B06-02 — B-02 live dual-process residual disposition

```text
C-B06-02 = FROZEN / PASS
```

```text
FROZEN STATUS:
  Residual name: Live multi-instance Postgres concurrency E2E
  Origin: B-02 Closure §7 / B-02 PO Review
  Status: OPEN / OPTIONAL operational hardening residual
  Owner: Ops / future hardening — NOT mandatory B-06 acceptance

  B-06 MUST NOT:
    - silently close this residual
    - convert it into a mandatory B-06 requirement
    - claim live dual-process proof if not performed

  B-06 MAY reference it and state that selected evidence =
  dual-client unit/integration (C-B06-01).
```

### 3.3 C-B06-03 — Consume-only / verification boundary

```text
C-B06-03 = FROZEN / PASS
```

```text
FROZEN RULE (BLOCKING SLICE BOUNDARY):
  B-06 CONSUMES CLOSED behavior from B-02 / B-03 / B-04
  (and B-05 regression walls where applicable).

  B-06 is NOT allowed to become:
    - greenfield lease implementation
    - new source-of-truth design
    - new fencing implementation
    - new TTL / reclaim architecture
    - new boundary architecture
    - new audit architecture

  If a true production defect requiring architecture change is found:
    STOP → escalate as scope/amendment decision
    DO NOT silently modify production code
```

### 3.4 C-B06-04 — Traceability IDs only

```text
C-B06-04 = FROZEN / PASS
```

```text
FROZEN RULE:
  Local IDs B06-AC01…B06-AC10 and SB-B06-* are TRACEABILITY ONLY.
  They create no independent acceptance-criteria authority.

  Normative parent requirements remain:
    AC-B06, AC-B07, AC-B08, AC-B09, AC-B10, AC-B20,
    RACE-05…RACE-10, relevant SEC / COND requirements.

  Implementation evidence MUST include explicit mapping:
    RACE → local B06-AC → parent AC → evidence/test

  AC-B20 MUST remain explicitly covered.
```

### 3.5 C-B06-05 — RACE-09 frozen interpretation (critical)

```text
C-B06-05 = FROZEN / PASS
RACE-09 INTERPRETATION = FROZEN
```

```text
FROZEN RULE:
  RACE-09 is NOT a requirement to invent or implement:
    - timed waiting queue
    - lock wait
    - new acquire-timeout / wait harness
    - any waiting model contradicting OD-B-08

  Under frozen OD-B-08:
    - contention is immediately and deterministically rejected
    - acquire failure is fail-closed
    - no D operation may start after acquire failure
    - no synthetic wait/queue timeout harness is required
    - B-06 verifies existing fail-closed contention behavior

  If an outer deadline already exists in a caller, it may be represented
  in existing semantics — B-06 MUST NOT introduce a new waiting model.

  REQUIRED EVIDENCE CHAIN:
    acquire / contention failure
            ↓
    no valid lease proof
            ↓
    boundary refuses D
            ↓
    no downstream D execution
```

---

## 4. RACE-05…RACE-10 Ownership Matrix (frozen)

| Race        | Proves                                                  | Source                        | Parent AC             | B-06 evidence method                            | Consumes                     | B-06 must prove                                                         |
| ----------- | ------------------------------------------------------- | ----------------------------- | --------------------- | ----------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| **RACE-05** | Second acquire / second runner denied; no D             | DF §11; planning §8           | AC-B08 / AC-B06 class | Dual-client contention + boundary refuse        | B-02 acquire CAS; B-04 start | Second logical client cannot acquire while first holds; D refused       |
| **RACE-06** | Shared SoT; mutations denied everywhere while ON        | DF §11                        | AC-B06                | Dual-client shared SoT + deny smoke             | B-02 SoT; B-03 deny          | Two observers see same ACTIVE lease; deny-set blocked                   |
| **RACE-07** | Crash ⇒ TTL/reclaim ⇒ fence bump ⇒ stale dead           | DF §11; COND-ARCH-B06         | AC-B09                | Crash/TTL dual-client fixtures                  | B-02 reclaim/TTL/fence       | After simulated crash + expiry, reclaim bumps fence; old grant rejected |
| **RACE-08** | Commit then crash; lease durable independent of process | DF §11                        | AC-B09                | Crash/TTL: discard in-memory grant; row remains | B-02 durable row             | Gate stays ON until release/TTL without process memory                  |
| **RACE-09** | Immediate contention/acquire-fail ⇒ no D                | DF §11; **C-B06-05**; OD-B-08 | AC-B08                | Contention deny + boundary refuse chain         | B-02 contention; B-04 start  | **No wait harness**; fail-closed acquire ⇒ refuse D                     |
| **RACE-10** | Retry without fresh fencing proof cannot bypass         | DF §11; SEC-B09               | AC-B10 / AC-B20       | Retry-without-proof + write-proof reject        | B-02 fence; B-04 CAS         | Cached prior grant without current proof denied                         |

```text
Do not duplicate closed-suite ownership unnecessarily.
B-06 owns the RACE matrix consolidation evidence under C-B06-01/03.
```

---

## 5. AC-B06…AC-B10 + AC-B20 Mapping (frozen)

| Parent AC  | Local tracing ID(s) | B-06 verification intent                                                    |
| ---------- | ------------------- | --------------------------------------------------------------------------- |
| **AC-B06** | B06-AC01            | Lock state durable across logical clients / shared SoT                      |
| **AC-B07** | B06-AC02            | Process-local mutex is not SoT (structural / negative)                      |
| **AC-B08** | B06-AC03 / B06-AC07 | Acquire failure / contention fail-closed; no D; second acquire denied       |
| **AC-B09** | B06-AC04            | Stale/crashed holder + TTL/fencing enforced                                 |
| **AC-B10** | B06-AC05            | Retries cannot bypass without fresh proof                                   |
| **AC-B20** | B06-AC06            | Wrong/stale fence cannot release lease, authorize D, or mutate via boundary |

### AC-B20 freeze (explicit)

```text
AC-B20 = FROZEN FOR B-06 VERIFICATION
```

```text
Wrong / stale fencing token MUST NOT:
  - release the current lease
  - authorize D
  - mutate protected state through the boundary

B-06 ONLY verifies this existing CLOSED behavior.
No new fencing architecture is authorized.
```

---

## 6. Security / Audit Boundary (frozen)

```text
FROZEN:
  - production audit path UNCHANGED
  - SecurityAuditService.record behavior UNCHANGED
  - B-02 transaction durability UNCHANGED
  - B-03 fail-closed deny behavior UNCHANGED
  - secret sanitizer UNCHANGED
  - OD-B-06 audit catalog / outcomes NOT REOPENED

B-06 = verification slice, NOT audit redesign.
Optional smoke that existing migration-gate outcomes still emit on
contention/reclaim paths is allowed; inventing outcomes is forbidden.
```

---

## 7. Production Impact (frozen)

```text
PRODUCTION CHANGES = NONE
(default and mandatory unless separately amended + approved)
```

Prisma / schema / migrations = **NONE**.  
Production adapters / enforcement / boundary / audit core = **NO MODIFY** by default.

---

## 8. File / Scope Boundary (frozen)

### CREATE (later implementation only — not this act)

```text
apps/api/src/modules/connections/fiv-conn-04-b-06-concurrency.spec.ts
apps/api/src/modules/connections/fiv-conn-04-b-06-crash-ttl.spec.ts
apps/api/src/modules/connections/fiv-conn-04-b-06-boundary-concurrency.spec.ts
apps/api/src/modules/connections/fiv-conn-04-b-06-security-smoke.spec.ts
+ B-06 governance/evidence docs as separately authorized
```

### MODIFY / DELETE / NO CHANGE

| Class                             | Rule                     |
| --------------------------------- | ------------------------ |
| Production files                  | **NONE**                 |
| Closed B-02/B-03/B-04/B-05 suites | **NO MODIFY by default** |
| OD-B-06 catalog / outcomes        | **NO MODIFY**            |
| Protected Wave-5 / 04-A leftovers | **NO TOUCH**             |
| If closed file must change        | **STOP and escalate**    |

---

## 9. IMPL-COND-B06-01…10 (frozen mandatory)

| ID                   | Condition                                                                                 | Class                     |
| -------------------- | ----------------------------------------------------------------------------------------- | ------------------------- |
| **IMPL-COND-B06-01** | Production diff = NONE unless separately amended and approved                             | Blocking                  |
| **IMPL-COND-B06-02** | Dedicated evidence covers RACE-05…RACE-10                                                 | Blocking                  |
| **IMPL-COND-B06-03** | Explicit traceability covers AC-B06…AC-B10 + AC-B20                                       | Blocking                  |
| **IMPL-COND-B06-04** | OD-B-06 is not reopened or redesigned                                                     | Blocking                  |
| **IMPL-COND-B06-05** | D-B03-04 / D-B03-06 / D-B03-08 remain preserved                                           | Blocking                  |
| **IMPL-COND-B06-06** | Dual-client unit/integration is the selected evidence method; testcontainers NOT selected | Blocking                  |
| **IMPL-COND-B06-07** | Dedicated `fiv-conn-04-b-06-*.spec.ts` files only                                         | Blocking                  |
| **IMPL-COND-B06-08** | FAKE_*/doubles only; no live capital chaos                                                | Blocking                  |
| **IMPL-COND-B06-09** | Existing related closed suites must remain green                                          | Non-blocking quality gate |
| **IMPL-COND-B06-10** | Only authorized B-06 file delta is permitted                                              | Blocking                  |

---

## 10. Scope-Creep Wall (frozen)

```text
B-06 MUST NOT:
  - select or silently mandate testcontainers / live dual-process
  - invent wait/queue timeout for RACE-09
  - reopen OD-B-06
  - remediate or close D-B03-04 / D-B03-06 / D-B03-08
  - redesign B-02/B-03/B-04/B-05 production
  - rewrite B-05 specs as part of B-06
  - implement 04-D / FIV / C7 / capital / live venue I/O
  - touch protected Wave-5 / 04-A leftovers
  - introduce a second lease SoT or public migration HTTP
```

---

## 11. Residuals (preserved)

| Residual                            | Status under this freeze              |
| ----------------------------------- | ------------------------------------- |
| **D-B03-04**                        | **PRESERVED**                         |
| **D-B03-06**                        | **PRESERVED**                         |
| **D-B03-08**                        | **PRESERVED**                         |
| B-02 live dual-process Postgres E2E | **OPEN / OPTIONAL** (C-B06-02)        |
| Missing formal `…-b-05-closure.md`  | Doc residual; B-05 CLOSED @ `d6b8602` |

---

## 12. Next Gate

```text
NEXT GATE:
  FIV-CONN-04-B-06 SLICE APPROVAL
  (separate artifact; may be granted in same governance act if preconditions PASS)
```

```text
DO NOT implement B-06 from this freeze alone.
DO NOT create B-06 specs in this act.
DO NOT start 04-D / FIV / C7 / live I/O / capital.
```

---

## Final State

```text
DECISION FREEZE = APPROVED
C-B06-01…05 = FROZEN / PASS
RACE-09 = FROZEN UNDER C-B06-05 / OD-B-08
PRODUCTION CHANGES = NONE
BLOCKERS = NONE
NO IMPLEMENTATION PERFORMED
```

**END OF FIV-CONN-04-B-06 DECISION FREEZE**
