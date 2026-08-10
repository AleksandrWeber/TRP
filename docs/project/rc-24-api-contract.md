# RC-24 API Contract — Reporting & AI Analytics

**Document:** RC-24 API Contract  
**Status:** APPROVED — Epics 4–6 ports active; RC-24 **CLOSED** (`v1.0.0-rc24`)
**Date:** 2026-08-10  
**Nature:** Application **ports only**. **No REST. No database schema. No transport product. No queue. No event bus.** Epic 4 activates Reporting ports; Epic 5 activates AI narratives over ReportRun only (optional `lakeQuery` not implemented — AI never queries Lake directly). Epic 6 activates Notification Delivery (Telegram projection only).

**Parent:** [RC-24 Implementation Plan](./rc-24-implementation-plan.md)  
**Domain:** [Reporting Domain Model](./rc-24-reporting-domain-model.md)  
**Epics:** [Epic Breakdown](./rc-24-epic-breakdown.md)  
**Integration:** [Reporting Integration Diagram](./rc-24-reporting-integration-diagram.md)  
**Lake ports (consume):** [RC-21 API Contract](./rc-21-api-contract.md) Query Port  
**Library ports (consume, optional):** [RC-22 API Contract](./rc-22-api-contract.md) Lookup (read)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.14, §5.15, §10  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md)  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) — API Contract stage

---

## 1. Purpose

Lock the **application ports** Reporting and AI Analytics expose, and the Lake / Library / history **read** ports they consume, so Epics implement one contract.

This document deliberately does **not** define:

- HTTP routes / OpenAPI
- Prisma / SQL / table layouts
- Kafka, Redis, queues, or bus topics
- UI widgets or Command Center report panels
- Trading Orchestrator / Market State / Selection APIs
- Runtime Enforcement changes
- Paper Trading redesign
- Telegram control-plane APIs

Transports and persistence are Epic implementation choices after approval — provided they preserve Projection / Narrative authority classes.

---

## 2. Ownership of the contract

| Concern                           | Owner                                             |
| --------------------------------- | ------------------------------------------------- |
| Reporting ports                   | Reporting module (RC-24)                          |
| AI Analytics ports                | AI Analytics module (RC-24)                       |
| Analytical warehouse              | Knowledge Lake (RC-21) — **read only** here       |
| Certified algorithm / eligibility | Strategy Library (RC-22) — **optional read** only |
| Trading / Paper history facts     | Existing SoT / Lake projections — **read only**   |
| Naming (product vs canonical)     | Alias Dictionary                                  |

**Canonical names:** `Reporting`, `AIAnalytics`, `reportRunId`, `reportDefinitionId`, `tradingSessionId` — never Bot aggregate as report SoT; never Lake as ledger.

---

## 3. Port overview (locked)

```text
KnowledgeLakeQueryPort          (consume, read)
StrategyLibraryLookupPort       (consume, optional read)
TradingHistoryReadPort          (consume, read — logical)
PaperTradingHistoryReadPort     (consume, read — logical)
        │
        ▼
ReportingServicePort ──▶ ReportRun + AggregationSlice[]
ReportingQueryPort   ──▶ read ReportRun / Aggregations / Definitions
        │
        ▼
AIAnalyticsPort ──▶ AnalyticalNarrative (cites report + lake refs)
        │
        ▼
Human consumers (UI / operators / researchers — later surfaces)
```

Locked capabilities:

| Capability                               | Port                                            |
| ---------------------------------------- | ----------------------------------------------- |
| Request / materialize report runs        | `ReportingServicePort`                          |
| Query report definitions / runs / slices | `ReportingQueryPort`                            |
| Explain / summarize / trends / narrative | `AIAnalyticsPort`                               |
| Lake analytical reads                    | `KnowledgeLakeQueryPort` (consume)              |
| Library context reads                    | `StrategyLibraryLookupPort` (consume, optional) |
| Trading history reads                    | `TradingHistoryReadPort` (consume)              |
| Paper history reads                      | `PaperTradingHistoryReadPort` (consume)         |

No Enforcement, Selection, Certification-write, Risk-approve, or Order-submit ports are in RC-24 scope.

---

## 4. ReportingServicePort

### 4.1 Interface (logical)

```text
ReportingServicePort
  requestReportRun(cmd: RequestReportRun) → ReportRunResult
  compareRuns(cmd: CompareReportRuns) → ComparisonSlice   // optional helper; same authority class
```

### 4.2 RequestReportRun

