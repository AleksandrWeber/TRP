# Stage U — Clarification Addendum to the Stage T PO Brief

**Document ID:** `STAGE-U-ADD-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01
**Supplements:** `STAGE-T-BRIEF-1` at `docs/project/version-3/wave-6/stage-t-po-decision-brief-s04-s06.md`

This addendum answers three questions raised in an independent review of Stage T. It does not decide S-04, S-05, or S-06. It does not amend Stage T, Stage S, or any Stage Q specification. It does not change the checker. It does not set an expected result for `S04-PENDING-COMPLETE-PARTIAL`.

Decision 4 remains **NOT APPROVED**.

B1 and B2 below are more specific formulations of Stage T's Option B. They do not change the meaning of Option A or Option C.

---

## 1. Executive summary

| ID          | Question                                                                     | Finding                                                                                                                                                                                                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U-01 / S-04 | Can the reviewed record's `session-separation` be recovered?                 | **`NOT FOUND`.** No primary normalized record of the Stage T §2.1 cell exists in the Stage Q, Stage R, or Stage S artifacts or in the checker fixtures. No `attempt-id`, provider, model, or `session-separation` is tied to that cell.                                                                              |
| U-02 / S-05 | How does same-sentence matching treat lists and bullets?                     | §3 specifies negation inheritance from a negation list header to its bullets. It does not specify subject inheritance or limiter inheritance. Strict B1 and proposed B2 diverge on those shapes. A §3.1 list header always contains a negation word, so inheritance limited to that term does not create new grants. |
| U-03 / S-06 | Do Alternative 2 and Alternative 3 differ on the current review-token table? | **They emit the same token for every combination of the current four rows.** No counterexample exists on that table. They are different amendments: Alternative 2 reorders unchanged conditions; Alternative 3 changes when `INCONCLUSIVE / NOT COMPLETED` matches. A later inserted condition could separate them.  |

The missing session value does not block discussion of the S-04 cell. It does block any claim that one stored normalized record was the independent-review input. The named isolation result is not a counting anchor under any legal `session-separation` value.

The checker was read statically and was not executed. No example in §4 is a new test result.

---

## 2. Source inventory

Digests are SHA-256 of the working-tree bytes read on 2026-11-01. Branch: `main`. These hashes identify the bytes used for this addendum. They are not an adoption sentence.

| Path                                                                                     | SHA-256                                                            | Bytes | Lines | Role                             |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----- | ----- | -------------------------------- |
| `docs/project/version-3/wave-6/stage-t-po-decision-brief-s04-s06.md`                     | `ea48edbe6fabfb5042d4bdb86b22eaa2a90599a4d1f9dd0d7a4f39455a634666` | 47149 | 480   | Decision brief under review      |
| `docs/project/version-3/wave-6/stage-s-remediation-proposal.md`                          | `78bc163228a55cd83e49196d6bd2306fd1e2bbe0192ce59282bd50323cd37476` | 60218 | 461   | Paraphrase of the reviewed cell  |
| `docs/project/version-3/wave-6/stage-q-counting-attempt-and-isolation-specification.md`  | `1cc25528ddb2fe763ff5358ac81aff93d4635e424787a34d77bdcb3098433479` | 15863 | 117   | `STAGE-Q-COUNT-1`                |
| `docs/project/version-3/wave-6/stage-q-inspection-grant-adversarial-tests.md`            | `0bd61a1749f0f9809e29e9fe2b8fceb60f53d6885fcdb3f29a070f79793a16f8` | 7036  | 84    | `STAGE-Q-PHRASE-1`               |
| `docs/project/version-3/wave-6/stage-q-enum-and-schema-validation-specification.md`      | `100343db2ff27953fa4a09c047bccc6bd8472b849b1b198e1cc745df3f48c609` | 15565 | 134   | `STAGE-Q-ENUM-1`                 |
| `docs/project/version-3/wave-6/stage-q-normative-severity-and-blocking-specification.md` | `7199a46aabbd4c55a2566b9fa9a790885637a133c255938dac36ffa283a8a242` | 10524 | 106   | `STAGE-Q-SEV-1`                  |
| `docs/project/version-3/wave-6/stage-q-validation-checks.py`                             | `1fdbc00408eab8e717819aa584dd32351460b95214768c9c510ea08d123cdfd2` | 57797 | 1487  | Static reading only              |
| `docs/project/version-3/wave-6/stage-r-remediation-report.md`                            | `2292560c8845b9c00667f149eaf57f6c03b30046c84349a48dbb0a25131105be` | 46596 | 133   | Searched for the reviewed record |

`STAGE-Q-PHRASE-1` §§2–5 and `STAGE-Q-ENUM-1` §4 were read in full for U-02 and U-03. `STAGE-Q-COUNT-1` §§1–3 were read for U-01. `STAGE-Q-SEV-1` §3.2 cites the inspection-grant test and does not restate list inheritance.

---

## 3. U-01 / S-04 — `session-separation`

### 3.1 Classification

**`NOT FOUND`.**

Stage T §2.1 names five values: `capture-status` `COMPLETE`, `isolation-result` `ISOLATION-NOT-EVIDENCED`, `isolation-gap-reason` `PARTIAL-INSTRUCTIONS`, `transmission-evidence-status` `INTACT`, and `instructions-observable` `PARTIAL`. Stage S §4.4 is the source of that list. Neither file names `session-separation`, `attempt-id`, provider, or model for that input. Stage S says the independent review reported that the checker accepted the input, and that Stage S did not re-run it. The reviewer's input is not stored in Stage S.

Search of the Stage Q specifications, the Stage R remediation report, the Stage R change manifest, and the checker source found no normalized record that carries those five values together.

The checker fixtures that are nearest, and that must not be substituted, are:

| Fixture                                                                                        | Lines                     | Why it is not the reviewed record                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Q7-OVERLAP-KEEPS-CAPTURE`                                                                     | 1219–1230                 | Capture is `PARTIAL-INSTRUCTIONS`, not `COMPLETE`. `session-separation` in this fixture is `NEW-SESSION-ATTESTED`. No `attempt-id`.                                                            |
| `Q7-OVERWRITE-REJECTED`                                                                        | 1232–1243                 | Capture is `ISOLATION-NOT-EVIDENCED`, and the overwrite flag is true.                                                                                                                          |
| `R4-PARTIAL`                                                                                   | 1448–1457                 | Capture is again `PARTIAL-INSTRUCTIONS`. `session-separation` in this fixture is `SESSION-ID-NOT-EXPOSED`. Stage R records the test id as `OK`. That is this fixture, not the `COMPLETE` cell. |
| `Q7-EMPTY-PRIOR`, `Q7-EMPTY-PRIOR-NOT-SEARCH-SKIP`, `Q7-SEARCH-NOT-RUN`, and the `bare` record | 1244–1290 and 1404–1411   | Capture is `COMPLETE`, and `session-separation` is `NEW-SESSION-ATTESTED`, but isolation or instructions differ from the reviewed cell.                                                        |
| `attempt()` rows used by `select_attempts`                                                     | 1153–1172 and later calls | These rows have `attempt-id`, provider, and model. Their default `isolation-result` is `NO-CROSS-DISCLOSURE-OBSERVED`. None is the reviewed cell.                                              |

