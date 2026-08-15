# PC-08 Qualification Product — Release Notes

**Package:** PC-08 Qualification Product  
**Date:** 2026-08-15

Market Qualification is now a customer product. Operators can list workspace targets, request and confirm qualification, inspect lifecycle, confidence, health, runs, and history, and request requalification.

This is a research artifact. It does not score markets, force trades, or start sessions. Qualification remains the owner. Profile and Market State are unchanged.

---

## Added

- Qualification at `/qualification`, `/qualification/history`, `/qualification/targets/:targetId`, `/qualification/runs/:qualificationRunId`
- `GET /v1/qualification/workspace`, `GET /v1/qualification/targets`, `GET /v1/qualification/runs`
- Request / confirm / cancel / complete / fail / requalify REST over existing ports
- Research nav and Overview tile

## Unchanged in this release

- Market Qualification domain `rest: false`
- Market Profile
- Market State
- PC-15 15-b Qualification → Profile publish wiring

## Not in this release

- Scoring / new confidence calculations
- Market Profile product UI (PC-09)
- Market State product UI (PC-10)

---

**STOP.** Wait for review before **PC-09 Market Profile Product**.

---

**End of Release Notes.**
