# PC-03 Deployment Product — Tests Summary

**Package:** PC-03  
**Date:** 2026-08-15  
**Verdict:** PASS

---

## Slice tests

| Area                                                              | Evidence                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| Create / approve consume Gate; Library identity hint              | `strategy-deployment.service.spec.ts`                              |
| HTTP create / approve / isolation                                 | `strategy-deployment.controller.spec.ts`                           |
| Create body DTO + optional `libraryEntryId`                       | `strategy-deployment.dto.spec.ts`                                  |
| Product slice: create, list, Gate stamp, approve, FAIL, isolation | `pc03-deployment-product.integration.spec.ts`                      |
| Product view mapping                                              | `strategy-deployment.view.spec.ts`                                 |
| Request builder + status labels                                   | `deployment-wizard.spec.ts`                                        |
| Wizard / list / history / details                                 | `DeploymentPage.spec.tsx`                                          |
| Routes + REST client + shell                                      | `pc03-deployment.spec.ts`                                          |
| Dependency direction (Deployment does not import Library)         | `authority-conformance.spec.ts`, `v2-workflow-fail-closed.spec.ts` |

---

## Full suites (this package)

| Suite                                   | Result                         |
| --------------------------------------- | ------------------------------ |
| `@trp/web` vitest                       | **42 files, 153 tests PASS**   |
| `@trp/api` vitest                       | **461 files, 3014 tests PASS** |
| `tsc --noEmit` (`apps/web`, `apps/api`) | PASS                           |
| eslint changed web / API files          | PASS (no new diagnostics)      |

Architecture conformance tests were not used as the sole evidence. Service, controller, product-slice, UI, and path-honesty tests cover the user-facing slice.

---

**End of Tests Summary.**
