# Version 3 Security Vision

**Document:** Version 3 Security Vision  
**Date:** 2026-08-16  
**Status:** Annex — planning **FROZEN** in [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Role:** Mandatory strategic product for Version 3  
**Does not:** implement controls, redesign the Canonical Order Path, or authorize live capital

TRP will manage financial assets. Version 3 therefore treats **protection against data theft, request tampering, order manipulation, credential leakage, and financial fraud** as a primary objective — equal to research quality, not an afterthought.

This vision extends Identity/Auth, Workspace, Ledger immutability, Runtime Enforcement, and existing HTTP hardening. It does not create a second trading stack.

Related: [Capability Inventory](./v3-capability-inventory.md) SEC-* · [Execution Roadmap](./v3-execution-roadmap.md) Wave 1 / 3 / 6

---

## 1. Why Security is a Version 3 product

Version 2 security is **developer-grade scaffolding**, not a financial-asset platform:

| Exists in Version 2                        | Missing as a product                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| Durable password hashes (bcrypt)           | MFA, lockout, session revocation                                               |
| JWT + global `JwtAuthGuard`                | Session inventory, refresh/rotation policy                                     |
| Roles Reader / Researcher / Trader / Admin | RBAC administration UI and complete surface coverage (TD-006)                  |
| `WorkspaceAccessService`                   | Hard isolation of vendor secrets (global OpenRouter key)                       |
| helmet, rate-limit, ValidationPipe         | Production-default CSP/cookies, CSRF policy, SSRF allowlists, financial replay |
| Recovery Incident (US293)                  | Security audit trail and financial action log                                  |
| Append-only Ledger                         | Tamper-evident _who initiated_ live orders                                     |
| No vault                                   | Customer secrets in `.env` or omitted                                          |

Paper-first certification did not require this. Live capital and customer-held API keys do.

---

## 2. Threat model (Version 3)

| Threat                 | Example                             | Primary controls                                                                                           |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Data theft**         | DB dump, backup leak, stolen laptop | Encryption at rest (vault), least privilege, workspace isolation, audit                                    |
| **Credential leakage** | `.env` in git, logs, shared admin   | Vault, no customer `.env`, rotation, redaction                                                             |
| **Request tampering**  | Modified deploy or order payload    | Authn, authz, schema validation, integrity of financial APIs                                               |
| **Order manipulation** | Replay, CSRF, forged session, race  | Replay protection, CSRF/cookie policy, kill switch, Gate, Risk Engine                                      |
| **Financial fraud**    | Unauthorized live, insider Trader   | RBAC, MFA for live, financial action log, tamper-evidence, dual control (Admin enable live / Trader start) |
| **SSRF**               | Webhook URL to cloud metadata       | Allowlists for Slack/Discord/Teams/custom webhooks                                                         |
| **Injection**          | Query/command injection             | Prisma parameterized access (keep), output encoding, no raw SQL from user input                            |
| **XSS**                | Stolen session via product UI       | CSP, React encoding, cookie flags                                                                          |
| **Account takeover**   | Password spray, token theft         | Rate limit, lockout, session revoke, MFA                                                                   |

Out of scope as product identity: HFT market manipulation research, chain analysis, or a separate SHIELD appliance.

---

## 3. Principles (binding)

### Zero Trust

- Never trust network location. Every API call is authenticated.
- Workspace id is not a client honor system; membership is checked server-side (already started; must be complete).
- Vendor callbacks (Telegram, webhooks) are authenticated independently of browser sessions.
- Live enablement is a server policy, not a hidden UI flag.

### Defense in Depth

```text
Edge (TLS, helmet, CSP, rate limit)
  → Authentication (session)
  → Authorization (RBAC + workspace)
  → Domain gates (Runtime Enforcement, Risk, Kill Switch)
  → Vault (secrets never in logs)
  → Accounting (append-only Ledger)
  → Audit (who did what)
```

A failure at one layer must not silently succeed at the next.

### Least Privilege

- Default new user: **Researcher** (or Reader), never Admin, never live-capable Trader.
- Trader may run paper; live requires additional workspace policy + MFA.
- Admin is for people and policy, not a bypass of the Gate or Risk Engine.
- Vault read is runtime-only for the owning integration; list APIs return metadata, never secret material.

### Secure by Default

- Production refuses insecure JWT secrets (already US158) and refuses missing CSP/cookie flags.
- New integrations are **disconnected** until wizard + test succeed.
- Live remains **off**. Paper remains default.
- Debug prefill of credentials remains forbidden (PC-18).
- Simulated exchange CONNECTED is not a security success.

### Tamper-evident financial operations

- Ledger remains financial SoT for balances and fills.
- A separate **financial action log** records actor, workspace, session, order id, intent, result, hash of previous record.
- Corrections are compensating entries, never silent edits.
- UI and reports cannot rewrite that log.

---

## 4. Control planning

### Authentication (V3-S01)

| Control              | Plan                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| Password credentials | Keep bcrypt durable users. Add complexity/lockout policy.              |
| MFA                  | TOTP (or equivalent) required before live capital; optional for paper. |
| Passwordless         | Not the production customer path.                                      |
| Recovery             | Documented account recovery; no shared `admin@trp.local` product path. |

### Session Management (V3-S01)

| Control    | Plan                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------- |
| Token type | Continue JWT or evolve to opaque server sessions — implementation choice; **revocation must work**. |
| Expiry     | Short access lifetime; refresh rotation.                                                            |
| Revoke     | Admin and self-service logout-all.                                                                  |
| Binding    | Workspace context bound server-side each request (`X-Workspace-Id` today must remain authorized).   |

### Authorization & RBAC (V3-S02)

Reuse `Role`: Reader, Researcher, Trader, Admin.

| Role       | Intended Version 3 privilege                                                           |
| ---------- | -------------------------------------------------------------------------------------- |
| Reader     | Projections only                                                                       |
| Researcher | Lab, certify **into** library per policy, no live start                                |
| Trader     | Paper session commands; live only if workspace live-enabled **and** MFA                |
| Admin      | Members, connections policy, live enablement, kill switch; still cannot skip Gate/Risk |

Complete TD-006: remaining runtime surfaces use the same command authorization.

### ABAC

**Not a Version 3 engine.** Attribute checks for live:

`role == Trader|Admin` AND `workspace.liveEnabled` AND `mfaSatisfied` AND `deployment.gate == PASS` AND `killSwitch == off` AND `connection.permissions include trade`

These belong in CommandAuthorization + Runtime Enforcement + Session start — owners that already exist. A standalone ABAC product is unjustified.

### Secret Vault & encryption (V3-S03)

| Rule           | Plan                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| What is stored | Exchange keys/secrets, Telegram bot token, SMTP, webhooks, AI keys, customer API keys                      |
| What is not    | `DATABASE_URL` / Redis remain **host** infrastructure env                                                  |
| Encryption     | Envelope encryption; platform wrapping key in KMS/HSM or host secret — not in the same table as ciphertext |
| Access         | Application decrypts in memory for the active adapter call; never returns plaintext to the browser         |
| Tenancy        | Workspace-scoped records; unique constraint per (workspace, provider, purpose)                             |

This is the **only new security domain** justified in Version 3. It is not financial SoT.

### API Security & OWASP (V3-S04)

| Control            | Version 2                     | Version 3 plan                                                                                                    |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Request validation | Global ValidationPipe         | Keep; cover all V3 bodies; reject unknown fields on financial APIs                                                |
| Input validation   | Partial                       | Canonical types for ids, venues, quantities (decimal text — do not use IEEE floats as money)                      |
| Output encoding    | React defaults                | Keep; JSON APIs must not reflect unsanitized HTML                                                                 |
| Rate limiting      | Global Fastify + Throttler    | Tighten auth and live-order routes; keep research burst reasonable                                                |
| Replay protection  | Order idempotency remnants    | Idempotency keys + nonce/timestamp window on live place/cancel                                                    |
| CSRF               | Unspecified (likely Bearer)   | If cookies: SameSite=strict, CSRF token. If Bearer-only: forbid cookie session for mutating APIs or double-submit |
| XSS                | helmet CSP in production only | CSP **on by default** in production; document any research-UI exceptions                                          |
| SSRF               | N/A (no customer webhooks)    | Allowlist schemes/hosts for Slack/Discord/Teams/Push; block link-local and metadata IPs                           |
| Injection          | Prisma                        | Keep; forbid string-built SQL; Telegram/HTML payloads treated as text                                             |
| Secure cookies     | Unspecified                   | `Secure`, `HttpOnly`, `SameSite` for any cookie                                                                   |
| CSP                | `NODE_ENV === production`     | Secure by default; fail closed if misconfigured in prod                                                           |
| Helmet             | Registered                    | Keep; review CORP/COEP as needed for app                                                                          |

### Audit Trail (V3-S05)

Log at least: login success/failure, role change, vault create/rotate/delete, connection connect/disconnect, live enablement, kill switch, Gate override **attempts** (must fail), session start/stop.

Retention: defined in Wave 10 compliance. Append-only. Operators see a filtered product view; raw store is admin.

### Financial action logging (V3-L03)

Actor, workspace, session, venue, order ids, payload hash, result, correlation with Ledger fill ids. Required before live UI.

### Workspace isolation (V3-S06)

- No global customer AI key.
- Adapter **instances** may be process-global **code**; **credentials and connection sessions** are per workspace.
- Tests: user in workspace A cannot read B’s vault, orders, or Telegram bind.

### Credential rotation (V3-C04)

Rotate in vault; adapters reconnect; old material unreadable. Documented runbook.

### Security monitoring, incidents, health dashboard (V3-O05)

- Thresholds: brute force, vault decrypt failures, live orders from new IP/session, kill-switch trips.
- Incidents reuse the recovery Incident idea; do not invent a second incident SoT if one store can distinguish class=`security` vs `recovery`.
- Dashboard: MFA %, connections with stale keys, CSP/rate-limit mode, open incidents, live-enabled workspaces.

---

## 5. Financial-asset controls (live)

Live is Wave 6. Security prerequisites:

1. Wave 1 vault + RBAC + sessions + OWASP + audit + isolation tests.
2. Wave 3 durable kill switch + monitoring.
3. Wave 4 real permission verification (`spot.trade` from venue, not hardcoded `apiPermissions`).
4. ADR: live opt-in, human approval, AI prohibition, fail closed.

Dual control (recommended): Admin enables live on workspace; Trader starts session. One person should not silently enable live and trade in a single unchecked click without audit.

---

## 6. What Security must not become

- A rewrite of Identity into a new bounded context “because Zero Trust”.
- A bypass around Risk Engine or Gate (“Admin force fill”).
- An AI SOC that can pause sessions (that is Kill Switch + human).
- Telegram two-factor for trading commands (delivery only).

---

## 7. Exit (Security Platform)

Security Platform is **foundation-complete** at Wave 1 exit (vault + RBAC + OWASP + audit + isolation).  
It is **financial-complete** at Wave 6 exit (action log + tamper-evidence + live MFA).  
It is **operable** at Wave 3 exit (health dashboard + monitoring).

Version 3 Complete requires all three.

---

**STOP.** Security planning only. No implementation.
