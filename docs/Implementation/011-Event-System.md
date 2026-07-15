# 011 — Event System

Version: 1.0

Status: Approved

Document Type: Sprint Specification

---

# Purpose

This document defines the internal Event System for the Trading Research Platform (TRP).

The Event System allows different modules to react to important business events without creating direct dependencies between services.

Version 1 implements a lightweight in-process event mechanism.

---

# Business Value

Events reduce coupling between modules.

Instead of calling multiple services directly, a module publishes an event.

Interested modules decide independently whether they need to react.

This improves maintainability and simplifies future expansion.

---

# Goal

After completing this sprint:

- Internal Event Bus exists.
- Domain Events can be published.
- Event Handlers can subscribe.
- Multiple handlers can process the same event.
- Events are logged.

No external message broker is used.

---

# Out of Scope

This sprint does NOT implement:

- Kafka
- RabbitMQ
- NATS
- Redis Pub/Sub
- Event replay
- Event sourcing
- Distributed events
- Retry queues
- Dead Letter Queue

These capabilities are intentionally postponed.

---

# Architecture References

- 012-Service-Architecture.md
- 013-Workflow-Engine.md
- 015-Security.md

---

# Responsibilities

The Event System is responsible for:

- Publishing events
- Delivering events
- Registering handlers
- Logging event execution

The Event System is NOT responsible for:

- Workflow orchestration
- Business logic
- Persistence
- Scheduling

---

# Core Concepts

The Event System consists of:

Event

↓

Publisher

↓

Event Bus

↓

Handlers

---

# Domain Event

A Domain Event represents something that has already happened.

Examples:

WorkflowStarted

WorkflowCompleted

WorkflowFailed

ResearchCompleted

ValidationCompleted

KnowledgeStored

ProductionStarted

ProductionCompleted

---

# Event Structure

Every event contains:

- Event ID
- Event Type
- Timestamp
- Payload
- Correlation ID

Event payload should remain minimal.

---

# Event Publisher

Any service may publish an event.

Publishing an event never contains business logic.

---

# Event Bus

The Event Bus distributes events to registered handlers.

Version 1 uses synchronous, in-process delivery.

---

# Event Handlers

Handlers subscribe to specific event types.

One event may have multiple handlers.

Handlers remain independent from each other.

---

# Execution Flow

```
Workflow

↓

Publish Event

↓

Event Bus

↓

Handler A

↓

Handler B

↓

Handler C
```

---

# Folder Structure

```
modules/

events/

bus/

events/

handlers/

interfaces/

publisher/

registry/
```

---

# Naming Convention

Events use the past tense.

Correct:

WorkflowStarted

ResearchCompleted

ValidationFailed

Incorrect:

StartWorkflow

RunResearch

ExecuteValidation

Events describe completed actions.

---

# Event Registration

Handlers register during application startup.

Registration is automatic.

Manual registration should not be required.

---

# Event Processing

Version 1 processes events synchronously.

Each handler executes in registration order.

Parallel processing is postponed.

---

# Failure Handling

If a handler fails:

- The failure is logged.
- Event processing stops.
- The exception propagates to the caller.

Automatic retries are not implemented.

---

# Correlation ID

Every published event carries the workflow/request correlation ID.

This allows complete tracing through logs.

---

# Logging

Log:

- Event published
- Event received
- Event handled
- Event failed
- Execution duration

Never log sensitive information.

---

# Metrics

Collect:

- Events published
- Events processed
- Handler execution time
- Failed handlers

Metrics support future dashboards.

---

# Security

Events remain internal.

No external system may publish internal events.

---

# Testing

Verify:

- Event publishing
- Multiple handlers
- Handler execution order
- Failure propagation
- Correlation ID propagation

---

# Manual Verification Checklist

Verify:

✓ Event is published

✓ Event reaches handlers

✓ Multiple handlers execute

✓ Correlation ID is preserved

✓ Failures are logged

✓ Metrics are updated

---

# Acceptance Criteria

The Event Bus functions correctly.

Handlers receive subscribed events.

Events are logged.

Execution remains deterministic.

No external messaging infrastructure is required.

---

# Definition of Done

Completed when:

- Event Bus exists.
- Event publishing works.
- Event handlers execute correctly.
- Logging works.
- Tests pass.

---

# Common Mistakes

Avoid:

- Business logic inside Event Bus.
- Using events as remote procedure calls.
- Publishing unnecessary events.
- Large event payloads.
- Circular event chains.
- Introducing Kafka or RabbitMQ in Version 1.

---

# Next Step

012-Research-Laboratory.md

---

# Summary

The Event System provides lightweight communication between modules while preserving loose coupling.

The implementation intentionally remains simple, synchronous, and in-process, providing a solid foundation for future scalability without introducing unnecessary infrastructure into Version 1.
