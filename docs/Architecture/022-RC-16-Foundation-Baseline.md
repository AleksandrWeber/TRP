# RC-16 Foundation Baseline

Last verified: 2026-07-18  
Milestone: RC-16 M3 Foundations  
Status: **RC-16 Foundations COMPLETE**

## 1. Executive Summary

RC-16 Foundations establish the minimum authenticated, workspace-aware browser
runtime required by later RC-16 work. The baseline aligns the passwordless
development authentication contract, guarantees a usable development identity
at API startup, discovers or creates an active workspace, and propagates the
resulting workspace identifier to workspace-scoped API requests.

Completed work:

- US001 — Authentication Contract
- US002 — Workspace Bootstrap
- US002A — Development Identity Bootstrap
- Stabilization Sprint S1

The implementation remains a modular monolith. Authentication, Identity, and
Workspace retain separate module boundaries. The frontend owns browser session
restoration through local storage and a shared API client.

This baseline is considered stable because it was verified through live-browser
login, cold API starts, repeated API restarts, JWT validation, idempotent
workspace bootstrap, page refresh, logout and re-login, dashboard loading,
Knowledge API access, and regression tests.

## 2. System Architecture

```text
Frontend
  ↓
Shared API Client
  ↓
Authentication
  ↓
JWT
  ↓
Workspace Bootstrap
  ↓
Protected Routes
  ↓
Dashboard
  ↓
Knowledge API
```

### Layer responsibilities

- **Frontend:** renders login and protected application routes and coordinates
  the browser session.
- **Shared API Client:** builds versioned API URLs, injects the JWT and active
  workspace ID when available, handles HTTP failures, and clears the session
  after a `401`.
- **Authentication:** validates the submitted email against runtime Identity
  and issues a signed JWT. It does not create users during login.
- **JWT:** authenticates subsequent requests and carries the runtime user ID,
  email, and role.
- **Workspace Bootstrap:** returns the earliest active workspace owned by the
  authenticated user or creates the default workspace when none exists.
- **Protected Routes:** `RequireAuth` blocks unauthenticated navigation and
  ensures workspace bootstrap runs for restored sessions.
- **Dashboard:** loads workflows, experiments, Knowledge entries, and
  deployment summaries after authentication and workspace bootstrap.
- **Knowledge API:** demonstrates the workspace-scoped request boundary by
  requiring `X-Workspace-Id`.

## 3. Authentication Flow

```text
Browser
  ↓
LoginPage
  ↓ POST /v1/auth/login
AuthController
  ↓
AuthenticationService.login(email)
  ↓
UserDomainService / InMemoryUserRepository
  ↓
JWT generation
  ↓
JWT returned to browser
  ↓
trp_access_token stored in localStorage
  ↓ POST /v1/workspaces/bootstrap
Workspace discovered or created
  ↓
trp_active_workspace stored in localStorage
  ↓
Navigate to Dashboard
  ↓
Protected API requests
  ↓
Authorization: Bearer <JWT>
X-Workspace-Id: <workspace id>
```

`POST /v1/auth/login` accepts:

```json
{
  "email": "admin@trp.local"
}
```

The runtime is passwordless by design. On successful login,
`AuthenticationService` returns `accessToken`, `expiresIn`, and the active
Identity profile. JWT generation is reached only after an active user is found.

`GET /v1/auth/me` validates a bearer token and resolves the current runtime
Identity profile. The endpoint is available and verified, but the current UI
does not invoke it during startup.

## 4. Workspace Flow

```text
Successful login or restored JWT
  ↓
POST /v1/workspaces/bootstrap
  ↓
Find active workspaces owned by JWT user
  ├─ found → return earliest active workspace
  └─ missing → create "Default Workspace"
  ↓
Persist Workspace through WorkspaceRepository
  ↓
Store { id, name } as trp_active_workspace
  ↓
Shared API Client reads active workspace
  ↓
X-Workspace-Id propagated to API requests
  ↓
Workspace-scoped APIs
```

Bootstrap executes:

1. immediately after successful login in `LoginPage`; and
2. from `RequireAuth` when protected routing initializes, including page
   refresh with a restored JWT.

The operation is idempotent. It returns an existing active workspace instead of
creating another one. Concurrent calls for the same owner in one process share
the in-flight bootstrap promise.

Workspace records are persisted through `PrismaWorkspaceRepository` and loaded
into the Workspace domain cache during API module initialization.

## 5. Startup Flow

### API startup

```text
API process
  ↓
IdentityModule
  ↓
DevelopmentIdentityBootstrap.onModuleInit()
  ↓ development environment only
Find admin@trp.local
  ├─ found → no-op
  └─ missing → create canonical Admin identity
  ↓
API ready
```

Development bootstrap is skipped in production, tests, and Vitest. It runs once
per development process initialization and is idempotent within that process.

### Browser startup

```text
React application
  ↓
Read trp_access_token
  ↓
RequireAuth
  ├─ missing token → redirect /login
  └─ token present → bootstrap workspace
                         ↓
                    restore/update workspace
                         ↓
                    render protected route
```

The browser restores session state from local storage. No cookie or
session-storage session is used.

## 6. Request Flow

### Public authentication request

`POST /v1/auth/login`

```http
Content-Type: application/json
```

No bearer token or workspace header is required.

### Authenticated identity request

`GET /v1/auth/me`

```http
Authorization: Bearer <JWT>
```

### Workspace bootstrap request

`POST /v1/workspaces/bootstrap`

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

The frontend sends `{}` as the request body. `X-Workspace-Id` is not required
to discover the workspace; after a workspace is already stored, the shared
client may also attach that header.

### Workspace-scoped request

For example, `GET /v1/knowledge`:

