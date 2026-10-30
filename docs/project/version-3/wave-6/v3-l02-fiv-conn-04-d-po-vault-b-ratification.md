# FIV-CONN-04-D — Product Owner Ratification: PO-VAULT-B

**Document:** Formal Product Owner ratification of educational Full-D Vault metadata authorization strategy  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Decision ID:** **D-CONN04-PO-VAULT-B**  
**Authority:** Product Owner  
**Status:** **RATIFIED — PO-VAULT-B**  
**Selected option:** **PO-VAULT-B — APPROVE** (Dedicated Internal Vault Metadata Port)

**Nature:** **GOVERNANCE / DOCUMENTATION ONLY.** Does **not** amend Full-D IA. Does **not** close `KO-COND-01`. Does **not** authorize implementation, Nest providers, Vault ACL changes, Stages 4–8, backfill, FIV-CONN-04-E, or production activation. Does **not** stage, commit, or push.

```text
D-CONN04-PO-VAULT-B = RATIFIED — PO-VAULT-B
SELECTED: PO-VAULT-B — APPROVE
DECISION DATE: 2026-10-30
AUTHORITY: Product Owner

BINDING PRIOR: D-CONN04-TOKEN-SCOPE (educational token scope)
FULL-D IA: UNCHANGED (hash fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039)
KO-COND-01: OPEN — PENDING FULL-D IA INVENTORY AMENDMENT, INDEPENDENT REVIEW, AND SEPARATE CLOSURE ACT
IMPLEMENTATION AUTHORIZATION FOR PORT: NOT GRANTED
FULL-D STAGES 4–8: BLOCKED
FIV-CONN-04-E: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

---

## 1. Decision title and identifier

| Field           | Value                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| **Title**       | Educational Full-D Vault Metadata Authorization — Dedicated Internal Port |
| **Decision ID** | `D-CONN04-PO-VAULT-B`                                                     |
| **Status**      | `RATIFIED — PO-VAULT-B`                                                   |
| **Option**      | `PO-VAULT-B — APPROVE`                                                    |

---

## 2. Selected option and exact scope

The Product Owner selects a **dedicated internal Vault metadata port** for the FIV-CONN-04-D Entry.

The port **must**:

1. Be dedicated to the FIV-CONN-04-D metadata-access use case.
2. Expose **metadata only**.
3. Be available only through the explicitly approved internal composition path.
4. Preserve **autonomous** Full-D execution.
5. Preserve canonical B-04 SYSTEM_JOB business audit attribution.
6. Bind metadata access to Connection-derived `workspaceId` and `vaultSecretId`.
7. Avoid exposing broad Vault service capabilities to the Entry.
8. Avoid introducing production-grade S2S identity infrastructure in this educational project.

Exact port/provider names, file paths, and repository query shape are **deferred** to a separate Full-D IA inventory amendment (see §12). This ratification does **not** invent those implementation details.

---

## 3. Reference to `D-CONN04-TOKEN-SCOPE`

Binding prior decision recorded in:

[`v3-l02-fiv-conn-04-d-token-scope-decision-amendment.md`](./v3-l02-fiv-conn-04-d-token-scope-decision-amendment.md)

Under `D-CONN04-TOKEN-SCOPE`:

- FIV-CONN-04-D is an educational project.
- ADP Option A token architecture is retained; not redesigned here.
- Production-grade SPIFFE/IdP/mTLS/cloud WI/KMS enrollment and token authenticity / bootstrap / enrollment / custody / rotation / revocation remain **deferred** and **unsolved**.
- Token-scope retention is **not** automatic Vault authorization.
- ADP tokens must **not** be used as proof of Vault authorization unless a **separate** future decision explicitly establishes that relationship.

This PO-VAULT-B ratification **does not** change `D-CONN04-TOKEN-SCOPE`.

---

## 4. Explicit educational-project trust acceptance

The Product Owner **accepts** the following limited architectural trust assumption:

> The internal NestJS composition boundary, provider visibility, and controlled dependency injection path are accepted as the educational project's **caller-access boundary** for this dedicated metadata capability.

This is an **architectural boundary**, **not** cryptographic authentication.

It **must not** be described as:

- Production-grade service authentication.
- Cryptographic proof of Entry identity.
- Proof of token issuer authenticity.
- Proof of token provenance.
- A production security guarantee.

---

## 5. Metadata-only restrictions

The dedicated port may expose only the minimum metadata required by Full-D.

It **must not** expose:

- Secret plaintext
- Ciphertext
- Decryption
- Secret retrieval
- Secret creation
- Secret update
- Secret deletion
- Secret revocation
- General Vault administration
- Arbitrary Vault repository access

**Qualification (preserved):** Returning a metadata DTO does **not** automatically prove that the underlying repository query never loads ciphertext. Data-minimization of the repository query is a **separate** design/implementation concern for the authorized IA-amendment / planning stage — **not** decided here.

---

## 6. Workspace and resource binding restrictions

Every metadata request **must** be constrained by:

1. The `workspaceId` derived from the relevant Connection context.
2. The exact `vaultSecretId` associated with that Connection.
3. The existing Full-D eligibility and B-04 write-gate requirements.

The port **must not** become a general workspace-listing or arbitrary cross-workspace query interface.

Exact-id freshness intent remains aligned with Full-D IA §7.0 algorithm (`meta.id === vaultSecretId`), subject to inventory amendment of the Entry call-site (port vs human `SecretVaultService.list`) in a **future** IA amendment act.

---

## 7. Identity separation

Keep these concepts **separate**:

| #   | Concept                            | Binding content                                                                 |
| --- | ---------------------------------- | ------------------------------------------------------------------------------- |
| 1   | B-04 business audit identity       | `actorKind = SYSTEM_JOB`; `actorId = system-job:fiv-conn-04-migration-backfill` |
| 2   | Internal Vault metadata capability | Narrowly scoped port + approved internal composition boundary                   |
| 3   | Resource context                   | Connection-derived `workspaceId` and `vaultSecretId`                            |

The port **must not** replace or alter canonical SYSTEM_JOB attribution.  
SYSTEM_JOB actor strings **must not** be treated as Vault authentication.

---

## 8. No external actor ingress

Do **not** accept caller-supplied trust material through public API, DTO, job payload, or other external ingress, including:

- `actorId` / `actorKind`
- `userId` / `Role`
- `workspaceId` as an independently trusted authorization claim
- `isInternal` / `isTrusted`
- Similar boolean or string trust flags

---

## 9. Explicit non-goals

This ratification does **not**:

- Amend or re-hash the approved Full-D IA.
- Close `KO-COND-01`.
- Authorize coding of the port, Vault ACL changes, or Entry Vault wiring.
- Authorize Stages 4–8, backfill execution, FIV-CONN-04-E, or production activation.
- Introduce SPIFFE/SPIRE, mTLS infrastructure, external IdP, OAuth client-credentials, cloud workload identity, KMS/HSM enrollment, production issuer bootstrap, or a workload registry.
- Establish ADP tokens as Vault AuthZ proof.
- Rewrite historical Trust-Boundary / Stage 1 / independent-review findings as false.
- Globally export the port or make it available to unrelated modules.

---

## 10. Historical findings preserved

The following remain **factually valid** (not declared false by this ratification):

| Source                               | Finding preserved                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| Trust-Boundary Review                | Nest module visibility is not authentication; DI does not cryptographically prove Entry       |
| Trust-Boundary Review                | A dedicated port is a bounded API surface; possession of the port is the effective capability |
| Trust-Boundary Review                | A port that bypasses `VaultAccessControl` is a **separate Vault privilege grant**             |
| Trust-Boundary Review                | Nest DI does not guarantee only one importer can obtain exported Vault providers              |
| Stage 1 / Vault packages             | Human `list` ACL requires membership + Role; SYSTEM_JOB cannot satisfy it today               |
| Educational Vault Decision Package   | PO-VAULT-B requires IA inventory amendment before implementation                              |
| Platform S2S / bootstrap discoveries | Production bootstrap / authenticity gaps remain deferred under TOKEN-SCOPE                    |

The Product Owner **accepts** the Nest composition trust model for the **educational** project **subject to** §§4–8 constraints — without claiming cryptographic Authentication.

---

## 11. Full-D IA impact

| Item                                  | Status                                                                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Approved Full-D IA package            | **Unchanged**                                                                                                                                                        |
| Package path                          | [`v3-l02-fiv-conn-04-d-implementation-authorization.md`](./v3-l02-fiv-conn-04-d-implementation-authorization.md)                                                     |
| Ratified SHA-256                      | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039`                                                                                                   |
| IA ratification                       | [`v3-l02-fiv-conn-04-d-full-implementation-authorization-ratification.md`](./v3-l02-fiv-conn-04-d-full-implementation-authorization-ratification.md) — **unchanged** |
| Current §7.0 binding                  | `SecretVaultService.list()` + exact `meta.id === vaultSecretId`                                                                                                      |
| Dedicated port in approved inventory? | **No**                                                                                                                                                               |

