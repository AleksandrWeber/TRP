# Stage K — AI Assessment Output Specification

**Document ID:** `STAGE-K-ASSESS-1`
**Version:** `K.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`
**Creation date:** 2026-11-01

**Hash record:** The SHA-256 of this file is recorded in `docs/project/version-3/wave-6/stage-k-d4-blocker-resolution-and-po-review-brief.md`. This file does not embed its own digest.

This document is a proposal. It does not approve Decision 4 and does not authorize a provider call.

**Sources:** recovered Stage I.8 §7 and Stage I.9 §5, transcript `57d05bb8-80b9-4bf5-a312-9f996959a547`; Stage I.11 §§6–7 at SHA-256 `de102a4a9b7903b350c83375e4c982bbf25dcca12a78c3192125725da2b477f6`; Stage K severity proposal `STAGE-K-SEV-1`; Stage K finding schema `STAGE-K-FIND-1`.

---

## 1. Two representations

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

The provider's raw response is `response.bin` for that attempt, as retained under Stage I.11 §6.6. Its bytes are not rewritten, pretty-printed, or translated.

The normalized assessment is a separate UTF-8 JSON document, `normalized-assessment.json`. It is a projection of the raw response plus seal metadata. It does not replace `response.bin`. If a field cannot be read from the raw response, the normalizer records the closed gap token. It does not invent the missing text.

A malformed or incomplete raw response cannot become a completed assessment by normalization. `completion-status` is then `MALFORMED`, `TRUNCATED`, `REFUSED`, or `INCOMPLETE`. It is never rewritten to `COMPLETE`.

Normalization does not erase original provider wording or original severity labels. Those strings are copied. Canonical working severity is not assigned in this file.

No field in this schema, by itself, makes an attempt count toward quorum. Counting remains the Stage I.11 §6.7 and §7.4 rules plus the Stage K isolation and substitution rules. This schema adds no hidden quorum exception.

## 2. Schema identity

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

| Item              | Value                                                                                                                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema identifier | `trp.wave6.cc02.ai-assessment-output`                                                                                                                                                                                                               |
| Schema version    | `K.1-1`                                                                                                                                                                                                                                             |
| File              | `normalized-assessment.json`                                                                                                                                                                                                                        |
| Encoding          | UTF-8, no BOM                                                                                                                                                                                                                                       |
| Canonical form    | One JSON object. Keys appear in the order listed in §3. No extra keys. No duplicate keys. Strings are Unicode. Integers have no leading zeros. Hex digests are 64 lowercase characters. Timestamps are `YYYY-MM-DDTHH:MM:SSZ` as in Stage I.11 §5.4 |

Unknown keys reject the file. The raw response remains available. Rejection of the normalized file does not delete `response.bin`. A rejected normalized file is not a completed assessment.

## 3. Fields

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

| Order | Field                     | Required | Null | Rule                                                                                                                                          |
| ----- | ------------------------- | -------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `schema-id`               | yes      | no   | Exact `trp.wave6.cc02.ai-assessment-output`                                                                                                   |
| 2     | `schema-version`          | yes      | no   | Exact `K.1-1`                                                                                                                                 |
| 3     | `provider`                | yes      | no   | `Anthropic`, `OpenAI`, or `Google`                                                                                                            |
| 4     | `model`                   | yes      | no   | The D3 model for that provider                                                                                                                |
| 5     | `api`                     | yes      | no   | `first-party-claude`, `first-party-openai`, or `paid-gemini-developer`                                                                        |
| 6     | `attempt-id`              | yes      | no   | `ATTEMPT-` plus 32 lowercase hex digits, equal to the seal                                                                                    |
| 7     | `package-version`         | yes      | no   | The Package Anchor token                                                                                                                      |
| 8     | `package-anchor-ref`      | yes      | no   | The accepted Package Anchor `po-decision-ref`, or `NONE` if no accepted anchor exists. `NONE` cannot be a counting assessment                 |
| 9     | `evidence-anchor-ref`     | yes      | no   | The Evidence Anchor id, or `NONE` until that record exists. The normalizer does not create the anchor                                         |
| 10    | `assessment-utc`          | yes      | no   | Capture timestamp of the response                                                                                                             |
| 11    | `assessment-outcome`      | yes      | no   | Closed token in §4. Not a review-level outcome                                                                                                |
| 12    | `completion-status`       | yes      | no   | Closed token in §5                                                                                                                            |
| 13    | `finding-count`           | yes      | no   | Integer 0 through 500, equal to the findings array length                                                                                     |
| 14    | `findings`                | yes      | no   | Array of finding objects under `STAGE-K-FIND-1`. Empty array only when `assessment-outcome` is `NO-FINDINGS-STATED` or a non-complete outcome |
| 15    | `observations`            | yes      | no   | Array of strings copied from the provider. Empty array if none were stated. Each item is original wording                                     |
| 16    | `unresolved-questions`    | yes      | no   | Array of strings. Empty array if the provider stated none                                                                                     |
| 17    | `explicit-limitations`    | yes      | no   | Array of strings. Empty array is valid only when the provider explicitly said there were none, recorded as one item `PROVIDER-STATED-NONE`    |
| 18    | `refusal-status`          | yes      | no   | `NONE`, `EXPLICIT-REFUSAL`, or `SAFETY-REFUSAL`                                                                                               |
| 19    | `truncation-status`       | yes      | no   | `NONE`, `TRUNCATED`, or `INTERRUPTED`                                                                                                         |
| 20    | `malformed-output-status` | yes      | no   | `NONE` or `MALFORMED`                                                                                                                         |
| 21    | `correlation-status`      | yes      | no   | `ID-LINK`, `TRANSPORT-PAIR`, `TEMPORAL-ONLY`, `NONE`, or `NOT-ESTABLISHED`                                                                    |
| 22    | `seal-ref`                | yes      | no   | `seal-record-sha256` 64 lowercase hex digits, or `NONE` if the seal is absent                                                                 |
| 23    | `response-sha256`         | yes      | no   | SHA-256 of `response.bin`, or `RESPONSE-NOT-EVIDENCED`                                                                                        |
| 24    | `material-scope-coverage` | yes      | no   | Array of the five scope tokens in §6, each with `REVIEWED` or `NOT-REVIEWED`                                                                  |
| 25    | `normalizer-note`         | yes      | no   | `PROJECTION-ONLY` or `UNREADABLE-RESPONSE`                                                                                                    |

