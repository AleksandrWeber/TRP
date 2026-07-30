# US241 — Recovery Lease Acquisition (Architecture Note)

**Release:** RC-17 · **Epic:** E17 · **Date:** 2026-07-30  
**Status:** Implemented (lease ownership slice)

Related:

- [E17 Spec](./e17-runtime-recovery-specification.md) §4.4 S2 / US241
- [US240 Discovery](./e17-us240-startup-recovery-discovery.md)
- [ADR-014](../../adr/ADR-014-runtime-lifecycle.md) Runtime ownership and lease
- [Architecture Health](./e17-us241-architecture-health.md)

---

## Purpose

After US240 identifies a recovery candidate, acquire **exclusive fenced lease
ownership** before any recovery work. Outcome is only:

- `LEASE_ACQUIRED`
- `LEASE_DENIED`

No checkpoint load, validation, reconcile, status→`RECOVERING`, or Runtime resume.

---

## Algorithm

```text
US240 candidate
    ↓
Load Session by (workspaceId, sessionId)
    ↓
Pure decideRecoveryLeaseAcquisition
    ├─ missing / expired / same-owner → plan new fence (lastFencingToken+1)
    └─ active foreign owner           → LEASE_DENIED (no write)
    ↓
Optimistic CAS saveIfVersion(expectedVersion)
    ├─ count = 1 → LEASE_ACQUIRED
    └─ count = 0 → LEASE_DENIED (version_conflict)
    ↓
Structured log: recovery_lease_acquisition
```

### Acquire conditions

| Condition                              | Outcome                                              |
| -------------------------------------- | ---------------------------------------------------- |
| No lease                               | `LEASE_ACQUIRED` (`missing_lease`)                   |
| Lease expired (wall-clock operational) | `LEASE_ACQUIRED` (`expired_lease`)                   |
| Same owner, lease still valid          | `LEASE_ACQUIRED` (`same_owner_reacquire`, new fence) |
| Other owner, lease not expired         | `LEASE_DENIED` (`active_foreign_lease`)              |
| CAS version mismatch                   | `LEASE_DENIED` (`version_conflict`)                  |
| Missing / mismatch / ineligible status | `LEASE_DENIED` (no write)                            |

### Mutation boundary

- **Allowed:** lease fields, `lastFencingToken`, `version`, `recordedAt`
- **Forbidden:** Session status transition, Runtime arm/evaluate, Outbox recovery orchestration, checkpoints

TTL default: **30_000 ms** (operational only; ADR-018 #53).

---

## Concurrency model

1. Decision is pure on a loaded snapshot.
2. Persistence uses `UPDATE … WHERE id AND workspace_id AND version = expected`.
3. Exactly one concurrent writer succeeds; losers receive deterministic `version_conflict`.
4. Single-writer principle preserved inside Trading Session (no new BC).

Owner id: `TRP_RUNTIME_OWNER_ID` or `api-{pid}-{hostname}`.

---

## Code map

| Artifact                                         | Role                              |
| ------------------------------------------------ | --------------------------------- |
| `domain/recovery-lease-acquisition.ts`           | Pure decide + attachRecoveryLease |
| `recovery/recovery-lease-acquisition.service.ts` | Bootstrap after discovery + CAS   |
| `TradingSessionRepository.saveIfVersion`         | Optimistic lease persist          |

---

## Residual

- Force Session `RECOVERING` still deferred (US240 residual / later S1).
- Stale-fence rejection on later commands remains existing Session fence checks (US245 Runtime arm uses new fence only).
