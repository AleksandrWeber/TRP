# Version 3 Execution Roadmap

**Document:** Version 3 Execution Roadmap  
**Date:** 2026-08-16  
**Status:** Annex — planning **FROZEN** in [`version-3-master-plan.md`](./version-3-master-plan.md)  
**First package after Master Plan acceptance:** **V3-S01 Authentication & Session**

**Live-capital gate:** Wave 6 starts only after Waves **1 + 2 + 3 + 4** exit **and** an approved live-capital ADR. Wave 5 is not a live prerequisite.

This is the package list. Customer outcomes and Product Owner authority live in the [Master Plan](./version-3-master-plan.md). After acceptance, implementation follows these waves and packages in order. Do not invent a parallel backlog.

---

## Execution rules

1. Finish a wave’s **exit criteria** before starting the next wave’s irreversible product promises (especially live UI).
2. Wave 6 (Live Trading) additionally requires an approved **live-capital ADR**.
3. Each package closes with tests, honest UI, and no Spec v2.0 / Authority Matrix / Alias Dictionary drift.
4. HTTP remains transport. UI remains not Source of Truth.
5. Do not open Version 2 RCs. Do not rewrite closed PC reports.

Package IDs are **V3-*** so they cannot be confused with PC-01…PC-20.

---

## Wave 1 — Security Foundation

**Goal:** The platform can authenticate, authorize, isolate workspaces, store secrets, and audit security events well enough to hold customer credentials.

**Business value:** Financial-asset protection becomes a product, not a leftover JWT. Unblocks Connection Management.

**Dependencies:** Version 2 Identity (PC-18), Workspace (PC-14), existing `Role` enum, `JwtAuthGuard`, `RolesGuard`, `CommandAuthorizationService`, `WorkspaceAccessService`, helmet, rate-limit, ValidationPipe.

**Order:** V3-S01 → S02 → S03 → S04 → S05 → S06

| ID         | Package                       | Capabilities                               | Complexity |
| ---------- | ----------------------------- | ------------------------------------------ | ---------- |
| **V3-S01** | Authentication & Session      | SEC-01, SEC-05 (includes account recovery) | M          |
| **V3-S02** | RBAC Product                  | SEC-02, SEC-03                             | M          |
| **V3-S03** | Secret Vault & Encryption     | SEC-06, SEC-07                             | L          |
| **V3-S04** | OWASP & API Hardening         | SEC-08                                     | L          |
| **V3-S05** | Audit Trail Foundation        | SEC-09, SEC-14                             | M          |
| **V3-S06** | Workspace Isolation Hardening | SEC-11                                     | M          |

**Exit criteria**

- [ ] Sessions can be revoked; production cookies/headers are secure-by-default.
- [ ] A customer can register, log in, recover an account, and manage sessions.
- [ ] Workspace Admin can assign Reader / Researcher / Trader / Admin without sharing passwords.
- [ ] A secret can be stored encrypted at rest and read only by the owning workspace’s authorized runtime.
- [ ] Global rate limit, CSP, helmet, validation, and injection posture are production-default on.
- [ ] Security-relevant authz failures and admin actions are in an append-only audit log.
- [ ] Cross-workspace credential or data reads fail closed in tests.
- [ ] No live trading UI enabled. No `.env` as the customer secret path for new secrets.

**Architecture:** Major extension of Identity/Auth. **New justified module:** Credential Vault (not a financial SoT). No new order path.

---

## Wave 2 — Connection Management

**Goal:** One operator product to connect, test, monitor, rotate, and disconnect external integrations without `.env`.

**Business value:** Paying customers can self-serve. Simulated “connected” stops being the product story.

**Dependencies:** Wave 1 vault; existing Exchange Adapter connection state; Telegram wizard UX; Notification catalog; AI Gateway `OpenRouterProvider`; Exchange Scope venue catalog.

**Order:** V3-C01 → C02 → C03 → C04

