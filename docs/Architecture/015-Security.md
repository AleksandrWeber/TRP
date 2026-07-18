# 015 — Security

Version: 1.0

Status: Approved

Document Type: Architecture Specification

RC-16 Architecture Freeze note (2026-07-18): ADR-016/017/018 are
authoritative for Paper Trading safety. Every executable Order requires
mandatory Risk approval; Kill Switch state is durable; uncertain state fails
safe; all trading aggregates are workspace-scoped; operator commands require
explicit authorization. RC-16 registers no real-capital adapter or private
trading credentials.

RC-16 M2 implementation note (US158): trading commands require Trader or
Administrator (`Admin`) plus workspace membership. Production startup rejects
insecure JWT secret fallbacks (`dev-only-change-me` / missing secret).

US164 applies that boundary to Order commands: create/cancel require
Trader/Admin, active workspace membership, `X-Workspace-Id`, and
`Idempotency-Key`. Authenticated queries are workspace-membership scoped. No
public route exposes internal Risk or Execution Engine transitions.

US165–US171 fail closed on unknown, stale, duplicate, foreign-workspace, or
unreconciled Risk inputs. Runtime adapter construction rejects `live` mode and
all trading credentials; only the internal paper adapter token is registered.
The single Execution Engine is the sole adapter entry: it re-verifies the
mandatory unexpired Risk Decision, the reservation, the approved market
checkpoint, and fenced Session eligibility before submission, and refuses to
submit an Order that is not `executable`. Submission and cancellation are
idempotent, so a duplicate command cannot duplicate an adapter call or an
append-only Fill.

US172–US174 preserve workspace isolation through workspace/account Position and
Ledger identities. Fill accounting accepts only immutable
`OrderFillRecorded` events, requires an active workspace-owned paper account,
and uses Inbox uniqueness plus one PostgreSQL transaction, so duplicate or
failed delivery cannot create partial or repeated financial effects.

---

# Purpose

The Security Architecture defines how the Trading Research Platform (TRP) protects user assets, sensitive information, production systems, and research integrity.

Security is treated as a core architectural concern rather than an additional feature.

The platform assumes that failures, attacks, and human mistakes will eventually occur.

The objective is to minimize impact rather than assume perfect protection.

---

# Philosophy

Security is based on the principle of least privilege.

Every component receives only the permissions required to perform its responsibilities.

Trust is never assumed.

Every request is verified.

Every action is logged.

Every critical operation is auditable.

---

# Mission

The Security Architecture provides:

- Authentication
- Authorization
- Secret Management
- Data Protection
- Production Safety
- Infrastructure Protection
- Plugin Isolation
- AI Isolation
- Auditability
- Incident Response

---

# Core Principles

The platform follows these principles.

- Zero Trust
- Least Privilege
- Defense in Depth
- Fail Secure
- Secure by Default
- Human Approval for Critical Operations
- Complete Audit Trail

---

# Security Layers

```
Internet

↓

Reverse Proxy

↓

API Gateway

↓

Authentication

↓

Authorization

↓

Application Services

↓

Event Bus

↓

Storage

↓

Infrastructure
```

Security exists at every layer.

---

# Authentication

Every user must authenticate before accessing protected resources.

Supported methods:

- Email & Password
- OAuth (future)
- Multi-Factor Authentication (future)

Authentication only verifies identity.

It never grants permissions.

---

# Authorization

The MVP has one authenticated Administrator. All protected actions require that authenticated identity.

Multi-role RBAC is deferred until a future multi-user requirement updates `CANONICAL.md`.

---

# Principle of Least Privilege

Every service receives only the permissions required for its responsibilities.

Examples:

Research Service

- Read Market Data
- Write Research Results

Production Service

- Read Approved Strategies
- Execute Orders

AI Service

- Read Knowledge Base
- Generate Recommendations

AI cannot execute trades.

---

# Exchange API Keys

Exchange credentials are classified as critical secrets.

Rules:

- Withdrawal permissions must always be disabled.
- Separate API keys for Production and Paper Trading.
- Keys are never stored in source code.
- Keys are never written to logs.

Every exchange account should use dedicated credentials.

---

# Secret Management

Sensitive information includes:

- API Keys
- Database Passwords
- JWT Secrets
- Encryption Keys
- Access Tokens

