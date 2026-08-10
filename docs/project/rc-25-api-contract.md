# RC-25 API Contract — Market Qualification & Market Profile

**Document:** RC-25 API Contract  
**Status:** APPROVED — Epic 2 LMD + Research consumers active; evaluation ports inactive  
**Date:** 2026-08-10  
**Nature:** Application **ports only**. **No REST. No database schema. No transport product. No queue. No event bus.** Epic 2 activates Live Market Data + Research read consumers.

**Parent:** [RC-25 Implementation Plan](./rc-25-implementation-plan.md)  
**Domain:** [Domain Model Contract](./rc-25-domain-model-contract.md)  
**Epics:** [Epic Breakdown](./rc-25-epic-breakdown.md)  
**Integration:** [Integration Diagram](./rc-25-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.3, §5.17  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md)  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) — API Contract stage

---

## 1. Purpose

Lock the **application ports** Market Qualification and Market Profile expose, and the Live Market Data / Research **read** ports they consume, so Epics implement one contract.

This document deliberately does **not** define:

- HTTP routes / OpenAPI
- Prisma / SQL / table layouts
- Kafka, Redis, queues, or bus topics
- UI widgets or Command Center qualification panels
- Trading Orchestrator / Market State / Selection APIs
- Runtime Enforcement changes
- Reporting / AI redesign
- Multi-Exchange adapter APIs
- Session lifecycle commands

Transports and persistence are Epic implementation choices after approval — provided they preserve research-artifact authority classes and never become execution SoT.

---

## 2. Ownership of the contract

| Concern                              | Owner                                                 |
| ------------------------------------ | ----------------------------------------------------- |
| Market Qualification ports           | Market Qualification module (RC-25)                   |
| Market Profile ports                 | Market Profile module (RC-25)                         |
| Live market observations             | Live Market Data (§5.17) — **read only** here         |
| Research artifact bodies             | Research / Campaign / Experiment — **read only** here |
| Strategy certification / eligibility | Strategy Library — **not in scope**                   |
| Runtime Enforcement Gate             | Runtime Enforcement — **not in scope**                |
| Strategy / tactic selection          | Trading Orchestrator (future) — **consumer later**    |
| Naming (product vs canonical)        | Alias Dictionary                                      |

**Canonical names:** `MarketQualification`, `MarketProfile`, `qualificationRunId`, `marketProfileId`, `exchangeScopeId`, `marketSymbol` — never Bot aggregate; never Profile-as-Risk.

---

## 3. Port overview (locked)

```text
LiveMarketDataReadPort        (consume, read)
ResearchOutputReadPort        (consume, read — where approved)
        │
        ▼
MarketQualificationServicePort ──▶ QualificationRun + state/confidence/health
MarketQualificationQueryPort   ──▶ read runs / state / confidence / health
        │
        ▼
MarketProfileServicePort ──▶ publish MarketProfile version
MarketProfileQueryPort   ──▶ read latest / by version
        │
        ▼
Future consumers (Orchestrator / Reporting / AI — read only)
```

Locked capabilities:

| Capability                                      | Port                                               |
| ----------------------------------------------- | -------------------------------------------------- |
| Request / confirm qualification runs            | `MarketQualificationServicePort`                   |
| Query qualification state / confidence / health | `MarketQualificationQueryPort`                     |
| Publish profile versions from qualification     | `MarketProfileServicePort`                         |
| Query profile latest / by version               | `MarketProfileQueryPort`                           |
| Live market observation reads                   | `LiveMarketDataReadPort` (consume)                 |
| Approved research output reads                  | `ResearchOutputReadPort` (consume)                 |
| Downstream confidence/profile reads             | Same query ports (Orchestrator/Reporting/AI later) |

No Selection, Enforcement, Certification-write, Risk-approve, Order-submit, or Session-lifecycle ports are in RC-25 scope.

---

## 4. MarketQualificationServicePort

### 4.1 Interface (logical)

```text
MarketQualificationServicePort
  requestQualificationRun(cmd: RequestQualificationRun) → QualificationRunResult
  confirmQualificationRun(cmd: ConfirmQualificationRun) → QualificationRunResult
  cancelQualificationRun(cmd: CancelQualificationRun) → QualificationRunResult
  completeQualificationRun(cmd: CompleteQualificationRun) → QualificationRunResult  // internal/pipeline
  failQualificationRun(cmd: FailQualificationRun) → QualificationRunResult
```

