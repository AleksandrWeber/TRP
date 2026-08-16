# Runtime Trading Engine Verification

**Document:** Runtime Trading Engine Verification  
**Date:** 2026-08-16  
**Nature:** Implementation audit only. No code change. No architecture change. No other documentation change.  
**Scope:** Trace Paper Session / Command Center Start Session through every runtime component until a Paper Order would be created.  
**Source of truth:** Current implementation under `apps/`. Architecture documents and intended design were not used as evidence.

---

## Primary question

**Is the paper trading runtime actually executing trading strategies?**

**No.**

After Start Session the system manages lifecycle (status, lease, runtime arm). It does not ingest market data for that session, does not periodically evaluate the bound strategy, does not apply a trading tactic, and does not create a Paper Order.

Version 2 currently manages the lifecycle around a strategy. It does not continuously execute that strategy’s trading logic.

---

## Verdict

- Continuous strategy execution after Start Session: **not implemented**
- Market data into the started session runtime: **nowhere**
- Periodic `Strategy.evaluate()` (or equivalent): **exists as a callable service; not invoked after session start**
- `Tactic.evaluate()` (or equivalent) at runtime: **not implemented**
- Automatic Paper Order after Start Session: **not created**
- What Start Session actually does: **arms lifecycle and waits**

Building blocks for candle → Signal Intent → Paper Order exist and pass when a test supplies a closed candle and calls the pipeline. Nothing in the live Start Session path connects those blocks.

---

## Two start surfaces

Command Center “Start Session” starts a **Trading Session**, not a US208 `PaperSession`. Both paths stop at lifecycle.

**Command Center Bot**

- UI: `CreateBotWizardPage` / session commands
- HTTP: `POST /v1/trading-sessions/:id/start`
- What start does: loads runtime context, attaches lease, sets `RUNNING`, arms Strategy Runtime to `ARMED`

**Paper Trading page**

- UI: `PaperTradingPage`
- HTTP: `POST /v1/paper/sessions/:id/start`
- What start does: flips `PaperSession` status to `RUNNING` and publishes `PaperSessionStarted`

Command Center copy states the product fact:

```ts
// apps/web/src/command-center/session-commands.ts
if (action === 'start') {
  return {
    title: 'Start session?',
    message: `Start ${sessionId}. Trading Session will arm paper runtime if the bound Deployment is approved. This does not place orders.`,
```

US208 manager comment:

```ts
// apps/api/src/modules/paper-trading-engine/paper-session-manager.ts
/**
 * PaperSessionManager — session lifecycle only (US208).
 * Creates the owned Portfolio via PortfolioService; no direct Portfolio mutation.
 */
```

---

## 1. Where does market data enter the runtime?

**After Start Session: nowhere.**

`TradingSessionService.start` does not subscribe to a stream, does not admit a candle, and does not dispatch a tick:

```ts
// apps/api/src/modules/trading-session/trading-session.service.ts — start()
if (session.origin === 'strategy') {
  await this.runtime.loadContext({
    workspaceId: session.workspaceId,
    sessionId: session.id,
    deploymentId: session.deploymentId,
    exchangeScopeId: session.exchangeScopeId,
  });
}
// attach lease, transition to RUNNING
if (session.origin === 'strategy') {
  await this.runtime.arm({
    workspaceId: session.workspaceId,
    sessionId: session.id,
    fencingToken: lease.fencingToken,
    nowIso: command.nowIso,
    reason: 'session started',
  });
}
```

`PaperSessionManager.start` only calls `startPaperSession` (status flip), saves, and publishes `PaperSessionStarted`. No market input.

### Market data that exists elsewhere (not this runtime)

These modules exist in the API. None of them is started by Paper Session / Command Center Start Session, and none of them feeds the started session.

**Real exchange stream**

`BinanceWebSocketConnector` can consume public Binance kline frames and map them to closed-candle drafts. The Nest `LiveMarketDataModule` does **not** register or connect that connector on boot. It does not enter the started session runtime.

**Mock / fake connector**

`FakeLiveMarketConnector` exists for tests. It does not enter the started session runtime.

**Replay**

Deterministic replay tests exist for Live Market Data. Research can invoke `PaperTradingRunner.runCycle`. Neither is Command Center paper runtime.

**REST candles**

`SignalEngineService.evaluate` loads a cached candle window (limit 100) via `MarketDataCacheService`, filling from the active market-data provider on cache miss. That happens only if someone separately calls Signal Engine. Not after session start.

