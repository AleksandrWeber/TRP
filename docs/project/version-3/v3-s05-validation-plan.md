# V3-S05 Validation Plan

**Package:** V3-S05 Audit Trail Foundation (Security Audit Product)
**Wave:** 1 — Security Foundation
**Status:** Planning — Package **Approved**. Not executed until after implementation.
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Scope:** [`v3-s05-product-scope.md`](./v3-s05-product-scope.md)
**Security:** [`v3-s05-security-review.md`](./v3-s05-security-review.md)
**Umbrella:** [`v3-s05-implementation-package.md`](./v3-s05-implementation-package.md)
**Overview:** [`security-audit-overview.md`](./security-audit-overview.md)
**Checklists:** [`version-3-product-checklist.md`](./version-3-product-checklist.md) · [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md) · [`version-3-security-checklist.md`](./version-3-security-checklist.md)
**Verification Standard:** [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a repository method was called without proving events survive restart and appear in the Admin timeline, or claim integrity without a mutation/detection case) do **not** count as Close evidence.

Do not validate Binance I/O, Telegram send, SMTP send, AI chat, Vault Customer Complete UI, Isolation suite product, monitoring dashboards, or live trading. Validate the **Security Audit Product**.

---

## Product Owner Planning Alignment

**Accepted:** 2026-08-17. This planning-only alignment changes slice sequence,
not architecture or validation ownership.

| Slice | Validation focus                                                         |
| ----- | ------------------------------------------------------------------------ |
| S05-a | Classified append-only Security Event Store                              |
| S05-b | Investigation Timeline chronology, grouping, navigation, workspace scope |
| S05-c | Integrity / tamper evidence                                              |
| S05-d | Incident attribution, criticality, durable incident reconstruction       |
| S05-e | Retention, export, Close evidence                                        |

S05-b validates a read model; it does not claim search, filtering, export, UI,
or incident durability. S05-d must validate an Incident-first model:
**Incident → contains → Events**, while preserving immutable recorded events.

---

## 0. What Close means for S05

| Gate            | Meaning                                                                                                      | Unlocks                                |
| --------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| **S05 Closed**  | SEC-09 / SEC-14 Security Audit Product is durable, searchable, append-only, integrity-founded, and validated | V3-S06 Implementation Package may open |
| **Not claimed** | Wave 1 exit                                                                                                  | Still needs S06                        |
| **Not claimed** | Connection Management                                                                                        | Wave 2 after Wave 1 exit               |
| **Not claimed** | Monitoring / Grafana                                                                                         | V3-O05                                 |
| **Not claimed** | Financial action log / SEC-16                                                                                | V3-L03                                 |

There is no dual Platform/Customer Complete split for S05. The audit store and the operator surface close together as one Security Audit Product. Forensic requirements are Close gates, not deferred polish.

---

## 1. Unit tests

| Area                             | Must prove                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Append-only store                | Update/delete of persisted security events is refused or impossible on product paths        |
| Attribution                      | Required fields present (actor when known, time, workspace scope, event class, outcome)     |
| Secret ban                       | Passwords, tokens, vault plaintext, wrapping keys never enter persisted records             |
| Criticality / classification map | Security / trust / financial-precursor classes resolve for known event types                |
| Integrity foundation             | Mutation of stored history fails closed or is detectable via integrity check                |
| Search/filter helpers            | Query constraints do not allow cross-workspace leakage in the data layer                    |
| Export shaping (if IN)           | Export omits secrets; respects workspace scope                                              |
| Retention policy helper          | Retention behavior matches documented stance; no silent Admin delete disguised as retention |

---

## 2. Integration tests

| Case                    | Must prove                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Consume auth events     | Login failure/success/lockout (as applicable) appear in durable store after action |
| Consume session events  | Create/logout/revoke family events persist                                         |
| Consume role events     | Role assign and refuse persist with actor/subject/from/to                          |
| Consume vault events    | Create/revoke/delete (and deny when exercised) persist without secret material     |
| Consume platform events | Abuse throttle / shaped deny persist                                               |
| Survive restart         | Persisted events remain after process restart                                      |
| Admin timeline API      | Administrator can list workspace-scoped history                                    |
| Search/filter API       | Known event is findable by filter/search                                           |
| Non-Admin deny          | Reader/Researcher/Trader cannot read audit product                                 |
| Cross-workspace deny    | User in A cannot read B’s audit history                                            |
| No mutation API         | PATCH/DELETE (or equivalent) on audit events fails                                 |
| Integrity check         | Tampered row/sequence fails verification                                           |
| S01–S04 unregressed     | Login, People, Vault platform path, hardening still work                           |
| No financial bypass     | Audit product does not expose Gate/Risk/Ledger skip                                |

---

## 3. UI tests

