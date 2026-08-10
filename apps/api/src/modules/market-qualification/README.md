# Market Qualification (`market-qualification`)

**RC-25** — Market Qualification bounded context (Architecture Spec v2.0 §5.3).

## Authority

| Concern                         | Class                                                      |
| ------------------------------- | ---------------------------------------------------------- |
| Qualification state / lifecycle | **research_artifact** (domain SoT for this fact family)    |
| Market confidence / health      | **research_artifact**                                      |
| Live Market Data observations   | **observation** consumer views (LMD remains authoritative) |
| Approved Research refs          | **research_artifact** refs (Lake Research category)        |
| Consumer projections (Epic 6)   | Read-only projections — consumers never become SoT         |
| Market Profile versions         | Owned by **Market Profile** (sibling) — not this module    |
| Execution / Session / Risk      | Never — execution SoT owners unchanged                     |

**Qualification manages lifecycle. Consumers read projections only.**

## Epic posture

| Epic                                          | Status     |
| --------------------------------------------- | ---------- |
| 1–5 Boundary → lifecycle                      | Done       |
| 6 Consumer read ports + authority conformance | **Active** |

## Epic 6 surfaces

- `MarketQualificationConsumerReadPort` — lifecycle / confidence / health / summary projections
- Immutable consumer read models (`mutable: false`, `consumerWritable: false`)
- Intended audiences: Trading Orchestrator, Reporting, AI Analytics (future)
- Lake category marker `MarketQualification` reserved as projection-only

## Forbidden

Strategy selection; Runtime Gate; Session commands; scoring algorithms; Profile ownership; REST / durable persistence.
