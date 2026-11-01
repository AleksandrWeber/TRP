# Stage K — D4 Blocker Resolution and PO Review Brief

**Document ID:** `STAGE-K-BRIEF-1`
**Version:** `K.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`
**Creation date:** 2026-11-01

**Hash record:** This file does not embed its own digest. The SHA-256 of this file is the digest of the committed bytes and is reported with the commit. The other eight Stage K digests are in §2.

This brief is not a Product Owner decision. It does not approve Decision 4.

---

## 1. Executive summary

Stage J held Decision 4 because the protocol object was not closed. Stage K supplies proposed text for the missing severity rules, assessment output, finding schema, discrepancy matrix, substitution rule, and isolation token, and it records where Stage I.8–I.10 and the Decision Register actually stand.

Those proposals are `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`. Writing them does not adopt them.

**Recommendation: RECOMMEND D4 HOLD.**

The specification blockers are resolved in proposal form and still require a Product Owner decision after a subsequent independent review. The Decision Register discrepancy is not resolved. Operational gates remain downstream. D4 remains **NOT DECIDED / NOT APPROVED**.

## 2. Source inventory and Stage K hashes

Review HEAD: `90b8430d00de225e59de999aa8bc1f4b0506b8d5` on `main`, matching `origin/main` at the start of this task. Stage J brief hash matched `053205ff17491bb6b0db84084c9fccf30b3cef64fc983afbfc88d36f0f9dd223`.

| Source                          | SHA-256                                                                  | Custody                                      |
| ------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------- |
| Stage J brief                   | `053205ff17491bb6b0db84084c9fccf30b3cef64fc983afbfc88d36f0f9dd223`       | Committed                                    |
| Stage I.11–I.13 report          | `de102a4a9b7903b350c83375e4c982bbf25dcca12a78c3192125725da2b477f6`       | Committed                                    |
| Stage H proposal                | `0680abb316b8ba81bd24eb660d3bd3ac650b386b9fc6501f3d126a7857a1d099`       | Untracked. Not edited                        |
| Decision Register, working tree | `06d3f15e7e7b1e99e5c34a81dd74d626aae2581a71051cf318ca78c729680845`       | Modified, uncommitted. Not edited by Stage K |
| Decision Register at HEAD       | `648b6bc8f7a071c4edeb2417616d50ceeeb566aef3e56101e525e7acbc08882b`       | Committed. Does not contain D1–D3            |
| Stage G brief                   | `fbb214056842adafdb31decbe939d35218e962bcf316d2143e9a1fadb6a83be3`       | Untracked                                    |
| Operator Runbook                | `b9dfd9cce20d44bc26234496f90342468cc610f4a74dbb603a83eea104dfa99e`       | Untracked. Not edited                        |
| Evidence Protocol               | `1993893bf3b02bf7d5e3c43136b7e7d31440d926b7c5e0a6782b9fc950b8b100`       | Untracked. Not edited                        |
| Binding Manifest                | `de2913f522ea55deefd7d4c93140f405974696363315793e32202bcde05dec38`       | External. Not edited                         |
| Authorization Package           | `ed94cc031029233e2aed91c847e9977c4c88150c8f8a53f42febef8200879d50`       | External. Not edited                         |
| Current Design Canvas           | `c70f45dcfbc74f55765bd682caa6ebff551673cf06120e76d9222251a0680c2e`       | External. Not edited                         |
| Bound SQL candidate             | `fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c`       | External. Content not read                   |
| Design Content Baseline         | `7714f95b8202771dfa1835d279983fafef9505af5a678f12344bdc79f1ca0ac7` cited | Bytes not opened                             |
| Recovered Stage I.8 text        | `a92c0a24c070d5e922654990a9b41a5d389dc3daeb8c83dd2a8330d6ebef3b82`       | Transcript line 42. Not a git file           |
| Recovered Stage I.9 text        | `96edf39e57ad1d43e9ea45a60e02749aa96dcf29e87ec4ea06bbf0cc8fa8ace6`       | Transcript line 45. Not a git file           |
| Recovered Stage I.10 text       | `55025b99fc15fd0df270d1acdee2d21a790a759f1d591def2b8d1a5319efcee2`       | Transcript line 48. Not a git file           |

Stage K file digests, computed after Prettier:

