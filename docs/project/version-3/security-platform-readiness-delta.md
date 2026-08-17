# Security Platform Readiness Delta

**Package:** V3-S04 OWASP & API Hardening
**Date:** 2026-08-17
**Status:** Post S04-e — pending Product Owner Close decision

## Delta summary

| Before S04-e                                 | After S04-e                                             |
| -------------------------------------------- | ------------------------------------------------------- |
| SSRF helpers absent                          | `validateOutboundSsrfTarget` shipped with regressions   |
| Anti-enumeration helper only                 | Live deny shaping in `sanitizeClientError`              |
| CSRF skipped when only access cookie present | Guard requires CSRF for any session cookie              |
| CSRF cookie limited to `/v1/auth`            | CSRF cookie `Path=/` for platform routes                |
| HSTS not asserted                            | Production HSTS via helmet policy                       |
| Security events ad hoc                       | Structured emit for abuse/deny (S05 product still open) |
| Verification Standard not executed for S04   | Worksheet completed in S04-e security review            |
| Package Close blocked                        | Close evidence ready for PO review                      |

## Remaining gaps (honest)

| Gap                             | Owner           | Blocks S04 Close?                |
| ------------------------------- | --------------- | -------------------------------- |
| Searchable audit product        | V3-S05          | No (emit foundation sufficient)  |
| Workspace isolation suite       | V3-S06          | No                               |
| Vault Customer Complete UI      | S03 Vault       | No                               |
| Webhook delivery products       | Wave 5/9        | No                               |
| TLS termination HSTS at CDN     | Host            | No if API HSTS evidence accepted |
| Domain-specific admin UX on 404 | S02 incremental | No — platform shape is default   |

## Unblocks

- **V3-S05** Implementation Package may open after PO accepts S04 Close.
- **Wave 1 exit** still requires S05 + S06 Close.

**STOP.** Not a Close claim.
