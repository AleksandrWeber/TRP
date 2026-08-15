# PC-01 Strategy Library Product — Implementation Report

**Package:** PC-01 Strategy Library Product  
**Wave:** B — Strategy admission (first package)  
**Date:** 2026-08-15  
**Journey:** J-05 Strategy Library — **COMPLETE**  
**Status:** Ready for review (stop before PC-02)  
**Readiness:** Strategy Library declared scope **100%**. Overall Product Readiness remains **58%** (no invented overall score).

This package exposes the certified Strategy Library (RC-22 domain, RC-23 Lookup / Eligibility reads) as a customer product. It does not create Strategy Library, redesign Runtime, Certification, or Deployment, or move ownership.

---

## What was exposed

| Surface         | Change                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REST**        | Lookup + Eligibility over `/v1/strategy-library`. Not `/v1/strategies`.                                                                           |
| **UI**          | Official Strategy Library page: browse, search, filter, version history, certification / eligibility / envelope badges, immutable version detail. |
| **Legacy CRUD** | `/strategies` remains US005 research records, labeled **Research strategies**. It does not claim to be Library.                                   |
| **Shell**       | Strategy Library nav item in the PC-19 Research band.                                                                                             |

No new domain. No new Source of Truth. Library remains sole Strategy SoT. Runtime remains validation only. Write ports (Registration / Certification / Lifecycle) stay inactive.

---

## Product path (not a redesign)

| File                                                                       | Role                                                            |
| -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `apps/api/src/modules/strategy-library/strategy-library.controller.ts`     | HTTP transport for existing Lookup + Eligibility ports          |
| `apps/api/src/modules/strategy-library/strategy-library-product.module.ts` | PC-01 Nest adapter; certified `StrategyLibraryModule` unchanged |
| `apps/web/src/strategy-library/`                                           | Library browser + immutable version detail                      |
| `apps/web/src/layout/AppLayout.tsx`                                        | Official Library nav, distinct from research CRUD               |
| `apps/web/src/pages/StrategiesPage.tsx`                                    | Research registry labeled as not Library                        |

Ports used: `StrategyLibraryLookupPort`, `StrategyLibraryEligibilityPort`. UI and REST delegate. No shadow API. No duplicated certification / eligibility / envelope logic.

---

## REST contract

Added (Library owner, Lookup / Eligibility facts only):

- `GET /v1/strategy-library` — list (`workspaceId` from `X-Workspace-Id`; optional family, statuses, exchange scope, includeArchived, limit, cursor, `q`)
- `GET /v1/strategy-library/:libraryEntryId` — get by library entry id
- `GET /v1/strategy-library/families/:strategyFamilyId/versions/:version` — get by family + version
- `GET /v1/strategy-library/:libraryEntryId/eligibility` — `checkEligibility`

Unchanged:

- `GET|POST|PATCH|DELETE /v1/strategies` — experimental registry CRUD. Not Library.

Default list is certified membership (API Contract §6.2). Archived is hidden unless requested. Missing workspace header is **400**. Foreign workspace is **403**. Unknown or cross-workspace entry is **404**.

Empty library is a valid product state. Certification (PC-02) fills the catalog.

---

## UI

- Library browser grouped by family (version history)
- Search over name / family / version / id
- Filter: certified, deprecated, archived, uncertified, all
- Certification, eligibility, and envelope badges
- Read-only version inspector (content hash, scopes, evidence, envelope)
- Deprecation / archive visible as membership status
- Empty, loading, and error states
- No certify, edit, deprecate, archive, deploy, or Coming Soon controls

---

## Architecture freeze

| Artifact                        | Edited |
| ------------------------------- | ------ |
| Architecture Specification v2.0 | **No** |
| Authority Matrix                | **No** |
| Alias Dictionary                | **No** |
| RC-19 … RC-28 history           | **No** |

---

## Definition of Done

| #   | Gate                               | Result                                                                            |
| --- | ---------------------------------- | --------------------------------------------------------------------------------- |
| 1   | Backend functionality complete     | **TRUE** — Lookup / Eligibility operable for a user of this slice                 |
| 2   | REST transport complete            | **TRUE** — list / get / family-version / eligibility                              |
| 3   | UI complete                        | **TRUE** — browser, history, badges, search, filter, immutable detail             |
| 4   | Existing application ports exposed | **TRUE** — no shadow API; `/strategies` not relabeled                             |
| 5   | Integration wiring complete        | **TRUE** — Operator Shell hosts Library; workspace header scopes reads            |
| 6   | Tests PASS                         | **TRUE** — web 125, api 2978                                                      |
| 7   | Documentation updated              | **TRUE** — this report + companions; Spec / Matrix / Alias / RC history untouched |
| 8   | Release Notes written              | **TRUE** — [`pc-01-release-notes.md`](./pc-01-release-notes.md)                   |
| 9   | CHANGELOG updated                  | **TRUE**                                                                          |
| 10  | Backlog updated                    | **TRUE** — PC-01 Closed                                                           |
| 11  | Canonical user journey works       | **TRUE** — J-05 Complete; UI Policy not violated                                  |

```text
Package: PC-01
Journey steps enabled: J-05
Definition of Done: ALL items 1–11 TRUE
Spec v2.0 unchanged: YES
Authority Matrix unchanged: YES
Alias Dictionary unchanged: YES
RC-19…RC-28 unaltered: YES
Live Trading implied: NO
Closed by: implementation  Date: 2026-08-15
```

---

## Companions

- [Architecture Impact](./pc-01-architecture-impact.md)
- [Compatibility Report](./pc-01-compatibility-report.md)
- [Library UX Audit](./pc-01-library-ux-audit.md)
- [Tests Summary](./pc-01-tests-summary.md)
- [Validation Report](./pc-01-validation-report.md)
- [Documentation Summary](./pc-01-documentation-summary.md)
- [Release Notes](./pc-01-release-notes.md)
- [Product Readiness Update](./pc-01-product-readiness-update.md)

**STOP.** Next package is PC-02 Certification Product. Do not begin PC-02 until this package is reviewed.

---

**End of Implementation Report.**
