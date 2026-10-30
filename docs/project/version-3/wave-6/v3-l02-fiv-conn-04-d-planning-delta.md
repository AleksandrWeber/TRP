# FIV-CONN-04-D — Controlled Planning Delta

**Document:** Controlled full-D planning delta incorporating ratified P-D-02 and P-D-03 / NB-01  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Nature:** **PLANNING DELTA / GOVERNANCE DOCUMENTATION ONLY.** Does **not** authorize implementation of P-D-03, full D, backfill execution, or production activation. Does **not** modify application source, tests, schemas, Security Audit catalog, or the Decision Register. Does **not** stage, commit, or push.

```text
PLANNING DELTA STATUS: CREATED
P-D-02: SATISFIED (D-CONN04-PD02-SAT)
P-D-03 / NB-01 DECISION: APPROVED — OPTION B (D-CONN04-PD03-NB01)
P-D-03 IMPLEMENTATION: NOT STARTED / NOT AUTHORIZED
FULL-D IMPLEMENTATION AUTHORIZATION: NOT GRANTED
FULL D BACKFILL: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**Labels used below:**

| Label                        | Meaning                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| **RATIFIED DECISION**        | Product Owner / freeze decision already recorded                                             |
| **APPROVED DESIGN**          | Accepted by planning review / freeze / slice approval substance                              |
| **EXISTING IMPLEMENTATION**  | Present in repository code / closed parent slices                                            |
| **PROPOSED PLANNING DETAIL** | Planning-level detail still subject to Implementation Authorization and later design binding |
| **OPEN DECISION**            | Unresolved; must not be closed by assumption                                                 |
| **NOT AUTHORIZED**           | Explicit non-grant of coding / execution / activation                                        |

---

## 1. Purpose and scope

Produce one internally consistent, current planning baseline for subsequent independent review and a possible **separate** full-D Implementation Authorization Package.

**In scope:**

- Incorporate **P-D-02 = SATISFIED** and **P-D-03 / NB-01 = APPROVED — OPTION B**.
- Supersede stale full-D “new orchestrator CREATE” inventory with **Option A** Entry absorption.
- Bind ratified audit event type `connection.environment-backfill` as contract direction (not catalog delivery).
- Carry forward **IMPL-REV-D-01…06**, mutation/audit requirements, open questions, and E handoff.
- Distinguish design approval from implementation delivery and authorization.

**Out of scope:**

- Code, tests, catalog registration, Prisma, Entry/B-04 behavior changes.
- Exact audit payload schema invention.
- Full-D Implementation Authorization.
- E implementation; HTTP/UI/cron/Trading Runtime; production activation.

---

## 2. Governance baseline and decision references

| Item                                | Status                                                                          | Class                                               | Authoritative record                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-D-02 identity boundary            | **SATISFIED**                                                                   | **RATIFIED DECISION**                               | [`v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md) — `D-CONN04-PD02-SAT`  |
| SYSTEM_JOB identity                 | `actorKind = SYSTEM_JOB`; `actorId = system-job:fiv-conn-04-migration-backfill` | **RATIFIED DECISION**                               | SYSTEM_JOB PO ratification; SAT §4                                                                                                                      |
| Option A Entry boundary             | `Conn04SystemJobMigrationEntry` sole trusted SYSTEM_JOB ↔ B-04 boundary         | **RATIFIED DECISION** / **EXISTING IMPLEMENTATION** | P-D-02 planning §16.2.3; SAT; Entry code                                                                                                                |
| MINOR-PD02-PIR-01                   | ACCEPTED — BOUNDED MINOR; remediation before public/DTO/external actor ingress  | **RATIFIED DECISION**                               | SAT §5; PIR                                                                                                                                             |
| P-D-03 / NB-01                      | **APPROVED — OPTION B**                                                         | **RATIFIED DECISION**                               | [`v3-l02-fiv-conn-04-d-pd03-nb01-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-pd03-nb01-product-owner-ratification.md) — `D-CONN04-PD03-NB01` |
| Event type string                   | `connection.environment-backfill`                                               | **RATIFIED DECISION** (direction)                   | PD03-NB01 ratification                                                                                                                                  |
| P-D-03 catalog/code                 | **NOT STARTED / NOT AUTHORIZED**                                                | **NOT AUTHORIZED**                                  | PD03-NB01 §4 / §6                                                                                                                                       |
| P-D-01 A preflight delivery         | **SATISFIED** (on `HEAD`)                                                       | **EXISTING IMPLEMENTATION**                         | Readiness reassessment §8 note; preflight delivery commit                                                                                               |
| Full-D Implementation Authorization | **NOT GRANTED**                                                                 | **NOT AUTHORIZED**                                  | Impl Planning Review §17; Register STOP                                                                                                                 |
| Full D backfill / env UPDATE        | **NOT AUTHORIZED**                                                              | **NOT AUTHORIZED**                                  | SAT / PD03 exclusions                                                                                                                                   |
| Production activation               | **NOT AUTHORIZED**                                                              | **NOT AUTHORIZED**                                  | Register STOP                                                                                                                                           |

**Decision Register (read-only for this act):** [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md) — CURRENT STATE rows for `D-CONN04-PD02-SAT` and `D-CONN04-PD03-NB01`. **This Planning Delta does not modify the register.**

---

## 3. Source precedence and historical decision treatment

### 3.1 Precedence order (controlling → historical)

1. Product Owner ratifications / formal dispositions (`D-CONN04-PD02-SAT`, `D-CONN04-PD03-NB01`, SYSTEM_JOB policy).
2. Decision Freeze + Slice Approval frozen substance (AC-D-01…07; D-CONN-04-01…10; COND-ARCH-B*).
3. Full-D Implementation Planning Review conditions **IMPL-REV-D-01…06** ([`v3-l02-fiv-conn-04-d-implementation-planning-review.md`](./v3-l02-fiv-conn-04-d-implementation-planning-review.md) §13).
4. P-D-02 Implementation Planning **§16 Option A** ([`v3-l02-fiv-conn-04-d-pd02-implementation-planning.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-planning.md)).
5. This **Planning Delta** — reconciles (4) with full-D Implementation Planning inventory where they conflict.
6. Full-D Implementation Planning ([`v3-l02-fiv-conn-04-d-implementation-planning.md`](./v3-l02-fiv-conn-04-d-implementation-planning.md)) — remains valid for mutation/audit/freshness substance; **orchestrator CREATE inventory is historical / superseded** (see §3.2).
7. Planning Package / Planning Review / readiness reassessment — discovery and readiness evidence; do not override later PO acts.

