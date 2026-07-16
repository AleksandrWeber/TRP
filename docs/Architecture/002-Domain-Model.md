# 002 — Domain Model

Version: 1.0

Status: Approved

Document Type: Architecture Specification

---

# Purpose

This document defines the business domain model of the Trading Research Platform (TRP).

It describes the core business entities, their responsibilities, relationships, and lifecycle.

This document intentionally avoids implementation details such as database schemas, programming languages, APIs, or user interface considerations.

The Domain Model is the single source of truth for the business language used throughout the project.

---

# Domain Philosophy

TRP is a Research Operating System.

Its primary asset is not code.

Its primary asset is knowledge.

Every entity in the system exists to support one of four activities:

- Research
- Validation
- Knowledge
- Production

Everything else is infrastructure.

---

# Domain Overview

The platform revolves around four major domains.

```
Research

↓

Validation

↓

Knowledge

↓

Production
```

Each domain contains a set of business entities.

---

# Core Entity Relationships

```
Workspace
    │
    ▼
Campaign
    │
    ▼
Experiment
    │
    ▼
Strategy
    │
    ▼
Validation
    │
    ▼
Strategy Passport (Future)
    │
    ▼
Production Instance
    │
    ▼
Performance Report
    │
    ▼
Knowledge Base
```

---

# Workspace

## Description

A Workspace is a dedicated environment for one type of activity.

It organizes tools, data, and workflows around a single purpose.

## Examples

- Research Workspace
- Validation Workspace
- Knowledge Workspace
- Production Workspace
- AI Workspace
- Administration Workspace

## Responsibilities

- Organize user activities
- Separate workflows
- Improve productivity

---

# Campaign

## Description

A Campaign represents a complete research initiative.

It groups related experiments under a common objective.

## Responsibilities

- Define research goals
- Organize experiments
- Track progress
- Produce research outcomes

A campaign answers the question:

"What are we trying to discover?"

---

# Experiment

## Description

An Experiment is a single executable research task.

Every experiment tests one hypothesis under specific conditions.

## Responsibilities

- Execute strategy logic
- Collect metrics
- Generate reports
- Produce reproducible results

Experiments are immutable.

If parameters change, a new experiment is created.

---

# Strategy

## Description

A Strategy defines a set of trading rules.

It describes when to enter, manage, and exit positions.

A strategy contains no market data.

It only defines decision logic.

## Examples

- Trend Following
- Mean Reversion
- Breakout
- Momentum
- Grid
- Arbitrage
- Market Making

---

# Strategy Version

Strategies evolve over time.

Every meaningful modification creates a new version.

Older versions remain available for comparison.

A strategy is never overwritten.

---

# Strategy Variant

A Strategy Variant represents a parameterized implementation of the same strategy.

Example:

Trend Following

↓

ATR = 10

↓

ATR = 20

↓

ATR = 30

Each variant is evaluated independently.

---

# Market

A Market defines the financial environment under research.

Examples

- Cryptocurrency
- Stocks
- Forex
- Futures
- Options
- Commodities

Markets define rules.

Strategies remain market-independent whenever possible.

---

# Exchange

An Exchange provides market data and order execution.

Examples

- Binance
- Bybit
- OKX

The Exchange belongs to a Market.

Multiple exchanges may exist within the same market.

---

# Instrument

An Instrument is a tradable asset.

Examples

- BTCUSDT
- ETHUSDT
- AAPL
- EURUSD
- Gold Futures

Experiments always operate on instruments.

---

# Dataset

A Dataset represents historical or live market data prepared for research.

Examples

- OHLCV
- Tick Data
- Order Book
- Funding Rates
- Open Interest
- Liquidation Events

Datasets are immutable once published.

---

# Research Configuration

Defines how research should be executed.

Includes:

- Markets
- Exchanges
- Instruments
- Timeframes
- Date Ranges
- Capital
- Risk Parameters

Configurations are reusable.

---

# Validation

Validation measures the robustness of research results.

Validation answers one question:

"Can this strategy be trusted?"

Validation includes:

- Backtesting
- Walk Forward (Future)
- Monte Carlo (Future)
- Stress Testing
- Robustness Analysis

Validation never modifies a strategy.

---

# Validation Report

