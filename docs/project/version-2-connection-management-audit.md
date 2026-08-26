# Version 2 Connection Management Audit

**Document:** Version 2 Connection Management Audit
**Date:** 2026-08-16
**Nature:** Implementation audit of how Version 2 manages connections to external services.
**Scope:** Audit only. No code change. No architecture change. No Version 3 implementation.
**Source of truth:** Production TypeScript under `apps/`, Prisma schema, and `.env.example`. Architecture documents were not used as evidence.
**STOP.** This document describes the current implementation. Missing capability is stated as missing.

---

## Verdict

Version 2 does **not** have a unified Connection Management product.

External integrations are split across unrelated owners:

- **Environment variables** loaded by Nest `ConfigModule` (OpenRouter API key, market-data provider switch, optional live WebSocket flag, PostgreSQL URL, optional Redis).
- **Simulated exchange connect** with durable connection _state_ in PostgreSQL and no API keys.
- **In-memory Telegram bind** with a product wizard that never calls Telegram Bot API.
- **Reserved notification catalog** (Email, Slack, Discord, Microsoft Teams, Push) with no transport, no credential storage, and no save forms.
- **Public Binance market data** with no credentials (optional REST provider, optional WebSocket, and dataset kline import).

There is no Secret Manager, no credential vault, no encryption of integration secrets at rest, and no operator screen that collects exchange API keys, SMTP settings, webhooks, bot tokens, or AI keys.

Paying SaaS customers cannot self-serve real external connections without server access.

---

## Method

Inspected:

- `.env.example`
- `apps/api/src/app.module.ts` (`ConfigModule.forRoot`)
- `apps/api/prisma/schema.prisma`
- Exchange Adapter (`apps/api/src/modules/exchange-adapter/`)
- Live Market Data Binance connectors (`apps/api/src/modules/live-market-data/connectors/binance/`)
- Market Data Domain providers (`apps/api/src/modules/market-data-domain/`)
- Notification Delivery and Telegram Product
- Notification Product reserved-channel views
- AI Gateway (`apps/api/src/modules/ai/`)
- AI Analytics (`apps/api/src/modules/ai-analytics/`)
- Live Trading Engine connection supervisor
- Dataset import `BinanceClient` (`apps/api/src/modules/market/binance.client.ts`)
- Exchange Scope venue catalog (`EXCHANGE_SCOPE_VENUE_CODES`)
- Historical `MarketDataSource` enum vs `MarketDataProviderModule`
- Product UI routes in `apps/web/src/app/App.tsx` and navigation in `apps/web/src/shared/product-ui/catalog.ts`

Searched the tree for `OPENAI_API_KEY`, `ANTHROPIC`, `GEMINI`, `TELEGRAM_BOT`, `SMTP_`, webhook URLs, `apiKey` / `apiSecret` persistence, Secret Manager, and encryption of integration credentials. Those stores and providers are absent unless named below.

---

## Shared loading mechanism

Nest `ConfigModule.forRoot` is global. It loads `.env` then `../../.env`:

```100:103:apps/api/src/app.module.ts
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
```

`.env.example` is the documented env surface. Integration-related keys present there:

| Variable               | Purpose in current code                            |
| ---------------------- | -------------------------------------------------- |
| `DATABASE_URL`         | Prisma PostgreSQL                                  |
| `OPENROUTER_API_KEY`   | AI Gateway                                         |
| `OPENROUTER_MODEL`     | OpenRouter model id (default `openai/gpt-4o-mini`) |
| `OPENROUTER_BASE_URL`  | OpenRouter HTTP base                               |
| `MARKET_DATA_PROVIDER` | `mock` or `binance` (default `mock`)               |

Not in `.env.example` but read in production code:

| Variable                                                      | Purpose in current code                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `LIVE_MARKET_WS_ENABLED`                                      | Must be the string `true` to register and connect the public Binance WebSocket |
| `QUEUE_DRIVER`                                                | `memory` (default) or `bullmq`                                                 |
| `QUEUE_REDIS_URL` / `REDIS_URL` / `REDIS_HOST` / `REDIS_PORT` | Redis when BullMQ is selected                                                  |

There is no Secret Manager client. There is no vault module. Integration API keys are not Prisma models.

---

## 1. Binance

Binance is **four separate surfaces**. They do not share credentials, a connection wizard, or a single status model.

