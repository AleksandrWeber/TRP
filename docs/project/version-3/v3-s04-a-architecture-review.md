# V3-S04-a Architecture Review

**Package:** V3-S04 OWASP & API Hardening
**Slice:** S04-a — Security Platform Foundation
**Date:** 2026-08-17
**Status:** Slice evidence — **not** package Close
**Nature:** Architecture review. Not an RC. Not an ADR.

## Summary

| Rule                                            | Verdict  | Evidence                                                                              |
| ----------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| No new bounded context                          | **PASS** | `SecurityPlatformModule` extends existing API host under Identity/Auth HTTP extension |
| No ownership drift                              | **PASS** | Auth, RBAC, Vault, Ledger, Orders unchanged                                           |
| No duplicate Source of Truth                    | **PASS** | No new persistence or domain SoT                                                      |
| HTTP remains transport                          | **PASS** | Middleware + filters only                                                             |
| Spec v2.0 / Authority Matrix / Alias Dictionary | **PASS** | Unchanged                                                                             |
| Justified extension inside existing owner       | **PASS** | Platform HTTP bootstrap only                                                          |

## Placement

```text
main.ts
  assertSecurityPlatformBoot()          ← fail-closed before listen
  registerSecurityPlatformHttpHooks()     ← Fastify onRequest normalization
        ↓
AppModule
  SecurityPlatformModule (global)
    PlatformSecurityExceptionFilter
    SecurityPlatformBootstrap
        ↓
ValidationModule (unchanged owner, foundation re-exported)
StartupVerification (composes security config checks)
```

## Deviations

**None introduced.**

## Risks accepted for this slice

- Feature-specific exception filters still exist; platform filter is the last-resort sanitizer for unhandled errors.
- Header/CSP/rate posture intentionally deferred — documented in [`security-hardening-progress.md`](./security-hardening-progress.md).

## Next architecture gate

S04-b HTTP hardening must attach to the same bootstrap seam without inventing a second security stack.

**STOP.** Wait for Product Owner review before S04-b.
