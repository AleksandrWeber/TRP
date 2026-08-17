# HTTP Security Surface

**Document:** Version 3 HTTP Security Surface
**Date:** 2026-08-17
**Status:** Product Owner view after V3-S04 Close and V3-S06-f route inventory
**Package:** V3-S04 OWASP & API Hardening
**Nature:** Ownership map. S04 is CLOSED; this document supports route inventory cross-reference only.

---

## Surface map

| Surface              | Owner                              | Protection                   | Examples                                                   |
| -------------------- | ---------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| Request body         | Security Platform                  | Body size limits             | Oversized bodies refused                                   |
| Host header          | Security Platform                  | Allowlist                    | Unknown hosts refused                                      |
| Redirects            | Security Platform                  | Redirect validator           | Relative or allowlisted origins only                       |
| Response headers     | Security Platform                  | Disclosure + browser policy  | Banners removed; CSP, HSTS (production), frame denial      |
| Query parameters     | Security Platform                  | HPP foundation               | Conflicting duplicates refused                             |
| Cache                | Security Platform                  | no-store default             | Sensitive replies not cached by default                    |
| Errors               | Security Platform                  | Sanitized + anti-enumeration | Clear errors; existence oracles shaped                     |
| Outbound URLs        | Security Platform                  | SSRF allowlist foundation    | Internal/metadata targets blocked for future webhooks      |
| Repeated traffic     | Security Platform                  | Platform + sensitive quotas  | Temporary refusal with honest retry message                |
| Cookie mutations     | Authentication + Security Platform | CSRF double-submit           | SameSite=Strict + CSRF header when session cookies present |
| Sign-in and sessions | Authentication                     | Session policy               | Login, refresh, recovery, lockout                          |
| Roles and People     | Authorization                      | Permission checks            | Role assignment and People                                 |
| Vendor secrets       | Vault                              | Encrypted ownership          | Store and retrieve                                         |

---

## Protected today (S04 complete)

- Oversized requests refused
- Unknown hosts refused
- Unsafe redirects refused
- Conflicting query values refused
- Errors sanitized; existence oracles shaped to **Access denied**
- Technology banners removed
- Browser CSP, frame denial, nosniff, referrer/permissions policies
- Production HSTS on API responses
- Abuse quotas on general and sensitive routes
- CSRF enforced for cookie-authenticated mutations platform-wide
- SSRF allowlist helpers for later integrations

No customer security-settings page required.

---

## Explicitly not claimed

| Surface                                            | Owner                                         |
| -------------------------------------------------- | --------------------------------------------- |
| Searchable audit product (full customer UI/export) | Later waves — S05 shipped timeline foundation |
| Isolation suite Close                              | V3-S06 — evidence aligned; not CLOSED         |
| Webhook delivery                                   | Wave 5/9                                      |
| Connections / exchanges                            | Wave 2+                                       |
| Vault Customer Complete UI                         | S03 Vault                                     |
| Live trading                                       | Later waves                                   |

---

## Wave 1 place (honest)

**V3-S04 is CLOSED.** Wave 1 exit requires S06 Close and the independent Wave 1
Certification Audit. Route→owner cross-reference:
[`wave-1-security-route-ownership-inventory.md`](./wave-1-security-route-ownership-inventory.md).

**STOP.** Do not claim V3-S06 CLOSED from this map.