### 3.2 Explicit supersessions (historical text preserved)

| Historical statement                                                                                                                 | Location                                                  | Superseding control                    | Treatment                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| “New D orchestrator (Nest service) **CREATE**”                                                                                       | Impl Planning §10 inventory                               | P-D-02 §16.2.3 Option A; this delta §4 | **SUPERSEDED** — expand/absorb `Conn04SystemJobMigrationEntry`; **no second constructor**                                                     |
| “New privileged orchestrator? **Yes** (proposed Nest service)”                                                                       | Impl Planning §10 architectural answers                   | Same                                   | **SUPERSEDED for surface name** — Nest privileged composition remains; **Entry is that boundary**                                             |
| IMPL-REV-D-03 “Privileged Nest orchestrator … ACCEPTED PROPOSED BINDING” + “Exact trusted entry / actor construction remains P-D-02” | Impl Planning Review §6.3 / §13                           | P-D-02 SAT + Option A                  | **SUBSTANCE RETAINED** (no public HTTP; not default cron; privileged Nest). **Entry binding now closed** by SAT; runner = Entry expand/absorb |
| COND-D-02 / NB-01 “DEFERRED” / candidate “PROPOSED ONLY”                                                                             | Decision Freeze; Impl Planning §9; discovery status lines | `D-CONN04-PD03-NB01`                   | **SUPERSEDED for event-type admission**; payload schema still deferred                                                                        |
| Impl Planning Review “P-D-01 UNRESOLVED” / “P-D-02 BLOCKING” / “P-D-03 UNDECIDED” inventory                                          | Review §§5 / 12 / 15                                      | P-D-01 delivery; SAT; PD03-NB01        | **HISTORICAL** at review time; current baseline uses later dispositions                                                                       |
| Readiness reassessment “P-D-03 OPEN / BLOCKING” status banner                                                                        | Readiness header                                          | PD03-NB01                              | **HISTORICAL** at reassessment time (reader note already present)                                                                             |

**Do not rewrite** historical artifact bodies. This delta is the current planning baseline for orchestration binding and NB-01 contract direction.

