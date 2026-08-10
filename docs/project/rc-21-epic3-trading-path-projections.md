# RC-21 Epic 3 — Trading Path Producer Projections

**Status:** Implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** One-way analytical projections from frozen trading-path SoT owners  
**Parent:** [RC-21 Implementation Plan](./rc-21-implementation-plan.md) · [Epic Breakdown](./rc-21-epic-breakdown.md) · [API Contract](./rc-21-api-contract.md) · [Integration Diagram](./rc-21-integration-diagram.md)  
**Predecessor:** [Epic 2 — Ingestion Port](./rc-21-epic2-ingestion-port.md)

---

## Implementation Report

### What shipped

- Thin projection adapters (inside Knowledge Lake only):
  - `TradingSessionLakeProjectionAdapter`
  - `OrdersLakeProjectionAdapter`
  - `RiskLakeProjectionAdapter`
  - `PaperTradingLakeProjectionAdapter`
  - `ExecutionFillLakeProjectionAdapter`
- `KnowledgeLakeTradingPathOutboxConsumer` — registers on existing `OutboxDispatcher`; fans envelopes into adapters
- Pure mapper `projectTradingPathEnvelope` — copies existing durable envelopes; invents no business events
- `bestEffortAdmit` — Lake failures never throw into outbox delivery (ADR-019 spirit)
- Producer registry (documentation + routing): `KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS`
- Boundary `activePorts.producers = true` (query / persistence still false)
- Categories used: **Trading**, **Risk**, **Paper**, **System** only

### Modules touched

| Path                                                                    | Change                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------- |
| `apps/api/src/modules/knowledge-lake/projections/**`                    | **New** adapters, mapper, consumer, registry      |
| `apps/api/src/modules/knowledge-lake/knowledge-lake.module.ts`          | Import `EventProcessingModule`; register adapters |
| `apps/api/src/modules/knowledge-lake/domain/knowledge-lake-boundary.ts` | `producers: true`                                 |
| `apps/api/src/modules/knowledge-lake/index.ts` / `README.md`            | Exports + Epic 3 docs                             |

### SoT modules

**Untouched.** No imports of Knowledge Lake into Trading Session, Orders, Risk, Paper Account, or Execution Engine.

### Ports / APIs affected

| Surface                                            | Detail                                    |
| -------------------------------------------------- | ----------------------------------------- |
| `KnowledgeLakeIngestionPort`                       | Consumed by adapters (unchanged contract) |
| Outbox consumer `rc21-knowledge-lake-trading-path` | **New** — read-only of envelopes          |
| HTTP / Query / Persistence                         | **None**                                  |

### Explicit out of scope (confirmed absent)

- Query port / Reporting / AI / Strategy Library
- Durable Lake persistence / schema
- Kafka / queues / Lake-owned retries
- Transaction redesign / event sourcing
- Feedback into SoT command ports
- Dual-stack US207/US208 engines (frozen paper path only)

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Producer → Lake arrows already on Integration Diagram; this epic implements thin outbox projections)

Canonical ownership changed:
None

New runtime:
None
(Reuses existing OutboxDispatcher; no Kafka/queue/runtime duplication)

Backward compatibility:
100%

Architecture debt introduced:
None
```

Knowledge Lake remains **projection only**. Projection is **one-way**. No SoT introduced. No feedback loop.

---

## Compatibility Report

| Surface                                   | Result                                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Trading Session lifecycle                 | **Unchanged** — no Lake import; outbox envelopes unchanged                                    |
| Orders / Risk / Paper Account / Execution | **Unchanged** ownership and business logic                                                    |
| Outbox delivery                           | Lake consumer is best-effort (never throws); peer consumers unaffected by Lake admit failures |
| Ingestion port (Epic 2)                   | **Compatible** — adapters call `admit` only                                                   |
| Research Knowledge module                 | **Untouched** (Epic 4)                                                                        |
| Frozen paper path                         | **Compatible** — labels `mode=paper`                                                          |

---

## Tests Summary

| Suite               | File                                                | Coverage                                                                                    |
| ------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Envelope mapper     | `projections/project-trading-path-envelope.spec.ts` | All five producers; System vs Trading; skip heartbeats; registry                            |
| Projection consumer | `projections/trading-path-projections.spec.ts`      | Admit from every producer; immutable copies; unavailable Lake; no SoT↔Lake feedback imports |
| Boundary / Nest     | boundary + module specs                             | `producers: true`; consumer registered                                                      |

**Gate:** `pnpm --filter api exec vitest run src/modules/knowledge-lake` → **33/33 PASS**

---

## Documentation Update Summary

| Document                                              | Update                                           |
| ----------------------------------------------------- | ------------------------------------------------ |
| This file                                             | Epic 3 implementation report                     |
| [Integration Diagram](./rc-21-integration-diagram.md) | Implementation status for trading-path producers |
| [Epic Breakdown](./rc-21-epic-breakdown.md)           | Epic 3 DoD checked                               |
| `docs/README.md`                                      | Index Epic 3 note                                |
| Module README                                         | Producer table + registry pointer                |

---

## Producer Registry (documentation)

| Producer id        | Owning module      | Categories      | Thin outbox events                                       |
| ------------------ | ------------------ | --------------- | -------------------------------------------------------- |
| `trading-session`  | `trading-session`  | Trading, System | Created/Started/Paused/Resumed/Stopped/Recovering/Failed |
| `orders`           | `orders`           | Trading         | Proposed → filled/cancelled family                       |
| `risk-engine`      | `risk`             | Risk            | RiskDecisionApproved / Rejected                          |
| `paper-trading`    | `paper-account`    | Paper           | PaperAccountCreated / Activated                          |
| `execution-engine` | `execution-engine` | Trading         | OrderFillRecorded                                        |

Code: `apps/api/src/modules/knowledge-lake/projections/trading-path-producer-registry.ts`

---

## Epic 3 Definition of Done

- [x] Analytical fact family from each of: Trading Session, Orders, Risk, Paper path, Execution/Fill.
- [x] Categories: Trading, Risk, Paper, System only.
- [x] Projection one-way; producers do not read Lake.
- [x] SoT ownership unchanged; Lake stores copies/refs only.
- [x] Tests: facts admitted with producer identity; immutable copies; Lake unavailable does not break projection handler; SoT modules remain Lake-free.
- [x] No Command Center / Kill Switch redesign.

**STOP:** Epic 3 complete for review. Do not start Epic 4 until approved.
