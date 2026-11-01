# Stage O — Severity and Blocking Correction Proposal

**Document ID:** `STAGE-O-SEV-1`
**Schema:** `trp.wave6.cc02.severity-blocking`
**Schema version:** `O.1-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This file is a proposed successor to `STAGE-M-SEV-1`. It does not edit that file. It does not approve Decision 4. If a later decision adopts this file by the hash in `STAGE-O-ADOPT-1`, this file replaces `STAGE-M-SEV-1` for the block calculation. Until that decision, Stage M remains an unadopted proposal.

The SQL candidate `fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c` is not modified and is not executed. Runtime behavior remains **NOT TESTED**.

---

## 1. Records

These records are separate. A value in one does not fill another.

| Record                     | Field                                                                       | Who may write it                                            | Meaning                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider-reported severity | `original-provider-severity`                                                | Copied from the provider                                    | Immutable label. Not the block                                                                                                                                  |
| Provider wording           | `original-provider-wording`                                                 | Copied from the provider                                    | Immutable text                                                                                                                                                  |
| Working severity           | `working-severity`                                                          | Product Owner, or a Decision 5 adjudicator after Decision 5 | Human severity. Decision 5 is **NOT DECIDED**. Until then the only legal stored value is `UNASSIGNED`, except inside a complete clearing bundle written by `PO` |
| Predicate status           | `critical-predicate`, `high-predicate`, `medium-predicate`, `low-predicate` | Same human authority                                        | Whether that level's predicate is met. Not an adjudication                                                                                                      |
| Adjudication status        | `adjudication-status`                                                       | Same human authority                                        | Lifecycle of the human decision. Not a predicate                                                                                                                |
| Rationale                  | `clearing-rationale`                                                        | Same human authority                                        | Why the predicates were set. Absence does not clear a block                                                                                                     |
| Evidence                   | `clearing-package-ref`                                                      | Same human authority                                        | One `PACKAGE-BYTES` reference. Absence does not clear a block                                                                                                   |
| Prior block                | `prior-blocking-record`                                                     | Normalizer, once, before any human write                    | Immutable snapshot of the blocking state being cleared                                                                                                          |
| Blocking status            | `predicate-block`                                                           | Derived by §4                                               | `BLOCKING` or `NOT-BLOCKING`. An input value cannot override §4                                                                                                 |

Provider retraction text may be copied. Copying it does not change `adjudication-status` and does not change `predicate-block`.

## 2. Predicate words and adjudication words

Predicate values, and only these, are `MET`, `NOT-MET`, and `NOT-DETERMINED`.

| Word             | Meaning                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `MET`            | The human records that the predicate text in the adopted severity section is true of the frozen package |
| `NOT-MET`        | The human records that the same predicate text is false of that package                                 |
| `NOT-DETERMINED` | No human has finished that predicate. This is the initial value                                         |

Adjudication values remain the Stage M finding tokens. `RESOLVED` and `RETRACTED` are derived words. They are not stored tokens.

| Word         | Stored token or derived state                                                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UNRESOLVED` | Stored. No complete clearing bundle                                                                                                                                   |
| `RESOLVED`   | Derived only. §4 returns `NOT-BLOCKING` because the clearing bundle in §3 is complete. There is no stored token `RESOLVED`                                            |
| `RETRACTED`  | Derived name of stored `RETRACTED-BY-PROVIDER`. The original label and wording stay. The block is recalculated and is not cleared by the retraction                   |
| `REOPENED`   | Stored. A prior bundle is no longer in force. Critical and high predicates return to `NOT-DETERMINED` unless the same record contains a new complete bundle           |
| `SUPERSEDED` | Stored only when `superseded-by-package-sha256` is a different hash. The old finding remains on the old hash. The old review does not become `PASS WITH OBSERVATIONS` |

`FALSE-POSITIVE-PREDICATE-NOT-MET` is the only stored machine token for a false positive. The human-readable label "false positive — predicate not met" is not stored. Historical spellings are illegal in the stored adjudication field, the stored working-severity field, and the four predicate fields. They remain legal inside immutable provider wording. That limitation replaces the Stage M sentence that rejected any file containing the historical spelling.

## 3. Clearing bundle

A critical or high block stops only when every row below is true. If any row is false, missing, or ambiguous, §4 returns `BLOCKING`.

