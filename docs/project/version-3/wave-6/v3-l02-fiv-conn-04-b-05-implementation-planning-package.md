# FIV-CONN-04-B-05 Implementation Planning Package

**Document:** FIV-CONN-04-B-05 Security / Audit Regression — Implementation Planning Package
**Date:** 2026-09-18
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-04-B-05 — Security / audit regression tests
**Authority:** Implementation-planning engineer under PO Slice Approval
**Nature:** **IMPLEMENTATION PLANNING ONLY.** Does **not** modify production code, tests, Prisma, migrations, Vault, B-01…B-04, B-06, 04-D, backfill, FIV, C7, venue I/O, or capital.

**Slice Approval:** [`v3-l02-fiv-conn-04-b-05-slice-approval.md`](./v3-l02-fiv-conn-04-b-05-slice-approval.md) — **GRANTED** (`ec4ed11…`)
**Decision Freeze:** [`v3-l02-fiv-conn-04-b-05-decision-freeze.md`](./v3-l02-fiv-conn-04-b-05-decision-freeze.md) — **APPROVED** (`ec4ed11…`)
**Planning Review:** [`v3-l02-fiv-conn-04-b-05-planning-review.md`](./v3-l02-fiv-conn-04-b-05-planning-review.md) @ `2ce00c6…` — PASS WITH CONDITIONS (resolved)
**Planning Package:** [`v3-l02-fiv-conn-04-b-05-planning-package.md`](./v3-l02-fiv-conn-04-b-05-planning-package.md) @ `e75f669…`

**Repository baseline:** `ec4ed11d189d107ab00f8b27b0ba315e3e73057d` (`HEAD == origin/main`)

```text
FIV-CONN-04-B-05 SLICE APPROVAL = GRANTED
B-05 IMPLEMENTATION PLANNING = AUTHORIZED
B-05 CODING IN THIS TASK = NOT PERFORMED
No implementation performed.
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.
Plan against **committed HEAD** (local dirty 04-A leftovers ignored).

---

## 1. Planning Verdict

```text
READY FOR B-05 IMPLEMENTATION PLANNING REVIEW
Implementation = NOT STARTED
Coding = NOT AUTHORIZED BY THIS ARTIFACT
```

**Primary delivery posture (evidence-based):**

```text
DEFAULT = TEST-ONLY REGRESSION / VERIFICATION SUITE
PRODUCTION CODE CHANGES = NOT REQUIRED BY DEFAULT
```

Closed B-02/B-03 already deliver canonical `connection.migration-gate` emitters, catalog registration, sanitizer, attribution, and fail-closed deny-audit behavior. B-04 reuses B-02 audit paths. Under frozen **C-B05-01**, B-05 consolidates cross-slice regression evidence for **AC-B12** / **AC-B13** — it does not greenfield re-implement audit emission wiring.

---

## 2. Governance Inputs

| Source | Binding content |
| ------ | --------------- |
| Decision Freeze C-B05-01…05 | Verification/regression; OD-B-06 coverage rule; D-B03-03 regression; S3 smoke-only; local IDs tracing-only |
| Slice Approval | Proceed to Implementation Planning; coding not started by approval |
| Parent OD-B-06 | `connection.migration-gate`; required outcomes; safe fields; reuse Security Audit |
| Parent AC-B12 / AC-B13 | Durable gate+denial audits; no secrets in audit/logs |
| B05-AC01…12 / SB-B05-01…10 | Decomposition / traceability only (C-B05-05) |
| B-01…B-04 | CLOSED — consume; do not redesign |
| Residuals D-B03-04/06/08 | PRESERVED |

---

## 3. Frozen Scope

```text
B-05 = DURABLE AUDIT + SECURITY REGRESSION ONLY

MUST:
  Prove AC-B12 / AC-B13 across closed emitters
  Reuse connection.migration-gate + SecurityAuditService
  Keep B05-S3 smoke/regression only

MUST NOT:
  New security / audit architecture
  Parallel audit system / parallel sanitizer
  B-02 / B-03 / B-04 redesign
  B-06 / 04-D / FIV / C7 / live I/O / capital
  Reopen OD-B-06
