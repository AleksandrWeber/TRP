# RC-1 — Test Report

**Date:** 2026-07-20
**Status:** PASS
**Duration:** 254 ms

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


> trp@ test /Users/oleksandrsvacko/Desktop/myProjects/trp
> turbo run test


   • Packages in scope: @trp/api, @trp/research, @trp/web
   • Running test in 3 packages
   • Remote caching disabled

@trp/research:build: cache hit, replaying logs a2ab280c3f93a40c
@trp/research:build:
@trp/research:build: > @trp/research@0.1.0 build /Users/oleksandrsvacko/Desktop/myProjects/trp/packages/research
@trp/research:build: > tsc -p tsconfig.json
@trp/research:build:
@trp/web:test: cache hit, replaying logs 8277421ed876184e
@trp/research:test: cache hit, replaying logs fe41550954adfccc
@trp/web:test:
@trp/web:test: > @trp/web@0.1.0 test /Users/oleksandrsvacko/Desktop/myProjects/trp/apps/web
@trp/web:test: > vitest run
@trp/web:test:
@trp/web:test:
@trp/web:test:  RUN  v3.2.7 /Users/oleksandrsvacko/Desktop/myProjects/trp/apps/web
@trp/web:test:
@trp/web:test:  ✓ src/shared/api.spec.ts (1 test) 4ms
@trp/web:test:  ✓ src/pages/CampaignResultsView.spec.tsx (2 tests) 9ms
@trp/web:test:  ✓ src/pages/MultiDatasetCampaignPage.spec.tsx (4 tests) 10ms
@trp/web:test:  ✓ src/pages/CampaignAnalysisView.spec.tsx (1 test) 10ms
@trp/web:test:  ✓ src/pages/WalkForwardCampaignPage.spec.tsx (4 tests) 10ms
@trp/web:test:  ✓ src/app/WorkspaceContext.spec.tsx (2 tests) 11ms
@trp/web:test:  ✓ src/pages/CampaignRunPage.spec.ts (3 tests) 7ms
@trp/web:test:  ✓ src/pages/CampaignHistoryView.spec.tsx (2 tests) 8ms
@trp/web:test:  ✓ src/pages/StrategiesPage.spec.tsx (4 tests) 15ms
@trp/web:test:  ✓ src/app/app.spec.ts (1 test) 2ms
@trp/web:test:  ✓ src/shared/auth.spec.ts (4 tests) 13ms
@trp/web:test:  ✓ src/research-control/api.spec.ts (3 tests) 15ms
@trp/web:test:
@trp/web:test:  Test Files  12 passed (12)
@trp/web:test:       Tests  31 passed (31)
@trp/web:test:    Start at  16:28:08
@trp/web:test:    Duration  1.61s (transform 2.44s, setup 0ms, collect 6.46s, tests 113ms, environment 1ms, prepare 1.50s)
@trp/web:test:
@trp/research:test:
@trp/research:test: > @trp/research@0.1.0 test /Users/oleksandrsvacko/Desktop/myProjects/trp/packages/research
@trp/research:test: > vitest run
@trp/research:test:
@trp/research:test:
@trp/research:test:  RUN  v3.2.7 /Users/oleksandrsvacko/Desktop/myProjects/trp/packages/research
@trp/research:test:
@trp/research:test:  ✓ src/backtest/engine.spec.ts (2 tests) 18ms
@trp/research:test:  ✓ src/dataset-slice/slice-resolver.spec.ts (8 tests) 9ms
@trp/research:test:  ✓ src/research.spec.ts (9 tests) 7ms
@trp/research:test:  ✓ src/experiment-slice.spec.ts (5 tests) 7ms
@trp/research:test:
@trp/research:test:  Test Files  4 passed (4)
@trp/research:test:       Tests  24 passed (24)
@trp/research:test:    Start at  16:28:08
@trp/research:test:    Duration  1.07s (transform 263ms, setup 0ms, collect 731ms, tests 41ms, environment 1ms, prepare 1.39s)
@trp/research:test:
@trp/api:test: cache hit, replaying logs a8ae57ec2816441a
@trp/api:test:
@trp/api:test: > @trp/api@0.1.0 test /Users/oleksandrsvacko/Desktop/myProjects/trp/apps/api
@trp/api:tes
…[truncated 47555 chars]

```

## Verdict

**PASS**