| File                                               | SHA-256                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `stage-k-severity-taxonomy-proposal.md`            | `bee986db2583b0a3c7877f75a98e2b09b9684d41a8cc8fbb8366c79a6cdccedb` |
| `stage-k-ai-assessment-output-specification.md`    | `20ddd3177ae1812d9c889b98c54ee15d9508b08d75d3d41846630934b8013467` |
| `stage-k-finding-schema.md`                        | `e31b0275d788fce11a6d02943b2baaca0b9bae9b6f51c63f448c4e360f99a9e2` |
| `stage-k-discrepancy-matrix-schema.md`             | `28b62c3feb3c0eef525e0a4a251cb8d374b9383524150410382b65f8e7f725b9` |
| `stage-k-provider-retry-and-substitution-rules.md` | `6ac450fd166c0aaed2e4f40d6ed1a40678bb95cc363bcbceaaf5fe7ec8dff786` |
| `stage-k-isolation-semantics-proposal.md`          | `19434e7456d6a1c8c3855847a38706f463190880df26fa549918daaaf5ef467c` |
| `stage-k-stage-i8-i10-provenance-report.md`        | `a54cb42e7f882f18c4db2297535823d9ed3e8a81c7c70825313ba0c0d2389a62` |
| `stage-k-decision-register-authority-report.md`    | `997829203e94e506ba3d1b0edd0084d715816ef01b87c06d60c365752d486337` |

## 3. Deliverable status

| Deliverable                        | Status                                                     |
| ---------------------------------- | ---------------------------------------------------------- |
| Severity taxonomy                  | Proposed. Not adopted                                      |
| AI assessment output specification | Proposed. Not adopted                                      |
| Finding schema                     | Proposed. Not adopted                                      |
| Discrepancy matrix schema          | Proposed. Not adopted                                      |
| Retry and substitution rules       | Proposed. Not adopted. Stage H not edited                  |
| Isolation semantics                | Proposed. Not adopted                                      |
| Stage I.8–I.10 provenance          | Recovery record. Historical text not adopted               |
| Decision Register authority        | Finding only. Discrepancy not closed                       |
| This brief                         | Proposal for later independent review and PO consideration |

## 4. Severity taxonomy

Canonical working tokens are `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`. Severity classifies a finding by consequence in the bound SQL or its required reading. It is not likelihood, a vote, or a score.

Unresolved `CRITICAL` or `HIGH` blocks `PASS WITH OBSERVATIONS`. Provider labels are preserved and are not working severity. Until Decision 5, nobody is designated to write working severity, and a provider-proposed `CRITICAL` or `HIGH` still blocks the positive review token without being renamed. Disagreement does not lower a label. Downgrade is forbidden when the higher predicate is met. `MEDIUM` and `LOW` block only while a human disposition is missing.

Review-level tokens stay separate: `INCONCLUSIVE / NOT COMPLETED`, `BLOCKED — UNRESOLVED CRITICAL/HIGH`, and `PASS WITH OBSERVATIONS`. Providers do not issue them. `PASS WITH OBSERVATIONS` would not satisfy CC-02.

## 5. Schema summaries

**Assessment.** Schema `trp.wave6.cc02.ai-assessment-output` version `K.1-1`. Normalized JSON is a projection of `response.bin`. It cannot turn a malformed response into `COMPLETE`. Assessment outcome tokens are `FINDINGS-RECORDED`, `NO-FINDINGS-STATED`, `REFUSED`, `UNABLE-TO-ASSESS`, and `NOT-A-NORMALIZED-OUTCOME`. They are not review-level outcomes. No field grants quorum by itself.

**Finding.** Schema `trp.wave6.cc02.finding` version `K.1-1`. Identifier `PF-` plus the attempt hex plus a sequence, unique within the attempt. Original wording and original severity are immutable. Working severity starts `UNASSIGNED`. Equal titles are not duplicates. Conflicts are both kept. Closure waits for Decision 5.

**Matrix.** Schema `trp.wave6.cc02.discrepancy-matrix` version `K.1-1`. It starts only after three accepted Evidence Anchors for the same Package Anchor, with no ineligible provider. Status tokens are `AGREEMENT`, `PARTIAL_AGREEMENT`, `DISAGREEMENT`, `UNIQUE_FINDING`, `NOT_ASSESSED`, and `UNRESOLVED`. `NOT_ASSESSED` is not proof of safety. There is no majority rule. One row per provider finding. A correlation id does not merge rows.

## 6. Substitution and retry

