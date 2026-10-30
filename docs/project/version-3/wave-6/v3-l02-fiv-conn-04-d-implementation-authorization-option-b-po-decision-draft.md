# FIV-CONN-04-D — Product Owner Implementation Authorization Decision Act (Option B)

## DRAFT — PENDING FINAL PRODUCT OWNER REVIEW

**Document:** Draft Product Owner decision act for bounded Stage 2 + Stage 3 Implementation Authorization (Option B)  
**Date (drafting):** 2026-10-30 _(from task/repository context; final decision date pending PO confirmation in §12)_  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Authority:** Product Owner (sole Project Owner)  
**Status:** **DRAFT — PENDING FINAL PRODUCT OWNER REVIEW**  
**Nature:** **DRAFT GOVERNANCE ARTIFACT ONLY.** Records the Product Owner’s explicitly communicated selection of Option B and related clarifications for final review. Does **not** itself make authorization effective. Does **not** authorize Stage 2 or Stage 3 coding while remaining a draft. Does **not** modify the Decision Register. Does **not** implement code or tests. Does **not** stage, commit, or push.

```text
STATUS: DRAFT — PENDING FINAL PRODUCT OWNER REVIEW
OPTION SELECTED (PENDING FINAL RECORDING): B — BOUNDED STAGE 2 + STAGE 3
AUTHORIZATION EFFECTIVE: NO — DRAFT ONLY
STAGE 2 CODING: NOT AUTHORIZED BY THIS DRAFT
STAGE 3 CODING: NOT AUTHORIZED BY THIS DRAFT
STAGES 4–8: NOT AUTHORIZED
VAULT METADATA PORT: NOT AUTHORIZED
CONNECTION.ENVIRONMENT UPDATE: NOT AUTHORIZED
FIV-CONN-04-E / PRODUCTION / LIVE CAPITAL: NOT AUTHORIZED
DECISION REGISTER: UNCHANGED
```

---

## 1. Decision identification

| Field                           | Value                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Project**                     | FIV-CONN-04-D                                                                                                                                    |
| **Wave**                        | 6 — Live Trading                                                                                                                                 |
| **Decision authority**          | Product Owner (sole Project Owner)                                                                                                               |
| **Decision**                    | **Option B — bounded Stage 2 + Stage 3 Implementation Authorization**                                                                            |
| **Drafting date**               | 2026-10-30                                                                                                                                       |
| **Final decision date**         | _Pending PO confirmation (§12)_                                                                                                                  |
| **Status**                      | **DRAFT — PENDING FINAL PRODUCT OWNER REVIEW**                                                                                                   |
| **Candidate Decision / Act ID** | `D-CONN04-FULL-D-IA-S23-B` — **PROPOSED ONLY; PENDING PO CONFIRMATION** (follows `D-CONN04-*` register convention; not assigned until final act) |

### 1.1 Request package and matrix (hash-bound)

| Artifact                | Path                                                                                                   | SHA-256                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Primary request package | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization-request-stage-2-3.md` | `cd2e96d841245bbcaaa43716f75c125e7c657f9c94e82e916d2c5cee641a0787` |
| Supporting scope matrix | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-2-3-authorization-scope-matrix.md`           | `0372062dcdd5d6d5e6ddbd1c529957e370c78126f500d6793a1566efcb1fab02` |

### 1.2 Controlling baseline (verified at drafting)

| Artifact                                    | Path                                                                                                                                   | SHA-256                                                            |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Full-D IA                                   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization.md`                                                   | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` |
| Successor-01 IA Amendment                   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-final-candidate-successor-01.md` | `4eb2fb970954687fa5eeec67a5243b59fc1ee48ed55554811e48f00cc042f071` |
| Successor-01 approval / re-ratification     | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-successor-01-approval-and-ratification.md`                 | `ab6a8ef3dcfc153b2e3acdc0f904e7b4d96f409b4a063027c6a90b4a1df07cfe` |
| Clarification Act                           | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-ko-cond-01-po-clarification-act.md`                                                | `ebad7c8ae82696d763139d65b187fc3cdb3ed44e11152fa6287596d8ef1460c1` |
| KO-COND-01 Formal Closure                   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-ko-cond-01-formal-closure-act.md`                                                  | `0cf6d9e3212a6c295d3f435bc5f365f64462c0bd771bc2a6da55266f049b9086` |
| Alignment-to-Port independent review        | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-1-vault-entry-alignment-to-port-independent-review.md`                       | `23f02d8d6786c15a3662bfa7f82e9b3c0e1317b83755687d86433abcacfb2de2` |
| Post-KO-COND-01 readiness assessment        | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-post-ko-cond-01-implementation-readiness-assessment.md`                            | `e12dc0ef03764d44566473d0d2b58957103ec5e34efcd784d3bc78331490a6ca` |
| Decision Register (reference; not modified) | `docs/project/version-3/wave-6/wave-6-po-decision-register.md`                                                                         | `a98e1eded40c6ba98068f209c57cafbdffb8dd6dc7c7902e767c67dbe35940e9` |

