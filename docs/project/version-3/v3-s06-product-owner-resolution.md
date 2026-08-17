# V3-S06 Product Owner Resolution — Remaining Isolation PENDING Rows

**Package:** V3-S06 Workspace Isolation Hardening
**Date:** 2026-08-17
**Nature:** Planning resolution only. Not implementation. Not code. Not tests.
**Not a Master Plan edit. Not a Version 2 edit. Not a commit.**
**Status:** **APPROVED** — 2026-08-17. S06-f evidence alignment and V3-S06 Close
recorded in [`v3-s06-close-report.md`](./v3-s06-close-report.md).

**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Matrix:** [`wave-1-isolation-matrix.md`](./wave-1-isolation-matrix.md)
**Scope:** [`v3-s06-product-scope.md`](./v3-s06-product-scope.md)
**Package:** [`v3-s06-implementation-package.md`](./v3-s06-implementation-package.md)
**Close blockers:** [`v3-s06-e-implementation-report.md`](./v3-s06-e-implementation-report.md), [`wave-1-certification-readiness.md`](./wave-1-certification-readiness.md)

---

## Purpose

S06 implementation is complete except Package Close evidence. Four Wave 1
isolation matrix rows remain **PENDING**. S06 cannot honestly Close until every
row is **PASS** or **NOT APPLICABLE**.

This document decides, for Product Owner approval, whether each PENDING row
should become:

- **PASS**
- **NOT APPLICABLE**
- or requires a **planning correction**

No product redesign is proposed here. No slice is opened. No matrix statuses
are changed until Product Owner approves.

---

## Close rule (unchanged)

From the approved Isolation Matrix and S06-e Close gate:

> Every Wave 1 row must be **PASS** or honestly **NOT APPLICABLE**.

PENDING blocks S06 Close and therefore blocks commissioning the independent
Wave 1 Certification Audit.

---

## Row 1 — RBAC / People / role assignment

### Current planning

| Field            | Current text                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| Owner            | Identity                                                                                                     |
| Proof required   | Role and People APIs never return or mutate principals outside allowed workspace scope                       |
| Status           | **PENDING — blocks Close**                                                                                   |
| Honest reason    | People API is global in Wave 1; workspace-scoped People list/mutate is not a product surface yet             |
| Partial evidence | Admin role still cannot grant foreign workspace membership (`workspace-isolation.identity-coverage.spec.ts`) |

S06-b treated workspace-scoped People as the Close-quality proof bar and left
the row PENDING when that surface did not exist.

### Master Plan intent

- Wave 1 exit line: **“I cannot see another workspace’s data.”**
- Workspace isolation: **Wave 1 fail-closed; Wave 9 teams**.
- People / Administration group for multi-team SaaS remains **Wave 9**.
- Capability SEC-11: credentials, orders, and research of A invisible to B —
  not a Wave 1 teammate directory per workspace.

Closed **V3-S02** intent is binding for this surface:

- Identity owns **role** globally.
- Workspace owns **membership**.
- Role assignment does **not** create membership.
- Membership today is owner-only until Wave 9 invites / shared teams.
- People is an Admin projection over Identity operators, not a per-workspace
  teammate product.
- Isolation obligation for S02: a role change must not let a user in A read B.

### Actual implementation

- `GET /v1/people` lists Identity operators for RoleAdmin; it is not filtered by
  `X-Workspace-Id`.
- Role assignment mutates Identity role only.
- Authorization paths still require Workspace membership for workspace-scoped
  work (Admin role ≠ foreign membership).
- S06 already has Runtime + Regression evidence that Admin A cannot act in
  Workspace B by role alone.

### Reasoning

The PENDING reason is accurate as a description of the product: People is
global. The matrix **proof required** text is not. It demands a
workspace-scoped People boundary that S02 deliberately did not ship and that
the Master Plan defers to Wave 9 teams.

Judging Wave 1 People against a Wave 9 teammate-directory standard is a
planning overreach. The honest Wave 1 isolation claim is:

1. People is an Identity-global Admin directory (by Closed S02 design).
2. Role never substitutes for membership.
3. Non-Admin cannot use People.
4. Cross-workspace data access remains gated by Workspace / Vault / Audit /
   Timeline owners already proved elsewhere.

### Recommended decision

**Planning correction**, then **PASS** under the corrected Wave 1 proof bar.

Corrected proof required (proposed):

