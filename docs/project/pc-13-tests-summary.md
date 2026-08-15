# PC-13 Command Center Product — Tests Summary

**Package:** PC-13  
**Date:** 2026-08-15  
**Verdict:** PASS

---

## Slice tests

| Area                                                       | Evidence                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| Bot Facade create/start delegates to Trading Session       | `bot-facade.service.spec.ts`                                    |
| HTTP create / start / pause / resume / stop                | `trading-session-command.controller.spec.ts`                    |
| GET operations view: health + runtime + deployment ref     | `trading-session-query.controller.spec.ts`                      |
| Paper Account create HTTP; live mode rejected              | `paper-account.controller.spec.ts`, `paper-account.dto.spec.ts` |
| Product DTO rejects live/manual origin                     | `trading-session.dto.spec.ts`                                   |
| Product slice: create, start, monitor, pause, resume, stop | `pc13-command-center-product.integration.spec.ts`               |
| Operations view mapping                                    | `command-center-session.view.spec.ts`                           |
| Wizard + orchestration reference (`createsSession: false`) | `create-bot-wizard.spec.ts`                                     |
| Routes + REST client + console honesty                     | `pc13-command-center.spec.tsx`                                  |
| Fleet pause/resume/stop + start availability               | `CommandCenterPage.epic3.spec.tsx`                              |

---

## Full suites (this package)

| Suite                                   | Result                         |
| --------------------------------------- | ------------------------------ |
| `@trp/web` vitest                       | **47 files, 168 tests PASS**   |
| `@trp/api` vitest                       | **471 files, 3043 tests PASS** |
| `tsc --noEmit` (`apps/web`, `apps/api`) | PASS                           |

Architecture conformance tests were not used as the sole evidence. Service, controller, product-slice, UI, and path-honesty tests cover the user-facing slice.

---

**End of Tests Summary.**