**Integrity at drafting:** All mandatory sources listed above **MATCH** expected hashes. No silent substitution.

---

## 2. PO decision and authorization effect

### 2.1 Selection recorded

The Product Owner has explicitly communicated selection of:

**Option B — Approve bounded Stage 2 and Stage 3**

as defined in the primary request package §11 Option B and supporting matrix, subject to the clarifications in §§4–6 of this draft (OQ-1 write-unit limitation; OQ-2 attribution detailing; OQ-3 mandatory Independent Reviewer PASS after Stage 2).

### 2.2 Draft vs effective authorization

| Statement                                                                                                                                                 | Binding for this draft                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| The Product Owner has selected Option B and the stated conditions for final recording                                                                     | **Yes — recorded as communicated intent** |
| This document is a draft pending final Product Owner review                                                                                               | **Yes**                                   |
| Implementation may begin on the basis of this draft                                                                                                       | **No**                                    |
| Authorization becomes effective only after a final PO decision act is approved and formally recorded (including Decision Register sync as the PO directs) | **Yes**                                   |

```text
THIS DRAFT DOES NOT AUTHORIZE CODING.
WAIT FOR FINAL PRODUCT OWNER APPROVAL AND FORMAL RECORDING.
```

### 2.3 Relationship to prior grants

- Full-D IA (`D-CONN04-FULL-D-IA`) remains **GRANTED WITH AMENDMENTS** (scope authority).
- Successor-01 remains **APPROVED AND RATIFIED** (S1–S4).
- This Option B act, when finalized, is the **separate implementation authorization** required by Clarification Act Q5 (`D-CONN04-KO-COND-01-CLAR` §9) and Formal Closure Act §§7–8 / §11 for the **narrow Stage 2–3 execution scope** only — not a re-grant of Stages 4–8, Vault port, backfill execution, E, or production.

---

## 3. Authorized Stage 2 scope

**Controlling definitions:** Full-D IA §8 Stage 2; Full-D IA §7.2 inventory; COND-IA-04; Successor-01 §5 (catalog remains under approved IA §7.2); request package §5.1; matrix §§2.1, 3 (IDs S2-01…S2-07), §5 (T-S2-*).

### 3.1 Permitted Stage 2 work (when final act is effective)

1. Register exactly `connection.environment-backfill` (character-for-character) in Security Audit classification (`S2-01`).
2. Add the corresponding attribution rule for that type within parent Slice Planning Package §13 audit floor and COND-IA-04 (`S2-02`).
3. Create Connections-local audit helper `connection-environment-backfill-audit.ts` — sanitize + txn-capable `SecurityAuditService.record`, mirroring `connection-migration-gate-audit.ts` (`S2-03`); REUSE `security-audit.service.ts` (`S2-04`).
4. Deliver Stage 2 tests: classification admit; refuse unknown; attribution; service refuse/admit; helper sanitize/txn (`S2-05`, `S2-06`; matrix T-S2-01…T-S2-07).
5. Narrow `connections.module.ts` provider registration **only if** the helper is Nest-injected; **preserve** existing export walls — no export of B-04 / PORT / durable / Entry / Vault port (`S2-07`).

### 3.2 Explicit Stage 2 exclusions

- Additional / second event types.
- Prisma `actorKind`.
- Outbox or pending-audit architecture.
- Operational Full-D backfill emission / `runEnvironmentBackfill` loop.
- Stages 4–8 behavior.
- Dedicated Vault metadata port (Successor-01 §10).
- `Connection.environment` UPDATE.
- Production activation / live capital / FIV-CONN-04-E.

**Coordination rule (COND-IA-04):** Catalog + attribution + helper + tests land in the same delivery window; **emission must not precede registration**.

---

## 4. Authorized Stage 3 scope

**Controlling definitions:** Full-D IA §8 Stage 3; Full-D IA §7.1 write-unit / Entry / B-04 rows; request package §5.2; matrix §§2.2, 3 (IDs S3-01…S3-06), §5 (T-S3-*).

### 4.1 OQ-1 — Product Owner disposition

