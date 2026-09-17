# V3-L02 Human-Start Decision Options

**Document:** PO Decision Support — Human-Start Durability / Consumption Model (PO-L02-05)
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02
**Nature:** Governance decision-options only. **Not** PO freeze. **Not** Architecture re-approval. **Not** Security PASS. **Not** implementation. **Not** Slice Approval. **Not** S04 modification.
**Authority:** Senior Staff Engineer / Chief Architect under Product Owner governance (neutral options)
**Repository baseline:** `0b65dbf7405a6277919965748928fd2f92751dd4`
**Architecture Review:** [`v3-l02-architecture-review.md`](./v3-l02-architecture-review.md) — AD-L02-04 **BLOCKED**
**Block B freeze:** [`v3-l02-po-block-b-decision-freeze.md`](./v3-l02-po-block-b-decision-freeze.md)

```text
HUMAN-START GOVERNANCE DECISION SUPPORT ONLY.
Do NOT implement. Do NOT modify human-start / S04.
Do NOT select a winner. Do NOT rank options.
AD-L02-04 remains BLOCKED pending PO decision.
V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
```

Protected dirty/untracked leftovers outside this artifact were **not** modified.

---

## 1. Executive Summary

Architecture Review **AD-L02-04** is **BLOCKED** because the frozen human-start **business grain** is decided, but the **durability and consumption timing** needed for L02 (especially mandatory S04 revalidation immediately before irreversible venue I/O, multi-instance, restart, and crash safety) are not.

This document presents **neutral, repository-backed options** for the Product Owner. It does **not** answer the PO question and does **not** change S04.

**Primary PO question:** What durability and consumption model should satisfy the already-frozen human-start contract while preserving single-use, replay resistance, full binding grain (including ACTION/COMMAND), freshness, S04 revalidation, and multi-instance / restart / concurrency / crash safety?

**Critical distinction (binding for all options):**

| Concept | Must not be confused with |
| ------- | ------------------------- |
| **AUTHORIZATION PROOF** (human-start) | JWT, policy, C7, Gate |
| **EXECUTION RESULT** (local path outcome) | Human-start validity or consumption |
| **VENUE OUTCOME** (venue-authoritative) | Human-start validity or consumption |

Human-start validity ≠ order submitted/accepted.
Human-start consumption ≠ venue I/O succeeded.

---

## 2. Current S04 / Human-Start Behavior (Repository Facts)

Evidence paths:

| Concern | Path |
| ------- | ---- |
| Issue / verify / consume | `apps/api/src/modules/trading-session/live-admission/domain/human-start-proof.ts` |
| In-memory store | `.../in-memory-human-start-proof.store.ts` |
| Nest binding | `.../live-admission.module.ts` → `InMemoryHumanStartProofStore` |
| Service orchestration | `.../live-admission.service.ts` |
| Admission decision | `.../domain/decide-live-admission.ts` |
| L02 revalidation reminder | `.../domain/live-admission-l02-contract.ts` (`l02MustRevalidateBeforeVenueIo: true`) |

### Factual behavior

| Topic | Current behavior |
| ----- | ---------------- |
| **Created where** | `LiveAdmissionService.issueHumanStart` → `issueHumanStartProof` → `store.save` |
| **Stored where** | Process-local `Map` (`InMemoryHumanStartProofStore`); Nest provides that class |
| **TTL / freshness** | `HUMAN_START_PROOF_TTL_MS = 15 * 60 * 1000` (15 minutes); expiry checked at verify |
| **Bound fields today** | `actorId`, `workspaceId`, `sessionId` only — **no ACTION/COMMAND field in record** |
| **Token** | Random 32-byte token; store keeps SHA-256 hash only |
| **Consumed when** | On `LiveAdmissionService.evaluate` via `verifyAndConsumeHumanStartProof` → `consumeIfActive` |
| **Consumed how** | Single-use: sets `consumedAt`; second attempt → `replayed` |
| **Atomicity** | Process-local check-then-set on Maps; **not** durable DB transaction; **not** cross-instance |
| **Validation where** | Inside evaluate path before `decideLiveAdmission`; fail-closed reason codes |
| **S04 revalidation for L02** | Contract flag requires revalidation before irreversible venue I/O; **L02 I/O not implemented**; second `evaluate` would re-consume / see replayed |
| **Workers** | No production worker currently drives live venue I/O with human-start; paper execution path does not use human-start |
| **Multi-instance** | API may run multiple instances; human-start store is **per process** → proofs not shared |
| **Restart** | Store emptied on process restart → issued proofs become unfindable (`invalid` / effective loss) |
| **Survives restart?** | **No** |
| **Concurrent evaluate** | Same process: `consumeIfActive` serializes in event-loop turns but has TOCTOU between find and consume; cross-instance: **no coordination** |

