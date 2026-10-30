# FIV-CONN-04-D — Product Owner Decision Package: Vault Authorization Strategy

**Document:** Decision-ready Product Owner package for resolving **KO-COND-01**  
**Date of preparation:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D

```text
DECISION PACKAGE — PENDING PRODUCT OWNER DECISION

KO-COND-01: OPEN — PENDING PRODUCT OWNER DECISION
FULL-D IMPLEMENTATION AUTHORIZATION: GRANTED WITH AMENDMENTS (unchanged by this package)
IMPLEMENTATION KICKOFF: COMPLETED — PASS WITH CONDITIONS
FULL-D IMPLEMENTATION EXECUTION: NOT STARTED
STAGES 4–8: BLOCKED
FIV-CONN-04-E: NOT AUTHORIZED
FULL-D BACKFILL EXECUTION: NOT STARTED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**Nature:** **DOCUMENTATION / DECISION PREPARATION ONLY.** Does **not** implement any option. Does **not** amend IA, ratification, Kickoff Completion, or Decision Register. Does **not** modify application source, tests, schema, migrations, Vault ACL, membership, Entry, or SYSTEM_JOB identity. Does **not** stage, commit, or push.

**Evidence labels:** **VERIFIED** | **INFERRED** | **UNKNOWN**

---

## 1. Purpose

Resolve the open Kickoff condition **KO-COND-01**: how (if at all) the trusted Option A Entry may obtain **fresh Vault metadata by exact `vaultSecretId`** for Full-D write attempts under current Vault authorization rules.

This package evaluates four Product Owner choices (**PO-VAULT-A…D**), compares them, and provides a decision template. It does **not** itself approve any path.

---

## 2. Governing sources reviewed

| #   | Artifact                                                                                                                                                                                                       | Role                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | [`v3-l02-fiv-conn-04-d-stage-1-vault-entry-design.md`](./v3-l02-fiv-conn-04-d-stage-1-vault-entry-design.md)                                                                                                   | Stage 1 discovery; KO-COND-01 = OPEN — PO decision required   |
| 2   | [`v3-l02-fiv-conn-04-d-implementation-authorization.md`](./v3-l02-fiv-conn-04-d-implementation-authorization.md)                                                                                               | Sole Full-D scope authority (hash below)                      |
| 3   | [`v3-l02-fiv-conn-04-d-full-implementation-authorization-ratification.md`](./v3-l02-fiv-conn-04-d-full-implementation-authorization-ratification.md)                                                           | **D-CONN04-FULL-D-IA** GRANTED WITH AMENDMENTS                |
| 4   | [`v3-l02-fiv-conn-04-d-implementation-kickoff.md`](./v3-l02-fiv-conn-04-d-implementation-kickoff.md)                                                                                                           | Prepared Kickoff package                                      |
| 5   | [`v3-l02-fiv-conn-04-d-implementation-kickoff-review.md`](./v3-l02-fiv-conn-04-d-implementation-kickoff-review.md)                                                                                             | PASS WITH CONDITIONS; U-02 CLOSED WITH CONDITION              |
| 6   | [`v3-l02-fiv-conn-04-d-kickoff-completion.md`](./v3-l02-fiv-conn-04-d-kickoff-completion.md)                                                                                                                   | **D-CONN04-FULL-D-KO**; KO-COND-01 OPEN; KO-COND-02 SATISFIED |
| 7   | [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md)                                                                                                                                           | CURRENT STATE: KO-COND-01 OPEN                                |
| 8   | Source: Entry, identity, `migration-gate.ts`, `secret-vault.service.ts`, `vault-access-control.ts`, `workspace-access.service.ts`, `connections.module.ts`, `secret-vault.module.ts`, A preflight, auth matrix | Technical baseline                                            |

**IA package SHA-256 (recalculated this preparation):** `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` — matches ratification (**VERIFIED**).

**Repository baseline:** branch `main`; HEAD `953292675e197d4f25778aaaa59eacb2826560fe`; index empty.

---

## 3. Verified technical baseline

Subject to re-verification this act (no silent baseline updates):

| Statement                                                                                                            | Status                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| KO-COND-01 OPEN; Stages 4–8 blocked; Full-D execution NOT STARTED                                                    | **VERIFIED** (register + Kickoff Completion)                                                                   |
| Full-D IA GRANTED WITH AMENDMENTS; Kickoff COMPLETED — PASS WITH CONDITIONS                                          | **VERIFIED**                                                                                                   |
| `Conn04SystemJobMigrationEntry` sole trusted SYSTEM_JOB ↔ B-04 boundary (Option A)                                   | **VERIFIED** (governance + Entry code)                                                                         |
| Canonical B-04 actor: `SYSTEM_JOB` / `system-job:fiv-conn-04-migration-backfill` via `buildFivConn04DSystemJobActor` | **VERIFIED**                                                                                                   |
| B-04 actor is not a Vault user identity                                                                              | **VERIFIED** (`PrivilegedActorContext` shape; Vault ACL uses userId+Role)                                      |
| `SecretVaultService.list` always runs `VaultAccessControl.assertCanAccess`                                           | **VERIFIED**                                                                                                   |
| Membership = active workspace ∧ `ownerUserId === userId`                                                             | **VERIFIED** (`WorkspaceAccessService.isMember`)                                                               |
| `VaultConnections` allowed for `Role.Trader` and `Role.Admin` only                                                   | **VERIFIED** (permission matrix)                                                                               |
| Omitting `actorRole` → deny (`unknown_role`)                                                                         | **VERIFIED** (`decideAuthorization`)                                                                           |
| `PrivilegedActorContext` has no workspaceId / userId / role                                                          | **VERIFIED**                                                                                                   |
| No trusted service-to-service Vault authorization path established                                                   | **VERIFIED** (Stage 1 + re-scan: production `list` used by A preflight with caller-supplied credentials)       |
| Nest DI of `SecretVaultService` into Entry is feasible; does not authorize                                           | **VERIFIED**                                                                                                   |
| Using `ownerUserId` as Vault actor without explicit policy = unapproved impersonation/run-as                         | **INFERRED** from absence of run-as API + VaultAccessControl comment that caller claims alone are insufficient |
| IA §7.0 binds exact-id freshness to `list` + `meta.id === vaultSecretId`; forbids slot `get` for this purpose        | **VERIFIED**                                                                                                   |
| No separate exact-id Vault getter exists                                                                             | **VERIFIED** (IA §7.0 FACT; `get`/`findSlot` are type/purpose slot APIs)                                       |

**Discrepancies vs task §3 baseline:** **None** found.

---

## 4. Problem statement (for PO)

Full-D requires, before each write attempt (**IMPL-REV-D-06** / IA §7.0):

1. Fresh Vault **metadata** for the Connection’s exact `vaultSecretId`
2. Without decrypting secrets
3. From the Option A Entry under autonomous privileged Nest execution
4. While B-04 attribution remains the canonical SYSTEM_JOB

Current Vault `list` authorization only succeeds for a **workspace owner userId** plus **Trader/Admin** Role. The SYSTEM_JOB principal cannot satisfy that check. Injecting the Vault service does not close the gap.

**In-scope coding under the current ratified IA §7 inventory cannot safely complete Stages 4–8** until PO selects a Vault authorization strategy (and any required IA/inventory amendments are ratified).

---

## 5. Option evaluations

### 5.1 PO-VAULT-A — Capability-scoped SYSTEM_JOB authorization exception

**Policy direction:** Allow a **narrow** Vault **metadata list** authorization for invocations proven to originate from the trusted FIV-CONN-04-D Entry (or an equivalently bounded capability), without granting human-user membership.

| Topic                      | Assessment                                                                                                                                       | Label                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Mechanism                  | Likely change `VaultAccessControl` and/or add a sibling gate used only by a metadata-list path                                                   | **INFERRED**                                                                            |
| Entry authentication       | Must prove Nest-internal Entry invocation — **not** mere caller-supplied `actorKind`/`actorId` strings (spoofable if any code path accepts them) | **INFERRED** (spoof risk **VERIFIED** conceptually; no current Entry Vault path exists) |
| Scope restriction          | Must allow metadata list only; **deny** retrieve/store/revoke/update and unrelated Vault ops                                                     | **INFERRED** design requirement                                                         |
| Workspace isolation        | Still must bind listing to Connection/`workspaceId` under review; cross-tenant list must remain impossible                                       | **INFERRED**                                                                            |
| Specific vs reusable       | Prefer CONN-04-D-specific capability token/port over a general “any SYSTEM_JOB” exception                                                        | **INFERRED**                                                                            |
| Revocation / audit / tests | Feature flag or capability constant; Security Audit of allow/deny; negative tests for retrieve + foreign workspace                               | **INFERRED**                                                                            |

**Does NOT by itself approve:** secret retrieve; general SYSTEM_JOB Vault power; public ingress; Stages 4–8 without follow-on inventory IA amendment.

**Autonomous model:** **Retained** if designed correctly (**INFERRED**).

**Governance:** Requires **IA inventory amendment** (Vault ACL / sibling not in §7 as MODIFY today) + renewed review before coding ACL changes (**VERIFIED** relative to current §7).

---

### 5.2 PO-VAULT-B — Dedicated internal Vault metadata port

**Policy direction:** Introduce a **dedicated internal** Nest capability (port/provider) that returns workspace Vault **metadata** (or exact-id metadata) for CONN-04-D Entry use, without using the human-user `list(actorWorkspaceId, workspaceId, actorRole?)` contract.

| Topic                   | Assessment                                                                                                                         | Label                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Ownership               | Likely Secret Vault bounded context owns provider; Connections Entry consumes via DI; **not** Nest-exported broadly                | **INFERRED**                                                            |
| Trusted Entry access    | Port injected only into Entry (or Connections-internal helper); module export walls must prevent arbitrary importers               | **INFERRED**                                                            |
| Workspace scope         | Port methods take `workspaceId` (+ optional exact id); must verify Connection belongs to that workspace inside Entry orchestration | **INFERRED**                                                            |
| Secret exposure         | Port returns metadata only (id/purpose/state/workspace); **no** retrieve                                                           | **INFERRED** requirement                                                |
| Reuse of `list`         | May call repository `listByWorkspaceId` **internally** after a different auth gate — or a narrower query by id if added            | **UNKNOWN** exact internal shape; repository list exists (**VERIFIED**) |
| Parallel infrastructure | Cleaner long-term S2S boundary vs cluttering `assertCanAccess`; risk of duplicate auth logic if poorly designed                    | **INFERRED**                                                            |

**Does NOT by itself approve:** public HTTP; retrieve; general Vault bypass; inventory expansion without IA amendment.

**Autonomous model:** **Retained** (**INFERRED**).

**Governance:** Requires **new IA inventory grant** (new port/provider files + Vault module wiring) + renewed review (**VERIFIED** as out of current §7).

---

### 5.3 PO-VAULT-C — Operator-supervised Vault context

**Policy direction:** Nest-internal invocation supplies a **valid human Vault context** (owner `userId` + permitted Role) for `SecretVaultService.list`, while Entry still builds SYSTEM_JOB for B-04.

| Topic                            | Assessment                                                                                                                                                                              | Label                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Operator identity source         | Must be authenticated (session/JWT/Nest trusted principal) — **not** raw strings                                                                                                        | **INFERRED** requirement                                      |
| Caller-provided vs authenticated | Passing `actorUserId`/`actorRole` through Nest alone is **not** trust (**VERIFIED** pattern risk via A preflight)                                                                       | **VERIFIED** / **INFERRED**                                   |
| Independent verify               | Must re-check `isMember(workspaceId, userId)` + Role allows VaultConnections at call time                                                                                               | **VERIFIED** (existing ACL does this if credentials are real) |
| COND-IA-03 / IA conflict         | Dual-identity Entry parameters may collide with “no external actor ingress” if surface is DTO/HTTP; Nest-internal may still need IA amendment clarifying allowed Vault-only credentials | **INFERRED**                                                  |
| Operational model                | Shifts Full-D from **autonomous SYSTEM_JOB** toward **operator-supervised** execution                                                                                                   | **INFERRED**                                                  |
| Impersonation                    | If operator is not the workspace owner, or Role is fabricated — fail closed or escalate; “use ownerUserId with Admin” without operator session = impersonation (**INFERRED**)           |                                                               |
| Separate IA amendment            | **Likely yes** — operational model + COND-IA-03 interpretation                                                                                                                          | **INFERRED**                                                  |

**Does NOT approve:** public DTO actor ingress; autonomous unattended Vault list; inventing Role claims.

**Autonomous model:** **Not retained** as primary (**INFERRED**).

---

### 5.4 PO-VAULT-D — Reject autonomous `list`; redesign freshness evidence

**Policy direction:** Do **not** authorize SYSTEM_JOB/`list` under current ACL; find another freshness evidence path.

| Topic                       | Assessment                                                                                            | Label                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| IA §7.0 / D-06 requirement  | Exact-id fresh metadata via `list` + id equality before each write; `get` explicitly **not** exact-id | **VERIFIED**                                |
| Equivalent existing API     | **No** exact-id metadata getter found; slot `get` requires type/purpose and still uses same ACL       | **VERIFIED**                                |
| Persisted Connection fields | Connection stores `vaultSecretId` but not Vault purpose/state freshness SoT                           | **VERIFIED** (classifier needs Vault meta)  |
| Without retrieve            | Any alternative must remain metadata-only                                                             | **VERIFIED** requirement                    |
| Weakens safety model?       | Substituting stale A preflight or Connection-only fields would violate IMPL-REV-D-06                  | **INFERRED** / **VERIFIED** against IA text |
| IA amendment                | **Required** — contradicts current §7.0 binding unless a new evidenced API is invented and ratified   | **VERIFIED**                                |

**Does NOT invent** a new freshness mechanism in this package. **UNKNOWN:** whether a future exact-id metadata API could be designed; none exists now.

**Autonomous model:** Retained only if a new non-`list` evidence path is later authorized; **today: STOP for Full-D freshness as written**.

---

## 6. Comparison matrix

| Dimension            | PO-VAULT-A                                                     | PO-VAULT-B                                         | PO-VAULT-C                                                               | PO-VAULT-D                                  |
| -------------------- | -------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| Trust model          | Capability-gated SYSTEM_JOB/Entry proof (**INFERRED** design)  | Dedicated internal port + DI walls (**INFERRED**)  | Authenticated operator session + ACL (**VERIFIED** ACL if real user)     | N/A — rejects current list path             |
| Least privilege      | Metadata list only if correctly scoped (**INFERRED**)          | Narrowest API surface possible (**INFERRED**)      | Full user VaultConnections power of that user (**VERIFIED** ACL breadth) | Unknown alternate                           |
| Workspace isolation  | Must bind workspaceId (**INFERRED**)                           | Must bind workspaceId (**INFERRED**)               | Owner membership (**VERIFIED**)                                          | Depends on alternate                        |
| Secret exposure      | Must exclude retrieve (**INFERRED**)                           | Must exclude retrieve (**INFERRED**)               | User may also call retrieve on other paths (**VERIFIED**)                | Must stay metadata-only                     |
| Identity separation  | Vault capability ≠ B-04 SYSTEM_JOB string reuse (**INFERRED**) | Clear Vault vs B-04 separation (**INFERRED**)      | Dual identity: human Vault + SYSTEM_JOB B-04 (**INFERRED**)              | N/A                                         |
| Auditability         | Need allow/deny audit for exception (**INFERRED**)             | Port-level audit possible (**INFERRED**)           | Existing Vault deny audit (**VERIFIED**)                                 | Depends                                     |
| Revocation           | Flag / remove exception (**INFERRED**)                         | Unregister provider / flag (**INFERRED**)          | Disable operator role/session (**VERIFIED** human IAM)                   | Stop D                                      |
| Implementation scope | VaultAccessControl (+/− sibling) + Entry                       | New port + Vault module + Entry                    | Entry API + auth context plumbing                                        | IA redesign; possibly new Vault API         |
| Inventory impact     | **Exceeds** §7 (**VERIFIED**)                                  | **Exceeds** §7 (**VERIFIED**)                      | May exceed §7; COND-IA-03 amendment likely (**INFERRED**)                | **Exceeds** / amends IA §7.0 (**VERIFIED**) |
| Testing              | Negatives: retrieve denied; spoof denied; foreign WS           | Negatives: export walls; no retrieve; WS isolation | Negatives: non-owner; missing role; public DTO                           | Freshness equivalence proofs                |
| Operational model    | Autonomous                                                     | Autonomous                                         | Operator-supervised                                                      | Autonomous only with new evidence design    |
| Reversibility        | Remove exception                                               | Remove port                                        | Remove operator path                                                     | Revert IA amendment                         |
| Future reuse         | Risk if too broad                                              | Good if named CONN-04-D-specific                   | Reuses human ACL                                                         | Depends                                     |
| Governance impact    | IA amendment + review                                          | IA amendment + review                              | IA amendment + COND-IA-03 clarity                                        | IA amendment + planning delta               |

---

## 7. Inventory and change-impact analysis

### Confirmed (relative to current ratified IA §7)

| Item                                                    | A                     | B                     | C                     | D                                       |
| ------------------------------------------------------- | --------------------- | --------------------- | --------------------- | --------------------------------------- |
| Exceeds current §7 inventory without amendment          | **Yes**               | **Yes**               | **Likely**            | **Yes** (baseline change)               |
| Schema / Prisma migration required for Vault auth alone | **No** (**INFERRED**) | **No** (**INFERRED**) | **No** (**INFERRED**) | **UNKNOWN** if new persistence invented |
| Entry MODIFY still required for Full-D orchestration    | **Yes**               | **Yes**               | **Yes**               | **Yes** if D continues                  |

### Provisional estimates (not authorized edits)

| Component                   | A                                                        | B                                              | C                                                | D                                 |
| --------------------------- | -------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------ | --------------------------------- |
| `VaultAccessControl`        | Likely MODIFY                                            | Possibly untouched if port uses repository     | Unchanged                                        | Unchanged or new path             |
| `SecretVaultService`        | Possibly narrow internal method                          | Likely collaborator / partial REUSE            | REUSE `list` as today                            | May need new API                  |
| `WorkspaceAccessService`    | Unchanged preferred                                      | Unchanged preferred                            | Used as today                                    | Unchanged                         |
| `ConnectionsModule`         | MODIFY providers                                         | MODIFY providers + imports                     | MODIFY                                           | MODIFY if new deps                |
| New files                   | Sibling auth helper?                                     | **New** port + provider                        | Possibly auth adapter                            | Unknown                           |
| SYSTEM_JOB identity factory | Unchanged                                                | Unchanged                                      | Unchanged                                        | Unchanged                         |
| Required tests              | ACL exception positives/negatives; no retrieve; no spoof | Port unit + export negatives + Entry freshness | Operator context verification + COND-IA-03 walls | Equivalence to D-06 or IA rewrite |

**This package does not modify the IA inventory.**

---

## 8. Security threat model

| Threat                         | A                                                                                                       | B                                                                | C                                                        | D                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- | ------------------- |
| Spoof SYSTEM_JOB string        | **High** if ACL keys only on actorId; control: Nest-only capability / non-exported token (**INFERRED**) | Lower if port not callable with strings alone; DI + module walls | Lower for Vault (human session); B-04 still factory-only | N/A for list        |
| Unauthorized Nest provider use | Residual if ConnectionsModule exports widen                                                             | Residual if port exported                                        | Residual if Entry exported with Vault params             | N/A                 |
| Cross-tenant list              | Must enforce workspaceId binding                                                                        | Same                                                             | Owner membership (**VERIFIED**)                          | Depends             |
| Owner impersonation            | Not using ownerId                                                                                       | Not using ownerId                                                | Core risk if userId not authenticated                    | N/A                 |
| Fabricated Role                | N/A if not role-based                                                                                   | N/A                                                              | Must use real Role from auth                             | N/A                 |
| Secret value access            | Must not expose retrieve on exception path                                                              | Port metadata-only                                               | User Role may allow retrieve elsewhere (**VERIFIED**)    | Must avoid retrieve |
| Alternate method bypass        | Exception must not open get/retrieve                                                                    | Port must not wrap retrieve                                      | Existing user powers                                     | New API design risk |
| Stale/revoked auth             | Capability flag; job disable                                                                            | Provider disable                                                 | Session/role revoke                                      | Stop                |
| Audit gaps                     | Need new allow events                                                                                   | Need port audit                                                  | Existing deny path                                       | Depends             |
| Reuse outside CONN-04-D        | Broad SYSTEM_JOB exception = high                                                                       | Name/scopes to CONN-04-D                                         | Human ACL reuse intentional                              | Depends             |

**Evidence to demonstrate controls (all options that proceed):** negative authorization tests; export-wall tests; no-retrieve proofs; workspace isolation tests; B-04 attribution still canonical SYSTEM_JOB.

---

## 9. Independent reviewer recommendation

**Preferred option for Product Owner consideration: PO-VAULT-B** (dedicated internal Vault metadata port), **subject to IA inventory amendment and renewed review**.

### Why preferable (against verified constraints)

- Preserves **autonomous** Option A SYSTEM_JOB execution (unlike C).
- Avoids contradicting IA §7.0 `list`+exact-id binding (unlike D as currently evidenced).
- Avoids overloading general `VaultAccessControl` user membership semantics with stringly SYSTEM_JOB exceptions (A’s primary residual spoof / least-privilege risk).
- Makes **identity separation** explicit: B-04 SYSTEM_JOB vs Vault metadata capability.
- Can be scoped to metadata-only and CONN-04-D Entry DI.

### Costs / disadvantages

- Larger inventory delta than a surgical ACL exception (A).
- Risk of parallel auth logic if poorly designed.
- Still requires formal IA amendment — **not** implementable under current §7 alone.

### Required before implementation

1. Separate PO ratification of PO-VAULT-B (or chosen option).
2. IA / inventory amendment listing exact new files and Vault module changes.
3. Independent review of the amended IA.
4. Security tests listed in §7–8.
5. KO-COND-01 closed only by a **separate** governance act after ratification.

### What would invalidate this recommendation

- Evidence of an existing exact-id metadata API that is already authorized for SYSTEM_JOB (**none found**).
- PO decision that Full-D must remain operator-supervised (favor C).
- PO decision to redesign D-06 away from Vault metadata freshness (favor D with full IA rewrite).
- Discovery that a capability-scoped A exception can be authenticated as strongly as a dedicated port with less inventory (then A may win on cost).

**This recommendation is not a Product Owner decision.**

---

## 10. Explicit Product Owner decision choices

Select **exactly one**:

### PO-VAULT-A — APPROVE

| Field                         | Content                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Approves                      | Capability-scoped metadata-list authorization for verified CONN-04-D Entry invocation                                                 |
| Does **not** approve          | Secret retrieve; general SYSTEM_JOB Vault power; public ingress; coding before IA inventory amendment + review; production activation |
| IA amendment / renewed review | **Required**                                                                                                                          |
| Autonomous Full-D model       | **Retained** (design must prove Entry authentication ≠ string spoof)                                                                  |
| Additional evidence           | Authn of Entry; least-privilege deny matrix; export walls; KO-COND-01 closure act                                                     |

### PO-VAULT-B — APPROVE

| Field                         | Content                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| Approves                      | Dedicated internal Vault metadata port for CONN-04-D Entry                                            |
| Does **not** approve          | Broad Nest export of port; retrieve; coding before IA inventory amendment + review                    |
| IA amendment / renewed review | **Required**                                                                                          |
| Autonomous Full-D model       | **Retained**                                                                                          |
| Additional evidence           | Port boundary; DI-only Entry access; metadata-only; workspace isolation tests; KO-COND-01 closure act |

### PO-VAULT-C — APPROVE

| Field                         | Content                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Approves                      | Operator-supervised Vault user context for `list`, SYSTEM_JOB retained for B-04                                    |
| Does **not** approve          | Unauthenticated caller-supplied userId/role; public DTO actor ingress; claiming autonomous unattended Vault access |
| IA amendment / renewed review | **Required** (COND-IA-03 / operational model)                                                                      |
| Autonomous Full-D model       | **Not retained** as primary                                                                                        |
| Additional evidence           | Authenticated operator principal; membership/role verification; dual-identity audit story                          |

### PO-VAULT-D — APPROVE

| Field                         | Content                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| Approves                      | Reject autonomous `SecretVaultService.list` under current ACL; require freshness redesign |
| Does **not** approve          | Inventing an unevidenced alternate API in implementation without new IA                   |
| IA amendment / renewed review | **Required** (contradicts §7.0 / D-06 as written)                                         |
| Autonomous Full-D model       | Only if a new evidenced path is later ratified                                            |
| Additional evidence           | Replacement freshness mechanism design package before any Stage 4                         |

### RETURN FOR FURTHER DISCOVERY

| Field                | Content                                            |
| -------------------- | -------------------------------------------------- |
| Approves             | More investigation only (specify missing evidence) |
| Does **not** approve | Any of A–D; any coding of Vault auth changes       |
| IA amendment         | Not yet                                            |
| Autonomous model     | Unchanged / still blocked at KO-COND-01            |

### REJECT ALL OPTIONS / KEEP STOP

| Field                | Content                                            |
| -------------------- | -------------------------------------------------- |
| Approves             | Maintain STOP on Stages 4–8 / Vault freshness path |
| Does **not** approve | A–D implementation paths                           |
| IA amendment         | None implied                                       |
| Autonomous model     | Full-D write path remains blocked                  |

---

## 11. PO decision record template

_(Do not pre-fill Decision ID, date, or approval. Complete only upon actual Product Owner ratification in a separate act.)_

```text
DECISION ID:           ______________________________  (assign only when ratified)
SELECTED OPTION:       [ ] PO-VAULT-A  [ ] PO-VAULT-B  [ ] PO-VAULT-C
                       [ ] PO-VAULT-D  [ ] RETURN FOR FURTHER DISCOVERY
                       [ ] REJECT ALL OPTIONS / KEEP STOP
