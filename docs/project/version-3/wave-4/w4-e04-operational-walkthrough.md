# W4-E04 Operational Walkthrough

**Package:** W4-E04 Kraken Adapter (factory)  
**Evidence slice:** W4-E04-e  
**Date:** 2026-08-28  
**Nature:** Package operational verification walkthrough. Not REST I/O. Not WebSocket I/O. Not live Kraken connection. Not Connected fabrication. Not Production Ready.

---

## Complete package journey

```text
Kraken Exchange Connectivity inventory & honesty baseline (W4-E04-a)
        ↓
Persist Kraken exchange connectivity anchors (W4-E04-b — workspace_kraken_exchange_connectivity_states)
        ↓
Restart application (normal process restart)
        ↓
Recover state (W4-E04-c — integrity-gated hydrate; deterministic; idempotent)
        ↓
Derive readiness (W4-E04-d — Recovering | Ready | Degraded | Unavailable)
        ↓
Platform operational (GET /v1/operational-continuity/readiness + UI krakenExchangeConnectivity view)
        ↓
Package operational integrity (W4-E04-e — Close Evidence)
```

**Without:** REST I/O · WebSocket I/O · Live Kraken connection · Connected fabrication · Order placement · Market data streaming · Exchange Connectivity Complete · Live Trading · Production Ready

---

## Step evidence

### 1. Inventory (W4-E04-a)

Machine and product inventory records SURVIVE/EPHEMERAL Kraken exchange connectivity artifacts on `exchange-adapter` and consumed owners. Honest baseline: `kraken` remains Exchange Scope catalog label with `liveAdapter: false`; no Kraken adapter, REST client, or WS client; Connection Management validate routes to `PlannedExchangeHandshakeAdapter(KRAKEN)` returning `not_implemented`; Connected product rules frozen; Exchange Connectivity Complete not authorized.

### 2. Persist state (W4-E04-b)

`KrakenExchangeConnectivityPersistenceService` write-through to `workspace_kraken_exchange_connectivity_states` via `PrismaKrakenExchangeConnectivityStateRepository`. No second persistence owner. Workspace-scoped rows. Explicit Kraken connection and adapter anchor builders — no synthetic Connected flag.

### 3. Restart application

Normal API process restart with durable (`prisma`) driver.

### 4. Recover state (W4-E04-c)

`KrakenExchangeConnectivityRestartRecoveryService.hydrate()`:

- Integrity gate before runtime cache import.
- Deterministic order (`workspaceId` ascending).
- Idempotent re-hydrate.
- Missing rows → empty (no fabrication).
- Corrupt rows → fail honest / Unavailable path.
- Continuity outcomes recorded for W4-E04-d.

### 5. Derive readiness (W4-E04-d)

Kraken exchange connectivity operational continuity evaluates recovered state + owner health:

- Supported states only: Recovering | Ready | Degraded | Unavailable.
- Ready requires integrity verification — never hardcoded.
- Integrity failure → Degraded.
- Recovery failure → Unavailable.
- Healthy Kraken exchange connectivity continuity continues while other analytical owners are degraded (no deps).

### 6. Platform operational

`GET /v1/operational-continuity/readiness` and UI `/operational-continuity` expose:

- Kraken exchange connectivity operational state
- Owner readiness
- Recovery timestamp / duration
- Restored workspace and connection anchor counts

Do **not** expose Connected labels, REST test controls, WebSocket streams, order placement, or Live Trading readiness.

### 7. Package integrity (W4-E04-e)

Close Evidence verifies complete chain, governance, architecture, and Honest Product rules. Product Owner Close is a separate governance act — e slice registry does not declare package CLOSED.

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

**STOP.** Walkthrough evidences foundation scope only. W4-E04 **not CLOSED**. Do not declare Exchange Connectivity Complete. Do not declare Kraken Connected. Do not open W4-E05.