`Q7-OVERLAP-KEEPS-CAPTURE` and `R4-PARTIAL` use two different session tokens on a capture value Stage S already treats as settled. That disagreement belongs to those fixtures. It is not two values for the reviewed record, so this finding is not `CONFLICTING EVIDENCE`. It is also not `PARTIALLY VERIFIED`: the disputed field of S-04 is `capture-status`, and both nearby fixtures use the other capture value.

The `R4-ENUM-*` rows in Stage R, including `R4-ENUM-capture-status-COMPLETE`, `R4-ENUM-instructions-observable-PARTIAL`, and the four `R4-ENUM-session-separation-*` rows, record `ACCEPTED-ENUM`. The checker builds each of those probes by copying the `bare` record and replacing one field (lines 1412–1420). `ACCEPTED-ENUM` means the reason was not `invalid:` for that one field. It does not mean the five-field reviewed cell was accepted, and it does not preserve a session value for that cell.

No `attempt-id` appears on any `isolation_compatible` dictionary in the checker.

### 3.2 What the missing value does, and what it does not do

`STAGE-Q-COUNT-1` §3 requires all six fields before the compatibility table is applied. A missing field fails closed. A value outside §2 fails closed. The checker matches that gate at lines 862–866: a missing or blank `session-separation` returns `missing:session-separation`; a value outside the four-token enum returns `invalid:session-separation`. Those returns happen before lines 872–897.

