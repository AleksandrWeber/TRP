# V3-L02 Security Conditions Resolution Plan (SB-01…SB-07)

**Document:** Security Conditions Resolution Plan — pre-implementation planning only
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02
**Nature:** Planning / governance only. **Not** implementation authorization. **Not** Slice Approval. **Not** live venue I/O. **Not** FIV. Does **not** rewrite Security Review verdict.
**Authority:** Senior Staff Engineer / Chief Architect under PO governance
**Security Review:** [`v3-l02-security-review.md`](./v3-l02-security-review.md) — `SECURITY PASS WITH CONDITIONS`
**Architecture Review:** [`v3-l02-architecture-review.md`](./v3-l02-architecture-review.md) — `ARCHITECTURE APPROVED WITH CONDITIONS`
**Repository baseline:** `eec47f0eefb8cc611b9841c69b9b8a114e9eaa53`

```text
This plan does NOT authorize coding, migrations, credentials, or live venue I/O.
SB-01…SB-07 remain PLANNED — NOT IMPLEMENTED.
Slice Approval remains NOT GRANTED.
V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
```

Protected dirty/untracked leftovers outside authorized artifacts were **not** modified.

---

## 1. Executive Summary

Security Review left seven blockers (SB-01…SB-07) that must be cleared before live I/O or Slice Approval. This document defines **what** to implement, **order**, **dependencies**, **acceptance criteria**, **evidence**, **tests**, and **PO gates** — without authorizing work.

**Recommended spine (justified in §11):**

```text
SB-05 (isolation evidence) ∥ early SB-07 scaffold
  → SB-02 (durable human-start claim)
  → SB-03 (UNKNOWN / pre-send / reconcile persistence)
  → SB-01 (SSRF/egress) + SB-06 (cred env separation) in parallel with adapter shell
  → SB-04 (live ExecutionAdapterPort) consuming SB-01/06
  → SB-07 (full cross-workspace live regression suite)
```

All live capital safety invariants remain frozen. C7 stays deny-all until a separate PO act.

---

## 2. Current Governance State

| Item                   | Status                        |
| ---------------------- | ----------------------------- |
| Architecture           | APPROVED WITH CONDITIONS      |
| Security               | PASS WITH CONDITIONS          |
| Slice Approval S01–S06 | **NOT GRANTED**               |
| Implementation         | **NOT AUTHORIZED**            |
| Live venue I/O         | **FORBIDDEN**                 |
| Real capital           | **FORBIDDEN**                 |
| FIV                    | **NOT PERFORMED**             |
| SB-01…SB-07            | **PLANNED — NOT IMPLEMENTED** |

---

## 3. Repository Evidence (Existing vs Missing)

| Capability                                               | Classification                    | Evidence                                                                       |
| -------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| Paper-only `ExecutionAdapterPort` / Engine               | **Existing runtime**              | `execution-adapter.port.ts`; `PaperExecutionAdapter`; engine rejects non-paper |
| C7 deny-all; `/v1/live/*` LiveCommand                    | **Existing runtime**              | `permission-matrix.ts`; `live-trading.controller.ts`                           |
| S04 fail-closed admission                                | **Existing runtime**              | `decide-live-admission.ts`; `LiveAdmissionService`                             |
| Human-start in-memory consume-on-evaluate                | **Existing runtime (interim)**    | `InMemoryHumanStartProofStore`; no ACTION/COMMAND                              |
| Durable human-start / claim-at-I/O                       | **Architecture design / missing** | AD-L02-04; PO-L02-05A…D                                                        |
| UNKNOWN order status / pre-send markers                  | **Existing runtime (UNK1)**       | `OrderStatus.UNKNOWN`; `submission_phase` on `PaperOrder`; engine pre-send     |
| Paper order uniques                                      | **Existing runtime**              | `PaperOrder` `@@unique` workspace+clientOrderId/idempotencyKey                 |
| Live ExecutionAdapterPort BINANCE/BYBIT/OKX              | **Missing**                       | Stubs throw in `exchange-adapter`; not bound to EXECUTION_ADAPTER              |
| SSRF helper for webhooks                                 | **Existing elsewhere**            | `validateOutboundSsrfTarget` in security-platform — **not** on exchange path   |
| Live venue egress allowlist (EG1)                        | **Existing runtime (EG1)**        | `execution-adapter/live-venue-egress`; Paper unbound; ADP1 must consume        |
| Binance handshake hardcoded origin + `redirect: 'error'` | **Existing runtime**              | connectivity BC only; ≠ live authz                                             |
| Vault opaque `vaultSecretId` + AAD + C8                  | **Existing runtime**              | Connections / Vault                                                            |
| Durable KS (no auto-cancel)                              | **Existing runtime**              | `KillSwitchPersistenceService`                                                 |
| EmergencyManager cancel-all                              | **Existing parallel**             | `live-trading-engine`; AppModule; C7-gated                                     |
| Test/live credential env separation for L02              | **Missing / unverified**          | No L02-enforced testnet↔mainnet binding control found                          |
| Cross-workspace live regression suite                    | **Missing**                       | Paper isolation tests exist; live suite not                                    |

