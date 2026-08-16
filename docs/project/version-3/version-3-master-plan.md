# Version 3 Master Plan

**Document:** Version 3 Master Plan  
**Role:** **Canonical Product Owner document for the entire Version 3 lifecycle**  
**Date frozen:** 2026-08-16  
**Status:** **PLANNING FROZEN** — awaiting acceptance before implementation  
**Nature:** Planning. Not an RC. Not an ADR. Not implementation.

From this point forward, all Version 3 implementation, reviews, audits, and planning decisions **must reference this file**. Annexes may add detail; they must not silently contradict this plan. Change requires an **approved planning revision** of this document.

**Next package (after acceptance only):** **V3-S01 Authentication & Session**

**Do not start V3-S01 until this Master Plan is accepted.**

---

## Version 3 Product Principles

These principles are binding. A Version 3 feature that violates them is out of plan until this Master Plan is revised.

| Principle                        | Meaning                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customer First**               | Any customer feature must be usable by an ordinary operator without SSH, Docker, or editing `.env`. Host infrastructure (database URL, JWT signing) may remain server-operated. |
| **Security Before Convenience**  | Convenience never outranks protection of financial assets. Fail closed.                                                                                                         |
| **One Source of Truth**          | Do not create duplicate domains or parallel mechanisms for money, lifecycle, risk, or certification.                                                                            |
| **Paper First**                  | New trading capability is proven on paper before it is offered live.                                                                                                            |
| **Live Must Be Earned**          | Live Trading opens only after the required checks: Waves 1–4, live-capital ADR, certified strategy, Gate PASS, human start.                                                     |
| **Honest Product**               | If the system cannot do something, it says so. Never show **Connected** for a simulation.                                                                                       |
| **AI Never Controls Capital**    | AI analyses and explains. It does not decide, approve, size, or start trades.                                                                                                   |
| **Everything Is Auditable**      | Every action that can affect a financial result must be attributable and traceable.                                                                                             |
| **No Hidden Configuration**      | Integrations the customer needs are eventually configured in the product UI.                                                                                                    |
| **Architecture Is a Constraint** | A new feature must not break or duplicate existing architecture without an official decision (Master Plan revision and, where required, ADR).                                   |

---

## Current status

| Field                           | Value                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Version 2                       | **CERTIFIED** (`v2.0.1`); architecture tag `v2.0.0` preserved                                            |
| Version 3 planning              | **Frozen** (this document)                                                                               |
| Version 3 implementation        | **Not started**                                                                                          |
| Paper-first product readiness   | **99%** (Audit v2)                                                                                       |
| Production readiness            | **40%** (Audit v2)                                                                                       |
| Architecture readiness          | **100%** (Spec v2.0 frozen)                                                                              |
| Mean Version 3 capability reuse | **32%** (in-scope inventory)                                                                             |
| Blocked on                      | **Acceptance of this Master Plan.** Also: live capital remains unauthorized until a future ADR (Wave 6). |

---

## 1. Project vision

TRP is an engineering-first **Research Operating System**. Knowledge is the primary product. Trading is one controlled application of that knowledge.

**Version 3** is the **production** Research Operating System: the certified Version 2 paper-first product, extended so a professional can protect financial assets, connect real services without `.env`, and — when earned — apply certified knowledge to live capital.

Version 3 is **not** Version 2.1, not a rewrite, not an AI trader, not a consumer brokerage.

```text
Sign in securely
  → isolated workspace
  → connect exchange / notifications / AI in the product
  → research → certify → Gate → deploy → orchestrate
  → paper session (default) or live session (opt-in, audited, kill-switch armed)
  → reports, knowledge, real alerts
  → Command Center
```

Detail: [`v3-vision.md`](./v3-vision.md). Level-0 mission remains [`trp-product-vision.md`](../trp-product-vision.md).

### Who

| Customer                | Need                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| Quantitative researcher | Certified lab + durable knowledge + own AI keys                         |
| Trading operator        | Honest connections, paper (and later live) sessions, kill switch, audit |
| Workspace administrator | Vaulted connections, roles, least privilege                             |
| Small research team     | Shared workspace, no shared `.env`                                      |

Not for: beginners, social trading, get-rich-quick audiences.

### Business goals

