# TRP — Campaign Domain Model

Last updated: 2026-07-17

Read-only description of the **currently implemented** Campaign Layer.
Source: `apps/api/src/modules/research-campaign/`,
`apps/api/src/modules/campaign-session/`,
`apps/api/src/modules/campaign-persistence/`,
`apps/api/src/modules/campaign-export/`,
`apps/api/src/modules/campaign-import/`,
`apps/api/src/modules/campaign-replay/`, and
`apps/api/src/modules/jobs/`.

---

## Purpose

A Campaign runs one strategy on one dataset across a fixed list of parameter sets.
It reuses the existing Experiment path (backtest → validation → optional Knowledge write),
produces an in-memory Summary and Report, and persists a `CampaignSession` for history.

---

## Main Entities

### Campaign

Logical batch identified by `campaignId` (UUID generated at start).

Input (`ResearchCampaignInput`):

- `datasetId`
- `strategyId`
- `paramsList` — non-empty array of strategy params
- optional `sliceRef` (Dataset Slice scope)

Not a DB table. Exists for the duration of one service/API call.

### Campaign Run

One iteration over a single params object in `paramsList`.

Successful run:

- calls `ExperimentsService.run(datasetId, strategyId, params, sliceRef?)`
- produces a persisted Experiment
- contributes to summary counters and in-memory experiment list

Failed run (thrown error):

- does not create an Experiment
- recorded as `CampaignFailedRun` `{ params, error }`
- campaign continues

There is no separate persisted “CampaignRun” entity.

### Campaign Summary

In-memory aggregate after all runs (`CampaignSummary`):

- `campaignId`, `strategyId`, `datasetId`
- `totalRuns` — length of `paramsList`
- `passCount`, `failCount`, `needsReviewCount` — from Experiment verdicts
- `bestExperimentId` — highest `metrics.profitFactor` among successful runs
- `createdAt`
- `failedRuns` — execution errors (not validation FAIL)

### Campaign Report

Derived view from Summary + successful experiments (`CampaignReport`):

- same identity/aggregate fields as Summary
- `bestProfitFactor`, `bestReturn`, `bestExpectancy` — from best experiment
- `lowestDrawdown` — minimum `maxDrawdownPercent` among completed experiments
- `verdict` — campaign-level: `PASS` | `NEEDS_REVIEW` | `FAIL`
- `recommendations` — deterministic strings (no AI)
- `createdAt`
- optional `sliceIdentity`

### Campaign Session

Execution entity (`CampaignSession`):

- `id`, `status` (`CREATED` | `COMPLETED` | `FAILED`)
- `createdAt`, optional `completedAt`
- `report` (`CampaignReport`)
- `metadata` (`engineVersion`, optional `datasetId` / `tags`)

Created via `CampaignSessionFactory`; Campaign sets COMPLETED/FAILED + `completedAt` before save.

### Campaign Record

Storage model only (`CampaignRecord`). Mapped from/to `CampaignSession`.
Never exposed by PersistenceService, HistoryService, or History API.

---

## Relationships

```
Campaign
  └── Campaign Run (1..N, sequential)
        ├── success → Experiment (persisted)
        │              └── Knowledge (via existing post-create path)
        └── error → CampaignFailedRun (in Summary only)

Campaign Summary  ← aggregates successful Experiments + failedRuns
Campaign Report   ← built from Summary + experiment snapshots
Campaign Session  ← wraps Report + session status/metadata
Campaign Record   ← persistence shape of Session (in-memory Map)
```

Write path:

```
Campaign → CampaignSessionFactory → CampaignSession
        → CampaignPersistenceService → Mapper → Repository
```

Read path:

```
History API → CampaignHistoryService → Repository → Mapper → CampaignSession
              (filter → sort → paginate)
```

API response for `POST /research-campaigns`:

```
{ summary, report, experimentIds }
```

---

## Lifecycle

1. Validate request (`datasetId`, `strategyId`, non-empty `paramsList`).
2. Allocate `campaignId` + `createdAt`.
3. For each params set, run Experiment (or catch error).
4. Build Summary (counts, bestExperimentId, failedRuns).
5. Build Report (verdict, best metrics, recommendations).
6. Create Session via factory; set COMPLETED + `completedAt`; persist.
7. On catastrophic failure: persist FAILED Session with fallback Report; rethrow.
8. Return Summary + Report + experimentIds (HTTP); Session remains in History store.

