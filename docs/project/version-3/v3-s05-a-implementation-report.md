# V3-S05-a Implementation Report

## F-02 Certification Remediation

**Date:** 2026-08-17
**Scope:** Security Audit attribution contract for approved Identity-global role events.

`authz.role-change` no longer requires an invented workspace. The persisted record retains actor, subject, resource type, resource id, event type, outcome, and timestamp. Workspace-scoped authorization denials retain supplied workspace attribution. The Identity role-assignment path awaits the Audit append and regression coverage verifies one non-secret role-change write.

Security Audit remains the sole persistence owner. This remediation creates no new event store, bounded context, product feature, or Master Plan change.

## Delivered

Security Audit now owns a durable append-only record model and internal write
API. It records classified Authentication sign-in, session, and recovery
outcomes, plus RBAC role-change / deny, Vault lifecycle / access denial, and
Security Platform abuse / shaped-deny events through owner-side adapters.
customer-trust value, financial-integrity value, and retention expectation in
the approved classification catalogue. Equivalent event content produces the
same fingerprint and fixed payload structure.

## Mandatory answers

1. **What did the customer receive?** Trustworthy security-event recording groundwork.
2. **What did the customer NOT receive?** A Security Audit page, search, filtering, export, monitoring, retention enforcement, or incident view.
3. **Which events are now recorded?** Classified Authentication, RBAC, Vault, and Security Platform outcomes written through the internal API.
4. **Which events are intentionally NOT recorded yet?** Routine session refresh, technical logs, connection, ledger, and live-trading activity.
5. **What remains before S05-b?** Product Owner review of this slice.
6. **Which slice becomes available next?** V3-S05-b, only after that review.
7. **Was the Master Plan respected?** Yes; no Master Plan or Version 2 material changed.
8. **Were Product Principles respected?** Yes; the design prioritizes auditability, security, honest scope, and ownership boundaries.
9. **Was the Security Default Policy respected?** Yes; unclassified and secret-shaped input is rejected by default.
10. **Were any architectural deviations introduced?** No.
