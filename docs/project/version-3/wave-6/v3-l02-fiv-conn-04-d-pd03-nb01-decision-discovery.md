# FIV-CONN-04-D — P-D-03 / NB-01 Decision Discovery

**Document:** Evidence-first technical and governance discovery for the unresolved Security Audit event-type decision (P-D-03 / NB-01)  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Nature:** **DISCOVERY ONLY.** Does **not** decide NB-01. Does **not** create a P-D-03 ratification/disposition. Does **not** modify application source, tests, schemas, audit catalog, Decision Register, or authorization artifacts. Does **not** authorize full D. Does **not** stage, commit, or push. Creates **only** this report.

```text
DISCOVERY VERDICT: DECISION-READY WITH OPEN QUESTIONS

P-D-03 / NB-01: UNDECIDED (BLOCKING FOR FULL-D IMPLEMENTATION AUTHORIZATION)
CANDIDATE: connection.environment-backfill (PROPOSED ONLY — NOT APPROVED)
FULL D IMPLEMENTATION: NOT AUTHORIZED
FULL D BACKFILL: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**Labels:** **FACT** | **INTERPRETATION** | **RECOMMENDATION**

> **Reader note (2026-10-30, post-discovery):** Product Owner subsequently ratified **OPTION B** as **D-CONN04-PD03-NB01** — dedicated event type `connection.environment-backfill` ([`v3-l02-fiv-conn-04-d-pd03-nb01-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-pd03-nb01-product-owner-ratification.md); Decision Register). The discovery body below is preserved as the pre-decision evidence package. It must **not** be read as claiming catalog implementation or full-D authorization. Status lines that say “UNDECIDED” / “PROPOSED ONLY — NOT APPROVED” describe the state **at discovery time**.

---

## 1. Executive summary

**FACT:** Full-D Implementation Authorization remains blocked until P-D-03 / NB-01 is explicitly decided ([`v3-l02-fiv-conn-04-d-implementation-planning-review.md`](./v3-l02-fiv-conn-04-d-implementation-planning-review.md) §§12–16). No P-D-03 disposition artifact exists. The Security Audit catalog is a **closed, Product Owner–approved admission set**: unclassified event types are refused at `SecurityAuditService.record`.

**FACT:** Existing `connection.*` types are:

| Event type                  | Investigation purpose (catalog)                                     | Domain helper outcomes (code)                                       |
| --------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `connection.validation`     | Who started validation…                                             | Validation path                                                     |
| `connection.lifecycle`      | Who changed a connection **lifecycle state or credential material** | `credentials_replaced` \| `disconnected` \| `disabled` \| `revoked` |
| `connection.migration-gate` | Who acquired/released/… the **migration-gate lease**                | Lease outcomes (`gate_acquired`, …)                                 |

**FACT:** `connection.environment-backfill` is **absent** from `security-audit-classification.ts`. No equivalent environment NULL→`live` audit event exists under another name.

**INTERPRETATION:** Reusing `connection.lifecycle` or `connection.migration-gate` for D environment UPDATE would overload investigation semantics and existing outcome contracts. A **dedicated catalog event type** (Option B) is the only currently **compatible** primary representation for D write-path audits. Row vs operation semantics can be expressed as **outcomes on one type** (IMPL-REV-D-04 accepted proposed binding) — separate catalog types (Option C) are **not required** by evidence.

**RECOMMENDATION:** Present the Product Owner with a narrow decision: approve a dedicated `connection` event type (candidate name `connection.environment-backfill` or an explicitly chosen alternate), or reject dedicated type and accept a written incompatibility justification for lifecycle reuse (not recommended by evidence).

---

## 2. Repository provenance

| Item                                        | Value                                              | Label |
| ------------------------------------------- | -------------------------------------------------- | ----- |
| Branch                                      | `main`                                             | FACT  |
| HEAD                                        | `953292675e197d4f25778aaaa59eacb2826560fe`         | FACT  |
| Index                                       | empty                                              | FACT  |
| Working tree                                | Dirty/untracked preserved (~75 paths); not cleaned | FACT  |
| This task change                            | **Only** this discovery report created             | FACT  |
| Code / catalog / schema / Decision Register | **Unchanged** by this task                         | FACT  |