Lines 872–897 do not read `session-separation`. For the five named values, each of the four legal session tokens takes the same path through those lines. Stage S's statement that those lines return `True, "OK"` therefore presupposes that some legal token was already present. The token itself was not retained. This addendum does not infer which one it was.

| Question                                                            | Effect of the absent value                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Can S-04 still be discussed?                                        | Yes. S-04 is the relationship of `COMPLETE` and `PARTIAL` instructions on the named isolation, gap, and transmission values. `session-separation` is not a column of that cell. Reading 1 and Reading 2 stay open. This addendum does not choose either reading.                                                                                                                                           |
| Can compatibility of one specific normalized record be established? | No. There is no retained record to compare. Compatibility of the five-field cell can be discussed without naming a session token. Compatibility of "the" independent-review input cannot, because that input's sixth field is not in the repository.                                                                                                                                                       |
| Can this attempt be a counting anchor?                              | No, under every legal `session-separation` value. `STAGE-Q-COUNT-1` §1 admits an attempt to the counting slot only when it meets every counting rule, has `isolation-result` `NO-CROSS-DISCLOSURE-OBSERVED`, and satisfies §1.1. The named isolation result is `ISOLATION-NOT-EVIDENCED`. The §3 row for that result does not count. `select_attempts` applies the same isolation filter at lines 785–791. |

The unknown token still matters for siblings. `STAGE-Q-COUNT-1` §1 says that if any attempt for the identity has `session-separation` `SESSION-REUSED`, the coverage record is `NOT-COUNTING`, and a cleaner sibling does not restore counting. The other three legal tokens do not, by themselves, disqualify a different attempt. Because the value is unknown, this addendum does not say whether a sibling of the reviewed input would have been `SIBLING-DISQUALIFIED`. It does say that the reviewed attempt itself is not a counting anchor.

A missing or illegal session field fails closed and is also not a counting anchor. `S04-PENDING-COMPLETE-PARTIAL` remains without an expected result.

---

## 4. U-02 / S-05 — same-sentence matching and lists

### 4.1 What §§2–5 already say

- §2 defines a window as the longest run of consecutive `^\s*--` lines.
- §3.1 defines a list header as a body that ends with `:` and contains a negation word from §4. Only that header opens an inherited-negation list.
- §3.2 defines a bullet as a body whose left-trimmed text starts with `- `.
- §3.3 continues a bullet only on following bodies that start with whitespace. Another body closes the list.
- §3.4 joins non-bullet lines until a line ends with `.`, `!`, `?`, or `;`.
- §3.5 splits those joined units into sentences on `.`, `!`, `?`, or `;` followed by whitespace, and on `, but `.
- The prose under §3 says negation does not cross a sentence boundary, a bullet under an open list header inherits the header's negation, and a sentence after the list does not.
- §4 limits a phrase only when a limiter stands immediately before it, with an optional article. The same section says the limiter does not negate a later sentence.
- §5 meets the grant test when the window has a subject marker and at least one phrase occurrence is neither negated nor limited. §5 does not require those two markers to share a sentence.

A colon line with no negation word is not a §3.1 list header. This addendum does not treat it as one. Subject inheritance is **`UNSPECIFIED`**. Limiter inheritance is **`UNSPECIFIED`**. Negation inheritance is specified, and only for a §3.1 header and its bullets.

