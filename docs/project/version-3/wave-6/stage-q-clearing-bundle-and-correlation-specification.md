# Stage Q — Clearing Bundle and Correlation Specification

**Document ID:** `STAGE-Q-CLEAR-1`
**Schema version:** `Q.1-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This file replaces `STAGE-O-SEV-1` §3 row 10. An absent `finding-subject-key` does not satisfy a clearing condition. Correlation does not merge findings. This file does not approve Decision 4.

The machine result remains `STAGE-Q-ENUM-1` §4. If a reader finds a conflict between this file and that function, that function's result is the block, and the conflict is a specification defect.

---

## 1. Subject key

`finding-subject-key` grammar is unchanged from `STAGE-M-FIND-1` §1: `NONE`, or `FS-` plus 16 lowercase hexadecimal digits. The same key may appear on more than one `finding-instance-id`. Equal titles are not a key. No process assigns the key by string similarity.

| State                   | Condition                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| `SUBJECT-KEY-ABSENT`    | The field is missing, empty, or `NONE`                                                          |
| `SUBJECT-KEY-MALFORMED` | The field is present and is not a valid key, or the record is marked with a duplicate key field |
| `VALID`                 | The field matches `FS-` plus 16 lowercase hex digits                                            |

`NONE` is the normalizer's initial value. It means the human has not assigned a key. It does not mean the finding is known to be uncorrelated.

## 2. Derived correlation value

`correlated-block-check` is derived. A stored value cannot force `NO-CORRELATED-BLOCK` or `NO-SUBJECT-KEY`.

The intrinsic block of a finding is `STAGE-Q-ENUM-1` §4 through the bundle rows in §3 of this file, before this correlation value is consulted. Sibling status uses that intrinsic result so two findings cannot form a circle in which each waits for the other.

| Derived value              | Rule                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `SUBJECT-KEY-ABSENT`       | This finding's key state is `SUBJECT-KEY-ABSENT`                                                                                |
| `SUBJECT-KEY-MALFORMED`    | This finding's key state is `SUBJECT-KEY-MALFORMED`                                                                             |
| `CORRELATED-BLOCK-PRESENT` | The key is valid, and another finding with the same key fails validation or is intrinsically `BLOCKING`                         |
| `NO-CORRELATED-BLOCK`      | The key is valid, and every other finding with that same key is intrinsically `NOT-BLOCKING`. Zero other findings is this value |

`STAGE-O-SEV-1` allowed `NO-SUBJECT-KEY` to satisfy the clearing row. That value is not a passing value in this file. `SUBJECT-KEY-ABSENT` fails the bundle.

A finding is not its own sibling. Correlation does not delete, replace, or combine `finding-instance-id` values. Clearing one instance leaves every other instance in the set.

## 3. Clearing bundle

Every row is required. A false, missing, or ambiguous row leaves the finding `BLOCKING`.

| #   | Element                         | Passing condition                                                                                                                                                                                |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Decision-maker                  | `clearing-actor-id` is `PO`. Decision 5 is **NOT DECIDED**, so no other actor passes. A provider identity does not pass                                                                          |
| 2   | Finding reference               | `clearing-finding-instance-id` equals this finding's `finding-instance-id`                                                                                                                       |
| 3   | Adjudication                    | `FALSE-POSITIVE-PREDICATE-NOT-MET` when no predicate is `MET`. `PREDICATE-MET` when `medium-predicate` or `low-predicate` is `MET` and both critical and high are `NOT-MET`                      |
| 4   | Evidence                        | `clearing-package-ref` is one `PACKAGE-BYTES` object whose `unavailable-reason` is `NONE` and whose `sha256` is 64 lowercase hex digits. `NONE` and `UNAVAILABLE` do not pass                    |
| 5   | Rationale                       | `clearing-rationale` is 20 to 4,000 Unicode characters. `NONE` does not pass                                                                                                                     |
| 6   | Predicates and working severity | Critical and high are `NOT-MET`. No predicate is `NOT-DETERMINED`. Working severity is `PREDICATE-NOT-MET` when none are `MET`; otherwise it is the highest `MET` level among `MEDIUM` and `LOW` |
| 7   | Time                            | `clearing-utc` matches `YYYY-MM-DDTHH:MM:SSZ`, year 2026 through 2099, as a real Gregorian timestamp                                                                                             |
| 8   | Prior state                     | `prior-blocking-record` is present, `immutable` is true, `finding-instance-id` matches, `predicate-block` is `BLOCKING`, and the prior predicate and adjudication fields are present             |
| 9   | Other providers                 | Another provider's severity, silence, or disagreement does not set a predicate to `NOT-MET` and does not pass any row                                                                            |
| 10  | Correlation                     | `correlated-block-check` is `NO-CORRELATED-BLOCK`                                                                                                                                                |
| 11  | Risk                            | `not-risk-acceptance` is `TRUE`                                                                                                                                                                  |

`ACCEPT-AS-RESIDUAL` and `MARK-FOR-LATER-DOCUMENTATION-CORRECTION` are legal only when critical and high are `NOT-MET` and working severity is `MEDIUM` or `LOW`. Either token while critical or high is `MET` or `NOT-DETERMINED` fails validation and preserves `BLOCKING`.

## 4. Conditions that pass

A clearing bundle passes only when all eleven rows are true and `STAGE-Q-ENUM-1` §4 returns `NOT-BLOCKING`. The passing correlation condition is only `NO-CORRELATED-BLOCK`.

These conditions do not pass:

- missing subject key;
- malformed or duplicate subject key;
- a valid key shared with another finding that is still intrinsically blocking;
- any incomplete bundle row;
- unresolved, reopened, retracted, or superseded adjudication.

Two findings with one valid key may both pass when each is intrinsically clear. They remain two findings.

## 5. What this file does not do

It does not approve Decision 4, authorize inspection of unsuppressed counts, execute SQL, or contact a provider.