---

## 4. SB-01 — SSRF / Egress Allowlist

### Objective

Prevent live trading adapters from becoming a generic SSRF / open egress primitive.

### Enforcement boundary

- **Where:** Inside live `ExecutionAdapterPort` HTTP client factory / outbound gate used **only** by live venue adapters (canonical Engine → Adapter). Not user HTTP APIs.
- **Who configures hosts:** **Trusted build-time / deployment constants** per venue (BINANCE/BYBIT/OKX). **Not** workspace/user Connection URL fields (Connections have no URL today — preserve that).

### Policy (plan)

| Control                     | Requirement                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Schemes                     | `https` only for live                                                                                                                  |
| Hosts                       | Explicit allowlist per venue (official API hosts only; no wildcards to arbitrary domains)                                              |
| Ports                       | Default 443 only unless venue officially requires otherwise — still allowlisted                                                        |
| Redirects                   | Fail closed (`redirect: 'error'` or equivalent); never follow off-allowlist                                                            |
| DNS                         | Resolve then re-validate final IP against private/loopback/link-local deny policy where applicable; document DNS pinning/rebind stance |
| Private/loopback/link-local | Deny for live venue egress                                                                                                             |
| User-controlled destination | **Forbidden**                                                                                                                          |
| Paper/Mock                  | Isolated; must not inherit live allowlist as a way to call real hosts; Mock stays in-process / non-production                          |

### Acceptance criteria

- Arbitrary URL cannot become live destination.
- Redirects cannot escape allowlist.
- Unsupported destination fails closed.
- Adapter cannot be used as generic outbound HTTP.
- Paper/Mock isolated from live endpoint policy.
- Tests use mocked allowlist enforcement — **no production venue calls** in this plan.

### Evidence required

- Arch: AD-L02-14 boundary confirmation.
- Sec: SD-L02-01 clearance tests + code review of outbound gate.
- Status: **EG1 IMPLEMENTATION-COMPLETE** — evidence: [`v3-l02-s-eg1-egress-security-implementation-evidence.md`](./v3-l02-s-eg1-egress-security-implementation-evidence.md). Live adapters not yet wired (ADP1 residual).

### PO gate

None if limited to PO-approved venues BINANCE/BYBIT/OKX with fixed hosts. **New PO** only if expanding venues or allowing user-configurable endpoints.

### Implementation authorization

**Granted for L02-S-EG1 only** (separate PO/task act). ADP1 live adapter coding remains unauthorized.

---

## 5. SB-02 — Durable Human-Start Claim-at-I/O + ACTION/COMMAND

### Objective

Realize PO-L02-05A…D / AD-L02-04: durable shared proofs; grain WORKSPACE+ACTOR+SESSION+ACTION/COMMAND; verify → S04 revalidate → atomic claim → irreversible I/O; claim ≠ submit.

### Persistence entity (plan)

