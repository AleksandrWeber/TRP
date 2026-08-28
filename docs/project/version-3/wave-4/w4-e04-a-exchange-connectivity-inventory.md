# W4-E04-a Inventory & Exchange Connectivity Baseline

**Slice:** W4-E04-a — Inventory & Exchange Connectivity Baseline  
**Package:** W4-E04 Kraken Adapter (factory) (V3-E04 · CM-10)  
**Wave:** 4 — Exchange Connectivity  
**Date:** 2026-08-28  
**Nature:** Discovery and classification only. Not exchange connectivity implementation. Not REST implementation. Not WebSocket implementation. Not persistence. Not restart recovery. Not operational continuity.  
**Machine inventory:** `apps/api/src/platform-conformance/w4-e04-a-exchange-connectivity-inventory.ts`

```text
This inventory does NOT implement exchange connectivity.
This inventory does NOT implement REST or WebSocket I/O.
This inventory does NOT implement persistence or restart recovery.
This inventory does NOT declare Exchange Connectivity Complete.
This inventory does NOT declare Kraken Connected.
This inventory does NOT declare W4-E04 CLOSED or Wave 4 COMPLETE.
Customer-visible exchange connectivity product remains unchanged until later slices + Product Owner Close.
```

---

## Purpose

Enumerate every Kraken Adapter (factory) artifact required to implement W4-E04: exchange REST endpoints, WebSocket streams, authentication artifacts, connection lifecycle, runtime/durable/ephemeral state, operator-visible surfaces, Platform Readiness and Security Platform dependencies, ownership, and Honest Product boundaries. Classify each as **SURVIVE** or **EPHEMERAL** with explicit justification.

| Class         | Meaning                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **SURVIVE**   | Persists across API restart today, or is the durable substrate on existing Vault / Connection / Adapter / Scope owners.       |
| **EPHEMERAL** | Transient, stub, planned-not-implemented, UI-only, process-local, or missing — must not be treated as durable exchange truth. |

---

## Binding finding

**Exchange Connectivity is NOT Complete. Kraken Adapter (factory) is NOT Complete. Kraken Exchange Connectivity does NOT survive restart from this slice. No customer-visible Exchange Connectivity exists.**

- `KrakenExchangeAdapter` is **missing** — no adapter class; first label-only venue through factory (W4-E04-b target or honest not-offered).
- `PlannedExchangeHandshakeAdapter(KRAKEN)` is **missing** — KRAKEN not in `EXCHANGE_PROVIDER_CATALOG`.
- **Authenticated REST is missing.**
- **Authenticated WebSocket is missing.**
- **Signing implementation is missing.**
- **Durable continuity persistence does not yet exist** (planned for W4-E04-b).
- **Restart recovery does not yet exist.**
- **Operational continuity does not yet exist.**
- KRAKEN not in `CONNECTION_PROVIDERS`, `EXCHANGE_IDS`, or `HoldableSecretType` — operator cannot create Kraken connections today.
- Exchange Scope catalog label `kraken` exists with `liveAdapter: false` only.
- W4-E01, W4-E02, and W4-E03 CLOSED foundations are **consumed** — structurally venue-capable but **Kraken not evidenced**.

---

## Inventory summary by kind

| Kind                  | Count | Notes                                                        |
| --------------------- | ----- | ------------------------------------------------------------ |
| command               | 11    | REST endpoints + WebSocket streams (Kraken scope)            |
| state                 | 3     | Vault gap, connection models, exchange id gap                |
| projection            | 1     | Exchange session health                                      |
| runtime               | 5     | Factory gap, handshake routing, lifecycle orchestration      |
| operational           | 2     | CM-10 capability, planning status                            |
| operator-visible      | 4     | Connections UI gap; Exchange Scope catalog; labels gap       |
| persistence-candidate | 4     | Vault substrate; connection tables; continuity gap           |
| ephemeral-artifact    | 2     | Missing stub flag, in-memory registry                        |
| dependency            | 14    | Security, platform, W4-E01/E02/E03 foundation, blockers      |
| ownership             | 4     | Verified — no movement                                       |
| honesty-boundary      | 10    | Connected rules, W4-E01/E02/E03 consumed, engine clone       |
| explicit-out          | 7     | REST/WS impl, W4-E01/E02/E03 reopen, engine clone, Live, E05 |

Full row detail: machine inventory `W4_E04_A_EXCHANGE_CONNECTIVITY_INVENTORY` and helper exports `rowsSurvive()`, `rowsEphemeral()`, `rowsExchangeConnectivitySurvive()`, `rowsExchangeConnectivityEphemeral()`.

---

## Kraken Exchange Connectivity SURVIVE artifacts (summary)