### 4.2 RequestQualificationRun

| Field             | Required | Meaning                                                         |
| ----------------- | -------- | --------------------------------------------------------------- |
| `workspaceId`     | Yes      | Tenancy                                                         |
| `exchangeScopeId` | Yes      | Venue key (Cluster / Exchange Scope)                            |
| `marketSymbol`    | Yes      | Market identity within venue                                    |
| `modeContext`     | Yes      | Intended trust context: `lab` \| `paper` \| `live` (label only) |
| `requestedBy`     | Yes      | Human / operator actor id                                       |
| `requestedAt`     | No       | Caller timestamp; service stamps `createdAt`                    |
| `notes`           | No       | Operator rationale                                              |

**Rules:**

1. Creating a request does **not** start heavy computation until confirm (or until an explicit lightweight path is marked non-heavy).
2. Heavy jobs **must** require `confirmQualificationRun` (Alias: no auto-spend without user confirm).
3. Request never starts a Trading Session or submits orders.

### 4.3 ConfirmQualificationRun

| Field                | Required | Meaning                        |
| -------------------- | -------- | ------------------------------ |
| `workspaceId`        | Yes      | Tenancy                        |
| `qualificationRunId` | Yes      | Existing requested run         |
| `confirmedBy`        | Yes      | Operator confirming spend/work |
| `confirmedAt`        | No       | Caller timestamp               |

### 4.4 QualificationRunResult

| Field                | Meaning                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| `outcome`            | `accepted` \| `running` \| `completed` \| `failed` \| `rejected` \| `cancelled` |
| `qualificationRunId` | Run identity                                                                    |
| `qualificationState` | Snapshot after transition                                                       |
| `marketConfidence`   | Present when completed (or last known)                                          |
| `marketHealth`       | Present when completed (or last known)                                          |
| `publishedProfileId` | Present when a profile version was published                                    |
| `rejectionReasons[]` | Present when `rejected` / `failed`                                              |

---

## 5. MarketQualificationQueryPort

### 5.1 Interface (logical)

```text
MarketQualificationQueryPort
  getQualificationTarget(query: GetQualificationTarget) → QualificationTargetView | null
  getQualificationState(query: GetQualificationState) → QualificationStateView | null
  getMarketConfidence(query: GetMarketConfidence) → MarketConfidenceView | null
  getMarketHealth(query: GetMarketHealth) → MarketHealthView | null
  listQualificationRuns(query: ListQualificationRuns) → QualificationRunSummary[]
  getQualificationRun(query: GetQualificationRun) → QualificationRunView | null
```

### 5.2 Common query keys

| Field                | Required | Meaning                     |
| -------------------- | -------- | --------------------------- |
| `workspaceId`        | Yes      | Tenancy                     |
| `exchangeScopeId`    | Yes*     | Venue (*for target-scoped)  |
| `marketSymbol`       | Yes*     | Market (*for target-scoped) |
| `qualificationRunId` | No*      | Run-scoped queries          |

### 5.3 View authority

All query views carry:

| Field               | Value                                     |
| ------------------- | ----------------------------------------- |
| `authorityClass`    | `research_artifact` (never execution SoT) |
| `forcesTrade`       | Always `false`                            |
| `authorizesSession` | Always `false`                            |

---

## 6. MarketProfileServicePort

### 6.1 Interface (logical)

```text
MarketProfileServicePort
  publishProfileVersion(cmd: PublishMarketProfile) → PublishProfileResult
```

### 6.2 PublishMarketProfile

| Field                | Required | Meaning                                        |
| -------------------- | -------- | ---------------------------------------------- |
| `workspaceId`        | Yes      | Tenancy                                        |
| `exchangeScopeId`    | Yes      | Venue key                                      |
| `marketSymbol`       | Yes      | Market identity                                |
| `qualificationRunId` | Yes      | Provenance — which completed run produced this |
| `volatility`         | Yes      | VolatilityProfile payload                      |
| `liquidity`          | Yes      | LiquidityProfile payload                       |
| `trend`              | Yes      | TrendProfile payload                           |
| `structure`          | Yes      | StructuralCharacteristics payload              |
| `confidenceSummary`  | Yes      | Snapshot of confidence used/derived            |
| `publishedBy`        | Yes      | Actor / pipeline identity                      |

