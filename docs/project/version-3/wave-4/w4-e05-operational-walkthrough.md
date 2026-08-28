# W4-E05 Operational Walkthrough

**Package:** W4-E05 Venue Permission Verification  
**Evidence slice:** W4-E05-e  
**Date:** 2026-08-28  
**Nature:** Package operational verification walkthrough. Not vendor permission probe I/O. Not Permission verified label fabrication. Not Production Ready.

---

## Complete package journey

```text
Venue Permission inventory & honesty baseline (W4-E05-a)
        ↓
Persist venue permission verification anchors (W4-E05-b — workspace_venue_permission_verification_states)
        ↓
Restart application (normal process restart)
        ↓
Recover state (W4-E05-c — integrity-gated hydrate; deterministic; idempotent)
        ↓
Derive readiness (W4-E05-d — Recovering | Ready | Degraded | Unavailable)
        ↓
Platform operational (GET /v1/operational-continuity/readiness + UI venuePermissionVerification view)
        ↓
Package operational integrity (W4-E05-e — Close Evidence)
```

**Without:** Vendor permission probe I/O · Permission verified label fabrication · Hardcoded default as vendor-reported · Live Trading · Exchange Connectivity Complete · Production Ready

---

## Step evidence

### 1. Inventory (W4-E05-a)

Machine and product inventory records SURVIVE/EPHEMERAL venue permission artifacts on `exchange-adapter` and consumed owners. Honest baseline: hardcoded `apiPermissions` defaults in `ExchangeManager.readApiPermissions()` are not authoritative; vendor-reported permissions required for Permission verified; Venue Permission Verification Complete not authorized.

### 2. Persist state (W4-E05-b)

`VenuePermissionVerificationPersistenceService` write-through to `workspace_venue_permission_verification_states` via `PrismaVenuePermissionVerificationStateRepository`. No second persistence owner. Workspace-scoped rows. Explicit permission verification anchor builders — no synthetic Permission verified flag.

### 3. Restart application

Normal API process restart with durable (`prisma`) driver.

### 4. Recover state (W4-E05-c)

`VenuePermissionRestartRecoveryService.hydrate()`:

- Integrity gate before runtime cache import.
- Deterministic order (`workspaceId` ascending).
- Idempotent re-hydrate.
- Missing rows → empty (no fabrication).
- Corrupt rows → fail honest / Unavailable path.
- Continuity outcomes recorded for W4-E05-d.

### 5. Derive readiness (W4-E05-d)

Venue Permission Verification operational continuity evaluates recovered state + owner health:

- Supported states only: Recovering | Ready | Degraded | Unavailable.
- Ready requires integrity verification — never hardcoded.
- Integrity failure → Degraded.
- Recovery failure → Unavailable.
- Healthy venue permission continuity continues while other analytical owners are degraded (no deps).

### 6. Platform operational

`GET /v1/operational-continuity/readiness` and UI `/operational-continuity` expose:

- Venue Permission Verification operational state
- Owner readiness
- Recovery timestamp / duration
- Restored and verified anchor counts

Do **not** expose Permission verified labels, vendor probe controls, or Live Trading readiness.

### 7. Package integrity (W4-E05-e)

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

**STOP.** Walkthrough evidences foundation scope only. W4-E05 **not CLOSED**. Await Product Owner Package Review. Do not declare Venue Permission Verification Complete. Do not declare Exchange Connectivity Complete.
