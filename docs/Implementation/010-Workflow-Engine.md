# 010 — Workflow Engine

Version: 1.0

Status: Approved

Document Type: Sprint Specification

---

# Purpose

This document defines the implementation of the Workflow Engine for the Trading Research Platform (TRP).

The Workflow Engine coordinates business processes across the platform.

It determines **what happens next**, **which service executes next**, and **how workflow state is tracked**.

The Workflow Engine is the orchestration layer of TRP.

---

# Business Value

Without a Workflow Engine, every service becomes responsible for coordinating other services.

This quickly leads to:

- tightly coupled services
- duplicated orchestration logic
- inconsistent execution
- difficult testing

The Workflow Engine centralizes orchestration while keeping business logic inside individual services.

---

# Goal

After completing this sprint:

- Workflow Engine exists.
- Workflow definitions are supported.
- Workflow execution works.
- Workflow state is persisted.
- Step execution is supported.
- Failure handling is implemented.
- Workflow history is recorded.

No trading logic is implemented.

---

# Out of Scope

This sprint does NOT implement:

- AI agents
- Research logic
- Validation logic
- Production trading
- Scheduling
- Retry queues
- Distributed execution

Those are implemented in later sprints.

---

# Architecture References

- 012-Service-Architecture.md
- 013-Workflow-Engine.md
- 016-API-Architecture.md
- 020-Technology-Stack.md

---

# Responsibilities

Workflow Engine is responsible for:

- workflow lifecycle
- workflow state
- workflow execution
- step sequencing
- cancellation
- completion
- failure handling

Workflow Engine is NOT responsible for:

- business decisions
- trading
- AI analysis
- persistence logic
- exchange communication

---

# Core Concepts

The Workflow Engine consists of:

Workflow

↓

Step

↓

Execution Context

↓

Result

↓

Status

---

# Workflow

A workflow is an ordered sequence of steps.

Example:

Research Workflow

↓

Validation Workflow

↓

Knowledge Base

↓

Complete

---

# Workflow Step

A workflow step performs exactly one responsibility.

Examples:

Load Project

Run Research

Validate Results

Store Report

Finish

Steps should remain small.

---

# Workflow Context

Every workflow owns a context.

Context contains:

- workflowId
- projectId
- userId
- input
- temporary data
- output

Context is passed between steps.

---

# Workflow Status

Allowed statuses:

```
Pending

Running

Completed

Failed

Cancelled
```

No additional statuses.

---

# Step Status

Each step has its own status.

```
Pending

Running

Completed

Failed

Skipped
```

---

# Workflow Lifecycle

```
Create Workflow

↓

Validate

↓

Execute Step

↓

Execute Step

↓

Execute Step

↓

Completed
```

---

# Failure Handling

If a step fails:

Workflow becomes Failed.

Execution stops.

Future retry logic is outside Version 1.

---

# Cancellation

Workflows may be cancelled.

Cancellation stops execution immediately.

Already completed steps remain completed.

---

# Persistence

Workflow state is stored.

Stored information:

- id
- type
- status
- createdAt
- updatedAt
- completedAt
- context

---

# Folder Structure

```
modules/

workflow/

controller/

service/

engine/

executor/

models/

dto/

interfaces/
```

---

# Main Components

WorkflowController

REST endpoints.

---

WorkflowService

Public API.

Starts workflows.

---

WorkflowEngine

Core orchestration.

---

WorkflowExecutor

Runs steps.

---

WorkflowRegistry

Stores available workflows.

---

WorkflowFactory

Creates workflow instances.

---

# Workflow Definition

A workflow is defined declaratively.

Example:

```
Research Workflow

↓

Step A

↓

Step B

↓

Step C

↓

Finish
```

No hardcoded execution chains.

---

# Execution Rules

Only one active step executes at a time.

Version 1 does not support parallel execution.

---

# Workflow Types

Initially supported:

Research

Validation

Production

Knowledge Import

Additional workflows may be added later.

---

# Events

Workflow Engine publishes events.

Examples:

WorkflowStarted

WorkflowCompleted

WorkflowFailed

WorkflowCancelled

Actual Event System is implemented later.

For now, event publishing may be represented by interfaces.

---

# API

Endpoints:

```
POST

/workflows
```

Create workflow.

---

```
GET

/workflows/:id
```

Get workflow status.

---

```
POST

/workflows/:id/cancel
```

Cancel workflow.

---

# Validation

Workflow definitions are validated before execution.

Invalid workflows never start.

---

# Logging

Every workflow logs:

Started

Completed

Failed

Cancelled

Execution duration

Step duration

---

# Metrics

Record:

Execution Time

Completed Steps

Failed Steps

Workflow Duration

These metrics are stored for future dashboards.

---

# Security

Only authenticated users may create workflows.

Authorization is role-based.

---

# Testing

Verify:

Workflow creation

Workflow execution

Workflow completion

Workflow failure

Workflow cancellation

Context propagation

Status transitions

---

# Manual Verification Checklist

Verify:

✓ Workflow starts

✓ Steps execute sequentially

✓ Context flows correctly

✓ Status updates correctly

✓ Failure stops execution

✓ Cancellation works

✓ History is stored

---

# Acceptance Criteria

A workflow can be created.

A workflow executes steps sequentially.

State persists.

Context is preserved.

History is available.

Failures are handled correctly.

---

# Definition of Done

Completed when:

- Workflow Engine exists.
- Workflow execution works.
- Workflow state persists.
- API endpoints function.
- Tests pass.
- Documentation is updated.

---

# Common Mistakes

Avoid:

- Business logic inside Workflow Engine.
- Direct service-to-service orchestration.
- Hardcoded execution paths.
- Parallel execution.
- Large workflow steps.
- Hidden state.

---

# Next Step

011-Event-System.md

---

# Summary

The Workflow Engine provides the orchestration backbone of TRP.

It coordinates business processes while remaining independent from business logic.

By separating orchestration from execution, the platform remains modular, testable, and ready for future expansion without introducing unnecessary complexity in Version 1.