```

---

## 4. Repository Mapping

Inspected at `ec4ed11…` (committed HEAD).

| Concern | Canonical location | Role for B-05 |
| ------- | ------------------ | ------------- |
| Audit contract / outcomes / sanitizer | `apps/api/src/modules/connections/migration-gate.ts` | `MIGRATION_GATE_AUDIT_*`, `sanitizeMigrationGateAuditPayload` |
| Migration-gate audit emitter | `…/connection-migration-gate-audit.ts` | Canonical emit → `SecurityAuditService.record` |
| Audit emitter tests | `…/connection-migration-gate-audit.spec.ts` | Actor / workspace / fencingToken reject |
| B-02 lease + same-txn audits | `…/prisma-migration-gate.adapter.ts` | Lifecycle outcomes via `safeAudit(..., tx)` |
| B-02 adapter tests | `…/prisma-migration-gate.adapter.spec.ts` | gate_acquired / reclaim / ST-B26 |
| B-03 deny enforcement | `…/connection-migration-gate-enforcement.ts` | `lifecycle_mutation_blocked` before throw |
| B-03 enforcement tests | `…/connection-migration-gate-enforcement.spec.ts` | Audit fail-closed; workspace payload |
| B-03 service matrix | `…/connections.service.fiv-conn-04-b-03.spec.ts` | Deny audits on store/replace/revoke/create |
| B-04 boundary | `…/conn04-migration-boundary.service.ts` (+spec) | Reuses B-02 acquire; walls T15–T18 |
| Catalog | `…/security-audit/security-audit-classification.ts` | `connection.migration-gate` registered |
| Attribution rules | `…/security-audit/security-audit-attribution.ts` | `actorId` required; workspace optional |
| Security Audit service | `…/security-audit/security-audit.service.ts` | Durable record + `SENSITIVE_KEY` filter |
| Persistence / integrity | `security-audit-persist.ts`, `security-audit-integrity*.ts` | Canonical append/integrity (reuse; do not redesign) |
| Module wiring | `connections.module.ts` | Audit + port + durable authority DI |

---

## 5. Existing Audit Architecture

```text
                    SecurityAuditService.record(event, tx?)
                         ▲
                         │ sanitizeMigrationGateAuditPayload
                         │ + attribution (actorId [, workspaceId])
              ConnectionMigrationGateAudit.record
                         ▲
          ┌──────────────┼──────────────────┐
          │              │                  │
   B-02 adapter     B-03 enforcement    B-04 boundary
   safeAudit(tx)    lifecycle_mutation  (reuse B-02
   gate_* outcomes  _blocked (no txn)    acquire path)
