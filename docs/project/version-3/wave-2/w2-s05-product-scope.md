# W2-S05 Product Scope

**Package:** W2-S05 AI Connectivity Foundation
**Wave:** 2 — Connection Management
**Status:** Implementation package — Planning **COMPLETE**. Not implementation. Awaiting Product Owner Approval.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w2-s05-implementation-package.md`](./w2-s05-implementation-package.md)
**Consumed:** [`w2-s01-product-scope.md`](./w2-s01-product-scope.md) · [`connection-management-overview.md`](./connection-management-overview.md) · [`paper-trading-overview.md`](./paper-trading-overview.md)
**Vision (read-only):** [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W2-S05. It does not redesign Connection Management. It does not redesign Vault. It does not redesign AI Gateway ownership. It does not reopen Wave 1. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 7 AI Platform Complete.

**Master Plan clarity:** Official Wave 2 roadmap IDs are `V3-C01`…`V3-C04`. `W2-S05` is Product Owner operational sequencing for remaining named Wave 2 OpenRouter use / no customer `.env` outcomes. This scope does not invent capabilities absent from Master Plan / Execution Roadmap / Vision / inventory.

---

## Product purpose

AI Connectivity Foundation is the product package that defines how the product **uses a workspace Vault-stored OpenRouter key** for AI Gateway runtime without customer `.env` and without operator process restart — with honest OpenRouter test and offline behavior.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspaces. Workspace owns membership; Isolation proves the boundary.

It does **not** own security platform defaults or audit persistence.

It does **not** own the Connections facade, catalog, or lifecycle redesign.

It does **not** own AI Gateway / OpenRouterProvider as a new domain.

It does **not** own Wave 7 multi-provider AI Platform, Knowledge products, Notification delivery, Paper Trading, Market Data, Exchange Connectivity, Live Trading, monitoring, analytics, or billing.

```text
Connection Management owns the connection product.
Vault owns ciphertext.
AI Gateway owns OpenRouter protocol I/O.
AI Connectivity Foundation owns vaulted-key runtime use outcomes,
OpenRouter test honesty, no-restart use, and offline honesty for Wave 2 exit.
OpenRouter usable does NOT mean Live Trading enabled.
OpenRouter usable does NOT mean AI controls capital.
OpenRouter usable does NOT mean Wave 7 AI Platform Complete.
```

---

## Why AI Connectivity Foundation exists (business language)

W2-S01 closed Connection Management: operators can create an OpenRouter connection and store credentials in Vault. That is not yet workspace AI runtime use without `.env` / restart.

W2-S02…W2-S04 closed Exchange Connectivity, Market Data, and Paper Trading. None of those packages owned OpenRouter vaulted-key runtime preference.

Paying customers need their workspace OpenRouter key to power AI without SSH, without host `.env`, and without restart — or see honest offline. Wave 2 Master Plan exit names that outcome.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- Open Connections and manage an OpenRouter (AI) connection
- Store or replace a Vault-backed OpenRouter key (write-only)
- Run OpenRouter Test and see success or vendor-visible failure
- Use AI for their workspace from the vaulted key without customer `.env`
- Use the vaulted key without restarting the product for that save/rotate
- See honest offline when no usable workspace key exists
- Stay inside their workspace and their authorization
- Never receive Live Trading, capital control, Notification delivery, or Wave 7 Complete from this package

---

## Consumes

| Product                             | How this package uses it                                   | Must not do                                           |
| ----------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| **Connection Management**           | OpenRouter catalog, connection record, lifecycle, UI place | Redesign or replace the facade                        |
| **Vault**                           | Retrieve workspace OpenRouter ciphertext for use / test    | Duplicate store; echo plaintext; auto-import host env |
| **Authentication**                  | Only signed-in operators manage / use AI connectivity      | Parallel login                                        |
| **Authorization**                   | Only permitted roles may manage / use                      | New IAM                                               |
| **Workspace Isolation**             | Vaulted key use stays in one workspace                     | Cross-workspace convenience                           |
| **Security Platform**               | Hardening and abuse/rate-limit defaults                    | Fork platform controls                                |
| **Security Audit**                  | Attributable OpenRouter test / use / fail / offline        | Own the audit store                                   |
| **AI Gateway / OpenRouterProvider** | Protocol I/O for OpenRouter test and runtime use           | Replace gateway ownership; invent second gateway      |
| **W2-S02…W2-S04 (context)**         | Closed Wave 2 products remain available; not redesigned    | Reopen Exchange / Market Data / Paper ownership       |

---

## Owns

| Outcome                               | Customer meaning                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| Vaulted OpenRouter runtime preference | Workspace vault key is preferred for AI when present                           |
| No customer `.env` OpenRouter story   | Production customer journey does not require OpenRouter env                    |
| No-restart vaulted key use            | Save/rotate vaulted OpenRouter key does not require operator process restart   |
| OpenRouter connection test honesty    | Operator-triggered test; success or vendor-visible failure                     |
| Honest AI offline                     | No usable workspace key → offline honesty (host fallback not production story) |
| Workspace-scoped AI key use outcomes  | A cannot use B’s OpenRouter key                                                |
| Attributable AI-connectivity outcomes | Test / use / fail / offline emit to Security Audit                             |

---

## Does NOT own

| Concern                        | Real owner                      |
| ------------------------------ | ------------------------------- |
| Connection Management facade   | W2-S01 (CLOSED)                 |
| Secret ciphertext / encryption | Vault                           |
| AI Gateway domain              | AI Gateway / OpenRouterProvider |
| Wave 7 AI Platform Complete    | Wave 7 / V3-A01…A04             |
| OpenAI / Gemini / Anthropic    | Wave 7                          |
| Knowledge durability / export  | Wave 7                          |
| Notification delivery          | Wave 5                          |
| Exchange Connectivity          | W2-S02 (CLOSED)                 |
| Market Data                    | W2-S03 (CLOSED)                 |
| Paper Trading                  | W2-S04 (CLOSED)                 |
| Live Trading                   | Wave 6 / Order Path             |
| Authentication / Authorization | Wave 1 owners                   |
| Workspace Isolation            | Workspace Isolation             |
| Monitoring                     | Wave 3 Monitoring               |
| Analytics                      | Later                           |
| Billing                        | Later                           |
| Canonical Order Path / Ledger  | Existing owners                 |

---

## IN Scope

| Item                                  | Customer meaning                                    |
| ------------------------------------- | --------------------------------------------------- |
| Vaulted OpenRouter runtime preference | Use workspace vault key when present                |
| No customer `.env` for OpenRouter use | Production story does not require OpenRouter env    |
| No restart for vaulted key use        | Save/rotate does not force operator restart for use |
| OpenRouter Test                       | Success or vendor-visible failure                   |
| Honest offline                        | Unavailable when no usable workspace key            |
| Workspace isolation                   | A cannot use B’s OpenRouter key                     |
| Authorization                         | Unauthorized roles cannot manage / use              |
| Operator walkthrough                  | AI Connectivity Walkthrough                         |
| Security boundaries                   | Consume Wave 1 and W2-S01…S04; do not redefine      |
| Audit interaction                     | Emit OpenRouter test / use / fail / offline         |
| Failure philosophy                    | Fail closed; no fake AI online; no secret echo      |
| Validation strategy                   | Close criteria, evidence, regressions               |

---

## OUT OF Scope

Explicitly out of this package:

| Item                                    | Declaration                          |
| --------------------------------------- | ------------------------------------ |
| Wave 7 AI Platform Complete             | **No Wave 7 Complete**               |
| OpenAI / Gemini / Anthropic             | **No multi-provider AI**             |
| Knowledge durability / export           | **No Knowledge product**             |
| Notification delivery                   | **No Notification delivery**         |
| Telegram production vendor test         | **No Wave 5 replacement**            |
| Live Trading                            | **No Live Trading**                  |
| AI capital control / order placement    | **No AI capital control**            |
| Connection Management redesign          | Out                                  |
| Vault redesign                          | Out                                  |
| Exchange / Market Data / Paper redesign | Out                                  |
| Monitoring                              | Out                                  |
| Analytics                               | Out                                  |
| Billing                                 | Out                                  |
| Secrets store                           | Out (Vault)                          |
| Identity / authn / authz / workspace    | Out                                  |
| Audit persistence                       | Out                                  |
| Full CM-04 background health product    | Out unless PO later sequences it     |
| Implementation slices                   | **Not opened in this planning task** |
| Wave 1 changes                          | Out                                  |
| Master Plan changes                     | Out                                  |
| Ownership changes                       | Out                                  |
| Wave 2 COMPLETE declaration             | Out                                  |

---

## Ownership (binding)

### Architecture consume diagram (planning)

```text
AI Connectivity Foundation
        │ consumes
        ├── Connection Management
        ├── Vault
        ├── Authentication
        ├── Authorization
        ├── Workspace Isolation
        ├── Security Platform
        ├── Security Audit
        └── AI Gateway / OpenRouterProvider