1. Make financial-asset protection a **product** (Security Platform).
2. Let customers connect venues, channels, and AI **without servers or `.env`**.
3. Turn stubbed venues and reserved channels into **real, honest** integrations.
4. Allow **earned** live trading on the existing Canonical Order Path — never a second engine.
5. Raise production readiness off **40%** with durability, monitoring, and restart-safety.
6. Enable small-team SaaS (roles, admin, billing, APIs) **after** isolation works.

---

## 2. What we are building and why

| Product area                  | Why it exists                                                 | Vision fit                                            |
| ----------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| **Security & Trust Platform** | The app will hold secrets and, later, move money              | Human authority, risk over profit, least privilege    |
| **Connection Management**     | Customers cannot operate TRP via `.env`                       | Markets as plugins; self-serve professional tool      |
| **Exchange Connectivity**     | Paper proof must reach real venues without cloning engines    | Binance first, not the ceiling; RC-27 isolation       |
| **Live Trading**              | Certified knowledge applied to capital when earned            | Research before execution; Gate; human start; ADR     |
| **Notification Platform**     | Evidence must leave the process                               | Information on demand; Telegram never a control plane |
| **AI Platform**               | Assist and explain with customer-owned keys                   | Mathematics before AI; AI never controls capital      |
| **Knowledge Platform**        | Knowledge compounds across restarts                           | Knowledge is the primary product                      |
| **Analytics / Reporting**     | Evidence, not opinion                                         | Validated knowledge                                   |
| **Portfolio**                 | See exposure from Ledger projections                          | UI is not financial SoT                               |
| **Risk**                      | Limits visible as the engine’s decisions                      | Risk overrides profit                                 |
| **Strategy Evolution**        | Select among **certified** tactics only                       | Runtime never invents strategy                        |
| **Workspace SaaS**            | Small teams, not consumer multi-tenant social                 | Extends solo researcher; does not replace them        |
| **Administration**            | People, policy, kill switch, live enablement                  | Least privilege                                       |
| **Billing**                   | Hosted product can be charged without touching the order path | Isolated from trading SoT                             |
| **Developer Platform**        | Programmatic access with vaulted keys                         | Same security as UI                                   |
| **Monitoring**                | Operators see health without SSH                              | Production software                                   |
| **Business Continuity**       | Restart, vendor outage, graceful degradation                  | Capital preservation; honest UI                       |
| **Disaster Recovery**         | Recover sessions and state after failure                      | US295 residual; no silent “restart-safe”              |
| **Financial Integrity**       | Append-only money path + who-did-what audit                   | Tamper-evident financial operations                   |
| **Compliance**                | Retention, export, evidence packs                             | Professional / later hosted use                       |
| **Performance**               | Lab and ledger usable at size                                 | Research OS remains usable                            |

Every major Version 3 capability supports this vision. None of the **Out** items (ABAC engine, auto-rotation, plugin marketplace, AI Scientist, HFT, SHIELD-as-product) are required for the vision.

---

## 3. Current position (one page)

### Where we are today

Version 2 is a **certified paper-first customer product**. A professional can complete certify → gate → deploy → orchestrate → paper session → report → in-memory Telegram → Command Center. The paper runtime loop is operational. Architecture is frozen and 100%.

Production SaaS is **not** ready. Production readiness is **40%**.

### What has already been achieved

- Version 1 research OS (`v1.0.0`)
- Version 2 architecture (RC-19…RC-28, `v2.0.0`)
- Version 2 Product Completion PC-01…PC-20
- Runtime Engine Completion + Runtime Final Certification Audit **PASS**
- Durable identity and workspaces
- Roles in code (not yet a security product)
- Stub exchange adapters and Exchange Scope isolation
- Notification catalog; Telegram wizard (in-memory)
- OpenRouter gateway (process `.env` key)
- Append-only Ledger; Risk Engine; Canonical Order Path (paper)

### What remains (Version 3)

- Security Platform (vault, sessions, RBAC product, OWASP defaults, audit)
- Unified Connection Management; no customer `.env`
- Real venue I/O; real notification transports; customer AI keys
- Durability, kill switch, monitoring, business continuity
- Optional live trading after ADR
- Portfolio/risk/analytics products; teams; billing; compliance closeout

### Next implementation step

**V3-S01 Authentication & Session** — only after this Master Plan is accepted.

