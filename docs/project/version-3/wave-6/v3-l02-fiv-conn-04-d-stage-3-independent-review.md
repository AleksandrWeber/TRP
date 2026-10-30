# Independent Reviewer Report — FIV-CONN-04-D Stage 3

**Review class:** Independent Review (written)  
**Governing decision:** `D-CONN04-FULL-D-IA-S23-B-S3` (Stage 3 commence under Option B parent `D-CONN04-FULL-D-IA-S23-B`)  
**Review date:** 2026-10-30  
**Nature:** Review and documentation only. No implementation changes, no Decision Register mutation, no Stage 3 PO Authorization mutation, no Stage 4 authorization, no staging, commit, or push.

---

## Overall verdict

# **PASS WITH OBSERVATIONS**

The reviewed Stage 3 implementation satisfies its bounded authorization under `D-CONN04-FULL-D-IA-S23-B-S3` / Option B Stage 3 inventory (S3-01…S3-06; authority/CAS scaffolding only). Observations below are non-blocking for Stage 3 exit under that authorization.

**Meaning of this verdict:** Stage 3 may be considered for **separate Product Owner closure**. This report does **not**:

- close Stage 2 observations F-OBS-01…F-OBS-04;
- authorize Stage 4–8, Vault metadata port, `Connection.environment` UPDATE, Full-D backfill execution, FIV-CONN-04-E, production activation, or live-capital activity;
- itself constitute formal PO Stage 3 closure.

---

## 1. Review purpose and scope

Independently verify that Stage 3 implementation matches the approved commence act and Option B Stage 3 inventory, including mandatory exclusions, with correct attribution of pre-existing P-D-02 / Stage 2 / B-02 / B-04 material versus Stage 3 deltas.

**In scope:** S3-01…S3-06; T-S3-01…T-S3-08; mandatory exclusions; Nest export wall; repository attribution; focused test/static re-execution.

**Out of scope:** Stage 4+ implementation; PO closure act; Decision Register updates; remediation of Stage 2 observations; code or test changes.

---

## 2. Authoritative governance evidence and verified hashes

Recalculated against repository files during this review:

| Artifact                   | Path                                                                               | Expected SHA-256                                                   | Observed  | Verdict   |
| -------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------- | --------- |
| Stage 3 PO Authorization   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-3-po-authorization.md`   | `96e93480838b1da4e19b8cec32fb38294eff8a47f6a15e10b84a9de6d412af40` | identical | **MATCH** |
| Stage 2 Independent Review | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-2-independent-review.md` | `eb7f85f391063a6c91070915fbf777e5d13185e0b6db31ff7d219989adbfc98b` | identical | **MATCH** |
| Decision Register          | `docs/project/version-3/wave-6/wave-6-po-decision-register.md`                     | `ce4168a337785b3d4f0d78eb6d490a4420c181814efbc0f14906d7c4ef266e78` | identical | **MATCH** |

**Integrity / gate verdict:** **PASS.** No hash discrepancy. Authoritative governance evidence was **not** replaced or rewritten by this review.

**Also inspected (non-hashed navigation / context):**

| Source                                                                                           | Role                                                 |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Option B act `v3-l02-fiv-conn-04-d-implementation-authorization-option-b-po-decision.md`         | Parent Stage 3 inventory / prohibitions              |
| Scope matrix `v3-l02-fiv-conn-04-d-stage-2-3-authorization-scope-matrix.md`                      | S3-01…S3-06 / T-S3-*                                 |
| Stage 2 IR §9 F-OBS-01…F-OBS-04                                                                  | Open carry-forward observations                      |
| Engineering Stage 3 exit summary (session deliverable; **not** a persisted wave-6 markdown file) | Navigation aid only                                  |
| Stage 3 Clarification Report (session deliverable; **not** a persisted wave-6 markdown file)     | CAS / `txnRunSpy` / module attribution clarification |
| B-04 PO Review §6 Durable CAS Verification                                                       | Pre-existing `heartbeatAt = dbNow` contract          |

**Limitation:** No dedicated on-disk Engineering Exit Report or Clarification Report path exists under `docs/project/version-3/wave-6/`. Those session artifacts were used only as navigation; all findings below are independently re-verified against repository contents and live test execution.