Prisma table (pattern: KS / live-policy), Nest `HumanStartProofStore` durable impl replacing in-memory for L02-capable deployments.

### Schema fields (design — not migrated here)

| Field                                                      | Role                               |
| ---------------------------------------------------------- | ---------------------------------- |
| `id`                                                       | Proof id                           |
| `token_hash`                                               | Unique lookup                      |
| `workspace_id`, `actor_id`, `session_id`, `action_command` | Binding                            |
| `created_at`, `expires_at`                                 | TTL (retain 15m unless PO changes) |
| `claimed_at` nullable                                      | Atomic single-use                  |
| `claimed_logical_action_id` optional                       | Correlation                        |
| `schema_version`                                           | Evolution                          |

### Lifecycle

Issue → durable save → verify-only (admission) → S04 revalidate at I/O boundary → conditional UPDATE claim (`claimed_at IS NULL AND expires_at > now`) → venue I/O only if claim rowcount=1.

### Concurrency / multi-instance / restart

Shared DB + atomic claim. Restart: unclaimed until TTL; claimed remains claimed. Crash after claim before send: claim ≠ submit; new human-start for new attempt.

### Relationship to S04

S04 remains mandatory; human-start does not replace C7/policy/KS/session/creds/venue readiness. Refine evaluate to verify-without-claim (authorized by PO-L02-05B/D — **not** a new PO invention).

### Tests

Replay; concurrent claim; wrong actor/workspace/session/action; expired; restart; multi-instance; worker retry after claim.

### Status

**HS1 IMPLEMENTATION-COMPLETE** (durable persistence + ACTION/COMMAND + verify≠claim + atomic claim API). Evidence: [`v3-l02-s-hs1-human-start-implementation-evidence.md`](./v3-l02-s-hs1-human-start-implementation-evidence.md).

**Not** Slice Approval. Live Engine claim-before-I/O wiring and venue I/O remain unauthorized. SB-02 residual: integrate `claimHumanStartAfterS04Revalidation` at irreversible I/O boundary when ADP1 is separately authorized.

### PO gate

None for realizing frozen PO-L02-05A…D. **New PO** only if changing TTL, grain, or consume timing again.

### Implementation authorization

**Granted for L02-S-HS1 only** (separate PO/task act). Remaining SB-01/03/04/06/07 coding remains unauthorized.

---

## 6. SB-03 — UNKNOWN / Pre-send / Reconciliation Persistence

### Objective

Realize AD-L02-07/09/11: first-class UNKNOWN; pre-send marker; reconcile-before-retry; claim ≠ submit ≠ accept ≠ fill.

### Minimum persistence (extend canonical Orders / `PaperOrder` pattern)

| Concern             | Fields                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Identity            | existing `client_order_id`, `idempotency_key`, `id` uniques                                            |
| Status              | add `unknown`; keep `cancel_pending`                                                                   |
| Venue               | `venue_client_order_id`, `venue_order_id`                                                              |
| Crash               | `submission_phase` (`none` \| `ready_to_transmit` \| `transmitted` \| `completed`), attempt timestamps |
| UNKNOWN / reconcile | `reconciliation_required`, `unknown_entered_at`, `last_reconcile_at`, `reconcile_attempts`             |
| Human-start         | claim correlation id                                                                                   |

### Acceptance criteria

| Scenario                                        | Required outcome                                               |
| ----------------------------------------------- | -------------------------------------------------------------- |
| Crash before transmit (no transmitted marker)   | No false submission                                            |
| Crash after transmit / before response          | **UNKNOWN**                                                    |
| Crash after venue accept / before local persist | **UNKNOWN** until reconcile                                    |
| Retry after UNKNOWN                             | **No** blind submit; reconcile first                           |
| Reconcile                                       | Resolve to known state **or** remain UNKNOWN on venue evidence |

### Status

**UNK1 IMPLEMENTATION-COMPLETE** (durable UNKNOWN + pre-send + reconcile metadata/API). Evidence: [`v3-l02-s-unk1-unknown-implementation-evidence.md`](./v3-l02-s-unk1-unknown-implementation-evidence.md).