| Field                | Required | Meaning                                                       |
| -------------------- | -------- | ------------------------------------------------------------- |
| `workspaceId`        | Yes      | Tenancy                                                       |
| `reportDefinitionId` | Yes*     | Existing definition (*or inline `definition` for ad-hoc runs) |
| `definition`         | No*      | Inline Report Definition snapshot when ad-hoc                 |
| `window`             | Yes      | HistoricalWindow (`from` / `to` / preset)                     |
| `modes`              | Yes      | Non-empty set of `paper` \| `live` \| `research` \| `system`  |
| `exchangeScopeId`    | No       | Scope filter                                                  |
| `tradingSessionId`   | No       | Session filter (Bot alias must map to Session id)             |
| `libraryEntryId`     | No       | Optional Library context filter (not eligibility authority)   |
| `requestedBy`        | No       | Human / system actor id                                       |
| `requestedAt`        | No       | Caller timestamp; service stamps `createdAt`                  |

\* Identity rule: either `reportDefinitionId` **or** inline `definition` must be present. Ambiguous / empty ⇒ reject.

### 4.3 ReportRunResult

| Field              | Meaning                                   |
| ------------------ | ----------------------------------------- |
| `outcome`          | `completed` \| `empty` \| `rejected`      |
| `reportRun`        | ReportRun projection when completed/empty |
| `aggregations[]`   | AggregationSlice projections              |
| `rejectionReasons` | Machine-readable codes when `rejected`    |
| `authorityClass`   | Always `projection`                       |

### 4.4 Service rules

1. Service **may** aggregate, summarize, compare, and prepare visualization-oriented slices.
2. Service **must not** authorize capital, trade, validate strategies, or mutate business SoT.
3. Money-adjacent aggregations **must** include mode labels; unlabeled money claims ⇒ `rejected`.
4. Service **must not** recompute authoritative ledger balances with ad-hoc math; display Ledger/Fill-derived projections only.
5. Optional Lake admit of report-run markers (category `Reporting`) is non-authoritative and must not feedback into SoT commands.
6. `empty` is a valid success class when the window has no facts — not a soft authorization.

---

## 5. ReportingQueryPort

### 5.1 Interface (logical)

```text
ReportingQueryPort
  getDefinition(reportDefinitionId) → ReportDefinition | null
  listDefinitions(query: ReportDefinitionQuery) → ReportDefinitionPage
  getRun(reportRunId) → ReportRun | null
  listRuns(query: ReportRunQuery) → ReportRunPage
  listAggregations(reportRunId) → AggregationSlice[]
```

### 5.2 Query rules

1. **Read-only.** No disguised writes.
2. Every returned report artifact declares `authorityClass: projection` (narratives are not returned here).
3. Tenancy: `workspaceId` required on list queries.
4. Not ops SoT: Command Center lifecycle/kill continues to use Session/Risk ports — never ReportRun as authority.
5. Compatibility: additive optional fields allowed later; required field removal needs contract revision.

---

## 6. AIAnalyticsPort

### 6.1 Interface (logical)

```text
AIAnalyticsPort
  explain(cmd: ExplainAnalyticsRequest) → AnalyticalNarrative
  summarize(cmd: SummarizeAnalyticsRequest) → AnalyticalNarrative
  identifyTrends(cmd: TrendAnalyticsRequest) → AnalyticalNarrative
  generateNarrative(cmd: NarrativeRequest) → AnalyticalNarrative
```

### 6.2 Common request fields

| Field         | Required | Meaning                                    |
| ------------- | -------- | ------------------------------------------ |
| `workspaceId` | Yes      | Tenancy                                    |
| `reportRunId` | No*      | Prefer Reporting output as primary context |
| `lakeQuery`   | No*      | Optional Lake query bounds / event ids     |
| `focus`       | No       | Human prompt focus (non-authoritative)     |
| `requestedAt` | No       | Caller timestamp                           |

\* At least one of `reportRunId` or `lakeQuery` (or equivalent source refs) must be present. Narrative without sources ⇒ reject.

### 6.3 AnalyticalNarrative (port output)

| Field            | Meaning                                                   |
| ---------------- | --------------------------------------------------------- |
| `narrativeId`    | Stable id                                                 |
| `authorityClass` | Always `narrative`                                        |
| `text`           | Human-readable explanation / summary / trends             |
| `sourceRefs[]`   | ReportRun / Aggregation / Lake event / Library refs cited |
| `modesCovered[]` | Modes present in sources                                  |
| `modelMeta`      | Provider / template / model id metadata when available    |
| `disclaimer`     | Non-authoritative; SoT wins on conflict                   |
| `createdAt`      | Timestamp                                                 |

### 6.4 AI rules

