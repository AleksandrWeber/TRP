# 021 — Glossary

Version: 1.0

Status: Approved

Document Type: Reference

---

# Purpose

The Glossary defines the official terminology used throughout the Trading Research Platform (TRP).

Its purpose is to ensure consistent language across architecture, implementation, documentation, source code, and AI-generated content.

Every technical term should have one unambiguous meaning.

---

# General Principles

- One concept = one term.
- One term = one definition.
- Avoid synonyms.
- Use the terms defined here consistently across the platform.

---

# A

## AI Organization

A collection of specialized AI agents that analyze, review, summarize, validate, and assist research activities.

AI agents provide recommendations but never execute trades.

---

## Asset

A financial instrument traded on a market.

Examples:

- BTC
- ETH
- SOL

Version 1 supports cryptocurrency assets only.

---

# B

## Backtest

The execution of a trading strategy on historical market data.

Its purpose is to estimate historical performance.

Backtests never guarantee future profitability.

---

## Bull Market

A market characterized by sustained upward price movement.

---

## Bear Market

A market characterized by sustained downward price movement.

---

# C

## Configuration

A collection of runtime parameters controlling platform behavior.

Configuration is external to application code.

---

# D

## Dashboard

The primary user interface displaying platform status, research activity, production information, and system health.

---

## Drawdown

The percentage decline from an equity peak to a subsequent low.

Used as one of the primary risk metrics.

---

# E

## Event

A record describing something that has already occurred.

Examples:

- ResearchCompleted
- WorkflowStarted
- PositionClosed

Events are immutable.

---

## Event Bus

The communication layer responsible for delivering events between services.

---

## Exchange

A trading venue connected to TRP.

Examples:

- Binance
- Bybit

Version 1 supports Binance.

---

## Experiment

A single research execution that evaluates one strategy under a defined configuration.

Each experiment produces measurable results.

---

# F

## Frontend

The user interface of TRP.

Responsible for visualization and interaction.

Business logic remains on the backend.

---

# I

## Indicator

A mathematical calculation derived from market data.

Examples:

- EMA
- RSI
- ATR

Indicators assist strategies but do not make trading decisions.

---

## Incident

An unexpected event affecting platform operation.

Examples:

- Exchange outage
- Failed deployment
- Worker crash

Every incident should be investigated and documented.

---

# J

## Job

A long-running background task executed asynchronously.

Examples:

- Backtesting
- AI analysis

Monte Carlo simulation is deferred from the MVP.

---

# K

## Knowledge Base

The structured repository of research results, reports, incidents, and learned knowledge.

Acts as the long-term memory of TRP.

---

## Kill Switch

An emergency mechanism that immediately suspends production trading.

Used to protect capital during abnormal conditions.

---

# M

## Market

A collection of tradable financial instruments.

Version 1 supports the cryptocurrency market.

---

## Market Data

Historical or real-time information describing market activity.

Examples:

- Price
- Volume
- Order Book
- Trades

---

## Market Regime

The current behavior of the market.

Examples:

- Trending
- Sideways
- High Volatility
- Low Volatility

Strategies may perform differently under different regimes.

---

## Monte Carlo Simulation (Future)

Deferred statistical validation technique using randomized scenarios to estimate strategy robustness.

---

# O

## Order

An instruction sent to an exchange.

Examples:

- Buy
- Sell
- Stop Loss

Orders are executed only by the Production System.

---

# P

## Paper Trading

Execution of strategies using simulated capital while receiving real market data.

Used before live deployment.

---

## Plugin

An independently developed extension adding functionality without modifying the platform core.

Examples:

- Exchange Plugin
- Strategy Plugin
- Indicator Plugin

---

## Position

An active market exposure resulting from one or more executed orders.

---

## Production

The subsystem responsible for executing validated strategies using real market conditions.

---

## Project

The highest-level organizational entity within TRP.

A project contains research, strategies, experiments, reports, and production configurations.

---

# R

## Report

A structured summary of research or production results.

Reports may include charts, metrics, conclusions, and recommendations.

---

## Research

The systematic process of developing, testing, and evaluating trading hypotheses.

Research precedes validation.

---

## Research Laboratory

The subsystem responsible for experimentation and strategy development.

---

## Risk Management

The collection of rules protecting capital.

Examples:

- Position limits
- Drawdown limits
- Daily loss limits

Risk management overrides strategy decisions.

---

# S

## Service

An independent software component responsible for one business capability.

Services communicate through APIs and events.

---

## Signal

A recommendation generated by a strategy.

Examples:

- Buy
- Sell
- Hold
- Exit

Signals are evaluated before execution.

---

## Strategy

A defined set of trading rules.

Strategies generate signals.

They do not execute trades directly.

---

# T

## Task

A single unit of work executed by the platform.

Tasks may be combined into workflows.

---

## Trade

A completed exchange transaction.

A trade results from an executed order.

---

## Trading Session

A continuous period during which the Production System is active.

---

# U

## User

A person interacting with TRP.

The MVP has one authenticated Administrator. Multi-role RBAC is deferred.

---

# V

## Validation

The process of verifying whether a strategy is sufficiently robust for production.

Validation follows research.

---

## Validation Engine

The subsystem responsible for evaluating strategy quality.

---

# W

## Walk-Forward Analysis (Future)

Deferred validation technique that repeatedly trains and evaluates strategies using sequential historical data.

---

## WebSocket

A persistent communication channel used for real-time updates.

---

## Workflow

A structured sequence of business steps executed by the Workflow Engine.

---

## Workflow Engine

The subsystem responsible for coordinating business processes.

It orchestrates services but does not implement business logic.

---

# Success Criteria

A successful Glossary:

- Defines every important platform concept.
- Eliminates ambiguity.
- Supports consistent documentation.
- Improves communication between developers, AI, and stakeholders.

---

# Relationship to Other Documents

This Glossary applies to every document within the TRP architecture and implementation.

---

# Summary

The Glossary establishes a shared language for the Trading Research Platform.

Consistent terminology improves communication, documentation quality, implementation accuracy, and long-term maintainability.
