# FIV-CONN-04-D — Remediated Baseline Register Decision

```text
PROJECT OWNER DECISION
DECISION ID: PO-CONN04-VMP1-REGISTER-R2-2026-11
DATE: 2026-11-11
STATUS: DECIDED — R2 — SUCCESSOR SUPPLEMENT
AUTHORITY: PROJECT OWNER
INDEPENDENT REVIEW: NOT PERFORMED
INDEPENDENT APPROVAL: NOT CLAIMED
PORT IA RATIFICATION: NOT PERFORMED
PUBLICATION TO MAIN: NOT AUTHORIZED
STAGE 4: NOT AUTHORIZED
DECISION REGISTER EDIT: NOT PERFORMED
```

**Document:** Project Owner decision to reference the remediated baseline as a successor supplement  
**Decision ID:** **`PO-CONN04-VMP1-REGISTER-R2-2026-11`**  
**Date:** 2026-11-11  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Status:** **`DECIDED — R2 — SUCCESSOR SUPPLEMENT`**

The date is the date of the Project Owner instruction in this conversation. No signature is recorded.

This file does not embed its own SHA-256. That value is measured after the file is written.

---

## A. Context and evidence

The committed Decision Register on `main` at `686627cb820a6994951cc6d1cbd4ab2b7c6ae4ed` records `D-CONN04-FULL-D-IA-VMP-BASELINE` as **RATIFY — VMP-1 IMPLEMENTATION BASELINE ACCEPTED**, ratification date **NOT SET**, for commit `e6b839e0e7d75322d9626162712fa81f61147d18` and tree `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2`. That entry says the implementation commit is not published and Stage 4 is not authorized.

`PROP-CONN04-VMP1-REGISTER-REMEDIATED-2026-11` set out R1, R2, and R3. Its recommendation was non-binding. The Project Owner has now selected R2.

| Record                                         | Role                                                                                                                                                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `D-CONN04-FULL-D-IA-VMP-BASELINE`              | Original baseline. Unchanged by this decision.                                                                                                                                                  |
| `D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED`       | Successor supplement. Remediation commit `8177f3a80a879bc603f6e22d192752013501a476`, tree `7df527b7d5ab19379aca76f53b4ee8a7a7ddf12c`. Record commit `798b774f7a32b8eb70c3af07a851d43996bae5a0`. |
| `ACCEPT-CONN04-VMP1-SR-REMEDIATION-2026-11-09` | Owner-led technical acceptance of SR-001 through SR-004.                                                                                                                                        |
| `TVER-CONN04-VMP1-SR-REMEDIATION-2026-11-09`   | Technical verification with limitations.                                                                                                                                                        |
| `ASSESS-CONN04-VMP1-SR-INTEGRATION-2026-11`    | Integration assessment. Accepted by `PO-CONN04-VMP1-SR-INTEGRATION-ACCEPT-2026-11` as Option A.                                                                                                 |

The primary `main` worktree already contains an uncommitted edit of `docs/project/version-3/wave-6/wave-6-po-decision-register.md`. This decision does not adopt that edit and does not modify it.

---

## B. Decision

The Project Owner selects **R2**.

Add a separate successor/supplement reference for `D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED`.

Preserve, without replacement:

| Field     | Preserved value                            |
| --------- | ------------------------------------------ |
| Record ID | `D-CONN04-FULL-D-IA-VMP-BASELINE`          |
| Commit    | `e6b839e0e7d75322d9626162712fa81f61147d18` |
| Tree      | `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2` |

The successor reference identifies:

| Field              | Value                                      |
| ------------------ | ------------------------------------------ |
| Record ID          | `D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED`   |
| Remediation commit | `8177f3a80a879bc603f6e22d192752013501a476` |
| Remediation tree   | `7df527b7d5ab19379aca76f53b4ee8a7a7ddf12c` |
| Record commit      | `798b774f7a32b8eb70c3af07a851d43996bae5a0` |

The register text for that reference, when later applied, must state that acceptance is owner-led technical acceptance only.

---

## C. Consequences and boundaries

The original baseline entry keeps its commit, tree, parent, ratification-date sentence, publication sentence, and Stage 4 sentence.

The successor entry must not:

- replace `D-CONN04-FULL-D-IA-VMP-BASELINE`;
- claim independent review;
- claim independent approval;
- ratify or amend the Port IA;
- establish Stage 4 authorization;
- imply that the remediation is published to `main`.

Owner-led technical acceptance remains owner-led. `PO-CONN04-VMP1-SR-INTEGRATION-ACCEPT-2026-11` still leaves the code independent. A register reference is an index entry, not code integration.

This decision does not edit the Decision Register. The prepared text is `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-remediated-baseline-register-update-proposal.md`. Status of that text: proposal only.

---

## D. Unresolved

The committed register and the dirty primary worktree are not the same file state. Applying R2 requires a later edit that preserves both the original baseline and any unrelated uncommitted register text the owner chooses to keep. This decision does not perform that edit.

The decision files named here are not in commit `686627c`. A register link to them resolves only on a tree that contains them.

---

## E. What this decision does not do

No Decision Register edit. No publication to `main`. No code integration. No Port IA ratification or amendment. No independent review. No independent approval. No Stage 4 authorization.
