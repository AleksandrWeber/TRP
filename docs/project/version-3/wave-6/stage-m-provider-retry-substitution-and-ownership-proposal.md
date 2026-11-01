# Stage M — Provider Retry, Substitution, and Ownership Proposal

**Document ID:** `STAGE-M-SUB-1`
**Version:** `M.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This document is a proposal. It does not authorize a retry, a provider contact, a roster change, Decision 4, or Decision 7. It does not edit Stage H or Stage I.11. The D3 roster is not expanded.

If a later decision adopts `STAGE-M-ADOPT-1`, this file is the protocol rule for incomplete assessments and for configuration changes. Until that decision, Stage H §3.B(2), Stage H §4.3, and Stage I.11 §6.5 and §7.6 remain unadopted draft text where they conflict with this file, and this file is also unadopted.

---

## 1. The sentences this proposal would control

| Text                              | What it says                                                                                            | Proposed treatment if later adopted                                                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage H §4.3 replacement sentence | An incomplete assessment waits until another eligible distinct provider completes a replacement. No N−1 | Superseded for the protocol. The file is not edited. The sentence is not part of the D4 object                                                                                                                            |
| Stage H §3.B(2)                   | The same replacement-provider construction inside the CC-02 amendment candidate                         | Superseded for the protocol. D1's candidate status is unchanged. Operative CC-02 is unchanged. A future Decision 6 must not copy this sentence back into operative criteria                                               |
| Stage I.11 §6.5 and §7.6          | A replacement attempt requires a separate Product Owner decision and is not implied                     | Retained for every class in §3 that says a new D3 decision is required. "Replacement attempt" in those sections means those classes. It does not mean a same-configuration retry. The same-configuration retry rule is §2 |

No reading of this section authorizes a send.

## 2. Same-configuration retry

`RETRY-SAME-CONFIGURATION` means every one of the following is unchanged from the D3 identity and from the commencement authorization that names the send: provider organization, legal operator, model, API, HTTPS endpoint, hosting arrangement, and account or tenant.

A timeout, refusal, truncation, malformed response, incomplete capture, isolation failure, or transmission failure does not count. It is not edited into a complete attempt. The provider's request for a retry is not a Product Owner decision.

A retry:

- uses a new `attempt-id`;
- uses a new seal and a new Evidence Anchor;
- does not inherit the previous response;
- does not count the failed attempt toward the three counting anchors;
- does not change the roster and does not need a new D3 identity decision.

Each send, including the retry, requires commencement authorization that names `RETRY-SAME-CONFIGURATION` for that identity. A Decision 7 that authorizes only an initial send does not cover the retry. A further commencement decision is then required. Decision 7 is **NOT DECIDED**. This proposal grants neither the initial send nor the retry.

Two completed assessments are not a quorum. Google remains ineligible to receive package bytes while privacy is deferred. A same-configuration retry of Google is still a send and is prohibited while that deferral stands.

## 3. Change classes

| Class                      | What changes                                                                                                                         | New attempt, seal, and Evidence Anchor      | New D3 identity decision                        | Commencement authorization that names the new send |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| `RETRY-SAME-CONFIGURATION` | None of the items in §2                                                                                                              | Required. The failed attempt does not count | No                                              | Required before that send. Not granted here        |
| `PROVIDER-REPLACEMENT`     | A different provider organization                                                                                                    | Required                                    | Yes, before any use                             | Required. Not granted here                         |
| `OWNERSHIP-CHANGE`         | A different legal operator, contracting entity, or controlling organization, even when the model string and HTTPS host are unchanged | Required                                    | Yes, before any use                             | Required. Not granted here                         |
| `MODEL-CHANGE`             | A different model at the same provider                                                                                               | Required                                    | Yes                                             | Required                                           |
| `API-CHANGE`               | A different API                                                                                                                      | Required                                    | Yes                                             | Required                                           |
| `ENDPOINT-CHANGE`          | A different HTTPS endpoint or host                                                                                                   | Required                                    | Yes. Silent endpoint substitution is prohibited | Required                                           |
| `HOSTING-CHANGE`           | A different hosting arrangement for an approved name                                                                                 | Required                                    | Yes                                             | Required                                           |
| `ACCOUNT-CHANGE`           | A different account or tenant                                                                                                        | Required                                    | Yes                                             | Required                                           |
| `NOT-ON-ROSTER`            | Any identity that is not one of the three D3 triples, including a technically similar substitute                                     | Required if ever used                       | Yes. Technical equivalence is not identity      | Required                                           |

Cursor does not select a replacement. A reviewer does not select a replacement. An unavailable provider, before or after an incomplete attempt, does not create a substitute. N−1 remains prohibited.

## 4. Worked cases

| Case                                                                                    | Class                                                                                                                        | Submission permitted by this proposal |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Same provider, model, API, endpoint, host, account, and legal operator, after a timeout | `RETRY-SAME-CONFIGURATION`                                                                                                   | No                                    |
| Same provider, different model                                                          | `MODEL-CHANGE`                                                                                                               | No                                    |
| Same provider and model, different endpoint                                             | `ENDPOINT-CHANGE`                                                                                                            | No                                    |
| Organization sold, model string and host unchanged                                      | `OWNERSHIP-CHANGE`                                                                                                           | No                                    |
| Provider unavailable before any submission                                              | No retry exists. A substitute is `PROVIDER-REPLACEMENT` or `NOT-ON-ROSTER`                                                   | No                                    |
| Provider unavailable after one incomplete attempt                                       | Failed attempt retained and non-counting. Same configuration follows §2. A different provider follows `PROVIDER-REPLACEMENT` | No                                    |
| Invalid response plus a provider request to retry                                       | `RETRY-SAME-CONFIGURATION` only if §2 is met. The request itself authorizes nothing                                          | No                                    |
| Replacement proposed after two completions                                              | Not a quorum. The new identity needs §3                                                                                      | No                                    |
| Google privacy still deferred                                                           | Any Google send, including a same-configuration retry                                                                        | No                                    |
| Technically equivalent party not on the D3 roster                                       | `NOT-ON-ROSTER`                                                                                                              | No                                    |

## 5. What this proposal does not do

It does not contact a provider, create an account, disclose package bytes, add a roster identity, decide Google privacy, decide Decision 4, decide Decision 5, decide Decision 6, decide Decision 7, or authorize SQL EXEC or Census EXEC.

D3 remains **APPROVED — CONDITIONAL ROSTER IDENTITY ONLY** in the uncommitted register, for the three named triples. That identity is not operational availability. This proposal does not restate D3 as a new approval.