### 1A. Binance public market data (Market Data Domain REST)

**What it is.** `BinanceMarketDataProvider` calls public Binance Spot REST: `/api/v3/ticker/price`, `/api/v3/klines`, `/api/v3/ping`. Comment in code: public REST only — no API key, no WebSocket.

**1. Current storage.** None. No API key exists for this path. Base URL is a constructor default (`https://api.binance.com`), not an env var. Provider selection is `.env` (`MARKET_DATA_PROVIDER`).

**2. Runtime loading.** Nest `ConfigService` reads `MARKET_DATA_PROVIDER` at module factory time. Both mock and Binance providers are registered; one is set active. Unset/blank → `mock`. Unknown id fails bootstrap.

**3. User configuration.** **NO.** `/settings` is Research Control Center preferences only (auto-refresh, default strategy id, max listed executions). No provider picker.

**4. Manual configuration.** Edit `.env` (`MARKET_DATA_PROVIDER=binance`). Restart the API. No frontend rebuild required for the switch itself.

**5. Connection verification.** **Partial, API only.** `GET /v1/market/health` pings Binance when that provider is active and returns `ok` / `degraded` / `down`. The web app does not call this endpoint.

**6. Connection status.** **NO** in product UI. REST health exists. Status values are provider health, not Connected / Disconnected / Expired credentials / Permission problems. Credentials are not used, so expired/permission states do not exist on this path.

**7. Credential security.** **Never persisted.** No trading credentials are accepted. Public HTTP only.

**8. Multi-user readiness.** **Global.** Controller comment: market data is not workspace-scoped. One process-wide active provider.

**9. SaaS readiness.** **PARTIAL.** Public data needs no customer key, but customers cannot select Binance vs mock without server access. All tenants share the same provider.

### 1B. Binance public live stream (Live Market Data WebSocket)

**What it is.** `BinanceWebSocketConnector` talks to `wss://stream.binance.com:9443/ws`. Capabilities declare `requiresCredentials: false`. Constructor types reject `apiKey` / `apiSecret` / `secret`.

Production wiring: `LiveMarketFeedCoordinator.onModuleInit` registers and connects this connector **only if** `LIVE_MARKET_WS_ENABLED === 'true'`. Default is off. `BinanceRestAdapter` (public REST backfill / exchangeInfo) exists as a class and is tested, but is **not** registered in `LiveMarketDataModule`. Gap-recovery REST backfill is also not a Nest provider.

**1. Current storage.** None. No credentials. Optional env flag only. Stream URL is a code default unless injected in tests.

**2. Runtime loading.** Direct `process.env.LIVE_MARKET_WS_ENABLED` in the coordinator. Not Nest ConfigService. Global `WebSocket` constructor required.

**3. User configuration.** **NO.**

**4. Manual configuration.** Set `LIVE_MARKET_WS_ENABLED=true` in the API environment. Restart the API. Frontend rebuild not required.

**5. Connection verification.** **NO** as an operator test action. Connector has internal health/state. `GET /v1/market-data/streams/status` can list stream status per workspace. The product UI does not expose a “test Binance connection” control.

**6. Connection status.** **NO** as a product connection panel. Command Center Exchange Overview shows Exchange Scope identity plus adapter connection counts, not live WebSocket connected/disconnected/error/expired/permission.

**7. Credential security.** **Never persisted.** Public stream.

**8. Multi-user readiness.** Connector instance is process-global (one `binance_spot` registration). Subscriptions are workspace-scoped in the durable registry. There are no per-user Binance keys.

**9. SaaS readiness.** **PARTIAL.** Public stream needs no customer key, but enabling it requires server env and restart. Customers cannot turn it on from the UI.

### 1C. Binance trading adapter (Exchange Adapter Layer)

**What it is.** `BinanceExchangeAdapter` extends `VenueExchangeAdapter`. `connect()` sets an in-process `connected` flag. Comment in code: simulated connect — no live network until live trading orchestration; live REST/WS I/O is stubbed until credentials are configured. Order submission throws that live orchestration is required.

No Binance API key or secret is read from env, database, or request body. `POST /v1/exchanges/connect` accepts `{ exchangeId }` only.

Connection **state** (not credentials) is stored in Prisma `ExchangeConnection`: `workspaceId`, `exchangeId`, `status`, latency, heartbeats, hardcoded `apiPermissions` (`spot.read`, `spot.trade`), declared markets/capabilities. Unique on `(workspaceId, exchangeId)`.

