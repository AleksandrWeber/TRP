# Stage Q — Authority and Provenance Correction

**Document ID:** `STAGE-Q-AUTH-1`
**Version:** `Q.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This file corrects `STAGE-O-AUTH-1` without a new Product Owner decision. It does not edit the Decision Register. It does not approve Decision 3, Decision 4, or the small-cell record. Register reconciliation stays outside this file.

Checked at HEAD `323a65b2f43fae469f81f9329250f2768f93ca7a` on 2026-11-01. The committed register content hash is `648b6bc8f7a071c4edeb2417616d50ceeeb566aef3e56101e525e7acbc08882b`. The working-tree register content hash is `06d3f15e7e7b1e99e5c34a81dd74d626aae2581a71051cf318ca78c729680845`. The committed file has no `D-CONN04-CENSUS-CC02-AMD-D3` heading and no `D-CONN04-CENSUS-OP-HELD-SMALL-CELL` heading. The working tree contains both headings. Those working-tree bytes were not staged.

---

## 1. Decision 3

The direction recorded for Decision 3 is conditional roster identity only. That direction names three identities and does not authorize provider contact, account creation, package disclosure, or assessment commencement.

The committed Decision Register does not contain the Decision 3 heading. The working-tree heading is not independent proof of the decision. Reconciliation of the register remains outstanding. Absence of a committed heading is not a finding that the direction never occurred, and it is not a basis for inventing a different roster.

Stage Q does not approve Decision 3 and does not convert the working-tree heading into a committed decision. `STAGE-O-AUTH-1` classified the heading `UNVERIFIED` and declined to treat it as operational approval. This file keeps that documentary limit and states the roster direction above so later protocol text has one set of identity strings.

The only identity strings are:

| Provider  | Model             | API                                                                 |
| --------- | ----------------- | ------------------------------------------------------------------- |
| Anthropic | `claude-opus-5-5` | first-party Claude API                                              |
| OpenAI    | `gpt-6.1-sol`     | first-party OpenAI API                                              |
| Google    | `gemini-4-argon`  | paid Gemini Developer API, provisional, privacy review **DEFERRED** |

Google remains ineligible to receive package bytes while that privacy deferral stands. No replacement provider, model, API, or hosting arrangement is introduced. A Google name in a schema does not make a Google attempt counting.

Machine tokens, where a schema stores the API, remain `first-party-claude`, `first-party-openai`, and `paid-gemini-developer`, each paired only with the provider and model on the same row.

`STAGE-M-SUB-1` §5's sentence that Decision 3 remains approved is not adopted. SQL comments that say "PO-approved" are file text. They are not a decision record.

## 2. Small-cell record

The operational boundary is **DEFERRED / NOT GRANTED**. That boundary is not permission to inspect, export, publish, or use unsuppressed `n < 5` values as evidence.

The working-tree heading `D-CONN04-CENSUS-OP-HELD-SMALL-CELL` is evidence that those words exist in the uncommitted register. It is not independent documentary proof. The committed register does not establish the heading. Lack of a committed heading does not create a permission. `STAGE-Q-SEV-1` does not use the heading as an authorization source.

No assistant recommendation and no SQL comment approves inspection.

## 3. Decisions this stage does not take

Decision 4 remains **NOT APPROVED**. Decision 5, Decision 6, and Decision 7 remain **NOT DECIDED**. CC-02 is not satisfied. CC-06 is not performed. OQ-CENSUS-01 remains **OPEN**. SQL EXEC and Census EXEC are not authorized.

## 4. What this file does not do

It does not edit, stage, or commit the Decision Register. It does not close the reconciliation. Adopting this file later would adopt the wording above. It would not turn the uncommitted headings into committed register entries.
