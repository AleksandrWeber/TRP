# FIV-CONN-04-D — Remediated Baseline Register Update Proposal

```text
REGISTER UPDATE PROPOSAL — NOT APPLIED
RECORD ID: PROP-CONN04-VMP1-REGISTER-UPDATE-R2-2026-11
DATE: 2026-11-11
AUTHORITY FOR THE TEXT: PO-CONN04-VMP1-REGISTER-R2-2026-11
DECISION REGISTER: NOT EDITED
STAGE 4: NOT AUTHORIZED
```

**Document:** Exact proposed insertion for a later Decision Register edit  
**Record ID:** **`PROP-CONN04-VMP1-REGISTER-UPDATE-R2-2026-11`**  
**Date:** 2026-11-11  
**Status:** **PROPOSAL ONLY — NOT APPLIED**

This file does not embed its own SHA-256. It is not a patch applied to any worktree.

No established Decision Register editing mechanism was found beyond direct editing of the register markdown. This proposal stays in the remediation worktree. It does not create a register commit, a worktree, or a branch.

---

## A. Target

| Field                   | Value                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| File                    | `docs/project/version-3/wave-6/wave-6-po-decision-register.md`                                                                   |
| Repository of that file | Primary `main` worktree `/Users/oleksandrsvacko/Desktop/myProjects/trp`                                                          |
| Committed register      | `686627cb820a6994951cc6d1cbd4ab2b7c6ae4ed`                                                                                       |
| Worktree state          | The same path is already modified and uncommitted. This proposal does not include those modifications and does not discard them. |

Do not apply this text to the dirty worktree until the owner has separated this insertion from the existing uncommitted register edit.

---

## B. What must not change

Leave these untouched:

- The summary-table row for `D-CONN04-FULL-D-IA-VMP-BASELINE`, including commit `e6b839e0e7d75322d9626162712fa81f61147d18` and tree `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2`.
- The detail section `### D-CONN04-FULL-D-IA-VMP-BASELINE — FIV-CONN-04-D VMP-1 Implementation Baseline Acceptance`, including its table, the "Accepts only" paragraph, and the "Does not authorize" paragraph.
- Any uncommitted "Later related decision" paragraph already present in the dirty worktree.
- Every Stage 4 section already present in the dirty worktree.

---

## C. Insertion 1 — summary row

Insert one new table row immediately after the existing summary row whose first cell is `FIV-CONN-04-D VMP-1 Implementation Baseline Acceptance (D-CONN04-FULL-D-IA-VMP-BASELINE)`. In commit `686627c` that row is the register line that cites acceptance of `e6b839e`. Do not edit that row.

Proposed row:

`| FIV-CONN-04-D VMP-1 Remediated Baseline Successor Supplement (D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED) | **RECORDED — SUCCESSOR SUPPLEMENT — NOT A REPLACEMENT** (2026-11-11) ([v3-l02-fiv-conn-04-d-vmp-1-remediated-baseline-register-decision.md](./v3-l02-fiv-conn-04-d-vmp-1-remediated-baseline-register-decision.md)); decision PO-CONN04-VMP1-REGISTER-R2-2026-11; original baseline D-CONN04-FULL-D-IA-VMP-BASELINE remains commit e6b839e0e7d75322d9626162712fa81f61147d18, tree 1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2; successor remediation commit 8177f3a80a879bc603f6e22d192752013501a476, tree 7df527b7d5ab19379aca76f53b4ee8a7a7ddf12c; record commit 798b774f7a32b8eb70c3af07a851d43996bae5a0; owner-led technical acceptance ACCEPT-CONN04-VMP1-SR-REMEDIATION-2026-11-09 only; verification TVER-CONN04-VMP1-SR-REMEDIATION-2026-11-09; integration assessment ASSESS-CONN04-VMP1-SR-INTEGRATION-2026-11 accepted by PO-CONN04-VMP1-SR-INTEGRATION-ACCEPT-2026-11 as Option A, independent baseline, no code integration; independent review **NOT PERFORMED**; independent approval **NOT CLAIMED**; Port IA **NOT RE-RATIFIED** and **NOT AMENDED**; publication to main **NOT PERFORMED** and **NOT AUTHORIZED**; Stage 4 **NOT AUTHORIZED** |`

---

## D. Insertion 2 — status narrative

Immediately after the existing narrative sentence that records `D-CONN04-FULL-D-IA-VMP-BASELINE` and says Stage 4 remains not authorized, add this paragraph. Do not change that existing sentence.