Adapter instances are process-global singletons from `ExchangeFactory` (`MOCK`, `BINANCE`, `BYBIT`, `OKX`).

**1. Current storage.** Database for connection state. Credentials: **none** (not in `.env`, not in DB, not in memory as secrets).

**2. Runtime loading.** Injected `ExchangeManager` / factory. No credential lookup.

**3. User configuration.** **NO in the certified product shell.**

- `ExchangesPage` implements Connect / Disconnect and status badges, but `App.tsx` redirects `/trading/exchanges` to `/command-center`. Tests assert `ExchangesPage` is not mounted.
- Command Center panel **P2 Exchange Overview** is read-only (scope label, id, operational status text, session count). No API-key form. No Connect button.
- Live Trading page is not mounted (`/trading/live` redirects to paper).

**4. Manual configuration.** There is nothing to put in `.env` for Binance trading keys. Calling connect requires Trader/Admin and `X-Workspace-Id`. From the certified UI, the operator cannot complete a real Binance API handshake.

**5. Connection verification.** **NO** real venue test. `ping()` on the venue adapter returns a constant `5` ms after simulated connect. Manager `heartbeat()` exists in domain code and is **not** exposed on `ExchangeAdapterController`. UI Connect is simulated.

**6. Connection status.** Durable statuses exist: `DISCONNECTED`, `CONNECTING`, `CONNECTED`, `RECONNECTING`, `ERROR`. Command Center can display a matching exchange’s status or `connectedCount/totalCount`. There is no Expired credentials or Permission problems state from a real API. `apiPermissions` are declared constants, not exchange-reported permissions.

**7. Credential security.** **Never persisted** (no trading credentials exist). Connection rows are not secrets.

**8. Multi-user readiness.** Connection **records** are per workspace. Adapter **objects** are global. Different workspaces cannot hold different Binance API keys because keys are not stored.

**9. SaaS readiness.** **NOT READY.** No customer API keys, no live trading I/O, connect UI not in the product shell.

### 1D. Binance historical dataset import

**What it is.** `BinanceClient` (`apps/api/src/modules/market/binance.client.ts`) calls public `https://api.binance.com/api/v3/klines` with rate-limit retry. `DatasetsService` constructs `new BinanceClient()` and `POST /v1/datasets/import/binance` imports bars into Prisma `Dataset`. No API key. Default symbol `BTCUSDT`, interval `1h`.

The web client exposes `api` helper `POST /datasets/import/binance`. No product page calls it. Research/campaign screens list datasets; they do not import from Binance.

**1. Current storage.** None. No credentials. Imported OHLCV is dataset content, not a connection secret.

**2. Runtime loading.** Direct `new BinanceClient()` inside `DatasetsService`. Hardcoded public URL. Not ConfigService. Not env.

**3. User configuration.** **NO** product screen. API is callable by an authenticated client.

**4. Manual configuration.** None for keys. Operator can call the import REST endpoint. No `.env`. No restart for the client itself (URL is in code).

**5. Connection verification.** **NO** dedicated test. A failed import throws `Binance API error: <status>`. Success creates or returns a dataset.

**6. Connection status.** **NO.**

**7. Credential security.** **Never persisted.** Public REST.

**8. Multi-user readiness.** One process-wide client. Datasets are global Prisma rows, not per-workspace vendor credentials.

**9. SaaS readiness.** **PARTIAL.** Public import needs no customer key and no env switch, but there is no import UI, no workspace-scoped Binance connection, and no operator connection status.

---

## 2. Other exchanges

Registered venue ids: `MOCK`, `BINANCE`, `BYBIT`, `OKX`.

### Bybit and OKX

Same `VenueExchangeAdapter` stub as Binance trading. Simulated `connect()` / `disconnect()` / constant `ping()`. No env vars, no API keys, no live REST/WS. Prisma connection state per workspace when connect is invoked.

**1. Storage.** Database connection state only. No credentials.

**2. Runtime loading.** Factory by id. No secrets.

**3. User configuration.** **NO** in the product shell (same as Binance trading).

**4. Manual configuration.** None for credentials. Same unused `ExchangesPage` / REST connect.

**5. Connection verification.** **NO** real test.

**6. Connection status.** Same simulated status enum if a connection row exists. Not a product connection manager.

