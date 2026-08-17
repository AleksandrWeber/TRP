# Version 3 Security Default Policy

**Document:** Version 3 Security Default Policy
**Date:** 2026-08-17
**Status:** Permanent Security Constitution for Version 3 — awaiting Product Owner confirmation with approved V3-S04 planning
**Authority:** Subordinate to [`version-3-master-plan.md`](./version-3-master-plan.md)
**Companions:** [`v3-security-vision.md`](./v3-security-vision.md) · [`version-3-implementation-policy.md`](./version-3-implementation-policy.md) · [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md) · [`security-coverage-matrix.md`](./security-coverage-matrix.md)
**Nature:** Policy. Not an RC. Not an ADR. Not a checklist. Not an audit. Not an implementation guide. Not a Master Plan revision.

```text
Master Plan          →  what the product is
Implementation Policy →  how packages are built
Security Vision       →  what threats and controls Version 3 owns
This document         →  the permanent security philosophy
```

A Version 3 feature, package, or shortcut that violates this policy is out of plan until the Master Plan is revised and this constitution is updated under Product Owner authority.

---

## Purpose

TRP will manage financial assets. Security is therefore not a feature toggle, not a late hardening pass, and not a per-package improvisation.

This document records the **defaults that never change**:

- what is denied until explicitly allowed
- what must fail closed
- what must stay honest
- what must stay attributable
- what must never return after it is fixed

It does not list tests. It does not assign files. It does not redesign architecture.

---

## The Constitution

### 1. Default deny

Everything is forbidden unless it is explicitly allowed.

Unknown roles, unknown permissions, unknown actions, and unexpected privileged fields are denied. Absence of a rule is not permission.

### 2. Explicit enablement

Capabilities that can affect money, secrets, or external systems stay off until the product intentionally enables them.

Live trading stays off. Integrations stay disconnected until the owning product says otherwise. Production does not “run open for convenience.”

### 3. Fail closed

When security state is unclear, the system refuses the dangerous path.

Misconfigured production security defaults fail closed. Lost vault wrapping material fails closed. Unauthorized access fails closed. Convenience never outranks protection of financial assets.

### 4. Least privilege

Every actor receives the minimum power required for their role and no more.

Admin is not a bypass of Gate, Risk, or Ledger. Vault list is metadata, never plaintext. Runtime retrieve is for the owning integration, not for the browser. New users do not start as Admin or live-capable by accident.

### 5. Honest Product

Customer-visible state tells the truth.

No fake Connected. No fake success. No fake sent message. No fake live. If the system cannot do something, it says so. Simulated or incomplete work is never dressed as production success.

### 6. One Source of Truth

Security does not invent a second home for money, order lifecycle, risk, identity, or secrets.

Ledger remains money. Authentication remains authentication. Authorization remains authorization. Vault remains vault. Hardening remains platform defaults. Duplicate domains are forbidden.

### 7. Every secret has one owner

A secret has exactly one product owner and one honest store.

Customer vendor secrets belong to Vault. Login passwords belong to Authentication. Host infrastructure secrets stay host-operated. No second store, no support export of plaintext, no `.env` as the customer path.

### 8. Every request is authenticated or explicitly public

Network location is not trust.

APIs that are not deliberately public require authentication. Workspace identity is checked server-side; it is not a client honor system. Vendor callbacks are authenticated on their own terms when those products exist.

### 9. Every state-changing action is authorized

Authentication is not authorization.

Mutations require permission and ownership checks. Hidden or unlinked routes remain protected. Cookie-authenticated changes require CSRF defenses. Being signed in never means being allowed.

### 10. Everything that can affect security, financial integrity, or customer trust must be attributable and auditable

Customer trust is not only money. Deleting a Vault secret may not move capital, but it is still a critical event. Who did what, in which workspace, with which outcome — without logging secrets. Emit events when packages own them; the audit product may come later, but silent untraceable power is forbidden.

### 11. Security regressions never return

A found-and-fixed vulnerability owned by a package leaves an automated regression test.

That test runs with ordinary tests. Disabling it without Product Owner approval is forbidden. A silent fix without a regression is incomplete when the Security Verification Standard applies.

### 12. Security Verification Standard is mandatory

Every Version 3 package that starts after the standard is approved must complete it before Close.

STRIDE, Timing, Abuse, the Security Checklist, the Verification Standard, and the Regression Suite are all required where the process says they apply. Blank is not PASS. REQUIRES ACTION blocks Close.

### 13. No hidden production bypasses

There is no secret switch that turns security off in production.

No hidden admin force-fill. No undocumented Gate skip. No “support mode” that returns vault plaintext. No env convenience that leaves CSP, cookies, or validation off in production.

### 14. Defense in depth without false comfort

One layer failing must not silently succeed at the next.

Edge, authentication, authorization, domain gates, vault, ledger, and audit each matter. Passing one review does not excuse punching a hole in another.

### 15. Paper first; live must be earned

Paper remains the default. Live capital is not a UI flag.

Live opens only after the Master Plan’s required waves, ADR, and human controls. AI never decides, approves, sizes, or starts trades.

### 16. Customer First does not weaken security

Ordinary operators must use the product without SSH, Docker, or customer `.env`.

Host infrastructure may remain server-operated. Customer First never means shipping insecure defaults so the demo looks easier.

---

## Compact form (binding)

```text
Everything is denied by default.
Everything dangerous must be explicitly enabled.
Everything must fail closed when unsure.
Everything customer-visible must be honest.
Everything that can affect security, financial integrity, or customer trust must be attributable and auditable.
Every secret has one owner.
Every request is authenticated or explicitly public.
Every state-changing action is authorized.
Every fixed vulnerability gets a regression test.
Every package subject to the standard must pass it before Close.
No hidden production bypasses.
No fake connected state.
No fake success.
No second Source of Truth for money, identity, or secrets.
```

---

## What this document is not

| Not this             | Why                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Checklist            | Close evidence lives in package Security Reviews and the Verification Standard                  |
| Audit                | Coverage visibility lives in [`security-coverage-matrix.md`](./security-coverage-matrix.md)     |
| Implementation guide | Slices and code live in approved Implementation Packages                                        |
| Threat catalog       | Threats live in [`v3-security-vision.md`](./v3-security-vision.md)                              |
| Process lifecycle    | Lifecycle lives in [`version-3-implementation-policy.md`](./version-3-implementation-policy.md) |
| Product backlog      | Scope lives in the Master Plan                                                                  |

---

## Conflict rule

```text
Master Plan wins on product scope and waves.
This constitution wins on security philosophy defaults.
If a package cannot satisfy both: stop.
Do not invent a bypass.
Do not edit Version 2 certification to escape the rule.
```

---

## Relationship to V3-S04

V3-S04 OWASP & API Hardening makes platform-wide secure defaults real in the product edge.

This constitution remains binding **after** S04 Closes, and for every later wave. S04 does not own the philosophy; it implements part of it.

---

**STOP.** Wait for Product Owner review before V3-S04 implementation begins. No code. No Master Plan edits. No Version 2 edits.