**APPROVED WITH LIMITATION — write-unit authority / CAS scaffolding only.**

### 4.2 Permitted Stage 3 work (when final act is effective **and** §5 Independent Reviewer PASS is recorded)

1. **REUSE** existing P-D-02 Entry and canonical SYSTEM_JOB identity (`S3-01` narrow / `S3-02` NO CHANGE expected).
2. Entry→B-04 lease lifecycle wiring as defined by Full-D IA Stage 3 (start / HB / release with canonical actor) (`S3-01`, `S3-03`).
3. **CREATE** a narrowly bounded write-unit component at the proposed path `fiv-conn-04-d-environment-backfill-write.ts` (`S3-04`) **solely** for authority/CAS scaffolding.
4. Invoke `assertWriteAuthority(txn, grant)` inside the required transaction boundary; CAS callable; fail-closed on authority/CAS miss (`S3-04`, `S3-05`; Full-D IA §8 Stage 3 exit / tests).
5. Required Stage 3 tests and module export-wall checks (`S3-05`, `S3-06`; matrix T-S3-01…T-S3-03).
6. Narrow module registration of the write-unit **if** Nest-injected; **no** reclaim redesign; **no** privileged export-wall breach (Full-D IA §8 Stage 3 Stop).

### 4.3 Write-unit must NOT (hard limits)

The write-unit **may be created**, but **must not**:

- Execute `Connection.environment` UPDATE;
- Implement conditional NULL→`live` UPDATE (Full-D IA §8 Stage 5 — **outside this act**);
- Implement freshness checks or the dedicated Vault metadata port (Stage 4 / Successor-01 §10);
- Implement the Full-D backfill loop / `runEnvironmentBackfill` orchestration;
- Emit operational backfill audit events as a batch operation;
- Redesign reclaim behavior;
- Introduce a second SYSTEM_JOB constructor;
- Introduce public HTTP, DTO, or `PrivilegedActorContext` ingress.

**Explicit:** Stage 5 UPDATE authorization remains **outside** this act and requires a separate future Product Owner decision.

---

## 5. Mandatory sequencing and Independent Review gate

### 5.1 OQ-3 — Product Owner disposition

**Independent Reviewer written PASS after Stage 2 is a MANDATORY ENTRY GATE for Stage 3.**

This is a **PO-imposed condition for this authorization**. It is **not** a claim that the original Full-D IA already made Independent Review between Stage 2 and Stage 3 mandatory.

### 5.2 Required sequence

1. Stage 2 implementation (after final act is effective).
2. Stage 2 tests and acceptance evidence (matrix §5 Stage 2; Full-D IA §8 Stage 2 exit).
3. Independent Reviewer performs a **written** review against the approved Stage 2 inventory, constraints, and acceptance criteria (request package / matrix Stage 2 scope; Full-D IA §7.2 / §8 Stage 2; COND-IA-04).
4. Reviewer issues an explicit written **`PASS`**.
5. **Only then** may Stage 3 implementation begin.

### 5.3 If review is FAIL, BLOCKED, or has material unresolved findings

- Stage 3 **must not** begin.
- Engineering must address findings or **STOP** and escalate to the Product Owner.
- No implicit acceptance, Engineering self-certification, or undocumented verbal PASS may replace the written `PASS`.

### 5.4 Parallelism rule under this authorization

Full-D IA §8 Stage 3 historically permits parallel Stage 3 with Stage 2 **only if no emission yet**.

**For this Option B authorization, the Product Owner’s stricter sequence supersedes that parallel option:**

```text
STAGE 2 → STAGE 2 EVIDENCE → INDEPENDENT REVIEWER WRITTEN PASS → STAGE 3
```

Parallel Stage 3 coding **before** the written Stage 2 `PASS` is **not authorized** under this act.

---

## 6. Attribution detailing (OQ-2)

**Product Owner disposition:**

- Exact attribution field wiring remains **Engineering-delegated detail**.
- Engineering **must** remain within the parent Slice Planning Package §13 audit floor and COND-IA-04.
- **No** additional PO naming freeze is introduced by this act.
- Any proposed change to approved attribution **semantics** or expansion **beyond** the §13 floor requires **STOP** and Product Owner escalation.

**Do not invent** attribution field names or values in this act. Full-D IA §15 already marks exact payload field wiring as **DEFERRED DETAIL**.

---

## 7. P-D-02 preservation and repository hygiene

Engineering **must**:

