# FIV-CONN-04-D — P-D-03 / NB-01 Product Owner Ratification

**Document:** Formal Product Owner ratification of the Security Audit event-type decision (P-D-03 / NB-01)  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Decision ID:** **D-CONN04-PD03-NB01**  
**Authority:** Product Owner  
**Status:** **APPROVED — OPTION B**  
**Nature:** **GOVERNANCE DECISION / CONTRACT DIRECTION ONLY.** Does **not** implement the event type. Does **not** modify the Security Audit catalog, attribution code, adapters, or Prisma schema. Does **not** authorize full FIV-CONN-04-D implementation, backfill execution, or production activation. Does **not** stage, commit, or push.

```text
D-CONN04-PD03-NB01 = APPROVED — OPTION B
DECISION DATE: 2026-10-30
AUTHORITY: Product Owner
EVENT TYPE: connection.environment-backfill

P-D-03 / NB-01 DECISION: APPROVED
P-D-03 IMPLEMENTATION: NOT STARTED / NOT AUTHORIZED
FULL-D PLANNING DELTA: PENDING
FULL-D IMPLEMENTATION AUTHORIZATION: NOT GRANTED
FULL D BACKFILL: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

---

## 1. Context and original blocker

Full-D Implementation Authorization was blocked until P-D-03 / NB-01 — the explicit Security Audit **event-type admission** for FIV-CONN-04-D write-path durable audits — was decided ([`v3-l02-fiv-conn-04-d-implementation-planning-review.md`](./v3-l02-fiv-conn-04-d-implementation-planning-review.md) §§12–16; [`v3-l02-fiv-conn-04-d-readiness-reassessment.md`](./v3-l02-fiv-conn-04-d-readiness-reassessment.md) §8).

Discovery established that the Security Audit catalog is closed, that no equivalent environment-backfill event exists, and that Option B (dedicated type) is the viable primary representation ([`v3-l02-fiv-conn-04-d-pd03-nb01-decision-discovery.md`](./v3-l02-fiv-conn-04-d-pd03-nb01-decision-discovery.md)).

---

## 2. Evidence reviewed

| Artifact                                                                                                                           | Role                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`v3-l02-fiv-conn-04-d-pd03-nb01-decision-discovery.md`](./v3-l02-fiv-conn-04-d-pd03-nb01-decision-discovery.md)                   | Decision discovery — DECISION-READY WITH OPEN QUESTIONS                 |
| [`v3-l02-fiv-conn-04-d-readiness-reassessment.md`](./v3-l02-fiv-conn-04-d-readiness-reassessment.md)                               | P-D-03 listed OPEN / BLOCKING for IA                                    |
| [`v3-l02-fiv-conn-04-d-implementation-planning.md`](./v3-l02-fiv-conn-04-d-implementation-planning.md) §9 COND-D-02                | PROPOSED candidate + lifecycle alternate                                |
| [`v3-l02-fiv-conn-04-d-implementation-planning-review.md`](./v3-l02-fiv-conn-04-d-implementation-planning-review.md)               | P-D-03 BLOCKING; IMPL-REV-D-04 / D-05                                   |
| [`v3-l02-fiv-conn-04-d-decision-freeze.md`](./v3-l02-fiv-conn-04-d-decision-freeze.md) COND-D-02                                   | Substance ratified; type deferred                                       |
| [`v3-l02-fiv-conn-04-d-slice-approval.md`](./v3-l02-fiv-conn-04-d-slice-approval.md)                                               | AC-D-04 substance; NB-01 deferred                                       |
| [`v3-l02-fiv-conn-04-d-planning-package.md`](./v3-l02-fiv-conn-04-d-planning-package.md)                                           | NB-01 open question                                                     |
| [`v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md)   | P-D-02 SAT; P-D-03 not satisfied by that act                            |
| [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md) | Canonical SYSTEM_JOB attribution; no Prisma `actorKind` column required |
| [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md)                                                               | Register sync target                                                    |

**Consistency check (pre-ratification):** Discovery findings remain aligned with this approval (closed catalog; candidate absent; txn-capable persistence; no outbox required; Option A clean reuse unavailable; Option B viable). No conflicting prior `D-CONN04-PD03-NB01` entry existed.

---

## 3. Exact approved decision

```text
PRODUCT OWNER DECISION: APPROVE OPTION B — DEDICATED SECURITY AUDIT EVENT TYPE
DECISION ID: D-CONN04-PD03-NB01
DECISION DATE: 2026-10-30
AUTHORITY: Product Owner
STATUS: APPROVED — OPTION B
EVENT TYPE: connection.environment-backfill
```

### Approved contract direction