AI Connectivity Foundation
        │ owns (product outcomes)
        ├── vaulted OpenRouter runtime preference
        ├── no customer .env OpenRouter production story
        ├── no-restart vaulted key use
        ├── OpenRouter test honesty
        ├── honest AI offline
        └── workspace-scoped AI key use outcomes

AI Connectivity Foundation
        │ does not own
        ├── Connection Management facade
        ├── Vault
        ├── AI Gateway domain
        ├── Wave 7 AI Platform
        ├── Notification delivery
        ├── Live Trading
        ├── Paper Trading
        ├── Market Data
        ├── Exchange Connectivity
        ├── Monitoring
        ├── Analytics
        └── Billing
```

No ownership changes. No new bounded context invented by this planning package. Connections remain Connection Management. Secrets remain Vault. Protocol I/O remains AI Gateway. Live trading remains later. Wave 7 remains later.

---

## Honesty rules

1. **OpenRouter test succeeded** means the offered OpenRouter test used the vaulted key and the vendor outcome was success.
2. **OpenRouter test failed** must show a vendor-visible failure — never fake Connected, never echo the secret.
3. **AI usable for this workspace** means runtime preferred the workspace vaulted key (or documented non-production fallback rules that are not the customer story).
4. **AI offline** means no usable key / provider unavailable — not fake success.
5. Vaulted OpenRouter use does **not** mean Live Trading enabled.
6. Vaulted OpenRouter use does **not** mean AI controls capital or places orders.
7. Vaulted OpenRouter use does **not** mean Notification delivered.
8. Vaulted OpenRouter use does **not** mean Wave 7 AI Platform Complete.
9. Host `OPENROUTER_API_KEY` must not be auto-imported into every workspace.
10. Secrets are never shown, logged, exported, or stored locally by this package.
11. Connection Management lifecycle (rotate/disconnect) is consumed, not redesigned.

---

## Customer workflows

### Sign in

Operator signs in. AI connectivity actions require authentication.

### Open Connections

Operator opens Connections and the AI / OpenRouter row. This package does not invent a second Connections place.

### Store or replace OpenRouter key

Operator enters the OpenRouter key. Vault stores ciphertext. The form does not keep showing the secret after save.

### Test OpenRouter

Operator runs **Test**. Status becomes success or vendor-visible failure. Connected/test success does not mean Live Trading or capital control.

### Use AI for this workspace

AI Gateway prefers the workspace vaulted key. The operator does not edit customer `.env` and does not restart the product for that save/rotate.

### Rotate or Disconnect

Operator rotates credentials or disconnects through Connection Management lifecycle. Previous material becomes unusable. Use stops honestly after disconnect/revoke.

### Honest offline

If no usable workspace key exists, AI is offline honestly. Host env fallback is not the production customer story.

### Verify workspace isolation

Workspace A cannot use Workspace B’s OpenRouter key.

### Verify authorization

A role without permission cannot manage OpenRouter connectivity or use restricted AI connectivity outcomes.

---

## Failure philosophy

| Situation                              | Required product behavior                               |
| -------------------------------------- | ------------------------------------------------------- |
| Missing permission                     | Deny — not an empty success                             |
| Wrong workspace                        | Fail closed deny                                        |
| Vault cannot retrieve                  | Fail closed; no local plaintext fallback store          |
| OpenRouter vendor rejects key          | Vendor-visible failure; no fake Connected               |
| No usable workspace key                | Honest offline                                          |
| Client asserts “AI online” / Connected | Reject; server owns status                              |
| Attempted AI capital control           | Out of scope; must not place live orders                |
| Host env present without vault key     | Documented fallback only; not production customer story |

Defaults follow [`../security-default-policy.md`](../security-default-policy.md): default deny, fail closed, least privilege, honest product, everything attributable.

---

## Audit interaction

AI Connectivity Foundation **emits** attributable events for OpenRouter test success/failure, vaulted-key use preference outcomes, offline, and fail.

Security Audit **persists** them. This package does not redesign the audit store.

---

## Product Acceptance Criteria

| #   | Outcome                                                                            | Fail if                              |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------ |
| 1   | Vaulted OpenRouter key used for workspace AI without customer `.env`               | `.env` required for customer journey |
| 2   | Save/rotate vaulted key does not require operator restart for use                  | Restart required                     |
| 3   | OpenRouter Test success or vendor-visible failure                                  | Fake Connected; secret echo          |
| 4   | Honest offline when no usable workspace key                                        | Fake AI online                       |
| 5   | Cross-workspace OpenRouter key use denied                                          | Tenant leak                          |
| 6   | Unauthorized access denied                                                         | Privilege bypass                     |
| 7   | No Live Trading, capital control, Notification delivery, or Wave 7 Complete claims | Dishonest claim                      |
| 8   | No plaintext secret exposure                                                       | Exposure                             |

---

## Product Walkthrough (operator language)

```text
AI Connectivity Walkthrough