### What is blocked

| Blocker                  | Blocks                                              | Until                                         |
| ------------------------ | --------------------------------------------------- | --------------------------------------------- |
| Master Plan not accepted | **All** Version 3 implementation                    | This review is accepted                       |
| No Credential Vault      | Connection wizards, customer keys, live credentials | Wave 1 (V3-S03)                               |
| No real venue I/O        | Honest “Connected” to Binance/Bybit/OKX             | Wave 4                                        |
| Paper Freeze ADR-012…018 | Live capital                                        | Wave 6 live-capital ADR                       |
| US295 / ADL-008          | **Claims** of production restart-safety             | Wave 3 stance (accept or explicit limitation) |
| Product UI Policy        | Unhiding Live Bots                                  | Wave 6 real I/O                               |

Nothing in Version 2 certification is reopened. Nothing in this plan authorizes live money.

---

## 4. Execution waves

Packages: [`v3-execution-roadmap.md`](./v3-execution-roadmap.md).  
**Live gate:** Waves **1 + 2 + 3 + 4** complete **and** live-capital ADR before Wave 6.

| Wave   | Name                               | Business value                                             | Packages                   |
| ------ | ---------------------------------- | ---------------------------------------------------------- | -------------------------- |
| **1**  | Security Foundation                | Safe identity and a vault so secrets are not tribal `.env` | V3-S01 … S06               |
| **2**  | Connection Management              | Customers connect from the UI                              | V3-C01 … C04               |
| **3**  | Durability, operations, continuity | Restart, kill switch, visibility                           | V3-O01 … O05               |
| **4**  | Exchange Connectivity              | Real venue handshake; paper still default                  | V3-E01 … E05               |
| **5**  | Notification Platform              | Real alerts                                                | V3-N01 … N04               |
| **6**  | Live Trading                       | Earned live capital on the canonical path                  | V3-L01 … L05               |
| **7**  | AI & Knowledge                     | Customer keys, durable knowledge, exporters                | V3-A01 … A04               |
| **8**  | Portfolio, Risk, Analytics         | Productize existing engines                                | V3-P01 … P04               |
| **9**  | Workspace SaaS                     | Teams, admin, billing, APIs                                | V3-W01 … W04 (W05 stretch) |
| **10** | Closeout                           | Compliance, E2E, performance, runbooks                     | V3-X01 … X04               |

### Product acceptance criteria (customer-observable)

Avoid implementation detail. A wave exits when a customer can see these outcomes.

**Wave 1 — Security**

- I can register an account that survives restart.
- I can log in securely (no shared default password on the product path).
- I can recover an account through a supported recovery path.
- I can see and sign out sessions (including sign out everywhere).
- An admin can give me a role; I cannot perform another role’s actions.
- The product can store a secret that I cannot read back as plaintext.
- I cannot see another workspace’s data.

**Wave 2 — Connection Management**

- I open one Connections place and see what is offered, reserved, or configured.
- I save an OpenRouter key in the UI and use AI without editing `.env` or restarting for me.
- I save Binance (or other exchange) credentials in the UI without `.env`. The product does **not** tell me I am live-trading Connected yet.
- I can test an offered connection and see success or a vendor-visible failure.
- I can rotate a saved secret and disconnect.
- I never SSH to paste keys.

**Wave 3 — Durability and continuity**

- After an API restart, my paper work and alerts I was owed are not silently gone (or the product honestly says what does not survive — default: it survives).
- I can arm a Kill Switch and see that sessions stop.
- I can see health and recent incidents without a server login.
- If a dependency is down, the product shows degraded/unavailable — it does not fake success.

**Wave 4 — Exchange connectivity**

- I connect, test, and disconnect **Binance** against the real venue.
- I can do the same for Bybit and OKX; Kraken is offered as a real adapter or honestly not offered.
- Connected means the venue answered. Expired or missing permissions are visible.
- Paper trading remains the default. The product still does not claim live capital.

**Wave 5 — Notifications**

- I connect Telegram and receive a real test message.
- I can connect Email (and shipped Slack/Discord/Teams/Push) the same way, or see them still reserved.
- Telegram cannot start, stop, or approve trades.

**Wave 6 — Live trading**

