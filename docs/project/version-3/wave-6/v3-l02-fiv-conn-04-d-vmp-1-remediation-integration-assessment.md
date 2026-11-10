# FIV-CONN-04-D — VMP-1 Remediation Integration Assessment

```text
INTEGRATION ASSESSMENT
RECORD ID: ASSESS-CONN04-VMP1-SR-INTEGRATION-2026-11
DATE: 2026-11-10
RECOMMENDED OPTION: A — KEEP THE REMEDIATED BASELINE INDEPENDENT
PROJECT OWNER DECISION: REQUIRED — NOT MADE BY THIS RECORD
INDEPENDENT REVIEW: NOT PERFORMED
PORT IA RATIFICATION: NOT PERFORMED
STAGE 4: NOT AUTHORIZED BY THIS ASSESSMENT
PR / MERGE / CHERRY-PICK / REBASE / PUSH: NOT PERFORMED
```

**Document:** Repository-grounded integration assessment for the owner-accepted VMP-1 self-review remediation  
**Record ID:** **`ASSESS-CONN04-VMP1-SR-INTEGRATION-2026-11`**  
**Date:** 2026-11-10  
**Wave:** 6 — Live Trading / FIV-CONN-04-D

This file does not embed its own SHA-256. That value is measured after the file is written.

This assessment recommends an integration path. It does not decide that path. Owner acceptance of SR-001 through SR-004 is not independent review, not Port IA ratification, and not Stage 4 authorization.

---

## A. Purpose and scope

Determine whether the completed remediation on `remediation/vmp-1-self-review` should remain an independent accepted baseline, be integrated into `main`, be integrated into `impl/fiv-conn-04-d-stage-4`, or follow another path that the repository evidence supports.

In scope: Git history, trees, and diffs among the commits named below; the remediation source and tests; overlap with Stage 4; the Decision Register entry for the original VMP-1 baseline on `main`; the remediation verification, owner-acceptance, and remediated-baseline records; and the Stage 4 closure act that exists on the Stage 4 branch.

Out of scope: implementation, pull requests, merge, cherry-pick, rebase, push, branch modification, Port IA amendment, Decision Register update, and any authorization of Stage 4.

---

## B. Repository state

Read on 2026-11-10 from the shared object store. No worktree was checked out onto these commits for this assessment.

| Line                    | Branch                          | Commit                                     | Tree                                       | Role                                                                                           |
| ----------------------- | ------------------------------- | ------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Remediation tip         | `remediation/vmp-1-self-review` | `798b774f7a32b8eb70c3af07a851d43996bae5a0` | `b56e97644053243476371b98f62e4d0908a5dc08` | Baseline record only. Subject `docs(fiv-conn-04-d): record VMP-1 remediated baseline`.         |
| Remediation commit      | same                            | `8177f3a80a879bc603f6e22d192752013501a476` | `7df527b7d5ab19379aca76f53b4ee8a7a7ddf12c` | SR-001…SR-004 plus verification and owner-acceptance records. Parent is the original baseline. |
| Original VMP-1 baseline | `baseline/vmp-1-runtime`        | `e6b839e0e7d75322d9626162712fa81f61147d18` | `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2` | Parent `a59c533977923a45413a176ad143325a948feeb8`.                                             |
| Primary `main`          | `main`                          | `686627cb820a6994951cc6d1cbd4ab2b7c6ae4ed` | `2559ff1ec2417ce665dcd9a89aee32443a27c696` | Does not contain `e6b839e`.                                                                    |
| Stage 4                 | `impl/fiv-conn-04-d-stage-4`    | `388fa1c67ff8b2367d99c978f6aecd4f6d680c84` | `e57229e1c851e4872a75e32ee335cd2c3f4ecab3` | Descends from `e6b839e`. Does not contain `8177f3a`.                                           |

Remote tips read locally, without a new fetch: `origin/remediation/vmp-1-self-review` = `798b774f7a32b8eb70c3af07a851d43996bae5a0`, `origin/main` = `686627cb820a6994951cc6d1cbd4ab2b7c6ae4ed`, `origin/impl/fiv-conn-04-d-stage-4` = `388fa1c67ff8b2367d99c978f6aecd4f6d680c84`.

