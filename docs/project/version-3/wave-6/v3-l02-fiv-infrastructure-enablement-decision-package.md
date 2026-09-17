# V3-L02 FIV Infrastructure Enablement Decision Package

**Document:** Decision support / remediation analysis for FIV preflight blockers
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02
**Nature:** PLANNING / DECISION SUPPORT ONLY. **Not** implementation authorization. **Not** FIV execution authorization. **Not** credential provisioning. **Not** C7 runtime change. **Not** I/O enablement. **Not** L02 closure.

```text
Labels used below: FACT | GAP | OPTION | PROPOSED | DECISION REQUIRED | PROHIBITED
```

---

## Purpose

Analyze the three blockers that stopped the authorized Binance Testnet FIV and provide a precise Architecture / Security / PO decision package.

Blockers addressed:

1. **FIV-PRE-01** — `trading_testnet` credential provisioning
2. **FIV-PRE-02** — safe scoped C7 authorization
3. **FIV-PRE-03** — controlled Binance Testnet I/O enablement

This artifact does **not** authorize implementation or FIV execution.

---

## Current Verified State

### Repository baseline (FACT)

| Item | Value |
| ---- | ----- |
| HEAD at package creation | `b28fa3e5ed7a7d6b0d4051a07407d8e61f1d2b93` = `origin/main` |
| FIV freeze artifact | [`v3-l02-fiv-authorization-decision-freeze.md`](./v3-l02-fiv-authorization-decision-freeze.md) |
| FIV execution report | [`v3-l02-fiv-execution-report.md`](./v3-l02-fiv-execution-report.md) — commit `75b97be…` |
| Protected leftovers | Present; untouched by this task |

### FIV authorization (FACT)

Frozen parameters (PO-accepted freeze):

| ID | Value |
| -- | ----- |
| FIV-D01 | B — Testnet / Demo |
| FIV-D02 | BINANCE |
| FIV-D03 | BINANCE TESTNET |
| FIV-D04 | `trading_testnet` |
| FIV-D05 | Scoped temporary C7 authorization for this exact FIV only |
| FIV-D06 | ZERO REAL CAPITAL |
| FIV-D07 | Controlled submit → outcome verification → reconciliation if required → authorized cancellation where applicable |
| FIV-D08 | Hard-stop on mandatory gate violation; UNKNOWN → STOP + RECONCILE; no blind retry |

### Actual FIV result (FACT)

Latest controlled FIV attempt result: **`FIV NOT READY`**.

Preflight stopped because:

| Blocker | Repository finding |
| ------- | ------------------ |
| FIV-PRE-01 | `trading_testnet` credential **absent** (Vault purpose enum exists; no provisioned Binance workspace secret) |
| FIV-PRE-02 | No safe supported **scoped temporary** C7 application mechanism (matrix DENY-ALL; `authorizationOverride` harness-only) |
| FIV-PRE-03 | Nest binds `allowRealVenueIo: false`; enabling would be a global I/O flag / composition change |

Also (FACT):

- S04 / Human-start / policy / session / KS **did not proceed** (stopped earlier).
- **No** venue I/O (no Binance Testnet or production HTTP).
- **No** order submitted.
- **No** capital moved (`REAL CAPITAL MOVED = ZERO`).
- **No** credentials retrieved/exposed.
- **No** FIV PASS claimed.
- Runtime remained: `C7 = DENY-ALL`, `allowRealVenueIo = false`.

---

## Architecture Question — Physically Enforceable Testnet-Only Path

> Does the current repository contain a physically enforceable path that permits exactly Binance Testnet I/O for this FIV while keeping production and all other live venues inaccessible?

### Conclusion: **PARTIAL**

