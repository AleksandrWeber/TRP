# PC-05 Reporting Product — Tests Summary

**Package:** PC-05  
**Date:** 2026-08-15  
**Verdict:** PASS

---

## Slice tests

| Area                                                                                 | Evidence                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Product adapter: list/get, no generate, no deliver                                   | `reporting-product.service.spec.ts`                                                                       |
| HTTP list / isolation / 404                                                          | `reporting.controller.spec.ts`                                                                            |
| Query DTOs; unknown kinds/statuses/modes rejected                                    | `reporting.dto.spec.ts`                                                                                   |
| Product slice: visible run, narrative, delivery                                      | `pc05-reporting-product.integration.spec.ts`                                                              |
| Product view mapping + projection export                                             | `reporting.view.spec.ts`                                                                                  |
| Dependency direction (Reporting does not import product adapter / AI / Notification) | `reporting-product.boundaries.spec.ts`, `reporting.boundaries.spec.ts`, `product-flow.boundaries.spec.ts` |
| Home / history / detail / empty / loading / errors                                   | `ReportingPage.spec.tsx`                                                                                  |
| Routes + REST client + shell                                                         | `pc05-reporting.spec.ts`                                                                                  |

---

## Full suites (this package)

| Suite                                   | Result                         |
| --------------------------------------- | ------------------------------ |
| `@trp/web` vitest                       | **51 files, 179 tests PASS**   |
| `@trp/api` vitest                       | **494 files, 3122 tests PASS** |
| `tsc --noEmit` (`apps/web`, `apps/api`) | PASS                           |

Architecture conformance tests were not used as the sole evidence. Service, controller, product-slice, UI, and path-honesty tests cover the user-facing slice.

---

**End of Tests Summary.**
