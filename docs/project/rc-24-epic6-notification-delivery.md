# RC-24 Epic 6 — Notification Delivery Layer

**Status:** Approved — Epics 1–6 complete; awaiting Validation & Release  
**Date:** 2026-08-10  
**Nature:** Notification projection delivery (Telegram active; other channels reserved) — no report generation / AI / runtime / control-plane changes  
**Parent:** [RC-24 Implementation Plan](./rc-24-implementation-plan.md) · [Epic Breakdown](./rc-24-epic-breakdown.md)  
**Contracts:** Spec v2.0 §5.16 · Authority Matrix (Notification Service = Delivery Layer only)  
**Predecessor:** [Epic 5 AI Analytical Narratives](./rc-24-epic5-ai-analytical-narratives.md) (**approved**)  
**Docs sync:** [rc-24-notification-delivery-docs-sync.md](./rc-24-notification-delivery-docs-sync.md)

> **Sequencing note:** The original planning Epic 6 (historical reporting + close readiness) is **deferred to RC-24 Validation & Release**. This epic implements the Notification Delivery Layer per the approved Epic 6 task.

---

## Implementation Report

### What shipped

- `NotificationDeliveryService` (`NotificationServicePort`):
  - Preferences get/upsert (master enable, channels, per-type routing, schedule)
  - Telegram connection workflow: Connect → adapter binds chat id → Verify → Disconnect → Test
  - `deliver` with preference-based routing + quiet-hours / critical bypass
- Channel catalog: Telegram **active**; Email / Slack / Discord / Teams / Push **reserved-inactive**
- `InMemoryTelegramAdapter` — delivery only (no trading commands)
- Process-local `InMemoryNotificationStore` (not a DB/persistence product)
- Boundary: `authorityClass: notification-projection`; SoT / runtime / Library forbidden
- Nest wiring in `AppModule`; no REST / UI / scheduler product

### Modules touched

| Path                       | Change                                                     |
| -------------------------- | ---------------------------------------------------------- |
| `notification-delivery/**` | **New** module (domain, ports, adapters, routing, service) |
| `app.module.ts`            | Import `NotificationDeliveryModule`                        |
| Reporting / AI Analytics   | **Unchanged**                                              |

### Ports / APIs affected

| Port / surface                                   | Status                 |
| ------------------------------------------------ | ---------------------- |
| `NotificationServicePort`                        | **Active**             |
| Telegram channel adapter                         | **Active** (in-memory) |
| Reserved channels                                | Declared inactive      |
| Reporting / AI ports                             | **Unchanged**          |
| REST / UI / persistence product / cron scheduler | **None**               |

### Explicit out of scope (confirmed absent)

- Telegram trading commands / pause / resume / stop / kill-switch control
- Report generation / AI narrative changes
- Runtime Enforcement / Strategy Library coupling
- Durable persistence / REST / UI product
- Full production Telegram Bot API / webhook product
- Cron scheduler product (schedule prefs + quiet-hours evaluation only)

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Notification projection already locked in Spec §5.16 + Authority Matrix;
this epic activates a delivery bounded context with Telegram as first channel)

Canonical ownership changed:
None
(Reporting still owns report generation; AI still owns narratives;
Notification owns delivery routing + channel preferences only)

New runtime:
None (no schedulers / transport product / external bot network)

Backward compatibility:
100%

Architecture debt introduced:
None
(Original planning Epic 6 close-readiness items deferred to Validation & Release)
```

### Delivery flow

```text
Reporting Engine (unchanged)
        │  completed report / ops event payload
        ▼
Notification Service  ──uses──▶  User preferences + routing
        │
        ▼
