# RC-28 Epic 3 — Ownership Verification Report

**Document:** Version 2 Ownership / SoT Catalog  
**Status:** Epic 3 **approved**  
**Date:** 2026-08-14  
**Parent:** [Epic 3 Report](./rc-28-epic3-authority-ownership-verification.md)  
**Code:** `apps/api/src/platform-conformance/v2-sot-map.ts` · `v2-alias-bindings.ts`  
**Constitution:** [Alias Dictionary](./v2-alias-dictionary.md) (**unmodified**)

Verification only. Ownership never transfers.

---

## 1. Disjoint owners (DoD)

```text
Strategy Library
  ≠ Runtime Enforcement (Gate)
  ≠ Trading Session
  ≠ Trading Orchestrator
  ≠ Risk Engine
  ≠ Execution Engine
  ≠ Accounting (Ledger)
  ≠ Knowledge Lake
  ≠ Reporting
  ≠ AI Analytics
  ≠ Notification Delivery
  ≠ Command Center
  ≠ Exchange Scope
```

---

## 2. Unique Source of Truth per concept

| Concept                      | Sole owner            | Class                   | Trading/finance SoT? |
| ---------------------------- | --------------------- | ----------------------- | -------------------- |
| order-lifecycle              | Orders                | SoT                     | Yes                  |
| risk-decision                | Risk Engine           | SoT                     | Yes                  |
| execution-submit             | Execution Engine      | SoT                     | Yes                  |
| fill-facts                   | Execution Engine      | SoT                     | Yes                  |
| positions                    | Accounting            | SoT                     | Yes                  |
| cash-ledger                  | Accounting            | SoT                     | Yes                  |
| trading-session-lifecycle    | Trading Session       | SoT                     | Yes                  |
| certified-strategy-lifecycle | Strategy Library      | SoT                     | No                   |
| tactical-envelope-binding    | Strategy Library      | SoT                     | No                   |
| enforcement-pass-fail        | Runtime Enforcement   | Gate                    | No                   |
| qualification-run            | Market Qualification  | research artifact       | No                   |
| market-profile-versions      | Market Profile        | research artifact       | No                   |
| current-state-snapshot       | Market State          | market-state artifact   | No                   |
| orchestration-run            | Trading Orchestrator  | orchestration artifact  | No                   |
| exchange-scope-identity      | Exchange Scope        | isolation artifact      | No                   |
| exchange-risk-policy-inputs  | Exchange Scope        | policy input            | No                   |
| analytical-warehouse         | Knowledge Lake        | projection              | No                   |
| report-generation            | Reporting             | projection              | No                   |
| analytical-narrative         | AI Analytics          | narrative               | No                   |
| notification-delivery        | Notification Delivery | notification projection | No                   |
| ops-command-entry            | Command Center        | command UI              | No                   |

Duplicate-owner scan: **empty**. Trading/finance SoT owners are **only** Orders, Risk Engine, Execution Engine, Accounting, Trading Session.

---

## 3. Alias bindings (no second aggregate)

| Product term | Canonical owner      | Code evidence                             | Forbidden                              |
| ------------ | -------------------- | ----------------------------------------- | -------------------------------------- |
| Bot          | Trading Session      | `BotFacadeService`; Bot id === Session id | Prisma `model Bot`; parallel lifecycle |
| Cluster      | Exchange Scope       | `EXCHANGE_SCOPE_UI_ALIAS = 'Cluster'`     | Duplicate Risk / Execution engines     |
| Wallet       | Trading Account      | Ledger remains Freeze Accounting          | Second ledger; UI-as-SoT               |
| Brain        | Trading Orchestrator | `TRADING_ORCHESTRATOR_MODULE_ID`          | AI decides trades; bypass Execution    |

---

## 4. Isolation (invariants 1–10, reused)

RC-27 `isolation-invariants.spec.ts` remains the Nest proof. Epic 3 re-asserts the domain predicates:

| Invariant                                                        | Evidence                                                   |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| 1–2 No cross-scope funds / capacity                              | `assertSameExchangeScope(binance, bybit)` throws           |
| 3–4 One Risk / one Execution                                     | `exchangeScopeIsRiskEngine() === false`; clone-* forbidden |
| 5–6 Scoped accounting / shared research                          | clone-accounting / clone-strategy-library forbidden        |
| 7 Fail closed on ambiguity                                       | `pick-another-exchange-on-ambiguity` forbidden             |
| 8–10 Paper explicit / stats projection / qualification per venue | invent-fill / mutate-ledger / run-qualification forbidden  |

---

## 5. Tactics Contract Option B

| Check                                 | Evidence                                                       |
| ------------------------------------- | -------------------------------------------------------------- |
| Envelope ownership                    | Strategy Library `tactical-envelope-binding-references`        |
| Gate must not mutate envelope         | `mutate-envelope` forbidden                                    |
| Orchestrator must not expand envelope | `expand-tactical-envelope` forbidden                           |
| Gate fail-closed on miss              | `validateDeployment` → `envelope_missing` / immutability check |

---

## 6. STOP

Ownership catalog is frozen. Epic 4 must execute scenarios inside these owners — it must not add a second SoT.
