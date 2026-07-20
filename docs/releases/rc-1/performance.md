# RC-1 — Performance Smoke

**Date:** 2026-07-20
**Status:** PASS
**Duration:** 884 ms

## Summary

Lightweight performance smoke and benchmark suite completed.

## Metrics

| Metric          | Value  |
| --------------- | ------ |
| ordersMs        | 0.029  |
| positionsMs     | 0.015  |
| sessionsMs      | 0.007  |
| reconnectMs     | 0.526  |
| killSwitchMs    | 0.005  |
| recoveryMs      | 0.002  |
| totalScenarioMs | 0.586  |
| rssMB           | 89.6   |
| heapUsedMB      | 20.3   |
| heapDeltaMB     | 0.05   |
| cpuUserUs       | 812    |
| cpuSystemUs     | 47     |
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
