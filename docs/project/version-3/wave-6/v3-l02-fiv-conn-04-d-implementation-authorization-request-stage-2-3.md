# FIV-CONN-04-D — Implementation Authorization Request Package (Stage 2–3 Proposal)

**Document:** Formal Product Owner decision request for a **bounded** Full-D Stage 2 and Stage 3 implementation authorization  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Request class:** Implementation Authorization Request (execution under amended Full-D IA)  
**Supporting matrix:** [`v3-l02-fiv-conn-04-d-stage-2-3-authorization-scope-matrix.md`](./v3-l02-fiv-conn-04-d-stage-2-3-authorization-scope-matrix.md)  
**Nature:** **REQUEST PACKAGE ONLY.** Does **not** grant authorization. Does **not** implement code or tests. Does **not** modify the Decision Register. Does **not** stage, commit, or push.

```text
REQUEST STATUS: PENDING PRODUCT OWNER DECISION
D-CONN04-FULL-D-IA: GRANTED WITH AMENDMENTS (scope authority — not execution clearance)
SUCCESSOR-01 IA AMENDMENT: APPROVED AND RATIFIED (S1–S4 ACCEPTED)
KO-COND-01: CLOSED / SATISFIED
KO-COND-02: SATISFIED
KICKOFF: COMPLETED — PASS WITH CONDITIONS
SEPARATE IMPLEMENTATION AUTHORIZATION (THIS REQUEST): NOT GRANTED
PROPOSED SCOPE: STAGE 2 + BOUNDED STAGE 3 ONLY
STAGES 4–8: NOT REQUESTED — REMAIN UNAUTHORIZED
VAULT METADATA PORT CODING: NOT REQUESTED — REMAIN UNAUTHORIZED
CONNECTION.ENVIRONMENT UPDATE: NOT REQUESTED — REMAIN UNAUTHORIZED
FIV-CONN-04-E / PRODUCTION / LIVE CAPITAL: NOT REQUESTED — REMAIN UNAUTHORIZED
```

---

## 1. Decision request (for the Product Owner)

The Product Owner is asked to choose **exactly one** of:

| Option | Short title                                                                 |
| ------ | --------------------------------------------------------------------------- |
| **A**  | Approve **bounded Stage 2 only**                                            |
| **B**  | Approve **bounded Stage 2 and Stage 3** (recommended sequence below)        |
| **C**  | **Do not authorize yet** — return for further specification / clarification |

This package recommends **Option B** under the sequence and inventory in §6–§8 and the supporting matrix. The Product Owner retains sole authority to choose A, B, C, or a recorded amendment.

---

## 2. Source integrity

All mandatory sources were hashed against the repository before drafting. **All MATCH.**

| #   | Path                                                                                                                                   | Expected / actual SHA-256                                          | Result    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------- |
| 1   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization.md`                                                   | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` | **MATCH** |
| 2   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-final-candidate-successor-01.md` | `4eb2fb970954687fa5eeec67a5243b59fc1ee48ed55554811e48f00cc042f071` | **MATCH** |
| 3   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-successor-01-approval-and-ratification.md`                 | `ab6a8ef3dcfc153b2e3acdc0f904e7b4d96f409b4a063027c6a90b4a1df07cfe` | **MATCH** |
| 4   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-kickoff-completion.md`                                                             | `f197c2944e1e4b37b005ecd72a30fda6fc5ecbb2d821de68af921eacb1e1fe50` | **MATCH** |
| 5   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-ko-cond-01-po-clarification-act.md`                                                | `ebad7c8ae82696d763139d65b187fc3cdb3ed44e11152fa6287596d8ef1460c1` | **MATCH** |
| 6   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-1-vault-entry-alignment-to-port.md`                                          | `0f6c9ae61cbf9d55bced3eda59f4e88ab2a392b6578dd688c9ec56c27ea38a5b` | **MATCH** |
| 7   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-1-vault-entry-alignment-to-port-independent-review.md`                       | `23f02d8d6786c15a3662bfa7f82e9b3c0e1317b83755687d86433abcacfb2de2` | **MATCH** |
| 8   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-ko-cond-01-formal-closure-act.md`                                                  | `0cf6d9e3212a6c295d3f435bc5f365f64462c0bd771bc2a6da55266f049b9086` | **MATCH** |
| 9   | `docs/project/version-3/wave-6/wave-6-po-decision-register.md`                                                                         | `a98e1eded40c6ba98068f209c57cafbdffb8dd6dc7c7902e767c67dbe35940e9` | **MATCH** |
| 10  | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-post-ko-cond-01-implementation-readiness-assessment.md`                            | `e12dc0ef03764d44566473d0d2b58957103ec5e34efcd784d3bc78331490a6ca` | **MATCH** |

