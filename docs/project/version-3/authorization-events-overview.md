# Authorization Events Overview

**Document:** Version 3 Authorization Events Overview
**Date:** 2026-08-16
**Status:** Product-facing record of S02-e
**Product:** Authorization Events
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

---

## Purpose

When someone is allowed or refused a role change, the product keeps a record of that decision. The record exists so role changes can be explained later. Operators do not open a history page in this release.

- The operator can: change another person’s role in People and trust that the change is recorded; try to change their own role and see a clear refusal.
- The operator cannot (yet): search a security history, export an audit trail, or see those records on screen.
- Why it exists, in business language: important access decisions should not vanish. Who changed a role, whose role changed, and whether the change was refused should be attributable.

---

## Customer Journey

```text
Sign in as Administrator
  ↓
Open People
  ↓
Change another person’s role and confirm
  ↓
The new role applies; the change is recorded
  ↓
Someone without permission tries a role change
  ↓
They are refused; the refusal is recorded
  ↓
The Administrator tries to change their own role
  ↓
Denied
  ↓
A clear explanation is shown
```

### Sign in as Administrator

The operator uses the usual sign-in. Nothing new is added to login.

### Open People

People remains under Administration. It is still the place to see who can use the product.

### Change another person’s role and confirm

The Administrator chooses Reader, Researcher, Trader, or Administrator for someone else, confirms, and sees the new role. The product records who made the change, whose role changed, the previous role, and the new role. Passwords and sign-in secrets are never part of that record.

### The new role applies; the change is recorded

The other person keeps their sign-in. Their next action uses the new role. The record is kept for later security history. It is not shown as a new page today.

### Someone without permission tries a role change

A Reader, Researcher, or Trader who tries to change roles is refused. People stays unavailable to them. That refusal is recorded.

### The Administrator tries to change their own role

The signed-in row is still labeled **You**. The Administrator can choose a different role and confirm — the same steps as for anyone else.

### Denied

The product does not apply the change. The signed-in Administrator keeps their current role.

### A clear explanation is shown

The page explains that you cannot change your own role. The refusal is recorded. This is not a silent failure and not a fake success.

---

## Customer Experience

- Happy path (plain language): an Administrator changes someone else’s role in People; it sticks; the product remembers who did it.
- If something fails, what they see (honest; no fake success): a non-Administrator still sees People unavailable; last Administrator cannot be removed; changing your own role is refused with a short explanation on the page.
- What they never have to do (SSH, config files, pasting secrets into notes): they do not inspect logs, edit a database, or open a hidden audit tool to complete a role change.
- Paper remains the default, or **NOT APPLICABLE** with reason: Paper remains the default. Recording a role decision does not start trading.

---

## Customer Never Sees

What this product must not be mistaken for. Name the later product or Master Plan deferral.

- Not shown in the UI: a searchable security history, an events console, invite teammate, vault, connection setup, billing, API keys, live trading.
- Not offered as a button, page, or implied “connected / live / recovered” state: “view audit log,” live trading, vault, or a shared workspace team.
- Owner later (product name, not a file path): security history / audit product; Credential Vault; Connection Management; live trading; teammate invitations.

Do not list internal types, routes, or table names here. List things an operator might look for and not find.

---

## Security Guarantees

What the operator can trust, stated as outcomes they can understand.

- What stays private (passwords, keys, messages — in product words): passwords, sign-in secrets, and recovery messages are not written into role-change records.
- What stops working when it should (ended sign-in, disconnected venue, revoked access): a person who is not an Administrator cannot change roles. You cannot take away your own Administrator role. Assigning a role does not give someone another person’s workspace.
- What the product will not pretend (no fake live, no fake sent email, no fake connected): a refused role change is refused on screen. Administrator is not a skip for Gate or Risk.
- What this overview does **not** claim (later security products): a customer-visible audit product, extra sign-in factors, vault, or live trading.

No control catalogs. No STRIDE tables. Those live in Security Review.

---

## What's Next

What this overview does not unlock. One later customer capability, in plain language.

- Next thing the operator will be able to do: nothing in this slice starts the next package. After this RBAC package is Closed, the next package is storing venue secrets in a vault — that is a later product, not this one.
- Still not offered: searching a security history, inviting teammates, disabling people, extra sign-in factors.
- Live trading, vault, billing, or other later products named only if the operator might assume they are included: live trading, vault, billing, and connection setup are not included.

---

**STOP.** Wait for Product Owner review before V3-S02 Package Close. Do not begin V3-S03.

**End of Version 3 Authorization Events Overview.**
