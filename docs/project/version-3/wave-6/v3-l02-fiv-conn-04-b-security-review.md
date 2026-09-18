# FIV-CONN-04-B Security Review

**Document:** FIV-CONN-04-B Write-Gate / Lifecycle Mutation Lock — Security Review  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B — Write-gate / lifecycle mutation lock  
**Authority:** Security Review (Principal Security Architect under PO + Chief Architect)  
**Nature:** **SECURITY REVIEW ONLY.** Does **not** authorize implementation. Does **not** create migrations/lease tables/deny hooks. Does **not** mutate Connections/Vault/credentials. Does **not** authorize FIV/C7/venue I/O/capital.

**Reviewed artifacts:**

| Artifact                     | Path                                                                                                                     | Status                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| Planning Package             | [`v3-l02-fiv-conn-04-b-planning-package.md`](./v3-l02-fiv-conn-04-b-planning-package.md)                                 | COMPLETE (`5c3fb87…`)                 |
| PO Planning Review           | [`v3-l02-fiv-conn-04-b-po-planning-review.md`](./v3-l02-fiv-conn-04-b-po-planning-review.md)                             | **PASS**                              |
| PO Decision Freeze           | [`v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md)       | OD-B-01…08 **FROZEN** (`aaf2f70…`)    |
| Architecture Review          | [`v3-l02-fiv-conn-04-b-architecture-review.md`](./v3-l02-fiv-conn-04-b-architecture-review.md)                           | **PASS WITH CONDITIONS** (`852c6f1…`) |
| Parent Arch/Sec Confirmation | [`v3-l02-fiv-conn-04-architecture-security-confirmation.md`](./v3-l02-fiv-conn-04-architecture-security-confirmation.md) | PASS WITH CONDITIONS                  |
| Parent Decision Freeze       | [`v3-l02-fiv-conn-04-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-po-governance-decision-freeze.md)           | D-CONN-04-01…10 FROZEN                |
| FIV-CONN-04-A Closure        | [`v3-l02-fiv-conn-04-a-closure.md`](./v3-l02-fiv-conn-04-a-closure.md)                                                   | CLOSED                                |

**Repository baseline (review start):** `852c6f1672c428217a4d532ea9a307be2cc89ae5` (`HEAD == origin/main`)

```text
SECURITY REVIEW = PASS WITH CONDITIONS

FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED BY THIS ARTIFACT
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Review Scope

Adversarial security review of the frozen FIV-CONN-04-B design:

```text
Global authorized migration window (≤4h)
  + durable singleton DB lease (owner, fencing, TTL, heartbeat)
  + ConnectionsService deny hooks
  + CAS-in-txn fencing for privileged 04-D writes
  + immediate deterministic contention rejection
