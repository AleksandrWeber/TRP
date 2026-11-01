# Stage O — D4 Adoption Object Proposal

**Document ID:** `STAGE-O-ADOPT-1`
**Version:** `O.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This file is a proposed successor to `STAGE-M-ADOPT-1`. It does not adopt itself. The sentence in §4 has no authority unless the Product Owner later adopts it in a separate decision. D4 remains **HOLD** until that separate decision. This file does not embed its own digest. `STAGE-O-VER-1` records that digest.

---

## 1. Proposed normative set

| Path                                                                                          | SHA-256                                                            | Purpose                                                                                               | Relationship                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `docs/project/version-3/wave-6/stage-o-severity-blocking-correction-proposal.md`              | `52b6a96f6d737cc5a60005cf19e21abb2cd7b24f55e95b0b3c6635c7933b97fa` | Block calculation and inspection-grant test                                                           | Supersedes `STAGE-M-SEV-1`                                                                            |
| `docs/project/version-3/wave-6/stage-o-authority-and-provenance-correction-proposal.md`       | `809e64dfc8a4620d36dc692ab9387843cbd557352cd8a8f598b4ea2f01defb48` | Decision 3 and small-cell wording                                                                     | Supersedes `STAGE-M-SUB-1` §5 and `STAGE-M-SEV-1` §8                                                  |
| `docs/project/version-3/wave-6/stage-o-major-findings-remediation-matrix.md`                  | `441d96e191c2d1ce70a5f06e1b10914eef6009e92c1eace1a0c90cf1ffc9a4af` | Controlling amendments for N-M1 through N-M7                                                          | Supersedes the named Stage M sections in §2 of that file                                              |
| `docs/project/version-3/wave-6/stage-m-ai-assessment-schema-remediation-proposal.md`          | `b562981f2f7f64bef8bd9356c7bb512cc2a9c56c0ecc9db16e2c5bfa9c597647` | Assessment schema except the amendments                                                               | Supplement. Schema version becomes `O.1-1` and gains `isolation-gap-reason` under `STAGE-O-MAJ-1` §4  |
| `docs/project/version-3/wave-6/stage-m-finding-identity-and-lifecycle-proposal.md`            | `0671178a21899386a9985ff9824efd0eb483e5949387c7a4a8ca280def628dea` | Finding identity, except the two sentences `STAGE-O-MAJ-1` §4 replaces                                | Supplement                                                                                            |
| `docs/project/version-3/wave-6/stage-m-discrepancy-matrix-semantics-proposal.md`              | `9b7c23876644c6d82d543d006e0641de35fb14633ecca1527d9b3c20d937f030` | Matrix, except token spelling, payload reasons, initial comparison status, and the review-token table | Supplement. `STAGE-O-SEV-1` §4 and `STAGE-O-MAJ-1` §2, §3, and §5 control those points                |
| `docs/project/version-3/wave-6/stage-m-provider-retry-substitution-and-ownership-proposal.md` | `ec4ec0900979c9dc40129ac2ef2af6030815574896967713cb4e575bbb5b966c` | Retry classes, except §5                                                                              | Supplement. §5 is not adopted. `STAGE-O-MAJ-1` §5 adds the slot rule, region, and operational control |
| `docs/project/version-3/wave-6/stage-m-provider-isolation-and-cross-disclosure-proposal.md`   | `4bbac76b1b9f8289b73245b0c3c6c66dfd69d4ddfa2364d8e404b0ca5cd96190` | Isolation results, except storage of the gap reason                                                   | Supplement. `STAGE-O-MAJ-1` §4 supplies the field, the seal override, and the empty prior set         |
| `docs/project/version-3/wave-6/stage-o-d4-adoption-object-proposal.md`                        | Digest recorded in `STAGE-O-VER-1`                                 | This boundary                                                                                         | Supersedes `STAGE-M-ADOPT-1`                                                                          |

Not in the normative set: `STAGE-M-SEV-1`, `STAGE-M-ADOPT-1`, `STAGE-M-REG-1`, `STAGE-M-VER-1`, and every Stage N file. They remain historical.

## 2. Historical provisions

| Source                                                                                                                                                                  | Class                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage H §3.B as a whole                                                                                                                                                 | Unresolved as an amendment candidate. Not operative CC-02. Not adopted here                                                                                                 |
| Stage H §3.B(2) and §4.3 replacement sentences                                                                                                                          | Excluded. `STAGE-M-SUB-1` §1 remains the proposed reading, and it grants no send                                                                                            |
| Stage H §4.1                                                                                                                                                            | Excluded. The unselected roster table is not a roster decision                                                                                                              |
| Stage H §9, including Decision 4 as approval of Stage H §4                                                                                                              | Excluded                                                                                                                                                                    |
| Stage H file `0680abb316b8ba81bd24eb660d3bd3ac650b386b9fc6501f3d126a7857a1d099`                                                                                         | Historical draft. Not adopted                                                                                                                                               |
| Stage I.11 `de102a4a9b7903b350c83375e4c982bbf25dcca12a78c3192125725da2b477f6` §4, §5, §6.1 through §6.4, §6.6, §7.1 through §7.5, §7.4, and §7.7 through §7.8           | Retained as technical grammar if the sentence is later adopted. §7.7 and §7.8 are threat analysis, not permission to build an anchor                                        |
| Stage I.11 §6.5, except "Replacement requires a separate PO decision."                                                                                                  | Retained. That sentence is read only through `STAGE-M-SUB-1` §3 as limited by `STAGE-O-MAJ-1` §5                                                                            |
| Stage I.11 §6.7, except the bullet that requires Stage I.9 transcript content                                                                                           | Retained. The bullet is superseded by `STAGE-M-ASSESS-1` §8 and §9 as amended by `STAGE-O-MAJ-1` §4. `PARTIAL-INSTRUCTIONS` overlap uses the override in `STAGE-O-MAJ-1` §4 |
| Stage I.11 §7.6, except the replacement-attempt sentences                                                                                                               | Retained. Those sentences are read only through the same retry rule                                                                                                         |
| Stage I.11 §10.1 and §12                                                                                                                                                | Excluded. The whole file is not adopted                                                                                                                                     |
| Stage I.8, I.9, and I.10 approval sentences                                                                                                                             | Excluded. The new-session control is retained only as restated in `STAGE-M-ISO-1` §4                                                                                        |
| Stage K severity, assessment, finding, matrix, retry, and isolation files                                                                                               | Historical. Superseded by Stage M, and Stage M is itself subject to §1                                                                                                      |
| Stage K provenance report `a54cb42e7f882f18c4db2297535823d9ed3e8a81c7c70825313ba0c0d2389a62`                                                                            | Historical evidence only                                                                                                                                                    |
| Stage K register report `997829203e94e506ba3d1b0edd0084d715816ef01b87c06d60c365752d486337` and brief `deb0961e59f85a396410425cbbd9abaccc4e2f916b755fd1775cee7a6f2a35dc` | Historical evidence only                                                                                                                                                    |

The other Stage K digests are those already recorded in `STAGE-M-ADOPT-1` §4. They are not re-adopted as the protocol.

## 3. Decision 3 and the small-cell record

This boundary does not state that Decision 3 is approved. `STAGE-O-AUTH-1` classifies the working-tree heading as `UNVERIFIED`. The three name triples are schema strings only. Google privacy text in that uncommitted heading is not confirmed here. No Google send is permitted by this package.

`D-CONN04-CENSUS-OP-HELD-SMALL-CELL` is `UNVERIFIED — NOT AN AUTHORIZED BOUNDARY`. Adoption would not approve inspection, export, publication, or evidentiary use of unsuppressed counts.

## 4. Candidate sentence

`PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`

The following words do nothing until the Product Owner adopts them in a separate decision. They are Decision 4 only if adopted. They are not Decision 5, Decision 6, or Decision 7. The digest of this file is the digest `STAGE-O-VER-1` records for `stage-o-d4-adoption-object-proposal.md`. Insert that digest where the sentence says `STAGE-O-VER-1-DIGEST`.

> I adopt only the following protocol text as Decision 4, and only at the SHA-256 digests I name. I adopt `docs/project/version-3/wave-6/stage-o-severity-blocking-correction-proposal.md` at `52b6a96f6d737cc5a60005cf19e21abb2cd7b24f55e95b0b3c6635c7933b97fa`. I adopt `docs/project/version-3/wave-6/stage-o-authority-and-provenance-correction-proposal.md` at `809e64dfc8a4620d36dc692ab9387843cbd557352cd8a8f598b4ea2f01defb48`. I adopt `docs/project/version-3/wave-6/stage-o-major-findings-remediation-matrix.md` at `441d96e191c2d1ce70a5f06e1b10914eef6009e92c1eace1a0c90cf1ffc9a4af`. I adopt `docs/project/version-3/wave-6/stage-o-d4-adoption-object-proposal.md` at `STAGE-O-VER-1-DIGEST`.
>
> I adopt `docs/project/version-3/wave-6/stage-m-ai-assessment-schema-remediation-proposal.md` at `b562981f2f7f64bef8bd9356c7bb512cc2a9c56c0ecc9db16e2c5bfa9c597647`, `docs/project/version-3/wave-6/stage-m-finding-identity-and-lifecycle-proposal.md` at `0671178a21899386a9985ff9824efd0eb483e5949387c7a4a8ca280def628dea`, `docs/project/version-3/wave-6/stage-m-discrepancy-matrix-semantics-proposal.md` at `9b7c23876644c6d82d543d006e0641de35fb14633ecca1527d9b3c20d937f030`, `docs/project/version-3/wave-6/stage-m-provider-retry-substitution-and-ownership-proposal.md` at `ec4ec0900979c9dc40129ac2ef2af6030815574896967713cb4e575bbb5b966c`, and `docs/project/version-3/wave-6/stage-m-provider-isolation-and-cross-disclosure-proposal.md` at `4bbac76b1b9f8289b73245b0c3c6c66dfd69d4ddfa2364d8e404b0ca5cd96190`, only where the three Stage O files above do not supersede them.
>
> I do not adopt `stage-m-severity-and-blocking-semantics-proposal.md`, `stage-m-d4-adoption-object-and-boundary-proposal.md`, `stage-m-decision-register-reconciliation-report.md`, or `stage-m-adversarial-verification-report.md` as protocol text. I do not adopt Stage M.5 §5. I do not adopt Stage H at `0680abb316b8ba81bd24eb660d3bd3ac650b386b9fc6501f3d126a7857a1d099`, including §3.B(2), §4.1, §4.3, and §9. I do not adopt Stage I.11 at `de102a4a9b7903b350c83375e4c982bbf25dcca12a78c3192125725da2b477f6` as a whole. I retain only the sections listed as retained in the Stage O boundary, and I exclude §10.1 and §12. I do not adopt Stage I.8, Stage I.9, or Stage I.10 approval sentences. I do not adopt the Stage K files as the current protocol.
>
> I do not decide that Decision 3 is approved. I do not treat `D-CONN04-CENSUS-OP-HELD-SMALL-CELL` as an authorized boundary. This decision does not decide Decision 5, Decision 6, or Decision 7. It does not contact a provider, disclose or submit a package, create a Package Anchor or an Evidence Anchor, commence an assessment, execute SQL, execute the Census, publish or transfer Census evidence, close CC-02, perform CC-06, close OQ-CENSUS-01, or ratify Stage 5/6 implementation authorization. `PASS WITH OBSERVATIONS` under the adopted text would not by itself satisfy CC-02.

## 5. Effect

If the Product Owner later adopts §4 with `STAGE-O-VER-1-DIGEST` replaced by the recorded digest, the adoption would fix that protocol text.

It would not authorize Decision 5, Decision 6, Decision 7, provider contact or disclosure, package submission, anchor creation, assessment commencement, SQL execution, Census execution, publication or transfer of Census evidence, CC-06, OQ-CENSUS-01 closure, or Stage 5/6 ratification. It would not confirm Decision 3, approve a small-cell boundary, amend the Decision Register, or complete CC-02.

**This file recommends that the Product Owner review the filled sentence. It does not adopt the sentence.**
