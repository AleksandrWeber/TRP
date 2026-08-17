# V3-S03 Validation Plan

**Package:** V3-S03 Secret Vault & Encryption
**Wave:** 1 — Security Foundation
**Status:** **V3-S03 Platform Complete** (Product Owner 2026-08-17). Customer Complete open under Vault.
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Scope:** [`v3-s03-product-scope.md`](./v3-s03-product-scope.md)
**Security:** [`v3-s03-security-review.md`](./v3-s03-security-review.md)
**Umbrella:** [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md)
**Close criteria resolution:** [`v3-s03-close-criteria-resolution.md`](./v3-s03-close-criteria-resolution.md)
**Platform Complete Close:** [`v3-s03-platform-complete-close-report.md`](./v3-s03-platform-complete-close-report.md)
**Baseline (read-only):** [`version-2-connection-management-audit.md`](../version-2-connection-management-audit.md)
**Checklists:** [`version-3-product-checklist.md`](./version-3-product-checklist.md) · [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md) · [`version-3-security-checklist.md`](./version-3-security-checklist.md)
**Customer overview:** [`secret-vault-overview.md`](./secret-vault-overview.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: a unit test that asserts an “encrypted” flag but never proves plaintext is absent from the API, or a UI test that stubs “stored”) do **not** count as Close evidence for customer acceptance.

Do not validate Binance I/O, Telegram send, SMTP send, or AI chat. Those are later packages. Validate **Vault**.

---

## 0. Two completion gates (binding)

Conflict resolved in [`v3-s03-close-criteria-resolution.md`](./v3-s03-close-criteria-resolution.md). **Do not bypass.**

| Gate                           | Meaning                                                  | Owner                                 | Evidence in this plan                                                                                                                 |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Gate 1 — Platform Complete** | Vault domain (SEC-06 / SEC-07) is finished and validated | **Vault**                             | §§1–2 (domain / persistence / retrieve port without consumers), domain rows of §§5–6, slice evidence for executed S03-a…e domain work |
| **Gate 2 — Customer Complete** | Vault UI and operator workflow are complete              | **Vault** (not Connection Management) | §§3–4 (UI + Secret Vault Walkthrough), HTTP/CSRF rows of §2, product checkboxes in §7 that require the Vault page                     |

**UI owner = Vault.** Connection Management (`V3-C01`…`C04`) owns catalog / wizard / test / health. It does **not** own the Vault page, Vault HTTP, or the Secret Vault Walkthrough.

### Gate 1 — Platform Complete (**CLOSED** — Product Owner 2026-08-17)

Recorded PASS for:

1. Unit tests in §1 (domain outcomes).
2. Integration tests in §2 that do **not** require Vault HTTP routes or browser UI (store survives restart; retrieve port; revoke/delete/replace retrieve; wrapping-key fail-closed; host types refused; no auto-import; Version 2 / S01 / S02 unregressed; dual-run OpenRouter; no `ExchangeConnection` plaintext; production plaintext refuse).
3. Domain security and architecture rows in §§5–6 that do not require Vault UI/HTTP.
4. Slice domain evidence for S03-a … S03-e as executed under no-UI / no-HTTP constraints.
5. Honest limitations recorded (Vault Connected ≠ venue Connected; adapters not wired; no Vault page yet if Gate 2 open).

**Product Owner accepted Gate 1 as V3-S03 Platform Complete.** That does **not** claim Customer Complete.

### Gate 2 — Customer Complete (open — Vault-owned)

Required PASS for (not yet claimed):

1. Horizontal / vertical Vault HTTP and CSRF in §2.
2. UI tests in §3.
3. Manual Secret Vault Walkthrough in §4 (**PASS**, not domain-only).
4. Product verification checkboxes in §7 that require opening Vault in the product.
5. Customer First: no SSH, customer `.env`, or SQL for the customer store path.

Customer Complete remains **Vault-owned**. Deferral does not move ownership to Connection Management.

| Gate                  | Meaning                                     | Unlocks                                          |
| --------------------- | ------------------------------------------- | ------------------------------------------------ |
| **Platform Complete** | Vault domain is complete and validated      | Future packages may consume Vault                |
| **Customer Complete** | Vault UI and operator workflow are complete | Operators can manage secrets through the product |

Next package after Platform Complete: **V3-S04**. Connection Management still waits for Wave 1 exit.

---

## 1. Unit tests

New Vault specs next to the Vault owner. Do not rewrite certified Version 2 exchange, Telegram, or AI tests into a vault. Do not treat `ExchangeConnection` as a secret store.