- Live is off until an authorized person enables it for the workspace.
- I cannot go live with an uncertified strategy or a failed Gate.
- I can start a live session as a human; AI cannot.
- I can see that a live order was mine, in an audit I cannot edit.
- Kill Switch stops live orders.
- If live is shown in the UI, it actually reaches the venue.

**Wave 7 — AI and knowledge**

- My workspace uses my AI key. I can add optional providers or stay on OpenRouter.
- If AI is unavailable, research and paper trading still work; narratives say they are offline.
- Knowledge I care about survives restart.
- I can export a report.

**Wave 8 — Portfolio, risk, analytics**

- I can see portfolio from the platform’s books, not a second invented ledger.
- I can see why risk denied an order.
- I can see risk-adjusted stats on reports.
- I can change tactics only inside certified envelopes.

**Wave 9 — SaaS**

- I can invite a teammate; they cannot see my keys.
- An admin can disable a user.
- Billing, if used, cannot bypass the Gate.
- I can create an API key in the product and rotate it.

**Wave 10 — Closeout**

- I can obtain a compliance/export pack appropriate to the product.
- Critical customer paths are covered by end-to-end tests.
- The product remains usable on large research datasets within documented limits.

---

## 5. Executive dashboard

Readiness % = Version 2 reuse of that product (inventory scale).  
Reuse % = how much of the **architecture/product owner** already exists (100 = certified V2 product, 0 = new).  
Status = Version 3 implementation status (all **Not started** except maintain).

| Product                      | Business value                     | Priority | Readiness % | Reuse % | Wave  | Status                   |
| ---------------------------- | ---------------------------------- | -------- | ----------- | ------- | ----- | ------------------------ |
| Security & Trust Platform    | Protect secrets and later capital  | Critical | 28          | 50      | 1     | Not started              |
| Connection Management        | Self-serve integrations, no `.env` | Critical | 25          | 25      | 2     | Not started              |
| Exchange Connectivity        | Real venues, no engine clone       | Critical | 25          | 50      | 4     | Not started              |
| Live Trading                 | Earned real capital                | Critical | 12          | 25      | 6     | Blocked (ADR + W1–4)     |
| Notification Platform        | Real operator alerts               | High     | 35          | 50      | 5     | Not started              |
| AI Platform                  | Assist; never spend                | High     | 40          | 50      | 7     | Not started              |
| Knowledge Platform           | Knowledge compounds                | Medium   | 42          | 75      | 7     | Lake: maintain           |
| Analytics / Reporting        | Evidence                           | Medium   | 38          | 75      | 8     | Reporting: maintain      |
| Portfolio                    | Honest exposure                    | High     | 62          | 75      | 8     | Not started              |
| Risk                         | Limits that actually bind          | High     | 67          | 90      | 8 / 6 | Engine: maintain         |
| Strategy Evolution (bounded) | Adapt without inventing            | Medium   | 62          | 75      | 8     | Not started              |
| Workspace / SaaS             | Small teams                        | High     | 50          | 75      | 9     | Workspace CRUD: maintain |
| Administration               | People and policy                  | High     | 12          | 25      | 9     | Not started              |
| Billing                      | Charge without touching orders     | Medium   | 0           | 0       | 9     | Not started              |
| Developer Platform           | Safe programmatic access           | Medium   | 17          | 50      | 9     | Not started              |
| Monitoring                   | See production                     | High     | 42          | 50      | 3     | Not started              |
| Business Continuity          | Outages and restart                | High     | 40          | 50      | 3     | Not started              |
| Disaster Recovery            | Restart-safety claims              | High     | 50          | 50      | 3     | Residual US295           |
| Financial Integrity          | Tamper-evident money path          | Critical | 50          | 75      | 6     | Ledger: maintain         |
| Compliance                   | Evidence packs                     | Medium   | 12          | 25      | 10    | Not started              |
| Infrastructure               | Durable stores and queues          | High     | 38          | 50      | 3     | Not started              |
| Performance                  | Usable at size                     | Medium   | 17          | 25      | 10    | Not started              |

Certified Version 2 products **maintained, not rebuilt:** Strategy Library, Certification, Runtime Gate, Deployment, Orchestrator, Qualification, Market Profile, Market State, Command Center (paper), Knowledge Lake, Reporting, AI Analytics, paper Execution Adapter.

