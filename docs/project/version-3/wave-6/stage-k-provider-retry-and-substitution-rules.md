# Stage K — Provider Retry and Substitution Rules

**Document ID:** `STAGE-K-SUB-1`
**Version:** `K.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`
**Creation date:** 2026-11-01

**Hash record:** The SHA-256 of this file is recorded in `docs/project/version-3/wave-6/stage-k-d4-blocker-resolution-and-po-review-brief.md`. This file does not embed its own digest.

This document is a proposal. It does not authorize a retry, a provider contact, or a roster change.

**Sources:** Stage H §4.3 at SHA-256 `0680abb316b8ba81bd24eb660d3bd3ac650b386b9fc6501f3d126a7857a1d099`; working-tree Decision Register D3 `D-CONN04-CENSUS-CC02-AMD-D3`; Stage I.11 §§6.4, 6.5, and 7.6; recovered Stage I.8 §10, transcript `57d05bb8-80b9-4bf5-a312-9f996959a547` JSONL line 42. Stage H is not edited.

---

## 1. The conflict

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

Stage H §4.3 says that if any provider fails to complete an assessment, the process is not completed until a replacement assessment from another eligible distinct provider is completed and sealed, and that no N−1 completion is permitted.

D3 says any replacement provider, model, API, or hosting arrangement requires a separate Product Owner decision, and that silent substitution is forbidden. Google must not receive package bytes while privacy is deferred.

Stage I.11 §6.5 and §7.6 say a replacement requires a separate Product Owner decision, is not implied, and that a retry is a new attempt that does not inherit an old response.

Recovered Stage I.8 §10 proposed replacement text that keeps the outcome at `INCONCLUSIVE / NOT COMPLETED` and forbids substitute eligibility until a separate Product Owner decision.

## 2. Controlling proposal

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

If this proposal is later adopted, it controls over Stage H §4.3 for incomplete assessments. Until that adoption, Stage H §4.3 remains unadopted draft text and this section is also unadopted. Neither text authorizes a send.

Proposed rule:

> If any required assessment is not complete, or any required Evidence Anchor is not `ACCEPTED`, the review outcome is `INCONCLUSIVE / NOT COMPLETED`. That status does not authorize a substitute provider, model, API, endpoint, or hosting arrangement. No N−1 completion is permitted. Two completed assessments are not a quorum. Google remains ineligible to receive package bytes while privacy is deferred. A failed attempt is retained as non-counting evidence. It is not relabelled as complete.

## 3. Classes of change

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

| Class                  | What changes                                                                                                       | New attempt id                                                | New D3-class roster decision                 | Commencement                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `RETRY-SAME-IDENTITY`  | Same approved provider, model, and API. No endpoint change                                                         | Required. The failed attempt does not count and is not reused | No                                           | No send is authorized by this row. A later Decision 7 would be required before any send. A retry does not create that decision |
| `PROVIDER-REPLACEMENT` | A different provider organization                                                                                  | Required                                                      | Yes, before any use                          | A later commencement decision that names the new identity. This row does not grant it                                          |
| `MODEL-CHANGE`         | A different model at the same provider                                                                             | Required                                                      | Yes                                          | Same as provider replacement                                                                                                   |
| `API-CHANGE`           | A different API or a different HTTPS endpoint, including a host that is not the one later bound for that D3 triple | Required                                                      | Yes. D3 forbids silent endpoint substitution | Same as provider replacement                                                                                                   |
| `HOSTING-CHANGE`       | A different hosting arrangement for an approved name                                                               | Required                                                      | Yes                                          | Same as provider replacement                                                                                                   |

Cursor does not select a replacement. A reviewer does not select a replacement. Only a later Product Owner decision can add an identity.

A timeout, truncation, refusal, malformed response, or incomplete capture does not count. It cannot be edited into a complete attempt. The retry, if one is ever authorized, is a new attempt with a new `attempt-id`, a new seal, and a new Evidence Anchor. The old response is not rebound.

## 4. What this proposal does not do

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

It does not contact a provider, create an account, disclose package bytes, add a provider to the roster, decide Google privacy, decide Decision 4, decide Decision 7, or authorize SQL EXEC or Census EXEC.

D3 remains **APPROVED — CONDITIONAL ROSTER IDENTITY ONLY** for the three named triples. That identity is not operational availability.
