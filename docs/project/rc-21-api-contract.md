# RC-21 API Contract — Knowledge Lake

**Document:** RC-21 API Contract  
**Status:** ARCHITECTURE APPROVED — Epic 5 Query Port implemented (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Interface / port contracts only. **No REST implementation. No database schema. No transport product.**

**Parent:** [RC-21 Implementation Plan](./rc-21-implementation-plan.md)  
**Epics:** [RC-21 Epic Breakdown](./rc-21-epic-breakdown.md)  
**Integration:** [RC-21 Integration Diagram](./rc-21-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.13  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md)  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) — API Contract stage

**Future intentions (docs only — not ports):** Lifecycle Policy, Fact Quality, and Lake Metrics are defined in the [Implementation Plan §§6A–6C](./rc-21-implementation-plan.md). They do not add required admission fields in RC-21.

---

## 1. Purpose

Lock the **application ports** Knowledge Lake will expose and consume so Epics implement one contract.

This document deliberately does **not** define:

- HTTP routes / OpenAPI
- Prisma / SQL / table layouts
- Kafka, Redis, queues, or bus topics
- Event-sourcing redesign of SoT modules

Transports and persistence are implementation choices **inside** Epics after this contract is approved — provided they preserve append-only projection semantics and ownership rules.

---

## 2. Ownership of the contract

| Concern                        | Owner                                       |
| ------------------------------ | ------------------------------------------- |
| Knowledge Lake ports           | Knowledge Lake projection module (RC-21)    |
| Business facts being projected | Existing SoT / research owners (unchanged)  |
| Consumer interpretation        | Reporting / AI / ML (later RCs) — read only |
| Naming (product vs canonical)  | Alias Dictionary                            |

**Canonical names** in code and ports: `KnowledgeLake`, `knowledge-lake` module path as chosen by implementers — **not** `bots`, `ledger`, or `orders`.

UI may say “Knowledge Lake”. APIs and types use canonical Lake vocabulary.

---

## 3. Port overview

```text
Producers (SoT / Research / System)
        │
        ▼
KnowledgeLakeIngestionPort   (write: append-only admit)
        │
        ▼
Knowledge Lake warehouse     (projection store — not SoT)
        │
        ▼
KnowledgeLakeQueryPort       (read: analytical queries)
        │
        ▼
Consumers (Reporting, AI Analyst, AI Research, future ML, internal tools)
```

No other Lake ports are in RC-21 scope (no admin mutate, no command, no “rebuild SoT from Lake”).

---

## 4. Ingestion port

### 4.1 Interface (logical)

```text
KnowledgeLakeIngestionPort
  admit(fact: AnalyticalFactAdmission) → AdmitResult
```

Optional helper (same semantics; not a second authority):

```text
  admitMany(facts: AnalyticalFactAdmission[]) → AdmitResult[]
```

### 4.2 AnalyticalFactAdmission (fields)

| Field              | Required | Meaning                                                                                         |
| ------------------ | -------- | ----------------------------------------------------------------------------------------------- |
| `eventId`          | Yes      | Stable unique id for idempotent admission                                                       |
| `occurredAt`       | Yes      | When the underlying fact occurred (producer clock / SoT timestamp)                              |
| `admittedAt`       | No       | Filled by Lake on admit if omitted                                                              |
| `producer`         | Yes      | Logical producer id (see §7)                                                                    |
| `category`         | Yes      | One of: Market \| Trading \| Risk \| Paper \| Research \| Reporting \| System                   |
| `mode`             | Yes*     | `paper` \| `live` \| `research` \| `system` (*`system` may omit trading mode)                   |
| `workspaceId`      | Yes      | Tenancy boundary                                                                                |
| `exchangeScopeId`  | No       | When fact is scope-bound                                                                        |
| `tradingSessionId` | No       | When fact is session-bound (Bot id ≡ Session id if UI alias appears)                            |
| `correlationId`    | No       | Links related facts                                                                             |
| `sourceRef`        | No       | Pointer to owning SoT/research record (id + owner type) — preferred over cloning large payloads |
| `payload`          | Yes      | Immutable analytical snapshot / envelope (JSON-serializable logical object)                     |
| `schemaVersion`    | Yes      | Payload contract version for forward compatibility                                              |

### 4.3 AdmitResult

| Outcome     | Meaning                                              |
| ----------- | ---------------------------------------------------- |
| `admitted`  | New fact stored                                      |
| `duplicate` | Same `eventId` already present — idempotent success  |
| `rejected`  | Invalid admission (missing fields, unknown category) |

### 4.4 Ingestion rules

1. **Append-only.** No `update`, `delete`, `overwrite`, or `correct-in-place` methods on this port.
2. **Idempotent by `eventId`.** Retries must not create divergent twins.
3. **Immutable after admit.** Corrections = new fact with new `eventId` and optional `correlationId` / compensating marker in payload — never edit the old row via API.
4. **Producers only.** Ingestion is an **internal application port**. External clients must not gain a public “write anything” Lake API in RC-21.
5. **No SoT mutation.** Admit never calls Orders / Risk / Execution / Ledger / Session command ports.
6. **Non-authoritative.** Admitted payloads are analytical; balances and lifecycle in payload are informational copies.

### 4.5 Explicitly out of ingestion contract

- Batch rebuild APIs that truncate Lake
- “Upsert by business key”
- Synchronous hooks that block SoT commits on Lake failure (projection durability policy is an Epic implementation choice; SoT ownership must not invert — prefer SoT success independent of Lake when in doubt, consistent with ADR-019 spirit for notifications)