1. AI **may** explain, summarize, identify trends, and generate narratives.
2. AI **must not** execute/approve trades, mutate Orders/Fills/Positions/Ledger, certify strategies, enforce deployment, or change Kill Switch / config.
3. AI **must not** replace Runtime Enforcement or Strategy Library.
4. If narrative conflicts with SoT — consumers must prefer SoT (disclaimer mandatory).
5. Access remains **gateway-mediated** under CANONICAL AI Gateway doctrine.
6. Provider unavailability ⇒ fail-soft (`unavailable` narrative outcome or equivalent) — core platform keeps working.
7. Out-of-envelope tactic recommendations must be labeled hypotheses for research — never runtime instructions.

---

## 7. Consumer ports (read)

### 7.1 KnowledgeLakeQueryPort (consume)

As defined in [RC-21 API Contract](./rc-21-api-contract.md) §5. Reporting/AI must not treat Lake facts as Ledger/Session SoT.

### 7.2 StrategyLibraryLookupPort (consume, optional)

Read-only context (name, version, certification status snapshot) for report filters and narrative grounding. **Forbidden:** using Library reads inside Reporting to authorize deployment or invent eligibility SoT.

### 7.3 TradingHistoryReadPort / PaperTradingHistoryReadPort (logical)

```text
TradingHistoryReadPort
  list(query: HistoryQuery) → HistoryPage

PaperTradingHistoryReadPort
  list(query: HistoryQuery) → HistoryPage
```

Logical ports may be satisfied by Lake category filters (`Trading` / `Paper`) and/or existing read surfaces. Epics must not redesign producers. History pages are projections (`authorityClass: projection`) with mandatory `mode` where applicable.

### 7.4 HistoryQuery (logical)

| Field              | Required | Meaning        |
| ------------------ | -------- | -------------- |
| `workspaceId`      | Yes      | Tenancy        |
| `from` / `to`      | Yes      | Window         |
| `tradingSessionId` | No       | Session filter |
| `exchangeScopeId`  | No       | Scope filter   |
| `limit` / `cursor` | No       | Pagination     |

---

## 8. Explicit non-ports (RC-24)

| Non-port                      | Why forbidden / deferred            |
| ----------------------------- | ----------------------------------- |
| `authorizeDeployment`         | Runtime Enforcement (RC-23)         |
| `selectStrategy`              | Orchestrator / Selection (later)    |
| `classifyMarketState`         | Market State (later)                |
| `certifyStrategy`             | Library write                       |
| `approveRisk` / `submitOrder` | Risk / Orders SoT                   |
| `recomputeLedgerBalance`      | Shadow accounting forbidden         |
| `mutateLiveParameters`        | Forbidden live mutation             |
| `telegramTradeCommand`        | Control plane forbidden in V2       |
| REST `/reports/...` as SoT    | Ports first; REST later if approved |

---

## 9. Compatibility

| Rule                     | Detail                                                              |
| ------------------------ | ------------------------------------------------------------------- |
| Additive optional fields | Allowed later with contract amendment note                          |
| Required field removal   | Requires contract revision                                          |
| Alias Dictionary         | Report / AI Analytics = projections + narrative; `tradingSessionId` |
| RC-21 Query Port         | Semantics preserved; RC-24 is consumer                              |
| RC-22 Lookup             | Optional read; no Library redesign                                  |
| RC-23 Enforcement        | Untouched; no Reporting substitute gate                             |
| REST / DB / transport    | Out of this document                                                |

---

## 10. Compatibility with Authority Matrix

| Concern                     | Contract implication                                                |
| --------------------------- | ------------------------------------------------------------------- |
| Knowledge Lake contents     | Projection warehouse; Reporting/AI consume only                     |
| Reporting & AI Analytics    | Projection + Narrative — never money/lifecycle SoT                  |
| Cash / fees / realized PnL  | Ledger remains SoT; reports display labeled projections only        |
| Fill facts                  | No recalculating fills in reports                                   |
| Strategy algorithm          | Library remains SoT; reports may cite, never certify                |
| AI Analyst / Assistant text | Narrative only                                                      |
| Telegram                    | Notification delivery (Epic 6) — projection only; not control plane |

---

## 11. Acceptance for this contract

Reviewers agree:

1. Reporting service + query ports plus AI analytics ports are sufficient for Epics 3–5.
2. No REST/schema/transport inventiveness required to approve.
3. Projection / Narrative authority classes are mandatory on outputs.
4. AI never owns business decisions; Reporting never becomes SoT.
5. Ownership and Alias Dictionary rules are enforceable in review.

**STOP:** Contract only. Implementation waits for plan + API + Domain Model approval.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
