# FIV-CONN-03 Planning Review

**Document:** FIV-CONN-03 Connection API/Domain Contract — Planning Review
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-03 — Connection API/Domain Contract
**Authority:** Planning Review / Architecture Governance (under PO + Chief Architect)
**Nature:** **REVIEW ONLY.** Does **not** authorize implementation. Does **not** freeze D-CONN-03 decisions. Does **not** grant Architecture/Security/PO Planning Approval. Does **not** create Slice Approval. Does **not** modify production code, schema, migrations, Vault, credentials, or protected leftovers.

```text
Planning package:
docs/project/version-3/wave-6/v3-l02-fiv-conn-03-planning-package.md

Planning commit:
b43e7eedaeeced48585111ea9dfdeb345ca2e071

Planning status:
COMPLETE

Review decision:
PASS WITH REQUIRED PO DECISIONS

Implementation:
NOT PERFORMED

Implementation authorization:
NOT GRANTED

Next gate:
FIV-CONN-03 ARCHITECTURE REVIEW / REQUIRED PO DECISIONS
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Pre-check

| Check                 | Result                                     |
| --------------------- | ------------------------------------------ |
| `HEAD`                | `b43e7eedaeeced48585111ea9dfdeb345ca2e071` |
| `origin/main`         | `b43e7eedaeeced48585111ea9dfdeb345ca2e071` |
| `HEAD == origin/main` | **YES**                                    |
| Expected planning tip | **MATCH**                                  |

### Working-tree leftovers (protected — untouched)

```text
 M apps/api/src/composition/live-admission-gate-ports.module.spec.ts
 M docs/project/technical-debt.md
 M docs/project/version-3/wave-5/wave-5-progress.md
?? apps/api/src/modules/notification-delivery/production-telegram-operator-test-message.spec.ts
?? docs/project/technical-debt 2.md
?? docs/project/version-3/next-wave-planning-package-proposal.md
?? docs/project/version-3/wave-5/... (wave-5 leftovers)
?? docs/project/version-3/wave-6/d-gov-01-adr-l01-sequencing-decision-brief.md
?? docs/project/version-3/wave-6/d-gov-04-adr-authority-decision-brief.md
?? docs/project/version-3/wave-6/wave-6-planning-revalidation.md
```

---

## 2. Authoritative chain reviewed

| Artifact                                                | Status                                |
| ------------------------------------------------------- | ------------------------------------- |
| `v3-l02-fiv-cred-02-planning-package.md`                | COMPLETE                              |
| `v3-l02-fiv-cred-02-architecture-review.md`             | PASS WITH CONDITIONS                  |
| `v3-l02-fiv-cred-02-security-review.md`                 | PASS WITH CONDITIONS                  |
| `v3-l02-fiv-cred-02-po-governance-decision-freeze.md`   | COMPLETE — Model C / D-CRED-02 frozen |
| `v3-l02-fiv-cred-02-po-governance-planning-approval.md` | GRANTED                               |
| `v3-l02-fiv-conn-01-closure.md`                         | CLOSED                                |
| `v3-l02-fiv-conn-02-closure.md`                         | CLOSED                                |
| `v3-l02-fiv-conn-03-planning-package.md`                | COMPLETE (under review)               |

Frozen **D-CRED-02-01…14** were **not** reopened by this review.

---

## 3. Independent repository verification (residual hazard)

Planning claim under review:

```text
Omit-purpose handshake/capability retrieve defaults to trading while
CONN-02 stores:
  LIVE    → trading_live
  TESTNET → trading_testnet
