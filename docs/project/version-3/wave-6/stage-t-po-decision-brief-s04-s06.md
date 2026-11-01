# Stage T — PO Decision Brief for S-04 / S-05 / S-06

**Document ID:** `STAGE-T-BRIEF-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`
**Creation date:** 2026-11-01

This file places three open Stage S questions in front of the Product Owner. It does not decide them. It does not amend Stage Q, Stage R, or Stage S. It does not authorize an implementation, a checker run, a new adoption sentence, or Decision 4.

Decision 4 remains **NOT APPROVED**.

The hashes in §1.5 identify the bytes read for this brief. They are not an adoption sentence. They do not update `STAGE-Q-ADOPT-1`, `STAGE-Q-VER-1`, or `STAGE-Q-BRIEF-1`.

---

## 1. Executive summary

### 1.1 Why these three decisions are required

Stage S (`STAGE-S-PROP-1`) separates checker corrections from questions the current normative text does not settle. S-04, S-05, and S-06 are in the second group. Stage S §9 sequences later implementation, specification edits, checker runs, and any new copy-complete sentence after a recorded Product Owner choice on all three. This brief is that decision request. It is not that choice.

Each question asks the Product Owner to select what the written rule is, or to defer. The current files can be read in more than one way, or they state a rule whose later tightening would be a normative amendment.

| ID   | What is open                                                                                                          | Where the current text lives      |
| ---- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| S-04 | Whether `capture-status` `COMPLETE` may stand with `instructions-observable` `PARTIAL` on the reviewed isolation cell | `STAGE-Q-COUNT-1` §§2–4           |
| S-05 | Whether an inspection-grant subject and a grant phrase must be associated more tightly than the current window test   | `STAGE-Q-PHRASE-1` §§2–5          |
| S-06 | Which review-level outcome is reported when fewer than three counting anchors coincide with a critical/high block     | `STAGE-Q-ENUM-1` §4, lines 95–104 |

### 1.2 What stays open

- **S-04.** Two readings of one cell. Reading 1 keeps the record compatible and not counting. Reading 2 rejects the record. Stage S §4.4 recommends Reading 2 and adopts neither reading.
- **S-05.** Three options. Option A is the rule written in `STAGE-Q-PHRASE-1` §5. Options B and C would amend that section. Stage S §5.1 selects none of them.
- **S-06.** Four alternatives for review-token precedence. The checker does not implement the review-level token function. The specification text, read as first match, yields `INCONCLUSIVE / NOT COMPLETED` for the control scenario. Stage S §5.2 selects none of the alternatives.

### 1.3 What remains blocked until the Product Owner records a choice

Until a choice is recorded in §8, or the item is explicitly deferred there, the following stay unauthorized:

1. An amendment of `STAGE-Q-COUNT-1` that accepts or rejects the S-04 cell.
2. An expected result for the pending test `S04-PENDING-COMPLETE-PARTIAL`.
3. A checker change that compares `capture-status` with `instructions-observable` for that cell.
4. An amendment of `STAGE-Q-PHRASE-1` §5.
5. A checker change to the window subject test or to phrase association.
6. An amendment of the `STAGE-Q-ENUM-1` §4 review-token table, including any new review-level token.
7. Implementation of a review-level token function. Writing that function against the current table would freeze Alternative 1 before a choice.
8. A new copy-complete adoption sentence. Stage S §7 records that a sentence written while S-04, S-05, and S-06 are unsettled would bind those open questions.
9. Approval of Decision 4.

Stage S §9 also places the proposed checker corrections S-01, S-02, and S-03 after these decisions, under a separate implementation authorization. This brief does not give that authorization.

### 1.4 Stage T is not an implementation permit

Creating this file does not adopt Stage Q, Stage R, or Stage S. It does not edit the checker, the Decision Register, or the SQL candidate. It does not contact a provider, disclose package bytes, create an anchor, execute SQL, execute the Census, or change the small-cell boundary. It does not close CC-02, CC-06, or OQ-CENSUS-01. A recommendation in §6 is the document author's recommendation. It is not a Product Owner decision.

### 1.5 Bytes read

Digests are SHA-256 of the working-tree files on 2026-11-01. Branch: `main`. No source below was staged or edited for this brief. The checker digest is recorded only to confirm that Stage S's static line citations still name the same bytes. The checker was not executed.

| Path                                                                                     | Working-tree SHA-256                                               | Bytes | Lines |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----- | ----- |
| `docs/project/version-3/wave-6/stage-s-remediation-proposal.md`                          | `78bc163228a55cd83e49196d6bd2306fd1e2bbe0192ce59282bd50323cd37476` | 60218 | 461   |
| `docs/project/version-3/wave-6/stage-q-counting-attempt-and-isolation-specification.md`  | `1cc25528ddb2fe763ff5358ac81aff93d4635e424787a34d77bdcb3098433479` | 15863 | 117   |
| `docs/project/version-3/wave-6/stage-q-inspection-grant-adversarial-tests.md`            | `0bd61a1749f0f9809e29e9fe2b8fceb60f53d6885fcdb3f29a070f79793a16f8` | 7036  | 84    |
| `docs/project/version-3/wave-6/stage-q-enum-and-schema-validation-specification.md`      | `100343db2ff27953fa4a09c047bccc6bd8472b849b1b198e1cc745df3f48c609` | 15565 | 134   |
| `docs/project/version-3/wave-6/stage-q-clearing-bundle-and-correlation-specification.md` | `772fd3de1e8c173e3769fb8af31afb3d9fffe57f25d486cae24a54087bb45262` | 8779  | 87    |
| `docs/project/version-3/wave-6/stage-q-normative-severity-and-blocking-specification.md` | `7199a46aabbd4c55a2566b9fa9a790885637a133c255938dac36ffa283a8a242` | 10524 | 106   |
| `docs/project/version-3/wave-6/stage-q-validation-checks.py`                             | `1fdbc00408eab8e717819aa584dd32351460b95214768c9c510ea08d123cdfd2` | 57797 | 1487  |

