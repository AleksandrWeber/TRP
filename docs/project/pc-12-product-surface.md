# PC-12 Exchange Scope Product — Product Surface

**Package:** PC-12  
**Date:** 2026-08-15

Exchange Scope is now a customer product (UI: Cluster) over the existing owner.

| Surface                                                         | Location                          |
| --------------------------------------------------------------- | --------------------------------- |
| Cluster home                                                    | `/clusters`                       |
| Scope browser                                                   | `/clusters`                       |
| Current active Cluster                                          | `/clusters`                       |
| Create Cluster                                                  | `/clusters`                       |
| Cluster detail                                                  | `/clusters/:exchangeScopeId`      |
| Versions / bindings / policies / lifecycle / history / metadata | Detail tabs                       |
| Nav                                                             | Paper trading → Cluster           |
| Home                                                            | Cluster tile                      |
| REST                                                            | `/v1/exchange-scopes/*`           |
| Default overview (unchanged)                                    | `GET /v1/exchange-scopes/default` |

Adapter Exchanges at `/trading/exchanges` remain out of the product path.

See [Scope Matrix](./pc-12-scope-matrix.md).

---

**End of Product Surface.**
