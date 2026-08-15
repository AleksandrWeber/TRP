# PC-10 Market State Product — Architecture Impact

**Package:** PC-10  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Market State remains owner. Qualification unchanged. Profile unchanged. Trading Orchestrator unchanged. No new SoT. No classification introduced.

---

## Frozen artifacts

| Artifact                        | Status after PC-10  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                                                       | Owner before            | Owner after                                      |
| ------------------------------------------------------------- | ----------------------- | ------------------------------------------------ |
| Current state / lifecycle / transitions / versions / metadata | Market State            | Market State                                     |
| Qualification                                                 | Market Qualification    | Unchanged                                        |
| Profile                                                       | Market Profile          | Unchanged                                        |
| Trading Orchestrator                                          | Trading Orchestrator    | Unchanged                                        |
| HTTP / Market State UI                                        | Missing product adapter | Sibling `market-state-product` + `/market-state` |

HTTP is transport. UI is not SoT. Market State views do not become Qualification, Profile, Risk, execution, or Orchestrator SoT.

---

## Ports

| Port                                         | Before                        | After                                                                                |
| -------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| `MarketStateQueryPort`                       | Nest inactive                 | **Unchanged** (`marketStateQuery: false`)                                            |
| `MarketStateServicePort`                     | Nest inactive (no classify)   | **Unchanged** (`marketStateService: false`); classify not on this REST               |
| Consumer read / observational reads          | Active                        | Unchanged; product reads compose them                                                |
| Projection store                             | Current + transitions         | **Additive** workspace / history / by-version reads of versions already in the store |
| Persistence                                  | Process-local in-memory store | Unchanged (`persistence: false`)                                                     |
| Domain REST                                  | `rest: false`                 | Unchanged (`rest: false`)                                                            |
| Qualification / Profile / Orchestrator ports | Unchanged                     | Unchanged                                                                            |

Refresh uses existing `publishNextMarketState` and copies the current snapshot. It does not compute a regime.

---

## What was not changed

- Market State domain model, lifecycle catalog, and classification posture (still no classifier)
- Qualification
- Profile
- Trading Orchestrator (still uses its existing in-memory Market State consumer)
- Spec, Authority Matrix, Alias Dictionary, RC history
- Domain `MARKET_STATE_PORTS_ACTIVE.rest` remains `false`

---

**End of Architecture Impact.**
