# RC-25 Epic 1 — Market Qualification & Market Profile Boundary Diagram

**Document:** Market Qualification & Market Profile Boundary Diagram  
**Status:** Epic 1 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 1 Report](./rc-25-epic1-market-qualification-profile-boundary.md) · [Integration Diagram](./rc-25-integration-diagram.md)

---

## 1. Bounded contexts

```text
┌──────────────────────────────────────────────────────────────────┐
│              MARKET QUALIFICATION (research_artifact)            │
│              moduleId: market-qualification                      │
│                                                                  │
│  Owns (declared — not implemented in Epic 1):                    │
│    • qualification-boundary                                      │
│    • qualification-state                                         │
│    • market-confidence                                           │
│    • market-health                                               │
│    • qualification-lifecycle                                     │
│                                                                  │
│  Epic 1 activePorts: ALL false                                   │
│  Mantra: Qualification evaluates — never executes                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                 MARKET PROFILE (research_artifact)               │
│                 moduleId: market-profile                         │
│                                                                  │
│  Owns (declared — not implemented in Epic 1):                    │
│    • market-profile-boundary                                     │
│    • volatility-profile                                          │
│    • liquidity-profile                                           │
│    • trend-profile                                               │
│    • structural-profile                                          │
│    • profile-versioning                                          │
│                                                                  │
│  Epic 1: no profile calculation, ports inactive                  │
│  Mantra: Profiles describe — never force trades                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Ownership map

```text
┌─────────────────────┐
│  LIVE MARKET DATA   │  Ingress (consume later — Epic 2)
│  (+ Research*)      │  *approved reads later
└──────────┬──────────┘
           │ read-only (Epic 2+) — NOT wired in Epic 1
           ▼
┌─────────────────────┐
│ MARKET QUALIFICATION│  Evaluate: state / confidence / health
│   (RC-25 Epic 1)    │
└──────────┬──────────┘
           │ publish (Epic 5+) — NOT wired in Epic 1
           ▼
┌─────────────────────┐
│   MARKET PROFILE    │  Describe: versioned dimensions
│   (RC-25 Epic 1)    │
└──────────┬──────────┘
           │ query (Epic 6+) — NOT wired in Epic 1
           ▼
┌─────────────────────┐
│ FUTURE CONSUMERS    │
│ Orchestrator /      │
│ Reporting / AI      │
└─────────────────────┘

Strategy Library / Runtime Enforcement / Session / Ledger / Reporting
  remain SoT / Gate / Projection owners — untouched in Epic 1
```

---

## 3. What Market Qualification must not absorb

```text
✗ Strategy selection / tactic selection
✗ Trading Orchestrator / Market State engine
✗ Runtime Enforcement Gate
✗ Strategy Library certification
✗ Trading Session lifecycle / Bot commands
✗ Orders / Risk / Execution / Ledger
✗ Reporting / AI ownership
✗ Market Profile version ownership
✗ Force trades / auto-spend heavy jobs without confirm
✗ Become execution Source of Truth
```

---

## 4. What Market Profile must not absorb

```text
✗ Qualification decisions / lifecycle ownership
✗ Strategy selection / force exchange choice
✗ Runtime Enforcement / Strategy Library
✗ Trading Session / Orders / Risk / Execution
✗ Reporting / AI ownership
✗ Live Market State classification engine
✗ Expand Tactical Envelope
✗ Force trades / become execution SoT
```

---

## 5. Dependency direction (Epic 1)

```text
ALLOWED (Epic 1):
  AppModule → MarketQualificationModule
  AppModule → MarketProfileModule
  (no cross-module Qualification ↔ Profile wiring yet)

FORBIDDEN forever (and absent in Epic 1):
  market-qualification → runtime-enforcement | strategy-library |
                         trading-session | orders | execution | reporting
  market-profile       → runtime-enforcement | strategy-library |
                         trading-session | orders | execution | reporting |
                         market-qualification (behaviour coupling in Epic 1)
  live-market-data / enforcement / library / session → market-qualification
  reporting / enforcement / library / session → market-profile
```

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
