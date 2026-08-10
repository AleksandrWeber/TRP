# RC-21 Epic Breakdown — Knowledge Lake

**Document:** RC-21 Epic Breakdown  
**Status:** CLOSED — Epics 1–6 complete; validation PASS  
**Date:** 2026-08-10  
**Nature:** Thin Epics after approved plan/contracts.

**Parent:** [RC-21 Implementation Plan](./rc-21-implementation-plan.md)  
**API Contract:** [RC-21 API Contract](./rc-21-api-contract.md)  
**Integration:** [RC-21 Integration Diagram](./rc-21-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.13, §4, §6  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md)

---

## Release epic map

```text
Epic 1  Lake boundary + ownership invariants
  ↓
Epic 2  Ingestion port (append-only admission)
  ↓
Epic 3  Trading-path producer projections (Session / Orders / Risk / Paper / Execution facts)
  ↓
Epic 4  Research Lab producer projections
  ↓
Epic 5  Query port (consumer-safe analytical reads)
  ↓
Epic 6  Authority conformance & RC-21 acceptance
```

Each Epic is independently deliverable and reviewable. Prefer thin additive slices. No Epic may change SoT ownership.

---

## Epic 1 — Lake boundary + ownership invariants

### Objective

Establish the Knowledge Lake as a **projection warehouse boundary** with documented ownership rules — without persistence productization beyond what the approved API Contract requires for a skeleton, and without producer wiring yet.

### Dependencies

- RC-20 CLOSED
- Implementation Plan + API Contract approved (incl. §0 sequencing)
- Spec §5.13 / Authority Matrix / Alias Dictionary

### Definition of Done

- [x] Lake module/boundary exists as a distinct projection owner (not Orders/Session/Risk/Ledger).
- [x] Ownership chain documented in code/docs comments or module README: SoT → Projection → Lake.
- [x] Explicit invariants: no command ports that mutate trading/finance SoT; append-only intent declared.
- [x] Clear separation note: existing `knowledge` / Insight / Recommendation domains are **not** the Lake.
- [x] No Kafka/Redis/queue product introduced.
- [x] No Architecture Spec rewrite.

**Epic note:** [`rc-21-epic1-knowledge-lake-boundary.md`](./rc-21-epic1-knowledge-lake-boundary.md)

### Expected user value

The team has a named place for analytical memory that cannot be confused with the ledger or Command Center.

---

## Epic 2 — Ingestion port (append-only admission)

### Objective

Implement the **Knowledge Lake Ingestion Port** per [API Contract](./rc-21-api-contract.md): admit immutable analytical facts; reject mutations of admitted facts.

### Dependencies

- Epic 1
- API Contract ingestion interface freeze

### Definition of Done

- [x] `KnowledgeLakeIngestionPort` (canonical name) available to internal producers only.
- [x] Admit requires: stable event id, occurred-at, producer, category, payload envelope, paper/live mode marker where applicable.
- [x] Duplicate admission is idempotent (same event id → no second fact / no error that implies mutation).
- [x] No update/delete operations for admitted facts.
- [x] Contract tests for admission + idempotency + rejection of mutate attempts.
- [x] Still no producer fan-out required beyond a test/fixture producer.

**Epic note:** [`rc-21-epic2-ingestion-port.md`](./rc-21-epic2-ingestion-port.md)

### Expected user value

The platform can accept analytical facts safely before wiring real producers.

---

## Epic 3 — Trading-path producer projections

### Objective

Project a **thin, reviewable set** of trading-path analytical facts into the Lake from existing owners — Session, Orders, Risk, Paper, Execution/Fill lineage — without changing those owners.

### Dependencies

- Epic 2 ingestion port
- Frozen paper path (RC-16…RC-20)
- Integration Diagram trading producers

### Definition of Done

- [x] At least one analytical fact family projected from each of: Trading Session, Orders, Risk, Paper path, Execution/Fill (or documented deferral with owner sign-off for a single family if blocked — prefer all five thin).
- [x] Categories used: Trading, Risk, Paper, System as appropriate.
- [x] Projection is one-way; producers do not read Lake to decide trades.
- [x] SoT modules unchanged in ownership; Lake stores copies/references, not authoritative balances.
- [x] Tests: after a paper session lifecycle/order/risk transition, corresponding Lake facts appear; SoT remains authoritative on conflict.
- [x] No Command Center product work; no Kill Switch redesign.

**Epic note:** [`rc-21-epic3-trading-path-projections.md`](./rc-21-epic3-trading-path-projections.md)

### Expected user value

Operators and future analytics can query “what happened on the paper path” as immutable analytical history.

---

## Epic 4 — Research Lab producer projections

