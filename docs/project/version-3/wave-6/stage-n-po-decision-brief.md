# Stage N — Product Owner Decision Brief

**Document ID:** `STAGE-N-BRIEF-1`
**Version:** `N.1`
**Status:** `PROPOSED — BRIEF — NOT A PO DECISION`
**Review date:** 2026-11-01

This brief reports the Stage N review. It does not approve Decision 4 and does not adopt Stage M.

---

## 1. Recommendation

**D4 HOLD.**

The Stage M package is a coherent proposal and its file hashes match commit `7580040fdcf250db3f6f476daa4b40449007307a`. It is not safe to adopt in its current bytes. Two blockers remain inside the proposed adoption object. The detailed evidence is `STAGE-N-REV-1`.

## 2. Candidate sentence

The sentence in `STAGE-M-ADOPT-1` §6 is **not safe to present unchanged**.

It names the six protocol files, excludes the prohibited execution and disclosure actions, and excludes whole-file Stage H and whole-file Stage I.11 adoption. Those boundary choices held when re-read.

The same sentence would also adopt `STAGE-M-SEV-1` and `STAGE-M-SUB-1`. Those files contain N-B1 and N-B2. The sentence also refers to the boundary file's digest instead of containing the hex `4a84f877b33d4632615aa0f6c5d44a2dd810c8a20c903e338e1d14e8a7f3fb9a`.

## 3. Mandatory corrections before Decision 4 can be considered

1. Make the block calculation require the clearing bundle in `STAGE-M-SEV-1` §6. A critical or high block must remain while adjudication, rationale, package reference, or `not-risk-acceptance` is missing.
2. Remove the statements that D3 is already approved and that the uncommitted small-cell record is the inspection boundary, or move them into separate decision sentences. Do not leave them inside the Decision 4 object.
3. Use one spelling, `NOT-ASSESSED`.
4. Name the review token for a quorum that is blocked only at medium or low.
5. Give `isolation-gap-reason` a field in the stored assessment or seal.
6. Add `MISMATCH` and `UNVERIFIABLE` to the matrix non-counting reasons.
7. Define which single attempt occupies a provider's coverage slot.
8. Close the inspection-grant match rule: whole phrase, stated window, negation is not a grant.

## 4. Optional improvements

Scope the historical-token ban to enum fields. Align the empty-array rules. Define the first-attempt digest search. Name region and operational-control changes. Replace the undefined "provider text that asks" test. Quote the F-02 runbook claim in the register report. Paste the boundary digest into any later sentence. State the capture-status override beside the retained seal list.

## 5. Remaining Product Owner decisions

| Decision                                                     | Dependency                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Whether to commission a corrected successor to Stage M       | This review                                                                   |
| A later Decision 4 sentence, after the mandatory corrections | The corrected hashes                                                          |
| Register recording act                                       | Separate from Decision 4. Required before a committed Decision 4 entry        |
| Decision 5, adjudicator                                      | Required before any human working severity other than the Product Owner's own |
| Decision 6, criteria re-adoption                             | Must not copy Stage H §3.B(2) into operative CC-02                            |
| Decision 7, commencement                                     | Required before any send, including a same-configuration retry. Not granted   |
| Google privacy                                               | Required before Google can count or receive package bytes                     |
| Small-cell inspection                                        | Separate from Decision 4 unless a later sentence decides it in words          |

## 6. What a later adoption would authorize

Only the protocol text at the hashes named in a future sentence, including the retained Stage I.11 sections that sentence keeps.

## 7. What it would not authorize

Decision 5, Decision 6, Decision 7, provider contact, package disclosure or submission, Package Anchor or Evidence Anchor creation, assessment commencement, SQL execution, Census execution, publication or transfer of Census evidence, CC-02 closure, CC-06, OQ-CENSUS-01 closure, or Stage 5/6 ratification.

`PASS WITH OBSERVATIONS` would not satisfy CC-02. Current adoption would also not create a three-provider quorum while Google remains ineligible.

## 8. Register recording act

A separate Product Owner recording act is required. `STAGE-M-REG-1` does not perform it. This review does not perform it. The working-tree register and the committed register still disagree, including on VMP-1.

## 9. Recommended next stage

Prepare a successor proposal that corrects the eight mandatory items and issues a new hash-bound sentence. Review that successor independently. Do not adopt Stage M, do not edit the Decision Register, and do not contact a provider in that stage.

**This brief is not Decision 4 approval.**