```

Objective: determine whether the design is security-safe and sufficiently constrained for a later Implementation Authorization act — **without** authorizing implementation here.

Frozen OD-B / D-CONN-04 / D-CRED-02 decisions are **not** reopened.

---

## 2. Documents Reviewed

See table above. Repository evidence (read-only):

| Area                        | Evidence                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Connections mutations / ACL | `connections.service.ts`, `connections.controller.ts` (`PermissionClass.VaultConnections`)  |
| Strategy B                  | Partial unique index migration                                                              |
| Security Audit              | `security-audit.service.ts` — `SENSITIVE_KEY = /password\|passwd\|token\|hash\|secret\|…/i` |
| Fencing analogues           | TradingSession check-then-save (insufficient); recovery `saveIfVersion` CAS (preferred)     |
| Vault mutate callers        | Production: only `ConnectionsService`                                                       |
| Workers                     | No connection/credential mutators found                                                     |

---

## 3. Security Baseline

```text
Model C:        Vault purpose = runtime SoT; Connection.environment = constraint/audit
Strategy B:     (workspaceId, provider, environment) uniqueness for credentialed EXCHANGE
ENV immutability: public APIs cannot rewrite environment after create
Workspace ACL:  X-Workspace-Id + membership + getRow(workspaceId, id)
Vault mutate:   store/replace/revoke only via ConnectionsService today
C7:             DENY-ALL
allowRealVenueIo: FALSE
FIV:            NOT PERFORMED
Capital:        NOT ACTIVATED
```

Parent SC-01…SC-12 and C-01 (write gate) remain binding. Architecture COND-ARCH-B01…B10 are **mandatory security inputs** to this review.

---

## 4. Threat Model

| ID       | Actor                              | Protected asset                              | Trust boundary                         | Attack / action                                         | Expected control                                                            | Fail-closed result                                        |
| -------- | ---------------------------------- | -------------------------------------------- | -------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| **T-01** | Ordinary authenticated user        | Credential bindings; EXCHANGE slot integrity | Workspace ACL + gate                   | store/replace/revoke/EXCHANGE create during window      | Deny hooks + existing `VaultConnections` ACL                                | Mutation rejected; audited block                          |
| **T-02** | Authorized administrator           | Same + gate open/close                       | Privileged acquire path ≠ ordinary API | Open permanent freeze; widen deny-set; forge env UPDATE | Privileged-only acquire; max-window; narrow matrix; no public env PATCH     | Unauthorized acquire denied; window cannot exceed ceiling |
| **T-03** | Compromised application client     | Same                                         | REST → service                         | Replay denied ops; spam retries; forge fencing in body  | Immediate reject; fencing not client-authoritative; ACL                     | No mutation; no escalate to lease acquire                 |
| **T-04** | Malicious/buggy worker             | Same                                         | App process                            | Direct Vault/Connection mutate                          | No workers today; future must use gated service                             | Fail closed if ungated path introduced (impl obligation)  |
| **T-05** | Stale migration owner              | 04-D write authority                         | Lease fencing CAS                      | Mutate after expiry/reassign with old fence N           | CAS-in-txn `fencingToken=N` fails after N+1                                 | Write rejected                                            |
| **T-06** | Concurrent API instance            | Singleton ownership                          | Shared DB lease                        | Dual acquire; one instance allows deny-set              | Durable SoT + CAS acquire                                                   | Second acquire denied; deniers see ON                     |
| **T-07** | Cross-workspace attacker           | Foreign workspace secrets/Connections        | Workspace ACL                          | Use global gate as cross-workspace accessor             | Gate ≠ data ACL; `getRow`/`VaultAccessControl` unchanged                    | Access denied by workspace controls                       |
| **T-08** | Operator emergency reclaim         | Lease integrity                              | Audited reclaim procedure              | Reclaim without invalidating fence; silent unlock       | Reclaim bumps fence + audit; no public force-unlock                         | Old fence dead; reclaim attributable                      |
| **T-09** | Process with stale in-memory state | Mutation authority                           | Process memory vs DB                   | Trust cached “I hold lease”                             | Process memory never SoT                                                    | DB CAS rejects                                            |
| **T-10** | Lower-level service/repo caller    | Deny-set integrity                           | Internal Nest / Prisma                 | Call `SecretVaultService` or Prisma directly            | App-supported path = ConnectionsService hooks; raw Prisma outside app trust | App paths blocked; raw DB = ops trust residual            |

```text
THREAT MODEL = COMPLETE — no fundamental uncovered actor class for 04-B scope
```

---

## 5. Global Migration Window Security

| Property                            | Security result                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| Explicit activation                 | **PASS** — acquire required                                                             |
| Authenticated/authorized activation | **CONDITIONAL** — privileged runner/operator only; must not be exposed on ordinary REST |
| Migration-specific purpose          | **PASS** — `gateKey=FIV-CONN-04`                                                        |
| ≤4h maximum                         | **CONDITIONAL** — COND-ARCH-B01/B02 / COND-SEC-B01                                      |
| Deny-set only                       | **PASS** — OD-B-07                                                                      |
| Not permanent                       | **PASS** — TTL + release + ceiling                                                      |
| Not ordinary-user controllable      | **PASS** (design)                                                                       |
| Not silently activated              | **PASS**                                                                                |
| Not nested                          | **PASS** — overlap forbidden                                                            |
| Auditable                           | **CONDITIONAL** — catalog registration required                                         |
| Safe expiration                     | **CONDITIONAL** — stale fence rejected; deny-set unlocks only when durable OFF/expired  |

### Attacks on the window

| Attack                    | Control                                                      |
| ------------------------- | ------------------------------------------------------------ |
| Unauthorized acquire      | Privileged path only + audit                                 |
| Repeated acquire while ON | CAS fail → `gate_acquire_denied`                             |
| Nested acquire            | Forbidden by singleton                                       |
| Lease extension beyond 4h | Heartbeat capped at `acquiredAt + maxWindow`                 |
| Forged owner / fence      | DB CAS predicates; client cannot mint authority              |
| Stale owner               | Fence bump on reassignment                                   |
| Replay of old lease state | Monotonic fencing; expired rows not authoritative for writes |

**General-purpose credential freeze prevention:** narrow deny-set + max duration + privileged opener + mandatory release/TTL. Design does **not** authorize permanent freeze.

```text
GLOBAL WINDOW SECURITY = PASS WITH CONDITIONS
```

---

## 6. Durable Lease Security

Required properties vs design:

| Property                  | Result                             |
| ------------------------- | ---------------------------------- |
| Durable DB SoT            | **PASS** (design; COND-ARCH-B03)   |
| Unique singleton identity | **PASS**                           |
| Owner identity            | **PASS**                           |
| Fencing token             | **PASS** (must be CAS-enforced)    |
| Expiry / heartbeat        | **PASS WITH CONDITIONS** (ceiling) |
| Purpose                   | **PASS** via gateKey               |
| Safe state transitions    | **PASS** — OFF↔ON via CAS only     |

Prevents: duplicate active owners (CAS), forged ownership (DB predicate), stale ownership (fence), indefinite ownership (TTL+ceiling), cross-purpose reuse (dedicated gateKey), lease replay (monotonic fence).

```text
DURABLE LEASE SECURITY = PASS WITH CONDITIONS
```

---

## 7. Fencing / TOCTOU Analysis (CRITICAL)

### Scenario A — post-reassignment stale mutate

```text
Owner A (fence N) → expiry → Owner B (N+1) → A mutates
REQUIRED: A REJECTED
```

**Security obligation:** privileged 04-D UPDATE must include durable predicate:

```text
lease.state=ON AND holderId=:A AND fencingToken=:N AND expiresAt>now()
```

in the **same DB transaction** as the Connection UPDATE (COND-ARCH-B04). Process-local “token still looks valid” is **not** sufficient.

### Scenario B — classic TOCTOU

```text
check fence valid → expire → B acquires → A UPDATE
```

Check-outside-txn (TradingSession lifecycle pattern) is a **known insufficient** pattern for this threat. Recovery-style in-txn CAS is the required analogue.

```text
FENCING / TOCTOU = PASS WITH CONDITIONS
Mandatory: COND-ARCH-B04 / COND-SEC-B02
If implemented as check-then-save only → would become BLOCKED at implementation review
```

Design is not BLOCKED now because the Architecture Review already forbids the unsafe pattern as sole control.

---

## 8. Crash / Restart Analysis

| Scenario                          | Exploitability                          | Permanent freeze?        | Stale mutate?            | New acquire?           | Fail-closed?      |
| --------------------------------- | --------------------------------------- | ------------------------ | ------------------------ | ---------------------- | ----------------- |
| Crash before acquire              | Low                                     | No                       | N/A                      | Yes                    | Yes               |
| Crash after acquire               | Deny-set stays denied until TTL/release | Mitigated by TTL+ceiling | No (needs fence)         | After expiry/reclaim   | Yes               |
| Crash during heartbeat            | Expiry proceeds                         | No                       | No                       | After expiry           | Yes               |
| Crash during protected mutation   | Partial forward-fix row possible (04-D) | No                       | Continuation needs fence | Yes if expired         | Yes               |
| Crash after commit before release | Window remains ON                       | Until TTL                | No                       | After expiry           | Yes               |
| Process restart                   | Memory discarded                        | No                       | Memory authority invalid | Re-prove or re-acquire | Yes               |
| DB connection loss                | Cannot claim acquire success            | No                       | Unknown state → deny     | When DB recovers       | **COND-ARCH-B09** |
| Network partition                 | Split-brain if process-local SoT        | N/A if durable SoT       | Prevented by DB CAS      | DB decides             | Yes               |

```text
CRASH / RESTART SECURITY = PASS WITH CONDITIONS (COND-ARCH-B09)
```

---

## 9. TTL / Heartbeat Security

| Question                    | Answer                                           |
| --------------------------- | ------------------------------------------------ |
| Who may heartbeat?          | Current `holderId` with matching fencing only    |
| Owner verified?             | **YES** — CAS                                    |
| Fencing checked?            | **YES**                                          |
| Heartbeat after expiry?     | **REJECT**                                       |
| Stale heartbeat resurrect?  | **NO** — cannot match after fence bump           |
| Heartbeat reset 4h ceiling? | **FORBIDDEN** — ceiling anchored at `acquiredAt` |

```text
TTL vs MAX WINDOW = DISTINCT CONCEPTS (COND-ARCH-B01/B02)
TTL/HEARTBEAT SECURITY = PASS WITH CONDITIONS
```

---

## 10. Stale Reclaim Security

| Property                         | Result                                                          |
| -------------------------------- | --------------------------------------------------------------- |
| Invalidates old ownership        | **REQUIRED** — fence bump                                       |
| Breaks fencing                   | **REQUIRED**                                                    |
| Cannot resurrect stale ownership | **REQUIRED**                                                    |
| Requires authorization           | **REQUIRED** — operator/privileged only                         |
| Durable audit                    | **REQUIRED** — `lease_expired_reclaim` / reclaim outcome        |
| Replay reclaim                   | Must be idempotent fail-closed / CAS                            |
| Cross-workspace abuse            | Reclaim is global coordination only; must not grant data access |

```text
STALE RECLAIM SECURITY = PASS WITH CONDITIONS (COND-ARCH-B06 / COND-SEC-B03)
Not BLOCKED: reclaim with fence invalidation is safe; reclaim without fence bump would be BLOCKED
```

---

## 11. Lifecycle Mutation Bypass Analysis

Deny-set: store / replace / revoke / EXCHANGE create.

| Path                       | App-supported?              | Gate coverage (design)                           | Security note                              |
| -------------------------- | --------------------------- | ------------------------------------------------ | ------------------------------------------ |
| 1. REST controller         | Yes                         | Via ConnectionsService hooks                     | Controllers already use `VaultConnections` |
| 2. Alternate REST endpoint | None found for Vault mutate | Must not introduce ungated twins                 | Impl obligation                            |
| 3. ConnectionsService      | Yes                         | **Primary enforcement**                          | Mandatory hooks                            |
| 4. Credential service      | None separate               | N/A                                              | —                                          |
| 5. Worker                  | None today                  | Future must gate                                 | COND-SEC-B04                               |
| 6. Scheduled job           | None today                  | Same                                             | COND-SEC-B04                               |
| 7. Admin path              | Privileged                  | Must acquire lease; no ungated env backfill      | COND-SEC-B05                               |
| 8. Repository method       | No public mutate repo       | Do not add ungated repos                         | —                                          |
| 9. Direct Prisma           | Outside app                 | **Ops trust residual** — not an application path | Documented residual                        |
| 10. Migration utility      | Trusted runner              | Must hold lease + fencing for 04-D               | COND-SEC-B05                               |

**Trust boundary statement:**

```text
Application security boundary = Nest application paths through ConnectionsService
  (+ privileged runner using lease APIs)

