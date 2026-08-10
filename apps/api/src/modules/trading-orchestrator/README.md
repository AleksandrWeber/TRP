# Trading Orchestrator (`trading-orchestrator`)

**RC-26** — Trading Orchestrator bounded context (Architecture Spec v2.0 §5.5).

## Authority

| Concern                                  | Class                                                  |
| ---------------------------------------- | ------------------------------------------------------ |
| Orchestration workflow / plans / intents | **orchestration_artifact** (coordination SoT)          |
| Consumer projections                     | Read-only for Reporting / AI / Command Center (Epic 6) |
| Strategy certification / Envelope        | Owned by **Strategy Library** (consumed)               |
| Runtime Enforcement Gate                 | Owned by **Runtime Enforcement** (consumed)            |
| Market State                             | Owned by **Market State** (consumed)                   |
| Session lifecycle                        | Owned by **Trading Session** (handoff intents only)    |
| Risk / Orders / Execution                | Never                                                  |

**Trading Orchestrator coordinates. It does not execute, certify, enforce, or qualify.**

## Epic posture

| Epic                                          | Status     |
| --------------------------------------------- | ---------- |
| 1 / 4 / 5 Boundary / domain / workflow ports  | Done       |
| 6 Consumer read ports + authority conformance | **Active** |

## Epic 6 surfaces

- `TradingOrchestratorConsumerReadPort` — summary / selection / handoff projections
- Immutable flags: `forcesTrade`, `approvesRisk`, `submitsOrders`, `ownsSessionLifecycle` always false
- Intended audiences: Reporting, AI Analytics, Command Center, Monitoring
- REST / persistence remain inactive

## Workflow sequence (unchanged)

```text
Market State → Library lookup/eligibility → Gate validateDeployment → SessionHandoffIntent
```

Forbidden forever: Session ownership; Orders; Risk approval; soft-pass Gate; invent Envelope points.
