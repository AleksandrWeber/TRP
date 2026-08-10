# TRP V2 — Tactics Contract (Option B)

**Document:** V2 Tactics Contract  
**Status:** **Approved** (2026-08-10)
**Date:** 2026-08-10  
**Decision:** **Option B** — Adaptive Tactics = selection among **pre-validated** configuration sets only

Related: [Alias Dictionary](./v2-alias-dictionary.md), [Authority Matrix](./v2-authority-matrix.md), Product Vision (Validated Knowledge).

---

## Purpose

Define the hard boundary between:

- **Strategy** — decision algorithm (immutable without full validation pipeline);
- **Tactics** — allowed usage configuration of an already certified Strategy version.

This preserves: _the system never invents trading strategies during Live/Paper trading._

---

## Definitions

### Strategy

The algorithm that maps market inputs → signal intent logic (indicators, rules, entry/exit logic structure).

Changing strategy logic requires the full validation pipeline before production use:

```text
Backtesting → Walk Forward → (Monte Carlo when available)
  → Paper → Validation → Certification → Library
```

Examples of **strategy changes** (forbidden as “tactics”):

- EMA(20) → EMA(30) as a new unbound experiment used live;
- adding/removing indicators or signal rules;
- changing order-type logic or entry model code paths;
- any code/parameter change not present in a certified version’s validated set.

### Tactics

A **named, versioned, pre-validated parameter set** (tactical profile) attached to a certified Strategy version.

Tactics change **where/how hard/how often** the same algorithm is applied — only within values that already passed validation for that strategy version.

---

## Option B — normative rule

At runtime (Paper or Live), the platform MAY:

- select instrument / symbol **from the validated allowlist** for that strategy version;
- select timeframe **from the validated allowlist**;
- select risk-per-trade, max positions, exposure caps **from the validated tactical ranges/sets**;
- enable/disable optional validated filters **only if those filter variants were certified**.

The platform MUST NOT:

- synthesize new indicator periods or rules online;
- enlarge allowlists without research + certification;
- treat Orchestrator/AI suggestions as auto-applied tactics;
- mutate Deployment strategy hash/version silently.

---

## Allowed tactics (illustrative)

| Dimension          | Allowed if pre-validated                   | Notes                                           |
| ------------------ | ------------------------------------------ | ----------------------------------------------- |
| Symbol             | Yes, from certified universe               | e.g. BTC → SOL only if SOL was in validated set |
| Timeframe          | Yes, from certified set                    | e.g. 5m instead of 1m if both certified         |
| Max open positions | Yes, within certified bounds               |                                                 |
| Risk % per trade   | Yes, within certified bounds               | Still subject to Risk Engine + Exchange Policy  |
| Exchange Scope     | Yes, if strategy allowlisted on that scope | Cluster policy may still deny                   |
| Session pause/stop | Yes                                        | Lifecycle, not tactics                          |
| Kill Switch        | Yes                                        | Safety, not tactics                             |

---

## Forbidden as tactics (always strategy / research work)

| Change                                                | Why forbidden online         |
| ----------------------------------------------------- | ---------------------------- |
| Indicator period / type changes outside certified set | New algorithm behavior       |
| New entry/exit rule                                   | New strategy                 |
| Enabling untested symbols/timeframes                  | Unvalidated edge             |
| AI-proposed params not in certified set               | Violates Validated Knowledge |
| “Temporary” logic forks in Runtime                    | Dual strategy path           |

---

## Certification artifact (logical)

Each certified Strategy version SHOULD eventually expose a machine-readable **Tactical Envelope**, for example:

- `allowedSymbols[]`
- `allowedTimeframes[]`
- `riskPerTrade: { min, max, step }` or discrete set
- `maxPositions: { min, max }`
- `optionalFilters[]` (certified only)
- `envelopeVersion` + provenance (experiment/campaign ids)

Runtime and Trading Orchestrator may only pick points **inside** this envelope.

> Implementation of the envelope store may land with Spec v2.0 / stories; the **contract** is binding now for design.

---

## Interaction with Risk and Exchange Scope

```text
Tactical Envelope (certified)
  ∩ Exchange Risk Policy
  ∩ Platform Risk limits
  ∩ Account / Session state
  → Risk Decision
```

Tactics never bypass Risk.  
A tactic being “inside the envelope” is necessary but not sufficient to trade.

---

## Orchestrator rules

Trading Orchestrator MAY recommend or select tactics **inside** the envelope (e.g. prefer SOL 5m under current Market State / Market Profile confidence).

Trading Orchestrator MUST NOT:

- invent envelope points;
- change strategy version;
- submit orders (Orders + Risk + Execution Engine remain on path).

---

## User and AI rules

- User may request a tactic switch in Command Center only onto envelope points (or trigger research to expand envelope).
- AI may suggest hypotheses to test; applying them requires research pipeline, not hot-reload.

---

## Market requalification note

Refreshing a Market Profile does **not** by itself expand a strategy’s Tactical Envelope.  
Envelope expansion remains a strategy validation concern; profile updates only affect confidence inputs.

---

## Acceptance examples

| Action                                                             | Verdict                         |
| ------------------------------------------------------------------ | ------------------------------- |
| Switch certified strategy from BTC 5m to SOL 5m (both in envelope) | Allowed tactic                  |
| Change EMA length from 20 to 30 in a running session               | Forbidden (new strategy params) |
| Reduce risk from 1% to 0.5% when both in envelope                  | Allowed tactic                  |
| AI says “try ATR 14” and Runtime applies it                        | Forbidden                       |
| Exchange policy blocks SOL even if in envelope                     | Denied by policy/Risk (correct) |

---

## Approval

- [ ] Option B accepted as Freeze precondition
- [ ] Strategy vs Tactics boundary accepted
- [ ] Envelope concept accepted (implementation may follow Spec v2.0)
