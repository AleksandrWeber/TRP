# FIV-CONN-03 Slice Approval

**Document:** FIV-CONN-03 Product Owner / Chief Architect Slice Approval
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-03 — Connection API/Domain Contract
**Authority:** Product Owner / Chief Architect
**Nature:** Formal **SLICE APPROVAL GATE**. Authorizes implementation of **FIV-CONN-03 only**, within frozen decisions and mandatory Architecture/Security conditions. Does **not** authorize FIV-CONN-04, FIV-CONN-05, FIV, venue I/O, C7 changes, capital movement, or `allowRealVenueIo=true`. Does **not** implement FIV-CONN-03 in this act.

**Basis artifacts:**

| Artifact            | Path                                                                                                             | Status / Commit                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Planning Package    | [`v3-l02-fiv-conn-03-planning-package.md`](./v3-l02-fiv-conn-03-planning-package.md)                             | COMPLETE                                                          |
| Planning Review     | [`v3-l02-fiv-conn-03-planning-review.md`](./v3-l02-fiv-conn-03-planning-review.md)                               | PASS WITH REQUIRED PO DECISIONS                                   |
| Decision Support    | [`v3-l02-fiv-conn-03-po-governance-decision-support.md`](./v3-l02-fiv-conn-03-po-governance-decision-support.md) | COMPLETE — all five FROZEN                                        |
| Decision Freeze     | [`v3-l02-fiv-conn-03-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-03-po-governance-decision-freeze.md)   | COMPLETE — all five FROZEN                                        |
| Architecture Review | [`v3-l02-fiv-conn-03-architecture-review.md`](./v3-l02-fiv-conn-03-architecture-review.md)                       | PASS WITH CONDITIONS — `82e11699eba842e942852ad51574ee3f72d70693` |
| Security Review     | [`v3-l02-fiv-conn-03-security-review.md`](./v3-l02-fiv-conn-03-security-review.md)                               | PASS WITH CONDITIONS — `ff67d80f937ccec583340fb74388b6f78640b1c1` |
| FIV-CONN-01 Closure | [`v3-l02-fiv-conn-01-closure.md`](./v3-l02-fiv-conn-01-closure.md)                                               | CLOSED                                                            |
| FIV-CONN-02 Closure | [`v3-l02-fiv-conn-02-closure.md`](./v3-l02-fiv-conn-02-closure.md)                                               | CLOSED                                                            |

**Repository baseline (approval start):** `ff67d80f937ccec583340fb74388b6f78640b1c1` (`HEAD == origin/main`)

```text
FIV-CONN-03 SLICE APPROVAL = GRANTED
IMPLEMENTATION AUTHORIZATION = GRANTED — FIV-CONN-03 ONLY
FIV-CONN-04 / FIV-CONN-05 / FIV / EXTERNAL I/O / C7 = NOT AUTHORIZED
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## Governance State

```text
FIV-CRED-01:
CLOSED

FIV-CONN-01:
CLOSED

FIV-CONN-02:
CLOSED

FIV-CONN-03 Planning Review:
PASS WITH REQUIRED PO DECISIONS

FIV-CONN-03 Architecture Review:
PASS WITH CONDITIONS

FIV-CONN-03 Security Review:
PASS WITH CONDITIONS
```

Blocking Architecture issues: **NONE**
Blocking Security issues: **NONE**

---

## Frozen Decisions

```text
D-CONN-03-01:
APPROVED / FROZEN — OPTION A
  Server derives Vault SecretPurpose from trusted Connection.environment
  and propagates it through validate → handshake → capability.
  Forbidden: provider-only lookup; omit-purpose retrieval;
  client-controlled purpose; fallback; sibling-secret substitution.

D-CONN-03-02:
APPROVED / FROZEN — OPTION A
  LIVE-class acceptance: { Trading, TradingLive }
  TESTNET-class acceptance: { TradingTestnet }
  Acceptance classes ONLY — NOT search order.
  Runtime credential resolution remains anchored to Connection.vaultSecretId.
  Forbidden: purpose fallback; first-match; sibling substitution; ambient cascade.

D-CONN-03-03:
APPROVED / FROZEN — OPTION B
  EXCHANGE + environment NULL → FAIL CLOSED before Vault credential use.
  NULL ≠ LIVE. No omit-purpose Trading retrieval. No backfill in CONN-03.

D-CONN-03-04:
APPROVED / FROZEN — OPTION A
  Actual Vault SecretPurpose MUST be verified against expected purpose
  derived from Connection.environment before credential use.
  Shared governed helper MUST serve handshake and capability.

D-CONN-03-05:
APPROVED / FROZEN — OPTION A
  SecretPurpose is NEVER client-authoritative.
  Purpose is derived server-side from trusted Connection context.
```

Frozen decisions were **not** reopened by this approval.

---

## Architecture Conditions

```text
C-01…C-07:
MANDATORY
```

| ID   | Condition                                         |
| ---- | ------------------------------------------------- |
| C-01 | Id-anchored LIVE dual-purpose under slot Vault    |
| C-02 | Shared Model C / purpose-validation helper        |
| C-03 | No capability-independent credential architecture |
| C-04 | Client purpose non-authoritative / defensive      |
| C-05 | NULL EXCHANGE fail-closed before Vault use        |
| C-06 | No Vault / SecretPurpose / ENV1 redesign          |
| C-07 | Conflict probe ≠ ambient credential cascade       |

---

## Security Conditions

```text
SC-01…SC-10:
MANDATORY
```

| ID    | Condition                                                         |
| ----- | ----------------------------------------------------------------- |
| SC-01 | Eliminate omit-purpose credential resolution on EXCHANGE USE path |
| SC-02 | Shared Model C / purpose validation before credential use         |
| SC-03 | No capability-independent credential architecture                 |
| SC-04 | Id-anchored LIVE dual-purpose — no sibling search / fallback      |
| SC-05 | NULL EXCHANGE fail-closed before Vault use                        |
| SC-06 | Use-time Model C — actual purpose required; mismatch FAIL CLOSED  |
| SC-07 | Client purpose non-authoritative                                  |
| SC-08 | Workspace-scoped credential use                                   |
| SC-09 | Mandatory Security Regression Matrix Cases 01–18                  |
| SC-10 | Revoke / missing credential → DENY; no sibling substitution       |

---

## Slice Scope

Implementation authorization is **LIMITED** to FIV-CONN-03:

1. Purpose-aware Vault retrieval for EXCHANGE validation
2. Purpose propagation from trusted `Connection.environment`
3. Model C expected-vs-actual purpose validation
4. Exact `vaultSecretId` anchoring
5. Handshake integration
6. Capability integration
7. NULL EXCHANGE fail-closed
8. Client-purpose non-authority enforcement
9. Workspace-scoped credential use
10. Security regression tests required by SC-09
11. Tests required to prove SC-01…SC-10

If implementation discovers a requirement outside this frozen scope:

```text
STOP.
Do not expand scope.
Return to PO/Governance for a new decision.
```

---

## Explicit Non-Scope

**NOT AUTHORIZED** by this approval:

- FIV-CONN-04 (LIVE backfill / duplicate cleanup / ambiguous Connection resolution)
- FIV-CONN-05 (UI Testnet / UI credential management)
- Origin management
- Vault redesign / SecretPurpose redesign / ENV1 redesign / EG1 redesign
- Connection schema redesign / uniqueness redesign
- Binance / Bybit / OKX integration work beyond existing handshake/capability adapters already in-repo
- Venue I/O / order submission / cancellation / reconciliation
- FIV
- C7 changes / `allowRealVenueIo=true`
- Credential creation / rotation as a slice goal
- Real capital / production venue calls
- Live-capital activation

FIV-CONN-04 remains authoritative for backfill/cleanup.
FIV-CONN-05 remains authoritative for UI Testnet flows.

---

## Acceptance Gates

Implementation is acceptable only if **all** of the following hold:

1. D-CONN-03-01…05 remain satisfied (not reinterpreted)
2. C-01…C-07 satisfied
3. SC-01…SC-10 satisfied
4. Omit-purpose EXCHANGE handshake/capability credential USE eliminated
5. `metadata.id === Connection.vaultSecretId` before credential use
6. Model C fail-closed on environment ↔ actual SecretPurpose mismatch
7. EXCHANGE + NULL fails closed before Vault credential use
8. Client cannot authoritatively select SecretPurpose
9. Workspace isolation preserved
10. Environment isolation preserved (no cross-environment fallback)
11. No sibling-secret substitution / provider-only lookup / ambient cascade
12. Safety boundary unchanged (C7 DENY-ALL; `allowRealVenueIo=false`; no FIV; no capital)
13. Security Regression Matrix Cases 01–18 green

---

## Security Regression Matrix

```text
Cases 01–18:
MANDATORY
```

| Case | Scenario                    | Required              |
| ---- | --------------------------- | --------------------- |
| 01   | LIVE + Trading              | ALLOW (id-matched)    |
| 02   | LIVE + TradingLive          | ALLOW (id-matched)    |
| 03   | LIVE + TradingTestnet       | DENY                  |
| 04   | TESTNET + Trading           | DENY                  |
| 05   | TESTNET + TradingLive       | DENY                  |
| 06   | TESTNET + TradingTestnet    | ALLOW                 |
| 07   | EXCHANGE + NULL             | DENY before Vault use |
| 08   | wrong workspace             | DENY                  |
| 09   | wrong provider              | DENY                  |
| 10   | wrong vaultSecretId         | DENY                  |
| 11   | provider-only lookup        | DENY / impossible     |
| 12   | sibling-secret substitution | DENY / impossible     |
| 13   | client purpose injection    | NOT AUTHORITATIVE     |
| 14   | handshake without Model C   | DENY                  |
| 15   | capability without Model C  | DENY                  |
| 16   | purpose mismatch            | DENY                  |
| 17   | cross-environment fallback  | DENY                  |
| 18   | credential leakage          | DENY                  |

---

## PO/Governance Decision

```text
FIV-CONN-03 SLICE APPROVAL:
GRANTED

IMPLEMENTATION AUTHORIZATION:
GRANTED

Scope:
FIV-CONN-03 ONLY

Mandatory gates:
C-01…C-07
SC-01…SC-10
D-CONN-03-01…05 (frozen)

FIV-CONN-04:
NOT AUTHORIZED

FIV-CONN-05:
NOT AUTHORIZED

FIV:
NOT AUTHORIZED

External venue I/O:
NOT AUTHORIZED

C7 / allowRealVenueIo:
NOT AUTHORIZED TO CHANGE
```

---

## Safety Boundary

```text
C7:
DENY-ALL

allowRealVenueIo:
FALSE

External I/O:
ZERO

Binance:
ZERO

Bybit:
ZERO

OKX:
ZERO

FIV:
NOT PERFORMED

Capital:
ZERO

Vault secrets:
NOT exposed

Credentials:
NOT modified by this approval act
```

This approval does **not** authorize enabling C7, `allowRealVenueIo`, FIV, or capital movement during or after implementation.

---

## Implementation State (this act)

```text
Implementation:
NOT PERFORMED IN THIS TASK

Production code:
NOT MODIFIED

Tests:
NOT MODIFIED

Schema / migrations:
NOT MODIFIED

Vault / credentials:
NOT MODIFIED
```

---

## Protected Work

```text
Protected leftovers:
UNTOUCHED
```

---

## Next Gate

```text
FIV-CONN-03 IMPLEMENTATION
```

After implementation:

```text
PO REVIEW
→ CLOSURE
```

---

**END OF FIV-CONN-03 SLICE APPROVAL**
