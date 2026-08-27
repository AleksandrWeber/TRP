# W3-O04 Operational Walkthrough

**Package:** W3-O04 Durable Kill Switch Product  
**Evidence slice:** W3-O04-e  
**Date:** 2026-08-27  
**Nature:** Package operational verification walkthrough. Not Kill Switch execution. Not Command Center. Not HA failover. Not Production Restart Safe.

---

## Complete package journey

```text
Kill Switch inventory & honesty baseline (W3-O04-a)
        ↓
Persist armed/cleared state (W3-O04-b — workspace_kill_switch_states)
        ↓
Restart application (normal process restart)
        ↓
Recover state (W3-O04-c — integrity-gated hydrate; deterministic; idempotent)
        ↓
Derive readiness (W3-O04-d — Recovering | Ready | Degraded | Unavailable)
        ↓
Platform operational (GET /v1/operational-continuity/readiness + UI killSwitch view)
        ↓
Package operational integrity (W3-O04-e — Close Evidence)
```

**Without:** Kill Switch execution · Command Center arm/clear · Admission blocking · Monitoring · HA · DR · Live Trading · Production Restart Safe

---

## Step evidence

### 1. Inventory (W3-O04-a)

Machine and product inventory records SURVIVE/EPHEMERAL Kill Switch artifacts on `trading-session`. Honest baseline: inactive admission policy stub, emergency controls unavailable, paper admission does not block while armed.

### 2. Persist state (W3-O04-b)

`KillSwitchPersistenceService` write-through to `workspace_kill_switch_states` via `PrismaKillSwitchStateRepository`. No second persistence owner. Workspace-scoped rows. Armed and cleared builders enforce integrity.

### 3. Restart application

Normal API process restart with durable (`prisma`) driver.

### 4. Recover state (W3-O04-c)

`KillSwitchRestartRecoveryService.hydrate()`:

- Integrity gate before runtime cache import.
- Deterministic order (`workspaceId` ascending).
- Idempotent re-hydrate.
- Missing rows → empty (no fabrication).
- Corrupt rows → fail honest / Unavailable path.

### 5. Derive readiness (W3-O04-d)

Kill Switch operational continuity evaluates recovered state + owner health:

- Supported states only: Recovering | Ready | Degraded | Unavailable.
- Ready requires integrity verification — never hardcoded.
- Integrity failure → Degraded.
- Recovery failure → Unavailable.
- Healthy Kill Switch continuity continues while other analytical owners are degraded (no deps).

### 6. Platform operational

`GET /v1/operational-continuity/readiness` and UI `/operational-continuity` expose:

- Kill Switch operational state
- Owner readiness
- Recovery timestamp / duration
- Restored and armed workspace counts

Do **not** expose arm/clear controls, Command Center emergency halt, admission block proof, Monitoring dashboard, or Live Trading readiness.

### 7. Package integrity (W3-O04-e)

Close Evidence verifies complete chain, governance, architecture, and Honest Product rules. Does not declare package CLOSED.

---

## Walkthrough result

| Gate                                            | Result   |
| ----------------------------------------------- | -------- |
| End-to-end package journey                      | **PASS** |
| Persist → restart → recover                     | **PASS** |
| Readiness derived after recovery                | **PASS** |
| Platform readiness matches implementation       | **PASS** |
| Honest Product (no execution / admission claim) | **PASS** |
| No Monitoring / Live Trading / BC / HA / DR     | **PASS** |

---

**STOP.** Walkthrough is Close Evidence only. Do **not** declare W3-O04 CLOSED. Do not declare Kill Switch COMPLETE. Await Product Owner Package Review.
