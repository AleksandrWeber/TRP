# RC-20 Epic Breakdown — Command Center

**Document:** RC-20 Epic Breakdown  
**Status:** PLANNING — awaiting approval  
**Date:** 2026-08-10  
**Nature:** Planning only. No implementation.

**Parent:** [RC-20 Implementation Plan](./rc-20-implementation-plan.md)  
**Layout:** [Command Center Layout](./rc-20-command-center-layout.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.16, §9  
**Roadmap:** [V2 Implementation Roadmap — RC-20](./v2-implementation-roadmap.md)

---

## Release epic map

```text
Epic 1  Ops status & recovery/kill read models
  ↓
Epic 2  Command Center workspace shell + global status
  ↓
Epic 3  Exchange Scope overview (read-only)
  ↓
Epic 4  Bot / Session / Paper Trading monitoring
  ↓
Epic 5  Operational lifecycle controls (pause / resume / stop)
  ↓
Epic 6  Kill Switch / emergency controls (durable ports)
  ↓
Epic 7  Authority conformance & RC-20 acceptance
```

---

## Epic 1 — Ops status & recovery/kill read models

### Objective

Expose SoT-backed **read** projections needed by Command Center: session fleet summary, recovery/incident attention, Kill Switch state — without creating a new lifecycle owner.

### Dependencies

- RC-19 CLOSED (Session + `exchangeScopeId` + Bot Facade)
- Existing Session / Risk / recovery ports
- ADR-014 / ADR-016 safety semantics

### Definition of Done

- [ ] Status/read APIs (or extended existing ports) provide: session counts by state, kill armed?, recovery/incident attention flags, paper mode label.
- [ ] Reads are projections over Session/Risk durable state — not a parallel store.
- [ ] Contract tests: projection matches SoT after pause/kill transitions.
- [ ] No Execution adapter calls from status layer.

### Expected user value

Operators can trust that “what the UI will show” is grounded in the same durable state recovery already uses — before the shell is built.

---

## Epic 2 — Command Center workspace shell + global status

### Objective

Deliver the first Command Center **operations workspace** page/shell with the global system status region per the layout spec — not an IDE and not a report console.

### Dependencies

- Epic 1 read models
- UX Vision (desktop-first; non-authoritative dashboard rule)
- Existing web app routing/layout patterns (extend, do not invent a second app)

### Definition of Done

- [ ] Navigable Command Center entry in the product UI.
- [ ] Global status strip: paper mode, kill state, session attention counts, last refreshed.
- [ ] Explicit empty/error/loading for projection failures (no fake healthy state).
- [ ] No AI panel, no reporting widgets, no Library UI in the shell.

### Expected user value

One place to open when asking “is the system OK right now?”

---

## Epic 3 — Exchange Scope overview (read-only)

### Objective

Show the default Exchange Scope (Cluster) overview card: identity, paper binding context, high-level capacity/session usage if already available — read-only.

### Dependencies

- Epic 2 shell
- RC-19 Exchange Scope identity (`exchange-scope:binance`)

### Definition of Done

- [ ] Exchange overview region rendered per layout.
- [ ] Displays scope id / venue label for default Binance scope.
- [ ] No multi-exchange switcher product; no Exchange Risk Policy editor.
- [ ] No cloned Risk/Ledger per scope.

### Expected user value

Operators see which venue/scope the running paper fleet belongs to — without a multi-cluster admin product.

---

## Epic 4 — Bot / Session / Paper Trading monitoring

### Objective

Populate Bot overview, active sessions, and running Paper Trading regions as non-authoritative lists/detail projections (Bot = Session via Facade).

### Dependencies

- Epics 1–3
- Bot Facade (RC-19)
- Trading Session list/get ports

### Definition of Done

- [ ] Bot overview lists sessions with state badges (UI may say Bot).
- [ ] Active sessions filter excludes terminal noise appropriately.
- [ ] Running Paper Trading region labels paper path activity.
- [ ] Detail drill uses Session/Facade reads only.
- [ ] No Bot persistence table; id === sessionId discipline preserved.

### Expected user value

Operators see which Bots/Sessions are live on paper without hunting disconnected pages.

---

## Epic 5 — Operational lifecycle controls

### Objective

Wire pause / resume / stop actions from Command Center to Session ports (Bot Facade allowed).

### Dependencies

- Epic 4 monitoring
- Session lifecycle commands (existing)
- Fail-closed recovery/kill interaction rules

### Definition of Done

- [ ] Pause / resume / stop available on eligible sessions from Command Center.
- [ ] Each action calls canonical ports only; UI updates after SoT confirms.
- [ ] Rejected/illegal transitions surface errors; no optimistic fake state as SoT.
- [ ] Tests: control path does not create orders or touch adapters.
- [ ] Tactic-select not offered.

### Expected user value

Operators can calm or stop a misbehaving Bot/Session from the ops workspace safely.

---

## Epic 6 — Kill Switch / emergency controls

### Objective

Productize Kill Switch activate/clear in Command Center over **durable** Risk/Session safety ports (not UI-only; not a new kill engine).

### Dependencies

- Epic 1 kill read model
- Epic 5 control patterns
- Existing Kill Switch semantics (live-trading-engine / Risk safety lineage — fold presentation into CC, keep ownership)

### Definition of Done

- [ ] Activate Kill Switch from Emergency region with reason capture as required by existing ports.
- [ ] Clear Kill Switch is explicit and permission-documented.
- [ ] Durable state: restart leaves kill armed if it was armed.
- [ ] Projection and control agree; no second kill flag in frontend storage.
- [ ] Evidence/tests for block-new-execution behavior under kill (per existing ADR-016 expectations).
- [ ] AI/Telegram cannot activate kill in V2.

### Expected user value

One emergency control that actually stops risk — and survives API restart.

---

## Epic 7 — Authority conformance & RC-20 acceptance

### Objective

Prove Command Center did not become Reporting, AI, Command-API SoT, or a finance dashboard; close RC-20 against the Implementation Plan.

### Dependencies

- Epics 1–6 Done
- [RC-20 Implementation Plan §7](./rc-20-implementation-plan.md)

### Definition of Done

- [ ] Conformance checklist signed: projection-only finance/lifecycle; commands via ports only.
- [ ] Negative evidence: no Lake/Reporting/AI/Library surfaces shipped in RC-20.
- [ ] Deferred register updated (tactic-select → post RC-22; IDE → RC-21; Library → RC-22; etc.).
- [ ] Auth caveat recorded if TD-005/006 not closed (no false multi-operator claims).
- [ ] RC-20 Closure Report drafted with Architecture Impact.
- [ ] All Implementation Plan acceptance criteria checked.

### Expected user value

The team can claim an ops Command Center foundation without lying about authority or scope.

---

## Cross-epic constraints

| Constraint                                 | Applies     |
| ------------------------------------------ | ----------- |
| No architecture redesign                   | All         |
| No new SoT modules                         | All         |
| No Strategy Library / envelope enforcement | All (RC-22) |
| No Reporting / AI                          | All         |
| Bot = Session alias only                   | Epics 4–5   |
| Kill Switch durable                        | Epic 6      |
| Roadmap order unchanged                    | All         |

---

## Suggested story band

Story IDs are **not** assigned here. After plan approval, allocate from [`story-id-allocation.md`](./story-id-allocation.md) in a separate drafting task.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
