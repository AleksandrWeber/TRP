# V3-L02-S-UNK1 — Durable UNKNOWN / Pre-send / Reconciliation Persistence Evidence

**Document:** UNK1 implementation evidence  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02  
**Slice:** `L02-S-UNK1` only  
**Nature:** Implementation evidence for PO review. **Not** Slice Approval. **Not** live venue I/O. **Not** FIV.

```text
UNK1 implements durable UNKNOWN + pre-send + reconciliation metadata only.
Live adapters, SSRF, credentials, EG1/ENV1/ADP1/ISO1 remain unauthorized.
Slice Approval remains NOT GRANTED.
```

---

## 1. Scope

In scope:

- First-class `OrderStatus.UNKNOWN`
- Technical `SubmissionPhase` (`none` | `ready_to_transmit` | `transmitted` | `completed`) distinct from business status
- Additive `PaperOrder` columns + migration
- Domain APIs: pre-send, transmit, UNKNOWN, reconcile-with-evidence
- Engine: pre-send/transmit before adapter; ambiguity → UNKNOWN; no blind retry; reconcile evidence path
- Adapter port honesty types for `unknown` / `rejected` outcomes (Paper adapter unchanged happy path)
- Focused tests + this evidence

Out of scope:

- SB-01 SSRF, SB-04 live adapters, SB-06 creds, SB-07 full suite
- Real Binance/Bybit/OKX submit/cancel/reconcile network calls
- Blind retry workers
- Automatic fill → position/settlement from UNKNOWN

---

## 2. Repository Evidence

Canonical Orders BC (`PaperOrder` / `Order` aggregate) extended — **not** a parallel LiveOrder SoT.  
Mapped frozen business lifecycle to existing statuses:

| Business (frozen) | Repository mapping                  |
| ----------------- | ----------------------------------- |
| REQUESTED         | `proposed` / `risk_pending`         |
| ADMITTED          | `executable` (ready to send)        |
| SUBMITTED         | `submitted` +/or `submission_phase` |
| ACCEPTED          | `acknowledged`                      |
| REJECTED          | `rejected`                          |
| UNKNOWN           | `unknown`                           |
| FILLED            | `filled`                            |
| CANCELLED         | `cancelled`                         |

Human-start claim (HS1) remains distinct: claim ≠ submission.

---

## 3. Data Model

Migration: `20260917150000_v3_l02_s_unk1_unknown_order_state`

Additive columns on `paper_orders`:

- `submission_phase`, `ready_to_transmit_at`, `transmitted_at`, `completed_at`
- `reconciliation_required`, `unknown_entered_at`, `last_reconcile_at`, `reconcile_attempts`
- `venue_client_order_id`, `venue_order_id`, `human_start_proof_id`
- `last_reconcile_result`, `ambiguity_reason`

Existing uniques retained: `(workspaceId, clientOrderId)`, `(workspaceId, idempotencyKey)`, `(workspaceId, intentHash)`.

---

## 4. Lifecycle / State Machine

Legal UNKNOWN transitions:

- `executable | submitted | cancel_pending → unknown`
- `unknown → acknowledged | rejected | filled | cancelled | unknown`

Forbidden inferences: timeout/network ≠ rejected; no local record ≠ no venue order; UNKNOWN ≠ success without evidence.

---

## 5. Pre-send Semantics

| Case                    | Marker / state                         |
| ----------------------- | -------------------------------------- |
| A Logical order, no I/O | `submission_phase=none`                |
| B Pre-I/O boundary      | `ready_to_transmit` (status unchanged) |
| C May have transmitted  | `transmitted`                          |
| D Known response        | `completed` + known business status    |

Pre-send is **not** venue submission evidence.

---

## 6. UNKNOWN Semantics

UNKNOWN created for ambiguous outcomes after transmit (timeout, adapter error, persist failure after possible accept, crash-after-transmit retry).  
Not created for pre-I/O authz/S04/policy/KS/session failures.

---

## 7. Idempotency Persistence

