# Stage N — Review Verification Manifest

**Document ID:** `STAGE-N-MAN-1`
**Version:** `N.1`
**Status:** `PROPOSED — MANIFEST — NOT A PO DECISION`
**Review date:** 2026-11-01

Hashes below were computed in this review with `shasum -a 256` on the working tree or, for the committed register, on `git show HEAD:<path>`. A match means the observed digest equalled the expected digest. Inference from `STAGE-M-VER-1` was not treated as a match.

This file records the digests of the Stage N review report and the Stage N brief. Its own digest is the digest of the committed bytes. Embedding that digest here would change the file, so it is not stored in this table. Recompute it from the committed file after the Stage N commit.

---

## 1. Stage M sources

| Path                                                                                          | Expected SHA-256                                                   | Observed SHA-256                                                   | Result | Status                                        | Method                                |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------ | --------------------------------------------- | ------------------------------------- |
| `docs/project/version-3/wave-6/stage-m-severity-and-blocking-semantics-proposal.md`           | `ae2ddc759c91838aa45fcf5bd92bda1d37ac50e29f57819deb4b5c836665c8cc` | `ae2ddc759c91838aa45fcf5bd92bda1d37ac50e29f57819deb4b5c836665c8cc` | Match  | Read in full                                  | SHA-256 of the file at HEAD `7580040` |
| `docs/project/version-3/wave-6/stage-m-ai-assessment-schema-remediation-proposal.md`          | `b562981f2f7f64bef8bd9356c7bb512cc2a9c56c0ecc9db16e2c5bfa9c597647` | `b562981f2f7f64bef8bd9356c7bb512cc2a9c56c0ecc9db16e2c5bfa9c597647` | Match  | Read in full. Example parsed                  | Same                                  |
| `docs/project/version-3/wave-6/stage-m-finding-identity-and-lifecycle-proposal.md`            | `0671178a21899386a9985ff9824efd0eb483e5949387c7a4a8ca280def628dea` | `0671178a21899386a9985ff9824efd0eb483e5949387c7a4a8ca280def628dea` | Match  | Read in full. Grammars checked                | Same                                  |
| `docs/project/version-3/wave-6/stage-m-discrepancy-matrix-semantics-proposal.md`              | `9b7c23876644c6d82d543d006e0641de35fb14633ecca1527d9b3c20d937f030` | `9b7c23876644c6d82d543d006e0641de35fb14633ecca1527d9b3c20d937f030` | Match  | Read in full                                  | Same                                  |
| `docs/project/version-3/wave-6/stage-m-provider-retry-substitution-and-ownership-proposal.md` | `ec4ec0900979c9dc40129ac2ef2af6030815574896967713cb4e575bbb5b966c` | `ec4ec0900979c9dc40129ac2ef2af6030815574896967713cb4e575bbb5b966c` | Match  | Read in full                                  | Same                                  |
| `docs/project/version-3/wave-6/stage-m-provider-isolation-and-cross-disclosure-proposal.md`   | `4bbac76b1b9f8289b73245b0c3c6c66dfd69d4ddfa2364d8e404b0ca5cd96190` | `4bbac76b1b9f8289b73245b0c3c6c66dfd69d4ddfa2364d8e404b0ca5cd96190` | Match  | Read in full. Digest rule scripted            | Same                                  |
| `docs/project/version-3/wave-6/stage-m-d4-adoption-object-and-boundary-proposal.md`           | `4a84f877b33d4632615aa0f6c5d44a2dd810c8a20c903e338e1d14e8a7f3fb9a` | `4a84f877b33d4632615aa0f6c5d44a2dd810c8a20c903e338e1d14e8a7f3fb9a` | Match  | Read in full                                  | Same                                  |
| `docs/project/version-3/wave-6/stage-m-decision-register-reconciliation-report.md`            | `1c8c8a9879f43697c9dccbfdc87897158759e3d54706e5da9fe1f2f81663b2fb` | `1c8c8a9879f43697c9dccbfdc87897158759e3d54706e5da9fe1f2f81663b2fb` | Match  | Read in full. Compared with the register diff | Same                                  |
| `docs/project/version-3/wave-6/stage-m-adversarial-verification-report.md`                    | `4854c6bf69e02bf44c2f146664195017ddd6267208fe1cda39680153c3538ec3` | `4854c6bf69e02bf44c2f146664195017ddd6267208fe1cda39680153c3538ec3` | Match  | Read in full. Treated as an object of review  | Same                                  |