1. Preserve existing P-D-02 Entry and identity work.
2. Use **minimal, narrowly scoped** diffs.
3. Preserve existing module export walls.
4. Avoid broad formatting, cleanup, wholesale replacement, or unrelated refactoring.
5. Avoid modifying the canonical identity factory unless a separately approved scope change is made (`S3-02` = REUSE / NO CHANGE expected).
6. Identify and report any collision with pre-existing dirty/untracked files **before** changing an overlapping file.

**Acknowledged overlap risks (matrix §7):**

| Path                                                       | Risk                                               |
| ---------------------------------------------------------- | -------------------------------------------------- |
| `apps/api/src/modules/connections/connections.module.ts`   | Already modified (P-D-02 baseline) — S2-07 / S3-06 |
| `fiv-conn-04-d-system-job-migration-entry.ts` / `.spec.ts` | Untracked P-D-02 — S3-01 / S3-05                   |
| `fiv-conn-04-d-system-job-identity.ts` / `.spec.ts`        | Untracked P-D-02 — REUSE only                      |
| `conn04-migration-boundary.service.spec.ts`                | Modified — regression REUSE                        |

---

## 8. Tests and acceptance evidence

**Nature:** Requirements for **authorized implementation**. This draft does **not** claim any tests have passed. Actual test execution and results are required during authorized implementation after the final act is effective.

### 8.1 Stage 2 — mandatory tests / acceptance (matrix §5)

| Class           | IDs (examples)                    | Requirement                                                                                                                         |
| --------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **MANDATORY**   | T-S2-01…T-S2-05, T-S2-07, T-S2-08 | Exact type admit; refuse unknowns; admit path; attribution; helper sanitize refuse; no second type; no emission-before-registration |
| **ACCEPTANCE**  | T-S2-06                           | Helper txn overload reachable                                                                                                       |
| **RECOMMENDED** | T-REC-01                          | Dirty-tree hygiene note in impl evidence                                                                                            |

**Stage 2 exit (Full-D IA §8 Stage 2):** Classified emission capability exists; prior refuse tests still pass for unknowns; catalog/attribution not desynced.

### 8.2 Stage 3 — mandatory tests / exit evidence (matrix §5 + Full-D IA §8 Stage 3)

| Class           | IDs (examples)                            | Requirement                                                                                                                                                                                                      |
| --------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MANDATORY**   | T-S3-01…T-S3-03, T-S3-05…T-S3-09, T-S3-11 | Entry→B-04 canonical actor; CAS/`assertWriteAuthority` fail-closed; export walls; no second constructor; no public ingress; A Preflight / P-D-02 regressions; no ACL redesign; IA-REV-03 not “solved” via outbox |
| **ACCEPTANCE**  | T-S3-04, T-S3-10                          | **No** `Connection.environment` UPDATE path enabled; Nest DI not claimed as AuthZ proof                                                                                                                          |
| **RECOMMENDED** | T-REC-01                                  | Hygiene evidence                                                                                                                                                                                                 |

**Stage 3 exit evidence must include:**

1. Entry acquires/releases with canonical actor.
2. `assertWriteAuthority` / CAS is callable within the transaction.
3. CAS miss and authority failure are fail-closed.
4. No privileged export-wall breach.
5. No `Connection.environment` UPDATE path is enabled.
6. Required regressions pass.

**Not yet applicable under this act:** Successor-01 §11 metadata-port suite; Stage 4 freshness; Stage 5–6 UPDATE + same-txn audit full path (matrix T-EX-01…T-EX-03).

---

## 9. Explicit exclusions and continuing restrictions

This Option B authorization (when finalized) **excludes**:

- Stages 4–8.
- Dedicated Vault metadata port and Successor-01 §10 implementation inventory.
- Full-D backfill execution.
- `Connection.environment` UPDATE.
- FIV-CONN-04-E.
- Production activation.
- Live-capital activity.
- Cron / scheduler invocation.
- Public HTTP / API / DTO ingress.
- Second SYSTEM_JOB constructor.
- Vault ACL redesign, authorization bypass, or membership fabrication.
- Outbox / pending-audit / Prisma `actorKind`.
- Any claim that IA-REV-03 has been solved.
- Unrelated P-D-02 rewrite or cleanup.

**Successor-01 / Clarification Q1 boundaries remain binding** (S1–S4; no second constructor; no public ingress; A Preflight informational + valid `list` preserved; educational Nest DI ≠ AuthN/AuthZ proof; fail-closed / STOP).

Stages 4–8 require **separate gates and explicit future Product Owner authorization**.

---

## 10. STOP and escalation rules

Immediate **STOP** and escalation to the Product Owner if:

