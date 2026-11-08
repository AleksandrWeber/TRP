# TD-041 / US178 Ledger Cursor Pagination

**Decision ID:** TD-041 / US178 Ledger Cursor Pagination  
**Date:** 2026-11-08  
**Status:** SUPERSEDED by [`td-041-us178-ledger-cursor-pagination-option-b-decision.md`](./td-041-us178-ledger-cursor-pagination-option-b-decision.md)
**Authority:** Product Owner

Option A applied to the first pagination sprint. Option B supersedes the HTTP no-limit behavior. This file is retained as the historical record. It does not authorize or change FIV-CONN-04-D Stage 4.

| Field                                                             | Accepted decision                                                    |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| PO decision                                                       | Option A — optional pagination                                       |
| Route                                                             | `GET /v1/accounting/accounts/:paperAccountId/ledger`                 |
| Parameters                                                        | `limit` and `cursor`                                                 |
| Page size                                                         | Integer 1–100 when `limit` is sent. No default.                      |
| Omitted `limit`                                                   | Current full ordered `transactions` body. No `nextCursor`.           |
| Cursor                                                            | Opaque versioned base64url JSON, `v` = 1. Not a signature.           |
| Cursor fields                                                     | `v`, `workspaceId`, `paperAccountId`, `occurredAt`, `id`             |
| Scope binding                                                     | Cursor workspace and paper account must match the authorized request |
| Ordering                                                          | Ascending `(occurredAt, id)`                                         |
| Continuation                                                      | `occurredAt` greater, or equal `occurredAt` and `id` greater         |
| `cursor` without `limit`                                          | HTTP 400                                                             |
| Invalid `limit`, malformed cursor, bad version, or scope mismatch | HTTP 400. Do not fall back to a full read.                           |
| Exhausted page                                                    | Omit `nextCursor`                                                    |
| Database index                                                    | No new index                                                         |
| Internal accounting                                               | `listByAccount` and `summarizeAccount` stay full-history reads       |
| TD-041                                                            | Remains open. The no-query HTTP read is still unbounded.             |
| Stage 4                                                           | Not authorized and not changed                                       |

Cursor encoding follows the existing unsigned base64url JSON cursors used by Security Audit timeline and Knowledge Lake. Those cursors are not HMAC-signed. This decision does not add a signing dependency.
