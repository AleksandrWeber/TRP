# RC-24 Reporting Domain Model — Reporting & AI Analytics

**Document:** RC-24 Reporting Domain Model  
**Status:** APPROVED — Epic 3 domain entities implemented (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Canonical domain model for Reporting projections and AI narratives. **No persistence schema. No REST.** Epic 3 materializes immutable create factories; no generation behaviour.

**Parent:** [RC-24 Implementation Plan](./rc-24-implementation-plan.md)  
**API:** [RC-24 API Contract](./rc-24-api-contract.md)  
**Integration:** [Reporting Integration Diagram](./rc-24-reporting-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.13–§5.15, §6, §10  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md)  
**Lake predecessor:** [RC-21 API Contract](./rc-21-api-contract.md)

**Why required:** Architecture Spec v2.0 defines Reporting (§5.14) and AI Analyst (§5.15) as first-class modules with distinct responsibilities and authority classes. This contract locks entities so Epics cannot invent a second ledger or decision engine under “reporting.”

---

## 1. Purpose

Lock the **canonical domain model** for Reporting & AI Analytics before Epics implement ports or storage.

This contract answers:

- What report entities exist?
- What is a projection vs a narrative?
- How do historical windows and mode labels work?
- What must never be owned by Reporting or AI?

---

## 2. Ownership boundaries

| Entity / fact                    | Owner                               | Authority class       |
| -------------------------------- | ----------------------------------- | --------------------- |
| Analytical warehouse facts       | Knowledge Lake                      | **Projection**        |
| Certified strategy membership    | Strategy Library                    | **SoT**               |
| Runtime Enforcement decisions    | Runtime Enforcement                 | **Gate** (unchanged)  |
| Session lifecycle                | Trading Session                     | **SoT**               |
| Cash / fees / realized PnL       | Ledger                              | **SoT**               |
| Fill facts                       | Execution → Fill records            | **SoT**               |
| **ReportDefinition**             | **Reporting**                       | **Projection config** |
| **ReportRun**                    | **Reporting**                       | **Projection**        |
| **AggregationSlice**             | **Reporting**                       | **Projection**        |
| **HistoricalWindow**             | **Reporting** (parameter object)    | Non-SoT               |
| **AnalyticalNarrative**          | **AI Analytics**                    | **Narrative**         |
| Optional report-run Lake markers | Knowledge Lake (category Reporting) | **Projection**        |

**Hard rules:**

1. Reporting never overrides Ledger, Fills, Orders, Session, Library, or Enforcement.
2. AI never becomes unique financial truth or lifecycle authority.
3. Knowledge Lake remains append-only projection warehouse — Reporting does not redesign it.
4. Strategy Library remains certification/eligibility SoT — Reporting may cite, never certify.
5. Paper vs live must be labeled on money-adjacent aggregations.

---

## 3. Aggregate overview

```text
ReportDefinition
  └── ReportRun (materialized over HistoricalWindow)
        ├── AggregationSlice[]   (projection)
        └── AnalyticalNarrative[] (optional; narrative cites run/slices/lake)
```

Logical root for historical retrieval: **ReportRun** via `reportRunId`.  
Narratives are side-car explanations — never required for report validity.

---

## 4. ReportDefinition

Template describing what a report aggregates and how it is labeled.

| Field                | Required | Meaning                                                       |
| -------------------- | -------- | ------------------------------------------------------------- |
| `reportDefinitionId` | Yes      | Stable identity                                               |
| `workspaceId`        | Yes      | Tenancy                                                       |
| `name`               | Yes      | Human label                                                   |
| `description`        | No       | Human narrative                                               |
| `kind`               | Yes      | `ops_daily` \| `ops_weekly` \| `research_summary` \| `custom` |
| `defaultModes`       | Yes      | Non-empty mode set                                            |
| `metricKeys[]`       | Yes      | Ordered list of allowed aggregation keys (closed per epic)    |
| `compareEnabled`     | No       | Whether comparison slices are supported                       |
| `authorityClass`     | Yes      | Always `projection` (definition is not financial SoT)         |
| `createdAt`          | Yes      | Creation time                                                 |
| `updatedAt`          | No       | Definition metadata only — does not rewrite past runs         |

**Notes:**

- Changing a definition does **not** mutate historical ReportRuns (runs freeze definition snapshot).
- `metricKeys` must not include ad-hoc “recomputed ledger balance” keys.

---

## 5. HistoricalWindow

Time bounds for a run. Parameter object — not a SoT entity.

| Field      | Required | Meaning                                     |
| ---------- | -------- | ------------------------------------------- |
| `preset`   | No*      | `daily` \| `weekly` \| `custom`             |
| `from`     | Yes*     | Inclusive lower bound (instant)             |
| `to`       | Yes*     | Exclusive upper bound (instant)             |
| `timezone` | No       | Display/bucket timezone (non-authoritative) |

\* `custom` requires explicit `from`/`to`. Presets resolve to concrete `from`/`to` at run time and are snapshotted on the run.

**Rules:**

1. `from < to` required.
2. Window selection never authorizes trading.
3. Empty windows yield `empty` runs, not errors-by-default.

---

## 6. ReportRun

Immutable materialization of a definition over a window.

| Field                | Required | Meaning                                                |
| -------------------- | -------- | ------------------------------------------------------ |
| `reportRunId`        | Yes      | Stable identity                                        |
| `workspaceId`        | Yes      | Tenancy                                                |
| `reportDefinitionId` | Yes      | Origin definition                                      |
| `definitionSnapshot` | Yes      | Frozen definition fields used for this run             |
| `window`             | Yes      | Resolved HistoricalWindow                              |
| `modes`              | Yes      | Modes requested                                        |
| `exchangeScopeId`    | No       | Scope filter snapshot                                  |
| `tradingSessionId`   | No       | Session filter snapshot                                |
| `libraryEntryId`     | No       | Optional Library context snapshot                      |
| `status`             | Yes      | `completed` \| `empty` \| `rejected`                   |
| `authorityClass`     | Yes      | Always `projection`                                    |
| `sourceSummary`      | Yes      | Counts/refs of Lake/history inputs (non-authoritative) |
| `createdAt`          | Yes      | Materialization time                                   |
| `rejectionReasons[]` | No       | Present when `rejected`                                |

**Immutability:** After `completed` / `empty` / `rejected`, a run is immutable. Corrections = new run.

---

## 7. AggregationSlice

One summarized/compared view inside a run.

| Field               | Required | Meaning                                                           |
| ------------------- | -------- | ----------------------------------------------------------------- |
| `sliceId`           | Yes      | Stable within run                                                 |
| `reportRunId`       | Yes      | Parent run                                                        |
| `metricKey`         | Yes      | From definition allowlist                                         |
| `mode`              | Yes*     | Required when metric is money-adjacent                            |
| `label`             | Yes      | Human label                                                       |
| `value`             | No       | Scalar / structured summary payload (JSON-serializable logical)   |
| `comparison`        | No       | Optional delta vs prior window / baseline (projection only)       |
| `sourceRefs[]`      | Yes      | Lake event ids / history refs / Library refs supporting the slice |
| `authorityClass`    | Yes      | Always `projection`                                               |
| `visualizationHint` | No       | Non-authoritative hint (`timeseries` \| `table` \| `kpi` \| …)    |

\* Money-adjacent metrics (PnL, fees, balances, exposure displays) **must** carry `mode`. Missing mode ⇒ run `rejected` or slice omitted per service policy — never unlabeled money claims.

**Forbidden slice contents:**

- Recalculated authoritative ledger balances via ad-hoc formulas that disagree with Ledger SoT
- “Approved to trade” / eligibility decisions
- Enforcement PASS used as authorization substitute without Session/Deployment SoT

---

## 8. AnalyticalNarrative

AI-produced explanation bound to report/lake sources.

| Field            | Required | Meaning                                             |
| ---------------- | -------- | --------------------------------------------------- |
| `narrativeId`    | Yes      | Stable identity                                     |
| `workspaceId`    | Yes      | Tenancy                                             |
| `reportRunId`    | No*      | Primary report context when present                 |
| `kind`           | Yes      | `explain` \| `summarize` \| `trends` \| `narrative` |
| `text`           | Yes      | Human-readable content                              |
| `sourceRefs[]`   | Yes      | Non-empty citations                                 |
| `modesCovered[]` | Yes      | Modes observed in sources                           |
| `authorityClass` | Yes      | Always `narrative`                                  |
| `disclaimer`     | Yes      | Non-authoritative; SoT wins on conflict             |
| `modelMeta`      | No       | Provider / template / model metadata                |
| `createdAt`      | Yes      | Creation time                                       |

\* If `reportRunId` absent, `sourceRefs` must still cite Lake/history facts.

**Hard rules:**

1. Narrative never mutates business state.
2. Narrative never silently changes configuration.
3. Tactic suggestions are research hypotheses only — not runtime instructions.
4. Empty `sourceRefs` is invalid.

---

## 9. Mode labeling

| Mode       | Meaning                                    |
| ---------- | ------------------------------------------ |
| `paper`    | Paper Trading path / paper projections     |
| `live`     | Live capital path (future) projections     |
| `research` | Research Lab / validation analytical facts |
| `system`   | Ops/system markers                         |

Authority Matrix rule: Reporting may aggregate Lake or projections but **must label paper vs live** and must not recompute authoritative ledger balances with ad-hoc math.

---

## 10. Allowed operations (domain verbs)

| Verb                  | Reporting  | AI       |
| --------------------- | ---------- | -------- |
| Aggregate             | Yes        | No       |
| Summarize             | Yes        | Yes      |
| Compare               | Yes        | Describe |
| Visualize             | Yes (hint) | No       |
| Explain               | Limited    | Yes      |
| Identify trends       | Support    | Yes      |
| Generate narrative    | Support    | Yes      |
| Authorize             | **No**     | **No**   |
| Trade                 | **No**     | **No**   |
| Validate strategies   | **No**     | **No**   |
| Modify business state | **No**     | **No**   |

---

## 11. Explicit non-entities (RC-24)

| Non-entity                      | Why forbidden                      |
| ------------------------------- | ---------------------------------- |
| ReportingLedger / ShadowBalance | Dual finance authority             |
| AIDecision / AutoTradePlan      | AI capital control                 |
| ReportAsEligibilityGate         | Replaces Library / Enforcement     |
| BotReportAggregate (Bot SoT)    | Alias Dictionary — use Session ids |
| MarketStateFromReport           | Selection/Market State later       |

---

## 12. Compatibility

| Rule                         | Detail                                        |
| ---------------------------- | --------------------------------------------- |
| Additive optional fields     | Allowed with amendment note                   |
| Removing required fields     | Requires domain model revision                |
| Metric key catalog evolution | Additive allowlist entries via plan amendment |
| Lake category `Reporting`    | Optional markers only; never SoT              |
| Alias Dictionary             | Report / AI Analytics ↔ this model            |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
