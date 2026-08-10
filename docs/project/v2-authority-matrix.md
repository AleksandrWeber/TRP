# TRP V2 — Authority Matrix

**Document:** V2 Authority Matrix  
**Status:** **Approved** (2026-08-10)
**Date:** 2026-08-10  
**Rule:** Every surface that “knows” something is either **SoT**, **projection**, **policy input**, or **narrative** — never more than one primary role.

Related: [Alias Dictionary](./v2-alias-dictionary.md), ADR-015, ADR-018.

---

## Purpose

V2 adds Command Center, Knowledge Lake, Reporting, and AI surfaces. Without an authority matrix they will compete with Orders, Execution, and Ledger.

---

## Authority classes

| Class            | Meaning                                | May mutate trading/finance state? |
| ---------------- | -------------------------------------- | --------------------------------- |
| **SoT**          | System of record for that fact family  | Yes, only via owning module APIs  |
| **Policy input** | Constraints consumed by SoT owners     | No (config change ≠ trade)        |
| **Projection**   | Rebuildable read model from SoT/events | No                                |
| **Narrative**    | Explanation / summary (incl. LLM)      | No                                |
| **Command UI**   | Operator intent entry                  | Only by calling SoT command ports |

---

## Matrix

| Concern                                      | SoT / owner                                                                         | Allowed consumers                                      | Forbidden                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Order lifecycle                              | **Orders**                                                                          | Execution Engine, Audit, Lake (events), UI projections | Dashboard inventing order state; Lake rewriting orders                            |
| Risk decision                                | **Risk Engine** (platform)                                                          | Orders (mandatory ref), Audit, Lake                    | Strategy Runtime self-approving; UI “force fill”; per-exchange shadow Risk engine |
| Kill Switch / halt                           | **Risk / Session safety** (durable)                                                 | Runtime, Execution, Command Center commands            | UI-only flag without durable state                                                |
| Execution submit/cancel                      | **Execution Engine**                                                                | Adapters                                               | Direct adapter calls from Strategy/UI/Orchestrator                                |
| Fill facts                                   | **Execution → Fill records**                                                        | Accounting pipeline, Lake                              | Recalculating fills in reports                                                    |
| Positions                                    | **Position accounting** (from Fills)                                                | Portfolio projection, UI                               | UI editing position quantity                                                      |
| Cash / fees / realized PnL                   | **Ledger**                                                                          | Portfolio, reports, Lake                               | Knowledge Lake or AI as balance authority                                         |
| Portfolio equity / exposure view             | **Portfolio projection**                                                            | Dashboard, Command Center, reports                     | Using Portfolio to authorize orders                                               |
| Trading Session lifecycle                    | **Trading Session** (ADR-014)                                                       | Orchestrator, Command Center commands, recovery        | Bot entity with separate state machine                                            |
| Strategy algorithm                           | **Strategy registry / certified version**                                           | Runtime, research                                      | Runtime code mutation; AI editing strategy                                        |
| Tactical config in use                       | **Deployment / Session config** within [Tactics Contract](./v2-tactics-contract.md) | Runtime, Orchestrator                                  | Out-of-set params without re-validation                                           |
| Exchange connectivity / market events        | **Live Market Data** (+ adapters)                                                   | Runtime, Qualification                                 | Provider payloads leaking as domain truth                                         |
| Exchange Scope config (max bots, allowlists) | **Exchange Scope + Exchange Risk Policy**                                           | Risk Engine (inputs), Orchestrator                     | Treating policy store as execution engine                                         |
| Research experiments / campaigns             | **Research / Campaign / Experiment records**                                        | Knowledge extraction, reports                          | Production rewriting history                                                      |
| Market Profile                               | **Versioned profile store** (research artifact)                                     | Orchestrator confidence, AI explain                    | Forcing trades; replacing Risk                                                    |
| Knowledge Lake contents                      | **Projection / warehouse** from events + research outputs                           | AI Analyst, reporting, future ML                       | Overriding SoT; unique financial truth                                            |
| Dashboard / Command Center numbers           | **Projections**                                                                     | Operators                                              | Authoritative recovery/finance decisions from UI cache                            |
| AI Analyst / Assistant text                  | **Narrative**                                                                       | Humans                                                 | Autonomous capital actions; silent config changes                                 |
| Telegram messages                            | **Notification projection**                                                         | Humans                                                 | Control plane / trading commands (V2)                                             |

---

## Derived rules

1. If two components disagree on cash, positions, or fills — **Ledger / Fill / Orders win**; Lake and UI lose.
2. If UI and Session disagree on lifecycle — **Session wins**; UI must refresh from API.
3. If AI recommends a tactic outside the validated set — **reject**; require research pipeline.
4. Command Center may trigger Emergency Stop only through durable Kill Switch / Session commands.
5. Reporting may aggregate Lake or projections but must label paper vs live and must not recompute authoritative ledger balances with ad-hoc math.

---

## V2 surfaces — one-line authority

| Surface                        | Authority class                                                |
| ------------------------------ | -------------------------------------------------------------- |
| Bot (UI)                       | Command UI + projection over Trading Session                   |
| Cluster (UI)                   | Projection + policy editor for Exchange Scope                  |
| Knowledge Lake                 | Projection / warehouse                                         |
| Reporting & AI Analytics       | Projection + narrative                                         |
| Command Center                 | Command UI + projection                                        |
| Market Qualification / Profile | Research SoT for _profile versions_; never execution SoT       |
| Trading Orchestrator           | Policy/orchestration consumer — **not** SoT for money or fills |

---

## Approval

- [ ] SoT owners confirmed against ADR-012…018
- [ ] Lake / AI / Command Center explicitly non-SoT
- [ ] No dual authority left unresolved
