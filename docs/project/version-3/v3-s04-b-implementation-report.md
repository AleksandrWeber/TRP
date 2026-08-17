# V3-S04-b Implementation Report

**Package:** V3-S04 OWASP & API Hardening
**Slice:** S04-b — HTTP Hardening
**Date:** 2026-08-17
**Status:** Implemented — pending Product Owner review; **not** package Close

## Delivered

- A 1 MiB default request body limit, configurable only within safe bounds.
- A 30-second request timeout, likewise bounded by platform configuration.
- Immediate `Content-Length` refusal before a declared oversized request is parsed.
- Host allowlisting; production refuses to start without `API_ALLOWED_HOSTS`.
- CR/LF/NUL request-header rejection to prevent header smuggling.
- A `no-store` default for API responses without an explicit cache policy.
- Open-redirect allowlist helper for relative or explicitly trusted origins.
- Fastify `onError` mapping for body-too-large responses without overriding Nest error handling.
- Host-independent password-recovery origin regression in `host-mail.factory.spec.ts`.

## Regression evidence

`security-platform.http.spec.ts` proves declared oversized bodies, untrusted Host values, CR/LF headers, and disclosure/cache response handling. Existing platform integration tests prove the response behavior.

## Not delivered

CSP, rate limiting, CSRF redesign, Vault, Connections, Audit, Monitoring, Live Trading, SSRF, or mass-assignment policy.

## Next slice

**S04-c** may begin only after Product Owner review.
