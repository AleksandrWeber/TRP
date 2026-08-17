# V3-S03 Product Scope

**Package:** V3-S03 Secret Vault & Encryption
**Wave:** 1 — Security Foundation
**Status:** Implementation package — **Approved**. Planning **COMPLETE**. Not implementation.
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Umbrella:** [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md)
**Baseline (read-only):** [`version-2-connection-management-audit.md`](../version-2-connection-management-audit.md)

This document freezes **IN / OUT**, **ownership**, **customer outcomes**, **honest Vault language**, **secret classification**, **secret state machine**, **failure philosophy**, and **secret ownership rules** for V3-S03. It does not add journeys the Master Plan did not already name. It does not redesign Version 2.

Canonical planning freeze: [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md) §5–§8.

---

## Product purpose

Secret Vault is the product that **holds customer credentials** so the operator does not put them in a host file.

It does **not** connect Binance, Bybit, or OKX. Exchange Adapter still owns venue protocol. Connection Management still owns the later wizard, test, health, and disconnect product.

It does **not** send Telegram, email, or other notifications. Notification Delivery still owns send.

It does **not** run AI chat. AI Gateway still owns the model call.

It does **not** replace Authentication. Passwords, sessions, and recovery stay with V3-S01 (**CLOSED**).

It does **not** replace RBAC. Who may open Vault stays with the permission model from V3-S02 (**CLOSED**). This package binds the Vault cells that S02 left unbound.

It does **not** become financial Source of Truth. Ledger remains money. Vault is not orders, fills, or balances.

```text
The Vault exists to support the product.
The Vault is NOT a generic infrastructure project.
The Vault owns secrets only.
```

---

## Why Vault exists (business language)

A paying customer cannot operate TRP by editing server files. Today, the keys that would make exchanges, AI, and notifications real either live in `.env`, live in process memory, or do not exist at all. That is host tribal knowledge. It is not a product.

Vault exists so the **customer owns their secrets inside the product**: store them, prove they are well-formed, keep them unreadable as plaintext, revoke them, and delete them. Later products (connections, venues, channels, AI) can then use those secrets without asking the customer to SSH.

Vault is required **before** Connection Management because a connection wizard without a vault still has nowhere honest to put a key. The Version 2 Connection Management Audit is the factual proof of that gap. This package does not reopen or redesign that audit.

---

## Customer value

After this package Closes, an operator can keep an exchange, AI, or notification credential in the product without pasting it into `.env`, without reading it back later, and without claiming the vendor is live.

Wave 1 line this package owns (Master Plan §4 / customer-observable Wave 1):

> The product can store a secret that I cannot read back as plaintext.

Execution Roadmap Wave 1 exit line this package owns:

> A secret can be stored encrypted at rest and read only by the owning workspace’s authorized runtime.

This package does **not** own the Wave 2 line “I save Binance credentials and the product does not tell me I am live-trading Connected yet.” That sentence is Connection Management, which **uses** Vault.

---

## Version 2 baseline (Connection Management Audit)

The Version 2 Connection Management Audit is the factual baseline. Do not treat architecture intent as current product. Do not redesign Version 2 to invent a vault that already existed.

| Fact from the audit                                                                | Meaning for this package                                                                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Version 2 has **no** unified Connection Management product                         | Vault is not that product. Wave 2 still owns Connections.                                                                             |
| OpenRouter key lives in `.env` (plaintext, process-global)                         | Vault must become the customer path for that class of secret. This package **stores** it. AI Gateway must **not** start using it yet. |
| Binance / Bybit / OKX trading adapters store connection **state**, not credentials | Do not put secrets on `ExchangeConnection`. Vault is a new store. Simulated `CONNECTED` is not a vault success.                       |
| Public Binance REST/WS/import need **no** trading key                              | Vault does not invent a key for public market data.                                                                                   |
| Telegram wizard is in-memory, not Bot API; no bot token stored                     | Vault may hold a Telegram bot token. It does not bind Telegram or send messages.                                                      |
| Email / Slack / Discord / Teams / Push are reserved; no credentials                | Vault may hold SMTP (and later channel secrets). It does not activate reserved channels.                                              |
| No Secret Manager, no Prisma secret models, no encryption of integration secrets   | SEC-06 / SEC-07 are **missing**. This package creates them.                                                                           |
| `DATABASE_URL`, Redis, `JWT_SECRET` are host env                                   | They stay host infrastructure. They are **not** customer vault material.                                                              |
| Paying customers cannot self-serve real connections without server access          | Vault is the first customer-owned secret path. Connections come later.                                                                |

