# V3-S06 Security Review (planning)

**Package:** V3-S06 Workspace Isolation Hardening
**Wave:** 1 — Security Foundation
**Status:** **CLOSED** — post-implementation Close verdict recorded in
[`v3-s06-close-report.md`](./v3-s06-close-report.md).
**Date:** 2026-08-17
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 and [`v3-security-vision.md`](./v3-security-vision.md)
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)
**Verification Standard:** [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md) — **mandatory** for this package
**Default Policy:** [`security-default-policy.md`](./security-default-policy.md)
**Umbrella:** [`v3-s06-implementation-package.md`](./v3-s06-implementation-package.md)
**Scope:** [`v3-s06-product-scope.md`](./v3-s06-product-scope.md)
**Matrix:** [`wave-1-isolation-matrix.md`](./wave-1-isolation-matrix.md)

This review describes **required security outcomes** for V3-S06. It does not describe how to implement them. Authentication remains Authentication. Authorization remains Authorization. Vault remains Vault. Audit remains Audit. Security Platform remains Security Platform. Connections, venues, Telegram, SMTP delivery, AI use, and live trading keep their later owners.

**Planning intent:** rows marked **PASS** mean this package is designed to satisfy the control when implemented. Close requires evidence. **NOT APPLICABLE** names the real owner.

```text
S06 owns isolation proof — not tenancy redesign.
Cross-workspace denial must be evidenced, not assumed.
Prior package Close is not isolation credit.
Wave 1 COMPLETE still requires Certification Audit after S06 Close.
```

---

## Boundary (binding)

| In                                                      | Out                                                  |
| ------------------------------------------------------- | ---------------------------------------------------- |
| Isolation proof across Wave 1 security products         | New Isolation bounded context                        |
| Cross-workspace denial suite                            | Connection Management product                        |
| Fail-closed tenancy verification                        | Exchange / live trading isolation productization     |
| Isolation regression suite                              | Monitoring / alerting product                        |
| Connection Management **boundary** (unavailable / deny) | Implementing Connections wizards                     |
| Evidence for Wave 1 exit isolation rows                 | Claiming Wave 1 COMPLETE without Certification Audit |
| Verification of S01–S05 isolation properties            | Re-owning Auth / RBAC / Vault / Audit                |

---

## Isolation security outcomes (mandatory)

### A. Isolation Principles (security meaning)

| Principle                       | Required outcome                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| Prove, don’t assume             | Every applicable matrix surface has executed PASS evidence in S06; each N/A has an explicit reason |
| Fail closed                     | Missing, forged, or wrong workspace context denies                                                 |
| No cross-tenant read            | A cannot obtain B identifiers/payloads beyond honest deny policy                                   |
| No cross-tenant mutate          | A cannot change B’s people, secrets, sessions, audit, or incidents                                 |
| No tenancy SoT fork             | Membership / workspace gate stays with existing owners                                             |
| No credit from prior Close      | S01–S05 Close ≠ automatic S06 matrix PASS                                                          |
| Boundary for future Connections | Wave 2 must inherit a proved boundary, not a hole                                                  |

### B. Surfaces that must not leak

| Surface                           | Leak example                                     | Required outcome                                                                                                                                          |
| --------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication / identity binding | Act as B’s operator via A session                | Deny; no subject swap                                                                                                                                     |
| Session                           | List or revoke B’s sessions from A               | Deny; no B session payloads                                                                                                                               |
| RBAC / People                     | Role in A substitutes for membership in B        | Deny; People remains the approved Identity-global Admin projection and role ≠ membership                                                                  |
| Vault                             | Read/list/lifecycle B secrets from A             | Deny; ownership fail closed                                                                                                                               |
| Security Audit store              | Read/write B audit rows from A                   | Deny; scope fail closed                                                                                                                                   |
| Timeline                          | Cursor hop into B events                         | Deny; no B events in A timeline                                                                                                                           |
| Incidents                         | Link B evidence into an A incident               | Deny; no mixed evidence; investigate/export are internal-only foundations with no customer HTTP caller                                                    |
| Security Platform                 | N/A tenant-state ownership                       | **NOT APPLICABLE** — Platform hardening is evidenced by V3-S04 Close; Authentication, Session, Vault, Audit, Timeline, and Workspace own tenant isolation |
| Connection Management boundary    | Partial Connections API that reads B credentials | Not available / deny; no product                                                                                                                          |

### C. Side-channels