---

## 3. Repository state and implementation attribution

| Field                                | Value                                      |
| ------------------------------------ | ------------------------------------------ |
| Branch                               | `main`                                     |
| HEAD                                 | `953292675e197d4f25778aaaa59eacb2826560fe` |
| Tracking                             | `main...origin/main`                       |
| Staged                               | **None**                                   |
| Commit / push by this review         | **None**                                   |
| Reviewer mutations to implementation | **None** (report file only)                |

### 3.1 Relevant working-tree status (Stage 3–adjacent)

| Path                                                             | Git state           | Attribution                                                                                                 |
| ---------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `fiv-conn-04-d-environment-backfill-write.ts`                    | `??` CREATE         | **Stage 3**                                                                                                 |
| `fiv-conn-04-d-environment-backfill-write.spec.ts`               | `??` CREATE         | **Stage 3**                                                                                                 |
| `fiv-conn-04-d-system-job-migration-entry.ts`                    | `??` (no HEAD blob) | **P-D-02** lease lifecycle + **Stage 3** write-authority DI / `proveWriteAuthority`                         |
| `fiv-conn-04-d-system-job-migration-entry.spec.ts`               | `??`                | Mixed P-D-02 + Stage 3 (`T-S3-*`)                                                                           |
| `fiv-conn-04-d-system-job-identity.ts` (+ spec)                  | `??`                | **P-D-02** REUSE; Stage 3 **NO CHANGE** expected / observed                                                 |
| `connections.module.ts`                                          | `M` vs HEAD         | Mixed: **P-D-02** export narrow + Entry provider; **Stage 2** audit helper; **Stage 3** write-unit provider |
| `connection-environment-backfill-audit.ts` (+ spec)              | `??`                | **Stage 2** (not Stage 3)                                                                                   |
| `conn04-migration-boundary.service.ts`                           | clean vs HEAD       | **B-04** REUSE                                                                                              |
| `prisma-migration-gate.adapter.ts` (`assertDurableAuthorityCas`) | clean vs HEAD       | **B-02** (`0b88aed`); unchanged by Stage 3                                                                  |
| Controllers / DTOs                                               | no Stage 3 diff     | No public ingress                                                                                           |

### 3.2 Attribution limitations (explicit)

1. **Untracked Entry / identity files have no recoverable pre-Stage-3 git parent.** Stage 3 deltas are identified by symbols (`FivConn04DEnvironmentBackfillWrite`, `PrismaTransactionService`, `proveWriteAuthority`, `T-S3-*`) plus Stage 2 IR inventory (Entry already existed as P-D-02). Entire untracked Entry content is **not** labeled Stage 3.
2. **`connections.module.ts` has a single dirty diff vs HEAD.** P-D-02 / Stage 2 / Stage 3 cannot be represented as three separate historical commits. Attribution uses HEAD blob + Stage 2 IR §7 separation table + Stage 3 write-unit inventory — **not** invented git parents.
3. Pre-existing dirty tree (security-audit Stage 2, wave-5/6 docs, etc.) was **preserved**; this review did not stage, reset, stash, or clean.

---

## 4. S3-01 through S3-06 review results

