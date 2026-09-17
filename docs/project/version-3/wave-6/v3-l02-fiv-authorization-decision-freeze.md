# V3-L02 FIV-D01…D08 Decision Support & Authorization Freeze

**Document:** FIV concrete authorization decision support + freeze template  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02  
**Nature:** Governance decision support only. **Not** FIV execution. **Not** C7 change. **Not** credential provisioning. **Not** capital authorization. **Not** L02 closure.

> This document resolves the missing FIV-D01…D08 authorization parameters required before V3-L02 FIV execution **by presenting options and a freeze section for PO/Governance**.  
> This document does **not** execute FIV.

```text
Current status: FIV NOT READY
Reason: FIV-D01…D08 are not concretely authorized.
Next required action: PO/Governance must explicitly freeze FIV-D01…D08.
```

---

## 1. Purpose

Identify exact missing FIV decisions; present repository-supported options and consequences; separate facts / existing decisions / prerequisites / unresolved PO choices; provide a controlled **Authorization Freeze** section for explicit PO recording.

```text
Slice Approval ≠ concrete FIV-D01…D08 freeze
FIV Authorization framework ≠ concrete FIV-D01…D08 freeze
ADR-020 ≠ automatic FIV parameter selection
```

> No default venue, environment, credential class, C7 authorization, capital scope, operation set, or abort override may be inferred from repository defaults.

---

## 2. Current Governance State

Do not alter:

```text
V3-L02 implementation       COMPLETE
Slice Approval              GRANTED
FIV framework authorization GRANTED
FIV concrete authorization  NOT YET FROZEN
FIV execution               NOT PERFORMED
C7                          DENY-ALL
allowRealVenueIo            false
Real capital                NOT AUTHORIZED
```

| Item | Value |
| ---- | ----- |
| Prior FIV execution report | [`v3-l02-fiv-execution-report.md`](./v3-l02-fiv-execution-report.md) — **FIV NOT READY** |
| Prior FIV report commit | `9a38f2757c7e03c318c92cc1c1f8d915a482b7cf` |
| HEAD baseline (pre-this-commit) | `9a38f2757c7e03c318c92cc1c1f8d915a482b7cf` = `origin/main` |
| Protected leftovers | Present; untouched |

---

## 3. Documented Facts vs Decisions vs Unresolved

| Class | Content |
| ----- | ------- |
| **Documented facts** | Adapter/EG1/ENV1 hosts; C7 DENY-ALL; `allowRealVenueIo=false`; credentials absent; DNS CONDITION REMAINS; prior FIV stop at parameter lock |
| **Existing governance** | Venue scope BINANCE/BYBIT/OKX; financial lifecycle scope; HS/S04/KS/policy freezes; Arch/Sec PASS WITH CONDITIONS; Slice Approval; FIV package (modes A–D defined, unanswered) |
| **Prerequisites** | Explicit D01…D08 freeze; credentials if B/C/D; scoped C7 if venue I/O; pinned transport for B/C/D; capital act if capital |
| **Unresolved PO** | All FIV-D01…D08 concrete values |

---

## 4. FIV-D01 — Mode

Do **not** select.

| Mode | Verifies | Does not verify | Credentials | C7 | Capital | DNS/pinning | Security notes |
| ---- | -------- | --------------- | ----------- | --- | ------- | ----------- | -------------- |
| **A** Composition / non-venue | Gate chain composition without external venue I/O | Real EG1 connect, pin under load, venue honesty, capital | None for venue | May remain DENY-ALL if no live admission; if exercising admission path, still needs explicit FIV-D05 | None | Pin not exercised against venue | Lowest exposure; insufficient as sole proof of venue boundary |
| **B** Testnet / demo | ENV1/EG1/HS/S04 path against non-prod venue env | Production-live capital effects | `trading_testnet` or OKX `trading_demo` | Explicit scoped PASS required for irreversible I/O | Non-prod venue balances only as separately understood; ≠ real capital auth | **Required** — real pinned path | Cross-env misuse risk; OKX demo same-host + header discipline |
| **C** Controlled live venue | Live hosts under controlled ops | Unrestricted production launch | `trading` / `trading_live` | Explicit scoped PASS | Per FIV-D06 (default none) | **Required** | Highest venue/security exposure; Security/Arch review flags |
| **D** Controlled real-capital | Capital path under ADR-020 act | Blanket capital program | Live-class + capital act | Explicit scoped PASS | **Requires separate capital authorization** | **Required** | Material Security + capital governance; not inferable from Slice/FIV framework |

---

## 5. FIV-D02 — Venue

