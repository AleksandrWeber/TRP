# V3-L02-S-ADP1 — Live Execution Adapter Realization Implementation Evidence

**Document:** ADP1 implementation evidence  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02  
**Slice:** `L02-S-ADP1` only  
**Nature:** Implementation evidence for PO review. **Not** Slice Approval. **Not** FIV. **Not** live capital activation.

```text
SB-04 implementation-complete for adapter realization,
with runtime live-I/O gated/blocked.
```

---

## 1. Scope

In scope:

- Live `ExecutionAdapterPort` for BINANCE / BYBIT / OKX
- Canonical binding via `RoutingExecutionAdapter` (paper + live)
- ENV1 + EG1 consumption before credential use / HTTP
- DNS-pinned real-I/O transport (disabled by default)
- Engine live path: S04 revalidation + HS1 claim before irreversible I/O
- UNKNOWN / pre-send / cancel ambiguity semantics
- Focused mocked tests (zero real venue contact)

Out of scope: ISO1 / SB-07, FIV, Slice Approval, C7 grants, production credentials, capital activation, EmergencyManager changes, live-trading-engine redesign.

---

## 2. Initial Repository State

Before ADP1: `EXECUTION_ADAPTER` = Paper only; OrderIntent paper-only; Engine `assertPaper`; EG1/ENV1/HS1/UNK1 libraries unbound to live adapters; C7 deny-all; `liveCapitalAuthorized=false`.

---

## 3. Canonical Execution Path

```text
Orders → Risk → Ledger reservation → ExecutionEngineService
  → EXECUTION_ADAPTER (RoutingExecutionAdapter)
      → PaperExecutionAdapter | LiveVenueExecutionAdapter
          → ENV1 binding → EG1 egress (+ optional DNS pin)
          → mocked/injected HTTP (real I/O off by default)
```

No path through `live-trading-engine` or `EmergencyManager`.

---

## 4. Adapter Boundary

| Component                   | Role                                                 |
| --------------------------- | ---------------------------------------------------- |
| `LiveVenueExecutionAdapter` | Implements `ExecutionAdapterPort` for `mode: 'live'` |
| `RoutingExecutionAdapter`   | Nest `EXECUTION_ADAPTER` — routes by command mode    |
| `PaperExecutionAdapter`     | Unchanged paper semantics                            |
| Port types                  | Discriminated unions: paper \| live commands/results |

Live submit returns `acknowledged` / `rejected` / `unknown` only — **never invents fills**.

---

## 5–7. Binance / Bybit / OKX

| Venue   | LIVE              | TESTNET/DEMO             | Notes                                          |
| ------- | ----------------- | ------------------------ | ---------------------------------------------- |
| Binance | `api.binance.com` | `testnet.binance.vision` | HMAC signed `/api/v3/order`                    |
| Bybit   | `api.bybit.com`   | `api-testnet.bybit.com`  | `/v5/order/*`                                  |
| OKX     | `www.okx.com`     | same host + demo header  | ENV1 `trading_demo` → `x-simulated-trading: 1` |

Hosts only from EG1 allowlist. No user URL override. No deposits/withdrawals/transfers.

---

## 8. ENV1 Integration

Before credential use: `assertMayRetrieveTradingCredential` + `assertLiveCredentialEnvironmentBinding`.  
Purpose from trusted Vault metadata (`trading`/`trading_live`/`trading_testnet`/`trading_demo`). Client-claimed env cannot escalate.

---

## 9. EG1 Integration

All HTTP via `LiveVenueEgressHttpClient` → `buildLiveVenueRequestUrl` + `assertLiveVenueEgress` / `WithDns`. Redirects: `error`.

---

## 10. DNS / Rebinding

- Injected-fetch tests: optional DNS policy
- Real I/O (`allowRealVenueIo=true`): **mandatory** DNS resolve + public-IP filter + `createWebPushPinnedHttpsAgent` (Web Push pattern)
- **Default Nest binding:** `allowRealVenueIo: false` — real venue I/O refused (`missing_configuration`)

---

## 11. Human-Start Integration

`assertLiveVenueIoPreconditions` → `evaluateForL02Contract` → `claimHumanStartAfterS04Revalidation`.  
Engine calls this for live submit/cancel **before** pre-send markers / adapter I/O.  
`claimMeansVenueSubmitted: false` always.

---

## 12. S04 Revalidation

