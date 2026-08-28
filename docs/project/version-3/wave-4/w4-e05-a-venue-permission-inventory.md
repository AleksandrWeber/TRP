# W4-E05-a Venue Permission Inventory & Honesty Baseline

**Slice:** W4-E05-a — Venue Permission Inventory & Honesty Baseline  
**Package:** W4-E05 Venue Permission Verification (V3-E05)  
**Wave:** 4 — Exchange Connectivity  
**Date:** 2026-08-28  
**Nature:** Discovery and classification only. Not permission probe implementation. Not persistence. Not restart recovery. Not operational continuity.  
**Machine inventory:** `apps/api/src/platform-conformance/w4-e05-a-venue-permission-inventory.ts`

```text
This inventory does NOT implement venue permission verification.
This inventory does NOT implement vendor permission probe I/O.
This inventory does NOT implement persistence or restart recovery.
This inventory does NOT declare Venue Permission Verification Complete.
This inventory does NOT declare Exchange Connectivity Complete.
This inventory does NOT declare W4-E05 CLOSED or Wave 4 COMPLETE.
Customer-visible permission verification product remains unchanged until later slices + Product Owner Close.
```

---

## Purpose

Enumerate every venue permission artifact required to implement W4-E05: vendor-reported permissions, exchange-reported capabilities, permission verification state, integrity anchors, adapter and factory ownership, Connection Management and Vault dependencies, exchange catalog dependencies, runtime caches, in-memory permission state, placeholder/default values, hardcoded permission assumptions, and Honest Product boundaries. Classify each as **SURVIVE** or **EPHEMERAL** with explicit justification.

| Class         | Meaning                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **SURVIVE**   | Persists across API restart today, or is the durable substrate on existing Vault / Connection / Adapter / Scope owners.              |
| **EPHEMERAL** | Transient, hardcoded default, stub, planned-not-implemented, UI-only, process-local, or missing — must not be vendor-verified truth. |

---

## Binding finding

**Venue Permission Verification is NOT Complete. Permission verification does NOT survive restart from this slice. No customer-visible permission verification product exists.**

- **Vendor-reported permissions are authoritative** (target for W4-E05-b+).
- **Hardcoded default permissions are NOT authoritative** — `VenueExchangeAdapter.apiPermissions()` and `ExchangeManager.readApiPermissions()` fallback return `['spot.read', 'spot.trade']`.
- **Runtime permission cache is EPHEMERAL** — in-memory adapter state and connect-time snapshot.
- **Durable permission verification does not yet exist** (planned for W4-E05-b).
- **Restart recovery does not yet exist** (planned for W4-E05-c).
- **Operational continuity does not yet exist** (planned for W4-E05-d).
- Real vendor permission probe I/O is **missing** for BINANCE, BYBIT, OKX, and KRAKEN.
- W4-E01, W4-E02, W4-E03, and W4-E04 CLOSED foundations are **consumed** — not reopened.

---

## Inventory summary by kind

| Kind                  | Count | Notes                                                          |
| --------------------- | ----- | -------------------------------------------------------------- |
| command               | 6     | Permission probe targets + connect snapshot + capability probe |
| state                 | 3     | apiPermissions field, capabilities, verification state gap     |
| projection            | 1     | ExchangesPage permissions panel                                |
| runtime               | 5     | Hardcoded defaults, registry, factory                          |
| operational           | 2     | Slice a inventory; CM-04 dependency                            |
| operator-visible      | 3     | Permissions panel; missing verified/problem labels             |
| persistence-candidate | 4     | api_permissions column; vault; missing anchors                 |
| ephemeral-artifact    | 2     | Hardcoded defaults; in-memory connect snapshot                 |
| dependency            | 14    | Security, platform, W4-E01…E04 foundation, blockers            |
| ownership             | 4     | Verified — no movement                                         |
| honesty-boundary      | 11    | Authoritative rules, E01–E04 consumed, engine clone            |
| explicit-out          | 11    | Probe/persistence/recovery/continuity, reopen, Live            |