---

## Data Flow

```
POST /research-campaigns  |  POST /campaigns/run
  → ResearchCampaignService.run
      → ExperimentsService.run (per params)
          → Backtest + Validation
          → Experiment persist
          → Knowledge.recordFromExperiment (existing side effect)
      → CampaignReportService.build
      → CampaignSessionFactory.create
      → CampaignPersistenceService.save(COMPLETED|FAILED session)
  → HTTP response (summary / report as applicable)

GET /campaign-history
  → CampaignHistoryController
      → CampaignHistoryService.search(query, pageRequest)
          → Repository.findAll → map → filter → sort → paginate
  → HistoryPage<CampaignSession>

GET /campaign-history/:sessionId
  → CampaignHistoryService.getById
  → 200 CampaignSession | 404
```

Knowledge is **not** called directly by the Campaign Layer.

---

## Failure Handling

| Case                              | Behavior                                                               |
| --------------------------------- | ---------------------------------------------------------------------- |
| Invalid body                      | `BadRequestException`; campaign does not start                         |
| Experiment throws                 | Logged; params + error appended to `failedRuns`; next params continues |
| Experiment verdict `fail`         | Counted in `failCount`; experiment kept                                |
| Experiment verdict `needs_review` | Counted in `needsReviewCount`                                          |
| Experiment verdict `pass`         | Counted in `passCount`                                                 |
| All configs fail validation       | Report verdict `FAIL` + recommendations; Session still COMPLETED       |
| Catastrophic `run` failure        | FAILED Session persisted; original error rethrown                      |
| History session missing           | `404 Not Found`                                                        |

Campaign-level verdict rules:

- any Experiment `pass` → Report `PASS`
- else any `needs_review` → `NEEDS_REVIEW`
- else → `FAIL`

---

## Campaign Session History API (US059)

Read-only HTTP surface over in-memory Campaign Session history
(`CampaignHistoryController` → `CampaignHistoryService`).

### `GET /campaign-history`

Returns `HistoryPage<CampaignSession>`.

Query parameters:

| Param           | Default     | Notes                                    |
| --------------- | ----------- | ---------------------------------------- |
| `page`          | `1`         | Positive integer                         |
| `pageSize`      | `20`        | Positive integer                         |
| `sortBy`        | `createdAt` | `createdAt` \| `completedAt` \| `status` |
| `sortDirection` | `DESC`      | `ASC` \| `DESC`                          |
| `status`        | —           | `CREATED` \| `COMPLETED` \| `FAILED`     |
| `engineVersion` | —           | Exact match on session metadata          |
| `datasetId`     | —           | Exact match on session metadata          |
| `tags`          | —           | Comma-separated; all tags required (AND) |

Pipeline: load all → filter → sort → paginate (in-service; Repository unchanged).

Response model fields: `items`, `totalItems`, `totalPages`, `currentPage`, `pageSize`.

### `GET /campaign-history/:sessionId`

Returns a single `CampaignSession`.

- `200` when found
- `404` when missing

No write endpoints on this controller.

---

## Campaign Session Export (US061–US062)

Export of a `CampaignSession` via Strategy exporters + read-only HTTP API.

Architecture:

```
GET /campaign-history/:sessionId/export?format=json|csv
  → CampaignExportController
      → CampaignHistoryService.getById
      → CampaignExportService.export
          → JsonCampaignExporter | CsvCampaignExporter
```

- `ExportFormat`: `JSON` | `CSV` (query: `json` | `csv`, required)
- Input to exporters: `CampaignSession` only — never `CampaignRecord`
- `200` + `Content-Type: application/json` or `text/csv`
- `400` — missing/empty/unsupported `format`
- `404` — session not found
- JSON: pretty-printed full session (metadata + report)
- CSV: header + one flattened row (session, metadata, report fields)

Module: `apps/api/src/modules/campaign-export/` (`CampaignExportModule`).
HTTP contract: [`api.md`](./api.md).

RC-07: Persistence + History + Export stack finalized.

---

## Campaign Session Import (US063–US065)

Import of a `CampaignSession` via Strategy importers + HTTP API (does not persist).

Architecture:

```
POST /campaign-import
  → CampaignImportController
      → CampaignImportService.import
          → JsonCampaignImporter
              → parse JSON
              → CampaignSessionValidator
                  → CampaignSession
```