---

## 6. Product metrics (frozen targets)

Measured on the customer product, not on a developer laptop exception.

| Metric                                          | Target                                            | Notes                                              |
| ----------------------------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| Time to register                                | **< 2 min**                                       | Durable account, no shared prefill                 |
| Time to secure login                            | **< 30 s**                                        | Existing account, happy path                       |
| Time to connect Binance (Wave 4)                | **< 3 min**                                       | Wizard + successful test                           |
| Time to connect Telegram (Wave 5)               | **< 1 min**                                       | After bot token available to the user              |
| Time to first **paper** Bot from certified path | **< 5 min**                                       | After strategy already certified (V2 loop kept)    |
| Time to first **live** Bot (Wave 6)             | **< 10 min**                                      | After live enabled, Gate PASS, keys connected      |
| Credential exposure in product/logs/UI          | **0 tolerated**                                   | No plaintext secrets in responses or logs          |
| Security incidents from default misconfig       | **0 tolerated** at release of a wave              | Insecure JWT, missing CSP in prod, prefilled admin |
| Simulated “Connected” shown as real             | **0 tolerated** from Wave 2 onward                | Honest labels required                             |
| Connection test success (offered, valid keys)   | **≥ 99%** excluding vendor outages                | Count vendor 5xx separately                        |
| Paper runtime availability (Wave 3+)            | **≥ 99.5%** monthly excluding planned maintenance | Process may restart; work must recover             |
| Live order path availability (Wave 6+)          | **≥ 99.9%** when live enabled                     | Fail closed if unsure                              |
| Cross-workspace secret leak                     | **0 tolerated**                                   | Automated tests                                    |
| AI-initiated live order                         | **0 tolerated**                                   | Conformance tests                                  |

---

## 7. Security strategy

Security is a **first-class product**, not a supporting feature. Detail: [`v3-security-vision.md`](./v3-security-vision.md).

| Principle            | Frozen meaning                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Zero Trust           | Every request authenticated; workspace membership server-side; vendor callbacks authenticated |
| Defense in Depth     | Edge → authn → authz → Gate/Risk/Kill Switch → vault → Ledger → audit                         |
| Least Privilege      | Default Researcher; live is extra policy + MFA; Admin cannot skip Gate/Risk                   |
| Secure by Default    | Prod CSP, cookies, rate limits, no dev JWT, integrations start disconnected, live off         |
| Credential Vault     | SEC-06 — only justified new security domain                                                   |
| Secret encryption    | SEC-07 — not plaintext DB columns                                                             |
| Financial integrity  | Ledger remains SoT for money; financial action log for who initiated live ops                 |
| Audit trail          | SEC-09 Wave 1; SEC-10 Wave 6                                                                  |
| OWASP                | Validation, encoding, rate limit, CSRF/cookie policy, XSS, SSRF allowlists, injection, CSP    |
| Replay protection    | Completes on live place/cancel (V3-L05)                                                       |
| Credential rotation  | Wave 2 (V3-C04)                                                                               |
| Workspace isolation  | Wave 1 fail-closed; Wave 9 teams                                                              |
| Incident logging     | Wave 1; monitoring Wave 3                                                                     |
| Security monitoring  | Wave 3 health dashboard                                                                       |
| Compliance readiness | Wave 10 packs on top of audit                                                                 |

ABAC **engine** is out. Live attributes use existing Gate + role + workspace live flag + kill switch + venue permissions.

---

## 8. Connection strategy

Detail: [`v3-connection-management-vision.md`](./v3-connection-management-vision.md).

Version 3 **removes** customer dependency on `.env`, manual server configuration, manual credential files, manual vendor testing, and manual secret rotation.

| Provider                           | Manageable in product UI                                    | When                  |
| ---------------------------------- | ----------------------------------------------------------- | --------------------- |
| OpenRouter                         | Yes                                                         | Wave 2                |
| Binance / Bybit / OKX              | Credentials Wave 2; real connect/test/disconnect Wave 4     | 2 then 4              |
| Kraken                             | Yes, or honestly not offered                                | Wave 4                |
| Telegram                           | Yes, real Bot API                                           | Wave 5                |
| Email, Slack, Discord, Teams, Push | Yes when shipped; else reserved                             | Wave 5                |
| OpenAI, Gemini, Anthropic          | Yes                                                         | Wave 7                |
| Future providers                   | Catalog + factory; not a rewrite                            | CM-21 Wave 2 contract |
| PostgreSQL / Redis / JWT           | **Host** infrastructure — admin health, not customer wizard | —                     |

