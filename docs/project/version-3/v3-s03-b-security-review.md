# V3-S03-b Security Review

**Package:** V3-S03 Secret Vault & Encryption
**Slice:** S03-b — Encryption and wrapping-key separation
**Wave:** 1 — Security Foundation
**Date:** 2026-08-17
**Stage:** Post-implementation slice review — **not** package Close
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 · [`v3-security-vision.md`](./v3-security-vision.md)
**Planning review:** [`v3-s03-security-review.md`](./v3-s03-security-review.md) (unmodified)
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)
**Nature:** Security review. Not an RC. Not an ADR. Not the audit product.

This review records evidence for **S03-b**. Items owned by later S03 slices are **NOT APPLICABLE** here with that owner. They are not PASS. Package Close cannot occur while those remain unimplemented.

---

## Slice verdict

**PASS for S03-b.** Customer vendor secrets are not persisted as plaintext. Envelope wrap uses a host wrapping key that is not stored with ciphertext. Missing wrapping key fails closed without taking down paper, authentication, or research. Wrong wrapping key fails closed: the secret stays unavailable; the failure is clear; paper continues. List/metadata models have no secret fields. There is no customer API that returns secret material.

Package security exit (Vault UI, C8 HTTP, adapter consumers, structured events) is **not** claimed.

---

## Security outcomes evidenced

| Outcome                           | Evidence                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plaintext never persisted         | Store writes ciphertext. Snapshot JSON does not contain submitted field values. Process-memory and production-like both refuse plaintext persist |
| Wrapping key required             | Store and retrieve call `requireWrappingKey`. Unset source throws `VaultUnavailableError`                                                        |
| Missing wrapping key fails closed | Store/retrieve unavailable. `wrappingKeyUnsetMustFailApiBoot()` is false                                                                         |
| Wrong wrapping key fails closed   | Retrieve throws `VaultUnavailableError`. Secret remains unavailable. Paper capability continues                                                  |
| Secret never readable by API      | No Vault HTTP. Metadata has no secret fields. Operator labels are Stored / Vault Connected / Revoked                                             |
| Encryption integrity              | Tampered payload fails unwrap. Workspace binding mismatch fails unwrap                                                                           |
| Memory handling                   | Plaintext exists for validate-then-wrap and for authorized retrieve. Wrap wipes data-key and wrap-key buffers. Records retain ciphertext only    |
| Classification                    | Wrapping key is host. Storing `VAULT_WRAPPING_KEY` as a Vault type is rejected                                                                   |

Implementation wrap (not Master Plan): envelope-style wrap with a per-secret data key, host wrapping key derived per record, authenticated unwrap. Losing the database alone does not yield usable customer keys. Losing or replacing the wrapping key makes stored secrets unusable until the customer re-stores under a working wrapping key.

---

## Checklist (S03-b evidence)