The five Stage Q digests and the checker digest match the working-tree inventory in Stage S §2. `STAGE-Q-SEV-1` also matches its HEAD digest, as Stage S recorded. No contradiction was found between those inventory rows and the files read for this brief.

`STAGE-Q-CLEAR-1` was read. It defines bundle rows and sibling correlation. It does not define the S-04 capture pair, the S-05 subject test, or the S-06 review-token order. `STAGE-Q-SEV-1` was read because §3.2 treats an inspection-grant match as HIGH when the CRITICAL predicate is `NOT-MET`, and §4 says unresolved CRITICAL and HIGH remain blocking.

---

## 2. S-04 — Capture / isolation compatibility

### 2.1 The cell

Stage S §4.4 describes the record from the independent review. This brief did not re-run it. The named values are:

| Field                          | Value                     |
| ------------------------------ | ------------------------- |
| `capture-status`               | `COMPLETE`                |
| `isolation-result`             | `ISOLATION-NOT-EVIDENCED` |
| `isolation-gap-reason`         | `PARTIAL-INSTRUCTIONS`    |
| `transmission-evidence-status` | `INTACT`                  |
| `instructions-observable`      | `PARTIAL`                 |

Stage S does not name `session-separation` for that record. `STAGE-Q-COUNT-1` §3 requires all six fields before the compatibility table is applied. Stage S's static reading says the record passes the six-field enum gate. The sixth value remains unnamed here.

Stage S §4.4 also separates four facts that share no interchange rule:

| Fact                                                                           | Field                          |
| ------------------------------------------------------------------------------ | ------------------------------ |
| Whether the local capture completed, refused, truncated, or was partial        | `capture-status`               |
| Whether the instructions seen for the isolation check were `FULL` or `PARTIAL` | `instructions-observable`      |
| Whether the local request bytes were readable and matched                      | `transmission-evidence-status` |
| The local disclosure-search outcome                                            | `isolation-result`             |

`STAGE-Q-COUNT-1` §2 says these enums are not interchangeable. A shared spelling does not make two fields the same field. `COMPLETE` is a legal `capture-status`. `PARTIAL` is a legal `instructions-observable`. Local request-byte integrity does not prove provider receipt or processing. `NO-CROSS-DISCLOSURE-OBSERVED` does not prove provider-side isolation. The reviewed cell does not use `NO-CROSS-DISCLOSURE-OBSERVED`.

### 2.2 What the current sentences say

`STAGE-Q-COUNT-1` §3 table columns are `isolation-result`, `isolation-gap-reason`, `transmission-evidence-status`, and `Counts`. The third row is `ISOLATION-NOT-EVIDENCED`, gap `PARTIAL-INSTRUCTIONS` when instructions are `PARTIAL`, transmission `INTACT`, and it does not count. The table does not mention `capture-status`.

The prose under the table says: when `capture-status` is `PARTIAL-INSTRUCTIONS` and `isolation-result` is `ISOLATION-NOT-EVIDENCED`, the gap is `PARTIAL-INSTRUCTIONS` and `capture-status` stays `PARTIAL-INSTRUCTIONS`. A record that overwrites `capture-status` with the isolation token is invalid. Any other combination rejects the normalized file. The attempt does not count.

That preservation sentence does not say `COMPLETE` is forbidden when instructions are `PARTIAL`. Stage S's static reading of `isolation_compatible` (checker lines 859–897, same checker digest as §1.5) accepts the reviewed input. `capture-status` is checked for enum membership. It is not compared with `instructions-observable`. Counting is a separate result: the record would not count, because isolation is not `NO-CROSS-DISCLOSURE-OBSERVED`.

The settled rejection rows in Stage S §4.4 stay settled under either reading. They are not the decision. The pending test `S04-PENDING-COMPLETE-PARTIAL` has no expected result until the Product Owner chooses.

### 2.3 Reading 1 — the record is compatible and does not count

**Rule.** The reviewed record matches the third §3 row. `COMPLETE` is a legal `capture-status`. The table does not constrain it. The record is compatible. It does not count.

**Normative basis.** §2 lists both values as legal and keeps the fields distinct. The §3 row that matches the isolation, gap, transmission, and instruction values does not name capture. The preservation sentence constrains the case in which capture already is `PARTIAL-INSTRUCTIONS`. It does not add a second constraint on `COMPLETE`. On this reading, "any other combination" rejects combinations outside the table's isolation, gap, and transmission columns. It does not reject an unnamed legal capture value on a listed row.

**Validation.** The normalized record is accepted as compatible. Stage S's static reading returns a pass for this input. This brief does not treat that checker behavior as a Product Owner selection of Reading 1.

**Counting.** The attempt does not count. Eligibility for the counting slot requires `isolation-result` `NO-CROSS-DISCLOSURE-OBSERVED` together with the other counting rules in §1 and §1.1. Compatibility and counting stay different results.

**False-accept risk.** The normalized file may contain a completed local capture beside partially observable instructions. A later reader can treat `COMPLETE` as a stronger fact than the isolation gap supports. The record still does not count, and it still does not prove provider-side isolation.

**False-reject risk.** This reading does not reject the cell. A locally complete capture whose isolation check saw only partial instructions remains a compatible non-counting record.

