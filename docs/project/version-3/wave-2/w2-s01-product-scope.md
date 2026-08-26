# W2-S01 Product Scope

**Package:** W2-S01 Connection Management
**Wave:** 2 — Connection Management
**Status:** Implementation package — Planning **COMPLETE**. Not implementation. Awaiting Product Owner Approval.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w2-s01-implementation-package.md`](./w2-s01-implementation-package.md)
**Vision (read-only):** [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md)
**Baseline (read-only):** [`../../version-2-connection-management-audit.md`](../../version-2-connection-management-audit.md)

This document freezes **IN / OUT**, **ownership**, **connection states**, **Connection Type → Provider catalog**, **customer workflows**, **failure philosophy**, and **acceptance** for W2-S01. It does not add journeys the Master Plan did not already name. It does not redesign Version 2. It does not reopen Wave 1.

---

## Product purpose

Connection Management is the customer product that **manages external service connections** for a workspace.

It lets an operator create, validate, replace, disconnect, and review connections — with secrets held in Vault and status that is honest.

It does **not** hold customer secrets as its own store. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspaces. Workspace owns membership; Isolation proves the boundary.

It does **not** own security platform defaults or audit persistence.

It does **not** speak venue protocols, send Telegram or email, place orders, or run AI.

```text
Connection Management owns the connection product.
Vault owns the secrets.
Adapters own protocol I/O when their waves ship.
```

---

## Why Connection Management exists (business language)

A paying customer cannot operate TRP by editing server files or trusting simulated “Connected” badges. Version 2 fragments integrations across `.env`, simulated exchange connect, an in-memory Telegram wizard, reserved notification placeholders, and a process-global OpenRouter key.

Wave 1 delivered the security foundation: people can sign in, roles bind, secrets can be stored, hardening and audit exist, and workspaces are isolated. Wave 2 must now deliver the **product** that uses that foundation so customers can manage connections themselves.

Connection Management exists so the **customer owns their integrations inside the product**: connect, validate, replace, disconnect, and review — without SSH and without lying about live trading or delivery.

---

## Customer value

After this package Closes (post-implementation), an operator can manage offered connections in one place, with vault-backed secrets and honest states.

Wave 2 lines this package advances (Execution Roadmap / Product Roadmap):

- One Connections screen for offered integrations and status
- Exchange credential collection without claiming live I/O
- OpenRouter key collection without customer `.env`
- Test / validate action with honest failure
- Rotate / replace and disconnect without SSH
- Journeys J3-04, J3-05, and the collect portions of J3-03 / J3-07

This package does **not** own “Binance trading handshake complete” (Wave 4), “Telegram delivered” (Wave 5), or “live order sent” (Wave 6).

---

## Version 2 baseline (Connection Management Audit)

| Fact from the audit                            | Meaning for this package                                  |
| ---------------------------------------------- | --------------------------------------------------------- |
| No unified Connection Management product       | This package defines that product                         |
| OpenRouter key in `.env`                       | Customer path becomes Connections + Vault                 |
| Exchange connect stores state, not credentials | Metadata may extend; secrets stay in Vault                |
| Simulated CONNECTED without keys               | Forbidden as customer success                             |
| Telegram wizard in-memory                      | Reuse UX language; no delivery claim                      |
| SMTP / reserved channels have no credentials   | Collect may be planned; send is Wave 5                    |
| Paying customers need server access            | Exactly the problem Wave 2 removes for in-scope providers |

---

## IN Scope

| Item                       | Customer meaning                                                                  |
| -------------------------- | --------------------------------------------------------------------------------- |
| Connection lifecycle       | Create, validate, replace, disconnect, review                                     |
| Connection state model     | Disconnected, Pending Validation, Connected, Validation Failed, Revoked, Disabled |
| Workspace ownership        | Every connection belongs to exactly one workspace                                 |
| Vault integration          | Create/replace writes secrets only through Vault                                  |
| Connection validation flow | Operator-triggered validation with honest outcomes                                |
| Connection Type catalog    | Exchange, Notification, AI, Storage (planning model)                              |
| Supported providers        | Exchange: Binance, Bybit, OKX; Notification: Telegram, SMTP; AI: OpenRouter       |
| Customer workflows         | Operator journeys in product language                                             |
| Operator walkthroughs      | Manual Connection Management Walkthrough                                          |
| Security boundaries        | Consume Wave 1 controls; do not redefine                                          |
| Audit interaction          | Emit lifecycle events to Security Audit                                           |
| Failure philosophy         | Fail closed; no fake Connected; degrade honestly                                  |
| Validation strategy        | Slices, Close criteria, evidence, regressions                                     |

---

## OUT OF Scope

| Item                | Why out                        | Later owner               |
| ------------------- | ------------------------------ | ------------------------- |
| Exchange adapters   | Protocol engine                | Exchange Adapter / Wave 4 |
| Real API calls      | Live vendor I/O where deferred | Waves 4 / 5 / 7           |
| Live Trading        | Capital                        | Wave 6                    |
| Telegram delivery   | Send                           | Wave 5                    |
| SMTP delivery       | Send                           | Wave 5                    |
| OpenRouter requests | Model execution                | AI Gateway / Wave 7       |
| AI execution        | Narratives / chat spend        | AI Platform               |
| Order placement     | Trading SoT                    | Canonical Order Path      |
| Monitoring          | Ops product                    | Wave 3                    |
| Analytics           | Metrics product                | Later                     |
| Billing             | Commercial                     | Wave 9                    |
| Customer dashboards | Broader SaaS UI                | Later                     |
| Wave 3+ packages    | Later waves                    | Execution Roadmap         |

---

## Ownership (binding)

### Vault owns

- Customer credentials
- Encryption at rest
- Secret lifecycle (store, revoke, delete)
- Whether plaintext can ever be returned to the browser (**never**)

### Connection Management owns

- Connection metadata
- Connection lifecycle
- Connection state
- Connection validation (orchestration and product outcomes)
- Provider-specific **product** behavior (catalog, required fields, honesty copy)

### Connection Management does not own

| Concern           | Real owner            |
| ----------------- | --------------------- |
| Customer secrets  | Vault                 |
| Identity          | Authentication        |
| Authentication    | Authentication        |
| Authorization     | Authorization         |
| Workspace         | Workspace             |
| Security platform | Security Platform     |
| Audit persistence | Security Audit        |
| Venue protocol    | Exchange Adapter      |
| Notification send | Notification Delivery |
| Model call        | AI Gateway            |
| Money / orders    | Ledger / Order Path   |

### Architecture consume diagram (planning)

```text
Connection Management
        │ consumes
        ├── Vault
        ├── Authentication
        ├── Authorization
        ├── Workspace Isolation
        ├── Security Platform
        └── Security Audit

