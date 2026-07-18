# 008 — Production System

Version: 1.0

Status: Approved

Document Type: Architecture Specification

RC-16 Architecture Freeze note (2026-07-18): for the Paper Trading Platform,
ADR-012…ADR-018 are authoritative. They freeze paper-only execution, the
single Execution Engine entry point, durable Sessions/events, decimal Ledger
accounting, mandatory Risk, module boundaries, and invariants. Broader
real-capital, multi-order-type, reporting, and knowledge-publishing concepts in
this document remain future target ideas unless included by the RC-16 plan.

RC-16 M2 implementation note (US159–US164): the canonical `orders/` module now
owns immutable manual paper Order Intents and the Order lifecycle. PostgreSQL
persists Orders and append-only lifecycle history with workspace-scoped unique
identities and same-transaction Outbox events. Cash reservation/release crosses
only the Ledger public port; cancellation is idempotent and delegates submitted
adapter work to Execution Engine. The REST adapter exposes propose/cancel and
queries, not internal Risk or Execution transitions. Fill accounting remains a
separate later story.

RC-16 M2 implementation note (US165–US171): baseline Risk evaluation persists
immutable approved/rejected decisions against exact semantic checkpoint
references, and Orders rejects executable transitions without an approved,
unexpired matching decision. The execution-adapter port is provider-neutral but
runtime binding is paper-only and credential-free; it returns immutable facts
and has no domain persistence access. Fee, slippage, precision, rounding, and
market/limit fill rules use stable versioned configuration. Matching is
deterministic (all-or-none market, cross-then-all-or-none limit; non-crossing
limits rest without a Fill). The single Execution Engine is the only adapter
entry: it re-checks Risk/reservation/checkpoint/Session eligibility, drives every
Order transition through the Orders port, and never mutates Orders or accounting
directly. Fills are append-only facts committed atomically with their Outbox
event and the lifecycle transition, so a duplicate submit cannot duplicate a
Fill and cancellation reconciliation is idempotent. Fill accounting (Ledger
postings, positions, portfolio) remains Epic E10.

---

# Purpose

The MVP Production System is responsible for safely executing validated trading strategies through a paper exchange adapter.

Unlike the Research Laboratory, which generates knowledge through experimentation, the MVP Production System simulates execution with paper capital.

Its primary objective is not maximizing profit.

Its primary objective is preserving capital while executing validated strategies reliably, safely, and transparently.

Every action must be observable, traceable, and reversible whenever possible.

---

# Philosophy

Research discovers.

Validation verifies.

Production executes.

The Production System never experiments.

Only scientifically validated strategies may enter Production.

---

# Mission

The MVP Production System transforms validated research into controlled paper execution.

Its responsibilities include:

- Executing strategies
- Applying minimal risk checks
- Simulating orders through an exchange adapter
- Recording executions

Production never creates new strategies.

Production never modifies strategy logic.

Production follows approved instructions.

---

# High-Level Architecture

```
Validated Strategy
        │
        ▼
Production Manager
        │
 ┌──────┼───────────────────────────┐
 │      │           │               │
 ▼      ▼           ▼               ▼
Risk  Portfolio   Order         Position
Manager Manager   Manager        Manager
 │
 ▼
Execution Engine
 │
 ▼
Exchange Connector
 │
 ▼
Market
```

Every module has a single responsibility.

---

# Core Components

The Production System consists of the following subsystems.

- Production Manager
- Strategy Runner
- Risk Manager
- Order Manager
- Execution Engine
- Exchange Connector
- Kill Switch

---

# Production Manager

The Production Manager coordinates the entire production environment.

Responsibilities:

- Start strategies
- Stop strategies
- Restart strategies
- Schedule execution
- Load configuration
- Coordinate services

It never makes trading decisions.

---

# Strategy Runner

The Strategy Runner executes an approved strategy.

Responsibilities:

- Receive market events
- Calculate signals
- Request trades
- Record decisions
- Generate execution logs

The Strategy Runner cannot bypass the Risk Manager.

---

# Risk Manager

The Risk Manager protects capital.

It is the highest-priority component in Production.

Responsibilities:

- Position sizing
- Maximum exposure
- Daily loss limits
- Maximum drawdown
- Stop-loss enforcement
- Capital allocation
- Emergency shutdown

Risk Manager decisions override every other subsystem.

---

## Future — Portfolio Manager

Portfolio management is deferred from the MVP.

Responsibilities:

- Allocate capital
- Balance exposure
- Monitor diversification
- Prevent over-concentration
- Manage available balance

