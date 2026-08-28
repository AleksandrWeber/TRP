# W4-E03-a Inventory & Exchange Connectivity Baseline

**Slice:** W4-E03-a — Inventory & Exchange Connectivity Baseline  
**Package:** W4-E03 OKX Real I/O (V3-E03 · CM-09)  
**Wave:** 4 — Exchange Connectivity  
**Date:** 2026-08-28  
**Nature:** Discovery and classification only. Not exchange connectivity implementation. Not REST implementation. Not WebSocket implementation. Not persistence. Not restart recovery. Not operational continuity.  
**Machine inventory:** `apps/api/src/platform-conformance/w4-e03-a-exchange-connectivity-inventory.ts`

```text
This inventory does NOT implement exchange connectivity.
This inventory does NOT implement REST or WebSocket I/O.
This inventory does NOT implement persistence or restart recovery.
This inventory does NOT declare Exchange Connectivity Complete.
This inventory does NOT declare OKX Connected.
This inventory does NOT declare W4-E03 CLOSED or Wave 4 COMPLETE.
Customer-visible exchange connectivity product remains unchanged until later slices + Product Owner Close.
```

---

## Purpose

Enumerate every OKX Real I/O artifact required to implement W4-E03: exchange REST endpoints, WebSocket streams, authentication artifacts, connection lifecycle, runtime/durable/ephemeral state, operator-visible surfaces, Platform Readiness and Security Platform dependencies, ownership, and Honest Product boundaries. Classify each as **SURVIVE** or **EPHEMERAL** with explicit justification.

| Class         | Meaning                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **SURVIVE**   | Persists across API restart today, or is the durable substrate on existing Vault / Connection / Adapter / Scope owners.       |
| **EPHEMERAL** | Transient, stub, planned-not-implemented, UI-only, process-local, or missing — must not be treated as durable exchange truth. |

---

## Binding finding

**Exchange Connectivity is NOT Complete. OKX Real I/O is NOT Complete. OKX Exchange Connectivity does NOT survive restart from this slice.**

- `OkxExchangeAdapter` is a **stub** — simulated `connect()` without network I/O.
- `PlannedExchangeHandshakeAdapter(OKX)` returns **not_implemented** — validate cannot perform real vendor round-trip.
- Two parallel paths exist: Connection Management (`/v1/connections`) vs Exchange Adapter factory (`/v1/exchanges`).
- W4-E01 and W4-E02 CLOSED foundations (durable/recovery/continuity) are **consumed** — structurally venue-capable but **OKX not evidenced** (W4-E03-b/c/d).
- OKX vault credentials require **passphrase** in addition to apiKey/apiSecret.
- Public market data paths are **adjacent** — not credentialed Connected.
- Authenticated OKX WebSocket is **missing**.
- Honest Connected / Error / Expired / permission operator labels for OKX are **partial/missing** (W4-E03-b+).

---

## Inventory summary by kind

| Kind                  | Count | Notes                                                        |
| --------------------- | ----- | ------------------------------------------------------------ |
| command               | 11    | REST endpoints + WebSocket streams (OKX scope)               |
| state                 | 4     | Vault types, connection records, exchange id                 |
| projection            | 1     | Exchange session health                                      |
| runtime               | 5     | Factory, handshake routing, lifecycle orchestration          |
| operational           | 2     | CM-09 capability, planning status                            |
| operator-visible      | 4     | Connections UI; Exchange Scope catalog; labels gap           |
| persistence-candidate | 4     | Vault, connection records; OKX continuity gap                |
| ephemeral-artifact    | 2     | Stub connected flag, in-memory registry                      |
| dependency            | 12    | Security, platform, W4-E01/E02 foundation, blockers          |
| ownership             | 4     | Verified — no movement                                       |
| honesty-boundary      | 8     | Connected rules, W4-E01/E02 consumed, engine clone           |
| explicit-out          | 8     | REST/WS impl, W4-E01/E02 reopen, engine clone, Live, E04–E05 |

Full row detail: machine inventory `W4_E03_A_EXCHANGE_CONNECTIVITY_INVENTORY` and helper exports `rowsSurvive()`, `rowsEphemeral()`, `rowsExchangeConnectivitySurvive()`, `rowsExchangeConnectivityEphemeral()`.

---

## OKX Exchange Connectivity SURVIVE artifacts (summary)

