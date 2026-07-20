# RC-1 — Smoke Test

**Date:** 2026-07-20
**Status:** PASS
**Duration:** 3522 ms

## Summary

Functional smoke suites passed for trading and research areas.

## Metrics

| Metric      | Value |
| ----------- | ----- |
| areas       | 14    |
| areasPassed | 14    |
| exitCode    | 0     |

## Warnings

- UI routes registered in App.tsx; browser E2E not executed in smoke phase

## Area Results

| Area               | Result | Detail                                         |
| ------------------ | ------ | ---------------------------------------------- |
| Authentication     | PASS   | Covered by focused module/contract smoke suite |
| Research Dashboard | PASS   | Covered by focused module/contract smoke suite |
| Research Engine    | PASS   | Covered by focused module/contract smoke suite |
| Optimization       | PASS   | Covered by focused module/contract smoke suite |
| Portfolio          | PASS   | Covered by focused module/contract smoke suite |
| Positions          | PASS   | Covered by focused module/contract smoke suite |
| Orders             | PASS   | Covered by focused module/contract smoke suite |
| Risk               | PASS   | Covered by focused module/contract smoke suite |
| Paper Trading      | PASS   | Covered by focused module/contract smoke suite |
| Exchange           | PASS   | Covered by focused module/contract smoke suite |
| Live Trading       | PASS   | Covered by focused module/contract smoke suite |
| Kill Switch        | PASS   | Covered by focused module/contract smoke suite |
| Recovery           | PASS   | Covered by focused module/contract smoke suite |
| Synchronization    | PASS   | Covered by focused module/contract smoke suite |

## Output (truncated)

```

 RUN  v3.2.7 /Users/oleksandrsvacko/Desktop/myProjects/trp/apps/api

 ✓ src/modules/position-engine/position.service.spec.ts (6 tests) 25ms
 ✓ src/validation/m2/us204-portfolio-engine.integration.spec.ts (3 tests) 291ms
 ✓ src/modules/order-engine/order.service.spec.ts (7 tests) 31ms
 ✓ src/validation/m2/us205-position-engine.integration.spec.ts (2 tests) 432ms
 ✓ src/validation/m2/us206-order-lifecycle.integration.spec.ts (1 test) 242ms
 ✓ src/validation/m2/us208-paper-trading-api.contract.spec.ts (2 tests) 10ms
 ✓ src/modules/smoke-backtest/smoke-backtest.service.spec.ts (34 tests) 27ms
 ✓ src/modules/portfolio-engine/portfolio.service.spec.ts (6 tests) 7ms
 ✓ src/modules/live-trading-engine/live-trading.service.spec.ts (10 tests) 21ms
 ✓ src/modules/paper-trading-engine/paper-trading.service.spec.ts (8 tests) 24ms
 ✓ src/validation/m2/us206-order-api.contract.spec.ts (1 test) 13ms
 ✓ src/modules/auth/authentication.service.spec.ts (10 tests) 1198ms
 ✓ src/modules/portfolio-engine/domain/portfolio.spec.ts (6 tests) 4ms
 ✓ src/modules/position-engine/position-calculator.spec.ts (9 tests) 8ms
 ✓ src/modules/strategy-optimization/strategy-optimization.service.spec.ts (30 tests) 25ms
 ✓ src/modules/exchange-adapter/exchange-adapter.service.spec.ts (19 tests) 16ms
 ✓ src/modules/research-control-center/research-control-center.service.spec.ts (8 tests) 101ms
 ✓ src/modules/risk-engine/risk.service.spec.ts (5 tests) 13ms
 ✓ src/modules/risk-engine/risk-policy-engine.spec.ts (11 tests) 5ms
 ✓ src/modules/order-engine/order-validator.spec.ts (7 tests) 7ms
 ✓ src/validation/m2/us205-position-api.contract.spec.ts (2 tests) 8ms
 ✓ src/modules/historical-research/historical-research.service.spec.ts (2 tests) 10ms
 ✓ src/modules/risk-engine/exposure-calculator.spec.ts (5 tests) 4ms
 ✓ src/validation/m2/us204-portfolio-api.contract.spec.ts (2 tests) 8ms
 ✓ src/modules/portfolio-engine/portfolio-calculator.spec.ts (8 tests) 33ms
 ✓ src/modules/paper-trading-engine/domain/paper-session.spec.ts (2 tests) 4ms
 ✓ src/modules/portfolio-engine/portfolio-snapshot.service.spec.ts (1 test) 7ms
 ✓ src/modules/live-trading-engine/domain/live-session.spec.ts (5 tests) 4ms
 ✓ src/modules/auth/jwt-secret.spec.ts (2 tests) 3ms
 ✓ src/modules/auth/command-authorization.service.spec.ts (2 tests) 2ms
 ✓ src/validation/m2/us210-live-trading-api.contract.spec.ts (1 test) 6ms
 ✓ src/modules/auth/roles.guard.spec.ts (4 tests) 3ms
 ✓ src/modules/historical-research/historical-replay.engine.spec.ts (2 tests) 6ms

 Test Files  33 passed (33)
      Tests  223 passed (223)
   Start at  17:04:52
   Duration  3.03s (transform 2.81s, setup 0ms, collect 15.01s, tests 2.60s, environment 4ms, prepare 2.43s)



```

## Verdict

**PASS**