Static reading of the checker, not a run: `_is_list_header` (lines 176–179) requires a trailing colon and a negation word. `clauses_of_window` (lines 182–251) copies `inherited_negation` onto bullet clauses only. There is no inherited-subject flag and no inherited-limiter flag. `window_subject` (lines 267–274) searches the whole window. `inspect_window` (lines 276–298) grants when that window subject is true and any hit is not negated. That is Option A. It is not a reading of Option B.

Option A in the table is the current §5 window test, including the negation inheritance §3 already states. Strict B1 is defined in §4.3. Proposed B2 is not a current result.

Illustrative windows below are not rows in `STAGE-Q-PHRASE-1` §6. `Q5-SYN-INSPECT` is the recorded same-sentence case named under example 1.

### 4.2 Examples

| #   | Shape                                                | Text                                                                                     | Option A   | Strict B1  | What §§2–5 determine                                                                                                                                                                                   | Header inheritance                                                                                                  | Additional rule                                                                                                  |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Subject and phrase in one ordinary sentence          | `-- Operators may inspect n < 5.`                                                        | `GRANT`    | `GRANT`    | `GRANT`. Same sentence. Recorded as `Q5-SYN-INSPECT`.                                                                                                                                                  | Not used                                                                                                            | No                                                                                                               |
| 2   | Subject in a colon line, phrase in a bullet          | `-- Counts for small cells:` / `-- - operators may inspect the rows.`                    | `GRANT`    | `NO-GRANT` | Window test is `GRANT`. The colon line has no negation word, so it is not a §3.1 header. The bullet is a separate §3 unit.                                                                             | Subject inheritance **`UNSPECIFIED`**                                                                               | Yes, if Option B is adopted. Current §5 does not require one                                                     |
| 3   | Phrase in a colon line, subject in a bullet          | `-- Operators may inspect:` / `-- - the floor is n < 5.`                                 | `GRANT`    | `NO-GRANT` | Window test is `GRANT`. `inspect` ends on a non-alphanumeric boundary. The phrase stays in the colon line.                                                                                             | Phrase inheritance **`UNSPECIFIED`**                                                                                | Yes, if Option B is adopted                                                                                      |
| 4   | Subject and phrase in one bullet                     | `-- Review notes:` / `-- - operators may inspect n < 5.`                                 | `GRANT`    | `GRANT`    | `GRANT`. Both markers are in the bullet sentence. `Review notes:` is not a §3.1 header.                                                                                                                | Not used                                                                                                            | No                                                                                                               |
| 5   | Subject and phrase in different bullets              | `-- Review notes:` / `-- - operators may inspect the rows.` / `-- - the floor is n < 5.` | `GRANT`    | `NO-GRANT` | Window test is `GRANT`. §3 keeps the bullets as separate units.                                                                                                                                        | Cross-bullet subject inheritance **`UNSPECIFIED`**                                                                  | Yes, if Option B is adopted                                                                                      |
| 6   | Subject in the previous sentence, phrase in the next | `-- The publication floor is n < 5.` / `-- Operators may inspect the dashboard.`         | `GRANT`    | `NO-GRANT` | Window test is `GRANT`. §3.5 makes two sentences.                                                                                                                                                      | Not a list. Cross-sentence subject link **`UNSPECIFIED`**                                                           | Yes, if Option B is adopted. Option A needs none                                                                 |
| 7   | Phrase in the previous sentence, subject in the next | `-- Operators may inspect the dashboard.` / `-- The publication floor is n < 5.`         | `GRANT`    | `NO-GRANT` | Same as example 6, with the markers swapped. This is the cross-sentence shape named in Stage T §3.2.                                                                                                   | **`UNSPECIFIED`**                                                                                                   | Yes, if Option B is adopted                                                                                      |
| 8   | Negation in a list header, phrase in a bullet        | `-- DO NOT:` / `-- - operators may inspect n < 5.`                                       | `NO-GRANT` | `GRANT`    | `NO-GRANT`. `DO NOT:` is a §3.1 header. The bullet inherits that negation. The phrase is not a qualifying phrase. §6 records inherited negation on the `DO NOT:` bullets at lines 90–91 as `NO-GRANT`. | Negation inheritance **specified** by §3. Subject inheritance is not reached, because the phrase is already negated | B1 requires a new rule that withdraws this §3 sentence. The current result needs no new rule                     |
| 9   | Limiter in a colon line, phrase in a bullet          | `-- Before any inspection:` / `-- - operators may inspect n < 5.`                        | `GRANT`    | `GRANT`    | The bullet occurrence has no limiter immediately before it. §4 says a limiter does not negate a later sentence. The window test is `GRANT`.                                                            | Limiter inheritance **`UNSPECIFIED`**. The colon line is not a §3.1 header                                          | A new rule is required only if a header limiter must apply to the bullet. Current text does not say that it does |

