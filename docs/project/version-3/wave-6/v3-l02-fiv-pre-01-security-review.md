# V3-L02 FIV-PRE-01 — Security Review (Binance Testnet Credential Architecture)

**Document:** FIV-PRE-01 Security Review
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02
**Prerequisite:** FIV-PRE-01 — Binance Testnet Credential Architecture
**Reviewer role:** Security Reviewer (Wave 6 / V3-L02)
**Nature:** SECURITY REVIEW-ONLY governance artifact. **Not** implementation authorization. **Not** PO/Governance Decision. **Not** credential provisioning. **Not** C7 / Testnet I/O / FIV authorization.
**Review targets:**
- `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-testnet-credential-planning-package.md`
- `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-architecture-review.md` (`ARCHITECTURE PASS WITH CONDITIONS`)

**Repository baseline:** `4fc72dde5c7b647ff87fae4b216ee44380b8d2b2`

```text
SECURITY REVIEW — NOT IMPLEMENTATION APPROVAL

Security approval does NOT authorize:
  - implementation
  - schema migration
  - UI/API changes
  - credential provisioning
  - C7
  - Testnet I/O
  - Binance API calls
  - FIV execution
```

**Classification legend:** FACT · INFERENCE · CONDITION · OPEN

Protected dirty/untracked leftovers outside this new artifact were **not** modified.
Planning package and Architecture Review were **not** modified.

---

## 1. Review scope

### In scope

1. Credential isolation
2. Environment isolation
3. Purpose isolation
4. Workspace isolation
5. Connection isolation
6. Vault resolution
7. Binance endpoint isolation
8. LIVE backward compatibility
9. Fail-closed behavior
10. Secret exposure
11. Migration safety
12. Provider+environment uniqueness
13. Handshake security
14. Negative-path behavior

### Out of scope (explicit)

- C7 implementation / authorization (FIV-PRE-02)
- FIV execution
- Testnet/production I/O enablement (FIV-PRE-03)
- Credential provisioning
- Code, schema, API, UI, Vault configuration changes

### Governance inputs

| Input | Use |
| ----- | --- |
| FIV-PRE-01 planning package | Proposed model / slices / open Qs |
| FIV-PRE-01 Architecture Review | Asymmetric Model C; INV-01…10; conditions |
| ADR-020 | Vault ownership; no provisioning by ADR alone |
| V3-L02 security review / final security closeout | SB-01 EG1, SB-06 ENV1, DNS pin CONDITION for FIV composition |
| FIV-D04 freeze | Credential class = `trading_testnet` |
| ENV1 / EG1 / Vault / Connections / handshake code | Current mitigations vs gaps |

### Security baseline (required target)

```text
LIVE:    BINANCE + trading (+ LIVE env)     → existing LIVE path
TESTNET: BINANCE + trading_testnet (+ TESTNET env) → separate Testnet path
```

Must prevent: LIVE cred × TESTNET exec; TESTNET cred × LIVE exec; workspace A × B credential; Testnet context × production Binance endpoint.

---

## 2. Current security architecture

### Runtime (live adapter / ENV1 / EG1) — FACT

| Control | Evidence |
| ------- | -------- |
| Purpose → env | `tradingEnvironmentFromPurpose`: `trading`/`trading_live`→live; `trading_testnet`→testnet |
| Exact resolve key | `${workspaceId}::${type}::${purpose}` in live credential provider |
| ENV1 binding | `assertLiveCredentialEnvironmentBinding`: workspace/venue/env mismatch → deny |
| Client escalation | `client_environment_escalation` deny |
| EG1 allowlist | Binance live=`api.binance.com`; testnet=`testnet.binance.vision` |
| EG1 URL policy | HTTPS only; no userinfo; hostname allowlist; redirect restriction; private/loopback/link-local deny on DNS path |
| DNS pinning | Real I/O path: resolve → public IP → pinned HTTPS agent; Nest `allowRealVenueIo=false` |
| Redaction | `redactCredentialMaterial`; fixed deny codes |
| Paper/Mock | Cannot retrieve trading credentials |