DECISION DATE:         ______________________________
AUTHORITY:             Product Owner
RATIONALE:             ______________________________
CONDITIONS:            ______________________________
REQUIRED IA / INVENTORY AMENDMENTS: ________________
IMPLEMENTATION AUTHORIZATION STATUS:
  D-CONN04-FULL-D-IA remains GRANTED WITH AMENDMENTS;
  this decision does / does not (circle) authorize coding of the selected Vault strategy
  only after listed IA amendments and renewed review.
KICKOFF CONDITION STATUS:
  KO-COND-01: remains OPEN until separate closure act after ratification + any required amendments
  KO-COND-02: SATISFIED (unchanged)
FULL-D EXECUTION:      NOT STARTED
STAGES 4–8:            remain BLOCKED until KO-COND-01 closed under ratified design
```

---

## 12. Explicit non-authorization (this package)

```text
THIS DOCUMENT IS NOT A PRODUCT OWNER DECISION.
THIS DOCUMENT DOES NOT CLOSE KO-COND-01.
THIS DOCUMENT DOES NOT AUTHORIZE IMPLEMENTATION.

KO-COND-01: OPEN — PENDING PRODUCT OWNER DECISION
FULL-D IMPLEMENTATION: NOT STARTED
STAGES 4–8: BLOCKED
FIV-CONN-04-E: NOT AUTHORIZED
BACKFILL: NOT STARTED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**END OF PO VAULT AUTHORIZATION DECISION PACKAGE**
