# W2-S04-a Implementation Report — Paper Account Foundation

**Status:** Implemented; slice review pending Product Owner review
**Scope:** W2-S04-a only
**Date:** 2026-08-26

## Delivered

- Workspace-owned Paper Account foundation under `paper-trading-foundation`.
- Paper Account lifecycle: create → Active; disable → Disabled; activate → Active.
- Status support: Not Created, Active, Disabled.
- Currency support: USD (architecture allows additional currencies later).
- Configurable starting balance; current balance equals starting balance at create (informational only).
- Projection fields: id, workspaceId, status, baseCurrency, startingBalance, currentBalance, ownerId, createdAt, updatedAt.
- At most one Paper Account per workspace; duplicates rejected.
- Workspace isolation and existing Authorization (Projection read / PaperCommand mutate).
- Security Audit outcomes: paper_account_created, paper_account_activated, paper_account_disabled (reuses existing audit store).
- Operator UI at `/paper-trading`: Open Paper Trading, Create, View account fields, Disable/Activate.

## Explicitly not delivered

- No Paper Orders, Positions, Portfolio, PnL, Matching Engine, Execution Simulator, Trade/Order History, Market Replay.
- No Strategy Engine, Risk Engine, Live Trading, exchange orders, balance synchronization.
- No Analytics, Monitoring, Billing.
- No deposits, withdrawals, realized/unrealized PnL, margin, or leverage.
- No Market Data venue references (Binance/REST/ticker/candles/order book) inside the Paper Account foundation.
- No Master Plan, Version 2, architecture, or ownership changes.
- W2-S04-b not started.

## Mandatory Questions

1. **What customer-visible functionality was delivered?**
   Operators can open Paper Trading, create exactly one Paper Account per workspace, view currency/starting balance/current balance/status, and disable or activate the account.

2. **Which Paper Account states are now supported?**
   Not Created, Active, Disabled.

3. **Which currencies are now supported?**
   USD.

4. **What Paper Account fields are now available?**
   Paper Account Id, Workspace Id, Status, Base Currency, Starting Balance, Current Balance, Created At, Updated At, Owner.

5. **Can operators place Paper Orders?**
   No.

6. **Can operators view Positions or PnL?**
   No.

7. **Were any ownership boundaries changed?**
   No.

8. **Were any architectural deviations introduced?**
   No.

---

**STOP.** Wait for Product Owner review before W2-S04-b.
