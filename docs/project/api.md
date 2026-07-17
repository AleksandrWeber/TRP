# TRP — Campaign History & Export API

Last updated: 2026-07-17

Living HTTP contract for Campaign Session history and export.
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

RC-07: Export Foundation + Export API finalized (US061–US062) with Session Persistence / History stack.
