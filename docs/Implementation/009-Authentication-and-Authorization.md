# 009 — Authentication and Authorization

Version: 1.0

Status: Approved

Document Type: Implementation Guide

---

# Purpose

This document establishes the authentication and authorization foundation for the Trading Research Platform (TRP).

The objective is to securely identify the MVP administrator and protect access to platform resources.

No business-specific authorization rules are implemented during this step.

---

# Goal

After completing this step:

- User authentication is operational.
- JWT authentication is configured.
- Password hashing is implemented.
- Authorization guards are available.
- Protected API endpoints function correctly.

No trading functionality or business permissions are implemented.

---

# Success Criteria

After this step:

- User can authenticate.
- JWT access token is issued.
- Protected endpoints require authentication.
- Unauthorized requests are rejected.
- Passwords are securely hashed.

---

# Architecture References

This implementation follows:

- 015-Security.md
- 016-API-Architecture.md
- 020-Technology-Stack.md

---

# Authentication Method

Version 1 uses:

JWT Access Tokens

Refresh Tokens are intentionally postponed until required.

---

# Password Storage

Passwords must never be stored in plain text.

Use:

bcrypt

Only password hashes are stored.

---

# User Identity

Each user has:

- Unique ID
- Email
- Password Hash
- Created At
- Updated At

No additional profile information is required.

---

# Authentication Flow

```
Login Request

↓

Credential Validation

↓

Password Verification

↓

JWT Generation

↓

Authenticated Requests
```

---

# Authorization

The MVP has one authenticated Administrator.

Multi-role RBAC is deferred until a future multi-user requirement updates `CANONICAL.md`.

---

# Route Protection

Public endpoints:

- Login
- Health

All other endpoints require authentication unless explicitly marked as public.

---

# JWT Payload

The access token should contain only the minimum required information.

Example:

- User ID
- Role
- Token Version (optional)

Sensitive information must never be stored inside the token.

---

# Token Lifetime

Version 1 uses a short-lived access token.

The expiration time is configured through environment variables.

---

# Authentication Guards

Authentication is enforced through NestJS Guards.

Business modules should never perform manual authentication checks.

---

# Authorization Guards

Role verification is performed through dedicated authorization guards.

Permission logic remains centralized.

---

# Login Endpoint

Initial endpoint:

```
POST /api/v1/auth/login
```

Returns:

- Access Token
- User Information

---

# Logout

Version 1 performs client-side logout by removing the access token.

Server-side token revocation is postponed.

---

# Security

Authentication follows these principles:

- Least Privilege
- Secure by Default
- Never Trust Client Input

Every request is validated.

---

# Logging

Log:

- Successful login
- Failed login
- Unauthorized access

Never log:

- Passwords
- JWT tokens
- Secrets

---

# Testing

Verify:

- Login
- Invalid credentials
- Protected endpoints
- Role validation
- JWT expiration

---

# Definition of Done

This step is complete when:

- Login works.
- JWT authentication works.
- Protected endpoints require authentication.
- Roles are enforced.
- Password hashing is operational.

No business permissions are implemented.

---

# Common Mistakes

Avoid:

- Storing plain-text passwords.
- Logging tokens.
- Hardcoding secrets.
- Performing authorization inside controllers.
- Creating custom authentication logic outside NestJS Guards.

---

# Next Step

Continue with:

010-Event-System.md

---

# Summary

Authentication and Authorization establish the security foundation of TRP.

This implementation provides secure user identification and scalable access control while intentionally postponing advanced identity management features until future versions.
