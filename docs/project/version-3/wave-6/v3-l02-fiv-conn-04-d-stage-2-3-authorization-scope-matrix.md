# FIV-CONN-04-D — Stage 2–3 Authorization Scope and Evidence Matrix

**Document:** Supporting detailed matrix for the Stage 2–3 Implementation Authorization Request Package  
**Date:** 2026-10-30  
**Primary package:** [`v3-l02-fiv-conn-04-d-implementation-authorization-request-stage-2-3.md`](./v3-l02-fiv-conn-04-d-implementation-authorization-request-stage-2-3.md)  
**Nature:** **DOCUMENTATION ONLY — SUPPORTING EVIDENCE.** Does **not** grant authorization. Does **not** modify Decision Register, source, or tests. Must agree with the primary package.

```text
SUPPORTING MATRIX FOR STAGE 2–3 IA REQUEST
AUTHORIZATION: NOT GRANTED BY THIS DOCUMENT
MUST REMAIN CONSISTENT WITH PRIMARY PACKAGE
```

---

## 1. Binding source fingerprints (reconfirmed)

| Source               | SHA-256                                                            | Role                                                                                         |
| -------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Full-D IA            | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` | Stage definitions §8; inventory §7; COND-IA-04; tests §13                                    |
| Successor-01         | `4eb2fb970954687fa5eeec67a5243b59fc1ee48ed55554811e48f00cc042f071` | S1–S4; §5 Stage 2 catalog unchanged; §10 port inventory excluded here; §13 exclusions        |
| S01 approval         | `ab6a8ef3dcfc153b2e3acdc0f904e7b4d96f409b4a063027c6a90b4a1df07cfe` | Amendment ratified; IA execution still NOT GRANTED by that act                               |
| Kickoff Completion   | `f197c2944e1e4b37b005ecd72a30fda6fc5ecbb2d821de68af921eacb1e1fe50` | Historical Stage 2 may-proceed / Stage 3 no-UPDATE-before-KO-COND-01 (KO-COND-01 now closed) |
| Clarification Act    | `ebad7c8ae82696d763139d65b187fc3cdb3ed44e11152fa6287596d8ef1460c1` | Q1–Q5; separate IA required                                                                  |
| Alignment-to-Port    | `0f6c9ae61cbf9d55bced3eda59f4e88ab2a392b6578dd688c9ec56c27ea38a5b` | Design evidence; not Stage 2–3 code                                                          |
| Alignment IR         | `23f02d8d6786c15a3662bfa7f82e9b3c0e1317b83755687d86433abcacfb2de2` | PASS; not IA                                                                                 |
| Formal Closure       | `0cf6d9e3212a6c295d3f435bc5f365f64462c0bd771bc2a6da55266f049b9086` | KO-COND-01 CLOSED; separate IA mandatory                                                     |
| Decision Register    | `a98e1eded40c6ba98068f209c57cafbdffb8dd6dc7c7902e767c67dbe35940e9` | Current index                                                                                |
| Readiness Assessment | `e12dc0ef03764d44566473d0d2b58957103ec5e34efcd784d3bc78331490a6ca` | Ready for IA **review**; not a grant                                                         |

Parent audit floor (referenced by Full-D IA COND-IA-04 / COND-DOC-01): `v3-l02-fiv-conn-04-slice-planning-package.md` **§13 — Audit Model**.

---

## 2. Stage definitions extracted from controlling sources

### 2.1 Stage 2 — Security Audit catalog + attribution

| Field                              | Exact source content                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Source**                         | Full-D IA §8 Stage 2; Kickoff §5 Stage 2; inventory §7.2                                                                             |
| **Preconditions**                  | Stage 1 (design freeze / Alignment-to-Port documentation gate now closed via KO-COND-01)                                             |
| **Work**                           | Register type + attribution; refuse-closed until done                                                                                |
| **Excluded**                       | Second event type; Prisma `actorKind`; outbox                                                                                        |
| **Exit**                           | Classified emission possible; prior refuse tests still pass for unknowns                                                             |
| **Tests**                          | Classification / attribution / service refuse + admit                                                                                |
| **Stop**                           | Catalog/attribution desync                                                                                                           |
| **Event type**                     | `connection.environment-backfill` (character-for-character) — COND-IA-04 / PD03-NB01                                                 |
| **Coordination**                   | Catalog + attribution + D audit helper + tests in same delivery window; **emission must not precede registration** (COND-IA-04)      |
| **Vault metadata port dependency** | **None.** Successor-01 §5: catalog code delivery remains Full-D Stage 2 under approved IA §7.2 — **not** expanded by Vault amendment |
| **P-D-02 dependency**              | Attribution uses canonical SYSTEM_JOB `actorId` on SYSTEM_JOB path (COND-IA-04); identity factory REUSE                              |

### 2.2 Stage 3 — Lease acquisition and write-authority setup

| Field                              | Exact source content                                                                                                                                                                                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**                         | Full-D IA §8 Stage 3; Kickoff §5 Stage 3                                                                                                                                                                                                                       |
| **Preconditions**                  | Stage 2 (**or parallel only if no emission yet**)                                                                                                                                                                                                              |
| **Work**                           | Wire Entry→B-04 start/HB/release; `assertWriteAuthority` in write unit                                                                                                                                                                                         |
| **Excluded**                       | Reclaim redesign                                                                                                                                                                                                                                               |
| **Exit**                           | Entry acquires/releases with canonical actor; CAS callable in txn                                                                                                                                                                                              |
| **Tests**                          | Entry→B-04; CAS miss                                                                                                                                                                                                                                           |
| **Stop**                           | Export of B-04 / PORT / durable                                                                                                                                                                                                                                |
| **Not Stage 3**                    | Stage 4 freshness; Stage 5 conditional UPDATE; Stage 6 per-row durable audit emission on UPDATE path                                                                                                                                                           |
| **P-D-02 relationship**            | Entry already provides start/resume/HB/release (lease-only). Stage 3 **reuses** and may narrowly extend for write-authority scaffolding                                                                                                                        |
| **Vault metadata port dependency** | **None** for Stage 3 objective as stated                                                                                                                                                                                                                       |
| **UPDATE boundary**                | Kickoff Completion historically forbade enabling UPDATE before KO-COND-01; KO-COND-01 is now closed, but Stage 5 remains a **separate** stage and is **not** requested here. This matrix proposes Stage 3 **must not** perform `Connection.environment` UPDATE |

### 2.3 Parallelization rule

Full-D IA §8: “Stage 2 may proceed early but **must not** emit before registration. Stages 4–8 are sequential per row.”  
Stage 3 may run parallel to Stage 2 **only if no emission yet**.

**Primary package recommendation:** Stage 2 → Stage 3 sequential; parallel only after registration with no-emission discipline.

---

## 3. Detailed inventory table

| ID    | Stage | Proposed file/module/component                                                                                                         | Purpose                                                               | Change type                                                            | Source authority                      | Dependencies                                        | Explicit exclusions                                                               |
| ----- | ----- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| S2-01 | 2     | `apps/api/src/modules/security-audit/security-audit-classification.ts`                                                                 | Admit `connection.environment-backfill`                               | **MODIFY** (existing file)                                             | Full-D IA §7.2                        | Security Audit module                               | Second event type; unrelated classification churn                                 |
| S2-02 | 2     | `apps/api/src/modules/security-audit/security-audit-attribution.ts`                                                                    | Attribution rule for type                                             | **MODIFY** (existing file)                                             | Full-D IA §7.2; COND-IA-04            | Classification admission                            | Inventing fields outside parent §13 floor                                         |
| S2-03 | 2     | `apps/api/src/modules/connections/connection-environment-backfill-audit.ts`                                                            | Sanitize + `record` helper (txn-capable); mirror migration-gate audit | **CREATE** (path grounded in Full-D IA §7.2; **does not exist today**) | Full-D IA §7.2 / COND-IA-04/05        | `SecurityAuditService`; P-D-02 actorId string input | Helper constructing `PrivilegedActorContext`; secrets in payload                  |
| S2-04 | 2     | `apps/api/src/modules/security-audit/security-audit.service.ts`                                                                        | `record(..., transaction?)`                                           | **REUSE**                                                              | Full-D IA §7.2                        | Existing txn architecture                           | Outbox / pending-audit invention                                                  |
| S2-05 | 2     | `security-audit.service.spec.ts`; `security-audit-attribution.spec.ts` (and classification refuse coverage as existing suites provide) | Admit + refuse regressions                                            | **MODIFY** / extend                                                    | Full-D IA §7.5 / §8 Stage 2           | S2-01/S2-02                                         | Claiming Full-D backfill loop tests                                               |
| S2-06 | 2     | `apps/api/src/modules/connections/connection-environment-backfill-audit.spec.ts`                                                       | Helper sanitize/attribution/txn/type string                           | **CREATE** (proposed path per Full-D IA §7.5)                          | Full-D IA §7.5                        | S2-03                                               | Runtime production emission                                                       |
| S2-07 | 2     | `apps/api/src/modules/connections/connections.module.ts`                                                                               | Register audit helper **if** Nest-injected; preserve export walls     | **MODIFY** (narrow; file already dirty — P-D-02 baseline)              | Full-D IA §7.1 row for module         | S2-03                                               | Export B-04/PORT/durable/Entry/Vault port; broad reformat                         |
| S3-01 | 3     | `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts`                                                         | Lease Entry→B-04 wiring; attach write-authority scaffolding only      | **MODIFY** (narrow) / **REUSE** P-D-02 (**untracked** today)           | Full-D IA §8 Stage 3; COND-IA-02      | Identity factory; B-04                              | Full `runEnvironmentBackfill` orchestration; freshness; env UPDATE; public export |
| S3-02 | 3     | `apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.ts`                                                                | Canonical SYSTEM_JOB factory                                          | **REUSE** / **NO CHANGE** (**untracked** P-D-02)                       | Full-D IA §7.1; P-D-02 SAT            | —                                                   | Second factory; env/DB/request identity sources                                   |
| S3-03 | 3     | `apps/api/src/modules/connections/conn04-migration-boundary.service.ts` (+ adapters/ports as REUSE)                                    | Lease + `assertWriteAuthority`                                        | **REUSE**                                                              | Full-D IA §7.1 / §8 Stage 3           | P-D-02 / B-04 CLOSED                                | Reclaim redesign; export walls breach                                             |
| S3-04 | 3     | `apps/api/src/modules/connections/fiv-conn-04-d-environment-backfill-write.ts` (**proposed** Full-D IA §7.1 path; **absent** today)    | Write-unit **authority/CAS scaffolding only**                         | **CREATE** (bounded)                                                   | Full-D IA §7.1 + §8 Stage 3 work text | B-04 `assertWriteAuthority`; txn service            | Conditional NULL→`live` UPDATE (Stage 5); freshness; Vault port                   |
| S3-05 | 3     | Entry / write-unit specs (`fiv-conn-04-d-system-job-migration-entry.spec.ts` MODIFY; write-unit spec CREATE proposed)                  | Entry→B-04; CAS miss; no-UPDATE negatives                             | **MODIFY** / **CREATE**                                                | Full-D IA §8 Stage 3; §7.5            | S3-01/S3-04                                         | Freshness suite; UPDATE predicate suite as Stage 3 exit                           |
| S3-06 | 3     | `connections.module.ts`                                                                                                                | Register write-unit if Nest-injected; no privileged exports           | **MODIFY** (narrow; dirty baseline)                                    | Full-D IA §8 Stage 3 Stop             | S3-04                                               | Export B-04/PORT/durable/Entry                                                    |
| EX-01 | —     | Successor-01 §10 Vault metadata port/module/service/repository methods                                                                 | Dedicated D freshness                                                 | **EXCLUDED** from this request                                         | Successor-01 §10; Formal Closure      | —                                                   | Any Stage 2–3 coding of port                                                      |
| EX-02 | —     | Stages 4–8 inventory (freshness, UPDATE, per-row audit loop, summary, forward-fix)                                                     | Later Full-D                                                          | **EXCLUDED**                                                           | Full-D IA §8                          | —                                                   | Silent inclusion under Stage 2–3                                                  |
| EX-03 | —     | FIV-CONN-04-E / production / live capital / cron / HTTP                                                                                | Exclusions                                                            | **EXCLUDED**                                                           | Full-D IA §6.2; S01 §13               | —                                                   | —                                                                                 |

### 3.1 Unresolved technical detailing (not invented)

| Item                                                         | Disposition                                                                          | Who                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------ |
| Exact attribution field map within parent §13 floor          | Full-D IA §15 **DEFERRED DETAIL**                                                    | Engineering under grant (OQ-2) |
| Disposition→outcome naming within §13 taxonomy               | **DEFERRED DETAIL**                                                                  | Engineering under grant        |
| Whether write-unit is Nest provider vs module-local function | Engineering detailing under Option A Nest constraints; must remain Entry-only invoke | Engineering                    |
| Exact synonym vs `runEnvironmentBackfill`                    | **Not in Stage 2–3 scope** (later Entry expansion)                                   | Later authorization            |
| Exact symbol spellings for Vault port                        | Delegated / excluded from this request                                               | Later port authorization       |

---

## 4. Requirements → files mapping

| Requirement                           | Stage | Inventory IDs              | Notes                                 |
| ------------------------------------- | ----- | -------------------------- | ------------------------------------- |
| COND-IA-04 catalog admit              | 2     | S2-01, S2-05               | Exact type string                     |
| COND-IA-04 attribution                | 2     | S2-02, S2-05               | SYSTEM_JOB actorId on SYSTEM_JOB path |
| COND-IA-04 audit helper               | 2     | S2-03, S2-06               | Mirror migration-gate pattern         |
| Refuse-closed until registered        | 2     | S2-01, S2-04, S2-05        | Exit criterion                        |
| No emission before registration       | 2–3   | Process control            | No Full-D loop authorized to emit     |
| Entry→B-04 lease with canonical actor | 3     | S3-01, S3-02, S3-03, S3-05 | Mostly P-D-02 REUSE                   |
| `assertWriteAuthority` / CAS callable | 3     | S3-04, S3-05               | Scaffolding only                      |
| Export walls                          | 2–3   | S2-07, S3-06               | Stop if B-04/PORT/durable exported    |
| No second constructor                 | 2–3   | S3-02; helpers             | COND-IA-02/03                         |
| No public ingress                     | 2–3   | All                        | COND-IA-03                            |
| A Preflight preserved                 | 2–3   | Non-touch / regression     | Q1 #8                                 |
| No Vault port / no D `list` freshness | 2–3   | EX-01                      | S1–S4 preserved by exclusion          |
| No env UPDATE                         | 3     | S3-04 negatives            | Stage 5 excluded                      |
| IA-REV-03 not “solved”                | 2–3   | No outbox                  | S01 Decision 7                        |

---

## 5. Verification matrix (proposed — not executed)

Legend for **Class:** `MANDATORY` = explicit in controlling source; `ACCEPTANCE` = source acceptance/exit evidence; `RECOMMENDED` = hygiene / reviewer aid (not invented as hard gate unless PO adopts).

| ID       | Requirement                                         | Test/evidence type                        | Stage | Expected result                                   | When applicable                | Class                                     | Reviewer             | Controlling source                                    |
| -------- | --------------------------------------------------- | ----------------------------------------- | ----- | ------------------------------------------------- | ------------------------------ | ----------------------------------------- | -------------------- | ----------------------------------------------------- |
| T-S2-01  | Exact type string admitted                          | Classification unit test                  | 2     | `connection.environment-backfill` classified      | After S2-01                    | **MANDATORY**                             | Independent Reviewer | Full-D IA §8 Stage 2; COND-IA-04                      |
| T-S2-02  | Unknown types still refuse-closed                   | Service refuse regression                 | 2     | Unknown refused                                   | After S2-01                    | **MANDATORY**                             | Independent Reviewer | Full-D IA §8 Stage 2 exit; §7.5                       |
| T-S2-03  | Type admit path works                               | Service admit test                        | 2     | Registered type accepted                          | After S2-01                    | **MANDATORY**                             | Independent Reviewer | Full-D IA §7.5                                        |
| T-S2-04  | Attribution rule for type                           | Attribution specs                         | 2     | Rule present; SYSTEM_JOB actorId path usable      | After S2-02                    | **MANDATORY**                             | Independent Reviewer | Full-D IA §7.2; COND-IA-04                            |
| T-S2-05  | Helper sanitize refuse                              | Helper unit test                          | 2     | Bad payload refused                               | After S2-03                    | **MANDATORY**                             | Independent Reviewer | Full-D IA §7.5                                        |
| T-S2-06  | Helper txn overload                                 | Helper unit test                          | 2     | `record(..., transaction?)` reachable             | After S2-03                    | **ACCEPTANCE**                            | Independent Reviewer | Full-D IA §7.2 mirror pattern                         |
| T-S2-07  | No second event type                                | Code review / grep evidence               | 2     | Only ratified type added                          | Stage 2 exit                   | **MANDATORY**                             | Independent Reviewer | Full-D IA §8 Stage 2 excluded; COND-IA-04             |
| T-S2-08  | No emission-before-registration                     | Process + absence of Full-D loop emission | 2–3   | No operational backfill emission precedes admit   | Continuous                     | **MANDATORY**                             | Independent Reviewer | COND-IA-04 coordination                               |
| T-S3-01  | Entry→B-04 start/HB/release canonical actor         | Entry / boundary specs                    | 3     | Acquire/release with P-D-02 actor                 | Stage 3                        | **MANDATORY**                             | Independent Reviewer | Full-D IA §8 Stage 3                                  |
| T-S3-02  | CAS / `assertWriteAuthority` miss fail-closed       | Write-unit / boundary test                | 3     | Authority fail does not proceed as success        | Stage 3                        | **MANDATORY**                             | Independent Reviewer | Full-D IA §8 Stage 3 tests; §11.1 authority rows      |
| T-S3-03  | No B-04/PORT/durable export                         | Module export negative                    | 3     | Exports unchanged privileged surface              | After S3-06                    | **MANDATORY**                             | Independent Reviewer | Full-D IA §8 Stage 3 Stop; COND-IA-02 #7              |
| T-S3-04  | No `Connection.environment` UPDATE in Stage 3 paths | Negative test / code review               | 3     | No NULL→`live` UPDATE invoked                     | Stage 3 exit                   | **ACCEPTANCE** (boundary of this request) | Independent Reviewer | Full-D IA §8 Stage 5 separation; primary package §5.2 |
| T-S3-05  | No second SYSTEM_JOB constructor                    | Identity / Entry review                   | 2–3   | Only existing factory                             | Continuous                     | **MANDATORY**                             | Independent Reviewer | Clarification Q1 #5; COND-IA-02                       |
| T-S3-06  | No public HTTP/DTO/`PrivilegedActorContext` ingress | Controller absence / API review           | 2–3   | No new public D ingress                           | Continuous                     | **MANDATORY**                             | Independent Reviewer | Clarification Q1 #6; COND-IA-03                       |
| T-S3-07  | A Preflight regression green                        | Existing A specs                          | 2–3   | No behavior change                                | Stage exits                    | **MANDATORY**                             | Independent Reviewer | Clarification Q1 #8                                   |
| T-S3-08  | P-D-02 lease regression green                       | Entry / B-04 / reclaim specs              | 3     | Lease-only semantics preserved where not extended | Stage 3                        | **MANDATORY**                             | Independent Reviewer | Full-D IA §7.5 reclaim; P-D-02 SAT                    |
| T-S3-09  | No Vault ACL / membership redesign                  | Diff review                               | 2–3   | No ACL files changed for AuthZ bypass             | Continuous                     | **MANDATORY**                             | Independent Reviewer | Clarification Q1 #7; S01                              |
| T-S3-10  | Nest DI not claimed as AuthZ proof                  | Design/docs statement in impl notes       | 2–3   | No false AuthZ claim                              | Stage reports                  | **ACCEPTANCE**                            | Independent Reviewer | S01 §8; S01 approval §5.3                             |
| T-S3-11  | IA-REV-03 residual not “solved”                     | Absence of outbox/pending-audit           | 2–3   | No new crash-safe audit bus                       | Continuous                     | **MANDATORY**                             | Independent Reviewer | Full-D IA §11.2.C; S01 §9                             |
| T-EX-01  | Dedicated metadata-port correctness                 | S01 §11 suite                             | —     | N/A                                               | **Later** (port authorization) | **NOT YET APPLICABLE**                    | —                    | Successor-01 §11                                      |
| T-EX-02  | Freshness IMPL-REV-D-06                             | Freshness suite                           | 4     | N/A                                               | **Later**                      | **NOT YET APPLICABLE**                    | —                    | Full-D IA §8 Stage 4                                  |
| T-EX-03  | Conditional UPDATE / same-txn audit                 | Write-unit full suite                     | 5–6   | N/A                                               | **Later**                      | **NOT YET APPLICABLE**                    | —                    | Full-D IA §8 Stages 5–6                               |
| T-REC-01 | Dirty-tree hygiene note in impl report              | Written evidence                          | 2–3   | Minimal diffs; P-D-02 preserved                   | Stage reports                  | **RECOMMENDED**                           | Independent Reviewer | Kickoff Review KO-REV-02 lineage                      |

**Explicit:** No tests have been executed as part of preparing this matrix.

---

## 6. Entry / exit criteria detail

### 6.1 Before Stage 2 starts

| #   | Criterion                                                                           | Source                                                     | Type                              |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------- |
| 1   | Separate PO authorization covering Stage 2 recorded                                 | Clarification Q5; Formal Closure; this request Options A/B | **Mandatory**                     |
| 2   | Kickoff COMPLETED; KO-COND-01 CLOSED; KO-COND-02 SATISFIED                          | Register; Formal Closure                                   | **Mandatory**                     |
| 3   | Catalog lacks type (or Engineering confirms still needs Stage 2)                    | Full-D IA FACT; repo grep                                  | **Mandatory**                     |
| 4   | Engineering acknowledges no Stage 4–8 / no Vault port / no env UPDATE in this grant | This request                                               | **Mandatory** (request condition) |
| 5   | Independent Review of this request package before coding                            | —                                                          | **Recommended**                   |

### 6.2 Stage 2 complete

| #   | Criterion                                                | Source                             |
| --- | -------------------------------------------------------- | ---------------------------------- |
| 1   | Type admitted; attribution present                       | Full-D IA §8 Stage 2 exit          |
| 2   | Refuse unknowns still pass; admit tests pass             | Full-D IA §8 Stage 2               |
| 3   | Helper + helper specs present if in authorized inventory | COND-IA-04 coordination            |
| 4   | No second type; no actorKind; no outbox                  | Full-D IA §8 excluded              |
| 5   | No emission-before-registration incident                 | COND-IA-04                         |
| 6   | Independent Reviewer Stage 2 check                       | **Recommended** unless PO mandates |

### 6.3 Before Stage 3 starts

| #   | Criterion                                                                           | Source                             |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | Option B (or later Stage 3-only grant) recorded                                     | This request                       |
| 2   | Stage 2 exit satisfied **OR** parallel only after registration with **no emission** | Full-D IA §8 Stage 3 preconditions |
| 3   | P-D-02 Entry/identity baselines identified; minimal-diff plan                       | Overlap control                    |
| 4   | Written acknowledgment: Stage 3 does **not** authorize env UPDATE or freshness port | This request §5.2                  |

### 6.4 Stage 3 complete

| #   | Criterion                                                      | Source                    |
| --- | -------------------------------------------------------------- | ------------------------- |
| 1   | Entry acquires/releases with canonical actor                   | Full-D IA §8 Stage 3 exit |
| 2   | CAS / `assertWriteAuthority` callable in txn; miss fail-closed | Full-D IA §8 Stage 3      |
| 3   | No privileged export wall breach                               | Full-D IA §8 Stage 3 Stop |
| 4   | No env UPDATE path enabled by Stage 3                          | This request boundary     |
| 5   | No Vault metadata port introduced                              | S01 exclusion             |
| 6   | Independent Reviewer Stage 3 check                             | **Recommended**           |

### 6.5 Remains blocked after Stage 2–3

Stages 4–8; Vault metadata port; Full-D backfill execution; `Connection.environment` UPDATE; per-attempt freshness; FIV-CONN-04-E; production; live capital; cron/HTTP ingress; ACL redesign.

---

## 7. Dirty / untracked overlap risk register

| Path                                                | Git state     | Overlap with Stage 2–3?             | Control                                                                                    |
| --------------------------------------------------- | ------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `connections.module.ts`                             | **Modified**  | **Yes** (S2-07, S3-06)              | Minimal provider registration only; preserve P-D-02 export-wall comments; no broad rewrite |
| `fiv-conn-04-d-system-job-migration-entry.ts`       | **Untracked** | **Yes** (S3-01)                     | Preserve lease-only semantics; no env UPDATE; no full backfill absorb under this grant     |
| `fiv-conn-04-d-system-job-migration-entry.spec.ts`  | **Untracked** | **Yes** (S3-05)                     | Additive tests; keep P-D-02 regressions                                                    |
| `fiv-conn-04-d-system-job-identity.ts` / `.spec.ts` | **Untracked** | **REUSE only**                      | **NO CHANGE** expected                                                                     |
| `conn04-migration-boundary.service.spec.ts`         | **Modified**  | Possible regression REUSE           | Do not mix unrelated dirty intent                                                          |
| `fiv-conn-04-d-environment-backfill-write.ts`       | **Absent**    | Stage 3 CREATE if Option B          | Create only with authority-only scope                                                      |
| `connection-environment-backfill-audit.ts`          | **Absent**    | Stage 2 CREATE                      | New file only                                                                              |
| Successor-01 Vault port paths                       | **Absent**    | Must remain absent under this grant | STOP if added                                                                              |

---

## 8. Exclusions checklist (must appear in any PO approval act)

- [ ] Stages 4, 5, 6, 7, 8
- [ ] Dedicated Vault metadata port / Successor-01 §10 inventory
- [ ] `Connection.environment` UPDATE / Full-D backfill execution
- [ ] FIV-CONN-04-E
- [ ] Production activation
- [ ] Live-capital activity
- [ ] Public HTTP / API / DTO exposure
- [ ] Cron / scheduler invocation (unless later expressly authorized — **not** here)
- [ ] Second SYSTEM_JOB constructor / parallel Entry
- [ ] Vault ACL redesign / AuthZ bypass / membership fabrication
- [ ] Outbox / pending-audit / Prisma `actorKind`
- [ ] Claiming IA-REV-03 solved
- [ ] Unrelated P-D-02 rewrite / broad formatting of dirty tree
- [ ] Decision Register edit by Engineering without PO authorization act

---

## 9. Consistency statement

This matrix and the primary request package agree on:

- Option recommendation **B** with Stage 2→Stage 3 sequencing;
- Stage 3 **authority scaffolding only** (no env UPDATE);
- Vault port **excluded**;
- Separate IA still **NOT GRANTED** by these documents;
- Tests listed are **plans**, not results.

---

## 10. Provenance

| Field                        | Value                                      |
| ---------------------------- | ------------------------------------------ |
| Branch                       | `main`                                     |
| HEAD                         | `953292675e197d4f25778aaaa59eacb2826560fe` |
| Created with                 | Primary Stage 2–3 IA request package       |
| Code/tests/Register modified | **None**                                   |

---

_End of Stage 2–3 authorization scope matrix._
