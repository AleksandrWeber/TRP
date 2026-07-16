# 003 — Monorepo

Version: 1.0

Status: Approved

Document Type: Implementation Guide

---

# Purpose

This document defines the monorepo architecture used by the Trading Research Platform (TRP).

A monorepo allows all applications, shared libraries, infrastructure, and documentation to evolve together while maintaining clear boundaries between different parts of the system.

The repository structure should remain stable throughout Version 1.

---

# Goal

After completing this step:

- pnpm Workspace is configured.
- Applications are separated.
- Shared packages are isolated.
- Import rules are established.
- Workspace dependencies function correctly.

No business logic should be implemented.

---

# Success Criteria

After this step:

- Every application builds independently.
- Shared packages can be imported.
- Workspace dependencies resolve correctly.
- No circular dependencies exist.
- Project structure is stable.

---

# Architecture References

This implementation follows:

- 02-Architecture.md
- 012-Service-Architecture.md
- 017-Frontend-Architecture.md
- 020-Technology-Stack.md

---

# Why Monorepo

TRP consists of multiple applications sharing the same domain model.

Using separate repositories would duplicate:

- Types
- Validation schemas
- Configuration
- Utilities
- SDKs
- Documentation

A monorepo provides:

- Shared development workflow
- Shared versioning
- Easier refactoring
- Consistent tooling
- Simpler dependency management

---

# Repository Layout

```
trp/

apps/
packages/
docs/
infrastructure/
scripts/
```

Each top-level directory has a single responsibility.

---

# Applications

Applications are executable software.

```
apps/

api/
web/
```

Each application has:

- Independent build
- Independent configuration
- Independent startup
- Independent testing

Applications communicate through APIs and events.

They never access each other's internal implementation.

---

## Deferred Notes

A standalone worker is not part of the MVP monorepo. Add one only when a real asynchronous workload requires a separate runtime.

---

# Packages

Packages contain reusable code.

```
packages/

shared/
types/
config/
sdk/
ui/
```

Packages contain no application entry points.

Packages are reusable.

---

# Package Responsibilities

## shared

Generic utilities.

Examples:

- Helpers
- Utilities
- Constants

No business logic.

---

## types

Shared TypeScript types.

Examples:

- DTOs
- Domain models
- API contracts

Every application imports common types from here.

---

## config

Shared configuration.

Examples:

- Environment validation
- Shared constants
- Feature flags

Configuration should exist only once.

---

## sdk

API client.

Responsibilities:

- HTTP client
- WebSocket client
- Authentication helpers
- DTO mapping

The frontend communicates with the backend through the SDK.

---

## ui

Reusable UI components.

Examples:

- Buttons
- Cards
- Dialogs
- Tables
- Layout components

No business logic.

---

# Dependency Rules

Applications may depend on packages.

Packages may depend on other packages.

Applications must never depend on other applications.

Correct:

```
frontend

↓

sdk

↓

types
```

Incorrect:

```
frontend

↓

backend
```

---

# Import Rules

Always import through package boundaries.

Correct:

```
@trp/types

@trp/sdk

@trp/ui
```

Avoid long relative imports.

Incorrect:

```
../../../../shared
```

---

# Circular Dependencies

Circular dependencies are prohibited.

Examples:

```
A

↓

B

↓

A
```

Each package should have a clear dependency direction.

---

# Workspace Configuration

The workspace is managed using:

pnpm Workspaces

All applications share:

- Dependency installation
- Lock file
- Scripts

---

# Versioning

Versioning is centralized.

All applications use compatible package versions.

Duplicate dependency versions should be avoided.

---

# Shared Types

Domain models exist only once.

Examples:

Strategy

Experiment

Workflow

Report

Position

Order

The same type definitions are reused throughout the platform.

---

# Shared Validation

Validation schemas are reusable.

The backend validates requests.

The frontend reuses the same schemas where appropriate.

Validation logic should not be duplicated.

---

# Shared Configuration

Environment validation should exist only once.

Applications import validated configuration.

Configuration parsing should never be duplicated.

---

# Package Naming

Internal packages use a common namespace.

Examples:

```
@trp/types

@trp/sdk

@trp/ui

@trp/config

@trp/shared
```

---

# Build Independence

Each application should be buildable independently.

Examples:

Frontend build

Backend build

Worker build

Failure in one build should not prevent development of unrelated components.

---

# Testing

Packages include their own tests.

Applications include application-specific tests.

Shared code should be tested only once.

---

# Documentation

Every application includes its own README.

Every package includes its own README.

Documentation explains purpose rather than implementation.

---

# Definition of Done

This step is complete when:

- Workspace is configured.
- Applications are separated.
- Shared packages exist.
- Import rules are enforced.
- Circular dependencies are prevented.
- Project builds successfully.

---

# Common Mistakes

Avoid:

- Business logic inside shared packages.
- Direct application-to-application imports.
- Duplicate type definitions.
- Duplicate configuration.
- Relative imports across applications.
- Circular dependencies.

---

# Next Step

Continue with:

004-Backend-Foundation.md

---

# Summary

The TRP monorepo establishes a modular, maintainable, and scalable repository structure.

Applications remain independent while sharing reusable packages through clearly defined boundaries.

This architecture minimizes duplication, simplifies development, and provides a stable foundation for long-term platform evolution.
