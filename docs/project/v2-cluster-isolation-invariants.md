# TRP V2 — Cluster Isolation Invariants

**Document:** V2 Cluster Isolation Invariants  
**Status:** **Approved** (2026-08-10)
**Date:** 2026-08-10  
**Canonical term:** **Exchange Scope** (UI: Cluster)  
**Rule:** Isolation of _resources and policies_ — not duplication of _engines_.

Related: [Alias Dictionary](./v2-alias-dictionary.md), [Authority Matrix](./v2-authority-matrix.md), ADR-012, ADR-015, ADR-016, ADR-017.

---

## Purpose

Product intent: exchanges must not share wallets, bot capacity, or exchange-specific risk limits carelessly.

Engineering constraint: TRP remains a modular monolith with **one** Risk Engine, **one** Execution Engine entry, **one** Ledger SoT model.

---

## Definition

An **Exchange Scope** is an isolation boundary that binds:

- one exchange adapter identity (e.g. Binance, Bybit, OKX);
- zero or more Trading Accounts for that exchange;
- session capacity limits (UI: max bots);
- exchange-level risk policy inputs;
- exchange-level settings, journals, and statistics projections.

It is **not** a deployable microservice and **not** a fork of the trading stack.

---

## Shared platform services (must remain single)

These are shared across all Exchange Scopes:

| Service                                           | Why shared                                         |
| ------------------------------------------------- | -------------------------------------------------- |
| Strategy registry / certified versions            | One research truth                                 |
| Strategy Lab / Campaign / Backtest / Walk-Forward | Research OS core                                   |
| Strategy Runtime implementation                   | One evaluation model                               |
| Orders module                                     | One order lifecycle model                          |
| **Risk Engine**                                   | One decision authority (consumes per-scope policy) |
| **Execution Engine**                              | One adapter entry (ADR-012)                        |
| Position / Ledger / Portfolio **modules**         | One accounting model (scoped records)              |
| Knowledge Lake warehouse schema                   | One projection pipeline                            |
| Trading Orchestrator                              | One orchestration model                            |

---

## Isolated per Exchange Scope (must not leak)

| Resource                                                          | Isolation rule                                                                    |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Trading Accounts / balances                                       | Session/Order/Fill for scope A must not consume account of scope B                |
| Active Trading Sessions (“bots”)                                  | Capacity and lifecycle counted per scope                                          |
| Exchange Risk Policy                                              | Limits apply only within scope (plus any tighter platform limits)                 |
| Adapter credentials / connection health                           | Per scope                                                                         |
| Exchange allowlists (symbols, strategies permitted on that venue) | Per scope                                                                         |
| Scope journals / stats projections                                | Queried with scope id; no cross-scope bleed in defaults                           |
| Kill Switch scope options                                         | Platform-wide and/or per Exchange Scope and/or per Session — durable and explicit |

---

## Invariants (normative)

1. **No cross-scope funds.** An Order in Exchange Scope A MUST reference a Trading Account owned by A.
2. **No cross-scope session capacity.** Max active sessions for A MUST NOT authorize starting a session on B.
3. **One Risk Engine.** Exchange Scope MUST NOT own a second risk decision processor. It owns **policy inputs** only.
4. **One Execution Engine.** Adapters are plugged into the shared Execution Engine; scopes do not call exchange APIs from Strategy code.
5. **Scoped accounting records.** Ledger entries, Positions, Fills carry workspace + account (+ exchange scope) identity; rebuild stays deterministic per ADR-015.
6. **Shared research, scoped production.** A strategy may be researched once and certified once; production use still requires scope policy allowlist + Risk approval.
7. **Fail closed on ambiguity.** If scope identity is missing or conflicts, reject the command; do not “pick another exchange.”
8. **Paper vs live.** A scope’s execution mode is explicit. Paper Freeze remains until a live-capital ADR.
9. **Statistics are projections.** Per-exchange stats in Command Center/Lake MUST derive from scoped SoT events, not independent shadow books.
10. **Qualification is per venue.** Market Profile versions are keyed by venue/market; they adjust confidence, they do not move balances.

---

## Policy vs engine (example)

```text
Platform Risk Engine
  ← Platform limits (global)
  ← Exchange Scope Policy (Binance: maxSessions=3, maxExposure=…)
  ← Session / Deployment tactics (within Tactics Contract)
  → Risk Decision (SoT)
  → Orders / Execution
```

Allowed: Binance max bots = 3, OKX max exposure = 15%.  
Forbidden: `BinanceRiskEngine.decide()` as a separate authority path.

---

## Multi-exchange scaling rule

Adding Bybit/OKX means:

- new adapter + Exchange Scope + accounts + policies + qualification/profile;
- **not** cloning Orders/Risk/Ledger modules.

---

## Test themes (for later Story Specs)

- Cross-scope account reference rejected.
- Session capacity independent per scope.
- Risk decision records which policy versions were applied.
- Kill Switch at scope A does not silently alter scope B unless platform-wide.
- Projection queries default to single scope; cross-scope views are explicit and read-only.

---

## Approval

- [ ] Shared vs isolated lists accepted
- [ ] “No duplicate engines” accepted
- [ ] Cross-scope fund invariant accepted
