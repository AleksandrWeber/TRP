# V3-L02-S-ENV1 — Credential / Environment Separation Implementation Evidence

**Document:** ENV1 implementation evidence  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02  
**Slice:** `L02-S-ENV1` only  
**Nature:** Implementation evidence for PO review. **Not** Slice Approval. **Not** live venue I/O. **Not** FIV.

```text
ENV1 implements SB-06: Vault purpose/env ↔ venue ↔ approved EG1 endpoint class,
fail-closed, no secret leakage. No live adapters, no venue contact, no credential provisioning.
```

---

## 1. Scope

In scope:

- Trusted trading environment taxonomy derived from Vault `purpose` (server-side)
- Fail-closed binding: credential purpose + vault type + workspace ↔ venue ↔ endpoint class
- Integration with EG1 destination policy (`assertLiveVenueEgress`)
- Explicit OKX demo semantics (`trading_demo` + `x-simulated-trading: 1`)
- Paper/Mock retrieval and use denial for trading secrets
- Workspace mismatch denial
- Client-claimed environment escalation denial
- Secret redaction helpers / fixed deny error codes
- Deterministic tests A–R (policy only; zero network)

Out of scope: SB-04 live adapters, SB-07 full suite, submit/cancel/reconcile, DNS pinning, production credentials, C7/S04/HS/UNKNOWN/EM changes.

---

## 2. Repository Reconnaissance

| Area           | Finding                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Vault          | `(workspaceId, type, purpose)` unique slot; AAD includes purpose; `purpose` is Prisma `String` |
| Prior purposes | `trading` \| `notification` \| `ai` — one trading secret per exchange type by default          |
| Connections    | `vaultSecretId` references Vault; no trusted env field on Connection alone                     |
| EG1            | Host allowlist BINANCE/BYBIT/OKX × `live`/`testnet`; Paper/Mock forbidden                      |
| OKX hosts      | Same host `www.okx.com` for live and testnet slots; demo requires header (documented in EG1)   |
| Binance        | `api.binance.com` (live) / `testnet.binance.vision` (testnet)                                  |
| Bybit          | `api.bybit.com` (live) / `api-testnet.bybit.com` (testnet)                                     |
| Paper/Mock     | Paper remains sole `EXECUTION_ADAPTER`; no live secret retrieval path before ENV1              |
| Client env     | No prior trusted trading-env metadata beyond legacy `trading` purpose                          |

No production credentials were present or provisioned. Tests use synthetic metadata only.

---

## 3. Environment Taxonomy

Supported **credential** environments (trusted, from Vault purpose):

| Environment | Vault purpose(s)                   | EG1 host class   | Notes                                                       |
| ----------- | ---------------------------------- | ---------------- | ----------------------------------------------------------- |
| `live`      | `trading` (legacy), `trading_live` | `live`           | Default for exchange types remains LIVE-class               |
| `testnet`   | `trading_testnet`                  | `testnet`        | Binance/Bybit distinct hosts; OKX same host                 |
| `demo`      | `trading_demo`                     | `testnet` (host) | **OKX only**; requires server-side `x-simulated-trading: 1` |

Not collapsed into a single generic `test`. Paper/Mock are **execution modes**, not credential environments — they must not retrieve or use trading credentials.

---

## 4. Credential Metadata Model

Trusted source: **Vault secret purpose** (+ `type` + `workspaceId`), resolved server-side via `isSecretPurpose` / `tradingEnvironmentFromPurpose`.

Client request fields:

- May supply `endpointEnvironment` only as the **server-selected** class that must equal trusted env
- Optional `clientClaimedEnvironment`: if present and ≠ trusted → `client_environment_escalation`
- Cannot convert TESTNET/DEMO → LIVE by request field alone

Prisma: `purpose String` — no migration required; new purpose strings are valid slots under existing unique constraint.

---

## 5. Vault / Connections Boundary

