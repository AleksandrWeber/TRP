# W2-S04-d Implementation Report — Paper Positions, Portfolio & PnL Foundation

**Status:** Implemented; slice review pending Product Owner review
**Scope:** W2-S04-d only
**Date:** 2026-08-26

## Delivered

- Paper Positions derived from Paper Fills (average-cost netting).
- Paper Portfolio projection (cash, equity, positions, PnL totals).
- Paper Balance (cash) synced from fills onto the Paper Account current balance.
- Realized and Unrealized PnL (marks from FRESH Market Data last price).
- Execution History derived from Paper Fills.
- Audit outcomes: paper_position_created / updated, paper_portfolio_updated, paper_balance_updated, paper_pnl_updated.
- Operator UI: View Positions, Portfolio, Paper Balance, Realized/Unrealized PnL, Execution History.
- API: `GET positions`, `GET portfolio`, `GET pnl`, `GET execution-history`.

## Explicitly not delivered

- No Ledger, exchange balances/positions/portfolio/PnL, Risk, Strategy, Margin, Leverage, Liquidation, Live Trading, Exchange Orders.
- No W2-S04-e.

## Mandatory Questions

1. **What customer-visible functionality was delivered?**
   Operators can view Paper Positions, Portfolio, Paper Balance, Realized/Unrealized PnL, and Execution History after fills.
2. **How are Paper Positions calculated?**
   Chronological average-cost netting of Paper Fills by exchange+symbol (BUY increases / SELL reduces; flips supported).
3. **How is Paper Portfolio derived?**
   From open Paper Positions plus paper cash, marked with Market Data last prices when FRESH.
4. **How is Paper Balance calculated?**
   Starting Balance plus cash effects of fills (BUY deducts notional; SELL credits notional); persisted as account currentBalance.
5. **How is Realized PnL calculated?**
   On reducing fills: (exit − average entry) × closed quantity, signed by side.
6. **How is Unrealized PnL calculated?**
   (mark − average entry) × open quantity for LONG (inverse for SHORT), using FRESH Market Data last price; null if mark unavailable.
7. **Can any Portfolio value represent exchange assets?**
   No.
8. **Can any Balance represent real capital?**
   No.
9. **Can PnL represent exchange profit?**
   No.
10. **Were any ownership boundaries changed?**
    No.
11. **Were any architectural deviations introduced?**
    No.

## Transition Safety

- Version 2 Trading Core was not modified.
- Version 2 Ledger remains authoritative.
- Version 2 Portfolio remains unchanged.
- Version 2 Position Engine remains unchanged.
- No second Ledger exists.
- No second Canonical Order Path exists.
- No duplicate financial Source of Truth exists.
- Paper Positions remain product projections.
- Paper Portfolio remains a paper-only projection.
- Paper PnL remains a paper-only calculation.
- Honest Product principles remain satisfied.

---

**STOP.** Wait for Product Owner review before W2-S04-e.