| Layer | FACT | Implication |
| ----- | ---- | ----------- |
| EG1 allowlist | Distinct hosts: Binance live `api.binance.com` vs testnet `testnet.binance.vision`; Bybit/OKX separate | A request classified as BINANCE+`testnet` cannot use production host |
| ENV1 | Purpose `trading_testnet` ↔ testnet; live purposes ≠ testnet endpoint; fail-closed on mismatch | Wrong purpose/env denied before sign/HTTP |
| Order intent | Live venue/env bound server-side (`BINANCE`/`BYBIT`/`OKX` × `live`/`testnet`/`demo`) | Per-order environment selection exists |
| `allowRealVenueIo` | **Global boolean** on `LiveVenueEgressHttpClient` / Nest `LiveVenueExecutionAdapter` factory | Enabling opens the **real HTTPS + DNS-pin path** for any live adapter call that later passes ENV1/EG1 — **not** testnet-scoped |
| C7 | DENY-ALL for all roles; no scoped grant | Even with I/O flag on, admission denies without unsafe override |
| Credentials | No provisioned `trading_testnet` | Cannot authenticate Testnet FIV |

**GAP:** Destination isolation for a correctly classified request is strong (ENV1+EG1). **Physical** enablement of outbound I/O is **not** limited to Testnet — it is a single global gate. Production remains policy-gated (credentials + purpose + allowlist), not “physically inaccessible” once `allowRealVenueIo=true`.

**Missing control (GAP):** Testnet-only (or FIV-scoped) I/O enablement that cannot open production/other-venue real I/O without separate controls.

---

## FIV-PRE-01 — `trading_testnet` Credential Provisioning

### Current state (FACT)

| Topic | Evidence |
| ----- | -------- |
| Credential home | Secret Vault (`SecretVaultService`); workspace-scoped records; `(type, purpose)` uniqueness |
| Purpose taxonomy | `SecretPurpose.TradingTestnet = 'trading_testnet'` (also `trading`, `trading_live`, `trading_demo`) |
| Venue type | Holdable type `binance` (with `bybit`, `okx`) |
| Environment binding | ENV1 maps purpose → `TradingCredentialEnvironment`; EG1 host class; fail-closed on mismatch |
| Schema support | Purpose enum + Vault store/retrieve already support `trading_testnet` |
| Provisioned FIV secret | **ABSENT** (FIV report) |
| Plaintext in Git/env for exchange keys | Not found in FIV redacted scan; wrapping key is host-level, not customer trading secret |
| Logging | ENV1/ADP1 use redaction patterns; purposes/types in events — raw material must not be logged |
| Separation | Logical via purpose + host allowlist; not “separate HSMs per env” in-repo |

### Required future behavior (PROPOSED constraints — not authorized)

- No secrets in Git, source, logs, or governance docs.
- No production credentials / production endpoint for this FIV.
- Explicit bind: **BINANCE + `trading_testnet`** (+ workspace).
- Environment / purpose / venue mismatch → fail-closed.
- Missing credential → fail-closed.
- Wrong-purpose → fail-closed.

### DECISION REQUIRED

> May the project provision a dedicated Binance Testnet credential into Vault as `binance` + `trading_testnet` for a named FIV workspace, under ZERO REAL CAPITAL, without using production keys?

**PROHIBITED now:** provisioning, inventing keys, assuming Binance account existence, documenting secrets.

---

## FIV-PRE-02 — Scoped C7 Authorization

### Current enforcement (FACT)

| Topic | Evidence |
| ----- | -------- |
| Permission | `PermissionClass.LiveCommand` (`C7`) |
| Matrix | `LiveCommand` **not** granted to any role (`permission-matrix.ts` / tests) |
| Evaluation | `LiveAdmissionService.evaluateLiveCommandAuthorization` → DENY for all roles |
| Override seam | `authorizationOverride` on admission command — **harness/test-only** (ISO1/ADP1); production path omits it → DENY-ALL |
| Scoped durable grant (workspace/actor/session/action/venue/env/FIV/expiry/single-use) | **Not present** |

### Explicitly unsafe (PROHIBITED)

