# V3-S05 Security Review (planning)

**Package:** V3-S05 Audit Trail Foundation (Security Audit Product)
**Wave:** 1 — Security Foundation
**Status:** Planning security review — Planning Package **Approved**. Not a post-implementation closeout.
**Date:** 2026-08-17
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 and [`v3-security-vision.md`](./v3-security-vision.md)
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)
**Verification Standard:** [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md) — **mandatory** for this package
**Umbrella:** [`v3-s05-implementation-package.md`](./v3-s05-implementation-package.md)
**Scope:** [`v3-s05-product-scope.md`](./v3-s05-product-scope.md)

This review describes **required security outcomes** for V3-S05. It does not describe how to implement them. Authentication remains Authentication. Authorization remains Authorization. Vault remains Vault. Monitoring remains Monitoring. Connections, venues, Telegram, SMTP delivery, AI use, and live trading keep their later owners.

**Planning intent:** rows marked **PASS** mean this package is designed to satisfy the control when implemented. Close requires evidence. **NOT APPLICABLE** names the real owner.

```text
S05 owns forensic security history as a product.
It consumes events; it does not re-own emitters.
Append-only + integrity foundation are Close requirements.
It does not claim monitoring or live financial tamper-evidence complete.
```

---

## Boundary (binding)

| In                                            | Out                                        |
| --------------------------------------------- | ------------------------------------------ |
| Durable append-only Security Event Store      | Application logging platform rewrite       |
| Operator timeline / search / filter           | Grafana / metrics product                  |
| Attribution model                             | Re-implementing Auth / RBAC / Vault        |
| Retention stance (Wave 1 interim)             | Wave 10 compliance final law as owned here |
| Integrity / tamper-evidence foundation        | SEC-16 live financial complete (V3-L03)    |
| SEC-14 security incident durability           | Kill-switch product / live UI              |
| Export of non-secret filtered history (if IN) | Unscoped multi-tenant dumps                |
| Consume S01–S04 events                        | Inventing Connection Management            |

---

## Forensic requirements (security outcomes)

These questions are mandatory for S05 architecture. Close must evidence them. They are not optional backlog.

### A. Events critical for security

Must be persisted when emitted by owners (already named by S01–S04 / Security Vision):

| Event class                                           | Minimum attribution                                   | Secret ban                  |
| ----------------------------------------------------- | ----------------------------------------------------- | --------------------------- |
| Login success / failure / lockout / locked            | Outcome, user id when known, IP/UA as already emitted | No passwords                |
| Session create / refresh / logout / revoke family     | User id, session id (not token), outcome              | No tokens / CSRF secrets    |
| Role assign / refuse / last-Admin refuse              | Actor, subject, from, to, workspace when known        | No passwords                |
| Authz deny on privileged actions (as already emitted) | Actor, action class, outcome                          | No secret bodies            |
| Vault create / revoke / delete / replace / deny       | Actor, workspace, type/purpose, outcome               | No plaintext / wrapping key |
| Platform abuse throttle / shaped deny                 | Type, path, IP, status as already emitted             | No payloads                 |

### B. Events critical for financial integrity (precursors)

S05 must persist precursor classes with correlation quality suitable for later **V3-L03**:

| Precursor                                             | Why                                      |
| ----------------------------------------------------- | ---------------------------------------- |
| Role changes affecting Trader / Admin                 | Who could later initiate capital actions |
| Vault lifecycle for credentials that enable venues/AI | Who made capital connectivity possible   |
| Session revoke-all / family revoke near disputes      | Stolen-session window                    |
| Gate override **attempts** that fail (when emitted)   | Proof of refused financial bypass        |

S05 must **not** claim Ledger equivalence or live place/cancel logging.

### C. Events critical for user trust

| Event class                                                  | Trust outcome                    |
| ------------------------------------------------------------ | -------------------------------- |
| Own-role deny / People refusals                              | Honest explanation trail         |
| Session revoke events                                        | “Was my account used elsewhere?” |
| Password change / recovery outcomes (structured, non-secret) | Account recovery disputes        |

### D. Immutability — cannot change or delete without a trail

| Control                          | Required outcome                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| No update API for audit payloads | Product cannot rewrite history                                                                      |
| No delete API for ordinary Admin | Product cannot erase history silently                                                               |
| Retention                        | If records expire/archive, the action is attributable or host-documented — never silent user delete |
| UI                               | No edit/delete affordances for audit rows                                                           |