**Integrity verdict:** **PASS.** No missing mandatory source. No hash mismatch. No governance conflict requiring STOP before drafting this request. Precedence applied: original Full-D IA + Successor-01 S1–S4 supersession + Formal Closure + Clarification Q1–Q5 + Decision Register current state.

**Layered authorization reminder (not a conflict):** Full-D IA scope is **GRANTED WITH AMENDMENTS**; separate **execution** authorization for coding remains **NOT GRANTED** until the Product Owner decides this request (Clarification Act Q5; Formal Closure §§7–8; Register STOP; Readiness Assessment G-11).

---

## 3. Current governance state (inputs)

| Item                                            | Status                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| Full-D IA (`D-CONN04-FULL-D-IA`)                | **GRANTED WITH AMENDMENTS** — package `fee16e97…19b039`                     |
| Successor-01 (`D-CONN04-PO-VAULT-B-IA-AMD-S01`) | **APPROVED AND RATIFIED** — `4eb2fb97…42f071`; S1–S4 **ACCEPTED**           |
| Kickoff (`D-CONN04-FULL-D-KO`)                  | **COMPLETED — PASS WITH CONDITIONS**                                        |
| KO-COND-01                                      | **CLOSED / SATISFIED** (`D-CONN04-KO-COND-01`)                              |
| KO-COND-02                                      | **SATISFIED**                                                               |
| Separate implementation authorization           | **NOT GRANTED** (this request seeks it for Stage 2–3 only)                  |
| Implementation execution                        | **NOT STARTED**                                                             |
| Stages 4–8                                      | **Not requested**; remain subject to later gates                            |
| Vault metadata port coding                      | **Not requested**; Successor-01 inventory remains for a later authorization |
| FIV-CONN-04-E / production / live capital       | **NOT AUTHORIZED**                                                          |

Repository fact (read-only): `connection.environment-backfill` is **absent** from `apps/api/src/modules/security-audit/` (catalog delivery still pending). Dedicated Vault metadata-port files are **absent**. Existing D Entry/identity files are **P-D-02** lease/identity scope (dirty/untracked — preserve).

---

## 4. Why a separate Stage 2–3 authorization is requested

1. Clarification Act Q5 and Formal Closure require **separate, explicit** implementation authorization before port/Entry coding — KO-COND-01 closure alone is insufficient.
2. The Readiness Assessment verdict was **READY FOR SEPARATE IMPLEMENTATION AUTHORIZATION REVIEW**, not a grant.
3. Full-D IA §8 defines Stage 2 (catalog/attribution) and Stage 3 (lease/write-authority setup) as **early** sequence stages that **do not** include Stage 4 freshness, Stage 5 `Connection.environment` UPDATE, or later audit/write loop stages.
4. Successor-01 states Stage 2 catalog delivery remains under **existing approved Full-D IA §7.2** and is **not** expanded by the Vault-metadata amendment; Stage 2–3 therefore need **not** authorize the dedicated metadata port.
5. Narrowing the first execution grant to Stage 2–3 reduces risk relative to authorizing Stages 4–8 or backfill execution.

---

## 5. Proposed authorization scope (summary)

### 5.1 Stage 2 — Security Audit catalog + attribution

**Objective (Full-D IA §8 Stage 2):** Register event type + attribution; remain refuse-closed until done; enable classified emission **capability** without requiring Full-D backfill orchestration.

**In scope if Option A or B is approved:**

- Admit exactly `connection.environment-backfill` in Security Audit classification.
- Add attribution rule for that type (workspace/actor/resource within parent Slice Planning Package §13 floor + COND-IA-04).
- Create Connections-local audit helper (mirror `connection-migration-gate-audit.ts` pattern) — txn-capable sanitize + `SecurityAuditService.record`.
- Coordinated tests: classification admit; refuse unknown; attribution; service refuse/admit regressions.
- Optional Nest provider registration of the helper in `ConnectionsModule` **only if** Nest-injected, **preserving** export walls (no B-04 / PORT / durable / Entry / Vault port export).

**Out of Stage 2:**

