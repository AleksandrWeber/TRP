# V3-S03-b Implementation Report

**Package:** V3-S03 Secret Vault & Encryption
**Slice:** S03-b — Encryption and wrapping-key separation
**Wave:** 1 — Security Foundation
**Date:** 2026-08-17
**Status:** Slice implemented — **not** package Close
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Package:** [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md)
**Nature:** Implementation report. Not an RC. Not an ADR. Not a Master Plan revision.

This report covers **S03-b only**. S03-c through S03-e were not started. V3-S03 is not Closed.

---

## What shipped

The Credential Vault now holds customer vendor secrets as ciphertext. A host wrapping key is required to store or retrieve. Missing or wrong wrapping key fails closed. Paper, authentication, and research continue. Operator labels remain **Stored**, **Vault Connected**, and **Revoked**. The word “encrypted” is not an operator status.

| Behavior             | Result                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Secret encryption    | Submitted material is wrapped before persist. Persisted form is not plaintext                                               |
| Secret decryption    | Authorized retrieve unwraps in server memory only. Not a customer API                                                       |
| Wrapping key usage   | Host-held `VAULT_WRAPPING_KEY`. Not a Vault record. Not stored with ciphertext                                              |
| Missing wrapping key | Store and retrieve fail closed. Module and API boot do not fail                                                             |
| Wrong wrapping key   | Retrieve fails closed. Secret remains unavailable. Paper continues                                                          |
| Validation           | Existing well-formed fields still required before wrap. Incomplete material is not stored. Typed contracts remain **S03-c** |
| Secure storage model | Records persist ciphertext only. `vault_secrets` has no plaintext columns. Wrapping key is not a column                     |
| Integrity            | Tampered ciphertext and mismatched workspace binding fail closed                                                            |
| Operator labels      | Stored / Vault Connected / Revoked. No “encrypted” status                                                                   |
| HTTP / UI            | **None**                                                                                                                    |
| Consumers            | **None**                                                                                                                    |

---

## Files touched

| Area                 | Path                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Envelope wrap/unwrap | `apps/api/src/modules/secret-vault/secret-envelope.ts`                                               |
| Ciphertext model     | `apps/api/src/modules/secret-vault/secret-ciphertext.ts`                                             |
| Wrapping key         | `apps/api/src/modules/secret-vault/wrapping-key.ts`                                                  |
| Persist policy       | `apps/api/src/modules/secret-vault/secret-persist.ts`, `plaintext-persist.ts`                        |
| Record               | `apps/api/src/modules/secret-vault/secret-record.ts`                                                 |
| Service              | `apps/api/src/modules/secret-vault/secret-vault.service.ts`                                          |
| Stores               | `in-memory-secret-vault.repository.ts`, `prisma-secret-vault.repository.ts`                          |
| Module               | `apps/api/src/modules/secret-vault/secret-vault.module.ts`                                           |
| Schema               | `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260817120000_v3_s03_b_vault_secrets/` |
| Host example         | `.env.example` (`VAULT_WRAPPING_KEY` commented; unset keeps Vault unavailable)                       |

Tests: `secret-vault.encryption.spec.ts`, `secret-envelope.spec.ts`, `wrapping-key.spec.ts`, plus updated lifecycle, failure, state, and boundary specs.

---

## Done-when (package slice)

From the Implementation Package S03-b:

| Criterion                                        | Result                                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Secrets at rest are ciphertext                   | **Met** — persisted snapshot does not contain submitted plaintext                  |
| Wrapping key is not stored with ciphertext       | **Met** — wrapping key is not a record field or column                             |
| Production-like config refuses plaintext persist | **Met** — process-memory and production-like both refuse plaintext persist         |
| List/read models have no secret fields           | **Met**                                                                            |
| Missing wrapping key does not fail API boot      | **Met** — `wrappingKeyUnsetMustFailApiBoot()` is false; store/retrieve fail closed |
| Wrong wrapping key fails closed                  | **Met** — retrieve unavailable; metadata is not a decrypt path                     |
| No second vault                                  | **Met**                                                                            |
| `DATABASE_URL` not stored in Vault               | **Met**                                                                            |
| Algorithms not treated as Master Plan            | **Met** — outcomes in this report; wrap details stay in Security Review            |

---

## Honest limitations

- There is no Vault page. Operator labels are domain values only. UI is **S03-d**.
- Holdable-type field contracts remain generic non-empty fields. Typed validation is **S03-c**.
- C8 vault cells, HTTP isolation, adapter retrieve wiring, and structured events are **S03-e**. Domain retrieve exists and decrypts in memory. It is not a customer API and has no consumers.
- Durable `vault_secrets` exists. Unit tests prove ciphertext snapshot reload. Applying the migration is a host step, like other Prisma tables.
- Existing `.env` OpenRouter reader is unchanged. Dual-run consume is later.
- Host wrapping-key custody (HSM / KMS) is not this slice. The host env key is the wrapping key used here.

---

## What this slice did not do

| Item                                                       | Result         |
| ---------------------------------------------------------- | -------------- |
| S03-c Credential validation (no vendor I/O)                | Not started    |
| S03-d Secret Vault product (UI)                            | Not started    |
| S03-e Access, isolation, retrieve port, events             | Not started    |
| Binance / Telegram / SMTP / OpenRouter products            | Out of package |
| Connection Management / rotation automation / Live Trading | Out of package |
| HTTP / UI copy using “encrypted”                           | None added     |
| Version 2 documents / Connection Management Audit          | Unmodified     |
| Master Plan / Policy / Template                            | Unmodified     |
| RC / ADR                                                   | None           |

---

## Next slice (not this task)

**S03-c — Credential validation (no vendor I/O).**

Do not start it in this task.

---

**STOP.** Wait for Product Owner review before beginning S03-c.

**End of S03-b Implementation Report.**
