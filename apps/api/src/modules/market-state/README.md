# Market State (`market-state`)

**RC-26** — Market State bounded context (Architecture Spec v2.0 §5.4).

## Authority

| Concern                           | Class                                                  |
| --------------------------------- | ------------------------------------------------------ |
| Market State versions / snapshots | **market_state_artifact** (current-condition SoT)      |
| Observational / research inputs   | **observation** / **research_artifact** (consume)      |
| Consumer projections              | Read-only for Reporting / AI / Command Center (Epic 6) |
| Qualification / Profile           | Owned by RC-25 modules (consume)                       |
| Strategy selection / handoff      | Owned by **Trading Orchestrator** (sibling)            |
| Execution / Session / Risk        | Never                                                  |

**Market State describes. It does not qualify, select, or execute.**

## Epic posture

| Epic                                | Status     |
| ----------------------------------- | ---------- |
| 1–3 Boundary / input reads / domain | Done       |
| 6 Consumer read ports               | **Active** |

## Epic 6 surfaces

- `MarketStateConsumerReadPort` — `getCurrentStateProjection` / `listRecentTransitions`
- Immutable projections: current state, lifecycle, version, metadata summary
- Intended audiences: Reporting, AI Analytics, Command Center, Monitoring
- Classify/query Nest ports remain **inactive**
- REST / persistence remain inactive

## Dependency direction

```text
Live Market Data / Qualification / Profile → Market State → (consumer projections)
```

Forbidden forever: become Qualification/Profile; select strategies; authorize Runtime; REST/persistence product.