- `ImportFormat`: `JSON` (initial; body `format: "json"`)
- Body: `{ "format": "json", "payload": "<exported session JSON string>" }`
- Output: `CampaignSession` only — never `CampaignRecord`
- `200` — imported session (metadata + report restored)
- `400` — unsupported format, malformed JSON, invalid schema, validation failed
- Validator is Persistence-independent (no Repository); import does **not** save

Module: `apps/api/src/modules/campaign-import/` (`CampaignImportModule`).
HTTP contract: [`api.md`](./api.md).

---

## Campaign Replay (US066–US067)

Internal foundation: prepare + execute replay of a `CampaignSession` (no public HTTP API yet; does not persist).

Architecture:

```
Controller (future)
  → CampaignReplayService
      → ReplayContext
      → ResearchCampaignService.run(..., { persistSession: false })
      → CampaignReportService.build
          → ReplayResult
```

- `create(session)` → `READY` (report copy; config restored)
- `execute(session)` → `RUNNING` → `COMPLETED` | `FAILED`
- `ReplayResult`: `replayId`, `sourceSessionId`, `startedAt`, `completedAt?`, `status`, `campaignConfig`, `report`
- `campaignConfig.paramsList` from optional `session.metadata.paramsList`
- Regenerated `report` on successful execute (not a copy)
- Invalid session → `BadRequestException`; execution errors → `FAILED`
- Transient: no Repository / Persistence / History writes

Module: `apps/api/src/modules/campaign-replay/` (`CampaignReplayModule`).
HTTP: not exposed — see [`api.md`](./api.md) (internal foundation note).

RC-08: Import + Replay foundation finalized.

---

## Jobs (US069–US073)

Domain model + queue + background runner + Status/Cancel API for asynchronous
Campaign / Replay execution (no scheduler or job persistence yet).

Architecture:

```
Scheduler (future)
  → BackgroundJobRunner
      → JOB_QUEUE (InMemoryJobQueue)
      → ResearchCampaignService.run(..., { persistSession: false })
      → CampaignReplayService.execute(...)

JobController (GET /jobs, POST /jobs/:jobId/cancel)
  → JobService.listJobs / getJob / cancelJob
      → JobQueue.list / get / cancel
```

- `Job`: `jobId`, timestamps, `status`, `type`, optional `sourceSessionId` / `replayId`, `metadata`, optional `result`
- `JobMetadata` may carry `paramsList` (CAMPAIGN) or `session` (REPLAY)
- `JobStatus`: `PENDING` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELLED`
- `JobType`: `CAMPAIGN` | `REPLAY`
- Create → `PENDING` → enqueue; process → RUNNING → COMPLETED|FAILED (`JobResult`)
- Cancel: PENDING → CANCELLED only (no `JobResult`); runner never executes CANCELLED
- Status API: `GET /jobs`, `GET /jobs/:jobId` (404 if missing)
- Cancel API: `POST /jobs/:jobId/cancel` (200 / 404 / 409)
- No Repository / History writes for jobs; campaign runs use `persistSession: false`

Module: `apps/api/src/modules/jobs/` (`JobsModule`).
HTTP: see [`api.md`](./api.md).

RC-09: Background Job Execution framework finalized (US069–US073).

---

## Knowledge Domain (US075–US079)

Analytical Knowledge layer above Experiments (in-memory; independent from Prisma
`research_outcome` persistence).

Architecture:

```
Experiment
  → KnowledgeExtractionService.extract(currentVersion.report)
      → KnowledgeDomainService.createFromExperiment (upsert)
          → KnowledgeEntry

KnowledgeController GET /knowledge
  → KnowledgeDomainService.find / search / searchByTag / searchByExperiment
      → KnowledgeEntry[]
```

- `KnowledgeEntry`: `knowledgeId`, `experimentId`, `createdAt`, `title`, `summary`, `tags`, `insights`, `metadata`
- `KnowledgeTag`: string label
- `KnowledgeMetadata`: optional `engineVersion` / `datasetId` / `strategyId` / `source`
- `KnowledgeDomainService`: `create` / `update` / `get` / `list` / `createFromExperiment` / `search` / `searchByTag` / `searchByExperiment` / `find`
- `KnowledgeExtractionService`: deterministic mapping from CampaignReport (no AI / LLM)
- One KnowledgeEntry per Experiment (upsert on re-extract)
- Search: case-insensitive over title/summary/insights/tags; filters AND; empty array on miss
- No Repository, Jobs, Events, Scheduler, or vector search

Module: `apps/api/src/modules/knowledge/` (coexists with existing research_outcome `KnowledgeService`).
HTTP: see [`api.md`](./api.md).

RC-10: Knowledge & Experiment Intelligence finalized (US075–US079).

---

## Experiment Domain (US076)

Primary research entity linking Campaign Sessions and future Knowledge.

Architecture:

```
CampaignSession
  → ExperimentDomainService.createFromSession
      → Experiment (versions[])
          → KnowledgeEntry (future; stores experimentId only)