| Artifact ID                                      | Owner                 | Justification                                   |
| ------------------------------------------------ | --------------------- | ----------------------------------------------- |
| `rest-connections-validate-kraken`               | connection-management | Operator test endpoint (provider-agnostic)      |
| `rest-connections-disconnect-kraken`             | connection-management | Operator disconnect endpoint                    |
| `lifecycle-connection-record-kraken`             | connection-management | Prisma connection_records (no KRAKEN rows)      |
| `lifecycle-connection-transitions-kraken`        | connection-management | Legal status transitions                        |
| `lifecycle-exchange-connection-model-kraken`     | exchange-adapter      | exchange_connections table                      |
| `persist-vault-ciphertext-kraken`                | secret-vault          | Authoritative credential store (no kraken type) |
| `persist-connection-records-kraken`              | connection-management | Operator connection metadata                    |
| `persist-exchange-connections-kraken`            | exchange-adapter      | Adapter-layer persistence                       |
| `ui-exchange-scope-kraken-catalog`               | exchange-scope        | PC-12 catalog (liveAdapter: false)              |
| `dep-consumes-authentication-kraken`             | authentication        | Wave 1 consumed                                 |
| `dep-consumes-authorization-kraken`              | authorization         | Wave 1 consumed                                 |
| `dep-consumes-workspace-isolation-kraken`        | workspace-isolation   | Wave 1 consumed                                 |
| `dep-consumes-security-audit-kraken`             | security-audit        | Lifecycle audit                                 |
| `dep-security-platform-kraken`                   | security-platform     | Platform hardening consumed                     |
| `dep-depends-on-w2-connection-management-kraken` | connection-management | CLOSED predecessor                              |
| `dep-depends-on-w4-e01-foundation`               | w4-e01-foundation     | CLOSED foundation consumed                      |
| `dep-depends-on-w4-e02-foundation`               | w4-e02-foundation     | CLOSED Bybit patterns consumed                  |
| `dep-depends-on-w4-e03-foundation`               | w4-e03-foundation     | CLOSED OKX patterns consumed                    |
| `dep-depends-on-exchange-scope-kraken`           | exchange-scope        | RC-27 isolation boundary                        |
| `own-*` (4 rows)                                 | substrate owners      | Verified existing ownership                     |

## Kraken Exchange Connectivity EPHEMERAL artifacts (summary)

| Artifact ID                                    | Owner                  | Justification                                                            |
| ---------------------------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| `rest-kraken-planned-handshake`                | exchange-connectivity  | **Missing** — KRAKEN not in provider catalog                             |
| `rest-kraken-api-handshake-target`             | exchange-adapter       | **Missing** real Kraken REST                                             |
| `rest-exchanges-connect-kraken` / `disconnect` | exchange-adapter       | **Missing** — KRAKEN not in EXCHANGE_IDS                                 |
| `ws-kraken-adapter-subscribe-stubs`            | exchange-adapter       | **Missing** KrakenExchangeAdapter class                                  |
| `ws-kraken-authenticated-user-data`            | exchange-adapter       | **Missing**                                                              |
| `auth-vault-kraken-secret-type`                | secret-vault           | **Missing** HoldableSecretType.Kraken                                    |
| `auth-kraken-request-signing`                  | exchange-adapter       | **Missing**                                                              |
| `runtime-kraken-adapter-stub-connected-flag`   | exchange-adapter       | **Missing** — no stub unlike OKX                                         |
| `runtime-exchange-registry-kraken`             | exchange-adapter       | In-process; no KRAKEN entry                                              |
| `runtime-exchange-factory-kraken`              | exchange-adapter       | Factory cannot create KRAKEN                                             |
| `runtime-kraken-exchange-id`                   | exchange-adapter       | **Missing** from EXCHANGE_IDS                                            |
| `persist-kraken-connection-continuity`         | exchange-adapter       | **SURVIVE** — W4-E04-b persistence; W4-E04-c restart hydrate implemented |
| `ui-connections-page-kraken`                   | connection-management  | KRAKEN not in Connections catalog                                        |
| `ui-honest-connected-label-kraken`             | connection-management  | **Missing**                                                              |
| `dep-blocked-by-*` (4 rows)                    | various                | Active honesty blockers                                                  |
| `dep-platform-readiness-exchange-connectivity` | operational-continuity | Aggregate only; no Kraken row                                            |

---

## Honesty boundaries (binding)

| Artifact ID                                       | Boundary                                  |
| ------------------------------------------------- | ----------------------------------------- |
| `honesty-connected-not-live-trading-kraken`       | Connected ≠ Live Trading; paper default   |
| `honesty-connected-requires-round-trip-kraken`    | Connected requires real vendor round-trip |
| `honesty-planned-handshake-not-connected-kraken`  | Planned not_implemented ≠ Connected       |
| `honesty-factory-stub-not-connected-kraken`       | Stub simulated connect ≠ Connected        |
| `honesty-scope-catalog-not-connected`             | Scope catalog label ≠ Connected           |
| `honesty-not-in-connection-catalog-not-connected` | Not in Connections catalog ≠ Connected    |
| `honesty-w4-e01-foundation-consumed`              | W4-E01 CLOSED consumed — not reopened     |
| `honesty-w4-e02-foundation-consumed`              | W4-E02 CLOSED consumed — not reopened     |
| `honesty-w4-e03-foundation-consumed`              | W4-E03 CLOSED consumed — not reopened     |
| `honesty-e04-not-wave4-complete`                  | E04 ≠ Wave 4 COMPLETE; E05 not claimed    |
| `honesty-no-engine-clone-kraken`                  | Factory extension only; no engine clone   |

---

## Explicit OUT (binding)

- REST implementation in slice a
- WebSocket implementation in slice a
- W4-E01 / W4-E02 / W4-E03 reopen / redesign
- Engine clone / second Canonical Order Path
- Live Trading / live order submission (Wave 6)
- Venue permission verification product (E05)
- Exchange Connectivity Complete / Kraken Connected / W4-E04 CLOSED

---

**STOP.** Inventory foundation only. Await Product Owner review before W4-E04-b. Do not declare Kraken Connected or Exchange Connectivity Complete.