**Ticks**

Live Market Data can model mark-price events in projection. Strategy Runtime admission is **closed-candle** (`admitClosedCandleTick`), not a tick loop. Ticks do not enter the started session runtime.

**Live Market Data product**

Query API + SSE projection. Module comment: “No strategy / Orders / accounting.”

`LiveMarketDataModule` providers include an empty `LiveMarketConnectorRegistry`, validator, subscription/checkpoint stores, and `LatestMarketStateProjection`. They do not include `BinanceWebSocketConnector` or `StartupRecoveryService`.

---

## 2. After market data arrives, what receives it first?

**For a started paper / trading session: nothing arrives, so there is no runtime chain.**

If Live Market Data independently received a closed candle, the implemented market-data chain (not trading) is:

1. Connector frame (`BinanceWebSocketConnector` / kline mapper) — class exists; not auto-started by the Nest module.
2. `normalizeClosedCandle` → `MarketClosedCandle`
3. Integrity / checkpoint
4. `LatestMarketStateProjection` (Inbox consumer)
5. Optional SSE fan-out via `MarketProjectionBroadcaster`

Search under `live-market-data` finds no call to `StrategyRuntime`, `StrategyTradingPipeline`, `admitTick`, or `TradingSession`.

The **callable** trading chain, used only when a caller already has a closed-candle event, is:

```text
closed candle event
  → StrategyTradingPipelineService.run
    → StrategyRuntimeService.evaluate
      → RuntimeLifecycleCoordinator (must be ARMED)
      → RuntimeEvaluationService.evaluate
        → admitClosedCandleTick
        → decideRuntimeEvaluation
        → persist SignalIntent (when actionable)
    → OrderService.proposeOrderFromSignalIntent
    → CanonicalOrderPathService.runCanonicalPath
      → risk + paper execution/fill + accounting
```

Production callers of `StrategyTradingPipelineService.run` in `apps/`:

- `strategy-trading-pipeline.service.ts` (definition)
- `strategy-trading-pipeline.service.spec.ts`
- `validation/m3/us223-strategy-e2e-candle-fill-accounting.integration.spec.ts`

No controller, outbox consumer, or worker invokes it.

---

## 3. Does any component periodically execute `Strategy.evaluate()` or equivalent?

**Not after session start.**

The following exist as code. Session start does not drive them.

- `StrategyRuntimeService.evaluate` → `RuntimeEvaluationService.evaluate` — exists; not invoked after start.
- `decideRuntimeEvaluation` (Deployment parameters + admitted closed candle) — exists; not invoked after start.
- `SignalEngineService.evaluate` → `StrategyRunner.run` → indicator `evaluator.evaluate` — exists; invoked only by HTTP `POST /v1/market/signal/evaluate` or a separately created evaluation schedule.
- `EvaluationSchedulerService` (`setInterval` after `POST /v1/evaluation-schedules`) — exists; session start does not create a schedule.
- Continuous candle/tick worker for a RUNNING Trading Session — **missing**.

After start, Strategy Runtime is `ARMED` and `acceptsEvaluation` is true. Evaluation still requires an external caller to pass a closed candle. Session start is not that caller.

Runtime evaluation is **not** the indicator Strategy Evaluator classes (`SmaStrategyEvaluator`, `RsiStrategyEvaluator`, and similar). Those belong to Signal Engine.

`PaperTradingRunner.runCycle` calls `this.strategy.execute(context)`. The `PaperStrategy` contract says concrete strategies arrive in later user stories. The runner “Performs no market simulation.” Research API can invoke `runCycle` on demand. Command Center start does not.

---

## 4. Does any component execute `Tactic.evaluate()` or equivalent?

**No trading-runtime tactic evaluation.**

The closest function is `evaluateTacticPoint` in Strategy Library eligibility (`strategy-eligibility.ts`). It checks a certification tactical envelope (symbol, timeframe, exchange scope, risk) during library eligibility. It is not called from session runtime.

Runtime adaptation is explicitly unimplemented:

```ts
// apps/api/src/modules/strategy-library/domain/tactical-envelope-binding.ts
/** Epic 4: envelope is configuration only — no runtime adaptation APIs. */
export function tacticalEnvelopeRuntimeAdaptationImplemented(): false {
  return false;
}
```

---

## 5. How is a trading signal produced? (real implementation)

Two disconnected systems exist. Neither is started by Command Center / Paper Session start.

