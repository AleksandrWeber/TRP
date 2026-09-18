# FIV-CONN-04-B-05 Planning Package

**Document:** FIV-CONN-04-B-05 Security / Audit Regression — Planning Package
**Date:** 2026-09-18
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-04-B-05 — Security / audit regression tests
**Parent:** FIV-CONN-04-B — Write-gate / lifecycle mutation lock
**Authority:** Engineering / Architecture planning support under Wave 6 PO + Chief Architect governance
**Nature:** **PLANNING ONLY.** Does **not** authorize B-05 implementation. Does **not** modify production code, tests, Prisma schema, migrations, Vault, B-01…B-04, B-06, 04-D, backfill, FIV, C7, venue I/O, or capital.

**Repository baseline (planning start):** `31dead2864f908a8252e586e9c9997b862e7a23f` (next-gate analysis; `HEAD == origin/main`).

```text
git status --short at planning start: dirty/untracked leftovers present
  (04-A leftovers, wave-5/6 docs, technical-debt, etc.)
Protected leftovers: NOT MODIFIED by this package.
Only mutation authorized by this task: THIS FILE.
```

```text
Wave 6 = NOT COMPLETE
V3-L02 = NOT CLOSED
FIV-CONN-04-B-01 = CLOSED
FIV-CONN-04-B-02 = CLOSED
FIV-CONN-04-B-03 = CLOSED
FIV-CONN-04-B-04 = CLOSED
FIV-CONN-04-B-05 = PLANNING ONLY (this package)
FIV-CONN-04-B-06 = NOT STARTED (downstream)
FIV-CONN-04-B = NOT CLOSED
FIV-CONN-04 = NOT CLOSED
FIV = NOT PERFORMED
C7 = DENY-ALL
LIVE CAPITAL = NOT ACTIVATED
LIVE VENUE I/O = NOT PERFORMED
04-D = NOT IMPLEMENTED / NOT AUTHORIZED
allowRealVenueIo = FALSE
```

---

## 1. Planning Verdict

```text
PLANNING VERDICT = READY FOR B-05 PLANNING REVIEW
PLANNING PACKAGE = READY FOR B-05 PLANNING REVIEW
Implementation = NOT AUTHORIZED
B-05 Slice Approval = NOT GRANTED
NO IMPLEMENTATION AUTHORIZATION IS GRANTED BY THIS PACKAGE
```

**Verdict rationale:** Parent FIV-CONN-04-B artifacts sufficiently define B-05 as the **security / audit regression** sub-slice whose owned acceptance criteria are **AC-B12** and **AC-B13**, bound to frozen **OD-B-06**, with dependencies on closed B-02/B-03 (and consumable closed B-04 boundary). Scope is verification / regression of existing `connection.migration-gate` audit mechanisms and closed B-02/B-03/B-04 security walls — **not** new security architecture, **not** a parallel audit system, **not** 04-D backfill audits.

```text
No implementation performed.
```

---

## 2. Governance Inputs

| Artifact | Path | Status / use |
| -------- | ---- | ------------ |
| Parent B Decision Freeze | `v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md` | OD-B-01…08 **FROZEN**; §13 B-05 **APPROVED** composition; OD-B-06 audit freeze |
| Parent B Implementation Authorization | `v3-l02-fiv-conn-04-b-implementation-authorization.md` | Wave-level IA **GRANTED**; B-05 subject to Slice Approval; T-01…T-20 + ST-B21…ST-B26 mandatory before parent B closure |
| Parent B Planning Package | `v3-l02-fiv-conn-04-b-planning-package.md` §19 / §20 / §23 | B-05 objective, deps, AC-B12/AC-B13, tests T-10/T-18 |
| Parent B PO Planning Review | `v3-l02-fiv-conn-04-b-po-planning-review.md` | B-05 **ACCEPT**; AC-B12/AC-B13 **PASS** at governance readiness |
| Parent Architecture / Security Reviews | `…-b-architecture-review.md`, `…-b-security-review.md` | COND-ARCH-B08; SEC-B06/B12; ST-B26; T-10/T-18 |
| B-01 ownership map | `v3-l02-fiv-conn-04-b-01-planning-package.md` §4 / §19 | Audit emission wiring/tests → **B-05**; audit outcomes contract |
| B-01…B-04 closures | `…-b-01-closure.md` … `…-b-04-closure.md` | CLOSED prerequisites; residuals preserved |
| Next-gate analysis | `v3-l02-fiv-conn-04-next-gate-analysis.md` | Next gate = B-05 Slice Planning (`31dead2…`) |

