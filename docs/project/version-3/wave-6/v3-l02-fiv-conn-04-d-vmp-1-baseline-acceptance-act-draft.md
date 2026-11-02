# FIV-CONN-04-D — VMP-1 Implementation Baseline Acceptance Act

## Draft for Product Owner review

```text
DOCUMENT STATUS: DRAFT — NOT RATIFIED — NOT ACCEPTED
PROPOSED DECISION ID: D-CONN04-FULL-D-IA-VMP-BASELINE
ID STATUS: PROPOSED — NOT RATIFIED
THIS DRAFT IS NOT A PRODUCT OWNER DECISION
THIS DRAFT DOES NOT ACCEPT THE BASELINE
THIS DRAFT DOES NOT UPDATE THE DECISION REGISTER
THIS DRAFT DOES NOT PUBLISH THE CANDIDATE COMMIT
THIS DRAFT DOES NOT AUTHORIZE STAGE 4
NO SIGNATURE IS RECORDED
DECISION DATE: NOT SET
```

**Document:** Draft Product Owner act that would, if later explicitly ratified, accept one exact Git tree as the VMP-1 Vault Metadata Port implementation baseline  
**Draft preparation date:** 2026-11-02  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Proposed decision / act ID:** **`D-CONN04-FULL-D-IA-VMP-BASELINE`** — **PROPOSED — NOT RATIFIED**  
**Status:** **DRAFT — NOT RATIFIED — NOT ACCEPTED**  
**Nature:** **GOVERNANCE DRAFT ONLY.** Prepared for Product Owner review. It does not ratify, accept, publish, or register anything. It does not authorize Stage 4 implementation or execution. It does not modify the Port IA, Successor-01, the published VMP-1 closure, the Decision Register, or the candidate commit.

The proposed identifier is not an established Register ID. It is offered only so a later ratification can name this draft. It is not `D-CONN04-FULL-D-IA-S4`, `D-CONN04-FULL-D-IA-S4-EXEC`, or `D-CONN04-FULL-D-IA-S4-VMP1-BASELINE-ACCEPT`. Those identifiers are not published in the Decision Register at the governance HEAD below.

An older untracked file, `v3-l02-fiv-conn-04-d-vmp-1-baseline-po-acceptance.md`, claims acceptance under `D-CONN04-FULL-D-IA-S4-VMP1-BASELINE-ACCEPT`. That file is not this draft. It is not published authority. This draft does not edit it and does not adopt it.

---

## 1. Decision purpose

If the Product Owner later ratifies this draft without amendment, the only effect would be to identify and accept the exact implementation tree named in §2 as the discrete **VMP-1 Vault Metadata Port implementation baseline**.

That acceptance would not move the commit onto `origin/main`. It would not close or reopen VMP-1. Published closure `D-CONN04-FULL-D-IA-VMP-CLOSE` would remain the closure. This draft does not treat closure, or the ratified Port IA, as implementation-baseline acceptance.

---

## 2. Exact baseline identity

| Field | Value |
| --- | --- |
| Candidate commit | `e6b839e0e7d75322d9626162712fa81f61147d18` |
| Candidate tree | `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2` |
| Parent | `a59c533977923a45413a176ad143325a948feeb8` |
| Subject | `feat(fiv-conn-04-d): add isolated Vault metadata port (VMP-1)` |
| Published governance HEAD | `aa9ced2effc017b0c38f44e874dae5513257a89f` |
| `origin/main` | `aa9ced2effc017b0c38f44e874dae5513257a89f` |
| Candidate on `origin/main` | **No.** The parent is an ancestor of `origin/main`. The candidate is not. |
| Local ref pointing at the candidate | `refs/heads/baseline/vmp-1-runtime` |
| Remote baseline ref | **None** (`origin/baseline/vmp-1-runtime` is absent) |

No other commit is substituted.

---

## 3. Evidence references