| ID         | Package                               | Capabilities                      |
| ---------- | ------------------------------------- | --------------------------------- |
| **V3-C01** | Connection Management Product         | CM-01, CM-21                      |
| **V3-C02** | Connection Wizard                     | CM-02, CM-17 (OpenRouter collect) |
| **V3-C03** | Connection Testing & Health           | CM-03, CM-04                      |
| **V3-C04** | Rotation, Disconnect, Workspace Scope | CM-05, CM-06, SEC-12              |

**Exit criteria**

- [ ] One Connections screen lists offered integrations with scope (platform vs workspace vs user) and status (offered / configured / connected / error / reserved).
- [ ] OpenRouter key can be saved to the vault from the UI and used without restart.
- [ ] Exchange credential _collection_ works (keys in vault). Real venue handshake may still be Wave 4; the wizard must not claim live I/O until Wave 4 exit.
- [ ] Test action exists per offered integration; failure shows vendor-visible errors.
- [ ] Rotate replaces the secret and invalidates the previous material.
- [ ] Customers do not need `.env` for OpenRouter or collected exchange secrets.
- [ ] Telegram remains the Version 2 in-memory path until Wave 5 (honest labels).

**Architecture:** New **product facade** over existing owners (Command Center pattern). Vault is the secret store. Adapters remain owners of protocol I/O.

---

## Wave 3 — Production Durability & Operations

**Goal:** Restart does not silently destroy product artifacts; kill switch and monitoring exist; recovery residual is closed enough for later live claims.

**Business value:** Production readiness moves off 40% for operational reasons, before live money.

**Dependencies:** Wave 1 audit/incident; TD-045, TD-047, TD-048, TD-036; existing Outbox/Inbox; existing live-only Kill Switch REST.

**Order:** V3-O01 → O02 → O03 → O04 → O05

| ID         | Package                           | Capabilities                 | Debt   |
| ---------- | --------------------------------- | ---------------------------- | ------ |
| **V3-O01** | Durable analytical stores         | IN-01                        | TD-048 |
| **V3-O02** | Notification durable queue        | NT-02                        | TD-045 |
| **V3-O03** | Recovery residual US295 / ADL-008 | IN-02                        | TD-036 |
| **V3-O04** | Durable Kill Switch product       | LT-03                        | TD-047 |
| **V3-O05** | Monitoring & security health      | MN-02, MN-03, SEC-13, SEC-15 | —      |

**Exit criteria**

- [ ] Certified V2 analytical artifacts that operators rely on survive API restart (or are honestly labeled ephemeral — default is survive).
- [ ] In-flight notification delivery is not lost on process restart.
- [ ] US295 / ADL-008 is accepted or explicitly deferred with a written live-claim limitation (no silent “production restart-safe”).
- [ ] Kill Switch is visible, durable, and blocks evaluation/admission on paper; live uses the same control in Wave 6.
- [ ] Operators can see connection/security health and recent incidents without SSH.
- [ ] When an exchange, AI provider, notification channel, database, or queue is unavailable, the product shows degraded or unavailable — it does not fake success.
- [ ] After runtime restart, Kill Switch and vaulted secrets still hold; sessions recover or stay safely stopped.

**Architecture:** Persistence and operations on **existing** aggregates. Do not create a second Lake or second Outbox.

---

## Wave 4 — Exchange Connectivity

**Goal:** Real venue I/O for catalogued crypto venues through the existing adapter factory. Paper execution remains default.

**Business value:** Cluster stops being “isolation labels plus simulated CONNECTED.”

**Dependencies:** Wave 2 vault + wizard; Wave 3 kill switch recommended; RC-27 Exchange Scope; stub `VenueExchangeAdapter` for BINANCE / BYBIT / OKX; Kraken catalog label.

**Order:** V3-E01 → E02 → E03 → E04 → E05