| ID        | Controlling requirement                                                                                                                                      | Independent finding                                                                                                                                                                                                                                                                 | Result                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **S3-01** | Entry: canonical SYSTEM_JOB internally; start/HB/release via B-04; write-authority proof via injected txn → write-unit; fail-closed; no public actor ingress | Lease methods construct actor via sole `buildFivConn04DSystemJobActor` then delegate to boundary. Stage 3 adds `proveWriteAuthority` → `transactions.run` → `writeUnit.assertWriteAuthorityInTransaction`; catch → `{ ok: false, reason: 'GATE_UNKNOWN' }`. No caller actor fields. | **PASS** (lease = P-D-02 REUSE; proof = Stage 3) |
| **S3-02** | REUSE canonical identity; no second constructor                                                                                                              | Single factory in `fiv-conn-04-d-system-job-identity.ts`; write-unit does not import/build identity; Entry is sole production caller of factory among Stage 3 paths.                                                                                                                | **PASS** (not Stage 3 code)                      |
| **S3-03** | REUSE B-04 boundary + durable CAS; preserve caller txn; fail-closed; no reclaim redesign                                                                     | `assertWriteAuthority` unchanged vs HEAD; forwards caller `transaction` to `assertDurableAuthorityCas`; deny/miss/throw map to fail-closed results. Adapter CAS identical to B-02 (`heartbeatAt: dbNow`). No Stage 3 boundary/adapter edits.                                        | **PASS** (REUSE)                                 |
| **S3-04** | Write-unit: boundary delegation; caller txn; no invent success; throws propagate; no env UPDATE / backfill / Vault / audit                                   | `assertWriteAuthorityInTransaction` returns boundary proof as-is; thin success `{ ok: true }` only when `proof.ok`. No Prisma connection updates, Vault, audit, or identity construction.                                                                                           | **PASS**                                         |
| **S3-05** | Tests T-S3-* for Entry/write-unit / export / exclusions                                                                                                      | Entry + write-unit specs cover T-S3-01…04 directly; T-S3-05/06 via identity REUSE + controller/source walls; T-S3-07/08 via regression suites (see §5).                                                                                                                             | **PASS** (see evidence matrix for strength)      |
| **S3-06** | Nest register write-unit if injected; keep Entry/write-unit/B-04/PORT/DURABLE internal; Preflight export intact                                              | Providers include write-unit + Entry; `exports: [FivConn04APreflightService]` only.                                                                                                                                                                                                 | **PASS**                                         |

**Explicit confirmation:** No material Stage 3 authorization violation remains unresolved after this review.

---

## 5. T-S3-01 through T-S3-08 evidence matrix

| ID          | Criterion                                           | Evidence class                                                            | Finding                                                                                                   | Result                   |
| ----------- | --------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------ |
| **T-S3-01** | Entry→B-04 start/HB/release with canonical actor    | **Direct unit** (Entry mock boundary)                                     | `T-S3-01` + prior P-D-02 actor tests assert `buildFivConn04DSystemJobActor()` equality on boundary calls  | **PASS**                 |
| **T-S3-02** | Authority/CAS miss fail-closed                      | **Direct unit** (write-unit mocks boundary; Entry mocks write-unit + txn) | Failures returned as `ok: false`; Entry maps txn throw → UNKNOWN; **not** live adapter CAS integration    | **PASS** (unit strength) |
| **T-S3-03** | No B-04/PORT/durable/write-unit export              | **Direct Nest metadata**                                                  | Export isolation describe; write-unit not exported; Preflight remains sole export                         | **PASS**                 |
| **T-S3-04** | No `Connection.environment` UPDATE in Stage 3 paths | **Code review + source-wall regex**                                       | Write-unit/Entry implementation inspection: no UPDATE; regex walls supplementary only                     | **PASS**                 |
| **T-S3-05** | No second SYSTEM_JOB constructor                    | **Code review + identity REUSE**                                          | Single factory; Stage 3 did not add alternate path                                                        | **PASS**                 |
| **T-S3-06** | No public HTTP/DTO/`PrivilegedActorContext` ingress | **Code review + controller source wall**                                  | Controller has no Entry/write-unit/`proveWriteAuthority` references; Entry signatures reject caller actor | **PASS**                 |
| **T-S3-07** | A Preflight regression green                        | **Indirect regression suite**                                             | Re-ran `fiv-conn-04-a-preflight.service.spec.ts` + classification; green                                  | **PASS** (regression)    |
| **T-S3-08** | P-D-02 lease / B-04 regression green                | **Indirect regression suite**                                             | Entry lease tests + `conn04-migration-boundary.service.spec.ts` + B-06 concurrency suites green           | **PASS** (regression)    |

**Test-strength notes (not blockers):**

- Stage 3 T-S3-02 does **not** exercise the Prisma durable CAS adapter end-to-end; that behavior remains covered by pre-existing B-04 boundary/adapter suites (REUSE under S3-03).
- Source-wall regex tests are **supplementary** to implementation inspection; regex absence is not itself proof of breach, nor sole proof of safety.

---

## 6. Scope-exclusion verification

