# W4-E01 Operational Walkthrough

**Package:** W4-E01 Binance Real I/O  
**Evidence slice:** W4-E01-e  
**Date:** 2026-08-28  
**Nature:** Package operational verification walkthrough. Not REST I/O. Not WebSocket I/O. Not live Binance connection. Not Connected fabrication. Not Production Ready.

---

## Complete package journey

```text
Exchange Connectivity inventory & honesty baseline (W4-E01-a)
        ↓
Persist exchange connectivity anchors (W4-E01-b — workspace_exchange_connectivity_states)
        ↓
Restart application (normal process restart)
        ↓
Recover state (W4-E01-c — integrity-gated hydrate; deterministic; idempotent)
        ↓
Derive readiness (W4-E01-d — Recovering | Ready | Degraded | Unavailable)
        ↓
Platform operational (GET /v1/operational-continuity/readiness + UI exchangeConnectivity view)
        ↓
Package operational integrity (W4-E01-e — Close Evidence)
```

**Without:** REST I/O · WebSocket I/O · Live Binance connection · Connected fabrication · Order placement · Market data streaming · Exchange Connectivity Complete · Live Trading · Production Ready

---

## Step evidence

### 1. Inventory (W4-E01-a)

Machine and product inventory records SURVIVE/EPHEMERAL exchange connectivity artifacts on `exchange-adapter` and consumed owners. Honest baseline: `BinanceExchangeAdapter` remains stub; Connection Management validate performs real signed REST; Connected product rules frozen; Exchange Connectivity Complete not authorized.

### 2. Persist state (W4-E01-b)

`ExchangeConnectivityPersistenceService` write-through to `workspace_exchange_connectivity_states` via `PrismaExchangeConnectivityStateRepository`. No second persistence owner. Workspace-scoped rows. Explicit connection and adapter anchor builders — no synthetic Connected flag.

### 3. Restart application

Normal API process restart with durable (`prisma`) driver.

### 4. Recover state (W4-E01-c)

`ExchangeConnectivityRestartRecoveryService.hydrate()`:

- Integrity gate before runtime cache import.
- Deterministic order (`workspaceId` ascending).
- Idempotent re-hydrate.
- Missing rows → empty (no fabrication).
- Corrupt rows → fail honest / Unavailable path.
- Continuity outcomes recorded for W4-E01-d.

### 5. Derive readiness (W4-E01-d)

Exchange connectivity operational continuity evaluates recovered state + owner health:

- Supported states only: Recovering | Ready | Degraded | Unavailable.
- Ready requires integrity verification — never hardcoded.
- Integrity failure → Degraded.
- Recovery failure → Unavailable.
- Healthy exchange connectivity continuity continues while other analytical owners are degraded (no deps).

### 6. Platform operational

`GET /v1/operational-continuity/readiness` and UI `/operational-continuity` expose:

- Exchange connectivity operational state
- Owner readiness
- Recovery timestamp / duration
- Restored workspace and connection anchor counts

Do **not** expose Connected labels, REST test controls, WebSocket streams, order placement, or Live Trading readiness.

### 7. Package integrity (W4-E01-e)

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

**STOP.** Walkthrough evidences foundation scope only. W4-E01 **CLOSED** by Product Owner. Do not declare Exchange Connectivity Complete. Do not declare Binance Connected. Do not open W4-E02.
