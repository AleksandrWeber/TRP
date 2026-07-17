# TRP — Campaign History, Export, Import, Jobs & Knowledge API

Last updated: 2026-07-17

Living HTTP contract for Campaign Session history, export, import, Jobs status, and Knowledge search.
Domain context: [`campaign-domain-model.md`](./campaign-domain-model.md).

---

## History

### `GET /campaign-history`

Returns `HistoryPage<CampaignSession>`.

| Query           | Default     | Notes                                    |
| --------------- | ----------- | ---------------------------------------- |
| `page`          | `1`         | Positive integer                         |
| `pageSize`      | `20`        | Positive integer                         |
| `sortBy`        | `createdAt` | `createdAt` \| `completedAt` \| `status` |
| `sortDirection` | `DESC`      | `ASC` \| `DESC`                          |
| `status`        | —           | `CREATED` \| `COMPLETED` \| `FAILED`     |
| `engineVersion` | —           | Exact match                              |
| `datasetId`     | —           | Exact match                              |
| `tags`          | —           | Comma-separated AND                      |

### `GET /campaign-history/:sessionId`

- `200` — `CampaignSession`
- `404` — session not found

---

## Export (US062)

### `GET /campaign-history/:sessionId/export`

Read-only export of one Campaign Session.

| Query    | Required | Values                             |
| -------- | -------- | ---------------------------------- |
| `format` | yes      | `json` \| `csv` (case-insensitive) |

Flow:

```
CampaignExportController
  → CampaignHistoryService.getById(sessionId)
  → CampaignExportService.export(session, format)
```

| Status | When                                   |
| ------ | -------------------------------------- |
| `200`  | Export body returned                   |
| `400`  | Missing/empty `format`, or unsupported |
| `404`  | Session not found                      |

Headers:

| Format | `Content-Type`     |
| ------ | ------------------ |
| JSON   | `application/json` |
| CSV    | `text/csv`         |

Body:

- JSON — pretty-printed `CampaignSession` string
- CSV — header row + one flattened session/report row

Not supported: ZIP, PDF, bulk export.

---

## Import (US065)

### `POST /campaign-import`

Validates and returns a `CampaignSession` from an exported JSON payload.
**Does not persist** the imported session.

Request:

- `Content-Type: application/json`
- Body:

```json
{
  "format": "json",
  "payload": "<exported session JSON string>"
}
```

Flow:

```
CampaignImportController
  → CampaignImportService.import(payload, format)
      → JsonCampaignImporter → CampaignSessionValidator
          → CampaignSession
```

| Status | When                                                           |
| ------ | -------------------------------------------------------------- |
| `200`  | Imported `CampaignSession` (metadata + report restored)        |
| `400`  | Unsupported format, malformed JSON, invalid schema, validation |

Not supported: CSV import, persist-on-import, campaign replay via this endpoint.

---

## Replay (internal foundation — US066–US067)

No public Replay REST endpoints yet.

Internal service API (`CampaignReplayService`):

- `create(session)` → `ReplayResult` (`READY`)
- `execute(session)` → `ReplayResult` (`COMPLETED` | `FAILED`)

Execution reuses `ResearchCampaignService` with `persistSession: false` (no History writes).
Future HTTP surface will be documented here when introduced.

RC-08: Import + Replay foundation finalized (US063–US067).

---

## Jobs Status (US072–US073)

Inspection and cancellation of in-memory queued jobs. Does not enqueue processing or interrupt RUNNING jobs.

Flow:

```
JobController
  → JobService.listJobs / getJob / cancelJob
      → JobQueue.list / get / cancel
```

### `GET /jobs`

Returns all jobs known to the queue (`Job[]`).

| Status | Body    |
| ------ | ------- |
| `200`  | `Job[]` |

Each `Job` exposes: `jobId`, `status`, `type`, timestamps (`createdAt`, optional `startedAt` / `completedAt`), `metadata`, and `result` when completed (or failed with a result). Cancelled jobs have no `result`.

### `GET /jobs/:jobId`

| Status | When          |
| ------ | ------------- |
| `200`  | `Job`         |
| `404`  | Job not found |

Pending jobs have no `result`. Completed jobs include `result` (`JobResult`).

### `POST /jobs/:jobId/cancel`

Cancel a `PENDING` job only.

| Status | When                                                            |
| ------ | --------------------------------------------------------------- |
| `200`  | Cancelled `Job` (`status: CANCELLED`, no `result`)              |
| `404`  | Job not found                                                   |
| `409`  | Job is already `RUNNING`, `COMPLETED`, `FAILED`, or `CANCELLED` |

`BackgroundJobRunner` skips CANCELLED jobs and never executes them.

RC-09: Background Job Execution framework finalized (US069–US073).

---

## Knowledge Search (US079)

Read-only search over the in-memory Knowledge domain (`KnowledgeEntry`).
No Prisma, AI, vectors, or semantic ranking.

Flow:

```
KnowledgeController
  → KnowledgeDomainService.find({ q, tag, experimentId })
      → KnowledgeEntry[]
```

### `GET /knowledge`

| Query          | Required | Notes                                                  |
| -------------- | -------- | ------------------------------------------------------ |
| `q`            | no       | Case-insensitive text over title/summary/insights/tags |
| `tag`          | no       | Case-insensitive exact tag match                       |
| `experimentId` | no       | Exact experiment id                                    |

Filters combine with **AND**. No filters → all entries.

| Status | Body               |
| ------ | ------------------ |
| `200`  | `KnowledgeEntry[]` |

Empty array when nothing matches (never 404 for search).

RC-10: Knowledge & Experiment Intelligence finalized (US075–US079).
