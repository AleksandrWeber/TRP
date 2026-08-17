# V3-S04-e Architecture Review

**Package:** V3-S04 OWASP & API Hardening
**Slice:** S04-e — Security Platform Close
**Date:** 2026-08-17
**Status:** Slice evidence — pending Product Owner review

## Architecture verdict

**PASS (intent).** S04-e completes the Security Platform under the existing Identity/Auth HTTP extension. No new bounded context. No ownership drift.

## Boundaries preserved

| Domain                    | Owner   | S04-e touch                                                  |
| ------------------------- | ------- | ------------------------------------------------------------ |
| Authentication / sessions | S01     | CSRF guard alignment only                                    |
| Authorization / People    | S02     | Anti-enumeration shapes generic denies; RBAC logic unchanged |
| Vault                     | S03     | Untouched                                                    |
| Audit product             | S05     | Emit-only logs; no audit store/UI                            |
| Isolation suite           | S06     | Untouched                                                    |
| Ledger / Gate / Risk      | Runtime | No bypass introduced                                         |

## New modules (platform-only)

| Module              | Role                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `ssrf-allowlist.ts` | Fail-closed outbound URL validation for future webhook consumers |
| `security-event.ts` | Structured non-secret platform security signals                  |

## Wiring changes

- `sanitizeClientError` applies `shapePlatformDeny` for existence-oracle messages.
- `AuthCsrfGuard` enforces CSRF when the access cookie is present.
- CSRF cookie `Path=/` aligns double-submit with platform routes.
- Production HSTS via helmet policy object.
- Optional logger passed to HTTP hooks from `main.ts` for abuse emit.

## Deviations

None requiring Master Plan revision.

**STOP.** Await Product Owner review before package Close.
