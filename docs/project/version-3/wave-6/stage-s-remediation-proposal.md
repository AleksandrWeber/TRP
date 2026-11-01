# Stage S — Remediation Proposal

**Document ID:** `STAGE-S-PROP-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This file proposes remediation for defects found in the independent Product Owner review of the Stage Q / Stage R working tree. It does not implement those corrections. It does not adopt Stage Q or Stage R. Decision 4 remains **NOT APPROVED**.

Labels used below:

- **Fact** — bytes, line numbers, or wording read from the current working tree in this task.
- **Observed behavior** — behavior shown by reading the current functions, or behavior the independent review already reported. This task did not run the checker.
- **Proposed correction** — a change that a later authorized task could make. It is not made here.
- **Unresolved interpretation** — a point the current normative text does not settle. This proposal does not choose it.

---

## 1. Executive summary and proposed scope

**Fact.** The current checker and four Stage Q specifications differ from commit `d74897e1fda5769507dab1de8705c3781ba6b1b0`. Stage R recorded those working-tree bytes and did not commit them. The copy-complete adoption sentence still names the committed digests.

**Proposed scope.** A later authorized implementation may correct three checker defects and may add regression tests for compatibility rules the current text already states:

| ID   | Severity               | Kind                                                           |
| ---- | ---------------------- | -------------------------------------------------------------- |
| S-01 | BLOCKER                | Checker correlation skips a non-`VALID` sibling                |
| S-02 | MAJOR                  | Checker folds case with Unicode `casefold()`                   |
| S-03 | MAJOR                  | Checker hashes a projection that drops unexpected prior fields |
| S-04 | MAJOR / OPEN           | `COMPLETE` with `PARTIAL` instructions is not settled          |
| S-05 | SPECIFICATION QUESTION | Window-level subject scope requires a PO choice                |
| S-06 | SPECIFICATION QUESTION | Review-token precedence requires a PO choice                   |

S-04's unsettled cell, S-05, and S-06 are decision items. They are not silent specification edits.

Out of that scope: Decision 4 adoption, a replacement adoption sentence, any edit to the existing Stage Q or Stage R files, the Decision Register, the SQL candidate, provider contact, and execution of the checker.

## 2. Verified source inventory

HEAD for this inventory is `d74897e1fda5769507dab1de8705c3781ba6b1b0`. Digests are SHA-256 of the raw file bytes. Nothing in this inventory was staged. `git diff --cached` for these paths was empty.

### 2.1 Checker

| Item                     | Value                                                              |
| ------------------------ | ------------------------------------------------------------------ |
| Path                     | `docs/project/version-3/wave-6/stage-q-validation-checks.py`       |
| Working-tree SHA-256     | `1fdbc00408eab8e717819aa584dd32351460b95214768c9c510ea08d123cdfd2` |
| Working-tree size        | 57797 bytes                                                        |
| Working-tree lines       | 1487                                                               |
| HEAD SHA-256             | `0e88b6c5af454b62fdc44e1d6df57ef837ded60a7a51ad938a368e4974357af7` |
| HEAD size / lines        | 40122 bytes / 1091 lines                                           |
| HEAD versus working tree | Different                                                          |
| Staged                   | No                                                                 |
| Unstaged                 | Yes                                                                |

**Fact.** `STAGE-R-REM-1` §3 and `stage-r-change-manifest.md` both name checker digest `1fdbc00408eab8e717819aa584dd32351460b95214768c9c510ea08d123cdfd2`. That value equals the working-tree digest measured in this task. It does not equal the HEAD blob.

**Fact.** There is no discrepancy between the Stage R checker digest and the current working-tree bytes. The discrepancy is with HEAD. Stage R states that no commit was created. The Stage R digest identifies the uncommitted working-tree file, not the committed blob. This proposal does not treat those two blobs as the same file.

### 2.2 Stage Q sources

| Path                                                                                     | Working-tree SHA-256                                               | Bytes | Lines | HEAD SHA-256                                                       | Versus HEAD         |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----- | ----- | ------------------------------------------------------------------ | ------------------- |
| `docs/project/version-3/wave-6/stage-q-clearing-bundle-and-correlation-specification.md` | `772fd3de1e8c173e3769fb8af31afb3d9fffe57f25d486cae24a54087bb45262` | 8779  | 87    | `517c0b95763ff357b7c55eb23468bf193921661d7547e350023e85d6e5f8f8ee` | Different, unstaged |
| `docs/project/version-3/wave-6/stage-q-enum-and-schema-validation-specification.md`      | `100343db2ff27953fa4a09c047bccc6bd8472b849b1b198e1cc745df3f48c609` | 15565 | 134   | `17df720b2b9575c58ae94b6ec996743bbbddb9312946101158546cf5fad67f24` | Different, unstaged |
| `docs/project/version-3/wave-6/stage-q-inspection-grant-adversarial-tests.md`            | `0bd61a1749f0f9809e29e9fe2b8fceb60f53d6885fcdb3f29a070f79793a16f8` | 7036  | 84    | `e87b90edcb35e2f91fda7bbb1037b936833785dc023b5f989efeb17fe22b05ff` | Different, unstaged |
| `docs/project/version-3/wave-6/stage-q-counting-attempt-and-isolation-specification.md`  | `1cc25528ddb2fe763ff5358ac81aff93d4635e424787a34d77bdcb3098433479` | 15863 | 117   | `5dacebb18cd8a473c3f931cb88ab0b3139259e21d186308d27c2bb80db29a7fe` | Different, unstaged |
| `docs/project/version-3/wave-6/stage-q-normative-severity-and-blocking-specification.md` | `7199a46aabbd4c55a2566b9fa9a790885637a133c255938dac36ffa283a8a242` | 10524 | 106   | `7199a46aabbd4c55a2566b9fa9a790885637a133c255938dac36ffa283a8a242` | Same                |
| `docs/project/version-3/wave-6/stage-q-authority-and-provenance-correction.md`           | `51f1181560d7beda03613d4082fb22296b4d7bcccc689ca24302ec5f2b0b6f67` | 4121  | 50    | `51f1181560d7beda03613d4082fb22296b4d7bcccc689ca24302ec5f2b0b6f67` | Same                |
| `docs/project/version-3/wave-6/stage-q-d4-adoption-object.md`                            | `189dab80a4692f0af836cc329a2c5440603128198f60e6f10c6f5ea7df7e3852` | 12368 | 74    | `e497a6577b3c20149c7f44ec52a4eed79dca63f462ab2cf4cf3b211ad466a0d2` | Different, unstaged |
| `docs/project/version-3/wave-6/stage-q-final-po-review-brief.md`                         | `8ab5a22b4b2718f136045b6ae0d2c554e51d3c4f894aca3fd8713388482691f5` | 10498 | 76    | `8174ac31a10035c136da97ceda22a8beb0f2ad0bba09676043ad72f64b186de8` | Different, unstaged |
| `docs/project/version-3/wave-6/stage-q-adversarial-verification-report.md`               | `a0435681268d5b6a9967a08dd941a14207fa5ea5ac0e8bd1ab10003953435bae` | 23516 | 150   | `dba515ea7ca04602cc0746397bd859e27484c5c4333fde0de5ae7e087cd4c18c` | Different, unstaged |

The severity and authority files are the two Stage Q files the change manifest lists as unchanged. Their working-tree digests match HEAD and match the adoption sentence.

### 2.3 Stage R sources

| Path                                                          | Working-tree SHA-256                                               | Bytes | Lines | HEAD   |
| ------------------------------------------------------------- | ------------------------------------------------------------------ | ----- | ----- | ------ |
| `docs/project/version-3/wave-6/stage-r-remediation-report.md` | `2292560c8845b9c00667f149eaf57f6c03b30046c84349a48dbb0a25131105be` | 46596 | 133   | Absent |
| `docs/project/version-3/wave-6/stage-r-change-manifest.md`    | `cc24c8f877f2d8d067b033969dc468b75824caf26145d13c980d604787f451ac` | 2141  | 21    | Absent |

**Fact.** Both Stage R files are untracked. The change manifest names the remediation-report digest `2292560c8845b9c00667f149eaf57f6c03b30046c84349a48dbb0a25131105be`. That equals the report bytes measured here. The manifest does not contain its own digest. The manifest's other listed digests equal the working-tree digests in §2.1 and §2.2.

## 3. Defect register

| ID   | Where the defect is                                               | Normative text that governs it                   | This proposal's posture                                     |
| ---- | ----------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| S-01 | `correlation_state`, checker lines 568–586                        | `STAGE-Q-CLEAR-1` §2 and §4; `STAGE-Q-ENUM-1` §4 | Proposed checker correction                                 |
| S-02 | `_phrase_index`, `_limited`, `window_subject`, `_split_sentences` | `STAGE-Q-PHRASE-1` §4                            | Proposed checker correction                                 |
| S-03 | `canonical_prior_bytes` and `valid_prior`, checker lines 333–387  | `STAGE-Q-CLEAR-1` §3.1                           | Proposed checker correction; rewrite limit stays **OPEN**   |
| S-04 | `isolation_compatible`, checker lines 859–897                     | `STAGE-Q-COUNT-1` §§2–4                          | Settled rows may be tested; one cell stays a PO decision    |
| S-05 | `window_subject` and `inspect_window`, checker lines 267–297      | `STAGE-Q-PHRASE-1` §§2–5                         | No rule change; PO chooses A, B, or C                       |
| S-06 | Review-token table, `STAGE-Q-ENUM-1` §4 lines 95–104              | `STAGE-Q-ENUM-1` §4                              | Checker does not implement the table; PO chooses precedence |

`STAGE-Q-ENUM-1` has no heading numbered 80. The blocking function and the review-token table are both in §4. The current line numbers are 72–104.

## 4. Implementation defects

### 4.1 S-01 — Malformed sibling correlation

**Normative requirement. Fact.** `STAGE-Q-CLEAR-1` §2 says `CORRELATED-BLOCK-PRESENT` when the key is valid and another finding with the same key fails validation or is intrinsically `BLOCKING`. §2 also says a finding is not its own sibling, and that correlation does not delete, replace, or combine `finding-instance-id` values. §4 says a valid key shared with another finding that is still intrinsically blocking does not pass. `STAGE-Q-ENUM-1` §4 says sibling correlation uses `blocks` through the bundle rows and stops before the correlation return. That intrinsic result is what `STAGE-Q-CLEAR-1` §2 reads.

**Current implementation. Fact.** `subject_key_state` (lines 390–402) returns `MALFORMED` when `subject-key-malformed` is true, and also when the stored value is not a string matching `^FS-[0-9a-f]{16}$`. `correlation_state` (lines 568–586) returns immediately when the finding itself is `ABSENT` or `MALFORMED`. For any other record it continues past the record when `subject_key_state(other) != "VALID"` (lines 580–581), before it compares keys and before it calls `field_errors` or `intrinsic_blocking`. `intrinsic_blocking` (lines 490–517) calls `bundle_without_correlation` and does not call `correlation_state`. `blocks` (lines 589–598) applies correlation only after the intrinsic result.

**Observed behavior.** A sibling can carry the same stored string as a valid `FS-` key and still be skipped, because `subject-key-malformed: true` forces `MALFORMED` even when the string matches the grammar. The independent review reported that this lets the valid finding receive `NO-CORRELATED-BLOCK`. Static reading of lines 580–581 agrees with that report. This task did not execute the case.

The same-instance exclusion at lines 576–579 already treats a finding as not its own sibling, including a second object with the same `finding-instance-id`. Existing tests `Q3-TWO-CLEAR-SAME-KEY` and `Q3-NO-MERGE` keep two instance ids when both siblings are valid and clear.

**Unresolved interpretation.** "The same key" is not given a normalization rule. A `VALID` key is exactly `FS-` plus 16 lowercase hex digits (`STAGE-Q-CLEAR-1` §1). A different string, including uppercase hex or surrounding whitespace, is not that key under exact string equality. This proposal does not add case folding, trimming, or Unicode normalization.

The specified malformed state also includes "the record is marked with a duplicate key field." The checker represents that mark with the Boolean `subject-key-malformed`. It has no separate reader for two copies of one JSON key. A Python dict does not retain duplicate keys. Whether a duplicate-key input must be detected before it becomes a dict is unspecified. This proposal does not invent that parser.

**Proposed correction.**

1. Keep the rule that a finding is not its own sibling: skip `other is finding` and skip an equal `finding-instance-id`. Do not delete or rewrite either id.
2. Compare the sibling's stored `finding-subject-key` to this finding's key by exact string equality. Do not fold case and do not trim.
3. If those strings are equal, do not skip the sibling merely because `subject_key_state` is not `VALID`. If that sibling fails validation, is marked malformed, or is intrinsically `BLOCKING`, return `CORRELATED-BLOCK-PRESENT`.
4. If the stored strings differ, do not treat the sibling as the same key.
5. Keep `intrinsic_blocking` free of `correlation_state`, so two findings cannot wait on each other. The sibling check may call `intrinsic_blocking` and `field_errors` only.

A finding whose own key is absent or malformed still returns `SUBJECT-KEY-ABSENT` or `SUBJECT-KEY-MALFORMED` and therefore fails the bundle. That fail-closed result is the finding's own state. It is not a license to ignore a sibling that stores the same key string.

**Regression tests to add in a later authorized task.**

| Proposed id                        | Setup                                                                                                 | Expected                                                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `S01-SAME-STRING-MARKED-MALFORMED` | Valid finding and a different instance id with the same `FS-` string and `subject-key-malformed` true | Valid finding is `CORRELATED-BLOCK-PRESENT` and `BLOCKING`. Marked finding is `SUBJECT-KEY-MALFORMED` and `BLOCKING`. Instance ids stay distinct |
| `S01-INTRINSIC-SIBLING`            | Same valid key; sibling unresolved with critical `NOT-DETERMINED`                                     | `CORRELATED-BLOCK-PRESENT`                                                                                                                       |
| `S01-NOT-OWN-SIBLING`              | One otherwise clear finding alone                                                                     | `NO-CORRELATED-BLOCK`                                                                                                                            |
| `S01-DIFFERENT-MALFORMED-STRING`   | Sibling key `FS-XYZ`                                                                                  | That sibling is not the same key. The valid finding is not blocked by that string alone                                                          |
| `S01-ABSENT-SIBLING`               | Sibling key `NONE`                                                                                    | Not the same key                                                                                                                                 |
| `S01-TWO-CLEAR`                    | Two intrinsically clear findings, one valid key, two instance ids                                     | Each is `NOT-BLOCKING`. They remain two findings                                                                                                 |
| `S01-NO-RECURSION`                 | Intrinsically clear finding with a blocking sibling                                                   | `intrinsic_blocking` is false. `blocks` is `BLOCKING` only through correlation                                                                   |

**Acceptance criteria.** All of those tests pass. No existing passing correlation test changes its expected result except where it depended on skipping a same-string malformed sibling. No key-normalization rule appears in the checker.

### 4.2 S-02 — ASCII-only case-insensitive matching

**Normative requirement. Fact.** `STAGE-Q-PHRASE-1` §4 says matching is ASCII case-insensitive. A boundary is the start or end of the sentence, or a character outside `A-Z`, `a-z`, and `0-9`. The same section says the checker uses that ASCII test and does not use Unicode alphanumeric tests. A Unicode letter or a non-ASCII digit is a boundary, so `éinspect` and `inspecté` match `inspect`. An ASCII letter or ASCII digit beside the phrase does not match. `_` and `-` are boundaries. `publish` does not match `published` or `publication`.

**Current implementation. Fact.** `_phrase_index` (lines 112–125) sets `hay = text.casefold()` and `needle = phrase.casefold()`, then searches and applies `_ascii_boundary` to characters of that folded string. `_limited` (line 142) calls `prefix.casefold()`. `window_subject` (lines 267–274) uses `re.IGNORECASE` for `n < 5` and calls `text.casefold()` before `_boundary_find`. `_split_sentences` (line 260) uses `re.IGNORECASE` for `, but `. `_limited` (line 141) uses `re.IGNORECASE` to strip a trailing article. `_ascii_word_char` (lines 95–98) itself is already limited to ASCII letters and digits.

**Observed behavior.** The independent review reported that `inſpect` (U+017F LATIN SMALL LETTER LONG S) was treated as `inspect`. This task did not re-run that case. **Fact about the called operation:** Python `str.casefold` maps U+017F to `s`, maps U+212A KELVIN SIGN to `k`, and maps U+00DF LATIN SMALL LETTER SHARP S to `ss`. The last of those changes length. The index returned by `hay.find` is then an index into the folded string. `_negation_before` (line 132) slices the original clause with that index. When folding changes length, the slice is not the same span of the source string.

`str.lower` and `re.IGNORECASE` without an ASCII-only flag are Unicode case mappings as well. Replacing `casefold` with either of those would miss the requirement.

**Proposed correction.**

1. Map only ASCII `A-Z` to `a-z`, one source code point to one output code point. Leave every other code point unchanged.
2. Use that mapping for the phrase search, the limiter suffix test, the `n < 5` subject test, the `, but ` split, and the article strip.
3. Do not call `str.casefold`, `str.lower`, or Unicode `re.IGNORECASE`.
4. Apply boundary tests to that same-length string, so a returned index is an index into the source string.
5. Keep `_ascii_word_char` as the boundary test. `publish` remains a different phrase from `published` and from `publication`.
6. Pass original text into the phrase matcher from `window_subject`. Do not fold the window once and then fold it again.

This correction does not change whether the subject and the phrase must share a sentence. That question is S-05.

**Regression tests.** Expected results use the ASCII-only rule. They are proposed tests, not results of a run.

| Proposed id           | Input                                            | Expected                                                           |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| `S02-LONG-S`          | `inſpect` with U+017F, phrase `inspect`          | `NO-HIT`                                                           |
| `S02-KELVIN-INSIDE`   | Kelvin sign used in place of `k` inside a phrase | `NO-HIT`                                                           |
| `S02-KELVIN-BOUNDARY` | U+212A immediately before ASCII `inspect`        | `HIT`                                                              |
| `S02-E-BEFORE`        | `éinspect`                                       | `HIT`                                                              |
| `S02-E-AFTER`         | `inspecté`                                       | `HIT`                                                              |
| `S02-NON-ASCII-DIGIT` | U+0661 immediately before `inspect`              | `HIT`                                                              |
| `S02-ASCII-DIGIT`     | `5inspect`                                       | `NO-HIT`                                                           |
| `S02-ASCII-LETTER`    | `preinspect`                                     | `NO-HIT`                                                           |
| `S02-UNDERSCORE`      | `_inspect`                                       | `HIT`                                                              |
| `S02-HYPHEN`          | `re-inspect`                                     | `HIT`                                                              |
| `S02-ASCII-CASE`      | `INSPECT`                                        | `HIT`                                                              |
| `S02-SHARP-S-LENGTH`  | `ß inspect`, phrase `inspect`                    | `HIT`, and the reported index equals the source index of `inspect` |
| `S02-SHARP-S-INSIDE`  | `inßpect`, phrase `inspect`                      | `NO-HIT`                                                           |
| `S02-PUBLISH`         | `publish`                                        | `HIT`                                                              |
| `S02-PUBLISHED`       | `published`, phrase `publish`                    | `NO-HIT`                                                           |
| `S02-PUBLICATION`     | `publication`, phrase `publish`                  | `NO-HIT`                                                           |
| `S02-PUBLISHED-OWN`   | `published`, phrase `published`                  | `HIT`                                                              |

**Acceptance criteria.** Each row above passes. Existing `R1-*` rows that already encode ASCII boundaries keep their expected results. No call to `casefold` remains in the matcher path.

### 4.3 S-03 — Exact prior-record structure

**Normative requirement. Fact.** `STAGE-Q-CLEAR-1` §3.1 says the prior record is the canonical JSON object, UTF-8, sorted keys, no extra whitespace, of exactly these fields: `adjudication-status`, `critical-predicate`, `finding-instance-id`, `high-predicate`, `low-predicate`, `medium-predicate`, and `predicate-block`. `predicate-block` in that body is `BLOCKING`. `finding-instance-id` equals the finding being cleared. `prior-record-sha256` is the SHA-256 of those canonical bytes and is stored outside the hashed body. A missing record, a missing digest, a digest that is not 64 lowercase hex digits, a mismatched digest, or a mismatched instance id fails the bundle. `immutable: true` without that digest fails the bundle. The same section says a party who rewrites a record and its digest together is not detected, and that this is not independent immutability.

**Current implementation. Fact.** `canonical_prior_bytes` (lines 333–342) rejects a non-dict and rejects a dict that lacks any of the seven fields. It then builds `body` from those seven fields only. Extra keys are omitted, not rejected. `json.dumps` uses `sort_keys=True`, `separators=(",", ":")`, and `ensure_ascii=True`. `valid_prior` (lines 352–387) compares the digest of that projected body, checks the instance id, requires `predicate-block` `BLOCKING`, and checks the predicate and adjudication enums. It does not compare the stored key set with the seven fields plus `prior-record-sha256`.

**Observed behavior.** A stored object can contain an unexpected field and still produce the digest of the seven-field projection. `R5-FLAG-ONLY` deletes `prior-record-sha256` after setting `immutable`, so that test fails for a missing digest. It does not show what happens when `immutable: true` and a matching seven-field digest are both present. Static reading of lines 338–342 and 366–367 says that combination would pass `valid_prior`. This task did not execute it.

**Proposed correction.**

1. Require the stored object's keys to be exactly the seven body fields plus `prior-record-sha256`. Reject a missing body field. Reject any other field, including `immutable`.
2. Require every body value to be a string. Require the four predicates to be in `MET`, `NOT-MET`, `NOT-DETERMINED`. Require `adjudication-status` to be in the adjudication enum. Require `predicate-block` to be `BLOCKING`. Require `finding-instance-id` to equal the finding being cleared.
3. Serialize only that exact seven-field object as UTF-8 JSON with sorted keys and no extra whitespace. Compare `prior-record-sha256` with SHA-256 of those bytes. The digest remains outside the hashed object.
4. Do not treat `immutable: true` as integrity evidence.

The permitted tokens and the instance-id comparison used by the current tests are ASCII. For those accepted values, `ensure_ascii=True` and `ensure_ascii=False` produce the same bytes. **Unresolved interpretation:** §3.1 does not choose between those two flags for a non-ASCII value. The proposed correction rejects values outside the permitted tokens before serialization, so the accepted canonical bytes do not depend on that choice. This proposal does not add a second canonical form.

**Regression tests.**

| Proposed id                 | Setup                                                        | Expected                                                               |
| --------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `S03-EXACT-SEVEN`           | Seven legal fields plus a matching external digest           | Prior row passes                                                       |
| `S03-MISSING-FIELD`         | One of the seven fields absent                               | `BLOCKING`                                                             |
| `S03-UNEXPECTED-FIELD`      | An extra field, digest computed from the seven fields only   | `BLOCKING`                                                             |
| `S03-IMMUTABLE-PLUS-DIGEST` | `immutable: true` and a digest that matches the seven fields | `BLOCKING`                                                             |
| `S03-IMMUTABLE-ONLY`        | `immutable: true` and no digest                              | `BLOCKING`                                                             |
| `S03-BAD-DIGEST-SHAPE`      | Digest not 64 lowercase hex digits                           | `BLOCKING`                                                             |
| `S03-DIGEST-MISMATCH`       | Body changed and digest not recomputed                       | `BLOCKING`                                                             |
| `S03-WRONG-INSTANCE`        | Prior instance id differs from the finding                   | `BLOCKING`                                                             |
| `S03-NON-STRING`            | A body value that is not a string                            | `BLOCKING`                                                             |
| `S03-REWRITE-BOTH`          | Body and digest rewritten together to a new legal body       | Check passes. This is the **OPEN** limit, not evidence of immutability |

**Acceptance criteria.** Unexpected fields fail even when the projected digest matches. Missing fields fail. `immutable` never satisfies the row. The rewrite-both case remains documented as **OPEN** and is not described as write-once storage.

### 4.4 S-04 — Capture and isolation semantic compatibility

**Normative requirement. Fact.** `STAGE-Q-COUNT-1` §2 separates `capture-status`, `isolation-result`, `isolation-gap-reason`, `transmission-evidence-status`, `instructions-observable`, and `session-separation`. A shared spelling does not make two fields the same field. §3 gives this compatibility table:

| `isolation-result`             | `isolation-gap-reason`                                                   | `transmission-evidence-status`                      | Counts                              |
| ------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------- | ----------------------------------- |
| `TRANSMISSION-NOT-EVIDENCED`   | `NONE`                                                                   | `ABSENT-OR-UNREADABLE` or `HASH-OR-LENGTH-MISMATCH` | No                                  |
| `CROSS-DISCLOSURE-DETECTED`    | `NONE`                                                                   | `INTACT`                                            | No                                  |
| `ISOLATION-NOT-EVIDENCED`      | `PARTIAL-INSTRUCTIONS` when instructions are `PARTIAL`                   | `INTACT`                                            | No                                  |
| `ISOLATION-NOT-EVIDENCED`      | `SEARCH-NOT-RUN` when instructions are `FULL` and the search was not run | `INTACT`                                            | No                                  |
| `NO-CROSS-DISCLOSURE-OBSERVED` | `NONE`                                                                   | `INTACT`                                            | Only with every other counting rule |

§3 also says: `PARTIAL-INSTRUCTIONS` wins over `SEARCH-NOT-RUN`; when `capture-status` is `PARTIAL-INSTRUCTIONS` and isolation is `ISOLATION-NOT-EVIDENCED`, the gap is `PARTIAL-INSTRUCTIONS` and `capture-status` stays `PARTIAL-INSTRUCTIONS`; a record that overwrites `capture-status` with the isolation token is invalid; any other combination rejects the normalized file; all six fields are required; an empty prior set with a completed search remains `NO-CROSS-DISCLOSURE-OBSERVED` and is not proof; storing that empty set as `SEARCH-NOT-RUN` is invalid. §4 repeats that the empty-prior completed search is not `SEARCH-NOT-RUN` and is not proof of provider-side isolation.

The table does not mention `capture-status`. The sentence about preserving `PARTIAL-INSTRUCTIONS` does not say that `COMPLETE` is forbidden when instructions are `PARTIAL`.

**Current implementation. Fact.** `isolation_compatible` (lines 859–897) requires the six fields and rejects values outside the §2 enums. It then enforces the transmission/isolation pair, the gap/isolation pair, the gap/instructions pair, full instructions for `NO-CROSS-DISCLOSURE-OBSERVED`, the empty-prior/`SEARCH-NOT-RUN` rejection, and a synthetic `overwrite-capture-with-isolation` flag. `capture-status` is checked only for enum membership (lines 862–866 and again at 895–896). It is not compared with `instructions-observable`.

`ISOLATION-NOT-EVIDENCED` and `TRANSMISSION-NOT-EVIDENCED` are legal values of both `capture-status` and `isolation-result`. Equality of those two fields is therefore not, by itself, proof of an overwrite. The checker sees overwrite only when the Boolean flag is true.

**Comparison of the reviewed record with the rules.** The independent review used `capture-status` `COMPLETE`, `isolation-result` `ISOLATION-NOT-EVIDENCED`, `isolation-gap-reason` `PARTIAL-INSTRUCTIONS`, `transmission-evidence-status` `INTACT`, and `instructions-observable` `PARTIAL`. The review reported that the checker accepted it. This task did not re-run it. Static reading of lines 872–897 returns `True, "OK"` for that input: transmission is intact, the gap is one of the two allowed for `ISOLATION-NOT-EVIDENCED`, and `PARTIAL` instructions match that gap. No line inspects `COMPLETE`.

| Rule                                                                              | Current function                                                                                                                  | Relation to the reviewed record                                                                                                        |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Six fields present and inside §2 enums                                            | Enforced, lines 862–866                                                                                                           | The reviewed record passes this gate                                                                                                   |
| Non-intact transmission only with `TRANSMISSION-NOT-EVIDENCED`                    | Enforced, lines 872–873                                                                                                           | Not triggered; transmission is `INTACT`                                                                                                |
| Intact transmission rejects `TRANSMISSION-NOT-EVIDENCED`                          | Enforced, lines 874–875                                                                                                           | Not triggered                                                                                                                          |
| `TRANSMISSION-NOT-EVIDENCED` requires gap `NONE`                                  | Enforced, lines 876–877                                                                                                           | Not triggered                                                                                                                          |
| `ISOLATION-NOT-EVIDENCED` requires gap `PARTIAL-INSTRUCTIONS` or `SEARCH-NOT-RUN` | Enforced, lines 878–882                                                                                                           | Passes; gap is `PARTIAL-INSTRUCTIONS`                                                                                                  |
| Other isolation values require gap `NONE`                                         | Enforced, lines 883–884                                                                                                           | Not triggered                                                                                                                          |
| Gap `PARTIAL-INSTRUCTIONS` requires instructions `PARTIAL`                        | Enforced, lines 885–886                                                                                                           | Passes                                                                                                                                 |
| Gap `SEARCH-NOT-RUN` requires instructions `FULL`                                 | Enforced, lines 887–888                                                                                                           | Not triggered                                                                                                                          |
| `NO-CROSS-DISCLOSURE-OBSERVED` requires instructions `FULL`                       | Enforced, lines 889–890                                                                                                           | Not triggered                                                                                                                          |
| Empty prior set stored as `SEARCH-NOT-RUN` is invalid                             | Enforced, lines 891–892                                                                                                           | Not triggered                                                                                                                          |
| Overwrite of `capture-status` by the isolation token is invalid                   | Enforced only through `overwrite-capture-with-isolation`, lines 893–894                                                           | Not triggered. The function does not infer overwrite from field values                                                                 |
| `capture-status` `COMPLETE` together with instructions `PARTIAL`                  | No rule                                                                                                                           | Accepted                                                                                                                               |
| Counting                                                                          | Not decided by `isolation_compatible`. `select_attempts` counts only `NO-CROSS-DISCLOSURE-OBSERVED` plus the other counting rules | This record would not count, because isolation is not `NO-CROSS-DISCLOSURE-OBSERVED`. Compatibility and counting are different results |

**Four different facts.**

| Fact                      | Field                          | What it records                                                                 |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| Capture completeness      | `capture-status`               | Whether the local capture completed, refused, truncated, or was partial         |
| Instruction observability | `instructions-observable`      | Whether the instructions seen for the isolation check were `FULL` or `PARTIAL`  |
| Transmission integrity    | `transmission-evidence-status` | Whether the local request bytes were readable and matched. Not provider receipt |
| Isolation result          | `isolation-result`             | The local disclosure-search outcome. Not proof of provider-side isolation       |

**Proposed compatibility matrix for a later implementation.** Rows the current text already rejects are marked settled. The reviewed cell is not.

| Isolation                         | Gap                    | Transmission                            | Instructions  | Capture                 | Disposition                                                                                   |
| --------------------------------- | ---------------------- | --------------------------------------- | ------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| `TRANSMISSION-NOT-EVIDENCED`      | `NONE`                 | `ABSENT-OR-UNREADABLE` or hash mismatch | either enum   | any legal capture value | Compatible, not counting. Settled                                                             |
| `TRANSMISSION-NOT-EVIDENCED`      | not `NONE`             | any                                     | any           | any                     | Reject. Settled                                                                               |
| `TRANSMISSION-NOT-EVIDENCED`      | `NONE`                 | `INTACT`                                | any           | any                     | Reject. Settled                                                                               |
| non-intact transmission           | any                    | not `INTACT`                            | any           | any                     | Reject unless isolation is `TRANSMISSION-NOT-EVIDENCED`. Settled                              |
| `CROSS-DISCLOSURE-DETECTED`       | `NONE`                 | `INTACT`                                | not specified | not specified           | Compatible, not counting, for the table columns. Instructions and capture are not in this row |
| `CROSS-DISCLOSURE-DETECTED`       | not `NONE`             | any                                     | any           | any                     | Reject. Settled                                                                               |
| `ISOLATION-NOT-EVIDENCED`         | `PARTIAL-INSTRUCTIONS` | `INTACT`                                | `PARTIAL`     | `PARTIAL-INSTRUCTIONS`  | Compatible, not counting. Settled by the preservation sentence                                |
| `ISOLATION-NOT-EVIDENCED`         | `PARTIAL-INSTRUCTIONS` | `INTACT`                                | `PARTIAL`     | `COMPLETE`              | **UNSETTLED. PO decision S-04**                                                               |
| `ISOLATION-NOT-EVIDENCED`         | `PARTIAL-INSTRUCTIONS` | `INTACT`                                | `FULL`        | any                     | Reject. Settled                                                                               |
| `ISOLATION-NOT-EVIDENCED`         | `SEARCH-NOT-RUN`       | `INTACT`                                | `FULL`        | not specified           | Compatible, not counting, when the search was not run and the prior set is not empty. Settled |
| `ISOLATION-NOT-EVIDENCED`         | `SEARCH-NOT-RUN`       | `INTACT`                                | `PARTIAL`     | any                     | Reject. Settled                                                                               |
| `ISOLATION-NOT-EVIDENCED`         | `NONE`                 | `INTACT`                                | any           | any                     | Reject. Settled                                                                               |
| `NO-CROSS-DISCLOSURE-OBSERVED`    | `NONE`                 | `INTACT`                                | `FULL`        | not specified           | Compatible. Counts only with every other counting rule. Settled                               |
| `NO-CROSS-DISCLOSURE-OBSERVED`    | `NONE`                 | `INTACT`                                | `PARTIAL`     | any                     | Reject. Settled                                                                               |
| `NO-CROSS-DISCLOSURE-OBSERVED`    | not `NONE`             | any                                     | any           | any                     | Reject. Settled                                                                               |
| empty prior set                   | `SEARCH-NOT-RUN`       | `INTACT`                                | `FULL`        | any                     | Reject. Settled                                                                               |
| empty prior set, search was run   | `NONE`                 | `INTACT`                                | `FULL`        | any                     | `NO-CROSS-DISCLOSURE-OBSERVED`. Not proof. Settled                                            |
| missing field or value outside §2 |                        |                                         |               |                         | Reject. Settled                                                                               |

**Unresolved interpretation, and the decision requested.** Two readings are possible, and this proposal adopts neither.

- Reading 1: the reviewed record matches the third table row. `COMPLETE` is a legal `capture-status` and the table does not constrain it. The record is compatible and does not count.
- Reading 2: `COMPLETE` and `PARTIAL` instructions describe a pair the text never authorizes, so the record is an "other combination" and is rejected.

**Recommended PO decision, not a specification change:** choose Reading 2, and record it in a later amendment of `STAGE-Q-COUNT-1` before any checker change for this cell. Reason for the recommendation: `capture-status` and `instructions-observable` are different facts, and no current sentence says a complete capture may accompany partially observable instructions. The recommendation is not authority to edit that specification or the checker in this task.

**Negative tests for settled rejections.** Add these in the later authorized task. The `COMPLETE` + `PARTIAL` row is a pending test: its expected value is the PO's choice, and it must not be given an expected value in code before that choice.

| Proposed id                    | Why it is already rejected                                  |
| ------------------------------ | ----------------------------------------------------------- |
| `S04-INTACT-BUT-NOT-EVIDENCED` | `INTACT` with `TRANSMISSION-NOT-EVIDENCED`                  |
| `S04-ABSENT-WITH-NO-CROSS`     | Non-intact transmission with `NO-CROSS-DISCLOSURE-OBSERVED` |
| `S04-TRANSMISSION-GAP`         | `TRANSMISSION-NOT-EVIDENCED` with a gap other than `NONE`   |
| `S04-ISOLATION-GAP-NONE`       | `ISOLATION-NOT-EVIDENCED` with gap `NONE`                   |
| `S04-SEARCH-WITH-PARTIAL`      | `SEARCH-NOT-RUN` with instructions `PARTIAL`                |
| `S04-PARTIAL-GAP-WITH-FULL`    | Gap `PARTIAL-INSTRUCTIONS` with instructions `FULL`         |
| `S04-NO-CROSS-PARTIAL`         | `NO-CROSS-DISCLOSURE-OBSERVED` with instructions `PARTIAL`  |
| `S04-EMPTY-PRIOR-SEARCH`       | Empty prior set stored as `SEARCH-NOT-RUN`                  |
| `S04-MISSING-INSTRUCTIONS`     | `instructions-observable` absent                            |
| `S04-PENDING-COMPLETE-PARTIAL` | Reviewed cell. Expected result waits on the PO decision     |

**Acceptance criteria.** Settled rows match the table above. The pending row is not implemented as an acceptance or a rejection until the PO records the choice. `proves_provider_isolation` remains false. Shared enum spellings remain legal in both fields. Overwrite remains invalid when it is actually an overwrite, and a later task must not treat every shared spelling as overwrite.

## 5. PO decision items

### 5.1 S-05 — Inspection-grant subject scope

**Fact.** `STAGE-Q-PHRASE-1` §2 defines a window as a run of `--` comment lines. §3 splits that window into sentences and list bullets. §5 says the window refers to the subject when it contains `n < 5` with flexible whitespace, or a whole phrase `small cell`, `small cells`, or `unsuppressed counts`. The test is met when that window has the subject and at least one phrase occurrence is neither negated nor limited. The section does not say the subject and the phrase must share a sentence.

**Fact.** `inspect_window` (lines 276–298) computes `window_subject` on the joined window (line 278) and computes phrase hits per clause (lines 280–296). Line 297 sets `grant` when the window subject is true and any hit is not negated. Line 298 returns that grant. The subject test and the phrase test are not required to succeed in the same sentence.

This proposal does not change §5.

| Option | Rule                                                             | False positive                                                                                                       | False negative                                                                                   |
| ------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| A      | Keep window-level subject matching, which is the current §5 rule | A grant phrase in one sentence and `n < 5` in another sentence of the same window can classify the window as a grant | A real grant split across two sentences is still detected. Missed grants of that shape are fewer |
| B      | Require the subject and an unnegated phrase in the same sentence | Cross-sentence accidents of the kind in Option A are not grants                                                      | A grant whose subject and phrase are in different sentences becomes `NO-GRANT`                   |
| C      | Add an explicit subject-to-phrase association rule               | Depends on the rule the PO writes. No such rule exists now                                                           | Depends on that same unwritten rule. Until it is written, checker behavior would be undefined    |

**Unresolved interpretation.** This proposal does not choose A, B, or C. Option A is the rule now written in §5. Choosing B or C would be a normative amendment, not a checker bugfix. S-02 can be implemented without deciding S-05.

### 5.2 S-06 — Review-level outcome precedence

**Fact.** `STAGE-Q-ENUM-1` §4, lines 95–104, lists review tokens as first match, in this order:

1. Fewer than three counting anchors: `INCONCLUSIVE / NOT COMPLETED`.
2. Any finding `BLOCKING` because critical or high is `MET` or `NOT-DETERMINED`, the label is unrecognized and undetermined, or working severity is `CRITICAL` or `HIGH`: `BLOCKED — UNRESOLVED CRITICAL/HIGH`.
3. Any finding `BLOCKING`, or any comparison status `UNRESOLVED`: `BLOCKED — UNRESOLVED MEDIUM/LOW`.
4. Every finding `NOT-BLOCKING` and no comparison status `UNRESOLVED`: `PASS WITH OBSERVATIONS` may be proposed to a later evidence-acceptance act.

The same section says `PASS WITH OBSERVATIONS` does not satisfy CC-02. The checker source contains no review-token function and no `INCONCLUSIVE` result. **Observed behavior of the checker:** review-level outcome is not implemented. **Observed behavior of the specification text:** if both "fewer than three counting anchors" and a critical/high blocking finding are true, the first row matches and the result is `INCONCLUSIVE / NOT COMPLETED`. The critical/high row is not reached.

**Alternatives. Not chosen.**

| Alternative | Precedence                                                                                               | Consequence for the short-anchor plus critical/high case                                              |
| ----------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1           | Keep the current first-match order                                                                       | `INCONCLUSIVE / NOT COMPLETED`                                                                        |
| 2           | Evaluate the critical/high blocking row before the anchor-count row                                      | `BLOCKED — UNRESOLVED CRITICAL/HIGH`                                                                  |
| 3           | Use `INCONCLUSIVE / NOT COMPLETED` only when the anchor count is short and no critical/high block exists | Critical/high block wins; inconclusive remains available for the short-anchor case without that block |
| 4           | Emit both conditions without collapsing them                                                             | Requires a token the current table does not define. That would be a new normative token               |

**Unresolved interpretation.** This proposal does not reorder §4. A later amendment may do so only after the PO selects an alternative. Implementing the table in the checker before that selection would freeze Alternative 1 into code.

## 6. Prior-record integrity limitation

**Fact.** `STAGE-Q-CLEAR-1` §3.1 and `valid_prior`'s docstring (lines 352–358) already say the repository has no write-once store. Stage I.11 §6.6 is the cited source. A matching digest shows that the stored body and the stored digest agree. It does not detect a writer who replaces both. `STAGE-R-REM-1` R5 records the same limit as **OPEN**.

**Proposed correction** S-03 tightens field-set equality. It does not create a write-once store. The limitation remains **OPEN**. No test that passes after a joint rewrite is evidence of immutability.

## 7. Adoption and hash synchronization

**Fact.** The copy-complete sentence in `STAGE-Q-ADOPT-1` §4 and in `STAGE-Q-BRIEF-1` §7 names these digests, which this task measured as the HEAD blobs, not the working-tree blobs:

| File named by the sentence                                    | Digest in the sentence                                             | Current working-tree digest                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Severity specification                                        | `7199a46aabbd4c55a2566b9fa9a790885637a133c255938dac36ffa283a8a242` | Same                                                               |
| Clearing specification                                        | `517c0b95763ff357b7c55eb23468bf193921661d7547e350023e85d6e5f8f8ee` | `772fd3de1e8c173e3769fb8af31afb3d9fffe57f25d486cae24a54087bb45262` |
| Enum specification                                            | `17df720b2b9575c58ae94b6ec996743bbbddb9312946101158546cf5fad67f24` | `100343db2ff27953fa4a09c047bccc6bd8472b849b1b198e1cc745df3f48c609` |
| Inspection-grant tests                                        | `e87b90edcb35e2f91fda7bbb1037b936833785dc023b5f989efeb17fe22b05ff` | `0bd61a1749f0f9809e29e9fe2b8fceb60f53d6885fcdb3f29a070f79793a16f8` |
| Counting specification                                        | `5dacebb18cd8a473c3f931cb88ab0b3139259e21d186308d27c2bb80db29a7fe` | `1cc25528ddb2fe763ff5358ac81aff93d4635e424787a34d77bdcb3098433479` |
| Authority correction                                          | `51f1181560d7beda03613d4082fb22296b4d7bcccc689ca24302ec5f2b0b6f67` | Same                                                               |
| Adoption object, as named in the brief and in `STAGE-Q-VER-1` | `e497a6577b3c20149c7f44ec52a4eed79dca63f462ab2cf4cf3b211ad466a0d2` | `189dab80a4692f0af836cc329a2c5440603128198f60e6f10c6f5ea7df7e3852` |

**Fact.** `STAGE-Q-VER-1` lines 16, 37, and 42 still print `e497a6577b3c20149c7f44ec52a4eed79dca63f462ab2cf4cf3b211ad466a0d2` for the adoption object and `517c0b95763ff357b7c55eb23468bf193921661d7547e350023e85d6e5f8f8ee` for the clearing specification. Those are the HEAD digests. `STAGE-Q-ADOPT-1` says a verifier rejects the sentence if any digest differs from the committed bytes. `STAGE-Q-BRIEF-1` says the §7 sentence is the Stage Q sentence for commit `d74897e1fda5769507dab1de8705c3781ba6b1b0` and is not byte-current for the corrected files. `STAGE-R-REM-1` §5 says Stage R does not replace that sentence.

**Why that sentence cannot adopt the current working-tree files.** The sentence is one conjunction of named digests. Four normative files and the adoption object now have different working-tree digests. Those working-tree bytes are unstaged. Adopting the old sentence would bind the HEAD blobs. It would not bind the Stage R working-tree bytes. A sentence that named the current working-tree digests would also be false as soon as S-01, S-02, or S-03 changed the checker or a specification.

**Why a new sentence waits.** `STAGE-Q-ADOPT-1` says Stage R does not issue a replacement sentence and does not fill a placeholder. A sentence written now would bind known checker defects and the unsettled S-04, S-05, and S-06 questions. The next authorized edit would change the digests again.

**Why the adoption object, the verification report, and the final brief must bind the same committed bytes.** `STAGE-Q-ADOPT-1` §4 says the copy-complete sentence is printed in `STAGE-Q-VER-1` and `STAGE-Q-BRIEF-1`, and that a verifier rejects it if any digest, including the adoption file's own digest, differs from the committed bytes. The adoption file cannot contain its own digest. The other two files are where that digest is supplied. If the three files name different digests, or name uncommitted digests, there is no single adoption object.

**Why no adoption hash should be finalized while sources are still changing.** Stage R already showed the failure mode. The Stage Q sentence bound commit `d74897e1fda5769507dab1de8705c3781ba6b1b0`. Later uncommitted edits moved the clearing, enum, inspection-grant, counting, adoption, brief, verification, and checker bytes. A digest taken during that movement does not name a stable file.

This task does not edit the adoption object, the verification report, or the brief, and it does not draft a replacement sentence.

## 8. Explicit out-of-scope actions

This proposal does not authorize and this task did not do any of the following:

- edit `stage-q-validation-checks.py` or add the regression tests listed above;
- edit any existing Stage Q, Stage R, Stage M, Stage N, or Stage O document;
- edit the Decision Register;
- edit the adoption object, the verification report, or the final PO brief;
- modify or execute the SQL candidate;
- connect to PostgreSQL or any other database;
- contact Anthropic, OpenAI, Google, or any other provider;
- create a provider account or disclose package bytes;
- create a Package Anchor or an Evidence Anchor;
- authorize or perform a provider assessment;
- authorize or perform SQL EXEC or Census EXEC;
- change the small-cell boundary;
- adopt Stage Q or Stage R;
- close CC-02, CC-06, or OQ-CENSUS-01;
- stage, commit, or push;
- clean or reset the working tree.

S-02 does not decide S-05. S-03 does not close the write-once gap. S-04's recommended decision is not an edit to `STAGE-Q-COUNT-1`.

## 9. Proposed implementation sequence

The sequence is a proposal for a later authorization. This task performs none of the steps.

1. PO decision on S-04 Reading 1 or Reading 2, on S-05 Option A, B, or C, and on S-06 Alternative 1, 2, 3, or 4. Record each choice as a decision. Do not infer a choice from this proposal, including the Reading 2 recommendation in §4.4.
2. Under a separate implementation authorization, change only the checker behaviors in S-01, S-02, and S-03, and add the settled S-04 negative tests. If and only if the PO chose a rule for the unsettled S-04 cell, implement that chosen rule in the same authorized task.
3. If the PO amended §4 of the enum specification, §5 of the phrase specification, or §§2–4 of the counting specification, edit those specifications in that same authorized task and nowhere else.
4. Run the checker only under that later authorization. This proposal is not that authorization.
5. Independent verification of the committed bytes, as in §10.
6. Only after that verification, a later document may draft one new copy-complete sentence. That draft is still not adoption.
7. Product Owner review. Decision 4 stays **NOT APPROVED** until a separate decision adopts a sentence whose digests match the committed bytes.

## 10. Independent verification requirements

A later verification, not this task, is sufficient for a new adoption draft only when all of the following are true:

- The checker, the normative specifications, the adoption object, `STAGE-Q-VER-1`, and `STAGE-Q-BRIEF-1` are committed, and the three governance files name one identical set of committed digests.
- The adoption file's digest is the committed digest, printed in the verification report and the brief, and absent from the adoption file itself.
- S-01, S-02, and S-03 regression tests have been run against that committed checker and the expected results in §4 were produced.
- Settled S-04 negative tests have been run. The pending `COMPLETE` + `PARTIAL` test has the expected result the PO recorded, and no other result.
- S-05 and S-06 either remain explicitly unchanged, with tests that still encode Option A and Alternative 1, or the PO's chosen alternative is the behavior under test.
- The verifier states that the checker was run, names its committed SHA-256, and does not treat a working-tree digest as a committed digest.
- SQL was not executed, no database connection was opened, and no provider was contacted.
- The prior-record rewrite limit, `SESSION-ID-NOT-EXPOSED`, complementary-suppression algorithm, register reconciliation, frozen baseline bytes, N-m2, and N-m8 are still listed as **OPEN** unless a separate decision closed one of them.

Same-stage execution by the author of the fix is not the independent verification.

## 11. Residual risks and OPEN items

| Item                                                                               | Status after this proposal                                      |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| S-01 same-string malformed sibling                                                 | Open until an authorized checker change                         |
| S-02 Unicode casefold                                                              | Open until an authorized checker change                         |
| S-03 unexpected prior fields                                                       | Open until an authorized checker change                         |
| Joint rewrite of prior body and digest                                             | **OPEN**. No write-once store                                   |
| S-04 `COMPLETE` plus `PARTIAL` instructions                                        | **OPEN** until a PO decision                                    |
| S-05 subject scope                                                                 | **OPEN** until a PO decision. Current rule remains Option A     |
| S-06 review-token precedence                                                       | **OPEN** until a PO decision. Checker does not implement it     |
| `SESSION-ID-NOT-EXPOSED`                                                           | **OPEN**, as recorded by Stage R. It does not count             |
| Complementary-suppression algorithm and publication-ready validation               | **OPEN**                                                        |
| Decision Register reconciliation and Decision 3 committed heading                  | **OPEN**                                                        |
| Frozen baseline `7714f95b8202771dfa1835d279983fafef9505af5a678f12344bdc79f1ca0ac7` | Not re-hashed in this task. Still **OPEN**                      |
| N-m2 and N-m8                                                                      | **OPEN**. Not Decision 4 blockers in the Stage Q brief          |
| Decision 5, Decision 6, and Decision 7                                             | **NOT DECIDED**                                                 |
| CC-02, CC-06, OQ-CENSUS-01                                                         | Not satisfied, not performed, and **OPEN** respectively         |
| Small-cell operational boundary                                                    | **DEFERRED / NOT GRANTED**                                      |
| Duplicate JSON key detection before a dict is built                                | Unspecified. No parser is proposed                              |
| Key strings that differ only by case or whitespace                                 | Not the same key under this proposal. No normalization is added |
| Overwrite detection when both enums share a spelling                               | Still only as strong as evidence of an actual overwrite         |

Passing a future checker run would not make Decision 4 ready for approval.

## 12. Final recommendation

**This file is a proposal only. It is not adopted.**

The Product Owner can review S-01 through S-06 and the sequence in §9. No correction proposed here has been applied to the checker or to any existing specification. Decision 4 remains **NOT APPROVED**. Final authority remains with the Product Owner.
