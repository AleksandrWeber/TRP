# FIV-CONN-04-D Implementation Planning Review

**Document:** FIV-CONN-04-D Conditional Environment UPDATE + Durable Audit — Implementation Planning Review  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-D — Conditional environment UPDATE + durable audit  
**Authority:** Independent Architecture + Security + Execution Planning Reviewer  
**Nature:** **REVIEW ONLY.** Does **not** implement D. Does **not** modify production source, tests, A/B/C, Prisma/schema, or Vault. Does **not** create Implementation Authorization. Does **not** deliver A preflight. Does **not** invent actor identities or silently freeze NB-01.

**Reviewed artifact:** [`v3-l02-fiv-conn-04-d-implementation-planning.md`](./v3-l02-fiv-conn-04-d-implementation-planning.md)  
**Slice Approval:** [`v3-l02-fiv-conn-04-d-slice-approval.md`](./v3-l02-fiv-conn-04-d-slice-approval.md) — **APPROVED FOR IMPLEMENTATION PLANNING**  
**Decision Freeze:** [`v3-l02-fiv-conn-04-d-decision-freeze.md`](./v3-l02-fiv-conn-04-d-decision-freeze.md)  
**Planning Review:** [`v3-l02-fiv-conn-04-d-planning-review.md`](./v3-l02-fiv-conn-04-d-planning-review.md)  
**Planning Package:** [`v3-l02-fiv-conn-04-d-planning-package.md`](./v3-l02-fiv-conn-04-d-planning-package.md)

**Repository baseline:** `e4c4e9a183c016ac23eb0d0685341438e860f46e`

```text
IMPLEMENTATION PLANNING REVIEW = PASS WITH CONDITIONS

Interpretation:
  The Implementation Plan is fundamentally sound, traceable to frozen
  D-CONN-04 / A→B→C→D boundaries, and correctly refuses to invent unbound
  policy. Explicit prerequisites remain before Implementation Authorization.

  This review does NOT authorize implementation.
```

```text
D IMPLEMENTATION = NOT STARTED
D IMPLEMENTATION AUTHORIZATION = NOT GRANTED
FIV-CONN-04-C = FORMALLY CLOSED
Residuals PRESERVED (C-B06-02 OPEN/OPTIONAL; D-B03-04/06/08 ACCEPTED)
```

Protected dirty/untracked leftovers outside this review artifact were **not** modified.  
The Implementation Planning artifact was **not** modified by this review.

---

## 1. Review Status

| Field                        | Value                                        |
| ---------------------------- | -------------------------------------------- |
| Gate                         | FIV-CONN-04-D Implementation Planning Review |
| Verdict                      | **PASS WITH CONDITIONS**                     |
| Plan under review            | READY FOR IMPLEMENTATION PLANNING REVIEW     |
| Implementation Authorization | **NOT GRANTED**                              |

---

## 2. Baseline

| Field                                              | Check                                         |
| -------------------------------------------------- | --------------------------------------------- |
| `HEAD` = `e4c4e9a…`                                | **MATCH**                                     |
| C FORMALLY CLOSED                                  | **MATCH**                                     |
| A classifier / C classifier / B-04 present on main | **CONFIRMED**                                 |
| A preflight Nest service not tracked               | **CONFIRMED**                                 |
| `connection.environment-backfill` absent           | **CONFIRMED**                                 |
| TTL/heartbeat constants labeled guidance           | **CONFIRMED** (`migration-gate.constants.ts`) |

---

## 3. Governance Inputs

Reviewed: D Package / Planning Review / Decision Freeze / Slice Approval / Implementation Planning; parent D-CONN-04 freezes; C closure/boundary; B-04 handoff; A Closure vs A sync delivery gap; code for B-04, CAS/`FOR UPDATE` lease pattern, C/A classifiers, Security Audit catalog, `PrismaTransactionService`, privileged actor types.

Label discipline in the plan: **PASS** (FROZEN / PROPOSED / UNRESOLVED / BLOCKING distinguished).

---

## 4. Requirement Traceability

