# W4-E02-a Inventory & Exchange Connectivity Baseline

**Slice:** W4-E02-a — Inventory & Exchange Connectivity Baseline  
**Package:** W4-E02 Bybit Real I/O (V3-E02 · CM-08)  
**Wave:** 4 — Exchange Connectivity  
**Date:** 2026-08-28  
**Nature:** Discovery and classification only. Not exchange connectivity implementation. Not REST implementation. Not WebSocket implementation. Not persistence. Not restart recovery. Not operational continuity.  
**Machine inventory:** `apps/api/src/platform-conformance/w4-e02-a-exchange-connectivity-inventory.ts`

```text
This inventory does NOT implement exchange connectivity.
This inventory does NOT implement REST or WebSocket I/O.
This inventory does NOT implement persistence or restart recovery.
This inventory does NOT declare Exchange Connectivity Complete.
This inventory does NOT declare Bybit Connected.
This inventory does NOT declare W4-E02 CLOSED or Wave 4 COMPLETE.
Customer-visible exchange connectivity product remains unchanged until later slices + Product Owner Close.
```

---

## Purpose

Enumerate every Bybit Real I/O artifact required to implement W4-E02: exchange REST endpoints, WebSocket streams, authentication artifacts, connection lifecycle, runtime/durable/ephemeral state, operator-visible surfaces, Platform Readiness and Security Platform dependencies, ownership, and Honest Product boundaries. Classify each as **SURVIVE** or **EPHEMERAL** with explicit justification.

| Class         | Meaning                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **SURVIVE**   | Persists across API restart today, or is the durable substrate on existing Vault / Connection / Adapter / Scope owners.       |
| **EPHEMERAL** | Transient, stub, planned-not-implemented, UI-only, process-local, or missing — must not be treated as durable exchange truth. |

---

## Binding finding

**Exchange Connectivity is NOT Complete. Bybit Real I/O is NOT Complete. Bybit Exchange Connectivity does NOT survive restart from this slice.**

- `BybitExchangeAdapter` is a **stub** — simulated `connect()` without network I/O.
- `PlannedExchangeHandshakeAdapter(BYBIT)` returns **not_implemented** — validate cannot perform real vendor round-trip.
- Two parallel paths exist: Connection Management (`/v1/connections`) vs Exchange Adapter factory (`/v1/exchanges`).
- W4-E01 CLOSED foundation (durable/recovery/continuity) is **consumed** — structurally venue-capable but **BYBIT not evidenced** (W4-E02-b/c/d).
- Public market data paths are **adjacent** — not credentialed Connected.
- Authenticated Bybit WebSocket is **missing**.
- Honest Connected / Error / Expired / permission operator labels for BYBIT are **partial/missing** (W4-E02-b+).

---

## Inventory summary by kind

| Kind                  | Count | Notes                                                    |
| --------------------- | ----- | -------------------------------------------------------- |
| command               | 11    | REST endpoints + WebSocket streams (BYBIT scope)         |
| state                 | 4     | Vault types, connection records, exchange id             |
| projection            | 1     | Exchange session health                                  |
| runtime               | 5     | Factory, handshake routing, lifecycle orchestration      |
| operational           | 2     | CM-08 capability, planning status                        |
| operator-visible      | 4     | Connections UI; Exchange Scope catalog; labels gap       |
| persistence-candidate | 4     | Vault, connection records; BYBIT continuity gap          |
| ephemeral-artifact    | 2     | Stub connected flag, in-memory registry                  |
| dependency            | 11    | Security, platform, W4-E01 foundation, blockers          |
| ownership             | 4     | Verified — no movement                                   |
| honesty-boundary      | 7     | Connected rules, W4-E01 consumed, engine clone           |
| explicit-out          | 7     | REST/WS impl, W4-E01 reopen, engine clone, Live, E03–E05 |

Full row detail: machine inventory `W4_E02_A_EXCHANGE_CONNECTIVITY_INVENTORY` and helper exports `rowsSurvive()`, `rowsEphemeral()`, `rowsExchangeConnectivitySurvive()`, `rowsExchangeConnectivityEphemeral()`.

---

## Bybit Exchange Connectivity SURVIVE artifacts (summary)

