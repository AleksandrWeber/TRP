# PC-13 Command Center Product — Implementation Report

**Package:** PC-13 Command Center Product  
**Wave:** D — begins (paper operations console)  
**Date:** 2026-08-15  
**Journey:** J-14 Command Center — **COMPLETE** (operate / create). Dashboard tiles remain PC-15 15-f.  
**Status:** Ready for review (stop before PC-15)  
**Readiness:** Command Center declared scope **100%**. Overall Product Readiness remains **58%** (no invented overall score).

This package exposes Command Center as the official paper-first operations console. It does not redesign Trading Session, Orchestrator, Deployment, or Runtime, and does not create Orders, Execution, Risk approvals, or Live Trading.

---

## What was exposed

| Surface   | Change                                                                                                                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REST**  | Existing `/v1/trading-sessions` list / get / pause / resume / stop, plus create and start. Supporting `POST /v1/paper-accounts` over Paper Account. GET session includes health and runtime consumer reads. |
| **UI**    | Command Center fleet, create-bot wizard, session details, lifecycle, pause / resume / stop, monitoring, health, runtime status, Deployment reference, Orchestration reference.                              |
| **Shell** | Command Center remains the Paper trading home. Overview tile: Operate.                                                                                                                                      |

No new domain. No new Source of Truth. Command Center remains command UI + projection. Trading Session remains Session owner. Orchestrator remains coordination only (`createsSession: false`). Deployment unchanged. Runtime unchanged.

---

## Product path (not a redesign)

| File                                                                    | Role                                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/api/src/modules/trading-session/trading-session.service.ts`       | Existing Session owner: create, start, pause, resume, stop |
| `apps/api/src/modules/bot-facade/bot-facade.service.ts`                 | Product facade: delegates create/start/lifecycle           |
| `apps/api/src/modules/bot-facade/trading-session-command.controller.ts` | HTTP create / start / pause / resume / stop                |
| `apps/api/src/modules/bot-facade/trading-session-query.controller.ts`   | HTTP list / get + operations projection                    |
| `apps/api/src/modules/paper-account/paper-account.controller.ts`        | HTTP create for existing Paper Account owner               |
| `apps/web/src/command-center/`                                          | Operations console, wizard, details                        |

Ports used: existing Trading Session commands; Paper Account create; Strategy Runtime `getLifecycle` / `getDiagnostics` as consumer reads; Deployment and Orchestrator REST as references. UI and REST delegate. No shadow Session. No duplicated bind or Gate rules.

Emergency Controls remain hidden. Durable Kill Switch REST is live-only. UI Policy forbids a visible unavailable danger zone.

---

## REST contract

Existing and newly transported Session commands:

- `POST /v1/paper-accounts` — paper mode only
- `POST /v1/trading-sessions` — create (`origin: strategy` only)
- `POST /v1/trading-sessions/:id/start`
- `GET /v1/trading-sessions` — list
- `GET /v1/trading-sessions/:id` — details, health, runtime status, Deployment reference
- `POST /v1/trading-sessions/:id/pause`
- `POST /v1/trading-sessions/:id/resume`
- `POST /v1/trading-sessions/:id/stop`

Unchanged:

- Strategy Deployment REST (PC-03)
- Orchestrator REST (PC-11) — `createsSession` remains false
- Runtime Validation REST (PC-04)
- Paper Bots sandbox `/paper/sessions`

Missing workspace header is **400**. Foreign workspace is **403**. Unknown session is **404**. Unapproved Deployment is **422**. Product DTO does not accept `live` origin or live paper-account mode.

There is no order, execution, risk-approval, or kill-switch field.

---

## UI

- Command Center: active paper sessions, bot list, lifecycle, pause / resume / stop
- Create paper bot wizard: approved Deployment → paper account → create + start via Session
- Session details: monitoring, health, runtime status, Deployment reference, Orchestration reference (`createsSession: false`)
- No Live Trading, Coming Soon, order ticket, or Emergency Controls

---

## Architecture freeze

| Artifact                        | Edited |
| ------------------------------- | ------ |
| Architecture Specification v2.0 | **No** |
| Authority Matrix                | **No** |
| Alias Dictionary                | **No** |
| RC-19 … RC-28 history           | **No** |

Trading Session remains Session owner. Command Center remains command UI only. Orchestrator still does not create Sessions.

---

## Definition of Done

| #   | Gate                               | Result                                                                                            |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Backend functionality complete     | **TRUE** — view / create / start / pause / resume / stop / health / runtime / references operable |
| 2   | REST transport complete            | **TRUE** — existing Session commands + product view                                               |
| 3   | UI complete                        | **TRUE** — console, wizard, details, lifecycle, monitoring                                        |
| 4   | Existing application ports exposed | **TRUE** — no shadow API; no Session redesign                                                     |
| 5   | Integration wiring complete        | **TRUE** — create still binds approved Deployment; Orchestrator consume remains PC-15             |
| 6   | Tests PASS                         | **TRUE** — web 168, api 3043                                                                      |
| 7   | Documentation updated              | **TRUE** — this report + companions; Spec / Matrix / Alias / RC history untouched                 |
| 8   | Release Notes written              | **TRUE** — [`pc-13-release-notes.md`](./pc-13-release-notes.md)                                   |
| 9   | CHANGELOG updated                  | **TRUE**                                                                                          |
| 10  | Backlog updated                    | **TRUE** — PC-13 Closed                                                                           |
| 11  | Canonical user journey works       | **TRUE** — J-14 Complete; UI Policy not violated                                                  |

```text
Package: PC-13
Journey steps enabled: J-14
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

- [Architecture Impact](./pc-13-architecture-impact.md)
- [Compatibility Report](./pc-13-compatibility-report.md)
- [Command Center UX Audit](./pc-13-command-center-ux-audit.md)
- [Tests Summary](./pc-13-tests-summary.md)
- [Validation Report](./pc-13-validation-report.md)
- [Documentation Summary](./pc-13-documentation-summary.md)
- [Release Notes](./pc-13-release-notes.md)
- [Product Readiness Update](./pc-13-product-readiness-update.md)

**STOP.** Next package is PC-15 Product Flow Integration. Do not begin PC-15 until this package is reviewed.

---

**End of Implementation Report.**