- Emission from a Full-D `runEnvironmentBackfill` loop (loop not authorized here).
- Second event type; Prisma `actorKind`; outbox / pending-audit.
- Vault metadata port; Stage 4–8; environment UPDATE; production activation.

**Fact:** Catalog currently lacks the type — Stage 2 is the delivery of COND-IA-04 / PD03-NB01 catalog+attribution code.

### 5.2 Stage 3 — Lease / write-authority setup (bounded)

**Objective (Full-D IA §8 Stage 3):** Wire Entry→B-04 start/HB/release; place `assertWriteAuthority` in the write unit; exit when Entry acquires/releases with canonical actor and CAS is callable in a txn.

**Critical boundary proposed for PO approval:**

| Permitted under Stage 3 (if Option B)                                                            | Forbidden under Stage 3                                                                               |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Preserve/prove P-D-02 Entry→B-04 lease lifecycle with canonical SYSTEM_JOB actor                 | `Connection.environment` NULL→`live` UPDATE (Stage 5)                                                 |
| CREATE write-unit scaffolding that invokes `assertWriteAuthority(txn, grant)` inside a short txn | Fresh Vault metadata loop / dedicated metadata port (Stage 4 / Successor-01 §10)                      |
| Prove CAS miss / authority-fail fail-closed in tests                                             | Treating Stage 3 as permission to execute backfill or emit operational backfill audits as a batch run |
| Keep reclaim redesign excluded; keep B-04/PORT/durable unexported                                | Public HTTP/DTO/`PrivilegedActorContext` ingress; second SYSTEM_JOB constructor                       |

**Relationship to P-D-02:** Entry identity + lease mediation already exist (P-D-02 SAT). Stage 3 **reuses** that boundary and may **narrowly MODIFY** Entry / module wiring only as needed to attach write-authority scaffolding — **without** absorbing the full COND-IA-06 `runEnvironmentBackfill` orchestration shape (that belongs to later stages).

### 5.3 Explicit non-collapse of permissions

This request treats as **three different authorities**:

1. **Technical mechanism** — catalog/attribution/helper; lease/CAS callable (this request).
2. **Environment UPDATE** — Stage 5 — **not** requested.
3. **Production activation / live capital / E** — **not** requested.

---

## 6. Sequencing recommendation

Controlling rule (Full-D IA §8 Stage 3 preconditions; Kickoff §5 parallelization):

> Stage 3 preconditions: **Stage 2 (or parallel only if no emission yet).**  
> Stage 2 may proceed early but **must not** emit before registration.

| Sequence                   | Assessment                                                                                                                                                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stage 2 before Stage 3** | **Recommended.** Lands catalog+attribution before any write-authority scaffolding that later stages will couple to audit emission. Matches Stage 3’s primary precondition ordering.                                                                            |
| Stage 3 before Stage 2     | **Unsupported / unsafe for emission coupling.** Sources allow parallel only with **no emission**; putting Stage 3 first adds no catalog benefit and increases risk of accidental emission-before-registration in later work.                                   |
| Bounded parallel           | **Permitted by source** only if **no emission** occurs. Acceptable as an efficiency option after Stage 2 registration lands, or strictly simultaneous **only** with an explicit no-emission discipline. Less preferred than sequential 2→3 for review clarity. |

**Recommendation:** Authorize (if Option B) **Stage 2 first**, then Stage 3 after Stage 2 exit criteria are met (or Independent Reviewer confirms Stage 2 registration complete). Parallel Stage 3 coding may begin **only after** classification admits the type **and** with a hard ban on emission until Stage 2 tests confirm refuse/admit correctness.

---

## 7. Exact proposed inventory (PO-facing)

Full detail, dependencies, and overlap controls: supporting matrix §§2–4.

