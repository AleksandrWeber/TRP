# Stage M — Provider Isolation and Cross-Disclosure Proposal

**Document ID:** `STAGE-M-ISO-1`
**Version:** `M.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This document is a proposal. It does not run an isolation check, contact a provider, or approve Decision 4. If later adopted, it supersedes the excerpt trigger in recovered Stage I.9 §8 and the overlap in `STAGE-K-ISO-1` §3.2. Stage I.11 is not edited.

The local verifier cannot prove provider-side isolation, receipt, or processing. None of these tokens is an isolation PASS.

---

## 1. Four results

Exactly one `isolation-result` is stored. Precedence is the table order. The first matching row wins.

| Order | Token                          | Test                                                                                                                   |
| ----- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 1     | `TRANSMISSION-NOT-EVIDENCED`   | `transmitted-request.bin` is absent, unreadable by the seal verifier, or its length or SHA-256 does not match the seal |
| 2     | `CROSS-DISCLOSURE-DETECTED`    | The request file is intact and §3 finds a delimited prior-response digest                                              |
| 3     | `ISOLATION-NOT-EVIDENCED`      | The request file is intact, and `instructions-observable` is `PARTIAL`, or the digest search was not run               |
| 4     | `NO-CROSS-DISCLOSURE-OBSERVED` | The request file is intact, `instructions-observable` is `FULL`, the digest search was run, and §3 found no hit        |

`TRANSMISSION-NOT-EVIDENCED` is not also labeled `ISOLATION-NOT-EVIDENCED`. That split is a proposal. It replaces the recovered Stage I.9 sentence that used `ISOLATION-NOT-EVIDENCED` for missing `SUBMITTED` bytes.

`NO-CROSS-DISCLOSURE-OBSERVED` means the delimited search missed. It does not prove that cross-disclosure did not occur. It does not prove provider-side isolation. It is not a review-level PASS.

## 2. Why the token is not one bit

When the result is `ISOLATION-NOT-EVIDENCED`, `isolation-gap-reason` is required. Otherwise it is `NONE`.

| Reason                 | When                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| `PARTIAL-INSTRUCTIONS` | `instructions-observable` is `PARTIAL`. This wins if the search was also not run |
| `SEARCH-NOT-RUN`       | Instructions are `FULL` and the search was not run                               |

Stage I.11 capture-status `PARTIAL-INSTRUCTIONS` remains available on the seal. If both that seal token and `ISOLATION-NOT-EVIDENCED` could apply, the seal capture-status is `ISOLATION-NOT-EVIDENCED` and `isolation-gap-reason` is `PARTIAL-INSTRUCTIONS`. The attempt does not count under either name.

## 3. Digest match

Excerpt matching is retired. A shared SQL word, a shared sentence, or a hex string that is not a full delimited digest is not a hit. The retirement is the false-positive control.

A hit is a match of a prior attempt's `response.bin` SHA-256, all of the following:

1. The candidate is the 64-character lowercase hex digest already recorded for that prior response. Uppercase is not a match. A proper substring of the digest is not a match.
2. The candidate occurs in `transmitted-request.bin` decoded as UTF-8. Bytes that are not valid UTF-8 are searched as raw bytes for the 64 ASCII hex bytes of the digest.
3. The character before the candidate, if any, is not in `0-9a-f`. The character after the candidate, if any, is not in `0-9a-f`. Start and end of the file are boundaries.
4. The verifier records the prior `attempt-id`, the prior digest, and the byte offset of the match.

The seal verifier, who is not the capture operator, runs the search. The capture operator's statement is not the result. A search that was not run is `SEARCH-NOT-RUN`, not a miss.

## 4. Session

A provider session is the conversation or session the provider associates with the attempt.

| `session-separation`     | Rule                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEW-SESSION-ATTESTED`   | The interface exposed a session id, it differs from every earlier attempt's session id for this review, and the operator attests that no prior provider output was reused as conversation state |
| `SESSION-REUSED`         | The exposed session id equals an earlier attempt's session id for this review                                                                                                                   |
| `SESSION-ID-UNAVAILABLE` | The interface exposes session ids and this attempt has none                                                                                                                                     |
| `SESSION-ID-NOT-EXPOSED` | The interface does not expose a session id. The operator attests a new conversation. The attestation is not proof                                                                               |

The recovered Stage I.9 control, "a new provider session, with no reused conversation containing another provider's output," is **retained** as this mandatory preventive control. It is not superseded and it is not retired. It does not by itself prove the sent bytes, and it does not prove provider-side isolation.

`SESSION-REUSED` and `SESSION-ID-UNAVAILABLE` do not count. `SESSION-ID-NOT-EXPOSED` may count only when `isolation-result` is `NO-CROSS-DISCLOSURE-OBSERVED` and every other counting rule passes. The attestation remains a statement, not proof of non-leakage.

## 5. Effect on the attempt and the review

| State                                        | Counts                                          | Means a successful isolation check |
| -------------------------------------------- | ----------------------------------------------- | ---------------------------------- |
| `TRANSMISSION-NOT-EVIDENCED`                 | No                                              | No                                 |
| `ISOLATION-NOT-EVIDENCED`                    | No                                              | No                                 |
| `CROSS-DISCLOSURE-DETECTED`                  | No                                              | No                                 |
| `NO-CROSS-DISCLOSURE-OBSERVED`               | Only together with §4 and `STAGE-M-ASSESS-1` §9 | No                                 |
| `SESSION-REUSED` or `SESSION-ID-UNAVAILABLE` | No                                              | No                                 |

The same attempt is not repaired into `COMPLETE`. A later attempt is a new id under `STAGE-M-SUB-1` and is not authorized by this file. While a required roster identity has no counting attempt, the review stays `INCONCLUSIVE / NOT COMPLETED`. There is no N−1.

A negative search remains unable to prove absence. Paraphrase, compression, and provider-internal instructions stay outside the search. Provider-internal instructions remain `OUTSIDE-OPERATOR-CAPTURE` under Stage I.11 §6.5 and do not by themselves fail a seal.

Organizational separation of duties stays in Stage I.11 §7. It is not recorded as `ISOLATION-NOT-EVIDENCED`.

## 6. Probes

| Probe                                                                          | Result                                                                                         |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Prior response digest, delimited, in a later request                           | `CROSS-DISCLOSURE-DETECTED`                                                                    |
| The same 64 hex digits with a hex character immediately before or after them   | Not a match                                                                                    |
| A short excerpt or a shared SQL keyword                                        | Not a match. Excerpt search is retired                                                         |
| Request bytes unavailable                                                      | `TRANSMISSION-NOT-EVIDENCED` only                                                              |
| Request intact, instructions `PARTIAL`                                         | `ISOLATION-NOT-EVIDENCED`, reason `PARTIAL-INSTRUCTIONS`                                       |
| Request intact, search not run                                                 | `ISOLATION-NOT-EVIDENCED`, reason `SEARCH-NOT-RUN`                                             |
| Two attempts share a session id                                                | `SESSION-REUSED`. The attempt does not count even if the digest search is clean                |
| Retry after a refusal, refusal digest absent from the new request, new session | No cross-disclosure token. The retry still requires `STAGE-M-SUB-1` and is not authorized here |
