# RC-19 Epic 3 — Tactical Envelope Foundation

**Status:** Implemented  
**Date:** 2026-08-10  
**Nature:** Structural configuration contract stub only

---

## Principle

The Tactical Envelope:

- is **NOT** a strategy;
- is **NOT** a runtime decision engine;
- is **NOT** AI;
- is **NOT** Trading Orchestrator.

It is an immutable **configuration envelope** that a Trading Session may optionally reference. It represents the validated operational limits within which **future** tactical adjustments will be allowed.

> **Tactical Envelope exists but is not yet active.**

Runtime ignores it completely. No validation. No enforcement. No tactical switching. No parameter mutation.

---

## Domain

Canonical module: `apps/api/src/modules/tactical-envelope/`

Structural fields (stub only):

- `timeframe`
- `allowedStrategyVersion`
- `allowedParameterRanges`
- `riskProfileReference`
- `allowedSymbols` / `allowedTimeframes` (Tactics Contract placeholders)

---

## Trading Session

- Optional field: `tacticalEnvelope: TacticalEnvelope | null`
- Default: `null` (no envelope — current behaviour preserved)
- Create path (`TradingSessionService.create`) does not assign an envelope

---

## Persistence

- Nullable JSONB column `trading_sessions.tactical_envelope`
- No optimisation, versioning, history, or policy engine
- Migration: `20260810150000_rc19_tactical_envelope_stub`

---

## Out of scope (unchanged)

Trading Orchestrator, Strategy Library, Market State, Strategy Selector, Knowledge Lake, Command Center, Risk/Execution changes, live tactical adaptation, envelope validation/optimisation, anything RC-20+.

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
Tactical Envelope as a structural (inactive) configuration contract on Trading Session

Canonical ownership changed:
None
(Envelope remains configuration; Session remains ADR-014 runtime SoT)

New runtime:
None

Backward compatibility:
100%
(Default null envelope; Runtime ignores field)

Architecture debt introduced:
None intentional
(Stub without enforcement until RC-22 — documented; must not be mistaken for active guard)
```