| ID     | Stage | Component                                                                                                                           | Change type                            | Authority                                            |
| ------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------- |
| S2-01  | 2     | `apps/api/src/modules/security-audit/security-audit-classification.ts`                                                              | **MODIFY**                             | Full-D IA §7.2                                       |
| S2-02  | 2     | `apps/api/src/modules/security-audit/security-audit-attribution.ts`                                                                 | **MODIFY**                             | Full-D IA §7.2                                       |
| S2-03  | 2     | `apps/api/src/modules/connections/connection-environment-backfill-audit.ts`                                                         | **CREATE**                             | Full-D IA §7.2 / COND-IA-04                          |
| S2-04  | 2     | `apps/api/src/modules/security-audit/security-audit.service.ts`                                                                     | **REUSE**                              | Full-D IA §7.2                                       |
| S2-05  | 2     | Classification / attribution / service specs (existing paths; extend)                                                               | **MODIFY** / extend                    | Full-D IA §7.5 / §8 Stage 2                          |
| S2-06  | 2     | `connection-environment-backfill-audit.spec.ts`                                                                                     | **CREATE**                             | Full-D IA §7.5                                       |
| S2-07  | 2     | `connections.module.ts` — register audit helper **if** Nest-injected; **preserve export walls**                                     | **MODIFY** (narrow)                    | Full-D IA §7.1 / §7.2                                |
| S3-01  | 3     | `fiv-conn-04-d-system-job-migration-entry.ts` — lease wiring only; **no** full backfill loop; **no** env UPDATE                     | **MODIFY** (narrow) / **REUSE** P-D-02 | Full-D IA §8 Stage 3; COND-IA-02                     |
| S3-02  | 3     | `fiv-conn-04-d-system-job-identity.ts`                                                                                              | **REUSE** / **NO CHANGE**              | P-D-02; Full-D IA §7.1                               |
| S3-03  | 3     | `conn04-migration-boundary.service.ts` (+ B-04 adapters)                                                                            | **REUSE**                              | Full-D IA §7.1 / §8 Stage 3                          |
| S3-04  | 3     | Logical write-unit component (`fiv-conn-04-d-environment-backfill-write.ts` **proposed** path) — **authority/CAS scaffolding only** | **CREATE** (bounded)                   | Full-D IA §7.1 + §8 Stage 3 (**not** Stage 5 UPDATE) |
| S3-05  | 3     | Write-unit + Entry lease/CAS specs                                                                                                  | **CREATE** / **MODIFY**                | Full-D IA §8 Stage 3 tests                           |
| S3-06  | 3     | `connections.module.ts` — register write-unit **if** Nest-injected; **no** export of B-04/PORT/durable/Entry                        | **MODIFY** (narrow)                    | Full-D IA §8 Stage 3 Stop                            |
| EXCL-* | —     | Vault metadata port inventory (Successor-01 §10); Stages 4–8; E; production                                                         | **EXCLUDED**                           | S01; Formal Closure; this request                    |

**Dirty/untracked overlap (must preserve; no broad rewrite):**

- `connections.module.ts` (**modified**)
- `fiv-conn-04-d-system-job-migration-entry.ts` / `.spec.ts` (**untracked** P-D-02)
- `fiv-conn-04-d-system-job-identity.ts` / `.spec.ts` (**untracked** P-D-02)
- `conn04-migration-boundary.service.spec.ts` (**modified**)

Engineering must treat these as **pre-existing P-D-02 baselines**, apply **minimal diffs**, and must not “clean up,” reformat, or mix unrelated dirty intent (Kickoff Review KO-REV-02 hygiene lineage).

---

## 8. Successor-01 / Q1 constraints (Stage 2–3 applicability)

| #   | Constraint                                                    | Applies to Stage 2–3?                              | Compliance demonstration                                           | STOP / escalate if                                            |
| --- | ------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| 1   | Dedicated D Entry metadata port (S1–S4)                       | **Preserved; not implemented in this request**     | Do not code Successor-01 §10 port under Stage 2–3                  | Port coding or `list`-based D freshness introduced here       |
| 2   | No D Entry freshness via `list`+id equality                   | **N/A to Stage 2; Stage 3 must not add freshness** | No Vault freshness code in Stage 2–3 inventory                     | Freshness/`list` path added for D Entry                       |
| 3   | A Preflight informational + valid `list` preserved            | **Yes — non-regression**                           | Do not modify A Preflight for Stage 2–3; keep existing specs green | A Preflight behavior changed or merged into D write authority |
| 4   | No second SYSTEM_JOB constructor                              | **Yes**                                            | Only existing identity factory; helpers do not construct actor     | Second constructor / parallel Entry                           |
| 5   | No public HTTP/DTO/`PrivilegedActorContext` ingress           | **Yes**                                            | No controllers/DTOs; Entry remains unexported                      | Any public ingress                                            |
| 6–7 | No ACL redesign / membership fabrication / Vault AuthZ bypass | **Yes**                                            | No `vault-access-control` / membership changes                     | Any ACL bypass                                                |
| 8   | Fail-closed + STOP                                            | **Yes**                                            | Catalog refuse until registered; CAS miss fail-closed              | Emission before registration; ignore CAS fail                 |
| 9   | Nest DI ≠ production AuthN/AuthZ proof                        | **Yes (documentation + negatives)**                | Export-wall negatives; no AuthZ claims from DI                     | Claiming Nest DI proves Vault AuthZ / S2S                     |
| 10  | No second parallel D freshness path                           | **Yes**                                            | Do not invent interim freshness                                    | Dual freshness mechanisms                                     |
| 11  | IA-REV-03 residual preserved                                  | **Yes — do not claim solved**                      | No outbox/pending-audit invented in Stage 2–3                      | Claiming crash-gap solved                                     |
| 12  | Successor-01 §13 exclusions                                   | **Yes**                                            | E, production, cron, HTTP, second constructor, etc. excluded       | Any §13 exclusion breached                                    |

