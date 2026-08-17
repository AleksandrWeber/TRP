# Exchange Connectivity Overview

**Document:** Version 3 Exchange Connectivity Overview
**Date:** 2026-08-17
**Status:** W2-S02-a implemented. Remaining W2-S02 slices await Product Owner review before W2-S02-b.
**Product:** Exchange Connectivity Foundation
**Nature:** Customer description. Not an RC. Not an ADR. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

---

## W2-S02-a delivered foundation

Operators can now open **Connections** and see the supported Exchange catalog: **Binance**, **Bybit**, and **OKX**. Each provider shows its declared capabilities (Spot, Futures, Testnet, Margin, WebSocket, REST). Choosing a provider shows those capabilities. An Exchange Connection references the selected provider.

This slice does **not** connect, authenticate, or talk to an exchange. There is no Connect button, no Authenticate button, and no Live status from this slice. Capabilities are metadata. They do not mean trading, balances, or an authenticated session.

Handshake and honest venue Connected remain later W2-S02 slices.

---

## Purpose

Exchange Connectivity Foundation is the product that lets a workspace **prove communication with an exchange**.

The operator already manages the connection in **Connections**. This package does not replace that place. It makes Exchange **Connect** real.

- The operator can: open Connections, choose Binance, Bybit, or OKX, run Connect, see Connected when the exchange authenticated the session, see Failure when it did not, and Disconnect.
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

That earlier Connected was not proof the exchange answered. This package is the proof.

---

## Customer Journey

```text
Sign in
  ↓
Open Connections
  ↓
Choose Exchange
  ↓
Run Connect
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

The operator chooses **Exchange** and one offered provider: **Binance**, **Bybit**, or **OKX**. Additional exchanges may be added later without a new Connections product. They are not offered here yet.

### Run Connect

The operator runs **Connect**. The product uses the saved secret to establish a real authenticated session with the exchange. The operator does not paste the secret again, does not edit a server file, and does not see the secret.

### Observe Connected

When communication succeeds, the row shows **Connected**. That means the exchange authenticated the session. It does **not** mean trading is on. It does **not** mean orders, balances, or positions are available.

### Observe Failure

When authentication or communication does not succeed, the row shows **Failure** with an honest reason the operator can act on — never the secret, never a fake success.

### Disconnect

The operator can disconnect. The connection is no longer Connected. The product does not keep claiming an authenticated session.

---

## Customer Experience

- Happy path (plain language): open Connections, choose an exchange, Connect, see Connected, disconnect when finished.
- If something fails, what they see (honest; no fake success): unavailable if not allowed; Failure if the exchange did not authenticate the session; unavailable if the secure store cannot supply the secret; deny if the operator tries another workspace’s connection. Never “Trading enabled.” Never “order sent.” Never “balances loaded.”
- What they never have to do: edit `.env`, store keys in a local file, SSH to a server, or ask an engineer to probe the venue.
- Paper remains the default: Exchange Connectivity does not turn on live trading.

---

## Connectivity status (what the operator sees)

| Status           | What it means to the operator                  |
| ---------------- | ---------------------------------------------- |
| **Connected**    | Authenticated exchange communication succeeded |
| **Failure**      | Connect was attempted and did not succeed      |
| **Disconnected** | Not connected; previous session is not claimed |

Connected is not Trading enabled.

---

## Providers offered now

| Provider | What the operator can prove here              | What does not happen here   |
| -------- | --------------------------------------------- | --------------------------- |
| Binance  | Authenticated session / communication success | Orders, balances, positions |
| Bybit    | Authenticated session / communication success | Orders, balances, positions |
| OKX      | Authenticated session / communication success | Orders, balances, positions |

Later providers can use the same Connect / Connected / Failure / Disconnect meaning. They are not offered in this package.

---

## Customer Never Sees

- Not shown as finished products here: order tickets, balances, positions, leverage, live trading controls, market-data streams, monitoring walls, billing.
- Not offered as a button or implied state: **Trading enabled**, **Order placed**, **Balance loaded**, **Position opened**, **Live trading connected**.
- Owner later: Live Trading; Order Path; Portfolio; Market Data; Monitoring; Billing.

Do not list internal types, routes, or table names here.

---

## Security Guarantees

- What stays private: exchange secrets are not shown after Connect, not offered as export, and not stored in a local file.
- What stops working when it should: a disconnected connection is not treated as Connected. A signed-out person cannot Connect. One workspace cannot use another workspace’s exchange connection. A role that is not allowed cannot Connect.
- What the product will not pretend: connectivity success is not trading; it is not balances; it is not live capital.
- What this overview does **not** claim: Wave 3 monitoring, Wave 4 complete venue I/O exit, Wave 6 live capital, billing.
- What still works if Connect cannot run: sign-in, Connection Management, paper trading, and research.

No control catalogs. No STRIDE tables. Those live in Security Review.

---

## Operator walkthroughs

### Connect

```text
□ Sign in
□ Open Connections
□ Choose Exchange
□ Run Connect
□ See Connected or Failure
```

### Observe Connected

```text
□ Connect succeeds
□ Status is Connected
□ Confirm it does not say Trading enabled
```

### Observe Failure

```text
□ Connect does not succeed
□ Status is Failure
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
□ Role without permission cannot Connect or Disconnect
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

W2-S02-a is implemented. Wait for Product Owner review before W2-S02-b.

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
5. **Providers planned:** Binance, Bybit, OKX. Additional providers allowed by design.
6. **Live Trading:** No.
7. **Wave 1 modified:** No.

---

**STOP.** Wait for Product Owner review before W2-S02-b. Handshake, HTTP, and venue communication remain later slices.
