# FIV-CONN-04-D Slice Approval

**Document:** FIV-CONN-04-D Conditional Environment UPDATE + Durable Audit — Slice Approval  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-D — Conditional environment UPDATE + durable audit  
**Authority:** Product Owner / Chief Architect  
**Nature:** **SLICE APPROVAL ONLY.** Authorizes FIV-CONN-04-D to proceed to **Implementation Planning** as the next gate. Does **not** implement D. Does **not** grant Implementation Authorization. Does **not** create Implementation Planning in this act. Does **not** authorize coding/tests/production changes. Does **not** resolve deferred/unresolved Decision Freeze items by assumption. Does **not** authorize 04-E, FIV, C7, venue I/O, or live capital. Does **not** reopen D-CONN-04-01…10 or reopen C.

**Planning Package:** [`v3-l02-fiv-conn-04-d-planning-package.md`](./v3-l02-fiv-conn-04-d-planning-package.md)  
**Planning Review:** [`v3-l02-fiv-conn-04-d-planning-review.md`](./v3-l02-fiv-conn-04-d-planning-review.md) — **PASS WITH CONDITIONS**  
**Decision Freeze:** [`v3-l02-fiv-conn-04-d-decision-freeze.md`](./v3-l02-fiv-conn-04-d-decision-freeze.md) — **GRANTED WITH EXPLICIT DEFERRED / UNRESOLVED ITEMS**  
**Parent Decision Freeze:** [`v3-l02-fiv-conn-04-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-po-governance-decision-freeze.md) — D-CONN-04-01…10 **FROZEN**  
**C Formal Closure:** [`v3-l02-fiv-conn-04-c-closure.md`](./v3-l02-fiv-conn-04-c-closure.md) — **FORMALLY CLOSED**

**Repository baseline:** `e4c4e9a183c016ac23eb0d0685341438e860f46e`

---

## 1. Slice Approval Status

```text
SLICE APPROVAL STATUS = APPROVED FOR IMPLEMENTATION PLANNING

FIV-CONN-04-D = SLICE APPROVED FOR IMPLEMENTATION PLANNING
D Identity = Conditional environment UPDATE (NULL→live) + durable audit
NEXT GATE = FIV-CONN-04-D IMPLEMENTATION PLANNING
```

```text
This approval authorizes ONLY FIV-CONN-04-D Implementation Planning.
It does NOT mean “implementation authorized.”
It does NOT authorize Implementation Kickoff.
It does NOT authorize production changes.
It does NOT authorize FIV / C7 / live capital / live trading / venue I/O.
It does NOT close deferred/unresolved Decision Freeze items.
```

```text
D IMPLEMENTATION = NOT STARTED
D IMPLEMENTATION AUTHORIZATION = NOT GRANTED
FIV-CONN-04-C = FORMALLY CLOSED
Residuals PRESERVED:
  C-B06-02 = OPEN / OPTIONAL
  D-B03-04 / D-B03-06 / D-B03-08 = ACCEPTED
```

Protected dirty/untracked leftovers outside this Slice Approval artifact were **not** modified.  
Planning Package, Planning Review, and Decision Freeze were **not** modified.

---

## 2. Baseline

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| `HEAD`              | `e4c4e9a183c016ac23eb0d0685341438e860f46e`        |
| C formal closure    | Same commit — **FORMALLY CLOSED**                 |
| A sync (classifier) | `32388f4…`                                        |
| C sync              | `ee252be…`                                        |
| Decision Freeze     | GRANTED WITH EXPLICIT DEFERRED / UNRESOLVED ITEMS |
| Planning Review     | PASS WITH CONDITIONS                              |

### Approval preconditions checklist

| Check                                                           | Result   |
| --------------------------------------------------------------- | -------- |
| D Planning Package present                                      | **PASS** |
| Planning Review = PASS WITH CONDITIONS                          | **PASS** |
| Decision Freeze granted (with explicit deferred/unresolved)     | **PASS** |
| Decision Freeze §18 Slice Approval preconditions satisfied      | **PASS** |
| D identity unambiguous (UPDATE + durable audit; not E)          | **PASS** |
| D-CONN-04-01…10 unreopened                                      | **PASS** |
| C→D / B→D boundaries explicit                                   | **PASS** |
| Deferred/unresolved items carried forward (not silently closed) | **PASS** |
| Residuals preserved                                             | **PASS** |
| No implementation authorization implied                         | **PASS** |
| Architecture blockers requiring BLOCKED verdict                 | **NONE** |
| Security blockers requiring BLOCKED verdict                     | **NONE** |

```text
PRECONDITION FAIL COUNT = 0
VERDICT = APPROVED FOR IMPLEMENTATION PLANNING (not BLOCKED)
```

Rationale for not BLOCKED: Decision Freeze established binding design substance and explicitly authorized Slice Approval to proceed while carrying delivery/ops/deferred items as Implementation Planning prerequisites. Material ambiguity is inventoried, not undefined.

---

## 3. Governance Chain

```text
Parent D-CONN-04-01…10 FROZEN
  → Parent FIV-CONN-04 Slice Approval (sub-slices A…E)
  → A CLOSED / B CLOSED / C FORMALLY CLOSED
  → D Planning Package
  → D Planning Review = PASS WITH CONDITIONS
  → D Decision Freeze = GRANTED WITH EXPLICIT DEFERRED / UNRESOLVED ITEMS
  → D Slice Approval (THIS) = APPROVED FOR IMPLEMENTATION PLANNING
  → NEXT: D Implementation Planning
  → (later) Implementation Planning Review → Implementation Authorization → Implementation
```

Frozen sequence **A → B → C → D → E** unchanged.

---

## 4. Approved D Scope

**APPROVED FOR IMPLEMENTATION PLANNING** (binding design scope; not implementation authorization):

| Item                       | Definition                                                                  | Class                                 |
| -------------------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| Conditional env UPDATE     | `Connection.environment` **NULL → `live` only**                             | **FROZEN / BINDING**                  |
| Eligibility                | Vault-proven EXCHANGE rows only (Trading / TradingLive + Connected)         | **FROZEN / BINDING**                  |
| Classifier use             | Re-invoke C (`classifyFivConn04LiveConnection` or equivalent) at write time | **FROZEN / BINDING**                  |
| `SecretState.Connected`    | Required for `ELIGIBLE_LIVE` (IPR-C-01)                                     | **FROZEN / BINDING**                  |
| B write gate               | Window ON; deny-set active; single-runner lease                             | **FROZEN / BINDING**                  |
| B-04 façade                | Start/resume/heartbeat/release + `assertWriteAuthority`                     | **FROZEN / BINDING**                  |
| Same-txn CAS               | Mandatory with conditional UPDATE (no check-then-save)                      | **FROZEN / BINDING**                  |
| Strategy B                 | Collision → skip/report; P2002 continue; no cleanup                         | **FROZEN / BINDING**                  |
| Workspace / env isolation  | Exact workspace match; no TESTNET→LIVE; no cross-ws                         | **FROZEN / BINDING**                  |
| Durable Security Audit     | D-CONN-04-09 substance for updated + blocked                                | **FROZEN / BINDING**                  |
| Nullable semantics         | Keep nullable; residual NULL fail-closed                                    | **FROZEN / BINDING**                  |
| Fail-closed                | UNKNOWN gate / occupancy unavailable / systemic Vault outage → refuse/abort | **FROZEN / BINDING**                  |
| Idempotency                | `environment IS NULL` predicate; populated env never rewritten              | **FROZEN / BINDING**                  |
| Batch continue             | Skip/block continue (D-CONN-04-03/05)                                       | **FROZEN / BINDING**                  |
| Fresh A preflight evidence | Obligation before writes (C-05 / Slice §14)                                 | **FROZEN / BINDING**                  |
| Runner/batch behavior      | Only to extent frozen (lease, CAS, continue-on-skip, ≤4h ceiling)           | **FROZEN / BINDING** (shape deferred) |

---

## 5. D Non-Scope

**OUT OF SCOPE** (must not be absorbed by D):

| Item                                                      | Owner / note                           |
| --------------------------------------------------------- | -------------------------------------- |
| C classification redesign / evidence SoT                  | **C** — D re-invokes only              |
| B gate / lease / deny-set redesign                        | **B** — D consumes                     |
| A classifier redesign                                     | **A** — fresh evidence obligation only |
| E residual verification / gate release                    | **E**                                  |
| Closing FIV-PRE-01 / authorizing FIV                      | Forbidden (D-CONN-04-10)               |
| Changing public create-time environment semantics         | Forbidden                              |
| Second lease / eligibility / concurrency SoT              | Forbidden                              |
| Vault payload / secret material handling                  | Forbidden                              |
| Vault mutation / purpose change / `vaultSecretId` replace | Forbidden                              |
| NOT NULL enforcement                                      | Forbidden (D-CONN-04-07)               |
| TESTNET / DEMO population                                 | Out of CONN-04                         |
| Public environment mutation API                           | Forbidden (C-02)                       |
| Unrelated ConnectionsService lifecycle redesign           | Forbidden                              |
| Remediating D-B03-04/06/08 or closing C-B06-02            | **PRESERVED** residuals                |
| FIV / C7 / venue I/O / live capital                       | Not authorized                         |

---

## 6. D-CONN-04-01…10 Traceability

| ID         | Frozen                 | D Slice Approval implication                 | Trace    |
| ---------- | ---------------------- | -------------------------------------------- | -------- |
| **01 = A** | Vault-proven LIVE only | UPDATE only when C/A eligibility + Connected | **PASS** |
| **02 = A** | Ambiguous → NULL       | Never force LIVE                             | **PASS** |
| **03 = A** | Skip/audit; continue   | Batch continue                               | **PASS** |
| **04 = A** | Skip defective         | Never auto-LIVE                              | **PASS** |
| **05 = A** | Strategy B prevention  | Skip/report; no cleanup                      | **PASS** |
| **06 = C** | Residual NULL OK       | May leave NULL; fail-closed                  | **PASS** |
| **07 = A** | Keep nullable          | No NOT NULL                                  | **PASS** |
| **08 = B** | Write gate             | Consume B; do not reimplement                | **PASS** |
| **09 = B** | Durable audit          | Substance in scope; NB-01 deferred           | **PASS** |
| **10 = B** | PRE-01 policy          | D does not close PRE-01                      | **PASS** |

```text
D-CONN-04 TRACEABILITY = COMPLETE / UNREOPENED
```

---

## 7. Slice AC-D-01…07 Assessment

| ID          | Criterion                                     | Status under this approval                            | Testable later? | Consistent with freeze? |
| ----------- | --------------------------------------------- | ----------------------------------------------------- | --------------- | ----------------------- |
| **AC-D-01** | Conditional UPDATE predicates enforced        | **FROZEN / BINDING** (parent SLICE-APPROVED-AC)       | YES             | YES                     |
| **AC-D-02** | `vaultSecretId` unchanged                     | **FROZEN / BINDING**                                  | YES             | YES                     |
| **AC-D-03** | No rewrite of populated env                   | **FROZEN / BINDING**                                  | YES             | YES                     |
| **AC-D-04** | Durable audit for updated and blocked rows    | **FROZEN / BINDING** (substance); event type DEFERRED | YES (substance) | YES                     |
| **AC-D-05** | Batch continues after skip/block              | **FROZEN / BINDING**                                  | YES             | YES                     |
| **AC-D-06** | Zero Vault mutations                          | **FROZEN / BINDING**                                  | YES             | YES                     |
| **AC-D-07** | Migration exception not exposed as public API | **FROZEN / BINDING**                                  | YES             | YES                     |

```text
AC-D-01…07 = COMPLETE ENOUGH FOR IMPLEMENTATION PLANNING
AC-D-01…07 = INTERNALLY CONSISTENT WITH D-CONN-04-01…10 AND DECISION FREEZE
No new binding ACs added by this Slice Approval.
```

**PAC-D-01…10** remain **PROPOSED / NOT BINDING** (planning-package criteria only).

No **PROPOSED — REQUIRES RATIFICATION** AC is introduced by this approval.

---

## 8. Frozen Inherited Constraints

| Constraint                                      | Class                |
| ----------------------------------------------- | -------------------- |
| A→B→C→D→E sequence                              | **FROZEN / BINDING** |
| IPR-C-01 Connected                              | **FROZEN / BINDING** |
| C-02 migration-time exception bounded           | **FROZEN / BINDING** |
| C-04 / D-CONN-04-09 audit substance             | **FROZEN / BINDING** |
| C-05 fresh preflight obligation                 | **FROZEN / BINDING** |
| COND-ARCH-B04 same-txn CAS                      | **FROZEN / BINDING** |
| COND-SEC-B05/B10 refuse without lease / UNKNOWN | **FROZEN / BINDING** |
| D-CRED-02-09 immutability except D window       | **FROZEN / BINDING** |
| Model C / CONN-03 NULL fail-closed on use       | **FROZEN / BINDING** |
| Forward-fix; no auto LIVE→NULL                  | **FROZEN / BINDING** |

---

## 9. C→D Boundary

```text
C→D BOUNDARY = APPROVED / PRESERVED

C: read-only LIVE classification; Connected; no mutation
D: re-invoke C; independent Connection/Vault/occupancy re-reads;
   conditional UPDATE; durable audit

D does NOT reimplement C.
D does NOT treat stale C dispositions as write authority.
C closure does NOT authorize D implementation.
```

---

## 10. B→D Write-Gate Boundary

```text
B→D BOUNDARY = APPROVED / PRESERVED

B owns: lease SoT, deny-set, fencing, B-04 refuse-without-proof
D consumes: start/resume/heartbeat/release + assertWriteAuthority in same txn as UPDATE

D does NOT bypass B.
D does NOT redesign gate/lease/deny-set.
D does NOT introduce a second concurrency SoT.
```

---

## 11. Deferred / Unresolved Items

**Carried forward unchanged from Decision Freeze — not closed by Slice Approval:**

| ID                    | Topic                                 | Status                     | Class                                    |
| --------------------- | ------------------------------------- | -------------------------- | ---------------------------------------- |
| **COND-D-01**         | Fresh preflight obligation            | **RATIFIED**               | **FROZEN / BINDING**                     |
| **COND-D-01**         | Delivery vehicle on `origin/main`     | **UNRESOLVED**             | Prerequisite for Implementation Planning |
| **COND-D-02**         | Audit substance                       | **FROZEN**                 | **FROZEN / BINDING**                     |
| **COND-D-02 / NB-01** | Event type                            | **DEFERRED**               | Implementation Planning decision         |
| **COND-D-03**         | `SYSTEM_JOB` \| `OPERATOR`            | **RATIFIED**               | **FROZEN / BINDING**                     |
| **COND-D-03**         | Ops identity mapping                  | **UNRESOLVED**             | Prerequisite for Implementation Planning |
| **COND-D-04**         | Lease + CAS + predicates + Strategy B | **FROZEN**                 | **FROZEN / BINDING**                     |
| **COND-D-04**         | Exact FOR UPDATE API                  | **DEFERRED**               | Implementation Planning decision         |
| **COND-D-05**         | Systemic abort / per-row skip         | **FROZEN**                 | **FROZEN / BINDING**                     |
| **COND-D-05**         | Numeric Vault threshold               | **UNRESOLVED** (if needed) | Implementation Planning decision         |
| **COND-D-06**         | ≤4h / fail-closed ceiling             | **FROZEN**                 | **FROZEN / BINDING**                     |
| **COND-D-06**         | Heartbeat cadence                     | **DEFERRED**               | Implementation Planning decision         |
| **OQ-D-02**           | Runner shape                          | **DEFERRED**               | Implementation Planning decision         |
| **OQ-D-06**           | Updated+blocked durable audit         | **RATIFIED**               | **FROZEN / BINDING**                     |
| **OQ-D-06**           | Inventory-only per-row vs summary     | **DEFERRED**               | Implementation Planning decision         |
| **OQ-D-08**           | D→E handoff format                    | **DEFERRED**               | Deferred to E                            |

```text
NO SILENT CLOSURE OF DEFERRED / UNRESOLVED ITEMS BY THIS SLICE APPROVAL
```

---

## 12. Implementation-Planning Prerequisites

| #   | Item                                                          | Classification                                                     |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | A preflight delivery status (COND-D-01 delivery)              | **Prerequisite**                                                   |
| 2   | NB-01 audit event type (COND-D-02)                            | **Implementation-planning decision**                               |
| 3   | Privileged actor identity mapping (COND-D-03)                 | **Prerequisite**                                                   |
| 4   | Exact FOR UPDATE / lock API (COND-D-04)                       | **Implementation-planning decision**                               |
| 5   | Vault numeric threshold if automation requires it (COND-D-05) | **Implementation-planning decision** (or justify qualitative-only) |
| 6   | Heartbeat/TTL cadence under ≤4h (COND-D-06)                   | **Implementation-planning decision**                               |
| 7   | Runner shape (OQ-D-02)                                        | **Implementation-planning decision**                               |
| 8   | Audit inventory-vs-summary remainder (OQ-D-06)                | **Implementation-planning decision**                               |
| 9   | D→E handoff format (OQ-D-08)                                  | **Deferred to E**                                                  |
| 10  | PAC-D-01…10                                                   | **Informational** (proposed; not binding)                          |
| 11  | C-B06-02 / D-B03 residuals                                    | **Informational** (preserved; not D blockers)                      |

```text
Implementation Planning MUST dispose prerequisites #1 and #3
(and bind deferred decisions #2, #4–#8) before Implementation Authorization.
Untracked local A preflight WIP must NOT be treated as origin/main SoT.
```

---

## 13. Risks

| ID     | Risk                                | Treatment under this approval                   |
| ------ | ----------------------------------- | ----------------------------------------------- |
| R-D-01 | Public env API creep                | AC-D-07 / C-02 binding                          |
| R-D-02 | Check-then-save without CAS         | CAS binding                                     |
| R-D-03 | Stale C as write authority          | Re-invoke binding                               |
| R-D-04 | Ungated script                      | B-04 mandatory                                  |
| R-D-05 | Dual A preflight paths              | COND-D-01 prerequisite carried                  |
| R-D-06 | Silent residual closure             | Residuals preserved                             |
| R-D-07 | Infer impl auth from Slice Approval | Explicit non-authorization below                |
| R-D-08 | NB-01 delay                         | Deferred to Impl Planning with substance frozen |

No artificial blockers invented.

---

## 14. Expected Implementation Surface

**Architectural identification only — not file creation, not detailed prescription:**

| Surface                    | Role                                                                       | Notes                              |
| -------------------------- | -------------------------------------------------------------------------- | ---------------------------------- |
| Reuse B-04                 | `Conn04MigrationBoundaryService`                                           | Start/refuse + write proof         |
| Reuse C                    | Live classifier API                                                        | Write-time eligibility             |
| Reuse A pure helpers       | Report/counters builders on main                                           | Preflight evidence composition     |
| Reuse CAS / txn            | Durable authority + Prisma transaction context                             | Same-txn write                     |
| Reuse Strategy B           | Existing unique index + occupancy reads                                    | Collision backstop                 |
| Reuse Security Audit infra | Catalog + service + attribution                                            | Register outcomes after NB-01 bind |
| New D orchestrator/runner  | Privileged internal composition                                            | Shape = OQ-D-02 (deferred)         |
| Per-row write unit         | CAS → reclassify → conditional UPDATE → audit                              | Exact lock API deferred            |
| Tests                      | Predicate / race / audit / refuse-without-gate; preserve A/B/C regressions | Later gate                         |

Do **not** invent new public ConnectionsController env endpoints.  
Do **not** prescribe deferred API/cadence/event-type details here.

---

## 15. Verification Strategy

Later implementation gates must prove (at minimum):

| Theme                                                | Maps to                |
| ---------------------------------------------------- | ---------------------- |
| Conditional UPDATE predicates + no populated rewrite | AC-D-01/03             |
| `vaultSecretId` unchanged; zero Vault mutation       | AC-D-02/06             |
| Durable audit updated + blocked (substance)          | AC-D-04                |
| Batch continue; P2002 skip                           | AC-D-05; D-CONN-04-05  |
| No public env mutation API                           | AC-D-07                |
| B-04 refuse without lease; same-txn CAS              | COND-ARCH-B04 / B-04   |
| C re-invoke; Connected; workspace isolation          | IPR-C-01; D-CONN-04-01 |
| Idempotent rerun                                     | Slice §16              |
| Preserve A/B/C regression suites                     | Existing walls         |

Tests must not perform venue I/O, FIV, or live capital paths.

---

## 16. Explicit Non-Authorization Statement

```text
════════════════════════════════════════════════════════
SLICE APPROVAL = APPROVED FOR IMPLEMENTATION PLANNING
════════════════════════════════════════════════════════

D IMPLEMENTATION NOT STARTED
D IMPLEMENTATION AUTHORIZATION NOT GRANTED

This Slice Approval does NOT:
  - authorize implementation coding or tests
  - authorize Implementation Kickoff
  - create or complete Implementation Planning
  - resolve COND-D-01 delivery / COND-D-03 ops mapping by assumption
  - bind NB-01 event type
  - deliver A preflight synchronization
  - authorize Prisma/schema/Vault/API changes
  - authorize FIV / C7 / live capital / venue I/O
  - close FIV-CONN-04 or FIV-PRE-01
  - reopen FIV-CONN-04-C
  - close or remediate C-B06-02 / D-B03-04 / D-B03-06 / D-B03-08
```

---

## Final State

```text
FIV-CONN-04-D = SLICE APPROVED FOR IMPLEMENTATION PLANNING
D SCOPE = Conditional NULL→live UPDATE + durable audit under B+C
AC-D-01…07 = FROZEN / BINDING (parent SLICE-APPROVED-AC)
PAC-D-01…10 = PROPOSED / NOT BINDING
DEFERRED / UNRESOLVED = CARRIED FORWARD (unchanged)
NEXT GATE = FIV-CONN-04-D IMPLEMENTATION PLANNING
```

**END OF FIV-CONN-04-D SLICE APPROVAL**