**Closeout status:** SB-06 ENV1 PASS; SB-01 EG1 PASS; DNS/rebinding for FIV enablement composition remains a **separate CONDITION** (not introduced by FIV-PRE-01 Connections work).

### Product path (Connections / handshake) — FACT

| Control | Current state |
| ------- | ------------- |
| Connection env/purpose | **Absent** |
| Vault store from Connections | Purpose omitted → default `trading` (LIVE-class) |
| Slot policy | One vault-backed Connection per `(workspace, provider)` |
| Handshake | Hardcoded `https://api.binance.com` |
| Vault retrieve on handshake | Type-only (default purpose) |
| Connection API responses | Metadata + `credentialsStored` boolean — no secret fields |

---

## 3. Security findings

### F-01 — Runtime LIVE/Testnet isolation is already fail-closed when purpose is exact

ENV1 denies LIVE↔TESTNET cross-use and workspace/venue mismatches. Exact purpose slot prevents nearest-credential selection at the live provider interface.

### F-02 — Connections product path is the primary security gap for introducing Testnet

Purpose-omitted store, provider-only get/retrieve, production-only handshake, and one-provider uniqueness collectively prevent a safe operator `BINANCE + trading_testnet` path and create confusion risk once Testnet is introduced.

### F-03 — Asymmetric Model C is acceptable if Vault purpose remains sole runtime SoT

Connection.environment as a non-authoritative consistency constraint does **not** create dual runtime authority **provided** mismatch fails closed at store/validate/handshake/resolve binding points. Equal-authority dual SoT would be rejected.

### F-04 — Omitting environment after multi-env support ships is unsafe

Default `→ trading` cannot remain an implicit multi-env behavior. Security requires reject **or** an explicit LIVE-only default that cannot select Testnet, with no silent Testnet.

### F-05 — Handshake production default is a security defect for Testnet Connections

Validating Testnet keys against `api.binance.com` risks wrong-environment key exercise and false CONNECTED confidence. Environment-aware handshake is a **security requirement**, not a UX nicety.

### F-06 — EG1/SSRF controls are sufficient for Testnet host introduction if reused

Fixed `testnet.binance.vision` already in allowlist; no user-controlled venue URL on ADP1 path. Handshake path must adopt equivalent fixed-origin selection (not EG1 client today) — **CONDITION**.

### F-07 — Existing LIVE `binance + trading` must not be weakened

Migration/backfill may label existing Connections LIVE only. Converting purpose or env to Testnet is prohibited.

### F-08 — Architecture conditions are security-mandatory

This review adopts Architecture conditions 1–8 as **security conditions**. Condition 9 (`trading` vs `trading_live`) is tracked as LIVE residual risk — must not regress LIVE resolve when wiring Vault-backed credentials later.

---

## 4. Purpose isolation

| Purpose | Env class | Distinct slot? |
| ------- | --------- | -------------- |
| `trading` | LIVE | Yes |
| `trading_live` | LIVE | Yes (separate from `trading`) |
| `trading_testnet` | TESTNET | Yes |

**Semantics:** FACT — distinct.
**Vault resolution:** FACT — unique `(workspaceId, type, purpose)`; AAD includes purpose; unwrap fails on binding mismatch.
**Caller requesting `trading` when Testnet intended:** Possible today via Connections omit-purpose — **unsafe product behavior**. Live engine requests `trading_testnet` for testnet orders — no silent remap to `trading` in `purposeForTradingEnvironment`.
**Fallback / nearest / provider-only:** Prohibited by security contract. Present today on Connections/handshake paths — **must be removed** for multi-env trading access.

**Required invariant:**

```text
requested purpose ≠ credential purpose
        ↓
FAIL CLOSED
```

---

## 5. Environment isolation (asymmetric Model C)

```text
Vault purpose = runtime SoT
Connection.environment = store/audit constraint
```

**Dual-place risk:** Acceptable only with asymmetric authority. If Connection.environment ≠ env implied by Vault purpose → **FAIL CLOSED**.