Mandatory exclusions verified by implementation inspection (not solely by regex):

| #   | Prohibited item                                                                              | Finding                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `Connection.environment` UPDATE (incl. NULL→`live`)                                          | **Absent** in write-unit and Entry Stage 3 paths                                                                                |
| 2   | Operational Full-D backfill loop / orchestration                                             | **Absent** (`runEnvironmentBackfill` not present)                                                                               |
| 3   | Operational batch audit emission                                                             | **Absent** in Stage 3 write-unit/Entry (Stage 2 helper exists separately; unused by Stage 3)                                    |
| 4   | Vault metadata port implementation                                                           | **Absent**                                                                                                                      |
| 5   | Vault freshness checks / redesign                                                            | **Absent**                                                                                                                      |
| 6   | Lease reclaim redesign                                                                       | **Absent** (boundary/adapter clean vs HEAD)                                                                                     |
| 7   | Second SYSTEM_JOB identity constructor                                                       | **Absent**                                                                                                                      |
| 8   | Public HTTP/controller/DTO/`PrivilegedActorContext` ingress                                  | **Absent**                                                                                                                      |
| 9   | Stage 4–8 implementation                                                                     | **Absent**                                                                                                                      |
| 10  | FIV-CONN-04-E                                                                                | **Absent**                                                                                                                      |
| 11  | Production activation / live capital                                                         | **Absent**                                                                                                                      |
| 12  | New audit types / Prisma `actorKind` / outbox / shared sanitizer changes **as Stage 3 work** | Stage 3 paths introduce none; Stage 2 classification/attribution dirty tree remains Stage 2 attribution                         |
| 13  | Work outside S3-01…S3-06 inventory                                                           | Stage 3-attributed deltas confined to write-unit CREATE, Entry proof wiring, Entry/write-unit tests, write-unit module provider |

---

## 7. Test and static-analysis evidence (executed this review)

```text
npx vitest run
  fiv-conn-04-d-system-job-migration-entry.spec.ts
  fiv-conn-04-d-environment-backfill-write.spec.ts
  fiv-conn-04-d-system-job-identity.spec.ts
  conn04-migration-boundary.service.spec.ts
  fiv-conn-04-a-preflight.service.spec.ts
  fiv-conn-04-a-classification.spec.ts
→ PASS — 6 files, 79 tests

npx vitest run
  fiv-conn-04-a-preflight.service.spec.ts
  fiv-conn-04-a-classification.spec.ts
  fiv-conn-04-b-06-concurrency.spec.ts
  fiv-conn-04-b-06-boundary-concurrency.spec.ts
  live-admission-gate-ports.module.spec.ts
→ PASS — 5 files, 38 tests

npx tsc --noEmit -p apps/api/tsconfig.json → exit 0
npx eslint <Stage 3 Entry/write-unit/identity/module scoped files> → exit 0
```

No broad repository-wide formatters were run. No implementation files were modified to improve coverage.

---

## 8. Observations and correct attribution

### 8.1 Carry-forward Stage 2 observations (still open)

| ID           | Severity              | Status after Stage 3         | Notes                                                                                                                                                 |
| ------------ | --------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F-OBS-01** | OBSERVATION           | **OPEN**                     | Stage 3 did not remediate; not Stage 3 scope                                                                                                          |
| **F-OBS-02** | OBSERVATION           | **OPEN**                     | Unchanged                                                                                                                                             |
| **F-OBS-03** | OBSERVATION           | **OPEN**                     | Unchanged                                                                                                                                             |
| **F-OBS-04** | OBSERVATION (hygiene) | **OPEN; expanded dirty mix** | Module working-tree diff now mixes P-D-02 + Stage 2 + **Stage 3** write-unit registration. Still attribution hygiene only — not an export-wall breach |

### 8.2 Clarified pre-existing items (not Stage 3 defects)