**`STAGE-Q-COUNT-1` change.** No amendment is required to preserve this reading. The current sentences support it. A later clarification could say, in terms, that the third row does not constrain `capture-status`. That clarification is not required by Reading 1 and is not made here.

### 2.4 Reading 2 — the record is rejected

**Rule.** `COMPLETE` together with `PARTIAL` instructions is a pair the current text never authorizes. The reviewed record is an "other combination" and is rejected.

**Normative basis.** No sentence in §§2–4 says a complete capture may accompany partially observable instructions. §3 says any other combination rejects the normalized file, and the attempt does not count. Reading 2 applies that rejection sentence to the unauthorized pair.

The same sentence follows a table with no `capture-status` column. Using it to reject this pair is an interpretation. It is not a sentence that already names `COMPLETE` and `PARTIAL`.

**Validation.** The reviewed record fails validation. The normalized file is rejected.

**Counting.** The attempt does not count. Rejection removes it from the compatible set. Reading 1 also withholds the counting slot. The decision changes acceptance versus rejection. It does not add a counting permission, and it does not turn this isolation result into `NO-CROSS-DISCLOSURE-OBSERVED`.

**False-accept risk.** The cell is not stored as a valid normalized record. The undefined pair is not silently compatible.

**False-reject risk.** `capture-status` and `instructions-observable` record different facts. Both can be true of one attempt: the local capture completed, and the instructions seen for the isolation check were partial. Reading 2 rejects that record. §2's separation of the fields is the reason a rejection can be a false reject rather than a contradiction already written into the specification.

**Stage S recommendation.** Stage S §4.4 recommends Reading 2 and says to record it in a later amendment of `STAGE-Q-COUNT-1` before any checker change for this cell. That recommendation is not a Product Owner decision. It is not authority to edit `STAGE-Q-COUNT-1` or the checker. This brief repeats it as a source fact and does not adopt it.

### 2.5 What `STAGE-Q-COUNT-1` would need if the Product Owner chooses Reading 2

The current file does not contain the rejection. Choosing Reading 2 therefore needs a later amendment. This brief does not write that amendment. The amendment would need to do all of the following.

1. Name the combination in §3. The combination Stage S leaves unsettled is `isolation-result` `ISOLATION-NOT-EVIDENCED`, `isolation-gap-reason` `PARTIAL-INSTRUCTIONS`, `transmission-evidence-status` `INTACT`, `instructions-observable` `PARTIAL`, and `capture-status` `COMPLETE`. The amendment has to state that this combination rejects the normalized file. Relying on the existing words "any other combination" leaves the two readings in place.
2. State the scope in the same amendment. Stage S's matrix marks other rows settled with capture "any legal" or "not specified", and with instructions "either" or "not specified". One settled row is `TRANSMISSION-NOT-EVIDENCED`, gap `NONE`, non-intact transmission, either instruction enum, and any legal capture value. A global ban on every `COMPLETE` plus `PARTIAL` pair would rewrite that settled row, and it would add a constraint to other rows Stage S did not mark unsettled, including `CROSS-DISCLOSURE-DETECTED` with gap `NONE` and transmission `INTACT`, where instructions and capture are "not specified". Rows that already reject `PARTIAL` instructions regardless of capture — `SEARCH-NOT-RUN` with `PARTIAL`, and `NO-CROSS-DISCLOSURE-OBSERVED` with `PARTIAL` — would not gain a new result from a global ban. The Product Owner's Reading 2 entry in §8 needs to say whether the rejection is the unsettled cell only, or every `COMPLETE` plus `PARTIAL` pair.
3. Leave the §2 enums in place. `COMPLETE` remains a legal `capture-status`. `PARTIAL` remains a legal `instructions-observable`. Reading 2 constrains a combination. It does not delete either token.
4. Leave the preservation sentence in place. Capture `PARTIAL-INSTRUCTIONS` with isolation `ISOLATION-NOT-EVIDENCED` and gap `PARTIAL-INSTRUCTIONS` stays the compatible non-counting case already recorded as `Q7-OVERLAP-KEEPS-CAPTURE`.
5. Leave §1 and §4 in place. No counting permission is added. The non-proof sentences stay. Shared spellings remain legal in both fields. An overwrite of `capture-status` by the isolation token remains invalid only where it is an overwrite. Equality of a shared spelling is not, by itself, that overwrite.
6. Leave §5's existing check rows as the record of checks already run. A later authorized task may set `S04-PENDING-COMPLETE-PARTIAL` to rejected only after the amendment exists. This brief does not set that expected result.

If the scope is not written with the choice, a later editor would have to guess whether Reading 2 is the one cell or a global pair ban. That guess is not authorized by Stage S or by this brief.

---

## 3. S-05 — Inspection-grant subject scope

### 3.1 The current rule

`STAGE-Q-PHRASE-1` §2 defines a window as the longest run of consecutive lines matching `^\s*--`. §3 splits that window into sentences and list bullets. Negation does not cross a sentence boundary.

§5 says the window refers to the subject when it contains `n < 5` with flexible whitespace, or a whole phrase `small cell`, `small cells`, or `unsuppressed counts`. The test is met only when that window has the subject and at least one phrase occurrence is neither negated nor limited. §5 does not say the subject and the phrase must share a sentence.

Phrases in §4 are `inspection of`, `read the values`, `review the values`, `use the values`, `copy the counts`, `look at`, `examine`, `inspect`, `export`, and `publish`. A match is a text classification. It grants no permission to inspect, export, publish, or use unsuppressed `n < 5` values. A grant that is not also CRITICAL is HIGH under `STAGE-Q-SEV-1` §3.2.

