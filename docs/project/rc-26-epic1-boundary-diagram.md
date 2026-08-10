# RC-26 Epic 1 — Trading Orchestrator & Market State Boundary Diagram

**Document:** Trading Orchestrator & Market State Boundary Diagram  
**Status:** Epic 1 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 1 Report](./rc-26-epic1-trading-orchestrator-market-state-boundary.md) · [Integration Diagram](./rc-26-integration-diagram.md)

---

## 1. Bounded contexts

```text
┌──────────────────────────────────────────────────────────────────┐
│              MARKET STATE (market_state_artifact)                │
│              moduleId: market-state                              │
│                                                                  │
│  Owns (declared — not implemented in Epic 1):                    │
│    • market-state-boundary                                       │
│    • market-state                                                │
│    • market-state-lifecycle                                      │
│    • market-state-transition                                     │
│    • current-state-snapshot                                      │
│                                                                  │
│  Epic 1 activePorts: ALL false                                   │
│  Mantra: Market State describes — never qualifies / executes     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│         TRADING ORCHESTRATOR (orchestration_artifact)            │
│         moduleId: trading-orchestrator                           │
│                                                                  │
│  Owns (declared — not implemented in Epic 1):                    │
│    • orchestrator-boundary                                       │
│    • orchestration-workflow / lifecycle                          │
│    • coordination-pipeline                                       │
│    • execution-intent-sequencing                                 │
│    • selection-decision / tactic-selection                       │
│    • session-handoff-intent                                      │
│                                                                  │
│  Epic 1: no orchestration behaviour, ports inactive              │
│  Mantra: Orchestrator coordinates — never executes / certifies   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Ownership map

```text
┌─────────────────────┐
│  LIVE MARKET DATA   │  Ingress (consume later — Epic 2)
│  + Qual / Profile*  │  *confidence reads later
└──────────┬──────────┘
           │ read-only (Epic 2+) — NOT wired in Epic 1
           ▼
┌─────────────────────┐
│    MARKET STATE     │  Describe: current conditions
│   (RC-26 Epic 1)    │
└──────────┬──────────┘
           │ read (Epic 5+) — NOT wired in Epic 1
           ▼
┌─────────────────────┐
│ TRADING ORCHESTRATOR│  Coordinate: select + handoff intents
│   (RC-26 Epic 1)    │
└──────────┬──────────┘
           │ (later Epics — NOT wired in Epic 1)
           ├── Library / Envelope (consume)
           ├── Runtime Enforcement Gate (consume)
           ├── Risk policy reads (consume)
           └── Session handoff intents
           │
           ▼
┌─────────────────────┐
│ FUTURE CONSUMERS    │
│ Reporting / AI / CC │  (Epic 6+)
└─────────────────────┘

Strategy Library / Runtime Enforcement / Session / Risk / Orders / Execution
  remain SoT / Gate owners — untouched in Epic 1
```

---

## 3. What Market State must not absorb

```text
✗ Qualification runs / decisions / lifecycle ownership
✗ Market Profile version publish ownership
✗ Strategy / tactic selection
✗ Trading Orchestrator ownership
✗ Runtime Enforcement Gate
✗ Strategy Library certification
✗ Trading Session lifecycle / Bot commands
✗ Orders / Risk / Execution / Ledger
✗ Reporting / AI ownership
✗ Force trades / become second Qualification
✗ Become execution Source of Truth
```

---

## 4. What Trading Orchestrator must not absorb

```text
✗ Strategy certification / Envelope ownership
✗ Runtime Enforcement Gate ownership / soft-pass
✗ Duplicate validation Gate
✗ Market Qualification / Profile ownership
✗ Market State ownership
✗ Trading Session lifecycle ownership
✗ Risk Decisions / Kill Switch SoT
✗ Orders / Execution / Adapter / Ledger / Fills
✗ Invent envelope points / silent strategy version change
✗ AI trade decisions
✗ Become Execution Engine / execution SoT
```

---

## 5. Dependency direction (Epic 1)

```text
ALLOWED (Epic 1):
  AppModule → MarketStateModule
  AppModule → TradingOrchestratorModule
  (no cross-module State ↔ Orchestrator wiring yet)
  (no Library / Gate / Session / Risk / Qual / Profile wiring yet)

FORBIDDEN forever (and absent in Epic 1):
  Market State ──import──▶ Qualification / Profile / Orchestrator / Session / Orders
  Orchestrator ──import──▶ Orders / Execution / Risk Decision production
  Orchestrator ──soft-pass──▶ Runtime Enforcement
  Orchestrator ──own──▶ Session lifecycle / Library / Gate
  Any peer ──import──▶ market-state Nest module / trading-orchestrator Nest module
```

---

## Approval

| Reviewer role | Checkpoint                         | Status  |
| ------------- | ---------------------------------- | ------- |
| Architecture  | Spec §5.4 / §5.5 boundary fidelity | Pending |
| Tech          | Nest wiring + inactive ports       | Pending |
| Product       | Ownership / non-goals accepted     | Pending |
