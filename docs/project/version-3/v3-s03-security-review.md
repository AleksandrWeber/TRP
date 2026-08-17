# V3-S03 Security Review (planning)

**Package:** V3-S03 Secret Vault & Encryption
**Wave:** 1 — Security Foundation
**Status:** Planning security review — **Approved** with the Implementation Package. Planning **COMPLETE**. Not a post-implementation closeout
**Stage:** Approved (planning COMPLETE)
**Date:** 2026-08-17
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 and [`v3-security-vision.md`](./v3-security-vision.md)
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)
**Umbrella:** [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md)
**Scope:** [`v3-s03-product-scope.md`](./v3-s03-product-scope.md)
**Baseline (read-only):** [`version-2-connection-management-audit.md`](../version-2-connection-management-audit.md)

This review describes **required security outcomes** for V3-S03. It does not describe how to implement them. Authentication remains Authentication. Authorization remains Authorization. Connection Management, venue I/O, Telegram, SMTP delivery, and AI use keep their later owners.

**Planning intent:** rows marked **PASS** mean this package is designed to satisfy the control when implemented. Close requires evidence. **NOT APPLICABLE** names the real owner.

This is the most important planning section of V3-S03. A vault that stores secrets badly is worse than `.env`: it concentrates customer keys and then leaks them.

---

## Boundary (binding)

```text
The Vault holds customer credentials.
It does NOT connect vendors.
It does NOT return plaintext to the browser.
It does NOT replace host infrastructure env.
It is NOT a generic secret-manager product.
It owns secrets only.
```

Version 2 facts this review takes as given (Connection Management Audit): there is no Secret Manager; OpenRouter is plaintext env; exchange adapters store state without keys; Telegram tokens are not stored as Telegram credentials; SMTP is absent; integration secrets are not encrypted at rest.

---

## Threat model

From the Security Vision, this package is the primary control for **credential leakage** and a primary control for **data theft** of vendor secrets. It is a contributing control for workspace isolation of secrets. It is **not** the primary control for order manipulation, live financial fraud, SSRF (no customer webhooks yet), or account takeover (S01).

| Threat                         | Example against this package                                                   | Required outcome                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Credential leakage**         | `.env` in git; secret in UI, logs, or API list                                 | Customer vendor secrets are not in `.env` as the product path. List and UI return metadata only. Logs never contain vault plaintext. |
| **Data theft**                 | Database dump, backup leak, stolen laptop with DB files                        | Ciphertext at rest is unusable without the wrapping key. Wrapping key is not stored with ciphertext.                                 |
| **Information disclosure**     | “Show secret”, last-four of a key, error that echoes the key                   | No plaintext export. Errors do not repeat submitted secrets.                                                                         |
| **Cross-workspace read**       | Workspace A retrieves B’s Binance key                                          | Fail closed. Membership is server-side.                                                                                              |
| **Privilege abuse**            | Reader lists vault; Admin downloads plaintext “for support”                    | Least privilege: Trader/Admin metadata only. Nobody’s browser is a decrypt client.                                                   |
| **Tampering**                  | Client marks a secret “revoked” in the payload while keeping ciphertext usable | Server owns lifecycle. Client cannot honor-system a status.                                                                          |
| **Repudiation**                | Secret created or deleted with no attributable event                           | Structured events for create, revoke, delete, validation failure. Audit **product** remains S05.                                     |
| **Elevation**                  | Vault used to skip Gate, enable live, or become Admin                          | Vault grants no extra role and no live.                                                                                              |
| **Host overreach**             | Host operator reads customer keys from a product screen                        | No product path for host or Admin to view plaintext.                                                                                 |
| **Compromise of one secret**   | Stolen Binance key                                                             | Revoke and delete stop retrieve. Rotation **product** is Wave 2.                                                                     |
| **Compromise of wrapping key** | Host wrapping secret leaked                                                    | Stored ciphertext must be treated as burned until the customer re-stores under a new wrapping regime. No silent “still fine.”        |
| **Denial of service**          | Unbounded store attempts; huge secret bodies                                   | Authenticated, role-gated, size-bounded input. Platform IP/edge remains S04.                                                         |

Out of this review as primary owners: session theft (S01), role assignment (S02), CSP/SSRF product (S04), searchable audit (S05), isolation **suite** (S06), vendor SSRF via webhooks (Wave 5), live-order replay (Wave 6).

---

## Secret lifecycle (required outcomes)

