# RC-28 — Version 2 Stabilization Integration Diagram

**Document:** Version 2 Platform Integration (RC-28)  
**Status:** APPROVED (planning) — Epic 1–3 **approved**; Epic 4 scenario validation awaiting review  
**Date:** 2026-08-14  
**Nature:** Architecture mapping of the **already shipped** V2 platform. No new modules. No implementation wiring.

**Parent:** [RC-28 Implementation Plan](./rc-28-implementation-plan.md)  
**API:** [API Contract (conformance)](./rc-28-api-contract.md)  
**Epics:** [Epic Breakdown](./rc-28-epic-breakdown.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §§5–7, §11  
**C4 context:** [V2 C4 Container Diagram](./v2-c4-container-diagram.md)  
**Isolation:** [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)

---

## 1. Integration principle

Version 2 is a **modular monolith** of certified owners. RC-28 draws the complete interaction map. It does not add a node.

```text
WORKSPACE
  └── Exchange Scope[]          isolation context (RC-27)
        │
        ▼  (shared singleton engines — never cloned)
┌──────────────────────────────────────────────────────────────┐
│ Research Lab                                                 │
│ Strategy Library          (RC-22)                            │
│ Runtime Enforcement       (RC-23)                            │
│ Market Qualification      (RC-25)                            │
│ Market Profile            (RC-25)                            │
│ Market State              (RC-26)                            │
│ Trading Orchestrator      (RC-26)                            │
│ Trading Session / Runtime                                    │
│ Risk Engine · Orders · Execution · Accounting                │
│ Knowledge Lake            (RC-21)                            │
│ Reporting · AI Analytics · Notification Delivery (RC-24)     │
│ Command Center            (RC-20)                            │
└──────────────────────────────────────────────────────────────┘
```

**There must be no reverse dependency that steals SoT.**

**Modules remain authoritative. RC-28 certifies the edges. It does not own them.**

---

## 2. Authority classes on this diagram

| Element               | Class                         | Role in RC-28                       |
| --------------------- | ----------------------------- | ----------------------------------- |
| Strategy Library      | **SoT** (certification)       | Verify consume                      |
| Runtime Enforcement   | **Gate**                      | Verify fail-closed                  |
| Market Qualification  | **Research artifact SoT**     | Verify consume                      |
| Market Profile        | **Research SoT** (versions)   | Verify consume                      |
| Market State          | **Current-condition SoT**     | Verify consume                      |
| Trading Orchestrator  | **Coordination SoT**          | Verify handoff intent only          |
| Trading Session       | **SoT** (lifecycle)           | Verify Bot Facade alias             |
| Risk Engine           | **SoT** (Risk Decisions)      | Untouched; policy inputs from Scope |
| Orders / Execution    | **SoT**                       | Frozen canonical path               |
| Accounting            | **SoT**                       | Scoped records; no shadow books     |
| Knowledge Lake        | **Projection**                | Verify ingest + query               |
| Reporting             | **Projection**                | Verify no shadow accounting         |
| AI Analytics          | **Narrative**                 | Verify explain-only                 |
| Notification Delivery | **Delivery** (authority none) | Verify not control plane            |
| Command Center        | **Command UI + projection**   | Verify command routing              |
| Exchange Scope        | **Isolation SoT**             | Verify isolation; not business SoT  |
| Exchange Risk Policy  | **Policy input**              | Consumed by Risk Engine             |

---

## 3. Required topology (normative)

### 3.1 Complete certified path (primary)

```text
Research
  ↓
Strategy Library
  ↓
Runtime Enforcement          ← fail-closed Gate
  ↓
Trading Orchestrator         ← coordination + Session handoff intent
  ↓
Trading Session              ← lifecycle SoT (UI: Bot)
  ↓
Orders
  ↓
Execution
  ↓
Accounting
  ↓
Knowledge Lake               ← projection warehouse
  ↓
Reporting                    ← projection
  ↓
AI Analytics                 ← narrative
  ↓
Notification Delivery        ← delivery only
  ↓
Command Center               ← ops projection + command entry
```

Exchange Scope **keys** the trading and research hops (`exchangeScopeId`). It is not a sequential owner of money, fills, or certification.

### 3.2 Decision flow (Spec §7 — unchanged)

```text
Market State
  ↓
Trading Orchestrator (selector + tactical envelope)
  ↓
Runtime Enforcement (where Deployment/Session bind requires Gate)
  ↓
Risk Engine          ← Exchange Risk Policy (inputs)
  ↓
Orders → Execution → Exchange Adapter (paper)
```

Orchestrator does not submit orders. Gate does not approve risk. Scope does not decide.

### 3.3 Isolation (RC-27 preserved)

```text
┌─────────────────────────────────────────────┐
│                 WORKSPACE                   │
└───────┬─────────────┬─────────────┬─────────┘
        ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ SCOPE A │   │ SCOPE B │   │ SCOPE N │
   └───┬─────┘   └───┬─────┘   └───┬─────┘
       └─────────────┼─────────────┘
                     ▼
        SHARED ENGINES (1 each) — see §1
```

### 3.4 Consumer fan-out (read only)

```text
Library / Gate / Qual / Profile / State / Orchestrator / Session / Scope / Lake
        │ consumer read ports (existing)
        ▼
┌─────────────────────────────────────┐
│ Reporting (RC-24)                   │
│ AI Analytics (RC-24)                │
│ Notification Delivery (RC-24)       │
│ Knowledge Lake (RC-21)              │
│ Command Center (RC-20)              │
└─────────────────────────────────────┘
```

Consumers may depend on owners. Reverse command dependencies into those owners (except Command Center → Session / Risk **command ports**) are forbidden.

### 3.5 Explicit non-edges (forbidden)

```text
FORBIDDEN:
  RC-28 ──add──▶ new module / port / SoT / business rule
  Knowledge Lake ──override──▶ Ledger / Fills / Orders
  Reporting ──recompute──▶ authoritative cash
  AI ──decide──▶ trade / tactic outside envelope
  Notification ──command──▶ pause / stop / kill / order
  Command Center cache ──win──▶ Session / Risk / Ledger
  Orchestrator ──submit──▶ Orders / Execution / Adapter APIs
  Runtime Enforcement ──soft-pass──▶ invalid deployment
  Exchange Scope ──clone──▶ Runtime / Risk / Orders / Execution / Ledger
  Exchange Scope ──approve──▶ Risk Decision
  Confidence / Profile ──force──▶ trade
  Cross-scope account reference without reject
  Missing exchangeScopeId ──pick──▶ another venue
```

---

## 4. Interaction notes

### 4.1 Research → Strategy Library

- Evidence may support certification; Library remains certification SoT.
- RC-28 does not recertify by a new engine.

### 4.2 Strategy Library → Runtime Enforcement

- Gate consumes Lookup / Eligibility / Envelope.
- Fail closed. Session must not call Library as a substitute Gate.

### 4.3 Runtime Enforcement → Orchestrator / Session

- Orchestrator consumes Gate before bind intents that require it.
- Session start protection remains stamp-only (RC-23); no Gate re-run ownership steal.

### 4.4 Orchestrator → Trading Session → Orders → Execution → Accounting

- Handoff is **intent**. Session accepts/rejects lifecycle.
- Canonical paper path unchanged (ADR-012…018).
- Accounting remains Fill → Position → Ledger SoT.

### 4.5 Accounting / Session / research events → Knowledge Lake

- Append-only projection.
- Lake never authorizes capital.

### 4.6 Knowledge Lake → Reporting → AI → Notification

- Reporting aggregates projections.
- AI cites ReportRun / Lake refs; never trades.
- Notification delivers completed projections; never a control plane.

### 4.7 Command Center

- Reads projections from Session, Risk, Scope, Orchestrator, Reporting as available.
- Writes only via Session / Bot Facade / durable Kill Switch ports.

### 4.8 Exchange Scope across the path

- Identity, config, policy inputs, account bindings, adapter binding context.
- Shared engines key by `exchangeScopeId`.
- Isolation invariants 1–10 remain binding.

---

## 5. Spec alignment

| Spec section                                | Diagram coverage                              |
| ------------------------------------------- | --------------------------------------------- |
| §5.2 Strategy Library                       | Certification node                            |
| §5.3 Qualification / Profile                | Research nodes                                |
| §5.4 / §5.5 State / Orchestrator            | Decision-flow nodes                           |
| §5.6 Trading Session / Runtime              | Lifecycle node                                |
| §5.7 Risk Engine                            | Policy inputs + decisions                     |
| §5.8 / §5.9 Orders / Execution              | Canonical money path                          |
| §5.10 Exchange Scope                        | Isolation wrapper                             |
| §5.11 / §5.12 Accounts / Accounting         | Wallet alias + ledger SoT                     |
| §5.13 / §5.14 / §5.15 Lake / Reporting / AI | Projection / narrative fan-out                |
| §5.16 Command Center                        | Ops surface                                   |
| §6 Data Flow                                | §3.1 complete path                            |
| §7 Decision Flow                            | §3.2                                          |
| §11 Future Evolution                        | No new engines; live capital still future ADR |

---

## 6. STOP gate

**STOP.** Diagram remains normative. Epic 4 complete for review — wait before Epic 5.