Example 8 is the bullet under the header. It is a different shape from `Q5-SYN-AFTER-LIST`, which §6 describes as a `DO NOT:` bullet and then a separate inspect sentence, with recorded result `GRANT`. §3 says a sentence after the list does not inherit the header's negation. This addendum does not extend example 8 to that later sentence.

Strict B1's `GRANT` on example 8 contradicts the current §3 result. That cell is the consequence of withdrawing header inheritance. It is not the current normative result.

### 4.3 Formulation B1

**Proposed formulation, not a current rule, and not a Product Owner decision.**

B1: the subject marker and a phrase occurrence that is neither negated nor limited must occur in the same sentence. A list header contributes nothing to the bullet. The bullet does not inherit the header's subject, the header's negation, or the header's limiter. A colon line and a bullet are different sentences. Two bullets are different sentences. Two ordinary sentences are different sentences.

Adopting B1 amends §5 and withdraws the §3 sentence that a bullet under an open list header inherits the header's negation. Stage T's Option B said that the §4 limiter rule stays, and it did not mention withdrawing §3. B1 is therefore a further specification of Option B, and the §3 withdrawal is part of that further specification. Until the Product Owner records it, §3 inheritance remains the written rule.

Under B1, examples 1 and 4 are grants. Examples 2, 3, 5, 6, and 7 are not. Example 8 becomes a grant only because the header negation is no longer inherited. Example 9 is a grant because the limiter is not in the bullet sentence.

### 4.4 Formulation B2

**Proposed rule, not current norm.**

B2: a window is a grant when either one sentence contains both a §5 subject marker and a phrase occurrence that is neither negated nor limited, or a header and one bullet form the matching unit defined below.

Proposed inheritance, header to one bullet only:

1. The header is the nearest preceding non-bullet body in the same window whose text ends with `:`.
2. The bullet is still under that header: §3.3 has not closed the list.
3. The matching unit is the header body, one space, and that bullet body. A second bullet is a new unit with the same header. Two bullets are not joined to each other.
4. §4 and §5 then apply inside that unit as they apply inside a sentence. A negation word earlier in the unit negates a later phrase. A limiter counts only when it is immediately before the phrase in the unit. Subject markers in the unit count. Phrase boundaries in the unit count.
5. A sentence after the list is outside every such unit. §3 already says that for negation.
6. No subject, phrase, negation, or limiter is copied from one bullet to another bullet.

Clause 1 widens the word "list header" beyond §3.1. The widening is part of the proposal. It has to be stated, because a §3.1 header always contains a negation word. If B2 inherited only from §3.1 headers, the bullet's phrases would already be negated by current §3, and B2 would not create a grant that current §3 denies. Examples 2, 3, and 9 use colon lines that §3.1 does not call list headers. Those examples are the reason the proposed header is wider than §3.1.

Consequences of this proposal, if the widened header is adopted:

| Example | Proposed B2 result | Why                                                                                                                 |
| ------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 1       | `GRANT`            | Ordinary sentence. The list rule is not used.                                                                       |
| 2       | `GRANT`            | The unit contains `small cells` and `inspect`, with no negation word and no immediate limiter.                      |
| 3       | `GRANT`            | The unit contains `inspect` and `n < 5`.                                                                            |
| 4       | `GRANT`            | The bullet sentence already contains both markers.                                                                  |
| 5       | `NO-GRANT`         | Each bullet forms its own unit with `Review notes:`. Neither unit contains both markers.                            |
| 6       | `NO-GRANT`         | Two ordinary sentences. No header.                                                                                  |
| 7       | `NO-GRANT`         | Two ordinary sentences. No header.                                                                                  |
| 8       | `NO-GRANT`         | The unit is `DO NOT: operators may inspect n < 5.` The negation word is earlier in the unit.                        |
| 9       | `GRANT`            | The unit is `Before any inspection: operators may inspect n < 5.` `before any` is not immediately before `inspect`. |

Example 9's proposed grant is the existing immediate-before test applied to the proposed unit. It is not a rule that every header limiter covers every bullet phrase.

Option A remains the window rule in §5. Option C remains an unwritten association rule. This addendum does not draft Option C and does not select A, B1, B2, or C.

---

## 5. U-03 / S-06 — Alternative 2 and Alternative 3

### 5.1 The two amendments

`STAGE-Q-ENUM-1` §4 lists review tokens as first match:

1. Fewer than three counting anchors: `INCONCLUSIVE / NOT COMPLETED`.
2. Any finding is `BLOCKING` because critical or high is `MET` or `NOT-DETERMINED`, the label is unrecognized and undetermined, or working severity is `CRITICAL` or `HIGH`: `BLOCKED — UNRESOLVED CRITICAL/HIGH`.
3. Any finding is `BLOCKING`, or any comparison status is `UNRESOLVED`: `BLOCKED — UNRESOLVED MEDIUM/LOW`.
4. Every finding is `NOT-BLOCKING` and no comparison status is `UNRESOLVED`: `PASS WITH OBSERVATIONS` may be proposed to a later evidence-acceptance act.

Alternative 2 moves row 2 in front of row 1 and leaves the condition text of each row unchanged. The resulting order is: critical/high block; then short anchor count; then any other blocking finding or unresolved comparison; then the pass row.

Alternative 3 leaves the rows in place and changes the first condition. `INCONCLUSIVE / NOT COMPLETED` matches only when the anchor count is short and no critical/high block exists. When a critical/high block exists, the first row does not match, and row 2 does.

Row 2 is a subset of row 3. A finding that meets row 2 is `BLOCKING`, so row 3's "any finding is `BLOCKING`" is also true. First match is what selects row 2 when both could apply. There is no state in which row 2 matches and row 3's condition is false.

The checker has no review-token function. Neither alternative repairs an implemented function. `STAGE-Q-SEV-1` §4 says unresolved CRITICAL and HIGH remain blocking, and that `PASS WITH OBSERVATIONS` does not satisfy CC-02. That sentence does not reorder §4.

### 5.2 Combinations on the current table

`Short` means fewer than three counting anchors. `Critical/high` means the row-2 condition. `Other block or unresolved comparison` means a row-3 condition without a row-2 condition: a blocking finding that is not a row-2 finding, or a comparison status `UNRESOLVED`, or both.

