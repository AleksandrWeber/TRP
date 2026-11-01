# Stage M — Severity and Blocking Semantics Proposal

**Document ID:** `STAGE-M-SEV-1`
**Schema:** `trp.wave6.cc02.severity-blocking`
**Schema version:** `M.1-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This document is a proposal. It does not approve Decision 4, adopt Stage H, adopt Stage I.11–I.13, adopt Stage K, or change the Decision Register. D4 remains **HOLD**.

It supersedes the blocking rules in `STAGE-K-SEV-1` and `STAGE-K-MATRIX-1` §5 only if a later Product Owner decision adopts this file by the hash recorded in `STAGE-M-ADOPT-1`. Until that decision, Stage K remains an unadopted proposal.

The bound SQL candidate `fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c` (22,116 bytes) is not modified. This proposal does not execute it. Runtime behavior remains **NOT VERIFIED**. The Binding Manifest records PostgreSQL runtime validation as **NOT PERFORMED**.

---

## 1. Four records, four jobs

| Record                     | Field                        | Who may write it                                            | Mutability                                                                                                                       |
| -------------------------- | ---------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Provider-reported severity | `original-provider-severity` | The provider, copied by the normalizer                      | Immutable                                                                                                                        |
| Provider wording           | `original-provider-wording`  | The provider, copied by the normalizer                      | Immutable                                                                                                                        |
| Working severity           | `working-severity`           | Product Owner, or a human adjudicator only after Decision 5 | Assigned once the predicate fields below are set. Decision 5 is **NOT DECIDED**. Until then the only legal value is `UNASSIGNED` |
| Adjudication status        | `adjudication-status`        | Same human authority as working severity                    | Starts `UNRESOLVED`. Providers and Cursor cannot change it                                                                       |
| Assessment completion      | `completion-status`          | Normalizer, under `STAGE-M-ASSESS-1`                        | Not a severity                                                                                                                   |

Severity is the consequence if the described defect is present in that SQL candidate or in the reading of it required by the frozen package. It is not likelihood, a vote, a score, evidence completeness, or provider confidence.

## 2. Canonical machine token

The only machine token that records a false positive is:

`FALSE-POSITIVE-PREDICATE-NOT-MET`

The human-readable label, used in prose and never stored as the machine value, is "false positive — predicate not met".

Historical spellings, including `FALSE POSITIVE — PREDICATE NOT MET`, `PREDICATE NOT MET`, and `UNADJUDICATED`, are not legal stored values. A file that contains them is invalid.

`working-severity` uses `PREDICATE-NOT-MET` only together with adjudication `FALSE-POSITIVE-PREDICATE-NOT-MET`. That pair is not a lower severity. It records that the blocking predicates are absent.

## 3. Blocking-label class

`original-provider-severity` is copied exactly and is never edited. The normalizer also computes `blocking-label-class` and does not write that class back over the original string.

Algorithm:

1. Trim leading and trailing Unicode whitespace.
2. Case-fold ASCII letters.
3. Map the result:

| Folded label                                                    | `blocking-label-class` |
| --------------------------------------------------------------- | ---------------------- |
| `critical`                                                      | `CRITICAL`             |
| `high`                                                          | `HIGH`                 |
| `medium`                                                        | `MEDIUM`               |
| `low`                                                           | `LOW`                  |
| `not-supplied`                                                  | `NOT-SUPPLIED`         |
| any other string, including `severe`, `blocker`, `p0`, or empty | `UNRECOGNIZED-LABEL`   |

`Critical`, `HIGH`, and `critical` are the same blocking class. An unrecognized label does not escape the block.

## 4. Predicate fields

Each finding carries four closed fields. Legal values are `MET`, `NOT-MET`, and `NOT-DETERMINED`.

| Field                | Initial value before Decision 5 |
| -------------------- | ------------------------------- |
| `critical-predicate` | `NOT-DETERMINED`                |
| `high-predicate`     | `NOT-DETERMINED`                |
| `medium-predicate`   | `NOT-DETERMINED`                |
| `low-predicate`      | `NOT-DETERMINED`                |

Only the Product Owner, or the Decision 5 adjudicator, may change `NOT-DETERMINED`. Providers and Cursor may not.

Precedence when more than one predicate is `MET`: working severity is the highest met level, in the order `CRITICAL`, then `HIGH`, then `MEDIUM`, then `LOW`.

A lower working-severity token is valid only when every higher predicate is `NOT-MET`. If a higher predicate is `MET`, a lower token is a validation failure. The file is rejected. The failure does not clear the block.

If any of `critical-predicate` or `high-predicate` is `NOT-DETERMINED`, `working-severity` stays `UNASSIGNED`. A Medium or Low assignment is then a validation failure.

## 5. What blocks `PASS WITH OBSERVATIONS`

A finding blocks while any of the following is true:

1. `critical-predicate` is `MET` or `NOT-DETERMINED`.
2. `high-predicate` is `MET` or `NOT-DETERMINED`.
3. `blocking-label-class` is `UNRECOGNIZED-LABEL` and either critical or high predicate is `NOT-DETERMINED`.
4. `working-severity` is `CRITICAL` or `HIGH`.
5. `medium-predicate` or `low-predicate` is `MET` and `residual-disposition` is `NONE`.
6. `adjudication-status` is `UNRESOLVED`, `REOPENED`, or `RETRACTED-BY-PROVIDER` and rule 1, 2, 3, or 5 is also true.

`residual-disposition` is `NONE`, `ACCEPT-AS-RESIDUAL`, or `MARK-FOR-LATER-DOCUMENTATION-CORRECTION`.

Those two residual tokens are legal only when `critical-predicate` and `high-predicate` are both `NOT-MET`, and `working-severity` is `MEDIUM` or `LOW`. Using either token while a critical or high predicate is `MET` or `NOT-DETERMINED` rejects the finding. It does not stop the block.

Risk acceptance is not a value of `residual-disposition`. It does not change `original-provider-severity`, does not set a lower working severity, and does not produce `PASS WITH OBSERVATIONS`.

Silence or disagreement from another provider does not set any predicate to `NOT-MET` and does not lower a label.

## 6. The only way to stop a critical or high block

All of the following must be true. Anything less leaves the block in place:

| Item                   | Required value                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `critical-predicate`   | `NOT-MET`                                                                                                        |
| `high-predicate`       | `NOT-MET`                                                                                                        |
| `adjudication-status`  | `FALSE-POSITIVE-PREDICATE-NOT-MET` if no lower predicate is `MET`; `PREDICATE-MET` if `MEDIUM` or `LOW` is `MET` |
| `working-severity`     | `PREDICATE-NOT-MET` when no predicate is `MET`; otherwise the highest met level                                  |
| Authority              | Product Owner, or the Decision 5 adjudicator. Not a provider. Not Cursor                                         |
| `clearing-rationale`   | A string of 20 to 4,000 Unicode characters citing the absent predicate                                           |
| `clearing-package-ref` | One valid `PACKAGE-BYTES` reference under `STAGE-M-FIND-1`                                                       |
| `not-risk-acceptance`  | `TRUE`                                                                                                           |

A confirmed `CRITICAL` or `HIGH` predicate on this package hash stays blocking. A plan to edit the SQL does not clear it. A byte change is a new candidate and a new review. `SUPERSEDED` on the old hash does not make the old review `PASS WITH OBSERVATIONS`.

Provider retraction, recorded as `RETRACTED-BY-PROVIDER`, keeps the original wording and the original label. If rule 1, 2, or 3 in §5 is still true, the block continues. Reopening returns the finding to the same block calculation. Lifecycle transitions are in `STAGE-M-FIND-1`.

## 7. Level predicates

### 7.1 CRITICAL

The predicate is `MET` when the frozen package bytes, read as required by the package, do any of the following:

- result output, export, or `COPY` of raw Vault IDs, reversible identifier derivatives, or `security_audit_records.payload` content;
- a publication path for a relevant cell with `n < 5`;
- reconstruction of a suppressed cell from published outputs;
- any read, parse, filter, or inspection of P3 payload content, including json or jsonb, even when the output is only an aggregate;
- removal or weakening of the whole-file fail-closed guard so census statements run, or a path that commits or presents a partial or mixed-snapshot result as the successful census.

### 7.2 HIGH

The predicate is `MET` when the package does any of the following and the `CRITICAL` predicate is `NOT-MET`:

- an incorrect join, omission, duplication, filter, or metric that changes P1, P2, or integrity aggregates and still does not publish suppressed cells or identifiers;
- any `SELECT`, `JOIN`, or `EXISTS` against `security_audit_records` that does not read or project payload content;
- a comment or header that matches the inspection-grant test in §8;
- a comment or header that instructs fragment execution or says the guard makes fragments safe;
- a transaction that is not `REPEATABLE READ` and `READ ONLY`, while the file still rolls back and does not present a partial result as the successful census;
- a contradiction of an approved D-GAP-01 through D-GAP-11 semantic that changes results.

### 7.3 MEDIUM

The predicate is `MET` when a comment or header contradicts an approved boundary, the executable statements match that boundary, the inspection-grant test in §8 is not met, and the comment does not instruct publication, payload access, or fragment execution.

A comment that cites canvas revision `4e7bf3c9…` as the current canvas, while the executable SQL is unchanged, is `MEDIUM`. A note that misstates `k=5` while the publication rule in the same package remains correct and no publication path exists is `MEDIUM`.

### 7.4 LOW

The predicate is `MET` only for naming, formatting, or a comment typo that does not change an exclusion, a suppression rule, or an inspection boundary. If any higher predicate is `MET`, `LOW` is not the working severity.

## 8. Operator-held `n` and the inspection-grant test

Primary `k=5` remains binding at publication. Complementary suppression remains **OPEN**. P3 remains out of scope. Operator inspection of unsuppressed aggregate values where `n < 5` remains **DEFERRED / NOT GRANTED** under the working-tree record `D-CONN04-CENSUS-OP-HELD-SMALL-CELL`. This proposal does not grant that inspection and does not decide that record.

Emission or retention of operator-held aggregate `n`, including `n < 5`, is not permission to inspect, publish, export, or use those values as evidence.

The inspection-grant test is met when a comment or header applies one of these phrases, ASCII case-insensitive, to `n < 5`, small cells, or unsuppressed counts:

`inspect`, `inspection of`, `look at`, `examine`, `read the values`, `review the values`, `use the values`, `export`, `publish`, `copy the counts`.

The bound candidate's comments that say counts are retained for operator-held diagnosis, and that counts are not withheld solely because `n < 5`, do not contain those phrases. Under this proposal they are not findings when all of the following hold:

- the words describe emission or retention only;
- the inspection-grant test is not met;
- the same comment does not add a publication, export, or `COPY` path;
- inspection remains deferred.

A comment that says operators may inspect `n < 5` meets the test and is `HIGH`, provided it does not also meet `CRITICAL`.

This classification uses the file text and the recorded governance boundary. It is not a runtime result.

## 9. Accepted non-findings

The following are not findings:

- operator-held emission of unsuppressed `n`, including `n < 5`, when §8 is satisfied and publication is absent;
- an exclusion comment that correctly says P3 is not read and does not read payload;
- a restatement of the documented fragment-bypass limitation that does not instruct the bypass.

AR-03 stays the already accepted non-blocking observation. This taxonomy does not reopen it.

## 10. Review-level outcomes

Review-level tokens are `INCONCLUSIVE / NOT COMPLETED`, `BLOCKED — UNRESOLVED CRITICAL/HIGH`, and `PASS WITH OBSERVATIONS`. Providers do not issue them. `PASS WITH OBSERVATIONS` does not satisfy CC-02.

| Condition                                                                                                                                                                                                         | Token                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Fewer than three counting Evidence Anchors, or any required coverage record is not counting                                                                                                                       | `INCONCLUSIVE / NOT COMPLETED`                                              |
| Three counting anchors, and any finding has the block in §5 because of a critical predicate, a high predicate, an unrecognized label, or working severity `CRITICAL` or `HIGH`                                    | `BLOCKED — UNRESOLVED CRITICAL/HIGH`                                        |
| Three counting anchors, every critical and high predicate on every finding is `NOT-MET`, every unrecognized label has been adjudicated under §6, and every met medium or low predicate has a residual disposition | `PASS WITH OBSERVATIONS` may be proposed to a later evidence-acceptance act |

A matrix residual disposition cannot produce the third row while §5 says the finding still blocks. `STAGE-M-MATRIX-1` uses this section as the only block calculation.
