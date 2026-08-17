# Security Platform Overview

**Document:** Version 3 Security Platform Overview
**Date:** 2026-08-17
**Status:** Product-facing record of V3-S04 Implementation Package — awaiting Product Owner review. Planning only.
**Product:** Security Platform Hardening (OWASP & API Hardening)
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

---

## Purpose

Security Platform Hardening is the quiet protection layer around the whole product. It does not add a new trading screen. It makes ordinary use safer: bad requests fail clearly, forbidden actions stay forbidden without leaking secrets, and production already runs with secure browser protections turned on.

- The operator can: sign in, work in the product, and trust that invalid or hostile requests are refused without stack traces or internal details; notice honest “try later” when something is rate limited; keep using People and Vault as already delivered.
- The operator cannot (yet): open Connection Management, connect Binance, send Telegram or email, finish every Wave 1 security product (audit history and isolation suite still follow), or trade live.
- Why it exists, in business language: authentication, roles, and the vault can each be careful and still leave the platform soft at the edges. This package hardens those edges before real customer integrations arrive.
- If a hardening control refuses a request: the operator sees a clear error or denial. Sign-in, paper trading, and research remain the default paths. The product does not pretend an integration worked.

---

## Customer Journey

```text
Sign in
  ↓
Use the product normally
  ↓
Invalid request (if it happens)
  ↓
Clear error — nothing internal leaked
  ↓
Unauthorized request (if it happens)
  ↓
Denied — no resource guessing rewarded
  ↓
Too many sensitive tries (if it happens)
  ↓
Honest limit — then normal use recovers
```

### Sign in

The operator signs in as usual. Hardening does not invent a second login. Password rules, sessions, and recovery stay with the authentication product already delivered.

### Use the product normally

People, sessions, paper research, and Vault (as far as Vault is already available) continue to work. The operator does not open a “Security settings” page to turn protections on. Production protections are already on.

### Invalid request → clear error

If the operator (or a broken client) sends something the product cannot accept, the product refuses with a short, understandable message. It does not show programming errors, database text, or server version banners.

### Unauthorized request → denied

If someone tries to reach a workspace or action they are not allowed to use, the product denies it. The response must not become a helpful map of what exists elsewhere.

### Too many sensitive tries → honest limit

If sensitive actions are repeated too quickly (for example aggressive sign-in attempts), the product slows or refuses further tries for a while. When the limit lifts, ordinary use continues. This complements account lockout already owned by authentication — it does not replace it in the operator’s story.

---

## Customer Experience

- Happy path (plain language): sign in, work, never think about headers or rate limits until something is wrong — then the message is clear and short.
- If something fails, what they see (honest; no fake success): short error; denied; try later. Never “connected to Binance.” Never a fake sent message. Never a stack trace.
- What they never have to do (SSH, config files, pasting secrets into notes): they do not edit server files to “enable CSP,” restart the host to turn on rate limits, or ask an engineer to hide stack traces.
- Paper remains the default: **Yes.** Hardening does not start live trading.

---

## Customer Never Sees

- Not shown in the UI: Connection Management home, Connect-and-test against Binance, Telegram delivery, email send, AI chat that uses a new key, live trading, billing, a finished searchable security history (that is the next audit product), an isolation “proof suite” product screen.
- Not offered as a button, page, or implied state: Wave 1 complete; platform “certified unhackable”; live enabled; vendor connected because headers exist.
- Owner later (product name, not a file path): Connection Management; Exchange Connectivity; Notification Platform; AI Platform; Security Audit history; Workspace Isolation suite; live trading; monitoring health dashboard.

Do not list internal types, routes, or table names here. List things an operator might look for and not find.

---

## Security Guarantees

- What stays private: passwords, session material, vault secrets, and internal error details are not shown as convenience text.
- What stops working when it should: abusive floods get limited; framed embedding of sensitive UI is denied; insecure production shortcuts are refused.
- What the product will not pretend: that Connections exist; that live trading is on; that audit history is searchable yet; that isolation suite product is done.
- What this overview does **not** claim: Vault Customer Complete; Audit product; Isolation suite; webhook integrations; financial live replay; external penetration test results.

No control catalogs. No STRIDE tables. Those live in Security Review.

---

## What's Next

- Next thing the operator will be able to do after later packages: see a security history they can use (Audit), and rely on a finished isolation proof product (Isolation suite). After full Wave 1 exit: Connection Management.
- Still not offered after S04 alone: Binance connect, Telegram, email send, billing, live trading, monitoring dashboards.
- Live trading, vault completion, billing, or other later products are **not** included when this hardening package Closes.

---

## Wave 1 place (honest)

| Already delivered                                                         | This package                | Still after this package                       |
| ------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------- |
| Sign-in, sessions, recovery                                               | Platform hardening defaults | Audit history product                          |
| Roles / People                                                            |                             | Isolation suite product                        |
| Vault Platform Complete (Customer Complete may still be open under Vault) |                             | Then Connection Management (after Wave 1 exit) |

---

**STOP.** Planning only. Product Owner review required before V3-S04 implementation.