| #   | Control                    | Verdict            | Evidence or owner                                                                                                                             | Action |
| --- | -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Authentication             | **NOT APPLICABLE** | No Vault HTTP. Owner: **V3-S01**. Binding routes is **S03-e**                                                                                 |        |
| 2   | Authorization              | **NOT APPLICABLE** | C8 HTTP is **S03-e**. Domain workspace match from S03-a remains                                                                               |        |
| 3   | OWASP Top 10 review        | **PASS**           | Worksheet below. Cryptographic failures are the in-scope class                                                                                |        |
| 4   | Input validation           | **NOT APPLICABLE** | Typed holdable contracts are **S03-c**. Generic non-empty fields remain from S03-a                                                            |        |
| 5   | Output encoding            | **PASS**           | No UI. Metadata JSON has no secret material                                                                                                   |        |
| 6   | Session review             | **NOT APPLICABLE** | **V3-S01**                                                                                                                                    |        |
| 7   | Credential review          | **NOT APPLICABLE** | Login passwords **V3-S01**. Vault does not hash vendor secrets as passwords                                                                   |        |
| 8   | Secret storage             | **PASS**           | Primary control of this slice. Ciphertext at rest. Wrapping key not with ciphertext. No customer `.env` path                                  |        |
| 9   | Rate limiting              | **NOT APPLICABLE** | No new endpoints. **V3-S04**                                                                                                                  |        |
| 10  | Replay protection          | **NOT APPLICABLE** | No new tokens. **V3-S01** / **V3-L05**                                                                                                        |        |
| 11  | CSRF                       | **NOT APPLICABLE** | No cookie mutations. **S03-e** / **V3-S01**                                                                                                   |        |
| 12  | XSS                        | **NOT APPLICABLE** | No UI. **S03-d** / **V3-S04**                                                                                                                 |        |
| 13  | Injection review           | **PASS**           | Secrets treated as opaque material. Prisma parameterized upsert. No string-built SQL                                                          |        |
| 14  | Logging review             | **NOT APPLICABLE** | Structured vault events are **S03-e**. This slice does not log plaintext or wrapping keys                                                     |        |
| 15  | Audit review               | **NOT APPLICABLE** | Events **S03-e**. Product **V3-S05**                                                                                                          |        |
| 16  | Error leakage review       | **PASS**           | Missing and wrong wrapping key both fail closed as Vault unavailable / credential cannot be used. Errors do not echo secrets or wrapping keys |        |
| 17  | Permission review          | **NOT APPLICABLE** | C8 bind is **S03-e**                                                                                                                          |        |
| 18  | Workspace isolation        | **PASS**           | Ciphertext is bound to workspace/type/purpose. Foreign workspace still denied. Isolation **product** is **V3-S06**                            |        |
| 19  | Financial Integrity review | **PASS**           | Ledger untouched                                                                                                                              |        |
| 20  | Secure-by-default review   | **PASS**           | No plaintext persist. Missing wrapping key does not silently store plaintext                                                                  |        |
| 21  | Zero Trust review          | **PASS**           | Decrypt is server-side retrieve only. Browser is not a decrypt client. No HTTP                                                                |        |
| 22  | Least Privilege review     | **PASS**           | Metadata never secret material. Retrieve is not a customer API                                                                                |        |
| 23  | AI safety review           | **PASS**           | OpenRouter material may be stored as ciphertext. AI is not invoked                                                                            |        |
| 24  | Connection security review | **NOT APPLICABLE** | No connections product. Secrets are collected into Vault when stored. Owner of wizard: Wave 2                                                 |        |

---

## OWASP Top 10 worksheet

| OWASP class                                | Verdict            | Notes / owner                                                                          |
| ------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------- |
| Broken access control                      | **NOT APPLICABLE** | HTTP bind **S03-e**. Domain workspace deny remains                                     |
| Cryptographic failures                     | **PASS**           | Ciphertext at rest, wrapping-key separation, fail closed on missing/wrong key          |
| Injection                                  | **PASS**           | Opaque secrets; parameterized persist                                                  |
| Insecure design                            | **PASS**           | Browser is not a decrypt client. No support backdoor. No plaintext fallback            |
| Security misconfiguration                  | **PASS**           | Production-like refuses plaintext persist. Missing wrapping key does not fail API boot |
| Vulnerable and outdated components         | **NOT APPLICABLE** | **V3-S04**                                                                             |
| Identification and authentication failures | **NOT APPLICABLE** | **V3-S01**                                                                             |
| Software and data integrity failures       | **PASS**           | Server owns wrap. Tamper and wrong key fail closed                                     |
| Security logging and monitoring failures   | **NOT APPLICABLE** | Events **S03-e**; product **V3-S05**                                                   |
| Server-side request forgery (SSRF)         | **NOT APPLICABLE** | No vendor I/O. **S03-c** / **V3-S04**                                                  |

---

## Threat Review (lightweight STRIDE)

| Category                   | What PASS requires (this package)                                                       | Verdict            | Notes / owner                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| **Spoofing**               | Attacker cannot pretend to be an operator on Vault APIs                                 | **NOT APPLICABLE** | No Vault HTTP. **S03-e** / **V3-S01**                                          |
| **Tampering**              | Client cannot alter ciphertext, status, or workspace binding in a way the server honors | **PASS**           | Server owns wrap. Tampered ciphertext and binding mismatch fail closed         |
| **Repudiation**            | Create / revoke / delete are attributable                                               | **NOT APPLICABLE** | Events **S03-e**. Audit product **V3-S05**                                     |
| **Information Disclosure** | No plaintext in API, UI, or logs. Cross-workspace no leak                               | **PASS**           | Primary STRIDE row. Ciphertext persist. Metadata only. No HTTP secret readback |
| **Denial of Service**      | Unbounded vault writes considered                                                       | **NOT APPLICABLE** | No HTTP. Size bounds remain from S03-a. Platform **V3-S04**                    |
| **Elevation of Privilege** | Vault does not grant Admin, live, or foreign workspace power                            | **PASS**           | Encryption does not grant roles. Wrong wrapping key does not yield plaintext   |

