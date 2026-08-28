# W4-E06 Product Scope

**Package:** W4-E06 Wave 4 Completion Review
**Wave:** 4 — Exchange Connectivity
**Governance map:** Roll-up after Master Plan **V3-E01…E05** (no new V3-E06 roadmap ID)
**Status:** Planning **OPEN**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w4-e06-implementation-package.md`](./w4-e06-implementation-package.md)
**Overview:** [`w4-e06-overview.md`](./w4-e06-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **governance workflows**, **failure philosophy**, and **acceptance** for W4-E06. It does not redesign Version 2 Exchange domains. It does not invent an engine clone. It does not reopen Wave 1–3 or W4-E01…E05. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 4 COMPLETE.

**Naming clarity:** `W4-E06` is the operational governance package ID for Wave 4 Completion Review after all Master Plan Wave 4 product packages (V3-E01…E05) are **CLOSED**. It does not add capabilities absent from frozen Master Plan / Execution Roadmap scope.

---

## Product purpose

Wave 4 Completion Review is the governance package that defines how **W4-E01…E05 Close Evidence** is rolled up, how **Wave 4 exit criteria** are verified against the frozen Master Plan and Execution Roadmap, and how **Honest Product** boundaries are preserved before any Product Owner Wave 4 COMPLETE declaration.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own Connection Management facade product behaviour (consumes closed evidence).

It does **not** own Exchange Adapter protocol I/O (consumes closed E01…E05 artifacts).

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own per-package product outcomes (E01…E05 reopen forbidden).

```text
W4-E06 owns wave-level governance roll-up and Completion Review evidence.
W4-E06 consumes E01…E05 Close artifacts — does not redesign them.
Exchange Adapter factory remains protocol owner for all venue I/O.
Package Close ≠ Wave COMPLETE ≠ Exchange Connectivity Complete.
Paper remains default.
```

---

## Why Wave 4 Completion Review exists (business language)

Master Plan Wave 4 names five product packages (V3-E01…E05). Each closed with honest **foundation** scope and documented **deferred** product outcomes (REST/WebSocket I/O, live Connected labels, vendor permission probes). Product Owner cannot honestly declare Wave 4 **COMPLETE** without a governed roll-up that respects those distinctions. W4-E06 is that governance package.

---

## Customer value

After this package Closes (post-implementation), Product Owner can:

- Review a single Wave 4 Completion Review with E01…E05 evidence indexed
- See Master Plan Wave 4 exit criteria mapped to honest evidence (including gaps/deferred items)
- Confirm no duplicate exchange connectivity engine, permission engine, or persistence owner
- Confirm Honest Product rules held across the wave
- Decide Wave 4 COMPLETE in a **separate** governance act — with eyes open about deferred outcomes

Operators do **not** gain new exchange connectivity behaviour from W4-E06 alone.

---

## Consumes

| Product / artifact                   | How this package uses it                         | Must not do                 |
| ------------------------------------ | ------------------------------------------------ | --------------------------- |
| **W4-E01…E05 Close records**         | Primary evidence sources                         | Reopen or redesign packages |
| **Final Integration Verifications**  | Cross-package consistency checks                 | Override slice verdicts     |
| **Slice a–e reports (E01…E05)**      | Inventory, persistence, recovery, continuity     | Duplicate runtime artifacts |
| **Authentication / Authorization**   | Governance access to review artifacts only       | Parallel IAM                |
| **Workspace Isolation**              | Evidence stays workspace-scoped where applicable | Cross-workspace convenience |
| **Master Plan Wave 4 exit criteria** | Verification target                              | Revise Master Plan          |
| **Execution Roadmap Wave 4**         | Verification target                              | Invent parallel backlog     |
| **Wave 1–3 closed products**         | Regression boundary                              | Redesign closed waves       |

---

## Owns

| Outcome                                   | Customer / PO meaning                                   |
| ----------------------------------------- | ------------------------------------------------------- |
| Wave 4 package roll-up inventory          | E01…E05 delivered vs deferred — honest                  |
| Wave exit criteria evidence map           | Master Plan criteria ↔ Close Evidence                   |
| Cross-package integration verification    | No duplicate subsystem; no ownership drift              |
| Honest Product wave verification          | Foundation ≠ product complete; Connected ≠ Live Trading |
| Wave Completion Review report preparation | Governance artifact for PO Wave 4 COMPLETE decision     |

**Does not own a new exchange product or engine.**

---

## Does NOT own

| Concern                               | Real owner                     |
| ------------------------------------- | ------------------------------ |
| Secret ciphertext / encryption        | Vault                          |
| Identity / sessions                   | Authentication                 |
| Permissions (IAM)                     | Authorization                  |
| Workspace membership / isolation      | Workspace / Isolation          |
| Connection Management facade          | Connection Management (Wave 2) |
| Venue protocol I/O                    | Exchange Adapter factory       |
| Cluster identity                      | Exchange Scope / Cluster       |
| Risk decisions                        | Risk Engine                    |
| Orders / live execution               | Canonical Order Path / Wave 6  |
| Binance Real I/O product              | V3-E01 (CLOSED)                |
| Bybit Real I/O product                | V3-E02 (CLOSED)                |
| OKX Real I/O product                  | V3-E03 (CLOSED)                |
| Kraken Adapter product                | V3-E04 (CLOSED)                |
| Venue Permission Verification product | V3-E05 (CLOSED)                |
| Live Trading                          | Wave 6 + ADR                   |
| Wave 5 notifications                  | Wave 5                         |
| Ledger / money SoT                    | Ledger                         |

---

## IN Scope

| Item                                         | Governance meaning                            |
| -------------------------------------------- | --------------------------------------------- |
| E01…E05 roll-up inventory                    | Foundation vs deferred outcomes documented    |
| Master Plan exit criteria verification       | Honest map to Close Evidence                  |
| Execution Roadmap exit criteria verification | Same                                          |
| Cross-package architecture verification      | No duplicate engine / SoT / persistence owner |
| Honest Product wave verification             | Labels and non-claims consistent              |
| Documentation synchronization                | wave-4-progress and companions aligned        |
| Validation strategy                          | Close criteria, evidence, regressions         |
| Implementation slices (a–e)                  | Named in planning only — not opened           |

---

## OUT OF Scope

| Item                                 | Why out                             |
| ------------------------------------ | ----------------------------------- |
| Reopen W4-E01…E05                    | CLOSED                              |
| Deliver deferred REST/WebSocket I/O  | Deferred per E01…E04 Close records  |
| Deliver vendor permission probe I/O  | Deferred per E05 Close record       |
| Live order submission                | Wave 6 + ADR                        |
| Live Trading UI / session            | Wave 6                              |
| Wave 5 notification transports       | Wave 5                              |
| Engine clone per venue               | Forbidden                           |
| Second Canonical Order Path          | Forbidden                           |
| Connection Management redesign       | Wave 2 COMPLETE                     |
| Vault / Auth redesign                | Wave 1 CLOSED                       |
| Master Plan / V2 architecture change | Forbidden                           |
| Wave 4 COMPLETE                      | Separate PO act after W4-E06 Close  |
| Exchange Connectivity Complete       | Separate honest product declaration |
| Planning Review PASS / APPROVED      | Separate PO acts                    |
| Implementation slices opened         | After Approval only                 |

---

## Honest Product rules

| Rule                     | Binding statement                                              |
| ------------------------ | -------------------------------------------------------------- |
| Foundation delivered     | E01…E05 inventory/persistence/recovery/continuity evidenced    |
| Product deferred         | REST/WS I/O, live Connected, vendor permission probes explicit |
| Package CLOSED           | One package PO Close — not Wave COMPLETE                       |
| Wave 4 COMPLETE          | Requires PO governance after W4-E06 Close                      |
| Connected ≠ Live Trading | Preserved across wave roll-up                                  |
| Paper default            | Preserved                                                      |
| No simulation as truth   | Governance must not fabricate product outcomes                 |

---

## Governance workflows

### Happy path

PO opens W4-E06 Planning → Planning Review PASS → Planning Approval → slices a–e (authorized) → Completion Review evidence assembled → W4-E06 Close → PO may decide Wave 4 COMPLETE separately.

### Failure paths

- Missing E01…E05 Close record → roll-up blocked (fail closed)
- Contradictory status in wave docs → synchronization required before Close
- Exit criteria gap without honest deferral label → Completion Review fails honest product check
- Duplicate subsystem detected → architecture verification fails

---

## Failure philosophy

Fail closed. Never map deferred product outcomes to “complete” in governance artifacts. Never claim Wave 4 COMPLETE or Exchange Connectivity Complete from W4-E06 planning or foundation slices alone. When evidence is missing, show gap — do not fabricate product behaviour.

---

## Acceptance criteria

| #   | Criterion                                           | Evidence at Close         |
| --- | --------------------------------------------------- | ------------------------- |
| 1   | E01…E05 roll-up inventory complete and honest       | Slice a + walkthrough     |
| 2   | Master Plan Wave 4 exit criteria mapped to evidence | Slice b report            |
| 3   | Cross-package integration verification PASS         | Slice c report            |
| 4   | Honest Product wave verification PASS               | Slice d report            |
| 5   | Completion Review report assembled                  | Slice e + walkthrough     |
| 6   | No duplicate engine / persistence owner / SoT       | Architecture review       |
| 7   | No Live Trading / live order claims                 | Product review            |
| 8   | Wave 1–3 and E01…E05 boundaries preserved           | Regression                |
| 9   | Documentation synchronized                          | wave-4-progress alignment |

---

## Implementation slices (planning only)

| Slice | Title                                               | Objective summary                           | Dependency        |
| ----- | --------------------------------------------------- | ------------------------------------------- | ----------------- |
| a     | Wave 4 package roll-up inventory & honesty baseline | E01…E05 delivered vs deferred inventory     | W4-E05 **CLOSED** |
| b     | Wave exit criteria evidence foundation              | Exit criteria ↔ Close Evidence map          | W4-E06-a          |
| c     | Cross-package integration verification foundation   | No duplicate subsystem; ownership preserved | W4-E06-b          |
| d     | Wave operational continuity & Honest Product review | Continuity + honesty across wave            | W4-E06-c          |
| e     | Wave Completion evidence assembly                   | Completion Review report for PO             | W4-E06-d          |

**Not opened.** Not approved for implementation.

---

## Explicit non-goals

- Engine clone per venue
- Second exchange connectivity or permission subsystem
- Duplicate persistence owner
- Live Trading or live order submission
- Exchange Connectivity Complete from W4-E06 alone
- Wave 4 COMPLETE from W4-E06 planning open
- Reopen E01…E05
- Master Plan revision
- Version 2 architecture redesign

---

## Explicit non-claims

- W4-E06 Planning APPROVED — **not claimed**
- W4-E06 Planning Review PASS — **not claimed**
- W4-E06-a opened — **not claimed**
- W4-E06 CLOSED — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- Live Trading — **not claimed**
- Implementation started — **not claimed**

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review.