Commit `7580040fdcf250db3f6f476daa4b40449007307a` matched HEAD and `origin/main` at the start of this review. Branch `main`.

## 2. Historical sources

| Path                                                                                   | Expected SHA-256                                                   | Observed SHA-256                                                   | Result | Status                                                                           | Method                           |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------- | -------------------------------- |
| `docs/project/version-3/wave-6/stage-l-independent-adversarial-review.md`              | `2d4b4f8bef5a8f99b84965848c471b2a53ab330165e8fda0d4fbc19d50a212d9` | `2d4b4f8bef5a8f99b84965848c471b2a53ab330165e8fda0d4fbc19d50a212d9` | Match  | Finding IDs used. Full report not re-litigated line by line                      | SHA-256 and targeted read        |
| `docs/project/version-3/wave-6/stage-h-po-decision-cc02-ai-only-amendment-proposal.md` | `0680abb316b8ba81bd24eb660d3bd3ac650b386b9fc6501f3d126a7857a1d099` | `0680abb316b8ba81bd24eb660d3bd3ac650b386b9fc6501f3d126a7857a1d099` | Match  | §3.B, §4.1, §4.3, §4.4, §9 read. File is untracked                               | SHA-256 of the working-tree file |
| `docs/project/version-3/wave-6/stage-i11-final-assurance-closure-report.md`            | `de102a4a9b7903b350c83375e4c982bbf25dcca12a78c3192125725da2b477f6` | `de102a4a9b7903b350c83375e4c982bbf25dcca12a78c3192125725da2b477f6` | Match  | §6.5, §6.7, §7.6 read                                                            | SHA-256 and targeted read        |
| `docs/project/version-3/wave-6/stage-k-severity-taxonomy-proposal.md`                  | `bee986db2583b0a3c7877f75a98e2b09b9684d41a8cc8fbb8366c79a6cdccedb` | `bee986db2583b0a3c7877f75a98e2b09b9684d41a8cc8fbb8366c79a6cdccedb` | Match  | Hash verified. Text not re-read in full                                          | SHA-256                          |
| `docs/project/version-3/wave-6/stage-k-ai-assessment-output-specification.md`          | `20ddd3177ae1812d9c889b98c54ee15d9508b08d75d3d41846630934b8013467` | `20ddd3177ae1812d9c889b98c54ee15d9508b08d75d3d41846630934b8013467` | Match  | Hash verified. Text not re-read in full                                          | SHA-256                          |
| `docs/project/version-3/wave-6/stage-k-finding-schema.md`                              | `e31b0275d788fce11a6d02943b2baaca0b9bae9b6f51c63f448c4e360f99a9e2` | `e31b0275d788fce11a6d02943b2baaca0b9bae9b6f51c63f448c4e360f99a9e2` | Match  | Hash verified. Text not re-read in full                                          | SHA-256                          |
| `docs/project/version-3/wave-6/stage-k-discrepancy-matrix-schema.md`                   | `28b62c3feb3c0eef525e0a4a251cb8d374b9383524150410382b65f8e7f725b9` | `28b62c3feb3c0eef525e0a4a251cb8d374b9383524150410382b65f8e7f725b9` | Match  | Hash verified. Text not re-read in full                                          | SHA-256                          |
| `docs/project/version-3/wave-6/stage-k-provider-retry-and-substitution-rules.md`       | `6ac450fd166c0aaed2e4f40d6ed1a40678bb95cc363bcbceaaf5fe7ec8dff786` | `6ac450fd166c0aaed2e4f40d6ed1a40678bb95cc363bcbceaaf5fe7ec8dff786` | Match  | Hash verified. Text not re-read in full                                          | SHA-256                          |
| `docs/project/version-3/wave-6/stage-k-isolation-semantics-proposal.md`                | `19434e7456d6a1c8c3855847a38706f463190880df26fa549918daaaf5ef467c` | `19434e7456d6a1c8c3855847a38706f463190880df26fa549918daaaf5ef467c` | Match  | Hash verified. Text not re-read in full                                          | SHA-256                          |
| `docs/project/version-3/wave-6/stage-k-stage-i8-i10-provenance-report.md`              | `a54cb42e7f882f18c4db2297535823d9ed3e8a81c7c70825313ba0c0d2389a62` | `a54cb42e7f882f18c4db2297535823d9ed3e8a81c7c70825313ba0c0d2389a62` | Match  | Hash verified. Transcript not re-opened                                          | SHA-256                          |
| `docs/project/version-3/wave-6/stage-k-decision-register-authority-report.md`          | `997829203e94e506ba3d1b0edd0084d715816ef01b87c06d60c365752d486337` | `997829203e94e506ba3d1b0edd0084d715816ef01b87c06d60c365752d486337` | Match  | Hash verified                                                                    | SHA-256                          |
| `docs/project/version-3/wave-6/stage-k-d4-blocker-resolution-and-po-review-brief.md`   | `deb0961e59f85a396410425cbbd9abaccc4e2f916b755fd1775cee7a6f2a35dc` | `deb0961e59f85a396410425cbbd9abaccc4e2f916b755fd1775cee7a6f2a35dc` | Match  | Hash verified                                                                    | SHA-256                          |
| `docs/project/version-3/wave-6/wave-6-po-decision-register.md` working tree            | `06d3f15e7e7b1e99e5c34a81dd74d626aae2581a71051cf318ca78c729680845` | `06d3f15e7e7b1e99e5c34a81dd74d626aae2581a71051cf318ca78c729680845` | Match  | Diff headings and D1–D3, VMP, F-01, F-02, small-cell, STOP read. File not edited | SHA-256 and `git diff`           |
| Committed register at HEAD                                                             | `648b6bc8f7a071c4edeb2417616d50ceeeb566aef3e56101e525e7acbc08882b` | `648b6bc8f7a071c4edeb2417616d50ceeeb566aef3e56101e525e7acbc08882b` | Match  | Blob `1b671b01615ead0f917fd7acf594f892c000b5a1`. Content hash of `git show`      | SHA-256                          |
| SQL candidate `option-c-vault-id-census-draft.sql`                                     | `fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c` | `fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c` | Match  | Text read for the inspection-grant phrases. Not executed                         | SHA-256 and line read            |