Audit recommendation used here: **Credential Vault** as a product capability to store customer-supplied secrets instead of process env or omission. Audit recommendations **not** used here: Connection Management UI, wizard, real vendor test, health monitoring, disconnect-as-connection-product, reserved-channel activation, real Telegram transport, real exchange I/O, customer-owned AI **use**.

---

## Customer products that will depend on Vault

Vault is a foundation. These later products consume it. They are **not** delivered by V3-S03.

| Later product                                                   | What it will need from Vault                                 | Owner later                      |
| --------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------- |
| **Connection Management**                                       | A place to write and read integration secrets without `.env` | Wave 2 `V3-C01` … `C04`          |
| **Binance** (trading credentials)                               | Key + secret held per workspace                              | Wave 2 collect; Wave 4 I/O       |
| **Bybit**                                                       | Same                                                         | Wave 4                           |
| **OKX**                                                         | Same (plus passphrase when that venue requires it)           | Wave 4                           |
| **Telegram**                                                    | Bot token held; bind and delivery later                      | Wave 5                           |
| **SMTP / Email**                                                | SMTP material held; send later                               | Wave 5 `V3-N02`                  |
| **OpenRouter**                                                  | Customer API key held; Gateway use later                     | Wave 2 / 7                       |
| **Future AI providers** (OpenAI, Gemini, Anthropic)             | Typed secrets on the same vault                              | Wave 7                           |
| **Future notification providers** (Slack, Discord, Teams, Push) | Typed secrets on the same vault                              | Wave 5                           |
| **Developer Platform** (customer API keys)                      | Vaulted keys                                                 | Wave 9                           |
| **Live Trading**                                                | Venue secrets already in vault                               | Wave 6 (after Waves 1–4 and ADR) |
| **Workspace isolation tests**                                   | Prove workspace A cannot read B’s vault                      | **V3-S06**                       |
| **Audit product**                                               | Persist vault create / revoke / delete events                | **V3-S05**                       |

Kraken remains a Wave 4 venue. Vault must not need a new bounded context when Kraken credentials are later held. Public market-data paths stay unused by Vault.

---

## Customer outcomes (this package only)

The customer **receives:**

- Secure credential storage (not `.env`, not plaintext columns, not readable back in the UI)
- Credential lifecycle (add, replace by storing again, revoke, delete)
- Credential validation (the vault accepts well-formed material for a known type — not a vendor handshake)
- Credential removal (revoke stops use; delete removes the record)
- Product ownership of secrets (the product holds them; the host file is not the customer path)

The customer does **NOT** receive:

- Binance connection (or Bybit / OKX / Kraken trading I/O)
- Telegram delivery
- AI chat that uses the stored key
- Email sending
- Live trading
- Connection Management UI
- Automated key rotation
- Secrets synchronization across hosts
- Billing
- A plaintext export of stored secrets

---

## Ownership (binding)

Secret Vault **is** a new bounded context. The Master Plan already named it: **Credential Vault** — the only justified new security domain in Version 3 (Master Plan §7, §10, §11). It is not financial Source of Truth.

