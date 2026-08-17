# Exchange Connectivity Overview

**Document:** Version 3 Exchange Connectivity Overview
**Date:** 2026-08-17
**Status:** W2-S02-b implemented. Remaining W2-S02 slices await Product Owner review before W2-S02-c.
**Product:** Exchange Connectivity Foundation
**Nature:** Customer description. Not an RC. Not an ADR. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

---

## W2-S02-b delivered foundation

Operators can run **Validate** on a configured Exchange connection. For **Binance**, the product performs an authenticated handshake using the saved secret. If the exchange accepts authenticated communication, the row shows **Connected**. If it does not, the row shows an honest failure: **Validation Failed**, **Provider Unavailable**, **Handshake Timeout**, or **Authentication Failed**.

**Connected** means only that the exchange accepted authenticated communication. It does not mean trading is enabled, orders are possible, balances are loaded, market data is available, or WebSockets are connected.

Bybit and OKX remain in the catalog. Handshake for those providers is not implemented yet; Validate fails honestly as Validation Failed.

Secrets stay in the secure store. The operator does not see keys, HTTP payloads, or provider stack traces.

---

## W2-S02-a delivered foundation

Operators can open **Connections** and see the supported Exchange catalog: **Binance**, **Bybit**, and **OKX**. Each provider shows its declared capabilities (Spot, Futures, Testnet, Margin, WebSocket, REST). Choosing a provider shows those capabilities. An Exchange Connection references the selected provider.

Capabilities remain metadata. They do not mean trading or balances.

---

## Purpose

Exchange Connectivity Foundation is the product that lets a workspace **prove communication with an exchange**.

The operator already manages the connection in **Connections**. This package does not replace that place. It makes Exchange validation a real authenticated handshake for supported providers.

- The operator can: open Connections, choose Binance, Bybit, or OKX, run Validate, see Connected when the exchange authenticated the session, see Failure when it did not, and Disconnect.
- The operator cannot: place orders, view balances, view positions, enable live trading, open monitoring, or see billing from this package.
- Why it exists, in business language: storing keys is not the same as talking to the exchange. Paying customers need an honest session proof.
- If connectivity cannot run: the rest of the product does not pretend the exchange answered. Paper trading remains the default and is not turned into live trading here.

```text
Connected means authenticated exchange communication succeeded.
Connected does NOT mean Trading enabled.
```

---

## What the operator already has

Connection Management is **CLOSED**. The operator can already create an Exchange connection, store credentials securely, and manage lifecycle without editing a server file.

W2-S02-b is the Binance handshake proof. Health and later providers remain later slices.

---

## Customer Journey

```text
Sign in
  ↓
Open Connections
  ↓
Choose Exchange
  ↓
Run Validate
  ↓
Observe Connected
     or
Observe Failure
  ↓
Disconnect when done
```

### Open Connections

The operator signs in and opens **Connections**. Exchange connections live there. There is no second product to learn.

### Choose Exchange

The operator chooses **Exchange** and one offered provider: **Binance**, **Bybit**, or **OKX**. Additional exchanges may be added later without a new Connections product. Authenticated handshake is implemented for Binance in this slice.

### Run Validate

The operator runs **Validate**. For Binance, the product uses the saved secret to establish a real authenticated session with the exchange. The operator does not paste the secret again, does not edit a server file, and does not see the secret.

### Observe Connected

When communication succeeds, the row shows **Connected**. That means the exchange authenticated the session. It does **not** mean trading is on. It does **not** mean orders, balances, or positions are available.

### Observe Failure

When authentication or communication does not succeed, the row shows an honest state the operator can act on — Validation Failed, Provider Unavailable, Handshake Timeout, or Authentication Failed — never the secret, never a fake success.

### Disconnect

The operator can disconnect. The connection is no longer Connected. The product does not keep claiming an authenticated session.

---

## Customer Experience

- Happy path (plain language): open Connections, choose Binance, Validate, see Connected, disconnect when finished.
- If something fails, what they see (honest; no fake success): Authentication Failed if the exchange rejected the key; Handshake Timeout if the exchange did not answer in time; Provider Unavailable if the venue could not be reached; Validation Failed if handshake is not implemented or the attempt cannot be completed. Never “Trading enabled.” Never “order sent.” Never “balances loaded.”
- What they never have to do: edit `.env`, store keys in a local file, SSH to a server, or ask an engineer to probe the venue.
- Paper remains the default: Exchange Connectivity does not turn on live trading.

