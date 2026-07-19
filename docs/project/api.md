# TRP — Campaign History, Export, Import, Jobs, Knowledge & Research Intelligence API

Last updated: 2026-07-19 (US183.1 — Orders API documented)

Living HTTP contract for Campaign Session history, export, import, Jobs status, Knowledge search, Research Intelligence (Insights / Recommendations / Reports / Cross-Campaign Analysis), Live Market Data query/SSE (RC-16 M1), Paper Orders (RC-16 M2 US164), and Paper Accounting reads (RC-16 M2 US178).
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

---

## Research Intelligence API (US100)

Read-only REST adapters over existing in-memory domain services.
Controllers do **not** generate Insights / Recommendations, build reports, or execute pipelines.

Flow:

```
Controller
  → DomainService.search / getById
      → HistoryPage<T> | entity
```

List responses use the History envelope: `HistoryPage<T>` (`items`, `totalItems`, `totalPages`, `currentPage`, `pageSize`).

Common list query params:

| Query       | Default     | Notes            |
| ----------- | ----------- | ---------------- |
| `page`      | `1`         | Positive integer |
| `pageSize`  | `20`        | Positive integer |
| `sortBy`    | `createdAt` | Domain-specific  |
| `sortOrder` | `DESC`      | `ASC` \| `DESC`  |

### Insights

#### `GET /insights`

Returns `HistoryPage<Insight>`.

| Query               | Notes                                                   |
| ------------------- | ------------------------------------------------------- |
| `type`              | `PATTERN` \| `ANOMALY` \| `CORRELATION` \| `TREND` \| … |
| `campaignSessionId` | Exact match                                             |
| `experimentId`      | Exact match                                             |
| `sortBy`            | `createdAt` \| `type` \| `confidence` \| `title`        |

#### `GET /insights/:id`

- `200` — `Insight`
- `404` — not found

### Recommendations

#### `GET /recommendations`

Returns `HistoryPage<Recommendation>`.