### A. Strategy Runtime Signal Intent (canonical path)

Only when something already supplies a closed-candle event and calls `evaluate`:

1. `RuntimeEvaluationService.evaluate`
2. `admitClosedCandleTick`
3. `decideRuntimeEvaluation(deployment, candle)`

`decideRuntimeEvaluation` does **not** run indicators. It reads immutable Deployment parameters:

- `parameters.action` = `buy` | `sell` | `hold` → emit that direction, or `NO_ACTION` for hold
- `parameters.compareCloseToOpen === true` → BUY if close > open, SELL if close < open, else hold
- otherwise → `NO_ACTION` (`no actionable deployment parameters`)

On `SIGNAL_INTENT`, it creates and persists a Signal Intent (plus checkpoint + outbox `SignalIntentCreated`). HTTP for Signal Intents is read-only; there is no public create.

### B. Legacy Signal Engine `SignalResult`

1. `POST /v1/market/signal/evaluate` (or Evaluation Scheduler, if a schedule was created separately)
2. `SignalEngineService.evaluate` loads candles from cache / provider
3. `StrategyRunner.run` resolves an evaluator (`sma`, `rsi`, and similar) and calls `evaluator.evaluate({ strategy, candles })`
4. Returns `SignalResult` (`BUY` / `SELL` / `HOLD`)

This path is on-demand. It is not bound to a Trading Session, Deployment, or Command Center start.

There is no outbox consumer of `SignalIntentCreated` that creates orders. Order creation from a Signal Intent is a direct service call inside `StrategyTradingPipelineService.run`.

---

## 6. After a signal exists, what creates a Paper Order?

### Canonical path (exists; not auto-invoked)

```ts
// apps/api/src/modules/strategy-trading-pipeline/strategy-trading-pipeline.service.ts
const signalIntent = evaluation.intent;
const order = await this.proposals.proposeOrderFromSignalIntent({/* ... */});
const pathResult = await this.canonicalPath.runCanonicalPath({/* ... */});
```

Then:

1. `OrderService.proposeOrderFromSignalIntent` → `OrderService.create` (persists a paper-mode Order against the Trading Session / paper account)
2. `CanonicalOrderPathService.runCanonicalPath` → risk + paper execution / fill / accounting

Proven only when a test constructs a candle and calls `pipeline.run(...)`.

### Other order paths (not strategy auto-execution after start)

- `POST /v1/orders` creates `origin: 'manual'` orders. Unrelated to session-start evaluation.
- US208 `POST /v1/paper/sessions/:id/orders` is **retired**. Controller exposes `GET` orders only. Web `executePaperTrade` still posts to that removed route.
- Legacy US010 `PaperTradingModule` / US016 `PaperTradingExecutorModule` exist as source but are **not** imported in `app.module.ts`. They do not run in the mounted API.

After Command Center Start Session, **no Paper Order is created**.

---

## 7. Does the runtime repeatedly process every candle, every tick, or another event? Or is execution manual?

**After Start Session: neither a candle loop nor a tick loop. Execution is not automatic.**

What the started runtime does:

1. Worker state becomes `ARMED`.
2. It can accept ticks and evaluation **if called**.
3. Nothing calls it.

Manual / separate mechanisms that exist and are **not** started by session start:

- HTTP Signal Engine evaluate
- HTTP Evaluation Scheduler (interval then Signal Engine; scheduler comment: “executes nothing: no orders”)
- Manual `POST /v1/orders`
- Research `runCycle` (orchestration stub, no market simulation)
- Tests calling `StrategyTradingPipelineService.run` with a constructed candle

---

## 8. What happens after Command Center → Start Session?

Until the first Paper Order: **the path ends. No order is created.**

1. Operator confirms Start. UI copy says this does not place orders.
2. `executeSessionLifecycleCommand` → `api.startTradingSession`.
3. Wizard path (`CreateBotWizardPage.onSubmit`): create paper account → create Trading Session → `startTradingSession`.
4. HTTP `POST /v1/trading-sessions/:id/start` (`TradingSessionCommandController.start`).
5. `BotFacadeService.startBot` → `TradingSessionService.start`.
6. Enforcement check: strategy-origin session must have a prior Runtime Enforcement PASS on the bound Deployment.
7. Status `STARTING`.
8. `runtime.loadContext` (approved Deployment + checkpoint).
9. Session lease attached. Status `RUNNING`. Event `TradingSessionStarted`.
10. `runtime.arm` → `RuntimeLifecycleCoordinator` worker state `ARMED`.
11. **Stop.** No market subscribe. No `admitTick`. No `evaluate`. No `StrategyTradingPipeline.run`. No `proposeOrderFromSignalIntent`. No Paper Order.