---

## Timing Assessment

Could observable timing reveal protected information?

Assessment only. No dummy delays were added.

| Surface                                          | What PASS requires (this package)                                          | Verdict            | Notes / owner                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Authentication**                               | Known vs unknown identity timing                                           | **NOT APPLICABLE** | **V3-S01**                                                                                                                     |
| **Credential validation**                        | Password compare timing                                                    | **NOT APPLICABLE** | **V3-S01**. Vault validation is field presence (**S03-c**)                                                                     |
| **Recovery flow**                                | Recovery enumeration timing                                                | **NOT APPLICABLE** | **V3-S01**                                                                                                                     |
| **Session validation**                           | Valid/invalid/revoked session timing                                       | **NOT APPLICABLE** | **V3-S01**                                                                                                                     |
| **Vault retrieve / wrapping key** _(this slice)_ | Missing vs wrong wrapping key must not become a practical plaintext oracle | **PASS**           | Both fail closed as unavailable. Retrieve does not return secret material. Foreign workspace remains isolation deny from S03-a |

```text
Missing wrapping key   Vault unavailable     PASS
Wrong wrapping key     Credential unusable   PASS
Tampered ciphertext    Credential unusable   PASS
Foreign workspace      Isolation deny        PASS (S03-a)

PASS. Do not add padding sleeps.
```

Unwrap of a wrong wrapping key may differ in duration from a missing key (crypto vs immediate reject). That is not an account-existence oracle and is not a plaintext leak. Do not add dummy sleeps.

---

## Abuse Assessment

Assessment only. No new edge mitigations shipped in this review.

| Category                              | What PASS requires (this package)                              | Verdict            | Notes / owner                                                                          |
| ------------------------------------- | -------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| **Credential stuffing**               | Auth surfaces                                                  | **NOT APPLICABLE** | **V3-S01**                                                                             |
| **Brute force**                       | Guessing stored vault secrets through the product              | **PASS**           | No plaintext readback. Wrong wrapping key does not decrypt. No vendor “try secret” I/O |
| **Enumeration**                       | Foreign workspace secret existence not disclosed               | **NOT APPLICABLE** | HTTP isolation **S03-e**. Domain foreign workspace remains deny                        |
| **Replay attempts**                   | Token replay                                                   | **NOT APPLICABLE** | **V3-S01**. No new vault tokens                                                        |
| **Resource exhaustion**               | Huge bodies / unbounded stores                                 | **PASS**           | Existing field size bounds. No HTTP                                                    |
| **Automation abuse**                  | Scripted store of secrets                                      | **NOT APPLICABLE** | No public Vault HTTP. **S03-e** / **V3-S04**                                           |
| **Distributed attacks**               | Edge / IP                                                      | **NOT APPLICABLE** | **V3-S04** / host infrastructure                                                       |
| **Wrapping-key abuse** _(this slice)_ | Stolen DB dump or wrong host key must not yield usable secrets | **PASS**           | Ciphertext without matching wrapping key is unusable                                   |

```text
Store without wrapping key     Denied     PASS
Retrieve with wrong key        Denied     PASS
Retrieve with missing key      Denied     PASS
DB-shaped snapshot plaintext   Absent     PASS
Paper / auth / research        Continue   PASS

PASS
```

---

## Threats this slice reduced

| Threat                                                | Control in S03-b                           |
| ----------------------------------------------------- | ------------------------------------------ |
| Data theft of a database dump of vendor secrets       | Ciphertext at rest; wrapping key separated |
| Silent plaintext persist when wrapping key is missing | Fail closed; no plaintext fallback         |
| Use of stored secrets under the wrong wrapping key    | Unwrap fails closed; secret unavailable    |
| Operator or API readback of stored material           | Metadata only; no Vault HTTP               |
| Fake “still works” after wrapping key loss            | Retrieve fails; paper continues honestly   |

Not reduced here: C8 HTTP (S03-e), Vault UI (S03-d), typed field contracts (S03-c), adapter consumers (later waves), audit product (S05).

---

**STOP.** Wait for Product Owner review before beginning S03-c.

**End of S03-b Security Review.**
