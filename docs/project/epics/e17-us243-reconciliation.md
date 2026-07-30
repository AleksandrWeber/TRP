# US243 — Recovery State Reconciliation (Architecture Note)

**Release:** RC-17 · **Epic:** E17 · **Date:** 2026-07-30  
**Status:** Implemented (read-only reconciliation slice)

Related:

- [E17 Spec](./e17-runtime-recovery-specification.md) §4.4 S5 / US243
- [US242 Checkpoint](./e17-us242-checkpoint-validation.md)
- [Architecture Health](./e17-us243-architecture-health.md)
- [ADR-014](../../adr/ADR-014-runtime-lifecycle.md)

---

## Purpose

After `LEASE_ACQUIRED` + `VALID_CHECKPOINT`, reconcile persisted state across
participating contexts before recovery may continue.

Outcomes only:

- `RECONCILED`
- `RECONCILIATION_FAILED`

Read-only. No Runtime resume, Order/Accounting mutations, or checkpoint writes.

---

## Algorithm

```text
US241 LEASE_ACQUIRED + US242 VALID_CHECKPOINT
    ↓
Load Session (TradingSessionRepository.findById)
Load Runtime intents (StrategyRuntimePort.listSignalIntents)
Load Orders / Execution / Accounting / Risk via RecoveryReconciliationPorts
    ↓
Pure reconcileRecoveryState (deterministic findings sort)
    ├─ no findings → RECONCILED
    └─ findings    → RECONCILIATION_FAILED (failedContext = first by priority)
    ↓
Log recovery_state_reconciliation
```

Foreign BCs are reached only through `RECOVERY_RECONCILIATION_PORTS` (local
Symbol). Default stub is empty/consistent; real adapters bind at composition
root without Session importing Orders/Risk/Execution/Positions Prisma.

---

## Context comparison matrix

| Context          | Inputs compared                                            | Fail when                                       |
| ---------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| Prerequisite     | Lease + VALID checkpoint identity                          | Missing / mismatched prerequisite               |
| Session          | id, workspace, deployment, fence, paperAccount             | Identity/fence/deployment mismatch; missing row |
| Strategy Runtime | Checkpoint event/stream/seq; Intent session/deployment/seq | Checkpoint diverge; intent ahead of checkpoint  |
| Orders           | `tradingSessionId`, `paperAccountId`                       | Session/account mismatch                        |
| Execution        | Per-order exec snapshot                                    | Unknown order; `reconciliationRequired`         |
| Accounting       | `consistent` \| `mismatch` \| `unknown`                    | `mismatch`; missing/`unknown`                   |
| Risk (optional)  | Decision `sessionId`                                       | Decision session mismatch                       |

Finding priority: `prerequisite` → `missing_state` → `session` → `strategy_runtime` → `orders` → `execution` → `accounting` → `risk`.

---

## Residual

- Real Orders/Exec/Accounting/Risk adapters (list-by-session, read-only accounting compare without write).
- Durable mismatch Incident / RecoveryState (US249).
- Mutative exec reconcile commands remain post-Stage-3.