```

| Layer | Behavior already delivered |
| ----- | -------------------------- |
| Event type | `connection.migration-gate` |
| Classification | Registered in catalog |
| Sanitizer (gate) | Allowlist + sensitive-key regex incl. `fencingToken` |
| Sanitizer (platform) | `SecurityAuditService` `SENSITIVE_KEY` |
| B-02 durability | Audit inside lease txn (`record(..., tx)`) |
| B-03 deny durability | Separate durable `record` before `ConflictException`; audit throw ⇒ fail closed |
| B-04 | No new audit family; start/deny reuse B-02 |

```text
NO PARALLEL AUDIT SYSTEM REQUIRED OR PLANNED
NO PRODUCTION EMITTER REDESIGN REQUIRED BY DEFAULT
```

---

## 6. Audit Implementation / Verification Plan

| Topic | Plan |
| ----- | ---- |
| Migration-gate durability | Assert B-02 paths call `ConnectionMigrationGateAudit.record` with txn on acquire/deny/release/reclaim when exercised |
| Gate lifecycle audit | Coverage matrix for OD-B-06 outcomes **representable** + emitted on owning paths when exercised (C-B05-02) |
| Denial audit | Assert store/replace/revoke/EXCHANGE create emit `lifecycle_mutation_blocked` |
| Classification / event type | Assert catalog + emit `eventType === connection.migration-gate` |
| Actor attribution | Assert `attribution.actorId` present |
| Workspace attribution | Assert blocked mutations include `workspaceId` in payload and attribution when provided |
| Append-only / integrity | Rely on existing Security Audit persist path; B-05 asserts emit reaches `audit.record` (no second store) |
| Audit persistence failure | B-03: audit throw fails closed (existing + consolidate) |
| Fail-closed semantics | Deny path: no Connection mutation after audit failure (C-B05-03 / D-B03-03) |
| Catalog registration | Static import assertions on classification + attribution maps |
| No duplicate system | Diff wall: B-05 adds no new eventType / emitter class |

**Emitters consumed (do not redesign):**

| Emitter | Outcomes (primary) |
| ------- | ------------------ |
| B-02 `PrismaMigrationGateAdapter` | `gate_acquired`, `gate_acquire_denied`, `gate_released`, `lease_expired_reclaim`, `gate_stale_reclaim`, `stale_holder_rejected`, fencing/HB reject family |
| B-03 enforcement / ConnectionsService | `lifecycle_mutation_blocked` |
| B-04 façade | Reuses B-02 acquire/deny audits |

---

## 7. Secret-Leakage Plan

Canonical sanitizers (reuse both; do not invent a third):

1. `sanitizeMigrationGateAuditPayload` in `migration-gate.ts`
2. `SecurityAuditService` `SENSITIVE_KEY` filter

| Must never appear in audit records | Safe metadata may remain |
| ---------------------------------- | ------------------------ |
| API keys / API secrets | `gateKey`, `purpose`, `fenceGeneration` |
| Tokens (incl. key name `fencingToken`) | `holderId`, `operation`, `observation` |
| Passwords / credentials / ciphertext | `reasonCode`, `result`, `outcome` |
| Vault secret material / wrapping keys | `workspaceId`, `connectionId`, `correlationId` |
| Authorization headers / cookies | `actorId` (non-secret id) |

**Plan:** negative tests feeding forbidden keys into `ConnectionMigrationGateAudit.record` / sanitizer; assert reject and no `SecurityAuditService.record` call. Positive tests confirm safe payloads still emit.

---

## 8. Security Regression Plan

Regression walls only (no reimplementation):

| # | Wall | Planned verification |
| - | ---- | -------------------- |
| 1 | UNKNOWN ⇒ fail closed | Enforcement / B-03 / B-04 UNKNOWN refuse-deny smoke |
| 2 | Stale fence rejection | Adapter + B-04 write-proof stale fence |
| 3 | Stale ownership rejection | Adapter HB/release + B-04 ownership loss |
| 4 | Heartbeat/release ownership | Port/adapter + boundary HB/release |
| 5 | No client-authoritative fencing | Grant/`fencingToken` reject + CAS match required |
| 6 | No environment UPDATE | Static/source wall on B-05 delivery + B-04 T15-class |
| 7 | No Vault mutation | Static/source wall |
| 8 | No public migration HTTP | Controller/façade wall |
| 9 | No alternate authority path | No second SoT / observe≠write |

B05-S3 may **re-run or thin-wrap** existing closed-suite behaviors; must not redesign them (C-B05-04).

---

## 9. B05-S1 Plan — Audit Integrity

| Field | Plan |
| ----- | ---- |
| **Purpose** | Prove OD-B-06 / AC-B12 / SEC-B12 |
| **Exact emitters** | B-02 adapter; B-03 enforcement; B-04 reuse |
| **Expected records** | `eventType=connection.migration-gate`; required outcomes when paths exercised |
| **Durability** | B-02 same-txn; B-03 durable pre-throw |
| **Attribution** | actorId; workspaceId on blocked |
| **Failure** | Audit throw ⇒ fail closed on deny |
| **No-secret** | Sanitizer reject on forbidden keys |
| **Tests** | Dedicated S1 suite + catalog assertions (see §13 A–G) |
| **Production** | None by default |

---

## 10. B05-S2 Plan — Secret / Sensitive-Key Regression

| Field | Plan |
| ----- | ---- |
| **Purpose** | Prove AC-B13 / SEC-B06 / ST-B26 / T-18 |
| **Sensitive fields** | password, passwd, token, fencingToken, hash, secret, cookie, authorization, credential, wrapping, apiKey-style keys |
| **Sanitization boundaries** | Gate allowlist + platform `SENSITIVE_KEY` |
| **Assertions** | Reject before persist; `fenceGeneration` allowed; secrets absent |
| **Negative leakage tests** | Forbidden keys in payload; forged grant `fencingToken` |
| **Safe representations** | Allowlisted metadata only |
| **Production** | None by default |

---

## 11. B05-S3 Plan — Cross-Slice Security Smoke

| Field | Plan |
| ----- | ---- |
| **Purpose** | Smoke that closed B-02/B-03/B-04 walls remain intact under B-05 delivery |
| **Bound** | **SMOKE / REGRESSION ONLY** (C-B05-04) |
| **Minimum tests** | UNKNOWN fail-closed; stale owner/fence; HB/release ownership; client fence; env/Vault/HTTP/alternate-authority walls; privileged-acquire consume-existing (ST-B21-class) |
| **Forbidden** | New architecture; B-06 harness; residual remediation |
| **Production** | None |

---

## 12. Transaction / Durability Model

| Path | Model | Fail behavior |
| ---- | ----- | ------------- |
| B-02 lease mutate (acquire/release/HB/reclaim) | **Transactionally persisted audit** — `audit.record(..., tx)` inside lease txn | Audit throw aborts txn / fails operation (existing) |
| B-03 deny-set block | **Post-observe, pre-throw durable audit** — not same txn as Connection mutate (no mutate on deny) | Audit throw ⇒ **fail closed** (no soft-pass; D-B03-03) |
| B-04 start | Uses B-02 acquire path durability | Same as B-02 |

```text
B-05 MUST NOT invent a new transaction architecture.
B-05 verifies the two existing patterns above.
```

---

## 13. Test Strategy

Do **not** write tests in this act. Planned cases:

| ID | Scenario | Maps |
| -- | -------- | ---- |
| A | Gate lifecycle audits on acquire success/deny | B05-AC01/AC06 |
| B | Denial audits store/replace/revoke/EXCHANGE create | B05-AC02 |
| C | Actor attribution present | B05-AC05 |
| D | Workspace attribution on blocked | B05-AC04; T-10 |
| E | Catalog + eventType classification | B05-AC03 |
| F | Audit reaches SecurityAuditService.record | B05-AC01; SEC-B12 |
| G | Audit failure ⇒ fail-closed on deny | B05-AC07; C-B05-03 |
| H | Secret leakage negatives | B05-AC08; AC-B13 |
| I | API key/secret/token key negatives | B05-AC08/AC09 |
| J | Vault wrapping/secret material key negatives | B05-AC08 |
| K | UNKNOWN regression | SB-B05-05 |
| L | Stale owner/fence regression | SB-B05-06 |
| M | Heartbeat/release ownership | SB-B05-06 smoke |
| N | Client fence regression | SB-B05-03/06 |
| O | Environment UPDATE wall | B05-AC10 |
| P | Vault mutation wall | B05-AC10; SB-B05-07 |
| Q | Public HTTP wall | B05-AC11; SB-B05-08 |
| R | Alternate authority wall | B05-AC11; SB-B05-08 |
| S | B-02/B-03/B-04 existing suites remain green | B05-S3 |

**Deferred to B-06:** multi-instance dual-client / crash harness / RACE-05…10.

---

## 14. B05-AC01…12 Mapping

| ID | Source criterion | Planned location | Expected evidence | Dependency |
| -- | ---------------- | ---------------- | ----------------- | ---------- |
| B05-AC01 | AC-B12 | S1 spec + adapter regression | Durable gate lifecycle records | B-02 CLOSED |
| B05-AC02 | AC-B12 + OD-B-06 | S1 + B-03 matrix | `lifecycle_mutation_blocked` | B-03 CLOSED |
| B05-AC03 | COND-ARCH-B08 | S1 catalog asserts | Classification + attribution entries | B-02 CLOSED |
| B05-AC04 | T-10 / COND-SEC-B06 | S1 | workspaceId match | B-03 CLOSED |
| B05-AC05 | OD-B-06 | S1 | actorId present | B-02/B-03 |
| B05-AC06 | OD-B-06 + C-B05-02 | S1 coverage matrix | Representable + emitted when exercised | B-01/B-02/B-03 |
| B05-AC07 | D-B03-03 / C-B05-03 | S1 / enforcement | Audit-fail closed | B-03 CLOSED |
| B05-AC08 | AC-B13 / T-18 | S2 | No secrets persist | Sanitizer |
| B05-AC09 | ST-B26 / COND-SEC-B07 | S2 | fencingToken rejected; fenceGeneration ok | B-01/B-02 |
| B05-AC10 | SEC-AC-24 / SEC-B05 | S3 walls | No Vault/env UPDATE in B-05 delivery | Closed slices |
| B05-AC11 | B-04 / parent walls | S3 | No public HTTP / second SoT | B-04 CLOSED |
| B05-AC12 | Parent non-scope | S3 checklist | No 04-D/FIV/C7/capital | Separate gates |

---

## 15. SB-B05-01…10 Mapping

| ID | Authoritative source | Planned verification | Expected evidence |
| -- | -------------------- | -------------------- | ----------------- |
| SB-B05-01 | SEC-B12; OD-B-06 | S1 outcome/record matrix | Spec PASS |
| SB-B05-02 | SEC-B06; AC-B13; T-18 | S2 negatives | Spec PASS |
| SB-B05-03 | COND-SEC-B07; ST-B26 | S2 sanitizer | Spec PASS |
| SB-B05-04 | SEC-B01; COND-SEC-B06; T-10 | S1 workspace | Spec PASS |
| SB-B05-05 | COND-SEC-B10; COND-ARCH-B09 | S3 UNKNOWN smoke | Spec PASS |
| SB-B05-06 | SEC-B08; OD-B-05 | S3 stale/HB/release | Spec PASS |
| SB-B05-07 | SEC-B05; SEC-AC-24 | S3 static walls | Review/spec PASS |
| SB-B05-08 | SEC-B10/B13; B-04 | S3 HTTP/SoT walls | Review/spec PASS |
| SB-B05-09 | SEC-B13; ST-B21 consume | S3 smoke existing acquire authz | Spec/existing green |
| SB-B05-10 | OD-B-06 reuse | Diff: no parallel audit | Review PASS |

---

## 16. AC-B12 / AC-B13 Mapping

| Parent AC | Exact meaning (preserved) | Planned evidence |
| --------- | ------------------------- | ---------------- |
| **AC-B12** | Security audit evidence for gate lifecycle **and** denials is durable | S1 cases A/B/F + B-02 txn audits + B-03 durable blocked audits |
| **AC-B13** | No secrets appear in audit/logs | S2 cases H/I/J + sanitizer reject + ST-B26 |

```text
B05-AC* IDs remain decomposition-only (C-B05-05).
They do not replace or amend AC-B12 / AC-B13.
```

---

## 17. Exact Expected File Changes

### Production code

```text
PRODUCTION CHANGES REQUIRED BY DEFAULT = NONE
```

No CREATE/MODIFY of emitters, catalog, sanitizer, adapter, enforcement, boundary, or Security Audit core under default plan (C-B05-01).

Any later production gap-fill requires Implementation Planning Review / explicit Slice wall confirmation and **must not** reopen OD-B-06.

### Planned test / documentation files

| Path | Class | Slice | Trace |
| ---- | ----- | ----- | ----- |
| `apps/api/src/modules/connections/fiv-conn-04-b-05-audit-integrity.spec.ts` | **CREATE / TEST-ONLY** | B05-S1 | B05-AC01…07; AC-B12; OD-B-06 |
| `apps/api/src/modules/connections/fiv-conn-04-b-05-secret-leakage.spec.ts` | **CREATE / TEST-ONLY** | B05-S2 | B05-AC08/09; AC-B13; ST-B26 |
| `apps/api/src/modules/connections/fiv-conn-04-b-05-security-smoke.spec.ts` | **CREATE / TEST-ONLY** | B05-S3 | B05-AC10…12; SB-B05-05…10; C-B05-04 |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-05-implementation-report.md` | **CREATE / DOCUMENTATION** (at implementation act) | Evidence | Closure chain |

