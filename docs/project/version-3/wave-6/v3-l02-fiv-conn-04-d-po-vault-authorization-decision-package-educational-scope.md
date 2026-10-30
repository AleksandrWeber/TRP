# FIV-CONN-04-D — PO Vault Authorization Decision Package (Educational Scope)

```text
PREPARED — PENDING PRODUCT OWNER SELECTION

DECISION PREPARATION ONLY
DOES NOT AUTHORIZE IMPLEMENTATION
DOES NOT CLOSE KO-COND-01
DOES NOT AMEND FULL-D IA
DOES NOT AMEND THE DECISION REGISTER
DOES NOT AUTHORIZE VAULT ACCESS
DOES NOT CLAIM TOKEN PROVENANCE IS PRODUCTION-VERIFIED

Binding prior decision: D-CONN04-TOKEN-SCOPE (educational token scope)
Full-D IA: GRANTED WITH AMENDMENTS (hash unchanged)
Kickoff: COMPLETED — PASS WITH CONDITIONS
KO-COND-01: OPEN
Full-D implementation: NOT STARTED
Stages 4–8: BLOCKED
FIV-CONN-04-E: NOT AUTHORIZED
Production activation: NOT AUTHORIZED
```

**Document:** Updated, evidence-based Product Owner decision package for selecting a proportionate Vault authorization approach for educational FIV-CONN-04-D under binding `D-CONN04-TOKEN-SCOPE`.  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Nature:** **DOCUMENTATION / DECISION PREPARATION ONLY.** Reassesses original PO-VAULT-A…D and KEEP STOP. Does **not** replace original option identifiers or meanings. Does **not** redesign ADP Option A tokens. Does **not** modify source, tests, schema, dependencies, configuration, Full-D IA, Kickoff, Decision Register, or prior review verdicts. Does **not** stage, commit, or push.

**Parent / prior package (preserved):** [`v3-l02-fiv-conn-04-d-po-vault-authorization-decision-package.md`](./v3-l02-fiv-conn-04-d-po-vault-authorization-decision-package.md)  
**Binding token-scope amendment:** [`v3-l02-fiv-conn-04-d-token-scope-decision-amendment.md`](./v3-l02-fiv-conn-04-d-token-scope-decision-amendment.md) (`D-CONN04-TOKEN-SCOPE`)  
**Canonical Decision Register:** [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md)

**Evidence labels:** **VERIFIED** | **INFERRED** | **ACCEPTED LIMITATION** | **DEFERRED** | **STILL OPEN** | **REQUIRES PO DECISION**

**Recommendation status:** A recommendation appears in §12. It is **not** a Product Owner decision.

---

## 1. Decision title and status

| Field                        | Value                                                         |
| ---------------------------- | ------------------------------------------------------------- |
| **Title**                    | Educational-scope Vault authorization strategy for KO-COND-01 |
| **Status**                   | `PREPARED — PENDING PRODUCT OWNER SELECTION`                  |
| **Closes KO-COND-01?**       | **No** (selection alone is insufficient; see §15)             |
| **Authorizes coding?**       | **No**                                                        |
| **Authorizes Vault access?** | **No**                                                        |

---

## 2. Binding Product Owner context — `D-CONN04-TOKEN-SCOPE`

Treated as **binding** for this package:

1. FIV-CONN-04-D is currently an **educational** project.
2. Retain the selected token architecture: Platform S2S ADP **Option A** (asymmetric short-lived assertions) — **do not reopen or redesign**.
3. Do **not** introduce SPIFFE/SPIRE, external IdP, managed mTLS, cloud workload identity, KMS/HSM enrollment, or equivalent production-grade S2S infrastructure for this educational project.
4. Defer production-grade token authenticity, issuer trust, provenance, workload bootstrap, enrollment, custody, rotation, and revocation to a **future** project.
5. Do **not** represent those deferred concerns as solved.
6. Token-scope retention is **not** automatic Vault authorization.
7. `KO-COND-01` remains **OPEN** until a separate Vault authorization decision **and** required governance steps complete.

