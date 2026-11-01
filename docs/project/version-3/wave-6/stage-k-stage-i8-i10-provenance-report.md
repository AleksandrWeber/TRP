# Stage K — Stage I.8–I.10 Provenance Report

**Document ID:** `STAGE-K-PROV-1`
**Version:** `K.1`
**Status:** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`
**Creation date:** 2026-11-01

**Hash record:** The SHA-256 of this file is recorded in `docs/project/version-3/wave-6/stage-k-d4-blocker-resolution-and-po-review-brief.md`. This file does not embed its own digest.

This report records recovery. It does not adopt Stage I.8, Stage I.9, or Stage I.10. It does not invent an approval sentence that was not in the recovered text.

---

## 1. Recovery method

The repository has no file named as Stage I.8, Stage I.9, or Stage I.10. Stage I.11 states that those stages are conversation texts.

Search of Cursor agent transcripts under the project transcript directory found one session that contains the assistant replies:

`/Users/oleksandrsvacko/.cursor/projects/Users-oleksandrsvacko-Desktop-myProjects-trp/agent-transcripts/57d05bb8-80b9-4bf5-a312-9f996959a547/57d05bb8-80b9-4bf5-a312-9f996959a547.jsonl`

Recovery method: parse each JSONL record, keep `role` `assistant` text parts, and ignore tool-call records. SHA-256 is of the UTF-8 text of those text parts joined by a newline. The transcript file itself was also hashed. No git object contains these replies.

| Item                       | JSONL line  | Role      | UTF-8 bytes | SHA-256                                                            | Lines                |
| -------------------------- | ----------- | --------- | ----------- | ------------------------------------------------------------------ | -------------------- |
| Stage I.8 assistant reply  | 42          | assistant | 40,674      | `a92c0a24c070d5e922654990a9b41a5d389dc3daeb8c83dd2a8330d6ebef3b82` | 521                  |
| Stage I.9 assistant reply  | 45          | assistant | 31,143      | `96edf39e57ad1d43e9ea45a60e02749aa96dcf29e87ec4ea06bbf0cc8fa8ace6` | 345                  |
| Stage I.10 assistant reply | 48          | assistant | 26,882      | `55025b99fc15fd0df270d1acdee2d21a790a759f1d591def2b8d1a5319efcee2` | 402                  |
| Transcript file            | entire file | mixed     | 569,211     | `23fb59afb97b657c7df804afa8bad1890a1a18e389523f438997ac7b0a9491a1` | not a prose document |

User prompts that requested those stages are JSONL lines 38, 43, and 46. They are task instructions, not the proposal text.

## 2. Integrity limitations

These bytes are a local session log outside the git repository. They are not signed. A later edit of the transcript would change the hashes. Tool outputs and intermediate tool-only turns are not part of the three text hashes. The Stage I.10 user turns at JSONL lines 49 and 51 paste a copy of the Stage I.10 reply back into the conversation. That paste is user content. The recovered proposal used here is the assistant text at line 48.

This report does not reproduce all 521, 345, and 402 lines. The hashes and line numbers are the recovery identity. Sections below quote the ranges Stage K relies on. Text outside those ranges was recovered and was not reclassified as a new Stage K rule.

Stage I.11, which is a repository file, later replaced path, manifest, capture, and anchor portions of Stage I.10. Stage I.10 is historical conversation evidence for those topics. It is not the current package grammar.

No original Stage I.8, I.9, or I.10 approval sentence was fabricated. The sentences below are copied from the recovered replies. They were proposals. They were not Product Owner decisions.

## 3. Recovered verbatim ranges

### 3.1 Stage I.8 §13 approval sentence

From the line 42 text, section "Exact narrowed Decision 4 approval wording":

> I approve only the Stage I.8 Decision 4 remediation text identified below, as the assessment-protocol candidate for a later commencement decision. The approved object is: the severity taxonomy and classification rules; the outcome tokens `INCONCLUSIVE / NOT COMPLETED`, `BLOCKED — UNRESOLVED CRITICAL/HIGH`, and `PASS WITH OBSERVATIONS`; the complete-assessment definition and failure table; the seal artifact and verification method; the isolation and three-seal quorum procedure; the replacement rule that requires a separate Product Owner decision and forbids N−1 and silent substitution; the discrepancy-matrix schema; and the frozen-package manifest specification. I do not approve Stage H §4.1, its unselected roster table, or any statement in §4.1 that the third provider is unselected. D3 remains the sole roster-identity decision. Google privacy remains deferred. Google is not eligible to receive a package. This approval does not contact any provider, create any account, disclose any package, freeze a package, commence a review, designate an adjudicator, amend operative CC-02, synchronize criteria documents, re-adopt CC-01…CC-06, satisfy CC-02, perform CC-06, close OQ-CENSUS-01, or authorize SQL EXEC or Census EXEC.

That sentence is a proposed wording inside a conversation reply. It is not an executed approval.

### 3.2 Stage I.9 §11 approval sentence

From the line 45 text:

> I approve only the Stage I.8 Decision 4 remediation text as amended by the Stage I.9 replacement text for classification rules, the §5.2 disposition sentence, the individual-assessment definition, the seal and transmission-evidence specification, the manifest-integrity scheme, the isolation procedure, the §6 review-level outcome sentence, and the matrix columns and rules named in Stage I.9. The approved object is that combined protocol candidate for a later commencement decision. I do not approve Stage H §4.1, its roster table, or any statement that the third provider is unselected. D3 remains the sole roster-identity decision. Google privacy remains deferred, and Google is not eligible to receive a package. Provider-proposed severity is evidence only. Working severity and the review-level outcome are human determinations. An individual provider assessment does not issue the review-level outcome. A local request hash is not proof of transmission, receipt, or processing. A negative isolation search is not proof that cross-disclosure did not occur. This approval does not contact any provider, create any account, disclose any package, freeze a package, commence a review, designate an adjudicator, amend operative CC-02, synchronize criteria documents, re-adopt CC-01…CC-06, satisfy CC-02, perform CC-06, close OQ-CENSUS-01, or authorize SQL EXEC or Census EXEC.

That sentence is also unexecuted proposal text.

### 3.3 Stage I.9 isolation sentence

From the line 45 text, section "Revised provider isolation procedure":

> If `instructions-observable` is `PARTIAL`, or class `SUBMITTED` is missing, isolation is `ISOLATION-NOT-EVIDENCED`. That is not a proven breach. It is also not a quorum-counting assessment.

### 3.4 Stage I.8 severity predicate

From the line 42 text, §5.1 item 1:

> Severity is the consequence if the defect is present in the bound SQL `fc2500e7…` or in the reading of that SQL required by the frozen package. It is not likelihood, exploitability, provider confidence, or the number of providers who reported it.

Stage K severity levels `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW` carry the inclusion and exclusion lists from that same §5.2. The Stage K file is a new proposal. It is not the Stage I.8 file. It records the I.9 correction that a provider label is not working severity.

### 3.5 What was not recovered as a git document

There is no repository blob for these three replies. Stage J's statement that they were not hashed controlled documents was accurate at the time of Stage J. This report supplies hashes of the recovered conversation text. It does not convert that conversation into an adopted protocol.

Stage I.10's approval wording, where present in line 48, is part of the hashed reply and was not separately executed. Stage I.11 §12 later proposed yet another combined sentence. That sentence remains `PROPOSED — NOT ADOPTED` inside the committed Stage I.11 file. Stage K does not adopt it.

## 4. How Stage K uses the recovery

| Recovered material                     | Stage K use                                               | Not claimed                                          |
| -------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| I.8 §§5–6 severity and verdicts        | Source of the predicates restated in `STAGE-K-SEV-1`      | That I.8 was adopted                                 |
| I.9 §4 provider versus human severity  | Binding distinction in the new taxonomy                   | That I.9 was adopted                                 |
| I.8 §7 and I.9 assessment revisions    | Input to `STAGE-K-ASSESS-1`                               | That the old seal grammar overrides Stage I.11       |
| I.8 §10 replacement paragraph          | Input to `STAGE-K-SUB-1`                                  | That Stage H §4.3 was edited                         |
| I.9 isolation sentence                 | Input to `STAGE-K-ISO-1`, with an explicit proposed split | That the split was already in I.9                    |
| I.8 §13 and I.9 §11 approval sentences | Quoted here so they are not reconstructed                 | That either sentence is the Product Owner's decision |
