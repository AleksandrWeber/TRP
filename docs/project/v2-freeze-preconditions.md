# TRP V2 — Freeze Preconditions

**Document:** V2 Freeze Preconditions (hub)  
**Status:** **Approved** (2026-08-10) — package complete; documentation foundation ready for Architecture Specification v2.0  
**Date:** 2026-08-10  
**Authority:** Preconditions only — does **not** freeze architecture by itself and does **not** override ADR-012…ADR-018

Related:

- [Engineering Audit Report](./engineering-audit-report-v2-freeze.md)
- [RC-18 Current System Snapshot](./rc-18-current-system-snapshot.md)
- [V2 Implementation Roadmap](./v2-implementation-roadmap.md)
- [Final Readiness Assessment](./v2-final-readiness-assessment.md)
- [Alias Dictionary](./v2-alias-dictionary.md)
- [Authority Matrix](./v2-authority-matrix.md)
- [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)
- [Tactics Contract](./v2-tactics-contract.md)
- [Architecture Glossary](./v2-architecture-glossary.md)
- [Architecture Decision Log (V2)](./v2-architecture-decision-log.md)
- [C4 Container Diagram](./v2-c4-container-diagram.md)
- [Product Vision](./trp-product-vision.md) (Level-0)
- [UX Vision](./trp-ux-vision.md) (Level-0)
- [CANONICAL](../CANONICAL.md) (Level-1)
- [ADR Index](../adr/README.md)

---

## Purpose

RC-16/RC-18 architecture and V2 product language must be **married** before any Architecture Freeze for Version 2.

This hub and its companion documents define the **minimum contracts** required before writing **Trading Research Platform Architecture Specification v2.0**.

```text
RC-18 (implemented + ADR Freeze)
        ↓
V2 Freeze Preconditions (contracts + glossary + decision log + C4)
        ↓
Human approval
        ↓
Architecture Specification v2.0
        ↓
V2 Architecture Freeze (future ADRs as needed)
```

---

## Non-goals

- Do **not** treat this package as Architecture Spec v2.0.
- Do **not** invent new feature modules.
- Do **not** reopen ADR-012…ADR-018 ownership without a new ADR.
- Do **not** authorize real-capital trading (still requires a future ADR).
- Replay-as-product-platform and Experiment Registry productization remain **Future / V3** and are out of this package’s Freeze scope.

---

## Agreed decisions (2026-08-10)

| Decision              | Choice                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| Adaptive Tactics      | **Option B** — only configuration from an already validated set; no new strategy logic at runtime |
| Exchange Independence | **Exchange Scope** + per-exchange **policy**, not a second Risk/Ledger/Portfolio engine           |
| Bot                   | **UI/product term** for canonical **Trading Session**                                             |
| Knowledge Lake        | **Projection / event warehouse**, never financial SoT                                             |
| “Trading Brain”       | Renamed to **Trading Orchestrator** (not AI; not Execution Engine)                                |
| Spec v2.0             | **Blocked** until this package is approved                                                        |

---

## Preconditions checklist

Freeze Spec v2.0 drafting only when all are **Approved**:

| #   | Document                                                             | Status               |
| --- | -------------------------------------------------------------------- | -------------------- |
| 1   | [Alias Dictionary](./v2-alias-dictionary.md)                         | **Approved**         |
| 2   | [Authority Matrix](./v2-authority-matrix.md)                         | **Approved**         |
| 3   | [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md) | **Approved**         |
| 4   | [Tactics Contract](./v2-tactics-contract.md)                         | **Approved**         |
| 5   | Explicit statement: V2 extends RC-16/18; no parallel execution path  | **Approved** (below) |
| 6   | [Architecture Glossary](./v2-architecture-glossary.md)               | **Approved**         |
| 7   | [Architecture Decision Log (V2)](./v2-architecture-decision-log.md)  | **Approved**         |
| 8   | [C4 Container Diagram](./v2-c4-container-diagram.md)                 | **Approved**         |

---

## Binding rule: one execution path

V2 product surfaces (Bot, Cluster, Command Center, Orchestrator) are **facades and scopes** over the frozen path:

```text
Market Event
  → Strategy Runtime
  → Signal Intent
  → Orders
  → Risk (platform engine + exchange policy inputs)
  → Execution Engine
  → Adapter (paper now; live later via ADR)
  → Fill
  → Position → Ledger → Portfolio
```

Trading Session remains the runtime lifecycle aggregate (ADR-014).  
“Bot” must not introduce a second runtime.

---

## Mapping summary (RC-18 ↔ V2)

| V2 product language | Canonical architecture            | Notes                                   |
| ------------------- | --------------------------------- | --------------------------------------- |
| Bot                 | Trading Session                   | UI alias only                           |
| Wallet              | Trading Account                   | Under Ledger SoT                        |
| Cluster             | Exchange Scope                    | Isolation boundary, not microservice    |
| Brain               | Trading Orchestrator              | Selector + policy orchestration; not AI |
| Knowledge Lake      | Knowledge / ops event warehouse   | Projection                              |
| Command Center      | Operations workspace              | Commands via existing ports             |
| Market Profile      | Versioned venue research artifact | Confidence input                        |

Full dictionary: [v2-alias-dictionary.md](./v2-alias-dictionary.md).

---

## Exit criteria for this package

Approved when:

1. Alias Dictionary has no unresolved product↔canonical collisions.
2. Authority Matrix names SoT vs projection vs narrative for every V2 surface that “knows” something.
3. Cluster Isolation Invariants state what is isolated vs shared, and forbid duplicate engines.
4. Tactics Contract defines allowed/forbidden runtime changes under Option B.
5. Product Vision language (“not a trading bot”) remains compatible via UI-alias rule.
6. Architecture Glossary covers the V2 vocabulary in short definitions.
7. V2 Architecture Decision Log records approved mapping decisions (distinct from engineering ADL).
8. One high-level C4 Container Diagram is accepted as Spec v2.0 input.

When approved, status of this hub becomes **Approved**, and Architecture Spec v2.0 may begin.

---

## Maintenance

- Update companions when mapping decisions change.
- Do not expand this package into a feature roadmap.
- Implementation work that depends on these contracts must cite them in Story Specs / ADRs.