**7. Credential security.** **Never persisted.**

**8. Multi-user readiness.** Workspace-scoped state, global adapter, no per-tenant keys.

**9. SaaS readiness.** **NOT READY.**

### MOCK

In-process fake exchange (`MockExchangeAdapter`). Not an external service. Connect is a boolean. Orders fill in memory. No credentials.

**SaaS readiness:** not applicable as an external integration. It is the only fully operational “exchange” in this layer.

### Kraken, Polygon, Yahoo Finance, Alpaca (catalog / enum only)

These names appear in Version 2. They are **not** external connections.

| Name                                             | Where it appears                                                        | What it is                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kraken                                           | `EXCHANGE_SCOPE_VENUE_CODES` (`binance`, `bybit`, `kraken`, `okx`)      | Isolation catalog label. Product flags `liveAdapter: false`, `venueApiUsed: false`. No Kraken adapter, REST, or WS client.                       |
| Bybit / OKX (scope catalog)                      | Same venue catalog + Cluster UI                                         | Logical Exchange Scope identity. Distinct from the stub trading adapters above. Scope is not a live venue connection.                            |
| Polygon, Yahoo Finance, Alpaca, historical Bybit | `MarketDataSource` enum in `market-data-provider/market-data-source.ts` | Declared source ids. `MarketDataProviderModule` registers **only** `LocalRepositoryProvider`. Comment: no REST / live data / external API calls. |

**1. Storage.** None.
**2. Loading.** None.
**3. UI.** Cluster / Exchange Scope can show venue **labels**. That is not credential configuration.
**4. Manual.** None that create a vendor connection.
**5–6.** No test, no connection status.
**7.** Never persisted.
**8.** N/A.
**9. SaaS.** **NOT READY** (not implemented as connectors).

No Coinbase or other additional venue adapters exist.

---

## 3. Telegram

**What it is.** Product channel over Notification Delivery. Transport is `InMemoryTelegramAdapter.send()`, which appends to an in-process array. Tests and product views hard-assert no `api.telegram.org` and no Bot API library.

Connect flow:

1. `POST /v1/telegram/connect` creates status `pending` and a synthetic deep link `tg://connect/<token>`.
2. `POST /v1/telegram/complete` binds chat id `in-memory:<workspaceId>:<userId>` — never a client-supplied chat id, never Telegram.
3. Verify / test / disconnect operate on that in-memory record.

Store: `InMemoryNotificationStore` (Maps). Comment: process-local, not a DB product. Lost on API restart.

**1. Current storage.** **In-memory only.** Chat id is a synthetic string, not a Telegram chat id. Connection token is an opaque hash, not a bot token. No `TELEGRAM_BOT_TOKEN` in env or schema.

**2. Runtime loading.** Injected `NotificationDeliveryService` + in-memory store/adapter. No env credentials.

**3. User configuration.** **YES** (in-memory wizard, not Telegram).

**Screen:** `/notifications/channels/telegram` (`TelegramSettingsPage` / `TelegramSettingsView`). Also linked from Notification Channels. Legacy `/telegram` redirects here.

The screen shows:

- Title **Telegram settings**
- Copy: notification channel only; chat id is never entered; transport is in-memory; Bot API is not used
- **Connection status:** Status (Connected / Pending / Not connected), Verification (Verified / Awaiting bind / Not verified), Chat bound, Transport = In-memory, Connected at, Control plane = No
- **Connection wizard:**
  - Not connected → **Connect Telegram**
  - Pending → deep-link string, **Complete bind**, **Verify**, **Disconnect**
  - Connected → **Verify**, **Send test notification**, **Disconnect**
- Last test outcome (delivery id, adapter reached, Bot API = Not used)
- Diagnostics
- Recent Telegram deliveries

No bot token field. No chat id field.

**4. Manual configuration.** None for a real bot. Operator uses the UI. Restart wipes the connection. No `.env` Telegram key to edit.

**5. Connection verification.** **YES**, against the in-memory adapter only. **Verify** re-reads status. **Send test notification** delivers a test payload into the in-memory adapter if connected. It does not send a Telegram message.

**6. Connection status.** **YES** for `not-connected` / `pending` / `connected`. **NO** for Expired credentials or Permission problems (no bot token, no Telegram API errors).

**7. Credential security.** **Never persisted** as Telegram credentials. Synthetic chat id and token live in process memory as plaintext strings. Not encrypted. Not durable.

