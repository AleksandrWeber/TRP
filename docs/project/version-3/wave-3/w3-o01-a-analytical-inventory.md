# W3-O01-a Analytical Artifact Inventory

**Slice:** W3-O01-a — Durable Inventory Foundation
**Package:** W3-O01 Durable Analytical Stores (V3-O01 · IN-01 · TD-048)
**Wave:** 3 — Durability, Operations & Continuity
**Date:** 2026-08-26
**Nature:** Discovery and durability preparation only. Not persistence implementation. Not restart recovery.
**Machine inventory:** `apps/api/src/platform-conformance/w3-o01-a-analytical-inventory.ts`

```text
This inventory does NOT make the platform restart-safe.
This inventory does NOT introduce a new persistence owner.
This inventory does NOT introduce a new bounded context.
Customer-visible durability guarantees remain FALSE until later slices.
```

---

## Purpose

Enumerate every certified Version 2 analytical artifact that requires durable persistence across process restarts (or must be honestly labeled ephemeral). Freeze ownership and classification before W3-O01-b persistence work.

---

## Inventory

| Artifact                    | Current Owner         | Persistence Today       | Required Durability | Current Risk                                                         | Future Slice     |
| --------------------------- | --------------------- | ----------------------- | ------------------- | -------------------------------------------------------------------- | ---------------- |
| ReportDefinition            | reporting             | process-local in-memory | SURVIVE             | Definitions disappear after API restart                              | W3-O01-b         |
| ReportRun                   | reporting             | process-local in-memory | SURVIVE             | Operator report history silently lost on restart                     | W3-O01-b         |
| AggregationSlice            | reporting             | process-local in-memory | SURVIVE             | Report detail/compare empty after restart                            | W3-O01-b         |
| UserNotificationPreferences | notification-delivery | process-local in-memory | SURVIVE             | Notification settings wipe on restart                                | W3-O01-b         |
| TelegramConnection          | notification-delivery | process-local in-memory | SURVIVE             | In-product Telegram connect state lost on restart                    | W3-O01-b         |
| DeliveryResult              | notification-delivery | process-local in-memory | SURVIVE             | Delivery history empty after restart (not the durable queue)         | W3-O01-b         |
| OrchestrationPlan           | trading-orchestrator  | process-local in-memory | SURVIVE             | Plans disappear after restart                                        | W3-O01-b         |
| OrchestrationRun            | trading-orchestrator  | process-local in-memory | SURVIVE             | Runs/history wipe on restart                                         | W3-O01-b         |
| SelectionDecision           | trading-orchestrator  | process-local in-memory | SURVIVE             | Selection audit trail lost on restart                                | W3-O01-b         |
| SessionHandoffIntent        | trading-orchestrator  | process-local in-memory | SURVIVE             | Handoff intent lost (TradingSession may remain durable separately)   | W3-O01-b         |
| OrchestratorMarketStateView | trading-orchestrator  | process-local in-memory | EPHEMERAL           | Seed-only consumer buffer; not Market State SoT                      | honesty-baseline |
| AnalyticalFact              | knowledge-lake        | process-local in-memory | SURVIVE             | Projection buffer emptied; Reporting/AI consumers lose facts         | W3-O01-b         |
| AnalyticalNarrative         | ai-analytics          | none (derived on read)  | EPHEMERAL           | Regenerates from ReportRuns; continuity depends on ReportRun SURVIVE | honesty-baseline |
| MarketProfileVersion        | market-profile        | process-local in-memory | SURVIVE             | Profile version registry wipe on restart                             | W3-O01-b         |
| QualificationTarget         | market-qualification  | process-local in-memory | SURVIVE             | Targets disappear after restart                                      | W3-O01-b         |
| QualificationState          | market-qualification  | process-local in-memory | SURVIVE             | Lifecycle state wipe on restart                                      | W3-O01-b         |
| QualificationRun            | market-qualification  | process-local in-memory | SURVIVE             | Run history wipe on restart                                          | W3-O01-b         |
| MarketConfidenceAndHealth   | market-qualification  | process-local in-memory | SURVIVE             | Confidence/health views empty after restart                          | W3-O01-b         |
| MarketState                 | market-state          | process-local in-memory | SURVIVE             | Projection and transitions wipe on restart                           | W3-O01-b         |
| ExchangeScope               | exchange-scope        | process-local in-memory | SURVIVE             | Scope identity/history wipe on restart                               | W3-O01-b         |
| ExchangeRiskPolicy          | exchange-scope        | process-local in-memory | SURVIVE             | Policy version history lost on restart                               | W3-O01-b         |
| TradingAccountBinding       | exchange-scope        | process-local in-memory | SURVIVE             | Account bindings lost on restart                                     | W3-O01-b         |
| AdapterBindingContext       | exchange-scope        | process-local in-memory | SURVIVE             | Adapter binding context lost on restart                              | W3-O01-b         |
| StrategyVersionRecord       | strategy-library      | process-local in-memory | SURVIVE             | Certified membership SoT buffer is process-local                     | W3-O01-b         |
| CertificationAttemptRecord  | strategy-library      | process-local in-memory | SURVIVE             | Certification history wipe on restart                                | W3-O01-b         |
| RuntimeValidationRecord     | runtime-enforcement   | process-local in-memory | SURVIVE             | Gate decision history wipe on restart                                | W3-O01-b         |