| Risk                      | Required outcome                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty list vs forbid      | Prefer consistent honest deny for non-members; do not teach attackers which foreign ids exist beyond approved anti-enumeration policy from S04 |
| Error messages            | No B secret material; no stack traces that include B payloads                                                                                  |
| Export / timeline cursors | Cannot be manipulated into B                                                                                                                   |
| Timing oracles            | Not a Close substitute for functional deny; do not introduce new obvious cross-tenant oracles in S06 work                                      |

---

## Threat model

From the Security Vision, this package is the primary Wave 1 control for **workspace isolation proof** (SEC-11 Wave 1) and a contributing control against **data theft** and **broken access control** across tenants.

| Threat                              | Example against this package                                            | Required outcome                                    |
| ----------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| **IDOR / BOLA**                     | Guess B’s ids from A session                                            | Fail closed deny; no B payloads                     |
| **Broken access control**           | Role in A implies read of B                                             | Privilege never crosses workspace                   |
| **Information disclosure**          | Audit/timeline/export leaks B                                           | Workspace scope on all audit reads                  |
| **Credential theft amplification**  | Stolen A session reads B vault                                          | Vault ownership deny                                |
| **Session fixation across tenants** | A cookie authorizes B                                                   | Session binding stays workspace-correct             |
| **Privilege escalation via People** | Assign Admin in B from A                                                | People/role APIs scoped                             |
| **Integrity theater**               | Docs say isolated; suite missing                                        | Close fails without matrix PASS                     |
| **Scope creep as bypass**           | “Temporary” Connections stub reads all vaults                           | Forbidden; boundary deny only                       |
| **Elevation**                       | Isolation engineer path skips Gate/Risk                                 | Forbidden                                           |
| **Repudiation of deny**             | Cross-tenant deny not attributable where product already records denies | Keep existing audit emit rules; do not strip events |

Out of this review as primary owners: session family revoke mechanics (S01), role matrix content (S02), vault encryption (S03), CSP/rate limits as products (S04), audit append-only store (S05), monitoring dashboards (O05), live financial action log (L03), Connection Management (Wave 2).

---

## Threat Review (STRIDE) — planning intent

| Category               | Verdict           | Notes                                                                                        |
| ---------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| Spoofing               | **PASS (intent)** | Cross-workspace identity spoof denied; actor from server session, not client workspace claim |
| Tampering              | **PASS (intent)** | Cross-workspace mutation denied; no rewrite of B’s audit/vault via A                         |
| Repudiation            | **PASS (intent)** | Isolation denials remain compatible with existing audit attribution where already required   |
| Information Disclosure | **PASS (intent)** | Primary package outcome — A ↛ B                                                              |
| Denial of Service      | **PASS (intent)** | Suite must not require disabling S04 limits; isolation fails closed under load shaping       |
| Elevation of Privilege | **PASS (intent)** | Cross-tenant privilege path forbidden; no Gate/Risk skip                                     |

Timing Assessment and Abuse Assessment: required at Close. Planning focus: IDOR probing, timeline cursor abuse, vault foreign-id probing, People enumeration across tenants, export scope abuse.

---

## Mandatory topic coverage

| Topic                             | S06 outcome                                                     | Owner if not S06                              |
| --------------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| Workspace isolation suite product | Primary                                                         | —                                             |
| Cross-workspace denial            | Primary                                                         | —                                             |
| Isolation regression              | Primary                                                         | Retained tests also stay with owning packages |
| Auth/session isolation rules      | Verify                                                          | S01 owns mechanics                            |
| RBAC/People isolation rules       | Verify                                                          | S02 owns mechanics                            |
| Vault secret isolation            | Verify                                                          | S03 owns mechanics                            |
| Audit/Timeline/Incident isolation | Verify                                                          | S05 owns mechanics                            |
| Platform tenancy                  | N/A tenant-state row; reference V3-S04 Close hardening evidence | S04 owns platform controls                    |
| Connection Management product     | N/A                                                             | Wave 2                                        |
| Encryption at rest                | N/A                                                             | S03                                           |
| Monitoring of isolation breaks    | N/A                                                             | V3-O05 may consume later                      |

---

## Security Checklist — planning intent (summary)

