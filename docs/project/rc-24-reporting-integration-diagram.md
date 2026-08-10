# RC-24 — Reporting Integration Diagram

**Document:** Reporting & AI Analytics Integration (RC-24)  
**Status:** APPROVED — Epic 1 boundary mapped (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Architecture mapping only. Epic 1 materializes Reporting + AI Analytics boundary skeletons.

**Parent:** [RC-24 Implementation Plan](./rc-24-implementation-plan.md)  
**API:** [API Contract](./rc-24-api-contract.md)  
**Domain:** [Reporting Domain Model](./rc-24-reporting-domain-model.md)  
**Epics:** [Epic Breakdown](./rc-24-epic-breakdown.md)  
**Lake predecessor:** [RC-21 Integration Diagram](./rc-21-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5, §6, §10  
**C4 context:** [V2 C4 Container Diagram](./v2-c4-container-diagram.md)

---

## 1. Integration principle

Knowledge Lake is the **analytical warehouse (Projection)**. Reporting is a **one-way consumer** that produces aggregations. AI Analytics is a **Narrative** layer over Reporting and Lake. Neither becomes Source of Truth.

```text
Knowledge Lake
        ↓  (query / read)
Reporting
        ↓  (aggregations / historical views)
AI Analytics
        ↓  (narratives)
Human
```

Also allowed (read-only, no ownership transfer):

```text
Strategy Library ──read──▶ Reporting / AI (context only)
Trading history  ──read──▶ Reporting
Paper history    ──read──▶ Reporting
```

**There must be no reverse dependency into SoT command ports.**

- Reporting must not write Library certification / eligibility.
- Reporting must not authorize Deployment or Session start.
- AI must not submit orders, approve risk, or mutate ledger.
- Lake must not be treated as financial SoT via reports.

**Lake never authorizes. Reporting never trades. AI never decides capital.**

---

## 2. Authority classes on this diagram

| Element                  | Class                | Role in RC-24                                     |
| ------------------------ | -------------------- | ------------------------------------------------- |
| Knowledge Lake           | **Projection**       | Primary analytical feed                           |
| Strategy Library         | **SoT**              | Optional read-only context                        |
| Trading / Paper history  | **SoT / Projection** | Read-only inputs (via Lake and/or history reads)  |
| Reporting                | **Projection**       | Aggregations, comparisons, historical runs        |
| AI Analytics             | **Narrative**        | Explainable narratives                            |
| Runtime Enforcement      | **Gate**             | **Untouched** — not a Reporting edge              |
| Trading Session          | **SoT** (lifecycle)  | Untouched — may appear as filtered dimension only |
| Ledger / Fills / Orders  | **SoT**              | Win on conflict; reports must not recompute       |
| Trading Orchestrator     | **Future**           | **Not built**                                     |
| Market State / Selection | **Future**           | **Not built**                                     |

---

## 3. Required topology (normative)

### 3.1 Primary chain (Spec §6)

```text
┌──────────────────────────┐
│     KNOWLEDGE LAKE       │  Projection warehouse
│  AnalyticalFact history  │
└────────────┬─────────────┘
             │ KnowledgeLakeQueryPort (read)
             ▼
┌──────────────────────────┐
│       REPORTING          │  Projection
│  Definitions / Runs      │
│  Aggregation slices      │
│  Historical windows      │
└────────────┬─────────────┘
             │ report outputs + lake refs
             ▼
┌──────────────────────────┐
│     AI ANALYTICS         │  Narrative
│  explain / summarize     │
│  trends / narratives     │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│         HUMAN            │
│  operator / researcher   │
└──────────────────────────┘
```

### 3.2 Supporting read-only feeds

```text
┌──────────────────┐
│ Strategy Library │──read (optional context)──▶ Reporting / AI
└──────────────────┘

┌──────────────────┐
│ Trading history  │──read────────────────────▶ Reporting
└──────────────────┘

┌──────────────────┐
│ Paper history    │──read────────────────────▶ Reporting
└──────────────────┘
```

### 3.3 Explicit non-edges (forbidden)

```text
FORBIDDEN:
  Reporting ──authorize──▶ Deployment / Session start
  Reporting ──certify──▶ Strategy Library
  Reporting ──recompute──▶ Ledger balances (shadow accounting)
  AI ──submit──▶ Orders / Execution
  AI ──approve──▶ Risk
  AI ──replace──▶ Runtime Enforcement
  AI ──replace──▶ Strategy Library
  Knowledge Lake ──override──▶ Orders / Ledger / Session
  Reporting / AI ──exist as──▶ Trading Orchestrator / Market State (RC-24)
```

### 3.4 Optional non-authoritative marker edge

```text
Reporting ──optional admit marker──▶ Knowledge Lake (category: Reporting)
```

Markers are projection only. They must not feedback into SoT commands.

---

## 4. Module interactions

### 4.1 Knowledge Lake → Reporting

| Direction        | Interaction                                              |
| ---------------- | -------------------------------------------------------- |
| Lake → Reporting | Read analytical facts via Query Port                     |
| Reporting → Lake | Optional report-run markers only; never SoT mutation API |

### 4.2 Reporting → AI Analytics

| Direction      | Interaction                                          |
| -------------- | ---------------------------------------------------- |
| Reporting → AI | Provide ReportRun / AggregationSlice refs as context |
| AI → Reporting | Read-only; AI does not rewrite aggregations as SoT   |

### 4.3 Strategy Library → Reporting / AI

| Direction              | Interaction                                  |
| ---------------------- | -------------------------------------------- |
| Library → Reporting/AI | Optional lookup for labels / version context |
| Reporting/AI → Library | **None** for writes                          |

### 4.4 Runtime Enforcement

| Direction | Interaction                                    |
| --------- | ---------------------------------------------- |
| RC-24     | **No product edge.** Enforcement remains Gate. |

If Lake contains enforcement-related projected facts, Reporting may summarize them as history — never as a substitute gate.

### 4.5 Ledger / Fills / Orders

| Direction       | Interaction                                                            |
| --------------- | ---------------------------------------------------------------------- |
| SoT → Reporting | Via Lake projections / approved reads — display only, labeled          |
| Reporting → SoT | **Forbidden** writes; **forbidden** ad-hoc authoritative recomputation |

---

## 5. Data-flow alignment (Spec §6)

```text
Research → Validation → Paper Trading → Execution
        → Knowledge Lake → Reporting → User
                         ↘ AI Analytics (narrative) ↗
```

RC-24 implements the **Reporting** and **AI Analytics** nodes after Lake. It does not reopen Research, Validation, Library certification, Enforcement, or Execution ownership.

---

## 6. C4 alignment

Per [V2 C4 Container Diagram](./v2-c4-container-diagram.md):

- Knowledge Lake sits beside the money path as projection.
- Reporting + AI sit beside Lake as human-facing aggregation/narrative.
- Money path (Orders → Risk → Execution → Ledger) remains untouched.

---

## 7. Residual / not on this diagram

| Item                          | Disposition                                    |
| ----------------------------- | ---------------------------------------------- |
| Trading Orchestrator          | Later RC                                       |
| Market State / Selection      | Later                                          |
| Market Qualification          | RC-25                                          |
| Multi Exchange                | Later                                          |
| Telegram notification product | Epic 6 delivery layer; UI/Bot network deferred |
| Reporting UI product panels   | After ports + UI Contract                      |
| REST transport                | After ports                                    |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