> Role assignment and People Admin projection remain Identity-global as Closed
> by S02; privilege grant cannot open foreign workspace membership; non-Admin
> cannot list or mutate People. Workspace-scoped teammate People remains Wave 9
> and is out of this row.

After Product Owner accepts that correction, existing S06-b negative evidence
is sufficient for **PASS**. No People product rewrite is required.

### Required follow-up (if approved)

1. Reword the matrix / executable contract proof required and pass reason.
2. Mark the row **PASS** with the existing Admin≠membership regression named.
3. Explicitly record workspace-scoped teammate People as Wave 9 (not silent
   PENDING).
4. Do **not** invent a workspace-scoped People API under S06.

---

## Row 2 — Incident / investigation

### Current planning

| Field            | Current text                                                              |
| ---------------- | ------------------------------------------------------------------------- |
| Owner            | Audit                                                                     |
| Proof required   | Incidents and evidence links never mix or reveal B facts to A             |
| Status           | **PENDING — blocks Close**                                                |
| Honest reason    | Mixed evidence denied; investigate/export are not caller-workspace-scoped |
| Partial evidence | Incident A cannot link audit evidence B                                   |

S06-d / S06-e treated caller-workspace scoping of `investigate` / `export` as
mandatory for full Incident isolation.

### Master Plan intent

- SEC-14 Incident Logging is Wave 1 (owned by S05).
- Operators must be able to reconstruct durable security incidents.
- Cross-workspace leak tolerance remains **0**.
- Monitoring / health dashboards are Wave 3, not S05/S06.

Closed **V3-S05** intent is binding:

- Incidents are workspace-attributed aggregates: **Incident → contains → Events**.
- Open / attach refuse mixed-workspace evidence.
- Export shipped as an **internal foundation** with **no HTTP / download
  surface**.
- Customer searchable Audit UI / download workflow remained out at S05 Close.

### Actual implementation

- `open({ workspaceId, eventIds })` refuses foreign or missing evidence.
- `attachEvidence` requires matching incident workspace.
- Incident identity is deterministic from workspace + sorted event IDs.
- `investigate(incidentId)` and `exportIncident(incidentId)` are internal
  service methods keyed by incident id only — there is no authenticated
  customer caller and no HTTP transport for them in Wave 1.
- Investigation assembly returns only linked same-workspace events.

### Reasoning

The product already enforces workspace purity where tenancy facts are written
and assembled. The PENDING bar asks for **caller-workspace scoping** on APIs
that have **no caller** in the Closed S05 package.

That bar is broader than:

- Master Plan SEC-14 as Closed by S05
- S05 Close limitations (internal export foundation; no customer download)
- S06’s own rule that isolation verifies owners and does not redesign them

Requiring S06 to force a caller-workspace parameter onto an internal
investigation renderer invents a customer access-control surface that S05
explicitly did not ship. If a later package adds HTTP investigate/export, that
package must add membership + workspace checks then. It is not an honest Wave 1
blocker against the Closed internal foundation.

Correct Wave 1 Incident isolation claim:

1. Incidents are workspace-bound.
2. Open/attach cannot mix A/B evidence.
3. Investigation/export render only linked same-workspace events.
4. No customer HTTP investigate/export path exists to misuse.

### Recommended decision

**Planning correction**, then **PASS** under the corrected Wave 1 proof bar.

Corrected proof required (proposed):

> Workspace-attributed incidents refuse mixed-workspace evidence; investigation
> and internal export assemble only linked same-workspace events; no customer
> HTTP investigate/export surface exists in Wave 1. Caller-workspace HTTP
> scoping is required when a customer path is later introduced.

Existing mixed-evidence Runtime + Regression evidence, plus investigation
composition from linked events only, supports **PASS** after correction.

### Required follow-up (if approved)

1. Reword matrix / contract proof required and pass reason.
2. Mark the row **PASS**; name the mixed-evidence negative regression.
3. Record a forward constraint: any future Incident HTTP must require caller
   membership for the incident workspace before investigate/export.
4. Do **not** open an S05 redesign slice under S06 unless Product Owner rejects
   the internal-foundation stance.

---

## Row 3 — Security Platform tenancy

### Current planning

| Field            | Current text                                             |
| ---------------- | -------------------------------------------------------- |
| Owner            | Platform                                                 |
| Proof required   | Abuse/deny/hardening paths do not bypass workspace scope |
| Status           | **PENDING — blocks Close**                               |
| Honest reason    | No workspace-tenancy product-path regression             |
| Partial evidence | None sufficient for PASS                                 |

