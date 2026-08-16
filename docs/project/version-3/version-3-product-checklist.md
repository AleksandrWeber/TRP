# Version 3 Product Checklist

**Document:** Version 3 Product Checklist  
**Date:** 2026-08-16  
**Status:** Mandatory for every `V3-*` package  
**Authority:** Subordinate to [`version-3-master-plan.md`](./version-3-master-plan.md) Product Principles and customer wave outcomes  
**Template:** [`version-3-package-template.md`](./version-3-package-template.md)  
**Nature:** Checklist. Not an RC. Not an ADR. Not implementation.

Every Version 3 package must answer every prompt below. A developer-only path is not the product path. Customer First still applies: the feature must be usable without SSH, Docker, or editing customer `.env`. Host infrastructure may remain server-operated.

Complete at **Implementation Package** (intended answers) and at **Close** (demonstrated answers). Close requires the walkthrough and UX rows to be **PASS**.

---

## Package identity

| Field                      | Value                          |
| -------------------------- | ------------------------------ |
| Package                    | V3-___                         |
| Wave                       |                                |
| Master Plan outcomes owned |                                |
| Reviewer                   |                                |
| Date (package / close)     |                                |
| Stage                      | Implementation Package / Close |

---

## Verdicts

Use **PASS** / **NOT APPLICABLE** / **REQUIRES ACTION** on gated rows. Narrative rows must still be filled in complete sentences. Empty is **REQUIRES ACTION**.

---

## Every package must answer

### 1. Customer receives

What an ordinary operator can now do in the product after this package Closes.

- Customer receives:
- How they do it (UI path, no jargon required):
- Master Plan outcome IDs / wave lines this satisfies:

**Verdict (Close):** PASS / REQUIRES ACTION

### 2. Customer does NOT receive

What this package must not be mistaken for. Name the later package or Master Plan deferral.

- Customer does NOT receive:
- Owner later:

**Verdict (Close):** PASS / REQUIRES ACTION — fail if the UI implies a later capability (MFA theater, fake Connected, live UI, vault, role admin, etc.)

### 3. Business value delivered

- Business value:
- Metric met or not regressed (Master Plan §6):
- What is still 40% production-readiness residue (honest):

**Verdict (Close):** PASS / REQUIRES ACTION

### 4. Customer journey impact

Which step of the Version 3 journey this package changes:

```text
Sign in securely
  → isolated workspace
  → connect exchange / notifications / AI in the product
  → research → certify → Gate → deploy → orchestrate
  → paper session (default) or live session (opt-in, audited, kill-switch armed)
  → reports, knowledge, real alerts
  → Command Center
```

- Journey step(s) affected:
- Journey steps explicitly unchanged:
- Paper remains default (Yes / NOT APPLICABLE with reason):

**Verdict (Close):** PASS / REQUIRES ACTION

### 5. Next customer capability unlocked

- Next package this Close unblocks:
- Next customer-visible capability (plain language):
- Wave exit claimed? **No** unless this is the last package of the wave **and** all wave outcomes are met.

**Verdict (Close):** PASS / REQUIRES ACTION

### 6. Manual product walkthrough completed

A reviewer who is not implementing the package performed the customer path.

| Check                                                             | Verdict                                 |
| ----------------------------------------------------------------- | --------------------------------------- |
| Walkthrough script exists (package validation plan or equivalent) | PASS / NOT APPLICABLE / REQUIRES ACTION |
| Executed in the product UI                                        | PASS / NOT APPLICABLE / REQUIRES ACTION |
| No SSH                                                            | PASS / REQUIRES ACTION                  |
| No customer `.env`                                                | PASS / REQUIRES ACTION                  |
| No manual database edits                                          | PASS / REQUIRES ACTION                  |
| Honest unavailable/error states shown (no fake success)           | PASS / NOT APPLICABLE / REQUIRES ACTION |

**Walkthrough evidence** (who, when, result):

### 7. UX reviewed

| Check                                                                     | Verdict                                 |
| ------------------------------------------------------------------------- | --------------------------------------- |
| Copy is operator language (no JWT / Prisma / slice IDs in the happy path) | PASS / NOT APPLICABLE / REQUIRES ACTION |
| Existing certified shell reused unless the Master Plan named new UI       | PASS / REQUIRES ACTION                  |
| No live trading surfaced unless this package is authorized Wave 6 work    | PASS / REQUIRES ACTION                  |
| No simulated **Connected** shown as real                                  | PASS / NOT APPLICABLE / REQUIRES ACTION |
| Empty/error/unavailable states are honest                                 | PASS / REQUIRES ACTION                  |
| Debug prefill of credentials remains forbidden                            | PASS / NOT APPLICABLE / REQUIRES ACTION |

**UX notes:**

### 8. Documentation updated

| Check                                                          | Verdict                                 |
| -------------------------------------------------------------- | --------------------------------------- |
| Package reports required by the template exist                 | PASS / REQUIRES ACTION                  |
| Customer-facing help/runbook updated if the journey changed    | PASS / NOT APPLICABLE / REQUIRES ACTION |
| Version 2 certification docs **not** rewritten                 | PASS / REQUIRES ACTION                  |
| Master Plan **not** edited from inside this package            | PASS / REQUIRES ACTION                  |
| No RC or ADR created unless Master Plan already named that ADR | PASS / REQUIRES ACTION                  |

**Doc paths:**

---

## Product Principles (confirm each)

| Principle                    | How this package respects it | Verdict                                 |
| ---------------------------- | ---------------------------- | --------------------------------------- |
| Customer First               |                              | PASS / REQUIRES ACTION                  |
| Security Before Convenience  |                              | PASS / REQUIRES ACTION                  |
| One Source of Truth          |                              | PASS / REQUIRES ACTION                  |
| Paper First                  |                              | PASS / NOT APPLICABLE / REQUIRES ACTION |
| Live Must Be Earned          |                              | PASS / NOT APPLICABLE / REQUIRES ACTION |
| Honest Product               |                              | PASS / REQUIRES ACTION                  |
| AI Never Controls Capital    |                              | PASS / NOT APPLICABLE / REQUIRES ACTION |
| Everything Is Auditable      |                              | PASS / REQUIRES ACTION                  |
| No Hidden Configuration      |                              | PASS / REQUIRES ACTION                  |
| Architecture Is a Constraint |                              | PASS / REQUIRES ACTION                  |

---

## Close rule

Product Review **PASS** only when:

- Sections 1–5 are answered honestly and match IN / OUT scope
- Walkthrough (section 6) has no REQUIRES ACTION
- UX (section 7) has no REQUIRES ACTION on rows that apply
- Documentation (section 8) has no REQUIRES ACTION
- Product Principles table has no REQUIRES ACTION

---

**STOP.** If the customer cannot complete the journey in the product, the package is not Closed.