| ID           | Represented? | Binding clear?               | Testable? | Boundary OK? | Expansion? | Notes                        |
| ------------ | ------------ | ---------------------------- | --------- | ------------ | ---------- | ---------------------------- |
| D-CONN-04-01 | YES          | YES                          | YES       | YES          | NO         | Via C + Connected            |
| D-CONN-04-02 | YES          | YES                          | YES       | YES          | NO         |                              |
| D-CONN-04-03 | YES          | YES                          | YES       | YES          | NO         | Batch continue               |
| D-CONN-04-04 | YES          | YES                          | YES       | YES          | NO         |                              |
| D-CONN-04-05 | YES          | YES                          | YES       | YES          | NO         | Strategy B / P2002           |
| D-CONN-04-06 | YES          | YES                          | YES       | YES          | NO         | Residual NULL                |
| D-CONN-04-07 | YES          | YES                          | YES       | YES          | NO         | No schema change             |
| D-CONN-04-08 | YES          | YES                          | YES       | YES          | NO         | Consume B-04                 |
| D-CONN-04-09 | YES          | Substance YES; type PROPOSED | YES       | YES          | NO         | NB-01 not invented as frozen |
| D-CONN-04-10 | YES          | YES                          | N/A claim | YES          | NO         | No PRE-01/FIV                |
| AC-D-01…07   | YES          | YES                          | YES       | YES          | NO         | Preserved                    |

```text
TRACEABILITY = PASS
No unauthorized new frozen requirements introduced.
```

---

## 5. Prerequisite Review

### P-D-01 — A preflight delivery

| Distinction                       | Assessment                                                       |
| --------------------------------- | ---------------------------------------------------------------- |
| Frozen fresh-preflight obligation | **FROZEN** (C-05 / Slice §14) — correctly required before writes |
| Concrete Nest preflight service   | Closed A listed it; **not** on `origin/main`                     |
| Repository delivery status        | Classifier synced; I/O service **gap**                           |
| D dependency                      | Hard on **evidence**; preferred vehicle = closed A I/O surface   |
| Authorization prerequisite        | **YES — BLOCKING FOR AUTHORIZATION**                             |

**Verdict:** Plan correctly treats delivery as **PREREQUISITE / BLOCKING**, not as a D redesign, and correctly rejects untracked WIP as SoT. This review does **not** deliver A.

### P-D-02 — Privileged actorId provenance

| Assessment                                                | Result                              |
| --------------------------------------------------------- | ----------------------------------- |
| Contract evidence (`PrivilegedActorContext`, B-04 checks) | **Sufficient**                      |
| Concrete ops identity mapping                             | **Insufficient** — must not invent  |
| Plan treatment                                            | Correctly **UNRESOLVED / BLOCKING** |

**Verdict:** **PASS as classification**; remains **BLOCKING FOR AUTHORIZATION**.

### P-D-03 — NB-01 event type

| Assessment                                 | Result                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| Proposed `connection.environment-backfill` | Supported as **Slice §13 preferred** + catalog separation from lifecycle/gate |
| Frozen by existing catalog?                | **NO** — type absent                                                          |
| Parent NB-01                               | ACCEPTED deferral to implementation decision                                  |
| Plan treatment                             | Correctly **PROPOSED / REQUIRES EXPLICIT DECISION**                           |

**Verdict:** Preference **endorsed as PROPOSED**; **not ratified as frozen**. Remains **BLOCKING FOR AUTHORIZATION** until explicit decision.

### P-D-04 — This Implementation Planning Review

| Assessment                                        | Result   |
| ------------------------------------------------- | -------- |
| Treated as governance gate (not code requirement) | **PASS** |
| Required before Authorization                     | **YES**  |

```text
P-D-04 = THIS GATE (completing now as PASS WITH CONDITIONS)
```

---

## 6. Proposed-Binding Review

### 6.1 Connection FOR UPDATE (`$queryRaw` pattern)

| Question                             | Finding                                                                                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Needed for frozen concurrency model? | **NO** — lease + B-04 + same-txn CAS + conditional `environment IS NULL` + Strategy B already satisfy **FROZEN** COND-ARCH-B04 / Slice authorities |
| Existing pattern?                    | YES — gate adapter uses `FOR UPDATE` on **lease** row                                                                                              |
| Risk if mandated?                    | Extra locking / complexity without new frozen requirement                                                                                          |
| Plan status                          | Correctly **PROPOSED / optional**                                                                                                                  |

**Review disposition (IMPL-REV-D-01):**

```text
Connection-row FOR UPDATE = OPTIONAL IMPLEMENTATION DETAIL
NOT elevated to FROZEN / NOT required for Authorization
Frozen safety boundary remains: CAS + conditional UPDATE + Strategy B
```

### 6.2 TTL / heartbeat (15m / 5m)

| Question                             | Finding                                                  |
| ------------------------------------ | -------------------------------------------------------- |
| Repository facts?                    | YES — `MIGRATION_GATE_DEFAULT_TTL_MS` / `…HEARTBEAT_MS`  |
| Frozen OD-B policy?                  | **NO** — labeled “Technical/ops — not a new OD-B policy” |
| ≤4h ceiling / fail-closed on expire? | **FROZEN**                                               |
| Plan treatment                       | Correctly **PROPOSED** reuse of guidance                 |

