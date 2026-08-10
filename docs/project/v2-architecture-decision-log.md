# TRP V2 — Architecture Decision Log

**Document:** V2 Architecture Decision Log  
**Status:** **Approved** (2026-08-10)
**Date:** 2026-08-10  
**Nature:** Short approved-decision journal for V2 product↔architecture marriage  
**Not an ADR.** Does not override ADR-012…ADR-018.

Related:

- Engineering chronology ADL: [`../Architecture/ADR/ADL.md`](../Architecture/ADR/ADL.md)
- [Freeze Preconditions](./v2-freeze-preconditions.md)
- [Alias Dictionary](./v2-alias-dictionary.md)
- [Authority Matrix](./v2-authority-matrix.md)
- [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)
- [Tactics Contract](./v2-tactics-contract.md)
- [Architecture Glossary](./v2-architecture-glossary.md)

---

## Purpose

Record **why** V2 mapping choices were approved so they remain recoverable a year later.

Use this log for product/canonical marriage decisions.  
Use [`../Architecture/ADR/ADL.md`](../Architecture/ADR/ADL.md) for release-by-release engineering chronology.  
Use ADRs for normative Freeze changes.

---

## How this differs from ADR / engineering ADL

|                      | **ADR**              | **Engineering ADL**               | **This V2 log**                                 |
| -------------------- | -------------------- | --------------------------------- | ----------------------------------------------- |
| Question             | What is the rule?    | How did we apply it in a release? | Which V2 naming/boundary choice did we approve? |
| Length               | Full decision record | Chronological entries             | One-line / short rationale                      |
| Can override Freeze? | Yes (new ADR)        | No                                | No                                              |

---

## Approved decisions

| ID     | Decision                                                                               | Status       | Date       | Rationale (short)                                           |
| ------ | -------------------------------------------------------------------------------------- | ------------ | ---------- | ----------------------------------------------------------- |
| V2-D01 | Bot (UI) = Trading Session (canonical)                                                 | **Approved** | 2026-08-10 | Avoid a second runtime aggregate; keep ADR-014 lifecycle    |
| V2-D02 | Wallet (UI) = Trading Account (canonical)                                              | **Approved** | 2026-08-10 | One accounting model; Ledger remains SoT                    |
| V2-D03 | Cluster (UI) = Exchange Scope (canonical)                                              | **Approved** | 2026-08-10 | Isolate venue resources without cloning engines             |
| V2-D04 | No per-exchange Risk/Ledger/Execution engines                                          | **Approved** | 2026-08-10 | Preserve ADR-012/015/016/017; policy ≠ engine               |
| V2-D05 | Exchange Risk Policy feeds single Risk Engine                                          | **Approved** | 2026-08-10 | Per-venue limits without dual authority                     |
| V2-D06 | “Trading Brain” renamed Trading Orchestrator                                           | **Approved** | 2026-08-10 | Avoid AI illusion; not Execution Engine                     |
| V2-D07 | Knowledge Lake ≠ SoT (projection/warehouse only)                                       | **Approved** | 2026-08-10 | Orders/Execution/Ledger stay authoritative                  |
| V2-D08 | Adaptive Tactics = Option B (envelope only)                                            | **Approved** | 2026-08-10 | Validated Knowledge; no live strategy invention             |
| V2-D09 | Strategy vs Tactics hard boundary                                                      | **Approved** | 2026-08-10 | Algorithm changes require full validation pipeline          |
| V2-D10 | Command Center / Dashboard / AI are non-authoritative                                  | **Approved** | 2026-08-10 | Commands via ports; UI/AI never own finance/lifecycle truth |
| V2-D11 | V2 extends RC-16/18; no parallel execution path                                        | **Approved** | 2026-08-10 | Facades/scopes over frozen canonical path                   |
| V2-D12 | Spec v2.0 blocked until Freeze Preconditions package approved                          | **Approved** | 2026-08-10 | Map before freeze; marry RC-18 and V2 language first        |
| V2-D13 | Replay-as-platform / Experiment Registry productization = Future (not V2 Freeze scope) | **Approved** | 2026-08-10 | Keep Freeze package small; analyze later                    |

---

## Deferred (explicitly not decided here)

| Topic                                                       | Status   | Notes                                     |
| ----------------------------------------------------------- | -------- | ----------------------------------------- |
| Live-capital adapter                                        | Deferred | Requires future ADR; paper Freeze remains |
| Monte Carlo in mandatory validation ladder                  | Deferred | Parking Lot / future research hardening   |
| Exact Nest module name for Trading Orchestrator             | Deferred | Spec v2.0 / later ADR                     |
| Kill Switch default scope (platform vs exchange vs session) | Deferred | Tracked in engineering ADL / E19 themes   |

---

## Append rule

1. Add a row when a V2 mapping or boundary is approved or rejected.
2. Never edit history silently — supersede with a new row and mark the old one `Superseded`.
3. If a row conflicts with an ACTIVE ADR, ADR wins; correct this log.

---

## Approval

- [ ] Decision table reviewed
- [ ] Distinction from ADR / engineering ADL accepted