### 3.3 Still binding without rewrite

- AC-D-01…07; D-CONN-04-01…10; B-04 wall (no UPDATE inside B-04 redesign).
- Same-txn CAS + conditional `environment IS NULL` UPDATE + Strategy B.
- IMPL-REV-D-01…06 meanings (see §7).
- Zero Vault mutation; no public env API; residuals preserved for E.
- MINOR-PD02-PIR-01 remediation gate for any future public/DTO/external actor surface.

---

## 4. Option A trusted execution boundary

### 4.1 Controlling statements (**RATIFIED DECISION** + this delta binding)

1. **`Conn04SystemJobMigrationEntry` is the sole trusted SYSTEM_JOB execution boundary for FIV-CONN-04-D.**
2. The Entry **internally constructs** the canonical SYSTEM_JOB identity (`system-job:fiv-conn-04-migration-backfill` / `actorKind = SYSTEM_JOB`) via the module-private factory.
3. Full-D orchestration **must extend or absorb** this Entry boundary (P-D-02 planning §16.2.3).
4. A **second** SYSTEM_JOB actor constructor or parallel trusted boundary is **prohibited**.
5. The Entry **must not** accept caller-controlled `actorId`, `actorKind`, or privileged actor context.
6. This Planning Delta introduces **no** public HTTP endpoint, external DTO, job-payload identity, cron, scheduler, or Trading Runtime ingress.
7. **B-04** (`Conn04MigrationBoundaryService`) remains the internal lease/write-authority façade.
8. B-04, `MIGRATION_GATE_PORT`, and `MIGRATION_GATE_DURABLE_AUTHORITY` remain **non-exported** from `ConnectionsModule`.
9. Existing **OPERATOR** recovery/reclaim behavior remains compatible (Entry is SYSTEM_JOB-only path).
10. **MINOR-PD02-PIR-01** remains accepted **only** within the current unexported trusted boundary. Any future expansion to public Entry API, external DTO, or externally supplied actor context requires **remediation and fresh review before authorization**.

### 4.2 Relationship to IMPL-REV-D-03

| Aspect                                                        | Status                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------ |
| Privileged Nest composition; no public HTTP; not default cron | **APPROVED DESIGN** (IMPL-REV-D-03 substance) — **retained** |
| Exact trusted entry / actor construction                      | **RATIFIED DECISION** — closed by P-D-02 SAT / Option A      |
| Separate new orchestrator class alongside Entry               | **NOT AUTHORIZED** / **prohibited** by this delta            |

### 4.3 Current implementation vs planning

| Concern                                                      | Status                                                                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Identity + Entry + Nest export walls                         | **EXISTING IMPLEMENTATION** (P-D-02)                                                                         |
| Entry-mediated full-D write path (Vault/C/UPDATE/audit loop) | **OPEN** — **PROPOSED PLANNING DETAIL** until IA + delivery                                                  |
| Export of Entry to same-app consumer                         | Prefer remain unexported until authorized full-D consumer exists (**PROPOSED PLANNING DETAIL** / P-D-02 §16) |

---

## 5. P-D-03 Security Audit event contract

### 5.1 Ratified contract direction (**RATIFIED DECISION** — `D-CONN04-PD03-NB01`)

| Element                | Content                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Decision               | **APPROVED — OPTION B**                                                                                           |
| Event type             | `connection.environment-backfill`                                                                                 |
| Semantics              | Represents the FIV-CONN-04-D operation that conditionally backfills `Connection.environment` for eligible records |
| Per-row                | Durable per-row audit for each required write disposition                                                         |
| Summary                | Operation-level summary (`operation_summary`)                                                                     |
| Outcomes               | Explicit **updated** and **blocked** representation (AC-D-04 / D-CONN-04-09)                                      |
| Attribution            | Canonical P-D-02 SYSTEM_JOB attribution when that path executes                                                   |
| Persistence            | Existing Security Audit architecture + `TransactionContext` capability                                            |
| Transaction preference | Prefer same-transaction persistence where supported                                                               |
| Failure                | Preserve **IMPL-REV-D-05** (forward-fix; no silent success)                                                       |
| Prisma                 | **No** separate `actorKind` column solely for this decision                                                       |
| Dual types             | **No** second catalog event type for summary unless later evidence + separate approval                            |

### 5.2 Separations (mandatory)