**Implication for this package:** Vault AuthZ must be decidable **without** requiring production-grade S2S bootstrap infrastructure, and **without** pretending educational tokens are production-verified caller proof.

---

## 3. Repository baseline (**VERIFIED** this act)

| Field                         | Value                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| Branch                        | `main`                                                                                           |
| HEAD                          | `953292675e197d4f25778aaaa59eacb2826560fe`                                                       |
| Index                         | empty                                                                                            |
| Working tree                  | Pre-existing dirty + untracked files **preserved**                                               |
| Full-D IA SHA-256             | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` (**unchanged**; not modified) |
| Token-scope amendment SHA-256 | `9e0c46ec1bb41aae826f40d4db93d4a32ef11a0666309ca4ddc1276595a8c9ac`                               |
| Decision Register             | **Not modified** by this act                                                                     |

---

## 4. Verified current repository facts

Re-verified against current application code and governing docs.

### 4.1 Vault `list` authorization (**VERIFIED**)

| Fact                                                                                                                  | Evidence                                                                                      |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `SecretVaultService.list(actorWorkspaceId, workspaceId, actorRole?)` always authorizes before repository read         | `secret-vault.service.ts` `list` → `this.authorize(...)`                                      |
| `authorize` maps `actorWorkspaceId` → `VaultActor.userId` and calls `VaultAccessControl.assertCanAccess`              | `secret-vault.service.ts` private `authorize`                                                 |
| ACL requires workspace membership (`ownerUserId === userId`) **and** Role allowing `PermissionClass.VaultConnections` | `vault-access-control.ts`; Trader/Admin only (**VERIFIED** permission matrix / prior Stage 1) |
| Omitting / unknown Role fails closed                                                                                  | `vault-access-control.spec.ts`; Stage 1                                                       |
| No token / JWT / S2S / machine-principal branch in Vault ACL                                                          | Re-scan of `secret-vault/` — **ABSENT**                                                       |
| Comment: caller-supplied workspace/role claims alone are never sufficient                                             | `vault-access-control.ts` class docstring                                                     |

### 4.2 SYSTEM_JOB / Entry (**VERIFIED**)

| Fact                                                                                   | Evidence                                                         |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `PrivilegedActorContext` = `{ actorId, actorKind, correlationId? }`                    | `migration-gate.ts`                                              |
| No `userId`, `Role`, or `workspaceId` on privileged actor                              | Same                                                             |
| Canonical Full-D identity = `SYSTEM_JOB` / `system-job:fiv-conn-04-migration-backfill` | `fiv-conn-04-d-system-job-identity.ts`                           |
| SYSTEM_JOB factory is attribution / B-04 boundary — **not** Vault AuthN/AuthZ          | Identity module comments + Stage 1                               |
| Nest DI of `SecretVaultService` into Entry is feasible; does **not** authorize `list`  | Stage 1; `ConnectionsModule` already imports `SecretVaultModule` |

### 4.3 Full-D IA §7.0 algorithm (**VERIFIED** binding)

Fresh Vault **metadata** by exact `vaultSecretId` via:

1. `SecretVaultService.list(...)` → metadata array
2. Exact match `meta.id === connection.vaultSecretId`

`SecretVaultService.get` is **not** exact-id (**VERIFIED** — slot `type`/`purpose`). Inventory lists `SecretVaultService` as **REUSE**, Entry as **MODIFY**. `VaultAccessControl` is **not** currently listed as an authorized MODIFY target. No new Vault port is in inventory.

### 4.4 Distinctions that must not be collapsed

| Concept                                    | Meaning in this package                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| **Authentication**                         | Proof of _who/what_ is calling (workload / operator / Entry)                      |
| **Authorization**                          | Whether that caller may obtain Vault **metadata** for a workspace / id            |
| **Business audit attribution**             | B-04 `SYSTEM_JOB` / canonical `actorId` on Connection environment backfill audits |
| **Resource ownership / workspace binding** | Connection-derived `workspaceId` + exact `vaultSecretId`; cross-tenant isolation  |

Under `D-CONN04-TOKEN-SCOPE`, production-grade Authentication for S2S tokens is **DEFERRED**. That deferral does **not** waive Authorization, attribution separation, or workspace binding.

---

## 5. Exact original options (preserved)

Identifiers and meanings from [`v3-l02-fiv-conn-04-d-po-vault-authorization-decision-package.md`](./v3-l02-fiv-conn-04-d-po-vault-authorization-decision-package.md) §§5 / 10 — **not replaced**.

### PO-VAULT-A — Capability-scoped SYSTEM_JOB authorization exception

Allow a **narrow** Vault **metadata list** authorization for invocations proven to originate from the trusted FIV-CONN-04-D Entry (or an equivalently bounded capability), **without** granting human-user membership.

### PO-VAULT-B — Dedicated internal Vault metadata port

Introduce a **dedicated internal** Nest capability (port/provider) that returns workspace Vault **metadata** (or exact-id metadata) for CONN-04-D Entry use, **without** using the human-user `list(actorWorkspaceId, workspaceId, actorRole?)` contract.

### PO-VAULT-C — Operator-supervised Vault context

Nest-internal invocation supplies a **valid human Vault context** (owner `userId` + permitted Role) for `SecretVaultService.list`, while Entry still builds SYSTEM_JOB for B-04.

### PO-VAULT-D — Reject autonomous `list`; redesign freshness evidence

Do **not** authorize SYSTEM_JOB/`list` under current ACL; require another freshness evidence path (contradicts current IA §7.0 / D-06 as written unless redesigned).

### REJECT ALL OPTIONS / KEEP STOP

Maintain STOP on Stages 4–8 / Vault freshness path; approve none of A–D for implementation.

_(Original package also offered **RETURN FOR FURTHER DISCOVERY**; retained as available non-selection.)_

---

## 6. Option-by-option reassessment under educational scope

For each option: required changes; AuthN/AuthZ/attribution; IA impact; KO-COND-01; educational limits.

### 6.1 PO-VAULT-A

| Question                                             | Assessment                                                                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Actual changes                                       | Likely `VaultAccessControl` and/or sibling gate + Entry call-site; metadata-list only                                  |
| New Vault AuthZ path?                                | **Yes** (ACL exception / sibling)                                                                                      |
| New token issuer/verifier?                           | **No** (must not require production token infra under TOKEN-SCOPE)                                                     |
| Production S2S bootstrap?                            | **No** if Entry “proof” is **educational** composition binding — **not** SPIFFE/IdP                                    |
| Depends on human userId/Role?                        | **No** (by design)                                                                                                     |
| Changes `SecretVaultService` / `VaultAccessControl`? | ACL **yes** (likely); service maybe narrow helper                                                                      |
| New port/module boundary?                            | Optional sibling helper; risk of generalizing SYSTEM_JOB                                                               |
| IA §7.0 algorithm?                                   | Can **preserve** `list` + exact-id if Entry still calls `list` after exception                                         |
| IA §7.1 inventory?                                   | **Amendment required** — add `VaultAccessControl` (and any sibling) as MODIFY; not in current inventory                |
| Formal IA amendment?                                 | **Yes**                                                                                                                |
| Preserve SYSTEM_JOB audit attribution?               | **Yes** if B-04 path unchanged                                                                                         |
| Metadata-only?                                       | **Must** — deny retrieve/store/revoke/update                                                                           |
| Educational AuthN surrogate                          | Nest-only Entry invocation / capability constant — **must not** key solely on forgeable `actorId` string               |
| Deferred production concerns                         | Cryptographic Entry AuthN; broad SYSTEM_JOB exception abuse                                                            |
| KO-COND-01                                           | Selection can _enable path_ toward closure **after** IA amendment + review + separate closure act — **not** auto-close |

**Educational risk that PO must explicitly accept if choosing A:** caller Authentication is **not** production-verified; a stringly SYSTEM_JOB ACL exception is **unacceptable** even educationally; exception must be Entry/capability-scoped + metadata-only + export-walled.

### 6.2 PO-VAULT-B

| Question                                             | Assessment                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actual changes                                       | New internal port/provider in Secret Vault BC; Entry DI; module export walls; metadata-only API                                                                                                                                                                            |
| New Vault AuthZ path?                                | **Yes** (dedicated AuthZ gate on port; may use repository internally)                                                                                                                                                                                                      |
| New token issuer/verifier?                           | **No** under TOKEN-SCOPE                                                                                                                                                                                                                                                   |
| Production S2S bootstrap?                            | **No** for educational delivery                                                                                                                                                                                                                                            |
| Depends on human userId/Role?                        | **No**                                                                                                                                                                                                                                                                     |
| Changes `SecretVaultService` / `VaultAccessControl`? | Service may collaborate; human ACL preferably **unchanged**; repository reuse possible                                                                                                                                                                                     |
| New port/provider/module?                            | **Yes**                                                                                                                                                                                                                                                                    |
| IA §7.0 algorithm?                                   | Exact-id matching can remain in Entry; **inventory row** that mandates public `SecretVaultService.list` as the Entry call **must be amended** if Entry stops calling human `list` and uses the port instead. Metadata semantics (list-equivalent + exact id) should remain |
| IA §7.1 inventory?                                   | **Amendment required** — new files + Vault/Connections wiring                                                                                                                                                                                                              |
| Formal IA amendment?                                 | **Yes**                                                                                                                                                                                                                                                                    |
| Preserve SYSTEM_JOB audit attribution?               | **Yes** — clear separation Vault capability ≠ B-04 string                                                                                                                                                                                                                  |
| Metadata-only?                                       | **Yes** by port contract                                                                                                                                                                                                                                                   |
| Educational AuthN surrogate                          | Port injectable **only** into Entry (non-exported); composition walls — **not** crypto AuthN                                                                                                                                                                               |
| Deferred production concerns                         | Same deferred token/bootstrap authenticity; parallel-auth-logic design risk                                                                                                                                                                                                |
| KO-COND-01                                           | Same as A — path toward closure only after follow-on governance                                                                                                                                                                                                            |

**Educational risk PO must accept if choosing B:** Nest DI / export walls are an **educational Authorization caller constraint**, not production Authentication. Must not be marketed as production S2S.

### 6.3 PO-VAULT-C

| Question                               | Assessment                                                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Actual changes                         | Entry (or supervisor) supplies authenticated human `userId` + Role into `list`; dual-identity model                   |
| New Vault AuthZ path?                  | **No** new ACL — reuses human ACL                                                                                     |
| New token issuer/verifier?             | **No**                                                                                                                |
| Production S2S bootstrap?              | **No**                                                                                                                |
| Depends on human userId/Role?          | **Yes** — authenticated operator/session required                                                                     |
| Changes service/ACL?                   | Prefer **unchanged** ACL                                                                                              |
| New port?                              | Possibly auth-context adapter only                                                                                    |
| IA §7.0 algorithm?                     | **Preserves** `list` + exact-id                                                                                       |
| IA inventory / COND-IA-03?             | **Likely amendment** — clarifies Vault-only human credentials vs “no external actor ingress”; operational model shift |
| Formal IA amendment?                   | **Likely yes**                                                                                                        |
| Preserve SYSTEM_JOB audit attribution? | **Yes** for B-04; Vault actor is **human**                                                                            |
| Metadata-only?                         | `list` is metadata; same Role may allow retrieve on **other** paths (**VERIFIED** ACL breadth)                        |
| Educational fit                        | Avoids ACL invention; **abandons autonomous** unattended Full-D as primary                                            |
| Deferred / risks                       | Impersonation if userId not authenticated; conflicts with autonomous Entry design                                     |
| KO-COND-01                             | Closable only with dual-identity design evidence + amendment + separate act                                           |

**Educational risk:** operator-supervised model may be proportionate, but reusing human VaultConnections power is **broader** than metadata-only ports; unauthenticated caller-supplied ids remain **forbidden**.

### 6.4 PO-VAULT-D

| Question                    | Assessment                                                      |
| --------------------------- | --------------------------------------------------------------- |
| Actual changes              | Freshness redesign away from §7.0 `list`+exact-id               |
| New Vault AuthZ path?       | Unknown / new evidence path                                     |
| Token issuer?               | **No** (orthogonal)                                             |
| Production S2S?             | **No**                                                          |
| Human identity?             | Depends on redesign                                             |
| IA §7.0?                    | **Contradicts** current binding — **requires** IA rewrite       |
| Inventory?                  | Large planning delta                                            |
| Educational proportionality | **Poor** — largest deviation for educational “smallest change”  |
| KO-COND-01                  | Does not clear under current IA; blocks until redesign ratified |

### 6.5 KEEP STOP / RETURN FOR FURTHER DISCOVERY

| Question         | Assessment                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Changes          | None                                                                                                                 |
| IA               | Unchanged                                                                                                            |
| KO-COND-01       | Remains **OPEN**; Stages 4–8 remain **BLOCKED**                                                                      |
| When appropriate | If PO will not accept any educational AuthN surrogate; or will not authorize IA amendment; or requires more evidence |

---

## 7. Educational-project proportionality analysis

| Criterion                                  | A                                  | B                                     | C                                 | D                          | KEEP STOP        |
| ------------------------------------------ | ---------------------------------- | ------------------------------------- | --------------------------------- | -------------------------- | ---------------- |
| Least architectural change                 | Medium-small (ACL)                 | Medium (new port)                     | Small–medium (plumbing)           | Large                      | None             |
| Avoids production S2S platform             | Yes*                               | Yes*                                  | Yes                               | Yes                        | Yes              |
| Narrowest metadata access                  | If scoped well                     | **Best surface**                      | Broader human ACL                 | Unknown                    | N/A              |
| No pretence of production token provenance | Yes if tokens unused for Vault     | Yes                                   | Yes                               | Yes                        | Yes              |
| Smallest IA deviation                      | Smaller than B if §7.0 `list` kept | Amends inventory + §7.0 call-site row | Likely COND-IA-03 / model         | **Largest** (§7.0 rewrite) | None             |
| Clearest audit / failure semantics         | Needs new allow/deny events        | Port-level deny/allow clear           | Existing Vault deny               | Redesign                   | Status quo block |
| Implicit privilege / impersonation         | High if string-keyed SYSTEM_JOB    | Lower if non-exported port            | High if unauthenticated human ids | Depends                    | None new         |
| Retains autonomous Entry                   | Yes                                | Yes                                   | **No** (primary)                  | Only with new path         | Blocked          |

\*“Yes” only if implementation does **not** introduce SPIFFE/IdP/mTLS/etc. (forbidden by TOKEN-SCOPE).

### Proportionality conclusions (**INFERRED** under TOKEN-SCOPE)

1. **Least suitable:** PO-VAULT-D — contradicts approved §7.0 for little educational gain.
2. **Autonomous vs supervised:** C is viable only if PO **explicitly** abandons autonomous Full-D as primary for education.
3. **A vs B:** Both avoid production S2S platforms; both need IA amendment; both require explicit acceptance that caller Authentication is educational (composition / capability), not production-verified.
4. **Narrowest AuthZ surface:** **B** — metadata-only port without widening human `VaultAccessControl` or granting full VaultConnections powers.
5. **Do not recommend** Nest DI as cryptographic Authentication; do not recommend SYSTEM_JOB strings as AuthN; do not recommend silent ACL bypass or unrestricted workspace access.

---

## 8. Authentication vs authorization vs audit attribution

| Layer             | Educational posture under TOKEN-SCOPE                                                                                                                                              | Must still enforce                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Authentication    | Production S2S token authenticity **DEFERRED**; educational surrogate (if A/B) = Nest composition / non-export + Entry-only capability — **ACCEPTED LIMITATION** if PO selects A/B | Fail closed on public/DTO ingress; no string spoof as AuthN |
| Authorization     | **Must** be explicit: metadata-only; workspace-bound; Connection-derived ids                                                                                                       | Deny retrieve; deny foreign workspace                       |
| Audit attribution | Canonical SYSTEM_JOB on B-04 / backfill audits                                                                                                                                     | Never reuse SYSTEM_JOB string as Vault ACL principal        |
| Resource binding  | `workspaceId` + exact `vaultSecretId` from Connection                                                                                                                              | Exact-id match after metadata fetch                         |

**ADP Option A tokens** remain the selected _educational S2S token architecture direction_. They are **not** required as the Vault Authorization mechanism for KO-COND-01 under this package, and must **not** be treated as production-verified caller proof.

---

## 9. Exact Vault access requirements (IA §7.0)

Entry must obtain, immediately before each write attempt:

1. Fresh Vault **metadata** for the Connection’s workspace.
2. Exact record where `meta.id === connection.vaultSecretId`.
3. No secret ciphertext / retrieve.
4. Fail closed if metadata unavailable or id missing.
5. B-04 attribution remains canonical SYSTEM_JOB (separate from Vault AuthZ).

---

## 10. Full-D IA inventory impact (every option)

Ratified IA hash must remain `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` until a **separate** amendment act. This package does **not** modify the IA.

| Option        | Operate inside current §7 inventory as-is? | Exact amendment targets if selected                                                                                                                                                                                   |
| ------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**         | **No**                                     | §7.1: add `VaultAccessControl` (+/− sibling) **MODIFY**; document metadata-list-only exception; Entry MODIFY already present for orchestration                                                                        |
| **B**         | **No**                                     | §7.0 dependency row: replace or dual-path “Entry calls human `list`” with authorized port API; §7.1: **CREATE** port/provider files; Vault/Connections module wiring **MODIFY**; preserve exact-id algorithm in Entry |
| **C**         | **Unlikely**                               | Clarify COND-IA-03 / dual-identity Vault human context; Entry MODIFY for supervised credentials; forbid public DTO actor ingress                                                                                      |
| **D**         | **No**                                     | Rewrite §7.0 / D-06 freshness binding; new evidence design package                                                                                                                                                    |
| **KEEP STOP** | Yes (no change)                            | None                                                                                                                                                                                                                  |

---

## 11. `KO-COND-01` impact (every option)

| Option    | Immediate effect of PO selection alone | Path to close KO-COND-01                                                                                                |
| --------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| A         | **Remains OPEN**                       | Ratify A → IA amendment + independent review → implementable design note evidence → **separate** KO-COND-01 closure act |
| B         | **Remains OPEN**                       | Same sequence for B                                                                                                     |
| C         | **Remains OPEN**                       | Same + dual-identity / COND-IA-03 clarity                                                                               |
| D         | **Remains OPEN**                       | Only after freshness redesign IA + review                                                                               |
| KEEP STOP | **Remains OPEN**                       | No closure path until a later positive selection                                                                        |

**No option in this package closes KO-COND-01 by selection alone.**

---

## 12. Risks and accepted limitations (summary)

| Option    | Educational risks / limitations                          | Future production still deferred     |
| --------- | -------------------------------------------------------- | ------------------------------------ |
| A         | Spoof if string-keyed; ACL pollution; DI ≠ crypto AuthN  | Workload AuthN, enrollment, rotation |
| B         | DI/export walls ≠ crypto AuthN; parallel auth logic      | Same                                 |
| C         | Impersonation; broader human Vault power; not autonomous | Same + supervised ops model          |
| D         | Breaks §7.0; unknown alternate safety                    | Depends on redesign                  |
| KEEP STOP | Full-D Stages 4–8 stay blocked                           | N/A                                  |

---

## 13. Comparison table (concise)

| Dimension                  | A               | B                              | C                       | D                   | KEEP STOP    |
| -------------------------- | --------------- | ------------------------------ | ----------------------- | ------------------- | ------------ |
| New Vault AuthZ path       | Yes             | Yes                            | No (human ACL)          | Redesign            | No           |
| Token issuer required      | No              | No                             | No                      | No                  | No           |
| Prod S2S infra             | No*             | No*                            | No                      | No                  | No           |
| Human Role dependency      | No              | No                             | Yes                     | Depends             | —            |
| ACL / service change       | ACL likely      | Port; ACL preferably untouched | Prefer none             | Unknown             | None         |
| New port                   | Optional        | **Yes**                        | Maybe adapter           | Maybe               | No           |
| IA amendment               | **Required**    | **Required**                   | Likely                  | **Required** (§7.0) | No           |
| SYSTEM_JOB audit preserved | Yes             | Yes                            | Yes (Vault≠B-04)        | Depends             | Yes          |
| Metadata-only enforceable  | Design-required | **Inherent**                   | Partial (Role breadth)  | Design-required     | —            |
| Autonomous Entry           | Yes             | Yes                            | No                      | Conditional         | Blocked      |
| KO-COND-01 after select    | OPEN            | OPEN                           | OPEN                    | OPEN                | OPEN         |
| Educational suitability    | Medium          | **High**                       | Medium if supervised OK | Low                 | Safe default |

\*If TOKEN-SCOPE constraints honored.

---

## 14. Recommendation (**not** a Product Owner decision)

### Recommended option for Product Owner consideration: **PO-VAULT-B**

**Recommendation only. Not ratified. Not authorized. Does not close KO-COND-01. Does not authorize Vault access.**

### Evidence-based rationale

1. **Respects `D-CONN04-TOKEN-SCOPE`:** needs no SPIFFE/IdP/mTLS/cloud WI/KMS enrollment and does not pretend token provenance is production-verified.
2. **Preserves autonomous educational Full-D Entry** (unlike C).
3. **Preserves exact-id metadata freshness intent** (unlike D); algorithm remains list-equivalent metadata + `meta.id === vaultSecretId` in Entry after IA call-site amendment.
4. **Narrowest AuthZ surface:** metadata-only port; avoids widening human `VaultAccessControl` and avoids full VaultConnections powers (C).
5. **Clearer identity separation** than A: Vault capability object ≠ forgeable SYSTEM_JOB `actorId` string.
6. Aligns with prior independent preference in the original Vault Decision Package §9, **re-justified** under educational proportionality rather than production S2S readiness.
7. Requires explicit PO acceptance of educational limitation: Nest composition / non-export walls are **caller constraints**, not cryptographic Authentication (**ACCEPTED LIMITATION**).

### Why other options are less suitable (educational scope)

| Option        | Why less suitable now                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A**         | Higher spoof/ACL-pollution residual if mis-keyed on SYSTEM_JOB strings; still needs IA amendment; weaker least-privilege boundary than a dedicated metadata port   |
| **C**         | Abandons autonomous Entry as primary; human VaultConnections may exceed metadata-only need; impersonation risk unless authenticated operator principal is ironclad |
| **D**         | Contradicts approved IA §7.0 / D-06; disproportionate redesign for educational delivery                                                                            |
| **KEEP STOP** | Appropriate if PO refuses educational AuthN surrogate **or** refuses IA amendment; otherwise blocks educational Full-D progress without resolving Vault AuthZ      |

### If PO cannot accept the educational AuthN surrogate

Recommend **KEEP STOP** (or RETURN FOR FURTHER DISCOVERY) until either:

- an authenticated operator model (C) is chosen, or
- a future project supplies production workload Authentication, or
- PO explicitly documents an alternative AuthN surrogate with dual-control enrollment (out of TOKEN-SCOPE; would be a **new** proposal — not invented here as a silent A–D replacement).

---

## 15. Exact Product Owner decision required

Select **exactly one**:

```text
[ ] PO-VAULT-A — APPROVE (capability-scoped metadata-list exception)
[ ] PO-VAULT-B — APPROVE (dedicated internal Vault metadata port)   ← recommendation
[ ] PO-VAULT-C — APPROVE (operator-supervised human Vault context)
[ ] PO-VAULT-D — APPROVE (reject list path; redesign freshness)
[ ] RETURN FOR FURTHER DISCOVERY (specify missing evidence: ________)
[ ] REJECT ALL OPTIONS / KEEP STOP
```

If selecting **A** or **B**, also record:

```text
[ ] I accept that educational caller Authentication is Nest composition /
    capability binding — NOT production-verified workload identity
    (D-CONN04-TOKEN-SCOPE deferred concerns remain deferred / unsolved).
