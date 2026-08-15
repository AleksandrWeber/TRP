# PC-08 Qualification Product — Product Surface

**Package:** PC-08  
**Date:** 2026-08-15

Qualification is now a customer product over the existing owner.

| Surface                                                           | Location                                  |
| ----------------------------------------------------------------- | ----------------------------------------- |
| Qualification Home                                                | `/qualification`                          |
| Target browser                                                    | `/qualification`                          |
| Request qualification                                             | `/qualification`                          |
| Target summary / lifecycle / confidence / health / runs / history | `/qualification/targets/:targetId`        |
| Requalification request                                           | Target page when qualified                |
| Run history                                                       | `/qualification/history`                  |
| Run details                                                       | `/qualification/runs/:qualificationRunId` |
| Nav                                                               | Research → Qualification                  |
| Home                                                              | Qualification tile                        |
| REST                                                              | `/v1/qualification/*`                     |

See [Research Visibility](./pc-08-research-visibility.md).

---

**End of Product Surface.**