```http
Authorization: Bearer <JWT>
X-Workspace-Id: <active workspace id>
```

The bearer token establishes the actor. `X-Workspace-Id` establishes the
workspace scope. The shared API client currently injects both headers whenever
their corresponding local-storage values exist, while preserving explicitly
provided request headers.

## 7. Runtime Components

### Identity Module

Owns the runtime `UserDomainService` and `InMemoryUserRepository`. It also owns
development identity bootstrap. It does not depend on Prisma for authentication
identities.

### Authentication Module

Exposes registration, login, `/auth/me`, JWT validation, role guards, and
command authorization. `AuthenticationService.login` only resolves an existing
active Identity and issues a JWT.

### Workspace Module

Owns workspace creation, discovery, persistence, startup rehydration, and
owner-based access checks. `WorkspaceController` exposes authenticated,
idempotent bootstrap.

### Shared API Client

`apps/web/src/shared/api.ts` is the frontend HTTP boundary. It:

- uses the `/v1` API prefix;
- serializes request bodies;
- adds `Authorization` from `trp_access_token`;
- adds `X-Workspace-Id` from `trp_active_workspace`;
- clears browser authentication state on `401`;
- reports unreachable API and non-success responses.

### Auth Context

There is currently no React Context provider. Browser auth/workspace state is
encapsulated by `apps/web/src/shared/auth.ts`, which reads, writes, and clears
the two local-storage records. `clearAccessToken()` also clears the active
workspace.

### RequireAuth

Guards protected routes, redirects missing/invalid sessions to `/login`, and
re-runs workspace bootstrap when protected routing initializes.

### Dashboard

Loads workflows, experiments, Knowledge entries, and deployments after the
protected route is available. Failed aggregate loading is displayed as a
dashboard error.

### Knowledge API

Requires a valid workspace ID through `X-Workspace-Id`, validates that the
workspace exists, and returns Knowledge entries scoped to that workspace.

## 8. Known Technical Debt

1. **Development Identity is in memory.** Its runtime UUID changes after every
   API restart. This is accepted for the development-only foundation and avoids
   prematurely coupling Identity to Prisma.
2. **Development authentication is passwordless.** Email presence in runtime
   Identity is sufficient for login. Credential hardening is deferred beyond
   this development baseline.
3. **Workspace bootstrap has two frontend callers.** `LoginPage` bootstraps
   before navigation and `RequireAuth` bootstraps during protected-route
   initialization. The endpoint is idempotent, so this is safe; consolidation
   is deferred.
4. **React Strict Mode duplicates effects in development.** This can duplicate
   bootstrap and Dashboard read requests during development. Runtime operations
   involved here are idempotent/read-only.
5. **`GET /v1/auth/me` is unused by the UI.** It remains the verified API for
   explicit token/profile validation, but startup currently relies on JWT plus
   workspace bootstrap.
6. **Persistent Identity remains future work.** Prisma-backed runtime identity,
   stable user IDs, durable credentials, and restart-safe ownership linkage
   were intentionally excluded from US002A.
7. **Multi-workspace support remains future work.** The current bootstrap
   selects the earliest active owned workspace. There is no workspace selector,
   invitation model, or general membership administration UI.
8. **Development bootstrap identity and durable Workspace ownership can
   diverge after restart.** Because the Identity UUID changes while Workspace
   records persist, the restarted development user can receive a new default
   workspace. Stable cross-restart ownership depends on future persistent
   Identity.

## 9. Architectural Decisions

### Development identity is created at module startup

`DevelopmentIdentityBootstrap` runs from `IdentityModule` initialization. This
ensures the canonical account exists before requests are served and keeps
provisioning outside login.

### Authentication never creates users

Login only resolves an existing active Identity. This preserves a clear
boundary between provisioning and authentication and prevents arbitrary email
login from silently creating accounts.

### Runtime Identity remains isolated from Prisma

US002A addresses development usability without introducing persistent
credential architecture. The legacy Prisma seed is not the authentication
runtime source of truth.

### Workspace bootstrap is a dedicated idempotent command

`POST /v1/workspaces/bootstrap` can discover or create state without turning a
GET such as `/auth/me` into a mutation or coupling Authentication to Workspace.

### Active workspace is browser state

The frontend stores only the active workspace ID and name. It does not embed
workspace selection into the JWT.

### Shared API client injects cross-cutting headers

Central injection of `Authorization` and `X-Workspace-Id` prevents individual
pages from independently implementing authentication and workspace scope.

### Unauthorized responses clear the browser session

A `401` removes both token and active workspace and redirects protected browser
navigation to login.

## 10. Verification History

This baseline was established through:

- affected backend Identity, Authentication, Workspace, guard, and JWT tests;
- frontend shared auth/API tests and TypeScript checking;
- development cold start without manual registration;
- API stop/start and three consecutive restart/login cycles;
- verification that development identity bootstrap runs exactly once per
  process and does not execute during login;
- login, JWT issuance, and `GET /v1/auth/me`;
- workspace creation, discovery, persistence, repeated bootstrap, and refresh;
- live-browser inspection of requests, responses, console, local storage,
  session storage, and navigation;
- logout and login-again verification;
- Dashboard and Knowledge loading with `X-Workspace-Id`;
- final end-to-end and regression audit after shared API client fixes.

The verified browser journey was:

```text
Start API
  → open /login
  → login as admin@trp.local
  → receive and store JWT
  → bootstrap and store workspace
  → navigate to Dashboard
  → load Knowledge with X-Workspace-Id
  → refresh successfully
  → logout
  → login successfully again
```

This document reflects the verified implementation at the completion of the
RC-16 Foundations baseline. It does not describe future US003 functionality.
