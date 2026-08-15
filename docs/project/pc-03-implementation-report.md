# PC-03 Deployment Product — Implementation Report

**Package:** PC-03 Deployment Product  
**Wave:** C — begins (certified Deployment product)  
**Date:** 2026-08-15  
**Journey:** J-07 Deployment — **COMPLETE**  
**Status:** Ready for review (stop before PC-11)  
**Readiness:** Deployment declared scope **100%**. Overall Product Readiness remains **58%** (no invented overall score).

This package exposes the certified Strategy Deployment workflow (US211 create draft / approve / get / list) as a customer product. It does not redesign Deployment, Runtime, Library, or Trading Session, and does not introduce a Deploy Engine, automatic deployment, or a Deployment authority.

---

## What was exposed

| Surface            | Change                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **REST**           | Existing `/v1/strategy-deployments` create, approve, list, get. Optional `libraryEntryId` so the Gate can resolve Library identity. |
| **UI**             | Deployment Wizard, list, details, history, status, metadata, Runtime Validation result, Library Version.                            |
| **Shell**          | Deployment nav item in the PC-19 Research band.                                                                                     |
| **Library / Gate** | Optional CTA from Library detail and Gate PASS result. Library remains SoT. Gate remains validation authority.                      |

No new domain. No new Source of Truth. Deployment remains the workflow owner. Runtime Enforcement remains the sole validation authority. Library remains the sole Strategy SoT. Trading Session unchanged.

---

## Product path (not a redesign)

| File                                                                         | Role                                                       |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/api/src/modules/strategy-deployment/strategy-deployment.service.ts`    | Existing owner: create draft, approve freeze, consume Gate |
| `apps/api/src/modules/strategy-deployment/strategy-deployment.controller.ts` | Existing HTTP transport                                    |
| `apps/api/src/modules/strategy-deployment/strategy-deployment.view.ts`       | Product view of the existing aggregate                     |
| `apps/web/src/deployment/`                                                   | Wizard, list, details, history                             |

Ports used: existing Strategy Deployment commands; `RuntimeEnforcementPort.validateDeployment` on create/approve. When `libraryEntryId` is supplied, the Gate resolves Library identity. Deployment does not import Strategy Library. UI and REST delegate. No shadow API. No duplicated bind rules.

History is the existing durable Deployment list. It is not a second workflow owner.

---

## REST contract

Existing (Strategy Deployment owner):

- `POST /v1/strategy-deployments` — create draft (idempotent). Optional `libraryEntryId`. Gate must PASS.
- `POST /v1/strategy-deployments/:id/approve` — freeze approved. Gate must PASS. Re-approve is a successful no-op.
- `GET /v1/strategy-deployments` — list for the workspace
- `GET /v1/strategy-deployments/:id` — status, metadata, Library Version, Runtime Validation stamp

Unchanged:

- `GET /v1/strategy-library` — Lookup (PC-01)
- Certification REST (PC-02)
- Runtime Validation REST (PC-04)
- Trading Session start transports

Missing workspace header is **400**. Foreign workspace is **403**. Unknown deployment is **404**. Gate FAIL is **422** with catalog reasons. There is no force-pass, automatic approve, or session-start field.

---

## UI

- Deployment Wizard: select Library Version → envelope point → confirm paper draft
- Progress while create runs (Gate is invoked by Deployment)
- Deployment list and history
- Deployment details: status, metadata, Library Version, Runtime Validation result
- Approve on a draft (separate from create; not automatic)
- No session start, Deploy Engine, Coming Soon, or override

---

## Architecture freeze

| Artifact                        | Edited |
| ------------------------------- | ------ |
| Architecture Specification v2.0 | **No** |
| Authority Matrix                | **No** |
| Alias Dictionary                | **No** |
| RC-19 … RC-28 history           | **No** |

Deployment still does not import Strategy Library. Session lifecycle remains owned by Trading Session.

---

## Definition of Done

| #   | Gate                               | Result                                                                            |
| --- | ---------------------------------- | --------------------------------------------------------------------------------- |
| 1   | Backend functionality complete     | **TRUE** — create / view / approve / status / history operable                    |
| 2   | REST transport complete            | **TRUE** — existing Deployment commands + product view                            |
| 3   | UI complete                        | **TRUE** — wizard, list, details, history, metadata, Gate result, Library Version |
| 4   | Existing application ports exposed | **TRUE** — no shadow API; no Deploy Engine                                        |
| 5   | Integration wiring complete        | **TRUE** — create/approve still consume `validateDeployment`                      |
| 6   | Tests PASS                         | **TRUE** — web 153, api 3014                                                      |
| 7   | Documentation updated              | **TRUE** — this report + companions; Spec / Matrix / Alias / RC history untouched |
| 8   | Release Notes written              | **TRUE** — [`pc-03-release-notes.md`](./pc-03-release-notes.md)                   |
| 9   | CHANGELOG updated                  | **TRUE**                                                                          |
| 10  | Backlog updated                    | **TRUE** — PC-03 Closed                                                           |
| 11  | Canonical user journey works       | **TRUE** — J-07 Complete; UI Policy not violated                                  |

```text
Package: PC-03
Journey steps enabled: J-07
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

- [Architecture Impact](./pc-03-architecture-impact.md)
- [Compatibility Report](./pc-03-compatibility-report.md)
- [Deployment UX Audit](./pc-03-deployment-ux-audit.md)
- [Tests Summary](./pc-03-tests-summary.md)
- [Validation Report](./pc-03-validation-report.md)
- [Documentation Summary](./pc-03-documentation-summary.md)
- [Release Notes](./pc-03-release-notes.md)
- [Product Readiness Update](./pc-03-product-readiness-update.md)

**STOP.** Next package is PC-11 Trading Orchestrator Product. Do not begin PC-11 until this package is reviewed.

---

**End of Implementation Report.**