**8. Multi-user readiness.** **Per workspace + user** in the in-memory map key `workspaceId::userId`. Not durable across processes or restarts. Not a real Telegram account link.

**9. SaaS readiness.** **NOT READY** for real Telegram. **PARTIAL** only as an in-app simulated bind: customers can click Connect without server access, but nothing leaves the API process.

---

## 4. Email (SMTP)

Catalog channel `email`, status `reserved-inactive`. `ReservedInactiveChannelAdapter.send()` always returns `Channel email is reserved-inactive`. No nodemailer, no SMTP env vars, no Prisma SMTP model.

Product view lists required future fields as labels only: `Provider / SMTP`, `Sender`, `Recipient(s)`. `configurable: false`. `testAvailable: false`. `connectAvailable: false`. `liveTransportActivated: false`.

**1. Current storage.** None.

**2. Runtime loading.** Catalog constant + reserved adapter. No credentials loaded.

**3. User configuration.** **NO.** Screen `/notifications/channels/email` (`NotificationChannelDetailView`) is a reserved placeholder: “SMTP, webhooks, and live transports are not collected and not activated. Send test is not offered.” Fields are listed with “Not offered”. No form inputs.

**4. Manual configuration.** There is no SMTP `.env` to edit. Reserved channel cannot be activated by config file in this implementation.

**5. Connection verification.** **NO.**

**6. Connection status.** UI shows connection state **Reserved — not offered** and configuration health **Reserved — not offered**. Not Connected / Disconnected / Error / Expired / Permission.

**7. Credential security.** **Never persisted.**

**8. Multi-user readiness.** Not applicable. No credentials. Preferences may mark email in routing, but delivery skips `channel-reserved`.

**9. SaaS readiness.** **NOT READY.**

---

## 5. Slack

Same reserved pattern as Email. Required-field labels: `Workspace`, `Webhook`, `Channel`. No Slack webhook env, no webhook table, no Slack SDK.

**1. Storage.** None.
**2. Loading.** Reserved adapter.
**3. UI.** **NO** configuration. Screen `/notifications/channels/slack` is the reserved detail page.
**4. Manual steps.** None that activate Slack.
**5. Test.** **NO.**
**6. Status.** Reserved only.
**7. Security.** Never persisted.
**8. Multi-user.** No credentials.
**9. SaaS.** **NOT READY.**

---

## 6. Discord

Same reserved pattern. Required-field labels: `Webhook`, `Channel`. No Discord webhook storage.

**1–9.** Identical shape to Slack. Screen: `/notifications/channels/discord`. **SaaS: NOT READY.**

---

## 7. Microsoft Teams (additional catalog channel)

Present in the notification catalog. Not listed in the task examples; included because it exists in Version 2.

Same reserved pattern. Required-field labels: `Webhook`, `Team`, `Channel`. Screen: `/notifications/channels/teams`. **SaaS: NOT READY.**

---

## 8. Push

Same reserved pattern. Required-field labels: `Device`, `Browser`. No device-token store, no FCM/APNs, no Web Push keys.

Screen: `/notifications/channels/push`. **SaaS: NOT READY.**

Notification Channels home (`/notifications/channels`) lists all six channels. Telegram can be enabled in routing. Reserved channels cannot be activated or tested from that screen.

---

## 9. OpenRouter

**What it is.** The only live AI HTTP provider. `OpenRouterProvider` `POST`s `{baseUrl}/chat/completions` with `Authorization: Bearer <apiKey>`. If `OPENROUTER_API_KEY` is missing or empty, `AiGatewayService` does not call the network; it returns an offline template summary (`provider: 'offline'`).

AI Analytics (`/ai-analytics`) does **not** call OpenRouter. It builds local analytical narratives from Reporting.

**1. Current storage.** `.env` / process environment. Key is not in the database. `AiRequestLog` stores task, provider name, model, success, duration, error — not the API key.

**2. Runtime loading.** Nest `ConfigService.get('OPENROUTER_API_KEY' | 'OPENROUTER_MODEL' | 'OPENROUTER_BASE_URL')`.

**3. User configuration.** **NO.** `/ai` (`AiPage`) is **AI Assistant**: Experiment ID + **Summarize experiment**. Copy says “OpenRouter Gateway (offline fallback if no API key)”. After a run it may show **Offline mode** or `openrouter · <model>`. There is no API key field, no model picker that writes env, no save.

