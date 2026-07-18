# 009 — Market Data Platform

Version: 1.0

Status: Approved

Document Type: Architecture Specification

RC-16 Architecture Freeze note (2026-07-18): ADR-017 freezes Live Market
Data as owner of public connectivity, normalization, validation, sequence/gap
handling, checkpoints, and health. It does not own account/order execution.
Execution adapters own broker commands; Portfolio consumes Position valuation
outputs rather than raw Market Data. Multi-exchange and horizontal scaling
remain future scope.

RC-16 M1 US126–US145 (2026-07-18): canonical provider-neutral domain contracts,
public connector foundation, normalization/quarantine, stream integrity, durable
desired subscriptions, durable checkpoints, startup recovery, latest-state
projection, market status/staleness, and observability under
`apps/api/src/modules/live-market-data/`. Closed-candle and mark-price events are
distinct immutable types with deterministic stream identity. Connector
port/registry, Binance REST/WebSocket, reconnect/resilience,
normalization/validation with safe quarantine, per-stream dedup/ordering, REST
gap recovery, workspace-scoped subscription registry, Prisma-backed market
stream checkpoints (heartbeat separate from semantic progress), startup
recovery with live-event buffering, Inbox-idempotent latest-market-state
projection (rebuildable), operational market-health/staleness (never mutating
business semantics), and bounded metrics/secret-safe logs/readiness-liveness
probes are implemented; workspace query APIs and live projection channels remain
later M1 stories. Historical OHLCV remains in `market-data/`. Provider payloads
must not leak outside connector adapters.

---

# Purpose

The Market Data Platform is the foundation of the Trading Research Platform (TRP).

Its responsibility is to collect, normalize, validate, enrich, and distribute market data to every subsystem within the platform.

It serves as the single source of truth for all market information.

No subsystem communicates directly with external exchanges.

Every request passes through the Market Data Platform.

---

# Philosophy

Good decisions require good data.

Poor-quality data invalidates research, corrupts validation, and increases production risk.

The platform treats market data as a critical infrastructure component rather than a simple API integration.

---

# Mission

The Market Data Platform provides:

- Live market data
- Historical data
- Market events
- Account events
- Order events
- Data normalization
- Data validation
- Data storage
- Event distribution

Every consumer receives identical data.

---

# High-Level Architecture

```

```

             Exchanges
                  │
      ┌───────────┴────────────┐
      │                        │

REST Collectors WebSocket Collectors
│ │
└───────────┬────────────┘
│
Data Normalizer
│
Data Validator
│
Event Publisher
│
Event Bus
│
┌────────────┼────────────┐
│ │ │
Research Production AI System

```

---

# Design Principles

The platform follows these principles.

- Single source of truth
- Vendor independence
- Immutable events
- Low latency
- High reliability
- Horizontal scalability
- Plugin architecture

---

# Responsibilities

The Market Data Platform is responsible for:

- Collecting market data
- Collecting account events
- Synchronizing exchanges
- Normalizing formats
- Detecting anomalies
- Publishing events
- Recording history

It is not responsible for trading decisions.

---

# Supported Data Sources

Examples include:

- Binance
- Bybit
- OKX
- Kraken
- Coinbase
- Bitget

Additional providers may be added through plugins.

---

# Supported Market Types

The architecture is market-independent.

Supported examples:

- Cryptocurrency
- Stocks
- Forex
- Futures
- Options
- Commodities
- ETFs

The platform never assumes cryptocurrency-specific behavior.

---

# Collector Layer

Collectors retrieve information from external providers.

Two collection methods exist.

REST

Used for:

- Historical data
- Account information
- Balances
- Symbols
- Metadata

WebSocket

Used for:

- Live prices
- Trades
- Order Book
- Funding
- Positions
- Orders

Collectors never contain business logic.

---

# Data Normalizer

Every provider exposes different formats.

The Data Normalizer converts all external formats into TRP's internal market model.

Examples:

Exchange A

```

BTC-USDT

```

Exchange B

```

BTCUSDT

```

Internal Representation

```

BTCUSDT

```

The rest of the platform never sees provider-specific formats.

---

# Data Validator

Incoming data is validated before publication.

Checks include:

- Missing timestamps
- Duplicate events
- Invalid prices
- Invalid volume
- Out-of-order events
- Corrupted messages

Invalid data is quarantined.

---

# Event Publisher

Validated data becomes immutable events.

Examples:

PriceUpdated

OrderBookUpdated

TradeExecuted

FundingUpdated

PositionUpdated

OrderFilled

BalanceChanged

Every event receives a timestamp and unique identifier.

---

# Historical Storage

Every event may be archived.

Historical data includes:

- Candles
- Trades
- Order Book snapshots
- Funding
- Open Interest
- Liquidations
- Volatility

Historical data supports future research.

---

# Live Stream

Live market events are distributed through the Event Bus.

Consumers include:

- Research Laboratory
- Production
- AI Organization
- Dashboards
- Monitoring

Consumers never poll exchanges directly.

---

# Time Synchronization

Every event is timestamped using:

- Exchange Timestamp
- Server Timestamp
- Processing Timestamp

Time consistency is essential for research accuracy.

---

# Data Quality

The platform continuously monitors data quality.

Metrics include:

- Missing events
- Delay
- Throughput
- Message rate
- Exchange health
- Synchronization accuracy

Poor quality generates incidents.

---

# Resilience

The platform automatically handles:

- Reconnection
- Retry
- Rate limits
- Temporary outages
- Duplicate messages
- Partial failures

Failure of one exchange must not stop the platform.

---

# Plugin Architecture

Every exchange is implemented as a plugin.

```

Exchange Connector

↓

Standard Interface

↓

Market Data Platform

```

Adding a new exchange requires no architectural changes.

---

# Multi-Market Support

The platform supports multiple markets simultaneously.

Example:

```

Crypto

Stocks

Forex

Commodities

Options

```

Every market publishes standardized events.

---

# Consumers

Market data is consumed by:

- Research Laboratory
- Validation Engine
- Production System
- AI Research Organization
- Monitoring
- Analytics
- Dashboards

No direct exchange access is allowed.

---

# Security

Authentication secrets remain inside the connector layer.

Other subsystems never access exchange credentials.

This limits security exposure.

---

# Scalability

The platform is designed for horizontal scaling.

Possible scaling strategies:

- Multiple collectors
- Multiple workers
- Message queues
- Distributed Event Bus
- Multiple storage nodes

Scalability should not require architectural redesign.

---

# Future Expansion

The platform should support additional data sources.

Examples:

- News providers
- Economic calendars
- On-chain analytics
- Sentiment platforms
- Alternative datasets

The core architecture remains unchanged.

---

# Success Criteria

A successful Market Data Platform:

- Collects reliable data
- Normalizes every provider
- Publishes immutable events
- Detects bad data
- Supports multiple markets
- Scales horizontally
- Serves as the platform's single source of truth

---

# Relationship to Other Documents

Related specifications:

- 008-Production-System.md
- 010-Plugin-Architecture.md
- 011-Event-Bus.md
- 012-Storage-Architecture.md

---

# Summary

The Market Data Platform is the data foundation of TRP.

It isolates external providers, guarantees consistent market information, and enables every subsystem to operate on the same trusted stream of events.

Reliable research begins with reliable data.


```
