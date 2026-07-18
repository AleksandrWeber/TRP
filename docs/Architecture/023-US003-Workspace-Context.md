# US003 — Workspace Context Propagation

Status: Implemented  
Scope: Frontend infrastructure extension to the verified RC-16 Foundation

## Responsibility

`WorkspaceProvider` is the reactive frontend source for the active workspace
inside protected routes. It exposes the strongly typed `activeWorkspace` and
the operation used to select another workspace. Workspace-aware pages consume
this boundary through `useWorkspace()` instead of maintaining local workspace
state or reading browser storage directly.

Workspace discovery remains owned by the existing bootstrap flow. The Context
does not authenticate users, validate JWTs, discover workspaces, or inject HTTP
headers.

## Data flow

```text
LoginPage or RequireAuth
  → existing workspace bootstrap
  → shared auth storage writes trp_active_workspace
  → WorkspaceProvider receives the active workspace
  → protected workspace-aware modules consume useWorkspace()
  → active workspace changes trigger dependent data reloads
```

`RequireAuth` mounts `WorkspaceProvider` only after its existing authentication
and workspace-bootstrap gate is ready. This keeps public routes outside the
workspace boundary and guarantees protected consumers receive a non-null
workspace.

## Shared API Client interaction

The Shared API Client remains the only HTTP header-injection boundary. It reads
the same persisted active workspace at request time and adds
`X-Workspace-Id`. Feature modules do not construct or override that header.

The Context selection operation persists the workspace before notifying React
consumers. Consequently, effects re-run for the new workspace and their API
requests use the matching header.

## Current consumers

- App layout displays the active workspace name.
- Dashboard reloads its workspace-aware aggregate when the workspace ID changes
  and ignores stale responses from the previous workspace.
- Knowledge reloads when the workspace ID changes and prevents an older request
  from replacing entries loaded for the current workspace.

## Extension points

Future Strategies, Experiments, Production, and Paper Trading UI modules should:

1. call `useWorkspace()` for active workspace identity;
2. include `activeWorkspace.id` in workspace-dependent effects or query keys;
3. use the Shared API Client for all requests; and
4. use the Context selection operation for workspace switching.

They must not duplicate workspace state or `X-Workspace-Id` injection.

## Preserved RC-16 boundaries

US003 does not change authentication, JWT lifecycle, Development Identity,
workspace bootstrap, login sequencing, protected-route decisions, or backend
workspace authorization. The RC-16 Foundation Baseline remains authoritative
for those responsibilities:
[`022-RC-16-Foundation-Baseline.md`](./022-RC-16-Foundation-Baseline.md).

## Remaining debt outside this story

- Workspace bootstrap still has two frontend callers (`LoginPage` and
  `RequireAuth`). The endpoint is idempotent; consolidation remains deferred.
- Backend workspace isolation is incomplete for several Dashboard aggregates.
  Knowledge validates `X-Workspace-Id` existence and scopes results; workflows,
  experiments, and production list endpoints still ignore the header. Membership
  and active-status enforcement also remain uneven. Those gaps are backend
  authorization work, not Workspace Context propagation.