### What is **not** present

- Durable human-start table / repository implementation bound in Nest
- ACTION/COMMAND binding on issue/verify
- Verify-without-consume API
- Consume-at-I/O hook on ExecutionEngine
- Cross-instance locking for proofs

### Related lease machinery (Option D justification only)

Trading Session already has **runtime / recovery lease** concepts (`session-lease`, `runtime-lease`, recovery lease acquisition). These are **session fencing / recovery**, not human-start proofs. They are cited only as existing repository patterns if PO considers a lease-like human-start model — **not** as an already-selected human-start design.

---

## 3. Frozen PO Contract

Already **PO-FROZEN** (Block B / PO-L02-05 grain):

1. Explicit human initiation
2. Binding: **WORKSPACE + ACTOR + SESSION + ACTION/COMMAND**
3. Not transferable
4. Not a generic workspace authorization token
5. Not permanent execution authorization
6. Fresh
7. Single-use
8. Replay-resistant
9. JWT ≠ human-start
10. `LIVE_POLICY_OPTED_IN` ≠ human-start
11. Authorization PASS ≠ human-start
12. Human-start does not replace C7
13. Human-start does not replace S04 revalidation

**Unresolved by PO:** durability substrate and **when** single-use consumption occurs relative to admission evaluate vs irreversible venue I/O.

---

## 4. Architecture Blocker AD-L02-04

| Item | Status |
| ---- | ------ |
| AD-L02-04 | **BLOCKED / REQUIRES PO DECISION** |
| Why | In-memory unsafe for multi-instance; consume-on-evaluate vs mandatory I/O revalidation; ACTION/COMMAND must be preserved; durability/consumption unresolved |
| Arch escalation (not approval) | “preserve single-use + I/O revalidation + ACTION/COMMAND; authorize durable/consume-at-I/O or equivalent” |

**Consume-at-I/O is one option under investigation — not pre-approved.**

Until PO freezes durability/consumption answers and Architecture re-reviews: **AD-L02-04 remains BLOCKED**.

---

## 5. Threat / Failure Scenarios (All Options)

Scenarios that every option must be judged against (detailed per-option notes in §§6–9; condensed matrix in §10):

1. Single instance, normal request
2. Multiple application instances
3. Process restart after human-start creation
4. Worker retry
5. Two concurrent consumers
6. Same actor / workspace / session / action
7. Same actor / workspace / different session
8. Same actor / different workspace
9. Different actor / same workspace
10. Replay after successful consumption
11. Expires before evaluation
12. Expires between evaluation and venue I/O
13. KS ACTIVE after human-start, before venue I/O
14. Policy disable after human-start, before venue I/O
15. Session end after human-start, before venue I/O
16. C7 PASS → DENY after human-start
17. Crash after validation, before venue I/O
18. Crash immediately after venue I/O
19. Network retry after previous evaluation
20. Duplicate request concurrent

For each scenario, evaluate: security / authorization / replay / duplicate execution / financial risk; whether proof remains valid; whether S04 must revalidate; whether consumption is safe; whether Architecture / Security Review still required.

**Universal rules under all options (frozen):**

- Scenarios 13–16: S04 revalidation before irreversible I/O **must** fail-closed if KS/policy/session/C7 no longer allow — independent of human-start model.
- Scenario 18: venue outcome may be **UNKNOWN**; human-start consumption must **not** be treated as venue success (I9/I10).
- Scenario 7–9, 14 grain mismatches: fail closed (I14).

