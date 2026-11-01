# Stage Q — Normative Severity and Blocking Specification

**Document ID:** `STAGE-Q-SEV-1`
**Schema:** `trp.wave6.cc02.severity-blocking`
**Schema version:** `Q.1-1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO REVIEW ONLY`
**Creation date:** 2026-11-01

This file is the proposed normative severity text for a later Decision 4 review. It does not approve Decision 4. It does not edit Stage M or Stage O. If a later decision adopts this file by the hash named in `STAGE-Q-ADOPT-1`, this file is the severity predicate source. `STAGE-M-SEV-1` and `STAGE-O-SEV-1` then remain historical.

The only `blocks` function is `STAGE-Q-ENUM-1` §4. The only clearing bundle is `STAGE-Q-CLEAR-1`. The only inspection-grant test is `STAGE-Q-PHRASE-1`.

The SQL candidate `fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c` is not modified and was not executed.

---

## 1. Four records

These records stay separate. A value in one does not fill another.

| Record                     | Field                                                                       | Who may write it                                            | Meaning                                                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Provider-reported severity | `original-provider-severity`                                                | Copied from the provider                                    | Immutable label. Not the block                                                                                                           |
| Provider wording           | `original-provider-wording`                                                 | Copied from the provider                                    | Immutable text                                                                                                                           |
| Working severity           | `working-severity`                                                          | Product Owner, or a Decision 5 adjudicator after Decision 5 | Human severity. Decision 5 is **NOT DECIDED**. Until then the only legal stored value outside a complete clearing bundle is `UNASSIGNED` |
| Predicate status           | `critical-predicate`, `high-predicate`, `medium-predicate`, `low-predicate` | Same human authority                                        | Whether that level's predicate text is met. Not an adjudication and not a severity                                                       |
| Adjudication status        | `adjudication-status`                                                       | Same human authority                                        | Lifecycle of the human decision. Not a predicate and not a review-level outcome                                                          |
| Blocking status            | `predicate-block`                                                           | Derived by `STAGE-Q-ENUM-1` §4                              | `BLOCKING` or `NOT-BLOCKING`. An input value cannot override the function                                                                |

No provider adjudicates or clears its own finding. Copying provider retraction text does not change `adjudication-status` and does not change `predicate-block`.

## 2. Source of the predicate text

The four predicate definitions in §3 are reproduced from `STAGE-M-SEV-1` §7.1 through §7.4, file `docs/project/version-3/wave-6/stage-m-severity-and-blocking-semantics-proposal.md`, SHA-256 `ae2ddc759c91838aa45fcf5bd92bda1d37ac50e29f57819deb4b5c836665c8cc`. That file is not adopted. The bullets below are the successor text.

| Source                                                                  | Successor | Difference                                                                                                |
| ----------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| §7.1 CRITICAL bullets                                                   | §3.1      | No change to the five outcomes                                                                            |
| §7.2 HIGH bullets                                                       | §3.2      | The inspection-grant bullet now uses `STAGE-Q-PHRASE-1`. The other HIGH outcomes are unchanged            |
| §7.3 MEDIUM                                                             | §3.3      | The grant test is `STAGE-Q-PHRASE-1`. The MEDIUM condition is otherwise unchanged                         |
| §7.4 LOW                                                                | §3.4      | No change                                                                                                 |
| §8 complementary sentence that calls complementary suppression **OPEN** | §5        | The obligation and the algorithm are split. This split does not change the CRITICAL reconstruction bullet |

`STAGE-O-SEV-1` pointed at `STAGE-M-SEV-1` §7.1 through §7.4 while `STAGE-O-ADOPT-1` excluded that file from the normative set. This file removes that conflict by carrying the predicate text itself.

CRITICAL and HIGH are not cleared by a MEDIUM or LOW residual. Unresolved CRITICAL and unresolved HIGH remain blocking. Those rules are enforced by `STAGE-Q-ENUM-1` §4, not by renaming a predicate.

## 3. Level predicates

A predicate is `MET` only when the human records that the text in this section is true of the frozen package bytes. `NOT-MET` records that the same text is false of that package. `NOT-DETERMINED` means the human has not finished that predicate.

