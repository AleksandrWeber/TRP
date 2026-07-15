# 015 — Production System

Version: 1.0

Status: Approved

Document Type: Sprint Specification

---

# Purpose

This document defines the Production System for the Trading Research Platform (TRP).

The Production System is responsible for executing approved trading strategies in real market conditions.

It receives validated strategies from the Workflow Engine and coordinates their execution through Exchange Adapters.

The Production System never performs research or validation.

---

# Business Value

The Production System transforms validated trading knowledge into executable trading operations.

Its responsibilities include:

- strategy execution
- market monitoring
- signal generation
- order submission
- execution logging

Only approved strategies may enter the Production System.

---

# Goal

After completing this sprint:

- Production workflows can be started.
- Approved strategies can be executed.
- Market data is consumed.
- Trading signals are generated.
- Orders are sent through Exchange Adapters.
- Execution history is stored.

Version 1 supports a single strategy execution at a time.

---

# Out of Scope

This sprint does NOT implement:

- Portfolio Management
- Risk Engine
- Capital Allocation
- Position Sizing
- Multi-Exchange Trading
- Smart Order Routing
- Hedging
- Auto Rebalancing
- AI Decision Making
- High Frequency Trading

These capabilities belong to future versions.

---

# Architecture References

- 010-Workflow-Engine.md
- 014-Knowledge-Base.md
- 016-API-Architecture.md
- 020-Technology-Stack.md

---

# Responsibilities

The Production System is responsible for:

- executing approved strategies
- monitoring market data
- generating trading signals
- submitting trading requests
- recording execution history
- publishing production events

The Production System is NOT responsible for:

- research
- validation
- exchange-specific implementation
- AI orchestration
- workflow orchestration

---

# Production Lifecycle

```
Approved Strategy

↓

Load Strategy

↓

Initialize Execution

↓

Receive Market Data

↓

Evaluate Strategy

↓

Generate Signal

↓

Send Order

↓

Record Result

↓

Publish Event

↓

Continue
```

---

# Strategy Loading

Only approved strategies may be loaded.

Strategies remain read-only during execution.

---

# Execution Context

Each execution contains:

- Execution ID
- Strategy ID
- Workflow ID
- User ID
- Exchange
- Symbol
- Timeframe
- Status
- Started At

---

# Production Status

Allowed statuses:

```
Pending

Running

Paused

Completed

Failed

Stopped
```

---

# Market Data

Version 1 supports:

- OHLCV candles

Future versions may support:

- Trades
- Order Book
- Funding Rates
- Open Interest

---

# Signal Generation

The strategy evaluates incoming market data.

Possible results:

```
Buy

Sell

Close

Hold
```

The Production System never modifies strategy logic.

---

# Order Execution

The Production System does not communicate directly with exchanges.

All communication passes through an Exchange Adapter.

```
Production System

↓

Exchange Adapter

↓

Exchange API
```

---

# Exchange Adapter

Version 1 supports:

- Binance Adapter

Future adapters:

- Bybit
- OKX
- Kraken
- Coinbase

The Production System depends only on the adapter interface.

---

# Position Tracking

Version 1 maintains only basic execution state.

Advanced portfolio management is postponed.

---

# Execution History

Every execution records:

- timestamps
- received signals
- submitted orders
- execution results
- failures

History is immutable.

---

# Events

Production publishes:

- ProductionStarted
- SignalGenerated
- OrderSubmitted
- ProductionCompleted
- ProductionFailed

---

# Folder Structure

```
modules/

production/

controller/

service/

engine/

execution/

signals/

orders/

adapters/

dto/

interfaces/
```

---

# API

Endpoints:

```
POST /production/start
```

Start production execution.

---

```
POST /production/stop
```

Stop execution.

---

```
GET /production/status
```

Current execution status.

---

```
GET /production/history
```

Execution history.

---

# Logging

Log:

- execution start
- signal generation
- order submission
- execution completion
- failures

Sensitive information must never be logged.

---

# Metrics

Collect:

- execution duration
- signals generated
- orders submitted
- successful executions
- failed executions

---

# Testing

Verify:

- strategy loading
- market data processing
- signal generation
- adapter communication
- execution logging
- event publishing

---

# Manual Verification Checklist

Verify:

✓ Production starts.

✓ Strategy loads correctly.

✓ Market data is received.

✓ Signals are generated.

✓ Orders reach the Exchange Adapter.

✓ Execution history is stored.

✓ Events are published.

---

# Acceptance Criteria

Approved strategies execute successfully.

Signals are generated correctly.

Orders are routed through the Exchange Adapter.

Execution history is preserved.

Workflow integration functions correctly.

---

# Definition of Done

Completed when:

- Production execution works.
- Strategy execution works.
- Exchange Adapter communication works.
- Execution history is stored.
- Tests pass.

---

# Common Mistakes

Avoid:

- Exchange-specific code inside the Production System.
- Business logic inside controllers.
- Modifying strategies during execution.
- Skipping execution logging.
- Direct REST calls to exchange APIs from production services.
- Coupling production logic to a specific exchange.

---

# Next Step

016-AI-Integration.md

---

# Summary

The Production System executes approved trading strategies in live environments while remaining independent of exchange-specific implementations.

By delegating communication to Exchange Adapters, the Production System remains modular, testable, and ready to support additional exchanges in future versions without architectural changes.
