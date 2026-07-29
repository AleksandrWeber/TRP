# US222 — Canonical Risk + Execution Path for Strategy Orders

Status: Implemented  
Milestone: RC-16 M3 / Epic E16  
Scope: Advance strategy-origin (and manual) proposed Orders through the
existing Risk Decision and Execution Engine path. No new adapters, no
Runtime evaluation changes, no parallel execution pipeline.

## Architecture

```text
PROPOSED Order (US221 strategy | US159 manual)
        ↓
CANONICAL_ORDER_PATH_PORT.runCanonicalPath
  ├─ OrderService.transition → RISK_PENDING
  ├─ RiskDecisionService.evaluate (US165) — mandatory Decision
  ├─ APPROVED | REJECTED
  ├─ CashReservationPort.reserveCash (US162)
  ├─ RESERVED → EXECUTABLE
  └─ ExecutionEngineService.submit (US170)
         └─ existing Paper Execution Adapter (unchanged)
```

Module: `apps/api/src/modules/canonical-order-path/`.

## Ownership (ADR-012 / ADR-017 / ADR-018)

| Owner            | Owns                                      | Does not own                    |
| ---------------- | ----------------------------------------- | ------------------------------- |
| Orders           | Proposal + lifecycle transitions          | Risk policy, adapter submission |
| Risk             | Mandatory Decision                        | Order mutation, Execution       |
| Execution Engine | Sole adapter entry, Fill facts            | Strategy logic, Risk policy     |
| Canonical path   | Orchestration only (wires existing ports) | New execution semantics         |

Strategy Runtime is never imported. No reverse dependency.

## Strategy metadata preservation

Throughout the pipeline the immutable Order Intent retains:

- `origin: 'strategy'`
- `signalIntentId`
- `signalIntentHash`

Risk evaluation receives the full Intent (identity included). Execution
requests pass origin + Signal Intent references through
`PaperExecutionCommand` without affecting fill matching or adapter
determinism.

## Idempotency / duplicate execution

- Risk Decision identity dedupe (US165) unchanged
- Cash reservation idempotency key derived from Order Intent
- Execution Engine submit remains idempotent (`already_executed`)
- Duplicate `runCanonicalPath` does not create a second Fill

## Preserved boundaries

Forbidden: Strategy Runtime imports, Execution Adapter calls from the path
module, research Signal Engine / Evaluation Scheduler, parallel strategy
execution fork.

Enforced by `canonical-order-path.boundaries.spec.ts`.
