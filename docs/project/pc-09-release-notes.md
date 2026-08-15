# PC-09 Market Profile Product — Release Notes

**Package:** PC-09 Market Profile Product  
**Date:** 2026-08-15

Market Profile is now a customer product. Operators can inspect latest published versions, version history, version details, metadata, dimensions, and the Qualification published source, and compare versions on metadata only.

This is a research artifact. It does not calculate profiles, score markets, force trades, or start sessions. Market Profile remains the owner. Qualification and Market State are unchanged.

---

## Added

- Profile at `/market-profile`, `/market-profile/history`, `/market-profile/targets/:targetId`, `/market-profile/targets/:targetId/versions/:version`
- `GET /v1/market-profiles/workspace`, `GET /v1/market-profiles`, `GET /v1/market-profiles/history`
- Latest / versions / metadata / dimensions / published-source / compare REST over existing query ports
- Research nav and Overview tile

## Unchanged in this release

- Market Profile domain `rest: false`
- Qualification
- Market State
- PC-15 15-b Qualification → Profile publish wiring

## Not in this release

- New profile calculations / scoring
- Publish REST
- Market State product UI (PC-10)

---

**STOP.** Wait for review before **PC-10 Market State Product**.

---

**End of Release Notes.**