```

### Verified FACTS

| Claim                                              | Evidence                                                                                                                               | Verdict       |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Populated LIVE store purpose = `TradingLive`       | `vaultPurposeForConnection` → `purposeForTradingEnvironment('live')` → `SecretPurpose.TradingLive` (`connections.service.ts`)          | **CONFIRMED** |
| Populated TESTNET store purpose = `TradingTestnet` | same helper for `'testnet'`                                                                                                            | **CONFIRMED** |
| Handshake Vault get/retrieve omits purpose         | `exchange-handshake.service.ts` `execute()` calls `vault.get` / `vault.retrieve` with `{ workspaceId, type, … }` only — **no purpose** | **CONFIRMED** |
| Capability Vault get/retrieve omits purpose        | `exchange-capability.service.ts` same pattern                                                                                          | **CONFIRMED** |
| EXCHANGE validate does not pass purpose            | `completeExchangeHandshake` passes `workspaceId/provider/vaultSecretId` only                                                           | **CONFIRMED** |
| Omit-purpose defaults to `trading`                 | `SecretVaultService.resolvePurpose` → `defaultPurposeForType(exchange)` → `SecretPurpose.Trading`                                      | **CONFIRMED** |
| Model C mismatch not enforced in Connections       | no `tradingEnvironmentFromPurpose` usage under `connections/`                                                                          | **CONFIRMED** |
| LIVE-class ENV1 mapping                            | `trading`/`trading_live` → `live`; `trading_testnet` → `testnet`                                                                       | **CONFIRMED** |

**Residual blocker is real.** Planning purpose is accurate and repository-aligned.

---

## 4. Review answers (mandatory)

| #   | Question                                              | Answer                                                                  |
| --- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Problem statement accurate?                           | **YES** — independently confirmed                                       |
| 2   | Distinct from CONN-01/02?                             | **YES** — residual validate/handshake/capability + mismatch only        |
| 3   | Scope minimal and coherent?                           | **YES** — wiring + mismatch; no redesign                                |
| 4   | Boundaries CRED-04/05 / CONN-04/05 clear?             | **YES**                                                                 |
| 5   | Security implications identified?                     | **YES** — C-06 / cross-env retrieve / dual LIVE / NULL / client purpose |
| 6   | Five PO decisions sufficiently defined?               | **YES** — open, bounded, PO-mandatory; not decided here                 |
| 7   | ACs testable?                                         | **YES** (18/18 PASS as reviewable criteria)                             |
| 8   | SCs testable?                                         | **YES** (12/12 PASS as reviewable criteria)                             |
| 9   | Compatible with frozen governance?                    | **YES** — Model C / D-CRED-02 preserved                                 |
| 10  | Architecture/Security/PO decision review can proceed? | **YES**, with D-CONN-03-01…05 still required before implementation      |

---

## 5. Purpose

```text
Purpose:
Complete residual Connection API/domain contract —
purpose-aware Vault retrieve on EXCHANGE validate → handshake → capability,
plus Model C Connection.environment ↔ Vault purpose FAIL CLOSED.
```

Does **not** re-implement CONN-01 environment model or CONN-02 Strategy B / minimum store-path purpose pass-through.

---

## 6. Current residual blocker

```text
Current residual blocker:
EXCHANGE validate path still omit-purpose retrieves Vault purpose trading,
while CONN-02 stores populated-env credentials under trading_live (LIVE)
and trading_testnet (TESTNET). Model C mismatch enforcement is absent on
Connections bind/validate paths.
```

---

## 7. CONN-01 / CONN-02 boundary

| Boundary             | Result   | Notes                                                                                                                                                                         |
| -------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CONN-01 boundary** | **PASS** | Package correctly treats create-requires-env / environment model as CLOSED; does not propose re-delivery                                                                      |
| **CONN-02 boundary** | **PASS** | Package correctly treats Strategy B + Connections-owned store/replace/revoke purpose pass-through as CLOSED; residual is handshake/capability validate path + mismatch matrix |

**Overlap flagged:** Parent CRED-02 one-liner historically attributed create-requires-env and store purpose-awareness to CONN-03. Package explicitly de-duplicates that against repository evidence. **Acceptable refinement** — not a blocker.

---

## 8. Model C

```text
Model C:
PASS
```

Consistent with frozen FIV-CRED-02:

```text
Vault purpose = runtime SoT
Connection.environment = constraint / audit
Mismatch = FAIL CLOSED
```

Proposed mismatch rule uses `tradingEnvironmentFromPurpose(purpose) === connection.environment` (not naive purpose-string equality). That preserves LIVE-class allowance for `Trading` **and** `TradingLive` without allowing Testnet.

**Dual-purpose LIVE bound:** D-CONN-03-02 options A/B/C are confined to LIVE-class purposes. Package explicitly rejects Testnet fallback. No “try until one works across environments” design is proposed.

**REQUIRED CLARIFICATION remains only as an open PO decision (D-CONN-03-02), not as Model C failure.**

---

## 9. D-CONN-03-01…05 review

This review does **not** decide these questions.

| Decision                                 | Status                           | Package quality                                                                                                                                                             |
| ---------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-CONN-03-01** handshake strategy      | **OPEN / READY FOR PO DECISION** | Clear question; Options A/B/C; security + architecture consequences; compatible with C-06 / D-CRED-02-08; PO mandatory                                                      |
| **D-CONN-03-02** LIVE dual-purpose       | **OPEN / READY FOR PO DECISION** | HIGH-RISK but bounded to LIVE-class; id-match options prevent ambient fallback; no LIVE↔TESTNET fallback proposed; PO mandatory                                             |
| **D-CONN-03-03** NULL-env validate       | **OPEN / READY FOR PO DECISION** | Explicitly rejects silent NULL→LIVE (Option C rejected); A/B remain for PO; NULL ≠ LIVE preserved; PO mandatory                                                             |
| **D-CONN-03-04** mismatch timing         | **OPEN / READY FOR PO DECISION** | Options at path granularity (store/replace/validate); Architecture Review should refine before-vs-after retrieve within chosen paths — not a planning blocker; PO mandatory |
| **D-CONN-03-05** client-supplied purpose | **OPEN / READY FOR PO DECISION** | Recommended never; Option B rejected as tampering; PO mandatory affirm                                                                                                      |

```text
D-CONN-03-01: OPEN / READY FOR PO DECISION
D-CONN-03-02: OPEN / READY FOR PO DECISION
D-CONN-03-03: OPEN / READY FOR PO DECISION
D-CONN-03-04: OPEN / READY FOR PO DECISION
D-CONN-03-05: OPEN / READY FOR PO DECISION
```

---

## 10. Handshake / dual-purpose / NULL / mismatch / client purpose

### Handshake strategy

Package defines:

- environment → expected purpose via existing ENV1 helpers
- derivation server-side from Connection row
- pass into handshake/capability internal requests
- forbid provider-only retrieve when env populated
- fail-closed / interim deny options
- LIVE/TESTNET isolation via purpose class

Client cannot choose Vault purpose (D-CONN-03-05).

### LIVE dual-purpose (HIGH-RISK)

Package does **not** authorize:

- accept any LIVE secret for any environment
- Trading → TradingLive → TradingTestnet cascade
- fallback until one credential works across env classes

Bounded LIVE-class dual-purpose remains a **PO decision**, not an implementation instruction.

### NULL environment

Package preserves **NULL ≠ LIVE**. Option C (treat NULL as live) is rejected. A or B remain PO-governed.

### Mismatch timing

Enforcement points are decision-gated by D-CONN-03-04 (store + replace + validate/retrieve preferred). Sufficient for Architecture/Security to evaluate; finer before/after-retrieve sequencing can be specified in Architecture Review without reopening planning purpose.

### Client-supplied purpose

**Forbidden** by design intent (D-CONN-03-05 Option A). Credential-selection authority must remain server-derived.

---

## 11. API / domain contract

Package distinguishes:

| Path                                 | Purpose treatment in plan                                               |
| ------------------------------------ | ----------------------------------------------------------------------- |
| validate (Connections orchestration) | Must pass purpose context / deny                                        |
| handshake                            | Must purpose-aware retrieve (or interim deny)                           |
| capability                           | Same purpose policy as handshake                                        |
| store/replace/revoke                 | Already purpose-aware (CONN-02); mismatch may be added per D-CONN-03-04 |

Error/fail-closed semantics are present at AC/SC level without inventing a new error framework.

---

## 12. Acceptance criteria review

| AC    | Review                                                   |
| ----- | -------------------------------------------------------- |
| AC-01 | **PASS** — objectively testable once D-CONN-03-01 frozen |
| AC-02 | **PASS**                                                 |
| AC-03 | **PASS** — security-critical; testable                   |
| AC-04 | **PASS**                                                 |
| AC-05 | **PASS** — testable against frozen D-CONN-03-04 paths    |
| AC-06 | **PASS**                                                 |
| AC-07 | **PASS** — decision-gated, still objectively verifiable  |
| AC-08 | **PASS** — decision-gated; forbids Testnet fallback      |
| AC-09 | **PASS**                                                 |
| AC-10 | **PASS**                                                 |
| AC-11 | **PASS**                                                 |
| AC-12 | **PASS**                                                 |
| AC-13 | **PASS**                                                 |
| AC-14 | **PASS** — regression                                    |
| AC-15 | **PASS** — scope lock                                    |
| AC-16 | **PASS**                                                 |
| AC-17 | **PASS**                                                 |
| AC-18 | **PASS**                                                 |

```text
Acceptance criteria:
18/18 REVIEWED
18/18 PASS
```

---

## 13. Security criteria review

| SC    | Review                                       |
| ----- | -------------------------------------------- |
| SC-01 | **PASS**                                     |
| SC-02 | **PASS**                                     |
| SC-03 | **PASS** — allows interim deny alternative   |
| SC-04 | **PASS**                                     |
| SC-05 | **PASS**                                     |
| SC-06 | **PASS**                                     |
| SC-07 | **PASS** — CRED-04 origin boundary preserved |
| SC-08 | **PASS**                                     |
| SC-09 | **PASS**                                     |
| SC-10 | **PASS**                                     |
| SC-11 | **PASS**                                     |
| SC-12 | **PASS**                                     |

```text
Security criteria:
12/12 REVIEWED
12/12 PASS
```

---

## 14. Test strategy

```text
Test strategy:
PASS WITH CONDITIONS
```

Covers LIVE+Trading / LIVE+TradingLive / TESTNET+TradingTestnet / LIVE↔TESTNET mismatch / workspace isolation / NULL policy / client purpose absence / validate+handshake+capability / fail-closed / secret non-exposure / CONN-01/02 regression / no venue I/O.

**Conditions for Architecture/Security:**

- Explicit provider-mismatch case should remain asserted via CONN-02 uniqueness regressions (package relies on that retention).
- Exact dual-purpose probe order tests depend on D-CONN-03-02 freeze.
- No external venue calls permitted (package correctly requires mocks).

Not a planning blocker.

---

## 15. Architecture / Security readiness

```text
Architecture readiness:
PASS WITH CONDITIONS