| Short anchors | Critical/high block | Other block or unresolved comparison                                  | Alternative 2                            | Alternative 3                            |
| ------------- | ------------------- | --------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| Yes           | Yes                 | Implied, because row 2 is blocking                                    | `BLOCKED — UNRESOLVED CRITICAL/HIGH`     | `BLOCKED — UNRESOLVED CRITICAL/HIGH`     |
| Yes           | No                  | Yes, medium/low block                                                 | `INCONCLUSIVE / NOT COMPLETED`           | `INCONCLUSIVE / NOT COMPLETED`           |
| Yes           | No                  | Yes, unresolved comparison                                            | `INCONCLUSIVE / NOT COMPLETED`           | `INCONCLUSIVE / NOT COMPLETED`           |
| Yes           | No                  | Yes, both a medium/low block and an unresolved comparison             | `INCONCLUSIVE / NOT COMPLETED`           | `INCONCLUSIVE / NOT COMPLETED`           |
| Yes           | No                  | No blocking finding and no unresolved comparison                      | `INCONCLUSIVE / NOT COMPLETED`           | `INCONCLUSIVE / NOT COMPLETED`           |
| No            | Yes                 | Implied                                                               | `BLOCKED — UNRESOLVED CRITICAL/HIGH`     | `BLOCKED — UNRESOLVED CRITICAL/HIGH`     |
| No            | No                  | Yes, medium/low block                                                 | `BLOCKED — UNRESOLVED MEDIUM/LOW`        | `BLOCKED — UNRESOLVED MEDIUM/LOW`        |
| No            | No                  | Yes, unresolved comparison, including when no finding is blocking     | `BLOCKED — UNRESOLVED MEDIUM/LOW`        | `BLOCKED — UNRESOLVED MEDIUM/LOW`        |
| No            | No                  | No. Every finding is `NOT-BLOCKING` and no comparison is `UNRESOLVED` | `PASS WITH OBSERVATIONS` may be proposed | `PASS WITH OBSERVATIONS` may be proposed |

The seven situations requested in the review are the first, second, third, fifth, sixth, seventh, and ninth data rows. The fourth and eighth rows are the mixed forms of those situations. Every row agrees.

**Alternative 2 and Alternative 3 are equivalent on the current four-row table.** There is no counterexample among these combinations. This addendum does not invent a result on which they differ today.

### 5.3 Where they are not the same amendment

They can diverge only if the table later gains a condition that one formulation reaches and the other does not. That condition is not in §4 now. An illustration, not a current result: a new row placed after the critical/high row and before the anchor-count row would be reached by Alternative 2's order when the anchor count is short and no critical/high block exists. Alternative 3's narrowed first row would already have returned `INCONCLUSIVE / NOT COMPLETED` and would not reach that new row. No such row is being added here.

Alternative 2 is a permutation. Each condition keeps its current wording. Alternative 3 is a change to the inconclusive condition. With the other rows held still, both formulations are determinate. Alternative 2 is the smaller change to condition text. Alternative 3 is the smaller change to visual order, and it states the negative condition in the row a reader checks first. Those are drafting differences. They are not a difference in the token the current table emits. This addendum does not prefer either drafting difference.

`PASS WITH OBSERVATIONS` does not satisfy CC-02 under either alternative. Decision 4 stays **NOT APPROVED**.

---

## 6. Open questions

1. The reviewed input's `session-separation`, `attempt-id`, provider, and model are not in the repository.
2. Whether that input would have made a sibling `SIBLING-DISQUALIFIED` is unknown. That question is separate from S-04's `COMPLETE` / `PARTIAL` cell.
3. Stage T's scope question for Reading 2 remains open: the unsettled cell only, or every `COMPLETE` plus `PARTIAL` pair. This addendum does not narrow it.
4. `S04-PENDING-COMPLETE-PARTIAL` still has no expected result.
5. For Option B, the Product Owner still has to say whether B1's withdrawal of §3 negation inheritance is intended. Stage T did not state that withdrawal.
6. For B2, the Product Owner still has to accept or reject the widened header in §4.4. Inheritance limited to the existing §3.1 term does not create the grants in examples 2, 3, and 9.
7. Limiter inheritance from a header remains **`UNSPECIFIED`** unless a formulation such as B2 clause 4 is adopted.
8. Option C still has no association text. Its meaning is unchanged.
9. Alternative 4 still has no review-level token. Alternatives 2 and 3 remain unchosen. Their current-table tokens match, and their amendment text does not.
10. None of the illustrative windows in §4 was executed.

---

## 7. Consequences for the Product Owner's decisions

No row below records a decision or authorizes an edit.