**Review disposition (IMPL-REV-D-02):**

```text
15m TTL / 5m heartbeat = OPERATIONAL DEFAULTS (guidance)
MUST NOT silently become new frozen max-window policy
Authorization may bind “use existing defaults ≤ guidance/ceiling”
Heartbeat-on-long-batch + stop-on-HB-fail = ACCEPTABLE under frozen fail-closed
```

### 6.3 Runner shape (Nest orchestrator)

| Question      | Finding                                                           |
| ------------- | ----------------------------------------------------------------- |
| Precedent     | A/B/C Nest services; B-04 “future 04-D runner”; no public HTTP    |
| Security      | Privileged internal; AC-D-07 preserved if no controller env PATCH |
| Cron default? | Correctly rejected                                                |

**Review disposition (IMPL-REV-D-03):**

```text
Privileged Nest orchestrator (no public HTTP; not default cron)
= ACCEPTED PROPOSED BINDING for Authorization to consume
Exact trusted entry / actor construction remains P-D-02
```

### 6.4 Audit model (per-row + summary; inventory without D per-row)

| Question                                | Finding                                                  |
| --------------------------------------- | -------------------------------------------------------- |
| Compatible with D-CONN-04-09 / AC-D-04? | **YES** — updated + blocked durable                      |
| Compatible with OQ-D-06?                | **YES** — resolves deferred remainder reasonably         |
| A inventory without D per-row audits?   | **YES** — A is read-only; D-CONN-04-09 is D write-window |

**Review disposition (IMPL-REV-D-04):**

```text
Write-path per-row durable audit + operation_summary = ACCEPTED PROPOSED BINDING
A preflight inventory ≠ D durable per-row audit obligation
```

### 6.5 Audit-after-UPDATE forward-fix

| Question                  | Finding                                                                    |
| ------------------------- | -------------------------------------------------------------------------- |
| Frozen support?           | Slice §17–18 — retry audit; no auto LIVE→NULL                              |
| Same-txn audit preferred? | Compatible with `ConnectionMigrationGateAudit` txn overload                |
| Gap?                      | Must not claim success if updated rows lack durable audit; mark run errors |

**Review disposition (IMPL-REV-D-05):**

```text
Forward-fix after UPDATE + audit failure = ACCEPTED (FROZEN substance)
Require: no silent success claim; operator reconciliation path retained
Prefer same-txn audit when Security Audit API accepts TransactionContext
```

### 6.6 Qualitative Vault threshold

Plan’s qualitative-only rule: **ACCEPTED** — no invented number; matches Decision Freeze allowance.

---

## 7. Transaction / Concurrency Review

Proposed flow:

```text
Preflight → B-04 start → (Vault+occupancy+C outside txn) → per-row txn
(CAS → conditional UPDATE → audit) → heartbeat → summary → release
```

| Check                                  | Verdict                                                                                                                | Notes                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Ordering vs B-04 handoff               | **PASS**                                                                                                               | Vault outside; CAS+UPDATE inside |
| B-04 bypass?                           | **NO**                                                                                                                 |                                  |
| Second SoT?                            | **NO**                                                                                                                 |                                  |
| Lease ownership                        | **PASS**                                                                                                               | start/HB/release + CAS           |
| Strategy B authoritative               | **PASS**                                                                                                               | occupancy + unique index         |
| Stale worker write                     | **PASS**                                                                                                               | CAS miss fail-closed             |
| C re-invoke proximity                  | **CONDITION**                                                                                                          | See IMPL-REV-D-06                |
| Eligibility stale between C and UPDATE | **MITIGATED** by re-read Connection + predicates + CAS; Vault/occupancy must be per-attempt fresh (not preflight-only) |                                  |
| FOR UPDATE mandatory?                  | **NO**                                                                                                                 | IMPL-REV-D-01                    |

**IMPL-REV-D-06 (CONDITION):**

```text
Per write attempt MUST:
  1. Load fresh Vault metadata (exact id) + typed occupancy
  2. Re-invoke C on those fresh inputs
  3. Only then open write txn (re-read Connection + CAS + conditional UPDATE)

Preflight ELIGIBLE_LIVE set is informational candidate discovery ONLY.
Stale batch-pass C dispositions alone are NEVER sufficient (FROZEN).
```

```text
TRANSACTION / CONCURRENCY VERDICT = PASS WITH CONDITION IMPL-REV-D-06
```

