# US242 — Recovery Checkpoint Discovery & Validation (Architecture Note)

**Release:** RC-17 · **Epic:** E17 · **Date:** 2026-07-30  
**Status:** Implemented (checkpoint validation slice)

Related:

- [E17 Spec](./e17-runtime-recovery-specification.md) §4.4 S3–S4 / US242
- [US241 Lease](./e17-us241-startup-recovery-lease.md)
- [ADR-014](../../adr/ADR-014-runtime-lifecycle.md)
- [Architecture Health](./e17-us242-architecture-health.md)

---

## Purpose

After US241 returns `LEASE_ACQUIRED`, discover the latest durable Strategy
Checkpoint and validate it is safe to continue recovery.

Outcomes only:

- `VALID_CHECKPOINT`
- `NO_CHECKPOINT`
- `INVALID_CHECKPOINT`

Read-only. No Runtime resume, Order reconcile, Market Feed, or checkpoint mutation.

---

## Algorithm

```text
US241 LEASE_ACQUIRED + US240 candidate
    ↓
Build LeasedRecoverySession (fencingToken required)
    ↓
StrategyRuntimePort.loadCheckpoint(workspaceId, sessionId)
    │  (one row per Session = deterministic latest)
    ├─ throws → INVALID_CHECKPOINT (load_failed)
    ├─ null   → NO_CHECKPOINT
    └─ row    → pure validateRecoveryCheckpoint
         ├─ integrity / identity / version / Session match
         ├─ OK → VALID_CHECKPOINT
         └─ fail → INVALID_CHECKPOINT
    ↓
Structured log: recovery_checkpoint_validation
```

Checkpoint ownership remains **Strategy Runtime**. Session reads only via
`STRATEGY_RUNTIME_PORT` (no Prisma checkpoint internals).

---

## Validation rules

| Rule                                                              | Invalid reason                |
| ----------------------------------------------------------------- | ----------------------------- |
| No successful lease                                               | `lease_required`              |
| Load throws / corrupt persist                                     | `load_failed`                 |
| Missing required fields / bad ISO / bad timeframe                 | `corrupted_checkpoint`        |
| `workspaceId` ≠ leased                                            | `workspace_mismatch`          |
| `sessionId` ≠ leased                                              | `session_mismatch`            |
| `deploymentId` ≠ candidate                                        | `deployment_mismatch`         |
| `runtimeVersion` not in supported set (`'1'`)                     | `unsupported_runtime_version` |
| Code schema version unsupported                                   | `unsupported_schema_version`  |
| `id` ≠ deterministic `scp_(workspace:session)`                    | `illegal_checkpoint_identity` |
| `version < 1`, negative sequence, or `fencingToken` on checkpoint | `illegal_runtime_state`       |

Recovery invariant: strategy checkpoints must **not** carry Session lease
authority (`fencingToken` belongs on the lease, not the checkpoint).

---

## Prohibitions

- No `arm` / `resume` / `evaluate` / `saveCheckpoint`
- No Session status mutation
- No Canonical Order Path / Orders / Accounting

---

## Residual toward full E17 US242

Full epic US242 also loads Orders, Fills, Position, Ledger, Portfolio, Risk,
Kill Switch into a serializable assembly. This Stage 3 slice covers **strategy
checkpoint discovery + validation** only; remaining assembly ports stay under
TD-036 / later E17 work.