A Validation Report summarizes scientific evidence.

Typical metrics include:

- Sharpe Ratio
- Sortino Ratio
- Profit Factor
- Maximum Drawdown
- Win Rate
- Recovery Factor
- Stability Score

Reports are permanent records.

---

# Strategy Passport (Future)

The Strategy Passport is deferred from the MVP.

It contains:

- Description
- Versions
- Validation History
- Risk Profile
- Supported Markets
- Production History
- Performance Metrics

A Passport survives for the entire lifetime of the strategy.

---

# Production Instance

A Production Instance is a live deployment of a validated strategy.

It represents one running copy.

A strategy may have multiple production instances.

Example:

Trend Strategy

↓

Binance

↓

BTCUSDT

↓

Production Instance A

---

# Performance Report

Summarizes production behavior.

Includes:

- Profit
- Drawdown
- Trade Count
- Risk
- Stability
- Errors
- Market Conditions

Performance reports continuously feed the Knowledge Base.

---

# Knowledge Item

A Knowledge Item is any reusable insight produced by the platform.

Examples

- Successful parameter ranges
- Failed experiments
- Risk observations
- AI findings
- Human notes
- Best practices

Knowledge Items are searchable.

---

# Knowledge Base

The Knowledge Base stores all accumulated knowledge.

It never stores temporary information.

It contains:

- Strategy Passports
- Reports
- Research History
- Validation Results
- AI Recommendations
- Human Notes

Knowledge grows continuously.

---

# Recommendation

A Recommendation is a proposed action generated by AI.

Examples

- Retest Strategy
- Expand Dataset
- Reject Configuration
- Deploy New Version
- Investigate Drawdown

Recommendations never execute automatically.

---

# AI Analyst

The AI Analyst interprets information.

Responsibilities include:

- Summarizing reports
- Detecting anomalies
- Explaining metrics
- Finding patterns
- Answering questions

The AI Analyst does not modify production.

---

# AI Scientist (deferred)

Not part of V1 domain. See [`../future/`](../future/).

V1 AI is the OpenRouter Gateway only — summaries and explanations.

---

# User

The User defines objectives.

The User is responsible for:

- Creating campaigns
- Reviewing results
- Approving production
- Managing risk

The User remains the final decision maker.

---

# Plugin

A Plugin extends TRP to support a specific market or capability.

Examples

- Crypto Plugin
- Stock Plugin
- Forex Plugin
- Futures Plugin

Plugins integrate without modifying the platform core.

---

# Relationships Summary

```
Workspace
    │
    ▼
Campaign
    │
    ▼
Experiment
    │
    ▼
Strategy
    │
    ▼
Validation
    │
    ▼
Strategy Passport (Future)
    │
    ▼
Production Instance
    │
    ▼
Performance Report
    │
    ▼
Knowledge Base
```

Supporting entities:

- Market
- Exchange
- Instrument
- Dataset
- Plugin (markets as adapters — marketplace deferred)
- AI Gateway (V1)
- Recommendation (optional / later)

---

# Domain Rules

The following rules are mandatory.

- Every Experiment belongs to one Campaign.
- Every Experiment tests one Strategy Version.
- Every Validation references one Experiment.
- Every Strategy has one Passport.
- Every Production Instance uses only validated strategies.
- Every Performance Report updates the Knowledge Base.
- AI cannot deploy strategies.
- Human approval is required before production.
- Knowledge is permanent.
- Research is reproducible.

---

# Ubiquitous Language

The following terms have fixed meanings throughout the project.

| Term                | Meaning                                |
| ------------------- | -------------------------------------- |
| Campaign            | A collection of related experiments    |
| Experiment          | A single executable research task      |
| Strategy            | Trading decision logic                 |
| Validation          | Scientific verification process        |
| Passport            | Permanent identity of a strategy       |
| Production Instance | Live deployment of a strategy          |
| Knowledge Item      | Reusable research insight              |
| Workspace           | Dedicated environment for one activity |

These definitions must remain consistent across documentation and code.

---

# Summary

The Domain Model defines the language of the Trading Research Platform.

Every module, API, database schema, user interface, AI agent, and documentation artifact must use these entities consistently.

A stable Domain Model ensures that the platform remains understandable, maintainable, and extensible as it evolves.