| Layer                                          | Status                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| Event-type **admission direction**             | **RATIFIED DECISION**                                                    |
| Exact payload fields / enums / metadata schema | **OPEN DECISION** / **PROPOSED PLANNING DETAIL** — **not invented here** |
| Catalog + attribution **code** registration    | **NOT AUTHORIZED** / **NOT STARTED**                                     |
| Audit helper + tests                           | **NOT AUTHORIZED**                                                       |
| Claim that type exists in runtime catalog      | **Forbidden** — type remains **absent** until authorized delivery        |

### 5.3 Alignment with IMPL-REV-D-04 / D-05

- **IMPL-REV-D-04:** Write-path per-row durable audit + `operation_summary` = **APPROVED DESIGN** — retained; single ratified type carries both scopes as outcomes unless later evidenced exception.
- **IMPL-REV-D-05:** Forward-fix after UPDATE + audit failure = **APPROVED DESIGN** (frozen substance) — retained.

---

## 6. Full-D execution and mutation requirements

Reconciled from Decision Freeze, Slice Approval, Implementation Planning §§10–17, Implementation Planning Review, readiness reassessment §5, and ratified P-D-02 / P-D-03.

| #   | Requirement                                                                | Controlling source                    | Implementation status                                                     | Planning status                        | Implementation authorization                                  | Required future acceptance evidence              |
| --- | -------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| R1  | B-04 write gate + lease lifecycle (start/resume/HB/release)                | B-04 CLOSED; Slice; Impl Planning §10 | **EXISTING IMPLEMENTATION** (façade); Entry mediates SYSTEM_JOB lease ops | Valid                                  | Full-D write mediation still **NOT AUTHORIZED** beyond P-D-02 | Specs: Entry→B-04; HB fail-closed; release       |
| R2  | B-04 `assertWriteAuthority` CAS in write txn                               | COND-ARCH-B04; Impl Planning          | Method **EXISTING**; full-D write path **OPEN**                           | Valid                                  | **NOT AUTHORIZED**                                            | Txn tests: CAS miss fail-closed                  |
| R3  | Fresh Vault meta + occupancy + C **immediately before each write attempt** | IMPL-REV-D-06; Slice C-05             | **OPEN**                                                                  | **APPROVED DESIGN**                    | **NOT AUTHORIZED**                                            | Per-attempt freshness tests (not preflight-only) |
| R4  | Preflight ELIGIBLE_LIVE informational only                                 | IMPL-REV-D-06                         | Preflight **EXISTING**; D consumption **OPEN**                            | Valid                                  | **NOT AUTHORIZED**                                            | Orchestration tests assert reclassify            |
| R5  | Conditional `Connection.environment` NULL → `live` for eligible EXCHANGE   | AC-D-01/03; Freeze                    | **OPEN**                                                                  | **APPROVED DESIGN**                    | **NOT AUTHORIZED**                                            | Predicate + idempotency tests                    |
| R6  | Zero Vault mutation; `vaultSecretId` unchanged                             | AC-D-02/06                            | N/A until writes                                                          | Valid                                  | **NOT AUTHORIZED**                                            | No Vault write assertions                        |
| R7  | Per-row durable Security Audit on write dispositions                       | AC-D-04; IMPL-REV-D-04; PD03-NB01     | **OPEN** (type ratified, catalog absent)                                  | Contract **RATIFIED**; schema **OPEN** | Catalog/impl **NOT AUTHORIZED**                               | Catalog+helper+integrity tests                   |
| R8  | `operation_summary` (+ counters) per run                                   | IMPL-REV-D-04; Slice §13              | **OPEN**                                                                  | **APPROVED DESIGN**                    | **NOT AUTHORIZED**                                            | Summary emission + counters                      |
| R9  | Audit-after-UPDATE forward-fix                                             | IMPL-REV-D-05; Slice §17–18           | **OPEN**                                                                  | **APPROVED DESIGN**                    | **NOT AUTHORIZED**                                            | Failure path: no silent success                  |
| R10 | Prefer same-txn audit                                                      | PD03-NB01; IMPL-REV-D-05              | Capability **EXISTING** (`TransactionContext`)                            | **APPROVED DESIGN**                    | **NOT AUTHORIZED**                                            | Txn-coupled audit tests                          |
| R11 | Batch continues after skip/block                                           | AC-D-05                               | **OPEN**                                                                  | Valid                                  | **NOT AUTHORIZED**                                            | Continue-after-block tests                       |
| R12 | No public env mutation API                                                 | AC-D-07                               | **EXISTING** absence                                                      | Valid                                  | Must remain absent                                            | Controller regression                            |
| R13 | SYSTEM_JOB attribution on D audits                                         | P-D-02 SAT; PD03-NB01                 | Identity **EXISTING**; D audit path **OPEN**                              | Valid                                  | **NOT AUTHORIZED**                                            | `actorId` assert on D events                     |
| R14 | Failure/recovery matrix (lease expire, occupancy unavailable, etc.)        | Impl Planning §17; Review §8          | **OPEN** (specified)                                                      | Valid                                  | **NOT AUTHORIZED**                                            | Matrix coverage tests                            |
| R15 | Residual verification handoff to E                                         | OQ-D-08; Slice C-06                   | **OPEN / DEFERRED to E**                                                  | D emits Slice §13 counters             | E **NOT AUTHORIZED**                                          | D counters taxonomy; E later                     |
| R16 | Option A Entry expand/absorb orchestration                                 | P-D-02 §16; this delta §4             | Entry shell **EXISTING**; D loop **OPEN**                                 | **This delta binding**                 | Full-D IA **NOT GRANTED**                                     | No second constructor; Nest export walls         |

