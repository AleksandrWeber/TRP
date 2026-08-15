# PC-14 Workspace Management — Tests Summary

**Package:** PC-14  
**Date:** 2026-08-15  
**Verdict:** PASS

---

## Slice tests

| Area                                                     | Evidence                                               |
| -------------------------------------------------------- | ------------------------------------------------------ |
| REST list / create / get / rename / archive / isolation  | `workspace.controller.spec.ts`                         |
| Name DTO                                                 | `workspaces.dto.spec.ts`                               |
| Durable create / rename / archive / switch after hydrate | `pc14-workspace-product.integration.spec.ts`           |
| Existing domain create / rename / archive / bootstrap    | `workspace-domain.service.spec.ts` (unchanged owner)   |
| Switcher list, empty, loading, error, dialogs            | `WorkspaceSwitcher.spec.tsx`                           |
| Name validation                                          | `workspace-name.spec.ts`                               |
| Persisted selection vs bootstrap                         | `resolve-active-workspace.spec.ts`                     |
| Shell hosts switcher                                     | `AppLayout.spec.tsx`, `pc14-workspace-product.spec.ts` |
| Auth gate restore path                                   | `pc14-workspace-product.spec.ts`                       |
| Workspace 404 mapping                                    | `mapApiError.spec.ts`                                  |

---

## Full suites (this package)

| Suite                                   | Result                         |
| --------------------------------------- | ------------------------------ |
| `@trp/web` vitest                       | **30 files, 117 tests PASS**   |
| `@trp/api` vitest                       | **444 files, 2959 tests PASS** |
| `tsc --noEmit` (`apps/web`, `apps/api`) | PASS                           |
| eslint `apps/web` `src/**/*.{ts,tsx}`   | PASS                           |
| eslint `apps/api` `src/**/*.ts`         | PASS                           |

Architecture conformance tests were not used as the sole evidence. Controller, persistence, switcher, and restore-selection tests cover the user-facing slice.

---

**End of Tests Summary.**
