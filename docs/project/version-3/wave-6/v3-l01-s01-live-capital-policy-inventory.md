# V3-L01-S01 Live Capital Policy Inventory & Honesty Baseline

**Slice:** PROPOSED-V3-L01-S01 — Inventory & honesty baseline
**Package:** V3-L01 — Live capital ADR + workspace policy (LT-01)
**Wave:** 6 — Live Trading
**Date:** 2026-09-16
**Nature:** Discovery and classification only. Not workspace live-policy persistence. Not enablement API. Not Gate / Kill Switch / Session live admission wiring. Not live adapter. Not credentials. Not live-capital activation.
**Machine inventory:** `apps/api/src/platform-conformance/v3-l01-s01-live-capital-policy-inventory.ts`
**Slice Approval:** [`v3-l01-s01-approval.md`](./v3-l01-s01-approval.md)

```text
This inventory does NOT implement workspace live-policy persistence.
This inventory does NOT implement enablement API or audit.
This inventory does NOT wire Runtime Enforcement Gate live admission.
This inventory does NOT implement Session live-mode productization.
This inventory does NOT wire Kill Switch for live-capital activation.
This inventory does NOT introduce a live adapter or venue order I/O.
This inventory does NOT provision credentials.
This inventory does NOT authorize live trading.
This inventory does NOT declare V3-L01 COMPLETE or Wave 6 COMPLETE.
This inventory does NOT declare production ready or FIV PASS.

Capability inventory ≠ capability activation
Connectivity ≠ authorization
Enablement ≠ execution
Paper remains the default.
```

---

## Purpose

Enumerate the concrete V3-L01 touchpoints that later slices must respect, and freeze Honest Product rules so S02–S04 cannot invent owners, claim live trading is available, or collapse enablement with execution.

| Class         | Meaning                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **SURVIVE**   | Persists across API restart today, or is durable substrate on existing Workspace / Session / Gate / KS / Auth / Vault owners.  |
| **EPHEMERAL** | Transient, stub, UI-only, process-local, missing, or documentation — must not be treated as live-trading or live-policy truth. |

---

## What S01 establishes

1. A machine-readable catalog of L01-relevant surfaces (owners, absence of workspace live policy, Session `ExecutionMode`, Gate purposes, KS foundation cite, Auth `LiveCommand`, Paper Freeze rejects, V2 anchors).
2. Binding honesty constants: Paper default; inventory ≠ activation; connectivity ≠ authorization; enablement ≠ execution; live trading **not** available from S01.
3. Explicit-out rows for S02–S04 and L02–L05 so scope cannot silently expand.
4. Spec-backed regression guards that `liveCapitalAuthorized` remains `false` and `paperFreeze` remains `true`.

---

## What the inventory represents

| Surface class                 | Current truth                                                                |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Workspace live-policy absence | `WorkspaceRecord` has **no** live-policy field                               |
| Session ExecutionMode         | `PAPER \| LIVE` enum exists; LIVE enum ≠ live authorized                     |
| Runtime Enforcement Gate      | `deployment_bind \| session_start` exist; live admission attrs **not** wired |
| Kill Switch foundation        | W3-O04 substrate **cited**; live KS wiring out of S01                        |
| Auth LiveCommand              | `PermissionClass.LiveCommand` **denied** for all roles today                 |
| Paper Freeze rejects          | Paper-only adapter / engine rejects remain                                   |
| V2 conformance anchors        | `liveCapitalAuthorized: false`; matrix `paperFreeze: true`                   |

---

## Binding finding

**Live trading is NOT available. Workspace live mode is NOT enabled. S01 does NOT activate capital.**

- Paper remains the default.
- Inventory describes capability surfaces; it does **not** activate them.
- Connectivity (exchange / notification) does **not** equal live authorization.
- Future enablement (S03) still does **not** equal venue execution (L02+).
- No credentials are provisioned by this inventory.
- No production readiness or FIV claim is made.

---

## Honest Product baseline

| Category                | Summary                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Implemented today**   | None — no customer-visible live-trading or workspace live-policy enablement from S01.                                                   |
| **Infrastructure only** | Workspace owner, Session ExecutionMode, Gate purposes, KS foundation cite, LiveCommand deny-all, paper-only rejects, V2 anchors.        |
| **Planned**             | S02 persistence · S03 enable/audit · S04 Gate/KS/Session admission (each separately gated).                                             |
| **Not implemented**     | Workspace live-policy schema · enablement API · live admission attrs · live adapter · live UI productization · live-capital activation. |
| **Future roadmap**      | L02–L05 · FIV · production release (separately gated).                                                                                  |

---

## S01 exclusions (binding)

S02 workspace persistence/schema · S03 enablement API/audit · S04 Gate/KS/Session live wiring · L02 live order I/O · L03 financial action log · L04 live operator UI · L05 replay protection · credentials · live-capital activation · real-capital orders · production release · FIV.

---

## S01 → S02 contract (inventory output only)

S01 provides for later S02 planning/implementation:

- **Owner map:** Workspace remains the persistence owner (no second aggregate).
- **Policy absent today:** explicit inventory finding.
- **Honesty vocabulary:** enablement ≠ execution; Paper default; no live-available claim.
- **Explicit-outs:** S03/S04/L02–L05 remain out of S01/S02 as applicable.
- **V2 anchors:** `liveCapitalAuthorized: false` / `paperFreeze: true` must not be flipped by S02.

S01 does **not** design S02 schema.

---

## Machine inventory

Full row detail: `V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY` in
`apps/api/src/platform-conformance/v3-l01-s01-live-capital-policy-inventory.ts`.

Helpers: `rowsSurvive()`, `rowsEphemeral()`, `rowsHonestyBoundaries()`, `rowsExplicitOut()`, `rowsBySurfaceClass()`, `coveredSurfaceClasses()`.

Matching specs: `v3-l01-s01-live-capital-policy-inventory.spec.ts`.

**Optional conformance registry:** not created for S01 — inventory `.spec.ts` validates completeness/honesty per Slice Approval (registry remains optional).

---

## STOP

**STOP.** PROPOSED-V3-L01-S01 inventory artifacts produced for **PO Review**.
Do **not** declare S01 CLOSED. Do **not** start S02. Do **not** enable live capital. Do **not** provision credentials. Do **not** perform FIV.