**Critical distinctions:**

- A/B/C closure and P-D-02 SAT **do not** prove full-D runtime orchestration or env UPDATE delivery.
- Planning completion ≠ implementation completion.
- Ratified event type ≠ catalog registration.

---

## 7. IMPL-REV-D-01…06 traceability matrix

Source: [`v3-l02-fiv-conn-04-d-implementation-planning-review.md`](./v3-l02-fiv-conn-04-d-implementation-planning-review.md) §§6, 7, 13.

| ID                | Exact controlling meaning (faithful)                                                                                                                                                                                                                                                  | Affected design / section                            | Verification approach                                                                                     | Required tests / evidence                                              | Condition class                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| **IMPL-REV-D-01** | Connection-row FOR UPDATE remains **optional**; frozen safety = CAS + conditional UPDATE + Strategy B; **not** elevated to FROZEN / not required for Authorization                                                                                                                    | Per-row write unit; Impl Planning §9 COND-D-04 / §11 | Confirm Authorization/kickoff does not mandate FOR UPDATE as frozen; if used, document as optional detail | Optional lock tests only if implemented; CAS/predicate tests mandatory | Planning + implementation detail (non-blocking for IA)         |
| **IMPL-REV-D-02** | 15m TTL / 5m heartbeat = **operational defaults (guidance)** under ≤4h; MUST NOT silently become new frozen max-window policy; HB-on-long-batch + stop-on-HB-fail acceptable                                                                                                          | Lease lifecycle via B-04; Impl Planning §9 COND-D-06 | Bind “use existing defaults ≤ guidance/ceiling” in IA/kickoff; assert fail-closed on expire/HB fail       | Lease TTL/HB fail-closed tests                                         | Authorization binding + implementation                         |
| **IMPL-REV-D-03** | Privileged Nest orchestrator (no public HTTP; not default cron) = ACCEPTED PROPOSED BINDING; exact trusted entry / actor construction was P-D-02                                                                                                                                      | Runner / Entry (§4 of this delta)                    | IA binds Option A Entry expand/absorb; assert no controller/cron; Nest exports exclude B-04/PORT/durable  | Module export assertions; controller absence; Entry-only constructor   | Planning (superseded surface) + authorization + implementation |
| **IMPL-REV-D-04** | Write-path **per-row durable audit** + **`operation_summary`** = ACCEPTED PROPOSED BINDING; A preflight inventory ≠ D durable per-row obligation                                                                                                                                      | Audit design §§5–6; catalog after IA                 | Emit per disposition + one summary; no secrets; type = `connection.environment-backfill` once registered  | Catalog/attribution tests; per-row + summary integrity                 | Authorization + implementation                                 |
| **IMPL-REV-D-05** | Audit-after-UPDATE = **forward-fix**; no silent success claim; prefer same-txn audit when API accepts `TransactionContext`                                                                                                                                                            | Failure matrix; audit helper                         | Simulate audit fail after UPDATE; assert run error marking / reconciliation path; no auto LIVE→NULL       | Forward-fix / no-silent-success tests                                  | Authorization + implementation (frozen substance)              |
| **IMPL-REV-D-06** | Per write attempt MUST: (1) fresh Vault metadata (exact id) + typed occupancy; (2) re-invoke C on those inputs; (3) only then open write txn (re-read Connection + CAS + conditional UPDATE). Preflight ELIGIBLE_LIVE = informational only. Stale batch-pass C alone NEVER sufficient | Data-flow §11; freshness                             | IA/kickoff must acknowledge; tests must assert per-attempt freshness, not only preflight-pass→write       | Dedicated freshness / stale-preflight rejection tests                  | **Authorization condition** + implementation                   |