---

## 8. Failure / Recovery Review

| Failure                     | Plan         | Review                     |
| --------------------------- | ------------ | -------------------------- |
| Stale C                     | Reclassify   | **PASS** (+ IMPL-REV-D-06) |
| SecretState ≠ Connected     | Skip         | **PASS**                   |
| Workspace / env mismatch    | Skip         | **PASS**                   |
| Strategy B collision        | Skip         | **PASS**                   |
| Occupancy unavailable       | Never LIVE   | **PASS**                   |
| Lease unavailable / UNKNOWN | Abort start  | **PASS**                   |
| Lease expire / HB fail      | Stop writes  | **PASS**                   |
| Vault systemic              | Abort        | **PASS**                   |
| Vault per-row               | Skip         | **PASS**                   |
| CAS miss                    | No UPDATE    | **PASS**                   |
| DB txn fail                 | Rollback row | **PASS**                   |
| Duplicate retry             | 0-row skip   | **PASS**                   |
| Audit fail after UPDATE     | Forward-fix  | **PASS** (IMPL-REV-D-05)   |
| Partial batch               | Continue     | **PASS**                   |
| Actor invalid               | Refuse       | **PASS**                   |

No fail-open inventiveness detected. Unsupported frozen-governance conflicts: **NONE**.

```text
FAILURE / RECOVERY VERDICT = PASS
```

---

## 9. Security Review

| Control                                   | Assessment                               |
| ----------------------------------------- | ---------------------------------------- |
| Privileged invocation / no public env API | **PASS** (AC-D-07)                       |
| Actor provenance                          | **BLOCKING** until P-D-02                |
| Workspace / environment isolation         | **PASS**                                 |
| Vault metadata-only / Connected           | **PASS**                                 |
| Fresh C classification                    | **PASS** + IMPL-REV-D-06                 |
| B gate + CAS fencing                      | **PASS**                                 |
| Strategy B                                | **PASS**                                 |
| Audit integrity / no secrets              | **PASS** (substance); type pending NB-01 |
| Stale worker prevention                   | **PASS** (CAS)                           |

**Security conditions before Authorization:** P-D-01, P-D-02, P-D-03 + IMPL-REV-D-06 observance in Implementation Authorization / kickoff plan.

```text
SECURITY VERDICT = PASS WITH CONDITIONS (authorization blockers remain)
```

---

## 10. Test-Plan Review

18 categories cover AC-D-01…07, concurrency/CAS, idempotency, Vault/lease/TTL, audit, actor negatives. No FIV/venue/capital tests introduced. Preserve A/B/C/B-04 regressions correctly required.

**Gap note (non-blocking):** Ensure tests assert IMPL-REV-D-06 (per-attempt fresh C inputs), not only preflight-pass → write.

```text
TEST-PLAN VERDICT = PASS (with IMPL-REV-D-06 coverage expectation)
```

---

## 11. Implementation-Surface Review

| Surface                       | Necessary?    | Minimal? | Reuse OK?          | Ownership          | Public/schema risk?         |
| ----------------------------- | ------------- | -------- | ------------------ | ------------------ | --------------------------- |
| Nest D orchestrator           | YES           | YES      | Precedent          | D                  | Must stay non-HTTP          |
| Per-row write unit            | YES           | YES      | CAS/txn            | D                  | None if internal            |
| Audit helper + catalog        | YES           | YES      | Gate audit pattern | D + Security Audit | After NB-01 only            |
| Module wiring                 | YES           | YES      | Existing module    | Connections        | Do not wire untracked A WIP |
| Extend B-04 with UPDATE       | **FORBIDDEN** | —        | —                  | —                  | Plan correctly forbids      |
| Schema / controller env PATCH | **FORBIDDEN** | —        | —                  | —                  | Plan correctly forbids      |

```text
IMPLEMENTATION-SURFACE VERDICT = PASS
```

---

## 12. Authorization Prerequisites

