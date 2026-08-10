# RC-21 Integration Diagram — Knowledge Lake

**Document:** Knowledge Lake Integration (RC-21)  
**Status:** CLOSED — validation PASS · tag `v1.0.0-rc21`  
**Date:** 2026-08-10  
**Nature:** Architecture mapping + implementation status. No schema. No queues.

**Parent:** [RC-21 Implementation Plan](./rc-21-implementation-plan.md)  
**Epics:** [RC-21 Epic Breakdown](./rc-21-epic-breakdown.md)  
**API Contract:** [RC-21 API Contract](./rc-21-api-contract.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.13, §6  
**C4 context:** [V2 C4 Container Diagram](./v2-c4-container-diagram.md)

---

## 1. Integration principle

Knowledge Lake **receives** analytical projections from producers.

It does **not** command producers.

```text
Producers ──append──▶ Knowledge Lake ──read──▶ Reporting / AI / ML
                ▲
                │
         NO feedback arrows
         into SoT command ports
```

**Append-only. No feedback loops.**

---

## 2. Data ownership

```text
┌─────────────────────────────────────────────────────────────────┐
│                     SOURCE OF TRUTH                             │
│  Research records · Trading Session · Orders · Risk ·           │
│  Execution/Fills · Position · Ledger · (policies as inputs)     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ emit / record immutable business facts
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PROJECTION                                  │
│  Event envelopes · outbox notifications · read models           │
│  (derived; rebuildable; non-authoritative)                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ project analytical copies (admit)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     KNOWLEDGE LAKE                              │
│  Append-only analytical warehouse                               │
│  Stores immutable facts only                                    │
│  NEVER owns business state                                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ query (read-only)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│            REPORTING · AI ANALYST · AI RESEARCH · ML            │
│            (narrative / aggregation / future features)          │
└─────────────────────────────────────────────────────────────────┘
```

### Ownership statements (normative)

1. **Source of Truth** owns business state and may mutate it only through owning module ports.
2. **Projection** derives envelopes/read models from SoT; may not become a second SoT.
3. **Knowledge Lake** stores immutable analytical facts projected from (1)/(2).  
   **Knowledge Lake never owns business state.**  
   **It only stores immutable facts.**
4. On conflict about money, fills, orders, or session lifecycle — **SoT wins**; Lake loses.

---

## 3. Producer integrations (RC-21)

Each row is **one-way**: producer → Lake via `KnowledgeLakeIngestionPort`.

### Implementation status (Epics)

| Producer                               | Epic  | Status                                                    |
| -------------------------------------- | ----- | --------------------------------------------------------- |
| Trading Session                        | 3     | **Implemented** — outbox → Lake (`trading-session`)       |
| Orders                                 | 3     | **Implemented** — outbox → Lake (`orders`)                |
| Risk (frozen `risk` / RiskDecision)    | 3     | **Implemented** — outbox → Lake (`risk-engine`)           |
| Paper Trading (frozen `paper-account`) | 3     | **Implemented** — outbox → Lake (`paper-trading`)         |
| Execution / Fill                       | 3     | **Implemented** — outbox → Lake (`execution-engine`)      |
| Research Lab                           | 4     | **Implemented** — outcome markers → Lake (`research-lab`) |
| Reporting                              | later | Reserved category only                                    |

Code registries:

- Trading path: `apps/api/src/modules/knowledge-lake/projections/trading-path-producer-registry.ts`
- Research Lab: `apps/api/src/modules/knowledge-lake/projections/research-lab-producer-registry.ts`

Query port (Epic 5): `KnowledgeLakeQueryPort` — read-only analytical access for future Reporting / AI / ML consumers. No UI in RC-21.

Epic notes:

- [`rc-21-epic3-trading-path-projections.md`](./rc-21-epic3-trading-path-projections.md)
- [`rc-21-epic4-research-lab-projections.md`](./rc-21-epic4-research-lab-projections.md)
- [`rc-21-epic5-query-port.md`](./rc-21-epic5-query-port.md)

### 3.1 Research Lab

| Direction  | Interaction                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lab → Lake | Project research completion / validation / evidence **markers** (category: Research; failed campaigns → System). Prefer `sourceRef` to campaign/experiment/knowledge ids. |
| Lake → Lab | **None** (no feedback).                                                                                                                                                   |

**Implementation (Epic 4):** `KnowledgeLakeResearchLabProjectionService` + thin adapters. Outcome kinds: `campaign_completed`, `experiment_completed`, `validation_completed`, `evidence_generated`. Research modules untouched (no outbox required).

**Rule:** Research Lab never places production orders (Spec §5.1). Lake must not create a capital path.

**Not Lake:** Insight / Recommendation / KnowledgeEntry product redesign or rebrand.

### 3.2 Paper Trading

| Direction    | Interaction                                                                   |
| ------------ | ----------------------------------------------------------------------------- |
| Paper → Lake | Project paper-mode session/account/path markers (categories: Paper, Trading). |
| Lake → Paper | **None.**                                                                     |

Paper remains the same frozen path as future live (different adapter/mode). Lake labels `mode=paper`.

### 3.3 Trading Session

| Direction      | Interaction                                                                |
| -------------- | -------------------------------------------------------------------------- |
| Session → Lake | Project lifecycle / runtime analytical facts (category: Trading / System). |
| Lake → Session | **None.** Session lifecycle SoT remains ADR-014.                           |

Bot Facade remains UI alias; Lake references `tradingSessionId` only.

### 3.4 Orders

| Direction     | Interaction                                                   |
| ------------- | ------------------------------------------------------------- |
| Orders → Lake | Project order lifecycle analytical facts (category: Trading). |
| Lake → Orders | **None.** Lake must not rewrite or invent order state.        |

### 3.5 Execution

| Direction        | Interaction                                                      |
| ---------------- | ---------------------------------------------------------------- |
| Execution → Lake | Project submit/cancel/fill analytical facts (category: Trading). |
| Lake → Execution | **None.** ADR-012 sole adapter entry unchanged.                  |

Fill facts remain owned by Execution → Fill records; Lake stores analytical copies/refs.

### 3.6 Risk

| Direction   | Interaction                                                           |
| ----------- | --------------------------------------------------------------------- |
| Risk → Lake | Project risk decision / safety analytical facts (category: Risk).     |
| Lake → Risk | **None.** Lake must not approve risk or act as Kill Switch authority. |

### 3.7 Reporting

| Direction        | Interaction                                                      |
| ---------------- | ---------------------------------------------------------------- |
| Reporting → Lake | Optional later: report-run markers (category: Reporting).        |
| Lake → Reporting | **Read** via Query port (Reporting product is **out of RC-21**). |

RC-21 reserves the Reporting category and ensures the query port is ready. It does not ship Reporting jobs.

---

## 4. Integration diagram (append-only)

### 4.1 Full producer → Lake → consumer map

```text
                    ┌──────────────────────┐
                    │    RESEARCH LAB      │
                    └──────────┬───────────┘
                               │ Research facts
                               ▼
┌──────────────┐    ┌──────────────────────┐    ┌──────────────┐
│ Paper Trading│───▶│                      │◀───│   Reporting  │
└──────────────┘    │                      │    │ (later RC)   │
                    │   KNOWLEDGE LAKE     │    └──────┬───────┘
┌──────────────┐    │   (append-only       │           │ read
│Trading Session───▶│    projection        │───────────┤
└──────────────┘    │    warehouse)        │           │
                    │                      │           ▼
┌──────────────┐    │                      │    ┌──────────────┐
│    Orders    │───▶│                      │───▶│ AI Analyst / │
└──────────────┘    │                      │    │ AI Research  │
                    │                      │    │ / future ML  │
┌──────────────┐    │                      │    └──────────────┘
│  Execution   │───▶│                      │
└──────────────┘    └──────────▲───────────┘
                               │
┌──────────────┐               │
│ Risk Engine  │───────────────┘
└──────────────┘
         │
         │  All solid arrows into Lake are APPEND ONLY
         │  No arrows from Lake back into SoT command ports
```

### 4.2 Forbidden feedback (must remain absent)

```text
Knowledge Lake  ✕→  Orders command ports
Knowledge Lake  ✕→  Risk approve / kill authority
Knowledge Lake  ✕→  Execution submit/cancel
Knowledge Lake  ✕→  Trading Session lifecycle commands
Knowledge Lake  ✕→  Ledger / Position mutations
Knowledge Lake  ✕→  Research Lab rewriting history as SoT
```

### 4.3 Relation to Spec §6 data flow

```text
Research
  ↓
Validation
  ↓
Paper Trading
  ↓
Execution
  ↓
Knowledge Lake
  ↓
Reporting
  ↓
User
```

RC-21 implements the **Knowledge Lake** node and its inbound projections. Reporting → User remains a later RC.

Production outcomes may inspire new research hypotheses **outside** Lake command paths (human / Lab processes). That learning loop must not become Lake → Execution automation.

---

## 5. Event classification map (producer → category)

| Producer        | Primary categories | Notes                                |
| --------------- | ------------------ | ------------------------------------ |
| Research Lab    | Research           | Evidence markers; refs over clones   |
| Paper Trading   | Paper, Trading     | Always distinguishable as paper      |
| Trading Session | Trading, System    | Lifecycle/runtime analytical         |
| Orders          | Trading            | Non-authoritative copies             |
| Execution       | Trading            | Includes fill analytical refs        |
| Risk Engine     | Risk               | Decisions/safety facts               |
| Reporting       | Reporting          | Reserved; product later              |
| Market Data     | Market             | Optional thin if already available   |
| Recovery / ops  | System             | Projection health / recovery markers |

Taxonomy detail: [Implementation Plan §6](./rc-21-implementation-plan.md#6-event-classification).

---

## 6. Explicit non-integrations (this RC)

| Module / concern                 | RC-21 stance                                         |
| -------------------------------- | ---------------------------------------------------- |
| Command Center Lake explorer     | Out of scope                                         |
| Strategy Library warehouse       | RC-22 (separate); Lake may later observe cert events |
| Trading Orchestrator             | Deferred (baseline RC-26)                            |
| IDE shell / Bot fleet UX         | Deferred (former RC-21 theme; see plan §0)           |
| AI gateway product panels        | Deferred (Reporting & AI RC)                         |
| Kafka / Redis / queue products   | Forbidden                                            |
| SoT event-sourcing redesign      | Forbidden                                            |
| Knowledge domain rebrand to Lake | Forbidden                                            |

---

## 7. Acceptance for this diagram

Reviewers accept when:

1. Every listed producer arrow is append-only into Lake.
2. No feedback loop into SoT command ports exists on the diagram.
3. Data ownership chain SoT → Projection → Lake is explicit.
4. Lake never owns business state — only immutable facts.
5. Diagram matches Spec §5.13 / §6 and C4 “Lake beside money path.”

**STOP:** Mapping only. No implementation in this task.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