| #   | Element              | Required value                                                                                                                                                                                                                                                  |
| --- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Decision-maker       | `clearing-actor-id` is `PO`. A different actor is legal only after Decision 5 names that actor. Decision 5 is **NOT DECIDED**, so this proposal accepts no other actor                                                                                          |
| 2   | Finding reference    | `clearing-finding-instance-id` equals this finding's `finding-instance-id`                                                                                                                                                                                      |
| 3   | Adjudication outcome | `FALSE-POSITIVE-PREDICATE-NOT-MET` when no predicate is `MET`; `PREDICATE-MET` when `medium-predicate` or `low-predicate` is `MET` and both critical and high are `NOT-MET`                                                                                     |
| 4   | Evidence             | `clearing-package-ref` is one valid `PACKAGE-BYTES` object. `UNAVAILABLE` is not evidence for a clearing                                                                                                                                                        |
| 5   | Rationale            | `clearing-rationale` has 20 to 4,000 Unicode characters. `NONE` fails the bundle                                                                                                                                                                                |
| 6   | Predicates           | Critical and high are both `NOT-MET`. No predicate is `NOT-DETERMINED`. Working severity is `PREDICATE-NOT-MET` when none are `MET`; otherwise it is the highest `MET` level among `MEDIUM` and `LOW`                                                           |
| 7   | Time                 | `clearing-utc` matches `YYYY-MM-DDTHH:MM:SSZ`, year 2026 through 2099, real Gregorian date, second 00 through 59                                                                                                                                                |
| 8   | Prior state          | `prior-blocking-record` is present and immutable. It contains the same `finding-instance-id`, `predicate-block` `BLOCKING`, and the predicate and adjudication values from before this bundle                                                                   |
| 9   | Other providers      | Another provider's severity, silence, or disagreement does not set a predicate to `NOT-MET` and does not satisfy any row of this table                                                                                                                          |
| 10  | Correlation          | `correlated-block-check` is `NO-SUBJECT-KEY` or `NO-CORRELATED-BLOCK`. It is `CORRELATED-BLOCK-PRESENT` when any other instance with the same `finding-subject-key` still has §4 `BLOCKING`. That value fails the bundle. The same key does not merge instances |

`not-risk-acceptance` must be `TRUE`. Risk acceptance is not a residual value.

A lower residual (`ACCEPT-AS-RESIDUAL` or `MARK-FOR-LATER-DOCUMENTATION-CORRECTION`) is legal only inside a complete bundle whose working severity is `MEDIUM` or `LOW`. Used while critical or high is `MET` or `NOT-DETERMINED`, it fails validation. The failure preserves `BLOCKING`.

## 4. Blocking function

```text
bundle_complete(f):
  return all ten rows of §3 are true for f

blocks(f):
  if f fails validation: return BLOCKING
  if f.adjudication-status is REOPENED: return BLOCKING
  if f.adjudication-status is RETRACTED-BY-PROVIDER: return BLOCKING
  if f.adjudication-status is UNRESOLVED: return BLOCKING
  if f.critical-predicate is MET or NOT-DETERMINED: return BLOCKING
  if f.high-predicate is MET or NOT-DETERMINED: return BLOCKING
  if f.blocking-label-class is UNRECOGNIZED-LABEL
     and (f.critical-predicate is NOT-DETERMINED
          or f.high-predicate is NOT-DETERMINED): return BLOCKING
  if f.working-severity is CRITICAL or HIGH: return BLOCKING
  if (f.medium-predicate is MET or f.low-predicate is MET)
     and f.residual-disposition is NONE: return BLOCKING
  if bundle_complete(f) is false: return BLOCKING
  return NOT-BLOCKING
```

The first matching return wins. `UNRESOLVED`, `REOPENED`, and `RETRACTED-BY-PROVIDER` return `BLOCKING` before the predicate values are consulted. Setting critical and high to `NOT-MET` does not pass those three returns.

`predicate-block` is the result of `blocks`. `STAGE-O-MAJ-1` requires the matrix to copy this result and no other calculation. A matrix residual cannot store `NOT-BLOCKING` while `blocks` returns `BLOCKING`.

Review tokens, first match:

| Condition                                                                                                                                                                     | Token                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Fewer than three counting anchors                                                                                                                                             | `INCONCLUSIVE / NOT COMPLETED`                                              |
| Any finding returns `BLOCKING` because critical or high is `MET` or `NOT-DETERMINED`, the label is unrecognized and undetermined, or working severity is `CRITICAL` or `HIGH` | `BLOCKED — UNRESOLVED CRITICAL/HIGH`                                        |
| Any finding returns `BLOCKING`, or any comparison status is `UNRESOLVED`                                                                                                      | `BLOCKED — UNRESOLVED MEDIUM/LOW`                                           |
| Every finding returns `NOT-BLOCKING` and no comparison status is `UNRESOLVED`                                                                                                 | `PASS WITH OBSERVATIONS` may be proposed to a later evidence-acceptance act |

`PASS WITH OBSERVATIONS` does not satisfy CC-02. Providers do not issue these tokens. The third row is the token Stage N required for a quorum that is not a critical or high block. It is not a pass.

## 5. Decision table

| Case                                                                                                           | `blocks`                                                  |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Critical predicate `NOT-DETERMINED`, adjudication `UNRESOLVED`                                                 | `BLOCKING`                                                |
| High predicate `NOT-DETERMINED`, adjudication `UNRESOLVED`                                                     | `BLOCKING`                                                |
| Critical and high `NOT-MET`, adjudication `UNRESOLVED`, rationale absent                                       | `BLOCKING`                                                |
| Critical `NOT-MET`, rationale `NONE`, adjudication `FALSE-POSITIVE-PREDICATE-NOT-MET`                          | `BLOCKING`                                                |
| Provider retraction text present, adjudication `RETRACTED-BY-PROVIDER` or still `UNRESOLVED`                   | `BLOCKING`                                                |
| Critical `MET`, residual `ACCEPT-AS-RESIDUAL`                                                                  | `BLOCKING`. The residual also fails validation            |
| Reopened critical, predicates returned to `NOT-DETERMINED`                                                     | `BLOCKING`                                                |
| Two instances share a subject key, one bundle is otherwise complete, the other is `UNRESOLVED` at critical     | Both `BLOCKING`. The complete-looking bundle fails row 10 |
| Every §3 row true, no other correlated instance is `BLOCKING`, adjudication `FALSE-POSITIVE-PREDICATE-NOT-MET` | `NOT-BLOCKING` for that finding only                      |

Negative rule: deleting the rationale, the actor, the timestamp, the prior record, the package reference, or the adjudication outcome from the last row returns `BLOCKING`.

## 6. Level predicates and the inspection-grant test

The predicate texts for critical, high, medium, and low remain those in `STAGE-M-SEV-1` §7.1 through §7.4. This successor does not rewrite them. It does replace §5, §6, §8, and §10 of that file.

Primary suppression at publication remains the statement in the SQL candidate text: relevant published cells with `n < 5` require primary suppression, and `k=5` is the figure written in that file. This proposal does not modify that file and does not open a publication path. Complementary suppression remains an open question in the uncommitted register. This proposal does not decide it.

`D-CONN04-CENSUS-OP-HELD-SMALL-CELL` is `UNVERIFIED — NOT AN AUTHORIZED BOUNDARY`. It appears only in the uncommitted register. Stage O does not use it as permission or as a prohibition source. This proposal grants no permission to inspect, export, publish, or use suppressed or operator-held values as evidence.

The inspection-grant test is met only when all of the following are true:

1. The window is the longest run of consecutive `--` comment lines that contains the phrase. A blank line ends the run. A one-line window occurs only when the lines above and below it are not comment lines.
2. The window refers to `n < 5`, small cells, or unsuppressed counts.
3. A listed phrase occurs as a whole phrase, ASCII case-insensitive, with a boundary on each side. A boundary is the start or end of the window, or a character other than `A-Z`, `a-z`, and `0-9`. `publish` does not match `published` or `publication`.
4. The phrases are `inspect`, `inspection of`, `look at`, `examine`, `read the values`, `review the values`, `use the values`, `export`, `publish`, and `copy the counts`.
5. A negation word earlier in that same window negates every later phrase in the window. The negation words are `NOT`, `NO`, `do not`, `does not`, `must not`, and `BLOCKED`, ASCII case-insensitive, matched with the same whole-phrase boundary rule as item 3. A negated phrase is not a grant.

A window that fails any row is not an inspection grant. Retention or emission wording is not a grant. A grant that is not also critical is high. This test is a text rule. It is not a runtime result.

## 7. What this file does not do

It does not approve Decision 4, decide Decision 5, confirm a register entry, execute SQL, or authorize inspection of unsuppressed counts.
