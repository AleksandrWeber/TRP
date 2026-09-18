# FIV-CONN-04-B-06 Planning Package

**Document:** FIV-CONN-04-B-06 Crash / Concurrency Verification — Planning Package  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-06 — Crash / concurrency verification  
**Parent:** FIV-CONN-04-B — Write-gate / lifecycle mutation lock  
**Authority:** Engineering / Architecture planning support under Wave 6 PO + Chief Architect governance  
**Nature:** **PLANNING ONLY.** Does **not** authorize B-06 implementation. Does **not** modify production code, tests, Prisma schema, migrations, Vault, B-01…B-05, 04-D, backfill, FIV, C7, venue I/O, or capital.

**Repository baseline (planning start):** `d6b860299f3a5ade944c5ea55a7c007fe091843d` (B-05 closure commit; `HEAD == origin/main`).

```text
git status --short at planning start: dirty/untracked leftovers present
  (04-A leftovers, wave-5/6 docs, technical-debt, live-admission-gate-ports.module.spec.ts, etc.)
Protected leftovers: NOT MODIFIED by this package.
Only mutation authorized by this task: THIS FILE.
```

```text
Wave 6 = NOT COMPLETE
V3-L02 = NOT CLOSED
FIV-CONN-04-B-01 = CLOSED
FIV-CONN-04-B-02 = CLOSED
FIV-CONN-04-B-03 = CLOSED
FIV-CONN-04-B-04 = CLOSED
FIV-CONN-04-B-05 = CLOSED (human closure + commit d6b8602; formal …-b-05-closure.md absent — see §17)
FIV-CONN-04-B-06 = PLANNING ONLY (this package)
FIV-CONN-04-B = NOT CLOSED
FIV-CONN-04 = NOT CLOSED
FIV = NOT PERFORMED
C7 = DENY-ALL
LIVE CAPITAL = NOT ACTIVATED
LIVE VENUE I/O = NOT PERFORMED
04-D = NOT IMPLEMENTED / NOT AUTHORIZED
allowRealVenueIo = FALSE
```

---

## 1. Planning Verdict

```text
PLANNING VERDICT = PASS WITH CONDITIONS
PLANNING PACKAGE = READY FOR B-06 PLANNING REVIEW
Implementation = NOT AUTHORIZED
B-06 Slice Approval = NOT GRANTED
NO IMPLEMENTATION AUTHORIZATION IS GRANTED BY THIS PACKAGE
```

**Verdict rationale:** Parent FIV-CONN-04-B artifacts sufficiently define B-06 as the **crash / concurrency verification** sub-slice whose owned acceptance criteria are **AC-B06…AC-B10** (with closely bound **AC-B20** / wrong-fence security), bound to frozen **RACE-05…RACE-10**, with dependencies on **B-02…B-05**. Prerequisites are satisfied (B-02…B-05 CLOSED; B-05 commit `d6b8602`). Scope is **verification / concurrency proof** of the durable lease + fence/TTL/retry semantics delivered by CLOSED B-02 (and consumed by B-03/B-04) — **not** a redesign of the lease, **not** remediation of accepted B-03 residuals, **not** 04-D, **not** live-capital chaos.

**Conditions requiring Decision Freeze before Slice Approval:** **C-B06-01…C-B06-04** (§16).

```text
No implementation performed.
```

---

## 2. Governance Inputs

| Artifact                               | Path                                                                    | Status / use                                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Parent B Decision Freeze               | `v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md`                 | OD-B-01…08 **FROZEN**; §11 RACE-05…10; §13 B-06 **APPROVED** composition                                               |
| Parent B Implementation Authorization  | `v3-l02-fiv-conn-04-b-implementation-authorization.md`                  | Wave-level IA **GRANTED**; B-06 subject to Slice Approval; T-01…T-20 + ST-B21…ST-B26 mandatory before parent B closure |
| Parent B Planning Package              | `v3-l02-fiv-conn-04-b-planning-package.md` §8 / §19 / §20 / §23         | B-06 objective, RACE-05…10, deps B-02…B-05, AC-B06…AC-B10, tests                                                       |
| Parent Architecture / Security Reviews | `…-b-architecture-review.md`, `…-b-security-review.md`                  | B-06 coherent (TOCTOU/CAS); COND-ARCH-B03/B06; SEC-B07/B08/B09                                                         |
| B-01 ownership map                     | `v3-l02-fiv-conn-04-b-01-planning-package.md` §4                        | Crash/concurrency verification → **B-06**                                                                              |
| B-01…B-05 closures / reports           | `…-b-01-closure.md` … `…-b-04-closure.md`; B-05 impl report @ `d6b8602` | CLOSED prerequisites; residuals preserved                                                                              |
| B-02 residual                          | `…-b-02-closure.md` §7; `…-b-02-po-review.md`                           | Live multi-instance Postgres E2E = accepted residual / optional hardening                                              |
| B-05 deferrals                         | `…-b-05-planning-package.md` §13; Decision Freeze §9                    | Explicitly deferred multi-instance / crash harness to **B-06**                                                         |
| Next-gate analysis (historical)        | `v3-l02-fiv-conn-04-next-gate-analysis.md`                              | Established B-06 deps = B-02…B-05; sequencing after B-05                                                               |

### Binding freezes (not reopened)

