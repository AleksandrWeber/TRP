# Version 3 Implementation Policy

**Document:** Version 3 Implementation Policy  
**Date:** 2026-08-16  
**Status:** Binding process for every Version 3 package  
**Authority:** Subordinate to [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Nature:** Process. Not an RC. Not an ADR. Not a Master Plan revision.

No Version 3 package starts with production code. Every package follows the same lifecycle. This is the discipline that certified Version 2, made predictable for Version 3.

---

## Lifecycle (mandatory)

```text
Master Plan
        ↓
Implementation Package
        ↓
Review
        ↓
Approval
        ↓
Implementation
        ↓
Implementation Report
        ↓
Architecture Review
        ↓
Security Review
        ↓
Product Review
        ↓
Validation
        ↓
Close
```

Do not skip a stage. Do not start the next package until the current package is **Closed**.

---

## Stage rules

| Stage                      | Meaning                                                                                                                             | Must not                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Master Plan**            | Product Owner source of truth. Frozen. Package IDs, waves, customer outcomes, and reuse table live here.                            | Invent work that is not in the plan. Amend the plan inside an implementation task.                           |
| **Implementation Package** | Prepare scope, current-state, slices, security, architecture, and validation so implementation can start without changing planning. | Write production code. Redesign architecture. Create RC or ADR documents. Modify Version 2 certification.    |
| **Review**                 | Read the package against the Master Plan, Security Vision, and Architecture freeze.                                                 | Treat review comments as silent scope expansion.                                                             |
| **Approval**               | Explicit go-ahead to write production code for **this package only**.                                                               | Start a later wave or a different `V3-*` ID.                                                                 |
| **Implementation**         | Execute the approved slices. Extend existing owners. Keep HTTP as transport and UI as not Source of Truth.                          | Duplicate domains. Enable live UI. Collect exchange keys (unless the package is that work). Amend Spec v2.0. |
| **Implementation Report**  | Record what shipped, files, tests, and honest limitations.                                                                          | Claim Wave exit for capabilities owned by later packages.                                                    |
| **Architecture Review**    | Confirm no new bounded context unless the Master Plan already justified it; no ownership drift; no SoT change.                      | Rubber-stamp a duplicate auth, vault, ledger, or order path.                                                 |
| **Security Review**        | Confirm the package’s Security Vision controls; fail closed; no secret leakage.                                                     | Move another package’s controls into this closeout without a plan revision.                                  |
| **Product Review**         | Confirm customer-visible outcomes. No SSH, no customer `.env`, no manual database edits for the journey.                            | Accept a developer-only path as the product path.                                                            |
| **Validation**             | Execute the package validation plan (unit, integration, UI, walkthrough, security, architecture, customer acceptance).              | Close on tests that mock the customer outcome.                                                               |
| **Close**                  | Package is done. Next `V3-*` may open at **Implementation Package**, not at code.                                                   | Reopen Version 2 RCs, PC reports, or this package’s scope by stealth.                                        |

---

## Binding rules

1. Identify the wave and **V3-*** package from the Master Plan before any package work.
2. If implementation would contradict the Master Plan, **stop**. Request an approved planning revision. Do not patch the plan from inside a package.
3. If work is not in the Master Plan, **stop**.
4. Do not reopen Version 2 RCs, PC packages, or certification.
5. Do not redesign Version 2.
6. Do not create Version 2-style RC tracks for Version 3.
7. Live capital still requires a **future ADR** (Wave 6). No package before that ADR may authorize live money.
8. Annexes add detail; they must not silently contradict the Master Plan. Conflicts: **Master Plan wins**.
9. An implementation package may justify persistence or ports **inside an existing owner**. It may not create a new bounded context unless the Master Plan already named that context (Credential Vault, Connection Management facade, isolated Billing).
10. Customer First still applies: a Version 3 customer feature must be usable without SSH, Docker, or editing `.env`. Host infrastructure (`DATABASE_URL`, JWT signing, host transactional mail) may remain server-operated.

---

## First package under this policy

| Field                                     | Value                                                    |
| ----------------------------------------- | -------------------------------------------------------- |
| Package                                   | **V3-S01 Authentication & Session**                      |
| Current stage                             | **Implementation Package** (this freeze’s first package) |
| Next stage after this package is reviewed | **Approval**, then Implementation                        |
| Must not                                  | Write production code until this package is approved     |

Package documents: [`v3-s01-implementation-package.md`](./v3-s01-implementation-package.md).

---

## What this policy does not do

- It does not change product scope, waves, or capabilities.
- It does not replace the Master Plan, Execution Roadmap, or Security Vision.
- It does not authorize live capital, a vault, RBAC product UI, or connection wizards.

---

**STOP.** After a package Implementation Package is written: review and approve it before production code.
