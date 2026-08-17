# V3-S03 Close Criteria Resolution

**Package:** V3-S03 Secret Vault & Encryption
**Date:** 2026-08-17
**Status:** **Product Owner accepted** — V3-S03 **Platform Complete**
**Nature:** Package planning clarification + Close naming. Not an RC. Not an ADR. Not a Master Plan revision. Not Version 2. Not architecture redesign. Not implementation.

---

## Product Owner decision (binding)

| Decision                               | Verdict                                                      |
| -------------------------------------- | ------------------------------------------------------------ |
| Accept Gate 1                          | **Yes**                                                      |
| Package status                         | **V3-S03 Platform Complete** (closed at this gate)           |
| Gate 2                                 | Remains open under **Vault** as **V3-S03 Customer Complete** |
| UI / HTTP / operator walkthrough owner | **Vault** — not Connection Management                        |
| Next package                           | **V3-S04** may open at Implementation Package                |
| Connection Management                  | Still blocked until Wave 1 exit (S04–S06)                    |

Do **not** call this gate a bare “Close.” Use the names below so it is obvious what finished.

---

## Gate names (canonical)

| Gate   | Name                         |
| ------ | ---------------------------- |
| Gate 1 | **V3-S03 Platform Complete** |
| Gate 2 | **V3-S03 Customer Complete** |

| Gate                  | Meaning                                     | Unlocks                                          |
| --------------------- | ------------------------------------------- | ------------------------------------------------ |
| **Platform Complete** | Vault domain is complete and validated      | Future packages may consume Vault                |
| **Customer Complete** | Vault UI and operator workflow are complete | Operators can manage secrets through the product |

**Platform Complete** is what S03-a … S03-e evidenced and what Product Owner closed.
**Customer Complete** is still Vault-owned and deferred.

---

## Future principle (binding for Version 3 packages)

**Not every bounded context is a finished customer product at the same moment as its domain.**

A package may reach **Platform Complete** (domain ready for consumers) before **Customer Complete** (operators can use it in the product UI). Ownership of the customer surface does not move when the platform gate closes.

Examples of the same pattern (illustrative; not new scope):

| Context     | Platform first                  | Customer later                 |
| ----------- | ------------------------------- | ------------------------------ |
| Vault       | Domain + encryption + lifecycle | Vault page + operator workflow |
| Monitoring  | Metrics / events foundation     | Operator monitoring product    |
| Billing     | Billing domain / ledger hooks   | Customer billing UI            |
| AI Platform | Provider ports / policy         | Customer AI product surface    |

This principle exists so architecture is not blocked solely because UI is not ready — **without** pretending the customer product shipped, and **without** transferring UI ownership to another package.

---

## Conflict (resolved)

S03-a … S03-e domain evidence is **PASS**.

Execution of those slices **prohibited** UI, HTTP, consumers, and integrations.

The approved Validation Plan still required customer UI walkthrough and HTTP evidence for a single undifferentiated Close.

Those rules conflicted. This document resolves the conflict with two named gates. Product Owner accepted **Platform Complete**.

---

## Who owns the UI? (honest answer)

### Variant A — rejected as ownership claim

```text
Vault = Domain
Connection Management = Product (including Vault UI)
```

**Rejected.** Connection Management consumes Vault. It does **not** own the Vault page, ciphertext, or secret lifecycle.

### Variant B — accepted ownership

```text
Vault = Domain + Vault product surface (Administration Vault page)
Connection Management = later Connections product that uses Vault
```

**UI owner = Vault.**
**HTTP for Vault routes = Vault transport.**
**Customer walkthrough “Open Vault” = Vault / Customer Complete.**
**Connection Management does not own those.**

---

## What each gate includes

### Platform Complete (Gate 1) — **CLOSED**

- holdable types, classification, ownership rules
- encryption / wrapping-key separation
- lifecycle (create → validate → replace → revoke → delete)
- integrity and concurrency
- workspace isolation and C8 vault authorization (domain)
- retrieve port without consumers
- no plaintext readback/export

### Customer Complete (Gate 2) — **OPEN** (Vault-owned)

- Vault HTTP transport (authenticated, CSRF where cookie sessions apply)
- Vault page in existing Administration chrome
- Secret Vault Walkthrough executed in the product UI
- Reader/Researcher honest unavailable in the product surface

Deferral does not transfer ownership.

---

## What this means

| Question                                        | Answer                                           |
| ----------------------------------------------- | ------------------------------------------------ |
| Is V3-S03 Platform Complete closed?             | **Yes** (Product Owner 2026-08-17)               |
| Is V3-S03 Customer Complete done?               | **No.** Still Vault                              |
| Who owns remaining UI / HTTP / walkthrough?     | **Vault** (Customer Complete)                    |
| May future packages consume Vault?              | **Yes** — unlocked by Platform Complete          |
| May operators manage secrets in the product UI? | **Not yet** — unlocked only by Customer Complete |
| May Connection Management start?                | **No.** Wave 2 waits for Wave 1 exit             |
| Next package?                                   | **V3-S04**                                       |

---

## What is forbidden

- Claiming Connection Management owns Vault UI
- Calling Platform Complete a full customer-product Close
- Claiming Customer Complete while UI/HTTP/walkthrough are missing
- Bypassing Customer First by treating domain tests as a browser walkthrough
- Editing the Master Plan, Version 2, Spec v2.0, Authority Matrix, or Alias Dictionary from this resolution
- Starting Connections from Platform Complete

---

## Documents updated under this resolution

| Document                                                                                 | Change                                                                           |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| This file                                                                                | PO decision; Platform / Customer Complete names; Unlocks table; future principle |
| [`v3-s03-validation-plan.md`](./v3-s03-validation-plan.md)                               | Gate rename; Platform Complete closed                                            |
| [`v3-s03-implementation-package.md`](./v3-s03-implementation-package.md)                 | Close checklist; Platform Complete closed                                        |
| [`secret-vault-readiness-delta.md`](./secret-vault-readiness-delta.md)                   | Two-gate readiness with PO verdict                                               |
| [`v3-s03-platform-complete-close-report.md`](./v3-s03-platform-complete-close-report.md) | Platform Complete Close record                                                   |
| [`version-3-implementation-policy.md`](./version-3-implementation-policy.md)             | Platform vs Customer Complete principle                                          |

---

**STOP.** V3-S03 **Platform Complete** is closed. **Customer Complete** remains Vault-owned. V3-S04 may begin at Implementation Package. Do not start Connection Management.

**End of V3-S03 Close Criteria Resolution.**