| State          | Outcome                                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Not stored** | No retrievable material for that workspace + type + purpose.                                                                                                                                             |
| **Submitted**  | Material exists only long enough to validate and encrypt. It is not logged.                                                                                                                              |
| **Rejected**   | Validation failure. Nothing stored as success. Operator sees an honest field error, not a vendor outage.                                                                                                 |
| **Stored**     | Ciphertext persists. Metadata is listable. Plaintext is not listable. Authorized runtime retrieve can decrypt in memory **when a later package wires a consumer**. This package does not wire consumers. |
| **Replaced**   | New store for the same workspace + type + purpose supersedes previous material. Previous plaintext is unreadable. This is lifecycle, not the Wave 2 rotation product.                                    |
| **Revoked**    | Retrieve fails. Metadata may remain as revoked. Operator cannot read the old secret.                                                                                                                     |
| **Deleted**    | Record and ciphertext are gone from the product. Retrieve fails. No undelete.                                                                                                                            |

Revoke stops use. Delete removes the record. Both are required. Session revoke remains S01. Connection disconnect remains Wave 2.

### Secret State Machine

Canonical: [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md) §6.

```text
Created
  ↓
Validated
  ↓
Connected
  ↓
Revoked
  ↓
Deleted
```

**Connected** means Vault stores the credential. It does **not** mean the external provider works.

| Formal state | Lifecycle row above             |
| ------------ | ------------------------------- |
| Created      | Submitted                       |
| Validated    | Rejected if fail; else proceeds |
| Connected    | Stored                          |
| Revoked      | Revoked                         |
| Deleted      | Deleted                         |

Provider downtime is not a Vault state. There is no “Binance works” state in this machine.

---

## Encryption strategy (required outcomes)

Do not specify algorithms, libraries, or vendors here. Required outcomes:

1. Secrets at rest are **not** application plaintext in `.env` or unencrypted columns.
2. Encryption is **envelope-style**: data ciphertext is wrapped by a platform wrapping key.
3. Losing the database alone must not yield usable customer keys.
4. Losing the wrapping key must make stored secrets unrecoverable (fail closed, honest).
5. Decrypt happens only in server memory for an authorized retrieve — not in the browser, not in a log file, not in a support export.
6. Login passwords remain Authentication’s hashes (S01). Vault does not re-hash vendor secrets as if they were passwords, and does not store vendor secrets as password hashes.

---

## Key hierarchy (required outcomes)

| Layer                                   | Outcome                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wrapping key**                        | Host-held. Not stored in the same place as ciphertext. Operated like other host secrets (`JWT_SECRET` class), not as a customer Vault record.                     |
| **Per-secret (or equivalent) data key** | Ciphertext for one secret is not trivially reusable as another secret’s plaintext. Compromise of one record must not decode all records without the wrapping key. |
| **Workspace binding**                   | Decrypt is meaningless as a product action unless the caller is in the owning workspace.                                                                          |
| **No key in the table of secrets**      | Wrapping key material is not a column beside ciphertext.                                                                                                          |

How the host stores the wrapping key (HSM, KMS, or host secret) is an infrastructure choice at implementation. The outcome is the same: wrapping key ≠ ciphertext store.

---

## Access model

```text
Browser / operator
  → metadata only (list, status, timestamps, type)
  → never plaintext

Vault product (Trader / Admin, member of workspace)
  → create / replace / revoke / delete
  → receive validation result, not the stored secret

Runtime retrieve port
  → plaintext in memory for the owning workspace
  → not exposed as a customer API
  → not wired to Exchange Adapter, AI Gateway, or Notification Delivery in this package

Host / engineer
  → no product screen that reveals customer plaintext
```

JWT role remains a hint. Identity is re-resolved (S01). Workspace membership is server-side (Workspace). Vault does not trust a client-supplied workspace id.

---

## RBAC interaction

V3-S02 left C8 unbound. This package binds **vault lifecycle** only.

| Required outcome     | Detail                                                                         |
| -------------------- | ------------------------------------------------------------------------------ |
| Default deny         | Reader and Researcher cannot manage Vault.                                     |
| Trader and Admin     | May store, see metadata, revoke, and delete in workspaces they are members of. |
| Never plaintext      | No role, including Admin, receives secret material in the UI or list API.      |
| No convenience grant | Vault does not grant live, Gate bypass, or Admin.                              |
| Connection wizard    | Still unbound. Wave 2 owns it.                                                 |
| Register             | Still Researcher. No Vault by default.                                         |