| Checkpoint | Required check |
| ---------- | -------------- |
| Connection create (metadata) | If env set at create: persist; validate allowlist |
| Credential store/replace | Derive purpose from env; store exact purpose; persist env; reject missing env on multi-env API (or LIVE-only explicit default) |
| Connection retrieve/view | Expose env label only; never secrets; optionally surface purpose class metadata without material |
| Credential resolution (live) | Exact purpose from execution context; ENV1 bind; optionally assert Connection.environment consistency if Connection consulted |
| Adapter / EG1 selection | Endpoint env from trusted purpose-derived env only |
| Handshake / validate | Origin from Connection.environment / Vault purpose; mismatch deny |
| Execution | ENV1 already enforces; no Connection-field override of purpose |

**Rejected:** Treating Connection.environment as runtime SoT without Vault purpose alignment.

---

## 6. Connection security

### Current API/DTO/persistence (FACT)

- Create: `displayName` + `provider` only
- Store/replace credentials: `credentials` object only — no environment
- View: no purpose/environment; `credentialsStored` boolean
- Persistence: no env column

### Omitted environment → `trading` default

**Once Testnet exists, this default is unsafe** for any API that claims multi-environment support: operator intent Testnet can land LIVE-class purpose.

**Required security property:**

```text
multi-environment Binance Connection
+
missing environment
        ↓
reject
  OR
safe explicit LIVE-only default that cannot select Testnet
  (must be documented, tested, and UX-labeled)
```

Security preference: **reject** missing environment on multi-env store/validate APIs. If LIVE-only default retained for backward UX, it must be impossible to interpret as Testnet and must not apply when client claims Testnet.

### Connection isolation

- Separate Connection + Vault slot per environment (Architecture AQ-07) — **REQUIRED**
- LIVE Connection must not be reusable for Testnet — **REQUIRED**
- `vaultSecretId` remains opaque; credentials write-only — **KEEP**

---

## 7. Vault resolution security contract

**Minimum lookup:**

```text
workspaceId + type (venue) + purpose
```

Environment derived from purpose via ENV1. Additional required checks:

- ACL / membership + VaultConnections permission
- ENV1 workspace/venue/endpoint binding before use
- No provider-only trading resolve after multi-env ships
- Optional Connection.environment consistency when Connection is in the path

### Matrix — resolver must not select on provider alone

| Context | Must resolve | Must not resolve |
| ------- | ------------ | ---------------- |
| Workspace A + Binance Testnet | A `binance`+`trading_testnet` | A LIVE; any B |
| Workspace B + Binance Testnet | B `binance`+`trading_testnet` | B LIVE; any A |
| Workspace A + Binance LIVE | A `binance`+`trading` (and/or approved `trading_live` policy) | A Testnet; any B |
| Workspace B + Binance LIVE | B LIVE slot | B Testnet; any A |

---

## 8. LIVE/Testnet cross-use matrix

| Requested Context | Available Credential | Required Result | Current ENV1 (exact purpose) | Connections path today |
| ----------------- | -------------------- | --------------- | ---------------------------- | ---------------------- |
| LIVE | LIVE | ALLOW | ALLOW | Stores LIVE |
| LIVE | TESTNET | DENY | DENY | N/A (no Testnet store) |
| TESTNET | TESTNET | ALLOW | ALLOW | **Cannot provision** |
| TESTNET | LIVE | DENY | DENY | Would wrongly use LIVE if purpose omitted |

| Connection env | Vault Purpose | Required Result |
| -------------- | ------------- | --------------- |
| LIVE | `trading` | ALLOW |
| LIVE | `trading_testnet` | DENY |
| TESTNET | `trading_testnet` | ALLOW |
| TESTNET | `trading` | DENY |

**Security mandate:** Explicit negative tests for every DENY case before FIV-PRE-01 implementation close.

---

## 9. Endpoint / handshake security

### Required target

```text
trading / trading_live  →  api.binance.com
trading_testnet         →  testnet.binance.vision
```

Must prevent cross-binding without explicit approved mechanism (none authorized here).

### Current handshake implications (FACT)

