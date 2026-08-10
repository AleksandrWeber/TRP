# RC-26 API Contract — Trading Orchestrator & Market State

**Document:** RC-26 API Contract  
**Status:** APPROVED — Epic 6 consumer-read ports active for Market State + Trading Orchestrator; classify/query Nest inactive; REST/persistence forbidden  
**Date:** 2026-08-10  
**Nature:** Application **ports only**. **No REST. No database schema. No transport product. No queue. No event bus.** Epic 6 activates downstream consumer-read façades.

**Parent:** [RC-26 Implementation Plan](./rc-26-implementation-plan.md)  
**Domain:** [Domain Model Contract](./rc-26-domain-model-contract.md)  
**Epics:** [Epic Breakdown](./rc-26-epic-breakdown.md)  
**Integration:** [Integration Diagram](./rc-26-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.4, §5.5, §7  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md) · [Tactics Contract](./v2-tactics-contract.md)  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) — API Contract stage

**Upstream ports (consume):**

- [RC-22 API Contract](./rc-22-api-contract.md) — Library Lookup / Eligibility / Envelope
- [RC-23 API Contract](./rc-23-api-contract.md) — `RuntimeEnforcementPort`
- [RC-25 API Contract](./rc-25-api-contract.md) — Qualification / Profile consumer reads

---

## 1. Purpose

Lock the **application ports** Trading Orchestrator and Market State expose, and the upstream **read / Gate / handoff** ports they consume, so Epics implement one contract.

This document deliberately does **not** define:

- HTTP routes / OpenAPI
- Prisma / SQL / table layouts
- Kafka, Redis, queues, or bus topics
- UI widgets or Command Center orchestration panels
- Strategy certification write APIs
- Runtime Enforcement redesign
- Market Qualification evaluation / Profile publish APIs
- Orders / Execution / Ledger APIs
- Risk Decision production APIs
- Reporting / AI redesign
- Multi-Exchange adapter APIs

Transports and persistence are Epic implementation choices after approval — provided they preserve coordination/current-state authority classes and never become execution SoT.

---

## 2. Ownership of the contract

| Concern                              | Owner                                                 |
| ------------------------------------ | ----------------------------------------------------- |
| Market State ports                   | Market State module (RC-26)                           |
| Trading Orchestrator ports           | Trading Orchestrator module (RC-26)                   |
| Live market observations             | Live Market Data (§5.17) — **read only** here         |
| Qualification / Profile projections  | Market Qualification / Profile — **read only** here   |
| Strategy certification / eligibility | Strategy Library — **consume**                        |
| Runtime Enforcement Gate             | Runtime Enforcement — **consume**                     |
| Session lifecycle                    | Trading Session — Orchestrator emits **intents** only |
| Risk Decisions                       | Risk Engine — **not produced** here                   |
| Orders / fills                       | Orders / Execution — **not in scope**                 |
| Naming (product vs canonical)        | Alias Dictionary                                      |

**Canonical names:** `TradingOrchestrator`, `MarketState`, `orchestrationRunId`, `marketStateId`, `selectionDecisionId`, `sessionHandoffIntentId`, `exchangeScopeId`, `marketSymbol` — never Bot aggregate as Orchestrator SoT; never Orchestrator-as-Execution; never State-as-Qualification.

---

## 3. Port overview (locked)

```text
LiveMarketDataReadPort                 (consume, read)
MarketQualificationConsumerReadPort    (consume, read)
MarketProfileConsumerReadPort          (consume, read)
        │
        ▼
MarketStateServicePort ──▶ classify / refresh / expire
MarketStateQueryPort   ──▶ current state / transitions
        │
        ▼
StrategyLibraryLookup / Eligibility / Envelope  (consume)
RuntimeEnforcementPort.validateDeployment       (consume, Gate)
RiskPolicyReadPort / constraint reads           (consume, read)
        │
        ▼
TradingOrchestratorServicePort ──▶ orchestration runs + selection + handoff intents
TradingOrchestratorQueryPort   ──▶ read runs / decisions / intents
        │
        ▼
Trading Session (handoff acceptance — Session-owned)
        │
        ▼
Consumer read ports → Reporting / AI Analytics / Command Center
```