## 3. Sources not inspected

| Source                                                                                      | Status                                                                        |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Stage I.8–I.10 transcript                                                                   | Not opened. Fidelity of the M.2 restatement to that transcript is not claimed |
| Binding Manifest, Authorization Package, Design Canvas, Operator Runbook, Evidence Protocol | Not hashed in this review. No claim about their current digests is made       |
| PostgreSQL, Vault, provider APIs                                                            | Not contacted                                                                 |

## 4. Stage N outputs

| Path                                                                    | SHA-256                                                            | Status                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| `docs/project/version-3/wave-6/stage-n-independent-po-review-report.md` | `c13444fdbb1d852ca7346f1a45713e010b9e067e3973ad639a22b3066c7e2878` | Formatted before this manifest was written |
| `docs/project/version-3/wave-6/stage-n-po-decision-brief.md`            | `a07318a79d28a3d1275bb40d8bd7354261497c6b301ecb3a156934306b058075` | Formatted before this manifest was written |
| `docs/project/version-3/wave-6/stage-n-review-verification-manifest.md` | Digest of the committed bytes. Not embedded                        | This file                                  |

The review report's finding counts are 2 BLOCKER, 7 MAJOR, 10 MINOR, and 6 OBSERVATION groups as written in `STAGE-N-REV-1` §3. This manifest does not change those counts and does not approve Decision 4.
