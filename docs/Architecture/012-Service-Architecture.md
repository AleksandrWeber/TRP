# 012 — Service Architecture

Version: 1.0

Status: Approved

Document Type: Architecture Specification

---

# Purpose

This document defines the module boundaries of the Trading Research Platform (TRP).

For the MVP, TRP is a modular monolith: one NestJS API application contains the domain modules, and the React web application consumes its API. Modules have explicit interfaces and may use in-process domain events, but they are not independently deployed services.

---

# Philosophy

Each module owns one responsibility. Modules collaborate through application interfaces and domain events without reaching into each other's internals.

The MVP optimizes for a simple, testable system. Separate deployable services are deferred until a concrete operational need justifies them.

---

# Mission

The module architecture provides:

- Clear responsibility boundaries
- Cohesive business domains
- Modular development and testing
- Explicit dependencies
- A safe path to future extraction when justified

---

# MVP Module Architecture

```
React Web
   │
   ▼
NestJS API (modular monolith)
   ├── Auth
   ├── Market Data / Research / Validation
   ├── Workflow / Events / Knowledge
   ├── Production (paper) / Risk
   └── AI Gateway / Dashboard API
   │
   ▼
PostgreSQL
```

The API modules share one deployment and one PostgreSQL database while preserving domain boundaries in code.

---

# Design Principles

The architecture follows these principles:

- Single Responsibility
- Domain Ownership
- Explicit module interfaces
- In-process domain events where they reduce coupling
- Loose Coupling
- High Cohesion
- Independent Testing
- No premature service extraction

---

# Future — Potential Service Extraction

The following descriptions are not MVP components. They are candidate boundaries for future extraction only after a concrete scaling, reliability, or operational need appears and `CANONICAL.md` is updated.

## Research Service

Mission

Manage all research activities.

Responsibilities

- Experiments
- Strategy execution
- Backtesting
- Walk-forward testing
- Monte Carlo simulation
- Parameter optimization
- Research reports

Produces:

- Experiment Results
- Strategy Reports
- Validation Requests

Consumes:

- Market Events
- User Requests

---

## Validation Service

Mission

Verify research quality before production.

Responsibilities

- Statistical validation
- Robustness testing
- Performance metrics
- Acceptance criteria
- Validation reports

Produces:

- Validation Reports
- Strategy Approval Requests

Consumes:

- Experiment Results

---

## Production Service

Mission

Execute approved strategies using live capital.

Responsibilities

- Strategy execution
- Position management
- Order execution
- Portfolio management
- Risk enforcement

Produces:

- Trade Events
- Performance Reports
- Incident Events

Consumes:

- Approved Strategies
- Market Events

---

## AI Service

Mission

Provide intelligent analysis and research assistance.

Responsibilities

- AI reasoning
- Summaries
- Recommendations
- Pattern detection
- Context preparation
- Multi-model orchestration

Produces:

- AI Reports
- Recommendations
- Research Ideas

Consumes:

- Knowledge
- Reports
- Market Data

---

## Knowledge Service

Mission

Maintain the institutional memory of TRP.

Responsibilities

- Knowledge Items
- Knowledge Graph
- Tagging
- Relationships
- Search
- Versioning

Produces:

- Knowledge Events

Consumes:

- Research Results
- Production Reports
- AI Findings

---

## Market Data Service

Mission

Collect and distribute market information.

Responsibilities

- Exchange connectivity
- Data normalization
- Data validation
- Historical storage
- Live streaming

Produces:

- Market Events

Consumes:

- Exchange APIs

---

## Storage Service

Mission

Provide persistent storage abstraction.

Responsibilities

- Database access
- Object storage
- Time-series storage
- Cache management
- Backup

Other services never communicate directly with databases.

---

## Notification Service

Mission

Deliver notifications to users.

Channels

- Telegram
- Email
- Discord
- Slack
- Push Notifications
- Web Notifications

Notification types

- Daily reports
- Weekly reports
- Incidents
- Strategy approval
- Production alerts
- Research completion

---

## Monitoring Service

Mission

Observe platform health.

Responsibilities

- Metrics
- Logging
- Alerting
- Tracing
- Health checks
- Incident detection

Monitors every service.

---

## Authentication Service

Mission

Protect access to the platform.

Responsibilities

- Login
- JWT
- OAuth
- API Keys
- Roles
- Permissions
- Sessions

Every secured request passes through Authentication.

---

## Reporting Service

Mission

Generate structured reports.

Examples

- Experiment Report
- Validation Report
- Daily Production Report
- Weekly Summary
- Monthly Review
- Portfolio Report
- Risk Report

Reports are archived permanently.

---

## Configuration Service

Mission

Manage system configuration.

Responsibilities

- Exchange settings
- AI settings
- Risk settings
- Feature flags
- Environment configuration

Configuration changes are versioned.

---

## Plugin Service

Mission

Manage external extensions.

Responsibilities

- Plugin loading
- Plugin validation
- Plugin lifecycle
- Compatibility
- Updates

Supports future market plugins.

---

## API Gateway

Mission

Provide a single entry point.

Responsibilities

- Authentication
- Rate limiting
- Routing
- Request validation
- API versioning

The Gateway contains no business logic.

---

## Communication Model

Services communicate using:

Primary

- Event Bus

Secondary

- Internal APIs

Synchronous communication should be minimized.

---

## Service Independence

Each service owns:

- Business logic
- Internal models
- Database schema (if required)
- Configuration
- Tests
- Documentation

No service accesses another service's internal implementation.

---

## Scalability

Every service may scale independently.

Examples

Heavy Backtesting

↓

Scale Research Service

High Trading Volume

↓

Scale Production Service

High AI Usage

↓

Scale AI Service

Scaling should be selective.

---

## Failure Isolation

Failure of one service must not stop the platform.

Example

Notification Service offline

↓

Trading continues.

Research continues.

Knowledge continues.

Only notifications are delayed.

---

## Additional Future Capabilities

Future services may include:

- Portfolio Optimizer
- Strategy Marketplace
- Feature Store
- Billing
- User Analytics
- Compliance
- Data Lake
- Mobile Backend

The architecture supports unlimited growth.

---

# Success Criteria

A successful MVP module architecture:

- Clearly separates responsibilities
- Minimizes coupling
- Keeps the API deployable as one application
- Keeps persistence inside PostgreSQL
- Simplifies testing
- Documents service extraction as a future decision, not a present requirement

---

# Relationship to Other Documents

Related specifications:

- 008-Production-System.md
- 009-Market-Data-Platform.md
- 010-Event-Bus.md
- 011-Storage-Architecture.md
- 014-Security.md

---

# Summary

For the MVP, TRP is a modular monolith with clear NestJS module boundaries.

Research, validation, knowledge, production, authentication, and AI capabilities are modules in one API deployment. The web application communicates with that API, while PostgreSQL stores MVP data.

Potential services described above are Future options. They are not MVP architecture and may be extracted only after a new product requirement and canonical update.