□ Sign in
□ Open Connections
□ OpenRouter connection + Vault key
□ Run OpenRouter Test
□ Use AI for this workspace (no .env; no restart)
□ Rotate / Disconnect honesty
□ Honest offline
□ Verify workspace isolation
□ Verify authorization

PASS / NOT APPLICABLE / REQUIRES ACTION
```

---

## Out of scope declarations (binding)

This package does **not** deliver:

- No Wave 7 AI Platform Complete
- No OpenAI / Gemini / Anthropic providers
- No Knowledge durability / export
- No Notification delivery
- No Live Trading
- No AI capital control
- No Connection Management redesign
- No Vault redesign
- No Wave 1 changes
- No Master Plan changes
- No ownership changes
- No implementation slices in this planning open
- No Wave 2 COMPLETE declaration

---

## Mandatory Questions

1. **What business problem does W2-S05 solve?**
   OpenRouter keys can be collected in Connections, but AI runtime still depends on host `.env` / restart or lacks honest vaulted-key use — blocking Wave 2 exit.

2. **Why is W2-S05 required after W2-S04?**
   Paper Trading Foundation closed simulated execution. It did not deliver OpenRouter vaulted-key runtime use. Remaining Wave 2 OpenRouter use / no customer `.env` outcomes are sequenced after W2-S04 Close.

3. **Which existing products does W2-S05 consume?**
   Connection Management (W2-S01), Vault, Authentication, Authorization, Workspace Isolation, Security Platform, Security Audit, AI Gateway / OpenRouterProvider; W2-S02…S04 as closed non-redesigned context.

4. **What does W2-S05 own?**
   Vaulted OpenRouter runtime preference, no customer `.env` OpenRouter production story, no-restart vaulted-key use, OpenRouter test honesty, honest AI offline, and workspace-scoped AI key use outcomes.

5. **What is explicitly out of scope?**
   Wave 7 AI Platform / multi-provider AI, Knowledge products, Notification delivery, Live Trading, AI capital control, redesigns of consumed products, Wave 1 / Master Plan / ownership changes, implementation slices in this open, and Wave 2 COMPLETE declaration.

6. **Does W2-S05 modify Wave 1?**
   No.

7. **Does W2-S05 modify Version 2 architecture?**
   No.

8. **Does W2-S05 introduce any ownership changes?**
   No.

---

**STOP.** Wait for Product Owner review before W2-S05 implementation planning is approved.