| ID         | Package                       | Capabilities        |
| ---------- | ----------------------------- | ------------------- |
| **V3-E01** | Binance real I/O              | CM-07               |
| **V3-E02** | Bybit real I/O                | CM-08               |
| **V3-E03** | OKX real I/O                  | CM-09               |
| **V3-E04** | Kraken adapter (factory)      | CM-10               |
| **V3-E05** | Venue permission verification | (feeds LT-02 later) |

**Exit criteria**

- [ ] Connect with vault credentials performs a real vendor round-trip (account/permission or equivalent).
- [ ] Status includes expired credentials and permission problems when the vendor reports them.
- [ ] Simulated CONNECTED without keys is not shown as Connected in the product.
- [ ] Public Binance market data / WS can be enabled per workspace policy without a trading key.
- [ ] Order **submission** to live capital remains blocked until Wave 6 ADR (adapters may support a dry-run/test-order if the venue allows; UI must not say “live trading”).
- [ ] No engine clone per venue. Exchange Scope remains the isolation boundary.

**Architecture:** Major extension of Exchange Adapter. **Replace nothing** in Risk, Orders, or Ledger.

---

## Wave 5 — Notification Platform

**Goal:** Delivery channels become real transports on the existing catalog and routing product.

**Business value:** Operators receive evidence outside the process. Completes PC-07’s reserved catalog.

**Dependencies:** Wave 2 connections; Wave 3 durable queue; PC-06 routing; PC-07 catalog; TD-049, TD-050.

**Order:** V3-N01 → N02 → N03 → N04

| ID         | Package                     | Capabilities        |
| ---------- | --------------------------- | ------------------- |
| **V3-N01** | Production Telegram Bot API | CM-11               |
| **V3-N02** | Email (SMTP)                | CM-12               |
| **V3-N03** | Slack / Discord / Teams     | CM-13, CM-14, CM-15 |
| **V3-N04** | Push                        | CM-16               |

**Exit criteria**

- [ ] Telegram connect binds a real chat; test sends a real message; Bot API is used; control plane remains forbidden.
- [ ] Email/Slack/Discord/Teams/Push have connect / test / status / disconnect like Telegram.
- [ ] Reserved-inactive is gone for shipped channels; unshipped ones stay reserved with honest UI.
- [ ] Routing from PC-06 delivers to the active transport.

**Architecture:** Major extension of Notification Delivery adapters. Do not make Telegram a command bus.

---

## Wave 6 — Live Trading

**Goal:** An authorized workspace can run a live Trading Session on the Canonical Order Path.

**Business value:** Certified knowledge can be applied to real capital under human authority.

**Dependencies:** Waves 1–4 exit; Wave 3 kill switch; **approved live-capital ADR** superseding Paper Freeze for opted-in workspaces; Runtime Enforcement Gate; existing live-trading-engine remnants only as reuse, not a parallel product.

**Order:** V3-L01 → L02 → L03 → L04 → L05

| ID         | Package                             | Capabilities       |
| ---------- | ----------------------------------- | ------------------ |
| **V3-L01** | Live capital ADR + workspace policy | LT-01              |
| **V3-L02** | Live order I/O on canonical path    | LT-02, RK-03       |
| **V3-L03** | Tamper-evident financial action log | SEC-10, SEC-16     |
| **V3-L04** | Live operator UI (honest)           | LT-04              |
| **V3-L05** | Replay protection on financial APIs | (SEC-08 remainder) |

**Exit criteria**

- [ ] Paper Freeze remains default. Live is per-workspace opt-in.
- [ ] Live session still requires certified library member + Gate PASS + human start.
- [ ] Orders go Risk → Orders → Execution → **live adapter** → Fill → Position → Ledger. No bypass.
- [ ] Every live place/cancel/kill is append-only audited and attributable.
- [ ] Kill Switch stops live evaluation and rejects new live orders.
- [ ] AI cannot start, approve, or size live orders.
- [ ] UI that says Live can actually reach the venue; otherwise it stays hidden.

