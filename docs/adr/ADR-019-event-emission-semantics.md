# ADR-019 — Event Emission Semantics

Status: Accepted

Date: 2026-07-20

Scope: Research Execution Framework

---

## Title

Application Events are Infrastructure Notifications

---

## Context

The Research Execution Framework emits application events during execution.

Examples:

- SmokeBacktestCompleted
- HistoricalReplayCompleted
- WalkForwardCompleted
- MultiYearResearchCompleted
- DeterministicValidationCompleted

An event emitter may fail due to infrastructure reasons:

- event bus unavailable
- listener failure
- serialization failure
- transport failure
- logging failure

The architecture must define whether event emission is part of business execution
or infrastructure notification.

---

## Decision

The Research Execution Framework adopts **Contract B**.

Application events are infrastructure notifications.

They are NOT part of business execution.

Business execution completes independently of event delivery.

---

## Architectural Contract

Execution consists of:

1. Execute business logic.
2. Produce immutable ExecutionResult.
3. Close TradingSession.
4. Commit internal state.
5. Attempt to emit application events.

Only steps 1–4 define execution success.

Step 5 is best-effort notification.

---

## Required Behavior

If:

- PaperTradingRunner completed successfully
- ExecutionResult has been created
- TradingSession has been closed correctly
- all business state is consistent

and

event emission throws an exception,

then:

ExecutionStatus SHALL remain:

COMPLETED

ExecutionResult SHALL remain unchanged.

Business state SHALL remain unchanged.

The event emission failure SHALL be recorded.

Execution SHALL NOT be converted into FAILED.

---

## Failure Handling

Event emission failures are infrastructure failures.

They do not invalidate business execution.

The framework SHALL:

- capture the emitter exception
- record the failure
- expose diagnostic information
- continue normal execution completion

---

## Prohibited Behavior

The framework SHALL NOT:

- roll back completed execution
- reopen TradingSession
- modify ExecutionResult
- modify execution metrics
- change COMPLETED to FAILED
- lose deterministic behavior

---

## Recovery

Future retries of event delivery MAY be implemented.

Retry mechanisms SHALL NOT execute business logic again.

Only notification delivery may be retried.

---

## Consistency

All execution services SHALL implement the same semantics.

Including:

- SmokeBacktestService
- HistoricalReplayService
- WalkForwardValidationService
- MultiYearResearchService
- DeterministicReplayValidationService

No service may implement different event semantics.

---

## Chaos Testing

Chaos Testing SHALL verify:

- emitter exception injected
- business execution completes
- ExecutionResult unchanged
- TradingSession closed
- cleanup completed
- diagnostic information recorded

---

## Regression Testing

Regression Suite SHALL verify that EventEmissionFailure never changes business
execution semantics.

---

## Deterministic Replay Validation

Repeated EventEmissionFailure executions SHALL produce identical execution results.

Only infrastructure diagnostics may differ.

ExecutionResult SHALL remain identical.

---

## Performance Benchmark

Event emission failures SHALL NOT affect benchmark correctness.

Benchmark metrics remain valid.

---

## Future Compatibility

This decision remains valid if future implementations introduce:

- Kafka
- RabbitMQ
- Redis Streams
- NATS
- EventStore
- Webhooks
- SSE
- WebSocket notifications

Notification infrastructure remains independent from business execution.

---

## Consequences

The Research Execution Framework maintains strict separation between:

**Business Execution**

and

**Infrastructure Notification**.

Business correctness is never coupled to notification delivery.

Execution remains deterministic, reproducible, and resilient even when
notification infrastructure fails.

See also: [`040-EventEmissionFailure-Semantics.md`](../Architecture/040-EventEmissionFailure-Semantics.md)
