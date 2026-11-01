# Stage K — Discrepancy Matrix Schema

**Document ID:** `STAGE-K-MATRIX-1`
**Version:** `K.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`
**Creation date:** 2026-11-01

**Hash record:** The SHA-256 of this file is recorded in `docs/project/version-3/wave-6/stage-k-d4-blocker-resolution-and-po-review-brief.md`. This file does not embed its own digest.

This document is a proposal. It does not build a matrix and does not approve Decision 4.

**Sources:** recovered Stage I.8 §11; recovered Stage I.9 matrix rules in the same transcript line 45; Stage I.11 §7.6; Stage K finding schema `STAGE-K-FIND-1`; Stage K severity proposal `STAGE-K-SEV-1`.

---

## 1. When the matrix may exist

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

The matrix is built only after all three required assessments each have an `ACCEPTED` Evidence Anchor for the same Package Anchor, with `package-payload-identity: MATCH`, and none of those providers is ineligible under D3. While Google privacy is deferred, a Google anchor cannot be `ACCEPTED`, so the matrix does not begin. Two anchors are not enough. There is no N−1.

A matrix file created earlier is not valid and cannot support a review-level outcome.

## 2. Why these comparison values

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

The closed comparison statuses are:

| Token               | Meaning                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AGREEMENT`         | The human recorder judges that two or more retained findings assert the same package predicate. Each finding object remains                                  |
| `PARTIAL_AGREEMENT` | The findings overlap and are not the same predicate                                                                                                          |
| `DISAGREEMENT`      | Retained findings assert incompatible predicates. Both remain                                                                                                |
| `UNIQUE_FINDING`    | One provider reported the finding. No other retained finding was judged to be the same predicate                                                             |
| `NOT_ASSESSED`      | A provider's coverage mark for that component is `NOT-REVIEWED`, or that provider has no counting assessment. This is not evidence that the defect is absent |
| `UNRESOLVED`        | The human has not finished the comparison, or the predicate match is not established                                                                         |

Recovered Stage I.8 used `SINGLE-PROVIDER`, `AGREE`, `OVERLAP`, `CONTRADICTS`, and `UNIQUE`. Those words are historical. This proposal uses the tokens above so the set is closed and so absence has its own token. `NOT_ASSESSED` is included because absence must not be stored as agreement or as a failed finding. No token means "the other providers voted this down."

`NOT_ASSESSED` and a missing finding do not prove safety. They do not lower severity.

## 3. Row identity

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

One row per provider finding. The row key is `finding-id` from `STAGE-K-FIND-1`.

A human correlation id `correlation-id` has the form `XC-` plus 16 lowercase hex digits. It is assigned only when a human links rows. The same `correlation-id` on two rows records a comparison. It does not merge the rows and does not imply they are duplicates. Rows with equal titles and equal severity and no shared `correlation-id` stay unlinked.

`correlation-id` is `NONE` until a human assigns one.

## 4. Columns

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

Schema identifier: `trp.wave6.cc02.discrepancy-matrix`
Schema version: `K.1-1`

The file is UTF-8 JSON. Key order is fixed. Unknown keys are rejected.

Matrix object:

1. `schema-id`
2. `schema-version`
3. `package-anchor-ref`
4. `package-payload-sha256`
5. `evidence-anchor-refs` — exactly three distinct accepted anchor ids, or the file is rejected
6. `rows` — array

Each row:

| Field                        | Rule                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `finding-id`                 | Provider finding id. Immutable                                                                                      |
| `provider`                   | Originating provider                                                                                                |
| `attempt-id`                 | Originating attempt                                                                                                 |
| `correlation-id`             | `NONE` or `XC-` plus 16 hex digits                                                                                  |
| `description`                | Copy of `original-provider-wording`. Not rewritten                                                                  |
| `original-provider-severity` | Immutable copy                                                                                                      |
| `proposed-working-severity`  | `UNASSIGNED` or a Stage K severity token or `PREDICATE-NOT-MET`                                                     |
| `evidence-references`        | Copy of the finding evidence references                                                                             |
| `comparison-status`          | One token from §2                                                                                                   |
| `other-provider-positions`   | One entry per other required provider: `SAME-PREDICATE`, `OVERLAP`, `INCOMPATIBLE`, or `NOT-REPORTED`               |
| `final-disposition`          | `UNRESOLVED`, `PREDICATE-MET`, `FALSE-POSITIVE-PREDICATE-NOT-MET`, or a recorded `MEDIUM` or `LOW` disposition text |
| `disposition-authority`      | `NONE` until Decision 5. This file does not name a person                                                           |

`NOT-REPORTED` is not a vote and is not a downgrade.

## 5. Blocking rule

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

The matrix blocks `PASS WITH OBSERVATIONS` while any row has:

- `original-provider-severity` that is a `CRITICAL` or `HIGH` label, including the historical spellings, and `final-disposition` `UNRESOLVED`; or
- `proposed-working-severity` `CRITICAL` or `HIGH` and `final-disposition` other than `FALSE-POSITIVE-PREDICATE-NOT-MET`; or
- `comparison-status` `UNRESOLVED`; or
- `comparison-status` `DISAGREEMENT` whose incompatible rows are not each dispositioned.

An unresolved discrepancy stays on the row. It is not deleted to clear the block. The review-level token is then `BLOCKED — UNRESOLVED CRITICAL/HIGH` when the block is a `CRITICAL` or `HIGH` row, and `INCONCLUSIVE / NOT COMPLETED` when the matrix was not allowed to begin.

`MEDIUM` and `LOW` rows block only while they lack a recorded disposition, as in `STAGE-K-SEV-1`.

No majority of providers clears a row. Two providers do not outvote one. A unique finding remains visible and follows its own severity rule.

## 6. What the matrix does not do

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

The matrix does not erase a provider finding, imply a vote, treat a missing finding as proof of safety, downgrade severity, treat two providers as a quorum, or start while any required provider is ineligible. Final disposition authority remains Decision 5 or the Product Owner. This schema does not exercise that authority.