| Evidence | Reference |
| --- | --- |
| Ratified Port IA | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vault-metadata-port-implementation-authorization-draft.md` |
| Port IA SHA-256 on `origin/main` | `18e177ef154b8a35dc333faefa05c73729150c3822e78818fdc85bfe45db89e6` |
| Port IA decision | `D-CONN04-FULL-D-IA-VMP` — published Register: **APPROVED / RATIFIED** for VMP-1, later **FORMALLY CLOSED** |
| Successor-01 | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-final-candidate-successor-01.md` — **§2** and **§7 Ratified Decision 5** |
| Successor-01 decision | `D-CONN04-PO-VAULT-B-IA-AMD-S01` |
| Published VMP-1 closure | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-po-closure-decision.md` — `D-CONN04-FULL-D-IA-VMP-CLOSE` |
| Published implementation evidence | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-implementation-evidence.md` |
| Decision Register | `docs/project/version-3/wave-6/wave-6-po-decision-register.md` at `aa9ced2effc017b0c38f44e874dae5513257a89f` |
| Forensic review | Read-only review of `e6b839e0…` against parent `a59c533…`, verdict **PASS WITH CONDITIONS** |
| Test log | `/tmp/trp-vmp1-vitest-output.txt` — SHA-256 `99508bbdbd95491099f35d44cf3a0f52f6801bd071134c3a8e952d26c587d780` — 10,447 bytes. This log is outside the repository and is not a committed artifact. |

The published evidence file records HEAD `a59c533977923a45413a176ad143325a948feeb8` and states that staging, commit, and push were not performed. It does not cite `e6b839e0…`.

---

## 4. Forensic review findings

Verdict recorded from the completed review: **PASS WITH CONDITIONS**.

The diff of `a59c533977923a45413a176ad143325a948feeb8`..`e6b839e0e7d75322d9626162712fa81f61147d18` is 13 files, 805 insertions, 9 deletions, and no file deletions:

1. `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.port.ts` — added
2. `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.service.ts` — added
3. `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.module.ts` — added
4. `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.service.spec.ts` — added
5. `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.module.spec.ts` — added
6. `apps/api/src/modules/secret-vault/secret-vault.repository.ts` — modified
7. `apps/api/src/modules/secret-vault/prisma-secret-vault.repository.ts` — modified
8. `apps/api/src/modules/secret-vault/in-memory-secret-vault.repository.ts` — modified
9. `apps/api/src/modules/secret-vault/secret-vault.lifecycle.spec.ts` — modified
10. `apps/api/src/modules/connections/connections.module.ts` — modified
11. `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts` — modified
12. `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.spec.ts` — modified
13. `apps/api/src/modules/connections/fiv-conn-04-d-vault-metadata-entry-seam.spec.ts` — added

Source-level reading matched the ratified Port IA inventory in **§7.1** and **§7.2**, including `lookupExact`, blank-ID failure before port and repository metadata I/O, a four-field select, export of the port token only from the metadata module, and no re-export from `ConnectionsModule`. Successor-01 **§7** is the blank-ID and no-human-`list` rule for the D Entry path.

The review found no source defect that requires remediation before this baseline can be presented for acceptance review.

The candidate diff does not add Stage 4 orchestration. It does not add `classifyFivConn04LiveConnection`, an occupancy resolver, `runEnvironmentBackfill`, a `Connection.environment` write, or new B-04 write authority. Pre-existing Stage 3 write-unit methods remain in the Entry file and are not extended by this diff.

Conditions that remain attached to that verdict are restated in §6. They are not removed by this draft.

---

## 5. Executed test evidence

The five existing suites were executed against tree `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2`, not against the dirty `main` worktree. The tree was exported with `git archive` to `/tmp/trp-vmp1-e6b839-test`. The branch was not switched. A Git worktree was not created. The repository index and worktree were unchanged after the run.

| Field | Value |
| --- | --- |
| Runner | Vitest 4.1.12 (`apps/api` script `vitest run`) |
| Exit code | **0** |
| Test files | **5 passed (5)** |
| Tests | **52 passed, 0 failed, 0 skipped** |

