# Market Profile Product (`market-profile-product`)

**PC-09** HTTP + product views over existing Market Profile query ports.

Not a bounded context. Not a Source of Truth. Research artifact only.

| Concern                                                     | Owner                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------- |
| Profile versions / latest / history / dimensions / metadata | **Market Profile**                                             |
| Qualification runs that published a version                 | Market Qualification (unchanged; PC-15 15-b already publishes) |
| Market State                                                | Market State (unchanged)                                       |
| HTTP / product views                                        | This adapter                                                   |
| Operator UI                                                 | `/market-profile`                                              |

Forbidden: new profile calculations, scoring, Qualification redesign, Market State redesign, trade authorization, publish REST.

Domain Market Profile port posture remains `rest: false`. This module is transport only. Publish remains the qualification pipeline’s existing call.