**PO-VAULT-B is not implementable under the existing IA inventory.** A separate IA amendment is mandatory before any port coding.

---

## 12. Required IA amendment contents (future act — not decided here)

A future Full-D IA inventory amendment **must** specify, before implementation:

1. Exact port/provider name and ownership.
2. Exact source files to be added or modified.
3. Vault module changes.
4. Connections module composition changes.
5. Exact Entry injection boundary.
6. Metadata return type and permitted fields.
7. Workspace and exact-secret binding.
8. Whether the port uses a new Vault-side authorization policy or a dedicated capability policy.
9. Explicit denial of all non-metadata operations.
10. Failure and audit semantics.
11. Required security and regression tests.
12. Export-wall and unrelated-module access restrictions.
13. Data-minimization implications of the underlying repository query.

**Do not** treat this ratification as silently deciding those details.

---

## 13. Required independent review

After the IA amendment is prepared:

1. Independent review of the amended Full-D IA.
2. Explicit approval of the amended IA (separate governance act).
3. Security/control evidence during authorized design/implementation planning (export walls; metadata-only; workspace isolation; no external ingress; SYSTEM_JOB attribution unchanged).

---

## 14. KO-COND-01 status

```text
KO-COND-01: OPEN — PENDING FULL-D IA INVENTORY AMENDMENT, INDEPENDENT REVIEW, AND SEPARATE CLOSURE ACT
```

