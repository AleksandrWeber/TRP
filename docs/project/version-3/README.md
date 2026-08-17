# Version 3 Planning Package

**Canonical document:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Status:** **PLANNING FROZEN** — 2026-08-16
**Process:** [`version-3-implementation-policy.md`](./version-3-implementation-policy.md)
**Nature:** Planning only. Not an RC. Not an ADR. Not implementation.
**Rule:** Do not write Version 3 production code until the Master Plan is accepted **and** the package Implementation Package is approved. **V3-S01** is **CLOSED**. Next package: **V3-S02** at Implementation Package.

Version 2 is **CERTIFIED** (`v2.0.1`). Architecture Specification v2.0, the Authority Matrix, and the Alias Dictionary remain the frozen constitution. This folder does **not** amend Version 2 documentation.

All Version 3 implementation, reviews, audits, and planning decisions must reference the Master Plan. No Version 3 package starts with code.

---

## Canonical

| Document                                                | Role                              |
| ------------------------------------------------------- | --------------------------------- |
| **[Version 3 Master Plan](./version-3-master-plan.md)** | **Product Owner source of truth** |

## Process (binding)

| Document                                                          | Role                                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **[Implementation Policy](./version-3-implementation-policy.md)** | Lifecycle for every `V3-*` package: package → review → approval → implementation → reviews → validation → close |

## Freeze record

| Document                                                         | Role                    |
| ---------------------------------------------------------------- | ----------------------- |
| [Planning Consistency Audit](./v3-planning-consistency-audit.md) | Issues found and closed |
| [Planning Completion Report](./v3-planning-completion-report.md) | Freeze declaration      |

## Annexes (detail)

| Document                                                             | Role                                    |
| -------------------------------------------------------------------- | --------------------------------------- |
| [Vision](./v3-vision.md)                                             | What Version 3 is                       |
| [Product Roadmap](./v3-product-roadmap.md)                           | Groups and journeys                     |
| [Capability Inventory](./v3-capability-inventory.md)                 | Every capability ID                     |
| [Execution Roadmap](./v3-execution-roadmap.md)                       | V3-* packages                           |
| [Security Vision](./v3-security-vision.md)                           | Security Platform                       |
| [Connection Management Vision](./v3-connection-management-vision.md) | Connections product                     |
| [Readiness Dashboard](./v3-readiness-dashboard.md)                   | Capability table                        |
| [Planning Summary](./v3-planning-summary.md)                         | Historical executive draft (superseded) |

## Implementation packages

| Document                                                                  | Role                                      |
| ------------------------------------------------------------------------- | ----------------------------------------- |
| **[V3-S01 Close Report](./v3-s01-close-report.md)**                       | Authentication & Session — **CLOSED**     |
| [V3-S01 Implementation Package](./v3-s01-implementation-package.md)       | Approved package (historical)             |
| [V3-S01 Product Scope](./v3-s01-product-scope.md)                         | IN / OUT and customer acceptance          |
| [V3-S01 Security Review](./v3-s01-security-review.md)                     | Security Vision applied to S01 (planning) |
| [V3-S01 Validation Plan](./v3-s01-validation-plan.md)                     | How S01 Close is proven                   |
| [Authentication Platform Overview](./authentication-platform-overview.md) | Customer-facing S01 product               |

Next package after S01 Close: **V3-S02 RBAC Product** — start at Implementation Package, not at code. Do not begin it until review.

---

## Governing Version 2 sources (read-only)

| Source                                                                     | Use                                            |
| -------------------------------------------------------------------------- | ---------------------------------------------- |
| [Product Vision](../trp-product-vision.md)                                 | Level-0 purpose                                |
| [Architecture Specification v2.0](../trp-architecture-specification-v2.md) | Frozen constitution                            |
| [Version 2 Final Certification](../version-2-final-certification.md)       | Certified baseline                             |
| [Product Readiness Audit v2](../product-readiness-audit-v2.md)             | 99% paper / 40% production / 100% architecture |
| [Connection Management Audit](../version-2-connection-management-audit.md) | No unified connection product in V2            |
| [Technical Debt Register](../technical-debt.md)                            | Residuals absorbed into waves                  |

---

## Planning principles (binding)

1. Version 3 is **not** Version 2.1. It extends the platform.
2. Version 3 must **not** redesign Version 2.
3. Architecture changes must be **justified**.
4. Reuse existing domains whenever possible.
5. AI never controls capital. Telegram is never a control plane.
6. Live capital requires a **future ADR**. Planning does not authorize live money.
7. Conflicts: **Master Plan wins**.

---

**STOP.** V3-S01 Authentication & Session is **CLOSED**. Wait for review before **V3-S02 RBAC Product** begins (Implementation Package, not code).
