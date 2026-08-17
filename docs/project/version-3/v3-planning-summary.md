# Version 3 Planning Summary

**Document:** Version 3 Planning Summary
**Date:** 2026-08-16
**Status:** **Superseded as entry point** — planning **FROZEN** in [`version-3-master-plan.md`](./version-3-master-plan.md)
**Nature:** Historical executive draft. Not an RC. Not an ADR. Not implementation.

**Do not use this file as the Version 3 source of truth.** Use the [Master Plan](./version-3-master-plan.md). Counts and live-gate wording below were corrected by the [Consistency Audit](./v3-planning-consistency-audit.md) (F1, F2).

---

## Verdict

**VERSION 3 PLANNING IS FROZEN** in [`version-3-master-plan.md`](./version-3-master-plan.md).
**IMPLEMENTATION MUST NOT BEGIN UNTIL THE MASTER PLAN IS ACCEPTED.**

Version 3 is a **platform extension** of certified Version 2. It is not a redesign and not a polish release.

| Question                                           | Answer                                                                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Is Version 2 finished?                             | **Yes.** Certified `v2.0.1`. Architecture `v2.0.0` preserved.                                                              |
| What is Version 3?                                 | Production Research OS: Security Platform, Connection Management, real connectivity, optional live trading.                |
| Does Version 3 redesign Version 2?                 | **No.**                                                                                                                    |
| Are new domains required?                          | **Only where justified:** Credential Vault (secrets). Live capital (existing ADR requirement). Billing (isolated, Wave 9). |
| Can implementation invent new goals later?         | **No** — unless an approved Master Plan revision.                                                                          |
| First implementation after Master Plan acceptance? | **Wave 1 — Security Foundation**, package **V3-S01**.                                                                      |

---

## Why Version 3 exists

Version 2 answered: _can a professional complete the paper-first loop on the certified architecture?_

Yes. Paper-first product readiness is **99%**. Architecture is **100%**. Production readiness is **40%**.

Version 3 answers: _can that professional operate TRP as production software that holds secrets and, when earned, real capital?_

Today they cannot:

- store exchange, bot, SMTP, webhook, or AI secrets in the product
- connect without `.env` and process restart
- send a real Telegram message
- place a live venue order
- see a unified connection or security health surface
- claim production restart-safety (US295 / ADL-008 still open)

Those gaps are Version 3. They are not Version 2.1 bug-fix scope.

---

## Lessons learned applied

From [Version 2 Final Certification — Lessons Learned](../version-2-final-certification.md):

| Lesson                                                | Version 3 application                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Architecture complete ≠ product complete              | Waves close on customer journeys, not ports.                                                       |
| Customer journeys beat backend availability           | Each wave has an operator-visible exit criterion.                                                  |
| Preserve the Authority Matrix                         | Connection Management and Security are facades/extensions, not new SoTs for money or lifecycle.    |
| Expose existing capabilities before inventing domains | Fill stubbed adapters, activate reserved channels, productize existing roles and kill-switch REST. |
| Finish the previous version first                     | Version 2 is certified. This package does not reopen PC-01…PC-20.                                  |

From Runtime Completion: the paper engine is **wiring of existing owners**, not a new trading domain. Live trading must follow the same rule — Canonical Order Path with a live adapter, not a second stack.

From Connection Management Audit: integrations are split across env, simulated connect, in-memory Telegram, and reserved catalogs. Version 3 unifies the **product**, not by merging those domains into one blob.

From Technical Debt: TD-045…TD-052 and TD-005/006/036 are absorbed into waves. They are not a hidden second backlog.

---

## Program shape

