# V3-S06-d Validation Report

**Package:** V3-S06 Workspace Isolation Hardening
**Slice:** S06-d — Cross-Product Isolation
**Status:** PASS — validation completed 2026-08-17. Product Owner review is
required before S06-e.

## Required validation

| Command / gate                           | Result                                                       |
| ---------------------------------------- | ------------------------------------------------------------ |
| S06 isolation harness and coverage tests | **PASS** — 19 tests, including two cross-product regressions |
| `pnpm lint`                              | **PASS**                                                     |
| `pnpm typecheck`                         | **PASS**                                                     |
| `pnpm test`                              | **PASS** — API 604 files / 3563 tests                        |
| `pnpm --filter @trp/web build`           | **PASS** — existing chunk-size warning only                  |
| `git diff --check`                       | **PASS**                                                     |
| Security Regression Suite                | **PASS** — `workspace-isolation/` Vitest cases               |

## Mandatory answers

1. **Which cross-product proofs were added?** Workspace → Vault → Audit,
   Workspace → Audit → Timeline, and Workspace → Vault → Timeline.
2. **Which products are now isolation-proved together?** Workspace, Vault,
   Security Audit store, and Timeline.
3. **Which products remain PENDING?** RBAC / People, Incident / investigation,
   Security Platform, and endpoint inventory.
4. **Which transitive negative regressions were added?** B Vault facts are
   absent from A Timeline, including after a B cursor; A is rejected before a B
   Timeline read.
5. **Was the Master Plan respected?** Yes.
6. **Were Product Principles respected?** Yes.
7. **Were any architectural deviations introduced?** No.

**STOP.** Wait for Product Owner review before S06-e.
