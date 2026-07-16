# 007 — Database Foundation

Version: 1.0

Status: Approved

Document Type: Implementation Guide

---

# Purpose

This document defines the database foundation for the Trading Research Platform (TRP).

The objective is to establish a reliable, maintainable, and scalable database layer before implementing any business functionality.

This step creates the database infrastructure, migration system, Prisma integration, and repository conventions.

No business entities are implemented yet.

---

# Goal

After completing this step:

- Prisma is installed.
- PostgreSQL is connected.
- Initial migration system is configured.
- Prisma Client is generated.
- Database connection is verified.
- Repository layer foundation is established.

No business tables should exist.

---

# Success Criteria

After this step:

- Prisma connects successfully.
- Database migrations execute successfully.
- Prisma Client is generated.
- Backend starts without database errors.
- Connection health is verified.

---

# Architecture References

This implementation follows:

- 011-Storage-Architecture.md
- 018-Infrastructure.md
- 020-Technology-Stack.md

---

# Technology

Database

PostgreSQL

ORM

Prisma

Migration System

Prisma Migrate

---

# Responsibilities

The database layer is responsible for:

- Persistent storage
- Schema management
- Transactions
- Data integrity
- Migrations

Business rules belong to application services.

---

# Project Structure

```
apps/api/

prisma/

schema.prisma

migrations/

seed.ts

src/

storage/

prisma/

repositories/
```

---

# Prisma Configuration

Prisma manages:

- Schema
- Migrations
- Generated Client

The Prisma schema is the single source of truth for database structure.

---

# Database Connection

Connection configuration is loaded from:

```
DATABASE_URL
```

The backend must fail during startup if the database connection cannot be established.

---

# Migrations

Schema changes are managed exclusively through migrations.

Rules:

- Every schema change creates a migration.
- Migrations are committed to Git.
- Existing migrations are never modified after they have been applied.
- Manual database changes are prohibited.

---

# Initial Schema

The initial schema contains only infrastructure metadata.

No business entities should be created.

The first business tables will be introduced later.

---

# Prisma Client

The Prisma Client is generated automatically.

Generated files must never be modified manually.

---

# Repository Layer

Repositories provide access to persistent data.

Responsibilities:

- CRUD operations
- Queries
- Transactions

Repositories do not contain business logic.

---

# Transactions

Business services control transactions.

Repositories participate in transactions but do not manage them.

---

# Seed Data

Seeding is optional.

If implemented, seed data should include only:

- Development configuration
- Demo data

Production data must never be seeded.

---

# Naming Conventions

Database:

snake_case

Tables:

Plural nouns

Columns:

snake_case

Primary Keys:

id

Foreign Keys:

<entity>_id

Timestamps:

created_at

updated_at

---

# Soft Delete

Version 1 does not implement global soft deletes.

Deletion strategy is defined individually for each business entity when required.

---

# Performance

Indexes should only be created when justified.

Avoid premature optimization.

Measure first.

Optimize second.

---

# Logging

Database errors should be logged.

Queries should not be logged in production unless debugging is required.

---

# Testing

Verify:

- Database connection
- Migration execution
- Prisma Client generation

Business repository tests are implemented later.

---

# Definition of Done

This step is complete when:

- PostgreSQL is connected.
- Prisma is configured.
- Initial migration executes.
- Prisma Client is generated.
- Backend starts successfully.

No business entities exist.

---

# Common Mistakes

Avoid:

- Manual schema changes.
- Business logic inside repositories.
- Editing generated Prisma Client.
- Skipping migrations.
- Creating unnecessary indexes.
- Logging sensitive database information.

---

# Next Step

Continue with:

008-API-Foundation.md

---

# Summary

The Database Foundation establishes the persistence layer for TRP.

It provides a stable, migration-based PostgreSQL foundation using Prisma while intentionally postponing all business entities until later implementation stages.