Telegram Adapter (active)
(future: Email / Slack / Discord / Teams / Push)
```

Reporting never learns delivery destinations. Notification never generates reports.

---

## Compatibility Report

| Surface                    | Result                                                               |
| -------------------------- | -------------------------------------------------------------------- |
| Spec v2.0 §5.16            | **Compatible** — Telegram is notification projection only            |
| Authority Matrix           | **Compatible** — channel messages = notification projection          |
| Alias Dictionary           | **Compatible** — no Bot-as-SoT; delivery language only               |
| Reporting ownership        | **Preserved** — no generation changes; no Reporting→channel coupling |
| AI ownership               | **Preserved** — AI Analytics untouched                               |
| Runtime / Strategy Library | **Unaffected** — not imported                                        |
| Telegram control plane     | **Forbidden** — verified absent                                      |

### Architecture validation checklist

| Check                          | Result   |
| ------------------------------ | -------- |
| Spec v2.0 compatibility        | **PASS** |
| Authority Matrix compatibility | **PASS** |
| Alias Dictionary compatibility | **PASS** |
| Reporting ownership preserved  | **PASS** |
| AI ownership preserved         | **PASS** |
| Telegram connection workflow   | **PASS** |
| Delivery routing + preferences | **PASS** |
| Test notification              | **PASS** |
| Runtime unaffected             | **PASS** |
| No trading commands            | **PASS** |

---

## Tests Summary

| Suite                    | File                                                             | Result       |
| ------------------------ | ---------------------------------------------------------------- | ------------ |
| Delivery behaviour       | `notification-delivery/notification-delivery.spec.ts`            | **PASS** (5) |
| Direction                | `notification-delivery/notification-delivery.boundaries.spec.ts` | **PASS** (2) |
| Boundary / ports         | domain + ports specs                                             | **PASS** (5) |
| Reporting (unchanged)    | reporting suites                                                 | **PASS**     |
| AI Analytics (unchanged) | ai-analytics suites                                              | **PASS**     |

**Gate:** `pnpm --filter api exec vitest run src/modules/notification-delivery src/modules/reporting src/modules/ai-analytics` → **66/66 PASS**

Coverage intent:

- Telegram Not Connected → Connect → auto chat-id bind → Connected → Test → Disconnect
- Preference routing (type enable/disable, reserved channel skip)
- Quiet hours + critical bypass
- Immutable preferences
- No Reporting / AI / Runtime / Library imports
- Reporting + AI suites remain green without modification

---

## Documentation Update Summary

| Document                                                            | Update                                                                               |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| This Epic Report                                                    | **New**                                                                              |
| [RC-24 Epic Breakdown](./rc-24-epic-breakdown.md)                   | Epic 6 redefined as Notification Delivery; DoD checked; close-readiness → Validation |
| [RC-24 Implementation Plan](./rc-24-implementation-plan.md)         | Status → Epic 6 awaiting review (superseded: Epics 1–6 complete — awaiting V&R)      |
| [Epic 5 Report](./rc-24-epic5-ai-analytical-narratives.md)          | Status → approved                                                                    |
| `docs/README.md`                                                    | Index Epic 6                                                                         |
| `project-status.md` / `roadmap.md` / `v2-implementation-roadmap.md` | Epic 6 gate                                                                          |
| Module README                                                       | Surfaces                                                                             |

---

## Epic 6 Definition of Done

- [x] Notification Service delivers through channel abstraction.
- [x] Telegram Adapter is the first active channel; others reserved inactive.
- [x] User notification preferences (enable, channels, per-type routing, schedule / quiet hours).
- [x] Telegram connection workflow (connect / verify / disconnect / test) without user-entered chat ids.
- [x] Delivery routing respects preferences + critical quiet-hours bypass.
- [x] No report generation / AI / runtime / trading-command behaviour.
- [x] Tests cover connection, routing, preferences, test notification; Reporting + AI unchanged.

**STOP:** Epic 6 approved. Docs sync: [rc-24-notification-delivery-docs-sync.md](./rc-24-notification-delivery-docs-sync.md). Next: RC-24 Validation & Release (separate workflow).
