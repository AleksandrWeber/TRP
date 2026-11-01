# Stage O — Authority and Provenance Correction Proposal

**Document ID:** `STAGE-O-AUTH-1`
**Version:** `O.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This file corrects authority wording. It does not edit the Decision Register, Stage M, or Stage N. It does not approve Decision 3, Decision 4, or the small-cell record. If later adopted, it controls `STAGE-M-SUB-1` §5 and `STAGE-M-SEV-1` §8 wherever those sections assert an approval.

---

## 1. Vocabulary

Use these words only with these meanings.

| Word                       | Meaning in Stage O                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `APPROVED — IDENTITY ONLY` | A later confirmed decision would name provider, model, and API strings and would not authorize a send, disclosure, or commencement |
| `CONDITIONAL`              | The named limit is part of the same decision. Dropping the limit is a different decision                                           |
| `PROVISIONAL`              | The identity may be removed by a later decision. It is not eligible for package bytes while a stated deferral stands               |
| `DEFERRED`                 | Neither accepted nor rejected. No send is implied                                                                                  |
| `NOT APPROVED`             | No decision text, committed or uncommitted, is being treated as approval                                                           |
| `NOT AUTHORIZED`           | The action is outside any decision this package is allowed to rely on                                                              |
| `NOT DECIDED`              | Decision 4, Decision 5, Decision 6, and Decision 7 have no adopted text                                                            |
| `UNVERIFIED`               | The working tree contains a sentence, and no separate instrument in git was found that establishes it                              |

## 2. Decision 3

Repository facts checked on 2026-11-01 at HEAD `a9340afa8d5a186be46b108c1a3df6441e3eec74`:

- The committed register, content hash `648b6bc8f7a071c4edeb2417616d50ceeeb566aef3e56101e525e7acbc08882b`, has no Decision 3 heading.
- The working-tree register, content hash `06d3f15e7e7b1e99e5c34a81dd74d626aae2581a71051cf318ca78c729680845`, has heading `D-CONN04-CENSUS-CC02-AMD-D3`. The task text for Stage O wrote `34e81` in that digest. The file on disk has `34a81`.
- That heading's own words say **APPROVED — CONDITIONAL ROSTER IDENTITY ONLY** for Anthropic `claude-opus-5-5` through the first-party Claude API, OpenAI `gpt-6.1-sol` through the first-party OpenAI API, and Google `gemini-4-argon` through the paid Gemini Developer API. The same words call Google provisional, call Google privacy **DEFERRED**, and say Google must not receive package bytes. They also say Decisions 4 through 7 are **NOT DECIDED**.
- The authority line inside that heading is the heading itself. Stage H is untracked. `STAGE-M-REG-1` graded the heading `SELF-DESCRIBED` and recommended quarantine. This file does not find a second instrument.

Conclusion for protocol text:

Decision 3 provenance is `UNVERIFIED`. Stage O does not confirm the heading and does not deny that an instruction may exist outside the repository. The heading is not operational approval. It is not converted into permission to contact a provider, disclose a package, create an account, or commence an assessment.

Where Stage M says "D3 triple" or "D3 remains approved," the successor reading is: the three name triples above are the only provider strings in the assessment schema, and that schema permission is not a verified decision. A Google name in the schema does not make a Google attempt counting. No Google send is permitted by this package.

`STAGE-M-SUB-1` §5's sentence that Decision 3 remains approved is superseded for any later adoption. The class table in that file, including `OWNERSHIP-CHANGE` and the prohibition on a send, remains subject to `STAGE-O-MAJ-1`.

## 3. Small-cell record

| Source                                                    | What it is                                               | What Stage O uses it for                                        |
| --------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| Working-tree heading `D-CONN04-CENSUS-OP-HELD-SMALL-CELL` | Uncommitted register text saying **DEFER — NOT GRANTED** | Evidence that the sentence exists. Not proof of a decision      |
| Committed register                                        | No such heading                                          | The committed file does not establish the boundary              |
| `STAGE-M-SEV-1` §8                                        | Proposal text that treated the heading as the boundary   | Superseded by `STAGE-O-SEV-1` §6                                |
| `STAGE-M-REG-1`                                           | Grades the heading `SELF-DESCRIBED` and says quarantine  | Agrees that the heading is not independent proof                |
| Stage O                                                   | This file                                                | Classifies the record `UNVERIFIED — NOT AN AUTHORIZED BOUNDARY` |

No assistant recommendation, Cursor proposal, or historical comment in the SQL candidate is a Product Owner approval of inspection. The SQL candidate contains the words "PO-approved" in comments. Those words are file text. They were not executed, and they are not a decision record. This package grants no inspection, export, publication, or evidentiary use of unsuppressed `n < 5` values.

## 4. What Stage O cannot do

Stage O cannot approve Decision 3 after the fact, authorize provider contact or disclosure, approve a small-cell boundary, edit the Decision Register, or create a Product Owner decision. A later adoption of these proposal files would adopt the wording above. It would not convert `UNVERIFIED` into `APPROVED`.
