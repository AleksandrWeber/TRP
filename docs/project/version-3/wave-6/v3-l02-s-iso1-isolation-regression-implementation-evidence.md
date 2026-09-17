# V3-L02-S-ISO1 — Cross-Workspace / Live-Path Isolation Regression Evidence

**Document:** ISO1 implementation evidence  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02  
**Slice:** `L02-S-ISO1` / SB-07 only  
**Nature:** Regression/security verification evidence for PO review. **Not** Slice Approval. **Not** FIV. **Not** live capital activation.

```text
SB-07 implementation-complete for cross-workspace / live-path isolation regression.
Runtime live I/O remains gated/blocked (C7 deny-all, allowRealVenueIo=false).
```

---

## 1. Scope

In scope: focused isolation regression suite composing EM1/HS1/UNK1/EG1/ENV1/ADP1 boundaries.  
Out of scope: live I/O enablement, C7 grants, credential provisioning, FIV, Slice Approval, architecture redesign.

---

## 2. Initial Repository State

HEAD at ISO1 start: `d585193` (ADP1 lint fix). SB-01…SB-06 complete; SB-07 planned. Leftovers protected and untouched.

---

## 3. Security Boundaries Tested

Workspace · Actor · Session · Action/Command · Human-start · ENV1 · EG1 · C7 · S04 · KS · Policy · Idempotency · UNKNOWN · Cancel · Paper/Mock · Credential leakage · EmergencyManager · live-trading-engine NON-SoT · Canonical adapter path.

---

## 4–8. Workspace / Actor / Session / Action / Human-start

| ID          | Result                                                           |
| ----------- | ---------------------------------------------------------------- |
| ISO-W01…W05 | PASS — cross-WS gate/HS/cred/order/idempotency isolated          |
| ISO-A01…A04 | PASS — cross-actor HS/execution denied                           |
| ISO-S01…S04 | PASS — session binding enforced; adapter not reached             |
| ISO-C01…C04 | PASS — action/command binding + replay deny                      |
| ISO-H01…H05 | PASS — concurrent single claim; restart; expiry; claim≠submitted |

---

## 9–10. ENV1 / EG1

| ID          | Result                                                  |
| ----------- | ------------------------------------------------------- |
| ISO-E01…E08 | PASS — live/testnet/demo/unknown/venue/paper isolation  |
| ISO-G01…G08 | PASS — allowlist/private IP/HTTP/redirect/user URL deny |

---

## 11–14. Canonical path / EM / LTE / C7

| ID             | Result                                                     |
| -------------- | ---------------------------------------------------------- |
| Canonical path | PASS — Engine→Routing→Live/Paper; static import scan clean |
| ISO-EM01…EM04  | PASS — no EM on KS/policy/session/canonical path           |
| ISO-LT01…LT03  | PASS — live-trading-engine NON-SoT; no import              |
| ISO-C701…C703  | PASS — C7 deny-all blocks; harness override test-only      |

---

## 15–19. S04 / KS / Policy / Session / Idempotency

| ID            | Result                                                       |
| ------------- | ------------------------------------------------------------ |
| ISO-S041…S044 | PASS — S04 mandatory; ordering at pre-I/O gate               |
| ISO-KS01…KS04 | PASS — KS blocks new; no cancel-all; no EM                   |
| ISO-P01…P04   | PASS — PAPER blocks new; no silent CANCELLED                 |
| ISO-T01…T04   | PASS — ended session blocks; UNKNOWN preserved               |
| ISO-I01…I09   | PASS — workspace-scoped identity; UNKNOWN blocks blind retry |

---

## 20–24. UNKNOWN / Cancel / Paper / Leakage / Matrix

| ID                    | Result                                           |
| --------------------- | ------------------------------------------------ |
| ISO-U01…U08           | PASS — timeout/reset → UNKNOWN; no invented fill |
| ISO-X01…X07           | PASS — cancel outcomes; no cancel-all; no EM     |
| ISO-PM01…PM05         | PASS — paper functional; never live route/creds  |
| ISO-R01…R05           | PASS — synth secrets redacted from errors/logs   |
| Cross-boundary matrix | PASS — only fully matching context allows        |

---

## 25. Exact Tests and Results

```bash
cd apps/api && pnpm exec vitest run \
  src/platform-conformance/v3-l02-s-iso1-isolation-regression.spec.ts \
  src/platform-conformance/v3-l02-s-em1-emergency-manager-isolation.spec.ts \
  src/modules/execution-adapter/live-venue/v3-l02-s-adp1-live-execution-adapter.spec.ts \
  src/modules/execution-adapter/live-venue-egress/v3-l02-s-env1-credential-environment.spec.ts \
  src/modules/execution-adapter/live-venue-egress/v3-l02-s-eg1-egress-security.spec.ts \
  src/modules/trading-session/live-admission/v3-l02-s-hs1-human-start.spec.ts \
  src/modules/execution-engine/v3-l02-s-unk1-engine.spec.ts \
  src/modules/execution-adapter/paper-execution.adapter.spec.ts
```

**Result (2026-09-17):** 8 files, **210 passed** (96 ISO1 + L02 regressions). Zero venue network calls.

Files:

- `apps/api/src/platform-conformance/v3-l02-s-iso1-isolation.ts`
- `apps/api/src/platform-conformance/v3-l02-s-iso1-isolation-regression.spec.ts`

---

## 26. ISO1-01…37 Results

All **PASS** (ISO1-01…ISO1-37). SB-07 evidence complete.

---

## 27. Residual Risks

- Production C7 remains deny-all; harness `authorizationOverride` is test-only
- `allowRealVenueIo=false`; real venue I/O still blocked
- ISO1 does not authorize FIV, capital activation, or Slice Approval
- DNS-pin production path unused until separately authorized real I/O

---

## 28–29. Explicit Statements

```text
Zero real venue calls in ISO1.
No production credentials used.
No real capital moved.
No FIV performed.
No Slice Approval granted.
No production security configuration weakened.
```

---

## 30. SB-07 Status

**ISO1 COMPLETE — implementation-complete for cross-workspace / live-path isolation regression (SB-07).**

---

## STOP

Next: **PO Review of ISO1 evidence.**  
Only after PO Review may the package proceed to a separate **V3-L02 Slice Approval / FIV planning gate**.  
ISO1 does **not** authorize live trading, FIV, or L02 closure.