1. Approved inventory is insufficient to implement a requirement safely.
2. Implementation would require a new privileged identity constructor.
3. Public ingress or a new authorization bypass is proposed.
4. Vault ACL or membership redesign is needed.
5. A second D freshness path is proposed.
6. Stage 3 would need to execute an environment UPDATE.
7. Stage 2 classification and attribution cannot remain consistent.
8. P-D-02 dirty/untracked changes cannot be safely isolated.
9. Any scope expansion is necessary.
10. Stage 2 Independent Review returns FAIL / BLOCKED / material unresolved findings and Stage 3 is attempted anyway.
11. Emission precedes catalog registration.

**Only the Product Owner** may approve scope changes.

---

## 11. Governance and authorization status

| Item                                            | Status under this draft                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Full-D IA (`D-CONN04-FULL-D-IA`)                | **GRANTED WITH AMENDMENTS** (unchanged)                                                    |
| Successor-01 (`D-CONN04-PO-VAULT-B-IA-AMD-S01`) | **APPROVED AND RATIFIED** (unchanged)                                                      |
| KO-COND-01                                      | **CLOSED / SATISFIED** (unchanged)                                                         |
| KO-COND-02                                      | **SATISFIED** (unchanged)                                                                  |
| Kickoff (`D-CONN04-FULL-D-KO`)                  | **COMPLETED — PASS WITH CONDITIONS** (unchanged)                                           |
| This Option B act                               | **DRAFT — NOT EFFECTIVE**                                                                  |
| Decision Register                               | **UNCHANGED** by this draft                                                                |
| Stage 2 coding                                  | **Must not begin** until final act approved and recorded                                   |
| Stage 3 coding                                  | **Additionally blocked** until mandatory Independent Reviewer written `PASS` after Stage 2 |

```text
DRAFT ONLY — NOT AN EFFECTIVE AUTHORIZATION
DECISION REGISTER: NOT MODIFIED
NO STAGE 2 / STAGE 3 CODING ON THE BASIS OF THIS DRAFT
```

---

## 12. Product Owner final review / signature block

_Do not fill unknown approval details. Complete only at final Product Owner review._

| Field                                         | Value                                                         |
| --------------------------------------------- | ------------------------------------------------------------- |
| **Final decision**                            | ☐ APPROVE  ☐ REJECT  ☐ RETURN FOR AMENDMENT                   |
| **Final decision date**                       | ________________                                              |
| **Confirmed Decision / Act ID**               | ________________ _(candidate was `D-CONN04-FULL-D-IA-S23-B`)_ |
| **Product Owner approval / signature record** | ________________                                              |
| **Effective date / time**                     | ________________                                              |
| **Notes or amendments**                       | ________________                                              |

### 12.1 Post-approval recording (after APPROVE only — not this draft)

1. Finalize this act (or successor final artifact) with confirmed ID and effective time.
2. Synchronize Decision Register CURRENT STATE / STOP as the Product Owner directs.
3. Only then may Stage 2 coding begin under §§3, 7–10.
4. Stage 3 remains gated by §5 Independent Reviewer written `PASS`.

---

## 13. Explicit non-effectiveness banner

```text
DRAFT — PENDING FINAL PRODUCT OWNER REVIEW
OPTION B INTENT RECORDED FOR FINAL REVIEW
AUTHORIZATION EFFECTIVE: NO
STAGE 2: NOT AUTHORIZED BY THIS DRAFT
STAGE 3: NOT AUTHORIZED BY THIS DRAFT
MANDATORY AFTER FINAL APPROVAL:
  STAGE 2 → EVIDENCE → INDEPENDENT REVIEWER WRITTEN PASS → STAGE 3
STAGE 3 WRITE-UNIT: AUTHORITY/CAS SCAFFOLDING ONLY — NO ENVIRONMENT UPDATE
STAGES 4–8 / VAULT PORT / BACKFILL EXECUTION / E / PRODUCTION / LIVE CAPITAL: NOT AUTHORIZED
DECISION REGISTER: UNCHANGED
NO IMPLEMENTATION / NO TESTS CLAIMED PASSED
```

---

## 14. Repository baseline at drafting

| Field        | Value                                      |
| ------------ | ------------------------------------------ |
| Branch       | `main`                                     |
| HEAD         | `953292675e197d4f25778aaaa59eacb2826560fe` |
| Created      | This draft artifact only                   |
| Working tree | Pre-existing dirty/untracked **preserved** |

---

_End of DRAFT Option B Product Owner Implementation Authorization Decision Act._