NOT claimed secure against:
  arbitrary DBA / raw SQL / compromised DB credentials
Those are out-of-band operational trust, not 04-B application bypasses.
```

```text
LIFECYCLE BYPASS ANALYSIS = PASS WITH CONDITIONS
NO application-supported bypass of the gate is permitted
```

---

## 12. Operation Matrix Security

| Operation              | During ON            | Indirect undermine risk?                                                                | Security result                                             |
| ---------------------- | -------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| store/replace/revoke   | DENY                 | N/A (blocked)                                                                           | **PASS**                                                    |
| EXCHANGE create        | DENY                 | Blocks Strategy B race                                                                  | **PASS**                                                    |
| Rename                 | ALLOW                | displayName only — no binding/env                                                       | **PASS**                                                    |
| Disconnect/disable     | ALLOW                | Status-only; does **not** free Strategy B (REVOKED-only exclusion); no Vault/env change | **PASS**                                                    |
| NON-EXCHANGE create    | ALLOW                | Outside EXCHANGE uniqueness                                                             | **PASS**                                                    |
| Reads                  | ALLOW                | No mutation                                                                             | **PASS**                                                    |
| Validation             | ALLOW                | May change status; Model C still fail-closes EXCHANGE NULL; no env rewrite              | **PASS** (monitor handshake side-effects in Security tests) |
| Delete                 | N/A                  | No API                                                                                  | **PASS**                                                    |
| Public env UPDATE      | DENY                 | Immutability                                                                            | **PASS**                                                    |
| 04-D privileged UPDATE | ALLOW w/ lease+fence | Must not weaken Model C evidence bar                                                    | **CONDITIONAL** — 04-D ownership + CAS                      |

No ALLOW operation in the frozen matrix undermines `vaultSecretId` binding or environment SoT when repository behavior is as inspected.

```text
OPERATION MATRIX SECURITY = PASS
```

---

## 13. Model C Security

| Attack                          | Prevention                                                       |
| ------------------------------- | ---------------------------------------------------------------- |
| Client-selected SecretPurpose   | Existing server-side derivation; 04-B adds no client purpose API |
| Provider-only resolution        | Not introduced                                                   |
| Cross-environment fallback      | Not introduced                                                   |
| Sibling-secret substitution     | Replace denied during window; exact-id binding preserved         |
| Cross-workspace credential use  | Workspace ACL + Vault ACL unchanged                              |
| Vault purpose mutation via gate | 04-B performs **zero** Vault mutation                            |

```text
MODEL C SECURITY = PASS
```

---

## 14. Strategy B Security

Concurrent EXCHANGE create during backfill:

1. Gate DENY on EXCHANGE create
2. DB unique index backstop on colliding LIVE write
3. No cleanup/substitution (D-CONN-04-05)

```text
STRATEGY B SECURITY = PASS
```

---

## 15. Workspace Isolation

**Critical distinction:**

| Layer                              | Scope                                         |
| ---------------------------------- | --------------------------------------------- |
| **A. Gate coordination state**     | Global singleton (`FIV-CONN-04`)              |
| **B. Business data / credentials** | Per-workspace ACL and Vault workspace binding |

Global gate **must not** become a cross-workspace data channel:

- Acquire does not return foreign credentials
- Deny audits for mutations carry **target** `workspaceId`
- Gate acquire/release may omit workspace or use system scope — must not attribute foreign workspace incorrectly
- Connection/Vault reads/writes remain workspace-scoped via existing controls

```text
WORKSPACE ISOLATION = PASS WITH CONDITIONS (COND-SEC-B06 — audit attribution rules)
```

---

## 16. Audit Security

Event family: `connection.migration-gate`

| Requirement                                           | Result                                                                |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| Actor attribution                                     | Required                                                              |
| Workspace context                                     | Required on blocked mutations; system scope on global acquire/release |
| Operation / result / reason / timestamp / correlation | Required                                                              |
| Lease/fence identifier                                | Required — **without** sensitive key names                            |
| No secrets                                            | Required                                                              |

### Sensitive-key collision (repo fact)

```text
SENSITIVE_KEY matches /token/
Payload key "fencingToken" → Security Audit REFUSES record
```

Using `fencingToken` as an audit payload key would **fail closed on audit** (good for leakage) but could cause **missing audit evidence** if not handled — security integrity risk. Mandatory: use non-matching key names (COND-ARCH-B07 / COND-SEC-B07).

Audit must not log API keys, secrets, ciphertext, or credential material.

```text
AUDIT SECURITY = PASS WITH CONDITIONS
```

---

## 17. Contention / Retry / Replay Security

| Concern                                | Result                                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| Immediate reject                       | **PASS** — OD-B-08                                                                           |
| Retry storms                           | Do not bypass; may amplify load — rate-limit out of 04-B scope; security integrity preserved |
| Race amplification                     | CAS prevents dual owners                                                                     |
| Denial bypass                          | **NO**                                                                                       |
| Accidental success after denial        | **NO** if durable ON observed                                                                |
| Durable audit on block                 | **REQUIRED**                                                                                 |
| Replay acquire/heartbeat/release/fence | CAS + monotonic fence → fail closed                                                          |
| Old authority after expiry             | **MUST NOT** regain mutation capability                                                      |

```text
CONTENTION / RETRY / REPLAY = PASS WITH CONDITIONS (audit-on-block mandatory)
```

---

## 18. Multi-Instance Analysis

| Property           | Result                                     |
| ------------------ | ------------------------------------------ |
| Singleton lease    | **PASS** (design)                          |
| Unique ownership   | **PASS** via CAS                           |
| Fencing            | **CONDITIONAL** — CAS-in-txn               |
| Deterministic deny | **PASS** if all instances read DB SoT      |
| No split-brain     | **PASS** if process-local never SoT        |
| Residual race      | Mid-flight deny vs acquire (COND-ARCH-B05) |

```text
MULTI-INSTANCE SECURITY = PASS WITH CONDITIONS
```

---

## 19. 04-D Security Contract

```text
04-D MAY mutate Connection.environment ONLY WHEN:
  1. Durable lease state = ON
  2. holderId matches runner
  3. fencingToken matches current lease
  4. expiresAt > now()
  5. Predicates 1–4 proven in SAME DB transaction as conditional UPDATE
  6. Vault metadata reads occur OUTSIDE that transaction
  7. Exact vaultSecretId + environment IS NULL predicates hold