Authorization never creates vault records by itself. It only allows or denies an already requested vault action.

---

## Audit requirements

This package must make later audit possible. It must **not** claim the S05 audit product.

Required structured events (no secret material, no wrapping key, no `.env` values):

- Vault secret created (actor, workspace, type/purpose, outcome)
- Validation rejected (same, no submitted secret)
- Revoked
- Deleted
- Replace/supersede
- Retrieve denied (wrong workspace or revoked/deleted) when the retrieve port is exercised
- Authorization denied on Vault (non-Trader/Admin)

Operators do not get a searchable vault history in this package.

---

## Recovery policy

| Event                                  | Required outcome                                                                                                                                                              |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operator forgets the stored secret     | The product cannot show it. The operator stores a new one.                                                                                                                    |
| Operator revokes or deletes            | Unrecoverable from the product.                                                                                                                                               |
| Wrapping key lost                      | Stored secrets unrecoverable. Product must not fake that they still work. Customer re-stores after the host wrapping key is re-established.                                   |
| Wrapping key rotated by host (planned) | Old ciphertext must not remain decryptable under the discarded wrapping key unless a controlled re-wrap completed. Unfinished re-wrap is unavailable, not silently plaintext. |
| Password recovery (login)              | Unchanged S01. Not a vault recovery path. Host mail is not customer SMTP.                                                                                                     |
| Disaster recovery of the database      | Restoring ciphertext without the matching wrapping key yields unreadable secrets. That is correct.                                                                            |

There is no backdoor “support decrypt.”

---

## Backup expectations

| Outcome                                                                           | Required                                                                  |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Ciphertext may be included in ordinary database backups                           | Yes — backups must not become a plaintext secret store                    |
| Backups must not contain wrapping keys beside those records as a convenience dump | Yes                                                                       |
| Restored backup + matching wrapping key restores **stored** secrets               | Yes                                                                       |
| Restored backup without wrapping key does not restore usable secrets              | Yes                                                                       |
| Backup is not a customer export of keys                                           | Yes                                                                       |
| Multi-host secret sync product                                                    | **Not** this package (out of Version 3 unless the Master Plan is revised) |

Wave 3 owns restart-safety **claims** for the runtime. This package’s outcome is narrower: after process restart, **stored ciphertext is still there** and still decryptable only with the wrapping key. Adapters do not start using it in S03.

---

## Memory handling (required outcomes)

- Plaintext exists in server memory only for validate-then-encrypt, or for authorized retrieve.
- Plaintext is not written to logs, traces, or customer-visible errors.
- The UI does not retain the submitted secret after success (no “show what you typed” as stored truth).
- Crash or debug dumps are not a supported customer way to recover a key.
- Retrieve is not a chatty API. This package does not stream secrets to the browser.

---

## Secret export policy

| Policy                                     | Outcome                                            |
| ------------------------------------------ | -------------------------------------------------- |
| Customer plaintext export                  | **Forbidden**                                      |
| Admin plaintext export                     | **Forbidden**                                      |
| Metadata export (type, status, timestamps) | Allowed as ordinary product list; not a key export |
| Compliance evidence packs                  | Wave 10; must still not dump plaintext secrets     |
| “Copy key” after save                      | **Forbidden**                                      |

---

## Secret deletion policy

| Action                 | Outcome                                                                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Revoke**             | Retrieve fails. Record may remain as revoked. Ciphertext must not remain usable.                                                                                                                                                 |
| **Delete**             | Record gone. Ciphertext gone from the product. No undelete.                                                                                                                                                                      |
| **Replace**            | Previous material unreadable.                                                                                                                                                                                                    |
| Deleted vs host `.env` | Deleting a vault secret must not be undone by a leftover `OPENROUTER_API_KEY` **as the customer story**. This package does not yet switch AI off env; it must not tell the customer the env key is “their” deleted vault secret. |

---

## Compromise handling

| Compromise                                   | Required outcome                                                                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| One customer secret suspected stolen         | Operator revokes and deletes, then stores a new secret. Connection reconnect is Wave 2.                                                  |
| Vault metadata listed to the wrong workspace | Fail closed; treat as isolation incident for S05/S06 later.                                                                              |
| Wrapping key leaked                          | Treat all wrapped secrets as compromised. Host replaces wrapping key. Customers re-store. Product does not claim old ciphertext is safe. |
| Database leaked                              | Ciphertext without wrapping key must not be usable. Still notify as a host incident later (Wave 3 monitoring).                           |
| Operator laptop stolen while signed in       | S01 session revoke. Vault still must not have shown plaintext.                                                                           |
| Insider Admin curiosity                      | No plaintext screen. Events record vault access that mutates; list is metadata.                                                          |