---

## 6. Option A — Current In-Memory / Consume-on-Evaluate

### Description

Keep today’s model: process-local Map store; issue binds actor/workspace/session; `evaluate` verifies and **consumes**; TTL 15m; replay → deny.

### Repository compatibility

**Matches** current Nest binding and S04 code paths. Does **not** store ACTION/COMMAND today (gap vs frozen grain — any retained Option A still needs grain completion as a separate binding decision; durability model alone does not add ACTION/COMMAND).

### Evaluation vs required properties

| Property | Assessment |
| -------- | ---------- |
| Single instance normal | Locally works for S04 admission tests |
| Multi-instance | **Fails** — proof not visible / not atomically shared |
| Restart | **Fails** — proof lost; may deny (fail-closed) or confuse operators; lost record must not become bypass (I11) — loss tends to deny, not bypass, but also blocks legitimate retry without re-issue |
| Concurrency | Weak within process; unsafe across instances |
| Worker retry | Re-evaluate after consume → `replayed` / missing — blocks I/O revalidation using same proof |
| Crash after evaluate, before I/O | Proof **consumed**; I/O may never occur; revalidation cannot reuse proof |
| Replay after consume | Denied locally if store intact |
| S04 I/O revalidation | **Conflicts** with single-use consume-on-evaluate unless a second proof is issued (undermines single-use intent) or consume timing changes |

### Does not change PO-frozen grain contract if ACTION/COMMAND added later — but **as-is** incomplete on ACTION/COMMAND.

### Not approved merely because it exists.

---

## 7. Option B — Durable Single-Use / Consume-on-Evaluate

### Description

Same **consumption timing** as today (consume during admission `evaluate`), but persist proofs in durable shared storage with atomic `consumeIfActive` (e.g. conditional update where `consumedAt IS NULL` and not expired), including ACTION/COMMAND columns on issue/verify.

### Repository compatibility

Compatible with existing `HumanStartProofStore` interface (`save` / `findByTokenHash` / `consumeIfActive`) — a durable implementation could replace in-memory Nest binding **without** inventing a new proof API shape. **Would change** persistence substrate (not authorized by this document).

### Analysis

| Concern | Notes |
| ------- | ----- |
| Persistent storage | Required; shared across instances |
| Atomic consumption | Required (DB/ conditional write) |
| TTL | Retain freshness check at consume/evaluate |
| Binding | Must include ACTION/COMMAND |
| Multi-instance | Improved vs A if store shared + atomic |
| Restart | Proof survives |
| Worker retry / I/O revalidation | **Still broken for same proof:** first evaluate consumes; mandatory second evaluate before I/O sees `replayed` |
| Race prevention | Atomic consume helps concurrent evaluates |
| Crash window | Crash after evaluate still burns proof before I/O |

### S04 compatibility

Preserves consume-on-evaluate semantics of closed S04. Does **not** by itself solve PO-L02-04 item 10 (I/O-time revalidation with same single-use proof).

### Financial / security

Reduces multi-instance replay/duplication of **admission** consumption races vs A. Does **not** alone prevent duplicate **venue** execution (needs AD-L02-09/11). Risk: operators re-issue proofs to “get past” burned evaluate → weakens human-start as scarce authorization proof if issue is cheap.

---

## 8. Option C — Durable Single-Use / Consume-at-or-Immediately-Before Irreversible I/O

### Description

Proof remains **unconsumed** through admission evaluate and required S04 revalidation checks (verify-valid / soft-check), and is **atomically consumed at the final controlled boundary immediately before irreversible venue I/O** (or as the last gate in that critical section). Durable shared store; ACTION/COMMAND bound.

### Ordering (illustrative — not implementation)

```text
T0 issue → T1 durable persist
→ T2 admission evaluate (verify freshness/binding; do NOT consume — or consume only a non-I/O admission stamp if PO splits — see risks)
→ … other work …
→ T3 S04 revalidation (KS/policy/session/C7/human-start freshness/binding)
→ T4 atomic consume
→ T5 venue request starts
```