---

## 9. Tests and acceptance (proposed plan — not executed)

Detail: supporting matrix §5. Headline requirements:

**Stage 2**

- Type string exact `connection.environment-backfill`.
- Refuse-closed for unknown types still holds; admit after registration.
- Attribution rule present for the type; SYSTEM_JOB actorId path consistent with P-D-02 canonical id when exercised from helper tests.
- Helper sanitize refuse; txn overload present (pattern mirror).
- **No** claim of Full-D backfill emission suite in Stage 2.

**Stage 3**

- Entry→B-04 start/HB/release with canonical actor (regression on P-D-02).
- `assertWriteAuthority` callable in txn from write-unit scaffolding; CAS miss / authority fail fail-closed.
- Export walls: B-04 / PORT / durable / Entry not newly exported.
- **Explicit negative:** no `Connection.environment` UPDATE performed by Stage 3 code paths.
- A Preflight / identity / reclaim regressions remain green.

**Not applicable yet (later stages):** Successor-01 §11 metadata-port tests; IMPL-REV-D-06 freshness suite; conditional UPDATE / same-txn UPDATE+audit full path (Stages 5–6).

---

## 10. Entry / exit gates (proposed)

### Stage 2

| Gate      | Content                                                                                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entry** | Separate PO authorization of Stage 2 (Option A or B); Kickoff complete; KO-COND-01 closed; catalog type still absent; COND-IA-04 / PD03-NB01 binding acknowledged                                               |
| **Exit**  | Type admitted; attribution rule present; refuse/admit tests green; helper present (if in inventory); no second type; no emission-before-registration incident; Independent Reviewer Stage 2 check (recommended) |
| **STOP**  | Catalog/attribution desync; second event type; secrets in payload floor breach; Decision Register / scope expansion without PO                                                                                  |

### Stage 3

| Gate      | Content                                                                                                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entry** | Option B (or later separate Stage 3 grant); Stage 2 exit satisfied **or** parallel only after registration with **no emission**; P-D-02 Entry/identity preserved                                                     |
| **Exit**  | Entry acquires/releases with canonical actor; CAS/`assertWriteAuthority` callable in txn; export walls intact; **no** env UPDATE path enabled; Stage 3 tests green; Independent Reviewer Stage 3 check (recommended) |
| **STOP**  | Export of B-04/PORT/durable; second constructor; env UPDATE introduced; freshness port introduced; reclaim redesign                                                                                                  |

### After Stage 2–3 completion (still blocked)

Stages 4–8; Vault metadata port coding; Full-D backfill execution; `Connection.environment` UPDATE; FIV-CONN-04-E; production; live capital — **all remain unauthorized** until separate PO acts.

**Recommendation (not a new mandatory rule unless PO adopts it):** Independent Reviewer written PASS on each stage’s exit evidence before Engineering claims stage complete; Product Owner may require a brief stage-acceptance note before the next stage starts.

---

## 11. Decision options (detail)

### Option A — Approve bounded Stage 2 only

| Field                       | Content                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Authority granted**       | Stage 2 inventory S2-01…S2-07 and Stage 2 tests/acceptance only                                                   |
| **Remains unauthorized**    | Stage 3; Stages 4–8; Vault port; env UPDATE; backfill execution; E; production; live capital                      |
| **Benefits**                | Smallest coding blast radius; lands catalog prerequisite early                                                    |
| **Risks**                   | Stage 3 still blocked; write-authority scaffolding deferred; possible second PO cycle soon                        |
| **Conditions before start** | Recorded PO decision + Register sync (separate act); Engineering acknowledgment of no-emission / no Stage 3 creep |