Automated rotation is **out**. Manual revoke/delete/store-again is **in**.

---

## Customer isolation

- Vault records are workspace-scoped.
- Unique active secret per (workspace, type, purpose).
- User in workspace A cannot list, revoke, delete, or retrieve workspace B.
- Role assignment (S02) does not move vault material between workspaces.
- Wave 9 teams must still fit this rule (J3-12). This package must not invent a global customer key.

Version 2 global OpenRouter env key remains a **host leftover**, not a Vault success. S03 must not make that global key the customer path.

---

## Host isolation

| Host concern                        | Outcome                                                                                                                                                                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`, Redis, `JWT_SECRET` | Stay host env. Not Vault records. Never migrated into Vault.                                                                                                                                                                     |
| Host password-recovery mail         | Stays host. Not customer SMTP in Vault.                                                                                                                                                                                          |
| `OPENROUTER_API_KEY` in env         | Dual-run in S03: env reader stays. Customer re-enters in Vault. **No auto-import** (global host key must not become every workspace’s secret). Gateway **use** of the vaulted key is Wave 2. Env becomes dev fallback only then. |
| Platform wrapping key               | New host secret. Not a Vault record. Missing wrapping key must not take down login/paper; Vault fails closed.                                                                                                                    |
| Host engineer                       | No Vault UI that reveals plaintext. Wrapping key is host-operated, not displayed.                                                                                                                                                |
| Customer                            | No SSH and no `.env` for vendor secrets on the product path. Host still operates infrastructure env.                                                                                                                             |

The Vault is not HashiCorp-for-the-host. It is customer-managed product secrets.

---

## Secret Classification (security policy)

Canonical: [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md) §5.

Customer vendor secrets (Binance, Bybit, OKX, Telegram Bot, customer SMTP, OpenRouter, later typed secrets in the same Vault): **Owner Customer. Rotation Yes (replace-by-store). Read back No. Export No.**

Host secrets (`JWT_SECRET`, wrapping key, `DATABASE_URL`, Redis/queue, host recovery mail): **Owner Host. Rotation Manual. Read back N/A. Export N/A.** Never Vault records.

Login passwords remain Authentication (S01). Not Vault.

---

## Failure Philosophy

Canonical: [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md) §7.

```text
Vault unavailable
  ↓
Paper Trading continues
  ↓
Authentication continues
  ↓
Research continues
  ↓
Integrations unavailable
```

Vault must not take down the paper-first product. Fail closed for secrets. Fail open for certified journeys that do not need Vault.

| Unavailable             | Required security outcome                                                                                                                                                                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vault**               | Store/retrieve fail closed and honest. No plaintext fallback. Paper, authentication, and research continue. Integrations that need a vaulted secret are unavailable — not silently served from `.env` as “the customer’s vault.” Dual-run OpenRouter env remains host leftover, not a Vault recovery path. |
| **Wrapping key**        | Same as Vault unavailable for decrypt/store. Missing wrapping key must not take down login or paper. Stored ciphertext is unusable; product must not claim it still works. No silent plaintext persist.                                                                                                    |
| **Database**            | If the host database is down, persisted sign-in and paper that already depend on it fail as a **host** outage — Vault must not pretend to keep those up. If the database is up and only Vault is unusable, treat as Vault unavailable: paper and authentication continue.                                  |
| **Provider validation** | This package does not call providers. Vendor downtime must not block Created → Validated → Connected. Connected is not a vendor health signal. A later package that calls a provider must not turn provider failure into a platform outage of paper or authentication.                                     |

Denial of Vault is not denial of the product.

---

## Secret Ownership Rules

Canonical: [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md) §8.

```text
The Vault never owns
  Connections
  Notifications
  AI
  Trading
  Exchanges

