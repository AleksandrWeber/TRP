# V3-L01 Slice Planning Proposal

**Document:** V3-L01 Slice Definition / Slice Planning Proposal  
**Date:** 2026-09-16  
**Package:** V3-L01 — Live capital ADR + workspace policy (LT-01)  
**Wave:** 6 — Live Trading  
**Nature:** Slice definition / planning proposal only. **Not** slice approval. **Not** implementation. **Not** FIV. **Not** live-capital activation. **Not** an ADR. **Not** a Master Plan / Roadmap revision.  
**Authority:** Engineering Architect under PO / Chief Architect governance process (draft for review)  
**Repository baseline:** `0841ff932af31e65929b3a2405f7c370c5312b10` (`docs(wave-6): approve v3-l01 package planning`)

```text
PROPOSED — NOT APPROVED

PROPOSED slice decomposition is not slice approval.
No V3-L01 implementation may begin from this artifact alone.
Each proposed slice requires PO / Chief Architect planning approval
before that slice may be opened or implemented.
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

**Naming note:** Wave 5 precedent uses package-letter IDs (`W5-N##-a…e`). No authoritative Wave 6 / V3-L01 slice ID scheme is established. This proposal uses **PROPOSED-V3-L01-S0x** labels only. PO / Chief Architect may rename (e.g. to `V3-L01-a…`) upon slice approval. Until then, IDs are **not** authoritative.

**Architecture reuse note (discovery only):** Existing owners include Workspace module, Trading Session (`ExecutionMode`), Runtime Enforcement Gate, Kill Switch under Trading Session, Identity/Auth permission matrix, Vault/Connections. Exact persistence/API shapes remain **OPEN** (ADR-020 / D-ARCH-02…04). This proposal does **not** invent those shapes.

---

## 1. Status

```text
PROPOSED — NOT APPROVED
```

| Field | Value |
| ----- | ----- |
| Slice decomposition | **PROPOSED** |
| Slice IDs | **PROPOSED only** (not authoritative) |
| Slice Planning Approval | **NOT GRANTED** |
| Implementation | **NOT AUTHORIZED** by this artifact |
| Package Planning Approval | **GRANTED** (prerequisite satisfied) |

---

## 2. Package

| Field | Value |
| ----- | ----- |
| **Package ID** | **V3-L01** |
| **Package name** | **Live capital ADR + workspace policy** |
| **Capability** | **LT-01** |
| **Approved planning proposal** | [`v3-l01-planning-proposal.md`](./v3-l01-planning-proposal.md) |
| **Planning review** | [`v3-l01-planning-review.md`](./v3-l01-planning-review.md) — **PASS** |
| **Package Planning Approval** | [`v3-l01-package-planning-approval.md`](./v3-l01-package-planning-approval.md) — **GRANTED** |

---

## 3. Governance Basis

| Prerequisite | Status |
| ------------ | ------ |
| Wave 6 Planning Approval | **GRANTED** |
| ADR-020 Accepted | **YES** |
| ADR-020 Architecture / Security / PO reviews | **PASS** |
| ADR-020 Final PO / Governance Approval | **GRANTED** |
| D-GOV-05 | **GRANTED** (wave-level; package/slice gates remain) |
| V3-L01 Planning Review | **PASS** |
| V3-L01 Package Planning Approval | **GRANTED** |
| Wave 5 | **NOT COMPLETE** / **NOT CLOSED** |
| CM-15 | **OPEN** / **DEFERRED** / **NON-BLOCKING** |
| Live-capital activation | **NOT AUTHORIZED** |

Evidence: Decision Register · ADR-020 · D-GOV-05 · V3-L01 package approval chain.

**Governance hygiene (non-blocking):** [`wave-6-planning-package.md`](./wave-6-planning-package.md) still contains stale “D-GOV-05 OPEN / ADR not created” lines relative to current Decision Register / ADR-020 / D-GOV-05. **Not amended by this task.**

---

## 4. Scope Boundary

### 4.1 Included (V3-L01 only)

