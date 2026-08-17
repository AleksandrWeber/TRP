# Workspace Isolation Overview

**Document:** Version 3 Workspace Isolation Overview
**Date:** 2026-08-17
**Status:** V3-S06 **CLOSED**. Independent Wave 1 Certification Audit not started.
**Product:** Workspace Isolation Hardening (Isolation Proof Product)
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator and a Product Owner should understand. It is not an internal design note.

---

## Purpose

Workspace Isolation is the Wave 1 proof that **Workspace A never obtains data belonging to Workspace B**.

It is not a new Administration page. It is not a redesign of Authentication, Roles, Vault, Audit, or the Security Platform. Those products already own their isolation rules. S06 **proves** the rules hold — across the whole Security Foundation — with evidence strong enough to claim Wave 1 exit.

```text
Isolation is proved, not assumed.
Prior package Close is not isolation credit.
Wave 1 is not complete until this proof passes.
```

- The operator / business can (after this package Closes): trust that Wave 1 security products keep each workspace’s identity, roles, secrets, and security history separated from every other workspace — verified by an isolation suite and a Wave 1 Certification Audit.
- The operator cannot (yet): open Connection Management, connect Binance, send Telegram or email as a product path, trade live, or treat isolation proof as monitoring or billing.
- Why it exists, in business language: a platform that will soon hold customer credentials and later capital-adjacent power must prove tenancy before Connections open. Assumption is not enough.
- If something is refused across workspaces: the product fails closed with an honest deny. It does not show another tenant’s empty list as if the caller belonged there.

---

## Customer Journey (what “proof” means in product language)

```text
Two workspaces exist (A and B)
  ↓
An authorized person works only in A
  ↓
They cannot see B’s people, sessions, secrets, or security history
  ↓
Every Wave 1 security surface is checked the same way
  ↓
Evidence is recorded; regressions stay automated
  ↓
Wave 1 Certification Audit reviews S01–S06
  ↓
Only then: Wave 1 COMPLETE → Wave 2 may open
```

### Two workspaces exist

Isolation is meaningless with one tenant. Proof uses distinct workspaces with distinct data.

### Work only in A

The person is a real signed-in operator of Workspace A — not a host engineer with SQL.

### Cannot see B

Sessions, People, Vault metadata, Audit Timeline, Incidents, and related Wave 1 surfaces never disclose Workspace B’s facts to A.

### Every Wave 1 security surface

Authentication, Authorization, Vault, Security Audit, Timeline, Incidents, Security Platform boundaries, and the **future Connection Management boundary** (deny / not-yet-available — not the Connections product itself).

### Evidence and regressions

Every isolation claim has a named evidence type:

| Evidence       | What it proves                                                  |
| -------------- | --------------------------------------------------------------- |
| **Static**     | Production boundary code does not allow the foreign access path |
| **Runtime**    | A real test attempts the foreign access and receives a denial   |
| **Regression** | The denied scenario stays in ordinary automated tests           |

The proof is visible rather than implied:

```text
Workspace A
  ↓
attempt
  ↓
Workspace B
  ↓
Denied
  ↓
Regression test
```

S06-a establishes that foundation with negative proofs. Later S06 slices must
complete the entire Isolation Matrix before any Wave 1 exit claim.

### Negative proof

Isolation is not demonstrated only by showing that an allowed Workspace A action
works. It is demonstrated by attempting actions that must fail:

- A Reader reading Vault material
- A Trader in Workspace A opening Workspace B Timeline
- A caller substituting Workspace B’s id
- An incident in A linking Audit evidence from B
- A session issued to B being resolved for A

S06-a adds these as automated negative-proof foundation scenarios. It does not
yet state that each product is fully isolation-proved for S06 Close.

### Completeness and ownership

S06 reports a clear state for every surface:

| Status             | Meaning                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **PASS**           | The current Wave 1 boundary has Static, Runtime, and Regression evidence.                |
| **NOT APPLICABLE** | The product does not exist in Wave 1; this is an honest exclusion, not unfinished proof. |

After S06-d, Authentication / Session, Vault, Security Audit store, Timeline,
and Workspace membership
boundaries are **PASS**. Every PASS names an owner, a reason, Static/Runtime/
Regression evidence, and at least one Workspace A→B negative regression:

- **Authentication / Session:** owner-bound session resolution and
  caller-scoped list/revoke deny cross-user session binding and session control.
- **Vault:** `VaultAccessControl` checks membership and C8 permission before
  every lifecycle operation; a Workspace A operator cannot list, read, unwrap,
  store, replace, revoke, or delete Workspace B secrets.
