# Qualification Product (`qualification-product`)

**PC-08** HTTP + product views over existing Market Qualification service and query ports.

Not a bounded context. Not a Source of Truth. Research artifact only.

| Concern                                        | Owner                                                    |
| ---------------------------------------------- | -------------------------------------------------------- |
| Target / run / lifecycle / confidence / health | **Market Qualification**                                 |
| Market Profile versions                        | Market Profile (unchanged; PC-15 15-b already publishes) |
| Market State                                   | Market State (unchanged)                                 |
| HTTP / product views                           | This adapter                                             |
| Operator UI                                    | `/qualification`                                         |

Forbidden: scoring, new calculations, Profile redesign, Market State redesign, trade authorization.

Domain Qualification port posture remains `rest: false`. This module is transport only.