- Credential remains workspace-scoped (`workspace_mismatch` if actor workspace ≠ secret workspace)
- Credential remains venue-scoped via `vaultType` ↔ `LiveVenueId` (`binance`↔BINANCE, etc.)
- Environment/purpose trusted from Vault record
- Binding API returns **no** secret material — only allow/deny + non-sensitive metadata
- Raw secrets never logged; deny messages are fixed codes (`live_credential_environment_denied:<reason>`)

Connections continue to reference `vaultSecretId`; ENV1 does not provision secrets.

---

## 6. Venue Binding

| Vault type | Venue   |
| ---------- | ------- |
| `binance`  | BINANCE |
| `bybit`    | BYBIT   |
| `okx`      | OKX     |

Mismatch → `venue_mismatch`. Unknown venue string → `unknown_venue`. Non-trading purpose → `non_trading_purpose`. Demo on non-OKX → `unsupported_venue_environment`.

---

## 7. Endpoint Binding

Order for future ADP1:

```text
trusted Vault purpose → credentialEnvironment
        ↓
endpointEnvironment must equal credentialEnvironment
        ↓
egressEnvironmentForCredential → EG1 live|testnet
        ↓
assertLiveVenueEgress(targetUrl, venue, egressEnvironment)
        ↓
ALLOW / DENY
```

ENV1 consumes EG1; it does not bypass host allowlisting.

---

## 8. OKX Demo Handling

| Rule                                              | Behavior                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| Demo credentials                                  | Purpose `trading_demo` only                                              |
| Demo vs live                                      | Cross use denied (`environment_mismatch`)                                |
| Host                                              | EG1 `testnet` slot = `www.okx.com` (same as live host)                   |
| Header                                            | ADP1 must apply `x-simulated-trading: 1` from trusted server config only |
| Live + demo header                                | Denied (`okx_demo_header_forbidden_on_live`)                             |
| Demo + wrong/missing header when headers supplied | Denied (`okx_demo_header_required`)                                      |
| Client cannot select demo                         | Demo comes from Vault purpose, not client flags                          |

No live OKX adapter implemented in ENV1.

---

## 9. Paper / Mock Isolation

- `assertMayRetrieveTradingCredential`: paper/mock + any trading purpose → `paper_mock_forbidden`
- `assertLiveCredentialEnvironmentBinding`: paper/mock executionMode → `paper_mock_forbidden`
- Paper execution model unchanged; ENV1 adds the deny gate for future wiring

---

## 10. Workspace Isolation

- Binding requires `trusted.workspaceId === requested.workspaceId`
- Cross-workspace use denied (`workspace_mismatch`)
- Full SB-07 suite not implemented; focused ENV1 Test P only

---

## 11. Logging / Redaction

- `redactCredentialMaterial` strips `api_key` / `api_secret` / `passphrase` / `token` / `Authorization: Bearer …` patterns
- Deny errors use stable reason codes only — no secret echo
- Vault responses are not dumped by this boundary (no retrieve of plaintext in ENV1)

---

## 12. Fail-Closed Matrix

| Credential             | Venue   | Endpoint            | Match | Result |
| ---------------------- | ------- | ------------------- | ----- | ------ |
| LIVE                   | Binance | Binance LIVE        | YES   | ALLOW  |
| TESTNET                | Binance | Binance TESTNET     | YES   | ALLOW  |
| LIVE                   | Binance | Binance TESTNET     | NO    | DENY   |
| TESTNET                | Binance | Binance LIVE        | NO    | DENY   |
| LIVE                   | Bybit   | Bybit LIVE          | YES   | ALLOW  |
| TESTNET                | Bybit   | Bybit TESTNET       | YES   | ALLOW  |
| LIVE                   | Bybit   | Bybit TESTNET       | NO    | DENY   |
| TESTNET                | Bybit   | Bybit LIVE          | NO    | DENY   |
| LIVE                   | OKX     | OKX LIVE            | YES   | ALLOW  |
| DEMO                   | OKX     | OKX DEMO (+ header) | YES   | ALLOW  |
| DEMO                   | OKX     | OKX LIVE            | NO    | DENY   |
| LIVE                   | OKX     | OKX DEMO            | NO    | DENY   |
| UNKNOWN env            | any     | any                 | —     | DENY   |
| Unknown venue          | any     | any                 | —     | DENY   |
| Venue mismatch         | any     | any                 | —     | DENY   |
| Paper/Mock             | any     | any                 | —     | DENY   |
| Cross-workspace        | any     | any                 | —     | DENY   |
| Client TEST→LIVE claim | —       | —                   | —     | DENY   |