| ID                | Item                                                    | Status after this review                                         |
| ----------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| **P-D-01**        | A preflight delivery on `origin/main` (or PO alternate) | **UNRESOLVED / BLOCKING FOR AUTHORIZATION**                      |
| **P-D-02**        | Concrete actorId provenance                             | **UNRESOLVED / BLOCKING FOR AUTHORIZATION**                      |
| **P-D-03**        | Explicit NB-01 event-type decision                      | **PROPOSED candidate; BLOCKING until decided**                   |
| **P-D-04**        | Implementation Planning Review                          | **COMPLETE = PASS WITH CONDITIONS**                              |
| **IMPL-REV-D-01** | FOR UPDATE                                              | **OPTIONAL** — not blocking                                      |
| **IMPL-REV-D-02** | TTL/HB cadence                                          | Bind as guidance defaults at Authorization — not new OD-B freeze |
| **IMPL-REV-D-03** | Runner shape                                            | **ACCEPTED PROPOSED**                                            |
| **IMPL-REV-D-04** | Audit granularity                                       | **ACCEPTED PROPOSED**                                            |
| **IMPL-REV-D-05** | Forward-fix audit                                       | **ACCEPTED** (frozen substance)                                  |
| **IMPL-REV-D-06** | Per-attempt fresh Vault+occupancy+C before write txn    | **CONDITION** — must be in Authorization/kickoff                 |
| Vault threshold   | Qualitative-only                                        | **ACCEPTED**                                                     |
| OQ-D-08           | E handoff                                               | **DEFERRED to E**                                                |

---

## 13. Conditions

```text
CONDITIONS (IMPL-REV-D-01…06) — binding for later Authorization / implementation:
```

| ID                | Condition                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **IMPL-REV-D-01** | Connection-row FOR UPDATE remains **optional**; frozen safety = CAS + conditional UPDATE + Strategy B                  |
| **IMPL-REV-D-02** | 15m/5m constants are **guidance defaults** under ≤4h; do not invent new max-window policy                              |
| **IMPL-REV-D-03** | Privileged Nest orchestrator (no public HTTP; not default cron) accepted as runner binding                             |
| **IMPL-REV-D-04** | Write-path per-row durable audit + `operation_summary` accepted                                                        |
| **IMPL-REV-D-05** | Audit-after-UPDATE = forward-fix; no silent success; prefer same-txn audit                                             |
| **IMPL-REV-D-06** | Per write attempt: fresh Vault meta + occupancy + C **immediately before** write txn; preflight set informational only |

```text
UNTIL P-D-01, P-D-02, P-D-03 ARE DISPOSED:
  Implementation Authorization MUST NOT be granted.
```

---

## 14. Blockers

| ID                                  | Blocker for this Review?       | Blocker for Implementation Authorization? |
| ----------------------------------- | ------------------------------ | ----------------------------------------- |
| Missing frozen D purpose / boundary | **NO**                         | —                                         |
| P-D-01 A delivery                   | **NO** (correctly inventoried) | **YES**                                   |
| P-D-02 actor mapping                | **NO** (correctly inventoried) | **YES**                                   |
| P-D-03 NB-01 decision               | **NO** (correctly inventoried) | **YES**                                   |

```text
NO REVIEW BLOCKER → verdict is not BLOCKED
AUTHORIZATION BLOCKERS REMAIN → not PASS (unconditional)
```

---

## 15. Final Verdict

```text
════════════════════════════════════════
IMPLEMENTATION PLANNING REVIEW = PASS WITH CONDITIONS
════════════════════════════════════════

Rationale:
  - Traceable to D-CONN-04-01…10 and AC-D-01…07
  - Boundaries A/B/C/E preserved; B-04 not bypassed
  - Proposed bindings critically assessed (FOR UPDATE not mandated;
    TTL/HB not elevated to OD-B; runner/audit accepted as proposed)
  - Prerequisites correctly classified as authorization blockers
  - IMPL-REV-D-06 closes write-time freshness ambiguity without redesign

NOT AUTHORIZED:
  Implementation coding/tests
  Implementation Authorization
  A preflight delivery
  FIV / C7 / live capital / venue I/O
```

---

## 16. Next Governance Gate

```text
NEXT GATE = FIV-CONN-04-D IMPLEMENTATION AUTHORIZATION

Only after:
  - P-D-01 disposed
  - P-D-02 disposed
  - P-D-03 (NB-01) explicitly decided
  - IMPL-REV-D-01…06 acknowledged in Authorization record
```

Ladder (do not skip): Implementation Authorization → Implementation / Kickoff → … → E.

---

## 17. Explicit Non-Authorization Statement

```text
D IMPLEMENTATION NOT STARTED
D IMPLEMENTATION AUTHORIZATION NOT GRANTED

This Implementation Planning Review does NOT:
  - authorize D coding or tests
  - deliver A preflight synchronization
  - invent actor identity values
  - freeze NB-01 by assumption
  - mandate Connection-row FOR UPDATE
  - elevate guidance TTL/HB to new OD-B policy
  - authorize FIV / C7 / live capital / venue I/O
  - close residuals or reopen C
```

**END OF FIV-CONN-04-D IMPLEMENTATION PLANNING REVIEW**