PO-approved candidates only: **BINANCE**, **BYBIT**, **OKX**. Do not add venues. Do not select.

| Venue | Adapter (ADP1) | EG1 hosts | ENV1 | DNS/pin path | Known limitations |
| ----- | -------------- | --------- | ---- | ------------ | ----------------- |
| **BINANCE** | LiveVenueExecutionAdapter venue branch | live: `api.binance.com`; testnet: `testnet.binance.vision` | live↔`trading`/`trading_live`; testnet↔`trading_testnet` | Same pinned HTTPS client when I/O enabled | FIV enablement gated; credentials absent; handshake ≠ authorization |
| **BYBIT** | Same adapter | live: `api.bybit.com`; testnet: `api-testnet.bybit.com` | same purpose model | Same | Same |
| **OKX** | Same adapter | live & testnet slot: `www.okx.com`; demo via purpose + `x-simulated-trading: 1` | live↔live purposes; demo↔`trading_demo` only | Same; demo≠live via ENV1 | Same-host live/demo — header/purpose mis-wiring risk; demo is OKX-only |

```text
Repository establishes adapter + allowlist support ≠ FIV-ready / authorized.
```

---

## 6. FIV-D03 — Environment

```text
PAPER ≠ MOCK ≠ TESTNET ≠ DEMO ≠ LIVE
```

Do not select.

| Environment | Endpoint class | Credential class | Capital implication | FIV evidence requirement |
| ----------- | -------------- | ---------------- | ------------------- | ------------------------ |
| **LIVE** | EG1 `live` hosts | `trading` / `trading_live` | May involve real capital if orders fill — **FIV-D06 required** | Pinned transport; live purpose binding; C7 PASS scoped |
| **TESTNET** | EG1 `testnet` hosts (Binance/Bybit distinct) | `trading_testnet` | Non-production venue; still financial-ish on venue side; ≠ ADR-020 real-capital auth | Pinned transport; no live-purpose reuse |
| **OKX DEMO** | `www.okx.com` + demo header | `trading_demo` | Simulated OKX trading; ≠ live | Purpose+header; deny live+demo-header |
| PAPER / MOCK | Not live FIV environments | Must not consume live trading secrets | None for live FIV | Not substitute for Modes B/C/D venue evidence |

---

## 7. FIV-D04 — Credential Class

Taxonomy from Vault `SecretPurpose` / ENV1. **No secrets.** Do not provision. Do not select.

| Class | Vault purpose | Environment | Venue binding | Workspace | Allowed use (when authorized) |
| ----- | ------------- | ----------- | ------------- | --------- | ----------------------------- |
| `trading_live` | `trading_live` | LIVE | vaultType ↔ BINANCE/BYBIT/OKX | workspace-scoped retrieve | Mode C/D live only if FIV-D04 selects it |
| `trading` (legacy LIVE) | `trading` | LIVE (ENV1 treats as live) | same | same | Ops must not store testnet keys under this purpose |
| `trading_testnet` | `trading_testnet` | TESTNET | same | same | Mode B testnet |
| `trading_demo` | `trading_demo` | OKX DEMO only | OKX only | same | Mode B OKX demo |

Cross-environment / cross-workspace / Paper-Mock consumption of trading secrets = **deny**. Client-claimed env cannot escalate TEST/DEMO → LIVE.

```text
Credentials currently: absent → Mode B/C/D execution NOT READY until provisioned under separate ops act after FIV-D04 freeze.
```

---

## 8. FIV-D05 — C7 Authorization

```text
C7 = DENY-ALL
```

Irreversible venue I/O **cannot** proceed while C7 remains DENY-ALL.

Required PO decision:

> What exact C7 authorization, if any, is granted for this specific FIV run?

Must be: scoped; temporary/controlled as applicable; bound to authorized FIV operation(s); fail-closed; **not** blanket live-trading authorization.

| Option shape (examples only — not selected) | Implication |
| ------------------------------------------- | ----------- |
| No C7 grant | Mode A composition-only may still be designable without venue I/O; Modes B/C/D blocked |
| Scoped temporary LiveCommand for named workspace/actor/session/action | Enables admission for that run only if implemented/ops applied under separate config act |
| Broad role grant | **Security review required** — material expansion |

**Do not modify C7 in this artifact. No C7 authorization is claimed.**

---

## 9. FIV-D06 — Capital Scope

```text
Slice Approval ≠ Capital Authorization
FIV Authorization framework ≠ Capital Authorization
Real capital = NOT AUTHORIZED
```

| Option | Meaning |
| ------ | ------- |
| **Option 0** | No real-capital movement |
| **Option 1+** | Separately defined explicit real-capital scope under ADR-020 / PO |