Connection Management
        │ does not own
        ├── customer secrets
        ├── identity
        ├── authentication
        ├── authorization
        ├── workspace
        ├── security platform
        └── audit persistence
```

---

## Connection states

Plan only. No implementation in this document.

| State                  | Operator meaning                                                            | Who owns the truth                                          |
| ---------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Disconnected**       | Not in active connected use; may have no secret or an unused connection row | Connection Management                                       |
| **Pending Validation** | Validation started; waiting for outcome                                     | Connection Management                                       |
| **Connected**          | Last validation succeeded for the offered scope of this connection          | Connection Management                                       |
| **Validation Failed**  | Validation ran and failed; product shows an honest failure                  | Connection Management                                       |
| **Revoked**            | Operator (or policy) revoked the connection; not usable                     | Connection Management (connection); Vault if secret revoked |
| **Disabled**           | Connection exists but is disabled; not usable                               | Connection Management                                       |

### Transition rules (planning)

1. **Create** moves a provider slot from absent/Disconnected toward a connection that can be validated. Secret material goes to Vault. Status must not jump to Connected without validation success.
2. **Validate** enters **Pending Validation**, then **Connected** or **Validation Failed**.
3. **Replace** updates Vault material and requires re-validation before Connected may be claimed again.
4. **Disconnect** returns to **Disconnected** (or equivalent honest non-use). Live vendor sessions are not claimed here for deferred I/O.
5. **Revoke** yields **Revoked**; connection must not be treated as Connected.
6. **Disable** yields **Disabled**; connection must not be treated as Connected.
7. Vault revoke/delete of the secret must not leave the UI claiming Connected.

### Honesty rules

- **Connected** never means live trading enabled.
- **Connected** never means Telegram delivered or email sent.
- **Connected** never means AI chat is running.
- Simulated ping success from Version 2 is not a Wave 2 customer Connected.
- If vendor I/O is not yet offered for a type or provider, validation must say so honestly (configured / pending later handshake) — never fake Connected for deferred I/O.

---

## Connection Type model (planning)

Product Owner recommendation for catalog scaling. **Does not change ownership. Does not revise the Master Plan.**

```text
Connection Type
  ├── Exchange
  │     ├── Binance
  │     ├── Bybit
  │     └── OKX
  ├── Notification
  │     ├── Telegram
  │     └── SMTP
  ├── AI
  │     └── OpenRouter
  └── Storage
        └── (none offered in Wave 2)
