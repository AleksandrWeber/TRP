# RC-21 Epic 2 — Knowledge Lake Ingestion Port

**Status:** Implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** Append-only analytical fact admission only  
**Parent:** [RC-21 Implementation Plan](./rc-21-implementation-plan.md) · [Epic Breakdown](./rc-21-epic-breakdown.md) · [API Contract](./rc-21-api-contract.md)  
**Predecessor:** [Epic 1 — Knowledge Lake Boundary](./rc-21-epic1-knowledge-lake-boundary.md)

---

## Implementation Report

### What shipped

- `KnowledgeLakeIngestionPort` (`KNOWLEDGE_LAKE_INGESTION_PORT`) with:
  - `admit(fact)` → `admitted` | `duplicate` | `rejected`
  - `admitMany(facts)` → same per-item semantics
- Immutable `AnalyticalFactAdmission` / `AnalyticalFact` contract types
- Validation for required fields: `eventId`, `occurredAt`, `producer`, `category`, `workspaceId`, `payload`, `schemaVersion` (+ `mode` per contract; System may omit)
- Closed category / mode checks; JSON-serializable payload check
- Idempotent admission by `eventId` (first-wins; duplicate = success)
- Process-local `InMemoryKnowledgeLakeIngestionAdapter` (append-only buffer — **not** a DB/persistence product)
- Deep-frozen admitted facts (immutable contract)
- Boundary `activePorts.ingestion = true`; query / persistence / producers remain `false`
- Module wiring + Nest smoke test

### Modules touched

| Path                                                                                          | Change                                  |
| --------------------------------------------------------------------------------------------- | --------------------------------------- |
| `apps/api/src/modules/knowledge-lake/ports/knowledge-lake-ingestion.port.ts`                  | **New** ingestion port                  |
| `apps/api/src/modules/knowledge-lake/domain/analytical-fact-admission.ts`                     | **New** admission contract + validation |
| `apps/api/src/modules/knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter.ts` | **New** in-memory admit adapter         |
| `apps/api/src/modules/knowledge-lake/domain/knowledge-lake-boundary.ts`                       | Epic 2 activePorts                      |
| `apps/api/src/modules/knowledge-lake/knowledge-lake.module.ts`                                | Register / export port                  |
| `apps/api/src/modules/knowledge-lake/index.ts`                                                | Public exports                          |
| `apps/api/src/modules/knowledge-lake/README.md`                                               | Epic 2 scope                            |

### Ports / APIs affected

| Surface                      | Detail                                   |
| ---------------------------- | ---------------------------------------- |
| `KnowledgeLakeIngestionPort` | **New** — internal application port only |
| HTTP / REST                  | **None**                                 |
| Query Port                   | **None** (Epic 5)                        |
| SoT modules                  | **Untouched**                            |

### Explicit out of scope (confirmed absent)

- Durable persistence / database schema
- Producers / producer fan-out
- Queues / Kafka / Redis
- Reporting / AI / Query Port
- Event sourcing redesign
- Mutation API (`update` / `delete` / overwrite)
- Architecture Spec rewrite / ownership changes

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Ingestion port was already specified in RC-21 API Contract §4; this epic implements the admit contract only)

Canonical ownership changed:
None

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
(Process-local buffer is explicitly non-durable and not a warehouse SoT)
```

Knowledge Lake remains **projection only**. No Source of Truth introduced.

---

## Compatibility Report

| Surface                                              | Result                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| API Contract §4                                      | **Implemented** — admit / admitMany / outcomes / required fields |
| Existing APIs / HTTP                                 | **Unchanged**                                                    |
| Trading Session / Orders / Risk / Execution / Ledger | **Untouched**                                                    |
| Research `KnowledgeModule`                           | **Preserved** — separate module                                  |
| Epic 1 boundary invariants                           | **Preserved** — authority still `projection`; append-only        |
| Frozen paper path                                    | **Compatible** — no producer wiring yet                          |
| Persistence / migration                              | **N/A** — no database                                            |

---

## Tests Summary

| Suite                | File                                         | Coverage                                                                                                                         |
| -------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Admission validation | `domain/analytical-fact-admission.spec.ts`   | valid / System omit mode / missing fields / unknown category-mode / non-serializable payload                                     |
| Ingestion port       | `ingestion/knowledge-lake-ingestion.spec.ts` | valid admit · duplicate idempotency · invalid reject · immutable contract · append-only + correction via new eventId · admitMany |
| Boundary             | `domain/knowledge-lake-boundary.spec.ts`     | Epic 2 activePorts                                                                                                               |
| Nest module          | `knowledge-lake.module.spec.ts`              | port registered; no update/delete                                                                                                |

**Gate:** `pnpm --filter api exec vitest run src/modules/knowledge-lake` → **20/20 PASS**

---

## Documentation Update Summary

| Document                                          | Update                          |
| ------------------------------------------------- | ------------------------------- |
| This file                                         | Epic 2 implementation report    |
| [RC-21 Epic Breakdown](./rc-21-epic-breakdown.md) | Epic 2 DoD checked; status note |
| `docs/README.md`                                  | Index Epic 2 note               |
| Module README                                     | Epic 2 ingestion scope          |

---

## Epic 2 Definition of Done

- [x] `KnowledgeLakeIngestionPort` available to internal producers only (Nest export; no HTTP).
- [x] Admit requires stable event id, occurred-at, producer, category, payload envelope, mode where applicable (+ workspaceId, schemaVersion per contract).
- [x] Duplicate admission is idempotent (same event id → `duplicate`, no second fact).
- [x] No update/delete operations for admitted facts.
- [x] Contract tests for admission + idempotency + rejection + immutability + append-only.
- [x] Still no producer fan-out (test/fixture admits only).

**STOP:** Epic 2 complete for review. Do not start Epic 3 until approved.
