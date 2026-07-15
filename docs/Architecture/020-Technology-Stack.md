# 020 — Technology Stack

Version: 1.1

Status: Approved

Document Type: Architecture Specification

Source of truth: [`../CANONICAL.md`](../CANONICAL.md)

---

# Purpose

The Technology Stack defines the official technologies approved for Version 1 of the Trading Research Platform (TRP).

If this file conflicts with `CANONICAL.md`, **CANONICAL.md wins**.

Technology choices prioritize stability, developer productivity, and long-term maintainability over novelty.

---

# Philosophy

Technology exists to support the product.

The platform favors proven, widely adopted technologies with strong ecosystems and long-term support.

Introducing additional technologies requires a clear technical justification.

---

# Guiding Principles

Technology selection follows these principles:

- Simplicity over complexity
- Proven over experimental
- Stability over trends
- Productivity over novelty
- One tool per responsibility

---

# Frontend

| Purpose       | Technology      |
| ------------- | --------------- |
| Language      | TypeScript      |
| Framework     | React           |
| Build Tool    | Vite            |
| Routing       | React Router    |
| UI Components | shadcn/ui       |
| Styling       | Tailwind CSS    |
| Icons         | Lucide React    |
| Forms         | React Hook Form |
| Validation    | Zod             |
| Server State  | TanStack Query  |
| Charts        | Recharts        |
| Tables        | TanStack Table  |

---

# Backend

| Purpose        | Technology           |
| -------------- | -------------------- |
| Runtime        | Node.js (LTS)        |
| Language       | TypeScript           |
| Framework      | NestJS               |
| HTTP Adapter   | Fastify (via NestJS) |
| Validation     | Zod                  |
| ORM            | Prisma               |
| Authentication | JWT                  |
| API            | REST + WebSocket     |

---

# Database

| Purpose          | Technology          |
| ---------------- | ------------------- |
| Primary Database | PostgreSQL          |
| Cache            | Redis — when needed |
| Object Storage   | MinIO — when needed |

---

# Background Processing

| Purpose       | Technology                                        |
| ------------- | ------------------------------------------------- |
| Job Queue     | BullMQ — only when a real async queue is required |
| Queue Backend | Redis                                             |

Do not introduce BullMQ during Sprint 0 / early Stage 0 unless experiment volume forces it.

---

# Infrastructure

| Purpose             | Technology     |
| ------------------- | -------------- |
| Containers          | Docker         |
| Local Orchestration | Docker Compose |
| Reverse Proxy       | Nginx          |

---

# AI Integration

| Purpose          | Technology                         |
| ---------------- | ---------------------------------- |
| AI               | OpenRouter Gateway                 |
| Role             | Summaries / explanations only      |
| Embeddings / RAG | Out of scope V1 — see `../future/` |

AI never controls capital. See [`007-AI-Gateway.md`](./007-AI-Gateway.md).

---

# Development Tools

| Purpose         | Technology       |
| --------------- | ---------------- |
| IDE             | VS Code / Cursor |
| Version Control | Git              |
| Repository      | GitHub           |
| Package Manager | pnpm             |
| Formatter       | Prettier         |
| Linter          | ESLint           |
| Git Hooks       | Husky            |

---

# Testing

| Purpose            | Technology |
| ------------------ | ---------- |
| Unit Testing       | Vitest     |
| Backend Testing    | Jest       |
| End-to-End Testing | Playwright |

---

# Documentation

| Purpose               | Technology        |
| --------------------- | ----------------- |
| Architecture          | Markdown          |
| API Documentation     | OpenAPI (Swagger) |
| Project Documentation | Markdown          |

---

# Configuration

Configuration is externalized.

Sources include:

- Environment Variables
- Docker Compose
- Configuration files

Configuration is never hardcoded.

---

# Security

Security technologies include:

- HTTPS
- TLS
- JWT
- bcrypt
- Environment Secrets

Advanced secret management systems are intentionally postponed until future versions.

---

# Logging

Version 1 uses structured application logs.

Centralized logging may be introduced in future versions if operational requirements justify it.

---

# Monitoring

Version 1 includes:

- Health Checks
- Container Status
- Basic System Metrics

Advanced observability platforms are outside the scope of Version 1.

---

# Monorepo

| Purpose         | Technology |
| --------------- | ---------- |
| Package Manager | pnpm       |
| Monorepo        | Turborepo  |

---

# Package Management Rules

Technology duplication should be avoided.

Examples:

One ORM.

One validation library.

One form library.

One chart library.

One table library.

Multiple technologies solving the same problem require explicit justification.

---

# Upgrade Policy

Dependencies should be updated regularly.

Major version upgrades require testing before adoption.

Security updates receive highest priority.

---

# Technologies Intentionally Excluded

The following technologies are intentionally excluded from Version 1:

- Kubernetes
- Kafka
- Elasticsearch
- GraphQL
- Microfrontend Architecture
- Service Mesh
- Vault
- Terraform
- AWS-specific services

These technologies may be introduced only when justified by real operational requirements.

---

# Success Criteria

A successful Technology Stack:

- Is simple
- Is stable
- Is well documented
- Minimizes unnecessary dependencies
- Supports rapid development
- Supports long-term maintenance

---

# Relationship to Other Documents

Related specifications:

- 017-Frontend-Architecture.md
- 018-Infrastructure.md
- 019-Deployment.md

---

# Summary

The Technology Stack establishes a single, approved set of technologies for Version 1 of TRP.

The selected technologies prioritize simplicity, reliability, and developer productivity while providing a solid foundation for future platform evolution.

Technology decisions should remain stable throughout Version 1 to avoid unnecessary complexity and development delays.