| Decision | What this addendum changes about the choice                                                                                                                                                                                                                                                                      | What it does not do                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-04     | The five-field cell can be decided without a recovered session token. The attempt named by Stage T is not a counting anchor under any legal session value. A specific historical record cannot be validated, because it was not retained.                                                                        | It does not select Reading 1, Reading 2, or DEFER. It does not set the pending test. It does not amend `STAGE-Q-COUNT-1`.                                      |
| S-05     | Option B, if chosen, needs a further choice of B1 or B2. B1 withdraws §3 negation inheritance and changes example 8. B2 needs the proposed header-to-bullet unit, including the widened header, or it does not cover examples 2, 3, and 9. Option A remains the current window rule. Option C remains unwritten. | It does not select A, B1, B2, C, or DEFER. It does not amend `STAGE-Q-PHRASE-1` or the checker. `STAGE-Q-SEV-1` §3.2 still cites the phrase test by reference. |
| S-06     | Choosing Alternative 2 or Alternative 3 does not change the review token of any combination in §5.2. The choice is the form of a later amendment, and how a future row would interact with that form.                                                                                                            | It does not select an alternative. It does not add a token for Alternative 4. It does not implement a review-token function. The checker still has none.       |

A later copy-complete sentence remains unauthorized. Hashes in `STAGE-Q-ADOPT-1`, `STAGE-Q-VER-1`, and `STAGE-Q-BRIEF-1` are not updated.

---

## 8. Decision record template

The Product Owner fills this section. No field is filled on the Product Owner's behalf. A blank field means no decision has been recorded.

B1 and B2 are details of Option B. Recording one of them does not change Option A or Option C. A recorded choice authorizes only what its scope field says. This template does not adopt Stage Q, approve Decision 4, authorize provider contact, authorize SQL EXEC or Census EXEC, create an anchor, disclose package bytes, change the small-cell boundary, or close CC-02, CC-06, or OQ-CENSUS-01.

### 8.1 S-04

Allowed values: `Reading 1` / `Reading 2` / `DEFER`.

If the value is `Reading 2`, the scope field needs to say whether the rejection is the unsettled cell only or every `COMPLETE` plus `PARTIAL` pair. The absent `session-separation` is not one of those values.

- **PO decision:**
- **Rationale:**
- **Date:**
- **Scope of authorization:**
- **Explicit exclusions:**

### 8.2 S-05

Allowed values: `Option A` / `Option B1` / `Option B2` / `Option C` / `DEFER`.

If the value is `Option B1`, the scope field needs to say that §3 negation inheritance is withdrawn. If the value is `Option B2`, the scope field needs to identify the header-to-bullet rule, including whether the header is wider than §3.1. If the value is `Option C`, the association rule has to be written in the scope field. The letter C alone does not specify checker behavior.

- **PO decision:**
- **Rationale:**
- **Date:**
- **Scope of authorization:**
- **Explicit exclusions:**

### 8.3 S-06

Allowed values: `Alternative 1` / `Alternative 2` / `Alternative 3` / `Alternative 4` / `DEFER`.

Alternative 2 and Alternative 3 emit the same token on the current table. The scope field needs to say which formulation is being authorized. If the value is `Alternative 4`, the scope field needs to identify the new token or the two-outcome rule. This template does not supply that token.

- **PO decision:**
- **Rationale:**
- **Date:**
- **Scope of authorization:**
- **Explicit exclusions:**

---

## 9. What this addendum does not do

This addendum does not edit Stage T, Stage S, Stage Q, Stage R, the checker, or the Decision Register. It does not run the checker or any test. It does not execute SQL or the Census, connect to a database, contact a provider, disclose package bytes, or create a Package Anchor or an Evidence Anchor. It does not start a provider assessment, change the small-cell boundary, adopt Stage Q or Stage R, or close CC-02, CC-06, or OQ-CENSUS-01. It does not stage, commit, or push.

Decision 4 remains **NOT APPROVED**. Final authority remains with the Product Owner.
