# FIV-CONN-04-D — Token Scope Decision Amendment (Educational Project)

```text
PRODUCT OWNER DECISION AMENDMENT — EDUCATIONAL TOKEN SCOPE
STATUS: DECIDED (this artifact) — Decision Register entry PROPOSED (not yet applied)

NO SOURCE / TEST / SCHEMA / DEPENDENCY / CONFIGURATION CHANGES AUTHORIZED
NO TOKEN GENERATION OR VERIFICATION IMPLEMENTATION AUTHORIZED BY THIS ACT
NO VAULT MACHINE-PRINCIPAL IMPLEMENTATION AUTHORIZED BY THIS ACT
NO SPIFFE / IdP / mTLS / WORKLOAD-IDENTITY INFRASTRUCTURE AUTHORIZED
NO FULL-D STAGES 4–8 AUTHORIZED
KO-COND-01: REMAINS OPEN
FIV-CONN-04-E: NOT AUTHORIZED
BACKFILL: NOT STARTED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**Document:** Formal Product Owner Decision Amendment for FIV-CONN-04-D token architecture scope under an educational-project posture.  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Nature:** **DOCUMENTATION / GOVERNANCE ONLY.** Additive decision record. Does **not** rewrite historical independent-review verdicts. Does **not** silently amend Full-D IA, Kickoff Completion, or Decision Register CURRENT STATE. Does **not** stage, commit, or push. Creates **exactly this one** amendment document in this act.

**Proposed Decision ID:** `D-CONN04-TOKEN-SCOPE`  
**Canonical Decision Register (path verified):** [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md)

**Evidence labels:** **VERIFIED** | **ACCEPTED LIMITATION** | **DEFERRED** | **STILL OPEN** | **RESOLVED BY SCOPE** | **REQUIRES FOLLOW-UP PO DECISION**

---

## 1. Decision title and status

| Field                             | Value                                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Title**                         | FIV-CONN-04-D Educational Token Scope — Retain Existing Token Architecture; Defer Production-Grade Authenticity / Bootstrap |
| **Status**                        | **DECIDED** by Product Owner (recorded in this amendment)                                                                   |
| **Register status**               | **PROPOSED** additive entry `D-CONN04-TOKEN-SCOPE` — register CURRENT STATE **not** modified by this act                    |
| **Closes KO-COND-01?**            | **No**                                                                                                                      |
| **Authorizes Full-D Stages 4–8?** | **No**                                                                                                                      |
| **Authorizes production S2S?**    | **No**                                                                                                                      |

---

## 2. Context and reason for the amendment

### 2.1 Repository baseline (**VERIFIED** this act)

| Field        | Value                                              |
| ------------ | -------------------------------------------------- |
| Branch       | `main`                                             |
| HEAD         | `953292675e197d4f25778aaaa59eacb2826560fe`         |
| Index        | empty                                              |
| Working tree | Pre-existing dirty + untracked files **preserved** |

### 2.2 Why an amendment is needed

Prior governance correctly established that:

1. Variant 2 requires a separately authenticated S2S principal; Nest DI / SYSTEM_JOB strings are not Vault trust roots (**VERIFIED** — trust-boundary review; S2S discovery).
2. Platform S2S Authority ADP proposed **Option A — asymmetric signed short-lived assertions** as the preferred token architecture (**PROPOSED** in ADP; **not** implemented).
3. Independent ADP review recorded verdict **BLOCKED** because workload→issuer bootstrap (F-CRIT-01) and credential enrollment (F-CRIT-02) were undesigned (**historical verdict preserved**).
4. Workload-identity bootstrap discovery recorded `STOP — INSUFFICIENT INFRASTRUCTURE EVIDENCE` (**historical verdict preserved**).
5. Stage 1 / Vault authorization packages separately established that `SecretVaultService.list` still requires human membership + Trader/Admin Role, with **no** machine/token Vault path (**VERIFIED** — `VaultAccessControl`; Stage 1; PO Vault Decision Package).
6. Kickoff Completion keeps **KO-COND-01 OPEN** until a trusted Vault `list` authorization design exists (**VERIFIED**).

The Product Owner now records a **proportionate educational-project scope decision**: do **not** introduce additional infrastructure or authentication complexity at this stage; **retain** the existing selected token-based mechanism; **defer** authenticity / issuer-trust / bootstrap concerns to a future project.

This amendment prevents two governance errors:

- Treating production-grade bootstrap STOP findings as if they force immediate SPIFFE/IdP/mTLS investment for an educational slice.
- Treating educational acceptance of token scope as if it **solved** Vault authorization or closed `KO-COND-01`.

---

## 3. Exact Product Owner decision

The Product Owner decides:

1. **FIV-CONN-04-D is currently an educational project.** Implementation scope shall be proportionate and shall **not** introduce full production-grade service-to-service identity infrastructure at this stage.
2. **The currently selected token-based mechanism remains accepted** for this educational project. That mechanism is the Platform S2S ADP **Option A** direction: asymmetric signed short-lived service assertions (issuer + consumer verification model as already framed).
3. **Do not redesign** the existing token format/mechanism or selected token architecture in this amendment.
4. **Do not introduce** new authentication infrastructure (SPIFFE/SPIRE, external IdP, managed mTLS PKI, cloud workload identity, HSM/KMS enrollment platforms) as part of this amendment.
5. The following concerns are **acknowledged as valid** and **explicitly deferred** to a future project (see §5):
   - Verification of token authenticity and integrity.
   - Verification of token issuer identity and trust.
   - Verification of token provenance and origin.
   - Secure workload credential provisioning and bootstrap.
   - Workload enrollment, credential custody, rotation, and revocation.
   - Production-grade S2S authentication and authorization infrastructure.
6. A **future project** must explicitly revisit those concerns **before** the token mechanism is treated as production-grade S2S authentication. Educational-project assumptions **must not** silently become production security guarantees.
7. This decision **does not** by itself authorize coding, Vault ACL changes, Stages 4–8, FIV-CONN-04-E, backfill execution, or production activation.

---

## 4. Educational-project scope and accepted limitations

### 4.1 In scope for the educational posture

| Item                                                                                                           | Status under this amendment          |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Retain ADP Option A token architecture as the selected educational S2S token direction                         | **Accepted**                         |
| Continue treating B-04 `SYSTEM_JOB` / `system-job:fiv-conn-04-migration-backfill` as business attribution only | **Unchanged** (**VERIFIED** binding) |
| Keep S2S principal conceptually separate from B-04 and from Connection resource IDs                            | **Unchanged**                        |
| Defer production-grade bootstrap / authenticity / enrollment infrastructure                                    | **Accepted** (**DEFERRED**)          |
| Document residual risk honestly                                                                                | **Required**                         |

### 4.2 Accepted educational-project limitations (**ACCEPTED LIMITATION**)

These findings remain **factually true**. The Product Owner **accepts** them as limitations of the educational scope; they are **not** declared false.

| Limitation                                                                                                    | Classification                                                   |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| No evidenced secure workload→issuer bootstrap in-repo                                                         | **ACCEPTED LIMITATION** / **DEFERRED**                           |
| No evidenced production IdP / SPIFFE / mTLS / cloud WI                                                        | **ACCEPTED LIMITATION** / **DEFERRED**                           |
| No evidenced secure workload enrollment / custody / rotation / revocation                                     | **ACCEPTED LIMITATION** / **DEFERRED**                           |
| Issuer signature verification, if later implemented for education, would not by itself prove secure bootstrap | **ACCEPTED LIMITATION** (independent review logic remains valid) |
| Educational tokens are **not** production-grade S2S AuthN                                                     | **ACCEPTED LIMITATION**                                          |

### 4.3 What educational acceptance does **not** mean

- Does **not** mean F-CRIT-01 / F-CRIT-02 were incorrect.
- Does **not** mean network-only or Nest DI trust is suddenly adequate for production.
- Does **not** mean `SecretVaultService.list` will succeed for SYSTEM_JOB without a Vault authorization decision.
- Does **not** close `KO-COND-01`.
- Does **not** authorize implementation of issuer, verifier, or Vault machine principal.

---

## 5. Explicitly deferred production-security concerns

| Deferred concern                                                                                   | Classification                |
| -------------------------------------------------------------------------------------------------- | ----------------------------- |
| Token authenticity and integrity verification (cryptographic validation suitable for production)   | **DEFERRED** — future project |
| Token issuer identity and trust (trust-root ownership, JWKS distribution, key compromise response) | **DEFERRED** — future project |
| Token provenance and origin (proof the requesting workload is Connections Entry)                   | **DEFERRED** — future project |
| Secure workload credential provisioning and bootstrap (F-CRIT-01 class)                            | **DEFERRED** — future project |
| Workload enrollment, credential custody, rotation, revocation (F-CRIT-02 class)                    | **DEFERRED** — future project |
| Production-grade S2S AuthN/AuthZ infrastructure (SPIFFE/IdP/mTLS/cloud WI/HSM as applicable)       | **DEFERRED** — future project |

**Do not represent these concerns as solved.**

---

## 6. Findings from previous architecture reviews that remain valid

Historical verdicts are **preserved**. This amendment does **not** rewrite them.

| Source                                  | Finding                                                       | Under this amendment                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Independent ADP review                  | Verdict **BLOCKED**; F-CRIT-01 bootstrap unspecified          | Remains **historically valid**; for educational progress classified **ACCEPTED LIMITATION** / **DEFERRED**, not “false” |
| Independent ADP review                  | F-CRIT-02 enrollment/custody undesigned                       | Same                                                                                                                    |
| Workload identity bootstrap discovery   | `STOP — INSUFFICIENT INFRASTRUCTURE EVIDENCE`                 | Remains **historically valid** for production selection; educational scope **defers** infrastructure choice             |
| S2S authentication discovery            | `STOP — PLATFORM S2S AUTHORITY REQUIRED`; no in-repo S2S path | Remains **valid** as factual inventory; ADP Option A remains the retained educational token direction                   |
| Trust-boundary review                   | Nest DI ≠ authentication                                      | Remains **valid**                                                                                                       |
| Stage 1 Vault/Entry design              | DI feasible; Vault `list` AuthZ not satisfied by SYSTEM_JOB   | Remains **valid** — **STILL OPEN** for KO-COND-01                                                                       |
| PO Vault Authorization Decision Package | PO-VAULT-A…D undecided; preferred B subject to IA amendment   | Remains **STILL OPEN** / **REQUIRES FOLLOW-UP PO DECISION**                                                             |
| Full-D IA §7.0                          | `list` + exact `vaultSecretId` binding                        | Remains **binding** unless separately amended                                                                           |
| Kickoff Completion                      | KO-COND-01 OPEN; Stages 4–8 blocked                           | Remains **binding**                                                                                                     |

### 6.1 Classification of prior STOP / blocker themes

| Theme                                                                                                      | Resolved by this scope decision?                       | Classification                                       |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| Immediate need to install SPIFFE/IdP/mTLS/cloud WI before educational token architecture can be _selected_ | **Yes (scope)** — infrastructure introduction deferred | **RESOLVED BY SCOPE** for educational selection only |
| Production-ready bootstrap feasibility as a ratification prerequisite for production S2S                   | **No** — deferred, not solved                          | **DEFERRED**                                         |
| Independent review BLOCKED verdict as historical record                                                    | **No rewrite**                                         | **Historically valid**                               |
| Vault human-membership ACL blocking autonomous Entry `list`                                                | **No**                                                 | **STILL OPEN**                                       |
| KO-COND-01                                                                                                 | **No**                                                 | **STILL OPEN**                                       |
| Lack of implemented token issuer/verifier                                                                  | **No** — not authorized here                           | **STILL OPEN** (implementation)                      |
| Full-D Stages 4–8 / E / production                                                                         | **No**                                                 | **STILL OPEN** / **NOT AUTHORIZED**                  |

---

## 7. Impact on the Platform S2S ADP and its blocked review

| Artifact                                                                                                                                                 | Impact                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADP ([`v3-l02-platform-s2s-authority-nestjs-architecture-decision-package.md`](./v3-l02-platform-s2s-authority-nestjs-architecture-decision-package.md)) | **Not rewritten.** Option A remains the **retained educational token architecture**. Production trust-root / custody / bootstrap STOP conditions in the ADP remain valid for **production** treatment.                 |
| Independent review ([`v3-l02-platform-s2s-authority-nestjs-architecture-review.md`](./v3-l02-platform-s2s-authority-nestjs-architecture-review.md))      | **Historical BLOCKED verdict preserved.** This amendment does **not** convert BLOCKED into PASS. It records PO acceptance that educational work will proceed **without** clearing F-CRIT-01/02 as production controls. |
| ADP ratification for production-grade Platform S2S Authority                                                                                             | **Still not granted.** Educational scope ≠ production ADP ratification.                                                                                                                                                |

**Interpretation:** For the educational project, Product Owner elects **not** to unblock production-grade ADP ratification via new infrastructure. Option A token _direction_ is retained; authenticity/bootstrap remain deferred limitations.

---

## 8. Impact on the workload identity bootstrap discovery

| Artifact                                                                                                                 | Impact                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`v3-l02-platform-workload-identity-bootstrap-discovery.md`](./v3-l02-platform-workload-identity-bootstrap-discovery.md) | **Not rewritten.** Discovery verdict `STOP — INSUFFICIENT INFRASTRUCTURE EVIDENCE` remains the correct **infrastructure-selection** result.                    |
| Options A–F infrastructure investment                                                                                    | **Deferred** for educational scope; future project must revisit before production-grade claim.                                                                 |
| D17–D20 / D5 bootstrap decisions                                                                                         | Remain relevant for a **future** production project; **not** forced as immediate educational blockers for _retaining_ Option A as a conceptual token approach. |

**Do not** treat this amendment as evidence that bootstrap infrastructure was found or is unnecessary for production.

---

## 9. Impact on FIV-CONN-04-D IA §7.0

| Question                                                                                                 | Answer                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Must IA §7.0 `SecretVaultService.list` + exact `vaultSecretId` match change because tokens are retained? | **No** — §7.0 metadata access algorithm can **remain unchanged** under the retained token approach (**VERIFIED** binding; Path 1 default). |
| Does retaining tokens amend IA inventory to add issuer/verifier/Vault S2S gate?                          | **No** — not by this act. Any such files remain **out of inventory** until a separate IA amendment + review.                               |
| Does this amendment silently alter the approved IA package hash?                                         | **No** — IA file not modified. Ratified SHA-256 remains `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039`.                |

**If** a later Vault strategy requires new ports/ACL paths, that requires an **explicit IA inventory amendment** (see §12) — not a silent edit.

---

## 10. Impact on `KO-COND-01`

### 10.1 Current condition (**VERIFIED**)

Kickoff Completion requires a Stage 1 design that establishes how Entry obtains Vault `list` authorization without bypass, impersonation, or out-of-inventory ACL redesign — or else seeks separate PO authority.

Stage 1 concluded: Nest DI ≠ Vault AuthZ; SYSTEM_JOB ≠ Vault user; **STOP — SEEK SEPARATE PRODUCT OWNER AUTHORITY** (PO-VAULT-A…D).

### 10.2 Effect of this token-scope amendment

| Claim                                                | Status                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| Token-scope educational decision closes KO-COND-01   | **False** — **KO-COND-01 REMAINS OPEN**                                          |
| Token retention proves `list` authorization succeeds | **False** (**VERIFIED** — `VaultAccessControl` still requires membership + Role) |
| Narrow Kickoff/IA amendment automatically implied    | **No** — Vault strategy still undecided                                          |

```text
KO-COND-01: OPEN — REQUIRED BEFORE STAGE 4 / ANY CONNECTION ENVIRONMENT UPDATE
```

Stages 4–8 remain **BLOCKED** until KO-COND-01 is cleared under a ratified Vault authorization design (separate from this educational token-scope decision).

---

## 11. Vault authorization implications

### 11.1 Critical separation

| Layer                                                             | Role                           | Satisfied by this amendment? |
| ----------------------------------------------------------------- | ------------------------------ | ---------------------------- |
| Educational token architecture retention (ADP Option A direction) | Conceptual S2S assertion model | **Yes** (scope decision)     |
| Production token authenticity / bootstrap                         | Cryptographic workload proof   | **No** — **DEFERRED**        |
| Vault authorization contract for `list`                           | Membership + Role today        | **No** — **STILL OPEN**      |

**Do not assume that retaining tokens automatically authorizes Vault access.**

### 11.2 Repository evidence (**VERIFIED**)

- `SecretVaultService.list` → `authorize` → `VaultAccessControl.assertCanAccess`.
- ACL requires workspace membership (`ownerUserId === userId`) and `Role` allowing `PermissionClass.VaultConnections` (Trader/Admin).
- No token/JWT/S2S branch exists in Vault ACL.
- No machine-principal Vault path is implemented.
- Therefore: even an educational or production S2S token has **no plug-in point** that satisfies the current Vault authorization contract.

### 11.3 Remaining gap (do not invent a solution here)

| Gap                                                                               | Classification                                                                                                                                              |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How Entry presents credentials that `list` accepts                                | **STILL OPEN** / **REQUIRES FOLLOW-UP PO DECISION**                                                                                                         |
| Choice among PO-VAULT-A / B / C / D / KEEP STOP                                   | **STILL OPEN** (see [`v3-l02-fiv-conn-04-d-po-vault-authorization-decision-package.md`](./v3-l02-fiv-conn-04-d-po-vault-authorization-decision-package.md)) |
| Whether educational-project risk acceptance extends to a specific Vault exception | **Not decided by this amendment**                                                                                                                           |

### 11.4 Smallest required follow-up decision (**proposal only**)

Product Owner must still choose a Vault authorization strategy for KO-COND-01 (PO-VAULT-A…D or KEEP STOP), including whether any educational-project exception is permitted, and whether IA inventory amendment is required.

**This amendment stops at that proposal. It does not invent a Vault technical solution and does not close the gate.**

---

## 12. Required follow-up decisions

| ID / topic                                              | Needed?                                                            | Notes                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Decision Register additive entry `D-CONN04-TOKEN-SCOPE` | **Yes** (ratification/recording act)                               | Proposed in §16; not applied in this act                            |
| PO-VAULT-A…D (or KEEP STOP)                             | **Yes** — blocks KO-COND-01                                        | Independent of token authenticity deferral                          |
| IA inventory amendment for Vault S2S/port/ACL           | **Conditional** — only if PO-VAULT path requires out-of-§7 changes | Exact sections TBD by selected option; **do not silently alter IA** |
| Kickoff Completion / KO-COND-01 closure act             | **Only after** Vault strategy ratified + design evidence           | Separate governance act                                             |
| ADP production ratification                             | **Future project**                                                 | Educational retention ≠ production PASS                             |
| Bootstrap D5/D17–D20 for production                     | **Future project**                                                 | Deferred concerns in §5                                             |

### 12.1 If an IA amendment later becomes required (illustrative pointers only)

Do **not** apply these edits in this act. If PO later selects a Vault path needing inventory change, a separate IA amendment should identify at least:

| Area                                                     | Why                                                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Full-D IA §7.0 / §7.1 inventory rows                     | New Vault port, ACL sibling, or Entry→Vault wiring not presently authorized as MODIFY beyond injecting existing `SecretVaultService` |
| Full-D IA constraints on VaultAccessControl / membership | Explicit grant or prohibition for any exception                                                                                      |
| Ratification + renewed independent review                | Required before coding ACL/port changes                                                                                              |
| Separate KO-COND-01 closure act                          | After design evidence exists                                                                                                         |

Proposed wording must be drafted in that future amendment package — **not invented as implementation here**.

---

## 13. Explicit non-goals

This amendment does **not**:

- Redesign ADP Option A token format or claims.
- Implement token issuance or verification.
- Install or integrate SPIFFE/SPIRE, IdP, mTLS CA, cloud WI, KMS/HSM.
- Implement a Vault machine principal or change `VaultAccessControl`.
- Close `KO-COND-01`.
- Amend Full-D IA content or hash.
- Rewrite independent review or discovery verdicts.
- Start Full-D Stages 4–8, backfill, FIV-CONN-04-E, or production activation.
- Convert educational assumptions into production security guarantees.

---

## 14. Future-project security requirements

Before any future project treats the FIV-CONN-04-D / Platform S2S token mechanism as **production-grade** S2S authentication, that project **must** explicitly revisit and decide:

1. Token authenticity and integrity verification.
2. Issuer identity and trust-root ownership / custody.
3. Token provenance / workload→issuer bootstrap (F-CRIT-01 class).
4. Workload enrollment, credential custody, rotation, and revocation (F-CRIT-02 class).
5. Production S2S AuthN/AuthZ infrastructure selection (IdP / SPIFFE / mTLS / cloud WI / secure enrollment).
6. Environment isolation, compromise recovery, and audit guarantees.
7. Relationship to Vault machine-principal AuthZ under production threat models.

Failure to revisit these items means production use remains **unauthorized**, regardless of educational delivery status.

---

## 15. Governance state and implementation restrictions

```text
Full-D IA: GRANTED WITH AMENDMENTS (unchanged; hash fee16e97…b039)
Kickoff: COMPLETED — PASS WITH CONDITIONS (unchanged)
KO-COND-01: OPEN
KO-COND-02: SATISFIED
Full-D implementation execution: NOT STARTED
Stages 4–8: BLOCKED
FIV-CONN-04-E: NOT AUTHORIZED
Backfill: NOT STARTED
Production activation: NOT AUTHORIZED
Live capital / FIV PASS: NOT AUTHORIZED