| Freeze                             | Binding essence for B-06                                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **OD-B-01…05, 07, 08**             | Global gate, deny matrix, fencing, fail-closed contention — not redesigned                                                         |
| **OD-B-06**                        | Audit family `connection.migration-gate` — **FROZEN / NOT REOPENED**; B-06 may regress concurrent reclaim/deny audit presence only |
| **RACE-05…RACE-10**                | Deterministic fail-closed race outcomes confirmed at parent Decision Freeze §11                                                    |
| **COND-ARCH-B03**                  | Durable DB lease = multi-instance SoT; process-local never authoritative                                                           |
| **COND-ARCH-B06**                  | Operator reclaim bumps fence + durable audit; no resurrection of prior fence                                                       |
| **OD-B-05 / SEC-B08**              | Stale holder fencing enforced                                                                                                      |
| **OD-B-08 / SEC-B07**              | Fail-closed contention                                                                                                             |
| **SEC-B09**                        | Retries cannot bypass the gate                                                                                                     |
| **D-B03-04 / D-B03-06 / D-B03-08** | Accepted residuals — **PRESERVED**; not remediated by B-06                                                                         |
| **SEC-AC-24**                      | 04-B modules perform zero Vault mutate / zero env UPDATE                                                                           |

Wave-level FIV-CONN-04-B Implementation Authorization remains **GRANTED** at parent governance level and **does not** authorize this sub-slice without B-06 Slice Approval and subsequent gates.

---

## 3. B-06 Objective

Exact objective from parent planning package §19:

```text
B-06 OBJECTIVE:
  Prove multi-instance + crash/TTL/retry semantics

Owned parent ACs:
  AC-B06 — Lock state is durable across API instances
  AC-B07 — Process-local mutex alone is insufficient and is not the SoT
  AC-B08 — Lock acquisition failure fails closed (no D start)
  AC-B09 — Stale/crashed holder cannot silently permit unsafe mutation; fencing/TTL enforced
  AC-B10 — Retries cannot bypass the gate

Closely bound parent AC (security of concurrency):
  AC-B20 — Wrong fencing token cannot release or continue runner authority

Owned invariants:
  RACE-05…RACE-10 covered

Owned tests (parent §19 / §20 — concurrency class):
  Dual-client / multi-instance contention
  TTL expiry + fencing bump / stale rejection
  Acquire timeout fail-closed
  Retry without fencing proof denied
  Wrong fencing token release rejected
  (Consume T-02, T-06…T-09, T-16 class; not re-own entire T-01…T-20 matrix)

Non-scope (parent §19):
  Production chaos on live capital systems
```

B-01 ownership map §4:

```text
Crash/concurrency verification = B-06
```

**Interpretation (evidence-based, not expansion):**

B-02 already **implemented** durable lease SoT, CAS, FOR UPDATE, fencing, TTL reclaim, and unit-level concurrency proofs. B-03/B-04 consume that SoT. B-05 closed audit/security regression and explicitly deferred multi-instance dual-client / crash harness / RACE-05…10 class to B-06. B-06 therefore owns the **cross-slice crash/concurrency verification suite** that proves AC-B06…AC-B10 (+ AC-B20) and RACE-05…RACE-10 still hold — and fills only those verification gaps left after B-02’s accepted unit-CAS evidence path. B-06 does **not** invent a second lease SoT or remediate accepted Vault/ops residuals.

---

## 4. Repository Evidence

### 4.1 Already delivered (CLOSED — consume, do not redesign)

| Surface                                        | Evidence                                                              | Relation to B-06                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Durable singleton lease + CAS / FOR UPDATE     | `prisma-migration-gate.adapter.ts` + migration                        | B-02 CLOSED — B-06 proves multi-instance / crash semantics                 |
| Unit contention / stale / TTL / reclaim        | `prisma-migration-gate.adapter.spec.ts` (T06–T10, ST-B21/23/24, etc.) | Consumable baseline; B-06 extends / consolidates RACE-05…10 proof          |
| Process-local ≠ SoT                            | B-01/B-02 contracts + COND-ARCH-B03                                   | B-06 must prove (AC-B07)                                                   |
| Deny-set while ON                              | B-03 enforcement + service specs                                      | B-06 may smoke multi-observer deny under simulated shared SoT (RACE-06)    |
| 04-D start refused without lease / stale fence | `conn04-migration-boundary.service.spec.ts`                           | B-06 proves retry/stale cannot authorize D (RACE-05/09/10; AC-B08/B10/B20) |
| Audit integrity + secret walls                 | B-05 specs @ `d6b8602`                                                | Consume; do not reopen OD-B-06                                             |

### 4.2 RACE-05…RACE-10 (parent Decision Freeze §11 / planning §8)

| Race        | Invariant          | Expected outcome                                                      | B-06 role  |
| ----------- | ------------------ | --------------------------------------------------------------------- | ---------- |
| **RACE-05** | Single runner      | Second acquire / second worker denied; no D                           | **VERIFY** |
| **RACE-06** | Multi-instance SoT | Mutations denied everywhere while ON                                  | **VERIFY** |
| **RACE-07** | Crash safety       | TTL + fencing; stale cannot continue                                  | **VERIFY** |
| **RACE-08** | Commit then crash  | Lease durable independent of process; gate stays ON until release/TTL | **VERIFY** |
| **RACE-09** | Acquire timeout    | Abort; no 04-D / no false ON claim                                    | **VERIFY** |
| **RACE-10** | Retry integrity    | Re-prove fencing / re-acquire; no bypass via cached lease             | **VERIFY** |