**Important:** “Consume-at-I/O” is **not** automatically safe. Exact race/crash implications below.

### Race / crash implications

| Window | Risk |
| ------ | ---- |
| Two instances pass revalidation, both attempt consume | Only one atomic consume must win; loser fail-closed — **required** |
| Consume succeeds, crash before send | Proof burned; no venue I/O — fail-closed for that proof; may require new human-start; must not invent venue success |
| Consume succeeds, send starts, response lost | Venue may have accepted → **UNKNOWN**; consumption ≠ success; reconcile before retry (I9/I10); idempotency separate (AD-L02-09) |
| Revalidation PASS, consume fails (already consumed) | Fail-closed — good |
| Verify-without-consume during evaluate allows many evaluates | Must still enforce single venue attempt via consume-at-I/O + execution idempotency; otherwise “many ALLOW” ≠ many submits but increases probing surface |

### S04 relationship

Requires refining **consumption timing** relative to closed S04 `verifyAndConsume` on evaluate. That is a **PO-authorized model change**, not a silent code tweak in this task. Admission evaluate would need a non-consuming verify (or equivalent) while preserving fail-closed semantics.

### Multi-instance / restart

Durable store required. Restart after issue: proof remains until TTL/consume. Restart after consume: remains consumed.

---

## 9. Option D — Durable Lease / Reservation (Repository-Justified)

### Why included

Repository already has **session/runtime/recovery lease** patterns for fencing and recovery in Trading Session. Planning materials also discussed session-scoped start with separate I/O revalidation of a non-consumed lease. This is **not** inventing a greenfield subsystem name for completeness; it is adapting an **existing architectural pattern family** to human-start scarcity.

### Description (conceptual)

Human-start issues a **durable, bound reservation/lease** for WORKSPACE+ACTOR+SESSION+ACTION/COMMAND with TTL. Admission/revalidation checks lease active + binding. **Consumption** = lease release / mark-used at I/O boundary (or exclusive claim). Optional short renewal only if PO allows (default analysis assumes **no** open-ended renewal to preserve freshness).

### Analysis

| Concern | Notes |
| ------- | ----- |
| Lease semantics | Exclusive claim for one irreversible I/O attempt (or one command) |
| Expiration | Fail-closed when expired (I3/I13) |
| Renewal | If allowed, Security must review staleness/extension abuse; if disallowed, simpler freshness |
| Concurrency | Lease acquire must be atomic across instances |
| Crash recovery | Active lease after crash before I/O: may expire or require explicit reclaim rules — must not become bypass (I11) |
| Replay | Used/released lease cannot authorize again |
| Multi-instance | Requires shared durable lease store |

### Risks vs Option C

Similar crash-after-claim-before-send problem. Additional complexity: lease vs proof token mental model; risk of conflating **session runtime lease** with **human-start lease** (must remain distinct — session lease does not replace human-start).

### S04 compatibility

Larger departure from password-reset-style single token consume-on-evaluate. Requires clear PO acceptance that human-start is lease-shaped while retaining frozen grain and single-use meaning (“one successful exclusive claim for the bound action”).

---

## 10. Option Comparison

**No ranking. No scores. No winner.**