| Concern                                                                      | Owner                                                          | Must not own                                                                            |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Credentials (vendor secrets)**                                             | **Vault**                                                      | `.env` as the customer path; `ExchangeConnection` columns; Identity passwords           |
| **Secret lifecycle** (create, stored, revoked, deleted)                      | **Vault**                                                      | Connection status (`connected` / `expired` / `permission` as vendor health)             |
| **Validation** (type + required fields; reject empty/malformed)              | **Vault**                                                      | Vendor round-trip; `spot.trade` from the venue                                          |
| **Encryption** (ciphertext at rest; wrapping key separate)                   | **Vault** (SEC-07)                                             | Host `DATABASE_URL` / Redis / JWT wrapping as customer secrets                          |
| **Revocation** (stored secret becomes unusable)                              | **Vault**                                                      | Session revoke (S01); connection disconnect product (Wave 2)                            |
| **Runtime retrieve** (decrypt in memory for an authorized adapter **later**) | **Vault** port                                                 | Returning plaintext to the browser; wiring Exchange / AI / Notification in this package |
| Login passwords, sessions, recovery                                          | Authentication (S01 CLOSED)                                    | Vendor secrets                                                                          |
| Who may open Vault                                                           | Authorization (S02 CLOSED) + this package binds C8 vault cells | A new IAM context                                                                       |
| Workspace membership                                                         | Workspace                                                      | Vault records as membership                                                             |
| Venue protocol                                                               | Exchange Adapter                                               | Secret storage                                                                          |
| Connection catalog / wizard / test / health                                  | Connection Management facade (Wave 2)                          | Ciphertext                                                                              |
| Send Telegram / SMTP                                                         | Notification Delivery                                          | Secret storage                                                                          |
| Model call                                                                   | AI Gateway                                                     | Secret storage                                                                          |
| Money                                                                        | Ledger                                                         | —                                                                                       |

Host infrastructure remains host-operated: `DATABASE_URL`, Redis, `JWT_SECRET`, and host mail used for password recovery. Those are not Vault records.

### Secret Ownership Rules

Canonical: [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md) §8.

```text
The Vault never owns
  Connections
  Notifications
  AI
  Trading
  Exchanges

Only secrets.
Only credentials.
```

A later product may consume a vaulted secret. Consuming is not owning. Vault does not become Binance, Telegram, SMTP, OpenRouter, or live trading because it holds those credentials.

---

## Vault language (Honest Product)

The operator walkthrough may show a stored credential as **Connected** on the **Vault** screen. That word means only:

> The vault holds a validated credential for this type.

It does **not** mean Binance is connected, Telegram is delivering, email is sending, AI is online, or live trading is available.

This is the **Connected** state in the Secret State Machine. Vault accepted the secret. The external provider was not asked.

Required copy outcomes:

- Vault **Connected** / **Stored** is a vault-record status, not a venue session.
- The screen must not say “Binance connected”, “Live trading connected”, or “Telegram connected to Telegram”.
- Simulated Version 2 exchange `CONNECTED` without keys remains dishonest and is **not** this product’s success.
- Public Binance data does not appear as a vaulted trading key.

Preferred operator labels on the Vault screen are in **Secret State Machine** below.

---

## Roles (C8 vault cells)

V3-S02 left **C8 Vault / connections** unbound on purpose. This package binds **vault lifecycle only**. Connection wizards, vendor test, health, and rotation-with-connection-metadata stay Wave 2.

| Action                                           | Reader    | Researcher | Trader                  | Admin                   |
| ------------------------------------------------ | --------- | ---------- | ----------------------- | ----------------------- |
| Open Vault; see metadata (type, status, updated) | No        | No         | **Yes** (own workspace) | **Yes** (own workspace) |
| Add / replace a credential                       | No        | No         | **Yes**                 | **Yes**                 |
| See validation success or honest failure         | No        | No         | **Yes**                 | **Yes**                 |
| Revoke                                           | No        | No         | **Yes**                 | **Yes**                 |
| Delete                                           | No        | No         | **Yes**                 | **Yes**                 |
| Read secret back as plaintext in UI or API       | **Never** | **Never**  | **Never**               | **Never**               |
| Connection wizard / vendor test / live I/O       | Out       | Out        | Out                     | Out                     |

Runtime retrieve is not a customer action. It is a later adapter privilege, still workspace-scoped, never a browser privilege.

Default new user remains **Researcher**. Register does not grant Vault. Admin is not a Gate/Risk bypass and is not a plaintext-reader.

Membership remains owner-only until Wave 9. Vault records are scoped to the workspace the operator is a member of. A role does not open another workspace’s vault.

---

## Holdable types (schemas, not products)

The vault must accept well-formed material for the types later products will need. Accepting a type is **not** activating that product.

**Must hold in this package:**