**Not** Slice Approval. Live adapter reconciliation network calls remain unauthorized (ADP1). Residual: wire venue query evidence when ADP1 is separately authorized.

### PO gate

None if faithful to frozen UNKNOWN/idempotency/cancel invariants. **New PO** if changing business lifecycle distinctions.

### Implementation authorization

**Granted for L02-S-UNK1 only** (separate PO/task act). Remaining SB-01/04/06/07 coding remains unauthorized.

---

## 7. SB-04 — Live ExecutionAdapterPort

### Objective

BINANCE / BYBIT / OKX live adapters on **canonical** `ExecutionEngineService` → `ExecutionAdapterPort` only. MOCK test-only. **No** second SoT / no `live-trading-engine` capital path.

### Per-venue responsibilities (plan)

| Concern                       | Requirement                                    |
| ----------------------------- | ---------------------------------------------- |
| Operations                    | submit, cancel, query/reconcile (minimum L02)  |
| Endpoints                     | Fixed allowlisted hosts (SB-01)                |
| Auth                          | Vault retrieve inside adapter; workspace-bound |
| clientOrderId                 | Stable map from platform identity (AD-L02-09)  |
| Errors / timeout / rate-limit | Honest mapping; ambiguity → UNKNOWN            |
| Environment                   | SB-06 binding (testnet≠mainnet)                |
| Handshake                     | Connectivity ≠ authorization / C7 / S04        |

### Tests

Contract tests with mocked HTTP; **no production venue calls** unless separately authorized. Fail-closed on allowlist miss, env mismatch, missing creds.

### Status

**ADP1 COMPLETE — implementation-complete for adapter realization (SB-04), with runtime live-I/O gated/blocked.**
Evidence: `docs/project/version-3/wave-6/v3-l02-s-adp1-live-execution-adapter-implementation-evidence.md`.
Live adapters bound via `RoutingExecutionAdapter`; ENV1+EG1+S04+HS1 consumed; `allowRealVenueIo=false`; C7 deny-all preserved. **Not** live trading activated. **Not** Slice Approval. **Not** FIV.

### PO gate

None within frozen venue scope. **New PO** for additional venues or live capital activation / C7 grants.

### Implementation authorization

ADP1 authorized and implemented for SB-04 adapter realization only; real venue I/O remains gated/blocked.

---

## 8. SB-05 — EmergencyManager Isolation

### Current reachability (repository)

| Path                   | Finding                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| S04 / durable KS       | Does **not** import or call `EmergencyManager`                                                          |
| `/v1/live/kill-switch` | `LiveTradingService` → `EmergencyManager.activateKillSwitch` (freeze + **cancel-all** + optional close) |
| AppModule              | Imports `LiveTradingEngineModule`                                                                       |
| Authz                  | Mutations require C7 (deny-all today)                                                                   |

### Required proof (without changing EM semantics unless Arch forces)

1. L02 capital path (canonical Orders/Engine/Adapter) has **zero** dependency on `EmergencyManager`.
2. L02 cancel is **order-specific** only.
3. KS ACTIVE / policy PAPER / session end → block **new** only; **no** auto cancel-all.
4. Regression tests: no import/call graph from live admission / future live engine path to EM; cancel-all not triggered by KS/policy/session transitions on durable path.
5. Document EM as **NON-SoT emergency prototype**; C7 remains deny-all until PO.

### If isolation impossible

Exact change (only if proven necessary): hard-fail composition wiring that prevents Engine/L02 modules from importing `live-trading-engine`, and/or feature-flag `/v1/live/kill-switch` unreachable — **without** altering PO “no auto cancel-all” rules. Prefer boundary tests first; **do not modify EmergencyManager behavior** in the first isolation slice unless Architecture documents necessity.

### Status

**PLANNED — NOT IMPLEMENTED** (isolation evidence/tests missing)

### PO gate