PC-13 integration test asserts this lifecycle (`RUNNING` + `runtime.arm` + worker `ARMED`). It does not assert evaluation or orders.

### Parallel: Paper Trading page Start

1. `api.startPaperSession` → `POST /v1/paper/sessions/:id/start`.
2. `PaperSessionManager.start` → status `RUNNING` + `PaperSessionStarted`.
3. **Stop.** No strategy binding. No order path. Direct paper order POST is retired.

---

## 9. If runtime execution is not implemented — what is missing

Relative to “session start → strategy runs on market data → Paper Order”:

1. No production caller that, after session start, feeds `MarketClosedCandle` (or any candle) into Strategy Runtime or `StrategyTradingPipelineService.run`.
2. No bridge from Live Market Data (projection / SSE / connector) into Strategy Runtime.
3. Live Market Data Nest module does not register or connect `BinanceWebSocketConnector` on boot.
4. Session start does not call `admitTick`, `evaluate`, `enableEventAdmission` (except recovery services, which are not the start path), or order proposal.
5. No continuous worker that processes every closed candle or tick for the RUNNING session.
6. No trading-runtime `Tactic.evaluate`. Tactical envelope is configuration; `tacticalEnvelopeRuntimeAdaptationImplemented()` returns `false`.
7. Runtime evaluator, when invoked, does not run the bound strategy’s indicator logic. It reads Deployment `action` / `compareCloseToOpen`.
8. US208 Paper Session has no strategy binding and no order-creation path after start.
9. `StrategyTradingPipelineService` is mounted in `app.module` but has no HTTP or event consumer.
10. Legacy auto paper path (Evaluation Scheduler → Paper Trading Executor) is not mounted in `app.module`.
11. `PaperTradingRunner` / `PaperStrategy.execute` is a stub contract used by research/smoke, not Command Center.
12. `SignalIntentCreated` is written to outbox; no consumer turns it into an Order outside the pipeline `run` call.

---

## 10. Trader-language explanation

Continuous runtime execution after Start Session **is not implemented**. This is what actually happens:

The operator starts the session.

The system checks that the Deployment is allowed to run.

The session is marked running.

The paper runtime is armed and waits.

No new candle is delivered to that session.

The strategy is not checked.

No tactic is asked.

No BUY or SELL is produced.

No Paper Order is created.

The virtual portfolio does not change because of the start.

The report is not updated from a new trade.

---

## Lifecycle vs execution (what exists vs what runs)

- Create / start / pause / stop Trading Session — implemented; **runs after Start Session** (this is what start does).
- Arm Strategy Runtime worker to `ARMED` — implemented; **runs after Start Session**.
- Accept/evaluate a closed candle for that session — implemented as code; **does not run after start**.
- Produce Signal Intent from a candle — implemented as code; **caller-driven only**.
- Signal Intent → Paper Order → fill — implemented as code; **tests only**.
- Indicator strategy evaluators (SMA, RSI, and similar) — implemented; **Signal Engine HTTP/schedule, not session start**.
- Tactic runtime evaluation — **not implemented**.
- Continuous strategy execution after Start — **not implemented**.

---

## Tests that show intended vs actual

- `pc13-command-center-product.integration.spec.ts` — Start → `RUNNING` + `runtime.arm` only. Product scope does not place orders.
- `us208-paper-trading-api.contract.spec.ts` — After paper session start, orders/executions stay empty; order POST retired.
- `us223-strategy-e2e-candle-fill-accounting.integration.spec.ts` — Full candle → fill works when the **test** constructs a candle and calls `pipeline.run`.
- `strategy-trading-pipeline.service.spec.ts` — Pipeline behavior when invoked.
- `paper-trading-runner.spec.ts` — Runner cycles call stub `PaperStrategy`; no market simulation.

---

## Final statement

Version 2 paper trading after Start Session is **lifecycle management**, not a running trading engine.

The operator can start a paper session. The session becomes running and the runtime is armed. Market data does not enter that runtime. Strategies are not evaluated on a schedule of candles or ticks. Tactics are not evaluated. Paper Orders are not created by the start path.

**STOP.** No implementation. No fixes. No architecture changes.
