# Stage K — Decision Register Authority Report

**Document ID:** `STAGE-K-REG-1`
**Version:** `K.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`
**Creation date:** 2026-11-01

**Hash record:** The SHA-256 of this file is recorded in `docs/project/version-3/wave-6/stage-k-d4-blocker-resolution-and-po-review-brief.md`. This file does not embed its own digest.

This report does not edit, stage, or replace the Decision Register. The discrepancy is not resolved by this document.

---

## 1. Files compared

| Copy                   | Path                                                           | Custody at review                                                              | SHA-256                                                            |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Working tree           | `docs/project/version-3/wave-6/wave-6-po-decision-register.md` | Modified, uncommitted, on `main` at `90b8430d00de225e59de999aa8bc1f4b0506b8d5` | `06d3f15e7e7b1e99e5c34a81dd74d626aae2581a71051cf318ca78c729680845` |
| HEAD and `origin/main` | same path in commit `90b8430d00de225e59de999aa8bc1f4b0506b8d5` | Committed. Git blob `1b671b01615ead0f917fd7acf594f892c000b5a1`                 | `648b6bc8f7a071c4edeb2417616d50ceeeb566aef3e56101e525e7acbc08882b` |

`git diff --stat` for this path: 445 lines changed, 441 insertions, 4 deletions. `git status` shows `M` for this path. Stage K did not create that modification.

## 2. What the diff contains

The working-tree copy is not a D1–D3-only delta. The uncommitted insertions include:

- successor, implementation, closure, Stage 4 ratification, and VMP-1 baseline records: `D-CONN04-FULL-D-IA-S23-B-VMP-SUCC`, `D-CONN04-FULL-D-IA-VMP`, `D-CONN04-FULL-D-IA-VMP-CLOSE`, `D-CONN04-FULL-D-IA-S4`, `D-CONN04-FULL-D-IA-S4-VMP1-BASELINE-ACCEPT`;
- census records `D-CONN04-CENSUS-F01`, `D-CONN04-CENSUS-F02`, and `D-CONN04-CENSUS-OP-HELD-SMALL-CELL`;
- `D-CONN04-CENSUS-CC02-AMD-D1`, `D-CONN04-CENSUS-CC02-AMD-D2`, and `D-CONN04-CENSUS-CC02-AMD-D3`;
- summary-table rows and a rewritten STOP paragraph that mention those records.

The committed copy does not contain the D1, D2, or D3 section headings.

Inside the working-tree D1 and D2 sections, and inside the STOP paragraph's D1 and D2 sentences, Decisions 3–7 are still described as not decided. The later D3 section in the same file records Decision 3 as approved and Decisions 4–7 as not decided. Stage J observation G-1 remains accurate. This report does not repair those sentences.

## 3. Which copy other documents use

| Document                       | Register identity it cites                                                                                                                                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage H proposal, source table | An earlier hash `09f14ed52930ac249105775c0c652a516e2b094c0d5d25b657000c4553d89360`. That is neither the current HEAD hash nor the current working-tree hash. The proposal file is hash-locked at `0680abb3…` and was not updated |
| Stage I.11 §2                  | Working-tree hash `06d3f15e…`, and the then-HEAD content hash `648b6bc8…`                                                                                                                                                        |
| Stage J brief §2               | The same pair of hashes                                                                                                                                                                                                          |

Stage I.11 and Stage J treat the working-tree file as the local record that contains D1–D3. They do not treat the committed blob as a substitute. They also do not commit the working tree.

## 4. Effect on D4

The working-tree file is the only local copy that states D1–D3. It is not committed authority on `origin/main`. It also carries other uncommitted decision records, so it cannot be described as "only the previously approved D1–D3 text."

A committed Decision 4 entry written against the current HEAD register would cite decisions that the committed file does not contain. That breaks the evidence chain for D4. The existence of a more complete working tree does not close the gap.

This report does not declare either copy adopted, revoked, or superseded.

## 5. Recommended minimal resolution

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

A later Product Owner documentation act, separate from Decision 4, would:

1. Review the full uncommitted diff, including the VMP and census F-01, F-02, and small-cell records, not only D1–D3.
2. Record whether those extra sections match decisions the Product Owner has already made.
3. If they do, commit that register text as a recording act that does not reopen the recorded outcomes and does not decide D4.
4. If any extra section does not match an already made decision, exclude it from the commit and leave it uncommitted.
5. In the same or a following recording act, annotate the stale D1 and D2 sentences so the D3 section is the Decision 3 record.

Stage K does not perform steps 1 through 5. Until that act, D4's formal register chain remains open. The protocol proposals in the other Stage K files can still be reviewed. They cannot by themselves become a committed Decision 4 record.