Optional objects are not used. A value that would have been optional is a required closed token, including `NONE`.

`provider`, `model`, and `api` must match one D3 triple. A Google triple may be recorded. It cannot be a counting assessment while Google privacy is deferred.

## 4. Assessment outcome tokens

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

These tokens describe the provider response. They are not `PASS WITH OBSERVATIONS`, `BLOCKED — UNRESOLVED CRITICAL/HIGH`, or `INCONCLUSIVE / NOT COMPLETED`.

| Token                      | Meaning                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `FINDINGS-RECORDED`        | The raw response states one or more findings and the material-scope items are marked `REVIEWED` |
| `NO-FINDINGS-STATED`       | The provider explicitly stated that material scope was reviewed and no finding was offered      |
| `REFUSED`                  | Explicit refusal                                                                                |
| `UNABLE-TO-ASSESS`         | The provider states it did not review one or more material-scope items                          |
| `NOT-A-NORMALIZED-OUTCOME` | The raw bytes do not support a projection                                                       |

If the raw response contains a review-level token, that string is preserved inside the finding or observation text. It is not copied into `assessment-outcome` and it is not the review outcome.

## 5. Completion status

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

| Token        | When it is used                                                                                                                                                                                                   | May count                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `COMPLETE`   | Raw response is fully retained, `malformed-output-status` is `NONE`, `truncation-status` is `NONE`, `refusal-status` is `NONE`, every material-scope item is `REVIEWED`, and mandatory finding fields are present | Only if the Stage I.11 counting rules and Stage K isolation rules also pass |
| `INCOMPLETE` | A mandatory element or a material-scope item is missing                                                                                                                                                           | No                                                                          |
| `MALFORMED`  | The response cannot be parsed into the finding fields without guessing                                                                                                                                            | No                                                                          |
| `REFUSED`    | `refusal-status` is not `NONE`                                                                                                                                                                                    | No                                                                          |
| `TRUNCATED`  | `truncation-status` is not `NONE`                                                                                                                                                                                 | No                                                                          |

`COMPLETE` together with `malformed-output-status` other than `NONE`, or together with a `NOT-REVIEWED` scope item, is a grammar failure. The file is rejected.

## 6. Material scope

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

The five coverage tokens, carried from the recovered Stage I.8 §7 scope, are:

1. `BOUND-SQL-TEXT`
2. `P3-B-EXCLUSION`
3. `PUBLICATION-AND-K5-BOUNDARY`
4. `FAIL-CLOSED-GUARD-AND-FRAGMENT-LIMIT`
5. `D-GAP-SEMANTICS-IN-PACKAGE`

`NOT-REVIEWED` on any item forbids `completion-status: COMPLETE`.

## 7. Validation

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

The parser rejects the normalized file when any required field is missing, any enum is outside its list, `finding-count` disagrees with the array, a finding fails `STAGE-K-FIND-1`, or `completion-status: COMPLETE` contradicts §5. Rejection leaves the attempt non-counting. The parser does not repair the file.

The raw response hash must equal `response-sha256` when that field is a digest. A mismatch rejects the normalized file and does not alter `response.bin`.