| Type            | Material (customer language)                            | Not implied                                      |
| --------------- | ------------------------------------------------------- | ------------------------------------------------ |
| Binance trading | API key and secret                                      | Venue handshake, live orders, public market data |
| Bybit trading   | API key and secret                                      | Venue I/O                                        |
| OKX trading     | API key and secret (passphrase if the type requires it) | Venue I/O                                        |
| Telegram        | Bot token                                               | Bot API, chat bind, delivery                     |
| SMTP            | Host, port, username, password, sender                  | Email send; not host recovery mail               |
| OpenRouter      | API key                                                 | Chat completion; not process `.env` use yet      |

**Must not require a new vault later:** additional typed secrets (Kraken, OpenAI, Gemini, Anthropic, Slack, Discord, Teams, Push, customer API keys) are the same bounded context. This package must not ship those as Connect buttons. It must not force a second vault when Wave 2/5/7/9 add a type.

One workspace holds at most one active secret per (type, purpose). Purpose distinguishes, for example, trading keys from a later customer API key. Public market data is not a purpose that stores a trading secret.

---

## Secret Classification

Canonical: [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md) §5.

**Rotation = Yes** means the operator may replace the secret in Vault. It is not the Wave 2 rotation product.

| Secret                                  | Owner    | Rotation | Read back | Export |
| --------------------------------------- | -------- | -------- | --------- | ------ |
| Binance API                             | Customer | Yes      | No        | No     |
| Bybit API                               | Customer | Yes      | No        | No     |
| OKX API                                 | Customer | Yes      | No        | No     |
| Telegram Bot                            | Customer | Yes      | No        | No     |
| SMTP (customer notification mail)       | Customer | Yes      | No        | No     |
| OpenRouter                              | Customer | Yes      | No        | No     |
| Later typed vendor secrets (same Vault) | Customer | Yes      | No        | No     |
| `JWT_SECRET`                            | Host     | Manual   | N/A       | N/A    |
| Vault wrapping key                      | Host     | Manual   | N/A       | N/A    |
| `DATABASE_URL`                          | Host     | Manual   | N/A       | N/A    |
| Redis / queue                           | Host     | Manual   | N/A       | N/A    |
| Host recovery mail (`MAIL_*`)           | Host     | Manual   | N/A       | N/A    |

Login passwords stay with Authentication (S01). They are not Vault material.

---

## Secret State Machine

Canonical: [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md) §6.

```text
Created
  ↓
Validated
  ↓
Connected
  ↓
Revoked
  ↓
Deleted
```

**Connected** means the vault stores the credential. It does **not** mean the external provider works.

| State         | Customer meaning                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| **Created**   | Credentials were submitted. Not yet a success.                                                        |
| **Validated** | Fields are well-formed for this type. Not a vendor test.                                              |
| **Connected** | Vault holds the credential. Operator cannot read it back. Not Binance / Telegram / email / AI / live. |
| **Revoked**   | The credential cannot be used. The type may still be listed as revoked.                               |
| **Deleted**   | Gone. Not recoverable from the product. Type returns to not stored.                                   |

Reject: Created → validation fails → not stored. The UI does not show Connected.

Replace: store again for the same (workspace, type, purpose). That is lifecycle, not Wave 2 `V3-C04`.

Operator labels **Stored** and Vault **Connected** are this **Connected** state. They remain vault-record status, never venue status.

Preferred operator labels on the Vault screen:

| Vault state                      | Operator meaning                                   |
| -------------------------------- | -------------------------------------------------- |
| **Not stored**                   | No credential for this type in this workspace      |
| **Stored** / Vault **Connected** | Validated material is held; not a vendor handshake |
| **Invalid**                      | Validation refused; nothing stored as success      |
| **Revoked**                      | Held material is unusable until replaced           |
| **Deleted**                      | Gone; not recoverable from the product             |

---

## User journeys

### Wave 1 — Store a secret the customer cannot read back (this package)

1. Operator signs in (S01).
2. Operator is Trader or Admin in the current workspace (S02).
3. Opens **Vault** in the existing signed-in shell (Administration, unless a later approved shell label is used — not a new chrome product).
4. Chooses a type (for the walkthrough: Binance).
5. Enters credentials. Submits.
6. Validation accepts well-formed material or refuses with an honest error.
7. On success, the type shows **Stored** / Vault **Connected** (state machine: **Connected** — Vault holds the credential). The secret is not shown again.
8. Operator can revoke. Retrieve must fail. Metadata may still show revoked.
9. Operator can delete. The type returns to not stored.
10. A Reader or Researcher who opens Vault is refused honestly.