| #                               | Control area                                                              | Intent |
| ------------------------------- | ------------------------------------------------------------------------- | ------ |
| Workspace isolation             | **PASS (intent)** — this **is** the isolation proof package               |
| Permission review               | **PASS (intent)** — cross-workspace privilege paths denied                |
| Broken access control / IDOR    | **PASS (intent)** — matrix negatives                                      |
| Secret storage                  | **N/A as owner** — verify Vault isolation only (S03)                      |
| Audit review                    | **PASS (intent)** — verify audit/timeline/incident scope (S05 owns store) |
| Error leakage                   | **PASS (intent)** — no B payloads in denials                              |
| Secure-by-default / fail closed | **PASS (intent)** — Security Default Policy                               |
| Zero Trust (workspace boundary) | **PASS (intent)** — verify membership gate; do not invent ABAC engine     |
| Financial Integrity review      | **PASS (intent)** for precursors — secrets/roles cannot cross tenants     |
| Connection security review      | **N/A product** — boundary only; Wave 2 owns Connections                  |

Full checklist completed with evidence at Close.

---

## OWASP / ASVS-oriented map (planning)

| Concern                                    | S06 control                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| Broken access control                      | Cross-workspace deny suite                                                      |
| Broken object level authorization (API)    | Foreign id negatives on every matrix surface                                    |
| Sensitive data exposure                    | No B secrets/sessions/audit in A responses                                      |
| Security misconfiguration                  | Fail closed when workspace context missing                                      |
| Identification and authentication failures | Session cannot authorize foreign workspace                                      |
| Improper inventory management              | Every Wave 1 security-relevant route accounted in the Close ownership inventory |

---

## Security Verification Standard — planning intent map

Every row must be filled at Close with evidence. Below is **intent ownership** so implementers do not mis-claim PASS.

| Theme                         | S06 intent                                                           | Typical N/A owners                |
| ----------------------------- | -------------------------------------------------------------------- | --------------------------------- |
| Authentication                | Verify isolation of session/identity binding                         | S01 owns login/recovery mechanics |
| Authorization                 | Verify People/role/workspace scope                                   | S02 owns matrix content           |
| Session                       | Verify A session ↛ B                                                 | S01                               |
| Secrets / vault               | Verify A ↛ B secrets                                                 | S03 encryption                    |
| Privacy §13.2 / 13.3          | **Primary PASS target** — workspace isolation & cross-tenant leakage | —                                 |
| Injection                     | Only if S06 adds query surfaces; else inherit                        | Owning APIs                       |
| SSRF                          | N/A                                                                  | S04 / Wave 5                      |
| AI isolation                  | N/A unless AI path touched                                           | Later AI packages                 |
| Secure headers                | N/A as owner                                                         | S04                               |
| Security Regression Suite §19 | **Primary** — isolation defects leave lasting tests                  | —                                 |

---

## Isolation Regression Strategy (security binding)

| Rule                                     | Meaning                                                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Every fixed isolation hole leaves a test | Security Verification Standard §19                                                                         |
| Matrix row ↔ automated case family       | No orphan rows                                                                                             |
| Ordinary CI                              | Isolation suite runs with ordinary tests — not a manual-only ritual                                        |
| No flaky credit                          | Flakes are REQUIRES ACTION, not PASS                                                                       |
| Cross-product                            | A Vault fix must not silently break Audit scope tests (and vice versa)                                     |
| Future Connections                       | When Wave 2 opens, new connection routes must add matrix rows — S06 documents the boundary expectation now |

---

## Threats this package must reduce

| Threat (from Security Vision)       | Control in this package                          |
| ----------------------------------- | ------------------------------------------------ |
| Data theft across tenants           | Cross-workspace deny suite                       |
| Broken access control / IDOR        | Matrix negatives on all Wave 1 security surfaces |
| Credential leakage amplification    | Vault foreign-workspace deny proof               |
| Audit reconnaissance across tenants | Timeline/incident/export scope proof             |

## Controls explicitly not this package

| Control                                  | Owner           |
| ---------------------------------------- | --------------- |
| Password/session cryptography            | S01             |
| Role catalog / People UI product         | S02             |
| Vault encryption / wrapping keys         | S03             |
| CSP / rate limit / CSRF platform         | S04             |
| Append-only audit store                  | S05             |
| Connection wizards / vendor I/O          | Wave 2 / Wave 4 |
| Monitoring alerts on isolation anomalies | V3-O05          |
| Wave 9 team isolation remainder          | Wave 9          |

---

## STOP

Planning only. **Do not implement** until Product Owner approves V3-S06.
Close requires evidence for every checklist / Verification Standard / Threat Review row owned by S06.
**Wave 1 COMPLETE** still requires the independent Certification Audit after S06 Close.