### 3.1 CRITICAL

The predicate is `MET` when the frozen package bytes, read as required by the package, do any of the following:

- result output, export, or `COPY` of raw Vault IDs, reversible identifier derivatives, or `security_audit_records.payload` content;
- a publication path for a relevant cell with `n < 5`;
- reconstruction of a suppressed cell from published outputs;
- any read, parse, filter, or inspection of P3 payload content, including json or jsonb, even when the output is only an aggregate;
- removal or weakening of the whole-file fail-closed guard so census statements run, or a path that commits or presents a partial or mixed-snapshot result as the successful census.

### 3.2 HIGH

The predicate is `MET` when the package does any of the following and the CRITICAL predicate is `NOT-MET`:

- an incorrect join, omission, duplication, filter, or metric that changes P1, P2, or integrity aggregates and still does not publish suppressed cells or identifiers;
- any `SELECT`, `JOIN`, or `EXISTS` against `security_audit_records` that does not read or project payload content;
- a comment or header that matches the inspection-grant test in `STAGE-Q-PHRASE-1`;
- a comment or header that instructs fragment execution or says the guard makes fragments safe;
- a transaction that is not `REPEATABLE READ` and `READ ONLY`, while the file still rolls back and does not present a partial result as the successful census;
- a contradiction of an approved D-GAP-01 through D-GAP-11 semantic that changes results.

### 3.3 MEDIUM

The predicate is `MET` when a comment or header contradicts an approved boundary, the executable statements match that boundary, the inspection-grant test in `STAGE-Q-PHRASE-1` is not met, and the comment does not instruct publication, payload access, or fragment execution.

A comment that cites canvas revision `4e7bf3c9…` as the current canvas, while the executable SQL is unchanged, is `MEDIUM`. A note that misstates `k=5` while the publication rule in the same package remains correct and no publication path exists is `MEDIUM`.

### 3.4 LOW

The predicate is `MET` only for naming, formatting, or a comment typo that does not change an exclusion, a suppression rule, or an inspection boundary. If any higher predicate is `MET`, `LOW` is not the working severity.

## 4. What cannot clear a block

A confirmed CRITICAL or HIGH predicate on this package hash stays blocking. A MEDIUM or LOW residual does not clear it. A plan to edit the SQL does not clear it. A byte change is a new candidate and a new review. `SUPERSEDED` on the old hash does not make the old review `PASS WITH OBSERVATIONS`. `STAGE-Q-ENUM-1` returns `BLOCKING` for stored `SUPERSEDED`. That early return is a fail-closed strengthening of `STAGE-O-SEV-1` §4, which did not return before the predicate checks for `SUPERSEDED`.

`PASS WITH OBSERVATIONS` does not satisfy CC-02. Providers do not issue review-level tokens.

## 5. Suppression boundary

Primary suppression with `k=5` for every relevant published cell with `n < 5` is the binding publication rule restated here. The current Option C canvas at the path below, SHA-256 `c70f45dcfbc74f55765bd682caa6ebff551673cf06120e76d9222251a0680c2e`, section 10, states that primary rule as binding and states complementary suppression as mandatory whenever published totals, differences, or intersections could reconstruct a suppressed value.

The frozen Design Content Baseline cited as `7714f95b8202771dfa1835d279983fafef9505af5a678f12344bdc79f1ca0ac7` was not present as a file during this stage. Those bytes were not re-hashed. This section does not treat the current canvas as a substitute for that frozen baseline.

Complementary suppression, as that obligation, is not an unresolved question. `STAGE-O-SEV-1` §6 called complementary suppression an open question. That sentence is superseded.

Still **OPEN**, and not decided here:

- the specific complementary-suppression algorithm and its implementation;
- validation of an actual publication-ready procedure.

This file invents no algorithm and claims no such validation. It opens no publication path. It grants no inspection, export, publication, or evidentiary use of unsuppressed `n < 5` values. The operational small-cell boundary remains **DEFERRED / NOT GRANTED** under `STAGE-Q-AUTH-1`.

## 6. What this file does not do

It does not approve Decision 4, decide Decision 5, confirm a register entry, execute SQL, execute the Census, or contact a provider.
