# Wave 6 Planning Package — Live Trading

## Approval-Ready Revision (Governance Planning Only)

**Document:** Wave 6 Formal Planning Package (revised)
**Date:** 2026-09-16
**Wave:** 6 — Live Trading
**Revision:** Approval-ready expansion for PO / Chief Architect review
**Supersedes for review purposes:** [`../next-wave-planning-package-proposal.md`](../next-wave-planning-package-proposal.md) (proposal retained; this file is the formal package)
**Authority:** Product Owner / Chief Architect — **FORMAL WAVE 6 PLANNING AUTHORIZED** (governance-only)
**Repository baseline:** `af54cc34b59e88822c80bd805a900c19d25ccc0c` (`main` == `origin/main`)
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../v3-capability-inventory.md`](../v3-capability-inventory.md) · [`../v3-planning-consistency-audit.md`](../v3-planning-consistency-audit.md) · `docs/adr/ADR-012`…`ADR-018`

```text
FORMAL WAVE 6 PLANNING           = AUTHORIZED (this artifact)
Wave 6 implementation            = NOT AUTHORIZED
Live trading                     = NOT AUTHORIZED
Real-capital movement            = NOT AUTHORIZED
Live UI implementation           = NOT AUTHORIZED
ADR creation                     = NOT AUTHORIZED by this package
  (D-GOV-04: only PO / Governance may authorize creation; planning ≠ create auth)
ADR approval                     = NOT CLAIMED (REQUIRED — NOT YET CREATED / NOT APPROVED)
ADR ↔ V3-L01 sequencing (D-GOV-01) = DECIDED — INTERPRETATION A ACCEPTED
  (approved live-capital ADR must exist before V3-L01 implementation)
D-GOV-02 (Wave 5 → Wave 6 / Rule 1) = DECIDED — INTERPRETATION C ACCEPTED
  (Wave 5 CLOSED is NOT a blanket Wave 6 prerequisite;
   planning + ADR governance may proceed while Wave 5 open;
   irreversible promises constrained by Rule 1)
D-GOV-03 (Wave 5 COMPLETE / CM-15 deferred) = OPEN
D-GOV-04 (ADR creation / approval authority) = DECIDED
  (PO create-auth → Eng/Arch draft → Architecture Review → Security Review
   → PO Review → PO Approval; does not create/approve ADR by itself;
   Wave 5 CLOSED NOT an additional ADR prerequisite per D-GOV-02)