Stage H §4.3's "another eligible distinct provider" sentence does not control if this proposal is later adopted. An incomplete assessment stays `INCONCLUSIVE / NOT COMPLETED`. A retry of the same D3 provider, model, and API is a new attempt id and does not need a new roster decision. It still needs a later commencement decision before any send. A change of provider organization, model, API, endpoint, or hosting needs a new Product Owner roster decision before use. Google remains ineligible to receive package bytes. No retry is authorized now.

## 7. Isolation semantics

Recovered Stage I.9 defines `ISOLATION-NOT-EVIDENCED` as partial instruction observability or missing submitted bytes, and says it is not a proven breach. Stage K proposes to keep that non-breach meaning and to reserve missing bytes for the existing `TRANSMISSION-NOT-EVIDENCED` token. `ISOLATION-NOT-EVIDENCED` then means the request file is retained and the verifier still cannot account for operator-controlled instructions or cannot run the cross-disclosure search. `CROSS-DISCLOSURE-DETECTED` is the separate token for a hit of a prior response inside a later request. Neither token proves provider-side isolation. Organizational separation of duties stays in Stage I.11 §7.

## 8. Provenance

Stage I.8, I.9, and I.10 assistant replies were recovered from transcript `57d05bb8-80b9-4bf5-a312-9f996959a547`, JSONL lines 42, 45, and 48, with the hashes in §2. They are outside git. The provenance report quotes the recovered approval sentences and the isolation sentence. It does not reproduce every line. It does not treat those sentences as executed decisions. Stage E and Stage F.1 remain chat deliverables without a recovered full text in this task. They were not reconstructed.

## 9. Decision Register

The working-tree register at `06d3f15e…` contains D1–D3 and also uncommitted VMP, Stage 4, F-01, F-02, and small-cell records. The committed register at `648b6bc8…` does not contain D1–D3. Stage I.11 and Stage J cite the working-tree hash. Stage H cites an older hash. The discrepancy is open. The recommended resolution is a later Product Owner recording act that reviews the whole diff before any committed D4 entry. This task does not commit the register.

## 10. Cross-artifact conflicts

| Source A                                                               | Source B                                                    | Conflict                                                                | Proposed controlling rule if later adopted                                          | Affected decision              | PO approval required                                                  |
| ---------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| Stage H §4.3 replacement sentence                                      | D3 and Stage I.11 §§6.5 and 7.6                             | §4.3 can be read as authorizing another provider without a new decision | `STAGE-K-SUB-1` §2                                                                  | D4 text, not a roster change   | Yes, to adopt the rule. Stage H is not edited now                     |
| Stage H §4.4, no published taxonomy                                    | Recovered I.8 §5 and `STAGE-K-SEV-1`                        | Stage H says definitions are unpublished                                | `STAGE-K-SEV-1` becomes the candidate definition set                                | D4                             | Yes                                                                   |
| Stage I.11 §6.7 `ISOLATION-NOT-EVIDENCED` has no trigger               | Recovered I.9 §8 names a trigger that overlaps transmission | Token is undefined in the repository file                               | `STAGE-K-ISO-1`                                                                     | D4                             | Yes. The split from the literal I.9 sentence is part of that decision |
| Stage I.11 §12 incorporates unfiled I.8–I.10                           | Provenance hashes now exist for the conversation replies    | The approval object was not a git file                                  | A later D4 sentence must cite Stage K hashes, not an unhashed "unaffected I.8 text" | D4                             | Yes                                                                   |
| Working-tree register D1/D2 sentences say Decisions 3–7 are undecided  | Same file, D3 section                                       | Stale cross-reference                                                   | D3 section controls Decision 3. Annotation waits for the recording act              | Register recording, not D4     | Yes, for the recording act                                            |
| Stage H §9 still says Decisions 1–3 are not decided                    | Working-tree D1–D3 records                                  | Hash-locked proposal understates later decisions                        | Do not edit Stage H. Cite the register                                              | None until a documentation act | No edit now                                                           |
| Binding Manifest and Design Canvas historical independent-review label | Register CC-02 **INSUFFICIENT EVIDENCE**                    | Historical label can be misread as CC-02 PASS                           | Register remains the satisfaction record                                            | Not D4                         | A later sync act only                                                 |
| Runbook and Evidence Protocol canvas hash `4e7bf3c9…`                  | Current canvas `c70f45dc…`                                  | Stale citation                                                          | Left unchanged. CC-03 evidence question                                             | Not D4                         | Later documentation act                                               |

No previously approved artifact was edited to remove a conflict.

