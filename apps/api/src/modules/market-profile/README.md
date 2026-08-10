# Market Profile (`market-profile`)

**RC-25** — Market Profile bounded context (Architecture Spec v2.0 §5.3).

## Authority

| Concern                             | Class                                                     |
| ----------------------------------- | --------------------------------------------------------- |
| Profile versions + dimensions       | **research_artifact** (research SoT for profile versions) |
| Observational dimension inputs      | **observation** (raw inputs; `scored: false`)             |
| Consumer projections (Epic 6)       | Read-only projections — consumers never become SoT        |
| Qualification lifecycle / decisions | Owned by **Market Qualification** (sibling)               |
| Execution / Session / Risk          | Never — execution SoT owners unchanged                    |

**Profiles describe. Consumers read projections only.**

## Epic posture

| Epic                                          | Status     |
| --------------------------------------------- | ---------- |
| 1–5 Boundary → versioning                     | Done       |
| 6 Consumer read ports + authority conformance | **Active** |

## Epic 6 surfaces

- `MarketProfileConsumerReadPort` — latest / history / version-metadata projections
- Immutable consumer read models (`mutable: false`, `consumerWritable: false`)
- Intended audiences: Trading Orchestrator, Reporting, AI Analytics (future)
- Lake category marker `MarketProfile` reserved as projection-only

## Dependency direction

```text
Live Market Data → Market Qualification → Market Profile
```

No reverse imports. No direct Live Market Data import.

## Forbidden

Qualification decisions; strategy selection; Runtime Enforcement; profile calculation; forcing trades; REST / durable persistence.