**4. Manual configuration.** Edit `.env` (`OPENROUTER_API_KEY`, optionally `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL`). Restart the API so ConfigModule picks up the key. Frontend rebuild not required.

**5. Connection verification.** **NO** dedicated test/ping. Invoking `/v1/ai/execute` is the only live call. Failure throws `OpenRouter error: <status>`. Success vs offline is visible only after that request.

**6. Connection status.** **NO** persistent Connected / Disconnected / Error / Expired / Permission panel. Offline badge appears after execute when unconfigured. HTTP errors surface as request errors, not a credential-expiry model.

**7. Credential security.** **Environment only**, plaintext in `.env`. Not encrypted at rest by the application. Not in the database. Loaded into process memory via ConfigService.

**8. Multi-user readiness.** **Global.** One key for the process. No workspace-scoped OpenRouter keys.

**9. SaaS readiness.** **NOT READY** for customer-owned keys. **PARTIAL** only if the host injects a shared platform key (all tenants share it; customers cannot rotate or isolate).

---

## 10. OpenAI

**Missing as a direct integration.**

No `OPENAI_API_KEY`. No OpenAI SDK. No OpenAI provider class.

The string `openai/gpt-4o-mini` is the default **OpenRouter model id**, not an OpenAI API connection.

**1. Storage.** None.
**2. Loading.** None.
**3. UI.** **NO.**
**4. Manual.** None that create an OpenAI connection.
**5. Test.** **NO.**
**6. Status.** **NO.**
**7. Security.** N/A.
**8. Multi-user.** N/A.
**9. SaaS.** **NOT READY.**

---

## 11. Gemini

**Missing.** No Gemini/Google AI env vars, provider, or UI.

**SaaS: NOT READY.**

---

## 12. Anthropic

**Missing.** No Anthropic env vars, provider, or UI.

**SaaS: NOT READY.**

---

## 13. Additional external connectors

### PostgreSQL

**1. Storage.** Connection string in `.env` as `DATABASE_URL`. Prisma schema `env("DATABASE_URL")`.
**2. Loading.** Prisma / Nest Prisma module.
**3. UI.** **NO.**
**4. Manual.** Edit `.env`. Provide a reachable Postgres. Restart API. Run migrations outside the product UI.
**5. Test.** `GET /health` includes database and migration checks. Not an operator “test connection” wizard.
**6. Status.** Health endpoint only, not a product connection screen.
**7. Security.** URL (including password) plaintext in `.env`. Application does not encrypt it.
**8. Multi-user.** One database per process. Product workspaces are rows, not separate DB credentials.
**9. SaaS.** **NOT READY** as customer-managed DB credentials. Host-operated Postgres is infrastructure, not a self-serve integration.

### Redis (optional queue)

Used only when `QUEUE_DRIVER=bullmq`. Default queue driver is **memory**. Connection from `QUEUE_REDIS_URL` or `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`.

**1. Storage.** Env only.
**2. Loading.** `process.env` in the BullMQ queue helper.
**3. UI.** **NO.**
**4. Manual.** Edit env, run Redis, restart API.
**5–6.** No product test/status UI.
**7.** Env plaintext.
**8.** Global.
**9.** **NOT READY** as a customer integration.

### JWT signing secret

`JWT_SECRET` in `.env` is platform auth, not an external vendor. Production rejects the dev default. Not listed as a customer integration.

### Paper execution

`PaperExecutionAdapter` structurally rejects trading credentials. `credentialsConfigured: false`. Paper is not an external venue.

---

## Integration matrix

