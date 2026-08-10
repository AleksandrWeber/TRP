# Strategy Library (`strategy-library`)

**RC:** RC-22 domain (CLOSED) + RC-23 Epic 2 Nest read ports  
**Authority class:** Source of Truth (certified strategy versions / envelopes / eligibility / lifecycle)

## Purpose

Authoritative store of strategies that earned certification (Architecture Spec v2.0 §5.2).

**Domain complete** for RC-22 Epics 1–6. RC-23 Epic 2 activates Nest **read** ports (Lookup + Eligibility) for Runtime Enforcement.

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

## Active surfaces

| Port / surface                                                       | Active  |
| -------------------------------------------------------------------- | ------- |
| All **domain** models (RC-22)                                        | **Yes** |
| Nest Lookup / Eligibility **read** ports (RC-23 Epic 2)              | **Yes** |
| Application Registration / Certification / Lifecycle **write** ports | No      |
| Persistence / REST                                                   | No      |

## Ownership

Library owns certified membership, envelopes, eligibility, lifecycle.  
Research owns evidence bodies. Lake is Projection only.  
Runtime Enforcement may **read** only — never write Library SoT.

Never depends on Runtime Enforcement.
