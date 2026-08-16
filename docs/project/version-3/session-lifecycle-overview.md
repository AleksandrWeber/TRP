# Session Lifecycle Overview

**Document:** Version 3 Session Lifecycle Overview  
**Date:** 2026-08-16  
**Status:** Product-facing record of S01-c (accepted)  
**Package:** V3-S01 Authentication & Session  
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences after sign-in. It is not an internal design note.

S01-d (session list and revoke-other-device) is **not** described here. Password recovery is **not** described here.

---

```text
User
  ↓
Login
  ↓
Server Session
  ↓
Access Token
  ↓
Refresh Token
  ↓
Automatic Refresh
  ↓
Rotation
  ↓
Logout
  ↓
Session Revocation
  ↓
Expired Session
```

---

## User

An operator opens the product in the browser and is not signed in.

## Login

The operator enters email and password on Sign in.

If the credentials are valid, they enter the paper-first product. They do not manage tokens. They do not see session internals.

## Server Session

The product now has a living sign-in on the server.

That is what later lets the operator keep working — and what later lets that sign-in be ended.

## Access Token

The operator can use the product for a short time without typing the password again.

If this short permission is leftover or stolen, it cannot keep acting for hours. It runs out quickly.

The operator never stores this in a visible browser note or password field. It does not appear in the UI.

## Refresh Token

While the sign-in is still valid, the product can continue the session without asking for the password again.

This longer permission is not something the operator copies, pastes, or sees on screen.

## Automatic Refresh

If the short permission runs out while the operator is still working, the product continues the session in the background.

The operator keeps using the paper-first shell. They are not sent to Sign in just because a few minutes passed.

## Rotation

Each successful continue replaces the previous continue-permission.

An old leftover continue-permission must not keep working. If it is used again, that sign-in chain ends (see Product Walkthrough: refresh reused → session family revoked).

## Logout

The operator chooses Logout.

They return to Sign in. That sign-in can no longer open the product.

## Session Revocation

The server ends that sign-in.

Further use of that access or continue-permission fails. The operator must sign in again.

Seeing and ending _other_ devices is **S01-d**. This overview only records that a sign-in _can_ be ended.

## Expired Session

If the operator is away long enough that the sign-in is no longer valid, the product returns them to Sign in.

It does not pretend they are still in. It does not keep a silent leftover session.

---

## What the customer does not see

- Token names, hashes, or cookie flags in the UI
- Session ids, families, or server tables
- MFA, remember-me, or trusted devices
- A session list (S01-d)
- Password recovery (S01-e)

---

**STOP.** Wait for review before S01-d Session Management UI begins.

**End of Session Lifecycle Overview.**