| Integration                                 | Storage                                       | UI                                       | Test                                    | Status                                                    | SaaS Ready                                           |
| ------------------------------------------- | --------------------------------------------- | ---------------------------------------- | --------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| Binance public REST (Market Data Domain)    | Env switch only; no API key                   | No                                       | API `GET /v1/market/health` only; no UI | No product status                                         | PARTIAL                                              |
| Binance public WebSocket (Live Market Data) | Env flag `LIVE_MARKET_WS_ENABLED`; no API key | No                                       | No operator test                        | Stream APIs exist; no product panel                       | PARTIAL                                              |
| Binance dataset import (`BinanceClient`)    | None; hardcoded public URL                    | No (API only; helper unused by pages)    | Import call only                        | No                                                        | PARTIAL                                              |
| Binance trading adapter                     | DB connection state; **no credentials**       | No (page exists, not routed)             | Simulated ping only                     | Simulated CONNECTED/ERROR in DB; Command Center read-only | NOT READY                                            |
| Bybit trading adapter                       | DB state; no credentials                      | No                                       | Simulated                               | Simulated                                                 | NOT READY                                            |
| OKX trading adapter                         | DB state; no credentials                      | No                                       | Simulated                               | Simulated                                                 | NOT READY                                            |
| MOCK exchange                               | In-process; no credentials                    | No                                       | Simulated                               | Simulated                                                 | N/A (not external)                                   |
| Kraken                                      | Catalog label only                            | Scope labels; not a connection           | No                                      | No                                                        | NOT READY                                            |
| Polygon / Yahoo / Alpaca                    | Enum only; no provider                        | No                                       | No                                      | No                                                        | NOT READY                                            |
| Telegram                                    | In-memory synthetic chat id/token             | Yes — `/notifications/channels/telegram` | Yes — in-memory only                    | Yes — not-connected / pending / connected                 | NOT READY (real Telegram); PARTIAL (simulated bind)  |
| Email (SMTP)                                | None                                          | Reserved labels only                     | No                                      | Reserved                                                  | NOT READY                                            |
| Slack                                       | None                                          | Reserved labels only                     | No                                      | Reserved                                                  | NOT READY                                            |
| Discord                                     | None                                          | Reserved labels only                     | No                                      | Reserved                                                  | NOT READY                                            |
| Microsoft Teams                             | None                                          | Reserved labels only                     | No                                      | Reserved                                                  | NOT READY                                            |
| Push                                        | None                                          | Reserved labels only                     | No                                      | Reserved                                                  | NOT READY                                            |
| OpenRouter                                  | `.env` plaintext                              | Execute-only `/ai`; no key form          | No dedicated test                       | Offline badge after execute only                          | NOT READY (customer keys); PARTIAL (shared host key) |
| OpenAI                                      | Missing                                       | No                                       | No                                      | No                                                        | NOT READY                                            |
| Gemini                                      | Missing                                       | No                                       | No                                      | No                                                        | NOT READY                                            |
| Anthropic                                   | Missing                                       | No                                       | No                                      | No                                                        | NOT READY                                            |
| PostgreSQL                                  | `.env` `DATABASE_URL`                         | No                                       | `/health`                               | Health only                                               | NOT READY (customer-managed)                         |
| Redis                                       | Env when BullMQ                               | No                                       | No                                      | No                                                        | NOT READY                                            |

---

## Gap analysis

Identified from the current implementation. No proposed design.

### Requires editing `.env`

- OpenRouter API key, model, and base URL
- `MARKET_DATA_PROVIDER` to use Binance public REST
- `LIVE_MARKET_WS_ENABLED` to start public Binance WebSocket
- `DATABASE_URL`
- Redis URL/host when using BullMQ
- `JWT_SECRET` for non-dev auth

`LIVE_MARKET_WS_ENABLED` is not documented in `.env.example`.

### Requires server restart

- OpenRouter key/model/base URL (ConfigModule at process start)
- `MARKET_DATA_PROVIDER` (resolved in `MarketDataDomainModule` factory)
- `LIVE_MARKET_WS_ENABLED` (coordinator `onModuleInit`)
- Database and Redis connection strings

### Requires rebuild frontend

Not required for the env switches above. The exchange Connect page is omitted from routing, not missing a rebuild.

### No UI (or UI not in the product shell)

- Exchange API keys
- Exchange Connect/Disconnect in certified navigation (`ExchangesPage` unmounted)
- Binance dataset import (API exists; no page)
- Market data provider selection
- Live WebSocket enablement
- OpenRouter / any AI key (`GET /v1/ai/logs` has no web client)
- SMTP, Slack, Discord, Teams, Push configuration
- PostgreSQL / Redis

### No connection test (real external)

- Binance / Bybit / OKX trading
- Binance public WS from the UI
- Email / Slack / Discord / Teams / Push
- OpenRouter (no dedicated test)
- OpenAI / Gemini / Anthropic (absent)

Telegram “test” does not leave the process.

### No disconnect (real external)

- Telegram disconnect only clears in-memory state
- Exchange disconnect is simulated and not in the product shell
- OpenRouter has no disconnect; unset env and restart
- Reserved channels have no connection to disconnect

