# Stage O — MAJOR Findings Remediation Matrix

**Document ID:** `STAGE-O-MAJ-1`
**Version:** `O.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

The seven identifiers below are the MAJOR rows in `STAGE-N-REV-1` §3. They were read from that file, hash `c13444fdbb1d852ca7346f1a45713e010b9e067e3973ad639a22b3066c7e2878`. This matrix does not edit Stage M or Stage N. Sections 2 through 6 are controlling amendments if `STAGE-O-ADOPT-1` is later adopted.

---

## 1. Matrix

| Field               | N-M1                                                                                                                                           | N-M2                                                                                                                                                                                  | N-M3                                                                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage N finding ID  | `N-M1`                                                                                                                                         | `N-M2`                                                                                                                                                                                | `N-M3`                                                                                                                                                                    |
| Severity            | MAJOR                                                                                                                                          | MAJOR                                                                                                                                                                                 | MAJOR                                                                                                                                                                     |
| Source              | `STAGE-M-MATRIX-1` §3 introduction, §3 field table, and §5. `STAGE-M-VER-1` §2                                                                 | `STAGE-M-MATRIX-1` §7. `STAGE-M-VER-1` §2 on L4-2                                                                                                                                     | `STAGE-M-ISO-1` §2. `STAGE-M-ASSESS-1` §3. Stage I.11 §6.7 seal list                                                                                                      |
| Verified defect     | The field table stores `NOT-ASSESSED`. The introduction and §5 also write `NOT_ASSESSED`. Stage M's verification report repeats the underscore | §7 names `BLOCKED — UNRESOLVED CRITICAL/HIGH` for a critical, high, or unrecognized block. For a quorum blocked only at medium or low, it says pass is unavailable and names no token | `isolation-gap-reason` is required by the isolation proposal and has no field on the assessment. Unknown keys reject the file. The retained seal list has no field either |
| Evidence            | Stage N quotes both spellings. This review re-read those sections                                                                              | Stage N quotes the missing token. This review re-read §7                                                                                                                              | Stage N quotes the missing field. This review re-read both field lists                                                                                                    |
| Impact              | Two stored spellings can pass different validators                                                                                             | A finished quorum can have no legal review token                                                                                                                                      | The two causes of `ISOLATION-NOT-EVIDENCED` cannot be stored, so Stage L L6-1 stays open in the data                                                                      |
| Required correction | §2 below                                                                                                                                       | §3 below                                                                                                                                                                              | §4 below                                                                                                                                                                  |
| O.1–O.5 dependency  | This file §2. Review tokens also use `STAGE-O-SEV-1` §4                                                                                        | This file §3 and `STAGE-O-SEV-1` §4                                                                                                                                                   | This file §4                                                                                                                                                              |
| PO dependency       | No. The correction chooses the hyphenated token already in the field table                                                                     | No. The new token does not approve a pass or a send                                                                                                                                   | No. Adding a storage field does not run a check                                                                                                                           |
| Status              | `RESOLVED IN PROPOSAL`                                                                                                                         | `RESOLVED IN PROPOSAL`                                                                                                                                                                | `RESOLVED IN PROPOSAL`                                                                                                                                                    |

| Field               | N-M4                                                                                                        | N-M5                                                                                | N-M6                                                                     | N-M7                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Stage N finding ID  | `N-M4`                                                                                                      | `N-M5`                                                                              | `N-M6`                                                                   | `N-M7`                                                                                                          |
| Severity            | MAJOR                                                                                                       | MAJOR                                                                               | MAJOR                                                                    | MAJOR                                                                                                           |
| Source              | Stage I.11 §6.7 and §7.4. `STAGE-M-MATRIX-1` §3 `non-counting-reason`                                       | `STAGE-M-MATRIX-1` coverage rule. `STAGE-M-SUB-1` §2                                | `STAGE-M-SEV-1` §8. SQL candidate lines 40, 90–91, and 264, read as text | `STAGE-M-VER-1` §2 labels for L1-3, L4-2, and L6-1                                                              |
| Verified defect     | `MISMATCH` and `UNVERIFIABLE` are legal payload-identity results and are absent from the matrix reason enum | One coverage slot per provider, with no rule for two attempts that would each count | The phrase test has no whole-phrase boundary and no negation rule        | Those three labels say resolved. Stage N's tests do not support them. The hash table in the same report matched |
| Evidence            | Stage I.11 lines defining the two results. Matrix §3 enum, re-read                                          | Both rules, re-read                                                                 | Stage N's line citations. This stage did not re-execute SQL              | `STAGE-M-VER-1` §2, re-read                                                                                     |
| Impact              | An unverifiable payload cannot be recorded without inventing a token. Counting is already forbidden         | An operator can pick the favorable attempt and treat two attempts as two providers  | The same comment can be read as a non-finding or as high                 | A later reader can treat the self-check as closure                                                              |
| Required correction | §2 below                                                                                                    | §5 below                                                                            | `STAGE-O-SEV-1` §6                                                       | §6 below. The Stage M report is not edited                                                                      |
| O.1–O.5 dependency  | This file §2                                                                                                | This file §5 and `STAGE-O-AUTH-1`                                                   | `STAGE-O-SEV-1`                                                          | This file §6 and `STAGE-O-VER-1`                                                                                |
| PO dependency       | No                                                                                                          | No. The selection rule grants no send                                               | No. The test grants no inspection                                        | No. Relabeling a historical report is not a decision                                                            |
| Status              | `RESOLVED IN PROPOSAL`                                                                                      | `RESOLVED IN PROPOSAL`                                                              | `RESOLVED IN PROPOSAL`                                                   | `RESOLVED IN PROPOSAL`                                                                                          |

N-B1 is corrected in `STAGE-O-SEV-1` §3 and §4. N-B2 is corrected in `STAGE-O-AUTH-1` and in `STAGE-O-SEV-1` §6. They are blockers, not a hidden eighth MAJOR row.

## 2. Coverage token and payload reasons

The only machine token for a provider that did not produce a counting assessment is `NOT-ASSESSED`. `NOT_ASSESSED` is not a stored value. A file that stores the underscore spelling is invalid.

`non-counting-reason` gains `MISMATCH` and `UNVERIFIABLE`, with the same meanings as Stage I.11 `package-payload-identity`. Either value requires `countability` `NOT-COUNTING` and `statement` `NOT-ASSESSED`. Neither counts. Neither is evidence of safety.

The initial `comparison-status` is `UNRESOLVED`. A normalizer does not store `UNIQUE_FINDING`, `AGREEMENT`, `PARTIAL_AGREEMENT`, or `DISAGREEMENT` before the human finishes the comparison.

## 3. Medium and low review token

`STAGE-O-SEV-1` §4 is the only review-token table. A quorum whose blocking rows are medium or low, or whose comparison status is still `UNRESOLVED` after every critical and high block is absent, uses `BLOCKED — UNRESOLVED MEDIUM/LOW`. That token is not `PASS WITH OBSERVATIONS` and does not satisfy CC-02.

## 4. Isolation gap field

Successor assessment schema version is `O.1-1`. It is `STAGE-M-ASSESS-1` plus one required field, `isolation-gap-reason`, ordered after `isolation-result`.

| Value                  | When                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `NONE`                 | `isolation-result` is not `ISOLATION-NOT-EVIDENCED`                                                              |
| `PARTIAL-INSTRUCTIONS` | The result is `ISOLATION-NOT-EVIDENCED` and instructions are `PARTIAL`. This wins if the search was also not run |
| `SEARCH-NOT-RUN`       | The result is `ISOLATION-NOT-EVIDENCED`, instructions are `FULL`, and the search was not run                     |

Any other combination rejects the normalized file. The attempt does not count. `response.bin` is kept.

On the seal, if Stage I.11 `capture-status` could be `PARTIAL-INSTRUCTIONS` and the isolation result is `ISOLATION-NOT-EVIDENCED`, the stored capture-status is `ISOLATION-NOT-EVIDENCED` and `isolation-gap-reason` is `PARTIAL-INSTRUCTIONS`. Both names are non-counting. This sentence is the override.

A first attempt with no prior response has an empty prior set. Running the search on that empty set is a completed search with no hit. It is not `SEARCH-NOT-RUN`. It still requires an intact request and `FULL` instructions before `NO-CROSS-DISCLOSURE-OBSERVED` is available. An empty prior set does not prove provider-side isolation.

A range that ends past an artifact stays in the finding as `BYTES-NOT-FOUND` when the reference is not `UNAVAILABLE`. That sentence replaces the Stage M sentence that said the range must lie inside the artifact and could be read as rejecting the finding.

The Stage M sentence that provider text asking for another human value makes the finding invalid is superseded. Provider words stay in the text fields. They do not change human fields and do not, by themselves, invalidate the finding. The normalizer's initial human values remain.

## 5. One counting attempt

Each roster identity has at most one `COUNTING` coverage record.

If any attempt for that identity has `isolation-result` `CROSS-DISCLOSURE-DETECTED`, or `session-separation` `SESSION-REUSED`, the coverage record is `NOT-COUNTING` with that reason. A cleaner sibling attempt does not restore counting.

Otherwise the counting attempt is the one with the earliest `seal-utc` among attempts that meet every counting rule. Later attempts are `NOT-COUNTING` with `non-counting-reason` `NOT-SELECTED`. Their attempt ids are listed in `non-selected-attempt-ids`, an array of zero or more `attempt-id` strings. They do not add a provider toward the three-provider quorum.

`NOT-SELECTED` is not a vote and is not evidence of safety.

A region change is `HOSTING-CHANGE`. An operational-control change that changes the organization operating the endpoint, while the contracting entity string is unchanged, is `OWNERSHIP-CHANGE`. Neither is `RETRY-SAME-CONFIGURATION`. This classification grants no send.

## 6. Stage M verification labels

`STAGE-M-VER-1` is historical. Its hash table can be recomputed. Its labels `RESOLVED IN PROPOSAL` for L1-3, L4-2, and L6-1 are not the status of those items after Stage N. The replacement status is in `STAGE-O-VER-1`. This section does not edit the Stage M report and does not call that report independent assurance.

## 7. Authority constraint

Nothing in this file confirms Decision 3, approves a small-cell boundary, or authorizes a provider, SQL execution, or Census execution. Name triples stay under `STAGE-O-AUTH-1`.
