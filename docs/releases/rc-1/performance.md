# RC-1 — Performance Smoke

**Date:** 2026-07-20
**Status:** PASS
**Duration:** 949 ms

## Summary

Lightweight performance smoke and benchmark suite completed.

## Metrics

| Metric          | Value  |
| --------------- | ------ |
| ordersMs        | 0.026  |
| positionsMs     | 0.015  |
| sessionsMs      | 0.007  |
| reconnectMs     | 0.451  |
| killSwitchMs    | 0.004  |
| recoveryMs      | 0.002  |
| totalScenarioMs | 0.506  |
| rssMB           | 83.2   |
| heapUsedMB      | 20     |
| heapDeltaMB     | 0.05   |
| cpuUserUs       | 738    |
| cpuSystemUs     | 31     |
| errors          | 0      |
| checksum        | 315545 |

## Scenarios

- 100 orders

- 50 positions

- 10 paper sessions

- Live reconnect simulation

- Kill Switch activation

- Recovery replay

## Verdict

**PASS**