- Workspace live policy under Paper-default / per-workspace live opt-in  
- Audited Admin + ADR enablement / disablement  
- Consume Session live-mode extension points (detail OPEN)  
- Consume Runtime Enforcement Gate as mandatory live-admission dependency (attributes OPEN)  
- Consume Kill Switch foundation for admission block when active (live runbook OPEN)  
- Human start preserved; AI cannot start/approve/size  
- Fail-closed on ambiguous / unauthorized / incomplete live-capital state  
- Enablement audit intent  
- Honesty: enablement ≠ executable live capital; L01 alone produces **no** venue orders  

### 4.2 Explicitly excluded

| Exclusion | Owner / later package |
| --------- | --------------------- |
| Live order I/O / live adapter venue binding | **V3-L02** |
| Tamper-evident financial action log | **V3-L03** |
| Honest live operator UI / unhiding `/trading/live` | **V3-L04** (Rule 1) |
| Replay-protection mechanism | **V3-L05** |
| Credential provisioning / Vault mutation for live trading keys | Ops / later gates |
| Live FIV (venue capital path) / FIV PASS claims | Ops / release |
| Production release / live-capital activation | Separate PO acts |
| Real-capital order submission | Forbidden until activation gates |
| Numeric thresholds / leverage / shorting / multi-currency | OPEN / OUT OF SCOPE |
| Second execution engine / parallel Bot / Gate bypass / second Kill Switch | Forbidden architecture |

---

## 5. Proposed Slice Decomposition

### Summary

| Proposed ID | Proposed name | Independently reviewable? | Later FIV? |
| ----------- | ------------- | ------------------------- | ---------- |
| **PROPOSED-V3-L01-S01** | Inventory & Honest Product Baseline | **YES** | **NO** (planning/inventory evidence only) |
| **PROPOSED-V3-L01-S02** | Workspace Live Policy Persistence & Defaulting | **YES** | **Optional later** policy-lab check (no live money) |
| **PROPOSED-V3-L01-S03** | Admin Enablement / Disablement & Audit | **YES** | **YES later** (authorized enable/disable in non-prod policy lab; no live orders) |
| **PROPOSED-V3-L01-S04** | Live Admission Foundation Wiring (Gate · KS · Session) | **YES** | **YES later** (fail-closed admission negatives; no venue / no live money) |

**Expected implementation order:** S01 → S02 → S03 → S04 (strict for safety; see §6).

---

### PROPOSED-V3-L01-S01 — Inventory & Honest Product Baseline

| Field | Content |
| ----- | ------- |
| **Proposed Slice ID** | **PROPOSED-V3-L01-S01** (**PROPOSED — NOT APPROVED**) |
| **Slice name** | Inventory & Honest Product Baseline |
| **Purpose** | Enumerate L01 surfaces and freeze honesty rules before any persistence or enablement API. |
| **Scope** | Inventory of: Workspace policy absence today; Session `ExecutionMode`; Runtime Enforcement Gate ports; Kill Switch foundation; Auth roles / `LiveCommand` / Admin; Paper Freeze reject surfaces; conformance flags (`liveCapitalAuthorized: false`). Document enablement ≠ execution; Paper default; no live UI. |
| **Explicit exclusions** | No schema migration; no enablement API; no Gate attribute invention; no credential work; no L02–L05; no UI. |
| **Dependencies** | V3-L01 Package Planning Approval; ADR-020 Accepted; existing W1–4 foundations. |
| **Existing architecture reused** | Workspace, Trading Session, `runtime-enforcement`, Kill Switch under Trading Session, Auth permission catalog/matrix, paper reject DTOs/adapters, platform-conformance matrices. |
| **ADR-020 requirements involved** | §1 Paper default; §2 separation principles (inventory only); §3 human auth inventory; §6 Gate mandatory; §5 KS consume; honesty / fail-closed. |
| **OPEN decisions required** | None to **ship inventory**. Lists OPEN items for later slices (does not resolve them). |
| **Acceptance criteria** | Inventory artifact complete; honesty rules recorded; no production code claiming live enablement; no silent OPEN closures. |
| **Security considerations** | Confirms Paper Freeze / fail-closed / Vault boundary remain; no bypass invented. |
| **Consumer/operator considerations** | States operators must not be told live trading is available. |
| **Developer considerations** | Small, reviewable; maps touch points without schema. |
| **Expected order** | **First** |
| **Independently reviewable** | **YES** |
| **Separate FIV later** | **NO** (documentation / inventory verification only) |

