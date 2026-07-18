# 010 — Event Bus

Version: 1.0

Status: Approved

Document Type: Architecture Specification

RC-16 Architecture Freeze note (2026-07-18): ADR-013 is authoritative for
paper-runtime events. RC-16 uses PostgreSQL Transactional Outbox/Inbox,
durable consumer checkpoints, per-aggregate/stream ordering, retry/dead-letter,
and at-least-once delivery with idempotent effects. It does not claim global
ordering, exactly-once delivery, or require a distributed broker.

RC-16 M2 implementation note (US155): `EventProcessingModule` runtime providers
now use PostgreSQL/Prisma for Outbox, Inbox, and consumer checkpoints. A
Nest-lifecycle polling worker starts/stops the at-least-once dispatcher and
leaves rows pending while no durable consumer is registered. The legacy
process-local Event Bus remains non-authoritative activity delivery.

---

# Purpose

The Event Bus is the communication backbone of the Trading Research Platform (TRP).

It enables every subsystem to communicate through immutable events rather than direct dependencies.

No subsystem should directly call another subsystem whenever an event-based workflow is possible.

The Event Bus is the nervous system of TRP.

---

# Philosophy

Systems should communicate through events, not assumptions.

Loose coupling increases scalability, reliability, maintainability, and extensibility.

Every significant action inside TRP becomes an event.

---

# Mission

The Event Bus is responsible for:

- Event delivery
- Event routing
- Event distribution
- Event persistence
- Event replay
- Event ordering
- Event reliability

The Event Bus never contains business logic.

---

# High-Level Architecture

```
                   Market Data Platform
                           │
                           ▼
                     Event Publisher
                           │
                           ▼
                     ┌───────────┐
                     │ Event Bus │
                     └───────────┘
        ┌──────────────┼───────────────┐
        │              │               │
        ▼              ▼               ▼
  Research      Production        AI Organization
        │              │               │
        └──────────────┼───────────────┘
                       ▼
                Knowledge Base
```

Every subsystem is connected through events.

---

# Core Principles

The Event Bus follows these principles:

- Loose coupling
- Immutable events
- Publish / Subscribe
- Event replay
- Event persistence
- Independent consumers
- Horizontal scalability

---

# Event Lifecycle

```
Event Created

↓

Published

↓

Stored

↓

Distributed

↓

Consumed

↓

Archived
```

Every event follows the same lifecycle.

---

# Event Structure

Every event contains:

- Event ID
- Event Type
- Source
- Timestamp
- Version
- Payload
- Metadata

Events are immutable.

Once published, they are never modified.

---

# Event Categories

Examples include:

## Market Events

- PriceUpdated
- CandleClosed
- TradeExecuted
- OrderBookUpdated
- FundingUpdated
- OpenInterestUpdated

---

## Research Events

- ExperimentStarted
- ExperimentCompleted
- StrategyGenerated
- ValidationRequested
- ValidationCompleted

---

## Production Events

- StrategyStarted
- StrategyStopped
- PositionOpened
- PositionClosed
- OrderSubmitted
- OrderFilled
- TradeCompleted

---

## AI Events

- AnalysisRequested
- AnalysisCompleted
- RecommendationGenerated
- SummaryCreated

---

## Knowledge Events

- KnowledgeCreated
- KnowledgeUpdated
- KnowledgeLinked

---

## System Events

- UserLoggedIn
- ConfigurationChanged
- DeploymentCompleted
- HealthCheckFailed
- IncidentCreated

---

# Publishers

Every subsystem may publish events.

Examples:

Market Data Platform

↓

PriceUpdated

Research Laboratory

↓

ExperimentCompleted

Production System

↓

TradeCompleted

AI Organization

↓

RecommendationGenerated

Knowledge Base

↓

KnowledgeCreated

---

# Consumers

Every subsystem may subscribe to events.

Example:

PriceUpdated

↓

Research Laboratory

↓

Production

↓

AI

↓

Dashboard

↓

Monitoring

↓

Knowledge Base

One event may have many consumers.

---

# Event Replay

Every event can be replayed.

Replay supports:

- Research
- Debugging
- Validation
- Recovery
- Simulation

Replay guarantees deterministic behavior.

---

# Event Persistence

Events are stored permanently.

Reasons:

- Audit trail
- Historical analysis
- Debugging
- AI learning
- Regulatory requirements

Nothing important is lost.

---

# Event Ordering

Events preserve chronological order.

Ordering guarantees:

- Reproducibility
- Consistent simulations
- Accurate validation
- Reliable production

---

# Idempotency

Consumers must process duplicate events safely.

Receiving the same event twice must never produce incorrect results.

---

# Delivery Guarantees

The Event Bus should support:

- At least once delivery
- Ordered delivery
- Retry mechanisms
- Dead-letter queues
- Backpressure handling

Reliability is preferred over speed.

---

# Event Versioning

Events evolve over time.

Every event contains:

- Schema Version
- Compatibility Information

Older consumers should continue functioning whenever possible.

---

# Event Naming

Naming convention:

```
<Entity><Action>

Examples:

PriceUpdated
PositionClosed
TradeCompleted
ValidationFinished
KnowledgeCreated
```

Names should describe facts, not commands.

Correct:

TradeCompleted

Incorrect:

ExecuteTrade

---

# Monitoring

The Event Bus continuously measures:

- Event throughput
- Consumer lag
- Queue size
- Failed deliveries
- Processing latency
- Replay duration

Monitoring ensures operational health.

---

# Failure Handling

Failures include:

- Consumer offline
- Network interruption
- Queue overflow
- Invalid event
- Processing timeout

Failures should never stop the platform.

---

# Event Security

Events may contain sensitive information.

Security includes:

- Authentication
- Authorization
- Encryption
- Audit logging

Consumers only receive authorized events.

---

# Scalability

The Event Bus is horizontally scalable.

Possible implementations:

- Redis Streams
- RabbitMQ
- Kafka
- NATS
- Apache Pulsar

The architecture remains implementation-independent.

---

# Future Expansion

Future capabilities may include:

- Distributed clusters
- Cross-region replication
- Event compression
- Event snapshots
- Streaming analytics
- Event sourcing

The architecture supports future growth.

---

# Success Criteria

A successful Event Bus:

- Delivers events reliably
- Preserves ordering
- Supports replay
- Scales horizontally
- Enables loose coupling
- Stores complete history
- Connects every subsystem

---

# Relationship to Other Documents

Related specifications:

- 009-Market-Data-Platform.md
- 008-Production-System.md
- 006-Knowledge-Base.md
- 011-Storage-Architecture.md

---

# Summary

The Event Bus is the communication backbone of TRP.

Every subsystem exchanges information through immutable events rather than direct dependencies.

This architecture enables scalability, resilience, reproducibility, and long-term maintainability.

The Event Bus is the nervous system that connects every part of the Trading Research Platform.
