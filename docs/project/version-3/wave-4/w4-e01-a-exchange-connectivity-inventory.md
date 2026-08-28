# W4-E01-a Inventory & Exchange Connectivity Baseline

**Slice:** W4-E01-a — Inventory & Exchange Connectivity Baseline  
**Package:** W4-E01 Binance Real I/O (V3-E01 · CM-07)  
**Wave:** 4 — Exchange Connectivity  
**Date:** 2026-08-28  
**Nature:** Discovery and classification only. Not exchange connectivity implementation. Not REST implementation. Not WebSocket implementation. Not persistence. Not restart recovery. Not operational continuity.  
**Machine inventory:** `apps/api/src/platform-conformance/w4-e01-a-exchange-connectivity-inventory.ts`

```text
This inventory does NOT implement exchange connectivity.
This inventory does NOT implement REST or WebSocket I/O.
This inventory does NOT implement persistence or restart recovery.
This inventory does NOT declare Exchange Connectivity Complete.
This inventory does NOT declare Binance Connected.
This inventory does NOT declare W4-E01 CLOSED or Wave 4 COMPLETE.
Customer-visible exchange connectivity product remains unchanged until later slices + Product Owner Close.
```

---

## Purpose

Enumerate every Binance Real I/O artifact required to implement W4-E01: exchange REST endpoints, WebSocket streams, authentication artifacts, connection lifecycle, runtime/durable/ephemeral state, operator-visible surfaces, security and platform dependencies, ownership, and Honest Product boundaries. Classify each as **SURVIVE** or **EPHEMERAL** with explicit justification.

| Class         | Meaning                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **SURVIVE**   | Persists across API restart today, or is the durable substrate on existing Vault / Connection / Adapter / Scope owners.      |
| **EPHEMERAL** | Transient, stub, simulated, UI-only, process-local, or missing — must not be treated as durable exchange connectivity truth. |

---

## Binding finding

**Exchange Connectivity is NOT Complete. Binance Real I/O is NOT Complete. Exchange Connectivity does NOT survive restart from this slice.**

- `BinanceExchangeAdapter` is a **stub** — simulated `connect()` without network I/O.
- `BinanceHandshakeAdapter` performs **real signed REST** on Connection Management validate path only.
- Two parallel paths exist: Connection Management (`/v1/connections`) vs Exchange Adapter factory (`/v1/exchanges`).
- Public market data REST/WS (Market Data Foundation, live-market-data) are **adjacent** — not credentialed Connected.
- Authenticated user-data WebSocket is **missing**.
- Binance connection continuity / restart recovery durable state is **missing** (W4-E01-d target).
- Honest Connected / Error / Expired / permission operator labels are **partial** (W4-E01-c target).

---

## Inventory summary by kind

| Kind                  | Count | Notes                                                |
| --------------------- | ----- | ---------------------------------------------------- |
| command               | 9     | REST endpoints + WebSocket streams                   |
| state                 | 3     | Connection records, vault types, adapter persistence |
| projection            | 1     | Exchange session health                              |
| runtime               | 7     | Factory, handshake, lifecycle orchestration          |
| operational           | 2     | CM-07 capability, planning status                    |
| operator-visible      | 3     | Connections UI; honest labels partial/missing        |
| persistence-candidate | 4     | Vault, connection records, continuity gap            |
| ephemeral-artifact    | 2     | Stub connected flag, in-memory registry              |
| dependency            | 9     | Security + platform consumes/depends/blocked-by      |
| ownership             | 4     | Verified — no movement                               |
| honesty-boundary      | 6     | Connected rules, Live Trading, engine clone          |
| explicit-out          | 6     | REST/WS impl, engine clone, Live, E02–E05            |

Full row detail: machine inventory `W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY` and helper exports `rowsSurvive()`, `rowsEphemeral()`, `rowsExchangeConnectivitySurvive()`, `rowsExchangeConnectivityEphemeral()`.

---

## Exchange Connectivity SURVIVE artifacts (summary)

