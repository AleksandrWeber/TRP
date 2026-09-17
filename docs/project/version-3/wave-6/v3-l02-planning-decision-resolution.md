# V3-L02 Planning Decision Resolution

**Document:** V3-L02 Planning Decision Package (PO / Architecture / Security)
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 — Live order I/O on canonical path (LT-02)
**Nature:** Governance / planning decision resolution only. **Not** Planning Approval. **Not** Slice Approval. **Not** implementation authorization. **Not** implementation. **Not** FIV. **Not** live-capital activation.
**Authority:** Senior Staff Engineer / Chief Architect supporting Product Owner governance process
**Planning proposal:** [`v3-l02-planning-proposal.md`](./v3-l02-planning-proposal.md)
**Planning proposal commit:** `2b87753f5362bd9c2d51e9be969145eb314be16f`
**Repository baseline (this act):** `714ec18bb3f99845452a355715543dd7abd35f7a`
**ADR:** [`docs/adr/ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)
**Decision Register:** [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md)

```text
V3-L02 IMPLEMENTATION IS NOT AUTHORIZED BY THIS ARTIFACT.
```

Protected dirty/untracked leftovers outside this artifact were **not** modified.

---

## 1. Executive Summary

This package processes every PO / Architecture / Security decision surfaced by the V3-L02 Planning Proposal. It **classifies and escalates**; it does **not** grant Planning Approval, Slice Approval, or implementation authorization.

| Class | Count (approx.) | Meaning |
| ----- | --------------- | ------- |
| **REQUIRES PO DECISION** | Majority of PO-L02-01…16 | Product/financial/authorization policy still OPEN |
| **REQUIRES ARCHITECTURE DECISION** | AD-L02-01…14 (most) | Technical design choices pending Architect review |
| **REQUIRES SECURITY DECISION** | SD-L02-01…07 | Security posture pending Security review |
| **RESOLVED BY EXISTING AUTHORITY** | Binding Rules A–J; AD-L02-01 direction; C7 non-activation default; capital-path shape | Already decided by ADR-020 / S04 / Planning Package — do not reopen |
| **OUT OF SCOPE** | L03 / L04 / L05; withdrawals/transfers (unless PO expands); FIV; activation | Must not be absorbed into L02 |

**Hard blockers before any L02 Slice Approval / implementation:**

1. **PO-L02-01** venue matrix (MOCK vs real / testnet vs mainnet)
2. **PO-L02-02** capital-movement scope (order-induced only vs banking)
3. **PO-L02-04** + **SD-L02-03** authorization cell (C7 remains deny-all unless new PO act)
4. **PO-L02-08** Kill Switch open-order policy
5. **PO-L02-13** + **AD-L02-07/09/11** UNKNOWN / idempotency / crash-window contract
6. **AD-L02-04** + **PO-L02-05** human-start durability for multi-instance I/O
7. **SD-L02-01** egress allowlist before any real venue adapter

**Recommended next governance step:** PO Decision Session on PO-L02-01…16 (priority blockers first) → Architecture Review of AD-L02-01…14 → Security Review of SD-L02-01…07 → then Planning Approval act (separate).

---

## 2. Current Governance State

| Item | Status |
| ---- | ------ |
| Wave 6 Planning | **APPROVED** |
| ADR-020 | **ACCEPTED** |
| D-GOV-05 | **GRANTED** (wave-level; package/slice gates remain) |
| V3-L01-S01…S04 | **CLOSED** (S04 Final Close GRANTED; impl `cc3ca922…`) |
| V3-L01 package | **NOT CLOSED** |
| V3-L02 Planning Proposal | **COMPLETE** (`2b87753…`) |
| V3-L02 Planning Approval | **NOT GRANTED** |
| V3-L02 Slice Approval | **NOT GRANTED** |
| V3-L02 IMPLEMENTATION | **NOT AUTHORIZED** |
| L03 / L04 / L05 | **NOT AUTHORIZED** |
| Live capital | **NOT ACTIVATED** |
| FIV | **NOT PERFORMED** |
| Wave 6 | **NOT COMPLETE** |
| LiveCommand / C7 | **DENY-ALL / UNBOUND** |
| `paperFreeze` | **true** (authoritative) |
| `liveCapitalAuthorized` | **false** (authoritative) |

Note: S04 is **CLOSED**, not merely “Slice Approved.” This artifact does not reopen S04.

---

## 3. PO-L02-01 … PO-L02-16

Status vocabulary: **RESOLVED BY EXISTING AUTHORITY** · **REQUIRES PO DECISION** · **REQUIRES ARCHITECTURE DECISION** · **REQUIRES SECURITY DECISION** · **OUT OF SCOPE**

### PO-L02-01 — Supported venue matrix

| Field | Content |
| ----- | ------- |
| **Question** | Which venue(s) and environment (MOCK / testnet / mainnet) are in L02 scope? |
| **Why** | Bounds adapter work, FIV, credential policy, SSRF/egress, accidental mainnet risk |
| **Repo evidence** | MOCK full in-process I/O; BINANCE/BYBIT/OKX `VenueExchangeAdapter` submit/cancel **throw**; Binance handshake real (API restrictions only); not on canonical `ExecutionAdapterPort` |
| **ADR/gov** | D-ARCH-08 OPEN; D-OPS-01 OPEN; ADR-020 live adapter after gates |
| **Options** | **A** MOCK/harness only · **B** single venue testnet · **C** single venue mainnet-gated · **D** multi-venue · **E** defer real venue to later slice |
| **Consequences** | A = no real capital, safest shape proof · B = FIV-capable without mainnet · C/D = production risk · E delays AC-09 |
| **Security** | C/D require SD-L02-01/02/04 before I/O |
| **Operator** | Must not claim Live-ready for stub venues |
| **Safe default (non-binding)** | Sequence: shape on MOCK (S03) → PO picks one testnet venue before S04 real I/O |
| **PO approval required?** | **YES** |
| **Status** | **REQUIRES PO DECISION** (+ Ops) |

### PO-L02-02 — “Real capital movement” meaning

| Field | Content |
| ----- | ------- |
| **Question** | Does L02 include only order-induced exposure (submit/cancel/fill/position/ledger) or also transfers/withdrawals/deposits? |
| **Why** | Prevents silent banking scope expansion |
| **Repo evidence** | LT-02 / Planning Package path: Risk→Orders→Execution→adapter→Venue→Fill→Position→Ledger; no withdrawal/transfer execution flow |
| **ADR/gov** | ADR-020 “real-capital orders”; Planning Package L02 table |
| **Options** | **A** order-induced only · **B** include transfers/withdrawals · **C** defer transfers forever |
| **Consequences** | A aligns with LT-02 · B invents new product · C clarifies non-goal |
| **Security** | B expands credential permission surface (withdraw flags exist on connectivity, not order path) |
| **Operator** | A matches “place/cancel live orders”; B implies treasury product |
| **Safe default** | **A** as planning interpretation pending PO confirmation (do not implement B) |
| **PO approval required?** | **YES** (confirm A or expand) |
| **Status** | **REQUIRES PO DECISION** — recommended interpretation **A** until PO confirms |

### PO-L02-03 — Live order types / instruments

| Field | Content |
| ----- | ------- |
| **Question** | Which order types/instruments are allowed on live path? |
| **Why** | Adapter + Risk surface; partial fills |
| **Repo evidence** | Paper market/limit; `partialFills: false`; exchange domain has PARTIALLY_FILLED |
| **ADR/gov** | ADR-016 expansions OPEN; D-ARCH-09 RK-03 OPEN |
| **Options** | **A** market+limit spot only · **B** expand · **C** venue-defined subset |
| **Safe default** | **A** for first live slice |
| **PO approval required?** | **YES** |
| **Status** | **REQUIRES PO DECISION** (+ Arch) |

### PO-L02-04 — Activate LiveCommand / C7?

| Field | Content |
| ----- | ------- |
| **Question** | How are live place/cancel APIs authorized if C7 remains deny-all? |
| **Why** | No live API can succeed without an authz cell; PO-S04-02 forbids silent C7 activation |
| **Repo evidence** | `PermissionClass.LiveCommand` never granted; `/v1/live` C7-gated |
| **ADR/gov** | PO-S04-01/02; ADR-020 human auth ≠ C7 auto-enable |
| **Options** | **A** keep C7 deny-all + alternate PermissionClass/cell · **B** activate C7 for named roles · **C** new PermissionClass |
| **Consequences** | B is irreversible authz expansion · A/C need design |
| **Security** | See **SD-L02-03**; Rule G — do not activate C7 in this act |
| **Safe default** | **Do not activate C7** in L02 planning; require explicit later PO act for B |
| **PO approval required?** | **YES** |
| **Status** | **REQUIRES PO DECISION** (+ Security) — **not** resolved by this artifact |

### PO-L02-05 — Human-start granularity

| Field | Content |
| ----- | ------- |
| **Question** | Per-I/O vs session-scoped vs hybrid human-start for live execution? |
| **Why** | S04 consume-on-evaluate burns token; multi-order sessions need a model |
| **Repo evidence** | In-memory store; 15m TTL; single-use; actor/workspace/session bound |
| **ADR/gov** | PO-S04-06; ADR-020 §3 |
| **Options** | **A** per I/O issue+consume · **B** session-scoped durable · **C** hybrid |
| **Consequences** | A safest/friction · B needs durable store (AD-L02-04) · C mixed |
| **Security** | In-memory insufficient for multi-instance (see AD-L02-04) |
| **Safe default** | Prefer **A** until durable model approved |
| **PO approval required?** | **YES** |
| **Status** | **REQUIRES PO DECISION** (+ **REQUIRES ARCHITECTURE DECISION** via AD-L02-04) |

### PO-L02-06 — Actor authz loss with open venue orders

| Field | Content |
| ----- | ------- |
| **Question** | If actor loses authz after admission / with open venue order, what happens? |
| **Why** | Security vs orphan capital |
| **Repo evidence** | Revalidate before new I/O; no auto venue cancel |
| **Options** | **A** block new only · **B** force cancel · **C** freeze+runbook |
| **Safe default** | **A** + runbook (no invented liquidation) |
| **PO approval required?** | **YES** |
| **Status** | **REQUIRES PO DECISION** |

### PO-L02-07 — Cancel under KS / re-admission

| Field | Content |
| ----- | ------- |
| **Question** | Does cancel require full re-admission? May cancel proceed when KS ACTIVE? |
| **Why** | Cancel may reduce exposure or be abused |
| **Repo evidence** | Not specified; S04 DENYs live admission when KS ACTIVE |
| **Options** | **A** full re-admit for cancel · **B** KS allows cancel-only · **C** deny all live I/O including cancel |
| **Safe default** | None — trade-off between capital bleed and fail-closed purity |
| **PO approval required?** | **YES** |
| **Status** | **REQUIRES PO DECISION** (+ Arch) |

### PO-L02-08 — Kill Switch vs outstanding venue orders

| Field | Content |
| ----- | ------- |
| **Question** | On KS ACTIVE with orders at venue: block-new only, venue cancel, both, or defer runbook? |
| **Why** | Capital bleed vs accidental liquidation (Rule H) |
| **Repo evidence** | Durable KS does **not** execute halt/cancel; EmergencyManager (non-canonical, C7) cancels local only; Planning Package #9 states intent “cancel pending per ADR-016” but live proof OPEN |
| **ADR/gov** | ADR-020 §5 OPEN runbook; Rule H this package; Planning Package L02 #9 |
| **Options** | **A** block-new only · **B** venue cancel · **C** both · **D** runbook later (block-new now) |
| **Consequences** | B/C need cancel semantics + credentials + PO-L02-07 · A leaves exposure · D is honest deferral |
| **Security** | Auto-cancel without approval is dangerous; inventing liquidation forbidden |
| **Operator** | Must know open orders may remain at venue under A/D |
| **Safe default** | **D** for first L02 exit: **block new** AUTHORITATIVE now; venue cancel **not** auto-implemented until PO chooses B/C |
| **PO approval required?** | **YES** |
| **Status** | **REQUIRES PO DECISION** — **do not implement auto venue cancel** |

### PO-L02-09 — Policy disable with open live orders

| Field | Content |
| ----- | ------- |
| **Question** | On `LIVE_POLICY_OPTED_IN`→`PAPER` with open live orders: block-new / forbid disable / auto-cancel / runbook? |
| **Why** | S03 disable is policy-only today |
| **Repo evidence** | PO-S03-09: disable → PAPER ONLY; no exchange ops |
| **Options** | **A** block-new · **B** forbid disable until flat · **C** auto-cancel · **D** runbook |
| **Safe default** | **A** or **B**; **not** C without PO |
| **PO approval required?** | **YES** |
| **Status** | **REQUIRES PO DECISION** — governance artifacts do **not** define open-order behavior |

### PO-L02-10 — Session termination with open live orders

| Field | Content |
| ----- | ------- |
| **Question** | Same option class as PO-L02-09 for session end/invalidation |
| **Why** | Orphan venue exposure |
| **Repo evidence** | Dual session models; S04 eligibility DENY on invalid session |
| **Safe default** | Block new I/O; open-order policy paired with PO-L02-08/09 |
| **PO approval required?** | **YES** |
| **Status** | **REQUIRES PO DECISION** (+ Arch residual on session model) |

### PO-L02-11 — Credential environment (testnet/mainnet)

| Field | Content |
| ----- | ------- |
| **Question** | Testnet-only until release vs mainnet-gated vs dual purpose slots? |
| **Why** | Accidental mainnet; Binance handshake uses `api.binance.com` today |
| **Options** | **A** testnet-only until release · **B** mainnet with separate gate · **C** both with purpose slots |
| **Safe default** | **A** until activation/FIV gates |
| **PO approval required?** | **YES** (+ Ops + Sec) |
| **Status** | **REQUIRES PO DECISION** (+ **REQUIRES SECURITY DECISION** SD-L02-02) |

### PO-L02-12 — RK-03 / limits

| Field | Content |
| ----- | ------- |
| **Question** | Numeric limits / RK-03 contents for live? |
| **Why** | Risk; AC-27 forbids inventing thresholds |
| **Repo evidence** | D-ARCH-09 OPEN |
| **Options** | Defer · Approve specific RK-03 · External risk service |
| **Safe default** | **Defer numeric invention**; mandatory Risk Decision remains |
| **PO approval required?** | **YES** before claiming RK-03 complete |
| **Status** | **REQUIRES PO DECISION** (+ Arch) — may be **non-blocking** for early slices if deferred explicitly |

### PO-L02-13 — Idempotency / ambiguous submit product policy

| Field | Content |
| ----- | ------- |
| **Question** | Adopt reconcile-first + venue clientOrderId as binding product policy? |
| **Why** | Duplicate capital on lost-response |
| **Repo evidence** | Paper uniques strong; live reconcile OPEN; Rules B/C |
| **Options** | Reconcile-first · Require venue clientOrderId · Other |
| **Safe default** | **Reconcile-first + clientOrderId required** (product policy recommendation) |
| **PO approval required?** | **YES** (confirm) |
| **Status** | **REQUIRES PO DECISION** (+ Arch AD-L02-09) — Rules B/C already binding |

### PO-L02-14 — Reconciliation / balance SoT for L02 exit

| Field | Content |
| ----- | ------- |
| **Question** | Minimal query-reconcile vs full balance sync vs defer balances? |
| **Why** | Completeness vs L03 |
| **Safe default** | **Minimal query-reconcile by clientOrderId/adapterOrderId** for L02 exit |
| **PO approval required?** | **YES** |
| **Status** | **REQUIRES PO DECISION** (+ Arch) |

### PO-L02-15 — Extra confirmation / MFA beyond S04 human-start

| Field | Content |
| ----- | ------- |
| **Question** | No extra · MFA later · per-order confirm? |
| **Why** | ADR-020 MFA OPEN; PO-S03-10 deferred MFA |
| **Safe default** | **No extra for L02 code**; MFA at production activation |
| **PO approval required?** | **YES** (or accept deferral) |
| **Status** | **REQUIRES PO DECISION** (+ SD-L02-07) — may be **non-blocking** for implementation shape |

### PO-L02-16 — Ship L02 code while V2 anchors deny?

| Field | Content |
| ----- | ------- |
| **Question** | May L02 land “dark” behind fail-closed anchors, or require anchor flip for any live path? |
| **Why** | Deploy ≠ activate |
| **Repo evidence** | Anchors hard DENY; Rule on deploy safety |
| **Options** | **A** code dark (anchors deny) · **B** require anchor flip for prod-like tests |
| **Safe default** | **A** — deploy must not activate; anchors remain deny until separate act |
| **PO approval required?** | **YES** |
| **Status** | **REQUIRES PO DECISION** (+ Sec) |

---

## 4. AD-L02-01 … AD-L02-14

### AD-L02-01 — Canonical live path vs live-trading-engine

| Field | Content |
| ----- | ------- |
| **Question** | Which path is SoT for live I/O? |
| **Canonical components** | `CanonicalOrderPathService` → Risk → Ledger reservation → `ExecutionEngineService` → `ExecutionAdapterPort` |
| **Precedent** | ADR-012; ADR-020 §4 “extends path; no second engine” |
| **Proposed** | **Canonical path only**; freeze/deprecate `live-trading-engine` as SoT |
| **Alternatives** | Promote parallel prototype (rejected by ADR-020) |
| **Coupling** | Low if prototype frozen; high if dual |
| **Failure/concurrency/persistence** | Single SM + paper persistence evolution |
| **New SoT?** | No — extends existing |
| **ADR violation if dual SoT?** | **Yes** (ADR-020 §4) |
| **Arch approval?** | Confirm freeze of prototype |
| **Status** | **RESOLVED BY EXISTING AUTHORITY** (ADR-020) — Architect should **confirm** freeze; do not promote parallel path |

### AD-L02-02 — Extend ExecutionAdapterPort for live

| Field | Content |
| ----- | ------- |
| **Question** | Generalize port vs parallel live port (still single engine entry)? |
| **Existing** | Paper-typed `ExecutionAdapterPort` |
| **Proposed** | Prefer **generalized port** with mode discrimination + unknown outcomes; engine remains sole caller |
| **Alternatives** | Live-only port Symbol still only called by Engine |
| **New SoT?** | No |
| **Arch approval?** | **YES** |
| **Status** | **REQUIRES ARCHITECTURE DECISION** |

### AD-L02-03 — Order live-mode field / persistence

| Field | Content |
| ----- | ------- |
| **Question** | How is live mode represented on intent/PaperOrder (or successor)? |
| **Existing** | Intent forced `paper` |
| **Proposed** | Explicit mode field; never infer live from connectivity |
| **New SoT?** | Extends Order aggregate — still Orders-owned |
| **Arch approval?** | **YES** |
| **Status** | **REQUIRES ARCHITECTURE DECISION** |

### AD-L02-04 — Human-start durability + I/O revalidation (CRITICAL)

| Field | Content |
| ----- | ------- |
| **Question** | Is S04 in-memory consume-on-evaluate safe for L02 multi-instance financial I/O? |
| **Existing** | `InMemoryHumanStartProofStore`; TTL 15m; single-use; hash-only |
| **Analysis** | |
| | **Multi API instances:** proofs not shared → fail-closed or false DENY; cannot share ALLOW |
| | **Process restart:** all proofs lost → fail-closed (safe) but operability break |
| | **Worker retry:** burned token → HUMAN_START_REPLAYED; must re-issue |
| | **Concurrent requests:** race on consume → one wins, other replayed (safe fail-closed) |
| | **Stale authz:** revalidation still required; start proof ≠ lasting grant |
| **Verdict** | Safe as **fail-closed** for single-process harness; **insufficient** as production multi-instance SoT for live I/O |
| **Proposed** | Do **not** silently replace; Architect chooses: (1) keep in-memory + per-I/O re-issue on same instance only (dev/harness), (2) durable session-bound proof store with single-use/TTL, (3) hybrid |
| **Alternatives** | Listed; must not weaken PO-S04-06 |
| **New SoT?** | If durable store added — new persistence; must stay Session/admission-owned, not Vault |
| **ADR violation?** | Silent JWT=start would violate ADR-020 |
| **Arch approval?** | **YES** |
| **Status** | **REQUIRES ARCHITECTURE DECISION** (blocks production live I/O; linked to PO-L02-05) |

### AD-L02-05 — Workspace-bound credentialed adapter session

| Field | Content |
| ----- | ------- |
| **Question** | How does live adapter retrieve Vault secrets per workspace? |
| **Existing** | Vault workspace AAD; Connections `vaultSecretId`; ExchangeFactory credential-less |
| **Proposed** | Retrieve-at-I/O inside adapter; workspace-bound; never log |
| **New SoT?** | No — Vault remains SoT |
| **Arch approval?** | **YES** |
| **Status** | **REQUIRES ARCHITECTURE DECISION** |

### AD-L02-06 — Live ExecutionAdapter ↔ ExchangeAdapter types

| Field | Content |
| ----- | ------- |
| **Question** | Reuse exchange-adapter types inside ExecutionAdapter or keep separate? |
| **Proposed** | ExecutionAdapter owns live I/O; may wrap venue client internally; Orders/Engine must not call ExchangeAdapterService |
| **Arch approval?** | **YES** |
| **Status** | **REQUIRES ARCHITECTURE DECISION** |

### AD-L02-07 — UNKNOWN / reconcile order state

| Field | Content |
| ----- | ------- |
| **Question** | How to represent uncertain venue outcome on Order SM? |
| **Existing** | No UNKNOWN in `OrderStatus`; paper query `outcome: 'unknown'` |
| **Proposed** | First-class unknown / reconciliation_required; never map to REJECTED/FILLED |
| **New SoT?** | Extends Order lifecycle |
| **Arch approval?** | **YES** |
| **Status** | **REQUIRES ARCHITECTURE DECISION** (binding Rule B) |

### AD-L02-08 — Cancel idempotency / terminal races

| Field | Content |
| ----- | ------- |
| **Question** | Semantics for already filled/cancelled/unknown cancel |
| **Proposed** | Venue truth wins; idempotent no-op when already cancelled; filled beats cancel; unknown cancel stays unknown |
| **Arch approval?** | **YES** |
| **Status** | **REQUIRES ARCHITECTURE DECISION** |

### AD-L02-09 — Live clientOrderId / idempotency contract

| Field | Content |
| ----- | ------- |
| **Question** | Exact clientOrderId + local key contract for live |
| **Proposed** | Workspace-unique local keys **and** venue-visible clientOrderId; reconcile before retry |
| **Not L05** | Order-level only |
| **Arch approval?** | **YES** |
| **Status** | **REQUIRES ARCHITECTURE DECISION** (+ PO-L02-13) |

### AD-L02-10 — Timeout / retry / backoff

| Field | Content |
| ----- | ------- |
| **Question** | Budgets and classification of timeout as UNKNOWN |
| **Existing** | No venue timeouts in stubs |
| **Proposed** | Timeout ⇒ UNKNOWN; no blind retry (Rule C) |
| **Arch approval?** | **YES** |
| **Status** | **REQUIRES ARCHITECTURE DECISION** (D-ARCH-06) |

### AD-L02-11 — Persist-before-send vs send-before-persist

| Field | Content |
| ----- | ------- |
| **Question** | Crash window design for orphan venue orders |
| **Proposed** | Durable “submit intent / unconfirmed” **before or atomically around** send; reconcile on recovery |
| **Arch approval?** | **YES** |
| **Status** | **REQUIRES ARCHITECTURE DECISION** (D-ARCH-18) |

### AD-L02-12 — API / command surface

| Field | Content |
| ----- | ------- |
| **Question** | Extend canonical Orders vs internal worker-only vs `/v1/live` |
| **Proposed** | Prefer canonical Orders/Execution; do not productize `/v1/live` as SoT |
| **Arch approval?** | **YES** |
| **Status** | **REQUIRES ARCHITECTURE DECISION** |

### AD-L02-13 — Live reservation / exposure vs paper cash

| Field | Content |
| ----- | ------- |
| **Question** | Reuse paper cash reservation or distinct live exposure model? |
| **Proposed** | Do not silently reuse paper cash semantics for venue balances; design explicit exposure control |
| **Arch approval?** | **YES** |
| **Status** | **REQUIRES ARCHITECTURE DECISION** |

### AD-L02-14 — Slice decomposition

| Field | Content |
| ----- | ------- |
| **Question** | Accept PROPOSED-V3-L02-S01…S06? |
| **Proposed** | Retain proposed six-slice decomposition (see §16) |
| **Arch approval?** | **YES** (D-ARCH-01 L02 portion) |
| **Status** | **REQUIRES ARCHITECTURE DECISION** (+ PO for naming retention) |

---

## 5. SD-L02-01 … SD-L02-07

### SD-L02-01 — Egress allowlist / fixed venue endpoints (SSRF)

| Field | Content |
| ----- | ------- |
| **Threat** | Operator/attacker-influenced URL → SSRF / data exfil |
| **Existing** | Fixed Binance handshake host; stubs; no live order egress |
| **Proposed L02 control** | Hardcoded allowlisted venue endpoints per approved matrix; no free-form URL |
| **Failure mode** | Misconfigured allowlist → wrong environment |
| **Residual risk** | Supply-chain / DNS if not pinned |
| **Existing sufficient?** | **No** for live I/O |
| **New subsystem?** | Policy/config in adapter — not a new product BC |
| **Security approval?** | **YES** |
| **Status** | **REQUIRES SECURITY DECISION** |

### SD-L02-02 — Live secret-type / purpose (testnet separation)

| Field | Content |
| ----- | ------- |
| **Threat** | Mainnet key used in test path or vice versa |
| **Existing** | Vault types binance/bybit/okx; purpose `trading`; TESTNET catalog unused |
| **Proposed** | Explicit purpose/environment separation per PO-L02-11 |
| **Existing sufficient?** | **Partial** |
| **Security approval?** | **YES** |
| **Status** | **REQUIRES SECURITY DECISION** |

### SD-L02-03 — C7 activation posture

| Field | Content |
| ----- | ------- |
| **Threat** | Over-broad live command grant |
| **Existing** | C7 deny-all |
| **Proposed** | Keep deny-all until explicit PO+Sec act; prefer narrow cell if needed |
| **Existing sufficient?** | For current non-activation **Yes** |
| **Security approval?** | **YES** before any grant |
| **Status** | **REQUIRES SECURITY DECISION** (+ PO-L02-04) — Rule G binding until then |

### SD-L02-04 — TLS / certificates

| Field | Content |
| ----- | ------- |
| **Threat** | MITM on venue calls |
| **Existing** | HTTPS handshake to Binance |
| **Proposed** | TLS required; no insecure custom endpoints |
| **Existing sufficient?** | Pattern exists; must be mandatory on live adapter |
| **Security approval?** | **YES** (confirm standard) |
| **Status** | **REQUIRES SECURITY DECISION** |

### SD-L02-05 — Logging / redaction

| Field | Content |
| ----- | ------- |
| **Threat** | Secret/PII leakage in logs/errors |
| **Existing** | Vault audit metadata-only; S04 public vs diagnostic reasons |
| **Proposed** | Extend redaction to live I/O errors; never log keys/signatures |
| **Existing sufficient?** | **Mostly** if preserved |
| **Security approval?** | **YES** (confirm live error paths) |
| **Status** | **REQUIRES SECURITY DECISION** |

### SD-L02-06 — Rate limits / abuse

| Field | Content |
| ----- | ------- |
| **Threat** | Runaway bots / DoS against venue / self |
| **Existing** | Nest throttler globally; no live place limits |
| **Proposed** | Per-workspace/actor rate limits on live place/cancel |
| **Existing sufficient?** | **No** specifically for live |
| **Security approval?** | **YES** |
| **Status** | **REQUIRES SECURITY DECISION** (+ Arch) |

### SD-L02-07 — MFA timing

| Field | Content |
| ----- | ------- |
| **Threat** | Stolen session performs live I/O |
| **Existing** | MFA field exists; not wired as live-start; PO-S03-10 deferred |
| **Proposed** | MFA at production activation, not silently in L02 unless PO requires |
| **Security approval?** | **YES** |
| **Status** | **REQUIRES SECURITY DECISION** (+ PO-L02-15) |

**Cross-cutting security coverage required by this package:** SSRF/egress (SD-01); credential isolation/Vault (existing + SD-02); duplicate orders (Rules B/C + AD-09); lost responses (AD-07/10/11); replay/stale admission (S04 revalidation + AD-04); KS (PO-08 + Rule H); workspace isolation (Vault AAD); false success (Rule A); UNKNOWN (Rule B).

---

## 6. Financial Safety Boundary (BINDING)

Unless an authoritative governance artifact explicitly supersedes:

| Rule | Statement |
| ---- | --------- |
| **A** | No false success — local accept ≠ venue submitted |
| **B** | UNKNOWN is first-class — timeout after possible accept ≠ REJECTED |
| **C** | No blind retry — reconcile before potential duplicate submit |
| **D** | Paper ≠ Live — paper path unchanged/default |
| **E** | ALLOW ≠ submitted ≠ filled |
| **F** | S04 revalidation immediately before irreversible venue I/O |
| **G** | Do not activate/grant/redesign C7 in this act |
| **H** | KS ACTIVE prevents new live admission/submit; no auto cancel-all unless PO approves |
| **I** | `LIVE_POLICY_OPTED_IN` ≠ execution authorization |
| **J** | JWT alone ≠ human-start |

**Status:** **RESOLVED BY EXISTING AUTHORITY** (this package + ADR-020 + S04 + Planning Proposal honesty rules).

---

## 7. Venue Scope

| Venue | Status | Canonical ExecutionAdapter? | Production-capable order I/O? |
| ----- | ------ | --------------------------- | ----------------------------- |
| **MOCK** | Implemented simulation | No (exchange-adapter factory) | Sim only |
| **BINANCE** | Stub submit/cancel; handshake real | No | **No** |
| **BYBIT** | Stub; handshake not_implemented | No | **No** |
| **OKX** | Stub; handshake not_implemented | No | **No** |
| **PaperExecutionAdapter** | Canonical paper | **Yes** | Paper only (`liveCapital: false`) |

**Proposed L02 venue scope:** **PO-L02-01 REQUIRED.** Planning recommendation: MOCK/harness for S03 shape → single PO-approved testnet before real capital path.

Do **not** claim production live capability because adapter classes exist.

---

## 8. Capital Scope

| In LT-02 path (recommended A) | Not evidenced as L02 |
| ----------------------------- | -------------------- |
| Submit / cancel | Transfers |
| Fills | Withdrawals |
| Positions (from fills) | Deposits / funding |
| Ledger effects via existing ownership | Arbitrary banking |

**Status:** **REQUIRES PO DECISION** (PO-L02-02). Safe planning interpretation: **order-induced only**.

---

## 9. Idempotency / UNKNOWN Semantics

### Lost-response sequence (binding safety requirement)

```text
Client → L02 → Venue submit → Venue accepts → response lost → L02 timeout
```

| Concern | Requirement |
| ------- | ----------- |
| Local idempotency key | Required; workspace-unique |
| Venue clientOrderId | Required; used for query |
| Persistence | Mark UNKNOWN / unconfirmed — not REJECTED |
| Reconciliation | Query venue by clientOrderId/adapter id **before** any resubmit |
| Retry | Forbidden while UNKNOWN without reconcile (Rule C) |
| Duplicate prevention | Local uniques **insufficient alone** |

**Status:** Rules B/C binding; mechanism detail **REQUIRES ARCHITECTURE DECISION** (AD-L02-07/09/10/11) + **PO-L02-13** confirm.

---

## 10. Cancel Semantics

| Situation | Known? | Representation |
| --------- | ------ | -------------- |
| Already filled | Yes (venue/local) | Remain filled; cancel no-op / deny |
| Already cancelled | Yes | Idempotent cancelled |
| Not found | Depends | May be unknown if race with accept |
| Cancel accepted, response lost | **Unknown** | UNKNOWN cancel; reconcile |
| Network timeout / venue unavailable | **Unknown** or deny-new | No false cancelled |
| HTTP ack only | **Not** final financial proof | Must verify |

Cancel is financial I/O; revalidation policy per **PO-L02-07**.

---

## 11. Kill Switch Semantics

Scenario: live-opted → active session → order at venue → KS ACTIVE.

| Action | Current support | Policy |
| ------ | --------------- | ------ |
| 1. Block new submissions | S04 DENY; L02 must re-check | **AUTHORITATIVE** (Rule H) |
| 2. Cancel existing venue orders | **Not** in durable KS; prototype local-only | **PO-L02-08** |
| 3. Reconcile existing orders | Not productized for live | Needed under UNKNOWN; scope **PO-L02-14** |
| 4. Prevent further local live transitions | Via admission/engine guards | Required with (1) |

**Do not implement automatic venue cancellation** without PO-L02-08 = B or C.

---

## 12. Live-Policy Disable Semantics

Scenario: opted-in → open live order → Admin disable → PAPER.

| Behavior | Defined by artifacts? |
| -------- | --------------------- |
| Block new orders | **Not explicit**; fail-closed implication strong |
| Cancel existing | **Not defined** (S03 forbids exchange ops on disable) |
| Reconcile first | **Not defined** |
| Allow lifecycle to complete | **Not defined** |

**Status:** **REQUIRES PO DECISION** (PO-L02-09). Do not invent auto-cancel.

---

## 13. Vault / Credential Boundary

```text
Connection → vaultSecretId → Vault → workspace-scoped secret
```

**Preserve:** No frontend secrets; no raw creds in Connections; no creds on live policy; no L01 credential mutation; no second secret store.

| Topic | Finding |
| ----- | ------- |
| Workspace isolation | Slot key + AAD + membership/C8 |
| Lookup | Server retrieve at adapter I/O |
| Missing/invalid | Fail closed — no unsigned venue call |
| Rotation | Mid-flight sign failure → fail closed |
| Concurrent | Vault retrieve per call; no cross-workspace |

**Status:** Boundary **RESOLVED BY EXISTING AUTHORITY**; environment separation **SD-L02-02** / **PO-L02-11**.

---

## 14. Session Eligibility

**Minimum L02 contract (consume S04; no Session redesign):**

- workspace binding
- lifecycle non-terminal / eligible
- execution mode compatible with live
- actor context match
- session validity at admission **and** at I/O revalidation
- termination ⇒ block new (open-order policy = PO-L02-10)

Dual durable vs aggregate session models: residual Arch risk; use S04 mappers.

---

## 15. Persistence Requirements (operational; not L03)

Minimum for safe L02:

- live/paper mode on order
- venue order id (when known)
- client order id / idempotency keys
- submission attempt / correlation
- UNKNOWN / reconciliation_required markers
- timestamps
- workspace / session / actor identities
- verified fills via existing pipelines

**Not in L02:** L03 tamper-evident log; L05 general replay subsystem.

---

## 16. L02 Slice Decomposition

Proposed slices remain **PROPOSED** — **no Slice Approval**.

### PROPOSED-V3-L02-S01 — Contracts

| Field | Content |
| ----- | ------- |
| Objective | Live types, port extension, UNKNOWN contract, S04 call-site contract; no venue I/O |
| Inputs | ADR-020; S04; this package |
| Outputs | Typed contracts/tests |
| Dependencies | Planning Approval |
| Security | No creds/network |
| Persistence | Types only |
| PO/AD/SD | AD-02/03/07/14; PO-16 |
| Tests | Unit/contract; Paper regression |

### PROPOSED-V3-L02-S02 — Revalidation

| Field | Content |
| ----- | ------- |
| Objective | Mandatory S04 revalidation before adapter I/O |
| Dependencies | S01; S04; PO-05; AD-04 |
| Security | Fail-closed gates |
| Failure | Stale ALLOW rejected |
| Tests | Race KS/policy/session |

### PROPOSED-V3-L02-S03 — Vault / MOCK adapter

| Field | Content |
| ----- | ------- |
| Objective | Workspace Vault session + MOCK/harness UNKNOWN support |
| Dependencies | S01–S02; Vault; PO-01 if MOCK accepted |
| Security | Isolation; SD-05 |
| Tests | Isolation/idempotency |

### PROPOSED-V3-L02-S04 — Real venue

| Field | Content |
| ----- | ------- |
| Objective | Real submit/cancel/query for **PO-approved** venue only |
| Dependencies | PO-01/11; SD-01/02/04 |
| Security | Allowlist; TLS |
| Tests | Fixtures; failure injection (≠ FIV) |

### PROPOSED-V3-L02-S05 — Reconcile / crash-window

| Field | Content |
| ----- | ------- |
| Objective | Idempotency + UNKNOWN reconcile + crash recovery minimum |
| Dependencies | S04; AD-09/10/11; PO-13/14 |
| Tests | Timeout/restart duplicate prevention |

### PROPOSED-V3-L02-S06 — KS/policy/session hooks

| Field | Content |
| ----- | ------- |
| Objective | Implement **only** PO-07…10 decisions |
| Dependencies | PO decisions first |
| Non-scope | Invented liquidation |

**Status:** Decomposition **REQUIRES ARCHITECTURE DECISION** (AD-L02-14) + PO acceptance; **implementation not authorized**.

---

## 17. AC-01 … AC-27 Review

| AC | Requirement (summary) | Slice | Dependency | Test type | Precise? | Missing decision |
| -- | --------------------- | ----- | ---------- | --------- | -------- | ---------------- |
| AC-01 | Canonical Engine→Adapter only | S01/S04 | AD-01 | Conformance/boundaries | Yes | Confirm AD-01 freeze |
| AC-02 | S04 revalidate before I/O | S02 | S04 | Service/race | Yes | — |
| AC-03 | Human-start per contract | S02 | PO-05/AD-04 | Unit/service | Partial | PO-05/AD-04 |
| AC-04 | Authz + cross-workspace reject | S02 | PO-04 | Authz | Partial | PO-04 cell |
| AC-05 | Workspace isolation orders+creds | S03 | Vault | Isolation | Yes | — |
| AC-06 | KS blocks new submit | S02/S06 | PO-08 | Race | Yes for block-new | PO-08 for open orders |
| AC-07 | V2 anchors until activation | All | PO-16 | Conformance | Yes | PO-16 |
| AC-08 | Creds in adapter only | S03 | Vault | Security | Yes | — |
| AC-09 | Real submit approved scope | S04 | PO-01 | Adapter | Needs venue | **PO-01** |
| AC-10 | Real cancel honest semantics | S04/S05 | AD-08 | Adapter | Partial | AD-08 |
| AC-11 | Idempotency across retry/restart | S05 | PO-13/AD-09 | Failure inject | Yes intent | AD-09 |
| AC-12 | Ambiguous → UNKNOWN | S01/S05 | AD-07 | Unit | Yes | AD-07 naming |
| AC-13 | Crash-window persistence | S05 | AD-11 | Chaos | Partial | AD-11 |
| AC-14 | Min reconcile path | S05 | PO-14 | Integration | Partial | PO-14 |
| AC-15 | Fail-closed new exposure | S02/S05 | Rules | Service | Yes | — |
| AC-16 | No false success | All | Rule A | Contract | Yes | — |
| AC-17 | No false reject inviting dup | S05 | Rule B/C | Contract | Yes | — |
| AC-18 | No cred leakage | S03 | SD-05 | Security | Yes | SD-05 confirm |
| AC-19 | No cross-workspace | S03 | Vault | Isolation | Yes | — |
| AC-20 | No Paper/Live confusion | S01/API | AD-12 | Contract | Partial | AD-12 |
| AC-21 | No C7 bypass | Authz | PO-04/G | Conformance | Yes | PO-04 if change |
| AC-22 | No L03 | Scope | — | Conformance | Yes | — |
| AC-23 | No L04 | Scope | Rule 1 | Conformance | Yes | — |
| AC-24 | No L05 subsystem | Scope | — | Conformance | Yes | — |
| AC-25 | Paper default; no auto-activate | Rollout | PO-16 | Conformance | Yes | — |
| AC-26 | Fills→Position/Ledger | Path | ADR-015 | Integration | Yes | — |
| AC-27 | No invented RK-03 limits | Risk | PO-12 | Review | Yes | PO-12 |

No silent AC rewrite. Material ambiguity only where noted (AC-03/04/09/10/13/14/20).

---

## 18. Developer Perspective

**Implementable without ambiguity?** **Not yet** for production live I/O.

Clear enough to start **S01 contracts** after Planning Approval: canonical path, Rules A–J, S04 revalidation requirement, Vault boundary, L03/L04/L05 exclusions.

Blocked without PO/Arch: venue (PO-01), authz cell (PO-04), human-start durability (AD-04), UNKNOWN state shape (AD-07), reservation model (AD-13), KS open-order (PO-08).

Dual-path risk is controlled if AD-01 freeze is confirmed.

---

## 19. Consumer / Operator Perspective

Honest communication requires backend states: **submitted / rejected / unknown / filled / cancelled** (and cancel-unknown).

Today paper path lacks first-class UNKNOWN on Order SM — L04 cannot be honest until AD-07 lands.

Operators must understand: policy opt-in ≠ live; ALLOW ≠ submitted; KS may leave venue orders open until PO-08 decided.

---

## 20. Security Perspective

| Attack | Mitigated by plan? |
| ------ | ------------------ |
| Duplicate orders | Rules B/C + reconcile — if implemented |
| Unauthorized live submit | Anchors + S04 + C7 deny — until PO weakens |
| Cross-workspace creds | Vault AAD — must keep |
| Stale human-start reuse | Single-use; multi-instance needs AD-04 |
| Replay | Order idempotency ≠ L05; human-start ≠ L05 |
| Bypass S04 | Engine guard S02 required |
| Bypass KS | Revalidate; open-order gap = PO-08 |
| SSRF | SD-01 required before real venue |

**Residual critical risks:** lost-response duplicates if S05 skipped; C7 activation without Sec review; mainnet via PO-01/11 mistakes.

---

## 21. Open Decisions (summary)

### Blocking for Planning Approval → first implementation slices

- PO-L02-01, 02, 04, 05, 08, 13
- AD-L02-01 (confirm), 04, 07, 09, 11, 14
- SD-L02-01, 03

### Blocking before real venue (S04 slice)

- PO-L02-01, 11
- SD-L02-01, 02, 04

### Blocking before S06 hooks

- PO-L02-07, 08, 09, 10

### May defer with explicit PO note

- PO-L02-12, 14 (minimal), 15, 16
- SD-L02-06, 07

---

## 22. Recommended Next Governance Step

```text
1. PO Decision Session (priority: PO-01,02,04,05,08,13)
2. Architecture Review (AD-01…14) with AD-04/07/09/11 emphasis
3. Security Review (SD-01…07)
4. Update Decision Register with DECIDED rows
5. Separate act: V3-L02 Planning Approval (if reviews PASS)
6. Only then: per-slice Slice Approval → implementation
```

Do **not** start L02 runtime implementation from this artifact.

---

## 23. Explicit Authorization Statement

```text
V3-L02 IMPLEMENTATION IS NOT AUTHORIZED BY THIS ARTIFACT.

This document resolves/classifies/escalates planning decisions only.
It does NOT grant Planning Approval.
It does NOT grant Slice Approval.
It does NOT authorize live trading, real capital, FIV, credentials, or C7 activation.
```

---

## STOP

**STOP.** Decision package complete for PO / Chief Architect / Security review.

Do not implement L02. Do not submit/cancel live orders. Do not activate live capital. Do not perform FIV. Do not close L02 / V3-L01 / Wave 6.