---

## 3. Governance baseline

| Artifact               | Relevant status                                                                      | Path                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Readiness reassessment | P-D-03 **OPEN / BLOCKING**; candidate absent                                         | [`v3-l02-fiv-conn-04-d-readiness-reassessment.md`](./v3-l02-fiv-conn-04-d-readiness-reassessment.md) §§1, 8                           |
| Impl Planning Review   | P-D-03 BLOCKING until decided; IMPL-REV-D-04/05 accepted                             | [`v3-l02-fiv-conn-04-d-implementation-planning-review.md`](./v3-l02-fiv-conn-04-d-implementation-planning-review.md) §§6.4–6.5, 12–16 |
| Impl Planning          | COND-D-02 PROPOSED candidate + alternate lifecycle                                   | [`v3-l02-fiv-conn-04-d-implementation-planning.md`](./v3-l02-fiv-conn-04-d-implementation-planning.md) §9 COND-D-02, OQ-D-06          |
| Decision Freeze        | COND-D-02 substance ratified; event-type **DEFERRED**                                | [`v3-l02-fiv-conn-04-d-decision-freeze.md`](./v3-l02-fiv-conn-04-d-decision-freeze.md) COND-D-02                                      |
| Slice Approval         | AC-D-04 substance frozen; NB-01 deferred to Impl Planning                            | [`v3-l02-fiv-conn-04-d-slice-approval.md`](./v3-l02-fiv-conn-04-d-slice-approval.md) AC-D-04, COND-D-02                               |
| Planning package       | NB-01 open; new type vs extend lifecycle                                             | [`v3-l02-fiv-conn-04-d-planning-package.md`](./v3-l02-fiv-conn-04-d-planning-package.md) NB-01 / catalog notes                        |
| P-D-02 SAT             | P-D-03 **not** satisfied by that act                                                 | [`v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md)      |
| SYSTEM_JOB policy      | `attribution.actorId` mandatory for gate; Prisma `actorKind` column **not** required | [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md) §9 |
| Decision Register      | Full D / P-D-03 not authorized; P-D-02 SAT recorded                                  | [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md)                                                                  |
| P-D-03 disposition     | **None**                                                                             | FACT                                                                                                                                  |

**Full-D IA status (FACT):** **NOT AUTHORIZED**.

---

## 4. Security Audit architecture map

### 4.1 Production persist path (FACT)

```text
Domain audit helper (Connections / Vault / Authz / …)
  → SecurityAuditService.record(SecurityAuditWrite, TransactionContext?)
       · refuse if eventType not in CATALOG
       · normalize attribution rules per eventType
       · strip/refuse sensitive payload keys
       · compute integrityHash + fingerprint
  → SecurityAuditRepository.append(record, transaction?)
  → PrismaSecurityAuditRepository.append
       · prismaClientForTransaction(tx) OR root PrismaClient
       · securityAuditRecord.create(...)   // append-only
```

| Component              | Path                                                                   | Role                                                                                           | Surface                           |
| ---------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------- |
| Classification catalog | `apps/api/src/modules/security-audit/security-audit-classification.ts` | Closed admission set; `isClassifiedSecurityAuditEvent`                                         | Internal module                   |
| Attribution rules      | `…/security-audit-attribution.ts`                                      | Required fields per `eventType`                                                                | Internal                          |
| Write API              | `…/security-audit.service.ts` `record` L29–79                          | Persist classified facts                                                                       | Internal Nest service             |
| Port                   | `…/security-audit.repository.ts`                                       | Append-only; optional txn                                                                      | Internal                          |
| Prisma adapter         | `…/prisma-security-audit.repository.ts` `append` L14–38                | Durable insert                                                                                 | Persistence                       |
| Schema                 | `apps/api/prisma/schema.prisma` `SecurityAuditRecord` L96–123          | Columns: eventType, actorId, workspaceId, correlationId, payload Json; **no actorKind column** | Persistence                       |
| Timeline consumer      | `…/security-audit-timeline.service.ts` + controller                    | Workspace chronological read                                                                   | Investigation API                 |
| Log emitter adapter    | `…/security-audit-emitter.adapter.ts`                                  | Maps selected log events → writes                                                              | Parallel path (not Connections D) |

### 4.2 Connections domain emitters (FACT)

| Helper                         | Path                                        | eventType                   | Passes `TransactionContext`? |
| ------------------------------ | ------------------------------------------- | --------------------------- | ---------------------------- |
| `ConnectionMigrationGateAudit` | `connection-migration-gate-audit.ts` L14–45 | `connection.migration-gate` | **Yes** (optional 2nd arg)   |
| `ConnectionLifecycleAudit`     | `connection-lifecycle-audit.ts` L12–31      | `connection.lifecycle`      | **No**                       |
| Gate adapter                   | `prisma-migration-gate.adapter.ts` (~L846)  | via gate audit              | **Yes** (lease txn)          |

### 4.3 Tests (FACT, representative)

- `security-audit.service.spec.ts` — refuse unclassified; persist shape
- `security-audit-attribution.spec.ts` — required attribution fields
- `fiv-conn-04-b-05-audit-integrity.spec.ts` — gate audit → `record` with txn
- `connection-migration-gate-audit.spec.ts` — sanitization / required actorId

---

## 5. Existing event catalog and naming conventions

**FACT:** Catalog comment (classification L1–4): Product Owner–approved admission catalogue; fixed payload story per type.

**Naming convention (FACT / INTERPRETATION):** `<domain>.<concern>` dotted strings (`connection.lifecycle`, `vault.lifecycle`, `authz.role-change`). `connection.*` share `eventClass: 'connection'`.

**Extensibility (FACT):** Extensible **only by code change** to `CATALOG` + matching `ATTRIBUTION_RULES`. Runtime inventing types fails closed (`SecurityAuditService.record` throws unclassified).

**Exhaustiveness (FACT):** Closed set for admission. Outcomes are free-form strings at the service layer (typed in domain helpers).

---

## 6. Candidate event analysis (`connection.environment-backfill`)

| Question                                        | Finding                                                                                                                                                              | Label                                                                                          |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Equivalent event under another name?            | **No** for NULL→`live` environment mutation                                                                                                                          | FACT                                                                                           |
| Catalog exhaustive vs extensible?               | Exhaustive at runtime; extensible via catalog edit                                                                                                                   | FACT                                                                                           |
| Naming match?                                   | Matches `connection.*` dotted convention                                                                                                                             | INTERPRETATION                                                                                 |
| Semantic fit of candidate                       | D write-window environment backfill / disposition — distinct from lease and credential lifecycle                                                                     | INTERPRETATION (aligned with Impl Planning COND-D-02 evidence)                                 |
| Single type vs two types                        | IMPL-REV-D-04 accepts **per-row durable audit + `operation_summary`** as outcomes on the write path                                                                  | APPROVED DESIGN (review) / PROPOSED DESIGN (plan OQ-D-06) — **not** requiring two catalog keys |
| Can lifecycle safely represent mutation?        | Investigation text = lifecycle/credential; outcomes enum excludes env update                                                                                         | FACT → **incompatible as-is**                                                                  |
| Can migration-gate represent mutation?          | Investigation + outcomes = lease only                                                                                                                                | FACT → **incompatible**                                                                        |
| Distinguish attempt/success/skip/fail/recovery? | Controlling docs require durable audit for **updated + blocked**; skip outcomes proposed; forward-fix after audit fail; residual verification → **E**, not D catalog | See §7                                                                                         |

**Candidate status:** **PROPOSED ONLY** — not approved; not registered.

---

## 7. Full-D audit requirements traceability matrix

| Requirement                                                                                    | Classification                                            | Source                                                                      |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| Durable Security Audit for **updated and blocked** rows                                        | **EXPLICIT REQUIREMENT** (substance)                      | AC-D-04 / D-CONN-04-09; Slice Approval; Decision Freeze COND-D-02 substance |
| Exact event **type string**                                                                    | **OPEN DECISION** (P-D-03 / NB-01)                        | Impl Planning COND-D-02; Review §12 P-D-03                                  |
| Candidate `connection.environment-backfill`                                                    | **PROPOSED DESIGN**                                       | Impl Planning COND-D-02; Slice §13 preferred (via plan citation)            |
| Alternative: extend `connection.lifecycle`                                                     | **PROPOSED DESIGN** (allowed if Review rejects dedicated) | Impl Planning COND-D-02 “Alternative … remains allowed”                     |
| SYSTEM_JOB canonical `actorId` on D/gate attribution                                           | **EXPLICIT REQUIREMENT** (policy)                         | PO ratification §9; P-D-02 SAT identity                                     |
| Persist `actorKind` as Prisma column                                                           | **NOT REQUIRED** for initial path                         | PO ratification §9                                                          |
| `actorKind` in audit metadata                                                                  | **OPEN / DEFERRED** (optional)                            | PO ratification §9                                                          |
| Per-row durable audit during write window                                                      | **APPROVED DESIGN** (IMPL-REV-D-04 ACCEPTED PROPOSED)     | Impl Planning Review §6.4 / §13                                             |
| One `operation_summary` (+ counters) per run                                                   | **APPROVED DESIGN** (same IMPL-REV-D-04)                  | Review §6.4; plan OQ-D-06                                                   |
| Same-txn audit preferred when API allows                                                       | **APPROVED DESIGN** (IMPL-REV-D-05)                       | Review §6.5                                                                 |
| Audit fail after UPDATE → forward-fix; no auto LIVE→NULL; mark run errors                      | **EXPLICIT REQUIREMENT** / ACCEPTED                       | Slice failure matrix; Review IMPL-REV-D-05; plan §17                        |
| Idempotency via `correlationId` reuse                                                          | **PROPOSED DESIGN**                                       | Impl Planning COND-D-02                                                     |
| Payload fields list (connectionId, previous/new env, disposition, opaque vaultSecretId, …)     | **EXPLICIT REQUIREMENT** (substance / Slice §13 via plan) | Impl Planning COND-D-02 payload table                                       |
| Outcomes minimum: `updated_live`, blocked_*, `skipped_no_longer_eligible`, `operation_summary` | **PROPOSED DESIGN** (minimum set)                         | Impl Planning COND-D-02                                                     |
| Residual verification audits                                                                   | **NOT REQUIRED for D** (deferred to E)                    | OQ-D-08 / Slice E ownership                                                 |
| New transactional outbox for audit                                                             | **NOT REQUIRED / NOT EVIDENCED** by D docs                | Outbox exists for orders/execution only                                     |
| OPERATOR reclaim path unchanged                                                                | **EXPLICIT** (B path / P-D-02 compatibility)              | B-04 / reclaim tests; P-D-02 PIR                                            |

---

## 8. Persistence and transaction analysis

| Question                                | Finding                                                                                                   | Label                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Can audit + mutation share one DB txn?  | **Yes** — `SecurityAuditService.record(..., transaction?)` → repository uses `prismaClientForTransaction` | FACT (`security-audit.service.ts` L29–31; `prisma-security-audit.repository.ts` L14–16) |
| Does adapter accept txn client?         | **Yes**                                                                                                   | FACT                                                                                    |
| Current Connections gate path           | Same lease txn for gate audits                                                                            | FACT                                                                                    |
| Current lifecycle path                  | Independent `record` (no txn arg)                                                                         | FACT                                                                                    |
| Durable before vs after mutation commit | If same txn: atomic with UPDATE. If separate: audit can fail after commit → forward-fix required          | FACT + EXPLICIT recovery rule                                                           |
| Failure modes                           | Unclassified type throw; attribution missing throw; sensitive key throw; DB create fail                   | FACT                                                                                    |
| Outbox for Security Audit?              | **No** product path                                                                                       | FACT                                                                                    |
| Must D invent outbox?                   | **No** — docs prefer same-txn; forward-fix if audit fails after UPDATE                                    | INTERPRETATION grounded in IMPL-REV-D-05                                                |

**Gap (INTERPRETATION):** Until NB-01 type is catalogued, D cannot lawfully emit write-path audits. Persistence **capability** already supports the preferred same-txn model; the **admission** gap is the open decision.

---

## 9. Failure / recovery behavior (from controlling docs)

| Scenario                            | Required behavior                                                                                 | Class                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Audit fails after successful UPDATE | Forward-fix; retry audit; **do not** auto-revert env to NULL; mark run errors; operator reconcile | EXPLICIT                             |
| Non-eligible / blocked              | Skip/continue with durable blocked audit                                                          | EXPLICIT (AC-D-04)                   |
| Lease / CAS ownership lost          | Stop writes; gate/CAS semantics                                                                   | EXPLICIT (B freeze)                  |
| Duplicate run / idempotent UPDATE   | 0-row UPDATE; skip audit story                                                                    | PROPOSED / frozen predicates         |
| Historical audit rewrite/delete     | Forbidden                                                                                         | EXPLICIT (PO ratification lifecycle) |

---

## 10. Product Owner options matrix

### Option A — Reuse an existing audit event

| Field            | Assessment                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Candidate types  | `connection.lifecycle` or `connection.migration-gate`                                                                                                        |
| Semantic         | Lifecycle = credential/lifecycle material; gate = lease                                                                                                      |
| Compatibility    | **Unsupported / incompatible** without rewriting catalog investigation value + domain outcome contracts + risk of investigation ambiguity                    |
| Availability     | **Mark UNAVAILABLE as a clean reuse** without contract change                                                                                                |
| Effect on P-D-03 | Would require PO to **explicitly** override Slice preference and redefine lifecycle/gate meaning — effectively a larger decision than registering a new type |
| Further approval | Yes — and likely harmful                                                                                                                                     |

### Option B — Add one dedicated event type

| Field                       | Assessment                                                                                                                                                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Semantic                    | Durable D write-window environment backfill dispositions (updated / blocked / skipped / operation summary)                                                                                                                                                        |
| Scope                       | Catalog + attribution rule + D audit helper (post full-D IA); **not** this discovery                                                                                                                                                                              |
| Naming                      | Candidate `connection.environment-backfill` matches convention; **not pre-approved** — PO may choose alternate string                                                                                                                                             |
| Required fields (evidenced) | `attribution.actorId` (canonical SYSTEM_JOB id for SYSTEM_JOB runs); payload substance per Slice §13 / plan COND-D-02; workspace/resource attribution **recommended** for row events (lifecycle pattern) — exact attribution rule set **OPEN** until registration |
| Persistence / txn           | Same-txn preferred via existing `TransactionContext` overload                                                                                                                                                                                                     |
| Catalog/consumers           | Timeline indexes by `eventType`; new type appears in investigation once registered                                                                                                                                                                                |
| Implementation impact       | Modify `security-audit-classification.ts` + `security-audit-attribution.ts` + new Connections helper; **after** PO decision **and** full-D IA                                                                                                                     |
| Risks                       | Wrong name; secret leakage if sanitizer weak; conflating summary vs row if outcomes poorly bounded                                                                                                                                                                |
| Effect on P-D-03            | **Disposes** NB-01 when formally recorded                                                                                                                                                                                                                         |
| Further governance          | Formal P-D-03 disposition + later full-D IA acknowledgment                                                                                                                                                                                                        |

### Option C — Separate row-level and operation-level **catalog** event types

| Field                | Assessment                                                        |
| -------------------- | ----------------------------------------------------------------- |
| Semantic             | Two `eventType`s vs one type with `operation_summary` outcome     |
| Evidence need        | IMPL-REV-D-04 accepts **one** write-path model: per-row + summary |
| Compatibility        | Possible technically; **not required** by approved review binding |
| Recommendation class | **Not preferred** unless PO wants stronger query split            |
| Effect on P-D-03     | Would expand NB-01 to **two** type decisions                      |

### Option D — Other evidence-based alternative

| Field                                   | Assessment                                                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extend lifecycle with new outcomes only | Technically possible but **conflicts** with published investigationValue and current outcome type union — treat as **non-viable without PO-approved catalog rewrite** |
| Use migration-gate for env UPDATE       | **Non-viable** — lease semantics                                                                                                                                      |
| Outbox-mediated audit                   | Existing outbox is for trading/orders; **not evidenced** as D requirement                                                                                             |

---

## 11. Recommended decision question

**Product Owner decision required (P-D-03 / NB-01):**

> For FIV-CONN-04-D durable Security Audit of conditional `Connection.environment` NULL→`live` write dispositions, which event **admission** contract shall D use?
>
> 1. **Approve a dedicated `connection` catalog event type** for D write-path audits (preferred technical fit). Confirm or replace the candidate name `connection.environment-backfill`. Confirm that **row dispositions and `operation_summary` are outcomes of this single type** (per IMPL-REV-D-04), unless you explicitly require Option C dual types.
> 2. **Reject dedicated type** and mandate reuse/extension of `connection.lifecycle` or another existing type — only with an explicit acknowledgment that this **redefines** that type’s investigation contract (evidence currently marks clean reuse **unavailable**).
>
> Leaving P-D-03 undecided continues to **block** full-D Implementation Authorization (Impl Planning Review §§12–16). Approving a dedicated type will require a later catalog/attribution registration under full-D Implementation Authorization (or a narrowly scoped follow-on), **not** a Prisma `actorKind` column. No schema migration is required solely for the event-type string.

**Technically viable now:** Option B (dedicated type).  
**Unsupported as clean reuse:** Option A.  
**Optional / not required:** Option C dual catalog types.

---

## 12. Explicit unresolved items

| Item                                                      | Status                                  |
| --------------------------------------------------------- | --------------------------------------- |
| Exact event type string                                   | OPEN (P-D-03)                           |
| Attribution rule set for new type (workspaceId required?) | OPEN until registration design under IA |
| Exact `blocked_*` outcome enumerations                    | OPEN / PROPOSED family                  |
| Whether `actorKind` appears in payload metadata           | DEFERRED optional (PO policy)           |
| Formal P-D-03 disposition artifact                        | **Not created** by this discovery       |
| Full-D IA                                                 | NOT AUTHORIZED                          |

---

## 13. Authorization boundaries

```text
THIS DISCOVERY ≠ P-D-03 DECISION
THIS DISCOVERY ≠ FULL-D IMPLEMENTATION AUTHORIZATION
P-D-03: UNDECIDED until Product Owner decision and formal recording
FULL D IMPLEMENTATION: NOT AUTHORIZED
FULL D BACKFILL: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

---

## 14. Exact source references

| Claim                                | Reference                                                                                |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| Closed catalog + refuse unclassified | `security-audit-classification.ts` L29–184, L192–193; `security-audit.service.ts` L33–36 |
| Attribution rules connection.*       | `security-audit-attribution.ts` L39–54                                                   |
| Txn-capable record/append            | `security-audit.service.ts` L29–31; `prisma-security-audit.repository.ts` L14–16         |
| No actorKind column                  | `schema.prisma` `SecurityAuditRecord` L96–123                                            |
| Lifecycle outcomes                   | `connection-lifecycle-audit.ts` L5–6, L19–30                                             |
| Gate event + outcomes                | `migration-gate.ts` L137–152                                                             |
| Gate audit txn                       | `connection-migration-gate-audit.ts` L14–44                                              |
| P-D-03 blocking                      | Impl Planning Review §§12–16                                                             |
| Candidate + alternative              | Impl Planning §9 COND-D-02                                                               |
| Per-row + summary accepted           | Impl Planning Review IMPL-REV-D-04                                                       |
| Forward-fix                          | Impl Planning Review IMPL-REV-D-05; plan §17                                             |
| Outbox not on audit path             | Orders/execution use `TransactionalOutboxAppender`; Security Audit does not              |

---

## 15. File-change inventory and final Git state

| Path                                                                                 | Action      |
| ------------------------------------------------------------------------------------ | ----------- |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-pd03-nb01-decision-discovery.md` | **Created** |

| Control                                                                 | Result                                              |
| ----------------------------------------------------------------------- | --------------------------------------------------- |
| Branch / HEAD                                                           | `main` / `953292675e197d4f25778aaaa59eacb2826560fe` |
| Index                                                                   | empty                                               |
| Code / tests / schema / catalog / Decision Register / P-D-02 / planning | **Not modified**                                    |
| Stage / commit / push                                                   | **None**                                            |

**END OF P-D-03 / NB-01 DECISION DISCOVERY**
