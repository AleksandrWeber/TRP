# V3-L02-S-EG1 — Live Venue Egress Security Boundary Implementation Evidence

**Document:** EG1 implementation evidence  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02  
**Slice:** `L02-S-EG1` only  
**Nature:** Implementation evidence for PO review. **Not** Slice Approval. **Not** live venue I/O. **Not** FIV.

```text
EG1 implements the SB-01 SSRF / outbound egress security boundary for future live adapters.
No live adapter, submit, cancel, reconcile, credentials, or venue network calls.
```

---

## 1. Scope

In scope:

- Trusted build-time allowlist for BINANCE / BYBIT / OKX (`live` + `testnet` hosts)
- Fail-closed destination policy (HTTPS, port 443, exact host, no userinfo)
- Redirect Location validation + HTTP client `redirect: 'error'`
- Optional DNS resolve → deny non-public IPs (reuses `isNonPublicOutboundIp`)
- Paper/Mock isolation (`paper_mock_forbidden`)
- `LiveVenueEgressHttpClient` for future ADP1 (not bound to Paper)
- Focused security tests A–R (+ DNS / client)

Out of scope: SB-04 adapters, SB-06 creds, SB-07 suite, submit/cancel/reconcile, Vault, C7/S04 changes.

---

## 2. Repository Reconnaissance

- Reused `validateOutboundSsrfTarget` + `isNonPublicOutboundIp` from security-platform
- Pattern mirrored Telegram fixed-origin egress (`assertTelegramBotApiEgress`, `redirect: 'error'`)
- Binance handshake remains separate (`api.binance.com`); handshake ≠ authorization; not rewritten in EG1
- `PaperExecutionAdapter` remains sole `EXECUTION_ADAPTER` binding

---

## 3. Egress Architecture

```text
Future live ExecutionAdapterPort
        ↓
 buildLiveVenueRequestUrl / assertLiveVenueEgress
        ↓
 assertLiveVenueEgressWithDns (optional)
        ↓
 LiveVenueEgressHttpClient (redirect: 'error')
        ↓
 approved venue HTTPS endpoint
```

Location: `apps/api/src/modules/execution-adapter/live-venue-egress/`

---

## 4. Venue Allowlist

| Venue | live | testnet |
| ----- | ---- | ------- |
| BINANCE | `api.binance.com` | `testnet.binance.vision` |
| BYBIT | `api.bybit.com` | `api-testnet.bybit.com` |
| OKX | `www.okx.com` | `www.okx.com` (demo header is ENV1 concern) |

Hosts are application constants — not workspace/user Connection URLs.

---

## 5. URL Validation

- HTTPS only; HTTP → `https_required`
- Exact hostname match against venue allowlist (no substring / suffix tricks)
- Port must be 443 (explicit or default)
- Userinfo / `@` → `userinfo_forbidden`
- Malformed / missing → fail closed
- Paths only via relative `pathAndQuery` starting with `/`

---

## 6. DNS / IP Security

- Syntactic SSRF blocks loopback/private/link-local literal hosts
- `assertLiveVenueEgressWithDns` resolves via injectable resolver and denies non-public IPs
- **Residual:** without connection-level DNS pinning (Web Push style agent), rebinding remains possible between resolve and connect — ADP1 should adopt pinned lookup when performing real I/O

---

## 7. Redirect Handling

- `LiveVenueEgressHttpClient` always sets `redirect: 'error'` (never follows)
- `assertLiveVenueRedirectTarget` rejects attacker hosts and HTTP Locations

---

## 8. User-Input Analysis

| Input | Can set live destination? |
| ----- | ------------------------- |
| Request body / query / headers | **No** — policy takes venue id + relative path only |
| Workspace config / Connection URL | **No** — Connections have no venue URL; allowlist is build-time |
| Free-form absolute URL | **Rejected** (`rejectUserControlledLiveDestination` / `path_forbidden`) |

---

## 9–10. Environment / Paper-Mock

- `executionMode: 'paper' | 'mock'` → always deny
- `environment: 'live' | 'testnet'` selects host set; cross-env host mismatch fails
- Missing/invalid venue or environment fails closed

---

## 11. Tests

```bash
cd apps/api && pnpm exec vitest run src/modules/execution-adapter/live-venue-egress
```

**Result:** 1 file, **23/23 passed**. No real venue calls.

---

## 12. EG1-01…18

| ID | Result |
| -- | ------ |
| EG1-01 Approved venues only | **PASS** |
| EG1-02 HTTPS mandatory | **PASS** |
| EG1-03 Arbitrary hosts rejected | **PASS** |
| EG1-04 Userinfo / hostname tricks | **PASS** |
| EG1-05 Disallowed ports | **PASS** |
| EG1-06 Private/loopback/link-local | **PASS** |
| EG1-07 Redirect escape prevented | **PASS** |
| EG1-08 User-controlled destination | **PASS** |
| EG1-09 Missing/invalid config | **PASS** |
| EG1-10 Unknown venue | **PASS** |
| EG1-11 Paper/Mock isolation | **PASS** |
| EG1-12 Available for future adapters | **PASS** |
| EG1-13 No C7/S04 change | **PASS** |
| EG1-14 No EmergencyManager | **PASS** |
| EG1-15 No live adapter | **PASS** |
| EG1-16 No real venue request | **PASS** |
| EG1-17 No credentials | **PASS** |
| EG1-18 No capital | **PASS** |

---

## 13. Residual Risks / ADP1 Requirements

1. Wire live adapters exclusively through `LiveVenueEgressHttpClient` / policy
2. Prefer DNS-pinned agent (Web Push pattern) for rebind resistance on real I/O
3. SB-06 must bind testnet vs live credentials to matching allowlist environment
4. Do not promote handshake connectivity to live order authorization
5. OKX demo/live share host — ENV1/header separation still required

---

## 14. Explicit Statement

**No live venue I/O occurred.** Tests used pure policy checks and mocked DNS/fetch only. No production credentials. No FIV. No Slice Approval.

---

## 15. SB-01 Status

**SB-01 — implementation-complete for the approved egress security boundary.**

Does **not** claim live adapters secure, live trading secure, Security PASS, or Slice Approval.
