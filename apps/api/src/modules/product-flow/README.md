# Product Flow (`product-flow`)

**PC-15** — composition wiring between certified products. Not a bounded context.

## Slice 15-a — Orchestrator → Session

Trading Session consumes `SessionHandoffIntent` through existing Session create.

| Concern                       | Owner                                              |
| ----------------------------- | -------------------------------------------------- |
| Session lifecycle             | **Trading Session**                                |
| Coordination / handoff intent | **Trading Orchestrator** (`createsSession: false`) |
| Consume wiring                | This module (read intent, delegate create)         |
| Command Center                | Projection of the created Session                  |

Forbidden: Orchestrator importing Session; mutating the intent; Orders; Execution; Risk approvals; new SoT.

## Slice 15-b — Qualification → Profile

Completed Qualification publishes a Market Profile version through existing `publishProfileVersion()`.

| Concern                   | Owner                                         |
| ------------------------- | --------------------------------------------- |
| Qualification lifecycle   | **Market Qualification**                      |
| Profile versions          | **Market Profile** (append-only)              |
| Complete → publish wiring | This module (delegate complete, then publish) |
| Latest / history reads    | Market Profile query + consumer ports         |

Forbidden: Qualification importing Profile; Profile owning Qualification; scoring; new profile calculations; new authority.

## Slice 15-c — Reporting → AI Analytics

Completed ReportRun invokes existing `generateNarrative()`. Narrative is attached as a projection. ReportRun is not mutated.

| Concern                   | Owner                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| ReportRun / aggregations  | **Reporting**                                                                               |
| Analytical Narrative      | **AI Analytics** (narrative only)                                                           |
| Complete → narrate wiring | This module (delegate request, then generateNarrative)                                      |
| Reporting UI exposure     | Projection of the attached narrative (PC-05 product UI reads this; no new REST/UI in PC-15) |

Forbidden: Reporting importing AI; AI owning ReportRuns; Lake writes; AI decisions; trade authority; new narrative owner.

## Slice 15-d — Reporting → Notification Delivery

Completed ReportRun invokes existing `deliver()`. Routing and channel eligibility stay in Notification Delivery. Delivery result is recorded. ReportRun is not mutated.

| Concern                                | Owner                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| ReportRun / aggregations               | **Reporting**                                                                            |
| Routing, eligibility, delivery records | **Notification Delivery** (delivery only)                                                |
| Complete → deliver wiring              | This module (delegate request, then deliver)                                             |
| Reporting UI exposure                  | Projection of the delivery result (PC-05 product UI reads this; no new REST/UI in PC-15) |

Forbidden: Reporting importing Notification; Notification owning or generating reports; Email / Slack / Telegram Bot activation; scheduler; retries; delivery authority.

## Slice 15-e — Notification Delivery → Channels

Notification Delivery reaches existing channel adapters. In-memory Telegram send is operational after the existing connect/complete bind. Reserved channels stay reserved and keep the documented skip.

| Concern                                         | Owner                                           |
| ----------------------------------------------- | ----------------------------------------------- |
| Routing, eligibility, `deliver()`               | **Notification Delivery** (delivery only)       |
| Telegram send                                   | **In-memory Telegram adapter** (transport only) |
| Reserved Email / Slack / Discord / Teams / Push | Catalog **reserved-inactive** (documented skip) |
| Bind → adapter dispatch wiring                  | This module (delegate connect/complete/deliver) |
| Delivery UI exposure                            | Channel projection (no new REST/UI in PC-15)    |

Forbidden: Notification redesign; Telegram Bot API; activating deferred channels; scheduler; retries; control plane; channel ownership changes.

## Slice 15-f — Dashboard & Product Projections

Completed product flows update existing Dashboard and Command Center read projections.

| Concern                        | Owner                                                     |
| ------------------------------ | --------------------------------------------------------- |
| ReportRun / aggregations       | **Reporting**                                             |
| Analytical Narrative           | **AI Analytics**                                          |
| Delivery records               | **Notification Delivery**                                 |
| Session lifecycle              | **Trading Session**                                       |
| Runtime lifecycle              | **Strategy Runtime** (consumer read)                      |
| Qualification / Profile latest | **Qualification** / **Profile** (where already available) |
| Dashboard composition          | This module (read-only projection)                        |
| Command Center                 | Existing session GET + command UI                         |

Forbidden: new SoT; new REST resource; Dashboard redesign; Command Center redesign; owner redesign; `/reports` as RC-24 Reporting.