---

### PROPOSED-V3-L01-S02 — Workspace Live Policy Persistence & Defaulting

| Field | Content |
| ----- | ------- |
| **Proposed Slice ID** | **PROPOSED-V3-L01-S02** (**PROPOSED — NOT APPROVED**) |
| **Slice name** | Workspace Live Policy Persistence & Defaulting |
| **Purpose** | Persist per-workspace live opt-in/off under Workspace ownership with Paper as default for all existing workspaces. |
| **Scope** | Resolve-in-slice (via recorded architecture decision, not silent invention): representation & persistence of live policy; migration/defaulting to paper; structural separation at data/model level (not UI-only). Policy store only — **no** enablement API yet if sequencing prefers S03 for writes, **or** read-model + defaulting with writes gated to Admin path delivered in S03. Preferred: persistence + defaults in S02; mutating Admin API in S03. |
| **Explicit exclusions** | Admin enablement UX/API (S03); Gate attribute set (S04); live adapter; credentials; live UI; venue orders. |
| **Dependencies** | S01 complete/closed (or equivalently synchronized inventory); Workspace module ownership; ADR-020 §2. |
| **Existing architecture reused** | `apps/api/src/modules/workspace/` · Prisma WorkspaceRecord pattern · workspace isolation. |
| **ADR-020 items** | §2 workspace policy (mechanics OPEN → resolve for this slice); Paper default; opted-in supersession only. |
| **OPEN decisions required** | **BLOCKING OPEN before implementation:** workspace mechanics / persistence shape (D-ARCH-02 / W1–W5); migration defaulting (W5). |
| **Acceptance criteria** | Existing workspaces default paper; opted-in representation existable; non-opted remain paper-bound; no live orders; no UI claim of live. |
| **Security considerations** | Structural paper/live distinction; no secrets; fail-closed if policy state ambiguous. |
| **Consumer/operator considerations** | Default experience remains paper; no “live available” messaging. |
| **Developer considerations** | Bound to Workspace owner; no second tenant aggregate. |
| **Expected order** | **Second** (after S01) |
| **Independently reviewable** | **YES** |
| **Separate FIV later** | **Optional** policy-lab read/default checks; **no live money** |

---

### PROPOSED-V3-L01-S03 — Admin Enablement / Disablement & Audit

| Field | Content |
| ----- | ------- |
| **Proposed Slice ID** | **PROPOSED-V3-L01-S03** (**PROPOSED — NOT APPROVED**) |
| **Slice name** | Admin Enablement / Disablement & Audit |
| **Purpose** | Provide audited Admin + ADR enable/disable of workspace live policy; deny unauthorized actors. |
| **Scope** | Enablement/disablement control surface (API and/or Admin path — shape OPEN); authorization via existing Admin role / permission matrix extension as decided; audit of actor, workspace, timestamp, ADR-020 binding intent; negative tests (trader self-serve denied; AI cannot enable). |
| **Explicit exclusions** | MFA mechanism invention if still OPEN (defer or decide explicitly); live UI chrome; Gate live attribute productization beyond “policy enabled” flag; credentials; L02 execution; session start live path (S04). |
| **Dependencies** | S02 persistence available; Identity/Auth; ADR-020 §3. |
| **Existing architecture reused** | Auth roles, permission catalog (`RoleAdmin`, `LiveCommand` awareness), command authorization patterns; Workspace access. |
| **ADR-020 items** | §3 human authorization; Admin + ADR; audited enablement. |
| **OPEN decisions required** | **BLOCKING OPEN before implementation:** enablement API/control shape (W2); audit field schema (W4). **NON-BLOCKING OPEN:** MFA / detailed UX (W6) — may defer if Admin session auth + audit accepted for non-production policy-lab with explicit deferral record; MFA remains OPEN before production live activation (separately gated). **NON-BLOCKING OPEN:** role matrix beyond Admin (W7) unless PO expands. |
| **Acceptance criteria** | Unauthorized enable denied; Admin enable/disable audited; disable returns workspace to paper policy; enablement alone does **not** submit venue orders; AI cannot enable. |
| **Security considerations** | Least privilege; no Admin Gate/Risk bypass; connectivity ≠ authorization. |
| **Consumer/operator considerations** | Enablement ≠ executable live; operators not told “live trading on.” |
| **Developer considerations** | Careful permission-matrix change; do not unbound `LiveCommand` for all roles. |
| **Expected order** | **Third** (after S02) |
| **Independently reviewable** | **YES** |
| **Separate FIV later** | **YES** — non-prod policy lab enable/disable; **no credentials for live venue; no live orders** |