## 11. Blocker resolution matrix

| Stage J blocker             | Stage K result                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| Severity taxonomy           | `RESOLVED IN PROPOSAL` and `REQUIRES PO DECISION` to adopt                                                |
| Assessment output           | `RESOLVED IN PROPOSAL` and `REQUIRES PO DECISION`                                                         |
| Finding schema              | `RESOLVED IN PROPOSAL` and `REQUIRES PO DECISION`                                                         |
| Discrepancy matrix          | `RESOLVED IN PROPOSAL` and `REQUIRES PO DECISION`                                                         |
| Provider substitution       | `RESOLVED IN PROPOSAL` and `REQUIRES PO DECISION`                                                         |
| `ISOLATION-NOT-EVIDENCED`   | `RESOLVED IN PROPOSAL` and `REQUIRES PO DECISION` on the proposed split                                   |
| Stage I.8–I.10 provenance   | `RESOLVED IN PROPOSAL` as a recovery record. Historical replies are not git originals and are not adopted |
| Decision Register authority | `UNRESOLVED` and `REQUIRES PO DECISION`                                                                   |

## 12. What is a D4 adoption prerequisite

A later Decision 4 would need one hash-bound adoption sentence that identifies `STAGE-K-SEV-1`, `STAGE-K-ASSESS-1`, `STAGE-K-FIND-1`, `STAGE-K-MATRIX-1`, `STAGE-K-SUB-1`, and `STAGE-K-ISO-1` by the digests in §2, together with the Stage I.11–I.13 file at `de102a4a…`, and that excludes Stage H §4.1 and the Stage H §4.3 replacement sentence. It would also need the Product Owner to accept the isolation-token split. Independent review of this set is still outstanding. This brief does not supply that adoption sentence as an executed act.

Before a committed register entry for that decision, the register discrepancy in §9 has to be closed by the recording act in `STAGE-K-REG-1`. That recording act is a prerequisite to committing D4. It is not itself the protocol text.

## 13. Downstream blockers

These stay open after any later protocol adoption:

- Decision 5, human adjudicator, before working severity or matrix disposition is written.
- Decision 6, criteria synchronization and CC-01 through CC-06 re-adoption.
- `scope/review-scope.txt`, package freeze, separated custodian, and anchor stores.
- Google privacy decision before any Google disclosure.
- Bound first-party endpoints before any send.
- Decision 7 before commencement or disclosure.
- Evidence acceptance, CC-02 closure, CC-06, and OQ-CENSUS-01 closure.
- SQL EXEC and Census EXEC, which remain separate authorizations.

Documentation does not make those gates operational.

## 14. Exact decisions still required

1. Whether to adopt the six normative Stage K proposals, edited or as hashed, as the Decision 4 protocol object.
2. Whether to accept the isolation split in `STAGE-K-ISO-1` §3.1.
3. The register recording act in `STAGE-K-REG-1` §5, including review of the extra uncommitted records.
4. Decision 5, Decision 6, and Decision 7, each separately.
5. Google privacy, endpoint binding, custodian appointment, and the scope file, each separately.
6. Evidence acceptance, CC-06, and any execution authorization, each separately.

## 15. Unchanged governance and prohibitions

D1 remains **APPROVED — AMENDMENT CANDIDATE ONLY**. D2 remains **APPROVED — ALTERNATIVE CONTROL CONCEPT ONLY**. D3 remains **APPROVED — CONDITIONAL ROSTER IDENTITY ONLY**. D4 through D7 remain **NOT DECIDED / NOT APPROVED**. Stage H remains `DRAFT — PROPOSAL ONLY — NOT ADOPTED`. Stage I.11–I.13 remains not adopted. CC-02 remains **INSUFFICIENT EVIDENCE**. CC-06 remains **NOT PERFORMED**. OQ-CENSUS-01 remains **OPEN**. Google privacy remains **DEFERRED**. SQL EXEC and Census EXEC remain **NOT AUTHORIZED**.

This brief does not contact a provider, disclose package material, create a package or an anchor, execute SQL, or access a database, Vault, or Census.

## 16. Recommendation

**RECOMMEND D4 HOLD.**

The missing protocol text now exists as reviewable proposals. It is not adopted, it has not had the independent review this task was written to enable, and the Decision Register that would record a decision is not the committed register. Holding D4 is the recommendation until those acts happen. The hold does not reject the proposals. It refuses to treat them as Decision 4.