### Binding freezes (not reopened)

| Freeze | Binding essence for B-05 |
| ------ | ------------------------ |
| **OD-B-06** | Dedicated classified event `connection.migration-gate`; required outcomes; safe fields only; reuse Security Audit infra; 04-D per-row audits remain 04-D |
| **OD-B-01…05, 07, 08** | Binding context; B-05 does not redesign lease/deny matrix |
| **D-CONN-04-08 / D-CONN-04-09** | Deny-set + audit split (04-B gate events vs 04-D per-row) |
| **COND-ARCH-B08** | Catalog registration before emit |
| **COND-SEC-B06** | Blocked-mutation audits attribute target `workspaceId` |
| **COND-SEC-B07** | Audit payload keys pass `SENSITIVE_KEY` filter |
| **SEC-B06** | No secret leakage |
| **SEC-B12** | Audit integrity for required gate events |
| **SEC-AC-24** | 04-B modules perform zero Vault mutate / zero env UPDATE |
| **ST-B26** | Audit rejects sensitive keys; accepted fence field = `fenceGeneration` |

Wave-level FIV-CONN-04-B Implementation Authorization remains **GRANTED** at parent governance level and **does not** authorize this sub-slice without B-05 Slice Approval and subsequent gates.

---

## 3. B-05 Objective

Exact objective from parent planning package §19:

```text
B-05 OBJECTIVE:
  Durable audit for gate + denials; no secret leakage

Owned parent ACs:
  AC-B12 — Security audit evidence for gate lifecycle and denials is durable
  AC-B13 — No secrets appear in audit/logs

Owned invariants:
  Catalog registration
  Sensitive-key rejection

Owned tests (parent §19 / §20):
  Audit payload allowlist
  Deny audit on store / replace / revoke / create
  T-10 — Workspace isolation on deny audits
  T-18 — Audit contains no secrets
```

B-01 ownership map §4:

```text
Audit emission wiring / tests = B-05 (uses B-01 contract)
```

**Interpretation (evidence-based, not expansion):**

B-02 and B-03 already **implemented** catalog registration and primary emit paths. B-05 therefore owns the **cross-slice audit integrity + secret-leakage regression suite** that proves OD-B-06 / AC-B12 / AC-B13 still hold across closed B-02/B-03/B-04 surfaces — and fills only those verification gaps required by parent criteria. B-05 does **not** invent a second audit subsystem or new security architecture.

---

## 4. Repository Evidence

### 4.1 Already delivered (CLOSED — consume, do not redesign)

| Surface | Evidence | Relation to B-05 |
| ------- | -------- | ---------------- |
| Audit event type + outcomes contract | `migration-gate.ts` (`MIGRATION_GATE_AUDIT_EVENT_TYPE`, `MIGRATION_GATE_AUDIT_OUTCOMES`, safe payload keys, sanitizer) | B-01 contract — B-05 verifies |
| Catalog + attribution | `security-audit-classification.ts`, `security-audit-attribution.ts` (`connection.migration-gate`) | COND-ARCH-B08 — B-05 regresses |
| Gate lifecycle emits | `prisma-migration-gate.adapter.ts` + `connection-migration-gate-audit.ts` | B-02 CLOSED — B-05 regresses |
| Deny-set blocked emits | B-03 enforcement + `lifecycle_mutation_blocked` + workspace attribution | B-03 CLOSED — B-05 regresses |
| Boundary reuse of audit family | B-04 façade reuses B-02 acquire/deny paths | B-04 CLOSED — B-05 may consume |
| ST-B26 / fencingToken reject | B-01/B-02 specs already assert `fenceGeneration`, reject `fencingToken` | B-05 consolidates regression |

