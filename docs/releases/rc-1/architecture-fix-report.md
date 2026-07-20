# RC-1.1 — Architecture Fix Report

**Date:** 2026-07-20  
**Task:** Architecture Recovery  
**Validator:** `ArchitectureValidator`

## Issues investigated

### 1. Position REST bypass — CONFIRMED

`PositionController` exposed `POST /positions/open|increase|reduce|close`, mutating position state outside Order → Risk → Execution.

**Remediation:** Removed mutate REST handlers. Position lifecycle mutations remain on `PositionService` for `OrderExecutionService` only. Public REST retains list/get/history + `PATCH mark-price` (valuation, not size/side lifecycle). Web client helpers for mutate endpoints removed.

### 2. Duplicate Paper Trading stacks — CONFIRMED

`AppModule` co-registered:

- `PaperTradingModule` (US010 legacy)
- `PaperTradingExecutorModule` (US016 legacy)
- `PaperTradingEngineModule` (US208 canonical)

**Remediation:** Removed legacy Nest modules from `AppModule`. US208 remains the sole paper orchestration stack calling `OrderService`. US010/US016 source may remain as libraries (e.g. historical research virtual fills) but are not application-registered execution stacks.

### 3. Kill switch (warning only)

`emergency-manager.ts` may still call `positions.close` without full order lifecycle. Left as non-critical warning; preferred future path is order-based flatten.

## Verification

```text
ArchitectureValidator → PASS (0 critical)
Position mutate REST check → PASS
Duplicate paper stacks check → PASS
```

## Verdict

**PASS**