- **Vault → Audit → Timeline:** Vault lifecycle events retain their workspace
  attribution through immutable Audit storage; an A timeline contains no B
  lifecycle facts, even when supplied with a B cursor. The Timeline controller
  denies an A operator before it reads B.
- **Workspace membership:** `WorkspaceAccessService` checks membership before
  resolving a caller-supplied workspace ID; A→B substitution fails closed.

The approved Product Owner Resolution completes the remaining evidence
alignment:

- **RBAC / People:** People is the approved S02 Identity-global Admin
  projection. Role assignment does not create Workspace membership; the
  `role ≠ membership` regression is the Wave 1 isolation proof. Workspace-scoped
  teammate People remains Wave 9.
- **Incident / investigation:** Incidents are workspace-bound and reject mixed
  evidence. Investigation/export are internal-only foundations that assemble
  linked same-workspace events; no customer HTTP caller exists in Wave 1.
- **Security Platform:** **NOT APPLICABLE** as a tenant-data row. Platform owns
  hardening, not tenant state; V3-S04 Close is its evidence.
- **Route ownership inventory:** **PASS** as Close evidence. Every Wave 1
  security-relevant route maps to an owner and a PASS/N/A matrix row in
  [`wave-1-security-route-ownership-inventory.md`](./wave-1-security-route-ownership-inventory.md).

Future Connection Management remains **NOT APPLICABLE** because it is Wave 2
and has no Wave 1 product path.

### S06-e Close / certification readiness

S06 Close is recorded in [`v3-s06-close-report.md`](./v3-s06-close-report.md).
Every matrix row is PASS or NOT APPLICABLE, so the matrix no longer blocks the
independent Wave 1 Certification Audit. That audit has not started, and Wave 1
COMPLETE remains unclaimed.

The readiness index is
[`wave-1-certification-readiness.md`](./wave-1-certification-readiness.md).
It records PASS evidence, explicit NOT APPLICABLE reasons, and the required
independent-audit sequence without changing any product owner or architecture.

The owner remains clear: Authentication owns sessions, Identity owns RBAC /
People, Vault owns secrets, Audit owns Timeline and Incidents, and Workspace /
Identity owns membership. S06 verifies these boundaries without taking them
over.

### Certification before Wave 1 COMPLETE

S06 Close alone is not the final word. An independent **Wave 1 Certification Audit** must confirm S01–S06 against the Master Plan, Product Principles, Security Default Policy, and Security Verification Standard. Only then may Product Owner declare Wave 1 COMPLETE.

---

## Customer Experience

- Happy path (plain language): the business can say “workspaces are isolated” because tests and review proved it — not because a slide said so.
- If something fails, what they see (honest; no fake success): cross-workspace access is denied; the product does not pretend Connections or live trading are included.
- What they never have to do: trust tribal knowledge, accept “we think membership works,” or wait until Binance keys exist to discover a tenancy bug.
- Paper remains the default: **Yes.** Isolation proof does not start live trading and does not connect a venue.

---

## What this product is careful about (isolation meaning, in plain language)

### Critical for security

A stolen or curious session in Workspace A must not become a window into Workspace B’s secrets, people, or security history.

### Critical for financial integrity (before live trading exists)

Credentials and privilege that later enable money must stay tenant-bound. Cross-workspace secret or role leakage would poison every later capital control.

### Critical for user trust

Operators must believe their workspace is theirs. Silent cross-tenant visibility destroys that trust even before live trading exists.

### Must not be claimed without evidence

“Membership checks exist” from earlier packages is necessary but not sufficient. S06 demands positive scope, negative cross-tenant, and fail-closed proof for every matrix row.

### How proof is found

Isolation Matrix → Isolation Suite → Regression Suite → Wave 1 Exit Checklist → Wave 1 Certification Audit.

---

## What this is not

- Not Connection Management
- Not Exchange integrations
- Not Live Trading
- Not Monitoring / Grafana
- Not Billing
- Not Wave 2
- Not a new bounded context
- Not ownership transfer away from Auth, Identity, Vault, or Audit
- Not Wave 9 multi-team SaaS isolation (remainder of SEC-11)

---

## Wave 1 place (honest)

| Already closed                                                                        | This package                        | After honest Wave 1 exit                                        |
| ------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| S01 Auth · S02 RBAC · S03 Vault Platform · S04 Security Platform · S05 Security Audit | S06 Isolation proof + exit evidence | Connection Management (Wave 2) — only after Certification Audit |

**STOP.** Planning only. Product Owner review required before V3-S06 implementation. Wave 1 Exit is **not** claimed.
