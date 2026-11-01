# Stage Q — Enum and Schema Validation Specification

**Document ID:** `STAGE-Q-ENUM-1`
**Schema version:** `Q.1-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This file is the proposed field vocabulary and the only `blocks(f)` function. It does not approve Decision 4. Unknown values fail closed. Missing required fields fail closed. Derived states are not stored as competing tokens.

`STAGE-Q-CLEAR-1` defines the bundle rows this function calls. `STAGE-Q-SEV-1` defines the predicate text. Those files do not define a second block function.

---

## 1. Field validation

| Field                    | Allowed stored values                                                                                                | Role                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `working-severity`       | `UNASSIGNED`, `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `PREDICATE-NOT-MET`                                               | Human severity. Not a predicate result                     |
| `critical-predicate`     | `MET`, `NOT-MET`, `NOT-DETERMINED`                                                                                   | Predicate result. Not a severity                           |
| `high-predicate`         | `MET`, `NOT-MET`, `NOT-DETERMINED`                                                                                   | Predicate result                                           |
| `medium-predicate`       | `MET`, `NOT-MET`, `NOT-DETERMINED`                                                                                   | Predicate result                                           |
| `low-predicate`          | `MET`, `NOT-MET`, `NOT-DETERMINED`                                                                                   | Predicate result                                           |
| `adjudication-status`    | `UNRESOLVED`, `PREDICATE-MET`, `FALSE-POSITIVE-PREDICATE-NOT-MET`, `RETRACTED-BY-PROVIDER`, `REOPENED`, `SUPERSEDED` | Human lifecycle. Not a review-level outcome                |
| `residual-disposition`   | `NONE`, `ACCEPT-AS-RESIDUAL`, `MARK-FOR-LATER-DOCUMENTATION-CORRECTION`                                              | Residual mark. Not a severity and not a clearing by itself |
| `predicate-block`        | Derived `BLOCKING` or `NOT-BLOCKING` only                                                                            | A stored copy that disagrees with §4 fails validation      |
| `blocking-label-class`   | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `NOT-SUPPLIED`, `UNRECOGNIZED-LABEL`                                            | Folded provider label. Not working severity                |
| `not-risk-acceptance`    | `TRUE`, `FALSE`                                                                                                      | Bundle flag                                                |
| `clearing-actor-id`      | `PO` passes a bundle. `CURSOR`, `Anthropic`, `OpenAI`, and `Google` are recognizable and do not pass                 | Actor. Not a provider severity                             |
| `correlated-block-check` | Derived `SUBJECT-KEY-ABSENT`, `SUBJECT-KEY-MALFORMED`, `CORRELATED-BLOCK-PRESENT`, `NO-CORRELATED-BLOCK`             | Not a stored input                                         |

`RESOLVED` and `RETRACTED` are derived words. They are not stored tokens. Historical spellings, including `FALSE POSITIVE — PREDICATE NOT MET`, `NOT_ASSESSED`, and underscore predicate spellings, are illegal in stored enum fields. They remain legal inside `original-provider-wording`.

Review-level outcomes are not finding fields. They are `INCONCLUSIVE / NOT COMPLETED`, `BLOCKED — UNRESOLVED CRITICAL/HIGH`, `BLOCKED — UNRESOLVED MEDIUM/LOW`, and `PASS WITH OBSERVATIONS`.

Additional closed tokens used by coverage records:

| Field                 | Allowed values                                                                                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `statement`           | `FINDINGS-RECORDED`, `NO-FINDINGS-STATED`, `NOT-ASSESSED`                                                                                                                                                                                                                                              |
| `non-counting-reason` | `NONE`, `REFUSED`, `TIMEOUT`, `MALFORMED`, `TRUNCATED`, `INCOMPLETE`, `ISOLATION-NOT-EVIDENCED`, `TRANSMISSION-NOT-EVIDENCED`, `CROSS-DISCLOSURE-DETECTED`, `SESSION-REUSED`, `INELIGIBLE`, `NO-ASSESSMENT`, `MISMATCH`, `UNVERIFIABLE`, `NOT-SELECTED`, `SIBLING-DISQUALIFIED`, `NO-COUNTING-ATTEMPT` |
| `comparison-status`   | Initial value `UNRESOLVED`. Later human values `UNIQUE_FINDING`, `AGREEMENT`, `PARTIAL_AGREEMENT`, `DISAGREEMENT` are not written by a normalizer                                                                                                                                                      |

`NOT_ASSESSED` is invalid. `NOT-ASSESSED` is the only stored spelling. `MISMATCH` and `UNVERIFIABLE` require `countability` `NOT-COUNTING` and `statement` `NOT-ASSESSED`. Neither is evidence of safety.

## 2. Consistency rules

A record fails validation when any of these is true:

- a required field is missing or outside its enum;
- `working-severity` is `CRITICAL` and `critical-predicate` is not `MET`;
- `working-severity` is `HIGH` unless `high-predicate` is `MET` and `critical-predicate` is `NOT-MET`;
- `working-severity` is `MEDIUM` or `LOW` while a higher predicate is not `NOT-MET`, or while critical or high is `NOT-DETERMINED`;
- `working-severity` is `PREDICATE-NOT-MET` while any predicate is `MET`;
- `residual-disposition` is not `NONE` while critical or high is `MET` or `NOT-DETERMINED`;
- stored `predicate-block` is outside the two derived tokens.

Failure preserves `BLOCKING`. The parser does not repair the record.

## 3. What each word is not