| Dimension | A In-memory consume-on-evaluate | B Durable consume-on-evaluate | C Durable consume-at-I/O | D Durable lease/reservation |
| --------- | ------------------------------- | ----------------------------- | ------------------------ | --------------------------- |
| Description | Current S04 substrate | Persist + same consume timing | Persist + consume at I/O boundary | Persist exclusive claim/lease |
| Repository compatibility | Exact current | Fits `HumanStartProofStore` port | Needs verify≠consume split | Fits lease pattern family; new human-start semantics |
| S04 compatibility | Exact | Timing exact; store changes | Timing change vs closed S04 | Larger semantic shift |
| Single-use | Local yes | Durable yes for evaluate | Yes at I/O claim | Yes at exclusive claim |
| Freshness | TTL yes | TTL yes | TTL + revalidation time | TTL / lease expiry |
| Replay resistance | Local | Cross-instance if atomic | Cross-instance if atomic | Cross-instance if atomic |
| Multi-instance safety | **No** | Admission yes; I/O revalidate gap remains | Intended yes with atomic consume | Intended yes with atomic acquire |
| Restart safety | **No** | Yes for store | Yes for store | Yes for store |
| Concurrency safety | Weak | Stronger at evaluate | Stronger at I/O consume | Stronger at lease acquire |
| Worker retry | Burned after evaluate | Same burn problem | Depends on whether consume occurred | Depends on claim state |
| Crash-window | Burn before I/O common | Same | Consume-before-send burn; UNKNOWN after send | Claim-before-send burn; UNKNOWN after send |
| Financial safety | Insufficient for L02 multi-node | Incomplete vs I/O revalidation | Better aligned to I7 if races handled | Similar to C if exclusive |
| Operational complexity | Low | Medium | Medium–High | High |
| Persistence | None | Required | Required | Required |
| Security implications | Multi-instance holes | Issue-spam after burn | Pre-consume probing; post-consume UNKNOWN | Lease/session confusion; renewal abuse |
| Architecture implications | Cannot clear AD-L02-04 | Unlikely to clear I7 alone | Candidate to clear I7 after design | Candidate after design |
| Migration | None | Store swap | API/evaluate semantics | New model + careful separation from session leases |
| New components | None | Durable store impl | Durable store + non-consuming verify + I/O consume hook | Lease store + claim API |
| Existing affected | — | Nest binding | LiveAdmissionService verify path; future ExecutionEngine boundary | Admission + I/O boundary; must not overload session lease |
| Changes PO-frozen grain? | No (grain already frozen; A incomplete on ACTION/COMMAND) | No | No | No if grain preserved |

### Invariant checklist (I1–I14)

| Inv | A | B | C | D |
| --- | - | - | - | - |
| I1 ACTION/COMMAND grain | Gap today | Must add | Must add | Must add |
| I2 single-use | Local | Evaluate-scoped | I/O-scoped | Claim-scoped |
| I3 fresh | Yes | Yes | Yes | Yes if expiry strict |
| I4 replay-resistant | Local | Yes if atomic | Yes if atomic | Yes if atomic |
| I5 no C7 bypass | Yes | Yes | Yes | Yes |
| I6 no S04 bypass | Yes | Yes | Yes if revalidation remains | Yes if revalidation remains |
| I7 I/O revalidation | **Conflict** | **Conflict** with same proof | **Aligns if designed** | **Aligns if designed** |
| I8 ALLOW ≠ submitted | Yes | Yes | Yes | Yes |
| I9 UNKNOWN ≠ success | N/A live today | Must hold | Must hold (critical) | Must hold |
| I10 no blind retry | N/A live today | Must hold | Must hold | Must hold |
| I11 lost record ≠ bypass | Loss → deny | Deny if missing | Deny if missing | Deny if missing/expired |
| I12 dup consume ≠ dup live exec | Not sufficient alone | Not sufficient alone | Needs + idempotency | Needs + idempotency |
| I13 stale fail-closed | Yes | Yes | Yes | Yes |
| I14 wrong binding fail-closed | Partial (no action) | Must enforce action | Must enforce action | Must enforce action |

---

## 11. Crash-Window Analysis (T0–T8)

Shared timeline for durable options (B/C/D). Option A: T1 does not survive process loss.

| Time | Event |
| ---- | ----- |
| T0 | Human-start created |
| T1 | Proof persisted |
| T2 | Admission evaluated |
| T3 | S04 revalidation |
| T4 | Proof consumed / lease claimed |
| T5 | Venue request starts |
| T6 | Venue accepts |
| T7 | Response received |
| T8 | Response persisted |

