# RC-26 — Trading Orchestrator & Market State Integration Diagram

**Document:** Trading Orchestrator & Market State Integration (RC-26)  
**Status:** APPROVED — Epic 2 input read path active (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Architecture mapping. Epic 2 activates LMD / Qualification / Profile → Market State reads.

**Parent:** [RC-26 Implementation Plan](./rc-26-implementation-plan.md)  
**API:** [API Contract](./rc-26-api-contract.md)  
**Domain:** [Domain Model Contract](./rc-26-domain-model-contract.md)  
**Epics:** [Epic Breakdown](./rc-26-epic-breakdown.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.4, §5.5, §7  
**C4 context:** [V2 C4 Container Diagram](./v2-c4-container-diagram.md)  
**Isolation:** [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)  
**Tactics:** [Tactics Contract](./v2-tactics-contract.md)

---

## 1. Integration principle

Market State **describes** current conditions. Trading Orchestrator **coordinates** certified selection and Session handoff. Neither executes. Neither replaces participating-module ownership.

```text
Live Market Data
  + Qualification / Profile (confidence reads)
        ↓  (read)
Market State
        ↓  (read)
Trading Orchestrator
  ├── Strategy Library (certified + envelopes)
  ├── Runtime Enforcement (Gate)
  ├── Risk Engine (policy/constraint reads)
  └── Trading Session (handoff intents)
        ↓  (read models)
Reporting / AI Analytics / Command Center
```

**There must be no reverse dependency that steals SoT.**

- Orchestrator must not own Session lifecycle, Risk Decisions, Orders, or Execution.
- Market State must not own Qualification runs or Profile versions.
- Neither module must certify strategies or soft-pass the Gate.
- Confidence never forces trades; Envelope points are never invented.

**Market State describes. Orchestrator coordinates. Modules remain authoritative.**

---

## 2. Authority classes on this diagram

| Element                  | Class                          | Role in RC-26                                       |
| ------------------------ | ------------------------------ | --------------------------------------------------- |
| Live Market Data         | **SoT** (ingress observations) | Consumed by Market State                            |
| Market Qualification     | **Research artifact SoT**      | Consumed (confidence/health) — not redesigned       |
| Market Profile           | **Research SoT** (versions)    | Consumed (confidence/dimensions) — not redesigned   |
| Market State             | **Current-condition SoT**      | Classifications + lifecycle                         |
| Strategy Library         | **SoT** (certification)        | Consumed — untouched                                |
| Runtime Enforcement      | **Gate**                       | Consumed fail-closed — untouched                    |
| Trading Orchestrator     | **Coordination artifact SoT**  | Selection sequencing + handoff intents              |
| Trading Session          | **SoT** (lifecycle)            | Accepts handoff intents                             |
| Risk Engine              | **SoT** (Risk Decisions)       | Policy reads only from Orchestrator                 |
| Orders / Execution       | **SoT**                        | **Untouched** — downstream of Session path          |
| Reporting / AI Analytics | **Projection / Narrative**     | Read Orchestrator / State — not redesigned          |
| Command Center           | **Ops UI + projection**        | Read models / future operator confirm — UI deferred |
| Knowledge Lake           | **Projection**                 | Optional markers only                               |

---

## 3. Required topology (normative)

### 3.1 Primary chain (Spec §7 aligned)

```text
┌──────────────────────────┐
│    LIVE MARKET DATA      │  Ingress observations
└────────────┬─────────────┘
             │ + Qual/Profile consumer reads
             ▼
┌──────────────────────────┐
│      MARKET STATE        │  Describe (current conditions)
│  classify / lifecycle    │
└────────────┬─────────────┘
             │ read
             ▼
┌──────────────────────────┐
│  TRADING ORCHESTRATOR    │  Coordinate
│  Selector + Tactical     │
│  workflow + handoff      │
└──┬─────────┬─────────┬───┘
   │         │         │
   │         │         └──────────────┐
   ▼         ▼                        ▼
┌────────┐ ┌──────────────┐   ┌──────────────┐
│LIBRARY │ │ ENFORCEMENT  │   │ RISK POLICY  │
│+ Env.  │ │ Gate (fail-  │   │ reads only   │
│        │ │  closed)     │   └──────────────┘
└────────┘ └──────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ TRADING SESSION│  Lifecycle SoT
         │ handoff accept │
         └────────┬───────┘
                  │ (existing path — not redesigned)
                  ▼
         Signal Intent → Risk Decision → Orders → Execution
```

### 3.2 Consumer fan-out (read only)

```text
Market State + Trading Orchestrator
        │ query / consumer read ports
        ▼
┌─────────────────────────────────────┐
│ Reporting (RC-24)                   │
│ AI Analytics (RC-24)                │
│ Command Center (RC-20 foundation)   │
└─────────────────────────────────────┘
```

### 3.3 Venue keying

```text
Exchange Scope (venue)
   └── marketSymbol
         ├── MarketState (current)
         ├── Qualification / Profile (inputs, owned elsewhere)
         └── OrchestrationRun[] (coordination attempts)
```

Cross-scope mixing of selection context is forbidden without explicit read models (none in RC-26).

### 3.4 Explicit non-edges (forbidden)

```text
FORBIDDEN:
  Market State ──replace──▶ Market Qualification
  Market State ──publish──▶ Market Profile versions
  Market State ──select──▶ Strategy / tactics
  Orchestrator ──certify──▶ Strategy Library
  Orchestrator ──soft-pass──▶ Runtime Enforcement Gate
  Orchestrator ──own──▶ Trading Session lifecycle
  Orchestrator ──approve──▶ Risk Decision
  Orchestrator ──submit──▶ Orders / Execution / Adapter
  Orchestrator ──mutate──▶ Ledger / Fills
  Orchestrator ──invent──▶ Envelope points / strategy versions
  Confidence ──force──▶ trade / exchange / strategy choice
  Orchestrator / State ──redesign──▶ Reporting / AI / Lake
  Duplicate Gate inside Orchestrator
  Duplicate Qualification pipeline inside Market State
```

---

## 4. Interaction notes

### 4.1 Live Market Data → Market State

- One-way read.
- Observations inform classification.
- Provider payloads stay in adapters; domain fields are platform-owned mappings.

### 4.2 Qualification / Profile → Market State (+ Orchestrator)

- Confidence / health / profile dimensions are **inputs**.
- They do not authorize trading and do not replace classification ownership.
- Profile refresh does not expand Tactical Envelope.

### 4.3 Market State → Trading Orchestrator

- Current classification informs Strategy Selector / Tactical Engine ranking.
- Absence / stale / failed state may block or degrade selection (fail closed or explicit degraded policy — never silent invent).

### 4.4 Strategy Library → Trading Orchestrator

- Lookup / Eligibility / Envelope are the only certified candidate sources.
- Orchestrator must not invent local certified lists.

### 4.5 Runtime Enforcement → Trading Orchestrator

- Gate validates deployment bind prerequisites.
- Fail closed. Orchestrator must not implement a second validation product that can disagree softly.

### 4.6 Risk Engine → Trading Orchestrator

- Policy / constraint **reads** may filter candidates.
- Risk Decisions remain exclusively Risk Engine after executable intents exist on the Session path.

### 4.7 Trading Orchestrator → Trading Session

- SessionHandoffIntent proposes bind / mission context.
- Session accepts/rejects; Session remains lifecycle SoT.
- Bot Facade (if used later) remains alias to Session — not a second SoT.

### 4.8 Orchestrator / State → Reporting / AI / Command Center

- Read-only projections.
- Consumers must not treat coordination artifacts as cash, fills, or risk approval.

---

## 5. Spec alignment

| Spec section                   | Diagram coverage                                              |
| ------------------------------ | ------------------------------------------------------------- |
| §5.4 Market State              | Primary chain node + lifecycle                                |
| §5.5 Trading Orchestrator      | Selector + Tactical + handoff                                 |
| §7 Decision Flow               | State → Selector → Tactical → Orchestrator → Risk → Execution |
| §5.2 Strategy Library          | Consumed; untouched                                           |
| §5.3 Qualification / Profile   | Consumed confidence; not replaced                             |
| §5.6 Trading Session / Runtime | Handoff target; Session SoT                                   |
| §5.7 Risk Engine               | Policy reads; Risk Decision later on path                     |
| §5.8 / §5.9 Orders / Execution | Untouched downstream                                          |
| §5.14 / §5.15 Reporting / AI   | Consumer fan-out                                              |
| §5.17 Live Market Data         | Market State input                                            |

---

## 6. STOP gate

Diagram is normative for planning. No implementation wiring is authorized until the RC-26 planning package is approved and Epic 1 starts.
