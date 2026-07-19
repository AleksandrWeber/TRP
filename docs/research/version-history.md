# Research Version History

This document tracks how `researchEngineVersion` and `validationVersion` evolve over time for Knowledge identity.

## Timeline

### 1.0.0 — Initial engine

- First stable research calculation semantics.

### 1.0.1 — Accounting fix

- Backtest/fees accounting semantics changed, affecting resulting metrics and verdicts.

### 1.0.2 — Validation fix

- Validation rules/interpretation semantics changed, affecting `validation.verdict` and `reasons`.

### 1.0.3 — Knowledge identity update

- Knowledge result identity/deduplication logic was updated so that identity is based on engine+validation versions, not only configuration.

## Current versions

- `researchEngineVersion`: `1.0.3`
- `validationVersion`: `1.0.2`
- `knowledgeSchemaVersion`: `2`

## Simulation Platform semantics (apps/api)

The Research & Simulation Platform (Backtesting / Portfolio / Trade / Performance / Simulation Report) is a separate engine from `@trp/research`. Its semantics do **not** affect Knowledge identity, so `researchEngineVersion` is unchanged. Corrections are recorded here for provenance.

### RC-15.1 — Validation Sprint V1 corrections (2026-07-18)

- **PnL identity.** `unrealizedPnL` now represents classic unrealized profit/loss on open positions (`(price − entry) × quantity`), not raw position market value. Raw market value is available separately via `computePositionMarketValue`. This restores `realizedPnL + unrealizedPnL = totalPnL` for every snapshot.
- **Equity accounting.** `equity = initialCapital + realizedPnL + unrealizedPnL`, keeping `cash + market value of open positions = equity` for every snapshot.
- **Determinism.** Equity-curve snapshots are anchored to session / bar timestamps, and CAGR duration is derived from the equity-curve span (wall-clock only as fallback), so identical inputs yield identical business results across repeated runs (operational metadata excluded).

## Paper Trading architecture baseline

### RC-16 Architecture Freeze — 2026-07-18

No Research Engine, Validation, Knowledge Schema, simulation calculation, or
production code version changed.

ADR-012…ADR-018 freeze future paper-runtime semantics:

- business calculations use domain/exchange timestamps, never wall-clock
  execution duration;
- operational metadata cannot change business semantics;
- financial values use decimal-safe arithmetic;
- Fill → Position → Ledger → Portfolio, with Ledger as financial source of
  truth;
- replaying the same ordered semantic event stream and configuration must
  reproduce Orders, Fills, Positions, Ledger, Portfolio, and Risk outcomes;
- future changes to these semantics require a new ADR and an explicit paper
  runtime/versioning decision before release.

### RC-16 Architecture readiness — 2026-07-18

- RC-16 Architecture Planning completed.
- Architecture Freeze completed through accepted ADR-012…ADR-018.
- Frozen Architecture Audit passed with minor non-blocking recommendations.
- Architecture Approved: YES.
- Implementation Approved: YES.
- M1 and M2 are complete; next milestone: M3 — Strategy Trading Sessions.
- US126–US130 complete: M1 Epic E1 (Market Data Contracts and Durable Event Foundation).
- US131–US134 complete: M1 Epic E2 (Binance public connector + resilience).
- US135–US137 complete: M1 Epic E3-A (normalization + quarantine).
- US138–US139 complete: M1 Epic E3-B (ordering + gap recovery).
- US140–US141 complete: M1 Epic E4-A (subscription registry + durable checkpoints).
- US142–US143 complete: M1 Epic E4-B (startup recovery + latest-state projection). Epic E4 complete.
- US144–US145 complete: M1 Epic E5-A (status/staleness + observability).
- US146–US147 complete: M1 Epic E5-B (workspace query API + SSE projection
  channel). Epic E5 complete. M1 Live Market Data Foundation complete.
- US148–US152 complete: M1 Epic E6 Mini Validation (PASS WITH MINOR
  RECOMMENDATIONS). See `docs/project/rc-16-m1-mini-validation.md`.
- US153–US155 complete: M2 Epic E7-A. Canonical decimal-only financial
  contracts and precision policies; durable paper account with immutable
  opening-capital Ledger instruction; PostgreSQL Event Processing Nest runtime.
- US156–US158 complete: M2 Epic E7-B. Durable manual Trading Sessions with
  fenced execution eligibility; Trader/Admin workspace command authorization;
  production JWT secret hardening. Epic E7 complete.
- US159–US161 complete: M2 Epic E8 first half. Deterministic paper Order Intent
  identities, Orders-owned lifecycle/history, and transactional PostgreSQL
  Order + Outbox persistence.
- US162–US164 complete: M2 Epic E8 second half. Ledger-owned durable cash
  reservation/release, idempotent Orders-owned cancellation, and authenticated
  workspace/RBAC-scoped Order command and query API with no Risk/Execution
  bypass. Epic E8 complete.
- US165–US171 complete: M2 Epic E9. Mandatory immutable baseline Risk
  Decisions, approved/unexpired Risk references on executable Orders,
  paper-only provider-neutral adapter contracts, deterministic versioned
  Paper Fill configuration, deterministic all-or-none market and
  cross-then-all-or-none limit matching, a single Execution Engine as the sole
  adapter entry that never mutates Orders or accounting, idempotent submission
  and cancellation reconciliation, and append-only Fill persistence committed
  atomically with its Outbox event and the Orders-owned lifecycle transition.
- US172–US174 complete: M2 Epic E10 first half. Immutable Fill-derived long-only
  Position accounting; balanced append-only decimal Ledger transactions for
  opening capital, reservations, releases, Fill cost, fees, cash, and realized
  PnL; and atomic Inbox/Position/Ledger/Outbox/checkpoint Fill processing with
  duplicate no-op and full rollback on failure.
- US175–US178 complete: M2 Epic E10. Versioned decimal Position valuation,
  Ledger-and-valuation-only Portfolio projection with explicit freshness,
  deterministic comparison-only accounting rebuild with execution fencing on
  mismatch, and authenticated workspace/account-scoped decimal-string
  accounting reads.
- US179–US183 complete: M2 Epic E11 Mini Validation. Contract/state/RBAC,
  PostgreSQL atomicity and concurrency, deterministic accounting replay,
  failure/restart reconciliation, performance, architecture, and quality gates
  pass. M2 exits PASS WITH MINOR RECOMMENDATIONS. See
  `docs/project/rc-16-m2-mini-validation.md`.
- RC-16 final-release review completed: M1/M2 evidence remains valid, but the
  release is not ready before M3–M7 and final closeout. See
  `docs/project/rc-16-release-summary.md`.
- US183.1 — RC-15 / M2 Cluster Closure (2026-07-19): stabilization-only
  validation and documentation sync; no Research Engine, Validation, Knowledge
  Schema, or paper-runtime semantic change. See
  `docs/project/rc-15-cluster-closure.md`.

These changes establish the separate RC-16 paper runtime. Research Engine,
Validation, Knowledge Schema, and RC-15 simulation calculation versions remain
unchanged.