| Area                 | Must prove                                                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Store                | Well-formed Binance (and other holdable types) material becomes stored ciphertext, not plaintext.                                                                                                       |
| Readback             | List/metadata APIs and view models contain no secret fields.                                                                                                                                            |
| Validation           | Empty key, empty secret, missing required SMTP/Telegram/OpenRouter fields rejected. Success is not recorded.                                                                                            |
| Lifecycle            | Created → Validated → Connected → Revoked → Deleted. Stored → revoke → retrieve fails. Stored → delete → not stored. Replace supersedes previous material. Connected is vault-held, not vendor-working. |
| Encryption outcome   | Persisted form is not the submitted plaintext. Wrapping key is not persisted beside ciphertext.                                                                                                         |
| Workspace            | Record is bound to a workspace id. Foreign workspace id does not return material.                                                                                                                       |
| Authorization policy | Reader/Researcher denied. Trader/Admin allowed for vault lifecycle. No role receives plaintext.                                                                                                         |
| Host split           | `DATABASE_URL` / JWT / host recovery mail are not vault types. Env is not auto-imported.                                                                                                                |
| No vendor I/O        | Validation does not call Binance, Telegram, SMTP, or OpenRouter.                                                                                                                                        |
| Events               | Create/revoke/delete/reject events exist and omit secret material.                                                                                                                                      |

---

## 2. Integration tests

Durable tests (same persistence pattern as certified identity). Process restart must still find stored ciphertext.

| Case                              | Must prove                                                                                                                                                                                                    | Gate |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Store survives restart            | Admin/Trader stores OpenRouter or Binance material; after API restart, metadata still shows stored; plaintext still absent from list.                                                                         | 1    |
| Retrieve port                     | Authorized same-workspace retrieve yields the original material in memory. Browser/HTTP list still does not (list absence may be domain until Gate 2).                                                        | 1    |
| Retrieve after revoke/delete      | Fails closed.                                                                                                                                                                                                 | 1    |
| Retrieve after replace            | Yields new material only.                                                                                                                                                                                     | 1    |
| Horizontal HTTP                   | Workspace A cannot GET/POST/revoke/delete/retrieve workspace B. Uniform forbidden.                                                                                                                            | 2    |
| Vertical HTTP                     | Reader/Researcher vault routes 403. Unauthenticated 401.                                                                                                                                                      | 2    |
| CSRF                              | Cookie-authenticated vault mutation without CSRF is rejected (S01 transport kept).                                                                                                                            | 2    |
| S01 / S02 unregressed             | Register, login, recover, sessions, People/role assign still work.                                                                                                                                            | 1    |
| Version 2 unregressed             | Paper path, simulated exchange **state** (not credentials), in-memory Telegram wizard, reserved email page, AI offline-without-env-key still behave as certified. S03 must not “fix” those into live vendors. | 1    |
| Dual-run OpenRouter               | With `OPENROUTER_API_KEY` set in env, AI Gateway still consumes env after Vault exists. Storing an OpenRouter key in Vault does **not** change Gateway behaviour in S03.                                      | 1    |
| No auto-import                    | Boot / store paths do not copy env OpenRouter (or JWT, `DATABASE_URL`, `MAIL_*`) into Vault records.                                                                                                          | 1    |
| Wrapping key absent               | API still serves certified journeys; Vault store/retrieve fails closed and honest. Paper, authentication, and research continue (Failure Philosophy).                                                         | 1    |
| Host types refused                | Attempts to store `DATABASE_URL` / JWT / host recovery mail as vault types are rejected or impossible as product types.                                                                                       | 1    |
| No `ExchangeConnection` plaintext | Exchange connect state is still not a secret store.                                                                                                                                                           | 1    |
| Production plaintext refuse       | Production-like configuration refuses to persist vendor secrets as plaintext (secure-by-default).                                                                                                             | 1    |

---

## 3. UI tests (Gate 2 — Customer Complete)

Frontend unit/component tests plus existing shell specs (`pc19`, `pc20`, `AppLayout`).

**Owner: Vault.** Not Connection Management. Not required for Platform Complete.

| Case                      | Must prove                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Vault page (Trader/Admin) | Open Vault; add Binance credentials; success shows Stored / Vault Connected; secret fields cleared; secret not displayed.              |
| Validation failure        | Incomplete Binance fields: honest error; not Stored.                                                                                   |
| Revoke and delete         | Controls exist; after revoke, not usable; after delete, not stored.                                                                    |
| Non-Trader/Admin          | Honest unavailable / forbidden. Not a fake empty “no secrets yet.”                                                                     |
| Copy                      | Operator language. No JWT / Prisma / slice IDs on the happy path. Vault Connected is not “Binance connected” / live.                   |
| No leaked later products  | No Connection Management home, vendor test, Telegram send, email send, AI-using-key, live trading, billing, API keys, invite teammate. |
| Shell regression          | People, Sign-in sessions, Password remain. Logout still server logout.                                                                 |
| No debug prefill          | Credential fields start empty (PC-18).                                                                                                 |