**New PO** only if changing EmergencyManager product semantics or enabling `/v1/live` KS as production SoT (forbidden by current freeze). Isolation itself needs **no** new PO.

---

## 9. SB-06 — Test / Live Credential Separation

### Objective

Fail closed on test↔live credential/endpoint confusion.

### Plan

| Control              | Requirement                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Environment identity | Explicit `trading_environment` / purpose on Vault secret metadata + adapter config (`test` \| `live`) |
| Venue binding        | Provider + environment must match allowlisted endpoint set (SB-01)                                    |
| Workspace binding    | Existing Vault AAD + membership retained                                                              |
| Validation           | Adapter refuse retrieve/use if env≠endpoint class                                                     |
| Logging              | Never log secrets; errors must not echo material                                                      |
| Selection            | Adapter factory cannot pair live host with test purpose (and reverse)                                 |

### Acceptance

- Test credentials cannot hit live endpoints accidentally.
- Live credentials cannot run on test-only execution paths.
- Mismatch fails closed.
- No secret exposure in logs/API.

### Status

**ENV1 COMPLETE — implementation-complete for credential/environment separation (SB-06).**
Evidence: `docs/project/version-3/wave-6/v3-l02-s-env1-credential-environment-implementation-evidence.md`.
Trusted Vault purposes: `trading`/`trading_live` (LIVE), `trading_testnet`, `trading_demo` (OKX). Binding integrates EG1; Paper/Mock deny trading secret retrieve/use. **Not** live-adapter security. **Not** Slice Approval. **Not** FIV.

### PO gate

May need **PO confirmation** only if introducing new environment labels beyond existing Vault purpose patterns — prefer reuse of existing Vault `type`/`purpose` without inventing new capital policy. Do **not** invent new venues.

### Implementation authorization

ENV1 authorized and implemented for SB-06 boundary only; no credential provisioning; no live venue I/O.

---

## 10. SB-07 — Cross-Workspace Live Regression Tests

### Suite scope (no production venue calls)

| Class             | Cases                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Workspace         | A cannot use B creds; submit/cancel/reconcile B orders; use B human-start; collide on B idempotency identity |
| Actor             | No membership ⇒ deny                                                                                         |
| Human-start       | Wrong actor/workspace/session/action fail closed                                                             |
| Idempotency       | Same keys in different workspaces do not collide                                                             |
| KS/policy/session | A state does not authorize/block B incorrectly                                                               |

Use fakes/mocks for venue I/O. Depends on SB-02/03/04 surfaces existing (or test doubles of their contracts).

### Status

**ISO1 COMPLETE — implementation-complete for cross-workspace / live-path isolation regression (SB-07).**
Evidence: `docs/project/version-3/wave-6/v3-l02-s-iso1-isolation-regression-implementation-evidence.md`.
Composes EM1/HS1/UNK1/EG1/ENV1/ADP1 boundaries; 96 focused ISO1 tests + L02 regressions green. **Not** live trading activated. **Not** Slice Approval. **Not** FIV. Runtime live I/O remains gated/blocked.

### PO gate

None for tests. Live production calls require separate authorization (not part of this suite).

### Implementation authorization

ISO1 authorized and implemented for SB-07 isolation regression only; no live venue I/O; no capital activation.
---

## 11. Dependency Graph

```text
                    ┌─────────────┐
                    │ SB-05       │  isolation evidence (can start early)
                    │ EM boundary │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐     ┌──────────┐      ┌──────────┐
   │ SB-02    │────▶│ SB-03    │─────▶│ SB-04    │
   │ Human-   │     │ UNKNOWN/ │      │ Live     │
   │ start    │     │ pre-send │      │ adapters │
   └──────────┘     └──────────┘      └────┬─────┘
         │                 │         ▲     │
         │                 │         │     │
         │           ┌─────┴────┐    │     │
         │           │ SB-01    │────┘     │
         │           │ SSRF     │          │
         │           └─────┬────┘          │
         │                 │               │
         │           ┌─────┴────┐          │
         │           │ SB-06    │──────────┘
         │           │ Cred env │
         │           └──────────┘
         │                 │
         └────────┬────────┘
                  ▼
            ┌──────────┐
            │ SB-07    │  full live isolation suite
            │ X-WS     │
            └──────────┘
```

