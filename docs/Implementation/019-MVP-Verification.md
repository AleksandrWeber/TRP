# MVP Verification Notes (019)

Date: 2026-07-15

Canonical limits from `CANONICAL.md` remain in force:

- 1 user · Binance · BTCUSDT · EMA crossover · 1h · OpenRouter gateway (optional offline)

## Verified modules

| Sprint                      | Status                                   |
| --------------------------- | ---------------------------------------- |
| 009 Auth                    | JWT login, guards, seed user             |
| 010 Workflow                | `research_pipeline` with persisted steps |
| 011 Events                  | In-process EventBus + `DomainEventLog`   |
| 012/013 Research+Validation | Backtest + verdict (Stage 0)             |
| 014 Knowledge               | Store/search validated/approved entries  |
| 015 Production              | Paper signal → adapter → execution       |
| 016 AI                      | Gateway + OpenRouter / offline fallback  |
| 017 Dashboard               | Home overview + module pages             |
| 018 First Strategy          | `ema-crossover` 20/50                    |

## Manual acceptance path

1. Login (`admin@trp.local`)
2. Research → import BTCUSDT 1h
3. Workflows → run pipeline (optionally approve needs_review)
4. Knowledge → confirm entry if eligible
5. Production → deploy → tick → execution history
6. AI → summarize experiment id
7. Dashboard → counts update

Profitability is not required for MVP acceptance.
