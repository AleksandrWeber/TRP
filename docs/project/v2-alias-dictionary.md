# TRP V2 — Alias Dictionary

**Document:** V2 Alias Dictionary  
**Status:** **Approved** (2026-08-10)
**Date:** 2026-08-10  
**Rule:** Product language may differ from canonical names. **Code, ADRs, and APIs use canonical names.**

---

## Purpose

Prevent dual architectures by binding V2 product vocabulary to RC-16/RC-18 canonical concepts.

If a UI term has no row here, it must not be treated as a new bounded context.

---

## Dictionary

| Product / UI term         | Canonical architecture term                                                     | Layer                 | Allowed usage                                                                                             | Forbidden usage                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Bot**                   | **Trading Session**                                                             | Runtime               | UI labels, operator copy, Command Center cards, **Bot Facade** application interface (`BotFacadeService`) | New backend aggregate, Prisma `bots` table, parallel lifecycle, bypass of ADR-014, REST resource inventing a second SoT |
| **Bot fleet / bot count** | Active Session capacity under **Exchange Scope**                                | Runtime / policy      | Per-exchange max concurrent sessions                                                                      | Per-exchange separate runtime engines                                                                                   |
| **Mission**               | **Strategy Deployment** (immutable approved config) bound to a Session          | Runtime               | “Assign mission” = bind/start session with certified deployment                                           | Inventing strategy logic at assign time                                                                                 |
| **Wallet**                | **Trading Account** (paper now; live later via ADR)                             | Accounting            | UI for balances/reservations                                                                              | Second ledger; float cash; UI-as-SoT                                                                                    |
| **Cluster**               | **Exchange Scope**                                                              | Isolation             | Scope for adapter binding, accounts, session capacity, exchange policy                                    | Microservice; duplicate Risk/Ledger/Portfolio engines                                                                   |
| **Exchange Risk Manager** | **Exchange Risk Policy** (inputs to platform Risk Engine)                       | Risk                  | Limits, allowlists, max bots, max exposure                                                                | Separate Risk decision engine per exchange                                                                              |
| **Brain / Trading Brain** | **Trading Orchestrator**                                                        | Orchestration         | Product docs may say Orchestrator only                                                                    | Implying AI decides trades; bypassing Risk/Execution Engine                                                             |
| **Knowledge Lake**        | Knowledge + ops **event warehouse / projection store**                          | Knowledge             | Analytics, AI context, ML features (future)                                                               | Financial SoT; overriding Orders/Ledger                                                                                 |
| **Command Center**        | **Operations workspace** (operator UI)                                          | UX / Ops              | Pause/stop/kill via command APIs                                                                          | Authoritative finance/lifecycle state machine in UI                                                                     |
| **Dashboard**             | Non-authoritative **read model / projection**                                   | UX                    | Attention, health, summaries                                                                              | Recalculating PnL/ledger; approving risk                                                                                |
| **Report / AI Analytics** | Reporting projections + **AI narrative**                                        | UX / AI               | Explain, summarize, recommend for research                                                                | Trading decisions; mutating orders                                                                                      |
| **Market Profile**        | Versioned **venue qualification artifact**                                      | Research              | Confidence input to Orchestrator / Selector                                                               | Forcing exchange or strategy choice                                                                                     |
| **Market Qualification**  | Research **qualification pipeline** for a venue/market                          | Research              | User-triggered analysis + profile versions                                                                | Auto-spending heavy jobs without user confirm                                                                           |
| **Strategy**              | Validated **Strategy** version (algorithm)                                      | Research / Runtime    | Only certified versions in production path                                                                | Runtime mutation of algorithm                                                                                           |
| **Tactics**               | Validated **tactical parameter set** for a Strategy version                     | Runtime config        | Selection among pre-validated configs                                                                     | Changing indicators/rules/logic online                                                                                  |
| **Tactical Envelope**     | Certified **allowed tactics set** (structural stub on Trading Session in RC-19) | Runtime config        | Optional nullable attachment; round-trip persistence                                                      | Enforcement, validation, adaptation, Orchestrator selection (RC-22+)                                                    |
| **Portfolio (UI)**        | **Portfolio** projection                                                        | Accounting projection | Display exposure/equity                                                                                   | Source of truth for cash/positions                                                                                      |
| **Live Trading**          | Execution via live adapter (**future ADR**)                                     | Execution             | Planning language only until ADR                                                                          | Silent enablement under paper Freeze                                                                                    |

---

## Naming collisions to avoid

| Ambiguous phrase       | Resolve as                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Execution Orchestrator | Prefer **Trading Orchestrator**. Do **not** confuse with **Execution Engine** (ADR-012 sole adapter entry). |
| Bot engine             | Forbidden. Use Session runtime / Strategy Runtime.                                                          |
| Cluster Risk Engine    | Forbidden. Use Exchange Risk Policy + platform Risk Engine.                                                 |
| Lake as ledger         | Forbidden.                                                                                                  |

---

## Code and API guidance

1. Types, modules, Prisma models, REST paths: **canonical** (`trading-session`, `account`, `exchange-scope`, …).
2. UI copy may say Bot / Wallet / Cluster.
3. Story Specs must use canonical terms in acceptance criteria; UI alias may appear in UX notes.
4. New ADRs must cite this dictionary when introducing product-facing names.
5. **Bot Facade (RC-19 Epic 2):** `apps/api/src/modules/bot-facade` exposes product methods (`listBots`, `getBot`, `pauseBot`, …) that **delegate** to Trading Session. Bot id === Session id. No Bot persistence. See [`rc-19-epic2-bot-facade.md`](./rc-19-epic2-bot-facade.md).
6. **Tactical Envelope (RC-19 Epic 3):** schema stub only — `apps/api/src/modules/tactical-envelope`. Optional on Trading Session; **exists but is not yet active.** See [`rc-19-epic3-tactical-envelope.md`](./rc-19-epic3-tactical-envelope.md).

---

## Open items (non-blocking for dictionary approval)

- Exact REST resource names for Exchange Scope (defer to Spec v2.0 / ADR).
- Whether `TradingOrchestrator` is a Nest module name or a pure application service name (defer to Spec v2.0).
- Product HTTP gateway aliases for Bot (if any) must not create a second SoT; prefer Session paths or explicit facade docs.

---

## Approval

- [ ] Product language reviewed
- [ ] Canonical mapping reviewed against ADR-012…018
- [ ] No unresolved collisions
