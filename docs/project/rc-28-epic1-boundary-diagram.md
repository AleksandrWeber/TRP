# RC-28 Epic 1 — Platform Integration Boundary Diagram

**Document:** Version 2 Platform Integration Boundary Diagram  
**Status:** **approved**  
**Date:** 2026-08-14  
**Parent:** [Epic 1 Report](./rc-28-epic1-platform-integration-boundaries.md) · [Integration Boundary Report](./rc-28-epic1-integration-boundary-report.md)

---

## 1. Bounded context (audit, not a module)

```text
┌──────────────────────────────────────────────────────────────────┐
│     V2 PLATFORM INTEGRATION AUDIT (RC-28 Epic 1)                 │
│     auditId: v2-platform-integration-audit                       │
│                                                                  │
│  isNestModule: false                                             │
│  isNewDomain / isNewSourceOfTruth / isNewApplicationPort: false  │
│  registeredInAppModule: false                                    │
│                                                                  │
│  Composes existing RC-20…RC-27 owners. Adds no behaviour.        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Ownership map

```text
Command Center          command_ui_projection     (RC-20)
Knowledge Lake          projection                (RC-21)
Strategy Library        source_of_truth           (RC-22)
Runtime Enforcement     gate                      (RC-23)
Reporting               projection                (RC-24)
AI Analytics            narrative                 (RC-24)
Notification Delivery   notification-projection   (RC-24)
Market Qualification    research_artifact         (RC-25)
Market Profile          research_artifact         (RC-25)
Market State            market_state_artifact     (RC-26)
Trading Orchestrator    orchestration_artifact    (RC-26)
Exchange Scope          exchange_scope_artifact   (RC-27)  isolation-only

External Freeze (unchanged):
  Trading Session · Risk Engine · Orders · Execution · Accounting
```

---

## 3. Allowed consume (normative)

```text
Strategy Library
        ▲
        │ read
Runtime Enforcement
        ▲
        │ read
Trading Orchestrator ──read──▶ Market State
        │                 └──read──▶ Qualification / Profile
        └──identity──▶ Exchange Scope

Knowledge Lake ──identity──▶ Exchange Scope
        ▲
        │ read
Reporting ──identity──▶ Exchange Scope
        ▲
        │ read
AI Analytics

Qualification ──read──▶ Knowledge Lake
        ▲
        │ read
Profile
        ▲
        │ read
Market State

Command Center ──read──▶ Scope / Reporting / Orchestrator / State / Notification
Command Center ──command──▶ Trading Session / Risk  (Freeze owners)
```

---

## 4. Forbidden reverse edges

```text
FORBIDDEN:
  Knowledge Lake ──▶ Reporting / Library / Gate
  Strategy Library ──▶ Gate / Orchestrator
  Runtime Enforcement ──▶ Orchestrator / Lake
  AI ──▶ Lake / Library / Gate / trade
  Notification ──▶ Reporting / Library / Gate / Session commands
  Exchange Scope ──▶ Library / Gate / Orchestrator / Reporting / Lake / State
  Qualification ──▶ Profile / State / Orchestrator
  Profile ──▶ State / Orchestrator
  Market State ──▶ Orchestrator
  Reporting ──▶ AI
  Orchestrator ──▶ Reporting / AI / Execution submit
  Command Center cache ──win──▶ Session / Ledger / Risk
```

---

## 5. STOP

Diagram remains normative. Epic 2 verifies hops on these edges; it must not add ports.