RACE-01…RACE-04 remain primarily deny-set / 04-D concerns already owned by B-03 / future 04-D — **not** reopened as B-06 greenfield work.

### 4.3 B-02 residual relevant to B-06

```text
B-02 Closure §7 / B-02 PO Review:
  Live multi-instance Postgres concurrency E2E = accepted residual
  (unit CAS + FOR UPDATE approved verification path at B-02 PO Review)
```

B-06 parent text allows **concurrency specs** and **optional** testcontainers/integration harness. Disposition of the live dual-process residual is therefore a **Decision Freeze** item (**C-B06-01 / C-B06-02**), not an automatic mandate to run production chaos.

### 4.4 OD-B-06 vs B-06 (naming collision — do not confuse)

| ID                   | Meaning                                    | B-06 action      |
| -------------------- | ------------------------------------------ | ---------------- |
| **OD-B-06**          | Frozen audit event family decision         | **NOT REOPENED** |
| **FIV-CONN-04-B-06** | Crash / concurrency verification sub-slice | **THIS PACKAGE** |

### 4.5 No pre-existing B06-AC / SB-B06 IDs

```text
Repository search: no authoritative B06-ACxx or SB-B06-xx identifiers exist yet.
```

This package introduces **planning-local** `B06-AC*` / `SB-B06-*` IDs that map **1:1** to existing parent criteria. They do **not** invent new requirements.

---

## 5. Scope Classification Matrix

### 5.1 IN SCOPE

| #   | Item                                                                                                                             | Classification             | Evidence / reason                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Cross-slice **crash / concurrency verification** for RACE-05…RACE-10                                                             | **IN SCOPE**               | Parent §19 invariants; Decision Freeze §11; B-01 ownership; B-05 deferral                 |
| 2   | Prove **AC-B06** — lock state durable across API instances (shared SoT observation)                                              | **IN SCOPE**               | Parent §19 / §23                                                                          |
| 3   | Prove **AC-B07** — process-local mutex is not SoT                                                                                | **IN SCOPE**               | Parent §23; COND-ARCH-B03                                                                 |
| 4   | Prove **AC-B08** — acquire failure / timeout fails closed (no D start)                                                           | **IN SCOPE**               | Parent §23; RACE-09; B-04 boundary refuse                                                 |
| 5   | Prove **AC-B09** — stale/crashed holder cannot silently permit unsafe mutation; fencing/TTL                                      | **IN SCOPE**               | Parent §23; RACE-07/RACE-08                                                               |
| 6   | Prove **AC-B10** — retries cannot bypass the gate                                                                                | **IN SCOPE**               | Parent §23; RACE-10; SEC-B09                                                              |
| 7   | Prove **AC-B20** — wrong fencing token cannot release / continue runner authority                                                | **IN SCOPE**               | Parent §23; B-06 security row (“stale fencing token cannot release or authorize D”); T-16 |
| 8   | Consolidate / extend **concurrency fixtures** beyond B-02 unit-CAS baseline as needed for RACE-05…10 evidence                    | **IN SCOPE**               | Parent “likely files: concurrency specs”; B-05 deferred harness                           |
| 9   | Optional **testcontainers / integration harness** only if Decision Freeze selects it (**C-B06-01**)                              | **IN SCOPE (conditional)** | Parent §19 “optional testcontainers”                                                      |
| 10  | Limited smoke that concurrent reclaim / stale paths still emit existing `connection.migration-gate` outcomes (no OD-B-06 reopen) | **IN SCOPE (smoke)**       | Preserve OD-B-06; do not redesign audit                                                   |
| 11  | Test/spec suite + evidence report artifacts under later Slice Approval                                                           | **IN SCOPE**               | Parent B-06 delivery mode                                                                 |

### 5.2 OUT OF SCOPE

| #   | Item                                                             | Classification   | Owner / disposition                |
| --- | ---------------------------------------------------------------- | ---------------- | ---------------------------------- |
| 1   | Redesign of B-01/B-02/B-03/B-04/B-05 production logic            | **OUT OF SCOPE** | Closed slices                      |
| 2   | New lease schema / migration                                     | **OUT OF SCOPE** | B-02 CLOSED                        |
| 3   | New deny hooks / ConnectionsService behavior change              | **OUT OF SCOPE** | B-03 CLOSED                        |
| 4   | New 04-D boundary / privileged UPDATE / backfill                 | **OUT OF SCOPE** | **04-D**                           |
| 5   | Reopening / amending **OD-B-06** audit family                    | **OUT OF SCOPE** | Frozen                             |
| 6   | Remediation of **D-B03-04 / D-B03-06 / D-B03-08**                | **OUT OF SCOPE** | Accepted residuals — **PRESERVED** |
| 7   | B-05 audit/security architecture redesign                        | **OUT OF SCOPE** | B-05 CLOSED                        |
| 8   | Production chaos on live capital / live venue / real credentials | **OUT OF SCOPE** | Parent B-06 non-scope              |
| 9   | FIV / C7 / allowRealVenueIo / capital                            | **OUT OF SCOPE** | Separately prohibited              |
| 10  | RACE-01…RACE-04 greenfield re-implementation                     | **OUT OF SCOPE** | Deny-set / 04-D owners             |
| 11  | Wave-5 leftovers / 04-A dirty modules / unrelated wave-6 drafts  | **OUT OF SCOPE** | Protected leftovers                |