| Crash between | Survives (durable) | Proof valid? | Replay? | Dup venue risk | Reconcile? | UNKNOWN? |
| ------------- | ------------------ | ------------ | ------- | -------------- | ---------- | -------- |
| T0–T1 | Nothing or partial | No usable | N/A | Low | No | No |
| T1–T2 | Unconsumed proof | Yes until TTL | Presentable | Low | No | No |
| T2–T3 | Unconsumed (C/D) or consumed (A/B) | C/D: yes; A/B: no | A/B replay deny | Low | No | No |
| T3–T4 | Same | Same | Same | Low until claim | No | No |
| T4–T5 | Consumed/claimed; **no send** | No | Deny | Low (no send) | No | No |
| T5–T6 | In flight | No | Deny | **High** if blind retry | **Yes** | **Yes** |
| T6–T7 | Venue may have order | No | Deny | **High** if new identity | **Yes** | **Yes** |
| T7–T8 | Response may be lost locally | No | Deny | High if re-send | **Yes** | Possible |

**Binding rule:** T4 success never proves T6/T7/T8. Execution idempotency + UNKNOWN handling remain separate Architecture items (AD-L02-09/11/07).

### Option-specific T2/T4 placement

| Option | Typical T4 relative to T2/T3 |
| ------ | ---------------------------- |
| A/B | T4 coincides with T2 (evaluate) — T3 I/O revalidation cannot reuse proof |
| C | T4 after T3, before T5 |
| D | Claim/acquire at T4 (or earlier exclusive hold with expiry) after T3 |

---

## 12. Concurrency Analysis

| Case | A | B | C | D |
| ---- | - | - | - | - |
| Two evaluates same proof | Local race; one may win | Atomic consume → one valid | If non-consuming verify: both may PASS evaluate; **consume** must allow only one I/O | Atomic acquire → one claim |
| Same actor/workspace/session/action | Distinct proofs possible unless issue policy limits | Same | Same — issue policy is separate PO/Arch concern | Same |
| Duplicate HTTP + worker | Unsafe across nodes | Evaluate burned early | I/O consume + order idempotency both required | Lease claim + idempotency |

**Architecture Review required** for whatever option is chosen: exact atomic primitive and ordering vs ExecutionEngine.
**Security Review required:** concurrent claim, replay, cross-binding.

---

## 13. Multi-Instance / Restart Analysis

| | A | B | C | D |
| - | - | - | - | - |
| Multi-instance | Unsafe | Shared durable evaluate consume | Shared durable I/O consume | Shared durable lease |
| Restart after issue | Proof gone | Survives | Survives | Survives |
| Restart after consume/claim | N/A / gone | Remains consumed | Remains consumed | Remains used |
| Restart mid-I/O | No proof continuity | Proof state ≠ venue state | Same — UNKNOWN/reconcile | Same |

Production API horizontal scaling is an assumed deployment reality; Option A cannot be treated as multi-instance safe.

---

## 14. S04 Relationship

| Topic | Fact |
| ----- | ---- |
| Closed S04 behavior | Consume-on-evaluate; in-memory; actor/workspace/session |
| L02 contract | Must revalidate before irreversible venue I/O |
| Tension | Same single-use proof cannot be consumed at T2 and still authorize a consuming revalidation at T3 unless timing or dual-token model changes |
| PO-L02-05 freeze | Did **not** authorize implementation change to in-memory mechanism; durability left to Arch/Sec; this options pack is the PO decision vehicle for durability/timing |
| Do not redesign TradingSession | Session eligibility remains a separate gate |

Any option that changes evaluate consumption timing (C, D) needs **explicit PO decision** (see §16) before Architecture re-approval.

---

## 15. Financial-Safety Analysis

| Risk | Notes |
| ---- | ----- |
| Burned proof before send (A/B/C/D at T4–T5) | Denies further use of that proof — generally fail-closed; may increase re-issue pressure |
| Blind retry after UNKNOWN | Forbidden (I10); human-start model must not encourage “re-present proof ⇒ safe resubmit” |
| Consumption as false success | Forbidden — operators/systems must not treat consume as fill/accept |
| Multi-instance double submit | Human-start atomicity necessary but **not sufficient**; order/venue idempotency still required |
| Lost store (A) | Prefer deny over bypass (I11); availability impact |
| Issue spam | If proofs are easy to re-issue after burn, scarcity weakens — product/ops policy may need later PO attention (not inventing thresholds here) |

