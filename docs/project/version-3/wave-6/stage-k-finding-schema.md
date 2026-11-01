# Stage K — Finding Schema

**Document ID:** `STAGE-K-FIND-1`
**Version:** `K.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`
**Creation date:** 2026-11-01

**Hash record:** The SHA-256 of this file is recorded in `docs/project/version-3/wave-6/stage-k-d4-blocker-resolution-and-po-review-brief.md`. This file does not embed its own digest.

This document is a proposal. It does not approve Decision 4 and does not close any finding.

**Sources:** recovered Stage I.8 §11 and Stage I.9 §4; Stage K severity proposal `STAGE-K-SEV-1`; Stage K assessment specification `STAGE-K-ASSESS-1`.

---

## 1. Identity

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

Schema identifier: `trp.wave6.cc02.finding`
Schema version: `K.1-1`

A finding is one provider's statement about one defect or alleged defect in one attempt. It is not a merged cross-provider object.

**Identifier.** `finding-id` is `PF-` plus the 32 hex digits of the attempt id plus `-` plus a canonical decimal from 1 upward, with no leading zeros. Example shape: `PF-` + 32 hex + `-1`.

**Uniqueness.** The identifier is unique within the attempt. The same identifier is not reused for another finding in that attempt. A different attempt, including a retry, uses a different attempt id and therefore different finding identifiers. Cross-provider sameness is not expressed by reusing this identifier.

## 2. Fields

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

All fields are required. Empty strings are rejected. Where a value is unknown, the closed token `NOT-SUPPLIED` or `NONE` is used as specified.

| Field                        | Rule                                                                                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema-version`             | Exact `K.1-1`                                                                                                                                                                                       |
| `finding-id`                 | §1                                                                                                                                                                                                  |
| `provider`                   | D3 provider token                                                                                                                                                                                   |
| `attempt-id`                 | The attempt that produced the finding                                                                                                                                                               |
| `title`                      | Provider title if supplied, otherwise `NOT-SUPPLIED`. Maximum 200 Unicode characters. Not rewritten                                                                                                 |
| `original-provider-wording`  | Verbatim excerpt from `response.bin`, or `OFFSET` plus a decimal byte offset and length into `response.bin` when the excerpt would exceed 2,000 characters. The offset form still requires the file |
| `affected-component`         | A Stage I.11 §4.2 path in the package, or `PACKAGE-READING` when the defect is in required reading rather than one file, or `NOT-LOCATED`                                                           |
| `finding-category`           | `DISCLOSURE`, `PAYLOAD-READ`, `AGGREGATE-CORRECTNESS`, `SNAPSHOT-OR-GUARD`, `GOVERNANCE-WORDING`, `EDITORIAL`, or `NOT-CLASSIFIED`                                                                  |
| `original-provider-severity` | The provider's label, copied exactly, including historical spellings such as `Medium` or `Low`. `NOT-SUPPLIED` if the provider gave none. This field is immutable                                   |
| `proposed-working-severity`  | `UNASSIGNED`, or `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, or `PREDICATE-NOT-MET`. Only a later Decision 5 human may change `UNASSIGNED`. This proposal does not perform that change                     |
| `evidence-references`        | Array of one or more objects `{ "response-sha256", "byte-offset", "byte-length" }` or `{ "package-path", "package-payload-sha256" }`. At least one object                                           |
| `technical-explanation`      | Provider explanation copied as text, or `NOT-SUPPLIED`                                                                                                                                              |
| `impact-description`         | Provider impact text, or `NOT-SUPPLIED`                                                                                                                                                             |
| `verification-status`        | `NOT-CHECKED`, `BYTES-CITED`, or `BYTES-NOT-FOUND`                                                                                                                                                  |
| `provider-confidence`        | The provider's own token if it used one, copied exactly, otherwise `NOT-SUPPLIED`. Confidence is not severity                                                                                       |
| `unresolved-questions`       | Array of strings. Empty array if none                                                                                                                                                               |
| `proposed-disposition`       | Provider's suggested disposition copied exactly, or `NOT-SUPPLIED`. It is not a closure                                                                                                             |
| `adjudication-status`        | `UNRESOLVED`, `PREDICATE-MET`, or `FALSE-POSITIVE-PREDICATE-NOT-MET`                                                                                                                                |

`adjudication-status` starts as `UNRESOLVED`. No field in the provider response may set it to another value. The normalizer that writes `PREDICATE-MET` or `FALSE-POSITIVE-PREDICATE-NOT-MET` from provider text produces an invalid finding.

## 3. Evidence references

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

A response reference is valid only when `byte-offset` and `byte-length` identify a range inside the retained `response.bin` whose SHA-256 is `response-sha256`. A package reference is valid only when `package-path` is a member path and `package-payload-sha256` equals the accepted Package Anchor. A reference that cannot be checked is `verification-status: BYTES-NOT-FOUND` and the finding remains `UNRESOLVED`. It is not dropped.

## 4. Duplicates, related findings, and conflicts

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

Similar titles or equal severity labels are not duplicates. No process merges findings because those strings match.

Each provider finding remains its own object. A later matrix may assign a correlation id under `STAGE-K-MATRIX-1`. That id does not replace `finding-id` and does not delete a provider object.

Conflicting findings are both retained. Neither is rewritten to match the other.

A finding is closed, rejected, or accepted only by `adjudication-status` written by the Decision 5 human, with a rationale stored on the matrix row, not by editing `original-provider-wording` or `original-provider-severity`. Until Decision 5, every finding stays `UNRESOLVED`. This schema does not designate that human.

`FALSE-POSITIVE-PREDICATE-NOT-MET` keeps the original wording and the original label. It is not deletion.

## 5. Who decides

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

Final governance disposition of a finding is a Product Owner act or an act of the human designated under Decision 5. Cursor does not make it. A provider does not make it. This document does not make it.

CC-02 remains **INSUFFICIENT EVIDENCE** regardless of any finding status recorded under this schema.