### Option B — Approve bounded Stage 2 and Stage 3

| Field                       | Content                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Authority granted**       | Stage 2 + Stage 3 inventories as defined herein; sequence Stage 2→Stage 3 (parallel only post-registration / no emission)             |
| **Remains unauthorized**    | Stages 4–8; Vault port; env UPDATE; backfill execution; E; production; live capital                                                   |
| **Benefits**                | Completes early Full-D prerequisites per IA §8; keeps UPDATE/freshness explicitly out                                                 |
| **Risks**                   | Write-unit CREATE must be tightly bounded (authority only); dirty Entry/module overlap requires discipline                            |
| **Conditions before start** | Recorded PO decision + Register sync; Engineering commits to Stage 3 **no UPDATE** boundary; Independent Review recommended per stage |

### Option C — Do not authorize yet

| Field                                   | Content                                                                                                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authority granted**                   | **None**                                                                                                                                              |
| **When appropriate**                    | If PO rejects write-unit CREATE in Stage 3; wants more payload-field freeze; or requires further Independent Review of this request before any coding |
| **Open questions that could justify C** | See §12                                                                                                                                               |

---

## 12. Open questions (do not resolve by assumption)

| ID       | Question                                                                                                                                                           | If unresolved                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **OQ-1** | Confirm Stage 3 may **CREATE** the write-unit file with **`assertWriteAuthority` scaffolding only**, deferring conditional UPDATE to a later Stage 5 authorization | Prefer Option B with that bound; else Option A or C                                                  |
| **OQ-2** | Exact attribution field wiring within parent Slice §13 floor — Engineering deferred detail under grant, or PO wants a freeze first?                                | Full-D IA §15 already marks this **DEFERRED DETAIL**; default = Engineering under grant within floor |
| **OQ-3** | Must Independent Reviewer PASS Stage 2 before Stage 3 starts (recommended), or is Engineering self-check + later PIR enough?                                       | Recommendation only unless PO mandates                                                               |

No material governance conflict was found that requires STOP instead of presenting Options A–C.

---

## 13. Recommendation

**Recommend Option B** — approve bounded Stage 2 and Stage 3 under:

1. Sequence **Stage 2 → Stage 3** (parallel only after type registration and with **no emission**).
2. Exact inventories in §7 / supporting matrix.
3. Hard exclusions: Stages 4–8, Vault metadata port, `Connection.environment` UPDATE, backfill execution, E, production, live capital.
4. Preserve P-D-02 dirty/untracked baselines with minimal diffs.
5. Preserve Successor-01 / Q1 constraints and IA-REV-03 as unsolved residual.

If the Product Owner is uncomfortable authorizing any write-unit CREATE before Stage 5, choose **Option A** and require a later Stage 3-only request answering OQ-1.

**This document does not authorize implementation.**

---

## 14. Required next act after PO decision (not this task)

If approved (A or B): separate ratification / Decision Register sync recording the chosen option, exact inventory hashes of this request package, and exclusions.  
If Option C: return instructions naming required clarifications.

---

## 15. Explicit non-authorization banner

```text
THIS IS A REQUEST PACKAGE ONLY
IMPLEMENTATION AUTHORIZATION: NOT GRANTED BY THIS DOCUMENT
STAGE 2–3 CODING: NOT AUTHORIZED UNTIL SEPARATE PO DECISION IS RECORDED
STAGES 4–8: NOT AUTHORIZED
VAULT METADATA PORT: NOT AUTHORIZED
CONNECTION.ENVIRONMENT UPDATE: NOT AUTHORIZED
FULL-D BACKFILL EXECUTION: NOT AUTHORIZED
FIV-CONN-04-E: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
LIVE-CAPITAL ACTIVITY: NOT AUTHORIZED
DECISION REGISTER: NOT MODIFIED BY THIS DOCUMENT
NO TESTS EXECUTED
NO SOURCE CODE MODIFIED
```

---

## 16. Repository baseline at drafting

| Field        | Value                                         |
| ------------ | --------------------------------------------- |
| Branch       | `main`                                        |
| HEAD         | `953292675e197d4f25778aaaa59eacb2826560fe`    |
| Created      | This request package + supporting matrix only |
| Working tree | Pre-existing dirty/untracked **preserved**    |

---

_End of Stage 2–3 Implementation Authorization Request Package._
