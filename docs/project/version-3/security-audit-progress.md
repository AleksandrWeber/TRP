# Security Audit Progress

## V3-S05-a — Security Event Store foundation

Implemented:

- A durable, append-only Security Audit record store.
- An internal write path that admits only approved event types.
- Immutable record construction, non-secret payload validation, fixed schema
  versioning, and deterministic event fingerprints.
- The first emitter integration for Authentication sign-in, session, and
  recovery outcomes.
- Emitter adapters for RBAC role-change / C6 deny, Vault lifecycle / access
  denial, and Security Platform throttles / shaped denials.

Not implemented at S05-a close:

- Search, filtering, export, retention enforcement, security incidents, and
  integrity-chain verification.
- Session refresh is intentionally excluded from audit history as routine
  technical noise.

Note: S05-a shipped write-only storage. Chronological read and Timeline HTTP
composition arrived in the S05-b slice below.

## V3-S05-b — Investigation Timeline foundation

Implemented:

- A workspace-scoped Timeline API with forward-only chronological navigation.
- Investigation stages that label entry, persistence, escalation,
  credential-impact, and pressure without changing the event order.
- Deterministic grouping keys based on correlation, subject, actor, or
  workspace context.

Not implemented:

- Search, filters, export, retention, integrity chain, monitoring, dashboard,
  or a web interface.

### Product Owner Planning Alignment

**Accepted:** 2026-08-17. The Product Owner accepts this Timeline foundation as
**S05-b**. This is planning alignment only: no architecture, Master Plan,
Version 2, or ownership change.

Remaining approved-package work:

| Slice                                                                 | Status                                             |
| --------------------------------------------------------------------- | -------------------------------------------------- |
| S05-c integrity / tamper-evidence foundation                          | Next slice                                         |
| S05-d incident attribution, criticality, and investigation enrichment | Not started; must use Incident → contains → Events |
| S05-e retention, export, and Close                                    | Not started                                        |

Timeline remains a read model. Search, filtering, export, retention, integrity,
monitoring, dashboard, and UI remain outside S05-b.

Next: **V3-S05-c Integrity foundation**.

## V3-S05-c — Integrity Foundation

Implemented:

- Each new audit record has versioned integrity metadata and a deterministic
  content hash covering every persisted audit field.
- The audit table rejects product-path updates and deletes at the database
  layer; it accepts append operations only.
- An internal-only verifier reads all audit records in a stable order and
  fails closed when any record no longer matches its recorded integrity hash.
- The mechanism remains independent per record. It adds no event grouping,
  incident, Timeline, search, export, monitoring, or UI behavior.

Integrity guarantees now:

- Ordinary product code has no update or delete capability, and the durable
  table independently rejects those operations.
- A changed persisted field is deterministically detected when integrity
  verification runs.
- A deployment will not silently assign integrity metadata to pre-S05-c
  history; migration stops instead of creating an untrustworthy backfill.

Not yet guaranteed:

- No cryptographic chain, signed checkpoint, external attestation, or
  independent verifier exists yet.
- A fully privileged database administrator can still alter rows together
  with integrity metadata or disable database protections.
- There is no operator-facing integrity status or monitoring alert.
- Deletion detection beyond database enforcement is deferred to a later
  tamper-evidence package.

S05-d remains compatible: future Incidents may contain these immutable audit
events without changing their integrity metadata or record identity.

Next: **Product Owner review before V3-S05-d**.

## V3-S05-d — Incident Attribution & Investigation

Implemented:

- A durable Incident container that contains links to immutable Security Audit
  events; it never copies event facts into a second record.
- Internal investigation assembly that presents linked evidence in time order,
  preserving each event's actor, subject, resource, outcome, and payload.
- Derived criticality plus security and financial-integrity impact, calculated
  from the linked events' approved classifications rather than invented facts.
- Required attribution normalization on persisted audit events.
- Timeline enrichment with incident containment references (`incidentIds`).
- Investigation completeness reporting for present and absent walkthrough stages.
- Append-only Incident lifecycle facts for opening and closing an investigation.

Not implemented:

- Search, filtering, export, retention, monitoring, dashboard, or UI.
- New security events, financial action history, or a conclusion that goes
  beyond the evidence linked to an Incident.

Investigation Completeness is met from evidence only: linked events answer
who, what, when, before, after, and impact when those facts exist. Missing
facts stay missing; the Incident does not manufacture them.

Next: **Product Owner review before V3-S05-e**.

## V3-S05-e — Audit Product Close Foundation

Implemented:

- An interim retention policy helper that determines when each class becomes
  eligible for future retention handling. It does not delete or archive any
  record.
- A deterministic internal investigation export foundation that renders only
  linked, already-safe evidence with integrity and retention metadata.
- Reproducible incident identity: the same workspace and same evidence set
  always resolve to the same Incident and ordered investigation.
- Close-readiness validation and an independent certification audit.

Not implemented:

- No automatic deletion, archive job, retention administration, search,
  filtering, UI download, monitoring, dashboard, analytics, or alerting.
- No S06, Wave 2, live financial action history, or monitoring functionality.

S05 implementation is complete. **V3-S05 remains pending Product Owner Close
review and is not declared CLOSED by this document.**