This ratification **alone does not close** `KO-COND-01`.

Required next steps (sequence):

1. Prepare Full-D IA amendment for PO-VAULT-B.
2. Conduct independent IA amendment review.
3. Obtain explicit approval of the amended IA.
4. Demonstrate required security controls and test evidence during authorized design/implementation planning.
5. Complete the Vault/Entry design condition (Kickoff Completion §6 / Stage 1 alignment).
6. Perform a **separate** formal KO-COND-01 closure act.

Stages 4–8 remain **BLOCKED** until KO-COND-01 is closed under that process.

---

## 15. Implementation authorization status

| Item                                            | Status                          |
| ----------------------------------------------- | ------------------------------- |
| Port / Vault / Entry coding                     | **NOT AUTHORIZED** by this act  |
| Full-D Stages 4–8                               | **BLOCKED** (`KO-COND-01` OPEN) |
| Full-D implementation execution                 | **NOT STARTED**                 |
| Backfill execution                              | **NOT AUTHORIZED**              |
| FIV-CONN-04-E                                   | **NOT AUTHORIZED**              |
| Production activation / live capital / FIV PASS | **NOT AUTHORIZED**              |

---

## 16. Decision Register

Canonical register: [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md)

**Additive entry:** `D-CONN04-PO-VAULT-B` — **RATIFIED — PO-VAULT-B** (this artifact).  
**Prerequisite reference:** `D-CONN04-TOKEN-SCOPE` (educational token scope amendment).