| Suite | Passed |
| --- | ---: |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.service.spec.ts` | 6 |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.module.spec.ts` | 3 |
| `apps/api/src/modules/connections/fiv-conn-04-d-vault-metadata-entry-seam.spec.ts` | 7 |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.spec.ts` | 18 |
| `apps/api/src/modules/secret-vault/secret-vault.lifecycle.spec.ts` | 18 |

This is not full repository coverage. It is not a CI PASS. Test execution does not constitute baseline acceptance.

---

## 6. Evidence limitations

These limitations stay in force even if this draft is later ratified:

1. The candidate commit is not on `origin/main`.
2. Published `v3-l02-fiv-conn-04-d-vmp-1-implementation-evidence.md` does not cite `e6b839e0…`.
3. The test result covers only the five suites in §5.
4. The lifecycle suite shows that the file still runs with the expanded repository interface. It does not directly assert forwarding of `findMetadataByIdAndWorkspaceId`.
5. The in-memory repository method scans stored records for an exact id and workspace match. That is test-double parity, not `SecretVaultService.list`. The production Prisma path uses a compound `where` and a four-field `select`.
6. Non-blank identifiers that are otherwise unvalidated still reach the repository and return `NOT_FOUND` when absent. Blank, empty, and whitespace identifiers fail before I/O.
7. Baseline acceptance and publication are different acts. Ratification of this draft, if it happens, would still not publish, merge, or push the commit.
8. The test log named in §3 is outside the Git repository.

---

## 7. Exact acceptance scope

Proposed scope, and only this scope:

**VMP-1 Vault Metadata Port implementation baseline** — the tree `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2` at commit `e6b839e0e7d75322d9626162712fa81f61147d18`.

The proposed acceptance identifies that tree as a discrete implementation baseline for the already closed VMP-1 port package, subject to §4, §5, and §6.

---

## 8. Exclusions and STOP conditions

This draft, and any later ratification that adopts it without amendment, does not:

- authorize Stage 4 implementation;
- authorize Stage 4 execution;
- grant new B-04 write authority;
- authorize `Connection.environment` UPDATE;
- authorize Full-D backfill or `runEnvironmentBackfill`;
- authorize FIV-CONN-04-E;
- authorize Stages 5–8;
- authorize production deployment, live capital, or production operations;
- accept or close F-OBS-04, S3-OBS-01, or F-OBS-01;
- ratify an execution act;
- modify the Port IA bytes or Successor-01;
- modify `D-CONN04-FULL-D-IA-VMP` or `D-CONN04-FULL-D-IA-VMP-CLOSE`;
- update the Decision Register;
- merge, cherry-pick, or push the candidate;
- treat local `impl/fiv-conn-04-d-stage-4` as authorized delivery.

**STOP.** Do not code Stage 4 from this draft. Do not infer Stage 4 authority from baseline acceptance. Do not treat the published Port contract or VMP-1 closure as this acceptance. Do not publish the candidate until a separate publication authorization names the exact commit.

---

## 9. Proposed Product Owner decision wording

The following block is **proposed wording only**. It is not a decision. It becomes effective only if the Product Owner explicitly ratifies this draft in a separate act and does not amend the wording.

```text
PROPOSED — NOT RATIFIED

If ratified without amendment, the Product Owner would accept
commit e6b839e0e7d75322d9626162712fa81f61147d18
tree  1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2
parent a59c533977923a45413a176ad143325a948feeb8
as the VMP-1 Vault Metadata Port implementation baseline only.

That acceptance would not publish the commit.
That acceptance would not authorize Stage 4.
That acceptance would not change the Decision Register by itself.
Register publication would remain a separate authorization.
```

No signature, decision date, or approval status is recorded in this file.

---

## 10. Ratification and publication status

| Item | Status in this draft |
| --- | --- |
| This file | **DRAFT — NOT RATIFIED — NOT ACCEPTED** |
| Proposed ID `D-CONN04-FULL-D-IA-VMP-BASELINE` | **PROPOSED — NOT RATIFIED** |
| Baseline `e6b839e0…` | **NOT PO-ACCEPTED** by this draft |
| Publication to `origin/main` | **NOT AUTHORIZED** and **NOT PERFORMED** |
| Decision Register | **NOT MODIFIED** |
| Stage 4 | **NOT AUTHORIZED** |

---

## 11. Consequences and next governance steps

Until a separate Product Owner ratification:

- the candidate remains an unpublished local commit;
- VMP-1 remains formally closed under `D-CONN04-FULL-D-IA-VMP-CLOSE`;
- Stage 4 remains **NOT AUTHORIZED**;
- no implementation work starts from this draft.

If the Product Owner ratifies this draft later, the next governance steps would still be separate: a Register publication authorization, and any later Stage 4 authorization. Neither is requested or granted here.

The next safe action is Product Owner review of this draft and an explicit ratification decision: ratify without amendment, amend, or reject. Preparation of this file is not that decision.

---

_End of draft. DRAFT — NOT RATIFIED — NOT ACCEPTED. Proposed ID `D-CONN04-FULL-D-IA-VMP-BASELINE` is PROPOSED — NOT RATIFIED. The commit `e6b839e0e7d75322d9626162712fa81f61147d18` is not accepted by this file. Stage 4 remains NOT AUTHORIZED._