---

### PROPOSED-V3-L01-S04 — Live Admission Foundation Wiring (Gate · KS · Session)

| Field | Content |
| ----- | ------- |
| **Proposed Slice ID** | **PROPOSED-V3-L01-S04** (**PROPOSED — NOT APPROVED**) |
| **Slice name** | Live Admission Foundation Wiring (Gate · KS · Session) |
| **Purpose** | Wire fail-closed live-session admission **consumption** of workspace policy + Runtime Enforcement Gate + Kill Switch + Session live-mode extension — without live adapter, without venue, without L04 UI. |
| **Scope** | Session integration for live-mode admission checks (D-ARCH-04); consume Gate (mandatory; **do not bypass**); consume KS active ⇒ deny new live evaluation/admission; enforce ADR-020 minimum admission set **as checks against known foundations**, failing closed when attributes/credentials/Gate deny/KS active/policy off/human start missing; package-level negative evidence that L01 path cannot reach venue. |
| **Explicit exclusions** | Live adapter binding (L02); order live-mode fields productization for venue (L02); full KS incident runbook (OPEN); live UI (L04); credential provisioning; claiming live-capital activation; inventing numeric thresholds. |
| **Dependencies** | S01–S03; Runtime Enforcement Gate; Kill Switch foundation; Trading Session; ADR-020 §1/§5/§6/§9/§13. |
| **Existing architecture reused** | `runtime-enforcement` · Trading Session KS · Session aggregate `ExecutionMode` · paper reject paths remain for non-admitted. |
| **ADR-020 items** | §1 admission minimum; §5 KS; §6 Gate; §9 live execution distinctions; §13 fail-closed. |
| **OPEN decisions required** | **BLOCKING OPEN before claiming admission-complete:** live Gate admission attribute set (D-ARCH-03); Session live-mode integration detail (D-ARCH-04). **Allowed interim:** fail-closed deny of live session start when attributes unresolved / incomplete — must not soft-pass. **NON-BLOCKING OPEN:** KS live incident runbook detail (consume KS state now; runbook later); valid live credentials check may fail-closed on “no live credentials” without provisioning. |
| **Acceptance criteria** | Policy-off ⇒ cannot admit live; KS active ⇒ deny; Gate deny ⇒ fail-closed; missing/ambiguous state ⇒ no new live exposure; human start still required; AI cannot start; **no venue submit**; Paper remains default path. |
| **Security considerations** | Multi-gate preserved; no second Gate/KS; Vault untouched for provisioning; no bypass. |
| **Consumer/operator considerations** | No live chrome; no claim that admission foundation = live trading available. |
| **Developer considerations** | Extend Session/Gate/KS; do not create parallel engine; keep paper rejects for non-opted workspaces. |
| **Expected order** | **Fourth** (after S03) |
| **Independently reviewable** | **YES** |
| **Separate FIV later** | **YES** — admission negative tests / policy lab; **FIV of live venue path remains NOT AUTHORIZED** |

---

## 6. Proposed Dependency Order

```text
Existing foundations
  (W1–4 · Workspace · Session · Runtime Enforcement Gate · Kill Switch · Auth · Vault boundary · Paper Freeze rejects)
        ↓
PROPOSED-V3-L01-S01  Inventory & Honest Product Baseline
        ↓
PROPOSED-V3-L01-S02  Workspace Live Policy Persistence & Defaulting
        ↓
PROPOSED-V3-L01-S03  Admin Enablement / Disablement & Audit
        ↓
PROPOSED-V3-L01-S04  Live Admission Foundation Wiring (Gate · KS · Session)
        ↓
V3-L01 Package Completion / PO Package Review (separate act; not this proposal)
        ↓
V3-L02 … (out of scope)
```