**Rules:**

1. Publish only from a **completed** qualification run (or explicit pipeline completion path).
2. Prior versions remain immutable.
3. Publish does **not** expand Tactical Envelope, certify strategies, or start sessions.
4. Publish does **not** authorize trading.

### 6.3 PublishProfileResult

| Field                | Meaning                           |
| -------------------- | --------------------------------- |
| `outcome`            | `published` \| `rejected`         |
| `marketProfileId`    | New version identity              |
| `version`            | Monotonic version number / string |
| `rejectionReasons[]` | Present when rejected             |

---

## 7. MarketProfileQueryPort

### 7.1 Interface (logical)

```text
MarketProfileQueryPort
  getLatestProfile(query: GetLatestMarketProfile) → MarketProfileView | null
  getProfileByVersion(query: GetMarketProfileByVersion) → MarketProfileView | null
  listProfileVersions(query: ListMarketProfileVersions) → MarketProfileSummary[]
```

### 7.2 MarketProfileView (logical)

| Field                | Meaning                               |
| -------------------- | ------------------------------------- |
| `marketProfileId`    | Stable version identity               |
| `workspaceId`        | Tenancy                               |
| `exchangeScopeId`    | Venue                                 |
| `marketSymbol`       | Market                                |
| `version`            | Version label                         |
| `volatility`         | VolatilityProfile                     |
| `liquidity`          | LiquidityProfile                      |
| `trend`              | TrendProfile                          |
| `structure`          | StructuralCharacteristics             |
| `confidenceSummary`  | Non-authoritative confidence snapshot |
| `qualificationRunId` | Provenance                            |
| `authorityClass`     | Always `research_artifact`            |
| `forcesTrade`        | Always `false`                        |
| `publishedAt`        | Publish time                          |

---

## 8. Consumer ports (read)

### 8.1 LiveMarketDataReadPort (consume)

```text
LiveMarketDataReadPort
  getConnectivityHealth(query) → ConnectivityHealthView
  getMarketObservations(query) → MarketObservationSlice[]
  getHistoricalCharacteristics(query) → HistoricalCharacteristicSlice[]
```

Rules:

1. Provider payloads must not leak as Qualification domain truth.
2. Read-only; Qualification never owns Live Market Data connectivity.
3. Missing data ⇒ qualification may fail/reject — never invent fills/orders.

### 8.2 ResearchOutputReadPort (consume)

```text
ResearchOutputReadPort
  getApprovedResearchOutputs(query) → ResearchOutputRef[]
```

Rules:

1. Only **approved** research outputs (policy defined in Domain Model).
2. Empty results are valid; Qualification must not require Research to function for MVP paths.
3. No write-back into Research Lab.

---

## 9. Explicit non-ports (forbidden in RC-25)

| Forbidden capability                        | Why                                 |
| ------------------------------------------- | ----------------------------------- |
| `selectStrategy` / `selectTactic`           | Orchestrator later                  |
| `classifyMarketState`                       | Market State later                  |
| `enforceRuntime` / `validateDeployment`     | Runtime Enforcement CLOSED          |
| `startSession` / `pauseBot` / `killSession` | No Session interaction              |
| `approveRisk` / `submitOrder`               | Freeze path                         |
| `certifyStrategy` / `expandEnvelope`        | Strategy Library / Tactics Contract |
| `forceExchangeChoice`                       | Alias forbidden                     |
| `generateReport` / `generateNarrative`      | Reporting / AI CLOSED as owners     |
| REST route inventiveness                    | Out of planning contract            |

---

## 10. Error / empty semantics

| Condition                              | Expected outcome                                     |
| -------------------------------------- | ---------------------------------------------------- |
| Missing Live Market Data               | Run `failed` or `rejected` with reasons; no trade    |
| Unconfirmed heavy run                  | Remain `accepted` (pending confirm); no silent start |
| Duplicate publish from same run        | `rejected` (idempotent: return existing if policy)   |
| Unknown workspace / scope              | `rejected`                                           |
| Consumer asks for profile; none exists | `null` / empty list — never invent profile           |

---

## 11. Process note

Ports are locked for Epics 2–6. Transports (REST, workers, persistence) are chosen during implementation **without** changing port semantics or authority classes.

**STOP.** No implementation until this API Contract + Domain Model + Implementation Plan are approved.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
