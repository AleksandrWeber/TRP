# PC-12 Exchange Scope Product — Implementation Report

**Package:** PC-12 Exchange Scope Product  
**Wave:** C — market context  
**Date:** 2026-08-15  
**Journey:** Supports J-07 Deployment, J-08 Orchestrator, J-14 Command Center  
**Status:** Ready for review (stop before PC-08)  
**Readiness:** Exchange Scope declared scope **100%**. Overall Product Readiness remains **58%** (no invented overall score).

This package exposes Exchange Scope as one customer product (UI: Cluster) over existing service, query, and consumer-read ports. It does not redesign Exchange Scope, Runtime, Trading Session, or Deployment, and does not introduce venue adapters, exchange APIs, or a new Source of Truth.

---

## What was exposed

| Surface   | Change                                                                                                                                                                                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REST**  | Workspace, venue catalog, list/get, create, rename, activate, suspend, archive, config, versions, policy inputs, bindings, metadata, history, and lifecycle on `/v1/exchange-scopes`. `GET /v1/exchange-scopes/default` remains the existing Bot Facade overview. |
| **UI**    | Cluster home, scope browser, current active scope, versions, bindings, policies, lifecycle, history, and metadata at `/clusters`.                                                                                                                                 |
| **Shell** | Paper trading → Cluster. Home tile. Adapter `/trading/exchanges` stays redirected out of the product path.                                                                                                                                                        |

No new domain. No new Source of Truth. Exchange Scope remains owner. Domain `rest: false` is unchanged. HTTP is a sibling product adapter.

---

## Product path (not a redesign)

| File                                           | Role                                                                                    |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| `apps/api/src/modules/exchange-scope/`         | Existing owner: identity, lifecycle, config versions, policy inputs, bindings, metadata |
| `apps/api/src/modules/exchange-scope-product/` | HTTP + product views over existing ports                                                |
| `apps/web/src/clusters/`                       | Cluster operator UI                                                                     |

Ports used: existing `ExchangeScopeServicePort`, `ExchangeScopeQueryPort`, `ExchangeScopeConsumerReadPort`. Rename publishes a new configuration version with a new display name through `updateExchangeScopeConfig`. History is the existing version, lifecycle, policy, and binding records. It is not a second owner.

---

## REST contract

- `GET /v1/exchange-scopes` — workspace list (optional `lifecycleStatus`)
- `GET /v1/exchange-scopes/workspace` — counts, current active, browser, venue catalog
- `GET /v1/exchange-scopes/venues` — known isolation venues (`liveAdapter: false`)
- `POST /v1/exchange-scopes` — `registerExchangeScope`
- `GET /v1/exchange-scopes/:id` — detail (current, versions, bindings, policies, lifecycle, history, metadata)
- `GET /v1/exchange-scopes/:id/{config,versions,policy,policies,bindings,metadata,history,lifecycle}`
- `POST /v1/exchange-scopes/:id/{activate,suspend,archive,rename}`
- `PUT /v1/exchange-scopes/:id/config`
- `POST /v1/exchange-scopes/:id/policy`
- `POST /v1/exchange-scopes/:id/bindings`
- `POST /v1/exchange-scopes/:id/bindings/:bindingId/unbind`
- `POST /v1/exchange-scopes/:id/adapter-context`

Unchanged:

- Domain `EXCHANGE_SCOPE_PORTS_ACTIVE.rest` remains `false`
- `GET /v1/exchange-scopes/default`
- Runtime, Trading Session, Deployment

Missing workspace header is **400**. Foreign workspace is **403**. Unknown scope is **404**. Duplicate active venue / archived mutation is **409**. There is no venue API body and no live-capital connect.

---

## UI

- Exchange Scope Home / Cluster workspace
- Scope browser
- Current active Cluster
- Create Cluster (lab / paper only)
- Rename, activate, suspend, archive (only allowed transitions)
- Versions, bindings, policy inputs, lifecycle, history, metadata
- Empty, loading, and error states

Copy states Cluster is isolation, not a live exchange connection. Mode `live` is a label only when already present; create does not offer live capital.

---

## Architecture freeze

| Artifact                        | Edited |
| ------------------------------- | ------ |
| Architecture Specification v2.0 | **No** |
| Authority Matrix                | **No** |
| Alias Dictionary                | **No** |
| RC-19 … RC-28 history           | **No** |

Exchange Scope domain `rest: false` posture is unchanged. HTTP is a sibling product adapter. Exchange Scope still does not import the product adapter.

---

## Definition of Done

| #   | Gate                               | Result                                                                                        |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Backend functionality complete     | **TRUE** — existing register/lifecycle/config/policy/bindings operable                        |
| 2   | REST transport complete            | **TRUE** — product views over existing ports                                                  |
| 3   | UI complete                        | **TRUE** — home, browser, current, versions, bindings, policies, lifecycle, history, metadata |
| 4   | Existing application ports exposed | **TRUE** — no shadow API; no venue adapters                                                   |
| 5   | Integration wiring complete        | **TRUE** — no new owner wiring required                                                       |
| 6   | Tests PASS                         | **TRUE** — web 196, api 3177                                                                  |
| 7   | Documentation updated              | **TRUE** — this report + companions; Spec / Matrix / Alias / RC history untouched             |
| 8   | Release Notes written              | **TRUE** — [`pc-12-release-notes.md`](./pc-12-release-notes.md)                               |
| 9   | CHANGELOG updated                  | **TRUE**                                                                                      |
| 10  | Backlog updated                    | **TRUE** — PC-12 Closed                                                                       |
| 11  | Canonical user journey works       | **TRUE** — supporting Cluster product for J-07 / J-08 / J-14; UI Policy not violated          |

```text
Package: PC-12
Journey steps enabled: J-07, J-08, J-14 (supporting Cluster product)
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

- [Architecture Impact](./pc-12-architecture-impact.md)
- [Compatibility Report](./pc-12-compatibility-report.md)
- [Exchange Scope UX Audit](./pc-12-exchange-scope-ux-audit.md)
- [Product Surface](./pc-12-product-surface.md)
- [Scope Matrix](./pc-12-scope-matrix.md)
- [Product Gap](./pc-12-product-gap.md)
- [User Value](./pc-12-user-value.md)
- [System Boundaries](./pc-12-system-boundaries.md)
- [Authority Consumption](./pc-12-authority-consumption.md)
- [Customer-visible Changes](./pc-12-customer-visible-changes.md)
- [Tests Summary](./pc-12-tests-summary.md)
- [Validation Report](./pc-12-validation-report.md)
- [Documentation Summary](./pc-12-documentation-summary.md)
- [Release Notes](./pc-12-release-notes.md)
- [Product Readiness Update](./pc-12-product-readiness-update.md)

**STOP.** Next package is PC-08 Qualification Product. Do not begin PC-08 until this package is reviewed.

---

**End of Implementation Report.**