**Parallelization:** **Not proposed.** S02–S04 have safety coupling (policy → enablement → admission). Parallel S02/S03 would risk enablement without durable defaults. Keep strict sequence.

---

## 7. ADR-020 OPEN Item Treatment

| OPEN / topic | Classification | Blocking? | Notes |
| ------------ | -------------- | --------- | ----- |
| Live-admission attributes (REG) | **A/B** — Required for V3-L01 slice planning (S04) and implementation | **BLOCKING OPEN** before S04 claims admission-complete | Fail-closed interim allowed; do not invent set here |
| Workspace mechanics | **A/B** — Required for S02 | **BLOCKING OPEN** before S02 implementation | D-ARCH-02 |
| MFA / UX | **A** planning visibility; **B** only if PO requires MFA before enablement API | **NON-BLOCKING OPEN** for S03 if Admin+audit+deferral recorded; remains OPEN before production activation | Do not invent MFA |
| L04 state enum | **D** — OUT OF SCOPE for V3-L01 | **NON-BLOCKING OPEN** (elsewhere) | L04 |
| L05 replay mechanism | **D** | **NON-BLOCKING OPEN** (elsewhere) | L05 |
| L03 integrity/schema/retention/key mgmt | **D** | **NON-BLOCKING OPEN** (elsewhere) | L03 |
| RK-03 | **C/D** — later L02 | **NON-BLOCKING OPEN** | L02 |
| SEC-16 mechanism choices | **D** | **NON-BLOCKING OPEN** | L03 |
| FIV venue | **C/D** — not L01 policy-lab | **NON-BLOCKING OPEN** for L01; blocks live venue FIV later | Ops |
| Recovery / reconcile detail | **C** — L02 | **NON-BLOCKING OPEN** | L02 |
| Secret-type policy / compromise runbook | **C** — L02/Ops | **NON-BLOCKING OPEN** | Vault boundary preserved; no provisioning in L01 |
| Release checklist | **C** | **NON-BLOCKING OPEN** | Ops |
| Kill Switch live runbook | **A/B** partial (S04 consumes KS); full runbook **C** | **NON-BLOCKING OPEN** for full runbook; **BLOCKING** only to consume durable KS state in S04 | Do not invent runbook |
| Numeric thresholds | **D** / OPEN | **NON-BLOCKING OPEN** | Not invented |
| Leverage / shorting / multi-currency | **D** — OUT OF SCOPE | **OUT OF SCOPE** | ADR-016 follow-up |
| Slice IDs | **A** — this proposal | **BLOCKING OPEN** until PO approves IDs/names | PROPOSED only now |
| Session live-mode integration detail | **A/B** — S04 | **BLOCKING OPEN** before S04 implementation complete | D-ARCH-04 |
| Enablement API shape / audit schema | **A/B** — S03 | **BLOCKING OPEN** before S03 implementation | W2/W4 |
| Order live-mode fields | **C** — L02 | **NON-BLOCKING OPEN** | L02 |

**No OPEN item is resolved by this proposal.**

---

## 8. Cross-Slice Safety Boundaries

| Risk | Prevention across S01–S04 |
| ---- | ------------------------- |
| Premature live activation | No slice authorizes activation; Paper default; enablement ≠ execution |
| Second execution path | Forbidden; Session/Gate/KS extended only |
| Live UI release | Excluded from all slices; L04 gated |
| Credential provisioning | Explicitly excluded; Vault boundary only |
| Real-capital execution | No live adapter; paper rejects preserved for non-admitted |
| Soft-pass incomplete admission | S04 must fail-closed when attributes/credentials/KS/Gate incomplete |
| Scope creep into L02–L05 | Exclusions per slice; package boundary §4.2 |
| Connectivity = authorization | Honesty rules in S01; preserved in S03/S04 |

---

## 9. Developer Review

**Verdict: PASS**

