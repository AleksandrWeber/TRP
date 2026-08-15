# PC-12 Exchange Scope Product — Architecture Impact

**Package:** PC-12  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Exchange Scope remains isolation owner. Runtime unchanged. Trading Session unchanged. Deployment unchanged. No new SoT. No new authority. No venue adapters.

---

## Frozen artifacts

| Artifact                        | Status after PC-12  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                                                                       | Owner before            | Owner after                                    |
| ----------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------- |
| Isolation identity / lifecycle / config / policy inputs / bindings / metadata | Exchange Scope          | Exchange Scope                                 |
| Runtime                                                                       | Runtime                 | Unchanged                                      |
| Trading Session                                                               | Trading Session         | Unchanged                                      |
| Deployment                                                                    | Strategy Deployment     | Unchanged                                      |
| Venue adapters / exchange APIs                                                | Not this domain         | Unchanged (not implemented)                    |
| HTTP / Cluster UI                                                             | Missing product adapter | Sibling `exchange-scope-product` + `/clusters` |

HTTP is transport. UI is not SoT. Cluster views do not become Risk, Runtime, Session, or ledger SoT.

---

## Ports

| Port                            | Before                                 | After                                                                                   |
| ------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| `ExchangeScopeServicePort`      | Active, no REST                        | **Additive** HTTP commands in the product adapter                                       |
| `ExchangeScopeQueryPort`        | Active list/get/config/policy/bindings | **Additive** history / policy-history queries; optional `displayName` on config publish |
| `ExchangeScopeConsumerReadPort` | Active projections                     | Unchanged; workspace aggregate used for current-active                                  |
| Persistence                     | Process-local in-memory store          | Unchanged (`persistence: false`)                                                        |
| Domain REST                     | `rest: false`                          | Unchanged (`rest: false`)                                                               |

---

## What was not changed

- Exchange Scope domain model and lifecycle catalog
- Runtime / Trading Session / Deployment
- Venue adapters and exchange APIs
- Spec, Authority Matrix, Alias Dictionary, RC history
- Domain `EXCHANGE_SCOPE_PORTS_ACTIVE.rest` remains `false`

---

**End of Architecture Impact.**