**Architecture:** Justified ADR. **Minor/major extension** of Session, Execution Adapter, Gate. **Forbidden:** new Bot aggregate, Orchestrator creating sessions, Signal Engine merge into Runtime.

---

## Wave 7 — AI Platform & Knowledge Platform

**Goal:** Customers own AI credentials; optional direct providers; knowledge stores durable; reports exportable. AI still explains, never decides capital.

**Dependencies:** Wave 2 OpenRouter collect; existing AI Gateway; Knowledge Lake; TD-001, TD-007, TD-031.

**Order:** V3-A01 → A02 → A03 → A04

| ID         | Package                               | Capabilities        |
| ---------- | ------------------------------------- | ------------------- |
| **V3-A01** | Customer AI keys in gateway           | AI-01, AI-02, CM-17 |
| **V3-A02** | OpenAI / Gemini / Anthropic providers | CM-18, CM-19, CM-20 |
| **V3-A03** | Research/knowledge durability         | KN-02               |
| **V3-A04** | Report exporters                      | AN-03               |

**Optional inside A03:** KN-03 Vector Search — only if deterministic search is proven insufficient (Vision / future README rule).

**Exit criteria**

- [ ] Workspace can use its own OpenRouter key; platform `.env` key is not the customer path.
- [ ] Optional providers are gateway plugins, not a second AI Analytics stack.
- [ ] AI Analytics may call the gateway for narration; it still does not control the Gate.
- [ ] Offline fallback remains if no key is configured (honest).
- [ ] Campaign/knowledge artifacts that V2 left in-memory have a durability plan executed or explicitly accepted.

---

## Wave 8 — Portfolio, Risk, Analytics, Strategy Evolution

**Goal:** Productize existing financial projections and certified tactic selection. Do not invent a Strategy Selector that writes new logic.

**Dependencies:** V2 Risk Engine, Portfolio projection, Reporting, Orchestrator, Tactics Contract Option B; TD-029, TD-030.

**Order:** V3-P01 → P02 → P03 → P04

| ID         | Package                       | Capabilities |
| ---------- | ----------------------------- | ------------ |
| **V3-P01** | Portfolio product             | PF-01, PF-02 |
| **V3-P02** | Risk product                  | RK-01, RK-02 |
| **V3-P03** | Advanced analytics            | AN-02, AN-04 |
| **V3-P04** | Certified tactic selection UX | SE-01, SE-02 |

**Exit criteria**

- [ ] Operator can inspect portfolio from Ledger/Position projections (no recalculated ledger in UI).
- [ ] Risk limits and denials are visible as the Risk Engine’s decisions.
- [ ] Sharpe / Sortino / Calmar available on research/reporting artifacts where defined.
- [ ] Tactic changes are selection among **pre-validated** envelope values only.
- [ ] Auto-rotation of uncertified logic is not shipped.

---

## Wave 9 — Workspace SaaS, Administration, Billing, Developer Platform

**Goal:** Small teams can operate TRP as a hosted product with admin, billing, and programmatic access.

**Business value:** Moves from solo researcher to professional team without becoming consumer social trading.

**Dependencies:** Waves 1–2 isolation and vault; PC-14 workspace.

**Order:** V3-W01 → W02 → W03 → W04 → W05 (W05 stretch)

| ID         | Package                   | Capabilities           |
| ---------- | ------------------------- | ---------------------- |
| **V3-W01** | Team membership & invites | WS-02, WS-03 remainder |
| **V3-W02** | Administration console    | AD-01, AD-02           |
| **V3-W03** | Billing                   | BL-01, BL-02           |
| **V3-W04** | Developer platform        | DV-01, DV-02, DV-03    |
| **V3-W05** | IDE shell (stretch)       | OT-01                  |

**Exit criteria**

