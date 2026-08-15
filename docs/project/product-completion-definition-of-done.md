# Product Completion — Definition of Done

**Document:** Product Completion Definition of Done  
**Status:** Mandatory closure checklist  
**Date:** 2026-08-15  
**Applies to:** Every Product Completion package (PC-01 … PC-20)  
**Governing charter:** [Version 2 Product Completion Roadmap](./v2-product-completion-program.md)  
**Tracker:** [Product Completion Backlog](./v2-product-completion-backlog.md)  
**Journey:** [Canonical Product Journey](./product-completion-journey.md)  
**UI rules:** [Product UI Policy](./product-ui-policy.md)  
**Planning freeze:** [Product Completion Readiness Report](./product-completion-readiness-report.md) (**READY TO START PC-18**)

This is the **only** closure checklist for Product Completion. A package may be marked `Closed` in the Backlog only when **every** item below is true for that package’s **declared scope** in the Roadmap.

This is not an RC gate. This is not an ADR. Architecture Specification v2.0, Authority Matrix, and Alias Dictionary remain frozen.

---

## How to apply this checklist

1. Copy the checklist into the package Implementation Report (or attach this document and tick the table).
2. Interpret each item against the Roadmap definition of **that package**, not against the whole program.
3. If the Roadmap says the package has no UI (PC-15) or no new REST (PC-19, PC-20), that item is **satisfied by remaining absent** — do not add a screen or transport to “pass” the row.
4. “Canonical user journey works” means the [journey step(s) this package enables](./product-completion-journey.md) work for a user. It does not require the entire Version 2 loop until later packages exist.
5. If any row is false, the package stays `Not started`, `In progress`, or `Blocked`. Do not close.

---

## Mandatory checklist

A Product Completion package may close only when **ALL** of the following are true:

| #   | Gate                                   | True when                                                                                                                                                               |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Backend functionality complete**     | Existing module behaviour required by this package is operable for a user of this slice. No new domain. No new SoT.                                                     |
| 2   | **REST transport complete**            | Existing application ports this package must expose have HTTP transport — **or** the Roadmap declares no REST for this package.                                         |
| 3   | **UI complete**                        | The screens this package must ship exist and are usable — **or** the Roadmap declares no UI for this package (PC-15).                                                   |
| 4   | **Existing application ports exposed** | UI and REST delegate to certified ports. No shadow API. No duplicated business logic. Legacy routes are not relabeled as this module.                                   |
| 5   | **Integration wiring complete**        | Producer→consumer edges this package owns are wired in the running product (PC-15 slices). Other packages do not skip PC-15 by inventing a second path.                 |
| 6   | **Tests PASS**                         | Automated tests for this slice pass. Architecture conformance tests alone are not sufficient.                                                                           |
| 7   | **Documentation updated**              | Implementation Report and Validation Report exist. Spec / Authority Matrix / Alias Dictionary / RC history were **not** edited.                                         |
| 8   | **Release Notes written**              | User-visible, paper-first. Does not imply Live Trading.                                                                                                                 |
| 9   | **CHANGELOG updated**                  | The same change is recorded in the project CHANGELOG.                                                                                                                   |
| 10  | **Product Completion Backlog updated** | Status `Closed`, progress complete, links to artifacts, journey columns unchanged except notes.                                                                         |
| 11  | **Canonical user journey works**       | The journey step(s) this package enables (see Journey document) can be completed by a user for this slice. [Product UI Policy](./product-ui-policy.md) is not violated. |

All eleven must be true. Ten of eleven is not done.

---

## Package sign-off (copy per close)

```text
Package: PC-__
Journey steps enabled: J-__
Definition of Done: ALL items 1–11 TRUE
Spec v2.0 unchanged: YES
Authority Matrix unchanged: YES
Alias Dictionary unchanged: YES
RC-19…RC-28 unaltered: YES
Live Trading implied: NO
Closed by: ________  Date: ________
```

---

## Forbidden closes

Do not mark a package Closed if:

- A visible button, nav item, or page implies a capability this package did not finish (UI Policy).
- Orchestrator was changed to create Sessions (`createsSession: true`).
- Legacy `/strategies`, `/knowledge`, `/reports`, or `/ai/execute` was treated as the V2 module.
- Only Vitest platform-conformance E2E passed, with no user-facing slice evidence.
- Spec, Authority Matrix, Alias Dictionary, or RC history was modified “for docs sync.”

---

**End of Definition of Done.**