Honest failures the customer must still see:

- Empty or incomplete Binance key/secret is refused. The UI does not show Stored.
- Another workspace’s vault is not listed and not readable.
- Binance / Telegram / AI / email / live are not offered as working integrations.
- Host `.env` is not presented as the way to save the key.

### Journeys this package must not start

| Journey                                                         | Owner           |
| --------------------------------------------------------------- | --------------- |
| J3-03 Connect Binance from UI: vault → test → connected         | Wave 2 + Wave 4 |
| J3-04 Rotate a secret without SSH (connection rotation product) | Wave 2 `V3-C04` |
| J3-05 See all connections and health in one place               | Wave 2          |
| J3-06 Real Telegram / Email                                     | Wave 5          |
| J3-07 Use customer OpenRouter key in AI                         | Wave 2 / 7      |
| J3-10 Live session                                              | Wave 6          |

J-01…J-14 paper-first journeys must not regress. Paper does not need Vault.

---

## IN SCOPE

| Item                                 | Customer meaning                                                                                         | Owner                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Credential Vault bounded context** | The product that stores vendor secrets                                                                   | New justified Vault module (Master Plan §10) |
| **Secure storage**                   | Secrets not in customer `.env`, logs, UI, or plaintext columns                                           | Vault + SEC-07                               |
| **Encryption at rest**               | Database theft does not yield usable customer keys                                                       | Vault                                        |
| **Wrapping-key separation**          | Platform wrapping key is not stored with ciphertext                                                      | Host-held wrapping key; Vault ciphertext     |
| **Lifecycle**                        | Add, Created → Validated → Connected → Revoked → Deleted, replace-by-store                               | Vault                                        |
| **Validation**                       | Required fields for holdable types; reject empty/malformed                                               | Vault — **not** vendor I/O                   |
| **Vault product surface**            | Operator opens Vault, stores Binance (and other holdable types), sees Stored/Connected, revokes, deletes | Projection over Vault; existing shell        |
| **Metadata only on list/read**       | Type, status, timestamps — never secret material                                                         | Vault                                        |
| **C8 vault cells**                   | Trader and Admin may manage vault in their workspace                                                     | Authorization decision (S02 model) + Vault   |
| **Workspace-scoped records**         | Workspace A cannot read workspace B                                                                      | Vault + existing Workspace membership        |
| **Runtime retrieve port**            | Later adapters can obtain plaintext in memory; browser cannot                                            | Vault port; **no consumer wiring** in S03    |
| **Structured vault events**          | Create / revoke / delete / validation failure, no secret material                                        | Logs for S05; not the audit product          |
| **Host vs customer split**           | `DATABASE_URL` / Redis / JWT / host recovery mail stay host                                              | Unchanged                                    |

---

## OUT OF SCOPE

Do not implement these in V3-S03. Several are real Version 3 work on **later** packages.