---

## 16. PO Decision Questions

Fill **nothing** in as answered. Neutral options only.

### PO-L02-05A — Human-start durability

**Decision question:** Where must human-start proof state live for L02?

Neutral options:

- **A1:** Process-local / in-memory only (current)
- **A2:** Durable shared store required for any L02 live I/O deployment
- **A3:** Durable shared store required whenever more than one API instance or worker may evaluate/consume

### PO-L02-05B — Human-start consumption timing

**Decision question:** When is single-use consumption effected?

Neutral options:

- **B1:** Consume on admission `evaluate` (current S04 timing)
- **B2:** Consume at or immediately before irreversible venue I/O (after required S04 revalidation)
- **B3:** Lease/reservation claim model (exclusive durable claim; single successful claim per bound action)
- **B4:** Other PO-specified timing (must still satisfy I1–I14 and I7)

### PO-L02-05C — Crash / concurrency guarantee

**Decision question:** What guarantee must hold if two instances race or a process crashes after consume/claim but before venue response is durably known?

Neutral options:

- **C1:** Fail-closed on proof; rely on separate order idempotency + UNKNOWN/reconcile for venue ambiguity
- **C2:** Require atomic consume/claim **and** pre-send durable execution marker before venue I/O may begin (ties to AD-L02-09/11 — still Architecture after PO)
- **C3:** PO specifies additional constraint (describe)

### PO-L02-05D — S04 relationship

**Decision question:** How may L02 refine S04 human-start mechanics without weakening the frozen grain?

Neutral options:

- **D1:** Keep S04 evaluate consume-on-evaluate unchanged; L02 must use a PO-approved workaround compatible with I7 (PO must state what workaround is allowed)
- **D2:** Authorize L02-oriented refinement: admission may verify without consuming; consume occurs per PO-L02-05B selection
- **D3:** Authorize lease/reservation semantics as the S04→L02 evolution while preserving grain I1–I14
- **D4:** Freeze “no change to S04 human-start mechanics” and accept that Architecture remains blocked until an alternative PO path exists

---

## 17. Architecture Handoff

After PO freezes 05A–05D, Architecture must decide (still **not** approved now):

- Exact persistence mechanism
- Atomic consumption / claim primitive
- Concurrency control
- Ordering relative to S04 evaluate vs I/O revalidation
- Multi-instance behavior
- Restart recovery
- Crash-window semantics vs ExecutionAdapter
- Interaction with idempotency (AD-L02-09)
- Interaction with UNKNOWN (AD-L02-07/11)
- ACTION/COMMAND field encoding on issue/verify

```text
AD-L02-04 = BLOCKED
until this PO decision is frozen and Architecture can re-review.
```

---

## 18. Security Handoff

Security must later review (SD-L02-04 and related):

- Replay
- Stale proof
- Cross-workspace / cross-actor / cross-session use
- Action/command mismatch
- Race conditions
- Multi-instance consistency
- Authorization bypass
- Duplicate execution
- Crash recovery

```text
Security Review was NOT performed.
Do NOT mark Security PASS.
```

---

## 19. Remaining L02 Blockers (Context)

Human-start (this pack) is necessary but not sufficient. Still blocked/outstanding from Architecture Review:

| Item | Status |
| ---- | ------ |
| AD-L02-04 human-start | **BLOCKED** pending this PO decision |
| AD-L02-07 UNKNOWN | BLOCKED |
| AD-L02-09 idempotency | BLOCKED |
| AD-L02-11 crash window | BLOCKED |
| AD-L02-01 parallel engine NON-SoT | APPROVED WITH CONDITIONS |
| AD-L02-14 venue adapters | APPROVED WITH CONDITIONS |
| Security SD-L02-01…07 | NOT PASS |
| S01–S06 | NOT GRANTED |

---

## 20. Implementation Boundary