Host `.env` remains valid for `DATABASE_URL`. It is **not** the customer path for vendor secrets.

---

## 9. Business continuity and disaster recovery

Owned with Wave 3 (packages V3-O01, O03, O04, O05). Not a second runtime.

| Event                                 | Customer expectation                                                                                           | Operator visibility         |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Exchange unavailable**              | Connect/test shows vendor failure. Paper may continue on public data or pause honestly. No fake fills as live. | Connection health = error   |
| **AI unavailable**                    | Research, Gate, paper/live trading continue. Narratives show offline.                                          | AI connection status        |
| **Notification provider unavailable** | In-app history still works. Channel marked down. No silent drop without a record after Wave 3 queue.           | Channel health              |
| **Database unavailable**              | Product unavailable or read-only maintenance. No partial writes presented as success.                          | `/health` + status page     |
| **Queue unavailable**                 | Fail closed or documented fallback; no silent loss of kill-switch or live commands                             | Health                      |
| **Runtime restart**                   | Sessions recover or stay safely stopped. Kill Switch still armed. Secrets still in vault.                      | Recovery/incident view      |
| **Network interruption**              | Adapters reconnect with backoff; status Reconnecting/Error; no duplicate live orders (idempotency Wave 6)      | Connection + session status |
| **Graceful degradation**              | Core research + paper survive AI/notify loss. Live fails closed if venue or risk is unsure.                    | Honest banners              |

Disaster recovery **claim** (“production restart-safe”) requires Wave 3 US295/ADL-008 **accepted** or an explicit written limitation. Silent PASS is forbidden.

---

## 10. Reuse from Version 2 (do not redesign)

| Stance              | Subsystems                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Reuse unchanged** | Strategy Library, Certification, Qualification, Market Profile, Orchestrator (`createsSession` false), paper Execution Adapter, Knowledge Lake as projection, Reporting product, AI Analytics (local), AI-never-controls-capital invariant |
| **Minor extension** | Gate (live admission), Deployment (live flag), Command Center (kill switch / live), Cluster (bind real adapter), Session/Runtime (live mode), Risk policies, Portfolio product, Reporting exporters                                        |
| **Major extension** | Identity/Auth, Exchange Adapter I/O, Notification transports, AI Gateway keys, Recovery (US295), analytical persistence                                                                                                                    |
| **New justified**   | Credential Vault; Connection Management **facade**; Billing (isolated)                                                                                                                                                                     |
| **Replace**         | **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, or Library                                                                                                                                                                 |

---

## 11. Owners (one product area, one owner)

| Area                              | Owner                                   | Must not own                    |
| --------------------------------- | --------------------------------------- | ------------------------------- |
| Security Platform / Vault / Audit | Identity/Auth + Vault module            | Orders, Ledger                  |
| Connection Management UI          | Connection Management facade            | Venue protocol, send()          |
| Exchange I/O                      | Exchange Adapter factory                | Cluster identity, Risk          |
| Exchange isolation                | Exchange Scope / Cluster                | API keys                        |
| Notifications                     | Notification Delivery                   | Trading commands                |
| AI HTTP                           | AI Gateway                              | Gate, capital                   |
| AI narratives                     | AI Analytics                            | Money                           |
| Knowledge warehouse               | Knowledge Lake                          | Financial SoT                   |
| Money                             | Ledger / Position                       | UI, reports                     |
| Risk decisions                    | Risk Engine                             | —                               |
| Session lifecycle                 | Trading Session                         | Orchestrator-created sessions   |
| Kill Switch                       | Session/Command Center product (V3-O04) | Telegram                        |
| Live policy enablement            | Admin + ADR                             | Trader self-serve without audit |
| Billing                           | Isolated billing                        | Order path                      |

---

## 12. Major risks

