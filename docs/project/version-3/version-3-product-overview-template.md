# Version 3 Product Overview Template

**Document:** Version 3 Product Overview Template  
**Date:** 2026-08-16  
**Status:** Binding customer-language standard for major Version 3 products  
**Authority:** Subordinate to [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Style example (do not rewrite):** [`session-lifecycle-overview.md`](./session-lifecycle-overview.md)  
**Nature:** Template. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision. Not an architecture note.

Copy this file for each major customer product. Replace placeholders. Do not delete sections. If a section does not apply, write **NOT APPLICABLE**, name the later product or Master Plan deferral, and stop.

Write for operators. Describe what they do and see in the product. Do not name APIs, tables, modules, cookies, tokens, hashes, or bounded contexts unless the operator already sees that word on screen.

The Session Lifecycle Overview is **accepted** and is **not** rewritten to this template.

---

## How to use this template

1. Name the customer product (not a slice ID in the title).
2. Save as `docs/project/version-3/<product>-overview.md` (example: `credential-vault-overview.md`).
3. Fill every required section in operator language.
4. Keep OUT OF Scope honest in **Customer Never Sees** and **What's Next**.
5. Do not use this file to start implementation.

Later overviews (when those products ship): Connection Management · Credential Vault · Notification Platform · Workspace · RBAC · Live Trading · Portfolio · Billing · other customer products named by the Master Plan.

---

## Header (required)

```text
# <Product name> Overview

Document: Version 3 <Product name> Overview
Date:
Status: Product-facing record of <package or slice>
Product:
Nature: Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.
```

This is what an ordinary operator experiences. It is not an internal design note.

---

## Purpose

What this product is for, in one short paragraph.

- The operator can:
- The operator cannot (yet), if anything is still later:
- Why it exists, in business language (no stack names):

---

## Customer Journey

The path the operator follows. Use a simple down-arrow list. Each line is something they do or something the product does for them — not a system component.

```text
<starting place>
  ↓
<next thing the operator does or notices>
  ↓
<next>
  ↓
<honest end: success, sign-out, or honest stop>
```

Then one short paragraph per step, titled with the same words as the list. Write what happens on screen and what the operator must do. Do not explain how the server stores it.

---

## Customer Experience

What it feels like to use, after the journey steps.

- Happy path (plain language):
- If something fails, what they see (honest; no fake success):
- What they never have to do (SSH, config files, pasting secrets into notes):
- Paper remains the default, or **NOT APPLICABLE** with reason:

---

## Customer Never Sees

What this product must not be mistaken for. Name the later product or Master Plan deferral.

- Not shown in the UI:
- Not offered as a button, page, or implied “connected / live / recovered” state:
- Owner later (product name, not a file path):

Do not list internal types, routes, or table names here. List things an operator might look for and not find.

---

## Security Guarantees

What the operator can trust, stated as outcomes they can understand.

- What stays private (passwords, keys, messages — in product words):
- What stops working when it should (ended sign-in, disconnected venue, revoked access):
- What the product will not pretend (no fake live, no fake sent email, no fake connected):
- What this overview does **not** claim (later security products):

No control catalogs. No STRIDE tables. Those live in Security Review.

---

## What's Next

What this overview does not unlock. One later customer capability, in plain language.

- Next thing the operator will be able to do:
- Still not offered:
- Live trading, vault, billing, or other later products named only if the operator might assume they are included:

---

## Writing rules (do not copy into the overview)

- Operator language. No JWT, Prisma, slice IDs, or module names in the happy path.
- No API paths. No cookie or header names unless the operator sees them.
- No “bounded context”, “source of truth”, or “adapter” unless that word is on the screen.
- Secrets never appear in examples.
- Honest Product: unavailable is unavailable; later work is later.
- This template does not replace Product Review, Product Walkthrough, or Security Review.

---

**STOP.** Fill an overview only when that customer product exists. Wait for review before S01-d Session Management UI begins.

**End of Version 3 Product Overview Template.**
