# 018 — First Strategy

Version: 1.0

Status: Approved

Document Type: Sprint Specification

---

# Purpose

This document defines the first executable trading strategy for the Trading Research Platform (TRP).

The purpose of the first strategy is not profitability.

Its purpose is to validate the complete TRP pipeline from Research to Production.

The first strategy acts as the system integration test.

---

# Business Value

Before developing complex trading strategies, TRP must prove that the platform itself works correctly.

A simple, deterministic strategy allows verification of:

- Workflow Engine
- Research Laboratory
- Validation Engine
- Knowledge Base
- Production System
- Exchange Adapter
- Dashboard
- AI Integration

---

# Goal

After completing this sprint:

- One complete strategy exists.
- The strategy can be researched.
- The strategy can be validated.
- The strategy can be stored.
- The strategy can be executed.
- The entire platform works end-to-end.

Profitability is not the primary objective.

---

# Out of Scope

This sprint does NOT implement:

- AI-generated strategies
- Portfolio strategies
- Multi-symbol strategies
- Multi-timeframe strategies
- Adaptive strategies
- Machine learning
- Position sizing optimization
- Risk management optimization

These belong to future versions.

---

# Architecture References

- 010-Workflow-Engine.md
- 012-Research-Laboratory.md
- 013-Validation-Engine.md
- 014-Knowledge-Base.md
- 015-Production-System.md

---

# Strategy Objective

The first strategy exists solely to validate the architecture.

It should be:

- deterministic
- easy to understand
- easy to debug
- easy to reproduce

---

# Strategy Rules

Version 1 uses a simple EMA crossover.

Indicators:

- EMA Fast (20)
- EMA Slow (50)

Buy:

Fast EMA crosses above Slow EMA.

Sell:

Fast EMA crosses below Slow EMA.

No additional filters.

---

# Market

Version 1 supports:

BTCUSDT

Only one symbol.

---

# Timeframe

Version 1:

1 Hour

No multiple timeframes.

---

# Exchange

Version 1:

Binance

Only one exchange.

---

# Position Rules

Version 1 supports:

One open position.

No pyramiding.

No scaling.

---

# Risk Rules

Simple fixed stop loss.

Simple fixed take profit.

No trailing stop.

No dynamic position sizing.

---

# Workflow

```
Research

↓

Validation

↓

Knowledge Base

↓

Production

↓

Execution

↓

Logging
```

---

# Research

The strategy can be researched using historical OHLCV data.

---

# Validation

Validation applies predefined rules.

Possible outcomes:

Passed

Needs Review

Rejected

---

# Knowledge Base

Only approved strategies are stored.

---

# Production

Production executes signals using the Exchange Adapter.

---

# AI Integration

AI may:

- explain signals
- summarize reports
- generate documentation

AI never changes strategy logic.

---

# Metrics

Collect:

- Net Profit
- Win Rate
- Profit Factor
- Maximum Drawdown
- Number of Trades

---

# Logging

Log:

- signal generation
- order execution
- strategy start
- strategy stop

---

# Testing

Verify:

- indicator calculation
- signal generation
- workflow execution
- validation
- production execution

---

# Manual Verification Checklist

Verify:

✓ Strategy loads.

✓ Indicators calculate.

✓ Buy signals appear.

✓ Sell signals appear.

✓ Research completes.

✓ Validation executes.

✓ Strategy enters Knowledge Base.

✓ Production executes.

✓ Dashboard displays results.

---

# Acceptance Criteria

The first strategy successfully passes through every platform module.

The complete TRP pipeline functions correctly.

---

# Definition of Done

Completed when:

- Strategy works.
- Pipeline works.
- Dashboard displays results.
- Tests pass.

---

# Common Mistakes

Avoid:

- Complex strategy logic.
- AI-generated signals.
- Multi-symbol execution.
- Premature optimization.
- Exchange-specific logic inside the strategy.

---

# Next Step

019-MVP-Checklist.md

---

# Summary

The first strategy validates the complete Trading Research Platform.

Its purpose is to verify the architecture rather than maximize trading performance.