**None weakened or omitted.**

---

## 8. Dependency and prerequisite matrix

| Prerequisite                                   | Current status                                  | Blocks                                                                          |
| ---------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| P-D-01 A preflight Nest I/O on `HEAD`          | **SATISFIED**                                   | Was blocking IA; now cleared for prerequisite purposes                          |
| P-D-02 SYSTEM_JOB identity / Entry             | **SATISFIED**                                   | Cleared for identity prerequisite                                               |
| P-D-03 / NB-01 **decision**                    | **APPROVED — OPTION B**                         | Decision cleared; **implementation** still outstanding                          |
| P-D-03 catalog + attribution + helper delivery | **NOT AUTHORIZED**                              | Blocks D write-path audit **runtime** until separately authorized and delivered |
| This Planning Delta                            | **CREATED** (this artifact)                     | Feeds independent planning review / IA package                                  |
| Independent Planning Delta review              | **PENDING**                                     | Good practice before IA                                                         |
| Full-D Implementation Authorization            | **NOT GRANTED**                                 | Blocks all full-D coding                                                        |
| Option A Entry expand/absorb design details    | **PROPOSED PLANNING DETAIL** / partial **OPEN** | Blocks clean IA if IA invents second constructor                                |
| Exact audit payload schema                     | **OPEN DECISION**                               | Blocks catalog implementation slice; does **not** reopen event-type string      |
| IMPL-REV-D-01…06 acknowledgment in IA          | **PENDING**                                     | Required by Impl Planning Review §16 next gate                                  |
| E residual verification                        | **DEFERRED / NOT STARTED**                      | Blocks parent CONN-04 close; **not** silently part of D                         |

```text
DEPENDENCY SUMMARY:
  P-D-01 SAT + P-D-02 SAT + P-D-03 DECISION APPROVED
  → Planning Delta (this) → independent review → possible full-D IA
  → then authorized implementation (Entry expand + catalog + write path)
  → then E (separate)
  Production activation remains separately gated / NOT AUTHORIZED
```

---

## 9. Open questions and required resolutions

| ID      | What is unknown                                                                                                         | Why it matters                                | Resolving artifact / decision                                                            | Blocks                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| OQ-Δ-01 | Exact audit **payload schema** / sanitizer allowlist for `connection.environment-backfill`                              | Catalog registration + refuse-closed emission | Implementation design under full-D IA (or narrow P-D-03 impl auth); must not invent here | Implementation slice / catalog delivery — **not** event-type string |
| OQ-Δ-02 | Detailed **disposition → outcome** mapping (e.g. blocked_* family naming)                                               | AC-D-04 evidence; counters                    | IA kickoff / impl design; Slice §13 taxonomy remains floor                               | Implementation design                                               |
| OQ-Δ-03 | Exact relationship fields between per-row events and `operation_summary`                                                | IMPL-REV-D-04 single-type model               | Impl design; dual-type only with new evidence + PO                                       | Implementation design                                               |
| OQ-Δ-04 | Acceptance evidence shape for same-txn vs forward-fix paths                                                             | IMPL-REV-D-05                                 | Test plan in IA / kickoff                                                                | Authorization acknowledgment + tests                                |
| OQ-Δ-05 | Entry **extension design details** (method surface, enable-guard, batch iteration internals) without second constructor | Option A compliance                           | Full-D IA package must bind                                                              | **Blocks IA** if design proposes second constructor or public DTO   |
| OQ-Δ-06 | Whether Entry remains unexported vs exported to a same-app consumer                                                     | Nest trust surface                            | IA binding                                                                               | Authorization design choice                                         |
| OQ-Δ-07 | Lease retry / timeout / heartbeat edge-case matrix refinements beyond Impl Planning §17                                 | Fail-closed ops                               | Impl design under COND-D-06 / IMPL-REV-D-02 guidance                                     | Implementation (not new max-window policy)                          |
| OQ-Δ-08 | D→E **handoff artifact format**                                                                                         | Residual verification                         | **Deferred to E** (OQ-D-08); D emits Slice §13 counters                                  | E planning — **not** D Slice Approval blocker                       |
| OQ-Δ-09 | Numeric systemic Vault abort threshold (if automation requires)                                                         | COND-D-05                                     | Only if needed; qualitative rule already ratified                                        | Optional / COND-D-05 — do not invent number here                    |
| OQ-Δ-10 | MINOR-01 remediation timing if IA ever proposes public/DTO ingress                                                      | Trust boundary                                | Remediation + fresh review **before** such IA                                            | Blocks any public-surface IA                                        |