- Hardcoded production origin
- Used during Connection validation
- Retrieves Vault by type only → default `trading`
- Risk: Testnet keys validated against production; missing env → production default

### Required handshake chain

```text
Connection validation
  → environment (explicit / bound)
  → purpose (derived)
  → credential (exact slot)
  → endpoint (env-mapped fixed origin)
```

Wrong or missing environment → **FAIL CLOSED** (no production default for Testnet-intent paths).

### Live egress (ADP1/EG1)

URL construction from allowlisted origin + relative path; hostname validation; HTTPS; no user-controlled venue URL; redirect policy; private IP denial; DNS pin on real I/O. Introducing Testnet credentials does **not** require new EG1 hosts (already present).

---

## 10. SSRF / egress analysis

| Requirement | Status |
| ----------- | ------ |
| Fixed Binance Testnet hostname | FACT: `testnet.binance.vision` in EG1 allowlist |
| HTTPS only | FACT: EG1 `https_required` |
| No user-controlled venue URL | FACT: ADP1 builds from allowlist |
| No arbitrary redirects | FACT: `redirect_forbidden` / Location allowlist checks |
| Private IP rejection | FACT: DNS path denies non-public IPs |
| DNS rebinding protection | FACT: pin on real connect; Nest I/O off |
| Endpoint allowlist enforced | FACT: EG1 + ENV1 targetUrl check |

**Citations:** `live-venue-egress-policy.ts`, `live-venue-egress-http.ts`, `v3-l02-s-eg1-egress-security.spec.ts`, final security closeout SB-01 / DNS section.

**CONDITION (pre-existing, not introduced by FIV-PRE-01 Connections design):** DNS-pin composition must remain mandatory when FIV-PRE-03 enables real I/O; injected `fetchFn` footgun noted in closeout. Handshake is **not** currently on EG1 DNS-pin transport — environment-aware handshake must still use fixed allowlisted origins and must not accept user URLs (**CONDITION** for handshake implementation).

---

## 11. Migration security

| Prohibited | Ruling |
| ---------- | ------ |
| Convert LIVE credentials to Testnet | PROHIBITED |
| Overwrite existing LIVE purpose | PROHIBITED |
| Silently create Testnet credentials | PROHIBITED |
| Copy/expose secret material during migration | PROHIBITED |
| Weaken workspace isolation | PROHIBITED |
| Create ambiguous Connections | PROHIBITED |

If Connection.environment is backfilled:

```text
existing Binance LIVE  →  LIVE
never                  →  TESTNET
```

Provider+environment uniqueness migration must not orphan or dual-bind `vaultSecretId` across envs.

---

## 12. Secret exposure analysis

| Channel | Current / required |
| ------- | ------------------ |
| Frontend / Connection responses | FACT: no apiKey/apiSecret; `credentialsStored` only — **KEEP** |
| Vault list/get metadata | Metadata without plaintext — **KEEP** |
| retrieve | Server memory only; not customer API — **KEEP** |
| Logs / errors | Redaction helpers + fixed deny codes — **KEEP**; extend to new Connection env paths |
| Audit events | Must record purpose/env/workspace ids — never raw secrets/HMAC/Authorization |
| Exceptions | Must not stringify credential maps |

Proposed architecture does not require returning secrets. Any new DTO field for environment/purpose class is non-secret metadata only.

**This review did not access or display any real secret values.**

---

## 13. Threat Model

### T-01 — Credential confusion (Testnet used as LIVE)

| Field | Content |
| ----- | ------- |
| Attack condition | Testnet keys stored under `trading` via omitted purpose; or resolve fallback |
| Affected boundary | Purpose / environment isolation |
| Existing mitigation | ENV1 if purpose exact; Vault unique slots |
| Required mitigation | Explicit env on store; exact purpose; no fallback |
| Residual risk | Operator pastes wrong keys into correct slot (operational) |
| Required test | Store Testnet-intent without env → reject or cannot land Testnet material in LIVE slot unintentionally |

### T-02 — Endpoint confusion (Testnet → production)