### 4.2 OD-B-06 required outcomes (frozen)

| Outcome / intent | Required by OD-B-06 | Primary emitter (closed) |
| ---------------- | ------------------- | ------------------------ |
| `gate_acquired` | YES | B-02 |
| `gate_acquire_denied` | YES | B-02 |
| `lifecycle_mutation_blocked` | YES | B-03 |
| `gate_released` | YES | B-02 |
| `lease_expired_reclaim` | YES (when reclaim occurs) | B-02 |
| `stale_holder_rejected` | YES (fencing mismatch paths) | B-02 |
| `acquire_timeout` / contention timeout | YES | B-02 (`gate_acquire_denied` / `acquire_timeout` family) |

B-05 verifies these remain durable, classified, attributed, and secret-free — it does not redefine them.

### 4.3 No pre-existing B05-AC / SB-B05 IDs

```text
Repository search: no authoritative B05-ACxx or SB-B05-xx identifiers exist yet.
```

This package therefore introduces **planning-local** `B05-AC*` / `SB-B05-*` IDs that map **1:1** to existing parent criteria. They do **not** invent new requirements.

---

## 5. Scope

### 5.1 IN SCOPE

| # | Item | Source |
| - | ---- | ------ |
| 1 | Cross-slice **audit integrity regression** for OD-B-06 required gate + denial events | OD-B-06; AC-B12; SEC-B12 |
| 2 | Confirm `connection.migration-gate` remains registered in classification + attribution | COND-ARCH-B08 |
| 3 | Confirm deny-path audits on store/replace/revoke/EXCHANGE create (`lifecycle_mutation_blocked`) | Parent B-05 tests; OD-B-06; B-03 |
| 4 | Confirm actor attribution; workspace attribution on blocked mutations | OD-B-06; COND-SEC-B06; T-10 |
| 5 | Confirm audit failure remains fail-closed on deny paths (no silent soft-pass) | B-03 frozen D-B03-03 spirit; SEC-B12 |
| 6 | Confirm sensitive-key / allowlist hygiene; no secrets in audit/logs; `fenceGeneration` not `fencingToken` | AC-B13; SEC-B06; COND-SEC-B07; ST-B26; T-18 |
| 7 | Limited **security regression smoke** that closed B-02/B-03/B-04 walls still hold for: UNKNOWN⇒REFUSE/DENY, stale ownership/fence rejection, heartbeat/release ownership, no client-authoritative fencing, no env UPDATE, no Vault mutation, no public migration HTTP, no alternate authority path — **as regression assertions only** | Parent SEC-B05/06/08/10/12/13; SEC-AC-24; B-04 walls; B-05 name “security regression” |
| 8 | Test/spec suite + evidence report artifacts under later Slice Approval | Parent B-05 “specs” |

### 5.2 OUT OF SCOPE

| # | Item | Owner / disposition |
| - | ---- | ------------------- |
| 1 | New Security Audit subsystem / parallel catalog | Forbidden |
| 2 | Redesign of B-01/B-02/B-03/B-04 production logic | Closed slices |
| 3 | New lease / schema / migration | B-02 CLOSED; not B-05 |
| 4 | New deny hooks / ConnectionsService behavior change | B-03 CLOSED |
| 5 | New 04-D boundary behavior | B-04 CLOSED |
| 6 | 04-D environment UPDATE / per-row backfill audits | **04-D** (explicit non-scope) |
| 7 | Multi-instance crash/concurrency / RACE-05…10 E2E | **B-06** |
| 8 | Live multi-process Postgres chaos | B-06 / ops |
| 9 | Remediation of D-B03-04 / D-B03-06 / D-B03-08 | Preserved residuals |
| 10 | FIV / C7 / venue I/O / capital / live credentials | Separately prohibited |
| 11 | Reopening OD-B decisions | Forbidden |