### Justification (repository-backed)

| Edge                                   | Why                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| SB-02 before SB-03/04 I/O wiring       | PO sequence: claim before irreversible I/O; without durable claim, live I/O cannot be authorized |
| SB-03 before SB-04 production-path I/O | Pre-send + UNKNOWN required before real transmit ambiguity is survivable                         |
| SB-01 before/with SB-04                | Adapters must not ship without egress gate                                                       |
| SB-06 before/with SB-04                | Env mismatch fail-closed at adapter boundary                                                     |
| SB-05 early / parallel                 | EM already mounted; isolation proof does not need adapters                                       |
| SB-07 last (full)                      | Needs contracts from 02–04; scaffold tests can start earlier with fakes                          |

### Parallelizable

- SB-05 ∥ SB-02 design/schema prep ∥ SB-01 allowlist module (without live I/O) ∥ SB-06 metadata design ∥ SB-07 scaffold
- SB-01 ∥ SB-06 once adapter shell starts
- SB-07 expands as each SB lands

### Must complete before any live I/O authorization

**All of SB-01…SB-07** (Security Review). Plus C7/PO live-capital activation acts — separate from this plan.

---

## 12. Proposed Implementation Slices

| Slice ID       | Objective                                               | SBs   | Likely components                                                                | Deps                    | Sec risk           | Tests                                         | Arch review     | Sec verify      | PO     | Live I/O                                     |
| -------------- | ------------------------------------------------------- | ----- | -------------------------------------------------------------------------------- | ----------------------- | ------------------ | --------------------------------------------- | --------------- | --------------- | ------ | -------------------------------------------- |
| **L02-S-EM1**  | Prove/enforce EM non-reachability from L02 capital path | SB-05 | composition, import lint/tests, docs boundary                                    | None                    | Medium (confusion) | No EM on KS/policy/session; no Engine→EM      | Confirm NON-SoT | Yes             | No*    | **Forbidden**                                |
| **L02-S-HS1**  | Durable human-start + ACTION/COMMAND + claim-at-I/O API | SB-02 | Prisma HS table, store, LiveAdmission verify≠claim, Engine claim hook (no venue) | Impl auth               | High               | Replay/race/binding/restart                   | AD-L02-04       | SD-L02-04       | No     | **HS1 COMPLETE — PO review next**            |
| **L02-S-UNK1** | UNKNOWN status + pre-send + reconcile metadata          | SB-03 | Orders status/transitions, persistence fields, engine markers                    | HS1 helpful             | High               | Crash-window unit/integration w/ fake adapter | AD-L02-07/09/11 | SD-L02-05/06    | No     | **UNK1 COMPLETE — PO review next**           |
| **L02-S-EG1**  | Live egress allowlist gate                              | SB-01 | shared outbound validator for live adapters                                      | Impl auth               | High (SSRF)        | Allowlist/redirect/private-IP fails           | AD-L02-14       | SD-L02-01       | No†    | **EG1 COMPLETE — PO review next**            |
| **L02-S-ENV1** | Test/live credential↔endpoint binding                   | SB-06 | Vault metadata checks, adapter factory guards                                    | EG1 aligned             | High               | Mismatch fail-closed; no log leak             | AD-L02-14       | SD-L02-02       | Maybe‡ | **Forbidden**                                |
| **L02-S-ADP1** | Live adapters BINANCE/BYBIT/OKX on ExecutionAdapterPort | SB-04 | New live adapters; Nest binding behind flags; **still no production calls**      | HS1, UNK1, EG1, ENV1    | Critical           | Mocked HTTP contract tests                    | AD-L02-14       | SD-L02-01/02/06 | No§    | **Forbidden** until all SB + PO capital acts |
| **L02-S-ISO1** | Cross-workspace live regression suite                   | SB-07 | platform-conformance / api specs                                                 | ADP1 contracts or fakes | Medium             | Full matrix §10                               | —               | SD-L02-03       | No     | **ISO1 COMPLETE — PO review next**           |