```text
B-06 = CRASH / CONCURRENCY VERIFICATION
B-06 ≠ lease redesign
B-06 ≠ OD-B-06 reopen
B-06 ≠ D-B03 residual remediation
B-06 ≠ 04-D / FIV / capital chaos
```

### 5.3 DEFERRED

| #   | Item                                                           | Classification | Evidence / reason                                                 |
| --- | -------------------------------------------------------------- | -------------- | ----------------------------------------------------------------- |
| 1   | Live dual-process Postgres chaos beyond Decision Freeze choice | **DEFERRED**   | Pending **C-B06-01/02**; must not become silent scope creep       |
| 2   | Full 04-D CAS TOCTOU E2E with real UPDATE                      | **DEFERRED**   | ST-B23 full 04-D E2E later (B-02 security review); 04-D owns      |
| 3   | Parent B closure / FIV-CONN-04 parent closure                  | **DEFERRED**   | After B-06 closes + parent gates                                  |
| 4   | Formal `…-b-05-closure.md` backfill (if PO requires)           | **DEFERRED**   | Documentation residual; B-05 treated CLOSED per human + `d6b8602` |

### 5.4 DEPENDENCIES

| Dependency                      | Status                   | Role for B-06                                               |
| ------------------------------- | ------------------------ | ----------------------------------------------------------- |
| **B-01**                        | **CLOSED**               | Contracts / fencing semantics                               |
| **B-02**                        | **CLOSED**               | Durable lease SoT under test                                |
| **B-03**                        | **CLOSED**               | Deny-set observers of shared SoT                            |
| **B-04**                        | **CLOSED**               | Refuse D without lease / stale fence                        |
| **B-05**                        | **CLOSED** (`d6b8602`)   | Audit/security regression complete; sequencing prerequisite |
| Parent B IA                     | **GRANTED** (wave-level) | Ceiling; does not skip B-06 Slice Approval                  |
| **OD-B-06**                     | **FROZEN**               | Not a work item; do not reopen                              |
| Optional testcontainers harness | **CONDITIONAL**          | Only if **C-B06-01** selects integration path               |

```text
B-06 DEPENDENCIES = SATISFIED FOR PLANNING
(B-02…B-05 CLOSED; OD-B decisions frozen)
```

### 5.5 BLOCKERS

| Item                                     | Classification | Evidence                                  |
| ---------------------------------------- | -------------- | ----------------------------------------- |
| Prerequisites B-02…B-05                  | **NONE**       | CLOSED                                    |
| Open mandatory PO reopen of OD-B / D-B03 | **NONE**       | Explicitly not required for B-06 planning |
| Missing parent definition of B-06        | **NONE**       | Parent §19 + Decision Freeze §13          |

```text
BLOCKERS = NONE
```

---

## 6. Architecture / Verification Model

```text
          ┌──────────────────────────────────────────┐
          │ Durable migration-gate lease SoT (B-02)   │
          │ CAS / FOR UPDATE / fence / TTL / reclaim  │
          └──────────────────▲───────────────────────┘
                             │ observe / prove
     ┌───────────────────────┼───────────────────────┐
     │                       │                       │
 B-03 deny observers   B-04 start/CAS proof   B-02 adapter
 (shared SoT)          (refuse without proof) (acquire paths)
     │                       │                       │
     └───────────────────────┼───────────────────────┘
                             │
                B-06 VERIFICATION LAYER
         (concurrency / crash / TTL / retry specs)
           — no second SoT / no lease redesign —
```

| Layer           | B-06 role                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| SoT             | Consume CLOSED B-02 durable lease                                                                       |
| Observers       | Consume CLOSED B-03 / B-04 paths as needed for multi-observer proof                                     |
| Verification    | New dedicated **concurrency / crash** specs proving AC-B06…AC-B10 / AC-B20 / RACE-05…10                 |
| Production code | **Default: no change.** Any gap-fill production fix requires stop + escalate + Slice Approval amendment |

---

## 7. Acceptance Criteria

**Note:** Planning-local IDs map exclusively to authoritative parent criteria.

