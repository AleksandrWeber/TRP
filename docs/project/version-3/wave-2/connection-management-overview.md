# Connection Management Overview

**Document:** Version 3 Connection Management Overview
**Date:** 2026-08-17
**Status:** Product-facing record of W2-S01 Implementation Package — Planning **COMPLETE**. Not implementation. Awaiting Product Owner Approval.
**Product:** Connection Management
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

---

## Purpose

Connection Management is the place in the product where an operator manages connections to external services — exchanges, Telegram, email (SMTP), and OpenRouter — without editing a server file.

- The operator can: open Connections, create a connection, validate it, replace credentials, disconnect, and review status for the workspace they belong to.
- The operator cannot (yet): place live orders, receive production Telegram or email delivery as a finished notification product, run AI chat as a finished AI platform journey, open monitoring or billing products, or treat a validated connection as live trading.
- Why it exists, in business language: paying customers must manage their own integrations inside the product. Host files and simulated “Connected” badges are not a product.
- If Connections is unavailable: sign-in, paper trading, and research still work. Integrations that need a managed connection wait. The rest of the product does not pretend those integrations are live.

---

## Customer Journey

```text
Sign in
  ↓
Open Connections
  ↓
Create a connection
  ↓
Validate
  ↓
Connected or Validation Failed
  ↓
Replace if needed
  ↓
Disconnect when done
  ↓
Review status anytime
```

### Sign in

The operator signs in as usual and works inside one workspace. Connection actions require a role that is allowed to manage connections. A role that is not allowed sees Connections as unavailable — not as another workspace’s empty list.

### Open Connections

Under the product navigation, open **Connections**. The page lists offered provider families (Crypto Exchanges, Telegram, SMTP, OpenRouter) and each connection’s status.

### Create a connection

The operator chooses a provider, enters only the required fields, and saves. The secret is stored securely. The form does not keep showing the secret after a successful save. The operator does not edit a server file and does not restart the product to save the connection.

### Validate

The operator runs **Validate**. Status becomes **Pending Validation**, then **Connected** or **Validation Failed**. Connected means the connection passed validation for what this product currently offers. It does **not** mean live trading is on, a Telegram message was delivered, an email was sent, or AI chat is running.

### Connected or Validation Failed

On success, the row shows **Connected**. On failure, the row shows **Validation Failed** with an honest reason the operator can act on — never the raw secret, never a fake success.

### Replace if needed

The operator can replace credentials. The connection stays the same connection. The old secret is no longer the one the product will use. Validation is needed again before Connected may return.

### Disconnect when done

The operator can disconnect. The connection is no longer Connected. The operator may also revoke or disable when the product offers those actions — both mean the connection is not usable.

### Review status anytime

The operator can review status and recent outcomes without reading secrets back and without asking an engineer to inspect a host file.

---

## Customer Experience

- Happy path (plain language): open Connections, create, validate to Connected, replace if needed, disconnect when finished, review anytime.
- If something fails, what they see (honest; no fake success): unavailable if not allowed; Validation Failed if validation did not succeed; unavailable if the secure store cannot accept a secret right now; deny if the operator tries another workspace’s connections. Never “live trading connected.” Never “message sent.” Never “AI online” from this screen alone.
- What they never have to do: edit `.env`, SSH to a server, paste secrets into notes for an engineer, or run SQL.
- Paper remains the default: Connection Management does not turn on live trading. Paper does not require a live venue connection.

---

## Connection states (what the operator sees)

| Status                 | What it means to the operator       |
| ---------------------- | ----------------------------------- |
| **Disconnected**       | Not actively connected for use      |
| **Pending Validation** | Validation is in progress           |
| **Connected**          | Last validation succeeded           |
| **Validation Failed**  | Validation was attempted and failed |
| **Revoked**            | Connection was revoked; not usable  |
| **Disabled**           | Connection is disabled; not usable  |

---

## Provider families (what the operator can manage)

| Family               | What the operator manages here                     | What comes later                          |
| -------------------- | -------------------------------------------------- | ----------------------------------------- |
| **Crypto Exchanges** | Connection + credentials + validation honesty      | Real venue trading handshake (later wave) |
| **Telegram**         | Connection + bot credentials + validation honesty  | Message delivery (later wave)             |
| **SMTP**             | Connection + mail credentials + validation honesty | Email sending (later wave)                |
| **OpenRouter**       | Connection + API key + validation honesty          | Full AI platform use (later rules/waves)  |

---

## Customer Never Sees

- Not shown as finished products here: live trading controls, Telegram delivery inbox proof, SMTP campaign send, AI chat studio, monitoring walls, analytics suites, billing.
- Not offered as a button or implied state: **Live trading connected**, **Telegram delivered**, **Email sent**, **AI online** solely because a connection was saved or validated.
- Owner later: Exchange Connectivity; Notification Platform; AI Platform; Live Trading; Monitoring; Billing.

Do not list internal types, routes, or table names here.

---

## Security Guarantees

- What stays private: exchange secrets, bot tokens, SMTP passwords, and AI keys are not shown after save, not offered as export, and not readable back.
- What stops working when it should: a disconnected, revoked, or disabled connection is not treated as Connected. A signed-out person cannot manage connections. One workspace cannot manage another workspace’s connections.
- What the product will not pretend: validation success is not live trading; it is not delivery; it is not AI execution.
- What this overview does **not** claim: Wave 3 monitoring, Wave 4 venue I/O completion, Wave 5 delivery, Wave 6 live capital, billing.
- What still works if Connections cannot save: sign-in, paper trading, and research.

No control catalogs. No STRIDE tables. Those live in Security Review.

---

## Operator walkthroughs

### Create

```text
□ Sign in
□ Open Connections
□ Choose provider
□ Enter required fields
□ Save — secret hidden after success
□ Status is not Connected until Validate succeeds
```

### Validate

```text
□ Open the connection
□ Run Validate
□ See Pending Validation
□ See Connected or Validation Failed
```

### Replace

```text
□ Open the connection
□ Replace credentials
□ Secret hidden after success
□ Validate again before Connected returns
```

### Disconnect

```text
□ Open the connection
□ Disconnect (or revoke / disable)
□ Status is no longer Connected
```

### Review

```text
□ Open Connections
□ Read status and last outcome
□ Confirm secrets are not visible
```

---

## What's Next

After Connection Management ships its Wave 2 product outcomes:

- Remaining Wave 2 polish for rotate/disconnect/workspace scope as sequenced
- Later waves add real venue I/O, real notification delivery, monitoring, and gated live trading

Wave 1 Security Foundation is **CERTIFIED COMPLETE** and is consumed, not reopened.

---

## Mandatory Questions (short)

1. **Problem solved:** Self-serve, honest external connections without host files or simulated success.
2. **Wave 1 consumed:** Vault, Authentication, Authorization, Workspace Isolation, Security Platform, Security Audit.
3. **Owns:** Connection metadata, lifecycle, state, validation, provider product behavior.
4. **Does not own:** Secrets, identity, authn/authz, workspace, security platform, audit persistence, adapters, delivery, AI execution, orders.
5. **Providers planned:** Crypto Exchanges, Telegram, SMTP, OpenRouter.
6. **Outside Wave 2:** Monitoring, real venue I/O completion, delivery, live trading, analytics, billing, dashboards, Wave 3+.

---

**STOP.** Wait for Product Owner review before W2-S01 implementation begins.