Worktree used for the write: `/Users/oleksandrsvacko/Desktop/myProjects/fiv-conn-04-d-vmp-1-sr-remediation`, branch `remediation/vmp-1-self-review`, HEAD `798b774f7a32b8eb70c3af07a851d43996bae5a0`, clean before this file was added.

Ancestry:

| Relation                                          | Result                                     |
| ------------------------------------------------- | ------------------------------------------ |
| Merge base of `main` and the original baseline    | `a59c533977923a45413a176ad143325a948feeb8` |
| Commits on `main` not in the baseline             | 51                                         |
| Commits on the baseline not in `main`             | 1 (`e6b839e`)                              |
| Merge base of Stage 4 and the baseline            | `e6b839e` itself. Stage 4 is a descendant. |
| Commits on Stage 4 after the baseline             | 4                                          |
| Remediation commit contained in `main` or Stage 4 | No                                         |

Stage 4 commits after the baseline, oldest first: `85c6011` `checkpoint before checking out main` (governance documents only); `0c6778d` `feat(fiv-conn-04-d): complete Stage 4 integrated delivery`; `74df6d9` `docs(fiv-conn-04-d): reconcile Stage 4 governance hash references`; `388fa1c` `docs(fiv-conn-04-d): clarify ratified closure tense`.

---

## C. Evidence reviewed

Repository evidence:

- `git diff e6b839e..8177f3a` and `git diff 8177f3a..798b774`.
- `git merge-base` and `git rev-list --count` among `main`, the baseline, Stage 4, and the remediation commits.
- `git merge-tree --write-tree` of `main` with the remediation tip, and of Stage 4 with both `8177f3a` and the tip. These commands write a temporary tree object. They do not create a commit, do not touch a branch, and were not checked out. Exit status 0 means Git reported no textual conflict. It does not mean the result was compiled or tested.
- Constructor and seam-spec regions of those temporary trees, compared with Stage 4 HEAD.

Documents:

- `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-remediation-verification-record.md` (`TVER-CONN04-VMP1-SR-REMEDIATION-2026-11-09`), on the remediation commit.
- `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-remediation-owner-acceptance.md` (`ACCEPT-CONN04-VMP1-SR-REMEDIATION-2026-11-09`), status `ACCEPTED — OWNER-LED TECHNICAL ACCEPTANCE`.
- `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-sr-remediated-baseline.md` (`D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED`).
- `docs/project/version-3/wave-6/wave-6-po-decision-register.md` as it exists on `main` at `686627c`, entries for `D-CONN04-FULL-D-IA-VMP-BASELINE` and the register STOP line.
- `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-4-formal-closure-po-ratification-act.md` as it exists on Stage 4 at `388fa1c` (`D-CONN04-FULL-D-IA-S4-CLOSE`). That act is not the Decision Register on `main`.

---

## D. Findings

### D.1 Documented facts

`8177f3a` changes six paths relative to `e6b839e` (+487 / −2):

| Finding | Change                                                                                                                                                                                                                                                                                                      |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SR-001  | `fiv-conn-04-d-system-job-migration-entry.ts` adds `@Inject` on the boundary, write-unit, and transaction constructor parameters. The port parameter was already injected. A Nest testing-module case was added in `fiv-conn-04-d-vault-metadata-entry-seam.spec.ts`. It does not boot `ConnectionsModule`. |
| SR-002  | `fiv-conn-04-d-vault-metadata.service.spec.ts` spies on `findMetadataByIdAndWorkspaceId` and asserts that `findBySlot`, `listByWorkspaceId`, `compareAndSet`, and `deleteIfRevision` are not called for that lookup.                                                                                        |
| SR-003  | `fiv-conn-04-d-vault-metadata.service.ts` returns frozen `{ ok: false, reason: 'NOT_FOUND' }` when a well-formed row's `id` or `workspaceId` is not the requested pair. No new reason string. Port IA text was not edited.                                                                                  |
| SR-004  | The service spec adds cases for an invalid returned state, a blank returned id, a valid `Revoked` success view, and the mismatched-identity `NOT_FOUND` path.                                                                                                                                               |