```text
B-05 = AUDIT + SECURITY REGRESSION VERIFICATION
B-05 ≠ new security architecture
B-05 ≠ 04-D
B-05 ≠ B-06
```

---

## 6. Dependencies

| Dependency | Status | Role for B-05 |
| ---------- | ------ | ------------- |
| **OD-B-06** | **FROZEN** | Normative audit contract |
| **B-01** | **CLOSED** | Audit constants / sanitizer / outcome contract |
| **B-02** | **CLOSED** | Lease lifecycle audit emitters + catalog registration |
| **B-03** | **CLOSED** | Deny-set blocked audit emitters + workspace attribution |
| **B-04** | **CLOSED** | Integration boundary; may be consumed for regression smoke (not redesigned) |
| Parent B IA | **GRANTED** (wave-level) | Ceiling; does not skip B-05 Slice Approval |
| **B-06** | **NOT STARTED** | **Downstream only** — B-05 does not depend on B-06 |

```text
B-05 DEPENDENCIES = SATISFIED FOR PLANNING
B-06 REMAINS DOWNSTREAM
```

No additional blocking dependency found in repository evidence beyond OD-B-06 + B-02/B-03 (B-04 closed and optionally consumed).

---

## 7. Architecture / Verification Model

```text
                    ┌─────────────────────────────────────┐
                    │ Existing Security Audit infrastructure │
                    │ classification + attribution + record  │
                    └──────────────────▲──────────────────┘
                                       │ reuse only
          ┌────────────────────────────┼────────────────────────────┐
          │                            │                            │
   B-02 emitters                 B-03 emitters                 B-04 paths
   (acquire/deny/               (lifecycle_mutation_          (reuse B-02
    release/HB/reclaim)          blocked)                      acquire/deny)
          │                            │                            │
          └────────────────────────────┼────────────────────────────┘
                                       │
                          B-05 VERIFICATION LAYER
                     (tests / regression / evidence)
                     — no parallel audit system —
```

| Layer | B-05 role |
| ----- | --------- |
| Contract | Consume B-01 audit constants + sanitizer |
| Emitters | Consume closed B-02/B-03 (and B-04 reuse) |
| Verification | New/extended **specs** proving AC-B12/AC-B13 / OD-B-06 / T-10 / T-18 / ST-B26 |
| Production code | **Default: no change.** Any gap-fill emission fix requires later Slice Approval + explicit Decision Freeze if it reopens OD-B-06 mapping |

---

## 8. Audit Scope

B-05 must verify (not redesign):

| Topic | Required verification |
| ----- | --------------------- |
| **Classification** | `eventType = connection.migration-gate` remains classified |
| **Event types / outcomes** | OD-B-06 required outcomes still present and emitted on owning paths |
| **Actor attribution** | Privileged / system / operator actor recorded per OD-B-06 |
| **Workspace attribution** | Blocked mutations carry target `workspaceId` (payload and/or attribution) — T-10 |
| **Failure / deny auditing** | Deny-set blocks emit `lifecycle_mutation_blocked` before throw; audit-fail ⇒ fail-closed |
| **Append-only / integrity** | Durable `SecurityAuditService.record` path used; no silent swallow of required gate audits |
| **Migration-gate audit behavior** | Gate lifecycle outcomes remain on B-02 paths; boundary does not invent alternate family |
| **Security audit regressions** | Sensitive-key filter; no secrets; no `fencingToken` key names |

```text
REUSE canonical Security Audit + connection.migration-gate
DO NOT create a parallel audit system
```

---

## 9. Security Regression Scope

Include **only** controls required by authoritative B-05 governance (AC-B12/AC-B13 + parent SEC obligations exercised as regression). Map to verification:

| # | Control | In B-05? | How |
| - | ------- | -------- | --- |
| 1 | B-02 lease behavior | **YES (smoke)** | Regression: acquire/deny/release/reclaim still audit + fail-closed; no redesign |
| 2 | B-03 deny-set enforcement | **YES (primary)** | Deny audits on store/replace/revoke/create; matrix still DENY when ACTIVE/UNKNOWN |
| 3 | B-04 start/refuse behavior | **YES (smoke)** | OFF/UNKNOWN/stale still refuse start; audits reuse family |
| 4 | B-04 durable CAS | **YES (smoke)** | CAS remains sole durable write-proof; no alternate path introduced by B-05 |
| 5 | UNKNOWN fail-closed | **YES** | UNKNOWN ⇒ DENY deny-set + REFUSE privileged start |
| 6 | Stale ownership/fence rejection | **YES** | Stale grant rejected; `stale_holder_rejected` / fencing outcomes where applicable |
| 7 | Heartbeat/release ownership | **YES (smoke)** | Ownership-bound HB/release still reject mismatches |
| 8 | No client-authoritative fencing | **YES** | Client fence claims not authoritative; sanitizer / ST-B26 |
| 9 | No environment UPDATE | **YES (wall)** | SEC-AC-24 regression — B-05 modules/tests introduce none |
| 10 | No Vault mutation | **YES (wall)** | SEC-AC-24 / SEC-B05 regression |
| 11 | No public migration HTTP | **YES (wall)** | B-04 wall preserved; B-05 adds none |
| 12 | No alternate authority path | **YES** | No second SoT / ungated script surface |

Multi-instance durability races remain **B-06** (not expanded here).

---

## 10. B05-AC Matrix

**Note:** No pre-existing `B05-ACxx` IDs existed. Planning-local IDs below map exclusively to authoritative parent criteria.

| ID | Authoritative source | Expected behavior | Evidence required | Planned verification | Dependency | Ownership |
| -- | -------------------- | ----------------- | ----------------- | -------------------- | ---------- | --------- |
| **B05-AC01** | **AC-B12** | Gate lifecycle audits durable for acquire / deny / release / reclaim paths | Durable `connection.migration-gate` records with required outcomes | Regression specs over B-02 adapter (+ B-04 start path reuse) | B-02 CLOSED | B-05 verify |
| **B05-AC02** | **AC-B12** + OD-B-06 | Deny-set blocks emit durable `lifecycle_mutation_blocked` for store/replace/revoke/EXCHANGE create | Audit before ConflictException; outcome present | B-03 enforcement / service regression specs | B-03 CLOSED | B-05 verify |
| **B05-AC03** | OD-B-06 + COND-ARCH-B08 | Catalog + attribution registration still present for `connection.migration-gate` | Classification + attribution entries | Static/unit catalog assertions | B-02 CLOSED | B-05 verify |
| **B05-AC04** | OD-B-06 + COND-SEC-B06 + **T-10** | Blocked-mutation audits attribute target workspace | `workspaceId` in payload/attribution matches target | Deny-audit workspace isolation tests | B-03 CLOSED | B-05 verify |
| **B05-AC05** | OD-B-06 | Actor attribution present on required gate / blocked events | `actorId` / privileged actor context recorded | Audit attribution assertions | B-02/B-03 | B-05 verify |
| **B05-AC06** | OD-B-06 required outcome set | Required OD-B-06 outcomes remain representable and exercised on owning paths | Outcome constants + emit coverage matrix | Outcome coverage matrix test / evidence table | B-01/B-02/B-03 | B-05 verify |
| **B05-AC07** | SEC-B12 / D-B03-03 spirit | Audit failure on deny path fails closed (no mutate / no soft-pass) | Audit throw propagates; no Connection mutation | Audit-fail closed regression | B-03 CLOSED | B-05 verify |
| **B05-AC08** | **AC-B13** + **SEC-B06** + **T-18** | No secrets in audit/logs | Payloads free of credentials / API keys / ciphertext | Secret-leakage negative tests | B-01 sanitizer | B-05 verify |
| **B05-AC09** | **ST-B26** + COND-SEC-B07 | Sensitive keys rejected; fencing field is `fenceGeneration` not `fencingToken` | Sanitizer reject + emit assertions | ST-B26 consolidation regression | B-01/B-02 | B-05 verify |
| **B05-AC10** | SEC-AC-24 / SEC-B05 | B-05 delivery introduces zero Vault mutate and zero `Connection.environment` UPDATE | Diff + static/unit walls | File-scope + negative assertions | Closed B slices | B-05 wall |
| **B05-AC11** | B-04 / parent non-scope | No public migration HTTP; no alternate authority SoT | No new controller/route; no second lease | Review + smoke | B-04 CLOSED | B-05 wall |
| **B05-AC12** | Parent B-05 non-scope | No 04-D per-row backfill audit types / env UPDATE / FIV / C7 / capital | Explicit non-delivery | Review checklist | Separately gated | B-05 wall |

