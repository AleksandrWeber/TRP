# FIV-CONN-04-D — Remediated Baseline Register Decision Proposal

```text
PROJECT OWNER DECISION PROPOSAL
RECORD ID: PROP-CONN04-VMP1-REGISTER-REMEDIATED-2026-11
DATE: 2026-11-10
STATUS: PROPOSAL — NOT A DECISION
RECOMMENDATION: R2 — SUCCESSOR SUPPLEMENT, NON-BINDING
DECISION REGISTER: NOT EDITED
STAGE 4: NOT AUTHORIZED BY THIS PROPOSAL
```

**Document:** Proposal on whether `main`'s Decision Register should name the remediated VMP-1 baseline  
**Record ID:** **`PROP-CONN04-VMP1-REGISTER-REMEDIATED-2026-11`**  
**Date:** 2026-11-10  
**Wave:** 6 — Live Trading / FIV-CONN-04-D

This file does not embed its own SHA-256. It is not a Decision Register change. Owner acceptance of the remediation does not by itself require a register row.

---

## A. Current register state

Two texts exist. This proposal does not choose which one the owner treats as operative.

| Source                                                                                                                         | What it says about the VMP-1 baseline                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Committed `main` at `686627cb820a6994951cc6d1cbd4ab2b7c6ae4ed`, `docs/project/version-3/wave-6/wave-6-po-decision-register.md` | `D-CONN04-FULL-D-IA-VMP-BASELINE` = **RATIFY — VMP-1 IMPLEMENTATION BASELINE ACCEPTED**, ratification date **NOT SET**. Commit `e6b839e0e7d75322d9626162712fa81f61147d18`, tree `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2`. Scope is that baseline only. Forensic review **PASS WITH CONDITIONS**. Selected tests 52 passed, not full-repository CI. Implementation **NOT PUBLISHED**. Stage 4 **NOT AUTHORIZED**. `D-CONN04-FULL-D-IA-S4` and OQ-S4-02 **NOT ESTABLISHED**. The STOP line says not to invent further status changes. |
| Primary `main` worktree, uncommitted modification of the same file (+414 / −4 against that commit)                             | Still identifies only `e6b839e` / `1ab2c560` as the VMP-1 baseline. It does not mention `8177f3a`, `798b774`, or `D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED`. Later uncommitted rows bind that same commit as the Stage 4 parent basis and say `impl/fiv-conn-04-d-stage-4` is **NOT ACCEPTED**. Those rows are not in commit `686627c`. This proposal does not adopt them and does not edit them.                                                                                                                                       |

The register already separates states. For this baseline it records acceptance, withholds a ratification date, records non-publication, and withholds Stage 4 authorization. Acceptance is not publication. Ratification of the Port IA under `D-CONN04-FULL-D-IA-VMP` (Port IA SHA-256 `18e177ef154b8a35dc333faefa05c73729150c3822e78818fdc85bfe45db89e6`) is a different row from baseline acceptance. Neither row is an independent review of the remediation.

Related records, none of which are register rows:

| Record                   | ID                                             | Role                                                                                                                                                                                         |
| ------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner acceptance         | `ACCEPT-CONN04-VMP1-SR-REMEDIATION-2026-11-09` | Owner-led technical acceptance of SR-001…SR-004. Independent review not claimed.                                                                                                             |
| Remediation verification | `TVER-CONN04-VMP1-SR-REMEDIATION-2026-11-09`   | Technical verification with limitations. Not an independent review.                                                                                                                          |
| Remediated baseline      | `D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED`       | Names commit `8177f3a80a879bc603f6e22d192752013501a476`, tree `7df527b7d5ab19379aca76f53b4ee8a7a7ddf12c`, parent `e6b839e`. The record commit is `798b774f7a32b8eb70c3af07a851d43996bae5a0`. |
| Integration assessment   | `ASSESS-CONN04-VMP1-SR-INTEGRATION-2026-11`    | Recommends keeping that baseline independent. Recorded at `0a119e0c13601c300fa339fbef58295abc8b643c`. Does not decide integration.                                                           |

---

## B. What inclusion would and would not change