---

## Connectivity status (what the operator sees)

| Status                    | What it means to the operator                       |
| ------------------------- | --------------------------------------------------- |
| **Pending Validation**    | Handshake or validation is in progress              |
| **Connected**             | Authenticated exchange communication succeeded      |
| **Validation Failed**     | Validate was attempted and did not succeed          |
| **Authentication Failed** | The exchange rejected authenticated communication   |
| **Handshake Timeout**     | The exchange did not complete the handshake in time |
| **Provider Unavailable**  | The exchange could not be reached                   |
| **Disconnected**          | Not connected; previous session is not claimed      |

Connected is not Trading enabled.

---

## Providers offered now

| Provider | What the operator can prove here              | What does not happen here   |
| -------- | --------------------------------------------- | --------------------------- |
| Binance  | Authenticated session / communication success | Orders, balances, positions |
| Bybit    | Cataloged; handshake not implemented yet      | Orders, balances, positions |
| OKX      | Cataloged; handshake not implemented yet      | Orders, balances, positions |

Later providers can use the same Validate / Connected / Failure meaning. They are not implemented for handshake in this slice.

---

## Customer Never Sees

- Not shown as finished products here: order tickets, balances, positions, leverage, live trading controls, market-data streams, monitoring walls, billing.
- Not offered as a button or implied state: **Trading enabled**, **Order placed**, **Balance loaded**, **Position opened**, **Live trading connected**.
- Owner later: Live Trading; Order Path; Portfolio; Market Data; Monitoring; Billing.

Do not list internal types, routes, or table names here.

---

## Security Guarantees

- What stays private: exchange secrets are not shown after Validate, not offered as export, and not stored in a local file.
- What stops working when it should: a disconnected connection is not treated as Connected. A signed-out person cannot Validate. One workspace cannot use another workspace’s exchange connection. A role that is not allowed cannot Validate.
- What the product will not pretend: connectivity success is not trading; it is not balances; it is not live capital.
- What this overview does **not** claim: Wave 3 monitoring, Wave 4 complete venue I/O exit, Wave 6 live capital, billing.
- What still works if Validate cannot run: sign-in, Connection Management, paper trading, and research.

No control catalogs. No STRIDE tables. Those live in Security Review.

---

## Operator walkthroughs

### Validate

```text
□ Sign in
□ Open Connections
□ Choose Exchange
□ Run Validate
□ See Connected or Failure
```

### Observe Connected

```text
□ Validate succeeds
□ Status is Connected
□ Confirm it does not say Trading enabled
```

### Observe Failure

```text
□ Validate does not succeed
□ Status is an honest failure
□ Secret is not shown
□ Status is not Connected
```

### Disconnect

```text
□ Open the connection
□ Disconnect
□ Status is no longer Connected
```

### Workspace isolation

```text
□ Workspace A connection is not usable from Workspace B
```

### Authorization

```text
□ Role without permission cannot Validate or Disconnect
```

### No trading capability

```text
□ No orders
□ No balances
□ No live trading
□ No execution
```

---

## What's Next

After Exchange Connectivity Foundation ships its product outcomes:

- Remaining Wave 2 work as sequenced by Product Owner
- Later named Exchange Connectivity outcomes stay later
- Live trading stays later and is not introduced here

Wave 1 Security Foundation is **CERTIFIED COMPLETE** and is consumed, not reopened.
W2-S01 Connection Management is **CLOSED** and is consumed, not redesigned.

W2-S02-b is implemented. Wait for Product Owner review before W2-S02-c.

---

## Out of scope declarations

This product does **not** include:

- No orders
- No balances
- No live trading
- No execution
- No monitoring
- No billing

---

## Mandatory Questions (short)

1. **Problem solved:** Prove that communication with the exchange succeeded through a real authenticated session.
2. **Consumed:** Connection Management, Vault, Authentication, Authorization, Workspace Isolation, Security Platform, Security Audit.
3. **Owns:** Handshake, health, availability, connectivity status, provider capability abstraction, exchange capability projection.
4. **Does not own:** Secrets, identity, authn/authz, workspace, audit persistence, monitoring, live trading, orders, portfolio, strategy engine.
5. **Providers planned:** Binance, Bybit, OKX. Authenticated handshake is implemented for Binance in this slice.
6. **Live Trading:** No.
7. **Wave 1 modified:** No.

---

**STOP.** Wait for Product Owner review before W2-S02-c. Health, availability polling, and remaining handshake providers remain later slices.
