# Stage M — Discrepancy Matrix Semantics Proposal

**Document ID:** `STAGE-M-MATRIX-1`
**Schema:** `trp.wave6.cc02.discrepancy-matrix`
**Schema version:** `M.1-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This document is a proposal. It does not build a matrix, contact a provider, or approve Decision 4. If later adopted, it supersedes `STAGE-K-MATRIX-1`. The block calculation is `STAGE-M-SEV-1` §5 only.

---

## 1. When a matrix file is valid

A matrix file is valid only when all of the following hold:

1. Exactly three coverage records, one for each D3 roster identity: Anthropic, OpenAI, and Google.
2. Each counting record has its own `ACCEPTED` Evidence Anchor.
3. All three counting anchors cite the same Package Anchor.
4. Each counting attempt has `package-payload-identity` `MATCH`.
5. No counting record is an ineligible provider. While Google privacy is deferred, Google's coverage record has `countability` `NOT-COUNTING` and `non-counting-reason` `INELIGIBLE`. A matrix with fewer than three counting records is valid as a file only when `matrix-use` is `NON-COUNTING-SNAPSHOT`. It cannot support a review-level outcome other than `INCONCLUSIVE / NOT COMPLETED`.
6. A `matrix-use` of `QUORUM-CANDIDATE` requires three counting records. Two counting records are not a quorum. There is no N−1 and no majority shortcut.

No real anchors exist. This document does not create any.

## 2. File object

UTF-8 JSON, no BOM. Key order is fixed. Unknown keys are rejected. Null is rejected.

| Order | Field                    | Rule                                                                                  |
| ----- | ------------------------ | ------------------------------------------------------------------------------------- |
| 1     | `schema-id`              | `trp.wave6.cc02.discrepancy-matrix`                                                   |
| 2     | `schema-version`         | `M.1-1`                                                                               |
| 3     | `matrix-instance-id`     | `MX-` plus 16 lowercase hex digits                                                    |
| 4     | `matrix-revision`        | Integer from 1 upward, no leading zeros                                               |
| 5     | `predecessor-sha256`     | `NONE` for revision 1, otherwise the 64-lowercase-hex digest of the prior matrix file |
| 6     | `package-anchor-ref`     | The shared Package Anchor, or `NONE` on a non-counting snapshot                       |
| 7     | `package-payload-sha256` | 64 lowercase hex digits, or `NONE` when the anchor is `NONE`                          |
| 8     | `matrix-use`             | `QUORUM-CANDIDATE` or `NON-COUNTING-SNAPSHOT`                                         |
| 9     | `provider-coverage`      | Exactly three objects under §3, in roster order Anthropic, OpenAI, Google             |
| 10    | `rows`                   | Zero or more finding rows under §4                                                    |

## 3. Provider coverage, including silence

`NOT_ASSESSED` is a coverage value. It is not a finding-row comparison status. It is not evidence that a defect is absent, and it does not lower severity.

| Field                 | Rule                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | `Anthropic`, `OpenAI`, or `Google`                                                                                                                                                                                                          |
| `attempt-id`          | `ATTEMPT-` plus 32 lowercase hex digits, or `NONE` when no attempt exists                                                                                                                                                                   |
| `evidence-anchor-ref` | An anchor id, or `NONE`                                                                                                                                                                                                                     |
| `countability`        | `COUNTING` or `NOT-COUNTING`                                                                                                                                                                                                                |
| `non-counting-reason` | `NONE` only when counting. Otherwise `REFUSED`, `TIMEOUT`, `MALFORMED`, `TRUNCATED`, `INCOMPLETE`, `ISOLATION-NOT-EVIDENCED`, `TRANSMISSION-NOT-EVIDENCED`, `CROSS-DISCLOSURE-DETECTED`, `SESSION-REUSED`, `INELIGIBLE`, or `NO-ASSESSMENT` |
| `statement`           | `FINDINGS-RECORDED`, `NO-FINDINGS-STATED`, or `NOT-ASSESSED`                                                                                                                                                                                |

`NOT-ASSESSED` is required when `countability` is `NOT-COUNTING`. A counting provider who explicitly reported no findings uses `NO-FINDINGS-STATED` and has no finding rows. A counting provider who reported findings uses `FINDINGS-RECORDED`. `NO-FINDINGS-STATED` is not proof of safety.

## 4. Rows

One row per finding instance. The row key is `finding-instance-id`. Rows are not merged when they share `finding-subject-key`.

| Field                        | Rule                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `finding-instance-id`        | Immutable                                                                                                                                                                             |
| `finding-subject-key`        | `NONE` or `FS-` plus 16 lowercase hex digits                                                                                                                                          |
| `provider`                   | Originating provider                                                                                                                                                                  |
| `attempt-id`                 | Originating attempt                                                                                                                                                                   |
| `original-provider-severity` | Immutable copy                                                                                                                                                                        |
| `blocking-label-class`       | Copy from the finding                                                                                                                                                                 |
| `predicate-block`            | `BLOCKING` or `NOT-BLOCKING`, copied from the `STAGE-M-SEV-1` §5 calculation. A residual disposition cannot set this to `NOT-BLOCKING` while that calculation says the finding blocks |
| `comparison-status`          | Exactly one token from §5                                                                                                                                                             |
| `other-provider-positions`   | Exactly two objects, one for each other roster provider                                                                                                                               |
| `adjudication-status`        | The finding's status. Not a free-text disposition                                                                                                                                     |

Each position object:

| Field                       | Rule                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `provider`                  | The other provider                                                                     |
| `position`                  | `SAME-PREDICATE`, `OVERLAP`, `INCOMPATIBLE`, `NOT-REPORTED`, or `NOT-ASSESSED`         |
| `other-finding-instance-id` | The other instance id, or `NONE` when the position is `NOT-REPORTED` or `NOT-ASSESSED` |

`NOT-REPORTED` means that provider's coverage is `NO-FINDINGS-STATED` or `FINDINGS-RECORDED` and no retained finding was linked. `NOT-ASSESSED` means that provider's coverage statement is `NOT-ASSESSED`. Neither position is a vote.

## 5. Comparison tokens

A comparison unit is one finding row. Exactly one `comparison-status` is stored. Precedence, first match wins:

| Order | Token               | Test                                                                                                                                                                                      |
| ----- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `UNRESOLVED`        | The human has not finished the comparison                                                                                                                                                 |
| 2     | `DISAGREEMENT`      | Two retained findings assert incompatible facts about the same component: one asserts the package does X, and another asserts the package does not do X. `DISAGREEMENT` wins over overlap |
| 3     | `AGREEMENT`         | The human records that two or more findings assert the same factual claim about the same `affected-component` and the same `finding-category`. Each instance remains                      |
| 4     | `PARTIAL_AGREEMENT` | The findings share a component or category and do not assert the same claim and do not assert incompatible facts                                                                          |
| 5     | `UNIQUE_FINDING`    | No other retained finding was judged to be the same claim                                                                                                                                 |

`PARTIAL_AGREEMENT` is overlap without a contradiction. `DISAGREEMENT` is a contradiction. A pair that both overlaps and contradicts is `DISAGREEMENT`.

`NOT_ASSESSED` is not in this list. It lives on `provider-coverage.statement` and on `position`.

The same `finding-subject-key` does not force `AGREEMENT`. The human still applies the tests above.

## 6. Versioning and later verification

A matrix file is not edited after it is hashed. A change, including a later byte verification that changes `verification-status` or a predicate, is a new file:

- same `matrix-instance-id`;
- `matrix-revision` increased by 1;
- `predecessor-sha256` equal to the prior file;
- prior file left unchanged.

`SUPERSEDED` findings remain on the revision that recorded them. A new package hash requires a new `matrix-instance-id`. No revision clears a `predicate-block` of `BLOCKING` unless the finding's `STAGE-M-SEV-1` §5 calculation on that revision is `NOT-BLOCKING`.

## 7. Review token

| Matrix state                                                                                                                                             | Token                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `matrix-use` is `NON-COUNTING-SNAPSHOT`, or fewer than three counting coverage records                                                                   | `INCONCLUSIVE / NOT COMPLETED`                                                                                                                                                                |
| Three counting records, and any row has `predicate-block` `BLOCKING` or `comparison-status` `UNRESOLVED` or `DISAGREEMENT` whose rows are still blocking | `BLOCKED — UNRESOLVED CRITICAL/HIGH` when the block is a critical, high, or unrecognized class; otherwise the medium and low rows stay unfinished and `PASS WITH OBSERVATIONS` is unavailable |
| Three counting records, every row has `predicate-block` `NOT-BLOCKING`, and no comparison status is `UNRESOLVED`                                         | `PASS WITH OBSERVATIONS` may be proposed to a later evidence-acceptance act                                                                                                                   |

`DISAGREEMENT` stays visible after both rows are adjudicated. Adjudication does not delete a row. Two providers do not outvote one.

## 8. Synthetic example

No provider was contacted. No anchor was created. The identifiers below are grammatical examples, not records.

While Google privacy is deferred, a real quorum candidate is impossible. The legal current shape is a non-counting snapshot:

| Provider  | Countability   | Reason          | Statement      |
| --------- | -------------- | --------------- | -------------- |
| Anthropic | `NOT-COUNTING` | `NO-ASSESSMENT` | `NOT-ASSESSED` |
| OpenAI    | `NOT-COUNTING` | `NO-ASSESSMENT` | `NOT-ASSESSED` |
| Google    | `NOT-COUNTING` | `INELIGIBLE`    | `NOT-ASSESSED` |

`matrix-use` is `NON-COUNTING-SNAPSHOT`. Review token: `INCONCLUSIVE / NOT COMPLETED`. `NOT-ASSESSED` is not evidence of safety.

A second, explicitly fictional shape shows the grammar after three counting assessments exist. It is not a claim that those assessments exist, and it does not put Google in a counting slot. The third counting identity would require a future roster decision. Until then this shape is not a `QUORUM-CANDIDATE` for the current roster.

| Row                     | Provider A instance                                                                                                     | Provider B position                                              | Provider C position             | Status           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------- | ---------------- |
| Payload-read allegation | `PF-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1`, original `CRITICAL`, predicates `NOT-DETERMINED`, `predicate-block` `BLOCKING` | `INCOMPATIBLE`, other id `PF-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb-1` | `NOT-ASSESSED`, other id `NONE` | `DISAGREEMENT`   |
| Alias typo              | `PF-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-2`, class `LOW`, predicates not determined, still `BLOCKING` until determined      | `NOT-REPORTED`                                                   | `NOT-ASSESSED`                  | `UNIQUE_FINDING` |

Provider B's incompatible finding remains its own row. Provider C contributes no finding row. The payload-read row stays blocking because the critical predicate is `NOT-DETERMINED`. A residual token `ACCEPT-AS-RESIDUAL` on that row is invalid under `STAGE-M-SEV-1` and cannot change `predicate-block`.
