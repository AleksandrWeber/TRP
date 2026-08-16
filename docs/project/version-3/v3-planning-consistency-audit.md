# Version 3 Planning Consistency Audit

**Document:** Version 3 Planning Consistency Audit  
**Date:** 2026-08-16  
**Nature:** Final planning review. Not an RC. Not an ADR. Not implementation.  
**Scope:** All files under `docs/project/version-3/` as of this date, plus the planning canvas.  
**Verdict:** **Issues found, documented, and closed in the Master Plan.** Planning may freeze.

Canonical after this review: [`version-3-master-plan.md`](./version-3-master-plan.md).

---

## Verdict

The Version 3 planning package is **directionally consistent**: Research OS extended, Version 2 not redesigned, Security and Connection Management first, live trading gated, reuse preferred.

It was **not** numerically or procedurally consistent enough to freeze without this review.

| Check                            | Result                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------- |
| Duplicated capabilities          | **Closed** — aliases documented; one canonical ID each                            |
| Conflicting priorities           | **Pass** — no Critical vs Low fights on the same ID                               |
| Conflicting execution waves      | **Closed** — live-capital gate and split waves frozen                             |
| Circular dependencies            | **Pass**                                                                          |
| Missing prerequisite packages    | **Closed** — account recovery and business continuity named                       |
| Product area multiple owners     | **Closed** — owner table frozen in Master Plan                                    |
| Hidden Version 2 redesign        | **Pass**                                                                          |
| Unnecessary architecture changes | **Pass** — vault, live ADR, billing remain the only justified new/isolated pieces |
| Execution order justified        | **Pass** (after live-gate freeze)                                                 |
| Capability counts                | **Closed** — summary counts were wrong; dashboard recount is canonical            |

---

## Method

Read: README, Vision, Product Roadmap, Capability Inventory, Execution Roadmap, Security Vision, Connection Management Vision, Readiness Dashboard, Planning Summary.

Recounted every dashboard catalog row. Compared wave language, package graphs, and owner statements.

---

## Findings

### F1 — Capability counts do not match

| Source                      | Claim                                                                           |
| --------------------------- | ------------------------------------------------------------------------------- |
| Planning Summary            | 64 planned; 8 / 6 / 18 / 20 / 12 by band; 4 deferred                            |
| Readiness Dashboard summary | 68 rows; 8 / 6 / 18 / 22 / 16; 4 deferred; ~38% mean                            |
| Dashboard table (recount)   | **86** labeled rows if AI Scientist is included; parser saw **85** + 1 Out line |

**Canonical freeze (in-scope = not Deferred/Out):**

| Band                           | In-scope count                                                             |
| ------------------------------ | -------------------------------------------------------------------------- |
| 100%                           | **7**                                                                      |
| 75%                            | **4**                                                                      |
| 50%                            | **16**                                                                     |
| 25%                            | **33**                                                                     |
| 0%                             | **22**                                                                     |
| **In-scope total**             | **82**                                                                     |
| Deferred / out                 | **4** (SEC-04 ABAC, SE-03 auto-rotation, plugin marketplace, AI Scientist) |
| Catalog including deferred/out | **86**                                                                     |
| Mean in-scope readiness        | **32%**                                                                    |

The summary inflated 100%/75% by counting certified Version 2 modules (Library, Certification, …) that are **reuse, not inventory rows**. Those modules remain reuse-unchanged in the Master Plan reuse table. They are not double-counted as capabilities.

**Closure:** Master Plan and dashboard summary use the freeze above. Planning Summary must not be used as a count source.

---

### F2 — Live-capital prerequisite wording conflicts

Planning Summary said Waves **1–3** are mandatory before live capital **and** Wave 6 waits for Waves **1–4**. Execution Roadmap, Product Roadmap, and LT-01 already required Waves **1–4** plus ADR.

**Closure — frozen gate:**

Wave 6 may start only when **all** are true:

1. Wave 1 exit (security + vault)
2. Wave 2 exit (connection product, no customer `.env`)
3. Wave 3 exit (durability, kill switch, monitoring, recovery residual stance)
4. Wave 4 exit (real venue handshake / I/O adapters)
5. Approved **live-capital ADR**

Wave 5 (notifications) is **not** a live-trading prerequisite.  
Wave 7–10 are **not** live-trading prerequisites.

---

### F3 — Split-wave capabilities look like conflicts

These IDs list two waves. They are **phases of one capability**, not two backlogs:

| ID                            | Primary wave           | Remainder                                    |
| ----------------------------- | ---------------------- | -------------------------------------------- |
| SEC-08 OWASP                  | 1                      | Financial replay: Wave 6 (V3-L05)            |
| SEC-11 / WS-03 isolation      | 1                      | Team tenancy: Wave 9                         |
| CM-03 Connection testing      | 2                      | Real venue round-trip: Wave 4                |
| CM-17 OpenRouter keys         | 2                      | Extra providers: Wave 7                      |
| IN-03 / IN-04 scheduler/queue | 3 as needed for health | Default durable queue: Wave 10 if still open |

**Closure:** Primary wave owns the customer promise named in that wave. Remainder is listed on the same ID. Do not create a second capability.

---

### F4 — Alias IDs (not extra work)