Immediate revalidation via `LiveAdmissionService.evaluateForL02Contract` inside the IO gate. Not replaced by JWT/role alone.

---

## 13. C7 Behavior

Production C7 remains deny-all. Without harness `authorizationOverride`, live IO gate fails `c7_denied`. Expected and tested.

---

## 14–16. UNKNOWN / Pre-send / Idempotency

- Engine preserves UNK1: ready_to_transmit → transmitted before adapter; ambiguous → UNKNOWN; UNKNOWN blocks blind resubmit
- Stable `clientOrderId` / intent hash / workspace uniqueness unchanged
- Live cancel ambiguity → UNKNOWN; already_filled → non-cancelled; already_cancelled → CANCELLED path

---

## 17–19. Cancel / Reconcile / KS-policy-session

- Cancel only via Engine → adapter (order-specific; no cancel-all)
- Query supports clientOrderId / venue order id lookup shapes
- KS ACTIVE / policy PAPER / session end: block new via S04; no auto cancel-all; no EM

---

## 20–21. EmergencyManager / live-trading-engine Isolation

- Live adapter sources do not import `EmergencyManager` or `live-trading-engine` (tested)
- Canonical path remains Orders → Engine → ExecutionAdapterPort
- `live-trading-engine` remains NON-SoT

---

## 22. Credential / Logging Security

- Secrets not on commands; not logged; errors use `redactCredentialMaterial` / fixed reason codes
- OrderService.create rejects `mode: 'live'` (capital creation not activated)

---

## 23. Tests

```bash
cd apps/api && npx vitest run \
  src/modules/execution-adapter/live-venue/v3-l02-s-adp1-live-execution-adapter.spec.ts \
  src/modules/execution-adapter/paper-execution.adapter.spec.ts \
  src/modules/orders/domain/order-intent.spec.ts \
  src/modules/execution-engine/v3-l02-s-unk1-engine.spec.ts
```

**Result (2026-09-17):** 53 passed (41 ADP1 + regressions). Zero venue network calls.

---

## 24. ADP1-01…31 Results

| ID         | Result                                                         |
| ---------- | -------------------------------------------------------------- |
| ADP1-01    | PASS — live adapters on ExecutionAdapterPort / Routing binding |
| ADP1-02    | PASS — no parallel SoT                                         |
| ADP1-03    | PASS — live-trading-engine NON-SoT                             |
| ADP1-04    | PASS — ENV1 before credential use                              |
| ADP1-05    | PASS — EG1 before HTTP                                         |
| ADP1-06    | PASS — S04 in IO gate                                          |
| ADP1-07    | PASS — HS1 claim in IO gate                                    |
| ADP1-08    | PASS — claimMeansVenueSubmitted false                          |
| ADP1-09    | PASS — C7 fail-closed                                          |
| ADP1-10–14 | PASS — UNKNOWN / pre-send / idempotency preserved              |
| ADP1-15–19 | PASS — venue env + OKX demo header server-side                 |
| ADP1-20–22 | PASS — cancel ambiguity; no cancel-all; no EM                  |
| ADP1-23–24 | PASS — query/reconcile capability; no invented fills           |
| ADP1-25–26 | PASS — redaction; workspace binding                            |
| ADP1-27    | PASS — focused tests green                                     |
| ADP1-28–30 | PASS — no prod creds / capital / FIV                           |
| ADP1-31    | PASS — SB-07 not claimed                                       |

---

## 25. Residual Risks

- Runtime live I/O blocked: C7 deny-all + `allowRealVenueIo=false` + no capital auth
- Order HTTP API still paper-only (`OrderService.create` rejects live)
- DNS pin path exists but unused until real I/O separately authorized
- Full SB-07 cross-workspace suite not run
- Venue protocol parsers are minimal contract shapes — FIV still required later

---

## 26–27. Live I/O & Capital Status

```text
Real venue I/O: BLOCKED (default)
Production credentials: NOT provisioned
Real capital movement: NONE
FIV: NOT PERFORMED
Live trading activated: NO
Slice Approval: NOT GRANTED
```

---

## 28. Next Dependency

**SB-07 / L02-S-ISO1** — cross-workspace live regression suite (separate authorization).  
Then PO capital / C7 / FIV acts as required by ADR-020 — not authorized by ADP1.

---

## STOP

Next step: **PO Review of ADP1 implementation evidence.** Do not start ISO1 from this document alone.
