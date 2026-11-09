# FIV-CONN-04-D — VMP-1 SR-Remediated Baseline

```text
REMEDIATION BASELINE RECORD
RECORD ID: D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED
DATE: 2026-11-09
OWNER ACCEPTANCE: ACCEPTED — OWNER-LED TECHNICAL ACCEPTANCE
INDEPENDENT REVIEW: NOT PERFORMED
PORT IA RATIFICATION: NOT PERFORMED
STAGE 4 CODING AUTHORIZATION: NOT GRANTED
STAGE 4 EXECUTION: NOT AUTHORIZED
COMMIT: 8177f3a80a879bc603f6e22d192752013501a476
TREE: 7df527b7d5ab19379aca76f53b4ee8a7a7ddf12c
PARENT: e6b839e0e7d75322d9626162712fa81f61147d18
SUBJECT: feat(fiv-conn-04-d): accept VMP-1 self-review remediation
```

**Document:** Technical baseline for the owner-accepted VMP-1 self-review remediation  
**Record ID:** **`D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED`**  
**Date:** 2026-11-09  
**Wave:** 6 — Live Trading / FIV-CONN-04-D

This file does not embed its own SHA-256. That value is measured after the file is written.

This record is written beside the remediation commit. It is not part of that commit, so it can name the commit and tree Git created. The hashes in §D were read from `git rev-parse` and `git log -1` after commit `8177f3a80a879bc603f6e22d192752013501a476`. No hash was invented.

---

## A. Baseline identity

| Field                           | Value                                                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Name                            | `D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED`                                                                                                     |
| Record ID                       | `D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED`                                                                                                     |
| Original VMP-1 baseline commit  | `e6b839e0e7d75322d9626162712fa81f61147d18`                                                                                                   |
| Original VMP-1 baseline tree    | `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2`                                                                                                   |
| Original VMP-1 baseline parent  | `a59c533977923a45413a176ad143325a948feeb8`                                                                                                   |
| Remediation branch              | `remediation/vmp-1-self-review`                                                                                                              |
| Remediation worktree            | `/Users/oleksandrsvacko/Desktop/myProjects/fiv-conn-04-d-vmp-1-sr-remediation`                                                               |
| Remediation scope               | SR-001, SR-002, SR-003, SR-004                                                                                                               |
| Owner Acceptance Record         | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-remediation-owner-acceptance.md` — `ACCEPT-CONN04-VMP1-SR-REMEDIATION-2026-11-09`  |
| Remediation Verification Record | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-remediation-verification-record.md` — `TVER-CONN04-VMP1-SR-REMEDIATION-2026-11-09` |

The original baseline commit and tree remain historical evidence. This record does not replace that worktree.

---

## B. Technical state

The remediation commit, relative to parent `e6b839e0e7d75322d9626162712fa81f61147d18`, contains these six paths:

| Path                                                                                          | Change                                                               |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts`                | `@Inject` on the three existing class dependencies                   |
| `apps/api/src/modules/connections/fiv-conn-04-d-vault-metadata-entry-seam.spec.ts`            | Nest testing-module resolution of Entry                              |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.service.ts`                   | Reject a returned row whose id or workspace is not the request       |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.service.spec.ts`              | Narrow-method spy, mismatch test, invalid state, blank id, `Revoked` |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-remediation-verification-record.md` | Verification record                                                  |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-remediation-owner-acceptance.md`    | Owner-led acceptance                                                 |

Summary: SR-001 resolves Entry through the real metadata module without `new`. SR-002 asserts `findMetadataByIdAndWorkspaceId('vault-1', 'ws-a')` and that broad repository methods are not called. SR-003 returns `NOT_FOUND` without metadata when a well-formed row does not match the requested pair. SR-004 covers state `Deleted`, a blank returned id, and a successful `Revoked` view.

Evidence provenance is the remediation implementation task on 2026-11-09, as already recorded by `TVER-CONN04-VMP1-SR-REMEDIATION-2026-11-09`. Neither that verification record nor this baseline finalization reran Vitest, ESLint, or `tsc`.

| Check                                      | Result                                                             |
| ------------------------------------------ | ------------------------------------------------------------------ |
| Vitest, 4 files                            | **PASS**, exit 0, 39 tests (10 + 8 + 18 + 3)                       |
| ESLint on the four source and test files   | **PASS**, exit 0                                                   |
| `tsc --noEmit` before `@trp/research/dist` | **FAIL**, exit 2, fifteen `TS2307` errors for `@trp/research` only |
| `@trp/research` build, then `tsc --noEmit` | **PASS**, exit 0                                                   |
| Full `ConnectionsModule` boot              | **Not tested**                                                     |
| Full monorepo build                        | **Not executed**                                                   |

Known limitations:

- SR-001 does not boot `ConnectionsModule`.
- Vitest does not emit `design:paramtypes`. The `@Inject` decorators name dependencies the module already provides.
- Identity mismatch uses existing `NOT_FOUND` as an implementation choice. Port IA §6.3 does not explicitly name a dishonest repository row.
- SR-002 spies the in-memory path. Prisma `select` remains T-VMP-02.
- This baseline record is not inside the remediation commit.

---

## C. Governance

- Acceptance is owner-led. The confirmed statement is in `ACCEPT-CONN04-VMP1-SR-REMEDIATION-2026-11-09`.
- Independent review was not performed. Independent approval is not claimed.
- This record does not ratify Port IA.
- Stage 4 coding remains unauthorized.
- Stage 4 execution remains unauthorized.
- This record does not update the Decision Register.
- The original VMP-1 baseline worktree is not modified by this record.

---

## D. Commit and tree identity

| Field              | Value                                                       |
| ------------------ | ----------------------------------------------------------- |
| Remediation commit | `8177f3a80a879bc603f6e22d192752013501a476`                  |
| Remediation tree   | `7df527b7d5ab19379aca76f53b4ee8a7a7ddf12c`                  |
| Parent             | `e6b839e0e7d75322d9626162712fa81f61147d18`                  |
| Subject            | `feat(fiv-conn-04-d): accept VMP-1 self-review remediation` |
| Branch             | `remediation/vmp-1-self-review`                             |

Read after the remediation commit with `git rev-parse`, `git rev-parse HEAD^{tree}`, `git rev-parse HEAD^`, and `git log -1 --format=%s` while HEAD was `8177f3a80a879bc603f6e22d192752013501a476`. The parent-to-that-commit diff is the six paths in §B.

This file is a later commit on the same branch. It does not amend `8177f3a80a879bc603f6e22d192752013501a476`. It does not change that commit's tree.

---

_End of record. Owner-led acceptance recorded. Independent review NOT PERFORMED. Port IA NOT RATIFIED. Original VMP-1 baseline UNCHANGED. Stage 4 NOT AUTHORIZED._