| Artifact ID                                     | Owner                 | Justification                                |
| ----------------------------------------------- | --------------------- | -------------------------------------------- |
| `rest-connections-validate-bybit`               | connection-management | Operator test endpoint (routes to handshake) |
| `rest-connections-disconnect-bybit`             | connection-management | Operator disconnect endpoint                 |
| `auth-vault-bybit-secret-type`                  | secret-vault          | Durable credential classification            |
| `auth-connection-vault-mapping-bybit`           | connection-management | Vault type mapping                           |
| `lifecycle-connection-record-bybit`             | connection-management | Prisma connection_records                    |
| `lifecycle-connection-transitions-bybit`        | connection-management | Legal status transitions                     |
| `lifecycle-exchange-connection-model-bybit`     | exchange-adapter      | exchange_connections table                   |
| `runtime-bybit-exchange-id`                     | exchange-adapter      | BYBIT catalog registration                   |
| `persist-vault-ciphertext-bybit`                | secret-vault          | Authoritative credential store               |
| `persist-connection-records-bybit`              | connection-management | Operator connection metadata                 |
| `persist-exchange-connections-bybit`            | exchange-adapter      | Adapter-layer persistence                    |
| `ui-connections-page-bybit`                     | connection-management | Routed Connections UI                        |
| `ui-exchange-scope-bybit-catalog`               | exchange-scope        | PC-12 catalog (liveAdapter: false)           |
| `dep-consumes-authentication-bybit`             | authentication        | Wave 1 consumed                              |
| `dep-consumes-authorization-bybit`              | authorization         | Wave 1 consumed                              |
| `dep-consumes-workspace-isolation-bybit`        | workspace-isolation   | Wave 1 consumed                              |
| `dep-consumes-security-audit-bybit`             | security-audit        | Lifecycle audit                              |
| `dep-security-platform-bybit`                   | security-platform     | Platform hardening consumed                  |
| `dep-depends-on-w2-connection-management-bybit` | connection-management | CLOSED predecessor                           |
| `dep-depends-on-w4-e01-foundation`              | w4-e01-foundation     | CLOSED foundation consumed                   |
| `dep-depends-on-exchange-scope-bybit`           | exchange-scope        | RC-27 isolation boundary                     |
| `own-*` (4 rows)                                | substrate owners      | Verified existing ownership                  |

## Bybit Exchange Connectivity EPHEMERAL artifacts (summary)

| Artifact ID                                    | Owner                  | Justification                                        |
| ---------------------------------------------- | ---------------------- | ---------------------------------------------------- |
| `rest-bybit-planned-handshake`                 | exchange-connectivity  | not_implemented — active honesty blocker             |
| `rest-bybit-planned-capability`                | exchange-connectivity  | Capability probe stub                                |
| `rest-bybit-v5-api-handshake-target`           | exchange-adapter       | **Missing** real Bybit REST                          |
| `rest-exchanges-connect-bybit` / `disconnect`  | exchange-adapter       | Stub simulated connect                               |
| `rest-market-data-public-bybit`                | market-data-foundation | Planned public REST                                  |
| `ws-bybit-public-stream`                       | live-market-data       | **Missing**                                          |
| `ws-bybit-adapter-subscribe-stubs`             | exchange-adapter       | Noop subscription hooks                              |
| `ws-bybit-authenticated-user-data`             | exchange-adapter       | **Missing**                                          |
| `auth-handshake-vault-retrieve-bybit`          | exchange-connectivity  | Not reached — planned adapter fails                  |
| `auth-bybit-request-signing`                   | exchange-adapter       | **Missing**                                          |
| `lifecycle-exchange-manager-bybit`             | exchange-adapter       | Orchestrates stub connect                            |
| `lifecycle-exchange-session-projection-bybit`  | exchange-connectivity  | VALIDATION_FAILED projection                         |
| `runtime-bybit-adapter-stub-connected-flag`    | exchange-adapter       | Simulated in-memory flag                             |
| `runtime-exchange-registry-bybit`              | exchange-adapter       | In-process; lost on restart                          |
| `runtime-exchange-factory-bybit`               | exchange-adapter       | Stub factory entry point                             |
| `persist-bybit-connection-continuity`          | exchange-adapter       | **Implemented** — W4-E02-b; restart hydrate W4-E02-c |
| `ui-honest-connected-label-bybit`              | connection-management  | **Partial/missing**                                  |
| `dep-platform-readiness-exchange-connectivity` | operational-continuity | Aggregate only; no BYBIT row                         |
| `dep-blocked-by-planned-handshake`             | exchange-connectivity  | Active honesty blocker                               |
| `dep-blocked-by-stub-adapter-bybit`            | exchange-adapter       | Active honesty blocker                               |
| `dep-observed-by-live-trading-engine-bybit`    | live-trading-deferred  | Live-only consumer                                   |

---

## Honesty boundaries (binding)

| Artifact ID                                   | Boundary                                   |
| --------------------------------------------- | ------------------------------------------ |
| `honesty-connected-not-live-trading-bybit`    | Connected ≠ Live Trading; paper default    |
| `honesty-connected-requires-round-trip-bybit` | Connected requires real vendor round-trip  |
| `honesty-planned-handshake-not-connected`     | Planned not_implemented ≠ Connected        |
| `honesty-factory-stub-not-connected`          | Stub simulated connect ≠ Connected         |
| `honesty-w4-e01-foundation-consumed`          | W4-E01 CLOSED consumed — not reopened      |
| `honesty-e02-not-wave4-complete`              | E02 ≠ Wave 4 COMPLETE; E03–E04 not claimed |
| `honesty-no-engine-clone-bybit`               | Factory extension only; no engine clone    |

---

## Explicit OUT (binding)

- REST implementation in slice a
- WebSocket implementation in slice a
- W4-E01 reopen / redesign
- Engine clone / second Canonical Order Path
- Live Trading / live order submission (Wave 6)
- OKX / Kraken (E03–E04)
- Venue permission verification product (E05)
- Exchange Connectivity Complete / Bybit Connected / W4-E02 CLOSED

---

**STOP.** Inventory foundation only. Await Product Owner review before W4-E02-b. Do not declare Bybit Connected or Exchange Connectivity Complete.