| Item                                                                        | Why out                                                  | Owner later                                 |
| --------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------- |
| **Connection Management UI**                                                | Wave 2 product facade                                    | **V3-C01**                                  |
| **Connection Wizard**                                                       | Collect-as-connections-product                           | **V3-C02**                                  |
| **Exchange connectivity / venue handshake**                                 | Real Binance / Bybit / OKX I/O                           | Wave 4 `V3-E*`                              |
| **Telegram Bot / delivery**                                                 | Real Bot API                                             | Wave 5                                      |
| **SMTP delivery / email send**                                              | Notification transport                                   | **V3-N02**                                  |
| **AI chat using the stored key**                                            | Gateway still uses host env or offline until Wave 2      | Wave 2 / 7                                  |
| **Live Trading**                                                            | Unauthorized until Waves 1–4 + ADR                       | Wave 6                                      |
| **API key rotation automation**                                             | Rotation product + runbook                               | **V3-C04** / Wave 10 runbooks               |
| **Secrets synchronization**                                                 | Not in Master Plan as a product                          | Out of Version 3 unless the plan is revised |
| **Billing**                                                                 | Isolated billing                                         | Wave 9                                      |
| **Customer API keys as a developer product**                                | Developer Platform                                       | Wave 9                                      |
| **Switching OpenRouter runtime off `.env`**                                 | Customer **use** of the key                              | Wave 2                                      |
| **Auto-copy `.env` into Vault**                                             | Global host key must not become every workspace’s secret | Forbidden                                   |
| **Writing secrets onto `ExchangeConnection`**                               | Audit: state is not credentials                          | Forbidden                                   |
| **Storing `DATABASE_URL` / Redis / JWT in Vault**                           | Host infrastructure                                      | Host                                        |
| **Plaintext secret export**                                                 | Forbidden as a customer feature                          | —                                           |
| **Vendor test / health / expired / permission status**                      | Connection Testing                                       | **V3-C03**                                  |
| **SSRF allowlists for webhooks**                                            | Platform OWASP + Wave 5                                  | **V3-S04** / Wave 5                         |
| **Append-only audit product / audit UI**                                    | Structured events only                                   | **V3-S05**                                  |
| **Isolation suite as a product**                                            | Must not punch a hole                                    | **V3-S06**                                  |
| **Platform CSP / helmet / global OWASP**                                    | Later Wave 1                                             | **V3-S04**                                  |
| **MFA, OAuth, passkeys**                                                    | Not Vault                                                | Wave 6 / not planned                        |
| **ABAC engine**                                                             | Not justified                                            | Out of Version 3                            |
| **Second order path / Ledger / Risk / Gate**                                | Forbidden                                                | —                                           |
| **Redesign of Version 2 adapters, Telegram wizard, or `.env` host loading** | Certified baseline                                       | —                                           |

Nothing above is invented as IN Scope. If a desired item is not in the Master Plan, **stop**.

---

## Migration Strategy from Version 2 (scope freeze)

Full plan: [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md) § Migration Strategy from Version 2. This table is the scope freeze so implementation cannot invent a bulk import.

| Move                                                                       | This package        | Not this package                    |
| -------------------------------------------------------------------------- | ------------------- | ----------------------------------- |
| Customer **re-enters** OpenRouter / venue / Telegram / SMTP into Vault     | **In** (store)      | Auto-copy from `.env`               |
| AI Gateway, Exchange Adapter, Notification Delivery keep current readers   | **In** (leave them) | Switching them onto Vault           |
| Host `DATABASE_URL`, `JWT_SECRET`, recovery `MAIL_*`, Redis, process flags | Stay host           | Moving them into Vault              |
| `OPENROUTER_API_KEY` env reader                                            | Unchanged           | Removing it in S03                  |
| New host wrapping key                                                      | Host-operated       | Customer Vault record               |
| Certified paper / login / People / AI-from-env / in-memory Telegram        | Must keep working   | Taking them down to “turn on” Vault |

**First secret that today lives in `.env` and will become a Vault customer secret:** `OPENROUTER_API_KEY`. Consume moves in **Wave 2**, not S03.

**Secrets that are not in `.env` today:** exchange keys, Telegram bot token, customer SMTP. First write is Vault. Nothing to migrate.

**Downtime:** none for certified journeys. Vault is additive. If the wrapping key is missing, Vault fails closed; the rest of the product stays up. See **Failure Philosophy**.

---

## Failure Philosophy

Canonical: [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md) §7.

```text
Vault unavailable
  ↓
Paper Trading continues
  ↓
Authentication continues
  ↓
Research continues
  ↓
Integrations unavailable
```

Vault must not take down the paper-first product.

| Unavailable                                                   | What the customer still has                                                                                                                   | What they do not have                                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Vault**                                                     | Paper, sign-in, People, research as certified today                                                                                           | Store/retrieve vendor secrets; later integrations that need Vault                                  |
| **Wrapping key**                                              | Same as Vault unavailable for secrets                                                                                                         | Readable stored secrets until the host wrapping key is restored — no fake “still works”            |
| **Database**                                                  | Nothing persisted that already needs the database (host outage). If only Vault is unusable and the database is up: paper and sign-in continue | The whole persisted product, if the host database itself is down — that is not a Vault kill switch |
| **Provider validation** (Binance, Telegram, OpenRouter, SMTP) | Vault store still works. Validation is fields, not a vendor call                                                                              | A claim that the vendor answered. Connected still does not mean the provider works                 |