Foundation unchanged and durable: workspace-scoped `clientOrderId` + `idempotencyKey`; `ord_sha256(workspaceId:clientOrderId)`.  
No blind retry after UNKNOWN.

---

## 8. Reconciliation Contract

```text
UNKNOWN → applyOrderReconciliation(evidence) →
  unresolved → UNKNOWN
  acknowledged → ACKNOWLEDGED
  rejected → REJECTED
  filled → FILLED (status/qty only; no auto position/settlement)
  cancelled → CANCELLED
```

Future live adapters supply evidence; UNK1 accepts simulated authoritative evidence only. Venue-specific query semantics remain ADP1.

---

## 9. Crash-Window Treatment

| Step                              | Behavior                                  |
| --------------------------------- | ----------------------------------------- |
| T0–T1 logical/admission           | Existing statuses                         |
| T2 human-start claim              | HS1; not submission                       |
| T3 pre-send                       | Durable `ready_to_transmit`               |
| T4 crash before transmit          | Still executable / ready; not UNKNOWN     |
| T5 crash after transmit           | `transmitted` → UNKNOWN on recovery/retry |
| T6 venue accept / local crash     | UNKNOWN until reconcile                   |
| T7 known response                 | Persist known status + `completed`        |
| T8 persist failure after response | Prefer UNKNOWN over inventing FILLED      |

PostgreSQL and venue I/O are **not** one distributed transaction.

---

## 10–12. Concurrency / Workspace / Paper

- Optimistic version CAS on `PaperOrder` prevents conflicting updates
- Workspace scoping on find/save and idempotency uniques
- PaperExecutionAdapter remains bound; US170 paper engine tests pass with pre-send markers
- `paperFreeze` / `liveCapitalAuthorized` anchors untouched

---

## 13. Tests

```bash
cd apps/api && pnpm exec vitest run \
  src/modules/orders/domain/order.spec.ts \
  src/modules/orders/domain/v3-l02-s-unk1-unknown.spec.ts \
  src/modules/execution-engine/v3-l02-s-unk1-engine.spec.ts \
  src/validation/m2/us170-execution-engine.integration.spec.ts
```

**Result:** 4 files, **22/22 passed**.

---

## 14. UNK1-01…16

| ID                                                      | Result           |
| ------------------------------------------------------- | ---------------- |
| UNK1-01 Durable UNKNOWN                                 | **PASS**         |
| UNK1-02 No silent convert                               | **PASS**         |
| UNK1-03 Ambiguous → UNKNOWN                             | **PASS**         |
| UNK1-04 Known reject → REJECTED                         | **PASS**         |
| UNK1-05 Pre-send durable                                | **PASS**         |
| UNK1-06 Metadata survives restart (snapshot/DB columns) | **PASS**         |
| UNK1-07 Workspace idempotency                           | **PASS**         |
| UNK1-08 Concurrent identity (uniques + version CAS)     | **PASS**         |
| UNK1-09 Reconcile only with evidence                    | **PASS**         |
| UNK1-10 Unresolved keeps UNKNOWN                        | **PASS**         |
| UNK1-11 No auto fill/position/settlement                | **PASS**         |
| UNK1-12 Paper unaffected                                | **PASS** (US170) |
| UNK1-13 No live venue I/O                               | **PASS**         |
| UNK1-14 No real capital                                 | **PASS**         |
| UNK1-15 No credentials provisioned                      | **PASS**         |
| UNK1-16 No blind retry                                  | **PASS**         |

---

## 15. Residual Dependencies

- ADP1 must return honest `unknown`/`rejected` and supply reconcile evidence from venue queries
- SB-01 egress before production HTTP
- Ledger/positions must not treat UNKNOWN as fill (documented; no auto path added)
- Engine live path still needs HS1 claim-before-I/O when live authorized

---

## 16. Explicit Statement

**No live venue I/O occurred.** Tests used fakes/mocks and PaperExecutionAdapter only. No production credentials. No FIV. No Slice Approval.
