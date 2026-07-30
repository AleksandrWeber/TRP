# US240 — Startup Recovery Discovery (Architecture Note)

**Release:** RC-17 · **Epic:** E17 · **Date:** 2026-07-30  
**Status:** Implemented (discovery slice)

Related:

- [E17 Spec](./e17-runtime-recovery-specification.md) §4.4 S1 / US240
- [ADR-014](../../adr/ADR-014-runtime-lifecycle.md) Restart recovery step 1 (discover)
- [Architecture Health](./e17-us240-architecture-health.md)

---

## Purpose

Establish deterministic startup discovery of recoverable Trading Sessions
**before** any recovery execution begins.

This slice intentionally stops at discovery. It does **not** mark Sessions
`RECOVERING`, acquire leases, load checkpoints, reconcile, or resume Runtime.

---

## Algorithm

```text
Bootstrap (OnApplicationBootstrap)
    ↓
Load Sessions WHERE status ∈ {starting, running, paused, recovering, stopping}
    ↓
Filter by recovery eligibility (same set; terminals excluded)
    ↓
Sort ASC by (createdAt, id, workspaceId)
    ↓
If empty → outcome = no_recovery_required
Else     → outcome = recovery_candidate (exactly the first sorted Session)
    ↓
Structured log: startup_recovery_discovery
```

### Eligibility

| Eligible                                                  | Not eligible                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| `STARTING`, `RUNNING`, `PAUSED`, `RECOVERING`, `STOPPING` | `STOPPED`, `FAILED`                                              |
|                                                           | `CREATED` (non-terminal but not started)                         |
|                                                           | Unknown / non-ADR statuses (e.g. no `COMPLETED` in ADR-014 enum) |

### Determinism

- Selection does not depend on repository iteration order beyond durable fields.
- Multiple eligible Sessions never produce undefined behaviour: exactly one
  candidate is returned; remaining eligible IDs are logged in selection order.
- No wall-clock authority in selection (ADR-018 #49).

### Prohibitions (this slice)

- No Session status transition
- No lease acquire / heartbeat
- No checkpoint load
- No Order / Runtime / market feed work
- No Recovery Coordinator bounded context

---

## Code map

| Artifact                                         | Role                     |
| ------------------------------------------------ | ------------------------ |
| `domain/recovery-eligibility.ts`                 | Eligible status set      |
| `domain/startup-recovery-discovery.ts`           | Pure discover/select     |
| `recovery/startup-recovery-discovery.service.ts` | Nest bootstrap + logging |
| `TradingSessionRepository.findByStatuses`        | Persistent lookup        |

---

## Residual toward full E17 US240

Epic Spec US240 still requires force/`confirm` `RECOVERING`, audited
transition (including `STOPPING` → `RECOVERING`), and RecoveryState open at
phase `RECOVERING`. Those remain **out of scope** for this discovery slice and
are tracked under TD-036 / subsequent E17 stories (US241+, US249).