| Artifact ID                                   | Owner                 | Justification                                |
| --------------------------------------------- | --------------------- | -------------------------------------------- |
| `rest-connections-validate-okx`               | connection-management | Operator test endpoint (routes to handshake) |
| `rest-connections-disconnect-okx`             | connection-management | Operator disconnect endpoint                 |
| `auth-vault-okx-secret-type`                  | secret-vault          | Durable credential classification            |
| `auth-connection-vault-mapping-okx`           | connection-management | Vault type mapping                           |
| `lifecycle-connection-record-okx`             | connection-management | Prisma connection_records                    |
| `lifecycle-connection-transitions-okx`        | connection-management | Legal status transitions                     |
| `lifecycle-exchange-connection-model-okx`     | exchange-adapter      | exchange_connections table                   |
| `runtime-okx-exchange-id`                     | exchange-adapter      | OKX catalog registration                     |
| `persist-vault-ciphertext-okx`                | secret-vault          | Authoritative credential store               |
| `persist-connection-records-okx`              | connection-management | Operator connection metadata                 |
| `persist-exchange-connections-okx`            | exchange-adapter      | Adapter-layer persistence                    |
| `ui-connections-page-okx`                     | connection-management | Routed Connections UI                        |
| `ui-exchange-scope-okx-catalog`               | exchange-scope        | PC-12 catalog (liveAdapter: false)           |
| `dep-consumes-authentication-okx`             | authentication        | Wave 1 consumed                              |
| `dep-consumes-authorization-okx`              | authorization         | Wave 1 consumed                              |
| `dep-consumes-workspace-isolation-okx`        | workspace-isolation   | Wave 1 consumed                              |
| `dep-consumes-security-audit-okx`             | security-audit        | Lifecycle audit                              |
| `dep-security-platform-okx`                   | security-platform     | Platform hardening consumed                  |
| `dep-depends-on-w2-connection-management-okx` | connection-management | CLOSED predecessor                           |
| `dep-depends-on-w4-e01-foundation`            | w4-e01-foundation     | CLOSED foundation consumed                   |
| `dep-depends-on-w4-e02-foundation`            | w4-e02-foundation     | CLOSED Bybit patterns consumed for OKX       |
| `dep-depends-on-exchange-scope-okx`           | exchange-scope        | RC-27 isolation boundary                     |
| `own-*` (4 rows)                              | substrate owners      | Verified existing ownership                  |

## OKX Exchange Connectivity EPHEMERAL artifacts (summary)

| Artifact ID                                    | Owner                  | Justification                                                |
| ---------------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| `rest-okx-planned-handshake`                   | exchange-connectivity  | not_implemented — active honesty blocker                     |
| `rest-okx-planned-capability`                  | exchange-connectivity  | Capability probe stub                                        |
| `rest-okx-v5-api-handshake-target`             | exchange-adapter       | **Missing** real OKX REST                                    |
| `rest-exchanges-connect-okx` / `disconnect`    | exchange-adapter       | Stub simulated connect                                       |
| `rest-market-data-public-okx`                  | market-data-foundation | Planned public REST                                          |
| `ws-okx-public-stream`                         | live-market-data       | **Missing**                                                  |
| `ws-okx-adapter-subscribe-stubs`               | exchange-adapter       | Noop subscription hooks                                      |
| `ws-okx-authenticated-user-data`               | exchange-adapter       | **Missing**                                                  |
| `auth-handshake-vault-retrieve-okx`            | exchange-connectivity  | Not reached — planned adapter fails                          |
| `auth-okx-request-signing`                     | exchange-adapter       | **Missing**                                                  |
| `lifecycle-exchange-manager-okx`               | exchange-adapter       | Orchestrates stub connect                                    |
| `lifecycle-exchange-session-projection-okx`    | exchange-connectivity  | VALIDATION_FAILED projection                                 |
| `runtime-okx-adapter-stub-connected-flag`      | exchange-adapter       | Simulated in-memory flag                                     |
| `runtime-exchange-registry-okx`                | exchange-adapter       | In-process; lost on restart                                  |
| `runtime-exchange-factory-okx`                 | exchange-adapter       | Stub factory entry point                                     |
| `persist-okx-connection-continuity`            | exchange-adapter       | **SURVIVE** — W4-E03-b persistence; W4-E03-c restart hydrate |
| `ui-honest-connected-label-okx`                | connection-management  | **Partial/missing**                                          |
| `dep-platform-readiness-exchange-connectivity` | operational-continuity | Aggregate only; no OKX row                                   |
| `dep-blocked-by-planned-handshake`             | exchange-connectivity  | Active honesty blocker                                       |
| `dep-blocked-by-stub-adapter-okx`              | exchange-adapter       | Active honesty blocker                                       |
| `dep-observed-by-live-trading-engine-okx`      | live-trading-deferred  | Live-only consumer                                           |

---

## Honesty boundaries (binding)

| Artifact ID                                 | Boundary                                   |
| ------------------------------------------- | ------------------------------------------ |
| `honesty-connected-not-live-trading-okx`    | Connected ≠ Live Trading; paper default    |
| `honesty-connected-requires-round-trip-okx` | Connected requires real vendor round-trip  |
| `honesty-planned-handshake-not-connected`   | Planned not_implemented ≠ Connected        |
| `honesty-factory-stub-not-connected`        | Stub simulated connect ≠ Connected         |
| `honesty-w4-e01-foundation-consumed`        | W4-E01 CLOSED consumed — not reopened      |
| `honesty-w4-e02-foundation-consumed`        | W4-E02 CLOSED consumed — not reopened      |
| `honesty-e03-not-wave4-complete`            | E03 ≠ Wave 4 COMPLETE; E04–E05 not claimed |
| `honesty-no-engine-clone-okx`               | Factory extension only; no engine clone    |

---

## Explicit OUT (binding)

- REST implementation in slice a
- WebSocket implementation in slice a
- W4-E01 reopen / redesign
- W4-E02 reopen / redesign
- Engine clone / second Canonical Order Path
- Live Trading / live order submission (Wave 6)
- Kraken real I/O (E04)
- Venue permission verification product (E05)
- Exchange Connectivity Complete / OKX Connected / W4-E03 CLOSED

---

**STOP.** Inventory foundation only. Await Product Owner review before W4-E03-b. Do not declare OKX Connected or Exchange Connectivity Complete.
