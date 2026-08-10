# Strategy Library (`strategy-library`)

**RC:** RC-22  
**Epic:** 6 — Lifecycle, Deprecation, Archive  
**Authority class:** Source of Truth (certified strategy versions / envelopes / eligibility / lifecycle)

## Purpose

Authoritative store of strategies that earned certification (Architecture Spec v2.0 §5.2).

**Domain complete** for RC-22 Epics 1–6. Application Nest ports, persistence, and runtime consumers remain deferred.

## Domain model

| Type                      | Role                                         | Epic |
| ------------------------- | -------------------------------------------- | ---- |
| `Strategy`                | Logical family                               | 2    |
| `StrategyVersion`         | Immutable implementation                     | 2    |
| `StrategyCertification`   | Admission gate record                        | 3    |
| `CertificationEvidence`   | Immutable refs to Research / Paper artifacts | 3    |
| `LibraryTacticalEnvelope` | Approved operational boundaries              | 4    |
| `StrategyEligibility`     | Static domain selectability decision         | 5    |
| `StrategyLifecycleRecord` | Immutable deprecate/archive audit            | 6    |

## Lifecycle (Epic 6)

- Phases: certified → deprecated → archived
- Transitions emit lifecycle records + new certification status snapshots
- No in-place mutation; no hard delete
- Deprecated/archived: historically queryable; no new eligibility

Policy: `docs/project/rc-22-epic6-lifecycle-policy.md`  
Audit: `docs/project/rc-22-epic6-internal-audit-report.md`

## Active surfaces

| Port / surface                                                                    | Active  |
| --------------------------------------------------------------------------------- | ------- |
| All **domain** models (1–6)                                                       | **Yes** |
| Application Registration / Certification / Lookup / Eligibility / Lifecycle ports | No      |
| Persistence / REST / Runtime                                                      | No      |

## Ownership

Library owns certified membership, envelopes, eligibility, lifecycle.  
Research owns evidence bodies. Lake is Projection only. Runtime unchanged.

See: `docs/project/rc-22-epic6-lifecycle-deprecation-archive.md`.
