# 018 — Infrastructure

Version: 1.0

Status: Approved

Document Type: Architecture Specification

RC-16 Architecture Freeze note (2026-07-18): the authoritative business
durability model is PostgreSQL Outbox/Inbox and durable Trading Session state.
Redis/BullMQ may support a measured scheduler/worker need but cannot be the
only source of trading state. Runtime infrastructure must support graceful
shutdown, fenced ownership, health checks, restart recovery, and
reconciliation before execution resumes.

---

# Purpose

The Infrastructure Architecture defines the runtime environment of the Trading Research Platform (TRP).

Its purpose is to provide a stable, reproducible, secure, and maintainable execution environment for development, testing, and production.

Infrastructure should remain simple while supporting future growth.

---

# Philosophy

Infrastructure is an implementation detail.

Business logic must not depend on infrastructure choices.

Infrastructure should be reproducible using code.

Manual configuration should be minimized.

---

# Mission

The Infrastructure provides:

- Application hosting
- Persistent storage
- Caching
- Message processing
- File storage
- Networking
- Monitoring
- Backup support

---

# Infrastructure Overview

```
                    Internet
                        │
                        ▼
                 Reverse Proxy
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
    Frontend                       Backend API
                                        │
        ┌────────────┴────────────┐
        ▼                         ▼
   PostgreSQL                   Worker
                                   │
                                   ▼
                            Event Processing
```

Everything runs inside Docker containers.

---

# Infrastructure Principles

The infrastructure follows these principles:

- Infrastructure as Code
- Container First
- One Responsibility per Service
- Simple Deployment
- Easy Recovery
- Easy Backup
- Minimal Operational Complexity

---

# Runtime Environment

Version 1 consists of a single server.

The server hosts all platform services.

No distributed infrastructure is required.

Future horizontal scaling remains possible.

---

# Core Services

The platform consists of the following infrastructure services.

---

## Reverse Proxy

Responsibilities:

- HTTPS termination
- Request routing
- Static asset delivery
- Compression
- Security headers

Recommended:

Nginx

---

## Frontend

Responsibilities:

- React application
- Static assets
- User interface

Runs as a Docker container.

---

## Backend API

Responsibilities:

- REST API
- WebSocket
- Authentication
- Business logic
- Workflow management

Runs as a Docker container.

---

## Worker

Responsibilities:

- Long-running tasks
- Research jobs
- AI requests
- Background processing

Runs independently from the API.

---

## PostgreSQL

Primary relational database.

Stores:

- Users
- Projects
- Strategies
- Experiments
- Reports
- Configuration
- Knowledge

Persistent storage.

---

## Deferred Infrastructure — Redis

Responsibilities:

- Cache
- Job queues
- Session storage
- Temporary state

Redis contains no permanent business data.

Redis is not required for the MVP. Introduce it only for a real cache or queue workload.

---

## Deferred Infrastructure — MinIO

Stores files.

Examples:

- Reports
- CSV
- Images
- Backups
- Research artifacts

Provides an S3-compatible interface.

MinIO is not required for the MVP. Introduce it only when object storage is needed.

---

# Networking

Internal services communicate over a private Docker network.

Only the Reverse Proxy is exposed to the Internet.

Databases are never publicly accessible.

---

# Docker

Every service runs in its own container.

Benefits:

- Reproducibility
- Isolation
- Portability
- Consistent environments

Containers should remain stateless whenever possible.

---

# Docker Compose

Version 1 uses Docker Compose.

Compose manages:

- Service startup
- Networking
- Volumes
- Environment variables

No container orchestration platform is required.

---

# Persistent Storage

Persistent volumes are used for:

- PostgreSQL
- Logs
- Backups

Containers themselves remain disposable.

---

# Configuration

Application configuration is provided through:

- Environment Variables
- Docker Compose

Configuration is external to application code.

---

# Secrets

Secrets include:

- JWT Secret
- Database Password
- Exchange API Keys
- Encryption Keys

Secrets are never committed to Git.

---

# Logging

Every service writes structured logs.

Logs include:

- Timestamp
- Service
- Level
- Message
- Correlation ID

Logs should be centralized in future versions.

---

# Monitoring

Version 1 monitors:

- Service health
- CPU
- Memory
- Disk
- Container status

Advanced monitoring is introduced later.

---

# Backup

Backups include:

- PostgreSQL
- Configuration

Backups are automated.

Recovery procedures should be tested periodically.

---

# Scalability

Infrastructure supports future scaling.

Possible future improvements:

- Multiple API instances
- Multiple Workers
- Dedicated database server
- Object storage cluster
- Load balancer

Version 1 does not require these features.

---

# Failure Recovery

If a container fails:

- Docker restarts it automatically.
- Persistent data remains intact.
- Other services continue operating where possible.

Infrastructure failures should not corrupt business data.

---

# Technology Choices

Version 1 intentionally favors mature technologies.

Examples:

- Docker
- Docker Compose
- PostgreSQL
- Nginx

Operational simplicity has higher priority than maximum scalability.

---

## Deferred Infrastructure

Redis is a future cache/queue option. MinIO is a future object-storage option. Neither is an MVP infrastructure dependency.

---

# Success Criteria

A successful Infrastructure:

- Is reproducible
- Is easy to deploy
- Is easy to recover
- Is easy to maintain
- Supports future growth
- Minimizes operational complexity

---

# Relationship to Other Documents

Related specifications:

- 011-Storage-Architecture.md
- 015-Security.md
- 017-Frontend-Architecture.md
- 019-Deployment.md

---

# Summary

The Infrastructure Architecture provides a simple, container-based runtime environment for TRP.

Version 1 prioritizes reliability, reproducibility, and operational simplicity over large-scale distributed systems.

The chosen architecture is intentionally conservative, allowing the platform to focus on delivering business value before introducing infrastructure complexity.
