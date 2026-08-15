# Exchange Scope Product (`exchange-scope-product`)

**PC-12** HTTP + product views over existing Exchange Scope service, query, and consumer-read ports.

Not a bounded context. Not a Source of Truth. UI alias is Cluster.

| Concern                                                            | Owner                           |
| ------------------------------------------------------------------ | ------------------------------- |
| Isolation identity / lifecycle / config / policy inputs / bindings | **Exchange Scope**              |
| Runtime                                                            | Runtime (unchanged)             |
| Trading Session                                                    | Trading Session (unchanged)     |
| Deployment                                                         | Strategy Deployment (unchanged) |
| HTTP / product views                                               | This adapter                    |
| Operator UI                                                        | `/clusters`                     |

Forbidden: venue adapters, exchange APIs, live capital, Runtime/Session/Deployment redesign.

Domain Exchange Scope port posture remains `rest: false`. This module is transport only.