| Pattern | Why rejected |
| ------- | ------------ |
| Permanent matrix grant of LiveCommand | Blanket live-trading authorization |
| Harness `authorizationOverride` as production FIV auth | Test seam ≠ scoped temporary production authorization |
| Global C7 bypass / disable C7 | Removes safety gate |
| Environment-wide permanent enablement | Unscoped |

### Remediation OPTIONS (analysis only — none selected)

#### Option B1 — Durable scoped temporary LiveCommand grant record

| Property | Analysis |
| -------- | -------- |
| Mechanism | New durable grant store (workspace + actor + session + action/command + venue + environment + FIV-run id + expiry + single-use/CAS) consulted by admission instead of/in addition to role matrix |
| Security | Temporary, fail-closed, auditable if events emitted |
| Scope | Exact FIV bindings |
| Expiry / replay | Required; claim-like single-use preferred |
| Persistence | Shared durable (multi-instance) |
| Concurrency | CAS / unique constraints |
| Audit | Security/audit events on issue/claim/deny |
| Failure | Missing/expired/mismatch → DENY |
| Risks | New authz surface; must not become permanent matrix |
| Work | Schema + service + admission wiring + tests — **new implementation** |

#### Option B2 — Reuse Human-start-like capability token for LiveCommand

| Property | Analysis |
| -------- | -------- |
| Mechanism | Parallel to HS proof but for C7 capability |
| Security | Aligns with durable/single-use patterns already frozen for HS |
| Risks | Confusion with HS; double-token ops complexity |
| Work | Substantial; new artifact |

#### Option B3 — Time-boxed role matrix change

| Property | Analysis |
| -------- | -------- |
| Mechanism | Temporarily add LiveCommand to a role |
| Security | **Weak** — not bound to FIV/workspace/session/action |
| Risks | Permanent if not reverted; multi-tenant blast radius |
| Verdict | **Reject** as primary FIV mechanism |

#### Option B4 — Use `authorizationOverride` in a production runner

| Property | Analysis |
| -------- | -------- |
| Verdict | **Reject** — harness seam; FIV report already classified as bypass |

### FACT

No safe existing production mechanism satisfies: **temporary + durable/shared + narrowly scoped + auditable + fail-closed + bound to the exact authorized FIV**.

### DECISION REQUIRED

> Should Architecture/Security design and (after separate implementation authorization) implement a temporary scoped C7 authorization mechanism (e.g. Option B1), given none exists today?

---

## FIV-PRE-03 — Controlled Testnet I/O Enablement

### Current state (FACT)

| Component | Behavior |
| --------- | -------- |
| Nest `ExecutionAdapterModule` | `new LiveVenueExecutionAdapter({ allowRealVenueIo: false })` |
| `LiveVenueEgressHttpClient` | `allowRealVenueIo !== true` → refuse (`missing_configuration`); no connect |
| Real path when true | DNS resolve → public-IP filter → `createWebPushPinnedHttpsAgent` → HTTPS:443 |
| `fetchFn` | Test inject; **not** FIV evidence |
| ENV1 / EG1 | Bind purpose/env/venue/host; no user URL |
| Routing | Paper vs LiveVenue via `RoutingExecutionAdapter` |
| LTE / EmergencyManager | NON-SoT; not L02 SoT path |

### What global `allowRealVenueIo=true` would open (FACT)

- Real outbound HTTPS for **any** live adapter request that passes ENV1+EG1+admission.
- Includes production host **if** a live-purpose credential + live environment order were admitted.
- Does **not** by itself bypass C7/S04/HS/ENV1/EG1.
- Does **not** enable LTE/EM as SoT.

### GAP

No repository switch that means: “enable DNS-pinned I/O **only** for BINANCE testnet / `trading_testnet` / this FIV.”

### OPTIONS (not selected)