| ID           | Authoritative source              | Requirement                                                                              | Implementation implication                                                           | Verification method                                                  | Traceability                       |
| ------------ | --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------- |
| **B06-AC01** | **AC-B06**                        | Lock state durable across API instances                                                  | No process-local SoT; two logical clients/instances observe same lease row semantics | Dual-client / dual-adapter fixture (or approved integration harness) | Parent §23; RACE-06; COND-ARCH-B03 |
| **B06-AC02** | **AC-B07**                        | Process-local mutex alone insufficient / not SoT                                         | Tests must fail a “memory-only gate ON” negative architecture assertion              | Structural / negative architecture test                              | Parent §23; T-15 class             |
| **B06-AC03** | **AC-B08** + RACE-09              | Acquire failure/timeout fails closed; no D start                                         | Boundary `start` refuses without successful acquire                                  | Adapter + B-04 boundary specs                                        | Parent §8 RACE-09; B-04            |
| **B06-AC04** | **AC-B09** + RACE-07/08           | Stale/crashed holder cannot silently permit unsafe mutation; TTL/fencing enforced        | Expired lease reclaim bumps fence; old grant rejected for HB/release/write-proof     | TTL expiry + stale grant fixtures                                    | Parent §8; COND-ARCH-B06; SEC-B08  |
| **B06-AC05** | **AC-B10** + RACE-10              | Retries cannot bypass gate                                                               | Cached prior grant without current fence proof denied                                | Retry-without-proof fixtures                                         | Parent §8; SEC-B09                 |
| **B06-AC06** | **AC-B20** + T-16                 | Wrong fencing token cannot release or continue runner authority                          | Release/HB/write-proof reject mismatched fence                                       | Stale fence release / CAS false                                      | Parent §23; OD-B-05                |
| **B06-AC07** | **RACE-05**                       | Second runner / second acquire denied while first holds                                  | Contention path deterministic deny                                                   | Dual acquire contention                                              | Decision Freeze §11                |
| **B06-AC08** | **RACE-06**                       | While ON, deny-set mutations denied for all observers of shared SoT                      | Exercise deny path against ACTIVE durable state from a second logical client         | Enforcement + shared SoT fixture                                     | Decision Freeze §11; B-03          |
| **B06-AC09** | Parent B-06 non-scope / SEC-AC-24 | B-06 delivery introduces zero Vault mutate, zero env UPDATE, no live-capital chaos       | Diff + wall checklist                                                                | Review + static walls                                                | Parent §19 non-scope               |
| **B06-AC10** | Closed-slice wall                 | No redesign of B-01…B-05 production; no OD-B-06 reopen; no D-B03 residual silent closure | Diff + residual checklist                                                            | Review                                                               | B-05 deferrals; B-03 closures      |

```text
B06-AC01…AC10 = PLANNING-LOCAL IDs MAPPED TO PARENT AUTHORITY
No new product requirements invented.
```

---

## 8. Security / Audit Impact

| Concern                        | Affected by B-06?      | Determination                                                                                          |
| ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `ConnectionMigrationGateAudit` | **NO (production)**    | Default PRODUCTION CHANGES = NONE; may **assert** existing emits on reclaim/contention in tests only   |
| `SecurityAuditService.record`  | **NO (production)**    | Not redesigned; B-05 already verified integrity                                                        |
| Audit durability               | **VERIFY ONLY**        | Concurrent reclaim/contention may smoke existing durable outcomes; no new audit architecture           |
| Transaction boundaries         | **VERIFY ONLY**        | Prove CAS / same-txn authority semantics already implemented in B-02/B-04; do not invent new txn model |
| Fail-closed behavior           | **YES (verification)** | Core of AC-B08/B09/B10 / RACE-05…10                                                                    |
| Secret sanitization            | **NO change**          | B-05 CLOSED; do not reopen ST-B26 / AC-B13 work                                                        |
| `fenceGeneration`              | **VERIFY ONLY**        | Fencing monotonicity / stale rejection central to AC-B09/B20                                           |
| `fencingToken` (payload key)   | **NO change**          | Remains forbidden audit key (B-05); B-06 uses grant fence semantics via `fenceGeneration`              |
| B-02/B-03 behavior             | **NO redesign**        | Consume CLOSED behavior; regression/concurrency proof only                                             |

```text
SECURITY / AUDIT IMPACT SUMMARY:
  Production audit path = UNCHANGED by default
  OD-B-06 = NOT REOPENED
  B-06 security work = fail-closed concurrency / fencing / retry verification
  Do not invent new security requirements beyond parent SEC/AC/RACE sources
```

### SB-B06 Matrix (planning-local)

| ID            | Security invariant                                        | Parent source                  | Verification method          |
| ------------- | --------------------------------------------------------- | ------------------------------ | ---------------------------- |
| **SB-B06-01** | Multi-instance SoT; no split-brain allow                  | AC-B06; COND-ARCH-B03; RACE-06 | Dual-client fixture          |
| **SB-B06-02** | Process memory never authoritative                        | AC-B07; T-15                   | Negative architecture test   |
| **SB-B06-03** | Contention / acquire fail ⇒ fail closed (no D)            | AC-B08; OD-B-08; RACE-05/09    | Contention + boundary refuse |
| **SB-B06-04** | Stale/crashed holder cannot mutate / continue             | AC-B09; SEC-B08; RACE-07/08    | TTL + stale grant            |
| **SB-B06-05** | Retries cannot bypass                                     | AC-B10; SEC-B09; RACE-10       | Retry without proof          |
| **SB-B06-06** | Wrong fence cannot release / authorize D                  | AC-B20; T-16                   | Mismatched fence             |
| **SB-B06-07** | No Vault mutate / env UPDATE / live-capital chaos by B-06 | SEC-AC-24; parent non-scope    | Diff walls                   |
| **SB-B06-08** | No parallel lease SoT / no public migration HTTP          | B-04 walls; SEC-B10/B13        | Review + smoke               |

---

## 9. Test Strategy

**Do not create these files in this planning act.**

### 9.1 Unit tests

| Proposed path                                                           | Purpose                                                                                       | Assertions                                                                                  | Dependencies                                                               | ACs                  |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------- |
| `apps/api/src/modules/connections/fiv-conn-04-b-06-concurrency.spec.ts` | Dual-logical-client contention, TTL reclaim fence bump, stale HB/release, retry-without-proof | Second acquire denied; fence monotonic; stale ops rejected; cached grant invalid            | CLOSED B-02 adapter (doubles / in-memory Prisma mock pattern already used) | B06-AC01, AC04–AC07  |
| `apps/api/src/modules/connections/fiv-conn-04-b-06-crash-ttl.spec.ts`   | RACE-07/08 crash/TTL semantics without live capital chaos                                     | Lease remains ON after “process loss” simulation; reclaim only after expiry; old fence dead | B-02 adapter fixtures                                                      | B06-AC04; RACE-07/08 |

