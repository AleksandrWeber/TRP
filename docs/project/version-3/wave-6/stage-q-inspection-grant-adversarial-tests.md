# Stage Q — Inspection-Grant Test and Adversarial Cases

**Document ID:** `STAGE-Q-PHRASE-1`
**Schema version:** `Q.1-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This file is the proposed inspection-grant test. It replaces the window-wide negation rule in `STAGE-O-SEV-1` §6. A match is a text classification. It grants no permission to inspect, export, publish, or use unsuppressed `n < 5` values. The SQL candidate was read as text and was not executed.

The reviewer script `docs/project/version-3/wave-6/stage-q-validation-checks.py` implements this section. The script is evidence of the run. If the script and this section diverge, this section controls.

---

## 1. Why the Stage O rule changed

`STAGE-O-SEV-1` §6 negates every later phrase in the maximal comment window when any earlier negation word appears. A later sentence that states its own permission can be hidden by an unrelated earlier prohibition. This file keeps whole-phrase matching and limits negation to the sentence, plus a bullet list opened by a negation header.

## 2. Window

A window is the longest run of consecutive lines matching `^\s*--`. A blank line ends the run. A line that is not a comment ends the run. A one-line window occurs when the neighboring lines are not comment lines.

The body of a line is the text after `^\s*--`, with one leading space removed when that space is present.

## 3. Sentences and lists

1. A list header is a body that ends with `:` and contains a negation word from §4. It opens an inherited-negation list.
2. A bullet is a body whose left-trimmed text starts with `- `.
3. Later lines continue that bullet only when their body starts with whitespace. A following body that does not start with whitespace closes the list.
4. Non-bullet lines join with a space until a line ends with `.`, `!`, `?`, or `;`.
5. Those joined units split into sentences on `.`, `!`, `?`, or `;` followed by whitespace, and on the comma-form `, but `.

Negation does not cross a sentence boundary. A bullet under an open list header inherits the header's negation. A sentence after the list does not.

## 4. Words

Matching is ASCII case-insensitive. A boundary is the start or end of the sentence, or a character outside `A-Z`, `a-z`, and `0-9`.

Negation words, applied longest first: `does not`, `do not`, `must not`, `blocked`, `not`, `no`.

A negation word earlier in the same sentence negates a later phrase in that sentence. A negated phrase is not a grant.

Limiter words immediately before a phrase, with an optional article `a`, `an`, or `the`, are `before any`, `without`, `absent`, and `until`. A limited occurrence is not a grant. The limiter does not negate a later sentence.

Phrases: `inspection of`, `read the values`, `review the values`, `use the values`, `copy the counts`, `look at`, `examine`, `inspect`, `export`, `publish`.

`publish` does not match `published` or `publication`.

## 5. Grant

The window refers to the subject when it contains `n < 5` with flexible whitespace, or a whole phrase `small cell`, `small cells`, or `unsuppressed counts`.

The test is met only when the window has that subject and at least one phrase occurrence is neither negated nor limited. Any failed row means the window is not a grant. Emission or retention wording is not, by itself, a grant. A grant that is not also CRITICAL is HIGH under `STAGE-Q-SEV-1` §3.2. This test is not a runtime result.

## 6. Adversarial results

The script was run against the SQL candidate bytes and against synthetic windows. Expected and actual results matched.

| Test                    | Input                                                              | Expected   | Actual     |
| ----------------------- | ------------------------------------------------------------------ | ---------- | ---------- |
| `Q5-L40-PUBLISH`        | SQL line 40, phrase `publish`                                      | `NO-HIT`   | `NO-HIT`   |
| `Q5-L40-PUBLISHED-WORD` | SQL line 40, word `published`                                      | `HIT`      | `HIT`      |
| `Q5-L36-PHRASE`         | SQL line 36 against the phrase list                                | `NO-HIT`   | `NO-HIT`   |
| `Q5-L182-PHRASE`        | SQL line 182 against the phrase list                               | `NO-HIT`   | `NO-HIT`   |
| `Q5-L184-PUBLISH`       | SQL line 184, phrase `publish`                                     | `HIT`      | `HIT`      |
| `Q5-L184-LIMITED`       | Line 184 prefix `before any`                                       | `LIMITED`  | `LIMITED`  |
| `Q5-L40-WINDOW`         | Window containing line 40                                          | `NO-GRANT` | `NO-GRANT` |
| `Q5-L90-WINDOW`         | Window containing the `DO NOT:` list at line 84 and lines 90–91    | `NO-GRANT` | `NO-GRANT` |
| `Q5-L182-WINDOW`        | Window containing lines 182–184                                    | `NO-GRANT` | `NO-GRANT` |
| `Q5-L264-WINDOW`        | Window containing line 264                                         | `NO-GRANT` | `NO-GRANT` |
| `Q5-SYN-INSPECT`        | `operators may inspect n < 5`                                      | `GRANT`    | `GRANT`    |
| `Q5-SYN-NEGATED`        | `do not inspect n < 5`                                             | `NO-GRANT` | `NO-GRANT` |
| `Q5-SYN-LATER-GRANT`    | `Do not publish n < 5.` followed by `Operators may inspect n < 5.` | `GRANT`    | `GRANT`    |
| `Q5-SYN-AFTER-LIST`     | A `DO NOT:` bullet, then a separate inspect sentence               | `GRANT`    | `GRANT`    |
| `Q5-SYN-SAME-CLAUSE`    | `Do not inspect n < 5 and do not publish.`                         | `NO-GRANT` | `NO-GRANT` |
| `Q5-SYN-BUT`            | `Do not publish n < 5, but operators may inspect n < 5.`           | `GRANT`    | `GRANT`    |
| `Q5-SYN-PUBLICATION`    | `publication of n < 5`                                             | `NO-GRANT` | `NO-GRANT` |
| `Q5-SYN-BEFORE-ANY`     | `binding before any publish of n < 5`                              | `NO-GRANT` | `NO-GRANT` |
| `Q5-SYN-MAY-PUBLISH`    | `operators may publish n < 5`                                      | `GRANT`    | `GRANT`    |

Line 90 `Publish` and `export` sit in a bullet under `DO NOT:` and are inherited negations. Line 264 `export` is negated by `NOT` in the same sentence. Line 184 contains whole-word `publish` after `before any`, so that occurrence is limited and is not a grant. All of these results are `PASS`.

## 7. What this file does not do

It does not modify the SQL candidate, execute SQL, or authorize inspection.