### E. Findability

| Control       | Required outcome                                                      |
| ------------- | --------------------------------------------------------------------- |
| Timeline      | Chronological workspace-scoped history                                |
| Filter        | Time, class, actor, outcome at minimum                                |
| Search        | Safe fields; no secret indexing                                       |
| Authorization | Admin (or Master Plan–named equivalent) only for this product surface |
| Isolation     | No cross-workspace audit read                                         |

### F. Future proof the journal was not forged

| Control                        | Required outcome                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Integrity foundation           | Silent mutation of historical records is prevented **or** detectable                                             |
| Verification material          | Integrity metadata available for later verification / export workflows                                           |
| Honest limit                   | Does not claim SEC-16 complete; does not claim resistance to fully compromised host DBAs as a customer guarantee |
| Monitoring of integrity breaks | **NOT APPLICABLE** as product — owner **V3-O05** (may consume signals later)                                     |

Exact cryptographic mechanism is an implementation choice after Approval. The **outcome** is fixed here.

---

## Threat model

From the Security Vision, this package is the primary Wave 1 control for **repudiation resistance** of security and admin actions, and a contributing control for **forensics**, **incident reconstruction**, and **non-repudiation** before live capital.

| Threat                        | Example against this package                    | Required outcome                                     |
| ----------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| **Repudiation**               | Admin denies changing a role                    | Role change is in append-only history with actor     |
| **Tampering**                 | Attacker with app credentials edits past events | Append-only + integrity foundation detects/prevents  |
| **Information disclosure**    | Audit UI shows password or vault plaintext      | Hard secret ban in store, API, UI, export            |
| **IDOR**                      | User reads another workspace’s audit            | Workspace scope fail closed                          |
| **Privilege abuse via audit** | Reader uses audit as reconnaissance             | Admin-only product; minimize sensitive metadata      |
| **Injection via search**      | Search string becomes SQL/command               | Parameterized access; safe query layer               |
| **Export abuse**              | Bulk export of all tenants                      | RBAC + workspace scope; filtered export only         |
| **Flood / DoS**               | Event spam fills store / UI                     | Inherit S04 limits; bounded write/query policy       |
| **Elevation**                 | Viewing audit grants Gate/Risk skip             | Forbidden                                            |
| **Log injection**             | Hostile user-agent poisons timeline rendering   | Encode/escape; treat external strings as text        |
| **Integrity theater**         | UI says “secure audit” but rows are mutable     | Close fails without append-only + integrity evidence |

Out of this review as primary owners: session family revoke mechanics (S01), role assignment rules (S02), vault plaintext ban mechanics (S03), OWASP headers (S04), isolation suite product (S06), monitoring dashboards (O05), live financial action log / SEC-16 (L03).

---

## Threat Review (STRIDE) — planning intent

| Category               | Verdict           | Notes                                                                              |
| ---------------------- | ----------------- | ---------------------------------------------------------------------------------- |
| Spoofing               | **PASS (intent)** | Actor taken from authenticated server context, not client-supplied identity fields |
| Tampering              | **PASS (intent)** | Append-only store + integrity foundation                                           |
| Repudiation            | **PASS (intent)** | Primary package outcome (SEC-09)                                                   |
| Information Disclosure | **PASS (intent)** | Secret ban; RBAC; workspace scope; careful export                                  |
| Denial of Service      | **PASS (intent)** | Query/write bounds; S04 inheritance                                                |
| Elevation of Privilege | **PASS (intent)** | Audit read ≠ role grant; no Gate/Risk skip                                         |

Timing Assessment and Abuse Assessment: required at Close. Planning focus: search/export abuse, event write amplification, and timeline enumeration of other users within a workspace (Admin is allowed; non-Admin is not).

---

## Mandatory topic coverage