Locked capabilities:

| Capability                                | Port                                                  |
| ----------------------------------------- | ----------------------------------------------------- |
| Classify / refresh / expire market state  | `MarketStateServicePort`                              |
| Query current state / transitions         | `MarketStateQueryPort`                                |
| Start / confirm / cancel orchestration    | `TradingOrchestratorServicePort`                      |
| Propose strategy + tactic selection       | `TradingOrchestratorServicePort`                      |
| Emit Session handoff intents              | `TradingOrchestratorServicePort`                      |
| Query orchestration / selection / handoff | `TradingOrchestratorQueryPort`                        |
| Live market observation reads             | `LiveMarketDataReadPort` (consume)                    |
| Qualification / Profile confidence reads  | RC-25 consumer ports (consume)                        |
| Library / Envelope / Eligibility          | RC-22 ports (consume)                                 |
| Deployment validation                     | `RuntimeEnforcementPort` (consume)                    |
| Risk policy / constraint context          | `RiskPolicyReadPort` (consume; logical name)          |
| Downstream state / orchestration reads    | Consumer read ports (Reporting / AI / Command Center) |

No Certification-write, Qualification-evaluate, Profile-publish, Risk-approve, Order-submit, Execution-submit, or Session-state-ownership ports are owned by RC-26 modules.

---

## 4. MarketStateServicePort

### 4.1 Interface (logical)

```text
MarketStateServicePort
  classifyMarketState(cmd: ClassifyMarketState) → MarketStateResult
  refreshMarketState(cmd: RefreshMarketState) → MarketStateResult
  expireMarketState(cmd: ExpireMarketState) → MarketStateResult
```

### 4.2 ClassifyMarketState

| Field             | Required | Meaning                                     |
| ----------------- | -------- | ------------------------------------------- |
| `workspaceId`     | Yes      | Tenancy                                     |
| `exchangeScopeId` | Yes      | Venue key                                   |
| `marketSymbol`    | Yes      | Market identity within venue                |
| `asOf`            | No       | Observation time; service stamps if omitted |
| `requestedBy`     | Yes      | Actor / pipeline identity                   |
| `notes`           | No       | Operator rationale                          |

**Rules:**

1. Classification produces / updates **Market State** — not QualificationRun, not MarketProfile version.
2. Inputs may include LMD observations + Qualification/Profile confidence — mapped into platform-owned fields.
3. Classify never starts a Trading Session, selects a strategy, or submits orders.
4. Heavy continuous classifiers (if any) must not silently auto-spend without explicit operator/policy confirmation semantics where applicable.

### 4.3 MarketStateResult

| Field              | Meaning                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `outcome`          | `accepted` \| `unchanged` \| `rejected` \| `expired` \| `failed` |
| `marketStateId`    | Current state identity                                           |
| `marketState`      | Snapshot after transition                                        |
| `transitionId`     | Present when a transition was recorded                           |
| `rejectionReasons` | Present when `rejected` / `failed`                               |

---

## 5. MarketStateQueryPort

### 5.1 Interface (logical)

```text
MarketStateQueryPort
  getCurrentMarketState(query: GetCurrentMarketState) → MarketStateView | null
  listMarketStateTransitions(query: ListMarketStateTransitions) → MarketStateTransitionView[]
  getMarketStateTransition(query: GetMarketStateTransition) → MarketStateTransitionView | null
```

### 5.2 Common query keys

| Field             | Required | Meaning                 |
| ----------------- | -------- | ----------------------- |
| `workspaceId`     | Yes      | Tenancy                 |
| `exchangeScopeId` | Yes*     | Venue (*target-scoped)  |
| `marketSymbol`    | Yes*     | Market (*target-scoped) |
| `marketStateId`   | No*      | Identity-scoped         |
| `transitionId`    | No*      | Transition-scoped       |

### 5.3 View authority

All query views carry:

