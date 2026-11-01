# Stage M — D4 Adoption Object and Boundary Proposal

**Document ID:** `STAGE-M-ADOPT-1`
**Version:** `M.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This file proposes the exact object a later Decision 4 could adopt. The candidate sentence in §6 has no authority unless the Product Owner later adopts that sentence in a separate decision. This file does not adopt it. D4 remains **HOLD**.

This file does not embed its own digest. The digest of the committed bytes is recorded in `STAGE-M-VER-1` and in the commit that adds these proposals.

---

## 1. Normative documents in the proposed object

Hashes were measured after Prettier on the working tree, before this file was written. They are SHA-256 of those files.

| Role                               | Path                                                                                          | SHA-256                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Severity and blocking              | `docs/project/version-3/wave-6/stage-m-severity-and-blocking-semantics-proposal.md`           | `ae2ddc759c91838aa45fcf5bd92bda1d37ac50e29f57819deb4b5c836665c8cc` |
| Assessment schema                  | `docs/project/version-3/wave-6/stage-m-ai-assessment-schema-remediation-proposal.md`          | `b562981f2f7f64bef8bd9356c7bb512cc2a9c56c0ecc9db16e2c5bfa9c597647` |
| Finding identity and lifecycle     | `docs/project/version-3/wave-6/stage-m-finding-identity-and-lifecycle-proposal.md`            | `0671178a21899386a9985ff9824efd0eb483e5949387c7a4a8ca280def628dea` |
| Discrepancy matrix                 | `docs/project/version-3/wave-6/stage-m-discrepancy-matrix-semantics-proposal.md`              | `9b7c23876644c6d82d543d006e0641de35fb14633ecca1527d9b3c20d937f030` |
| Retry, substitution, and ownership | `docs/project/version-3/wave-6/stage-m-provider-retry-substitution-and-ownership-proposal.md` | `ec4ec0900979c9dc40129ac2ef2af6030815574896967713cb4e575bbb5b966c` |
| Isolation and cross-disclosure     | `docs/project/version-3/wave-6/stage-m-provider-isolation-and-cross-disclosure-proposal.md`   | `4bbac76b1b9f8289b73245b0c3c6c66dfd69d4ddfa2364d8e404b0ca5cd96190` |
| This boundary                      | `docs/project/version-3/wave-6/stage-m-d4-adoption-object-and-boundary-proposal.md`           | Digest of the committed bytes. Not embedded here                   |

Schema version on the four schemas is `M.1-1`.

Not part of the normative object:

| Path                                                                               | SHA-256                                                            | Role                                        |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| `docs/project/version-3/wave-6/stage-m-decision-register-reconciliation-report.md` | `1c8c8a9879f43697c9dccbfdc87897158759e3d54706e5da9fe1f2f81663b2fb` | Separate evidence report. Not protocol text |
| `docs/project/version-3/wave-6/stage-m-adversarial-verification-report.md`         | Recorded in that file's commit manifest                            | Verification. Not protocol text             |

## 2. Stage I.11–I.13

File: `docs/project/version-3/wave-6/stage-i11-final-assurance-closure-report.md`

SHA-256: `de102a4a9b7903b350c83375e4c982bbf25dcca12a78c3192125725da2b477f6`

The whole file is not adopted.

**Retained, if the candidate sentence is later adopted, as technical grammar only:**

- §4, including path grammar `I.11-ASCII-1` and §4.2 paths;
- §5, including manifest and freeze grammar `I.11-1` and the timestamp grammar in §5.4;
- §6.1 through §6.4;
- §6.5, except the sentence "Replacement requires a separate PO decision," which is read only through `STAGE-M-SUB-1`;
- §6.6;
- §6.7 seal field list and the counting conditions other than the Stage I.9 bullet named below;
- §7.1 through §7.5, including the statement that `scope/review-scope.txt` does not exist;
- §7.4 Evidence Anchor schema;
- §7.6, except the replacement-attempt sentences, which are read only through `STAGE-M-SUB-1`;
- §7.7 and §7.8 as threat analysis, not as permission to build an anchor.

**Superseded for the protocol:**

- §6.7 counting bullet that requires Stage I.9 mandatory assessment content to be present. `STAGE-M-ASSESS-1` §8 and §9 are the proposed replacement. The bullet is not deleted from the file.
- §6.5 and §7.6 insofar as "replacement attempt" is broader than `STAGE-M-SUB-1` §3. Same-configuration retry is not that replacement.
- Any use of missing submitted bytes as `ISOLATION-NOT-EVIDENCED`. `STAGE-M-ISO-1` assigns those bytes to `TRANSMISSION-NOT-EVIDENCED`.

**Excluded:**

- §10.1 item 1, which would adopt this report together with unaffected Stage I.8, I.9, and I.10 text;
- §11's readiness sentence, as an approval;
- §12, the consolidated approval sentence;
- every Stage I.8, I.9, and I.10 approval sentence;
- excerpt matching from recovered Stage I.9 §8.

The Stage I.9 new-session control is retained by restatement in `STAGE-M-ISO-1` §4, not by adopting the transcript.

## 3. Stage H

File: `docs/project/version-3/wave-6/stage-h-po-decision-cc02-ai-only-amendment-proposal.md`

SHA-256: `0680abb316b8ba81bd24eb660d3bd3ac650b386b9fc6501f3d126a7857a1d099`

The file is not edited and is not adopted.

| Section                                                                                               | Treatment                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| §3.B as a whole                                                                                       | Remains the Decision 1 amendment candidate in the uncommitted register, if that record is later confirmed. It is not operative CC-02. This decision would not adopt it         |
| §3.B(2) replacement-provider clause                                                                   | Excluded from the protocol. `STAGE-M-SUB-1` is the proposed rule. A future Decision 6 must not copy §3.B(2) into operative criteria                                            |
| §4.1                                                                                                  | Excluded. The unselected roster table is not the D3 roster                                                                                                                     |
| §4.2                                                                                                  | Not the package grammar. Stage I.11 sections retained in §2, plus the existing bound hashes, are the package rules. §4.2 is not adopted                                        |
| §4.3 replacement sentence                                                                             | Excluded. `STAGE-M-SUB-1` §1 names it as superseded for the protocol                                                                                                           |
| §4.4 sentences that say the taxonomy is unpublished and that the proposal does not invent definitions | Superseded for the protocol by `STAGE-M-SEV-1`. The block and non-equivalence limits in §4.4 that match `STAGE-M-SEV-1` are already restated there. §4.4 itself is not adopted |
| §9, including the wording that Decision 4 approves "the Stage H.1 §4 assessment protocol"             | Excluded as the definition of Decision 4. The candidate sentence in §6 replaces that definition. Stage H §9 remains historical draft text                                      |

Stage H stays `DRAFT — PROPOSAL ONLY — NOT ADOPTED`.

## 4. Stage K

| File                                                   | SHA-256                                                            | Treatment                         |
| ------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------- |
| `stage-k-severity-taxonomy-proposal.md`                | `bee986db2583b0a3c7877f75a98e2b09b9684d41a8cc8fbb8366c79a6cdccedb` | Superseded by `STAGE-M-SEV-1`     |
| `stage-k-ai-assessment-output-specification.md`        | `20ddd3177ae1812d9c889b98c54ee15d9508b08d75d3d41846630934b8013467` | Superseded by `STAGE-M-ASSESS-1`  |
| `stage-k-finding-schema.md`                            | `e31b0275d788fce11a6d02943b2baaca0b9bae9b6f51c63f448c4e360f99a9e2` | Superseded by `STAGE-M-FIND-1`    |
| `stage-k-discrepancy-matrix-schema.md`                 | `28b62c3feb3c0eef525e0a4a251cb8d374b9383524150410382b65f8e7f725b9` | Superseded by `STAGE-M-MATRIX-1`  |
| `stage-k-provider-retry-and-substitution-rules.md`     | `6ac450fd166c0aaed2e4f40d6ed1a40678bb95cc363bcbceaaf5fe7ec8dff786` | Superseded by `STAGE-M-SUB-1`     |
| `stage-k-isolation-semantics-proposal.md`              | `19434e7456d6a1c8c3855847a38706f463190880df26fa549918daaaf5ef467c` | Superseded by `STAGE-M-ISO-1`     |
| `stage-k-stage-i8-i10-provenance-report.md`            | `a54cb42e7f882f18c4db2297535823d9ed3e8a81c7c70825313ba0c0d2389a62` | Historical recovery evidence only |
| `stage-k-decision-register-authority-report.md`        | `997829203e94e506ba3d1b0edd0084d715816ef01b87c06d60c365752d486337` | Historical finding only           |
| `stage-k-d4-blocker-resolution-and-po-review-brief.md` | `deb0961e59f85a396410425cbbd9abaccc4e2f916b755fd1775cee7a6f2a35dc` | Historical proposal brief only    |

Stage K files remain `PROPOSED — NOT ADOPTED` as historical proposals. They are not a second protocol beside Stage M.

## 5. Boundary consistency

The candidate sentence below does not adopt:

- Stage H §4.1 or the §4.3 replacement sentence;
- Stage H §3.B(2);
- Stage H §9 as the definition of Decision 4;
- the whole Stage I.11 file;
- Stage I.11 §10.1 or §12;
- the Stage I.11 §6.7 requirement that unadopted Stage I.9 text be present, except the restatements expressly listed in `STAGE-M-ASSESS-1` §8;
- the Stage K specifications as current normative text after the supersession table in §4.

The Decision Register discrepancy remains **OPEN**. `STAGE-M-REG-1` does not close it. A committed Decision 4 entry still requires the separate recording act described there. That open item is why this file recommends that Decision 4 stay **HOLD** until the Product Owner both accepts a sentence of this kind and completes that recording act. This file does not perform either one.

## 6. Candidate adoption sentence

`PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`

The following words are a candidate for later copy. They do nothing until the Product Owner adopts them in a separate decision. Adopting them would be Decision 4 only. It would not be Decision 5, Decision 6, or Decision 7.

> I adopt only the following protocol text as Decision 4, and only at the SHA-256 digests I name. I adopt `docs/project/version-3/wave-6/stage-m-severity-and-blocking-semantics-proposal.md` at `ae2ddc759c91838aa45fcf5bd92bda1d37ac50e29f57819deb4b5c836665c8cc`. I adopt `docs/project/version-3/wave-6/stage-m-ai-assessment-schema-remediation-proposal.md` at `b562981f2f7f64bef8bd9356c7bb512cc2a9c56c0ecc9db16e2c5bfa9c597647`. I adopt `docs/project/version-3/wave-6/stage-m-finding-identity-and-lifecycle-proposal.md` at `0671178a21899386a9985ff9824efd0eb483e5949387c7a4a8ca280def628dea`. I adopt `docs/project/version-3/wave-6/stage-m-discrepancy-matrix-semantics-proposal.md` at `9b7c23876644c6d82d543d006e0641de35fb14633ecca1527d9b3c20d937f030`. I adopt `docs/project/version-3/wave-6/stage-m-provider-retry-substitution-and-ownership-proposal.md` at `ec4ec0900979c9dc40129ac2ef2af6030815574896967713cb4e575bbb5b966c`. I adopt `docs/project/version-3/wave-6/stage-m-provider-isolation-and-cross-disclosure-proposal.md` at `4bbac76b1b9f8289b73245b0c3c6c66dfd69d4ddfa2364d8e404b0ca5cd96190`. I adopt the boundary statement in `docs/project/version-3/wave-6/stage-m-d4-adoption-object-and-boundary-proposal.md` at the digest recorded for that file in the Stage M commit, and I do not adopt any other bytes of that commit.
>
> From `docs/project/version-3/wave-6/stage-i11-final-assurance-closure-report.md` at `de102a4a9b7903b350c83375e4c982bbf25dcca12a78c3192125725da2b477f6`, I retain only the sections listed as retained in that boundary statement. I do not adopt the file as a whole. I do not adopt §10.1 or §12. I supersede the §6.7 counting bullet that requires Stage I.9 transcript content, and I supersede the replacement-attempt sentences in §6.5 and §7.6 to the extent `STAGE-M-SUB-1` defines them. I do not adopt Stage I.8, Stage I.9, or Stage I.10 approval sentences. I retain the new-session control only as restated in `STAGE-M-ISO-1`.
>
> I do not adopt `docs/project/version-3/wave-6/stage-h-po-decision-cc02-ai-only-amendment-proposal.md` at `0680abb316b8ba81bd24eb660d3bd3ac650b386b9fc6501f3d126a7857a1d099`. I exclude §4.1, the §4.3 replacement sentence, §3.B(2), and §9's definition of Decision 4. Stage H remains draft. Operative CC-02 wording remains unchanged. The Stage K normative files listed as superseded in the boundary statement are not the protocol.
>
> This decision does not decide Decision 5, Decision 6, or Decision 7. It does not contact a provider, disclose or submit a package, create a Package Anchor or an Evidence Anchor, commence an assessment, execute SQL, execute the Census, publish or transfer Census evidence, close CC-02, perform CC-06, close OQ-CENSUS-01, or ratify Stage 5/6 implementation authorization. `PASS WITH OBSERVATIONS` under the adopted text would not by itself satisfy CC-02.

## 7. What that sentence would and would not do

If the Product Owner later adopts §6 unchanged, the adoption would fix the protocol text at those digests and the retained Stage I.11 sections.

It would not authorize provider contact or disclosure, package submission, anchor creation, assessment commencement, SQL execution, Census execution, publication or transfer of Census evidence, CC-06, OQ-CENSUS-01 closure, or Stage 5/6 ratification. It would not designate an adjudicator, bind an endpoint, appoint a custodian, or decide Google privacy. It would not amend the Decision Register. It would not complete CC-02.

**Recommendation of this proposal: D4 remains HOLD until the Product Owner makes a separate decision. This file is not that decision.**
