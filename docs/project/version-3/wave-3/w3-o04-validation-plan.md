# W3-O04 Validation Plan

**Package:** W3-O04 Durable Kill Switch Product
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O04 · LT-03 · TD-047
**Status:** Planning **COMPLETE**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Date:** 2026-08-27
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w3-o04-product-scope.md`](./w3-o04-product-scope.md)
**Security:** [`w3-o04-security-review.md`](./w3-o04-security-review.md)
**Umbrella:** [`w3-o04-implementation-package.md`](./w3-o04-implementation-package.md)
**Overview:** [`durable-kill-switch-overview.md`](./durable-kill-switch-overview.md)
**Wave durability:** [`durability-overview.md`](./durability-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper wrote “armed” without proving restart survival / session stop / admission block) do **not** count as Close evidence.

Do not validate Monitoring product (O05), Live Trading, Wave 4 venue I/O, Wave 5 production transports, Business Continuity, High Availability, or Disaster Recovery. Validate **Durable Kill Switch Product** outcomes only.

Do not treat W3-O01 store survival, W3-O02 queue durability, or W3-O03 recovery claim stance as proof of Kill Switch product Close.

### Slice progress

| Slice    | Name                                                           | Validation record |
| -------- | -------------------------------------------------------------- | ----------------- |
| W3-O04-a | Kill Switch inventory & honesty baseline                       | Not opened        |
| W3-O04-b | Durable Kill Switch persistence on existing Session / CC owner | Not opened        |
| W3-O04-c | Paper product visibility & Command Center integration          | Not opened        |
| W3-O04-d | Restart survival & admission block proof                       | Not opened        |
| W3-O04-e | Package Validation, Operational Verification & Close Evidence  | Not opened        |

---

## 0. What Close means for W3-O04

| Gate                | Meaning                                                         | Unlocks                                  |
| ------------------- | --------------------------------------------------------------- | ---------------------------------------- |
| **W3-O04 Closed**   | LT-03 / TD-047 Kill Switch outcomes evidenced; walkthrough PASS | TD-047 residual closed for package scope |
| **Wave 3 COMPLETE** | Not claimed from O04 alone                                      | Requires O01…O05 + PO declaration        |
| **Not claimed**     | Monitoring product                                              | V3-O05                                   |
| **Not claimed**     | Live Trading                                                    | Wave 6 / Order Path                      |
| **Not claimed**     | Business Continuity / High Availability / DR                    | Later / never silent                     |
| **Not claimed**     | Production restart-safe Complete                                | Separate governance / O03+ surfaces      |
| **Not claimed**     | Kill Switch Complete from W3-O04-a alone                        | Requires full package Close              |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Unit validation               | Kill Switch inventory; armed/cleared integrity; secret non-echo; no bypass helpers       |
| Integration validation        | Durable state on existing owner; restart survival; admission block; cross-workspace deny |
| UI validation                 | Honest arm/stop/survive/clear; no dishonest Complete claims                              |
| Regression validation         | Wave 1 + Wave 2 + W3-O01 + W3-O02 + W3-O03 security and product boundaries               |
| Product walkthrough           | Durable Kill Switch Walkthrough executed in product                                      |
| Architecture validation       | No ownership drift; no second Kill Switch engine; no new bounded context                 |
| Security validation           | Verification Standard + isolation + authz + fail closed + no bypass                      |
| Package acceptance validation | Acceptance criteria table; Close checklist                                               |

---

## 2. Unit validation

| Area                        | Must prove                                                         |
| --------------------------- | ------------------------------------------------------------------ |
| Kill Switch inventory class | Hidden REST vs visible product vs admission vs pause/stop          |
| Armed / cleared integrity   | Client cannot forge cleared while armed persists                   |
| Secret non-echo             | Responses, logs, and errors never include secrets                  |
| Workspace binding           | Missing/wrong workspace fails closed                               |
| No admission bypass         | Helpers never skip `kill_switch_active` while armed                |
| No capital side effect      | Kill Switch helpers never invoke live order placement from O04     |
| No second SoT helpers       | No parallel Kill Switch engine / runtime controller invent helpers |

### W3-O04-a unit focus (planning)

| Area                    | Must prove                                                      |
| ----------------------- | --------------------------------------------------------------- |
| Inventory completeness  | Every required Kill Switch surface appears; ids unique          |
| Ownership consistency   | Session / Command Center / Trading Session owners only          |
| Distinction consistency | Kill Switch ≠ pause/stop alone; ≠ O05 Monitoring; ≠ Wave 6 Live |

### W3-O04-b unit focus (planning)

| Area                 | Must prove                                                     |
| -------------------- | -------------------------------------------------------------- |
| Persistence on owner | Armed / cleared state on existing Session / CC aggregates only |
| No second SoT        | No parallel Kill Switch store or engine                        |
| Immutability rules   | State transitions honest; no silent wipe                       |

### W3-O04-c unit focus (planning)

| Area                     | Must prove                                             |
| ------------------------ | ------------------------------------------------------ |
| Visible product surfaces | Paper operator can arm / clear through product         |
| Session stop             | Armed state stops sessions on paper                    |
| Authz gate               | Unauthorized arm / clear denied                        |
| Reason capture           | Required attribution captured per existing port policy |

### W3-O04-d unit focus (planning)

| Area                  | Must prove                                               |
| --------------------- | -------------------------------------------------------- |
| Restart survival      | Armed state persists after API restart                   |
| Admission block       | Evaluation/admission blocked on paper while armed        |
| Safe stop persistence | Sessions remain safely stopped after restart while armed |

### W3-O04-e unit focus (planning)

| Area                   | Must prove                                                       |
| ---------------------- | ---------------------------------------------------------------- |
| Slice roll-up          | a–d Validation / Architecture / Security / Product all PASS      |
| Operational chain      | Inventory → Persistence → Visibility → Restart proof → integrity |
| Close Evidence honesty | Package NOT CLOSED until PO; Wave 3 NOT COMPLETE; O05 NOT opened |
| Honest Product         | No Monitoring / Live Trading / BC/HA/DR claims from O04          |

---

## 3. Integration validation

| Area                               | Must prove                                                 |
| ---------------------------------- | ---------------------------------------------------------- |
| Durable state on existing owner    | Uses Session / Command Center ownership — not a new domain |
| Arm → stop → survive → block       | End-to-end paper halt chain                                |
| Clear authorization                | Clear requires explicit authorized action                  |
| Cross-workspace deny               | Workspace A cannot read / drive Workspace B Kill Switch    |
| Authz deny                         | Unauthorized role cannot arm / clear                       |
| W3-O01 / W3-O02 / W3-O03 untouched | Closed packages not reopened as redesign                   |
| No Gate/Risk bypass                | Domain gate chain preserved                                |
| No live capital path               | O04 validation does not place live orders                  |

---

## 4. UI validation

| Area                  | Must prove                                             |
| --------------------- | ------------------------------------------------------ |
| Visible arm / clear   | Operator sees halt control on paper                    |
| Sessions stopped      | UI reflects stopped sessions when armed                |
| Restart honesty       | UI shows armed state after restart                     |
| No fake cleared       | UI never shows cleared while armed persists            |
| No dishonest Complete | No Monitoring / Live / Wave 3 COMPLETE badges from O04 |

---

## 5. Regression validation

| Area                         | Must prove                      |
| ---------------------------- | ------------------------------- |
| Wave 1 security boundaries   | Unchanged for consumed products |
| Wave 2 product boundaries    | Connections not redesigned      |
| W3-O01 analytical durability | Not reopened                    |
| W3-O02 queue durability      | Not reopened                    |
| W3-O03 recovery claim stance | Not reopened                    |
| Risk Engine                  | Not redesigned                  |
| Runtime evaluator            | Not replaced                    |

---

## 6. Product walkthrough

**Name:** Durable Kill Switch Walkthrough

| Step | Action                                               | Expected outcome                    |
| ---- | ---------------------------------------------------- | ----------------------------------- |
| 1    | Sign in as authorized operator in workspace A        | Access granted                      |
| 2    | Arm Kill Switch from visible paper product surface   | Armed; sessions stop                |
| 3    | Attempt unauthorized arm / clear in workspace A      | Denied where policy requires        |
| 4    | Attempt access from workspace B                      | Denied                              |
| 5    | Restart API process while armed                      | Armed state survives                |
| 6    | Confirm admission blocked on paper while armed       | Evaluation/admission denied         |
| 7    | Clear Kill Switch as authorized operator             | Cleared explicitly and attributable |
| 8    | Confirm no Monitoring / Live / Wave 3 COMPLETE claim | Honest product                      |

Walkthrough evidence is required at package Close.

---

## 7. Architecture validation

| Check                           | Must prove |
| ------------------------------- | ---------- |
| No ownership changes            | PASS       |
| No new bounded context          | PASS       |
| No new Source of Truth          | PASS       |
| No duplicate Kill Switch owner  | PASS       |
| No duplicate runtime controller | PASS       |
| No duplicate persistence owner  | PASS       |
| No Version 2 redesign           | PASS       |
| No Master Plan revision         | PASS       |

---

## 8. Security validation (Close)

Apply [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) worksheets.

Minimum Close security evidence:

- Workspace isolation rows PASS
- Authorization rows PASS
- Secret non-echo rows PASS
- Fail closed rows PASS
- Arm / clear audit attribution rows PASS
- No Gate/Risk bypass rows PASS
- Regression rows for Wave 1 + predecessors PASS

---

## 9. Package acceptance validation

Map to Product Acceptance Criteria in [`w3-o04-product-scope.md`](./w3-o04-product-scope.md).

| #   | Acceptance criterion          | Evidence type                  |
| --- | ----------------------------- | ------------------------------ |
| 1   | Visible arm on paper          | Walkthrough + integration      |
| 2   | Sessions stop when armed      | Integration + UI               |
| 3   | Armed survives restart        | Restart proof (slice d)        |
| 4   | Admission blocked while armed | Integration + unit             |
| 5   | Explicit authorized clear     | Walkthrough + audit            |
| 6   | Cross-workspace deny          | Integration                    |
| 7   | Unauthorized deny             | Integration                    |
| 8   | No dishonest Complete claims  | Product + docs review          |
| 9   | No secret exposure            | Security Verification Standard |
| 10  | No architecture drift         | Architecture review            |

---

## 10. Close checklist (planning)

| Item                                           | Required at Close |
| ---------------------------------------------- | ----------------- |
| All slices a–e COMPLETE                        | YES               |
| Durable Kill Switch Walkthrough PASS           | YES               |
| Security Verification Standard worksheets PASS | YES               |
| Architecture review PASS                       | YES               |
| Product review PASS                            | YES               |
| TD-047 closed for package scope                | YES               |
| Wave 3 COMPLETE not claimed                    | YES               |
| W3-O05 not opened without PO                   | YES               |
| Live Trading not claimed                       | YES               |
| Product Owner Package Close                    | YES               |

---

## Explicit non-validation (binding)

Do **not** count as W3-O04 Close evidence:

- Pause / resume / stop alone without durable Kill Switch product outcomes
- Hidden live-only REST without visible paper product surfaces
- W3-O03 recovery claim stance inventory
- W3-O02 queue restart survival
- W3-O01 analytical store survival
- Monitoring dashboard behaviour (O05)
- Live order halt on real venue (Wave 6)
- Business Continuity / HA / DR drills or products

---

**STOP.** Planning only. Validation executes after Product Owner Approval and implemented slices. Do not open W3-O04-a from this document.
