# PC-10 Market State Product — Product Surface

**Package:** PC-10  
**Date:** 2026-08-15

Market State is now a customer product over the existing owner.

| Surface                                                                | Location                                                                |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Market State Home                                                      | `/market-state`                                                         |
| Current State                                                          | `/market-state` and target Current State tab                            |
| Lifecycle / Transitions / History / Metadata / Qualification / Profile | `/market-state/targets/:targetId`                                       |
| Version details                                                        | `/market-state/targets/:targetId/versions/:version`                     |
| History                                                                | `/market-state/history`                                                 |
| Refresh                                                                | Target page action → `POST /v1/market-states/targets/:targetId/refresh` |
| Nav                                                                    | Research → Market State                                                 |
| Home                                                                   | Market State tile                                                       |
| REST                                                                   | `/v1/market-states/*`                                                   |

See [Research Visibility](./pc-10-research-visibility.md).

---

**End of Product Surface.**