The Portfolio Manager operates at the portfolio level rather than the individual strategy level.

---

## Future — Position Manager

Position management is deferred from the MVP.

Responsibilities:

- Open positions
- Close positions
- Update unrealized PnL
- Track exposure
- Synchronize with exchanges

It maintains the current state of every position.

---

# Order Manager

The Order Manager is responsible for the complete order lifecycle.

Responsibilities:

- Create orders
- Validate orders
- Submit orders
- Cancel orders
- Retry failed orders
- Synchronize order status

Supported order types include:

- Market
- Limit
- Stop
- Stop Limit
- Take Profit

---

# Execution Engine

The Execution Engine converts approved orders into exchange API requests.

Responsibilities:

- Order execution
- Retry logic
- Rate limiting
- Exchange synchronization
- Response validation

The Execution Engine contains no trading logic.

---

# Exchange Connector

The Exchange Connector communicates with external exchanges.

Responsibilities:

- Authentication
- REST API
- WebSocket connections
- Market data
- Account synchronization
- Order synchronization

Each exchange implements the same interface.

Examples:

- Binance
- Bybit
- OKX
- Kraken

---

# Monitoring Service

The Monitoring Service continuously observes Production.

It monitors:

- Strategy health
- Exchange connectivity
- API latency
- Execution latency
- Drawdown
- Portfolio value
- System health
- CPU
- Memory
- Disk usage

Monitoring never sleeps.

---

# Incident Manager

Unexpected events become Incidents.

Examples:

- API failure
- Exchange outage
- Lost WebSocket
- Unexpected position
- Capital mismatch
- High latency
- Excessive slippage

Every incident is recorded.

---

# Kill Switch

The Kill Switch immediately stops trading.

Possible triggers:

- Daily loss exceeded
- Maximum drawdown exceeded
- Exchange instability
- Critical infrastructure failure
- Manual emergency stop

When activated:

- Cancel all open orders
- Close positions (configurable)
- Stop strategies
- Notify user
- Create incident report

The Kill Switch has the highest execution priority.

---

# Reporting Service

Production generates continuous reports.

Daily Report

Includes:

- Profit
- Loss
- Trades
- Fees
- Slippage
- Drawdown
- Risk events

Weekly Report

Includes:

- Performance trends
- Strategy comparison
- Capital growth
- Risk statistics

Monthly Report

Includes:

- Portfolio performance
- Strategy ranking
- Market analysis
- Lessons learned

Reports are archived permanently.

---

# Knowledge Publisher

Production contributes to research.

Published information includes:

- Performance metrics
- Failures
- Unexpected events
- Slippage statistics
- Exchange behavior
- Risk observations

Every production session enriches the Knowledge Base.

---

# Human Supervision

The Human Operator may:

- Start Production
- Stop Production
- Pause strategies
- Review incidents
- Approve deployments
- Override execution

Production is never fully autonomous.

---

# AI Support

The AI Organization supports Production by:

- Explaining incidents
- Summarizing reports
- Detecting unusual behavior
- Identifying long-term trends
- Suggesting improvements

AI never executes trades.

---

# Production Workflow

```
Validated Strategy

↓

Human Approval

↓

Production Manager

↓

Risk Check

↓

Portfolio Check

↓

Position Check

↓

Order Manager

↓

Execution Engine

↓

Exchange

↓

Execution Result

↓

Monitoring

↓

Reporting

↓

Knowledge Base
```

Every execution follows the same workflow.

---

# Safety Principles

Production follows strict safety rules.

- Human approval required
- Risk before profit
- Every action logged
- Every failure recorded
- Every decision explainable
- Every deployment reversible

Safety is never optional.

---

# Success Criteria

A successful Production System:

- Executes reliably
- Protects capital
- Handles failures gracefully
- Produces complete audit trails
- Integrates with the Knowledge Base
- Operates continuously
- Supports future scalability

---

# Relationship to Other Documents

Related specifications:

- 003-Research-Laboratory.md
- 004-Strategy-Lifecycle.md
- 005-Validation-Engine.md
- 006-Knowledge-Base.md
- 007-AI-Gateway.md
- ../future/007-AI-Research-Organization.md (deferred)
- 009-Market-Data-Platform.md

---

# Summary

The Production System is the operational execution layer of TRP.

It transforms validated strategies into controlled real-world trading while prioritizing safety, transparency, and capital preservation.

Every production event becomes new knowledge, completing the continuous learning cycle of the platform.