| Option | Idea | Risk |
| ------ | ---- | ---- |
| C1 | Keep global flag; rely on ENV1+EG1+creds+C7 | Production reachable if live creds + C7 ever granted |
| C2 | Split flags: `allowRealVenueIoTestnet` vs live | Clearer physical separation; needs implementation |
| C3 | Allowlist of permitted (venue, env) when I/O enabled | Narrower than global true; needs implementation |
| C4 | Process/env config for FIV-only composition | Ops risk if mis-set to production |

### DECISION REQUIRED

> May controlled Testnet-only I/O enablement be introduced (e.g. C2/C3) without enabling unrestricted production/live I/O, under separate implementation authorization?

**PROHIBITED now:** setting `allowRealVenueIo=true`, network calls, config changes.

---

## Required Security Boundary (intended future FIV)

| Control | Intended state |
| ------- | -------------- |
| Venue | BINANCE only |
| Environment | `trading_testnet` |
| Endpoint | `testnet.binance.vision` only |
| Capital | ZERO REAL CAPITAL |
| Purpose | Controlled trading execution FIV |
| C7 | Temporary scoped authorization |
| S04 | Mandatory immediately before irreversible I/O |
| Human-start | Durable/shared + single-use + WORKSPACE+ACTOR+SESSION+ACTION |
| Credentials | Vault-backed + purpose/env/venue/workspace bound |
| Egress | EG1 allowlisted + DNS-pinned |
| Adapter | Canonical `ExecutionAdapterPort` path |
| LTE | NON-SoT |
| EmergencyManager | NON-SoT / excluded |
| Production | Inaccessible under FIV enablement model |
| Other venues | Inaccessible under FIV enablement model |

| Distinction | Status |
| ----------- | ------ |
| Governance intent | Frozen D01–D08 + this package |
| Current repository capability | **PARTIAL** — ENV1/EG1/HS/S04/UNKNOWN exist; creds absent; scoped C7 absent; I/O flag global+off |
| Required implementation | Credential ops + scoped C7 + testnet-scoped I/O enablement (after decisions) |

---

## Proposed Remediation Architecture

**PROPOSED** only. Not approved. Not authorized.

### A. Credential enablement

| # | Item |
| - | ---- |
| 1 Current | Purpose `trading_testnet` supported; secret absent |
| 2 Gap | No Vault record for FIV workspace |
| 3 Required control | Ops provision `binance`+`trading_testnet` only; ENV1 fail-closed |
| 4 Implementation boundary | Vault admin/ops path; no Git secrets; no code change strictly required if store API exists |
| 5 Security boundary | No live purpose; no production host; no log leakage |
| 6 Tests | ENV1 mismatch denials; retrieve gate; redaction |
| 7 Rollback | Revoke/delete Vault record |
| 8 PO evidence | Purpose/type/workspace only — never raw material |

### B. Scoped C7 authorization

| # | Item |
| - | ---- |
| 1 Current | DENY-ALL; harness override only |
| 2 Gap | No temporary scoped production grant |
| 3 Required control | Durable grant matching FIV bindings + expiry/single-use + audit |
| 4 Implementation boundary | New authz component + admission integration; **no** matrix LiveCommand for all Admins |
| 5 Security boundary | Fail-closed; no harness-as-prod; no permanent grant |
| 6 Tests | Cross-workspace/actor/session/action deny; expiry; replay; concurrency |
| 7 Rollback | Expire/revoke grant; default DENY-ALL |
| 8 PO evidence | Grant metadata (ids, scope, times) without secrets |

### C. Testnet-only I/O enablement

| # | Item |
| - | ---- |
| 1 Current | `allowRealVenueIo=false` global |
| 2 Gap | No testnet-scoped enablement |
| 3 Required control | Enable DNS-pinned HTTPS only for authorized (BINANCE, testnet) [PROPOSED C2/C3] |
| 4 Implementation boundary | Adapter/module composition — separate from FIV execution |
| 5 Security boundary | Production host unreachable under FIV enablement; no `fetchFn` as FIV; pin mandatory |
| 6 Tests | Negative: live host denied when only testnet enabled; pin path used; no LTE/EM |
| 7 Rollback | Flag/config back to refuse-first |
| 8 PO evidence | Composition config (redacted) + negative egress tests |