[ ] I forbid SYSTEM_JOB actorId strings alone as Vault AuthN.
[ ] I require metadata-only; deny retrieve/store/revoke/update on this path.
[ ] I require workspace + exact vaultSecretId binding from Connection.
[ ] I understand selection does NOT close KO-COND-01 and does NOT authorize coding
    until IA amendment + independent review + separate closure/authorization acts.
```

If selecting **C**, also record abandonment of autonomous unattended Vault list as primary and authenticated-operator requirements.

**Decision owner:** Product Owner  
**This package does not make the selection.**

---

## 16. Required downstream governance steps after selection

Order (**PROPOSED** process; not started):

1. Record PO selection (ratification artifact + Decision Register additive entry).
2. Draft **Full-D IA inventory amendment** for the selected option (§10 targets) — **do not** silently edit the current ratified hash package without a formal amendment act.
3. Independent review of amended IA.
4. Update Stage 1 design note to the selected AuthZ path (evidence for Kickoff condition).
5. **Separate** `KO-COND-01` closure act only when design evidence satisfies Kickoff Completion §6.
6. Only then may Stages 4–8 coding proceed under amended IA — still **not** FIV-CONN-04-E, backfill execution, or production activation unless separately authorized.

Until step 5: `KO-COND-01` remains **OPEN**; Full-D implementation execution remains **NOT STARTED** for Stages 4–8.

---

## 17. Explicit non-goals and implementation restrictions

This package does **not**:

- Select or ratify an option on the PO’s behalf.
- Amend Decision Register, Full-D IA, Kickoff Completion, or historical reviews.
- Implement tokens, Vault machine principals, ACL changes, or Nest providers.
- Close `KO-COND-01`.
- Authorize Stages 4–8, backfill, FIV-CONN-04-E, production activation, or live capital.
- Claim deferred TOKEN-SCOPE security concerns are solved.
- Redesign ADP Option A token architecture.

```text
NO SOURCE / TEST / SCHEMA / DEPENDENCY / CONFIGURATION CHANGES AUTHORIZED BY THIS PACKAGE
NO STAGING / COMMIT / PUSH
WAIT FOR PRODUCT OWNER SELECTION
```

---

## 18. Evidence and references

| Artifact                        | Path                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| Original Vault Decision Package | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-po-vault-authorization-decision-package.md` |
| Trust-boundary review           | `.../v3-l02-fiv-conn-04-d-po-vault-trust-boundary-review.md`                                    |
| Stage 1 design                  | `.../v3-l02-fiv-conn-04-d-stage-1-vault-entry-design.md`                                        |
| Full-D IA                       | `.../v3-l02-fiv-conn-04-d-implementation-authorization.md`                                      |
| Kickoff Completion              | `.../v3-l02-fiv-conn-04-d-kickoff-completion.md`                                                |
| Kickoff Review                  | `.../v3-l02-fiv-conn-04-d-implementation-kickoff-review.md`                                     |
| Token-scope amendment           | `.../v3-l02-fiv-conn-04-d-token-scope-decision-amendment.md`                                    |
| Platform S2S ADP                | `.../v3-l02-platform-s2s-authority-nestjs-architecture-decision-package.md`                     |
| ADP independent review          | `.../v3-l02-platform-s2s-authority-nestjs-architecture-review.md`                               |
| S2S discovery                   | `.../v3-l02-fiv-conn-04-d-s2s-authentication-architecture-discovery.md`                         |
| Workload bootstrap discovery    | `.../v3-l02-platform-workload-identity-bootstrap-discovery.md`                                  |
| Decision Register               | `.../wave-6-po-decision-register.md`                                                            |
| Vault ACL / list                | `apps/api/src/modules/secret-vault/vault-access-control.ts`, `secret-vault.service.ts`          |
| SYSTEM_JOB identity             | `apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.ts`                         |
| PrivilegedActorContext          | `apps/api/src/modules/connections/migration-gate.ts`                                            |

---

_End of educational-scope Vault authorization decision package. Pending Product Owner selection._
