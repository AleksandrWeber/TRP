# Stage K — Severity Taxonomy Proposal

**Document ID:** `STAGE-K-SEV-1`
**Version:** `K.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`
**Creation date:** 2026-11-01

**Hash record:** The SHA-256 of this file is recorded in `docs/project/version-3/wave-6/stage-k-d4-blocker-resolution-and-po-review-brief.md`. This file does not embed its own digest.

This document is a proposal. It does not approve Decision 4, adopt Stage H, adopt Stage I.11–I.13, or change the Decision Register.

**Sources:** recovered Stage I.8 assistant text, transcript `57d05bb8-80b9-4bf5-a312-9f996959a547`, JSONL line 42, SHA-256 `a92c0a24c070d5e922654990a9b41a5d389dc3daeb8c83dd2a8330d6ebef3b82`, §§5–6; recovered Stage I.9 assistant text, same transcript, JSONL line 45, SHA-256 `96edf39e57ad1d43e9ea45a60e02749aa96dcf29e87ec4ea06bbf0cc8fa8ace6`, §4; Stage H §4.4; Stage J brief §4.6. Provenance limits are in `stage-k-stage-i8-i10-provenance-report.md`. SQL content was not read for this proposal. Inclusion examples are carried from the recovered Stage I.8 text about the already bound candidate's recorded boundaries.

---

## 1. What severity is

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

Severity classifies one finding. It is the consequence if the described defect is present in the bound SQL candidate `fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c` or in the reading of that candidate required by the frozen package.

Severity is not:

- an assessment outcome;
- evidence completeness;
- protocol execution status;
- a final governance disposition;
- provider confidence;
- the number of providers who reported the finding;
- a score.

No numerical risk score, probability-impact product, provider vote, or majority-severity rule is proposed. Any such mechanism would be a separate proposal and is not part of this taxonomy.

Canonical working tokens are `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`. Recovered Stage I.8 and Stage I.9 text used the spellings `Medium` and `Low`. Those historical spellings remain valid original provider labels. They are not rewritten. A human working assignment uses the canonical uppercase token.

## 2. How labels are preserved

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

Each provider may propose a label. That label and the provider's rationale are copied into `original-provider-severity` and are never edited.

Working severity is a different field. Only the Product Owner, or a human adjudicator designated later under Decision 5, may assign it. Decision 5 is **NOT DECIDED**. Until that designation, no person is authorized by this proposal to write working severity. AI providers and Cursor do not assign it, do not close findings, and do not issue the review-level outcome.

Until a human records whether the predicate is met, a provider-proposed `CRITICAL` or `HIGH` blocks `PASS WITH OBSERVATIONS`. That hold does not rename the provider label as the working severity. Silence or disagreement from another provider does not lower the label and is not evidence that the predicate is absent.

A finding is a false positive only when the adjudicator records `FALSE POSITIVE — PREDICATE NOT MET`, a factual rationale, and a precise reference to bytes in the frozen package. The original label stays.

Risk acceptance does not erase a finding, does not change its label, does not assign a lower working severity, and does not produce `PASS WITH OBSERVATIONS`.

A confirmed `CRITICAL` or `HIGH` defect in this package hash is not cleared by a plan to edit the SQL. A byte change is a new candidate and a new review.

Downgrade is not automatic. The adjudicator does not assign a lower working token when the higher predicate is met. No provider and no Cursor process may downgrade a finding.

## 3. Level definitions

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

### 3.1 CRITICAL

**Purpose.** Mark a defect whose presence would expose prohibited or publication-suppressed data, would read P3 payload content, or would allow an incomplete, mixed-snapshot, or fail-open run to be treated as a successful census.

**Classification criteria.** The predicate is met when the frozen package bytes, read as required by the package, do any of the following:

- result output, export, or `COPY` of raw Vault IDs, reversible identifier derivatives, or `security_audit_records.payload` content;
- a publication path under which a relevant cell with `n < 5` is published;
- reconstruction of a suppressed cell from published outputs;
- any read, parse, filter, or inspection of P3 payload content, including json or jsonb investigation, even if the output is only an aggregate;
- removal or weakening of the whole-file fail-closed guard so census statements run, or a path that commits or presents a partial or mixed-snapshot result as the successful census.

**Inclusion examples.** A `SELECT` of `security_audit_records.payload`. A publication query that emits cells with `n < 5`. An identifier column in a result set. Deletion of the unconditional guard so a later statement's result can be taken as the census.

**Exclusions.** Operator-held emission of unsuppressed aggregate `n`, including `n < 5`, in the diagnostic shape already recorded, with no publication path and no wording that grants inspection. A comment that only records the P3 exclusion and does not read payload. Restating the documented fragment-bypass limitation without instructing that bypass.

**Required evidence.** A package reference that identifies the bytes. The provider's original wording is retained. Working assignment cites those bytes.

**Required disposition.** The row remains. While unresolved, the review-level outcome cannot be `PASS WITH OBSERVATIONS`.

**Blocks `PASS WITH OBSERVATIONS`:** yes, while unresolved.

**Human disposition required:** yes, to determine whether the predicate is met. This proposal does not designate that person.

**Disagreement:** does not change the classification and does not lower the label.

**Downgrade:** not authorized when the predicate is met. A false-positive record is not a downgrade.

### 3.2 HIGH

**Purpose.** Mark a defect that would materially misstate in-scope aggregates, break snapshot consistency of a still-rolled-back read, or bring P3 into the census without reading payload content, and that would not itself publish prohibited values or present a partial run as success.

**Classification criteria.** The predicate is met when the package does any of the following and does not meet a `CRITICAL` predicate:

- an incorrect join, omission, duplication, filter, or metric that changes P1, P2, or integrity aggregates and still does not publish suppressed cells or identifiers;
- any `SELECT`, `JOIN`, or `EXISTS` against `security_audit_records` that does not read or project payload content;
- a required reading that treats unsuppressed `n < 5` emission as permission to inspect those values;
- a comment or header that instructs fragment execution or says the guard makes fragments safe;
- a transaction that is not `REPEATABLE READ` and `READ ONLY`, while the file still rolls back and does not present a partial result as the successful census;
- a contradiction of an approved D-GAP-01 through D-GAP-11 semantic that changes results.

**Inclusion examples.** A join that double-counts P2. A census aggregate that includes a count of `security_audit_records` rows while payload is untouched. A header that says operators may inspect `n < 5`. A `READ COMMITTED` setting on a read-only rolled-back script.

**Exclusions.** P3 named only inside a correct exclusion statement. Emission of operator-held `n < 5` consistent with the recorded diagnostic boundary. The documented fragment-bypass limitation stated accurately. Wording defects that cannot change results, disclosure, or execution safety.

**Required evidence.** Same as `CRITICAL`.

**Required disposition.** Same blocking rule as `CRITICAL`. The original label stays.

**Blocks `PASS WITH OBSERVATIONS`:** yes, while unresolved.

**Human disposition required:** yes, for the predicate determination.

**Disagreement:** does not change the classification.

**Downgrade:** not authorized when the predicate is met.

### 3.3 MEDIUM

**Purpose.** Mark a defect that can mislead a reader of comments, headers, or governance wording and does not change computed aggregates, disclosure boundaries, snapshot consistency, or execution safety when the executable text is followed.

**Classification criteria.** The predicate is met when a comment or header contradicts an approved boundary while the executable statements match that boundary, and the comment is not an instruction to inspect, publish, read payload, or bypass the guard.

**Inclusion examples.** A comment that cites canvas revision `4e7bf3c9…` as current while the executable SQL is unchanged. A note that describes `k=5` loosely where the publication rule in the same package is still stated correctly and no publication path exists.

**Exclusions.** Wording that grants inspection, publication, payload access, or fragment execution. Purely editorial typos. Accepted emission and exclusion comments.

**Required evidence.** The comment or header bytes and the executable bytes they are compared with.

**Required disposition.** Record a disposition and a rationale: accept as residual, or mark for a later documentation correction. An undispositioned `MEDIUM` means the human step is unfinished, so `PASS WITH OBSERVATIONS` is not available. After a recorded disposition, `MEDIUM` does not by itself block.

**Blocks `PASS WITH OBSERVATIONS`:** no, after a recorded disposition. Yes, while the human disposition is missing.

**Human disposition required:** yes.

**Disagreement:** does not itself raise or lower the class. The predicate controls.

**Downgrade:** not authorized when a higher predicate is met.

### 3.4 LOW

**Purpose.** Mark an editorial or clarity defect with no effect on results, disclosure, snapshot consistency, execution safety, or the required reading of a binding gate.

**Classification criteria.** The predicate is met only for naming, formatting, and non-semantic commentary.

**Inclusion examples.** An inconsistent alias. A comment typo that does not change the exclusion or suppression rule.

**Exclusions.** Any defect that meets `MEDIUM`, `HIGH`, or `CRITICAL`.

**Required evidence.** The editorial bytes.

**Required disposition.** Same as `MEDIUM`.

**Blocks `PASS WITH OBSERVATIONS`:** no, after a recorded disposition. Yes, while the human disposition is missing.

**Human disposition required:** yes.

**Disagreement:** does not itself change the class.

**Downgrade:** not applicable below `LOW`. A higher predicate is not assigned `LOW`.

## 4. Accepted behavior that is not a finding

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

The following are not findings under this proposal, matching the recovered Stage I.8 §5.1 boundary:

- operator-held emission of unsuppressed `n`, including `n < 5`, with inspection still deferred and publication absent;
- exclusion comments that correctly say P3 is not read;
- a restatement of the already documented fragment-bypass limitation.

AR-03 stays the already accepted non-blocking observation. This taxonomy does not reopen it.

## 5. Review-level outcomes are not severities

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

The review-level tokens remain `INCONCLUSIVE / NOT COMPLETED`, `BLOCKED — UNRESOLVED CRITICAL/HIGH`, and `PASS WITH OBSERVATIONS`. They are assigned by the designated human only after three quorum-counting Evidence Anchors exist, the discrepancy matrix is valid, and every provider-proposed `CRITICAL` or `HIGH` row has been adjudicated. No provider response assigns those tokens. Plain `PASS` is not a CC-02 satisfaction route.

| State                                                                                                                                                                           | Review-level token                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Fewer than three counting Evidence Anchors, or a required attempt is non-counting                                                                                               | `INCONCLUSIVE / NOT COMPLETED`                                              |
| Three counting anchors, and any `CRITICAL` or `HIGH` predicate is unmet as a determination or is met                                                                            | `BLOCKED — UNRESOLVED CRITICAL/HIGH` while any such row is unresolved       |
| Three counting anchors, every `CRITICAL` and `HIGH` row is `FALSE POSITIVE — PREDICATE NOT MET` or has no such row, and every `MEDIUM` and `LOW` row has a recorded disposition | `PASS WITH OBSERVATIONS` may be proposed to a later evidence-acceptance act |

`PASS WITH OBSERVATIONS` in this table is a proposed review token. It does not satisfy CC-02. CC-02 evidence remains **INSUFFICIENT EVIDENCE** until a separate acceptance act.

## 6. Unresolved

Working severity cannot be written until Decision 5 designates the human. This proposal defines the predicates that person would apply. It does not make the designation.