**Rule:** Each artifact belongs to exactly one existing owner.

---

## Ownership verification

| Owner                 | Verified role                                             | Persistence owner change |
| --------------------- | --------------------------------------------------------- | ------------------------ |
| reporting             | Report definitions, runs, aggregations                    | **None**                 |
| notification-delivery | Preferences, Telegram connect state, delivery history     | **None**                 |
| trading-orchestrator  | Plans, runs, selections, handoffs, seed market-state view | **None**                 |
| knowledge-lake        | Analytical fact projection warehouse                      | **None** (projection)    |
| ai-analytics          | Analytical narratives (derived)                           | **None**                 |
| market-profile        | Market profile versions                                   | **None**                 |
| market-qualification  | Targets, states, runs, confidence/health                  | **None**                 |
| market-state          | Market state projection                                   | **None**                 |
| exchange-scope        | Scopes, policies, bindings, adapter context               | **None**                 |
| strategy-library      | Strategy/version/certification membership                 | **None**                 |
| runtime-enforcement   | Runtime validation history                                | **None**                 |

---

## Durability & restart survivability classification

| Class         | Meaning                                                       | Count (this freeze) |
| ------------- | ------------------------------------------------------------- | ------------------- |
| **SURVIVE**   | Operator-relied; must survive API restart in later W3-O01-b/c | Majority (default)  |
| **EPHEMERAL** | Honest non-survival: seed buffer or derived-on-read narrative | 2                   |

**Today:** All process-local SURVIVE rows **do not survive** restart. Platform is **not** restart-safe.

---

## Existing persistence verification (contrast — not inventory)

Already durable (outside TD-048 analytical residual):

- Identity / Authentication sessions
- Workspace membership
- TradingSession / paper session rows
- Outbox / Inbox (event-processing) — consumed, not redesigned
- Security Audit store
- Wave 2 ConnectionRecord metadata

---

## Gap identification

| Gap                                      | Status after W3-O01-a                        |
| ---------------------------------------- | -------------------------------------------- |
| Exact process-local analytical inventory | **Closed** (this document + machine catalog) |
| Ownership freeze                         | **Closed**                                   |
| Survive vs ephemeral classification      | **Closed** (honesty baseline)                |
| Persistence on existing owners           | **Open** → W3-O01-b                          |
| Restart-survival proof                   | **Open** → W3-O01-c                          |
| Security/Close evidence for package      | **Open** → W3-O01-d                          |
| Notification durable delivery queue      | **Out** → W3-O02                             |

---

## Explicit OUT (do not expand without Product Owner)

- Notification durable queue (W3-O02)
- Kill Switch product (W3-O04)
- Monitoring / health (W3-O05)
- Outbox / Inbox / Event Store / Projection Store / Ledger redesign
- Second Knowledge Lake / second Outbox
- Research Lab InMemory stores (TD-001-class — outside certified V2 analytical `persistence: false` set)
- Live Trading
- Any new persistence owner or bounded context

---

## Honesty baseline (binding for UI / product language)

Until W3-O01-b/c Close evidence exists, no operator surface may imply:

- restart-safe
- persistent (as a delivered durability guarantee)
- recoverable (as Wave 3 recovery)
- durable (as completed analytical durability)

This slice delivers foundation inventory only.

---

**STOP.** Wait for Product Owner review before W3-O01-b.
