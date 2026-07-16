# 011 — Storage Architecture

Version: 1.0

Status: Approved

Document Type: Architecture Specification

---

# Purpose

The Storage Architecture defines how TRP stores, organizes, protects, and manages all persistent information.

Data is one of the platform's most valuable assets.

Storage must support research reproducibility, production reliability, AI reasoning, and long-term knowledge accumulation.

Every subsystem stores data through dedicated storage services rather than directly accessing databases.

---

# Philosophy

Different data requires different storage.

There is no single database suitable for every workload.

TRP uses a polyglot persistence architecture where each storage technology is selected according to its strengths.

---

# Mission

The Storage Architecture provides:

- Reliable persistence
- High availability
- Fast retrieval
- Historical preservation
- Data integrity
- Scalability
- Backup and recovery

---

# High-Level Architecture

```
                Storage Layer
                     │
 ┌──────────┬──────────┬──────────┬──────────┐
 │          │          │          │
 ▼          ▼          ▼          ▼
SQL     Time-Series   Object    Cache
Database Database     Storage
 │
 ▼
Knowledge Store
```

Each storage engine serves a specific purpose.

---

# Storage Principles

The Storage Layer follows these principles:

- Separation of concerns
- Immutable historical data
- Traceability
- Scalability
- Durability
- Vendor independence
- Backup by design

---

# Data Categories

TRP stores several categories of information.

---

## Configuration Data

Examples:

- Users
- Exchanges
- API Keys
- Projects
- Settings
- Roles
- Permissions

Recommended Storage:

SQL Database

---

## Research Data

Examples:

- Experiments
- Strategies
- Parameters
- Validation reports
- Metrics

Recommended Storage:

SQL Database

---

## Production Data

Examples:

- Orders
- Positions
- Trades
- Executions
- Daily statistics

Recommended Storage:

SQL Database

---

## Time-Series Data

Dedicated time-series storage is deferred for the MVP; PostgreSQL stores the initial OHLCV dataset.

Examples:

- Candles
- Trades
- Funding
- Open Interest
- Indicators
- Volatility
- Liquidations

Recommended Storage:

Time-Series Database

---

## AI Data

Examples:

- Prompts
- AI Responses
- Summaries
- Recommendations
- Context Snapshots

Recommended Storage:

SQL Database

---

## Knowledge Base

Examples:

- Knowledge Items
- Relationships
- Tags
- Categories
- References

Recommended Storage:

Graph Database (future)

Initially SQL.

---

## Files

Examples:

- Reports
- CSV
- Images
- Charts
- Backups
- Logs

Recommended Storage:

Object Storage

---

## Cache

Caching is deferred for the MVP. PostgreSQL remains the required storage service.

Examples:

- Recent candles
- Open positions
- Dashboard data
- Session information

Recommended Storage:

Redis

---

# SQL Database

Stores structured business data.

Examples:

- Projects
- Strategies
- Experiments
- Validation
- Production
- Users

Recommended Technologies

- PostgreSQL

PostgreSQL is the primary relational database.

---

# Deferred Storage — Time-Series Database

Time-series storage is deferred for the MVP. PostgreSQL stores the MVP OHLCV and research data.

Optimized for chronological market data.

Stores:

- OHLCV
- Tick data
- Trades
- Indicators

Possible Technologies

- TimescaleDB
- QuestDB
- InfluxDB

Time-series storage must support billions of records.

---

# Object Storage

Object storage is deferred for the MVP. PostgreSQL remains the required storage service.

Stores large files.

Examples:

- Reports
- CSV exports
- Images
- Logs
- Snapshots
- AI reports

Possible Technologies

- MinIO
- Amazon S3
- Cloudflare R2

---

# Cache Layer

Caching is deferred for the MVP. PostgreSQL remains the required storage service.

Provides fast temporary access.

Responsibilities:

- Dashboard acceleration
- Frequently accessed data
- Temporary sessions
- API responses

Possible Technologies:

- Redis

Cache is disposable.

---

# Knowledge Storage

The MVP Knowledge Base uses PostgreSQL.

Future phase:

Graph Database

Examples:

- Neo4j
- Memgraph

Graph storage enables semantic relationships.

---

# Backup Strategy

Every storage component requires backups.

Backup Types

- Full
- Incremental
- Snapshot

Backups must be automated.

---

# Retention Policy

Different data has different retention periods.

Market Data

Long-term

Production Data

Permanent

Knowledge

Permanent

Reports

Permanent

Cache

Temporary

Logs

Configurable

---

# Data Integrity

The Storage Layer guarantees:

- ACID transactions where required
- Referential integrity
- Version history
- Audit logging
- Immutable historical records

No critical data is overwritten.

---

# Scalability

Storage must scale independently.

Scaling methods include:

- Read replicas
- Partitioning
- Sharding
- Compression
- Tiered storage

Scaling should not require redesign.

---

# Security

Sensitive information includes:

- API keys
- Credentials
- Tokens
- Secrets

Requirements:

- Encryption at rest
- Encryption in transit
- Role-based access
- Audit logs
- Secret isolation

Secrets are never stored in plain text.

---

# Data Access

Applications never communicate directly with databases.

All access passes through repositories and storage services.

Benefits:

- Maintainability
- Testability
- Security
- Technology independence

---

# Future Expansion

Deferred storage ideas (not V1) — see [`../future/`](../future/):

- Vector Database / RAG
- Graph Database
- Distributed SQL
- Data Lake
- Feature Store

---

# Success Criteria

A successful Storage Architecture:

- Preserves data safely
- Scales efficiently
- Supports every subsystem
- Enables reproducibility
- Protects sensitive information
- Simplifies future expansion

---

# Relationship to Other Documents

Related specifications:

- 006-Knowledge-Base.md
- 009-Market-Data-Platform.md
- 010-Event-Bus.md
- 013-Security.md

---

# Summary

The Storage Architecture provides the persistent foundation of TRP.

For the MVP, PostgreSQL is the single active storage service. Time-series, object, cache, and graph storage remain deferred options.
