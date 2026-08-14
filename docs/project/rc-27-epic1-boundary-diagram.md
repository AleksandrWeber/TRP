# RC-27 Epic 1 — Exchange Scope Boundary Diagram

**Document:** Exchange Scope Boundary Diagram  
**Status:** Epic 1 implemented — awaiting review  
**Date:** 2026-08-14  
**Parent:** [Epic 1 Report](./rc-27-epic1-exchange-scope-boundary.md) · [Integration Diagram](./rc-27-integration-diagram.md)

---

## 1. Bounded context

```text
┌──────────────────────────────────────────────────────────────────┐
│           EXCHANGE SCOPE (exchange_scope_artifact)               │
│           moduleId: exchange-scope · UI: Cluster                 │
│                                                                  │
│  Owns (declared — not implemented in Epic 1):                    │
│    • exchange-scope-boundary                                     │
│    • exchange-scope-identity (RC-19 default Binance retained)    │
│    • exchange-scope / config / lifecycle / context               │
│    • exchange-risk-policy-inputs                                 │
│    • trading-account-binding                                     │
│    • adapter-binding-context                                     │
│                                                                  │
│  Epic 1 activePorts: ALL false                                   │
│  Mantra: Exchange Scope isolates — never Runtime / Session /     │
│          Execution / Library / Risk Engine                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Ownership map

```text
┌─────────────────────┐
│   EXCHANGE SCOPE    │  Isolate: identity / config / policy inputs
│   (RC-27 Epic 1)    │
└──────────┬──────────┘
           │ (later Epics — NOT wired in Epic 1)
           ├── capacity / allowlist inputs → Trading Session
           ├── policy inputs → Risk Engine
           ├── account bindings → Orders / Accounting (scoped refs)
           ├── adapter binding context → Execution Engine
           └── consumer reads → Reporting / AI / Lake / CC / Notify
           │
           ▼
┌─────────────────────────────────────────────┐
│ SHARED ENGINES (untouched in Epic 1)        │
│ Library · Gate · Qual · Profile · State     │
│ Orchestrator · Session · Risk · Orders      │
│ Execution · Accounting · Reporting · Lake   │
└─────────────────────────────────────────────┘
```

---

## 3. What Exchange Scope must not absorb

```text
✗ Strategy Library certification / Envelope ownership
✗ Runtime Enforcement Gate
✗ Market Qualification / Profile ownership
✗ Market State / Trading Orchestrator ownership
✗ Trading Session lifecycle / Bot commands
✗ Orders / Risk Decisions / Execution / Ledger
✗ Reporting / AI / Notification / Knowledge Lake ownership
✗ Clone Runtime / Risk / Orders / Execution / Accounting
✗ Become Runtime / Session / Execution Engine / Strategy Library
✗ Approve risk / submit orders / force trades
✗ Pick another exchange on ambiguous scope id
```

---

## 4. Port posture (Epic 1)

```text
EXCHANGE_SCOPE_SERVICE_PORT      → inactive (no Nest provider)
EXCHANGE_SCOPE_QUERY_PORT        → inactive (no Nest provider)
EXCHANGE_SCOPE_CONSUMER_READ_PORT→ inactive (no Nest provider)
persistence / rest / transport   → inactive
```

---

## 5. STOP

Epic 1 freezes the isolation boundary only. No behaviour until Epic 2+.