| Field | Content |
| ----- | ------- |
| Attack condition | Handshake/egress uses production origin for Testnet Connection |
| Affected boundary | Endpoint isolation |
| Existing mitigation | EG1/ENV1 on ADP1 path |
| Required mitigation | Env-aware handshake; ENV1 continues on live path |
| Residual risk | Non-EG1 clients if introduced without allowlist |
| Required test | Testnet Connection validate → not `api.binance.com` |

### T-03 — LIVE credential used in Testnet

| Field | Content |
| ----- | ------- |
| Attack condition | Testnet order resolves `trading` / provider-only |
| Affected boundary | Purpose isolation |
| Existing mitigation | ENV1 deny; engine requests `trading_testnet` |
| Required mitigation | No provider-only lookup; missing Testnet fails closed |
| Residual risk | Low if conditions implemented |
| Required test | TESTNET context + LIVE cred → DENY |

### T-04 — Provider-only lookup

| Field | Content |
| ----- | ------- |
| Attack condition | `vault.get/retrieve({ type: binance })` without purpose |
| Affected boundary | Vault resolution |
| Existing mitigation | None on Connections path (defaults to `trading`) |
| Required mitigation | Require purpose on multi-env trading paths |
| Residual risk | Legacy LIVE-only helpers if left undocumented |
| Required test | Provider-only trading lookup denied or LIVE-only explicitly gated |

### T-05 — Workspace crossing

| Field | Content |
| ----- | ------- |
| Attack condition | Actor in A resolves B secret |
| Affected boundary | Workspace isolation |
| Existing mitigation | Vault ACL + AAD + ENV1 workspace_mismatch + isolation tests |
| Required mitigation | Preserve on all new Connection env paths |
| Residual risk | Low |
| Required test | A cannot resolve B Testnet or LIVE |

### T-06 — Migration corruption

| Field | Content |
| ----- | ------- |
| Attack condition | Backfill sets existing LIVE → TESTNET |
| Affected boundary | Migration safety / LIVE compatibility |
| Existing mitigation | None (no migration yet) |
| Required mitigation | Backfill LIVE only; no purpose rewrite |
| Residual risk | Operator error in manual ops scripts |
| Required test | Migration dry-run assertions on fixtures |

### T-07 — Connection spoofing (inconsistent env/purpose)

| Field | Content |
| ----- | ------- |
| Attack condition | Client sends environment=testnet but vaultSecretId points at LIVE purpose |
| Affected boundary | Connection ↔ Vault consistency |
| Existing mitigation | Partial (id match checks exist for ownership) |
| Required mitigation | Fail closed when Connection.environment ≠ purpose-derived env |
| Residual risk | Low if checked at validate/resolve |
| Required test | LIVE Connection + trading_testnet secret → DENY |

### T-08 — Fallback abuse

| Field | Content |
| ----- | ------- |
| Attack condition | Missing Testnet secret → use LIVE |
| Affected boundary | Fail-closed / INV-07 |
| Existing mitigation | Exact slot returns null; ENV1 not reached with wrong purpose |
| Required mitigation | Explicitly forbid fallback in Connections and any Vault-backed provider |
| Residual risk | Accidental alias `trading`↔`trading_live` if later added carelessly |
| Required test | Missing Testnet → fail; does not return LIVE material |

### T-09 — SSRF via environment-aware endpoint selection

| Field | Content |
| ----- | ------- |
| Attack condition | Env parameter becomes free-form URL/host |
| Affected boundary | EG1 / handshake |
| Existing mitigation | EG1 allowlist; ADP1 fixed origins |
| Required mitigation | Env enum → fixed origin map only; never user URL |
| Residual risk | Handshake path must not invent open URL client |
| Required test | Malicious env/host strings rejected |

### T-10 — Secret leakage

| Field | Content |
| ----- | ------- |
| Attack condition | Logs/errors/API echo credentials |
| Affected boundary | Secret non-exposure |
| Existing mitigation | Write-only DTOs; metadata views; redaction; Vault retrieve boundaries |
| Required mitigation | Extend redaction/audit discipline to new fields |
| Residual risk | Misconfigured debug logging (ops) |
| Required test | Response/log fixtures contain no apiKey/apiSecret/ciphertext |