| Alias                                        | Canonical                                                          |
| -------------------------------------------- | ------------------------------------------------------------------ |
| AI-01, AI-02                                 | CM-17 + package V3-A01                                             |
| “Credential Vault” in Connection Vision      | SEC-06 / SEC-07 (Security owns; Connection consumes)               |
| Kill Switch as live-trading _and_ Wave 3 ops | **LT-03** implemented once as **V3-O04**; Live Trading consumes it |

**Closure:** One implementation each. Master Plan owner table is binding.

---

### F5 — “Connect Binance” Wave 2 vs Wave 4

Connection Vision / Execution Wave 2: collect keys, do **not** claim live I/O.  
Dashboard: CM-07 is Wave 4.  
A naive reading of “Wave 2 = user connects Binance” would pull venue I/O into Wave 2 and skip Wave 4.

**Closure — frozen customer meaning:**

| Wave | Observable Binance outcome                                                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------- |
| 2    | User saves Binance credentials in the product (vault). No `.env`. UI does **not** say live-trading Connected.              |
| 4    | User connects, tests, and disconnects Binance against the real venue. Status may be Connected. Orders still paper-default. |
| 6    | User may place a live order only after ADR + Gate + human start.                                                           |

---

### F6 — Business Continuity / Disaster Recovery were implied, not named

Wave 3 covers restart, US295, kill switch, monitoring. It did not state customer outcomes for exchange / AI / notification / database / queue / network unavailability.

**Closure:** Named as product area **Business Continuity** in the Master Plan. Owned by Infrastructure / operations (Wave 3). No new trading domain. No new RC.

---

### F7 — Account recovery not on V3-S01 package line

Security Vision requires documented account recovery. Execution package V3-S01 listed only SEC-01 and SEC-05.

**Closure:** V3-S01 customer outcomes include register, secure login, session manage, and account recovery. Package still Identity/Auth extension — not a new domain.

---

### F8 — Product metrics and customer wave acceptance were missing

Execution exit criteria are technical. The package had no Product Owner metrics (time-to-connect, zero credential exposure, availability targets).

**Closure:** Master Plan Parts “Product Acceptance Criteria” and “Product Metrics” are now the frozen customer lens. Execution Roadmap remains the package list.

---

### F9 — Competing entry documents

README, Planning Summary, and Execution Roadmap each read as “start here.”

**Closure:** [`version-3-master-plan.md`](./version-3-master-plan.md) is the **only** canonical Product Owner document. Other files are annexes.

---

### F10 — Billing “optional” vs Version 3 Complete

Vision: billing only if SaaS subgroup approved.  
Roadmap: Waves 9–10 are in Version 3 Complete unless a later planning revision descopes them.

**Closure:** Wave 9 Billing is **in Version 3 Complete**. It is **not** required to start Waves 1–6. Descope only by an approved planning revision of the Master Plan.

---

### F11 — No circular package graph

```text
S01–S06 (Wave 1)
  → C01–C04 (Wave 2)  needs vault
  → O01–O05 (Wave 3)  needs audit/incident
  → E01–E05 (Wave 4)  needs wizard + vault
  → N01–N04 (Wave 5)  needs connections + durable queue
  → L01–L05 (Wave 6)  needs Waves 1–4 + ADR
  → A01–A04 (Wave 7)  needs Wave 2 OpenRouter collect
  → P01–P04 (Wave 8)  needs V2 engines (already certified)
  → W01–W04 (Wave 9)  needs Waves 1–2 isolation
  → X01–X04 (Wave 10) needs declared Complete scope
```

No cycles. Missing prerequisite that blocked a later wave: **none** after F6/F7.

---

### F12 — Hidden Version 2 redesign

Searched for: new order path, Orchestrator creating Sessions, AI Gate authority, Telegram control plane, parallel Bot aggregate, Authority Matrix rewrite.

**None proposed.** Justified new/isolated pieces remain: Credential Vault, live-capital ADR (already required by Paper Freeze), Billing (isolated).

---

### F13 — Unnecessary architecture

ABAC engine, plugin marketplace, AI Scientist, SHIELD-as-product, HFT, auto strategy rotation remain **out**. That is correct.

---

## Execution order — justification (frozen)

| Order             | Why this wave is next                                                                   |
| ----------------- | --------------------------------------------------------------------------------------- |
| 1 Security        | Cannot hold customer secrets or live keys without vault, RBAC, audit                    |
| 2 Connections     | Cannot remove `.env` without vault; unblocks all providers                              |
| 3 Durability / BC | Cannot claim production or restart-safety before stores, queue, kill switch, visibility |
| 4 Exchange I/O    | Real Connected status needs adapters; still not live orders                             |
| 5 Notifications   | Real delivery on existing catalog; not on the money path                                |
| 6 Live            | Money last; ADR; canonical path only                                                    |
| 7–8 Platform      | AI/knowledge/portfolio/risk after the production spine exists                           |
| 9 SaaS            | Teams/billing after isolation works                                                     |
| 10 Closeout       | Compliance, E2E, performance, runbooks                                                  |

Starting live adapters or live UI first would repeat the Version 2 lesson: architecture or chrome without a safe customer product.

---

## Residual after freeze

None that block planning freeze. Open **implementation** items (US295 outcome, stretch IDE shell, optional vector search) are named in the Master Plan, not hidden.

---

**STOP.** This audit does not implement. It authorizes planning freeze only after the Master Plan is accepted.