Paper does not need Vault. Sign-in does not need Vault. Research as certified today does not need Vault. Integrations that would consume Vault may be unavailable. That is correct.

---

## Product acceptance criteria (customer-visible)

A reviewer who is not an engineer must be able to do the following **in the product UI**:

| #   | Outcome                                                                                                                                                                                           | Fail if                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | A **Trader or Admin** opens Vault and stores Binance credentials without SSH, customer `.env`, or SQL.                                                                                            | The only path is editing `.env` or the database.                        |
| 2   | After store, the operator **cannot read the secret back** in the UI or a normal API response.                                                                                                     | Key or secret is displayed, downloaded, or logged.                      |
| 3   | Validation refuses empty or incomplete credentials with an honest error. Nothing is shown as Stored.                                                                                              | Fake success; silent store of empty material.                           |
| 4   | Stored shows as Vault **Stored** / **Connected** and does **not** claim Binance trading, live, Telegram, email, or AI.                                                                            | “Binance connected” or live theater.                                    |
| 5   | Operator can **revoke**; the secret is no longer usable to retrieve.                                                                                                                              | Revoke is cosmetic.                                                     |
| 6   | Operator can **delete**; the type is not stored.                                                                                                                                                  | Delete leaves plaintext or a still-retrievable secret.                  |
| 7   | **Reader / Researcher** cannot open Vault as a working directory of secrets.                                                                                                                      | Horizontal leak or least-privilege failure.                             |
| 8   | A user in workspace A cannot see or retrieve workspace B’s secrets.                                                                                                                               | Cross-workspace leak (Master Plan §6: **0 tolerated**).                 |
| 9   | No Connection Management, exchange I/O, Telegram send, SMTP send, AI-using-the-key, live UI, billing, or rotation product.                                                                        | Later package leaked.                                                   |
| 10  | Certified Version 2 paper-first journeys still work. S01 sign-in and S02 People still work. AI still uses `.env` or stays offline. Vault or wrapping-key unavailability does not take those down. | Regression; env OpenRouter broken; API down because wrapping key unset. |
| 11  | Host OpenRouter key is **not** auto-imported into Vault.                                                                                                                                          | Silent copy of a global env key into workspaces.                        |
| 12  | Customer secrets cannot be read back or exported. Host secrets are not Vault records.                                                                                                             | Classification broken.                                                  |
| 13  | Vault is not presented as Connections, Trading, AI, Notifications, or Exchanges.                                                                                                                  | Ownership drift.                                                        |

**Metrics (Master Plan §6) that this package must not regress:**

- Time to register **< 2 min**; time to secure login **< 30 s**
- Credential exposure in product/logs/UI: **0 tolerated**
- Cross-workspace secret leak: **0 tolerated**
- Security incidents from default misconfig: **0 tolerated** at package release
- Simulated “Connected” shown as **venue** real: **0 tolerated** (Vault Connected is not venue Connected)

Time to connect Binance **< 3 min** is a **Wave 4** metric. This package must not pretend to meet it.

---

## Honest product rules for this package

- Do not show venue **Connected** for a simulated adapter ping.
- Do not show live trading as available.
- Do not show Telegram as delivering.
- Do not show email as sent.
- Do not show AI as using the customer key.
- Do not present Vault as Connection Management.
- Do not present host `.env` as the customer secret path.
- Do not offer plaintext export.
- Do not debug-prefill credentials (PC-18 remains).
- Do not claim the audit product shipped because vault events exist.
- Do not auto-copy `.env` into Vault.
- Do not stop reading `OPENROUTER_API_KEY` from host env in this package.
- Do not take down paper, authentication, or research because Vault, wrapping key, or a vendor is unavailable.
- Do not treat Vault Connected as provider-working.
- Do not let Vault own Connections, Trading, AI, Notifications, or Exchanges.

---

**STOP.** Planning is **COMPLETE**. Product Owner **Approved**. This is still scope, not implementation. Implementation may begin from the Implementation Package at **S03-a**.
