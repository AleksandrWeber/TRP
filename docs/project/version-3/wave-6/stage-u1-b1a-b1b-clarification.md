# Stage U.1 — B1a / B1b Clarification

**Document ID:** `STAGE-U1-B1-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01
**Supplements:** `STAGE-U-ADD-1` §4. It does not edit that file.

This document splits the Option B formulation that Stage U called B1 into two proposals, B1a and B1b. Neither proposal is a current rule. Neither is a Product Owner decision. Option A and Option C are unchanged. Stage Q §3 remains as written until the Product Owner records a separate decision.

Decision 4 remains **NOT APPROVED**. This document does not authorize a checker change, a provider contact, package disclosure, SQL EXEC, or Census EXEC.

---

## 1. Why the split is needed

Stage U §4.3 defines B1 as same-sentence matching in which a header passes neither subject, nor negation, nor limiter to a bullet, and in which the §3 sentence on inherited negation is withdrawn. Stage U §6 item 5 then says the Product Owner still has to say whether that withdrawal is intended, because Stage T's Option B did not state it.

Those two statements leave one label, B1, covering two different rules:

- same-sentence matching that keeps the §3 negation inheritance;
- same-sentence matching that withdraws it.

Example 8 is the shape on which those rules disagree. This document names the first rule **B1a** and the second rule **B1b**. B1b is the text now written in Stage U §4.3. Naming it B1b does not adopt that text.

B2, Option A, Option C, S-04, and S-06 are outside this split.

---

## 2. Source inventory

Digests are SHA-256 of the working-tree bytes read for this document. Each digest matches the value supplied with the task. No source was replaced, and no conclusion below treats a different byte string as the same file.

| Path                                                                                     | SHA-256                                                            | Match   |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------- |
| `docs/project/version-3/wave-6/stage-u-stage-t-clarification-addendum.md`                | `9ffaf789dece76a52510bf728e720e0082256f635f1b3b04f0a3eee8f5409daf` | Matches |
| `docs/project/version-3/wave-6/stage-t-po-decision-brief-s04-s06.md`                     | `ea48edbe6fabfb5042d4bdb86b22eaa2a90599a4d1f9dd0d7a4f39455a634666` | Matches |
| `docs/project/version-3/wave-6/stage-q-inspection-grant-adversarial-tests.md`            | `0bd61a1749f0f9809e29e9fe2b8fceb60f53d6885fcdb3f29a070f79793a16f8` | Matches |
| `docs/project/version-3/wave-6/stage-q-enum-and-schema-validation-specification.md`      | `100343db2ff27953fa4a09c047bccc6bd8472b849b1b198e1cc745df3f48c609` | Matches |
| `docs/project/version-3/wave-6/stage-q-normative-severity-and-blocking-specification.md` | `7199a46aabbd4c55a2566b9fa9a790885637a133c255938dac36ffa283a8a242` | Matches |

`STAGE-Q-PHRASE-1` §§2–5 are the normative text used for the nine examples. `STAGE-Q-SEV-1` §3.2 is cited only for the HIGH consequence of a grant. `STAGE-Q-ENUM-1` contains the review-token table and does not define the inspection-grant test. The checker was not read again and was not executed. Example results below are readings of the quoted Stage U texts against §§2–5 and the two proposals. They are not new test runs.

The quoted illustrative windows are not rows in `STAGE-Q-PHRASE-1` §6, except that example 1 has the same wording as the recorded input of `Q5-SYN-INSPECT`.

---

## 3. The two proposals

A qualifying phrase occurrence is a phrase from §4 that is neither negated nor limited. A subject marker is `n < 5` with flexible whitespace, or a whole phrase `small cell`, `small cells`, or `unsuppressed counts`, as §5 states. A §3.1 list header is a body that ends with `:` and contains a negation word from §4.

### 3.1 B1a — same sentence, keep inherited negation

**Proposed rule, not current norm.**

1. The subject marker and a qualifying phrase occurrence must be in the same sentence.
2. Two ordinary sentences are not combined into a grant.
3. Two separate bullets are not combined into a grant.
4. A header and a bullet are not combined so that a subject in one and a phrase in the other become a grant.
5. The current `STAGE-Q-PHRASE-1` §3 rule is kept: a bullet under an open §3.1 list header inherits that header's negation. A sentence after the list does not.
6. A phrase in a bullet that inherits negation is not a qualifying phrase.
7. The §4 limiter rule is kept. Limiter inheritance from a header to a bullet is not added.
8. A limiter still applies only when it stands immediately before the phrase, with an optional article `a`, `an`, or `the`, as §4 states.

B1a changes the §5 association from the window to the sentence. It does not withdraw inherited negation.

### 3.2 B1b — same sentence, withdraw inherited negation

**Proposed rule, not current norm.** This is the rule written in Stage U §4.3. It is not a decision.

1. The subject marker and a qualifying phrase occurrence must be in the same sentence.
2. A header does not pass a subject marker to a bullet.
3. A header does not pass negation to a bullet.
4. A header does not pass a limiter to a bullet.
5. Two separate bullets are not combined.
6. Two ordinary sentences are not combined.
7. The current §3 rule that a bullet under an open list header inherits the header's negation is withdrawn.
8. The §4 limiter rule is kept. Limiter inheritance from a header to a bullet is not added.

B1b changes both the §5 association and the §3 inheritance sentence.

---

## 4. The nine Stage U examples

The texts are copied from Stage U §4.2. Option A is the current §5 window test, including the negation inheritance §3 already states. `Changes from A` compares each proposal with that current result.

Negation inheritance applies under current §3 only from a §3.1 header to a bullet under that header. A colon line with no negation word is not such a header. Limiter inheritance from a header is **`UNSPECIFIED`** in current §4. B1a and B1b both decline to add it. That decline is part of each proposal. It is not a new reading of current §4.

| #   | Comment window                                                                           | Option A   | B1a        | B1b        | Negation inherited                                                                         | Limiter inherited                                                                                                     | Why                                                                                                                                                                                      | Changes from A                                 |
| --- | ---------------------------------------------------------------------------------------- | ---------- | ---------- | ---------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | `-- Operators may inspect n < 5.`                                                        | `GRANT`    | `GRANT`    | `GRANT`    | No. There is no list header.                                                               | No limiter is present.                                                                                                | The one sentence contains `inspect` and `n < 5`. Neither proposal needs to join a second unit.                                                                                           | No                                             |
| 2   | `-- Counts for small cells:` / `-- - operators may inspect the rows.`                    | `GRANT`    | `NO-GRANT` | `NO-GRANT` | No. The colon line has no negation word, so it is not a §3.1 header.                       | No limiter is present. Subject inheritance is **`UNSPECIFIED`** under current §5 and is not added by either proposal. | The window has both markers, so Option A grants. The subject is in the colon line and `inspect` is in the bullet. Both proposals refuse to join those units.                             | Yes. Both become `NO-GRANT`.                   |
| 3   | `-- Operators may inspect:` / `-- - the floor is n < 5.`                                 | `GRANT`    | `NO-GRANT` | `NO-GRANT` | No. Not a §3.1 header.                                                                     | No limiter is present. Phrase inheritance from the colon line is **`UNSPECIFIED`** and is not added.                  | `inspect` is bounded by `:`. The subject is only in the bullet. Option A grants at window level. Both proposals keep the markers in different units.                                     | Yes. Both become `NO-GRANT`.                   |
| 4   | `-- Review notes:` / `-- - operators may inspect n < 5.`                                 | `GRANT`    | `GRANT`    | `GRANT`    | No. `Review notes:` contains no negation word. `not` and `no` do not match inside `notes`. | No limiter is present.                                                                                                | Both markers are already in the bullet sentence. The colon line is not needed.                                                                                                           | No                                             |
| 5   | `-- Review notes:` / `-- - operators may inspect the rows.` / `-- - the floor is n < 5.` | `GRANT`    | `NO-GRANT` | `NO-GRANT` | No. Not a §3.1 header.                                                                     | No limiter is present. Cross-bullet subject inheritance is **`UNSPECIFIED`** and is not added.                        | Option A sees both markers in one window. `inspect` is in the first bullet and `n < 5` is in the second. Both proposals refuse to join bullets.                                          | Yes. Both become `NO-GRANT`.                   |
| 6   | `-- The publication floor is n < 5.` / `-- Operators may inspect the dashboard.`         | `GRANT`    | `NO-GRANT` | `NO-GRANT` | No list, so no inherited negation.                                                         | No limiter is present.                                                                                                | §3.5 makes two sentences. Option A grants. Both proposals refuse to join ordinary sentences.                                                                                             | Yes. Both become `NO-GRANT`.                   |
| 7   | `-- Operators may inspect the dashboard.` / `-- The publication floor is n < 5.`         | `GRANT`    | `NO-GRANT` | `NO-GRANT` | No list.                                                                                   | No limiter is present.                                                                                                | Same split as example 6, with the markers swapped. This is the Stage T §3.2 cross-sentence shape.                                                                                        | Yes. Both become `NO-GRANT`.                   |
| 8   | `-- DO NOT:` / `-- - operators may inspect n < 5.`                                       | `NO-GRANT` | `NO-GRANT` | `GRANT`    | Yes under Option A and B1a. No under B1b.                                                  | No limiter is present. `DO NOT` is negation, not a §4 limiter.                                                        | See §5. The markers share the bullet. The results diverge only on inherited negation.                                                                                                    | B1a: no. B1b: yes, `NO-GRANT` becomes `GRANT`. |
| 9   | `-- Before any inspection:` / `-- - operators may inspect n < 5.`                        | `GRANT`    | `GRANT`    | `GRANT`    | No. The colon line has no negation word, so it is not a §3.1 header.                       | Current §4: **`UNSPECIFIED`**. B1a and B1b: not inherited.                                                            | Both markers are in the bullet. `inspect` does not match inside `inspection`. `before any` is not immediately before the bullet's `inspect`. Neither proposal copies the header limiter. | No, on the stated results.                     |

The nine rows were checked against the Stage U wording and against §§3–5. They match the logical matrix supplied with this task:

| Example | Option A   | B1a        | B1b        |
| ------- | ---------- | ---------- | ---------- |
| 1       | `GRANT`    | `GRANT`    | `GRANT`    |
| 2       | `GRANT`    | `NO-GRANT` | `NO-GRANT` |
| 3       | `GRANT`    | `NO-GRANT` | `NO-GRANT` |
| 4       | `GRANT`    | `GRANT`    | `GRANT`    |
| 5       | `GRANT`    | `NO-GRANT` | `NO-GRANT` |
| 6       | `GRANT`    | `NO-GRANT` | `NO-GRANT` |
| 7       | `GRANT`    | `NO-GRANT` | `NO-GRANT` |
| 8       | `NO-GRANT` | `NO-GRANT` | `GRANT`    |
| 9       | `GRANT`    | `GRANT`    | `GRANT`    |

No row was adjusted to force that matrix. The only example on which B1a and B1b differ is example 8.

Example 8 is not `Q5-SYN-AFTER-LIST`. That recorded row is a `DO NOT:` bullet followed by a separate inspect sentence, with expected result `GRANT`. §3 says a sentence after the list does not inherit the header's negation. B1a keeps that sentence. B1b withdraws inheritance for a bullet under the header; it does not, by itself, rewrite the separate rule about a sentence after the list, because that later sentence already does not inherit.

---

## 5. Example 8

The window is:

```text
-- DO NOT:
-- - operators may inspect n < 5.
```

`DO NOT:` ends with `:` and contains the negation words `do not` and `not`. It is a §3.1 list header. The bullet contains both the phrase `inspect` and the subject `n < 5`. No §4 limiter appears.

**Option A is `NO-GRANT`.** §5 requires the window subject and at least one phrase that is neither negated nor limited. The subject is present. §3 says a bullet under an open list header inherits the header's negation. The only phrase occurrence is that inherited negation, so it is not qualifying. The window fails the grant test. Stage U §4.2 records the same result, and §6 records inherited negation on the `DO NOT:` bullets at lines 90–91 as `NO-GRANT`.

**B1a is `NO-GRANT`.** The subject and the phrase already share the bullet sentence, so the same-sentence requirement is met. Clause 5 of B1a keeps the §3 inheritance. Clause 6 then says the inherited phrase is not qualifying. There is no other phrase. The window is not a grant. B1a's refusal to combine a header subject with a bullet phrase is not what decides this example: both markers are already in the bullet.

**B1b is `GRANT`.** Clause 7 withdraws the inheritance. The bullet sentence, read alone, is `operators may inspect n < 5.` It contains the subject and `inspect`. No negation word and no limiter stand in that sentence. Clause 3 says the header does not pass negation into the bullet. The same-sentence test therefore succeeds.

**The §3 sentence B1b changes** is this one: "A bullet under an open list header inherits the header's negation." B1b also has to state the consequence for the grant test, because §4 says a negated phrase is not a grant and §5 requires a phrase that is not negated. Withdrawing the inheritance sentence is what lets the bullet's `inspect` count as qualifying.

**Withdrawing that inheritance does not follow from same-sentence matching.** Same-sentence matching answers where the subject and the phrase must sit. Negation inheritance answers whether a phrase is negated. Example 8 already places both markers in one bullet sentence. A rule that only moves §5 from the window to the sentence leaves this window inside the same-sentence test and leaves the §3 negation in force. That is B1a, and it stays `NO-GRANT`. Reaching `GRANT` requires a second amendment, aimed at §3 rather than at §5. Stage T's Option B did not state that second amendment. Stage U §4.3 did. Stage U.1 keeps those as separate proposals.

`STAGE-Q-SEV-1` §3.2 says a comment or header that matches the inspection-grant test is HIGH when the CRITICAL predicate is `NOT-MET`. B1a leaves example 8 as `NO-GRANT`, so this window does not newly meet that bullet. B1b classifies the same window as `GRANT`, so the HIGH bullet could apply to it. That is a consequence of the classification, not a decision to accept the risk. The test still grants no permission to inspect, export, publish, or use unsuppressed `n < 5` values.

---

## 6. Limiters

Both proposals keep §4 as written.

- Limiter words remain `before any`, `without`, `absent`, and `until`.
- A limiter applies when it stands immediately before the phrase, with an optional article.
- A limited occurrence is not a grant.
- The limiter does not negate a later sentence.
- Neither proposal adds header-to-bullet limiter inheritance.
- Neither proposal adds a new association rule, a new exception, or a wider definition of list header. The widened header in Stage U §4.4 belongs to B2, which this document does not adopt and does not amend.

Example 9 contains `before any` in `-- Before any inspection:` and `inspect` in the following bullet. `before any` is not immediately before that `inspect`. Current §4 does not say whether a limiter in a non-§3.1 colon line inherits into the bullet. That inheritance remains **`UNSPECIFIED`**. B1a clause 7 and B1b clauses 4 and 8 say the proposals do not add it. Under those clauses the bullet sentence is not limited, and both proposals return `GRANT` because the bullet itself contains `inspect` and `n < 5`. That `GRANT` is a consequence of refusing to add inheritance. It is not a claim that current §4 already settled the inheritance question.

No other example in §4 contains a limiter in the header or immediately before the phrase. Examples 1 through 8 therefore do not test limiter inheritance.

---

## 7. Effect on current documents

| Document / rule                             | B1a                                   | B1b                                   |
| ------------------------------------------- | ------------------------------------- | ------------------------------------- |
| Stage Q §5 window-level subject/phrase test | Amendment required                    | Amendment required                    |
| Stage Q §3 inherited negation               | Kept                                  | Withdrawn                             |
| Stage Q §4 limiter                          | No change                             | No change                             |
| Option A                                    | Unchanged as the current written rule | Unchanged as the current written rule |
| Option C                                    | Not defined                           | Not defined                           |
| Checker                                     | No change                             | No change                             |

The checker cell means this document does not edit `stage-q-validation-checks.py`, and a choice in §9 is not permission to edit it. The current checker, as Stage U described it without running it, still applies the window-level subject test. A later implementation of B1a or B1b would require a separate authorization. `STAGE-Q-ENUM-1` has no inspection-grant rule to amend. `STAGE-Q-SEV-1` §3.2 can keep its citation of `STAGE-Q-PHRASE-1`; the set of comments that meet the test would follow whichever text the Product Owner later adopts.

Both alternatives require their own Product Owner decision and, if one is accepted, a later controlled amendment of the normative text. Acceptance in §9 is a direction for that amendment. It is not the amendment.

---

## 8. Comparison without a selection

B1a keeps the current protection against a false grant under a negating header. In example 8 the words `DO NOT:` remain able to negate `inspect` in the bullet, while examples 2, 3, 5, 6, and 7 stop being grants because the markers are not in one sentence. The false-negative cost is a potentially legitimate grant whose subject and phrase were written in different sentences or different bullets.

B1b uses one local sentence test and does not consult the header for negation. That model is smaller. Its false-positive cost is example 8: a bullet under `DO NOT:` becomes `GRANT` even though the header forbids the listed action. That grant can satisfy the HIGH inspection-grant bullet in `STAGE-Q-SEV-1` §3.2 when the CRITICAL predicate is `NOT-MET`.

This document does not rank those risks and does not select B1a or B1b. The tolerable false-positive and false-negative balance is a Product Owner judgment. Until it is recorded, §3 inheritance and the §5 window test remain the written rules.

---

## 9. Decision record template

The Product Owner fills this section. No field below is filled on the Product Owner's behalf.

Choosing `B1a` or `B1b` selects a normative direction for a later amendment. It does not authorize an edit to the checker, to `STAGE-Q-PHRASE-1`, or to any other file. Implementation needs a separate authorization. The choice does not adopt Stage Q, approve Decision 4, authorize provider contact, disclose package bytes, authorize SQL EXEC or Census EXEC, create an anchor, change the small-cell boundary, or close CC-02, CC-06, or OQ-CENSUS-01.

**S-05 — Option B refinement**

Allowed values: `B1a` / `B1b` / `DEFER`.

- **PO decision:**
- **Rationale:**
- **Date:**
- **Scope:**
- **Explicit exclusions:**

---

## 10. What this document does not do

This document does not edit Stage U, Stage T, Stage S, or any Stage Q file. It does not edit the checker or create a fixture. It does not run the checker, a test, or SQL. It does not edit the Decision Register, draft an adoption sentence, or choose B1a or B1b. It does not change Option A, Option C, or B2. It does not stage, commit, or push.

Decision 4 remains **NOT APPROVED**. Final authority remains with the Product Owner.