---

## Proposed Future Implementation Slices

Names are **PROPOSED**, not approved. **No slice includes FIV execution.**

### FIV-EN1 — Testnet credential binding

| Field | Content |
| ----- | ------- |
| Objective | Make Vault `binance`+`trading_testnet` available for FIV workspace with ENV1 enforcement proven |
| Scope | Vault provision (ops) + regression tests; docs evidence without secrets |
| Likely components | `secret-vault`, ENV1 policy, ADP1 prepareAuth |
| Prohibited | Production keys; Git secrets; venue I/O; FIV run |
| Acceptance | Retrieve succeeds for correct slot; mismatch fails closed; no secret in logs |
| Tests | ENV1 suite + provision smoke (synthetic) |
| Security evidence | Purpose/workspace/venue binding |
| PO gate | Decision 1 + ops readiness |

### FIV-EN2 — Scoped temporary C7 authorization

| Field | Content |
| ----- | ------- |
| Objective | Implement approved scoped temporary C7 grant for exact FIV bindings |
| Scope | Grant store + admission integration + audit |
| Likely components | `live-admission`, auth/permission, new grant module/Prisma |
| Prohibited | Permanent matrix LiveCommand; harness override as prod; FIV run |
| Acceptance | Only matching FIV bindings ALLOW; else DENY; expiry/replay-safe |
| Tests | Isolation matrix for C7 grant |
| Security evidence | SB-style isolation |
| PO gate | Decision 2 + Arch/Sec design approval |

### FIV-EN3 — Testnet-only I/O enablement

| Field | Content |
| ----- | ------- |
| Objective | Enable DNS-pinned I/O for BINANCE testnet without enabling production I/O |
| Scope | Adapter composition / allowlist of permitted (venue, env) |
| Likely components | `execution-adapter.module`, `live-venue-egress-http`, live adapter options |
| Prohibited | Global unrestricted live; `fetchFn` as FIV; LTE/EM; FIV run |
| Acceptance | Testnet pin path works in controlled test; production host denied under FIV enablement |
| Tests | EG1 negatives + pin path unit/integration without real venue if possible |
| Security evidence | DNS CONDITION path composition |
| PO gate | Decision 3 |

### FIV-EN4 — Security regression / isolation verification

| Field | Content |
| ----- | ------- |
| Objective | Cross-boundary regression covering EN1–EN3 without venue FIV |
| Scope | Conformance suite extension |
| Prohibited | Real venue FIV; capital; production |
| Acceptance | Isolation green; no secret leakage |
| PO gate | After EN1–EN3; before FIV preflight |

---

## Security Acceptance Matrix

| Control | Required State | Current State (FACT) | Gap | Evidence Required |
| ------- | -------------- | -------------------- | --- | ----------------- |
| C7 | Temporary scoped authorization | DENY-ALL; no scoped grant | **Missing mechanism** | Grant tests + audit |
| S04 | Mandatory pre-I/O | Implemented (`evaluateForL02Contract` / claim path) | Not exercised in FIV | Pre-I/O admission evidence at FIV |
| Human Start | Durable + single-use | HS1 implemented | Not exercised in FIV | HS claim evidence at FIV |
| Credential | Vault + testnet bound | Purpose exists; secret **absent** | **Provision** | Vault metadata (no secrets) |
| ENV1 | Binance Testnet only | Policy implemented | Needs real secret to exercise E2E | ENV1 tests + FIV preflight |
| EG1 | Allowlisted + pinned | Allowlist+pin code; pin not demonstrated on live path | Enablement + demo | Pin composition tests; FIV transport evidence |
| Production isolation | Impossible from FIV path | Policy isolation; I/O flag global | **Scoped I/O enablement** | Negative egress tests |
| Other venue isolation | Impossible from FIV path | EG1/venue binding | Same | Negative tests BYBIT/OKX |
| LTE | NON-SoT | Mounted NON-SoT | Confusion residual | Arch/ISO evidence |
| EmergencyManager | Excluded | EM1 isolation | Residual `/v1/live` NON-SoT | EM1/ISO |
| UNKNOWN | First-class | UNK1 implemented | Not exercised | Lifecycle tests |
| Idempotency | Durable/restart-safe | Domain + Engine | Not exercised | Tests |