| Risk                                 | Mitigation (in this plan)                      |
| ------------------------------------ | ---------------------------------------------- |
| Shipping live UI before real I/O     | UI Policy; Wave 6 last; Wave 4 handshake first |
| Secrets in `.env` as the real path   | Vault Wave 1; Connections Wave 2               |
| Redesign under “production” pressure | Frozen reuse table; no new order path          |
| US295 left silent                    | Wave 3 must accept or limit claims             |
| Wave 2 “Connected” for Binance       | Frozen split: collect W2, venue W4             |
| AI or Telegram as control plane      | Explicitly forbidden; tests                    |
| Counting polish as Version 3         | Mean reuse 32%; this is a platform extension   |
| Inventing packages mid-stream        | Package list in Execution Roadmap is frozen    |

---

## 13. Success criteria (Version 3 COMPLETE)

Version 3 is complete when **all** of the following are true. Detail: Execution Roadmap Part 9.

| Lens                  | Complete means                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Architecture          | Spec/Matrix/Alias unchanged except approved ADRs (vault ownership if needed, live capital). Canonical path only. |
| Product               | J-01…J-14 still work. J3 journeys in the Product Roadmap work. No customer `.env`. Honest live.                  |
| Security              | Vault, RBAC, isolation, OWASP defaults, financial audit, health view                                             |
| Testing               | Each V3-* package tested; Playwright on critical paths; no fake Connected                                        |
| Performance           | Paginated ledger; documented dataset limits                                                                      |
| Documentation         | This Master Plan + runbooks (vault rotation, kill switch, live incident, outage)                                 |
| Operational readiness | Production no longer blocked by missing vault, stub-only venues, in-memory-only Telegram, or hidden-fake live    |

Stretch not required for Complete unless already shipped: IDE shell (V3-W05), Market State classification, vector search.

---

## 14. Next package

| Field             | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| ID                | **V3-S01**                                                    |
| Name              | Authentication & Session                                      |
| Wave              | 1                                                             |
| Customer outcomes | Register, secure login, account recovery, session list/revoke |
| Must not          | Enable live UI; collect exchange keys; amend Spec v2.0        |

After V3-S01: V3-S02 RBAC Product → S03 Vault → S04 OWASP → S05 Audit → S06 Isolation.

---

## 15. Annexes (detail, not competing canons)

| Annex                                                                | Use                                                      |
| -------------------------------------------------------------------- | -------------------------------------------------------- |
| [Planning Consistency Audit](./v3-planning-consistency-audit.md)     | Why freeze decisions exist                               |
| [Vision](./v3-vision.md)                                             | What / who / why                                         |
| [Product Roadmap](./v3-product-roadmap.md)                           | Groups and journeys                                      |
| [Capability Inventory](./v3-capability-inventory.md)                 | Every ID                                                 |
| [Execution Roadmap](./v3-execution-roadmap.md)                       | Packages and technical exit                              |
| [Security Vision](./v3-security-vision.md)                           | Controls                                                 |
| [Connection Management Vision](./v3-connection-management-vision.md) | Providers and wizard rules                               |
| [Readiness Dashboard](./v3-readiness-dashboard.md)                   | Capability × wave table                                  |
| [Planning Summary](./v3-planning-summary.md)                         | Historical executive draft — **superseded by this file** |
| [Planning Completion Report](./v3-planning-completion-report.md)     | Freeze record                                            |
| [README](./README.md)                                                | Folder index                                             |

Version 2 sources (read-only): [Final Certification](../version-2-final-certification.md), [Audit v2](../product-readiness-audit-v2.md), [Connection Audit](../version-2-connection-management-audit.md), [Technical Debt](../technical-debt.md), [Spec v2.0](../trp-architecture-specification-v2.md).

---

## 16. Future guidance (binding)

1. Start every Version 3 implementation task from **this file**.
2. If implementation contradicts this Master Plan, stop implementation and update the Master Plan first.
3. Identify the wave and **V3-*** package before writing code.
4. If work is not in this plan, **stop** and request a planning revision.
5. Do not reopen Version 2 RCs, PC packages, or certification.
6. Do not redesign Version 2.
7. Do not treat annex count tables as authority; this file’s freeze (F1–F10 in the Consistency Audit) wins.
8. Live capital still requires a **future ADR**. This plan does not write that ADR.

---

**PLANNING IS FROZEN.**  
**STOP.** Wait for review before **V3-S01 Authentication & Session** begins.

---

**End of Version 3 Master Plan.**
