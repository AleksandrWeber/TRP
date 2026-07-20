# RC-1 — Test Report

**Date:** 2026-07-20
**Status:** PASS
**Duration:** 18991 ms

## Summary

Automated test suite passed (2109 tests).

## Metrics

| Metric      | Value |
| ----------- | ----- |
| total       | 2109  |
| passed      | 2109  |
| failed      | 0     |
| skipped     | 0     |
| filesPassed | 269   |
| filesFailed | 0     |
| exitCode    | 0     |

## Discovery

Executed via `pnpm test` (turbo → vitest across apps/packages).

Covers unit, integration, contract, and available UI/component tests.

## Raw Summary (truncated)

```


   • Packages in scope: @trp/api, @trp/research, @trp/web
   • Running test in 3 packages
   • Remote caching disabled

@trp/research:test: cache bypass, force executing 3925f528384a07c7
@trp/web:test: cache bypass, force executing 6605c28893aa8273
@trp/research:build: cache bypass, force executing 0066118e3a9c9790
@trp/research:test:
@trp/research:test: > @trp/research@0.1.0 test /Users/oleksandrsvacko/Desktop/myProjects/trp/packages/research
@trp/research:test: > vitest run
@trp/research:test:
@trp/web:test:
@trp/web:test: > @trp/web@0.1.0 test /Users/oleksandrsvacko/Desktop/myProjects/trp/apps/web
@trp/web:test: > vitest run
@trp/web:test:
@trp/research:build:
@trp/research:build: > @trp/research@0.1.0 build /Users/oleksandrsvacko/Desktop/myProjects/trp/packages/research
@trp/research:build: > tsc -p tsconfig.json
@trp/research:build:
@trp/research:test:
@trp/research:test:  RUN  v3.2.7 /Users/oleksandrsvacko/Desktop/myProjects/trp/packages/research
@trp/research:test:
@trp/api:test: cache bypass, force executing 15cda3ee2beee3e5
@trp/web:test:
@trp/web:test:  RUN  v3.2.7 /Users/oleksandrsvacko/Desktop/myProjects/trp/apps/web
@trp/web:test:
@trp/research:test:  ✓ src/backtest/engine.spec.ts (2 tests) 3ms
@trp/research:test:  ✓ src/dataset-slice/slice-resolver.spec.ts (8 tests) 23ms
@trp/research:test:  ✓ src/experiment-slice.spec.ts (5 tests) 8ms
@trp/research:test:  ✓ src/research.spec.ts (9 tests) 13ms
@trp/research:test:
@trp/research:test:  Test Files  4 passed (4)
@trp/research:test:       Tests  24 passed (24)
@trp/research:test:    Start at  17:04:34
@trp/research:test:    Duration  768ms (transform 201ms, setup 0ms, collect 578ms, tests 47ms, environment 0ms, prepare 1.03s)
@trp/research:test:
@trp/web:test:  ✓ src/pages/CampaignResultsView.spec.tsx (2 tests) 12ms
@trp/web:test:  ✓ src/pages/CampaignHistoryView.spec.tsx (2 tests) 7ms
@trp/web:test:  ✓ src/research-control/api.spec.ts (3 tests) 2ms
@trp/web:test:  ✓ src/shared/auth.spec.ts (4 tests) 4ms
@trp/web:test:  ✓ src/pages/WalkForwardCampaignPage.spec.tsx (4 tests) 30ms
@trp/api:test:
@trp/api:test: > @trp/api@0.1.0 test /Users/oleksandrsvacko/Desktop/myProjects/trp/apps/api
@trp/api:test: > vitest run
@trp/api:test:
@trp/web:test:  ✓ src/pages/MultiDatasetCampaignPage.spec.tsx (4 tests) 16ms
@trp/web:test:  ✓ src/app/WorkspaceContext.spec.tsx (2 tests) 11ms
@trp/web:test:  ✓ src/pages/CampaignAnalysisView.spec.tsx (1 test) 14ms
@trp/web:test:  ✓ src/pages/StrategiesPage.spec.tsx (4 tests) 20ms
@trp/web:test:  ✓ src/pages/CampaignRunPage.spec.ts (3 tests) 5ms
@trp/web:test:  ✓ src/shared/api.spec.ts (1 test) 5ms
@trp/web:test:  ✓ src/app/app.spec.ts (1 test) 5ms
@trp/web:test:
@trp/web:test:  Test Files  12 passed (12)
@trp/web:test:       Tests  31 passed (31)
@trp/web:test:    Start at  17:04:34
@trp/web:test:    Duration  1.09s (transform 611ms, setup 0ms, collect 1.86s, tests 131ms, environment 1ms, prepare 1.90s)
@trp/web:test:
@trp/api:test:
@trp/api:test
…[truncated 47595 chars]

```

## Verdict

**PASS**
