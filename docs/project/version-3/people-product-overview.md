# People Overview

**Document:** Version 3 People Overview
**Date:** 2026-08-16
**Status:** Product-facing record of S02-d / S02-e
**Product:** People
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

---

## Purpose

People shows who can use the product and lets an Administrator assign a role without asking an engineer.

- The operator can: open People, see names and current roles, change another person’s role to Reader, Researcher, Trader, or Administrator, try to change their own role, and see a clear refusal when that is not allowed.
- The operator cannot (yet): invite a teammate, disable a person, share a workspace, or look up a security history of role changes.
- Why it exists, in business language: the right people should have the least privilege they need, using the product — not a private tool or a database edit.

---

## Customer Journey

```text
Sign in
  ↓
Open People
  ↓
See people and current roles
  ↓
Choose a role for someone else and confirm
  ↓
The new role applies immediately
  ↓
Try to change your own role
  ↓
Denied
  ↓
A clear explanation is shown
```

### Sign in

The operator signs in as usual. People lives in the same signed-in shell as Sign-in sessions and Password.

### Open People

Under Administration, open **People**. An Administrator sees the directory. Anyone else sees that People is unavailable — not an empty list that looks like “no one is here yet.”

### See people and current roles

Each row is a person: name, email, and current role. The signed-in Administrator is labeled **You**.

### Choose a role for someone else and confirm

The product offers only the four roles. It asks for confirmation before it changes anything. It will not let the last active Administrator be removed.

### The new role applies immediately

After a successful change, the list shows the new role. That person keeps their sign-in. Their next action uses the new role.

### Try to change your own role

The signed-in row still has the role control. The Administrator can choose a different role and confirm, the same way as for anyone else.

### Denied

The product does not apply the change. The signed-in Administrator keeps their current role.

### A clear explanation is shown

The page explains that you cannot change your own role. This is not a silent failure and not a fake success.

---

## Customer Experience

- Happy path (plain language): open People, find a person, choose a lower or higher role, confirm, see it stick.
- If something fails, what they see (honest; no fake success): People unavailable if they are not an Administrator; a short error if the last Administrator would be removed; a short error after they try to change themselves; a short error if that person is no longer listed.
- What they never have to do (SSH, config files, pasting secrets into notes): they do not use a private API tool or edit a database to grant a role.
- Paper remains the default, or **NOT APPLICABLE** with reason: Paper remains the default. This page does not start trading.

---

## Customer Never Sees

What this product must not be mistaken for. Name the later product or Master Plan deferral.

- Not shown in the UI: invite teammate, disable person, billing, API keys, vault, connection setup, live trading.
- Not offered as a button, page, or implied “connected / live / recovered” state: live trading, exchange keys, vault, or a team that shares a workspace.
- Owner later (product name, not a file path): teammate invitations; Credential Vault; Connection Management; live trading; a security history of role changes.

Do not list internal types, routes, or table names here. List things an operator might look for and not find.

---

## Security Guarantees

What the operator can trust, stated as outcomes they can understand.

- What stays private (passwords, keys, messages — in product words): passwords and sign-in secrets are not shown on People.
- What stops working when it should (ended sign-in, disconnected venue, revoked access): a person who is no longer an Administrator cannot keep using People. You cannot take away your own Administrator role from this page.
- What the product will not pretend (no fake live, no fake sent email, no fake connected): unavailable is unavailable. An empty-looking list is not used to hide a refusal.
- What this overview does **not** claim (later security products): a searchable security history, extra sign-in factors, vault, or live trading.

No control catalogs. No STRIDE tables. Those live in Security Review.

---

## What's Next

What this overview does not unlock. One later customer capability, in plain language.

- Next thing the operator will be able to do: after this RBAC package is Closed, the next security package is storing venue secrets in a vault. A searchable security history of role changes is still later.
- Still not offered: inviting teammates, disabling people, extra sign-in factors.
- Live trading, vault, billing, or other later products named only if the operator might assume they are included: live trading, vault, billing, and connection setup are not included.

---

**STOP.** Wait for Product Owner review before V3-S02 Package Close.

**End of Version 3 People Overview.**