\* Unless EM product change proposed → PO.
† Unless new hosts/venues → PO.
‡ Only if new env taxonomy beyond Vault purpose.
§ Venue scope already frozen; C7/live capital activation separate PO.

**No slice starts without separate Implementation Authorization.** This document is not that act.

### Parallel slices

`L02-S-EM1` ∥ early `L02-S-HS1` ∥ `L02-S-EG1` design ∥ `L02-S-ENV1` design ∥ `L02-S-ISO1` scaffold.

---

## 13. Acceptance Matrix

| SB    | Condition                                | Implementation Evidence                                  | Required Tests                                                      | Security Evidence   | Architecture Evidence | PO Gate                      | Status                                                            |
| ----- | ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- | ------------------- | --------------------- | ---------------------------- | ----------------------------------------------------------------- |
| SB-01 | SSRF/egress allowlist on live adapters   | Outbound gate + allowlisted hosts wired to live adapters | Arbitrary URL deny; redirect deny; private IP deny; paper isolation | SD-L02-01 close-out | AD-L02-14             | None†                        | **FINAL CLOSE-OUT PASS** (DNS pin residual → FIV)                 |
| SB-02 | Durable HS claim-at-I/O + ACTION/COMMAND | Prisma store; claim CAS; verify≠claim                    | Replay/race/binding/expiry/restart/multi-instance                   | SD-L02-04           | AD-L02-04             | None (frozen)                | **FINAL CLOSE-OUT PASS**                                          |
| SB-03 | UNKNOWN/pre-send/reconcile persistence   | Status+markers+reconcile fields; engine behavior         | Crash matrix; no blind retry                                        | SD-L02-05/06        | AD-L02-07/09/11       | None (frozen)                | **FINAL CLOSE-OUT PASS**                                          |
| SB-04 | Live ExecutionAdapterPort                | Live adapters bound to EXECUTION_ADAPTER under gates     | Mocked submit/cancel/query; fail-closed                             | SD-L02-01/02/06     | AD-L02-01/14          | None† / capital act separate | **FINAL CLOSE-OUT PASS** (runtime live-I/O gated/blocked)         |
| SB-05 | EmergencyManager isolation               | No L02 dependency; regressions                           | KS/policy/session no cancel-all; no Engine→EM                       | SD-L02-07           | AD-L02-01             | None*                        | **FINAL CLOSE-OUT PASS** (EM NON-SoT residual)                    |
| SB-06 | Test/live credential separation          | Env metadata + adapter checks                            | Mismatch fail-closed; no secret logs                                | SD-L02-02           | AD-L02-14             | Maybe‡                       | **FINAL CLOSE-OUT PASS**                                          |
| SB-07 | Cross-workspace live regressions         | Dedicated suite green                                    | Full isolation matrix                                               | SD-L02-03           | —                     | None                         | **FINAL CLOSE-OUT PASS**                                          |

---

## 14. Security Verification Plan

For each SB: design review → implementation review (when authorized) → automated tests in §4–10 → residual risk sign-off → update Security Review conditions status (**separate governance act**; do not auto-PASS).

Live production calls **out of scope** for verification unless separately authorized.

---

## 15. Architecture Verification Plan

Re-confirm AD-L02-01/04/07/09/11/14 conditions against each slice PR: canonical path only; claim≠submit; UNKNOWN honesty; NON-SoT EM; no parallel engine SoT.

---

## 16. PO Approval Boundaries

| Already frozen — do not reopen                        | New PO required only if…                       |
| ----------------------------------------------------- | ---------------------------------------------- |
| Venues BINANCE/BYBIT/OKX; MOCK test-only              | Adding venues / user-configurable URLs         |
| Capital = trading execution only                      | Banking/treasury/withdrawals                   |
| Lifecycle / UNKNOWN / cancel / idempotency invariants | Changing those semantics                       |
| C7 final gate; human-start grain + 05A–D              | Changing C7 grants, TTL, consume timing, grain |
| KS/policy/session: block new; no auto cancel-all      | Making EM cancel-all the L02 SoT               |
| Paper default; live capital not activated             | Live-capital activation / FIV / C7 role grants |