Register CURRENT STATE / STOP language must continue to show **`KO-COND-01 OPEN`** and must **not** claim IA amendment, implementation authorization, or KO-COND-01 closure.

---

## 17. Required next governance sequence

```text
1. D-CONN04-PO-VAULT-B ratified (THIS ACT)
2. Separate Product Owner instruction → prepare Full-D IA inventory amendment for PO-VAULT-B
3. Independent review of amended IA
4. Explicit approval of amended IA
5. Stage 1 / Vault-Entry design alignment to port
6. Separate KO-COND-01 closure act
7. Only then: Stages 4–8 under amended IA (still not E / production unless separately authorized)
```

**Stop after this ratification.** Wait for separate Product Owner instruction before preparing the IA amendment or any implementation work.

---

## 18. Evidence reviewed

| Artifact                                                                                                                                                                   | Role                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [`v3-l02-fiv-conn-04-d-token-scope-decision-amendment.md`](./v3-l02-fiv-conn-04-d-token-scope-decision-amendment.md)                                                       | Binding `D-CONN04-TOKEN-SCOPE`            |
| [`v3-l02-fiv-conn-04-d-po-vault-authorization-decision-package-educational-scope.md`](./v3-l02-fiv-conn-04-d-po-vault-authorization-decision-package-educational-scope.md) | Educational options + recommendation of B |
| [`v3-l02-fiv-conn-04-d-po-vault-authorization-decision-package.md`](./v3-l02-fiv-conn-04-d-po-vault-authorization-decision-package.md)                                     | Original PO-VAULT-A…D definitions         |
| [`v3-l02-fiv-conn-04-d-po-vault-trust-boundary-review.md`](./v3-l02-fiv-conn-04-d-po-vault-trust-boundary-review.md)                                                       | DI ≠ AuthN; port privilege grant          |
| [`v3-l02-fiv-conn-04-d-stage-1-vault-entry-design.md`](./v3-l02-fiv-conn-04-d-stage-1-vault-entry-design.md)                                                               | KO-COND-01 Vault gap                      |
| [`v3-l02-fiv-conn-04-d-implementation-authorization.md`](./v3-l02-fiv-conn-04-d-implementation-authorization.md)                                                           | §7.0 inventory (unchanged)                |
| [`v3-l02-fiv-conn-04-d-full-implementation-authorization-ratification.md`](./v3-l02-fiv-conn-04-d-full-implementation-authorization-ratification.md)                       | IA grant + hash binding                   |
| [`v3-l02-fiv-conn-04-d-kickoff-completion.md`](./v3-l02-fiv-conn-04-d-kickoff-completion.md)                                                                               | KO-COND-01 OPEN                           |
| [`v3-l02-fiv-conn-04-d-implementation-kickoff-review.md`](./v3-l02-fiv-conn-04-d-implementation-kickoff-review.md)                                                         | Kickoff PASS WITH CONDITIONS              |
| [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md)                                                                                                       | Additive registration target              |

---

## 19. Explicit non-authorization banner

```text
THIS ACT RATIFIES STRATEGY SELECTION ONLY (PO-VAULT-B).
THIS ACT DOES NOT AMEND FULL-D IA.
THIS ACT DOES NOT CLOSE KO-COND-01.
THIS ACT DOES NOT AUTHORIZE IMPLEMENTATION.
THIS ACT DOES NOT AUTHORIZE STAGES 4–8.
THIS ACT DOES NOT AUTHORIZE FIV-CONN-04-E.
THIS ACT DOES NOT AUTHORIZE PRODUCTION ACTIVATION.
WAIT FOR SEPARATE PRODUCT OWNER INSTRUCTION BEFORE IA AMENDMENT OR CODING.
```

---

_End of D-CONN04-PO-VAULT-B ratification._