| Topic                                           | Confirmed fact                                                          | Attribution                                                      | Reviewer implication                                |
| ----------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| Durable CAS `heartbeatAt: dbNow`                | Intentional match-prove update; no expiresAt / fence / ownership change | **Pre-existing B-02** (`0b88aed`); `git diff` empty vs HEAD      | Do not treat as Stage 3 mutation                    |
| Comment “Touch updatedAt only” vs `heartbeatAt` | Comment inaccurate                                                      | **Pre-existing B-02**; B-04 PO Review §6 documents `heartbeatAt` | Documentation mismatch only; not Stage 3            |
| Boundary `txnRunSpy.not.toHaveBeenCalled()`     | Spy never injected; vacuous                                             | **Pre-existing B-04**; Stage 3 did not change T10                | Meaningful proof remains caller-txn identity to CAS |

### 8.3 Stage 3 review observations

| ID            | Severity                    | Evidence                                                                                        | Impact                                                 | Action                                                                  |
| ------------- | --------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| **S3-OBS-01** | OBSERVATION (hygiene)       | Single dirty `connections.module.ts` diff conflates three stages                                | Reviewer attribution risk (extends F-OBS-04)           | Separate when committing; no Stage 3 remediation required for exit      |
| **S3-OBS-02** | OBSERVATION (test evidence) | Stage 3 T-S3-02 suites mock boundary/write-unit; durable CAS not re-proven E2E in Stage 3 specs | Coverage is unit + B-04 REUSE, not Stage 3 integration | Accept under S3-03 REUSE; optional later hardening outside Stage 3 exit |
| **S3-OBS-03** | OBSERVATION (test quality)  | Source-wall regex is supplementary                                                              | Cannot alone prove absence of prohibited behavior      | Accept; implementation inspection performed                             |

**BLOCKER / MAJOR / MINOR material Stage 3 findings:** **0**

---

## 9. Explicit unresolved items and limitations

1. Stage 2 **F-OBS-01…F-OBS-04** remain **open**; Stage 3 IR does not close them.
2. Untracked Entry/identity lack git parents — Stage 3 line attribution is symbol/IR-based.
3. Engineering Exit / Clarification reports were session-only; not persisted as wave-6 hashes.
4. Formal **PO Stage 3 closure** and any **Stage 4 authorization** require separate Product Owner acts — **not** this report.
5. Stages 4–8 / env UPDATE / Vault port / Full-D execution / E / production / live capital remain **NOT AUTHORIZED**.

---

## 10. Final Independent Review verdict

| Field                                                       | Value                                       |
| ----------------------------------------------------------- | ------------------------------------------- |
| **Overall verdict**                                         | **`PASS WITH OBSERVATIONS`**                |
| **BLOCKER**                                                 | **0**                                       |
| **MAJOR**                                                   | **0**                                       |
| **MINOR**                                                   | **0**                                       |
| **OBSERVATIONS (Stage 3)**                                  | **3** — S3-OBS-01, S3-OBS-02, S3-OBS-03     |
| **Carry-forward Stage 2 observations**                      | F-OBS-01…F-OBS-04 still **OPEN**            |
| **Stage 3 authorization satisfaction**                      | **YES** — bounded S3-01…S3-06 inventory met |
| **Eligible for separate PO Stage 3 closure consideration?** | **YES**                                     |
| **Stage 4 authorized by this report?**                      | **NO**                                      |
| **Formal PO Stage 3 closure recorded by this report?**      | **NO**                                      |

**Rationale:** Authorized Stage 3 work is present (write-unit CREATE; Entry proof wiring; tests; Nest internal registration) while B-04/identity/lease semantics are correctly reused. Export wall remains Preflight-only. Mandatory exclusions hold under implementation inspection. Focused tests and static checks executed in this review are green. Remaining items are non-blocking observations and open Stage 2 carry-forwards.

---

## 11. Governance boundary statement (explicit)

| Statement                                    | Binding                           |
| -------------------------------------------- | --------------------------------- |
| This artifact class                          | Independent Review deliverable    |
| Product Owner Stage 3 closure                | **Requires separate PO decision** |
| Stage 4 commencement                         | **NOT authorized** by this report |
| Stage 3 PO Authorization / Decision Register | **Not modified** by this review   |
| Stage 2 observation status                   | **Unchanged** (remain open)       |

---

_End of Independent Reviewer Report — FIV-CONN-04-D Stage 3 / `D-CONN04-FULL-D-IA-S23-B-S3`._