| Check | Result |
| ----- | ------ |
| Slices small enough to implement/review | **YES** — four bounded slices |
| Boundaries clear | **YES** — inventory → persist → enable → admit |
| Dependencies explicit | **YES** — strict S01→S04 |
| Meaningful acceptance criteria | **YES** — per slice |
| Sequencing practical | **YES** — matches safety coupling |
| Existing architecture reused | **YES** — Workspace/Session/Gate/KS/Auth/Vault |
| OPEN decisions visible | **YES** — §7 + per-slice OPEN |
| Hidden cross-slice coupling | **Managed** — sequential; no unsafe parallel |
| L02–L05 scope absorbed? | **NO** |

**Finding (non-blocking):** BLOCKING OPENs (workspace mechanics, enablement shape, Gate attributes, session live-mode detail, slice ID approval) must be resolved in per-slice planning before those slices implement — correctly not invented here.

---

## 10. Consumer / Operator Review

**Verdict: PASS**

| Check | Result |
| ----- | ------ |
| Workspace policy semantics understandable | **YES** — Paper default; opt-in; enable ≠ execute |
| Enablement ≠ execution | **YES** — S03/S04 explicit |
| Paper still default | **YES** |
| Avoids implying live trading available | **YES** — honesty baseline S01 |
| Operator-facing consequences explicit | **YES** |
| Hidden live UI scope? | **NO** |

---

## 11. Security Review

**Verdict: PASS**

| Check | Result |
| ----- | ------ |
| Paper Freeze preserved | **YES** |
| Multi-gate admission preserved | **YES** — S04 |
| Runtime Enforcement Gate preserved | **YES** — mandatory; no bypass |
| Kill Switch boundary preserved | **YES** — consume; no second KS |
| Vault boundary preserved | **YES** — no provisioning |
| No credential provisioning | **YES** |
| No real capital | **YES** |
| No bypass path | **YES** |
| Fail-closed preserved | **YES** |
| No authorization via connectivity alone | **YES** |
| No premature production activation | **YES** |
| No L02–L05 security duties silently absorbed | **YES** |

**No implementation security approval claimed.**

---

## 12. Slice Approval Gate

Lifecycle distinction (do **not** collapse):

```text
1. Slice Definition          ← this artifact (PROPOSED)
2. Slice Planning            ← per-slice planning package/summary when authorized
3. Slice Approval            ← PO / Chief Architect only
4. Implementation            ← only after that slice’s Approval
5. PO Review                 ← after implementation evidence
6. FIV where applicable      ← policy-lab only for L01; live venue FIV NOT AUTHORIZED
7. Final Close               ← separate PO package/slice close acts
```

```text
PROPOSED slice decomposition is not slice approval.
```

**Each proposed slice requires PO / Chief Architect planning approval before implementation.**

Opening rules (proposal intent — not inventing new authority):

1. Approve / rename slice IDs.  
2. Authorize S01 first.  
3. Authorize S02 only after S01 closed/synchronized (or explicit PO exception — none proposed).  
4. Authorize S03 only after S02.  
5. Authorize S04 only after S03.  
6. Resolve that slice’s BLOCKING OPENs in its planning before code.

---

## 13. Explicit Non-Authorizations

This artifact does **NOT** authorize:

- implementation of any V3-L01 slice  
- live UI  
- live-capital activation  
- production release  
- real-capital orders  
- credential provisioning  
- FIV (including live venue FIV)  
- approval of any proposed slice ID or slice  

```text
PROPOSED ≠ APPROVED
PACKAGE PLANNING APPROVED ≠ SLICE APPROVED
SLICE APPROVED ≠ LIVE READY
```

---

## NON-DECLARATIONS

- Does not amend ADR-020, historical reviews, or historical approval snapshots.  
- Does not synchronize stale `wave-6-planning-package.md` status lines.  
- Does not invent persistence schemas, admission attribute sets, MFA, or slice-authoritative IDs.  
- Does not claim V3-L01 implementation complete.

---

## STOP

**STOP.** V3-L01 Slice Planning Proposal produced.  
Status: **PROPOSED — NOT APPROVED.**  
Await PO / Chief Architect review and per-slice approvals.  
Do **not** implement. Do **not** open slices. Do **not** enable live capital. Do **not** commit/push as part of this planning task.