| Topic                                  | S05 outcome                                                       | Owner if not S05                                      |
| -------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| Append-only audit product              | Primary                                                           | —                                                     |
| Secret exclusion from audit            | Primary                                                           | Emitters must cooperate (already required in S01–S04) |
| Workspace isolation of audit reads     | Primary                                                           | Isolation **suite** product still S06                 |
| RBAC for audit UI/API                  | Primary (uses S02 permissions)                                    | S02 owns matrix                                       |
| Integrity / tamper evidence foundation | Primary                                                           | SEC-16 completion L03                                 |
| SEC-14 incident durability             | Primary (security class)                                          | Recovery Incident idea reused, not duplicated blindly |
| Monitoring / alerting                  | N/A                                                               | V3-O05                                                |
| Financial action logging               | N/A                                                               | V3-L03                                                |
| Injection on search/export             | Primary                                                           | —                                                     |
| CSRF on audit mutations                | N/A if no mutations; if export triggers POST, cookie CSRF applies | S01/S04 cookie policy                                 |
| XSS in timeline rendering              | Primary (encode event text)                                       | —                                                     |

---

## Security Checklist — planning intent (summary)

| #                             | Control area                                                           | Intent |
| ----------------------------- | ---------------------------------------------------------------------- | ------ |
| Audit review                  | **PASS (intent)** — this **is** the audit product                      |
| Logging / monitoring failures | **PASS (intent)** for durable audit; monitoring product **N/A → O05**  |
| Repudiation (STRIDE)          | **PASS (intent)**                                                      |
| Information disclosure        | **PASS (intent)** — secret ban                                         |
| IDOR                          | **PASS (intent)** — workspace scope                                    |
| Injection                     | **PASS (intent)** — search/export                                      |
| CSRF                          | **PASS / N/A** — no history mutation; protect any cookie POST (export) |
| Secrets in logs/audit         | **PASS (intent)** — forbidden                                          |

Full checklist completed with evidence at Close.

---

## OWASP / ASVS-oriented map (planning)

| Concern                   | S05 control                              |
| ------------------------- | ---------------------------------------- |
| Security logging failures | Durable store + product view (SEC-09)    |
| Insufficient audit        | Timeline + search + attribution          |
| Sensitive data exposure   | Secret ban; minimize PII beyond need     |
| Broken access control     | Admin-only; workspace fail closed        |
| Injection                 | Parameterized queries; output encoding   |
| Integrity failures        | Append-only + tamper-evidence foundation |

---

## Security Verification Standard — planning intent map

Every row must be filled at Close with evidence. Below is **intent ownership** so implementers do not mis-claim PASS.

| Theme                       | S05 intent                                      | Typical N/A owners |
| --------------------------- | ----------------------------------------------- | ------------------ |
| Authn / sessions            | Consume events; do not re-own                   | S01                |
| Authz / RBAC                | Gate audit product; do not re-own matrix        | S02                |
| Vault / secrets             | Consume vault events; never store secrets       | S03                |
| HTTP hardening              | Inherit                                         | S04                |
| Audit product               | **Own**                                         | —                  |
| Isolation suite             | Contribute workspace audit tests; suite product | S06                |
| Monitoring                  | Emit durable history only                       | O05                |
| Live financial log / SEC-16 | Foundation only                                 | L03                |

Security Regression Suite: mandatory for every found-and-fixed S05 defect (especially secret leak, cross-workspace audit read, history mutation, integrity bypass).

---

## Explicit non-claims

| Claim                                      | Status                |
| ------------------------------------------ | --------------------- |
| Wave 1 exit complete                       | **No** — S06 remains  |
| Monitoring product shipped                 | **No** — O05          |
| Live trading safe                          | **No** — Wave 6       |
| Financial action log complete              | **No** — L03 / SEC-10 |
| Live tamper-evident financial ops complete | **No** — SEC-16       |
| Unforgeable against compromised host DBA   | **No** — honest limit |
| Penetration test substitute                | **No**                |

---

## Mandatory questions (security lens)

1. **What does the customer receive?** Forensic-capable Security Audit Product (store, timeline, search/filter, attribution, retention stance, integrity foundation, optional export).
2. **What does the customer NOT receive?** Monitoring, editable history, Vault/Connections/Live products, L03/SEC-16 completion.
3. **What business problem does S05 solve?** Non-repudiation and forensic reconstructability of security-relevant actions as a product.
4. **What consumes S05 later?** O05, L03, Wave 2 event emitters, compliance.
5. **New bounded context?** **No.**
6. **Master Plan respected?** **Yes (planning).**
7. **Product Principles respected?** **Yes (planning)** — especially Everything Is Auditable and Honest Product.

---

## Status

**Approved.** Implementation may begin. Close still requires evidence for every forensic requirement above. Classification companion: [`security-event-classification.md`](./security-event-classification.md).