Secrets are stored outside application code.

Examples:

- Environment Variables
- Docker Secrets
- Vault (future)

Secrets are injected at runtime.

---

# Encryption

Sensitive information must be encrypted.

Encryption at Rest

Examples:

- Database
- Object Storage
- Backups

Encryption in Transit

Examples:

- HTTPS
- TLS
- Secure WebSocket (WSS)

---

# Session Security

Authenticated sessions include:

- Expiration
- Refresh Tokens
- Revocation
- Logout

Expired sessions cannot be reused.

---

# Audit Logging

Every security-sensitive action is recorded.

Examples:

- Login
- Logout
- Strategy Deployment
- API Key Update
- Risk Limit Change
- Production Start
- Production Stop

Audit logs are immutable.

---

# AI Security

Artificial Intelligence is an advisory component.

AI may:

- Analyze data
- Summarize reports
- Suggest improvements

AI may never:

- Execute trades
- Modify risk limits
- Access secrets
- Change configuration
- Deploy production

AI recommendations require human approval when affecting production.

---

# Plugin Security

Plugins execute in isolation.

Restrictions:

- No direct database access
- No access to secrets
- No filesystem access unless explicitly granted
- No unrestricted network access

Every plugin operates within defined permissions.

---

# Production Protection

Production is the most protected subsystem.

Requirements:

- Human approval before deployment
- Risk validation before execution
- Continuous monitoring
- Kill Switch support

Production cannot be modified while actively trading.

---

# Risk Protection

Risk management is part of security.

Limits include:

- Maximum daily loss
- Maximum drawdown
- Maximum leverage
- Maximum position size
- Maximum exposure
- Maximum number of concurrent positions

Risk rules override strategy decisions.

---

# Kill Switch

The Kill Switch immediately suspends trading.

Possible triggers:

- Daily loss exceeded
- Critical system failure
- Exchange instability
- Unexpected position mismatch
- Manual emergency activation

When activated:

- Cancel open orders
- Block new positions
- Notify operators
- Create incident report

---

# Network Security

External communication must use secure protocols.

Allowed:

- HTTPS
- TLS
- Secure WebSocket (WSS)

Unencrypted communication is prohibited.

---

# Database Security

Databases are never directly exposed to the Internet.

Access is limited to authorized backend services.

Backups are encrypted.

Administrative access is restricted.

---

# Infrastructure Security

Infrastructure protections include:

- Firewall
- Container isolation
- Network segmentation
- Automatic security updates
- Resource limits

Every service runs with minimum required privileges.

---

# Logging Policy

Logs must never contain:

- Passwords
- API Keys
- Secrets
- Private Tokens
- Personal Sensitive Data

Sensitive values must be masked.

---

# Backup & Recovery

Critical data is backed up automatically.

Recovery procedures must be tested regularly.

Backup integrity is verified.

---

# Incident Response

Security incidents follow a standard workflow.

```
Incident Detected

↓

Alert

↓

Investigation

↓

Containment

↓

Recovery

↓

Knowledge Base Update
```

Every incident improves future security.

---

# Monitoring

Security monitoring includes:

- Failed login attempts
- API abuse
- Unauthorized access
- Service failures
- Exchange connectivity
- Risk events

Suspicious activity generates alerts.

---

# Future Security Enhancements

Possible future improvements:

- Hardware Security Modules
- Vault Integration
- Multi-Factor Authentication
- Hardware Security Keys
- Security Information and Event Management (SIEM)

These features are outside the scope of Version 1.

---

# Success Criteria

A successful Security Architecture:

- Protects user assets
- Protects production systems
- Prevents unauthorized access
- Isolates failures
- Maintains complete audit trails
- Supports incident recovery

---

# Relationship to Other Documents

Related specifications:

- 008-Production-System.md
- 010-Event-Bus.md
- 011-Storage-Architecture.md
- 012-Service-Architecture.md
- ../future/014-Plugin-Architecture.md (deferred)
- ../CANONICAL.md
- 016-API-Architecture.md

---

# Summary

Security is a foundational property of TRP.

The platform protects capital, research integrity, production systems, and sensitive information through layered defenses, least privilege, comprehensive auditing, and human oversight.

Every component is designed to operate securely by default while remaining observable, maintainable, and resilient.
