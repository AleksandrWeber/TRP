# RC-24 Epic 1 — Reporting Boundary Diagram

**Document:** Reporting Boundary Diagram  
**Status:** Epic 1 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 1 Report](./rc-24-epic1-reporting-boundary.md) · [Integration Diagram](./rc-24-reporting-integration-diagram.md)

---

## 1. Bounded contexts

```text
┌──────────────────────────────────────────────────────────────────┐
│                      REPORTING (Projection)                      │
│                      moduleId: reporting                         │
│                                                                  │
│  Owns (declared — not implemented in Epic 1):                    │
│    • report-generation-boundary                                  │
│    • analytical-projection-boundary                              │
│                                                                  │
│  Epic 1 activePorts: ALL false                                   │
│  Mantra: explain what happened — never run the platform          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│               AI ANALYTICS (Narrative) — RESERVED                │
│               moduleId: ai-analytics                             │
│                                                                  │
│  Owns (declared reservation only):                               │
│    • analytical-narrative-boundary                               │
│                                                                  │
│  Epic 1: no AI runtime, no narratives, ports inactive            │
│  Distinct from existing AiModule (gateway)                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Ownership map

```text
┌─────────────────────┐
│   KNOWLEDGE LAKE    │  Projection warehouse (analytical source)
│   (RC-21 CLOSED)    │
└──────────┬──────────┘
           │ read-only (Epic 3+)
           ▼
┌─────────────────────┐
│     REPORTING       │  Projection: aggregations / runs (later Epics)
│   (RC-24 Epic 1)    │
└──────────┬──────────┘
           │ report refs (Epic 5)
           ▼
┌─────────────────────┐
│   AI ANALYTICS      │  Narrative reservation (Epic 5 behaviour)
│   (RC-24 Epic 1)    │
└──────────┬──────────┘
           │
           ▼
         Human

Strategy Library / Runtime Enforcement / Session / Ledger
  remain SoT / Gate owners — untouched in Epic 1
```

---

## 3. What Reporting must not absorb

```text
✗ Trading decisions / order submit / risk approve
✗ Strategy validation / certification / eligibility SoT
✗ Runtime Enforcement Gate
✗ Trading Session lifecycle
✗ Accounting / Ledger / Fill recalculation (shadow accounting)
✗ Knowledge Lake storage ownership
✗ Trading Orchestrator / Market State / Selection
✗ Become Source of Truth
✗ Reverse write: Reporting → Library certification
✗ Reverse dependency: Knowledge Lake → Reporting
```

---

## 4. What AI Analytics must not absorb (reservation)

```text
✗ Trading decisions / capital control
✗ Replace Runtime Enforcement
✗ Replace Strategy Library
✗ Become Source of Truth
✗ Silent config / Kill Switch changes
✗ Telegram control plane
✗ Absorb Reporting projection ownership
```

---

## 5. Dependency direction (Epic 1)

```text
ALLOWED (later):
  Knowledge Lake ──read──▶ Reporting
  Reporting ──context──▶ AI Analytics

FORBIDDEN forever:
  Knowledge Lake ──depends on──▶ Reporting
  Reporting ──authorize──▶ Deployment / Session
  Reporting / AI ──mutate──▶ Orders / Risk / Ledger / Library
```

Epic 1 code has **no** Lake → Reporting wiring yet (ports inactive). Direction tests assert Lake source never imports Reporting.