Optional (only if Implementation Planning Review finds duplication risk): thin **MODIFY / TEST-ONLY** hooks in existing specs — prefer dedicated B-05 files to avoid touching closed-slice test ownership.

### Explicit non-files

```text
DO NOT CREATE/MODIFY:
  connection-migration-gate-audit.ts (unless approved gap-fill)
  prisma-migration-gate.adapter.ts
  connection-migration-gate-enforcement.ts
  conn04-migration-boundary.service.ts
  security-audit-classification.ts / attribution.ts / service.ts
  Prisma schema / migrations
  connections.controller.ts public gate routes
```

---

## 18. Scope Exclusions

```text
EXCLUDED:
  B-06 crash/concurrency planning or implementation
  04-D / env UPDATE / Vault mutation
  Parallel audit system / new sanitizer framework
  B-01…B-04 redesign
  FIV / C7 / live I/O / credentials / capital
  Silent closure of D-B03-04 / D-B03-06 / D-B03-08
  New transaction architecture
```

---

## 19. Risks

| ID | Risk | Mitigation |
| -- | ---- | ---------- |
| R-IMPL-01 | Changing canonical audit behavior | Default no production edits |
| R-IMPL-02 | Duplicate audit records | Assert single emitter path; no second family |
| R-IMPL-03 | Weakening fail-closed | Reuse enforcement fail-closed tests; C-B05-03 |
| R-IMPL-04 | Secret leakage via test fixtures | Fixtures use fake ids only; never real secrets |
| R-IMPL-05 | False positive/negative leakage tests | Test both reject path and safe allow path |
| R-IMPL-06 | Smoke tests that miss real boundaries | S3 must call real closed helpers/adapters, not stubs that always pass |
| R-IMPL-07 | Scope creep into B-06 | Hard deferral list |
| R-IMPL-08 | Treating S3 as new architecture | C-B05-04 freeze |

