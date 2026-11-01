# Stage Q — Counting Attempt and Isolation Specification

**Document ID:** `STAGE-Q-COUNT-1`
**Schema version:** `Q.1-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This file resolves the equal-timestamp tie in `STAGE-O-MAJ-1` §5 and separates capture status from isolation result. It does not approve Decision 4, authorize a send, or prove provider-side isolation.

Assessment schema version for a later normalized file is `Q.1-1`. That version is the Stage M assessment field list only where `STAGE-Q-ADOPT-1` inherits a section, plus the fields this file adds.

---

## 1. One counting slot

Each roster identity has at most one `COUNTING` coverage record. The roster identities are the three strings in `STAGE-Q-AUTH-1`. Selection cannot move a slot from one identity to another. The candidate set is filtered to one identity before the tie-break.

If any attempt for that identity has `isolation-result` `CROSS-DISCLOSURE-DETECTED`, or `session-separation` `SESSION-REUSED`, the coverage record is `NOT-COUNTING` with that reason. A cleaner sibling does not restore counting. The disqualifying attempt keeps that reason. Every other attempt for the identity is `NOT-COUNTING` with `non-counting-reason` `SIBLING-DISQUALIFIED`. Those attempts remain evidence. They are not a vote and they are not `NOT-SELECTED`.

Otherwise the eligible attempts are those that meet every counting rule, have `isolation-result` `NO-CROSS-DISCLOSURE-OBSERVED`, and have `session-separation` `NEW-SESSION-ATTESTED` or `SESSION-ID-NOT-EXPOSED`. Sort those attempts by `seal-utc` ascending, then by `attempt-id` ascending, as raw ASCII byte order. The first row is the counting attempt. Each later eligible attempt is `NOT-COUNTING` with `NOT-SELECTED`. Their ids are listed in `non-selected-attempt-ids` in that same sort order.

`seal-utc` is `YYYY-MM-DDTHH:MM:SSZ`. Equal timestamps are a tie, not an error. The `attempt-id` comparison does not read directory order and does not read execution order. `attempt-id` is `ATTEMPT-` plus 32 lowercase hex digits, so the order is fixed by the identifier the attempt already carries.

`NOT-SELECTED` is not a quorum vote and is not evidence of safety. Two attempts never count as two providers.

A region change is `HOSTING-CHANGE`. An operational-control change of the organization operating the endpoint, while the contracting entity string is unchanged, is `OWNERSHIP-CHANGE`. Neither is `RETRY-SAME-CONFIGURATION`. Neither grants a send.

## 2. Separate enums

These enums are not interchangeable. A shared spelling does not make the fields the same field. The successor rule does not copy `isolation-result` into `capture-status`. That sentence replaces the overwrite in `STAGE-O-MAJ-1` §4 and `STAGE-M-ISO-1` §2.

| Field                          | Allowed values                                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `capture-status`               | `COMPLETE`, `REFUSAL`, `TIMEOUT`, `TRUNCATED`, `MALFORMED`, `TRANSMISSION-NOT-EVIDENCED`, `ISOLATION-NOT-EVIDENCED`, `AMBIGUOUS-RESPONSE`, `ATTACHMENT-MISMATCH`, `PARTIAL-INSTRUCTIONS` |
| `isolation-result`             | `TRANSMISSION-NOT-EVIDENCED`, `CROSS-DISCLOSURE-DETECTED`, `ISOLATION-NOT-EVIDENCED`, `NO-CROSS-DISCLOSURE-OBSERVED`                                                                     |
| `isolation-gap-reason`         | `NONE`, `PARTIAL-INSTRUCTIONS`, `SEARCH-NOT-RUN`                                                                                                                                         |
| `transmission-evidence-status` | `ABSENT-OR-UNREADABLE`, `HASH-OR-LENGTH-MISMATCH`, `INTACT`                                                                                                                              |
| `instructions-observable`      | `FULL`, `PARTIAL`                                                                                                                                                                        |
| `session-separation`           | `NEW-SESSION-ATTESTED`, `SESSION-REUSED`, `SESSION-ID-UNAVAILABLE`, `SESSION-ID-NOT-EXPOSED`                                                                                             |

`transmission-evidence-status` is a successor field. It records whether the local request bytes were available to the seal verifier. It does not prove that a provider received or processed those bytes.

## 3. Compatible combinations

| `isolation-result`             | `isolation-gap-reason`                                                   | `transmission-evidence-status`                      | Counts                              |
| ------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------- | ----------------------------------- |
| `TRANSMISSION-NOT-EVIDENCED`   | `NONE`                                                                   | `ABSENT-OR-UNREADABLE` or `HASH-OR-LENGTH-MISMATCH` | No                                  |
| `CROSS-DISCLOSURE-DETECTED`    | `NONE`                                                                   | `INTACT`                                            | No                                  |
| `ISOLATION-NOT-EVIDENCED`      | `PARTIAL-INSTRUCTIONS` when instructions are `PARTIAL`                   | `INTACT`                                            | No                                  |
| `ISOLATION-NOT-EVIDENCED`      | `SEARCH-NOT-RUN` when instructions are `FULL` and the search was not run | `INTACT`                                            | No                                  |
| `NO-CROSS-DISCLOSURE-OBSERVED` | `NONE`                                                                   | `INTACT`                                            | Only with every other counting rule |

`PARTIAL-INSTRUCTIONS` wins over `SEARCH-NOT-RUN` when both could be described. Storing `SEARCH-NOT-RUN` while instructions are `PARTIAL` is invalid.

When `capture-status` is `PARTIAL-INSTRUCTIONS` and `isolation-result` is `ISOLATION-NOT-EVIDENCED`, `isolation-gap-reason` is `PARTIAL-INSTRUCTIONS` and `capture-status` stays `PARTIAL-INSTRUCTIONS`. A record that overwrites `capture-status` with the isolation token is invalid.

Any other combination rejects the normalized file. The attempt does not count.

## 4. What the tokens do not prove

`NO-CROSS-DISCLOSURE-OBSERVED` means the delimited digest search missed. It does not prove that cross-disclosure did not occur and does not prove provider-side isolation.

An empty prior set, with an intact request, `FULL` instructions, and a search that was run, is a completed search with no hit. It is `NO-CROSS-DISCLOSURE-OBSERVED` and gap `NONE`. It is not `SEARCH-NOT-RUN`. It is not proof of provider-side isolation. A local hash is not proof of receipt or processing.

The digest match itself remains the rule in inherited `STAGE-M-ISO-1` §3: a full delimited lowercase `response.bin` digest, not an excerpt and not a shared SQL word.

## 5. Checks that were run

| Test                             | Input                                                                                           | Expected                                  | Actual                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------- |
| `Q6-EQUAL-TIME-WINNER`           | Two eligible attempts, same `seal-utc`, ids `aa…` and `ab…`                                     | Winner `ATTEMPT-` plus `aa` repeated      | Same                                |
| `Q6-ORDER-INDEPENDENT`           | The same two attempts reversed                                                                  | Same winner                               | Same                                |
| `Q6-LOSER-RETAINED`              | The `ab…` attempt                                                                               | Present in `non-selected-attempt-ids`     | Present                             |
| `Q6-NOT-A-VOTE`                  | That selection                                                                                  | `vote` false                              | False                               |
| `Q6-EARLIEST`                    | Three retries at `00:00:03Z`, `00:00:01Z`, `00:00:02Z`                                          | Winner is the `00:00:01Z` attempt         | Same                                |
| `Q6-RETRY-COUNT`                 | Those three                                                                                     | Two non-selected ids                      | `2`                                 |
| `Q6-CROSS-COVERAGE`              | One clean attempt and one `CROSS-DISCLOSURE-DETECTED` sibling                                   | `NOT-COUNTING`                            | `NOT-COUNTING`                      |
| `Q6-CROSS-REASON`                | That pair                                                                                       | `CROSS-DISCLOSURE-DETECTED`               | Same                                |
| `Q6-CROSS-WINNER`                | That pair                                                                                       | No winner                                 | None                                |
| `Q6-SESSION-COVERAGE`            | One clean attempt and one `SESSION-REUSED` sibling                                              | `NOT-COUNTING`                            | `NOT-COUNTING`                      |
| `Q6-NO-PROVIDER-SWITCH`          | Anthropic and OpenAI each have one eligible attempt                                             | Anthropic keeps its own attempt           | Same                                |
| `Q6-OTHER-PROVIDER`              | That pair                                                                                       | OpenAI keeps its own attempt              | Same                                |
| `Q7-OVERLAP-KEEPS-CAPTURE`       | Capture `PARTIAL-INSTRUCTIONS`, isolation `ISOLATION-NOT-EVIDENCED`, gap `PARTIAL-INSTRUCTIONS` | Compatible                                | `OK`                                |
| `Q7-OVERWRITE-REJECTED`          | Same facts with the overwrite flag                                                              | Rejected                                  | `overwrite-forbidden`               |
| `Q7-EMPTY-PRIOR`                 | Empty prior set, search run, no hit                                                             | Compatible `NO-CROSS-DISCLOSURE-OBSERVED` | `OK`                                |
| `Q7-EMPTY-PRIOR-NOT-SEARCH-SKIP` | Empty prior set stored as `SEARCH-NOT-RUN`                                                      | Rejected                                  | `empty-prior-is-not-search-not-run` |
| `Q7-TRANSMISSION-SPLIT`          | Absent bytes with `NO-CROSS-DISCLOSURE-OBSERVED`                                                | Rejected                                  | `transmission-isolation`            |
| `Q7-SEARCH-NOT-RUN`              | Intact request, full instructions, search not run, prior set not empty                          | Compatible                                | `OK`                                |

All of these results are `PASS`.

## 6. What this file does not do

It does not contact a provider, create an account, send package bytes, create an anchor, or prove isolation.
