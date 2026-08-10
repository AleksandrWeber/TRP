# RC-21 Epic 4 — Research Lab Producer Projections

**Status:** Implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** One-way analytical projections from Research Lab completion outcomes  
**Parent:** [RC-21 Implementation Plan](./rc-21-implementation-plan.md) · [Epic Breakdown](./rc-21-epic-breakdown.md) · [API Contract](./rc-21-api-contract.md) · [Integration Diagram](./rc-21-integration-diagram.md)  
**Predecessor:** [Epic 3 — Trading Path Projections](./rc-21-epic3-trading-path-projections.md)

---

## Implementation Report

### What shipped

- Thin projection adapters (inside Knowledge Lake only):
  - `CampaignCompletedLakeProjectionAdapter`
  - `ExperimentCompletedLakeProjectionAdapter`
  - `ValidationCompletedLakeProjectionAdapter`
  - `EvidenceGeneratedLakeProjectionAdapter`
- `KnowledgeLakeResearchLabProjectionService` — Lake-owned facade that fans Research analytical outcomes into adapters
- Pure mapper `projectResearchOutcome` — maps Lake-owned thin outcome markers; invents no Research business events
- Reuses `bestEffortAdmit` — Lake failures never throw into caller paths (ADR-019 spirit)
- Producer registry: `KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER`
- Categories used: **Research**, **System** only (failed campaigns → System)
- Mode: **`research`**
- Prefer **`sourceRef`** to `CampaignSession` / `Experiment` / `KnowledgeEntry` — no Insight / Recommendation / KnowledgeEntry body clones

### Modules touched

| Path                                                                    | Change                                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/api/src/modules/knowledge-lake/projections/**`                    | **New** Research outcome types, mapper, adapters, facade, registry, specs |
| `apps/api/src/modules/knowledge-lake/knowledge-lake.module.ts`          | Register Research Lab adapters + facade                                   |
| `apps/api/src/modules/knowledge-lake/domain/knowledge-lake-boundary.ts` | Epic 4 comment / active-port note                                         |
| `apps/api/src/modules/knowledge-lake/index.ts` / `README.md`            | Exports + Epic 4 docs                                                     |

### Research / SoT modules

**Untouched.** No imports of Knowledge Lake into research-campaign, experiments, knowledge, insight, or recommendation. Dual-stack Accepted Legacy not expanded. No Lab → Execution capital path.

### Ports / APIs affected

| Surface                                     | Detail                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| `KnowledgeLakeIngestionPort`                | Consumed by adapters (unchanged contract)                                       |
| `KnowledgeLakeResearchLabProjectionService` | **New** — Lake-owned projection entry (not Research SoT)                        |
| HTTP / Query / Persistence                  | **None**                                                                        |
| Research outbox                             | **None** (Research has no DurableEventEnvelope path; outcomes are thin markers) |

### Explicit out of scope (confirmed absent)

- Query port / Reporting / AI / Strategy Library
- Durable Lake persistence / schema
- Kafka / queues / Lake-owned retries
- Research workflow redesign / event sourcing
- Feedback into Research or Execution command ports
- Cloning Knowledge / Insight / Recommendation as a second SoT

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Producer → Lake Research arrow already on Integration Diagram; this epic implements thin outcome projections)

Canonical ownership changed:
None
(Research remains SoT for experiments / campaigns / knowledge)

New runtime:
None
(Lake-owned facade only; no Kafka/queue/runtime duplication)

Backward compatibility:
100%

Architecture debt introduced:
None
```

Knowledge Lake remains **projection only**. Projection is **one-way**. No SoT introduced. No feedback loop. Research ownership unchanged.

---

## Compatibility Report

| Surface                                              | Result                                                    |
| ---------------------------------------------------- | --------------------------------------------------------- |
| Research campaign / experiment / knowledge ownership | **Unchanged** — no Lake import; dual stacks not expanded  |
| Insight / Recommendation / KnowledgeEntry            | **Referenced via sourceRef** — not cloned into Lake SoT   |
| Trading-path Epic 3 projections                      | **Compatible** — unchanged outbox consumer                |
| Ingestion port (Epic 2)                              | **Compatible** — adapters call `admit` only               |
| Lab → Execution capital path                         | **Absent** — no Execution imports in Research projections |
| Frozen paper path / trading SoT                      | **Untouched**                                             |

---

## Producer Conformance Report

| Rule                              | Evidence                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| Producer id `research-lab`        | Registry + admissions                                                                      |
| Categories Research / System only | Mapper + registry; failed campaign → System                                                |
| Analytical outcomes only          | `campaign_completed`, `experiment_completed`, `validation_completed`, `evidence_generated` |
| Prefer sourceRef                  | `CampaignSession` / `Experiment` / `KnowledgeEntry`                                        |
| No Research entity duplication    | Evidence payload excludes hypothesis/insights/recommendations                              |
| Research remains authoritative    | SoT modules Lake-free; Lake stores markers only                                            |
| Lake failure isolated             | `bestEffortAdmit` + facade never throws                                                    |
| No feedback path                  | Bidirectional import absence tests                                                         |
| No Query / Reporting / AI / Kafka | Module boundary + non-goals                                                                |

Code registry: `apps/api/src/modules/knowledge-lake/projections/research-lab-producer-registry.ts`

---

## Tests Summary

| Suite             | File                                           | Coverage                                                                                                                         |
| ----------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Outcome mapper    | `projections/project-research-outcome.spec.ts` | All four kinds; System vs Research; sourceRef; no entity clone; registry                                                         |
| Projection facade | `projections/research-lab-projections.spec.ts` | Admit from Research producers; immutable copies; Research authoritative; Lake unavailable isolated; no SoT↔Lake feedback imports |
| Boundary / Nest   | module spec                                    | Research facade registered; query/persistence still false                                                                        |

**Gate:** `pnpm --filter api exec vitest run src/modules/knowledge-lake` → **44/44 PASS**

---

## Documentation Update Summary

| Document                                              | Update                                                                     |
| ----------------------------------------------------- | -------------------------------------------------------------------------- |
| This file                                             | Epic 4 implementation / architecture / compatibility / conformance reports |
| [Integration Diagram](./rc-21-integration-diagram.md) | Research Lab implementation status                                         |
| [Epic Breakdown](./rc-21-epic-breakdown.md)           | Epic 4 DoD checked                                                         |
| `docs/README.md`                                      | Index Epic 4 note                                                          |
| Module README                                         | Research producer table + registry pointer                                 |

---

## Producer Registry (documentation)

| Producer id    | Owning module                                         | Categories       | Thin outcome kinds                                               |
| -------------- | ----------------------------------------------------- | ---------------- | ---------------------------------------------------------------- |
| `research-lab` | Research Lab (campaign / experiment / knowledge refs) | Research, System | campaign / experiment / validation completed; evidence generated |

---

## Epic 4 Definition of Done

- [x] Research-category facts admitted for campaign / experiment / validation / evidence markers.
- [x] Insight / Recommendation / KnowledgeEntry referenced via `sourceRef`, not cloned.
- [x] No Lab → Execution capital path introduced.
- [x] Tests: Research outcomes yield Lake Research facts; Lab remains owner; Lake failure isolated; no feedback path.
- [x] Dual-stack Accepted Legacy not expanded.

**STOP:** Epic 4 complete for review. Do not start Epic 5 until approved.
