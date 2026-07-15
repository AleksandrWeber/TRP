# 006 — Infrastructure Setup

Version: 1.0

Status: Approved

Document Type: Implementation Guide

---

# Purpose

This document defines the local infrastructure required to run the Trading Research Platform (TRP).

The objective is to establish a reproducible local environment using Docker Compose that mirrors the production architecture as closely as practical for Version 1.

At the end of this step, the backend and frontend are still mostly empty, but all supporting infrastructure is operational.

---

# Goal

After completing this step:

- Docker Compose is configured.
- PostgreSQL is running.
- Redis is running.
- MinIO is running.
- Internal Docker networking is configured.
- Persistent volumes are configured.
- Health checks are operational.

No application business logic should exist.

---

# Success Criteria

After this step:

- `docker compose up` starts all infrastructure services.
- PostgreSQL accepts connections.
- Redis accepts connections.
- MinIO Web Console is accessible.
- Data persists after container restart.
- Health checks report healthy status.

---

# Architecture References

This implementation follows:

- 018-Infrastructure.md
- 015-Security.md
- 020-Technology-Stack.md

---

# Infrastructure Components

Version 1 includes:

- PostgreSQL
- Redis
- MinIO

Application containers will be added later.

---

# Docker Compose Structure

Infrastructure configuration belongs to:

```
infrastructure/

docker/

compose/
```

The repository root should remain clean.

---

# PostgreSQL

Responsibilities:

- Primary database
- Persistent storage

Requirements:

- Persistent Docker volume
- Configurable credentials
- Health check enabled

---

# Redis

Responsibilities:

- Cache
- Job Queue
- Session storage

Requirements:

- Persistent volume (optional)
- Health check enabled

Redis stores no permanent business data.

---

# MinIO

Responsibilities:

- Object storage
- Reports
- Uploaded files
- Research artifacts

Requirements:

- Persistent volume
- Web Console enabled
- Configurable credentials

---

# Docker Network

All infrastructure services communicate through an isolated internal Docker network.

No database service should be directly exposed to the public Internet.

---

# Persistent Volumes

Persistent storage is required for:

- PostgreSQL
- MinIO

Containers must remain disposable.

---

# Environment Variables

Configuration is loaded from:

```
.env
```

The repository provides:

```
.env.example
```

Secrets must never be committed.

---

# Service Names

Official Docker service names:

- postgres
- redis
- minio

These names remain stable throughout Version 1.

---

# Health Checks

Every infrastructure service must define a health check.

Containers should not be considered operational until healthy.

---

# Restart Policy

Containers should restart automatically after unexpected failures.

Manual intervention should not normally be required.

---

# Port Management

Development ports should be configurable.

Port conflicts must be avoided.

Ports are defined through environment variables whenever practical.

---

# Logging

Containers should output structured logs.

Logs should be accessible through standard Docker commands.

No custom logging solution is required.

---

# Backup Preparation

Infrastructure layout should allow future backup automation.

No backup implementation is required during this step.

---

# Security

Development credentials are stored in local environment files.

Production credentials must never be reused.

Infrastructure services should expose only the ports required for development.

---

# Verification Checklist

Verify:

- PostgreSQL connection
- Redis connection
- MinIO login
- Docker network
- Persistent storage
- Health status

---

# Definition of Done

This step is complete when:

- Docker Compose starts successfully.
- PostgreSQL is healthy.
- Redis is healthy.
- MinIO is healthy.
- Persistent volumes work correctly.
- Environment variables are configured.

No application code depends on the infrastructure yet.

---

# Common Mistakes

Avoid:

- Hardcoded credentials.
- Missing health checks.
- Exposing databases publicly.
- Storing secrets in Git.
- Creating unnecessary containers.
- Mixing application code with infrastructure configuration.

---

# Next Step

Continue with:

007-Database-Foundation.md

---

# Summary

Infrastructure Setup establishes the local runtime environment required by TRP.

The infrastructure is intentionally minimal, reproducible, and fully containerized, providing a stable foundation for future backend and frontend development.