Do not require Playwright to complete J3-03 (connect Binance). Do require the Secret Vault walkthrough to be coverable at component or e2e smoke level.

---

## 4. Manual product walkthrough (Gate 2 — Customer Complete)

Perform as an ordinary operator. **No SSH. No customer `.env`. No SQL.**

**Owner: Vault.** This walkthrough proves Customer Complete. Platform Complete evidence does **not** substitute for it. Connection Management walkthroughs do **not** own or replace it.

This is not a unit test. This is not an integration test. This is not a UI test.

```text
Secret Vault Walkthrough

□ Sign in as Trader or Administrator
□ Open Vault in the signed-in shell
□ Add Binance credentials                         → Created
□ Validation accepts well-formed fields           → Validated (not a Binance test)
□ Stored
□ Visible as Connected (Vault holds the credential — not Binance trading)
□ Confirm the secret cannot be read back or exported
□ Confirm the product does not claim Binance / Telegram / email / AI / live works
□ Revoke                                          → Revoked
□ Confirm the credential is no longer usable
□ Store again (or use remaining material) and Delete → Deleted
□ Confirm the type is not stored
□ Sign in as Reader or Researcher — Vault unavailable
□ Confirm no SSH, customer .env, or database edit was used
□ Confirm sign-in and paper remain available without this secret

PASS / NOT APPLICABLE / REQUIRES ACTION
```

Record pass/fail in the package closeout. Any SSH, `.env`, or database step is an automatic fail of Customer First.

Refresh-token reuse → family revoke is **NOT APPLICABLE**: this package does not issue or refresh sessions. Owner: **V3-S01**.

---

## 5. Security verification

| Check                                      | Pass                                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| No plaintext readback                      | UI, list API, logs                                                                                                              |
| Encryption at rest                         | Persisted secret ≠ submitted plaintext; wrapping key not beside ciphertext                                                      |
| Revoke / delete                            | Retrieve fails; delete gone                                                                                                     |
| Cross-workspace                            | A cannot read B (**0 tolerated**)                                                                                               |
| Least privilege                            | Reader/Researcher denied; Admin is not a plaintext reader                                                                       |
| No `.env` product path                     | Customer save does not require host file edit                                                                                   |
| No export                                  | No download/copy of stored secret                                                                                               |
| CSRF                                       | Forged cross-site vault mutation rejected                                                                                       |
| Enumeration                                | Foreign workspace secret existence not disclosed                                                                                |
| Honest Connected                           | Vault Connected ≠ venue Connected. Connected = Vault stores the credential.                                                     |
| Classification                             | Customer secrets: no read-back, no export. Host `JWT_SECRET` / wrapping key / `DATABASE_URL` / host mail are not Vault records. |
| Ownership                                  | No Connections, Trading, AI, Notifications, or Exchange product shipped from Vault.                                             |
| Failure Philosophy                         | Missing wrapping key / Vault store failure does not take down login/paper/research. Provider is not called to validate.         |
| No live / Telegram / SMTP / AI-use theater | None                                                                                                                            |
| Seed / prefill                             | Vault fields empty                                                                                                              |
| Host isolation                             | `DATABASE_URL` / JWT / host mail not stored as customer vault items                                                             |
| Dual-run                                   | Env OpenRouter reader still works; no auto-import into Vault                                                                    |
| Wrapping key                               | Missing wrapping key does not take down login/paper                                                                             |

Close also requires the Security Checklist, OWASP worksheet, Threat Review, Timing Assessment, and Abuse Assessment with **zero REQUIRES ACTION** (evidence stage).

---

## 6. Architecture verification

| Check                                           | Pass                                                                                    |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| New bounded context                             | **Credential Vault**, named in Master Plan §10. Only one vault.                         |
| Not financial SoT                               | Ledger / orders / Gate / Risk untouched                                                 |
| Not Connection Management                       | No wizard/test/health product                                                           |
| Secrets not on `ExchangeConnection`             | Audit baseline respected                                                                |
| HTTP is transport; UI is not SoT                | Vault page is a projection                                                              |
| Spec v2.0 / Authority Matrix / Alias Dictionary | Unchanged                                                                               |
| Live capital                                    | Not authorized                                                                          |
| Reuse                                           | New justified Vault. Version 2 adapters/Telegram/AI **not** redesigned.                 |
| Retrieve port                                   | Exists; Exchange / AI / Notification **not** wired as consumers                         |
| Vault owns secrets only                         | No Connections, Trading, AI, Notifications, or Exchange product from this package       |
| Failure Philosophy                              | Vault/wrapping-key unavailability does not take down paper, authentication, or research |