```text
Wave 1  Security Foundation          vault, auth, RBAC, OWASP, audit
Wave 2  Connection Management        wizard, test, health, no customer .env
Wave 3  Production Durability        stores, queues, US295, kill switch, monitoring
Wave 4  Exchange Connectivity        real BINANCE / BYBIT / OKX / Kraken I/O
Wave 5  Notification Platform        real Telegram + reserved channels
Wave 6  Live Trading                 ADR + canonical live path + financial audit
Wave 7  AI & Knowledge               customer keys, providers, durability, exporters
Wave 8  Portfolio, Risk, Analytics   productize existing engines; certified tactics
Wave 9  Workspace SaaS               teams, admin, billing, developer platform
Wave 10 Closeout                     compliance, E2E, performance, runbooks
```

**Live-capital gate (frozen in Master Plan):** Wave 6 starts only after Waves **1 + 2 + 3 + 4** exit **and** a live-capital ADR is approved. Wave 5 is not a live prerequisite. Waves 7–10 extend the platform; they do not redesign trading.

---

## Capability counts (planning baseline)

Canonical counts (Consistency Audit F1; do not use earlier 64/68 drafts):

| Band                           | In-scope count |
| ------------------------------ | -------------- |
| 100%                           | **7**          |
| 75%                            | **4**          |
| 50%                            | **16**         |
| 25%                            | **33**         |
| 0%                             | **22**         |
| **In-scope total**             | **82**         |
| Deferred / out                 | **4**          |
| Catalog including deferred/out | **86**         |
| Mean in-scope readiness        | **32%**        |

Exact rows: [`v3-readiness-dashboard.md`](./v3-readiness-dashboard.md). Certified V2 modules (Library, Certification, …) are reuse-unchanged in the Master Plan; they are not extra inventory rows.

Starting production readiness remains **40%** (Audit v2). Version 3 Complete requires the success criteria in [`v3-execution-roadmap.md`](./v3-execution-roadmap.md) Part 9.

---

## What implementation may do after approval

1. Treat the [Master Plan](./version-3-master-plan.md) as Product Owner authority and [`v3-execution-roadmap.md`](./v3-execution-roadmap.md) as the package list (V3-S01 … V3-X04).
2. Start **V3-S01 Authentication & Session**. Do not start Wave 4–6 first.
3. Reuse Identity, Workspace, Exchange Adapter, Notification Channels, AI Gateway, Canonical Order Path.
4. Write ADRs only for: **Credential Vault ownership** (if a new module is confirmed), **Live capital** (mandatory before Wave 6), and any later gap that Spec v2.0 cannot cover.
5. Do not open a Version 2 RC. Do not amend closed PC reports. Do not move tag `v2.0.0`.

## What implementation must not do

- Redesign Spec v2.0, Authority Matrix, or Alias Dictionary by stealth.
- Let Orchestrator create Sessions.
- Let AI pass the Gate or control capital.
- Use Telegram as a trading control plane.
- Store customer secrets in `.env` as the product path.
- Mark simulated exchange `CONNECTED` as a real customer connection.
- Ship live UI that cannot actually trade (Product UI Policy still applies).
- Invent a parallel Bot or order aggregate.

---

## Approval checklist (reviewers)

- [ ] Vision accepted (Research OS extended, not replaced)
- [ ] Security Platform accepted as mandatory Wave 1
- [ ] Connection Management accepted as unified product (Wave 2)
- [ ] Live trading accepted as Wave 6 **after** ADR, not as Wave 1
- [ ] Reuse table accepted (no unjustified redesign)
- [ ] Deferred items (ABAC engine, auto-rotation, marketplace, AI Scientist) accepted as out
- [ ] Success criteria accepted as Version 3 Complete definition
- [ ] First package after approval is V3-S01

---

## How to start (after approval only)

```text
1. Record approval on this summary (date + approver).
2. Open implementation on branch from certified main (v2.0.1).
3. Execute V3-S01 per Execution Roadmap Wave 1.
4. Close each package with tests, product UI honesty, and no Spec drift.
5. Do not skip to live adapters or live capital.
```

Until the Master Plan is accepted, **STOP**.

---

**End of Version 3 Planning Summary.**
