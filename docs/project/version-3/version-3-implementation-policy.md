# Version 3 Implementation Policy

**Document:** Version 3 Implementation Policy
**Date:** 2026-08-16
**Status:** Binding process for every Version 3 package
**Extended:** 2026-08-17 — Security Verification Standard + Security Regression Suite become mandatory for packages that start after approval ([`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md))
**Authority:** Subordinate to [`version-3-master-plan.md`](./version-3-master-plan.md)
**Nature:** Process. Not an RC. Not an ADR. Not a Master Plan revision.

No Version 3 package starts with production code. Every package follows the same lifecycle. This is the discipline that certified Version 2, made predictable for Version 3.

**Package execution** follows the Version 3 Development Lifecycle Standard: [`product-owner-onboarding/11-development-lifecycle-standard.md`](./product-owner-onboarding/11-development-lifecycle-standard.md). That document is the normative detailed workflow (planning → slices → Close Evidence → Final Package Integration Verification → Product Owner Final Close → repository synchronization). This policy remains binding for stage rules and constraints; it does not duplicate the lifecycle standard.

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

| Stage                      | Meaning                                                                                                                                                                                                                                                                                                             | Must not                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Master Plan**            | Product Owner source of truth. Frozen. Package IDs, waves, customer outcomes, and reuse table live here.                                                                                                                                                                                                            | Invent work that is not in the plan. Amend the plan inside an implementation task.                                                                                |
| **Implementation Package** | Prepare scope, current-state, slices, security, architecture, and validation so implementation can start without changing planning.                                                                                                                                                                                 | Write production code. Redesign architecture. Create RC or ADR documents. Modify Version 2 certification.                                                         |
| **Review**                 | Read the package against the Master Plan, Security Vision, and Architecture freeze.                                                                                                                                                                                                                                 | Treat review comments as silent scope expansion.                                                                                                                  |
| **Approval**               | Explicit go-ahead to write production code for **this package only**.                                                                                                                                                                                                                                               | Start a later wave or a different `V3-*` ID.                                                                                                                      |
| **Implementation**         | Execute the approved slices. Extend existing owners. Keep HTTP as transport and UI as not Source of Truth.                                                                                                                                                                                                          | Duplicate domains. Enable live UI. Collect exchange keys (unless the package is that work). Amend Spec v2.0.                                                      |
| **Implementation Report**  | Record what shipped, files, tests, and honest limitations.                                                                                                                                                                                                                                                          | Claim Wave exit for capabilities owned by later packages.                                                                                                         |
| **Architecture Review**    | Confirm no new bounded context unless the Master Plan already justified it; no ownership drift; no SoT change.                                                                                                                                                                                                      | Rubber-stamp a duplicate auth, vault, ledger, or order path.                                                                                                      |
| **Security Review**        | Confirm the package’s Security Vision controls; fail closed; no secret leakage. Complete the Security Checklist, STRIDE, Timing, Abuse, and — for packages that start after approval — the Security Verification Standard and Security Regression Suite.                                                            | Move another package’s controls into this closeout without a plan revision. Ship a security fix without a regression test when the verification standard applies. |
| **Product Review**         | Confirm customer-visible outcomes. No SSH, no customer `.env`, no manual database edits for the journey.                                                                                                                                                                                                            | Accept a developer-only path as the product path.                                                                                                                 |
| **Validation**             | Execute the package validation plan (unit, integration, UI, walkthrough, security, architecture, customer acceptance). Security regression tests run with ordinary tests when the verification standard applies.                                                                                                    | Close on tests that mock the customer outcome.                                                                                                                    |
| **Close**                  | Package is done at the gate the Product Owner accepted. Prefer clear names when two gates exist: **Platform Complete** (domain ready for consumers) vs **Customer Complete** (operators can use the product surface). Next `V3-*` may open at **Implementation Package** after the accepted platform/package Close. | Reopen Version 2 RCs, PC reports, or this package’s scope by stealth; claim Customer Complete without UI/walkthrough.                                             |

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
11. Security is a first-class product capability. Beginning with packages that start after [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md) is approved: every Security Review must complete that standard (every category, every row) and the Security Regression Suite. A found-and-fixed vulnerability owned by the package must leave an automated regression test. Closed / Accepted packages are not rewritten.
12. **Not every bounded context is a finished customer product at the same moment as its domain.** When a package intentionally separates gates, name them clearly:
    - **Platform Complete** — domain is complete and validated; future packages may consume it.
    - **Customer Complete** — UI and operator workflow are complete; operators can use it in the product.
      Platform Complete must not claim Customer Complete. Customer surface ownership does not move to another package when Platform Complete closes. Example: V3-S03 Vault — see [`v3-s03-close-criteria-resolution.md`](./v3-s03-close-criteria-resolution.md). The same pattern may apply later to Monitoring, Billing, or AI Platform when those packages plan it explicitly.

---

## Security process companions

| Document                                                                                       | Role                                                                                                     |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`version-3-security-checklist.md`](./version-3-security-checklist.md)                         | High-level Close gate (authn, authz, vault, financial integrity, STRIDE, Timing, Abuse)                  |
| [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md) | Itemized verification (injection … secure headers), OWASP Top 10 + API Top 10, Security Regression Suite |

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
- It does not rewrite Closed or Accepted packages when the Security Verification Standard is introduced.

---

**STOP.** After a package Implementation Package is written: review and approve it before production code.
