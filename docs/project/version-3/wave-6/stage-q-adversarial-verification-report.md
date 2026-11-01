# Stage Q — Adversarial Verification Report

**Document ID:** `STAGE-Q-VER-1`
**Version:** `Q.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This report checks the Stage Q files written in this stage. It does not approve Decision 4. It is a same-stage check, not a second-party review. A later independent review can still falsify it. Passing these checks does not make Decision 4 ready for approval.

**Recommendation recorded for the PO brief: READY FOR PO REVIEW — NOT ADOPTED.**

Digest of `docs/project/version-3/wave-6/stage-q-d4-adoption-object.md`:

`e497a6577b3c20149c7f44ec52a4eed79dca63f462ab2cf4cf3b211ad466a0d2`

---

## 1. Source and successor hashes

Stage O files were read from HEAD `323a65b2f43fae469f81f9329250f2768f93ca7a` and matched the expected digests.

| Path                                                                                    | SHA-256                                                            |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `docs/project/version-3/wave-6/stage-o-severity-blocking-correction-proposal.md`        | `52b6a96f6d737cc5a60005cf19e21abb2cd7b24f55e95b0b3c6635c7933b97fa` |
| `docs/project/version-3/wave-6/stage-o-authority-and-provenance-correction-proposal.md` | `809e64dfc8a4620d36dc692ab9387843cbd557352cd8a8f598b4ea2f01defb48` |
| `docs/project/version-3/wave-6/stage-o-major-findings-remediation-matrix.md`            | `441d96e191c2d1ce70a5f06e1b10914eef6009e92c1eace1a0c90cf1ffc9a4af` |
| `docs/project/version-3/wave-6/stage-o-d4-adoption-object-proposal.md`                  | `8bd02c37e9335463fb8b77b4de2b705c8cadad87ff2d13e1358ef2d1718f060b` |
| `docs/project/version-3/wave-6/stage-o-adversarial-verification-report.md`              | `29c237135f7ba50afd4123fe3dd57cfaef611906eef0951e7bcee85b2bf9c9ca` |

Successor files hashed before this report was written:

| Path                                                       | SHA-256                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| `stage-q-normative-severity-and-blocking-specification.md` | `7199a46aabbd4c55a2566b9fa9a790885637a133c255938dac36ffa283a8a242` |
| `stage-q-clearing-bundle-and-correlation-specification.md` | `517c0b95763ff357b7c55eb23468bf193921661d7547e350023e85d6e5f8f8ee` |
| `stage-q-enum-and-schema-validation-specification.md`      | `17df720b2b9575c58ae94b6ec996743bbbddb9312946101158546cf5fad67f24` |
| `stage-q-inspection-grant-adversarial-tests.md`            | `e87b90edcb35e2f91fda7bbb1037b936833785dc023b5f989efeb17fe22b05ff` |
| `stage-q-counting-attempt-and-isolation-specification.md`  | `5dacebb18cd8a473c3f931cb88ab0b3139259e21d186308d27c2bb80db29a7fe` |
| `stage-q-authority-and-provenance-correction.md`           | `51f1181560d7beda03613d4082fb22296b4d7bcccc689ca24302ec5f2b0b6f67` |
| `stage-q-d4-adoption-object.md`                            | `e497a6577b3c20149c7f44ec52a4eed79dca63f462ab2cf4cf3b211ad466a0d2` |

The sentence in §4 names those seven digests. Inherited Stage M and Stage I.11 digests in the same sentence were recomputed from HEAD and matched. Referenced repository paths for those inherited files exist. The frozen Design Content Baseline file was not found. The current canvas file was read and hashes to `c70f45dcfbc74f55765bd682caa6ebff551673cf06120e76d9222251a0680c2e`. It is not the frozen baseline.

## 2. Correction matrix

| ID  | Status                | Evidence                                                                           |
| --- | --------------------- | ---------------------------------------------------------------------------------- |
| Q1  | Corrected in proposal | `STAGE-Q-SEV-1` §2 and §3. `STAGE-M-SEV-1` is not in the normative set             |
| Q2  | Corrected in proposal | `STAGE-Q-SEV-1` §5. Algorithm remains **OPEN**                                     |
| Q3  | Corrected in proposal | `STAGE-Q-CLEAR-1` §2 and §3. Tests `Q3-MISSING-KEY` through `Q3-NO-SIBLING` passed |
| Q4  | Corrected in proposal | `STAGE-Q-ENUM-1` §1 through §5. Clearing tests passed                              |
| Q5  | Corrected in proposal | `STAGE-Q-PHRASE-1`. Phrase tests passed, including a later affirmative sentence    |
| Q6  | Corrected in proposal | `STAGE-Q-COUNT-1` §1. Equal-timestamp and sibling tests passed                     |
| Q7  | Corrected in proposal | `STAGE-Q-COUNT-1` §2 and §3. Overwrite test returned `overwrite-forbidden`         |
| Q8  | Corrected in proposal | `STAGE-Q-AUTH-1`. Register file was not edited                                     |
| Q9  | Corrected in proposal | §4 below. No placeholder token appears in the sentence                             |

## 3. Test results

Every row was produced by executing `docs/project/version-3/wave-6/stage-q-validation-checks.py`. The input for each test ID is the case built in that script. Phrase inputs are also stated in `STAGE-Q-PHRASE-1` §6. Counting and isolation inputs are stated in `STAGE-Q-COUNT-1` §5. No row is marked `PASS` without that execution. Result: 67 `PASS`, 0 `FAIL`.

| Test                                  | Expected                                                           | Actual                                                             | Result |
| ------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------ |
| `Q-SQL-HASH`                          | `fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c` | `fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c` | PASS   |
| `Q5-L40-PUBLISH`                      | `NO-HIT`                                                           | `NO-HIT`                                                           | PASS   |
| `Q5-L40-PUBLISHED-WORD`               | `HIT`                                                              | `HIT`                                                              | PASS   |
| `Q5-L36-PHRASE`                       | `NO-HIT`                                                           | `NO-HIT`                                                           | PASS   |
| `Q5-L182-PHRASE`                      | `NO-HIT`                                                           | `NO-HIT`                                                           | PASS   |
| `Q5-L40-WINDOW`                       | `NO-GRANT`                                                         | `NO-GRANT`                                                         | PASS   |
| `Q5-L90-WINDOW`                       | `NO-GRANT`                                                         | `NO-GRANT`                                                         | PASS   |
| `Q5-L264-WINDOW`                      | `NO-GRANT`                                                         | `NO-GRANT`                                                         | PASS   |
| `Q5-L182-WINDOW`                      | `NO-GRANT`                                                         | `NO-GRANT`                                                         | PASS   |
| `Q5-L184-PUBLISH`                     | `HIT`                                                              | `HIT`                                                              | PASS   |
| `Q5-L184-LIMITED`                     | `LIMITED`                                                          | `LIMITED`                                                          | PASS   |
| `Q5-SYN-INSPECT`                      | `GRANT`                                                            | `GRANT`                                                            | PASS   |
| `Q5-SYN-NEGATED`                      | `NO-GRANT`                                                         | `NO-GRANT`                                                         | PASS   |
| `Q5-SYN-LATER-GRANT`                  | `GRANT`                                                            | `GRANT`                                                            | PASS   |
| `Q5-SYN-AFTER-LIST`                   | `GRANT`                                                            | `GRANT`                                                            | PASS   |
| `Q5-SYN-SAME-CLAUSE`                  | `NO-GRANT`                                                         | `NO-GRANT`                                                         | PASS   |
| `Q5-SYN-BUT`                          | `GRANT`                                                            | `GRANT`                                                            | PASS   |
| `Q5-SYN-PUBLICATION`                  | `NO-GRANT`                                                         | `NO-GRANT`                                                         | PASS   |
| `Q5-SYN-BEFORE-ANY`                   | `NO-GRANT`                                                         | `NO-GRANT`                                                         | PASS   |
| `Q5-SYN-MAY-PUBLISH`                  | `GRANT`                                                            | `GRANT`                                                            | PASS   |
| `Q4-UNRESOLVED-CRITICAL`              | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-UNRESOLVED-HIGH`                  | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-CONFIRMED-CRITICAL`               | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-CONFIRMED-HIGH`                   | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-NOT-MET-UNRESOLVED`               | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-MEDIUM-RESIDUAL`                  | `NOT-BLOCKING`                                                     | `NOT-BLOCKING`                                                     | PASS   |
| `Q4-LOW-RESIDUAL`                     | `NOT-BLOCKING`                                                     | `NOT-BLOCKING`                                                     | PASS   |
| `Q4-MEDIUM-NONE`                      | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-RETRACTED`                        | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-REOPENED`                         | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-FALSE-POSITIVE`                   | `NOT-BLOCKING`                                                     | `NOT-BLOCKING`                                                     | PASS   |
| `Q4-MISSING-EVIDENCE`                 | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-MISSING-RATIONALE`                | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-SHORT-RATIONALE`                  | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q3-MISSING-KEY`                      | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q3-MISSING-KEY-STATE`                | `SUBJECT-KEY-ABSENT`                                               | `SUBJECT-KEY-ABSENT`                                               | PASS   |
| `Q3-MALFORMED-KEY`                    | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q3-CORRELATED-BLOCK`                 | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q3-NO-MERGE`                         | `DISTINCT`                                                         | `DISTINCT`                                                         | PASS   |
| `Q3-TWO-CLEAR-SAME-KEY`               | `NOT-BLOCKING`                                                     | `NOT-BLOCKING`                                                     | PASS   |
| `Q3-SIBLING-STILL-PRESENT`            | `NOT-BLOCKING`                                                     | `NOT-BLOCKING`                                                     | PASS   |
| `Q3-NO-SIBLING`                       | `NO-CORRELATED-BLOCK`                                              | `NO-CORRELATED-BLOCK`                                              | PASS   |
| `Q4-RESIDUAL-DOES-NOT-CLEAR-CRITICAL` | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-ACTOR-CURSOR`                     | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-ACTOR-PROVIDER`                   | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-UNKNOWN-SEVERITY`                 | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-HISTORICAL-SPELLING`              | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q4-SUPERSEDED`                       | `BLOCKING`                                                         | `BLOCKING`                                                         | PASS   |
| `Q6-EQUAL-TIME-WINNER`                | `ATTEMPT-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`                         | `ATTEMPT-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`                         | PASS   |
| `Q6-ORDER-INDEPENDENT`                | `ATTEMPT-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`                         | `ATTEMPT-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`                         | PASS   |
| `Q6-LOSER-RETAINED`                   | `ATTEMPT-abababababababababababababababab`                         | `ATTEMPT-abababababababababababababababab`                         | PASS   |
| `Q6-NOT-A-VOTE`                       | `False`                                                            | `False`                                                            | PASS   |
| `Q6-EARLIEST`                         | `ATTEMPT-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`                         | `ATTEMPT-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`                         | PASS   |
| `Q6-RETRY-COUNT`                      | `2`                                                                | `2`                                                                | PASS   |
| `Q6-CROSS-COVERAGE`                   | `NOT-COUNTING`                                                     | `NOT-COUNTING`                                                     | PASS   |
| `Q6-CROSS-REASON`                     | `CROSS-DISCLOSURE-DETECTED`                                        | `CROSS-DISCLOSURE-DETECTED`                                        | PASS   |
| `Q6-CROSS-WINNER`                     | `None`                                                             | `None`                                                             | PASS   |
| `Q6-SESSION-COVERAGE`                 | `NOT-COUNTING`                                                     | `NOT-COUNTING`                                                     | PASS   |
| `Q6-NO-PROVIDER-SWITCH`               | `ATTEMPT-cccccccccccccccccccccccccccccccc`                         | `ATTEMPT-cccccccccccccccccccccccccccccccc`                         | PASS   |
| `Q6-OTHER-PROVIDER`                   | `ATTEMPT-eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`                         | `ATTEMPT-eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`                         | PASS   |
| `Q7-OVERLAP-KEEPS-CAPTURE`            | `OK`                                                               | `OK`                                                               | PASS   |
| `Q7-OVERLAP-CAPTURE-VALUE`            | `PARTIAL-INSTRUCTIONS`                                             | `PARTIAL-INSTRUCTIONS`                                             | PASS   |
| `Q7-OVERWRITE-REJECTED`               | `overwrite-forbidden`                                              | `overwrite-forbidden`                                              | PASS   |
| `Q7-EMPTY-PRIOR`                      | `OK`                                                               | `OK`                                                               | PASS   |
| `Q7-EMPTY-PRIOR-NOT-SEARCH-SKIP`      | `empty-prior-is-not-search-not-run`                                | `empty-prior-is-not-search-not-run`                                | PASS   |
| `Q7-TRANSMISSION-SPLIT`               | `transmission-isolation`                                           | `transmission-isolation`                                           | PASS   |
| `Q7-SEARCH-NOT-RUN`                   | `OK`                                                               | `OK`                                                               | PASS   |