Do **not** invent amount, asset, account, order size, position size, or max exposure. Those remain blank until Option 1+ is authored by PO.

---

## 10. FIV-D07 — Authorized Operations

Supported by V3-L02 financial scope / implementation. Do **not** blanket-combine. Do not select.

| Operation | Venue I/O? | May create exposure? | May alter venue state? | Separate auth needed? |
| --------- | ---------- | -------------------- | ---------------------- | --------------------- |
| Order submission | Yes (B/C/D) | Yes (esp. LIVE) | Yes | Yes (FIV-D07 + often D06) |
| Cancellation | Yes | Indirect (closes risk) | Yes | Yes — separate from submit |
| Execution-result verification | Query I/O or post-submit | No new submit | Usually no | Yes if query to venue |
| Fill verification | Depends on path | No invent fills | No | Yes; venue-authoritative |
| Position verification | May query | No invent | No | Yes |
| Trading-ledger effect verification | Internal + venue evidence | No invent | No | Yes |
| Reconciliation | Query after UNKNOWN | No blind retry | No (read/establish) | Yes when ambiguity |

Excluded from L02 FIV ops: deposits, withdrawals, banking, treasury, transfers, EM cancel-all.

---

## 11. FIV-D08 — Abort Threshold

Carry forward hard-stop principles (package §20). PO may tighten; must not invent automatic recovery.

| Condition | Action |
| --------- | ------ |
| DNS/pinning failure | ABORT |
| Unapproved destination / SSRF failure | ABORT |
| Credential / environment / workspace / actor / session mismatch | ABORT |
| Invalid / replayed / expired Human-start | ABORT |
| S04 DENY / C7 DENY / policy DENY / KS active | ABORT |
| Unexpected adapter / LTE / EmergencyManager path | ABORT |
| Unexpected venue / operation / capital movement | ABORT |
| Undocumented venue behavior | ABORT |
| Ambiguous venue outcome | UNKNOWN → STOP blind retry → RECONCILE |
| Inability to establish authoritative outcome | STOP / UNKNOWN |

---

## 12. Decision Matrix

| Decision | Options | Current state | PO decision required? | Consequence if unset |
| -------- | ------- | ------------- | --------------------- | -------------------- |
| FIV-D01 Mode | A/B/C/D | unset | YES | FIV NOT READY |
| FIV-D02 Venue | Binance/Bybit/OKX (± multi) | unset | YES | FIV NOT READY |
| FIV-D03 Environment | Live/Testnet/OKX Demo | unset | YES | FIV NOT READY |
| FIV-D04 Credential | approved classes | unset | YES | FIV NOT READY |
| FIV-D05 C7 | scoped auth / none | unset | YES | Venue I/O blocked if DENY-ALL |
| FIV-D06 Capital | none / explicit scope | unset | YES | Default remains no real capital; Mode D blocked |
| FIV-D07 Operations | explicit list | unset | YES | FIV NOT READY |
| FIV-D08 Abort | hard-stop policy (± tighten) | unset | YES | FIV NOT READY |

PO decision column intentionally **blank**.

---

## 13. Dependency Matrix

```text
FIV-D01 (Mode)
  ├─ if A ──→ FIV-D07 (ops limited to non-venue) ──→ FIV-D08 ──→ readiness
  └─ if B/C/D
        ↓
     FIV-D02 (Venue)  ∥  FIV-D03 (Environment)   [parallel once Mode chosen]
        ↓                    ↓
        └──────── FIV-D04 (Credential class) ────┘
                        ↓
                   FIV-D05 (C7)     [required for irreversible I/O]
                        ↓
                   FIV-D06 (Capital) [Option 0 default unless Mode D / live exposure]
                        ↓
                   FIV-D07 (Operations)
                        ↓
                   FIV-D08 (Abort)
                        ↓
                   FIV Execution Readiness
                        + DNS pin demonstrable (B/C/D)
                        + credentials present if required
                        + allowRealVenueIo enablement under separate controlled act when authorized
```

Parallel: D02 and D03 after D01 for venue-contacting modes. D04 depends on both. D05/D06/D07/D08 depend on the chosen mode/ops.

---

## 14. Safety Invariants

```text
claim ≠ submitted
submitted ≠ accepted
accepted ≠ filled
UNKNOWN ≠ rejected
UNKNOWN ≠ cancelled
UNKNOWN ≠ filled
```

```text
no blind retry
no automatic cancel-all
no EmergencyManager recovery
no LTE execution
```

---

## 15. DNS Condition

> DNS/rebinding remains a condition for FIV.

