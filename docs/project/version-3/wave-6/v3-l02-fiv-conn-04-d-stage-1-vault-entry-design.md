# FIV-CONN-04-D — Stage 1 Vault / Entry Authorization Design Note

**Document:** Evidence-based technical discovery for KO-COND-01 (Vault `list` authorization from Option A Entry)  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Nature:** **DOCUMENTATION / DISCOVERY ONLY.** Does **not** implement Full D. Does **not** modify application source, Nest modules, VaultAccessControl, WorkspaceAccessService, tests, schema, migrations, Security Audit catalog, IA, ratification, Kickoff artifacts, or Decision Register. Does **not** automatically close KO-COND-01. Does **not** stage, commit, or push.

```text
KO-COND-01 DISPOSITION (THIS NOTE): OPEN — PRODUCT OWNER DECISION REQUIRED

FULL-D IMPLEMENTATION AUTHORIZATION: GRANTED WITH AMENDMENTS
IMPLEMENTATION KICKOFF: COMPLETED — PASS WITH CONDITIONS
IMPLEMENTATION EXECUTION: NOT STARTED
FIV-CONN-04-E: NOT AUTHORIZED
FULL-D BACKFILL EXECUTION: NOT STARTED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**Label discipline:** **VERIFIED FACT** | **DOCUMENTED REQUIREMENT** | **PROPOSED DESIGN** | **REVIEWER INFERENCE** | **UNRESOLVED**

---

## 1. Repository baseline

| Field                             | Value                                                              |
| --------------------------------- | ------------------------------------------------------------------ |
| Branch                            | `main`                                                             |
| HEAD                              | `953292675e197d4f25778aaaa59eacb2826560fe`                         |
| Index                             | empty                                                              |
| IA package SHA-256 (recalculated) | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` |
| Expected ratified SHA-256         | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` |
| Hash match                        | **VERIFIED FACT — exact**                                          |

Pre-existing dirty/untracked tree preserved (including Entry/identity, Kickoff/completion, Decision Register, dirty `connections.module.ts`). This act creates **only** this design note.

---

## 2. Governing references

| Artifact               | Path / ID                                                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full-D IA              | [`v3-l02-fiv-conn-04-d-implementation-authorization.md`](./v3-l02-fiv-conn-04-d-implementation-authorization.md) — sole scope authority                                       |
| Full-D IA ratification | [`v3-l02-fiv-conn-04-d-full-implementation-authorization-ratification.md`](./v3-l02-fiv-conn-04-d-full-implementation-authorization-ratification.md) — **D-CONN04-FULL-D-IA** |
| Kickoff Review         | [`v3-l02-fiv-conn-04-d-implementation-kickoff-review.md`](./v3-l02-fiv-conn-04-d-implementation-kickoff-review.md) — PASS WITH CONDITIONS                                     |
| Kickoff Completion     | [`v3-l02-fiv-conn-04-d-kickoff-completion.md`](./v3-l02-fiv-conn-04-d-kickoff-completion.md) — **D-CONN04-FULL-D-KO**                                                         |
| Decision Register      | [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md) — KO-COND-01 **OPEN**                                                                                    |

**DOCUMENTED REQUIREMENT (binding constraints):** Option A; sole Entry; expand/absorb; no second SYSTEM_JOB constructor; canonical identity via existing factory only; no caller-controlled actor identity; no public HTTP/DTO/job-payload/cron/Trading Runtime; B-04 unexported; no VaultAccessControl/membership redesign without separate PO authority; no inventory expansion without separate PO authority.

---

## 3. Exact unresolved KO-COND-01 statement

**DOCUMENTED REQUIREMENT** (Kickoff Completion §6 / Kickoff Review KO-COND-01):

Before Stage 4 freshness and before any Connection environment UPDATE, establish a trusted way for `Conn04SystemJobMigrationEntry` to call:

```text
SecretVaultService.list(actorWorkspaceId, workspaceId, actorRole?)
```

such that authorization succeeds, without inventing a second privileged boundary or bypassing Vault authorization.

**Central issue (this note):** Nest DI feasibility ≠ Vault authorization feasibility.

---

## 4. Existing SYSTEM_JOB Entry architecture

### 4.1 PrivilegedActorContext — VERIFIED FACT

`apps/api/src/modules/connections/migration-gate.ts` (~L86–93):

```text
PrivilegedActorKind = 'SYSTEM_JOB' | 'OPERATOR'
PrivilegedActorContext = { actorId: string; actorKind: PrivilegedActorKind; correlationId?: string }
```

**No** `workspaceId`, **no** `userId`, **no** `Role`. Comment at definition: _“not a replacement for VaultConnections.”_

### 4.2 Identity factory — VERIFIED FACT

`apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.ts`:

- `FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID = 'system-job:fiv-conn-04-migration-backfill'`
- `FIV_CONN_04_D_SYSTEM_JOB_ACTOR_KIND = 'SYSTEM_JOB'`
- `buildFivConn04DSystemJobActor({ correlationId? })` returns frozen `{ actorId, actorKind, correlationId? }` only
- Does **not** accept actorId/actorKind/PrivilegedActorContext parameters

### 4.3 Entry surface — VERIFIED FACT

`apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts`:

- Constructor dependency: **only** `Conn04MigrationBoundaryService`
- Methods: `start` / `resume` / `heartbeat` / `release` — each builds SYSTEM_JOB via factory, delegates to B-04
- Optional `start` inputs: `correlationId?`, `requestedTtlMs?` only
- **No** Vault, Prisma, C classifier, workspace scope, user, or Role today
- **No** `runEnvironmentBackfill` yet (Full-D expansion not started)

### 4.4 Target workspace scope today — VERIFIED FACT / UNRESOLVED for Full-D

Entry currently has **no** workspace scan. Informational A preflight (`FivConn04APreflightService`) obtains Connection `workspaceId` from Prisma and Vault list target workspaces from that set — but A requires caller-supplied `actorUserId` + `actorRole` (`FivConn04APreflightInput`).

**REVIEWER INFERENCE:** Full-D would obtain **target** `workspaceId` from Connection rows / A candidates. That does **not** supply Vault **actor** membership identity.

### 4.5 AuthN/AuthZ beyond SYSTEM_JOB attribution — VERIFIED FACT

Entry has **no** authenticated HTTP user context, session, or Role. Its only identity artifact is the SYSTEM_JOB `PrivilegedActorContext` for B-04.

---

## 5. Exact Vault `list()` authorization flow

### 5.1 Signature and authorize path — VERIFIED FACT

`apps/api/src/modules/secret-vault/secret-vault.service.ts` (~L141–148):

1. `list(actorWorkspaceId, workspaceId, actorRole?)`
2. `this.authorize({ actorWorkspaceId, actorRole, workspaceId })`
3. `accessControl.assertCanAccess({ userId: actorWorkspaceId, role: actorRole }, workspaceId)`
4. On success: `repository.listByWorkspaceId(workspaceId)` → metadata map

### 5.2 VaultAccessControl — VERIFIED FACT

`apps/api/src/modules/secret-vault/vault-access-control.ts` (~L37–54):

1. Trim userId / workspaceId
2. `member = workspaceAccess.isMember(targetWorkspaceId, userId)`
3. `allowed = authorization.allows(actor.role, PermissionClass.VaultConnections, member)`
4. Else: audit deny + throw `VaultIsolationError` (foreign vs role denial indistinguishable)

File comment: _“Caller-supplied workspace IDs and role claims are never sufficient on their own.”_

### 5.3 Membership semantics — VERIFIED FACT

`apps/api/src/modules/workspace/workspace-access.service.ts` (~L20–24):

```text
isMember(workspaceId, userId) ⇔ workspace exists ∧ Active ∧ workspace.ownerUserId === userId
```

Owner-only membership. Canonical SYSTEM_JOB actorId is **not** an `ownerUserId` under this model.

### 5.4 Role / permission — VERIFIED FACT

- `PermissionClass.VaultConnections` (`C8`) requires membership (`permission-catalog.ts`).
- Matrix allows VaultConnections for `Role.Trader` and `Role.Admin` only.
- `decideAuthorization` (`authorization-decision.ts` ~L26–28): if role is **not** a known Role → **deny** `unknown_role`.

**Therefore omitting `actorRole` fails closed.** Optional TypeScript `actorRole?` does **not** mean authorization succeeds without a role.

### 5.5 Internal trusted service-to-service Vault path — VERIFIED FACT

**None found.** Every inspected Vault metadata/secret API path runs `authorize` → `VaultAccessControl`. No SYSTEM_JOB exception, no service-principal overload, no metadata-only bypass for `list`.

Injectable ≠ authorized.

---

## 6. Existing trusted actor / context patterns discovered

| Pattern                                   | Source                                                                                                                   | Production use? | Identity nature                                                                             | Compatible with Full-D Option A autonomous Entry?                                                            | In IA inventory?                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| HTTP Connections Vault ops                | `connections.controller.ts` → `connections.service.ts` passes `request.user.userId` + role into `vault.get` / `retrieve` | Yes             | **Authenticated human** request user                                                        | **No** — Entry has no HTTP user; COND-IA-03 forbids public D path                                            | Controller/service not the D Entry path                                           |
| A preflight Vault list                    | `fiv-conn-04-a-preflight.service.ts` L90: `vault.list(input.actorUserId, workspaceId, input.actorRole)`                  | Yes (service)   | **Caller-supplied** `actorUserId`/`actorRole` — not proven authenticated inside the service | **Not automatically** a trusted SYSTEM_JOB credential (**DOCUMENTED REQUIREMENT** / Kickoff)                 | A preflight = REUSE informational only                                            |
| Notification / Telegram retrieve          | e.g. `telegram-bot-token.resolver.ts` — requires `actorUserId` + `actorRole`; fail-closed if missing                     | Yes             | Caller-supplied; still ACL-bound                                                            | Same gap: who supplies for SYSTEM_JOB?                                                                       | Out of D inventory as pattern; not a SYSTEM_JOB Vault principal                   |
| Exchange credential Model C               | `exchange-connection-credential.ts` — requires `actorUserId` + `actorRole` for get/retrieve                              | Yes             | Authenticated caller chain                                                                  | Same                                                                                                         | Not a list/SYSTEM_JOB pattern                                                     |
| Workspace owner lookup                    | `WorkspaceDomainService.getById` → `ownerUserId`                                                                         | Yes             | Data field, not an auth session                                                             | Looking up owner and calling Vault **as** that user = **impersonation** without an authorized run-as pattern | WorkspaceDomainService **not** in Full-D IA §7 inventory as a Vault-actor factory |
| SYSTEM_JOB PrivilegedActorContext         | P-D-02 factory                                                                                                           | Yes (B-04)      | Migration-gate principal only                                                               | **Cannot** pass `list` membership/role checks as written                                                     | Identity REUSE for B-04 only                                                      |
| Generic run-as / service-account registry | Searched; P-D-02 docs record absence                                                                                     | **Absent**      | N/A                                                                                         | N/A                                                                                                          | Explicitly out of policy                                                          |

**Production `vault.list(` call sites (application code):** essentially **A preflight** (+ tests/integration). No Nest-internal SYSTEM_JOB → Vault list pattern exists.

---

## 7. Module wiring analysis

| Check                                                                       | Result                                                                                   | Class                   |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------- |
| `ConnectionsModule` imports `SecretVaultModule`                             | Yes (`connections.module.ts`)                                                            | VERIFIED FACT           |
| `SecretVaultModule` exports `SecretVaultService`                            | Yes (`secret-vault.module.ts` L44)                                                       | VERIFIED FACT           |
| Entry can inject `SecretVaultService` without new Nest export of Entry/B-04 | **Yes** (provider already in module; Entry already a provider)                           | VERIFIED FACT — DI only |
| New provider required for DI alone?                                         | **No**                                                                                   | VERIFIED FACT           |
| Would DI create a second privileged boundary?                               | Injecting Vault into Entry does **not** by itself create a second SYSTEM_JOB constructor | REVIEWER INFERENCE      |
| Does DI satisfy `list` authorization?                                       | **No**                                                                                   | VERIFIED FACT           |

---

## 8. Alternative evaluation (Options 1–4)

### Option 1 — Existing authorized Vault actor context

| Question                                   | Answer                                                            |
| ------------------------------------------ | ----------------------------------------------------------------- |
| Does such a context exist on Entry?        | **No** — Entry has only SYSTEM_JOB PrivilegedActorContext         |
| Where created?                             | Human paths: HTTP `request.user`; A: caller input                 |
| Use without second SYSTEM_JOB constructor? | N/A — no Entry-native Vault actor                                 |
| Satisfies membership + role?               | Only if a real owner userId + Trader/Admin Role are supplied      |
| Preserve B-04 SYSTEM_JOB attribution?      | Would require **separating** Vault actor from B-04 actor (see §9) |

**Verdict: NOT VIABLE as an existing Entry-native context.**

### Option 2 — Existing trusted owner/workspace mapping

| Question                                      | Answer                                                                                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Authoritative owner field?                    | **Yes** — `Workspace.ownerUserId` via `WorkspaceDomainService.getById` / `WorkspaceAccessService.isMember`                                    | VERIFIED FACT                                        |
| Authorized “system may act as owner” pattern? | **Not found**                                                                                                                                 |
| Requires authenticated human / Role?          | Vault still needs a **known Role** with VaultConnections; ownerUserId alone is insufficient                                                   |
| Impersonation?                                | Using `list(ownerUserId, workspaceId, Role.Admin)` without an authorized run-as / delegated-auth design is **impersonation**                  | REVIEWER INFERENCE grounded in absence of run-as API |
| Fit IA inventory?                             | Owner lookup + Role invention is **not** an authorized inventory capability; WorkspaceDomainService not listed as Vault-actor source in IA §7 |

**Verdict: NOT VIABLE without separate PO authority for impersonation / delegated Vault principal.**

### Option 3 — Existing internal service authorization mechanism

| Question                                 | Answer                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| Exists today?                            | **No**                                                                            |
| Does `list` support it?                  | **No** — always user membership + Role                                            |
| Would require VaultAccessControl change? | **Yes** for any SYSTEM_JOB/service exception                                      |
| New provider / permission / boundary?    | Likely yes                                                                        |
| Inventory?                               | `VaultAccessControl` / new permission class = **out of IA §7** → **SCOPE CHANGE** |

**Verdict: NOT VIABLE in-scope.**

### Option 4 — No viable in-scope solution

**Selected.** Existing code establishes:

1. DI into Entry is feasible.
2. Authorization for `list` requires a workspace **owner** userId + **Trader/Admin** Role.
3. SYSTEM_JOB PrivilegedActorContext cannot satisfy those checks.
4. No authorized internal Vault principal / run-as / ACL bypass exists.
5. A preflight’s caller-supplied credentials are not a SYSTEM_JOB Vault identity.
6. Closing the gap requires a **policy** choice and almost certainly **inventory or ACL** change outside the ratified IA §7 set—or an explicitly PO-ratified Nest-internal dual-credential model that still needs a trusted source of human owner+Role for autonomous SYSTEM_JOB runs (which the autonomous model does not provide).

---

## 9. Identity separation model

### B-04 migration actor (DOCUMENTED REQUIREMENT — unchanged)

```text
actorKind = SYSTEM_JOB
actorId   = system-job:fiv-conn-04-migration-backfill
```

Created **only** by `buildFivConn04DSystemJobActor`. Used for B-04 lease / write authority / migration-gate audit attribution.

### Vault access actor (UNRESOLVED — no evidenced principal)

Required by current code for each `list` call:

```text
actorWorkspaceId  = workspace.ownerUserId  (must pass isMember)
actorRole         = Role.Trader | Role.Admin  (known role with VaultConnections)
workspaceId       = Connection.workspaceId   (target scope — available from Connection data)
```

**VERIFIED FACT:** These identities are **not the same** as SYSTEM_JOB PrivilegedActorContext.  
**UNRESOLVED:** No trusted, non-impersonating source of Vault access actor for autonomous Option A Entry execution.

**Forbidden by this note (and Kickoff Completion):** synthetic owner; fabricated membership; invented system Role; silent ACL weakening.

---

## 10. Proposed call flow

**No safe, fully evidenced in-scope call flow is proposed for implementation.**

A **hypothetical** Nest-internal sequence (PROPOSED DESIGN — **not authorized**; shown only to illustrate the gap):

```text
Entry.runEnvironmentBackfill(...)
  → buildFivConn04DSystemJobActor()           // B-04 only
  → boundary.start({ actor: SYSTEM_JOB })
  → for each Connection candidate:
       targetWs = connection.workspaceId
       ??? vaultActorUserId / vaultActorRole ???   // MISSING TRUSTED SOURCE
       vault.list(vaultActorUserId, targetWs, vaultActorRole)
       occupancy + classifyFivConn04LiveConnection(...)
       write txn + assertWriteAuthority + conditional UPDATE + audit
```

Until `???` is filled by Product Owner policy + any required inventory authorization, Stages 4–8 remain blocked per KO-COND-01.

---

## 11. Exact file inventory impact

### In-scope REUSE / MODIFY (already ratified — insufficient alone)

| Path                                          | IA action | Stage-1 finding                                                |
| --------------------------------------------- | --------- | -------------------------------------------------------------- |
| `fiv-conn-04-d-system-job-migration-entry.ts` | MODIFY    | DI of Vault possible; **cannot alone** authorize list          |
| `fiv-conn-04-d-system-job-identity.ts`        | REUSE     | B-04 only; not a Vault actor                                   |
| `secret-vault.service.ts`                     | REUSE     | list ACL-bound as today                                        |
| `connections.module.ts`                       | MODIFY    | Already imports SecretVaultModule; no new export needed for DI |
| `fiv-conn-04-a-preflight.service.ts`          | REUSE     | Informational only; caller-supplied Vault credentials          |

### Out-of-inventory / scope-change candidates if PO chooses ACL or principal invention

| Change                                                                    | Why needed (if chosen)                         | Inventory status                                                           |
| ------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| Modify `vault-access-control.ts` for SYSTEM_JOB / service metadata access | Only way to authorize without human owner+Role | **OUT OF IA §7**                                                           |
| Modify `WorkspaceAccessService` / membership model                        | Make SYSTEM_JOB a “member”                     | **OUT OF IA §7**                                                           |
| New Vault internal API / permission class                                 | Service-to-service metadata read               | **OUT OF IA §7**                                                           |
| Nest-export Entry + HTTP/DTO Vault actor fields                           | Would violate COND-IA-03                       | **Forbidden** without MINOR-PD02-PIR-01 remediation + PO                   |
| Impersonate `ownerUserId` with invented Role                              | No authorized run-as pattern                   | **Requires separate PO authority**; still not in inventory as a capability |

**No out-of-inventory files are created by this discovery task.**

---

## 12. Security and authorization risks

| Risk                                                               | Severity | Notes                                                            |
| ------------------------------------------------------------------ | -------- | ---------------------------------------------------------------- |
| Treating DI as authorization                                       | High     | Would fail closed at runtime or tempt ACL bypass                 |
| Impersonating workspace owner                                      | High     | Cross-user acting without authenticated Role/session             |
| Passing caller `actorUserId`/`actorRole` into Entry via public DTO | High     | COND-IA-03 / MINOR-PD02-PIR-01                                   |
| Equating SYSTEM_JOB actorId with Vault userId                      | High     | Fails membership; if forced via ACL change, conflates principals |
| Weakening VaultAccessControl for convenience                       | High     | Breaks S03-d isolation model; out of inventory                   |
| Using A preflight credentials as write-time SoT without re-auth    | Medium   | Violates IMPL-REV-D-06 freshness intent if stale/untrusted       |

---

## 13. Test implications (no tests created/modified)

When a PO-authorized design exists, tests must still cover (planning only):

- Vault list deny when membership/role missing
- Exact-id match after authorized list
- SYSTEM_JOB B-04 attribution unchanged when Vault actor differs
- No second constructor / no PrivilegedActorContext ingress
- Export walls unchanged
- A preflight remains informational (stale preflight cannot authorize write)

**No tests claimed passed in this act.**

---

## 14. KO-COND-01 disposition

```text
KO-COND-01 DISPOSITION: OPEN — PRODUCT OWNER DECISION REQUIRED
```

**Not A (CLOSED — IN-SCOPE DESIGN VERIFIED):** no complete trusted Vault actor path exists in current code that satisfies membership+role without out-of-inventory change or unauthorized impersonation.

**Not B (CLOSED WITH CONDITION):** remaining gap is a **policy / inventory** decision, not a narrow implementation verification of an already-complete authorized path.

**Not D (BLOCKED):** Option A Entry + B-04 SYSTEM_JOB attribution remain intact; the **blocker is Vault principal policy**, not a contradiction that Option A itself is invalid. Stages 4–8 stay gated until PO decides.

**Honesty rule applied:** injectability alone did **not** select A or B.

---

## 15. Required Product Owner decision (minimum)

Product Owner must choose (or refine) one **explicit** policy path before Stage 4 may proceed. Candidates for PO consideration (none pre-authorized):

| Candidate      | Essence                                                                                                                                                                                        | Likely inventory impact                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **PO-VAULT-A** | Authorize a **VaultAccessControl** (or sibling) exception for metadata `list` under verified SYSTEM_JOB Entry invocation (capability-scoped; no secret retrieve)                               | Modify Vault ACL modules — **new IA / inventory grant**                                                                                      |
| **PO-VAULT-B** | Authorize a **dedicated internal Vault metadata port** for CONN-04-D that does not use user membership (service principal)                                                                     | New API/provider — **new IA / inventory grant**                                                                                              |
| **PO-VAULT-C** | Require **operator-supervised** Nest-internal invocation that supplies authenticated owner `userId` + Role for Vault only, while Entry still constructs SYSTEM_JOB for B-04; forbid public DTO | Dual-identity model — needs COND-IA-03 interpretation + trusted credential source; may still need inventory if Workspace/Auth wiring expands |
| **PO-VAULT-D** | Reject autonomous Vault list under current ACL; redesign freshness evidence without `list` (if possible)                                                                                       | Likely contradicts IA §7.0 exact-id `list` binding — **new IA amendment**                                                                    |

Until one path is ratified (and inventory amended if needed):

```text
STOP — SEEK SEPARATE PRODUCT OWNER AUTHORITY
```

This Stage 1 note is the discovery evidence package for that decision. It does **not** itself amend `D-CONN04-FULL-D-IA` or close KO-COND-01 in the Decision Register.

---

## 16. Explicit implementation non-authorization

```text
THIS NOTE DOES NOT AUTHORIZE IMPLEMENTATION.

FULL-D IMPLEMENTATION AUTHORIZATION: GRANTED WITH AMENDMENTS
IMPLEMENTATION KICKOFF: COMPLETED — PASS WITH CONDITIONS
KO-COND-01: REMAINS OPEN — PRODUCT OWNER DECISION REQUIRED
  (this discovery note is evidence; register closure of KO-COND-01 requires a separate governance act after PO decision)
IMPLEMENTATION EXECUTION: NOT STARTED
STAGE 2 CATALOG WORK: still subject to Kickoff Completion boundaries (no emission before registration); not started by this act
STAGES 4–8: BLOCKED until KO-COND-01 cleared under PO-authorized design
FIV-CONN-04-E: NOT AUTHORIZED
FULL-D BACKFILL EXECUTION: NOT STARTED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**END OF STAGE 1 VAULT / ENTRY AUTHORIZATION DESIGN NOTE**
