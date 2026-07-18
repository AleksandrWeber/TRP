# RC-16 M1 Mini Validation Results (Epic E6)

Date: 2026-07-18

Status: Complete

Overall verdict: **PASS WITH MINOR RECOMMENDATIONS**

Stories: US148–US152

---

## Validation Results

| Story | Focus                                                     | Result                          |
| ----- | --------------------------------------------------------- | ------------------------------- |
| US148 | Contract/fixture suite (no live Binance)                  | PASS                            |
| US149 | PostgreSQL Outbox/Inbox/checkpoint integration            | PASS                            |
| US150 | Deterministic recorded-stream replay                      | PASS                            |
| US151 | Failure injection (disconnect, REST, quarantine, restart) | PASS                            |
| US152 | Performance baseline + architecture conformance + M1 exit | PASS WITH MINOR RECOMMENDATIONS |

Suite path: `apps/api/src/validation/m1/`

---

## Performance Baseline

Synthetic closed-candle path: normalize → integrity → projection → SSE fan-out
(drop-oldest buffer = 32). Measured on local CI-class Node.

| Size            | Events | Duration | Events/sec | Heap Δ  | Fan-out delivered | Fan-out dropped |
| --------------- | ------ | -------- | ---------- | ------- | ----------------- | --------------- |
| small           | 100    | ~4 ms    | ~24k       | ~2.5 MB | 32                | 68              |
| medium          | 1_000  | ~17 ms   | ~60k       | ~0 MB   | 32                | 968             |
| practical_limit | 5_000  | ~65 ms   | ~77k       | ~4.3 MB | 32                | 4_968           |

Limits checked (US152):

- medium duration < 15s
- medium throughput > 50 events/sec
- practical heap Δ < 256 MB
- slow subscribers drop via backpressure; ingestion acceptance remains complete

---

## Architecture Conformance

- ADR-012…ADR-018 present
- Live Market Data has no Orders/Sessions/Ledger/KillSwitch leakage
- Provider payloads remain adapter-local (public barrel clean)
- Outbox/Inbox ports + Prisma drivers present
- Query API + SSE projection channel present

Minor recommendation:

- `EventProcessingModule` still wires InMemory Outbox/Inbox by default
  (TD-035). Prisma drivers and migration are validated by US149; Nest runtime
  wiring remains M2 follow-up.

---

## Quality Gates

- Lint: PASS
- Typecheck: PASS
- Build: PASS
- M1 validation tests: PASS (22)
- Epic E5 regression (status/observability/api): PASS

---

## M1 Exit

M1 — Live Market Data Foundation is complete (US126–US152).

Next milestone: M2 — Durable Paper Order and Accounting Core.