**Do not resolve by assumption.**

---

## 10. E residual verification handoff

| Topic                       | Status                                                                                          | Source                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| E identity                  | Separate residual inventory + verification + gate release                                       | Planning Package; Slice Approval; Freeze C-06       |
| D must provide              | Slice §13 **counters** / durable audit outcomes for updated + blocked; residual NULL may remain | Freeze OQ-D-08; AC-D-04                             |
| E must independently verify | Post-backfill residual inventory / verification / gate release                                  | Slice Approval ownership table                      |
| Merge E into D?             | **Forbidden**                                                                                   | Planning Package non-scope; Impl Planning non-scope |
| Exact D→E artifact format   | **OPEN DECISION** — **DEFERRED to E**                                                           | Freeze OQ-D-08                                      |

```text
E HANDOFF STATUS: PRESERVED AS SEPARATE STAGE
D→E FORMAT: DEFERRED TO E PLANNING
D MUST NOT ABSORB E
```

---

## 11. Updated full-D planning baseline

### 11.1 Remains valid (substance)

- Conditional NULL→`live` UPDATE under B-04; Vault-proven EXCHANGE + Connected; Strategy B occupancy.
- Data-flow ordering: privileged invoke → fresh A preflight → B-04 start → per-attempt Vault+occupancy+C → write txn (CAS + conditional UPDATE + audit) → summary → release ([`v3-l02-fiv-conn-04-d-implementation-planning.md`](./v3-l02-fiv-conn-04-d-implementation-planning.md) §11), with **trusted entry = Option A Entry**.
- Failure/recovery matrix (§17); test-plan themes (§18); security fences (no public env API; no Vault mutation).
- IMPL-REV-D-01…06.
- Qualitative Vault systemic vs per-row rule (COND-D-05).

### 11.2 Superseded by this delta

- Inventory line **“New D orchestrator CREATE”** → **expand/absorb `Conn04SystemJobMigrationEntry`** (sole constructor).
- Architectural answer “New privileged orchestrator? Yes (proposed Nest service)” as a **second** surface → **Entry is the Nest privileged boundary**.
- NB-01 event type undecided → **`connection.environment-backfill` ratified** (implementation still pending).
- P-D-01 / P-D-02 still blocking in historical review checklists → **satisfied** for those prerequisites (P-D-03 **implementation** still required for runtime audits).

### 11.3 Historical only (do not treat as current baseline)

- Discovery/readiness lines saying P-D-03 UNDECIDED / OPEN (pre-ratification).
- Impl Planning Review checklist rows that listed P-D-01/P-D-02 unresolved at review date.

### 11.4 Binding conditions for any future full-D IA

1. Acknowledge this Planning Delta + IMPL-REV-D-01…06.
2. Bind Option A Entry expand/absorb; **forbid** second SYSTEM_JOB constructor.
3. Bind event type string `connection.environment-backfill`; require catalog+attribution delivery under authorization.
4. Bind IMPL-REV-D-06 freshness and IMPL-REV-D-05 forward-fix.
5. Bind no public HTTP/DTO/actor ingress **or** require MINOR-01 remediation first.
6. Explicitly state full D / backfill / production remain gated until that IA (and later gates) grant them.

---

## 12. Authorization boundaries

