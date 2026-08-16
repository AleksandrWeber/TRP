# Version 3 Connection Management Vision

**Document:** Version 3 Connection Management Vision  
**Date:** 2026-08-16  
**Status:** Annex — planning **FROZEN** in [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Role:** Unified Connection Management product  
**Evidence baseline:** [Version 2 Connection Management Audit](../version-2-connection-management-audit.md)

This is a **product facade** over existing owners (Exchange Adapter, Live Market Data, Notification Delivery, AI Gateway). It does not become Source of Truth for orders, fills, narratives, or market state.

Related: [Security Vision](./v3-security-vision.md) (vault) · [Execution Roadmap](./v3-execution-roadmap.md) Waves 2, 4, 5, 7

---

## 1. Why this product exists

Version 2 does **not** have unified Connection Management. Paying customers cannot self-serve real external connections without server access.

| Pattern today                  | Problem                                                        |
| ------------------------------ | -------------------------------------------------------------- |
| Nest `ConfigModule` / `.env`   | OpenRouter, market-data switch, live WS flag, Postgres, Redis  |
| Simulated exchange `connect()` | Durable **state**, no API keys, constant ping                  |
| In-memory Telegram wizard      | Excellent UX for a fake transport                              |
| Reserved notification catalog  | Fields listed, `configurable: false`                           |
| Public Binance                 | Four surfaces; no trading keys; no customer provider picker    |
| Missing providers              | OpenAI, Gemini, Anthropic, Kraken client, SMTP, webhooks, push |

Version 3 replaces “edit env and restart” with **vault + wizard + test + health + rotate + disconnect**, scoped to a workspace.

---

## 2. Product definition

**Connection Management** is the operator product where a user:

1. Sees every offered integration and its scope (platform vs workspace vs user).
2. Connects with a wizard that collects only required fields.
3. Stores secrets in the Credential Vault (never in `.env` for customer integrations).
4. Tests with a real vendor round-trip (or an honest “not offered” state).
5. Monitors health including expired credentials and permission failures.
6. Rotates secrets without destroying metadata.
7. Disconnects and stops using the secret.

Platform infrastructure (PostgreSQL, Redis, `JWT_SECRET`) stays **host-operated**. It may appear on an **Administration** health view, not as a customer wizard.

---

## 3. Architecture stance (reuse)

```text
Connection Management (UI + product REST)
    │  does not own protocol I/O
    ▼
Credential Vault (new, justified)     metadata + ciphertext
    │
    ├── Exchange Adapter factory      BINANCE / BYBIT / OKX / MOCK / Kraken
    ├── Live Market Data              public REST/WS (no trading key)
    ├── Notification Delivery         Telegram / Email / Slack / Discord / Teams / Push
    └── AI Gateway                    OpenRouter / OpenAI / Gemini / Anthropic
```

| Owner                 | Still owns                                        |
| --------------------- | ------------------------------------------------- |
| Exchange Adapter      | Venue protocol, order submit after Wave 6         |
| Exchange Scope        | Isolation identity (Cluster), not credentials     |
| Notification Delivery | Routing result, adapter send                      |
| AI Gateway            | Model call, offline fallback                      |
| Market Data Domain    | Public candles/prices                             |
| Connection Management | Catalog, wizard, status projection, test commands |
| Vault                 | Secret persistence and encryption                 |

Do not merge these modules. Do not store secrets on `ExchangeConnection` as plaintext columns.

---

## 4. Status model (product)

Replace simulated CONNECTED-without-keys.

| Status           | Meaning                                                             |
| ---------------- | ------------------------------------------------------------------- |
| `not-offered`    | Reserved or not in this build                                       |
| `not-configured` | Offered; no vault material                                          |
| `configured`     | Secret present; not tested / not live session                       |
| `connected`      | Last test or health check succeeded                                 |
| `error`          | Vendor or network failure                                           |
| `expired`        | Vendor reported expired credentials                                 |
| `permission`     | Vendor reported missing scope (e.g. no trade)                       |
| `disconnected`   | Operator disconnected; secret may be retained or deleted per wizard |

Command Center P2 (Exchange Scope overview) remains Cluster identity. Connection health is this product (and may be _projected_ into Command Center).

---

## 5. Planned integrations

### Exchanges

| Provider          | Version 2                                   | Version 3 plan                                                                                    | Wave                     |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------ |
| **Binance**       | Public REST/WS/import partial; trading stub | Unify under one Binance connection card: public data (no key) vs trading (key+secret+permissions) | 2 collect, 4 I/O         |
| **Bybit**         | Stub trading                                | Real I/O via factory                                                                              | 4                        |
| **OKX**           | Stub trading                                | Real I/O via factory                                                                              | 4                        |
| **Kraken**        | Scope label only                            | New factory adapter                                                                               | 4                        |
| **MOCK**          | In-process fake                             | Keep for paper/dev; not a customer secret                                                         | —                        |
| Coinbase / others | Absent                                      | Future provider framework only                                                                    | After V3 unless approved |

Polygon / Yahoo / Alpaca remain historical enum values. **Not** Version 3 Core.

Trading connect must accept venue credentials. Simulated CONNECTED without keys is not a customer connection.

Live **order** submit stays Wave 6 even if Wave 4 can ping `account` / `apiRestrictions`.

### Notifications

| Provider     | Version 2        | Version 3 plan                                          | Wave |
| ------------ | ---------------- | ------------------------------------------------------- | ---- |
| **Telegram** | In-memory wizard | Production Bot API; reuse wizard; never a control plane | 5    |
| **Email**    | Reserved         | SMTP (or provider API) in vault                         | 5    |
| **Slack**    | Reserved         | Webhook; SSRF allowlist                                 | 5    |
| **Discord**  | Reserved         | Webhook; SSRF allowlist                                 | 5    |
| **Teams**    | Reserved         | Webhook; SSRF allowlist                                 | 5    |
| **Push**     | Reserved         | Web Push/FCM; device registry                           | 5    |

Each shipped channel gets the same connect / test / status / disconnect product Telegram pioneered.

### AI

| Provider       | Version 2               | Version 3 plan                                                      | Wave  |
| -------------- | ----------------------- | ------------------------------------------------------------------- | ----- |
| **OpenRouter** | `.env` global           | Workspace vault key; test chat completion; offline fallback remains | 2 / 7 |
| **OpenAI**     | Missing (model id only) | Gateway provider plugin                                             | 7     |
| **Gemini**     | Missing                 | Gateway provider plugin                                             | 7     |
| **Anthropic**  | Missing                 | Gateway provider plugin                                             | 7     |

AI Analytics stays local unless it optionally calls the gateway. AI never controls capital.

### Future providers

Connection Management publishes a catalog contract:

- id, display name, category (`exchange` \| `notification` \| `ai` \| `market-data`)
- required fields
- scope
- test probe
- reserved vs offered

A new vendor is an adapter + catalog row, not a new Command Center.

---

## 6. Capability plan

### Credential Vault

See [Security Vision](./v3-security-vision.md). Connection Management is the **only customer writer** of integration secrets (Admin/Trader per RBAC). Runtime adapters are readers.

### Connection Wizard

Guided, copy-honest, field-minimal. Reuse Telegram settings layout language (status, diagnostics, last test) for every offered integration.

Wave 2 may collect exchange keys before Wave 4 I/O: UI must say **Configured — venue handshake in Exchange Connectivity**, not **Live trading connected**.

### Connection Testing

Operator action. Real HTTP/WS to vendor. Map 401/403 to `expired` / `permission`. Telegram test must hit `api.telegram.org` after Wave 5.

### Health Monitoring

Background checks (scheduler TD-004 if needed) without spamming vendors. Surface in Connections and optionally Command Center.

### Credential Rotation

Replace ciphertext; reconnect; keep connection id and audit “rotated by”.

### Workspace-scoped credentials

Default. Platform-scoped keys (if any) are explicit Admin exceptions (e.g. host-operated market-data proxy) — never the silent default.

### No `.env` for customers

Customer path: UI → vault → runtime. Host still uses `.env` for `DATABASE_URL`. `OPENROUTER_API_KEY` in env becomes **dev fallback only**, disabled when a workspace vault key exists, forbidden as the production customer story.

### Disconnect

Drops live vendor session, stops use, optional secret delete.

---

## 7. Honest UI rules

From Product UI Policy, applied here:

- Do not show Connect on reserved channels until Wave 5 ships that channel.
- Do not show Connected if the last action was simulated ping.
- Do not show Live Trading from a connection card until Wave 6.
- Keep Telegram labeled delivery-only.
- `ExchangesPage` may return as a **child** of Connection Management or be replaced by it; it must not remain an unwired parallel.

---

## 8. Exit criteria

**Wave 2:** catalog + vault + OpenRouter customer key + exchange key collection + test/health/rotate/disconnect product; no customer `.env` for those secrets.

**Wave 4:** Binance/Bybit/OKX real handshake; Kraken adapter; permission-aware status.

**Wave 5:** real Telegram and shipped reserved channels.

**Wave 7:** optional AI providers on the same Connections surface.

---

**STOP.** Connection Management planning only. No implementation.