```text
This decision-options document does NOT authorize:
  - runtime code changes
  - schema / migrations
  - human-start implementation changes
  - S04 changes
  - C7 / authz / KS / Session changes
  - venue adapters / reconciliation / idempotency implementation
  - live venue I/O / submit / cancel
  - live capital movement / FIV
  - Slice Approval / L02 closure
  - Architecture re-approval
  - Security PASS

No option is selected by this document.
AD-L02-04 remains BLOCKED pending PO decision.
V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
S01–S06 remain NOT GRANTED.
```

---

## Scenario consequence matrix (governance-level)

Applies regardless of option; option-specific notes in cells.

| # | Scenario | Security | Authz | Replay | Dup exec risk | Financial | Proof valid? | S04 revalidate? | Consumption safe? | Arch/Sec still needed? |
| - | -------- | -------- | ----- | ------ | ------------- | --------- | ------------ | --------------- | ----------------- | ---------------------- |
| 1 | Single-instance normal | Baseline | Gates apply | N/A | Low if idempotent | Low | Until consume/TTL | Before I/O (L02) | If timing matches option | Yes |
| 2 | Multi-instance | High if A | Split brain possible on A | Cross-node replay risk on A | High on A | High on A | Instance-local on A | Required | Unsafe on A | Yes |
| 3 | Restart after create | Availability | Deny if lost (A) | Lost ≠ bypass | Low | Ops friction | A: no; durable: yes | Required | A unsafe | Yes |
| 4 | Worker retry | Replay surface | May deny replayed | Central | High if blind venue retry | High if blind | Depends consume timing | Required | Timing-critical | Yes |
| 5 | Two concurrent consumers | Race | One must win | Other replay/deny | High without atomicity | High | At most one | Required | Needs atomicity | Yes |
| 6 | Same actor/ws/session/action | Issue policy | Binding match | Distinct proofs? | Possible if multi-proof | Medium | Per proof | Required | Per option | Yes |
| 7 | Diff session | Fail closed | Session mismatch | — | Low | Low | Invalid for other session | — | Deny | Yes |
| 8 | Diff workspace | Fail closed | WS mismatch | — | Low | Low | Invalid | — | Deny | Yes |
| 9 | Diff actor | Fail closed | Actor mismatch | — | Low | Low | Invalid | — | Deny | Yes |
| 10 | Replay after consume | OK if deny | Deny | Blocked | Low if enforced | Low | No | N/A | Deny second | Yes |
| 11 | Expire before evaluate | OK | Deny | — | Low | Low | No | — | Deny | Yes |
| 12 | Expire between evaluate and I/O | Stale | Deny at revalidate | — | Low if fail-closed | Low | No at T3 | **Must** | Deny I/O | Yes |
| 13 | KS after start before I/O | KS wins | Deny new I/O | — | Must not auto-cancel existing | Open orders separate | Irrelevant if KS denies | **Must** | N/A | Yes |
| 14 | Policy disable before I/O | Policy wins | Deny new I/O | — | Same | Same | Irrelevant | **Must** | N/A | Yes |
| 15 | Session end before I/O | Session gate | Deny new I/O | — | Same | Same | Invalid for ended session | **Must** | N/A | Yes |
| 16 | C7 → DENY | C7 final | Deny | — | Low | Low | Irrelevant | **Must** | N/A | Yes |
| 17 | Crash after validation before I/O | Proof may be burned (A/B) or not (C/D) | Fail-closed preferred | — | Low if no send | Re-issue pressure | Depends option | On retry | Timing-critical | Yes |
| 18 | Crash after venue I/O | UNKNOWN possible | Proof consumed ≠ success | — | High if blind retry | **High** | Typically consumed | On any retry path | Must not imply success | Yes |
| 19 | Network retry after evaluate | Replay | Likely deny if consumed | Yes | High if new venue attempt | High | Often no | Required | Unsafe if ignore deny | Yes |
| 20 | Duplicate concurrent request | Race | Atomicity required | — | High | High | One winner | Required | Needs atomic consume/claim | Yes |

---

## STOP

**STOP.** Decision options prepared for Product Owner.

Do not implement human-start changes from this document.
Do not modify S04.
Do not treat any option as selected.
Await PO decisions PO-L02-05A…05D, then Architecture re-review of AD-L02-04, then Security Review.