| Field             | Value                                           |
| ----------------- | ----------------------------------------------- |
| `authorityClass`  | `market_state_artifact` (current-condition SoT) |
| `forcesTrade`     | Always `false`                                  |
| `isQualification` | Always `false`                                  |
| `isProfile`       | Always `false`                                  |

---

## 6. TradingOrchestratorServicePort

### 6.1 Interface (logical)

```text
TradingOrchestratorServicePort
  requestOrchestrationRun(cmd: RequestOrchestrationRun) → OrchestrationRunResult
  confirmOrchestrationRun(cmd: ConfirmOrchestrationRun) → OrchestrationRunResult
  cancelOrchestrationRun(cmd: CancelOrchestrationRun) → OrchestrationRunResult
  proposeSelection(cmd: ProposeSelection) → SelectionResult
  emitSessionHandoff(cmd: EmitSessionHandoff) → SessionHandoffResult
```

### 6.2 RequestOrchestrationRun

| Field             | Required | Meaning                                            |
| ----------------- | -------- | -------------------------------------------------- |
| `workspaceId`     | Yes      | Tenancy                                            |
| `exchangeScopeId` | Yes      | Venue key                                          |
| `marketSymbol`    | Yes      | Market context                                     |
| `modeContext`     | Yes      | `paper` \| `lab` \| `live` (label; live still ADR) |
| `requestedBy`     | Yes      | Operator / system actor                            |
| `objective`       | No       | Human rationale                                    |
| `marketStateId`   | No       | Pin to known state; else use current               |

**Rules:**

1. Request does not bind Session, approve risk, or submit orders.
2. Selection that would change an active Session mission requires confirm semantics (operator acknowledgment).
3. Orchestrator never invents Library membership.

### 6.3 ProposeSelection

| Field                | Required | Meaning                                        |
| -------------------- | -------- | ---------------------------------------------- |
| `workspaceId`        | Yes      | Tenancy                                        |
| `orchestrationRunId` | Yes      | Active run                                     |
| `libraryEntryId`     | Yes      | Certified Library identity                     |
| `strategyVersionId`  | Yes      | Immutable certified version                    |
| `tacticPoint`        | Yes      | Envelope point reference (symbol/tf/risk/etc.) |
| `envelopeVersion`    | Yes      | Envelope version used                          |
| `proposedBy`         | Yes      | Actor                                          |

**Rules:**

1. Must verify Library eligibility for purpose.
2. Must verify `tacticPoint` ∈ Tactical Envelope — fail closed otherwise.
3. Must not change `strategyVersionId` silently after proposal acceptance.
4. Confidence inputs may rank candidates; they must not override Gate or Envelope.

### 6.4 EmitSessionHandoff

| Field                 | Required | Meaning                                           |
| --------------------- | -------- | ------------------------------------------------- |
| `workspaceId`         | Yes      | Tenancy                                           |
| `orchestrationRunId`  | Yes      | Run                                               |
| `selectionDecisionId` | Yes      | Accepted selection                                |
| `tradingSessionId`    | No       | Existing session if rebinding; else create intent |
| `deploymentBindRef`   | Yes      | Deployment / mission reference for Session        |
| `requestedBy`         | Yes      | Actor                                             |

**Rules:**

1. Before bind intent that requires Gate: call `RuntimeEnforcementPort.validateDeployment` — fail closed on reject.
2. Handoff is an **intent**; Session accepts/rejects and remains lifecycle SoT.
3. Emit never creates Orders, Fills, or Risk Decisions.
4. Emit never calls Execution Engine / adapters.

### 6.5 OrchestrationRunResult / SelectionResult / SessionHandoffResult

| Field                    | Meaning                                                                           |
| ------------------------ | --------------------------------------------------------------------------------- |
| `outcome`                | `accepted` \| `proposed` \| `handed_off` \| `rejected` \| `cancelled` \| `failed` |
| `orchestrationRunId`     | Run identity                                                                      |
| `selectionDecisionId`    | Present after propose                                                             |
| `sessionHandoffIntentId` | Present after emit                                                                |
| `enforcementDecisionRef` | Present when Gate consulted                                                       |
| `rejectionReasons[]`     | Present on reject/fail                                                            |