```text
B05-AC01…AC12 = PLANNING-LOCAL IDs MAPPED TO PARENT AUTHORITY
No new product requirements invented.
```

---

## 11. SB-B05 Matrix

**Note:** No pre-existing `SB-B05-xx` IDs existed. Planning-local IDs map to parent SEC/COND/ST sources.

| ID | Security invariant | Parent source | Verification method | Expected evidence |
| -- | ------------------ | ------------- | ------------------- | ----------------- |
| **SB-B05-01** | Audit integrity for required gate events | SEC-B12; OD-B-06 | Outcome coverage + durable record assertions | Spec matrix PASS |
| **SB-B05-02** | No secret leakage in audit/logs/errors | SEC-B06; AC-B13; T-18 | Negative payload tests | Spec PASS |
| **SB-B05-03** | Sensitive-key hygiene; `fenceGeneration` only | COND-SEC-B07; ST-B26 | Sanitizer + emit key inspection | Spec PASS |
| **SB-B05-04** | Workspace isolation on blocked-mutation audits | SEC-B01; COND-SEC-B06; T-10 | Cross-workspace deny audit assertions | Spec PASS |
| **SB-B05-05** | UNKNOWN / unreadable ≠ allow | COND-SEC-B10; COND-ARCH-B09 | Deny-set DENY + start REFUSE under UNKNOWN | Regression smoke |
| **SB-B05-06** | Stale holder / fence cannot authorize | SEC-B08; OD-B-05 | Stale HB/release/start/write-proof reject | Regression smoke |
| **SB-B05-07** | No Vault mutation / no env UPDATE by 04-B surfaces under B-05 | SEC-B05; SEC-AC-24 | Static/diff walls | Review PASS |
| **SB-B05-08** | No public migration HTTP / no alternate authority path | SEC-B10/B13; B-04 walls | Route/SoT review + smoke | Review PASS |
| **SB-B05-09** | Ordinary clients cannot acquire migration lease | SEC-B13; ST-B21 class | Privileged-only acquire regression (consume B-02) | Smoke / existing specs green |
| **SB-B05-10** | No parallel audit system introduced | OD-B-06 reuse mandate | Diff review | Review PASS |

---

## 12. Proposed Slices

Do **not** reuse B-04 S1/S2/S3 structure. Smallest safe split for B-05:

### B05-S1 — Audit integrity regression

| Field | Definition |
| ----- | ---------- |
| **Purpose** | Prove OD-B-06 / AC-B12 / SEC-B12 across closed emitters |
| **Inputs** | Closed B-01 contract; B-02/B-03 emitters; catalog; B-04 reuse paths |
| **Outputs** | Spec suite + coverage matrix for required outcomes / attribution / fail-closed audit |
| **Dependencies** | B-01…B-04 CLOSED; OD-B-06 frozen |
| **Acceptance** | B05-AC01…AC07 |
| **Security** | SB-B05-01, SB-B05-04, SB-B05-05 |
| **Exclusions** | New audit family; 04-D per-row audits; B-06 concurrency |