Close also requires the Architecture Checklist with **zero REQUIRES ACTION**.

---

## 7. Product verification

Copy and complete [`version-3-product-checklist.md`](./version-3-product-checklist.md) at Close.

### Gate 1 — Platform Complete product sign-off (**accepted**)

Product Owner signed Platform Complete when:

- [x] The Vault domain can store a secret that cannot be read back as plaintext (metadata / domain evidence).
- [x] Revoke and delete work in domain evidence.
- [x] The product language does not claim Binance, Telegram, email, AI, or live trading now works.
- [x] Cross-workspace secret leak is **0** in domain isolation evidence.
- [x] Sign-in (S01) and People (S02) still work.
- [x] Spec v2.0 was not touched.
- [x] Existing OpenRouter-from-env (or offline) still worked. Nothing was auto-copied from `.env` into Vault.
- [x] Gate 2 (Vault UI / HTTP / browser walkthrough) is honestly still open under **Vault**, not transferred to Connection Management.

### Gate 2 — Customer Complete product sign-off

Additional signatures required for Customer Complete (Vault-owned; not Connections):

- [ ] I stored Binance credentials in Vault **in the product UI** without SSH, customer `.env`, or SQL.
- [ ] I opened Vault, revoked, and deleted in the product.
- [ ] Reader/Researcher see honest unavailable in the product surface.
- [ ] Manual Secret Vault Walkthrough recorded **PASS**.

Metrics: time-to-register and time-to-login recorded against Master Plan §6 (no regression). Credential exposure **0**. Cross-workspace leak **0**.

---

## 8. Slice validation (independently reviewable)

Each slice may Close its own review only when its done-when is evidenced.

Executed slice focus (honest): S03-d delivered access control / isolation / concurrency under no-UI / no-HTTP tasks; S03-e delivered domain completion evidence under the same constraints. Original package text named S03-d as Vault UI — that UI work remains **Gate 2**, still Vault-owned.

| Slice                                         | Evidence focus                                                                                                                                                                   | Gate |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| **S03-a**                                     | Vault owner exists; state machine Created → Validated → Connected → Revoked → Deleted; metadata; no encryption theater without S03-b; no vendor I/O. Connected ≠ provider works. | 1    |
| **S03-b**                                     | Encryption outcomes: ciphertext, wrapping-key separation, no plaintext persist in production-like config.                                                                        | 1    |
| **S03-c**                                     | Holdable-type validation; honest reject; no Binance/Telegram/SMTP/OpenRouter network.                                                                                            | 1    |
| **S03-d (executed)**                          | C8 / workspace isolation / concurrency; no UI/HTTP in executed slice.                                                                                                            | 1    |
| **S03-e (executed)**                          | Domain completion evidence; retrieve port without consumers; no UI/HTTP in executed slice.                                                                                       | 1    |
| **Vault product surface (Customer Complete)** | Vault UI walkthrough; Vault HTTP/CSRF; no leaked later products; no readback in the product.                                                                                     | 2    |

---

## 9. Close criteria

### 9a. Platform Complete (Gate 1) — **CLOSED**

V3-S03 **Platform Complete** is closed (Product Owner 2026-08-17) under [`v3-s03-close-criteria-resolution.md`](./v3-s03-close-criteria-resolution.md) and [`v3-s03-platform-complete-close-report.md`](./v3-s03-platform-complete-close-report.md):

1. Domain slices S03-a … S03-e independently reviewed **PASS**.
2. Platform Complete unit and integration evidence in §§1–2 green.
3. Domain Architecture / Security / Product reviews recorded.
4. Honest limitations recorded: **Customer Complete still open**; **UI owner = Vault**.
5. No Master Plan / Version 2 / Connection Management Audit rewrite.
6. Secret Classification, Secret State Machine, Failure Philosophy, and Secret Ownership Rules evidenced.
7. Customer Complete **not** falsely marked PASS.

**Unlocks:** future packages may consume Vault. Next package: **V3-S04** — start at Implementation Package.

Do **not** start Connection Management. Wave 1 is not complete. Platform Complete does **not** finish Customer Complete.

### 9b. Customer Complete (Gate 2) — **OPEN**

Requires §§3–4, Vault HTTP/CSRF rows, and Customer Complete product checkboxes. Owner remains **Vault**. Connection Management does not absorb this gate.

**Unlocks when done:** operators can manage secrets through the product.

---

**STOP.** V3-S03 **Platform Complete** is closed. **Customer Complete** remains Vault-owned. V3-S04 may begin at Implementation Package. Do not start Connection Management.
