# V3-L02 FIV Authorization & Execution Package

**Document:** FIV Authorization & Execution Package  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02  
**Nature:** Planning / readiness package only. **Not** FIV Authorization. **Not** FIV execution. **Not** live-capital activation. **Not** C7 change. **Not** credential provisioning. **Not** V3-L02 closure.

```text
Readiness verdict: READY FOR PO FIV AUTHORIZATION REVIEW
```

---

## 1. Purpose

Prepare a concrete, repository-backed definition of **how** V3-L02 FIV would be performed **after** a separate PO/Governance FIV Authorization.

```text
Slice Approval has been granted.
FIV authorization has NOT been granted by this artifact.
FIV execution remains separately gated by PO/Governance.
```

This artifact prepares FIV. It does **not** authorize or execute FIV.

---

## 2. Current Governance State

Do not reinterpret:

```text
V3-L02 implementation = COMPLETE
Slice Approval = GRANTED
Architecture = PASS WITH CONDITIONS
Security = PASS WITH CONDITIONS
SB-01…SB-07 = COMPLETE
FIV = NOT PERFORMED
Live I/O = BLOCKED
C7 = DENY-ALL
allowRealVenueIo = false
Real capital = NOT AUTHORIZED by this task
```

| Item | State |
| ---- | ----- |
| HEAD baseline (pre-this-commit) | `405720c4bef02f46db9f871ebef7621755e32920` = `origin/main` |
| Architecture conditions | DNS pin on real-I/O; LTE NON-SoT; EM `/v1/live` NON-SoT |
| Security residual | DNS/rebinding CONDITION REMAINS |
| Production credentials | **absent** |
| Protected leftovers | Present; untouched |

---

## 3. FIV Objective

Verify the **implemented** V3-L02 live execution path under controlled evidence so that the canonical chain preserves:

```text
Actor
→ Workspace
→ Permission
→ Human-start
→ S04
→ C7
→ Live Policy
→ Session
→ Kill Switch
→ Credential Environment
→ Human-start Claim
→ EG1
→ DNS-pinned transport
→ ExecutionAdapterPort
→ Venue
```

This path is **implemented and unit/isolation-verified**. It is **not** currently proven against a real venue. Zero real venue calls are authorized by this package.

---

## 4. Exact Venue Scope

PO-approved (Block A / financial scope):

```text
BINANCE
BYBIT
OKX
```

| Rule | Binding |
| ---- | ------- |
| No other venue | Not permitted without separate PO decision |
| MOCK | Test-only; **≠** live FIV venue proof |
| PAPER | Paper path; **≠** live |
| Per-venue FIV inclusion | Requires explicit FIV-D02 decision (may authorize one or more of the three) |

---

## 5. Environment Matrix

Hosts from `live-venue-allowlist.ts` / EG1–ENV1 evidence. Credential purposes from ENV1. **No secrets, account IDs, or API keys are recorded.**

| Venue | Environment | Credential class (Vault purpose) | Host | FIV status |
| ----- | ----------- | -------------------------------- | ---- | ---------- |
| Binance | `live` | `trading` / `trading_live` | `api.binance.com` | **gated** |
| Binance | `testnet` | `trading_testnet` | `testnet.binance.vision` | **gated** |
| Bybit | `live` | `trading` / `trading_live` | `api.bybit.com` | **gated** |
| Bybit | `testnet` | `trading_testnet` | `api-testnet.bybit.com` | **gated** |
| OKX | `live` | `trading` / `trading_live` | `www.okx.com` | **gated** |
| OKX | `demo` | `trading_demo` (+ server `x-simulated-trading: 1`) | `www.okx.com` (EG1 `testnet` host slot) | **gated** |
| Any | PAPER | must **not** use live trading secrets | N/A (Paper adapter) | not live FIV |
| Any | MOCK | must **not** use live trading secrets | N/A | test-only |

```text
testnet ≠ live
demo ≠ live
paper ≠ live
mock ≠ live
```

OKX live and demo share host; ENV1 purpose + demo header discipline is mandatory. Port for all live egress: **443** / HTTPS.

---

## 6. DNS / Transport Prerequisite

Principal remaining Architecture/Security condition.

### Required for any venue-contacting FIV (Modes B/C/D)

FIV **MUST** use the production-approved DNS-pinned/validated transport path (`LiveVenueEgressHttpClient` without unpinned injected `fetchFn`).

The injected/test `fetchFn` seam is **NOT** sufficient evidence for FIV.

