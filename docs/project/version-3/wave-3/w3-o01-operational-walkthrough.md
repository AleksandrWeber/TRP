# W3-O01 Operational Walkthrough

**Package:** W3-O01 Durable Analytical Stores  
**Evidence slice:** W3-O01-e  
**Date:** 2026-08-26  
**Nature:** Operational verification walkthrough. Not a Monitoring runbook. Not HA failover.

---

## Complete operational flow

```text
Platform Start
        ↓
Recovery (W3-O01-c — Durable* hydrate / loadRecoverableOwnerSnapshot)
        ↓
Owner Readiness Evaluation (W3-O01-d — boot outcomes + dependency degradation)
        ↓
Platform Readiness Projection (derived only from owner states)
        ↓
Operator Readiness View (Administration → Platform readiness)
        ↓
Graceful Degradation (Unavailable isolated; dependents Degraded per matrix)
        ↓
Operational State Matrix consistency (authoritative reference)
```

---

## Step evidence

### 1. Platform Start

Nest boots existing analytical owner modules. `PERSISTENCE_DRIVER=prisma` selects Durable\* adapters; memory driver remains honest empty/local.

### 2. Recovery

W3-O01-c recovery order (binding):

strategy-library → exchange-scope → knowledge-lake → market-profile → market-qualification → market-state → reporting → notification-delivery → trading-orchestrator → runtime-enforcement

- SURVIVE owners restore from `AnalyticalOwnerStoreSnapshot` when present.
- Missing snapshot → empty store (no fabrication).
- Corrupt snapshot → fail honest / owner Unavailable path (W3-O01-d isolation).

### 3. Owner Readiness Evaluation

Process-local boot outcomes (`ready` | `unavailable`) feed `evaluateOwnerOperationalStates`. Supported states only: Recovering | Ready | Degraded | Unavailable. Dependency Unavailable → dependent Degraded when own boot is Ready.

### 4. Platform Readiness Projection

`GET /v1/operational-continuity/readiness` returns:

- `platformState`
- `ownerStates`
- `unavailableOwners`
- `degradedOwners`
- `recoveryTimestamp`
- `recoveryDurationMs`

Platform state is derived solely from owners (no hardcoded global).

### 5. Operator Readiness View

UI: `/operational-continuity` (Administration → Platform readiness). Displays the same projection fields. Does **not** show monitoring dashboards, incident management, cluster, or replication.

### 6. Graceful Degradation

Verified against [`operational-state-matrix.md`](./operational-state-matrix.md):

- Unavailable owners never fabricate analytical data.
- Healthy / Ready owners continue when dependencies allow.
- Failures remain isolated to Unavailable owners and documented dependents.

### 7. Operational State Matrix consistency

Matrix owners and dependency columns match `W3_O01_C_RECOVERY_ORDER` / `W3_O01_C_RECOVERY_DEPENDENCIES`. EPHEMERAL ai-analytics remains intentionally transient (not SURVIVE recovery).

---

## Walkthrough result

| Gate                          | Result   |
| ----------------------------- | -------- |
| End-to-end operational flow   | **PASS** |
| Restart recovery path         | **PASS** |
| Platform readiness derived    | **PASS** |
| Operator view matches API     | **PASS** |
| Matrix matches implementation | **PASS** |
| No BC / HA / Monitoring claim | **PASS** |

---

**STOP.** Walkthrough evidences package readiness for Product Owner Close decision — it does not itself declare CLOSED.
