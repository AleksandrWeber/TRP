# TRP — Knowledge Domain Model

Last updated: 2026-07-16

Read-only description of the **currently implemented** Knowledge Layer.
Sources: `apps/api/src/modules/knowledge/`, Prisma `KnowledgeEntry`.

---

## Purpose

Knowledge stores durable research outcomes from Experiments so that validated (and failed)
results remain queryable, deduplicated, and lineage-linked without mutating past records.

Primary write path for Research OS: `KnowledgeService.recordFromExperiment` after Experiment create
(also used by workflow and backfill).

---

## Main Entities

### Knowledge Entry

Persisted row (`KnowledgeEntry`).

- `id`, `type`, `title`, `description`, `category`, `tags[]`
- `version`, optional `parentId` (generic create / parent chain)
- `validationStatus` (experiment verdict for research_outcome)
- optional `workflowId`, `experimentId`, `authorEmail`
- `payload` (JSON)
- `createdAt`, `updatedAt`

Research outcomes use `type: 'research_outcome'`, `category: 'Experiment'`.

### Knowledge Payload

Typed research payload (`ResearchKnowledgePayload`) inside `payload`.

Identity / versions:

- `dedupeKey`, `configIdentityKey`, `resultIdentityKey`
- `researchEngineVersion`, `validationVersion`, `knowledgeSchemaVersion`
- `provenance.gitCommit`

Content:

- `hypothesis`, `evidence`, `conclusion`
- `strategyId`, `params`, `datasetId`, `metrics`, `validation`, `configHash`

Lineage fields:

- `supersedesKnowledgeId` (optional)
- `supersededByKnowledgeId` (written as `null` on create; not backfilled on old rows)

### Result Identity

Logical identity of **how** a config result was calculated and validated.

Built as:

```
resultIdentityKey = configIdentityKey:researchEngineVersion:validationVersion
```

Same config under a new engine or validation version is a **new** result identity (not a duplicate).

### Config Identity

Logical identity of **what** was tested (strategy + dataset + config hash), independent of engine/validation versions.

Built as:

```
configIdentityKey = strategyId:datasetId:configHash
```

Used for lineage linking and legacy-duplicate detection — not for current Result Identity dedup.

### Lineage

Immutable predecessor link on new research payloads:

- New entry may set `supersedesKnowledgeId` to the latest prior entry with the same `configIdentityKey`.
- Old entries are not updated or deleted.
- Reverse successors are discovered by querying entries whose payload `supersedesKnowledgeId` equals the current id (`getLineage`).

---

## Identity Keys (explicit)

| Key                 | Meaning                                   | Formula / value today                                       |
| ------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| `configIdentityKey` | Configuration under test                  | `strategyId:datasetId:configHash`                           |
| `resultIdentityKey` | Config + calculation/validation semantics | `configIdentityKey:researchEngineVersion:validationVersion` |
| `dedupeKey`         | Stored lookup key for deduplication       | **Equal to `resultIdentityKey`** for current schema         |

Legacy rows may have `dedupeKey` equal to the old config-only string (same shape as today’s `configIdentityKey`) and lack the new identity/version fields. Those are treated as legacy payloads.

---

## Relationships

```
Experiment 1 ─── * KnowledgeEntry (via experimentId; typically 0..1 research_outcome after create)
Workflow? ─── * KnowledgeEntry (optional workflowId)
KnowledgeEntry (new) ──supersedes──> KnowledgeEntry (prior, same configIdentityKey)
```

Generic `POST /knowledge` also supports `parentId` → version bump on the DB `version` field; that is separate from research payload lineage.

---

## Knowledge Lifecycle

1. Experiment is persisted (Research Layer).
2. Caller invokes `recordFromExperiment(experimentId)` (ExperimentsService best-effort; Workflow; or `POST /knowledge/backfill`).
3. Load experiment + dataset snapshot fields.
4. Build `configIdentityKey` and Result Identity / `dedupeKey`.
5. If duplicate (current or legacy) → return `{ status: 'duplicate', existingId }` (no new row).
6. Else find latest prior by config identity → optional `supersedesKnowledgeId`.
7. Build payload (hypothesis / evidence / conclusion + identity fields).
8. Create `KnowledgeEntry` (`research_outcome`); emit `KnowledgeCreated` / `KnowledgeStored`.

Manual `create()` path exists for generic knowledge (API) with stricter `validationStatus` rules (`pass` | `needs_review` only).

---

## Versioning

Single source: `apps/api/src/modules/knowledge/knowledge.version.ts`.

| Constant                   | Current | Bumped when                                             |
| -------------------------- | ------- | ------------------------------------------------------- |
| `RESEARCH_ENGINE_VERSION`  | `1.0.3` | Research calculation semantics change (result identity) |
| `VALIDATION_VERSION`       | `1.0.2` | Validation interpretation semantics change              |
| `KNOWLEDGE_SCHEMA_VERSION` | `2`     | Knowledge payload shape/meaning changes                 |

Runtime overrides: `RESEARCH_ENGINE_VERSION` / `VALIDATION_VERSION` env vars (fallback to constants).

`gitCommit` is provenance only — not part of Result Identity.

---

## Deduplication

Order in `recordFromExperiment`:

1. **Current dedup** — find `research_outcome` where `payload.dedupeKey === resultIdentityKey`. If found → duplicate.
2. **Legacy dedup** — find rows where `payload.dedupeKey === configIdentityKey` **and** payload is legacy (no config/result/engine/validation identity fields). If found → duplicate (do not recreate).

Otherwise create a new entry. Same `configIdentityKey` with a **new** engine/validation version creates a new row (new `resultIdentityKey` / `dedupeKey`).

---

## Lineage Model

- Immutable: predecessors are never rewritten.
- Forward pointer only on the **new** payload: `supersedesKnowledgeId`.
- Prior selected as newest entry matching `configIdentityKey` (or legacy config-shaped `dedupeKey`).
- `getLineage(id)` returns:
  - `supersedesKnowledgeId` from current payload
  - `supersededByKnowledgeIds` via reverse JSON path query
- `supersededByKnowledgeId` on payload is set to `null` at write time and is not maintained as a live back-pointer.

---

## Provenance

Carried on research payload:

- `provenance.gitCommit` from Experiment
- `researchEngineVersion`, `validationVersion`, `knowledgeSchemaVersion`
- Experiment link: `experimentId` on the entry
- Evidence includes dataset symbol/timeframe/barCount/contentHash and `experimentCreatedAt`

Engine version ≠ git commit.

---

## Current Limitations

- Dedup lookup uses JSON path on `payload.dedupeKey` (not a dedicated DB unique index).
- `supersededByKnowledgeId` is not updated on old records; reverse links are query-only.
- Generic `create()` rejects `fail`; research path stores PASS / FAIL / NEEDS_REVIEW.
- `getLineage` is service-level (no dedicated lineage HTTP route in the controller).
- Knowledge write after Experiment is best-effort (failure is logged; Experiment still returned).
- Dedicated Research OS git release of this layer is not yet cut (working tree).

---

## Future Extensions

- Dedicated unique index / column for Result Identity.
- Maintain live `supersededByKnowledgeId` back-pointers.
- Public lineage API endpoint.
- Knowledge UI for search, identity, and lineage.
- Stronger typed payload migration tooling beyond structural legacy detection.
- Align generic create rules with research_outcome verdict coverage.