FIV must demonstrate:

- hostname validation against EG1 allowlist;
- resolved-address validation/pinning as implemented (`createWebPushPinnedHttpsAgent`);
- private / loopback / link-local rejection;
- approved venue destination;
- HTTPS;
- port 443;
- redirect restrictions;
- no user-controlled destination;
- no unapproved network target.

Nest default today: `allowRealVenueIo=false` → refuse-first (`missing_configuration`); no connect.

If pinned transport is unavailable or cannot be demonstrated under the authorized FIV composition:

```text
FIV = ABORT / NOT READY
```

This package does **not** implement or change the DNS mechanism.

---

## 7. Credential Readiness

### Must be true before venue-contacting FIV

- Credential source is Vault;
- purpose matches environment (`trading`/`trading_live` / `trading_testnet` / `trading_demo`);
- venue matches credential binding;
- workspace binding is correct;
- credential material is never logged;
- testnet/demo/live credentials cannot cross environments;
- Paper/Mock cannot consume live credentials;
- OKX demo header applied only from trusted binding (never client-selected).

### Current repository state

```text
Production credentials = absent
→ NOT READY FOR FIV (execution)
```

Do **not** provision credentials in this act. Do **not** work around absence. Do **not** include secrets in this artifact.

Credential class for any FIV run is an unresolved **FIV-D04** input.

---

## 8. C7 Readiness

```text
C7 = DENY-ALL
```

Must remain unchanged during preparation of this package.

> Any temporary C7 authorization required for an actual FIV must be explicitly granted by the appropriate PO/Governance/security gate before execution (**FIV-D05**).

Do not change C7 in this task. Without an explicit C7 grant, live admission remains denied.

---

## 9. Human-Start

Frozen contract:

```text
WORKSPACE + ACTOR + SESSION + ACTION/COMMAND
```

Required sequence:

```text
validate → S04 revalidation → atomic claim → irreversible venue I/O
```

Properties (implemented / evidenced): durable shared storage; single-use; replay resistance; concurrency safety; restart safety; **claim ≠ submission**.

FIV evidence must show a valid human-start cannot transfer across actor, workspace, session, or action/command.

---

## 10. S04

S04 remains authoritative immediately before irreversible venue I/O.

```text
Human-start does NOT replace S04.
JWT/authentication does NOT replace human-start.
C7 does NOT replace S04.
```

FIV must capture the S04 decision immediately preceding the irreversible I/O boundary.

---

## 11. Canonical Execution Path

**Only** permitted V3-L02 FIV path:

```text
Orders
→ Execution Engine
→ Routing Execution Adapter
→ Live Venue Execution Adapter
→ ENV1
→ EG1
→ DNS-pinned transport
→ Approved Venue
```

### Explicitly excluded (NON-SoT)

```text
live-trading-engine
EmergencyManager
EmergencyManager /v1/live cancel-all
any parallel execution engine
any alternate live order path
```

Detection of these paths during FIV → **ABORT**.

---

## 12. Order Lifecycle Verification

Preserve:

```text
REQUESTED → ADMITTED → SUBMITTED → ACCEPTED → FILLED
```

Valid terminal / ambiguous states:

```text
REJECTED | CANCELLED | UNKNOWN
```

Never infer:

```text
network timeout = REJECTED
network timeout = CANCELLED
network timeout = FILLED
```

Ambiguous venue outcomes:

```text
UNKNOWN → reconciliation → established venue state
```

No blind retry.

Financial honesty (PO):

```text
ALLOW ≠ SUBMITTED ≠ ACCEPTED ≠ FILLED
UNKNOWN ≠ REJECTED ≠ CANCELLED ≠ FILLED
```

---

## 13. Idempotency Verification

Frozen invariant:

```text
stable logical idempotency
+ workspace scoping
+ stable clientOrderId
+ durable persistence
+ CAS/concurrency protection
```

FIV must evidence (safest controlled method supported by implementation — do **not** invent duplicate financial actions solely for spectacle):

- duplicate request;
- concurrent duplicate;
- worker retry;
- restart/recovery;
- lost response;
- crash-window behavior.

---

## 14. Lost-Response / UNKNOWN Test

```text
transmit possible + response not established = UNKNOWN
```

Then:

```text
UNKNOWN → reconcile → established state
```

No blind retry. Do not invent a successful venue result.

---

## 15. Cancellation Verification