### 9.2 Integration tests

| Proposed path                                                                                                      | Purpose                                                   | Assertions                                                  | Dependencies                                                         | ACs                  |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- | -------------------- |
| `apps/api/src/modules/connections/fiv-conn-04-b-06-boundary-concurrency.spec.ts`                                   | B-04 start/write-proof under contention / stale / timeout | No D start on acquire fail; wrong fence refuses write proof | `conn04-migration-boundary.service` + gate port doubles              | B06-AC03, AC05, AC06 |
| Optional (only if **C-B06-01** = testcontainers): colocated integration harness path consistent with repo patterns | Dual-process or dual-connection Postgres proof            | Same outcomes against real DB row                           | Existing testcontainers/Postgres harness **if present and approved** | B06-AC01; RACE-06    |

### 9.3 Smoke tests

| Proposed path                                                              | Purpose                                       | Assertions                                                         | Dependencies                        | ACs                                |
| -------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------- | ---------------------------------- |
| `apps/api/src/modules/connections/fiv-conn-04-b-06-security-smoke.spec.ts` | Walls + shared-SoT deny smoke (RACE-06 class) | ACTIVE shared SoT ⇒ deny-set blocked; no Vault/env/HTTP introduced | B-03 enforcement + B-05 wall spirit | B06-AC08, AC09, AC10; SB-B06-07/08 |

### 9.4 Regression tests

| Proposed path                                                          | Purpose                                         | Assertions           | Dependencies                                                                             | ACs      |
| ---------------------------------------------------------------------- | ----------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------- | -------- |
| Keep CLOSED suites green (no modify unless Decision Freeze authorizes) | Prove B-06 does not regress B-02/B-03/B-04/B-05 | Existing suites PASS | `prisma-migration-gate.adapter.spec.ts`, enforcement, B-03 service, boundary, B-05 specs | B06-AC10 |

### 9.5 Structural / static tests

| Proposed path                                                                      | Purpose                                                             | Assertions                                | Dependencies                         | ACs                  |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------ | -------------------- |
| Included in B-06 smoke / review checklist (may be `describe` blocks in smoke spec) | AC-B07 process-local ≠ SoT; no second SoT; no public migration HTTP | Negative architecture + route/SoT absence | Code review + lightweight assertions | B06-AC02, AC09, AC10 |

### 9.6 Scenario map (parent §20 class owned/consumed by B-06)

| Parent scenario                      | B-06 expectation       |
| ------------------------------------ | ---------------------- |
| T-02 Multi-instance deny while ON    | Covered / consolidated |
| T-06 Lock acquisition contention     | Covered                |
| T-07 Lock acquire timeout            | Covered                |
| T-08 Stale/crashed TTL expiry        | Covered                |
| T-09 Retry without fencing proof     | Covered                |
| T-15 Process-local flag insufficient | Covered (AC-B07)       |
| T-16 Wrong fencing token release     | Covered (AC-B20)       |

ST-B21…ST-B26 remain parent mandatory before **parent B** closure; B-06 does **not** re-own ST-B26 (B-05) or silently re-open ST-B25 residual D-B03-08.

---

## 10. Production Impact

```text
PRODUCTION CHANGES = NONE
(default expectation — verification / test-only slice, parallel to B-05)
```

| If production changes were required                        | Likely files                                                                 | Why                                    | Architectural impact                                            | Risks                       | Dependencies                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------- | --------------------------- | ---------------------------------------- |
| Only on discovered true gap after Slice Approval amendment | `prisma-migration-gate.adapter.ts` (CAS/TTL/reclaim) and/or boundary helpers | Broken fail-closed / fencing semantics | Could touch SoT — **stop and escalate**; do not silently expand | Reopening B-02; regressions | Decision Freeze + amended Slice Approval |

```text
This planning package does NOT authorize any production edit.
Default implementation posture = TEST-ONLY.
```

---

## 11. File Plan

### CREATE (proposed — not created now except this planning doc)

| Path                                                                                                                | Why required                               |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-06-planning-package.md`                                         | **THIS ARTIFACT** — planning only          |
| Later: `apps/api/src/modules/connections/fiv-conn-04-b-06-concurrency.spec.ts`                                      | Dual-client / contention / fence proofs    |
| Later: `apps/api/src/modules/connections/fiv-conn-04-b-06-crash-ttl.spec.ts`                                        | Crash/TTL / RACE-07/08                     |
| Later: `apps/api/src/modules/connections/fiv-conn-04-b-06-boundary-concurrency.spec.ts`                             | Acquire-fail / stale / retry vs 04-D start |
| Later: `apps/api/src/modules/connections/fiv-conn-04-b-06-security-smoke.spec.ts`                                   | Walls + RACE-06 deny smoke                 |
| Later (governance): B-06 planning review / decision freeze / slice approval / impl planning / impl report / closure | Lifecycle artifacts per parent IA §24      |

### MODIFY

| Path                | Why                                                                              |
| ------------------- | -------------------------------------------------------------------------------- |
| **NONE by default** | Closed-slice production and ownership tests must not be edited to make B-06 pass |

```text
Closed-slice test modification = NOT REQUIRED for planning.
If implementation discovers a true defect in CLOSED production code:
  STOP → escalate → do not silently MODIFY closed suites or production.