Full row detail: machine inventory `W4_E05_A_VENUE_PERMISSION_INVENTORY` and helper exports `rowsSurvive()`, `rowsEphemeral()`, `rowsVenuePermissionSurvive()`, `rowsVenuePermissionEphemeral()`.

---

## Venue Permission SURVIVE artifacts (summary)

| Artifact ID                                      | Owner                | Justification                                                   |
| ------------------------------------------------ | -------------------- | --------------------------------------------------------------- |
| `state-exchange-connection-api-permissions`      | exchange-adapter     | Domain field; persisted column (source non-authoritative today) |
| `state-exchange-reported-capabilities`           | exchange-adapter     | Static capability flags ≠ permissions                           |
| `runtime-exchange-factory`                       | exchange-adapter     | Factory extension point for probe I/O                           |
| `persist-exchange-connections-api-permissions`   | exchange-adapter     | Prisma column survives restart                                  |
| `persist-vault-credentials-for-permission-probe` | secret-vault         | Authoritative credential store                                  |
| `operational-w4-e05-slice-a-inventory`           | wave-4-documentation | This inventory baseline                                         |
| `dep-consumes-*` (6 rows)                        | auth/vault/CM/scope  | Wave 1–2 consumed dependencies                                  |
| `dep-depends-on-w4-e0*-foundation` (4 rows)      | w4-e0*-foundation    | CLOSED predecessors consumed                                    |
| `own-*` (4 rows)                                 | substrate owners     | Verified existing ownership                                     |
| `honesty-*` (11 rows)                            | various              | Binding honesty rules                                           |

## Venue Permission EPHEMERAL artifacts (summary)

| Artifact ID                                     | Owner                 | Justification                                        |
| ----------------------------------------------- | --------------------- | ---------------------------------------------------- |
| `cmd-vendor-permission-probe-*` (4 venues)      | exchange-adapter      | **Missing** real vendor permission probe             |
| `runtime-read-api-permissions-fallback`         | exchange-adapter      | **Hardcoded** `[spot.read, spot.trade]` fallback     |
| `runtime-venue-adapter-default-api-permissions` | exchange-adapter      | **Hardcoded** default on stub adapters               |
| `runtime-adapter-in-memory-connected`           | exchange-adapter      | Process-local lifecycle flag                         |
| `runtime-exchange-registry`                     | exchange-adapter      | In-process registry                                  |
| `state-permission-verification-status`          | exchange-adapter      | **Missing** cross-venue verification state           |
| `persist-vendor-permission-verification`        | exchange-adapter      | **SURVIVE** — W4-E05-b persistence implemented       |
| `persist-permission-integrity-anchors`          | exchange-adapter      | **Missing** — integrity hash covered by W4-E05-b row |
| `ui-honest-permission-verified-label`           | connection-management | **Missing**                                          |
| `ui-permission-problem-label`                   | connection-management | **Missing**                                          |
| `dep-blocked-by-*` (2 rows)                     | exchange-adapter      | Active honesty blockers                              |

---

## Honesty boundaries (binding)

| Rule                               | Statement                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| Vendor authoritative               | Real vendor permission probe result is authoritative when implemented         |
| Hardcoded not authoritative        | `[spot.read, spot.trade]` defaults must not be presented as vendor-verified   |
| Permission verified ≠ Live Trading | Permission probe does not enable live capital orders                          |
| Capability probe ≠ E05 Complete    | Per-venue connect/test probes from E01–E04 ≠ cross-venue E05 product          |
| Runtime cache EPHEMERAL            | In-memory adapter state and connect snapshot are not durable permission truth |
| W4-E01…E04 consumed                | CLOSED foundations extended — not reopened                                    |
| E05 ≠ Wave 4 COMPLETE              | Package Close + PO Completion Review required                                 |

---

## Explicit non-claims

- Venue Permission Verification Complete — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- W4-E05 CLOSED — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Live Trading — **not claimed**
- Production Ready — **not claimed**
- W4-E05-b durable foundation — **recorded**
- W4-E05-c opened — **not claimed**

---

**STOP.** W4-E05-b durable foundation **COMPLETE** (2026-08-28). Await Product Owner review before W4-E05-c. Do not declare Venue Permission Verification Complete or Exchange Connectivity Complete.
