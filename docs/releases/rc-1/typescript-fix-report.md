# RC-1.1 — TypeScript Fix Report

**Date:** 2026-07-20  
**Task:** TypeScript Recovery  
**Command:** `pnpm typecheck`  
**Prior status:** 30 errors in `@trp/api`

## Policy

- No `ts-ignore` / `ts-expect-error`
- No strict-mode weakening
- No diagnostic suppression
- Prefer proper types over `any`

## Error categories and remediations

| Category              | Files                                                                                        | Fix                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Unexported type       | `chaos-scenarios.ts`                                                                         | Export `ChaosServiceFactories`                                                                           |
| Async market data     | `failing-market-data-provider.ts`, `historical-replay-strategy.ts`, `stub-paper-strategy.ts` | Align `next()` / `execute()` with `Promise<Candle \| null>`                                              |
| Event typing          | `failing-research-orchestrator.ts`                                                           | Match orchestrator `domainEvents()` contract                                                             |
| Failure injector      | `failure-injector.ts`                                                                        | Strategy guard; stop illegal `HistoricalMarketDataProvider` overrides; explicit callback parameter types |
| Architecture verifier | `architecture-readiness-verifier.ts`                                                         | Compare via `Set<unknown>`; safe prototype/`execute` checks                                              |
| Spec mocks            | chaos / live-readiness / regression / historical / smoke specs                               | Complete required fields (`reset`, `failFast`, full `ExecutionResult`, `readonly string[]` clocks)       |

## Verification

```text
pnpm typecheck
→ Exit Code 0 (apps + packages)
pnpm --filter @trp/api exec tsc --noEmit
→ 0 errors
```

## Verdict

**PASS**