`798b774` adds only the remediated baseline record.

The verification record's disposition is `TECHNICAL REMEDIATION VERIFIED WITH LIMITATIONS`. Its limitations include no `ConnectionsModule` boot, no `design:paramtypes` emission under the test runner, and no rerun of the suite by the verification record itself. The owner-acceptance record is owner-led technical acceptance. It states that independent review and reviewer sign-off were not recorded.

On `main`, the Decision Register records `D-CONN04-FULL-D-IA-VMP-BASELINE` as accepting commit `e6b839e` and tree `1ab2c560` only. It records the implementation commit as not published, the ratification date as not set, and Stage 4 as not authorized. The register on `main` does not mention `8177f3a`, `798b774`, or `D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED`.

On the Stage 4 branch, the formal-closure ratification says Stage 4 PS-A is closed, Stage 5 and later are not authorized, cherry-pick and main integration are not authorized, and the act does not authorize Git operations. The same act says the Decision Register lags and that synchronizing it is not authorized. That closure is a document on the Stage 4 branch. It is not an entry in the `main` register read above. This assessment does not adopt it as a change to the register, and it does not authorize Stage 4.

### D.2 Technical observations

Relative to an adapter that already returns only the requested pair, SR-003 does not change the success path. The Prisma and in-memory repositories on the baseline already filter by both keys, and the remediation does not edit them. The new branch is fail-closed behavior for a well-formed row that names another id or workspace. `@Inject` does not change the method contract. It makes the existing constructor resolvable when Nest cannot read emitted parameter types. The tests are additive.

`main` does not contain the metadata service or the migration entry. A textually clean merge of the remediation tip into `main` (`merge-tree` tree `5a166626d18a8e25dead1d3427d150f90d4036c7`) would add the whole VMP-1 surface, not the four-file hardening alone: the port, module, service, seam spec, module wiring, repository projection edits, lifecycle spec edits, and the three remediation documents. It would not add the Stage 4 occupancy files. The other side of the divergence is 51 `main` commits that the remediation branch does not contain, including debt closures and Stage 4 design documents that landed on `main` after `a59c533`.

Stage 4 already contains `e6b839e`. After that commit it edits `fiv-conn-04-d-system-job-migration-entry.ts` (+219 / −2 in the combined Stage 4 diff), including a Stage 4 attempt path that calls `lookupVaultMetadataForConnection`, and a fifth constructor parameter, `prisma: PrismaService`, without `@Inject`. The seam spec's `new Conn04SystemJobMigrationEntry(...)` gains a fifth mock argument. A textually clean merge of the remediation tip into Stage 4 (`merge-tree` tree `6114e6d9c75c3b901e4751d062221dfd77c0da2a`) keeps the `@Inject` decorators, the fifth `prisma` parameter, the fifth mock argument, the identity check, and the SR-001 Nest describe block. That merge was not compiled and not executed.

The SR-001 Nest test was written against the four-parameter constructor on the remediation branch. Stage 4's fifth parameter has no `@Inject`. Combining them can leave that Nest case unable to resolve `PrismaService` under a runner that does not emit `design:paramtypes`. That is an unverified integration risk, not a demonstrated failure.

### D.3 Architectural implications

The remediated commit is a hardening of the accepted VMP-1 seam. Stage 4 is the only inspected line that both contains that seam and calls it from a later attempt path. `main` is a different line: integrating the remediation branch there publishes VMP-1 onto `main` for the first time.

Keeping the branch independent preserves `e6b839e` as the register's accepted baseline and `8177f3a` / `798b774` as a separately named, owner-accepted successor. Future implementation that starts from `e6b839e` without the remediation will lack the identity check and the Nest `@Inject` annotations.

### D.4 What this record does not treat as approval

Owner acceptance does not approve publication to `main`, does not approve editing the Stage 4 branch, and does not ratify the `NOT_FOUND` mapping as a Port IA change. The Stage 4 closure act on that branch does not authorize this remediation's integration. The clean `merge-tree` results are not an integration.

---

## E. Options

### Option A — Keep the remediation as an independent baseline

