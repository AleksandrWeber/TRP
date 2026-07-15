# 019 — MVP Checklist

Version: 1.1

Status: Approved

Document Type: Release Readiness Checklist

Source of truth: [`../CANONICAL.md`](../CANONICAL.md)

---

# Purpose

This document defines the release readiness criteria for Version 1 of the Trading Research Platform (TRP).

Its purpose is to verify that the complete platform functions as an integrated system within **canonical MVP limits**.

Completion of every previous sprint does not automatically mean the MVP is ready.

The MVP is considered complete only when the entire end-to-end workflow operates successfully.

---

# MVP Goal

Version 1 must demonstrate that TRP can:

- research a strategy
- validate the results
- store validated knowledge
- execute an approved strategy
- present the complete workflow to the user

Profitability is not required.

System integrity is.

---

# Architecture Verification

Verify:

✓ Workflow Engine

✓ Event System

✓ Research Laboratory

✓ Validation Engine

✓ Knowledge Base

✓ Production System

✓ AI Integration

✓ Dashboard

All modules are integrated.

---

# End-to-End Scenario

The following scenario must complete successfully.

```
Create Research

↓

Run Research

↓

Generate Research Report

↓

Validate Research

↓

Generate Validation Report

↓

Store Knowledge

↓

Approve Strategy

↓

Start Production

↓

Generate Signals

↓

Submit Order

↓

Record Execution

↓

Display Results
```

Every step must complete successfully.

---

# Workflow Verification

Verify:

✓ Workflow starts.

✓ Workflow completes.

✓ Workflow history is stored.

✓ Workflow status updates correctly.

---

# Research Verification

Verify:

✓ Historical data loads.

✓ Indicators calculate.

✓ Reports generate.

✓ Events publish.

---

# Validation Verification

Verify:

✓ Rules execute.

✓ Reports generate.

✓ Passed works.

✓ Needs Review works.

✓ Rejected works.

---

# Knowledge Base Verification

Verify:

✓ Knowledge stores.

✓ Search works.

✓ Versioning works.

✓ Tags work.

✓ Categories work.

---

# Production Verification

Verify:

✓ Strategy loads.

✓ Market data arrives.

✓ Signals generate.

✓ Exchange Adapter executes.

✓ Execution history stores.

---

# AI Verification

Verify:

✓ AI Gateway works.

✓ Prompt templates load.

✓ AI responses parse.

✓ AI summaries generate.

---

# Dashboard Verification

Verify:

✓ Navigation works.

✓ Workflow monitor updates.

✓ Reports display.

✓ Knowledge search works.

✓ Production status updates.

---

# API Verification

Verify:

✓ Authentication works.

✓ REST endpoints respond.

✓ Validation executes.

✓ Error responses are standardized.

---

# Database Verification

Verify:

✓ Migrations execute.

✓ Prisma works.

✓ Data persists.

✓ Queries succeed.

---

# Logging Verification

Verify:

✓ Workflow logs.

✓ Research logs.

✓ Validation logs.

✓ Production logs.

✓ AI logs.

Errors are traceable.

---

# Security Verification

Verify:

✓ JWT authentication.

✓ Authorization.

✓ Secrets stored in environment variables.

✓ Sensitive data not logged.

---

# Performance Verification

Version 1 targets:

- Startup < 10 seconds
- API response < 500 ms (excluding AI calls)
- Workflow startup < 2 seconds
- Dashboard initial load < 3 seconds

These are targets, not hard requirements.

---

# Code Quality

Verify:

✓ TypeScript strict mode

✓ ESLint passes

✓ Prettier passes

✓ Build succeeds

✓ Tests pass

No TypeScript errors.

---

# Documentation

Verify:

✓ README updated

✓ Environment documented

✓ Setup documented

✓ Architecture documented

---

# Manual Acceptance Test

A user should be able to:

1. Start the platform.
2. Log in.
3. Create research.
4. Review the generated report.
5. Validate the strategy.
6. Approve a "Needs Review" result (if applicable).
7. Store the validated strategy.
8. Start production.
9. Observe generated signals.
10. View execution history in the Dashboard.

No manual database changes should be required.

---

# Definition of MVP

TRP Version 1 is complete when:

- Every sprint is completed.
- The end-to-end workflow succeeds.
- Manual acceptance testing passes.
- Documentation is complete.
- No critical defects remain.

Profitability is explicitly outside the scope of MVP acceptance.

---

# Known Limitations

Version 1 intentionally supports:

- one user
- one exchange (Binance)
- one strategy
- one symbol
- one timeframe
- synchronous workflows
- synchronous events

These limitations are accepted.

---

# Future Versions

See [`../future/`](../future/) and [`../CANONICAL.md`](../CANONICAL.md).

Intentionally excluded from Version 1:

- Multiple exchanges
- Multiple strategies / Strategy Selector
- Market State Engine
- AI Scientist / multi-agent org
- RAG / vector search
- Portfolio management
- Plugin marketplace
- SHIELD
- Kubernetes / GraphQL

---

# Release Decision

The MVP is approved for release only if every required verification item passes successfully.

---

# Final Summary

Version 1 demonstrates that the Trading Research Platform architecture is correct for a thin TypeScript research → validation → production path.

Canonical constraints (one user, Binance, one symbol/strategy/timeframe, OpenRouter gateway) are accepted intentional limits.