---

## 5. Query port

**Implementation status (Epic 5):** Implemented as `KnowledgeLakeQueryPort` (`KNOWLEDGE_LAKE_QUERY_PORT`) over the process-local in-memory buffer. See [`rc-21-epic5-query-port.md`](./rc-21-epic5-query-port.md).

### 5.1 Interface (logical)

```text
KnowledgeLakeQueryPort
  getByEventId(eventId) → AnalyticalFact | null
  list(query: AnalyticalFactQuery) → AnalyticalFactPage
```

### 5.2 AnalyticalFactQuery

| Field              | Required | Meaning                                                           |
| ------------------ | -------- | ----------------------------------------------------------------- |
| `workspaceId`      | Yes      | Tenancy                                                           |
| `categories`       | No       | Filter set                                                        |
| `producers`        | No       | Filter set                                                        |
| `mode`             | No       | paper / live / research / system                                  |
| `tradingSessionId` | No       | Session-bound facts                                               |
| `exchangeScopeId`  | No       | Scope-bound facts                                                 |
| `occurredFrom`     | No       | Inclusive lower bound                                             |
| `occurredTo`       | No       | Exclusive upper bound (`occurredAt < occurredTo`) — Epic 5 choice |
| `correlationId`    | No       | Related facts                                                     |
| `limit` / `cursor` | No       | Pagination (default 50, max 200)                                  |

### 5.3 AnalyticalFact (read model)

Mirrors admission fields plus Lake-assigned `admittedAt`.  
Every read model is a **projection**. Callers must not treat it as Ledger or Session SoT.

`AnalyticalFactPage` includes `authorityClass: 'projection'` and `nextCursor` (opaque; null when exhausted).

### 5.4 Query rules

1. **Read-only.** No disguised writes.
2. **Consumer-safe.** Intended for Reporting, AI Analyst, AI Research, future ML, and internal diagnostics.
3. **Not ops SoT.** Command Center lifecycle/kill continues to use Session/Risk ports — not Lake queries as authority.
4. **Compatibility:** Additive filter fields allowed in later RCs; removing/renaming fields requires a contract revision.

---

## 6. Compatibility

| Rule                           | Detail                                                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backward compatible admits** | New optional admission fields may be added; required fields may not be removed without version bump                                           |
| **`schemaVersion`**            | Producers own payload evolution; Lake stores opaque versioned payloads                                                                        |
| **Category enum**              | Closed set for RC-21; new categories need plan/contract amendment                                                                             |
| **Idempotency**                | `eventId` uniqueness is permanent for RC-21+                                                                                                  |
| **Alias Dictionary**           | No Bot aggregate; if session refs appear, they are `tradingSessionId`                                                                         |
| **REST**                       | Out of this document. If HTTP is added later, paths use canonical resources (`knowledge-lake` / analytical-facts) — never `/bots` as Lake SoT |
| **Existing research APIs**     | Insight/Recommendation/Knowledge REST remain research surfaces; not replaced by Lake in RC-21                                                 |

---

## 7. Producer identifiers (logical)

Stable producer strings for admission (illustrative canonical set):

| Producer id        | Maps to module / path                      | Default categories |
| ------------------ | ------------------------------------------ | ------------------ |
| `research-lab`     | Research Lab / campaigns / experiments     | Research           |
| `trading-session`  | Trading Session / Strategy Runtime         | Trading, System    |
| `orders`           | Orders                                     | Trading            |
| `risk-engine`      | Risk Engine / safety                       | Risk               |
| `execution-engine` | Execution Engine / Fill facts              | Trading            |
| `paper-trading`    | Paper path / paper accounts                | Paper, Trading     |
| `reporting`        | Reporting jobs (later)                     | Reporting          |
| `system`           | Recovery / projection health / ops markers | System             |
| `market-data`      | Live Market Data / qualification markers   | Market             |

Producers may emit only categories they own analytically. Cross-category spam is a review failure.

---

## 8. Consumer identifiers (logical)

| Consumer            | Access                                       | RC-21 expectation                |
| ------------------- | -------------------------------------------- | -------------------------------- |
| Reporting           | Query port                                   | Port ready; product later        |
| AI Analyst          | Query port (via gateway later)               | Port ready; product later        |
| AI Research         | Query port                                   | Port ready; product later        |
| Future ML           | Query port                                   | Port ready; no training pipeline |
| Command Center      | **Not a Lake authority client**              | May ignore Lake in RC-21         |
| Orders/Risk/Session | **Must not** query Lake to authorize actions | Forbidden feedback               |

---

## 9. Compatibility with Authority Matrix

| Matrix row                         | Contract implication                                     |
| ---------------------------------- | -------------------------------------------------------- |
| Lake contents = Projection         | Both ports treat facts as non-SoT                        |
| Lake must not override Orders      | No ingestion path that writes Orders                     |
| Lake must not be balance authority | Query responses must not be used to authorize cash moves |
| Fills owned by Execution→Fill      | Lake may store fill analytical copies via `sourceRef`    |

---

## 10. Acceptance for this contract

This API Contract is accepted when reviewers agree:

1. Ingestion and query ports are sufficient for RC-21 Epics 2–5.
2. No REST/schema/queue inventiveness is required to approve the contract.
3. Append-only + idempotent admit + read-only query are mandatory.
4. Ownership and Alias Dictionary rules are enforceable in review.

**STOP:** Contract only. Implementation waits for plan + contract approval.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
