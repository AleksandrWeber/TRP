# Runtime Engine Completion — Customer-visible Changes

**Date:** 2026-08-16

## Can now

- Start a paper Trading Session from Command Center and have it **react to closed-candle market events** without a second operator command
- Receive automatic **paper** orders when the bound Deployment evaluates to a Signal Intent
- See portfolio / ledger update from those fills
- See Reporting, Notification, and AI Analytics receive the existing post-fill report path

## Still cannot

- Authorize live capital or live venue orders
- Treat Start Session as an order
- Rely on Signal Engine / SMA / RSI inside Runtime (`decideRuntimeEvaluation` is unchanged)
- Adapt Tactical Envelope parameters at runtime
- Use a new Runtime screen or REST resource
- Treat AI text as Source of Truth

## Copy the operator sees

Start session: Trading Session will arm paper runtime if the bound Deployment is approved. Closed-candle market events then evaluate the runtime and may create paper orders. This does not authorize live capital.

Create Bot: After start, paper runtime reacts to market events. This does not authorize live trading.

---

**End of Customer-visible Changes.**