| Word                   | It is not                                               |
| ---------------------- | ------------------------------------------------------- |
| `working-severity`     | A predicate result or a review token                    |
| A predicate value      | A severity or an adjudication                           |
| `adjudication-status`  | `PASS WITH OBSERVATIONS` or either blocked review token |
| `residual-disposition` | Permission to clear CRITICAL or HIGH                    |
| `predicate-block`      | An independently chosen status                          |

## 4. Blocking function

```text
blocks(f, findings):
  if f fails §2 validation: return BLOCKING
  if f.adjudication-status is UNRESOLVED,
     REOPENED, RETRACTED-BY-PROVIDER, or SUPERSEDED: return BLOCKING
  if f.critical-predicate is MET or NOT-DETERMINED: return BLOCKING
  if f.high-predicate is MET or NOT-DETERMINED: return BLOCKING
  if f.blocking-label-class is UNRECOGNIZED-LABEL
     and (f.critical-predicate is NOT-DETERMINED
          or f.high-predicate is NOT-DETERMINED): return BLOCKING
  if f.working-severity is CRITICAL or HIGH: return BLOCKING
  if (f.medium-predicate is MET or f.low-predicate is MET)
     and f.residual-disposition is NONE: return BLOCKING
  if any STAGE-Q-CLEAR-1 §3 row other than correlation is false: return BLOCKING
  if correlated-block-check(f, findings) is not NO-CORRELATED-BLOCK: return BLOCKING
  if stored predicate-block is present and is not NOT-BLOCKING: return BLOCKING
  return NOT-BLOCKING
```

The first matching return wins. `UNRESOLVED`, `REOPENED`, `RETRACTED-BY-PROVIDER`, and `SUPERSEDED` return `BLOCKING` before predicate values are used as a reason to clear. The `SUPERSEDED` early return is the strengthening identified in `STAGE-Q-SEV-1` §4.

Sibling correlation uses the same function through the bundle rows and stops before the correlation return. That intrinsic result is what `STAGE-Q-CLEAR-1` §2 reads.

Review tokens, first match:

| Condition                                                                                                                                                                | Token                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Fewer than three counting anchors                                                                                                                                        | `INCONCLUSIVE / NOT COMPLETED`                                              |
| Any finding is `BLOCKING` because critical or high is `MET` or `NOT-DETERMINED`, the label is unrecognized and undetermined, or working severity is `CRITICAL` or `HIGH` | `BLOCKED — UNRESOLVED CRITICAL/HIGH`                                        |
| Any finding is `BLOCKING`, or any comparison status is `UNRESOLVED`                                                                                                      | `BLOCKED — UNRESOLVED MEDIUM/LOW`                                           |
| Every finding is `NOT-BLOCKING` and no comparison status is `UNRESOLVED`                                                                                                 | `PASS WITH OBSERVATIONS` may be proposed to a later evidence-acceptance act |

`PASS WITH OBSERVATIONS` does not satisfy CC-02.

## 5. Decision table

| Case                                                                                                   | `blocks`                                                                          |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Critical `NOT-DETERMINED`, adjudication `UNRESOLVED`                                                   | `BLOCKING`                                                                        |
| High `NOT-DETERMINED`, adjudication `UNRESOLVED`                                                       | `BLOCKING`                                                                        |
| Critical `MET`, adjudication `PREDICATE-MET`, working severity `CRITICAL`                              | `BLOCKING`                                                                        |
| High `MET`, critical `NOT-MET`, working severity `HIGH`                                                | `BLOCKING`                                                                        |
| Critical and high `NOT-MET`, adjudication `UNRESOLVED`                                                 | `BLOCKING`                                                                        |
| Medium `MET`, residual `ACCEPT-AS-RESIDUAL`, bundle otherwise complete, valid key, no blocking sibling | `NOT-BLOCKING`                                                                    |
| Low `MET`, residual `MARK-FOR-LATER-DOCUMENTATION-CORRECTION`, same completeness                       | `NOT-BLOCKING`                                                                    |
| Medium `MET`, residual `NONE`                                                                          | `BLOCKING`                                                                        |
| `RETRACTED-BY-PROVIDER`                                                                                | `BLOCKING`                                                                        |
| `REOPENED`                                                                                             | `BLOCKING`                                                                        |
| `FALSE-POSITIVE-PREDICATE-NOT-MET` with a complete bundle and `NO-CORRELATED-BLOCK`                    | `NOT-BLOCKING`                                                                    |
| Package reference `NONE`                                                                               | `BLOCKING`                                                                        |
| Rationale `NONE` or shorter than 20 characters                                                         | `BLOCKING`                                                                        |
| Subject key `NONE`                                                                                     | `BLOCKING`                                                                        |
| Malformed subject key                                                                                  | `BLOCKING`                                                                        |
| Otherwise complete bundle sharing a key with an unresolved critical sibling                            | `BLOCKING` for the complete-looking finding. The sibling stays a separate finding |
| Critical `MET` with `ACCEPT-AS-RESIDUAL`                                                               | `BLOCKING`                                                                        |
| Actor `CURSOR` or a provider name                                                                      | `BLOCKING`                                                                        |
| Unknown working severity                                                                               | `BLOCKING`                                                                        |
| Historical adjudication spelling                                                                       | `BLOCKING`                                                                        |
| `SUPERSEDED`                                                                                           | `BLOCKING`                                                                        |

## 6. What this file does not do

It does not approve Decision 4, execute SQL, execute the Census, or contact a provider.