`D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED` is **RECORDED — SUCCESSOR SUPPLEMENT — NOT A REPLACEMENT** (2026-11-11) under `PO-CONN04-VMP1-REGISTER-R2-2026-11`. It does not replace `D-CONN04-FULL-D-IA-VMP-BASELINE`, commit `e6b839e0e7d75322d9626162712fa81f61147d18`, or tree `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2`. Remediation commit `8177f3a80a879bc603f6e22d192752013501a476`, tree `7df527b7d5ab19379aca76f53b4ee8a7a7ddf12c`. Record commit `798b774f7a32b8eb70c3af07a851d43996bae5a0`. Acceptance `ACCEPT-CONN04-VMP1-SR-REMEDIATION-2026-11-09` is owner-led technical acceptance only. Verification is `TVER-CONN04-VMP1-SR-REMEDIATION-2026-11-09`. `ASSESS-CONN04-VMP1-SR-INTEGRATION-2026-11` is accepted by `PO-CONN04-VMP1-SR-INTEGRATION-ACCEPT-2026-11` as Option A. Independent review is **NOT PERFORMED**. Independent approval is **NOT CLAIMED**. The Port IA is **NOT RE-RATIFIED** and **NOT AMENDED**. Publication to `main` is **NOT PERFORMED** and **NOT AUTHORIZED**. Stage 4 remains **NOT AUTHORIZED**.

---

## E. Insertion 3 — detail section

Insert the following section immediately after the closing `---` of `### D-CONN04-FULL-D-IA-VMP-BASELINE` and before the next `###` heading.

In commit `686627c` the next heading is `### S-05 — Option B Refinement`.

In the dirty primary worktree the next heading is `### D-CONN04-FULL-D-IA-S4 — FIV-CONN-04-D Stage 4 Implementation Authorization`, because uncommitted text already sits between the baseline and `S-05`. Use the same anchor there: after the baseline section's closing `---`, before that next heading. Do not move or rewrite the Stage 4 sections.

```markdown
### D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED — FIV-CONN-04-D VMP-1 Remediated Baseline Successor Supplement

| Field                        | Content                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **STATUS**                   | **RECORDED — SUCCESSOR SUPPLEMENT — NOT A REPLACEMENT**                                                             |
| **Authority**                | Product Owner. Decision `PO-CONN04-VMP1-REGISTER-R2-2026-11` (2026-11-11). No signature is recorded.                |
| **Decision ID**              | **D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED**                                                                          |
| **Relation**                 | Successor supplement to **D-CONN04-FULL-D-IA-VMP-BASELINE**. Does not replace it.                                   |
| **Original baseline commit** | `e6b839e0e7d75322d9626162712fa81f61147d18` remains the accepted VMP-1 baseline commit                               |
| **Original baseline tree**   | `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2` remains the accepted VMP-1 baseline tree                                 |
| **Remediation commit**       | `8177f3a80a879bc603f6e22d192752013501a476`                                                                          |
| **Remediation tree**         | `7df527b7d5ab19379aca76f53b4ee8a7a7ddf12c`                                                                          |
| **Record commit**            | `798b774f7a32b8eb70c3af07a851d43996bae5a0`                                                                          |
| **Owner acceptance**         | `ACCEPT-CONN04-VMP1-SR-REMEDIATION-2026-11-09` — owner-led technical acceptance of SR-001 through SR-004 only       |
| **Verification**             | `TVER-CONN04-VMP1-SR-REMEDIATION-2026-11-09`                                                                        |
| **Integration assessment**   | `ASSESS-CONN04-VMP1-SR-INTEGRATION-2026-11`, accepted by `PO-CONN04-VMP1-SR-INTEGRATION-ACCEPT-2026-11` as Option A |
| **Integration**              | Independent baseline. Code integration **NOT AUTHORIZED** by that acceptance                                        |
| **Independent review**       | **NOT PERFORMED**                                                                                                   |
| **Independent approval**     | **NOT CLAIMED**                                                                                                     |
| **Port IA**                  | **NOT RE-RATIFIED**. **NOT AMENDED**. Historical `D-CONN04-FULL-D-IA-VMP` is unchanged                              |
| **Publication to `main`**    | **NOT PERFORMED** and **NOT AUTHORIZED**                                                                            |
| **Stage 4**                  | **NOT AUTHORIZED**                                                                                                  |
| **Class**                    | GOVERNANCE / PO — successor index entry only                                                                        |

**Records only:** a successor supplement. It does not replace commit `e6b839e0e7d75322d9626162712fa81f61147d18` or tree `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2`.

**Does not authorize:** independent review; independent approval; Port IA ratification or amendment; publication, merge, or cherry-pick onto `main`; Stage 4 coding; Stage 4 execution.
```

---

## F. Link limitation

The relative links above point at files in the same `wave-6` directory. Those decision files are not in `main` commit `686627c`. They exist as untracked files on `remediation/vmp-1-self-review`. Applying the register text on `main` before those files are present on that tree leaves the links unresolved.

---

## G. What was not done

The Decision Register was not edited. `main` was not modified. No register commit was created. No merge was performed. Stage 4 was not authorized.
