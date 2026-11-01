# Stage M — Finding Identity and Lifecycle Proposal

**Document ID:** `STAGE-M-FIND-1`
**Schema:** `trp.wave6.cc02.finding`
**Schema version:** `M.1-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This document is a proposal. It does not approve Decision 4, create a finding from Vault or Census data, or designate an adjudicator. If later adopted, it supersedes `STAGE-K-FIND-1`.

Blocking uses `STAGE-M-SEV-1` only. A retraction, a reopening, or a Medium or Low residual cannot erase a critical or high block.

---

## 1. Two identifiers

A finding instance is one provider statement in one attempt. It is not a merged cross-provider object.

| Identifier            | Grammar                                                                 | Stability                                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `finding-instance-id` | `PF-` + 32 lowercase hex digits + `-` + a decimal with no leading zeros | Unique within the attempt. A new attempt, including a same-configuration retry, produces new instance ids                                                               |
| `finding-subject-key` | `NONE`, or `FS-` + 16 lowercase hex digits                              | Assigned only by the Product Owner or the Decision 5 adjudicator. The same key may appear on more than one instance. It does not merge, delete, or replace any instance |

The 32 hex digits in `finding-instance-id` are the hex digits of `attempt-id` after the prefix `ATTEMPT-`. Uppercase hex is invalid. The decimal starts at 1 and increases by 1 with no gaps, in array order.

`finding-subject-key` is the stable correlation handle across retries and providers. Equal titles are not a key. No process assigns the key by string similarity.

## 2. Fields

All fields are required. Empty strings are rejected. JSON null is rejected. Unknown keys are rejected. Key order is the table order.

| Field                          | Type and rule                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `schema-version`               | Exact `M.1-1`                                                                                                                      |
| `finding-instance-id`          | §1                                                                                                                                 |
| `finding-subject-key`          | §1. Initial value `NONE`                                                                                                           |
| `provider`                     | `Anthropic`, `OpenAI`, or `Google`                                                                                                 |
| `attempt-id`                   | `ATTEMPT-` plus the same 32 hex digits as the instance id                                                                          |
| `title`                        | Provider title, or `NOT-SUPPLIED`. 1 to 200 Unicode characters                                                                     |
| `original-provider-wording`    | Verbatim excerpt of 1 to 2,000 characters, or `OFFSET:<offset>:<length>` under §3                                                  |
| `affected-component`           | A Stage I.11 §4.2 package path, `PACKAGE-READING`, or `NOT-LOCATED`                                                                |
| `finding-category`             | `DISCLOSURE`, `PAYLOAD-READ`, `AGGREGATE-CORRECTNESS`, `SNAPSHOT-OR-GUARD`, `GOVERNANCE-WORDING`, `EDITORIAL`, or `NOT-CLASSIFIED` |
| `original-provider-severity`   | Exact provider label, or `NOT-SUPPLIED`. Immutable                                                                                 |
| `blocking-label-class`         | Computed by `STAGE-M-SEV-1` §3. Not a rewrite of the original label                                                                |
| `working-severity`             | `UNASSIGNED`, `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, or `PREDICATE-NOT-MET`                                                          |
| `critical-predicate`           | `MET`, `NOT-MET`, or `NOT-DETERMINED`                                                                                              |
| `high-predicate`               | same closed set                                                                                                                    |
| `medium-predicate`             | same closed set                                                                                                                    |
| `low-predicate`                | same closed set                                                                                                                    |
| `evidence-references`          | Array of 1 to 20 objects under §3                                                                                                  |
| `verification-status`          | `NOT-CHECKED`, `BYTES-CITED`, or `BYTES-NOT-FOUND`                                                                                 |
| `technical-explanation`        | Copied text of 1 to 4,000 characters, or `NOT-SUPPLIED`                                                                            |
| `impact-description`           | Copied text of 1 to 4,000 characters, or `NOT-SUPPLIED`                                                                            |
| `provider-confidence`          | Copied token of 1 to 80 characters, or `NOT-SUPPLIED`. Not a severity                                                              |
| `unresolved-questions`         | Array of 0 to 50 strings, each 1 to 2,000 characters                                                                               |
| `proposed-disposition`         | Copied provider text of 1 to 2,000 characters, or `NOT-SUPPLIED`. Not a closure                                                    |
| `provider-retraction-text`     | Copied retraction of 1 to 2,000 characters, or `NOT-SUPPLIED`                                                                      |
| `adjudication-status`          | §4. Initial value `UNRESOLVED`                                                                                                     |
| `residual-disposition`         | `NONE`, `ACCEPT-AS-RESIDUAL`, or `MARK-FOR-LATER-DOCUMENTATION-CORRECTION`                                                         |
| `clearing-rationale`           | 20 to 4,000 characters, or `NONE`                                                                                                  |
| `clearing-package-ref`         | One `PACKAGE-BYTES` object, or `NONE`                                                                                              |
| `not-risk-acceptance`          | `TRUE` or `FALSE`. `TRUE` is required on the clearing path in `STAGE-M-SEV-1` §6                                                   |
| `superseded-by-package-sha256` | 64 lowercase hex digits, or `NONE`                                                                                                 |

