# V3-L02 Security Review

**Document:** Formal Security Review — V3-L02 Live Order I/O Safety Boundary
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02
**Authority:** Senior Staff Engineer / Chief Architect performing Security Review under PO governance
**Nature:** Security Review only. **Not** Slice Approval. **Not** implementation authorization. **Not** live-capital activation. **Not** FIV. **Not** Architecture rewrite of PO decisions.
**Repository baseline:** `fbd7fc3ac6dfe278ab191538605f1a53536a8d5a`
**Architecture package:** [`v3-l02-architecture-review.md`](./v3-l02-architecture-review.md) — `ARCHITECTURE APPROVED WITH CONDITIONS`
**ADR:** [`docs/adr/ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)

```text
SECURITY REVIEW ONLY.
Do NOT treat planned controls as implemented.
Do NOT grant Slice Approval.
Do NOT authorize implementation or live venue I/O.
V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
S01–S06 remain NOT GRANTED.
```

Protected dirty/untracked leftovers outside authorized artifacts were **not** modified.

---

## 1. Review Scope

Security review of the complete V3-L02 design and repository evidence for:

1. Live venue endpoint security
2. SSRF / outbound egress
3. Credential isolation / Vault
4. Workspace isolation
5. Actor authorization / C7
6. Human-start
7. S04 immediate revalidation
8. Replay protection
9. Idempotency / duplicate prevention
10. UNKNOWN integrity
11. Reconciliation trust
12. Cancel safety
13. Kill Switch / policy / session
14. EmergencyManager isolation
15. Live adapter boundary
16. Multi-instance / concurrency
17. Crash / restart
18. Logging / secret exposure
19. Fail-closed behavior
20. Accidental Paper → Live risks

Authoritative scope: ADR-020 + V3-L02 PO freezes + Architecture Review (AD-L02-01/04/07/09/11/14).

---

## 2. Repository / Design Evidence Reviewed

### Governance / design (Architecture-approved, largely not implemented)

| Artifact | Role |
| -------- | ---- |
| ADR-020 | Live-capital ADR; live capital still not activated |
| PO Block A / Block B freezes | Venues, capital, lifecycle, cancel, UNKNOWN, C7 cell, KS/policy/session |
| Human-start freeze PO-L02-05A…05D | Durable claim-at-I/O model |
| Architecture Review | AD-L02-04/07/09/11/14 AWC designs |

### Runtime evidence (today)

| Area | Evidence path | What exists |
| ---- | ------------- | ----------- |
| C7 deny-all | `permission-matrix.ts`; `live-trading.controller.ts` `@RequirePermission(LiveCommand)` | LiveCommand never granted |
| Paper-only engine | `execution-engine.service.ts`; `execution-adapter.module.ts` | Rejects non-paper; PaperExecutionAdapter only |
| V2 anchors | `v2-certification-checklist.ts`; `decide-live-admission.ts` | `liveCapitalAuthorized: false`; paper freeze deny |
| S04 admission | `live-admission.service.ts`; `decide-live-admission.ts` | Fail-closed cell; C7 evaluated |
| Human-start | `human-start-proof.ts`; `in-memory-human-start-proof.store.ts` | In-memory; consume-on-evaluate; actor/workspace/session only |
| Durable KS | `KillSwitchPersistenceService`; S04 load path | Admission SoT; no halt/cancel |
| EmergencyManager | `live-trading-engine/emergency-manager.ts`; AppModule import | Parallel cancel-all; C7-gated `/v1/live/kill-switch` |
| Vault / connections | `vault-access-control.ts`; `secret-envelope.ts`; `ConnectionRecord` | Opaque `vaultSecretId`; AAD workspace binding; C8 |
| Binance handshake | `binance-handshake.adapter.ts`; `exchange-handshake.http.ts` | Hardcoded `https://api.binance.com`; `redirect: 'error'` |
| SSRF helper | `security-platform` webhook guards | **Not** wired into exchange-connectivity / exchange-adapter |
| Order isolation | `PaperOrder` uniques; orders controllers | workspace-scoped lookups + membership |
| Venue submit stubs | `venue.adapters.ts` | Submit/cancel throw (US210) |

---

## 3. SD-L02-01 — SSRF / Egress

### Verdict

**PASS WITH CONDITIONS**

### Analysis

| Question | Finding |
| -------- | ------- |
| Venue URLs user-controlled today? | **No** via `ConnectionRecord` (no URL field). Binance handshake origin is **hardcoded**. |
| Workspace arbitrary URLs? | **Not** via current connection metadata. |
| Allowlist on exchange path? | **MISSING** — webhook SSRF helper is **not** wired into exchange-connectivity / future live adapters. |
| Redirect escape? | Handshake HTTP uses `redirect: 'error'` — **EXISTING** for handshake path. |
| DNS rebinding / private IP? | **MISSING** on exchange path. |
| Live ExecutionAdapterPort egress? | **MISSING** — no live adapter yet; must not become generic SSRF primitive. |

### Conditions / blockers before live I/O

1. Live adapters MUST use fixed/allowlisted venue origins (BINANCE/BYBIT/OKX only); no user-supplied host/scheme/port.
2. Enforce SSRF controls equivalent to (or stronger than) webhook guards: allowlist, no open redirects, block link-local/loopback/private where applicable, document DNS policy.
3. Adapter selection MUST NOT accept untrusted arbitrary venue routing input.

**Design vs implementation:** Design requirement is clear; **operational SSRF enforcement for live I/O does not exist** → CONDITION (blocks live I/O authorization).

---

## 4. SD-L02-02 — Credential Security

### Verdict

**PASS WITH CONDITIONS**

### Analysis

| Topic | Finding |
| ----- | ------- |
| Workspace ownership | Vault access requires membership + C8; ciphertext AAD binds `workspaceId:type:purpose` |
| Opaque id | Connections store `vaultSecretId` only |
| Cross-workspace | Isolation errors on foreign access patterns |
| Logging | Handshake audit/specs exclude apiKey/secret; HTTP body not logged |
| API return of secrets | Handshake path documented not to return plaintext to Connection Management |
| Venue binding | Provider→Vault type map exists for BINANCE/BYBIT/OKX |
| Live adapter retrieve | **NOT IMPLEMENTED** — must retrieve inside adapter boundary only (Arch AC-08) |
| Test vs live credential confusion | **CONDITION** — environment separation must be enforced before live I/O |

### Conditions

1. Live adapters: credentials only inside adapter from Vault; never on order rows, logs, UI, or API responses.
2. Explicit test/live credential environment separation verified before live I/O.
3. Credential validity checks must not echo secret material in errors.

---

## 5. SD-L02-03 — Authorization / C7 / S04

### Verdict

**PASS WITH CONDITIONS**

### Analysis

Frozen cell components are **designed** as conjunctive (no single gate replaces another). Runtime today:

| Gate | Runtime |
| ---- | ------- |
| C7 | Fail-closed deny-all in matrix; evaluated in S04; `/v1/live/*` requires LiveCommand |
| S04 | Mandatory fail-closed evaluator; L02 contract requires I/O revalidation |
| Human-start | Required for ALLOW; JWT alone insufficient |
| Policy / KS / session | Required in `decideLiveAdmission` |
| RoleAdmin ≠ live | Admin matrix does **not** grant C7 |

No new auth framework introduced.

### Missing edges (CONDITIONS)

1. Full cell + claim-at-I/O + venue readiness not wired on canonical live path (path absent).
2. C7 must remain deny-all until explicit PO grant act.
3. S04-aligned gate order is acceptable provided all elements remain mandatory and non-bypassable.

---

## 6. SD-L02-04 — Human-Start Replay / Race

### Verdict

**PASS WITH CONDITIONS**

### Analysis

| Property | Design (PO/Arch) | Runtime today |
| -------- | ---------------- | ------------- |
| Durable shared store | Required | **MISSING** (in-memory Map) |
| Claim after S04, before I/O | Required | **MISSING** (consume-on-evaluate) |
| ACTION/COMMAND binding | Required | **MISSING** |
| Atomic multi-instance claim | Required | **MISSING** |
| claim ≠ submit | Required | Design-only |
| Replay / wrong binding fail-closed | Required | Local in-memory only |

Design is security-sound **if implemented as specified**. Current runtime **cannot** guarantee multi-instance/restart/claim-at-I/O properties.

### Conditions (must be true before live I/O)

1. Implement durable atomic claim per AD-L02-04 / PO-L02-05A–D.
2. Verify-only vs claim split; no burn on early evaluate.
3. ACTION/COMMAND binding enforced.
4. Claim success MUST NOT manufacture venue success/UNKNOWN coercion.

---

## 7. SD-L02-05 — Idempotency / Duplicate Orders

### Verdict

**PASS WITH CONDITIONS**

### Analysis

| Control | Status |
| ------- | ------ |
| Workspace-scoped `clientOrderId` / `idempotencyKey` uniques | **EXISTING** on `paper_orders` |
| `orderId = ord_sha256(workspaceId:clientOrderId)` | **EXISTING** pattern |
| Cross-workspace collision via key reuse | Mitigated by workspace scope **if** all lookups enforce `workspaceId` + membership |
| Live pre-send / UNKNOWN / venue client id | **MISSING** (Arch design AWC) |
| Idempotency ≠ venue execution proof | Design invariant — must hold in implementation |

### Conditions

1. Live path must retain workspace-scoped uniques + membership on every mutate/reconcile.
2. UNKNOWN → reconcile-before-mutate (no blind retry) must be enforced in code.
3. Malicious reuse of another workspace’s key must fail workspace membership / row lookup (verify in tests before live I/O).

---

## 8. SD-L02-06 — UNKNOWN / Reconciliation

### Verdict

**PASS WITH CONDITIONS**

### Analysis

Architecture forbids silent coercion of UNKNOWN → success/reject/cancel; requires venue-authoritative reconcile; forbids blind retry.

| Control | Status |
| ------- | ------ |
| First-class `OrderStatus.unknown` | **MISSING** runtime |
| Ambiguity matrix | **Design only** |
| Reconcile on Engine → adapter query | Paper hook exists; live query **MISSING** |
| Workspace-scoped reconcile | Design + paper patterns; live must enforce |
| Per-venue query semantics | **Dependency** — do not invent; confirm at adapter boundary |
| Redirect reconcile to arbitrary venue | Must be prevented by allowlisted adapter routing (ties SD-L02-01) |

### Conditions

1. Implement UNKNOWN without coercion.
2. Reconcile identity bound to workspace + durable clientOrderId / venue order id.
3. Client-supplied venue ids must not redirect trust across workspaces/venues.
4. Per-venue capabilities documented as adapter Security dependency.

---

## 9. SD-L02-07 — Cancel / KS / Policy / Session / EmergencyManager

### Verdict

**PASS WITH CONDITIONS**

### Analysis

| Rule | Design | Runtime |
| ---- | ------ | ------- |
| KS ACTIVE blocks new | S04 durable KS | **EXISTING** admission deny |
| Policy PAPER blocks new | S04 | **EXISTING** |
| Session ineligible blocks new | S04 | **EXISTING** |
| No auto cancel-all on KS/policy/session | PO frozen | Durable KS does **not** cancel |
| EmergencyManager cancel-all | Must not be L02 SoT | **Mounted** in AppModule; C7-gated `/v1/live/kill-switch` |
| Canonical path reaches EmergencyManager? | Must not | **No** import from live-admission / durable KS |

### Residual risk

Dual KS implementations create **confusion / future wiring risk**. Today EmergencyManager is unreachable without C7, but remains a **SECURITY CONDITION**: L02 must never invoke it; C7 must stay deny-all until PO; prefer hard-isolating EmergencyManager from L02 capital path before live I/O.

---

## 10. Threat Matrix

| Threat | Attack / Failure | Existing Control | Residual Risk | Verdict |
| ------ | ---------------- | ---------------- | ------------- | ------- |
| SSRF | Adapter fetches attacker URL | Hardcoded Binance handshake; no URL on Connection | Live adapters without allowlist | **Condition** |
| Arbitrary venue endpoint | User sets base URL | No URL field today | Future config mistake | **Condition** |
| Credential leakage | Logs/API/errors | Vault opaque id; audit hygiene | Live adapter logging regressions | **Condition** |
| Cross-workspace credential | A reads B secret | Membership + C8 + AAD | Live adapter must re-check workspace | **Condition** |
| Authorization bypass | Skip cell gates | S04 conjunctive deny; C7 deny-all | Live path not wired yet | **Condition** |
| C7 bypass | Non-C7 live mutate | Matrix + RequirePermission on `/v1/live` | Future role grant without PO | **Condition** |
| Human-start replay | Reuse token | Local consume | Multi-instance / no durable claim | **Condition** |
| Human-start race | Double claim | Local Map only | Need atomic durable claim | **Condition** |
| Duplicate order | Double submit | Paper uniques | Live UNKNOWN/pre-send missing | **Condition** |
| Lost response | Assume fail/success | Design UNKNOWN | Not implemented | **Condition** |
| UNKNOWN manipulation | Coerce to fill | Design forbids | Not implemented | **Condition** |
| Blind retry | Resubmit on timeout | Design forbids | Not implemented | **Condition** |
| Stale reconciliation | Wrong venue/order | Design workspace binding | Adapter query missing | **Condition** |
| Cancel-all escalation | Broad cancel | Durable KS no cancel | EmergencyManager exists | **Condition** |
| EmergencyManager invocation | L02 calls cancel-all | Not on S04 path; C7 gate | Mounted module hazard | **Condition** |
| Paper→Live accidental | Mode flip | Engine/adapter paper-only; V2 anchors | Live unlock without all gates | **Condition** |
| Environment confusion | Test keys in live | Partial provider maps | Explicit env separation needed | **Condition** |
| Worker retry | Redelivery | Design idempotency | Live markers missing | **Condition** |
| Multi-instance race | Split brain human-start | None durable | Durable claim required | **Condition** |
| Process restart | Lost proof / lost outcome | V2/paper locks | Durable HS + UNKNOWN markers | **Condition** |
| Malicious clientOrderId reuse | Cross-tenant | Workspace unique + membership | Must hold on live APIs | **Condition** |

---

## 11. Financial Safety Invariants

| # | Invariant | Enforceable by current design? | Runtime today |
| - | --------- | ------------------------------ | ------------- |
| 1 | Paper default | Yes | Yes |
| 2 | Live policy explicit opt-in | Yes | Yes (S04) |
| 3 | Real capital forbidden unless all gates pass | Yes (design) | Yes via V2+C7+paper engine |
| 4 | Human-start mandatory | Yes (design) | S04 yes; claim-at-I/O missing |
| 5 | S04 revalidation before irreversible I/O | Yes (design) | Contract flag; live I/O absent |
| 6 | C7 fail-closed | Yes | Yes |
| 7 | KS blocks new live | Yes | Admission yes |
| 8 | Policy PAPER blocks new | Yes | Yes |
| 9 | Ineligible session blocks new | Yes | Yes |
| 10 | UNKNOWN first-class | Yes (design) | **Not** in OrderStatus |
| 11 | No blind retry | Yes (design) | Not on live path |
| 12 | No automatic cancel-all | Yes if EmergencyManager excluded | Durable KS OK; EM residual |
| 13 | Claim ≠ submission | Yes (design) | N/A runtime live |
| 14 | Submission ≠ acceptance | Yes (design) | N/A |
| 15 | Acceptance ≠ fill | Yes (design) | Paper path distinguishes |
| 16 | Venue authoritative for venue outcomes | Yes (design) | Live reconcile missing |

**Not fully enforceable at runtime until CONDITIONS implemented:** 4 (claim timing), 5 (live I/O), 10–12 (UNKNOWN/EM), 13–16 on live path.

---

## 12. Workspace Isolation Review

| Asset | Workspace-scoped today? | Live-path requirement |
| ----- | ----------------------- | --------------------- |
| Human-start | Yes (fields); store not shared durable | Durable + binding checks |
| Paper orders | Yes uniques + repo `workspaceId` | Same for live orders |
| Credentials | Yes Vault AAD + membership | Adapter retrieve with workspace |
| KS / policy / session | Yes workspace-scoped durable | Unchanged |
| Reconciliation | Paper engine workspace args | Must reject cross-workspace ids |

**Identified cross-workspace path today for live capital?** No live capital path exists. Residual: any future API that accepts orderId/clientOrderId/vaultSecretId **without** workspace membership + scoped lookup is a **blocker**.

---

## 13. Human-Start Security Review

See SD-L02-04. Design approved with conditions; runtime interim is **not** final and is **insufficient** for multi-instance live I/O.

---

## 14. UNKNOWN / Idempotency / Reconciliation Security Review

See SD-L02-05 / SD-L02-06. Designs are consistent with financial-safety invariants; **not implemented**. Per-venue reconcile APIs remain dependencies.

---

## 15. Kill Switch / Policy / Session / Cancel Review

See SD-L02-07. Durable KS aligns with PO. **EmergencyManager** is the primary residual cancel-all hazard (C7-gated, non-canonical, must stay non-SoT / unreachable for L02).

---

## 16. Live Adapter Security Review

| Requirement | Status |
| ----------- | ------ |
| Behind `ExecutionAdapterPort` | Design yes; runtime paper-only |
| Allowlisted routing | Required; not on live path yet |
| Venue-scoped credentials | Vault pattern exists; live retrieve missing |
| Handshake ≠ authorization | **EXISTING** (connectivity ≠ C7/S04) |
| Fail-closed errors | Required for live |
| No fall-through to wrong venue | Required |
| `live-trading-engine` NON-SoT | Arch condition; module still mounted |

**Security design reviewed** ≠ **security control operationally implemented**.

---

## 17. Design vs Implementation Distinction

### Already evidenced (runtime)

- C7 deny-all; paper-only ExecutionEngine/adapter
- V2 `liveCapitalAuthorized=false` / paper freeze
- S04 fail-closed admission (policy/KS/session/authz/human-start/Gate)
- Durable workspace KS (no auto-cancel)
- Vault opaque ids + AAD + membership/C8
- Hardcoded Binance handshake origin; redirect error
- Workspace-scoped paper order uniques
- Handshake audit hygiene

### Architecture-approved but not implemented

- Durable human-start + claim-at-I/O + ACTION/COMMAND
- `OrderStatus.unknown` + ambiguity persistence
- Live idempotency markers / pre-send phase
- Live reconcile path
- Live `ExecutionAdapterPort` for BINANCE/BYBIT/OKX
- SSRF allowlist on live venue egress
- Explicit EmergencyManager isolation from L02

### Security dependencies before live I/O / Slice Approval

All CONDITIONS and SB-01…SB-07 below. Planned work is **not** an implemented control.

---

## 18. Security Blockers (for live I/O authorization)

These **block live venue I/O and Slice Approval**, not the act of recording this review:

| ID | Blocker |
| -- | ------- |
| SB-01 | No SSRF/egress allowlist enforcement on future live adapter path |
| SB-02 | Human-start durable claim-at-I/O + ACTION/COMMAND not implemented |
| SB-03 | UNKNOWN / pre-send / reconcile live persistence not implemented |
| SB-04 | Live ExecutionAdapterPort not implemented (unlocking requires full cell) |
| SB-05 | EmergencyManager cancel-all residual reachability/confusion hazard |
| SB-06 | Test vs live credential environment separation not verified for L02 |
| SB-07 | Security regression tests for cross-workspace live mutate/reconcile/credential paths not established |

**Resolution plan (planning only — does not authorize implementation):**
[`v3-l02-security-conditions-resolution-plan.md`](./v3-l02-security-conditions-resolution-plan.md)

SB-01…SB-07 remain **PLANNED — NOT IMPLEMENTED**. This Security Review verdict is unchanged: **SECURITY PASS WITH CONDITIONS**.

---

## 19. Conditions Required Before Slice Approval

1. Security blockers SB-01…SB-07 addressed or explicitly PO-accepted with compensating controls.
2. Implement AD-L02-04/07/09/11/14 conditions under separate implementation authorization (not this act).
3. C7 remains deny-all until explicit PO activation act.
4. Demonstrate fail-closed integration tests for: missing claim, KS active, policy PAPER, UNKNOWN no blind retry, workspace mismatch.
5. Confirm live adapters cannot be driven by untrusted URLs and cannot invoke EmergencyManager.
6. Separate Planning/Slice Approval governance act — **not granted here**.

---

## 20. SD Verdict Summary

| ID | Topic | Verdict |
| -- | ----- | ------- |
| **SD-L02-01** | SSRF / egress | **PASS WITH CONDITIONS** |
| **SD-L02-02** | Credentials / Vault | **PASS WITH CONDITIONS** |
| **SD-L02-03** | Authz / C7 / S04 | **PASS WITH CONDITIONS** |
| **SD-L02-04** | Human-start replay/race | **PASS WITH CONDITIONS** |
| **SD-L02-05** | Idempotency / duplicates | **PASS WITH CONDITIONS** |
| **SD-L02-06** | UNKNOWN / reconciliation | **PASS WITH CONDITIONS** |
| **SD-L02-07** | Cancel / KS / policy / session / EM | **PASS WITH CONDITIONS** |

---

## 21. Overall Security Verdict

```text
SECURITY PASS WITH CONDITIONS
```

### Meaning

- The **proposed V3-L02 architecture and frozen PO decisions** do not, by design, require a security-forbidden bypass of C7, S04, UNKNOWN honesty, or workspace isolation.
- **Current runtime** is fail-closed against live capital (paper engine, C7 deny-all, V2 anchors).
- **Live I/O is NOT authorized.** Critical controls for safe live I/O are **designed but not implemented**; they are CONDITIONS / blockers for Slice Approval and live venue I/O.
- This is **not** unconditional `SECURITY PASS`.
- This is **not** Slice Approval.
- This does **not** authorize implementation.

---

## 22. Implementation Boundary

```text
This Security Review does NOT authorize:
  - application code changes
  - migrations
  - SSRF middleware implementation
  - live adapters
  - human-start / UNKNOWN / idempotency implementation
  - C7 activation
  - S04 / EmergencyManager changes
  - credential provisioning
  - live venue I/O / submit / cancel
  - real capital movement
  - FIV
  - Slice Approval

V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
S01–S06 remain NOT GRANTED.
Live capital remains NOT ACTIVATED.
```

---

## STOP

**STOP.** Security Review recorded.

Do not implement from this artifact.
Do not grant Slice Approval.
Clear CONDITIONS / SB-01…SB-07 before any live I/O authorization.