```

### DELETE

| Path     | Why                     |
| -------- | ----------------------- |
| **NONE** | No deletions authorized |

### NO CHANGE

| Path / class                              | Why                             |
| ----------------------------------------- | ------------------------------- |
| All B-01…B-05 production modules          | Closed / consume-only           |
| B-05 specs (`fiv-conn-04-b-05-*.spec.ts`) | CLOSED evidence; do not rewrite |
| B-02/B-03/B-04 ownership specs            | Regression green only           |
| Prisma schema / migrations                | B-02 CLOSED                     |
| Security Audit core / OD-B-06 catalog     | Frozen                          |
| Protected dirty/untracked leftovers       | Explicitly preserved            |
| 04-D / FIV / C7 / capital surfaces        | Unauthorized                    |

---

## 12. Scope-Creep Wall

```text
B-06 MUST NOT:
  - silently absorb unrelated Wave-5 / Wave-6 leftovers
  - modify / clean / commit protected dirty/untracked files
  - reopen B-05 scope or rewrite B-05 specs for convenience
  - reopen OD-B-06 or invent new audit outcomes
  - remediate or silently close D-B03-04 / D-B03-06 / D-B03-08
  - implement 04-D privileged UPDATE / backfill
  - redesign durable lease / deny hooks / boundary
  - run production chaos against live capital / live venue / real credentials
  - enable FIV / C7 / allowRealVenueIo / capital
  - introduce a second lease SoT or public migration HTTP API
  - treat “optional testcontainers” as silent mandatory live multi-process chaos
    without Decision Freeze (C-B06-01/02)
```

```text
PRESERVE:
  Closed B-01…B-05
  Frozen OD-B-01…08
  Accepted residuals D-B03-04/06/08
  Protected working-tree leftovers