The normalizer sets predicate fields to `NOT-DETERMINED`, `working-severity` to `UNASSIGNED`, `adjudication-status` to `UNRESOLVED`, `residual-disposition` to `NONE`, `clearing-rationale` to `NONE`, `clearing-package-ref` to `NONE`, `not-risk-acceptance` to `FALSE`, and `superseded-by-package-sha256` to `NONE`. Provider text that asks for any other value makes the finding invalid.

## 3. Evidence references

Offset origin is byte 0. `byte-offset` is inclusive. `byte-length` is the count of bytes. The end offset, `byte-offset + byte-length`, is exclusive. The range must lie inside the cited artifact. A range that ends past the artifact is `BYTES-NOT-FOUND` only when `ref-kind` is not `UNAVAILABLE`; the finding stays in the file.

`original-provider-wording` uses `OFFSET:<offset>:<length>` when the excerpt would exceed 2,000 characters. The entire field value matches `^OFFSET:(0|[1-9][0-9]*):([1-9][0-9]*)$`. Offset is greater than or equal to 0. Length is from 1 to 1,000,000. No spaces and no leading zeros. The range refers to `response.bin` for that attempt. An `UNAVAILABLE` reference does not drop the finding. `verification-status` is `BYTES-NOT-FOUND` when every reference is `UNAVAILABLE` or a range cannot be checked, `BYTES-CITED` when every non-unavailable range matches, and `NOT-CHECKED` before that check. The status is not written into `technical-explanation`.

Each evidence object uses one of these three shapes. Key order is fixed.

`RESPONSE-BYTES`:

| Key                  | Rule                                 |
| -------------------- | ------------------------------------ |
| `ref-kind`           | `RESPONSE-BYTES`                     |
| `artifact-id`        | `response.bin`                       |
| `sha256`             | 64 lowercase hex digits of that file |
| `offset-origin`      | `BYTE-0`                             |
| `byte-offset`        | integer greater than or equal to 0   |
| `byte-length`        | integer from 1 to 1,000,000          |
| `offset-end`         | `EXCLUSIVE`                          |
| `unavailable-reason` | `NONE`                               |

`PACKAGE-BYTES`:

| Key                  | Rule                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| `ref-kind`           | `PACKAGE-BYTES`                                                                                  |
| `artifact-id`        | A Stage I.11 §4.2 member path                                                                    |
| `sha256`             | 64 lowercase hex digits. For a counting assessment this equals the accepted package payload hash |
| `offset-origin`      | `BYTE-0`                                                                                         |
| `byte-offset`        | integer greater than or equal to 0                                                               |
| `byte-length`        | integer from 1 to 1,000,000                                                                      |
| `offset-end`         | `EXCLUSIVE`                                                                                      |
| `unavailable-reason` | `NONE`                                                                                           |

`UNAVAILABLE`:

| Key                  | Rule                                                                        |
| -------------------- | --------------------------------------------------------------------------- |
| `ref-kind`           | `UNAVAILABLE`                                                               |
| `artifact-id`        | `NONE`                                                                      |
| `sha256`             | `NONE`                                                                      |
| `offset-origin`      | `NONE`                                                                      |
| `byte-offset`        | `NONE`                                                                      |
| `byte-length`        | `NONE`                                                                      |
| `offset-end`         | `NONE`                                                                      |
| `unavailable-reason` | `NO-LOCATABLE-RANGE`, `RESPONSE-NOT-RETAINED`, or `PACKAGE-PATH-NOT-MEMBER` |