Controller (future)
  → ExperimentDomainService
      → Experiment
```

- `Experiment`: `experimentId`, `sessionId`, `createdAt`, `currentVersion`, `versions[]`, `metadata`
- `ExperimentVersion`: `version`, `report` (CampaignReport), optional `replayId`, `createdAt`, `sourceSessionId`
- `ExperimentMetadata`: optional `engineVersion` / `datasetId` / `strategyId` / `tags` / `source`
- `ExperimentDomainService`: `createFromSession` / `createVersion` / `get` / `list`
- No Repository, API, or Knowledge integration yet

Module: `apps/api/src/modules/experiments/` (coexists with Prisma `ExperimentsService`).

---

## Experiment Comparison (US078)

Deterministic structural comparison of Experiment versions (no AI / similarity / embeddings).

Architecture:

```
ExperimentDomainService
  → ExperimentComparisonService.compareVersions / compareExperiments
      → ExperimentComparison (ComparisonResult)
```

- `ExperimentComparison`: left/right experiment + version ids + `ComparisonResult`
- `ComparisonResult`: added/removed insights & tags, `summaryChanged`, metadataDifferences
- `ComparisonChange`: `{ key, before, after }`
- Projection aligned with Knowledge extraction mapping (summary/insights/tags/metadata from report)
- `compareVersions` → `null` if experiment missing; throws if version invalid
- No API, persistence, or jobs

RC-10: Knowledge & Experiment Intelligence finalized (US075–US079).

---

## RC-06 Architecture Audit (US060)

Status: **PASS** (documentation sync; no code changes)

### Dependency direction

```
Campaign (ResearchCampaignService)
  → CampaignSessionFactory / CampaignSession
  → CampaignPersistenceService
      → CampaignSessionMapper
      → CampaignRepository ← InMemoryCampaignRepository

History API (CampaignHistoryController)
  → CampaignHistoryService
      → CampaignRepository
      → CampaignSessionMapper
      → CampaignSession
```

- Session module does **not** import Persistence.
- Repository / Record do **not** import Campaign services.
- History Controller does **not** access Repository.
- DI via Nest (`CAMPAIGN_REPOSITORY` token, `@Injectable` services/factory).
- No circular module imports detected for this stack.

### Layer isolation

| Layer          | Owns                         | Does not own                |
| -------------- | ---------------------------- | --------------------------- |
| Campaign       | run loop, report build, save | History queries, HTTP list  |
| Session        | domain model + factory       | storage, HTTP               |
| Persistence    | write orchestration + mapper | Campaign execution          |
| Repository     | `CampaignRecord` storage     | filtering / sorting / pages |
| HistoryService | read + filter/sort/paginate  | writes                      |
| History API    | HTTP query parsing / status  | business rules              |

### Tests (RC-06 stack)

63 unit tests passed covering Session factory, Persistence, History service
(filters/pagination/sorting), History controller, and Campaign persistence integration.

### Known limitations (accepted)

- History store is in-memory (process lifetime).
- `CampaignPersistenceService` still exposes low-level read helpers; product read path is HistoryService/API.
- No Campaign History UI yet.

---

## Current Limitations

- Campaign Session history is in-memory only (process lifetime); no DB table yet.
- No parallel runs; strictly sequential.
- Best candidate is by Profit Factor only.
- Campaign History UI not implemented.
- Export has no ZIP / PDF / bulk export yet.
- Import has no CSV importer / persist-on-import yet.
- Replay does not expose HTTP / persist replay results yet.
- Jobs have in-memory queue + runner; no scheduler / durable persist / HTTP yet.

---

## Future Extensions

- Durable Campaign Session storage.
- Campaign History UI.
- Campaign-level Knowledge summary entry.
- ZIP / PDF export formats.
- Optional persist of imported sessions.
- Replay HTTP API.
- Job scheduler + Jobs API.
