# Market State Product (`market-state-product`)

**PC-10** HTTP + product views over existing Market State query/refresh surfaces.

Not a bounded context. Not a Source of Truth. Current-condition artifact only.

| Concern                                                       | Owner                                                                 |
| ------------------------------------------------------------- | --------------------------------------------------------------------- |
| Current state / lifecycle / transitions / versions / metadata | **Market State**                                                      |
| Qualification references                                      | Market Qualification (unchanged; observed via Market State consumers) |
| Profile references                                            | Market Profile (unchanged; observed via Market State consumers)       |
| Trading Orchestrator                                          | Unchanged consumer                                                    |
| HTTP / product views                                          | This adapter                                                          |
| Operator UI                                                   | `/market-state`                                                       |

Forbidden: market classification algorithms, strategy selection, orchestration, Qualification redesign, Profile redesign.

Domain Market State port posture remains `rest: false`, `marketStateService: false`, `marketStateQuery: false`. This module is transport only. Refresh republishes the existing snapshot with updated observational refs — it does not classify.
