# TRP V2 — Architecture Glossary

**Document:** V2 Architecture Glossary  
**Status:** **Approved** (2026-08-10)
**Date:** 2026-08-10  
**Rule:** One or two sentences per term. Not an Alias Dictionary — definitions, not mapping tables.

Related:

- [Alias Dictionary](./v2-alias-dictionary.md) — product ↔ canonical binding
- [Freeze Preconditions](./v2-freeze-preconditions.md)
- Domain glossary (broader): [`../Architecture/021-Glossary.md`](../Architecture/021-Glossary.md)

---

## Research & validation

**Research Lab**  
Subsystem that tests strategies historically (backtest, walk-forward, and later Monte Carlo). It does not place live or paper orders.

**Strategy**  
Certified decision algorithm. Its logic changes only through the full validation pipeline, never during trading.

**Tactics**  
Pre-validated usage configuration for a certified Strategy (symbols, timeframes, risk bounds, and similar envelope points). Selecting tactics must not invent new strategy logic.

**Tactical Envelope**  
Machine-readable set of allowed tactic values for one certified Strategy version. **RC-19 Epic 3:** structural stub may be attached optionally to a Trading Session; **Tactical Envelope exists but is not yet active** (Runtime ignores it; enforcement deferred to RC-22).

**Strategy Library**  
Store of strategies that earned certification. Only library members may be used on the production path.

**Market Qualification**  
User-triggered research pipeline that assesses a venue or market before trusting it for lab, paper, or live use.

**Market Profile**  
Versioned research artifact describing a venue’s historical characteristics and confidence inputs. It never forces a trade.

**Market State**  
Classification of current market conditions (for example trend or volatility regime). It informs selection; it does not execute.

---

## Runtime & execution

**Trading Session**  
Canonical backend entity for one autonomous trading worker lifecycle (ADR-014).

**Bot**  
Product/UI facade over Trading Session. Same identity as the Session; not a separate backend aggregate or persistence model (RC-19 Epic 2 Bot Facade).

**Strategy Deployment**  
Immutable approved configuration bound to sessions (strategy version, params, instrument scope, risk policy version, provenance).

**Mission**  
Product term for the Strategy Deployment configuration bound to a Session (Bot Mission ≡ `deploymentId` on the Session).

**Strategy Runtime**  
Evaluates market events for a session and emits Signal Intents. It does not submit orders to exchanges.

**Signal Intent**  
Immutable intent to act produced by Strategy Runtime before order creation.

**Trading Orchestrator**  
Coordinates strategy selection/tactics, exchange-scope policy, and handoff into the risk → orders → execution path. Not an AI brain and not the Execution Engine.

**Risk Engine**  
Single platform authority that approves or rejects executable risk decisions. Consumes platform limits and per-exchange policies.

**Exchange Risk Policy**  
Per–Exchange Scope limits and allowlists used as inputs to the Risk Engine. Not a second risk engine.

**Execution Engine**  
Sole entry that submits or cancels orders through an execution adapter (ADR-012).

**Exchange Scope**  
Isolation boundary for one exchange: accounts, session capacity, policies, adapter binding, and scoped journals. UI may call this a Cluster.

**Cluster**  
Product/UI alias for Exchange Scope.

**Trading Account**  
Account holding balances and reservations for one Exchange Scope. UI may call this a Wallet.

**Wallet**  
Product/UI alias for Trading Account.

---

## Accounting & truth

**Fill**  
Immutable execution fact that accounting consumes.

**Ledger**  
Financial source of truth for cash, reservations, fees, and realized movements.

**Position**  
Durable projection of open exposure derived from fills.

**Portfolio**  
Rebuildable projection of account equity and exposure derived from ledger and valuation — not a competing ledger.

---

## Knowledge, ops & UX

**Knowledge Lake**  
Append-only analytical projection/warehouse fed by research and trading events. Not a Source of Truth for money or order state.

**Reporting**  
Human-facing aggregations and scheduled reports built from projections. Non-authoritative for finance.

**AI Analyst / AI Assistant**  
Narrative helper for explanations and research support. Never controls capital.

**Command Center**  
Operations workspace for monitoring and issuing commands through canonical APIs. Not a financial or lifecycle source of truth.

**Dashboard**  
Attention-oriented projection surface. Non-authoritative.

---

## Authority shorthand

**SoT (Source of Truth)**  
Owning system of record for a fact family (for example Orders, Risk Decision, Ledger).

**Projection**  
Rebuildable read model derived from SoT or events.

**Narrative**  
Explanatory text (including LLM output) with no authority over trading state.