**This plan invents no new PO decisions.**

---

## 17. Explicit Pre-Live-I/O Gate

```text
Live venue I/O MAY NOT be authorized until ALL are true:
  1. SB-01…SB-07 acceptance criteria evidenced (not merely designed)
  2. Architecture CONDITIONS for touched ADs re-verified
  3. Security close-out of CONDITIONS (separate act)
  4. Explicit Implementation Authorization for each slice (done historically)
  5. Explicit PO acts for C7 grant / live-capital activation as required by ADR-020
  6. Slice Approval for the relevant L02 slices (NOT granted by this plan)
  7. Paper remains default; fail-closed preserved
```

---

## 18. Risks and Residual Risks

| Risk                                  | Residual                                                 |
| ------------------------------------- | -------------------------------------------------------- |
| Implementing adapters before SB-01/06 | SSRF / env confusion — **forbid by dependency graph**    |
| Claiming SB cleared by docs only      | Treat as NOT IMPLEMENTED until tests green               |
| EM remains mounted                    | Confusion hazard until SB-05 evidenced                   |
| Per-venue API gaps                    | Adapter Security dependency — do not invent capabilities |
| Worker/queue not yet defined          | Must still honor SB-02/03 invariants when introduced     |

---

## 19. Implementation NOT Authorized

```text
This Security Conditions Resolution Plan does NOT authorize:
  - application source changes
  - Prisma schema / migrations
  - human-start persistence implementation
  - live adapters / SSRF controls / reconciliation implementation
  - C7 / S04 / EmergencyManager behavioral changes
  - credential provisioning
  - Binance / Bybit / OKX contact
  - submit / cancel / capital movement
  - FIV
  - Slice Approval

Existence of this plan ≠ authorization to begin coding.
SB-01…SB-07 have separately authorized implementation evidence (EM1/HS1/UNK1/EG1/ENV1/ADP1/ISO1).
**Final Security Close-Out (2026-09-17):** `SECURITY PASS WITH CONDITIONS` — evidence:
[`v3-l02-final-security-closeout.md`](./v3-l02-final-security-closeout.md).
DNS/rebinding pin composition remains a **CONDITION** for FIV (not a current runtime bypass).
Slice Approval remains NOT GRANTED. FIV NOT PERFORMED. Runtime live-I/O remains gated/blocked.
```

---

## 20. Final Security Close-Out Status

```text
SECURITY PASS WITH CONDITIONS
Evidence: docs/project/version-3/wave-6/v3-l02-final-security-closeout.md
Architecture Re-Verification: PASS WITH CONDITIONS (aligned)
DNS/rebinding: CONDITION REMAINS (FIV prerequisite)
Slice Approval: NOT GRANTED
FIV: NOT PERFORMED
Live capital / venue I/O: NOT AUTHORIZED
```

Next governance action: **PO Review of Security Final Close-out**, then (separately) Slice Approval if supported.

**Slice Approval / Pre-FIV readiness package (reference only; does not change SB statuses):**
[`v3-l02-slice-approval-readiness.md`](./v3-l02-slice-approval-readiness.md).
Readiness status recorded there: `READY FOR PO SLICE APPROVAL` — package does **not** grant Slice Approval or authorize FIV.

**FIV Authorization & Execution Package (reference only; does not grant FIV Authorization):**
[`v3-l02-fiv-authorization-execution-package.md`](./v3-l02-fiv-authorization-execution-package.md).
Verdict: `READY FOR PO FIV AUTHORIZATION REVIEW` — does **not** authorize or execute FIV.

---

## STOP

**STOP.** Resolution plan recorded. Do not implement from this artifact.
Do not grant Slice Approval or perform FIV from this plan.
