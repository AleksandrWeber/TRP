# Stage K — Isolation Semantics Proposal

**Document ID:** `STAGE-K-ISO-1`
**Version:** `K.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`
**Creation date:** 2026-11-01

**Hash record:** The SHA-256 of this file is recorded in `docs/project/version-3/wave-6/stage-k-d4-blocker-resolution-and-po-review-brief.md`. This file does not embed its own digest.

This document is a proposal. It does not execute an isolation check and does not approve Decision 4.

**Sources:** recovered Stage I.9 §8, transcript `57d05bb8-80b9-4bf5-a312-9f996959a547`, JSONL line 45, SHA-256 `96edf39e57ad1d43e9ea45a60e02749aa96dcf29e87ec4ea06bbf0cc8fa8ace6`; Stage I.11 §6.7, where `ISOLATION-NOT-EVIDENCED` appears only in the capture-status list. Provenance limits are in `stage-k-stage-i8-i10-provenance-report.md`.

---

## 1. Recovered meaning

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

The recovered Stage I.9 text says:

> If `instructions-observable` is `PARTIAL`, or class `SUBMITTED` is missing, isolation is `ISOLATION-NOT-EVIDENCED`. That is not a proven breach. It is also not a quorum-counting assessment.

The same section says a negative search of the transmitted request is `NEGATIVE-SEARCH-NOT-PROOF` and is not evidence of absence. Proven leakage invalidates that assessment. Missing `SUBMITTED` bytes are also described there as non-counting. Stage I.11 later lists both `ISOLATION-NOT-EVIDENCED` and `TRANSMISSION-NOT-EVIDENCED` as capture-status tokens and does not restate a trigger for the isolation token.

The recovered sentence therefore establishes an intended meaning, and it also overlaps transmission failure with isolation. This proposal keeps the recovered meaning and splits the overlap so one condition does not satisfy two tokens.

## 2. What the token is not

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

`ISOLATION-NOT-EVIDENCED` is not:

- proof that a provider execution environment failed to isolate tenants;
- proof of a breach;
- a statement about hidden provider instructions, which remain `OUTSIDE-OPERATOR-CAPTURE` under Stage I.11 §6.5 and do not by themselves fail a seal;
- organizational separation of duties between preparer, verifier, and custodian, which remains Stage I.11 §7;
- a storage-ACL failure. No such store was verified, and this token is not used as a substitute for that gap.

A local capture does not prove provider-side isolation.

## 3. Tokens

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

### 3.1 `ISOLATION-NOT-EVIDENCED`

**Meaning.** The retained transmitted request exists, and the verifier still cannot show that operator-controlled instructions were fully captured or cannot run the cross-disclosure search on that file.

**Trigger.** All of the following:

1. `transmitted-request.bin` is present and its whole-file length and SHA-256 match the seal, so the status is not `TRANSMISSION-NOT-EVIDENCED`.
2. Either `instructions-observable` is `PARTIAL`, or the verifier cannot search that file for a prior response digest or a retained excerpt.

**Required evidence.** The retained request file, the instruction-observability mark, and a recorded search result of `NOT-RUN` or an observability mark of `PARTIAL`.

**Verifier.** The seal verifier, who is not the capture operator. The capture operator's own statement is not this check.

**Attempt.** Non-counting. `capture-status` is `ISOLATION-NOT-EVIDENCED`. This is not a proven breach.

**Quorum.** The attempt does not count. The review stays `INCONCLUSIVE / NOT COMPLETED`. No N−1.

**Remediation.** The same attempt is not repaired into `COMPLETE`. A later attempt may be proposed only under `STAGE-K-SUB-1`. This proposal does not authorize that attempt.

**Overall completion.** Blocks a completed three-anchor quorum for as long as a required provider has only this result and no later counting attempt.

**Change from the recovered sentence.** Missing `SUBMITTED` bytes are not also labelled with this token. They use `TRANSMISSION-NOT-EVIDENCED` only. That split is a proposal. It is not a claim that Stage I.9 already separated the tokens.

### 3.2 `CROSS-DISCLOSURE-DETECTED`

**Meaning.** A later transmitted request contains a prior attempt's response SHA-256 or a retained excerpt of that prior response.

**Trigger.** The seal verifier finds that material in `transmitted-request.bin` for the later attempt.

**Required evidence.** The later request file and the earlier response digest or excerpt that matched.

**Verifier.** The seal verifier, who is not the capture operator.

**Attempt.** The later attempt is invalid and does not count. This is the recovered Stage I.9 "proven leakage" case, under a distinct token so it is not stored as mere non-evidence.

**Quorum.** The later attempt does not count. No automatic replacement.

**Remediation.** No edit of the later request converts it into a clean attempt. A new attempt would be a different id under `STAGE-K-SUB-1`.

**Overall completion.** Blocks quorum use of that attempt.

### 3.3 Tokens already defined elsewhere

`TRANSMISSION-NOT-EVIDENCED` remains the Stage I.11 token for a request whose sent bytes were not retained. It is not an isolation result.

Organizational separation of duties remains Stage I.11 §7.1 and §7.4. Failure of that separation makes an anchor non-counting. It is not recorded as `ISOLATION-NOT-EVIDENCED`.

## 4. Consequence summary

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

| Token                        | Counts toward quorum | Proves provider-side isolation | Proves a breach                            |
| ---------------------------- | -------------------- | ------------------------------ | ------------------------------------------ |
| `ISOLATION-NOT-EVIDENCED`    | No                   | No                             | No                                         |
| `CROSS-DISCLOSURE-DETECTED`  | No                   | No                             | Records a hit in the captured request only |
| `TRANSMISSION-NOT-EVIDENCED` | No                   | No                             | No                                         |

Negative search remains `NEGATIVE-SEARCH-NOT-PROOF`. It does not establish that cross-disclosure did not occur. It does not by itself create `ISOLATION-NOT-EVIDENCED`.