---

## 13. Tests

File: `apps/api/src/modules/execution-adapter/live-venue-egress/v3-l02-s-env1-credential-environment.spec.ts`

Command:

```bash
npx vitest run src/modules/execution-adapter/live-venue-egress/v3-l02-s-env1-credential-environment.spec.ts
```

Result (2026-09-17): **24 passed** (A–R + supporting cases). Zero venue/Vault network calls.

Also re-ran EG1 + Vault service/envelope specs: green.

---

## 14. ENV1-01…20 Results

| ID      | Result                                                 |
| ------- | ------------------------------------------------------ |
| ENV1-01 | PASS — purpose from Vault / `SecretPurpose`            |
| ENV1-02 | PASS — vaultType ↔ venue                               |
| ENV1-03 | PASS — workspaceId match required                      |
| ENV1-04 | PASS — LIVE cred + testnet endpoint denied             |
| ENV1-05 | PASS — TESTNET cred + live endpoint denied             |
| ENV1-06 | PASS — unknown endpoint env denied                     |
| ENV1-07 | PASS — unknown venue denied                            |
| ENV1-08 | PASS — venue mismatch denied                           |
| ENV1-09 | PASS — OKX demo explicit purpose + header rules        |
| ENV1-10 | PASS — Paper cannot retrieve/use trading secrets       |
| ENV1-11 | PASS — Mock cannot retrieve/use trading secrets        |
| ENV1-12 | PASS — redaction + fixed deny messages                 |
| ENV1-13 | PASS — clientClaimedEnvironment escalation denied      |
| ENV1-14 | PASS — cross-workspace denied                          |
| ENV1-15 | PASS — calls `assertLiveVenueEgress` when URL supplied |
| ENV1-16 | PASS — no live adapter                                 |
| ENV1-17 | PASS — no live venue request                           |
| ENV1-18 | PASS — no production credentials                       |
| ENV1-19 | PASS — no real capital                                 |
| ENV1-20 | PASS — no FIV                                          |

---

## 15. Residual Risks

- ADP1 must **wire** ENV1 + EG1 before any live HTTP; ENV1 alone is not adapter security
- OKX same-host live/demo relies on purpose + header discipline; mis-wiring header without purpose check is ADP1 risk (ENV1 forbids live+demo-header and demo+live-endpoint)
- DNS pinning still EG1/ADP1 residual
- Legacy `trading` purpose = LIVE; operators storing testnet keys under `trading` would be treated as live — ops must use `trading_testnet` / `trading_demo` slots
- SB-07 full cross-workspace live suite still open

---

## 16. ADP1 Integration Requirements

1. Resolve Vault record by workspace + type + purpose (server-selected purpose for intended env)
2. Call `assertMayRetrieveTradingCredential` before decrypt/retrieve
3. Call `assertLiveCredentialEnvironmentBinding` with trusted metadata + server endpoint class + EG1 URL
4. Apply `okxDemoHeaders` from binding result only (never client-supplied demo mode)
5. Never log Vault plaintext / auth headers
6. Still honor HS1 / UNK1 / C7 / EG1 / EM isolation — ENV1 does not replace them

---

## 17. Explicit No-Live-I/O Statement

```text
ENV1 did not implement live adapters.
ENV1 did not contact Binance, Bybit, or OKX.
ENV1 did not provision production credentials.
ENV1 did not move real capital.
ENV1 did not perform FIV.
ENV1 does not grant V3-L02 Slice Approval.
SB-06 is implementation-complete for credential/environment separation only.
```

---

## STOP

Next step: **PO Review of ENV1 implementation evidence.** Do not proceed to ADP1 or ISO1 from this document alone.