```

---

## 13. Implementation Conditions

| ID                   | Condition                                                                                                                                                                             | Blocking?                       | Verifiable how                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------- |
| **IMPL-COND-B06-01** | Keep **PRODUCTION CHANGES = NONE** unless Slice Approval is explicitly amended after a true gap escalation. Do not edit adapter/enforcement/boundary/audit core to make tests easier. | **Blocking**                    | Diff review = no production paths              |
| **IMPL-COND-B06-02** | Cover **RACE-05…RACE-10** with dedicated B-06 evidence (may consume B-02 fixtures but must not claim parent B closure without this suite).                                            | **Blocking**                    | Spec matrix ↔ race IDs                         |
| **IMPL-COND-B06-03** | Prove **AC-B06…AC-B10** and **AC-B20** with planning-local B06-AC mapping; do not invent unrelated ACs.                                                                               | **Blocking**                    | Traceability table in impl report              |
| **IMPL-COND-B06-04** | Do **not** reopen **OD-B-06**; audit assertions are smoke-only on existing outcomes.                                                                                                  | **Blocking**                    | No catalog/outcome redesign in diff            |
| **IMPL-COND-B06-05** | Preserve **D-B03-04 / D-B03-06 / D-B03-08** — no silent closure or remediation.                                                                                                       | **Blocking**                    | Residual checklist in report                   |
| **IMPL-COND-B06-06** | Live dual-process Postgres / testcontainers path only if Decision Freeze **C-B06-01** selects it; otherwise unit/integration doubles are the authorized evidence path.                | **Blocking** (method)           | Freeze text + chosen harness                   |
| **IMPL-COND-B06-07** | CREATE dedicated `fiv-conn-04-b-06-*.spec.ts` files; do not MODIFY closed-slice ownership tests unless separately authorized.                                                         | **Blocking**                    | File plan adherence                            |
| **IMPL-COND-B06-08** | No live-capital / venue I/O / real credential chaos; FAKE_* / doubles only.                                                                                                           | **Blocking**                    | Test data review                               |
| **IMPL-COND-B06-09** | Keep B-02/B-03/B-04/B-05 related suites green as regression.                                                                                                                          | **Non-blocking** (quality gate) | Vitest regression run                          |
| **IMPL-COND-B06-10** | Do not touch protected dirty/untracked leftovers.                                                                                                                                     | **Blocking**                    | `git status` delta limited to authorized files |

```text
Do not manufacture additional conditions without evidence.
```

---

## 14. Proposed Internal Slices (for later Implementation Planning)

### B06-S1 — Contention / multi-instance SoT

| Field          | Definition                         |
| -------------- | ---------------------------------- |
| **Purpose**    | RACE-05/06 + AC-B06/B07/B08        |
| **Exclusions** | Live capital chaos; lease redesign |

### B06-S2 — Crash / TTL / stale fencing

| Field          | Definition                                   |
| -------------- | -------------------------------------------- |
| **Purpose**    | RACE-07/08 + AC-B09 + AC-B20                 |
| **Exclusions** | Operator runbook productization; 04-D UPDATE |

### B06-S3 — Retry / boundary refuse + walls

| Field          | Definition                                |
| -------------- | ----------------------------------------- |
| **Purpose**    | RACE-09/10 + AC-B10 + SEC-AC-24 walls     |
| **Exclusions** | 04-D implementation; residual remediation |

---

## 15. Risks

| ID       | Risk                                                          | Mitigation                             |
| -------- | ------------------------------------------------------------- | -------------------------------------- |
| R-B06-01 | Scope creep into redesigning B-02 lease                       | Consume-only + IMPL-COND-B06-01        |
| R-B06-02 | Treating optional testcontainers as mandatory live chaos      | C-B06-01/02 Decision Freeze            |
| R-B06-03 | Confusing OD-B-06 with B-06 slice                             | Explicit §4.4 wall                     |
| R-B06-04 | Silently closing D-B03 residuals via “mid-flight concurrency” | IMPL-COND-B06-05                       |
| R-B06-05 | Absorbing Wave-5/04-A leftovers                               | Scope-creep wall + leftover protection |
| R-B06-06 | Assuming this package authorizes implementation               | Explicit NOT AUTHORIZED headers        |

---

## 16. Open Decisions for Decision Freeze (Conditions)

| ID           | Decision to freeze                                                                 | Why                                                                 | Suggested default (non-binding until freeze)                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-B06-01** | Authorized evidence method for “multi-instance”                                    | Parent allows specs + optional testcontainers; B-02 residual exists | Prefer dedicated unit/integration dual-client fixtures consuming B-02 CAS/FOR UPDATE semantics; testcontainers only if harness already available and Slice Approval opts in |
| **C-B06-02** | Disposition of B-02 “live dual-process Postgres E2E” residual                      | Avoid silent absorb vs silent ignore                                | If C-B06-01 = unit/integration: preserve residual as **ops hardening optional** after B-06; if testcontainers selected: B-06 may close that residual with evidence          |
| **C-B06-03** | B-06 = verification/regression of CLOSED concurrency surfaces (not greenfield SoT) | Parallel to C-B05-01 clarity                                        | Freeze consume-only interpretation                                                                                                                                          |
| **C-B06-04** | `B06-AC*` / `SB-B06-*` are planning-local tracing IDs only                         | Prevent ID drift                                                    | Parent norms remain AC-B06…10, AC-B20, RACE-05…10, SEC/COND                                                                                                                 |

---

## 17. Residuals

| Residual                            | Meaning                                                  | B-06 disposition                                            |
| ----------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| **D-B03-04**                        | Vault orphan after mid-flight deny                       | **PRESERVED**                                               |
| **D-B03-06**                        | S20 direct Prisma / ops-trust                            | **PRESERVED**                                               |
| **D-B03-08**                        | observe → Vault → observe → mutate race                  | **PRESERVED**                                               |
| B-02 live dual-process Postgres E2E | Optional hardening residual                              | **C-B06-02**                                                |
| Missing `…-b-05-closure.md`         | Formal closure markdown absent; human CLOSED + `d6b8602` | **PRESERVED doc residual** (non-blocking for B-06 planning) |

```text
NO SILENT CLOSURE OR REASSIGNMENT OF D-B03-04 / D-B03-06 / D-B03-08
OD-B-06 = NOT REOPENED
```

---

## 18. Implementation Preconditions

Before any B-06 implementation may begin, **all** of the following are required:

1. B-06 Planning Review = **PASS** (or PASS WITH CONDITIONS resolved)
2. Decision Freeze for **C-B06-01…04** (and any further opens from Planning Review)
3. B-06 Slice Approval = **GRANTED**
4. Implementation Planning Package + Implementation Planning Review (as governed)
5. Scope remains crash/concurrency **verification** only — no 04-D / FIV / C7 / capital

```text
THIS PACKAGE DOES NOT GRANT:
  Slice Approval
  Implementation Authorization
  Implementation Planning Authorization beyond documenting preconditions
```

---

## 19. Governance Gates

```text
COMPLETED:
  B-01…B-05 CLOSED (B-05 @ d6b8602)
  THIS ARTIFACT = B-06 Planning Package

NEXT GATE:
  FIV-CONN-04-B-06 PLANNING REVIEW

THEN (required; do not skip):
  Decision Freeze (C-B06-01…04)
  → B-06 Slice Approval
  → Implementation Planning / Review
  → Implementation
  → PO Review
  → Closure

DO NOT start B-06 implementation from this package.
DO NOT start 04-D / FIV / C7 / live I/O / capital.
DO NOT reopen B-05 / OD-B-06 / D-B03 residuals.
```

---

## 20. Explicit Statement

```text
No implementation performed.
```

```text
FIV-CONN-04-B-06 = PLANNING ONLY
B-06 IMPLEMENTATION = NOT AUTHORIZED
04-D = NOT AUTHORIZED
FIV = NOT AUTHORIZED
C7 = DENY-ALL
allowRealVenueIo = FALSE
LIVE CAPITAL = NOT ACTIVATED
Protected leftovers = UNTOUCHED
```

**Capital / live boundary preserved:**

```text
B-06 does NOT authorize:
  FIV | C7 | live venue I/O | real capital | live credentials |
  04-D | environment UPDATE | Vault mutation | production chaos
```

---

## Final State

```text
PLANNING VERDICT = PASS WITH CONDITIONS
BLOCKERS = NONE
IMPLEMENTATION AUTHORIZATION = NOT AUTHORIZED
NEXT GATE = FIV-CONN-04-B-06 PLANNING REVIEW
```

**END OF FIV-CONN-04-B-06 PLANNING PACKAGE**
