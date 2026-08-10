# RC-26 Domain Model Contract — Trading Orchestrator & Market State

**Document:** RC-26 Domain Model Contract  
**Status:** APPROVED — Epic 5 Trading Orchestrator workflow ports materialized (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Canonical domain model for Market State classifications and Trading Orchestrator coordination artifacts. Epic 3 materializes immutable Market State factories; Epic 4 materializes immutable Orchestrator plan/intent/lifecycle factories; Epic 5 materializes OrchestrationRun / SelectionDecision / SessionHandoffIntent + workflow ports.

**Parent:** [RC-26 Implementation Plan](./rc-26-implementation-plan.md)  
**API:** [RC-26 API Contract](./rc-26-api-contract.md)  
**Integration:** [Integration Diagram](./rc-26-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.4, §5.5, §7  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md) · [Tactics Contract](./v2-tactics-contract.md) · [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)

**Why required:** Architecture Spec v2.0 defines Market State and Trading Orchestrator as first-class modules with distinct responsibilities. This contract locks entities so Epics cannot invent a second Qualification engine, a soft Gate, an Execution Engine, or AI capital authority under “orchestration.”

---

## 1. Purpose

Lock the **canonical domain model** for Market State & Trading Orchestrator before Epics implement ports or storage.

This contract answers:

- What Market State and Orchestrator entities exist?
- What is current-condition SoT vs coordination SoT vs execution SoT?
- How do selection, tactics, Gate refs, and Session handoff relate?
- What must never be owned by Market State or Trading Orchestrator?

---

## 2. Ownership boundaries

| Entity / fact                                            | Owner                         | Authority class                                 |
| -------------------------------------------------------- | ----------------------------- | ----------------------------------------------- |
| Live market events / connectivity                        | Live Market Data              | SoT for market ingress observations             |
| QualificationRun / Confidence / Health                   | Market Qualification          | Research artifact — **consumed**, not owned     |
| MarketProfile versions                                   | Market Profile                | Research SoT for versions — **consumed**        |
| **MarketState** (versioned)                              | **Market State**              | Current-condition SoT for descriptive versions  |
| **MarketStateVersion / Lifecycle / Snapshot / Metadata** | **Market State**              | Part of Market State aggregate                  |
| Strategy certification / eligibility                     | Strategy Library              | SoT — untouched                                 |
| Tactical Envelope contents                               | Strategy Library / Deployment | Certified allow-set — untouched                 |
| EnforcementDecision                                      | Runtime Enforcement           | Gate — untouched                                |
| **TradingOrchestrator**                                  | **Trading Orchestrator**      | Coordinator identity (not Execution Engine)     |
| **OrchestrationPlan** (versioned)                        | **Trading Orchestrator**      | Coordination SoT for immutable plan versions    |
| **OrchestrationIntent / Lifecycle / Metadata**           | **Trading Orchestrator**      | Part of OrchestrationPlan aggregate             |
| **SelectionDecision** (Epic 5+)                          | **Trading Orchestrator**      | Coordination SoT for strategy choice            |
| **TacticSelection** (Epic 5+)                            | **Trading Orchestrator**      | Coordination SoT for envelope-point choice      |
| **SessionHandoffIntent** (Epic 5+)                       | **Trading Orchestrator**      | Intent artifact — Session remains lifecycle SoT |
| Trading Session lifecycle                                | Trading Session               | SoT — untouched                                 |
| Risk Decision                                            | Risk Engine                   | SoT — untouched                                 |
| Orders / Fills / Execution                               | Orders / Execution / Ledger   | SoT — untouched                                 |
| Report aggregations / AI narratives                      | Reporting / AI Analytics      | Projection / Narrative — may read               |

**Hard rules:**

1. Market State never becomes Market Qualification (no runs, no profile publish ownership).
2. Market State never becomes Market Profile (no versioned venue research artifact ownership).
3. Orchestrator never invents envelope points or changes strategy version silently.
4. Orchestrator never produces Risk Decisions, Orders, Fills, or ledger mutations.
5. Orchestrator never soft-passes Runtime Enforcement.
6. Confidence inputs never force trades.
7. Provider payloads never become Market State domain truth without platform-owned mapping.
8. SessionHandoffIntent never equals Session lifecycle state.

---

## 3. Aggregate overview

```text
MarketStateTarget (workspace + exchangeScope + market)
  └── MarketState[] (immutable versions; append-only)
        ├── MarketStateVersion
        ├── MarketStateLifecycle (created|active|superseded|archived)
        ├── MarketStateSnapshot (descriptive payload)
        └── MarketStateMetadata (non-authoritative input refs)

TradingOrchestrator (workspace + exchangeScope identity)
  └── OrchestrationPlan[] (immutable versions; append-only)
        ├── OrchestrationPlanVersion
        ├── OrchestrationLifecycle (created|planned|ready|cancelled|archived)
        ├── OrchestrationIntent (descriptive — not workflow)
        └── OrchestrationMetadata (opaque State/Qual/Profile refs)

(Epic 5+ workflow artifacts — declared, not materialized in Epic 4)
OrchestrationRun → SelectionDecision → TacticSelection → SessionHandoffIntent
```

Logical retrieval keys:

- Market state target: (`workspaceId`, `exchangeScopeId`, `marketSymbol`)
- Market state version: `marketStateId` + `version`
- Trading orchestrator: `tradingOrchestratorId`
- Orchestration plan version: `orchestrationPlanId` + `version`
- Selection (Epic 5+): `selectionDecisionId`
- Handoff intent (Epic 5+): `sessionHandoffIntentId`

---

## 4. MarketState

Immutable **versioned** normalized description of market conditions for a venue/market.

| Field               | Required | Meaning                                                     |
| ------------------- | -------- | ----------------------------------------------------------- |
| `marketStateId`     | Yes      | Stable identity for this version record                     |
| `workspaceId`       | Yes      | Tenancy                                                     |
| `exchangeScopeId`   | Yes      | Venue / Cluster key                                         |
| `marketSymbol`      | Yes      | Market within venue                                         |
| `version`           | Yes      | `MarketStateVersion` (positive integer; append-only)        |
| `lifecycle`         | Yes      | `MarketStateLifecycle`                                      |
| `snapshot`          | Yes      | `MarketStateSnapshot` (descriptive; caller-supplied labels) |
| `metadata`          | Yes      | `MarketStateMetadata` (opaque input refs)                   |
| `authorityClass`    | Yes      | Always `market_state_artifact`                              |
| `forcesTrade`       | Yes      | Always `false`                                              |
| `isQualification`   | Yes      | Always `false`                                              |
| `isProfile`         | Yes      | Always `false`                                              |
| `authorizesRuntime` | Yes      | Always `false`                                              |
| `mutable`           | Yes      | Always `false`                                              |

**Notes:**

- Market State is **current-condition** description, not historical research qualification.
- Publishing a new state creates a **new version**; previous versions remain queryable.
- No overwrite / in-place mutation.
- Refreshing Market State does not publish a Market Profile version or expand a Tactical Envelope.
- Epic 3 factories do **not** run classification algorithms — snapshot labels are supplied by the caller.

### 4.1 MarketStateVersion

| Field           | Required | Meaning                          |
| --------------- | -------- | -------------------------------- |
| `marketStateId` | Yes      | Must match parent MarketState id |
| `version`       | Yes      | Positive integer                 |
| `publishedAt`   | Yes      | ISO timestamp                    |
| `publishedBy`   | Yes      | Actor                            |
| `mutable`       | Yes      | Always `false`                   |

### 4.2 MarketStateSnapshot

| Field              | Required | Meaning                                      |
| ------------------ | -------- | -------------------------------------------- |
| `regime`           | Yes      | Closed descriptive label (not computed here) |
| `volatilityClass`  | No       | Optional descriptive class                   |
| `liquidityClass`   | No       | Optional descriptive class                   |
| `narrativeSummary` | Yes      | Human-readable non-authoritative summary     |
| `decidesTrade`     | Yes      | Always `false`                               |

### 4.3 MarketStateMetadata

| Field             | Required | Meaning                                |
| ----------------- | -------- | -------------------------------------- |
| `observationAsOf` | Yes      | Observation time                       |
| `confidenceRef`   | No       | Opaque Qualification confidence ref    |
| `profileRef`      | No       | Opaque Profile version ref             |
| `inputSummary`    | Yes      | Non-authoritative input summary        |
| `isQualification` | Yes      | Always `false` (no ownership transfer) |
| `isProfile`       | Yes      | Always `false`                         |

### 4.4 MarketStateLifecycle

| Field               | Required | Meaning                                             |
| ------------------- | -------- | --------------------------------------------------- |
| `status`            | Yes      | `created` \| `active` \| `superseded` \| `archived` |
| `updatedAt`         | Yes      | ISO timestamp                                       |
| `updatedBy`         | Yes      | Actor                                               |
| `reason`            | Yes      | Transition rationale                                |
| `authorizesRuntime` | Yes      | Always `false`                                      |

### 4.5 Allowed lifecycle (normative)

```text
created → active | archived
active → superseded | archived
superseded → archived
archived → (terminal)
```

Transitions are **manual immutable record creation** only — no automatic generation.
Transitions never select strategies, bind sessions, approve risk, or submit orders.

### 4.6 Versioning rules

1. First publish for a target must be version `1`.
2. Next publish must be `max(history)+1`.
3. Duplicate version numbers are rejected (overwrite protection).
4. Publishing a new active version supersedes the prior active version (new immutable copy).

---

## 5. (Reserved) MarketStateTransition notes

Lifecycle changes are represented by new `MarketStateLifecycle` records attached to Market State versions (see §4.4–4.5). Append-only version history replaces a separate mutable transition table for Epic 3.

---

## 6. TradingOrchestrator

Immutable coordinator **identity** within a workspace / exchange scope. Not a workflow engine.

| Field                     | Required | Meaning                         |
| ------------------------- | -------- | ------------------------------- |
| `tradingOrchestratorId`   | Yes      | Stable identity                 |
| `workspaceId`             | Yes      | Tenancy                         |
| `exchangeScopeId`         | Yes      | Venue / Cluster key             |
| `displayName`             | Yes      | Human label                     |
| `createdAt` / `createdBy` | Yes      | Provenance                      |
| `authorityClass`          | Yes      | Always `orchestration_artifact` |
| `forcesTrade`             | Yes      | Always `false`                  |
| `isStrategyLibrary`       | Yes      | Always `false`                  |
| `isRuntimeEnforcement`    | Yes      | Always `false`                  |
| `isMarketState`           | Yes      | Always `false`                  |
| `isExecutionEngine`       | Yes      | Always `false`                  |
| `mutable`                 | Yes      | Always `false`                  |

---

## 7. OrchestrationPlan

Immutable **versioned** coordination plan. Describes intent only — does not execute actions.

| Field                   | Required | Meaning                                 |
| ----------------------- | -------- | --------------------------------------- |
| `orchestrationPlanId`   | Yes      | Stable identity for this version record |
| `tradingOrchestratorId` | Yes      | Parent orchestrator                     |
| `workspaceId`           | Yes      | Tenancy                                 |
| `exchangeScopeId`       | Yes      | Venue                                   |
| `marketSymbol`          | Yes      | Market context                          |
| `modeContext`           | Yes      | `lab` \| `paper` \| `live`              |
| `version`               | Yes      | `OrchestrationPlanVersion`              |
| `lifecycle`             | Yes      | `OrchestrationLifecycle`                |
| `intent`                | Yes      | `OrchestrationIntent`                   |
| `metadata`              | Yes      | `OrchestrationMetadata`                 |
| `authorityClass`        | Yes      | Always `orchestration_artifact`         |
| `executesActions`       | Yes      | Always `false`                          |
| `selectsStrategy`       | Yes      | Always `false` (Epic 4 — no selection)  |
| `createsSession`        | Yes      | Always `false`                          |
| `isWorkflow`            | Yes      | Always `false`                          |
| `mutable`               | Yes      | Always `false`                          |

### 7.1 OrchestrationPlanVersion

| Field                 | Required | Meaning              |
| --------------------- | -------- | -------------------- |
| `orchestrationPlanId` | Yes      | Parent plan identity |
| `version`             | Yes      | Positive integer     |
| `publishedAt` / `By`  | Yes      | Provenance           |
| `mutable`             | Yes      | Always `false`       |

### 7.2 OrchestrationIntent

| Field              | Required | Meaning                     |
| ------------------ | -------- | --------------------------- |
| `objective`        | Yes      | Coordination purpose text   |
| `rationaleSummary` | Yes      | Non-authoritative rationale |
| `selectsStrategy`  | Yes      | Always `false`              |
| `createsSession`   | Yes      | Always `false`              |
| `executesActions`  | Yes      | Always `false`              |
| `isWorkflow`       | Yes      | Always `false`              |

### 7.3 OrchestrationLifecycle

| Field               | Required | Meaning                                                        |
| ------------------- | -------- | -------------------------------------------------------------- |
| `status`            | Yes      | `created` \| `planned` \| `ready` \| `cancelled` \| `archived` |
| `updatedAt` / `By`  | Yes      | Transition provenance                                          |
| `reason`            | Yes      | Transition rationale                                           |
| `authorizesRuntime` | Yes      | Always `false`                                                 |
| `executesActions`   | Yes      | Always `false`                                                 |

### 7.4 OrchestrationMetadata

| Field                                               | Required | Meaning                                |
| --------------------------------------------------- | -------- | -------------------------------------- |
| `asOf`                                              | Yes      | Observation time                       |
| `marketStateRef`                                    | No       | Opaque Market State id (not ownership) |
| `qualificationRef`                                  | No       | Opaque Qualification id                |
| `profileRef`                                        | No       | Opaque Profile id                      |
| `inputSummary`                                      | Yes      | Non-authoritative summary              |
| `ownsMarketState` / Library / Gate / Qual / Profile | Yes      | Always `false`                         |

### 7.5 Allowed lifecycle (normative)

```text
created → planned | cancelled | archived
planned → ready | cancelled | archived
ready → cancelled | archived
cancelled → archived
archived → (terminal)
```

Transitions are **manual immutable record creation** only — no automatic orchestration.

### 7.6 Versioning rules

1. First publish for a target must be version `1`.
2. Next publish must be `max(history)+1`.
3. Duplicate version numbers are rejected (overwrite protection).
4. Publishing a new ready plan archives the prior ready plan (new immutable copy).

---

## 8. SelectionDecision / TacticSelection

Materialized in Epic 5 as coordination records after **delegated** Library Lookup/Eligibility.

- SelectionDecision records certified Library identity only — no invented strategies.
- Tactic points validated via Library eligibility (envelope) — fail closed.
- Never soft-pass Runtime Enforcement; never invent envelope points.
- Orchestrator does **not** own selection ranking algorithms — it records caller-proposed Library ids after verification.

---

## 9. SessionHandoffIntent

Materialized in Epic 5 as a coordination intent asking Trading Session to bind / accept a mission context.

- Session remains lifecycle SoT; handoff intent ≠ Session state.
- Handoff intent is never an Order and never a Risk Decision.
- Gate reject ⇒ no successful handoff intent emission (`createsSession: false`).
- Orchestrator does **not** import Trading Session or create Sessions.

---

## 10. Distinctions (normative)

### 10.1 Market State vs Market Qualification

| Aspect    | Market State                          | Market Qualification                |
| --------- | ------------------------------------- | ----------------------------------- |
| Question  | What is the market **now**?           | Can we **trust** this venue/market? |
| Trigger   | Classify / refresh current conditions | User-triggered research pipeline    |
| Output    | Current classification                | Runs, state, confidence, health     |
| Profile   | May **read** Profile as input         | May **publish** Profile versions    |
| Selection | Informs selection                     | Does not select                     |

### 10.2 Market State vs Market Profile

| Aspect       | Market State                | Market Profile              |
| ------------ | --------------------------- | --------------------------- |
| Nature       | Current classification      | Versioned research artifact |
| Mutability   | Current value + transitions | Immutable versions          |
| Ownership    | Market State module         | Market Profile module       |
| Forces trade | Never                       | Never                       |

### 10.3 Orchestrator vs Runtime Enforcement

| Aspect     | Orchestrator                    | Runtime Enforcement        |
| ---------- | ------------------------------- | -------------------------- |
| Role       | Coordinates selection + handoff | Validates eligibility Gate |
| Decides?   | Selects among certified options | PASS/FAIL validation only  |
| Soft-fail? | Forbidden to bypass Gate        | Fail-closed                |

### 10.4 Orchestrator vs Execution Engine

| Aspect     | Orchestrator                              | Execution Engine           |
| ---------- | ----------------------------------------- | -------------------------- |
| Role       | Coordination / handoff intents            | Submit/cancel via adapters |
| Orders?    | Never                                     | Yes (after Risk)           |
| Alias trap | Not “Execution Orchestrator” as Execution | Distinct module            |

---

## 11. Allowed / forbidden verbs

| Verb                         | Market State | Orchestrator | Notes                 |
| ---------------------------- | ------------ | ------------ | --------------------- |
| classify / refresh state     | **Yes**      | No           |                       |
| select certified strategy    | No           | **Yes**      | Via Library           |
| select envelope tactics      | No           | **Yes**      | Inside Envelope only  |
| call Enforcement Gate        | No           | **Yes**      | Consume               |
| emit Session handoff intent  | No           | **Yes**      | Session SoT unchanged |
| read Risk policy constraints | No           | **Yes**      | Read only             |
| certify strategy             | **No**       | **No**       | Library               |
| evaluate Qualification       | **No**       | **No**       | Qualification         |
| publish Profile              | **No**       | **No**       | Profile               |
| approve Risk                 | **No**       | **No**       | Risk Engine           |
| submit Order / Execution     | **No**       | **No**       | Orders / Execution    |
| invent envelope points       | **No**       | **No**       | Forever               |
| force trade via confidence   | **No**       | **No**       | Forever               |

---

## 12. Authority labels

| Label                    | Meaning                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| `market_state_artifact`  | Current-condition classification SoT                                   |
| `orchestration_artifact` | Coordination plan / intent / lifecycle SoT (selection/handoff Epic 5+) |
| `research_artifact`      | Qualification / Profile (consumed, not owned here)                     |
| `execution_sot`          | Orders / Fills / Ledger — **never** claimed by RC-26                   |
| `risk_decision`          | Risk Engine — **never** produced by RC-26                              |

---

## 13. STOP gate

Domain entities are locked for planning. Implementation begins only after plan approval and Epic kickoff.