### B05-S2 — Secret-leakage / sensitive-key regression

| Field | Definition |
| ----- | ---------- |
| **Purpose** | Prove AC-B13 / SEC-B06 / ST-B26 / T-18 |
| **Inputs** | Sanitizer + emit payloads from S1 surfaces |
| **Outputs** | Negative secret/sensitive-key specs |
| **Dependencies** | B05-S1 surfaces identifiable |
| **Acceptance** | B05-AC08, B05-AC09 |
| **Security** | SB-B05-02, SB-B05-03 |
| **Exclusions** | Auth redesign; new fencing mechanism |

### B05-S3 — Cross-slice security regression walls

| Field | Definition |
| ----- | ---------- |
| **Purpose** | Smoke-verify closed B-02/B-03/B-04 security walls remain intact under B-05 delivery |
| **Inputs** | Closed lease / deny / boundary modules + existing specs |
| **Outputs** | Regression green run + wall checklist (no Vault/env/HTTP/alternate SoT) |
| **Dependencies** | B05-S1/S2; closed B-02…B-04 |
| **Acceptance** | B05-AC10…AC12 |
| **Security** | SB-B05-06…SB-B05-10 |
| **Exclusions** | Re-implementing B-02/B-03/B-04; B-06 multi-instance races |

```text
Governance/reporting-only is insufficient alone:
  Parent B-05 requires tests/specs for audit allowlist + deny audits.
```

---

## 13. Test / Verification Strategy

| ID | Scenario | Expected | Maps to |
| -- | -------- | -------- | ------- |
| V-01 | Catalog still registers `connection.migration-gate` | Present in classification + attribution | B05-AC03 |
| V-02 | Acquire success audits `gate_acquired` | Durable record | B05-AC01/AC06 |
| V-03 | Acquire deny / contention audits denied/timeout class | Durable record | B05-AC01/AC06 |
| V-04 | Release / reclaim audit outcomes | Durable record when path exercised | B05-AC01/AC06 |
| V-05 | store/replace/revoke/EXCHANGE create while ACTIVE/UNKNOWN | `lifecycle_mutation_blocked` + 409 | B05-AC02 |
| V-06 | Blocked audit workspace matches target | T-10 PASS | B05-AC04 |
| V-07 | Actor attribution present | OD-B-06 PASS | B05-AC05 |
| V-08 | Audit throw on deny path | Fail closed | B05-AC07 |
| V-09 | Payload with secrets / `fencingToken` | Rejected / absent | B05-AC08/AC09; T-18; ST-B26 |
| V-10 | B-02/B-03/B-04 existing suites remain green | No regression | B05-S3 |
| V-11 | UNKNOWN refuse/deny smoke | Fail closed | SB-B05-05 |
| V-12 | Stale fence / ownership smoke | Rejected | SB-B05-06 |
| V-13 | Diff walls: no Vault mutate / env UPDATE / public migration HTTP | Absent | B05-AC10/AC11 |

**Deferred to B-06:** multi-instance dual-client races, crash/TTL concurrency harness beyond unit CAS already accepted in B-02, RACE-05…RACE-10 class.

---

## 14. B-06 Dependency

```text
B-05 → does NOT depend on B-06
B-06 → depends on B-02…B-05 (parent planning §19)

B-05 must CLOSE (or at least complete its audit/security regression
obligations) before B-06 crash/concurrency verification starts.

B-05 does NOT plan or implement B-06.
```

---

## 15. Scope Exclusions