| Artifact ID                               | Owner                 | Justification                                |
| ----------------------------------------- | --------------------- | -------------------------------------------- |
| `rest-connections-validate`               | connection-management | Operator test endpoint (delegates handshake) |
| `rest-connections-disconnect`             | connection-management | Operator disconnect endpoint                 |
| `auth-vault-binance-secret-type`          | secret-vault          | Durable credential classification            |
| `auth-connection-vault-mapping`           | connection-management | Vault type mapping                           |
| `lifecycle-connection-record`             | connection-management | Prisma connection_records                    |
| `lifecycle-connection-transitions`        | connection-management | Legal status transitions                     |
| `lifecycle-exchange-connection-model`     | exchange-adapter      | exchange_connections table                   |
| `persist-vault-ciphertext`                | secret-vault          | Authoritative credential store               |
| `persist-connection-records`              | connection-management | Operator connection metadata                 |
| `persist-exchange-connections`            | exchange-adapter      | Adapter-layer persistence                    |
| `ui-connections-page-binance`             | connection-management | Routed Connections UI                        |
| `dep-consumes-authentication`             | authentication        | Wave 1 consumed                              |
| `dep-consumes-authorization`              | authorization         | Wave 1 consumed                              |
| `dep-consumes-workspace-isolation`        | workspace-isolation   | Wave 1 consumed                              |
| `dep-consumes-security-audit`             | security-audit        | Lifecycle audit                              |
| `dep-depends-on-w2-connection-management` | connection-management | CLOSED predecessor                           |
| `dep-depends-on-w2-s02-handshake`         | exchange-connectivity | CLOSED early handshake                       |
| `dep-depends-on-exchange-scope-rc27`      | exchange-scope        | RC-27 isolation boundary                     |
| `own-*` (4 rows)                          | substrate owners      | Verified existing ownership                  |

## Exchange Connectivity EPHEMERAL artifacts (summary)

| Artifact ID                                      | Owner                  | Justification                          |
| ------------------------------------------------ | ---------------------- | -------------------------------------- |
| `rest-binance-api-restrictions-handshake`        | exchange-connectivity  | Real REST but not adapter factory path |
| `rest-binance-api-restrictions-capability`       | exchange-connectivity  | Capability probe only                  |
| `rest-exchanges-connect` / `disconnect`          | exchange-adapter       | Stub simulated connect                 |
| `rest-market-data-public-binance`                | market-data-foundation | Public REST without trading key        |
| `ws-binance-public-combined-stream`              | live-market-data       | Public WS only                         |
| `ws-venue-adapter-subscribe-stubs`               | exchange-adapter       | Noop subscription hooks                |
| `ws-binance-authenticated-user-data`             | exchange-adapter       | **Missing**                            |
| `auth-handshake-vault-retrieve` / `hmac-signing` | exchange-connectivity  | Transient signing per request          |
| `lifecycle-exchange-session-projection`          | exchange-connectivity  | Computed health projection             |
| `lifecycle-exchange-manager`                     | exchange-adapter       | Orchestrates stub connect              |
| `runtime-binance-adapter-stub-connected-flag`    | exchange-adapter       | Simulated in-memory flag               |
| `runtime-exchange-registry`                      | exchange-adapter       | In-process; lost on restart            |
| `runtime-exchange-factory-binance`               | exchange-adapter       | Stub factory entry point               |
| `runtime-handshake-http-client`                  | exchange-connectivity  | Per-request fetch                      |
| `persist-binance-connection-continuity`          | exchange-adapter       | **Missing** — W4-E01-d                 |
| `ui-honest-connected-label-product`              | connection-management  | **Partial/missing** — W4-E01-c         |
| `dep-blocked-by-stub-adapter`                    | exchange-adapter       | Active honesty blocker                 |
| `dep-observed-by-live-trading-engine`            | live-trading-deferred  | Live-only consumer                     |

---

## Honesty boundaries (binding)

| Artifact ID                                | Boundary                                   |
| ------------------------------------------ | ------------------------------------------ |
| `honesty-connected-not-live-trading`       | Connected ≠ Live Trading; paper default    |
| `honesty-connected-requires-round-trip`    | Connected requires real vendor round-trip  |
| `honesty-handshake-not-adapter-complete`   | Handshake path ≠ adapter factory Complete  |
| `honesty-public-market-data-not-connected` | Public REST/WS ≠ credentialed Connected    |
| `honesty-e01-not-wave4-complete`           | E01 ≠ Wave 4 COMPLETE; E02–E04 not claimed |
| `honesty-no-engine-clone`                  | Factory extension only; no engine clone    |

---

## Explicit OUT (binding)

- REST implementation in slice a
- WebSocket implementation in slice a
- Engine clone / second Canonical Order Path
- Live Trading / live order submission (Wave 6)
- Bybit / OKX / Kraken (E02–E04)
- Venue permission verification product (E05)
- Exchange Connectivity Complete / Binance Real I/O Complete

---

**STOP.** Inventory foundation only. Await Product Owner review before W4-E01-b. Do not declare Exchange Connectivity Complete.
