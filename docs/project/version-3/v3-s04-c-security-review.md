# V3-S04-c Security Review

**Package:** V3-S04 OWASP & API Hardening
**Slice:** S04-c — Browser Security & Response Protection
**Date:** 2026-08-17
**Status:** Slice evidence — not the S04 package Close review

## Security mapping

| Protection            | OWASP / Verification Standard                            | Verdict | Evidence                                                                   |
| --------------------- | -------------------------------------------------------- | ------- | -------------------------------------------------------------------------- |
| CSP                   | OWASP A05 Security Misconfiguration; §2.1–2.4 XSS; §14.1 | PASS    | Production policy regression excludes development exceptions               |
| Frame denial          | OWASP A05; §2.6 / §14.2 Clickjacking                     | PASS    | `frame-ancestors 'none'` and `X-Frame-Options: DENY` integration assertion |
| nosniff               | OWASP A05; §14.5                                         | PASS    | `X-Content-Type-Options: nosniff` integration assertion                    |
| Referrer policy       | OWASP A05; §14.3                                         | PASS    | `Referrer-Policy: no-referrer` integration assertion                       |
| Permissions policy    | OWASP A05; §14.4                                         | PASS    | Browser capabilities disabled unless needed                                |
| Cross-origin policies | OWASP A05                                                | PASS    | Opener/resource policy integration assertion                               |

## Compatibility and scope

- Cookie-authenticated requests keep using the configured API origin.
- React/Vite assets stay same-origin.
- Development live reload is the only documented CSP exception; it does not exist in production.
- Swagger is not installed or served by the current API.
- `Cross-Origin-Embedder-Policy` remains intentionally disabled because the current product does not require cross-origin isolation and enabling it could block future external resources. This is not a production bypass for CSP, frame, MIME, referrer, or permissions protections.
- API `Cross-Origin-Resource-Policy` is `cross-origin` so cookie-authenticated SPA requests from the web origin continue to work with CORS.

## Security Regression Suite

- `browser-security.spec.ts` proves production CSP is strict and development exceptions are limited.
- `security-platform.integration.spec.ts` proves browser headers are present on real platform responses.
- `apps/web/src/browser-security.spec.ts` proves production web policy excludes live-reload allowances while development retains required Vite/API compatibility.

## Deferred to S04-d

Rate limiting, throttling, and anti-enumeration are intentionally deferred to S04-d.

**STOP.** Full Security Verification Standard completion remains S04-e. Await Product Owner review before S04-d.