---

## Decisions Required From PO / Governance

### Decision 1 — Credential provisioning

Whether the project may provision a dedicated Binance Testnet credential for this controlled FIV (`binance` + `trading_testnet`, ZERO REAL CAPITAL).

### Decision 2 — C7 mechanism

Whether Architecture/Security should implement a temporary scoped C7 authorization mechanism (no approved production mechanism exists today).

### Decision 3 — I/O enablement model

Whether controlled Testnet-only enablement may be introduced without enabling unrestricted production/live I/O (global `allowRealVenueIo=true` alone is insufficient as a physical boundary).

### Decision 4 — FIV scope confirmation

Confirm: Binance only; Testnet only; zero real capital; no other venues; no production; no deposits/withdrawals/treasury/payment operations.

### Decision 5 — Future FIV authorization

**FACT / rule:** Implementation approval does **NOT** equal FIV execution authorization. A separate FIV execution gate remains required after remediation and preflight.

---

## Non-Negotiable Prohibitions

```text
PROHIBITED:
NO production credentials
NO production endpoint
NO real capital
NO unrestricted allowRealVenueIo
NO global C7 bypass
NO permanent C7 grant
NO harness override as production authorization
NO venue calls during this task
NO Binance account interaction during this task
NO FIV execution from this artifact
NO code implementation from this artifact
NO schema migration from this artifact
NO configuration change from this artifact
NO credential provisioning from this artifact
NO weakening of S04
NO bypass of HumanStartProof
NO bypass of EG1
NO bypass of ENV1
NO use of LTE as SoT
NO EmergencyManager integration for L02 FIV
NO blind retries
NO conversion of UNKNOWN into success/rejection
```

---

## Governance Status

```text
FIV readiness:              NOT READY
This package:               DECISION SUPPORT ONLY
Implementation:             NOT AUTHORIZED by this artifact
FIV execution:              NOT AUTHORIZED by this artifact
Live I/O:                   NOT AUTHORIZED
Credentials provisioned:    NO (this task)
Capital movement:           NOT AUTHORIZED
```

### Next governance sequence

```text
Decision Package (this artifact)
→ Architecture Review
→ Security Review
→ PO/Governance Decision (Decisions 1–5)
→ Implementation Authorization
→ Implementation Slice Planning (e.g. FIV-EN1…EN4)
→ Implementation
→ PO Review
→ Security/Architecture Verification
→ FIV Preflight
→ Separate FIV Authorization
→ Controlled FIV
→ FIV Review
```

Do not skip gates.

---

## Source-of-Truth Inspected

- ADR-020; Wave 6 planning / D-GOV-01…05 (as referenced in wave-6 register)
- V3-L02 planning, PO freezes, architecture/security reviews & closeouts
- Slice approval readiness; FIV authorization package; FIV freeze; FIV execution report
- Code: `permission-matrix`, `live-admission.service`, `execution-adapter.module`, `live-venue-egress-http`, `live-venue-allowlist`, `secret-purpose`, ENV1 policy, Vault service patterns

---

## STOP

Next: **Architecture Review** and **Security Review** of this enablement decision package, then **PO/Governance Decisions 1–5**.
Do not implement. Do not provision. Do not enable I/O. Do not execute FIV from this document.