- Success only when venue outcome is established;
- already cancelled may resolve as CANCELLED;
- already filled is not cancellable success;
- timeout/network/lost response ≠ cancellation success;
- ambiguous cancellation → UNKNOWN;
- no blind repeated cancellation;
- reconciliation may be required.

Explicitly exclude from L02 FIV:

```text
EmergencyManager cancel-all
```

---

## 16. Kill Switch / Policy / Session

### Kill Switch

When ACTIVE: new live admission/submission **denied**; existing venue orders **not** auto-cancelled; venue reconciliation remains authoritative when needed.

### Policy

Without `LIVE_POLICY_OPTED_IN`: new live admission/submission **denied**. Existing venue orders not rewritten by policy state alone.

### Session

Ineligible/ended session: blocks new live admission/submission; does **not** imply existing venue orders were cancelled.

No new cancellation subsystem is authorized by this package.

---

## 17. Financial Boundary

PO-approved allowed scope:

- live trading order submission;
- cancellation;
- execution result;
- fills;
- positions;
- corresponding trading ledger effects.

Explicitly excluded:

- deposits;
- withdrawals;
- banking;
- treasury;
- transfers;
- unrelated payment operations;
- unrelated funding operations.

No FIV step may enter excluded areas.

---

## 18. Capital Boundary

> Slice Approval does not itself authorize unrestricted real-capital movement.

Any FIV involving real capital requires **separate** explicit PO/Governance authorization under ADR-020 (**FIV-D06**).

This package does **not** choose:

- capital amount;
- position size;
- order size;
- asset;
- account;
- production credential;
- live venue;

on behalf of PO/Governance. These remain unresolved authorization inputs until FIV-D01…D07 are decided.

```text
Real capital = NOT AUTHORIZED by this task
```

---

## 19. FIV Modes

Defined without selecting one:

| Mode | Description | Venue contact | Capital |
| ---- | ----------- | ------------- | ------- |
| **A** — Composition / non-venue | Full gate chain without real venue I/O | No | No |
| **B** — Testnet / demo | Approved non-production venue environments where supported | Yes (testnet/demo) | Non-production venue balances only as authorized |
| **C** — Controlled live venue | Separately authorized live environment | Yes (live host) | Per FIV-D06 |
| **D** — Controlled real-capital action | Only if separately authorized under ADR-020 | Yes | Explicit capital act required |

Modes C and D are **not** approved by this artifact. Mode selection is **FIV-D01**.

---

## 20. Abort Conditions

| Condition | Action |
| --------- | ------ |
| DNS pinning unavailable | ABORT |
| unapproved destination | ABORT |
| SSRF validation failure | ABORT |
| credential/environment mismatch | ABORT |
| cross-workspace credential mismatch | ABORT |
| invalid human-start | ABORT |
| stale/replayed human-start | ABORT |
| S04 DENY | ABORT |
| C7 DENY | ABORT |
| KS blocks admission | ABORT |
| policy blocks admission | ABORT |
| session ineligible | ABORT |
| unexpected adapter path | ABORT |
| EmergencyManager path detected | ABORT |
| live-trading-engine path detected | ABORT |
| ambiguous venue outcome | STOP blind retry; reconcile |
| unexpected capital movement | ABORT + governance escalation |
| undocumented venue behavior | ABORT |
| inability to establish authoritative outcome | STOP / UNKNOWN |

No automatic recovery actions are invented beyond existing UNKNOWN → reconcile.

---

## 21. Evidence Capture

Minimum categories (no secrets / API keys / private credential material):

1. commit  
2. runtime build/version  
3. environment  
4. venue  
5. credential class (purpose only)  
6. workspace  
7. actor  
8. session  
9. action/command  
10. human-start validation  
11. S04 decision  
12. C7 state  
13. policy state  
14. KS state  
15. session eligibility  
16. ENV1 decision  
17. EG1 decision  
18. DNS/pinning evidence  
19. adapter path  
20. order / clientOrderId  
21. venue response classification  
22. order lifecycle transition  
23. UNKNOWN / reconciliation evidence  
24. cancellation evidence where applicable  
25. position/ledger effect where applicable  
26. capital movement evidence where authorized  
27. abort evidence  
28. final runtime state  

---

## 22. Evidence Integrity

Evidence must establish:

```text
what happened
when it happened
under which workspace
under which actor
under which session
under which action
through which adapter/path
against which environment
against which venue
```

Screenshots/logs that cannot establish binding are insufficient. Do not fabricate evidence.

---

## 23. FIV Rollback / Recovery Boundary

No invented rollback subsystem. Use authoritative venue state.