Stage S §5.1 records that `inspect_window` (lines 276–298) computes `window_subject` on the joined window and computes phrase hits per clause. Line 297 sets the grant when the window subject is true and any hit is not negated. Line 298 returns that grant. The subject test and the phrase test are not required to succeed in the same sentence. The Stage S defect register cites the same functions at lines 267–297. This brief did not open the checker to resolve that one-line difference in the Stage S citations. The checker digest in §1.5 matches the digest Stage S measured, and the checker was not executed.

Option A is that §5 rule. It is not described here as a checker defect. S-02, the proposed ASCII case-folding correction, does not decide S-05 and can be authorized later without this choice. Options B and C would be normative amendments.

Illustrative windows below that are not rows in §6 are readings of the written rule. They are not new checker results.

### 3.2 Option A — keep the window-level rule

**Exact rule.** The window is a grant when the window contains a subject marker from §5 and at least one phrase occurrence in that window is neither negated nor limited. The subject and the phrase may be in different sentences of the same window.

**Positive case.** §6 records `Q5-SYN-INSPECT`, input `operators may inspect n < 5`, expected and actual `GRANT`. The subject and the phrase are in one sentence. Option A classifies the window as a grant.

**Negative case.** §6 records `Q5-SYN-NEGATED`, input `do not inspect n < 5`, expected and actual `NO-GRANT`. The phrase is negated in the sentence.

**Ambiguous case under this rule.** A window whose sentences split the two markers:

```text
-- Operators may inspect the dashboard.
-- The publication floor is n < 5.
```

The window contains the subject `n < 5` and an unnegated phrase `inspect`. §5's window test is met. The inspect sentence does not mention the subject. This is the cross-sentence shape Stage S identifies. No §6 row records this window.

**False-positive risk.** A phrase in one sentence and a subject marker in another sentence of the same window can classify the window as a grant. That classification can satisfy the HIGH inspection-grant bullet in `STAGE-Q-SEV-1` §3.2 when the CRITICAL predicate is `NOT-MET`.

**False-negative risk.** A grant whose subject and phrase are split across two sentences of one window is still detected. Stage S records that missed grants of that shape are fewer under Option A. A window still fails when every phrase occurrence is negated or limited, or when the subject wording is outside the closed §5 list. Those misses are the existing §5 gates.

**`STAGE-Q-PHRASE-1` change.** None. Option A is §5 as written.

**Checker change.** None for subject scope. The current window-level test is the behavior Stage S describes.

### 3.3 Option B — same sentence

**Exact rule.** The window is a grant only when at least one sentence contains both a §5 subject marker and a phrase occurrence that is neither negated nor limited. A subject in one sentence and a grant phrase in another sentence of the same window is not a grant.

The limiter rule in §4 stays in force. Stage S's short label "unnegated" is read here together with §5's existing exclusion of limited occurrences. An amendment that required only the absence of negation, and allowed a limited occurrence to count, would loosen a gate Stage S did not reopen.

**Positive case.** `operators may inspect n < 5` places the subject and the unnegated phrase `inspect` in the same sentence. Under Option B the window is a grant. §6 already records that input as `GRANT` under the current checker. The Option B result for this input is a reading of the proposed rule, not a new run.

§6 `Q5-SYN-BUT`, input `Do not publish n < 5, but operators may inspect n < 5.`, splits on `, but `. The second sentence contains both `inspect` and `n < 5`. Option B still classifies that second sentence as a grant. The recorded §6 result is `GRANT`.

**Negative or ambiguous case.** The two-sentence dashboard window in §3.2 has `inspect` in the first sentence and `n < 5` in the second. Option B classifies it as `NO-GRANT`.

A sharper boundary comes from the §3 split on `, but `:

```text
-- Operators may inspect the retained rows, but the floor is n < 5.
```

The first sentence has `inspect` and no subject marker. The second sentence has `n < 5` and no grant phrase. Option A meets the window test. Option B does not. Whether the author meant one grant is not settled by either sentence alone.

**False-positive risk.** The cross-sentence accident in Option A is not a grant. A same-sentence coincidence remains possible: one sentence can contain a phrase and a subject marker without the phrase being about that subject. Option B does not remove that coincidence.

**False-negative risk.** A grant whose subject and phrase sit in different sentences becomes `NO-GRANT`. Wording such as "Operators may inspect these rows. Counts below n < 5 stay in the review set." would fail Option B if the first sentence has the phrase and the second has the subject.

**`STAGE-Q-PHRASE-1` change.** Yes. §5 would gain an explicit same-sentence requirement. §2 and §3 can remain the window and sentence definitions the new sentence uses. This is a normative amendment, not a checker bugfix.

**Checker change.** Yes, and only after that amendment, under a separate implementation authorization. `inspect_window` would have to require the subject and a qualifying phrase in the same sentence. This brief does not make that change.

### 3.4 Option C — a formal subject-to-phrase association rule

**Exact rule.** No association rule is written in `STAGE-Q-PHRASE-1` or in Stage S. Option C is a decision to add one. Until the Product Owner writes the rule, there is no Option C behavior to apply. Examples of associations that are not now specified include: the phrase's own sentence only; the next sentence when it names the subject; a list bullet inherited from a header; anaphoric wording such as "those counts". This brief does not choose among them and does not draft the rule.

**Positive case.** None can be stated as a determined result. Consider:

```text
-- Operators may inspect the following counts.
-- Those counts include n < 5.
```

Option A classifies the window as a grant, because the window has both markers and `inspect` is not negated. Option B classifies it as `NO-GRANT`, because no single sentence contains both. Option C would classify it only after an association rule says whether "the following counts" and "those counts" tie the phrase to the later subject. No current sentence says that.