### Master Plan intent

- OWASP / Security Platform defaults are Wave 1 (S04).
- Workspace isolation (SEC-11) is a fail-closed tenancy proof across products
  that hold or return tenant data.
- S04 Close already treated isolation **suite** as S06 and object/tenancy
  authorization as owned by S01–S03 / membership.

### Actual implementation

- Security Platform owns headers, CSRF consistency, quotas, request
  normalization, anti-enumeration shape, open-redirect controls, and related
  hardening.
- The `security-platform` module does not own workspace records, membership,
  or tenant data reads/writes (no workspace tenancy SoT).
- Workspace scope continues to be enforced by Workspace / Auth / Vault / Audit
  owners — several of which already have matrix **PASS** rows.

### Reasoning

Workspace Isolation applies to surfaces that can disclose or mutate another
workspace’s data. Security Platform does not own tenant state. Asking S06 for a
Platform “tenancy bypass” product-path is the wrong proof shape:

- If Platform middleware somehow disabled membership checks, that would appear
  as failures on membership / Vault / Timeline rows already required to PASS.
- Platform’s own correct proofs are S04 Close evidence (hardening,
  anti-enumeration, deny shape), not a duplicate tenancy suite.

This matches the Connection Management precedent: when a named matrix row is
not a Wave 1 tenant-data product, the honest status is **NOT APPLICABLE** with
a named reason — not endless PENDING.

### Recommended decision

**NOT APPLICABLE**

Reason (proposed):

> Security Platform does not own tenant state or workspace-scoped product data.
> Tenancy is owned and proved by Authentication, Session, Vault, Audit,
> Timeline, and Workspace membership rows. Platform hardening remains evidenced
> by V3-S04 Close; it is not a peer workspace-data isolation surface.

### Required follow-up (if approved)

1. Mark the row **NOT APPLICABLE** with the reason above.
2. Keep S04 Close artifacts as the Platform security evidence reference.
3. Do **not** invent Platform tenancy state or a fake tenancy regression under
   S06.

---

## Row 4 — Endpoint inventory (“Any new Wave 1 endpoint”)

### Current planning

| Field            | Current text                                     |
| ---------------- | ------------------------------------------------ |
| Owner            | Owning package of endpoint                       |
| Proof required   | Every discovered route proves A ↛ B before Close |
| Status           | **PENDING — blocks Close**                       |
| Honest reason    | Route-by-route inventory is not closed           |
| Partial evidence | Existing surface regressions only                |

Implementation Package also says newly noticed Wave 1 routes must be added to
the matrix before Close.

### Master Plan intent

- SEC-11 requires fail-closed isolation of workspace data, not a separate
  “endpoint inventory” product.
- Wave 1 Certification Audit independently reviews S01–S06 against Master Plan,
  Product Principles, Security Default Policy, Verification Standard, and
  ownership boundaries.

### Actual implementation

- Named Wave 1 security surfaces already have matrix rows (Auth, Session,
  People/RBAC, Vault, Audit, Timeline, Incident, membership, Connection
  Management boundary).
- Isolation regressions exist for those owners.
- No closed written inventory maps every Wave 1 HTTP route to an owning matrix
  row / N/A reason.

### Reasoning

Complete endpoint inventory is **evidence completeness**, not a tenant-data
product surface. Treating it as a peer isolation row created a permanent
PENDING gate even after all real Wave 1 security products were proved or
honestly excluded.

Correct placement:

- S06 Close preparation should include a route→owner mapping artifact so no
  Wave 1 security route is orphaned.
- Independent Certification Audit may re-check that mapping.
- The matrix should not keep a meta-inventory row PENDING as if it were Vault
  or Timeline.

### Recommended decision

**Planning correction**, then either:

- **PASS** as Close evidence once the route→owner inventory artifact exists and
  shows every Wave 1 security route maps to an already **PASS** / **NOT
  APPLICABLE** owner with no orphan tenant-data route; or
- **NOT APPLICABLE** as a matrix _product_ row, with the inventory retained as
  a Certification preparation artifact outside the product-surface table.

**Preferred:** keep a single matrix completeness row, but reclassify it as
**evidence artifact**, not product tenancy. After the written inventory is
accepted, mark **PASS**.

This is documentation / Close evidence work, not a new security product.

### Required follow-up (if approved)

