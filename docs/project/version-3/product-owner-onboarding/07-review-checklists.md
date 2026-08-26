# 07 — Review Checklists

**Audience:** Permanent AI Product Owner / Chief Architect
**Nature:** Reusable checklists for future slice and package reviews
**Companions:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md) · [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Use **PASS** / **REQUIRES ACTION** / **NOT APPLICABLE** (with owner named). Empty is REQUIRES ACTION.

---

## How to use

1. Copy the relevant sections into the review note (or tick in place).
2. Apply to **slice** reviews with “slice-only” judgment; do not Close the package by accident.
3. At **package Close**, complete full Product / Architecture / Security checklists and Verification Standard as required by policy.
4. Record the Approval Decision section last.

---

## 1. Planning compliance

| #   | Check                                                                                   | Verdict |
| --- | --------------------------------------------------------------------------------------- | ------- |
| 1.1 | Package ID maps to Master Plan / Product Owner–sequenced Wave work                      |         |
| 1.2 | Implementation Package present and complete (template sections filled or N/A justified) |         |
| 1.3 | Product Scope freezes IN / OUT                                                          |         |
| 1.4 | Planning security review / validation plan present                                      |         |
| 1.5 | Planning question answered: implementation can begin without changing planning          |         |
| 1.6 | No Master Plan amendment attempted inside the package                                   |         |
| 1.7 | No Version 2 reopen / Spec amendment / unauthorized ADR                                 |         |
| 1.8 | Live capital not authorized by this planning                                            |         |

**Planning gate:** all 1.x PASS (or N/A) before Approval.

---

## 2. Scope compliance

| #   | Check                                                       | Verdict |
| --- | ----------------------------------------------------------- | ------- |
| 2.1 | Delivered outcomes match IN scope only                      |         |
| 2.2 | OUT items named with later owner or Master Plan deferral    |         |
| 2.3 | Slice does not smuggle later-slice capabilities into UI/API |         |
| 2.4 | Review comments did not silently expand IN                  |         |
| 2.5 | Dual gates (Platform vs Customer Complete) named if used    |         |
| 2.6 | Wave exit / later package outcomes not claimed              |         |

---

## 3. Architecture

| #   | Check                                                                    | Verdict |
| --- | ------------------------------------------------------------------------ | ------- |
| 3.1 | No new bounded context unless Master Plan already named it               |         |
| 3.2 | Dependency direction preserved (ADR-017)                                 |         |
| 3.3 | Canonical Order Path not replaced or duplicated                          |         |
| 3.4 | Ledger remains financial SoT; UI/projections do not become competing SoT |         |
| 3.5 | HTTP remains transport                                                   |         |
| 3.6 | UI remains not Source of Truth                                           |         |
| 3.7 | Provider/transport independence preserved where claimed                  |         |
| 3.8 | Architecture Review artifact PASS for this slice/package                 |         |

---

## 4. Ownership

| #   | Check                                                            | Verdict |
| --- | ---------------------------------------------------------------- | ------- |
| 4.1 | Owns table matches delivered outcomes                            |         |
| 4.2 | Consumes table lists real prerequisites without redesigning them |         |
| 4.3 | Does-NOT-own table complete and accurate                         |         |
| 4.4 | Secrets remain Vault-owned                                       |         |
| 4.5 | Identity/sessions remain Authentication-owned                    |         |
| 4.6 | Permissions remain Authorization-owned                           |         |
| 4.7 | Audit store remains Security Audit-owned (emit ≠ own)            |         |
| 4.8 | No ownership drift vs prior Closed packages                      |         |

---

## 5. Security

| #    | Check                                                                              | Verdict |
| ---- | ---------------------------------------------------------------------------------- | ------- |
| 5.1  | Fail closed on authn/authz/workspace uncertainty                                   |         |
| 5.2  | No plaintext secrets in UI, logs, or responses                                     |         |
| 5.3  | Workspace isolation held (A↛B)                                                     |         |
| 5.4  | Least privilege respected for new surfaces                                         |         |
| 5.5  | STRIDE Threat Review present (post S01-a)                                          |         |
| 5.6  | Security Checklist rows addressed                                                  |         |
| 5.7  | Verification Standard every row PASS / N/A (when required)                         |         |
| 5.8  | Security Regression Suite covers owned fixes (when required)                       |         |
| 5.9  | Live trading / external enablement remains off unless this package owns enablement |         |
| 5.10 | Security Review artifact PASS                                                      |         |

---

## 6. Honest Product

| #   | Check                                                          | Verdict |
| --- | -------------------------------------------------------------- | ------- |
| 6.1 | Status labels match real capability                            |         |
| 6.2 | No fake Connected / live / sent / filled theater               |         |
| 6.3 | Unavailable journeys not presented as available                |         |
| 6.4 | Paper / Vault / Connectivity claims do not imply Live Trading  |         |
| 6.5 | Failures honest and actionable without leaking secrets         |         |
| 6.6 | Customer path needs no SSH / customer `.env` / manual DB edits |         |
| 6.7 | “Customer does NOT receive” visible and accurate               |         |

---

## 7. Validation

| #   | Check                                                               | Verdict |
| --- | ------------------------------------------------------------------- | ------- |
| 7.1 | Validation plan rows mapped to this slice/package                   |         |
| 7.2 | Validation Report exists with PASS evidence                         |         |
| 7.3 | Customer outcomes proven (not mocked helpers)                       |         |
| 7.4 | Isolation / authz denials proven where relevant                     |         |
| 7.5 | OUT-of-scope behaviors not falsely validated as success             |         |
| 7.6 | Walkthrough PASS at Close (package) / slice walkthrough if required |         |

---

## 8. Business value

| #   | Check                                                                                         | Verdict |
| --- | --------------------------------------------------------------------------------------------- | ------- |
| 8.1 | Ordinary operator gains a concrete capability                                                 |         |
| 8.2 | Business problem named and addressed                                                          |         |
| 8.3 | Master Plan metric not regressed (esp. secret exposure, fake Connected, cross-workspace leak) |         |
| 8.4 | Production-readiness residue stated honestly                                                  |         |
| 8.5 | Does not pretend Wave / Live readiness beyond evidence                                        |         |

---

## 9. Regression risk

| #   | Check                                                                | Verdict |
| --- | -------------------------------------------------------------------- | ------- |
| 9.1 | Prior Closed packages not redesigned                                 |         |
| 9.2 | Wave 1 security properties not weakened                              |         |
| 9.3 | Security regressions present for fixed vulns (when standard applies) |         |
| 9.4 | Honesty of prior Connected / Market Data / Paper meanings preserved  |         |
| 9.5 | No silent enablement of live capital or control-plane Telegram/AI    |         |

---

## 10. Documentation completeness

| #    | Check                                                                             | Verdict |
| ---- | --------------------------------------------------------------------------------- | ------- |
| 10.1 | Implementation Report present                                                     |         |
| 10.2 | Architecture / Security / Product Reviews present                                 |         |
| 10.3 | Validation Report present                                                         |         |
| 10.4 | Operator overview updated if customer language changed                            |         |
| 10.5 | Progress / status docs do not contradict evidence (or conflict is flagged for PO) |         |
| 10.6 | At Close: Close Report + Package Summary Standard (8 questions)                   |         |
| 10.7 | Package Summary Q8 = No unauthorized architectural deviation                      |         |

---

## 11. Approval decision

| Field                    | Value                  |
| ------------------------ | ---------------------- |
| Package / Slice          |                        |
| Reviewer (Product Owner) |                        |
| Date                     |                        |
| Planning compliance      | PASS / REQUIRES ACTION |
| Scope compliance         | PASS / REQUIRES ACTION |
| Architecture             | PASS / REQUIRES ACTION |
| Ownership                | PASS / REQUIRES ACTION |
| Security                 | PASS / REQUIRES ACTION |
| Honest Product           | PASS / REQUIRES ACTION |
| Validation               | PASS / REQUIRES ACTION |
| Business value           | PASS / REQUIRES ACTION |
| Regression risk          | PASS / REQUIRES ACTION |
| Documentation            | PASS / REQUIRES ACTION |

### Decision

- [ ] **APPROVE** — next allowed action: _______________________
- [ ] **REJECT / REQUIRES ACTION** — blockers: _________________
- [ ] **CLOSE PACKAGE** (PO only) — gate name: Closed / Platform Complete / Customer Complete
- [ ] **HOLD** — wait for: ____________________________________

### Explicitly not decided by this review

- Wave COMPLETE
- Live Trading
- Master Plan revision
- Ownership change
- Architecture ADR

---

## Quick slice STOP template

```text
Slice:     ________
Verdict:   APPROVE next slice / HOLD / REJECT
Next:      ________
Must not:  Close package · Claim wave exit · Claim Live Trading
Notes:     ________
```

---

**STOP.** Checklists do not replace Master Plan authority or formal package Close.