Security readiness:
PASS WITH CONDITIONS
```

**Conditions:** D-CONN-03-01…05 must be frozen before Slice Approval / implementation. Architecture Review should specify exact internal request fields and before/after-retrieve mismatch sequencing within the PO-chosen path set. Security Review must evaluate the frozen dual-purpose and NULL policies as HIGH-RISK items.

Architecture/Security/PO decision work **may proceed**.

---

## 16. Scope boundaries

| Boundary                          | Result                               |
| --------------------------------- | ------------------------------------ |
| **Scope**                         | **PASS**                             |
| **CRED-04** (origins)             | **PASS** — excluded; dependency only |
| **CRED-05** (UI Testnet flow)     | **PASS** — API-first; UI deferred    |
| **CONN-04** (backfill / NOT NULL) | **PASS** — no migration assumed      |
| **CONN-05** (full matrix)         | **PASS** — residual tests only       |

Schema/migration/Vault redesign assumptions:

```text
Schema changes: NONE — plausible (wiring only)
Migrations:     NONE — plausible
Vault changes:  NONE — plausible
```

If implementation discovers otherwise → STOP / return to PO (package already states this).

---

## 17. External I/O / capital / controls

```text
External I/O:         ZERO
Binance calls:        ZERO
Bybit calls:          ZERO
OKX calls:            ZERO
FIV:                  NOT PERFORMED
Capital movement:     ZERO
C7:                   DENY-ALL
allowRealVenueIo:     FALSE
Protected leftovers:  UNTOUCHED
```

Review performed documentation + read-only repository inspection only.

---

## 18. Formal Planning Review decision

```text
FIV-CONN-03 PLANNING REVIEW = PASS WITH REQUIRED PO DECISIONS
```

Granted because:

1. Residual purpose and hazard are repository-confirmed.
2. CONN-01/02 boundaries are clean.
3. Model C is preserved (not weakened).
4. Scope vs CRED-04/05 and CONN-04/05 is explicit.
5. ACs/SCs are objectively reviewable and in-scope.
6. Five PO decisions are sufficiently defined to proceed to Architecture/Security/PO freeze work.

**Not granted:** implementation authorization, Slice Approval, decision freeze outcomes, or resolution of D-CONN-03-01…05.

---

## 19. Next gate

```text
Next gate:
FIV-CONN-03 ARCHITECTURE REVIEW / REQUIRED PO DECISIONS

Gate chain remaining before implementation:
Architecture Review
→ Security Review
→ PO/Governance Decision Freeze (D-CONN-03-01…05)
→ PO/Governance Planning Approval
→ Slice Approval
→ Implementation
```

```text
Implementation authorization:
NOT GRANTED
```

---

## Safety confirmations (this review act)

| Confirmation                                                     | Status |
| ---------------------------------------------------------------- | ------ |
| No production code / tests / schema / migration / Vault modified | YES    |
| No LIVE backfill / duplicate cleanup / FIV / venue I/O           | YES    |
| No credentials / secrets modified or exposed                     | YES    |
| Planning package unmodified                                      | YES    |
| Protected leftovers untouched                                    | YES    |
| Only this review artifact created                                | YES    |
| D-CONN-03 decisions not silently decided                         | YES    |
| Implementation not authorized                                    | YES    |

---

**END OF FIV-CONN-03 PLANNING REVIEW**