Only secrets.
```

Security implication: a Vault control must not be used as a Gate, a live switch, a send() path, or a venue handshake. Compromise or outage of Vault is a **credential** incident, not a trading, notification, or AI-control incident — because those products are not owned here and are not wired in this package.

---

## Threats this package must reduce

| Threat (Security Vision)        | Control in this package                                              |
| ------------------------------- | -------------------------------------------------------------------- |
| Credential leakage              | Vault as customer path; no plaintext UI/logs; no `.env` product path |
| Data theft (DB dump of secrets) | Encryption at rest; wrapping key separated                           |
| Cross-workspace secret leak     | Workspace-scoped records; retrieve fail-closed                       |
| Insider plaintext read          | Metadata-only list; no export                                        |
| Fake venue Connected            | Vault Connected ≠ vendor connected                                   |
| Privilege to manage secrets     | C8 vault cells: Trader/Admin only                                    |

---

## Control-by-control (S03 only)

### Secret storage (checklist 8) — this package owns it

Customer vendor secrets are stored in Vault. Not `.env`. Not plaintext columns. Not `ExchangeConnection`. Host infrastructure may remain server-operated.

### Least Privilege

Vault list returns metadata. Runtime retrieve is not a browser privilege. Telegram is not a control plane (untouched). Admin cannot skip Gate/Risk (untouched).

### Secure by Default

Integrations remain **disconnected** as vendors. Live remains off. Debug prefill remains forbidden. Production must refuse to persist customer vendor secrets as plaintext.

### Zero Trust

Vault APIs are authenticated. Workspace id is not a client honor system. No vendor callbacks in this package.

### Connection security

This package **touches secrets that connections will use**, but it does not ship connections. Checklist 24 is **PASS** for “credentials live in the vault when collected” on the Vault surface, and **must not** claim wizard/test/disconnect. SSRF allowlists stay S04 / Wave 5.

### AI safety

Storing an OpenRouter key does not let AI control capital. This package does not call the gateway with that key. **PASS** as a non-activation outcome; Gateway use is later.

---

## Security checklist (planning intent)

| #   | Control                    | Verdict            | Evidence or owner                                                                                                            | Action |
| --- | -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Authentication             | **PASS**           | Vault APIs are authenticated S01 sessions. No new public secret routes. Disabled users fail closed.                          |        |
| 2   | Authorization              | **PASS**           | C8 vault cells: Trader/Admin + workspace membership. JWT hint. No ABAC. Admin cannot skip Gate/Risk.                         |        |
| 3   | OWASP Top 10 review        | **PASS**           | Worksheet below. Crypto failures and broken access on vault are in scope. SSRF/platform CSP are later.                       |        |
| 4   | Input validation           | **PASS**           | Holdable-type bodies schema-validated. Unknown fields rejected. Size-bounded. No IEEE money types.                           |        |
| 5   | Output encoding            | **PASS**           | React defaults. JSON does not reflect HTML. **No secret material in responses.**                                             |        |
| 6   | Session review             | **NOT APPLICABLE** | Consumes S01 sessions; does not issue or refresh. Owner: **V3-S01**.                                                         |        |
| 7   | Credential review          | **NOT APPLICABLE** | Login passwords remain S01 bcrypt. Vault stores vendor secrets, not login passwords. Owner of login credentials: **V3-S01**. |        |
| 8   | Secret storage             | **PASS**           | This **is** V3-S03. Envelope encryption. Wrapping key not with ciphertext. No customer `.env` path.                          |        |
| 9   | Rate limiting              | **PASS**           | Do not remove global limits. Vault mutations are authenticated. Platform tightening: **V3-S04**.                             |        |
| 10  | Replay protection          | **NOT APPLICABLE** | No new auth tokens. Session replay: **V3-S01**. Live place/cancel: **V3-L05**.                                               |        |
| 11  | CSRF                       | **PASS**           | Cookie-authenticated vault mutations keep SameSite=Strict **and** S01 CSRF.                                                  |        |
| 12  | XSS                        | **PASS**           | Vault UI keeps React encoding. No access token in JS storage (S01). Platform CSP: **V3-S04**.                                |        |
| 13  | Injection review           | **PASS**           | Parameterized persistence. No string-built SQL from secret fields. Secrets treated as opaque material, not queries.          |        |
| 14  | Logging review             | **PASS**           | Vault events: actor, workspace, type, outcome. **No** plaintext, wrapping keys, or `.env` values.                            |        |
| 15  | Audit review               | **PASS**           | Attributable create/revoke/delete. Does **not** claim SEC-09 product. Owner: **V3-S05**.                                     |        |
| 16  | Error leakage review       | **PASS**           | Validation errors are field-honest without echoing secrets. Cross-workspace: forbidden, not an existence oracle.             |        |
| 17  | Permission review          | **PASS**           | Default Researcher unchanged. No extra privilege as convenience. Role assignment stays S02.                                  |        |
| 18  | Workspace isolation        | **PASS**           | Records scoped. A cannot read B. Isolation **product** tests: **V3-S06**. This package must not punch a hole.                |        |
| 19  | Financial Integrity review | **PASS**           | Ledger untouched. Vault is not money SoT. No live orders. Canonical path not duplicated.                                     |        |
| 20  | Secure-by-default review   | **PASS**           | No plaintext persist; live off; no venue Connected theater; no debug prefill.                                                |        |
| 21  | Zero Trust review          | **PASS**           | Vault APIs authenticated. Membership server-side. No vendor callbacks. Live enablement not shipped.                          |        |
| 22  | Least Privilege review     | **PASS**           | Metadata never secret material. Reader/Researcher denied. Telegram not a control plane.                                      |        |
| 23  | AI safety review           | **PASS**           | Key may be stored. AI does not run, decide, or trade from this package.                                                      |        |
| 24  | Connection security review | **PASS**           | Secrets collected into Vault, not customer `.env`. Test/connect/disconnect **not** claimed. SSRF: **V3-S04** / Wave 5.       |        |

---

## OWASP Top 10 worksheet

| OWASP class                                | Verdict            | Notes / owner                                                                                                          |
| ------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Broken access control                      | **PASS**           | Vault is Trader/Admin + workspace. Reader/Researcher denied. Cross-workspace deny.                                     |
| Cryptographic failures                     | **PASS**           | Primary S03 class: encryption at rest, wrapping-key separation, no plaintext columns.                                  |
| Injection                                  | **PASS**           | Opaque secrets; parameterized access.                                                                                  |
| Insecure design                            | **PASS**           | Browser is not a decrypt client. Vault ≠ connections. No support backdoor.                                             |
| Security misconfiguration                  | **NOT APPLICABLE** | Platform CSP/helmet **V3-S04**. S03 must not weaken S01 cookie/CSRF. Must refuse plaintext persist in production.      |
| Vulnerable and outdated components         | **NOT APPLICABLE** | Platform review **V3-S04**.                                                                                            |
| Identification and authentication failures | **NOT APPLICABLE** | Authn **V3-S01**.                                                                                                      |
| Software and data integrity failures       | **PASS**           | Lifecycle owned server-side. UI not SoT. Ciphertext not client-supplied as “already encrypted” without server encrypt. |
| Security logging and monitoring failures   | **PASS**           | Structured vault events; monitoring product **V3-O05**; audit product **V3-S05**.                                      |
| Server-side request forgery (SSRF)         | **NOT APPLICABLE** | No customer webhook URLs in S03. **V3-S04** / Wave 5.                                                                  |

---

## Threat Review (lightweight STRIDE)

| Category                   | What PASS requires (this package)                                                        | Verdict  | Notes / owner                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| **Spoofing**               | Attacker cannot pretend to be an operator on Vault APIs.                                 | **PASS** | Authenticated S01 session. No public vault routes.                |
| **Tampering**              | Client cannot alter ciphertext, status, or workspace binding in a way the server honors. | **PASS** | Server owns encrypt and lifecycle.                                |
| **Repudiation**            | Create / revoke / delete are attributable.                                               | **PASS** | Structured events. Audit product is **V3-S05**.                   |
| **Information Disclosure** | No plaintext in API, UI, or logs. Cross-workspace no leak.                               | **PASS** | Primary STRIDE row with crypto.                                   |
| **Denial of Service**      | Unbounded vault writes considered.                                                       | **PASS** | Authenticated, role-gated, size-bounded. Platform/IP: **V3-S04**. |
| **Elevation of Privilege** | Vault does not grant Admin, live, or foreign workspace power.                            | **PASS** | C8 vault cells only. C7/C9 remain denied.                         |

---

## Timing Assessment

**Could observable timing reveal protected information?** Assessment only. Do not add dummy sleeps.

| Surface                                                 | What PASS requires (this package)                                                                                           | Verdict            | Notes / owner                                                                                       |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| **Authentication**                                      | Known vs unknown identity on auth surfaces.                                                                                 | **NOT APPLICABLE** | **V3-S01**.                                                                                         |
| **Credential validation**                               | Password compare timing.                                                                                                    | **NOT APPLICABLE** | Login passwords **V3-S01**. Vault validation is field presence, not password-hash compare.          |
| **Recovery flow**                                       | Recovery enumeration timing.                                                                                                | **NOT APPLICABLE** | **V3-S01**.                                                                                         |
| **Session validation**                                  | Valid/invalid/revoked session timing.                                                                                       | **NOT APPLICABLE** | **V3-S01**.                                                                                         |
| **Vault retrieve / foreign workspace** _(this package)_ | Timing must not be a practical oracle for whether workspace B has a stored secret, beyond what forbidden already discloses. | **PASS**           | Foreign workspace → forbidden uniformly. Existence of B’s Binance key is not a distinct body for A. |

Vault **validation** of the operator’s own submitted fields may be slower on encrypt than on empty-reject. That is not an account-existence oracle. Do not add padding sleeps.

---

## Abuse Assessment

| Category                | What PASS requires (this package)                  | Verdict            | Notes / owner                                                                       |
| ----------------------- | -------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| **Credential stuffing** | Auth surfaces.                                     | **NOT APPLICABLE** | **V3-S01**.                                                                         |
| **Brute force**         | Guessing stored vault secrets through the product. | **PASS**           | No plaintext readback; no “try secret” vendor I/O in S03. Login brute force is S01. |
| **Enumeration**         | Foreign workspace secret existence not disclosed.  | **PASS**           | Forbidden without a distinct exists/not-exists.                                     |
| **Replay attempts**     | Replaying a store/revoke with a stolen session.    | **NOT APPLICABLE** | Session replay **V3-S01**. No new vault tokens.                                     |
| **Resource exhaustion** | Huge bodies / unbounded stores.                    | **PASS**           | Schema size limits; authenticated Trader/Admin; existing global limits.             |
| **Automation abuse**    | Scripted store of secrets.                         | **PASS**           | Requires Trader/Admin session. Not public. Platform tightening **V3-S04**.          |
| **Distributed attacks** | Edge / IP.                                         | **NOT APPLICABLE** | **V3-S04** / host infrastructure.                                                   |

---

## Controls explicitly not this package

| Control                                                | Owner                                |
| ------------------------------------------------------ | ------------------------------------ |
| Password, lockout, sessions, recovery                  | V3-S01 (CLOSED)                      |
| Role assignment product                                | V3-S02 (CLOSED)                      |
| Platform CSP, helmet, global OWASP, SSRF allowlists    | V3-S04                               |
| Append-only audit product                              | V3-S05                               |
| Isolation test suite as a product                      | V3-S06                               |
| Connection wizards, test, health, disconnect product   | Wave 2                               |
| Credential rotation product (keep connection metadata) | V3-C04 / SEC-12                      |
| Exchange I/O / `spot.trade` from venue                 | Wave 4                               |
| Telegram / SMTP delivery                               | Wave 5                               |
| Customer OpenRouter **use**                            | Wave 2 / 7                           |
| MFA for live                                           | Wave 6                               |
| Live-order replay / financial action log               | V3-L05 / V3-L03                      |
| Kill Switch product                                    | V3-O04                               |
| Secrets synchronization                                | Out of Version 3 unless plan revised |
| ABAC engine                                            | Out of Version 3                     |

---

## Security exit for this package

S03 security is done when:

1. A Trader or Admin can store a vendor secret in the product without `.env`.
2. The operator cannot read that secret back in the UI, API list, or logs.
3. Ciphertext at rest is unusable without the wrapping key. The wrapping key is not stored with the ciphertext.
4. Revoke makes retrieve fail. Delete removes the record.
5. Workspace A cannot read workspace B.
6. Reader / Researcher cannot manage Vault.
7. No plaintext export exists.
8. Vault “Connected” is not venue Connected. Live, Telegram delivery, email send, and AI-use are not shipped.
9. Vault events are structured and contain no secrets.
10. Host infrastructure env is not migrated into Vault as customer material.
11. Failure Philosophy holds: Vault or wrapping-key unavailability does not take down paper, authentication, or research.
12. Classification holds: customer secrets are not readable back and not exportable; host secrets are not Vault records.
13. Ownership holds: Vault does not own Connections, Trading, AI, Notifications, or Exchanges.

---

**STOP.** Planning security review is **COMPLETE** with Implementation Package **Approval**. Do not weaken these outcomes in implementation.