---

## 14. Security regression plan (mandatory for implementation)

### Credential isolation
- LIVE → LIVE allowed
- Testnet → Testnet allowed
- LIVE → Testnet denied
- Testnet → LIVE denied

### Workspace isolation
- A → A allowed
- A → B denied (LIVE and Testnet)

### Purpose isolation
- Exact purpose allowed
- Wrong purpose denied
- Missing purpose denied (on multi-env paths)
- Provider-only lookup denied (or LIVE-only explicit gate with tests)

### Environment isolation
- Exact environment allowed
- Mismatch denied
- Missing environment denied where required

### Endpoint isolation
- Testnet → Testnet endpoint allowed
- Testnet → Production denied
- LIVE → Production allowed
- LIVE → Testnet denied

### Fallback safety
- No fallback; no default cross-env credential; no nearest; no provider-only trading resolve

### Secret safety
- No secret in response/logs/errors/frontend

### Backward compatibility
- Existing LIVE credential path remains functional
- Existing LIVE Connections remain LIVE

Every DENY row in §8 matrices requires an explicit automated negative test.

---

## 15. Provider+environment uniqueness (concurrency)

Transition from provider-only to provider+environment uniqueness:

| Risk | Required control |
| ---- | ---------------- |
| Duplicate active credentials same env | Unique constraint / transactional assert on `(workspace, provider, environment)` with non-null vault binding |
| Ambiguous selection | Resolve by purpose/env — never “first Binance Connection” |
| Race create/update | DB unique + conflict errors; no TOCTOU relying only on read-then-write without constraint |
| Cross-workspace | Workspace remains part of uniqueness / queries |
| Environment confusion | Env enum validated; mismatch with Vault purpose fail closed |

Do not implement constraints in this review. Security requires uniqueness change **before** claiming safe LIVE+TESTNET coexistence.

---

## 16. Security Decision Matrix

| Security Property | Required | Current | Gap | Required Evidence |
| ----------------- | -------- | ------- | --- | ----------------- |
| Purpose isolation | Exact purpose; no fallback | ENV1/Vault yes; Connections no | Connections/handshake purpose-omit | Negative tests; exact-purpose APIs |
| Environment isolation | Purpose SoT + Connection consistency | ENV1 yes; Connection env absent | Persist env + mismatch deny | Store/validate/handshake tests |
| Workspace isolation | Mandatory | Vault ACL+AAD+ENV1+ISO1 | Preserve on new paths | Cross-workspace deny tests |
| LIVE/Testnet separation | Fail closed both directions | ENV1 matrix PASS | Product path cannot create Testnet safely | §8 DENY tests + provisioning path |
| Endpoint isolation | Purpose↔host binding | EG1/ENV1 PASS; handshake hardcoded prod | Env-aware handshake | Handshake origin tests |
| Vault fail-closed | Wrong purpose/workspace deny | Slot+AAD+ENV1 | Remove provider-only trading access | Resolver tests |
| Connection fail-closed | Missing/mismatch env deny | Defaults to LIVE | Multi-env explicit env | API validation tests |
| Provider+environment uniqueness | Coexistence without ambiguity | One-provider only | Uniqueness redesign | Conflict/race tests |
| SSRF protection | Allowlist HTTPS no user URL | EG1 PASS | Handshake must not open URLs | EG1 suite + handshake fixed origin |
| DNS pinning | Mandatory for real I/O | Present; Nest I/O off | FIV composition CONDITION (pre-existing) | Closeout / FIV-PRE-03 |
| Secret non-exposure | Never FE/logs/errors | Connections/Vault patterns PASS | Maintain on new fields | Snapshot/redaction tests |
| LIVE backward compatibility | Existing LIVE unchanged | `trading` LIVE-class | Migration must not convert | Backfill assertions |
| Migration safety | LIVE→LIVE only | N/A | Policy + tests | Migration review gate |

---

## 17. Conditions / blockers

