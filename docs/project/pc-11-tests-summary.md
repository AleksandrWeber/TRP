# PC-11 Trading Orchestrator Product — Tests Summary

**Package:** PC-11  
**Date:** 2026-08-15  
**Verdict:** PASS

---

## Slice tests

| Area                                                                              | Evidence                                        |
| --------------------------------------------------------------------------------- | ----------------------------------------------- |
| Product adapter: plan, run, selection, handoff, `createsSession: false`           | `trading-orchestrator-product.service.spec.ts`  |
| HTTP create / list / isolation / Gate FAIL 422                                    | `trading-orchestrator.controller.spec.ts`       |
| Plan / run / handoff DTOs; live mode rejected                                     | `orchestration.dto.spec.ts`                     |
| Product slice: browse plans, inspect intent, no Session                           | `pc11-orchestrator-product.integration.spec.ts` |
| Product view mapping                                                              | `trading-orchestrator.view.spec.ts`             |
| Existing coordinator still fail-closes and never owns Session                     | `orchestration-workflow.spec.ts`                |
| Request builder + approved Deployments only                                       | `orchestration-wizard.spec.ts`                  |
| Wizard / plans / history / handoff preview                                        | `OrchestratorPage.spec.tsx`                     |
| Routes + REST client + shell                                                      | `pc11-orchestrator.spec.ts`                     |
| Dependency direction (Orchestrator does not import Session / Deployment / Orders) | `trading-orchestrator.boundaries.spec.ts`       |

---

## Full suites (this package)

| Suite                                   | Result                         |
| --------------------------------------- | ------------------------------ |
| `@trp/web` vitest                       | **45 files, 162 tests PASS**   |
| `@trp/api` vitest                       | **466 files, 3028 tests PASS** |
| `tsc --noEmit` (`apps/web`, `apps/api`) | PASS                           |

Architecture conformance tests were not used as the sole evidence. Service, controller, product-slice, UI, and path-honesty tests cover the user-facing slice.

---

**End of Tests Summary.**