### Objective

Project a thin set of **Research** analytical facts from Research Lab / research pipeline outputs into the Lake — without expanding Accepted Legacy dual stacks and without rebranding Knowledge domains as Lake.

### Dependencies

- Epic 2 (can proceed after Epic 2 even if Epic 3 parallelized when contracts do not collide)
- Research Lab result/event surfaces
- Integration Diagram research producers

### Definition of Done

- [x] Research-category facts admitted for a minimal set (e.g. campaign/experiment completion or validation markers — exact families chosen at Epic start from existing surfaces).
- [x] Insight / Recommendation / KnowledgeEntry are **referenced or summarized**, not cloned into a second research SoT.
- [x] No Lab → Execution capital path introduced.
- [x] Tests: research completion yields Lake Research facts; Lab remains owner of experiments.
- [x] Dual-stack Accepted Legacy not expanded.

**Epic note:** [`rc-21-epic4-research-lab-projections.md`](./rc-21-epic4-research-lab-projections.md)

### Expected user value

Research outcomes become searchable analytical memory for later Reporting / AI — without a second research brain.

---

## Epic 5 — Query port (consumer-safe analytical reads)

### Objective

Implement the **Knowledge Lake Query Port** for non-authoritative consumers (Reporting / AI / future ML / internal tools) — filter by category, time, producer, session/scope refs — without presenting Lake as ops SoT.

### Dependencies

- Epics 2–4 (sufficient facts to query)
- API Contract query interface

### Definition of Done

- [x] `KnowledgeLakeQueryPort` supports list/get with filters: category, time range, producer, optional session/exchangeScope refs.
- [x] Responses marked/documented as analytical projections (non-authoritative).
- [x] No write methods on the query port.
- [x] Contract tests for filters and empty results.
- [x] No Reporting UI, AI panel, or Command Center Lake explorer productized in this Epic (port only; optional minimal smoke harness allowed).
- [x] Alias Dictionary: no REST `/bots` resource invented; Bot references map to Trading Session ids if exposed.

**Epic note:** [`rc-21-epic5-query-port.md`](./rc-21-epic5-query-port.md)

### Expected user value

Downstream Reporting/AI can depend on a stable read contract without waiting for their own RCs’ UI.

---

## Epic 6 — Authority conformance & RC-21 acceptance

### Objective

Prove Knowledge Lake did not become Ledger, Orders, Session, Risk, or Execution — and close RC-21 against the Implementation Plan.

### Dependencies

- Epics 1–5 Done
- [RC-21 Implementation Plan §10](./rc-21-implementation-plan.md)

### Definition of Done

- [x] Conformance checklist signed: Lake = Projection only.
- [x] Negative tests/evidence: cannot mutate Orders, Ledger, Positions, Session lifecycle, Risk decisions, or Execution submits via Lake ports.
- [x] Conflict rule evidenced: SoT wins over Lake on money/order disputes.
- [x] Append-only evidenced: no update/delete of admitted facts.
- [x] Non-goals register: Reporting/AI, IDE, Library, ML, Kafka/queues deferred with targets.
- [x] Living roadmap / project-status updated for approved Lake-as-RC-21 sequencing (and IDE deferral).
- [x] RC-21 Closure Report drafted with Architecture Impact.
- [x] All Implementation Plan acceptance criteria checked.
- [x] Engineering Workflow validation gates runnable for the RC (typecheck/lint/test/build/smoke as applicable).

**Epic note:** [`rc-21-epic6-authority-conformance.md`](./rc-21-epic6-authority-conformance.md)  
**Audit:** [`rc-21-knowledge-lake-audit.md`](./rc-21-knowledge-lake-audit.md)  
**Closure draft:** [`rc-21-closure-report.md`](./rc-21-closure-report.md)

### Expected user value

The team can claim an analytical Knowledge Lake foundation without lying about authority.

---

## Cross-epic constraints

| Constraint                                    | Applies |
| --------------------------------------------- | ------- |
| No architecture redesign / Spec rewrite       | All     |
| No SoT ownership changes                      | All     |
| Append-only; no Lake → SoT feedback           | All     |
| No Kafka / Redis / queue products             | All     |
| No event-sourcing redesign                    | All     |
| No Reporting / AI product surfaces            | All     |
| No IDE shell / Bot fleet UX                   | All     |
| No Strategy Library work under RC-21          | All     |
| Do not rebrand Knowledge domains as Lake      | All     |
| Canonical API/module names (Alias Dictionary) | All     |

---

## Suggested story band

Story IDs are **not** assigned here. After plan approval, allocate from [`story-id-allocation.md`](./story-id-allocation.md) in a separate drafting task.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