**Benefits.** The branch already records scope, verification limits, owner acceptance, and the successor baseline id. `e6b839e` stays the register's accepted commit. No unrelated `main` history and no Stage 4 attempt code are mixed into that baseline. Traceability stays one parent link: `798b774` → `8177f3a` → `e6b839e`.

**Risks.** A later Stage 4 or `main` line that starts from `e6b839e` and ignores this branch will ship the unhardened service and the undecorated constructor. Two accepted baselines now exist, and the Decision Register names only the older one. The remote remediation branch makes `e6b839e` reachable from `origin` without putting it on `origin/main`. The register still says the implementation commit was not published; this assessment does not rewrite that entry.

**Technical consequences.** None now. The four source and test files stay on this branch.

**Governance consequences.** No register update, no Port IA change, no Stage 4 status change.

**Required approvals.** None to leave the branch as it is. Any later move needs a new Project Owner decision.

**Recommended timing.** Now. This is the current disposition until the owner chooses an integration target.

### Option B — Merge the remediation into `main`

**Benefits.** One published line would carry the hardened port. A textual merge of the tip into current `main` reported no conflicts.

**Risks.** The merge publishes all of VMP-1, which the register accepts as a baseline and records as not published. It also joins 51 unrelated `main` commits. The register's Stage 4 status remains not authorized; publishing the seam does not by itself authorize the Stage 4 loop, but it places the seam on the primary branch the loop is not authorized to use. The merge was not built or tested. Owner acceptance does not name `main` as a target.

**Technical consequences.** `main` would gain the port module, the service and its spec, the entry seam, repository projection changes, `connections.module.ts` wiring, and the three remediation documents. It would not gain Stage 4 occupancy or the Stage 4 attempt.

**Governance consequences.** Contradicts the register statement that publication was not performed, unless the owner explicitly supersedes that statement. Requires a register update the Stage 4 closure act, on its own branch, says is not authorized by that act. This assessment does not treat that act as governing `main`, and it also does not treat it as permission to publish.

**Required approvals.** A Project Owner decision that explicitly publishes `e6b839e` plus `8177f3a` onto `main`, plus whatever review the owner requires. Independent review is still absent. Port IA was not re-ratified for the identity mapping.

**Recommended timing.** Not now.

### Option C — Integrate the remediation into the Stage 4 branch

**Benefits.** Stage 4 already contains VMP-1, so the integration delta is the remediation rather than the whole port. The simulated merge keeps both the Stage 4 attempt and the hardening. Honest repository rows still take the same success path; the identity check matters if a returned row names another pair. Stage 4 is the caller that would actually exercise `lookupVaultMetadataForConnection` inside an attempt.

**Risks.** Stage 4 HEAD is a closed-delivery line on its own documents, and the `main` register still says Stage 4 is not authorized. The closure act says that act does not authorize Git operations and that cherry-pick onto `main` is not authorized. Integrating here edits a line those documents treat as closed, including behavior of the attempt's metadata lookup. The SR-001 Nest test and the fifth constructor parameter were not compiled together. A clean textual merge can still fail that test. The seam spec and the entry file are shared edit sites; the simulation merged them, and nobody has rerun Stage 4's attempt specs against the identity check.

**Technical consequences.** Stage 4 would gain `@Inject` on the first three parameters, the `NOT_FOUND` identity branch, the added tests, and the remediation records. The fifth `prisma` parameter and the Stage 4 attempt would remain. The Nest case may need a further `@Inject(PrismaService)` or an explicit provider before it is meaningful on that branch. That further edit is not authorized by this assessment.

**Governance consequences.** Changes a Stage 4 tree without a new authorization. Does not put the result on `main`. Does not update the register. Could be read, incorrectly, as reopening Stage 4. This assessment does not authorize that reading.

**Required approvals.** A Project Owner decision that names the Stage 4 branch as the target and states whether the closed Stage 4 PS-A tree may change. Then a fresh verification of the merged entry, the seam spec, and the Stage 4 attempt specs. Independent review remains a separate, still absent, gate if the owner requires it.

**Recommended timing.** Not now. If the owner later authorizes a target that already contains `e6b839e`, this is the technically coherent existing line, subject to the test gap above.

### Option D — Defer integration to a future descendant of `e6b839e`