```

| Layer               | Meaning                                       | Owner                         |
| ------------------- | --------------------------------------------- | ----------------------------- |
| **Connection Type** | Category: Exchange, Notification, AI, Storage | Connection Management catalog |
| **Provider**        | Concrete vendor inside a type                 | Connection Management catalog |
| **Connection**      | Workspace instance (lifecycle + state)        | Connection Management         |
| **Secret**          | Credential material                           | Vault                         |

### Supported providers under each type (Wave 2)

| Connection Type  | Providers (Wave 2 offered) | Collect | Validate (honest scope) | Real I/O / delivery / spend       |
| ---------------- | -------------------------- | ------- | ----------------------- | --------------------------------- |
| **Exchange**     | Binance, Bybit, OKX        | Yes     | Yes                     | Handshake I/O → Wave 4            |
| **Notification** | Telegram, SMTP             | Yes     | Yes                     | Delivery / send → Wave 5          |
| **AI**           | OpenRouter                 | Yes     | Yes                     | Runtime use → Wave 2/7 rules      |
| **Storage**      | None                       | No      | No                      | Later wave / Master Plan deferral |

**Ownership:** Connection Management owns Connection Type and provider catalog rows and connection records. Vault owns secrets. Protocol owners remain Exchange Adapter (**Exchange**), Notification Delivery (**Notification**), and AI Gateway (**AI**). **Storage** has no Wave 2 protocol owner until Master Plan names one.

Do not implement provider logic in this planning package. Do not invent Coinbase / Slack / Discord / Teams / Push / Anthropic as Wave 2 Core — they may appear later under the same Connection Types without a new Connections product. Do not offer **Storage** providers in Wave 2.

---

## Customer workflows

### Create

Operator opens Connections → chooses a **Connection Type** and **provider** → enters required fields → product stores secret in Vault → connection metadata created → state Disconnected or Pending Validation — **not** Connected until validation succeeds.

### Validate

Operator runs Validate → Pending Validation → Connected or Validation Failed. Failures are readable in operator language without secret material.

### Replace

Operator replaces credentials → Vault receives new material → prior material invalidated per Vault rules → re-validation required before Connected.

### Disconnect

Operator disconnects → connection no longer usable as Connected → state Disconnected (or Revoked/Disabled if that path was chosen).

### Review

Operator reviews status, last validation outcome, and lifecycle visibility allowed by product — never plaintext secrets.

---

## Failure philosophy

| Situation               | Required product behavior                                     |
| ----------------------- | ------------------------------------------------------------- |
| Missing permission      | Unavailable or deny — not an empty success                    |
| Wrong workspace         | Fail closed deny                                              |
| Vault cannot store      | Fail closed; no fake Connected                                |
| Validation cannot run   | Pending ends in Validation Failed or honest unavailable       |
| Deferred vendor I/O     | Honest “not offered yet” / configured — not Connected theater |
| Partial outage          | Degrade honestly; do not claim delivery or live trading       |
| Secret revoked in Vault | Connection cannot remain Connected                            |

Defaults follow [`../security-default-policy.md`](../security-default-policy.md): default deny, fail closed, least privilege, honest product, everything attributable.

---

## Audit interaction

Connection Management **emits** attributable events for create, validate (success/failure), replace, disconnect, revoke, and disable.

Security Audit **persists** them. This package does not redesign the audit store, timeline, or incidents products.

---

## Product Acceptance Criteria

| #   | Outcome                                                              | Fail if                                  |
| --- | -------------------------------------------------------------------- | ---------------------------------------- |
| 1   | One Connections product lists Connection Types and offered providers | Env-only or simulated-only story remains |
| 2   | Create uses Vault; secret not readable back                          | `.env` or plaintext echo                 |
| 3   | Validate yields Connected or Validation Failed honestly              | Fake Connected                           |
| 4   | Replace keeps metadata; rotates secret via Vault                     | SSH required                             |
| 5   | Disconnect / revoke / disable stops Connected use                    | Stale Connected after disconnect         |
| 6   | Review shows status without secrets                                  | Secret disclosure                        |
| 7   | Cross-workspace connection access denied                             | Tenant leak                              |
| 8   | Unauthorized roles cannot mutate connections                         | Privilege bypass                         |

---

## Product Walkthrough (operator language)

```text
Connection Management Walkthrough

□ Sign in
□ Open Connections
□ Create connection (secret hidden after save)
□ Validate → Connected or Validation Failed
□ Replace credentials
□ Disconnect or revoke/disable
□ Review status (no plaintext secrets)
□ Foreign workspace denied
□ Unauthorized role denied
□ No live trading / delivery / AI-online claim from this package alone

PASS / NOT APPLICABLE / REQUIRES ACTION
```

---

## Mandatory Questions

1. **What customer problem does Connection Management solve?**
   Self-serve, honest management of external service connections without host files or simulated success.

2. **Which Wave 1 capabilities does it consume?**
   Vault, Authentication, Authorization, Workspace Isolation, Security Platform, Security Audit.

3. **What does Connection Management own?**
   Connection metadata, lifecycle, state, validation orchestration, provider-specific product behavior.

4. **What does it explicitly not own?**
   Secrets, identity, authentication, authorization, workspace, security platform, audit persistence, protocol I/O, delivery, AI execution, orders.

5. **Which providers are planned?**
   Connection Types: Exchange, Notification, AI, Storage. Wave 2 providers: Binance, Bybit, OKX; Telegram, SMTP; OpenRouter. Storage has none yet.

6. **What remains outside Wave 2?**
   Wave 3+ monitoring/ops, Wave 4 venue I/O completion, Wave 5 delivery, Wave 6 live trading, Wave 7+ AI platform breadth, analytics, billing, customer dashboards.

---

**STOP.** Wait for Product Owner review before W2-S01 implementation begins.