| Query      | Notes                                                         |
| ---------- | ------------------------------------------------------------- |
| `type`     | `REPEAT_EXPERIMENT` \| `EXPAND_SCOPE` \| `VERIFY_RESULT` \| … |
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL`                     |
| `sortBy`   | `createdAt` \| `type` \| `priority` \| `title`                |

#### `GET /recommendations/:id`

- `200` — `Recommendation`
- `404` — not found

### Research Reports

#### `GET /reports`

Returns `HistoryPage<ResearchReport>`.

| Query               | Notes                   |
| ------------------- | ----------------------- |
| `campaignSessionId` | Exact id in report refs |
| `sortBy`            | `createdAt`             |

#### `GET /reports/:id`

- `200` — `ResearchReport`
- `404` — not found

### Cross-Campaign Analysis

#### `GET /cross-campaign-analysis`

Returns `HistoryPage<CrossCampaignAnalysisResult>` (stored analyze results; includes `id` / `createdAt`).

| Query               | Notes                          |
| ------------------- | ------------------------------ |
| `campaignSessionId` | Match in `comparedCampaignIds` |
| `sortBy`            | `createdAt`                    |

#### `GET /cross-campaign-analysis/:id`

- `200` — `CrossCampaignAnalysisResult`
- `404` — not found

---

## Live Market Data (RC-16 M1 US146–US147)

Read-only workspace-scoped market query and projection streaming.
Requires JWT + `X-Workspace-Id`. Responses are provider-neutral and
explicitly non-authoritative for trading decisions.

### Query API (US146)

| Method | Path                                           | Notes                               |
| ------ | ---------------------------------------------- | ----------------------------------- |
| `GET`  | `/v1/market-data/subscriptions`                | Desired subscriptions for workspace |
| `GET`  | `/v1/market-data/subscriptions/:id`            | One subscription (`404` if missing) |
| `GET`  | `/v1/market-data/streams/status`               | Operational health rows             |
| `GET`  | `/v1/market-data/streams/latest`               | Latest projection rows              |
| `GET`  | `/v1/market-data/streams/:streamId/status`     | One status                          |
| `GET`  | `/v1/market-data/streams/:streamId/latest`     | One latest state                    |
| `GET`  | `/v1/market-data/streams/:streamId/checkpoint` | Durable checkpoint                  |
| `GET`  | `/v1/market-data/streams/:streamId`            | Combined detail view                |

Guarantees: GET-only; no Orders/Sessions/strategy evaluation; no raw Binance
payload fields; `authoritative: false` / `operationalOnly: true` on views.

### Projection SSE (US147)

#### `GET /v1/market-data/projections/stream` (`text/event-stream`)

| Query            | Notes                                     |
| ---------------- | ----------------------------------------- |
| `streamId`       | Optional stream filter                    |
| `cursorVersion`  | Resume after this projection version      |
| `cursorStreamId` | Stream id paired with cursor              |
| `refresh`        | `1`/`true` — emit current snapshots first |

Envelopes carry canonical `MarketLatestStateView` only. Slow clients use
bounded drop-oldest buffers; channel failures never block ingestion.

---

## Paper Accounting (RC-16 M2 US178)

Authenticated, read-only, workspace/account-scoped accounting views.
Requires JWT + `X-Workspace-Id`. Membership is checked before every lookup.
Financial values are decimal strings. The API never recalculates authoritative
accounting and never mutates Fill, Position, Ledger, or Portfolio state.

| Method | Path                                                     | Data class                             | Authoritative |
| ------ | -------------------------------------------------------- | -------------------------------------- | ------------- |
| `GET`  | `/v1/accounting/accounts/:paperAccountId/fills`          | `immutable_execution_facts`            | yes (facts)   |
| `GET`  | `/v1/accounting/accounts/:paperAccountId/positions`      | `position_projection`                  | no            |
| `GET`  | `/v1/accounting/accounts/:paperAccountId/ledger`         | `authoritative_ledger`                 | yes           |
| `GET`  | `/v1/accounting/accounts/:paperAccountId/portfolio`      | `portfolio_projection`                 | no            |
| `GET`  | `/v1/accounting/accounts/:paperAccountId/reconciliation` | `accounting_reconciliation_checkpoint` | no            |

Guarantees:

- Missing `X-Workspace-Id` → `400`
- Caller not a workspace member → `403`
- Paper account absent in the authorized workspace → `404`
- Cross-workspace account ids never resolve into another workspace
- Projection responses set `projection: true` and `authoritative: false`
- Ledger responses set `authoritative: true`
- Portfolio/Position views expose version, freshness, and completeness/source
  metadata where available; reconciliation exposes match/mismatch status

---

## Paper Orders (RC-16 M2 US164)

Authenticated workspace-scoped Order commands and queries.
Requires JWT + `X-Workspace-Id`. Commands require `Idempotency-Key` and
Trader/Admin roles. Risk evaluation and Execution Engine lifecycle transitions
remain internal — HTTP exposes propose and cancel only.

| Method | Path                         | Notes                                                |
| ------ | ---------------------------- | ---------------------------------------------------- |
| `POST` | `/v1/orders`                 | Create paper Order Intent (Trader/Admin)             |
| `POST` | `/v1/orders/:orderId/cancel` | Cancel if eligible (Trader/Admin; `409` on conflict) |
| `GET`  | `/v1/orders`                 | List Orders for workspace                            |
| `GET`  | `/v1/orders/:orderId`        | One Order (`404` if missing)                         |

Guarantees:

- Missing `X-Workspace-Id` / `Idempotency-Key` (commands) → `400`
- Caller not authorized for workspace trading commands → `403`
- Order absent in the authorized workspace → `404`
- Cancel conflict (wrong state) → `409`
- Mode is paper-only; HTTP cannot bypass Risk or Execution Engine