An `UNAVAILABLE` reference is valid. A finding with no provider citation uses one such object with `NO-LOCATABLE-RANGE`. That object does not reject the rest of the assessment. `verification-status` follows the rule in the OFFSET paragraph above.

## 4. Lifecycle

| Status                             | Meaning                                                                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `UNRESOLVED`                       | No human adjudication yet                                                                                                                     |
| `PREDICATE-MET`                    | The human recorded which predicates are met                                                                                                   |
| `FALSE-POSITIVE-PREDICATE-NOT-MET` | The human recorded that the blocking predicates are absent, with the §6 bundle in `STAGE-M-SEV-1`                                             |
| `RETRACTED-BY-PROVIDER`            | The human recorded that `provider-retraction-text` is the provider's retraction. The original label stays. The block calculation is unchanged |
| `REOPENED`                         | A prior closure was reopened. The block is calculated again from the predicate fields                                                         |
| `SUPERSEDED`                       | A different package hash replaces this candidate. The old finding remains on the old hash                                                     |

Allowed transitions, and only these, may be written by the Product Owner or the Decision 5 adjudicator:

| From                               | To                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `UNRESOLVED`                       | `PREDICATE-MET`, `FALSE-POSITIVE-PREDICATE-NOT-MET`, `RETRACTED-BY-PROVIDER`        |
| `RETRACTED-BY-PROVIDER`            | `PREDICATE-MET`, `FALSE-POSITIVE-PREDICATE-NOT-MET`, `REOPENED`                     |
| `PREDICATE-MET`                    | `REOPENED`, or `SUPERSEDED` when `superseded-by-package-sha256` is a different hash |
| `FALSE-POSITIVE-PREDICATE-NOT-MET` | `REOPENED`                                                                          |
| `REOPENED`                         | `PREDICATE-MET`, `FALSE-POSITIVE-PREDICATE-NOT-MET`, `RETRACTED-BY-PROVIDER`        |

A provider cannot take any transition. Copying a retraction into `provider-retraction-text` leaves `adjudication-status` at `UNRESOLVED` until the human transition. `SUPERSEDED` does not change the block on the package hash that contained the finding.

Reopening sets `critical-predicate` and `high-predicate` back to `NOT-DETERMINED` unless the human writes new determinations in the same record. Until those determinations exist, `STAGE-M-SEV-1` §5 blocks.

## 5. Representation cases

| Case                                              | Representation                                                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One provider reports the same issue twice         | Two instance ids. No automatic merge                                                                                                                   |
| Two providers describe one suspected issue        | Two instance ids. A human may set the same `finding-subject-key`. Both instances remain                                                                |
| Two providers report similar but different issues | Two instance ids. `finding-subject-key` stays `NONE` until a human distinguishes them                                                                  |
| A provider retracts                               | `provider-retraction-text` holds the words. Status stays `UNRESOLVED` until the human sets `RETRACTED-BY-PROVIDER`. A critical or high block continues |
| Insufficient evidence                             | One `UNAVAILABLE` reference. Status stays `UNRESOLVED`. The finding is not dropped                                                                     |
| Disputed severity                                 | Original label immutable. Predicates stay `NOT-DETERMINED` until the human sets them. Disagreement does not lower the class                            |

## 6. Examples

Valid instance id: `PF-0123456789abcdef0123456789abcdef-1`.

Valid OFFSET wording: `OFFSET:120:40`.

Invalid: `PF-0123456789ABCDEF0123456789abcdef-01` because of uppercase hex and a leading zero. Invalid OFFSET: `OFFSET:012:40` because of a leading zero. Invalid clearing: `residual-disposition` `ACCEPT-AS-RESIDUAL` while `critical-predicate` is `NOT-DETERMINED`.

```json
{
  "ref-kind": "UNAVAILABLE",
  "artifact-id": "NONE",
  "sha256": "NONE",
  "offset-origin": "NONE",
  "byte-offset": "NONE",
  "byte-length": "NONE",
  "offset-end": "NONE",
  "unavailable-reason": "NO-LOCATABLE-RANGE"
}
```

That object is a valid non-dropping reference. It is not byte evidence for a false-positive clearing. Clearing requires a `PACKAGE-BYTES` object.