---

## 20. B-06 Boundary

```text
B-06 = CRASH / CONCURRENCY (downstream)
B-05 does NOT implement or plan B-06.

B-05 may produce evidence useful later (audit integrity + wall smoke)
but does NOT create B-06 fixtures, multi-instance harness, or RACE-05…10 coverage.
```

---

## 21. Residuals

| Residual | Disposition |
| -------- | ----------- |
| **D-B03-04** | **PRESERVED** |
| **D-B03-06** | **PRESERVED** |
| **D-B03-08** | **PRESERVED** |

---

## 22. Implementation Preconditions

Before coding/tests may begin:

1. Implementation Planning Review = **PASS** (or PASS WITH CONDITIONS resolved)
2. Implementation Authorization / applicable slice gate for coding = **GRANTED** as governed
3. Scope remains TEST-ONLY regression unless a reviewed gap-fill is explicitly approved
4. C-B05-01…05 remain binding

```text
THIS PACKAGE DOES NOT AUTHORIZE IMPLEMENTATION.
```

---

## 23. Governance Gates

```text
COMPLETED:
  Planning Package → Planning Review → Decision Freeze → Slice Approval
  THIS ARTIFACT = Implementation Planning Package

NEXT GATE:
  FIV-CONN-04-B-05 IMPLEMENTATION PLANNING REVIEW

THEN:
  Implementation Authorization / coding gate as applicable
  → Implementation (tests per this plan)
  → PO Review
  → Closure
```

---

## 24. Explicit Statement

```text
No implementation performed.
```

```text
FIV = NOT AUTHORIZED
C7 = NOT AUTHORIZED
live I/O = NOT AUTHORIZED
real credentials = NOT AUTHORIZED
capital movement = NOT AUTHORIZED
04-D = NOT AUTHORIZED
environment UPDATE = NOT AUTHORIZED
Vault mutation = NOT AUTHORIZED
B-06 = NOT STARTED
```

```text
READY FOR B-05 IMPLEMENTATION PLANNING REVIEW
NEXT GATE = FIV-CONN-04-B-05 IMPLEMENTATION PLANNING REVIEW
```

**END OF FIV-CONN-04-B-05 IMPLEMENTATION PLANNING PACKAGE**