---

## 7. TradingOrchestratorQueryPort

### 7.1 Interface (logical)

```text
TradingOrchestratorQueryPort
  getOrchestrationRun(query: GetOrchestrationRun) → OrchestrationRunView | null
  listOrchestrationRuns(query: ListOrchestrationRuns) → OrchestrationRunSummary[]
  getSelectionDecision(query: GetSelectionDecision) → SelectionDecisionView | null
  getSessionHandoffIntent(query: GetSessionHandoffIntent) → SessionHandoffIntentView | null
```

### 7.2 View authority

| Field            | Value                                                         |
| ---------------- | ------------------------------------------------------------- |
| `authorityClass` | `orchestration_artifact` (coordination — never execution SoT) |
| `forcesTrade`    | Always `false`                                                |
| `approvesRisk`   | Always `false`                                                |
| `submitsOrders`  | Always `false`                                                |

---

## 8. Consumed ports (normative)

| Port / surface                                   | Direction        | RC-26 use                                 |
| ------------------------------------------------ | ---------------- | ----------------------------------------- |
| `LiveMarketDataReadPort`                         | Consume          | Market State observations                 |
| `MarketQualificationConsumerReadPort`            | Consume          | Confidence / health / lifecycle inputs    |
| `MarketProfileConsumerReadPort`                  | Consume          | Profile confidence / dimension inputs     |
| Strategy Library Lookup / Eligibility / Envelope | Consume          | Candidate set + envelope checks           |
| `RuntimeEnforcementPort`                         | Consume          | Fail-closed Gate before bind intents      |
| `RiskPolicyReadPort` (logical)                   | Consume          | Selection filters from policy/constraints |
| Trading Session handoff acceptance               | Intent → Session | Session remains SoT                       |

### 8.1 RiskPolicyReadPort (logical)

```text
RiskPolicyReadPort
  getExchangeRiskPolicy(query) → ExchangeRiskPolicyView | null
  getSelectionConstraints(query) → SelectionConstraintView | null
```

**Rules:** Reads only. Never `approveRisk`, never Kill Switch mutation, never ledger reads-as-authority for balances beyond constraint labels if exposed.

---

## 9. Consumer read ports (downstream)

```text
MarketStateConsumerReadPort
  getCurrentStateProjection(query) → MarketStateProjection | null
  listRecentTransitions(query) → MarketStateTransitionProjection[]

TradingOrchestratorConsumerReadPort
  getOrchestrationSummary(query) → OrchestrationSummaryProjection | null
  getLatestSelectionProjection(query) → SelectionDecisionProjection | null
  getHandoffIntentProjection(query) → SessionHandoffIntentProjection | null
```

**Audience:** Reporting, AI Analytics, Command Center — read only. No callbacks. No mutations.

---

## 10. Explicit non-ports (forbidden)

| Forbidden capability                         | Why                                          |
| -------------------------------------------- | -------------------------------------------- |
| `certifyStrategy` / `expandEnvelope`         | Library / research ownership                 |
| `validateDeployment` ownership / soft-pass   | Enforcement ownership; fail-closed preserved |
| `requestQualificationRun` / `publishProfile` | Qualification / Profile ownership            |
| `approveRisk` / `tripKillSwitch`             | Risk / safety ownership                      |
| `createOrder` / `submitExecution`            | Orders / Execution ownership                 |
| `mutateLedger` / `inventFill`                | Accounting ownership                         |
| `classifyAsQualification`                    | Market State ≠ Qualification                 |
| `generateAiTradeDecision`                    | AI is not capital authority                  |

---

## 11. Tenancy & isolation

All ports require `workspaceId`. Venue-scoped operations require `exchangeScopeId`. Cross-scope selection mixing is forbidden without explicit read models (none in RC-26). Cluster Isolation: policy inputs may differ per scope; engines remain platform-singleton.

---

## 12. STOP gate

Ports are locked for planning. Implementation of adapters/persistence/REST is **not** authorized by this document alone — requires plan approval and epic kickoff.
