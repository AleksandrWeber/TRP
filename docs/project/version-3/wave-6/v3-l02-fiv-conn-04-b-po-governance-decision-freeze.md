# FIV-CONN-04-B PO/Governance Decision Freeze

**Document:** FIV-CONN-04-B Write-Gate / Lifecycle Mutation Lock — PO/Governance Decision Freeze  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B — Write-gate / lifecycle mutation lock  
**Authority:** Product Owner / Chief Architect (immutable governance recording)  
**Nature:** **PO/GOVERNANCE DECISION FREEZE ONLY.** Freezes OD-B-01…OD-B-08. Does **not** authorize implementation. Does **not** create migrations, lease tables, deny hooks, mutate Connections/Vault/credentials, perform LIVE backfill, or authorize FIV/C7/venue I/O/capital.

**Planning Package:** [`v3-l02-fiv-conn-04-b-planning-package.md`](./v3-l02-fiv-conn-04-b-planning-package.md) (`5c3fb87de2147dce9a8f203b4bafb83117eeecc2`)  
**Planning Review:** [`v3-l02-fiv-conn-04-b-po-planning-review.md`](./v3-l02-fiv-conn-04-b-po-planning-review.md)  
**Parent Slice Approval:** [`v3-l02-fiv-conn-04-po-governance-slice-approval.md`](./v3-l02-fiv-conn-04-po-governance-slice-approval.md)  
**Parent Decision Freeze:** [`v3-l02-fiv-conn-04-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-po-governance-decision-freeze.md) (D-CONN-04-01…10 — not reopened)  
**Architecture/Security Confirmation:** [`v3-l02-fiv-conn-04-architecture-security-confirmation.md`](./v3-l02-fiv-conn-04-architecture-security-confirmation.md)

**Repository baseline (freeze act start):** `5c3fb87de2147dce9a8f203b4bafb83117eeecc2` (`HEAD == origin/main`)

```text
PO/GOVERNANCE DECISION FREEZE = GRANTED
ALL EIGHT DECISIONS OD-B-01…OD-B-08 FROZEN / APPROVED
FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED BY THIS ARTIFACT
```

Protected dirty/untracked leftovers outside these governance artifacts were **not** modified.

---

## 1. Review Scope

This freeze records PO/Governance decisions required to make FIV-CONN-04-B planning implementation-ready for subsequent Architecture Review, Security Review, and later Implementation Authorization.

It freezes **only** OD-B-01…OD-B-08 and related normative contracts for the write gate. It does **not** reopen D-CONN-04-01…10, D-CRED-02-01…14, or D-CONN-03-01…05.

---

## 2. Planning Package Reference

| Field                     | Value                                      |
| ------------------------- | ------------------------------------------ |
| Artifact                  | `v3-l02-fiv-conn-04-b-planning-package.md` |
| Commit                    | `5c3fb87de2147dce9a8f203b4bafb83117eeecc2` |
| Planning status at review | READY FOR PO / GOVERNANCE REVIEW           |
| Planning Review verdict   | **PASS**                                   |

Parent composition preserved:

```text
04-A = CLOSED
04-B = THIS FREEZE (planning complete; implementation not authorized)
04-C / 04-D / 04-E = NOT STARTED
```

---

## 3. Governance Baseline

```text
CLOSED:
  FIV-CRED-01, FIV-CONN-01, FIV-CONN-02, FIV-CONN-03, FIV-CONN-04-A

FROZEN (not reopened):
  D-CRED-02-01…14 (incl. D-CRED-02-12 write serialization)
  D-CONN-03-01…05
  D-CONN-04-01…10 (incl. D-CONN-04-08 deny set)

FIV-CONN-04 parent Slice Approval: GRANTED (sub-slice gates still required)
FIV-PRE-01: NOT CLOSED
FIV: NOT AUTHORIZED / NOT PERFORMED
C7: DENY-ALL
allowRealVenueIo: FALSE
```

### Binding parent deny set (D-CONN-04-08 = B) — not reopened

During the authorized backfill write window, **DENY**:

- Connection credential store
- Connection credential replace
- Connection credential revoke
- EXCHANGE Connection creation

Gate applies **only** to the authorized migration/backfill window.

---

## 4. PO Decisions OD-B-01…OD-B-08

### OD-B-01 — Lock Scope

```text
Status:   FROZEN / APPROVED
Decision: F — GLOBAL AUTHORIZED MIGRATION WINDOW
```

#### Exact frozen decision

FIV-CONN-04-B SHALL use a **single global authorized migration window** for the FIV-CONN-04 backfill critical section.

- One durable singleton lease key (e.g. `FIV-CONN-04`)
- One exclusive backfill runner at a time
- While gate ON: the frozen deny-set applies in **all** workspaces
- Gate is **not** workspace-scoped, provider-scoped, environment-scoped, or Connection-scoped

#### Why not Alt A (workspace-scoped)

Workspace scope was rejected as the **primary** design because:

1. The backfill is a **one-time controlled migration** requiring exclusive single-runner semantics across the inventory.
2. Parent freezes already describe a **maintenance / write window** (D-CONN-04-08, D-CRED-02-12).
3. Parallel workspace deny-set activity during a global inventory/backfill increases race and operational incompleteness risk.
4. Narrow deny-set already limits blast radius; global scope’s cost is temporary and acceptable for a short authorized window.

#### Global window safety contract (normative)

| Control                          | Rule                                                                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How opened                       | Only by an **authorized FIV-CONN-04 backfill runner / operator procedure** that successfully acquires the durable lease                                                                         |
| Who may open                     | Privileged system job / operator identity recorded in audit — **not** ordinary application clients                                                                                              |
| Exact purpose                    | Exclusive critical section for FIV-CONN-04-D environment backfill under D-CONN-04-08                                                                                                            |
| Maximum duration                 | Governance ceiling: **≤ 4 hours** per acquire unless a later explicit PO decision extends; heartbeat must keep lease alive within that ceiling; implementation/runbook may choose a shorter TTL |
| Scope blocked                    | Only OD-B-07 deny-set operations                                                                                                                                                                |
| How closed                       | Authorized release with matching fencing token after 04-E verification **or** controlled abort with residual inventory; or TTL expiry reclaim path                                              |
| Crash behavior                   | Lease remains ON until release or TTL expiry; deny-set stays denied; stale fencing tokens rejected                                                                                              |
| Overlap                          | **Forbidden** — at most one ON lease for `FIV-CONN-04`                                                                                                                                          |
| Nesting                          | **Forbidden**                                                                                                                                                                                   |
| Ordinary requests create window? | **No**                                                                                                                                                                                          |
| Accidental leave-active          | Mitigated by TTL expiry + mandatory audit + operator runbook reclaim; gate MUST NOT become a permanent general-purpose credential freeze                                                        |

```text
THE GATE IS A TIME-BOUNDED MIGRATION CONTROL — NOT A PERMANENT GLOBAL CREDENTIAL FREEZE
```

---

### OD-B-02 — NON-EXCHANGE Operations

```text
Status:   FROZEN / APPROVED
Decision: NARROW SPLIT
```

#### Exact frozen decision

| Class                                                                                  | During gate ON          |
| -------------------------------------------------------------------------------------- | ----------------------- |
| NON-EXCHANGE Connection **create**                                                     | **ALLOW**               |
| NON-EXCHANGE **rename** / displayName update                                           | **ALLOW**               |
| Credential **store / replace / revoke** on ANY connectionType (including NON-EXCHANGE) | **DENY**                |
| EXCHANGE create                                                                        | **DENY** (D-CONN-04-08) |
| Read-only operations                                                                   | **ALLOW**               |

#### Rationale

- Preserves narrowest safe **create** scope: D-CONN-04-08 denies EXCHANGE create only.
- Credential store/replace/revoke are denied at the shared `ConnectionsService` hooks without connectionType exemption, preventing EXCHANGE/NON-EXCHANGE bypass confusion and matching the unqualified credential wording in D-CONN-04-08.

---

### OD-B-03 — Disconnect / Disable

```text
Status:   FROZEN / APPROVED
Decision: ALLOW (all connectionTypes)
```

#### Exact frozen decision

`disconnect` and `disable` remain **ALLOWED** while the gate is ON for EXCHANGE and NON-EXCHANGE Connections.

#### Repository basis

`ConnectionsService.transitionLifecycle` updates **status only**. It does not mutate Vault, `vaultSecretId`, or `environment`. Strategy B excludes only `REVOKED`; disconnect/disable do not free Strategy B slots and do not create D-CONN-04-08 binding races.

#### Explicit non-equivalence

```text
disconnect / disable  ≠  revoke
revoke remains DENY while gate ON
```

---

### OD-B-04 — Durable Lock Storage

```text
Status:   FROZEN / APPROVED
Decision: E — COMBINATION
  Primary: A — Dedicated singleton DB lease table
  Plus:    Application deny hooks in ConnectionsService
  Optional supporting: C — PostgreSQL advisory lock (never sole SoT)
  Forbidden as sole SoT: D — Application / process-local mutex
  Forbidden: Overloading TradingSession or unrelated existing lease rows as the CONN-04 gate SoT
```

#### Governance-level lease contract (no schema created by this freeze)

| Element          | Contract                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Identity         | Singleton `gateKey = FIV-CONN-04` (exact string may be confirmed at implementation without changing semantics)                  |
| Fields (logical) | `state` (OFF/ON), `holderId`, `fencingToken` (monotonic), `acquiredAt`, `expiresAt`, `heartbeatAt`, `correlationId`, timestamps |
| Uniqueness       | Exactly one row per gate key                                                                                                    |
| Multi-instance   | All API instances read the same durable row                                                                                     |
| Observability    | State must be queryable; transitions audited                                                                                    |
| Advisory lock    | May serialize acquire attempts only; **insufficient alone** (D-CRED-02-12)                                                      |

```text
SCHEMA / MIGRATION CREATION = NOT AUTHORIZED BY THIS FREEZE
Requires later Implementation Authorization
```

---

### OD-B-05 — TTL / Stale Lock Policy

```text
Status:   FROZEN / APPROVED
Decision: TTL + HEARTBEAT + FENCING; STALE CANNOT MUTATE
```

#### Exact frozen decision

| Topic                      | Rule                                                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Acquisition                | CAS acquire only when OFF or expired ON; bump fencing token; set expiry                                                                  |
| Heartbeat                  | Holder must heartbeat to extend `expiresAt` within max window ceiling                                                                    |
| Lease expiration           | Expired ON becomes reclaimable by a **new authorized acquire** only                                                                      |
| Stale holder               | **Cannot** continue deny-set mutations, release with old token, or authorize 04-D writes                                                 |
| Crashed holder             | Same as stale after expiry; in-memory authority discarded on restart                                                                     |
| Process restart            | Must re-prove fencing token or re-acquire; no memory of prior hold                                                                       |
| Concurrent stale owner     | Old fencing token rejected; only current token is authoritative                                                                          |
| Automatic recovery         | **Allowed only** as: (1) deny-set remains denied while ON/unexpired; (2) after TTL expiry, new authorized acquire with new fencing token |
| Operator-mediated recovery | Allowed for emergency reclaim/release **before** TTL only via audited operator procedure; **no** unauthenticated force-unlock            |
| User force-unlock          | **Forbidden**                                                                                                                            |

```text
CAN A STALE HOLDER CONTINUE TO MUTATE? = NO
```

---

### OD-B-06 — Audit Events

```text
Status:   FROZEN / APPROVED
Decision: Dedicated classified Security Audit event type
          connection.migration-gate
```

#### Exact frozen decision

Reuse existing V3 Security Audit infrastructure (`SecurityAuditService`, classified catalog, sensitive-key rejection). Register a **dedicated** event type:

```text
eventType: connection.migration-gate
eventClass: connection
```

Do **not** overload `connection.lifecycle` outcomes for gate window semantics.

#### Required durable events

| Outcome / intent                       | Required                                                              |
| -------------------------------------- | --------------------------------------------------------------------- |
| `gate_acquired`                        | YES                                                                   |
| `gate_acquire_denied`                  | YES                                                                   |
| `lifecycle_mutation_blocked`           | YES                                                                   |
| `gate_released`                        | YES                                                                   |
| `lease_expired_reclaim`                | YES (when reclaim occurs)                                             |
| `stale_holder_rejected`                | YES (when fencing mismatch observed on release/heartbeat/runner auth) |
| `acquire_timeout` / contention timeout | YES                                                                   |

#### Required fields (safe metadata only)

| Field                                    | Requirement                                                                                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| eventType                                | `connection.migration-gate`                                                                                                            |
| outcome                                  | as above                                                                                                                               |
| actor                                    | system job id and/or operator user id                                                                                                  |
| workspace scope                          | For blocked mutations: target `workspaceId`. For global gate acquire/release: system scope + `gateKey` (workspace may be null/omitted) |
| operation                                | `gate_acquire` / `gate_release` / `gate_heartbeat` / `store` / `replace` / `revoke` / `exchange_create` / …                            |
| result                                   | acquired / denied / released / timeout / expired_reclaim / fencing_rejected                                                            |
| reason                                   | stable reason code                                                                                                                     |
| timestamp                                | required                                                                                                                               |
| correlation / request id                 | required when available                                                                                                                |
| lease / fencing                          | `gateKey`, `holderId`, `fencingToken` (non-secret)                                                                                     |
| connectionId / provider / connectionType | required on blocked mutation events when available                                                                                     |

#### Forbidden

```text
API keys, tokens, ciphertext, decrypted credentials, raw Vault bodies
```

04-D per-row backfill audits remain **04-D ownership** (D-CONN-04-09).

---

### OD-B-07 — Operation Allow/Deny Matrix

```text
Status:   FROZEN / APPROVED
Decision: MATRIX BELOW IS NORMATIVE
```

See **§5 Final Operation Matrix**.

---

### OD-B-08 — Contention Behavior

```text
Status:   FROZEN / APPROVED
Decision: IMMEDIATE DETERMINISTIC REJECTION
```

#### Exact frozen decision

When a deny-set lifecycle mutation encounters gate ON:

| Aspect                | Rule                                                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API/service behavior  | Immediate fail-closed rejection (deterministic conflict/locked error; exact HTTP code is implementation detail under Architecture Review)                 |
| Worker behavior       | Same immediate reject if any future worker uses gated paths                                                                                               |
| Retry behavior        | Client may retry **only after** gate OFF; **no** blind automatic bypass retries; **no** bounded wait inside the service that eventually succeeds while ON |
| Queue / wait          | **Forbidden**                                                                                                                                             |
| Implicit success      | **Forbidden**                                                                                                                                             |
| Client-visible result | Explicit gate-active / migration-window error                                                                                                             |
| Audit behavior        | Durable `lifecycle_mutation_blocked` event                                                                                                                |

Second backfill runner acquire contention: immediate `gate_acquire_denied`; do not start 04-D.

---

## 5. Final Operation Matrix

| Operation                                    | During FIV-CONN-04 backfill (gate ON)                   | Governance rationale                                                     |
| -------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Credential store                             | **DENY**                                                | D-CONN-04-08; prevents binding races (RACE-01/02 class)                  |
| Credential replace                           | **DENY**                                                | Protects exact `vaultSecretId` immutability during critical section      |
| Credential revoke                            | **DENY**                                                | Prevents revoked/dangling LIVE promotion races                           |
| EXCHANGE create                              | **DENY**                                                | Prevents Strategy B collision introduction (RACE-04)                     |
| EXCHANGE update (rename displayName)         | **ALLOW**                                               | Not in D-CONN-04-08; no env/credential mutation                          |
| EXCHANGE delete                              | **N/A**                                                 | No Connections delete API today; if added later requires new PO decision |
| Environment update (public API)              | **DENY** (existing immutability)                        | D-CRED-02-09; public env mutation remains forbidden                      |
| Privileged 04-D environment UPDATE           | **ALLOW only to lease holder with valid fencing token** | C-02 migration-time exception; not a public API                          |
| Disconnect                                   | **ALLOW**                                               | Status-only; does not alter Vault/env/binding (OD-B-03)                  |
| Disable                                      | **ALLOW**                                               | Status-only; does not alter Vault/env/binding (OD-B-03)                  |
| NON-EXCHANGE create                          | **ALLOW**                                               | Outside D-CONN-04-08 EXCHANGE-create deny (OD-B-02)                      |
| NON-EXCHANGE update (rename)                 | **ALLOW**                                               | Narrowest safe scope                                                     |
| NON-EXCHANGE credential store/replace/revoke | **DENY**                                                | Shared hooks; no connectionType bypass (OD-B-02)                         |
| Read-only lookup                             | **ALLOW**                                               | No mutation                                                              |
| Validation / handshake read paths            | **ALLOW**                                               | EXCHANGE NULL remains fail-closed under CONN-03                          |
| Health / capability read                     | **ALLOW**                                               | No deny-set mutation                                                     |

---

## 6. Lock Scope

```text
LOCK SCOPE = GLOBAL AUTHORIZED MIGRATION WINDOW (OD-B-01 = F)

Gate key:     singleton FIV-CONN-04
Granularity:  system-wide for deny-set only
Not:          workspace-only / provider-only / environment-only / per-Connection
Duration:     time-bounded (≤ 4h ceiling per acquire unless later PO extends)
Permanence:   FORBIDDEN as a standing freeze
```

---

## 7. Durable Coordination Decision

```text
SoT = dedicated singleton DB lease row
    + ConnectionsService deny hooks

Supporting (optional): advisory lock on acquire only
Forbidden sole SoT: in-memory mutex / process flag
Forbidden: TradingSession overload
```

---

## 8. TTL / Stale-Holder Policy

Normative summary of OD-B-05:

```text
Acquire → fencing_token++
Heartbeat extends expiry within max window
Expiry → reclaimable by new authorized acquire only
Stale fencing token → reject (no mutate / no release / no 04-D authority)
Operator emergency reclaim → audited only; no public force-unlock
```

---

## 9. Contention Behavior

Normative summary of OD-B-08:

```text
IMMEDIATE DETERMINISTIC REJECTION
NO QUEUE
NO IN-PROCESS WAIT-FOR-OFF SUCCESS PATH
NO BLIND RETRIES THAT BYPASS THE GATE
AUDIT ON BLOCK
```

---

## 10. Audit Requirements

Normative summary of OD-B-06:

```text
eventType = connection.migration-gate
Required outcomes:
  gate_acquired
  gate_acquire_denied
  lifecycle_mutation_blocked
  gate_released
  lease_expired_reclaim
  stale_holder_rejected
  acquire_timeout
No secrets
Reuse Security Audit catalog + sensitive-key controls
```

---

## 11. Race-Resolution Confirmation

| Race    | Protected invariant           | Lock / txn boundary                                 | Expected outcome                     |
| ------- | ----------------------------- | --------------------------------------------------- | ------------------------------------ |
| RACE-01 | No LIVE write after revoke    | Deny revoke while ON; 04-D recheck                  | Revoke denied; or UPDATE skip        |
| RACE-02 | Exact vaultSecretId unchanged | Deny replace while ON; conditional UPDATE predicate | Replace denied; or UPDATE no-op      |
| RACE-03 | No write to missing row       | No delete API; UPDATE rowCount=0                    | Skip                                 |
| RACE-04 | Strategy B authority          | Deny EXCHANGE create; unique index                  | Create denied; or P2002 skip         |
| RACE-05 | Single runner                 | Singleton lease CAS                                 | Second worker denied                 |
| RACE-06 | Multi-instance SoT            | Durable lease visible to all instances              | Mutations denied everywhere while ON |
| RACE-07 | Crash safety                  | TTL + fencing                                       | Stale cannot continue                |
| RACE-08 | Commit then crash             | Lease durable independent of process                | Gate stays ON until release/TTL      |
| RACE-09 | Acquire timeout               | Acquire path only                                   | Abort; no 04-D                       |
| RACE-10 | Retry integrity               | Re-prove fencing / re-acquire                       | No bypass                            |

```text
RACE-01…RACE-10 = DETERMINISTIC FAIL-CLOSED OUTCOMES CONFIRMED
```

---

## 12. Bypass / Security Requirements

### Bypass obligations for implementation (not implemented now)

| Path                    | Requirement                                                    |
| ----------------------- | -------------------------------------------------------------- |
| REST controllers        | Must call gated `ConnectionsService` methods                   |
| ConnectionsService      | Deny hooks mandatory on deny-set methods                       |
| Future workers/jobs     | Must not mutate credentials/EXCHANGE create without gate check |
| Admin/migration scripts | Must acquire lease; no ungated env backfill                    |
| Direct Vault mutate     | CONN-04 code MUST NOT call store/replace/revoke                |
| Direct Prisma           | Residual ops risk; outside app gate; runbook only              |

### Mandatory Security conditions (SEC-B)

| ID          | Condition                                                                                |
| ----------- | ---------------------------------------------------------------------------------------- |
| **SEC-B01** | Workspace isolation preserved on mutation paths and blocked-mutation audits              |
| **SEC-B02** | Global gate does not grant cross-workspace authority or data access                      |
| **SEC-B03** | No provider-only lock identity                                                           |
| **SEC-B04** | No environment-only lock identity                                                        |
| **SEC-B05** | No Vault mutation by 04-B                                                                |
| **SEC-B06** | No secret leakage in audit/logs/errors                                                   |
| **SEC-B07** | Fail-closed contention (OD-B-08)                                                         |
| **SEC-B08** | Stale holder fencing enforced (OD-B-05)                                                  |
| **SEC-B09** | Retries cannot bypass the gate                                                           |
| **SEC-B10** | Alternate ConnectionsService/API paths cannot bypass deny hooks                          |
| **SEC-B11** | Multi-instance correctness via durable lease SoT                                         |
| **SEC-B12** | Audit integrity for required gate events                                                 |
| **SEC-B13** | Gate cannot be opened by ordinary clients                                                |
| **SEC-B14** | Gate cannot become a permanent standing credential freeze (TTL + max duration + release) |

---

## 13. Approved Sub-Slices

| Sub-slice                                | Status       |
| ---------------------------------------- | ------------ |
| **B-01** Gate domain/contract            | **APPROVED** |
| **B-02** Durable concurrency mechanism   | **APPROVED** |
| **B-03** Lifecycle enforcement           | **APPROVED** |
| **B-04** Backfill integration boundary   | **APPROVED** |
| **B-05** Security/audit regression tests | **APPROVED** |
| **B-06** Crash/concurrency verification  | **APPROVED** |

Do not combine with 04-C / 04-D / 04-E implementation.

---

## 14. Acceptance Criteria Disposition

| ID         | Disposition        | Normative notes                                                                                                                        |
| ---------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| AC-B01     | **PASS**           | Runner can acquire lease                                                                                                               |
| AC-B02     | **PASS**           | Deny-set blocked while ON                                                                                                              |
| AC-B03     | **PASS (REFINED)** | Under OD-B-01=F: deny-set is intentionally blocked in all workspaces while ON; non-deny operations remain available per matrix         |
| AC-B04     | **PASS**           | NON-EXCHANGE create/rename allowed                                                                                                     |
| AC-B05     | **PASS**           | No env/purpose rewrite by gate                                                                                                         |
| AC-B06     | **PASS**           | Durable across instances                                                                                                               |
| AC-B07     | **PASS**           | Process-local mutex not SoT                                                                                                            |
| AC-B08     | **PASS**           | Acquire failure fail-closed                                                                                                            |
| AC-B09     | **PASS**           | Stale/crashed holder cannot silently permit unsafe mutation                                                                            |
| AC-B10     | **PASS**           | Retries cannot bypass                                                                                                                  |
| AC-B11     | **PASS**           | Alternate service paths cannot bypass                                                                                                  |
| AC-B12     | **PASS**           | Durable audit                                                                                                                          |
| AC-B13     | **PASS**           | No secrets                                                                                                                             |
| AC-B14     | **PASS**           | No LIVE backfill in 04-B                                                                                                               |
| AC-B15     | **PASS**           | No Vault mutation                                                                                                                      |
| AC-B16     | **PASS**           | No external venue I/O                                                                                                                  |
| AC-B17     | **PASS**           | C7 unchanged                                                                                                                           |
| AC-B18     | **PASS**           | FIV not authorized                                                                                                                     |
| AC-B19     | **PASS**           | Release restores deny-set APIs                                                                                                         |
| AC-B20     | **PASS**           | Wrong fencing token rejected                                                                                                           |
| AC-B21     | **PASS**           | Advisory alone insufficient                                                                                                            |
| AC-B22     | **PASS**           | allowRealVenueIo remains false                                                                                                         |
| AC-B23     | **PASS**           | No public env mutation API                                                                                                             |
| AC-B24     | **PASS**           | Canonical auth preserved                                                                                                               |
| **AC-B25** | **ADDED / PASS**   | Global window respects max-duration ceiling, authorized opener only, mandatory release/TTL path, and must not remain a standing freeze |

```text
AC-B01…AC-B25: GOVERNANCE-READY (implementation verification later)
```

---

## 15. Mandatory Architecture Conditions

| ID           | Condition                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| **ARCH-B01** | Implement OD-B-01 global singleton lease semantics                                                       |
| **ARCH-B02** | Implement OD-B-04 dedicated lease table + deny hooks (migration only after Implementation Authorization) |
| **ARCH-B03** | Deny hooks at `storeCredentials`, `replaceCredentials`, `revoke`, and EXCHANGE branch of `create`        |
| **ARCH-B04** | 04-D runner must refuse to start without valid lease + fencing proof                                     |
| **ARCH-B05** | No Vault I/O inside lease acquire/release DB transactions                                                |
| **ARCH-B06** | Advisory lock, if used, is supporting only                                                               |
| **ARCH-B07** | Preserve public environment immutability; 04-D exception remains privileged                              |
| **ARCH-B08** | Sub-slices B-01…B-06 remain separated from 04-C/D/E write logic                                          |

---

## 16. Mandatory Security Conditions

See **SEC-B01…SEC-B14** in §12. All are **mandatory implementation obligations** for Architecture/Security Review and later implementation.

---

## 17. Non-Scope

```text
- FIV-CONN-04-C / 04-D / 04-E implementation
- LIVE backfill / Connection.environment UPDATE in this slice
- Vault / credential mutation
- NOT NULL migration
- Strategy B cleanup
- TESTNET / DEMO population
- FIV / FIV-PRE-01 closure
- C7 enablement / allowRealVenueIo=true
- Capital activation
- Permanent global credential freeze
- Creating schema/migration in this governance act
- Force-unlock for ordinary users
```

---

## 18. Implementation Gate Status

```text
FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED

This Decision Freeze does NOT grant:
  Implementation Authorization
  Schema/migration creation rights
  Runtime gate enablement in production
  FIV-CONN-04-D backfill rights
  FIV / C7 / allowRealVenueIo / capital rights

Required next gates:
  Architecture Review
  Security Review
  Explicit Implementation Authorization act
```

---

## Consolidated Decision Matrix

| ID      | Topic              | Decision                                             | Status            |
| ------- | ------------------ | ---------------------------------------------------- | ----------------- |
| OD-B-01 | Lock scope         | **F** Global authorized migration window             | FROZEN / APPROVED |
| OD-B-02 | NON-EXCHANGE       | Create/rename ALLOW; credential hooks DENY all types | FROZEN / APPROVED |
| OD-B-03 | Disconnect/disable | **ALLOW**                                            | FROZEN / APPROVED |
| OD-B-04 | Durable storage    | Dedicated lease table + deny hooks                   | FROZEN / APPROVED |
| OD-B-05 | TTL/stale          | TTL+heartbeat+fencing; stale cannot mutate           | FROZEN / APPROVED |
| OD-B-06 | Audit              | `connection.migration-gate` durable events           | FROZEN / APPROVED |
| OD-B-07 | Operation matrix   | §5 matrix                                            | FROZEN / APPROVED |
| OD-B-08 | Contention         | Immediate deterministic rejection                    | FROZEN / APPROVED |

```text
OD-B-01  FROZEN / APPROVED
OD-B-02  FROZEN / APPROVED
OD-B-03  FROZEN / APPROVED
OD-B-04  FROZEN / APPROVED
OD-B-05  FROZEN / APPROVED
OD-B-06  FROZEN / APPROVED
OD-B-07  FROZEN / APPROVED
OD-B-08  FROZEN / APPROVED

Decision Freeze: GRANTED
Implementation:  NOT AUTHORIZED BY THIS ARTIFACT
```

---

## Safety State (this freeze act)

```text
Database writes:        ZERO
Schema/migrations:      NOT CREATED
Vault mutations:        ZERO
Credential mutations:   ZERO
External I/O:           ZERO
FIV:                    NOT PERFORMED
Capital:                ZERO
C7:                     DENY-ALL
allowRealVenueIo:       FALSE
LIVE backfill:          NOT PERFORMED
Protected leftovers:    UNTOUCHED
```

---

## Final State

```text
FIV-CONN-04-A = CLOSED
FIV-CONN-04-B = PLANNING REVIEW / DECISION FREEZE COMPLETE
FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
```

**END OF FIV-CONN-04-B PO/GOVERNANCE DECISION FREEZE**