### No status (product-grade)

- No unified connection dashboard
- No Expired credentials
- No Permission problems from a real venue or bot
- Command Center P2 is Exchange Scope overview, not credential health
- `/v1/market/health` is unused by the web app

### Global credentials only

- OpenRouter
- Market data provider
- Live WS flag
- Database / Redis
- Exchange adapter **instances** (even though connection rows are per workspace)

### No encryption of integration secrets

- OpenRouter key: plaintext env
- `DATABASE_URL`: plaintext env
- Telegram in-memory fields: plaintext process memory
- No application-level secret encryption for integrations
- Password hashes (bcrypt on `User.passwordHash`) are login credentials, not vendor integrations

### No workspace separation of vendor credentials

- OpenRouter: one key
- Binance public data: one provider
- Exchange trading keys: do not exist
- Telegram: per user/workspace in RAM only, not durable and not Telegram

### No credential rotation

- No rotate/replace/invalidate flow for any vendor key
- Changing OpenRouter requires env edit + restart
- Telegram reconnect is a new in-memory bind, not token rotation with Telegram

### Other product gaps

- No Secret Manager
- No credential vault
- No connection wizard for exchanges or AI
- Simulated exchange `CONNECTED` can be stored without talking to Binance
- `BinanceRestAdapter` and gap-recovery backfill are not Nest-wired
- Live Trading REST (`/v1/live/...`) exists; live trading UI is not mounted
- Notification reserved fields are documentation labels, not forms
- AI Analytics is local text generation, not a second AI vendor
- No OpenAI, Gemini, or Anthropic connectors

---

## Version 3 recommendations

High-level product requirements only. Not architecture. Not assignment. Not backlog items.

### Connection Management

A single operator place to see every external integration, its scope (platform vs workspace vs user), and whether it is offered, configured, connected, or reserved.

### Credential Vault

A product capability to store customer-supplied secrets (exchange keys, bot tokens, SMTP, webhooks, AI keys) instead of leaving them in process env or omitting them.

### Workspace-scoped credentials

Different workspaces (and, where required, users) must be able to hold different vendor credentials. Global platform keys must be an explicit exception, not the default.

### Connection Wizard

Guided connect for each offered integration: collect only the fields that integration needs, without server SSH, `.env` edits, or rebuilds.

### Connection Testing

An operator action that performs a real round-trip to the vendor and returns success or a vendor-visible failure.

### Credential Rotation

Replace a secret without destroying unrelated connection metadata; invalidate the previous secret.

### Health Monitoring

Ongoing Connected / Disconnected / Error, plus expired credentials and permission failures when the vendor reports them.

### Secret Encryption

Secrets at rest must not be application plaintext in `.env` or unencrypted database columns for customer integrations.

### Disconnect

An operator action that drops the live session with the vendor and stops using the secret.

### Reserved-channel activation

Email, Slack, Discord, Teams, and Push remain catalog-only today. If Version 3 offers them, they need the same connect / test / status / disconnect product as Telegram, against a real transport.

### Real Telegram transport

If Telegram remains a product channel, connect must bind a real chat through Telegram, not an in-memory adapter.

### Real exchange credentials

If live venues are offered, connect must accept and use venue API credentials. Simulated `CONNECTED` without keys is not a customer connection.

### Customer-owned AI keys

If AI is a paid capability, customers need to connect OpenRouter and/or direct providers (OpenAI, Gemini, Anthropic) without sharing one process env key.

---

## Explicit absences

Stated so they are not inferred from architecture intent:

- No Telegram Bot API
- No SMTP implementation
- No Slack / Discord / Teams webhooks
- No push provider
- No OpenAI / Gemini / Anthropic APIs
- No exchange API key fields anywhere
- No Secret Manager
- No integration-secret encryption
- `ExchangesPage` is not a shipped product screen
- Live trading UI is not shipped
- `BinanceRestAdapter` is not registered in the live-market Nest module
- Dataset Binance import has REST but no product UI
- Kraken is an Exchange Scope venue label only (`liveAdapter: false`)
- Polygon, Yahoo Finance, and Alpaca are historical source enum values with no registered providers
- `ReservedInactiveChannelAdapter` is not registered as a Nest provider (reserved channels skip in delivery)

---

**STOP.** Audit complete. No implementation. No architecture change. No Version 3 implementation.
