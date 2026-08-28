# W4-E02 Operational Walkthrough

**Package:** W4-E02 Bybit Real I/O  
**Evidence slice:** W4-E02-e  
**Date:** 2026-08-28  
**Nature:** Package operational verification walkthrough. Not REST I/O. Not WebSocket I/O. Not live Bybit connection. Not Connected fabrication. Not Production Ready.

---

## Complete package journey

```text
Bybit Exchange Connectivity inventory & honesty baseline (W4-E02-a)
        ↓
Persist Bybit exchange connectivity anchors (W4-E02-b — workspace_bybit_exchange_connectivity_states)
        ↓
Restart application (normal process restart)
        ↓
Recover state (W4-E02-c — integrity-gated hydrate; deterministic; idempotent)
        ↓
Derive readiness (W4-E02-d — Recovering | Ready | Degraded | Unavailable)
        ↓
Platform operational (GET /v1/operational-continuity/readiness + UI bybitExchangeConnectivity view)
        ↓
Package operational integrity (W4-E02-e — Close Evidence)
```

**Without:** REST I/O · WebSocket I/O · Live Bybit connection · Connected fabrication · Order placement · Market data streaming · Exchange Connectivity Complete · Live Trading · Production Ready

---

## Step evidence

### 1. Inventory (W4-E02-a)

Machine and product inventory records SURVIVE/EPHEMERAL Bybit exchange connectivity artifacts on `exchange-adapter` and consumed owners. Honest baseline: `BybitExchangeAdapter` remains stub; Connection Management validate routes to `PlannedExchangeHandshakeAdapter(BYBIT)` returning `not_implemented`; Connected product rules frozen; Exchange Connectivity Complete not authorized.

### 2. Persist state (W4-E02-b)

`BybitExchangeConnectivityPersistenceService` write-through to `workspace_bybit_exchange_connectivity_states` via `PrismaBybitExchangeConnectivityStateRepository`. No second persistence owner. Workspace-scoped rows. Explicit BYBIT connection and adapter anchor builders — no synthetic Connected flag.

### 3. Restart application

Normal API process restart with durable (`prisma`) driver.

### 4. Recover state (W4-E02-c)

`BybitExchangeConnectivityRestartRecoveryService.hydrate()`:

- Integrity gate before runtime cache import.
- Deterministic order (`workspaceId` ascending).
- Idempotent re-hydrate.
- Missing rows → empty (no fabrication).
- Corrupt rows → fail honest / Unavailable path.
- Continuity outcomes recorded for W4-E02-d.

### 5. Derive readiness (W4-E02-d)

Bybit exchange connectivity operational continuity evaluates recovered state + owner health:

- Supported states only: Recovering | Ready | Degraded | Unavailable.
- Ready requires integrity verification — never hardcoded.
- Integrity failure → Degraded.
- Recovery failure → Unavailable.
- Healthy Bybit exchange connectivity continuity continues while other analytical owners are degraded (no deps).

### 6. Platform operational

`GET /v1/operational-continuity/readiness` and UI `/operational-continuity` expose:

- Bybit exchange connectivity operational state
- Owner readiness
- Recovery timestamp / duration
- Restored workspace and connection anchor counts

Do **not** expose Connected labels, REST test controls, WebSocket streams, order placement, or Live Trading readiness.

### 7. Package integrity (W4-E02-e)

Close Evidence verifies complete chain, governance, architecture, and Honest Product rules. Product Owner Close recorded separately — e slice registry does not declare package CLOSED.

---

## Walkthrough outcome

| Step               | Verified |
| ------------------ | -------- |
| Inventory          | **Yes**  |
| Persistence        | **Yes**  |
| Restart            | **Yes**  |
| Recovery           | **Yes**  |
| Continuity         | **Yes**  |
| Platform Readiness | **Yes**  |
| Close Evidence     | **Yes**  |

---

**STOP.** Walkthrough evidences foundation scope only. W4-E02 **CLOSED** by Product Owner. Do not declare Exchange Connectivity Complete. Do not declare Bybit Connected. Do not open W4-E03.