D-GOV-05 (implementation authorization) = OPEN / NOT GRANTED
Wave 5 COMPLETE / CLOSED         = NOT CLAIMED (NOT COMPLETE)
CM-15 CLOSED                     = NOT CLAIMED (deferred)
TD-CM15-TEAMS-LIVE               = OPEN / DEFERRED / NON-BLOCKING (unchanged)
Technical Debt closure           = NOT AUTHORIZED
Package Close / FIV PASS         = NOT AUTHORIZED / NOT CLAIMED
```

Protected dirty/untracked leftovers outside this `wave-6/` planning tree were **not** modified.

**Classification legend:** AUTHORITATIVE · DERIVED · OPEN · NOT SPECIFIED

---

# 1. Wave identity & Master Plan compliance

| Field          | Value                                                                        | Class                                                             |
| -------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Wave           | **6 — Live Trading**                                                         | AUTHORITATIVE                                                     |
| Objective      | Authorized workspace runs a live Trading Session on the Canonical Order Path | AUTHORITATIVE (Roadmap Goal)                                      |
| Business value | Certified knowledge applied to real capital under human authority            | AUTHORITATIVE                                                     |
| Packages       | **V3-L01 → L02 → L03 → L04 → L05**                                           | AUTHORITATIVE                                                     |
| Slices         | Not defined in Master Plan / Roadmap                                         | NOT SPECIFIED — TO BE DEFINED DURING PLANNING (do not invent IDs) |

### Customer outcomes (Master Plan §4 Wave 6) — AUTHORITATIVE

1. Live off until authorized person enables workspace.
2. Cannot go live without certified strategy + Gate PASS.
3. Human start only; AI cannot.
4. Live order attributable in non-editable audit.
5. Kill Switch stops live orders.
6. UI that says Live actually reaches the venue.

### Exit criteria (Execution Roadmap Wave 6) — AUTHORITATIVE

1. Paper Freeze remains default; live per-workspace opt-in.
2. Live session: certified library member + Gate PASS + human start.
3. Path: Risk → Orders → Execution → **live adapter** → Fill → Position → Ledger; no bypass.
4. Every live place/cancel/kill append-only audited and attributable.
5. Kill Switch stops live evaluation and rejects new live orders.
6. AI cannot start, approve, or size live orders.
7. UI that says Live can reach venue; otherwise stays hidden.

### Architecture — AUTHORITATIVE

Justified ADR. Minor/major extension of Session, Execution Adapter, Gate.
**Forbidden:** new Bot aggregate; Orchestrator creating sessions; Signal Engine merge into Runtime.

### Live gate — AUTHORITATIVE

Waves **1–4** exit **and** approved **live-capital ADR**. Wave 5 is **not** a live prerequisite.
Rule 1: finish wave exit criteria before next wave’s **irreversible product promises** (especially live UI).

---

# 2. Preserved governance evidence

## 2.1 Live-capital ADR — REQUIRED GOVERNANCE DEPENDENCY — NOT YET APPROVED

| Statement                                                         | Source                              | Class                                   |
| ----------------------------------------------------------------- | ----------------------------------- | --------------------------------------- |
| Wave 6 starts only after W1–4 + approved live-capital ADR         | Roadmap Live-capital gate           | AUTHORITATIVE                           |
| Live-capital ADR before Wave 6                                    | Master Plan §4 Live gate            | AUTHORITATIVE                           |
| Approved ADR superseding Paper Freeze for **opted-in** workspaces | Roadmap Wave 6 Dependencies         | AUTHORITATIVE                           |
| Global order: `N01…N04 → [live-capital ADR] → L01…L05`            | Roadmap Implementation order        | AUTHORITATIVE                           |
| Master Plan does not write that ADR                               | Master Plan §16.8                   | AUTHORITATIVE                           |
| Create ADR exception when Wave 6 is reached                       | Package template Future guidance §5 | AUTHORITATIVE                           |
| Live capital unauthorized until future ADR                        | Package template §6                 | AUTHORITATIVE                           |
| LT-01 purpose “after ADR”; deps include ADR                       | Capability inventory LT-01          | AUTHORITATIVE                           |
| V3-L01 name = “Live capital ADR + workspace policy”               | Roadmap package table               | AUTHORITATIVE                           |
| Approved ADR file exists                                          | Repository search                   | **NO**                                  |
| ADR number / filename                                             | —                                   | NOT SPECIFIED — PO / ARCHITECT DECISION |

### ADR ↔ V3-L01 sequencing — DECIDED (D-GOV-01)

**STATUS:** **DECIDED — INTERPRETATION A ACCEPTED** (Product Owner / Chief Architect)

**Authoritative rule:** An **approved** live-capital ADR **must exist before** V3-L01 **implementation** may begin.

```text
Interpretation A — ADR FIRST: approved ADR before Wave 6 / V3-L01 implementation  ← ACCEPTED
Interpretation B — V3-L01 OWNS ADR: L01 drafts/obtains approval when Wave 6 is reached  ← NOT SELECTED
```

**Preserved OPEN / DECIDED (related):**

- **D-GOV-04** — **DECIDED**: PO / Governance authorizes creation; Engineering / Architecture may draft after that authorization; Architecture + Security + PO reviews mandatory; PO final approval. D-GOV-04 does **not** create or approve the ADR and does **not** satisfy D-GOV-01 by itself. See [`d-gov-04-adr-authority-decision-brief.md`](./d-gov-04-adr-authority-decision-brief.md) · [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md).
- **D-GOV-02** — **DECIDED — INTERPRETATION C ACCEPTED**: Wave 5 CLOSED is **not** a blanket Wave 6 prerequisite; governance planning may continue while Wave 5 open; ADR governance work not additionally gated by Wave 5 CLOSED (still D-GOV-04); irreversible product promises constrained by Rule 1 (especially live UI). Wave 5 remains **NOT COMPLETE**. **D-GOV-03** remains **OPEN**. See [`d-gov-02-wave5-wave6-transition-decision-brief.md`](./d-gov-02-wave5-wave6-transition-decision-brief.md).

Wave 6 **implementation** remains **NOT AUTHORIZED**. Evidence for D-GOV-01: [`d-gov-01-adr-l01-sequencing-decision-brief.md`](./d-gov-01-adr-l01-sequencing-decision-brief.md).

## 2.2 Paper Freeze — AUTHORITATIVE

ADR-012…018 Accepted. Paper-only; real-capital orders forbidden (ADR-018 #10). Future live adapter needs new ADR + credentials + safety + release (ADR-012/016). Live-capital ADR supersedes Paper Freeze **for opted-in workspaces only**; Paper remains default.

## 2.3 Wave 5 / CM-15 / Rule 1 — AUTHORITATIVE status (unchanged)

| Item               | Status                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Wave 5             | **NOT COMPLETE** — not declared CLOSED                                                                                    |
| CM-15              | Deferred FIV; Final Close not authorized; **CLOSED = NO**                                                                 |
| TD-CM15-TEAMS-LIVE | OPEN / DEFERRED / NON-BLOCKING; does not authorize CM-15 Final Close or Wave 5 COMPLETE                                   |
| Rule 1             | Irreversible next-wave promises (esp. live UI) require prior wave exit criteria finished                                  |
| D-GOV-02           | **DECIDED — INTERPRETATION C**: Wave 5 CLOSED not a blanket Wave 6 prerequisite; Rule 1 still binds irreversible promises |
| D-GOV-03           | **OPEN** — whether Wave 5 may COMPLETE with CM-15 deferred                                                                |
| This package       | Governance planning only — **not** irreversible product promises; **not** implementation                                  |

---

# 3. L01 — PLANNING

## V3-L01 — Live capital ADR + workspace policy (LT-01)

| Topic                    | Content                                                                                                      | Class                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Objective                | Opt-in live sessions under Paper-default policy after ADR                                                    | AUTHORITATIVE (LT-01)                           |
| Capability               | LT-01 Live capital path                                                                                      | AUTHORITATIVE                                   |
| Dependencies             | ADR; Waves 1–4; Gate; human start; Kill Switch                                                               | AUTHORITATIVE (LT-01)                           |
| Wave 6 deps              | W1–4 exit; W3 kill switch; approved live-capital ADR; Runtime Enforcement Gate                               | AUTHORITATIVE (Roadmap)                         |
| Inputs                   | Workspace identity; Admin/authorized actor; Gate/certification status; Kill Switch state; ADR approval state | DERIVED                                         |
| Outputs                  | Workspace live policy (opt-in/off); enablement audit intent                                                  | DERIVED from outcomes                           |
| Affected architecture    | Session/Runtime live mode; Deployment live flag; Gate live admission; Admin policy                           | AUTHORITATIVE (Master Plan §10 minor extension) |
| Reuse                    | Session, Gate, workspace, Admin role, Kill Switch foundation (V3-O04)                                        | AUTHORITATIVE reuse                             |
| New components           | Live policy persistence / enablement APIs                                                                    | NOT SPECIFIED — TO BE DEFINED DURING PLANNING   |
| Workspace policy         | Paper default; live per-workspace opt-in; off until authorized enablement                                    | AUTHORITATIVE                                   |
| Authorization            | Admin + ADR; not trader self-serve without audit                                                             | AUTHORITATIVE (Master Plan §11)                 |
| Human start              | Required for live session                                                                                    | AUTHORITATIVE                                   |
| Kill Switch              | Consume foundation; Wave 6 exit requires live stop/reject                                                    | AUTHORITATIVE                                   |
| Runtime Enforcement Gate | Dependency; live admission attributes                                                                        | NOT SPECIFIED detail — OPEN                     |
| Paper Freeze             | Remains default; ADR supersedes for opted-in only                                                            | AUTHORITATIVE                                   |
| Consumer outcome         | Authorized enablement path; live remains off by default until verified release                               | AUTHORITATIVE intent                            |
| Non-claims now           | Live on; ADR approved; L01 implemented                                                                       | AUTHORITATIVE governance                        |
| ADR sequencing           | OPEN — do not decide if L01 creates ADR                                                                      | OPEN                                            |
| Slices                   | —                                                                                                            | NOT SPECIFIED — TO BE DEFINED DURING PLANNING   |

### L01 failure states

| Failure                            | Expected if authoritative                              | Class                  |
| ---------------------------------- | ------------------------------------------------------ | ---------------------- |
| Missing approved ADR               | Live capital unauthorized; no enablement of live money | AUTHORITATIVE          |
| Unauthorized actor attempts enable | Deny                                                   | DERIVED from Admin+ADR |
| Gate/cert fail later session start | Cannot go live                                         | AUTHORITATIVE          |
| Kill Switch active                 | Must block live evaluation/orders (exit)               | AUTHORITATIVE          |

### L01 acceptance criteria

| Criterion                                         | Class                |
| ------------------------------------------------- | -------------------- |
| Paper default; live opt-in                        | AUTHORITATIVE        |
| Live off until authorized enablement              | AUTHORITATIVE        |
| Session needs certified + Gate PASS + human start | AUTHORITATIVE        |
| AI cannot start/approve/size                      | AUTHORITATIVE        |
| Approved ADR before live enablement               | AUTHORITATIVE        |
| L01 vs separate ADR work-split                    | OPEN                 |
| MFA / exact Admin UX                              | OPEN / NOT SPECIFIED |

### L01 FIV (planning)

Verify off-by-default; authorized enable/disable; no live orders from L01 alone. Environment: non-production policy lab. **No FIV PASS claimed.**

### L01 TD

TD-052 (live capital residual) — relevant. TD-047 — Kill Switch residual for later live proof.

---

# 4. L02 — PLANNING

## V3-L02 — Live order I/O (LT-02, RK-03)

**Real-capital operation is NOT currently authorized.**

### Canonical path — AUTHORITATIVE

```text
Risk → Orders → Execution → live adapter → Venue → Fill → Position → Ledger
```

No bypass. No second ledger. No parallel Bot.

| Boundary                 | Concern                                  | Class                                  |
| ------------------------ | ---------------------------------------- | -------------------------------------- |
| Risk → Orders            | Mandatory Risk approval                  | AUTHORITATIVE (ADR-012/016; path)      |
| Orders → Execution       | Single Execution Engine entry            | AUTHORITATIVE (ADR-012)                |
| Execution → Live Adapter | Live adapter only after ADR+release      | AUTHORITATIVE (ADR-012/016)            |
| Adapter → Venue          | Real submit/cancel; credentials in Vault | AUTHORITATIVE intent; unauthorized now |
| Venue → Fill             | Fills enter existing accounting          | AUTHORITATIVE (LT-02)                  |
| Fill → Position → Ledger | Existing ownership; no UI ledger invent  | AUTHORITATIVE                          |

### L02 failure / race scenarios

| #   | Scenario                                      | Expected if authoritative                                                | Existing control              | Missing / Open               | Security consequence            | FIV                |
| --- | --------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------- | ---------------------------- | ------------------------------- | ------------------ |
| 1   | Local accept, venue rejects                   | No false live fill; honest failure                                       | Paper path rejection patterns | Live adapter mapping OPEN    | Fake success risk if mishandled | Verify reject path |
| 2   | Venue accepts, response lost                  | Reconciliation before uncertain retry (ADR-012)                          | ADR-012 reconciliation intent | Live reconcile OPEN          | Duplicate exposure              | Verify reconcile   |
| 3   | Submission timeout                            | Fail closed / uncertain → stop new exposure (ADR-016 fail-safe)          | Fail-safe principle           | Live timeout policy OPEN     | Unknown venue state             | Timeout FIV        |
| 4   | Duplicate submission                          | No duplicate Orders/Fills (ADR-018 #9); L05 replay                       | Idempotency concepts          | Live idempotency OPEN        | Double order                    | Replay FIV         |
| 5   | Cancel races fill                             | Ordered attributable place/cancel/kill (exit)                            | Order state machine (paper)   | Live race OPEN               | Wrong state                     | Race FIV           |
| 6   | Partial fill                                  | Accounting must reflect reality                                          | Paper fill rules              | Live partial OPEN            | Position lie                    | Partial FIV        |
| 7   | Adapter disconnect                            | Degraded/unavailable honesty; reconnect backoff (Master Plan continuity) | Continuity language           | Live disconnect OPEN         | Silent trading                  | Disconnect FIV     |
| 8   | Credential fail/expire                        | No live; Vault/Connections rotate paths exist W2                         | Vault                         | Live trading key policy OPEN | Unauthorized venue              | Cred FIV           |
| 9   | Kill Switch during execution                  | Stop evaluation; reject new live orders; cancel pending per ADR-016 KS   | KS foundation W3-O04          | Live execution proof OPEN    | Capital bleed                   | KS FIV             |
| 10  | Gate denies                                   | Cannot go live / no execution                                            | Gate reuse                    | Live admission attrs OPEN    | Bypass                          | Gate FIV           |
| 11  | Crash after venue submit before local persist | Reconciliation before resume (ADR-014/012)                               | Recovery substrate            | Live recovery OPEN           | Orphan venue order              | Chaos FIV          |
| 12  | Network failure mid-lifecycle                 | At-least-once + idempotent effects (ADR-013); uncertain → fail safe      | Event model                   | Live mapping OPEN            | Duplicate/unknown               | Network FIV        |

### L02 acceptance

| Criterion                           | Class         |
| ----------------------------------- | ------------- |
| Canonical path with live adapter    | AUTHORITATIVE |
| Fills into existing accounting      | AUTHORITATIVE |
| Kill Switch rejects new live orders | AUTHORITATIVE |
| Live adapter only post ADR+release  | AUTHORITATIVE |
| RK-03 policy contents               | OPEN          |
| Venue matrix for live               | OPEN          |

---

# 5. L03 — PLANNING

## V3-L03 — Tamper-evident financial action log (SEC-10, SEC-16)

### Must be attributable — AUTHORITATIVE intent

Place, cancel, kill — attributable and ordered (SEC-10; Roadmap exit; Master Plan Wave 6 audit outcome).

### Fields

| Field                             | Class                                                             |
| --------------------------------- | ----------------------------------------------------------------- |
| Actor                             | DERIVED from “attributable” / “who initiated”                     |
| Workspace                         | DERIVED (isolation)                                               |
| Action (place/cancel/kill)        | AUTHORITATIVE                                                     |
| Timestamp / ordering              | AUTHORITATIVE (“ordered”)                                         |
| Authorization context             | DERIVED                                                           |
| Request/order identity            | DERIVED (link to Order)                                           |
| Venue                             | DERIVED for live path                                             |
| Result                            | DERIVED                                                           |
| Exact schema                      | OPEN ARCHITECTURE DECISION                                        |
| Cryptographic integrity mechanism | OPEN (“hash chain **or equivalent**” — SEC-16); do **not** choose |

### Behavior

| Topic                                          | Class                                                     |
| ---------------------------------------------- | --------------------------------------------------------- |
| Append-only                                    | AUTHORITATIVE (SEC-16; exit)                              |
| Integrity-protected                            | AUTHORITATIVE (SEC-16)                                    |
| Relationship action→order→fill→position→ledger | DERIVED (path + SoT ownership); join design OPEN          |
| Retention                                      | NOT SPECIFIED — OPEN (may touch Wave 10 compliance later) |

### Acceptance

| Criterion                                                       | Class                            |
| --------------------------------------------------------------- | -------------------------------- |
| Every live place/cancel/kill append-only audited & attributable | AUTHORITATIVE                    |
| Integrity-protected records                                     | AUTHORITATIVE                    |
| Operator sees own live order attribution                        | AUTHORITATIVE                    |
| Hash chain vs other integrity                                   | OPEN                             |
| Optional paper logging                                          | OPEN (SEC-10 “optionally paper”) |

---

# 6. L04 — PLANNING

## V3-L04 — Honest live operator UI (LT-04)

**No UI implementation authorized.** Rule 1: live UI = irreversible product promise.

### Dependencies — AUTHORITATIVE

LT-01, LT-02, PC-19 redirects, Product UI Policy. `/trading/live` redirects to paper; must not unhide until I/O real.

### State model

**NOT SPECIFIED — REQUIRES ARCHITECT DECISION** for a complete formal state machine.
Authoritative constraints that any model must obey:

| Concern                 | Constraint                                                             | Class                      |
| ----------------------- | ---------------------------------------------------------------------- | -------------------------- |
| Paper                   | Remains default; must not present as live                              | AUTHORITATIVE              |
| Live authorization      | Off until authorized enablement                                        | AUTHORITATIVE              |
| Venue reachability      | UI says Live only if venue-reachable                                   | AUTHORITATIVE              |
| Hidden otherwise        | Stay hidden if cannot reach venue                                      | AUTHORITATIVE              |
| Kill Switch             | Stops live orders; operator visibility expected for W3 outcome pattern | AUTHORITATIVE / DERIVED    |
| Gate / enforcement      | Failed Gate → cannot go live                                           | AUTHORITATIVE              |
| Credentials             | Missing/expired → not live-ready                                       | DERIVED                    |
| Uncertain / unavailable | Honest degraded/unavailable; no fake success                           | AUTHORITATIVE (continuity) |

### Consumer-visible honesty rules

| May show (after verified release)  | Must not claim        | Evidence for truth        | If uncertain        |
| ---------------------------------- | --------------------- | ------------------------- | ------------------- |
| Paper mode                         | Live                  | Mode flag                 | Prefer paper/hidden |
| Live authorized but not executable | “Live trading”        | Enablement + venue + Gate | Show unavailable    |
| Venue connected for live           | Authorized/executable | Test/handshake + authz    | Do not claim live   |
| Kill Switch active                 | Trading OK            | KS state                  | Block + visible     |

**Forbidden collapses:** paper≠live; simulation≠real; connection≠authorization; authorization≠execution readiness; unavailable venue≠live; stale≠current.

### Acceptance

| Criterion                            | Class                |
| ------------------------------------ | -------------------- |
| Live UI implies venue-reachable path | AUTHORITATIVE        |
| Else hidden                          | AUTHORITATIVE        |
| Depends on real LT-01/02 I/O         | AUTHORITATIVE        |
| Exact screens/routes/copy/state enum | OPEN / NOT SPECIFIED |

---

# 7. L05 — PLANNING

## V3-L05 — Replay protection on financial APIs

| Topic                                                                    | Class                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Requirement                                                              | Replay protection completes on live place/cancel                | AUTHORITATIVE (Master Plan) |
| Duplicate Orders/Fills forbidden                                         | AUTHORITATIVE (ADR-018 #9)                                      |
| Delivery at-least-once                                                   | AUTHORITATIVE (ADR-013) — live must not double financial effect |
| Mechanism (keys, idempotency store, etc.)                                | OPEN — ARCHITECT DECISION REQUIRED                              |
| Cover place/cancel/authz/enablement/retries/timeouts/client&server retry | DERIVED risk list; coverage OPEN                                |

### Acceptance

| Criterion                              | Class         |
| -------------------------------------- | ------------- |
| Replay protection on live place/cancel | AUTHORITATIVE |
| Exact scheme                           | OPEN          |

---

# 8. SECURITY GATE

```text
Security architecture exists          = YES (Paper Freeze, Gate, Risk, Vault, KS foundation)
Live-capital authorization exists     = NO  (no approved live-capital ADR)
Implementation security approval      = NO
FIV evidence exists                   = NO
```

These are **not** equivalent.

| Security Area                 | Existing                   | Required                      | Missing                          | Open Decision           | Evidence                    |
| ----------------------------- | -------------------------- | ----------------------------- | -------------------------------- | ----------------------- | --------------------------- |
| Authentication                | W1 sessions                | On all live surfaces          | Live surface wiring              | MFA for live enablement | Master Plan least privilege |
| Authorization / RBAC          | W1 roles                   | Live extra policy; Admin+ADR  | Live policy engine detail        | Model                   | §11 Admin+ADR               |
| Workspace isolation           | W1                         | Live orders/audit isolated    | Live artifact checks             | —                       | SEC-11 / W1                 |
| Admin privileges              | Admin role                 | Enablement only via Admin+ADR | Enablement API                   | Self-serve forbidden    | §11                         |
| Human authorization           | Human start rule           | Session start human           | UX                               | —                       | Wave 6 outcomes             |
| Secrets / Vault               | Vault W1; Connections W2   | Trading credentials           | Live trading secret types policy | —                       | Vault ownership             |
| Credentials                   | Collect/rotate patterns    | Live venue keys               | Live key productization          | Rotation SLA            | ADR-012 future live         |
| Network / SSRF / TLS          | Hardening patterns (W1/W5) | Live adapter egress           | Live egress policy               | Host allowlists         | ADR-012 port                |
| Venue boundary                | Adapter port               | Live adapter                  | Live binding                     | Venue list              | LT-02                       |
| Input validation              | API validation norms       | Live place/cancel APIs        | Live validators                  | —                       | SEC-08 family               |
| Replay                        | Paper idempotency concepts | L05 on live APIs              | Live scheme                      | Mechanism               | Master Plan L05             |
| Audit                         | SEC-09 partial; Ledger SoT | L03 financial action log      | Operator live action log         | Integrity mech          | SEC-10/16                   |
| Kill Switch                   | W3-O04 foundation          | Live stop/reject              | Live execution proof             | —                       | Wave 6 exit; W3 deferral    |
| Runtime Enforcement Gate      | V2 reuse                   | Live admission                | Live attributes                  | Attribute set           | Roadmap deps                |
| Fail-closed                   | Continuity / ADR-016       | Live path                     | Live wiring                      | —                       | Master Plan                 |
| External side effects         | Forbidden now              | Only post ADR+release         | Authorization                    | Release gate            | Template §6; ADR-012        |
| Credential compromise         | Rotate/disconnect patterns | Live incident runbook         | Live runbook                     | —                       | Master Plan runbooks intent |
| Duplicate / partial execution | Paper rules                | Live accounting truth         | Live edge cases                  | —                       | L02 scenarios               |
| Recovery                      | ADR-014 substrate          | Live reconcile                | Live recovery playbook           | —                       | ADR-012 reconcile           |

**No implementation security approval. Do not call the system secure for live capital.**

---

# 9. SAFETY / FAILURE MATRIX

| Failure / Event             | Expected behavior                 | Fail-open possible? | Fail-closed required? | Existing control               | Missing/Open              |
| --------------------------- | --------------------------------- | ------------------- | --------------------- | ------------------------------ | ------------------------- |
| Auth failure                | Deny                              | No                  | Yes                   | W1 auth                        | Live surface wiring OPEN  |
| Authorization failure       | Deny                              | No                  | Yes                   | RBAC                           | Live policy OPEN          |
| Missing ADR                 | No live money                     | No                  | Yes                   | Template §6; gate              | ADR file missing          |
| Missing credentials         | No live submit                    | No                  | Yes                   | Vault empty fail               | Live key UX OPEN          |
| Expired credentials         | Fail visible                      | No                  | Yes                   | Connection test patterns       | Live expire handling OPEN |
| Venue unavailable           | Degraded/unavailable honesty      | No                  | Yes                   | Continuity language            | Live adapter OPEN         |
| Timeout                     | Uncertain → stop new exposure     | No                  | Yes                   | ADR-016 fail-safe              | Live timeout OPEN         |
| DNS/network failure         | No silent success                 | No                  | Yes                   | Continuity                     | Live mapping OPEN         |
| Duplicate / replay          | No duplicate financial effect     | No                  | Yes                   | ADR-018 #9; L05                | Mechanism OPEN            |
| Partial fill                | Reflect truth in accounting       | No                  | Yes                   | Paper fills                    | Live partial OPEN         |
| Lost response               | Reconcile before retry            | No                  | Yes                   | ADR-012                        | Live reconcile OPEN       |
| Process restart             | Recover or safe stop; KS armed    | No                  | Yes                   | ADR-014; KS durable foundation | Live recovery OPEN        |
| Kill Switch                 | Stop eval; reject new live orders | No                  | Yes                   | W3-O04 foundation              | Live proof OPEN           |
| Enforcement denial          | No live                           | No                  | Yes                   | Gate                           | Live attrs OPEN           |
| Inconsistent local/external | Reconcile; fail safe              | No                  | Yes                   | Recovery intent                | Live playbook OPEN        |

Where behavior not specified beyond principles: **OPEN — do not invent.**

---

# 10. DEVELOPER / ARCHITECTURE REVIEW

| Package | Existing Components                                                   | New Components                | Interfaces                       | Data Changes                    | External Dependencies       | Risks                             |
| ------- | --------------------------------------------------------------------- | ----------------------------- | -------------------------------- | ------------------------------- | --------------------------- | --------------------------------- |
| L01     | Session, Gate, workspace, Admin, KS foundation                        | Live policy store/API **TBD** | Admin enablement; Gate live flag | Workspace live policy **OPEN**  | Approved ADR (missing)      | Sequencing OPEN; premature enable |
| L02     | Risk, Orders, Execution Engine, adapter port, Vault, Position, Ledger | Live adapter binding          | Submit/cancel/reconcile          | Order live mode fields **OPEN** | Venue + trading credentials | TD-051; real capital              |
| L03     | Audit/SEC-09 cues, Ledger immutability pattern                        | Financial action log          | Append API; query                | Append-only log **OPEN**        | —                           | Integrity OPEN                    |
| L04     | PC-19 chrome; `/trading/live`→paper                                   | Honest live surfaces **TBD**  | UI↔API                           | —                               | Depends L01/L02 verified    | Misleading UI; Rule 1             |
| L05     | Idempotency/SEC-08 patterns                                           | Live replay controls **TBD**  | Place/cancel APIs                | Idempotency store **OPEN**      | —                           | Double execution                  |

**No second engine / parallel Bot** unless Master Plan revised (forbidden now).

Map: Session · Runtime Enforcement Gate · Kill Switch · Risk · Orders · Execution · adapters · Vault · Position · Ledger · audit — extend, do not replace Canonical Order Path.

---

# 11. TECHNICAL DEBT MAPPING

| TD                     | Related Package  | Implementation Impact            | FIV Impact             | Wave Exit Impact    | Explicitly Blocking?                                                                 |
| ---------------------- | ---------------- | -------------------------------- | ---------------------- | ------------------- | ------------------------------------------------------------------------------------ |
| **TD-052**             | Wave 6 / L01–L02 | Live unauthorized until ADR path | Blocks live FIV claims | Central residual    | Not “blocks planning” wording; **materially requires ADR/Wave 6** — not auto-close   |
| **TD-047**             | L01/L02/L04      | KS paper/live residual           | Live KS proof          | Exit KS criterion   | Not explicitly “blocks L01 planning”; **relevant** to live exit                      |
| **TD-051**             | L02              | Adapter stubs/gaps               | Live I/O FIV           | Live path readiness | Not explicit Wave 6 start blocker; **relevant** to L02                               |
| **TD-049**             | Wave 5           | Notification                     | N/A Wave 6 live gate   | None for live gate  | No                                                                                   |
| **TD-050**             | Wave 5           | Channels                         | N/A                    | None for live gate  | No                                                                                   |
| **TD-CM15-TEAMS-LIVE** | Wave 5 / CM-15   | Teams live FIV                   | Wave 5 only            | Not live gate       | Explicitly **NON-BLOCKING** for next authorized W5 planning; **not** Wave 5 COMPLETE |

**No TD closed or modified.**

---

# 12. FIV READINESS

| Package | What must be verified                                       | Environment               | Credentials                                           | Human Authorization | Evidence                                        | Safety Constraint                                                 |
| ------- | ----------------------------------------------------------- | ------------------------- | ----------------------------------------------------- | ------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| L01     | Off-by-default; enable/disable; no orders from policy alone | Policy lab / non-prod     | Admin test                                            | Authorized enabler  | Audit of enablement; paper default              | No live money                                                     |
| L02     | Canonical path; reject/timeout/dup/KS/Gate scenarios        | **Safe live/test venue**  | Vault trading keys for **authorized test** venue only | Human start         | Real submit/cancel/fill **or** documented block | Kill Switch; disable adapter; **no prod capital** without release |
| L03     | Attributable append-only records for place/cancel/kill      | Same as L02 test path     | —                                                     | —                   | Log integrity evidence                          | No claim without records                                          |
| L04     | No paper-as-live; hidden until ready; venue-reachable claim | Staging UI + verified L02 | —                                                     | —                   | Screenshots/state proofs                        | Re-hide on uncertainty                                            |
| L05     | Replay/dup rejected; no double fill                         | API harness + staging     | —                                                     | —                   | Replay test log                                 | —                                                                 |

**L02 environment:** If no PO-authorized safe test venue:
`FIV BLOCKED — ENVIRONMENT REQUIRED`
Do not invent a venue. Do not simulate FIV PASS. FIV verifies only; does not fix defects.

---

# 13. CONSUMER REVIEW

| Package | Consumer Capability                    | Preconditions                                | Evidence Required                | Consumer Must NOT Be Told                  |
| ------- | -------------------------------------- | -------------------------------------------- | -------------------------------- | ------------------------------------------ |
| L01     | Opt-in live policy under paper default | ADR approved; Admin enablement               | Enablement audit; default off    | “Live trading is on” / “ADR done” now      |
| L02     | Real venue orders/cancels/fills        | L01+ADR; live adapter release; Gate+human+KS | Venue evidence on test/auth path | Paper fills are live; Connected=executable |
| L03     | See attributable live actions          | L02 path producing actions                   | Audit records                    | Full compliance pack unless scoped         |
| L04     | Honest live chrome                     | L01+L02 verified venue reach                 | UI honesty + venue proof         | Live available while hidden/redirect       |
| L05     | Safer APIs (invisible mostly)          | L02 APIs                                     | Replay tests                     | Optional/unneeded hardening                |

**Do not collapse:** configured · bound · connected · verified · authorized · executable · live.

---

# 14. WAVE 6 EXIT MATRIX

| Exit Requirement                           | Source                  | Required Package       | Required Evidence       | Current State                                 |
| ------------------------------------------ | ----------------------- | ---------------------- | ----------------------- | --------------------------------------------- |
| Paper default; live opt-in                 | Roadmap exit            | L01                    | Policy + ADR            | Missing ADR; not implemented                  |
| Certified + Gate PASS + human start        | Roadmap / Master Plan   | L01 + Gate             | Session admission tests | Gate exists; live admission OPEN              |
| Canonical live path                        | Roadmap exit            | L02                    | Path + venue evidence   | Unauthorized; not implemented                 |
| Append-only attributable place/cancel/kill | Roadmap / SEC-10/16     | L03                    | Audit evidence          | Not implemented                               |
| Kill Switch stops live eval/orders         | Roadmap exit            | L01/L02 + KS           | Live KS FIV             | Foundation only; live proof missing           |
| AI cannot start/approve/size               | Master Plan / exit      | All                    | Negative tests          | Invariant exists; live path N/A               |
| Honest live UI or hidden                   | Roadmap / LT-04         | L04                    | UI honesty + venue      | Hidden/redirect today; live UI not authorized |
| Approved live-capital ADR                  | Live gate               | Before live enablement | ADR approval record     | **MISSING**                                   |
| Replay protection live place/cancel        | Master Plan             | L05                    | Replay FIV              | Not implemented                               |
| Wave 5 COMPLETE                            | Rule 1 for irreversible | —                      | PO declaration          | **NOT COMPLETE** (deferred CM-15)             |

Trace: Master Plan → L01–L05 → Security → FIV → Consumer → Wave 6 Exit.
**Wave 6 COMPLETE: NOT declared.**

States: satisfied (W1–4 exit, paper path, foundations) · missing (ADR, impl, FIV) · deferred (CM-15 W5) · blocked (live FIV env OPEN) · OPEN (mechanisms/sequencing).

---

# 15. GOVERNANCE BOUNDARIES

### BEFORE LIVE-CAPITAL ADR APPROVAL

| May occur                          | May NOT occur                                  |
| ---------------------------------- | ---------------------------------------------- |
| Governance planning (this package) | Live money / live orders                       |
| Evidence analysis                  | Creating ADR **in this task** (not authorized) |
| PO decisions on sequencing         | Claiming live-capital authorization            |
|                                    | Enabling live workspace for capital            |
|                                    | Live UI implementation                         |

ADR **drafting** by Engineering / Architecture: permitted **only after** explicit PO / Governance **creation authorization** (D-GOV-04 **DECIDED**). This package does **not** grant that creation authorization. Drafting ≠ approval.

### BEFORE IMPLEMENTATION APPROVAL

| May occur                     | May NOT occur               |
| ----------------------------- | --------------------------- |
| Planning revision / PO review | Production code for L01–L05 |
| Open decisions resolution     | Schema/API/UI shipping      |

### BEFORE FIV PASS

Must **NOT** claim: verified live; production-ready live; customer-available live; venue-proven live.

### BEFORE WAVE 6 CLOSE

Must **NOT** claim: Wave 6 COMPLETE; Live Trading delivered; honest live UI available; Notification/Wave 5 COMPLETE by implication.

---

# 16. OPEN DECISIONS

### PO / GOVERNANCE

- ~~ADR ↔ L01 sequencing (A vs B)~~ — **DECIDED: Interpretation A** (approved ADR before V3-L01 implementation); see D-GOV-01
- ~~ADR creation / drafting / review / approval authority~~ — **DECIDED (D-GOV-04)**; see Decision Register / D-GOV-04 brief
- ~~Wave 5 → Wave 6 / Rule 1 blanket vs activity-specific~~ — **DECIDED: Interpretation C** (D-GOV-02); Wave 5 CLOSED not blanket prerequisite
- Explicit **create authorization act** for the Live-Capital ADR (authority belongs to PO / Governance per D-GOV-04; **not yet granted** by this package)
- Wave 5 COMPLETE with CM-15 deferred? (**D-GOV-03 OPEN**)
- Authorize implementation only after which gates? (**D-GOV-05 OPEN / NOT GRANTED**)
- Safe FIV venue / real-capital test constraints
- Live release gate

### CHIEF ARCHITECT / ARCHITECTURE

- ADR ID/path when creation authorized (do not invent now)
- L01–L05 slice decomposition
- Live Gate admission attributes
- SEC-16 integrity mechanism
- L05 replay mechanism
- L04 formal state model
- Live recovery/reconcile playbook

### SECURITY

- MFA for live enablement
- Live egress / SSRF / allowlist policy
- Credential compromise live runbook

### OPERATIONS / RELEASE

- Test venue provisioning
- Production live release checklist
- Kill Switch live incident runbook

### CONSUMER / PRODUCT

- Exact live UI copy/states
- What “Connected” means for live vs Wave 4 handshake

---

# 17. PLANNING APPROVAL READINESS

### Sufficiently defined for implementation **planning** (package identity)

- Wave 6 objective, exit criteria, L01–L05 names/capabilities, canonical path, forbidden architecture, Paper Freeze / ADR requirement, Rule 1, consumer honesty rules, security classification matrix, TD mapping, FIV structure.

### NOT sufficiently defined

- ADR↔L01 sequencing; ADR file; slices; integrity/replay mechanisms; L04 state enum; RK-03 contents; safe FIV venue; live admission attributes; MFA/UX details.

### Blocks **implementation**

- No implementation authorization; no approved live-capital ADR for live enablement/orders; OPEN sequencing; Rule 1 vs Wave 5 NOT COMPLETE for irreversible work.

### Blocks **FIV** (live path)

- No approved ADR / no authorized live test; **FIV BLOCKED — ENVIRONMENT REQUIRED** if no safe venue; no implementation to verify.

### Requires PO / Architect / Security / Ops

- See §16.

**Do NOT provide a single APPROVED verdict.** Status remains review-ready planning only.

---

## WAVE 6 PLANNING STATUS

```text
READY FOR PO / CHIEF ARCHITECT REVIEW
```

This is **NOT** implementation approval.

## MASTER PLAN TRACEABILITY

Master Plan §4 Wave 6 + Live gate + §16.8 → Roadmap L01–L05 + exit + Architecture → LT-01/02, RK-03, SEC-10/16, LT-04, SEC-08 remainder → Paper Freeze ADR-012…018 → Security/FIV/Consumer → Wave 6 Exit (not started).

## L01 — PLANNING

Expanded above. ADR required, not approved. Sequencing OPEN. Implementation NOT AUTHORIZED.

## L02 — PLANNING

Canonical path + 12 failure scenarios. Real-capital NOT AUTHORIZED.

## L03 — PLANNING

Attributable append-only integrity-protected log. Crypto/schema OPEN.

## L04 — PLANNING

Honest UI constraints. State machine NOT SPECIFIED. UI implementation NOT AUTHORIZED.

## L05 — PLANNING

Replay requirement AUTHORITATIVE; mechanism OPEN.

## SECURITY GATE

Matrix complete. Architecture ≠ authorization ≠ impl approval ≠ FIV.

## SAFETY / FAILURE MATRIX

Matrix complete; OPEN where unspecified.

## DEVELOPER / ARCHITECTURE REVIEW

Reuse/extension matrix; no second engine.

## CONSUMER REVIEW

Capability matrix; state vocabulary not collapsed.

## FIV READINESS

Matrix complete; L02 may be `FIV BLOCKED — ENVIRONMENT REQUIRED`; no FIV PASS.

## TECHNICAL DEBT MAPPING

TD-052/047/051/049/050/CM15 mapped; none closed.

## WAVE 6 EXIT MATRIX

Exit requirements traced; Wave 6 not complete.

## GOVERNANCE BOUNDARIES

Before ADR / before impl approval / before FIV / before Wave 6 close — documented.

## OPEN DECISIONS

§16 — PO, Architect, Security, Ops, Consumer.

## BLOCKERS

| Blocker                                                                                                       | Blocks                                                                                                             |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| No approved live-capital ADR                                                                                  | Live enablement, live orders, live authorization claims; **V3-L01 implementation** (per D-GOV-01 Interpretation A) |
| Live-Capital ADR not yet created / approved (D-GOV-04 chain defined but not executed)                         | Compliant production of the ADR that would satisfy D-GOV-01                                                        |
| Rule 1 irreversible product promises (esp. live UI) while Wave 5 NOT COMPLETE (**D-GOV-02 Interpretation C**) | Irreversible Wave 6 product promises; live UI remains NOT AUTHORIZED                                               |
| Wave 5 COMPLETE / CM-15 deferred (**D-GOV-03 OPEN**)                                                          | Wave 5 COMPLETE declaration only (not a blanket Wave 6 planning blocker)                                           |
| No implementation authorization (**D-GOV-05**)                                                                | All L01–L05 code                                                                                                   |
| Safe live FIV venue unspecified                                                                               | L02 live FIV (`FIV BLOCKED — ENVIRONMENT REQUIRED` if absent)                                                      |
| Slice/mechanism OPENs                                                                                         | Detailed implementation packages                                                                                   |

## NON-DECLARATIONS

This revision does **NOT** authorize: ADR creation; ADR approval; implementation; live UI implementation; live trading; real-capital movement; production release; FIV PASS; Wave 5 closure; CM-15 closure; Technical Debt closure; Wave 6 package closure.

**D-GOV-01** = **DECIDED — INTERPRETATION A ACCEPTED**.
**D-GOV-02** = **DECIDED — INTERPRETATION C ACCEPTED**. That does **not** close Wave 5, decide **D-GOV-03**, create/approve the ADR, grant **D-GOV-05**, or authorize implementation.
**D-GOV-04** = **DECIDED** (authority chain). That does **not** create or approve the ADR.

## STOP

STOP — D-GOV-02 Interpretation C synchronized into Planning Package. No Wave 5 closure. No ADR created or approved. No implementation authorized.