```text
UNKNOWN → reconcile → established venue state
```

Forbidden:

```text
UNKNOWN → blind retry
EmergencyManager cancel-all as L02 recovery
```

---

## 24. Post-FIV Review

```text
FIV execution
→ evidence package
→ PO FIV Review
→ defect classification if needed
→ remediation only under separate authorization
→ repeat FIV if required
→ PO Final Close
→ closure repository synchronization
→ V3-L02 CLOSED
```

FIV is verification-only. It must not silently fix defects discovered during the run.

---

## 25. FIV Failure Handling

If FIV fails:

- preserve evidence;
- classify the failure;
- do not hide or rewrite evidence;
- do not silently patch;
- do not claim PASS;
- stop at the relevant governance gate.

Remediation requiring code/configuration changes needs **separate** implementation authorization.

---

## 26. PO FIV Authorization Decision Surface

Answers **not** selected here:

| ID | Decision |
| -- | -------- |
| **FIV-D01** | Which FIV mode is authorized? (A / B / C / D) |
| **FIV-D02** | Which approved venue(s) are included? |
| **FIV-D03** | Environment: testnet / demo / live? |
| **FIV-D04** | Which credential class is authorized? |
| **FIV-D05** | What explicit C7 authorization is required? |
| **FIV-D06** | Is any real-capital movement authorized? |
| **FIV-D07** | Which operations are authorized? (submit / cancel / query / reconcile only / …) |
| **FIV-D08** | What constitutes immediate termination beyond §20? |

---

## 27. Prerequisites vs Execution Readiness

### Package ready for PO review

Implementation complete; Slice Approval granted; Architecture/Security close-outs recorded; modes, abort, evidence, and decision surface defined.

### Execution blockers until separately authorized

| Blocker | Status |
| ------- | ------ |
| FIV Authorization (FIV-D01…D08) | **NOT GRANTED** |
| Credentials provisioned for authorized class | **absent** → NOT READY FOR FIV execution |
| C7 explicit grant (if required by mode) | DENY-ALL; needs FIV-D05 |
| `allowRealVenueIo` enablement for Modes B/C/D | currently `false`; needs separate enablement under FIV Auth |
| DNS pin demonstration on real-I/O path | CONDITION REMAINS |
| Real capital (Modes C/D if capital involved) | NOT AUTHORIZED |

Mode A (composition / non-venue) may be authorizeable without venue credentials, still requiring PO FIV Authorization and explicit scope (FIV-D01/D07).

---

## 28. Readiness Verdict

```text
READY FOR PO FIV AUTHORIZATION REVIEW
```

Not:

```text
FIV APPROVED
```

Not an authorization to execute FIV.

---

## 29. Explicit Non-Authorization

> This artifact prepares the V3-L02 FIV authorization and execution process. It does not authorize FIV, live venue I/O, production credential use, real-capital movement, C7 changes, or V3-L02 closure.

Also does not authorize: testnet/demo venue contact; enabling `allowRealVenueIo`; EmergencyManager use; `live-trading-engine` as SoT; L03 start.

---

## 30. Source-of-Truth Inspected

### ADR

- `docs/adr/ADR-020-live-capital.md`

### Planning / PO

- `v3-l02-planning-proposal.md`
- `v3-l02-po-financial-scope-decision.md`
- `v3-l02-po-safety-authorization-decision-support.md`
- `v3-l02-po-block-b-decision-freeze.md`
- `v3-l02-human-start-decision-freeze.md`
- `v3-l02-slice-approval-readiness.md`

### Architecture / Security

- `v3-l02-architecture-review.md`
- `v3-l02-final-architecture-reverification.md`
- `v3-l02-security-review.md`
- `v3-l02-security-conditions-resolution-plan.md`
- `v3-l02-final-security-closeout.md`

### Implementation evidence

- EM1, HS1, UNK1, EG1, ENV1, ADP1, ISO1 evidence artifacts

### Code (hosts / env only)

- `apps/api/src/modules/execution-adapter/live-venue-egress/live-venue-allowlist.ts`
- ENV1 / EG1 / ADP1 modules (composition reference)

---

## STOP

**STOP.** Package recorded. Do not perform FIV. Do not contact venues. Do not use credentials. Do not enable live I/O. Do not change C7. Do not move capital. Do not close L02. Do not begin L03.

Next: **PO Review of V3-L02 FIV Authorization & Execution Package.**  
Only after a **separate** PO/Governance FIV Authorization may FIV execution begin.