## 4. Exact adoption candidate sentence

The sentence is identical to the sentence in `STAGE-Q-BRIEF-1` §7. It includes the adoption-file digest measured above. It contains no placeholder token.

```text
I adopt only the following protocol text as Decision 4, and only at the SHA-256 digests I name. I adopt `docs/project/version-3/wave-6/stage-q-normative-severity-and-blocking-specification.md` at `7199a46aabbd4c55a2566b9fa9a790885637a133c255938dac36ffa283a8a242`. I adopt `docs/project/version-3/wave-6/stage-q-clearing-bundle-and-correlation-specification.md` at `517c0b95763ff357b7c55eb23468bf193921661d7547e350023e85d6e5f8f8ee`. I adopt `docs/project/version-3/wave-6/stage-q-enum-and-schema-validation-specification.md` at `17df720b2b9575c58ae94b6ec996743bbbddb9312946101158546cf5fad67f24`. I adopt `docs/project/version-3/wave-6/stage-q-inspection-grant-adversarial-tests.md` at `e87b90edcb35e2f91fda7bbb1037b936833785dc023b5f989efeb17fe22b05ff`. I adopt `docs/project/version-3/wave-6/stage-q-counting-attempt-and-isolation-specification.md` at `5dacebb18cd8a473c3f931cb88ab0b3139259e21d186308d27c2bb80db29a7fe`. I adopt `docs/project/version-3/wave-6/stage-q-authority-and-provenance-correction.md` at `51f1181560d7beda03613d4082fb22296b4d7bcccc689ca24302ec5f2b0b6f67`. I adopt `docs/project/version-3/wave-6/stage-q-d4-adoption-object.md` at `e497a6577b3c20149c7f44ec52a4eed79dca63f462ab2cf4cf3b211ad466a0d2`. I inherit only the sections listed in that adoption file's section 2, only at the digests named in this sentence, and only where the Stage Q files above do not supersede them. I inherit `docs/project/version-3/wave-6/stage-m-ai-assessment-schema-remediation-proposal.md` at `b562981f2f7f64bef8bd9356c7bb512cc2a9c56c0ecc9db16e2c5bfa9c597647` sections 4, 5, 6, 7, and 9, except the schema-version token and the isolation-result and session-separation rows. I inherit `docs/project/version-3/wave-6/stage-m-finding-identity-and-lifecycle-proposal.md` at `0671178a21899386a9985ff9824efd0eb483e5949387c7a4a8ca280def628dea` sections 1, 3, and 4, except the block calculation and except the sentence that provider text asking for another human value invalidates the finding. I inherit `docs/project/version-3/wave-6/stage-m-provider-isolation-and-cross-disclosure-proposal.md` at `4bbac76b1b9f8289b73245b0c3c6c66dfd69d4ddfa2364d8e404b0ca5cd96190` sections 1, 3, and 4. I do not inherit that file's section 2. I retain `docs/project/version-3/wave-6/stage-i11-final-assurance-closure-report.md` at `de102a4a9b7903b350c83375e4c982bbf25dcca12a78c3192125725da2b477f6` only for the sections listed in the adoption file's section 2. I do not adopt that file as a whole, and I do not adopt its sections 10.1 and 12. I do not adopt the Stage M severity, adoption, register, or verification files. I do not adopt Stage M.5 §5. I do not adopt the Stage M matrix or retry files as protocol text. I do not adopt Stage H at `0680abb316b8ba81bd24eb660d3bd3ac650b386b9fc6501f3d126a7857a1d099`, including §3.B(2), §4.1, §4.3, and §9. I do not adopt Stage I.8, Stage I.9, or Stage I.10 approval sentences. I do not adopt Stage K, Stage N, or Stage O as the current protocol. I do not adopt the Stage Q checker, verification report, or PO brief as protocol text. Stage Q and its predecessors remain proposals until this sentence is adopted. I do not approve Decision 5, Decision 6, or Decision 7. I do not authorize provider contact, account creation, or package disclosure. I do not authorize assessment commencement. This decision does not satisfy CC-02, perform CC-06, or close OQ-CENSUS-01. It does not authorize SQL EXEC or Census EXEC. It does not authorize publication or export. It does not create a Package Anchor or an Evidence Anchor. It does not decide that a Decision 3 register entry is committed. It does not treat `D-CONN04-CENSUS-OP-HELD-SMALL-CELL` as an authorized inspection boundary. `PASS WITH OBSERVATIONS` under the adopted text would not by itself satisfy CC-02.
```

## 5. Protected artifacts

The SQL candidate hash check `Q-SQL-HASH` passed. The file was not modified and was not executed. No Stage Q document records SQL execution, Census execution, or provider contact as having occurred. The Decision Register working tree and the pre-existing dirty paths were left untouched by this stage's writes.

## 6. Residual limits

N-m2 and N-m8 stay **OPEN**. Complementary-suppression implementation stays **OPEN**. Baseline bytes `7714f95b…` were not verified. Register reconciliation stays outstanding. This report does not call itself independent assurance.

**This report does not adopt the sentence.**
