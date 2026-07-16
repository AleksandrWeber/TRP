# 004 — Strategy Lifecycle

Version: 1.0

Status: Approved

Document Type: Architecture Specification

---

# Purpose

This document defines the complete lifecycle of a trading strategy within the Trading Research Platform (TRP).

A strategy is not static.

It evolves continuously through research, validation, production, monitoring, and improvement.

The objective of this lifecycle is to ensure that no strategy reaches production without scientific evidence and that every production strategy continues to improve throughout its lifetime.

---

# Philosophy

A strategy is a living object.

It is born from an idea.

It grows through experimentation.

It matures through validation.

It proves itself in production.

It evolves through continuous learning.

No strategy is ever considered "finished."

---

# Lifecycle Overview

```
Idea

↓

Strategy Draft

↓

Research Campaign

↓

Experiments

↓

Validation

↓

Strategy Passport (Future)

↓

Paper Trading

↓

Production Approval

↓

Production

↓

Monitoring

↓

Knowledge Update

↓

Improvement

↓

New Version

↓

Research
```

This loop never ends.

---

# Lifecycle Step 1 — Idea

Every strategy begins with a hypothesis.

Examples:

- Trend Following
- Mean Reversion
- Volatility Breakout
- Momentum
- Funding Rate Arbitrage

Ideas may originate from:

- Human researchers
- Research history
- Market observations
- Academic papers
- (Future) AI Scientist — see `../future/`

Ideas have no performance metrics.

---

# Lifecycle Step 2 — Strategy Draft

The idea becomes a formal strategy specification.

The specification defines:

- Entry rules
- Exit rules
- Position sizing
- Risk management
- Timeframe
- Required indicators
- Supported markets

At this stage the strategy is only a concept.

---

# Lifecycle Step 3 — Research Campaign

A Campaign is created to evaluate the strategy.

The campaign defines:

- Objectives
- Dataset
- Market
- Exchange
- Instruments
- Parameter ranges
- Evaluation metrics

Multiple campaigns may evaluate the same strategy.

---

# Lifecycle Step 4 — Experiments

The Laboratory generates experiments.

Each experiment changes controlled variables.

Examples:

- EMA = 20
- EMA = 50
- ATR = 10
- ATR = 20

The objective is discovering robust behavior.

---

# Lifecycle Step 5 — Candidate Strategy

After sufficient experiments, one or more candidate versions emerge.

Candidates demonstrate promising performance.

They are not yet approved.

Candidate strategies proceed to validation.

---

# Lifecycle Step 6 — Validation

Validation measures robustness.

Required validation includes:

- Backtesting
- Fees and slippage
- MVP validation rules

Validation answers one question:

"Can this strategy survive outside the laboratory?"

---

# Future — Strategy Passport

The Strategy Passport is deferred from the MVP. It may be introduced after a concrete requirement updates `CANONICAL.md`.

The Passport becomes the permanent identity of the strategy.

It contains:

- Description
- Objectives
- Supported Markets
- Validation History
- Performance Metrics
- Known Limitations
- Version History
- Production History

The Passport remains with the strategy throughout its lifetime.

---

# Lifecycle Step 8 — Paper Trading

Validated strategies enter simulated live trading.

Objectives:

- Verify execution logic
- Measure slippage
- Measure latency
- Detect infrastructure problems
- Evaluate live behavior

Paper Trading uses live market data without risking capital.

---

# Lifecycle Step 9 — Production Approval

Human approval is mandatory.

Approval requires evidence.

Typical approval checklist:

✓ Validation passed

✓ Paper Trading completed

✓ Risk reviewed

✓ Production configuration prepared

Without approval, deployment is impossible.

---

# Lifecycle Step 10 — Production

The strategy begins live trading.

Production continuously records:

- Orders
- Positions
- Risk
- Profit
- Drawdown
- Market Conditions
- Failures

Production is monitored continuously.

---

# Lifecycle Step 11 — Monitoring

Monitoring evaluates strategy health.

Examples:

- Unexpected drawdown
- Reduced profitability
- Increased volatility
- API failures
- Execution latency
- Market regime changes

Monitoring may trigger new research.

---

# Lifecycle Step 12 — Knowledge Update

Production generates valuable knowledge.

Examples:

- Better parameters
- New risks
- Market observations
- Failure patterns
- Successful adaptations

Knowledge updates become permanent.

---

# Lifecycle Step 13 — Improvement

Researchers evaluate accumulated knowledge.

Possible actions:

- Improve parameters
- Expand datasets
- Create new variants
- Explore new markets
- Improve risk model

Improvements never overwrite previous versions.

---

# Lifecycle Step 14 — New Version

Every meaningful improvement creates a new strategy version.

Example:

```
Trend Strategy

↓

v1.0

↓

v1.1

↓

v2.0

↓

v3.0
```

Version history remains permanent.

---

# Retirement

A strategy may eventually be retired.

Reasons include:

- Structural market changes
- Persistent underperformance
- Better replacement
- Unsupported market
- Excessive risk

Retired strategies remain in the Knowledge Base.

History is never deleted.

---

# Strategy States

Every strategy exists in exactly one primary state.

```
Draft

↓

Research

↓

Validation

↓

Paper Trading

↓

Approved

↓

Production

↓

Monitoring

↓

Improvement

↓

Retired
```

Transitions must follow defined rules.

---

# Versioning Rules

A strategy is immutable.

Changes create new versions.

Minor changes:

- Parameter updates
- Documentation

Major changes:

- Entry logic
- Exit logic
- Risk model
- Indicators

Major changes require new validation.

---

# Human Responsibilities

Humans are responsible for:

- Defining ideas
- Reviewing evidence
- Approving production
- Managing capital
- Retiring strategies

Responsibility never transfers to AI.

---

# AI Responsibilities

AI may:

- Suggest improvements
- Detect anomalies
- Summarize research
- Compare versions
- Generate reports

AI cannot:

- Deploy strategies
- Modify production
- Allocate capital
- Override human approval

---

# Success Criteria

A successful strategy lifecycle:

- Is fully traceable
- Is reproducible
- Preserves history
- Encourages continuous improvement
- Prevents unsafe deployments
- Builds long-term knowledge

---

# Relationship to Other Documents

Related specifications:

- 003-Research-Laboratory.md
- 005-Validation-Engine.md
- 006-Knowledge-Base.md
- 007-AI-Gateway.md
- 008-Production-System.md

---

# Summary

The Strategy Lifecycle transforms trading ideas into scientifically validated production systems.

Every stage produces evidence.

Every version preserves history.

Every production result generates new knowledge.

The lifecycle is continuous, traceable, and designed for long-term improvement rather than short-term optimization.