```text
THIS PLANNING DELTA DOES NOT AUTHORIZE:
  - P-D-03 catalog / attribution / helper implementation
  - Full FIV-CONN-04-D Implementation Authorization
  - Conn04SystemJobMigrationEntry expansion coding
  - Connection.environment UPDATE / backfill execution
  - Security Audit catalog mutation
  - Prisma / actorKind column / outbox
  - HTTP / UI / cron / scheduler / Trading Runtime
  - Second SYSTEM_JOB constructor
  - E implementation
  - Production activation / live capital / FIV PASS
  - Decision Register mutation
  - Stage / commit / push
```

```text
AFTER THIS DELTA (CURRENT STATE):
  P-D-02: SATISFIED
  P-D-03 / NB-01 DECISION: APPROVED — OPTION B
  P-D-03 IMPLEMENTATION: NOT AUTHORIZED
  PLANNING DELTA: CREATED
  FULL-D IMPLEMENTATION: NOT AUTHORIZED
  FULL-D BACKFILL: NOT AUTHORIZED
  PRODUCTION ACTIVATION: NOT AUTHORIZED
```

---

## 13. Evidence references (exact paths / headings)

| Topic               | Path                                                                                         | Headings / IDs                               |
| ------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| P-D-02 SAT          | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md` | Verdict; §4–§5 MINOR-PD02-PIR-01             |
| SYSTEM_JOB policy   | `.../v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`                          | Canonical actorId / actorKind                |
| Option A            | `.../v3-l02-fiv-conn-04-d-pd02-implementation-planning.md`                                   | §16.2.3 Selected architecture                |
| P-D-03 ratification | `.../v3-l02-fiv-conn-04-d-pd03-nb01-product-owner-ratification.md`                           | §§3–6                                        |
| P-D-03 discovery    | `.../v3-l02-fiv-conn-04-d-pd03-nb01-decision-discovery.md`                                   | §§6–8 persistence / candidate                |
| Full-D plan         | `.../v3-l02-fiv-conn-04-d-implementation-planning.md`                                        | §§9–17, §10 inventory                        |
| Full-D IPR          | `.../v3-l02-fiv-conn-04-d-implementation-planning-review.md`                                 | §§6–7, §12–16 IMPL-REV-D-01…06               |
| Decision Freeze     | `.../v3-l02-fiv-conn-04-d-decision-freeze.md`                                                | COND-D-01…06; OQ-D-06/08; §10 Security Audit |
| Slice Approval      | `.../v3-l02-fiv-conn-04-d-slice-approval.md`                                                 | AC-D-01…07; E ownership                      |
| Planning Package    | `.../v3-l02-fiv-conn-04-d-planning-package.md`                                               | D vs E identity; D-CONN-04 trace             |
| Readiness           | `.../v3-l02-fiv-conn-04-d-readiness-reassessment.md`                                         | §§5–8                                        |
| Decision Register   | `.../wave-6-po-decision-register.md`                                                         | D-CONN04-PD02-SAT; D-CONN04-PD03-NB01        |

---

## 14. Git provenance and change inventory (this act)

| Item   | Value                                      |
| ------ | ------------------------------------------ |
| Branch | `main`                                     |
| HEAD   | `953292675e197d4f25778aaaa59eacb2826560fe` |
| Index  | empty (no stage/commit/push)               |

| Path                                                                            | Action                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-planning-delta.md`          | **Create** (this artifact)                             |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-planning.md` | **Append** minimal reader note only                    |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-readiness-reassessment.md`  | **Append** / extend forward-reference reader note only |

**Not modified:** application source, tests, Security Audit catalog, Prisma, Decision Register, P-D-02/P-D-03 ratification bodies (beyond any prior reader notes), historical review bodies.

---

## 15. Independent quality checklist (author self-check)

1. Both PO decisions referenced correctly — **YES**.
2. No silent rewrite of historical decisions — **YES** (supersession table only).
3. Option A unambiguous; one trusted Entry — **YES**.
4. Event type ratified but not claimed implemented — **YES**.
5. No exact payload fields invented — **YES**.
6. Per-row + `operation_summary` retained — **YES**.
7. IMPL-REV-D-01…06 all accounted — **YES**.
8. Fresh Vault + occupancy + C before each write — **YES** (IMPL-REV-D-06).
9. B-04 internal authority — **YES**.
10. E separate — **YES**.
11. Unresolved items visible — **YES** (§9).
12. No implementation authorization inferred — **YES** (§12).

**END OF FIV-CONN-04-D CONTROLLED PLANNING DELTA**