| Case                    | Must prove                                                                     |
| ----------------------- | ------------------------------------------------------------------------------ |
| Timeline UX             | Administrator sees Security Audit / Security History with chronological events |
| Filter/search UX        | Administrator can narrow to a known event class                                |
| Attribution UX          | Actor/time/outcome visible in operator language                                |
| No secrets in UI        | Event detail shows no password/token/vault plaintext                           |
| No edit/delete controls | History rows are not editable/deletable                                        |
| Non-Admin UX            | Security Audit unavailable or honestly denied                                  |
| Export UX (if IN)       | Filtered export succeeds for Admin; denied for others                          |

---

## 4. Manual Product Walkthrough

```text
Security Audit Walkthrough

□ Sign in as Administrator
□ Cause or locate at least one known prior-class event (role change and/or failed sign-in class and/or vault lifecycle as available in the environment)
□ Open Security Audit / Security History
□ Confirm the event appears on the timeline
□ Filter or search until the event is isolated
□ Confirm attribution is understandable
□ Confirm no secrets appear
□ Confirm edit/delete is not offered (or is refused)
□ Sign in as non-Administrator → denied / unavailable
□ Confirm paper remains default; no Connections / live / monitoring claims on this surface

PASS / REQUIRES ACTION
```

---

## 5. Forensic validation gates (mandatory)

These gates exist because S05 is forensic audit, not a log viewer.

| Gate                             | Must prove                                                                                                                       | Fail if                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Security-critical coverage**   | Auth, session, role, vault, platform classes persist when emitted                                                                | Only one emitter class stored “as demo”                                                       |
| **Event Minimalism**             | Each persisted class has an investigation purpose; one security outcome is not redundantly represented as multiple audit stories | Routine technical noise, duplicate audit rows, or unclassified events bury meaningful history |
| **Financial-precursor coverage** | Role and vault events that change capital-adjacent power are attributable                                                        | Trader/Admin role changes missing from history                                                |
| **Trust coverage**               | Deny/refuse events needed for operator explanation are present when emitted                                                      | Own-role deny / authz refuse vanish                                                           |
| **Immutability**                 | Ordinary product paths cannot alter/erase history                                                                                | Admin can edit/delete events                                                                  |
| **Findability**                  | Operator finds a known event via product search/filter                                                                           | Only engineers can find it                                                                    |
| **Integrity / tamper evidence**  | Integrity foundation detects or prevents silent mutation                                                                         | History rewrite leaves no signal                                                              |
| **Honest non-claims**            | UI/docs do not claim monitoring or SEC-16 complete                                                                               | Marketing language overclaims                                                                 |

---

## 6. Architecture verification

At Close, complete [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md).

Planning expectations that must remain true:

- No new bounded context
- No ownership of Auth / RBAC / Vault / Monitoring / Ledger
- Audit store is not a second money SoT
- HTTP remains transport; UI is not Source of Truth for security decisions (it displays history of decisions already made by owners)

---

## 7. Product verification

At Close, complete [`version-3-product-checklist.md`](./version-3-product-checklist.md).

Must include Security Audit Walkthrough **PASS** with Product Owner acceptance recorded in Product Review.

---

## 8. Security verification

At Close:

1. Complete [`version-3-security-checklist.md`](./version-3-security-checklist.md) with evidence.
2. Complete STRIDE + Timing + Abuse in the Security Review.
3. Complete every row of [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md).
4. Run Security Regression Suite for every S05-owned defect found and fixed.
5. Evidence the forensic gates in §5.

---

## 9. Master Plan / Product Principles gates

| Gate                         | Pass condition                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| Master Plan                  | SEC-09 / SEC-14 outcomes met; Wave 1 append-only audit line met; no Master Plan edits |
| Everything Is Auditable      | Security-relevant admin/authz/vault/platform actions are attributable in the product  |
| Honest Product               | No claim of Wave 1 complete, monitoring, or live financial log                        |
| Security Before Convenience  | Append-only and integrity foundation not weakened for demo convenience                |
| Customer First               | Operators use product UI, not SSH                                                     |
| Architecture Is a Constraint | No new bounded context; no second ledger                                              |

---

## 10. Evidence pack (Close)

| Artifact                     | Required |
| ---------------------------- | -------- |
| Implementation Report        | Yes      |
| Architecture Review          | Yes      |
| Security Review (evidence)   | Yes      |
| Product Review + Walkthrough | Yes      |
| This Validation Plan results | Yes      |
| Package Close record         | Yes      |

---

## Mandatory questions (validation lens)

1. **What does the customer receive?** Validated Security Audit Product meeting §0–§5.
2. **What does the customer NOT receive?** Anything in product-scope OUT list — confirmed absent from Close claims.
3. **Business problem solved?** Forensic searchable trustworthy security history — evidenced by walkthrough + immutability/integrity tests.
4. **Later consumers?** Documented ingest readiness; O05/L03/Wave 2 not falsely marked shipped.
5. **New bounded context?** Must remain **No** at Close.
6. **Master Plan respected?** Evidence required.
7. **Product Principles respected?** Evidence required.

---

**Approved package.** Execute this plan after slices are implemented. Include [`incident-investigation-walkthrough.md`](./incident-investigation-walkthrough.md) as a manual investigation fitness check at Product Review / Validation. After Close, open V3-S06 at Implementation Package.