FIV requires the actual pinned/validated production transport path. The injected `fetchFn` test seam is **not** sufficient evidence.

This condition is **not** resolved by this document.

---

## 16. NON-SoT Paths

```text
live-trading-engine = NON-SoT
EmergencyManager /v1/live = NON-SoT for L02
EmergencyManager cancel-all = excluded
```

Any FIV plan using these paths is **invalid**.

---

## 17. Security Implications (flag, do not approve)

| Choice | Security implication |
| ------ | -------------------- |
| Mode C/D or LIVE | Production credential exposure; capital risk; require Security attention |
| Broader multi-venue FIV | Expanded attack/ops surface |
| C7 grant beyond scoped temporary | Blanket live risk — **Security review required** |
| OKX demo vs live same host | Header/purpose discipline critical |
| Capital Option 1+ | Material Security + ADR-020 capital act |

Materially new requirements → flag for **Security review**; do not silently approve.

---

## 18. Architecture Implications (flag, do not modify)

| Choice | Architecture implication |
| ------ | ------------------------ |
| Venue outside BINANCE/BYBIT/OKX | **Out of scope** — needs new PO + Arch |
| Environment not in allowlist/ENV1 | **Not supported** |
| New ops beyond L02 financial scope | New Arch/PO |
| EM/LTE as recovery | Forbidden / NON-SoT |
| Mode A only | Does not close Arch DNS condition for venue path |

Do not modify architecture in this act.

---

## 19. Capital Safety

```text
Slice Approval ≠ Capital Authorization
FIV Authorization framework ≠ Capital Authorization
Real capital requires an explicit governance act (FIV-D06 Option 1+ under ADR-020).
```

---

## 20. What Happens After PO Decision

```text
PO decision freeze (this section filled)
        ↓
repository authorization artifact synchronized
        ↓
parameter lock (all D01…D08 set)
        ↓
preflight
        ↓
FIV execution (separate task)
```

If any D01…D08 remains unset:

```text
FIV = NOT READY
```

---

## PO/Governance Authorization Freeze

**Fill only by PO/Governance. Executor must not populate.**

```text
FIV-D01: UNSET — REQUIRES EXPLICIT PO/GOVERNANCE DECISION
FIV-D02: UNSET — REQUIRES EXPLICIT PO/GOVERNANCE DECISION
FIV-D03: UNSET — REQUIRES EXPLICIT PO/GOVERNANCE DECISION
FIV-D04: UNSET — REQUIRES EXPLICIT PO/GOVERNANCE DECISION
FIV-D05: UNSET — REQUIRES EXPLICIT PO/GOVERNANCE DECISION
FIV-D06: UNSET — REQUIRES EXPLICIT PO/GOVERNANCE DECISION
FIV-D07: UNSET — REQUIRES EXPLICIT PO/GOVERNANCE DECISION
FIV-D08: UNSET — REQUIRES EXPLICIT PO/GOVERNANCE DECISION
```

Optional PO metadata (also unset until decided):

```text
Decision authority:
Decision date:
Decision reference / ticket:
Expires / temporary C7 window (if any):
Security review required (Y/N):
Architecture review required (Y/N):
```

---

## 21. Required PO Decision — Status

```text
Current status:
FIV NOT READY

Reason:
FIV-D01…D08 are not concretely authorized.

Next required action:
PO/Governance must explicitly freeze FIV-D01…D08.
```

This is **not** an FIV failure. Prior execution correctly stopped at the parameter-lock gate.

---

## 22. Source-of-Truth Inspected

- `docs/adr/ADR-020-live-capital.md`
- `v3-l02-planning-proposal.md`
- `v3-l02-po-financial-scope-decision.md`
- `v3-l02-po-safety-authorization-decision-support.md`
- `v3-l02-po-block-b-decision-freeze.md`
- `v3-l02-human-start-decision-freeze.md`
- `v3-l02-slice-approval-readiness.md`
- `v3-l02-fiv-authorization-execution-package.md`
- `v3-l02-fiv-execution-report.md`
- Architecture review + final reverification
- Security review + conditions plan + final closeout
- EM1/HS1/UNK1/EG1/ENV1/ADP1/ISO1 evidence
- `live-venue-allowlist.ts`, `secret-purpose.ts` (taxonomy/hosts only)

---

## Explicit Non-Authorization

This artifact does **not**: execute FIV; grant C7; enable `allowRealVenueIo`; provision credentials; authorize capital; contact venues; close L02; start L03; choose D01…D08 values.

---

## STOP

Next: **PO Review and explicit FIV-D01…D08 Authorization Freeze.**  
Only after the freeze section is filled and synchronized may FIV execution be re-attempted.