```text
EXCLUDED:
  - B-06 crash/concurrency implementation or planning
  - FIV-CONN-04-D privileged environment UPDATE / backfill
  - 04-D per-row backfill audit types
  - Vault mutation / credential business ops
  - FIV execution / FIV-PRE-01 closure
  - C7 activation / allowRealVenueIo=true
  - Live venue I/O / live credentials / capital movement
  - New parallel Security Audit system
  - Schema/migrations
  - Redesign of closed B-01…B-04 production logic
  - Silent closure/reassignment of D-B03-04 / D-B03-06 / D-B03-08
```

---

## 16. Risks

| ID | Risk | Mitigation |
| -- | ---- | ---------- |
| R-B05-01 | Scope creep into re-implementing B-02/B-03/B-04 | Explicit consume-only rule; Slice Approval walls |
| R-B05-02 | Treating B-05 as greenfield audit architecture | OD-B-06 reuse mandate; no parallel system |
| R-B05-03 | Expanding into B-06 concurrency | Hard deferral list |
| R-B05-04 | Inventing new ACs beyond AC-B12/AC-B13/OD-B-06 | Planning-local IDs mapped 1:1 to parent only |
| R-B05-05 | Closing residuals D-B03-04/06/08 by accident | Explicit preserve (§17) |
| R-B05-06 | Assuming implementation authorized by this package | Explicit NOT AUTHORIZED headers |

---

## 17. Residuals

Preserve unchanged (do **not** close or reassign):

| Residual | Meaning | B-05 disposition |
| -------- | ------- | ---------------- |
| **D-B03-04** | Vault orphan after mid-flight deny | **PRESERVED** |
| **D-B03-06** | S20 direct Prisma / ops-trust residual | **PRESERVED** |
| **D-B03-08** | observe → Vault → observe → mutate race | **PRESERVED** |

```text
NO SILENT CLOSURE OR REASSIGNMENT OF D-B03-04 / D-B03-06 / D-B03-08
```

---

## 18. Implementation Preconditions

Before any B-05 implementation may begin, **all** of the following are required:

1. B-05 Planning Review = **PASS** (or PASS WITH CONDITIONS resolved)
2. Decision Freeze for any open B-05 planning decisions (if Planning Review opens them)
3. B-05 Slice Approval = **GRANTED**
4. Implementation Planning Package + Implementation Planning Review (as governed for this slice)
5. Scope remains audit/security **regression** only — no 04-D / FIV / C7 / capital

```text
THIS PACKAGE DOES NOT GRANT:
  Slice Approval
  Implementation Authorization
  Implementation Planning Authorization beyond documenting preconditions
```

---

## 19. Governance Gates

```text
COMPLETED:
  Next-gate analysis → B-05 Slice Planning authorized to start
  THIS ARTIFACT = B-05 Planning Package

NEXT GATE:
  FIV-CONN-04-B-05 PLANNING REVIEW

THEN (required; do not skip):
  (Decision Freeze if needed)
  → B-05 Slice Approval
  → Implementation Planning / Review
  → Implementation
  → PO Review
  → Closure

DO NOT start B-05 implementation from this package.
DO NOT start B-06.
DO NOT start 04-D / FIV / C7 / live I/O / capital.
```

---

## 20. Explicit Statement

```text
No implementation performed.
```

```text
FIV-CONN-04-B-05 = PLANNING ONLY
B-05 IMPLEMENTATION = NOT AUTHORIZED
B-06 = NOT STARTED
04-D = NOT AUTHORIZED
FIV = NOT AUTHORIZED
C7 = DENY-ALL
allowRealVenueIo = FALSE
LIVE CAPITAL = NOT ACTIVATED
Protected leftovers = UNTOUCHED
```

**Capital / live boundary preserved:**

```text
B-05 does NOT authorize:
  FIV | C7 | live venue I/O | real capital | live credentials |
  04-D | environment UPDATE | Vault mutation
```

---

## Final State

```text
PLANNING VERDICT = READY FOR B-05 PLANNING REVIEW
NEXT GATE = FIV-CONN-04-B-05 PLANNING REVIEW
```

**END OF FIV-CONN-04-B-05 PLANNING PACKAGE**
