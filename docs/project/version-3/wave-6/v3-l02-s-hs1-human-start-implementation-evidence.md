# V3-L02-S-HS1 — Durable Human-start Authorization Implementation Evidence

**Document:** HS1 implementation evidence  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02  
**Slice:** `L02-S-HS1` only  
**Nature:** Implementation evidence for PO review. **Not** Slice Approval. **Not** live venue I/O. **Not** FIV.

```text
HS1 implements durable human-start persistence + atomic claim only.
Venue I/O, UNK1, EG1, ENV1, ADP1, ISO1 remain unauthorized.
Slice Approval remains NOT GRANTED.
```

---

## 1. Implementation Scope

In scope:

- Prisma `HumanStartProof` table + migration
- Domain: ACTION/COMMAND binding, verify-without-claim, atomic claim
- `PrismaHumanStartProofStore` (durable shared) bound in `LiveAdmissionModule`
- `LiveAdmissionService.claimHumanStartAfterS04Revalidation` (S04 → claim)
- Focused HS1 tests (Cases A–I + ordering)

Out of scope (explicitly not implemented):

- SB-01 SSRF / live egress
- SB-03 UNKNOWN persistence
- SB-04 live adapters
- SB-06 credential separation
- SB-07 cross-workspace live suite
- Live submit/cancel/reconcile
- Venue `clientOrderId` / live order persistence
- FIV / real capital / production credentials

---

## 2. Persistence Design Implemented

| Field | Role |
| ----- | ---- |
| `id` | Proof identity |
| `token_hash` | SHA-256 of presented token (plaintext never stored) |
| `workspace_id`, `actor_id`, `session_id`, `action_command` | Binding grain (PO-L02-05) |
| `created_at`, `expires_at` | TTL (default 15m) |
| `claimed_at` | Atomic single-use claim timestamp (null until claimed) |
| `claimed_logical_action_id` | Optional correlation |
| `schema_version`, `updated_at` | Evolution / audit |

Table: `human_start_proofs`  
Store: `PrismaHumanStartProofStore` replaces in-memory as Nest default for production composition.  
In-memory store retained for unit tests / harnesses.

---

## 3. Schema / Migration

- Schema: `apps/api/prisma/schema.prisma` — model `HumanStartProof`
- Migration: `apps/api/prisma/migrations/20260917140000_v3_l02_s_hs1_human_start_proof/migration.sql`

No unrelated models modified.

---

## 4. Claim Semantics

```text
verify human-start (no claim)
→ authorization / admission checks (S04 evaluate)
→ S04 revalidation (evaluate again at claim boundary)
→ atomic claim (conditional UPDATE)
→ [later slice] irreversible venue I/O
```

API:

- `evaluate` / `evaluateForL02Contract` — **verify only** (does not claim)
- `claimHumanStartAfterS04Revalidation` — S04 revalidate then atomic claim
- `claim ≠ submit ≠ accept ≠ fill`

Atomic claim predicate:

```text
claimed_at IS NULL
AND expires_at > now
AND workspace/actor/session/action_command match
```

Losing concurrent claimers fail closed (`replayed`).

---

## 5. Concurrency Behavior

| Case | Expected | Covered by |
| ---- | -------- | ---------- |
| A Two concurrent claims | Exactly one success | `v3-l02-s-hs1-human-start.spec.ts` |
| B Two API instances / shared store | One claim only | Shared durable map + two `PrismaHumanStartProofStore` |
| C Worker retry | No second claim | Same |
| D Process restart | Claimed remains claimed | Snapshot/restore |
| E–H Wrong action/actor/workspace/session | DENY | Same |
| I Expired | DENY | Same |

DB-level: `updateMany` with conditional `WHERE` (same pattern as password-reset consume).

---

## 6. Crash / Restart Behavior

| Scenario | Behavior |
| -------- | -------- |
| Crash before claim | Proof remains claimable if still valid + bindings match |
| Crash after claim, before venue I/O | Proof consumed; **no** fake SUBMITTED/ACCEPTED/FILLED |
| Restart after claim | Claimed state survives durable store; replay fails |

---

## 7. Security Behavior

- Cross-workspace / actor / session / action: fail closed
- Replay after claim: fail closed (same actor, other process, other instance, after restart)
- Expiry: fail closed
- Concurrent race: single winner
- Logging: token plaintext never persisted; hash-only storage; no raw token logging added

---

## 8. S04 Integration Boundary

- S04 semantics unchanged (policy, KS, C7 deny-all, session, Gate)
- Evaluate path switched from consume-on-evaluate → verify-without-claim (PO-L02-05B/D)
- Engine venue I/O hook **documented** as `claimHumanStartAfterS04Revalidation` immediately before irreversible I/O — **not** wired to live adapters (ADP1 unauthorized)

---

## 9. Tests

Commands:

```bash
cd apps/api && pnpm exec vitest run src/modules/trading-session/live-admission
```

Result (this evidence run): **4 files, 70 tests, all passed**.

---

## 10. Acceptance Criteria (HS1-01…HS1-16)

| ID | Result |
| -- | ------ |
| HS1-01 Durable persistence | **PASS** |
| HS1-02 Shared across instances | **PASS** (shared DB store + multi-instance test) |
| HS1-03 Workspace binding | **PASS** |
| HS1-04 Actor binding | **PASS** |
| HS1-05 Session binding | **PASS** |
| HS1-06 ACTION/COMMAND binding | **PASS** |
| HS1-07 Expiration | **PASS** |
| HS1-08 Atomic race-safe claim | **PASS** |
| HS1-09 No replay after claim | **PASS** |
| HS1-10 Claim survives restart | **PASS** |
| HS1-11 Worker retry no second claim | **PASS** |
| HS1-12 S04 mandatory before claim | **PASS** (`claimHumanStartAfterS04Revalidation`) |
| HS1-13 Claim ≠ venue submission | **PASS** |
| HS1-14 No raw proof/secret logged | **PASS** (design; no token logging added) |
| HS1-15 No live venue I/O | **PASS** |
| HS1-16 No real capital | **PASS** |

---

## 11. SB-02 Status

**HS1 implementation-complete for durable human-start + claim API.**

SB-02 is **not** declared fully closed for Slice Approval: Engine live path still must call `claimHumanStartAfterS04Revalidation` immediately before venue I/O when ADP1 is authorized. Residual: claim hook exists; live I/O wiring remains forbidden.

---

## 12. Residual Conditions / Risks

- Live Engine must integrate claim-before-I/O (later slice)
- SB-01, SB-03, SB-04, SB-06, SB-07 remain **NOT IMPLEMENTED**
- In-memory store mutex is test/harness only; production relies on Postgres conditional update
- Migration must be applied in each environment before production use of durable proofs

---

## 13. Governance Stop

Next step: **PO Review of HS1 implementation evidence**.  
Do not proceed to UNK1 / EG1 / ENV1 / ADP1 / ISO1 without separate authorization.
