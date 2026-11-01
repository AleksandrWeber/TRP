# Stage M — Adversarial Verification Report

**Document ID:** `STAGE-M-VER-1`
**Version:** `M.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This report checks the Stage M proposals. It does not approve Decision 4. D4 remains **HOLD**.

The candidate sentence in `STAGE-M-ADOPT-1` §6 identifies this boundary file by the digest below. That sentence does not contain the digest, because a file cannot contain its own digest. Before any later adoption, the Product Owner would copy this digest into the decision record:

`docs/project/version-3/wave-6/stage-m-d4-adoption-object-and-boundary-proposal.md`

SHA-256: `4a84f877b33d4632615aa0f6c5d44a2dd810c8a20c903e338e1d14e8a7f3fb9a`

This report's own digest is the digest of its committed bytes and is not embedded here.

---

## 1. Hashes recomputed for this check

| File                                                            | SHA-256                                                            | Matches `STAGE-M-ADOPT-1`                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| `stage-m-severity-and-blocking-semantics-proposal.md`           | `ae2ddc759c91838aa45fcf5bd92bda1d37ac50e29f57819deb4b5c836665c8cc` | Yes                                        |
| `stage-m-ai-assessment-schema-remediation-proposal.md`          | `b562981f2f7f64bef8bd9356c7bb512cc2a9c56c0ecc9db16e2c5bfa9c597647` | Yes                                        |
| `stage-m-finding-identity-and-lifecycle-proposal.md`            | `0671178a21899386a9985ff9824efd0eb483e5949387c7a4a8ca280def628dea` | Yes                                        |
| `stage-m-discrepancy-matrix-semantics-proposal.md`              | `9b7c23876644c6d82d543d006e0641de35fb14633ecca1527d9b3c20d937f030` | Yes                                        |
| `stage-m-provider-retry-substitution-and-ownership-proposal.md` | `ec4ec0900979c9dc40129ac2ef2af6030815574896967713cb4e575bbb5b966c` | Yes                                        |
| `stage-m-provider-isolation-and-cross-disclosure-proposal.md`   | `4bbac76b1b9f8289b73245b0c3c6c66dfd69d4ddfa2364d8e404b0ca5cd96190` | Yes                                        |
| `stage-m-d4-adoption-object-and-boundary-proposal.md`           | `4a84f877b33d4632615aa0f6c5d44a2dd810c8a20c903e338e1d14e8a7f3fb9a` | Own digest, stated here                    |
| `stage-m-decision-register-reconciliation-report.md`            | `1c8c8a9879f43697c9dccbfdc87897158759e3d54706e5da9fe1f2f81663b2fb` | Yes, and it is outside the protocol object |

Source hashes used as inputs matched Stage L: Stage L `2d4b4f8bef5a8f99b84965848c471b2a53ab330165e8fda0d4fbc19d50a212d9`, Stage H `0680abb316b8ba81bd24eb660d3bd3ac650b386b9fc6501f3d126a7857a1d099`, Stage I.11 `de102a4a9b7903b350c83375e4c982bbf25dcca12a78c3192125725da2b477f6`, and the seven Stage K digests cited in `STAGE-M-ADOPT-1` §4. The working-tree register remained `06d3f15e7e7b1e99e5c34a81dd74d626aae2581a71051cf318ca78c729680845`. The committed register remained `648b6bc8f7a071c4edeb2417616d50ceeeb566aef3e56101e525e7acbc08882b`. SQL candidate hash remained `fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c`.

## 2. Stage L finding disposition

| Stage L finding                                    | Disposition                                                                                             | Where addressed                                                                                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1-1 inspection-grant overlap on operator-held `n` | `RESOLVED IN PROPOSAL`                                                                                  | `STAGE-M-SEV-1` §8 gives a closed phrase list and classifies retention wording as not an inspection grant                                                               |
| L1-2 false-positive literals                       | `RESOLVED IN PROPOSAL`                                                                                  | Machine token is only `FALSE-POSITIVE-PREDICATE-NOT-MET`. Spaced historical spellings are invalid stored values                                                         |
| L1-3 matrix residual clears a provider CRITICAL    | `RESOLVED IN PROPOSAL`                                                                                  | `STAGE-M-SEV-1` §5 and §6. A residual token while a critical or high predicate is `MET` or `NOT-DETERMINED` rejects the finding                                         |
| L1-4 examples versus unread SQL runtime            | `RESOLVED IN PROPOSAL` for the classification rule. Runtime remains `NOT VERIFIED` and was not executed | `STAGE-M-SEV-1` header                                                                                                                                                  |
| L1-5 preserved limits                              | `RESOLVED IN PROPOSAL`                                                                                  | Original severity stays immutable. Working severity stays `UNASSIGNED` until Decision 5                                                                                 |
| L2-1 `explicit-limitations`                        | `RESOLVED IN PROPOSAL`                                                                                  | Empty array is invalid. `PROVIDER-STATED-NONE` and `NOT-RECORDED` are different one-item arrays                                                                         |
| L2-2 material-scope shape                          | `RESOLVED IN PROPOSAL`                                                                                  | `STAGE-M-ASSESS-1` §7. Five objects, fixed keys, fixed order                                                                                                            |
| L2-3 timeout                                       | `RESOLVED IN PROPOSAL`                                                                                  | `completion-status` `TIMEOUT` and outcome `TIMED-OUT`. The pair does not count                                                                                          |
| L2-4 outcome and completion pairs                  | `RESOLVED IN PROPOSAL`                                                                                  | `STAGE-M-ASSESS-1` §9 table. Other pairs reject the file                                                                                                                |
| L2-5 Stage I.9 counting bullet                     | `RESOLVED IN PROPOSAL`                                                                                  | `STAGE-M-ASSESS-1` §8 retains the rules by restatement and supersedes the transcript-presence bullet. The Stage I.11 file is not edited                                 |
| L2-6 validation cases                              | `RESOLVED IN PROPOSAL`                                                                                  | §9 and the synthetic timeout example. The example is non-counting because `seal-ref` is `NONE`                                                                          |
| L3-1 identifier case and retry                     | `RESOLVED IN PROPOSAL`                                                                                  | Lowercase hex, no leading zeros, contiguous sequences. Retry uses a new attempt id and a new instance id. `finding-subject-key` is the stable handle and does not merge |
| L3-2 evidence grammar                              | `RESOLVED IN PROPOSAL`                                                                                  | `STAGE-M-FIND-1` §3, including `OFFSET` and `UNAVAILABLE`                                                                                                               |
| L3-3 six cases                                     | `RESOLVED IN PROPOSAL`                                                                                  | `STAGE-M-FIND-1` §5                                                                                                                                                     |
| L3-4 reopening                                     | `RESOLVED IN PROPOSAL`                                                                                  | §4 transitions. Reopening returns critical and high predicates to `NOT-DETERMINED` unless newly determined, which restores the block                                    |
| L3-5 token rename                                  | `RESOLVED IN PROPOSAL`                                                                                  | One machine set. Historical I.9 spellings are not stored                                                                                                                |
| L4-1 `NOT_ASSESSED` has no row                     | `RESOLVED IN PROPOSAL`                                                                                  | It is a coverage `statement` and a position value, not a finding-row status                                                                                             |
| L4-2 partial versus disagreement                   | `RESOLVED IN PROPOSAL`                                                                                  | Precedence in `STAGE-M-MATRIX-1` §5. A contradiction is `DISAGREEMENT`                                                                                                  |
| L4-3 other finding not identified                  | `RESOLVED IN PROPOSAL`                                                                                  | `other-finding-instance-id`                                                                                                                                             |
| L4-4 versioning                                    | `RESOLVED IN PROPOSAL`                                                                                  | New file, same instance id, next revision, predecessor digest. Old file is not edited                                                                                   |
| L4-5 block interaction                             | `RESOLVED IN PROPOSAL`                                                                                  | `predicate-block` copies `STAGE-M-SEV-1` §5. Residual text cannot flip it                                                                                               |
| L5-1 §3.B(2) and I.11 replacement                  | `RESOLVED IN PROPOSAL`                                                                                  | `STAGE-M-SUB-1` §1 and `STAGE-M-ADOPT-1` §2 and §3. Files are not edited                                                                                                |
| L5-2 ownership change                              | `RESOLVED IN PROPOSAL`                                                                                  | `OWNERSHIP-CHANGE` even when the model string and host are unchanged. New D3 decision and a named commencement authorization. Neither is granted                        |
| L5-3 ten cases                                     | `RESOLVED IN PROPOSAL`                                                                                  | `STAGE-M-SUB-1` §4. Every row says submission is not permitted                                                                                                          |
| L6-1 one token, two causes                         | `RESOLVED IN PROPOSAL`                                                                                  | `isolation-gap-reason` separates `PARTIAL-INSTRUCTIONS` from `SEARCH-NOT-RUN`                                                                                           |
| L6-2 excerpt false positive and session            | `RESOLVED IN PROPOSAL`                                                                                  | Excerpt search is retired. Delimited full digest only. Stage I.9 new-session control is retained in `STAGE-M-ISO-1` §4                                                  |
| L6-3 negative search                               | `RESOLVED IN PROPOSAL`                                                                                  | `NO-CROSS-DISCLOSURE-OBSERVED` is not proof and is not PASS                                                                                                             |
| L7 provenance                                      | `RESOLVED IN PROPOSAL` as a limit, not as a new adoption                                                | Stage M does not treat the transcript as a Product Owner decision. Retained rules are restated in the new files                                                         |
| L8 register authority                              | `PARTIALLY RESOLVED` and `REQUIRES PO DECISION`                                                         | `STAGE-M-REG-1` records the diff and recommends quarantine. The register was not modified. The discrepancy remains                                                      |
| L9 adoption object                                 | `RESOLVED IN PROPOSAL` and `REQUIRES PO DECISION`                                                       | `STAGE-M-ADOPT-1` §6 is one candidate sentence. It is not adopted                                                                                                       |
| DB-1 through DB-5                                  | `RESOLVED IN PROPOSAL`                                                                                  | The six normative files plus the boundary                                                                                                                               |
| DB-6 committed register                            | `REQUIRES PO DECISION`                                                                                  | Recording act in `STAGE-M-REG-1` §5. Not performed                                                                                                                      |
| C-11 and C-16                                      | `REQUIRES PO DECISION`                                                                                  | Stale D1/D2 sentences and the Vault-port STOP contradiction                                                                                                             |
| C-13 and C-14                                      | `UNRESOLVED`                                                                                            | Historical review labels and the canvas-citation lag are outside this package. They were not Decision 4 text blockers in Stage L                                        |

## 3. Cross-document checks

| Check                                                    | Result                                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Machine false-positive token                             | One stored token across M.1, M.3, and M.4                                                                           |
| A Medium or Low residual clears a critical or high block | Rejected. It does not clear                                                                                         |
| Timeout becomes `COMPLETE`                               | No legal pair does that                                                                                             |
| Empty limitations array                                  | Invalid                                                                                                             |
| `NOT-ASSESSED` means safe                                | Stated as false on the coverage record                                                                              |
| N−1 quorum                                               | Forbidden in M.4 and M.5                                                                                            |
| Same-configuration retry becomes another provider        | Class table forbids it. Each send still needs commencement authorization, which is not granted                      |
| `NO-CROSS-DISCLOSURE-OBSERVED` called PASS               | Forbidden in M.6                                                                                                    |
| Whole-file Stage I.11 adoption                           | Excluded in M.7 §2 and §6                                                                                           |
| Stage H §4.1, §4.3, §3.B(2), and §9 as the D4 definition | Excluded in M.7 §3 and §6                                                                                           |
| Stage K schemas remain co-equal after adoption           | Supersession table in M.7 §4                                                                                        |
| Register report changes the register                     | It does not. No register bytes were written by Stage M                                                              |
| Normalized assessment grants quorum or EXEC              | Forbidden in M.2                                                                                                    |
| Synthetic timeout example                                | Outcome `TIMED-OUT`, completion `TIMEOUT`, `seal-ref` `NONE`, limitations `NOT-RECORDED`. Non-counting under M.2 §9 |
| Synthetic unavailable evidence object                    | Matches the `UNAVAILABLE` key order in M.3 §3                                                                       |
| Google counting while privacy is deferred                | Forbidden                                                                                                           |

No contradiction between M.1 and M.4 on the block was found. No contradiction between M.5 and M.7 on §3.B(2) and §4.3 was found. The register conflict is left open on purpose.

## 4. Recommendation

**D4 remains HOLD.**

The Stage L specification defects named DB-1 through DB-5 are addressed as proposals. DB-6 is not. The candidate sentence is reviewable and has no effect until the Product Owner adopts it. This report does not adopt it.

CC-02 is not satisfied. CC-06 is not performed. OQ-CENSUS-01 is not closed. SQL EXEC and Census EXEC are not authorized. Stage H and Stage I.11 are not adopted as wholes.