**Negative or ambiguous case.** A window with `inspect` in one sentence and a later, unrelated `n < 5` in another sentence is the same pair of markers. Option C cannot yet say whether that pair is associated. The two illustrative windows in this section are not distinguished by any written rule.

**False-positive risk.** Depends on the rule the Product Owner writes. No such rule exists now.

**False-negative risk.** Depends on that same unwritten rule. Stage S §5.1 records that, until the rule is written, checker behavior would be undefined.

**`STAGE-Q-PHRASE-1` change.** Yes. §5 would receive the new association rule. §3 would change only if the rule needs sentence or list structure that §3 does not already define. The rule text has to exist before the file can be amended. Selecting the letter C, without the rule, does not specify the amendment.

**Checker change.** None until the rule is written. A checker edit before that text would invent the association. After the text exists, a separate implementation authorization would be required to change `window_subject` and `inspect_window`.

---

## 4. S-06 — Review-level outcome precedence

### 4.1 What is written, and what the checker does

`STAGE-Q-ENUM-1` §1 lists four review-level outcomes. They are not finding fields:

- `INCONCLUSIVE / NOT COMPLETED`
- `BLOCKED — UNRESOLVED CRITICAL/HIGH`
- `BLOCKED — UNRESOLVED MEDIUM/LOW`
- `PASS WITH OBSERVATIONS`

§4 says review tokens are first match, in this order:

1. Fewer than three counting anchors: `INCONCLUSIVE / NOT COMPLETED`.
2. Any finding is `BLOCKING` because critical or high is `MET` or `NOT-DETERMINED`, the label is unrecognized and undetermined, or working severity is `CRITICAL` or `HIGH`: `BLOCKED — UNRESOLVED CRITICAL/HIGH`.
3. Any finding is `BLOCKING`, or any comparison status is `UNRESOLVED`: `BLOCKED — UNRESOLVED MEDIUM/LOW`.
4. Every finding is `NOT-BLOCKING` and no comparison status is `UNRESOLVED`: `PASS WITH OBSERVATIONS` may be proposed to a later evidence-acceptance act.

`PASS WITH OBSERVATIONS` does not satisfy CC-02. `STAGE-Q-SEV-1` §4 says unresolved CRITICAL and unresolved HIGH remain blocking, and that providers do not issue review-level tokens. The `blocks` function earlier in `STAGE-Q-ENUM-1` §4 is a finding-level function. The review-token table is a separate first-match list. Sibling correlation in `STAGE-Q-CLEAR-1` reads the intrinsic block result. It does not read the review-level token.

Stage S §5.2 records that the checker source contains no review-token function and no `INCONCLUSIVE` result. **The checker does not implement the review-level token function.** That absence is not, in this brief, an implemented checker defect. There is no review-token function whose output was compared with the table and found wrong. Implementing the table before a Product Owner choice would freeze Alternative 1 into code. This brief does not authorize that implementation.

### 4.2 Control scenario

The control scenario used for every alternative below is both of the following at once:

- fewer than three counting anchors;
- at least one finding that matches review-token row 2: `BLOCKING` because critical or high is `MET` or `NOT-DETERMINED`, the label is unrecognized and undetermined, or working severity is `CRITICAL` or `HIGH`.

A finding that is `BLOCKING` only for a medium, low, or comparison-status reason is not this scenario. That finding matches row 3, not row 2.

### 4.3 Alternative 1 — keep the current first-match order

**Rule.** The anchor-count row remains first and unconditional. The critical/high row is reached only when the anchor count is not short.

**Control-scenario result.** `INCONCLUSIVE / NOT COMPLETED`. The critical/high row is not reached.

**Interpretation.** The single review token reports that the review is not completed because the counting-anchor count is short. It does not report the critical/high block. Finding-level `blocks` can still return `BLOCKING` for that finding. The review token and the finding-level result answer different questions. A reader who sees only the review token is told that the review did not complete.

**`STAGE-Q-ENUM-1` change.** None. Alternative 1 is the current §4 order.

### 4.4 Alternative 2 — test the critical/high row before the anchor-count row

**Rule.** The critical/high blocking row is evaluated before the anchor-count row. The anchor-count row remains unconditional for every short-anchor review that did not match the critical/high row. The medium/low row and the pass row stay after the anchor-count row.

**Control-scenario result.** `BLOCKED — UNRESOLVED CRITICAL/HIGH`.

**Interpretation.** The single review token reports the unresolved critical/high block. It does not report that the counting-anchor count is short. A reader who sees only the review token is not told that the three-anchor condition also failed. `PASS WITH OBSERVATIONS` is not reached. `PASS WITH OBSERVATIONS` does not satisfy CC-02, and this blocked token is not a CC-02 satisfaction either. Decision 4 stays **NOT APPROVED** under every alternative in this section.

**`STAGE-Q-ENUM-1` change.** Yes. §4's first-match order would change. The four tokens in §1 can stay. `blocks` can stay.

### 4.5 Alternative 3 — inconclusive only when the anchor count is short and no critical/high block exists

**Rule.** `INCONCLUSIVE / NOT COMPLETED` matches only when the anchor count is short and no critical/high block exists. When a critical/high block exists, matching continues and the existing critical/high row applies. Stage S describes the consequence as: the critical/high block wins, and inconclusive remains available for the short-anchor case without that block.

**Control-scenario result.** `BLOCKED — UNRESOLVED CRITICAL/HIGH`.

**Interpretation.** For this control scenario the token is the same token as Alternative 2. The drafting difference is where the condition sits. Alternative 2 reorders two existing rows and leaves the anchor-count row unconditional. Alternative 3 narrows the anchor-count row and can leave it first. On the current four-row table, the sources do not show a case in which those two formulations emit different tokens:

| Situation                                                                                        | Alternative 2 token                      | Alternative 3 token                  |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------- | ------------------------------------ |
| Short anchors and a row-2 critical/high block                                                    | `BLOCKED — UNRESOLVED CRITICAL/HIGH`     | `BLOCKED — UNRESOLVED CRITICAL/HIGH` |
| Short anchors and no row-2 block, including a later medium/low block or an unresolved comparison | `INCONCLUSIVE / NOT COMPLETED`           | `INCONCLUSIVE / NOT COMPLETED`       |
| Short anchors and no blocking finding                                                            | `INCONCLUSIVE / NOT COMPLETED`           | `INCONCLUSIVE / NOT COMPLETED`       |
| Three or more anchors and a row-2 block                                                          | `BLOCKED — UNRESOLVED CRITICAL/HIGH`     | `BLOCKED — UNRESOLVED CRITICAL/HIGH` |
| Three or more anchors and a row-3 block only                                                     | `BLOCKED — UNRESOLVED MEDIUM/LOW`        | `BLOCKED — UNRESOLVED MEDIUM/LOW`    |
| Three or more anchors and every finding `NOT-BLOCKING`, with no unresolved comparison            | `PASS WITH OBSERVATIONS` may be proposed | Same                                 |

A row inserted later between the anchor-count condition and the critical/high condition could make the formulations diverge. No such row is in the current table. Evidence in the current text is not sufficient to prefer Alternative 2 over Alternative 3, or the reverse, on the token that would be emitted.

The short-anchor fact remains hidden when a critical/high block is present, as it is under Alternative 2. When the anchor count is short and no critical/high block is present, a medium/low block still does not appear in the review token. That is already true of the current first-match order.

**`STAGE-Q-ENUM-1` change.** Yes. §4 would change the condition of the anchor-count row, or would state the same condition by an equivalent order. §1's four tokens can stay. `blocks` can stay.

### 4.6 Alternative 4 — emit both conditions

**Rule.** The short-anchor condition and the critical/high block are both reported. They are not collapsed into one of the current four tokens.

**Control-scenario result.** No token in the current table expresses both facts. The result is not `INCONCLUSIVE / NOT COMPLETED` alone, and it is not `BLOCKED — UNRESOLVED CRITICAL/HIGH` alone. Emitting both by naming the two existing tokens together would be an outcome §1 does not list. This brief does not invent the missing token.

**Interpretation.** A later reader would be able to see both that the counting-anchor count is short and that an unresolved critical/high finding is blocking. Alternatives 1, 2, and 3 each hide one of those facts inside a single existing token. Alternative 4 preserves both only after a new normative token, or an explicit rule allowing two simultaneous review-level outcomes, exists. Until that text exists, the checker has no legal review-level value to emit for the pair. Finding-level `blocks` can remain `BLOCKING` without a change to the `blocks` function.

**`STAGE-Q-ENUM-1` change.** Yes. §1's closed list of review-level outcomes would gain a new token, or an explicit two-outcome rule. §4 would gain a row that reports both conditions without collapsing them. `STAGE-Q-SEV-1` §4 would still say that providers do not issue review-level tokens. The new outcome would be a review-level outcome under `STAGE-Q-ENUM-1`, not a provider token. This brief does not draft it.

---

## 5. Comparison

`PENDING` means this brief does not record a Product Owner choice. Deferral is available in §8. A deferral row is omitted here so the table does not look like a selection of the current text.

| Decision | Option        | Normative change required                                                            | Checker change required                                                                         | Main risk                                                                                                                  | PO choice |
| -------- | ------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------- |
| S-04     | Reading 1     | No                                                                                   | No                                                                                              | Undefined `COMPLETE` + `PARTIAL` cell stays compatible                                                                     | PENDING   |
| S-04     | Reading 2     | Yes. `STAGE-Q-COUNT-1` §3 must name the rejected combination and its scope           | Yes, after that amendment, in `isolation_compatible`                                            | False reject of two different facts; a global pair ban would also rewrite settled rows                                     | PENDING   |
| S-05     | Option A      | No                                                                                   | No                                                                                              | Cross-sentence subject and phrase can be a grant                                                                           | PENDING   |
| S-05     | Option B      | Yes. `STAGE-Q-PHRASE-1` §5 same-sentence rule                                        | Yes, after that amendment, in `inspect_window`                                                  | A split-sentence grant becomes `NO-GRANT`                                                                                  | PENDING   |
| S-05     | Option C      | Yes. A new association rule must be written before `STAGE-Q-PHRASE-1` can be amended | Yes, only after that rule exists                                                                | Undefined checker behavior until the rule is written                                                                       | PENDING   |
| S-06     | Alternative 1 | No                                                                                   | No. The review-token function is absent; leaving the text unchanged does not require writing it | Short anchor count hides a critical/high block in the review token                                                         | PENDING   |
| S-06     | Alternative 2 | Yes. `STAGE-Q-ENUM-1` §4 order                                                       | Yes, only after that amendment. No review-token function exists now                             | The blocked token hides the short anchor count                                                                             | PENDING   |
| S-06     | Alternative 3 | Yes. `STAGE-Q-ENUM-1` §4 condition on the inconclusive row                           | Yes, only after that amendment. No review-token function exists now                             | Same control-scenario token as Alternative 2; the short anchor count is still hidden when a critical/high block is present | PENDING   |
| S-06     | Alternative 4 | Yes. New review-level token or two-outcome rule in `STAGE-Q-ENUM-1` §1 and §4        | Yes, only after that token or rule exists                                                       | No legal token for the pair exists today                                                                                   | PENDING   |