- [ ] Invite flow; members cannot read another workspace’s vault.
- [ ] Admin can disable a user and revoke sessions.
- [ ] Billing does not sit on the Canonical Order Path and cannot bypass Gate.
- [ ] Customer API keys are vaulted, scoped, rotatable.
- [ ] IDE shell, if skipped, is recorded as stretch remaining — not silently claimed complete.

---

## Wave 10 — Closeout

**Goal:** Version 3 can be called complete: compliance, E2E, performance, operational docs.

**Order:** V3-X01 → X02 → X03 → X04

| ID         | Package                               | Capabilities                            |
| ---------- | ------------------------------------- | --------------------------------------- |
| **V3-X01** | Compliance reporting & retention      | CP-01, CP-02                            |
| **V3-X02** | Playwright customer E2E               | PE-04                                   |
| **V3-X03** | Performance & scale                   | PE-02, PE-03, IN-03/IN-04 if still open |
| **V3-X04** | Operational runbooks & Version 3 docs | (success criteria: Documentation)       |

**Exit criteria:** all Part 9 checks below are true.

---

## Implementation order (global)

```text
V3-S01 … S06
  → C01 … C04
  → O01 … O05
  → E01 … E05
  → N01 … N04
  → [live-capital ADR]
  → L01 … L05
  → A01 … A04
  → P01 … P04
  → W01 … W04 (W05 optional)
  → X01 … X04
```

Parallelism allowed **inside** a wave only when dependencies in that wave’s table permit (e.g. E02/E03 after E01 pattern is proven). Never parallelize Wave 6 ahead of Waves 1–4.

---

## Part 9 — Success criteria (Version 3 COMPLETE)

Version 3 may be declared complete only when **all** of the following are true.

### Architecture

- Spec v2.0, Authority Matrix, and Alias Dictionary are unmodified **or** amended only by approved ADRs listed in this program (Vault ownership, Live capital, and any documented gap).
- Canonical Order Path is the only live/paper execution path.
- Orchestrator still does not create Sessions.
- No parallel Bot aggregate. No AI capital authority. No Telegram control plane.
- RC-19…RC-28 remain closed history. Tag `v2.0.0` is not moved.

### Product

- J-01…J-14 still work (paper default).
- J3-01…J3-11 work (J3-12 if Wave 9 in scope — this plan includes it).
- Connection Management is the only customer path for vendor secrets.
- Live is opt-in, honest, and fail-closed.
- Reserved channels that this plan ships are active or still explicitly reserved.

### Security

- Vault encrypts customer secrets at rest.
- RBAC + workspace isolation fail closed.
- OWASP baseline (Security Vision) is on by default in production.
- Financial live actions are tamper-evident and attributable.
- Security health and incident views exist.

### Testing

- Package tests for each V3-* close.
- Conformance: live/paper still cannot bypass Risk.
- Playwright covers login, connections, paper session, and (if live enabled in a test venue) live fail-closed paths.
- No “connected” assertion without a real vendor round-trip for Wave 4+ integrations.

### Performance

- Ledger history paginated.
- Documented stance on large-dataset memory (TD-033 addressed or accepted with limits).
- Rate limits do not break the certified paper loop under expected operator load.

### Documentation

- This Master Plan remains the intent record.
- Runbooks: vault rotation, kill switch, live incident, connection outage.
- Customer-facing connection and security docs exist.
- Version 2 docs are not rewritten; Version 3 docs are additive.

### Operational readiness

- Production readiness is measured again and **no longer blocked** by: missing vault, `.env` customer keys, in-memory-only Telegram as the only path, stub-only venue I/O, hidden-but-advertised live, or open US295 without an explicit live-claim limitation.
- Monitoring and kill switch are operable by an operator without SSH.
- Default deploy is secure-by-default (CSP, cookies, no dev JWT secret, no prefill).

When these are true: **VERSION 3 COMPLETE.**

Until the [Master Plan](./version-3-master-plan.md) is accepted: **NO IMPLEMENTATION.**

---

**STOP.** Wait for review before any Version 3 implementation begins.
