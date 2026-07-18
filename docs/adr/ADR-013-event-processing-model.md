# ADR-013 — Event Processing Model

Status: Accepted

Date: 2026-07-18

Scope: RC-16 Paper Trading Platform

---

## Context

The current Event Bus dispatches handlers synchronously in-process and writes
an activity log. Domain writes and event logging are not transactional,
handler failures are logged and swallowed, and there are no durable consumer
checkpoints, inbox records, replay semantics, or dead letters.

Paper trading must survive process failure without losing execution facts or
applying the same event twice. A distributed broker is not yet justified, but
durable event semantics are required.

---

## Decision

### PostgreSQL-first durable event model

RC-16 uses PostgreSQL as the authoritative event-delivery substrate:

- Transactional Outbox for publication.
- Consumer Inbox for deduplication.
- Durable event records.
- Consumer checkpoints.
- Retry and dead-letter state.
- In-process dispatcher initially.

Redis, BullMQ, Kafka, RabbitMQ, or another broker is not required for the
initial architecture. A broker may later transport events while preserving the
same envelope and processing guarantees.

### Transactional Outbox

When an aggregate changes state, its transaction also inserts the resulting
Outbox event.

The transaction either commits both business state and event, or neither.

The dispatcher:

- reads unpublished Outbox rows;
- delivers them to registered consumers;
- records attempts and errors;
- marks dispatch completion only after durable consumer acknowledgement;
- retries according to policy;
- moves exhausted delivery to dead-letter state.

### Inbox and idempotency

Each durable consumer records a unique pair:

`consumerId + eventId`

The Inbox record and the consumer's business-state mutation commit in the same
transaction.

Receiving an event already recorded in that Inbox is a successful no-op.

Consumer handlers must be idempotent even when the underlying transport
delivers more than once.

### Event envelope

Every durable event contains:

- `eventId`
- `eventType`
- `schemaVersion`
- `aggregateType`
- `aggregateId`
- `aggregateVersion` or stream sequence
- `workspaceId`
- `occurredAt` (domain timestamp)
- `recordedAt` (operational timestamp)
- `correlationId`
- `causationId`
- `actorId` when initiated by an operator
- immutable payload

Operational fields must not change business semantics.

### Delivery guarantee

The system guarantees at-least-once delivery with idempotent business effects.

It does not claim:

- distributed exactly-once delivery;
- a single global ordering across all events;
- zero-latency delivery.

### Event ordering

Ordering is guaranteed only within an aggregate or explicitly defined stream.

`aggregateVersion`/sequence must increase monotonically. A consumer receiving
a future sequence before a missing predecessor defers processing and records
the gap.

Cross-aggregate workflows must use explicit correlation, checkpoints, and
state machines rather than relying on wall-clock event order.

### Event versioning

Event type names describe facts, not commands.

Examples:

- `TradingSessionStarted`
- `RiskDecisionRecorded`
- `OrderAccepted`
- `OrderFilled`
- `KillSwitchActivated`

Each event has a schema version. Changes follow:

- additive backward-compatible fields within a compatible version policy; or
- a new schema version plus an upcaster/consumer migration.

Persisted event payloads are never rewritten to imitate a newer schema.

### Consumer checkpoints

Each consumer maintains durable progress per relevant stream/partition.

Checkpoints record:

- consumer identity and version;
- last applied sequence/event;
- update time;
- processing status/error when blocked.

Restart resumes from the durable checkpoint and Inbox, not from in-memory
subscriptions.

### Critical financial consumers

Applying a Fill to accounting is a critical consumer. Its transaction records:

- Inbox deduplication;
- Position transition;
- Ledger entries;
- related Outbox events.

This preserves ADR-015 invariants while retaining replayability.

### Replay

Replay uses durable events in defined stream order. Consumers that support
rebuild operate on a new projection version or cleared projection store;
replay must not duplicate live financial effects.

### Observability

Required metrics include:

- oldest unpublished Outbox age;
- delivery attempts/failures;
- consumer lag;
- blocked sequence gaps;
- Inbox duplicate count;
- dead-letter count;
- replay progress and duration.

---

## Consequences

### Advantages

- Business state cannot commit without its event.
- Duplicate delivery does not duplicate business effects.
- Recovery does not depend on process memory.
- Event history supports audit, replay, and projection rebuild.
- Infrastructure remains operationally simple.

### Constraints

- Every event-producing write must use the Outbox transaction.
- Consumers must own Inbox/checkpoint behavior.
- Global ordering assumptions are prohibited.
- Handler exceptions cannot be silently treated as successful delivery.
- Market-data high-volume retention may use a separate bounded archive policy,
  but execution, risk, session, and accounting events remain durable.

### Follow-up

A new ADR is required before changing the delivery guarantee, adopting a
distributed event broker as authoritative infrastructure, or introducing
event sourcing as the primary aggregate persistence model.
