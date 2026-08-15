# PC-10 Market State Product — Release Notes

**Package:** PC-10 Market State Product  
**Date:** 2026-08-15

Market State is now a customer product. Operators can inspect current state, lifecycle, transitions, version history, metadata, Qualification and Profile references, and refresh an existing snapshot.

This is a current-condition artifact. It does not classify markets, select strategies, force trades, or start sessions. Market State remains the owner. Qualification, Profile, and Trading Orchestrator are unchanged.

---

## Added

- Market State at `/market-state`, `/market-state/history`, `/market-state/targets/:targetId`, `/market-state/targets/:targetId/versions/:version`
- `GET /v1/market-states/workspace`, `GET /v1/market-states`, `GET /v1/market-states/history`
- Current / lifecycle / transitions / versions / metadata / Qualification / Profile REST over existing owner reads
- `POST /v1/market-states/targets/:targetId/refresh` (existing snapshot; observational refs updated)
- Research nav and Overview tile

## Unchanged in this release

- Market State domain `rest: false`
- Classify / query Nest ports remain inactive
- Qualification
- Profile
- Trading Orchestrator

## Not in this release

- Market classification algorithms
- Strategy selection / orchestration
- Durable persistence product

---

**STOP.** Wave C is Closed. Next packages are PC-17 AI Analytics Product and PC-16 Knowledge Lake Product. Do not begin them until this closeout is reviewed.

---

**End of Release Notes.**