```

04-B does not perform LIVE classification or env UPDATE. 04-D must not invent an ungated public env PATCH.

```text
04-D SECURITY CONTRACT = PASS WITH CONDITIONS (COND-ARCH-B04/B10)
```

---

## 20. T-01…T-10 Assessment

| Threat                   | Assessment                                                    |
| ------------------------ | ------------------------------------------------------------- |
| T-01 Ordinary user       | **PASS** — deny + ACL                                         |
| T-02 Admin               | **CONDITIONAL** — privileged acquire constraints + max window |
| T-03 Compromised client  | **PASS** — no client fence authority                          |
| T-04 Worker              | **CONDITIONAL** — none today; future gated                    |
| T-05 Stale owner         | **CONDITIONAL** — CAS fencing mandatory                       |
| T-06 Concurrent instance | **PASS** with durable SoT                                     |
| T-07 Cross-workspace     | **PASS** — gate ≠ data ACL                                    |
| T-08 Operator reclaim    | **CONDITIONAL** — fence bump + audit                          |
| T-09 Stale memory        | **PASS** — memory not SoT                                     |
| T-10 Lower-level access  | **CONDITIONAL** — app paths gated; Prisma residual documented |

---

## 21. Planned Security Test Assessment (Planning T-01…T-20)

| Test                            | Coverage adequacy     | Gap?                                      |
| ------------------------------- | --------------------- | ----------------------------------------- |
| T-01…T-04 deny concurrency      | Adequate for deny-set | —                                         |
| T-05 env immutability           | Adequate              | —                                         |
| T-06…T-09 acquire/stale/retry   | Adequate start        | Add explicit **TOCTOU CAS** case          |
| T-10 workspace audit            | Adequate              | —                                         |
| T-11 provider/env isolation     | Adequate              | —                                         |
| T-12…T-13 allow paths           | Adequate              | —                                         |
| T-14 service bypass             | Adequate              | —                                         |
| T-15 process-local insufficient | Adequate (negative)   | —                                         |
| T-16 wrong fence release        | Adequate              | —                                         |
| T-17 gate OFF restore           | Adequate              | —                                         |
| T-18 no secrets                 | Adequate              | Must include `/token/` key rejection case |
| T-19 zero Vault/env in 04-B     | Adequate              | —                                         |
| T-20 ACL preserved              | Adequate              | —                                         |

### Missing tests (add as security obligations — do not implement now)

| ID         | Required security test                                                     |
| ---------- | -------------------------------------------------------------------------- |
| **ST-B21** | Unauthorized / ordinary client cannot acquire migration lease              |
| **ST-B22** | Heartbeat cannot extend past `acquiredAt + 4h`                             |
| **ST-B23** | Stale owner UPDATE rejected after fence bump (same-txn CAS TOCTOU fixture) |
| **ST-B24** | Operator reclaim bumps fence; old fence rejected; audit present            |
| **ST-B25** | Mid-flight: Vault I/O then gate ON → Connection bind fails closed          |
| **ST-B26** | Audit payload rejects sensitive keys; accepted fence field name records    |

```text
PLANNED T-01…T-20 = ADEQUATE BASE + ST-B21…ST-B26 REQUIRED GAPS
```

---

## 22. SEC-B01…SEC-B14 Assessment

| ID      | Mark            | Implementation obligation if CONDITIONAL                                    |
| ------- | --------------- | --------------------------------------------------------------------------- |
| SEC-B01 | **PASS**        | Workspace ACL/`getRow` preserved                                            |
| SEC-B02 | **PASS**        | Global gate must not grant cross-workspace data access                      |
| SEC-B03 | **PASS**        | No provider-only lock identity                                              |
| SEC-B04 | **PASS**        | No environment-only lock identity                                           |
| SEC-B05 | **PASS**        | 04-B performs zero Vault mutation                                           |
| SEC-B06 | **CONDITIONAL** | No secret leakage; audit keys must pass sensitive-key filter (COND-SEC-B07) |
| SEC-B07 | **PASS**        | Immediate fail-closed contention                                            |
| SEC-B08 | **CONDITIONAL** | Stale fencing enforced via CAS-in-txn (COND-SEC-B02)                        |
| SEC-B09 | **PASS**        | Retries cannot bypass durable ON                                            |
| SEC-B10 | **CONDITIONAL** | Hook all deny-set entrypoints; no twin APIs (COND-SEC-B08)                  |
| SEC-B11 | **CONDITIONAL** | Durable lease SoT across instances (COND-ARCH-B03)                          |
| SEC-B12 | **CONDITIONAL** | Register `connection.migration-gate` + attribution (COND-ARCH-B08)          |
| SEC-B13 | **CONDITIONAL** | Ordinary clients cannot open gate (COND-SEC-B09)                            |
| SEC-B14 | **CONDITIONAL** | Max-window ceiling enforced; not permanent freeze (COND-SEC-B01)            |

```text
SEC-B01…SEC-B14: NONE BLOCKED
```

---

## 23. COND-ARCH-B01…B10 Assessment

| ID            | Mark            | Security note                                              |
| ------------- | --------------- | ---------------------------------------------------------- |
| COND-ARCH-B01 | **CONDITIONAL** | Security-mandatory max-window ceiling                      |
| COND-ARCH-B02 | **CONDITIONAL** | TTL ≠ max window — prevents indefinite ownership confusion |
| COND-ARCH-B03 | **CONDITIONAL** | Prevents multi-instance split-brain                        |
| COND-ARCH-B04 | **CONDITIONAL** | **Critical** TOCTOU fencing control                        |
| COND-ARCH-B05 | **CONDITIONAL** | Mid-flight acquire vs credential bind                      |
| COND-ARCH-B06 | **CONDITIONAL** | Reclaim must not resurrect stale fence                     |
| COND-ARCH-B07 | **CONDITIONAL** | Audit integrity vs sensitive-key regex                     |
| COND-ARCH-B08 | **CONDITIONAL** | Catalog registration before emit                           |
| COND-ARCH-B09 | **CONDITIONAL** | Uncertainty fail-closed                                    |
| COND-ARCH-B10 | **CONDITIONAL** | No Vault I/O in lease txns                                 |

```text
COND-ARCH-B01…B10: NONE BLOCKED — all remain mandatory for implementation
```

---

## 24. SEC-AC-01…SEC-AC-22 Assessment

Design-level disposition (implementation verification later):

| ID            | Criterion                                                                      | Design disposition                                 |
| ------------- | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| SEC-AC-01     | No unauthorized migration acquire                                              | **CONDITIONAL** — privileged path required         |
| SEC-AC-02     | Global window cannot exceed 4h                                                 | **CONDITIONAL** — COND-SEC-B01                     |
| SEC-AC-03     | Only one valid lease owner                                                     | **PASS** (CAS design)                              |
| SEC-AC-04     | Fencing prevents stale mutation                                                | **CONDITIONAL** — CAS-in-txn                       |
| SEC-AC-05     | TOCTOU fencing race prevented                                                  | **CONDITIONAL** — COND-ARCH-B04                    |
| SEC-AC-06     | Stale heartbeat cannot resurrect                                               | **PASS** (design)                                  |
| SEC-AC-07     | Stale owner cannot mutate                                                      | **CONDITIONAL**                                    |
| SEC-AC-08     | Operator reclaim cannot bypass fencing                                         | **CONDITIONAL** — fence bump                       |
| SEC-AC-09     | Credential store blocked                                                       | **PASS** (matrix)                                  |
| SEC-AC-10     | Credential replace blocked                                                     | **PASS**                                           |
| SEC-AC-11     | Credential revoke blocked                                                      | **PASS**                                           |
| SEC-AC-12     | EXCHANGE create blocked                                                        | **PASS**                                           |
| SEC-AC-13     | No alternate application path bypass                                           | **CONDITIONAL** — hooks + no twins                 |
| SEC-AC-14     | Model C preserved                                                              | **PASS**                                           |
| SEC-AC-15     | Strategy B uniqueness preserved                                                | **PASS**                                           |
| SEC-AC-16     | Workspace isolation preserved                                                  | **CONDITIONAL** — audit attribution                |
| SEC-AC-17     | No secret leakage                                                              | **CONDITIONAL** — sensitive-key safe payloads      |
| SEC-AC-18     | Denied ops fail closed                                                         | **PASS**                                           |
| SEC-AC-19     | Retries/replays cannot bypass                                                  | **PASS** (design)                                  |
| SEC-AC-20     | Multi-instance split-brain prevented                                           | **CONDITIONAL** — durable SoT                      |
| SEC-AC-21     | Crash/restart safe                                                             | **CONDITIONAL** — TTL + fence + fail-closed unread |
| SEC-AC-22     | Audit durable and attributable                                                 | **CONDITIONAL** — catalog + fields                 |
| **SEC-AC-23** | Mid-flight gate acquire cannot complete unsafe Connection bind after Vault I/O | **ADDED / CONDITIONAL**                            |
| **SEC-AC-24** | 04-B itself performs zero Vault mutate and zero env UPDATE                     | **ADDED / PASS** (design)                          |

```text
SEC-AC-01…SEC-AC-24: NONE BLOCKED at design level
```

---

## 25. Security Risks

| ID    | Risk                                              | Severity                    | Disposition                |
| ----- | ------------------------------------------------- | --------------------------- | -------------------------- |
| SR-01 | Check-then-save fencing (TOCTOU)                  | **Critical if implemented** | Forbidden by COND-ARCH-B04 |
| SR-02 | Heartbeat extends beyond 4h → standing freeze     | High                        | COND-SEC-B01               |
| SR-03 | Audit missing due to `fencingToken` key rejection | Medium                      | COND-SEC-B07               |
| SR-04 | Mid-flight acquire during credential Vault I/O    | Medium                      | COND-ARCH-B05              |
| SR-05 | Ungated future worker/Vault path                  | Medium                      | COND-SEC-B04               |
| SR-06 | Privileged acquire exposed on ordinary REST       | High                        | COND-SEC-B09               |
| SR-07 | Cross-workspace audit mis-attribution             | Low/Med                     | COND-SEC-B06               |
| SR-08 | Raw Prisma/DBA residual                           | Accepted residual           | Out of app boundary        |
| SR-09 | Combining 04-B with ungated 04-D                  | High                        | Separate slice gates       |

---

## 26. Mandatory Security Implementation Conditions

In addition to Architecture COND-ARCH-B01…B10, the following are **security-mandatory**:

| ID               | Condition                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **COND-SEC-B01** | Enforce `expiresAt` / heartbeat ≤ `acquiredAt + maxWindow` (≤4h unless later PO extends).                                                   |
| **COND-SEC-B02** | Privileged Connection.environment writes MUST use same-transaction durable fencing CAS; check-outside-txn alone is a security defect.       |
| **COND-SEC-B03** | Operator reclaim MUST bump/invalidate fencing and emit durable audit; old fence MUST NOT retain authority.                                  |
| **COND-SEC-B04** | No new worker/job/admin utility may mutate deny-set operations without observing the durable gate.                                          |
| **COND-SEC-B05** | Migration/backfill runner MUST hold valid lease+fence; no ungated env backfill scripts.                                                     |
| **COND-SEC-B06** | Blocked-mutation audits MUST attribute the target `workspaceId`; global acquire/release MUST NOT falsely claim foreign workspace authority. |
| **COND-SEC-B07** | Audit payloads MUST use field names that pass `SENSITIVE_KEY` (do not use keys matching `/token                                             | secret | credential | …/`). |
| **COND-SEC-B08** | Deny hooks MUST cover store/replace/revoke and EXCHANGE create with no ungated twin methods.                                                |
| **COND-SEC-B09** | Ordinary authenticated clients MUST NOT be able to acquire/release the migration lease.                                                     |
| **COND-SEC-B10** | Unreadable gate state ⇒ deny deny-set mutations and refuse 04-D start (uncertainty ≠ allow).                                                |
| **COND-SEC-B11** | Security tests MUST include ST-B21…ST-B26 (or equivalent coverage).                                                                         |

```text
These conditions do NOT authorize implementation.
```

---

## 27. Final Security Verdict

```text
SECURITY REVIEW = PASS WITH CONDITIONS
```

### Meaning

- The frozen FIV-CONN-04-B design is **security-coherent** with Model C, Strategy B, workspace isolation, and parent freezes.
- No **fundamental** security defect requires redesign or OD-B reopen (**not BLOCKED**).
- Implementation may be considered only after an explicit **Implementation Authorization** act and only if COND-ARCH-B01…B10 and COND-SEC-B01…B11 are treated as mandatory and verified.
- This review does **not** authorize implementation, schema/migration creation, runtime gates, backfill, FIV, C7, or capital.

### Why not PASS

Mandatory corrections/constraints remain (fencing CAS, max-window ceiling, audit naming, privileged acquire, mid-flight re-check, expanded security tests). A bare PASS would understate residual implementation risk.

### Next gate

```text
Next: PO/Governance Implementation Authorization for FIV-CONN-04-B
  (separate act; not granted here)
Then: Implementation under COND-ARCH + COND-SEC
Then: Security/PO verification of SEC-AC matrix
```

---

## Explicit Non-Authorization

```text
FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED
FIV-CONN-04-C / 04-D / 04-E = NOT AUTHORIZED
FIV / venue I/O / C7 / allowRealVenueIo / capital = NOT AUTHORIZED
Schema / migration / lease table creation = NOT AUTHORIZED BY THIS REVIEW
```

---

## Safety State (this review act)

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
FIV-CONN-04-B = SECURITY REVIEW COMPLETE
FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
```

**END OF FIV-CONN-04-B SECURITY REVIEW**