1. Produce `wave-1-endpoint-isolation-inventory.md` (or equivalent) listing
   Wave 1 security-relevant routes → owning matrix row / N/A reason.
2. Confirm no orphan tenant-data route remains outside PASS/N/A owners.
3. Mark the inventory row **PASS** (preferred) or remove it from the product
   surface table and attach it to Certification readiness only.
4. Do **not** invent new endpoints or redesign owners to “fill” the inventory.

---

## Decision Summary

### PASS rows (after approved planning corrections / evidence)

| Row                             | Path to PASS                                                                                                           | New product implementation?   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| RBAC / People / role assignment | Correct proof bar to Closed S02 Identity-global People + role≠membership; use existing S06-b evidence                  | **No**                        |
| Incident / investigation        | Correct proof bar to Closed S05 internal foundation + mixed-evidence / same-workspace assembly; use existing negatives | **No**                        |
| Endpoint inventory (preferred)  | Produce route→owner Close evidence artifact; confirm no orphan tenant-data routes                                      | **No** (docs / evidence only) |

### NOT APPLICABLE rows

| Row                                   | Reason                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Security Platform tenancy             | Platform does not own tenant state; tenancy proved by other owners; S04 Close remains Platform evidence |
| Future Connection Management boundary | Already **NOT APPLICABLE** (Wave 2) — unchanged                                                         |

### Planning corrections

1. **People:** stop requiring workspace-scoped People in Wave 1; prove
   Identity-global Admin People + role≠membership instead; teammate People =
   Wave 9.
2. **Incident:** stop requiring caller-workspace scoping on internal
   investigate/export with no HTTP caller; prove workspace-bound open/evidence
   and same-workspace assembly; defer caller scoping to future HTTP.
3. **Endpoint inventory:** reclassify as Close / Certification evidence
   completeness, not a tenant-data product surface; complete written
   route→owner mapping.
4. **Security Platform:** reclassify as **NOT APPLICABLE** for workspace-data
   isolation rather than PENDING forever.

### Remaining implementation work (if any)

| Work                                                                        | Type                         | Required for Close after PO approval?                                                                          |
| --------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Matrix / contract / readiness status rewrites reflecting approved decisions | Governance / evidence update | **Yes**                                                                                                        |
| Wave 1 route→owner isolation inventory artifact                             | Documentation evidence       | **Yes** (for preferred inventory PASS)                                                                         |
| People workspace-scoped API                                                 | Product implementation       | **No** (rejected as Wave 1 requirement)                                                                        |
| Incident caller-workspace HTTP controls                                     | Product implementation       | **No** for Closed internal foundation; **Yes** only if PO rejects correction and demands HTTP-era controls now |
| Platform tenancy product / fake bypass suite                                | Product implementation       | **No**                                                                                                         |

### Does S06 still require another implementation slice?

**No product-implementation slice** is required if Product Owner accepts the
recommendations above.

A **narrow evidence / governance slice** is still required after approval to:

1. apply the approved PASS / NOT APPLICABLE statuses,
2. reword corrected proof bars,
3. publish the endpoint inventory artifact,
4. refresh Close / Certification readiness documents.

That slice must not redesign Auth, Identity, Vault, Audit, or Platform.

### Can S06 Close after these decisions?

**Yes — CLOSED 2026-08-17.** Product Owner approved these resolutions; S06-f
applied the PASS / NOT APPLICABLE statuses; Close is recorded in
[`v3-s06-close-report.md`](./v3-s06-close-report.md).

### Can Wave 1 Certification Audit begin?

**Yes — after Product Owner commissions it.** V3-S06 is CLOSED. The independent
Wave 1 Certification Audit may begin when Product Owner approves opening it. It
has **NOT started**. Wave 1 COMPLETE remains unclaimed until that audit is
accepted.

---

## Product Owner approval record

| Field                                  | Value                                                               |
| -------------------------------------- | ------------------------------------------------------------------- |
| Resolution approved                    | **Yes** — 2026-08-17                                                |
| S06-f evidence alignment               | **Approved**                                                        |
| V3-S06 Close                           | **Recorded** — [`v3-s06-close-report.md`](./v3-s06-close-report.md) |
| Independent Wave 1 Certification Audit | **Not started** — awaits Product Owner commission                   |

---

## STOP

This resolution is approved and applied. Do not reopen S06 implementation.
Do not claim Wave 1 COMPLETE or open the independent Certification Audit without
Product Owner commission.
