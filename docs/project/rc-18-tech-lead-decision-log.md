# RC-18 Tech Lead Decision Log

**Release:** RC-18 — Production Recovery & Operational Readiness  
**Date opened:** 2026-08-01  
**Status:** Living  
**Purpose:** Chronological Tech Lead / Architecture gate decisions for RC-18
residual delivery. Complements (does not replace) the Architecture Decision
Log ([`../Architecture/ADR/ADL.md`](../Architecture/ADR/ADL.md)).

Related:

- [Mid-Release Health Review](./rc-18-mid-release-health-review.md)
- [Residual Register](./rc-18-residual-register.md)
- [RC-18 Development Process](./rc-18-development-process.md)

---

## Decision index

| ID     | Date       | Subject                                               | Verdict                                          |
| ------ | ---------- | ----------------------------------------------------- | ------------------------------------------------ |
| TL-001 | 2026-07-30 | Stage 2 Architecture Review (TD-036 residuals)        | **PROCEED**                                      |
| TL-002 | 2026-08-01 | US290 Pre-Implementation Verification                 | **PASS**                                         |
| TL-003 | 2026-08-01 | US291 Pre-Implementation Verification                 | **PASS**                                         |
| TL-004 | 2026-08-01 | US293 Story Specification Tech Lead Review            | **APPROVED WITH MINOR CORRECTIONS**              |
| TL-005 | 2026-08-01 | US293 Story Specification (post-corrections)          | **APPROVED** — implementation authority          |
| TL-006 | 2026-08-01 | RIV-001 Recovery Integration Validation (US290–US292) | **COHERENT — INTEGRATED WITH KNOWN RESIDUALS**   |
| TL-007 | 2026-08-01 | SIG-001 Safety Integration Validation (US293)         | **PASS WITH RESIDUALS**                          |
| TL-008 | 2026-08-01 | Mid-Release Health Review (US290–US293)               | **ACCEPT mid-release foundation**; proceed US294 |
| TL-009 | 2026-08-01 | US294 Story Specification                             | **APPROVED WITH MINOR CORRECTIONS** → applied    |
| TL-010 | 2026-08-01 | US294 Stage 3 Evidence (M-01…M-12)                    | **Evidence Package COMPLETE**; handoff US295     |

---

## Decisions

### TL-001 — Stage 2 Architecture Review

| Field     | Value                                                                                      |
| --------- | ------------------------------------------------------------------------------------------ |
| Authority | [`rc-18-td036-stage2-architecture-review.md`](./rc-18-td036-stage2-architecture-review.md) |
| Verdict   | **PROCEED**                                                                                |
| Binding   | Dual-status model; Session-owned recovery; no new BC; sequence US290→US295                 |

### TL-002 — US290 Pre-Implementation Verification

| Field   | Value                                                                                        |
| ------- | -------------------------------------------------------------------------------------------- |
| Verdict | **PASS**                                                                                     |
| Note    | Discovery selected candidates but did not force `RECOVERING`; gap matched TR-N1 / Story Spec |
| Gate    | Implementation authorized under Stage 2 PROCEED                                              |

### TL-003 — US291 Pre-Implementation Verification

| Field   | Value                                                                          |
| ------- | ------------------------------------------------------------------------------ |
| Verdict | **PASS**                                                                       |
| Note    | Production stub retirement + real port binding required; no reconcile redesign |
| Gate    | Implementation authorized                                                      |

### TL-004 / TL-005 — US293 Story Specification

| Field   | Value                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------ |
| TL-004  | **APPROVED WITH MINOR CORRECTIONS**                                                                          |
| TL-005  | **APPROVED** after corrections applied                                                                       |
| Binding | Minimal Session-owned Recovery Incident; fail-closed order; provisional pending E19; no chaos/ADL absorption |

### TL-006 — RIV-001

| Field                     | Value                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Report                    | [`rc-18-riv-001-recovery-integration-validation.md`](./rc-18-riv-001-recovery-integration-validation.md) |
| Verdict                   | **COHERENT — INTEGRATED WITH KNOWN RESIDUALS**                                                           |
| Production restart-safety | **Not claimable** (US294)                                                                                |

### TL-007 — SIG-001

| Field   | Value                                                                                                |
| ------- | ---------------------------------------------------------------------------------------------------- |
| Report  | [`rc-18-sig-001-safety-integration-validation.md`](./rc-18-sig-001-safety-integration-validation.md) |
| Verdict | **PASS WITH RESIDUALS**                                                                              |
| Next    | US294 chaos evidence; US295 ADL; E19 Incident productization                                         |

### TL-008 — Mid-Release Health Review

| Field   | Value                                                                                                           |
| ------- | --------------------------------------------------------------------------------------------------------------- |
| Report  | [`rc-18-mid-release-health-review.md`](./rc-18-mid-release-health-review.md)                                    |
| Verdict | Accept US290–US293 as residual foundation; Architecture Freeze intact                                           |
| Process | Recommend Story Spec / Pre-Impl / Tech Lead / RIV / SIG / Residual Register / Decision Log as project standards |

### TL-009 — US294 Story Specification

| Field   | Value                                                                                       |
| ------- | ------------------------------------------------------------------------------------------- |
| Verdict | **APPROVED WITH MINOR CORRECTIONS** (normative M-01…M-12 matrix + Evidence Package section) |
| Gate    | Corrections applied; Story became Stage 3 implementation/evidence authority                 |

### TL-010 — US294 Stage 3 Evidence

| Field            | Value                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Evidence Package | [`rc-18-us294-chaos-restart-evidence.md`](./rc-18-us294-chaos-restart-evidence.md)        |
| Suite            | `apps/api/src/modules/trading-session/recovery/us294-chaos-restart.evidence.spec.ts`      |
| Verdict          | **M-01…M-12 PASS** — R5/TR-N4 closed; production restart-safety PASS still requires US295 |
| Next             | US295 ADL-008 closure (consumes Evidence Package)                                         |

---

## Rules

1. Record gate outcomes here when Tech Lead / Architecture owner blocks or
   authorizes residual Stories.
2. Do not use this log to silently supersede ADRs (ADR-018 #60).
3. ADL remains the architecture chronology; this log is the **engineering gate**
   chronology for RC-18 delivery.
