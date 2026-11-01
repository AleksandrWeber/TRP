# Stage M — AI Assessment Schema Remediation Proposal

**Document ID:** `STAGE-M-ASSESS-1`
**Schema:** `trp.wave6.cc02.ai-assessment-output`
**Schema version:** `M.1-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This document is a proposal. It does not approve Decision 4, authorize a provider call, or amend Stage I.11. A normalized assessment does not establish quorum and does not grant SQL EXEC or Census EXEC.

If later adopted, this schema supersedes `STAGE-K-ASSESS-1`. The Stage I.11 §6.7 bullet that requires "Stage I.9 mandatory assessment content" is superseded only as stated in §8. The Stage I.11 file is not edited.

---

## 1. Two representations

`response.bin` is the raw provider response for the attempt. Its bytes are not rewritten.

`normalized-assessment.json` is a separate UTF-8 JSON document. It is a projection of the raw response plus seal metadata. It does not replace `response.bin`. Missing text is recorded with a closed gap token. It is not invented.

A raw response that is malformed, truncated, refused, timed out, or incomplete cannot obtain `completion-status` `COMPLETE`.

## 2. Canonical parsing

| Item        | Rule                                                                                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Encoding    | UTF-8, no BOM                                                                                                                                                                                                   |
| Top type    | One JSON object                                                                                                                                                                                                 |
| Keys        | Order fixed in §3. The same rule applies inside every nested object. No extra keys. No duplicate keys                                                                                                           |
| Null        | Rejected on every field. Absence uses a closed token                                                                                                                                                            |
| Strings     | Unicode. Enumeration values are exact                                                                                                                                                                           |
| Integers    | No leading zeros. No fraction. No exponent                                                                                                                                                                      |
| Hex         | 64 lowercase characters `0-9a-f` when the field is a digest                                                                                                                                                     |
| Timestamp   | `YYYY-MM-DDTHH:MM:SSZ`. Year `2026` through `2099`. Month and day must be a real Gregorian date. Hour `00`–`23`. Minute and second `00`–`59`. Second `60` is rejected. No fractional seconds. No numeric offset |
| Whitespace  | Allowed by JSON. The evidence digest is SHA-256 of the retained file bytes. Validators do not reserialize before comparing that digest                                                                          |
| Unknown key | Reject the normalized file. Keep `response.bin`                                                                                                                                                                 |

## 3. Fields

All fields are required.

| Order | Field                     | Type                | Rule                                                                                              |
| ----- | ------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| 1     | `schema-id`               | string              | Exact `trp.wave6.cc02.ai-assessment-output`                                                       |
| 2     | `schema-version`          | string              | Exact `M.1-1`                                                                                     |
| 3     | `provider`                | enum                | `Anthropic`, `OpenAI`, or `Google`                                                                |
| 4     | `model`                   | enum                | `claude-opus-5-5` for Anthropic, `gpt-6.1-sol` for OpenAI, `gemini-4-argon` for Google            |
| 5     | `api`                     | enum                | `first-party-claude`, `first-party-openai`, or `paid-gemini-developer`, matching the provider     |
| 6     | `attempt-id`              | string              | `ATTEMPT-` plus 32 lowercase hex digits                                                           |
| 7     | `package-version`         | string              | 1 to 128 characters matching `[A-Za-z0-9._-]{1,128}`                                              |
| 8     | `package-anchor-ref`      | string              | Accepted Package Anchor reference, or `NONE`                                                      |
| 9     | `evidence-anchor-ref`     | string              | Evidence Anchor id, or `NONE`. The normalizer does not create the anchor                          |
| 10    | `assessment-utc`          | timestamp or `NONE` | Capture time of the response. `NONE` only when no response bytes exist                            |
| 11    | `assessment-outcome`      | enum                | §4                                                                                                |
| 12    | `completion-status`       | enum                | §5                                                                                                |
| 13    | `finding-count`           | integer             | `0` through `500`, equal to `findings.length`                                                     |
| 14    | `findings`                | array               | Finding objects under `STAGE-M-FIND-1`. Unique `finding-instance-id`. Contiguous sequences from 1 |
| 15    | `observations`            | array of strings    | Copied provider observations. Empty array if none. Each string length 1 to 2,000                  |
| 16    | `unresolved-questions`    | array of strings    | Empty array if the provider stated none. Each string length 1 to 2,000                            |
| 17    | `explicit-limitations`    | array of strings    | §6. Empty array is invalid                                                                        |
| 18    | `refusal-status`          | enum                | `NONE`, `EXPLICIT-REFUSAL`, or `SAFETY-REFUSAL`                                                   |
| 19    | `truncation-status`       | enum                | `NONE`, `TRUNCATED`, or `INTERRUPTED`                                                             |
| 20    | `timeout-status`          | enum                | `NONE` or `TIMEOUT`                                                                               |
| 21    | `malformed-output-status` | enum                | `NONE` or `MALFORMED`                                                                             |
| 22    | `correlation-status`      | enum                | `ID-LINK`, `TRANSPORT-PAIR`, `TEMPORAL-ONLY`, `NONE`, or `NOT-ESTABLISHED`                        |
| 23    | `seal-ref`                | string              | 64 lowercase hex digits, or `NONE`                                                                |
| 24    | `response-sha256`         | string              | 64 lowercase hex digits, or `RESPONSE-NOT-EVIDENCED`                                              |
| 25    | `material-scope-coverage` | array               | Exactly the five objects in §7, in that order                                                     |
| 26    | `normalizer-note`         | enum                | `PROJECTION-ONLY` or `UNREADABLE-RESPONSE`                                                        |
| 27    | `isolation-result`        | enum                | One token from `STAGE-M-ISO-1` §1                                                                 |
| 28    | `session-separation`      | enum                | One token from `STAGE-M-ISO-1` §4                                                                 |

`package-anchor-ref` `NONE`, `evidence-anchor-ref` `NONE`, `seal-ref` `NONE`, a Google triple while privacy is deferred, and any `isolation-result` other than `NO-CROSS-DISCLOSURE-OBSERVED` cannot count. The normalized file may still record them.

`provider`, `model`, and `api` must be one D3 triple. The D3 roster is not expanded by this schema.

## 4. Assessment outcome

These tokens describe the provider response. They are not review-level outcomes.

| Token                      | Meaning                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `FINDINGS-RECORDED`        | The raw response states one or more findings and every scope item is `REVIEWED`      |
| `NO-FINDINGS-STATED`       | The provider stated that every scope item was reviewed and offered no finding        |
| `REFUSED`                  | Explicit or safety refusal                                                           |
| `TIMED-OUT`                | The attempt ended by timeout                                                         |
| `UNABLE-TO-ASSESS`         | The provider did not review one or more scope items, without refusal or timeout      |
| `NOT-A-NORMALIZED-OUTCOME` | The raw bytes do not support a projection, or the response is truncated or malformed |

A review-level token inside the raw response is preserved in observation or finding text. It is not copied into `assessment-outcome`.

## 5. Completion status

| Token              | When it is used                                                                        | Counts                                   |
| ------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------- |
| `COMPLETE`         | §9 is satisfied                                                                        | Only if §9 and `STAGE-M-ISO-1` also pass |
| `INCOMPLETE`       | A mandatory element or scope item is missing, and no more specific token below applies | No                                       |
| `MALFORMED`        | The response cannot be parsed into finding fields without guessing                     | No                                       |
| `REFUSED`          | `refusal-status` is not `NONE`                                                         | No                                       |
| `TRUNCATED`        | `truncation-status` is not `NONE`                                                      | No                                       |
| `TIMEOUT`          | `timeout-status` is `TIMEOUT`                                                          | No                                       |
| `UNABLE-TO-ASSESS` | Outcome is `UNABLE-TO-ASSESS` and the response is readable                             | No                                       |

If more than one non-complete condition is true, the first match in this order wins: `REFUSED`, `TIMEOUT`, `TRUNCATED`, `MALFORMED`, `UNABLE-TO-ASSESS`, `INCOMPLETE`.

## 6. Explicit limitations

`explicit-limitations` is an array of 1 to 50 strings. Each string has length 1 to 2,000. The empty array is a validation failure.

| Provider situation                                        | Required array                             |
| --------------------------------------------------------- | ------------------------------------------ |
| Provider explicitly stated that there were no limitations | Exactly one item, `PROVIDER-STATED-NONE`   |
| Provider did not address limitations                      | Exactly one item, `NOT-RECORDED`           |
| Provider stated one or more limitations                   | Those strings. Neither sentinel may appear |

`NOT-RECORDED` forbids `completion-status` `COMPLETE`. `PROVIDER-STATED-NONE` is a statement, not missing data. The two sentinels cannot be combined with each other or with ordinary limitation text.

## 7. Material-scope coverage

The array has exactly these five objects, in this order. `coverage` is `REVIEWED` or `NOT-REVIEWED`.

```json
[
  { "scope-id": "BOUND-SQL-TEXT", "coverage": "REVIEWED" },
  { "scope-id": "P3-B-EXCLUSION", "coverage": "REVIEWED" },
  { "scope-id": "PUBLICATION-AND-K5-BOUNDARY", "coverage": "REVIEWED" },
  { "scope-id": "FAIL-CLOSED-GUARD-AND-FRAGMENT-LIMIT", "coverage": "REVIEWED" },
  { "scope-id": "D-GAP-SEMANTICS-IN-PACKAGE", "coverage": "REVIEWED" }
]
```

Any `NOT-REVIEWED` item forbids `COMPLETE`. Duplicate or reordered `scope-id` values reject the file.

## 8. Stage I.11 §6.7 and Stage I.9

Stage I.11 §6.7 says a seal counts only when "the Stage I.9 mandatory assessment content is present in the sealed assessment." Stage I.9 is an unsigned local transcript, not a git file, and it is not adopted.

This proposal identifies that bullet as the dependency Stage L named. It does not delete the bullet from Stage I.11.

**Retained, by restatement in this package rather than by adopting the transcript:**

- provider severity and wording are evidence and are immutable;
- working severity and the review-level outcome are human determinations;
- a provider assessment does not issue `PASS WITH OBSERVATIONS`, `BLOCKED — UNRESOLVED CRITICAL/HIGH`, or `INCONCLUSIVE / NOT COMPLETED`;
- a negative cross-disclosure search is not proof of absence;
- a local request hash is not proof of transmission, receipt, or processing;
- the five scope items in §7.

**Superseded if this package is later adopted:**

- the counting requirement that the Stage I.9 transcript itself be present;
- Stage I.9 stored literals `UNADJUDICATED`, `PREDICATE MET`, `PREDICATE NOT MET`, and `FALSE POSITIVE — PREDICATE NOT MET`;
- the Stage I.9 rule that missing `SUBMITTED` bytes are labeled `ISOLATION-NOT-EVIDENCED`;
- excerpt matching as a cross-disclosure trigger.

**Excluded:** Stage I.8, I.9, and I.10 approval sentences; Stage I.11 §10.1; Stage I.11 §12; any reading that adopts the whole Stage I.11 file.

**Normative source after a later adoption:** `STAGE-M-ASSESS-1` for this schema, `STAGE-M-FIND-1` for findings, `STAGE-M-SEV-1` for the block, `STAGE-M-ISO-1` for isolation, and the Stage I.11 sections listed as retained in `STAGE-M-ADOPT-1`. Until that adoption, the Stage I.11 bullet remains unadopted draft text pointing at unadopted transcript text.

## 9. What may count

`completion-status` `COMPLETE` is valid only when every row below holds. Otherwise the file is rejected if it claims `COMPLETE`, and the attempt does not count.

| Requirement                                                                        | Value                                                                                                          |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `assessment-outcome`                                                               | `FINDINGS-RECORDED` or `NO-FINDINGS-STATED`                                                                    |
| `refusal-status`, `truncation-status`, `timeout-status`, `malformed-output-status` | all `NONE`                                                                                                     |
| `normalizer-note`                                                                  | `PROJECTION-ONLY`                                                                                              |
| `material-scope-coverage`                                                          | every item `REVIEWED`                                                                                          |
| `explicit-limitations`                                                             | not `NOT-RECORDED`                                                                                             |
| `findings`                                                                         | empty only for `NO-FINDINGS-STATED`; non-empty only for `FINDINGS-RECORDED`                                    |
| `finding-count`                                                                    | equal to the array length                                                                                      |
| each finding                                                                       | valid under `STAGE-M-FIND-1`                                                                                   |
| `response-sha256`                                                                  | a digest equal to the retained `response.bin`                                                                  |
| `seal-ref`                                                                         | a digest, not `NONE`                                                                                           |
| `package-anchor-ref` and `evidence-anchor-ref`                                     | not `NONE`                                                                                                     |
| `isolation-result`                                                                 | `NO-CROSS-DISCLOSURE-OBSERVED`                                                                                 |
| `session-separation`                                                               | `NEW-SESSION-ATTESTED` or `SESSION-ID-NOT-EXPOSED`                                                             |
| provider                                                                           | not Google while privacy is deferred                                                                           |
| anchors                                                                            | the Stage I.11 counting conditions that `STAGE-M-ADOPT-1` retains, including `package-payload-identity: MATCH` |

`COMPLETE` together with any forbidden combination is a validation failure. The parser does not repair the file. Rejection leaves the attempt non-counting.

### Allowed outcome and completion pairs

| Outcome                    | Completion values that are valid          |
| -------------------------- | ----------------------------------------- |
| `FINDINGS-RECORDED`        | `COMPLETE` or `INCOMPLETE`                |
| `NO-FINDINGS-STATED`       | `COMPLETE` or `INCOMPLETE`                |
| `REFUSED`                  | `REFUSED` only                            |
| `TIMED-OUT`                | `TIMEOUT` only                            |
| `UNABLE-TO-ASSESS`         | `UNABLE-TO-ASSESS` or `INCOMPLETE`        |
| `NOT-A-NORMALIZED-OUTCOME` | `MALFORMED`, `TRUNCATED`, or `INCOMPLETE` |

Any other pair rejects the file. `FINDINGS-RECORDED` with an empty array, and `NO-FINDINGS-STATED` with a non-empty array, reject the file.

A wrong `package-anchor-ref`, meaning a value other than `NONE` that is not the accepted Package Anchor for the seal, rejects the file.

Duplicate `finding-instance-id` values reject the file.

An unknown key in the raw provider JSON does not by itself make the raw response malformed. The normalizer does not copy unknown raw keys into the normalized object. An unknown key in the normalized object rejects that object.

## 10. Example of a readable non-counting projection

This example is synthetic. It is not a provider response. The outcome is `TIMED-OUT`, so the findings array is empty. `seal-ref` is `NONE`, so §9 forbids counting.

```json
{
  "schema-id": "trp.wave6.cc02.ai-assessment-output",
  "schema-version": "M.1-1",
  "provider": "Anthropic",
  "model": "claude-opus-5-5",
  "api": "first-party-claude",
  "attempt-id": "ATTEMPT-0123456789abcdef0123456789abcdef",
  "package-version": "pkg-synthetic-0",
  "package-anchor-ref": "NONE",
  "evidence-anchor-ref": "NONE",
  "assessment-utc": "NONE",
  "assessment-outcome": "TIMED-OUT",
  "completion-status": "TIMEOUT",
  "finding-count": 0,
  "findings": [],
  "observations": [],
  "unresolved-questions": [],
  "explicit-limitations": ["NOT-RECORDED"],
  "refusal-status": "NONE",
  "truncation-status": "NONE",
  "timeout-status": "TIMEOUT",
  "malformed-output-status": "NONE",
  "correlation-status": "NOT-ESTABLISHED",
  "seal-ref": "NONE",
  "response-sha256": "RESPONSE-NOT-EVIDENCED",
  "material-scope-coverage": [
    { "scope-id": "BOUND-SQL-TEXT", "coverage": "NOT-REVIEWED" },
    { "scope-id": "P3-B-EXCLUSION", "coverage": "NOT-REVIEWED" },
    { "scope-id": "PUBLICATION-AND-K5-BOUNDARY", "coverage": "NOT-REVIEWED" },
    { "scope-id": "FAIL-CLOSED-GUARD-AND-FRAGMENT-LIMIT", "coverage": "NOT-REVIEWED" },
    { "scope-id": "D-GAP-SEMANTICS-IN-PACKAGE", "coverage": "NOT-REVIEWED" }
  ],
  "normalizer-note": "UNREADABLE-RESPONSE",
  "isolation-result": "TRANSMISSION-NOT-EVIDENCED",
  "session-separation": "SESSION-ID-UNAVAILABLE"
}
```

The example is valid as a non-counting record and invalid as a counting assessment.