1. Approve a dedicated Security Audit event type: **`connection.environment-backfill`**.
2. The event represents the FIV-CONN-04-D operation that conditionally backfills `Connection.environment` for eligible records.
3. Preserve approved audit requirements:
   - Durable **per-row** audit for each required write disposition.
   - Operation-level summary (`operation_summary`).
   - Explicit representation of **updated** and **blocked** outcomes (AC-D-04).
   - Canonical **SYSTEM_JOB** attribution established by the ratified P-D-02 boundary (`system-job:fiv-conn-04-migration-backfill` when that path executes).
4. Use the existing Security Audit persistence architecture and `TransactionContext` capability.
5. Prefer same-transaction persistence where supported by the approved design.
6. Preserve **IMPL-REV-D-05** failure and forward-fix requirements.
7. Do **not** introduce a separate Prisma `actorKind` column solely for this decision.
8. Do **not** introduce a second catalog event type for operation summary unless subsequent technical evidence shows one event type cannot safely represent both required audit scopes.

---

## 4. Approved direction vs deferred implementation details

**Approved by this act:** event-type **admission direction** and the contract constraints above.

**Explicitly deferred** (require subsequent planning / Implementation Authorization / implementation — **not** ratified here):

- Exact payload schema and sanitizer allowlist.
- Exact metadata / attribution validation rules for the new type.
- Detailed mapping of per-row disposition outcomes and `operation_summary` fields.
- Catalog and attribution **code** registration.
- Adapter / helper implementation and tests.
- Any persistence changes beyond using the existing txn-capable API.
- Full-D orchestration planning delta (Option A Entry absorption) and full-D Implementation Authorization.

**This decision does not claim** that `connection.environment-backfill` has been added to the runtime catalog.

---

## 5. Constraints for future planning and implementation

1. Catalog admission requires coordinated updates to classification + attribution rules before emission.
2. Unclassified emission must remain refuse-closed until registration is authorized and delivered.
3. D write-path audits MUST use the ratified type string character-for-character once implemented.
4. Row dispositions and `operation_summary` remain **outcomes of this single type** unless a later evidenced exception is separately approved.
5. SYSTEM_JOB runs MUST attribute `actorId` to the P-D-02 canonical identity; OPERATOR compatibility paths remain as otherwise authorized.
6. Full-D planning delta MUST incorporate this ratification and must not reopen NB-01 without a new PO act.

---

## 6. Explicit exclusions / non-authorization

```text
DOES NOT AUTHORIZE:
  - Catalog or attribution code changes
  - P-D-03 implementation delivery
  - Full FIV-CONN-04-D Implementation Authorization
  - Connection.environment UPDATE / backfill execution
  - Production activation / live capital / FIV PASS
  - HTTP / UI / cron / Trading Runtime D paths
  - Prisma actorKind column
  - New transactional outbox for Security Audit
```

---

## 7. Cross-references

| Artifact               | Link                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Discovery              | [`v3-l02-fiv-conn-04-d-pd03-nb01-decision-discovery.md`](./v3-l02-fiv-conn-04-d-pd03-nb01-decision-discovery.md)                   |
| Readiness reassessment | [`v3-l02-fiv-conn-04-d-readiness-reassessment.md`](./v3-l02-fiv-conn-04-d-readiness-reassessment.md)                               |
| Decision Register      | [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md) — `D-CONN04-PD03-NB01`                                        |
| P-D-02 SAT             | [`v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md)   |
| SYSTEM_JOB policy      | [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md) |

---

## 8. Git provenance and change inventory (this act)

| Item   | Value                                      |
| ------ | ------------------------------------------ |
| Branch | `main`                                     |
| HEAD   | `953292675e197d4f25778aaaa59eacb2826560fe` |
| Index  | empty (no stage/commit/push)               |

| Path                                                                    | Action                                                               |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `docs/.../v3-l02-fiv-conn-04-d-pd03-nb01-product-owner-ratification.md` | **Create** (this artifact)                                           |
| `docs/.../wave-6-po-decision-register.md`                               | **Update** — CURRENT STATE + `D-CONN04-PD03-NB01` entry              |
| `docs/.../v3-l02-fiv-conn-04-d-pd03-nb01-decision-discovery.md`         | **Append** reader note only (historical discovery body preserved)    |
| `docs/.../v3-l02-fiv-conn-04-d-readiness-reassessment.md`               | **Append** reader note only (historical reassessment body preserved) |

**Not modified:** application source, tests, Security Audit catalog/code, Prisma schema, full-D planning body, P-D-02 artifacts.

---

## 9. Status after this ratification

```text
P-D-02: SATISFIED
P-D-03 / NB-01 DECISION: APPROVED — OPTION B (D-CONN04-PD03-NB01)
P-D-03 IMPLEMENTATION: NOT STARTED / NOT AUTHORIZED
FULL-D PLANNING DELTA: PENDING
FULL-D IMPLEMENTATION AUTHORIZATION: NOT GRANTED
FULL D BACKFILL: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**END OF P-D-03 / NB-01 PRODUCT OWNER RATIFICATION**
