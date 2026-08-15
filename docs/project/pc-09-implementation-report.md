# PC-09 Market Profile Product — Implementation Report

**Package:** PC-09 Market Profile Product  
**Wave:** C — market context  
**Date:** 2026-08-15  
**Journey:** Supports J-08 Orchestrator via existing Profile reads (PC-15 15-b already publishes)  
**Status:** Ready for review (stop before PC-10)  
**Readiness:** Market Profile declared scope **100%**. Overall Product Readiness remains **58%** (no invented overall score).

This package exposes Market Profile as one customer product over existing query ports. It does not redesign Market Profile, Qualification, or Market State, and does not introduce scoring, new profile calculations, or a new Source of Truth.

---

## What was exposed

| Surface   | Change                                                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REST**  | Workspace, latest, history, target, version details, metadata, dimensions, published source, and metadata-only compare on `/v1/market-profiles`.                      |
| **UI**    | Profile Home, Latest Profile, Version History, Version Details, Metadata, Dimensions, Published From Qualification, and Compare (metadata only) at `/market-profile`. |
| **Shell** | Research → Profile. Home tile.                                                                                                                                        |

No new domain. No new Source of Truth. Market Profile remains owner. Domain `rest: false` is unchanged. HTTP is a sibling product adapter. Publish remains PC-15 15-b.

---

## Product path (not a redesign)

| File                                           | Role                                                            |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `apps/api/src/modules/market-profile/`         | Existing owner: immutable versions, latest, history, dimensions |
| `apps/api/src/modules/market-profile-product/` | HTTP + product views over existing query ports                  |
| `apps/web/src/market-profile/`                 | Market Profile operator UI                                      |

Ports used: existing `MarketProfileQueryPort`. `listWorkspaceProfiles` is an additive read of versions already in the process-local store. Compare composes existing version metadata only. Publish is not exposed on this REST.

---

## REST contract

- `GET /v1/market-profiles/workspace` — counts, latest profiles, recent versions
- `GET /v1/market-profiles` — latest profile per market
- `GET /v1/market-profiles/history` — optional `targetId`
- `GET /v1/market-profiles/targets/:targetId` — latest + versions
- `GET /v1/market-profiles/targets/:targetId/latest`
- `GET /v1/market-profiles/targets/:targetId/versions`
- `GET /v1/market-profiles/targets/:targetId/versions/:version`
- `GET /v1/market-profiles/targets/:targetId/versions/:version/{metadata,dimensions}`
- `GET /v1/market-profiles/targets/:targetId/published-source`
- `GET /v1/market-profiles/targets/:targetId/compare?fromVersion=&toVersion=`

Unchanged:

- Domain `MARKET_PROFILE_PORTS_ACTIVE.rest` remains `false`
- Qualification
- Market State
- PC-15 15-b publish path

Missing workspace header is **400**. Foreign workspace is **403**. Unknown target/version is **404**. There is no publish body, no score body, and no Trade now command.

---

## UI

- Profile Home
- Latest Profile
- Profile Versions / Version History
- Version Details
- Metadata
- Dimensions (caller-supplied snapshots)
- Published From Qualification
- Current Published Version
- Compare versions (metadata only)
- Empty, loading, and error states

Copy states Profile is a research artifact. It does not calculate dimensions and does not force trades.

---

## Architecture freeze

| Artifact                        | Edited |
| ------------------------------- | ------ |
| Architecture Specification v2.0 | **No** |
| Authority Matrix                | **No** |
| Alias Dictionary                | **No** |
| RC-19 … RC-28                   | **No** |

---

## Definition of Done

```text
Package: PC-09
Journey steps enabled: J-08 (via profile; product UI)
Definition of Done: ALL items 1–11 TRUE
Spec v2.0 unchanged: YES
Authority Matrix unchanged: YES
Alias Dictionary unchanged: YES
RC-19…RC-28 unaltered: YES
Live Trading implied: NO
Closed by: implementation  Date: 2026-08-15
```

| #   | Gate                               | Result                                                                          |
| --- | ---------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Backend functionality complete     | **TRUE**                                                                        |
| 2   | REST transport complete            | **TRUE**                                                                        |
| 3   | UI complete                        | **TRUE**                                                                        |
| 4   | Existing application ports exposed | **TRUE**                                                                        |
| 5   | Integration wiring complete        | **TRUE** (15-b already Closed; this package does not add a second publish path) |
| 6   | Tests PASS                         | **TRUE** — web 202, api 3203                                                    |
| 7   | Documentation updated              | **TRUE**                                                                        |
| 8   | Release Notes written              | **TRUE**                                                                        |
| 9   | CHANGELOG updated                  | **TRUE**                                                                        |
| 10  | Backlog updated                    | **TRUE**                                                                        |
| 11  | Canonical user journey works       | **TRUE** — operators can inspect Market Profile as a product                    |

---

**STOP.** Next package is PC-10 Market State Product. Do not begin PC-10 until this package is reviewed.

---

**End of Implementation Report.**
