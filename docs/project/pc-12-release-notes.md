# PC-12 Exchange Scope Product — Release Notes

**Package:** PC-12 Exchange Scope Product  
**Date:** 2026-08-15

Exchange Scope is now a customer product (UI: Cluster). Operators can list workspace scopes, see the known exchange list, create and rename Clusters, activate / suspend / archive them, and inspect versions, bindings, policy inputs, lifecycle, history, and metadata.

This is not a live exchange terminal, not a venue adapter, and not a second Runtime, Session, or Risk engine. Exchange Scope remains the isolation owner. Cluster cannot trade.

---

## Added

- Cluster at `/clusters` and `/clusters/:exchangeScopeId`
- `GET /v1/exchange-scopes`, `GET /v1/exchange-scopes/workspace`, `GET /v1/exchange-scopes/venues`
- Create / rename / activate / suspend / archive / config / policy / bindings REST over existing ports
- Paper trading nav and Overview tile

## Unchanged in this release

- `GET /v1/exchange-scopes/default`
- Runtime, Trading Session, Deployment
- Adapter `/trading/exchanges` remains out of the product path

## Not in this release

- Live venue adapters / exchange APIs
- Live capital
- Qualification / Profile / Market State product UIs (PC-08 … PC-10)

---

**STOP.** Wait for review before **PC-08 Qualification Product**.

---

**End of Release Notes.**
