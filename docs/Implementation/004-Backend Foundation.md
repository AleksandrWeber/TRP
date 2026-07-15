# 004 — Backend Foundation

Version: 1.0

Status: Approved

Document Type: Implementation Guide

---

# Purpose

This document defines the initial backend foundation of the Trading Research Platform (TRP).

The objective is to establish a clean, modular, and scalable backend architecture before implementing any business logic.

The backend foundation provides the application skeleton that all future services and modules will build upon.

---

# Goal

After completing this step:

- NestJS project is initialized.
- TypeScript is configured.
- Project structure is created.
- Global configuration is established.
- Health endpoint is available.
- Application starts successfully.

No business logic, database models, or trading functionality should exist.

---

# Success Criteria

After this step:

- Backend starts successfully.
- Health endpoint responds.
- TypeScript compiles without errors.
- Lint passes.
- Tests pass.
- Folder structure matches the architecture.

---

# Architecture References

This implementation follows:

- 012-Service-Architecture.md
- 015-Security.md
- 016-API-Architecture.md
- 020-Technology-Stack.md

---

# Technology

Framework:

NestJS

Language:

TypeScript

Runtime:

Node.js LTS

Package Manager:

pnpm

---

# Backend Structure

```
apps/backend/

src/

app/

config/

core/

modules/

api/

events/

workflows/

storage/

common/

main.ts
app.module.ts
```

No additional directories should be created.

---

# Directory Responsibilities

## app/

Application bootstrap and global providers.

---

## config/

Environment configuration.

Configuration validation.

Application settings.

---

## core/

Core platform services.

Examples:

- Logger
- Exception Filters
- Interceptors
- Guards

Contains no business modules.

---

## modules/

Business modules.

Examples:

- Authentication
- Research
- Validation
- Production
- Knowledge

Initially empty.

---

## api/

REST controllers.

WebSocket gateways.

DTOs.

API versioning.

---

## events/

Event definitions.

Event publishers.

Event subscribers.

No business logic.

---

## workflows/

Workflow orchestration.

Initially empty.

---

## storage/

Database access.

Repositories.

Prisma integration.

Initially empty.

---

## common/

Reusable backend utilities.

Examples:

- Helpers
- Constants
- Utility functions

No business logic.

---

# Bootstrap

The application should:

- Load configuration.
- Configure logging.
- Enable validation.
- Enable CORS.
- Register global filters.
- Register global interceptors.

No module-specific configuration.

---

# Health Endpoint

The first endpoint:

GET

```
/api/v1/health
```

Returns:

- Service status
- Version
- Timestamp
- Uptime

Purpose:

Infrastructure verification.

---

# Configuration

Environment variables are validated during startup.

Application startup must fail if configuration is invalid.

---

# Validation

Global validation pipe is enabled.

Every future DTO will automatically use validation.

---

# Error Handling

Global exception filter.

Consistent error responses.

No stack traces exposed in production.

---

# Logging

Structured logging.

Every request should receive:

- Request ID
- Timestamp
- Method
- Route
- Status Code
- Duration

---

# CORS

Enabled.

Origins configured through environment variables.

Never hardcoded.

---

# API Prefix

Every endpoint begins with:

```
/api/v1
```

Versioning is mandatory.

---

# Swagger

OpenAPI is configured.

Available only in development.

Documentation generated automatically.

---

# Dependency Injection

NestJS Dependency Injection is the standard.

Manual service creation is prohibited.

---

# Testing

Initial tests:

- Application bootstrap
- Health endpoint

No business tests.

---

# Definition of Done

This step is complete when:

- Backend starts successfully.
- Health endpoint works.
- Swagger loads.
- Validation is enabled.
- Logging works.
- Lint passes.
- Tests pass.

---

# Common Mistakes

Avoid:

- Implementing business logic.
- Creating database models.
- Adding authentication.
- Creating research modules.
- Hardcoding configuration.
- Mixing infrastructure with business logic.

---

# Next Step

Continue with:

005-Frontend-Foundation.md

---

# Summary

The Backend Foundation establishes the technical framework for the TRP backend.

It provides a clean, modular NestJS application ready for future implementation while intentionally postponing all business functionality until later implementation stages.
