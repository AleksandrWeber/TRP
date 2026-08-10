# RC-25 Domain Model Contract — Market Qualification & Market Profile

**Document:** RC-25 Domain Model Contract  
**Status:** APPROVED — Epic 3 domain entities implemented (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Canonical domain model for Market Qualification evaluation artifacts and versioned Market Profiles. Epic 3 materializes immutable create factories; no evaluation behaviour.

**Parent:** [RC-25 Implementation Plan](./rc-25-implementation-plan.md)  
**API:** [RC-25 API Contract](./rc-25-api-contract.md)  
**Integration:** [Integration Diagram](./rc-25-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.3, §5.17  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md) · [Tactics Contract](./v2-tactics-contract.md) · [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)

**Why required:** Architecture Spec v2.0 defines Market Qualification and Market Profile as first-class modules with distinct responsibilities. This contract locks entities so Epics cannot invent a Selection engine, Runtime Gate, or execution SoT under “qualification.”

---

## 1. Purpose

Lock the **canonical domain model** for Market Qualification & Market Profile before Epics implement ports or storage.

This contract answers:

- What qualification and profile entities exist?
- What is research SoT for profile versions vs execution SoT?
- How do lifecycle, confidence, and health relate?
- What must never be owned by Qualification or Profile?

---

## 2. Ownership boundaries

| Entity / fact                              | Owner                             | Authority class                          |
| ------------------------------------------ | --------------------------------- | ---------------------------------------- |
| Live market events / connectivity          | Live Market Data                  | SoT for market ingress observations      |
| Research experiment / campaign bodies      | Research / Campaign / Experiment  | SoT for research artifact bodies         |
| **QualificationTarget**                    | **Market Qualification**          | Research identity for venue/market       |
| **QualificationRun**                       | **Market Qualification**          | Research SoT for a qualification attempt |
| **QualificationState**                     | **Market Qualification**          | Research SoT for lifecycle state         |
| **MarketConfidence**                       | **Market Qualification**          | Research artifact (confidence input)     |
| **MarketHealth**                           | **Market Qualification**          | Research artifact (health indicators)    |
| **MarketProfile** (version)                | **Market Profile**                | Research SoT for _profile versions_      |
| Volatility / Liquidity / Trend / Structure | **Market Profile** (dimensions)   | Part of profile version                  |
| Market State classification                | Market State Engine (**future**)  | Distinct — not Profile                   |
| Strategy / tactic selection                | Trading Orchestrator (**future**) | Consumer of confidence — not owner       |
| Runtime Enforcement decisions              | Runtime Enforcement               | Gate — untouched                         |
| Strategy certification / eligibility       | Strategy Library                  | SoT — untouched                          |
| Session lifecycle                          | Trading Session                   | SoT — untouched                          |
| Cash / fills / orders                      | Ledger / Execution / Orders       | SoT — untouched                          |
| Optional Lake markers                      | Knowledge Lake                    | Projection only                          |

**Hard rules:**

1. Profile versions never force trades or replace Risk.
2. Qualification never becomes Runtime Enforcement or Strategy Library.
3. Profile is not Market State.
4. Refreshing a profile does not expand a Tactical Envelope.
5. Qualification/Profile never command Trading Session.
6. Provider payloads from Live Market Data never become Qualification domain truth without mapping into platform-owned fields.

---

## 3. Aggregate overview

```text
QualificationTarget (workspace + exchangeScope + market)
  ├── QualificationState
  ├── MarketConfidence
  ├── MarketHealth
  └── QualificationRun[] (lifecycle attempts)
        └── (on success) publishes → MarketProfile version
              ├── VolatilityProfile
              ├── LiquidityProfile
              ├── TrendProfile
              └── StructuralCharacteristics
```

Logical retrieval keys:

- Target: (`workspaceId`, `exchangeScopeId`, `marketSymbol`)
- Run: `qualificationRunId`
- Profile version: `marketProfileId` or (`target` + `version`)

---

## 4. QualificationTarget

Identity of a venue/market under evaluation.

| Field             | Required | Meaning             |
| ----------------- | -------- | ------------------- |
| `targetId`        | Yes      | Stable identity     |
| `workspaceId`     | Yes      | Tenancy             |
| `exchangeScopeId` | Yes      | Venue / Cluster key |
| `marketSymbol`    | Yes      | Market within venue |
| `displayName`     | No       | Human label         |
| `createdAt`       | Yes      | Creation time       |

**Notes:**

- Targets are per venue/market (Cluster Isolation invariant 10).
- Target identity does not imply trading authorization.

---

## 5. QualificationRun

User-triggered (or operator-confirmed) evaluation attempt.

| Field                | Required | Meaning                                                                                         |
| -------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `qualificationRunId` | Yes      | Stable identity                                                                                 |
| `workspaceId`        | Yes      | Tenancy                                                                                         |
| `targetId`           | Yes      | QualificationTarget                                                                             |
| `modeContext`        | Yes      | `lab` \| `paper` \| `live` (intended trust label — not a mode switcher)                         |
| `status`             | Yes      | `requested` \| `confirmed` \| `running` \| `completed` \| `failed` \| `cancelled` \| `rejected` |
| `requestedBy`        | Yes      | Actor                                                                                           |
| `confirmedBy`        | No       | Required before heavy execution                                                                 |
| `inputSummary`       | Yes      | Non-authoritative refs to Live Market Data / Research inputs                                    |
| `rejectionReasons[]` | No       | Present on reject/fail                                                                          |
| `completedAt`        | No       | Terminal completion time                                                                        |
| `createdAt`          | Yes      | Creation time                                                                                   |
| `authorityClass`     | Yes      | Always `research_artifact`                                                                      |

**Immutability:** Terminal statuses (`completed` / `failed` / `cancelled` / `rejected`) freeze the run. Corrections = new run.

**Heavy-work rule:** Transition to `running` for heavy jobs requires confirm.

---

## 6. QualificationState

Current lifecycle state for a target.

| Field                  | Required | Meaning                                                                                                    |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `targetId`             | Yes      | Target                                                                                                     |
| `workspaceId`          | Yes      | Tenancy                                                                                                    |
| `state`                | Yes      | `not_qualified` \| `pending_confirm` \| `qualifying` \| `qualified` \| `degraded` \| `expired` \| `failed` |
| `activeRunId`          | No       | Current run if qualifying                                                                                  |
| `latestCompletedRunId` | No       | Last successful run                                                                                        |
| `latestProfileId`      | No       | Latest published profile version                                                                           |
| `updatedAt`            | Yes      | Last transition time                                                                                       |
| `authorityClass`       | Yes      | Always `research_artifact`                                                                                 |

### 6.1 Allowed transitions (normative sketch)

```text
not_qualified → pending_confirm → qualifying → qualified
qualified → degraded | expired | qualifying (requalify)
degraded | expired | failed → pending_confirm (requalify)
qualifying → failed | qualified
any non-terminal → cancelled (via run cancel where applicable)
```

Transitions never start sessions, approve risk, or select strategies.

---

## 7. MarketConfidence

Confidence input derived from qualification — **not** a trade force.

| Field              | Required | Meaning                                     |
| ------------------ | -------- | ------------------------------------------- |
| `targetId`         | Yes      | Target                                      |
| `workspaceId`      | Yes      | Tenancy                                     |
| `level`            | Yes      | `low` \| `medium` \| `high` \| `unknown`    |
| `score`            | No       | Optional numeric in closed range (e.g. 0–1) |
| `rationaleSummary` | Yes      | Human-readable non-authoritative summary    |
| `sourceRunId`      | Yes      | QualificationRun provenance                 |
| `asOf`             | Yes      | Evaluation time                             |
| `forcesTrade`      | Yes      | Always `false`                              |
| `authorityClass`   | Yes      | Always `research_artifact`                  |

**Forbidden:** Using confidence as Risk Decision, Kill Switch, or Deployment authorization.

---

## 8. MarketHealth

Health indicators for the qualified target.

| Field            | Required | Meaning                                          |
| ---------------- | -------- | ------------------------------------------------ |
| `targetId`       | Yes      | Target                                           |
| `workspaceId`    | Yes      | Tenancy                                          |
| `status`         | Yes      | `healthy` \| `watch` \| `unhealthy` \| `unknown` |
| `indicators[]`   | Yes      | Named indicator entries (closed set per epic)    |
| `sourceRunId`    | Yes      | Provenance                                       |
| `asOf`           | Yes      | Evaluation time                                  |
| `authorityClass` | Yes      | Always `research_artifact`                       |

**Notes:** Indicators describe data quality / venue behaviour health for research trust — they do not move balances or halt Sessions by themselves (Kill Switch remains Risk/Session safety).

---

## 9. MarketProfile

Immutable versioned venue qualification artifact.

| Field                | Required | Meaning                            |
| -------------------- | -------- | ---------------------------------- |
| `marketProfileId`    | Yes      | Stable version identity            |
| `workspaceId`        | Yes      | Tenancy                            |
| `targetId`           | Yes      | QualificationTarget                |
| `exchangeScopeId`    | Yes      | Venue key (denormalized for query) |
| `marketSymbol`       | Yes      | Market (denormalized for query)    |
| `version`            | Yes      | Monotonic version                  |
| `qualificationRunId` | Yes      | Provenance                         |
| `volatility`         | Yes      | VolatilityProfile                  |
| `liquidity`          | Yes      | LiquidityProfile                   |
| `trend`              | Yes      | TrendProfile                       |
| `structure`          | Yes      | StructuralCharacteristics          |
| `confidenceSummary`  | Yes      | Snapshot of confidence at publish  |
| `publishedAt`        | Yes      | Publish time                       |
| `publishedBy`        | Yes      | Actor / pipeline                   |
| `authorityClass`     | Yes      | Always `research_artifact`         |
| `forcesTrade`        | Yes      | Always `false`                     |

**Immutability:** After publish, a profile version is immutable. Requalify ⇒ new version.

---

## 10. Profile dimensions

### 10.1 VolatilityProfile

| Field           | Required | Meaning                                |
| --------------- | -------- | -------------------------------------- |
| `regimeLabel`   | Yes      | Closed label set (epic-defined)        |
| `metrics`       | Yes      | Named volatility metrics (closed keys) |
| `windowSummary` | Yes      | Observation window description         |

### 10.2 LiquidityProfile

| Field           | Required | Meaning                               |
| --------------- | -------- | ------------------------------------- |
| `regimeLabel`   | Yes      | Closed label set                      |
| `metrics`       | Yes      | Named liquidity metrics (closed keys) |
| `windowSummary` | Yes      | Observation window description        |

### 10.3 TrendProfile

| Field           | Required | Meaning                           |
| --------------- | -------- | --------------------------------- |
| `regimeLabel`   | Yes      | Closed label set                  |
| `metrics`       | Yes      | Named trend metrics (closed keys) |
| `windowSummary` | Yes      | Observation window description    |

### 10.4 StructuralCharacteristics

| Field               | Required | Meaning                                   |
| ------------------- | -------- | ----------------------------------------- |
| `characteristics[]` | Yes      | Named structural attributes (closed keys) |
| `notes`             | No       | Non-authoritative narrative notes         |

**Dimension rules:**

1. Dimensions describe; they do not select strategies.
2. Dimension labels are **not** Market State engine classifications (future module).
3. Metric keys must not include ad-hoc ledger/balance recomputation.

---

## 11. Distinction: Profile vs Market State

| Concern      | Market Profile (RC-25)       | Market State (later)              |
| ------------ | ---------------------------- | --------------------------------- |
| Nature       | Versioned research artifact  | Current condition classification  |
| Trigger      | User-triggered qualification | Live/recent observations          |
| Mutability   | Immutable versions           | Current classification may update |
| Consumer use | Confidence input             | Selection context                 |
| Executes?    | No                           | No                                |

RC-25 must not implement Market State under Profile names.

---

## 12. Allowed / forbidden verbs

### Allowed

- evaluate, qualify, requalify, confirm, cancel (runs)
- publish profile version
- describe volatility / liquidity / trend / structure
- expose confidence / health as research artifacts
- read Live Market Data / approved Research outputs

### Forbidden

- select strategy / tactic
- enforce runtime / authorize deployment / start session
- approve risk / submit order / mutate ledger
- force exchange or strategy choice
- expand Tactical Envelope
- replace Reporting / AI / Lake / Library
- classify Market State as a live selection engine (defer)

---

## 13. Authority labels (mandatory)

Every QualificationState, MarketConfidence, MarketHealth, and MarketProfile artifact must carry:

- `authorityClass: research_artifact`
- `forcesTrade: false` (where applicable)

Optional Lake markers remain `projection` only.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
