# 008 — API Foundation

Version: 1.0

Status: Approved

Document Type: Implementation Guide

---

# Purpose

This document establishes the API foundation for the Trading Research Platform (TRP).

The objective is to build a clean, versioned, and maintainable REST API before introducing authentication or business functionality.

This step creates the communication contract between the frontend and backend.

---

# Goal

After completing this step:

- REST API is configured.
- API versioning is enabled.
- Global request validation is active.
- Standard response format is established.
- Standard error format is established.
- Swagger documentation is available.

No business endpoints should exist.

---

# Success Criteria

After this step:

- Backend starts successfully.
- Swagger is available.
- API versioning works.
- Validation works.
- Standard error responses are returned.
- Health endpoint is documented.

---

# Architecture References

This implementation follows:

- 016-API-Architecture.md
- 017-Frontend-Architecture.md
- 020-Technology-Stack.md

---

# API Style

TRP uses REST.

Every endpoint follows predictable REST conventions.

GraphQL is intentionally excluded from Version 1.

---

# Base URL

Every endpoint begins with:

```
/api/v1
```

Example:

```
GET /api/v1/health
```

Future versions may introduce:

```
/api/v2
```

without breaking existing clients.

---

# Content Type

All requests and responses use:

```
application/json
```

---

# API Versioning

Versioning is URL-based.

Examples:

```
/api/v1/...

/api/v2/...
```

Only one active version exists during Version 1.

---

# Endpoint Naming

Resources use plural nouns.

Examples:

```
/projects

/strategies

/reports

/workflows
```

Avoid verbs in URLs.

Correct:

```
POST /projects
```

Incorrect:

```
POST /createProject
```

---

# HTTP Methods

Use standard HTTP semantics.

GET

Read data.

POST

Create resources.

PUT

Replace resources.

PATCH

Partial update.

DELETE

Remove resources.

---

# Response Format

Every successful response follows the same structure.

Example:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

The structure should remain consistent across all endpoints.

---

# Error Format

Every error response follows the same structure.

Example:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Project not found"
  }
}
```

Stack traces are never returned.

---

# Validation

All incoming requests are validated.

Validation failures return:

HTTP 400

Validation is automatic.

---

# Pagination

Collections use a standard pagination format.

Example:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 154
  }
}
```

Pagination is introduced only for collection endpoints.

---

# Filtering

Filtering uses query parameters.

Example:

```
GET /projects?status=active
```

---

# Sorting

Sorting uses query parameters.

Example:

```
GET /projects?sort=createdAt
```

Descending:

```
GET /projects?sort=-createdAt
```

---

# Health Endpoint

The first API endpoint is:

```
GET /api/v1/health
```

Returns:

- Status
- Version
- Timestamp
- Uptime

Purpose:

Infrastructure verification.

---

# OpenAPI

Swagger is enabled.

Available only in development.

Documentation is generated automatically.

Manual documentation is prohibited.

---

# DTO Rules

Every request uses DTOs.

Every response uses DTOs.

Business entities are never exposed directly.

---

# API Contracts

The API contract is considered stable.

Breaking changes require a new API version.

---

# Logging

Every request logs:

- Request ID
- Method
- Route
- Status
- Duration

Sensitive data must never be logged.

---

# Testing

Verify:

- Health endpoint
- Validation
- Error responses
- Swagger generation

Business endpoint tests are implemented later.

---

# Definition of Done

This step is complete when:

- REST API works.
- Versioning is configured.
- Validation is enabled.
- Standard responses are implemented.
- Swagger is available.
- Health endpoint is documented.

No business endpoints exist.

---

# Common Mistakes

Avoid:

- Returning database models directly.
- Inconsistent response formats.
- Verbs in endpoint URLs.
- Hardcoded API versions.
- Manual Swagger documentation.
- Exposing stack traces.

---

# Next Step

Continue with:

009-Authentication.md

---

# Summary

The API Foundation establishes a consistent, versioned REST API for TRP.

It provides a stable communication layer between frontend and backend while intentionally postponing authentication and business functionality.