---

## 6. Author recommendations

These are recommendations of the author of this brief. They are not Product Owner decisions. They do not amend any normative rule. Stage S §4.4's recommendation of Reading 2 is a source recommendation with the same limit: it is not a Product Owner decision.

### 6.1 S-04

**Author recommendation:** Reading 2, limited to the unsettled cell, written later as an explicit §3 sentence.

**Arguments.** The third table row does not mention `capture-status`. No current sentence authorizes `COMPLETE` with `PARTIAL` instructions. Accepting the cell makes an unnamed pair compatible. Fail-closed rejection of that one cell matches the posture already used for combinations the table does not list. The attempt does not count under either reading, so the counting slot is not the thing being granted.

**Compromise.** The two fields record different facts, so the rejected record may be a true description of a complete capture and a partial instruction view. That is the false-reject cost. The recommendation accepts that cost for the one unsettled cell rather than treat the pair as authorized.

**Scope limit.** The author does not recommend a global ban on every `COMPLETE` plus `PARTIAL` pair. Stage S marks other rows settled with any legal capture and either instruction enum. A global ban would be a larger amendment than the open cell, and the evidence for rewriting those rows is not in the current text. If the Product Owner wants the global ban, §8 needs to say so. Silence is not that broader choice.

The Stage S recommendation to choose Reading 2 is acknowledged and is not adopted by this file.

### 6.2 S-05

**Author recommendation:** Option A.

**Arguments.** Option A is the rule §5 already states. The quoted §6 inputs `Q5-SYN-INSPECT`, `Q5-SYN-MAY-PUBLISH`, and the granting sentence of `Q5-SYN-LATER-GRANT` and of `Q5-SYN-BUT` each place a phrase and `n < 5` in the same sentence. `Q5-SYN-AFTER-LIST` is recorded as `GRANT`, and its input is described rather than quoted, so this brief does not classify that row as same-sentence or cross-sentence. The sources contain no count of windows in which a phrase and a subject marker fall in different sentences. Evidence is not sufficient to recommend a normative amendment on measured false-positive frequency.

**Compromise.** Option A keeps the structural false positive Stage S describes. If the Product Owner wants that shape to stop being a grant, Option B is the amendment that can be written from the existing sentence model in §3. Option C is not recommended. No association rule exists, and a choice of C without that text leaves the checker undefined. Evidence is not sufficient to draft an association rule in this brief.

Option A is not recommended as a finding that the implementation is defective. It is recommended as the choice that leaves the written rule in place.

### 6.3 S-06

**Author recommendation:** do not implement a review-token function until §8 records a choice. On the choice itself, the evidence is sufficient to describe the tradeoff and insufficient to rank Alternative 2 above Alternative 3, or the reverse.

**Arguments.** The checker has no review-token function, so there is no implemented output to repair. The current text, if followed as first match, reports `INCONCLUSIVE / NOT COMPLETED` for the control scenario and does not surface the critical/high block in that token. `STAGE-Q-SEV-1` §4 says unresolved CRITICAL and HIGH remain blocking. That sentence governs the block. It does not, by itself, reorder the review-token table. Alternatives 2 and 3 both surface the block and both hide the short anchor count. Section 4.5 shows no emitted-token difference between them on the current table. Alternative 4 is the only alternative that keeps both facts visible, and §1 has no token for it. Recommending a token spelling would be writing the normative amendment. This brief does not do that.

**Compromise.** Alternative 1 preserves the current sentences and can conceal a critical/high block from any reader who sees only the review token. Alternatives 2 and 3 preserve one existing token and conceal the short anchor count. Alternative 4 preserves both facts and cannot be implemented until a later amendment defines the outcome. The author does not select among Alternatives 2, 3, and 4. The Product Owner's purpose — one existing token that surfaces the block, or both facts at the cost of a new token — is the fact that distinguishes them. That purpose is not stated in the current specifications.

---

## 7. Consequences of each choice

No row below is authorized by this brief. "May need a later update" means a later, separate authorization would be required before the edit. Adoption hashes in `STAGE-Q-ADOPT-1`, `STAGE-Q-VER-1`, and `STAGE-Q-BRIEF-1` are not updated by any choice recorded here. A new adoption sentence is not drafted.

Finding-level `blocks`, `STAGE-Q-CLEAR-1` correlation, and the `STAGE-Q-SEV-1` predicate bullets do not need a wording change merely to record S-04 or S-06. `STAGE-Q-SEV-1` §3.2 cites the inspection-grant test by reference. It does not restate a window-level subject rule. An S-05 amendment of `STAGE-Q-PHRASE-1` changes which comments meet that test. The severity sentence can keep the citation.

### 7.1 S-04

| Choice    | Later document effect                                                                                                                                                                                                                                           | Later checker effect                                                                                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reading 1 | No required edit of `STAGE-Q-COUNT-1`. An optional clarification could state that the third §3 row does not constrain `capture-status`. §2 enums, §1 counting, and §4 non-proof sentences stay.                                                                 | No change to `isolation_compatible` for this cell. A later test `S04-PENDING-COMPLETE-PARTIAL` would expect compatible and not counting, and only under a separate authorization. |
| Reading 2 | `STAGE-Q-COUNT-1` §3 needs the explicit rejection and the scope named in §2.5 of this brief. §2 enums stay. The preservation sentence stays. §1 and §4 stay. §5's already-run rows stay a historical record until a later authorized run adds the pending case. | After the amendment, `isolation_compatible` would reject the named scope. Shared-spelling overwrite detection stays a separate check.                                             |
| DEFER     | No edit. The cell stays unsettled. The pending test stays without an expected result.                                                                                                                                                                           | No edit. Current acceptance of the cell, as Stage S read it, is not a decision for Reading 1.                                                                                     |