A new row can name the remediated commit without changing `D-CONN04-FULL-D-IA-VMP-BASELINE`. That original row should keep commit `e6b839e` and tree `1ab2c560`. Replacing those hashes would change the meaning of the accepted baseline and would conflict with every later text that uses `e6b839e` as the parent basis.

Inclusion as a successor does not ratify the Port IA again, does not publish either commit onto `main`, and does not authorize Stage 4. Wording has to say those limits. A row that only says "accepted baseline" would blur the original baseline and the successor.

The remediation is a successor of the original baseline, not a substitute for it, unless the owner explicitly replaces the original hashes. It is also not a Stage 4 parent unless a later decision says so.

---

## C. Arguments

**For a register reference.** The register is the index later decisions cite. Without a row, a reader of `main` sees only `e6b839e` and can start work without the identity check or the `@Inject` annotations. The branch records exist, and they are not the register. A supplement row preserves the original hashes and records where the successor lives.

**Against a register reference.** Owner acceptance was not a direction to synchronize the register. The integration assessment recommends leaving the code independent. The committed STOP line says not to invent further status from the baseline entry. The uncommitted Stage 4 text still binds `e6b839e` only. A poorly worded row would look like publication, like a new Stage 4 parent, or like replacement of the original baseline. Editing `main` to add the row is itself a separate change, and the primary register file is already dirty.

**Against treating acceptance as automatic inclusion.** No reviewed record says that owner-led technical acceptance creates a register duty. VMP-1 closure was entered because a closure act directed synchronization. The remediation acceptance record does not direct that.

---

## D. Options

### R1 — Leave the register unchanged

The remediated baseline stays documented on `remediation/vmp-1-self-review` only. `D-CONN04-FULL-D-IA-VMP-BASELINE` remains the only VMP-1 baseline named on `main`. Future work that trusts the register alone will start from `e6b839e` and will not include SR-001…SR-004.

### R2 — Add a successor supplement

Add one new row. Do not change the hashes, date, publication sentence, or Stage 4 sentence of `D-CONN04-FULL-D-IA-VMP-BASELINE`.

Proposed wording, not applied:

> `D-CONN04-FULL-D-IA-VMP-1-SR-REMEDIATED` is a **successor supplement** to `D-CONN04-FULL-D-IA-VMP-BASELINE`. It does **not** replace commit `e6b839e0e7d75322d9626162712fa81f61147d18` or tree `1ab2c5600c8bf487e99a01c909c8a5e6b75c4be2`. Remediation commit `8177f3a80a879bc603f6e22d192752013501a476`, tree `7df527b7d5ab19379aca76f53b4ee8a7a7ddf12c`, parent `e6b839e0e7d75322d9626162712fa81f61147d18`. Record commit `798b774f7a32b8eb70c3af07a851d43996bae5a0`. Branch `remediation/vmp-1-self-review`. Owner-led technical acceptance `ACCEPT-CONN04-VMP1-SR-REMEDIATION-2026-11-09` covers SR-001…SR-004 only. That acceptance is **not** independent review, **not** a Port IA amendment or re-ratification, **not** publication onto `main`, and **not** Stage 4 authorization. Integration remains undecided. `ASSESS-CONN04-VMP1-SR-INTEGRATION-2026-11` recommends keeping this successor independent.

### R3 — Replace the accepted baseline

Retarget `D-CONN04-FULL-D-IA-VMP-BASELINE` from `e6b839e` to `8177f3a`. This would change the commit every current Stage 4 parent-basis text names. It is not proposed as the default.

---

## E. Non-binding recommendation

**R2.** Record the successor without replacing the original baseline. R1 leaves the hardening invisible to the register. R3 changes a baseline that later Stage 4 texts still bind to `e6b839e`.

R2 does not merge code, does not authorize Stage 4, and does not approve editing the dirty register file. Applying R2 needs a separate Product Owner instruction and a separate edit of the register.

---

## F. Decision required

The Product Owner chooses R1, R2, or R3. This proposal does not choose for the owner.

No Decision Register change was performed. `main` was not modified. Stage 4 was not authorized.