D-CONN04-TOKEN-SCOPE: DECIDED in this amendment; Decision Register entry PROPOSED
Platform S2S ADP production ratification: NOT GRANTED
Independent ADP review historical verdict: BLOCKED (preserved)
Workload bootstrap discovery historical verdict: STOP — INSUFFICIENT INFRASTRUCTURE EVIDENCE (preserved)
Vault authorization strategy (PO-VAULT-*): STILL OPEN
```

**Implementation restrictions (this act):** documentation/governance analysis only. No application source, tests, Prisma, dependencies, configuration, token crypto, Vault ACL, S2S infrastructure, Full-D coding, backfill, Stage 4+, E, or production activation.

---

## 16. Decision Register entry proposal

**Not applied in this act.** Proposed additive entry for a separate register update / ratification recording:

### Proposed: `D-CONN04-TOKEN-SCOPE` — Educational token scope amendment

| Field                    | Proposed content                                                                                                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **STATUS**               | **DECIDED — EDUCATIONAL SCOPE** (2026-10-30)                                                                                                                                                                                                                              |
| **Authority**            | Product Owner                                                                                                                                                                                                                                                             |
| **Authoritative record** | [`v3-l02-fiv-conn-04-d-token-scope-decision-amendment.md`](./v3-l02-fiv-conn-04-d-token-scope-decision-amendment.md)                                                                                                                                                      |
| **Decision**             | Retain ADP Option A token-based mechanism for educational FIV-CONN-04-D; do not introduce production-grade S2S identity infrastructure now; defer authenticity / issuer trust / provenance / bootstrap / enrollment / custody / rotation / revocation to a future project |
| **Does not**             | Close KO-COND-01; authorize Vault ACL/machine principal; authorize Stages 4–8; authorize E; authorize production S2S; rewrite historical BLOCKED/STOP review verdicts                                                                                                     |
| **Still required**       | Separate PO Vault authorization decision (PO-VAULT-A…D or KEEP STOP); KO-COND-01 remains OPEN until cleared under that path                                                                                                                                               |
| **Class**                | GOVERNANCE / PO — Connections / CONN-04-D **educational token scope**                                                                                                                                                                                                     |

**Suggested CURRENT GOVERNANCE STATE row (additive, when register is updated):**

| Item                                                         | Status                                                                                          |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| FIV-CONN-04-D educational token scope (D-CONN04-TOKEN-SCOPE) | **DECIDED — EDUCATIONAL SCOPE**; KO-COND-01 **still OPEN**; Vault AuthZ strategy **still OPEN** |

**Suggested STOP paragraph delta (when register is updated):** note educational token-scope decision recorded; do **not** remove KO-COND-01 OPEN language.

---

## 17. Cross-reference map (governance consistency)

| Document                                | Update required by this act?                            | Guidance                                                          |
| --------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| This amendment                          | **Created**                                             | Authoritative educational scope record                            |
| Decision Register                       | **Additive entry proposed**; file **not** modified here | Apply in separate register act                                    |
| Full-D IA                               | **No content change**                                   | §7.0 remains; inventory change only if future Vault path needs it |
| Kickoff Completion                      | **No rewrite**                                          | KO-COND-01 remains OPEN                                           |
| Independent ADP review                  | **No rewrite**                                          | Preserve BLOCKED                                                  |
| Workload bootstrap discovery            | **No rewrite**                                          | Preserve STOP infrastructure verdict                              |
| S2S authentication discovery            | **No rewrite**                                          | Cross-reference only                                              |
| Stage 1 Vault/Entry design              | **No rewrite**                                          | Gap remains for Vault actor                                       |
| PO Vault Authorization Decision Package | **No rewrite**                                          | Still the decision surface for KO-COND-01                         |

---

## 18. Explicit non-authorization

```text
THIS AMENDMENT DOES NOT CLOSE KO-COND-01.
THIS AMENDMENT DOES NOT AUTHORIZE VAULT ACCESS.
THIS AMENDMENT DOES NOT AUTHORIZE TOKEN IMPLEMENTATION.
THIS AMENDMENT DOES NOT AUTHORIZE FULL-D STAGES 4–8.
THIS AMENDMENT DOES NOT AUTHORIZE FIV-CONN-04-E.
THIS AMENDMENT DOES NOT AUTHORIZE PRODUCTION ACTIVATION.
THIS AMENDMENT DOES NOT DECLARE PRODUCTION-GRADE S2S AUTHENTICATION ACHIEVED.
```

---

_End of Decision Amendment. Educational token scope decided; production authenticity/bootstrap deferred; Vault authorization and KO-COND-01 remain open._
