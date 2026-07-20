# RC-1.1 — Performance Report

**Date:** 2026-07-20  
**Task:** Performance Validation  
**Validator:** `PerformanceRunner`  
**Command evidence:** `pnpm release:validate` → Performance Smoke

## Method

| Approach                                                                                       | Result                  |
| ---------------------------------------------------------------------------------------------- | ----------------------- |
| Lightweight in-process scenarios (orders / positions / sessions / reconnect / kill / recovery) | Executed                |
| `performance-benchmark` vitest suite                                                           | Executed                |
| Production API binary available                                                                | Yes (`pnpm build` PASS) |

## Metrics

| Metric                 | Value    |
| ---------------------- | -------- |
| Orders (100)           | 0.050 ms |
| Positions (50)         | 0.027 ms |
| Paper sessions (10)    | 0.012 ms |
| Reconnect simulation   | 0.734 ms |
| Kill switch simulation | 0.007 ms |
| Recovery replay        | 0.004 ms |
| Total scenario time    | 0.833 ms |
| RSS                    | 93.4 MB  |
| Heap used              | 25.7 MB  |
| Heap delta             | 0.05 MB  |
| CPU user               | 1227 µs  |
| CPU system             | 55 µs    |
| Errors                 | 0        |

## Assessment

All lightweight scenarios completed well under the 5s warning threshold. Benchmark suite succeeded. RC-1 performance phase certified PASS without suppressing thresholds.

## Verdict

**PASS**

Authoritative validator report: `docs/releases/rc-1/performance.md`