The repository supports this only as a later variant of A, not as a branch that exists today. A future owner-authorized line that already contains `e6b839e` can take `8177f3a` without also taking `main`'s 51 commits. The Stage 4 branch is one such descendant, and Option C is that choice applied now. No other current branch was found that both contains the VMP-1 port and is a documented integration target. Creating a new integration branch is not authorized here.

**Benefits.** Avoids publishing VMP-1 to `main` and avoids editing the current Stage 4 tip.

**Risks.** Same drift risk as Option A until the owner names the descendant.

**Required approvals.** A later Project Owner decision that names the base commit and the target branch.

**Recommended timing.** Only after that decision. Not a substitute for keeping the current baseline intact.

---

## F. Recommendation

**Option A.** Leave `remediation/vmp-1-self-review` at `798b774f7a32b8eb70c3af07a851d43996bae5a0` as the independent remediated baseline `D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED`.

Option B is not preferred because `main` does not contain VMP-1. Merging this branch publishes the original baseline plus the remediation and joins 51 unrelated commits. The Decision Register on `main` still records that baseline as unpublished and Stage 4 as not authorized.

Option C is not preferred now because the register on `main` does not authorize Stage 4, the Stage 4 branch's own closure act does not authorize Git operations, and the textual merge leaves an unverified interaction between the new Nest test and Stage 4's fifth constructor parameter. Option C is the least surprising later target if the owner separately authorizes a change to a descendant of `e6b839e`.

Option D names that later decision. It is not a branch to create in this task.

Before any integration: the Project Owner selects the target in writing; the identity-check mapping stays an implementation choice unless the owner asks to amend the Port IA; the merged tree is built and the affected Vitest files are run, including Stage 4 attempt specs if the target contains them; the Decision Register is updated only under a separate authorization. A pull request is not required by the records reviewed here, and it is not useful while the recommended disposition is to integrate nothing. A pull request would become a review vehicle only after the owner names a target. This task does not open one.

---

## G. Unresolved questions

1. Does the Project Owner want `D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED` recorded in the Decision Register, or should the register continue to name only `e6b839e`?
2. If a later target is authorized, is it the current Stage 4 tip, a new descendant of `e6b839e`, or `main` together with an explicit publication decision?
3. Is the `NOT_FOUND` result for a mismatched well-formed row acceptable as an implementation choice, or does the owner want a Port IA amendment before any integration?
4. Does the owner require independent review before any integration? None is recorded.
5. The Stage 4 branch contains a closure ratification that the `main` register does not. Which of those statuses the owner treats as current is not decided here.

---

## H. Project Owner decision required

The owner decides whether the remediated baseline remains independent, or whether a named integration into `main`, into `impl/fiv-conn-04-d-stage-4`, or into another descendant of `e6b839e` is authorized.

This record recommends Option A. It does not make that decision. It does not authorize Stage 4 coding or Stage 4 execution. It does not ratify the Port IA. It does not claim independent review.

---

## I. Limitations

- Merge results are `git merge-tree` tree ids only. They were not checked out, compiled, linted, or tested.
- No test command was run for this assessment. Prior verification limits in `TVER-CONN04-VMP1-SR-REMEDIATION-2026-11-09` still apply, including no `ConnectionsModule` boot.
- The Decision Register was read from `main` at `686627c`. The Stage 4 closure act was read from Stage 4 at `388fa1c`. Divergence between those documents is reported, not resolved.
- Primary `main` and the Stage 4 worktree were not edited. Their uncommitted worktree contents were not part of this comparison; the comparison used the commits above.
- Reachability of `e6b839e` from `origin/remediation/vmp-1-self-review` is a consequence of the earlier push of this branch. This assessment did not push.

---

## J. What was not done

No pull request. No merge. No cherry-pick. No rebase. No reset. No branch switch. No push. No source or test edit. No edit to `main`, to `baseline/vmp-1-runtime`, or to `impl/fiv-conn-04-d-stage-4`. No Stage 4 execution. No Port IA ratification. No authorization decision. No Decision Register edit.

This file was prepared untracked. The finalization commit records this file only. This file does not embed that commit's SHA. That commit does not push the branch and does not integrate the remediation.