### 7.2 S-05

| Choice   | Later document effect                                                                                                                                                                                                                                                                                                                                                                          | Later checker effect                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Option A | No edit of `STAGE-Q-PHRASE-1`. `STAGE-Q-SEV-1` §3.2 keeps its current pointer.                                                                                                                                                                                                                                                                                                                 | No subject-scope change to `window_subject` or `inspect_window`. Recorded §6 expectations remain the current-rule expectations. |
| Option B | `STAGE-Q-PHRASE-1` §5 gains the same-sentence rule, including the existing exclusion of limited occurrences. §6 rows whose granting sentence already contains both markers, including `Q5-SYN-INSPECT`, `Q5-SYN-LATER-GRANT`, and `Q5-SYN-BUT`, can keep `GRANT` under that rule. A cross-sentence expected `NO-GRANT` is not in §6 today and would be added only under a later authorization. | After the amendment, `inspect_window` would require the subject and a qualifying phrase in the same sentence.                   |
| Option C | `STAGE-Q-PHRASE-1` §5, and §3 only if the new rule needs structure §3 does not define. No amendment is specified until the association text exists. §6 expected results for association cases cannot be set before that text.                                                                                                                                                                  | No change until the rule exists. A change before the text would invent the rule.                                                |
| DEFER    | No edit. §5 continues to state the window-level rule. Deferral does not select Option A as a new decision; the written rule simply remains the written rule, and the question stays open.                                                                                                                                                                                                      | No edit.                                                                                                                        |

### 7.3 S-06

| Choice        | Later document effect                                                                                                                                                                 | Later checker effect                                                                                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alternative 1 | No edit of `STAGE-Q-ENUM-1`. The anchor-count row stays first.                                                                                                                        | No requirement to add a review-token function. A later authorization could implement the current table. This brief does not give it. Implementing the table is new work, not a repair of a function that already returns the wrong token. |
| Alternative 2 | `STAGE-Q-ENUM-1` §4 order changes so the critical/high row is tested before the anchor-count row. §1's four tokens stay. `blocks` stays.                                              | A review-token function could be written only after the amendment. None exists now.                                                                                                                                                       |
| Alternative 3 | `STAGE-Q-ENUM-1` §4 narrows the inconclusive row so it matches only when the anchor count is short and no critical/high block exists. §1's four tokens stay. `blocks` stays.          | Same as Alternative 2: implement only after the amendment, in a function that does not exist today.                                                                                                                                       |
| Alternative 4 | `STAGE-Q-ENUM-1` §1 and §4 gain a new token or an explicit two-outcome rule. This brief does not name it. `blocks` need not change. Providers still do not issue review-level tokens. | No legal value to emit until the token or rule exists.                                                                                                                                                                                    |
| DEFER         | No edit. The current first-match order remains the text. Deferral does not select Alternative 1. The precedence question stays open.                                                  | No review-token function is added.                                                                                                                                                                                                        |

Across all three decisions, a later copy-complete sentence remains blocked until the chosen amendments, if any, are committed and independently verified. Stage S §10 states the verification conditions. This brief does not perform that verification and does not satisfy those conditions.

---

## 8. Decision record template

The Product Owner fills this section. No field below is filled on the Product Owner's behalf. Allowed values are listed so the record stays inside the options in this brief. A blank field means no decision has been recorded.

A recorded choice authorizes only what the scope field says. It does not adopt Stage Q, approve Decision 4, authorize a provider contact, authorize SQL EXEC or Census EXEC, create an anchor, disclose package bytes, change the small-cell boundary, or close CC-02, CC-06, or OQ-CENSUS-01, unless a future decision says so in a separate act. This template does not say so.

### 8.1 S-04

Allowed values: `Reading 1` / `Reading 2` / `DEFER`.

If the value is `Reading 2`, the scope field needs to say whether the rejection is the unsettled cell only or every `COMPLETE` plus `PARTIAL` pair. Section 2.5 records why that scope matters.

- **PO decision:**
- **Rationale:**
- **Date:**
- **Scope of authorization:**
- **Explicit exclusions:**

### 8.2 S-05

Allowed values: `Option A` / `Option B` / `Option C` / `DEFER`.

If the value is `Option C`, the rationale or scope field needs to contain the association rule. The letter C alone does not specify checker behavior.

- **PO decision:**
- **Rationale:**
- **Date:**
- **Scope of authorization:**
- **Explicit exclusions:**

### 8.3 S-06

Allowed values: `Alternative 1` / `Alternative 2` / `Alternative 3` / `Alternative 4` / `DEFER`.

If the value is `Alternative 4`, the scope field needs to identify the new review-level token, or the two-outcome rule, that a later amendment may write. This template does not supply that token.

- **PO decision:**
- **Rationale:**
- **Date:**
- **Scope of authorization:**
- **Explicit exclusions:**

---

## 9. What this brief does not do

This brief does not implement a correction, edit a Stage Q, Stage R, or Stage S file, edit the Decision Register, or edit the checker. It does not run the checker or any test. It does not execute SQL or the Census, connect to a database, contact a provider, disclose package bytes, or create a Package Anchor or an Evidence Anchor. It does not start a provider assessment, change the small-cell boundary, adopt Stage Q or Stage R, or close CC-02, CC-06, or OQ-CENSUS-01. It does not stage, commit, or push.

Decision 4 remains **NOT APPROVED**. Final authority remains with the Product Owner.
