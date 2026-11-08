# TD-041 / US178 Ledger Cursor Pagination — Option B

**Decision ID:** TD-041 / US178 Ledger Cursor Pagination — Option B
**Date:** 2026-11-08
**Status:** ACCEPTED — HTTP contract implemented
**Authority:** Product Owner

This decision supersedes the HTTP no-limit behavior in [`td-041-us178-ledger-cursor-pagination-decision.md`](./td-041-us178-ledger-cursor-pagination-decision.md). It does not authorize or change FIV-CONN-04-D Stage 4. `docs/project/technical-debt.md` and the Wave 6 decision register were already dirty and are not updated by this record.

| Field                                        | Accepted decision                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| PO decision                                  | Option B — bounded default pagination                                                 |
| Route                                        | `GET /v1/accounting/accounts/:paperAccountId/ledger`                                  |
| Default `limit`                              | 50 when `limit` is omitted                                                            |
| Explicit `limit`                             | Integer 1–100. Overrides the default.                                                 |
| `cursor` without `limit`                     | Valid. Continues with limit 50.                                                       |
| Invalid `limit` or invalid/mismatched cursor | HTTP 400. No full-history fallback.                                                   |
| `nextCursor`                                 | Present only when another row exists. Omitted when the page is exhausted.             |
| Cursor                                       | Opaque versioned base64url, scoped to workspace and paper account                     |
| Ordering                                     | Ascending `(occurredAt, id)`                                                          |
| HTTP full history                            | Superseded. Every HTTP ledger read is one page.                                       |
| Internal accounting                          | `summarizeAccount`, portfolio refresh, and accounting rebuild stay full-history reads |
| Database index                               | No new index                                                                          |

Clients that need every transaction follow `nextCursor` until it is omitted.