### Security conditions (must be satisfied for implementation authorization / close)

1. Reuse `SecretPurpose.TradingTestnet` (no parallel classification).
2. Asymmetric Model C: Vault purpose = runtime SoT; Connection.environment consistency fail-closed.
3. Explicit environment on multi-env Connection credential APIs; missing env → reject or documented LIVE-only default that cannot select Testnet.
4. Provider+environment uniqueness enabling safe LIVE+TESTNET coexistence without ambiguous selection.
5. Environment-aware Binance handshake with fixed allowlisted origins; no production default for Testnet-intent; LIVE origin unchanged for LIVE.
6. Exact-purpose Vault access on Connection store/replace/get/retrieve/revoke/validate paths (no provider-only trading lookup for multi-env).
7. No silent LIVE→Testnet migration; optional env backfill to LIVE only.
8. Mandatory regression suite covering §14 and all §8 DENY cases.
9. Handshake must not accept user-controlled URLs (fixed origin map only).
10. Preserve secret non-exposure and workspace isolation on all new paths.
11. Pre-existing: DNS-pin composition remains mandatory when real venue I/O is later enabled (FIV-PRE-03 / closeout CONDITION) — not waived by FIV-PRE-01.

### Residual OPEN (does not block this security verdict if conditions above accepted)

- Legacy `trading` vs `trading_live` LIVE slot alias policy for future Vault-backed live resolve — must not introduce cross-env fallback; track separately without weakening Testnet isolation.

### Would force SECURITY BLOCKED

- Approving cross-env fallback / provider-only resolve as acceptable
- Making Connection.environment sole runtime trust without Vault purpose
- Silent LIVE→Testnet migration
- User-controlled handshake/egress URLs
- Returning secrets in Connection APIs

None of these are proposed by the Architecture Review under Option A / asymmetric Model C.

---

## 18. Final security verdict

```text
SECURITY PASS WITH CONDITIONS
```

**Rationale:** The proposed FIV-PRE-01 architecture (reuse `trading_testnet`, ENV1 purpose-as-runtime-SoT, Connection environment as consistency constraint, exact-purpose resolve, env-aware handshake, provider+environment uniqueness, preserve LIVE) provides a **sufficient security boundary** for introducing `BINANCE + trading_testnet` **without weakening** the existing LIVE security boundary **if and only if** the conditions in §17 are implemented and evidenced.

Unconditional `SECURITY PASS` is **not** issued because LIVE/Testnet cross-use prevention, production endpoint exposure via handshake, unsafe omit-purpose default, and ambiguous one-provider selection remain **unresolved in the product path** until those conditions are met.

`SECURITY BLOCKED` is **not** issued because Architecture Review correctly rejects unsafe alternatives, and ENV1/EG1/Vault already supply the core fail-closed runtime controls.

---

## 19. Governance separation

```text
Security Review (this artifact)
        → PO / Governance Decision
        → Implementation Authorization (separate act)
```

```text
FIV-PRE-01 = SECURITY REVIEWED (PASS WITH CONDITIONS)
Implementation = NOT AUTHORIZED
Schema migration = NOT AUTHORIZED
UI/API changes = NOT AUTHORIZED
Credential provisioning = NOT AUTHORIZED
C7 = NOT AUTHORIZED
Testnet I/O = NOT AUTHORIZED
Binance API calls = PROHIBITED by this act
FIV execution = NOT AUTHORIZED
Production I/O = PROHIBITED
Real capital = PROHIBITED
```

### Explicit non-claims

This artifact does **not** claim: FIV READY / FIV PASS / FIV COMPLETE; implementation authorized; C7 authorized; Testnet I/O authorized.

---

## 20. Review execution record

| Item | Value |
| ---- | ----- |
| Artifact path | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-security-review.md` |
| Planning / Architecture artifacts modified | **No** |
| Code / schema / API / UI / Vault changes | **None** |
| Credentials modified | **None** |
| Secrets exposed | **None** |
| Binance API calls | **None** |
| FIV executed | **None** |
| Capital moved | **None** |
| Protected leftovers touched | **None** |
